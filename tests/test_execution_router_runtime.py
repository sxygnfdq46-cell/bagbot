"""Tests for execution router runtime shim (import-safe, deterministic)."""

import importlib

from backend.worker import execution_router_runtime


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, value=None, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover - alternative signature
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_import_safety(monkeypatch):
    monkeypatch.setenv("EXECUTION_ROUTER_FAKE_MODE", "1")
    importlib.reload(execution_router_runtime)
    assert hasattr(execution_router_runtime, "route_execution_request")


def test_fake_mode_deterministic():
    env = {"order": {"instrument": "BTC-USD", "side": "buy", "size": 1.0, "type": "market"}}
    first = execution_router_runtime.route_execution_request(env, fake_mode=True)
    second = execution_router_runtime.route_execution_request(env, fake_mode=True)

    assert first == second
    assert first["status"] == "success"
    assert first["order_id"] is not None
    assert first["fill_price"] is not None


def test_adapter_success(monkeypatch):
    metrics = _StubMetrics()

    class StubAdapter:
        def send_order(self, envelope):
            return {"order_id": "abc123", "fill_price": 101.0, "meta": {"routed": True}}

    monkeypatch.setattr(execution_router_runtime, "_choose_adapter", lambda instrument: StubAdapter())

    resp = execution_router_runtime.route_execution_request(
        {"order": {"instrument": "ETH-USD", "side": "sell", "size": 2, "type": "market"}},
        metrics_client=metrics,
    )

    assert resp["status"] == "success"
    assert resp["order_id"] == "abc123"
    assert _count(metrics.calls, "execution_requests_total", outcome="success") == 1
    assert _count(metrics.calls, "execution_success_total") == 1


def test_adapter_failure(monkeypatch):
    metrics = _StubMetrics()

    class BoomAdapter:
        def send_order(self, envelope):
            raise RuntimeError("boom")

    monkeypatch.setattr(execution_router_runtime, "_choose_adapter", lambda instrument: BoomAdapter())

    resp = execution_router_runtime.route_execution_request(
        {"order": {"instrument": "BTC-USD", "side": "buy", "size": 1, "type": "market"}},
        metrics_client=metrics,
    )

    assert resp["status"] == "held"
    assert resp["reason"] in {"adapter-error", "adapter-not-available", "adapter-invalid"}
    assert _count(metrics.calls, "execution_requests_total", outcome="failed") + _count(metrics.calls, "execution_requests_total", outcome="held") >= 1
    assert _count(metrics.calls, "execution_failures_total") >= 1


def test_metrics_increment_paths(monkeypatch):
    metrics = _StubMetrics()

    class StubAdapter:
        def send_order(self, envelope):
            return {"order_id": "ok", "fill_price": 99.0}

    monkeypatch.setattr(execution_router_runtime, "_choose_adapter", lambda instrument: StubAdapter())

    execution_router_runtime.route_execution_request(
        {"order": {"instrument": "BTC-USD", "side": "sell", "size": 1, "type": "limit", "price": 10}},
        metrics_client=metrics,
    )

    assert _count(metrics.calls, "execution_requests_total", outcome="success") == 1
    assert _count(metrics.calls, "execution_success_total") == 1

    # force adapter missing
    monkeypatch.setattr(execution_router_runtime, "_choose_adapter", lambda instrument: None)
    execution_router_runtime.route_execution_request(
        {"order": {"instrument": "BTC-USD", "side": "sell", "size": 1, "type": "limit", "price": 10}},
        metrics_client=metrics,
    )
    assert _count(metrics.calls, "execution_requests_total", outcome="held") >= 1
    assert _count(metrics.calls, "execution_failures_total", reason="adapter-not-available") >= 1
