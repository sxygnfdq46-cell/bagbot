"""Tests for intent preview runtime shim."""

import importlib
import sys

from backend.worker import intent_preview_runtime


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_import_safe(monkeypatch):
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")
    importlib.reload(intent_preview_runtime)
    assert hasattr(intent_preview_runtime, "get_intent_preview")


def test_fake_mode_deterministic(monkeypatch):
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")
    importlib.reload(intent_preview_runtime)

    first = intent_preview_runtime.get_intent_preview({"action": "buy", "instrument": "ETH-USD"}, {"price": 1500})
    second = intent_preview_runtime.get_intent_preview({"action": "buy", "instrument": "ETH-USD"}, {"price": 1500})
    assert first == second
    assert first["meta"].get("fake") is True


def test_runtime_success(monkeypatch):
    metrics = _StubMetrics()

    class StubCore:
        def __call__(self, decision, snapshot):
            return {"action": "buy", "size": 1.0, "confidence": 0.5, "rationale": [], "risk_notes": []}

    monkeypatch.setitem(sys.modules, "backend.execution.intent_preview", type("M", (), {"get_intent_preview": StubCore()}))
    monkeypatch.delenv("INTENT_PREVIEW_FAKE_MODE", raising=False)
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")
    importlib.reload(intent_preview_runtime)

    resp = intent_preview_runtime.get_intent_preview({"action": "buy", "instrument": "BTC-USD"}, {"price": 1000}, metrics_client=metrics)

    assert resp["action"] == "buy"
    assert _count(metrics.calls, "intent_preview_requests_total", outcome="success") == 1


def test_runtime_exception_fallback(monkeypatch):
    metrics = _StubMetrics()

    def boom(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setitem(sys.modules, "backend.execution.intent_preview", type("M", (), {"get_intent_preview": boom}))
    monkeypatch.delenv("INTENT_PREVIEW_FAKE_MODE", raising=False)
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "1")
    importlib.reload(intent_preview_runtime)

    resp = intent_preview_runtime.get_intent_preview({"action": "sell", "instrument": "SOL-USD"}, {"price": 25}, metrics_client=metrics)

    assert resp["action"] == "hold"
    assert resp.get("reason") == "exception"
    assert _count(metrics.calls, "intent_preview_failures_total", reason="exception") == 1
