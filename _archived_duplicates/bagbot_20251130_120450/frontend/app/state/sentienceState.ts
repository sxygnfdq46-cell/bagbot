/**
 * Sentience State - Persistent State for Market Sentience Layer
 * 
 * Stores sentience scores, pressure maps, liquidity stress, emotional state,
 * and market perception data for global access.
 */

import { SentienceAnalysis, PressureZone } from '@/app/lib/sentience/SentienceEngine';

/**
 * Pressure map entry
 */
interface PressureMapEntry {
  symbol: string;
  timeframe: string;
  zones: PressureZone[];
  timestamp: number;
}

/**
 * Liquidity stress entry
 */
interface LiquidityStressEntry {
  symbol: string;
  timeframe: string;
  stressLevel: number;      // 0-100
  gradient: number;
  critical: boolean;
  timestamp: number;
}

/**
 * Emotional state record
 */
interface EmotionalStateRecord {
  emotionalBias: number;    // -100 to 100
  extreme: boolean;
  reversal: boolean;
  timestamp: number;
}

/**
 * Volatility pulse record
 */
interface VolatilityPulseRecord {
  symbol: string;
  timeframe: string;
  pulseLevel: number;       // 0-100 (entropy)
  timestamp: number;
}

/**
 * Trend uncertainty record
 */
interface TrendUncertaintyRecord {
  symbol: string;
  timeframe: string;
  uncertaintyLevel: number; // 0-100
  timestamp: number;
}

/**
 * Sentience snapshot
 */
interface SentienceSnapshot {
  score: number;
  emotionalBias: number;
  tension: number;
  liquidityStress: number;
  volatilityPulse: number;
  coherence: number;
  fragility: number;
  timestamp: number;
}

// ============================================================================
// State Storage
// ============================================================================

// Sentience analyses history (circular buffer, max 200)
const sentienceAnalyses: SentienceAnalysis[] = [];
const MAX_ANALYSES = 200;

// Current sentience scores by symbol/timeframe
const currentSentienceScores: Map<string, number> = new Map();

// Pressure maps
const pressureMaps: Map<string, PressureMapEntry> = new Map();

// Liquidity stress maps
const liquidityStressMaps: Map<string, LiquidityStressEntry> = new Map();

// Emotional state history
const emotionalStateHistory: EmotionalStateRecord[] = [];
const MAX_EMOTIONAL_HISTORY = 500;

// Current emotional bias
let currentEmotionalBias: number = 0;

// Volatility pulse tracking
const volatilityPulses: Map<string, VolatilityPulseRecord> = new Map();

// Trend uncertainty tracking
const trendUncertainties: Map<string, TrendUncertaintyRecord> = new Map();

// Sentience snapshots for trending
const sentienceSnapshots: SentienceSnapshot[] = [];
const MAX_SNAPSHOTS = 300;

// Analytics
const analytics = {
  totalAnalyses: 0,
  avgSentienceScore: 50,
  avgEmotionalBias: 0,
  avgTension: 50,
  avgLiquidityStress: 50,
  criticalPressureZones: 0,
  emotionalExtremes: 0,
  surgePredictions: 0,
  lastUpdateTime: 0,
};

// ============================================================================
// Sentience Analyses
// ============================================================================

/**
 * Add sentience analysis
 */
export function addSentienceAnalysis(analysis: SentienceAnalysis): void {
  sentienceAnalyses.push(analysis);
  
  // Maintain buffer size
  if (sentienceAnalyses.length > MAX_ANALYSES) {
    sentienceAnalyses.shift();
  }
  
  // Update analytics
  analytics.totalAnalyses++;
  if (analysis.emotionalExtreme) {
    analytics.emotionalExtremes++;
  }
  if (analysis.surgeProbability > 70) {
    analytics.surgePredictions++;
  }
  analytics.criticalPressureZones = analysis.pressureZones.filter(
    z => z.pressureLevel === 'CRITICAL'
  ).length;
  analytics.lastUpdateTime = analysis.timestamp;
  
  // Create snapshot
  const snapshot: SentienceSnapshot = {
    score: analysis.sentienceScore,
    emotionalBias: analysis.emotionalBias,
    tension: analysis.tension,
    liquidityStress: analysis.liquidityStress,
    volatilityPulse: analysis.volatilityPulse,
    coherence: analysis.coherence,
    fragility: analysis.fragility,
    timestamp: analysis.timestamp,
  };
  
  sentienceSnapshots.push(snapshot);
  if (sentienceSnapshots.length > MAX_SNAPSHOTS) {
    sentienceSnapshots.shift();
  }
  
  // Recalculate averages
  recalculateAverages();
}

/**
 * Get recent sentience analyses
 */
export function getRecentAnalyses(count: number = 20): SentienceAnalysis[] {
  return sentienceAnalyses.slice(-count);
}

/**
 * Get all sentience analyses
 */
export function getAllAnalyses(): SentienceAnalysis[] {
  return [...sentienceAnalyses];
}

/**
 * Get analyses by regime
 */
export function getAnalysesByRegime(regime: string): SentienceAnalysis[] {
  return sentienceAnalyses.filter(a => a.regime === regime);
}

/**
 * Get high sentience analyses
 */
export function getHighSentienceAnalyses(minScore: number = 70): SentienceAnalysis[] {
  return sentienceAnalyses.filter(a => a.sentienceScore >= minScore);
}

/**
 * Get critical analyses (high stress or surge probability)
 */
export function getCriticalAnalyses(): SentienceAnalysis[] {
  return sentienceAnalyses.filter(a => 
    a.stressCritical || 
    a.surgeProbability > 70 ||
    a.emotionalExtreme
  );
}

// ============================================================================
// Sentience Scores
// ============================================================================

/**
 * Update sentience score for symbol/timeframe
 */
export function updateSentienceScore(
  symbol: string,
  timeframe: string,
  score: number
): void {
  const key = `${symbol}_${timeframe}`;
  currentSentienceScores.set(key, score);
}

/**
 * Get sentience score
 */
export function getSentienceScore(symbol: string, timeframe: string): number | undefined {
  const key = `${symbol}_${timeframe}`;
  return currentSentienceScores.get(key);
}

/**
 * Get all sentience scores
 */
export function getAllSentienceScores(): Map<string, number> {
  return new Map(currentSentienceScores);
}

// ============================================================================
// Pressure Maps
// ============================================================================

/**
 * Update pressure map
 */
export function updatePressureMap(
  symbol: string,
  timeframe: string,
  zones: PressureZone[]
): void {
  const key = `${symbol}_${timeframe}`;
  pressureMaps.set(key, {
    symbol,
    timeframe,
    zones,
    timestamp: Date.now(),
  });
}

/**
 * Get pressure map
 */
export function getPressureMap(symbol: string, timeframe: string): PressureMapEntry | undefined {
  const key = `${symbol}_${timeframe}`;
  return pressureMaps.get(key);
}

/**
 * Get pressure zones
 */
export function getPressureZones(symbol: string, timeframe: string): PressureZone[] {
  const map = getPressureMap(symbol, timeframe);
  return map ? map.zones : [];
}

/**
 * Get critical pressure zones
 */
export function getCriticalPressureZones(symbol: string, timeframe: string): PressureZone[] {
  const zones = getPressureZones(symbol, timeframe);
  return zones.filter(z => z.pressureLevel === 'CRITICAL' || z.pressureLevel === 'HIGH');
}

/**
 * Get all pressure maps
 */
export function getAllPressureMaps(): Map<string, PressureMapEntry> {
  return new Map(pressureMaps);
}

// ============================================================================
// Liquidity Stress
// ============================================================================

/**
 * Update liquidity stress
 */
export function updateLiquidityStress(
  symbol: string,
  timeframe: string,
  stressLevel: number,
  gradient: number,
  critical: boolean
): void {
  const key = `${symbol}_${timeframe}`;
  liquidityStressMaps.set(key, {
    symbol,
    timeframe,
    stressLevel,
    gradient,
    critical,
    timestamp: Date.now(),
  });
}

/**
 * Get liquidity stress
 */
export function getLiquidityStress(symbol: string, timeframe: string): LiquidityStressEntry | undefined {
  const key = `${symbol}_${timeframe}`;
  return liquidityStressMaps.get(key);
}

/**
 * Get stress level
 */
export function getStressLevel(symbol: string, timeframe: string): number | undefined {
  const entry = getLiquidityStress(symbol, timeframe);
  return entry ? entry.stressLevel : undefined;
}

/**
 * Get critical stress entries
 */
export function getCriticalStressEntries(): LiquidityStressEntry[] {
  return Array.from(liquidityStressMaps.values()).filter(e => e.critical);
}

/**
 * Get all liquidity stress maps
 */
export function getAllLiquidityStressMaps(): Map<string, LiquidityStressEntry> {
  return new Map(liquidityStressMaps);
}

// ============================================================================
// Emotional State
// ============================================================================

/**
 * Update emotional bias
 */
export function updateEmotionalBias(
  bias: number,
  extreme: boolean,
  reversal: boolean
): void {
  currentEmotionalBias = bias;
  
  const record: EmotionalStateRecord = {
    emotionalBias: bias,
    extreme,
    reversal,
    timestamp: Date.now(),
  };
  
  emotionalStateHistory.push(record);
  
  // Maintain buffer size
  if (emotionalStateHistory.length > MAX_EMOTIONAL_HISTORY) {
    emotionalStateHistory.shift();
  }
}

/**
 * Get current emotional bias
 */
export function getEmotionalBias(): number {
  return currentEmotionalBias;
}

/**
 * Get emotional state history
 */
export function getEmotionalHistory(): EmotionalStateRecord[] {
  return [...emotionalStateHistory];
}

/**
 * Get recent emotional state
 */
export function getRecentEmotionalState(count: number = 20): EmotionalStateRecord[] {
  return emotionalStateHistory.slice(-count);
}

/**
 * Get emotional extremes
 */
export function getEmotionalExtremes(): EmotionalStateRecord[] {
  return emotionalStateHistory.filter(r => r.extreme);
}

/**
 * Get emotional reversals
 */
export function getEmotionalReversals(): EmotionalStateRecord[] {
  return emotionalStateHistory.filter(r => r.reversal);
}

/**
 * Get emotional trend
 */
export function getEmotionalTrend(): 'FEAR_INCREASING' | 'FEAR_DECREASING' | 'GREED_INCREASING' | 'GREED_DECREASING' | 'STABLE' {
  if (emotionalStateHistory.length < 10) return 'STABLE';
  
  const recent = emotionalStateHistory.slice(-10);
  const firstHalf = recent.slice(0, 5);
  const secondHalf = recent.slice(5);
  
  const avgFirst = firstHalf.reduce((sum, r) => sum + r.emotionalBias, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, r) => sum + r.emotionalBias, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  if (Math.abs(change) < 10) return 'STABLE';
  
  if (change > 0) {
    return avgSecond > 0 ? 'GREED_INCREASING' : 'FEAR_DECREASING';
  } else {
    return avgSecond < 0 ? 'FEAR_INCREASING' : 'GREED_DECREASING';
  }
}

// ============================================================================
// Volatility Pulse
// ============================================================================

/**
 * Update volatility pulse
 */
export function updateVolatilityPulse(
  symbol: string,
  timeframe: string,
  pulseLevel: number
): void {
  const key = `${symbol}_${timeframe}`;
  volatilityPulses.set(key, {
    symbol,
    timeframe,
    pulseLevel,
    timestamp: Date.now(),
  });
}

/**
 * Get volatility pulse
 */
export function getVolatilityPulse(symbol: string, timeframe: string): VolatilityPulseRecord | undefined {
  const key = `${symbol}_${timeframe}`;
  return volatilityPulses.get(key);
}

/**
 * Get pulse level
 */
export function getPulseLevel(symbol: string, timeframe: string): number | undefined {
  const pulse = getVolatilityPulse(symbol, timeframe);
  return pulse ? pulse.pulseLevel : undefined;
}

/**
 * Get all volatility pulses
 */
export function getAllVolatilityPulses(): Map<string, VolatilityPulseRecord> {
  return new Map(volatilityPulses);
}

// ============================================================================
// Trend Uncertainty
// ============================================================================

/**
 * Update trend uncertainty
 */
export function updateTrendUncertainty(
  symbol: string,
  timeframe: string,
  uncertaintyLevel: number
): void {
  const key = `${symbol}_${timeframe}`;
  trendUncertainties.set(key, {
    symbol,
    timeframe,
    uncertaintyLevel,
    timestamp: Date.now(),
  });
}

/**
 * Get trend uncertainty
 */
export function getTrendUncertainty(symbol: string, timeframe: string): TrendUncertaintyRecord | undefined {
  const key = `${symbol}_${timeframe}`;
  return trendUncertainties.get(key);
}

/**
 * Get uncertainty level
 */
export function getUncertaintyLevel(symbol: string, timeframe: string): number | undefined {
  const uncertainty = getTrendUncertainty(symbol, timeframe);
  return uncertainty ? uncertainty.uncertaintyLevel : undefined;
}

/**
 * Get all trend uncertainties
 */
export function getAllTrendUncertainties(): Map<string, TrendUncertaintyRecord> {
  return new Map(trendUncertainties);
}

// ============================================================================
// Snapshots & Trending
// ============================================================================

/**
 * Get sentience snapshots
 */
export function getSentienceSnapshots(): SentienceSnapshot[] {
  return [...sentienceSnapshots];
}

/**
 * Get recent snapshots
 */
export function getRecentSnapshots(count: number = 50): SentienceSnapshot[] {
  return sentienceSnapshots.slice(-count);
}

/**
 * Get sentience trend
 */
export function getSentienceTrend(): 'IMPROVING' | 'DEGRADING' | 'STABLE' {
  if (sentienceSnapshots.length < 20) return 'STABLE';
  
  const recent = sentienceSnapshots.slice(-20);
  const firstHalf = recent.slice(0, 10);
  const secondHalf = recent.slice(10);
  
  const avgFirst = firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length;
  
  const change = avgSecond - avgFirst;
  
  if (change > 5) return 'IMPROVING';
  if (change < -5) return 'DEGRADING';
  return 'STABLE';
}

/**
 * Get coherence trend
 */
export function getCoherenceTrend(): 'INCREASING' | 'DECREASING' | 'STABLE' {
  if (sentienceSnapshots.length < 20) return 'STABLE';
  
  const recent = sentienceSnapshots.slice(-20);
  const firstHalf = recent.slice(0, 10);
  const secondHalf = recent.slice(10);
  
  const avgFirst = firstHalf.reduce((sum, s) => sum + s.coherence, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, s) => sum + s.coherence, 0) / secondHalf.length;
  
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
  if (sentienceSnapshots.length === 0) {
    analytics.avgSentienceScore = 50;
    analytics.avgEmotionalBias = 0;
    analytics.avgTension = 50;
    analytics.avgLiquidityStress = 50;
    return;
  }
  
  const sumScore = sentienceSnapshots.reduce((sum, s) => sum + s.score, 0);
  const sumEmotion = sentienceSnapshots.reduce((sum, s) => sum + s.emotionalBias, 0);
  const sumTension = sentienceSnapshots.reduce((sum, s) => sum + s.tension, 0);
  const sumStress = sentienceSnapshots.reduce((sum, s) => sum + s.liquidityStress, 0);
  
  analytics.avgSentienceScore = sumScore / sentienceSnapshots.length;
  analytics.avgEmotionalBias = sumEmotion / sentienceSnapshots.length;
  analytics.avgTension = sumTension / sentienceSnapshots.length;
  analytics.avgLiquidityStress = sumStress / sentienceSnapshots.length;
}

/**
 * Get analytics
 */
export function getAnalytics() {
  return { ...analytics };
}

/**
 * Get sentience statistics
 */
export function getSentienceStatistics() {
  const total = sentienceAnalyses.length;
  
  if (total === 0) {
    return {
      totalAnalyses: 0,
      avgSentienceScore: 50,
      avgEmotionalBias: 0,
      avgTension: 50,
      avgLiquidityStress: 50,
      avgCoherence: 50,
      avgFragility: 50,
      emotionalExtremes: 0,
      emotionalReversals: 0,
      surgePredictions: 0,
      criticalPressureZones: 0,
      sentienceTrend: 'STABLE' as const,
      emotionalTrend: 'STABLE' as const,
    };
  }
  
  const extremes = sentienceAnalyses.filter(a => a.emotionalExtreme).length;
  const reversals = sentienceAnalyses.filter(a => a.emotionalReversal).length;
  const surgePredictions = sentienceAnalyses.filter(a => a.surgeProbability > 70).length;
  
  return {
    totalAnalyses: total,
    avgSentienceScore: analytics.avgSentienceScore,
    avgEmotionalBias: analytics.avgEmotionalBias,
    avgTension: analytics.avgTension,
    avgLiquidityStress: analytics.avgLiquidityStress,
    avgCoherence: sentienceSnapshots.reduce((sum, s) => sum + s.coherence, 0) / sentienceSnapshots.length,
    avgFragility: sentienceSnapshots.reduce((sum, s) => sum + s.fragility, 0) / sentienceSnapshots.length,
    emotionalExtremes: extremes,
    emotionalReversals: reversals,
    surgePredictions,
    criticalPressureZones: analytics.criticalPressureZones,
    sentienceTrend: getSentienceTrend(),
    emotionalTrend: getEmotionalTrend(),
  };
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  const stats = getSentienceStatistics();
  
  let score = 50; // Base score
  
  // High sentience = good
  if (stats.avgSentienceScore > 70) score += 15;
  else if (stats.avgSentienceScore < 40) score -= 15;
  
  // Low tension = good
  if (stats.avgTension < 40) score += 10;
  else if (stats.avgTension > 70) score -= 10;
  
  // Low stress = good
  if (stats.avgLiquidityStress < 40) score += 10;
  else if (stats.avgLiquidityStress > 70) score -= 10;
  
  // High coherence = good
  if (stats.avgCoherence > 70) score += 10;
  else if (stats.avgCoherence < 40) score -= 10;
  
  // Low fragility = good
  if (stats.avgFragility < 40) score += 10;
  else if (stats.avgFragility > 70) score -= 10;
  
  // Improving trend = good
  if (stats.sentienceTrend === 'IMPROVING') score += 5;
  else if (stats.sentienceTrend === 'DEGRADING') score -= 5;
  
  score = Math.max(0, Math.min(100, score));
  
  const grade = score >= 90 ? 'A' :
                score >= 80 ? 'B' :
                score >= 70 ? 'C' :
                score >= 60 ? 'D' : 'F';
  
  return {
    score,
    grade,
    ...stats,
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
    sentienceAnalyses,
    currentSentienceScores: Array.from(currentSentienceScores.entries()),
    pressureMaps: Array.from(pressureMaps.entries()),
    liquidityStressMaps: Array.from(liquidityStressMaps.entries()),
    emotionalStateHistory,
    currentEmotionalBias,
    volatilityPulses: Array.from(volatilityPulses.entries()),
    trendUncertainties: Array.from(trendUncertainties.entries()),
    sentienceSnapshots,
    analytics,
    exportTime: Date.now(),
  };
}

/**
 * Import state
 */
export function importState(data: any): void {
  try {
    if (data.sentienceAnalyses && Array.isArray(data.sentienceAnalyses)) {
      sentienceAnalyses.length = 0;
      sentienceAnalyses.push(...data.sentienceAnalyses);
    }
    
    if (data.currentSentienceScores && Array.isArray(data.currentSentienceScores)) {
      currentSentienceScores.clear();
      data.currentSentienceScores.forEach(([key, value]: [string, number]) => {
        currentSentienceScores.set(key, value);
      });
    }
    
    if (data.pressureMaps && Array.isArray(data.pressureMaps)) {
      pressureMaps.clear();
      data.pressureMaps.forEach(([key, value]: [string, PressureMapEntry]) => {
        pressureMaps.set(key, value);
      });
    }
    
    if (data.liquidityStressMaps && Array.isArray(data.liquidityStressMaps)) {
      liquidityStressMaps.clear();
      data.liquidityStressMaps.forEach(([key, value]: [string, LiquidityStressEntry]) => {
        liquidityStressMaps.set(key, value);
      });
    }
    
    if (data.emotionalStateHistory && Array.isArray(data.emotionalStateHistory)) {
      emotionalStateHistory.length = 0;
      emotionalStateHistory.push(...data.emotionalStateHistory);
    }
    
    if (data.currentEmotionalBias !== undefined) {
      currentEmotionalBias = data.currentEmotionalBias;
    }
    
    if (data.volatilityPulses && Array.isArray(data.volatilityPulses)) {
      volatilityPulses.clear();
      data.volatilityPulses.forEach(([key, value]: [string, VolatilityPulseRecord]) => {
        volatilityPulses.set(key, value);
      });
    }
    
    if (data.trendUncertainties && Array.isArray(data.trendUncertainties)) {
      trendUncertainties.clear();
      data.trendUncertainties.forEach(([key, value]: [string, TrendUncertaintyRecord]) => {
        trendUncertainties.set(key, value);
      });
    }
    
    if (data.sentienceSnapshots && Array.isArray(data.sentienceSnapshots)) {
      sentienceSnapshots.length = 0;
      sentienceSnapshots.push(...data.sentienceSnapshots);
    }
    
    if (data.analytics) {
      Object.assign(analytics, data.analytics);
    }
    
    console.log('[Sentience State] State imported successfully');
  } catch (error) {
    console.error('[Sentience State] Import error:', error);
  }
}

/**
 * Clear all state
 */
export function clearAllState(): void {
  sentienceAnalyses.length = 0;
  currentSentienceScores.clear();
  pressureMaps.clear();
  liquidityStressMaps.clear();
  emotionalStateHistory.length = 0;
  currentEmotionalBias = 0;
  volatilityPulses.clear();
  trendUncertainties.clear();
  sentienceSnapshots.length = 0;
  
  analytics.totalAnalyses = 0;
  analytics.avgSentienceScore = 50;
  analytics.avgEmotionalBias = 0;
  analytics.avgTension = 50;
  analytics.avgLiquidityStress = 50;
  analytics.criticalPressureZones = 0;
  analytics.emotionalExtremes = 0;
  analytics.surgePredictions = 0;
  analytics.lastUpdateTime = 0;
  
  console.log('[Sentience State] All state cleared');
}

// Export state manager
export const SentienceState = {
  // Analyses
  addSentienceAnalysis,
  getRecentAnalyses,
  getAllAnalyses,
  getAnalysesByRegime,
  getHighSentienceAnalyses,
  getCriticalAnalyses,
  
  // Sentience scores
  updateSentienceScore,
  getSentienceScore,
  getAllSentienceScores,
  
  // Pressure maps
  updatePressureMap,
  getPressureMap,
  getPressureZones,
  getCriticalPressureZones,
  getAllPressureMaps,
  
  // Liquidity stress
  updateLiquidityStress,
  getLiquidityStress,
  getStressLevel,
  getCriticalStressEntries,
  getAllLiquidityStressMaps,
  
  // Emotional state
  updateEmotionalBias,
  getEmotionalBias,
  getEmotionalHistory,
  getRecentEmotionalState,
  getEmotionalExtremes,
  getEmotionalReversals,
  getEmotionalTrend,
  
  // Volatility pulse
  updateVolatilityPulse,
  getVolatilityPulse,
  getPulseLevel,
  getAllVolatilityPulses,
  
  // Trend uncertainty
  updateTrendUncertainty,
  getTrendUncertainty,
  getUncertaintyLevel,
  getAllTrendUncertainties,
  
  // Snapshots
  getSentienceSnapshots,
  getRecentSnapshots,
  getSentienceTrend,
  getCoherenceTrend,
  
  // Analytics
  getAnalytics,
  getSentienceStatistics,
  getPerformanceSummary,
  
  // State management
  exportState,
  importState,
  clearAllState,
};

export default SentienceState;
