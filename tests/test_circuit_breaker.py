"""
Tests for Circuit Breaker
"""

import pytest
from pathlib import Path
from worker.safety.circuit_breaker import CircuitBreaker, get_circuit_breaker


@pytest.fixture
def clean_breaker(tmp_path):
    """Create a circuit breaker with clean state in temp directory."""
    # Override the state file path for testing
    CircuitBreaker._state_file = tmp_path / "circuit_breaker.json"
    CircuitBreaker._instance = None  # Reset singleton
    breaker = CircuitBreaker()
    yield breaker
    # Cleanup
    CircuitBreaker._instance = None


def test_singleton_pattern():
    """Test that CircuitBreaker is a singleton."""
    breaker1 = CircuitBreaker.get_instance()
    breaker2 = CircuitBreaker.get_instance()
    assert breaker1 is breaker2


def test_initial_state(clean_breaker):
    """Test circuit breaker initial state."""
    assert not clean_breaker.is_active()
    status = clean_breaker.get_status()
    assert status["active"] is False
    assert status["reason"] is None
    assert status["event_count"] == 0


def test_trigger_breaker(clean_breaker):
    """Test triggering the circuit breaker."""
    clean_breaker.trigger("Test emergency", "TestSystem")
    
    assert clean_breaker.is_active()
    status = clean_breaker.get_status()
    assert status["active"] is True
    assert status["reason"] == "Test emergency"
    assert status["triggered_by"] == "TestSystem"
    assert status["event_count"] == 1


def test_reset_breaker(clean_breaker):
    """Test resetting the circuit breaker."""
    clean_breaker.trigger("Test emergency", "TestSystem")
    assert clean_breaker.is_active()
    
    result = clean_breaker.reset("Admin")
    assert result is True
    assert not clean_breaker.is_active()
    
    # Check event was updated with reset info
    status = clean_breaker.get_status()
    last_event = status["last_events"][-1]
    assert last_event["reset_by"] == "Admin"
    assert last_event["reset_timestamp"] is not None


def test_reset_when_not_active(clean_breaker):
    """Test resetting when breaker is not active."""
    result = clean_breaker.reset("Admin")
    assert result is False
    assert not clean_breaker.is_active()


def test_multiple_triggers(clean_breaker):
    """Test multiple trigger events."""
    clean_breaker.trigger("First emergency", "System1")
    clean_breaker.reset("Admin")
    
    clean_breaker.trigger("Second emergency", "System2")
    clean_breaker.reset("Admin")
    
    clean_breaker.trigger("Third emergency", "System3")
    
    status = clean_breaker.get_status()
    assert status["event_count"] == 3
    assert status["active"] is True
    assert status["reason"] == "Third emergency"


def test_trigger_when_already_active(clean_breaker):
    """Test triggering when already active (should be idempotent)."""
    clean_breaker.trigger("First emergency", "System1")
    assert clean_breaker.is_active()
    
    # Try to trigger again
    clean_breaker.trigger("Second emergency", "System2")
    
    # Should still have first trigger info
    status = clean_breaker.get_status()
    assert status["reason"] == "First emergency"
    assert status["triggered_by"] == "System1"
    assert status["event_count"] == 1  # Only one event


def test_state_persistence(tmp_path):
    """Test that state persists across instances."""
    # Create first instance and trigger
    CircuitBreaker._state_file = tmp_path / "circuit_breaker.json"
    CircuitBreaker._instance = None
    breaker1 = CircuitBreaker()
    breaker1.trigger("Persistent emergency", "System")
    
    # Create second instance (simulating restart)
    CircuitBreaker._instance = None
    breaker2 = CircuitBreaker()
    
    # Should load previous state
    assert breaker2.is_active()
    status = breaker2.get_status()
    assert status["reason"] == "Persistent emergency"
    assert status["triggered_by"] == "System"


def test_get_circuit_breaker_convenience():
    """Test the convenience function."""
    breaker = get_circuit_breaker()
    assert breaker is CircuitBreaker.get_instance()


def test_last_events_limit(clean_breaker):
    """Test that get_status returns only last 5 events."""
    # Trigger 10 events
    for i in range(10):
        clean_breaker.trigger(f"Emergency {i}", f"System{i}")
        clean_breaker.reset("Admin")
    
    status = clean_breaker.get_status()
    assert status["event_count"] == 10
    assert len(status["last_events"]) == 5
    
    # Should be the last 5 events
    assert status["last_events"][0]["reason"] == "Emergency 5"
    assert status["last_events"][-1]["reason"] == "Emergency 9"
