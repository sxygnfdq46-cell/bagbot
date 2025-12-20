# BagBot Terminal v1 Readiness Freeze (STEP-35B)

This document defines the locked surface of BagBot Terminal v1. It records what exists, what must not regress, and what requires explicit approval to change. No code changes accompany this freeze.

## Terminal v1 Capability Inventory (locked)
- ✅ Single & split (2-pane) charts — locked
- ✅ Chart-owned state (instrument, timeframe, candle type) — locked
- ✅ Indicators, drawings, projections, compare — locked
- ✅ Replay / Review mode — locked
- ✅ On-chart bot reasoning overlays — locked
- ✅ Decision Timeline (read-only) — locked
- ✅ Bot controls with guardrails — locked
- ✅ Global instrument search — locked
- ✅ Snapshots (chart context only) — locked
- ❌ Out of scope for v1: anything beyond two panes, mobile-first, execution during replay, backend feature coupling, additional chart engines, dashboards/menus beyond terminal, alerts/notifications

## Non-negotiable invariants (must never be broken)
- One chart engine (`ChartCanvas`); no parallel engines
- Chart owns market state; terminal issues intent only
- No chart remounts on mode/layout changes; state continuity is preserved
- Replay is review-only; execution is disabled while in replay
- Bot logic/runtime is untouched by UI and chart interactions
- Panels overlay the chart; they never shrink or reflow the chart canvas
- Sidebar is hidden only on `/terminal`; `/charts` route remains canonical
- Split panes remain independent for state (instrument, timeframe, overlays)
- Decision Timeline is read-only; selections may sync replay cursor only
- Bot guardrails stay enforced (start locked in replay, state clarity retained)
- Fullscreen and overlays preserve chart dominance; badges unobtrusive and readable

## Forbidden changes without explicit approval
- Coupling backend/bot runtime directly to chart UI state
- Introducing multiple chart engines or replacing `ChartCanvas`
- Persisting replay state or adding execution capabilities during replay
- Expanding beyond two panes or changing chart dominance ratios
- Adding dashboards/menus that reposition terminal as a secondary surface
- Making mobile the primary or default surface
- Introducing timeline editing, filtering, or execution actions
- Adding persistent config that alters current non-persistent behaviors

## Known gaps (intentionally deferred)
- Multi-chart linking or synchronized cursors
- Strategy parameter editing from terminal
- Backtesting UX flows in terminal
- Broker execution UI (orders, positions management)
- Mobile-first or responsive re-layout beyond current support
- Alerts/notifications engine and routing

## Release readiness checklist (v1-safe gate)
- Build passes
- Lint passes
- No unused or dead terminal files introduced
- No duplicated chart logic; single `ChartCanvas` path intact
- `/terminal` functions without sidebar; `/charts` remains canonical
- Bot guardrails enforced; replay disables execution
- Split panes operate independently (state, overlays, compare)
- Decision Timeline remains read-only
- No backend or bot-logic changes required for terminal operation

## Declaration
BagBot Terminal v1 is complete, stable, and intentional. Any change that affects the capabilities or invariants above requires explicit approval and is considered post-v1 work (v1.1, v2, or experimental branch).
