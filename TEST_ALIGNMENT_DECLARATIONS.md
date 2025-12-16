# Pre-Test Alignment (Declarations Only)

## System Invariants
- Single market data source per session (`backend/brain/invariants.py::SINGLE_MARKET_DATA_SOURCE`)
- Learning gate always BLOCKED (`LEARNING_GATE_ALWAYS_BLOCKED`)
- Eval only runs under HISTORICAL source (`EVAL_ONLY_HISTORICAL`)
- Historical replay is deterministic (`HISTORICAL_REPLAY_DETERMINISTIC`)

## API Envelope Alignment
- `/api/brain/explain` and `/api/brain/eval` mirror the runtime pipeline envelopes and expose invariant flags in `meta`.
- These endpoints are read-only pass-through mirrors; no mutation or feature changes.

## Test Targets
- Replay control tests target backend replay logic (deterministic historical replay semantics).
- UI timing effects and the pulse/heartbeat visualization are out of scope for tests.
