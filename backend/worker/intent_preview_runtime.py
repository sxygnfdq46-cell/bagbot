"""Runtime shim for intent preview (import-safe, fake-mode capable)."""

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
    return os.environ.get("INTENT_PREVIEW_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover - defensive
            return


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


def _fail(reason: str, metrics: Any) -> Dict[str, Any]:
    _inc(metrics, "intent_preview_failures_total", {"reason": reason})
    _inc(metrics, "intent_preview_requests_total", {"outcome": "failed"})
    return {
        "action": "hold",
        "size": 0.0,
        "confidence": 0.0,
        "rationale": [],
        "risk_notes": [],
        "reason": reason,
        "meta": {},
    }


def get_intent_preview(decision: Dict[str, Any], snapshot: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None) -> Dict[str, Any]:
    """Runtime entrypoint that wraps backend.execution.intent_preview.get_intent_preview."""

    use_fake = _fake_mode_enabled(fake_mode)
    try:
        if use_fake:
            preview = _fake_preview(decision or {}, snapshot or {})
            _inc(metrics_client, "intent_preview_requests_total", {"outcome": "success"})
            return preview

        try:
            from backend.execution.intent_preview import get_intent_preview as _core_preview  # lazy import
        except Exception:
            return _fail("import-error", metrics_client)

        preview = _core_preview(decision or {}, snapshot or {})
        if not isinstance(preview, dict):
            return _fail("invalid-response", metrics_client)

        _inc(metrics_client, "intent_preview_requests_total", {"outcome": "success"})
        return preview
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "intent_preview_runtime_error",
            extra={"event": "intent_preview_runtime_error", "error": str(exc)},
        )
        return _fail("exception", metrics_client)


def preview_intent(decision: Dict[str, Any], snapshot: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None) -> Dict[str, Any]:
    """Alias to get_intent_preview for compatibility with pipeline expectations."""

    return get_intent_preview(decision, snapshot, metrics_client=metrics_client, fake_mode=fake_mode)


__all__ = ["get_intent_preview", "preview_intent"]
