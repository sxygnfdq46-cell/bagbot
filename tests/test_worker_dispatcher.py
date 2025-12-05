"""Unit tests for worker dispatch wrappers."""
from backend.workers import tasks


def test_strategy_toggle_calls_start(monkeypatch):
    calls = []

    def fake_start(strategy_id: str) -> dict:
        calls.append(("start", strategy_id))
        return {"status": "started"}

    def fake_stop(strategy_id: str) -> dict:
        calls.append(("stop", strategy_id))
        return {"status": "stopped"}

    monkeypatch.setattr(tasks, "start_strategy", fake_start)
    monkeypatch.setattr(tasks, "stop_strategy", fake_stop)

    result = tasks.strategy_toggle("strat-1", "started")

    assert result == {"strategy_id": "strat-1", "status": "started"}
    assert calls == [("start", "strat-1")]


def test_strategy_toggle_calls_stop(monkeypatch):
    calls = []

    def fake_start(strategy_id: str) -> dict:
        calls.append(("start", strategy_id))
        return {"status": "started"}

    def fake_stop(strategy_id: str) -> dict:
        calls.append(("stop", strategy_id))
        return {"status": "stopped"}

    monkeypatch.setattr(tasks, "start_strategy", fake_start)
    monkeypatch.setattr(tasks, "stop_strategy", fake_stop)

    result = tasks.strategy_toggle("strat-2", "stopped")

    assert result == {"strategy_id": "strat-2", "status": "stopped"}
    assert calls == [("stop", "strat-2")]
