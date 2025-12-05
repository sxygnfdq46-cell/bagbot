from datetime import datetime

from backend.workers import worker_state


def test_default_state():
    state = worker_state.get_state()
    assert state["status"] == "offline"
    assert state["last_heartbeat"] is None
    assert state["last_job_id"] is None


def test_update_heartbeat_sets_timestamp():
    worker_state.set_status("idle")
    before = datetime.utcnow()
    worker_state.update_heartbeat()
    state = worker_state.get_state()

    assert state["last_heartbeat"] is not None
    assert state["last_heartbeat"] >= before
    assert state["status"] == "idle"


def test_record_job_sets_job_and_status():
    worker_state.set_status("idle")
    worker_state.update_heartbeat(datetime(2025, 1, 1))

    worker_state.record_job("job-123")
    state = worker_state.get_state()

    assert state["last_job_id"] == "job-123"
    assert state["status"] == "busy"
    assert state["last_heartbeat"] == datetime(2025, 1, 1)
