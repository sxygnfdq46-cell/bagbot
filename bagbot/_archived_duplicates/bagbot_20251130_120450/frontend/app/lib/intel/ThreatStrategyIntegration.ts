// app/lib/intel/ThreatStrategyIntegration.ts
// Integration example for ThreatWeightedStrategy with DecisionEngine

import { threatWeightedStrategy } from "./ThreatWeightedStrategy";

/**
 * Example integration with decision engine
 * 
 * Usage in DecisionEngine.ts or FusionDecisionBridge.ts:
 * 
 * ```typescript
 * import { threatWeightedStrategy } from "./ThreatWeightedStrategy";
 * 
 * // Initialize subscription
 * threatWeightedStrategy.subscribe();
 * 
 * // Get current weights
 * const weights = threatWeightedStrategy.getWeights();
 * 
 * // Calculate weighted final score
 * finalScore = 
 *   neuralScore * weights.neural +
 *   fusionScore * weights.fusion +
 *   trendScore * weights.trend +
 *   volatilityScore * weights.volatility +
 *   reversalScore * weights.reversal;
 * ```
 * 
 * This instantly merges threat-awareness into the decision engine.
 */

export interface StrategyScores {
  neural: number;
  fusion: number;
  trend: number;
  volatility: number;
  reversal: number;
}

/**
 * Calculate threat-weighted final score
 */
export function calculateThreatWeightedScore(scores: StrategyScores): number {
  const weights = threatWeightedStrategy.getWeights();
  
  const finalScore = 
    scores.neural * weights.neural +
    scores.fusion * weights.fusion +
    scores.trend * weights.trend +
    scores.volatility * weights.volatility +
    scores.reversal * weights.reversal;
    
  // Normalize based on total weight
  const totalWeight = 
    weights.neural + 
    weights.fusion + 
    weights.trend + 
    weights.volatility + 
    weights.reversal;
    
  return finalScore / totalWeight;
}

/**
 * Initialize threat-weighted strategy system
 */
export function initThreatWeightedStrategy() {
  threatWeightedStrategy.subscribe();
  return threatWeightedStrategy;
}

/**
 * Get current strategy behavior mode based on weights
 */
export function getStrategyMode(): "AGGRESSIVE" | "BALANCED" | "DEFENSIVE" {
  const weights = threatWeightedStrategy.getWeights();
  
  // Defensive mode: high volatility/reversal weights
  if (weights.volatility > 1.5 || weights.reversal > 1.5) {
    return "DEFENSIVE";
  }
  
  // Aggressive mode: all weights near 1.0
  if (weights.neural >= 0.9 && weights.fusion >= 0.9) {
    return "AGGRESSIVE";
  }
  
  return "BALANCED";
}
