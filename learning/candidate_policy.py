"""Candidate policy interface and simple baselines for offline replay."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Protocol

from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_score import DecisionScore


@dataclass
class PolicyDecision:
    decision_id: str
    trace_id: str
    predicted_score: float
    action: str = "take"  # take|skip
    metadata: Dict[str, Any] = field(default_factory=dict)


class CandidatePolicy(Protocol):
    name: str

    def predict(self, attribution: DecisionAttribution, score: Optional[DecisionScore]) -> Optional[PolicyDecision]:
        ...


class ThresholdPolicy:
    """Simple baseline: take when score >= threshold."""

    def __init__(self, threshold: float = 0.0, *, name: str = "threshold") -> None:
        self.threshold = threshold
        self.name = name

    def predict(self, attribution: DecisionAttribution, score: Optional[DecisionScore]) -> Optional[PolicyDecision]:
        predicted = 0.0 if score is None else score.score
        action = "take" if predicted >= self.threshold else "skip"
        return PolicyDecision(
            decision_id=attribution.decision_id,
            trace_id=attribution.trace_id,
            predicted_score=predicted,
            action=action,
            metadata={"threshold": self.threshold, "policy_name": self.name},
        )


__all__ = ["CandidatePolicy", "PolicyDecision", "ThresholdPolicy"]
