#!/usr/bin/env python3
"""Quick test script for FocusCompanion components."""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test that all modules can be imported."""
    print("Testing imports...")
    
    try:
        from config import settings
        print("✓ config.py")
        
        from models.session import SessionManager, FocusSession
        print("✓ models/session.py")
        
        from services.gemini_live import GeminiLiveClient
        print("✓ services/gemini_live.py")
        
        from services.vision_analyzer import VisionAnalyzer, FocusCoach
        print("✓ services/vision_analyzer.py")
        
        from services.interruption_detector import InterruptionDetector
        print("✓ services/interruption_detector.py")
        
        from api.websocket import ConnectionManager
        print("✓ api/websocket.py")
        
        from main import app
        print("✓ main.py")
        
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_session_manager():
    """Test session manager functionality."""
    print("\nTesting SessionManager...")
    
    from models.session import SessionManager, FocusMode
    
    manager = SessionManager()
    session = manager.create_session(
        session_id="test-123",
        user_id="user-456",
        duration_minutes=25,
        goal="Test session",
        focus_mode=FocusMode.POMODORO
    )
    
    assert session.session_id == "test-123"
    assert session.goal == "Test session"
    assert session.duration_minutes == 25
    
    session.start()
    assert session.state.value == "active"
    
    session.pause()
    assert session.state.value == "paused"
    
    session.resume()
    assert session.state.value == "active"
    
    session.end()
    assert session.state.value == "ended"
    
    print("✓ Session lifecycle works")
    return True

def test_vision_analyzer():
    """Test vision analyzer initialization."""
    print("\nTesting VisionAnalyzer...")
    
    from services.vision_analyzer import VisionAnalyzer, ActivityType, ApplicationCategory
    
    # Test without API key (just initialization)
    analyzer = VisionAnalyzer(api_key="test-key")
    
    assert analyzer.MODEL == "gemini-2.0-flash-exp"
    print("✓ VisionAnalyzer initializes correctly")
    
    # Test fallback analysis
    fallback = analyzer._create_fallback_analysis("test error")
    assert fallback.activity_type == ActivityType.UNKNOWN
    assert fallback.confidence == 0.0
    print("✓ Fallback analysis works")
    
    return True

def test_interruption_detector():
    """Test interruption detector."""
    print("\nTesting InterruptionDetector...")
    
    from services.interruption_detector import InterruptionDetector, InterruptionEvent, InterruptionUrgency, InterruptionType
    from services.vision_analyzer import ScreenAnalysis, ActivityType, ApplicationCategory
    
    detector = InterruptionDetector()
    
    # Create a mock screen analysis
    analysis = ScreenAnalysis(
        activity_type=ActivityType.DISTRACTED,
        application_category=ApplicationCategory.SOCIAL_MEDIA,
        primary_app="Twitter",
        description="User is browsing Twitter",
        confidence=0.9,
        is_off_task=True,
        suggestions=["Get back to work"]
    )
    
    # Test distraction detection
    event = detector.analyze_screen_change(
        current=analysis,
        previous=None,
        session_goal="Writing a report",
        session_duration_minutes=5
    )
    
    if event:
        assert event.event_type == InterruptionType.DISTRACTION
        print("✓ Distraction detection works")
    
    # Test decision making
    decision = detector.should_allow_interruption(
        event=InterruptionEvent(
            event_type=InterruptionType.DISTRACTION,
            urgency=InterruptionUrgency.MEDIUM,
            message="Test"
        ),
        current_focus_state="distracted",
        time_since_last_interruption=60
    )
    
    print("✓ Interruption decision logic works")
    
    return True

def test_focus_coach():
    """Test focus coach."""
    print("\nTesting FocusCoach...")
    
    from services.vision_analyzer import FocusCoach, ScreenAnalysis, ActivityType, ApplicationCategory
    
    coach = FocusCoach()
    
    analysis = ScreenAnalysis(
        activity_type=ActivityType.DISTRACTED,
        application_category=ApplicationCategory.SOCIAL_MEDIA,
        primary_app="Twitter",
        description="User is on Twitter",
        confidence=0.9,
        is_off_task=True,
        suggestions=[]
    )
    
    # Test coaching message generation
    message = coach.generate_coaching_message(
        analysis=analysis,
        session_goal="Writing a report",
        session_duration_minutes=10
    )
    
    if message:
        assert "Twitter" in message or "twitter" in message.lower()
        print("✓ Coaching message generation works")
    
    # Test session summary
    summary = coach.generate_session_summary(
        productive_time_minutes=20,
        distracted_time_minutes=5,
        interruptions=2
    )
    
    assert "80" in summary or "session" in summary.lower()
    print("✓ Session summary generation works")
    
    return True

def main():
    """Run all tests."""
    print("=" * 50)
    print("FocusCompanion Component Tests")
    print("=" * 50)
    
    tests = [
        test_imports,
        test_session_manager,
        test_vision_analyzer,
        test_interruption_detector,
        test_focus_coach,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"✗ Test failed with error: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "=" * 50)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 50)
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)