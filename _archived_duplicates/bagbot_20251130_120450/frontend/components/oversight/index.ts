/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14: STRATEGIC OVERSIGHT LAYER - EXPORTS
 * ═══════════════════════════════════════════════════════════════════
 * Central export hub for all Level 14 oversight components.
 * 
 * MISSION: Pre-execution forecasting, analysis, and human approval gates
 * SAFETY PRINCIPLE: BagBot does NOT act - only analyzes and advises
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// COMPONENT EXPORTS
// ─────────────────────────────────────────────────────────────────

export { StrategicStateMonitor } from './StrategicStateMonitor';
export { MultiPathForecastEngine } from './MultiPathForecastEngine';
export { IntentClarificationMatrix } from './IntentClarificationMatrix';
export { RiskMapGenerator } from './RiskMapGenerator';
export { OversightRecommendationEngine } from './OversightRecommendationEngine';
export { PreExecutionAuditGate } from './PreExecutionAuditGate';
export { default as StrategicUI } from './StrategicUI';

// ─────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────

// Strategic State Monitor
export type {
  RiskLevel,
  StabilityZone,
  SystemHealthSnapshot,
  LoadMetrics,
  EmotionalMetrics,
  CongestionMetrics,
  DriftMetrics,
  FatigueMetrics,
  TrendProjection,
  InstabilitySignature,
  WarningMessage,
  MonitoringConfig
} from './StrategicStateMonitor';

// Multi-Path Forecast Engine
export type {
  ExecutionPath,
  PathOutcome,
  PathRisk,
  PathBlocker,
  ImpactGradient,
  SystemTemperature,
  StabilityCurve,
  ForecastScenario,
  ForecastContext
} from './MultiPathForecastEngine';

// Intent Clarification Matrix
export type {
  CommandIntent,
  ParsedCommand,
  Ambiguity,
  AmbiguityType,
  IntentConflict,
  ConflictType,
  IntentAlignment,
  ClarificationRequest,
  ClarificationQuestion,
  IntentValidation,
  CommandHistoryEntry
} from './IntentClarificationMatrix';

// Risk Map Generator
export type {
  RiskZone,
  HazardType,
  RiskCoordinate,
  RiskPoint,
  Hazard,
  Bottleneck,
  InstabilityPocket,
  ResourceStrain,
  ToneHarmonicMismatch,
  RiskMap,
  RiskAssessment
} from './RiskMapGenerator';

// Oversight Recommendation Engine
export type {
  RecommendationPriority,
  RecommendationType,
  Recommendation,
  ExecutionPlan,
  Alternative,
  RedundantStep,
  SystematicImpact,
  EmotionalImpact,
  OversightReport
} from './OversightRecommendationEngine';

// Pre-Execution Audit Gate
export type {
  ApprovalStatus,
  ApprovalDecision,
  ApprovalRequest,
  AuditEntry,
  AuditHistory,
  GateConfiguration
} from './PreExecutionAuditGate';

// Strategic UI
export type {
  StrategicUIProps
} from './StrategicUI';

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

/**
 * LEVEL 14 Safety Configuration
 * CRITICAL: These settings MUST be enforced
 */
export const LEVEL_14_SAFETY = {
  // Core safety principles
  autonomousExecution: false,
  requiresApproval: true,
  humanInTheLoop: true,
  
  // Analysis only - no action
  canAnalyze: true,
  canForecast: true,
  canRecommend: true,
  canExecute: false,
  
  // Approval timeouts
  defaultApprovalTimeout: 3600000, // 1 hour
  maxApprovalTimeout: 86400000,    // 24 hours
  
  // Audit requirements
  logAllDecisions: true,
  requireAuditTrail: true,
  
  // Risk thresholds
  forbiddenZoneBlocking: true,
  criticalWarningBlocking: true,
  boundaryViolationBlocking: true
} as const;

/**
 * LEVEL 14 Version Information
 */
export const LEVEL_14_VERSION = {
  major: 14,
  minor: 0,
  patch: 0,
  codename: 'Strategic Oversight',
  buildDate: new Date('2025-01-19').toISOString()
} as const;

/**
 * LEVEL 14 Component Status
 */
export const LEVEL_14_COMPONENTS = {
  monitor: 'StrategicStateMonitor',
  forecast: 'MultiPathForecastEngine',
  intent: 'IntentClarificationMatrix',
  risk: 'RiskMapGenerator',
  recommend: 'OversightRecommendationEngine',
  gate: 'PreExecutionAuditGate',
  ui: 'StrategicUI'
} as const;

/**
 * LEVEL 14 Capabilities
 */
export const LEVEL_14_CAPABILITIES = {
  // What Level 14 CAN do
  capabilities: [
    'Real-time system health monitoring',
    'Multi-path execution forecasting',
    'Command intent clarification',
    '4D risk mapping',
    'Alternative path generation',
    'Human-readable recommendations',
    'Pre-execution audit trails',
    'Approval request management'
  ],
  
  // What Level 14 CANNOT do (safety guarantees)
  restrictions: [
    'Cannot execute commands autonomously',
    'Cannot override human decisions',
    'Cannot bypass approval gates',
    'Cannot modify audit logs',
    'Cannot suppress critical warnings'
  ],
  
  // Integration points
  integrations: [
    'Level 13: Multi-flow orchestration',
    'Level 12: Self-modification system',
    'Level 10: Event system',
    'Level 8: Emotional regulation'
  ]
} as const;

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Validate that Level 14 safety constraints are enforced
 */
export function validateLevel14Safety(): boolean {
  const violations: string[] = [];
  
  if (LEVEL_14_SAFETY.autonomousExecution) {
    violations.push('CRITICAL: Autonomous execution must be disabled');
  }
  
  if (!LEVEL_14_SAFETY.requiresApproval) {
    violations.push('CRITICAL: Approval requirement must be enabled');
  }
  
  if (!LEVEL_14_SAFETY.humanInTheLoop) {
    violations.push('CRITICAL: Human-in-the-loop must be enabled');
  }
  
  if (violations.length > 0) {
    console.error('[LEVEL 14 SAFETY] Violations detected:', violations);
    return false;
  }
  
  return true;
}

/**
 * Get Level 14 system information
 */
export function getLevel14Info() {
  return {
    version: LEVEL_14_VERSION,
    safety: LEVEL_14_SAFETY,
    components: LEVEL_14_COMPONENTS,
    capabilities: LEVEL_14_CAPABILITIES,
    safetyValidation: validateLevel14Safety()
  };
}
