"""Mock signal feed utilities (fake-mode aware).

- ``mock_frame``: deterministic snapshot for local/staging canaries.
- ``run_mock_feed_once``: optional helper to feed the runtime pipeline once.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from backend.signals.ingest import consume_signal

_FAKE_TRUE = {"1", "true", "yes", "on"}
logger = logging.getLogger(__name__)


def _env_bool(key: str, default: bool = False) -> bool:
    raw = os.environ.get(key)
    if raw is None:
        return default
    return raw.strip().lower() in _FAKE_TRUE


def _inc(metrics: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics:
        return
    inc = getattr(metrics, "inc", None) or getattr(metrics, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def mock_frame(seed: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Return a deterministic fake-mode frame for staging tests."""
    base = seed or {}
    instrument = base.get("instrument") or base.get("symbol") or "BTC-USD"
    return {
        "instrument": instrument,
        "timestamp": base.get("timestamp") or 1700000000,
        "features": {"price": base.get("price") or 10000.0, "signal_strength": 0.9},
        "raw": base or {"source": "mock_feed"},
    }


def run_mock_feed_once(signal: Optional[Dict[str, Any]] = None, *, metrics_client: Any = None) -> Dict[str, Any]:
    """Run a single mock feed invocation through the runtime pipeline.

    Requires ``SIGNALS_MOCK_FEED_ENABLED=1`` or ``SIGNALS_FAKE_MODE=1``.
    Intended for local/staging canaries; no external services required.
    """

    if not (_env_bool("SIGNALS_MOCK_FEED_ENABLED", False) or _env_bool("SIGNALS_FAKE_MODE", False)):
        _inc(metrics_client, "signals_mock_feed_runs_total", {"outcome": "skipped"})
        logger.info("signals_mock_feed_skip", extra={"event": "signals_mock_feed_skip", "reason": "mock_feed_disabled", "fake_mode": False})
        return {
            "status": "skipped",
            "reason": "mock_feed_disabled",
        }

    payload = signal or {"instrument": "BTC-USD", "snapshot": mock_frame()}
    result = consume_signal(payload)
    if result.get("status") != "success":
        _inc(metrics_client, "signals_mock_feed_runs_total", {"outcome": result.get("status", "fail")})
        return result

    envelope = result["envelope"]

    logger.info("signals_mock_feed_start", extra={"event": "signals_mock_feed_start", "instrument": envelope.get("instrument")})

    # Lazy import to preserve import safety
    from backend.worker.runtime_pipeline import run_decision_pipeline

    # Force fake mode for staging safety
    response = run_decision_pipeline(
        envelope,
        metrics_client=metrics_client,
        fake_mode=True,
    )

    trace_id = (response.get("router_result") or {}).get("meta", {}).get("trace_id")
    _inc(metrics_client, "signals_mock_feed_runs_total", {"outcome": response.get("status", "unknown")})
    logger.info(
        "signals_mock_feed_done",
        extra={"event": "signals_mock_feed_done", "status": response.get("status"), "trace_id": trace_id, "fake_mode": True},
    )

    return response


__all__ = ["mock_frame", "run_mock_feed_once"]
