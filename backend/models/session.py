"""Session models for FocusCompanion."""
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime
import time


class SessionState(Enum):
    """Focus session states."""
    IDLE = "idle"
    CONNECTING = "connecting"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"


class FocusMode(Enum):
    """Types of focus sessions."""
    DEEP_WORK = "deep_work"
    POMODORO = "pomodoro"
    FREE = "free"


@dataclass
class FocusSession:
    """Represents a focus session."""
    
    session_id: str
    user_id: str
    state: SessionState = SessionState.IDLE
    focus_mode: FocusMode = FocusMode.POMODORO
    
    # Session timing
    duration_minutes: int = 25
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    paused_at: Optional[float] = None
    total_paused_time: float = 0.0
    
    # Session content
    goal: str = ""
    interruptions: list = field(default_factory=list)
    
    # Metadata
    created_at: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def start(self):
        """Start the focus session."""
        self.state = SessionState.ACTIVE
        self.start_time = time.time()
        
    def pause(self):
        """Pause the session."""
        if self.state == SessionState.ACTIVE:
            self.state = SessionState.PAUSED
            self.paused_at = time.time()
    
    def resume(self):
        """Resume a paused session."""
        if self.state == SessionState.PAUSED and self.paused_at:
            self.total_paused_time += time.time() - self.paused_at
            self.paused_at = None
            self.state = SessionState.ACTIVE
    
    def end(self):
        """End the session."""
        self.state = SessionState.ENDED
        self.end_time = time.time()
    
    def get_elapsed_seconds(self) -> float:
        """Get elapsed time in seconds, accounting for pauses."""
        if not self.start_time:
            return 0.0
        
        elapsed = time.time() - self.start_time - self.total_paused_time
        
        # Subtract current pause time if paused
        if self.state == SessionState.PAUSED and self.paused_at:
            elapsed -= (time.time() - self.paused_at)
            
        return max(0.0, elapsed)
    
    def get_remaining_seconds(self) -> float:
        """Get remaining time in seconds."""
        total_seconds = self.duration_minutes * 60
        elapsed = self.get_elapsed_seconds()
        return max(0.0, total_seconds - elapsed)
    
    def is_complete(self) -> bool:
        """Check if session duration is complete."""
        return self.get_remaining_seconds() <= 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary."""
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "state": self.state.value,
            "focus_mode": self.focus_mode.value,
            "duration_minutes": self.duration_minutes,
            "goal": self.goal,
            "elapsed_seconds": self.get_elapsed_seconds(),
            "remaining_seconds": self.get_remaining_seconds(),
            "is_complete": self.is_complete(),
            "interruptions_count": len(self.interruptions),
        }


class SessionManager:
    """Manages active focus sessions."""
    
    def __init__(self):
        self.sessions: Dict[str, FocusSession] = {}
    
    def create_session(
        self,
        session_id: str,
        user_id: str,
        duration_minutes: int = 25,
        goal: str = "",
        focus_mode: FocusMode = FocusMode.POMODORO
    ) -> FocusSession:
        """Create a new focus session."""
        session = FocusSession(
            session_id=session_id,
            user_id=user_id,
            duration_minutes=duration_minutes,
            goal=goal,
            focus_mode=focus_mode
        )
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[FocusSession]:
        """Get a session by ID."""
        return self.sessions.get(session_id)
    
    def end_session(self, session_id: str) -> Optional[FocusSession]:
        """End a session and return it."""
        session = self.sessions.get(session_id)
        if session:
            session.end()
            # Keep in memory for now, could clean up later
        return session
    
    def cleanup_old_sessions(self, max_age_hours: float = 24.0):
        """Remove sessions older than max_age_hours."""
        cutoff = time.time() - (max_age_hours * 3600)
        to_remove = [
            sid for sid, session in self.sessions.items()
            if session.created_at < cutoff
        ]
        for sid in to_remove:
            del self.sessions[sid]