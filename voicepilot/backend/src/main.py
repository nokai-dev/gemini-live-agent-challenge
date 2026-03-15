"""Main FastAPI application for VoicePilot."""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import sys
import json
import os
from typing import Optional

# Configure logging
class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        return json.dumps(log_data)

# Setup logging
log_handler = logging.StreamHandler(sys.stdout)
log_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

logging.basicConfig(
    level=logging.INFO,
    handlers=[log_handler]
)
logger = logging.getLogger(__name__)

# Get environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", "8080"))
HOST = os.getenv("HOST", "0.0.0.0")

# Create FastAPI app
app = FastAPI(
    title="VoicePilot",
    description="AI-powered code editing via voice and screen capture",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    import time
    return {
        "status": "healthy",
        "service": "VoicePilot",
        "version": "1.0.0",
        "timestamp": time.time(),
        "environment": "production" if os.getenv("K_SERVICE") else "development",
        "features": {
            "gemini_api": bool(GEMINI_API_KEY),
            "voice_interaction": True,
            "screen_analysis": True
        }
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Cloud Run."""
    return {
        "ready": True,
        "checks": {
            "config_loaded": True,
            "gemini_configured": bool(GEMINI_API_KEY)
        }
    }

# WebSocket endpoint for voice sessions
@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time voice and screen sessions.
    
    This endpoint handles:
    - Bidirectional audio streaming
    - Screen capture analysis
    - Code modification commands
    """
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    try:
        while True:
            # Receive message from client
            message = await websocket.receive_json()
            
            if message.get("type") == "audio":
                # Process audio data
                logger.info("Received audio chunk")
                await websocket.send_json({
                    "type": "status",
                    "message": "Audio received"
                })
                
            elif message.get("type") == "screen":
                # Process screen capture
                logger.info("Received screen capture")
                await websocket.send_json({
                    "type": "status", 
                    "message": "Screen capture received"
                })
                
            elif message.get("type") == "command":
                # Process voice command
                command = message.get("data", "")
                logger.info(f"Received command: {command}")
                
                # Mock response for demo
                await websocket.send_json({
                    "type": "modification",
                    "component": "Button",
                    "action": "change_color",
                    "property": "backgroundColor",
                    "value": "#3B82F6",
                    "confidence": 0.95,
                    "explanation": f"Processing command: {command}"
                })
                
            elif message.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

# API endpoint for code modifications
@app.post("/api/modify")
async def modify_code(request: dict):
    """Apply code modifications based on voice commands."""
    logger.info(f"Code modification request: {request}")
    
    return {
        "success": True,
        "modification": {
            "file": request.get("file", "LandingPage.jsx"),
            "component": request.get("component", "Button"),
            "property": request.get("property", "backgroundColor"),
            "oldValue": "#6B7280",
            "newValue": request.get("value", "#3B82F6")
        }
    }

# Get current project state
@app.get("/api/project/state")
async def get_project_state():
    """Get current project state and available components."""
    return {
        "project": "demo-project",
        "files": ["LandingPage.jsx"],
        "components": [
            {"id": "hero-button", "name": "Primary Button", "type": "Button"},
            {"id": "hero-title", "name": "Hero Title", "type": "Heading"},
            {"id": "feature-card-1", "name": "Feature Card 1", "type": "Card"},
            {"id": "feature-card-2", "name": "Feature Card 2", "type": "Card"},
            {"id": "feature-card-3", "name": "Feature Card 3", "type": "Card"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info"
    )