/**
 * 🎼 EXO TYPES — Execution Orchestrator Type Definitions
 * 
 * STEP 24.39 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Execution Orchestrator (EXO).
 * These types define the final execution decision, signal merging, and rule validation.
 */

// Import types from previous layers
import type { DPLDecision } from '../dpl/types';
import type { FusionResult } from '../msfe/types';
import type { EAETiming } from '../eae/types';

// ============================================================================
// EXO DECISION — Main Output
// ============================================================================

/**
 * EXODecision — Final execution decision from Orchestrator
 */
export interface EXODecision {
  command: 'EXECUTE' | 'WAIT' | 'CANCEL' | 'SCALE';
  reason: string[];
  strength: number; // 0-100 (overall execution confidence)
  timing: EAETiming | null;
  riskScore: number; // 0-100 (higher = more risk)
  finalSize: number; // Final position size (0-1)
  metadata: EXOMetadata;
  timestamp: number;
}

// ============================================================================
// EXO CONTEXT
// ============================================================================

/**
 * EXOContext — Context data for EXO evaluation
 */
export interface EXOContext {
  dplDecision: DPLDecision;
  fusionResult: FusionResult;
  eaeTiming: EAETiming;
  shieldState: string; // CALM, DEFENSIVE, PROTECTIVE, AGGRO_OBS
  marketContext: {
    shield: string;
    threats: number;
    volatility: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  orderbook?: OrderbookData;
  currentPosition?: PositionData;
  accountBalance?: number;
  timestamp: number;
}

// ============================================================================
// SIGNAL MERGE DATA
// ============================================================================

/**
 * SignalMergeData — Result of merging all decision layers
 */
export interface SignalMergeData {
  finalSignal: 'LONG' | 'SHORT' | 'WAIT';
  signalStrength: number; // 0-100
  confidence: number; // 0-100
  weights: SignalWeights;
  alignment: SignalAlignment;
  conflicts: SignalConflict[];
}

/**
 * SignalWeights — Weights assigned to each layer
 */
export interface SignalWeights {
  dpl: number; // Default: 0.35
  fusion: number; // Default: 0.30
  eae: number; // Default: 0.25
  shield: number; // Default: 0.10
}

/**
 * SignalAlignment — Alignment status between layers
 */
export interface SignalAlignment {
  dplAligned: boolean;
  fusionAligned: boolean;
  eaeAligned: boolean;
  shieldAligned: boolean;
  overallAlignment: number; // 0-100
}

/**
 * SignalConflict — Detected conflicts between layers
 */
export interface SignalConflict {
  layers: string[];
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// ============================================================================
// EXECUTION RULE RESULT
// ============================================================================

/**
 * ExecutionRuleResult — Result from a single execution rule
 */
export interface ExecutionRuleResult {
  ruleName: string;
  passed: boolean;
  score: number; // 0-100
  reason: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  metadata?: Record<string, any>;
}

// ============================================================================
// EXO METADATA
// ============================================================================

/**
 * EXOMetadata — Debug and tracking metadata
 */
export interface EXOMetadata {
  signalMerge: SignalMergeData;
  ruleResults: ExecutionRuleResult[];
  passedRules: string[];
  failedRules: string[];
  blockingRules: string[];
  layerInputs: {
    dpl: string; // DPL action
    fusion: string; // Fusion signal
    eae: string; // EAE fire status
    shield: string; // Shield state
  };
  computationTime: number; // milliseconds
}

// ============================================================================
// ORDERBOOK DATA
// ============================================================================

/**
 * OrderbookData — Orderbook snapshot
 */
export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bidDepth: number;
  askDepth: number;
  spread: number;
  spreadPercent: number;
  imbalance: number;
  liquidityScore: number;
  timestamp: number;
}

/**
 * OrderbookLevel — Single orderbook level
 */
export interface OrderbookLevel {
  price: number;
  volume: number;
}

// ============================================================================
// POSITION DATA
// ============================================================================

/**
 * PositionData — Current trading position
 */
export interface PositionData {
  symbol: string;
  side: 'LONG' | 'SHORT' | 'NONE';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  leverage: number;
  timestamp: number;
}

// ============================================================================
// EXO CONFIGURATION
// ============================================================================

/**
 * EXOConfig — Configuration for Execution Orchestrator
 */
export interface EXOConfig {
  enableSignalMerge: boolean; // Default: true
  enableRuleValidation: boolean; // Default: true
  minExecutionStrength: number; // Default: 60
  maxRiskScore: number; // Default: 70
  signalWeights: SignalWeights;
  blockingRules: string[]; // Rules that must pass
  scalingEnabled: boolean; // Default: true
  maxPositionSize: number; // Default: 1.0 (100%)
  minPositionSize: number; // Default: 0.1 (10%)
}

// ============================================================================
// EXO STATISTICS
// ============================================================================

/**
 * EXOStatistics — Statistics tracked by EXO
 */
export interface EXOStatistics {
  totalEvaluations: number;
  executionsIssued: number;
  executionsBlocked: number;
  waitsIssued: number;
  cancelsIssued: number;
  scalesIssued: number;
  averageStrength: number;
  averageRiskScore: number;
  ruleBlockRate: Record<string, number>; // Block rate per rule
  lastEvaluationTime: number; // milliseconds
}

// ============================================================================
// EXO SNAPSHOT
// ============================================================================

/**
 * EXOSnapshot — High-level snapshot of EXO state
 */
export interface EXOSnapshot {
  lastDecision: EXODecision | null;
  lastCommand: 'EXECUTE' | 'WAIT' | 'CANCEL' | 'SCALE' | null;
  executionRate: number; // 0-1
  blockRate: number; // 0-1
  averageStrength: number;
  averageRiskScore: number;
  topBlockingRule: string | null;
  signalAlignment: number; // 0-100
  statistics: EXOStatistics;
  lastEvaluation: number; // timestamp
}

// ============================================================================
// RULE CONTEXT
// ============================================================================

/**
 * RuleContext — Context passed to rule functions
 */
export interface RuleContext {
  eaeTiming?: EAETiming;
  shieldState: string;
  marketContext: {
    shield: string;
    threats: number;
    volatility: string;
  };
  orderbook?: OrderbookData;
  currentPosition?: PositionData;
  accountBalance?: number;
  timestamp: number;
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * RiskAssessment — Risk analysis result
 */
export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  factors: {
    volatilityRisk: number;
    liquidityRisk: number;
    spreadRisk: number;
    positionRisk: number;
    shieldRisk: number;
  };
  recommendation: string;
}

// ============================================================================
// EXECUTION COMMAND DETAILS
// ============================================================================

/**
 * ExecutionCommandDetails — Detailed execution parameters
 */
export interface ExecutionCommandDetails {
  command: 'EXECUTE' | 'WAIT' | 'CANCEL' | 'SCALE';
  action: 'LONG' | 'SHORT' | 'CLOSE' | 'NONE';
  size: number; // Position size (0-1)
  timing: {
    immediate: boolean;
    windowStart: number;
    windowEnd: number;
  };
  risk: {
    score: number;
    maxLoss: number;
    stopLoss?: number;
    takeProfit?: number;
  };
  metadata: Record<string, any>;
}

// ============================================================================
// LAYER INPUTS
// ============================================================================

/**
 * LayerInputs — Input summary from all layers
 */
export interface LayerInputs {
  dpl: {
    allowTrade: boolean;
    action: string;
    confidence: number;
    overallScore: number;
  };
  fusion: {
    signal: string;
    strength: number;
    hasConflict: boolean;
  };
  eae: {
    fire: boolean;
    timingScore: number;
    syncState: string;
    recommendedSize: number;
  };
  shield: {
    state: string;
    threats: number;
    volatility: string;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  EXODecision as default,
  EXOContext,
  SignalMergeData,
  SignalWeights,
  SignalAlignment,
  SignalConflict,
  ExecutionRuleResult,
  EXOMetadata,
  OrderbookData,
  OrderbookLevel,
  PositionData,
  EXOConfig,
  EXOStatistics,
  EXOSnapshot,
  RuleContext,
  RiskAssessment,
  ExecutionCommandDetails,
  LayerInputs,
};
