"""Signal ingestion and normalization into runtime pipeline envelopes.

Public entrypoint: ``consume_signal``.
- Import-safe: lazy imports only when invoking downstream pipeline.
- Fake-mode aware via ``SIGNALS_FAKE_MODE`` or ``BRAIN_FAKE_MODE``.
"""

from __future__ import annotations

import os
import time
from typing import Any, Dict, Optional

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


def consume_signal(signal: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize an inbound signal into a runtime pipeline envelope.

    Args:
        signal: Raw signal payload (dict) from external feeds.

    Returns:
        dict containing either ``status: success`` with normalized envelope
        or ``status: error`` with a reason/details payload.
    """

    if not isinstance(signal, dict):
        return _error("invalid_signal", {"message": "signal must be a dict"})

    if _env_bool("SIGNALS_FAKE_MODE", False) or _env_bool("BRAIN_FAKE_MODE", False):
        fake_snapshot = _fake_snapshot(signal)
        return {
            "status": "success",
            "envelope": {
                "instrument": fake_snapshot.get("instrument"),
                "signals": {"raw": signal, "normalized": fake_snapshot},
                "snapshot": fake_snapshot,
                "fake_mode": True,
            },
        }

    instrument = _normalize_instrument(signal)
    if not instrument:
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

    return {
        "status": "success",
        "envelope": envelope,
    }


__all__ = ["consume_signal"]
