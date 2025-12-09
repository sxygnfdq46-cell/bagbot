# Logging and Metrics

## Logging helper
- Module: `backend.utils.logging`
- Functions: `log_event(logger, message, request_id=None, route=None, action=None, extra=None)`
- Behaviors:
  - No global configuration at import.
  - Builds structured event dict with keys: `message`, `request_id`, `route`, `action`, optional `extra` (redacted).
  - Redacts obvious secrets/tokens in `extra` (token, secret, password, authorization, api_key, auth).
  - Attaches the event to log record as `record.event` for capture in tests.
- Usage:
  - Call inside handlers with an existing `logging.getLogger(__name__)` instance.
  - Pass `request.headers.get("X-Request-ID")` when available; include a concise `action` label.
  - Avoid logging PII; pass only non-sensitive context.

## Metrics helper
- Module: `backend.utils.metrics`
- Class: `MetricsClient(registry=None)`
- Features:
  - Lazy registry creation; if `prometheus_client` is present and `PROMETHEUS_MULTIPROC_DIR` is set, uses multiprocess collector.
  - Provides `counter(name)`, `gauge(name)`, and convenience methods `inc_counter`, `inc_gauge`, `dec_gauge`, `set_gauge`.
  - Stub implementations exist when Prometheus is unavailable; registry is injectable for tests.
- Standard counters/gauges:
  - `admin_pause_total`, `admin_resume_total`
  - `ws_connections_active` (gauge), `ws_disconnects_total`
  - `scheduler_cycles_total`

## Integration points
- Admin routes: structured logs on status/pause/resume/force_resume; metrics increment for pause/resume.
- Scheduler: structured logs on cycle start/complete; increments `scheduler_cycles_total`.
- WebSockets (dashboard, brain): structured connect/disconnect logs; gauges for active connections; counter for disconnects.
- Payments: only non-sensitive high-level events should be logged; avoid secrets.

## Testing guidance
- Logging: capture `record.event` via a custom handler; assert `route`, `action`, `request_id`, and redaction behavior.
- Metrics: inject `MetricsClient(registry=None)` in tests to get stub counters/gauges; assert `.value` changes after increments.
- Mocking: pass a fake or stub registry to `MetricsClient(registry=fake_registry)` if you need to capture Prometheus constructs.

