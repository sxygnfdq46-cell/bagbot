"""Signals schema definitions for the signals UI."""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel


class SignalProviderStatus(BaseModel):
    """Represents the health of a given signal provider."""

    provider: str
    connected: bool
    latencyMs: int
    lastSignalAt: Optional[datetime] = None


class SignalRecord(BaseModel):
    """Represents a discrete signal event."""

    id: str
    provider: str
    asset: str
    direction: Literal["long", "short", "neutral"]
    confidence: float
    price: float
    timeframe: str
    generatedAt: datetime


class SignalLogEntry(BaseModel):
    """Represents a rolling log event emitted by the signal pipeline."""

    id: str
    provider: str
    level: Literal["info", "warning", "error"]
    message: str
    timestamp: datetime


class SignalsStatusSummary(BaseModel):
    """Aggregated view of provider health for the signals view."""

    providers: List[SignalProviderStatus]
    totalActiveProviders: int
    overallHealth: Literal["healthy", "degraded", "offline"]
    updatedAt: datetime
