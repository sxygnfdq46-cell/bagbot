from backend.worker import runner


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):
        self.calls.append((name, labels))


def _simulate_worker_job(signals, metrics):
    # Minimal stand-in for a worker task that asks the brain for a decision.
    decision = runner.get_brain_decision(signals, metrics_client=metrics)
    # Worker would route/ack based on action; here we just return a shaped response.
    return {
        "decision": decision,
        "routed": decision.get("action") not in {"hold", None},
    }


def test_worker_brain_integration_fake_mode(monkeypatch):
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    metrics = _StubMetrics()

    result = _simulate_worker_job(
        {"demo": {"type": "volatility", "strength": 0.2, "confidence": 0.7}},
        metrics,
    )

    decision = result["decision"]
    assert decision["action"] == "hold"
    assert decision["meta"].get("source") == "fake"
    assert result["routed"] is False
    assert ("brain_decisions_total", {"action": "hold"}) in metrics.calls
