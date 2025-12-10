"""Unit tests for TradeEngine (import-safe, deterministic)."""

from backend.trading.engine import TradeEngine


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):
        self.calls.append((name, labels or {}))

    def observe(self, name, value, labels=None):
        self.calls.append((name, {**(labels or {}), "value": value}))


class _StubRouter:
    def __init__(self):
        self.sent = []
        self.should_boom = False

    def send(self, envelope):
        if self.should_boom:
            raise RuntimeError("router failure")
        self.sent.append(envelope)


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_invalid_decision_rejected():
    metrics = _StubMetrics()
    engine = TradeEngine(metrics=metrics)

    envelope = engine.process({"action": "buy"})  # missing instrument

    assert envelope["action"] == "hold"
    assert envelope["reason"] == "unsupported_instrument"
    assert _count(metrics.calls, "engine_failures_total", reason="unsupported_instrument") == 1
    assert _count(metrics.calls, "engine_decisions_total", action="hold") == 1


def test_unsupported_action_fallback_to_hold():
    metrics = _StubMetrics()
    engine = TradeEngine(metrics=metrics)

    envelope = engine.process({"instrument": "BTC-USD", "action": "short"})

    assert envelope["action"] == "hold"
    assert envelope["reason"] == "unsupported_action"
    assert _count(metrics.calls, "engine_failures_total", reason="unsupported_action") == 1


def test_position_limit_hold():
    metrics = _StubMetrics()
    engine = TradeEngine(metrics=metrics, config={"max_position_size": 5.0, "supported_instruments": {"BTC-USD"}})

    envelope = engine.process({"instrument": "BTC-USD", "action": "buy", "amount": 10, "confidence": 0.9})

    assert envelope["action"] == "hold"
    assert envelope["reason"] == "max_position"
    assert _count(metrics.calls, "engine_decisions_total", action="hold") == 1


def test_cooldown_active_hold():
    engine = TradeEngine()

    envelope = engine.process(
        {"instrument": "BTC-USD", "action": "buy", "amount": 1, "confidence": 0.8},
        user_state={"cooldown_active": True},
    )

    assert envelope["action"] == "hold"
    assert envelope["reason"] == "cooldown_active"


def test_high_risk_reduces_quantity():
    engine = TradeEngine(config={"supported_instruments": {"BTC-USD"}, "risk_score_threshold": 0.5, "risk_scale_factor": 0.5})

    envelope = engine.process(
        {"instrument": "BTC-USD", "action": "buy", "amount": 10, "confidence": 0.8, "risk_score": 0.9}
    )

    assert envelope["action"] == "buy"
    assert envelope["amount"] == 5  # scaled by 0.5
    assert "scaled_for_risk" in envelope["metadata"].get("risk_flags", [])


def test_envelope_structure_and_fake_mode():
    engine = TradeEngine()
    fake = engine.process({"instrument": "ETH-USD", "action": "buy"}, fake_mode=True)

    assert set(fake.keys()) == {"action", "amount", "confidence", "instrument", "metadata", "reason"}
    assert fake["reason"] == "fake_mode"
    assert fake["action"] == "hold"
    assert fake["metadata"].get("fake") is True


def test_router_integration_and_failover():
    metrics = _StubMetrics()
    router = _StubRouter()
    engine = TradeEngine(metrics=metrics, router=router, config={"supported_instruments": {"BTC-USD"}})

    env_sent = engine.process({"instrument": "BTC-USD", "action": "buy", "amount": 1, "confidence": 0.6})
    assert router.sent and router.sent[0]["action"] == "buy"
    assert env_sent.get("router_status") == "sent"

    router.should_boom = True
    env_failover = engine.process({"instrument": "BTC-USD", "action": "buy", "amount": 1, "confidence": 0.6})
    assert env_failover["action"] == "hold"
    assert env_failover["reason"] == "router_error"
    assert _count(metrics.calls, "engine_failures_total", reason="router_error") >= 1


def test_router_missing_is_safe():
    engine = TradeEngine(config={"supported_instruments": {"BTC-USD"}})

    envelope = engine.process({"instrument": "BTC-USD", "action": "buy", "amount": 1, "confidence": 0.7})

    assert envelope.get("router_status") == "skipped"


def test_metrics_increment_on_success_and_failure():
    metrics = _StubMetrics()
    engine = TradeEngine(metrics=metrics, config={"supported_instruments": {"BTC-USD"}})

    engine.process({"instrument": "BTC-USD", "action": "buy", "amount": 1, "confidence": 0.9})
    engine.process({"instrument": "BTC-USD", "action": "invalid"})

    assert _count(metrics.calls, "engine_decisions_total", action="buy") == 1
    assert _count(metrics.calls, "engine_decisions_total", action="hold") >= 1
    assert _count(metrics.calls, "engine_failures_total") >= 1


def test_import_safe():
    # Simply importing should not raise or touch router.
    from backend.trading.engine import trade_engine  # noqa: F401

    assert True
