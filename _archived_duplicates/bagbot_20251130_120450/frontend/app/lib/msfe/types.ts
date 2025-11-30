/**
 * 🔮 MSFE TYPES — Multi-Layer Strategy Fusion Engine Type Definitions
 * 
 * STEP 24.36 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Strategy Fusion Engine (MSFE).
 * These types define strategy outputs, scores, weights, and fusion results.
 */

// ============================================================================
// STRATEGY OUTPUT — Input from individual strategies
// ============================================================================

/**
 * StrategyOutput — Output from a single trading strategy
 */
export interface StrategyOutput {
  strategyName: string;
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // 0-100
  reasoning?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// STRATEGY SCORE — Scored strategy output
// ============================================================================

/**
 * StrategyScore — Strategy output with scoring
 */
export interface StrategyScore {
  strategyName: string;
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  confidence: number; // Original confidence
  rawScore: number; // Pre-adjustment score
  adjustedScore: number; // Post-adjustment score (0-100)
  reasoning: string;
}

// ============================================================================
// WEIGHT MAP — Strategy weights
// ============================================================================

/**
 * WeightMap — Weights assigned to each strategy
 */
export type WeightMap = Record<string, number>;

// ============================================================================
// FUSION RESULT — Main Output
// ============================================================================

/**
 * FusionResult — Result of strategy fusion
 */
export interface FusionResult {
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  strength: number; // 0-100
  weights: WeightMap;
  hasConflict: boolean;
  conflictResolution: ConflictResolution | null;
  debug: FusionDebug;
  timestamp: number;
}

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * ConflictResolution — Result of conflict resolution
 */
export interface ConflictResolution {
  originalSignal: 'LONG' | 'SHORT' | 'NEUTRAL';
  resolvedSignal: 'LONG' | 'SHORT' | 'NEUTRAL';
  reason: string;
  strategyDistribution: {
    LONG: number;
    SHORT: number;
    NEUTRAL: number;
  };
}

// ============================================================================
// FUSION DEBUG
// ============================================================================

/**
 * FusionDebug — Debug information for fusion
 */
export interface FusionDebug {
  contributions: Record<string, StrategyContribution>;
  totalWeight: number;
  longStrength: string;
  shortStrength: string;
  neutralStrength: string;
  dominantSignal: 'LONG' | 'SHORT' | 'NEUTRAL';
}

/**
 * StrategyContribution — Individual strategy contribution
 */
export interface StrategyContribution {
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
  score: number;
  weight: string;
  contribution: string;
}

// ============================================================================
// MARKET CONTEXT
// ============================================================================

/**
 * MarketContext — Current market conditions for weight adjustment
 */
export interface MarketContext {
  shield: string; // Shield state (CALM, DEFENSIVE, etc.)
  threats: number; // Threat level (0-100)
  volatility: string; // Volatility status (low, medium, high)
  timestamp: number;
  riskLevel?: 'low' | 'medium' | 'high';
  trendDirection?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

// ============================================================================
// MSFE CONFIGURATION
// ============================================================================

/**
 * MSFEConfig — Configuration for Strategy Fusion Engine
 */
export interface MSFEConfig {
  enableDynamicWeights: boolean; // Default: true
  enableConflictResolution: boolean; // Default: true
  enablePerformanceTracking: boolean; // Default: true
  baseWeights: WeightMap; // Base weights for each strategy
  conflictThreshold: number; // Default: 0.4 (signal spread > 0.4 = conflict)
  minStrengthForSignal: number; // Default: 30 (min strength to output signal)
  performanceWindow: number; // Default: 20 (track last N fusions)
}

// ============================================================================
// STRATEGY PERFORMANCE
// ============================================================================

/**
 * StrategyPerformance — Historical performance tracking
 */
export interface StrategyPerformance {
  strategyName: string;
  history: number[]; // Recent scores
  averageScore: number;
  successRate: number; // 0-1
  lastUpdated: number;
}

// ============================================================================
// MSFE STATISTICS
// ============================================================================

/**
 * MSFEStatistics — Statistics tracked by MSFE
 */
export interface MSFEStatistics {
  totalFusions: number;
  longSignals: number;
  shortSignals: number;
  neutralSignals: number;
  conflictsResolved: number;
  averageStrength: number;
  lastFusionTime: number; // milliseconds
}

// ============================================================================
// FUSION SNAPSHOT
// ============================================================================

/**
 * FusionSnapshot — High-level snapshot of fusion state
 */
export interface FusionSnapshot {
  currentSignal: 'LONG' | 'SHORT' | 'NEUTRAL';
  currentStrength: number;
  activeStrategies: number;
  topStrategy: string;
  conflictRate: number; // 0-1
  lastFusion: number; // timestamp
  statistics: MSFEStatistics;
}

// ============================================================================
// WEIGHT ADAPTATION CONTEXT
// ============================================================================

/**
 * WeightAdaptationContext — Context for weight adaptation
 */
export interface WeightAdaptationContext {
  shield: string;
  threats: number;
  volatility: string;
  scores: StrategyScore[];
  baseWeights: WeightMap;
}

// ============================================================================
// MSFE EVENT
// ============================================================================

/**
 * MSFEEvent — Events emitted by MSFE
 */
export interface MSFEEvent {
  type:
    | 'FUSION_STARTED'
    | 'FUSION_COMPLETED'
    | 'CONFLICT_DETECTED'
    | 'CONFLICT_RESOLVED'
    | 'SIGNAL_CHANGED'
    | 'WEIGHT_ADAPTED';
  timestamp: number;
  data?: any;
  message?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  StrategyOutput as default,
  StrategyScore,
  WeightMap,
  FusionResult,
  MarketContext,
  MSFEConfig,
  ConflictResolution,
  FusionDebug,
  StrategyContribution,
  StrategyPerformance,
  MSFEStatistics,
  FusionSnapshot,
  WeightAdaptationContext,
  MSFEEvent,
};
