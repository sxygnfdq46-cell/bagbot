import asyncio

import fakeredis.aioredis
import pytest

from backend.workers.orchestration import WorkerCoordinator, worker_loop
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.retry_worker import (
    redis_queue_monitor_loop,
    redis_retry_worker,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_worker_registration_and_deregistration():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    coord = WorkerCoordinator(
        client=client,
        namespace="test-workers",
        ttl_seconds=1,
    )

    await coord.register("worker-1", metadata={"role": "main"})
    info = await coord.get_worker("worker-1")

    assert info["worker_id"] == "worker-1"
    assert info["status"] == "online"
    assert "worker-1" in await coord.active_workers()

    await coord.deregister("worker-1")
    assert "worker-1" not in await coord.active_workers()


@pytest.mark.anyio("asyncio")
async def test_heartbeat_cleanup_removes_stale_workers():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    coord = WorkerCoordinator(
        client=client,
        namespace="ttl-workers",
        ttl_seconds=0.05,
    )

    await coord.register("worker-ttl")
    await asyncio.sleep(0.06)
    removed = await coord.cleanup_stale()

    assert "worker-ttl" in removed
    assert "worker-ttl" not in await coord.active_workers()


@pytest.mark.anyio("asyncio")
async def test_graceful_shutdown_stops_retry_loop():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client, namespace="retry-loop")
    stop_event = asyncio.Event()

    task = asyncio.create_task(
        redis_retry_worker(
            store=store,
            poll_interval_ms=20,
            shutdown_event=stop_event,
        )
    )

    await asyncio.sleep(0.05)
    stop_event.set()
    await asyncio.wait_for(task, timeout=1.0)


@pytest.mark.anyio("asyncio")
async def test_queue_monitor_loop_stops_on_shutdown():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client, namespace="queue-loop")
    stop_event = asyncio.Event()

    task = asyncio.create_task(
        redis_queue_monitor_loop(
            store=store,
            poll_interval_ms=20,
            shutdown_event=stop_event,
        )
    )

    await asyncio.sleep(0.05)
    stop_event.set()
    await asyncio.wait_for(task, timeout=1.0)


@pytest.mark.anyio("asyncio")
async def test_multiple_workers_claim_jobs_without_conflict():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client, namespace="claiming")

    await store.set_state("job-claim", "enqueued")
    first = await store.claim("job-claim")
    second = await store.claim("job-claim")

    assert first is True
    assert second is False


@pytest.mark.anyio("asyncio")
async def test_worker_loop_respects_shutdown_event():
    counter = {"ticks": 0}

    async def run_once():
        counter["ticks"] += 1

    stop_event = asyncio.Event()
    task = asyncio.create_task(
        worker_loop(
            run_once,
            poll_interval_ms=20,
            shutdown_event=stop_event,
        )
    )

    await asyncio.sleep(0.05)
    stop_event.set()
    await asyncio.wait_for(task, timeout=1.0)
    assert counter["ticks"] >= 1
