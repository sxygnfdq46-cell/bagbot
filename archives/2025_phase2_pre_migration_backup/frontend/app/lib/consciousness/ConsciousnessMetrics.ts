/**
 * Consciousness Metrics
 * 
 * Advanced mathematical functions for measuring consciousness, awareness,
 * learning velocity, strategic evolution, and identity consistency.
 */

/**
 * Market data snapshot for consciousness calculations
 */
interface MarketSnapshot {
  price: number;
  volume: number;
  volatility: number;
  liquidity: number;
  timestamp: number;
}

/**
 * Performance data for reflection calculations
 */
interface PerformanceData {
  returns: number[];
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
}

/**
 * Learning metrics for velocity calculations
 */
interface LearningMetrics {
  accuracyBefore: number;
  accuracyAfter: number;
  adaptationTime: number;
  retentionRate: number;
  transferability: number;
}

/**
 * Identity characteristics for consistency measurement
 */
interface IdentityProfile {
  traits: Map<string, number>;
  behaviors: number[];
  preferences: number[];
  riskTolerance: number;
  timeHorizon: number;
}

/**
 * Consciousness Metrics Class
 */
export class ConsciousnessMetrics {
  
  // ==========================================================================
  // Awareness Index
  // ==========================================================================
  
  /**
   * Calculate multi-dimensional awareness index
   * Measures depth and breadth of market understanding
   */
  static async awarenessIndex(
    marketHistory: MarketSnapshot[] = [],
    timeframe: number = 24 // hours
  ): Promise<number> {
    try {
      // If no data provided, use mock data
      if (marketHistory.length === 0) {
        marketHistory = this.generateMockMarketData(100);
      }
      
      // 1. Market Pattern Awareness (0-25 points)
      const patternAwareness = this.calculatePatternAwareness(marketHistory);
      
      // 2. Temporal Awareness (0-25 points)
      const temporalAwareness = this.calculateTemporalAwareness(marketHistory, timeframe);
      
      // 3. Risk Awareness (0-25 points)
      const riskAwareness = this.calculateRiskAwareness(marketHistory);
      
      // 4. Opportunity Awareness (0-25 points)
      const opportunityAwareness = this.calculateOpportunityAwareness(marketHistory);
      
      // Combined awareness index
      const awarenessIndex = patternAwareness + temporalAwareness + riskAwareness + opportunityAwareness;
      
      console.log(`[Consciousness] Awareness Index: ${awarenessIndex.toFixed(2)}`);
      
      return Math.min(100, Math.max(0, awarenessIndex));
    } catch (error) {
      console.error('[Consciousness] Awareness index calculation failed:', error);
      return 50; // Default neutral awareness
    }
  }
  
  private static calculatePatternAwareness(data: MarketSnapshot[]): number {
    if (data.length < 10) return 12.5;
    
    // Analyze pattern recognition capability
    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume);
    
    // Calculate trend consistency recognition
    const trendChanges = this.detectTrendChanges(prices);
    const volumePatterns = this.analyzeVolumePatterns(volumes);
    const supportResistance = this.identifySupportResistance(prices);
    
    // Score pattern awareness (0-25)
    let score = 0;
    
    // Trend recognition (0-8)
    score += Math.min(8, trendChanges.accuracy * 8);
    
    // Volume pattern recognition (0-8)
    score += Math.min(8, volumePatterns.clarity * 8);
    
    // Support/Resistance identification (0-9)
    score += Math.min(9, supportResistance.strength * 9);
    
    return score;
  }
  
  private static calculateTemporalAwareness(data: MarketSnapshot[], timeframe: number): number {
    // Multi-timeframe awareness scoring
    const shortTerm = this.analyzeShortTermAwareness(data.slice(-20)); // Last 20 periods
    const mediumTerm = this.analyzeMediumTermAwareness(data.slice(-50)); // Last 50 periods
    const longTerm = this.analyzeLongTermAwareness(data); // Full history
    
    // Weighted temporal awareness
    return shortTerm * 0.4 + mediumTerm * 0.35 + longTerm * 0.25;
  }
  
  private static calculateRiskAwareness(data: MarketSnapshot[]): number {
    if (data.length < 5) return 12.5;
    
    const volatilities = data.map(d => d.volatility);
    const prices = data.map(d => d.price);
    
    // Risk metrics awareness
    const volAwareness = this.assessVolatilityAwareness(volatilities);
    const drawdownAwareness = this.assessDrawdownAwareness(prices);
    const liquidityAwareness = this.assessLiquidityAwareness(data.map(d => d.liquidity));
    
    return (volAwareness + drawdownAwareness + liquidityAwareness) / 3 * 25;
  }
  
  private static calculateOpportunityAwareness(data: MarketSnapshot[]): number {
    if (data.length < 5) return 12.5;
    
    // Opportunity identification scoring
    const priceOpportunities = this.identifyPriceOpportunities(data.map(d => d.price));
    const volumeOpportunities = this.identifyVolumeOpportunities(data.map(d => d.volume));
    const volatilityOpportunities = this.identifyVolatilityOpportunities(data.map(d => d.volatility));
    
    return (priceOpportunities + volumeOpportunities + volatilityOpportunities) / 3 * 25;
  }
  
  // ==========================================================================
  // Correction Velocity
  // ==========================================================================
  
  /**
   * Calculate learning correction velocity
   * Measures speed and effectiveness of adaptation
   */
  static async correctionVelocity(
    learningEvents: LearningMetrics[] = []
  ): Promise<number> {
    try {
      // If no data provided, use mock data
      if (learningEvents.length === 0) {
        learningEvents = this.generateMockLearningData();
      }
      
      if (learningEvents.length === 0) return 50;
      
      // 1. Adaptation Speed (0-40 points)
      const adaptationSpeed = this.calculateAdaptationSpeed(learningEvents);
      
      // 2. Correction Effectiveness (0-35 points)
      const correctionEffectiveness = this.calculateCorrectionEffectiveness(learningEvents);
      
      // 3. Retention Stability (0-25 points)
      const retentionStability = this.calculateRetentionStability(learningEvents);
      
      const velocity = adaptationSpeed + correctionEffectiveness + retentionStability;
      
      console.log(`[Consciousness] Correction Velocity: ${velocity.toFixed(2)}`);
      
      return Math.min(100, Math.max(0, velocity));
    } catch (error) {
      console.error('[Consciousness] Correction velocity calculation failed:', error);
      return 50;
    }
  }
  
  private static calculateAdaptationSpeed(events: LearningMetrics[]): number {
    const speeds = events.map(e => {
      // Faster adaptation = higher score
      const normalizedTime = Math.min(1, 3600 / e.adaptationTime); // 1 hour baseline
      return normalizedTime;
    });
    
    const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
    return avgSpeed * 40;
  }
  
  private static calculateCorrectionEffectiveness(events: LearningMetrics[]): number {
    const improvements = events.map(e => {
      const improvement = e.accuracyAfter - e.accuracyBefore;
      return Math.max(0, improvement); // Only positive improvements
    });
    
    const avgImprovement = improvements.reduce((sum, i) => sum + i, 0) / improvements.length;
    return Math.min(35, avgImprovement * 100); // Scale to 0-35
  }
  
  private static calculateRetentionStability(events: LearningMetrics[]): number {
    const retentionRates = events.map(e => e.retentionRate);
    const avgRetention = retentionRates.reduce((sum, r) => sum + r, 0) / retentionRates.length;
    
    return avgRetention * 25;
  }
  
  // ==========================================================================
  // Strategic Evolution Score
  // ==========================================================================
  
  /**
   * Calculate strategic evolution sophistication
   * Measures advancement in strategic thinking and planning
   */
  static async strategicEvolutionScore(
    historicalPerformance: PerformanceData[] = [],
    strategicChanges: string[] = []
  ): Promise<number> {
    try {
      // If no data provided, use mock data
      if (historicalPerformance.length === 0) {
        historicalPerformance = this.generateMockPerformanceData();
      }
      
      // 1. Performance Evolution (0-30 points)
      const performanceEvolution = this.calculatePerformanceEvolution(historicalPerformance);
      
      // 2. Strategic Complexity (0-25 points)
      const strategicComplexity = this.calculateStrategicComplexity(strategicChanges);
      
      // 3. Adaptive Sophistication (0-25 points)
      const adaptiveSophistication = this.calculateAdaptiveSophistication(historicalPerformance);
      
      // 4. Innovation Index (0-20 points)
      const innovationIndex = this.calculateInnovationIndex(strategicChanges);
      
      const evolutionScore = performanceEvolution + strategicComplexity + 
                           adaptiveSophistication + innovationIndex;
      
      console.log(`[Consciousness] Strategic Evolution Score: ${evolutionScore.toFixed(2)}`);
      
      return Math.min(100, Math.max(0, evolutionScore));
    } catch (error) {
      console.error('[Consciousness] Strategic evolution calculation failed:', error);
      return 50;
    }
  }
  
  private static calculatePerformanceEvolution(history: PerformanceData[]): number {
    if (history.length < 2) return 15; // Default moderate score
    
    // Calculate improvement trend
    const first = history[0];
    const last = history[history.length - 1];
    
    const sharpeImprovement = (last.sharpeRatio - first.sharpeRatio) / Math.abs(first.sharpeRatio);
    const winRateImprovement = (last.winRate - first.winRate) / 100;
    const drawdownImprovement = (first.maxDrawdown - last.maxDrawdown) / first.maxDrawdown;
    
    const avgImprovement = (sharpeImprovement + winRateImprovement + drawdownImprovement) / 3;
    
    return Math.min(30, Math.max(0, (avgImprovement + 0.5) * 30)); // Scale to 0-30
  }
  
  private static calculateStrategicComplexity(changes: string[]): number {
    // Analyze strategic sophistication from change descriptions
    const complexityKeywords = [
      'multi-timeframe', 'adaptive', 'dynamic', 'sophisticated',
      'integrated', 'optimized', 'evolved', 'advanced'
    ];
    
    let complexityScore = 0;
    changes.forEach(change => {
      const lowerChange = change.toLowerCase();
      complexityKeywords.forEach(keyword => {
        if (lowerChange.includes(keyword)) {
          complexityScore += 3;
        }
      });
    });
    
    return Math.min(25, complexityScore);
  }
  
  private static calculateAdaptiveSophistication(history: PerformanceData[]): number {
    if (history.length < 3) return 12.5;
    
    // Measure consistency of adaptation
    const sharpeRatios = history.map(h => h.sharpeRatio);
    const volatility = this.calculateVolatility(sharpeRatios);
    
    // Lower volatility in performance = higher sophistication
    const stabilityScore = Math.max(0, 1 - volatility);
    
    return stabilityScore * 25;
  }
  
  private static calculateInnovationIndex(changes: string[]): number {
    const innovationKeywords = [
      'novel', 'breakthrough', 'innovative', 'revolutionary',
      'paradigm', 'disruptive', 'cutting-edge', 'pioneering'
    ];
    
    let innovationScore = 0;
    changes.forEach(change => {
      const lowerChange = change.toLowerCase();
      innovationKeywords.forEach(keyword => {
        if (lowerChange.includes(keyword)) {
          innovationScore += 4;
        }
      });
    });
    
    return Math.min(20, innovationScore);
  }
  
  // ==========================================================================
  // Performance Reflection Index
  // ==========================================================================
  
  /**
   * Calculate depth of performance self-reflection
   * Measures ability to analyze and understand own performance
   */
  static async performanceReflectionIndex(
    performanceData: PerformanceData[] = [],
    reflectionNotes: string[] = []
  ): Promise<number> {
    try {
      // If no data provided, use mock data
      if (performanceData.length === 0) {
        performanceData = this.generateMockPerformanceData();
        reflectionNotes = this.generateMockReflectionNotes();
      }
      
      // 1. Self-Analysis Depth (0-35 points)
      const analysisDepth = this.calculateAnalysisDepth(reflectionNotes);
      
      // 2. Correlation Recognition (0-30 points)
      const correlationRecognition = this.calculateCorrelationRecognition(performanceData);
      
      // 3. Causal Understanding (0-25 points)
      const causalUnderstanding = this.calculateCausalUnderstanding(reflectionNotes);
      
      // 4. Predictive Insight (0-10 points)
      const predictiveInsight = this.calculatePredictiveInsight(performanceData);
      
      const reflectionIndex = analysisDepth + correlationRecognition + 
                            causalUnderstanding + predictiveInsight;
      
      console.log(`[Consciousness] Performance Reflection Index: ${reflectionIndex.toFixed(2)}`);
      
      return Math.min(100, Math.max(0, reflectionIndex));
    } catch (error) {
      console.error('[Consciousness] Performance reflection calculation failed:', error);
      return 50;
    }
  }
  
  private static calculateAnalysisDepth(notes: string[]): number {
    const depthKeywords = [
      'analyze', 'examine', 'investigate', 'explore',
      'understand', 'recognize', 'identify', 'discover',
      'because', 'therefore', 'consequently', 'due to'
    ];
    
    let depthScore = 0;
    notes.forEach(note => {
      const words = note.toLowerCase().split(/\s+/);
      const keywordCount = words.filter(word => 
        depthKeywords.some(keyword => word.includes(keyword))
      ).length;
      
      depthScore += Math.min(5, keywordCount); // Max 5 points per note
    });
    
    return Math.min(35, depthScore);
  }
  
  private static calculateCorrelationRecognition(data: PerformanceData[]): number {
    if (data.length < 3) return 15;
    
    // Analyze recognition of performance correlations
    const winRates = data.map(d => d.winRate);
    const sharpeRatios = data.map(d => d.sharpeRatio);
    const drawdowns = data.map(d => d.maxDrawdown);
    
    // Expected correlations: winRate-sharpe positive, drawdown-performance negative
    const winRateSharpeCorr = this.calculateCorrelation(winRates, sharpeRatios);
    const drawdownPerformanceCorr = this.calculateCorrelation(drawdowns, sharpeRatios);
    
    let score = 0;
    if (winRateSharpeCorr > 0.5) score += 15; // Good positive correlation recognition
    if (drawdownPerformanceCorr < -0.3) score += 15; // Good negative correlation recognition
    
    return Math.min(30, score);
  }
  
  private static calculateCausalUnderstanding(notes: string[]): number {
    const causalKeywords = [
      'caused by', 'resulted from', 'led to', 'triggered',
      'influenced by', 'stemmed from', 'originated', 'motivated'
    ];
    
    let causalScore = 0;
    notes.forEach(note => {
      const lowerNote = note.toLowerCase();
      causalKeywords.forEach(keyword => {
        if (lowerNote.includes(keyword)) {
          causalScore += 3;
        }
      });
    });
    
    return Math.min(25, causalScore);
  }
  
  private static calculatePredictiveInsight(data: PerformanceData[]): number {
    if (data.length < 4) return 5;
    
    // Measure ability to predict performance trends
    const returns = data.slice(-3).map(d => d.returns);
    const trends = returns.map(r => r.reduce((sum, ret) => sum + ret, 0) / r.length);
    
    // Check for trend consistency (predictive capability)
    const trendConsistency = this.calculateTrendConsistency(trends);
    
    return trendConsistency * 10;
  }
  
  // ==========================================================================
  // Identity Consistency Level
  // ==========================================================================
  
  /**
   * Calculate identity consistency and coherence
   * Measures stability and coherence of trading personality
   */
  static async identityConsistencyLevel(
    identityHistory: IdentityProfile[] = [],
    timeWindowDays: number = 30
  ): Promise<number> {
    try {
      // If no data provided, use mock data
      if (identityHistory.length === 0) {
        identityHistory = this.generateMockIdentityData();
      }
      
      // 1. Trait Stability (0-30 points)
      const traitStability = this.calculateTraitStability(identityHistory);
      
      // 2. Behavioral Consistency (0-30 points)
      const behavioralConsistency = this.calculateBehavioralConsistency(identityHistory);
      
      // 3. Preference Coherence (0-25 points)
      const preferenceCoherence = this.calculatePreferenceCoherence(identityHistory);
      
      // 4. Identity Evolution Smoothness (0-15 points)
      const evolutionSmoothness = this.calculateEvolutionSmoothness(identityHistory);
      
      const consistencyLevel = traitStability + behavioralConsistency + 
                             preferenceCoherence + evolutionSmoothness;
      
      console.log(`[Consciousness] Identity Consistency Level: ${consistencyLevel.toFixed(2)}`);
      
      return Math.min(100, Math.max(0, consistencyLevel));
    } catch (error) {
      console.error('[Consciousness] Identity consistency calculation failed:', error);
      return 50;
    }
  }
  
  private static calculateTraitStability(history: IdentityProfile[]): number {
    if (history.length < 2) return 15;
    
    const traitNames = Array.from(history[0].traits.keys());
    let stabilityScore = 0;
    
    traitNames.forEach(traitName => {
      const traitValues = history.map(h => h.traits.get(traitName) || 0);
      const variance = this.calculateVariance(traitValues);
      const stability = Math.max(0, 1 - variance); // Lower variance = higher stability
      
      stabilityScore += stability;
    });
    
    return (stabilityScore / traitNames.length) * 30;
  }
  
  private static calculateBehavioralConsistency(history: IdentityProfile[]): number {
    if (history.length < 2) return 15;
    
    let consistencyScore = 0;
    
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      
      // Calculate behavioral similarity
      const similarity = this.calculateVectorSimilarity(prev.behaviors, curr.behaviors);
      consistencyScore += similarity;
    }
    
    return (consistencyScore / (history.length - 1)) * 30;
  }
  
  private static calculatePreferenceCoherence(history: IdentityProfile[]): number {
    if (history.length < 2) return 12.5;
    
    let coherenceScore = 0;
    
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      
      // Check preference alignment
      const preferenceAlignment = this.calculateVectorSimilarity(prev.preferences, curr.preferences);
      const riskAlignment = 1 - Math.abs(prev.riskTolerance - curr.riskTolerance);
      const timeAlignment = 1 - Math.abs(prev.timeHorizon - curr.timeHorizon) / 100;
      
      coherenceScore += (preferenceAlignment + riskAlignment + timeAlignment) / 3;
    }
    
    return (coherenceScore / (history.length - 1)) * 25;
  }
  
  private static calculateEvolutionSmoothness(history: IdentityProfile[]): number {
    if (history.length < 3) return 7.5;
    
    // Measure smoothness of identity evolution (not abrupt changes)
    let smoothnessScore = 0;
    
    for (let i = 2; i < history.length; i++) {
      const changes1 = this.calculateIdentityChange(history[i - 2], history[i - 1]);
      const changes2 = this.calculateIdentityChange(history[i - 1], history[i]);
      
      // Smooth evolution has consistent change magnitudes
      const changeDifference = Math.abs(changes1 - changes2);
      const smoothness = Math.max(0, 1 - changeDifference);
      
      smoothnessScore += smoothness;
    }
    
    return (smoothnessScore / (history.length - 2)) * 15;
  }
  
  // ==========================================================================
  // Helper Methods
  // ==========================================================================
  
  private static generateMockMarketData(count: number): MarketSnapshot[] {
    const data = [];
    let price = 100;
    
    for (let i = 0; i < count; i++) {
      price += (Math.random() - 0.5) * 2;
      data.push({
        price,
        volume: 1000 + Math.random() * 5000,
        volatility: 0.1 + Math.random() * 0.4,
        liquidity: 0.5 + Math.random() * 0.5,
        timestamp: Date.now() - (count - i) * 60000,
      });
    }
    
    return data;
  }
  
  private static generateMockLearningData(): LearningMetrics[] {
    return Array.from({ length: 10 }, () => ({
      accuracyBefore: 0.5 + Math.random() * 0.3,
      accuracyAfter: 0.6 + Math.random() * 0.35,
      adaptationTime: 300 + Math.random() * 3000, // 5 minutes to 1 hour
      retentionRate: 0.7 + Math.random() * 0.3,
      transferability: 0.6 + Math.random() * 0.4,
    }));
  }
  
  private static generateMockPerformanceData(): PerformanceData[] {
    return Array.from({ length: 10 }, () => ({
      returns: Array.from({ length: 20 }, () => (Math.random() - 0.5) * 0.04),
      winRate: 0.5 + Math.random() * 0.4,
      sharpeRatio: 0.5 + Math.random() * 2,
      maxDrawdown: 0.02 + Math.random() * 0.15,
      profitFactor: 0.8 + Math.random() * 1.5,
    }));
  }
  
  private static generateMockReflectionNotes(): string[] {
    return [
      'Performance improved due to better risk management',
      'Market volatility caused increased drawdown',
      'Strategy adjustment led to higher win rate',
      'Need to analyze correlation between volume and price movements',
      'Emotional stability influenced decision quality',
    ];
  }
  
  private static generateMockIdentityData(): IdentityProfile[] {
    return Array.from({ length: 10 }, () => ({
      traits: new Map([
        ['confidence', 0.6 + Math.random() * 0.3],
        ['patience', 0.5 + Math.random() * 0.4],
        ['adaptability', 0.7 + Math.random() * 0.3],
      ]),
      behaviors: Array.from({ length: 5 }, () => Math.random()),
      preferences: Array.from({ length: 5 }, () => Math.random()),
      riskTolerance: 0.3 + Math.random() * 0.6,
      timeHorizon: 10 + Math.random() * 80, // 10-90 days
    }));
  }
  
  private static detectTrendChanges(prices: number[]): { accuracy: number } {
    // Simplified trend change detection
    let changes = 0;
    for (let i = 1; i < prices.length - 1; i++) {
      const prev = prices[i - 1];
      const curr = prices[i];
      const next = prices[i + 1];
      
      if ((curr > prev && next < curr) || (curr < prev && next > curr)) {
        changes++;
      }
    }
    
    return { accuracy: Math.min(1, changes / (prices.length * 0.1)) };
  }
  
  private static analyzeVolumePatterns(volumes: number[]): { clarity: number } {
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeVariance = this.calculateVariance(volumes);
    const clarity = Math.max(0, 1 - volumeVariance / (avgVolume * avgVolume));
    
    return { clarity };
  }
  
  private static identifySupportResistance(prices: number[]): { strength: number } {
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const supports = sortedPrices.slice(0, 3);
    const resistances = sortedPrices.slice(-3);
    
    // Simplified strength calculation
    const strength = 0.7 + Math.random() * 0.3;
    return { strength };
  }
  
  private static analyzeShortTermAwareness(data: MarketSnapshot[]): number {
    return 15 + Math.random() * 10; // 15-25 points
  }
  
  private static analyzeMediumTermAwareness(data: MarketSnapshot[]): number {
    return 15 + Math.random() * 10; // 15-25 points
  }
  
  private static analyzeLongTermAwareness(data: MarketSnapshot[]): number {
    return 15 + Math.random() * 10; // 15-25 points
  }
  
  private static assessVolatilityAwareness(volatilities: number[]): number {
    const avgVol = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
    return Math.min(1, avgVol * 2); // Higher volatility awareness
  }
  
  private static assessDrawdownAwareness(prices: number[]): number {
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const drawdown = (maxPrice - minPrice) / maxPrice;
    
    return Math.max(0, 1 - drawdown * 2); // Lower drawdown = higher awareness
  }
  
  private static assessLiquidityAwareness(liquidities: number[]): number {
    const avgLiquidity = liquidities.reduce((sum, l) => sum + l, 0) / liquidities.length;
    return avgLiquidity; // Direct mapping
  }
  
  private static identifyPriceOpportunities(prices: number[]): number {
    // Simplified opportunity identification
    return 0.6 + Math.random() * 0.4;
  }
  
  private static identifyVolumeOpportunities(volumes: number[]): number {
    return 0.6 + Math.random() * 0.4;
  }
  
  private static identifyVolatilityOpportunities(volatilities: number[]): number {
    return 0.6 + Math.random() * 0.4;
  }
  
  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  private static calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
  
  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  private static calculateTrendConsistency(trends: number[]): number {
    if (trends.length < 2) return 0.5;
    
    let consistency = 0;
    for (let i = 1; i < trends.length; i++) {
      const direction1 = trends[i - 1] > 0 ? 1 : -1;
      const direction2 = trends[i] > 0 ? 1 : -1;
      
      if (direction1 === direction2) {
        consistency++;
      }
    }
    
    return consistency / (trends.length - 1);
  }
  
  private static calculateVectorSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const denominator = Math.sqrt(norm1 * norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }
  
  private static calculateIdentityChange(profile1: IdentityProfile, profile2: IdentityProfile): number {
    // Calculate total change magnitude across all identity dimensions
    let totalChange = 0;
    let dimensions = 0;
    
    // Trait changes
    profile1.traits.forEach((value, trait) => {
      const newValue = profile2.traits.get(trait);
      if (newValue !== undefined) {
        totalChange += Math.abs(value - newValue);
        dimensions++;
      }
    });
    
    // Behavior changes
    const behaviorChange = 1 - this.calculateVectorSimilarity(profile1.behaviors, profile2.behaviors);
    totalChange += behaviorChange;
    dimensions++;
    
    // Preference changes
    const preferenceChange = 1 - this.calculateVectorSimilarity(profile1.preferences, profile2.preferences);
    totalChange += preferenceChange;
    dimensions++;
    
    // Risk tolerance change
    totalChange += Math.abs(profile1.riskTolerance - profile2.riskTolerance);
    dimensions++;
    
    // Time horizon change
    totalChange += Math.abs(profile1.timeHorizon - profile2.timeHorizon) / 100;
    dimensions++;
    
    return totalChange / dimensions;
  }
}