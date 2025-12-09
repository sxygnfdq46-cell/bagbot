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

## Contracts
- Normalized signal fields: `type`, `provider_id`, `strength`, `confidence`, `timestamp`, `metadata`.
- Fusion result fields: `fusion_score`, `direction`, `confidence`, `rationale[]`, `signals_used[]`.
- Decision envelope fields: `action`, `score`, `confidence`, `reasons[]`, `signals_used[]`.

## Explainability philosophy
- Deterministic contributions logged in `rationale` with weights, strengths, and confidences.
- No opaque randomness; same inputs yield the same outputs.
- Signals_used is preserved for auditability.

## Extensibility for future ML
- `FusionConfig` weight mapping can be replaced or extended with learned weights.
- Future ML scoring can plug in before `build_decision_envelope`, reusing the same envelope contract.
- Keep all new models pure and deterministic in testing mode; inject dependencies explicitly.

## Testing guidance
- Unit tests live in `backend/brain/tests/` for normalizer, fusion, decision envelope.
- Assert deterministic outputs and validation of defaults.
- Ensure imports perform no I/O or external calls.
