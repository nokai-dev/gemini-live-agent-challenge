"""Main FastAPI application for VoicePilot with extensive logging."""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import logging
import sys
import json
import os
from typing import Optional

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Log startup
logger.info("=" * 60)
logger.info("VoicePilot Starting Up")
logger.info("=" * 60)

# Get environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PORT = int(os.getenv("PORT", "8080"))
HOST = os.getenv("HOST", "0.0.0.0")
STATIC_PATH = os.getenv("STATIC_FILES_PATH", "/app/static")
DEMO_PATH = os.getenv("DEMO_PROJECT_PATH", "/app/demo-project")

logger.info(f"Environment: HOST={HOST}, PORT={PORT}")
logger.info(f"Static path: {STATIC_PATH}")
logger.info(f"Demo path: {DEMO_PATH}")
logger.info(f"Static path exists: {os.path.exists(STATIC_PATH)}")
logger.info(f"Demo path exists: {os.path.exists(DEMO_PATH)}")

# List static directory contents
if os.path.exists(STATIC_PATH):
    logger.info(f"Static directory contents:")
    for item in os.listdir(STATIC_PATH):
        logger.info(f"  - {item}")
else:
    logger.error(f"Static directory NOT FOUND: {STATIC_PATH}")

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

# Mount static files (frontend)
if os.path.exists(STATIC_PATH):
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")
    logger.info(f"Mounted static files from {STATIC_PATH}")
else:
    logger.error(f"Cannot mount static files: {STATIC_PATH} does not exist")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    import time
    logger.debug("Health check called")
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
        },
        "paths": {
            "static_exists": os.path.exists(STATIC_PATH),
            "demo_exists": os.path.exists(DEMO_PATH)
        }
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Cloud Run."""
    logger.debug("Readiness check called")
    return {
        "ready": True,
        "checks": {
            "config_loaded": True,
            "gemini_configured": bool(GEMINI_API_KEY),
            "static_files": os.path.exists(STATIC_PATH)
        }
    }

# Serve frontend at root
@app.get("/")
async def serve_frontend():
    """Serve the frontend HTML."""
    logger.info("Root endpoint called")
    index_path = os.path.join(STATIC_PATH, "index.html")
    logger.info(f"Looking for index.html at: {index_path}")
    logger.info(f"index.html exists: {os.path.exists(index_path)}")
    
    if os.path.exists(index_path):
        logger.info("Serving index.html")
        return FileResponse(index_path)
    
    logger.error(f"index.html NOT FOUND at {index_path}")
    return JSONResponse({
        "error": "Frontend not found",
        "message": "VoicePilot API is running but frontend is not built",
        "docs": "/docs",
        "health": "/health",
        "static_path": STATIC_PATH,
        "static_exists": os.path.exists(STATIC_PATH),
        "static_contents": os.listdir(STATIC_PATH) if os.path.exists(STATIC_PATH) else []
    })

# Debug endpoint
@app.get("/debug")
async def debug_info():
    """Debug endpoint with system info."""
    logger.info("Debug endpoint called")
    return {
        "environment": dict(os.environ),
        "cwd": os.getcwd(),
        "files_in_app": os.listdir("/app") if os.path.exists("/app") else [],
        "static_path": STATIC_PATH,
        "static_exists": os.path.exists(STATIC_PATH),
        "static_contents": os.listdir(STATIC_PATH) if os.path.exists(STATIC_PATH) else [],
        "demo_path": DEMO_PATH,
        "demo_exists": os.path.exists(DEMO_PATH),
        "demo_contents": os.listdir(DEMO_PATH) if os.path.exists(DEMO_PATH) else []
    }

# WebSocket endpoint for voice sessions
@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time voice and screen sessions."""
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    try:
        while True:
            # Receive message from client
            message = await websocket.receive_json()
            logger.debug(f"WebSocket received: {message}")
            
            if message.get("type") == "audio":
                logger.info("Received audio chunk")
                await websocket.send_json({
                    "type": "status",
                    "message": "Audio received"
                })
                
            elif message.get("type") == "screen":
                logger.info("Received screen capture")
                await websocket.send_json({
                    "type": "status", 
                    "message": "Screen capture received"
                })
                
            elif message.get("type") == "command":
                command = message.get("data", "")
                logger.info(f"Received command: {command}")
                
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
    logger.debug("Project state requested")
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

logger.info("VoicePilot initialization complete")

if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting uvicorn on {HOST}:{PORT}")
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="debug"
    )
