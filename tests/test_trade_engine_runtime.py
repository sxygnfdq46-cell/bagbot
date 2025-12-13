"""Runtime shim tests for trade engine runner (import-safe, deterministic)."""

from backend.worker.runner import trade_engine_runner


class _StubMetrics:
    def __init__(self):
        self.calls = []

    def inc(self, name, labels=None):
        self.calls.append((name, labels or {}))

    def observe(self, name, value, labels=None):  # pragma: no cover - not used but provided
        self.calls.append((name, {**(labels or {}), "value": value}))


class _StubRouter:
    def __init__(self):
        self.sent = []
        self.should_boom = False

    def send(self, envelope):
        if self.should_boom:
            raise RuntimeError("router boom")
        self.sent.append(envelope)


def _count(calls, name, **label_eq):
    return sum(1 for n, lbl in calls if n == name and all(lbl.get(k) == v for k, v in label_eq.items()))


def test_import_safety():
    # Import should not raise or perform side effects.
    import importlib

    importlib.reload(trade_engine_runner)

    assert hasattr(trade_engine_runner, "get_trade_action")


def test_fake_mode_deterministic():
    decision = {"instrument": "BTC-USD", "action": "buy"}

    first = trade_engine_runner.get_trade_action(decision, fake_mode=True)
    second = trade_engine_runner.get_trade_action(decision, fake_mode=True)

    assert first == second
    assert first["action"] == "hold"
    assert first["reason"] == "fake_mode"
    assert first["envelope"]["metadata"]["fake"] is True


def test_real_mode_flow_calls_engine_and_router(monkeypatch):
    metrics = _StubMetrics()
    router = _StubRouter()

    class _StubEngine:
        def __init__(self, metrics=None, router=None):
            self.metrics = metrics
            self.router = router
            self.process_called = False

        def process(self, decision, fake_mode=False):
            self.process_called = True
            if self.router:
                self.router.send({"routed": True, "instrument": decision.get("instrument")})
            return {
                "action": "buy",
                "amount": decision.get("amount", 1),
                "confidence": decision.get("confidence", 0.5),
                "instrument": decision.get("instrument", "unknown"),
                "metadata": {"risk_flags": []},
                "reason": "accepted",
            }

    result = trade_engine_runner.get_trade_action(
        {"instrument": "BTC-USD", "action": "buy", "amount": 2, "confidence": 0.9},
        metrics=metrics,
        router=router,
        engine_class=_StubEngine,
    )

    assert result["action"] == "buy"
    assert result["envelope"]["instrument"] == "BTC-USD"
    assert router.sent and router.sent[0]["routed"] is True
    assert _count(metrics.calls, "trade_engine_requests_total", outcome="success") == 1
    assert _count(metrics.calls, "trade_engine_actions_total", action="buy") == 1


def test_router_failure_fallback(monkeypatch):
    metrics = _StubMetrics()

    class RouterBoom:
        def send(self, envelope):
            raise RuntimeError("boom")

    result = trade_engine_runner.get_trade_action(
        {"instrument": "BTC-USD", "action": "buy", "amount": 1, "confidence": 0.7},
        metrics=metrics,
        router=RouterBoom(),
    )

    assert result["action"] == "hold"
    assert result["reason"] in {"router_error", "trade_engine_error"}
    assert _count(metrics.calls, "trade_engine_failures_total", reason="router_error") + _count(metrics.calls, "trade_engine_failures_total", reason="exception") >= 1
    assert _count(metrics.calls, "trade_engine_requests_total", outcome="failure") >= 1


def test_metrics_injection(monkeypatch):
    metrics = _StubMetrics()

    class _StubEngine:
        def __init__(self, metrics=None, router=None):
            self.metrics = metrics
            self.router = router

        def process(self, decision, fake_mode=False):
            return {
                "action": "sell",
                "amount": 1,
                "confidence": 0.6,
                "instrument": decision.get("instrument", "unknown"),
                "metadata": {"risk_flags": []},
                "reason": "accepted",
            }

    trade_engine_runner.get_trade_action(
        {"instrument": "ETH-USD", "action": "sell", "confidence": 0.6},
        metrics=metrics,
        engine_class=_StubEngine,
    )

    assert _count(metrics.calls, "trade_engine_actions_total", action="sell") == 1
    assert _count(metrics.calls, "trade_engine_requests_total", outcome="success") == 1
