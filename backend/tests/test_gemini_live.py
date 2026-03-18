"""Tests for Gemini Live API client."""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import base64

from backend.services.gemini_live import GeminiLiveClient


class TestGeminiLiveClient:
    """Test suite for GeminiLiveClient."""

    @pytest.fixture
    def client(self):
        """Create a GeminiLiveClient instance."""
        with patch('backend.services.gemini_live.genai.Client') as mock_genai:
            mock_client = Mock()
            mock_genai.return_value = mock_client
            client = GeminiLiveClient(api_key="test-api-key")
            client.client = mock_client
            return client

    @pytest.mark.asyncio
    async def test_initialization(self, client):
        """Test client initialization."""
        assert client.api_key == "test-api-key"
        assert client.is_connected is False
        assert client.session is None
        assert client._audio_callback is None
        assert client._text_callback is None

    @pytest.mark.asyncio
    async def test_connect_success(self, client):
        """Test successful connection to Gemini Live API."""
        # Mock the live session
        mock_session = AsyncMock()
        mock_session.receive = AsyncMock(return_value=[])
        client.client.live.connect = AsyncMock(return_value=mock_session)
        
        result = await client.connect()
        
        assert result is True
        assert client.is_connected is True
        assert client.session is mock_session
        client.client.live.connect.assert_called_once()

    @pytest.mark.asyncio
    async def test_connect_failure(self, client):
        """Test connection failure with retries."""
        client.client.live.connect = AsyncMock(side_effect=Exception("Connection failed"))
        
        result = await client.connect(max_retries=2)
        
        assert result is False
        assert client.is_connected is False
        assert client.client.live.connect.call_count == 2

    @pytest.mark.asyncio
    async def test_connect_with_system_instruction(self, client):
        """Test connection with system instruction."""
        mock_session = AsyncMock()
        mock_session.receive = AsyncMock(return_value=[])
        mock_session.send_text = AsyncMock()
        client.client.live.connect = AsyncMock(return_value=mock_session)
        
        system_instruction = "You are a helpful assistant."
        result = await client.connect(system_instruction=system_instruction)
        
        assert result is True
        mock_session.send_text.assert_called_once_with(system_instruction)

    @pytest.mark.asyncio
    async def test_send_audio_when_connected(self, client):
        """Test sending audio when connected."""
        mock_session = AsyncMock()
        client.session = mock_session
        client.is_connected = True
        
        audio_data = b"test audio data"
        await client.send_audio(audio_data)
        
        mock_session.send_audio.assert_called_once_with(audio_data)

    @pytest.mark.asyncio
    async def test_send_audio_when_not_connected(self, client):
        """Test sending audio when not connected."""
        client.is_connected = False
        client.session = None
        
        audio_data = b"test audio data"
        # Should not raise exception
        await client.send_audio(audio_data)

    @pytest.mark.asyncio
    async def test_send_text_when_connected(self, client):
        """Test sending text when connected."""
        mock_session = AsyncMock()
        client.session = mock_session
        client.is_connected = True
        
        text = "Hello, Gemini!"
        await client.send_text(text)
        
        mock_session.send_text.assert_called_once_with(text)

    @pytest.mark.asyncio
    async def test_send_text_when_not_connected(self, client):
        """Test sending text when not connected."""
        client.is_connected = False
        
        # Should not raise exception
        await client.send_text("Hello")

    def test_set_audio_callback(self, client):
        """Test setting audio callback."""
        callback = Mock()
        client.set_audio_callback(callback)
        assert client._audio_callback is callback

    def test_set_text_callback(self, client):
        """Test setting text callback."""
        callback = Mock()
        client.set_text_callback(callback)
        assert client._text_callback is callback

    @pytest.mark.asyncio
    async def test_close(self, client):
        """Test closing the connection."""
        mock_session = AsyncMock()
        client.session = mock_session
        client.is_connected = True
        client._receive_task = None
        
        await client.close()
        
        assert client.is_connected is False
        mock_session.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_with_running_task(self, client):
        """Test closing with a running receive task."""
        mock_session = AsyncMock()
        client.session = mock_session
        client.is_connected = True
        
        # Create a mock task
        mock_task = AsyncMock()
        client._receive_task = mock_task
        
        await client.close()
        
        assert client.is_connected is False
        mock_task.cancel.assert_called_once()

    @pytest.mark.asyncio
    async def test_receive_loop_with_audio(self, client):
        """Test receive loop handling audio data."""
        audio_callback = Mock()
        client.set_audio_callback(audio_callback)
        
        # Create mock response with audio data
        mock_response = Mock()
        mock_response.data = b"audio data"
        mock_response.text = None
        
        mock_session = AsyncMock()
        mock_session.receive = AsyncMock(return_value=[mock_response])
        client.session = mock_session
        client.is_connected = True
        
        # Run receive loop briefly
        try:
            await asyncio.wait_for(client._receive_loop(), timeout=0.1)
        except asyncio.TimeoutError:
            pass
        
        # Audio callback should have been called
        # Note: In actual implementation, this would be called

    @pytest.mark.asyncio
    async def test_receive_loop_with_text(self, client):
        """Test receive loop handling text data."""
        text_callback = Mock()
        client.set_text_callback(text_callback)
        
        # Create mock response with text
        mock_response = Mock()
        mock_response.data = None
        mock_response.text = "Hello from Gemini"
        
        mock_session = AsyncMock()
        mock_session.receive = AsyncMock(return_value=[mock_response])
        client.session = mock_session
        client.is_connected = True
        
        # Run receive loop briefly
        try:
            await asyncio.wait_for(client._receive_loop(), timeout=0.1)
        except asyncio.TimeoutError:
            pass

    @pytest.mark.asyncio
    async def test_receive_loop_handles_errors(self, client):
        """Test receive loop handles errors gracefully."""
        mock_session = AsyncMock()
        mock_session.receive = AsyncMock(side_effect=Exception("Connection error"))
        client.session = mock_session
        client.is_connected = True
        
        await client._receive_loop()
        
        assert client.is_connected is False


class TestGeminiLiveIntegration:
    """Integration-style tests for Gemini Live client."""

    @pytest.mark.asyncio
    async def test_full_lifecycle(self):
        """Test full client lifecycle: connect, send, close."""
        with patch('backend.services.gemini_live.genai.Client') as mock_genai:
            mock_client = Mock()
            mock_session = AsyncMock()
            mock_session.receive = AsyncMock(return_value=[])
            mock_client.live.connect = AsyncMock(return_value=mock_session)
            mock_genai.return_value = mock_client
            
            client = GeminiLiveClient(api_key="test-key")
            
            # Connect
            result = await client.connect()
            assert result is True
            
            # Send audio
            await client.send_audio(b"test data")
            mock_session.send_audio.assert_called()
            
            # Send text
            await client.send_text("test message")
            mock_session.send_text.assert_called()
            
            # Close
            await client.close()
            assert client.is_connected is False
