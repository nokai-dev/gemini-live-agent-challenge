"""Main FastAPI application for FocusCompanion."""
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import logging

from .config import settings
from .api.websocket import handle_focus_session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="FocusCompanion",
    description="AI-powered focus management with Gemini Live API",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "FocusCompanion",
        "version": "0.1.0"
    }

# WebSocket endpoint for focus sessions
@app.websocket("/ws/focus")
async def focus_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time focus sessions.
    
    This endpoint handles:
    - Bidirectional audio streaming
    - Session management commands
    - Real-time communication with Gemini Live API
    """
    await handle_focus_session(websocket)

# Mount static files for frontend
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )