"""WebSocket endpoint for real-time voice sessions."""
import asyncio
import json
import base64
import uuid
import logging
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect

from ..services.gemini_live import GeminiLiveClient
from ..models.session import SessionManager, FocusSession, SessionState, FocusMode
from ..config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and their associated Gemini sessions."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.gemini_clients: Dict[str, GeminiLiveClient] = {}
        self.session_manager = SessionManager()
        
    async def connect(self, websocket: WebSocket) -> str:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        logger.info(f"New connection: {connection_id}")
        return connection_id
    
    def disconnect(self, connection_id: str):
        """Clean up a disconnected client."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        # Clean up Gemini client
        if connection_id in self.gemini_clients:
            client = self.gemini_clients[connection_id]
            asyncio.create_task(client.close())
            del self.gemini_clients[connection_id]
        
        logger.info(f"Disconnected: {connection_id}")
    
    async def send_message(self, connection_id: str, message: dict):
        """Send a message to a specific connection."""
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connections."""
        for connection_id in list(self.active_connections.keys()):
            await self.send_message(connection_id, message)


# Global connection manager
manager = ConnectionManager()


async def handle_focus_session(websocket: WebSocket):
    """Main WebSocket handler for focus sessions.
    
    This handles:
    - Client connection and session initialization
    - Audio streaming from browser to Gemini
    - Audio responses from Gemini to browser
    - Session commands (start, pause, resume, end)
    """
    connection_id = await manager.connect(websocket)
    gemini_client: Optional[GeminiLiveClient] = None
    current_session: Optional[FocusSession] = None
    
    # Queue for audio data from Gemini to browser
    audio_queue: asyncio.Queue = asyncio.Queue()
    
    async def gemini_audio_callback(audio_data: bytes):
        """Callback when Gemini sends audio."""
        await audio_queue.put({
            "type": "audio",
            "data": base64.b64encode(audio_data).decode("utf-8")
        })
    
    async def gemini_text_callback(text: str):
        """Callback when Gemini sends text."""
        await audio_queue.put({
            "type": "transcript",
            "text": text
        })
    
    async def send_to_browser():
        """Background task to send queued messages to browser."""
        try:
            while True:
                message = await audio_queue.get()
                await manager.send_message(connection_id, message)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in send_to_browser: {e}")
    
    # Start the sender task
    sender_task = asyncio.create_task(send_to_browser())
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "connect":
                # Initialize Gemini connection
                if not settings.GEMINI_API_KEY:
                    await manager.send_message(connection_id, {
                        "type": "error",
                        "message": "GEMINI_API_KEY not configured"
                    })
                    continue
                
                gemini_client = GeminiLiveClient(settings.GEMINI_API_KEY)
                gemini_client.set_audio_callback(gemini_audio_callback)
                gemini_client.set_text_callback(gemini_text_callback)
                
                # Connect to Gemini with system instruction
                system_instruction = """You are FocusCompanion, an AI focus coach that helps users maintain deep work sessions.
                
You communicate via voice in a warm, encouraging, but concise manner. You respect the user's time and attention.

Key behaviors:
- Keep responses brief (1-2 sentences usually)
- Users can interrupt you at any time - stop speaking immediately when they do
- Help users stay focused on their stated goal
- When a session starts, acknowledge it and encourage them
- If they say "pause", "stop", "break", or "done", acknowledge and help them transition
- Be supportive, never judgmental
- Use natural, conversational language with occasional filler words for realism

Current session context will be provided in your interactions."""
                
                success = await gemini_client.connect(system_instruction)
                
                if success:
                    manager.gemini_clients[connection_id] = gemini_client
                    await manager.send_message(connection_id, {
                        "type": "connected",
                        "message": "Connected to FocusCompanion"
                    })
                else:
                    await manager.send_message(connection_id, {
                        "type": "error",
                        "message": "Failed to connect to Gemini Live API"
                    })
            
            elif msg_type == "audio":
                # Forward audio to Gemini
                if gemini_client and gemini_client.is_connected:
                    audio_data = base64.b64decode(data["data"])
                    await gemini_client.send_audio(audio_data)
            
            elif msg_type == "start_session":
                # Start a new focus session
                duration = data.get("duration_minutes", 25)
                goal = data.get("goal", "")
                
                session_id = str(uuid.uuid4())
                current_session = manager.session_manager.create_session(
                    session_id=session_id,
                    user_id=connection_id,
                    duration_minutes=duration,
                    goal=goal
                )
                current_session.start()
                
                # Notify Gemini about the session
                if gemini_client and gemini_client.is_connected:
                    session_msg = f"Focus session started: {duration} minutes. Goal: {goal}" if goal else f"Focus session started: {duration} minutes."
                    await gemini_client.send_text(session_msg)
                
                await manager.send_message(connection_id, {
                    "type": "session_started",
                    "session": current_session.to_dict()
                })
            
            elif msg_type == "pause_session":
                if current_session:
                    current_session.pause()
                    if gemini_client and gemini_client.is_connected:
                        await gemini_client.send_text("User has paused the session.")
                    
                    await manager.send_message(connection_id, {
                        "type": "session_paused",
                        "session": current_session.to_dict()
                    })
            
            elif msg_type == "resume_session":
                if current_session:
                    current_session.resume()
                    if gemini_client and gemini_client.is_connected:
                        await gemini_client.send_text("User has resumed the session.")
                    
                    await manager.send_message(connection_id, {
                        "type": "session_resumed",
                        "session": current_session.to_dict()
                    })
            
            elif msg_type == "end_session":
                if current_session:
                    current_session.end()
                    if gemini_client and gemini_client.is_connected:
                        await gemini_client.send_text("User has ended the session.")
                    
                    await manager.send_message(connection_id, {
                        "type": "session_ended",
                        "session": current_session.to_dict()
                    })
                    current_session = None
            
            elif msg_type == "get_session_status":
                if current_session:
                    await manager.send_message(connection_id, {
                        "type": "session_status",
                        "session": current_session.to_dict()
                    })
                else:
                    await manager.send_message(connection_id, {
                        "type": "session_status",
                        "session": None
                    })
            
            elif msg_type == "text":
                # Forward text to Gemini
                if gemini_client and gemini_client.is_connected:
                    await gemini_client.send_text(data.get("text", ""))
            
            elif msg_type == "ping":
                await manager.send_message(connection_id, {"type": "pong"})
            
            else:
                logger.warning(f"Unknown message type: {msg_type}")
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket handler: {e}")
    finally:
        # Clean up
        sender_task.cancel()
        try:
            await sender_task
        except asyncio.CancelledError:
            pass
        
        if current_session:
            current_session.end()
        
        manager.disconnect(connection_id)