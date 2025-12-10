"""Tests for intent preview core module."""

import importlib

from backend.execution import intent_preview


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None, **kwargs):
        self.calls.append((name, labels or {}))

    def increment(self, name, value=None, labels=None, **kwargs):  # pragma: no cover
        self.calls.append((name, labels or {}))


def test_import_safety(monkeypatch):
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")
    importlib.reload(intent_preview)
    assert hasattr(intent_preview, "get_intent_preview")


def test_fake_mode_deterministic(monkeypatch):
    monkeypatch.setenv("INTENT_PREVIEW_FAKE_MODE", "1")
    importlib.reload(intent_preview)
    first = intent_preview.get_intent_preview({"action": "buy", "instrument": "BTC-USD"}, {"price": 20000})
    second = intent_preview.get_intent_preview({"action": "buy", "instrument": "BTC-USD"}, {"price": 20000})
    assert first == second
    assert first["meta"].get("fake") is True


def test_preview_computes_size_and_confidence(monkeypatch):
    monkeypatch.delenv("INTENT_PREVIEW_FAKE_MODE", raising=False)
    importlib.reload(intent_preview)

    decision = {"action": "buy", "instrument": "BTC-USD", "confidence": 0.8, "risk_pct": 0.02}
    snapshot = {"price": 20000}

    preview = intent_preview.get_intent_preview(decision, snapshot)

    assert preview["action"] == "buy"
    assert abs(preview["size"] - 0.01) < 1e-9  # 10000 cap * 0.02 / 20000
    assert preview["confidence"] == 0.8
    assert preview["meta"]["price"] == 20000
    assert preview["risk_notes"] == []


def test_invalid_decision_returns_hold(monkeypatch):
    monkeypatch.delenv("INTENT_PREVIEW_FAKE_MODE", raising=False)
    importlib.reload(intent_preview)

    preview = intent_preview.get_intent_preview({}, {})
    assert preview["action"] == "hold"
    assert preview.get("reason") == "invalid_decision"


def test_missing_price_adds_note(monkeypatch):
    monkeypatch.delenv("INTENT_PREVIEW_FAKE_MODE", raising=False)
    importlib.reload(intent_preview)

    decision = {"action": "buy", "instrument": "BTC-USD", "requested_size": 1.5}
    preview = intent_preview.get_intent_preview(decision, {})
    assert "missing_price" in preview["risk_notes"]
