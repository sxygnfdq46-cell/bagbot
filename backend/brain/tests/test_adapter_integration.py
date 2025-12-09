from backend.brain.adapter import decide


class MetricsSpy:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, amount=1):
        self.calls.append((name, labels or {}, amount))


def test_decide_schema_and_defaults():
    signals = {
        "s1": {"type": "momentum", "strength": 0.6, "confidence": 0.7},
        "s2": {"type": "news", "strength": 0.2, "confidence": 0.5},
    }
    result = decide(signals, fake_mode=False)
    assert set(result.keys()) == {"action", "confidence", "rationale", "meta"}
    assert isinstance(result["action"], str)
    assert isinstance(result["confidence"], float)
    assert 0.0 <= result["confidence"] <= 1.0
    assert isinstance(result["rationale"], list)
    assert isinstance(result["meta"], dict)


def test_decide_deterministic_fake_mode():
    signals = {"any": {"type": "x", "strength": 1, "confidence": 1}}
    out1 = decide(signals, fake_mode=True)
    out2 = decide(signals, fake_mode=True)
    assert out1 == out2


def test_decide_metrics_increment():
    metrics = MetricsSpy()
    signals = {"s1": {"type": "momentum", "strength": 0.6, "confidence": 0.7}}
    decide(signals, metrics_client=metrics, fake_mode=True)
    assert any(call[0] == "brain_decisions_total" for call in metrics.calls)
