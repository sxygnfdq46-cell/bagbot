from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class ProviderSignal:
    provider_id: str
    action: str
    confidence: float
    strength: float
    rationale: List[str]
    raw: Dict[str, Any]


@dataclass
class OrchestratorResult:
    action: str
    confidence: float
    provider: str
    rationale: List[str]
    meta: Dict[str, Any]


def clamp_confidence(value: float) -> float:
    if value < 0:
        return 0.0
    if value > 1:
        return 1.0
    return value
