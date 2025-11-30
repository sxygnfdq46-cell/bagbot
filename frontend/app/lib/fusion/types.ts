/**
 * Deep Execution Fusion Layer (DEFL) - Types
 * 
 * Final harmonization layer that fuses EXO and X-REACTOR decisions.
 * Resolves conflicts and ensures unified execution command.
 */

export type FusionCommand = 
  | "EXECUTE"           // Both layers agree - execute
  | "DELAY"             // Wait for better harmony
  | "CANCEL"            // Conflict detected - abort
  | "SCALE"             // Partial agreement - reduce size
  | "EMERGENCY_ABORT";  // Critical failure

export type OrderType = 
  | "MARKET" 
  | "LIMIT" 
  | "STOP" 
  | "STOP_LIMIT";

/**
 * Input from EXO (Execution Orchestrator)
 */
export interface EXODecision {
  command: "EXECUTE" | "WAIT" | "CANCEL" | "SCALE";
  confidence: number;
  targetSize: number;
  direction: "LONG" | "SHORT";
  reason: string[];
  riskScore?: number;
  timestamp: number;
}

/**
 * Input from X-REACTOR (Execution Reactor)
 */
export interface ReactorDecision {
  command: "EXECUTE" | "DELAY" | "CANCEL" | "SCALE" | "EMERGENCY_ABORT";
  delayMs: number;
  finalSize: number;
  orderType: OrderType;
  reason: string[];
  confidence: number;
  timestamp: number;
  
  // Diagnostic fields
  spreadBps?: number;
  latencyMs?: number;
  pressureScore?: number;
  volatilityScore?: number;
  reversalRisk?: number;
}

/**
 * Market snapshot for fusion context
 */
export interface MarketSnapshot {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume24h?: number;
  timestamp: number;
}

/**
 * Fusion context - combines all inputs
 */
export interface FusionContext {
  exoDecision: EXODecision;
  reactorDecision: ReactorDecision;
  marketSnapshot: MarketSnapshot;
  timestamp: number;
}

/**
 * Harmony metrics - measures agreement between layers
 */
export interface HarmonyMetrics {
  commandHarmony: number;      // 0-100: Do commands align?
  confidenceHarmony: number;   // 0-100: Do confidence levels align?
  sizeHarmony: number;         // 0-100: Do size recommendations align?
  timingHarmony: number;       // 0-100: Is timing aligned?
  overallHarmony: number;      // 0-100: Weighted average
  
  // Details
  hasConflict: boolean;
  conflictType?: "COMMAND" | "CONFIDENCE" | "SIZE" | "TIMING";
  conflictSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Fusion rule evaluation result
 */
export interface FusionRuleResult {
  ruleName: string;
  passed: boolean;
  blockExecution: boolean;
  forceCancel: boolean;
  suggestedCommand?: FusionCommand;
  harmonyAdjustment: number;   // -50 to +50 adjustment to harmony
  reason: string;
  priority: number;            // 1-10
}

/**
 * Final fused decision
 */
export interface FusionDecision {
  finalCommand: FusionCommand;
  finalSize: number;
  orderType: OrderType;
  harmonyScore: number;        // 0-100
  confidence: number;          // 0-100
  reason: string[];
  timestamp: number;
  
  // Fusion metrics
  metrics: {
    exoCommand: string;
    reactorCommand: string;
    harmonyMetrics: HarmonyMetrics;
    rulesApplied: number;
    rulesPassed: number;
    rulesFailed: number;
    executionTimeMs: number;
  };
  
  // Source decisions (for audit trail)
  sources: {
    exo: EXODecision;
    reactor: ReactorDecision;
  };
}

/**
 * Fusion state snapshot
 */
export interface FusionState {
  lastDecision: FusionDecision | null;
  totalDecisions: number;
  executedCount: number;
  delayedCount: number;
  cancelledCount: number;
  scaledCount: number;
  abortedCount: number;
  
  avgHarmony: number;
  avgConfidence: number;
  conflictRate: number;        // % of decisions with conflicts
  
  lastUpdate: number;
}

/**
 * Fusion configuration
 */
export interface FusionConfig {
  // Harmony thresholds
  minHarmonyForExecute: number;      // Min harmony to execute (0-100)
  minHarmonyForScale: number;        // Min harmony to scale (0-100)
  maxConflictSeverity: "LOW" | "MEDIUM" | "HIGH"; // Max allowed conflict
  
  // Confidence thresholds
  minFusedConfidence: number;        // Min confidence to proceed
  confidenceDiscrepancyMax: number;  // Max % difference between layers
  
  // Size thresholds
  maxSizeDiscrepancy: number;        // Max % difference in size recommendations
  
  // Timing
  maxDelayMs: number;                // Max delay to wait for harmony
  
  // Emergency
  emergencyAbortOnConflict: boolean; // Abort on critical conflicts
  
  // Weights for harmony calculation
  weights: {
    command: number;      // Weight for command alignment
    confidence: number;   // Weight for confidence alignment
    size: number;         // Weight for size alignment
    timing: number;       // Weight for timing alignment
  };
}

/**
 * Default fusion configuration
 */
export const DEFAULT_FUSION_CONFIG: FusionConfig = {
  // Harmony thresholds
  minHarmonyForExecute: 80,     // Need 80% harmony to execute
  minHarmonyForScale: 60,       // Need 60% harmony to scale
  maxConflictSeverity: "MEDIUM",
  
  // Confidence thresholds
  minFusedConfidence: 70,       // Need 70% confidence minimum
  confidenceDiscrepancyMax: 30, // Max 30% difference between layers
  
  // Size thresholds
  maxSizeDiscrepancy: 0.25,     // Max 25% size difference
  
  // Timing
  maxDelayMs: 500,              // Max 500ms delay
  
  // Emergency
  emergencyAbortOnConflict: true,
  
  // Weights
  weights: {
    command: 0.40,    // 40% weight on command alignment
    confidence: 0.30, // 30% weight on confidence alignment
    size: 0.20,       // 20% weight on size alignment
    timing: 0.10,     // 10% weight on timing alignment
  },
};

/**
 * Fusion error types
 */
export interface FusionError {
  type: "CONFLICT" | "TIMEOUT" | "INVALID_INPUT" | "SYSTEM_ERROR";
  message: string;
  severity: "WARNING" | "ERROR" | "CRITICAL";
  timestamp: number;
  context?: any;
}

/**
 * Performance log entry
 */
export interface FusionPerformanceLog {
  timestamp: number;
  executionTimeMs: number;
  harmonyScore: number;
  confidence: number;
  command: FusionCommand;
  hadConflict: boolean;
  rulesEvaluated: number;
}
