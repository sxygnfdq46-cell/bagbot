# Trade Engine

Import-safe module that takes a brain decision, validates it, applies risk checks, builds an action envelope, and (optionally) hands it to an injected order router. No real exchanges are touched.

## Flow
1) Receive decision from brain runtime (dict).
2) Validation: supported instrument, allowed action, user/account state (blocked → hold).
3) Risk checks: exposure limit, max position size, cooldown, risk-score scaling.
4) Build action envelope (action, amount, confidence, instrument, metadata, reason, risk flags).
5) Router handoff via injected `router.send(envelope)`; failover to safe hold on error or when router is absent.
6) Emit metrics and logs around decisions, failures, and latency.
7) Fake mode: deterministic hold envelope for tests/CI.

## Fake mode
- Toggle with `fake_mode=True` on `TradeEngine.process`.
- Returns deterministic hold envelope: `action=hold`, `amount=0`, `confidence=0`, `reason=fake_mode`, metadata includes `fake: true` and `risk_flags=["fake_mode"]`.

## Metrics (if metrics client injected)
- `engine_decisions_total{action=...}`
- `engine_failures_total{reason=...}` (validation, risk, router failover)
- `engine_decision_latency_ms` (observed via `observe`/`timing` if available)

## Envelope examples
- Accepted buy (risk-scaled):
```
{
  "action": "buy",
  "amount": 5.0,
  "confidence": 0.8,
  "instrument": "BTC-USD",
  "metadata": {"risk_flags": ["scaled_for_risk"]},
  "reason": "accepted"
}
```
- Hold on risk/cooldown:
```
{
  "action": "hold",
  "amount": 0.0,
  "confidence": 0.8,
  "instrument": "BTC-USD",
  "metadata": {"risk_flags": ["cooldown"]},
  "reason": "cooldown_active"
}
```
- Fake mode:
```
{
  "action": "hold",
  "amount": 0.0,
  "confidence": 0.0,
  "instrument": "BTC-USD",
  "metadata": {"risk_flags": ["fake_mode"], "fake": true},
  "reason": "fake_mode"
}
```

## Future integration
- Wire the engine to the real order router behind the same `send(envelope)` interface.
- Replace stub price/risk inputs with live risk systems.
- Extend risk flags/metrics for per-instrument and per-account slices.

## Runtime Integration Layer (runner shim)
- Public API: `get_trade_action(decision: dict, *, fake_mode: Optional[bool]=None, metrics: Optional[Any]=None, router: Optional[Any]=None) -> dict`
- Return shape: `{"action": str, "envelope": dict | None, "reason": Optional[str]}`
- Env var: `TRADE_ENGINE_FAKE_MODE=1` forces deterministic fake output (hold, fake flag) without calling the real engine.
- Metrics emitted (if injected):
  - `trade_engine_requests_total{outcome=success|failure}`
  - `trade_engine_actions_total{action=...}`
  - `trade_engine_failures_total{reason=...}` (router_error, exception)
- Safety guarantees: import-safe, lazy-imports TradeEngine, router send is optional and wrapped with fail-safe hold fallback on error.
- Test commands (local):
  - Import safety: `PYTHONPATH="$PWD" TRADE_ENGINE_FAKE_MODE=1 python -c "import backend.worker.runner.trade_engine_runner"`
  - Runtime shim tests: `PYTHONPATH="$PWD" python -m pytest -q tests/test_trade_engine_runtime.py`
  - Engine slice (optional): `PYTHONPATH="$PWD" python -m pytest -q -k "trade_engine or runtime"`
- Example (with mock router/metrics):
```
from backend.worker.runner.trade_engine_runner import get_trade_action

class StubRouter:
    def __init__(self):
        self.sent = []
    def send(self, envelope):
        self.sent.append(envelope)

class StubMetrics:
    def inc(self, name, labels=None):
        ...

result = get_trade_action({"instrument": "BTC-USD", "action": "buy"}, router=StubRouter(), metrics=StubMetrics())
```
