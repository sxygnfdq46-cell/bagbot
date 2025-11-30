/**
 * Learning State - Global State Management for Reinforcement Learning
 * 
 * Maintains persistent learning weights, regime profiles, and training history.
 * Provides analytics and trend analysis for learning progress.
 */

import {
  RLUpdate,
  LearningSummary,
} from '@/app/lib/learning/ReinforcementCore';
import {
  RewardWeights,
  PenaltyWeights,
  LearningConfig,
} from '@/app/lib/learning/learningRules';

/**
 * Learning state structure
 */
interface LearningStateData {
  // Persistent weights
  rewardWeights: RewardWeights;
  penaltyWeights: PenaltyWeights;
  learningConfig: LearningConfig;
  
  // Regime tracking
  currentRegime: string;
  regimeHistory: Array<{
    regime: string;
    timestamp: number;
    duration: number;
  }>;
  
  // Training history
  trainingHistory: RLUpdate[];
  maxHistorySize: number;
  
  // Metadata
  totalTrainingSessions: number;
  totalReward: number;
  totalPenalty: number;
  startTime: number;
  lastUpdateTime: number;
}

/**
 * Training statistics
 */
interface TrainingStats {
  totalSessions: number;
  totalReward: number;
  totalPenalty: number;
  netLearning: number;
  averageReward: number;
  averagePenalty: number;
  successRate: number;
  trainingDuration: number;
  sessionsPerHour: number;
  recentTrend: 'IMPROVING' | 'DEGRADING' | 'STABLE';
  confidenceTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

/**
 * Weight evolution tracking
 */
interface WeightEvolution {
  rewardWeights: Record<string, number[]>;
  penaltyWeights: Record<string, number[]>;
  timestamps: number[];
}

/**
 * Regime performance tracking
 */
interface RegimePerformance {
  regime: string;
  sessionsCount: number;
  totalReward: number;
  totalPenalty: number;
  netLearning: number;
  averageConfidence: number;
  duration: number;
}

// Global state
const state: LearningStateData = {
  rewardWeights: {} as RewardWeights,
  penaltyWeights: {} as PenaltyWeights,
  learningConfig: {} as LearningConfig,
  currentRegime: 'STABLE',
  regimeHistory: [],
  trainingHistory: [],
  maxHistorySize: 200,
  totalTrainingSessions: 0,
  totalReward: 0,
  totalPenalty: 0,
  startTime: Date.now(),
  lastUpdateTime: Date.now(),
};

// Weight evolution tracking
const weightEvolution: WeightEvolution = {
  rewardWeights: {},
  penaltyWeights: {},
  timestamps: [],
};

// ============================================================================
// Core State Management
// ============================================================================

/**
 * Add training update to history
 */
export function addTrainingUpdate(update: RLUpdate): void {
  state.trainingHistory.push(update);
  state.totalTrainingSessions++;
  state.totalReward += update.reward;
  state.totalPenalty += update.penalty;
  state.lastUpdateTime = Date.now();
  
  // Track weight evolution
  trackWeightEvolution(update);
  
  // Maintain size limit
  if (state.trainingHistory.length > state.maxHistorySize) {
    const removed = state.trainingHistory.shift();
    if (removed) {
      state.totalReward -= removed.reward;
      state.totalPenalty -= removed.penalty;
    }
  }
  
  console.log(`[Learning State] Added training update (total: ${state.trainingHistory.length})`);
}

/**
 * Update learning weights
 */
export function updateLearningWeights(
  rewardWeights?: Partial<RewardWeights>,
  penaltyWeights?: Partial<PenaltyWeights>
): void {
  if (rewardWeights) {
    state.rewardWeights = { ...state.rewardWeights, ...rewardWeights };
  }
  
  if (penaltyWeights) {
    state.penaltyWeights = { ...state.penaltyWeights, ...penaltyWeights };
  }
  
  console.log('[Learning State] Updated learning weights');
}

/**
 * Update learning configuration
 */
export function updateLearningConfig(config: Partial<LearningConfig>): void {
  state.learningConfig = { ...state.learningConfig, ...config };
  console.log('[Learning State] Updated learning config');
}

/**
 * Set current regime
 */
export function setCurrentRegime(regime: string): void {
  if (regime !== state.currentRegime) {
    // Record regime change
    const lastRegime = state.regimeHistory[state.regimeHistory.length - 1];
    if (lastRegime) {
      lastRegime.duration = Date.now() - lastRegime.timestamp;
    }
    
    state.regimeHistory.push({
      regime,
      timestamp: Date.now(),
      duration: 0,
    });
    
    state.currentRegime = regime;
    
    console.log(`[Learning State] Regime changed to: ${regime}`);
  }
}

/**
 * Get current regime
 */
export function getCurrentRegime(): string {
  return state.currentRegime;
}

/**
 * Get regime history
 */
export function getRegimeHistory(): Array<{
  regime: string;
  timestamp: number;
  duration: number;
}> {
  return [...state.regimeHistory];
}

// ============================================================================
// Training History
// ============================================================================

/**
 * Get all training history
 */
export function getTrainingHistory(): RLUpdate[] {
  return [...state.trainingHistory];
}

/**
 * Get recent training updates
 */
export function getRecentTraining(count: number = 10): RLUpdate[] {
  return state.trainingHistory.slice(-count);
}

/**
 * Get successful updates
 */
export function getSuccessfulUpdates(): RLUpdate[] {
  return state.trainingHistory.filter(u => u.reward > u.penalty);
}

/**
 * Get failed updates
 */
export function getFailedUpdates(): RLUpdate[] {
  return state.trainingHistory.filter(u => u.reward <= u.penalty);
}

/**
 * Get updates by time range
 */
export function getUpdatesByTimeRange(startTime: number, endTime: number): RLUpdate[] {
  return state.trainingHistory.filter(
    u => u.timestamp >= startTime && u.timestamp <= endTime
  );
}

/**
 * Clear training history
 */
export function clearTrainingHistory(): void {
  state.trainingHistory = [];
  state.totalTrainingSessions = 0;
  state.totalReward = 0;
  state.totalPenalty = 0;
  console.log('[Learning State] Training history cleared');
}

/**
 * Set max history size
 */
export function setMaxHistorySize(size: number): void {
  state.maxHistorySize = Math.max(50, size);
  
  // Trim if needed
  while (state.trainingHistory.length > state.maxHistorySize) {
    const removed = state.trainingHistory.shift();
    if (removed) {
      state.totalReward -= removed.reward;
      state.totalPenalty -= removed.penalty;
    }
  }
  
  console.log(`[Learning State] Max history size set to ${state.maxHistorySize}`);
}

// ============================================================================
// Statistics & Analytics
// ============================================================================

/**
 * Get training statistics
 */
export function getTrainingStats(): TrainingStats {
  const total = state.totalTrainingSessions;
  
  if (total === 0) {
    return {
      totalSessions: 0,
      totalReward: 0,
      totalPenalty: 0,
      netLearning: 0,
      averageReward: 0,
      averagePenalty: 0,
      successRate: 0,
      trainingDuration: 0,
      sessionsPerHour: 0,
      recentTrend: 'STABLE',
      confidenceTrend: 'STABLE',
    };
  }
  
  const avgReward = state.totalReward / total;
  const avgPenalty = state.totalPenalty / total;
  const netLearning = state.totalReward - state.totalPenalty;
  
  // Success rate
  const successful = getSuccessfulUpdates().length;
  const successRate = (successful / total) * 100;
  
  // Training duration
  const duration = Date.now() - state.startTime;
  const hours = duration / (1000 * 60 * 60);
  const sessionsPerHour = total / hours;
  
  // Recent trend
  const recentTrend = getRecentTrend();
  const confidenceTrend = getConfidenceTrend();
  
  return {
    totalSessions: total,
    totalReward: state.totalReward,
    totalPenalty: state.totalPenalty,
    netLearning,
    averageReward: avgReward,
    averagePenalty: avgPenalty,
    successRate,
    trainingDuration: duration,
    sessionsPerHour,
    recentTrend,
    confidenceTrend,
  };
}

/**
 * Get recent trend
 */
export function getRecentTrend(): 'IMPROVING' | 'DEGRADING' | 'STABLE' {
  const recentCount = Math.min(20, state.trainingHistory.length);
  
  if (recentCount < 5) {
    return 'STABLE';
  }
  
  const recent = state.trainingHistory.slice(-recentCount);
  const halfPoint = Math.floor(recentCount / 2);
  const firstHalf = recent.slice(0, halfPoint);
  const secondHalf = recent.slice(halfPoint);
  
  const firstAvg = firstHalf.reduce((sum, u) => sum + (u.reward - u.penalty), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, u) => sum + (u.reward - u.penalty), 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const changePercent = Math.abs(change);
  
  if (changePercent > 1) {
    return change > 0 ? 'IMPROVING' : 'DEGRADING';
  }
  
  return 'STABLE';
}

/**
 * Get confidence trend
 */
export function getConfidenceTrend(): 'INCREASING' | 'DECREASING' | 'STABLE' {
  const recentCount = Math.min(20, state.trainingHistory.length);
  
  if (recentCount < 5) {
    return 'STABLE';
  }
  
  const recent = state.trainingHistory.slice(-recentCount);
  const halfPoint = Math.floor(recentCount / 2);
  const firstHalf = recent.slice(0, halfPoint);
  const secondHalf = recent.slice(halfPoint);
  
  const firstAvg = firstHalf.reduce((sum, u) => sum + u.confidence, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, u) => sum + u.confidence, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const changePercent = Math.abs(change);
  
  if (changePercent > 5) {
    return change > 0 ? 'INCREASING' : 'DECREASING';
  }
  
  return 'STABLE';
}

/**
 * Get regime performance
 */
export function getRegimePerformance(): RegimePerformance[] {
  const regimeMap = new Map<string, {
    count: number;
    reward: number;
    penalty: number;
    confidence: number;
    duration: number;
  }>();
  
  // Aggregate by regime
  state.regimeHistory.forEach(entry => {
    const existing = regimeMap.get(entry.regime) || {
      count: 0,
      reward: 0,
      penalty: 0,
      confidence: 0,
      duration: 0,
    };
    
    existing.count++;
    existing.duration += entry.duration;
    
    regimeMap.set(entry.regime, existing);
  });
  
  // Add training data
  state.trainingHistory.forEach(update => {
    // Note: We don't have regime info in update, would need to track separately
    // For now, just aggregate to current regime
    const existing = regimeMap.get(state.currentRegime);
    if (existing) {
      existing.reward += update.reward;
      existing.penalty += update.penalty;
      existing.confidence += update.confidence;
    }
  });
  
  // Convert to array
  const performance: RegimePerformance[] = [];
  
  regimeMap.forEach((data, regime) => {
    performance.push({
      regime,
      sessionsCount: data.count,
      totalReward: data.reward,
      totalPenalty: data.penalty,
      netLearning: data.reward - data.penalty,
      averageConfidence: data.count > 0 ? data.confidence / data.count : 0,
      duration: data.duration,
    });
  });
  
  return performance.sort((a, b) => b.netLearning - a.netLearning);
}

/**
 * Get weight evolution
 */
export function getWeightEvolution(): WeightEvolution {
  return {
    rewardWeights: { ...weightEvolution.rewardWeights },
    penaltyWeights: { ...weightEvolution.penaltyWeights },
    timestamps: [...weightEvolution.timestamps],
  };
}

/**
 * Track weight evolution
 */
function trackWeightEvolution(update: RLUpdate): void {
  weightEvolution.timestamps.push(update.timestamp);
  
  // Track reward weight changes
  Object.entries(update.updatedWeights.rewardWeights || {}).forEach(([key, value]) => {
    if (!weightEvolution.rewardWeights[key]) {
      weightEvolution.rewardWeights[key] = [];
    }
    weightEvolution.rewardWeights[key].push(value as number);
  });
  
  // Track penalty weight changes
  Object.entries(update.updatedWeights.penaltyWeights || {}).forEach(([key, value]) => {
    if (!weightEvolution.penaltyWeights[key]) {
      weightEvolution.penaltyWeights[key] = [];
    }
    weightEvolution.penaltyWeights[key].push(value as number);
  });
  
  // Maintain max size (keep last 100 entries)
  const maxSize = 100;
  if (weightEvolution.timestamps.length > maxSize) {
    weightEvolution.timestamps = weightEvolution.timestamps.slice(-maxSize);
    
    Object.keys(weightEvolution.rewardWeights).forEach(key => {
      weightEvolution.rewardWeights[key] = weightEvolution.rewardWeights[key].slice(-maxSize);
    });
    
    Object.keys(weightEvolution.penaltyWeights).forEach(key => {
      weightEvolution.penaltyWeights[key] = weightEvolution.penaltyWeights[key].slice(-maxSize);
    });
  }
}

// ============================================================================
// Performance Summary
// ============================================================================

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
} {
  const stats = getTrainingStats();
  
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  // Success rate
  if (stats.successRate >= 70) {
    strengths.push(`High success rate: ${stats.successRate.toFixed(1)}%`);
  } else if (stats.successRate < 50) {
    weaknesses.push(`Low success rate: ${stats.successRate.toFixed(1)}%`);
    recommendations.push('Review reward/penalty weights - may need adjustment');
    score -= 20;
  }
  
  // Net learning
  if (stats.netLearning > 0) {
    strengths.push(`Positive net learning: ${stats.netLearning.toFixed(2)}`);
  } else {
    weaknesses.push(`Negative net learning: ${stats.netLearning.toFixed(2)}`);
    recommendations.push('System is learning from mistakes - increase training frequency');
    score -= 15;
  }
  
  // Recent trend
  if (stats.recentTrend === 'IMPROVING') {
    strengths.push('Learning trend improving');
  } else if (stats.recentTrend === 'DEGRADING') {
    weaknesses.push('Learning trend degrading');
    recommendations.push('Review recent trades - market conditions may have changed');
    score -= 15;
  }
  
  // Confidence trend
  if (stats.confidenceTrend === 'INCREASING') {
    strengths.push('Confidence increasing');
  } else if (stats.confidenceTrend === 'DECREASING') {
    weaknesses.push('Confidence decreasing');
    recommendations.push('System uncertain - may need more training data');
    score -= 10;
  }
  
  // Training frequency
  if (stats.sessionsPerHour > 1) {
    strengths.push(`Active training: ${stats.sessionsPerHour.toFixed(1)} sessions/hour`);
  } else if (stats.sessionsPerHour < 0.1) {
    weaknesses.push('Low training frequency');
    recommendations.push('Increase trading activity to generate more training data');
    score -= 10;
  }
  
  score = Math.max(0, Math.min(100, score));
  
  // Grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  
  return {
    score,
    grade,
    strengths,
    weaknesses,
    recommendations,
  };
}

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export state
 */
export function exportState() {
  return {
    rewardWeights: state.rewardWeights,
    penaltyWeights: state.penaltyWeights,
    learningConfig: state.learningConfig,
    currentRegime: state.currentRegime,
    regimeHistory: state.regimeHistory,
    trainingHistory: state.trainingHistory,
    totalTrainingSessions: state.totalTrainingSessions,
    totalReward: state.totalReward,
    totalPenalty: state.totalPenalty,
    startTime: state.startTime,
    lastUpdateTime: state.lastUpdateTime,
    weightEvolution,
    stats: getTrainingStats(),
    performance: getPerformanceSummary(),
  };
}

/**
 * Import state
 */
export function importState(data: any): void {
  if (data.rewardWeights) {
    state.rewardWeights = data.rewardWeights;
  }
  if (data.penaltyWeights) {
    state.penaltyWeights = data.penaltyWeights;
  }
  if (data.learningConfig) {
    state.learningConfig = data.learningConfig;
  }
  if (data.currentRegime) {
    state.currentRegime = data.currentRegime;
  }
  if (data.regimeHistory) {
    state.regimeHistory = data.regimeHistory;
  }
  if (data.trainingHistory) {
    state.trainingHistory = data.trainingHistory;
  }
  if (data.totalTrainingSessions !== undefined) {
    state.totalTrainingSessions = data.totalTrainingSessions;
  }
  if (data.totalReward !== undefined) {
    state.totalReward = data.totalReward;
  }
  if (data.totalPenalty !== undefined) {
    state.totalPenalty = data.totalPenalty;
  }
  if (data.startTime) {
    state.startTime = data.startTime;
  }
  if (data.lastUpdateTime) {
    state.lastUpdateTime = data.lastUpdateTime;
  }
  if (data.weightEvolution) {
    Object.assign(weightEvolution, data.weightEvolution);
  }
  
  console.log('[Learning State] State imported');
}

/**
 * Reset state
 */
export function resetState(): void {
  state.rewardWeights = {} as RewardWeights;
  state.penaltyWeights = {} as PenaltyWeights;
  state.learningConfig = {} as LearningConfig;
  state.currentRegime = 'STABLE';
  state.regimeHistory = [];
  state.trainingHistory = [];
  state.totalTrainingSessions = 0;
  state.totalReward = 0;
  state.totalPenalty = 0;
  state.startTime = Date.now();
  state.lastUpdateTime = Date.now();
  
  weightEvolution.rewardWeights = {};
  weightEvolution.penaltyWeights = {};
  weightEvolution.timestamps = [];
  
  console.log('[Learning State] State reset');
}

// Export state manager
export const LearningState = {
  // Core
  addUpdate: addTrainingUpdate,
  updateWeights: updateLearningWeights,
  updateConfig: updateLearningConfig,
  
  // Regime
  setRegime: setCurrentRegime,
  getRegime: getCurrentRegime,
  getRegimeHistory,
  
  // Training history
  getHistory: getTrainingHistory,
  getRecent: getRecentTraining,
  getSuccessful: getSuccessfulUpdates,
  getFailed: getFailedUpdates,
  getByTimeRange: getUpdatesByTimeRange,
  clearHistory: clearTrainingHistory,
  setMaxSize: setMaxHistorySize,
  
  // Statistics
  getStats: getTrainingStats,
  getRecentTrend,
  getConfidenceTrend,
  getRegimePerformance,
  getWeightEvolution,
  
  // Performance
  getPerformance: getPerformanceSummary,
  
  // Export/Import
  export: exportState,
  import: importState,
  reset: resetState,
};

export default LearningState;
