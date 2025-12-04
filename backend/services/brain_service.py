"""Mock data producers for the brain WebSocket feed."""
from __future__ import annotations

import random
from collections import deque
from datetime import datetime, timedelta
from typing import Deque, List

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

    _mutate_activity()
    return list(_activity_events)


async def get_brain_metrics() -> BrainMetrics:
    """Return the current aggregate brain metrics."""

    _mutate_metrics()
    return _metrics_snapshot


async def get_brain_logs() -> List[LogLine]:
    """Return the rolling brain log buffer."""

    _mutate_logs()
    return list(_log_buffer)


async def get_brain_status() -> StatusSnapshot:
    """Return the latest brain state snapshot."""

    _mutate_status()
    return _status_snapshot
