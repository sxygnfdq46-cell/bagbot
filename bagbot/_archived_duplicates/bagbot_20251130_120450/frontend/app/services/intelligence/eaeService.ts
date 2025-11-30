/**
 * ⏰ EAE SERVICE — Execution Alignment Engine Service
 * 
 * STEP 24.38 — React Integration Service
 * 
 * Purpose:
 * React-friendly service wrapper for the Execution Alignment Engine (EAE).
 * Provides easy access to timing optimization for React components.
 * 
 * Responsibilities:
 * - Initialize EAE singleton
 * - Evaluate execution timing alignment
 * - Get EAE state and statistics
 * - Event listeners for timing updates
 * - Auto-integration with DPL and MSFE
 * 
 * Frontend-safe, no backend calls.
 */

'use client';

import { getExecutionAlignmentEngine } from '@/app/lib/eae/ExecutionAlignmentEngine';
import type {
  EAETiming,
  EAEConfig,
  EAESnapshot,
  EAEStatistics,
  EAEContext,
  RhythmData,
  LiquidityPulse,
  CandleData,
  OrderbookData,
} from '@/app/lib/eae/types';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let eaeInstance: ReturnType<typeof getExecutionAlignmentEngine> | null = null;
let lastTiming: EAETiming | null = null;

// Event listeners
const timingListeners: Array<(timing: EAETiming) => void> = [];
const fireListeners: Array<(timing: EAETiming) => void> = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * initEAE — Initialize Execution Alignment Engine
 * 
 * @param config - Optional configuration overrides
 * @returns EAE instance
 */
export function initEAE(config?: Partial<EAEConfig>) {
  if (!eaeInstance) {
    console.log('⏰ Initializing EAE Service...');
    eaeInstance = getExecutionAlignmentEngine(config);
    console.log('✅ EAE Service initialized');
  }
  return eaeInstance;
}

/**
 * getEAE — Get EAE instance (creates if not exists)
 */
export function getEAE() {
  if (!eaeInstance) {
    initEAE();
  }
  return eaeInstance!;
}

// ============================================================================
// TIMING EVALUATION
// ============================================================================

/**
 * evaluateEAE — Evaluate execution timing alignment
 * 
 * @param dplDecision - Decision from DPL
 * @param fusionResult - Result from MSFE
 * @param context - EAE context with market data
 * @param orderbook - Optional orderbook snapshot
 * @returns EAE timing decision
 */
export function evaluateEAE(
  dplDecision: { allowTrade: boolean; action: string; confidence: number },
  fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
  context: EAEContext,
  orderbook?: OrderbookData
): EAETiming {
  const eae = getEAE();

  console.log(`⏰ EAE: Evaluating timing for ${fusionResult.signal} signal...`);

  // Evaluate timing
  const timing = eae.alignExecution(dplDecision, fusionResult, context, orderbook);

  // Store timing
  lastTiming = timing;

  // Notify listeners
  notifyTimingListeners(timing);

  // Check if execution should fire
  if (timing.fire) {
    notifyFireListeners(timing);
  }

  console.log(
    `✅ EAE: Timing ${timing.fire ? 'READY' : 'NOT READY'} → ` +
    `Score: ${timing.timingScore}, Sync: ${timing.syncState}, Size: ${(timing.recommendedSize * 100).toFixed(0)}%`
  );

  return timing;
}

// ============================================================================
// STATE QUERIES
// ============================================================================

/**
 * getEAEState — Get current EAE state
 */
export function getEAEState(): EAETiming | null {
  return lastTiming;
}

/**
 * getEAESnapshot — Get high-level EAE snapshot
 */
export function getEAESnapshot(): EAESnapshot | null {
  const eae = getEAE();
  const stats = eae.getStatistics();
  const lastTiming = eae.getSnapshot();

  if (!lastTiming) {
    return null;
  }

  const executionRate = stats.executionsAllowed / Math.max(stats.totalEvaluations, 1);

  return {
    lastTiming,
    currentSyncState: lastTiming.syncState,
    executionRate,
    averageTimingScore: stats.averageTimingScore,
    activeKillZone: 'London Session', // Placeholder
    rhythmStability: stats.rhythmAlignmentRate * 100,
    liquidityHealth: stats.liquidityAlignmentRate * 100,
    statistics: stats,
    lastEvaluation: lastTiming.timestamp,
  };
}

/**
 * getStatistics — Get EAE statistics
 */
export function getStatistics(): EAEStatistics {
  const eae = getEAE();
  return eae.getStatistics();
}

/**
 * getLastTiming — Get last EAE timing decision
 */
export function getLastTiming(): EAETiming | null {
  return lastTiming;
}

/**
 * getExecutionRate — Get percentage of executions allowed
 */
export function getExecutionRate(): number {
  const stats = getStatistics();
  return stats.executionsAllowed / Math.max(stats.totalEvaluations, 1);
}

/**
 * getRhythmAlignmentRate — Get rhythm alignment rate
 */
export function getRhythmAlignmentRate(): number {
  const stats = getStatistics();
  return stats.rhythmAlignmentRate;
}

/**
 * getLiquidityAlignmentRate — Get liquidity alignment rate
 */
export function getLiquidityAlignmentRate(): number {
  const stats = getStatistics();
  return stats.liquidityAlignmentRate;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * onTimingComplete — Listen for timing evaluation completion
 */
export function onTimingComplete(listener: (timing: EAETiming) => void): () => void {
  timingListeners.push(listener);
  console.log('⏰ EAE: Timing listener registered');

  // Return unsubscribe function
  return () => {
    const index = timingListeners.indexOf(listener);
    if (index > -1) {
      timingListeners.splice(index, 1);
      console.log('⏰ EAE: Timing listener removed');
    }
  };
}

/**
 * onExecutionFire — Listen for execution fire signals
 */
export function onExecutionFire(listener: (timing: EAETiming) => void): () => void {
  fireListeners.push(listener);
  console.log('⏰ EAE: Fire listener registered');

  // Return unsubscribe function
  return () => {
    const index = fireListeners.indexOf(listener);
    if (index > -1) {
      fireListeners.splice(index, 1);
      console.log('⏰ EAE: Fire listener removed');
    }
  };
}

// ============================================================================
// EVENT NOTIFICATIONS
// ============================================================================

/**
 * notifyTimingListeners — Notify timing completion listeners
 */
function notifyTimingListeners(timing: EAETiming) {
  for (const listener of timingListeners) {
    try {
      listener(timing);
    } catch (error) {
      console.error('Error in timing listener:', error);
    }
  }
}

/**
 * notifyFireListeners — Notify execution fire listeners
 */
function notifyFireListeners(timing: EAETiming) {
  for (const listener of fireListeners) {
    try {
      listener(timing);
    } catch (error) {
      console.error('Error in fire listener:', error);
    }
  }
}

// ============================================================================
// AUTO-INTEGRATION HELPERS
// ============================================================================

/**
 * autoEvaluateFromDPL — Auto-evaluate when DPL decision completes
 * 
 * This can be called from DPL service to automatically trigger EAE
 * timing evaluation when precision checks complete.
 */
export function autoEvaluateFromDPL(
  dplDecision: { allowTrade: boolean; action: string; confidence: number },
  fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
  context: EAEContext,
  orderbook?: OrderbookData
): EAETiming {
  console.log('⏰ EAE: Auto-evaluation triggered by DPL');
  return evaluateEAE(dplDecision, fusionResult, context, orderbook);
}

/**
 * createMockContext — Helper to create mock EAE context
 */
export function createMockContext(
  signal: 'LONG' | 'SHORT' | 'NEUTRAL' = 'LONG',
  candleCount: number = 20
): EAEContext {
  const candles: CandleData[] = [];
  const basePrice = 100;

  for (let i = 0; i < candleCount; i++) {
    const direction = Math.random() > 0.5 ? 'BULLISH' : 'BEARISH';
    const change = direction === 'BULLISH' ? 0.5 : -0.5;

    candles.push({
      open: basePrice + i * change,
      high: basePrice + i * change + 1,
      low: basePrice + i * change - 1,
      close: basePrice + (i + 1) * change,
      volume: 1000,
      timestamp: Date.now() - (candleCount - i) * 60000,
      direction: direction === 'BULLISH' ? 'BULLISH' : 'BEARISH',
      bodySize: Math.abs(change),
      wickSize: 2,
      bodyPercent: 50,
    });
  }

  return {
    dplDecision: {
      allowTrade: true,
      action: signal,
      confidence: 75,
    },
    fusionResult: {
      signal,
      strength: 75,
    },
    marketContext: {
      shield: 'CALM',
      threats: 30,
      volatility: 'medium',
    },
    candleData: candles,
    timestamp: Date.now(),
  };
}

/**
 * createMockOrderbook — Helper to create mock orderbook
 */
export function createMockOrderbook(imbalance: number = 0.0): OrderbookData {
  return {
    bids: [
      { price: 99.5, volume: 100 },
      { price: 99.0, volume: 200 },
    ],
    asks: [
      { price: 100.5, volume: 100 },
      { price: 101.0, volume: 200 },
    ],
    bidDepth: 300,
    askDepth: 300,
    spread: 1.0,
    spreadPercent: 0.5,
    imbalance,
    liquidityScore: 75,
    timestamp: Date.now(),
  };
}

// ============================================================================
// TESTING / SIMULATION
// ============================================================================

/**
 * simulateEAE — Simulate EAE evaluation with mock data (for testing)
 */
export function simulateEAE(): EAETiming {
  const mockDPL = {
    allowTrade: true,
    action: 'LONG',
    confidence: 75,
  };

  const mockFusion = {
    signal: 'LONG' as const,
    strength: 75,
  };

  const mockContext = createMockContext('LONG', 20);
  const mockOrderbook = createMockOrderbook(0.2);

  return evaluateEAE(mockDPL, mockFusion, mockContext, mockOrderbook);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * isOptimalTiming — Check if current timing is optimal
 */
export function isOptimalTiming(): boolean {
  const timing = getLastTiming();
  return timing ? timing.fire && timing.syncState === 'GOOD' : false;
}

/**
 * getRecommendedPositionSize — Get recommended position size
 */
export function getRecommendedPositionSize(): number {
  const timing = getLastTiming();
  return timing ? timing.recommendedSize : 0;
}

/**
 * getTimingWindow — Get current timing window
 */
export function getTimingWindow(): { start: number; end: number } | null {
  const timing = getLastTiming();
  return timing ? { start: timing.windowStart, end: timing.windowEnd } : null;
}

// ============================================================================
// RESET / CLEANUP
// ============================================================================

/**
 * resetEAE — Reset EAE state (for testing)
 */
export function resetEAE() {
  console.log('⏰ Resetting EAE Service...');
  eaeInstance = null;
  lastTiming = null;
  timingListeners.length = 0;
  fireListeners.length = 0;
  console.log('✅ EAE Service reset');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initEAE,
  getEAE,
  evaluateEAE,
  getEAEState,
  getEAESnapshot,
  getStatistics,
  getLastTiming,
  getExecutionRate,
  getRhythmAlignmentRate,
  getLiquidityAlignmentRate,
  onTimingComplete,
  onExecutionFire,
  autoEvaluateFromDPL,
  createMockContext,
  createMockOrderbook,
  simulateEAE,
  isOptimalTiming,
  getRecommendedPositionSize,
  getTimingWindow,
  resetEAE,
};
