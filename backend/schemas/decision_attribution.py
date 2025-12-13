"""Schema for read-only decision outcome attribution."""
from __future__ import annotations

import time
from typing import Any, Dict

from pydantic import BaseModel, Field

from backend.schemas.decision_outcome import DecisionOutcome


class DecisionAttribution(BaseModel):
    decision_id: str
    trace_id: str
    decision: Dict[str, Any]
    outcome: DecisionOutcome
    timestamp: float = Field(default_factory=time.time)


__all__ = ["DecisionAttribution"]
