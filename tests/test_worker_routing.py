from backend.services.strategy_registry import StrategyMeta
from backend.workers import queue
from backend.workers.runner import route_job


def test_route_job_uses_registry_and_queue(monkeypatch):
    calls = {}

    def fake_enqueue(path: str, *args, **kwargs):
        calls["path"] = path
        calls["args"] = args
        calls["kwargs"] = kwargs
        return "job-42"

    class FakeRegistry:
        def get(self, strategy_id: str):
            return StrategyMeta(
                strategy_id=strategy_id,
                job_path="backend.workers.tasks.strategy_toggle",
            )

    monkeypatch.setattr(queue, "enqueue_task", fake_enqueue)
    monkeypatch.setattr(
        "backend.workers.runner.load_default_registry", lambda: FakeRegistry()
    )

    job_id = route_job("abc-123", "started")

    assert job_id == "job-42"
    assert calls["path"].endswith("strategy_toggle")
    assert calls["args"] == ("abc-123", "started")
