"""Unified runtime decision pipeline (import-safe, fake-mode aware)."""

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
    return os.environ.get("RUNTIME_PIPELINE_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _intent_preview_enabled() -> bool:
    return os.environ.get("INTENT_PREVIEW_ENABLED", "").strip().lower() in _FAKE_TRUE


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def _fail(stage: str, reason: str, metrics: Any) -> Dict[str, Any]:
    _inc(metrics, "pipeline_failures_total", {"stage": stage, "reason": reason})
    _inc(metrics, "pipeline_requests_total", {"stage": stage, "outcome": "fail"})
    return {
        "status": "hold",
        "reason": reason,
        "rationale": [reason],
        "brain_decision": None,
        "trade_action": None,
        "router_result": None,
        "intent_preview": None,
        "meta": {},
    }


def _fake_preview(envelope: Dict[str, Any]) -> Dict[str, Any]:
    base = str(envelope)
    digest = hashlib.sha1(base.encode()).hexdigest()
    action_cycle = ["buy", "sell", "hold"]
    action = action_cycle[int(digest[:2], 16) % 3]
    brain = {"action": action, "confidence": (int(digest[2:4], 16) % 100) / 100.0, "rationale": ["fake_brain"], "meta": {"fake": True}}
    trade = {"action": action, "envelope": {"action": action, "meta": {"fake": True}}, "reason": "fake_mode"}
    router = {"status": "success", "order_id": digest[:12], "reason": "fake_mode", "meta": {"fake": True}}
    preview = {"action": action, "size": (int(digest[4:8], 16) % 10000) / 100.0, "confidence": brain["confidence"], "rationale": ["fake_mode"], "risk_notes": ["fake_mode"], "meta": {"fake": True}}
    return brain, trade, router, preview


def run_decision_pipeline(envelope: Dict[str, Any], *, metrics_client: Any = None, fake_mode: Optional[bool] = None) -> Dict[str, Any]:
    """Run unified decision pipeline brain -> trade engine -> runtime router -> intent preview."""

    use_fake = _fake_mode_enabled(fake_mode)
    intent_enabled = _intent_preview_enabled()

    if not isinstance(envelope, dict) or not envelope.get("instrument"):
        return _fail("validate", "invalid_envelope", metrics_client)

    if use_fake:
        brain, trade, router, preview = _fake_preview(envelope)
        _inc(metrics_client, "pipeline_requests_total", {"stage": "brain", "outcome": "success"})
        _inc(metrics_client, "pipeline_requests_total", {"stage": "trade_engine", "outcome": "success"})
        _inc(metrics_client, "pipeline_requests_total", {"stage": "runtime_router", "outcome": "success"})
        if intent_enabled:
            _inc(metrics_client, "pipeline_requests_total", {"stage": "intent_preview", "outcome": "success"})
        return {
            "status": "success",
            "reason": None,
            "rationale": ["fake_mode"],
            "brain_decision": brain,
            "trade_action": trade,
            "router_result": router,
            "intent_preview": preview if intent_enabled else None,
            "meta": {"pipeline_fake_mode": True, "intent_preview_enabled": intent_enabled},
        }

    rationale: list[str] = []
    brain_decision: Optional[Dict[str, Any]] = None
    trade_action: Optional[Dict[str, Any]] = None
    router_result: Optional[Dict[str, Any]] = None
    intent_preview: Optional[Dict[str, Any]] = None

    try:
        from backend.worker.runner import get_brain_decision  # lazy import

        brain_decision = get_brain_decision(
            envelope.get("signals", envelope),
            config=envelope.get("config"),
            metrics_client=metrics_client,
            fake_mode=envelope.get("fake_mode"),
        )
        _inc(metrics_client, "pipeline_requests_total", {"stage": "brain", "outcome": "success"})
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_pipeline_brain_error", extra={"event": "runtime_pipeline_brain_error", "error": str(exc)})
        return _fail("brain", "exception", metrics_client)

    try:
        from backend.worker.runner.trade_engine_runner import get_trade_action  # lazy import

        trade_action = get_trade_action(
            brain_decision or {},
            fake_mode=envelope.get("fake_mode"),
            metrics=metrics_client,
        )
        _inc(metrics_client, "pipeline_requests_total", {"stage": "trade_engine", "outcome": "success"})
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_pipeline_trade_error", extra={"event": "runtime_pipeline_trade_error", "error": str(exc)})
        return _fail("trade_engine", "exception", metrics_client)

    try:
        from backend.worker import runtime_router  # lazy import

        router_result = runtime_router.route(trade_action or {}, metrics_client=metrics_client, fake_mode=envelope.get("fake_mode"))
        _inc(metrics_client, "pipeline_requests_total", {"stage": "runtime_router", "outcome": "success"})
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_pipeline_router_error", extra={"event": "runtime_pipeline_router_error", "error": str(exc)})
        return _fail("runtime_router", "exception", metrics_client)

    if intent_enabled:
        try:
            from backend.worker import intent_preview_runtime  # lazy import

            intent_preview = intent_preview_runtime.get_intent_preview(
                brain_decision or {},
                envelope.get("snapshot", {}),
                metrics_client=metrics_client,
                fake_mode=envelope.get("fake_mode"),
            )
            _inc(metrics_client, "pipeline_requests_total", {"stage": "intent_preview", "outcome": "success"})
        except Exception as exc:  # pragma: no cover
            logger.warning("runtime_pipeline_intent_error", extra={"event": "runtime_pipeline_intent_error", "error": str(exc)})
            _inc(metrics_client, "pipeline_failures_total", {"stage": "intent_preview", "reason": "exception"})
            _inc(metrics_client, "pipeline_requests_total", {"stage": "intent_preview", "outcome": "fail"})
            rationale.append("intent_preview_failed")

    status = "success"
    return {
        "status": status,
        "reason": None,
        "rationale": rationale,
        "brain_decision": brain_decision,
        "trade_action": trade_action,
        "router_result": router_result,
        "intent_preview": intent_preview,
        "meta": {"pipeline_fake_mode": False, "intent_preview_enabled": intent_enabled},
    }


__all__ = ["run_decision_pipeline"]
