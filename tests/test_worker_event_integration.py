from __future__ import annotations

import asyncio
import json
import pytest

from backend.workers import queue


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_enqueue_and_runner_emit_job_events_and_heartbeat(monkeypatch):
    events = []

    async def fake_ws(channel: str, event: str, payload=None, **kwargs):
        events.append({"channel": channel, "event": event, "payload": payload})

    monkeypatch.setattr("backend.workers.events.websocket_broadcast", fake_ws)

    job_id = queue.enqueue_worker_heartbeat("node-int")

    # allow enqueued broadcast + job execution to flush
    await asyncio.sleep(0.01)

    event_names = [ev["event"] for ev in events]

    assert "worker.job.enqueued" in event_names
    assert "worker.job.started" in event_names
    assert "worker.job.done" in event_names
    assert "worker.heartbeat" in event_names

    # ordering: started happens before done
    assert event_names.index("worker.job.started") < event_names.index(
        "worker.job.done"
    )

    heartbeat = next(ev for ev in events if ev["event"] == "worker.heartbeat")
    assert heartbeat["payload"]["worker_id"] == "node-int"
    assert isinstance(heartbeat["payload"]["ts"], int)

    started_payload = next(
        ev["payload"] for ev in events if ev["event"] == "worker.job.started"
    )
    done_payload = next(
        ev["payload"] for ev in events if ev["event"] == "worker.job.done"
    )

    assert started_payload["job_id"] == job_id
    assert started_payload["job_path"] == queue.HEARTBEAT_JOB_PATH
    assert done_payload["job_id"] == job_id
    assert done_payload["job_path"] == queue.HEARTBEAT_JOB_PATH

    # ensure payloads are JSON-serializable
    for envelope in events:
        json.dumps(
            {
                "channel": envelope["channel"],
                "event": envelope["event"],
                "payload": envelope["payload"],
            }
        )
