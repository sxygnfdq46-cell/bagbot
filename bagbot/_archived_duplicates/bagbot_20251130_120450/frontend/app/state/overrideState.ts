/**
 * Override State - Global State Management for Execution Override
 * 
 * Maintains history of override decisions, tracks patterns, and provides analytics.
 */

import {
  OverrideResult,
  OverrideSummary,
  TradeModification,
} from '@/app/lib/execution/ExecutionOverride';

/**
 * Override state structure
 */
interface OverrideStateData {
  overrides: OverrideResult[];
  maxSize: number;
  startTime: number;
}

/**
 * Override pattern
 */
interface OverridePattern {
  reason: string;
  frequency: number;
  averageSeverity: number;
  lastOccurrence: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
}

/**
 * Override statistics
 */
interface OverrideStats {
  totalOverrides: number;
  allowedCount: number;
  blockedCount: number;
  modifiedCount: number;
  criticalCount: number;
  averageSeverity: number;
  overrideRate: number;
  blockRate: number;
  modificationRate: number;
  topReasons: Array<{ reason: string; count: number; severity: number }>;
  recentTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
  timeDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
}

/**
 * Override trend analysis
 */
interface OverrideTrend {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  strength: number;        // 0-100
  projection: number;      // Projected next value
  confidence: number;      // 0-100
}

// Global state
const state: OverrideStateData = {
  overrides: [],
  maxSize: 100,
  startTime: Date.now(),
};

// ============================================================================
// Core State Management
// ============================================================================

/**
 * Add override result to state
 */
export function addOverrideResult(result: OverrideResult): void {
  state.overrides.push(result);
  
  // Maintain size limit
  if (state.overrides.length > state.maxSize) {
    state.overrides.shift();
  }
  
  console.log(`[Override State] Added override (total: ${state.overrides.length})`);
}

/**
 * Get all overrides
 */
export function getAllOverrides(): OverrideResult[] {
  return [...state.overrides];
}

/**
 * Get recent overrides
 */
export function getRecentOverrides(count: number = 10): OverrideResult[] {
  return state.overrides.slice(-count);
}

/**
 * Get overrides by action
 */
export function getOverridesByAction(action: 'ALLOW' | 'BLOCK' | 'MODIFY'): OverrideResult[] {
  return state.overrides.filter(o => o.action === action);
}

/**
 * Get overrides by severity
 */
export function getOverridesBySeverity(minSeverity: number): OverrideResult[] {
  return state.overrides.filter(o => o.severity >= minSeverity);
}

/**
 * Get overrides by context
 */
export function getOverridesByContext(context: string): OverrideResult[] {
  return state.overrides.filter(o => o.context === context);
}

/**
 * Get overrides by time range
 */
export function getOverridesByTimeRange(startTime: number, endTime: number): OverrideResult[] {
  return state.overrides.filter(o => o.timestamp >= startTime && o.timestamp <= endTime);
}

/**
 * Clear all overrides
 */
export function clearOverrides(): void {
  state.overrides = [];
  console.log('[Override State] Cleared all overrides');
}

/**
 * Set max size
 */
export function setMaxSize(size: number): void {
  state.maxSize = Math.max(10, size);
  
  // Trim if needed
  while (state.overrides.length > state.maxSize) {
    state.overrides.shift();
  }
  
  console.log(`[Override State] Max size set to ${state.maxSize}`);
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get override statistics
 */
export function getOverrideStats(): OverrideStats {
  const total = state.overrides.length;
  
  if (total === 0) {
    return {
      totalOverrides: 0,
      allowedCount: 0,
      blockedCount: 0,
      modifiedCount: 0,
      criticalCount: 0,
      averageSeverity: 0,
      overrideRate: 0,
      blockRate: 0,
      modificationRate: 0,
      topReasons: [],
      recentTrend: 'STABLE',
      timeDistribution: {},
      severityDistribution: {},
    };
  }
  
  // Count by action
  const allowed = state.overrides.filter(o => o.action === 'ALLOW').length;
  const blocked = state.overrides.filter(o => o.action === 'BLOCK').length;
  const modified = state.overrides.filter(o => o.action === 'MODIFY').length;
  const critical = state.overrides.filter(o => o.severity >= 80).length;
  
  // Average severity
  const avgSeverity = state.overrides.reduce((sum, o) => sum + o.severity, 0) / total;
  
  // Rates
  const overrides = state.overrides.filter(o => o.override).length;
  const overrideRate = (overrides / total) * 100;
  const blockRate = (blocked / total) * 100;
  const modificationRate = (modified / total) * 100;
  
  // Top reasons
  const reasonCounts = new Map<string, { count: number; totalSeverity: number }>();
  state.overrides.forEach(o => {
    const current = reasonCounts.get(o.reason) || { count: 0, totalSeverity: 0 };
    reasonCounts.set(o.reason, {
      count: current.count + 1,
      totalSeverity: current.totalSeverity + o.severity,
    });
  });
  
  const topReasons = Array.from(reasonCounts.entries())
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      severity: data.totalSeverity / data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Recent trend
  const recentTrend = getOverrideTrend();
  
  // Time distribution (by hour)
  const timeDistribution: Record<string, number> = {};
  state.overrides.forEach(o => {
    const hour = new Date(o.timestamp).getHours();
    timeDistribution[`${hour}:00`] = (timeDistribution[`${hour}:00`] || 0) + 1;
  });
  
  // Severity distribution
  const severityDistribution: Record<string, number> = {
    'LOW (0-39)': state.overrides.filter(o => o.severity < 40).length,
    'MEDIUM (40-59)': state.overrides.filter(o => o.severity >= 40 && o.severity < 60).length,
    'HIGH (60-79)': state.overrides.filter(o => o.severity >= 60 && o.severity < 80).length,
    'CRITICAL (80+)': state.overrides.filter(o => o.severity >= 80).length,
  };
  
  return {
    totalOverrides: total,
    allowedCount: allowed,
    blockedCount: blocked,
    modifiedCount: modified,
    criticalCount: critical,
    averageSeverity: avgSeverity,
    overrideRate,
    blockRate,
    modificationRate,
    topReasons,
    recentTrend: recentTrend.direction,
    timeDistribution,
    severityDistribution,
  };
}

/**
 * Get override trend
 */
export function getOverrideTrend(): OverrideTrend {
  const recentCount = Math.min(20, state.overrides.length);
  
  if (recentCount < 5) {
    return {
      direction: 'STABLE',
      strength: 0,
      projection: 0,
      confidence: 0,
    };
  }
  
  const recent = state.overrides.slice(-recentCount);
  const firstHalf = recent.slice(0, Math.floor(recentCount / 2));
  const secondHalf = recent.slice(Math.floor(recentCount / 2));
  
  // Calculate override rate for each half
  const firstRate = firstHalf.filter(o => o.override).length / firstHalf.length;
  const secondRate = secondHalf.filter(o => o.override).length / secondHalf.length;
  
  const change = secondRate - firstRate;
  const changePercent = Math.abs(change) * 100;
  
  let direction: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
  if (changePercent > 10) {
    direction = change > 0 ? 'INCREASING' : 'DECREASING';
  }
  
  return {
    direction,
    strength: Math.min(100, changePercent * 2),
    projection: secondRate + change,
    confidence: Math.min(100, (recentCount / 20) * 100),
  };
}

/**
 * Get severity trend
 */
export function getSeverityTrend(): OverrideTrend {
  const recentCount = Math.min(20, state.overrides.length);
  
  if (recentCount < 5) {
    return {
      direction: 'STABLE',
      strength: 0,
      projection: 0,
      confidence: 0,
    };
  }
  
  const recent = state.overrides.slice(-recentCount);
  const firstHalf = recent.slice(0, Math.floor(recentCount / 2));
  const secondHalf = recent.slice(Math.floor(recentCount / 2));
  
  const firstAvg = firstHalf.reduce((sum, o) => sum + o.severity, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, o) => sum + o.severity, 0) / secondHalf.length;
  
  const change = secondAvg - firstAvg;
  const changePercent = Math.abs(change);
  
  let direction: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
  if (changePercent > 5) {
    direction = change > 0 ? 'INCREASING' : 'DECREASING';
  }
  
  return {
    direction,
    strength: Math.min(100, changePercent * 2),
    projection: secondAvg + change,
    confidence: Math.min(100, (recentCount / 20) * 100),
  };
}

// ============================================================================
// Pattern Detection
// ============================================================================

/**
 * Get override patterns
 */
export function getOverridePatterns(): OverridePattern[] {
  const patterns = new Map<string, {
    count: number;
    totalSeverity: number;
    timestamps: number[];
  }>();
  
  // Collect data
  state.overrides.forEach(o => {
    const current = patterns.get(o.reason) || {
      count: 0,
      totalSeverity: 0,
      timestamps: [],
    };
    
    patterns.set(o.reason, {
      count: current.count + 1,
      totalSeverity: current.totalSeverity + o.severity,
      timestamps: [...current.timestamps, o.timestamp],
    });
  });
  
  // Convert to pattern objects
  const result: OverridePattern[] = [];
  
  patterns.forEach((data, reason) => {
    // Calculate frequency (per hour)
    const timeSpan = (Date.now() - state.startTime) / (1000 * 60 * 60);
    const frequency = data.count / Math.max(1, timeSpan);
    
    // Calculate trend
    const halfPoint = Math.floor(data.timestamps.length / 2);
    const firstHalf = data.timestamps.slice(0, halfPoint);
    const secondHalf = data.timestamps.slice(halfPoint);
    
    let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstRate = firstHalf.length / (firstHalf[firstHalf.length - 1] - firstHalf[0]);
      const secondRate = secondHalf.length / (secondHalf[secondHalf.length - 1] - secondHalf[0]);
      
      if (secondRate > firstRate * 1.2) trend = 'INCREASING';
      else if (secondRate < firstRate * 0.8) trend = 'DECREASING';
    }
    
    result.push({
      reason,
      frequency,
      averageSeverity: data.totalSeverity / data.count,
      lastOccurrence: data.timestamps[data.timestamps.length - 1],
      trend,
    });
  });
  
  return result.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get critical patterns
 */
export function getCriticalPatterns(): OverridePattern[] {
  return getOverridePatterns().filter(p => p.averageSeverity >= 80);
}

/**
 * Get increasing patterns
 */
export function getIncreasingPatterns(): OverridePattern[] {
  return getOverridePatterns().filter(p => p.trend === 'INCREASING');
}

// ============================================================================
// Performance Analysis
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
  const stats = getOverrideStats();
  const patterns = getOverridePatterns();
  
  let score = 100;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  
  // Low override rate is good
  if (stats.overrideRate < 20) {
    strengths.push('Low override rate - most trades proceed normally');
  } else if (stats.overrideRate > 50) {
    weaknesses.push('High override rate - system blocking many trades');
    recommendations.push('Review rule thresholds - may be too strict');
    score -= 20;
  }
  
  // Low block rate is good (if override rate is reasonable)
  if (stats.blockRate < 10) {
    strengths.push('Low block rate - good balance of protection');
  } else if (stats.blockRate > 30) {
    weaknesses.push('High block rate - may be missing opportunities');
    recommendations.push('Consider loosening critical rules');
    score -= 15;
  }
  
  // Modification rate shows adaptive behavior
  if (stats.modificationRate > stats.blockRate && stats.modificationRate > 20) {
    strengths.push('High modification rate - system adapting trades well');
  } else if (stats.modificationRate < 5 && stats.overrideRate > 20) {
    weaknesses.push('Low modification rate - system may be too binary');
    recommendations.push('Enable trade modifications for better flexibility');
    score -= 10;
  }
  
  // Average severity
  if (stats.averageSeverity < 40) {
    strengths.push('Low average severity - minor issues only');
  } else if (stats.averageSeverity > 70) {
    weaknesses.push('High average severity - frequent critical issues');
    recommendations.push('Investigate root causes of critical overrides');
    score -= 15;
  }
  
  // Critical count
  if (stats.criticalCount === 0) {
    strengths.push('No critical overrides - safe trading environment');
  } else if (stats.criticalCount > stats.totalOverrides * 0.3) {
    weaknesses.push('High critical override rate - dangerous conditions frequent');
    recommendations.push('Review market conditions and adjust strategy');
    score -= 20;
  }
  
  // Trends
  const overrideTrend = getOverrideTrend();
  if (overrideTrend.direction === 'DECREASING') {
    strengths.push('Override trend decreasing - conditions improving');
  } else if (overrideTrend.direction === 'INCREASING') {
    weaknesses.push('Override trend increasing - conditions deteriorating');
    recommendations.push('Monitor market conditions closely');
    score -= 10;
  }
  
  const severityTrend = getSeverityTrend();
  if (severityTrend.direction === 'DECREASING') {
    strengths.push('Severity trend decreasing - issues less critical');
  } else if (severityTrend.direction === 'INCREASING') {
    weaknesses.push('Severity trend increasing - issues more critical');
    recommendations.push('Consider tightening rules or reducing position sizes');
    score -= 10;
  }
  
  // Patterns
  const criticalPatterns = getCriticalPatterns();
  if (criticalPatterns.length > 0) {
    weaknesses.push(`${criticalPatterns.length} critical patterns detected`);
    recommendations.push(`Address recurring issues: ${criticalPatterns[0].reason}`);
    score -= 5 * criticalPatterns.length;
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

/**
 * Get override effectiveness
 */
export function getOverrideEffectiveness(): {
  protectionRate: number;
  adaptationRate: number;
  falsePositiveRate: number;
  overallEffectiveness: number;
} {
  const stats = getOverrideStats();
  
  // Protection rate: ratio of critical overrides that were blocked
  const criticalBlocked = state.overrides.filter(
    o => o.severity >= 80 && o.action === 'BLOCK'
  ).length;
  const protectionRate = stats.criticalCount > 0 
    ? (criticalBlocked / stats.criticalCount) * 100
    : 100;
  
  // Adaptation rate: ratio of overrides that were modified (not blocked)
  const adaptationRate = stats.totalOverrides > 0
    ? (stats.modifiedCount / stats.totalOverrides) * 100
    : 0;
  
  // False positive rate (estimated): low severity overrides that blocked
  const lowSeverityBlocked = state.overrides.filter(
    o => o.severity < 60 && o.action === 'BLOCK'
  ).length;
  const falsePositiveRate = stats.totalOverrides > 0
    ? (lowSeverityBlocked / stats.totalOverrides) * 100
    : 0;
  
  // Overall effectiveness
  const overallEffectiveness = (
    protectionRate * 0.5 +
    adaptationRate * 0.3 +
    (100 - falsePositiveRate) * 0.2
  );
  
  return {
    protectionRate,
    adaptationRate,
    falsePositiveRate,
    overallEffectiveness,
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
    overrides: state.overrides,
    maxSize: state.maxSize,
    startTime: state.startTime,
    stats: getOverrideStats(),
    patterns: getOverridePatterns(),
    performance: getPerformanceSummary(),
    effectiveness: getOverrideEffectiveness(),
    trends: {
      override: getOverrideTrend(),
      severity: getSeverityTrend(),
    },
  };
}

/**
 * Import state
 */
export function importState(data: any): void {
  if (data.overrides && Array.isArray(data.overrides)) {
    state.overrides = data.overrides;
  }
  
  if (data.maxSize) {
    state.maxSize = data.maxSize;
  }
  
  if (data.startTime) {
    state.startTime = data.startTime;
  }
  
  console.log('[Override State] State imported');
}

/**
 * Reset state
 */
export function resetState(): void {
  state.overrides = [];
  state.maxSize = 100;
  state.startTime = Date.now();
  console.log('[Override State] State reset');
}

// Export state manager
export const OverrideState = {
  // Core
  add: addOverrideResult,
  getAll: getAllOverrides,
  getRecent: getRecentOverrides,
  getByAction: getOverridesByAction,
  getBySeverity: getOverridesBySeverity,
  getByContext: getOverridesByContext,
  getByTimeRange: getOverridesByTimeRange,
  clear: clearOverrides,
  setMaxSize,
  
  // Statistics
  getStats: getOverrideStats,
  getOverrideTrend,
  getSeverityTrend,
  
  // Patterns
  getPatterns: getOverridePatterns,
  getCriticalPatterns,
  getIncreasingPatterns,
  
  // Performance
  getPerformance: getPerformanceSummary,
  getEffectiveness: getOverrideEffectiveness,
  
  // Export/Import
  export: exportState,
  import: importState,
  reset: resetState,
};

export default OverrideState;
