"""WebSocket endpoint for real-time voice sessions with screen analysis."""
import asyncio
import json
import base64
import uuid
import logging
import time
from typing import Dict, Optional
from fastapi import WebSocket, WebSocketDisconnect

from ..services.gemini_live import GeminiLiveClient
from ..services.vision_analyzer import VisionAnalyzer, FocusCoach, ScreenAnalysis, ActivityType
from ..services.interruption_detector import (
    InterruptionDetector, InterruptionEvent, InterruptionDecision,
    InterruptionType, InterruptionUrgency, InterruptionQueue
)
from ..models.session import SessionManager, FocusSession, SessionState, FocusMode
from ..config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections and their associated sessions."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.gemini_clients: Dict[str, GeminiLiveClient] = {}
        self.vision_analyzers: Dict[str, VisionAnalyzer] = {}
        self.focus_coaches: Dict[str, FocusCoach] = {}
        self.interruption_detectors: Dict[str, InterruptionDetector] = {}
        self.interruption_queues: Dict[str, InterruptionQueue] = {}
        self.session_manager = SessionManager()
        
        # Track last activity for inactivity detection
        self.last_activity: Dict[str, float] = {}
        
    async def connect(self, websocket: WebSocket) -> str:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        self.active_connections[connection_id] = websocket
        self.last_activity[connection_id] = time.time()
        logger.info(f"New connection: {connection_id}")
        return connection_id
    
    def disconnect(self, connection_id: str):
        """Clean up a disconnected client."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if connection_id in self.last_activity:
            del self.last_activity[connection_id]
        
        # Clean up Gemini client
        if connection_id in self.gemini_clients:
            client = self.gemini_clients[connection_id]
            asyncio.create_task(client.close())
            del self.gemini_clients[connection_id]
        
        # Clean up other services
        for service_dict in [
            self.vision_analyzers,
            self.focus_coaches,
            self.interruption_detectors,
            self.interruption_queues
        ]:
            if connection_id in service_dict:
                del service_dict[connection_id]
        
        logger.info(f"Disconnected: {connection_id}")
    
    def update_activity(self, connection_id: str):
        """Update last activity timestamp."""
        self.last_activity[connection_id] = time.time()
    
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
    """Main WebSocket handler for focus sessions with screen analysis.
    
    This handles:
    - Client connection and session initialization
    - Audio streaming from browser to Gemini
    - Audio responses from Gemini to browser
    - Screen capture analysis
    - Interruption detection and handling
    - Session commands (start, pause, resume, end)
    """
    connection_id = await manager.connect(websocket)
    
    # Initialize services
    gemini_client: Optional[GeminiLiveClient] = None
    vision_analyzer: Optional[VisionAnalyzer] = None
    focus_coach: Optional[FocusCoach] = None
    interruption_detector: Optional[InterruptionDetector] = None
    interruption_queue: Optional[InterruptionQueue] = None
    
    current_session: Optional[FocusSession] = None
    last_screen_analysis: Optional[ScreenAnalysis] = None
    last_interruption_time = 0
    
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
    
    async def process_screen_analysis(image_base64: str, current_goal: str):
        """Process screen capture and handle interruptions."""
        nonlocal last_screen_analysis, last_interruption_time
        
        try:
            if not vision_analyzer:
                return
            
            # Analyze screen
            analysis = await vision_analyzer.analyze_screen(
                image_base64=image_base64,
                current_goal=current_goal,
                previous_analysis=last_screen_analysis
            )
            
            last_screen_analysis = analysis
            
            # Check for interruptions
            if current_session and interruption_detector:
                session_duration = current_session.get_elapsed_seconds() / 60
                
                event = interruption_detector.analyze_screen_change(
                    current=analysis,
                    previous=last_screen_analysis if last_screen_analysis != analysis else None,
                    session_goal=current_goal,
                    session_duration_minutes=session_duration
                )
                
                if event:
                    # Decide how to handle interruption
                    time_since_last = time.time() - last_interruption_time
                    decision = interruption_detector.should_allow_interruption(
                        event=event,
                        current_focus_state=analysis.activity_type.value,
                        time_since_last_interruption=time_since_last
                    )
                    
                    if decision.should_interrupt:
                        # Send interruption to client
                        await manager.send_message(connection_id, {
                            "type": "interruption_alert",
                            "urgency": event.urgency.value,
                            "message": decision.message,
                            "event_type": event.event_type.value,
                            "metadata": event.metadata
                        })
                        
                        # Also send to Gemini for voice response
                        if gemini_client and gemini_client.is_connected:
                            await gemini_client.send_text(
                                f"[SYSTEM: {decision.message}]"
                            )
                        
                        last_interruption_time = time.time()
                        event.handled = True
                    else:
                        # Queue for later
                        if interruption_queue:
                            interruption_queue.add(event)
                
                # Generate coaching message if appropriate
                if focus_coach:
                    coaching = focus_coach.generate_coaching_message(
                        analysis=analysis,
                        session_goal=current_goal,
                        session_duration_minutes=session_duration
                    )
                    
                    if coaching and gemini_client and gemini_client.is_connected:
                        await manager.send_message(connection_id, {
                            "type": "focus_coaching",
                            "message": coaching
                        })
                        await gemini_client.send_text(f"[COACHING: {coaching}]")
            
            # Send analysis result to client
            await manager.send_message(connection_id, {
                "type": "screen_analysis",
                "analysis": {
                    "activity_type": analysis.activity_type.value,
                    "application": analysis.primary_app,
                    "category": analysis.application_category.value,
                    "description": analysis.description,
                    "is_off_task": analysis.is_off_task,
                    "confidence": analysis.confidence
                }
            })
            
        except Exception as e:
            logger.error(f"Error processing screen analysis: {e}")
    
    # Start the sender task
    sender_task = asyncio.create_task(send_to_browser())
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            # Update activity timestamp
            manager.update_activity(connection_id)
            
            if msg_type == "connect":
                # Initialize Gemini connection
                if not settings.GEMINI_API_KEY:
                    await manager.send_message(connection_id, {
                        "type": "error",
                        "message": "GEMINI_API_KEY not configured"
                    })
                    continue
                
                # Initialize services
                gemini_client = GeminiLiveClient(settings.GEMINI_API_KEY)
                vision_analyzer = VisionAnalyzer(settings.GEMINI_API_KEY)
                focus_coach = FocusCoach()
                interruption_detector = InterruptionDetector()
                interruption_queue = InterruptionQueue()
                
                # Store services
                manager.gemini_clients[connection_id] = gemini_client
                manager.vision_analyzers[connection_id] = vision_analyzer
                manager.focus_coaches[connection_id] = focus_coach
                manager.interruption_detectors[connection_id] = interruption_detector
                manager.interruption_queues[connection_id] = interruption_queue
                
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
- When you receive [SYSTEM: message], relay important information to the user
- When you receive [COACHING: message], provide gentle guidance

Current session context will be provided in your interactions."""
                
                success = await gemini_client.connect(system_instruction)
                
                if success:
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
            
            elif msg_type == "screen_analysis":
                # Process screen capture
                image_data = data.get("image_data", "")
                current_goal = data.get("current_goal", "")
                
                # Validate image data size (prevent DoS)
                if image_data:
                    try:
                        # Rough size check: base64 is ~4/3 of binary size
                        estimated_size = len(image_data) * 0.75
                        if estimated_size > settings.MAX_SCREEN_IMAGE_SIZE:
                            logger.warning(f"Screen image too large: {estimated_size / 1024 / 1024:.1f}MB")
                            await manager.send_message(connection_id, {
                                "type": "error",
                                "message": "Screen image too large. Please reduce quality."
                            })
                        else:
                            # Process asynchronously
                            asyncio.create_task(
                                process_screen_analysis(image_data, current_goal)
                            )
                    except Exception as e:
                        logger.error(f"Error validating screen data: {e}")
            
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
                    # Generate summary
                    if focus_coach:
                        elapsed = current_session.get_elapsed_seconds() / 60
                        summary = focus_coach.generate_session_summary(
                            productive_time_minutes=elapsed * 0.8,  # Estimate
                            distracted_time_minutes=elapsed * 0.2,
                            interruptions=len(current_session.interruptions)
                        )
                        
                        if gemini_client and gemini_client.is_connected:
                            await gemini_client.send_text(summary)
                    
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