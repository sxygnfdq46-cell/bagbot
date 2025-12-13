"""Runtime shim for TradeEngine (import-safe, lazy-loaded).

- Lazy imports TradeEngine to keep import-time side effects zero.
- Supports deterministic fake mode via param or TRADE_ENGINE_FAKE_MODE env.
- Provides safe fallback on errors/router failures and emits metrics when injected.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _fake_mode_enabled(fake_mode: Optional[bool]) -> bool:
    if fake_mode is not None:
        return bool(fake_mode)
    return os.environ.get("TRADE_ENGINE_FAKE_MODE", "").strip().lower() in _FAKE_TRUE


def _load_engine(engine_class: Any = None, *, metrics: Any = None, router: Any = None):
    if engine_class:
        return engine_class(metrics=metrics, router=router)
    from backend.trading.engine import TradeEngine  # lazy import for import-safety

    return TradeEngine(metrics=metrics, router=router)


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover - defensive
            return


def _fake_envelope(decision: Dict[str, Any]) -> Dict[str, Any]:
    instrument = "unknown"
    if isinstance(decision, dict):
        instrument = decision.get("instrument", "unknown")
    return {
        "action": "hold",
        "envelope": {
            "action": "hold",
            "amount": 0.0,
            "confidence": 0.0,
            "instrument": instrument,
            "metadata": {"risk_flags": ["fake_mode"], "fake": True},
            "reason": "fake_mode",
        },
        "reason": "fake_mode",
    }


def _wrap_envelope(envelope: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "action": envelope.get("action", "hold") if isinstance(envelope, dict) else "hold",
        "envelope": envelope if isinstance(envelope, dict) else None,
        "reason": envelope.get("reason") if isinstance(envelope, dict) else "trade_engine_error",
    }


def get_trade_action(
    decision: Dict[str, Any],
    *,
    fake_mode: Optional[bool] = None,
    metrics: Any = None,
    router: Any = None,
    engine_class: Any = None,
) -> Dict[str, Any]:
    """Return a trade action envelope from the TradeEngine.

    - Fake mode: deterministic hold, no engine calls.
    - Real mode: instantiate TradeEngine lazily, process decision, handle router failover.
    - Always safe: any exception returns hold with reason and increments failure metric.
    """

    use_fake = _fake_mode_enabled(fake_mode)

    try:
        if use_fake:
            fake = _fake_envelope(decision or {})
            _inc(metrics, "trade_engine_requests_total", {"outcome": "success"})
            _inc(metrics, "trade_engine_actions_total", {"action": fake["action"]})
            return fake

        engine = _load_engine(engine_class, metrics=metrics, router=router)
        envelope = engine.process(decision or {}, fake_mode=False)

        if envelope.get("reason") == "router_error":
            _inc(metrics, "trade_engine_failures_total", {"reason": "router_error"})
            _inc(metrics, "trade_engine_requests_total", {"outcome": "failure"})
        else:
            _inc(metrics, "trade_engine_requests_total", {"outcome": "success"})

        _inc(metrics, "trade_engine_actions_total", {"action": envelope.get("action", "hold")})
        return _wrap_envelope(envelope)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "trade_engine_runner_error",
            extra={"event": "trade_engine_runner_error", "error": str(exc)},
        )
        _inc(metrics, "trade_engine_requests_total", {"outcome": "failure"})
        _inc(metrics, "trade_engine_failures_total", {"reason": "exception"})
        return {"action": "hold", "envelope": None, "reason": "trade_engine_error"}


__all__ = ["get_trade_action"]
