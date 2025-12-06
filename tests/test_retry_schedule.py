import pytest

from backend.workers import job_store, metrics, retry_policy
from backend.workers.job_store import JobStore
import backend.workers.runner as runner


@pytest.fixture
def anyio_backend():
    return "asyncio"


_fail_first = {"fail": True}


def flaky_job():
    if _fail_first["fail"]:
        _fail_first["fail"] = False
        raise RuntimeError("boom")
    return "ok"


@pytest.mark.anyio("asyncio")
async def test_retry_schedule(monkeypatch):
    store = JobStore()
    monkeypatch.setattr(job_store, "default_store", store)
    monkeypatch.setattr(runner, "default_store", store)

    test_metrics = metrics.Metrics()
    monkeypatch.setattr(metrics, "default_metrics", test_metrics)
    monkeypatch.setattr(runner, "default_metrics", test_metrics)

    policy = retry_policy.RetryPolicy(max_attempts=3, backoff_fn=lambda n: 0)
    monkeypatch.setattr(runner, "default_retry", policy)

    job = {
        "job_id": "job-retry",
        "job_path": f"{__name__}.flaky_job",
        "args": [],
        "kwargs": {},
    }

    result = await runner.run_job_async(dict(job))

    assert result["status"] == "retry_scheduled"
    assert store.get_state("job-retry") == "retry_scheduled"
    assert store.attempts("job-retry") == 2
    assert test_metrics.worker_jobs_retried_total.count == 1

    await runner.retry_worker(now_ms=result["next_retry_at"])

    assert store.get_state("job-retry") == "done"
    assert store.attempts("job-retry") == 2
    assert test_metrics.worker_jobs_done_total.count == 1
    assert test_metrics.worker_jobs_failed_total.count == 0
