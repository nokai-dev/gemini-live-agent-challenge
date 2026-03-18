"""Tests for WebSocket handlers."""
import pytest
import asyncio
import json
import base64
from unittest.mock import Mock, AsyncMock, patch, MagicMock, call
from fastapi import WebSocket, WebSocketDisconnect

from backend.api.websocket import (
    ConnectionManager, handle_focus_session
)
from backend.models.session import FocusSession, SessionState


class TestConnectionManager:
    """Test suite for ConnectionManager."""

    @pytest.fixture
    def manager(self):
        """Create a ConnectionManager instance."""
        return ConnectionManager()

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket."""
        ws = AsyncMock()
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        ws.receive_json = AsyncMock()
        ws.close = AsyncMock()
        return ws

    @pytest.mark.asyncio
    async def test_connect(self, manager, mock_websocket):
        """Test new connection."""
        connection_id = await manager.connect(mock_websocket)
        
        assert connection_id is not None
        assert len(connection_id) > 0
        assert connection_id in manager.active_connections
        assert connection_id in manager.last_activity
        mock_websocket.accept.assert_called_once()

    def test_disconnect(self, manager, mock_websocket):
        """Test disconnection cleanup."""
        # First connect
        import asyncio
        connection_id = asyncio.run(manager.connect(mock_websocket))
        
        # Then disconnect
        manager.disconnect(connection_id)
        
        assert connection_id not in manager.active_connections
        assert connection_id not in manager.last_activity

    def test_update_activity(self, manager, mock_websocket):
        """Test updating activity timestamp."""
        import asyncio
        import time
        
        connection_id = asyncio.run(manager.connect(mock_websocket))
        old_time = manager.last_activity[connection_id]
        
        # Wait a tiny bit
        time.sleep(0.01)
        manager.update_activity(connection_id)
        
        assert manager.last_activity[connection_id] > old_time

    @pytest.mark.asyncio
    async def test_send_message(self, manager, mock_websocket):
        """Test sending message to connection."""
        connection_id = await manager.connect(mock_websocket)
        
        message = {"type": "test", "data": "hello"}
        await manager.send_message(connection_id, message)
        
        mock_websocket.send_json.assert_called_with(message)

    @pytest.mark.asyncio
    async def test_send_message_error(self, manager, mock_websocket):
        """Test handling send error."""
        connection_id = await manager.connect(mock_websocket)
        mock_websocket.send_json = AsyncMock(side_effect=Exception("Send failed"))
        
        message = {"type": "test"}
        # Should not raise
        await manager.send_message(connection_id, message)

    @pytest.mark.asyncio
    async def test_broadcast(self, manager, mock_websocket):
        """Test broadcasting to all connections."""
        # Create multiple connections
        ws1 = AsyncMock()
        ws1.accept = AsyncMock()
        ws1.send_json = AsyncMock()
        
        ws2 = AsyncMock()
        ws2.accept = AsyncMock()
        ws2.send_json = AsyncMock()
        
        id1 = await manager.connect(ws1)
        id2 = await manager.connect(ws2)
        
        message = {"type": "broadcast"}
        await manager.broadcast(message)
        
        ws1.send_json.assert_called_with(message)
        ws2.send_json.assert_called_with(message)


class TestHandleFocusSession:
    """Test suite for handle_focus_session."""

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket."""
        ws = AsyncMock()
        ws.accept = AsyncMock()
        ws.send_json = AsyncMock()
        ws.receive_json = AsyncMock()
        ws.close = AsyncMock()
        return ws

    @pytest.mark.asyncio
    async def test_handle_connect_message(self, mock_websocket):
        """Test handling connect message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = False
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                # Simulate receiving connect message
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent connected message
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "connected"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_connect_no_api_key(self, mock_websocket):
        """Test handling connect without API key."""
        with patch('backend.api.websocket.settings') as mock_settings:
            mock_settings.GEMINI_API_KEY = ""
            
            mock_websocket.receive_json = AsyncMock(side_effect=[
                {"type": "connect"},
                WebSocketDisconnect()
            ])
            
            await handle_focus_session(mock_websocket)
            
            # Should have sent error message
            calls = mock_websocket.send_json.call_args_list
            assert any(
                call[0][0].get("type") == "error"
                for call in calls
            )

    @pytest.mark.asyncio
    async def test_handle_start_session(self, mock_websocket):
        """Test handling start_session message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.send_text = AsyncMock()
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "start_session", "duration_minutes": 25, "goal": "Test"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent session_started message
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "session_started"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_pause_session(self, mock_websocket):
        """Test handling pause_session message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.send_text = AsyncMock()
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "start_session", "duration_minutes": 25, "goal": "Test"},
                    {"type": "pause_session"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent session_paused message
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "session_paused"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_resume_session(self, mock_websocket):
        """Test handling resume_session message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.send_text = AsyncMock()
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "start_session", "duration_minutes": 25, "goal": "Test"},
                    {"type": "pause_session"},
                    {"type": "resume_session"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent session_resumed message
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "session_resumed"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_end_session(self, mock_websocket):
        """Test handling end_session message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.send_text = AsyncMock()
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "start_session", "duration_minutes": 25, "goal": "Test"},
                    {"type": "end_session"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent session_ended message
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "session_ended"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_audio_message(self, mock_websocket):
        """Test handling audio message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.send_audio = AsyncMock()
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                audio_data = base64.b64encode(b"test audio").decode()
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "audio", "data": audio_data},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Audio should have been sent to Gemini
                mock_client.send_audio.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_text_message(self, mock_websocket):
        """Test handling text message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.send_text = AsyncMock()
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "text", "text": "Hello"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Text should have been sent to Gemini
                mock_client.send_text.assert_called_with("Hello")

    @pytest.mark.asyncio
    async def test_handle_ping(self, mock_websocket):
        """Test handling ping message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "ping"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent pong
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0] == {"type": "pong"}
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_unknown_message_type(self, mock_websocket):
        """Test handling unknown message type."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "unknown_type"},
                    WebSocketDisconnect()
                ])
                
                # Should not raise
                await handle_focus_session(mock_websocket)

    @pytest.mark.asyncio
    async def test_handle_screen_analysis(self, mock_websocket):
        """Test handling screen_analysis message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.CachedVisionAnalyzer') as mock_cached:
                with patch('backend.api.websocket.settings') as mock_settings:
                    mock_settings.GEMINI_API_KEY = "test-key"
                    mock_settings.MAX_SCREEN_IMAGE_SIZE = 5 * 1024 * 1024
                    
                    mock_client = Mock()
                    mock_client.is_connected = True
                    mock_client.connect = AsyncMock(return_value=True)
                    mock_client.send_text = AsyncMock()
                    mock_client.set_audio_callback = Mock()
                    mock_client.set_text_callback = Mock()
                    mock_gemini.return_value = mock_client
                    
                    # Mock cached vision analyzer
                    mock_analyzer = Mock()
                    from backend.services.vision_analyzer import ScreenAnalysis, ActivityType, ApplicationCategory
                    mock_analyzer.analyze_screen = AsyncMock(return_value=(
                        ScreenAnalysis(
                            activity_type=ActivityType.PRODUCTIVE,
                            application_category=ApplicationCategory.PRODUCTIVITY,
                            primary_app="VS Code",
                            description="Coding",
                            confidence=0.9,
                            is_off_task=False,
                            suggestions=[]
                        ),
                        {"cached": False, "cache_stats": {"hit_rate_percent": 0}}
                    ))
                    mock_cached.return_value = mock_analyzer
                    
                    image_data = base64.b64encode(b"fake image").decode()
                    mock_websocket.receive_json = AsyncMock(side_effect=[
                        {"type": "connect"},
                        {"type": "start_session", "duration_minutes": 25, "goal": "Test"},
                        {"type": "screen_analysis", "image_data": image_data, "current_goal": "Test"},
                        WebSocketDisconnect()
                    ])
                    
                    await handle_focus_session(mock_websocket)
                    
                    # Screen analysis should have been processed
                    mock_analyzer.analyze_screen.assert_called_once()

    @pytest.mark.asyncio
    async def test_handle_screen_analysis_too_large(self, mock_websocket):
        """Test handling oversized screen image."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                mock_settings.MAX_SCREEN_IMAGE_SIZE = 100  # Very small limit
                
                mock_client = Mock()
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                # Create large image data
                large_image = base64.b64encode(b"x" * 1000).decode()
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "screen_analysis", "image_data": large_image, "current_goal": "Test"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent error message
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "error"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_handle_get_session_status(self, mock_websocket):
        """Test handling get_session_status message."""
        with patch('backend.api.websocket.GeminiLiveClient') as mock_gemini:
            with patch('backend.api.websocket.settings') as mock_settings:
                mock_settings.GEMINI_API_KEY = "test-key"
                
                mock_client = Mock()
                mock_client.is_connected = True
                mock_client.connect = AsyncMock(return_value=True)
                mock_client.set_audio_callback = Mock()
                mock_client.set_text_callback = Mock()
                mock_gemini.return_value = mock_client
                
                mock_websocket.receive_json = AsyncMock(side_effect=[
                    {"type": "connect"},
                    {"type": "start_session", "duration_minutes": 25, "goal": "Test"},
                    {"type": "get_session_status"},
                    WebSocketDisconnect()
                ])
                
                await handle_focus_session(mock_websocket)
                
                # Should have sent session_status
                calls = mock_websocket.send_json.call_args_list
                assert any(
                    call[0][0].get("type") == "session_status"
                    for call in calls
                )

    @pytest.mark.asyncio
    async def test_websocket_disconnect(self, mock_websocket):
        """Test handling WebSocket disconnect."""
        mock_websocket.receive_json = AsyncMock(side_effect=WebSocketDisconnect())
        
        # Should not raise
        await handle_focus_session(mock_websocket)

    @pytest.mark.asyncio
    async def test_websocket_error(self, mock_websocket):
        """Test handling WebSocket error."""
        mock_websocket.receive_json = AsyncMock(side_effect=Exception("Connection error"))
        
        # Should not raise
        await handle_focus_session(mock_websocket)
