"""Charts endpoints for the candlestick suite."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/charts", tags=["charts"])


@router.get("/snapshot")
async def get_chart_snapshot(
    asset: Optional[str] = Query(default=None), timeframe: Optional[str] = Query(default=None)
) -> dict[str, Any]:
    """Return OHLCV snapshots for a given asset/timeframe (placeholder)."""
    return {
        "detail": "chart snapshot placeholder",
        "asset": asset,
        "timeframe": timeframe,
    }


@router.get("/assets")
async def list_chart_assets() -> dict[str, Any]:
    """Return supported assets (placeholder)."""
    return {"detail": "chart assets placeholder"}


@router.get("/timeframes")
async def list_chart_timeframes() -> dict[str, Any]:
    """Return supported timeframes (placeholder)."""
    return {"detail": "chart timeframes placeholder"}
