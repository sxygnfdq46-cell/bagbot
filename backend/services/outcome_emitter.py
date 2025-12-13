"""Outcome emission for decisions (read-only, non-blocking)."""
from __future__ import annotations

import collections
from typing import Any, Dict, Optional

from backend.schemas.decision_outcome import DecisionOutcome

_OUTCOMES: collections.deque[DecisionOutcome] = collections.deque(maxlen=256)


def _safe_inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def _pnl_bucket(pnl: float) -> str:
    if pnl < -50:
        return "lt_-50"
    if pnl < -10:
        return "lt_-10"
    if pnl < 0:
        return "lt_0"
    if pnl < 10:
        return "lt_10"
    if pnl < 50:
        return "lt_50"
    return "gte_50"


def _status_from_router(router_result: Optional[Dict[str, Any]]) -> str:
    if not isinstance(router_result, dict):
        return "neutral"
    status = router_result.get("status")
    if status == "success":
        return "success"
    if status in {"hold", "held", "fail", "failed"}:
        return "fail"
    return "neutral"


def _record_outcome(outcome: DecisionOutcome) -> None:
    try:
        _OUTCOMES.append(outcome)
    except Exception:  # pragma: no cover
        return


def emit_outcome(
    decision: Optional[Dict[str, Any]],
    router_result: Optional[Dict[str, Any]],
    *,
    metrics_client: Any = None,
    pnl: Optional[float] = None,
    exit_reason: Optional[str] = None,
    duration_ms: Optional[int] = None,
) -> Optional[DecisionOutcome]:
    """Best-effort emission of a DecisionOutcome from decision + router result.

    Non-blocking: errors are swallowed; no mutation of inputs.
    """

    try:
        decision_id = (decision or {}).get("decision_id")
        trace_id = (decision or {}).get("trace_id") or ((router_result or {}).get("meta") or {}).get("trace_id")
        if not decision_id or not trace_id:
            _safe_inc(metrics_client, "orphan_outcomes_total", {"reason": "missing_ids"})
            return None

        status = _status_from_router(router_result)
        outcome = DecisionOutcome(
            decision_id=decision_id,
            trace_id=trace_id,
            status=status,
            pnl=pnl,
            exit_reason=exit_reason,
            duration_ms=duration_ms,
        )
        _record_outcome(outcome)

        _safe_inc(metrics_client, "decision_outcomes_total", {"status": status})
        if status == "success":
            _safe_inc(metrics_client, "decision_outcomes_success_total", {"status": status})
        if pnl is not None:
            _safe_inc(metrics_client, "decision_pnl_histogram", {"bucket": _pnl_bucket(pnl)})
        return outcome
    except Exception:  # pragma: no cover
        return None


def outcomes() -> list[DecisionOutcome]:
    return list(_OUTCOMES)


def reset() -> None:
    try:
        _OUTCOMES.clear()
    except Exception:  # pragma: no cover
        return


__all__ = ["emit_outcome", "outcomes", "reset"]
