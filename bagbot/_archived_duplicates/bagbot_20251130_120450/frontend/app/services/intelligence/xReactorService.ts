/**
 * X-REACTOR Service - React Integration
 * 
 * Service layer for integrating X-REACTOR (Execution Reactor Engine) with React components.
 * Provides initialization, evaluation, and state management for final execution decisions.
 */

import { getReactor, resetReactor } from '@/app/lib/xreactor/XReactor';
import type {
  ReactorDecision,
  ReactorContext,
  ReactorConfig,
  ReactorMetrics,
  MicroCheckResult,
  ReactorRuleResult,
} from '@/app/lib/xreactor/types';

/**
 * Event listeners for reactor state changes
 */
type ReactorEventListener = (decision: ReactorDecision) => void;
type MetricsEventListener = (metrics: ReactorMetrics) => void;

const executeListeners: Set<ReactorEventListener> = new Set();
const delayListeners: Set<ReactorEventListener> = new Set();
const cancelListeners: Set<ReactorEventListener> = new Set();
const scaleListeners: Set<ReactorEventListener> = new Set();
const emergencyListeners: Set<ReactorEventListener> = new Set();
const metricsListeners: Set<MetricsEventListener> = new Set();

/**
 * Initialize X-REACTOR with optional configuration
 */
export function initReactor(config?: Partial<ReactorConfig>): void {
  const reactor = getReactor(config);
  console.log('[X-REACTOR Service] Initialized', {
    config,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Evaluate execution decision through X-REACTOR
 * 
 * @param exoDecision - Decision from EXO (Execution Orchestrator)
 * @param marketSnapshot - Current market state
 * @param orderbook - Current orderbook state
 * @param latencyLog - Network latency measurements
 * @returns Final execution decision
 */
export function evaluateReactor(
  exoDecision: ReactorContext["exoDecision"],
  marketSnapshot: ReactorContext["marketSnapshot"],
  orderbook: ReactorContext["orderbook"],
  latencyLog: ReactorContext["latencyLog"]
): ReactorDecision {
  const reactor = getReactor();
  
  // Load context
  reactor.load(exoDecision, marketSnapshot, orderbook, latencyLog);
  
  // Run reactor analysis
  const decision = reactor.runReactor();
  
  // Emit events based on decision
  emitDecisionEvents(decision);
  
  // Emit metrics update
  const metrics = reactor.getMetrics();
  metricsListeners.forEach(listener => listener(metrics));
  
  console.log('[X-REACTOR Service] Decision:', {
    command: decision.command,
    confidence: decision.confidence,
    delayMs: decision.delayMs,
    finalSize: decision.finalSize,
    orderType: decision.orderType,
    reason: decision.reason,
  });
  
  return decision;
}

/**
 * Emit decision events to registered listeners
 */
function emitDecisionEvents(decision: ReactorDecision): void {
  switch (decision.command) {
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
 * Get current reactor state
 */
export function getReactorState(): {
  metrics: ReactorMetrics;
  lastDecision: ReactorDecision | null;
  diagnostics: ReturnType<typeof getReactor>["getDiagnostics"];
} {
  const reactor = getReactor();
  const metrics = reactor.getMetrics();
  const diagnostics = reactor.getDiagnostics();
  
  return {
    metrics,
    lastDecision: metrics.lastDecision,
    diagnostics,
  };
}

/**
 * Get reactor metrics
 */
export function getReactorMetrics(): ReactorMetrics {
  const reactor = getReactor();
  return reactor.getMetrics();
}

/**
 * Get reactor diagnostics (checks and rules)
 */
export function getReactorDiagnostics(): {
  checks: MicroCheckResult[];
  rules: ReactorRuleResult[];
  monitorScore: {
    overallScore: number;
    passedCount: number;
    failedCount: number;
    criticalCount: number;
    warningCount: number;
  };
  ruleDecision: {
    shouldExecute: boolean;
    shouldDelay: boolean;
    shouldCancel: boolean;
    shouldScale: boolean;
    emergencyAbort: boolean;
    maxDelayMs: number;
    minScaleDown: number;
    blockingReasons: string[];
  };
} {
  const reactor = getReactor();
  return reactor.getDiagnostics();
}

/**
 * Update reactor configuration
 */
export function updateReactorConfig(config: Partial<ReactorConfig>): void {
  const reactor = getReactor();
  reactor.updateConfig(config);
  console.log('[X-REACTOR Service] Configuration updated', config);
}

/**
 * Reset reactor metrics
 */
export function resetReactorMetrics(): void {
  const reactor = getReactor();
  reactor.resetMetrics();
  console.log('[X-REACTOR Service] Metrics reset');
}

/**
 * Reset reactor instance (for testing)
 */
export function resetReactorInstance(): void {
  resetReactor();
  console.log('[X-REACTOR Service] Instance reset');
}

// ============================================================================
// Event Listener Registration
// ============================================================================

/**
 * Register listener for EXECUTE decisions
 */
export function onExecuteCommand(listener: ReactorEventListener): () => void {
  executeListeners.add(listener);
  return () => executeListeners.delete(listener);
}

/**
 * Register listener for DELAY decisions
 */
export function onDelayCommand(listener: ReactorEventListener): () => void {
  delayListeners.add(listener);
  return () => delayListeners.delete(listener);
}

/**
 * Register listener for CANCEL decisions
 */
export function onCancelCommand(listener: ReactorEventListener): () => void {
  cancelListeners.add(listener);
  return () => cancelListeners.delete(listener);
}

/**
 * Register listener for SCALE decisions
 */
export function onScaleCommand(listener: ReactorEventListener): () => void {
  scaleListeners.add(listener);
  return () => scaleListeners.delete(listener);
}

/**
 * Register listener for EMERGENCY_ABORT decisions
 */
export function onEmergencyAbort(listener: ReactorEventListener): () => void {
  emergencyListeners.add(listener);
  return () => emergencyListeners.delete(listener);
}

/**
 * Register listener for metrics updates
 */
export function onMetricsUpdate(listener: MetricsEventListener): () => void {
  metricsListeners.add(listener);
  return () => metricsListeners.delete(listener);
}

// ============================================================================
// Auto-Evaluation from EXO
// ============================================================================

/**
 * Auto-evaluate reactor when EXO decision is received
 * Useful for chaining EXO → X-REACTOR automatically
 */
export function autoEvaluateFromEXO(
  exoDecision: ReactorContext["exoDecision"],
  marketSnapshot: ReactorContext["marketSnapshot"],
  orderbook: ReactorContext["orderbook"],
  latencyLog: ReactorContext["latencyLog"]
): ReactorDecision {
  console.log('[X-REACTOR Service] Auto-evaluating from EXO decision', {
    exoCommand: exoDecision.command,
    exoConfidence: exoDecision.confidence,
  });
  
  return evaluateReactor(exoDecision, marketSnapshot, orderbook, latencyLog);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if execution should proceed based on decision
 */
export function shouldExecute(decision: ReactorDecision): boolean {
  return decision.command === "EXECUTE" && decision.confidence >= 60;
}

/**
 * Check if execution should be delayed
 */
export function shouldDelay(decision: ReactorDecision): boolean {
  return decision.command === "DELAY" && decision.delayMs > 0;
}

/**
 * Check if execution should be cancelled
 */
export function shouldCancel(decision: ReactorDecision): boolean {
  return decision.command === "CANCEL" || decision.command === "EMERGENCY_ABORT";
}

/**
 * Check if position should be scaled
 */
export function shouldScale(decision: ReactorDecision): boolean {
  return decision.command === "SCALE" && decision.finalSize > 0;
}

/**
 * Get human-readable decision summary
 */
export function getDecisionSummary(decision: ReactorDecision): string {
  const lines = [
    `Command: ${decision.command}`,
    `Confidence: ${decision.confidence}%`,
    `Order Type: ${decision.orderType}`,
    `Final Size: ${decision.finalSize}`,
  ];
  
  if (decision.delayMs > 0) {
    lines.push(`Delay: ${decision.delayMs}ms`);
  }
  
  lines.push(`Spread: ${decision.spreadBps} bps`);
  lines.push(`Latency: ${decision.latencyMs}ms`);
  lines.push(`Pressure: ${decision.pressureScore}/100`);
  lines.push(`Volatility: ${decision.volatilityScore}/100`);
  lines.push(`Reversal Risk: ${decision.reversalRisk}/100`);
  lines.push('');
  lines.push('Reasons:');
  decision.reason.forEach(r => lines.push(`  - ${r}`));
  
  return lines.join('\n');
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: ReactorMetrics): string {
  const lines = [
    '=== X-REACTOR METRICS ===',
    `Total Decisions: ${metrics.totalDecisions}`,
    `Executed: ${metrics.executedCount} (${((metrics.executedCount / metrics.totalDecisions) * 100 || 0).toFixed(1)}%)`,
    `Delayed: ${metrics.delayedCount}`,
    `Cancelled: ${metrics.cancelledCount}`,
    `Scaled: ${metrics.scaledCount}`,
    `Emergency Aborts: ${metrics.abortedCount}`,
    '',
    `Avg Confidence: ${metrics.avgConfidence.toFixed(1)}%`,
    `Avg Delay: ${metrics.avgDelayMs.toFixed(1)}ms`,
    `Avg Spread: ${metrics.avgSpreadBps.toFixed(2)} bps`,
    `Avg Latency: ${metrics.avgLatencyMs.toFixed(1)}ms`,
    '',
    `Rule Violations: ${metrics.ruleViolations}`,
    `Last Update: ${new Date(metrics.lastUpdate).toISOString()}`,
  ];
  
  return lines.join('\n');
}

// ============================================================================
// Mock/Simulation Helpers
// ============================================================================

/**
 * Create mock market snapshot for testing
 */
export function createMockMarketSnapshot(
  symbol: string = "BTC/USD",
  price: number = 50000
): ReactorContext["marketSnapshot"] {
  const spread = price * 0.0001; // 1 bps
  return {
    symbol,
    price,
    bid: price - spread / 2,
    ask: price + spread / 2,
    timestamp: Date.now(),
    volume24h: 1000000,
    lastUpdateMs: 10,
  };
}

/**
 * Create mock orderbook for testing
 */
export function createMockOrderbook(
  price: number = 50000,
  bidSize: number = 100,
  askSize: number = 100
): ReactorContext["orderbook"] {
  return {
    bids: [
      { price: price - 10, size: bidSize },
      { price: price - 20, size: bidSize * 1.5 },
      { price: price - 30, size: bidSize * 2 },
    ],
    asks: [
      { price: price + 10, size: askSize },
      { price: price + 20, size: askSize * 1.5 },
      { price: price + 30, size: askSize * 2 },
    ],
    timestamp: Date.now(),
    bidDepth: bidSize * 4.5,
    askDepth: askSize * 4.5,
    imbalance: 0, // Neutral
  };
}

/**
 * Create mock latency log for testing
 */
export function createMockLatencyLog(
  avgMs: number = 25
): ReactorContext["latencyLog"] {
  return {
    avgMs,
    p50Ms: avgMs * 0.8,
    p95Ms: avgMs * 1.5,
    p99Ms: avgMs * 2,
    lastMs: avgMs,
    timestamp: Date.now(),
  };
}

/**
 * Create mock EXO decision for testing
 */
export function createMockEXODecision(
  command: "EXECUTE" | "WAIT" | "CANCEL" | "SCALE" = "EXECUTE",
  confidence: number = 80
): ReactorContext["exoDecision"] {
  return {
    command,
    confidence,
    targetSize: 1.0,
    direction: "LONG",
    reason: ["Mock EXO decision for testing"],
  };
}

/**
 * Run simulation test with mock data
 */
export function runSimulation(
  config?: Partial<ReactorConfig>
): ReactorDecision {
  if (config) {
    initReactor(config);
  }
  
  const exoDecision = createMockEXODecision();
  const marketSnapshot = createMockMarketSnapshot();
  const orderbook = createMockOrderbook();
  const latencyLog = createMockLatencyLog();
  
  return evaluateReactor(exoDecision, marketSnapshot, orderbook, latencyLog);
}

/**
 * Export for convenience
 */
export const XReactorService = {
  // Initialization
  init: initReactor,
  reset: resetReactorInstance,
  
  // Evaluation
  evaluate: evaluateReactor,
  autoEvaluate: autoEvaluateFromEXO,
  
  // State
  getState: getReactorState,
  getMetrics: getReactorMetrics,
  getDiagnostics: getReactorDiagnostics,
  
  // Configuration
  updateConfig: updateReactorConfig,
  resetMetrics: resetReactorMetrics,
  
  // Event Listeners
  onExecute: onExecuteCommand,
  onDelay: onDelayCommand,
  onCancel: onCancelCommand,
  onScale: onScaleCommand,
  onEmergencyAbort: onEmergencyAbort,
  onMetricsUpdate: onMetricsUpdate,
  
  // Utilities
  shouldExecute,
  shouldDelay,
  shouldCancel,
  shouldScale,
  getDecisionSummary,
  formatMetrics,
  
  // Mocks
  createMockMarketSnapshot,
  createMockOrderbook,
  createMockLatencyLog,
  createMockEXODecision,
  runSimulation,
};

export default XReactorService;
