"""
Unit tests for Admin API Routes

Tests authentication, pause/resume functionality, and state persistence.
"""

import os
import sys
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, Mock

# Setup test environment before imports
os.environ["SECRET_KEY"] = "test-secret-key-for-admin-tests"
os.environ["ADMIN_TOKEN"] = "test-admin-token-123"
os.environ["DEBUG"] = "true"

# Mock worker.queue module to avoid import errors
sys.modules['worker'] = Mock()
sys.modules['worker.queue'] = Mock()
sys.modules['worker.tasks'] = Mock()

from backend.main import app
from backend.api.admin_routes import load_trading_state, save_trading_state, STATE_FILE


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def admin_headers():
    """Admin authorization headers."""
    return {"Authorization": "Bearer test-admin-token-123"}


@pytest.fixture
def cleanup_state():
    """Cleanup state file after test."""
    yield
    if STATE_FILE.exists():
        STATE_FILE.unlink()


class TestAdminAuthentication:
    """Test admin authentication and authorization."""
    
    def test_status_without_token(self, client):
        """Test status endpoint rejects requests without token."""
        response = client.get("/api/admin/status")
        
        assert response.status_code == 401
        assert "authorization" in response.json()["detail"].lower()
    
    def test_status_with_invalid_token(self, client):
        """Test status endpoint rejects invalid tokens."""
        headers = {"Authorization": "Bearer wrong-token"}
        response = client.get("/api/admin/status", headers=headers)
        
        assert response.status_code == 403
        assert "invalid" in response.json()["detail"].lower()
    
    def test_status_with_valid_token(self, client, admin_headers, cleanup_state):
        """Test status endpoint accepts valid token."""
        response = client.get("/api/admin/status", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "paused" in data
        assert isinstance(data["paused"], bool)
    
    def test_pause_without_token(self, client):
        """Test pause endpoint requires authentication."""
        response = client.post("/api/admin/pause", json={"reason": "Test"})
        
        assert response.status_code == 401
    
    def test_resume_without_token(self, client):
        """Test resume endpoint requires authentication."""
        response = client.post("/api/admin/resume", json={"reason": "Test"})
        
        assert response.status_code == 401
    
    def test_token_without_bearer_prefix(self, client, cleanup_state):
        """Test authentication works without 'Bearer' prefix."""
        headers = {"Authorization": "test-admin-token-123"}
        response = client.get("/api/admin/status", headers=headers)
        
        assert response.status_code == 200


class TestTradingPause:
    """Test trading pause functionality."""
    
    def test_pause_trading(self, client, admin_headers, cleanup_state):
        """Test pausing trading operations."""
        response = client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "Maintenance window"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is True
        assert data["reason"] == "Maintenance window"
        assert "timestamp" in data
    
    def test_pause_persists_to_file(self, client, admin_headers, cleanup_state):
        """Test pause state is persisted to file."""
        client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "Test persistence"}
        )
        
        # Load state directly from file
        state = load_trading_state()
        assert state["paused"] is True
        assert state["reason"] == "Test persistence"
    
    def test_pause_with_default_reason(self, client, admin_headers, cleanup_state):
        """Test pause uses default reason if not provided."""
        response = client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is True
        assert "admin" in data["reason"].lower() or "pause" in data["reason"].lower()
    
    def test_multiple_pauses_update_state(self, client, admin_headers, cleanup_state):
        """Test multiple pause calls update the state."""
        # First pause
        response1 = client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "First pause"}
        )
        timestamp1 = response1.json()["timestamp"]
        
        # Second pause
        response2 = client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "Second pause"}
        )
        timestamp2 = response2.json()["timestamp"]
        
        assert response2.status_code == 200
        assert response2.json()["reason"] == "Second pause"
        assert timestamp2 >= timestamp1


class TestTradingResume:
    """Test trading resume functionality."""
    
    def test_resume_trading(self, client, admin_headers, cleanup_state):
        """Test resuming trading operations."""
        # First pause
        client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "Test pause"}
        )
        
        # Then resume
        response = client.post(
            "/api/admin/resume",
            headers=admin_headers,
            json={"reason": "All clear"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is False
        assert data["reason"] == "All clear"
    
    def test_resume_persists_to_file(self, client, admin_headers, cleanup_state):
        """Test resume state is persisted to file."""
        # Pause first
        client.post("/api/admin/pause", headers=admin_headers, json={})
        
        # Resume
        client.post(
            "/api/admin/resume",
            headers=admin_headers,
            json={"reason": "Resume test"}
        )
        
        # Load state from file
        state = load_trading_state()
        assert state["paused"] is False
    
    def test_resume_with_default_reason(self, client, admin_headers, cleanup_state):
        """Test resume uses default reason if not provided."""
        response = client.post(
            "/api/admin/resume",
            headers=admin_headers,
            json={}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is False
        assert "admin" in data["reason"].lower() or "resume" in data["reason"].lower()
    
    def test_force_resume_via_delete(self, client, admin_headers, cleanup_state):
        """Test force resume via DELETE endpoint."""
        # Pause first
        client.post("/api/admin/pause", headers=admin_headers, json={})
        
        # Force resume with DELETE
        response = client.delete("/api/admin/pause", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is False
        assert "force resumed" in data["reason"].lower()


class TestTradingStatus:
    """Test trading status endpoint."""
    
    def test_status_default_state(self, client, admin_headers, cleanup_state):
        """Test status returns default state when no state file exists."""
        response = client.get("/api/admin/status", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is False
        assert data["reason"] is None
    
    def test_status_after_pause(self, client, admin_headers, cleanup_state):
        """Test status reflects paused state."""
        # Pause trading
        client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "Status test"}
        )
        
        # Check status
        response = client.get("/api/admin/status", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is True
        assert data["reason"] == "Status test"
    
    def test_status_after_resume(self, client, admin_headers, cleanup_state):
        """Test status reflects resumed state."""
        # Pause then resume
        client.post("/api/admin/pause", headers=admin_headers, json={})
        client.post(
            "/api/admin/resume",
            headers=admin_headers,
            json={"reason": "Resume status test"}
        )
        
        # Check status
        response = client.get("/api/admin/status", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["paused"] is False


class TestStateUtilities:
    """Test state management utility functions."""
    
    def test_load_state_creates_default(self, cleanup_state):
        """Test load_trading_state creates default state if missing."""
        if STATE_FILE.exists():
            STATE_FILE.unlink()
        
        state = load_trading_state()
        
        assert state["paused"] is False
        assert state["reason"] is None
        assert STATE_FILE.exists()
    
    def test_save_and_load_state(self, cleanup_state):
        """Test saving and loading state."""
        test_state = {
            "paused": True,
            "reason": "Unit test",
            "timestamp": "2025-11-24T12:00:00"
        }
        
        save_trading_state(test_state)
        loaded_state = load_trading_state()
        
        assert loaded_state["paused"] is True
        assert loaded_state["reason"] == "Unit test"
        assert loaded_state["timestamp"] == "2025-11-24T12:00:00"


class TestErrorHandling:
    """Test error handling and edge cases."""
    
    @patch.dict(os.environ, {}, clear=True)
    def test_missing_admin_token_config(self, client):
        """Test error when ADMIN_TOKEN not configured."""
        # Need to reimport to pick up cleared env
        from importlib import reload
        import api.admin_routes
        reload(api.admin_routes)
        
        headers = {"Authorization": "Bearer any-token"}
        response = client.get("/api/admin/status", headers=headers)
        
        # Should get 500 error about missing config
        assert response.status_code == 500
        assert "not configured" in response.json()["detail"].lower()
    
    def test_malformed_json(self, client, admin_headers, cleanup_state):
        """Test handling of malformed request JSON."""
        headers_with_content_type = {
            **admin_headers,
            "Content-Type": "application/json"
        }
        response = client.post(
            "/api/admin/pause",
            data="not-valid-json",
            headers=headers_with_content_type
        )
        
        # FastAPI will return 422 for invalid JSON
        assert response.status_code in [400, 422]


class TestIntegration:
    """Integration tests for complete workflows."""
    
    def test_pause_resume_cycle(self, client, admin_headers, cleanup_state):
        """Test complete pause and resume cycle."""
        # 1. Check initial status
        status1 = client.get("/api/admin/status", headers=admin_headers)
        assert status1.json()["paused"] is False
        
        # 2. Pause trading
        pause_response = client.post(
            "/api/admin/pause",
            headers=admin_headers,
            json={"reason": "Emergency maintenance"}
        )
        assert pause_response.json()["paused"] is True
        
        # 3. Verify paused status
        status2 = client.get("/api/admin/status", headers=admin_headers)
        assert status2.json()["paused"] is True
        assert status2.json()["reason"] == "Emergency maintenance"
        
        # 4. Resume trading
        resume_response = client.post(
            "/api/admin/resume",
            headers=admin_headers,
            json={"reason": "Maintenance complete"}
        )
        assert resume_response.json()["paused"] is False
        
        # 5. Verify resumed status
        status3 = client.get("/api/admin/status", headers=admin_headers)
        assert status3.json()["paused"] is False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
