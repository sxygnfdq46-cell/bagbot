"""Queue stubs for tests."""
from __future__ import annotations

import asyncio
import time
import uuid
from typing import Any

from backend.workers.events import broadcast_job_event
from backend.workers.job_store import default_store
from backend.workers.metrics import default_metrics
from backend.workers.runner import _build_job, run_job_async


HEARTBEAT_JOB_PATH = "backend.workers.tasks.worker_heartbeat"


def _ensure_job_id(job_id: str | None = None) -> str:
    return job_id or f"job-{uuid.uuid4().hex[:12]}"


def enqueue_task(
    func_path: str,
    *args: Any,
    job_id: str | None = None,
    **kwargs: Any,
) -> str:
    job_id = _ensure_job_id(job_id)
    ts_enqueued = int(time.time() * 1000)

    default_store.set_state(job_id, "enqueued")
    attempts = default_store.attempts(job_id)

    default_metrics.worker_jobs_enqueued_total.inc()

    job = _build_job(
        func_path,
        job_id=job_id,
        args=list(args),
        kwargs=kwargs,
        attempts=attempts,
    )

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # sync callers: just return the job id; execution happens elsewhere
        return job_id
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
    return enqueue_task(HEARTBEAT_JOB_PATH, target_node, job_id="job-queued")
