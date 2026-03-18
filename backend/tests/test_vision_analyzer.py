"""Tests for Vision Analyzer service."""
import pytest
import asyncio
import base64
import json
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime

from backend.services.vision_analyzer import (
    VisionAnalyzer, FocusCoach, ScreenAnalysis,
    ActivityType, ApplicationCategory
)


class TestActivityType:
    """Test ActivityType enum."""

    def test_activity_type_values(self):
        """Test activity type enum values."""
        assert ActivityType.PRODUCTIVE.value == "productive"
        assert ActivityType.DISTRACTED.value == "distracted"
        assert ActivityType.NEUTRAL.value == "neutral"
        assert ActivityType.UNKNOWN.value == "unknown"


class TestApplicationCategory:
    """Test ApplicationCategory enum."""

    def test_category_values(self):
        """Test application category enum values."""
        assert ApplicationCategory.PRODUCTIVITY.value == "productivity"
        assert ApplicationCategory.COMMUNICATION.value == "communication"
        assert ApplicationCategory.SOCIAL_MEDIA.value == "social_media"
        assert ApplicationCategory.ENTERTAINMENT.value == "entertainment"
        assert ApplicationCategory.BROWSING.value == "browsing"
        assert ApplicationCategory.SYSTEM.value == "system"
        assert ApplicationCategory.UNKNOWN.value == "unknown"


class TestScreenAnalysis:
    """Test ScreenAnalysis dataclass."""

    def test_screen_analysis_creation(self):
        """Test creating a ScreenAnalysis instance."""
        analysis = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.PRODUCTIVITY,
            primary_app="VS Code",
            description="Writing Python code",
            confidence=0.95,
            is_off_task=False,
            suggestions=["Keep coding!"],
            raw_response='{"test": "data"}'
        )
        
        assert analysis.activity_type == ActivityType.PRODUCTIVE
        assert analysis.application_category == ApplicationCategory.PRODUCTIVITY
        assert analysis.primary_app == "VS Code"
        assert analysis.description == "Writing Python code"
        assert analysis.confidence == 0.95
        assert analysis.is_off_task is False
        assert analysis.suggestions == ["Keep coding!"]
        assert analysis.raw_response == '{"test": "data"}'


class TestVisionAnalyzer:
    """Test suite for VisionAnalyzer."""

    @pytest.fixture
    def analyzer(self):
        """Create a VisionAnalyzer instance."""
        with patch('backend.services.vision_analyzer.genai.Client') as mock_genai:
            mock_client = Mock()
            mock_genai.return_value = mock_client
            return VisionAnalyzer(api_key="test-api-key")

    @pytest.mark.asyncio
    async def test_initialization(self, analyzer):
        """Test analyzer initialization."""
        assert analyzer.api_key == "test-api-key"
        assert analyzer.MODEL == "gemini-2.0-flash-exp"

    @pytest.mark.asyncio
    async def test_analyze_screen_success(self, analyzer):
        """Test successful screen analysis."""
        # Mock the response
        mock_response = Mock()
        mock_response.text = json.dumps({
            "primary_application": "VS Code",
            "application_category": "productivity",
            "activity_description": "Writing Python code",
            "is_productive": True,
            "is_off_task": False,
            "confidence": 0.95,
            "suggestions": ["Keep up the good work!"]
        })
        
        analyzer.client.aio.models.generate_content = AsyncMock(return_value=mock_response)
        
        # Create a simple base64 image
        image_base64 = base64.b64encode(b"fake image data").decode()
        
        result = await analyzer.analyze_screen(
            image_base64=image_base64,
            current_goal="Write tests"
        )
        
        assert result.activity_type == ActivityType.PRODUCTIVE
        assert result.application_category == ApplicationCategory.PRODUCTIVITY
        assert result.primary_app == "VS Code"
        assert result.confidence == 0.95
        assert result.is_off_task is False

    @pytest.mark.asyncio
    async def test_analyze_screen_distracted(self, analyzer):
        """Test screen analysis detecting distraction."""
        mock_response = Mock()
        mock_response.text = json.dumps({
            "primary_application": "Twitter",
            "application_category": "social_media",
            "activity_description": "Scrolling social media",
            "is_productive": False,
            "is_off_task": True,
            "confidence": 0.9,
            "suggestions": ["Consider getting back to work"]
        })
        
        analyzer.client.aio.models.generate_content = AsyncMock(return_value=mock_response)
        
        image_base64 = base64.b64encode(b"fake image data").decode()
        result = await analyzer.analyze_screen(
            image_base64=image_base64,
            current_goal="Write tests"
        )
        
        assert result.activity_type == ActivityType.DISTRACTED
        assert result.application_category == ApplicationCategory.SOCIAL_MEDIA
        assert result.is_off_task is True

    @pytest.mark.asyncio
    async def test_analyze_screen_api_error(self, analyzer):
        """Test handling API errors."""
        analyzer.client.aio.models.generate_content = AsyncMock(
            side_effect=Exception("API Error")
        )
        
        image_base64 = base64.b64encode(b"fake image data").decode()
        result = await analyzer.analyze_screen(image_base64=image_base64)
        
        assert result.activity_type == ActivityType.UNKNOWN
        assert result.confidence == 0.0
        assert "Could not analyze" in result.description

    @pytest.mark.asyncio
    async def test_analyze_screen_with_previous_analysis(self, analyzer):
        """Test analysis with previous context."""
        mock_response = Mock()
        mock_response.text = json.dumps({
            "primary_application": "Chrome",
            "application_category": "browsing",
            "activity_description": "Reading documentation",
            "is_productive": True,
            "is_off_task": False,
            "confidence": 0.8,
            "suggestions": []
        })
        
        analyzer.client.aio.models.generate_content = AsyncMock(return_value=mock_response)
        
        previous = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.PRODUCTIVITY,
            primary_app="VS Code",
            description="Coding",
            confidence=0.9,
            is_off_task=False,
            suggestions=[]
        )
        
        image_base64 = base64.b64encode(b"fake image data").decode()
        result = await analyzer.analyze_screen(
            image_base64=image_base64,
            current_goal="Write tests",
            previous_analysis=previous
        )
        
        assert result.primary_app == "Chrome"

    def test_build_analysis_prompt(self, analyzer):
        """Test prompt building."""
        prompt = analyzer._build_analysis_prompt(
            current_goal="Write tests",
            previous_analysis=None
        )
        
        assert "Write tests" in prompt
        assert "Analyze this screenshot" in prompt

    def test_create_fallback_analysis(self, analyzer):
        """Test fallback analysis creation."""
        result = analyzer._create_fallback_analysis("Test error")
        
        assert result.activity_type == ActivityType.UNKNOWN
        assert result.confidence == 0.0
        assert "Test error" in result.description

    def test_should_intervene_productive(self, analyzer):
        """Test intervention decision for productive state."""
        current = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.PRODUCTIVITY,
            primary_app="VS Code",
            description="Coding",
            confidence=0.9,
            is_off_task=False,
            suggestions=[]
        )
        
        should_intervene, reason = analyzer.should_intervene(
            current=current,
            previous=None,
            session_duration_minutes=5.0
        )
        
        assert should_intervene is False

    def test_should_intervene_distracted(self, analyzer):
        """Test intervention decision for distracted state."""
        current = ScreenAnalysis(
            activity_type=ActivityType.DISTRACTED,
            application_category=ApplicationCategory.SOCIAL_MEDIA,
            primary_app="Twitter",
            description="Scrolling",
            confidence=0.9,
            is_off_task=True,
            suggestions=[]
        )
        
        previous = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.PRODUCTIVITY,
            primary_app="VS Code",
            description="Coding",
            confidence=0.9,
            is_off_task=False,
            suggestions=[]
        )
        
        should_intervene, reason = analyzer.should_intervene(
            current=current,
            previous=previous,
            session_duration_minutes=5.0
        )
        
        assert should_intervene is True
        assert "just became distracted" in reason

    def test_should_intervene_early_session(self, analyzer):
        """Test no intervention early in session."""
        current = ScreenAnalysis(
            activity_type=ActivityType.DISTRACTED,
            application_category=ApplicationCategory.SOCIAL_MEDIA,
            primary_app="Twitter",
            description="Scrolling",
            confidence=0.9,
            is_off_task=True,
            suggestions=[]
        )
        
        should_intervene, reason = analyzer.should_intervene(
            current=current,
            previous=None,
            session_duration_minutes=1.0  # Less than 2 minutes
        )
        
        assert should_intervene is False
        assert "Session too new" in reason


class TestFocusCoach:
    """Test suite for FocusCoach."""

    @pytest.fixture
    def coach(self):
        """Create a FocusCoach instance."""
        return FocusCoach()

    def test_initialization(self, coach):
        """Test coach initialization."""
        assert coach.last_coaching_time == 0
        assert coach.coaching_cooldown_seconds == 30

    def test_generate_coaching_message_distracted(self, coach):
        """Test coaching message for distracted state."""
        analysis = ScreenAnalysis(
            activity_type=ActivityType.DISTRACTED,
            application_category=ApplicationCategory.SOCIAL_MEDIA,
            primary_app="Twitter",
            description="Scrolling",
            confidence=0.9,
            is_off_task=True,
            suggestions=[]
        )
        
        message = coach.generate_coaching_message(
            analysis=analysis,
            session_goal="Write tests",
            session_duration_minutes=10.0
        )
        
        assert message is not None
        assert "Twitter" in message

    def test_generate_coaching_message_off_task(self, coach):
        """Test coaching message for off-task state."""
        analysis = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.BROWSING,
            primary_app="Chrome",
            description="Reading news",
            confidence=0.8,
            is_off_task=True,
            suggestions=[]
        )
        
        message = coach.generate_coaching_message(
            analysis=analysis,
            session_goal="Write tests",
            session_duration_minutes=10.0
        )
        
        assert message is not None
        assert "Write tests" in message

    def test_generate_coaching_message_cooldown(self, coach):
        """Test coaching message respects cooldown."""
        import time
        coach.last_coaching_time = time.time()  # Just sent a message
        
        analysis = ScreenAnalysis(
            activity_type=ActivityType.DISTRACTED,
            application_category=ApplicationCategory.SOCIAL_MEDIA,
            primary_app="Twitter",
            description="Scrolling",
            confidence=0.9,
            is_off_task=True,
            suggestions=[]
        )
        
        message = coach.generate_coaching_message(
            analysis=analysis,
            session_goal="Write tests",
            session_duration_minutes=10.0
        )
        
        assert message is None  # Should be None due to cooldown

    def test_generate_coaching_message_encouragement(self, coach):
        """Test encouragement message after sustained focus."""
        analysis = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.PRODUCTIVITY,
            primary_app="VS Code",
            description="Coding",
            confidence=0.9,
            is_off_task=False,
            suggestions=[]
        )
        
        message = coach.generate_coaching_message(
            analysis=analysis,
            session_goal="Write tests",
            session_duration_minutes=25.0  # Over 20 minutes
        )
        
        assert message is not None
        assert any(word in message.lower() for word in ["great", "good", "excellent", "solid"])

    def test_social_media_message(self, coach):
        """Test social media specific message."""
        message = coach._social_media_message("Twitter")
        assert "Twitter" in message

    def test_entertainment_message(self, coach):
        """Test entertainment specific message."""
        message = coach._entertainment_message("YouTube")
        assert "YouTube" in message

    def test_off_task_message(self, coach):
        """Test off-task message."""
        message = coach._off_task_message("Write tests")
        assert "Write tests" in message

    def test_encouragement_message(self, coach):
        """Test encouragement message."""
        message = coach._encouragement_message()
        assert message is not None
        assert len(message) > 0

    def test_generate_session_summary_excellent(self, coach):
        """Test session summary for excellent focus."""
        summary = coach.generate_session_summary(
            productive_time_minutes=40.0,
            distracted_time_minutes=5.0,
            interruptions=1
        )
        
        assert "Excellent" in summary
        assert "89%" in summary or "88%" in summary

    def test_generate_session_summary_good(self, coach):
        """Test session summary for good focus."""
        summary = coach.generate_session_summary(
            productive_time_minutes=30.0,
            distracted_time_minutes=20.0,
            interruptions=3
        )
        
        assert "Good" in summary or "60%" in summary

    def test_generate_session_summary_needs_improvement(self, coach):
        """Test session summary for low focus."""
        summary = coach.generate_session_summary(
            productive_time_minutes=10.0,
            distracted_time_minutes=40.0,
            interruptions=5
        )
        
        assert "20%" in summary or "tomorrow" in summary.lower()
