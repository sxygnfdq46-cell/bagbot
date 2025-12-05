from backend.workers import dispatcher


def test_route_job_dispatches(monkeypatch):
    captured = {}

    def fake_enqueue(job_path, payload):
        captured["job_path"] = job_path
        captured["payload"] = payload
        return "queued-123"

    monkeypatch.setattr("backend.workers.queue.enqueue_task", fake_enqueue)

    result = dispatcher.route_job("worker.heartbeat", {"ts": 1})

    assert result == "queued-123"
    assert captured == {"job_path": "worker.heartbeat", "payload": {"ts": 1}}
