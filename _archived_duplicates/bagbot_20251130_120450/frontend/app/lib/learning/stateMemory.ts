/**
 * State Memory - Experience Replay Buffer for Reinforcement Learning
 * 
 * Stores historical states for training and pattern recognition.
 * Implements circular buffer with configurable size (500-2000 states).
 */

/**
 * State snapshot for RL
 */
export interface StateSnapshot {
  // Market data
  price: number;
  volatility: number;
  trend: number;
  liquidity: number;
  momentum: number;
  
  // Engine states
  shieldActive: boolean;
  threatLevel: number;
  flowState: string;
  volatilityPhase: string;
  
  // Fusion decision
  fusionAction: string;
  fusionConfidence: number;
  fusionQuality: number;
  
  // Position info
  hasPosition: boolean;
  positionSize: number;
  positionPnL: number;
  
  // Override info
  overrideActive: boolean;
  overrideSeverity: number;
  
  // Timestamp
  timestamp: number;
  
  // Outcome (filled after trade closes)
  outcome?: {
    profit: number;
    profitPercent: number;
    duration: number;
    success: boolean;
  };
}

/**
 * State memory configuration
 */
interface StateMemoryConfig {
  maxSize: number;              // Maximum states to store (500-2000)
  enablePriority: boolean;      // Prioritize important states
  compressionThreshold: number; // Compress after N states
}

/**
 * Priority levels for states
 */
export type StatePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Prioritized state entry
 */
interface PrioritizedState {
  state: StateSnapshot;
  priority: StatePriority;
  importance: number;      // 0-100
  reviewed: boolean;       // Has been used for training
}

// State storage
const stateMemory: PrioritizedState[] = [];

// Configuration
const config: StateMemoryConfig = {
  maxSize: 1000,
  enablePriority: true,
  compressionThreshold: 1500,
};

// Statistics
const stats = {
  totalPushed: 0,
  totalRemoved: 0,
  compressionCount: 0,
};

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Push new state to memory
 */
export function pushState(
  state: StateSnapshot,
  priority: StatePriority = 'MEDIUM'
): void {
  const importance = calculateImportance(state, priority);
  
  const entry: PrioritizedState = {
    state,
    priority,
    importance,
    reviewed: false,
  };
  
  stateMemory.push(entry);
  stats.totalPushed++;
  
  // Maintain size limit
  if (stateMemory.length > config.maxSize) {
    removeLowestPriority();
  }
  
  // Compress if threshold reached
  if (stateMemory.length > config.compressionThreshold) {
    compressMemory();
  }
}

/**
 * Push multiple states
 */
export function pushStates(states: StateSnapshot[], priority: StatePriority = 'MEDIUM'): void {
  states.forEach(state => pushState(state, priority));
}

/**
 * Get recent states
 */
export function getRecentStates(count: number = 10): StateSnapshot[] {
  return stateMemory
    .slice(-count)
    .map(entry => entry.state);
}

/**
 * Get all states
 */
export function getAllStates(): StateSnapshot[] {
  return stateMemory.map(entry => entry.state);
}

/**
 * Get states by priority
 */
export function getStatesByPriority(priority: StatePriority): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.priority === priority)
    .map(entry => entry.state);
}

/**
 * Get high importance states
 */
export function getHighImportanceStates(minImportance: number = 70): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.importance >= minImportance)
    .map(entry => entry.state);
}

/**
 * Get unreviewed states (for training)
 */
export function getUnreviewedStates(): StateSnapshot[] {
  return stateMemory
    .filter(entry => !entry.reviewed)
    .map(entry => entry.state);
}

/**
 * Mark state as reviewed
 */
export function markAsReviewed(timestamp: number): void {
  const entry = stateMemory.find(e => e.state.timestamp === timestamp);
  if (entry) {
    entry.reviewed = true;
  }
}

/**
 * Mark multiple states as reviewed
 */
export function markMultipleAsReviewed(timestamps: number[]): void {
  timestamps.forEach(timestamp => markAsReviewed(timestamp));
}

// ============================================================================
// Filtering & Querying
// ============================================================================

/**
 * Get states with outcomes (completed trades)
 */
export function getStatesWithOutcomes(): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.outcome !== undefined)
    .map(entry => entry.state);
}

/**
 * Get successful trade states
 */
export function getSuccessfulStates(): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.outcome?.success === true)
    .map(entry => entry.state);
}

/**
 * Get failed trade states
 */
export function getFailedStates(): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.outcome?.success === false)
    .map(entry => entry.state);
}

/**
 * Get states by time range
 */
export function getStatesByTimeRange(startTime: number, endTime: number): StateSnapshot[] {
  return stateMemory
    .filter(entry => 
      entry.state.timestamp >= startTime && 
      entry.state.timestamp <= endTime
    )
    .map(entry => entry.state);
}

/**
 * Get states by regime
 */
export function getStatesByRegime(flowState: string): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.flowState === flowState)
    .map(entry => entry.state);
}

/**
 * Get states where shield was active
 */
export function getShieldActiveStates(): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.shieldActive)
    .map(entry => entry.state);
}

/**
 * Get states with high threat
 */
export function getHighThreatStates(minThreat: number = 70): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.threatLevel >= minThreat)
    .map(entry => entry.state);
}

/**
 * Get states with overrides
 */
export function getOverrideStates(): StateSnapshot[] {
  return stateMemory
    .filter(entry => entry.state.overrideActive)
    .map(entry => entry.state);
}

// ============================================================================
// Sampling
// ============================================================================

/**
 * Sample random states (for training)
 */
export function sampleRandomStates(count: number): StateSnapshot[] {
  const shuffled = [...stateMemory].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(entry => entry.state);
}

/**
 * Sample prioritized states (weighted by importance)
 */
export function samplePrioritizedStates(count: number): StateSnapshot[] {
  // Calculate cumulative weights
  const weights = stateMemory.map(entry => entry.importance);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  const sampled: StateSnapshot[] = [];
  
  for (let i = 0; i < count && i < stateMemory.length; i++) {
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < stateMemory.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        sampled.push(stateMemory[j].state);
        break;
      }
    }
  }
  
  return sampled;
}

/**
 * Sample balanced states (equal successful/failed)
 */
export function sampleBalancedStates(count: number): StateSnapshot[] {
  const successful = getSuccessfulStates();
  const failed = getFailedStates();
  
  const halfCount = Math.floor(count / 2);
  const successSample = successful.slice(0, halfCount);
  const failSample = failed.slice(0, halfCount);
  
  return [...successSample, ...failSample].sort(() => Math.random() - 0.5);
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Calculate importance of a state
 */
function calculateImportance(state: StateSnapshot, priority: StatePriority): number {
  let importance = 50; // Base importance
  
  // Priority boost
  const priorityBoosts = {
    LOW: 0,
    MEDIUM: 20,
    HIGH: 40,
    CRITICAL: 60,
  };
  importance += priorityBoosts[priority];
  
  // Outcome boost
  if (state.outcome) {
    importance += 20;
    
    // Large profit/loss
    if (Math.abs(state.outcome.profitPercent) > 5) {
      importance += 10;
    }
  }
  
  // Shield active
  if (state.shieldActive) {
    importance += 10;
  }
  
  // High threat
  if (state.threatLevel > 70) {
    importance += 10;
  }
  
  // Override active
  if (state.overrideActive && state.overrideSeverity > 70) {
    importance += 15;
  }
  
  // High confidence fusion decision
  if (state.fusionConfidence > 80) {
    importance += 10;
  }
  
  return Math.min(100, importance);
}

/**
 * Remove lowest priority state
 */
function removeLowestPriority(): void {
  if (stateMemory.length === 0) return;
  
  // Find lowest importance unreviewed state
  let lowestIndex = -1;
  let lowestImportance = Infinity;
  
  for (let i = 0; i < stateMemory.length; i++) {
    if (!stateMemory[i].reviewed && stateMemory[i].importance < lowestImportance) {
      lowestIndex = i;
      lowestImportance = stateMemory[i].importance;
    }
  }
  
  // If no unreviewed, remove oldest reviewed
  if (lowestIndex === -1) {
    lowestIndex = 0;
  }
  
  stateMemory.splice(lowestIndex, 1);
  stats.totalRemoved++;
}

/**
 * Compress memory (remove low-importance states)
 */
function compressMemory(): void {
  const targetSize = config.maxSize;
  const importanceThreshold = 30;
  
  // Remove low-importance states
  const filtered = stateMemory.filter(entry => entry.importance >= importanceThreshold);
  
  // If still too large, keep highest importance
  if (filtered.length > targetSize) {
    filtered.sort((a, b) => b.importance - a.importance);
    stateMemory.length = 0;
    stateMemory.push(...filtered.slice(0, targetSize));
  } else {
    stateMemory.length = 0;
    stateMemory.push(...filtered);
  }
  
  stats.compressionCount++;
  console.log(`[State Memory] Compressed to ${stateMemory.length} states`);
}

/**
 * Clear memory
 */
export function clearMemory(): void {
  stateMemory.length = 0;
  stats.totalPushed = 0;
  stats.totalRemoved = 0;
  stats.compressionCount = 0;
  console.log('[State Memory] Cleared all states');
}

/**
 * Get memory size
 */
export function getMemorySize(): number {
  return stateMemory.length;
}

/**
 * Get memory capacity
 */
export function getMemoryCapacity(): number {
  return config.maxSize;
}

/**
 * Set max size
 */
export function setMaxSize(size: number): void {
  config.maxSize = Math.max(500, Math.min(2000, size));
  
  // Compress if needed
  if (stateMemory.length > config.maxSize) {
    compressMemory();
  }
  
  console.log(`[State Memory] Max size set to ${config.maxSize}`);
}

// ============================================================================
// Statistics & Analysis
// ============================================================================

/**
 * Get memory statistics
 */
export function getMemoryStats() {
  const withOutcomes = getStatesWithOutcomes().length;
  const successful = getSuccessfulStates().length;
  const failed = getFailedStates().length;
  const unreviewed = getUnreviewedStates().length;
  
  const avgImportance = stateMemory.length > 0
    ? stateMemory.reduce((sum, e) => sum + e.importance, 0) / stateMemory.length
    : 0;
  
  const priorityDistribution = {
    LOW: stateMemory.filter(e => e.priority === 'LOW').length,
    MEDIUM: stateMemory.filter(e => e.priority === 'MEDIUM').length,
    HIGH: stateMemory.filter(e => e.priority === 'HIGH').length,
    CRITICAL: stateMemory.filter(e => e.priority === 'CRITICAL').length,
  };
  
  return {
    totalStates: stateMemory.length,
    maxSize: config.maxSize,
    utilizationPercent: (stateMemory.length / config.maxSize) * 100,
    withOutcomes,
    successful,
    failed,
    unreviewed,
    averageImportance: avgImportance,
    priorityDistribution,
    totalPushed: stats.totalPushed,
    totalRemoved: stats.totalRemoved,
    compressionCount: stats.compressionCount,
  };
}

/**
 * Get memory health
 */
export function getMemoryHealth(): {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  issues: string[];
  recommendations: string[];
} {
  const stats = getMemoryStats();
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  
  // Check utilization
  if (stats.utilizationPercent > 95) {
    status = 'CRITICAL';
    issues.push('Memory nearly full');
    recommendations.push('Increase max size or compress more aggressively');
  } else if (stats.utilizationPercent > 80) {
    status = 'WARNING';
    issues.push('Memory utilization high');
    recommendations.push('Consider increasing max size');
  }
  
  // Check outcome ratio
  const outcomeRatio = stats.totalStates > 0 
    ? (stats.withOutcomes / stats.totalStates) * 100
    : 0;
  
  if (outcomeRatio < 20) {
    if (status === 'HEALTHY') status = 'WARNING';
    issues.push('Low outcome ratio - many incomplete states');
    recommendations.push('Ensure trade outcomes are being recorded');
  }
  
  // Check unreviewed states
  const unreviewedPercent = stats.totalStates > 0
    ? (stats.unreviewed / stats.totalStates) * 100
    : 0;
  
  if (unreviewedPercent > 70) {
    if (status === 'HEALTHY') status = 'WARNING';
    issues.push('Many unreviewed states - training may be falling behind');
    recommendations.push('Increase training frequency');
  }
  
  // Check success/fail balance
  if (stats.withOutcomes > 0) {
    const successRate = (stats.successful / stats.withOutcomes) * 100;
    
    if (successRate > 90 || successRate < 10) {
      if (status === 'HEALTHY') status = 'WARNING';
      issues.push('Imbalanced success/fail ratio');
      recommendations.push('Ensure both successful and failed trades are being recorded');
    }
  }
  
  return {
    status,
    issues,
    recommendations,
  };
}

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export memory
 */
export function exportMemory() {
  return {
    states: stateMemory,
    config,
    stats,
  };
}

/**
 * Import memory
 */
export function importMemory(data: any): void {
  if (data.states && Array.isArray(data.states)) {
    stateMemory.length = 0;
    stateMemory.push(...data.states);
  }
  
  if (data.config) {
    Object.assign(config, data.config);
  }
  
  if (data.stats) {
    Object.assign(stats, data.stats);
  }
  
  console.log('[State Memory] Imported memory');
}

// Export memory manager
export const StateMemory = {
  // Core operations
  push: pushState,
  pushMultiple: pushStates,
  getRecent: getRecentStates,
  getAll: getAllStates,
  clear: clearMemory,
  
  // Filtering
  getByPriority: getStatesByPriority,
  getHighImportance: getHighImportanceStates,
  getUnreviewed: getUnreviewedStates,
  getWithOutcomes: getStatesWithOutcomes,
  getSuccessful: getSuccessfulStates,
  getFailed: getFailedStates,
  getByTimeRange: getStatesByTimeRange,
  getByRegime: getStatesByRegime,
  getShieldActive: getShieldActiveStates,
  getHighThreat: getHighThreatStates,
  getOverride: getOverrideStates,
  
  // Sampling
  sampleRandom: sampleRandomStates,
  samplePrioritized: samplePrioritizedStates,
  sampleBalanced: sampleBalancedStates,
  
  // Review management
  markReviewed: markAsReviewed,
  markMultipleReviewed: markMultipleAsReviewed,
  
  // Memory management
  getSize: getMemorySize,
  getCapacity: getMemoryCapacity,
  setMaxSize,
  
  // Statistics
  getStats: getMemoryStats,
  getHealth: getMemoryHealth,
  
  // Export/Import
  export: exportMemory,
  import: importMemory,
};

export default StateMemory;
