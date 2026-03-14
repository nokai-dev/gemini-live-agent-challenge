"""
Echo-Chamber: Multi-Agent Crisis Simulation
FastAPI Backend with WebSocket for real-time communication
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
from pathlib import Path

from agents import CrisisOrchestrator
from models import CrisisState, AgentMessage, UserDecision

app = FastAPI(title="Echo-Chamber", version="1.0.0")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
orchestrator = CrisisOrchestrator()
connected_clients: List[WebSocket] = []


@app.get("/")
async def root():
    return {"status": "Echo-Chamber API running", "version": "1.0.0"}


@app.get("/api/state")
async def get_state():
    """Get current crisis state"""
    return orchestrator.get_state()


@app.post("/api/decision")
async def make_decision(decision: UserDecision):
    """CEO makes a decision - triggers agent responses"""
    result = await orchestrator.process_decision(decision)
    await broadcast_message({
        "type": "decision_processed",
        "data": result
    })
    return result


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    # Send initial state
    await websocket.send_json({
        "type": "init",
        "data": orchestrator.get_state()
    })
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "user_message":
                # User spoke - process through agents
                response = await orchestrator.process_user_input(
                    message.get("content", "")
                )
                await broadcast_message({
                    "type": "agent_responses",
                    "data": response
                })
            
            elif message.get("type") == "interrupt":
                # User interrupted - stop current audio
                await broadcast_message({
                    "type": "interrupt",
                    "data": {"timestamp": datetime.now().isoformat()}
                })
                
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


async def broadcast_message(message: dict):
    """Broadcast to all connected clients"""
    disconnected = []
    for client in connected_clients:
        try:
            await client.send_json(message)
        except:
            disconnected.append(client)
    
    for client in disconnected:
        if client in connected_clients:
            connected_clients.remove(client)


@app.post("/api/start")
async def start_simulation():
    """Start the crisis simulation"""
    await orchestrator.start_crisis()
    await broadcast_message({
        "type": "crisis_started",
        "data": orchestrator.get_state()
    })
    return {"status": "started"}


@app.post("/api/reset")
async def reset_simulation():
    """Reset to initial state"""
    orchestrator.reset()
    await broadcast_message({
        "type": "reset",
        "data": orchestrator.get_state()
    })
    return {"status": "reset"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
