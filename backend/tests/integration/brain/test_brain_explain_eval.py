import importlib

import pytest

from backend.brain.eval.snapshot import build_eval_snapshot
from backend.brain.explain.snapshot import build_explain_snapshot
from backend.brain.invariants import LEARNING_GATE_ALWAYS_BLOCKED
from backend.brain.learning_gate.gate import build_learning_gate_snapshot


def _load_runtime(monkeypatch, env_source: str = "HISTORICAL"):
    monkeypatch.setenv("MARKET_DATA_SOURCE", env_source)
    import backend.worker.runtime_pipeline as runtime_pipeline

    runtime_pipeline = importlib.reload(runtime_pipeline)
    from backend.brain.eval.snapshot import build_eval_snapshot

    runtime_pipeline.build_eval_snapshot = build_eval_snapshot
    return runtime_pipeline


def _stub_runtime_dependencies(monkeypatch):
    monkeypatch.setattr(
        "backend.worker.runner.get_brain_decision",
        lambda *args, **kwargs: {"action": "buy", "confidence": 0.66, "rationale": ["stub_reason"], "timestamp": 123.0},
    )
    monkeypatch.setattr("backend.worker.runner.trade_engine_runner.get_trade_action", lambda *args, **kwargs: {"action": "buy", "meta": {}})
    monkeypatch.setattr("backend.worker.runtime_router.route", lambda trade_action, **kwargs: {"status": "success", "meta": {}})


def _sample_envelope():
    return {
        "instrument": "BTC-USD",
        "constraints": ["risk_limit", "cooldown"],
        "signals": {"price": 100},
        "snapshot": {"price": 100},
    }


def test_deterministic_decisions_under_fixed_historical_input(monkeypatch):
    runtime_pipeline = _load_runtime(monkeypatch, env_source="HISTORICAL")
    _stub_runtime_dependencies(monkeypatch)
    envelope = _sample_envelope()

    first = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)
    second = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    assert first["meta"]["market_data_source"] == "HISTORICAL"
    assert second["meta"]["market_data_source"] == "HISTORICAL"
    assert first["brain_decision"] == second["brain_decision"]
    assert first["trade_action"] == second["trade_action"]
    assert first["router_result"] == second["router_result"]
    assert first["decisions"] == second["decisions"]
    assert first["eval"] == second["eval"]


def test_explain_payload_contains_status_reasons_constraints_and_gate(monkeypatch):
    runtime_pipeline = _load_runtime(monkeypatch, env_source="HISTORICAL")
    _stub_runtime_dependencies(monkeypatch)
    envelope = _sample_envelope()
    result = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    explain = result["explain"]
    assert explain["status"] in {"decision", "no_decision"}
    assert explain["reasons"] == ["stub_reason"]
    assert explain["constraints"] == envelope["constraints"]
    assert explain["market_data_source"] == "HISTORICAL"
    assert explain["learning_gate"]["status"] == "BLOCKED"


def test_eval_active_only_on_historical_and_carries_explain_and_gate(monkeypatch):
    runtime_pipeline = _load_runtime(monkeypatch, env_source="HISTORICAL")
    _stub_runtime_dependencies(monkeypatch)
    envelope = _sample_envelope()
    result = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    eval_snapshot = result["eval"]
    assert eval_snapshot["market_data_source"] == "HISTORICAL"
    assert eval_snapshot["decisions_total"] >= 1
    assert eval_snapshot["explain_snapshot"] == result["explain"]
    assert eval_snapshot["learning_gate"]["status"] == "BLOCKED"

    zero_eval = build_eval_snapshot(decisions=result["decisions"], meta={"market_data_source": "MOCK"}, explain=result["explain"], learning_gate=result["meta"]["learning_gate"])
    assert zero_eval["decisions_total"] == 0
    assert zero_eval["pn_l"] == 0.0


def test_learning_gate_always_blocked_with_reasons(monkeypatch):
    gate = build_learning_gate_snapshot(meta={"market_data_source": "HISTORICAL"}, context={"mode": "observe"})

    assert gate["status"] == "BLOCKED"
    assert gate["allowed"] is False
    assert gate["reasons"]
    assert LEARNING_GATE_ALWAYS_BLOCKED is True
