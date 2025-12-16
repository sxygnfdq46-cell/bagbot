"""Deterministic, read-only evaluation metrics for historical replay.

No side effects, no learning or execution. Pure aggregation from provided decisions.
"""
from __future__ import annotations

from typing import Any, Dict, Iterable, Optional


def _is_historical(meta: Optional[Dict[str, Any]]) -> bool:
    source = None
    if isinstance(meta, dict):
        source = meta.get("market_data_source") or meta.get("source")
    return str(source).upper() == "HISTORICAL"


def _seed() -> Dict[str, Any]:
    return {
        "market_data_source": None,
        "decisions_total": 0,
        "holds": 0,
        "buys": 0,
        "sells": 0,
        "pn_l": 0.0,
        "max_drawdown": 0.0,
        "trace_ids": [],
        "decision_ids": [],
    }


def _update_pnl(state: Dict[str, Any], decision: Dict[str, Any]) -> None:
    action = str(decision.get("action") or "").lower()
    confidence = float(decision.get("confidence") or 0.0)
    delta = confidence * (1 if action == "buy" else -1 if action == "sell" else 0)
    state["pn_l"] += delta
    state["max_drawdown"] = min(state["max_drawdown"], state["pn_l"])


def build_eval_snapshot(
    *,
    decisions: Iterable[Dict[str, Any]] | None,
    meta: Optional[Dict[str, Any]],
    explain: Optional[Dict[str, Any]] = None,
    learning_gate: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Aggregate read-only eval metrics from decisions (historical only)."""

    state = _seed()
    state["market_data_source"] = (meta or {}).get("market_data_source") if isinstance(meta, dict) else None

    if not _is_historical(meta):
        return state

    for decision in decisions or []:
        if not isinstance(decision, dict):
            continue
        payload = decision.get("payload") if "payload" in decision else decision
        if not isinstance(payload, dict):
            continue
        action = str(payload.get("action") or "").lower()
        state["decisions_total"] += 1
        if action == "buy":
            state["buys"] += 1
        elif action == "sell":
            state["sells"] += 1
        else:
            state["holds"] += 1
        _update_pnl(state, payload)
        if decision_id := decision.get("decision_id"):
            state["decision_ids"].append(decision_id)
        if trace_id := (payload.get("meta") or {}).get("trace_id"):
            state["trace_ids"].append(trace_id)

    state["explain_snapshot"] = explain or None
    state["learning_gate"] = learning_gate or None
    return state
