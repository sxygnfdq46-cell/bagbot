"""Unit tests for runtime pipeline shim."""

import importlib
import sys
import types

import backend.worker as worker_pkg

from backend.worker import runtime_pipeline


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_import_safety(monkeypatch):
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")
    importlib.reload(runtime_pipeline)
    assert hasattr(runtime_pipeline, "run_decision_pipeline")


def test_pipeline_composes_stages(monkeypatch):
    metrics = _StubMetrics()

    def fake_brain(signals, config=None, metrics_client=None, fake_mode=None, trace_id=None):
        meta = {"m": 1}
        if trace_id:
            meta["trace_id"] = trace_id
        return {"action": "buy", "confidence": 0.9, "rationale": ["ok"], "meta": meta}

    def fake_trade(decision, fake_mode=None, metrics=None, router=None, engine_class=None):
        return {"action": "buy", "envelope": {"id": "t1"}}

    def fake_route(action, metrics_client=None, fake_mode=None):
        return {"status": "success", "order_id": "ord-1"}

    def fake_preview(decision, snapshot, metrics_client=None, fake_mode=None):
        return {"action": "buy", "size": 1.0, "confidence": 0.9, "rationale": [], "risk_notes": [], "meta": {}}

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=fake_route)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.setattr(worker_pkg, "runtime_router", router_mod, raising=False)
    preview_mod = types.SimpleNamespace(get_intent_preview=fake_preview)
    monkeypatch.setitem(sys.modules, "backend.worker.intent_preview_runtime", preview_mod)
    monkeypatch.setattr(worker_pkg, "intent_preview_runtime", preview_mod, raising=False)
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD", "snapshot": {}, "signals": {}}, metrics_client=metrics)

    assert resp["status"] == "success"
    assert resp["brain_decision"]["action"] == "buy"
    assert resp["trade_action"]["envelope"]["id"] == "t1"
    assert resp["router_result"]["order_id"] == "ord-1"
    assert resp["intent_preview"]["size"] == 1.0
    assert _count(metrics.calls, "pipeline_requests_total", stage="brain", outcome="success") == 1
    assert _count(metrics.calls, "pipeline_requests_total", stage="intent_preview", outcome="success") == 1


def test_pipeline_brain_failure(monkeypatch):
    metrics = _StubMetrics()

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=boom))

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD"}, metrics_client=metrics)
    assert resp["status"] == "hold"
    assert resp["reason"] == "exception"
    assert _count(metrics.calls, "pipeline_failures_total", stage="brain", reason="exception") == 1


def test_pipeline_trade_failure(monkeypatch):
    metrics = _StubMetrics()

    def fake_brain(*args, **kwargs):
        return {"action": "buy"}

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=boom))

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD"}, metrics_client=metrics)
    assert resp["status"] == "hold"
    assert resp["reason"] == "exception"
    assert _count(metrics.calls, "pipeline_failures_total", stage="trade_engine", reason="exception") == 1


def test_pipeline_router_failure(monkeypatch):
    metrics = _StubMetrics()

    def fake_brain(*args, **kwargs):
        return {"action": "buy"}

    def fake_trade(*args, **kwargs):
        return {"action": "buy"}

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=boom)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.setattr(worker_pkg, "runtime_router", router_mod, raising=False)

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD"}, metrics_client=metrics)
    assert resp["status"] == "hold"
    assert resp["reason"] == "exception"
    assert _count(metrics.calls, "pipeline_failures_total", stage="runtime_router", reason="exception") == 1


def test_pipeline_brain_invalid_response(monkeypatch):
    metrics = _StubMetrics()

    def bad_brain(*args, **kwargs):
        return None

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=bad_brain))

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD", "meta": {"trace_id": "t-1"}}, metrics_client=metrics)

    assert resp["status"] == "hold"
    assert resp["reason"] == "invalid_brain_response"
    assert resp["meta"].get("trace_id") == "t-1"
    assert _count(metrics.calls, "pipeline_failures_total", stage="brain", reason="invalid_brain_response") == 1


def test_pipeline_router_invalid_response(monkeypatch):
    metrics = _StubMetrics()

    def fake_brain(*args, **kwargs):
        return {"action": "buy"}

    def fake_trade(*args, **kwargs):
        return {"action": "buy"}

    def bad_route(*args, **kwargs):
        return None

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=bad_route)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.setattr(worker_pkg, "runtime_router", router_mod, raising=False)

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD", "meta": {"trace_id": "t-2"}}, metrics_client=metrics)

    assert resp["status"] == "hold"
    assert resp["reason"] == "invalid_router_response"
    assert resp["meta"].get("trace_id") == "t-2"
    assert _count(metrics.calls, "pipeline_failures_total", stage="runtime_router", reason="invalid_router_response") == 1


def test_pipeline_intent_preview_failure(monkeypatch):
    metrics = _StubMetrics()

    def fake_brain(*args, **kwargs):
        return {"action": "buy"}

    def fake_trade(*args, **kwargs):
        return {"action": "buy"}

    def fake_route(*args, **kwargs):
        return {"status": "success"}

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setitem(sys.modules, "backend.worker.runner", types.SimpleNamespace(get_brain_decision=fake_brain))
    monkeypatch.setitem(sys.modules, "backend.worker.runner.trade_engine_runner", types.SimpleNamespace(get_trade_action=fake_trade))
    router_mod = types.SimpleNamespace(route=fake_route)
    monkeypatch.setitem(sys.modules, "backend.worker.runtime_router", router_mod)
    monkeypatch.setattr(worker_pkg, "runtime_router", router_mod, raising=False)
    preview_mod = types.SimpleNamespace(get_intent_preview=boom)
    monkeypatch.setitem(sys.modules, "backend.worker.intent_preview_runtime", preview_mod)
    monkeypatch.setattr(worker_pkg, "intent_preview_runtime", preview_mod, raising=False)
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")

    resp = runtime_pipeline.run_decision_pipeline({"instrument": "BTC-USD"}, metrics_client=metrics)
    assert resp["status"] == "success"  # pipeline continues but logs rationale
    assert "intent_preview_failed" in resp["rationale"]
    assert _count(metrics.calls, "pipeline_failures_total", stage="intent_preview", reason="exception") == 1


def test_invalid_envelope(monkeypatch):
    metrics = _StubMetrics()
    resp = runtime_pipeline.run_decision_pipeline({}, metrics_client=metrics)
    assert resp["status"] == "hold"
    assert resp["reason"] == "invalid_envelope"
    assert _count(metrics.calls, "pipeline_requests_total", stage="validate", outcome="fail") == 1
