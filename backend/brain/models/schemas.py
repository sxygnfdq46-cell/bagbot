from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass(frozen=True)
class NormalizedSignal:
    type: str
    provider_id: str
    strength: float
    confidence: float
    timestamp: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class FusionResult:
    fusion_score: float
    direction: str
    confidence: float
    rationale: List[str] = field(default_factory=list)
    signals_used: List[NormalizedSignal] = field(default_factory=list)


@dataclass(frozen=True)
class DecisionEnvelope:
    action: str
    score: float
    confidence: float
    reasons: List[str] = field(default_factory=list)
    signals_used: List[Dict[str, Any]] = field(default_factory=list)
