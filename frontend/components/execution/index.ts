/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 13: MULTI-FLOW ORCHESTRATION - EXECUTION COMPONENTS
 * ═══════════════════════════════════════════════════════════════════
 * Central export hub for all Level 13 multi-flow execution components
 * 
 * Components Included:
 * - Core Engines (13.0-13.2): Task graph, flow planning, approval gates
 * - Dimensional Layers (13.3): Time, Scope, Impact, Mode dimensions
 * - Flow Resolvers (13.4): Compatibility, conflicts, ordering
 * - Visualization (13.5): Multi-flow hub UI
 * 
 * Safety Status: ✓ All components enforce manual approval
 * Execution Status: ✓ No autonomous actions
 * Audit Status: ✓ Full trail maintained
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// LEVEL 13.0-13.2: CORE ENGINES
// ─────────────────────────────────────────────────────────────────

export { TaskNode } from './TaskNode';

export { TaskGraphEngine } from './TaskGraphEngine';
export type { TaskGraph } from './TaskGraphEngine';

export { SequentialFlowPlanner } from './SequentialFlowPlanner';

export { ExecutionApprovalGate } from './ExecutionApprovalGate';
export type {
  ApprovalRequest,
  ApprovalAuditLog
} from './ExecutionApprovalGate';

// ─────────────────────────────────────────────────────────────────
// LEVEL 13.3: DIMENSIONAL LAYERS
// ─────────────────────────────────────────────────────────────────

export { TimeDimensionLayer } from './TimeDimensionLayer';

export { ScopeDimensionLayer } from './ScopeDimensionLayer';

export { ImpactDimensionLayer } from './ImpactDimensionLayer';

export { ModeDimensionLayer } from './ModeDimensionLayer';

// ─────────────────────────────────────────────────────────────────
// LEVEL 13.4: FLOW RESOLVERS
// ─────────────────────────────────────────────────────────────────

export { DimensionalExecutionPathing } from './DimensionalExecutionPathing';

export { ConditionalFlowResolver } from './ConditionalFlowResolver';
export type { ConditionalBranch } from './ConditionalFlowResolver';

export { ChainCompatibilityMatrix } from './ChainCompatibilityMatrix';
export type { CompatibilityScore } from './ChainCompatibilityMatrix';

// ─────────────────────────────────────────────────────────────────
// LEVEL 13.5: VISUALIZATION LAYER
// ─────────────────────────────────────────────────────────────────

export { default as MultiFlowHub } from './MultiFlowHub';

// ─────────────────────────────────────────────────────────────────
// UTILITY EXPORTS
// ─────────────────────────────────────────────────────────────────

/**
 * Safety verification for all Level 13 operations
 * Ensures no autonomous execution occurs
 */
export const LEVEL_13_SAFETY = {
  autonomousExecution: false,
  requiresApproval: true,
  auditTrail: true,
  humanControl: true,
  maxApprovalTimeout: 300000, // 5 minutes
} as const;

/**
 * Version information
 */
export const LEVEL_13_VERSION = {
  major: 13,
  minor: 5,
  patch: 0,
  name: "Multi-Flow Orchestration System",
  status: "Complete"
} as const;
