"""Queue stubs for tests."""
from __future__ import annotations

import asyncio
import time
from typing import Any

from backend.workers.events import broadcast_job_event
from backend.workers.runner import _build_job, run_job_async


HEARTBEAT_JOB_PATH = "backend.workers.tasks.worker_heartbeat"


def enqueue_task(func_path: str, *args: Any, **kwargs: Any) -> str:
    job_id = "job-queued"
    ts_enqueued = int(time.time() * 1000)

    job = _build_job(func_path, job_id=job_id, args=list(args), kwargs=kwargs)

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # defensive fallback for sync callers without an active loop
        new_loop = asyncio.new_event_loop()
        try:
            new_loop.run_until_complete(
                broadcast_job_event(
                    job_id,
                    func_path,
                    "enqueued",
                    payload={"ts_enqueued": ts_enqueued},
                    ts=ts_enqueued,
                )
            )
            new_loop.run_until_complete(run_job_async(job, loop=new_loop))
        finally:
            new_loop.close()
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
        loop.create_task(run_job_async(job, loop=loop))

    return job_id


def enqueue_worker_heartbeat(
    node_id: str | None = None,
    *,
    timestamp: int | None = None,
) -> str:
    """Enqueue heartbeat; accepts node_id (legacy) or timestamp payload."""
    target_node = node_id or "worker"
    return enqueue_task(HEARTBEAT_JOB_PATH, target_node)
