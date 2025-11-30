"""
Admin API Routes

Protected endpoints for administrative operations like pausing/resuming trading.
"""

import os
import json
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException, Header, status
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Storage file path for trading state
STATE_DIR = Path(__file__).parent.parent.parent / "data" / "state"
STATE_FILE = STATE_DIR / "trading_state.json"


class TradingStateResponse(BaseModel):
    """Trading state response model."""
    paused: bool
    reason: Optional[str] = None
    timestamp: Optional[str] = None


class PauseRequest(BaseModel):
    """Request to pause trading."""
    reason: Optional[str] = "Manual pause via admin API"


class ResumeRequest(BaseModel):
    """Request to resume trading."""
    reason: Optional[str] = "Manual resume via admin API"


def verify_admin_token(authorization: Optional[str] = Header(None)) -> bool:
    """
    Verify admin token from Authorization header.
    
    Args:
        authorization: Authorization header value
    
    Returns:
        True if valid, raises HTTPException otherwise
    """
    admin_token = os.getenv("ADMIN_TOKEN")
    
    if not admin_token:
        logger.error("ADMIN_TOKEN not configured in environment")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin authentication not configured"
        )
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Support both "Bearer TOKEN" and just "TOKEN" formats
    token = authorization.replace("Bearer ", "").strip()
    
    if token != admin_token:
        logger.warning("Invalid admin token attempt")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin token"
        )
    
    return True


def load_trading_state() -> dict:
    """
    Load trading state from file.
    
    Returns:
        Trading state dictionary
    """
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        
        if STATE_FILE.exists():
            with open(STATE_FILE, "r") as f:
                state = json.load(f)
                logger.debug(f"Loaded trading state: {state}")
                return state
        else:
            # Default state - trading is active
            default_state = {
                "paused": False,
                "reason": None,
                "timestamp": None
            }
            save_trading_state(default_state)
            return default_state
    
    except Exception as e:
        logger.error(f"Error loading trading state: {e}", exc_info=True)
        # Return safe default on error
        return {
            "paused": False,
            "reason": None,
            "timestamp": None
        }


def save_trading_state(state: dict) -> None:
    """
    Save trading state to file.
    
    Args:
        state: Trading state dictionary to save
    """
    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        
        with open(STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
        
        logger.info(f"Saved trading state: paused={state['paused']}")
    
    except Exception as e:
        logger.error(f"Error saving trading state: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save trading state"
        )


def is_trading_paused() -> bool:
    """
    Check if trading is currently paused.
    
    Returns:
        True if trading is paused, False otherwise
    """
    state = load_trading_state()
    return state.get("paused", False)


@router.get("/status", response_model=TradingStateResponse)
async def get_trading_status(authorization: str = Header(None)):
    """
    Get current trading status (paused/active).
    
    Requires admin token in Authorization header.
    """
    verify_admin_token(authorization)
    
    state = load_trading_state()
    
    return TradingStateResponse(
        paused=state.get("paused", False),
        reason=state.get("reason"),
        timestamp=state.get("timestamp", "")
    )


@router.post("/pause", response_model=TradingStateResponse)
async def pause_trading(
    request: PauseRequest,
    authorization: str = Header(None)
):
    """
    Pause all trading operations.
    
    This sets the PAUSE_TRADING flag which prevents:
    - New orders from being placed
    - Daily cycle execution
    - Signal processing
    
    Existing open positions are NOT automatically closed.
    
    Requires admin token in Authorization header.
    """
    verify_admin_token(authorization)
    
    from datetime import datetime
    
    state = {
        "paused": True,
        "reason": request.reason,
        "timestamp": datetime.now().isoformat()
    }
    
    save_trading_state(state)
    
    logger.warning(f"🛑 TRADING PAUSED: {request.reason}")
    
    return TradingStateResponse(**state)


@router.post("/resume", response_model=TradingStateResponse)
async def resume_trading(
    request: ResumeRequest,
    authorization: str = Header(None)
):
    """
    Resume trading operations.
    
    This clears the PAUSE_TRADING flag and allows:
    - New orders to be placed
    - Daily cycle execution
    - Signal processing
    
    Requires admin token in Authorization header.
    """
    verify_admin_token(authorization)
    
    from datetime import datetime
    
    # Load current state to preserve any other data
    current_state = load_trading_state()
    
    state = {
        "paused": False,
        "reason": request.reason,
        "timestamp": datetime.now().isoformat(),
        "previous_pause_reason": current_state.get("reason")
    }
    
    save_trading_state(state)
    
    logger.info(f"✅ TRADING RESUMED: {request.reason}")
    
    return TradingStateResponse(
        paused=False,
        reason=request.reason,
        timestamp=state["timestamp"]
    )


@router.delete("/pause", response_model=TradingStateResponse)
async def force_resume_trading(authorization: str = Header(None)):
    """
    Force resume trading (alias for POST /resume with default reason).
    
    Useful for emergency override or simple curl commands.
    
    Requires admin token in Authorization header.
    """
    verify_admin_token(authorization)
    
    from datetime import datetime
    
    state = {
        "paused": False,
        "reason": "Force resumed via DELETE /pause",
        "timestamp": datetime.now().isoformat()
    }
    
    save_trading_state(state)
    
    logger.info("✅ TRADING FORCE RESUMED")
    
    return TradingStateResponse(**state)
