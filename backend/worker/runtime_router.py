"""Runtime router shim (import-safe, fake-mode deterministic)."""

from __future__ import annotations

import hashlib
import logging
import os
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _env_bool(key: str, default: bool = False) -> bool:
    raw = os.environ.get(key)
    if raw is None:
        return default
    return raw.strip().lower() in _FAKE_TRUE


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return _env_bool("RUNTIME_ROUTER_FAKE_MODE", False)


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None, value: Optional[float] = None, enabled: bool = True) -> None:
    if not metrics or not enabled:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            if value is not None and "value" in inc.__code__.co_varnames:
                inc(name, value=value, labels=labels or {})
            else:
                inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def _observe(metrics: Any, name: str, value: float, labels: Optional[Dict[str, Any]] = None, enabled: bool = True) -> None:
    if not metrics or not enabled:
        return
    observe = getattr(metrics, "observe", None)
    if callable(observe):
        try:
            observe(name, value=value, labels=labels or {})
            return
        except Exception:  # pragma: no cover
            return
    _inc(metrics, name, labels=labels, value=value, enabled=enabled)


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


def route(action: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None, trace_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Route a trade action envelope (import-safe placeholder)."""

    use_fake = _fake_mode_enabled(fake_mode)
    observability = _env_bool("RUNTIME_OBSERVABILITY_ENABLED", True)
    tracing = _env_bool("RUNTIME_TRACING_ENABLED", True)
    trace_id = trace_context.get("trace_id") if tracing and trace_context else None

    try:
        start = time.perf_counter()
        if use_fake:
            result = _fake_route(action or {})
        else:
            result = {
                "status": "success",
                "order_id": (action or {}).get("order_id") or (action or {}).get("id") or "router-ok",
                "meta": {"routed": True, "action": (action or {}).get("action")},
                "reason": None,
            }

        duration = time.perf_counter() - start
        labels = {"outcome": "success"}
        if trace_id:
            labels["trace_id"] = trace_id

        _inc(metrics_client, "runtime_router_requests_total", labels, enabled=observability)
        _observe(metrics_client, "runtime_router_latency_seconds", duration, labels, enabled=observability)

        meta = result.get("meta") or {}
        if trace_id:
            meta.setdefault("trace_id", trace_id)
        result["meta"] = meta
        if trace_context is not None:
            trace_context.setdefault("stages", {}).setdefault("runtime_router", {}).setdefault("shim_duration_ms", duration * 1000.0)
        return result
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_router_error", extra={"event": "runtime_router_error", "error": str(exc)})
        labels = {"outcome": "fail"}
        if trace_id:
            labels["trace_id"] = trace_id
        _inc(metrics_client, "runtime_router_requests_total", labels, enabled=observability)
        return {"status": "held", "order_id": None, "meta": {"trace_id": trace_id} if trace_id else {}, "reason": "exception"}


__all__ = ["route"]
