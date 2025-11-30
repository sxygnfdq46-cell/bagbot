/**
 * Learning Rules - Reinforcement Learning Rule Definitions
 * 
 * Dynamic rules for reward/penalty calculation, mutation rates, and regime sensitivity.
 * Rules can be adjusted by Shield/Threat engines for adaptive learning.
 */

/**
 * Reward weights configuration
 */
export interface RewardWeights {
  profitMultiplier: number;        // Weight for profit-based rewards
  winRateBonus: number;             // Bonus for consistent wins
  riskAdjustedReturn: number;       // Weight for risk-adjusted performance
  timeEfficiency: number;           // Reward for quick wins
  adaptiveAccuracy: number;         // Reward for adapting to regime changes
  shieldCompliance: number;         // Reward for respecting shield signals
  fusionAlignment: number;          // Reward for aligning with fusion decisions
}

/**
 * Penalty weights configuration
 */
export interface PenaltyWeights {
  lossMultiplier: number;           // Weight for loss-based penalties
  drawdownPenalty: number;          // Penalty for large drawdowns
  overrideViolation: number;        // Penalty for ignoring overrides
  poorTiming: number;               // Penalty for bad entry/exit timing
  regimeMismatch: number;           // Penalty for regime misalignment
  excessiveRisk: number;            // Penalty for oversized positions
  conflictIgnored: number;          // Penalty for ignoring engine conflicts
}

/**
 * Learning configuration
 */
export interface LearningConfig {
  mutationRate: number;             // Rate of weight mutation (0-1)
  learningRate: number;             // Speed of learning (0-1)
  regimeSensitivity: number;        // Sensitivity to regime changes (0-1)
  explorationRate: number;          // Exploration vs exploitation (0-1)
  memoryDecay: number;              // How fast old memories fade (0-1)
  confidenceThreshold: number;      // Minimum confidence for learning (0-100)
  adaptiveScaling: boolean;         // Enable adaptive scaling
}

/**
 * Regime profile
 */
export interface RegimeProfile {
  name: string;
  volatilityRange: [number, number];
  trendStrength: [number, number];
  liquidityLevel: [number, number];
  optimalWeights: Partial<RewardWeights>;
}

/**
 * Default reward weights
 */
export const DEFAULT_REWARD_WEIGHTS: RewardWeights = {
  profitMultiplier: 1.0,
  winRateBonus: 0.5,
  riskAdjustedReturn: 1.2,
  timeEfficiency: 0.3,
  adaptiveAccuracy: 0.8,
  shieldCompliance: 1.5,
  fusionAlignment: 1.0,
};

/**
 * Default penalty weights
 */
export const DEFAULT_PENALTY_WEIGHTS: PenaltyWeights = {
  lossMultiplier: 1.5,
  drawdownPenalty: 2.0,
  overrideViolation: 3.0,
  poorTiming: 1.0,
  regimeMismatch: 1.2,
  excessiveRisk: 2.5,
  conflictIgnored: 2.0,
};

/**
 * Default learning configuration
 */
export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  mutationRate: 0.05,              // 5% mutation
  learningRate: 0.1,                // 10% learning rate
  regimeSensitivity: 0.7,           // 70% sensitivity
  explorationRate: 0.15,            // 15% exploration
  memoryDecay: 0.01,                // 1% decay
  confidenceThreshold: 60,          // 60% confidence
  adaptiveScaling: true,
};

/**
 * Regime profiles
 */
export const REGIME_PROFILES: Record<string, RegimeProfile> = {
  STABLE: {
    name: 'STABLE',
    volatilityRange: [0, 40],
    trendStrength: [0, 50],
    liquidityLevel: [70, 100],
    optimalWeights: {
      profitMultiplier: 0.8,
      timeEfficiency: 0.5,
      riskAdjustedReturn: 1.5,
    },
  },
  
  VOLATILE: {
    name: 'VOLATILE',
    volatilityRange: [60, 100],
    trendStrength: [0, 100],
    liquidityLevel: [0, 100],
    optimalWeights: {
      profitMultiplier: 1.2,
      shieldCompliance: 2.0,
      riskAdjustedReturn: 1.5,
    },
  },
  
  TRENDING: {
    name: 'TRENDING',
    volatilityRange: [0, 100],
    trendStrength: [70, 100],
    liquidityLevel: [50, 100],
    optimalWeights: {
      profitMultiplier: 1.3,
      timeEfficiency: 0.8,
      adaptiveAccuracy: 1.2,
    },
  },
  
  RANGING: {
    name: 'RANGING',
    volatilityRange: [0, 50],
    trendStrength: [0, 30],
    liquidityLevel: [60, 100],
    optimalWeights: {
      profitMultiplier: 0.9,
      winRateBonus: 0.8,
      timeEfficiency: 0.6,
    },
  },
  
  BREAKOUT: {
    name: 'BREAKOUT',
    volatilityRange: [50, 80],
    trendStrength: [60, 90],
    liquidityLevel: [40, 80],
    optimalWeights: {
      profitMultiplier: 1.5,
      adaptiveAccuracy: 1.3,
      timeEfficiency: 0.4,
    },
  },
  
  CRISIS: {
    name: 'CRISIS',
    volatilityRange: [80, 100],
    trendStrength: [0, 100],
    liquidityLevel: [0, 40],
    optimalWeights: {
      shieldCompliance: 3.0,
      overrideViolation: 4.0,
      excessiveRisk: 3.5,
    },
  },
};

// Current state
let currentRewardWeights: RewardWeights = { ...DEFAULT_REWARD_WEIGHTS };
let currentPenaltyWeights: PenaltyWeights = { ...DEFAULT_PENALTY_WEIGHTS };
let currentConfig: LearningConfig = { ...DEFAULT_LEARNING_CONFIG };
let currentRegime: string = 'STABLE';

// ============================================================================
// Reward Calculation
// ============================================================================

/**
 * Calculate reward for a successful trade
 */
export function calculateTradeReward(trade: {
  profit: number;
  profitPercent: number;
  duration: number;
  riskRewardRatio: number;
  followedShield: boolean;
  alignedWithFusion: boolean;
  regimeMatch: boolean;
}): number {
  let reward = 0;
  
  // Base profit reward
  reward += trade.profitPercent * currentRewardWeights.profitMultiplier;
  
  // Risk-adjusted return
  if (trade.riskRewardRatio > 0) {
    reward += trade.riskRewardRatio * currentRewardWeights.riskAdjustedReturn;
  }
  
  // Time efficiency (faster wins = higher reward)
  const hours = trade.duration / (1000 * 60 * 60);
  const timeScore = Math.max(0, 1 - hours / 24); // Decay over 24 hours
  reward += timeScore * currentRewardWeights.timeEfficiency;
  
  // Shield compliance
  if (trade.followedShield) {
    reward += currentRewardWeights.shieldCompliance;
  }
  
  // Fusion alignment
  if (trade.alignedWithFusion) {
    reward += currentRewardWeights.fusionAlignment;
  }
  
  // Regime match
  if (trade.regimeMatch) {
    reward += currentRewardWeights.adaptiveAccuracy;
  }
  
  return Math.max(0, reward);
}

/**
 * Calculate reward for win rate improvement
 */
export function calculateWinRateReward(currentWinRate: number, previousWinRate: number): number {
  const improvement = currentWinRate - previousWinRate;
  
  if (improvement > 0) {
    return improvement * 10 * currentRewardWeights.winRateBonus;
  }
  
  return 0;
}

/**
 * Calculate reward for adaptive accuracy
 */
export function calculateAdaptiveReward(
  regimeChanges: number,
  successfulAdaptations: number
): number {
  if (regimeChanges === 0) return 0;
  
  const adaptationRate = successfulAdaptations / regimeChanges;
  return adaptationRate * 5 * currentRewardWeights.adaptiveAccuracy;
}

// ============================================================================
// Penalty Calculation
// ============================================================================

/**
 * Calculate penalty for a losing trade
 */
export function calculateTradePenalty(trade: {
  loss: number;
  lossPercent: number;
  maxDrawdown: number;
  ignoredOverride: boolean;
  poorEntry: boolean;
  poorExit: boolean;
  regimeMismatch: boolean;
  oversized: boolean;
  ignoredConflict: boolean;
}): number {
  let penalty = 0;
  
  // Base loss penalty
  penalty += Math.abs(trade.lossPercent) * currentPenaltyWeights.lossMultiplier;
  
  // Drawdown penalty
  penalty += Math.abs(trade.maxDrawdown) * currentPenaltyWeights.drawdownPenalty;
  
  // Override violation
  if (trade.ignoredOverride) {
    penalty += currentPenaltyWeights.overrideViolation;
  }
  
  // Poor timing
  if (trade.poorEntry || trade.poorExit) {
    penalty += currentPenaltyWeights.poorTiming;
  }
  
  // Regime mismatch
  if (trade.regimeMismatch) {
    penalty += currentPenaltyWeights.regimeMismatch;
  }
  
  // Excessive risk
  if (trade.oversized) {
    penalty += currentPenaltyWeights.excessiveRisk;
  }
  
  // Conflict ignored
  if (trade.ignoredConflict) {
    penalty += currentPenaltyWeights.conflictIgnored;
  }
  
  return penalty;
}

/**
 * Calculate penalty for drawdown
 */
export function calculateDrawdownPenalty(currentDrawdown: number, maxDrawdown: number): number {
  const drawdownPercent = (currentDrawdown / maxDrawdown) * 100;
  return drawdownPercent * currentPenaltyWeights.drawdownPenalty;
}

// ============================================================================
// Weight Management
// ============================================================================

/**
 * Get current reward weights
 */
export function getRewardWeights(): RewardWeights {
  return { ...currentRewardWeights };
}

/**
 * Get current penalty weights
 */
export function getPenaltyWeights(): PenaltyWeights {
  return { ...currentPenaltyWeights };
}

/**
 * Get current learning config
 */
export function getLearningConfig(): LearningConfig {
  return { ...currentConfig };
}

/**
 * Update reward weights
 */
export function updateRewardWeights(weights: Partial<RewardWeights>): void {
  currentRewardWeights = { ...currentRewardWeights, ...weights };
  console.log('[Learning Rules] Updated reward weights:', weights);
}

/**
 * Update penalty weights
 */
export function updatePenaltyWeights(weights: Partial<PenaltyWeights>): void {
  currentPenaltyWeights = { ...currentPenaltyWeights, ...weights };
  console.log('[Learning Rules] Updated penalty weights:', weights);
}

/**
 * Update learning config
 */
export function updateLearningConfig(config: Partial<LearningConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log('[Learning Rules] Updated learning config:', config);
}

/**
 * Adjust weight by factor
 */
export function adjustRewardWeight(key: keyof RewardWeights, factor: number): void {
  currentRewardWeights[key] *= factor;
  console.log(`[Learning Rules] Adjusted reward weight '${key}' by ${factor} to ${currentRewardWeights[key]}`);
}

/**
 * Adjust penalty weight by factor
 */
export function adjustPenaltyWeight(key: keyof PenaltyWeights, factor: number): void {
  currentPenaltyWeights[key] *= factor;
  console.log(`[Learning Rules] Adjusted penalty weight '${key}' by ${factor} to ${currentPenaltyWeights[key]}`);
}

// ============================================================================
// Regime Management
// ============================================================================

/**
 * Set current regime
 */
export function setCurrentRegime(regime: string): void {
  currentRegime = regime;
  console.log(`[Learning Rules] Regime set to ${regime}`);
  
  // Apply regime-specific weights
  applyRegimeWeights(regime);
}

/**
 * Get current regime
 */
export function getCurrentRegime(): string {
  return currentRegime;
}

/**
 * Apply regime-specific weights
 */
export function applyRegimeWeights(regime: string): void {
  const profile = REGIME_PROFILES[regime];
  
  if (!profile) {
    console.warn(`[Learning Rules] Unknown regime: ${regime}`);
    return;
  }
  
  // Apply optimal weights for this regime
  if (profile.optimalWeights) {
    updateRewardWeights(profile.optimalWeights as Partial<RewardWeights>);
  }
  
  console.log(`[Learning Rules] Applied weights for regime: ${regime}`);
}

/**
 * Detect regime from market data
 */
export function detectRegime(marketData: {
  volatility: number;
  trendStrength: number;
  liquidity: number;
}): string {
  // Check each regime profile
  for (const [name, profile] of Object.entries(REGIME_PROFILES)) {
    const volMatch = marketData.volatility >= profile.volatilityRange[0] &&
                     marketData.volatility <= profile.volatilityRange[1];
    const trendMatch = marketData.trendStrength >= profile.trendStrength[0] &&
                       marketData.trendStrength <= profile.trendStrength[1];
    const liqMatch = marketData.liquidity >= profile.liquidityLevel[0] &&
                     marketData.liquidity <= profile.liquidityLevel[1];
    
    if (volMatch && trendMatch && liqMatch) {
      return name;
    }
  }
  
  return 'STABLE'; // Default
}

/**
 * Get regime profile
 */
export function getRegimeProfile(regime: string): RegimeProfile | null {
  return REGIME_PROFILES[regime] || null;
}

// ============================================================================
// Shield/Threat Adjustments
// ============================================================================

/**
 * Adjust learning based on shield state
 */
export function adjustForShield(shieldActive: boolean): void {
  if (shieldActive) {
    // Increase shield compliance reward
    adjustRewardWeight('shieldCompliance', 1.5);
    
    // Increase override violation penalty
    adjustPenaltyWeight('overrideViolation', 1.5);
    
    // Reduce exploration
    currentConfig.explorationRate *= 0.5;
    
    console.log('[Learning Rules] Adjusted for shield activation');
  } else {
    // Restore normal weights
    updateRewardWeights({ shieldCompliance: DEFAULT_REWARD_WEIGHTS.shieldCompliance });
    updatePenaltyWeights({ overrideViolation: DEFAULT_PENALTY_WEIGHTS.overrideViolation });
    updateLearningConfig({ explorationRate: DEFAULT_LEARNING_CONFIG.explorationRate });
    
    console.log('[Learning Rules] Adjusted for shield deactivation');
  }
}

/**
 * Adjust learning based on threat level
 */
export function adjustForThreatLevel(threatLevel: number): void {
  if (threatLevel > 80) {
    // High threat: increase risk penalties
    adjustPenaltyWeight('excessiveRisk', 1.5);
    adjustPenaltyWeight('overrideViolation', 1.5);
    
    // Reduce exploration
    currentConfig.explorationRate *= 0.7;
    
    console.log('[Learning Rules] Adjusted for high threat level');
  } else if (threatLevel < 30) {
    // Low threat: restore normal learning
    updatePenaltyWeights({
      excessiveRisk: DEFAULT_PENALTY_WEIGHTS.excessiveRisk,
      overrideViolation: DEFAULT_PENALTY_WEIGHTS.overrideViolation,
    });
    updateLearningConfig({ explorationRate: DEFAULT_LEARNING_CONFIG.explorationRate });
    
    console.log('[Learning Rules] Adjusted for low threat level');
  }
}

/**
 * Adjust learning based on volatility
 */
export function adjustForVolatility(volatilityLevel: number): void {
  if (volatilityLevel > 80) {
    // High volatility: increase regime sensitivity
    currentConfig.regimeSensitivity = Math.min(1.0, currentConfig.regimeSensitivity * 1.3);
    
    // Increase adaptive accuracy weight
    adjustRewardWeight('adaptiveAccuracy', 1.3);
    
    console.log('[Learning Rules] Adjusted for high volatility');
  } else if (volatilityLevel < 30) {
    // Low volatility: normal sensitivity
    updateLearningConfig({ regimeSensitivity: DEFAULT_LEARNING_CONFIG.regimeSensitivity });
    updateRewardWeights({ adaptiveAccuracy: DEFAULT_REWARD_WEIGHTS.adaptiveAccuracy });
    
    console.log('[Learning Rules] Adjusted for low volatility');
  }
}

// ============================================================================
// Mutation & Evolution
// ============================================================================

/**
 * Mutate weights randomly (for exploration)
 */
export function mutateWeights(): void {
  const mutationRate = currentConfig.mutationRate;
  
  // Mutate reward weights
  Object.keys(currentRewardWeights).forEach(key => {
    if (Math.random() < mutationRate) {
      const mutation = 1 + (Math.random() - 0.5) * 0.2; // ±10%
      (currentRewardWeights as any)[key] *= mutation;
    }
  });
  
  // Mutate penalty weights
  Object.keys(currentPenaltyWeights).forEach(key => {
    if (Math.random() < mutationRate) {
      const mutation = 1 + (Math.random() - 0.5) * 0.2; // ±10%
      (currentPenaltyWeights as any)[key] *= mutation;
    }
  });
  
  console.log('[Learning Rules] Applied weight mutations');
}

/**
 * Reset to defaults
 */
export function resetToDefaults(): void {
  currentRewardWeights = { ...DEFAULT_REWARD_WEIGHTS };
  currentPenaltyWeights = { ...DEFAULT_PENALTY_WEIGHTS };
  currentConfig = { ...DEFAULT_LEARNING_CONFIG };
  currentRegime = 'STABLE';
  
  console.log('[Learning Rules] Reset to default values');
}

/**
 * Export state
 */
export function exportRulesState() {
  return {
    rewardWeights: currentRewardWeights,
    penaltyWeights: currentPenaltyWeights,
    config: currentConfig,
    regime: currentRegime,
  };
}

/**
 * Import state
 */
export function importRulesState(state: any): void {
  if (state.rewardWeights) {
    currentRewardWeights = state.rewardWeights;
  }
  if (state.penaltyWeights) {
    currentPenaltyWeights = state.penaltyWeights;
  }
  if (state.config) {
    currentConfig = state.config;
  }
  if (state.regime) {
    currentRegime = state.regime;
  }
  
  console.log('[Learning Rules] Imported state');
}

// Export rules object
export const LearningRules = {
  // Reward calculation
  calculateTradeReward,
  calculateWinRateReward,
  calculateAdaptiveReward,
  
  // Penalty calculation
  calculateTradePenalty,
  calculateDrawdownPenalty,
  
  // Weight management
  getRewardWeights,
  getPenaltyWeights,
  getLearningConfig,
  updateRewardWeights,
  updatePenaltyWeights,
  updateLearningConfig,
  adjustRewardWeight,
  adjustPenaltyWeight,
  
  // Regime management
  setCurrentRegime,
  getCurrentRegime,
  applyRegimeWeights,
  detectRegime,
  getRegimeProfile,
  
  // Shield/Threat adjustments
  adjustForShield,
  adjustForThreatLevel,
  adjustForVolatility,
  
  // Mutation & evolution
  mutateWeights,
  resetToDefaults,
  
  // State management
  export: exportRulesState,
  import: importRulesState,
  
  // Constants
  DEFAULT_REWARD_WEIGHTS,
  DEFAULT_PENALTY_WEIGHTS,
  DEFAULT_LEARNING_CONFIG,
  REGIME_PROFILES,
};

export default LearningRules;
