/**
 * DVBE State - Global State Manager
 * 
 * Manages global state for Dynamic Volatility Behavior Engine.
 * Tracks volatility states, phase transitions, and behavior patterns.
 */

import type {
  BehaviorResult,
  PhaseTransition,
  VolatilityStats,
  VolatilityPhase,
  VolatilityBehavior,
  VolatilityTrend,
  BehaviorPattern,
  VolatilityAnomaly,
} from '@/app/lib/intelligence/volatilityTypes';

/**
 * Global DVBE state
 */
interface GlobalDVBEState {
  states: BehaviorResult[];             // Last N volatility states (circular buffer)
  transitions: PhaseTransition[];       // Phase transition history
  anomalies: VolatilityAnomaly[];       // Detected anomalies
  maxStatesSize: number;                // Max states to keep
  maxTransitionsSize: number;           // Max transitions to keep
  maxAnomaliesSize: number;             // Max anomalies to keep
}

/**
 * Initial state
 */
const initialState: GlobalDVBEState = {
  states: [],
  transitions: [],
  anomalies: [],
  maxStatesSize: 300,           // Keep last 300 states
  maxTransitionsSize: 100,      // Keep last 100 transitions
  maxAnomaliesSize: 50,         // Keep last 50 anomalies
};

/**
 * Global state instance
 */
let globalState: GlobalDVBEState = { ...initialState };

// ============================================================================
// State Management
// ============================================================================

/**
 * Add volatility state to history
 */
export function addVolatilityState(state: BehaviorResult): void {
  globalState.states.push(state);
  
  // Maintain circular buffer
  if (globalState.states.length > globalState.maxStatesSize) {
    globalState.states.shift();
  }
  
  // Check for anomalies
  const anomaly = detectAnomaly(state);
  if (anomaly) {
    addAnomaly(anomaly);
  }
}

/**
 * Get all volatility states
 */
export function getVolatilityStates(): BehaviorResult[] {
  return [...globalState.states];
}

/**
 * Get last N states
 */
export function getLastNStates(n: number): BehaviorResult[] {
  const start = Math.max(0, globalState.states.length - n);
  return globalState.states.slice(start);
}

/**
 * Get last state
 */
export function getLastState(): BehaviorResult | null {
  return globalState.states[globalState.states.length - 1] || null;
}

/**
 * Get states by phase
 */
export function getStatesByPhase(phase: VolatilityPhase): BehaviorResult[] {
  return globalState.states.filter(s => s.phase === phase);
}

/**
 * Get states by behavior
 */
export function getStatesByBehavior(behavior: VolatilityBehavior): BehaviorResult[] {
  return globalState.states.filter(s => s.behavior === behavior);
}

/**
 * Get states within time range
 */
export function getStatesInTimeRange(
  startTime: number,
  endTime: number
): BehaviorResult[] {
  return globalState.states.filter(
    s => s.timestamp >= startTime && s.timestamp <= endTime
  );
}

// ============================================================================
// Phase Transition Management
// ============================================================================

/**
 * Add phase transition
 */
export function addPhaseTransition(transition: PhaseTransition): void {
  // Calculate duration if possible
  const lastTransition = globalState.transitions[globalState.transitions.length - 1];
  if (lastTransition && lastTransition.toPhase === transition.fromPhase) {
    transition.duration = transition.timestamp - lastTransition.timestamp;
  }
  
  globalState.transitions.push(transition);
  
  // Maintain circular buffer
  if (globalState.transitions.length > globalState.maxTransitionsSize) {
    globalState.transitions.shift();
  }
}

/**
 * Get all phase transitions
 */
export function getPhaseTransitions(): PhaseTransition[] {
  return [...globalState.transitions];
}

/**
 * Get recent transitions
 */
export function getRecentTransitions(n: number): PhaseTransition[] {
  const start = Math.max(0, globalState.transitions.length - n);
  return globalState.transitions.slice(start);
}

/**
 * Get last transition
 */
export function getLastTransition(): PhaseTransition | null {
  return globalState.transitions[globalState.transitions.length - 1] || null;
}

/**
 * Get transitions to specific phase
 */
export function getTransitionsToPhase(phase: VolatilityPhase): PhaseTransition[] {
  return globalState.transitions.filter(t => t.toPhase === phase);
}

/**
 * Get transitions from specific phase
 */
export function getTransitionsFromPhase(phase: VolatilityPhase): PhaseTransition[] {
  return globalState.transitions.filter(t => t.fromPhase === phase);
}

/**
 * Get average phase duration
 */
export function getAveragePhaseDuration(phase: VolatilityPhase): number {
  const transitions = getTransitionsFromPhase(phase);
  if (transitions.length === 0) return 0;
  
  const sum = transitions.reduce((acc, t) => acc + t.duration, 0);
  return sum / transitions.length;
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

/**
 * Get comprehensive volatility statistics
 */
export function getVolatilityStats(): VolatilityStats {
  if (globalState.states.length === 0) {
    return {
      currentBehavior: "UNKNOWN",
      currentPhase: "CALM",
      currentSeverity: 0,
      avgVolatility: 0,
      avgSeverity: 0,
      avgPhaseChangeProb: 0,
      totalStates: 0,
      totalTransitions: 0,
      behaviorCounts: {} as Record<VolatilityBehavior, number>,
      phaseCounts: {} as Record<VolatilityPhase, number>,
      explosionCount: 0,
      shockwaveCount: 0,
      liquidityEvapCount: 0,
      criticalPhaseCount: 0,
      avgPhaseDuration: 0,
      longestPhaseDuration: 0,
      shortestPhaseDuration: 0,
      predictionAccuracy: 0,
      falsePositiveRate: 0,
    };
  }
  
  const lastState = globalState.states[globalState.states.length - 1];
  
  // Count behaviors
  const behaviorCounts: Record<string, number> = {};
  const phaseCounts: Record<string, number> = {};
  
  globalState.states.forEach(s => {
    behaviorCounts[s.behavior] = (behaviorCounts[s.behavior] || 0) + 1;
    phaseCounts[s.phase] = (phaseCounts[s.phase] || 0) + 1;
  });
  
  // Calculate averages
  const avgSeverity = globalState.states.reduce((acc, s) => acc + s.severity, 0) / globalState.states.length;
  const avgPhaseChangeProb = globalState.states.reduce((acc, s) => acc + s.phaseChangeProb, 0) / globalState.states.length;
  
  // Count critical events
  const explosionCount = globalState.states.filter(s => s.isExplosive).length;
  const shockwaveCount = globalState.states.filter(s => s.isShockwave).length;
  const liquidityEvapCount = globalState.states.filter(s => s.isLiquidityEvap).length;
  const criticalPhaseCount = globalState.states.filter(s => s.phase === "CRITICAL").length;
  
  // Calculate phase durations
  const durations = globalState.transitions
    .filter(t => t.duration > 0)
    .map(t => t.duration);
  
  const avgPhaseDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  
  const longestPhaseDuration = durations.length > 0 ? Math.max(...durations) : 0;
  const shortestPhaseDuration = durations.length > 0 ? Math.min(...durations) : 0;
  
  // Calculate prediction accuracy
  const predictedTransitions = globalState.transitions.filter(t => t.wasPredicted);
  const predictionAccuracy = predictedTransitions.length > 0
    ? predictedTransitions.reduce((acc, t) => acc + (t.predictionAccuracy || 0), 0) / predictedTransitions.length
    : 0;
  
  // Calculate false positive rate (fake spikes that didn't revert)
  const fakeSpikes = globalState.states.filter(s => s.isFakeSpike);
  const falsePositives = fakeSpikes.filter(s => !s.isReverting).length;
  const falsePositiveRate = fakeSpikes.length > 0 ? (falsePositives / fakeSpikes.length) * 100 : 0;
  
  return {
    currentBehavior: lastState.behavior,
    currentPhase: lastState.phase,
    currentSeverity: lastState.severity,
    avgVolatility: avgSeverity, // Using severity as volatility proxy
    avgSeverity,
    avgPhaseChangeProb,
    totalStates: globalState.states.length,
    totalTransitions: globalState.transitions.length,
    behaviorCounts: behaviorCounts as Record<VolatilityBehavior, number>,
    phaseCounts: phaseCounts as Record<VolatilityPhase, number>,
    explosionCount,
    shockwaveCount,
    liquidityEvapCount,
    criticalPhaseCount,
    avgPhaseDuration,
    longestPhaseDuration,
    shortestPhaseDuration,
    predictionAccuracy,
    falsePositiveRate,
  };
}

/**
 * Get volatility trend
 */
export function getVolatilityTrend(windowSize: number = 20): VolatilityTrend {
  const recent = getLastNStates(windowSize);
  
  if (recent.length < 3) {
    return {
      direction: "STABLE",
      strength: 0,
      consistency: 0,
      duration: 0,
      projectedVol: 0,
      projectedPhase: "CALM",
      confidenceInterval: [0, 0],
    };
  }
  
  // Calculate direction
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));
  
  const avgFirst = firstHalf.reduce((acc, s) => acc + s.severity, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((acc, s) => acc + s.severity, 0) / secondHalf.length;
  
  const diff = avgSecond - avgFirst;
  
  let direction: "INCREASING" | "DECREASING" | "STABLE" | "OSCILLATING";
  if (Math.abs(diff) < 5) {
    direction = "STABLE";
  } else if (diff > 0) {
    direction = "INCREASING";
  } else {
    direction = "DECREASING";
  }
  
  // Check for oscillation
  const changes = recent.slice(1).filter((s, i) => {
    const prev = recent[i];
    return Math.abs(s.severity - prev.severity) > 10;
  });
  
  if (changes.length > windowSize * 0.6) {
    direction = "OSCILLATING";
  }
  
  // Calculate strength
  const strength = Math.min(100, Math.abs(diff) * 2);
  
  // Calculate consistency
  const isConsistent = recent.every((s, i) => {
    if (i === 0) return true;
    const prev = recent[i - 1];
    if (direction === "INCREASING") return s.severity >= prev.severity - 5;
    if (direction === "DECREASING") return s.severity <= prev.severity + 5;
    return true;
  });
  
  const consistency = isConsistent ? 80 : 40;
  
  // Calculate duration
  const lastState = recent[recent.length - 1];
  const firstState = recent[0];
  const duration = lastState.timestamp - firstState.timestamp;
  
  // Project next volatility
  const currentVol = lastState.severity;
  const projectedVol = Math.max(0, Math.min(100, currentVol + (diff * 1.5)));
  
  // Project phase
  let projectedPhase: VolatilityPhase = lastState.phase;
  if (projectedVol > 85) projectedPhase = "CRITICAL";
  else if (projectedVol > 70) projectedPhase = "EXPLOSIVE";
  else if (projectedVol > 50) projectedPhase = "ACTIVE";
  else if (projectedVol > 30) projectedPhase = "WARMING";
  else projectedPhase = "CALM";
  
  // Confidence interval
  const stdDev = Math.sqrt(
    recent.reduce((acc, s) => acc + Math.pow(s.severity - avgSecond, 2), 0) / recent.length
  );
  
  const confidenceInterval: [number, number] = [
    Math.max(0, projectedVol - stdDev * 2),
    Math.min(100, projectedVol + stdDev * 2),
  ];
  
  return {
    direction,
    strength: Math.round(strength),
    consistency: Math.round(consistency),
    duration,
    projectedVol: Math.round(projectedVol),
    projectedPhase,
    confidenceInterval: [
      Math.round(confidenceInterval[0]),
      Math.round(confidenceInterval[1]),
    ],
  };
}

/**
 * Get behavior patterns
 */
export function getBehaviorPatterns(): BehaviorPattern[] {
  if (globalState.states.length < 20) return [];
  
  const patterns: Map<VolatilityBehavior, BehaviorPattern> = new Map();
  
  globalState.states.forEach((state, i) => {
    if (!patterns.has(state.behavior)) {
      patterns.set(state.behavior, {
        patternId: `pattern_${state.behavior}`,
        behavior: state.behavior,
        frequency: 0,
        avgDuration: 0,
        avgSeverity: 0,
        typicalStartPhase: state.phase,
        typicalEndPhase: state.phase,
        commonTriggers: [],
        nextBehaviorProb: {} as Record<VolatilityBehavior, number>,
        nextPhaseProb: {} as Record<VolatilityPhase, number>,
      });
    }
    
    const pattern = patterns.get(state.behavior)!;
    pattern.frequency++;
    pattern.avgSeverity = (pattern.avgSeverity * (pattern.frequency - 1) + state.severity) / pattern.frequency;
    
    // Track next behavior
    if (i < globalState.states.length - 1) {
      const nextBehavior = globalState.states[i + 1].behavior;
      pattern.nextBehaviorProb[nextBehavior] = (pattern.nextBehaviorProb[nextBehavior] || 0) + 1;
    }
  });
  
  return Array.from(patterns.values());
}

/**
 * Get volatility environment classification
 */
export function getVolatilityEnvironment(): {
  environment: "STABLE" | "VOLATILE" | "EXTREME" | "UNPREDICTABLE";
  environmentScore: number;
} {
  const stats = getVolatilityStats();
  const trend = getVolatilityTrend();
  
  let score = 50; // Baseline
  
  // Adjust for current severity
  score += (stats.currentSeverity - 50) * 0.4;
  
  // Adjust for critical events
  if (stats.shockwaveCount > 5) score += 20;
  if (stats.explosionCount > 10) score += 15;
  if (stats.criticalPhaseCount > 5) score += 15;
  
  // Adjust for trend
  if (trend.direction === "INCREASING" && trend.strength > 60) score += 10;
  if (trend.direction === "OSCILLATING") score += 15;
  
  score = Math.max(0, Math.min(100, score));
  
  let environment: "STABLE" | "VOLATILE" | "EXTREME" | "UNPREDICTABLE";
  if (score < 40) environment = "STABLE";
  else if (score < 60) environment = "VOLATILE";
  else if (score < 80) environment = "EXTREME";
  else environment = "UNPREDICTABLE";
  
  return {
    environment,
    environmentScore: Math.round(score),
  };
}

// ============================================================================
// Anomaly Management
// ============================================================================

/**
 * Detect anomaly from state
 */
function detectAnomaly(state: BehaviorResult): VolatilityAnomaly | null {
  const stats = getVolatilityStats();
  
  // Anomaly 1: Sudden explosion
  if (state.isExplosive && state.metrics.explosionScore > 90) {
    return {
      timestamp: state.timestamp,
      anomalyType: "sudden_explosion",
      severity: state.metrics.explosionScore,
      description: `Sudden explosion detected: ${state.metrics.explosionTrigger || 'unknown trigger'}`,
      currentBehavior: state.behavior,
      currentPhase: state.phase,
      expectedBehavior: null,
      riskImpact: "CRITICAL",
      tradingImpact: "Halt trading immediately",
      resolved: false,
      resolutionTime: null,
    };
  }
  
  // Anomaly 2: Shockwave
  if (state.isShockwave) {
    return {
      timestamp: state.timestamp,
      anomalyType: "shockwave",
      severity: state.metrics.shockwaveScore,
      description: `Market shockwave: ${state.metrics.shockwaveOrigin || 'unknown origin'}`,
      currentBehavior: state.behavior,
      currentPhase: state.phase,
      expectedBehavior: null,
      riskImpact: "CRITICAL",
      tradingImpact: "Halt all trading activity",
      resolved: false,
      resolutionTime: null,
    };
  }
  
  // Anomaly 3: Liquidity crisis
  if (state.isLiquidityEvap && state.metrics.liquidityEvapScore > 80) {
    return {
      timestamp: state.timestamp,
      anomalyType: "liquidity_crisis",
      severity: state.metrics.liquidityEvapScore,
      description: "Severe liquidity evaporation detected",
      currentBehavior: state.behavior,
      currentPhase: state.phase,
      expectedBehavior: null,
      riskImpact: "HIGH",
      tradingImpact: "Pause trading until liquidity recovers",
      resolved: false,
      resolutionTime: state.metrics.recoveryTime,
    };
  }
  
  return null;
}

/**
 * Add anomaly
 */
export function addAnomaly(anomaly: VolatilityAnomaly): void {
  globalState.anomalies.push(anomaly);
  
  // Maintain circular buffer
  if (globalState.anomalies.length > globalState.maxAnomaliesSize) {
    globalState.anomalies.shift();
  }
}

/**
 * Get all anomalies
 */
export function getAnomalies(): VolatilityAnomaly[] {
  return [...globalState.anomalies];
}

/**
 * Get unresolved anomalies
 */
export function getUnresolvedAnomalies(): VolatilityAnomaly[] {
  return globalState.anomalies.filter(a => !a.resolved);
}

/**
 * Resolve anomaly
 */
export function resolveAnomaly(timestamp: number): void {
  const anomaly = globalState.anomalies.find(a => a.timestamp === timestamp);
  if (anomaly) {
    anomaly.resolved = true;
    anomaly.resolutionTime = Date.now();
  }
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Clear all volatility history
 */
export function clearVolatilityHistory(): void {
  globalState.states = [];
  globalState.transitions = [];
  globalState.anomalies = [];
  console.log('[DVBE State] All volatility history cleared');
}

/**
 * Clear only states
 */
export function clearStates(): void {
  globalState.states = [];
  console.log('[DVBE State] State history cleared');
}

/**
 * Clear only transitions
 */
export function clearTransitions(): void {
  globalState.transitions = [];
  console.log('[DVBE State] Transition history cleared');
}

/**
 * Clear only anomalies
 */
export function clearAnomalies(): void {
  globalState.anomalies = [];
  console.log('[DVBE State] Anomaly history cleared');
}

/**
 * Update buffer sizes
 */
export function updateBufferSizes(config: {
  maxStatesSize?: number;
  maxTransitionsSize?: number;
  maxAnomaliesSize?: number;
}): void {
  if (config.maxStatesSize !== undefined) {
    globalState.maxStatesSize = config.maxStatesSize;
    if (globalState.states.length > globalState.maxStatesSize) {
      globalState.states = globalState.states.slice(-globalState.maxStatesSize);
    }
  }
  
  if (config.maxTransitionsSize !== undefined) {
    globalState.maxTransitionsSize = config.maxTransitionsSize;
    if (globalState.transitions.length > globalState.maxTransitionsSize) {
      globalState.transitions = globalState.transitions.slice(-globalState.maxTransitionsSize);
    }
  }
  
  if (config.maxAnomaliesSize !== undefined) {
    globalState.maxAnomaliesSize = config.maxAnomaliesSize;
    if (globalState.anomalies.length > globalState.maxAnomaliesSize) {
      globalState.anomalies = globalState.anomalies.slice(-globalState.maxAnomaliesSize);
    }
  }
  
  console.log('[DVBE State] Buffer sizes updated', config);
}

/**
 * Reset to initial state
 */
export function resetDVBEState(): void {
  globalState = { ...initialState };
  console.log('[DVBE State] State reset to initial');
}

/**
 * Get complete state snapshot
 */
export function getStateSnapshot(): {
  states: BehaviorResult[];
  transitions: PhaseTransition[];
  anomalies: VolatilityAnomaly[];
  statistics: VolatilityStats;
  trend: VolatilityTrend;
  patterns: BehaviorPattern[];
  environment: ReturnType<typeof getVolatilityEnvironment>;
} {
  return {
    states: getVolatilityStates(),
    transitions: getPhaseTransitions(),
    anomalies: getAnomalies(),
    statistics: getVolatilityStats(),
    trend: getVolatilityTrend(),
    patterns: getBehaviorPatterns(),
    environment: getVolatilityEnvironment(),
  };
}

/**
 * Export state to JSON
 */
export function exportDVBEState(): string {
  return JSON.stringify(getStateSnapshot(), null, 2);
}

/**
 * Import state from JSON
 */
export function importDVBEState(jsonState: string): void {
  try {
    const state = JSON.parse(jsonState);
    globalState.states = state.states || [];
    globalState.transitions = state.transitions || [];
    globalState.anomalies = state.anomalies || [];
    console.log('[DVBE State] State imported successfully');
  } catch (error) {
    console.error('[DVBE State] Failed to import state:', error);
    throw error;
  }
}

/**
 * Export for convenience
 */
export const DVBEState = {
  // States
  addState: addVolatilityState,
  getStates: getVolatilityStates,
  getLastNStates,
  getLastState,
  getStatesByPhase,
  getStatesByBehavior,
  getStatesInTimeRange,
  
  // Transitions
  addTransition: addPhaseTransition,
  getTransitions: getPhaseTransitions,
  getRecentTransitions,
  getLastTransition,
  getTransitionsToPhase,
  getTransitionsFromPhase,
  getAveragePhaseDuration,
  
  // Statistics
  getStats: getVolatilityStats,
  getTrend: getVolatilityTrend,
  getPatterns: getBehaviorPatterns,
  getEnvironment: getVolatilityEnvironment,
  
  // Anomalies
  getAnomalies,
  getUnresolvedAnomalies,
  resolveAnomaly,
  clearAnomalies,
  
  // State management
  getSnapshot: getStateSnapshot,
  clear: clearVolatilityHistory,
  clearStates,
  clearTransitions,
  updateBufferSizes,
  reset: resetDVBEState,
  export: exportDVBEState,
  import: importDVBEState,
};

export default DVBEState;
