import pytest

from backend.workers import job_store, metrics, retry_policy
from backend.workers.job_store import JobStore
import backend.workers.runner as runner


@pytest.fixture
def anyio_backend():
    return "asyncio"


def failing_job():
    raise RuntimeError("fail-always")


@pytest.mark.anyio("asyncio")
async def test_runner_stops_after_max_attempts(monkeypatch):
    store = JobStore()
    monkeypatch.setattr(job_store, "default_store", store)
    monkeypatch.setattr(runner, "default_store", store)

    test_metrics = metrics.Metrics()
    monkeypatch.setattr(metrics, "default_metrics", test_metrics)
    monkeypatch.setattr(runner, "default_metrics", test_metrics)

    policy = retry_policy.RetryPolicy(max_attempts=1, backoff_fn=lambda n: 0)
    monkeypatch.setattr(runner, "default_retry", policy)

    job = {
        "job_id": "job-fail",
        "job_path": f"{__name__}.failing_job",
        "args": [],
        "kwargs": {},
    }

    with pytest.raises(RuntimeError):
        await runner.run_job_async(dict(job))

    assert store.get_state("job-fail") == "error"
    assert store.attempts("job-fail") == 2
    assert test_metrics.worker_jobs_failed_total.count == 1
    assert test_metrics.worker_jobs_retried_total.count == 0
    assert store.next_retry_jobs(10_000) == []
