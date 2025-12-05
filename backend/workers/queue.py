"""Queue stubs for tests."""
from __future__ import annotations

import asyncio
import time
from typing import Any

from backend.workers.events import broadcast_job_event


HEARTBEAT_JOB_PATH = "backend.workers.tasks.worker_heartbeat"


def enqueue_task(func_path: str, *args: Any, **kwargs: Any) -> str:
    job_id = "job-queued"
    ts_enqueued = int(time.time() * 1000)

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(
            broadcast_job_event(
                job_id,
                func_path,
                "enqueued",
                payload={"ts_enqueued": ts_enqueued},
                ts=ts_enqueued,
            )
        )
    else:
        loop.create_task(
            broadcast_job_event(
                job_id,
                func_path,
                "enqueued",
                payload={"ts_enqueued": ts_enqueued},
                ts=ts_enqueued,
            )
        )

    return job_id


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
