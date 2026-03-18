"""Tests for Session models."""
import pytest
import time
from unittest.mock import patch

from backend.models.session import (
    SessionManager, FocusSession, SessionState, FocusMode
)


class TestSessionState:
    """Test SessionState enum."""

    def test_state_values(self):
        """Test session state values."""
        assert SessionState.IDLE.value == "idle"
        assert SessionState.CONNECTING.value == "connecting"
        assert SessionState.ACTIVE.value == "active"
        assert SessionState.PAUSED.value == "paused"
        assert SessionState.ENDED.value == "ended"


class TestFocusMode:
    """Test FocusMode enum."""

    def test_mode_values(self):
        """Test focus mode values."""
        assert FocusMode.DEEP_WORK.value == "deep_work"
        assert FocusMode.POMODORO.value == "pomodoro"
        assert FocusMode.FREE.value == "free"


class TestFocusSession:
    """Test suite for FocusSession."""

    @pytest.fixture
    def session(self):
        """Create a FocusSession instance."""
        return FocusSession(
            session_id="test-session-123",
            user_id="user-456",
            duration_minutes=25,
            goal="Write tests"
        )

    def test_initialization(self, session):
        """Test session initialization."""
        assert session.session_id == "test-session-123"
        assert session.user_id == "user-456"
        assert session.state == SessionState.IDLE
        assert session.focus_mode == FocusMode.POMODORO
        assert session.duration_minutes == 25
        assert session.goal == "Write tests"
        assert session.start_time is None
        assert session.end_time is None
        assert session.paused_at is None
        assert session.total_paused_time == 0.0
        assert len(session.interruptions) == 0

    def test_start(self, session):
        """Test starting a session."""
        session.start()
        
        assert session.state == SessionState.ACTIVE
        assert session.start_time is not None
        assert session.start_time > 0

    def test_pause(self, session):
        """Test pausing a session."""
        session.start()
        session.pause()
        
        assert session.state == SessionState.PAUSED
        assert session.paused_at is not None

    def test_pause_not_active(self, session):
        """Test pausing when not active."""
        # Don't start the session
        session.pause()
        
        # Should remain IDLE
        assert session.state == SessionState.IDLE
        assert session.paused_at is None

    def test_resume(self, session):
        """Test resuming a paused session."""
        session.start()
        session.pause()
        
        # Wait a tiny bit
        time.sleep(0.01)
        
        session.resume()
        
        assert session.state == SessionState.ACTIVE
        assert session.paused_at is None
        assert session.total_paused_time > 0

    def test_resume_not_paused(self, session):
        """Test resuming when not paused."""
        session.start()
        # Don't pause
        
        session.resume()
        
        # Should remain ACTIVE
        assert session.state == SessionState.ACTIVE

    def test_end(self, session):
        """Test ending a session."""
        session.start()
        session.end()
        
        assert session.state == SessionState.ENDED
        assert session.end_time is not None
        assert session.end_time > 0

    def test_get_elapsed_seconds_not_started(self, session):
        """Test elapsed time when not started."""
        elapsed = session.get_elapsed_seconds()
        
        assert elapsed == 0.0

    def test_get_elapsed_seconds_active(self, session):
        """Test elapsed time when active."""
        session.start()
        
        # Wait a tiny bit
        time.sleep(0.05)
        
        elapsed = session.get_elapsed_seconds()
        
        assert elapsed > 0

    def test_get_elapsed_seconds_with_pause(self, session):
        """Test elapsed time accounts for pauses."""
        session.start()
        
        # Wait, then pause
        time.sleep(0.05)
        session.pause()
        time.sleep(0.05)  # Time during pause
        session.resume()
        
        elapsed = session.get_elapsed_seconds()
        
        # Should be approximately 0.05 seconds (not 0.1)
        assert elapsed > 0
        assert elapsed < 0.1

    def test_get_elapsed_seconds_while_paused(self, session):
        """Test elapsed time while paused."""
        session.start()
        time.sleep(0.05)
        session.pause()
        time.sleep(0.05)
        
        elapsed = session.get_elapsed_seconds()
        
        # Should not include time after pause
        assert elapsed > 0
        assert elapsed < 0.1

    def test_get_remaining_seconds(self, session):
        """Test remaining time calculation."""
        session.start()
        
        remaining = session.get_remaining_seconds()
        
        # Should be approximately 25 minutes
        assert remaining > 24 * 60  # More than 24 minutes
        assert remaining <= 25 * 60  # Less than or equal to 25 minutes

    def test_get_remaining_seconds_not_started(self, session):
        """Test remaining time when not started."""
        remaining = session.get_remaining_seconds()
        
        assert remaining == 25 * 60  # Full duration

    def test_get_remaining_seconds_complete(self, session):
        """Test remaining time when complete."""
        session.start()
        session.duration_minutes = 0  # Force completion
        
        remaining = session.get_remaining_seconds()
        
        assert remaining == 0.0

    def test_is_complete_not_started(self, session):
        """Test is_complete when not started."""
        assert session.is_complete() is False

    def test_is_complete_active(self, session):
        """Test is_complete when active."""
        session.start()
        assert session.is_complete() is False

    def test_is_complete_true(self, session):
        """Test is_complete when time is up."""
        session.start()
        session.duration_minutes = 0
        assert session.is_complete() is True

    def test_to_dict(self, session):
        """Test converting session to dictionary."""
        session.start()
        
        data = session.to_dict()
        
        assert data["session_id"] == "test-session-123"
        assert data["user_id"] == "user-456"
        assert data["state"] == "active"
        assert data["focus_mode"] == "pomodoro"
        assert data["duration_minutes"] == 25
        assert data["goal"] == "Write tests"
        assert "elapsed_seconds" in data
        assert "remaining_seconds" in data
        assert "is_complete" in data
        assert data["interruptions_count"] == 0

    def test_to_dict_idle(self, session):
        """Test to_dict when idle."""
        data = session.to_dict()
        
        assert data["state"] == "idle"
        assert data["elapsed_seconds"] == 0.0
        assert data["remaining_seconds"] == 25 * 60


class TestSessionManager:
    """Test suite for SessionManager."""

    @pytest.fixture
    def manager(self):
        """Create a SessionManager instance."""
        return SessionManager()

    def test_initialization(self, manager):
        """Test manager initialization."""
        assert len(manager.sessions) == 0

    def test_create_session(self, manager):
        """Test creating a session."""
        session = manager.create_session(
            session_id="test-123",
            user_id="user-456",
            duration_minutes=25,
            goal="Write tests",
            focus_mode=FocusMode.POMODORO
        )
        
        assert session.session_id == "test-123"
        assert session.user_id == "user-456"
        assert session.duration_minutes == 25
        assert session.goal == "Write tests"
        assert session.focus_mode == FocusMode.POMODORO
        assert "test-123" in manager.sessions

    def test_create_session_default_mode(self, manager):
        """Test creating session with default mode."""
        session = manager.create_session(
            session_id="test-123",
            user_id="user-456"
        )
        
        assert session.focus_mode == FocusMode.POMODORO
        assert session.duration_minutes == 25

    def test_get_session_exists(self, manager):
        """Test getting existing session."""
        manager.create_session("test-123", "user-456")
        
        session = manager.get_session("test-123")
        
        assert session is not None
        assert session.session_id == "test-123"

    def test_get_session_not_exists(self, manager):
        """Test getting non-existent session."""
        session = manager.get_session("non-existent")
        
        assert session is None

    def test_end_session(self, manager):
        """Test ending a session."""
        manager.create_session("test-123", "user-456")
        
        session = manager.end_session("test-123")
        
        assert session is not None
        assert session.state == SessionState.ENDED
        assert session.end_time is not None

    def test_end_session_not_exists(self, manager):
        """Test ending non-existent session."""
        session = manager.end_session("non-existent")
        
        assert session is None

    def test_cleanup_old_sessions(self, manager):
        """Test cleaning up old sessions."""
        # Create a session with old timestamp
        with patch('time.time') as mock_time:
            mock_time.return_value = 1000  # Old time
            session = manager.create_session("old-session", "user-456")
            session.created_at = 1000
        
        # Now cleanup with current time
        with patch('time.time') as mock_time:
            mock_time.return_value = 1000 + 25 * 3600  # 25 hours later
            manager.cleanup_old_sessions(max_age_hours=24)
        
        assert "old-session" not in manager.sessions

    def test_cleanup_old_sessions_keep_recent(self, manager):
        """Test keeping recent sessions during cleanup."""
        # Create a recent session
        manager.create_session("recent-session", "user-456")
        
        # Cleanup
        manager.cleanup_old_sessions(max_age_hours=24)
        
        assert "recent-session" in manager.sessions

    def test_multiple_sessions(self, manager):
        """Test managing multiple sessions."""
        session1 = manager.create_session("session-1", "user-1")
        session2 = manager.create_session("session-2", "user-2")
        
        assert len(manager.sessions) == 2
        assert manager.get_session("session-1") == session1
        assert manager.get_session("session-2") == session2

    def test_session_lifecycle(self, manager):
        """Test full session lifecycle."""
        # Create
        session = manager.create_session("test-123", "user-456", 25, "Test goal")
        assert session.state == SessionState.IDLE
        
        # Start
        session.start()
        assert session.state == SessionState.ACTIVE
        
        # Pause
        session.pause()
        assert session.state == SessionState.PAUSED
        
        # Resume
        session.resume()
        assert session.state == SessionState.ACTIVE
        
        # End
        session.end()
        assert session.state == SessionState.ENDED
