/**
 * ⚙️ AEG TYPES — Autonomous Execution Governor Type Definitions
 * 
 * STEP 24.35 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Autonomous Execution Governor (AEG).
 * These types define execution speed, size, aggression modes, and governance results.
 */

import type { HIF } from '@/app/lib/harmonizer/types';
import type { ERFValidationResult } from '@/app/lib/erf/types';

// ============================================================================
// EXECUTION SPEED
// ============================================================================

/**
 * ExecutionSpeed — How fast to execute
 */
export type ExecutionSpeed =
  | 'FAST' // Immediate execution, no delays
  | 'STAGED' // Execute in stages (split order)
  | 'SLOW' // Execute slowly, watch market
  | 'DELAY'; // Wait for better conditions

// ============================================================================
// EXECUTION SIZE
// ============================================================================

/**
 * ExecutionSize — How much to execute
 */
export type ExecutionSize =
  | 'FULL' // Full position size (100%)
  | 'PARTIAL' // Partial position size (50-80%)
  | 'MICRO'; // Micro position size (10-30%)

// ============================================================================
// AGGRESSION MODE
// ============================================================================

/**
 * AggressionMode — Trading aggression level
 */
export type AggressionMode =
  | 'AGGRESSIVE' // Take risks, high aggression
  | 'NEUTRAL' // Balanced approach
  | 'DEFENSIVE' // Conservative, cautious
  | 'FROZEN'; // Do not trade

// ============================================================================
// GOVERNOR RESULT — Main Output
// ============================================================================

/**
 * GovernorResult — Complete governance decision
 */
export interface GovernorResult {
  speed: ExecutionSpeed;
  size: ExecutionSize;
  aggression: AggressionMode;
  allowed: boolean;
  reasoning: string;
  context: GovernorContext;
  evaluationTime: number; // milliseconds
  timestamp: number;
}

// ============================================================================
// GOVERNOR CONTEXT
// ============================================================================

/**
 * GovernorContext — Input context for AEG evaluation
 */
export interface GovernorContext {
  erfStatus: ERFValidationResult;
  esmStatus: any; // ESM survival status (would be typed properly)
  hif: HIF;
  timestamp: number;
}

// ============================================================================
// AEG CONFIGURATION
// ============================================================================

/**
 * AEGConfig — Configuration for AEG behavior
 */
export interface AEGConfig {
  enableSpeedControl: boolean; // Default: true
  enableSizeControl: boolean; // Default: true
  enableAggressionControl: boolean; // Default: true
  speedWeights: {
    erfStatus: number; // Default: 0.4
    esmHealth: number; // Default: 0.3
    volatility: number; // Default: 0.2
    latency: number; // Default: 0.1
  };
  sizeWeights: {
    shieldState: number; // Default: 0.35
    riskLevel: number; // Default: 0.30
    confidence: number; // Default: 0.25
    survivalScore: number; // Default: 0.10
  };
  aggressionWeights: {
    threatLevel: number; // Default: 0.40
    shieldState: number; // Default: 0.30
    confidence: number; // Default: 0.20
    volatility: number; // Default: 0.10
  };
  thresholds: {
    fastSpeedMin: number; // Default: 80
    stagedSpeedMin: number; // Default: 60
    slowSpeedMin: number; // Default: 40
    fullSizeMin: number; // Default: 75
    partialSizeMin: number; // Default: 50
    aggressiveMin: number; // Default: 70
    neutralMin: number; // Default: 40
    defensiveMin: number; // Default: 20
  };
}

// ============================================================================
// SPEED CALCULATION INPUT
// ============================================================================

/**
 * SpeedCalculationInput — Inputs for speed calculation
 */
export interface SpeedCalculationInput {
  erfStatus: ERFValidationResult;
  esmHealth: number; // 0-100
  volatility: number; // 0-100
  latency: number; // milliseconds
}

// ============================================================================
// SIZE CALCULATION INPUT
// ============================================================================

/**
 * SizeCalculationInput — Inputs for size calculation
 */
export interface SizeCalculationInput {
  shieldState: HIF['shieldState'];
  riskLevel: HIF['riskLevel'];
  confidence: number; // 0-100
  survivalScore: number; // 0-100
}

// ============================================================================
// AGGRESSION CALCULATION INPUT
// ============================================================================

/**
 * AggressionCalculationInput — Inputs for aggression calculation
 */
export interface AggressionCalculationInput {
  threatLevel: number; // 0-100
  shieldState: HIF['shieldState'];
  confidence: number; // 0-100
  volatility: number; // 0-100
}

// ============================================================================
// AEG STATISTICS
// ============================================================================

/**
 * AEGStatistics — Statistics tracked by AEG
 */
export interface AEGStatistics {
  totalEvaluations: number;
  allowedCount: number;
  deniedCount: number;
  fastExecutions: number;
  stagedExecutions: number;
  slowExecutions: number;
  delayedExecutions: number;
  fullSizeExecutions: number;
  partialSizeExecutions: number;
  microSizeExecutions: number;
  aggressiveMode: number;
  neutralMode: number;
  defensiveMode: number;
  frozenMode: number;
  lastEvaluationTime: number; // milliseconds
}

// ============================================================================
// GOVERNOR SNAPSHOT
// ============================================================================

/**
 * GovernorSnapshot — High-level snapshot of governor state
 */
export interface GovernorSnapshot {
  currentSpeed: ExecutionSpeed;
  currentSize: ExecutionSize;
  currentAggression: AggressionMode;
  allowed: boolean;
  lastEvaluation: number; // timestamp
  statistics: AEGStatistics;
}

// ============================================================================
// EXECUTION PROFILE
// ============================================================================

/**
 * ExecutionProfile — Complete execution behavior profile
 */
export interface ExecutionProfile {
  speed: ExecutionSpeed;
  size: ExecutionSize;
  aggression: AggressionMode;
  sizePercentage: number; // Actual percentage (10-100%)
  speedDelay: number; // Delay in ms
  riskTolerance: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedAction: 'EXECUTE' | 'WAIT' | 'ABORT';
}

// ============================================================================
// AEG EVENT
// ============================================================================

/**
 * AEGEvent — Events emitted by AEG
 */
export interface AEGEvent {
  type:
    | 'EVALUATION_STARTED'
    | 'EVALUATION_COMPLETED'
    | 'EXECUTION_ALLOWED'
    | 'EXECUTION_DENIED'
    | 'SPEED_CHANGED'
    | 'SIZE_CHANGED'
    | 'AGGRESSION_CHANGED';
  timestamp: number;
  data?: any;
  message?: string;
}

// ============================================================================
// GOVERNANCE RULE
// ============================================================================

/**
 * GovernanceRule — Individual governance rule
 */
export interface GovernanceRule {
  name: string;
  description: string;
  condition: string;
  action: 'ALLOW' | 'DENY' | 'MODIFY';
  priority: number; // Higher = more important
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  ExecutionSpeed as default,
  ExecutionSize,
  AggressionMode,
  GovernorResult,
  GovernorContext,
  AEGConfig,
  SpeedCalculationInput,
  SizeCalculationInput,
  AggressionCalculationInput,
  AEGStatistics,
  GovernorSnapshot,
  ExecutionProfile,
  AEGEvent,
  GovernanceRule,
};
