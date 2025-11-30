/**
 * Market Flow Anticipation Engine Service - React Integration
 * 
 * Service layer for integrating MFAE with React components.
 * Manages flow analysis lifecycle, state tracking, and event notifications.
 */

import { getMFAE, resetMFAE } from '@/app/lib/intelligence/MarketFlowAnticipation';
import type {
  FlowSnapshot,
  FlowIntentResult,
  FlowState,
  MFAEConfig,
  FlowIntent,
} from '@/app/lib/intelligence/flowTypes';

import {
  addFlowSnapshot,
  addFlowResult,
  getSnapshotHistory,
  getResultHistory,
  getFlowStats,
  clearFlowHistory,
} from '@/app/state/mfaeState';

/**
 * Event listeners for flow events
 */
type FlowEventListener = (result: FlowIntentResult) => void;
type StateEventListener = (state: FlowState) => void;

const bullishListeners: Set<FlowEventListener> = new Set();
const bearishListeners: Set<FlowEventListener> = new Set();
const stalledListeners: Set<FlowEventListener> = new Set();
const fakeoutListeners: Set<FlowEventListener> = new Set();
const stateListeners: Set<StateEventListener> = new Set();

/**
 * Initialize MFAE
 */
export function initMFAE(config?: Partial<MFAEConfig>): void {
  const mfae = getMFAE(config);
  console.log('[MFAE Service] Market Flow Anticipation Engine initialized', {
    config,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Run MFAE analysis on market snapshot
 * 
 * @param snapshot - Current market snapshot
 * @returns Flow intent result
 */
export function runMFAE(snapshot: FlowSnapshot): FlowIntentResult {
  const mfae = getMFAE();
  const startTime = performance.now();
  
  try {
    // Store snapshot in global state
    addFlowSnapshot(snapshot);
    
    // Load snapshot into MFAE
    mfae.loadSnapshot(snapshot);
    
    // Run analysis
    const result = mfae.getFinalFlowSignal();
    
    // Store result in global state
    addFlowResult(result);
    
    // Emit events
    emitFlowEvents(result);
    
    // Emit state update
    const state = mfae.getFlowState();
    stateListeners.forEach(listener => listener(state));
    
    const executionTime = performance.now() - startTime;
    
    console.log('[MFAE Service] Flow analysis complete:', {
      intent: result.flowIntent,
      confidence: result.confidence,
      flowScore: result.metrics.flowScore,
      imbalance: result.imbalancePressure,
      executionTime: executionTime.toFixed(2) + 'ms',
    });
    
    return result;
  } catch (error) {
    const err = error as Error;
    console.error('[MFAE Service] Flow analysis error:', err);
    throw error;
  }
}

/**
 * Emit flow intent events
 */
function emitFlowEvents(result: FlowIntentResult): void {
  switch (result.flowIntent) {
    case "BULLISH":
      bullishListeners.forEach(listener => listener(result));
      break;
    case "BEARISH":
      bearishListeners.forEach(listener => listener(result));
      break;
    case "STALLED":
      stalledListeners.forEach(listener => listener(result));
      break;
    case "FAKE_MOVE":
      fakeoutListeners.forEach(listener => listener(result));
      break;
  }
}

/**
 * Get flow context (state + history + diagnostics)
 */
export function getFlowContext(): {
  state: FlowState;
  lastResult: FlowIntentResult | null;
  snapshotHistory: FlowSnapshot[];
  resultHistory: FlowIntentResult[];
  stats: ReturnType<typeof getFlowStats>;
} {
  const mfae = getMFAE();
  const state = mfae.getFlowState();
  const snapshotHistory = getSnapshotHistory();
  const resultHistory = getResultHistory();
  const stats = getFlowStats();
  
  return {
    state,
    lastResult: state.lastIntent,
    snapshotHistory,
    resultHistory,
    stats,
  };
}

/**
 * Get flow state
 */
export function getFlowState(): FlowState {
  const mfae = getMFAE();
  return mfae.getFlowState();
}

/**
 * Get last flow result
 */
export function getLastFlowResult(): FlowIntentResult | null {
  const mfae = getMFAE();
  return mfae.getLastResult();
}

/**
 * Update MFAE configuration
 */
export function updateMFAEConfig(config: Partial<MFAEConfig>): void {
  const mfae = getMFAE();
  mfae.updateConfig(config);
  console.log('[MFAE Service] Configuration updated', config);
}

/**
 * Reset MFAE state
 */
export function resetMFAEState(): void {
  const mfae = getMFAE();
  mfae.resetState();
  clearFlowHistory();
  console.log('[MFAE Service] State reset');
}

/**
 * Reset MFAE instance (for testing)
 */
export function resetMFAEInstance(): void {
  resetMFAE();
  clearFlowHistory();
  console.log('[MFAE Service] Instance reset');
}

// ============================================================================
// Event Listener Registration
// ============================================================================

/**
 * Register listener for BULLISH flow
 */
export function onBullishFlow(listener: FlowEventListener): () => void {
  bullishListeners.add(listener);
  return () => bullishListeners.delete(listener);
}

/**
 * Register listener for BEARISH flow
 */
export function onBearishFlow(listener: FlowEventListener): () => void {
  bearishListeners.add(listener);
  return () => bearishListeners.delete(listener);
}

/**
 * Register listener for STALLED flow
 */
export function onStalledFlow(listener: FlowEventListener): () => void {
  stalledListeners.add(listener);
  return () => stalledListeners.delete(listener);
}

/**
 * Register listener for FAKE_MOVE detection
 */
export function onFakeoutDetected(listener: FlowEventListener): () => void {
  fakeoutListeners.add(listener);
  return () => fakeoutListeners.delete(listener);
}

/**
 * Register listener for state updates
 */
export function onFlowStateUpdate(listener: StateEventListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if flow is bullish
 */
export function isBullish(result: FlowIntentResult): boolean {
  return result.flowIntent === "BULLISH" && result.confidence >= 60;
}

/**
 * Check if flow is bearish
 */
export function isBearish(result: FlowIntentResult): boolean {
  return result.flowIntent === "BEARISH" && result.confidence >= 60;
}

/**
 * Check if flow is stalled
 */
export function isStalled(result: FlowIntentResult): boolean {
  return result.flowIntent === "STALLED";
}

/**
 * Check if fake-out detected
 */
export function isFakeout(result: FlowIntentResult): boolean {
  return result.flowIntent === "FAKE_MOVE" || result.fakeoutDetected;
}

/**
 * Check if liquidity crisis
 */
export function hasLiquidityCrisis(result: FlowIntentResult): boolean {
  return result.liquidityCrisis;
}

/**
 * Check if momentum shift occurred
 */
export function hasMomentumShift(result: FlowIntentResult): boolean {
  return result.momentumShift;
}

/**
 * Get human-readable flow summary
 */
export function getFlowSummary(result: FlowIntentResult): string {
  const lines = [
    '=== MARKET FLOW ANALYSIS ===',
    `Intent: ${result.flowIntent}`,
    `Confidence: ${result.confidence}%`,
    '',
    '--- Flow Metrics ---',
    `Flow Score: ${result.metrics.flowScore}/100 (${result.metrics.flowDirection})`,
    `Tick Acceleration: ${result.metrics.tickAccel}/100 (${result.metrics.tickAccelDirection})`,
    `Liquidity Tension: ${result.metrics.liquidityTension}/100 (${result.metrics.tensionDirection})`,
    `Imbalance Pressure: ${result.metrics.imbalancePressure}/100 (${result.metrics.imbalanceStrength})`,
    `Micro Volatility: ${result.metrics.microVolatility}/100 (${result.metrics.volatilityTrend})`,
    '',
    '--- Liquidity Profile ---',
    `Total Depth: ${result.liquidityProfile.totalDepth}`,
    `Bid/Ask Ratio: ${result.liquidityProfile.bidAskRatio}`,
    `Imbalance: ${result.liquidityProfile.imbalance}%`,
    `Spread Quality: ${result.liquidityProfile.spreadQuality}`,
    `Tension: ${result.liquidityProfile.tension}/100`,
    '',
    '--- Alerts ---',
  ];
  
  if (result.fakeoutDetected) lines.push('⚠️  FAKE-OUT DETECTED');
  if (result.liquidityCrisis) lines.push('🚨 LIQUIDITY CRISIS');
  if (result.momentumShift) lines.push('📊 MOMENTUM SHIFT');
  if (!result.fakeoutDetected && !result.liquidityCrisis && !result.momentumShift) {
    lines.push('✅ No alerts');
  }
  
  lines.push('');
  lines.push('--- Reasons ---');
  result.reason.forEach(r => lines.push(`  ${r}`));
  
  return lines.join('\n');
}

/**
 * Format flow state for display
 */
export function formatFlowState(state: FlowState): string {
  const lines = [
    '=== FLOW STATE ===',
    `Total Analyses: ${state.totalAnalyses}`,
    `Bullish: ${state.bullishCount} (${((state.bullishCount / state.totalAnalyses) * 100 || 0).toFixed(1)}%)`,
    `Bearish: ${state.bearishCount} (${((state.bearishCount / state.totalAnalyses) * 100 || 0).toFixed(1)}%)`,
    `Stalled: ${state.stalledCount} (${((state.stalledCount / state.totalAnalyses) * 100 || 0).toFixed(1)}%)`,
    `Fake Moves: ${state.fakeMovesCount} (${((state.fakeMovesCount / state.totalAnalyses) * 100 || 0).toFixed(1)}%)`,
    '',
    `Avg Confidence: ${state.avgConfidence.toFixed(1)}%`,
    `Avg Tick Accel: ${state.avgTickAccel.toFixed(1)}/100`,
    `Avg Liquidity Tension: ${state.avgLiquidityTension.toFixed(1)}/100`,
    `Avg Imbalance: ${state.avgImbalance.toFixed(1)}/100`,
    '',
    `Last Update: ${new Date(state.lastUpdate).toISOString()}`,
  ];
  
  return lines.join('\n');
}

// ============================================================================
// Mock/Simulation Helpers
// ============================================================================

/**
 * Create mock flow snapshot for testing
 */
export function createMockFlowSnapshot(
  symbol: string = "BTC/USD",
  price: number = 50000,
  intent: "bullish" | "bearish" | "neutral" = "neutral"
): FlowSnapshot {
  const spread = price * 0.0001;
  const bid = price - spread / 2;
  const ask = price + spread / 2;
  
  // Configure snapshot based on intended flow
  let bidDepth = 100;
  let askDepth = 100;
  let tickVelocity = 5;
  
  if (intent === "bullish") {
    bidDepth = 150; // More buy pressure
    askDepth = 80;
    tickVelocity = 8;
  } else if (intent === "bearish") {
    bidDepth = 80; // More sell pressure
    askDepth = 150;
    tickVelocity = 8;
  }
  
  return {
    symbol,
    timestamp: Date.now(),
    price,
    bid,
    ask,
    high: price * 1.001,
    low: price * 0.999,
    volume: 1000,
    volumeMA: 950,
    tickCount: 50,
    tickVelocity,
    bidDepth,
    askDepth,
    bidLevels: 10,
    askLevels: 10,
    spreadBps: ((ask - bid) / price) * 10000,
  };
}

/**
 * Run MFAE simulation with mock data
 */
export function runMFAESimulation(
  intent: "bullish" | "bearish" | "neutral" = "neutral",
  config?: Partial<MFAEConfig>
): FlowIntentResult {
  if (config) {
    initMFAE(config);
  }
  
  const snapshot = createMockFlowSnapshot("BTC/USD", 50000, intent);
  return runMFAE(snapshot);
}

/**
 * Export for convenience
 */
export const MFAEService = {
  // Initialization
  init: initMFAE,
  reset: resetMFAEInstance,
  resetState: resetMFAEState,
  
  // Analysis
  run: runMFAE,
  
  // State
  getContext: getFlowContext,
  getState: getFlowState,
  getLastResult: getLastFlowResult,
  
  // Configuration
  updateConfig: updateMFAEConfig,
  
  // Event Listeners
  onBullish: onBullishFlow,
  onBearish: onBearishFlow,
  onStalled: onStalledFlow,
  onFakeout: onFakeoutDetected,
  onStateUpdate: onFlowStateUpdate,
  
  // Utilities
  isBullish,
  isBearish,
  isStalled,
  isFakeout,
  hasLiquidityCrisis,
  hasMomentumShift,
  getSummary: getFlowSummary,
  formatState: formatFlowState,
  
  // Mocks
  createMockSnapshot: createMockFlowSnapshot,
  runSimulation: runMFAESimulation,
};

export default MFAEService;
