from backend.api import admin_routes as admin


class DummyMetrics:
    def __init__(self):
        self.calls = []

    def increment(self, name: str) -> None:
        self.calls.append(name)


def test_load_rotates_corrupt_state(monkeypatch, tmp_path):
    state_file = tmp_path / "trading_state.json"
    state_file.write_text("{ not json", encoding="utf-8")

    monkeypatch.setattr(admin, "STATE_FILE", state_file)
    metrics = DummyMetrics()
    admin.set_metrics_client(metrics)

    state = admin.load_trading_state()

    assert state == {"paused": False, "reason": None, "timestamp": None}
    rotated = list(tmp_path.glob("trading_state.json.corrupt.*.old"))
    assert len(rotated) == 1
    assert state_file.exists()
    assert metrics.calls == ["admin_state_corruption"]


def test_save_and_validate_roundtrip(monkeypatch, tmp_path):
    state_file = tmp_path / "trading_state.json"
    monkeypatch.setattr(admin, "STATE_FILE", state_file)
    metrics = DummyMetrics()
    admin.set_metrics_client(metrics)

    admin.save_trading_state({"paused": True})
    state = admin.load_trading_state()

    assert state["paused"] is True
    assert "reason" in state and state["reason"] is None
    assert "timestamp" in state
    assert metrics.calls == []
