"""
Circuit Breaker - Global Emergency Stop System

This module provides a singleton circuit breaker that can be accessed
from any part of the trading system to:
- Stop all trading immediately on dangerous conditions
- Track emergency stop events
- Require admin intervention to reset
- Persist state across restarts
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)


@dataclass
class CircuitBreakerEvent:
    """Record of a circuit breaker trigger event."""
    timestamp: str
    reason: str
    triggered_by: str
    reset_timestamp: Optional[str] = None
    reset_by: Optional[str] = None


class CircuitBreaker:
    """
    Global circuit breaker singleton.
    
    This ensures that emergency stops are consistent across:
    - Risk Engine
    - Mindset Engine
    - Order Router
    - Admin API
    """
    
    _instance: Optional['CircuitBreaker'] = None
    _state_file = Path("data/state/circuit_breaker.json")
    
    def __new__(cls):
        """Ensure only one instance exists (singleton pattern)."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize circuit breaker state."""
        if self._initialized:
            return
        
        self._active = False
        self._reason = None
        self._triggered_by = None
        self._triggered_at = None
        self._events: list[CircuitBreakerEvent] = []
        
        # Ensure state directory exists
        self._state_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Load persisted state
        self._load_state()
        
        self._initialized = True
        logger.info(f"🔌 Circuit Breaker initialized: {'ACTIVE' if self._active else 'OFF'}")
    
    @classmethod
    def get_instance(cls) -> 'CircuitBreaker':
        """Get the singleton circuit breaker instance."""
        if cls._instance is None:
            cls._instance = CircuitBreaker()
        return cls._instance
    
    def trigger(self, reason: str, triggered_by: str = "System") -> None:
        """
        Activate circuit breaker to stop all trading.
        
        Args:
            reason: Description of why the circuit breaker was triggered
            triggered_by: Component or user that triggered it
        """
        if self._active:
            logger.warning(f"Circuit breaker already active: {self._reason}")
            return
        
        self._active = True
        self._reason = reason
        self._triggered_by = triggered_by
        self._triggered_at = datetime.now().isoformat()
        
        # Record event
        event = CircuitBreakerEvent(
            timestamp=self._triggered_at,
            reason=reason,
            triggered_by=triggered_by
        )
        self._events.append(event)
        
        self._save_state()
        logger.critical(f"🚨 CIRCUIT BREAKER TRIGGERED: {reason} (by {triggered_by})")
    
    def reset(self, reset_by: str = "Admin") -> bool:
        """
        Deactivate circuit breaker.
        
        Args:
            reset_by: User or component resetting the breaker
            
        Returns:
            True if reset successful
        """
        if not self._active:
            logger.info("Circuit breaker already off")
            return False
        
        # Update last event with reset info
        if self._events:
            self._events[-1].reset_timestamp = datetime.now().isoformat()
            self._events[-1].reset_by = reset_by
        
        self._active = False
        self._save_state()
        logger.warning(f"✅ Circuit breaker reset by {reset_by}")
        return True
    
    def is_active(self) -> bool:
        """Check if circuit breaker is active."""
        return self._active
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get detailed circuit breaker status.
        
        Returns:
            Status dictionary with all relevant info
        """
        return {
            "active": self._active,
            "reason": self._reason,
            "triggered_by": self._triggered_by,
            "triggered_at": self._triggered_at,
            "event_count": len(self._events),
            "last_events": [asdict(e) for e in self._events[-5:]]  # Last 5 events
        }
    
    def _load_state(self) -> None:
        """Load circuit breaker state from disk."""
        if not self._state_file.exists():
            return
        
        try:
            with open(self._state_file, "r") as f:
                state = json.load(f)
            
            self._active = state.get("active", False)
            self._reason = state.get("reason")
            self._triggered_by = state.get("triggered_by")
            self._triggered_at = state.get("triggered_at")
            
            # Load events
            events_data = state.get("events", [])
            self._events = [CircuitBreakerEvent(**e) for e in events_data]
            
            if self._active:
                logger.warning(
                    f"⚠️ Circuit breaker was active on restart: {self._reason}"
                )
        
        except Exception as e:
            logger.error(f"Failed to load circuit breaker state: {e}")
    
    def _save_state(self) -> None:
        """Save circuit breaker state to disk."""
        state = {
            "active": self._active,
            "reason": self._reason,
            "triggered_by": self._triggered_by,
            "triggered_at": self._triggered_at,
            "events": [asdict(e) for e in self._events]
        }
        
        try:
            with open(self._state_file, "w") as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save circuit breaker state: {e}")


# Global convenience function
def get_circuit_breaker() -> CircuitBreaker:
    """Get the global circuit breaker instance."""
    return CircuitBreaker.get_instance()
