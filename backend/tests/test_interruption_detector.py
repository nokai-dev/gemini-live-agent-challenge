"""Tests for Interruption Detector service."""
import pytest
import time
from unittest.mock import Mock, patch

from backend.services.interruption_detector import (
    InterruptionDetector, InterruptionQueue, InterruptionEvent,
    InterruptionDecision, InterruptionType, InterruptionUrgency
)
from backend.services.vision_analyzer import (
    ScreenAnalysis, ActivityType, ApplicationCategory
)


class TestInterruptionUrgency:
    """Test InterruptionUrgency enum."""

    def test_urgency_values(self):
        """Test urgency level values."""
        assert InterruptionUrgency.CRITICAL.value == "critical"
        assert InterruptionUrgency.HIGH.value == "high"
        assert InterruptionUrgency.MEDIUM.value == "medium"
        assert InterruptionUrgency.LOW.value == "low"
        assert InterruptionUrgency.IGNORE.value == "ignore"


class TestInterruptionType:
    """Test InterruptionType enum."""

    def test_type_values(self):
        """Test interruption type values."""
        assert InterruptionType.SCREEN_CHANGE.value == "screen_change"
        assert InterruptionType.OFF_TASK.value == "off_task"
        assert InterruptionType.DISTRACTION.value == "distraction"
        assert InterruptionType.CALENDAR.value == "calendar"
        assert InterruptionType.NOTIFICATION.value == "notification"
        assert InterruptionType.USER_REQUEST.value == "user_request"
        assert InterruptionType.SESSION_COMPLETE.value == "session_complete"
        assert InterruptionType.PROLONGED_INACTIVITY.value == "inactivity"


class TestInterruptionEvent:
    """Test InterruptionEvent dataclass."""

    def test_event_creation(self):
        """Test creating an interruption event."""
        event = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.HIGH,
            message="User is distracted",
            metadata={"app": "Twitter"}
        )
        
        assert event.event_type == InterruptionType.DISTRACTION
        assert event.urgency == InterruptionUrgency.HIGH
        assert event.message == "User is distracted"
        assert event.metadata == {"app": "Twitter"}
        assert event.handled is False
        assert event.timestamp > 0

    def test_to_dict(self):
        """Test converting event to dictionary."""
        event = InterruptionEvent(
            event_type=InterruptionType.OFF_TASK,
            urgency=InterruptionUrgency.MEDIUM,
            message="Off task",
            metadata={"goal": "Write code"}
        )
        
        data = event.to_dict()
        
        assert data["type"] == "off_task"
        assert data["urgency"] == "medium"
        assert data["message"] == "Off task"
        assert data["metadata"] == {"goal": "Write code"}
        assert data["handled"] is False


class TestInterruptionDecision:
    """Test InterruptionDecision dataclass."""

    def test_decision_creation(self):
        """Test creating an interruption decision."""
        decision = InterruptionDecision(
            should_interrupt=True,
            action=InterruptionDecision.ACTION_IMMEDIATE,
            message="Interrupt now",
            delay_seconds=0
        )
        
        assert decision.should_interrupt is True
        assert decision.action == "immediate"
        assert decision.message == "Interrupt now"
        assert decision.delay_seconds == 0


class TestInterruptionDetector:
    """Test suite for InterruptionDetector."""

    @pytest.fixture
    def detector(self):
        """Create an InterruptionDetector instance."""
        return InterruptionDetector()

    def test_initialization(self, detector):
        """Test detector initialization."""
        assert len(detector.recent_analyses) == 0
        assert detector.max_history == 10
        assert len(detector.interruption_history) == 0
        assert detector.distraction_threshold_seconds == 120
        assert detector.inactivity_threshold_seconds == 300
        assert detector.interruption_cooldown == 30

    def test_analyze_screen_change_no_interruption(self, detector):
        """Test screen analysis with no interruption."""
        current = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.PRODUCTIVITY,
            primary_app="VS Code",
            description="Coding",
            confidence=0.9,
            is_off_task=False,
            suggestions=[]
        )
        
        event = detector.analyze_screen_change(
            current=current,
            previous=None,
            session_goal="Write tests",
            session_duration_minutes=5.0
        )
        
        assert event is None

    def test_analyze_screen_change_new_distraction(self, detector):
        """Test detecting new distraction."""
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
        
        event = detector.analyze_screen_change(
            current=current,
            previous=previous,
            session_goal="Write tests",
            session_duration_minutes=5.0
        )
        
        assert event is not None
        assert event.event_type == InterruptionType.DISTRACTION
        assert event.urgency == InterruptionUrgency.MEDIUM
        assert "Twitter" in event.message

    def test_analyze_screen_change_prolonged_distraction(self, detector):
        """Test detecting prolonged distraction."""
        # Add multiple distracted analyses to simulate prolonged distraction
        for _ in range(5):
            detector.recent_analyses.append(ScreenAnalysis(
                activity_type=ActivityType.DISTRACTED,
                application_category=ApplicationCategory.SOCIAL_MEDIA,
                primary_app="Twitter",
                description="Scrolling",
                confidence=0.9,
                is_off_task=True,
                suggestions=[]
            ))
        
        current = ScreenAnalysis(
            activity_type=ActivityType.DISTRACTED,
            application_category=ApplicationCategory.SOCIAL_MEDIA,
            primary_app="Twitter",
            description="Still scrolling",
            confidence=0.9,
            is_off_task=True,
            suggestions=[]
        )
        
        # Reset cooldown
        detector.last_interruption_time = 0
        
        event = detector.analyze_screen_change(
            current=current,
            previous=None,
            session_goal="Write tests",
            session_duration_minutes=5.0
        )
        
        assert event is not None
        assert event.event_type == InterruptionType.OFF_TASK
        assert event.urgency == InterruptionUrgency.HIGH

    def test_analyze_screen_change_off_task(self, detector):
        """Test detecting off-task behavior."""
        current = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.BROWSING,
            primary_app="Chrome",
            description="Reading news",
            confidence=0.8,
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
        
        # Reset cooldown
        detector.last_interruption_time = 0
        
        event = detector.analyze_screen_change(
            current=current,
            previous=previous,
            session_goal="Write tests",
            session_duration_minutes=5.0
        )
        
        assert event is not None
        assert event.event_type == InterruptionType.OFF_TASK

    def test_analyze_screen_change_app_switching(self, detector):
        """Test detecting frequent app switching."""
        # Add analyses with different apps
        for app in ["VS Code", "Chrome", "Slack", "VS Code", "Chrome"]:
            detector.recent_analyses.append(ScreenAnalysis(
                activity_type=ActivityType.PRODUCTIVE,
                application_category=ApplicationCategory.PRODUCTIVITY,
                primary_app=app,
                description="Working",
                confidence=0.9,
                is_off_task=False,
                suggestions=[]
            ))
        
        current = ScreenAnalysis(
            activity_type=ActivityType.PRODUCTIVE,
            application_category=ApplicationCategory.COMMUNICATION,
            primary_app="Slack",
            description="Chatting",
            confidence=0.9,
            is_off_task=False,
            suggestions=[]
        )
        
        # Reset cooldown
        detector.last_interruption_time = 0
        
        event = detector.analyze_screen_change(
            current=current,
            previous=None,
            session_goal="Write tests",
            session_duration_minutes=5.0
        )
        
        assert event is not None
        assert event.event_type == InterruptionType.SCREEN_CHANGE
        assert "switching" in event.message.lower()

    def test_analyze_screen_change_cooldown(self, detector):
        """Test cooldown prevents spam."""
        detector.last_interruption_time = time.time()  # Just interrupted
        
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
        
        event = detector.analyze_screen_change(
            current=current,
            previous=previous,
            session_goal="Write tests",
            session_duration_minutes=5.0
        )
        
        assert event is None  # Should be None due to cooldown

    def test_detect_inactivity_no_alert(self, detector):
        """Test inactivity detection - no alert."""
        last_activity = time.time() - 60  # 1 minute ago
        
        event = detector.detect_inactivity(last_activity)
        
        assert event is None

    def test_detect_inactivity_alert(self, detector):
        """Test inactivity detection - alert triggered."""
        last_activity = time.time() - 400  # Over 5 minutes ago
        
        event = detector.detect_inactivity(last_activity)
        
        assert event is not None
        assert event.event_type == InterruptionType.PROLONGED_INACTIVITY
        assert event.urgency == InterruptionUrgency.MEDIUM

    def test_detect_session_end_warning(self, detector):
        """Test session end warning."""
        event = detector.detect_session_end(298)  # Just under 5 minutes
        
        assert event is not None
        assert event.event_type == InterruptionType.SESSION_COMPLETE
        assert "5 minutes left" in event.message

    def test_detect_session_end_complete(self, detector):
        """Test session complete detection."""
        event = detector.detect_session_end(0)
        
        assert event is not None
        assert event.event_type == InterruptionType.SESSION_COMPLETE
        assert event.urgency == InterruptionUrgency.HIGH
        assert "Time's up" in event.message

    def test_detect_session_end_no_alert(self, detector):
        """Test no alert when not near end."""
        event = detector.detect_session_end(600)  # 10 minutes left
        
        assert event is None

    def test_calculate_distracted_duration(self, detector):
        """Test distracted duration calculation."""
        # Add 3 distracted analyses
        for _ in range(3):
            detector.recent_analyses.append(ScreenAnalysis(
                activity_type=ActivityType.DISTRACTED,
                application_category=ApplicationCategory.SOCIAL_MEDIA,
                primary_app="Twitter",
                description="Scrolling",
                confidence=0.9,
                is_off_task=True,
                suggestions=[]
            ))
        
        duration = detector._calculate_distracted_duration()
        
        assert duration == 90.0  # 3 * 30 seconds

    def test_count_recent_app_switches(self, detector):
        """Test app switch counting."""
        apps = ["VS Code", "Chrome", "VS Code", "Slack", "VS Code"]
        for app in apps:
            detector.recent_analyses.append(ScreenAnalysis(
                activity_type=ActivityType.PRODUCTIVE,
                application_category=ApplicationCategory.PRODUCTIVITY,
                primary_app=app,
                description="Working",
                confidence=0.9,
                is_off_task=False,
                suggestions=[]
            ))
        
        switches = detector._count_recent_app_switches()
        
        assert switches == 4  # Switches between consecutive different apps

    def test_should_allow_interruption_critical(self, detector):
        """Test always allowing critical interruptions."""
        event = InterruptionEvent(
            event_type=InterruptionType.SESSION_COMPLETE,
            urgency=InterruptionUrgency.CRITICAL,
            message="Critical!"
        )
        
        decision = detector.should_allow_interruption(
            event=event,
            current_focus_state="focused",
            time_since_last_interruption=1000
        )
        
        assert decision.should_interrupt is True
        assert decision.action == InterruptionDecision.ACTION_IMMEDIATE

    def test_should_allow_interruption_focused_user(self, detector):
        """Test handling interruptions when user is focused."""
        event = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.MEDIUM,
            message="Distraction detected"
        )
        
        decision = detector.should_allow_interruption(
            event=event,
            current_focus_state="focused",
            time_since_last_interruption=1000
        )
        
        assert decision.should_interrupt is False
        assert decision.action == InterruptionDecision.ACTION_QUEUE

    def test_should_allow_interruption_distracted_user(self, detector):
        """Test handling interruptions when user is distracted."""
        event = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.HIGH,
            message="Still distracted"
        )
        
        decision = detector.should_allow_interruption(
            event=event,
            current_focus_state="distracted",
            time_since_last_interruption=200  # Over 2 minutes
        )
        
        assert decision.should_interrupt is True
        assert decision.action == InterruptionDecision.ACTION_GENTLE

    def test_should_allow_interruption_high_urgency(self, detector):
        """Test allowing high urgency interruptions."""
        event = InterruptionEvent(
            event_type=InterruptionType.OFF_TASK,
            urgency=InterruptionUrgency.HIGH,
            message="Off task!"
        )
        
        decision = detector.should_allow_interruption(
            event=event,
            current_focus_state="unknown",
            time_since_last_interruption=1000
        )
        
        assert decision.should_interrupt is True
        assert decision.action == InterruptionDecision.ACTION_IMMEDIATE

    def test_get_interruption_stats_empty(self, detector):
        """Test stats with no interruptions."""
        stats = detector.get_interruption_stats()
        
        assert stats["total_interruptions"] == 0
        assert stats["by_type"] == {}
        assert stats["by_urgency"] == {}
        assert stats["handled_percentage"] == 0

    def test_get_interruption_stats_with_data(self, detector):
        """Test stats with interruptions."""
        # Add some interruptions
        detector.interruption_history = [
            InterruptionEvent(
                event_type=InterruptionType.DISTRACTION,
                urgency=InterruptionUrgency.HIGH,
                message="Test",
                handled=True
            ),
            InterruptionEvent(
                event_type=InterruptionType.OFF_TASK,
                urgency=InterruptionUrgency.MEDIUM,
                message="Test 2",
                handled=False
            )
        ]
        
        stats = detector.get_interruption_stats()
        
        assert stats["total_interruptions"] == 2
        assert stats["by_type"]["distraction"] == 1
        assert stats["by_type"]["off_task"] == 1
        assert stats["by_urgency"]["high"] == 1
        assert stats["by_urgency"]["medium"] == 1
        assert stats["handled_percentage"] == 50.0


class TestInterruptionQueue:
    """Test suite for InterruptionQueue."""

    @pytest.fixture
    def queue(self):
        """Create an InterruptionQueue instance."""
        return InterruptionQueue(max_size=3)

    def test_initialization(self, queue):
        """Test queue initialization."""
        assert len(queue) == 0
        assert queue.max_size == 3

    def test_add_event(self, queue):
        """Test adding events to queue."""
        event = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.MEDIUM,
            message="Test"
        )
        
        queue.add(event)
        
        assert len(queue) == 1

    def test_add_exceeds_max_size(self, queue):
        """Test queue size limit."""
        for i in range(5):
            event = InterruptionEvent(
                event_type=InterruptionType.DISTRACTION,
                urgency=InterruptionUrgency.MEDIUM,
                message=f"Test {i}"
            )
            queue.add(event)
        
        assert len(queue) == 3  # Max size

    def test_get_next(self, queue):
        """Test getting next event from queue."""
        event1 = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.MEDIUM,
            message="First"
        )
        event2 = InterruptionEvent(
            event_type=InterruptionType.OFF_TASK,
            urgency=InterruptionUrgency.HIGH,
            message="Second"
        )
        
        queue.add(event1)
        queue.add(event2)
        
        next_event = queue.get_next()
        
        assert next_event is event1
        assert len(queue) == 1

    def test_get_next_empty(self, queue):
        """Test getting next from empty queue."""
        next_event = queue.get_next()
        
        assert next_event is None

    def test_peek(self, queue):
        """Test peeking at next event."""
        event = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.MEDIUM,
            message="Test"
        )
        
        queue.add(event)
        
        peeked = queue.peek()
        
        assert peeked is event
        assert len(queue) == 1  # Not removed

    def test_clear(self, queue):
        """Test clearing the queue."""
        event = InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.MEDIUM,
            message="Test"
        )
        
        queue.add(event)
        queue.clear()
        
        assert len(queue) == 0
