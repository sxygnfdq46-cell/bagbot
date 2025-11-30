/**
 * MFAE State - Global State Manager
 * 
 * Manages global state for Market Flow Anticipation Engine.
 * Tracks snapshots, flow results, and performance metrics.
 */

import type {
  FlowSnapshot,
  FlowIntentResult,
  FlowIntent,
} from '@/app/lib/intelligence/flowTypes';

/**
 * Global MFAE state
 */
interface GlobalMFAEState {
  snapshots: FlowSnapshot[];          // Last N snapshots (circular buffer)
  results: FlowIntentResult[];        // Last N results (circular buffer)
  maxSnapshotSize: number;            // Max snapshots to keep
  maxResultSize: number;              // Max results to keep
}

/**
 * Initial state
 */
const initialState: GlobalMFAEState = {
  snapshots: [],
  results: [],
  maxSnapshotSize: 200,    // Keep last 200 snapshots
  maxResultSize: 200,      // Keep last 200 results
};

/**
 * Global state instance
 */
let globalState: GlobalMFAEState = { ...initialState };

// ============================================================================
// Snapshot Management
// ============================================================================

/**
 * Add flow snapshot to history
 */
export function addFlowSnapshot(snapshot: FlowSnapshot): void {
  globalState.snapshots.push(snapshot);
  
  // Maintain circular buffer
  if (globalState.snapshots.length > globalState.maxSnapshotSize) {
    globalState.snapshots.shift();
  }
}

/**
 * Get all snapshots in history
 */
export function getSnapshotHistory(): FlowSnapshot[] {
  return [...globalState.snapshots];
}

/**
 * Get last N snapshots
 */
export function getLastNSnapshots(n: number): FlowSnapshot[] {
  const start = Math.max(0, globalState.snapshots.length - n);
  return globalState.snapshots.slice(start);
}

/**
 * Get last snapshot
 */
export function getLastSnapshot(): FlowSnapshot | null {
  return globalState.snapshots[globalState.snapshots.length - 1] || null;
}

/**
 * Get snapshots within time range
 */
export function getSnapshotsInTimeRange(
  startTime: number,
  endTime: number
): FlowSnapshot[] {
  return globalState.snapshots.filter(
    s => s.timestamp >= startTime && s.timestamp <= endTime
  );
}

/**
 * Get average tick velocity
 */
export function getAverageTickVelocity(): number {
  if (globalState.snapshots.length === 0) return 0;
  
  const sum = globalState.snapshots.reduce((acc, s) => acc + s.tickVelocity, 0);
  return sum / globalState.snapshots.length;
}

/**
 * Get average bid/ask depth
 */
export function getAverageDepth(): { avgBidDepth: number; avgAskDepth: number } {
  if (globalState.snapshots.length === 0) {
    return { avgBidDepth: 0, avgAskDepth: 0 };
  }
  
  const bidSum = globalState.snapshots.reduce((acc, s) => acc + s.bidDepth, 0);
  const askSum = globalState.snapshots.reduce((acc, s) => acc + s.askDepth, 0);
  
  return {
    avgBidDepth: bidSum / globalState.snapshots.length,
    avgAskDepth: askSum / globalState.snapshots.length,
  };
}

// ============================================================================
// Result Management
// ============================================================================

/**
 * Add flow result to history
 */
export function addFlowResult(result: FlowIntentResult): void {
  globalState.results.push(result);
  
  // Maintain circular buffer
  if (globalState.results.length > globalState.maxResultSize) {
    globalState.results.shift();
  }
}

/**
 * Get all results in history
 */
export function getResultHistory(): FlowIntentResult[] {
  return [...globalState.results];
}

/**
 * Get last N results
 */
export function getLastNResults(n: number): FlowIntentResult[] {
  const start = Math.max(0, globalState.results.length - n);
  return globalState.results.slice(start);
}

/**
 * Get last result
 */
export function getLastResult(): FlowIntentResult | null {
  return globalState.results[globalState.results.length - 1] || null;
}

/**
 * Get results by intent
 */
export function getResultsByIntent(intent: FlowIntent): FlowIntentResult[] {
  return globalState.results.filter(r => r.flowIntent === intent);
}

/**
 * Get results within time range
 */
export function getResultsInTimeRange(
  startTime: number,
  endTime: number
): FlowIntentResult[] {
  return globalState.results.filter(
    r => r.timestamp >= startTime && r.timestamp <= endTime
  );
}

/**
 * Count results by intent
 */
export function countResultsByIntent(): Record<string, number> {
  const counts: Record<string, number> = {
    BULLISH: 0,
    BEARISH: 0,
    STALLED: 0,
    FAKE_MOVE: 0,
  };
  
  globalState.results.forEach(r => {
    counts[r.flowIntent]++;
  });
  
  return counts;
}

/**
 * Get average confidence
 */
export function getAverageConfidence(): number {
  if (globalState.results.length === 0) return 0;
  
  const sum = globalState.results.reduce((acc, r) => acc + r.confidence, 0);
  return sum / globalState.results.length;
}

/**
 * Get average flow score
 */
export function getAverageFlowScore(): number {
  if (globalState.results.length === 0) return 0;
  
  const sum = globalState.results.reduce((acc, r) => acc + r.metrics.flowScore, 0);
  return sum / globalState.results.length;
}

/**
 * Get fake-out rate (% of results that are fake moves)
 */
export function getFakeoutRate(): number {
  if (globalState.results.length === 0) return 0;
  
  const fakeCount = globalState.results.filter(r => r.flowIntent === "FAKE_MOVE").length;
  return fakeCount / globalState.results.length;
}

/**
 * Get liquidity crisis count
 */
export function getLiquidityCrisisCount(): number {
  return globalState.results.filter(r => r.liquidityCrisis).length;
}

/**
 * Get momentum shift count
 */
export function getMomentumShiftCount(): number {
  return globalState.results.filter(r => r.momentumShift).length;
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

/**
 * Get comprehensive flow statistics
 */
export function getFlowStats(): {
  totalSnapshots: number;
  totalResults: number;
  intentCounts: Record<string, number>;
  avgConfidence: number;
  avgFlowScore: number;
  fakeoutRate: number;
  liquidityCrisisCount: number;
  momentumShiftCount: number;
  avgTickVelocity: number;
  avgDepth: { avgBidDepth: number; avgAskDepth: number };
  avgMetrics: {
    avgTickAccel: number;
    avgLiquidityTension: number;
    avgImbalancePressure: number;
    avgMicroVolatility: number;
  };
} {
  const intentCounts = countResultsByIntent();
  const avgDepth = getAverageDepth();
  
  // Calculate average metrics
  let avgTickAccel = 0;
  let avgLiquidityTension = 0;
  let avgImbalancePressure = 0;
  let avgMicroVolatility = 0;
  
  if (globalState.results.length > 0) {
    avgTickAccel = globalState.results.reduce((acc, r) => acc + r.tickAccel, 0) / globalState.results.length;
    avgLiquidityTension = globalState.results.reduce((acc, r) => acc + r.liquidityTension, 0) / globalState.results.length;
    avgImbalancePressure = globalState.results.reduce((acc, r) => acc + r.imbalancePressure, 0) / globalState.results.length;
    avgMicroVolatility = globalState.results.reduce((acc, r) => acc + r.microVolatility, 0) / globalState.results.length;
  }
  
  return {
    totalSnapshots: globalState.snapshots.length,
    totalResults: globalState.results.length,
    intentCounts,
    avgConfidence: getAverageConfidence(),
    avgFlowScore: getAverageFlowScore(),
    fakeoutRate: getFakeoutRate(),
    liquidityCrisisCount: getLiquidityCrisisCount(),
    momentumShiftCount: getMomentumShiftCount(),
    avgTickVelocity: getAverageTickVelocity(),
    avgDepth,
    avgMetrics: {
      avgTickAccel,
      avgLiquidityTension,
      avgImbalancePressure,
      avgMicroVolatility,
    },
  };
}

/**
 * Get flow trend analysis
 */
export function getFlowTrend(windowSize: number = 20): {
  recentIntent: FlowIntent | null;
  intentStability: number;       // 0-100 (how consistent is the intent)
  avgRecentConfidence: number;
  trendDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
  isStrengthening: boolean;
} {
  const recent = getLastNResults(windowSize);
  
  if (recent.length === 0) {
    return {
      recentIntent: null,
      intentStability: 0,
      avgRecentConfidence: 0,
      trendDirection: "NEUTRAL",
      isStrengthening: false,
    };
  }
  
  // Most common recent intent
  const intentCounts: Record<string, number> = {};
  recent.forEach(r => {
    intentCounts[r.flowIntent] = (intentCounts[r.flowIntent] || 0) + 1;
  });
  
  const mostCommon = Object.entries(intentCounts).reduce((a, b) => 
    b[1] > a[1] ? b : a
  );
  const recentIntent = mostCommon[0] as FlowIntent;
  const intentStability = (mostCommon[1] / recent.length) * 100;
  
  // Average recent confidence
  const avgRecentConfidence = recent.reduce((acc, r) => acc + r.confidence, 0) / recent.length;
  
  // Trend direction from flow scores
  const bullishCount = recent.filter(r => r.metrics.flowDirection === "BULLISH").length;
  const bearishCount = recent.filter(r => r.metrics.flowDirection === "BEARISH").length;
  
  let trendDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
  if (bullishCount > bearishCount * 1.5) trendDirection = "BULLISH";
  else if (bearishCount > bullishCount * 1.5) trendDirection = "BEARISH";
  else trendDirection = "NEUTRAL";
  
  // Check if strengthening (increasing confidence)
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const avgFirstHalf = firstHalf.reduce((acc, r) => acc + r.confidence, 0) / firstHalf.length;
  const avgSecondHalf = secondHalf.reduce((acc, r) => acc + r.confidence, 0) / secondHalf.length;
  
  const isStrengthening = avgSecondHalf > avgFirstHalf + 5; // 5 point increase
  
  return {
    recentIntent,
    intentStability: Math.round(intentStability),
    avgRecentConfidence: Math.round(avgRecentConfidence),
    trendDirection,
    isStrengthening,
  };
}

/**
 * Detect flow anomalies
 */
export function detectFlowAnomalies(): {
  hasAnomalies: boolean;
  anomalies: string[];
} {
  const anomalies: string[] = [];
  
  if (globalState.results.length < 10) {
    return { hasAnomalies: false, anomalies: [] };
  }
  
  const recent = getLastNResults(10);
  const stats = getFlowStats();
  
  // Anomaly 1: High fake-out rate
  const recentFakeouts = recent.filter(r => r.flowIntent === "FAKE_MOVE").length;
  if (recentFakeouts >= 4) { // 40%+ fake-outs
    anomalies.push(`High fake-out rate: ${recentFakeouts}/10 recent analyses`);
  }
  
  // Anomaly 2: Multiple liquidity crises
  const recentCrises = recent.filter(r => r.liquidityCrisis).length;
  if (recentCrises >= 3) {
    anomalies.push(`Multiple liquidity crises: ${recentCrises}/10`);
  }
  
  // Anomaly 3: Frequent momentum shifts
  const recentShifts = recent.filter(r => r.momentumShift).length;
  if (recentShifts >= 5) {
    anomalies.push(`Frequent momentum shifts: ${recentShifts}/10`);
  }
  
  // Anomaly 4: Extreme volatility
  const avgVolatility = recent.reduce((acc, r) => acc + r.microVolatility, 0) / recent.length;
  if (avgVolatility > 80) {
    anomalies.push(`Extreme volatility: ${avgVolatility.toFixed(1)}/100`);
  }
  
  // Anomaly 5: Extreme tension
  const avgTension = recent.reduce((acc, r) => acc + r.liquidityTension, 0) / recent.length;
  if (avgTension > 75) {
    anomalies.push(`Extreme liquidity tension: ${avgTension.toFixed(1)}/100`);
  }
  
  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
  };
}

/**
 * Get flow health score (0-100)
 */
export function getFlowHealthScore(): number {
  if (globalState.results.length === 0) return 100;
  
  let score = 100;
  const stats = getFlowStats();
  
  // Deduct for high fake-out rate
  if (stats.fakeoutRate > 0.3) score -= 30; // >30%
  else if (stats.fakeoutRate > 0.15) score -= 15; // >15%
  
  // Deduct for liquidity crises
  const crisisRate = stats.liquidityCrisisCount / stats.totalResults;
  if (crisisRate > 0.2) score -= 25; // >20%
  else if (crisisRate > 0.1) score -= 10; // >10%
  
  // Deduct for low confidence
  if (stats.avgConfidence < 50) score -= 20;
  else if (stats.avgConfidence < 65) score -= 10;
  
  // Deduct for high volatility
  if (stats.avgMetrics.avgMicroVolatility > 70) score -= 15;
  else if (stats.avgMetrics.avgMicroVolatility > 55) score -= 5;
  
  // Deduct for high tension
  if (stats.avgMetrics.avgLiquidityTension > 70) score -= 15;
  else if (stats.avgMetrics.avgLiquidityTension > 55) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Get complete state snapshot
 */
export function getStateSnapshot(): {
  snapshots: FlowSnapshot[];
  results: FlowIntentResult[];
  statistics: ReturnType<typeof getFlowStats>;
  trend: ReturnType<typeof getFlowTrend>;
  anomalies: ReturnType<typeof detectFlowAnomalies>;
  healthScore: number;
} {
  return {
    snapshots: getSnapshotHistory(),
    results: getResultHistory(),
    statistics: getFlowStats(),
    trend: getFlowTrend(),
    anomalies: detectFlowAnomalies(),
    healthScore: getFlowHealthScore(),
  };
}

/**
 * Clear all flow history
 */
export function clearFlowHistory(): void {
  globalState.snapshots = [];
  globalState.results = [];
  console.log('[MFAE State] All flow history cleared');
}

/**
 * Clear only snapshots
 */
export function clearSnapshots(): void {
  globalState.snapshots = [];
  console.log('[MFAE State] Snapshot history cleared');
}

/**
 * Clear only results
 */
export function clearResults(): void {
  globalState.results = [];
  console.log('[MFAE State] Result history cleared');
}

/**
 * Update buffer sizes
 */
export function updateBufferSizes(config: {
  maxSnapshotSize?: number;
  maxResultSize?: number;
}): void {
  if (config.maxSnapshotSize !== undefined) {
    globalState.maxSnapshotSize = config.maxSnapshotSize;
    // Trim if needed
    if (globalState.snapshots.length > globalState.maxSnapshotSize) {
      globalState.snapshots = globalState.snapshots.slice(-globalState.maxSnapshotSize);
    }
  }
  
  if (config.maxResultSize !== undefined) {
    globalState.maxResultSize = config.maxResultSize;
    if (globalState.results.length > globalState.maxResultSize) {
      globalState.results = globalState.results.slice(-globalState.maxResultSize);
    }
  }
  
  console.log('[MFAE State] Buffer sizes updated', config);
}

/**
 * Reset to initial state
 */
export function resetMFAEState(): void {
  globalState = { ...initialState };
  console.log('[MFAE State] State reset to initial');
}

/**
 * Export state to JSON
 */
export function exportMFAEState(): string {
  return JSON.stringify(getStateSnapshot(), null, 2);
}

/**
 * Import state from JSON
 */
export function importMFAEState(jsonState: string): void {
  try {
    const state = JSON.parse(jsonState);
    globalState.snapshots = state.snapshots || [];
    globalState.results = state.results || [];
    console.log('[MFAE State] State imported successfully');
  } catch (error) {
    console.error('[MFAE State] Failed to import state:', error);
    throw error;
  }
}

/**
 * Export for convenience
 */
export const MFAEState = {
  // Snapshots
  addSnapshot: addFlowSnapshot,
  getSnapshots: getSnapshotHistory,
  getLastNSnapshots,
  getLastSnapshot,
  getSnapshotsInTimeRange,
  
  // Results
  addResult: addFlowResult,
  getResults: getResultHistory,
  getLastNResults,
  getLastResult,
  getResultsByIntent,
  getResultsInTimeRange,
  
  // Statistics
  getStats: getFlowStats,
  getTrend: getFlowTrend,
  getAnomalies: detectFlowAnomalies,
  getHealthScore: getFlowHealthScore,
  
  // State
  getSnapshot: getStateSnapshot,
  clear: clearFlowHistory,
  clearSnapshots,
  clearResults,
  updateBufferSizes,
  reset: resetMFAEState,
  export: exportMFAEState,
  import: importMFAEState,
};

export default MFAEState;
