"""Admin endpoints for the admin page."""
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/system-health")
async def get_system_health() -> dict[str, Any]:
    """Return system health (placeholder)."""
    return {"detail": "system health placeholder"}


@router.get("/users")
async def list_users() -> dict[str, Any]:
    """Return admin user list (placeholder)."""
    return {"detail": "user list placeholder"}


@router.get("/strategies")
async def admin_strategy_controls() -> dict[str, Any]:
    """Return strategy controls summary (placeholder)."""
    return {"detail": "admin strategies placeholder"}


@router.post("/safe-mode/activate")
async def activate_safe_mode() -> dict[str, Any]:
    """Activate safe mode (placeholder)."""
    return {"detail": "activate safe mode placeholder"}


@router.post("/safe-mode/deactivate")
async def deactivate_safe_mode() -> dict[str, Any]:
    """Deactivate safe mode (placeholder)."""
    return {"detail": "deactivate safe mode placeholder"}


@router.post("/kill-all")
async def kill_all_strategies() -> dict[str, Any]:
    """Kill all strategies (placeholder)."""
    return {"detail": "kill all strategies placeholder"}
