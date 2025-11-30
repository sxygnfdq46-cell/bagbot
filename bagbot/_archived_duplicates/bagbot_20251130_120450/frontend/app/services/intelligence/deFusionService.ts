/**
 * Deep Execution Fusion Service - React Integration
 * 
 * Service layer for integrating DEFL with React components.
 * Manages fusion lifecycle, state tracking, and event notifications.
 */

import { getFusion, resetFusion } from '@/app/lib/fusion/DeepExecutionFusion';
import type {
  FusionDecision,
  FusionContext,
  FusionConfig,
  FusionState,
  EXODecision,
  ReactorDecision,
  MarketSnapshot,
  HarmonyMetrics,
  FusionRuleResult,
} from '@/app/lib/fusion/types';

import {
  addFusionDecision,
  addPerformanceLog,
  addError,
  getFusionHistory,
  getPerformanceLogs,
  getErrors,
  clearHistory,
} from '@/app/state/executionFusionState';

/**
 * Event listeners for fusion events
 */
type FusionEventListener = (decision: FusionDecision) => void;
type StateEventListener = (state: FusionState) => void;

const executeListeners: Set<FusionEventListener> = new Set();
const delayListeners: Set<FusionEventListener> = new Set();
const cancelListeners: Set<FusionEventListener> = new Set();
const scaleListeners: Set<FusionEventListener> = new Set();
const emergencyListeners: Set<FusionEventListener> = new Set();
const stateListeners: Set<StateEventListener> = new Set();

/**
 * Initialize fusion layer
 */
export function initFusion(config?: Partial<FusionConfig>): void {
  const fusion = getFusion(config);
  console.log('[DEFL Service] Deep Execution Fusion Layer initialized', {
    config,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Run fusion and produce final unified decision
 * 
 * @param exoDecision - Decision from EXO (Execution Orchestrator)
 * @param reactorDecision - Decision from X-REACTOR
 * @param marketSnapshot - Current market state
 * @returns Final fused decision
 */
export function runFusion(
  exoDecision: EXODecision,
  reactorDecision: ReactorDecision,
  marketSnapshot: MarketSnapshot
): FusionDecision {
  const fusion = getFusion();
  const startTime = performance.now();
  
  try {
    // Load context
    fusion.load(exoDecision, reactorDecision, marketSnapshot);
    
    // Run fusion
    const decision = fusion.fuse();
    
    // Update execution time
    decision.metrics.executionTimeMs = performance.now() - startTime;
    
    // Store in global state
    addFusionDecision(decision);
    
    // Log performance
    addPerformanceLog({
      timestamp: decision.timestamp,
      executionTimeMs: decision.metrics.executionTimeMs,
      harmonyScore: decision.harmonyScore,
      confidence: decision.confidence,
      command: decision.finalCommand,
      hadConflict: decision.metrics.harmonyMetrics.hasConflict,
      rulesEvaluated: decision.metrics.rulesApplied,
    });
    
    // Emit events
    emitFusionEvents(decision);
    
    // Emit state update
    const state = fusion.getFusionState();
    stateListeners.forEach(listener => listener(state));
    
    console.log('[DEFL Service] Fusion complete:', {
      command: decision.finalCommand,
      harmony: decision.harmonyScore,
      confidence: decision.confidence,
      finalSize: decision.finalSize,
      executionTime: decision.metrics.executionTimeMs.toFixed(2) + 'ms',
    });
    
    return decision;
  } catch (error) {
    const err = error as Error;
    console.error('[DEFL Service] Fusion error:', err);
    
    // Log error
    addError({
      type: "SYSTEM_ERROR",
      message: err.message,
      severity: "CRITICAL",
      timestamp: Date.now(),
      context: { exoDecision, reactorDecision, marketSnapshot },
    });
    
    // Rethrow
    throw error;
  }
}

/**
 * Emit fusion decision events
 */
function emitFusionEvents(decision: FusionDecision): void {
  switch (decision.finalCommand) {
    case "EXECUTE":
      executeListeners.forEach(listener => listener(decision));
      break;
    case "DELAY":
      delayListeners.forEach(listener => listener(decision));
      break;
    case "CANCEL":
      cancelListeners.forEach(listener => listener(decision));
      break;
    case "SCALE":
      scaleListeners.forEach(listener => listener(decision));
      break;
    case "EMERGENCY_ABORT":
      emergencyListeners.forEach(listener => listener(decision));
      break;
  }
}

/**
 * Get current fusion context and state
 */
export function getFusionContext(): {
  state: FusionState;
  lastDecision: FusionDecision | null;
  history: FusionDecision[];
  performanceLogs: any[];
  errors: any[];
  diagnostics: ReturnType<typeof getFusion>["getDiagnostics"];
} {
  const fusion = getFusion();
  const state = fusion.getFusionState();
  const diagnostics = fusion.getDiagnostics();
  const history = getFusionHistory();
  const performanceLogs = getPerformanceLogs();
  const errors = getErrors();
  
  return {
    state,
    lastDecision: state.lastDecision,
    history,
    performanceLogs,
    errors,
    diagnostics,
  };
}

/**
 * Get fusion state
 */
export function getFusionState(): FusionState {
  const fusion = getFusion();
  return fusion.getFusionState();
}

/**
 * Get fusion diagnostics
 */
export function getFusionDiagnostics(): {
  context: FusionContext | null;
  harmony: HarmonyMetrics | null;
  rules: FusionRuleResult[];
  ruleAggregation: any;
} {
  const fusion = getFusion();
  return fusion.getDiagnostics();
}

/**
 * Get fusion history from global state
 */
export function getFusionDecisionHistory(): FusionDecision[] {
  return getFusionHistory();
}

/**
 * Update fusion configuration
 */
export function updateFusionConfig(config: Partial<FusionConfig>): void {
  const fusion = getFusion();
  fusion.updateConfig(config);
  console.log('[DEFL Service] Configuration updated', config);
}

/**
 * Reset fusion state
 */
export function resetFusionState(): void {
  const fusion = getFusion();
  fusion.resetState();
  clearHistory();
  console.log('[DEFL Service] State reset');
}

/**
 * Reset fusion instance (for testing)
 */
export function resetFusionInstance(): void {
  resetFusion();
  clearHistory();
  console.log('[DEFL Service] Instance reset');
}

// ============================================================================
// Event Listener Registration
// ============================================================================

/**
 * Register listener for EXECUTE decisions
 */
export function onFusionExecute(listener: FusionEventListener): () => void {
  executeListeners.add(listener);
  return () => executeListeners.delete(listener);
}

/**
 * Register listener for DELAY decisions
 */
export function onFusionDelay(listener: FusionEventListener): () => void {
  delayListeners.add(listener);
  return () => delayListeners.delete(listener);
}

/**
 * Register listener for CANCEL decisions
 */
export function onFusionCancel(listener: FusionEventListener): () => void {
  cancelListeners.add(listener);
  return () => cancelListeners.delete(listener);
}

/**
 * Register listener for SCALE decisions
 */
export function onFusionScale(listener: FusionEventListener): () => void {
  scaleListeners.add(listener);
  return () => scaleListeners.delete(listener);
}

/**
 * Register listener for EMERGENCY_ABORT decisions
 */
export function onFusionEmergencyAbort(listener: FusionEventListener): () => void {
  emergencyListeners.add(listener);
  return () => emergencyListeners.delete(listener);
}

/**
 * Register listener for state updates
 */
export function onFusionStateUpdate(listener: StateEventListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

// ============================================================================
// Auto-Evaluation from X-REACTOR
// ============================================================================

/**
 * Auto-evaluate fusion when X-REACTOR decision is received
 * Useful for chaining X-REACTOR → DEFL automatically
 */
export function autoFuseFromReactor(
  exoDecision: EXODecision,
  reactorDecision: ReactorDecision,
  marketSnapshot: MarketSnapshot
): FusionDecision {
  console.log('[DEFL Service] Auto-fusing from X-REACTOR decision', {
    exoCommand: exoDecision.command,
    reactorCommand: reactorDecision.command,
  });
  
  return runFusion(exoDecision, reactorDecision, marketSnapshot);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if fusion approved execution
 */
export function shouldExecute(decision: FusionDecision): boolean {
  return decision.finalCommand === "EXECUTE" && decision.confidence >= 70;
}

/**
 * Check if fusion suggests delay
 */
export function shouldDelay(decision: FusionDecision): boolean {
  return decision.finalCommand === "DELAY";
}

/**
 * Check if fusion cancelled execution
 */
export function shouldCancel(decision: FusionDecision): boolean {
  return decision.finalCommand === "CANCEL" || decision.finalCommand === "EMERGENCY_ABORT";
}

/**
 * Check if fusion suggests scaling
 */
export function shouldScale(decision: FusionDecision): boolean {
  return decision.finalCommand === "SCALE" && decision.finalSize > 0;
}

/**
 * Get human-readable fusion summary
 */
export function getFusionSummary(decision: FusionDecision): string {
  const lines = [
    '=== DEEP EXECUTION FUSION ===',
    `Command: ${decision.finalCommand}`,
    `Harmony Score: ${decision.harmonyScore}%`,
    `Confidence: ${decision.confidence}%`,
    `Final Size: ${decision.finalSize}`,
    `Order Type: ${decision.orderType}`,
    '',
    '--- Harmony Metrics ---',
    `Command Harmony: ${decision.metrics.harmonyMetrics.commandHarmony.toFixed(1)}%`,
    `Confidence Harmony: ${decision.metrics.harmonyMetrics.confidenceHarmony.toFixed(1)}%`,
    `Size Harmony: ${decision.metrics.harmonyMetrics.sizeHarmony.toFixed(1)}%`,
    `Timing Harmony: ${decision.metrics.harmonyMetrics.timingHarmony.toFixed(1)}%`,
    '',
    '--- Source Decisions ---',
    `EXO: ${decision.metrics.exoCommand} (conf: ${decision.sources.exo.confidence}%)`,
    `Reactor: ${decision.metrics.reactorCommand} (conf: ${decision.sources.reactor.confidence}%)`,
    '',
    '--- Rules ---',
    `Applied: ${decision.metrics.rulesApplied}`,
    `Passed: ${decision.metrics.rulesPassed}`,
    `Failed: ${decision.metrics.rulesFailed}`,
    '',
    '--- Reasons ---',
  ];
  
  decision.reason.forEach(r => lines.push(`  ${r}`));
  
  if (decision.metrics.harmonyMetrics.hasConflict) {
    lines.push('');
    lines.push('⚠️  CONFLICT DETECTED');
    lines.push(`Type: ${decision.metrics.harmonyMetrics.conflictType}`);
    lines.push(`Severity: ${decision.metrics.harmonyMetrics.conflictSeverity}`);
  }
  
  lines.push('');
  lines.push(`Execution Time: ${decision.metrics.executionTimeMs.toFixed(2)}ms`);
  
  return lines.join('\n');
}

/**
 * Format fusion state for display
 */
export function formatFusionState(state: FusionState): string {
  const lines = [
    '=== FUSION STATE ===',
    `Total Decisions: ${state.totalDecisions}`,
    `Executed: ${state.executedCount} (${((state.executedCount / state.totalDecisions) * 100 || 0).toFixed(1)}%)`,
    `Delayed: ${state.delayedCount}`,
    `Cancelled: ${state.cancelledCount}`,
    `Scaled: ${state.scaledCount}`,
    `Emergency Aborts: ${state.abortedCount}`,
    '',
    `Avg Harmony: ${state.avgHarmony.toFixed(1)}%`,
    `Avg Confidence: ${state.avgConfidence.toFixed(1)}%`,
    `Conflict Rate: ${(state.conflictRate * 100).toFixed(1)}%`,
    '',
    `Last Update: ${new Date(state.lastUpdate).toISOString()}`,
  ];
  
  return lines.join('\n');
}

// ============================================================================
// Mock/Simulation Helpers
// ============================================================================

/**
 * Create mock EXO decision for testing
 */
export function createMockEXODecision(
  command: "EXECUTE" | "WAIT" | "CANCEL" | "SCALE" = "EXECUTE",
  confidence: number = 80
): EXODecision {
  return {
    command,
    confidence,
    targetSize: 1.0,
    direction: "LONG",
    reason: ["Mock EXO decision"],
    timestamp: Date.now(),
  };
}

/**
 * Create mock reactor decision for testing
 */
export function createMockReactorDecision(
  command: "EXECUTE" | "DELAY" | "CANCEL" | "SCALE" | "EMERGENCY_ABORT" = "EXECUTE",
  confidence: number = 85
): ReactorDecision {
  return {
    command,
    delayMs: command === "DELAY" ? 100 : 0,
    finalSize: 1.0,
    orderType: "LIMIT",
    reason: ["Mock reactor decision"],
    confidence,
    timestamp: Date.now(),
    spreadBps: 5,
    latencyMs: 25,
    pressureScore: 70,
    volatilityScore: 40,
    reversalRisk: 30,
  };
}

/**
 * Create mock market snapshot for testing
 */
export function createMockMarketSnapshot(
  symbol: string = "BTC/USD",
  price: number = 50000
): MarketSnapshot {
  const spread = price * 0.0001;
  return {
    symbol,
    price,
    bid: price - spread / 2,
    ask: price + spread / 2,
    timestamp: Date.now(),
  };
}

/**
 * Run fusion simulation with mock data
 */
export function runFusionSimulation(config?: Partial<FusionConfig>): FusionDecision {
  if (config) {
    initFusion(config);
  }
  
  const exoDecision = createMockEXODecision();
  const reactorDecision = createMockReactorDecision();
  const marketSnapshot = createMockMarketSnapshot();
  
  return runFusion(exoDecision, reactorDecision, marketSnapshot);
}

/**
 * Export for convenience
 */
export const DEFLService = {
  // Initialization
  init: initFusion,
  reset: resetFusionInstance,
  resetState: resetFusionState,
  
  // Fusion
  runFusion,
  autoFuse: autoFuseFromReactor,
  
  // State
  getContext: getFusionContext,
  getState: getFusionState,
  getDiagnostics: getFusionDiagnostics,
  getHistory: getFusionDecisionHistory,
  
  // Configuration
  updateConfig: updateFusionConfig,
  
  // Event Listeners
  onExecute: onFusionExecute,
  onDelay: onFusionDelay,
  onCancel: onFusionCancel,
  onScale: onFusionScale,
  onEmergencyAbort: onFusionEmergencyAbort,
  onStateUpdate: onFusionStateUpdate,
  
  // Utilities
  shouldExecute,
  shouldDelay,
  shouldCancel,
  shouldScale,
  getSummary: getFusionSummary,
  formatState: formatFusionState,
  
  // Mocks
  createMockEXO: createMockEXODecision,
  createMockReactor: createMockReactorDecision,
  createMockSnapshot: createMockMarketSnapshot,
  runSimulation: runFusionSimulation,
};

export default DEFLService;
