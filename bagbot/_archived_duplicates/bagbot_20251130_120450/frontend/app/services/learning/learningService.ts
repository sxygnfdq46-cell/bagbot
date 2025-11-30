/**
 * Learning Service - React Service for Reinforcement Learning
 * 
 * Provides React integration for the Reinforcement Learning system.
 * Manages training on closed trades and market shifts.
 */

import { getReinforcementCore } from '@/app/lib/learning/ReinforcementCore';
import {
  TradeResult,
  RLUpdate,
  LearningSummary,
  EncodedState,
} from '@/app/lib/learning/ReinforcementCore';
import { StateMemory, StateSnapshot } from '@/app/lib/learning/stateMemory';
import { LearningRules } from '@/app/lib/learning/learningRules';

/**
 * Learning service state
 */
interface LearningServiceState {
  initialized: boolean;
  trainingActive: boolean;
  lastUpdate: RLUpdate | null;
  totalTrainingSessions: number;
  listeners: LearningListeners;
}

/**
 * Learning event listeners
 */
interface LearningListeners {
  onTrainingComplete?: (update: RLUpdate) => void;
  onRewardApplied?: (reward: number) => void;
  onPenaltyApplied?: (penalty: number) => void;
  onRegimeShift?: (oldRegime: string, newRegime: string) => void;
  onWeightsUpdated?: (weights: any) => void;
  onLearningImprovement?: (improvement: number) => void;
  onLearningDegradation?: (degradation: number) => void;
}

/**
 * Learning output
 */
interface LearningOutput {
  lastUpdate: RLUpdate | null;
  summary: LearningSummary;
  statistics: any;
  memoryStats: any;
  memoryHealth: any;
  recentUpdates: RLUpdate[];
  weightChanges: any;
}

// Service state
const state: LearningServiceState = {
  initialized: false,
  trainingActive: false,
  lastUpdate: null,
  totalTrainingSessions: 0,
  listeners: {},
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize learning service
 */
export function initLearning(): void {
  if (state.initialized) {
    console.log('[Learning Service] Already initialized');
    return;
  }
  
  console.log('[Learning Service] Initializing...');
  
  // Get singleton instance
  const core = getReinforcementCore();
  
  // Reset state
  state.initialized = true;
  state.trainingActive = false;
  state.lastUpdate = null;
  state.totalTrainingSessions = 0;
  
  console.log('[Learning Service] Initialized successfully');
}

/**
 * Check if initialized
 */
export function isInitialized(): boolean {
  return state.initialized;
}

// ============================================================================
// Core Training Operations
// ============================================================================

/**
 * Train on closed trade
 */
export function trainOnClosedTrade(trade: TradeResult): RLUpdate {
  if (!state.initialized) {
    console.warn('[Learning Service] Not initialized - initializing now');
    initLearning();
  }
  
  console.log(`[Learning Service] Training on closed trade: ${trade.symbol}`);
  
  state.trainingActive = true;
  
  const core = getReinforcementCore();
  const update = core.trainOnClosedTrade(trade);
  
  // Update state
  state.lastUpdate = update;
  state.totalTrainingSessions++;
  state.trainingActive = false;
  
  // Trigger listeners
  triggerTrainingListeners(update);
  
  return update;
}

/**
 * Train on market regime shift
 */
export function trainOnMarketShift(
  oldRegime: string,
  newRegime: string,
  snapshot: StateSnapshot
): void {
  if (!state.initialized) {
    console.warn('[Learning Service] Not initialized - initializing now');
    initLearning();
  }
  
  console.log(`[Learning Service] Training on regime shift: ${oldRegime} → ${newRegime}`);
  
  state.trainingActive = true;
  
  const core = getReinforcementCore();
  
  // Store state at regime shift
  StateMemory.push(snapshot, 'HIGH');
  
  // Train on shift (assume successful for now, can be updated later)
  core.trainOnRegimeShift(oldRegime, newRegime, true);
  
  state.trainingActive = false;
  
  // Trigger listener
  if (state.listeners.onRegimeShift) {
    state.listeners.onRegimeShift(oldRegime, newRegime);
  }
}

/**
 * Apply reward directly
 */
export function applyReward(
  reward: number,
  state: StateSnapshot,
  reason: string = 'Manual reward'
): RLUpdate {
  if (!state.initialized) {
    console.warn('[Learning Service] Not initialized - initializing now');
    initLearning();
  }
  
  console.log(`[Learning Service] Applying reward: ${reward.toFixed(2)} - ${reason}`);
  
  const core = getReinforcementCore();
  const encodedState = core.encodeState(state);
  
  const update = core.updateModel(encodedState, reward, 0);
  
  // Update service state
  state.lastUpdate = update;
  state.totalTrainingSessions++;
  
  // Trigger listener
  if (state.listeners.onRewardApplied) {
    state.listeners.onRewardApplied(reward);
  }
  
  triggerTrainingListeners(update);
  
  return update;
}

/**
 * Apply penalty directly
 */
export function applyPenalty(
  penalty: number,
  stateSnapshot: StateSnapshot,
  reason: string = 'Manual penalty'
): RLUpdate {
  if (!state.initialized) {
    console.warn('[Learning Service] Not initialized - initializing now');
    initLearning();
  }
  
  console.log(`[Learning Service] Applying penalty: ${penalty.toFixed(2)} - ${reason}`);
  
  const core = getReinforcementCore();
  const encodedState = core.encodeState(stateSnapshot);
  
  const update = core.updateModel(encodedState, 0, penalty);
  
  // Update service state
  state.lastUpdate = update;
  state.totalTrainingSessions++;
  
  // Trigger listener
  if (state.listeners.onPenaltyApplied) {
    state.listeners.onPenaltyApplied(penalty);
  }
  
  triggerTrainingListeners(update);
  
  return update;
}

/**
 * Train on batch of trades
 */
export function trainOnBatch(trades: TradeResult[]): RLUpdate[] {
  console.log(`[Learning Service] Training on batch of ${trades.length} trades`);
  
  const updates: RLUpdate[] = [];
  
  trades.forEach(trade => {
    const update = trainOnClosedTrade(trade);
    updates.push(update);
  });
  
  console.log(`[Learning Service] Batch training complete - ${updates.length} updates`);
  
  return updates;
}

/**
 * Get learning output
 */
export function getLearningOutput(): LearningOutput {
  const core = getReinforcementCore();
  
  return {
    lastUpdate: state.lastUpdate,
    summary: core.getLearningSummary(),
    statistics: core.getStatistics(),
    memoryStats: StateMemory.getStats(),
    memoryHealth: StateMemory.getHealth(),
    recentUpdates: core.getRecentUpdates(10),
    weightChanges: LearningRules.export(),
  };
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Trigger training-related listeners
 */
function triggerTrainingListeners(update: RLUpdate): void {
  // Training complete
  if (state.listeners.onTrainingComplete) {
    state.listeners.onTrainingComplete(update);
  }
  
  // Weights updated
  if (state.listeners.onWeightsUpdated) {
    state.listeners.onWeightsUpdated(update.updatedWeights);
  }
  
  // Learning improvement/degradation
  const netLearning = update.reward - update.penalty;
  
  if (netLearning > 0 && state.listeners.onLearningImprovement) {
    state.listeners.onLearningImprovement(netLearning);
  } else if (netLearning < 0 && state.listeners.onLearningDegradation) {
    state.listeners.onLearningDegradation(Math.abs(netLearning));
  }
}

/**
 * Register training complete listener
 */
export function onTrainingComplete(callback: (update: RLUpdate) => void): void {
  state.listeners.onTrainingComplete = callback;
  console.log('[Learning Service] Registered onTrainingComplete listener');
}

/**
 * Register reward applied listener
 */
export function onRewardApplied(callback: (reward: number) => void): void {
  state.listeners.onRewardApplied = callback;
  console.log('[Learning Service] Registered onRewardApplied listener');
}

/**
 * Register penalty applied listener
 */
export function onPenaltyApplied(callback: (penalty: number) => void): void {
  state.listeners.onPenaltyApplied = callback;
  console.log('[Learning Service] Registered onPenaltyApplied listener');
}

/**
 * Register regime shift listener
 */
export function onRegimeShift(callback: (oldRegime: string, newRegime: string) => void): void {
  state.listeners.onRegimeShift = callback;
  console.log('[Learning Service] Registered onRegimeShift listener');
}

/**
 * Register weights updated listener
 */
export function onWeightsUpdated(callback: (weights: any) => void): void {
  state.listeners.onWeightsUpdated = callback;
  console.log('[Learning Service] Registered onWeightsUpdated listener');
}

/**
 * Register learning improvement listener
 */
export function onLearningImprovement(callback: (improvement: number) => void): void {
  state.listeners.onLearningImprovement = callback;
  console.log('[Learning Service] Registered onLearningImprovement listener');
}

/**
 * Register learning degradation listener
 */
export function onLearningDegradation(callback: (degradation: number) => void): void {
  state.listeners.onLearningDegradation = callback;
  console.log('[Learning Service] Registered onLearningDegradation listener');
}

/**
 * Clear all listeners
 */
export function clearListeners(): void {
  state.listeners = {};
  console.log('[Learning Service] All listeners cleared');
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Set current regime
 */
export function setCurrentRegime(regime: string): void {
  LearningRules.setCurrentRegime(regime);
  console.log(`[Learning Service] Regime set to: ${regime}`);
}

/**
 * Detect regime from market data
 */
export function detectRegimeFromMarket(marketData: {
  volatility: number;
  trendStrength: number;
  liquidity: number;
}): string {
  const regime = LearningRules.detectRegime(marketData);
  LearningRules.setCurrentRegime(regime);
  
  console.log(`[Learning Service] Detected regime: ${regime}`);
  
  return regime;
}

/**
 * Adjust for shield state
 */
export function adjustForShield(shieldActive: boolean): void {
  LearningRules.adjustForShield(shieldActive);
  console.log(`[Learning Service] Adjusted for shield: ${shieldActive}`);
}

/**
 * Adjust for threat level
 */
export function adjustForThreatLevel(threatLevel: number): void {
  LearningRules.adjustForThreatLevel(threatLevel);
  console.log(`[Learning Service] Adjusted for threat level: ${threatLevel}`);
}

/**
 * Adjust for volatility
 */
export function adjustForVolatility(volatilityLevel: number): void {
  LearningRules.adjustForVolatility(volatilityLevel);
  console.log(`[Learning Service] Adjusted for volatility: ${volatilityLevel}`);
}

/**
 * Update engine states (convenience method)
 */
export function updateEngineStates(states: {
  shieldActive?: boolean;
  threatLevel?: number;
  volatilityLevel?: number;
  regime?: string;
}): void {
  if (states.shieldActive !== undefined) {
    adjustForShield(states.shieldActive);
  }
  
  if (states.threatLevel !== undefined) {
    adjustForThreatLevel(states.threatLevel);
  }
  
  if (states.volatilityLevel !== undefined) {
    adjustForVolatility(states.volatilityLevel);
  }
  
  if (states.regime !== undefined) {
    setCurrentRegime(states.regime);
  }
}

// ============================================================================
// Weight Management
// ============================================================================

/**
 * Mutate weights for exploration
 */
export function mutateWeights(): void {
  console.log('[Learning Service] Mutating weights for exploration');
  LearningRules.mutateWeights();
}

/**
 * Reset weights to defaults
 */
export function resetWeights(): void {
  console.log('[Learning Service] Resetting weights to defaults');
  LearningRules.resetToDefaults();
}

/**
 * Get current weights
 */
export function getCurrentWeights() {
  return {
    rewardWeights: LearningRules.getRewardWeights(),
    penaltyWeights: LearningRules.getPenaltyWeights(),
    config: LearningRules.getLearningConfig(),
    regime: LearningRules.getCurrentRegime(),
  };
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Store state in memory
 */
export function storeState(
  snapshot: StateSnapshot,
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
): void {
  StateMemory.push(snapshot, priority);
}

/**
 * Get memory statistics
 */
export function getMemoryStats() {
  return StateMemory.getStats();
}

/**
 * Get memory health
 */
export function getMemoryHealth() {
  return StateMemory.getHealth();
}

/**
 * Clear memory
 */
export function clearMemory(): void {
  StateMemory.clear();
  console.log('[Learning Service] Memory cleared');
}

/**
 * Set memory max size
 */
export function setMemorySize(size: number): void {
  StateMemory.setMaxSize(size);
  console.log(`[Learning Service] Memory size set to ${size}`);
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get service state
 */
export function getServiceState() {
  return {
    initialized: state.initialized,
    trainingActive: state.trainingActive,
    lastUpdate: state.lastUpdate,
    totalTrainingSessions: state.totalTrainingSessions,
    listenerCount: Object.keys(state.listeners).length,
  };
}

/**
 * Is training active?
 */
export function isTrainingActive(): boolean {
  return state.trainingActive;
}

/**
 * Get total training sessions
 */
export function getTotalTrainingSessions(): number {
  return state.totalTrainingSessions;
}

/**
 * Reset service
 */
export function resetService(): void {
  state.initialized = false;
  state.trainingActive = false;
  state.lastUpdate = null;
  state.totalTrainingSessions = 0;
  state.listeners = {};
  
  console.log('[Learning Service] Service reset');
}

// ============================================================================
// Mock Helpers (for development/testing)
// ============================================================================

/**
 * Create mock trade result
 */
export function createMockTrade(overrides?: Partial<TradeResult>): TradeResult {
  return {
    symbol: 'BTC/USD',
    action: 'BUY',
    profit: 1000,
    profitPercent: 2.0,
    duration: 3600000,
    maxDrawdown: 0.5,
    riskRewardRatio: 2.5,
    followedShield: true,
    alignedWithFusion: true,
    ignoredOverride: false,
    regimeMatch: true,
    poorEntry: false,
    poorExit: false,
    oversized: false,
    ignoredConflict: false,
    entryState: createMockSnapshot(),
    ...overrides,
  };
}

/**
 * Create mock state snapshot
 */
export function createMockSnapshot(overrides?: Partial<StateSnapshot>): StateSnapshot {
  return {
    price: 50000,
    volatility: 50,
    trend: 60,
    liquidity: 70,
    momentum: 40,
    shieldActive: false,
    threatLevel: 30,
    flowState: 'STABLE',
    volatilityPhase: 'NORMAL',
    fusionAction: 'BUY',
    fusionConfidence: 75,
    fusionQuality: 80,
    hasPosition: false,
    positionSize: 0,
    positionPnL: 0,
    overrideActive: false,
    overrideSeverity: 0,
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Simulate successful trade
 */
export function simulateSuccessfulTrade(): TradeResult {
  return createMockTrade({
    profit: 1500,
    profitPercent: 3.0,
    riskRewardRatio: 3.0,
    followedShield: true,
    alignedWithFusion: true,
    regimeMatch: true,
  });
}

/**
 * Simulate failed trade
 */
export function simulateFailedTrade(): TradeResult {
  return createMockTrade({
    profit: -800,
    profitPercent: -1.6,
    maxDrawdown: 2.0,
    riskRewardRatio: 0.5,
    followedShield: false,
    ignoredOverride: true,
    poorEntry: true,
    poorExit: true,
  });
}

/**
 * Test training on successful trade
 */
export function testSuccessfulTraining(): void {
  console.log('[Learning Service] Testing successful trade training...');
  
  initLearning();
  
  const trade = simulateSuccessfulTrade();
  const update = trainOnClosedTrade(trade);
  
  console.log('Training result:', update);
  console.log('Summary:', getLearningOutput().summary);
}

/**
 * Test training on failed trade
 */
export function testFailedTraining(): void {
  console.log('[Learning Service] Testing failed trade training...');
  
  initLearning();
  
  const trade = simulateFailedTrade();
  const update = trainOnClosedTrade(trade);
  
  console.log('Training result:', update);
  console.log('Summary:', getLearningOutput().summary);
}

/**
 * Test batch training
 */
export function testBatchTraining(): void {
  console.log('[Learning Service] Testing batch training...');
  
  initLearning();
  
  const trades = [
    simulateSuccessfulTrade(),
    simulateSuccessfulTrade(),
    simulateFailedTrade(),
    simulateSuccessfulTrade(),
    simulateFailedTrade(),
  ];
  
  const updates = trainOnBatch(trades);
  
  console.log(`Batch training complete - ${updates.length} updates`);
  console.log('Summary:', getLearningOutput().summary);
}

// Export service
export const LearningService = {
  // Initialization
  init: initLearning,
  isInitialized,
  reset: resetService,
  
  // Core training
  trainOnTrade: trainOnClosedTrade,
  trainOnShift: trainOnMarketShift,
  applyReward,
  applyPenalty,
  trainBatch: trainOnBatch,
  getOutput: getLearningOutput,
  
  // Event listeners
  onTrainingComplete,
  onRewardApplied,
  onPenaltyApplied,
  onRegimeShift,
  onWeightsUpdated,
  onLearningImprovement,
  onLearningDegradation,
  clearListeners,
  
  // State management
  setRegime: setCurrentRegime,
  detectRegime: detectRegimeFromMarket,
  adjustForShield,
  adjustForThreatLevel,
  adjustForVolatility,
  updateEngineStates,
  
  // Weight management
  mutateWeights,
  resetWeights,
  getWeights: getCurrentWeights,
  
  // Memory management
  storeState,
  getMemoryStats,
  getMemoryHealth,
  clearMemory,
  setMemorySize,
  
  // Utilities
  getState: getServiceState,
  isTraining: isTrainingActive,
  getTotalSessions: getTotalTrainingSessions,
  
  // Mock helpers
  createMockTrade,
  createMockSnapshot,
  simulateSuccess: simulateSuccessfulTrade,
  simulateFail: simulateFailedTrade,
  testSuccess: testSuccessfulTraining,
  testFail: testFailedTraining,
  testBatch: testBatchTraining,
};

export default LearningService;
