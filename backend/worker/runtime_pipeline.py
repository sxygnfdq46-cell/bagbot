"""Unified runtime decision pipeline (import-safe, fake-mode aware)."""

from __future__ import annotations

import hashlib
import logging
import os
import time
import uuid
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_FAKE_TRUE = {"1", "true", "yes", "on"}
PIPELINE_VERSION = "m5"


def _env_bool(key: str, default: bool = False) -> bool:
    raw = os.environ.get(key)
    if raw is None:
        return default
    return raw.strip().lower() in _FAKE_TRUE


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return _env_bool("RUNTIME_PIPELINE_FAKE_MODE", False)


def _intent_preview_enabled() -> bool:
    return _env_bool("INTENT_PREVIEW_ENABLED", False)


def _observability_enabled() -> bool:
    return _env_bool("RUNTIME_OBSERVABILITY_ENABLED", True)


def _tracing_enabled() -> bool:
    return _env_bool("RUNTIME_TRACING_ENABLED", True)


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


def _trace_context(enabled: bool) -> Optional[Dict[str, Any]]:
    if not enabled:
        return None
    ts = time.time()
    return {"trace_id": uuid.uuid4().hex, "pipeline_start_ts": ts, "stages": {}}


def _mark_stage(trace_context: Optional[Dict[str, Any]], stage: str, duration: Optional[float] = None) -> None:
    if trace_context is None:
        return
    trace_context.setdefault("stages", {}).setdefault(stage, {})
    stage_entry = trace_context["stages"][stage]
    if "start_ts" not in stage_entry:
        stage_entry["start_ts"] = time.time()
    if duration is not None:
        stage_entry["duration_ms"] = duration * 1000.0


def _labels(stage: str, outcome: Optional[str] = None, reason: Optional[str] = None, trace_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    data: Dict[str, Any] = {"stage": stage, "pipeline_version": PIPELINE_VERSION}
    if outcome:
        data["outcome"] = outcome
    if reason:
        data["reason"] = reason
    if trace_context and trace_context.get("trace_id"):
        data["trace_id"] = trace_context["trace_id"]
    return data


def _fail(stage: str, reason: str, metrics: Any, trace_context: Optional[Dict[str, Any]], observability: bool) -> Dict[str, Any]:
    _inc(metrics, "pipeline_failures_total", _labels(stage, reason=reason, trace_context=trace_context), enabled=observability)
    _inc(metrics, "pipeline_requests_total", _labels(stage, outcome="fail", trace_context=trace_context), enabled=observability)
    return {
        "status": "hold",
        "reason": reason,
        "rationale": [reason],
        "brain_decision": None,
        "trade_action": None,
        "router_result": None,
        "intent_preview": None,
        "meta": {"trace_id": (trace_context or {}).get("trace_id")},
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
    observability = _observability_enabled()
    tracing = _tracing_enabled()
    trace_context = _trace_context(tracing)

    if not isinstance(envelope, dict) or not envelope.get("instrument"):
        return _fail("validate", "invalid_envelope", metrics_client, trace_context, observability)

    if use_fake:
        _mark_stage(trace_context, "brain")
        _mark_stage(trace_context, "trade_engine")
        _mark_stage(trace_context, "runtime_router")
        if intent_enabled:
            _mark_stage(trace_context, "intent_preview")

        brain, trade, router, preview = _fake_preview(envelope)
        _inc(metrics_client, "pipeline_requests_total", _labels("brain", outcome="success", trace_context=trace_context), enabled=observability)
        _inc(metrics_client, "pipeline_requests_total", _labels("trade_engine", outcome="success", trace_context=trace_context), enabled=observability)
        _inc(metrics_client, "pipeline_requests_total", _labels("runtime_router", outcome="success", trace_context=trace_context), enabled=observability)
        _observe(metrics_client, "pipeline_stage_latency_seconds", 0.0, _labels("brain", trace_context=trace_context), enabled=observability)
        _observe(metrics_client, "pipeline_stage_latency_seconds", 0.0, _labels("trade_engine", trace_context=trace_context), enabled=observability)
        _observe(metrics_client, "pipeline_stage_latency_seconds", 0.0, _labels("runtime_router", trace_context=trace_context), enabled=observability)
        if intent_enabled:
            _inc(metrics_client, "pipeline_requests_total", _labels("intent_preview", outcome="success", trace_context=trace_context), enabled=observability)
            _observe(metrics_client, "pipeline_stage_latency_seconds", 0.0, _labels("intent_preview", trace_context=trace_context), enabled=observability)
        if trace_context and router is not None:
            router_meta = router.get("meta") or {}
            router_meta.setdefault("trace_id", trace_context["trace_id"])
            router["meta"] = router_meta
        return {
            "status": "success",
            "reason": None,
            "rationale": ["fake_mode"],
            "brain_decision": brain,
            "trade_action": trade,
            "router_result": router,
            "intent_preview": preview if intent_enabled else None,
            "meta": {
                "pipeline_fake_mode": True,
                "intent_preview_enabled": intent_enabled,
                "trace_id": (trace_context or {}).get("trace_id"),
                "pipeline_start_ts": (trace_context or {}).get("pipeline_start_ts"),
            },
        }

    rationale: list[str] = []
    brain_decision: Optional[Dict[str, Any]] = None
    trade_action: Optional[Dict[str, Any]] = None
    router_result: Optional[Dict[str, Any]] = None
    intent_preview: Optional[Dict[str, Any]] = None

    _mark_stage(trace_context, "brain")
    try:
        t0 = time.perf_counter()
        from backend.worker.runner import get_brain_decision  # lazy import

        brain_decision = get_brain_decision(
            envelope.get("signals", envelope),
            config=envelope.get("config"),
            metrics_client=metrics_client,
            fake_mode=envelope.get("fake_mode"),
        )
        duration = time.perf_counter() - t0
        _mark_stage(trace_context, "brain", duration)
        _inc(metrics_client, "pipeline_requests_total", _labels("brain", outcome="success", trace_context=trace_context), enabled=observability)
        _observe(metrics_client, "pipeline_stage_latency_seconds", duration, _labels("brain", trace_context=trace_context), enabled=observability)
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_pipeline_brain_error", extra={"event": "runtime_pipeline_brain_error", "error": str(exc)})
        return _fail("brain", "exception", metrics_client, trace_context, observability)

    _mark_stage(trace_context, "trade_engine")
    try:
        t0 = time.perf_counter()
        from backend.worker.runner.trade_engine_runner import get_trade_action  # lazy import

        trade_action = get_trade_action(
            brain_decision or {},
            fake_mode=envelope.get("fake_mode"),
            metrics=metrics_client,
        )
        duration = time.perf_counter() - t0
        _mark_stage(trace_context, "trade_engine", duration)
        _inc(metrics_client, "pipeline_requests_total", _labels("trade_engine", outcome="success", trace_context=trace_context), enabled=observability)
        _observe(metrics_client, "pipeline_stage_latency_seconds", duration, _labels("trade_engine", trace_context=trace_context), enabled=observability)
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_pipeline_trade_error", extra={"event": "runtime_pipeline_trade_error", "error": str(exc)})
        return _fail("trade_engine", "exception", metrics_client, trace_context, observability)

    _mark_stage(trace_context, "runtime_router")
    try:
        t0 = time.perf_counter()
        from backend.worker import runtime_router  # lazy import

        try:
            router_result = runtime_router.route(
                trade_action or {},
                metrics_client=metrics_client,
                fake_mode=envelope.get("fake_mode"),
                trace_context=trace_context,
            )
        except TypeError:
            router_result = runtime_router.route(
                trade_action or {},
                metrics_client=metrics_client,
                fake_mode=envelope.get("fake_mode"),
            )
        duration = time.perf_counter() - t0
        _mark_stage(trace_context, "runtime_router", duration)
        _inc(metrics_client, "pipeline_requests_total", _labels("runtime_router", outcome="success", trace_context=trace_context), enabled=observability)
        _observe(metrics_client, "pipeline_stage_latency_seconds", duration, _labels("runtime_router", trace_context=trace_context), enabled=observability)
    except Exception as exc:  # pragma: no cover
        logger.warning("runtime_pipeline_router_error", extra={"event": "runtime_pipeline_router_error", "error": str(exc)})
        return _fail("runtime_router", "exception", metrics_client, trace_context, observability)

    if intent_enabled:
        _mark_stage(trace_context, "intent_preview")
        try:
            t0 = time.perf_counter()
            from backend.worker import intent_preview_runtime  # lazy import

            try:
                intent_preview = intent_preview_runtime.get_intent_preview(
                    brain_decision or {},
                    envelope.get("snapshot", {}),
                    metrics_client=metrics_client,
                    fake_mode=envelope.get("fake_mode"),
                    trace_context=trace_context,
                )
            except TypeError:
                intent_preview = intent_preview_runtime.get_intent_preview(
                    brain_decision or {},
                    envelope.get("snapshot", {}),
                    metrics_client=metrics_client,
                    fake_mode=envelope.get("fake_mode"),
                )
            duration = time.perf_counter() - t0
            _mark_stage(trace_context, "intent_preview", duration)
            _inc(metrics_client, "pipeline_requests_total", _labels("intent_preview", outcome="success", trace_context=trace_context), enabled=observability)
            _observe(metrics_client, "pipeline_stage_latency_seconds", duration, _labels("intent_preview", trace_context=trace_context), enabled=observability)
        except Exception as exc:  # pragma: no cover
            logger.warning("runtime_pipeline_intent_error", extra={"event": "runtime_pipeline_intent_error", "error": str(exc)})
            _inc(metrics_client, "pipeline_failures_total", _labels("intent_preview", reason="exception", trace_context=trace_context), enabled=observability)
            _inc(metrics_client, "pipeline_requests_total", _labels("intent_preview", outcome="fail", trace_context=trace_context), enabled=observability)
            rationale.append("intent_preview_failed")

    status = "success"
    if trace_context and router_result is not None:
        router_meta = router_result.get("meta") or {}
        router_meta.setdefault("trace_id", trace_context["trace_id"])
        router_result["meta"] = router_meta

    return {
        "status": status,
        "reason": None,
        "rationale": rationale,
        "brain_decision": brain_decision,
        "trade_action": trade_action,
        "router_result": router_result,
        "intent_preview": intent_preview,
        "meta": {
            "pipeline_fake_mode": False,
            "intent_preview_enabled": intent_enabled,
            "trace_id": (trace_context or {}).get("trace_id"),
            "pipeline_start_ts": (trace_context or {}).get("pipeline_start_ts"),
            "stages": (trace_context or {}).get("stages", {}),
        },
    }


__all__ = ["run_decision_pipeline"]
