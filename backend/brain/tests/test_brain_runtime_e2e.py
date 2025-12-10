from backend.worker import runner


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):
        self.calls.append((name, labels))


def test_brain_runtime_e2e_fake_mode(monkeypatch):
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    metrics = _StubMetrics()

    decision = runner.get_brain_decision(
        {"demo": {"type": "momentum", "strength": 0.3, "confidence": 0.6}},
        config={"threshold": 0.25},
        metrics_client=metrics,
    )

    assert decision["action"] == "hold"
    assert 0.0 <= decision.get("confidence", 0.0) <= 1.0
    assert isinstance(decision.get("meta", {}), dict)
    assert ("brain_decisions_total", {"action": "hold"}) in metrics.calls
