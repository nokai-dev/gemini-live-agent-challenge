"""Interruption detection and handling service."""
import time
import logging
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, field
from enum import Enum

from .vision_analyzer import ScreenAnalysis, ActivityType, ApplicationCategory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InterruptionUrgency(Enum):
    """Urgency levels for interruptions."""
    CRITICAL = "critical"    # Immediate attention required
    HIGH = "high"           # Should interrupt soon
    MEDIUM = "medium"       # Can wait a moment
    LOW = "low"             # Queue for later
    IGNORE = "ignore"       # Don't interrupt


class InterruptionType(Enum):
    """Types of interruptions."""
    SCREEN_CHANGE = "screen_change"      # User switched applications
    OFF_TASK = "off_task"                # User is off-task
    DISTRACTION = "distraction"          # User on distracting site
    CALENDAR = "calendar"                # Calendar event approaching
    NOTIFICATION = "notification"        # External notification
    USER_REQUEST = "user_request"        # User asked for something
    SESSION_COMPLETE = "session_complete"  # Timer finished
    PROLONGED_INACTIVITY = "inactivity"  # User inactive for long


@dataclass
class InterruptionEvent:
    """Represents an interruption event."""
    event_type: InterruptionType
    urgency: InterruptionUrgency
    message: str
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)
    handled: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.event_type.value,
            "urgency": self.urgency.value,
            "message": self.message,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
            "handled": self.handled
        }


@dataclass
class InterruptionDecision:
    """Decision on how to handle an interruption."""
    should_interrupt: bool
    action: str
    message: str
    delay_seconds: float = 0.0
    
    # Actions
    ACTION_IMMEDIATE = "immediate"      # Interrupt now
    ACTION_DELAYED = "delayed"          # Interrupt after delay
    ACTION_QUEUE = "queue"              # Add to queue
    ACTION_IGNORE = "ignore"            # Don't interrupt
    ACTION_GENTLE = "gentle"            # Gentle reminder only


class InterruptionDetector:
    """Detects and classifies interruptions based on multiple signals."""
    
    def __init__(self):
        self.recent_analyses: List[ScreenAnalysis] = []
        self.max_history = 10
        self.interruption_history: List[InterruptionEvent] = []
        
        # Thresholds
        self.distraction_threshold_seconds = 120  # 2 minutes off-task
        self.inactivity_threshold_seconds = 300  # 5 minutes inactive
        
        # Cooldowns to prevent spam
        self.last_interruption_time = 0
        self.interruption_cooldown = 30  # seconds
        
    def analyze_screen_change(
        self,
        current: ScreenAnalysis,
        previous: Optional[ScreenAnalysis],
        session_goal: str,
        session_duration_minutes: float
    ) -> Optional[InterruptionEvent]:
        """Analyze a screen change for potential interruption.
        
        Args:
            current: Current screen analysis
            previous: Previous screen analysis
            session_goal: User's stated goal
            session_duration_minutes: How long session has been running
            
        Returns:
            InterruptionEvent if interruption detected, None otherwise
        """
        # Store history
        self.recent_analyses.append(current)
        if len(self.recent_analyses) > self.max_history:
            self.recent_analyses.pop(0)
        
        # Check cooldown
        current_time = time.time()
        if current_time - self.last_interruption_time < self.interruption_cooldown:
            return None
        
        # Analyze different scenarios
        
        # 1. User switched to distracting app
        if current.activity_type == ActivityType.DISTRACTED:
            if previous and previous.activity_type != ActivityType.DISTRACTED:
                # Just became distracted
                self.last_interruption_time = current_time
                return InterruptionEvent(
                    event_type=InterruptionType.DISTRACTION,
                    urgency=InterruptionUrgency.MEDIUM,
                    message=f"I see you've opened {current.primary_app}. Is this part of your focus goal?",
                    metadata={
                        "app": current.primary_app,
                        "category": current.application_category.value,
                        "previous_app": previous.primary_app if previous else None
                    }
                )
            else:
                # Still distracted - check duration
                distracted_duration = self._calculate_distracted_duration()
                if distracted_duration > self.distraction_threshold_seconds:
                    self.last_interruption_time = current_time
                    return InterruptionEvent(
                        event_type=InterruptionType.OFF_TASK,
                        urgency=InterruptionUrgency.HIGH,
                        message=f"You've been on {current.primary_app} for a while. Want to get back to {session_goal}?",
                        metadata={
                            "app": current.primary_app,
                            "distracted_duration_seconds": distracted_duration
                        }
                    )
        
        # 2. User is off-task from goal
        if current.is_off_task and session_goal:
            # Check if this is a new off-task state
            if previous and not previous.is_off_task:
                self.last_interruption_time = current_time
                return InterruptionEvent(
                    event_type=InterruptionType.OFF_TASK,
                    urgency=InterruptionUrgency.MEDIUM,
                    message=f"I notice you've switched to {current.primary_app}. Remember, you're working on: {session_goal}",
                    metadata={
                        "current_app": current.primary_app,
                        "goal": session_goal
                    }
                )
        
        # 3. Check for app switching (context switching)
        if previous and current.primary_app != previous.primary_app:
            # Count recent app switches
            switches = self._count_recent_app_switches()
            if switches >= 3:
                self.last_interruption_time = current_time
                return InterruptionEvent(
                    event_type=InterruptionType.SCREEN_CHANGE,
                    urgency=InterruptionUrgency.LOW,
                    message="You've been switching apps a lot. Want to settle into one task?",
                    metadata={
                        "app_switches": switches,
                        "current_app": current.primary_app
                    }
                )
        
        return None
    
    def detect_inactivity(self, last_activity_time: float) -> Optional[InterruptionEvent]:
        """Detect if user has been inactive for too long.
        
        Args:
            last_activity_time: Timestamp of last user activity
            
        Returns:
            InterruptionEvent if inactive too long, None otherwise
        """
        inactive_duration = time.time() - last_activity_time
        
        if inactive_duration > self.inactivity_threshold_seconds:
            return InterruptionEvent(
                event_type=InterruptionType.PROLONGED_INACTIVITY,
                urgency=InterruptionUrgency.MEDIUM,
                message="You haven't been active for a while. Everything okay?",
                metadata={
                    "inactive_seconds": inactive_duration
                }
            )
        
        return None
    
    def detect_session_end(self, remaining_seconds: float) -> Optional[InterruptionEvent]:
        """Detect when session is about to end.
        
        Args:
            remaining_seconds: Seconds remaining in session
            
        Returns:
            InterruptionEvent if session ending soon, None otherwise
        """
        # Warn when 5 minutes remaining
        if 295 < remaining_seconds <= 300:
            return InterruptionEvent(
                event_type=InterruptionType.SESSION_COMPLETE,
                urgency=InterruptionUrgency.LOW,
                message="5 minutes left in your session. Want to wrap up what you're working on?",
                metadata={"remaining_seconds": remaining_seconds}
            )
        
        # Session complete
        if remaining_seconds <= 0:
            return InterruptionEvent(
                event_type=InterruptionType.SESSION_COMPLETE,
                urgency=InterruptionUrgency.HIGH,
                message="Time's up! Great work on your focus session.",
                metadata={"remaining_seconds": 0}
            )
        
        return None
    
    def _calculate_distracted_duration(self) -> float:
        """Calculate how long user has been distracted."""
        if not self.recent_analyses:
            return 0.0
        
        # Count consecutive distracted analyses
        distracted_count = 0
        for analysis in reversed(self.recent_analyses):
            if analysis.activity_type == ActivityType.DISTRACTED:
                distracted_count += 1
            else:
                break
        
        # Estimate duration (assuming ~30s between captures)
        return distracted_count * 30.0
    
    def _count_recent_app_switches(self) -> int:
        """Count recent application switches."""
        if len(self.recent_analyses) < 2:
            return 0
        
        switches = 0
        for i in range(1, len(self.recent_analyses)):
            if self.recent_analyses[i].primary_app != self.recent_analyses[i-1].primary_app:
                switches += 1
        
        return switches
    
    def should_allow_interruption(
        self,
        event: InterruptionEvent,
        current_focus_state: str,  # 'focused', 'distracted', 'unknown'
        time_since_last_interruption: float
    ) -> InterruptionDecision:
        """Decide whether to allow an interruption based on context.
        
        Args:
            event: The interruption event
            current_focus_state: Current focus state
            time_since_last_interruption: Seconds since last interruption
            
        Returns:
            InterruptionDecision with action to take
        """
        # Always allow critical interruptions
        if event.urgency == InterruptionUrgency.CRITICAL:
            return InterruptionDecision(
                should_interrupt=True,
                action=InterruptionDecision.ACTION_IMMEDIATE,
                message=event.message,
                delay_seconds=0
            )
        
        # Don't interrupt if user is already distracted
        if current_focus_state == 'distracted':
            # But do interrupt if it's been a while
            if time_since_last_interruption > 120:  # 2 minutes
                return InterruptionDecision(
                    should_interrupt=True,
                    action=InterruptionDecision.ACTION_GENTLE,
                    message=event.message,
                    delay_seconds=5
                )
            return InterruptionDecision(
                should_interrupt=False,
                action=InterruptionDecision.ACTION_QUEUE,
                message=event.message
            )
        
        # Don't interrupt if user is deeply focused
        if current_focus_state == 'focused':
            # Only high urgency interruptions
            if event.urgency in [InterruptionUrgency.HIGH, InterruptionUrgency.CRITICAL]:
                return InterruptionDecision(
                    should_interrupt=True,
                    action=InterruptionDecision.ACTION_DELAYED,
                    message=event.message,
                    delay_seconds=10  # Wait 10s to not break flow
                )
            return InterruptionDecision(
                should_interrupt=False,
                action=InterruptionDecision.ACTION_QUEUE,
                message=event.message
            )
        
        # Default: allow medium and high urgency
        if event.urgency in [InterruptionUrgency.HIGH, InterruptionUrgency.MEDIUM]:
            return InterruptionDecision(
                should_interrupt=True,
                action=InterruptionDecision.ACTION_IMMEDIATE,
                message=event.message,
                delay_seconds=0
            )
        
        # Low urgency: queue for later
        return InterruptionDecision(
            should_interrupt=False,
            action=InterruptionDecision.ACTION_QUEUE,
            message=event.message
        )
    
    def get_interruption_stats(self) -> Dict[str, Any]:
        """Get statistics about interruptions."""
        if not self.interruption_history:
            return {
                "total_interruptions": 0,
                "by_type": {},
                "by_urgency": {},
                "handled_percentage": 0
            }
        
        total = len(self.interruption_history)
        by_type = {}
        by_urgency = {}
        handled = 0
        
        for event in self.interruption_history:
            by_type[event.event_type.value] = by_type.get(event.event_type.value, 0) + 1
            by_urgency[event.urgency.value] = by_urgency.get(event.urgency.value, 0) + 1
            if event.handled:
                handled += 1
        
        return {
            "total_interruptions": total,
            "by_type": by_type,
            "by_urgency": by_urgency,
            "handled_percentage": (handled / total * 100) if total > 0 else 0
        }


class InterruptionQueue:
    """Queue for non-urgent interruptions."""
    
    def __init__(self, max_size: int = 10):
        self.queue: List[InterruptionEvent] = []
        self.max_size = max_size
        
    def add(self, event: InterruptionEvent):
        """Add an event to the queue."""
        if len(self.queue) >= self.max_size:
            self.queue.pop(0)  # Remove oldest
        self.queue.append(event)
        
    def get_next(self) -> Optional[InterruptionEvent]:
        """Get the next event from the queue."""
        if not self.queue:
            return None
        return self.queue.pop(0)
    
    def peek(self) -> Optional[InterruptionEvent]:
        """Peek at next event without removing."""
        if not self.queue:
            return None
        return self.queue[0]
    
    def clear(self):
        """Clear the queue."""
        self.queue.clear()
        
    def __len__(self) -> int:
        return len(self.queue)