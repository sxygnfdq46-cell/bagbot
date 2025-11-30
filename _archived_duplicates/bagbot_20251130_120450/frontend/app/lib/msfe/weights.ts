/**
 * 🔮 MSFE WEIGHTS — Dynamic Weight Computation
 * 
 * STEP 24.36 — Weight Computation Functions
 * 
 * Purpose:
 * Compute dynamic weights for strategy fusion based on:
 * - Strategy scores and confidence
 * - Market context (shield, threats, volatility)
 * - Historical performance
 * 
 * Weight Adaptation Logic:
 * 1. Start with base weights
 * 2. Adjust based on strategy scores (better performing = higher weight)
 * 3. Adapt to threat level (defensive strategies get more weight in high threat)
 * 4. Adapt to volatility (volatility-aware strategies get more weight in high volatility)
 * 5. Normalize to sum to 1.0
 * 
 * Think of this as the "weight optimizer" that dynamically adjusts
 * how much each strategy contributes to the final signal.
 */

import type {
  WeightMap,
  StrategyScore,
  MarketContext,
} from './types';

// ============================================================================
// COMPUTE DYNAMIC WEIGHTS — Main weight computation
// ============================================================================

/**
 * computeDynamicWeights — Calculate weights based on scores and context
 * 
 * Algorithm:
 * 1. Start with base weights
 * 2. Adjust by strategy confidence (higher confidence = higher weight)
 * 3. Boost weights for strategies aligned with market context
 * 4. Apply performance-based adjustments
 * 5. Normalize to sum to 1.0
 */
export function computeDynamicWeights(
  scores: StrategyScore[],
  context: MarketContext,
  baseWeights: WeightMap
): WeightMap {
  const weights: WeightMap = {};

  // Step 1: Initialize with base weights
  for (const score of scores) {
    weights[score.strategyName] = baseWeights[score.strategyName] || 0.1;
  }

  // Step 2: Adjust by confidence
  // Higher confidence strategies get a boost
  for (const score of scores) {
    const confidenceBoost = (score.confidence / 100) * 0.3; // Up to +30% weight
    weights[score.strategyName] *= (1 + confidenceBoost);
  }

  // Step 3: Context-based adjustments
  weights['volatilityStrategy'] = adjustVolatilityStrategyWeight(
    weights['volatilityStrategy'] || 0.1,
    context.volatility
  );

  weights['trendFollowingStrategy'] = adjustTrendFollowingWeight(
    weights['trendFollowingStrategy'] || 0.1,
    context.shield
  );

  weights['meanReversionStrategy'] = adjustMeanReversionWeight(
    weights['meanReversionStrategy'] || 0.1,
    context.shield,
    context.volatility
  );

  // Step 4: Normalize weights to sum to 1.0
  return normalizeWeights(weights);
}

// ============================================================================
// NORMALIZE WEIGHTS — Ensure weights sum to 1.0
// ============================================================================

/**
 * normalizeWeights — Normalize weights to sum to 1.0
 */
export function normalizeWeights(weights: WeightMap): WeightMap {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

  if (total === 0) {
    // Fallback: Equal weights
    const equalWeight = 1 / Object.keys(weights).length;
    const normalized: WeightMap = {};
    for (const key in weights) {
      normalized[key] = equalWeight;
    }
    return normalized;
  }

  const normalized: WeightMap = {};
  for (const key in weights) {
    normalized[key] = weights[key] / total;
  }

  return normalized;
}

// ============================================================================
// ADAPT WEIGHTS BY THREAT — Threat-based weight adaptation
// ============================================================================

/**
 * adaptWeightsByThreat — Adjust weights based on threat level
 * 
 * High threat → Favor defensive strategies (mean reversion, sentiment)
 * Low threat → Favor aggressive strategies (momentum, trend following)
 */
export function adaptWeightsByThreat(
  weights: WeightMap,
  shield: string,
  threats: number
): WeightMap {
  const adapted = { ...weights };

  if (threats > 70) {
    // HIGH THREAT — Favor defensive strategies
    adapted['meanReversionStrategy'] = (adapted['meanReversionStrategy'] || 0.1) * 1.3;
    adapted['sentimentStrategy'] = (adapted['sentimentStrategy'] || 0.1) * 1.2;
    adapted['momentumStrategy'] = (adapted['momentumStrategy'] || 0.1) * 0.7;
    adapted['trendFollowingStrategy'] = (adapted['trendFollowingStrategy'] || 0.1) * 0.7;
  } else if (threats < 30) {
    // LOW THREAT — Favor aggressive strategies
    adapted['momentumStrategy'] = (adapted['momentumStrategy'] || 0.1) * 1.3;
    adapted['trendFollowingStrategy'] = (adapted['trendFollowingStrategy'] || 0.1) * 1.2;
    adapted['meanReversionStrategy'] = (adapted['meanReversionStrategy'] || 0.1) * 0.8;
  } else {
    // MEDIUM THREAT — Balanced weights
    // No adjustments needed
  }

  // Shield-specific adjustments
  if (shield === 'DEFENSIVE') {
    adapted['volatilityStrategy'] = (adapted['volatilityStrategy'] || 0.1) * 0.7;
    adapted['momentumStrategy'] = (adapted['momentumStrategy'] || 0.1) * 0.7;
  } else if (shield === 'AGGRO_OBS') {
    adapted['momentumStrategy'] = (adapted['momentumStrategy'] || 0.1) * 1.2;
    adapted['trendFollowingStrategy'] = (adapted['trendFollowingStrategy'] || 0.1) * 1.2;
  }

  return adapted;
}

// ============================================================================
// ADAPT WEIGHTS BY VOLATILITY — Volatility-based weight adaptation
// ============================================================================

/**
 * adaptWeightsByVolatility — Adjust weights based on volatility
 * 
 * High volatility → Favor volatility strategy, reduce momentum
 * Low volatility → Favor mean reversion, reduce volatility strategy
 */
export function adaptWeightsByVolatility(
  weights: WeightMap,
  volatility: string
): WeightMap {
  const adapted = { ...weights };

  if (volatility === 'high') {
    // HIGH VOLATILITY — Favor volatility-aware strategies
    adapted['volatilityStrategy'] = (adapted['volatilityStrategy'] || 0.1) * 1.5;
    adapted['meanReversionStrategy'] = (adapted['meanReversionStrategy'] || 0.1) * 1.2;
    adapted['momentumStrategy'] = (adapted['momentumStrategy'] || 0.1) * 0.7;
    adapted['trendFollowingStrategy'] = (adapted['trendFollowingStrategy'] || 0.1) * 0.8;
  } else if (volatility === 'low') {
    // LOW VOLATILITY — Favor mean reversion and trend following
    adapted['meanReversionStrategy'] = (adapted['meanReversionStrategy'] || 0.1) * 1.3;
    adapted['trendFollowingStrategy'] = (adapted['trendFollowingStrategy'] || 0.1) * 1.2;
    adapted['volatilityStrategy'] = (adapted['volatilityStrategy'] || 0.1) * 0.7;
  } else {
    // MEDIUM VOLATILITY — Balanced weights
    // No adjustments needed
  }

  return adapted;
}

// ============================================================================
// CONTEXT-SPECIFIC WEIGHT ADJUSTMENTS
// ============================================================================

/**
 * adjustVolatilityStrategyWeight — Adjust volatility strategy weight
 */
function adjustVolatilityStrategyWeight(weight: number, volatility: string): number {
  if (volatility === 'high') {
    return weight * 1.5; // Boost in high volatility
  } else if (volatility === 'low') {
    return weight * 0.7; // Reduce in low volatility
  }
  return weight;
}

/**
 * adjustTrendFollowingWeight — Adjust trend following strategy weight
 */
function adjustTrendFollowingWeight(weight: number, shield: string): number {
  if (shield === 'AGGRO_OBS' || shield === 'CALM') {
    return weight * 1.2; // Boost in trending markets
  } else if (shield === 'DEFENSIVE') {
    return weight * 0.7; // Reduce in defensive mode
  }
  return weight;
}

/**
 * adjustMeanReversionWeight — Adjust mean reversion strategy weight
 */
function adjustMeanReversionWeight(
  weight: number,
  shield: string,
  volatility: string
): number {
  let adjusted = weight;

  // Favor mean reversion in calm, ranging markets
  if (shield === 'CALM' && volatility === 'low') {
    adjusted *= 1.3;
  }

  // Reduce mean reversion in aggressive trending markets
  if (shield === 'AGGRO_OBS' && volatility === 'high') {
    adjusted *= 0.7;
  }

  return adjusted;
}

// ============================================================================
// WEIGHT UTILITIES
// ============================================================================

/**
 * getTopStrategyByWeight — Get strategy with highest weight
 */
export function getTopStrategyByWeight(weights: WeightMap): string | null {
  if (Object.keys(weights).length === 0) {
    return null;
  }

  let topStrategy = '';
  let maxWeight = 0;

  for (const [strategy, weight] of Object.entries(weights)) {
    if (weight > maxWeight) {
      maxWeight = weight;
      topStrategy = strategy;
    }
  }

  return topStrategy || null;
}

/**
 * formatWeights — Format weights for display
 */
export function formatWeights(weights: WeightMap): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const [key, value] of Object.entries(weights)) {
    formatted[key] = (value * 100).toFixed(1) + '%';
  }
  return formatted;
}

/**
 * validateWeights — Ensure weights are valid
 */
export function validateWeights(weights: WeightMap): boolean {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return Math.abs(total - 1.0) < 0.01; // Allow 1% tolerance
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  computeDynamicWeights,
  normalizeWeights,
  adaptWeightsByThreat,
  adaptWeightsByVolatility,
  getTopStrategyByWeight,
  formatWeights,
  validateWeights,
};
