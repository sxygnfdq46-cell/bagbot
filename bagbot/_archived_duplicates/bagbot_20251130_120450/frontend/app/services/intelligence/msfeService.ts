/**
 * 🔮 MSFE SERVICE — Multi-Layer Strategy Fusion Engine Service
 * 
 * STEP 24.36 — React Integration Service
 * 
 * Purpose:
 * React-friendly service wrapper for the Strategy Fusion Engine (MSFE).
 * Provides easy access to strategy fusion capabilities for React components.
 * 
 * Responsibilities:
 * - Initialize MSFE singleton
 * - Evaluate strategy fusion
 * - Get fusion state and statistics
 * - Event listeners for fusion updates
 * - Auto-integration with other intelligence layers
 * 
 * Frontend-safe, no backend calls.
 */

'use client';

import { getStrategyFusionEngine } from '@/app/lib/msfe/StrategyFusionEngine';
import type {
  StrategyOutput,
  FusionResult,
  MarketContext,
  MSFEConfig,
  FusionSnapshot,
  MSFEStatistics,
  WeightMap,
} from '@/app/lib/msfe/types';
import { formatWeights, getTopStrategyByWeight } from '@/app/lib/msfe/weights';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let msfeInstance: ReturnType<typeof getStrategyFusionEngine> | null = null;
let lastFusionResult: FusionResult | null = null;

// Event listeners
const fusionListeners: Array<(result: FusionResult) => void> = [];
const conflictListeners: Array<(conflict: FusionResult) => void> = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * initMSFE — Initialize Multi-Layer Strategy Fusion Engine
 * 
 * @param config - Optional configuration overrides
 * @returns MSFE instance
 */
export function initMSFE(config?: Partial<MSFEConfig>) {
  if (!msfeInstance) {
    console.log('🔮 Initializing MSFE Service...');
    msfeInstance = getStrategyFusionEngine(config);
    console.log('✅ MSFE Service initialized');
  }
  return msfeInstance;
}

/**
 * getMSFE — Get MSFE instance (creates if not exists)
 */
export function getMSFE() {
  if (!msfeInstance) {
    initMSFE();
  }
  return msfeInstance!;
}

// ============================================================================
// FUSION EVALUATION
// ============================================================================

/**
 * evaluateFusion — Evaluate strategy fusion
 * 
 * @param strategyOutputs - Array of strategy outputs to fuse
 * @param marketContext - Current market conditions
 * @returns Fusion result
 */
export function evaluateFusion(
  strategyOutputs: StrategyOutput[],
  marketContext: MarketContext
): FusionResult {
  const msfe = getMSFE();

  console.log(`🔮 MSFE: Evaluating fusion for ${strategyOutputs.length} strategies...`);

  // Evaluate fusion
  const result = msfe.evaluate(strategyOutputs, marketContext);

  // Store result
  lastFusionResult = result;

  // Notify listeners
  notifyFusionListeners(result);

  // Check for conflicts
  if (result.hasConflict) {
    notifyConflictListeners(result);
  }

  console.log(
    `✅ MSFE: Fusion complete → ${result.signal} (strength: ${result.strength.toFixed(1)})`
  );

  return result;
}

// ============================================================================
// STATE QUERIES
// ============================================================================

/**
 * getFusionState — Get current fusion state
 */
export function getFusionState(): FusionResult | null {
  return lastFusionResult;
}

/**
 * getFusionSnapshot — Get high-level fusion snapshot
 */
export function getFusionSnapshot(): FusionSnapshot | null {
  const msfe = getMSFE();
  const stats = msfe.getStatistics();
  const lastFusion = msfe.getFusionSnapshot();

  if (!lastFusion) {
    return null;
  }

  const topStrategy = getTopStrategyByWeight(lastFusion.weights);
  const conflictRate = stats.conflictsResolved / Math.max(stats.totalFusions, 1);

  return {
    currentSignal: lastFusion.signal,
    currentStrength: lastFusion.strength,
    activeStrategies: Object.keys(lastFusion.weights).length,
    topStrategy: topStrategy || 'unknown',
    conflictRate,
    lastFusion: lastFusion.timestamp,
    statistics: stats,
  };
}

/**
 * getStatistics — Get MSFE statistics
 */
export function getStatistics(): MSFEStatistics {
  const msfe = getMSFE();
  return msfe.getStatistics();
}

/**
 * getLastFusionResult — Get last fusion result
 */
export function getLastFusionResult(): FusionResult | null {
  return lastFusionResult;
}

/**
 * getFormattedWeights — Get formatted weight display
 */
export function getFormattedWeights(): Record<string, string> | null {
  if (!lastFusionResult) {
    return null;
  }
  return formatWeights(lastFusionResult.weights);
}

/**
 * getTopStrategy — Get strategy with highest weight
 */
export function getTopStrategy(): string | null {
  if (!lastFusionResult) {
    return null;
  }
  return getTopStrategyByWeight(lastFusionResult.weights);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * onFusionComplete — Listen for fusion completion
 */
export function onFusionComplete(listener: (result: FusionResult) => void): () => void {
  fusionListeners.push(listener);
  console.log('🔮 MSFE: Fusion listener registered');

  // Return unsubscribe function
  return () => {
    const index = fusionListeners.indexOf(listener);
    if (index > -1) {
      fusionListeners.splice(index, 1);
      console.log('🔮 MSFE: Fusion listener removed');
    }
  };
}

/**
 * onConflictDetected — Listen for conflict detection
 */
export function onConflictDetected(listener: (conflict: FusionResult) => void): () => void {
  conflictListeners.push(listener);
  console.log('🔮 MSFE: Conflict listener registered');

  // Return unsubscribe function
  return () => {
    const index = conflictListeners.indexOf(listener);
    if (index > -1) {
      conflictListeners.splice(index, 1);
      console.log('🔮 MSFE: Conflict listener removed');
    }
  };
}

// ============================================================================
// EVENT NOTIFICATIONS
// ============================================================================

/**
 * notifyFusionListeners — Notify fusion completion listeners
 */
function notifyFusionListeners(result: FusionResult) {
  for (const listener of fusionListeners) {
    try {
      listener(result);
    } catch (error) {
      console.error('Error in fusion listener:', error);
    }
  }
}

/**
 * notifyConflictListeners — Notify conflict detection listeners
 */
function notifyConflictListeners(conflict: FusionResult) {
  for (const listener of conflictListeners) {
    try {
      listener(conflict);
    } catch (error) {
      console.error('Error in conflict listener:', error);
    }
  }
}

// ============================================================================
// AUTO-INTEGRATION HELPERS
// ============================================================================

/**
 * autoFuseFromStrategies — Auto-fuse when new strategy outputs arrive
 * 
 * This can be called from strategy execution layer to automatically
 * trigger fusion when all strategies have produced outputs.
 */
export function autoFuseFromStrategies(
  strategyOutputs: StrategyOutput[],
  marketContext: MarketContext
): FusionResult {
  console.log('🔮 MSFE: Auto-fusion triggered by strategy outputs');
  return evaluateFusion(strategyOutputs, marketContext);
}

/**
 * createMarketContext — Helper to create MarketContext from available data
 * 
 * This helps bridge the gap between different intelligence layers
 * by creating a MarketContext from HIF or other sources.
 */
export function createMarketContext(data: {
  shield?: string;
  threats?: number;
  volatility?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  trendDirection?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}): MarketContext {
  return {
    shield: data.shield || 'CALM',
    threats: data.threats || 50,
    volatility: data.volatility || 'medium',
    timestamp: Date.now(),
    riskLevel: data.riskLevel,
    trendDirection: data.trendDirection,
  };
}

// ============================================================================
// TESTING / SIMULATION
// ============================================================================

/**
 * simulateFusion — Simulate fusion with mock data (for testing)
 */
export function simulateFusion(): FusionResult {
  const mockStrategies: StrategyOutput[] = [
    {
      strategyName: 'momentumStrategy',
      signal: 'LONG',
      confidence: 75,
      reasoning: 'Strong upward momentum detected',
    },
    {
      strategyName: 'meanReversionStrategy',
      signal: 'SHORT',
      confidence: 60,
      reasoning: 'Price extended above mean',
    },
    {
      strategyName: 'trendFollowingStrategy',
      signal: 'LONG',
      confidence: 70,
      reasoning: 'Uptrend confirmed',
    },
    {
      strategyName: 'volatilityStrategy',
      signal: 'NEUTRAL',
      confidence: 50,
      reasoning: 'Volatility spike detected',
    },
  ];

  const mockContext: MarketContext = {
    shield: 'CALM',
    threats: 30,
    volatility: 'medium',
    timestamp: Date.now(),
  };

  return evaluateFusion(mockStrategies, mockContext);
}

// ============================================================================
// RESET / CLEANUP
// ============================================================================

/**
 * resetMSFE — Reset MSFE state (for testing)
 */
export function resetMSFE() {
  console.log('🔮 Resetting MSFE Service...');
  msfeInstance = null;
  lastFusionResult = null;
  fusionListeners.length = 0;
  conflictListeners.length = 0;
  console.log('✅ MSFE Service reset');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initMSFE,
  getMSFE,
  evaluateFusion,
  getFusionState,
  getFusionSnapshot,
  getStatistics,
  getLastFusionResult,
  getFormattedWeights,
  getTopStrategy,
  onFusionComplete,
  onConflictDetected,
  autoFuseFromStrategies,
  createMarketContext,
  simulateFusion,
  resetMSFE,
};
