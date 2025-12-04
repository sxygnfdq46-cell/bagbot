"""Dashboard endpoints powering the overview page."""
from typing import Any

from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/snapshot")
async def get_dashboard_snapshot() -> dict[str, Any]:
    """Return snapshot data for dashboard tiles (placeholder)."""
    return {"detail": "dashboard snapshot placeholder"}


@router.get("/status")
async def get_dashboard_status() -> dict[str, Any]:
    """Return dashboard system status (placeholder)."""
    return {"detail": "dashboard status placeholder"}
