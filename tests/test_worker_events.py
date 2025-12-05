from __future__ import annotations

import json
import pytest

from backend.workers.events import (
    broadcast_job_event,
    broadcast_worker_heartbeat,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio("asyncio")
async def test_broadcast_worker_heartbeat_builds_correct_envelope(monkeypatch):
    calls = []

    async def fake_ws(channel: str, event: str, payload=None, **kwargs):
        calls.append({"channel": channel, "event": event, "payload": payload})

    monkeypatch.setattr("backend.workers.events.websocket_broadcast", fake_ws)

    envelope = await broadcast_worker_heartbeat("worker-1", ts=123)

    assert envelope["channel"] == "signals"
    assert envelope["event"] == "worker.heartbeat"
    assert envelope["payload"]["worker_id"] == "worker-1"
    assert envelope["payload"]["ts"] == 123
    assert isinstance(envelope["ts"], int)
    json.dumps(envelope)

    assert calls == [
        {
            "channel": "signals",
            "event": "worker.heartbeat",
            "payload": {"worker_id": "worker-1", "ts": 123},
        }
    ]


@pytest.mark.anyio("asyncio")
async def test_broadcast_job_events_emits_expected_shape(monkeypatch):
    calls = []

    async def fake_ws(channel: str, event: str, payload=None, **kwargs):
        calls.append({"channel": channel, "event": event, "payload": payload})

    monkeypatch.setattr("backend.workers.events.websocket_broadcast", fake_ws)

    envelope = await broadcast_job_event(
        "job-1",
        "backend.workers.tasks.worker_heartbeat",
        "started",
        payload={"ts_started": 456},
        ts=456,
    )

    assert envelope["channel"] == "signals"
    assert envelope["event"] == "worker.job.started"
    payload = envelope["payload"]
    assert payload["job_id"] == "job-1"
    assert payload["job_path"] == "backend.workers.tasks.worker_heartbeat"
    assert payload["state"] == "started"
    assert payload["ts"] == 456
    assert payload["ts_started"] == 456
    json.dumps(envelope)

    assert calls == [
        {
            "channel": "signals",
            "event": "worker.job.started",
            "payload": payload,
        }
    ]
