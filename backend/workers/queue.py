"""Queue stubs for tests."""
from typing import Any


HEARTBEAT_JOB_PATH = "backend.workers.tasks.worker_heartbeat"


def enqueue_task(func_path: str, *args: Any, **kwargs: Any) -> str:
    return "job-queued"


def enqueue_worker_heartbeat(node_id: str) -> str:
    return enqueue_task(HEARTBEAT_JOB_PATH, node_id=node_id)
