"""Services module for FocusCompanion."""
from .gemini_live import GeminiLiveClient
from .vision_analyzer import VisionAnalyzer, FocusCoach, ScreenAnalysis, ActivityType, ApplicationCategory
from .interruption_detector import (
    InterruptionDetector, InterruptionEvent, InterruptionDecision,
    InterruptionType, InterruptionUrgency, InterruptionQueue
)

__all__ = [
    "GeminiLiveClient",
    "VisionAnalyzer",
    "FocusCoach",
    "ScreenAnalysis",
    "ActivityType",
    "ApplicationCategory",
    "InterruptionDetector",
    "InterruptionEvent",
    "InterruptionDecision",
    "InterruptionType",
    "InterruptionUrgency",
    "InterruptionQueue",
]