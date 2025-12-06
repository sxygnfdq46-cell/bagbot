import pytest

import fakeredis.aioredis

from backend.workers.redis_job_store import RedisJobStore


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def redis_store():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    store = RedisJobStore(client=client)
    yield store
    await client.flushall()
    await client.close()


@pytest.mark.anyio("asyncio")
async def test_claim_and_state_transitions(redis_store):
    job_id = "j-redis-1"

    assert await redis_store.claim(job_id) is True
    assert await redis_store.get_state(job_id) == "running"
    assert await redis_store.attempts(job_id) == 1

    assert await redis_store.claim(job_id) is False

    await redis_store.set_state(job_id, "done")
    assert await redis_store.claim(job_id) is False


@pytest.mark.anyio("asyncio")
async def test_increment_attempts_and_reset(redis_store):
    job_id = "j-redis-2"

    await redis_store.set_state(job_id, "enqueued")
    assert await redis_store.attempts(job_id) == 0

    await redis_store.increment_attempts(job_id)
    assert await redis_store.attempts(job_id) == 1

    await redis_store.reset(job_id)
    assert await redis_store.get_state(job_id) is None


@pytest.mark.anyio("asyncio")
async def test_schedule_and_next_retry(redis_store):
    job_id = "j-redis-retry"

    await redis_store.set_last_job(job_id, {"job_id": job_id, "args": []})
    await redis_store.schedule_retry(job_id, 100)

    due = await redis_store.next_retry_jobs(200)
    assert due == [(job_id, {"job_id": job_id, "args": []})]
    assert await redis_store.attempts(job_id) == 0
    assert await redis_store.get_state(job_id) == "retry_scheduled"
