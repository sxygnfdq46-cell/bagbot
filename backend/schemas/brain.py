"""Brain telemetry schemas used by the WebSocket channel."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class ActivityEvent(BaseModel):
    """Tracks high-level neural activity events."""

    id: str
    label: str
    location: str
    intensity: float
    status: Literal["stable", "spike", "offline", "degraded"]
    timestamp: datetime


class BrainMetrics(BaseModel):
    """Represents aggregate load/performance metrics."""

    loadPercent: float
    memoryPercent: float
    decisionsPerMinute: int
    anomalyScore: float


class LogLine(BaseModel):
    """Represents a rolling log entry from the brain."""

    id: str
    level: Literal["info", "warning", "error"]
    message: str
    timestamp: datetime


class StatusSnapshot(BaseModel):
    """High-level brain status state."""

    state: Literal["idle", "active", "training", "reinforcing"]
    uptime: str
    mode: Literal["autonomy", "review", "maintenance"]
    lastDecision: str
