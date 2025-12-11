"""Signal ingestion and normalization into runtime pipeline envelopes.

Public entrypoints:
- ``consume_signal``: existing signal normalization helper.
- ``ingest_frame``: safe ingest hook for pre-normalized frames when
    ``SIGNALS_INGEST_ENABLED`` is set.

Both remain import-safe and fake-mode aware.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

from backend.signals.telemetry import capture_span, ensure_telemetry, record_metric

_FAKE_TRUE = {"1", "true", "yes", "on"}


def _env_bool(key: str, default: bool = False) -> bool:
    raw = os.environ.get(key)
    if raw is None:
        return default
    return raw.strip().lower() in _FAKE_TRUE


def _fake_snapshot(seed: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Return a deterministic fake snapshot for testing/staging."""
    instrument = (seed or {}).get("instrument") or (seed or {}).get("symbol") or "BTC-USD"
    ts = (seed or {}).get("timestamp") or 1700000000
    price = 10000.0
    return {
        "instrument": instrument,
        "timestamp": ts,
        "features": {"price": price, "signal_strength": 0.75},
        "raw": seed or {"source": "fake"},
    }


def _error(reason: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "status": "error",
        "reason": reason,
        "details": details or {},
    }


def _normalize_instrument(signal: Dict[str, Any]) -> Optional[str]:
    for key in ("instrument", "symbol", "pair"):
        val = signal.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


def ingest_frame(frame: Dict[str, Any], *, metrics_client: Any = None, telemetry: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Normalize a pre-built frame into a pipeline envelope.

    The frame is expected to already contain an instrument, timestamp, and
    optional features/raw payload. No external services are invoked.
    """

    telemetry = ensure_telemetry(telemetry) if telemetry is not None else None

    with capture_span("ingest_frame", telemetry):
        if not isinstance(frame, dict):
            record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "error", "path": "ingest_frame"})
            return _error("invalid_frame", {"message": "frame must be a dict"})

        instrument = _normalize_instrument(frame) or frame.get("instrument")
        if not instrument:
            record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "error", "path": "ingest_frame"})
            return _error("missing_instrument", {"message": "instrument/symbol is required"})

        if _env_bool("SIGNALS_FAKE_MODE", False) or _env_bool("BRAIN_FAKE_MODE", False):
            fake_snapshot = _fake_snapshot(frame)
            record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "success", "path": "ingest_frame"})
            return {
                "status": "success",
                "envelope": {
                    "instrument": fake_snapshot.get("instrument"),
                    "signals": {"raw": frame, "normalized": fake_snapshot},
                    "snapshot": fake_snapshot,
                    "fake_mode": True,
                },
                "telemetry": telemetry,
            }

        snapshot = frame.get("snapshot") if isinstance(frame.get("snapshot"), dict) else None
        if snapshot is None:
            snapshot = {
                "instrument": instrument,
                "timestamp": frame.get("timestamp") or time.time(),
                "features": frame.get("features") or {},
                "raw": frame,
            }

        envelope = {
            "instrument": instrument,
            "signals": frame,
            "snapshot": snapshot,
        }

        record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "success", "path": "ingest_frame"})
        return {"status": "success", "envelope": envelope, "telemetry": telemetry}


def consume_signal(signal: Dict[str, Any], *, metrics_client: Any = None, telemetry: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Normalize an inbound signal into a runtime pipeline envelope.

    Args:
        signal: Raw signal payload (dict) from external feeds.

    Returns:
        dict containing either ``status: success`` with normalized envelope
        or ``status: error`` with a reason/details payload.
    """

    telemetry = ensure_telemetry(telemetry) if telemetry is not None else None

    with capture_span("consume_signal", telemetry):
        if not isinstance(signal, dict):
            record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "error", "path": "consume_signal"})
            return _error("invalid_signal", {"message": "signal must be a dict"})

        if _env_bool("SIGNALS_FAKE_MODE", False) or _env_bool("BRAIN_FAKE_MODE", False):
            fake_snapshot = _fake_snapshot(signal)
            record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "success", "path": "consume_signal"})
            return {
                "status": "success",
                "envelope": {
                    "instrument": fake_snapshot.get("instrument"),
                    "signals": {"raw": signal, "normalized": fake_snapshot},
                    "snapshot": fake_snapshot,
                    "fake_mode": True,
                },
                "telemetry": telemetry,
            }

        instrument = _normalize_instrument(signal)
        if not instrument:
            record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "error", "path": "consume_signal"})
            return _error("missing_instrument", {"message": "instrument/symbol is required"})

        snapshot = signal.get("snapshot") if isinstance(signal.get("snapshot"), dict) else None
        if snapshot is None:
            # Build a minimal snapshot with timestamp + features bucket
            snapshot = {
                "instrument": instrument,
                "timestamp": signal.get("timestamp") or time.time(),
                "features": signal.get("features") or {},
                "raw": signal,
            }

        envelope = {
            "instrument": instrument,
            "signals": signal,
            "snapshot": snapshot,
        }

        record_metric("signals.ingest.invocations_total", telemetry=telemetry, metrics_client=metrics_client, labels={"outcome": "success", "path": "consume_signal"})
        return {
            "status": "success",
            "envelope": envelope,
            "telemetry": telemetry,
        }


__all__ = ["consume_signal", "ingest_frame"]
