import asyncio
import uuid

import pytest

from backend.workers import job_store
from backend.workers.job_store import JobStore
from backend.workers.runner import run_job_async


_calls = []


def _fake_job():
    _calls.append("ok")
    return "ok"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_runner_claim_prevents_duplicate_runs(monkeypatch):
    _calls.clear()

    store = JobStore()
    monkeypatch.setattr(job_store, "default_store", store)

    import backend.workers.runner as runner_module

    monkeypatch.setattr(runner_module, "default_store", store)

    job_id = f"test-{uuid.uuid4().hex[:8]}"
    job_payload = {
        "job_id": job_id,
        "job_path": f"{__name__}._fake_job",
        "args": [],
        "kwargs": {},
        "attempts": 0,
    }

    events = []

    async def fake_broadcast(job_id, job_path, state, payload=None, ts=None):
        events.append((state, payload or {}))

    monkeypatch.setattr(
        "backend.workers.runner.broadcast_job_event", fake_broadcast
    )

    first = asyncio.create_task(run_job_async(dict(job_payload)))
    second = asyncio.create_task(run_job_async(dict(job_payload)))

    results = await asyncio.gather(first, second, return_exceptions=True)

    assert _calls == ["ok"]
    assert store.get_state(job_id) == "done"
    assert store.attempts(job_id) == 1

    skipped = [
        r["status"]
        for r in results
        if isinstance(r, dict) and r.get("status") == "skipped"
    ]
    assert skipped == ["skipped"]

    states_seen = [state for state, _ in events]
    assert states_seen.count("started") == 1
    assert states_seen.count("done") == 1
