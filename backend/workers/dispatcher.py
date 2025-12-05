"""Minimal dispatcher stub for worker jobs."""
from typing import Any, Dict

from backend.workers import queue


def route_job(job_path: str, payload: Dict[str, Any]) -> str:
    if not isinstance(job_path, str) or not job_path.strip():
        raise ValueError("job_path must be a non-empty string")

    if not isinstance(payload, dict) or not payload:
        raise ValueError("payload must be a non-empty dict")

    return queue.enqueue_task(job_path, payload)
