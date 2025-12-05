import time
from typing import Any, Dict

from backend.workers.queue import enqueue_worker_heartbeat, HEARTBEAT_JOB_PATH
import backend.workers.queue as queue_mod


def test_enqueue_worker_heartbeat_routes_to_queue(monkeypatch):
    captured = {}

    def fake_enqueue_task(job_path: str, payload: Dict[str, Any]) -> str:
        captured["job_path"] = job_path
        captured["payload"] = payload
        return "queued-heartbeat-123"

    monkeypatch.setattr(queue_mod, "enqueue_task", fake_enqueue_task)

    ts = int(time.time())
    returned = enqueue_worker_heartbeat(timestamp=ts)

    assert returned == "queued-heartbeat-123"
    assert captured["job_path"] == HEARTBEAT_JOB_PATH
    assert isinstance(captured["payload"], dict)
    assert captured["payload"].get("timestamp") == ts
