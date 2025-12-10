# Execution Router Runtime Shim

Lightweight shim to route execution envelopes without loading heavy adapters on import. Provides fake-mode for local/dev safety and fails safe to a held response on adapter errors.

## Behavior
- Lazy-loads adapter chooser `backend.worker.adapters.execution.choose_adapter_for_instrument` only inside `route_execution_request`.
- Fake mode returns deterministic `{status: success, order_id, fill_price}` without touching adapters.
- Adapter path returns success only on dict responses; otherwise falls back to held.
- Errors log a warning and return a held response to avoid crashes.

## Fake Mode
- Enable with env `EXECUTION_ROUTER_FAKE_MODE=1` or by passing `fake_mode=True` to `route_execution_request`.
- Deterministic hash seeds `order_id` and `fill_price` so tests stay stable.
- For limit orders with `price`, the `fill_price` echoes that price.

## Metrics
- Uses a tolerant `metrics_client` that supports `.inc` or `.increment`.
- Emits:
  - `execution_requests_total{outcome: success|held|failed}`
  - `execution_success_total{reason: fake_mode|adapter}`
  - `execution_failures_total{reason: adapter-not-available|adapter-invalid|adapter-invalid-response|adapter-error}`

## Failure Handling
- Missing/invalid adapters → held with reason `adapter-not-available` or `adapter-invalid`.
- Non-dict adapter responses → held `adapter-invalid-response`.
- Exceptions → held `adapter-error` and a warning log.

## Import Safety
- Designed to be import-safe with only stdlib dependencies.
- CI job `execution-router-import-check` imports module under fake mode to guard regressions.
