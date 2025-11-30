/**
 * Pattern Sync Engine - Ultra-Deep Pattern Synchronization
 * 
 * Integrates signals from all major engines to create unified pattern map.
 * Merges Shield, Threat, RL Core, Fusion, and Strategy Selector signals.
 */

import { PatternType, PatternSignificance, PatternRules } from './patternRules';
import { PatternRecord, PatternMemory } from './patternMemory';

/**
 * Signal source information
 */
interface SignalSource {
  engine: string;
  confidence: number;
  weight: number;
  data: any;
}

/**
 * Multi-engine pattern detection
 */
interface MultiEnginePattern {
  type: PatternType;
  sources: SignalSource[];
  mergedConfidence: number;
  mergedWeight: number;
  confluence: number;
  timestamp: number;
}

/**
 * Master pattern map entry
 */
export interface MasterPattern {
  id: string;
  type: PatternType;
  significance: PatternSignificance;
  confidence: number;
  weight: number;
  
  // Technical levels
  supportLevel: number;
  resistanceLevel: number;
  currentPrice: number;
  target: number;
  stopLoss: number;
  
  // Context
  symbol: string;
  timeframe: string;
  timestamp: number;
  
  // Multi-engine data
  sources: string[];
  confluence: number;
  shieldApproved: boolean;
  threatAssessed: boolean;
  rlLearned: boolean;
  fusionWeighted: boolean;
  
  // Risk assessment
  riskScore: number;        // 0-100
  opportunityScore: number; // 0-100
  heatIndex: number;        // 0-100 (volatility + activity)
  
  // Volatility signature
  volatilitySignature: number;
  volatilityPhase: string;
  
  // Drift detection
  driftSignal: number;      // -100 to 100
  structuralBreak: number;  // 0-100 probability
  
  // Regime
  regime: string;
  regimeStability: number;  // 0-100
}

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
 * Heatmap data
 */
export interface HeatmapData {
  symbol: string;
  timeframe: string;
  priceLevel: number;
  heatIndex: number;        // 0-100
  patternDensity: number;   // Patterns per price level
  volatility: number;
  momentum: number;
  timestamp: number;
}

/**
 * Risk zone
 */
export interface RiskZone {
  id: string;
  minPrice: number;
  maxPrice: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number;        // 0-100
  patterns: string[];       // Pattern IDs in this zone
  threatLevel: number;
  reasoning: string;
  timestamp: number;
}

/**
 * Opportunity zone
 */
export interface OpportunityZone {
  id: string;
  minPrice: number;
  maxPrice: number;
  opportunityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXCELLENT';
  opportunityScore: number; // 0-100
  patterns: string[];       // Pattern IDs in this zone
  confluence: number;
  reasoning: string;
  timestamp: number;
}

/**
 * Pattern Sync Engine
 */
class PatternSyncEngineClass {
  private static instance: PatternSyncEngineClass;
  
  // Master pattern map
  private masterPatternMap: Map<string, MasterPattern> = new Map();
  
  // Heatmap cache
  private heatmapCache: Map<string, HeatmapData[]> = new Map();
  
  // Risk and opportunity zones
  private riskZones: RiskZone[] = [];
  private opportunityZones: OpportunityZone[] = [];
  
  // Engine states
  private shieldActive: boolean = false;
  private threatLevel: number = 0;
  private currentRegime: string = 'STABLE';
  private volatilityLevel: number = 50;
  
  private constructor() {
    console.log('[Pattern Sync Engine] Initialized');
  }
  
  public static getInstance(): PatternSyncEngineClass {
    if (!PatternSyncEngineClass.instance) {
      PatternSyncEngineClass.instance = new PatternSyncEngineClass();
    }
    return PatternSyncEngineClass.instance;
  }
  
  // ==========================================================================
  // Core Pattern Analysis
  // ==========================================================================
  
  /**
   * Analyze pattern from multiple sources
   */
  analyzePattern(
    symbol: string,
    timeframe: string,
    price: number,
    signals: SignalSource[]
  ): PatternAnalysis | null {
    if (signals.length === 0) {
      return null;
    }
    
    // Merge signals to detect patterns
    const detectedPatterns = this.detectPatternsFromSignals(signals);
    
    if (detectedPatterns.length === 0) {
      return null;
    }
    
    // Select strongest pattern
    const strongestPattern = detectedPatterns.reduce((prev, current) =>
      current.mergedConfidence > prev.mergedConfidence ? current : prev
    );
    
    // Create master pattern
    const masterPattern = this.createMasterPattern(
      symbol,
      timeframe,
      price,
      strongestPattern
    );
    
    // Store in master map
    this.masterPatternMap.set(masterPattern.id, masterPattern);
    
    // Store in memory
    const patternRecord: PatternRecord = {
      id: masterPattern.id,
      type: masterPattern.type,
      significance: masterPattern.significance,
      confidence: masterPattern.confidence,
      weight: masterPattern.weight,
      symbol,
      timeframe,
      price,
      timestamp: Date.now(),
      volatility: this.volatilityLevel,
      momentum: 0, // Calculated from signals
      volume: 0,   // Calculated from signals
      supportLevel: masterPattern.supportLevel,
      resistanceLevel: masterPattern.resistanceLevel,
      target: masterPattern.target,
      stopLoss: masterPattern.stopLoss,
      sources: masterPattern.sources,
      confluence: masterPattern.confluence,
      regime: this.currentRegime,
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
    };
    
    PatternMemory.push(patternRecord, this.calculatePatternPriority(masterPattern));
    
    // Generate analysis
    return this.generatePatternAnalysis(masterPattern);
  }
  
  /**
   * Detect patterns from multi-engine signals
   */
  private detectPatternsFromSignals(signals: SignalSource[]): MultiEnginePattern[] {
    const patterns: MultiEnginePattern[] = [];
    const timestamp = Date.now();
    
    // Group signals by pattern type
    const patternGroups = new Map<PatternType, SignalSource[]>();
    
    signals.forEach(signal => {
      // Extract pattern type from signal data
      const patternType = this.extractPatternType(signal);
      if (patternType) {
        if (!patternGroups.has(patternType)) {
          patternGroups.set(patternType, []);
        }
        patternGroups.get(patternType)!.push(signal);
      }
    });
    
    // Create multi-engine patterns
    patternGroups.forEach((sources, type) => {
      const mergedConfidence = this.mergeConfidence(sources);
      const mergedWeight = this.mergeWeight(sources);
      const confluence = sources.length;
      
      patterns.push({
        type,
        sources,
        mergedConfidence,
        mergedWeight,
        confluence,
        timestamp,
      });
    });
    
    return patterns;
  }
  
  /**
   * Create master pattern from multi-engine pattern
   */
  private createMasterPattern(
    symbol: string,
    timeframe: string,
    price: number,
    multiPattern: MultiEnginePattern
  ): MasterPattern {
    const id = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate technical levels
    const supportLevel = price * 0.98;  // 2% below
    const resistanceLevel = price * 1.02; // 2% above
    const target = this.calculateTarget(multiPattern.type, price);
    const stopLoss = this.calculateStopLoss(multiPattern.type, price);
    
    // Calculate significance
    const significance = PatternRules.determineSignificance(
      multiPattern.mergedConfidence,
      multiPattern.mergedWeight,
      multiPattern.type
    );
    
    // Calculate scores
    const riskScore = this.calculateRiskScore(multiPattern);
    const opportunityScore = this.calculateOpportunityScore(multiPattern);
    const heatIndex = this.calculateHeatIndex(multiPattern);
    
    // Calculate volatility signature
    const volatilitySignature = PatternRules.calculateVolatilitySignature(
      this.volatilityLevel,
      []
    );
    
    // Calculate drift and structural break
    const driftSignal = this.calculateDriftSignal(multiPattern);
    const structuralBreak = this.calculateStructuralBreakProbability(multiPattern);
    
    // Regime stability
    const regimeStability = this.calculateRegimeStability();
    
    return {
      id,
      type: multiPattern.type,
      significance,
      confidence: multiPattern.mergedConfidence,
      weight: multiPattern.mergedWeight,
      supportLevel,
      resistanceLevel,
      currentPrice: price,
      target,
      stopLoss,
      symbol,
      timeframe,
      timestamp: multiPattern.timestamp,
      sources: multiPattern.sources.map(s => s.engine),
      confluence: multiPattern.confluence,
      shieldApproved: !this.shieldActive,
      threatAssessed: this.threatLevel < 80,
      rlLearned: multiPattern.sources.some(s => s.engine === 'RL_CORE'),
      fusionWeighted: multiPattern.sources.some(s => s.engine === 'FUSION'),
      riskScore,
      opportunityScore,
      heatIndex,
      volatilitySignature,
      volatilityPhase: this.getVolatilityPhase(),
      driftSignal,
      structuralBreak,
      regime: this.currentRegime,
      regimeStability,
    };
  }
  
  /**
   * Generate pattern analysis with action recommendation
   */
  private generatePatternAnalysis(pattern: MasterPattern): PatternAnalysis {
    const reasoning: string[] = [];
    const warnings: string[] = [];
    const opportunities: string[] = [];
    
    // Determine action
    let action: 'ENTER' | 'EXIT' | 'HOLD' | 'AVOID' = 'HOLD';
    let confidence = pattern.confidence;
    
    // Check shield status
    if (this.shieldActive) {
      action = 'AVOID';
      warnings.push('Shield is active - trading restricted');
      confidence *= 0.5;
    }
    
    // Check threat level
    if (this.threatLevel > 80) {
      action = 'AVOID';
      warnings.push('High threat level detected');
      confidence *= 0.6;
    } else if (this.threatLevel > 60) {
      warnings.push('Elevated threat level');
      confidence *= 0.8;
    }
    
    // Check confluence
    if (pattern.confluence >= 3) {
      opportunities.push(`High confluence (${pattern.confluence} sources)`);
      confidence *= 1.2;
    }
    
    // Check significance
    if (pattern.significance === 'CRITICAL' || pattern.significance === 'MAJOR') {
      reasoning.push(`${pattern.significance} significance pattern detected`);
      if (pattern.opportunityScore > 70) {
        action = action === 'HOLD' ? 'ENTER' : action;
        opportunities.push('High opportunity score');
      }
    }
    
    // Check risk score
    if (pattern.riskScore > 70) {
      warnings.push('High risk score detected');
      if (action === 'ENTER') action = 'HOLD';
    } else if (pattern.riskScore < 30) {
      opportunities.push('Low risk environment');
    }
    
    // Check structural break
    if (pattern.structuralBreak > 70) {
      warnings.push('High structural break probability');
      if (action === 'ENTER') action = 'AVOID';
    }
    
    // Check drift signal
    if (Math.abs(pattern.driftSignal) > 60) {
      warnings.push('Significant drift detected');
      reasoning.push(`Drift signal: ${pattern.driftSignal.toFixed(1)}`);
    }
    
    // Check regime stability
    if (pattern.regimeStability < 50) {
      warnings.push('Low regime stability');
    }
    
    // Pattern-specific logic
    const bullishPatterns = [
      PatternType.DOUBLE_BOTTOM,
      PatternType.INVERSE_HEAD_SHOULDERS,
      PatternType.FLAG_BULL,
      PatternType.ENGULFING_BULL,
      PatternType.HAMMER,
      PatternType.MORNING_STAR,
      PatternType.DIVERGENCE_BULL,
    ];
    
    const bearishPatterns = [
      PatternType.DOUBLE_TOP,
      PatternType.HEAD_SHOULDERS,
      PatternType.FLAG_BEAR,
      PatternType.ENGULFING_BEAR,
      PatternType.SHOOTING_STAR,
      PatternType.EVENING_STAR,
      PatternType.DIVERGENCE_BEAR,
    ];
    
    if (bullishPatterns.includes(pattern.type)) {
      reasoning.push('Bullish pattern detected');
      if (action === 'HOLD' && pattern.opportunityScore > 60) {
        action = 'ENTER';
      }
    } else if (bearishPatterns.includes(pattern.type)) {
      reasoning.push('Bearish pattern detected');
      if (action === 'ENTER') {
        action = 'AVOID';
      }
      warnings.push('Consider exit or avoid entry');
    }
    
    // Final confidence adjustment
    confidence = Math.max(0, Math.min(100, confidence));
    
    return {
      pattern,
      action,
      confidence,
      reasoning,
      warnings,
      opportunities,
    };
  }
  
  // ==========================================================================
  // Signal Merging
  // ==========================================================================
  
  /**
   * Merge signals from multiple engines
   */
  mergeSignals(signals: SignalSource[]): MultiEnginePattern[] {
    return this.detectPatternsFromSignals(signals);
  }
  
  /**
   * Merge confidence from multiple sources
   */
  private mergeConfidence(sources: SignalSource[]): number {
    if (sources.length === 0) return 0;
    
    // Weighted average
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = sources.reduce((sum, s) => sum + s.confidence * s.weight, 0);
    
    const baseConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    // Confluence boost
    const confluenceBoost = Math.min(20, (sources.length - 1) * 5);
    
    return Math.min(100, baseConfidence + confluenceBoost);
  }
  
  /**
   * Merge weight from multiple sources
   */
  private mergeWeight(sources: SignalSource[]): number {
    if (sources.length === 0) return 0;
    
    // Average weight
    const avgWeight = sources.reduce((sum, s) => sum + s.weight, 0) / sources.length;
    
    // Confluence multiplier
    const confluenceMultiplier = 1 + (sources.length - 1) * 0.15;
    
    return avgWeight * confluenceMultiplier;
  }
  
  /**
   * Extract pattern type from signal
   */
  private extractPatternType(signal: SignalSource): PatternType | null {
    // Check if signal data contains pattern type
    if (signal.data && signal.data.patternType) {
      return signal.data.patternType as PatternType;
    }
    
    // Infer from engine and data
    if (signal.engine === 'SHIELD' && signal.confidence > 70) {
      return PatternType.CUSTOM; // Shield protective pattern
    }
    
    if (signal.engine === 'THREAT' && signal.confidence > 70) {
      return PatternType.CUSTOM; // Threat pattern
    }
    
    if (signal.data && signal.data.pattern) {
      return signal.data.pattern as PatternType;
    }
    
    return null;
  }
  
  // ==========================================================================
  // Master Pattern Map
  // ==========================================================================
  
  /**
   * Update master pattern map
   */
  updateMasterPatternMap(patterns: MasterPattern[]): void {
    patterns.forEach(pattern => {
      this.masterPatternMap.set(pattern.id, pattern);
    });
    
    // Cleanup old patterns (older than 24 hours)
    const cutoffTime = Date.now() - 24 * 60 * 60 * 1000;
    this.masterPatternMap.forEach((pattern, id) => {
      if (pattern.timestamp < cutoffTime) {
        this.masterPatternMap.delete(id);
      }
    });
  }
  
  /**
   * Get master pattern map
   */
  getMasterPatternMap(): Map<string, MasterPattern> {
    return new Map(this.masterPatternMap);
  }
  
  /**
   * Get pattern by ID
   */
  getPattern(id: string): MasterPattern | undefined {
    return this.masterPatternMap.get(id);
  }
  
  /**
   * Get patterns by symbol
   */
  getPatternsBySymbol(symbol: string): MasterPattern[] {
    return Array.from(this.masterPatternMap.values())
      .filter(p => p.symbol === symbol);
  }
  
  /**
   * Get active patterns (high significance)
   */
  getActivePatterns(): MasterPattern[] {
    return Array.from(this.masterPatternMap.values())
      .filter(p => 
        p.significance === 'MAJOR' || 
        p.significance === 'CRITICAL'
      );
  }
  
  // ==========================================================================
  // Heatmap Generation
  // ==========================================================================
  
  /**
   * Update heatmap for symbol/timeframe
   */
  updateHeatmap(symbol: string, timeframe: string, priceRange: number[]): HeatmapData[] {
    const heatmap: HeatmapData[] = [];
    const patterns = this.getPatternsBySymbol(symbol);
    
    // Create price buckets
    const minPrice = Math.min(...priceRange);
    const maxPrice = Math.max(...priceRange);
    const bucketSize = (maxPrice - minPrice) / 20; // 20 buckets
    
    for (let i = 0; i < 20; i++) {
      const priceLevel = minPrice + i * bucketSize;
      
      // Count patterns near this price level
      const nearbyPatterns = patterns.filter(p =>
        Math.abs(p.currentPrice - priceLevel) < bucketSize
      );
      
      const patternDensity = nearbyPatterns.length;
      
      // Calculate heatIndex
      const avgHeatIndex = nearbyPatterns.length > 0
        ? nearbyPatterns.reduce((sum, p) => sum + p.heatIndex, 0) / nearbyPatterns.length
        : 0;
      
      // Calculate volatility
      const avgVolatility = nearbyPatterns.length > 0
        ? nearbyPatterns.reduce((sum, p) => sum + p.volatilitySignature, 0) / nearbyPatterns.length
        : this.volatilityLevel;
      
      heatmap.push({
        symbol,
        timeframe,
        priceLevel,
        heatIndex: avgHeatIndex,
        patternDensity,
        volatility: avgVolatility,
        momentum: 0, // Calculate from patterns
        timestamp: Date.now(),
      });
    }
    
    // Cache heatmap
    const key = `${symbol}_${timeframe}`;
    this.heatmapCache.set(key, heatmap);
    
    return heatmap;
  }
  
  /**
   * Get cached heatmap
   */
  getHeatmap(symbol: string, timeframe: string): HeatmapData[] | undefined {
    const key = `${symbol}_${timeframe}`;
    return this.heatmapCache.get(key);
  }
  
  // ==========================================================================
  // Risk & Opportunity Zones
  // ==========================================================================
  
  /**
   * Compute risk zones
   */
  computeRiskZones(symbol: string): RiskZone[] {
    const patterns = this.getPatternsBySymbol(symbol);
    const zones: RiskZone[] = [];
    
    // Group patterns by risk score
    const highRiskPatterns = patterns.filter(p => p.riskScore > 70);
    
    if (highRiskPatterns.length === 0) {
      return zones;
    }
    
    // Find price clusters
    const priceClusters = this.clusterByPrice(highRiskPatterns);
    
    priceClusters.forEach((clusterPatterns, index) => {
      const prices = clusterPatterns.map(p => p.currentPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      const avgRiskScore = clusterPatterns.reduce((sum, p) => sum + p.riskScore, 0) / clusterPatterns.length;
      const avgThreatLevel = clusterPatterns.reduce((sum, p) => sum + p.threatLevel, 0) / clusterPatterns.length;
      
      const riskLevel = avgRiskScore > 85 ? 'CRITICAL' :
                        avgRiskScore > 70 ? 'HIGH' :
                        avgRiskScore > 50 ? 'MEDIUM' : 'LOW';
      
      zones.push({
        id: `risk_${index}_${Date.now()}`,
        minPrice,
        maxPrice,
        riskLevel,
        riskScore: avgRiskScore,
        patterns: clusterPatterns.map(p => p.id),
        threatLevel: avgThreatLevel,
        reasoning: `${clusterPatterns.length} high-risk patterns detected`,
        timestamp: Date.now(),
      });
    });
    
    this.riskZones = zones;
    return zones;
  }
  
  /**
   * Compute opportunity zones
   */
  computeOpportunityZones(symbol: string): OpportunityZone[] {
    const patterns = this.getPatternsBySymbol(symbol);
    const zones: OpportunityZone[] = [];
    
    // Group patterns by opportunity score
    const highOpportunityPatterns = patterns.filter(p => p.opportunityScore > 60);
    
    if (highOpportunityPatterns.length === 0) {
      return zones;
    }
    
    // Find price clusters
    const priceClusters = this.clusterByPrice(highOpportunityPatterns);
    
    priceClusters.forEach((clusterPatterns, index) => {
      const prices = clusterPatterns.map(p => p.currentPrice);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      const avgOpportunityScore = clusterPatterns.reduce((sum, p) => sum + p.opportunityScore, 0) / clusterPatterns.length;
      const avgConfluence = clusterPatterns.reduce((sum, p) => sum + p.confluence, 0) / clusterPatterns.length;
      
      const opportunityLevel = avgOpportunityScore > 85 ? 'EXCELLENT' :
                               avgOpportunityScore > 70 ? 'HIGH' :
                               avgOpportunityScore > 55 ? 'MEDIUM' : 'LOW';
      
      zones.push({
        id: `opportunity_${index}_${Date.now()}`,
        minPrice,
        maxPrice,
        opportunityLevel,
        opportunityScore: avgOpportunityScore,
        patterns: clusterPatterns.map(p => p.id),
        confluence: avgConfluence,
        reasoning: `${clusterPatterns.length} high-opportunity patterns detected`,
        timestamp: Date.now(),
      });
    });
    
    this.opportunityZones = zones;
    return zones;
  }
  
  /**
   * Get risk zones
   */
  getRiskZones(): RiskZone[] {
    return [...this.riskZones];
  }
  
  /**
   * Get opportunity zones
   */
  getOpportunityZones(): OpportunityZone[] {
    return [...this.opportunityZones];
  }
  
  // ==========================================================================
  // Calculations
  // ==========================================================================
  
  private calculateTarget(type: PatternType, price: number): number {
    // Default 3% target
    return price * 1.03;
  }
  
  private calculateStopLoss(type: PatternType, price: number): number {
    // Default 1.5% stop
    return price * 0.985;
  }
  
  private calculateRiskScore(pattern: MultiEnginePattern): number {
    let score = 50;
    
    // Increase score for threat signals
    if (this.threatLevel > 70) score += 20;
    else if (this.threatLevel > 50) score += 10;
    
    // Increase score for shield activation
    if (this.shieldActive) score += 15;
    
    // Decrease score for high confluence
    if (pattern.confluence >= 3) score -= 10;
    
    // Increase score for high volatility
    if (this.volatilityLevel > 80) score += 15;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateOpportunityScore(pattern: MultiEnginePattern): number {
    let score = 50;
    
    // Increase score for confluence
    score += pattern.confluence * 8;
    
    // Increase score for high confidence
    if (pattern.mergedConfidence > 80) score += 15;
    else if (pattern.mergedConfidence > 60) score += 10;
    
    // Decrease score for shield activation
    if (this.shieldActive) score -= 20;
    
    // Decrease score for high threat
    if (this.threatLevel > 70) score -= 15;
    
    // Increase score for stable regime
    const regimeStability = this.calculateRegimeStability();
    if (regimeStability > 70) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateHeatIndex(pattern: MultiEnginePattern): number {
    // Combine volatility and activity
    const volatilityComponent = this.volatilityLevel * 0.6;
    const activityComponent = pattern.confluence * 10;
    
    return Math.min(100, volatilityComponent + activityComponent);
  }
  
  private calculateDriftSignal(pattern: MultiEnginePattern): number {
    // Placeholder - would calculate from price action
    return 0;
  }
  
  private calculateStructuralBreakProbability(pattern: MultiEnginePattern): number {
    let probability = 30;
    
    // Increase for high volatility
    if (this.volatilityLevel > 80) probability += 20;
    
    // Increase for regime instability
    const regimeStability = this.calculateRegimeStability();
    if (regimeStability < 50) probability += 15;
    
    // Increase for high threat
    if (this.threatLevel > 70) probability += 15;
    
    return Math.min(100, probability);
  }
  
  private calculateRegimeStability(): number {
    // Placeholder - would analyze regime consistency
    return 70;
  }
  
  private getVolatilityPhase(): string {
    if (this.volatilityLevel > 80) return 'HIGH';
    if (this.volatilityLevel > 60) return 'ELEVATED';
    if (this.volatilityLevel > 40) return 'MODERATE';
    if (this.volatilityLevel > 20) return 'LOW';
    return 'MINIMAL';
  }
  
  private calculatePatternPriority(pattern: MasterPattern): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (pattern.significance === 'CRITICAL') return 'CRITICAL';
    if (pattern.significance === 'MAJOR') return 'HIGH';
    if (pattern.significance === 'MODERATE') return 'MEDIUM';
    return 'LOW';
  }
  
  private clusterByPrice(patterns: MasterPattern[]): MasterPattern[][] {
    if (patterns.length === 0) return [];
    
    // Sort by price
    const sorted = [...patterns].sort((a, b) => a.currentPrice - b.currentPrice);
    
    const clusters: MasterPattern[][] = [];
    let currentCluster: MasterPattern[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const priceDiff = Math.abs(sorted[i].currentPrice - sorted[i - 1].currentPrice);
      const avgPrice = (sorted[i].currentPrice + sorted[i - 1].currentPrice) / 2;
      const threshold = avgPrice * 0.02; // 2% threshold
      
      if (priceDiff < threshold) {
        currentCluster.push(sorted[i]);
      } else {
        clusters.push(currentCluster);
        currentCluster = [sorted[i]];
      }
    }
    
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }
    
    return clusters;
  }
  
  // ==========================================================================
  // Engine State Updates
  // ==========================================================================
  
  updateShieldStatus(active: boolean): void {
    this.shieldActive = active;
  }
  
  updateThreatLevel(level: number): void {
    this.threatLevel = Math.max(0, Math.min(100, level));
  }
  
  updateRegime(regime: string): void {
    this.currentRegime = regime;
    PatternRules.setCurrentRegime(regime);
  }
  
  updateVolatilityLevel(level: number): void {
    this.volatilityLevel = Math.max(0, Math.min(100, level));
  }
  
  // ==========================================================================
  // Summary & Statistics
  // ==========================================================================
  
  /**
   * Get pattern summary
   */
  getPatternSummary() {
    const patterns = Array.from(this.masterPatternMap.values());
    
    const totalPatterns = patterns.length;
    const activePatterns = this.getActivePatterns().length;
    
    const avgConfidence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;
    
    const avgRiskScore = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.riskScore, 0) / patterns.length
      : 0;
    
    const avgOpportunityScore = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.opportunityScore, 0) / patterns.length
      : 0;
    
    const significanceDistribution = {
      MINOR: patterns.filter(p => p.significance === 'MINOR').length,
      MODERATE: patterns.filter(p => p.significance === 'MODERATE').length,
      MAJOR: patterns.filter(p => p.significance === 'MAJOR').length,
      CRITICAL: patterns.filter(p => p.significance === 'CRITICAL').length,
    };
    
    return {
      totalPatterns,
      activePatterns,
      averageConfidence: avgConfidence,
      averageRiskScore: avgRiskScore,
      averageOpportunityScore: avgOpportunityScore,
      significanceDistribution,
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
      currentRegime: this.currentRegime,
      volatilityLevel: this.volatilityLevel,
      riskZonesCount: this.riskZones.length,
      opportunityZonesCount: this.opportunityZones.length,
    };
  }
}

// Singleton export
export const PatternSyncEngine = PatternSyncEngineClass.getInstance();

// Export class for testing
export default PatternSyncEngineClass;
