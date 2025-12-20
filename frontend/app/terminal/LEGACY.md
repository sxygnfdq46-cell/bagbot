# Legacy Terminal (V1) — Frozen

This directory contains the legacy Terminal UI (V1). It is frozen and slated for removal after Terminal V2 is complete and approved.

Do not modify or reuse these files:
- `app/terminal/page.tsx`
- All components under `components/terminal/` (icon rail, panels, bot bar, timeline, selectors, etc.)
- Any supporting assets referenced by the above

Guidelines:
- No refactors, no new features, no visual tweaks.
- Leave behavior intact for reference until explicit deletion is authorized.
- Terminal V2 work must not import from these files.
