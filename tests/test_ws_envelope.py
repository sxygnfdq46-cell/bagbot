from datetime import datetime
import json


def make_worker_heartbeat(worker_id: str, status: str, current_job_id=None):
    return {
        "channel": "workers",
        "event": "worker.heartbeat",
        "payload": {
            "worker_id": worker_id,
            "timestamp": int(datetime.utcnow().timestamp()),
            "status": status,
            "current_job_id": current_job_id,
        },
    }


def test_worker_heartbeat_shape():
    msg = make_worker_heartbeat("worker-1", "idle", None)
    assert isinstance(msg, dict)
    assert msg["channel"] == "workers"
    assert msg["event"] == "worker.heartbeat"
    payload = msg["payload"]
    assert "worker_id" in payload and payload["worker_id"] == "worker-1"
    assert "timestamp" in payload and isinstance(payload["timestamp"], int)
    assert payload["status"] in ("idle", "busy", "offline")
    assert "current_job_id" in payload
    json.dumps(msg)
