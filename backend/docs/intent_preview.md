# Intent Preview Layer

Purpose: provide a safe preview of what the engine would do (no routing, no execution). Returns a structured intent with action, size, confidence, rationale, and risk notes.

## Flow
```
[Decision payload] + [Snapshot]
        | (import-safe)
        v
backend.execution.intent_preview.get_intent_preview
        |-- validate decision (action/instrument)
        |-- compute risk-aware size (env MAX_ORDER_USD / MAX_POSITION_USD, price)
        |-- build preview (action, size, confidence, rationale, risk_notes)
        |-- fake-mode short-circuit if INTENT_PREVIEW_FAKE_MODE=1
        v
structured preview (no execution)
```

## Examples
```python
from backend.execution.intent_preview import get_intent_preview

preview = get_intent_preview(
    {"action": "buy", "instrument": "BTC-USD", "confidence": 0.8, "risk_pct": 0.02},
    {"price": 20000},
)
# -> {'action': 'buy', 'size': 0.01, 'confidence': 0.8, 'rationale': [], 'risk_notes': [], 'meta': {...}}
```

## Fake Mode
- Set `INTENT_PREVIEW_FAKE_MODE=1` to return a deterministic preview (hash-based action/size/confidence) without reading risk limits.
- Marked with `meta.fake = True` and `risk_notes = ['fake_mode']`.

## Runtime Shim
- `backend.worker.intent_preview_runtime.get_intent_preview` lazy-imports the core function, supports fake mode, and fails safe to a hold preview on any error.

## Metrics
- `intent_preview_requests_total{outcome}`
- `intent_preview_failures_total{reason}`

These metrics are emitted only when a metrics client is provided with `.inc` or `.increment` methods.
