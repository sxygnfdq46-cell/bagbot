/**
 * Sentience Service - React Integration for Market Sentience Layer
 * 
 * Provides React-friendly interface to Sentience Engine.
 * Must run before StrategySelector to provide market awareness context.
 */

import { SentienceEngine, MarketSnapshot, SentienceAnalysis, PressureZone } from '@/app/lib/sentience/SentienceEngine';
import * as SentienceState from '@/app/state/sentienceState';

/**
 * Market emotion
 */
export interface MarketEmotion {
  bias: number;              // -100 to 100 (fear to greed)
  extreme: boolean;
  reversal: boolean;
  trend: 'FEAR_INCREASING' | 'FEAR_DECREASING' | 'GREED_INCREASING' | 'GREED_DECREASING' | 'STABLE';
  description: string;
}

/**
 * Stress level
 */
export interface StressLevel {
  level: number;             // 0-100
  gradient: number;
  critical: boolean;
  description: string;
}

/**
 * Sentience event types
 */
type SentienceEventType = 
  | 'ANALYSIS_COMPLETE'
  | 'HIGH_SENTIENCE'
  | 'LOW_SENTIENCE'
  | 'EMOTIONAL_EXTREME'
  | 'EMOTIONAL_REVERSAL'
  | 'SURGE_PREDICTION'
  | 'CRITICAL_PRESSURE'
  | 'CRITICAL_STRESS'
  | 'COHERENCE_CHANGE'
  | 'FRAGILITY_ALERT';

// Event listeners
type SentienceListener = (analysis: SentienceAnalysis) => void;
type EmotionListener = (emotion: MarketEmotion) => void;
type PressureListener = (zones: PressureZone[]) => void;
type StressListener = (stress: StressLevel) => void;
type EventListener = (eventType: SentienceEventType, data: any) => void;

const analysisListeners: SentienceListener[] = [];
const emotionListeners: EmotionListener[] = [];
const pressureListeners: PressureListener[] = [];
const stressListeners: StressListener[] = [];
const eventListeners: EventListener[] = [];

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Update sentience with new market snapshot
 * This should be called before strategy selection
 */
export function updateSentience(snapshot: MarketSnapshot): SentienceAnalysis {
  try {
    // Analyze environment
    const analysis = SentienceEngine.analyzeEnvironment(snapshot);
    
    // Store in state
    SentienceState.addSentienceAnalysis(analysis);
    SentienceState.updateSentienceScore(snapshot.symbol, snapshot.timestamp.toString(), analysis.sentienceScore);
    SentienceState.updatePressureMap(snapshot.symbol, snapshot.timestamp.toString(), analysis.pressureZones);
    SentienceState.updateLiquidityStress(
      snapshot.symbol,
      snapshot.timestamp.toString(),
      analysis.liquidityStress,
      analysis.stressGradient,
      analysis.stressCritical
    );
    SentienceState.updateEmotionalBias(
      analysis.emotionalBias,
      analysis.emotionalExtreme,
      analysis.emotionalReversal
    );
    SentienceState.updateVolatilityPulse(snapshot.symbol, snapshot.timestamp.toString(), analysis.volatilityPulse);
    SentienceState.updateTrendUncertainty(snapshot.symbol, snapshot.timestamp.toString(), analysis.trendUncertainty);
    
    // Emit events
    emitSentienceEvents(analysis);
    
    // Trigger listeners
    triggerListeners(analysis);
    
    console.log('[Sentience Service] Updated:', {
      score: analysis.sentienceScore.toFixed(1),
      emotion: analysis.emotionalBias.toFixed(1),
      tension: analysis.tension.toFixed(1),
      surgeProbability: analysis.surgeProbability.toFixed(1),
    });
    
    return analysis;
  } catch (error) {
    console.error('[Sentience Service] Update error:', error);
    throw error;
  }
}

/**
 * Get current market emotion
 */
export function getMarketEmotion(): MarketEmotion {
  const bias = SentienceState.getEmotionalBias();
  const recentStates = SentienceState.getRecentEmotionalState(5);
  const trend = SentienceState.getEmotionalTrend();
  
  const extreme = recentStates.length > 0 ? recentStates[recentStates.length - 1].extreme : false;
  const reversal = recentStates.length > 0 ? recentStates[recentStates.length - 1].reversal : false;
  
  let description = '';
  if (extreme) {
    description = bias > 0 ? 'EXTREME GREED' : 'EXTREME FEAR';
  } else if (Math.abs(bias) > 60) {
    description = bias > 0 ? 'HIGH GREED' : 'HIGH FEAR';
  } else if (Math.abs(bias) > 30) {
    description = bias > 0 ? 'MODERATE GREED' : 'MODERATE FEAR';
  } else {
    description = 'NEUTRAL';
  }
  
  if (reversal) {
    description += ' (REVERSING)';
  }
  
  return {
    bias,
    extreme,
    reversal,
    trend,
    description,
  };
}

/**
 * Get pressure zones for symbol/timeframe
 */
export function getPressureZones(symbol: string, timeframe: string): PressureZone[] {
  return SentienceState.getPressureZones(symbol, timeframe);
}

/**
 * Get critical pressure zones
 */
export function getCriticalPressureZones(symbol: string, timeframe: string): PressureZone[] {
  return SentienceState.getCriticalPressureZones(symbol, timeframe);
}

/**
 * Get stress level for symbol/timeframe
 */
export function getStressLevel(symbol: string, timeframe: string): StressLevel {
  const entry = SentienceState.getLiquidityStress(symbol, timeframe);
  
  if (!entry) {
    return {
      level: 50,
      gradient: 0,
      critical: false,
      description: 'UNKNOWN',
    };
  }
  
  let description = '';
  if (entry.critical) {
    description = 'CRITICAL STRESS';
  } else if (entry.stressLevel > 75) {
    description = 'HIGH STRESS';
  } else if (entry.stressLevel > 50) {
    description = 'MODERATE STRESS';
  } else if (entry.stressLevel > 25) {
    description = 'LOW STRESS';
  } else {
    description = 'MINIMAL STRESS';
  }
  
  if (entry.gradient > 5) {
    description += ' (RISING)';
  } else if (entry.gradient < -5) {
    description += ' (FALLING)';
  }
  
  return {
    level: entry.stressLevel,
    gradient: entry.gradient,
    critical: entry.critical,
    description,
  };
}

/**
 * Get current sentience score
 */
export function getSentienceScore(symbol: string, timeframe: string): number | undefined {
  return SentienceState.getSentienceScore(symbol, timeframe);
}

/**
 * Get recent sentience analyses
 */
export function getRecentAnalyses(count: number = 20): SentienceAnalysis[] {
  return SentienceState.getRecentAnalyses(count);
}

/**
 * Get critical analyses
 */
export function getCriticalAnalyses(): SentienceAnalysis[] {
  return SentienceState.getCriticalAnalyses();
}

// ============================================================================
// Event Emission
// ============================================================================

/**
 * Emit sentience events based on analysis
 */
export function emitSentienceEvents(analysis: SentienceAnalysis): void {
  // Analysis complete (always emit)
  emitEvent('ANALYSIS_COMPLETE', analysis);
  
  // High sentience
  if (analysis.sentienceScore > 80) {
    emitEvent('HIGH_SENTIENCE', { score: analysis.sentienceScore });
  }
  
  // Low sentience
  if (analysis.sentienceScore < 30) {
    emitEvent('LOW_SENTIENCE', { score: analysis.sentienceScore });
  }
  
  // Emotional extreme
  if (analysis.emotionalExtreme) {
    emitEvent('EMOTIONAL_EXTREME', {
      bias: analysis.emotionalBias,
      extreme: analysis.emotionalExtreme,
    });
  }
  
  // Emotional reversal
  if (analysis.emotionalReversal) {
    emitEvent('EMOTIONAL_REVERSAL', {
      bias: analysis.emotionalBias,
      reversal: analysis.emotionalReversal,
    });
  }
  
  // Surge prediction
  if (analysis.surgeProbability > 70) {
    emitEvent('SURGE_PREDICTION', {
      probability: analysis.surgeProbability,
      direction: analysis.surgeDirection,
      imminence: analysis.surgeImminence,
    });
  }
  
  // Critical pressure
  const criticalPressure = analysis.pressureZones.filter(
    z => z.pressureLevel === 'CRITICAL'
  );
  if (criticalPressure.length > 0) {
    emitEvent('CRITICAL_PRESSURE', {
      zones: criticalPressure,
      count: criticalPressure.length,
    });
  }
  
  // Critical stress
  if (analysis.stressCritical) {
    emitEvent('CRITICAL_STRESS', {
      stress: analysis.liquidityStress,
      gradient: analysis.stressGradient,
    });
  }
  
  // Coherence change
  const recentSnapshots = SentienceState.getRecentSnapshots(10);
  if (recentSnapshots.length >= 10) {
    const firstHalf = recentSnapshots.slice(0, 5);
    const secondHalf = recentSnapshots.slice(5);
    const avgFirst = firstHalf.reduce((sum, s) => sum + s.coherence, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((sum, s) => sum + s.coherence, 0) / secondHalf.length;
    
    if (Math.abs(avgSecond - avgFirst) > 15) {
      emitEvent('COHERENCE_CHANGE', {
        current: analysis.coherence,
        change: avgSecond - avgFirst,
      });
    }
  }
  
  // Fragility alert
  if (analysis.fragility > 80) {
    emitEvent('FRAGILITY_ALERT', {
      fragility: analysis.fragility,
      liquidityStress: analysis.liquidityStress,
    });
  }
}

/**
 * Emit event to listeners
 */
function emitEvent(eventType: SentienceEventType, data: any): void {
  eventListeners.forEach(listener => {
    try {
      listener(eventType, data);
    } catch (error) {
      console.error('[Sentience Service] Event listener error:', error);
    }
  });
}

/**
 * Trigger all listeners
 */
function triggerListeners(analysis: SentienceAnalysis): void {
  // Analysis listeners
  analysisListeners.forEach(listener => {
    try {
      listener(analysis);
    } catch (error) {
      console.error('[Sentience Service] Listener error:', error);
    }
  });
  
  // Emotion listeners
  const emotion = getMarketEmotion();
  emotionListeners.forEach(listener => {
    try {
      listener(emotion);
    } catch (error) {
      console.error('[Sentience Service] Listener error:', error);
    }
  });
  
  // Pressure listeners
  if (analysis.pressureZones.length > 0) {
    pressureListeners.forEach(listener => {
      try {
        listener(analysis.pressureZones);
      } catch (error) {
        console.error('[Sentience Service] Listener error:', error);
      }
    });
  }
  
  // Stress listeners
  const stress: StressLevel = {
    level: analysis.liquidityStress,
    gradient: analysis.stressGradient,
    critical: analysis.stressCritical,
    description: analysis.stressCritical ? 'CRITICAL' : 'NORMAL',
  };
  stressListeners.forEach(listener => {
    try {
      listener(stress);
    } catch (error) {
      console.error('[Sentience Service] Listener error:', error);
    }
  });
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Listen for analysis completions
 */
export function onAnalysisComplete(listener: SentienceListener): () => void {
  analysisListeners.push(listener);
  return () => {
    const index = analysisListeners.indexOf(listener);
    if (index > -1) analysisListeners.splice(index, 1);
  };
}

/**
 * Listen for emotion updates
 */
export function onEmotionUpdate(listener: EmotionListener): () => void {
  emotionListeners.push(listener);
  return () => {
    const index = emotionListeners.indexOf(listener);
    if (index > -1) emotionListeners.splice(index, 1);
  };
}

/**
 * Listen for pressure zone updates
 */
export function onPressureUpdate(listener: PressureListener): () => void {
  pressureListeners.push(listener);
  return () => {
    const index = pressureListeners.indexOf(listener);
    if (index > -1) pressureListeners.splice(index, 1);
  };
}

/**
 * Listen for stress level updates
 */
export function onStressUpdate(listener: StressListener): () => void {
  stressListeners.push(listener);
  return () => {
    const index = stressListeners.indexOf(listener);
    if (index > -1) stressListeners.splice(index, 1);
  };
}

/**
 * Listen for specific sentience events
 */
export function onSentienceEvent(listener: EventListener): () => void {
  eventListeners.push(listener);
  return () => {
    const index = eventListeners.indexOf(listener);
    if (index > -1) eventListeners.splice(index, 1);
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Check if market is in extreme state
 */
export function isMarketExtreme(): boolean {
  const emotion = getMarketEmotion();
  return emotion.extreme;
}

/**
 * Check if market emotion is reversing
 */
export function isEmotionReversing(): boolean {
  const emotion = getMarketEmotion();
  return emotion.reversal;
}

/**
 * Check if stress is critical
 */
export function isStressCritical(symbol: string, timeframe: string): boolean {
  const stress = getStressLevel(symbol, timeframe);
  return stress.critical;
}

/**
 * Check if surge is imminent
 */
export function isSurgeImminent(): boolean {
  const recent = SentienceState.getRecentAnalyses(1);
  if (recent.length === 0) return false;
  
  const analysis = recent[0];
  return analysis.surgeImminence === 'IMMEDIATE';
}

/**
 * Get market awareness level
 */
export function getMarketAwarenessLevel(score: number): 'BLIND' | 'LOW' | 'MODERATE' | 'HIGH' | 'SENTIENT' {
  if (score < 20) return 'BLIND';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'SENTIENT';
}

/**
 * Get comprehensive market state
 */
export function getMarketState(symbol: string, timeframe: string): {
  sentience: number | undefined;
  emotion: MarketEmotion;
  pressureZones: PressureZone[];
  stress: StressLevel;
  statistics: any;
} {
  return {
    sentience: getSentienceScore(symbol, timeframe),
    emotion: getMarketEmotion(),
    pressureZones: getPressureZones(symbol, timeframe),
    stress: getStressLevel(symbol, timeframe),
    statistics: SentienceState.getSentienceStatistics(),
  };
}

// ============================================================================
// Mock/Testing
// ============================================================================

/**
 * Create mock market snapshot for testing
 */
export function createMockSnapshot(
  symbol: string = 'BTC/USD',
  overrides: Partial<MarketSnapshot> = {}
): MarketSnapshot {
  const baseSnapshot: MarketSnapshot = {
    symbol,
    price: 50000,
    priceChange: 1.5,
    priceHistory: Array.from({ length: 100 }, (_, i) => 50000 + Math.random() * 1000 - 500),
    volume: 1000000,
    volumeHistory: Array.from({ length: 100 }, () => 1000000 + Math.random() * 200000 - 100000),
    liquidityLevels: Array.from({ length: 20 }, () => 50 + Math.random() * 30),
    orderBookDepth: 70,
    marketImpact: 2,
    volatility: 60,
    volatilityHistory: Array.from({ length: 100 }, () => 60 + Math.random() * 20 - 10),
    momentum: 15,
    momentumAcceleration: 2,
    trendStrength: 65,
    spreadDeviation: 0.5,
    shieldActive: false,
    threatLevel: 30,
    fusionConfidence: 75,
    fusionQuality: 80,
    patternConfluence: 3,
    timestamp: Date.now(),
    timeSinceLastMove: 3600000, // 1 hour
    regime: 'STABLE',
    regimeStability: 70,
  };
  
  return { ...baseSnapshot, ...overrides };
}

/**
 * Test sentience update with mock data
 */
export function testSentienceUpdate(): void {
  const mockSnapshot = createMockSnapshot();
  const analysis = updateSentience(mockSnapshot);
  
  console.log('[Sentience Service] Test update:', {
    sentienceScore: analysis.sentienceScore,
    emotionalBias: analysis.emotionalBias,
    tension: analysis.tension,
    liquidityStress: analysis.liquidityStress,
    surgeProbability: analysis.surgeProbability,
  });
}

/**
 * Test with extreme market conditions
 */
export function testExtremeConditions(): void {
  const extremeSnapshot = createMockSnapshot('BTC/USD', {
    priceChange: 10,
    volatility: 95,
    momentum: 80,
    momentumAcceleration: 15,
    threatLevel: 85,
    shieldActive: true,
  });
  
  const analysis = updateSentience(extremeSnapshot);
  
  console.log('[Sentience Service] Extreme test:', {
    sentienceScore: analysis.sentienceScore,
    emotionalBias: analysis.emotionalBias,
    emotionalExtreme: analysis.emotionalExtreme,
    surgeProbability: analysis.surgeProbability,
    surgeImminence: analysis.surgeImminence,
  });
}

// Export service
export const SentienceService = {
  // Core operations
  updateSentience,
  getMarketEmotion,
  getPressureZones,
  getCriticalPressureZones,
  getStressLevel,
  getSentienceScore,
  getRecentAnalyses,
  getCriticalAnalyses,
  
  // Events
  emitSentienceEvents,
  
  // Listeners
  onAnalysisComplete,
  onEmotionUpdate,
  onPressureUpdate,
  onStressUpdate,
  onSentienceEvent,
  
  // Utilities
  isMarketExtreme,
  isEmotionReversing,
  isStressCritical,
  isSurgeImminent,
  getMarketAwarenessLevel,
  getMarketState,
  
  // Testing
  createMockSnapshot,
  testSentienceUpdate,
  testExtremeConditions,
};

export default SentienceService;
