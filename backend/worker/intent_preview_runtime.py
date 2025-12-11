"""Runtime shim for intent preview (import-safe, fake-mode capable)."""

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
    return _env_bool("INTENT_PREVIEW_FAKE_MODE", False)


def _intent_preview_enabled() -> bool:
    return _env_bool("INTENT_PREVIEW_ENABLED", False)


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
        except Exception:  # pragma: no cover - defensive
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


def _fake_preview(decision: Dict[str, Any], snapshot: Dict[str, Any]) -> Dict[str, Any]:
    base = f"{decision}|{snapshot}"
    digest = hashlib.sha1(base.encode()).hexdigest()
    size = (int(digest[:6], 16) % 10000) / 100.0
    conf = ((int(digest[6:12], 16) % 100) / 100.0)
    action = ["buy", "sell", "hold"][int(digest[12:14], 16) % 3]
    return {
        "action": action,
        "size": size,
        "confidence": conf,
        "rationale": ["fake_mode"],
        "risk_notes": ["fake_mode"],
        "meta": {"fake": True},
    }


def _fail(reason: str, metrics: Any, trace_id: Optional[str], observability: bool) -> Dict[str, Any]:
    labels = {"reason": reason}
    if trace_id:
        labels["trace_id"] = trace_id
    _inc(metrics, "intent_preview_failures_total", labels, enabled=observability)
    _inc(metrics, "intent_preview_requests_total", {"outcome": "failed", **({"trace_id": trace_id} if trace_id else {})}, enabled=observability)
    return {
        "action": "hold",
        "size": 0.0,
        "confidence": 0.0,
        "rationale": [],
        "risk_notes": [],
        "reason": reason,
        "meta": {"trace_id": trace_id} if trace_id else {},
    }


def get_intent_preview(decision: Dict[str, Any], snapshot: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None, trace_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Runtime entrypoint that wraps backend.execution.intent_preview.get_intent_preview."""

    use_fake = _fake_mode_enabled(fake_mode)
    observability = _env_bool("RUNTIME_OBSERVABILITY_ENABLED", True)
    tracing = _env_bool("RUNTIME_TRACING_ENABLED", True)
    trace_id = trace_context.get("trace_id") if tracing and trace_context else None

    if not _intent_preview_enabled():
        _inc(metrics_client, "intent_preview_requests_total", {"outcome": "skipped", **({"trace_id": trace_id} if trace_id else {})}, enabled=observability)
        return {"action": None, "size": 0.0, "confidence": 0.0, "rationale": [], "risk_notes": [], "meta": {"trace_id": trace_id} if trace_id else {}}

    try:
        start = time.perf_counter()
        if use_fake:
            preview = _fake_preview(decision or {}, snapshot or {})
        else:
            try:
                from backend.execution.intent_preview import get_intent_preview as _core_preview  # lazy import
            except Exception:
                return _fail("import-error", metrics_client, trace_id, observability)

            preview = _core_preview(decision or {}, snapshot or {})
            if not isinstance(preview, dict):
                return _fail("invalid-response", metrics_client, trace_id, observability)

        duration = time.perf_counter() - start
        labels = {"outcome": "success"}
        if trace_id:
            labels["trace_id"] = trace_id

        _inc(metrics_client, "intent_preview_requests_total", labels, enabled=observability)
        _observe(metrics_client, "intent_preview_latency_seconds", duration, labels, enabled=observability)

        meta = preview.get("meta") if isinstance(preview, dict) else {}
        if isinstance(meta, dict) and trace_id:
            meta.setdefault("trace_id", trace_id)
            preview["meta"] = meta
        if trace_context is not None:
            trace_context.setdefault("stages", {}).setdefault("intent_preview", {}).setdefault("shim_duration_ms", duration * 1000.0)

        return preview
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "intent_preview_runtime_error",
            extra={"event": "intent_preview_runtime_error", "error": str(exc)},
        )
        return _fail("exception", metrics_client, trace_id, observability)


def preview_intent(decision: Dict[str, Any], snapshot: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None, trace_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Alias to get_intent_preview for compatibility with pipeline expectations."""

    return get_intent_preview(decision, snapshot, metrics_client=metrics_client, fake_mode=fake_mode, trace_context=trace_context)


__all__ = ["get_intent_preview", "preview_intent"]
