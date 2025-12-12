"""Runtime router shim (import-safe, fake-mode deterministic)."""

from __future__ import annotations

import hashlib
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return os.environ.get("RUNTIME_ROUTER_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def _fake_route(action: Dict[str, Any]) -> Dict[str, Any]:
    base = str(action)
    digest = hashlib.sha1(base.encode()).hexdigest()
    order_id = digest[:12]
    return {
        "status": "success",
        "order_id": order_id,
        "meta": {"fake": True, "action": action.get("action") if isinstance(action, dict) else None},
        "reason": "fake_mode",
    }


def route(action: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None) -> Dict[str, Any]:
    """Route a trade action envelope (import-safe placeholder)."""

    use_fake = _fake_mode_enabled(fake_mode)
    try:
        if use_fake:
            result = _fake_route(action or {})
            _inc(metrics_client, "runtime_router_requests_total", {"outcome": "success"})
            return result

        # Real path: placeholder success; no external routing performed.
        incoming_trace = None
        if isinstance(action, dict):
            incoming_trace = (action.get("meta") or {}).get("trace_id")

        result = {
            "status": "success",
            "order_id": (action or {}).get("order_id") or (action or {}).get("id") or "router-ok",
            "meta": {"routed": True, "action": (action or {}).get("action")},
            "reason": None,
        }

        if incoming_trace:
            result.setdefault("meta", {}).setdefault("trace_id", incoming_trace)
        _inc(metrics_client, "runtime_router_requests_total", {"outcome": "success"})
        return result
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_router_error", extra={"event": "runtime_router_error", "error": str(exc)})
        _inc(metrics_client, "runtime_router_requests_total", {"outcome": "fail"})
        return {"status": "held", "order_id": None, "meta": {}, "reason": "exception"}


__all__ = ["route"]
