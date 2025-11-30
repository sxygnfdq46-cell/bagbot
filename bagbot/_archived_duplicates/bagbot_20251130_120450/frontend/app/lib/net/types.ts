/**
 * ⚡ NET TYPES — Neural Execution Translator Type Definitions
 * 
 * STEP 24.33 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Neural Execution Translator (NET).
 * These types define the contract between the harmonizer (HIF) and execution systems.
 * 
 * Note: Some types are re-exported from harmonizer/types.ts to maintain consistency.
 */

// Re-export types from harmonizer that are shared
export type {
  HIF,
  ExecutionInstruction,
  ExecutionContext,
  SafetyGateResult,
  ActionConfidenceLevel,
  ThreatOverrideState,
} from '@/app/lib/harmonizer/types';

// ============================================================================
// NET-SPECIFIC CONFIGURATION
// ============================================================================

/**
 * NETConfig — Configuration for Neural Execution Translator behavior
 */
export interface NETConfig {
  enableSafetyGates: boolean; // Default: true
  minConfidenceForEntry: number; // Default: 60 (0-100)
  maxThreatLevelForEntry: number; // Default: 70 (0-100)
  volatilitySpikePauseThreshold: number; // Default: 80 (0-100)
  conflictOverrideAction: 'WAIT' | 'REDUCE_POSITION' | 'HOLD'; // Default: WAIT
  aggressiveModeMultiplier: number; // Default: 1.2
  safeModeMultiplier: number; // Default: 0.6
}

// ============================================================================
// TRANSLATION RESULT — Extended ExecutionInstruction with metadata
// ============================================================================

/**
 * TranslationResult — Full result of HIF → ExecutionInstruction translation
 */
export interface TranslationResult {
  instruction: import('@/app/lib/harmonizer/types').ExecutionInstruction;
  hif: import('@/app/lib/harmonizer/types').HIF;
  translationTime: number; // milliseconds
  wasSafetyBlocked: boolean;
  wasThreatOverridden: boolean;
  wasConflictOverridden: boolean;
}

// ============================================================================
// NET STATISTICS
// ============================================================================

/**
 * NETStatistics — Statistics tracked by NET
 */
export interface NETStatistics {
  totalTranslations: number;
  safetyGateBlocks: number;
  threatOverrides: number;
  conflictOverrides: number;
  lastTranslationTime: number; // milliseconds
}

// ============================================================================
// ACTION TYPE — All possible execution actions
// ============================================================================

/**
 * ExecutionActionType — All possible actions NET can output
 */
export type ExecutionActionType =
  | 'EXECUTE_LONG'
  | 'EXECUTE_SHORT'
  | 'HOLD'
  | 'REDUCE_POSITION'
  | 'CLOSE_IMMEDIATELY'
  | 'AVOID_MARKET'
  | 'ENTER_SCOUT_MODE'
  | 'ENTER_AGGRO_MODE';

// ============================================================================
// POSITION SIZING STRATEGY
// ============================================================================

/**
 * PositionSizingStrategy — How position size is calculated
 */
export interface PositionSizingStrategy {
  baseSize: number; // 0-100 (percentage)
  confidenceMultiplier: number; // 0-1
  systemModeMultiplier: number; // 0.6 (safe) - 1.2 (aggressive)
  minSize: number; // Minimum position size (default: 10%)
  maxSize: number; // Maximum position size (default: 100%)
}

// ============================================================================
// RISK PARAMETERS
// ============================================================================

/**
 * RiskParameters — Stop loss and take profit parameters
 */
export interface RiskParameters {
  stopLossPercent: number; // Percentage below entry
  takeProfitPercent: number; // Percentage above entry
  riskRewardRatio: number; // Target ratio (e.g., 2:1 = 2.0)
  trailingStopEnabled: boolean;
  trailingStopPercent?: number;
}

// ============================================================================
// URGENCY LEVEL
// ============================================================================

/**
 * UrgencyLevel — How quickly action should be taken
 */
export type UrgencyLevel = 'immediate' | 'normal' | 'patient';

// ============================================================================
// SAFETY CHECK DETAIL
// ============================================================================

/**
 * SafetyCheckDetail — Individual safety check result
 */
export interface SafetyCheckDetail {
  name: string;
  passed: boolean;
  description: string;
  value?: number | string;
  threshold?: number | string;
}

// ============================================================================
// ENHANCED SAFETY GATE RESULT
// ============================================================================

/**
 * EnhancedSafetyGateResult — Extended safety gate result with details
 */
export interface EnhancedSafetyGateResult extends import('@/app/lib/harmonizer/types').SafetyGateResult {
  checkDetails: SafetyCheckDetail[];
  overallScore: number; // 0-100
  criticalFailures: string[]; // List of critical failures
}

// ============================================================================
// CONTEXT ADJUSTMENT RESULT
// ============================================================================

/**
 * ContextAdjustmentResult — Result of applying context to action
 */
export interface ContextAdjustmentResult {
  originalAction: ExecutionActionType;
  adjustedAction: ExecutionActionType;
  wasAdjusted: boolean;
  adjustmentReason?: string;
  contextFactors: {
    hasExistingPosition: boolean;
    positionDirection?: 'LONG' | 'SHORT' | 'NONE';
    unrealizedPnL?: number;
    dailyPnL?: number;
    accountHealth?: 'HEALTHY' | 'CAUTION' | 'CRITICAL';
  };
}

// ============================================================================
// TRANSLATION PIPELINE STAGE
// ============================================================================

/**
 * TranslationPipelineStage — Stages in the translation pipeline
 */
export type TranslationPipelineStage =
  | 'INPUT_VALIDATION'
  | 'SAFETY_GATES'
  | 'THREAT_OVERRIDE_CHECK'
  | 'BASE_ACTION_COMPUTATION'
  | 'CONTEXT_ADJUSTMENT'
  | 'FINALIZATION'
  | 'OUTPUT';

// ============================================================================
// TRANSLATION PIPELINE STATE
// ============================================================================

/**
 * TranslationPipelineState — State of translation at each stage
 */
export interface TranslationPipelineState {
  stage: TranslationPipelineStage;
  currentAction?: ExecutionActionType;
  safetyPassed: boolean;
  threatOverrideActive: boolean;
  conflictDetected: boolean;
  timestamp: number;
}

// ============================================================================
// NET EVENT
// ============================================================================

/**
 * NETEvent — Events emitted by NET
 */
export interface NETEvent {
  type:
    | 'TRANSLATION_STARTED'
    | 'TRANSLATION_COMPLETED'
    | 'SAFETY_GATE_BLOCKED'
    | 'THREAT_OVERRIDE_ACTIVATED'
    | 'CONFLICT_OVERRIDE_ACTIVATED'
    | 'CONTEXT_ADJUSTMENT_APPLIED'
    | 'ERROR';
  timestamp: number;
  data?: any;
  message?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  NETConfig as default,
  TranslationResult,
  NETStatistics,
  ExecutionActionType,
  PositionSizingStrategy,
  RiskParameters,
  UrgencyLevel,
  SafetyCheckDetail,
  EnhancedSafetyGateResult,
  ContextAdjustmentResult,
  TranslationPipelineStage,
  TranslationPipelineState,
  NETEvent,
};
