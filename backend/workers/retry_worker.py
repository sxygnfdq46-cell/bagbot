from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, Optional

from backend.workers import job_store, metrics
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.runner import run_job_async


async def _maybe_await(value):
    if asyncio.iscoroutine(value) or asyncio.isfuture(value):
        return await value
    return value


def _now_ms() -> int:
    return int(time.time() * 1000)


async def redis_retry_worker(
    store: Optional[Any] = None,
    *,
    poll_interval_ms: int = 0,
    shutdown_event: Optional[asyncio.Event] = None,
    loop: Optional[asyncio.AbstractEventLoop] = None,
) -> None:
    """Drain due retries from RedisJobStore and re-run them.

    Stops when the retry set is drained or when cancelled.
    """

    store = store or job_store.default_store
    loop = loop or asyncio.get_event_loop()

    while True:
        if shutdown_event and shutdown_event.is_set():
            break
        now_ms = _now_ms()
        jobs = await _maybe_await(store.next_retry_jobs(now_ms))
        if not jobs:
            if poll_interval_ms > 0:
                try:
                    if shutdown_event:
                        await asyncio.wait_for(
                            shutdown_event.wait(),
                            timeout=poll_interval_ms / 1000.0,
                        )
                        break
                    await asyncio.sleep(poll_interval_ms / 1000.0)
                except asyncio.TimeoutError:
                    continue
            break

        for job_id, job in jobs:
            job_copy: Dict[str, Any] = dict(job)
            job_copy["job_id"] = job_id

            claimed = await _maybe_await(store.claim(job_id))
            if not claimed:
                continue

            attempts = await _maybe_await(store.attempts(job_id))
            job_copy["attempts"] = attempts
            metrics.default_metrics.worker_retry_triggered_total.inc()
            await run_job_async(
                job_copy,
                loop=loop,
                skip_claim=True,
                store=store,
            )

        if poll_interval_ms:
            try:
                if shutdown_event:
                    await asyncio.wait_for(
                        shutdown_event.wait(),
                        timeout=poll_interval_ms / 1000.0,
                    )
                    break
                await asyncio.sleep(poll_interval_ms / 1000.0)
            except asyncio.TimeoutError:
                continue


async def redis_queue_monitor(
    store: Optional[Any] = None,
    *,
    stale_ms: int = 300_000,
    shutdown_event: Optional[asyncio.Event] = None,
) -> Dict[str, int]:
    """Collect queue stats from RedisJobStore and publish metrics."""

    store = store or job_store.default_store
    if not isinstance(store, RedisJobStore):
        return {}

    redis = store._redis  # type: ignore[attr-defined]
    now_ms = _now_ms()
    queue_len = 0
    running = 0
    stuck = 0
    latest_update = 0

    pattern = f"{store._namespace}:*"  # type: ignore[attr-defined]
    async for key in redis.scan_iter(match=pattern):
        if str(key).endswith("retry_zset"):
            continue
        data = await redis.hgetall(key)
        state = data.get("state")
        updated_raw = data.get("updated_at")
        updated_at = int(float(updated_raw)) if updated_raw else 0

        if state == "enqueued":
            queue_len += 1
        if state == "running":
            running += 1
            if updated_at:
                age = now_ms - updated_at
                if age > stale_ms:
                    stuck += 1
                latest_update = max(latest_update, updated_at)

    heartbeat_age = now_ms - latest_update if latest_update else 0

    metrics.default_metrics.worker_queue_length.set(queue_len)
    metrics.default_metrics.worker_jobs_running.set(running)
    metrics.default_metrics.worker_jobs_stuck.set(stuck)
    metrics.default_metrics.worker_latest_heartbeat_age_ms.set(heartbeat_age)
    metrics.heartbeat_age_seconds.labels(worker_id="worker").set(
        heartbeat_age / 1000.0
    )

    if shutdown_event and shutdown_event.is_set():
        return {
            "queue_len": queue_len,
            "running": running,
            "stuck": stuck,
            "heartbeat_age_ms": heartbeat_age,
        }

    return {
        "queue_len": queue_len,
        "running": running,
        "stuck": stuck,
        "heartbeat_age_ms": heartbeat_age,
    }


async def redis_queue_monitor_loop(
    store: Optional[Any] = None,
    *,
    stale_ms: int = 300_000,
    poll_interval_ms: int = 5000,
    shutdown_event: Optional[asyncio.Event] = None,
) -> None:
    """Poll queue stats until shutdown_event is set."""

    while True:
        await redis_queue_monitor(
            store=store,
            stale_ms=stale_ms,
            shutdown_event=shutdown_event,
        )
        if shutdown_event and shutdown_event.is_set():
            break
        if poll_interval_ms <= 0:
            break
        try:
            if shutdown_event:
                await asyncio.wait_for(
                    shutdown_event.wait(),
                    timeout=poll_interval_ms / 1000.0,
                )
                break
            await asyncio.sleep(poll_interval_ms / 1000.0)
        except asyncio.TimeoutError:
            continue
