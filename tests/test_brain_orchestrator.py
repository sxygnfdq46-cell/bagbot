"""Unit tests for the multi-provider orchestrator (offline, deterministic)."""
import os

import pytest

os.environ.setdefault("BAGBOT_JWT_SECRET", "test-secret")
os.environ.setdefault("BRAIN_FAKE_MODE", "1")

from backend.brain.orchestrator import orchestrate_providers  # noqa: E402  pylint: disable=wrong-import-position


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):  # type: ignore[override]
        self.calls.append((name, labels or {}))


def _metrics_count(calls, name, label_key=None, label_value=None):
    return sum(
        1
        for n, lbl in calls
        if n == name and (label_key is None or lbl.get(label_key) == label_value)
    )


def test_fake_mode_deterministic_decision():
    result = orchestrate_providers({"foo": "bar"}, fake_mode=True)

    assert result["action"] in {"buy", "hold"}
    assert 0.0 <= result["confidence"] <= 1.0
    assert result["meta"]["fake_mode"] is True


def test_provider_failure_fallback(monkeypatch):
    # Force indicators to fail and ensure others still decide.
    from backend.brain.orchestrator import providers

    def boom(payload, env=None):
        raise ValueError("boom")

    monkeypatch.setattr(providers, "indicators_provider", boom)
    monkeypatch.setitem(providers.PROVIDER_FUNCS, "indicators", boom)

    result = orchestrate_providers({}, fake_mode=True)

    assert result["action"] in {"buy", "hold"}
    assert "indicators" in result["meta"]["failed_providers"]
    assert "indicators" not in result["meta"]["signals_used"]


def test_confidence_selection_tiebreak(monkeypatch):
    from backend.brain.orchestrator import providers

    def p1(payload, env=None):
        from backend.brain.orchestrator.schema import ProviderSignal

        return ProviderSignal("a", "buy", 0.7, 0.4, ["a"], {})

    def p2(payload, env=None):
        from backend.brain.orchestrator.schema import ProviderSignal

        return ProviderSignal("b", "sell", 0.7, 0.4, ["b"], {})

    monkeypatch.setattr(providers, "tradingview_provider", p1)
    monkeypatch.setattr(providers, "indicators_provider", p2)
    monkeypatch.setitem(providers.PROVIDER_FUNCS, "tradingview", p1)
    monkeypatch.setitem(providers.PROVIDER_FUNCS, "indicators", p2)

    result = orchestrate_providers({}, fake_mode=True)

    assert result["action"] == "buy"  # provider_id 'a' wins tie (alphabetical)
    # Signals used reflect provider_ids from returned signals.
    assert result["meta"]["signals_used"] == ["a", "b", "brain", "marketdata"]


def test_metrics_injection():
    metrics = _StubMetrics()

    orchestrate_providers({}, fake_mode=True, metrics_client=metrics)

    assert _metrics_count(metrics.calls, "brain_orchestrator_requests_total") == 1
    assert _metrics_count(metrics.calls, "brain_orchestrator_decisions_total") == 1
    assert _metrics_count(metrics.calls, "brain_orchestrator_provider_success_total") >= 1


def test_import_safe():
    # Simply importing should not raise or do side effects.
    import importlib

    module = importlib.import_module("backend.brain.orchestrator")
    assert hasattr(module, "orchestrate_providers")