"""Dashboard endpoints powering the overview page."""
from fastapi import APIRouter, Query

from backend.schemas.dashboard import DashboardSnapshot
from backend.schemas.shared import SystemStatus
from backend.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/snapshot", response_model=DashboardSnapshot)
async def get_dashboard_snapshot(
    includePrices: bool = Query(True, description="Include market prices tile data"),
    includePositions: bool = Query(True, description="Include open positions"),
    includeTrades: bool = Query(True, description="Include recent trades"),
) -> DashboardSnapshot:
    """Return the structured dashboard snapshot expected by the UI."""

    return await DashboardService.get_snapshot(
        include_prices=includePrices,
        include_positions=includePositions,
        include_trades=includeTrades,
    )


@router.get("/status", response_model=SystemStatus)
async def get_dashboard_status() -> SystemStatus:
    """Return dashboard system status derived from the snapshot service."""

    snapshot = await DashboardService.get_snapshot(
        include_prices=False, include_positions=False, include_trades=False
    )
    return snapshot.status
