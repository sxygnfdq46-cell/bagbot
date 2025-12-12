"""Integration coverage for decision propagation and trace continuity."""

import sys
import types

from backend.signals.ingest import ingest_frame
from backend.worker import runtime_pipeline


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))


def test_decisions_include_trace_from_ingest(monkeypatch):
    telemetry = {}
    ingest_resp = ingest_frame({"instrument": "BTC-USD", "timestamp": 1}, telemetry=telemetry)
    envelope = ingest_resp["envelope"]
    trace_id = ingest_resp["trace_id"]

    def fake_brain(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        return {"action": "buy", "confidence": 0.9, "meta": {"trace_id": trace_id}}

    def fake_trade(decision, fake_mode=None, metrics=None, router=None, engine_class=None):
        return {"action": decision.get("action"), "meta": {}}

    def fake_route(action, metrics_client=None, fake_mode=None):
        return {"status": "success", "order_id": "ord-1", "meta": {"trace_id": action.get("meta", {}).get("trace_id")}}

    brain_mod = types.SimpleNamespace(get_brain_decision=fake_brain)
    trade_mod = types.SimpleNamespace(get_trade_action=fake_trade)
    router_mod = types.SimpleNamespace(route=fake_route)

    monkeypatch.setitem(sys.modules, "backend.worker.runner", brain_mod)
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", trade_mod)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.delenv("BRAIN_FAKE_MODE", raising=False)
    monkeypatch.delenv("RUNTIME_ROUTER_FAKE_MODE", raising=False)

    resp = runtime_pipeline.run_decision_pipeline(envelope, metrics_client=_StubMetrics(), fake_mode=False)

    decision = resp.get("decisions")[0]

    assert resp["meta"]["trace_id"] == trace_id
    assert decision["trace_id"] == trace_id
    assert decision["payload"]["action"] == "buy"
    assert decision["source"] == "brain"