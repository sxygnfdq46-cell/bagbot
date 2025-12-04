"""Signals schema definitions for the signals UI."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

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
