"""Decision scoring service (read-only, deterministic, non-blocking)."""
from __future__ import annotations

from typing import Any, Dict, Optional

from backend.schemas.decision_attribution import DecisionAttribution
from backend.schemas.decision_outcome import DecisionOutcome
from backend.schemas.decision_score import DecisionScore


def _safe_inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def _extract_strategy(decision: Dict[str, Any]) -> str:
    payload = decision.get("payload") or {}
    return payload.get("strategy_id") or payload.get("strategy") or "unknown"


def _extract_symbol(decision: Dict[str, Any]) -> Optional[str]:
    payload = decision.get("payload") or {}
    return payload.get("symbol")


def _extract_timeframe(decision: Dict[str, Any]) -> Optional[str]:
    payload = decision.get("payload") or {}
    return payload.get("timeframe") or payload.get("tf")


def _base_score_from_status(status: str) -> float:
    if status == "success":
        return 1.0
    if status == "fail":
        return -1.0
    return 0.0


def _pnl_component(pnl: Optional[float]) -> float:
    if pnl is None:
        return 0.0
    return max(-1.0, min(1.0, pnl / 100.0))


def _duration_component(duration_ms: Optional[int]) -> float:
    if duration_ms is None:
        return 0.0
    # Reward shorter durations slightly; cap between -0.2 and 0.2.
    val = 0.1 if duration_ms < 60_000 else -0.1
    return max(-0.2, min(0.2, val))


def score_attribution(attribution: DecisionAttribution, *, metrics_client: Any = None) -> Optional[DecisionScore]:
    """Compute a deterministic score from an attribution. Non-blocking and side-effect free."""

    try:
        decision = attribution.decision or {}
        outcome: DecisionOutcome = attribution.outcome
        decision_id = decision.get("decision_id") or getattr(outcome, "decision_id", None)
        trace_id = decision.get("trace_id") or getattr(outcome, "trace_id", None)
        if not decision_id or not trace_id:
            _safe_inc(metrics_client, "decision_scores_total", {"status": "skipped", "reason": "missing_ids"})
            return None

        status = getattr(outcome, "status", None) or "neutral"
        base = _base_score_from_status(status)
        pnl_comp = _pnl_component(getattr(outcome, "pnl", None))
        duration_comp = _duration_component(getattr(outcome, "duration_ms", None))
        score = base + pnl_comp + duration_comp
        score = max(-1.0, min(1.0, score))

        strategy_id = _extract_strategy(decision)
        symbol = _extract_symbol(decision)
        timeframe = _extract_timeframe(decision)

        record = DecisionScore(
            decision_id=decision_id,
            trace_id=trace_id,
            strategy_id=strategy_id,
            score=score,
            components={"base": base, "pnl": pnl_comp, "duration": duration_comp},
            status=status,
            symbol=symbol,
            timeframe=timeframe,
        )

        _safe_inc(metrics_client, "decision_scores_total", {"status": status})
        _safe_inc(metrics_client, "avg_decision_score", {"strategy_id": strategy_id})
        if score < 0.0:
            _safe_inc(metrics_client, "low_confidence_decisions_total", {"strategy_id": strategy_id})
        return record
    except Exception:  # pragma: no cover
        return None


__all__ = ["score_attribution"]
