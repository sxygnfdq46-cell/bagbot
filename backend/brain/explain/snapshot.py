"""Read-only brain explainability snapshot builder.

All logic remains deterministic and side-effect free.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional


def _coerce_reasons(decision: Optional[Dict[str, Any]], rationale: Optional[List[str]]) -> List[str]:
    if rationale:
        return [str(item) for item in rationale if item]
    payload = decision or {}
    if isinstance(payload, dict):
        raw = payload.get("rationale") or payload.get("reasons")
        if isinstance(raw, list):
            return [str(item) for item in raw if item]
    return ["no_rationale_provided"]


def _coerce_constraints(envelope: Optional[Dict[str, Any]], decision: Optional[Dict[str, Any]]) -> List[str]:
    constraints: List[str] = []
    if isinstance(envelope, dict):
        limits = envelope.get("constraints") or envelope.get("limits")
        if isinstance(limits, list):
            constraints.extend([str(item) for item in limits if item])
    if isinstance(decision, dict):
        blocked = decision.get("constraints") or decision.get("blocked")
        if isinstance(blocked, list):
            constraints.extend([str(item) for item in blocked if item])
    return constraints or ["none_recorded"]


def build_explain_snapshot(
    *,
    decision: Optional[Dict[str, Any]],
    envelope: Optional[Dict[str, Any]],
    meta: Optional[Dict[str, Any]],
    rationale: Optional[List[str]] = None,
    learning_gate: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Return a deterministic explain snapshot without mutating inputs."""

    market_data_source = None
    if isinstance(meta, dict):
        market_data_source = meta.get("market_data_source") or meta.get("source")
    status = "decision" if decision else "no_decision"

    return {
        "status": status,
        "market_data_source": market_data_source or "UNKNOWN",
        "reasons": _coerce_reasons(decision, rationale),
        "constraints": _coerce_constraints(envelope, decision),
        "context": {
            "decision_action": (decision or {}).get("action") if isinstance(decision, dict) else None,
            "decision_confidence": (decision or {}).get("confidence") if isinstance(decision, dict) else None,
            "trace_id": (meta or {}).get("trace_id") if isinstance(meta, dict) else None,
        },
        "learning_gate": learning_gate,
    }
