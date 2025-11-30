/**
 * Fusion Service - Cross-Engine Fusion Service
 * 
 * React service for unified cross-engine intelligence fusion.
 * Provides event-driven interface for fusion operations.
 */

import {
  getFusionCore,
  resetFusionCore,
} from '@/app/lib/intelligence/FusionCore';

import type {
  FusionDecision,
  FusionSummary,
} from '@/app/lib/intelligence/FusionCore';

import type {
  FusionMatrix,
} from '@/app/lib/intelligence/fusionMatrix';

import type {
  FusionWeights,
  WeightContext,
} from '@/app/lib/intelligence/fusionWeights';

import {
  addFusionDecision,
  addConflictLog,
  getFusionStats,
  getRecentDecisions,
  getFusionQualityTrend,
} from '@/app/state/fusionState';

/**
 * Event listener types
 */
type FusionListener = (decision: FusionDecision) => void;
type ConflictListener = (conflicts: FusionMatrix['conflicts']) => void;
type HaltListener = (reason: string, decision: FusionDecision) => void;
type HighConfidenceListener = (decision: FusionDecision) => void;

/**
 * Event listeners
 */
const listeners = {
  onFusionComplete: [] as FusionListener[],
  onConflictDetected: [] as ConflictListener[],
  onHaltTriggered: [] as HaltListener[],
  onHighConfidence: [] as HighConfidenceListener[],
  onLowConfidence: [] as FusionListener[],
  onActionChange: [] as FusionListener[],
};

/**
 * Previous state for change detection
 */
let previousAction: string | null = null;

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize FusionCore
 */
export function initFusionCore(engines?: Record<string, any>): void {
  const core = getFusionCore();
  
  if (engines) {
    core.injectEngines(engines);
  }
  
  console.log('[Fusion Service] Initialized');
}

/**
 * Reset FusionCore
 */
export function resetFusion(): void {
  resetFusionCore();
  previousAction = null;
  console.log('[Fusion Service] Reset complete');
}

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Run fusion analysis
 */
export function runFusion(
  snapshot: any,
  context?: Partial<WeightContext>
): FusionDecision {
  const core = getFusionCore();
  
  // Execute fusion
  const decision = core.fuse(snapshot, context);
  
  // Store in state
  addFusionDecision(decision);
  
  // Log conflicts if any
  if (decision.conflictResolution.hadConflicts) {
    addConflictLog({
      timestamp: decision.timestamp,
      conflictCount: decision.conflictResolution.conflictsResolved,
      resolutionMethod: decision.conflictResolution.resolutionMethod,
      conflicts: decision.matrix.conflicts,
    });
    
    // Trigger conflict listeners
    listeners.onConflictDetected.forEach(fn => fn(decision.matrix.conflicts));
  }
  
  // Detect action change
  if (previousAction && previousAction !== decision.action) {
    listeners.onActionChange.forEach(fn => fn(decision));
  }
  previousAction = decision.action;
  
  // Trigger halt if needed
  if (decision.action === "HALT") {
    listeners.onHaltTriggered.forEach(fn => fn(decision.reason, decision));
  }
  
  // Trigger confidence listeners
  if (decision.confidence > 80) {
    listeners.onHighConfidence.forEach(fn => fn(decision));
  } else if (decision.confidence < 50) {
    listeners.onLowConfidence.forEach(fn => fn(decision));
  }
  
  // Trigger general fusion listeners
  listeners.onFusionComplete.forEach(fn => fn(decision));
  
  return decision;
}

/**
 * Get fusion output (last decision + summary)
 */
export function getFusionOutput(): {
  decision: FusionDecision | null;
  summary: FusionSummary | null;
  stats: ReturnType<typeof getFusionStats>;
  recentDecisions: FusionDecision[];
  qualityTrend: ReturnType<typeof getFusionQualityTrend>;
} {
  const core = getFusionCore();
  const lastDecision = core.getLastDecision();
  
  let summary: FusionSummary | null = null;
  if (lastDecision) {
    try {
      summary = core.getFusionSummary();
    } catch (error) {
      console.error('[Fusion Service] Failed to get summary:', error);
    }
  }
  
  return {
    decision: lastDecision,
    summary,
    stats: getFusionStats(),
    recentDecisions: getRecentDecisions(10),
    qualityTrend: getFusionQualityTrend(20),
  };
}

/**
 * Get last fusion decision
 */
export function getLastFusionDecision(): FusionDecision | null {
  const core = getFusionCore();
  return core.getLastDecision();
}

/**
 * Get last fusion matrix
 */
export function getLastFusionMatrix(): FusionMatrix | null {
  const core = getFusionCore();
  return core.getLastMatrix();
}

/**
 * Get last fusion weights
 */
export function getLastFusionWeights(): FusionWeights | null {
  const core = getFusionCore();
  return core.getLastWeights();
}

/**
 * Get fusion summary
 */
export function getFusionSummaryData(): FusionSummary | null {
  const core = getFusionCore();
  
  try {
    return core.getFusionSummary();
  } catch (error) {
    console.error('[Fusion Service] Failed to get summary:', error);
    return null;
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Register listener for fusion completion
 */
export function onFusionComplete(callback: FusionListener): void {
  listeners.onFusionComplete.push(callback);
}

/**
 * Register listener for conflict detection
 */
export function onConflictDetected(callback: ConflictListener): void {
  listeners.onConflictDetected.push(callback);
}

/**
 * Register listener for halt triggers
 */
export function onHaltTriggered(callback: HaltListener): void {
  listeners.onHaltTriggered.push(callback);
}

/**
 * Register listener for high confidence decisions
 */
export function onHighConfidence(callback: HighConfidenceListener): void {
  listeners.onHighConfidence.push(callback);
}

/**
 * Register listener for low confidence decisions
 */
export function onLowConfidence(callback: FusionListener): void {
  listeners.onLowConfidence.push(callback);
}

/**
 * Register listener for action changes
 */
export function onActionChange(callback: FusionListener): void {
  listeners.onActionChange.push(callback);
}

/**
 * Clear all listeners
 */
export function clearAllListeners(): void {
  Object.keys(listeners).forEach(key => {
    (listeners as any)[key] = [];
  });
  console.log('[Fusion Service] All listeners cleared');
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if should execute trade
 */
export function shouldExecuteTrade(decision: FusionDecision): boolean {
  return decision.action !== "HALT" &&
         decision.action !== "WAIT" &&
         decision.action !== "HOLD" &&
         decision.confidence >= 60;
}

/**
 * Get recommended position size based on confidence
 */
export function getRecommendedPositionSize(decision: FusionDecision): number {
  if (decision.action === "HALT") return 0;
  
  // Base position size on confidence
  const baseSize = decision.confidence;
  
  // Adjust for quality metrics
  const qualityMultiplier = decision.qualityMetrics.matrixQuality / 100;
  const consensusMultiplier = decision.qualityMetrics.consensusLevel / 100;
  
  const adjustedSize = baseSize * qualityMultiplier * consensusMultiplier;
  
  return Math.max(0, Math.min(100, Math.round(adjustedSize)));
}

/**
 * Get risk multiplier based on decision
 */
export function getRiskMultiplier(decision: FusionDecision): number {
  const riskLevels = {
    LOW: 1.0,
    MEDIUM: 1.2,
    HIGH: 1.5,
    CRITICAL: 2.0,
  };
  
  return riskLevels[decision.qualityMetrics.riskLevel as keyof typeof riskLevels] || 1.2;
}

/**
 * Get decision quality description
 */
export function getDecisionQuality(decision: FusionDecision): {
  rating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  description: string;
} {
  const quality = decision.qualityMetrics.matrixQuality;
  
  if (quality >= 80) {
    return {
      rating: "EXCELLENT",
      description: "High-quality decision with strong consensus and minimal conflicts",
    };
  } else if (quality >= 60) {
    return {
      rating: "GOOD",
      description: "Good decision quality with acceptable consensus",
    };
  } else if (quality >= 40) {
    return {
      rating: "FAIR",
      description: "Fair quality - proceed with caution",
    };
  } else {
    return {
      rating: "POOR",
      description: "Poor quality - recommend waiting for better conditions",
    };
  }
}

/**
 * Format fusion decision for display
 */
export function formatFusionDecision(decision: FusionDecision): string {
  const quality = getDecisionQuality(decision);
  const posSize = getRecommendedPositionSize(decision);
  
  return [
    `Action: ${decision.action}`,
    `Confidence: ${decision.confidence}%`,
    `Quality: ${quality.rating} (${decision.qualityMetrics.matrixQuality}%)`,
    `Consensus: ${decision.qualityMetrics.consensusLevel}%`,
    `Position Size: ${posSize}%`,
    `Reason: ${decision.reason}`,
  ].join('\n');
}

/**
 * Export decision to JSON
 */
export function exportDecision(decision: FusionDecision): string {
  return JSON.stringify(decision, null, 2);
}

/**
 * Get action emoji
 */
export function getActionEmoji(action: string): string {
  const emojis: Record<string, string> = {
    BUY: '📈',
    SELL: '📉',
    HOLD: '⏸️',
    CLOSE: '🔚',
    REDUCE: '📊',
    HALT: '🛑',
    WAIT: '⏳',
  };
  return emojis[action] || '❓';
}

/**
 * Get confidence color
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return 'green';
  if (confidence >= 60) return 'blue';
  if (confidence >= 40) return 'yellow';
  return 'red';
}

/**
 * Get risk color
 */
export function getRiskColor(riskLevel: string): string {
  const colors: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    CRITICAL: 'red',
  };
  return colors[riskLevel] || 'gray';
}

// ============================================================================
// Mock Helpers (for testing)
// ============================================================================

/**
 * Create mock snapshot
 */
export function createMockSnapshot(overrides: any = {}): any {
  return {
    timestamp: Date.now(),
    price: 50000,
    volume: 1000,
    spread: 10,
    volatility: 45,
    ...overrides,
  };
}

/**
 * Create mock engine results
 */
export function createMockEngineResults(): any[] {
  return [
    {
      engineName: "shield",
      action: "HOLD",
      confidence: 75,
      reason: "Shield active",
      priority: "HIGH",
      shieldActive: true,
      threatLevel: 60,
      blockedReasons: [],
      metadata: {},
      timestamp: Date.now(),
    },
    {
      engineName: "execution",
      action: "BUY",
      confidence: 80,
      reason: "Good execution quality",
      priority: "MEDIUM",
      executionQuality: 85,
      slippage: 0.1,
      liquidityScore: 90,
      recommendedOrderType: "LIMIT",
      metadata: {},
      timestamp: Date.now(),
    },
  ];
}

/**
 * Run fusion simulation
 */
export function runFusionSimulation(count: number = 10): FusionDecision[] {
  const decisions: FusionDecision[] = [];
  
  for (let i = 0; i < count; i++) {
    const snapshot = createMockSnapshot({
      volatility: 30 + Math.random() * 40,
      volume: 800 + Math.random() * 400,
    });
    
    try {
      const decision = runFusion(snapshot);
      decisions.push(decision);
    } catch (error) {
      console.error('[Fusion Service] Simulation error:', error);
    }
  }
  
  return decisions;
}

/**
 * Export service API
 */
export const FusionService = {
  // Core
  init: initFusionCore,
  reset: resetFusion,
  run: runFusion,
  getOutput: getFusionOutput,
  getLastDecision: getLastFusionDecision,
  getLastMatrix: getLastFusionMatrix,
  getLastWeights: getLastFusionWeights,
  getSummary: getFusionSummaryData,
  
  // Listeners
  onFusionComplete,
  onConflictDetected,
  onHaltTriggered,
  onHighConfidence,
  onLowConfidence,
  onActionChange,
  clearAllListeners,
  
  // Utilities
  shouldExecuteTrade,
  getRecommendedPositionSize,
  getRiskMultiplier,
  getDecisionQuality,
  formatDecision: formatFusionDecision,
  exportDecision,
  getActionEmoji,
  getConfidenceColor,
  getRiskColor,
  
  // Mock helpers
  createMockSnapshot,
  createMockEngineResults,
  runSimulation: runFusionSimulation,
};

export default FusionService;
