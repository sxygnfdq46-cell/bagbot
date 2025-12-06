import asyncio

import pytest

from backend.workers import entry
from backend.workers.entry import _run_worker


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_entry_shutdown(monkeypatch):
    calls = {"register": 0, "heartbeat": 0, "deregister": 0, "runner": 0}

    class FakeCoord:
        def __init__(self, *args, **kwargs):
            self.store = object()

        async def register(self, worker_id):
            calls["register"] += 1
            self.worker_id = worker_id

        async def heartbeat_loop(self, worker_id, interval, shutdown_event):
            while not shutdown_event.is_set():
                calls["heartbeat"] += 1
                await asyncio.sleep(0.01)

        async def deregister(self, worker_id):
            calls["deregister"] += 1

        async def close(self):
            calls["closed"] = True

    async def fake_runner_loop(**kwargs):
        shutdown_event: asyncio.Event = kwargs["shutdown_event"]
        calls["runner"] += 1
        while not shutdown_event.is_set():
            await asyncio.sleep(0.01)

    monkeypatch.setattr(entry, "WorkerCoordinator", FakeCoord)
    monkeypatch.setattr(entry, "runner_loop", fake_runner_loop)

    stop_event = asyncio.Event()
    task = asyncio.create_task(
        _run_worker(
            worker_id="worker-test",
            shutdown_event=stop_event,
            heartbeat_interval=0.01,
            poll_interval_ms=10,
        )
    )

    await asyncio.sleep(0.05)
    stop_event.set()
    await asyncio.wait_for(task, timeout=1.0)

    assert calls["register"] == 1
    assert calls["deregister"] == 1
    assert calls["runner"] >= 1
    assert calls["heartbeat"] >= 1
