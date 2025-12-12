"""Unit coverage for runtime decision envelopes."""

import sys
import types

from backend.worker import runtime_pipeline


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_decision_envelope_real_path(monkeypatch):
    trace_id = "trace-real"
    metrics = _StubMetrics()

    def fake_brain(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        return {"action": "buy", "confidence": 0.8, "meta": {"note": 1}}

    def fake_trade(decision, fake_mode=None, metrics=None, router=None, engine_class=None):
        return {"action": decision.get("action"), "meta": {}}

    def fake_route(action, metrics_client=None, fake_mode=None):
        # runtime_router real path preserves incoming trace_id; simulate same.
        return {"status": "success", "order_id": "ord-1", "meta": {"trace_id": action.get("meta", {}).get("trace_id")}}

    brain_mod = types.SimpleNamespace(get_brain_decision=fake_brain)
    trade_mod = types.SimpleNamespace(get_trade_action=fake_trade)
    router_mod = types.SimpleNamespace(route=fake_route)

    monkeypatch.setitem(sys.modules, "backend.worker.runner", brain_mod)
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", trade_mod)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "0")

    envelope = {"instrument": "BTC-USD", "signals": {}, "snapshot": {}, "meta": {"trace_id": trace_id}}

    resp = runtime_pipeline.run_decision_pipeline(envelope, metrics_client=metrics, fake_mode=False)

    decision = resp.get("decisions")[0]
    assert resp["meta"]["trace_id"] == trace_id
    assert decision["trace_id"] == trace_id
    assert decision["source"] == "brain"
    assert decision["payload"]["action"] == "buy"
    assert decision["decision_id"] and len(decision["decision_id"]) == 12
    assert _count(metrics.calls, "runtime_decisions_total", source="brain", outcome="success") == 1


def test_decision_envelope_fake_mode(monkeypatch):
    metrics = _StubMetrics()

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD", "snapshot": {}, "signals": {}}, metrics_client=metrics, fake_mode=True)

    decision = resp.get("decisions")[0]
    router_trace = resp.get("router_result", {}).get("meta", {}).get("trace_id")

    assert decision["trace_id"] == router_trace
    assert decision["payload"]["action"] == resp["brain_decision"]["action"]
    assert resp["meta"]["trace_id"] == router_trace
    assert _count(metrics.calls, "runtime_decisions_total", source="brain", outcome="success") == 1