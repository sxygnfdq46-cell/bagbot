"""Shared schema components for reusable dashboard primitives."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class MarketPrice(BaseModel):
    """Represents a market price tile for the dashboard."""

    asset: str
    price: float
    timestamp: datetime


class Position(BaseModel):
    """Represents an open position tile."""

    id: str
    asset: str
    size: float
    entryPrice: float
    pnl: float
    updatedAt: datetime


class Trade(BaseModel):
    """Represents a recently executed trade."""

    id: str
    asset: str
    side: Literal["buy", "sell"]
    price: float
    size: float
    timestamp: datetime


class SystemStatus(BaseModel):
    """Represents system status/latency diagnostics."""

    health: Literal["healthy", "degraded", "error"]
    latencyMs: int
