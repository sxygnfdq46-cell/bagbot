"""Bot control endpoints with audit logging."""
from typing import Any

from fastapi import APIRouter, Depends, status

from backend.schemas.auth import UserProfile
from backend.security.deps import get_current_user, require_admin
from backend.services.bot_control import bot_control_service

router = APIRouter(prefix="/api/bot", tags=["bot"])


@router.get("/state")
async def get_bot_state(current_user: UserProfile = Depends(get_current_user)) -> dict[str, Any]:
    """Return current bot state."""

    return bot_control_service.get_state()


@router.post("/start", status_code=status.HTTP_202_ACCEPTED)
async def start_bot(current_user: UserProfile = Depends(require_admin)) -> dict[str, Any]:
    """Mark bot as running and record audit."""

    return bot_control_service.start(current_user.id)


@router.post("/stop", status_code=status.HTTP_202_ACCEPTED)
async def stop_bot(current_user: UserProfile = Depends(require_admin)) -> dict[str, Any]:
    """Mark bot as stopped and record audit."""

    return bot_control_service.stop(current_user.id)


@router.post("/restart", status_code=status.HTTP_202_ACCEPTED)
async def restart_bot(current_user: UserProfile = Depends(require_admin)) -> dict[str, Any]:
    """Mark bot as restarted and record audit."""

    return bot_control_service.restart(current_user.id)
