# Brain Multi-Provider Orchestrator

## Purpose
A deterministic, import-safe orchestrator that gathers signals from multiple simulated providers and selects the best decision. No network/FS/Redis/Stripe is touched on import; everything is pure and local. Runtime wiring will call `orchestrate_providers` later.

## API
```
from backend.brain.orchestrator import orchestrate_providers

result = orchestrate_providers(payload: dict, *, metrics_client=None, fake_mode: bool | None = None)
```

### Input
- `payload`: arbitrary dict to pass to providers.
- `metrics_client` (optional): object with `inc(name, labels=...)` or `increment(...)`.
- `fake_mode`: overrides env; otherwise respects `BRAIN_FAKE_MODE`.

### Output shape
```
{
  "action": str,            # e.g. "buy" | "hold" | "sell"
  "confidence": float,      # clamped 0..1
  "rationale": [str],
  "meta": {
    "signals_used": [provider_ids...],
    "failed_providers": [provider_ids...],
    "fake_mode": bool
  }
}
```

## Provider fusion logic
- Providers: `tradingview`, `indicators`, `brain`, `marketdata` (all simulated/deterministic).
- Each returns a normalized signal `{provider_id, action, confidence, strength, rationale}`.
- Selection: pick highest confidence; tie-break alphabetically by `provider_id` for determinism.
- Fallback: if all providers fail, return `hold` with rationale `no_providers_available` and list failures.

## Fake-mode behavior
- Controlled by `BRAIN_FAKE_MODE` env or `fake_mode=True` arg.
- Providers return canned deterministic signals; no external calls.
- Keeps import safety and CI determinism.

## Metrics (injected)
If `metrics_client` supplied:
- `brain_orchestrator_requests_total{outcome=success|failure}`
- `brain_orchestrator_provider_success_total{provider=...}`
- `brain_orchestrator_provider_failure_total{provider=...}`
- `brain_orchestrator_decision_total{action=...}`
- Adapter still emits `brain_decisions_total{action=...}` for compatibility

## Logging
- `orchestrator_start`: payload keys + fake mode toggle
- `orchestrator_success`: selected provider, signals used, failures, confidence, action, fake mode
- `orchestrator_no_providers`: warning when every provider fails
- Adapter emits `orchestrator_fallback` warning if the orchestrator import/call raises and it returns to local fusion

## Runtime integration (later)
- Runtime services can call `orchestrate_providers(payload, metrics_client=...)`.
- Keep `metrics_client` injectable (no globals).
- Respect fake mode for canaries/CI; real providers can be wired behind these functions without changing the selection API.

## Runtime wiring (shim)
- Env flag: `BRAIN_USE_ORCHESTRATOR=1` routes the brain adapter to `orchestrate_providers` before falling back to local fusion.
- Runner shim (`backend.worker.runner.get_brain_decision`) honors `BRAIN_USE_ORCHESTRATOR` and `BRAIN_FAKE_MODE`; imports stay lazy for safety.
- Payload: same shape used by `decide` today (dict of signals). Orchestrator normalizes internally.
- Metrics to watch when enabled: `brain_orchestrator_requests_total{outcome}`, `brain_orchestrator_provider_success_total`, `brain_orchestrator_provider_failure_total`, `brain_orchestrator_decision_total{action=...}`, plus existing `brain_decisions_total{action=...}` emitted by the adapter wrapper.
- Rollout guidance: enable `BRAIN_USE_ORCHESTRATOR` in staging first (fake mode allowed), verify metrics/decisions, then enable in production.
