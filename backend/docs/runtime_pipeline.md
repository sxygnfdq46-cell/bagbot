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

## Trace IDs
- On real paths, a single upstream `trace_id` (typically from ingest telemetry) is passed through brain → trade → router; the pipeline does not fabricate a new `trace_id` when one is present.
- Fake-mode behavior is unchanged and still fabricates deterministic trace ids for staged canaries.

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

## Signals Ingest Hook (M7-A)
- Flag: `SIGNALS_INGEST_ENABLED=1` enables ingest path. Default is off to preserve mock feed behavior.
- API: `backend.signals.ingest.ingest_frame(frame)` accepts a pre-built frame (instrument, timestamp, optional features/raw) and returns a normalized envelope.
- Behavior: `run_pipeline_canary` will prefer ingest when the flag is on; otherwise it falls back to the mock feed (`SIGNALS_MOCK_FEED_ENABLED`) path.
- Safety: no external network calls; fake modes still recommended for pipeline stages.
- Telemetry: ingest helpers expose lightweight spans/metrics; metrics client receives `signals.ingest.invocations_total{path, outcome}`.

## Signals Mock Feed Canary
- Purpose: run a deterministic signals snapshot through the pipeline in fake-mode (no network) for staging/CI safety.
- Env flags: `SIGNALS_MOCK_FEED_ENABLED=1` (or `SIGNALS_FAKE_MODE=1`) gates the mock feed run. Fake-mode flags from above remain recommended.
- Behavior: `run_pipeline_canary` calls the mock feed once, then executes the pipeline envelope in fake-mode. Logs include `trace_id` in `router_result.meta`.
- Local mock-feed canary example:
```
PYTHONPATH="$PWD" \
SIGNALS_MOCK_FEED_ENABLED=1 BRAIN_FAKE_MODE=1 TRADE_ENGINE_FAKE_MODE=1 RUNTIME_ROUTER_FAKE_MODE=1 INTENT_PREVIEW_FAKE_MODE=1 INTENT_PREVIEW_ENABLED=1 \
python - <<'PY'
import json
from backend.worker.runtime_pipeline import run_pipeline_canary

resp = run_pipeline_canary(fake_mode=True)
print(json.dumps(resp, indent=2, sort_keys=True))
assert resp.get("status") == "success"
assert resp.get("router_result", {}).get("meta", {}).get("trace_id")
print("mock feed canary ok")
PY
```

## Signals Ingest Canary (ingest enabled)
- Purpose: validate ingest hook + pipeline in fake-mode without external calls.
- Env flags: `SIGNALS_INGEST_ENABLED=1` plus fake-mode flags below.
- Local ingest canary example:
```
PYTHONPATH="$PWD" \
SIGNALS_INGEST_ENABLED=1 BRAIN_FAKE_MODE=1 TRADE_ENGINE_FAKE_MODE=1 RUNTIME_ROUTER_FAKE_MODE=1 INTENT_PREVIEW_FAKE_MODE=1 INTENT_PREVIEW_ENABLED=1 \
python - <<'PY'
import json
from backend.worker.runtime_pipeline import run_pipeline_canary

resp = run_pipeline_canary(fake_mode=True)
print(json.dumps(resp, indent=2, sort_keys=True))
assert resp.get("status") == "success"
assert resp.get("router_result", {}).get("meta", {}).get("trace_id")
print("ingest canary ok")
PY
```
