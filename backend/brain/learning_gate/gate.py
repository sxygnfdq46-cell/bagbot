"""Read-only learning gate evaluator (always blocked in pause/observe).

No side effects or learning enablement.
"""
from __future__ import annotations

from typing import Any, Dict, Optional


def build_learning_gate_snapshot(*, meta: Optional[Dict[str, Any]] = None, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    source = None
    if isinstance(meta, dict):
        source = meta.get("market_data_source") or meta.get("source")
    mode = None
    if isinstance(context, dict):
        mode = context.get("mode") or context.get("state")

    return {
        "status": "BLOCKED",
        "allowed": False,
        "reasons": ["pause_observe_mode", "learning_disabled"],
        "market_data_source": source or "UNKNOWN",
        "mode": mode,
    }
