"""Lightweight telemetry helpers for signals ingest paths."""

from __future__ import annotations

import time
from contextlib import contextmanager
from typing import Any, Dict, Optional

__all__ = ["capture_span", "record_metric", "ensure_telemetry"]


def ensure_telemetry(telemetry: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Normalize telemetry container with spans/metrics buckets."""
    container = telemetry if telemetry is not None else {}
    container.setdefault("spans", [])
    container.setdefault("metrics", [])
    return container


@contextmanager
def capture_span(name: str, telemetry: Optional[Dict[str, Any]] = None):
    """Context manager capturing duration in milliseconds into telemetry."""

    container = ensure_telemetry(telemetry) if telemetry is not None else None
    start = time.perf_counter()
    try:
        yield
    finally:
        duration_ms = (time.perf_counter() - start) * 1000.0
        if container is not None:
            container.setdefault("spans", []).append({"name": name, "duration_ms": duration_ms})


def _increment(metrics_client: Any, name: str, labels: Optional[Dict[str, Any]] = None) -> None:
    if not metrics_client:
        return
    inc = getattr(metrics_client, "inc", None) or getattr(metrics_client, "increment", None)
    if callable(inc):
        try:
            inc(name, labels=labels or {})
        except Exception:  # pragma: no cover
            return


def record_metric(
    name: str,
    *,
    telemetry: Optional[Dict[str, Any]] = None,
    metrics_client: Any = None,
    labels: Optional[Dict[str, Any]] = None,
) -> None:
    """Record a metric to telemetry and forward to metrics_client if provided."""

    if telemetry is not None:
        ensure_telemetry(telemetry).setdefault("metrics", []).append({"name": name, "labels": labels or {}})
    _increment(metrics_client, name, labels=labels)
