from __future__ import annotations

"""Decision envelope builder."""

from typing import Dict, List

from backend.brain.models.schemas import DecisionEnvelope, FusionResult


ACTION_MAP = {
    "long": "buy",
    "short": "sell",
    "neutral": "hold",
}


def build_decision_envelope(fusion: FusionResult) -> DecisionEnvelope:
    direction = fusion.direction if fusion.direction in ACTION_MAP else "neutral"
    action = ACTION_MAP[direction]
    signals_used: List[Dict[str, str]] = [
        {"provider_id": s.provider_id, "type": s.type} for s in fusion.signals_used
    ]

    return DecisionEnvelope(
        action=action,
        score=fusion.fusion_score,
        confidence=fusion.confidence,
        reasons=list(fusion.rationale),
        signals_used=signals_used,
    )


__all__ = ["build_decision_envelope", "ACTION_MAP"]
