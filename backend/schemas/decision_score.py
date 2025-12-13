"""Schema for read-only decision scoring (post-hoc)."""
from __future__ import annotations

import time
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class DecisionScore(BaseModel):
    decision_id: str
    trace_id: str
    strategy_id: str
    score: float
    components: Dict[str, float]
    status: str
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)
    extra: Dict[str, Any] = Field(default_factory=dict)


__all__ = ["DecisionScore"]
