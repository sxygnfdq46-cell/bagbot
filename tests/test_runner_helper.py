from backend.workers.runner import run_job
from backend.workers import tasks


def test_run_job_calls_target(monkeypatch):
    called = []

    def fake_strategy_toggle(strategy_id: str, target_state: str = "started"):
        called.append((strategy_id, target_state))
        return {"strategy_id": strategy_id, "status": target_state}

    monkeypatch.setattr(tasks, "strategy_toggle", fake_strategy_toggle)

    result = run_job("backend.workers.tasks.strategy_toggle", "strat-1", "started")

    assert called == [("strat-1", "started")]
    assert result == {"strategy_id": "strat-1", "status": "started"}
