import importlib
import os

import pytest

from backend.brain.invariants import SINGLE_MARKET_DATA_SOURCE
from backend.safe_mode import get_safe_mode_manager
from backend.services.settings_service import InMemorySettingsStore, SettingsService


def _load_runtime(monkeypatch, env_source="MOCK", intent_preview=False):
    monkeypatch.setenv("MARKET_DATA_SOURCE", env_source)
    monkeypatch.setenv("INTENT_PREVIEW_ENABLED", "true" if intent_preview else "")
    import backend.worker.runtime_pipeline as runtime_pipeline

    runtime_pipeline = importlib.reload(runtime_pipeline)
    from backend.brain.eval.snapshot import build_eval_snapshot

    runtime_pipeline.build_eval_snapshot = build_eval_snapshot
    return runtime_pipeline


def _stub_runtime_dependencies(monkeypatch):
    monkeypatch.setattr(
        "backend.worker.runner.get_brain_decision",
        lambda *args, **kwargs: {"action": "buy", "confidence": 0.7, "rationale": ["stub_reason"], "timestamp": 123.0},
    )
    monkeypatch.setattr("backend.worker.runner.trade_engine_runner.get_trade_action", lambda *args, **kwargs: {"action": "buy", "meta": {}})
    monkeypatch.setattr("backend.worker.runtime_router.route", lambda trade_action, **kwargs: {"status": "success", "meta": {}})
    monkeypatch.setattr("backend.worker.intent_preview_runtime.get_intent_preview", lambda *args, **kwargs: {"intent": "preview", "meta": {}})


def test_intent_propagates_with_trace_and_observers(monkeypatch):
    runtime_pipeline = _load_runtime(monkeypatch, env_source="MOCK", intent_preview=True)
    _stub_runtime_dependencies(monkeypatch)
    envelope = {
        "instrument": "BTC-USD",
        "constraints": ["risk_limit", "cooldown"],
        "signals": {"price": 101.0},
        "snapshot": {"price": 101.0},
        "meta": {"trace_id": "trace-123"},
    }

    result = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    assert result["status"] == "success"
    trace_id = result["meta"]["trace_id"]
    assert trace_id
    assert result["meta"]["learning_gate"]["status"] == "BLOCKED"
    assert result["meta"]["pipeline_fake_mode"] is False
    assert result["intent_preview"] is not None
    assert result["brain_decision"] is not None
    assert result["trade_action"] is not None
    assert result["router_result"]["meta"].get("trace_id") == trace_id
    assert result["decisions"][0]["trace_id"] == trace_id
    assert SINGLE_MARKET_DATA_SOURCE is True


def test_cancel_confirmation_emits_no_intent_and_no_audit(monkeypatch):
    runtime_pipeline = _load_runtime(monkeypatch, env_source="MOCK", intent_preview=True)
    _stub_runtime_dependencies(monkeypatch)
    result = runtime_pipeline.run_decision_pipeline({}, fake_mode=False)

    assert result["status"] == "hold"
    assert result["intent_preview"] is None
    assert result["brain_decision"] is None
    assert result["router_result"] is None
    store = InMemorySettingsStore()
    service = SettingsService(store)
    assert service.audit_entries() == []


def test_audit_records_confirmed_actions_only():
    store = InMemorySettingsStore()
    service = SettingsService(store)

    _ = service.get_preferences("owner-1")
    assert service.audit_entries() == []

    service.save_preferences("owner-1", {"notify_on_failure": False})
    assert len(service.audit_entries()) == 1

    service.add_api_key("owner-1", "demo", "secret-key")
    assert len(service.audit_entries()) == 2


def test_safe_mode_constrains_strategies_globally():
    manager = get_safe_mode_manager()

    assert manager.is_safe_mode_active() is True
    assert manager.is_real_trading_allowed() is False

    with pytest.raises(RuntimeError):
        manager.check_trading_allowed("execute_order")
