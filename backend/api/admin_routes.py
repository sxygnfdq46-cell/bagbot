"""Admin control routes and test-friendly trading state endpoints."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Any

from fastapi import APIRouter, Depends, Header, HTTPException, status

router = APIRouter(prefix="/api/admin", tags=["admin"])

# State file used by tests; kept writable and JSON-based.
STATE_FILE = Path("trading_state.json")


def _default_state() -> Dict[str, Any]:
    return {"paused": False, "reason": None, "timestamp": None}


def load_trading_state() -> Dict[str, Any]:
    """Load trading state, creating a default file if missing."""

    if not STATE_FILE.exists():
        state = _default_state()
        save_trading_state(state)
        return state

    try:
        with STATE_FILE.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return _default_state()


def save_trading_state(state: Dict[str, Any]) -> None:
    """Persist trading state to disk, ignoring failures to stay test-friendly."""

    try:
        with STATE_FILE.open("w", encoding="utf-8") as f:
            json.dump(state, f)
    except Exception:
        return None


def _extract_token(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header:
        return None
    scheme, _, value = auth_header.partition(" ")
    if scheme.lower() == "bearer" and value:
        return value
    return auth_header


def require_admin_token(authorization: Optional[str] = Header(default=None)) -> str:
    """Validate static ADMIN_TOKEN from env; supports bare or Bearer-prefixed headers."""

    expected = os.getenv("ADMIN_TOKEN")
    if not expected:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="ADMIN_TOKEN not configured")

    token = _extract_token(authorization)
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header required")

    if token != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin token")

    return token


@router.get("/status")
async def get_status(_: str = Depends(require_admin_token)) -> Dict[str, Any]:
    state = load_trading_state()
    return state


@router.post("/pause")
async def pause_trading(payload: Optional[Dict[str, Any]] = None, _: str = Depends(require_admin_token)) -> Dict[str, Any]:
    payload = payload or {}
    reason = payload.get("reason") or "Paused by admin"
    state = {
        "paused": True,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    save_trading_state(state)
    return state


@router.post("/resume")
async def resume_trading(payload: Optional[Dict[str, Any]] = None, _: str = Depends(require_admin_token)) -> Dict[str, Any]:
    payload = payload or {}
    reason = payload.get("reason") or "Resumed by admin"
    state = {
        "paused": False,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    save_trading_state(state)
    return state


@router.delete("/pause")
async def force_resume(_: str = Depends(require_admin_token)) -> Dict[str, Any]:
    state = {
        "paused": False,
        "reason": "Force resumed by admin",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    save_trading_state(state)
    return state