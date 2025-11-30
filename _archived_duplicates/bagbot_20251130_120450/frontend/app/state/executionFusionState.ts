/**
 * Execution Fusion State - Global State Manager
 * 
 * Manages global state for Deep Execution Fusion Layer (DEFL).
 * Tracks decision history, performance logs, and errors.
 */

import type {
  FusionDecision,
  FusionError,
  FusionPerformanceLog,
} from '@/app/lib/fusion/types';

/**
 * Global fusion state
 */
interface GlobalFusionState {
  decisions: FusionDecision[];        // Last N decisions (circular buffer)
  performanceLogs: FusionPerformanceLog[]; // Performance metrics
  errors: FusionError[];              // Error log
  maxHistorySize: number;             // Max items to keep in history
  maxLogSize: number;                 // Max performance logs to keep
  maxErrorSize: number;               // Max errors to keep
}

/**
 * Initial state
 */
const initialState: GlobalFusionState = {
  decisions: [],
  performanceLogs: [],
  errors: [],
  maxHistorySize: 20,      // Keep last 20 decisions
  maxLogSize: 100,         // Keep last 100 performance logs
  maxErrorSize: 50,        // Keep last 50 errors
};

/**
 * Global state instance
 */
let globalState: GlobalFusionState = { ...initialState };

// ============================================================================
// Decision History Management
// ============================================================================

/**
 * Add fusion decision to history
 */
export function addFusionDecision(decision: FusionDecision): void {
  globalState.decisions.push(decision);
  
  // Maintain circular buffer - keep only last N decisions
  if (globalState.decisions.length > globalState.maxHistorySize) {
    globalState.decisions.shift(); // Remove oldest
  }
}

/**
 * Get all fusion decisions in history
 */
export function getFusionHistory(): FusionDecision[] {
  return [...globalState.decisions]; // Return copy
}

/**
 * Get last N fusion decisions
 */
export function getLastNDecisions(n: number): FusionDecision[] {
  const start = Math.max(0, globalState.decisions.length - n);
  return globalState.decisions.slice(start);
}

/**
 * Get last fusion decision
 */
export function getLastDecision(): FusionDecision | null {
  return globalState.decisions[globalState.decisions.length - 1] || null;
}

/**
 * Get decisions by command type
 */
export function getDecisionsByCommand(
  command: FusionDecision["finalCommand"]
): FusionDecision[] {
  return globalState.decisions.filter(d => d.finalCommand === command);
}

/**
 * Get decisions within time range
 */
export function getDecisionsInTimeRange(
  startTime: number,
  endTime: number
): FusionDecision[] {
  return globalState.decisions.filter(
    d => d.timestamp >= startTime && d.timestamp <= endTime
  );
}

/**
 * Count decisions by command type
 */
export function countDecisionsByCommand(): Record<string, number> {
  const counts: Record<string, number> = {
    EXECUTE: 0,
    DELAY: 0,
    CANCEL: 0,
    SCALE: 0,
    EMERGENCY_ABORT: 0,
  };
  
  globalState.decisions.forEach(d => {
    counts[d.finalCommand]++;
  });
  
  return counts;
}

/**
 * Get average harmony score
 */
export function getAverageHarmony(): number {
  if (globalState.decisions.length === 0) return 0;
  
  const sum = globalState.decisions.reduce((acc, d) => acc + d.harmonyScore, 0);
  return sum / globalState.decisions.length;
}

/**
 * Get average confidence
 */
export function getAverageConfidence(): number {
  if (globalState.decisions.length === 0) return 0;
  
  const sum = globalState.decisions.reduce((acc, d) => acc + d.confidence, 0);
  return sum / globalState.decisions.length;
}

/**
 * Get conflict rate (% of decisions with conflicts)
 */
export function getConflictRate(): number {
  if (globalState.decisions.length === 0) return 0;
  
  const conflictCount = globalState.decisions.filter(
    d => d.metrics.harmonyMetrics.hasConflict
  ).length;
  
  return conflictCount / globalState.decisions.length;
}

// ============================================================================
// Performance Log Management
// ============================================================================

/**
 * Add performance log entry
 */
export function addPerformanceLog(log: FusionPerformanceLog): void {
  globalState.performanceLogs.push(log);
  
  // Maintain circular buffer
  if (globalState.performanceLogs.length > globalState.maxLogSize) {
    globalState.performanceLogs.shift();
  }
}

/**
 * Get all performance logs
 */
export function getPerformanceLogs(): FusionPerformanceLog[] {
  return [...globalState.performanceLogs];
}

/**
 * Get last N performance logs
 */
export function getLastNLogs(n: number): FusionPerformanceLog[] {
  const start = Math.max(0, globalState.performanceLogs.length - n);
  return globalState.performanceLogs.slice(start);
}

/**
 * Get average execution time
 */
export function getAverageExecutionTime(): number {
  if (globalState.performanceLogs.length === 0) return 0;
  
  const sum = globalState.performanceLogs.reduce(
    (acc, log) => acc + log.executionTimeMs,
    0
  );
  return sum / globalState.performanceLogs.length;
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  avgExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  p50ExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  avgHarmony: number;
  avgConfidence: number;
  conflictRate: number;
  totalLogs: number;
} {
  if (globalState.performanceLogs.length === 0) {
    return {
      avgExecutionTime: 0,
      minExecutionTime: 0,
      maxExecutionTime: 0,
      p50ExecutionTime: 0,
      p95ExecutionTime: 0,
      p99ExecutionTime: 0,
      avgHarmony: 0,
      avgConfidence: 0,
      conflictRate: 0,
      totalLogs: 0,
    };
  }
  
  const logs = globalState.performanceLogs;
  const executionTimes = logs.map(l => l.executionTimeMs).sort((a, b) => a - b);
  
  const avgExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  const minExecutionTime = executionTimes[0];
  const maxExecutionTime = executionTimes[executionTimes.length - 1];
  
  const p50Index = Math.floor(executionTimes.length * 0.5);
  const p95Index = Math.floor(executionTimes.length * 0.95);
  const p99Index = Math.floor(executionTimes.length * 0.99);
  
  const p50ExecutionTime = executionTimes[p50Index];
  const p95ExecutionTime = executionTimes[p95Index];
  const p99ExecutionTime = executionTimes[p99Index];
  
  const avgHarmony = logs.reduce((a, l) => a + l.harmonyScore, 0) / logs.length;
  const avgConfidence = logs.reduce((a, l) => a + l.confidence, 0) / logs.length;
  const conflictRate = logs.filter(l => l.hadConflict).length / logs.length;
  
  return {
    avgExecutionTime,
    minExecutionTime,
    maxExecutionTime,
    p50ExecutionTime,
    p95ExecutionTime,
    p99ExecutionTime,
    avgHarmony,
    avgConfidence,
    conflictRate,
    totalLogs: logs.length,
  };
}

// ============================================================================
// Error Management
// ============================================================================

/**
 * Add error to log
 */
export function addError(error: FusionError): void {
  globalState.errors.push(error);
  
  // Maintain circular buffer
  if (globalState.errors.length > globalState.maxErrorSize) {
    globalState.errors.shift();
  }
  
  // Log to console based on severity
  if (error.severity === "CRITICAL") {
    console.error('[DEFL Error - CRITICAL]', error.message, error.context);
  } else if (error.severity === "ERROR") {
    console.error('[DEFL Error]', error.message, error.context);
  } else {
    console.warn('[DEFL Warning]', error.message, error.context);
  }
}

/**
 * Get all errors
 */
export function getErrors(): FusionError[] {
  return [...globalState.errors];
}

/**
 * Get errors by type
 */
export function getErrorsByType(type: FusionError["type"]): FusionError[] {
  return globalState.errors.filter(e => e.type === type);
}

/**
 * Get errors by severity
 */
export function getErrorsBySeverity(severity: FusionError["severity"]): FusionError[] {
  return globalState.errors.filter(e => e.severity === severity);
}

/**
 * Get error count by severity
 */
export function getErrorCountsBySeverity(): Record<string, number> {
  const counts = {
    WARNING: 0,
    ERROR: 0,
    CRITICAL: 0,
  };
  
  globalState.errors.forEach(e => {
    counts[e.severity]++;
  });
  
  return counts;
}

/**
 * Check if there are critical errors
 */
export function hasCriticalErrors(): boolean {
  return globalState.errors.some(e => e.severity === "CRITICAL");
}

/**
 * Get last N errors
 */
export function getLastNErrors(n: number): FusionError[] {
  const start = Math.max(0, globalState.errors.length - n);
  return globalState.errors.slice(start);
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Get complete state snapshot
 */
export function getStateSnapshot(): {
  decisions: FusionDecision[];
  performanceLogs: FusionPerformanceLog[];
  errors: FusionError[];
  statistics: {
    totalDecisions: number;
    commandCounts: Record<string, number>;
    avgHarmony: number;
    avgConfidence: number;
    conflictRate: number;
    performanceStats: ReturnType<typeof getPerformanceStats>;
    errorCounts: Record<string, number>;
    hasCriticalErrors: boolean;
  };
} {
  return {
    decisions: getFusionHistory(),
    performanceLogs: getPerformanceLogs(),
    errors: getErrors(),
    statistics: {
      totalDecisions: globalState.decisions.length,
      commandCounts: countDecisionsByCommand(),
      avgHarmony: getAverageHarmony(),
      avgConfidence: getAverageConfidence(),
      conflictRate: getConflictRate(),
      performanceStats: getPerformanceStats(),
      errorCounts: getErrorCountsBySeverity(),
      hasCriticalErrors: hasCriticalErrors(),
    },
  };
}

/**
 * Clear all history (decisions, logs, errors)
 */
export function clearHistory(): void {
  globalState.decisions = [];
  globalState.performanceLogs = [];
  globalState.errors = [];
  console.log('[DEFL State] All history cleared');
}

/**
 * Clear only decisions
 */
export function clearDecisions(): void {
  globalState.decisions = [];
  console.log('[DEFL State] Decision history cleared');
}

/**
 * Clear only performance logs
 */
export function clearPerformanceLogs(): void {
  globalState.performanceLogs = [];
  console.log('[DEFL State] Performance logs cleared');
}

/**
 * Clear only errors
 */
export function clearErrors(): void {
  globalState.errors = [];
  console.log('[DEFL State] Error log cleared');
}

/**
 * Update buffer sizes
 */
export function updateBufferSizes(config: {
  maxHistorySize?: number;
  maxLogSize?: number;
  maxErrorSize?: number;
}): void {
  if (config.maxHistorySize !== undefined) {
    globalState.maxHistorySize = config.maxHistorySize;
    // Trim if needed
    if (globalState.decisions.length > globalState.maxHistorySize) {
      globalState.decisions = globalState.decisions.slice(-globalState.maxHistorySize);
    }
  }
  
  if (config.maxLogSize !== undefined) {
    globalState.maxLogSize = config.maxLogSize;
    if (globalState.performanceLogs.length > globalState.maxLogSize) {
      globalState.performanceLogs = globalState.performanceLogs.slice(-globalState.maxLogSize);
    }
  }
  
  if (config.maxErrorSize !== undefined) {
    globalState.maxErrorSize = config.maxErrorSize;
    if (globalState.errors.length > globalState.maxErrorSize) {
      globalState.errors = globalState.errors.slice(-globalState.maxErrorSize);
    }
  }
  
  console.log('[DEFL State] Buffer sizes updated', config);
}

/**
 * Reset to initial state
 */
export function resetState(): void {
  globalState = { ...initialState };
  console.log('[DEFL State] State reset to initial');
}

/**
 * Export state to JSON (for persistence)
 */
export function exportState(): string {
  return JSON.stringify(getStateSnapshot(), null, 2);
}

/**
 * Import state from JSON (for restoration)
 */
export function importState(jsonState: string): void {
  try {
    const state = JSON.parse(jsonState);
    globalState.decisions = state.decisions || [];
    globalState.performanceLogs = state.performanceLogs || [];
    globalState.errors = state.errors || [];
    console.log('[DEFL State] State imported successfully');
  } catch (error) {
    console.error('[DEFL State] Failed to import state:', error);
    throw error;
  }
}

// ============================================================================
// Analytics & Insights
// ============================================================================

/**
 * Get decision trend analysis
 */
export function getDecisionTrend(windowSize: number = 10): {
  recentHarmony: number;
  recentConfidence: number;
  harmonyCrash: boolean;      // Sharp drop in harmony
  confidenceDrop: boolean;    // Sharp drop in confidence
  conflictSpike: boolean;     // Increase in conflicts
} {
  const recent = getLastNDecisions(windowSize);
  if (recent.length < windowSize) {
    return {
      recentHarmony: getAverageHarmony(),
      recentConfidence: getAverageConfidence(),
      harmonyCrash: false,
      confidenceDrop: false,
      conflictSpike: false,
    };
  }
  
  const recentHarmony = recent.reduce((a, d) => a + d.harmonyScore, 0) / recent.length;
  const recentConfidence = recent.reduce((a, d) => a + d.confidence, 0) / recent.length;
  
  const overallHarmony = getAverageHarmony();
  const overallConfidence = getAverageConfidence();
  
  const harmonyCrash = recentHarmony < overallHarmony - 20; // 20 point drop
  const confidenceDrop = recentConfidence < overallConfidence - 15; // 15 point drop
  
  const recentConflictRate = recent.filter(d => d.metrics.harmonyMetrics.hasConflict).length / recent.length;
  const overallConflictRate = getConflictRate();
  const conflictSpike = recentConflictRate > overallConflictRate + 0.2; // 20% increase
  
  return {
    recentHarmony,
    recentConfidence,
    harmonyCrash,
    confidenceDrop,
    conflictSpike,
  };
}

/**
 * Get health score (0-100)
 */
export function getHealthScore(): number {
  const stats = getPerformanceStats();
  const errorCounts = getErrorCountsBySeverity();
  
  let score = 100;
  
  // Deduct for poor harmony
  if (stats.avgHarmony < 60) score -= 20;
  else if (stats.avgHarmony < 75) score -= 10;
  
  // Deduct for low confidence
  if (stats.avgConfidence < 60) score -= 15;
  else if (stats.avgConfidence < 75) score -= 5;
  
  // Deduct for high conflict rate
  if (stats.conflictRate > 0.3) score -= 20; // >30% conflicts
  else if (stats.conflictRate > 0.15) score -= 10; // >15% conflicts
  
  // Deduct for critical errors
  score -= errorCounts.CRITICAL * 10;
  score -= errorCounts.ERROR * 5;
  score -= errorCounts.WARNING * 1;
  
  // Deduct for slow execution
  if (stats.avgExecutionTime > 10) score -= 10; // >10ms
  else if (stats.avgExecutionTime > 5) score -= 5; // >5ms
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Export for convenience
 */
export const FusionState = {
  // Decisions
  addDecision: addFusionDecision,
  getHistory: getFusionHistory,
  getLastN: getLastNDecisions,
  getLast: getLastDecision,
  getByCommand: getDecisionsByCommand,
  getInTimeRange: getDecisionsInTimeRange,
  countByCommand: countDecisionsByCommand,
  
  // Performance
  addLog: addPerformanceLog,
  getLogs: getPerformanceLogs,
  getLastNLogs,
  getStats: getPerformanceStats,
  
  // Errors
  addError,
  getErrors,
  getErrorsByType,
  getErrorsBySeverity,
  getLastNErrors,
  hasCriticalErrors,
  
  // State
  getSnapshot: getStateSnapshot,
  clear: clearHistory,
  clearDecisions,
  clearLogs: clearPerformanceLogs,
  clearErrors,
  updateBufferSizes,
  reset: resetState,
  export: exportState,
  import: importState,
  
  // Analytics
  getTrend: getDecisionTrend,
  getHealthScore,
  getAverageHarmony,
  getAverageConfidence,
  getConflictRate,
};

export default FusionState;
