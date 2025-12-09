# Payments Adapter (Stripe)

- Adapter: `backend.payments.adapter.PaymentsClient`
- Modes: real (default) or fake (`PAYMENTS_FAKE_MODE=1`). Fake mode returns deterministic responses and never imports Stripe.
- ENV:
  - `STRIPE_SECRET_KEY`: API key (read lazily on first call, not at import)
  - `STRIPE_TIMEOUT_S`: request timeout seconds (default 3)
  - `PAYMENTS_FAKE_MODE`: set to `1/true` to enable fake mode
  - `PAYMENTS_FAKE_SCENARIO`: optional (`card_error`, `rate_limited`, `auth_error`, `network_error`) for test simulations
- Adapter behavior:
  - Accepts optional `request_id`; generates deterministic id if absent.
  - Normalizes errors to codes: `card_error`, `rate_limited`, `auth_error`, `network_error`, `unknown_error`.
  - No network or key usage at import; Stripe import occurs only when real mode is used.
- Testing guidance:
  - Use fake mode in CI and local tests.
  - Integration smoke: set `PAYMENTS_FAKE_MODE=1` and call `/api/payments/create-checkout-session`.
  - Fake scenarios can simulate card decline, rate limit, auth error, network error without real Stripe.

## Staging webhook verification (manual)
- Set env vars in staging: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYMENTS_FAKE_MODE=0`.
- Use Stripe CLI to forward events:
  - `stripe listen --forward-to https://<staging-host>/api/payments/webhook`
  - `stripe trigger checkout.session.completed`
- Expect HTTP 200 and log line: webhook received, processed, status updated. Check adapter metrics (payments_error_total) for zero errors.
- Troubleshooting: verify webhook secret, staging URL reachable, no firewall blocks, correct secret in env.
- If staging not run, label PR `needs-staging-verification` with this runbook.
