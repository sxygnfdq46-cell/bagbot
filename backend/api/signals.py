"""Signals endpoints for the signals page."""
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/signals", tags=["signals"])


@router.get("/recent")
async def get_recent_signals() -> dict[str, Any]:
    """Return recent signals (placeholder)."""
    return {"detail": "recent signals placeholder"}


@router.get("/providers")
async def get_signal_providers() -> dict[str, Any]:
    """Return provider status (placeholder)."""
    return {"detail": "signal providers placeholder"}
