/**
 * Fusion State - Global State Manager
 * 
 * Manages global state for Cross-Engine Fusion Layer.
 * Tracks fusion decisions, conflict resolutions, and quality metrics.
 */

import type { FusionDecision } from '@/app/lib/intelligence/FusionCore';
import type { FusionMatrix } from '@/app/lib/intelligence/fusionMatrix';

/**
 * Conflict log entry
 */
export interface ConflictLog {
  timestamp: number;
  conflictCount: number;
  resolutionMethod: string;
  conflicts: FusionMatrix['conflicts'];
}

/**
 * Confidence history entry
 */
export interface ConfidenceEntry {
  timestamp: number;
  confidence: number;
  action: string;
  consensusLevel: number;
}

/**
 * Quality metrics over time
 */
export interface QualityMetrics {
  timestamp: number;
  matrixQuality: number;
  signalStrength: number;
  consensusLevel: number;
}

/**
 * Global fusion state
 */
interface GlobalFusionState {
  decisions: FusionDecision[];           // Last N fusion decisions
  conflictLogs: ConflictLog[];           // Conflict resolution history
  confidenceHistory: ConfidenceEntry[];  // Confidence over time
  qualityHistory: QualityMetrics[];      // Quality metrics over time
  
  maxDecisionsSize: number;
  maxConflictLogsSize: number;
  maxConfidenceHistorySize: number;
  maxQualityHistorySize: number;
}

/**
 * Initial state
 */
const initialState: GlobalFusionState = {
  decisions: [],
  conflictLogs: [],
  confidenceHistory: [],
  qualityHistory: [],
  
  maxDecisionsSize: 150,
  maxConflictLogsSize: 100,
  maxConfidenceHistorySize: 200,
  maxQualityHistorySize: 200,
};

/**
 * Global state instance
 */
let globalState: GlobalFusionState = { ...initialState };

// ============================================================================
// Decision Management
// ============================================================================

/**
 * Add fusion decision to history
 */
export function addFusionDecision(decision: FusionDecision): void {
  globalState.decisions.push(decision);
  
  // Maintain circular buffer
  if (globalState.decisions.length > globalState.maxDecisionsSize) {
    globalState.decisions.shift();
  }
  
  // Also add to confidence history
  addConfidenceEntry({
    timestamp: decision.timestamp,
    confidence: decision.confidence,
    action: decision.action,
    consensusLevel: decision.qualityMetrics.consensusLevel,
  });
  
  // Add to quality history
  addQualityEntry({
    timestamp: decision.timestamp,
    matrixQuality: decision.qualityMetrics.matrixQuality,
    signalStrength: decision.qualityMetrics.signalStrength,
    consensusLevel: decision.qualityMetrics.consensusLevel,
  });
}

/**
 * Get all fusion decisions
 */
export function getFusionDecisions(): FusionDecision[] {
  return [...globalState.decisions];
}

/**
 * Get recent decisions
 */
export function getRecentDecisions(n: number): FusionDecision[] {
  const start = Math.max(0, globalState.decisions.length - n);
  return globalState.decisions.slice(start);
}

/**
 * Get last decision
 */
export function getLastDecision(): FusionDecision | null {
  return globalState.decisions[globalState.decisions.length - 1] || null;
}

/**
 * Get decisions by action
 */
export function getDecisionsByAction(action: string): FusionDecision[] {
  return globalState.decisions.filter(d => d.action === action);
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
 * Get high confidence decisions
 */
export function getHighConfidenceDecisions(threshold: number = 80): FusionDecision[] {
  return globalState.decisions.filter(d => d.confidence >= threshold);
}

// ============================================================================
// Conflict Log Management
// ============================================================================

/**
 * Add conflict log
 */
export function addConflictLog(log: ConflictLog): void {
  globalState.conflictLogs.push(log);
  
  // Maintain circular buffer
  if (globalState.conflictLogs.length > globalState.maxConflictLogsSize) {
    globalState.conflictLogs.shift();
  }
}

/**
 * Get all conflict logs
 */
export function getConflictLogs(): ConflictLog[] {
  return [...globalState.conflictLogs];
}

/**
 * Get recent conflict logs
 */
export function getRecentConflictLogs(n: number): ConflictLog[] {
  const start = Math.max(0, globalState.conflictLogs.length - n);
  return globalState.conflictLogs.slice(start);
}

/**
 * Get conflict logs by resolution method
 */
export function getConflictLogsByMethod(method: string): ConflictLog[] {
  return globalState.conflictLogs.filter(log => log.resolutionMethod === method);
}

/**
 * Get total conflicts resolved
 */
export function getTotalConflictsResolved(): number {
  return globalState.conflictLogs.reduce((sum, log) => sum + log.conflictCount, 0);
}

// ============================================================================
// Confidence History Management
// ============================================================================

/**
 * Add confidence entry
 */
function addConfidenceEntry(entry: ConfidenceEntry): void {
  globalState.confidenceHistory.push(entry);
  
  // Maintain circular buffer
  if (globalState.confidenceHistory.length > globalState.maxConfidenceHistorySize) {
    globalState.confidenceHistory.shift();
  }
}

/**
 * Get confidence history
 */
export function getConfidenceHistory(): ConfidenceEntry[] {
  return [...globalState.confidenceHistory];
}

/**
 * Get recent confidence entries
 */
export function getRecentConfidence(n: number): ConfidenceEntry[] {
  const start = Math.max(0, globalState.confidenceHistory.length - n);
  return globalState.confidenceHistory.slice(start);
}

/**
 * Get average confidence
 */
export function getAverageConfidence(): number {
  if (globalState.confidenceHistory.length === 0) return 0;
  
  const sum = globalState.confidenceHistory.reduce((acc, e) => acc + e.confidence, 0);
  return sum / globalState.confidenceHistory.length;
}

/**
 * Get confidence trend (increasing/decreasing/stable)
 */
export function getConfidenceTrend(windowSize: number = 20): {
  trend: "INCREASING" | "DECREASING" | "STABLE";
  change: number;
} {
  const recent = getRecentConfidence(windowSize);
  
  if (recent.length < 2) {
    return { trend: "STABLE", change: 0 };
  }
  
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const avgFirst = firstHalf.reduce((acc, e) => acc + e.confidence, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((acc, e) => acc + e.confidence, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  let trend: "INCREASING" | "DECREASING" | "STABLE";
  if (change > 5) trend = "INCREASING";
  else if (change < -5) trend = "DECREASING";
  else trend = "STABLE";
  
  return { trend, change: Math.round(change) };
}

// ============================================================================
// Quality History Management
// ============================================================================

/**
 * Add quality entry
 */
function addQualityEntry(entry: QualityMetrics): void {
  globalState.qualityHistory.push(entry);
  
  // Maintain circular buffer
  if (globalState.qualityHistory.length > globalState.maxQualityHistorySize) {
    globalState.qualityHistory.shift();
  }
}

/**
 * Get quality history
 */
export function getQualityHistory(): QualityMetrics[] {
  return [...globalState.qualityHistory];
}

/**
 * Get recent quality metrics
 */
export function getRecentQuality(n: number): QualityMetrics[] {
  const start = Math.max(0, globalState.qualityHistory.length - n);
  return globalState.qualityHistory.slice(start);
}

/**
 * Get average quality
 */
export function getAverageQuality(): {
  avgMatrixQuality: number;
  avgSignalStrength: number;
  avgConsensusLevel: number;
} {
  if (globalState.qualityHistory.length === 0) {
    return {
      avgMatrixQuality: 0,
      avgSignalStrength: 0,
      avgConsensusLevel: 0,
    };
  }
  
  const sum = globalState.qualityHistory.reduce((acc, e) => ({
    matrixQuality: acc.matrixQuality + e.matrixQuality,
    signalStrength: acc.signalStrength + e.signalStrength,
    consensusLevel: acc.consensusLevel + e.consensusLevel,
  }), { matrixQuality: 0, signalStrength: 0, consensusLevel: 0 });
  
  const count = globalState.qualityHistory.length;
  
  return {
    avgMatrixQuality: Math.round(sum.matrixQuality / count),
    avgSignalStrength: Math.round(sum.signalStrength / count),
    avgConsensusLevel: Math.round(sum.consensusLevel / count),
  };
}

/**
 * Get fusion quality trend
 */
export function getFusionQualityTrend(windowSize: number = 20): {
  trend: "IMPROVING" | "DEGRADING" | "STABLE";
  change: number;
  currentQuality: number;
} {
  const recent = getRecentQuality(windowSize);
  
  if (recent.length < 2) {
    return { trend: "STABLE", change: 0, currentQuality: 0 };
  }
  
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const avgFirst = firstHalf.reduce((acc, e) => acc + e.matrixQuality, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((acc, e) => acc + e.matrixQuality, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  let trend: "IMPROVING" | "DEGRADING" | "STABLE";
  if (change > 5) trend = "IMPROVING";
  else if (change < -5) trend = "DEGRADING";
  else trend = "STABLE";
  
  const currentQuality = recent[recent.length - 1].matrixQuality;
  
  return { trend, change: Math.round(change), currentQuality };
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

/**
 * Get comprehensive fusion statistics
 */
export function getFusionStats(): {
  totalDecisions: number;
  totalConflicts: number;
  avgConfidence: number;
  avgQuality: ReturnType<typeof getAverageQuality>;
  
  actionDistribution: Record<string, number>;
  conflictResolutionMethods: Record<string, number>;
  
  highConfidenceRate: number;
  lowConfidenceRate: number;
  haltRate: number;
  
  confidenceTrend: ReturnType<typeof getConfidenceTrend>;
  qualityTrend: ReturnType<typeof getFusionQualityTrend>;
} {
  const totalDecisions = globalState.decisions.length;
  const totalConflicts = getTotalConflictsResolved();
  const avgConfidence = getAverageConfidence();
  const avgQuality = getAverageQuality();
  
  // Action distribution
  const actionDistribution: Record<string, number> = {};
  globalState.decisions.forEach(d => {
    actionDistribution[d.action] = (actionDistribution[d.action] || 0) + 1;
  });
  
  // Conflict resolution methods
  const conflictResolutionMethods: Record<string, number> = {};
  globalState.conflictLogs.forEach(log => {
    const method = log.resolutionMethod;
    conflictResolutionMethods[method] = (conflictResolutionMethods[method] || 0) + 1;
  });
  
  // Rates
  const highConfidenceCount = globalState.decisions.filter(d => d.confidence >= 80).length;
  const lowConfidenceCount = globalState.decisions.filter(d => d.confidence < 50).length;
  const haltCount = globalState.decisions.filter(d => d.action === "HALT").length;
  
  const highConfidenceRate = totalDecisions > 0 ? (highConfidenceCount / totalDecisions) * 100 : 0;
  const lowConfidenceRate = totalDecisions > 0 ? (lowConfidenceCount / totalDecisions) * 100 : 0;
  const haltRate = totalDecisions > 0 ? (haltCount / totalDecisions) * 100 : 0;
  
  return {
    totalDecisions,
    totalConflicts,
    avgConfidence: Math.round(avgConfidence),
    avgQuality,
    actionDistribution,
    conflictResolutionMethods,
    highConfidenceRate: Math.round(highConfidenceRate),
    lowConfidenceRate: Math.round(lowConfidenceRate),
    haltRate: Math.round(haltRate),
    confidenceTrend: getConfidenceTrend(),
    qualityTrend: getFusionQualityTrend(),
  };
}

/**
 * Get action frequency analysis
 */
export function getActionFrequency(): Array<{
  action: string;
  count: number;
  percentage: number;
  avgConfidence: number;
}> {
  const distribution: Record<string, { count: number; totalConfidence: number }> = {};
  
  globalState.decisions.forEach(d => {
    if (!distribution[d.action]) {
      distribution[d.action] = { count: 0, totalConfidence: 0 };
    }
    distribution[d.action].count++;
    distribution[d.action].totalConfidence += d.confidence;
  });
  
  const total = globalState.decisions.length;
  
  return Object.entries(distribution)
    .map(([action, data]) => ({
      action,
      count: data.count,
      percentage: Math.round((data.count / total) * 100),
      avgConfidence: Math.round(data.totalConfidence / data.count),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get conflict resolution effectiveness
 */
export function getConflictResolutionEffectiveness(): {
  totalConflicts: number;
  resolutionMethods: Array<{
    method: string;
    count: number;
    avgConflictCount: number;
  }>;
  avgResolutionTime: number;
} {
  const methodStats: Record<string, { count: number; totalConflicts: number }> = {};
  
  globalState.conflictLogs.forEach(log => {
    if (!methodStats[log.resolutionMethod]) {
      methodStats[log.resolutionMethod] = { count: 0, totalConflicts: 0 };
    }
    methodStats[log.resolutionMethod].count++;
    methodStats[log.resolutionMethod].totalConflicts += log.conflictCount;
  });
  
  const resolutionMethods = Object.entries(methodStats)
    .map(([method, data]) => ({
      method,
      count: data.count,
      avgConflictCount: Math.round(data.totalConflicts / data.count),
    }))
    .sort((a, b) => b.count - a.count);
  
  return {
    totalConflicts: getTotalConflictsResolved(),
    resolutionMethods,
    avgResolutionTime: 0, // Would need timing data
  };
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  const stats = getFusionStats();
  
  let score = 50; // Baseline
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  // Evaluate confidence
  if (stats.avgConfidence > 75) {
    score += 15;
    strengths.push('High average confidence');
  } else if (stats.avgConfidence < 50) {
    score -= 15;
    weaknesses.push('Low average confidence');
    recommendations.push('Review engine configurations and weight distributions');
  }
  
  // Evaluate quality
  if (stats.avgQuality.avgMatrixQuality > 75) {
    score += 15;
    strengths.push('High fusion quality');
  } else if (stats.avgQuality.avgMatrixQuality < 50) {
    score -= 15;
    weaknesses.push('Low fusion quality');
    recommendations.push('Investigate engine conflicts and signal quality');
  }
  
  // Evaluate consensus
  if (stats.avgQuality.avgConsensusLevel > 70) {
    score += 10;
    strengths.push('Strong engine consensus');
  } else if (stats.avgQuality.avgConsensusLevel < 50) {
    score -= 10;
    weaknesses.push('Weak engine consensus');
    recommendations.push('Review weight adjustments and conflict resolution');
  }
  
  // Evaluate halt rate
  if (stats.haltRate > 20) {
    score -= 10;
    weaknesses.push('High halt rate');
    recommendations.push('Consider relaxing defensive thresholds');
  } else if (stats.haltRate < 5) {
    score += 5;
    strengths.push('Low halt rate - good trading conditions');
  }
  
  // Evaluate trends
  if (stats.qualityTrend.trend === "IMPROVING") {
    score += 10;
    strengths.push('Quality improving over time');
  } else if (stats.qualityTrend.trend === "DEGRADING") {
    score -= 10;
    weaknesses.push('Quality degrading over time');
    recommendations.push('Investigate recent changes and market conditions');
  }
  
  return {
    overallScore: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
    recommendations,
  };
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Clear all fusion history
 */
export function clearFusionHistory(): void {
  globalState.decisions = [];
  globalState.conflictLogs = [];
  globalState.confidenceHistory = [];
  globalState.qualityHistory = [];
  console.log('[Fusion State] All fusion history cleared');
}

/**
 * Clear only decisions
 */
export function clearDecisions(): void {
  globalState.decisions = [];
  console.log('[Fusion State] Decision history cleared');
}

/**
 * Clear only conflict logs
 */
export function clearConflictLogs(): void {
  globalState.conflictLogs = [];
  console.log('[Fusion State] Conflict logs cleared');
}

/**
 * Update buffer sizes
 */
export function updateBufferSizes(config: {
  maxDecisionsSize?: number;
  maxConflictLogsSize?: number;
  maxConfidenceHistorySize?: number;
  maxQualityHistorySize?: number;
}): void {
  if (config.maxDecisionsSize !== undefined) {
    globalState.maxDecisionsSize = config.maxDecisionsSize;
    if (globalState.decisions.length > globalState.maxDecisionsSize) {
      globalState.decisions = globalState.decisions.slice(-globalState.maxDecisionsSize);
    }
  }
  
  if (config.maxConflictLogsSize !== undefined) {
    globalState.maxConflictLogsSize = config.maxConflictLogsSize;
    if (globalState.conflictLogs.length > globalState.maxConflictLogsSize) {
      globalState.conflictLogs = globalState.conflictLogs.slice(-globalState.maxConflictLogsSize);
    }
  }
  
  if (config.maxConfidenceHistorySize !== undefined) {
    globalState.maxConfidenceHistorySize = config.maxConfidenceHistorySize;
    if (globalState.confidenceHistory.length > globalState.maxConfidenceHistorySize) {
      globalState.confidenceHistory = globalState.confidenceHistory.slice(-globalState.maxConfidenceHistorySize);
    }
  }
  
  if (config.maxQualityHistorySize !== undefined) {
    globalState.maxQualityHistorySize = config.maxQualityHistorySize;
    if (globalState.qualityHistory.length > globalState.maxQualityHistorySize) {
      globalState.qualityHistory = globalState.qualityHistory.slice(-globalState.maxQualityHistorySize);
    }
  }
  
  console.log('[Fusion State] Buffer sizes updated', config);
}

/**
 * Reset to initial state
 */
export function resetFusionState(): void {
  globalState = { ...initialState };
  console.log('[Fusion State] State reset to initial');
}

/**
 * Get complete state snapshot
 */
export function getStateSnapshot(): {
  decisions: FusionDecision[];
  conflictLogs: ConflictLog[];
  confidenceHistory: ConfidenceEntry[];
  qualityHistory: QualityMetrics[];
  statistics: ReturnType<typeof getFusionStats>;
  performance: ReturnType<typeof getPerformanceSummary>;
} {
  return {
    decisions: getFusionDecisions(),
    conflictLogs: getConflictLogs(),
    confidenceHistory: getConfidenceHistory(),
    qualityHistory: getQualityHistory(),
    statistics: getFusionStats(),
    performance: getPerformanceSummary(),
  };
}

/**
 * Export state to JSON
 */
export function exportFusionState(): string {
  return JSON.stringify(getStateSnapshot(), null, 2);
}

/**
 * Import state from JSON
 */
export function importFusionState(jsonState: string): void {
  try {
    const state = JSON.parse(jsonState);
    globalState.decisions = state.decisions || [];
    globalState.conflictLogs = state.conflictLogs || [];
    globalState.confidenceHistory = state.confidenceHistory || [];
    globalState.qualityHistory = state.qualityHistory || [];
    console.log('[Fusion State] State imported successfully');
  } catch (error) {
    console.error('[Fusion State] Failed to import state:', error);
    throw error;
  }
}

/**
 * Export for convenience
 */
export const FusionState = {
  // Decisions
  addDecision: addFusionDecision,
  getDecisions: getFusionDecisions,
  getRecentDecisions,
  getLastDecision,
  getDecisionsByAction,
  getDecisionsInTimeRange,
  getHighConfidenceDecisions,
  
  // Conflicts
  addConflictLog,
  getConflictLogs,
  getRecentConflictLogs,
  getConflictLogsByMethod,
  getTotalConflictsResolved,
  
  // Confidence
  getConfidenceHistory,
  getRecentConfidence,
  getAverageConfidence,
  getConfidenceTrend,
  
  // Quality
  getQualityHistory,
  getRecentQuality,
  getAverageQuality,
  getFusionQualityTrend,
  
  // Statistics
  getStats: getFusionStats,
  getActionFrequency,
  getConflictResolutionEffectiveness,
  getPerformanceSummary,
  
  // State management
  getSnapshot: getStateSnapshot,
  clear: clearFusionHistory,
  clearDecisions,
  clearConflictLogs,
  updateBufferSizes,
  reset: resetFusionState,
  export: exportFusionState,
  import: importFusionState,
};

export default FusionState;
