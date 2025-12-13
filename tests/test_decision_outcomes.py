"""Tests for decision outcome attribution (read-only)."""
import sys
import types

from backend.services import attribution_service, outcome_emitter
from backend.worker import runtime_pipeline


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for metric_name, lbl in calls if metric_name == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def _reset_state():
    outcome_emitter.reset()
    attribution_service.reset()


def test_outcome_correlates_with_decision(monkeypatch):
    _reset_state()
    metrics = _StubMetrics()

    def fake_brain(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        meta = {"note": 1}
        if trace_id:
            meta["trace_id"] = trace_id
        return {"action": "buy", "confidence": 0.8, "meta": meta}

    def fake_trade(decision, fake_mode=None, metrics=None, router=None, engine_class=None):
        return {"action": "buy", "meta": {}}

    def fake_route(action, metrics_client=None, fake_mode=None):
        return {"status": "success", "order_id": "ord-1", "meta": {"trace_id": action.get("meta", {}).get("trace_id")}}

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=fake_route)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD", "signals": {}, "meta": {"trace_id": "t-123"}}, metrics_client=metrics, fake_mode=False)

    decision = resp.get("decisions")[0]
    outcome = outcome_emitter.outcomes()[-1]
    attribution = attribution_service.attributions()[-1]

    assert outcome.decision_id == decision["decision_id"]
    assert outcome.trace_id == decision["trace_id"] == "t-123"
    assert attribution.outcome.trace_id == "t-123"
    assert _count(metrics.calls, "decision_outcomes_total", status="success") == 1
    assert _count(metrics.calls, "decision_outcomes_success_total", status="success") == 1


def test_orphan_outcome_handling(monkeypatch):
    _reset_state()
    metrics = _StubMetrics()

    outcome = outcome_emitter.emit_outcome(None, {"status": "success", "meta": {"trace_id": "t-orphan"}}, metrics_client=metrics)

    assert outcome is None
    assert outcome_emitter.outcomes() == []
    assert _count(metrics.calls, "orphan_outcomes_total", reason="missing_ids") == 1


def test_fake_mode_parity(monkeypatch):
    _reset_state()
    metrics = _StubMetrics()

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD", "signals": {}}, metrics_client=metrics, fake_mode=True)

    outcome = outcome_emitter.outcomes()[-1]
    decision = resp.get("decisions")[0]
    router_trace = resp.get("router_result", {}).get("meta", {}).get("trace_id")

    assert outcome.status == "success"
    assert outcome.trace_id == router_trace == decision["trace_id"]
    assert _count(metrics.calls, "decision_outcomes_total", status="success") == 1


def test_trace_continuity_in_attribution(monkeypatch):
    _reset_state()
    metrics = _StubMetrics()

    def fake_brain(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        return {"action": "sell", "confidence": 0.5, "meta": {"trace_id": trace_id}}

    def fake_trade(decision, fake_mode=None, metrics=None, router=None, engine_class=None):
        return {"action": "sell", "meta": {"trace_id": decision.get("meta", {}).get("trace_id")}}

    def fake_route(action, metrics_client=None, fake_mode=None):
        return {"status": "success", "order_id": "ord-2", "meta": {"trace_id": action.get("meta", {}).get("trace_id")}}

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=fake_route)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "ETH-USD", "signals": {}, "meta": {"trace_id": "trace-cont"}}, metrics_client=metrics, fake_mode=False)

    decision = resp.get("decisions")[0]
    outcome = outcome_emitter.outcomes()[-1]
    attribution = attribution_service.attributions()[-1]

    assert decision["trace_id"] == outcome.trace_id == attribution.trace_id == "trace-cont"
    assert outcome.status == "success"
    assert _count(metrics.calls, "decision_outcomes_total", status="success") == 1