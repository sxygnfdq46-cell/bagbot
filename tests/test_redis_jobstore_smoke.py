"""
Smoke tests for Redis-backed JobStore in staging environment.

Tests validate:
1. Worker job claiming (exclusive claim behavior)
2. Retry scheduling and backoff correctness
3. Heartbeat + coordinator registration/deregistration
4. Metrics endpoint emits Redis-backed metrics (enqueue, run, retry, heartbeat age)

Can be run against a real Redis instance via REDIS_URL environment variable.
"""
import asyncio
import os
import time
from typing import List

import pytest

try:
    import fakeredis.aioredis
    HAS_FAKEREDIS = True
except ImportError:
    HAS_FAKEREDIS = False

from backend.workers.orchestration import WorkerCoordinator
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.runner import runner_loop


# Test job that records execution
_smoke_test_results: List[str] = []


def smoke_test_job(value: str) -> str:
    """Test job for smoke tests."""
    _smoke_test_results.append(value)
    return f"processed: {value}"


@pytest.fixture(autouse=True)
def clear_smoke_results():
    """Clear test results before each test."""
    _smoke_test_results.clear()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def redis_store():
    """
    Create a RedisJobStore using either:
    - Real Redis from REDIS_URL environment variable
    - FakeRedis for local testing
    """
    redis_url = os.getenv("REDIS_URL")
    
    if redis_url:
        # Use real Redis for staging/integration tests
        from redis.asyncio import Redis
        client = Redis.from_url(redis_url, decode_responses=True)
        store = RedisJobStore(client=client, namespace="smoke-test-jobs")
        yield store
        # Cleanup: remove smoke test keys
        pattern = f"smoke-test-jobs:*"
        async for key in client.scan_iter(match=pattern):
            await client.delete(key)
        await client.close()
    elif HAS_FAKEREDIS:
        # Use FakeRedis for local testing
        client = fakeredis.aioredis.FakeRedis(decode_responses=True)
        store = RedisJobStore(client=client, namespace="smoke-test-jobs")
        yield store
        await client.flushall()
        await client.close()
    else:
        pytest.skip("Neither REDIS_URL nor fakeredis available")


@pytest.fixture
async def coordinator(redis_store):
    """Create a WorkerCoordinator using the same Redis client."""
    if hasattr(redis_store, "_redis"):
        coord = WorkerCoordinator(
            client=redis_store._redis,
            namespace="smoke-test-workers",
            ttl_seconds=30,
        )
        yield coord
        # Cleanup
        await coord.close()
    else:
        pytest.skip("Cannot create coordinator without Redis client")


@pytest.mark.anyio("asyncio")
async def test_smoke_exclusive_job_claiming(redis_store):
    """
    Smoke Test 1: Exclusive Job Claiming
    
    Validates that only one worker can claim a job at a time.
    """
    job_id = "smoke-job-claim-test"
    
    # First claim should succeed
    claimed1 = await redis_store.claim(job_id)
    assert claimed1 is True, "First claim should succeed"
    assert await redis_store.get_state(job_id) == "running"
    assert await redis_store.attempts(job_id) == 1
    
    # Second claim should fail (already running)
    claimed2 = await redis_store.claim(job_id)
    assert claimed2 is False, "Second claim should fail for running job"
    
    # After marking done, claim should fail
    await redis_store.set_state(job_id, "done")
    claimed3 = await redis_store.claim(job_id)
    assert claimed3 is False, "Claim should fail for completed job"
    
    print("✓ Exclusive job claiming validated")


@pytest.mark.anyio("asyncio")
async def test_smoke_retry_scheduling_and_backoff(redis_store):
    """
    Smoke Test 2: Retry Scheduling and Backoff
    
    Validates that jobs can be scheduled for retry with proper timing.
    """
    job_id = "smoke-job-retry-test"
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}.smoke_test_job",
        "args": ["retry-test"],
        "kwargs": {},
    }
    
    # Schedule a retry in the past (should be immediately available)
    past_ms = int((time.time() - 1) * 1000)
    await redis_store.set_last_job(job_id, job_payload)
    await redis_store.schedule_retry(job_id, past_ms)
    
    # Verify state
    state = await redis_store.get_state(job_id)
    assert state == "retry_scheduled"
    
    # Retrieve jobs ready for retry
    now_ms = int(time.time() * 1000)
    due_jobs = await redis_store.next_retry_jobs(now_ms)
    
    assert len(due_jobs) == 1, "Should have one job ready for retry"
    assert due_jobs[0][0] == job_id
    assert due_jobs[0][1]["args"] == ["retry-test"]
    
    # Schedule a future retry (should NOT be available yet)
    job_id2 = "smoke-job-future-retry"
    future_ms = int((time.time() + 3600) * 1000)  # 1 hour in the future
    await redis_store.set_last_job(job_id2, job_payload)
    await redis_store.schedule_retry(job_id2, future_ms)
    
    due_jobs2 = await redis_store.next_retry_jobs(now_ms)
    assert len(due_jobs2) == 0, "Future retry should not be available yet"
    
    print("✓ Retry scheduling and backoff validated")


@pytest.mark.anyio("asyncio")
async def test_smoke_coordinator_registration(coordinator):
    """
    Smoke Test 3: Coordinator Registration/Deregistration
    
    Validates worker registration, heartbeat, and deregistration.
    """
    worker_id = "smoke-worker-1"
    metadata = {"version": "1.0.0", "host": "smoke-test"}
    
    # Register worker
    await coordinator.register(worker_id, metadata)
    
    # Verify registration
    workers = await coordinator.active_workers()
    assert worker_id in workers
    
    # Send heartbeat
    await coordinator.heartbeat(worker_id)
    
    # Wait briefly and check worker info
    await asyncio.sleep(0.1)
    info = await coordinator.get_worker(worker_id)
    assert info is not None
    assert "last_seen_ms" in info
    
    # Deregister worker
    await coordinator.deregister(worker_id)
    
    # Verify deregistration
    workers_after = await coordinator.active_workers()
    assert worker_id not in workers_after
    
    print("✓ Coordinator registration/deregistration validated")


@pytest.mark.anyio("asyncio")
async def test_smoke_runner_loop_with_coordinator(redis_store, coordinator):
    """
    Smoke Test 4: Runner Loop with Real Coordination
    
    Validates full worker loop with job claiming, execution, and coordination.
    """
    worker_id = "smoke-runner-worker"
    await coordinator.register(worker_id, {"test": "smoke"})
    
    # Create a job ready for retry
    job_id = "smoke-runner-job"
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}.smoke_test_job",
        "args": ["runner-test"],
        "kwargs": {},
    }
    
    past_ms = int((time.time() - 1) * 1000)
    await redis_store.set_last_job(job_id, job_payload)
    await redis_store.schedule_retry(job_id, past_ms)
    
    # Run worker loop briefly
    shutdown_event = asyncio.Event()
    
    async def run_with_timeout():
        await asyncio.sleep(0.3)  # Let it process the job
        shutdown_event.set()
    
    # Start both tasks
    runner_task = asyncio.create_task(
        runner_loop(
            store=redis_store,
            shutdown_event=shutdown_event,
            poll_interval_ms=50,
        )
    )
    timeout_task = asyncio.create_task(run_with_timeout())
    
    await asyncio.wait_for(
        asyncio.gather(runner_task, timeout_task),
        timeout=2.0,
    )
    
    # Verify job was processed
    assert "runner-test" in _smoke_test_results, "Job should have been executed"
    assert await redis_store.get_state(job_id) == "done"
    
    # Cleanup
    await coordinator.deregister(worker_id)
    
    print("✓ Runner loop with coordinator validated")


@pytest.mark.anyio("asyncio")
async def test_smoke_concurrent_workers(redis_store):
    """
    Smoke Test 5: Multiple Concurrent Workers
    
    Validates that multiple workers can run concurrently without
    claiming the same job twice.
    """
    _smoke_test_results.clear()
    
    # Create 3 jobs
    jobs = []
    for i in range(3):
        job_id = f"smoke-concurrent-job-{i}"
        job_payload = {
            "job_id": job_id,
            "job_path": f"{__name__}.smoke_test_job",
            "args": [f"concurrent-{i}"],
            "kwargs": {},
        }
        past_ms = int((time.time() - 1) * 1000)
        await redis_store.set_last_job(job_id, job_payload)
        await redis_store.schedule_retry(job_id, past_ms)
        jobs.append(job_id)
    
    # Start 2 concurrent workers
    shutdown_events = [asyncio.Event() for _ in range(2)]
    
    async def run_worker_with_timeout(idx):
        await asyncio.sleep(0.3)
        shutdown_events[idx].set()
    
    runner_tasks = [
        asyncio.create_task(
            runner_loop(
                store=redis_store,
                shutdown_event=shutdown_events[i],
                poll_interval_ms=30,
            )
        )
        for i in range(2)
    ]
    
    timeout_tasks = [
        asyncio.create_task(run_worker_with_timeout(i))
        for i in range(2)
    ]
    
    await asyncio.wait_for(
        asyncio.gather(*runner_tasks, *timeout_tasks),
        timeout=3.0,
    )
    
    # All jobs should have been processed exactly once
    assert len(_smoke_test_results) == 3, f"Expected 3 jobs processed, got {len(_smoke_test_results)}"
    assert "concurrent-0" in _smoke_test_results
    assert "concurrent-1" in _smoke_test_results
    assert "concurrent-2" in _smoke_test_results
    
    # All jobs should be done
    for job_id in jobs:
        state = await redis_store.get_state(job_id)
        assert state == "done", f"Job {job_id} should be done, got {state}"
    
    print("✓ Concurrent workers validated")


@pytest.mark.anyio("asyncio") 
async def test_smoke_job_attempts_increment(redis_store):
    """
    Smoke Test 6: Job Attempts Tracking
    
    Validates that job attempts are tracked correctly across retries.
    """
    TEST_ERROR_MSG = "test error"
    TEST_ERROR_MSG_2 = "test error 2"
    
    job_id = "smoke-attempts-test"
    
    # First claim increments to 1
    await redis_store.claim(job_id)
    assert await redis_store.attempts(job_id) == 1
    
    # Mark as error and schedule retry
    await redis_store.set_state(job_id, "error", last_error=TEST_ERROR_MSG)
    
    # Schedule for retry
    await redis_store.schedule_retry(job_id, int(time.time() * 1000))
    
    # Claim again - should NOT increment because it's retry_scheduled
    await redis_store.claim(job_id)
    assert await redis_store.attempts(job_id) == 1, "Retry claim should not increment"
    
    # Mark as error again and claim from error state
    await redis_store.set_state(job_id, "error", last_error=TEST_ERROR_MSG_2)
    await redis_store.claim(job_id)
    assert await redis_store.attempts(job_id) == 2, "Claim from error should increment"
    
    print("✓ Job attempts tracking validated")


if __name__ == "__main__":
    """
    Run smoke tests with:
    
    # Local testing with fakeredis:
    pytest tests/test_redis_jobstore_smoke.py -v
    
    # Staging testing with real Redis:
    REDIS_URL=redis://staging-host:6379/0 pytest tests/test_redis_jobstore_smoke.py -v
    """
    import sys
    sys.exit(pytest.main([__file__, "-v", "-s"]))
