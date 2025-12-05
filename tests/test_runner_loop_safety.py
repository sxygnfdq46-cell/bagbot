from __future__ import annotations

import pytest

from backend.workers.runner import run_job_async, run_once


def _sample_job(value: str) -> dict:
    return {"seen": value}


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_run_job_inside_event_loop(monkeypatch):
    events = []

    async def fake_broadcast(job_id, job_path, state, payload=None, ts=None):
        events.append((job_id, job_path, state, payload or {}, ts))

    monkeypatch.setattr(
        "backend.workers.runner.broadcast_job_event", fake_broadcast
    )

    job = {
        "job_id": "job-1",
        "job_path": f"{__name__}._sample_job",
        "args": ["ok"],
        "kwargs": {},
    }

    result = await run_job_async(job)

    assert result == {"seen": "ok"}
    states = [state for _, _, state, _, _ in events]
    assert states == ["started", "done"]
    assert all(isinstance(ts, int) for *_, ts in events)


def test_run_once_shim(monkeypatch):
    events = []

    async def fake_broadcast(job_id, job_path, state, payload=None, ts=None):
        events.append((job_id, job_path, state, payload or {}, ts))

    monkeypatch.setattr(
        "backend.workers.runner.broadcast_job_event", fake_broadcast
    )

    job = {
        "job_id": "job-2",
        "job_path": f"{__name__}._sample_job",
        "args": ["sync"],
        "kwargs": {},
    }

    result = run_once(job)

    assert result == {"seen": "sync"}
    states = [state for _, _, state, _, _ in events]
    assert states == ["started", "done"]
    assert all(isinstance(ts, int) for *_, ts in events)
