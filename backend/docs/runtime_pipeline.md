# Runtime Pipeline

Unified brain → trade → router → intent preview flow (import-safe, fake-mode friendly).

## Signature
`run_decision_pipeline(envelope, *, metrics_client=None, fake_mode=None) -> dict`

- `envelope`: dict with at least `instrument`; optional `signals`, `snapshot`, `config`, `fake_mode`.
- Returns dict with `brain_decision`, `trade_action`, `router_result`, optional `intent_preview`, `status`, `rationale`, `meta`.

## Env Flags
- `BRAIN_FAKE_MODE`, `TRADE_ENGINE_FAKE_MODE`, `RUNTIME_ROUTER_FAKE_MODE`, `INTENT_PREVIEW_FAKE_MODE` – per-stage deterministic fake.
- `RUNTIME_PIPELINE_FAKE_MODE` – short-circuit full pipeline with deterministic outputs.
- `INTENT_PREVIEW_ENABLED=1` – enable preview stage.
- `BRAIN_USE_ORCHESTRATOR=1` – brain adapter uses orchestrator path if available.

## Metrics
- `pipeline_requests_total{stage, outcome=success|fail}` for stages: brain, trade_engine, runtime_router, intent_preview.
- `pipeline_failures_total{stage, reason}` on errors.
- Downstream metrics (brain_decisions_total, trade_engine_actions_total, runtime_router_requests_total, intent_preview_* when metrics_client provided).

## Flow
```
validate envelope
  -> brain decision (fake-aware)
  -> trade_engine_runner.get_trade_action (fake-aware)
  -> runtime_router.route (fake-aware)
  -> intent_preview_runtime.get_intent_preview (optional, fake-aware)
```
Errors return a hold-style result and increment `pipeline_failures_total`.

## Examples
```python
from backend.worker.runtime_pipeline import run_decision_pipeline

resp = run_decision_pipeline(
    {"instrument": "BTC-USD", "signals": {}, "snapshot": {}},
    metrics_client=None,
    fake_mode=None,
)
```

## Verification / Staging Canary
Import safety:
```
PYTHONPATH="$PWD" \
BRAIN_FAKE_MODE=1 TRADE_ENGINE_FAKE_MODE=1 RUNTIME_ROUTER_FAKE_MODE=1 INTENT_PREVIEW_FAKE_MODE=1 \
python -c "import backend.worker.runtime_pipeline; print('import ok')"
```

Unit:
```
PYTHONPATH="$PWD" pytest -q tests/test_runtime_pipeline_unit.py
```

E2E smoke:
```
PYTHONPATH="$PWD" pytest -q tests/test_runtime_pipeline_e2e.py
```

Staging canary:
```
PYTHONPATH="$PWD" \
BRAIN_FAKE_MODE=1 TRADE_ENGINE_FAKE_MODE=1 RUNTIME_ROUTER_FAKE_MODE=1 INTENT_PREVIEW_FAKE_MODE=1 \
python -c "from backend.worker.runtime_pipeline import run_decision_pipeline; print(run_decision_pipeline({'instrument':'BTC-USD','snapshot':{}}, metrics_client=None, fake_mode=True))"
```
Expect `pipeline_requests_total` stage counters increment and a structured success payload.
