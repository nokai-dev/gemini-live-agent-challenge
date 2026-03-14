"""Configuration settings for FocusCompanion."""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings loaded from environment variables."""
    
    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8080"))
    
    # Gemini Live API settings
    GEMINI_MODEL: str = "gemini-2.0-flash-live-api-preview-12-2025"
    
    # Audio settings
    AUDIO_SAMPLE_RATE: int = 16000
    AUDIO_CHANNELS: int = 1
    AUDIO_CHUNK_SIZE: int = 1024
    
    # Session settings
    DEFAULT_SESSION_DURATION: int = 25  # minutes
    MAX_SESSION_DURATION: int = 120  # minutes
    
    # CORS settings
    CORS_ORIGINS: list = ["*"]  # Configure properly for production

settings = Settings()