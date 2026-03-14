"""Vision analysis service for screen content understanding."""
import base64
import json
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from google import genai
from google.genai import types

from ..config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ActivityType(Enum):
    """Types of activities detected from screen."""
    PRODUCTIVE = "productive"
    DISTRACTED = "distracted"
    NEUTRAL = "neutral"
    UNKNOWN = "unknown"


class ApplicationCategory(Enum):
    """Categories of applications."""
    PRODUCTIVITY = "productivity"  # IDE, docs, spreadsheets
    COMMUNICATION = "communication"  # Slack, email, Teams
    SOCIAL_MEDIA = "social_media"  # Twitter, Facebook, Instagram
    ENTERTAINMENT = "entertainment"  # YouTube, Netflix, games
    BROWSING = "browsing"  # General web browsing
    SYSTEM = "system"  # Desktop, settings
    UNKNOWN = "unknown"


@dataclass
class ScreenAnalysis:
    """Result of screen content analysis."""
    activity_type: ActivityType
    application_category: ApplicationCategory
    primary_app: str
    description: str
    confidence: float
    is_off_task: bool
    suggestions: List[str]
    raw_response: Optional[str] = None


class VisionAnalyzer:
    """Analyzes screen captures using Gemini Vision API."""
    
    MODEL = "gemini-2.0-flash-exp"  # Vision-capable model
    
    # Known distracting domains/apps
    DISTRACTING_PATTERNS = [
        "twitter", "x.com", "facebook", "instagram", "tiktok",
        "youtube", "reddit", "netflix", "twitch", "discord",
        "whatsapp", "telegram", "snapchat"
    ]
    
    # Productive patterns
    PRODUCTIVE_PATTERNS = [
        "github", "gitlab", "vscode", "cursor", "pycharm",
        "docs.google", "sheets", "slides", "notion", "figma",
        "terminal", "console", "localhost", "jupyter"
    ]
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.client = genai.Client(api_key=self.api_key)
        
    async def analyze_screen(
        self,
        image_base64: str,
        current_goal: str = "",
        previous_analysis: Optional[ScreenAnalysis] = None
    ) -> ScreenAnalysis:
        """Analyze a screen capture to understand user activity.
        
        Args:
            image_base64: Base64-encoded JPEG image
            current_goal: User's stated focus goal
            previous_analysis: Previous analysis for context
            
        Returns:
            ScreenAnalysis with activity classification
        """
        try:
            # Decode image
            image_bytes = base64.b64decode(image_base64)
            
            # Build prompt
            prompt = self._build_analysis_prompt(current_goal, previous_analysis)
            
            # Create content with image
            contents = [
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=prompt),
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
                    ]
                )
            ]
            
            # Configure response
            config = types.GenerateContentConfig(
                temperature=0.2,  # Low temperature for consistent analysis
                response_mime_type="application/json",
                response_schema={
                    "type": "object",
                    "properties": {
                        "primary_application": {
                            "type": "string",
                            "description": "Name of the main application visible"
                        },
                        "application_category": {
                            "type": "string",
                            "enum": ["productivity", "communication", "social_media", 
                                    "entertainment", "browsing", "system", "unknown"]
                        },
                        "activity_description": {
                            "type": "string",
                            "description": "Brief description of what the user appears to be doing"
                        },
                        "is_productive": {
                            "type": "boolean",
                            "description": "Whether this activity appears productive"
                        },
                        "is_off_task": {
                            "type": "boolean",
                            "description": "Whether user appears to be off-task from their stated goal"
                        },
                        "confidence": {
                            "type": "number",
                            "description": "Confidence in this analysis (0.0 to 1.0)"
                        },
                        "suggestions": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Suggestions for staying focused or getting back on track"
                        }
                    },
                    "required": ["primary_application", "application_category", 
                                "activity_description", "is_productive", "is_off_task", 
                                "confidence", "suggestions"]
                }
            )
            
            # Generate analysis
            response = await self.client.aio.models.generate_content(
                model=self.MODEL,
                contents=contents,
                config=config
            )
            
            # Parse response
            result = json.loads(response.text)
            
            # Map to ScreenAnalysis
            activity_type = ActivityType.PRODUCTIVE if result.get("is_productive") else ActivityType.DISTRACTED
            if result.get("is_off_task"):
                activity_type = ActivityType.DISTRACTED
                
            app_category = ApplicationCategory(result.get("application_category", "unknown"))
            
            analysis = ScreenAnalysis(
                activity_type=activity_type,
                application_category=app_category,
                primary_app=result.get("primary_application", "Unknown"),
                description=result.get("activity_description", ""),
                confidence=result.get("confidence", 0.5),
                is_off_task=result.get("is_off_task", False),
                suggestions=result.get("suggestions", []),
                raw_response=response.text
            )
            
            logger.info(f"Screen analysis: {analysis.primary_app} ({analysis.activity_type.value})")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing screen: {e}")
            return self._create_fallback_analysis(str(e))
    
    def _build_analysis_prompt(
        self,
        current_goal: str,
        previous_analysis: Optional[ScreenAnalysis]
    ) -> str:
        """Build the analysis prompt."""
        prompt = """Analyze this screenshot and determine what the user is doing.

Focus on:
1. What application is primarily visible
2. What category of activity (productivity, communication, social media, entertainment, etc.)
3. Whether this appears to be productive work or a potential distraction
4. Specific details about what they're doing

"""
        
        if current_goal:
            prompt += f"\nThe user's stated focus goal is: '{current_goal}'\n"
            prompt += "Evaluate whether their current activity aligns with this goal.\n"
        
        if previous_analysis:
            prompt += f"\nPrevious activity: {previous_analysis.primary_app} - {previous_analysis.description}\n"
            prompt += "Note any significant changes in activity.\n"
        
        prompt += """
Respond with a JSON object containing:
- primary_application: Name of the main app
- application_category: One of productivity, communication, social_media, entertainment, browsing, system, unknown
- activity_description: Brief description of what they're doing
- is_productive: Boolean indicating if this is productive work
- is_off_task: Boolean indicating if they're off-task from their goal
- confidence: Number from 0.0 to 1.0
- suggestions: Array of helpful suggestions (1-2 items)
"""
        return prompt
    
    def _create_fallback_analysis(self, error_message: str) -> ScreenAnalysis:
        """Create a fallback analysis when vision API fails."""
        return ScreenAnalysis(
            activity_type=ActivityType.UNKNOWN,
            application_category=ApplicationCategory.UNKNOWN,
            primary_app="Unknown",
            description=f"Could not analyze screen: {error_message[:50]}",
            confidence=0.0,
            is_off_task=False,
            suggestions=["I'm having trouble seeing your screen. Make sure screen sharing is enabled."],
            raw_response=None
        )
    
    def quick_classify(self, image_base64: str) -> ActivityType:
        """Quick classification without full vision API call.
        
        Uses simple heuristics for fast classification.
        """
        # This is a placeholder - in production, you might use
        # local image analysis or cached results
        return ActivityType.UNKNOWN
    
    def should_intervene(
        self,
        current: ScreenAnalysis,
        previous: Optional[ScreenAnalysis],
        session_duration_minutes: float
    ) -> tuple[bool, str]:
        """Determine if agent should intervene based on analysis.
        
        Returns:
            Tuple of (should_intervene, reason)
        """
        # Don't intervene too early in session
        if session_duration_minutes < 2:
            return False, "Session too new"
        
        # If currently distracted
        if current.activity_type == ActivityType.DISTRACTED:
            # Check if this is a new distraction
            if previous and previous.activity_type != ActivityType.DISTRACTED:
                return True, "User just became distracted"
            
            # Check if distraction has persisted
            if previous and previous.activity_type == ActivityType.DISTRACTED:
                return True, "Distraction persisting"
        
        # If off-task
        if current.is_off_task:
            return True, "User appears off-task"
        
        return False, "No intervention needed"


class FocusCoach:
    """Generates contextual coaching messages based on screen analysis."""
    
    def __init__(self):
        self.last_coaching_time = 0
        self.coaching_cooldown_seconds = 30  # Don't coach more than every 30s
        
    def generate_coaching_message(
        self,
        analysis: ScreenAnalysis,
        session_goal: str,
        session_duration_minutes: float
    ) -> Optional[str]:
        """Generate a contextual coaching message.
        
        Args:
            analysis: Current screen analysis
            session_goal: User's focus goal
            session_duration_minutes: How long session has been running
            
        Returns:
            Coaching message or None if no coaching needed
        """
        import time
        
        # Check cooldown
        current_time = time.time()
        if current_time - self.last_coaching_time < self.coaching_cooldown_seconds:
            return None
        
        message = None
        
        # Generate message based on state
        if analysis.activity_type == ActivityType.DISTRACTED:
            if analysis.application_category == ApplicationCategory.SOCIAL_MEDIA:
                message = self._social_media_message(analysis.primary_app)
            elif analysis.application_category == ApplicationCategory.ENTERTAINMENT:
                message = self._entertainment_message(analysis.primary_app)
            else:
                message = self._general_distraction_message(analysis.primary_app)
                
        elif analysis.is_off_task and session_goal:
            message = self._off_task_message(session_goal)
            
        elif session_duration_minutes > 20 and analysis.activity_type == ActivityType.PRODUCTIVE:
            # Encourage after sustained focus
            message = self._encouragement_message()
        
        if message:
            self.last_coaching_time = current_time
            
        return message
    
    def _social_media_message(self, app_name: str) -> str:
        """Generate message for social media distraction."""
        import random
        messages = [
            f"I see you're on {app_name}. Is this part of your focus goal, or should we get back on track?",
            f"{app_name} opened. Want me to help you refocus?",
            f"Quick check - is {app_name} helping with your current task?",
            f"I notice {app_name} is open. Remember your focus goal!",
        ]
        return random.choice(messages)
    
    def _entertainment_message(self, app_name: str) -> str:
        """Generate message for entertainment distraction."""
        import random
        messages = [
            f"I see {app_name} is open. Taking a break, or should we get back to work?",
            f"Looks like you're on {app_name}. Want to pause your focus session?",
            f"{app_name} can be distracting. Need help staying focused?",
        ]
        return random.choice(messages)
    
    def _general_distraction_message(self, app_name: str) -> str:
        """Generate message for general distraction."""
        import random
        messages = [
            f"I see you've switched to {app_name}. Still working on your goal?",
            f"You've been on {app_name} for a bit. Everything okay?",
            f"Just checking - is {app_name} part of your current task?",
        ]
        return random.choice(messages)
    
    def _off_task_message(self, goal: str) -> str:
        """Generate message when user is off-task."""
        import random
        messages = [
            f"I notice you've switched activities. Remember, you're working on: {goal}",
            f"Just a gentle reminder about your focus goal: {goal}",
            f"Want to get back to {goal}? I can help you refocus.",
        ]
        return random.choice(messages)
    
    def _encouragement_message(self) -> str:
        """Generate encouragement message."""
        import random
        messages = [
            "You've been focused for a while now. Great work!",
            "You're in the zone. Keep it up!",
            "Solid focus session so far. You're doing great!",
            "I can see you're making progress. Nice work!",
        ]
        return random.choice(messages)
    
    def generate_session_summary(
        self,
        productive_time_minutes: float,
        distracted_time_minutes: float,
        interruptions: int
    ) -> str:
        """Generate end-of-session summary."""
        total_time = productive_time_minutes + distracted_time_minutes
        focus_percentage = (productive_time_minutes / total_time * 100) if total_time > 0 else 0
        
        if focus_percentage >= 80:
            return f"Excellent session! You stayed focused {focus_percentage:.0f}% of the time. Great work!"
        elif focus_percentage >= 60:
            return f"Good session! You were focused {focus_percentage:.0f}% of the time. Keep it up!"
        else:
            return f"Session complete. You were focused {focus_percentage:.0f}% of the time. Tomorrow's another chance!"