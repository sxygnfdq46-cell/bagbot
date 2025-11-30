/**
 * Sentience Engine - Market Sentience Layer
 * 
 * Integrates all intelligence layers to compute market "sentience" -
 * an advanced awareness of market psychology, pressure, and emerging conditions.
 * Acts as the highest-level perception layer before strategy selection.
 */

import { PatternSyncEngine, MasterPattern } from '@/app/lib/patterns/PatternSyncEngine';
import { FusionEngine } from '@/app/lib/fusion/FusionEngine';
import { ReinforcementCore } from '@/app/lib/learning/ReinforcementCore';
import { ShieldEngine } from '@/app/lib/shield/ShieldEngine';
import * as SentienceMath from './sentienceMath';

/**
 * Market snapshot for analysis
 */
export interface MarketSnapshot {
  // Price data
  symbol: string;
  price: number;
  priceChange: number;
  priceHistory: number[];
  
  // Volume & liquidity
  volume: number;
  volumeHistory: number[];
  liquidityLevels: number[];
  orderBookDepth: number;
  marketImpact: number;
  
  // Volatility
  volatility: number;
  volatilityHistory: number[];
  
  // Technical
  momentum: number;
  momentumAcceleration: number;
  trendStrength: number;
  spreadDeviation: number;
  
  // Engine states
  shieldActive: boolean;
  threatLevel: number;
  fusionConfidence: number;
  fusionQuality: number;
  patternConfluence: number;
  
  // Time context
  timestamp: number;
  timeSinceLastMove: number;
  regime: string;
  regimeStability: number;
}

/**
 * Sentience analysis result
 */
export interface SentienceAnalysis {
  // Core sentience
  sentienceScore: number;        // 0-100 (overall market awareness)
  
  // Emotional state
  emotionalBias: number;          // -100 to 100 (fear to greed)
  emotionalExtreme: boolean;
  emotionalReversal: boolean;
  
  // Pressure & stress
  tension: number;                // 0-100
  pressureZones: PressureZone[];
  liquidityStress: number;        // 0-100
  stressGradient: number;
  stressCritical: boolean;
  
  // Market characteristics
  volatilityPulse: number;        // 0-100 (volatility entropy)
  coherence: number;              // 0-100 (market alignment)
  fragility: number;              // 0-100
  trendUncertainty: number;       // 0-100
  
  // Surge prediction
  surgeProbability: number;       // 0-100
  surgeDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  surgeImminence: 'IMMEDIATE' | 'NEAR' | 'DISTANT' | 'NONE';
  
  // Context
  timestamp: number;
  regime: string;
  confidence: number;             // 0-100 (confidence in analysis)
}

/**
 * Pressure zone
 */
export interface PressureZone {
  id: string;
  minPrice: number;
  maxPrice: number;
  pressureLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  pressureScore: number;          // 0-100
  type: 'SUPPORT' | 'RESISTANCE' | 'ACCUMULATION' | 'DISTRIBUTION';
  volume: number;
  patterns: string[];             // Pattern IDs
  significance: number;           // 0-100
  timestamp: number;
}

/**
 * Sentience state update
 */
interface SentienceState {
  sentienceScore: number;
  emotionalHistory: number[];
  tensionHistory: number[];
  stressHistory: number[];
  lastUpdate: number;
}

/**
 * Sentience Engine Class
 */
class SentienceEngineClass {
  private static instance: SentienceEngineClass;
  
  // Internal state
  private state: SentienceState = {
    sentienceScore: 50,
    emotionalHistory: [],
    tensionHistory: [],
    stressHistory: [],
    lastUpdate: 0,
  };
  
  // History limits
  private readonly MAX_HISTORY = 100;
  
  private constructor() {
    console.log('[Sentience Engine] Initialized');
  }
  
  public static getInstance(): SentienceEngineClass {
    if (!SentienceEngineClass.instance) {
      SentienceEngineClass.instance = new SentienceEngineClass();
    }
    return SentienceEngineClass.instance;
  }
  
  // ==========================================================================
  // Core Analysis
  // ==========================================================================
  
  /**
   * Analyze market environment and compute sentience
   */
  analyzeEnvironment(snapshot: MarketSnapshot): SentienceAnalysis {
    // Compute individual components
    const tension = this.computeTension(snapshot);
    const emotionalScore = this.computeEmotionalBias(snapshot);
    const liquidityStress = this.computeLiquidityStress(snapshot);
    const volatilityPulse = this.computeVolatilityPulse(snapshot);
    const surgeProbability = this.computeSurgeProbability(snapshot);
    
    // Detect zones
    const pressureZones = this.detectPressureZones(snapshot);
    
    // Calculate derived metrics
    const coherence = this.computeCoherence(snapshot);
    const fragility = this.computeFragility(snapshot);
    const trendUncertainty = this.computeTrendUncertainty(snapshot);
    
    // Compute overall sentience score
    const sentienceScore = this.computeSentienceScore({
      tension,
      emotionalScore,
      liquidityStress,
      volatilityPulse,
      coherence,
      fragility,
      patternConfluence: snapshot.patternConfluence,
      fusionQuality: snapshot.fusionQuality,
    });
    
    // Emotional oscillator
    const emotionalOscillator = SentienceMath.calculateEmotionalOscillator(
      this.state.emotionalHistory
    );
    
    // Stress gradient
    const stressGradient = SentienceMath.calculateStressGradient(
      this.state.stressHistory
    );
    
    // Surge direction and imminence
    const surgeDirection = this.determineSurgeDirection(snapshot, emotionalScore);
    const surgeImminence = this.determineSurgeImminence(surgeProbability, tension);
    
    // Analysis confidence
    const confidence = this.calculateAnalysisConfidence(snapshot, sentienceScore);
    
    const analysis: SentienceAnalysis = {
      sentienceScore,
      emotionalBias: emotionalOscillator.value,
      emotionalExtreme: emotionalOscillator.extreme,
      emotionalReversal: emotionalOscillator.reversal,
      tension,
      pressureZones,
      liquidityStress,
      stressGradient: stressGradient.value,
      stressCritical: stressGradient.critical,
      volatilityPulse,
      coherence,
      fragility,
      trendUncertainty,
      surgeProbability,
      surgeDirection,
      surgeImminence,
      timestamp: snapshot.timestamp,
      regime: snapshot.regime,
      confidence,
    };
    
    // Update internal state
    this.updateState(analysis);
    
    return analysis;
  }
  
  /**
   * Compute overall sentience score
   */
  computeSentienceScore(components: {
    tension: number;
    emotionalScore: number;
    liquidityStress: number;
    volatilityPulse: number;
    coherence: number;
    fragility: number;
    patternConfluence: number;
    fusionQuality: number;
  }): number {
    // Awareness from integration quality
    const integrationQuality = (
      components.fusionQuality * 0.4 +
      components.patternConfluence * 10 * 0.3 +
      components.coherence * 0.3
    );
    
    // Awareness from environmental understanding
    const environmentalAwareness = (
      (100 - components.tension) * 0.25 +        // Low tension = better awareness
      (100 - components.liquidityStress) * 0.25 + // Low stress = better awareness
      (100 - components.volatilityPulse) * 0.25 + // Low entropy = better awareness
      (100 - components.fragility) * 0.25         // Low fragility = better awareness
    );
    
    // Emotional intelligence (moderate emotion = better sentience)
    const emotionalModeration = 100 - Math.abs(components.emotionalScore);
    
    // Combined sentience score
    const rawSentience = (
      integrationQuality * 0.35 +
      environmentalAwareness * 0.35 +
      emotionalModeration * 0.30
    );
    
    return Math.max(0, Math.min(100, rawSentience));
  }
  
  /**
   * Detect pressure zones in the market
   */
  detectPressureZones(snapshot: MarketSnapshot): PressureZone[] {
    const zones: PressureZone[] = [];
    const currentPrice = snapshot.price;
    
    // Get patterns from Pattern Sync Engine
    const patterns = PatternSyncEngine.getPatternsBySymbol(snapshot.symbol);
    
    if (patterns.length === 0) {
      return zones;
    }
    
    // Cluster patterns by price to find pressure zones
    const priceClusters = this.clusterPatternsByPrice(patterns);
    
    priceClusters.forEach((clusterPatterns, index) => {
      const prices = clusterPatterns.map(p => p.currentPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      
      // Determine zone type based on position relative to current price
      let type: PressureZone['type'];
      if (avgPrice < currentPrice * 0.99) {
        type = 'SUPPORT';
      } else if (avgPrice > currentPrice * 1.01) {
        type = 'RESISTANCE';
      } else {
        // Near current price - check pattern types and volume
        const avgVolume = snapshot.volume;
        type = avgVolume > snapshot.volumeHistory.reduce((s, v) => s + v, 0) / snapshot.volumeHistory.length
          ? 'ACCUMULATION'
          : 'DISTRIBUTION';
      }
      
      // Calculate pressure score
      const patternDensity = clusterPatterns.length / patterns.length;
      const confluenceScore = clusterPatterns.reduce((sum, p) => sum + p.confluence, 0) / clusterPatterns.length;
      const significanceScore = clusterPatterns.filter(p => 
        p.significance === 'CRITICAL' || p.significance === 'MAJOR'
      ).length / clusterPatterns.length;
      
      const pressureScore = (
        patternDensity * 30 +
        confluenceScore * 5 * 25 +
        significanceScore * 45
      ) * 100;
      
      const pressureLevel = pressureScore > 75 ? 'CRITICAL' :
                           pressureScore > 60 ? 'HIGH' :
                           pressureScore > 40 ? 'MEDIUM' : 'LOW';
      
      zones.push({
        id: `pressure_${index}_${Date.now()}`,
        minPrice,
        maxPrice,
        pressureLevel,
        pressureScore: Math.min(100, pressureScore),
        type,
        volume: snapshot.volume,
        patterns: clusterPatterns.map(p => p.id),
        significance: significanceScore * 100,
        timestamp: snapshot.timestamp,
      });
    });
    
    return zones;
  }
  
  /**
   * Detect liquidity stress
   */
  detectLiquidityStress(snapshot: MarketSnapshot): number {
    return this.computeLiquidityStress(snapshot);
  }
  
  /**
   * Update internal state
   */
  updateState(analysis: SentienceAnalysis): void {
    // Update emotional history
    this.state.emotionalHistory.push(analysis.emotionalBias);
    if (this.state.emotionalHistory.length > this.MAX_HISTORY) {
      this.state.emotionalHistory.shift();
    }
    
    // Update tension history
    this.state.tensionHistory.push(analysis.tension);
    if (this.state.tensionHistory.length > this.MAX_HISTORY) {
      this.state.tensionHistory.shift();
    }
    
    // Update stress history
    this.state.stressHistory.push(analysis.liquidityStress);
    if (this.state.stressHistory.length > this.MAX_HISTORY) {
      this.state.stressHistory.shift();
    }
    
    // Update sentience score
    this.state.sentienceScore = analysis.sentienceScore;
    this.state.lastUpdate = analysis.timestamp;
  }
  
  // ==========================================================================
  // Component Calculations
  // ==========================================================================
  
  private computeTension(snapshot: MarketSnapshot): number {
    const volumeRatio = snapshot.volumeHistory.length > 0
      ? snapshot.volume / (snapshot.volumeHistory.reduce((s, v) => s + v, 0) / snapshot.volumeHistory.length)
      : 1;
    
    return SentienceMath.tensionFormula(
      snapshot.priceChange,
      volumeRatio,
      snapshot.volatility,
      snapshot.spreadDeviation
    );
  }
  
  private computeEmotionalBias(snapshot: MarketSnapshot): number {
    // Volume emotional signal (panic or FOMO)
    const avgVolume = snapshot.volumeHistory.reduce((s, v) => s + v, 0) / snapshot.volumeHistory.length;
    const volumeDeviation = (snapshot.volume - avgVolume) / avgVolume;
    const volumeEmotionalSignal = Math.sign(snapshot.priceChange) * volumeDeviation;
    
    // Volatility trend
    const recentVol = snapshot.volatilityHistory.slice(-5);
    const olderVol = snapshot.volatilityHistory.slice(0, -5);
    const volatilityTrend = recentVol.length > 0 && olderVol.length > 0
      ? (recentVol.reduce((s, v) => s + v, 0) / recentVol.length) -
        (olderVol.reduce((s, v) => s + v, 0) / olderVol.length)
      : 0;
    const normalizedVolTrend = Math.tanh(volatilityTrend / 20);
    
    return SentienceMath.emotionalMomentumScore(
      snapshot.momentum,
      snapshot.momentumAcceleration,
      normalizedVolTrend,
      volumeEmotionalSignal
    );
  }
  
  private computeLiquidityStress(snapshot: MarketSnapshot): number {
    return SentienceMath.liquidityFlowVariance(
      snapshot.liquidityLevels,
      snapshot.volumeHistory,
      snapshot.orderBookDepth,
      snapshot.marketImpact
    );
  }
  
  private computeVolatilityPulse(snapshot: MarketSnapshot): number {
    const priceReturns = this.calculateReturns(snapshot.priceHistory);
    
    return SentienceMath.volatilityEntropy(
      snapshot.volatilityHistory,
      priceReturns,
      snapshot.regimeStability
    );
  }
  
  private computeCoherence(snapshot: MarketSnapshot): number {
    // Price action direction
    const priceDirection = Math.sign(snapshot.priceChange);
    
    // Volume trend
    const volumeTrend = this.calculateTrend(snapshot.volumeHistory);
    
    // Volatility trend
    const volatilityTrend = this.calculateTrend(snapshot.volatilityHistory);
    
    // Order flow balance (using momentum as proxy)
    const orderFlowBalance = Math.tanh(snapshot.momentum / 50);
    
    return SentienceMath.calculateCoherence(
      priceDirection,
      volumeTrend,
      volatilityTrend,
      orderFlowBalance
    );
  }
  
  private computeFragility(snapshot: MarketSnapshot): number {
    // Count recent shocks (large price moves)
    const recentShocks = snapshot.priceHistory.slice(-20).filter((price, idx, arr) => {
      if (idx === 0) return false;
      const change = Math.abs((price - arr[idx - 1]) / arr[idx - 1]) * 100;
      return change > 2; // 2% move = shock
    }).length;
    
    return SentienceMath.calculateFragility(
      snapshot.orderBookDepth,
      snapshot.volatility,
      recentShocks,
      snapshot.trendStrength
    );
  }
  
  private computeTrendUncertainty(snapshot: MarketSnapshot): number {
    // Trend uncertainty = inverse of trend strength + regime instability
    const trendWeakness = 100 - snapshot.trendStrength;
    const regimeInstability = 100 - snapshot.regimeStability;
    
    // Price action inconsistency
    const priceReturns = this.calculateReturns(snapshot.priceHistory);
    const returnVolatility = Math.sqrt(
      priceReturns.reduce((sum, r) => sum + r * r, 0) / priceReturns.length
    );
    const inconsistency = Math.min(100, returnVolatility * 500);
    
    return (
      trendWeakness * 0.4 +
      regimeInstability * 0.3 +
      inconsistency * 0.3
    );
  }
  
  private computeSurgeProbability(snapshot: MarketSnapshot): number {
    // Compression level (low volatility after trend)
    const avgVol = snapshot.volatilityHistory.reduce((s, v) => s + v, 0) / snapshot.volatilityHistory.length;
    const compressionLevel = avgVol > 0
      ? Math.max(0, 100 - (snapshot.volatility / avgVol) * 100)
      : 0;
    
    // Volume buildup
    const recentVolume = snapshot.volumeHistory.slice(-10);
    const olderVolume = snapshot.volumeHistory.slice(0, -10);
    const volumeBuildup = recentVolume.length > 0 && olderVolume.length > 0
      ? ((recentVolume.reduce((s, v) => s + v, 0) / recentVolume.length) /
         (olderVolume.reduce((s, v) => s + v, 0) / olderVolume.length) - 1) * 100
      : 0;
    const volumeBuildupScore = Math.max(0, Math.min(100, volumeBuildup * 2));
    
    // Pattern tension (from state)
    const patternTension = this.state.tensionHistory.length > 0
      ? this.state.tensionHistory[this.state.tensionHistory.length - 1]
      : 50;
    
    // Time compression (normalized)
    const timeCompression = Math.min(1, snapshot.timeSinceLastMove / (24 * 60 * 60 * 1000)); // Days
    
    // Trigger proximity (distance to support/resistance)
    // Simplified - would use actual support/resistance levels
    const triggerProximity = snapshot.patternConfluence > 3 ? 0.8 : 0.5;
    
    return SentienceMath.pressureSurgeProbability(
      compressionLevel,
      volumeBuildupScore,
      patternTension,
      timeCompression,
      triggerProximity
    );
  }
  
  // ==========================================================================
  // Helpers
  // ==========================================================================
  
  private clusterPatternsByPrice(patterns: MasterPattern[]): MasterPattern[][] {
    if (patterns.length === 0) return [];
    
    const sorted = [...patterns].sort((a, b) => a.currentPrice - b.currentPrice);
    const clusters: MasterPattern[][] = [];
    let currentCluster: MasterPattern[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const priceDiff = Math.abs(sorted[i].currentPrice - sorted[i - 1].currentPrice);
      const avgPrice = (sorted[i].currentPrice + sorted[i - 1].currentPrice) / 2;
      const threshold = avgPrice * 0.015; // 1.5% threshold
      
      if (priceDiff < threshold) {
        currentCluster.push(sorted[i]);
      } else {
        if (currentCluster.length > 0) {
          clusters.push(currentCluster);
        }
        currentCluster = [sorted[i]];
      }
    }
    
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }
    
    return clusters;
  }
  
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }
  
  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-Math.min(10, data.length));
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const avgFirst = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
    
    return Math.sign(avgSecond - avgFirst);
  }
  
  private determineSurgeDirection(
    snapshot: MarketSnapshot,
    emotionalScore: number
  ): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    // Combine momentum, emotion, and pattern confluence
    const momentumSignal = Math.sign(snapshot.momentum);
    const emotionSignal = Math.sign(emotionalScore);
    
    const combinedSignal = momentumSignal + emotionSignal;
    
    if (combinedSignal > 0) return 'BULLISH';
    if (combinedSignal < 0) return 'BEARISH';
    return 'NEUTRAL';
  }
  
  private determineSurgeImminence(
    surgeProbability: number,
    tension: number
  ): 'IMMEDIATE' | 'NEAR' | 'DISTANT' | 'NONE' {
    if (surgeProbability > 75 && tension > 70) return 'IMMEDIATE';
    if (surgeProbability > 60) return 'NEAR';
    if (surgeProbability > 40) return 'DISTANT';
    return 'NONE';
  }
  
  private calculateAnalysisConfidence(
    snapshot: MarketSnapshot,
    sentienceScore: number
  ): number {
    let confidence = 50;
    
    // High sentience = high confidence
    if (sentienceScore > 70) confidence += 20;
    else if (sentienceScore < 40) confidence -= 15;
    
    // High fusion quality = high confidence
    if (snapshot.fusionQuality > 70) confidence += 15;
    
    // High pattern confluence = high confidence
    if (snapshot.patternConfluence >= 3) confidence += 10;
    
    // Stable regime = high confidence
    if (snapshot.regimeStability > 70) confidence += 10;
    
    // Shield active = lower confidence (restricted environment)
    if (snapshot.shieldActive) confidence -= 15;
    
    return Math.max(0, Math.min(100, confidence));
  }
  
  // ==========================================================================
  // Getters
  // ==========================================================================
  
  getSentienceScore(): number {
    return this.state.sentienceScore;
  }
  
  getEmotionalHistory(): number[] {
    return [...this.state.emotionalHistory];
  }
  
  getTensionHistory(): number[] {
    return [...this.state.tensionHistory];
  }
  
  getStressHistory(): number[] {
    return [...this.state.stressHistory];
  }
  
  getLastUpdateTime(): number {
    return this.state.lastUpdate;
  }
}

// Singleton export
export const SentienceEngine = SentienceEngineClass.getInstance();

export default SentienceEngineClass;
