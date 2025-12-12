"""Integration coverage for end-to-end trace_id continuity on real path."""

import sys
import types

from backend.signals.ingest import ingest_frame
from backend.worker import runtime_pipeline


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))


def test_trace_flows_ingest_to_router(monkeypatch):
    # Ensure fake modes are off to exercise the real code path.
    monkeypatch.delenv("BRAIN_FAKE_MODE", raising=False)
    monkeypatch.delenv("TRADE_ENGINE_FAKE_MODE", raising=False)
    monkeypatch.delenv("RUNTIME_ROUTER_FAKE_MODE", raising=False)
    monkeypatch.delenv("RUNTIME_PIPELINE_FAKE_MODE", raising=False)

    telemetry = {}
    ingest_resp = ingest_frame({"instrument": "BTC-USD", "timestamp": 1}, telemetry=telemetry)

    envelope = ingest_resp["envelope"]
    trace_id = ingest_resp["trace_id"]

    def fake_brain(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        return {"action": "buy", "confidence": 0.9, "meta": {"trace_id": trace_id}}

    def fake_trade(decision, fake_mode=None, metrics=None, router=None, engine_class=None):
        return {"action": "buy", "envelope": {"id": "t1"}, "meta": {}}

    def fake_route(action, metrics_client=None, fake_mode=None):
        assert action.get("meta", {}).get("trace_id") == trace_id
        return {"status": "success", "order_id": "ord-1", "meta": {"trace_id": trace_id}}

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=fake_route)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.setattr(runtime_pipeline, "runtime_router", router_mod, raising=False)

    metrics = _StubMetrics()

    resp = runtime_pipeline.run_decision_pipeline(envelope, metrics_client=metrics, fake_mode=False)

    assert resp["status"] == "success"
    assert resp["meta"]["trace_id"] == trace_id
    assert resp["brain_decision"]["meta"]["trace_id"] == trace_id
    assert resp["trade_action"]["meta"]["trace_id"] == trace_id
    assert resp["router_result"]["meta"]["trace_id"] == trace_id