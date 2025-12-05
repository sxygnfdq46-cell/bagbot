import json
from typing import Any, Dict


def make_job_envelope(state: str) -> Dict[str, Any]:
    return {
        "job_id": "job-123",
        "job_path": "backend.workers.tasks.worker_heartbeat",
        "args": [],
        "kwargs": {"timestamp": 1672531200},
        "state": state,
        "ts_enqueued": 1672531200,
        "ts_started": 1672531201,
        "ts_finished": 1672531205,
        "error": None if state != "error" else "Timeout talking to worker",
    }


def test_job_envelope_shape_enqueued():
    env = make_job_envelope("enqueued")
    assert env["job_id"]
    assert env["job_path"]
    assert isinstance(env["args"], list)
    assert isinstance(env["kwargs"], dict)
    assert env["state"] == "enqueued"
    assert isinstance(env["ts_enqueued"], int)
    json.dumps(env)


def test_job_envelope_shape_done_is_serializable():
    env = make_job_envelope("done")
    assert env["state"] == "done"
    assert isinstance(env["ts_started"], int)
    assert isinstance(env["ts_finished"], int)
    json.dumps(env)


def test_job_envelope_error_carries_message():
    env = make_job_envelope("error")
    assert env["state"] == "error"
    assert env["error"]
    json.dumps(env)
