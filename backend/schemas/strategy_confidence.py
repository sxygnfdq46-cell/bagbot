"""Schema for strategy-level confidence calibration (read-only)."""
from __future__ import annotations

import time
from typing import Dict, Optional

from pydantic import BaseModel, Field


class StrategyConfidence(BaseModel):
    strategy_id: str
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    avg_score: float
    count: int
    band: str
    distribution: Dict[str, int] = Field(default_factory=dict)
    timestamp: float = Field(default_factory=time.time)


__all__ = ["StrategyConfidence"]
