/**
 * Fusion Weights - Dynamic Weight Management
 * 
 * Auto-adjusting weight system for cross-engine fusion.
 * Adapts based on market conditions, engine performance, and risk levels.
 */

/**
 * Engine weight configuration
 */
export interface FusionWeights {
  // Core intelligence engines
  volatility: number;          // Volatility Behavior Engine weight
  prediction: number;          // Prediction Horizon weight
  threat: number;              // Threat Detection Engine weight
  shield: number;              // Shield Engine weight
  execution: number;           // Execution Engine weight
  pattern: number;             // Pattern Recognition weight
  rootCause: number;           // Root Cause Analysis weight
  
  // Additional dimensions
  flow: number;                // Market Flow Anticipation weight
  sentiment: number;           // Sentiment Analysis weight
  risk: number;                // Risk Management weight
}

/**
 * Market condition classification
 */
export type MarketCondition = 
  | "STABLE"              // Normal conditions
  | "VOLATILE"            // High volatility
  | "TRENDING"            // Strong trend
  | "RANGING"             // Range-bound
  | "BREAKOUT"            // Breakout scenario
  | "CRISIS"              // Crisis mode
  | "ILLIQUID"            // Low liquidity
  | "WHIPSAW";            // Choppy/unpredictable

/**
 * Weight adjustment context
 */
export interface WeightContext {
  marketCondition: MarketCondition;
  volatilityLevel: number;     // 0-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidenceLevels: Record<string, number>;  // Per-engine confidence
  recentAccuracy: Record<string, number>;    // Per-engine accuracy
  timeOfDay: "ASIAN" | "EUROPEAN" | "US" | "OVERNIGHT";
}

/**
 * Default base weights (sum to 1.0)
 */
const BASE_WEIGHTS: FusionWeights = {
  volatility: 0.15,        // 15% - volatility behavior
  prediction: 0.15,        // 15% - future prediction
  threat: 0.12,            // 12% - threat detection
  shield: 0.10,            // 10% - protective shield
  execution: 0.18,         // 18% - execution analysis (highest)
  pattern: 0.12,           // 12% - pattern recognition
  rootCause: 0.08,         // 8%  - root cause analysis
  flow: 0.05,              // 5%  - market flow
  sentiment: 0.03,         // 3%  - sentiment
  risk: 0.02,              // 2%  - risk management
};

/**
 * Condition-specific weight adjustments
 */
const CONDITION_ADJUSTMENTS: Record<MarketCondition, Partial<FusionWeights>> = {
  STABLE: {
    // Normal conditions - use base weights with slight emphasis on execution
    execution: 0.20,
    prediction: 0.16,
    volatility: 0.12,
  },
  
  VOLATILE: {
    // High volatility - prioritize volatility engine and shield
    volatility: 0.25,
    shield: 0.18,
    threat: 0.15,
    execution: 0.15,
    risk: 0.05,
  },
  
  TRENDING: {
    // Strong trend - emphasize prediction and pattern
    prediction: 0.22,
    pattern: 0.18,
    execution: 0.20,
    flow: 0.10,
  },
  
  RANGING: {
    // Range-bound - focus on pattern and execution
    pattern: 0.20,
    execution: 0.22,
    prediction: 0.12,
    volatility: 0.12,
  },
  
  BREAKOUT: {
    // Breakout scenario - prediction and flow critical
    prediction: 0.25,
    flow: 0.15,
    volatility: 0.18,
    execution: 0.20,
  },
  
  CRISIS: {
    // Crisis mode - shield and threat maximum priority
    shield: 0.30,
    threat: 0.25,
    risk: 0.15,
    volatility: 0.15,
    rootCause: 0.10,
    execution: 0.05,
  },
  
  ILLIQUID: {
    // Low liquidity - caution, emphasize shield and flow
    shield: 0.22,
    flow: 0.18,
    execution: 0.20,
    volatility: 0.15,
    threat: 0.12,
  },
  
  WHIPSAW: {
    // Choppy market - minimize prediction, maximize shield
    shield: 0.25,
    volatility: 0.20,
    threat: 0.15,
    pattern: 0.15,
    prediction: 0.08,
    execution: 0.12,
  },
};

/**
 * Time-of-day adjustments
 */
const TIME_ADJUSTMENTS: Record<string, Partial<FusionWeights>> = {
  ASIAN: {
    // Asian session - lower liquidity, cautious
    shield: 0.14,
    execution: 0.16,
    volatility: 0.14,
  },
  
  EUROPEAN: {
    // European session - moderate activity
    execution: 0.18,
    prediction: 0.15,
    flow: 0.06,
  },
  
  US: {
    // US session - highest activity
    execution: 0.20,
    prediction: 0.16,
    flow: 0.08,
    pattern: 0.14,
  },
  
  OVERNIGHT: {
    // Overnight - minimal activity, maximum caution
    shield: 0.20,
    threat: 0.15,
    volatility: 0.15,
    execution: 0.12,
  },
};

/**
 * Calculate market condition from context
 */
export function determineMarketCondition(context: Partial<WeightContext>): MarketCondition {
  const vol = context.volatilityLevel || 50;
  const risk = context.riskLevel || "MEDIUM";
  
  // Crisis conditions
  if (risk === "CRITICAL" || vol > 85) {
    return "CRISIS";
  }
  
  // High volatility
  if (vol > 70) {
    return "VOLATILE";
  }
  
  // Check for specific patterns (would need more data)
  // For now, use volatility-based heuristics
  if (vol < 20) {
    return "RANGING";
  }
  
  if (vol > 50 && vol < 70) {
    return "TRENDING";
  }
  
  return "STABLE";
}

/**
 * Apply confidence-based adjustments
 */
function applyConfidenceAdjustments(
  weights: FusionWeights,
  confidenceLevels: Record<string, number>
): FusionWeights {
  const adjusted = { ...weights };
  
  // Boost weight for high-confidence engines
  Object.entries(confidenceLevels).forEach(([engine, confidence]) => {
    const key = engine as keyof FusionWeights;
    if (adjusted[key] !== undefined) {
      // Increase weight by up to 20% for high confidence
      const boost = ((confidence - 50) / 100) * 0.2;
      adjusted[key] = Math.max(0, adjusted[key] + boost);
    }
  });
  
  return adjusted;
}

/**
 * Apply accuracy-based adjustments
 */
function applyAccuracyAdjustments(
  weights: FusionWeights,
  recentAccuracy: Record<string, number>
): FusionWeights {
  const adjusted = { ...weights };
  
  // Adjust weight based on recent accuracy
  Object.entries(recentAccuracy).forEach(([engine, accuracy]) => {
    const key = engine as keyof FusionWeights;
    if (adjusted[key] !== undefined) {
      // Penalize low accuracy, reward high accuracy
      const adjustment = ((accuracy - 50) / 100) * 0.15;
      adjusted[key] = Math.max(0.01, adjusted[key] + adjustment);
    }
  });
  
  return adjusted;
}

/**
 * Apply risk-based adjustments
 */
function applyRiskAdjustments(
  weights: FusionWeights,
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
): FusionWeights {
  const adjusted = { ...weights };
  
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    // Increase defensive engines
    adjusted.shield *= 1.5;
    adjusted.threat *= 1.4;
    adjusted.risk *= 2.0;
    adjusted.volatility *= 1.3;
    
    // Decrease aggressive engines
    adjusted.execution *= 0.7;
    adjusted.prediction *= 0.8;
  } else if (riskLevel === "LOW") {
    // Can be more aggressive
    adjusted.execution *= 1.2;
    adjusted.prediction *= 1.15;
    adjusted.shield *= 0.8;
  }
  
  return adjusted;
}

/**
 * Normalize weights to sum to 1.0
 */
function normalizeWeights(weights: FusionWeights): FusionWeights {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  
  if (sum === 0) {
    return { ...BASE_WEIGHTS };
  }
  
  const normalized: any = {};
  Object.entries(weights).forEach(([key, value]) => {
    normalized[key] = value / sum;
  });
  
  return normalized as FusionWeights;
}

/**
 * Calculate dynamic fusion weights
 */
export function calculateFusionWeights(context: WeightContext): FusionWeights {
  // Start with base weights
  let weights = { ...BASE_WEIGHTS };
  
  // Apply condition-specific adjustments
  const conditionAdj = CONDITION_ADJUSTMENTS[context.marketCondition];
  if (conditionAdj) {
    weights = { ...weights, ...conditionAdj };
  }
  
  // Apply time-of-day adjustments
  const timeAdj = TIME_ADJUSTMENTS[context.timeOfDay];
  if (timeAdj) {
    Object.entries(timeAdj).forEach(([key, value]) => {
      (weights as any)[key] = ((weights as any)[key] + value) / 2; // Blend
    });
  }
  
  // Apply confidence adjustments
  if (context.confidenceLevels && Object.keys(context.confidenceLevels).length > 0) {
    weights = applyConfidenceAdjustments(weights, context.confidenceLevels);
  }
  
  // Apply accuracy adjustments
  if (context.recentAccuracy && Object.keys(context.recentAccuracy).length > 0) {
    weights = applyAccuracyAdjustments(weights, context.recentAccuracy);
  }
  
  // Apply risk adjustments
  weights = applyRiskAdjustments(weights, context.riskLevel);
  
  // Normalize to sum to 1.0
  weights = normalizeWeights(weights);
  
  return weights;
}

/**
 * Get weight explanation
 */
export function explainWeights(weights: FusionWeights, context: WeightContext): string[] {
  const explanations: string[] = [];
  
  // Market condition
  explanations.push(`Market Condition: ${context.marketCondition}`);
  
  // Top 3 weighted engines
  const sorted = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  
  explanations.push('Top Engines:');
  sorted.forEach(([engine, weight]) => {
    explanations.push(`  - ${engine}: ${(weight * 100).toFixed(1)}%`);
  });
  
  // Risk adjustment
  if (context.riskLevel === "CRITICAL" || context.riskLevel === "HIGH") {
    explanations.push('⚠️ Defensive posture due to high risk');
  }
  
  // Volatility adjustment
  if (context.volatilityLevel > 70) {
    explanations.push('⚠️ High volatility - shield and threat prioritized');
  }
  
  // Time of day
  explanations.push(`Session: ${context.timeOfDay}`);
  
  return explanations;
}

/**
 * Validate weights
 */
export function validateWeights(weights: FusionWeights): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check sum
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 0.01) {
    errors.push(`Weights sum to ${sum.toFixed(3)}, expected 1.0`);
  }
  
  // Check individual weights
  Object.entries(weights).forEach(([key, value]) => {
    if (value < 0) {
      errors.push(`${key} has negative weight: ${value}`);
    }
    if (value > 0.5) {
      errors.push(`${key} has excessive weight: ${value} (>50%)`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default weights for condition
 */
export function getDefaultWeightsForCondition(condition: MarketCondition): FusionWeights {
  const base = { ...BASE_WEIGHTS };
  const adjustments = CONDITION_ADJUSTMENTS[condition];
  
  if (adjustments) {
    return normalizeWeights({ ...base, ...adjustments });
  }
  
  return base;
}

/**
 * Calculate weight diversity score (0-100)
 * Higher score = more balanced weights
 */
export function calculateWeightDiversity(weights: FusionWeights): number {
  const values = Object.values(weights);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Normalize to 0-100 (lower stdDev = higher diversity)
  const diversity = Math.max(0, 100 - (stdDev * 500));
  
  return Math.round(diversity);
}

/**
 * Compare two weight configurations
 */
export function compareWeights(weights1: FusionWeights, weights2: FusionWeights): {
  similarity: number;  // 0-100
  differences: Array<{ engine: string; diff: number }>;
} {
  const differences: Array<{ engine: string; diff: number }> = [];
  let totalDiff = 0;
  
  Object.keys(weights1).forEach(key => {
    const k = key as keyof FusionWeights;
    const diff = Math.abs(weights1[k] - weights2[k]);
    totalDiff += diff;
    
    if (diff > 0.01) {  // Only report significant differences
      differences.push({
        engine: key,
        diff: Math.round(diff * 100),
      });
    }
  });
  
  const similarity = Math.max(0, 100 - (totalDiff * 100));
  
  return {
    similarity: Math.round(similarity),
    differences: differences.sort((a, b) => b.diff - a.diff),
  };
}

/**
 * Create weight snapshot for logging
 */
export interface WeightSnapshot {
  weights: FusionWeights;
  context: WeightContext;
  diversity: number;
  timestamp: number;
}

export function createWeightSnapshot(
  weights: FusionWeights,
  context: WeightContext
): WeightSnapshot {
  return {
    weights: { ...weights },
    context: { ...context },
    diversity: calculateWeightDiversity(weights),
    timestamp: Date.now(),
  };
}

/**
 * Export utilities
 */
export const FusionWeightsUtil = {
  calculate: calculateFusionWeights,
  explain: explainWeights,
  validate: validateWeights,
  getDefaults: getDefaultWeightsForCondition,
  calculateDiversity: calculateWeightDiversity,
  compare: compareWeights,
  createSnapshot: createWeightSnapshot,
  determineCondition: determineMarketCondition,
  normalize: normalizeWeights,
  BASE_WEIGHTS,
  CONDITION_ADJUSTMENTS,
  TIME_ADJUSTMENTS,
};

export default FusionWeightsUtil;
