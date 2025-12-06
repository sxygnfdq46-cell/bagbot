"""
End-to-end integration test for BagBot using RedisJobStore + worker + metrics.

This test suite validates:
- Jobs are stored in Redis and claimed exclusively by one worker
- Retry logic triggers correctly (scheduled backoff, retry counts)
- Coordinator heartbeat updates and deregistration happens on shutdown
- /api/metrics endpoint emits required Prometheus metrics

Requires: Real Redis service running (not fakeredis)
"""
import asyncio
import time
from typing import Any, Dict

import pytest
import redis.asyncio as aioredis
from fastapi.testclient import TestClient

from backend.main import app
from backend.workers.orchestration import WorkerCoordinator
from backend.workers.redis_job_store import RedisJobStore
from backend.workers.runner import runner_loop
from backend.workers.retry_worker import redis_retry_worker, redis_queue_monitor


# Test job functions
_test_results = []


def successful_test_job(message: str = "default") -> str:
    """A test job that succeeds."""
    _test_results.append(f"success:{message}")
    return f"completed:{message}"


def failing_test_job(fail_count: int = 2) -> str:
    """A test job that fails a certain number of times before succeeding."""
    call_count = len([r for r in _test_results if "fail_attempt" in r])
    _test_results.append(f"fail_attempt:{call_count}")
    
    if call_count < fail_count:
        raise ValueError(f"Simulated failure {call_count + 1}/{fail_count}")
    
    _test_results.append("finally_succeeded")
    return "success_after_retries"


@pytest.fixture(autouse=True)
def clear_test_results():
    """Clear test results before each test."""
    _test_results.clear()


@pytest.fixture
def anyio_backend():
    """Configure anyio to use asyncio."""
    return "asyncio"


@pytest.fixture
async def redis_client():
    """
    Create a real Redis client connection.
    
    This fixture requires a Redis service to be running.
    For CI, ensure Redis service is started before tests.
    """
    redis_url = "redis://localhost:6379/15"  # Use db 15 for testing
    client = await aioredis.from_url(redis_url, decode_responses=True)
    
    # Verify connection
    await client.ping()
    
    yield client
    
    # Cleanup: flush the test database
    await client.flushdb()
    await client.close()


@pytest.fixture
async def redis_store(redis_client):
    """Create a RedisJobStore with test namespace."""
    store = RedisJobStore(
        client=redis_client,
        namespace="e2e_test_jobs"
    )
    yield store
    # Cleanup handled by redis_client fixture


@pytest.fixture
async def worker_coordinator(redis_client):
    """Create a WorkerCoordinator for test workers."""
    coord = WorkerCoordinator(
        client=redis_client,
        namespace="e2e_test_workers",
        ttl_seconds=30,
    )
    yield coord
    # Cleanup: deregister any remaining workers
    workers = await coord.active_workers()
    for worker_id in workers:
        await coord.deregister(worker_id)


@pytest.mark.e2e_redis
@pytest.mark.anyio("asyncio")
async def test_exclusive_job_claiming(redis_store, worker_coordinator):
    """
    Test that multiple workers claim jobs exclusively.
    
    Validates:
    - Jobs are stored in Redis
    - Only one worker can claim a job
    - Job state transitions correctly
    """
    job_id = "e2e-exclusive-job"
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}.successful_test_job",
        "args": ["test_message"],
        "kwargs": {},
    }
    
    # Store job and schedule it
    await redis_store.set_last_job(job_id, job_payload)
    await redis_store.schedule_retry(job_id, int(time.time() * 1000) - 100)
    
    # Register two workers
    await worker_coordinator.register("worker-1")
    await worker_coordinator.register("worker-2")
    
    # Start two runner loops
    shutdown_1 = asyncio.Event()
    shutdown_2 = asyncio.Event()
    
    task_1 = asyncio.create_task(
        runner_loop(
            store=redis_store,
            shutdown_event=shutdown_1,
            poll_interval_ms=50,
        )
    )
    task_2 = asyncio.create_task(
        runner_loop(
            store=redis_store,
            shutdown_event=shutdown_2,
            poll_interval_ms=50,
        )
    )
    
    # Wait for job to complete
    await asyncio.sleep(0.5)
    
    # Shutdown workers
    shutdown_1.set()
    shutdown_2.set()
    await asyncio.wait_for(asyncio.gather(task_1, task_2), timeout=3.0)
    
    # Verify job was executed exactly once
    assert _test_results == ["success:test_message"], f"Actual results: {_test_results}"
    job_state = await redis_store.get_state(job_id)
    assert job_state == "done", f"Expected 'done', got '{job_state}'"
    # Note: For retry_scheduled jobs, attempts doesn't increment on claim
    # The job was executed exactly once as verified by _test_results


@pytest.mark.e2e_redis
@pytest.mark.anyio("asyncio")
async def test_retry_logic_and_backoff(redis_store):
    """
    Test that retry logic triggers correctly with scheduled backoff.
    
    Validates:
    - Jobs that fail are scheduled for retry
    - Retry backoff is respected
    - Retry counts increment correctly
    - Jobs eventually succeed after retries
    """
    job_id = "e2e-retry-job"
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}.failing_test_job",
        "args": [2],  # Fail 2 times before succeeding
        "kwargs": {},
    }
    
    # Store job and schedule it
    await redis_store.set_last_job(job_id, job_payload)
    await redis_store.schedule_retry(job_id, int(time.time() * 1000) - 100)
    
    # Run retry worker to process the job (it will fail and reschedule)
    await redis_retry_worker(redis_store, poll_interval_ms=0)
    
    # Verify first attempt failed and was rescheduled
    state = await redis_store.get_state(job_id)
    assert state == "retry_scheduled"
    attempts = await redis_store.attempts(job_id)
    assert attempts == 1
    assert "fail_attempt:0" in _test_results
    
    # Manually advance time and process retry
    await redis_store.schedule_retry(job_id, int(time.time() * 1000) - 100)
    await redis_retry_worker(redis_store, poll_interval_ms=0)
    
    # Second attempt should also fail
    state = await redis_store.get_state(job_id)
    assert state == "retry_scheduled"
    attempts = await redis_store.attempts(job_id)
    assert attempts == 2
    assert "fail_attempt:1" in _test_results
    
    # Third attempt should succeed
    await redis_store.schedule_retry(job_id, int(time.time() * 1000) - 100)
    await redis_retry_worker(redis_store, poll_interval_ms=0)
    
    state = await redis_store.get_state(job_id)
    assert state == "done"
    attempts = await redis_store.attempts(job_id)
    # Attempts is 2 because: increment happens on failure, not on success
    # First run: fail -> increment to 1
    # Second run: fail -> increment to 2
    # Third run: succeed -> no increment, stays at 2
    assert attempts == 2
    assert "finally_succeeded" in _test_results


@pytest.mark.e2e_redis
@pytest.mark.anyio("asyncio")
async def test_coordinator_heartbeat_and_deregistration(worker_coordinator):
    """
    Test worker coordinator heartbeat updates and deregistration.
    
    Validates:
    - Workers can register with coordinator
    - Heartbeat updates worker last_seen timestamp
    - Workers can be deregistered cleanly
    - Stale workers are cleaned up
    """
    worker_id = "e2e-test-worker"
    
    # Register worker
    await worker_coordinator.register(worker_id, metadata={"version": "1.0"})
    
    # Verify worker is registered
    active_workers = await worker_coordinator.active_workers()
    assert worker_id in active_workers
    
    # Get initial worker info
    worker_info = await worker_coordinator.get_worker(worker_id)
    assert worker_info["worker_id"] == worker_id
    assert worker_info["status"] == "online"
    assert worker_info["meta_version"] == "1.0"
    initial_last_seen = int(worker_info["last_seen_ms"])
    
    # Wait a bit and send heartbeat
    await asyncio.sleep(0.1)
    await worker_coordinator.heartbeat(worker_id)
    
    # Verify last_seen was updated
    updated_info = await worker_coordinator.get_worker(worker_id)
    updated_last_seen = int(updated_info["last_seen_ms"])
    assert updated_last_seen > initial_last_seen
    
    # Test heartbeat loop with shutdown
    shutdown = asyncio.Event()
    heartbeat_task = asyncio.create_task(
        worker_coordinator.heartbeat_loop(
            worker_id,
            interval=0.1,
            shutdown_event=shutdown,
        )
    )
    
    # Wait for a few heartbeats
    await asyncio.sleep(0.3)
    
    # Get info before shutdown
    before_shutdown = await worker_coordinator.get_worker(worker_id)
    before_last_seen = int(before_shutdown["last_seen_ms"])
    assert before_last_seen > updated_last_seen
    
    # Shutdown heartbeat loop
    shutdown.set()
    await asyncio.wait_for(heartbeat_task, timeout=2.0)
    
    # Deregister worker
    await worker_coordinator.deregister(worker_id)
    
    # Verify worker is removed
    active_workers = await worker_coordinator.active_workers()
    assert worker_id not in active_workers
    
    # Verify worker info is deleted
    deregistered_info = await worker_coordinator.get_worker(worker_id)
    assert deregistered_info == {}


@pytest.mark.e2e_redis
@pytest.mark.anyio("asyncio")
async def test_stale_worker_cleanup(worker_coordinator):
    """Test that stale workers are cleaned up by coordinator."""
    # Register a worker
    worker_id = "stale-worker"
    await worker_coordinator.register(worker_id)
    
    # Verify worker exists
    active_workers = await worker_coordinator.active_workers()
    assert worker_id in active_workers
    
    # Simulate staleness by waiting beyond TTL (30 seconds in fixture)
    # For testing, we'll manually manipulate the last_seen timestamp
    redis_client = worker_coordinator._redis
    worker_key = worker_coordinator._worker_key(worker_id)
    
    # Set last_seen to 60 seconds ago (beyond 30s TTL)
    stale_timestamp = int(time.time() * 1000) - 60000
    await redis_client.hset(worker_key, "last_seen_ms", stale_timestamp)
    
    # Run cleanup
    stale_workers = await worker_coordinator.cleanup_stale()
    
    # Verify stale worker was cleaned up
    assert worker_id in stale_workers
    active_workers = await worker_coordinator.active_workers()
    assert worker_id not in active_workers


@pytest.mark.e2e_redis
def test_metrics_endpoint_emits_required_metrics():
    """
    Test that /api/metrics endpoint emits all required Prometheus metrics.
    
    Validates metrics:
    - bagbot_job_enqueue_total
    - bagbot_job_run_total
    - bagbot_job_retry_total (retry_scheduled_total)
    - bagbot_worker_heartbeat_age_seconds (heartbeat_age_seconds)
    """
    client = TestClient(app)
    
    # Call metrics endpoint
    response = client.get("/api/metrics")
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/plain; version=0.0.4; charset=utf-8"
    
    metrics_text = response.text
    
    # Verify all required metrics are present
    assert "bagbot_job_enqueue_total" in metrics_text
    assert "bagbot_job_run_total" in metrics_text
    assert "bagbot_retry_scheduled_total" in metrics_text
    assert "bagbot_heartbeat_age_seconds" in metrics_text
    
    # Verify metrics have proper structure (HELP and TYPE lines)
    assert "# HELP bagbot_job_enqueue_total" in metrics_text
    assert "# TYPE bagbot_job_enqueue_total counter" in metrics_text
    assert "# HELP bagbot_job_run_total" in metrics_text
    assert "# TYPE bagbot_job_run_total counter" in metrics_text


@pytest.mark.e2e_redis
@pytest.mark.anyio("asyncio")
async def test_queue_monitor_metrics(redis_store):
    """
    Test that queue monitor collects and publishes metrics correctly.
    
    Validates:
    - Queue length is tracked
    - Running jobs are counted
    - Heartbeat age is calculated
    """
    # Create some test jobs in different states
    await redis_store.set_state("job-enqueued-1", "enqueued")
    await redis_store.set_state("job-enqueued-2", "enqueued")
    await redis_store.set_state("job-running-1", "running")
    await redis_store.set_state("job-done-1", "done")
    
    # Run queue monitor
    stats = await redis_queue_monitor(redis_store, stale_ms=300_000)
    
    # Verify stats
    assert stats["queue_len"] == 2  # Two enqueued jobs
    assert stats["running"] == 1     # One running job
    assert stats["stuck"] == 0        # No stuck jobs (not stale)
    assert "heartbeat_age_ms" in stats


@pytest.mark.e2e_redis
@pytest.mark.anyio("asyncio")
async def test_full_worker_lifecycle(redis_store, worker_coordinator):
    """
    Full end-to-end test of worker lifecycle.
    
    Simulates:
    1. Worker registration
    2. Job enqueueing and processing
    3. Heartbeat maintenance
    4. Graceful shutdown and deregistration
    """
    worker_id = "e2e-lifecycle-worker"
    job_id = "lifecycle-test-job"
    
    # 1. Register worker
    await worker_coordinator.register(worker_id)
    assert worker_id in await worker_coordinator.active_workers()
    
    # 2. Enqueue job
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}.successful_test_job",
        "args": ["lifecycle"],
        "kwargs": {},
    }
    await redis_store.set_last_job(job_id, job_payload)
    await redis_store.schedule_retry(job_id, int(time.time() * 1000) - 100)
    
    # 3. Start worker with heartbeat
    shutdown = asyncio.Event()
    
    heartbeat_task = asyncio.create_task(
        worker_coordinator.heartbeat_loop(
            worker_id,
            interval=0.1,
            shutdown_event=shutdown,
        )
    )
    
    runner_task = asyncio.create_task(
        runner_loop(
            store=redis_store,
            shutdown_event=shutdown,
            poll_interval_ms=50,
        )
    )
    
    # Let worker run
    await asyncio.sleep(0.3)
    
    # Verify job completed
    assert await redis_store.get_state(job_id) == "done"
    assert "success:lifecycle" in _test_results
    
    # 4. Graceful shutdown
    shutdown.set()
    await asyncio.wait_for(
        asyncio.gather(heartbeat_task, runner_task),
        timeout=3.0
    )
    
    # 5. Deregister
    await worker_coordinator.deregister(worker_id)
    assert worker_id not in await worker_coordinator.active_workers()
