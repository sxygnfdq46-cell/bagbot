"""Runtime integration tests for orchestrator delegation (adapter + runner)."""
import importlib
import os

import pytest

from backend.brain import adapter
from backend.worker import runner


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):
        self.calls.append((name, labels or {}))


def test_import_safe_with_orchestrator_flag(monkeypatch):
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    monkeypatch.setenv("BRAIN_USE_ORCHESTRATOR", "1")
    importlib.reload(adapter)

    assert hasattr(adapter, "decide")


def test_delegates_to_orchestrator(monkeypatch):
    monkeypatch.setenv("BRAIN_USE_ORCHESTRATOR", "1")
    metrics = _StubMetrics()

    def fake_orchestrate(signals, metrics_client=None, fake_mode=None):
        metrics_client.inc("brain_orchestrator_decisions_total", {"action": "buy"})
        return {
            "action": "buy",
            "confidence": 0.9,
            "rationale": ["orchestrated"],
            "meta": {"signals_used": ["orchestrator"], "fake_mode": fake_mode},
        }

    monkeypatch.setattr("backend.brain.adapter._use_orchestrator", lambda env=None: True)
    monkeypatch.setattr("backend.brain.orchestrator.orchestrate_providers", fake_orchestrate)

    decision = adapter.decide({"demo": {}}, metrics_client=metrics, fake_mode=True)

    assert decision["action"] == "buy"
    assert decision["confidence"] == 0.9
    assert ("brain_decisions_total", {"action": "buy"}) in metrics.calls
    assert ("brain_orchestrator_decisions_total", {"action": "buy"}) in metrics.calls


def test_orchestrator_fallback_on_error(monkeypatch):
    monkeypatch.setenv("BRAIN_USE_ORCHESTRATOR", "1")

    def boom(*_args, **_kwargs):
        raise RuntimeError("fail")

    monkeypatch.setattr("backend.brain.orchestrator.orchestrate_providers", boom)
    monkeypatch.setattr("backend.brain.adapter._use_orchestrator", lambda env=None: True)

    metrics = _StubMetrics()
    decision = adapter.decide({"demo": {"type": "momentum", "strength": 0.1}}, metrics_client=metrics, fake_mode=True)

    assert decision["action"] == "hold"  # falls back to fake_mode canned decision
    assert ("brain_decisions_total", {"action": "hold"}) in metrics.calls


def test_runner_integration_orchestrator_path(monkeypatch):
    monkeypatch.setenv("BRAIN_USE_ORCHESTRATOR", "1")
    monkeypatch.setenv("BRAIN_FAKE_MODE", "1")
    metrics = _StubMetrics()

    decision = runner.get_brain_decision({"demo": {"type": "momentum", "strength": 0.2}}, metrics_client=metrics)

    assert decision["action"] in {"buy", "hold"}
    assert decision["meta"].get("fake_mode") is True
    assert any(name == "brain_decisions_total" for name, _labels in metrics.calls)