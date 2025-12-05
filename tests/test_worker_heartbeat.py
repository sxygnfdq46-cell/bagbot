from datetime import datetime, timezone

from backend.workers import queue, tasks
from backend.workers.runner import run_job


def test_worker_heartbeat_roundtrip():
    job_id = queue.enqueue_worker_heartbeat("node-1")

    assert job_id == "job-queued"

    result = run_job(queue.HEARTBEAT_JOB_PATH, "node-1")

    assert result["node_id"] == "node-1"
    assert result["status"] == "healthy"
    assert "at" in result


def test_worker_heartbeat_respects_override_timestamp():
    fixed_at = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)

    result = tasks.worker_heartbeat("node-2", at=fixed_at)

    assert result == {
        "node_id": "node-2",
        "status": "healthy",
        "at": fixed_at.isoformat(),
    }
