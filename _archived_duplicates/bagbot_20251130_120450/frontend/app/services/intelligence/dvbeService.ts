/**
 * DVBE Service - Dynamic Volatility Behavior Engine Service
 * 
 * React service for volatility behavior analysis.
 * Provides event-driven interface for DVBE operations.
 */

import {
  getVolatilityBehaviorEngine,
  resetVolatilityBehaviorEngine,
} from '@/app/lib/intelligence/VolatilityBehaviorEngine';

import type {
  VolatilitySnapshot,
  BehaviorResult,
  VolatilityContext,
  VolatilityPhase,
  VolatilityBehavior,
  DVBEConfig,
} from '@/app/lib/intelligence/volatilityTypes';

import {
  addVolatilityState,
  addPhaseTransition,
  getVolatilityStats,
  getRecentTransitions,
  getVolatilityEnvironment,
} from '@/app/state/dvbeState';

/**
 * Event listener types
 */
type DVBEListener = (result: BehaviorResult) => void;
type PhaseChangeListener = (fromPhase: VolatilityPhase, toPhase: VolatilityPhase) => void;
type BehaviorDetectionListener = (behavior: VolatilityBehavior, result: BehaviorResult) => void;
type RiskLevelListener = (riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", result: BehaviorResult) => void;

/**
 * Event listeners
 */
const listeners = {
  onVolatilityAnalysis: [] as DVBEListener[],
  onPhaseChange: [] as PhaseChangeListener[],
  onExplosionDetected: [] as BehaviorDetectionListener[],
  onShockwaveDetected: [] as BehaviorDetectionListener[],
  onLiquidityEvapDetected: [] as BehaviorDetectionListener[],
  onCompressionDetected: [] as BehaviorDetectionListener[],
  onFakeSpikeDetected: [] as BehaviorDetectionListener[],
  onRiskLevelChange: [] as RiskLevelListener[],
  onTradingHalt: [] as DVBEListener[],
};

/**
 * Previous state for change detection
 */
let previousPhase: VolatilityPhase | null = null;
let previousRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null = null;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize DVBE
 */
export function initDVBE(config?: Partial<DVBEConfig>): void {
  const engine = getVolatilityBehaviorEngine(config);
  console.log('[DVBE Service] Initialized', engine.getConfig());
}

/**
 * Reset DVBE
 */
export function resetDVBE(): void {
  resetVolatilityBehaviorEngine();
  previousPhase = null;
  previousRiskLevel = null;
  console.log('[DVBE Service] Reset complete');
}

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Run DVBE analysis on snapshot
 */
export function runDVBE(snapshot: VolatilitySnapshot): BehaviorResult {
  const engine = getVolatilityBehaviorEngine();
  
  // Load snapshot
  engine.loadSnapshot(snapshot);
  
  // Get behavior summary
  const result = engine.getVolatilityBehaviorSummary();
  
  // Store in state
  addVolatilityState(result);
  
  // Detect phase change
  if (previousPhase && previousPhase !== result.phase) {
    const transition = {
      timestamp: result.timestamp,
      fromPhase: previousPhase,
      toPhase: result.phase,
      trigger: result.behavior,
      duration: 0, // Calculated by state manager
      severity: result.severity,
      volatilityLevel: snapshot.currentVol,
      behaviorAtTransition: result.behavior,
      wasPredicted: false,
      predictionAccuracy: null,
    };
    
    addPhaseTransition(transition);
    
    // Trigger phase change listeners
    listeners.onPhaseChange.forEach(fn => fn(previousPhase!, result.phase));
  }
  previousPhase = result.phase;
  
  // Detect risk level change
  if (previousRiskLevel && previousRiskLevel !== result.riskLevel) {
    listeners.onRiskLevelChange.forEach(fn => fn(result.riskLevel, result));
  }
  previousRiskLevel = result.riskLevel;
  
  // Trigger behavior-specific listeners
  if (result.isExplosive) {
    listeners.onExplosionDetected.forEach(fn => fn(result.behavior, result));
  }
  
  if (result.isShockwave) {
    listeners.onShockwaveDetected.forEach(fn => fn(result.behavior, result));
  }
  
  if (result.isLiquidityEvap) {
    listeners.onLiquidityEvapDetected.forEach(fn => fn(result.behavior, result));
  }
  
  if (result.isCompressing) {
    listeners.onCompressionDetected.forEach(fn => fn(result.behavior, result));
  }
  
  if (result.isFakeSpike) {
    listeners.onFakeSpikeDetected.forEach(fn => fn(result.behavior, result));
  }
  
  // Trigger trading halt if needed
  if (result.tradingAdvice === "HALT") {
    listeners.onTradingHalt.forEach(fn => fn(result));
  }
  
  // Trigger general analysis listeners
  listeners.onVolatilityAnalysis.forEach(fn => fn(result));
  
  return result;
}

/**
 * Get current volatility context
 */
export function getVolatilityContext(): VolatilityContext {
  const engine = getVolatilityBehaviorEngine();
  const snapshot = engine.getCurrentSnapshot();
  
  if (!snapshot) {
    throw new Error('[DVBE Service] No snapshot available');
  }
  
  // Get latest result
  const result = engine.getVolatilityBehaviorSummary();
  
  // Get state data
  const stats = getVolatilityStats();
  const recentTransitions = getRecentTransitions(10);
  const environment = getVolatilityEnvironment();
  
  // Determine if safe to trade
  const isSafeToTrade = 
    result.riskLevel !== "CRITICAL" &&
    result.tradingAdvice !== "HALT" &&
    !result.isShockwave &&
    environment.environment !== "EXTREME";
  
  // Calculate recommended position size
  let recommendedPositionSize = 100;
  if (result.riskLevel === "HIGH") recommendedPositionSize = 30;
  else if (result.riskLevel === "MEDIUM") recommendedPositionSize = 60;
  else if (result.tradingAdvice === "REDUCE") recommendedPositionSize = 70;
  else if (result.tradingAdvice === "PAUSE") recommendedPositionSize = 20;
  
  // Calculate risk multiplier
  const riskMultiplier = 1 + (result.severity / 100);
  
  // Collect warnings
  const warnings: string[] = [];
  if (result.isExplosive) warnings.push("Calm→Explosive transition detected");
  if (result.isShockwave) warnings.push("Market shockwave in progress");
  if (result.isLiquidityEvap) warnings.push("Liquidity evaporating rapidly");
  if (result.isCompressing) warnings.push("Volatility compression - breakout imminent");
  if (result.isFakeSpike) warnings.push("Fake spike detected - mean reversion likely");
  
  // Collect alerts
  const alerts: string[] = [];
  if (result.tradingAdvice === "HALT") alerts.push("TRADING HALTED - Critical conditions");
  if (result.phase === "CRITICAL") alerts.push("CRITICAL volatility phase");
  if (result.riskLevel === "CRITICAL") alerts.push("CRITICAL risk level");
  if (result.metrics.cascadeRisk > 80) alerts.push("High cascade risk detected");
  
  const context: VolatilityContext = {
    result,
    recentTransitions,
    stats,
    
    environment: environment.environment,
    environmentScore: environment.environmentScore,
    
    isSafeToTrade,
    recommendedPositionSize,
    riskMultiplier,
    
    warnings,
    alerts,
  };
  
  return context;
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Register listener for volatility analysis
 */
export function onVolatilityAnalysis(callback: DVBEListener): void {
  listeners.onVolatilityAnalysis.push(callback);
}

/**
 * Register listener for phase changes
 */
export function onPhaseChange(callback: PhaseChangeListener): void {
  listeners.onPhaseChange.push(callback);
}

/**
 * Register listener for explosion detection
 */
export function onExplosionDetected(callback: BehaviorDetectionListener): void {
  listeners.onExplosionDetected.push(callback);
}

/**
 * Register listener for shockwave detection
 */
export function onShockwaveDetected(callback: BehaviorDetectionListener): void {
  listeners.onShockwaveDetected.push(callback);
}

/**
 * Register listener for liquidity evaporation
 */
export function onLiquidityEvapDetected(callback: BehaviorDetectionListener): void {
  listeners.onLiquidityEvapDetected.push(callback);
}

/**
 * Register listener for compression detection
 */
export function onCompressionDetected(callback: BehaviorDetectionListener): void {
  listeners.onCompressionDetected.push(callback);
}

/**
 * Register listener for fake spike detection
 */
export function onFakeSpikeDetected(callback: BehaviorDetectionListener): void {
  listeners.onFakeSpikeDetected.push(callback);
}

/**
 * Register listener for risk level changes
 */
export function onRiskLevelChange(callback: RiskLevelListener): void {
  listeners.onRiskLevelChange.push(callback);
}

/**
 * Register listener for trading halts
 */
export function onTradingHalt(callback: DVBEListener): void {
  listeners.onTradingHalt.push(callback);
}

/**
 * Clear all listeners
 */
export function clearAllListeners(): void {
  Object.keys(listeners).forEach(key => {
    (listeners as any)[key] = [];
  });
  console.log('[DVBE Service] All listeners cleared');
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if phase is critical
 */
export function isCriticalPhase(phase: VolatilityPhase): boolean {
  return phase === "CRITICAL" || phase === "EXPLOSIVE";
}

/**
 * Check if behavior is dangerous
 */
export function isDangerousBehavior(behavior: VolatilityBehavior): boolean {
  return [
    "CALM_TO_EXPLOSIVE",
    "SHOCKWAVE",
    "LIQUIDITY_EVAP",
  ].includes(behavior);
}

/**
 * Check if should halt trading
 */
export function shouldHaltTrading(result: BehaviorResult): boolean {
  return result.tradingAdvice === "HALT" ||
         result.riskLevel === "CRITICAL" ||
         result.isShockwave;
}

/**
 * Get risk description
 */
export function getRiskDescription(riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"): string {
  const descriptions = {
    LOW: "Normal market conditions - safe to trade",
    MEDIUM: "Elevated volatility - reduce position sizes",
    HIGH: "High volatility - pause new positions",
    CRITICAL: "Dangerous conditions - halt trading immediately",
  };
  return descriptions[riskLevel];
}

/**
 * Get phase description
 */
export function getPhaseDescription(phase: VolatilityPhase): string {
  const descriptions = {
    DORMANT: "Extremely low volatility - market is quiet",
    CALM: "Normal low volatility - stable conditions",
    WARMING: "Volatility increasing - monitor closely",
    ACTIVE: "Elevated volatility - active market",
    EXPLOSIVE: "Very high volatility - dangerous conditions",
    CRITICAL: "Extreme volatility - halt trading",
    COOLING: "Volatility decreasing - stabilizing",
    STABILIZING: "Returning to normal - recovery phase",
  };
  return descriptions[phase];
}

/**
 * Get behavior description
 */
export function getBehaviorDescription(behavior: VolatilityBehavior): string {
  const descriptions = {
    CALM_TO_EXPLOSIVE: "Sudden explosion from calm state",
    COMPRESSION: "Building pressure before breakout",
    FAKE_SPIKE: "False spike - mean reversion expected",
    SHOCKWAVE: "Major market event cascade",
    AFTERSHOCK: "Secondary volatility waves",
    LIQUIDITY_EVAP: "Liquidity disappearing rapidly",
    VOLATILITY_DRIFT: "Gradual volatility baseline shift",
    ACCELERATION_ZONE: "Increasing volatility momentum",
    REVERSION_PHASE: "Returning to baseline volatility",
    UNKNOWN: "Unclassified behavior pattern",
  };
  return descriptions[behavior];
}

// ============================================================================
// Mock Helpers (for testing)
// ============================================================================

/**
 * Create mock volatility snapshot
 */
export function createMockVolatilitySnapshot(overrides: Partial<VolatilitySnapshot> = {}): VolatilitySnapshot {
  return {
    timestamp: Date.now(),
    currentVol: 45,
    avgVol5m: 42,
    avgVol15m: 40,
    avgVol1h: 38,
    volDelta1m: 3,
    volDelta5m: 5,
    volAcceleration: 2,
    spreadWidth: 50,
    spreadVol: 25,
    liquidityDepth: 60,
    liquidityChange: 0,
    bidPressure: 50,
    askPressure: 50,
    pressureImbalance: 0,
    priceRangeShort: 100,
    priceRangeMedium: 200,
    priceVelocity: 30,
    tickFrequency: 20,
    tradeFrequency: 15,
    avgTradeSize: 1000,
    largeTradeCount: 2,
    ...overrides,
  };
}

/**
 * Run DVBE simulation
 */
export function runDVBESimulation(count: number = 10): BehaviorResult[] {
  const results: BehaviorResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const snapshot = createMockVolatilitySnapshot({
      currentVol: 30 + Math.random() * 40,
      volDelta1m: -5 + Math.random() * 10,
      spreadWidth: 40 + Math.random() * 40,
      liquidityDepth: 40 + Math.random() * 40,
    });
    
    const result = runDVBE(snapshot);
    results.push(result);
  }
  
  return results;
}

/**
 * Export service API
 */
export const DVBEService = {
  // Core
  init: initDVBE,
  reset: resetDVBE,
  run: runDVBE,
  getContext: getVolatilityContext,
  
  // Listeners
  onVolatilityAnalysis,
  onPhaseChange,
  onExplosionDetected,
  onShockwaveDetected,
  onLiquidityEvapDetected,
  onCompressionDetected,
  onFakeSpikeDetected,
  onRiskLevelChange,
  onTradingHalt,
  clearAllListeners,
  
  // Utilities
  isCriticalPhase,
  isDangerousBehavior,
  shouldHaltTrading,
  getRiskDescription,
  getPhaseDescription,
  getBehaviorDescription,
  
  // Mock helpers
  createMockSnapshot: createMockVolatilitySnapshot,
  runSimulation: runDVBESimulation,
};

export default DVBEService;
