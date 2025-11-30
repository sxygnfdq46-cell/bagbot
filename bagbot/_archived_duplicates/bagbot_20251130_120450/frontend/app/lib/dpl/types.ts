/**
 * 🎯 DPL TYPES — Decision Precision Layer Type Definitions
 * 
 * STEP 24.37 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Decision Precision Layer (DPL).
 * These types define decision validation, micro-trend analysis, and precision checks.
 */

// ============================================================================
// DPL DECISION — Main Output
// ============================================================================

/**
 * DPLDecision — Final decision from Decision Precision Layer
 */
export interface DPLDecision {
  allowTrade: boolean;
  action: 'LONG' | 'SHORT' | 'WAIT';
  confidence: number; // 0-100
  reasons: string[];
  validatorResults: DPLValidatorResult[];
  overallScore: number; // 0-100
  debug: DPLDebug;
  timestamp: number;
}

// ============================================================================
// VALIDATOR RESULT
// ============================================================================

/**
 * DPLValidatorResult — Result from a single validator
 */
export interface DPLValidatorResult {
  validatorName: string;
  pass: boolean;
  score: number; // 0-100
  reason: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// DPL CONTEXT
// ============================================================================

/**
 * DPLContext — Context data for DPL evaluation
 */
export interface DPLContext {
  fusionResult: {
    signal: 'LONG' | 'SHORT' | 'NEUTRAL';
    strength: number;
  };
  marketContext: {
    shield: string;
    threats: number;
    volatility: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  microTrendData: MicroTrendData;
  orderbookData?: OrderbookData;
  candleData?: CandleData;
  timestamp: number;
}

// ============================================================================
// MICRO TREND DATA
// ============================================================================

/**
 * MicroTrendData — Short-term trend analysis data
 */
export interface MicroTrendData {
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  strength: number; // 0-100
  momentum: number; // -100 to +100
  duration: number; // milliseconds
  recentPrices: number[]; // Last N prices
  priceChange: number; // Percentage change
  velocityChange: number; // Rate of change acceleration
  timestamp: number;
}

// ============================================================================
// ORDERBOOK DATA
// ============================================================================

/**
 * OrderbookData — Orderbook snapshot for liquidity/pressure analysis
 */
export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bidDepth: number; // Total bid volume
  askDepth: number; // Total ask volume
  spread: number; // Best ask - best bid
  spreadPercent: number; // Spread as percentage
  imbalance: number; // -1 to +1 (negative = sell pressure, positive = buy pressure)
  liquidityScore: number; // 0-100
  timestamp: number;
}

/**
 * OrderbookLevel — Single price level in orderbook
 */
export interface OrderbookLevel {
  price: number;
  volume: number;
}

// ============================================================================
// CANDLE DATA
// ============================================================================

/**
 * CandleData — Recent candlestick data for precision checks
 */
export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bodySize: number; // Close - Open
  wickSize: number; // High - Low
  bodyPercent: number; // Body / Wick ratio
  isHammer?: boolean;
  isDoji?: boolean;
  isEngulfing?: boolean;
}

// ============================================================================
// DPL DEBUG
// ============================================================================

/**
 * DPLDebug — Debug information for DPL evaluation
 */
export interface DPLDebug {
  validatorScores: Record<string, number>;
  failedValidators: string[];
  passedValidators: string[];
  evaluationTime: number; // milliseconds
  microTrendInfo: {
    direction: string;
    strength: number;
    momentum: number;
  };
  orderbookInfo?: {
    imbalance: number;
    spread: number;
    liquidityScore: number;
  };
  candleInfo?: {
    direction: string;
    bodyPercent: number;
    pattern: string;
  };
}

// ============================================================================
// DPL CONFIGURATION
// ============================================================================

/**
 * DPLConfig — Configuration for Decision Precision Layer
 */
export interface DPLConfig {
  enableMicroTrends: boolean; // Default: true
  enableVolatilityBands: boolean; // Default: true
  enableOpposingPressure: boolean; // Default: true
  enableLiquiditySlip: boolean; // Default: true
  enableCandlePrecision: boolean; // Default: true
  minValidatorsToPass: number; // Default: 3 (out of 5)
  minOverallScore: number; // Default: 60 (out of 100)
  microTrendThreshold: number; // Default: 40 (min strength to consider)
  volatilityBandThreshold: number; // Default: 70 (max volatility to allow)
  liquidityMinThreshold: number; // Default: 50 (min liquidity score)
  spreadMaxThreshold: number; // Default: 0.5 (max spread %)
  opposingPressureMaxThreshold: number; // Default: 0.6 (max imbalance against signal)
  candleAlignmentRequired: boolean; // Default: true
}

// ============================================================================
// DPL STATISTICS
// ============================================================================

/**
 * DPLStatistics — Statistics tracked by DPL
 */
export interface DPLStatistics {
  totalEvaluations: number;
  tradesAllowed: number;
  tradesBlocked: number;
  blockReasons: Record<string, number>;
  averageConfidence: number;
  averageOverallScore: number;
  validatorPassRates: Record<string, number>;
  lastEvaluationTime: number; // milliseconds
}

// ============================================================================
// VALIDATOR METADATA
// ============================================================================

/**
 * ValidatorMetadata — Additional metadata from validators
 */
export interface ValidatorMetadata {
  microTrend?: {
    direction: string;
    strength: number;
    alignment: boolean;
  };
  volatility?: {
    currentLevel: string;
    withinBands: boolean;
    spikeDetected: boolean;
  };
  pressure?: {
    imbalance: number;
    direction: string;
    aligned: boolean;
  };
  liquidity?: {
    score: number;
    adequate: boolean;
    slippageRisk: string;
  };
  candle?: {
    pattern: string;
    direction: string;
    aligned: boolean;
  };
}

// ============================================================================
// DPL SNAPSHOT
// ============================================================================

/**
 * DPLSnapshot — High-level snapshot of DPL state
 */
export interface DPLSnapshot {
  lastDecision: DPLDecision | null;
  activeValidators: string[];
  blockRate: number; // 0-1
  averageConfidence: number;
  topBlockReason: string;
  statistics: DPLStatistics;
  lastEvaluation: number; // timestamp
}

// ============================================================================
// PRECISION CHECK RESULT
// ============================================================================

/**
 * PrecisionCheckResult — Result from a single precision check
 */
export interface PrecisionCheckResult {
  checkName: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  recommendation?: string;
}

// ============================================================================
// VALIDATOR WEIGHTS
// ============================================================================

/**
 * ValidatorWeights — Weights for each validator (sum to 1.0)
 */
export interface ValidatorWeights {
  microTrend: number; // Default: 0.25
  volatilityBand: number; // Default: 0.20
  opposingPressure: number; // Default: 0.20
  liquiditySlip: number; // Default: 0.20
  candlePrecision: number; // Default: 0.15
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  DPLDecision as default,
  DPLValidatorResult,
  DPLContext,
  MicroTrendData,
  OrderbookData,
  OrderbookLevel,
  CandleData,
  DPLDebug,
  DPLConfig,
  DPLStatistics,
  ValidatorMetadata,
  DPLSnapshot,
  PrecisionCheckResult,
  ValidatorWeights,
};
