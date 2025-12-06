import pytest
import fakeredis.aioredis

from backend.workers import job_store, metrics, runner
from backend.workers.metrics import Metrics
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.retry_worker import redis_retry_worker

_calls = []


def _dummy_job():
    _calls.append("ran")
    return "ok"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def redis_store(monkeypatch):
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client)
    monkeypatch.setattr(job_store, "default_store", store)
    monkeypatch.setattr(runner, "default_store", store)
    yield store
    await client.flushall()
    await client.close()


@pytest.fixture
async def test_metrics(monkeypatch):
    m = Metrics()
    monkeypatch.setattr(metrics, "default_metrics", m)
    monkeypatch.setattr(runner, "default_metrics", m)
    return m


@pytest.mark.anyio("asyncio")
async def test_redis_retry_worker_runs_due_jobs(
    monkeypatch, redis_store, test_metrics
):
    _calls.clear()

    async def fake_broadcast(*args, **kwargs):
        return {}

    monkeypatch.setattr(
        "backend.workers.runner.broadcast_job_event", fake_broadcast
    )

    job_id = "job-retry"
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}._dummy_job",
        "args": [],
        "kwargs": {},
    }

    await redis_store.set_last_job(job_id, job_payload)
    await redis_store.schedule_retry(job_id, epoch_ms=1)

    await redis_retry_worker(redis_store)

    assert _calls == ["ran"]
    assert test_metrics.worker_retry_triggered_total.count == 1
    assert await redis_store.get_state(job_id) == "done"
