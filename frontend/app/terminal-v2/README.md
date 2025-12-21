# Terminal V2 Structural Contract (Phase 4 Freeze)

Status: Phase 4 is frozen. Do not change layout, state wiring, or structural rules without an approved follow-up phase.

## Core Contract
- Root is a 100vh flex column (`width: 100vw`, `overflow: hidden`).
- Fixed heights: top strip 56px; bottom strip 48px.
- Workspace is the only flex-grow region (`flex: 1 1 auto`) and is `position: relative`.
- Left dock overlays the workspace at 64px width; right panel overlays at 320px; both are absolutely positioned and must not consume layout width.
- Chart workspace is absolutely inset to the workspace and uses a grid for panes; gap is 0.
- Fullscreen toggles visibility/pointer-events of top/dock/right only; bottom strip always remains visible and interactive.
- Pane layouts: `single` → 1 pane, `double` → 2 panes (1 row, 2 columns), `quad` → 4 panes (2x2). Pane IDs are stable (`pane-1..4`).
- One pane is always active; layout changes must not remount the workspace. Active pane falls back to the first valid pane if the current active pane is removed by a layout change.

## Theme Tokens (Phase 5.1)
- Themes apply only to `/terminal-v2`; defaults to `noir`, toggle to `light`.
- Noir: near-black base `#0b0d10`, chrome `#1b1f26`, surface `#14171c`, text `#e9ecf2`, muted text `rgba(233,236,242,0.72)`, accent `#7ac4ff` (not yet used).
- Light: off-white base `#f4f2ed`, chrome `#dfdbd2`, surface `#ebe7df`, text `#1f262f`, muted text `rgba(31,38,47,0.70)`, accent `#3366cc` (not yet used).
- Tokens are mirrors in hierarchy; no gradients, shadows, or spacing changes; chart area stays unstyled/blank.

## Chrome Styling (Phase 5.2)
- Applied tone-only styling to top strip, left dock, right panel shell, and bottom control plane using theme tokens; chart workspace remains visually untouched.
- Top strip reads as status bar (muted text, chrome background), with theme indicator only.
- Left dock is neutral with subtle primary selection tone; icon placeholders only; no glow/borders.
- Right panel uses lifted surface tone with muted copy for inspection context; no borders/shadows.
- Bottom plane uses console-like text weight; controls are text-forward (borderless, transparent backgrounds).
- No gradients, shadows, animations, or layout/spacing shifts; fullscreen behavior unchanged.

## Chrome Affordances (Phase 5.3)
- Added scoped, token-based affordances (hover/active/disabled/focus) to chrome-only controls via `data-kind`/`data-state` and root `data-terminal-v2` scoping.
- Top strip commands: session toggle (active/default) and safe mode (disabled) show tone/opacity changes; theme toggle remains muted.
- Left dock items include active selection, hover tone, and a disabled example (`Alerts`); focus-visible uses a restrained outline.
- Right panel includes pin/close affordances with tone shifts; panel body unchanged.
- Bottom controls show active layout/fullscreen states; hover/active use surface/chrome tones; disabled style is available though not used here.
- No chart/pane styling, no spacing or layout changes, no glow/shadow/animation.

## Market Structure Layer (Phase 6.1)
- Added pane-local chart engine using layered canvas (single canvas with dedicated price and volume regions) per pane; no shared state between panes.
- Renders time/price axes, candles, volume, and a minimal grid; uses theme tokens for tones; chart fills available pane and resizes via `ResizeObserver` + DPR scaling.
- Deterministic data: seeded historical bars plus steady append of synthetic live bars at fixed interval, ordered by time; capped history length to maintain performance.
- No bot decisions, overlays, indicators, replay cursor, or compare; DOM labels limited to axes text rendered on canvas.
- Fullscreen and multi-pane continue to work; each pane redraws on resize without layout drift.

## Execution & Event Layer (Phase 6.2)
- Added an overlay canvas per pane for execution events (entry/exit/stop/target/trade) above price/volume; markers anchored to time/price only.
- Deterministic mock event set derived from visible bars; no backend wiring or mutation; pane-local only.
- Interaction rules: hover takes precedence over candles; shows small DOM tooltip (type/time/price); click selects marker (visual emphasis only); no drag/edit/delete.
- Styling: token-based muted markers with subtle highlight on hover/selection; no glow, animation, or TradingView-style flags.
- No bot reasoning/confidence overlays, no replay coupling, no indicators; fullscreen/multi-pane behavior unchanged.

## Must Never Change Without Explicit Approval
- No chart canvas, syncing, bot logic, or visuals in this file.
- No max-widths, centering, padding creep, or resizing of the overall workspace.
- Left/right remain overlays (not taking space); chart surface stays dominant and full-bleed inside the workspace.
- Fullscreen behavior: hide top/dock/right only; bottom stays.
- Pane structure and IDs remain deterministic; layout switches do not recreate the workspace container.

## Future Attachment Points
- Theme/styling: surface-level styles can be added later; preserve structure and dimensions.
- Chart engine: mounts inside each pane placeholder; must respect active-pane state for routed inputs/tools.
- Panels/docks: tools attach inside the left dock; contextual modules attach inside the right panel; bottom strip hosts controls (including layout/fullscreen toggles and future transports).
