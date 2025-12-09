import time

import pytest
import fakeredis.aioredis

from backend.workers import job_store, metrics
from backend.workers.metrics import Metrics
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.retry_worker import redis_queue_monitor


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def metrics_dir(monkeypatch, tmp_path):
    path = tmp_path / "metrics"
    path.mkdir(parents=True, exist_ok=True)
    monkeypatch.setenv("PROMETHEUS_MULTIPROC_DIR", str(path))
    yield path


@pytest.fixture
async def redis_store(monkeypatch):
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client)
    monkeypatch.setattr(job_store, "default_store", store)
    yield store
    await client.flushall()
    await client.close()


@pytest.fixture
async def test_metrics(monkeypatch):
    m = Metrics()
    monkeypatch.setattr(metrics, "default_metrics", m)
    return m


@pytest.mark.anyio("asyncio")
async def test_redis_queue_monitor_counts(redis_store, test_metrics):
    now_ms = int(time.time() * 1000)

    # enqueued job
    await redis_store._redis.hset(  # type: ignore[attr-defined]
        redis_store._job_key("j1"),  # type: ignore[attr-defined]
        mapping={"state": "enqueued", "updated_at": now_ms},
    )
    # running fresh
    await redis_store._redis.hset(  # type: ignore[attr-defined]
        redis_store._job_key("j2"),  # type: ignore[attr-defined]
        mapping={"state": "running", "updated_at": now_ms - 10_000},
    )
    # running stuck
    await redis_store._redis.hset(  # type: ignore[attr-defined]
        redis_store._job_key("j3"),  # type: ignore[attr-defined]
        mapping={"state": "running", "updated_at": now_ms - 400_000},
    )

    stats = await redis_queue_monitor(redis_store, stale_ms=300_000)

    assert stats["queue_len"] == 1
    assert stats["running"] == 2
    assert stats["stuck"] == 1
    assert test_metrics.worker_queue_length.value == 1
    assert test_metrics.worker_jobs_running.value == 2
    assert test_metrics.worker_jobs_stuck.value == 1
    assert test_metrics.worker_latest_heartbeat_age_ms.value >= 0
