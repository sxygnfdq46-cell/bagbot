/**
 * 🛡️ ERF TYPES — Execution Reality Filter Type Definitions
 * 
 * STEP 24.34 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Execution Reality Filter (ERF).
 * These types define market validation states, distortion types, and filter results.
 */

import type { HIF, ExecutionInstruction } from '@/app/lib/harmonizer/types';

// ============================================================================
// REALITY FILTERED ACTION — Main Output
// ============================================================================

/**
 * RealityFilteredAction — ERF decision on execution
 */
export type RealityFilteredAction = 'OK' | 'DELAY' | 'ABORT' | 'MODIFY';

// ============================================================================
// DISTORTION TYPE — Types of market distortions
// ============================================================================

/**
 * DistortionType — Detected market anomalies
 */
export type DistortionType =
  | 'VOLATILITY_SPIKE'
  | 'STALE_DATA'
  | 'EXTREME_LATENCY'
  | 'TREND_REVERSAL'
  | 'TREND_INSTABILITY'
  | 'CONFLICTING_SIGNALS'
  | 'EXTREME_THREAT'
  | 'CONFIDENCE_MISMATCH'
  | 'SHIELD_MISMATCH'
  | 'MODE_RISK_MISMATCH'
  | 'LOW_CONFIDENCE'
  | null;

// ============================================================================
// MARKET SYNC STATE
// ============================================================================

/**
 * MarketSyncState — How well aligned is market state with execution intent
 */
export type MarketSyncState =
  | 'FULLY_SYNCED' // Perfect conditions
  | 'MOSTLY_SYNCED' // Good conditions
  | 'PARTIALLY_SYNCED' // Acceptable conditions
  | 'OUT_OF_SYNC'; // Poor conditions

// ============================================================================
// LATENCY STATUS
// ============================================================================

/**
 * LatencyStatus — Data freshness quality
 */
export type LatencyStatus =
  | 'EXCELLENT' // <500ms
  | 'GOOD' // 500-1000ms
  | 'ACCEPTABLE' // 1-2s
  | 'DEGRADED' // 2-5s
  | 'CRITICAL'; // >5s

// ============================================================================
// ERF VALIDATION RESULT — Main Output
// ============================================================================

/**
 * ERFValidationResult — Complete validation result from ERF
 */
export interface ERFValidationResult {
  filterDecision: RealityFilteredAction;
  originalAction: ExecutionInstruction['action'];
  modifiedAction: ExecutionInstruction['action'];
  distortionType: DistortionType;
  marketSyncState: MarketSyncState;
  latencyStatus: LatencyStatus;
  confidence: number; // 0-100
  validationTime: number; // milliseconds
  timestamp: number;
  reason: string;
}

// ============================================================================
// ERF CONFIGURATION
// ============================================================================

/**
 * ERFConfig — Configuration for ERF behavior
 */
export interface ERFConfig {
  maxLatencyMs: number; // Default: 2000
  volatilityThreshold: number; // Default: 85 (0-100)
  distortionSensitivity: number; // Default: 0.7 (0-1)
  trendSyncWindow: number; // Default: 5000ms
  minConfidenceForExecution: number; // Default: 55 (0-100)
  enableVolatilityCheck: boolean; // Default: true
  enableLatencyCheck: boolean; // Default: true
  enableTrendSyncCheck: boolean; // Default: true
  enableDistortionDetection: boolean; // Default: true
}

// ============================================================================
// VOLATILITY CHECK RESULT
// ============================================================================

/**
 * VolatilityCheckResult — Result of volatility validation
 */
export interface VolatilityCheckResult {
  passed: boolean;
  currentVolatility: number; // 0-100
  averageVolatility: number; // 0-100
  suddenSpike: boolean;
  reason?: string;
}

// ============================================================================
// LATENCY CHECK RESULT
// ============================================================================

/**
 * LatencyCheckResult — Result of latency validation
 */
export interface LatencyCheckResult {
  passed: boolean;
  latencyMs: number;
  status: LatencyStatus;
  reason?: string;
}

// ============================================================================
// TREND CHECK RESULT
// ============================================================================

/**
 * TrendCheckResult — Result of trend synchronization check
 */
export interface TrendCheckResult {
  passed: boolean;
  trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendStrength: number; // 0-1
  reversalDetected: boolean;
  instabilityDetected: boolean;
  reason?: string;
}

// ============================================================================
// DISTORTION CHECK RESULT
// ============================================================================

/**
 * DistortionCheckResult — Result of market distortion detection
 */
export interface DistortionCheckResult {
  detected: boolean;
  distortionType?: DistortionType;
  severity?: number; // 0-1
  description?: string;
}

// ============================================================================
// ERF STATISTICS
// ============================================================================

/**
 * ERFStatistics — Statistics tracked by ERF
 */
export interface ERFStatistics {
  totalValidations: number;
  okCount: number;
  delayCount: number;
  abortCount: number;
  modifyCount: number;
  distortionsDetected: number;
  latencyIssues: number;
  lastValidationTime: number; // milliseconds
}

// ============================================================================
// MARKET REALITY SNAPSHOT
// ============================================================================

/**
 * MarketRealitySnapshot — Complete market state snapshot
 */
export interface MarketRealitySnapshot {
  timestamp: number;
  syncState: MarketSyncState;
  latencyStatus: LatencyStatus;
  volatility: {
    current: number;
    average: number;
    trend: 'RISING' | 'FALLING' | 'STABLE';
  };
  trend: {
    direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: number;
    stability: 'STABLE' | 'UNSTABLE';
  };
  distortions: DistortionType[];
  executionRecommendation: 'SAFE' | 'CAUTION' | 'DANGEROUS';
}

// ============================================================================
// EXECUTION REALITY CONTEXT
// ============================================================================

/**
 * ExecutionRealityContext — Context for ERF validation
 */
export interface ExecutionRealityContext {
  hif: HIF;
  action: ExecutionInstruction;
  marketSnapshot?: MarketRealitySnapshot;
  recentValidations?: ERFValidationResult[];
}

// ============================================================================
// ERF EVENT
// ============================================================================

/**
 * ERFEvent — Events emitted by ERF
 */
export interface ERFEvent {
  type:
    | 'VALIDATION_STARTED'
    | 'VALIDATION_COMPLETED'
    | 'DISTORTION_DETECTED'
    | 'EXECUTION_DELAYED'
    | 'EXECUTION_ABORTED'
    | 'EXECUTION_MODIFIED'
    | 'LATENCY_WARNING'
    | 'VOLATILITY_WARNING'
    | 'TREND_REVERSAL';
  timestamp: number;
  data?: any;
  message?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  RealityFilteredAction as default,
  DistortionType,
  MarketSyncState,
  LatencyStatus,
  ERFValidationResult,
  ERFConfig,
  VolatilityCheckResult,
  LatencyCheckResult,
  TrendCheckResult,
  DistortionCheckResult,
  ERFStatistics,
  MarketRealitySnapshot,
  ExecutionRealityContext,
  ERFEvent,
};
