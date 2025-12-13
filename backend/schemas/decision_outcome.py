"""Schema for read-only decision outcomes (post-execution)."""
from __future__ import annotations

import time
from typing import Literal, Optional

from pydantic import BaseModel, Field


class DecisionOutcome(BaseModel):
    decision_id: str
    trace_id: str
    status: Literal["success", "fail", "neutral"]
    pnl: Optional[float] = None
    exit_reason: Optional[str] = None
    duration_ms: Optional[int] = None
    timestamp: float = Field(default_factory=time.time)


__all__ = ["DecisionOutcome"]
