# Runtime Pipeline

Unified brain → trade → router → intent preview flow (import-safe, fake-mode friendly).

## Signature
`run_decision_pipeline(envelope, *, metrics_client=None, fake_mode=None) -> dict`

- `envelope`: dict with at least `instrument`; optional `signals`, `snapshot`, `config`, `fake_mode`.
- Returns dict with `brain_decision`, `trade_action`, `router_result`, optional `intent_preview`, `status`, `rationale`, `meta`.

## Env Flags
- `BRAIN_FAKE_MODE`, `TRADE_ENGINE_FAKE_MODE`, `RUNTIME_ROUTER_FAKE_MODE`, `INTENT_PREVIEW_FAKE_MODE` – per-stage deterministic fake.
- `RUNTIME_PIPELINE_FAKE_MODE` – short-circuit full pipeline with deterministic outputs.
- `INTENT_PREVIEW_ENABLED=1` – enable preview stage (intent preview shim no-ops when false).
- `RUNTIME_OBSERVABILITY_ENABLED=1` – enable pipeline metrics (counters + latencies).
- `RUNTIME_TRACING_ENABLED=1` – enable lightweight trace context (trace_id + per-stage timestamps) flowing through pipeline/meta.
- `BRAIN_USE_ORCHESTRATOR=1` – brain adapter uses orchestrator path if available.

## Observability (metrics + tracing)
- Pipeline counters: `pipeline_requests_total{stage, outcome, pipeline_version, trace_id?}` for stages brain, trade_engine, runtime_router, intent_preview, validate.
- Pipeline failures: `pipeline_failures_total{stage, reason, pipeline_version, trace_id?}`
- Pipeline latencies: `pipeline_stage_latency_seconds{stage, pipeline_version, trace_id?}` (histogram/observe compatible) per stage.
- Router shim: `runtime_router_requests_total{outcome, trace_id?}`, `runtime_router_latency_seconds{trace_id?}`
- Intent preview shim: `intent_preview_requests_total{outcome, trace_id?}`, `intent_preview_failures_total{reason, trace_id?}`, `intent_preview_latency_seconds{trace_id?}`
- Trace context: generated per call when `RUNTIME_TRACING_ENABLED=1`; includes `trace_id`, `pipeline_start_ts`, per-stage durations, and is returned in `meta.trace_id` and `router_result.meta.trace_id`.

## Flow
```
validate envelope
  -> brain decision (fake-aware)
  -> trade_engine_runner.get_trade_action (fake-aware)
  -> runtime_router.route (fake-aware)
  -> intent_preview_runtime.get_intent_preview (optional, fake-aware)
```
Errors return a hold-style result and increment `pipeline_failures_total`. Fail-safe behavior remains unchanged.

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

Unit (focused):
```
PYTHONPATH="$PWD" pytest -q -k "runtime_pipeline"
```

E2E smoke:
```
PYTHONPATH="$PWD" pytest -q tests/test_runtime_pipeline_e2e.py
```

Local staging canary (fake-mode, tracing + observability on):
```
PYTHONPATH="$PWD" \
BRAIN_FAKE_MODE=1 TRADE_ENGINE_FAKE_MODE=1 RUNTIME_ROUTER_FAKE_MODE=1 INTENT_PREVIEW_FAKE_MODE=1 \
INTENT_PREVIEW_ENABLED=1 RUNTIME_TRACING_ENABLED=1 RUNTIME_OBSERVABILITY_ENABLED=1 \
python - <<'PY'
from backend.worker.runtime_pipeline import run_decision_pipeline
resp = run_decision_pipeline({"instrument":"BTC-USD","snapshot":{},"signals":{}}, metrics_client=None, fake_mode=True)
print(resp)
assert resp["status"] == "success"
assert resp["meta"].get("trace_id")
PY
```
Expected: status `success`, `meta.trace_id` present, `router_result.meta.trace_id` present, counters increment in fake mode.
