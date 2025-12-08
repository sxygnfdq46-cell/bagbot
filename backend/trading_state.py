"""
Trading State Utilities

Utilities for checking and managing trading pause state across the system.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Storage file path for trading state
STATE_DIR = Path(__file__).parent.parent.parent / "data" / "state"
STATE_FILE = STATE_DIR / "trading_state.json"


def is_trading_paused() -> bool:
    """
    Check if trading is currently paused.
    
    This function can be called from anywhere in the system to check
    if trading operations should be blocked.
    
    Returns:
        True if trading is paused, False otherwise
    """
    try:
        if not STATE_FILE.exists():
            return False
        
        with open(STATE_FILE, "r") as f:
            state = json.load(f)
        
        return state.get("paused", False)
    
    except Exception as e:
        logger.warning(f"Error checking trading pause state: {e}")
        # Fail safe - assume not paused if we can't read state
        return False


def get_trading_state() -> Dict[str, Optional[str]]:
    """
    Get the full trading state including pause reason and timestamp.
    
    Returns:
        Dictionary with 'paused', 'reason', and 'timestamp' keys
    """
    try:
        if not STATE_FILE.exists():
            return {
                "paused": False,
                "reason": None,
                "timestamp": None
            }
        
        with open(STATE_FILE, "r") as f:
            state = json.load(f)
        
        return {
            "paused": state.get("paused", False),
            "reason": state.get("reason"),
            "timestamp": state.get("timestamp")
        }
    
    except Exception as e:
        logger.warning(f"Error loading trading state: {e}")
        return {
            "paused": False,
            "reason": None,
            "timestamp": None
        }


def check_trading_allowed(operation: str = "trade") -> None:
    """
    Check if trading is allowed, raise exception if paused.
    
    Args:
        operation: Description of the operation being attempted
    
    Raises:
        RuntimeError: If trading is paused
    """
    if is_trading_paused():
        state = get_trading_state()
        reason = state.get("reason", "Unknown reason")
        raise RuntimeError(
            f"Trading is paused: {reason}. "
            f"Cannot perform operation: {operation}"
        )
