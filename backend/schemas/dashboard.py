"""Dashboard schema definitions."""
from __future__ import annotations

from datetime import datetime
from typing import List

from pydantic import BaseModel

from .shared import MarketPrice, Position, SystemStatus, Trade


class DashboardSnapshot(BaseModel):
    """Structured payload for all dashboard tiles."""

    prices: List[MarketPrice]
    positions: List[Position]
    trades: List[Trade]
    status: SystemStatus
    portfolioValue: float
    totalPnl: float
    generatedAt: datetime
