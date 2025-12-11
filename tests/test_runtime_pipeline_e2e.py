"""E2E smoke tests for runtime pipeline with fake modes enabled."""

import os

from backend.worker.runtime_pipeline import run_decision_pipeline


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}, kwargs.get("value")))

    def observe(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}, value))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}, value))


def _count(calls, name, **label_eq):
    hits = 0
    for entry in calls:
        n, lbl = entry[0], entry[1] if len(entry) > 1 else {}
        if n == name and all(lbl.get(k) == v for k, v in label_eq.items()):
            hits += 1
    return hits


def test_pipeline_e2e_fake_modes(monkeypatch):
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")
    monkeypatch.setenv("RUNTIME_TRACING_ENABLED", "1")
    monkeypatch.setenv("RUNTIME_OBSERVABILITY_ENABLED", "1")

    metrics = _StubMetrics()

    resp = run_decision_pipeline({"instrument": "BTC-USD", "snapshot": {}, "signals": {}}, metrics_client=metrics, fake_mode=True)

    assert resp["status"] == "success"
    assert resp["brain_decision"]
    assert resp["trade_action"]
    assert resp["router_result"]
    assert resp["intent_preview"]
    assert resp["meta"].get("trace_id")
    assert resp["router_result"].get("meta", {}).get("trace_id") == resp["meta"].get("trace_id")

    assert _count(metrics.calls, "pipeline_requests_total", stage="brain", outcome="success") == 1
    assert _count(metrics.calls, "pipeline_requests_total", stage="trade_engine", outcome="success") == 1
    assert _count(metrics.calls, "pipeline_requests_total", stage="runtime_router", outcome="success") == 1
    assert _count(metrics.calls, "pipeline_requests_total", stage="intent_preview", outcome="success") == 1
    assert _count(metrics.calls, "pipeline_stage_latency_seconds", stage="runtime_router") == 1


def test_pipeline_import_safety(monkeypatch):
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("TRADE_ENGINE_FAKE_MODE", "1")
    monkeypatch.setenv("RUNTIME_ROUTER_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")

    # Import should not raise even if environment lacks routers/workers.
    import backend.worker.runtime_pipeline as rp  # noqa: F401
    assert hasattr(rp, "run_decision_pipeline")
