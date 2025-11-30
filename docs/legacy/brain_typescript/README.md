# Orphaned Brain TypeScript Files

**Status:** Archived during Phase 2 repository reorganization (Nov 30, 2025)

## Context
These 14 TypeScript files were located in `/brain/` but were not imported or used by the frontend application. They appear to be legacy or experimental brain architecture code that was never integrated.

## Files Archived
- `integration/SystemFusionBridge.ts`
- `execution/ExecutionBrain.ts`
- `execution/AdaptiveExecutionFeedback.ts`
- `execution/ExecutionOrchestrator.ts`
- `reality/AntiOverfittingGuardian.ts`
- `reality/TruthReconciliationEngine.ts`
- `reality/RealityDivergenceScanner.ts`
- `reality/CorrectedRealityProfile.ts`
- `linkage/SystemMap.ts`
- `strategy/MarketStorylineEngine.ts`
- `strategy/OpportunityScanner.ts`
- `strategy/TradeTrigger.ts`
- `strategy/StrategicStateMachine.ts`
- `strategy/DecisionScorer.ts`

## Analysis
A grep search confirmed these files had zero imports in the frontend codebase:
```bash
grep -r "from brain\." --include="*.ts" --include="*.tsx" frontend/
# Result: No matches found
```

## Decision Rationale
Rather than delete potentially valuable code, these files were archived for future reference. They represent advanced trading brain concepts that may be useful for:
1. Future feature development
2. Algorithm research and development
3. Strategy evolution planning

## Action Required
Review these files to determine if they should be:
1. **Integrated into frontend** - If functionality is needed and well-designed
2. **Converted to Python** - Integrated into `worker/brain/` as Python modules
3. **Permanently deleted** - If truly deprecated and outdated
4. **Remain archived** - Keep as reference material

## Restoration
These files can be restored from:
- This archive directory
- Git history on branch `THE_BAGBOT`
- Pre-migration backup at `/archives/2025_phase2_pre_migration_backup/brain/`

## Migration Context
- **Migration Date:** November 30, 2025
- **Branch:** THE_BAGBOT
- **Phase:** Phase 2 - Step 3E (Handle Orphaned Brain TypeScript Files)
- **Original Location:** `/brain/` (root level after flattening from `/bagbot/bagbot/brain/`)
- **New Location:** `/docs/legacy/brain_typescript/`
