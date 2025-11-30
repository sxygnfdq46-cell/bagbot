/**
 * Reinforcement Core - Multi-Layer Reinforcement Learning Engine
 * 
 * Learns from trading outcomes to improve decision-making over time.
 * Uses reward/penalty system with adaptive weight updates.
 */

import { LearningRules, RewardWeights, PenaltyWeights } from './learningRules';
import { StateMemory, StateSnapshot } from './stateMemory';

/**
 * RL update result
 */
export interface RLUpdate {
  reward: number;
  penalty: number;
  updatedWeights: {
    rewardWeights: Partial<RewardWeights>;
    penaltyWeights: Partial<PenaltyWeights>;
  };
  timestamp: number;
  learningRate: number;
  confidence: number;
}

/**
 * Encoded state (simplified representation)
 */
export interface EncodedState {
  features: number[];           // Numerical feature vector
  featureNames: string[];        // Feature labels
  regime: string;                // Market regime
  timestamp: number;
}

/**
 * Trade result for learning
 */
export interface TradeResult {
  // Basic info
  symbol: string;
  action: 'BUY' | 'SELL';
  
  // Performance
  profit: number;
  profitPercent: number;
  duration: number;
  
  // Risk metrics
  maxDrawdown: number;
  riskRewardRatio: number;
  
  // Compliance
  followedShield: boolean;
  alignedWithFusion: boolean;
  ignoredOverride: boolean;
  
  // Context
  regimeMatch: boolean;
  poorEntry: boolean;
  poorExit: boolean;
  oversized: boolean;
  ignoredConflict: boolean;
  
  // State
  entryState: StateSnapshot;
  exitState?: StateSnapshot;
}

/**
 * Learning summary
 */
export interface LearningSummary {
  totalUpdates: number;
  totalReward: number;
  totalPenalty: number;
  netLearning: number;
  averageReward: number;
  averagePenalty: number;
  learningRate: number;
  explorationRate: number;
  currentRegime: string;
  recentPerformance: {
    successRate: number;
    averageProfit: number;
    adaptationScore: number;
  };
  weightChanges: {
    rewardWeights: Record<string, number>;
    penaltyWeights: Record<string, number>;
  };
}

/**
 * Reinforcement Learning Core
 */
export class ReinforcementCore {
  private updateHistory: RLUpdate[] = [];
  private totalReward: number = 0;
  private totalPenalty: number = 0;
  private updateCount: number = 0;
  
  // Configuration
  private config = {
    maxHistorySize: 200,
    minConfidenceForUpdate: 50,
    adaptiveScaling: true,
    explorationDecay: 0.995,
  };
  
  constructor() {
    console.log('[Reinforcement Core] Initialized');
  }
  
  // ============================================================================
  // Core Methods
  // ============================================================================
  
  /**
   * Encode state snapshot into feature vector
   */
  encodeState(snapshot: StateSnapshot): EncodedState {
    const features: number[] = [];
    const featureNames: string[] = [];
    
    // Market features
    features.push(this.normalize(snapshot.price, 0, 100000));
    featureNames.push('price');
    
    features.push(snapshot.volatility / 100);
    featureNames.push('volatility');
    
    features.push(this.normalize(snapshot.trend, -100, 100));
    featureNames.push('trend');
    
    features.push(snapshot.liquidity / 100);
    featureNames.push('liquidity');
    
    features.push(this.normalize(snapshot.momentum, -100, 100));
    featureNames.push('momentum');
    
    // Engine features
    features.push(snapshot.shieldActive ? 1 : 0);
    featureNames.push('shieldActive');
    
    features.push(snapshot.threatLevel / 100);
    featureNames.push('threatLevel');
    
    // Fusion features
    features.push(snapshot.fusionConfidence / 100);
    featureNames.push('fusionConfidence');
    
    features.push(snapshot.fusionQuality / 100);
    featureNames.push('fusionQuality');
    
    // Position features
    features.push(snapshot.hasPosition ? 1 : 0);
    featureNames.push('hasPosition');
    
    features.push(this.normalize(snapshot.positionSize, 0, 10));
    featureNames.push('positionSize');
    
    features.push(this.normalize(snapshot.positionPnL, -100, 100));
    featureNames.push('positionPnL');
    
    // Override features
    features.push(snapshot.overrideActive ? 1 : 0);
    featureNames.push('overrideActive');
    
    features.push(snapshot.overrideSeverity / 100);
    featureNames.push('overrideSeverity');
    
    return {
      features,
      featureNames,
      regime: snapshot.flowState,
      timestamp: snapshot.timestamp,
    };
  }
  
  /**
   * Calculate reward for a trade
   */
  calculateReward(trade: TradeResult): number {
    // Use learning rules to calculate reward
    const reward = LearningRules.calculateTradeReward({
      profit: trade.profit,
      profitPercent: trade.profitPercent,
      duration: trade.duration,
      riskRewardRatio: trade.riskRewardRatio,
      followedShield: trade.followedShield,
      alignedWithFusion: trade.alignedWithFusion,
      regimeMatch: trade.regimeMatch,
    });
    
    this.totalReward += reward;
    
    return reward;
  }
  
  /**
   * Calculate penalty for a trade
   */
  calculatePenalty(trade: TradeResult): number {
    // Use learning rules to calculate penalty
    const penalty = LearningRules.calculateTradePenalty({
      loss: trade.profit < 0 ? trade.profit : 0,
      lossPercent: trade.profit < 0 ? trade.profitPercent : 0,
      maxDrawdown: trade.maxDrawdown,
      ignoredOverride: trade.ignoredOverride,
      poorEntry: trade.poorEntry,
      poorExit: trade.poorExit,
      regimeMismatch: !trade.regimeMatch,
      oversized: trade.oversized,
      ignoredConflict: trade.ignoredConflict,
    });
    
    this.totalPenalty += penalty;
    
    return penalty;
  }
  
  /**
   * Update model based on reward/penalty
   */
  updateModel(state: EncodedState, reward: number, penalty: number = 0): RLUpdate {
    const config = LearningRules.getLearningConfig();
    const netValue = reward - penalty;
    
    // Calculate learning signal strength
    const confidence = this.calculateUpdateConfidence(state, netValue);
    
    // Skip update if confidence too low
    if (confidence < this.config.minConfidenceForUpdate) {
      console.log(`[Reinforcement Core] Skipping update - low confidence: ${confidence}`);
      return this.createNullUpdate();
    }
    
    // Calculate weight adjustments
    const updatedWeights = this.calculateWeightUpdates(state, netValue, confidence);
    
    // Apply weight updates
    if (updatedWeights.rewardWeights) {
      LearningRules.updateRewardWeights(updatedWeights.rewardWeights);
    }
    if (updatedWeights.penaltyWeights) {
      LearningRules.updatePenaltyWeights(updatedWeights.penaltyWeights);
    }
    
    // Create update record
    const update: RLUpdate = {
      reward,
      penalty,
      updatedWeights,
      timestamp: Date.now(),
      learningRate: config.learningRate,
      confidence,
    };
    
    // Store update
    this.updateHistory.push(update);
    this.updateCount++;
    
    // Maintain history size
    if (this.updateHistory.length > this.config.maxHistorySize) {
      this.updateHistory.shift();
    }
    
    // Decay exploration rate
    if (config.explorationRate > 0.01) {
      LearningRules.updateLearningConfig({
        explorationRate: config.explorationRate * this.config.explorationDecay,
      });
    }
    
    console.log(`[Reinforcement Core] Updated model - reward: ${reward.toFixed(2)}, penalty: ${penalty.toFixed(2)}, confidence: ${confidence.toFixed(1)}`);
    
    return update;
  }
  
  /**
   * Get learning summary
   */
  getLearningSummary(): LearningSummary {
    const config = LearningRules.getLearningConfig();
    const rewardWeights = LearningRules.getRewardWeights();
    const penaltyWeights = LearningRules.getPenaltyWeights();
    
    const avgReward = this.updateCount > 0 ? this.totalReward / this.updateCount : 0;
    const avgPenalty = this.updateCount > 0 ? this.totalPenalty / this.updateCount : 0;
    const netLearning = this.totalReward - this.totalPenalty;
    
    // Calculate recent performance
    const recentStates = StateMemory.getRecentStates(50);
    const withOutcomes = recentStates.filter(s => s.outcome);
    const successful = withOutcomes.filter(s => s.outcome?.success);
    
    const successRate = withOutcomes.length > 0
      ? (successful.length / withOutcomes.length) * 100
      : 0;
    
    const avgProfit = withOutcomes.length > 0
      ? withOutcomes.reduce((sum, s) => sum + (s.outcome?.profitPercent || 0), 0) / withOutcomes.length
      : 0;
    
    // Calculate adaptation score
    const adaptationScore = this.calculateAdaptationScore();
    
    // Calculate weight changes
    const weightChanges = this.calculateWeightChanges();
    
    return {
      totalUpdates: this.updateCount,
      totalReward: this.totalReward,
      totalPenalty: this.totalPenalty,
      netLearning,
      averageReward: avgReward,
      averagePenalty: avgPenalty,
      learningRate: config.learningRate,
      explorationRate: config.explorationRate,
      currentRegime: LearningRules.getCurrentRegime(),
      recentPerformance: {
        successRate,
        averageProfit: avgProfit,
        adaptationScore,
      },
      weightChanges,
    };
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  /**
   * Normalize value to 0-1 range
   */
  private normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }
  
  /**
   * Calculate confidence of update
   */
  private calculateUpdateConfidence(state: EncodedState, netValue: number): number {
    let confidence = 50; // Base confidence
    
    // Increase confidence for strong signals
    const signalStrength = Math.abs(netValue);
    confidence += Math.min(30, signalStrength * 3);
    
    // Adjust based on regime certainty
    const regimeProfile = LearningRules.getRegimeProfile(state.regime);
    if (regimeProfile) {
      confidence += 10;
    }
    
    // Adjust based on feature quality
    const validFeatures = state.features.filter(f => !isNaN(f) && isFinite(f)).length;
    const featureQuality = validFeatures / state.features.length;
    confidence *= featureQuality;
    
    return Math.min(100, confidence);
  }
  
  /**
   * Calculate weight updates based on learning
   */
  private calculateWeightUpdates(
    state: EncodedState,
    netValue: number,
    confidence: number
  ): {
    rewardWeights: Partial<RewardWeights>;
    penaltyWeights: Partial<PenaltyWeights>;
  } {
    const config = LearningRules.getLearningConfig();
    const learningRate = config.learningRate * (confidence / 100);
    
    const rewardWeights: Partial<RewardWeights> = {};
    const penaltyWeights: Partial<PenaltyWeights> = {};
    
    // Positive net value: increase reward weights
    if (netValue > 0) {
      const currentRewards = LearningRules.getRewardWeights();
      
      // Increase weights proportionally
      rewardWeights.profitMultiplier = 
        currentRewards.profitMultiplier * (1 + learningRate * 0.1);
      rewardWeights.riskAdjustedReturn = 
        currentRewards.riskAdjustedReturn * (1 + learningRate * 0.1);
    }
    // Negative net value: increase penalty weights
    else if (netValue < 0) {
      const currentPenalties = LearningRules.getPenaltyWeights();
      
      // Increase penalties proportionally
      penaltyWeights.lossMultiplier = 
        currentPenalties.lossMultiplier * (1 + learningRate * 0.1);
      penaltyWeights.drawdownPenalty = 
        currentPenalties.drawdownPenalty * (1 + learningRate * 0.1);
    }
    
    return {
      rewardWeights,
      penaltyWeights,
    };
  }
  
  /**
   * Create null update (when skipping)
   */
  private createNullUpdate(): RLUpdate {
    return {
      reward: 0,
      penalty: 0,
      updatedWeights: {
        rewardWeights: {},
        penaltyWeights: {},
      },
      timestamp: Date.now(),
      learningRate: 0,
      confidence: 0,
    };
  }
  
  /**
   * Calculate adaptation score
   */
  private calculateAdaptationScore(): number {
    const recent = this.updateHistory.slice(-20);
    
    if (recent.length < 5) return 50;
    
    const avgConfidence = recent.reduce((sum, u) => sum + u.confidence, 0) / recent.length;
    const avgNet = recent.reduce((sum, u) => sum + (u.reward - u.penalty), 0) / recent.length;
    
    // Score based on confidence and positive learning
    let score = avgConfidence * 0.5;
    score += Math.max(0, Math.min(50, avgNet * 5));
    
    return Math.min(100, score);
  }
  
  /**
   * Calculate weight changes
   */
  private calculateWeightChanges(): {
    rewardWeights: Record<string, number>;
    penaltyWeights: Record<string, number>;
  } {
    const defaultRewards = LearningRules.DEFAULT_REWARD_WEIGHTS;
    const currentRewards = LearningRules.getRewardWeights();
    const defaultPenalties = LearningRules.DEFAULT_PENALTY_WEIGHTS;
    const currentPenalties = LearningRules.getPenaltyWeights();
    
    const rewardChanges: Record<string, number> = {};
    const penaltyChanges: Record<string, number> = {};
    
    // Calculate reward weight changes
    Object.keys(defaultRewards).forEach(key => {
      const k = key as keyof RewardWeights;
      const change = ((currentRewards[k] - defaultRewards[k]) / defaultRewards[k]) * 100;
      rewardChanges[key] = change;
    });
    
    // Calculate penalty weight changes
    Object.keys(defaultPenalties).forEach(key => {
      const k = key as keyof PenaltyWeights;
      const change = ((currentPenalties[k] - defaultPenalties[k]) / defaultPenalties[k]) * 100;
      penaltyChanges[key] = change;
    });
    
    return {
      rewardWeights: rewardChanges,
      penaltyWeights: penaltyChanges,
    };
  }
  
  // ============================================================================
  // Training Methods
  // ============================================================================
  
  /**
   * Train on closed trade
   */
  trainOnClosedTrade(trade: TradeResult): RLUpdate {
    console.log(`[Reinforcement Core] Training on closed trade: ${trade.symbol}`);
    
    // Encode entry state
    const encodedState = this.encodeState(trade.entryState);
    
    // Calculate reward and penalty
    const reward = this.calculateReward(trade);
    const penalty = this.calculatePenalty(trade);
    
    // Update model
    const update = this.updateModel(encodedState, reward, penalty);
    
    // Store state with outcome
    const stateWithOutcome = {
      ...trade.entryState,
      outcome: {
        profit: trade.profit,
        profitPercent: trade.profitPercent,
        duration: trade.duration,
        success: trade.profit > 0,
      },
    };
    
    StateMemory.push(stateWithOutcome, reward > penalty ? 'HIGH' : 'MEDIUM');
    
    return update;
  }
  
  /**
   * Train on market regime shift
   */
  trainOnRegimeShift(oldRegime: string, newRegime: string, successful: boolean): void {
    console.log(`[Reinforcement Core] Training on regime shift: ${oldRegime} → ${newRegime}`);
    
    // Apply new regime weights
    LearningRules.setCurrentRegime(newRegime);
    
    // Reward/penalize based on adaptation success
    if (successful) {
      const reward = LearningRules.calculateAdaptiveReward(1, 1);
      console.log(`[Reinforcement Core] Successful adaptation - reward: ${reward.toFixed(2)}`);
    } else {
      const penalty = LearningRules.getPenaltyWeights().regimeMismatch * 2;
      console.log(`[Reinforcement Core] Failed adaptation - penalty: ${penalty.toFixed(2)}`);
    }
  }
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  /**
   * Get update history
   */
  getUpdateHistory(): RLUpdate[] {
    return [...this.updateHistory];
  }
  
  /**
   * Get recent updates
   */
  getRecentUpdates(count: number = 10): RLUpdate[] {
    return this.updateHistory.slice(-count);
  }
  
  /**
   * Clear update history
   */
  clearHistory(): void {
    this.updateHistory = [];
    this.totalReward = 0;
    this.totalPenalty = 0;
    this.updateCount = 0;
    console.log('[Reinforcement Core] History cleared');
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      updateCount: this.updateCount,
      totalReward: this.totalReward,
      totalPenalty: this.totalPenalty,
      netLearning: this.totalReward - this.totalPenalty,
      averageReward: this.updateCount > 0 ? this.totalReward / this.updateCount : 0,
      averagePenalty: this.updateCount > 0 ? this.totalPenalty / this.updateCount : 0,
      historySize: this.updateHistory.length,
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config };
    console.log('[Reinforcement Core] Configuration updated:', config);
  }
  
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Export state
   */
  exportState() {
    return {
      updateHistory: this.updateHistory,
      totalReward: this.totalReward,
      totalPenalty: this.totalPenalty,
      updateCount: this.updateCount,
      config: this.config,
      summary: this.getLearningSummary(),
      statistics: this.getStatistics(),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let coreInstance: ReinforcementCore | null = null;

/**
 * Get ReinforcementCore instance
 */
export function getReinforcementCore(): ReinforcementCore {
  if (!coreInstance) {
    coreInstance = new ReinforcementCore();
  }
  return coreInstance;
}

/**
 * Reset ReinforcementCore instance
 */
export function resetReinforcementCore(): void {
  coreInstance = null;
  console.log('[Reinforcement Core] Instance reset');
}

export default ReinforcementCore;
