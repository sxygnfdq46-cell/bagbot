/**
 * 🎯 DPL SERVICE — Decision Precision Layer Service
 * 
 * STEP 24.37 — React Integration Service
 * 
 * Purpose:
 * React-friendly service wrapper for the Decision Precision Layer (DPL).
 * Provides easy access to precision validation for React components.
 * 
 * Responsibilities:
 * - Initialize DPL singleton
 * - Evaluate precision checks for fusion results
 * - Get DPL state and statistics
 * - Event listeners for decision updates
 * - Auto-integration with MSFE (Strategy Fusion Engine)
 * 
 * Frontend-safe, no backend calls.
 */

'use client';

import { getDecisionPrecisionLayer } from '@/app/lib/dpl/DecisionPrecisionLayer';
import type {
  DPLDecision,
  DPLConfig,
  DPLSnapshot,
  DPLStatistics,
  MicroTrendData,
  OrderbookData,
  CandleData,
} from '@/app/lib/dpl/types';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let dplInstance: ReturnType<typeof getDecisionPrecisionLayer> | null = null;
let lastDecision: DPLDecision | null = null;

// Event listeners
const decisionListeners: Array<(decision: DPLDecision) => void> = [];
const blockListeners: Array<(decision: DPLDecision) => void> = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * initDPL — Initialize Decision Precision Layer
 * 
 * @param config - Optional configuration overrides
 * @returns DPL instance
 */
export function initDPL(config?: Partial<DPLConfig>) {
  if (!dplInstance) {
    console.log('🎯 Initializing DPL Service...');
    dplInstance = getDecisionPrecisionLayer(config);
    console.log('✅ DPL Service initialized');
  }
  return dplInstance;
}

/**
 * getDPL — Get DPL instance (creates if not exists)
 */
export function getDPL() {
  if (!dplInstance) {
    initDPL();
  }
  return dplInstance!;
}

// ============================================================================
// PRECISION EVALUATION
// ============================================================================

/**
 * evaluateDPL — Evaluate decision precision
 * 
 * @param fusionResult - Result from MSFE
 * @param marketContext - Current market conditions
 * @param microTrendData - Short-term trend data
 * @param orderbookData - Optional orderbook snapshot
 * @param candleData - Optional recent candle data
 * @returns DPL decision
 */
export function evaluateDPL(
  fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
  marketContext: {
    shield: string;
    threats: number;
    volatility: string;
    riskLevel?: 'low' | 'medium' | 'high';
  },
  microTrendData: MicroTrendData,
  orderbookData?: OrderbookData,
  candleData?: CandleData
): DPLDecision {
  const dpl = getDPL();

  console.log(`🎯 DPL: Evaluating precision for ${fusionResult.signal} signal...`);

  // Evaluate precision
  const decision = dpl.evaluate(
    fusionResult,
    marketContext,
    microTrendData,
    orderbookData,
    candleData
  );

  // Store decision
  lastDecision = decision;

  // Notify listeners
  notifyDecisionListeners(decision);

  // Check if trade was blocked
  if (!decision.allowTrade) {
    notifyBlockListeners(decision);
  }

  console.log(
    `✅ DPL: Decision ${decision.allowTrade ? 'ALLOWED' : 'BLOCKED'} → ${decision.action} ` +
    `(confidence: ${decision.confidence})`
  );

  return decision;
}

// ============================================================================
// STATE QUERIES
// ============================================================================

/**
 * getDPLState — Get current DPL state
 */
export function getDPLState(): DPLDecision | null {
  return lastDecision;
}

/**
 * getDPLSnapshot — Get high-level DPL snapshot
 */
export function getDPLSnapshot(): DPLSnapshot | null {
  const dpl = getDPL();
  const stats = dpl.getStatistics();
  const lastDecision = dpl.getSnapshot();

  if (!lastDecision) {
    return null;
  }

  const activeValidators = lastDecision.validatorResults.map((v) => v.validatorName);
  const blockRate = stats.tradesBlocked / Math.max(stats.totalEvaluations, 1);
  const topBlockReason = getTopBlockReason(stats.blockReasons);

  return {
    lastDecision,
    activeValidators,
    blockRate,
    averageConfidence: stats.averageConfidence,
    topBlockReason,
    statistics: stats,
    lastEvaluation: lastDecision.timestamp,
  };
}

/**
 * getStatistics — Get DPL statistics
 */
export function getStatistics(): DPLStatistics {
  const dpl = getDPL();
  return dpl.getStatistics();
}

/**
 * getLastDecision — Get last DPL decision
 */
export function getLastDecision(): DPLDecision | null {
  return lastDecision;
}

/**
 * getBlockRate — Get percentage of trades blocked
 */
export function getBlockRate(): number {
  const stats = getStatistics();
  return stats.tradesBlocked / Math.max(stats.totalEvaluations, 1);
}

/**
 * getValidatorPassRates — Get pass rates for each validator
 */
export function getValidatorPassRates(): Record<string, number> {
  const stats = getStatistics();
  return stats.validatorPassRates;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * onDecisionComplete — Listen for decision completion
 */
export function onDecisionComplete(listener: (decision: DPLDecision) => void): () => void {
  decisionListeners.push(listener);
  console.log('🎯 DPL: Decision listener registered');

  // Return unsubscribe function
  return () => {
    const index = decisionListeners.indexOf(listener);
    if (index > -1) {
      decisionListeners.splice(index, 1);
      console.log('🎯 DPL: Decision listener removed');
    }
  };
}

/**
 * onTradeBlocked — Listen for trade blocks
 */
export function onTradeBlocked(listener: (decision: DPLDecision) => void): () => void {
  blockListeners.push(listener);
  console.log('🎯 DPL: Block listener registered');

  // Return unsubscribe function
  return () => {
    const index = blockListeners.indexOf(listener);
    if (index > -1) {
      blockListeners.splice(index, 1);
      console.log('🎯 DPL: Block listener removed');
    }
  };
}

// ============================================================================
// EVENT NOTIFICATIONS
// ============================================================================

/**
 * notifyDecisionListeners — Notify decision completion listeners
 */
function notifyDecisionListeners(decision: DPLDecision) {
  for (const listener of decisionListeners) {
    try {
      listener(decision);
    } catch (error) {
      console.error('Error in decision listener:', error);
    }
  }
}

/**
 * notifyBlockListeners — Notify trade block listeners
 */
function notifyBlockListeners(decision: DPLDecision) {
  for (const listener of blockListeners) {
    try {
      listener(decision);
    } catch (error) {
      console.error('Error in block listener:', error);
    }
  }
}

// ============================================================================
// AUTO-INTEGRATION HELPERS
// ============================================================================

/**
 * autoEvaluateFromMSFE — Auto-evaluate when MSFE fusion completes
 * 
 * This can be called from MSFE service to automatically trigger DPL
 * validation when fusion completes.
 */
export function autoEvaluateFromMSFE(
  fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
  marketContext: {
    shield: string;
    threats: number;
    volatility: string;
    riskLevel?: 'low' | 'medium' | 'high';
  },
  microTrendData: MicroTrendData,
  orderbookData?: OrderbookData,
  candleData?: CandleData
): DPLDecision {
  console.log('🎯 DPL: Auto-evaluation triggered by MSFE');
  return evaluateDPL(fusionResult, marketContext, microTrendData, orderbookData, candleData);
}

/**
 * createMockMicroTrendData — Helper to create mock micro-trend data
 */
export function createMockMicroTrendData(
  direction: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL',
  strength: number = 50
): MicroTrendData {
  return {
    direction,
    strength,
    momentum: direction === 'UP' ? 20 : direction === 'DOWN' ? -20 : 0,
    duration: 60000, // 1 minute
    recentPrices: [100, 101, 102, 103, 104],
    priceChange: direction === 'UP' ? 2.0 : direction === 'DOWN' ? -2.0 : 0,
    velocityChange: 0.1,
    timestamp: Date.now(),
  };
}

/**
 * createMockOrderbookData — Helper to create mock orderbook data
 */
export function createMockOrderbookData(
  imbalance: number = 0.0
): OrderbookData {
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

/**
 * createMockCandleData — Helper to create mock candle data
 */
export function createMockCandleData(
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
): CandleData {
  const base = 100;
  const change = direction === 'BULLISH' ? 2 : direction === 'BEARISH' ? -2 : 0;

  return {
    open: base,
    high: base + Math.abs(change) + 0.5,
    low: base - Math.abs(change) - 0.5,
    close: base + change,
    volume: 1000,
    timestamp: Date.now(),
    direction,
    bodySize: change,
    wickSize: Math.abs(change) * 2 + 1,
    bodyPercent: (Math.abs(change) / (Math.abs(change) * 2 + 1)) * 100,
    isHammer: false,
    isDoji: false,
    isEngulfing: false,
  };
}

// ============================================================================
// TESTING / SIMULATION
// ============================================================================

/**
 * simulateDPL — Simulate DPL evaluation with mock data (for testing)
 */
export function simulateDPL(): DPLDecision {
  const mockFusion = {
    signal: 'LONG' as const,
    strength: 75,
  };

  const mockMarket = {
    shield: 'CALM',
    threats: 30,
    volatility: 'medium',
  };

  const mockMicroTrend = createMockMicroTrendData('UP', 60);
  const mockOrderbook = createMockOrderbookData(0.2); // Slight buy pressure
  const mockCandle = createMockCandleData('BULLISH');

  return evaluateDPL(mockFusion, mockMarket, mockMicroTrend, mockOrderbook, mockCandle);
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * getTopBlockReason — Get most common block reason
 */
function getTopBlockReason(blockReasons: Record<string, number>): string {
  if (Object.keys(blockReasons).length === 0) {
    return 'none';
  }

  let topReason = '';
  let maxCount = 0;

  for (const [reason, count] of Object.entries(blockReasons)) {
    if (count > maxCount) {
      maxCount = count;
      topReason = reason;
    }
  }

  return topReason || 'unknown';
}

// ============================================================================
// RESET / CLEANUP
// ============================================================================

/**
 * resetDPL — Reset DPL state (for testing)
 */
export function resetDPL() {
  console.log('🎯 Resetting DPL Service...');
  dplInstance = null;
  lastDecision = null;
  decisionListeners.length = 0;
  blockListeners.length = 0;
  console.log('✅ DPL Service reset');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initDPL,
  getDPL,
  evaluateDPL,
  getDPLState,
  getDPLSnapshot,
  getStatistics,
  getLastDecision,
  getBlockRate,
  getValidatorPassRates,
  onDecisionComplete,
  onTradeBlocked,
  autoEvaluateFromMSFE,
  createMockMicroTrendData,
  createMockOrderbookData,
  createMockCandleData,
  simulateDPL,
  resetDPL,
};
