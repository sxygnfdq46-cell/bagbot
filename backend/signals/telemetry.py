"""Lightweight telemetry helpers for signals ingest paths."""

from __future__ import annotations

import time
import uuid
from contextlib import contextmanager
from typing import Any, Dict, Optional

__all__ = ["capture_span", "record_metric", "ensure_telemetry", "new_trace_id"]


def new_trace_id() -> str:
    """Return a short, hex trace_id used across telemetry buckets."""

    return uuid.uuid4().hex[:16]


def ensure_telemetry(telemetry: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Normalize telemetry container with spans/metrics buckets and a trace_id."""

    container = telemetry if telemetry is not None else {}
    container.setdefault("spans", [])
    container.setdefault("metrics", [])
    container.setdefault("trace_id", new_trace_id())
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
            container.setdefault("spans", []).append({"name": name, "duration_ms": duration_ms, "trace_id": container.get("trace_id")})


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
        container = ensure_telemetry(telemetry)
        merged_labels = dict(labels or {})
        trace_id = container.get("trace_id")
        if trace_id and "trace_id" not in merged_labels:
            merged_labels["trace_id"] = trace_id
        container.setdefault("metrics", []).append({"name": name, "labels": merged_labels})

    _increment(metrics_client, name, labels=labels)
