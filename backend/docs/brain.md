# BagBot Brain (Phase 1)

## Overview
The BagBot Brain converts raw provider signals into normalized representations, fuses them deterministically, and produces a decision envelope for downstream consumers. This phase is pure logic only: no network calls, no execution, no randomness.

## Flow (text diagram)
```
raw signals -> Signal Normalizer -> normalized signals -> Fusion Reactor -> fused result -> Decision Envelope Builder -> decision object
```

## Components
- **Signal Normalizer** (`backend.brain.utils.normalizer.normalize_signal`)
  - Pure function; no side effects.
  - Validates and defaults fields: type, provider_id, strength, confidence (clamped 0..1), timestamp, metadata (dict).
- **Fusion Reactor** (`backend.brain.utils.fusion.fuse_signals`)
  - Deterministic scoring using configurable weights and neutral threshold.
  - Outputs `fusion_score`, `direction` (long/short/neutral), `confidence`, and rationale list.
  - No external calls or randomness.
- **Decision Envelope Builder** (`backend.brain.utils.decision.build_decision_envelope`)
  - Maps fused result to action (buy/sell/hold), score, confidence, reasons, and signals_used list.
  - Stable and validated; no side effects.

## Adapter (integration surface)
- Function: `backend.brain.adapter.decide(signals: dict, config: dict = None, *, metrics_client=None, fake_mode: bool = False) -> dict`
- Behavior: pure orchestrator; no import-time side effects; no network or filesystem access.
- Return keys: `action` (str), `confidence` (float), `rationale` (list[str]), `meta` (dict with `signals_used`). Defaults to safe values on edge cases.
- Fake mode: set `fake_mode=True` to get deterministic canned output for tests/CLI.
- Metrics: pass an injected `metrics_client` with `inc(name, labels={...})`; the adapter increments `brain_decisions_total{action=...}`.

## Runtime shim (runner)
- Location: `backend/worker/runner.py` with `get_brain_decision(...)`.
- Behavior: thin, import-safe wrapper that lazily imports `backend.brain.adapter.decide` and returns its decision.
- Env flags: `BRAIN_FAKE_MODE=1` forces fake-mode decisions; otherwise, adapter runs normally.
- Metrics: pass an injected `metrics_client` (supports `inc(name, labels=...)`); increments `brain_decisions_total{action=...}` without creating a global registry.

### Smoke usage
```bash
PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python - <<'PY'
from backend.worker.runner import get_brain_decision

decision = get_brain_decision({"demo": {"type": "momentum", "strength": 0.4}})
print(decision)
PY
```

### Tests to run locally
- Import guards (no side effects):
  - `PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python -c "import backend.brain.adapter"`
  - `PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python -c "import backend.worker.runner"`
- Runtime smoke + unit slice: `pytest -q -k "brain and runtime"`
- Adapter slice (existing): `pytest -q backend/brain/tests -k adapter`

### CLI snippet (fake mode)
```
PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python - <<'PY'
from backend.brain.adapter import decide
print(decide({"demo": {"type": "momentum", "strength": 0.5, "confidence": 0.6}}, fake_mode=True))
PY
```

## E2E validation & canary
- Quick import guard: `PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python -c "import backend.brain.adapter; import backend.worker.runner"`
- Fast e2e runtime tests (fake mode): `PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 pytest -q backend/brain/tests -k e2e`
- Worker smoke path: `PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 pytest -q backend/worker/tests -k brain_integration`
- Metric to watch: `brain_decisions_total{action=...}` increments per decision; inject a metrics client with `inc(name, labels=...)` for tests and local runs.
- `BRAIN_FAKE_MODE=1` keeps imports side-effect free and yields deterministic decisions for CI canaries.

## Brain WebSocket (`/ws/brain`)
- Auth: JWT via query param `token` or `Authorization: Bearer <token>`; handshake rejects with 4401 if missing/invalid.
- Handshake: on connect sends `{ "type": "brain-online", "detail": "ready" }` after registering the connection.
- Request payload: `{ "request_id": "uuid", "market_snapshot": { ... } }` where `market_snapshot` is a dict; missing/invalid payloads return `{ "type": "brain-error", "detail": "invalid payload" }`.
- Routing: snapshot is normalized into a single signal and passed to `backend.worker.runner.get_brain_decision` (honors `BRAIN_FAKE_MODE`).
- Response: `{ "type": "brain-decision", "request_id": "uuid", "action": str, "confidence": float, "reason": str, "meta": {...} }`.
- Metrics: counters increment for connect/disconnect and decisions (via the adapter’s `brain_decisions_total{action=...}` path and a WebSocket-local tally).

Note: Adapter is import-safe (no side effects on import); CI import guards must pass.
