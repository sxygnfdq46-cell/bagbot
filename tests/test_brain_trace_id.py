"""Coverage for brain trace_id propagation via runner and adapter."""

import types

from backend.worker.runner import get_brain_decision


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))


def test_runner_injects_trace_id_when_missing(monkeypatch):
    trace_id = "trace-123"

    def decide(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        return {"action": "buy", "confidence": 0.8, "meta": {}}

    adapter = types.SimpleNamespace(decide=decide)

    decision = get_brain_decision({}, adapter_module=adapter, trace_id=trace_id)

    assert decision["meta"]["trace_id"] == trace_id


def test_runner_does_not_override_existing_trace_id(monkeypatch):
    incoming = "incoming-trace"
    existing = "existing-trace"

    def decide(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        return {"action": "sell", "confidence": 0.6, "meta": {"trace_id": existing}}

    adapter = types.SimpleNamespace(decide=decide)

    decision = get_brain_decision({}, adapter_module=adapter, trace_id=incoming)

    assert decision["meta"]["trace_id"] == existing