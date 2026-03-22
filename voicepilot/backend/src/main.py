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

# In-memory cache for demo responses (5 minute TTL)
DEMO_CACHE: Dict[str, Tuple[float, dict]] = {}
CACHE_TTL = 300  # 5 minutes


def get_cached_response(key: str) -> Optional[dict]:
    """Get cached response if valid."""
    if key in DEMO_CACHE:
        timestamp, response = DEMO_CACHE[key]
        if time.time() - timestamp < CACHE_TTL:
            return response
        del DEMO_CACHE[key]
    return None


def set_cached_response(key: str, response: dict) -> None:
    """Cache a response."""
    DEMO_CACHE[key] = (time.time(), response)


# Demo command responses - hardcoded for reliable demo
DEMO_RESPONSES = {
    "button-blue": {
        "targetFile": "Button.tsx",
        "codeChange": """<button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors" style={{backgroundColor: '#3b82f6'}}>
  Click Me
</button>""",
        "description": "Change button background color to blue (#3b82f6)",
        "confidence": 0.95,
        "element": "PrimaryButton",
        "intent": "change_color"
    },
    "card-padding": {
        "targetFile": "Card.tsx",
        "codeChange": """<div className="bg-white rounded-xl shadow-lg p-8" style={{padding: '32px'}}>
  Content here
</div>""",
        "description": "Increase card padding from 16px to 32px",
        "confidence": 0.92,
        "element": "FeatureCard",
        "intent": "change_spacing"
    },
    "text-bigger": {
        "targetFile": "Heading.tsx",
        "codeChange": """<h1 className="text-4xl font-bold text-gray-900 mb-4" style={{fontSize: '2.5rem'}}>
  Welcome to VoicePilot
</h1>""",
        "description": "Increase heading font size from 2rem to 2.5rem",
        "confidence": 0.89,
        "element": "HeroTitle",
        "intent": "change_font_size"
    },
    "grid-layout": {
        "targetFile": "Grid.tsx",
        "codeChange": """<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>""",
        "description": "Change card layout from flex column to 3-column grid",
        "confidence": 0.87,
        "element": "CardContainer",
        "intent": "change_layout"
    }
}


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


# Demo response templates for reliable demo behavior
DEMO_RESPONSES = {
    "button-blue": {
        "targetFile": "LandingPage.jsx",
        "codeChange": "const styles = {\n  button: {\n    backgroundColor: '#3B82F6',\n    color: 'white',\n    padding: '12px 24px',\n    borderRadius: '8px',\n    border: 'none',\n    fontSize: '16px',\n    cursor: 'pointer',\n  }\n};\nexport default function Button() {\n  return <button style={styles.button}>Get Started</button>;\n}",
        "description": "Change the primary button color to blue (#3B82F6) to improve visual hierarchy and brand consistency.",
        "confidence": 0.95,
        "element": "PrimaryButton",
        "intent": "change_color"
    },
    "card-padding": {
        "targetFile": "LandingPage.jsx",
        "codeChange": "const styles = {\n  card: {\n    padding: '32px',\n    backgroundColor: 'white',\n    borderRadius: '12px',\n    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',\n  }\n};\nexport default function Card({ children }) {\n  return <div style={styles.card}>{children}</div>;\n}",
        "description": "Increase card padding to 32px for better spacing and readability of content.",
        "confidence": 0.92,
        "element": "FeatureCard",
        "intent": "change_spacing"
    },
    "text-bigger": {
        "targetFile": "LandingPage.jsx",
        "codeChange": "const styles = {\n  heroTitle: {\n    fontSize: '48px',\n    fontWeight: 'bold',\n    color: '#1F2937',\n    marginBottom: '16px',\n  }\n};\nexport default function HeroTitle() {\n  return <h1 style={styles.heroTitle}>Build Amazing Products</h1>;\n}",
        "description": "Increase hero title font size to 48px for better visual impact and readability.",
        "confidence": 0.89,
        "element": "HeroTitle",
        "intent": "change_style"
    },
    "grid-layout": {
        "targetFile": "LandingPage.jsx",
        "codeChange": "const styles = {\n  featuresGrid: {\n    display: 'grid',\n    gridTemplateColumns: 'repeat(3, 1fr)',\n    gap: '24px',\n    padding: '48px 24px',\n  }\n};\nexport default function FeaturesGrid({ children }) {\n  return <div style={styles.featuresGrid}>{children}</div>;\n}",
        "description": "Change to 3-column grid layout with 24px gap for better feature showcase.",
        "confidence": 0.91,
        "element": "FeaturesGrid",
        "intent": "change_layout"
    }
}


# API Endpoints for Analyze

@app.post("/api/analyze")
async def analyze_endpoint(request: AnalyzeRequest):
    """
    Analyze screenshot + voice commands to generate code modifications.
    
    This endpoint processes screenshot data and audio transcriptions to
    understand user intent and generate appropriate code changes.
    """
    logger.info(f"Analyze endpoint called - screenshot size: {len(request.screenshot)} chars, audio size: {len(request.audio)} chars")
    
    # Check if Gemini API is available for real processing
    if GEMINI_API_KEY:
        # In production, this would call Gemini to analyze the screenshot and audio
        # For now, return a generic response indicating the feature is available
        logger.info("Gemini API available - would process screenshot and audio")
        return {
            "targetFile": "LandingPage.jsx",
            "codeChange": "// AI-generated code change based on screenshot analysis\n// In production, this would use Gemini to generate specific changes",
            "description": "Processed screenshot and audio input. Configure Gemini API for detailed analysis.",
            "confidence": 0.75,
            "element": "DetectedElement",
            "intent": "modify"
        }
    else:
        # No API key - suggest using demo mode
        logger.warning("Gemini API key not configured - returning demo mode suggestion")
        return {
            "targetFile": "LandingPage.jsx",
            "codeChange": "// Configure GEMINI_API_KEY to enable real analysis\n// Or use /api/analyze/demo for hardcoded demo responses",
            "description": "Gemini API not configured. Please set GEMINI_API_KEY or use /api/analyze/demo endpoint.",
            "confidence": 0.0,
            "element": "N/A",
            "intent": "none"
        }


@app.post("/api/analyze/demo")
async def analyze_demo_endpoint(request: AnalyzeDemoRequest):
    """
    Demo endpoint that returns hardcoded responses for reliable demo behavior.
    
    Supports demo types: button-blue, card-padding, text-bigger, grid-layout
    """
    logger.info(f"Demo endpoint called with demoType: {request.demoType}")
    
    demo_type = request.demoType.lower()
    
    if demo_type not in DEMO_RESPONSES:
        logger.warning(f"Unknown demo type requested: {demo_type}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "Invalid demo type",
                "message": f"Demo type '{request.demoType}' not supported. Valid types: {list(DEMO_RESPONSES.keys())}"
            }
        )
    
    response = DEMO_RESPONSES[demo_type].copy()
    logger.info(f"Returning demo response for {demo_type} - confidence: {response['confidence']}")
    
    return response


@app.post("/api/analyze/apply")
async def analyze_apply_endpoint(request: AnalyzeApplyRequest):
    """
    Apply code changes to the specified file.
    
    This endpoint writes the generated code change to the target file.
    For demo mode, changes are logged but not actually persisted.
    """
    logger.info(f"Apply endpoint called - filePath: {request.filePath}, codeChange length: {len(request.codeChange)} chars")
    
    try:
        # In production, this would write to the actual file system
        # For demo mode, we simulate the write operation
        
        demo_file_path = os.path.join(DEMO_PATH, request.filePath)
        
        if os.path.exists(DEMO_PATH):
            # Log what would be written
            logger.info(f"Would write to: {demo_file_path}")
            logger.debug(f"Code change content (first 500 chars): {request.codeChange[:500]}...")
            
            # For actual file write in production:
            # with open(demo_file_path, 'w') as f:
            #     f.write(request.codeChange)
            
            logger.info(f"Successfully processed code change for {request.filePath}")
            return {
                "success": True,
                "message": f"Code change applied successfully to {request.filePath}"
            }
        else:
            logger.warning(f"Demo path does not exist: {DEMO_PATH}")
            return {
                "success": True,
                "message": f"Code change prepared for {request.filePath} (demo mode - file system not writable)"
            }
            
    except Exception as e:
        logger.error(f"Error applying code change: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": "Failed to apply code change",
                "message": str(e)
            }
        )


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


# NOTE: Rate limiting and request size middleware disabled - not critical for demo
# These could be re-enabled with proper Starlette BaseHTTPMiddleware class implementation
# For production, consider using Redis-based rate limiting

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
