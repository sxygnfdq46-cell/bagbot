from __future__ import annotations

import asyncio
import importlib
import logging
import time
import uuid
import inspect
from typing import Any, Dict, List, Optional

from backend.workers.events import broadcast_job_event
from backend.workers.metrics import default_metrics
from backend.workers.job_store import default_store
from backend.workers.retry_policy import default_retry


def _build_job(
    job_path: str,
    job_id: Optional[str] = None,
    args: Optional[List[Any]] = None,
    kwargs: Optional[Dict[str, Any]] = None,
    attempts: Optional[int] = None,
) -> Dict[str, Any]:
    return {
        "job_id": job_id or "job-inline",
        "job_path": job_path,
        "args": args or [],
        "kwargs": kwargs or {},
        "attempts": attempts if attempts is not None else 0,
    }


async def _maybe_await(value):
    if inspect.isawaitable(value):
        return await value
    return value


async def run_job_async(
    job: Dict[str, Any],
    *,
    loop: Optional[asyncio.AbstractEventLoop] = None,
    skip_claim: bool = False,
) -> Any:
    """Async runner for a job dict; emits lifecycle events.

    skip_claim is used by retry workers that have already claimed the job.
    """

    loop = loop or asyncio.get_event_loop()
    job_identifier = job.get("job_id", "job-inline")
    job_path = job.get("job_path")
    args = job.get("args", [])
    kwargs = job.get("kwargs", {})

    if not skip_claim:
        claimed = await _maybe_await(default_store.claim(job_identifier))
        if not claimed:
            logging.getLogger(__name__).info(
                "job already running or finished; skipping",
                extra={"job_id": job_identifier},
            )
            return {
                "status": "skipped",
                "job_id": job_identifier,
                "attempts": await _maybe_await(
                    default_store.attempts(job_identifier)
                ),
            }

    attempts = job.get("attempts")
    if attempts is None:
        attempts = await _maybe_await(
            default_store.attempts(job_identifier)
        )
    job["attempts"] = attempts
    await _maybe_await(
        default_store.set_last_job(job_identifier, job)
    )

    ts_started = int(time.time() * 1000)
    default_metrics.worker_jobs_started_total.inc()
    await broadcast_job_event(
        job_identifier,
        job_path,
        "started",
        payload={"ts_started": ts_started, "attempts": attempts},
        ts=ts_started,
    )

    module_path, fn = job_path.rsplit(".", 1)
    mod = importlib.import_module(module_path)
    try:
        result = getattr(mod, fn)(*args, **kwargs)
    except Exception as exc:  # pragma: no cover - defensive capture
        ts_finished = int(time.time() * 1000)
        attempts_next = await _maybe_await(
            default_store.increment_attempts(job_identifier)
        )
        backoff_seconds = default_retry.backoff_fn(attempts_next)
        next_retry_ts = ts_finished + int(backoff_seconds * 1000)

        await broadcast_job_event(
            job_identifier,
            job_path,
            "error",
            payload={
                "error": str(exc),
                "ts_finished": ts_finished,
                "attempts": attempts_next,
                "next_retry_ts": next_retry_ts,
            },
            ts=ts_finished,
        )

        if attempts_next <= default_retry.max_attempts:
            await _maybe_await(
                default_store.set_last_job(job_identifier, job)
            )
            await _maybe_await(
                default_store.schedule_retry(job_identifier, next_retry_ts)
            )
            default_metrics.worker_jobs_retried_total.inc()
            return {
                "status": "retry_scheduled",
                "job_id": job_identifier,
                "attempts": attempts_next,
                "next_retry_at": next_retry_ts,
            }

        await _maybe_await(
            default_store.set_state(
                job_identifier,
                "error",
                last_error=str(exc),
            )
        )
        default_metrics.worker_jobs_failed_total.inc()
        raise

    ts_finished = int(time.time() * 1000)
    await _maybe_await(
        default_store.set_state(job_identifier, "done")
    )
    default_metrics.worker_jobs_done_total.inc()
    default_metrics.worker_job_duration_seconds.observe(
        (ts_finished - ts_started) / 1000.0
    )
    await broadcast_job_event(
        job_identifier,
        job_path,
        "done",
        payload={"ts_finished": ts_finished, "attempts": attempts},
        ts=ts_finished,
    )
    return result


def run_job(path: str, *args, job_id: str | None = None, **kwargs):
    """Backward-compatible sync wrapper for legacy callers."""

    job_identifier = job_id or f"job-{uuid.uuid4().hex[:12]}"
    attempts_val = default_store.attempts(job_identifier)
    if inspect.isawaitable(attempts_val):
        try:
            asyncio.get_running_loop()
        except RuntimeError:
            attempts = asyncio.run(attempts_val)
        else:
            raise RuntimeError(
                "run_job cannot be called inside a running event loop when the"
                " store is async; use run_job_async instead"
            )
    else:
        attempts = attempts_val

    return run_once(
        _build_job(
            path,
            job_id=job_identifier,
            args=list(args),
            kwargs=kwargs,
            attempts=attempts,
        )
    )


async def retry_worker(now_ms: int | None = None) -> None:
    """Process scheduled retries that are due now."""

    now = now_ms or int(time.time() * 1000)
    due_jobs = await _maybe_await(default_store.next_retry_jobs(now))

    for job_id, job in due_jobs:
        job_copy = dict(job)
        job_copy["job_id"] = job_id
        await run_job_async(job_copy)


def run_once(job: Dict[str, Any]) -> Any:
    """Sync/test shim allowed to use asyncio.run for a single job."""

    return asyncio.run(run_job_async(job))
