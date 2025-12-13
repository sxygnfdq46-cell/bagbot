"""Confidence calibration over decision scores (read-only, reporting only)."""
from __future__ import annotations

import collections
from typing import Any, Dict, Iterable, List, Optional, Tuple

from backend.schemas.decision_score import DecisionScore
from backend.schemas.strategy_confidence import StrategyConfidence


def _safe_inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def _band(avg_score: float) -> str:
    if avg_score < -0.25:
        return "low"
    if avg_score > 0.25:
        return "high"
    return "medium"


def _group_key(score: DecisionScore, strategy_id: Optional[str], symbol: Optional[str], timeframe: Optional[str]) -> Optional[Tuple[str, Optional[str], Optional[str]]]:
    if strategy_id and score.strategy_id != strategy_id:
        return None
    if symbol and score.symbol != symbol:
        return None
    if timeframe and score.timeframe != timeframe:
        return None
    return (score.strategy_id, score.symbol, score.timeframe)


def calibrate(
    scores: Iterable[DecisionScore],
    *,
    strategy_id: Optional[str] = None,
    symbol: Optional[str] = None,
    timeframe: Optional[str] = None,
    metrics_client: Any = None,
) -> List[StrategyConfidence]:
    buckets: Dict[Tuple[str, Optional[str], Optional[str]], list[float]] = collections.defaultdict(list)

    for score in scores:
        key = _group_key(score, strategy_id, symbol, timeframe)
        if key is None:
            continue
        buckets[key].append(score.score)

    results: list[StrategyConfidence] = []
    for key, vals in buckets.items():
        if not vals:
            continue
        avg = sum(vals) / len(vals)
        band = _band(avg)
        distribution: Dict[str, int] = collections.Counter("low" if v < -0.25 else "high" if v > 0.25 else "medium" for v in vals)
        sc = StrategyConfidence(
            strategy_id=key[0],
            symbol=key[1],
            timeframe=key[2],
            avg_score=avg,
            count=len(vals),
            band=band,
            distribution=dict(distribution),
        )
        results.append(sc)
        _safe_inc(metrics_client, "confidence_band_distribution", {"band": band})
    return results


__all__ = ["calibrate"]
