"""Unified runtime decision pipeline (import-safe, fake-mode aware)."""

from __future__ import annotations

import hashlib
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _trace_id(seed: str) -> str:
    return hashlib.sha1(seed.encode()).hexdigest()[:16]


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return os.environ.get("RUNTIME_PIPELINE_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _intent_preview_enabled() -> bool:
    return os.environ.get("INTENT_PREVIEW_ENABLED", "").strip().lower() in _FAKE_TRUE


def _mock_feed_enabled() -> bool:
    raw_mock = os.environ.get("SIGNALS_MOCK_FEED_ENABLED", "").strip().lower()
    raw_fake = os.environ.get("SIGNALS_FAKE_MODE", "").strip().lower()
    return raw_mock in _FAKE_TRUE or raw_fake in _FAKE_TRUE


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
    trace_id = _trace_id(base)
    action_cycle = ["buy", "sell", "hold"]
    action = action_cycle[int(digest[:2], 16) % 3]
    brain = {"action": action, "confidence": (int(digest[2:4], 16) % 100) / 100.0, "rationale": ["fake_brain"], "meta": {"fake": True, "trace_id": trace_id}}
    trade = {"action": action, "envelope": {"action": action, "meta": {"fake": True, "trace_id": trace_id}}, "reason": "fake_mode"}
    router = {"status": "success", "order_id": digest[:12], "reason": "fake_mode", "meta": {"fake": True, "trace_id": trace_id}}
    preview = {"action": action, "size": (int(digest[4:8], 16) % 10000) / 100.0, "confidence": brain["confidence"], "rationale": ["fake_mode"], "risk_notes": ["fake_mode"], "meta": {"fake": True, "trace_id": trace_id}}
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
            "meta": {"pipeline_fake_mode": True, "intent_preview_enabled": intent_enabled, "trace_id": router.get("meta", {}).get("trace_id")},
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
        "meta": {"pipeline_fake_mode": False, "intent_preview_enabled": intent_enabled, "trace_id": (router_result or {}).get("meta", {}).get("trace_id")},
    }


def _extract_trace_id(result: Dict[str, Any]) -> Optional[str]:
    try:
        return (result.get("router_result") or {}).get("meta", {}).get("trace_id")
    except Exception:
        return None


def run_pipeline_canary(*, metrics_client: Any = None, fake_mode: Optional[bool] = True) -> Dict[str, Any]:
    """Run a staged-safe pipeline canary.

    If signals mock feed is enabled via env flags, a single mock feed invocation
    runs before the baseline pipeline envelope. Both run in fake mode by default
    to avoid any network or adapter access.
    """

    mock_result: Optional[Dict[str, Any]] = None

    if _mock_feed_enabled():
        try:
            from backend.signals.mock_feed import run_mock_feed_once  # lazy import for safety

            mock_result = run_mock_feed_once(metrics_client=metrics_client)
            mock_status = mock_result.get("status") if isinstance(mock_result, dict) else "unknown"
            _inc(metrics_client, "signals_mock_feed_runs_total", {"outcome": mock_status})
            logger.info(
                "runtime_pipeline_mock_feed",
                extra={
                    "event": "runtime_pipeline_mock_feed",
                    "status": mock_status,
                    "fake_mode": True,
                    "trace_id": _extract_trace_id(mock_result) if isinstance(mock_result, dict) else None,
                },
            )

            if mock_status != "success":
                return {
                    "status": "hold",
                    "reason": "mock_feed_failed",
                    "rationale": [f"mock_feed_{mock_status}"],
                    "brain_decision": None,
                    "trade_action": None,
                    "router_result": mock_result.get("router_result") if isinstance(mock_result, dict) else None,
                    "intent_preview": None,
                    "meta": {"mock_feed": mock_result, "pipeline_fake_mode": True},
                }
        except Exception as exc:  # pragma: no cover
            logger.warning("runtime_pipeline_mock_feed_error", extra={"event": "runtime_pipeline_mock_feed_error", "error": str(exc)})
            return _fail("mock_feed", "exception", metrics_client)

    envelope = {"instrument": "BTC-USD", "snapshot": {}, "signals": {}}
    response = run_decision_pipeline(envelope, metrics_client=metrics_client, fake_mode=fake_mode if fake_mode is not None else True)

    if mock_result is not None:
        response.setdefault("meta", {})["mock_feed"] = mock_result

    return response


__all__ = ["run_decision_pipeline", "run_pipeline_canary"]
