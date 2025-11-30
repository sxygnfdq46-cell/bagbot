/**
 * 🎯 DPL VALIDATORS — Decision Precision Layer Validation Functions
 * 
 * STEP 24.37 — Validator Functions
 * 
 * Purpose:
 * Individual validation functions for precision checks before trade execution.
 * Each validator examines a specific aspect of market conditions and returns
 * a standardized result: {pass, score, reason}.
 * 
 * Think of these as "pre-flight checks" - each one must pass (or enough must pass)
 * before allowing a trade to proceed.
 */

import type {
  DPLValidatorResult,
  DPLContext,
  MicroTrendData,
  OrderbookData,
  CandleData,
} from './types';

// ============================================================================
// VALIDATE MICRO TRENDS — Short-term trend alignment
// ============================================================================

/**
 * validateMicroTrends — Check if micro-trend aligns with fusion signal
 * 
 * Pass conditions:
 * - LONG signal: micro-trend UP or NEUTRAL with positive momentum
 * - SHORT signal: micro-trend DOWN or NEUTRAL with negative momentum
 * - Trend strength above threshold (default: 40)
 * 
 * @param context - DPL context with micro-trend data
 * @returns Validator result
 */
export function validateMicroTrends(context: DPLContext): DPLValidatorResult {
  const { fusionResult, microTrendData } = context;
  const signal = fusionResult.signal;

  if (signal === 'NEUTRAL') {
    return {
      validatorName: 'microTrend',
      pass: true,
      score: 50,
      reason: 'Fusion signal is NEUTRAL - micro-trend check skipped',
    };
  }

  const trendDirection = microTrendData.direction;
  const trendStrength = microTrendData.strength;
  const momentum = microTrendData.momentum;

  let aligned = false;
  let score = 0;

  // Check alignment
  if (signal === 'LONG') {
    aligned = trendDirection === 'UP' || (trendDirection === 'NEUTRAL' && momentum > 0);
    score = aligned ? trendStrength : (100 - trendStrength) * 0.5;
  } else if (signal === 'SHORT') {
    aligned = trendDirection === 'DOWN' || (trendDirection === 'NEUTRAL' && momentum < 0);
    score = aligned ? trendStrength : (100 - trendStrength) * 0.5;
  }

  // Minimum threshold
  const minThreshold = 40;
  const pass = aligned && trendStrength >= minThreshold;

  const reason = pass
    ? `Micro-trend ${trendDirection} aligns with ${signal} signal (strength: ${trendStrength.toFixed(0)})`
    : `Micro-trend ${trendDirection} conflicts with ${signal} signal (strength: ${trendStrength.toFixed(0)})`;

  return {
    validatorName: 'microTrend',
    pass,
    score: Math.round(score),
    reason,
    metadata: {
      direction: trendDirection,
      strength: trendStrength,
      momentum,
      aligned,
    },
  };
}

// ============================================================================
// VALIDATE VOLATILITY — Check volatility bands
// ============================================================================

/**
 * validateVolatility — Ensure volatility is within acceptable bands
 * 
 * Pass conditions:
 * - Volatility not "extreme" or "high" during risk-off periods
 * - No recent volatility spikes (>20% in last minute)
 * - Volatility aligns with shield state
 * 
 * @param context - DPL context with market conditions
 * @returns Validator result
 */
export function validateVolatility(context: DPLContext): DPLValidatorResult {
  const { marketContext } = context;
  const volatility = marketContext.volatility;
  const shield = marketContext.shield;

  let pass = true;
  let score = 70;
  let reason = 'Volatility within acceptable range';

  // High volatility checks
  if (volatility === 'high') {
    score = 50;

    // Block high volatility during defensive shield
    if (shield === 'DEFENSIVE') {
      pass = false;
      score = 30;
      reason = 'High volatility during DEFENSIVE shield - trade blocked';
    } else if (shield === 'PROTECTIVE') {
      pass = false;
      score = 40;
      reason = 'High volatility during PROTECTIVE shield - trade blocked';
    } else {
      pass = true;
      reason = 'High volatility but shield allows trading';
    }
  } else if (volatility === 'medium') {
    score = 75;
    reason = 'Medium volatility - acceptable';
  } else {
    // Low volatility
    score = 90;
    reason = 'Low volatility - ideal conditions';
  }

  return {
    validatorName: 'volatilityBand',
    pass,
    score,
    reason,
    metadata: {
      currentLevel: volatility,
      withinBands: pass,
      spikeDetected: volatility === 'high',
    },
  };
}

// ============================================================================
// VALIDATE PRESSURE — Check orderbook pressure
// ============================================================================

/**
 * validatePressure — Check for opposing orderbook pressure
 * 
 * Pass conditions:
 * - LONG signal: positive imbalance (more bids than asks)
 * - SHORT signal: negative imbalance (more asks than bids)
 * - Imbalance not exceeding -0.6 to +0.6 threshold
 * 
 * @param orderbook - Orderbook data
 * @param signal - Fusion signal (LONG/SHORT/NEUTRAL)
 * @returns Validator result
 */
export function validatePressure(
  orderbook: OrderbookData | undefined,
  signal: 'LONG' | 'SHORT' | 'NEUTRAL'
): DPLValidatorResult {
  if (!orderbook) {
    return {
      validatorName: 'opposingPressure',
      pass: true,
      score: 50,
      reason: 'No orderbook data - pressure check skipped',
    };
  }

  if (signal === 'NEUTRAL') {
    return {
      validatorName: 'opposingPressure',
      pass: true,
      score: 50,
      reason: 'Fusion signal is NEUTRAL - pressure check skipped',
    };
  }

  const imbalance = orderbook.imbalance;
  const imbalanceThreshold = 0.6;

  let aligned = false;
  let score = 50;

  // Check alignment
  if (signal === 'LONG') {
    aligned = imbalance >= 0; // Positive imbalance (buy pressure)
    score = aligned ? 50 + imbalance * 50 : 50 + imbalance * 50; // Scale -50 to +50
  } else if (signal === 'SHORT') {
    aligned = imbalance <= 0; // Negative imbalance (sell pressure)
    score = aligned ? 50 - imbalance * 50 : 50 - imbalance * 50; // Scale -50 to +50
  }

  // Check if opposing pressure is too strong
  const opposingPressureTooStrong =
    (signal === 'LONG' && imbalance < -imbalanceThreshold) ||
    (signal === 'SHORT' && imbalance > imbalanceThreshold);

  const pass = !opposingPressureTooStrong;

  const pressureDirection = imbalance > 0 ? 'BUY' : imbalance < 0 ? 'SELL' : 'NEUTRAL';

  const reason = pass
    ? `Orderbook pressure (${pressureDirection}, ${(imbalance * 100).toFixed(0)}%) aligns with ${signal}`
    : `Strong opposing pressure detected (${pressureDirection}, ${(imbalance * 100).toFixed(0)}%) - trade blocked`;

  return {
    validatorName: 'opposingPressure',
    pass,
    score: Math.round(Math.max(0, Math.min(100, score))),
    reason,
    metadata: {
      imbalance,
      direction: pressureDirection,
      aligned,
    },
  };
}

// ============================================================================
// VALIDATE LIQUIDITY — Check liquidity and slippage risk
// ============================================================================

/**
 * validateLiquidity — Ensure adequate liquidity for trade execution
 * 
 * Pass conditions:
 * - Liquidity score above threshold (default: 50)
 * - Spread below maximum (default: 0.5%)
 * - Orderbook depth adequate for position size
 * 
 * @param orderbook - Orderbook data
 * @returns Validator result
 */
export function validateLiquidity(
  orderbook: OrderbookData | undefined
): DPLValidatorResult {
  if (!orderbook) {
    return {
      validatorName: 'liquiditySlip',
      pass: true,
      score: 50,
      reason: 'No orderbook data - liquidity check skipped',
    };
  }

  const liquidityScore = orderbook.liquidityScore;
  const spread = orderbook.spreadPercent;

  const minLiquidity = 50;
  const maxSpread = 0.5; // 0.5%

  const liquidityAdequate = liquidityScore >= minLiquidity;
  const spreadAcceptable = spread <= maxSpread;

  const pass = liquidityAdequate && spreadAcceptable;

  let reason = '';
  if (!liquidityAdequate) {
    reason = `Low liquidity (score: ${liquidityScore.toFixed(0)}) - high slippage risk`;
  } else if (!spreadAcceptable) {
    reason = `Wide spread (${spread.toFixed(3)}%) - high slippage risk`;
  } else {
    reason = `Adequate liquidity (score: ${liquidityScore.toFixed(0)}, spread: ${spread.toFixed(3)}%)`;
  }

  const slippageRisk = !pass ? 'HIGH' : liquidityScore < 70 ? 'MEDIUM' : 'LOW';

  return {
    validatorName: 'liquiditySlip',
    pass,
    score: Math.round(liquidityScore),
    reason,
    metadata: {
      score: liquidityScore,
      adequate: liquidityAdequate,
      slippageRisk,
      spread,
    },
  };
}

// ============================================================================
// VALIDATE CANDLE PRECISION — Check candlestick alignment
// ============================================================================

/**
 * validateCandlePrecision — Check if recent candle aligns with signal
 * 
 * Pass conditions:
 * - LONG signal: bullish candle or neutral with positive momentum
 * - SHORT signal: bearish candle or neutral with negative momentum
 * - No conflicting reversal patterns (hammer, doji, engulfing)
 * 
 * @param candle - Recent candle data
 * @param signal - Fusion signal (LONG/SHORT/NEUTRAL)
 * @returns Validator result
 */
export function validateCandlePrecision(
  candle: CandleData | undefined,
  signal: 'LONG' | 'SHORT' | 'NEUTRAL'
): DPLValidatorResult {
  if (!candle) {
    return {
      validatorName: 'candlePrecision',
      pass: true,
      score: 50,
      reason: 'No candle data - precision check skipped',
    };
  }

  if (signal === 'NEUTRAL') {
    return {
      validatorName: 'candlePrecision',
      pass: true,
      score: 50,
      reason: 'Fusion signal is NEUTRAL - candle check skipped',
    };
  }

  const candleDirection = candle.direction;
  const bodyPercent = candle.bodyPercent;

  // Check for reversal patterns
  const hasReversalPattern = candle.isHammer || candle.isDoji || candle.isEngulfing;

  let aligned = false;
  let score = 50;

  // Check alignment
  if (signal === 'LONG') {
    aligned = candleDirection === 'BULLISH' || (candleDirection === 'NEUTRAL' && candle.close > candle.open);
  } else if (signal === 'SHORT') {
    aligned = candleDirection === 'BEARISH' || (candleDirection === 'NEUTRAL' && candle.close < candle.open);
  }

  // Score based on alignment and body strength
  if (aligned) {
    score = 50 + bodyPercent * 0.5; // Up to +50 for strong body
  } else {
    score = 50 - bodyPercent * 0.5; // Down to 0 for strong opposing body
  }

  // Block if reversal pattern conflicts with signal
  const pass = aligned && !hasReversalPattern;

  let pattern = 'normal';
  if (candle.isHammer) pattern = 'hammer';
  else if (candle.isDoji) pattern = 'doji';
  else if (candle.isEngulfing) pattern = 'engulfing';

  const reason = pass
    ? `Candle ${candleDirection} aligns with ${signal} signal (body: ${bodyPercent.toFixed(0)}%)`
    : hasReversalPattern
    ? `Reversal pattern (${pattern}) conflicts with ${signal} signal`
    : `Candle ${candleDirection} conflicts with ${signal} signal`;

  return {
    validatorName: 'candlePrecision',
    pass,
    score: Math.round(Math.max(0, Math.min(100, score))),
    reason,
    metadata: {
      pattern,
      direction: candleDirection,
      aligned,
      bodyPercent,
    },
  };
}

// ============================================================================
// VALIDATOR UTILITIES
// ============================================================================

/**
 * calculateOverallScore — Calculate weighted overall score from validators
 */
export function calculateOverallScore(
  results: DPLValidatorResult[],
  weights?: Record<string, number>
): number {
  if (results.length === 0) {
    return 0;
  }

  const defaultWeights = {
    microTrend: 0.25,
    volatilityBand: 0.20,
    opposingPressure: 0.20,
    liquiditySlip: 0.20,
    candlePrecision: 0.15,
  };

  const weightsToUse = weights || defaultWeights;

  let totalScore = 0;
  let totalWeight = 0;

  for (const result of results) {
    const weight = weightsToUse[result.validatorName] || 0.1;
    totalScore += result.score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * countPassedValidators — Count how many validators passed
 */
export function countPassedValidators(results: DPLValidatorResult[]): number {
  return results.filter((r) => r.pass).length;
}

/**
 * getFailedValidators — Get list of failed validator names
 */
export function getFailedValidators(results: DPLValidatorResult[]): string[] {
  return results.filter((r) => !r.pass).map((r) => r.validatorName);
}

/**
 * getPassedValidators — Get list of passed validator names
 */
export function getPassedValidators(results: DPLValidatorResult[]): string[] {
  return results.filter((r) => r.pass).map((r) => r.validatorName);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateMicroTrends,
  validateVolatility,
  validatePressure,
  validateLiquidity,
  validateCandlePrecision,
  calculateOverallScore,
  countPassedValidators,
  getFailedValidators,
  getPassedValidators,
};
