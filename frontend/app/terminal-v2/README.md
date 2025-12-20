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
