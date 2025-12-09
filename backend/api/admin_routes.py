"""Admin control routes and resilient trading state helpers."""

from __future__ import annotations

import json
import os
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional, Any, Tuple

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status

from backend.utils.logging import log_event
from backend.utils.metrics import MetricsClient

router = APIRouter(prefix="/api/admin", tags=["admin"])

logger = logging.getLogger(__name__)

# State file used by tests; kept writable and JSON-based.
STATE_FILE = Path("trading_state.json")

_metrics_client: MetricsClient | None = None


def set_metrics_client(client: MetricsClient) -> None:
    """Inject a metrics client with counter/gauge methods."""

    global _metrics_client
    _metrics_client = client


def _increment_metric(name: str) -> None:
    client = _metrics_client
    if not client:
        return
    try:
        client.inc_counter(name)
    except Exception:
        logger.debug("metrics increment failed", exc_info=True)


def _log_admin(action: str, request: Request, *, extra: Optional[Dict[str, Any]] = None) -> None:
    request_id = request.headers.get("X-Request-ID")
    log_event(
        logger,
        f"admin.{action}",
        request_id=request_id,
        route="/api/admin",
        action=action,
        extra=extra,
    )


def _default_state() -> Dict[str, Any]:
    return {"paused": False, "reason": None, "timestamp": None}


def validate_trading_state(state: Any) -> Tuple[Dict[str, Any], bool]:
    """Return a validated state and whether it was structurally valid."""

    base = _default_state()
    if not isinstance(state, dict):
        return base, False

    valid = True
    result = base.copy()

    if "paused" in state:
        if isinstance(state["paused"], bool):
            result["paused"] = state["paused"]
        else:
            valid = False

    if "reason" in state:
        reason_val = state.get("reason")
        if reason_val is None or isinstance(reason_val, str):
            result["reason"] = reason_val
        else:
            valid = False

    if "timestamp" in state:
        ts_val = state.get("timestamp")
        if ts_val is None or isinstance(ts_val, str):
            result["timestamp"] = ts_val
        else:
            valid = False

    return result, valid


def _rotate_corrupt_state() -> None:
    """Rotate a corrupt state file to a timestamped backup and count it."""

    if not STATE_FILE.exists():
        return

    try:
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
        rotated = STATE_FILE.with_name(f"{STATE_FILE.name}.corrupt.{stamp}.old")
        STATE_FILE.replace(rotated)
        _increment_metric("admin_state_corruption")
    except Exception:
        logger.debug("state rotation failed", exc_info=True)


def load_trading_state() -> Dict[str, Any]:
    """Load trading state safely; rotate corrupt files and fallback to defaults."""

    if not STATE_FILE.exists():
        state = _default_state()
        save_trading_state(state)
        return state

    try:
        if STATE_FILE.stat().st_size == 0:
            raise ValueError("empty state file")
        with STATE_FILE.open("r", encoding="utf-8") as f:
            raw = json.load(f)
    except Exception:
        _rotate_corrupt_state()
        state = _default_state()
        save_trading_state(state)
        return state

    validated, valid = validate_trading_state(raw)
    if not valid:
        _rotate_corrupt_state()
        state = _default_state()
        save_trading_state(state)
        return state

    if validated != raw:
        save_trading_state(validated)
    return validated


def save_trading_state(state: Dict[str, Any]) -> None:
    """Persist trading state atomically; ignore failures to stay test-friendly."""

    validated, _ = validate_trading_state(state)
    tmp_path = STATE_FILE.with_suffix(STATE_FILE.suffix + ".tmp")

    try:
        with tmp_path.open("w", encoding="utf-8") as f:
            json.dump(validated, f)
        tmp_path.replace(STATE_FILE)
    except Exception:
        logger.debug("failed to save trading state", exc_info=True)
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
async def get_status(request: Request, _: str = Depends(require_admin_token)) -> Dict[str, Any]:
    state = load_trading_state()
    _log_admin("status", request)
    return state


@router.post("/pause")
async def pause_trading(
    request: Request,
    payload: Optional[Dict[str, Any]] = None,
    _: str = Depends(require_admin_token),
) -> Dict[str, Any]:
    payload = payload or {}
    reason = payload.get("reason") or "Paused by admin"
    state = {
        "paused": True,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    save_trading_state(state)
    _increment_metric("admin_pause_total")
    _log_admin("pause", request, extra={"reason": reason})
    return state


@router.post("/resume")
async def resume_trading(
    request: Request,
    payload: Optional[Dict[str, Any]] = None,
    _: str = Depends(require_admin_token),
) -> Dict[str, Any]:
    payload = payload or {}
    reason = payload.get("reason") or "Resumed by admin"
    state = {
        "paused": False,
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    save_trading_state(state)
    _increment_metric("admin_resume_total")
    _log_admin("resume", request, extra={"reason": reason})
    return state


@router.delete("/pause")
async def force_resume(request: Request, _: str = Depends(require_admin_token)) -> Dict[str, Any]:
    state = {
        "paused": False,
        "reason": "Force resumed by admin",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    save_trading_state(state)
    _increment_metric("admin_resume_total")
    _log_admin("force_resume", request)
    return state