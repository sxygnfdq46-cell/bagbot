from __future__ import annotations

import asyncio
import importlib
import time
from typing import Any

from backend.workers.events import broadcast_job_event


def _schedule(coro: Any) -> None:
    """Await coroutine now or schedule if an event loop is already running."""

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(coro)
    else:
        loop.create_task(coro)


def run_job(path: str, *args, job_id: str | None = None, **kwargs):
    job_identifier = job_id or kwargs.pop("job_id", "job-inline")

    ts_started = int(time.time() * 1000)
    _schedule(
        broadcast_job_event(
            job_identifier,
            path,
            "started",
            payload={"ts_started": ts_started},
            ts=ts_started,
        )
    )

    module_path, fn = path.rsplit(".", 1)
    mod = importlib.import_module(module_path)
    try:
        result = getattr(mod, fn)(*args, **kwargs)
    except Exception as exc:  # pragma: no cover - captured by tests
        ts_finished = int(time.time() * 1000)
        _schedule(
            broadcast_job_event(
                job_identifier,
                path,
                "error",
                payload={"error": str(exc), "ts_finished": ts_finished},
                ts=ts_finished,
            )
        )
        raise

    ts_finished = int(time.time() * 1000)
    _schedule(
        broadcast_job_event(
            job_identifier,
            path,
            "done",
            payload={"ts_finished": ts_finished},
            ts=ts_finished,
        )
    )
    return result
