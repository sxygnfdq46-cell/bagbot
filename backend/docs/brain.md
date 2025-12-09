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

### CLI snippet (fake mode)
```
PYTHONPATH="$PWD" BRAIN_FAKE_MODE=1 python - <<'PY'
from backend.brain.adapter import decide
print(decide({"demo": {"type": "momentum", "strength": 0.5, "confidence": 0.6}}, fake_mode=True))
PY
```

Note: Adapter is import-safe (no side effects on import); CI import guards must pass.
