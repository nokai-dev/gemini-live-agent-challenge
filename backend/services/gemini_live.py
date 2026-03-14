"""Gemini Live API client for real-time voice interaction."""
import asyncio
import json
import base64
from typing import AsyncIterator, Optional, Callable
from google import genai
from google.genai import types
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GeminiLiveClient:
    """Client for Gemini Live API bidirectional streaming."""
    
    MODEL = "gemini-2.0-flash-live-api-preview-12-2025"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)
        self.session = None
        self.is_connected = False
        self._audio_callback: Optional[Callable[[bytes], None]] = None
        self._text_callback: Optional[Callable[[str], None]] = None
        self._receive_task: Optional[asyncio.Task] = None
        
    async def connect(self, system_instruction: Optional[str] = None) -> bool:
        """Establish connection to Gemini Live API.
        
        Args:
            system_instruction: Optional system prompt for the session
            
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Configure the live session
            config = types.LiveConnectConfig(
                response_modalities=[
                    "AUDIO",  # We want audio responses
                ],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Charon"  # Calm, focused voice
                        )
                    )
                ),
            )
            
            # Connect to Live API
            self.session = await self.client.live.connect(
                model=self.MODEL,
                config=config
            )
            
            self.is_connected = True
            logger.info("Connected to Gemini Live API")
            
            # Start receiving responses in background
            self._receive_task = asyncio.create_task(self._receive_loop())
            
            # Send system instruction if provided
            if system_instruction:
                await self.send_text(system_instruction)
                
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live API: {e}")
            self.is_connected = False
            return False
    
    async def _receive_loop(self):
        """Background task to receive responses from Gemini."""
        try:
            async for response in self.session.receive():
                if not self.is_connected:
                    break
                    
                # Handle audio data
                if response.data:
                    audio_data = response.data
                    if self._audio_callback:
                        try:
                            self._audio_callback(audio_data)
                        except Exception as e:
                            logger.error(f"Error in audio callback: {e}")
                
                # Handle text/interrupt signals
                if hasattr(response, 'text') and response.text:
                    logger.info(f"Received text: {response.text}")
                    if self._text_callback:
                        try:
                            self._text_callback(response.text)
                        except Exception as e:
                            logger.error(f"Error in text callback: {e}")
                            
        except Exception as e:
            logger.error(f"Error in receive loop: {e}")
            self.is_connected = False
    
    async def send_audio(self, audio_bytes: bytes):
        """Send audio data to Gemini.
        
        Args:
            audio_bytes: Raw PCM16 audio data at 16kHz
        """
        if not self.is_connected or not self.session:
            logger.warning("Cannot send audio: not connected")
            return
            
        try:
            # Send audio chunk to Gemini
            await self.session.send_audio(audio_bytes)
        except Exception as e:
            logger.error(f"Error sending audio: {e}")
    
    async def send_text(self, text: str):
        """Send text message to Gemini.
        
        Args:
            text: Text message to send
        """
        if not self.is_connected or not self.session:
            logger.warning("Cannot send text: not connected")
            return
            
        try:
            await self.session.send_text(text)
        except Exception as e:
            logger.error(f"Error sending text: {e}")
    
    def set_audio_callback(self, callback: Callable[[bytes], None]):
        """Set callback for received audio data.
        
        Args:
            callback: Function that receives audio bytes
        """
        self._audio_callback = callback
    
    def set_text_callback(self, callback: Callable[[str], None]):
        """Set callback for received text.
        
        Args:
            callback: Function that receives text string
        """
        self._text_callback = callback
    
    async def close(self):
        """Close the Gemini Live connection."""
        self.is_connected = False
        
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
            self._receive_task = None
        
        if self.session:
            try:
                await self.session.close()
            except Exception as e:
                logger.error(f"Error closing session: {e}")
            self.session = None
            
        logger.info("Disconnected from Gemini Live API")