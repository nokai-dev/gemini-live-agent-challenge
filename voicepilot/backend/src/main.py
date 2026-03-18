"""Main FastAPI application for VoicePilot with extensive logging."""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator
import logging
import sys
import json
import os
import time
import hashlib
from typing import Optional, Dict, List, Tuple
from functools import wraps

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

# Pydantic models for request validation
class CodeModificationRequest(BaseModel):
    """Request model for code modification API."""
    file: str = Field(default="LandingPage.jsx", min_length=1, max_length=255, pattern=r"^[a-zA-Z0-9_\-\.\s\/]+")
    component: str = Field(default="Button", min_length=1, max_length=100)
    property: str = Field(default="backgroundColor", min_length=1, max_length=100)
    value: str = Field(default="#3B82F6", min_length=1, max_length=1000)
    
    @validator('file')
    def validate_file_path(cls, v):
        """Validate file path to prevent directory traversal."""
        # Reject paths with traversal sequences
        if '..' in v or '~' in v or v.startswith('/') or v.startswith('\\'):
            raise ValueError('Invalid file path: directory traversal not allowed')
        # Reject null bytes
        if '\x00' in v:
            raise ValueError('Invalid file path: contains null bytes')
        return v
    
    @validator('component', 'property', 'value')
    def validate_no_xss(cls, v):
        """Basic XSS prevention."""
        # Check for script tags and other dangerous content
        dangerous_patterns = ['<script', 'javascript:', '<iframe', '<object', '<embed']
        for pattern in dangerous_patterns:
            if pattern.lower() in v.lower():
                raise ValueError(f'Invalid content: potential XSS detected')
        return v


class WebSocketCommand(BaseModel):
    """Request model for WebSocket commands."""
    type: str = Field(..., min_length=1, max_length=50)
    data: Optional[str] = Field(default=None, max_length=10000)


class AnalyzeRequest(BaseModel):
    """Request model for analyze endpoint."""
    screenshot: str = Field(..., min_length=1, max_length=10000000)  # Base64 limit
    audio: str = Field(default="", max_length=10000000)
    selection: Optional[dict] = None


class AnalyzeDemoRequest(BaseModel):
    """Request model for analyze demo endpoint."""
    demoType: str = Field(..., min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9\-]+$")


class AnalyzeApplyRequest(BaseModel):
    """Request model for apply changes endpoint."""
    filePath: str = Field(..., min_length=1, max_length=255, pattern=r"^[a-zA-Z0-9_\-\.\s\/]+")
    codeChange: str = Field(..., min_length=1, max_length=100000)
    
    @validator('filePath')
    def validate_file_path(cls, v):
        """Validate file path to prevent directory traversal."""
        if '..' in v or '~' in v or v.startswith('/') or v.startswith('\\'):
            raise ValueError('Invalid file path: directory traversal not allowed')
        return v


# Rate limiting implementation
class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = {}
        self.blocked: Dict[str, float] = {}
    
    def is_allowed(self, key: str) -> Tuple[bool, Optional[int]]:
        """Check if request is allowed. Returns (allowed, retry_after)."""
        now = time.time()
        
        # Check if client is blocked
        if key in self.blocked:
            if now < self.blocked[key]:
                return False, int(self.blocked[key] - now)
            else:
                del self.blocked[key]
        
        # Clean old requests
        if key in self.requests:
            self.requests[key] = [t for t in self.requests[key] if now - t < 60]
        else:
            self.requests[key] = []
        
        # Check limit
        if len(self.requests[key]) >= self.requests_per_minute:
            # Block for 60 seconds
            self.blocked[key] = now + 60
            return False, 60
        
        self.requests[key].append(now)
        return True, None
    
    def get_remaining(self, key: str) -> int:
        """Get remaining requests for this window."""
        now = time.time()
        if key not in self.requests:
            return self.requests_per_minute
        
        recent_requests = [t for t in self.requests[key] if now - t < 60]
        return max(0, self.requests_per_minute - len(recent_requests))


# Initialize rate limiter
rate_limiter = RateLimiter(requests_per_minute=100)


# Request size limit middleware
async def request_size_limit_middleware(request: Request, call_next):
    """Middleware to limit request body size."""
    content_length = request.headers.get('content-length')
    max_size = 10 * 1024 * 1024  # 10 MB
    
    if content_length and int(content_length) > max_size:
        return JSONResponse(
            status_code=413,
            content={"error": "Request entity too large", "max_size": max_size}
        )
    
    return await call_next(request)


# Rate limiting middleware
async def rate_limit_middleware(request: Request, call_next):
    """Middleware for rate limiting."""
    # Skip rate limiting for health checks
    if request.url.path in ['/health', '/ready', '/']:
        return await call_next(request)
    
    # Get client identifier (IP or API key if authenticated)
    client_ip = request.client.host if request.client else "unknown"
    
    allowed, retry_after = rate_limiter.is_allowed(client_ip)
    
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests", "retry_after": retry_after},
            headers={"Retry-After": str(retry_after)}
        )
    
    response = await call_next(request)
    
    # Add rate limit headers
    remaining = rate_limiter.get_remaining(client_ip)
    if hasattr(response, 'headers'):
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Limit"] = "100"
    
    return response


# Add middleware to app
app.add_middleware(type("RequestSizeMiddleware", (), {
    "dispatch": staticmethod(request_size_limit_middleware)
}))

app.add_middleware(type("RateLimitMiddleware", (), {
    "dispatch": staticmethod(rate_limit_middleware)
}))

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
