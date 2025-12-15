"""Mock data producers for the brain WebSocket feed.

This module now also drives a read-only observation loop that runs the
existing decision pipeline in fake mode and projects those decisions into the
telemetry buffers consumed by the Brain UI.
"""
from __future__ import annotations

import asyncio
import os
import random
from collections import deque
from contextlib import suppress
from datetime import datetime, timedelta
from typing import Any, Deque, Dict, List, Optional

from backend.signals.mock_feed import run_mock_feed_once
from backend.signals.telemetry import ensure_telemetry

from backend.schemas.brain import ActivityEvent, BrainMetrics, LogLine, StatusSnapshot

_ACTIVITY_STATUSES = ["stable", "spike", "offline", "degraded"]
_STATES = ["idle", "active", "training", "reinforcing"]
_MODES = ["autonomy", "review", "maintenance"]
_LOG_LEVELS = ["info", "warning", "error"]

_activity_events: List[ActivityEvent] = [
    ActivityEvent(
        id=f"activity-{index}",
        label="Signal alignment" if index % 2 == 0 else "Risk rebalance",
        location="Core East" if index % 2 == 0 else "Core West",
        intensity=0.3 + index * 0.05,
        status="stable",
        timestamp=datetime.utcnow() - timedelta(seconds=index * 5),
    )
    for index in range(4)
]

_metrics_snapshot = BrainMetrics(
    loadPercent=42.0,
    memoryPercent=58.0,
    decisionsPerMinute=18,
    anomalyScore=0.12,
)

_status_snapshot = StatusSnapshot(
    state="active",
    uptime="72h 05m",
    mode="autonomy",
    lastDecision="Scale BTC core",
)

_log_buffer: Deque[LogLine] = deque(maxlen=50)
_observation_task: Optional[asyncio.Task] = None
_OBSERVER_INTERVAL_SECONDS = float(os.environ.get("BRAIN_OBSERVER_INTERVAL_SECONDS", "8"))
_decision_timeline: Deque[Dict[str, Any]] = deque(maxlen=50)
_state_lock = asyncio.Lock()


def _append_log(level: str, message: str) -> None:
    _log_buffer.appendleft(
        LogLine(
            id=f"log-{datetime.utcnow().isoformat()}",
            level=level,  # type: ignore[arg-type]
            message=message,
            timestamp=datetime.utcnow(),
        )
    )


_append_log("info", "Brain telemetry initialized")


def _ensure_fake_mode() -> None:
    os.environ.setdefault("SIGNALS_MOCK_FEED_ENABLED", "1")
    os.environ.setdefault("SIGNALS_FAKE_MODE", "1")
    os.environ.setdefault("BRAIN_FAKE_MODE", "1")


def _mutate_activity() -> None:
    global _activity_events
    updated: List[ActivityEvent] = []
    for event in _activity_events:
        drift = (random.random() - 0.5) * 0.2
        intensity = max(0.1, min(1.0, event.intensity + drift))
        status = event.status if random.random() > 0.85 else random.choice(_ACTIVITY_STATUSES)
        updated.append(
            ActivityEvent(
                id=event.id,
                label=event.label,
                location=event.location,
                intensity=intensity,
                status=status,
                timestamp=datetime.utcnow(),
            )
        )
    if random.random() > 0.6:
        updated.insert(
            0,
            ActivityEvent(
                id=f"activity-{datetime.utcnow().timestamp()}",
                label=random.choice(["Signal alignment", "Volatility sweep", "Cross-exchange scan", "Safe-mode audit"]),
                location=random.choice(["Core North", "Core South", "Neuron L", "Neuron S"]),
                intensity=round(random.uniform(0.2, 0.9), 2),
                status=random.choice(_ACTIVITY_STATUSES),
                timestamp=datetime.utcnow(),
            ),
        )
    _activity_events = updated[:10]


def _mutate_metrics() -> None:
    global _metrics_snapshot
    _metrics_snapshot = BrainMetrics(
        loadPercent=max(5.0, min(95.0, _metrics_snapshot.loadPercent + (random.random() - 0.5) * 5)),
        memoryPercent=max(5.0, min(95.0, _metrics_snapshot.memoryPercent + (random.random() - 0.5) * 4)),
        decisionsPerMinute=max(5, min(60, _metrics_snapshot.decisionsPerMinute + random.randint(-2, 3))),
        anomalyScore=max(0.0, min(1.0, _metrics_snapshot.anomalyScore + (random.random() - 0.5) * 0.05)),
    )


def _mutate_status() -> None:
    global _status_snapshot
    uptime_hours, uptime_minutes = _status_snapshot.uptime.split("h ")
    hours = int(uptime_hours)
    minutes = int(uptime_minutes.replace("m", ""))
    minutes += random.randint(1, 3)
    hours += minutes // 60
    minutes = minutes % 60
    _status_snapshot = StatusSnapshot(
        state=random.choice(_STATES) if random.random() > 0.8 else _status_snapshot.state,
        mode=random.choice(_MODES) if random.random() > 0.9 else _status_snapshot.mode,
        uptime=f"{hours}h {minutes:02d}m",
        lastDecision=_status_snapshot.lastDecision,
    )


def _mutate_logs() -> None:
    if random.random() > 0.5:
        _append_log(
            random.choice(_LOG_LEVELS),
            random.choice(
                [
                    "Strategy alignment recalculated",
                    "Temperature spike mitigated",
                    "Memory compaction executed",
                    "Decision buffer cleared",
                ]
            ),
        )


async def get_brain_activity() -> List[ActivityEvent]:
    """Return the most recent brain activity events."""
    async with _state_lock:
        _mutate_activity()
        return list(_activity_events)


async def get_brain_metrics() -> BrainMetrics:
    """Return the current aggregate brain metrics."""
    async with _state_lock:
        _mutate_metrics()
        return _metrics_snapshot


async def get_brain_logs() -> List[LogLine]:
    """Return the rolling brain log buffer."""
    async with _state_lock:
        _mutate_logs()
        return list(_log_buffer)


async def get_brain_status() -> StatusSnapshot:
    """Return the latest brain state snapshot."""
    async with _state_lock:
        _mutate_status()
        return _status_snapshot

def _ingest_decision(decision: Dict[str, Any], trace_id: Optional[str]) -> None:
    """Project a brain decision into activity + logs for observability."""

    if not isinstance(decision, dict):
        return

    meta = decision.get("meta") or {}
    trace_id = trace_id or meta.get("trace_id")
    action = str(decision.get("action") or "hold")
    confidence = float(decision.get("confidence") or 0.0)

    event = ActivityEvent(
        id=f"decision-{datetime.utcnow().timestamp()}",
        label=f"Decision: {action}",
        location="Observation Loop",
        intensity=max(0.1, min(1.0, confidence)),
        status="stable",
        timestamp=datetime.utcnow(),
    )

    # Prepend the latest decision to the activity buffer
    global _activity_events
    _activity_events = [event, *_activity_events][:10]

    _decision_timeline.appendleft(
        {
            "id": event.id,
            "action": action,
            "confidence": confidence,
            "timestamp": event.timestamp.isoformat(),
            "trace_id": trace_id,
        }
    )

    # Record a log line with trace continuity
    detail = f"brain_decision action={action} confidence={confidence:.2f}"
    if trace_id:
        detail = f"{detail} trace_id={trace_id}"
    _append_log("info", detail)

    # Keep metrics snapshot aligned with observed decisions
    decisions_per_minute = max(1, min(120, _metrics_snapshot.decisionsPerMinute + 1))
    _metrics_snapshot.decisionsPerMinute = decisions_per_minute
    _status_snapshot.lastDecision = f"{action} ({confidence:.2f})"


async def _observation_cycle() -> None:
    telemetry: Dict[str, Any] = ensure_telemetry({})
    _ensure_fake_mode()
    response = await asyncio.to_thread(run_mock_feed_once, None, metrics_client=None)
    brain_decision = response.get("brain_decision") if isinstance(response, dict) else None
    if isinstance(brain_decision, dict):
        brain_decision.setdefault("meta", {}).setdefault("trace_id", telemetry.get("trace_id"))
    async with _state_lock:
        _ingest_decision(brain_decision or {}, telemetry.get("trace_id"))


async def get_decision_timeline() -> List[Dict[str, Any]]:
    """Return a recent decision timeline for observers."""

    async with _state_lock:
        return list(_decision_timeline)


async def _observation_loop() -> None:
    while True:
        try:
            await _observation_cycle()
        except Exception as exc:  # pragma: no cover - resilience guard
            _append_log("warning", f"observation_cycle_error: {exc}")
        await asyncio.sleep(_OBSERVER_INTERVAL_SECONDS)


async def start_brain_observer() -> None:
    """Start the background observation loop (idempotent)."""

    global _observation_task
    if _observation_task and not _observation_task.done():
        return

    _ensure_fake_mode()
    _observation_task = asyncio.create_task(_observation_loop())


async def stop_brain_observer() -> None:
    """Stop the background observation loop if running."""

    global _observation_task
    if not _observation_task:
        return

    _observation_task.cancel()
    with suppress(asyncio.CancelledError):
        await _observation_task
    _observation_task = None
