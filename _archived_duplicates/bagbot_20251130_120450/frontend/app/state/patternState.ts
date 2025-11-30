/**
 * Pattern State - Persistent State Management for Pattern Sync Engine
 * 
 * Stores master pattern map, heatmap data, risk/opportunity zones, and analytics.
 * Provides global state access for React components.
 */

import { MasterPattern, HeatmapData, RiskZone, OpportunityZone } from '@/app/lib/patterns/PatternSyncEngine';
import { PatternType, PatternSignificance } from '@/app/lib/patterns/patternRules';

/**
 * Pattern analysis result
 */
interface PatternAnalysis {
  pattern: MasterPattern;
  action: 'ENTER' | 'EXIT' | 'HOLD' | 'AVOID';
  confidence: number;
  reasoning: string[];
  warnings: string[];
  opportunities: string[];
}

/**
 * Volatility map entry
 */
interface VolatilityMapEntry {
  symbol: string;
  timeframe: string;
  priceLevel: number;
  volatility: number;
  timestamp: number;
}

/**
 * Drift signal
 */
interface DriftSignal {
  symbol: string;
  timeframe: string;
  driftValue: number;      // -100 to 100
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;        // 0-100
  timestamp: number;
}

/**
 * Structural break indicator
 */
interface StructuralBreak {
  symbol: string;
  timeframe: string;
  probability: number;     // 0-100
  breakType: 'SUPPORT' | 'RESISTANCE' | 'TREND' | 'REGIME';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
}

// ============================================================================
// State Storage
// ============================================================================

// Pattern analyses (circular buffer, max 200)
const patternAnalyses: PatternAnalysis[] = [];
const MAX_ANALYSES = 200;

// Heatmap data by symbol/timeframe
const heatmapData: Map<string, HeatmapData[]> = new Map();

// Risk and opportunity zones
let currentRiskZones: RiskZone[] = [];
let currentOpportunityZones: OpportunityZone[] = [];

// Volatility map
const volatilityMap: Map<string, VolatilityMapEntry[]> = new Map();

// Drift signals
const driftSignals: Map<string, DriftSignal> = new Map();

// Structural breaks
const structuralBreaks: StructuralBreak[] = [];
const MAX_BREAKS = 100;

// Heat index tracking
interface HeatIndexRecord {
  symbol: string;
  timeframe: string;
  heatIndex: number;
  timestamp: number;
}
const heatIndexHistory: HeatIndexRecord[] = [];
const MAX_HEAT_HISTORY = 500;

// Analytics
const analytics = {
  totalPatternsSynced: 0,
  totalCriticalPatterns: 0,
  totalRiskZones: 0,
  totalOpportunityZones: 0,
  avgPatternConfidence: 0,
  avgRiskScore: 0,
  avgOpportunityScore: 0,
  lastSyncTime: 0,
};

// ============================================================================
// Pattern Analyses
// ============================================================================

/**
 * Add pattern analysis
 */
export function addPatternAnalysis(analysis: PatternAnalysis): void {
  patternAnalyses.push(analysis);
  
  // Maintain buffer size
  if (patternAnalyses.length > MAX_ANALYSES) {
    patternAnalyses.shift();
  }
  
  // Update analytics
  analytics.totalPatternsSynced++;
  if (analysis.pattern.significance === 'CRITICAL') {
    analytics.totalCriticalPatterns++;
  }
  analytics.lastSyncTime = Date.now();
  
  // Recalculate averages
  recalculateAverages();
}

/**
 * Get recent pattern analyses
 */
export function getRecentAnalyses(count: number = 20): PatternAnalysis[] {
  return patternAnalyses.slice(-count);
}

/**
 * Get all pattern analyses
 */
export function getAllAnalyses(): PatternAnalysis[] {
  return [...patternAnalyses];
}

/**
 * Get analyses by action
 */
export function getAnalysesByAction(action: 'ENTER' | 'EXIT' | 'HOLD' | 'AVOID'): PatternAnalysis[] {
  return patternAnalyses.filter(a => a.action === action);
}

/**
 * Get analyses by pattern type
 */
export function getAnalysesByType(type: PatternType): PatternAnalysis[] {
  return patternAnalyses.filter(a => a.pattern.type === type);
}

/**
 * Get high confidence analyses
 */
export function getHighConfidenceAnalyses(minConfidence: number = 70): PatternAnalysis[] {
  return patternAnalyses.filter(a => a.confidence >= minConfidence);
}

/**
 * Get critical pattern analyses
 */
export function getCriticalAnalyses(): PatternAnalysis[] {
  return patternAnalyses.filter(a => a.pattern.significance === 'CRITICAL');
}

// ============================================================================
// Heatmap Data
// ============================================================================

/**
 * Update heatmap data for symbol/timeframe
 */
export function updateHeatmapData(
  symbol: string,
  timeframe: string,
  data: HeatmapData[]
): void {
  const key = `${symbol}_${timeframe}`;
  heatmapData.set(key, data);
  
  // Update heat index history
  const avgHeatIndex = data.length > 0
    ? data.reduce((sum, d) => sum + d.heatIndex, 0) / data.length
    : 0;
  
  addHeatIndexRecord(symbol, timeframe, avgHeatIndex);
}

/**
 * Get heatmap data
 */
export function getHeatmapData(symbol: string, timeframe: string): HeatmapData[] | undefined {
  const key = `${symbol}_${timeframe}`;
  return heatmapData.get(key);
}

/**
 * Get all heatmaps
 */
export function getAllHeatmaps(): Map<string, HeatmapData[]> {
  return new Map(heatmapData);
}

/**
 * Clear heatmap data
 */
export function clearHeatmapData(): void {
  heatmapData.clear();
}

// ============================================================================
// Risk & Opportunity Zones
// ============================================================================

/**
 * Update risk zones
 */
export function updateRiskZones(zones: RiskZone[]): void {
  currentRiskZones = zones;
  analytics.totalRiskZones = zones.length;
}

/**
 * Update opportunity zones
 */
export function updateOpportunityZones(zones: OpportunityZone[]): void {
  currentOpportunityZones = zones;
  analytics.totalOpportunityZones = zones.length;
}

/**
 * Get risk zones
 */
export function getRiskZones(): RiskZone[] {
  return [...currentRiskZones];
}

/**
 * Get opportunity zones
 */
export function getOpportunityZones(): OpportunityZone[] {
  return [...currentOpportunityZones];
}

/**
 * Get risk zones by level
 */
export function getRiskZonesByLevel(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): RiskZone[] {
  return currentRiskZones.filter(z => z.riskLevel === level);
}

/**
 * Get opportunity zones by level
 */
export function getOpportunityZonesByLevel(level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT'): OpportunityZone[] {
  return currentOpportunityZones.filter(z => z.opportunityLevel === level);
}

/**
 * Get critical risk zones
 */
export function getCriticalRiskZones(): RiskZone[] {
  return currentRiskZones.filter(z => z.riskLevel === 'CRITICAL' || z.riskLevel === 'HIGH');
}

/**
 * Get excellent opportunity zones
 */
export function getExcellentOpportunityZones(): OpportunityZone[] {
  return currentOpportunityZones.filter(z => z.opportunityLevel === 'EXCELLENT' || z.opportunityLevel === 'HIGH');
}

// ============================================================================
// Volatility Map
// ============================================================================

/**
 * Add volatility map entry
 */
export function addVolatilityEntry(entry: VolatilityMapEntry): void {
  const key = `${entry.symbol}_${entry.timeframe}`;
  
  if (!volatilityMap.has(key)) {
    volatilityMap.set(key, []);
  }
  
  const entries = volatilityMap.get(key)!;
  entries.push(entry);
  
  // Keep last 100 entries per symbol/timeframe
  if (entries.length > 100) {
    entries.shift();
  }
}

/**
 * Get volatility map
 */
export function getVolatilityMap(symbol: string, timeframe: string): VolatilityMapEntry[] | undefined {
  const key = `${symbol}_${timeframe}`;
  return volatilityMap.get(key);
}

/**
 * Get current volatility
 */
export function getCurrentVolatility(symbol: string, timeframe: string): number | undefined {
  const entries = getVolatilityMap(symbol, timeframe);
  if (!entries || entries.length === 0) return undefined;
  
  return entries[entries.length - 1].volatility;
}

/**
 * Get average volatility
 */
export function getAverageVolatility(symbol: string, timeframe: string): number | undefined {
  const entries = getVolatilityMap(symbol, timeframe);
  if (!entries || entries.length === 0) return undefined;
  
  const sum = entries.reduce((acc, e) => acc + e.volatility, 0);
  return sum / entries.length;
}

// ============================================================================
// Drift Signals
// ============================================================================

/**
 * Add or update drift signal
 */
export function updateDriftSignal(signal: DriftSignal): void {
  const key = `${signal.symbol}_${signal.timeframe}`;
  driftSignals.set(key, signal);
}

/**
 * Get drift signal
 */
export function getDriftSignal(symbol: string, timeframe: string): DriftSignal | undefined {
  const key = `${symbol}_${timeframe}`;
  return driftSignals.get(key);
}

/**
 * Get all drift signals
 */
export function getAllDriftSignals(): DriftSignal[] {
  return Array.from(driftSignals.values());
}

/**
 * Get strong drift signals
 */
export function getStrongDriftSignals(minStrength: number = 60): DriftSignal[] {
  return Array.from(driftSignals.values()).filter(s => s.strength >= minStrength);
}

/**
 * Clear drift signals
 */
export function clearDriftSignals(): void {
  driftSignals.clear();
}

// ============================================================================
// Structural Breaks
// ============================================================================

/**
 * Add structural break
 */
export function addStructuralBreak(breakInfo: StructuralBreak): void {
  structuralBreaks.push(breakInfo);
  
  // Maintain buffer size
  if (structuralBreaks.length > MAX_BREAKS) {
    structuralBreaks.shift();
  }
}

/**
 * Get recent structural breaks
 */
export function getRecentStructuralBreaks(count: number = 10): StructuralBreak[] {
  return structuralBreaks.slice(-count);
}

/**
 * Get structural breaks by symbol
 */
export function getStructuralBreaksBySymbol(symbol: string): StructuralBreak[] {
  return structuralBreaks.filter(b => b.symbol === symbol);
}

/**
 * Get high probability breaks
 */
export function getHighProbabilityBreaks(minProbability: number = 70): StructuralBreak[] {
  return structuralBreaks.filter(b => b.probability >= minProbability);
}

/**
 * Get critical structural breaks
 */
export function getCriticalStructuralBreaks(): StructuralBreak[] {
  return structuralBreaks.filter(b => b.severity === 'CRITICAL' || b.severity === 'HIGH');
}

/**
 * Clear structural breaks
 */
export function clearStructuralBreaks(): void {
  structuralBreaks.length = 0;
}

// ============================================================================
// Heat Index Tracking
// ============================================================================

/**
 * Add heat index record
 */
function addHeatIndexRecord(symbol: string, timeframe: string, heatIndex: number): void {
  heatIndexHistory.push({
    symbol,
    timeframe,
    heatIndex,
    timestamp: Date.now(),
  });
  
  // Maintain buffer size
  if (heatIndexHistory.length > MAX_HEAT_HISTORY) {
    heatIndexHistory.shift();
  }
}

/**
 * Get heat index history
 */
export function getHeatIndexHistory(symbol: string, timeframe: string): HeatIndexRecord[] {
  return heatIndexHistory.filter(
    h => h.symbol === symbol && h.timeframe === timeframe
  );
}

/**
 * Get current heat index
 */
export function getCurrentHeatIndex(symbol: string, timeframe: string): number | undefined {
  const history = getHeatIndexHistory(symbol, timeframe);
  if (history.length === 0) return undefined;
  
  return history[history.length - 1].heatIndex;
}

/**
 * Get average heat index
 */
export function getAverageHeatIndex(symbol: string, timeframe: string): number | undefined {
  const history = getHeatIndexHistory(symbol, timeframe);
  if (history.length === 0) return undefined;
  
  const sum = history.reduce((acc, h) => acc + h.heatIndex, 0);
  return sum / history.length;
}

/**
 * Get heat index trend
 */
export function getHeatIndexTrend(symbol: string, timeframe: string): 'INCREASING' | 'DECREASING' | 'STABLE' {
  const history = getHeatIndexHistory(symbol, timeframe);
  if (history.length < 10) return 'STABLE';
  
  const recent = history.slice(-10);
  const firstHalf = recent.slice(0, 5);
  const secondHalf = recent.slice(5);
  
  const avgFirst = firstHalf.reduce((sum, h) => sum + h.heatIndex, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, h) => sum + h.heatIndex, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  if (change > 5) return 'INCREASING';
  if (change < -5) return 'DECREASING';
  return 'STABLE';
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * Recalculate average metrics
 */
function recalculateAverages(): void {
  if (patternAnalyses.length === 0) {
    analytics.avgPatternConfidence = 0;
    analytics.avgRiskScore = 0;
    analytics.avgOpportunityScore = 0;
    return;
  }
  
  const sumConfidence = patternAnalyses.reduce((sum, a) => sum + a.confidence, 0);
  const sumRisk = patternAnalyses.reduce((sum, a) => sum + a.pattern.riskScore, 0);
  const sumOpportunity = patternAnalyses.reduce((sum, a) => sum + a.pattern.opportunityScore, 0);
  
  analytics.avgPatternConfidence = sumConfidence / patternAnalyses.length;
  analytics.avgRiskScore = sumRisk / patternAnalyses.length;
  analytics.avgOpportunityScore = sumOpportunity / patternAnalyses.length;
}

/**
 * Get analytics
 */
export function getAnalytics() {
  return { ...analytics };
}

/**
 * Get pattern statistics
 */
export function getPatternStatistics() {
  const total = patternAnalyses.length;
  
  if (total === 0) {
    return {
      totalPatterns: 0,
      actionDistribution: { ENTER: 0, EXIT: 0, HOLD: 0, AVOID: 0 },
      significanceDistribution: { MINOR: 0, MODERATE: 0, MAJOR: 0, CRITICAL: 0 },
      avgConfidence: 0,
      avgRiskScore: 0,
      avgOpportunityScore: 0,
      highConfidenceRate: 0,
      criticalRate: 0,
    };
  }
  
  const actionDistribution = {
    ENTER: patternAnalyses.filter(a => a.action === 'ENTER').length,
    EXIT: patternAnalyses.filter(a => a.action === 'EXIT').length,
    HOLD: patternAnalyses.filter(a => a.action === 'HOLD').length,
    AVOID: patternAnalyses.filter(a => a.action === 'AVOID').length,
  };
  
  const significanceDistribution = {
    MINOR: patternAnalyses.filter(a => a.pattern.significance === 'MINOR').length,
    MODERATE: patternAnalyses.filter(a => a.pattern.significance === 'MODERATE').length,
    MAJOR: patternAnalyses.filter(a => a.pattern.significance === 'MAJOR').length,
    CRITICAL: patternAnalyses.filter(a => a.pattern.significance === 'CRITICAL').length,
  };
  
  const highConfidence = patternAnalyses.filter(a => a.confidence >= 70).length;
  const critical = patternAnalyses.filter(a => a.pattern.significance === 'CRITICAL').length;
  
  return {
    totalPatterns: total,
    actionDistribution,
    significanceDistribution,
    avgConfidence: analytics.avgPatternConfidence,
    avgRiskScore: analytics.avgRiskScore,
    avgOpportunityScore: analytics.avgOpportunityScore,
    highConfidenceRate: (highConfidence / total) * 100,
    criticalRate: (critical / total) * 100,
  };
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  const stats = getPatternStatistics();
  
  let score = 50; // Base score
  
  // Adjust for confidence
  if (stats.avgConfidence > 70) score += 15;
  else if (stats.avgConfidence > 60) score += 10;
  else if (stats.avgConfidence < 40) score -= 15;
  
  // Adjust for risk/opportunity balance
  const balance = stats.avgOpportunityScore - stats.avgRiskScore;
  if (balance > 20) score += 10;
  else if (balance < -20) score -= 10;
  
  // Adjust for high confidence rate
  if (stats.highConfidenceRate > 60) score += 10;
  else if (stats.highConfidenceRate < 30) score -= 10;
  
  // Adjust for critical patterns
  if (stats.criticalRate > 15) score += 5;
  
  score = Math.max(0, Math.min(100, score));
  
  const grade = score >= 90 ? 'A' :
                score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                score >= 60 ? 'D' : 'F';
  
  return {
    score,
    grade,
    totalPatterns: stats.totalPatterns,
    avgConfidence: stats.avgConfidence,
    avgRiskScore: stats.avgRiskScore,
    avgOpportunityScore: stats.avgOpportunityScore,
    highConfidenceRate: stats.highConfidenceRate,
    criticalRate: stats.criticalRate,
    riskZones: analytics.totalRiskZones,
    opportunityZones: analytics.totalOpportunityZones,
  };
}

// ============================================================================
// Export/Import State
// ============================================================================

/**
 * Export state
 */
export function exportState() {
  return {
    patternAnalyses,
    heatmapData: Array.from(heatmapData.entries()),
    riskZones: currentRiskZones,
    opportunityZones: currentOpportunityZones,
    volatilityMap: Array.from(volatilityMap.entries()),
    driftSignals: Array.from(driftSignals.entries()),
    structuralBreaks,
    heatIndexHistory,
    analytics,
    exportTime: Date.now(),
  };
}

/**
 * Import state
 */
export function importState(data: any): void {
  try {
    if (data.patternAnalyses && Array.isArray(data.patternAnalyses)) {
      patternAnalyses.length = 0;
      patternAnalyses.push(...data.patternAnalyses);
    }
    
    if (data.heatmapData && Array.isArray(data.heatmapData)) {
      heatmapData.clear();
      data.heatmapData.forEach(([key, value]: [string, HeatmapData[]]) => {
        heatmapData.set(key, value);
      });
    }
    
    if (data.riskZones && Array.isArray(data.riskZones)) {
      currentRiskZones = data.riskZones;
    }
    
    if (data.opportunityZones && Array.isArray(data.opportunityZones)) {
      currentOpportunityZones = data.opportunityZones;
    }
    
    if (data.volatilityMap && Array.isArray(data.volatilityMap)) {
      volatilityMap.clear();
      data.volatilityMap.forEach(([key, value]: [string, VolatilityMapEntry[]]) => {
        volatilityMap.set(key, value);
      });
    }
    
    if (data.driftSignals && Array.isArray(data.driftSignals)) {
      driftSignals.clear();
      data.driftSignals.forEach(([key, value]: [string, DriftSignal]) => {
        driftSignals.set(key, value);
      });
    }
    
    if (data.structuralBreaks && Array.isArray(data.structuralBreaks)) {
      structuralBreaks.length = 0;
      structuralBreaks.push(...data.structuralBreaks);
    }
    
    if (data.heatIndexHistory && Array.isArray(data.heatIndexHistory)) {
      heatIndexHistory.length = 0;
      heatIndexHistory.push(...data.heatIndexHistory);
    }
    
    if (data.analytics) {
      Object.assign(analytics, data.analytics);
    }
    
    console.log('[Pattern State] State imported successfully');
  } catch (error) {
    console.error('[Pattern State] Import error:', error);
  }
}

/**
 * Clear all state
 */
export function clearAllState(): void {
  patternAnalyses.length = 0;
  heatmapData.clear();
  currentRiskZones = [];
  currentOpportunityZones = [];
  volatilityMap.clear();
  driftSignals.clear();
  structuralBreaks.length = 0;
  heatIndexHistory.length = 0;
  
  analytics.totalPatternsSynced = 0;
  analytics.totalCriticalPatterns = 0;
  analytics.totalRiskZones = 0;
  analytics.totalOpportunityZones = 0;
  analytics.avgPatternConfidence = 0;
  analytics.avgRiskScore = 0;
  analytics.avgOpportunityScore = 0;
  analytics.lastSyncTime = 0;
  
  console.log('[Pattern State] All state cleared');
}

// Export state manager
export const PatternState = {
  // Pattern analyses
  addPatternAnalysis,
  getRecentAnalyses,
  getAllAnalyses,
  getAnalysesByAction,
  getAnalysesByType,
  getHighConfidenceAnalyses,
  getCriticalAnalyses,
  
  // Heatmap
  updateHeatmapData,
  getHeatmapData,
  getAllHeatmaps,
  clearHeatmapData,
  
  // Zones
  updateRiskZones,
  updateOpportunityZones,
  getRiskZones,
  getOpportunityZones,
  getRiskZonesByLevel,
  getOpportunityZonesByLevel,
  getCriticalRiskZones,
  getExcellentOpportunityZones,
  
  // Volatility
  addVolatilityEntry,
  getVolatilityMap,
  getCurrentVolatility,
  getAverageVolatility,
  
  // Drift
  updateDriftSignal,
  getDriftSignal,
  getAllDriftSignals,
  getStrongDriftSignals,
  clearDriftSignals,
  
  // Structural breaks
  addStructuralBreak,
  getRecentStructuralBreaks,
  getStructuralBreaksBySymbol,
  getHighProbabilityBreaks,
  getCriticalStructuralBreaks,
  clearStructuralBreaks,
  
  // Heat index
  getHeatIndexHistory,
  getCurrentHeatIndex,
  getAverageHeatIndex,
  getHeatIndexTrend,
  
  // Analytics
  getAnalytics,
  getPatternStatistics,
  getPerformanceSummary,
  
  // State management
  exportState,
  importState,
  clearAllState,
};

export default PatternState;
