"""Pytest configuration and fixtures for FocusCompanion tests."""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, MagicMock
from typing import Generator
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_gemini_client():
    """Mock GeminiLiveClient for testing."""
    client = Mock()
    client.is_connected = False
    client.connect = AsyncMock(return_value=True)
    client.send_audio = AsyncMock()
    client.send_text = AsyncMock()
    client.close = AsyncMock()
    client.set_audio_callback = Mock()
    client.set_text_callback = Mock()
    return client


@pytest.fixture
def mock_vision_analyzer():
    """Mock VisionAnalyzer for testing."""
    analyzer = Mock()
    analyzer.analyze_screen = AsyncMock(return_value=(
        Mock(
            activity_type=Mock(value="productive"),
            application_category=Mock(value="productivity"),
            primary_app="VS Code",
            description="Writing code",
            confidence=0.9,
            is_off_task=False,
            suggestions=["Keep up the good work!"]
        ),
        {"cached": False, "cache_stats": {"hit_rate_percent": 0}}
    ))
    return analyzer


@pytest.fixture
def mock_websocket():
    """Mock WebSocket for testing."""
    ws = AsyncMock()
    ws.accept = AsyncMock()
    ws.send_json = AsyncMock()
    ws.receive_json = AsyncMock()
    ws.close = AsyncMock()
    return ws


@pytest.fixture
def sample_session_data():
    """Sample session data for tests."""
    return {
        "session_id": "test-session-123",
        "user_id": "user-456",
        "duration_minutes": 25,
        "goal": "Complete the test suite",
        "focus_mode": "pomodoro"
    }


@pytest.fixture(autouse=True)
def reset_settings():
    """Reset settings before each test."""
    from backend.config import settings
    original_api_key = settings.GEMINI_API_KEY
    settings.GEMINI_API_KEY = "test-api-key"
    yield
    settings.GEMINI_API_KEY = original_api_key
