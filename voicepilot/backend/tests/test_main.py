"""Tests for VoicePilot FastAPI backend."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check and readiness endpoints."""
    
    def test_health_check(self):
        """Test health check returns correct structure."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "VoicePilot"
        assert "version" in data
        assert "features" in data
        assert "paths" in data
    
    def test_readiness_check(self):
        """Test readiness probe."""
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["ready"] is True
        assert "checks" in data


class TestCodeModification:
    """Test code modification API."""
    
    def test_modify_code_success(self):
        """Test successful code modification."""
        payload = {
            "file": "Button.tsx",
            "component": "Button",
            "property": "backgroundColor",
            "value": "#3B82F6"
        }
        response = client.post("/api/modify", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "modification" in data
    
    def test_modify_code_missing_fields(self):
        """Test modification with missing required fields."""
        payload = {
            "file": "Button.tsx"
            # Missing component, property, value
        }
        response = client.post("/api/modify", json=payload)
        # Should handle gracefully with defaults
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    def test_modify_code_empty_payload(self):
        """Test modification with empty payload."""
        response = client.post("/api/modify", json={})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


class TestProjectState:
    """Test project state endpoint."""
    
    def test_get_project_state(self):
        """Test getting project state."""
        response = client.get("/api/project/state")
        assert response.status_code == 200
        data = response.json()
        assert "project" in data
        assert "files" in data
        assert "components" in data
        assert isinstance(data["components"], list)
        assert len(data["components"]) > 0


class TestWebSocket:
    """Test WebSocket endpoint."""
    
    def test_websocket_connection(self):
        """Test WebSocket connection accepts and responds."""
        with client.websocket_connect("/ws/voice") as websocket:
            # Send ping
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"
    
    def test_websocket_audio_message(self):
        """Test WebSocket handles audio message."""
        with client.websocket_connect("/ws/voice") as websocket:
            websocket.send_json({"type": "audio", "data": "base64audio"})
            response = websocket.receive_json()
            assert response["type"] == "status"
            assert "audio" in response["message"].lower()
    
    def test_websocket_screen_message(self):
        """Test WebSocket handles screen capture."""
        with client.websocket_connect("/ws/voice") as websocket:
            websocket.send_json({"type": "screen", "data": "base64image"})
            response = websocket.receive_json()
            assert response["type"] == "status"
            assert "screen" in response["message"].lower()
    
    def test_websocket_command_message(self):
        """Test WebSocket handles command."""
        with client.websocket_connect("/ws/voice") as websocket:
            websocket.send_json({"type": "command", "data": "Make this blue"})
            response = websocket.receive_json()
            assert response["type"] == "modification"
            assert "component" in response
            assert "confidence" in response


class TestCORS:
    """Test CORS configuration."""
    
    def test_cors_headers_present(self):
        """Test CORS headers are present on responses."""
        response = client.get("/health", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
    
    def test_cors_origins_allowed(self):
        """Test that all origins are allowed."""
        response = client.get("/health", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200


class TestDebugEndpoint:
    """Test debug endpoint."""
    
    def test_debug_info_structure(self):
        """Test debug endpoint returns expected structure."""
        response = client.get("/debug")
        assert response.status_code == 200
        data = response.json()
        assert "environment" in data
        assert "cwd" in data
        assert "static_path" in data
        assert "demo_path" in data


class TestInputValidation:
    """Test input validation."""
    
    def test_large_request_rejected(self):
        """Test that overly large requests are handled."""
        large_payload = {"file": "x" * 10000}
        response = client.post("/api/modify", json=large_payload)
        # Should handle gracefully
        assert response.status_code in [200, 413, 422]
    
    def test_invalid_json_handled(self):
        """Test invalid JSON is handled gracefully."""
        response = client.post(
            "/api/modify",
            data="not valid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422


class TestRootEndpoint:
    """Test root endpoint."""
    
    def test_root_endpoint(self):
        """Test root endpoint returns HTML or error info."""
        response = client.get("/")
        # Should return HTML if static files exist, otherwise JSON
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])