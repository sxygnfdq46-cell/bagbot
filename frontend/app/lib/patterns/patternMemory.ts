/**
 * Pattern Memory - Circular Buffer for Pattern Storage
 * 
 * Stores historical pattern detections for analysis and learning.
 * Implements circular buffer with configurable size (1500-4000 patterns).
 */

import { PatternType, PatternSignificance } from './patternRules';

/**
 * Pattern detection record
 */
export interface PatternRecord {
  // Pattern info
  id: string;
  type: PatternType;
  significance: PatternSignificance;
  confidence: number;
  weight: number;
  
  // Context
  symbol: string;
  timeframe: string;
  price: number;
  timestamp: number;
  
  // Technical data
  volatility: number;
  momentum: number;
  volume: number;
  
  // Pattern-specific data
  supportLevel?: number;
  resistanceLevel?: number;
  target?: number;
  stopLoss?: number;
  
  // Source engines
  sources: string[];         // Which engines detected this pattern
  confluence: number;        // Number of confirming signals
  
  // Outcome (filled after resolution)
  outcome?: {
    success: boolean;
    profitPercent: number;
    duration: number;
    hitTarget: boolean;
    hitStop: boolean;
  };
  
  // Metadata
  regime: string;
  shieldActive: boolean;
  threatLevel: number;
}

/**
 * Pattern memory configuration
 */
interface PatternMemoryConfig {
  maxSize: number;              // Maximum patterns to store (1500-4000)
  enablePriority: boolean;      // Prioritize important patterns
  compressionThreshold: number; // Compress after N patterns
}

/**
 * Priority levels for patterns
 */
export type PatternPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Prioritized pattern entry
 */
interface PrioritizedPattern {
  pattern: PatternRecord;
  priority: PatternPriority;
  importance: number;      // 0-100
  analyzed: boolean;       // Has been analyzed
}

// Pattern storage
const patternMemory: PrioritizedPattern[] = [];

// Configuration
const config: PatternMemoryConfig = {
  maxSize: 2500,
  enablePriority: true,
  compressionThreshold: 3000,
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
 * Push new pattern to memory
 */
export function pushPattern(
  pattern: PatternRecord,
  priority: PatternPriority = 'MEDIUM'
): void {
  const importance = calculateImportance(pattern, priority);
  
  const entry: PrioritizedPattern = {
    pattern,
    priority,
    importance,
    analyzed: false,
  };
  
  patternMemory.push(entry);
  stats.totalPushed++;
  
  // Maintain size limit
  if (patternMemory.length > config.maxSize) {
    removeLowestPriority();
  }
  
  // Compress if threshold reached
  if (patternMemory.length > config.compressionThreshold) {
    compressMemory();
  }
}

/**
 * Push multiple patterns
 */
export function pushPatterns(patterns: PatternRecord[], priority: PatternPriority = 'MEDIUM'): void {
  patterns.forEach(pattern => pushPattern(pattern, priority));
}

/**
 * Get recent patterns
 */
export function getRecentPatterns(count: number = 20): PatternRecord[] {
  return patternMemory
    .slice(-count)
    .map(entry => entry.pattern);
}

/**
 * Get all patterns
 */
export function getAllPatterns(): PatternRecord[] {
  return patternMemory.map(entry => entry.pattern);
}

/**
 * Get patterns by type
 */
export function getPatternsByType(type: PatternType): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.type === type)
    .map(entry => entry.pattern);
}

/**
 * Get patterns by significance
 */
export function getPatternsBySignificance(significance: PatternSignificance): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.significance === significance)
    .map(entry => entry.pattern);
}

/**
 * Get patterns by priority
 */
export function getPatternsByPriority(priority: PatternPriority): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.priority === priority)
    .map(entry => entry.pattern);
}

/**
 * Get high importance patterns
 */
export function getHighImportancePatterns(minImportance: number = 70): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.importance >= minImportance)
    .map(entry => entry.pattern);
}

/**
 * Get unanalyzed patterns
 */
export function getUnanalyzedPatterns(): PatternRecord[] {
  return patternMemory
    .filter(entry => !entry.analyzed)
    .map(entry => entry.pattern);
}

/**
 * Mark pattern as analyzed
 */
export function markAsAnalyzed(patternId: string): void {
  const entry = patternMemory.find(e => e.pattern.id === patternId);
  if (entry) {
    entry.analyzed = true;
  }
}

/**
 * Mark multiple patterns as analyzed
 */
export function markMultipleAsAnalyzed(patternIds: string[]): void {
  patternIds.forEach(id => markAsAnalyzed(id));
}

// ============================================================================
// Filtering & Querying
// ============================================================================

/**
 * Get patterns with outcomes
 */
export function getPatternsWithOutcomes(): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.outcome !== undefined)
    .map(entry => entry.pattern);
}

/**
 * Get successful patterns
 */
export function getSuccessfulPatterns(): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.outcome?.success === true)
    .map(entry => entry.pattern);
}

/**
 * Get failed patterns
 */
export function getFailedPatterns(): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.outcome?.success === false)
    .map(entry => entry.pattern);
}

/**
 * Get patterns by time range
 */
export function getPatternsByTimeRange(startTime: number, endTime: number): PatternRecord[] {
  return patternMemory
    .filter(entry => 
      entry.pattern.timestamp >= startTime && 
      entry.pattern.timestamp <= endTime
    )
    .map(entry => entry.pattern);
}

/**
 * Get patterns by symbol
 */
export function getPatternsBySymbol(symbol: string): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.symbol === symbol)
    .map(entry => entry.pattern);
}

/**
 * Get patterns by timeframe
 */
export function getPatternsByTimeframe(timeframe: string): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.timeframe === timeframe)
    .map(entry => entry.pattern);
}

/**
 * Get patterns by regime
 */
export function getPatternsByRegime(regime: string): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.regime === regime)
    .map(entry => entry.pattern);
}

/**
 * Get patterns with high confluence
 */
export function getHighConfluencePatterns(minConfluence: number = 3): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.confluence >= minConfluence)
    .map(entry => entry.pattern);
}

/**
 * Get patterns by source engine
 */
export function getPatternsBySource(source: string): PatternRecord[] {
  return patternMemory
    .filter(entry => entry.pattern.sources.includes(source))
    .map(entry => entry.pattern);
}

// ============================================================================
// Sampling
// ============================================================================

/**
 * Sample random patterns
 */
export function sampleRandomPatterns(count: number): PatternRecord[] {
  const shuffled = [...patternMemory].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(entry => entry.pattern);
}

/**
 * Sample prioritized patterns (weighted by importance)
 */
export function samplePrioritizedPatterns(count: number): PatternRecord[] {
  const weights = patternMemory.map(entry => entry.importance);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  const sampled: PatternRecord[] = [];
  
  for (let i = 0; i < count && i < patternMemory.length; i++) {
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < patternMemory.length; j++) {
      random -= weights[j];
      if (random <= 0) {
        sampled.push(patternMemory[j].pattern);
        break;
      }
    }
  }
  
  return sampled;
}

/**
 * Sample balanced patterns (equal successful/failed)
 */
export function sampleBalancedPatterns(count: number): PatternRecord[] {
  const successful = getSuccessfulPatterns();
  const failed = getFailedPatterns();
  
  const halfCount = Math.floor(count / 2);
  const successSample = successful.slice(0, halfCount);
  const failSample = failed.slice(0, halfCount);
  
  return [...successSample, ...failSample].sort(() => Math.random() - 0.5);
}

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Calculate importance of a pattern
 */
function calculateImportance(pattern: PatternRecord, priority: PatternPriority): number {
  let importance = 50; // Base importance
  
  // Priority boost
  const priorityBoosts = {
    LOW: 0,
    MEDIUM: 20,
    HIGH: 40,
    CRITICAL: 60,
  };
  importance += priorityBoosts[priority];
  
  // Significance boost
  const significanceBoosts = {
    MINOR: 0,
    MODERATE: 10,
    MAJOR: 20,
    CRITICAL: 30,
  };
  importance += significanceBoosts[pattern.significance];
  
  // Confidence boost
  if (pattern.confidence > 80) {
    importance += 15;
  } else if (pattern.confidence > 60) {
    importance += 5;
  }
  
  // Confluence boost
  if (pattern.confluence > 3) {
    importance += 10;
  }
  
  // Outcome boost
  if (pattern.outcome) {
    importance += 15;
    
    // Large profit/loss
    if (Math.abs(pattern.outcome.profitPercent) > 5) {
      importance += 10;
    }
  }
  
  // High threat environment
  if (pattern.threatLevel > 70) {
    importance += 10;
  }
  
  return Math.min(100, importance);
}

/**
 * Remove lowest priority pattern
 */
function removeLowestPriority(): void {
  if (patternMemory.length === 0) return;
  
  // Find lowest importance unanalyzed pattern
  let lowestIndex = -1;
  let lowestImportance = Infinity;
  
  for (let i = 0; i < patternMemory.length; i++) {
    if (!patternMemory[i].analyzed && patternMemory[i].importance < lowestImportance) {
      lowestIndex = i;
      lowestImportance = patternMemory[i].importance;
    }
  }
  
  // If no unanalyzed, remove oldest analyzed
  if (lowestIndex === -1) {
    lowestIndex = 0;
  }
  
  patternMemory.splice(lowestIndex, 1);
  stats.totalRemoved++;
}

/**
 * Compress memory
 */
function compressMemory(): void {
  const targetSize = config.maxSize;
  const importanceThreshold = 30;
  
  // Remove low-importance patterns
  const filtered = patternMemory.filter(entry => entry.importance >= importanceThreshold);
  
  // If still too large, keep highest importance
  if (filtered.length > targetSize) {
    filtered.sort((a, b) => b.importance - a.importance);
    patternMemory.length = 0;
    patternMemory.push(...filtered.slice(0, targetSize));
  } else {
    patternMemory.length = 0;
    patternMemory.push(...filtered);
  }
  
  stats.compressionCount++;
  console.log(`[Pattern Memory] Compressed to ${patternMemory.length} patterns`);
}

/**
 * Clear memory
 */
export function clearMemory(): void {
  patternMemory.length = 0;
  stats.totalPushed = 0;
  stats.totalRemoved = 0;
  stats.compressionCount = 0;
  console.log('[Pattern Memory] Cleared all patterns');
}

/**
 * Get memory size
 */
export function getMemorySize(): number {
  return patternMemory.length;
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
  config.maxSize = Math.max(1500, Math.min(4000, size));
  
  // Compress if needed
  if (patternMemory.length > config.maxSize) {
    compressMemory();
  }
  
  console.log(`[Pattern Memory] Max size set to ${config.maxSize}`);
}

// ============================================================================
// Statistics & Analysis
// ============================================================================

/**
 * Get memory statistics
 */
export function getMemoryStats() {
  const withOutcomes = getPatternsWithOutcomes().length;
  const successful = getSuccessfulPatterns().length;
  const failed = getFailedPatterns().length;
  const unanalyzed = getUnanalyzedPatterns().length;
  
  const avgImportance = patternMemory.length > 0
    ? patternMemory.reduce((sum, e) => sum + e.importance, 0) / patternMemory.length
    : 0;
  
  const avgConfidence = patternMemory.length > 0
    ? patternMemory.reduce((sum, e) => sum + e.pattern.confidence, 0) / patternMemory.length
    : 0;
  
  const typeDistribution: Record<string, number> = {};
  patternMemory.forEach(e => {
    typeDistribution[e.pattern.type] = (typeDistribution[e.pattern.type] || 0) + 1;
  });
  
  const significanceDistribution = {
    MINOR: patternMemory.filter(e => e.pattern.significance === 'MINOR').length,
    MODERATE: patternMemory.filter(e => e.pattern.significance === 'MODERATE').length,
    MAJOR: patternMemory.filter(e => e.pattern.significance === 'MAJOR').length,
    CRITICAL: patternMemory.filter(e => e.pattern.significance === 'CRITICAL').length,
  };
  
  return {
    totalPatterns: patternMemory.length,
    maxSize: config.maxSize,
    utilizationPercent: (patternMemory.length / config.maxSize) * 100,
    withOutcomes,
    successful,
    failed,
    unanalyzed,
    averageImportance: avgImportance,
    averageConfidence: avgConfidence,
    typeDistribution,
    significanceDistribution,
    totalPushed: stats.totalPushed,
    totalRemoved: stats.totalRemoved,
    compressionCount: stats.compressionCount,
  };
}

/**
 * Get pattern success rate by type
 */
export function getSuccessRateByType(): Record<string, number> {
  const rates: Record<string, number> = {};
  
  Object.values(PatternType).forEach(type => {
    const patterns = getPatternsByType(type).filter(p => p.outcome);
    if (patterns.length > 0) {
      const successful = patterns.filter(p => p.outcome?.success).length;
      rates[type] = (successful / patterns.length) * 100;
    }
  });
  
  return rates;
}

/**
 * Get average profit by pattern type
 */
export function getAvgProfitByType(): Record<string, number> {
  const profits: Record<string, number> = {};
  
  Object.values(PatternType).forEach(type => {
    const patterns = getPatternsByType(type).filter(p => p.outcome);
    if (patterns.length > 0) {
      const avgProfit = patterns.reduce((sum, p) => sum + (p.outcome?.profitPercent || 0), 0) / patterns.length;
      profits[type] = avgProfit;
    }
  });
  
  return profits;
}

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export memory
 */
export function exportMemory() {
  return {
    patterns: patternMemory,
    config,
    stats,
  };
}

/**
 * Import memory
 */
export function importMemory(data: any): void {
  if (data.patterns && Array.isArray(data.patterns)) {
    patternMemory.length = 0;
    patternMemory.push(...data.patterns);
  }
  
  if (data.config) {
    Object.assign(config, data.config);
  }
  
  if (data.stats) {
    Object.assign(stats, data.stats);
  }
  
  console.log('[Pattern Memory] Imported memory');
}

// Export memory manager
export const PatternMemory = {
  // Core operations
  push: pushPattern,
  pushMultiple: pushPatterns,
  getRecent: getRecentPatterns,
  getAll: getAllPatterns,
  clear: clearMemory,
  
  // Filtering
  getByType: getPatternsByType,
  getBySignificance: getPatternsBySignificance,
  getByPriority: getPatternsByPriority,
  getHighImportance: getHighImportancePatterns,
  getUnanalyzed: getUnanalyzedPatterns,
  getWithOutcomes: getPatternsWithOutcomes,
  getSuccessful: getSuccessfulPatterns,
  getFailed: getFailedPatterns,
  getByTimeRange: getPatternsByTimeRange,
  getBySymbol: getPatternsBySymbol,
  getByTimeframe: getPatternsByTimeframe,
  getByRegime: getPatternsByRegime,
  getHighConfluence: getHighConfluencePatterns,
  getBySource: getPatternsBySource,
  
  // Sampling
  sampleRandom: sampleRandomPatterns,
  samplePrioritized: samplePrioritizedPatterns,
  sampleBalanced: sampleBalancedPatterns,
  
  // Analysis management
  markAnalyzed: markAsAnalyzed,
  markMultipleAnalyzed: markMultipleAsAnalyzed,
  
  // Memory management
  getSize: getMemorySize,
  getCapacity: getMemoryCapacity,
  setMaxSize,
  
  // Statistics
  getStats: getMemoryStats,
  getSuccessRate: getSuccessRateByType,
  getAvgProfit: getAvgProfitByType,
  
  // Export/Import
  export: exportMemory,
  import: importMemory,
};

export default PatternMemory;
