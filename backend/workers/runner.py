from __future__ import annotations

import asyncio
import importlib
import time
from typing import Any, Dict, List, Optional

from backend.workers.events import broadcast_job_event


def _build_job(
    job_path: str,
    job_id: Optional[str] = None,
    args: Optional[List[Any]] = None,
    kwargs: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return {
        "job_id": job_id or "job-inline",
        "job_path": job_path,
        "args": args or [],
        "kwargs": kwargs or {},
    }


async def run_job_async(
    job: Dict[str, Any],
    *,
    loop: Optional[asyncio.AbstractEventLoop] = None,
) -> Any:
    """Async runner for a job dict; emits lifecycle events."""

    loop = loop or asyncio.get_event_loop()
    job_identifier = job.get("job_id", "job-inline")
    job_path = job.get("job_path")
    args = job.get("args", [])
    kwargs = job.get("kwargs", {})

    ts_started = int(time.time() * 1000)
    await broadcast_job_event(
        job_identifier,
        job_path,
        "started",
        payload={"ts_started": ts_started},
        ts=ts_started,
    )

    module_path, fn = job_path.rsplit(".", 1)
    mod = importlib.import_module(module_path)
    try:
        result = getattr(mod, fn)(*args, **kwargs)
    except Exception as exc:  # pragma: no cover - defensive capture
        ts_finished = int(time.time() * 1000)
        await broadcast_job_event(
            job_identifier,
            job_path,
            "error",
            payload={"error": str(exc), "ts_finished": ts_finished},
            ts=ts_finished,
        )
        raise

    ts_finished = int(time.time() * 1000)
    await broadcast_job_event(
        job_identifier,
        job_path,
        "done",
        payload={"ts_finished": ts_finished},
        ts=ts_finished,
    )
    return result


def run_job(path: str, *args, job_id: str | None = None, **kwargs):
    """Backward-compatible sync wrapper for legacy callers."""

    return run_once(
        _build_job(path, job_id=job_id, args=list(args), kwargs=kwargs)
    )


def run_once(job: Dict[str, Any]) -> Any:
    """Sync/test shim allowed to use asyncio.run for a single job."""

    return asyncio.run(run_job_async(job))
