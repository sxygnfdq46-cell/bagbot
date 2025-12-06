import asyncio
import time

import fakeredis.aioredis
import pytest

from backend.workers.orchestration import WorkerCoordinator
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.runner import runner_loop


_results = []


def _fake_job():
    _results.append("ran")
    return "ok"


@pytest.fixture(autouse=True)
def clear_results():
    _results.clear()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_runner_loop_claims_exclusively_and_shuts_down():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client, namespace="integration-jobs")
    coord = WorkerCoordinator(
        client=client,
        namespace="integration-workers",
        ttl_seconds=1,
    )

    await coord.register("worker-a")
    await coord.register("worker-b")

    job_id = "job-integration"
    job_payload = {
        "job_path": f"{__name__}._fake_job",
        "args": [],
        "kwargs": {},
        "attempts": 0,
    }

    await store.set_last_job(job_id, job_payload)
    await store.schedule_retry(job_id, int(time.time() * 1000) - 100)

    shutdown_a = asyncio.Event()
    shutdown_b = asyncio.Event()

    task_a = asyncio.create_task(
        runner_loop(
            store=store,
            shutdown_event=shutdown_a,
            poll_interval_ms=20,
        )
    )
    task_b = asyncio.create_task(
        runner_loop(
            store=store,
            shutdown_event=shutdown_b,
            poll_interval_ms=20,
        )
    )

    await asyncio.sleep(0.1)
    shutdown_a.set()
    shutdown_b.set()
    await asyncio.wait_for(asyncio.gather(task_a, task_b), timeout=2.0)

    assert _results == ["ran"]
    assert await store.get_state(job_id) == "done"

    await coord.deregister("worker-a")
    await coord.deregister("worker-b")
    await coord.close()
