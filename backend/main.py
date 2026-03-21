"""Main FastAPI application for FocusCompanion."""
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import sys
import json
import time

from .config import settings
from .api.websocket import handle_focus_session


def validate_config() -> None:
    """Validate required configuration at startup. Fail fast if missing."""
    missing = []
    if not hasattr(settings, 'GEMINI_API_KEY') or not settings.GEMINI_API_KEY:
        missing.append("GEMINI_API_KEY")
    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifespan handler."""
    validate_config()
    logger.info("FocusCompanion starting up — config validated")
    yield
    logger.info("FocusCompanion shutting down")


# Setup logging
log_handler = logging.StreamHandler(sys.stdout)
if settings.LOG_FORMAT == "json":
    log_handler.setFormatter(JSONFormatter())
else:
    log_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    handlers=[log_handler]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="FocusCompanion",
    description="AI-powered focus management with Gemini Live API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
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
        "version": "0.1.0",
        "timestamp": time.time(),
        "environment": settings.ENVIRONMENT if hasattr(settings, 'ENVIRONMENT') else 'unknown',
        "features": {
            "gemini_api": bool(settings.GEMINI_API_KEY),
            "screen_analysis": True,
            "voice_interaction": True
        }
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/Cloud Run."""
    return {
        "ready": True,
        "checks": {
            "config_loaded": True,
            "gemini_configured": bool(settings.GEMINI_API_KEY)
        }
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