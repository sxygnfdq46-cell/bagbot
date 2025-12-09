from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List

from backend.brain.models.schemas import FusionResult, NormalizedSignal


@dataclass(frozen=True)
class FusionConfig:
    weights: Dict[str, float]
    neutral_threshold: float = 0.05


DEFAULT_WEIGHTS: Dict[str, float] = {
    "momentum": 1.0,
    "mean_reversion": 0.8,
    "news": 1.1,
    "volatility": 0.6,
}

DEFAULT_CONFIG = FusionConfig(weights=DEFAULT_WEIGHTS, neutral_threshold=0.05)


def _weight_for(signal: NormalizedSignal, weights: Dict[str, float]) -> float:
    return float(weights.get(signal.type, 1.0))


def fuse_signals(signals: Iterable[NormalizedSignal], config: FusionConfig = DEFAULT_CONFIG) -> FusionResult:
    signals_list: List[NormalizedSignal] = list(signals)
    if not signals_list:
        return FusionResult(fusion_score=0.0, direction="neutral", confidence=0.0, rationale=[], signals_used=[])

    weights = config.weights or {}
    weighted_sum = 0.0
    weight_magnitude = 0.0
    rationale: List[str] = []

    for sig in signals_list:
        w = _weight_for(sig, weights)
        contribution = sig.strength * sig.confidence * w
        weighted_sum += contribution
        weight_magnitude += abs(w) * max(sig.confidence, 0.0)
        rationale.append(
            f"{sig.provider_id}:{sig.type} strength={sig.strength:.2f} confidence={sig.confidence:.2f} weight={w:.2f} contrib={contribution:.3f}"
        )

    score = weighted_sum / weight_magnitude if weight_magnitude else 0.0
    direction = "neutral"
    if score > config.neutral_threshold:
        direction = "long"
    elif score < -config.neutral_threshold:
        direction = "short"

    confidence = min(1.0, weight_magnitude / max(len(signals_list), 1))
    rationale.append(f"fusion_score={score:.3f} direction={direction} confidence={confidence:.3f}")

    return FusionResult(
        fusion_score=score,
        direction=direction,
        confidence=confidence,
        rationale=rationale,
        signals_used=signals_list,
    )
