"""Queue stubs for tests."""
from __future__ import annotations

from typing import Any


HEARTBEAT_JOB_PATH = "backend.workers.tasks.worker_heartbeat"


def enqueue_task(func_path: str, *args: Any, **kwargs: Any) -> str:
    return "job-queued"


def enqueue_worker_heartbeat(
    node_id: str | None = None,
    *,
    timestamp: int | None = None,
) -> str:
    """Enqueue heartbeat; accepts node_id (legacy) or timestamp payload."""

    if timestamp is not None:
        payload = {"timestamp": timestamp}
    else:
        payload = {"node_id": node_id}

    return enqueue_task(HEARTBEAT_JOB_PATH, payload)
