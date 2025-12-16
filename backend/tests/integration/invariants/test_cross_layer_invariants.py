import importlib

from backtest.replay import ReplayEngine
from backend.brain.eval.snapshot import build_eval_snapshot
from backend.brain.explain.snapshot import build_explain_snapshot
from backend.brain.learning_gate.gate import build_learning_gate_snapshot


CANDLES = [
    {"timestamp": 1, "open": 100, "high": 105, "low": 99, "close": 104, "symbol": "BTC-USD"},
    {"timestamp": 2, "open": 104, "high": 108, "low": 103, "close": 107, "symbol": "BTC-USD"},
    {"timestamp": 3, "open": 107, "high": 109, "low": 106, "close": 108, "symbol": "BTC-USD"},
]


def _reload_runtime(monkeypatch):
    monkeypatch.setenv("MARKET_DATA_SOURCE", "HISTORICAL")
    import backend.worker.runtime_pipeline as runtime_pipeline

    runtime_pipeline = importlib.reload(runtime_pipeline)
    from backend.brain.eval.snapshot import build_eval_snapshot

    runtime_pipeline.build_eval_snapshot = build_eval_snapshot
    return runtime_pipeline


def _stub_runtime_dependencies(monkeypatch):
    monkeypatch.setattr(
        "backend.worker.runner.get_brain_decision",
        lambda *args, **kwargs: {"action": "buy", "confidence": 0.5, "rationale": ["stub_reason"], "timestamp": 123.0},
    )
    monkeypatch.setattr("backend.worker.runner.trade_engine_runner.get_trade_action", lambda *args, **kwargs: {"action": "buy", "meta": {}})
    monkeypatch.setattr("backend.worker.runtime_router.route", lambda trade_action, **kwargs: {"status": "success", "meta": {}})


def _digest_candles(candles):
    return [(c["timestamp"], c["open"], c["high"], c["low"], c["close"]) for c in candles]


def test_same_input_produces_same_candles():
    out_a: list[dict] = []
    out_b: list[dict] = []

    ReplayEngine(CANDLES, tick_callback=lambda c: out_a.append(c)).run()
    ReplayEngine(CANDLES, tick_callback=lambda c: out_b.append(c)).run()

    assert _digest_candles(out_a) == _digest_candles(out_b)


def test_same_candles_produce_same_decisions(monkeypatch):
    runtime_pipeline = _reload_runtime(monkeypatch)
    _stub_runtime_dependencies(monkeypatch)
    envelope = {"instrument": "BTC-USD", "snapshot": {"candles": CANDLES}, "signals": {"price": 100}}

    first = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)
    second = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    assert first["decisions"] == second["decisions"]


def test_same_decisions_produce_same_explain(monkeypatch):
    runtime_pipeline = _reload_runtime(monkeypatch)
    _stub_runtime_dependencies(monkeypatch)
    envelope = {"instrument": "BTC-USD", "snapshot": {"candles": CANDLES}, "signals": {"price": 100}, "constraints": ["risk_limit"]}
    result = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    explain_one = build_explain_snapshot(decision=result["brain_decision"], envelope=envelope, meta={"market_data_source": "HISTORICAL"}, rationale=result["rationale"], learning_gate=result["meta"]["learning_gate"])
    explain_two = build_explain_snapshot(decision=result["brain_decision"], envelope=envelope, meta={"market_data_source": "HISTORICAL"}, rationale=result["rationale"], learning_gate=result["meta"]["learning_gate"])

    assert explain_one == explain_two


def test_same_explain_produces_same_eval(monkeypatch):
    runtime_pipeline = _reload_runtime(monkeypatch)
    _stub_runtime_dependencies(monkeypatch)
    envelope = {"instrument": "BTC-USD", "snapshot": {"candles": CANDLES}, "signals": {"price": 100}}
    result = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    explain_snapshot = result["explain"]
    eval_one = build_eval_snapshot(decisions=result["decisions"], meta={"market_data_source": "HISTORICAL"}, explain=explain_snapshot, learning_gate=result["meta"]["learning_gate"])
    eval_two = build_eval_snapshot(decisions=result["decisions"], meta={"market_data_source": "HISTORICAL"}, explain=explain_snapshot, learning_gate=result["meta"]["learning_gate"])

    assert eval_one == eval_two


def test_removing_explain_or_audit_does_not_change_decisions(monkeypatch):
    runtime_pipeline = _reload_runtime(monkeypatch)
    _stub_runtime_dependencies(monkeypatch)
    envelope = {"instrument": "BTC-USD", "snapshot": {"candles": CANDLES}, "signals": {"price": 100}}
    result = runtime_pipeline.run_decision_pipeline(envelope, fake_mode=False)

    decisions = result["decisions"]
    gate = build_learning_gate_snapshot(meta={"market_data_source": "HISTORICAL"}, context={"mode": "observe"})

    eval_with_explain = build_eval_snapshot(decisions=decisions, meta={"market_data_source": "HISTORICAL"}, explain=result["explain"], learning_gate=gate)
    eval_without_explain = build_eval_snapshot(decisions=decisions, meta={"market_data_source": "HISTORICAL"}, explain=None, learning_gate=gate)

    assert decisions == result["decisions"]
    assert eval_with_explain["decisions_total"] == eval_without_explain["decisions_total"]
