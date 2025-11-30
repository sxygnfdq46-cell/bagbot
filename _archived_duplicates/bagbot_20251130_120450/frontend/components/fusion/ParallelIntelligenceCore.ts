/**
 * 🧠 PARALLEL INTELLIGENCE CORE (PIC)
 * 
 * Processes market intelligence across multiple dimensions simultaneously:
 * • Multiple timeframes (micro, short, medium, long)
 * • Multiple scenarios (bullish, bearish, neutral, volatile)
 * • Multiple indicators (technical, volume, sentiment, flow)
 * • Multiple strategies (scalp, swing, trend, mean-reversion)
 * 
 * Instead of sequential processing, PIC evaluates all possibilities in parallel,
 * creating a quantum-like superposition of market understanding.
 */

import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';

// ============================================
// TYPES
// ============================================

/**
 * Timeframe dimension
 */
export type Timeframe = 'micro' | 'short' | 'medium' | 'long' | 'macro';

export interface TimeframeIntelligence {
  timeframe: Timeframe;
  duration: number;          // milliseconds
  confidence: number;        // 0-1
  signal: number;            // -1 to 1 (bearish to bullish)
  volatility: number;        // 0-1
  momentum: number;          // -1 to 1
  trend: 'up' | 'down' | 'sideways' | 'volatile';
  strength: number;          // 0-1
}

/**
 * Scenario dimension
 */
export type ScenarioType = 'bullish' | 'bearish' | 'neutral' | 'volatile' | 'reversal';

export interface ScenarioIntelligence {
  scenario: ScenarioType;
  probability: number;       // 0-1
  conviction: number;        // 0-1
  risk: number;              // 0-1
  reward: number;            // 0-1
  timeframe: Timeframe;
  triggers: string[];        // What would activate this scenario
  invalidators: string[];    // What would invalidate this scenario
}

/**
 * Indicator dimension
 */
export type IndicatorCategory = 'technical' | 'volume' | 'sentiment' | 'flow' | 'composite';

export interface IndicatorIntelligence {
  category: IndicatorCategory;
  name: string;
  value: number;             // Normalized 0-1 or -1 to 1
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;          // 0-1
  reliability: number;       // 0-1 based on historical accuracy
  conflictsWith: string[];   // Other indicators this conflicts with
  confirmedBy: string[];     // Other indicators that confirm this
}

/**
 * Strategy dimension
 */
export type StrategyType = 'scalp' | 'momentum' | 'swing' | 'trend' | 'mean-reversion' | 'breakout';

export interface StrategyIntelligence {
  strategy: StrategyType;
  suitability: number;       // 0-1 how suitable current conditions are
  activeSignals: number;     // Count of active signals
  winRate: number;           // 0-1 historical win rate
  expectedValue: number;     // Expected value of trades
  optimalEntry: number;      // Price level
  optimalExit: number;       // Price level
  stopLoss: number;          // Risk management level
  confidence: number;        // 0-1
}

/**
 * Parallel intelligence state - all dimensions evaluated simultaneously
 */
export interface ParallelIntelligenceState {
  // Timeframe analysis (all timeframes processed in parallel)
  timeframes: TimeframeIntelligence[];
  dominantTimeframe: Timeframe;
  timeframeAlignment: number;  // 0-1 how aligned all timeframes are
  
  // Scenario analysis (all scenarios evaluated in parallel)
  scenarios: ScenarioIntelligence[];
  mostLikelyScenario: ScenarioType;
  scenarioConviction: number;  // 0-1
  
  // Indicator analysis (all indicators processed in parallel)
  indicators: IndicatorIntelligence[];
  indicatorConsensus: number;  // 0-1 how much indicators agree
  conflictingSignals: number;  // Count of conflicting signals
  
  // Strategy analysis (all strategies evaluated in parallel)
  strategies: StrategyIntelligence[];
  optimalStrategy: StrategyType;
  strategyConfidence: number;  // 0-1
  
  // Parallel processing metrics
  processingPaths: number;     // How many parallel paths were evaluated
  computationTime: number;     // milliseconds
  informationDensity: number;  // 0-1 how much information is available
  certaintyIndex: number;      // 0-1 overall certainty across all dimensions
  
  // Synthesis
  overallSignal: number;       // -1 to 1 (synthesized from all dimensions)
  actionRecommendation: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'wait';
  riskLevel: number;           // 0-1
  opportunityScore: number;    // 0-1
  
  timestamp: number;
}

// ============================================
// PARALLEL INTELLIGENCE CORE ENGINE
// ============================================

export class ParallelIntelligenceCore {
  private currentState: ParallelIntelligenceState | null = null;
  private stateHistory: ParallelIntelligenceState[] = [];
  private maxHistorySize = 100;
  
  // Processing pools - simulate parallel computation
  private timeframePool: TimeframeIntelligence[] = [];
  private scenarioPool: ScenarioIntelligence[] = [];
  private indicatorPool: IndicatorIntelligence[] = [];
  private strategyPool: StrategyIntelligence[] = [];
  
  /**
   * Main parallel processing function
   * Evaluates all dimensions simultaneously
   */
  public process(environment: EnvironmentalState): ParallelIntelligenceState {
    const startTime = performance.now();
    
    // Process all dimensions in parallel (simulated)
    const timeframes = this.processTimeframes(environment);
    const scenarios = this.processScenarios(environment, timeframes);
    const indicators = this.processIndicators(environment);
    const strategies = this.processStrategies(environment, scenarios);
    
    // Calculate alignment and consensus
    const timeframeAlignment = this.calculateTimeframeAlignment(timeframes);
    const indicatorConsensus = this.calculateIndicatorConsensus(indicators);
    const conflictingSignals = this.countConflictingSignals(indicators);
    
    // Identify dominant patterns
    const dominantTimeframe = this.identifyDominantTimeframe(timeframes);
    const mostLikelyScenario = this.identifyMostLikelyScenario(scenarios);
    const optimalStrategy = this.identifyOptimalStrategy(strategies);
    
    // Calculate scenario conviction
    const scenarioConviction = scenarios.find(s => s.scenario === mostLikelyScenario)?.conviction || 0;
    const strategyConfidence = strategies.find(s => s.strategy === optimalStrategy)?.confidence || 0;
    
    // Synthesize overall intelligence
    const overallSignal = this.synthesizeSignal(timeframes, scenarios, indicators);
    const actionRecommendation = this.determineAction(overallSignal, scenarioConviction, strategyConfidence);
    const riskLevel = this.calculateRiskLevel(scenarios, environment);
    const opportunityScore = this.calculateOpportunityScore(strategies, timeframeAlignment);
    
    // Calculate processing metrics
    const processingPaths = timeframes.length + scenarios.length + indicators.length + strategies.length;
    const computationTime = performance.now() - startTime;
    const informationDensity = this.calculateInformationDensity(environment);
    const certaintyIndex = this.calculateCertaintyIndex(timeframeAlignment, indicatorConsensus, scenarioConviction);
    
    // Build state
    const state: ParallelIntelligenceState = {
      timeframes,
      dominantTimeframe,
      timeframeAlignment,
      scenarios,
      mostLikelyScenario,
      scenarioConviction,
      indicators,
      indicatorConsensus,
      conflictingSignals,
      strategies,
      optimalStrategy,
      strategyConfidence,
      processingPaths,
      computationTime,
      informationDensity,
      certaintyIndex,
      overallSignal,
      actionRecommendation,
      riskLevel,
      opportunityScore,
      timestamp: Date.now()
    };
    
    // Store
    this.currentState = state;
    this.stateHistory.push(state);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
    
    return state;
  }
  
  /**
   * Process all timeframes in parallel
   */
  private processTimeframes(environment: EnvironmentalState): TimeframeIntelligence[] {
    const timeframes: Timeframe[] = ['micro', 'short', 'medium', 'long', 'macro'];
    
    return timeframes.map(tf => this.analyzeTimeframe(tf, environment));
  }
  
  private analyzeTimeframe(timeframe: Timeframe, env: EnvironmentalState): TimeframeIntelligence {
    // Duration mapping
    const durations: Record<Timeframe, number> = {
      micro: 60000,      // 1 min
      short: 300000,     // 5 min
      medium: 900000,    // 15 min
      long: 3600000,     // 1 hour
      macro: 14400000    // 4 hours
    };
    
    // Extract signals based on timeframe
    const signal = this.extractTimeframeSignal(timeframe, env);
    const volatility = env.pulse.stressIndex / 100;
    const momentum = env.flow.dominantFlow.strength / 100;
    
    // Determine trend
    let trend: 'up' | 'down' | 'sideways' | 'volatile' = 'sideways';
    if (env.jetstream.trendStrength > 60) {
      trend = env.jetstream.jetstream?.direction && env.jetstream.jetstream.direction < 90 ? 'up' : 'down';
    } else if (volatility > 0.7) {
      trend = 'volatile';
    }
    
    const strength = Math.abs(signal);
    const confidence = this.calculateTimeframeConfidence(timeframe, env);
    
    return {
      timeframe,
      duration: durations[timeframe],
      confidence,
      signal,
      volatility,
      momentum,
      trend,
      strength
    };
  }
  
  private extractTimeframeSignal(timeframe: Timeframe, env: EnvironmentalState): number {
    // Weight different environmental factors based on timeframe
    const weights: Record<Timeframe, { flow: number; jetstream: number; storms: number }> = {
      micro: { flow: 0.7, jetstream: 0.1, storms: 0.2 },
      short: { flow: 0.5, jetstream: 0.3, storms: 0.2 },
      medium: { flow: 0.3, jetstream: 0.5, storms: 0.2 },
      long: { flow: 0.2, jetstream: 0.6, storms: 0.2 },
      macro: { flow: 0.1, jetstream: 0.7, storms: 0.2 }
    };
    
    const w = weights[timeframe];
    const flowSignal = (env.flow.dominantFlow.strength / 100) * (env.flow.dominantFlow.direction < 180 ? 1 : -1);
    const jetstreamSignal = (env.jetstream.trendStrength / 100) * 
      (env.jetstream.jetstream?.direction && env.jetstream.jetstream.direction < 90 ? 1 : -1);
    const stormSignal = (env.storms.stormIntensity / 100) * (env.weather.pressure / 100 - 0.5) * 2;
    
    return flowSignal * w.flow + jetstreamSignal * w.jetstream + stormSignal * w.storms;
  }
  
  private calculateTimeframeConfidence(timeframe: Timeframe, env: EnvironmentalState): number {
    // Confidence based on coherence and information quality
    const baseConfidence = env.coherence / 100;
    const informationQuality = (100 - env.weather.effects.fogDensity * 100) / 100;
    
    return (baseConfidence * 0.6 + informationQuality * 0.4);
  }
  
  /**
   * Process all scenarios in parallel
   */
  private processScenarios(
    environment: EnvironmentalState,
    timeframes: TimeframeIntelligence[]
  ): ScenarioIntelligence[] {
    const scenarios: ScenarioType[] = ['bullish', 'bearish', 'neutral', 'volatile', 'reversal'];
    
    return scenarios.map(scenario => this.analyzeScenario(scenario, environment, timeframes));
  }
  
  private analyzeScenario(
    scenario: ScenarioType,
    env: EnvironmentalState,
    timeframes: TimeframeIntelligence[]
  ): ScenarioIntelligence {
    const probability = this.calculateScenarioProbability(scenario, env, timeframes);
    const conviction = this.calculateScenarioConviction(scenario, env);
    const risk = this.calculateScenarioRisk(scenario, env);
    const reward = this.calculateScenarioReward(scenario, env);
    const dominantTimeframe = timeframes.reduce((max, tf) => 
      tf.confidence > max.confidence ? tf : max
    ).timeframe;
    
    const triggers = this.identifyScenarioTriggers(scenario);
    const invalidators = this.identifyScenarioInvalidators(scenario);
    
    return {
      scenario,
      probability,
      conviction,
      risk,
      reward,
      timeframe: dominantTimeframe,
      triggers,
      invalidators
    };
  }
  
  private calculateScenarioProbability(
    scenario: ScenarioType,
    env: EnvironmentalState,
    timeframes: TimeframeIntelligence[]
  ): number {
    const avgSignal = timeframes.reduce((sum, tf) => sum + tf.signal, 0) / timeframes.length;
    const volatility = env.pulse.stressIndex / 100;
    
    switch (scenario) {
      case 'bullish':
        return Math.max(0, Math.min(1, (avgSignal + 1) / 2 * (1 - volatility * 0.3)));
      case 'bearish':
        return Math.max(0, Math.min(1, (1 - avgSignal) / 2 * (1 - volatility * 0.3)));
      case 'neutral':
        return Math.max(0, Math.min(1, 1 - Math.abs(avgSignal) - volatility * 0.5));
      case 'volatile':
        return volatility;
      case 'reversal':
        return this.calculateReversalProbability(env, timeframes);
      default:
        return 0.5;
    }
  }
  
  private calculateReversalProbability(
    env: EnvironmentalState,
    timeframes: TimeframeIntelligence[]
  ): number {
    // Look for divergence between timeframes
    const shortTermSignal = timeframes.find(tf => tf.timeframe === 'short')?.signal || 0;
    const longTermSignal = timeframes.find(tf => tf.timeframe === 'long')?.signal || 0;
    const divergence = Math.abs(shortTermSignal - longTermSignal);
    
    const extremeConditions = (env.storms.stormIntensity / 100 > 0.8) ? 0.3 : 0;
    
    return Math.min(1, divergence * 0.7 + extremeConditions);
  }
  
  private calculateScenarioConviction(scenario: ScenarioType, env: EnvironmentalState): number {
    return env.coherence / 100 * 0.7 + (100 - env.weather.effects.fogDensity * 100) / 100 * 0.3;
  }
  
  private calculateScenarioRisk(scenario: ScenarioType, env: EnvironmentalState): number {
    const baseRisk = env.pulse.stressIndex / 100;
    const stormRisk = env.storms.stormIntensity / 100;
    
    const scenarioRiskMultipliers: Record<ScenarioType, number> = {
      bullish: 0.8,
      bearish: 0.9,
      neutral: 0.5,
      volatile: 1.2,
      reversal: 1.0
    };
    
    return Math.min(1, (baseRisk * 0.5 + stormRisk * 0.5) * scenarioRiskMultipliers[scenario]);
  }
  
  private calculateScenarioReward(scenario: ScenarioType, env: EnvironmentalState): number {
    const momentum = env.flow.dominantFlow.strength / 100;
    const opportunity = env.jetstream.trendStrength / 100;
    
    const scenarioRewardMultipliers: Record<ScenarioType, number> = {
      bullish: 1.2,
      bearish: 1.1,
      neutral: 0.6,
      volatile: 1.0,
      reversal: 1.3
    };
    
    return Math.min(1, (momentum * 0.6 + opportunity * 0.4) * scenarioRewardMultipliers[scenario]);
  }
  
  private identifyScenarioTriggers(scenario: ScenarioType): string[] {
    const triggers: Record<ScenarioType, string[]> = {
      bullish: ['Strong buying flow', 'Upward jetstream', 'Low volatility', 'Positive momentum'],
      bearish: ['Strong selling flow', 'Downward jetstream', 'High pressure', 'Negative momentum'],
      neutral: ['Balanced flow', 'Sideways trend', 'Low storm activity', 'Range-bound'],
      volatile: ['High storm intensity', 'Conflicting signals', 'Microbursts', 'Low coherence'],
      reversal: ['Diverging timeframes', 'Extreme conditions', 'Exhaustion signals', 'Pattern completion']
    };
    
    return triggers[scenario];
  }
  
  private identifyScenarioInvalidators(scenario: ScenarioType): string[] {
    const invalidators: Record<ScenarioType, string[]> = {
      bullish: ['Strong selling pressure', 'Downward break', 'Negative divergence'],
      bearish: ['Strong buying pressure', 'Upward break', 'Positive divergence'],
      neutral: ['Strong directional move', 'Range break', 'Volume surge'],
      volatile: ['Stabilization', 'Clear direction', 'Reduced storm activity'],
      reversal: ['Continuation pattern', 'Trend confirmation', 'Failed reversal attempt']
    };
    
    return invalidators[scenario];
  }
  
  /**
   * Process all indicators in parallel
   */
  private processIndicators(environment: EnvironmentalState): IndicatorIntelligence[] {
    // Simplified indicator set - in production would be much more comprehensive
    return [
      this.createIndicator('technical', 'Trend Strength', environment.jetstream.trendStrength / 100, environment),
      this.createIndicator('volume', 'Flow Intensity', environment.flow.dominantFlow.strength / 100, environment),
      this.createIndicator('sentiment', 'Market Pressure', environment.weather.pressure / 100, environment),
      this.createIndicator('flow', 'Momentum', environment.storms.stormIntensity / 100, environment),
      this.createIndicator('composite', 'Coherence', environment.coherence / 100, environment)
    ];
  }
  
  private createIndicator(
    category: IndicatorCategory,
    name: string,
    value: number,
    env: EnvironmentalState
  ): IndicatorIntelligence {
    const signal: 'buy' | 'sell' | 'neutral' = 
      value > 0.6 ? 'buy' : value < 0.4 ? 'sell' : 'neutral';
    
    const strength = Math.abs(value - 0.5) * 2;
    const reliability = env.coherence / 100;
    
    return {
      category,
      name,
      value,
      signal,
      strength,
      reliability,
      conflictsWith: [],
      confirmedBy: []
    };
  }
  
  /**
   * Process all strategies in parallel
   */
  private processStrategies(
    environment: EnvironmentalState,
    scenarios: ScenarioIntelligence[]
  ): StrategyIntelligence[] {
    const strategies: StrategyType[] = ['scalp', 'momentum', 'swing', 'trend', 'mean-reversion', 'breakout'];
    
    return strategies.map(strategy => this.analyzeStrategy(strategy, environment, scenarios));
  }
  
  private analyzeStrategy(
    strategy: StrategyType,
    env: EnvironmentalState,
    scenarios: ScenarioIntelligence[]
  ): StrategyIntelligence {
    const suitability = this.calculateStrategySuitability(strategy, env, scenarios);
    const activeSignals = this.countActiveSignals(strategy, env);
    const winRate = 0.5 + Math.random() * 0.3; // Simplified - would use historical data
    const expectedValue = suitability * winRate * 2 - 1;
    
    return {
      strategy,
      suitability,
      activeSignals,
      winRate,
      expectedValue,
      optimalEntry: 100, // Simplified
      optimalExit: 102,  // Simplified
      stopLoss: 99,      // Simplified
      confidence: suitability * winRate
    };
  }
  
  private calculateStrategySuitability(
    strategy: StrategyType,
    env: EnvironmentalState,
    scenarios: ScenarioIntelligence[]
  ): number {
    const volatility = env.pulse.stressIndex / 100;
    const trend = env.jetstream.trendStrength / 100;
    const flow = env.flow.dominantFlow.strength / 100;
    
    const suitabilityMap: Record<StrategyType, () => number> = {
      scalp: () => volatility * 0.8 + (1 - trend) * 0.2,
      momentum: () => flow * 0.7 + volatility * 0.3,
      swing: () => trend * 0.6 + (1 - volatility) * 0.4,
      trend: () => trend * 0.9 + (1 - volatility) * 0.1,
      'mean-reversion': () => (1 - trend) * 0.7 + volatility * 0.3,
      breakout: () => volatility * 0.5 + flow * 0.5
    };
    
    return suitabilityMap[strategy]();
  }
  
  private countActiveSignals(strategy: StrategyType, env: EnvironmentalState): number {
    // Simplified - would analyze specific strategy signals
    return Math.floor(Math.random() * 5);
  }
  
  // Synthesis and analysis methods
  
  private calculateTimeframeAlignment(timeframes: TimeframeIntelligence[]): number {
    if (timeframes.length === 0) return 0;
    
    const avgSignal = timeframes.reduce((sum, tf) => sum + tf.signal, 0) / timeframes.length;
    const variance = timeframes.reduce((sum, tf) => sum + Math.pow(tf.signal - avgSignal, 2), 0) / timeframes.length;
    
    return Math.max(0, 1 - variance);
  }
  
  private calculateIndicatorConsensus(indicators: IndicatorIntelligence[]): number {
    if (indicators.length === 0) return 0;
    
    const buyCount = indicators.filter(i => i.signal === 'buy').length;
    const sellCount = indicators.filter(i => i.signal === 'sell').length;
    const total = indicators.length;
    
    const consensus = Math.max(buyCount, sellCount) / total;
    return consensus;
  }
  
  private countConflictingSignals(indicators: IndicatorIntelligence[]): number {
    const buySignals = indicators.filter(i => i.signal === 'buy').length;
    const sellSignals = indicators.filter(i => i.signal === 'sell').length;
    
    return Math.min(buySignals, sellSignals);
  }
  
  private identifyDominantTimeframe(timeframes: TimeframeIntelligence[]): Timeframe {
    return timeframes.reduce((max, tf) => 
      (tf.confidence * tf.strength) > (max.confidence * max.strength) ? tf : max
    ).timeframe;
  }
  
  private identifyMostLikelyScenario(scenarios: ScenarioIntelligence[]): ScenarioType {
    return scenarios.reduce((max, s) => 
      (s.probability * s.conviction) > (max.probability * max.conviction) ? s : max
    ).scenario;
  }
  
  private identifyOptimalStrategy(strategies: StrategyIntelligence[]): StrategyType {
    return strategies.reduce((max, s) => 
      (s.suitability * s.confidence) > (max.suitability * max.confidence) ? s : max
    ).strategy;
  }
  
  private synthesizeSignal(
    timeframes: TimeframeIntelligence[],
    scenarios: ScenarioIntelligence[],
    indicators: IndicatorIntelligence[]
  ): number {
    const timeframeSignal = timeframes.reduce((sum, tf) => sum + tf.signal * tf.confidence, 0) / 
      timeframes.reduce((sum, tf) => sum + tf.confidence, 0);
    
    const scenarioSignal = scenarios.reduce((sum, s) => {
      const weight = s.probability * s.conviction;
      const value = s.scenario === 'bullish' ? 1 : s.scenario === 'bearish' ? -1 : 0;
      return sum + value * weight;
    }, 0);
    
    const indicatorSignal = indicators.reduce((sum, i) => {
      const value = i.signal === 'buy' ? 1 : i.signal === 'sell' ? -1 : 0;
      return sum + value * i.strength * i.reliability;
    }, 0) / indicators.length;
    
    return (timeframeSignal * 0.4 + scenarioSignal * 0.3 + indicatorSignal * 0.3);
  }
  
  private determineAction(
    signal: number,
    conviction: number,
    confidence: number
  ): 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'wait' {
    const strength = Math.abs(signal);
    const certainty = conviction * confidence;
    
    if (certainty < 0.5) return 'wait';
    
    if (signal > 0.6 && certainty > 0.7) return 'strong-buy';
    if (signal > 0.3) return 'buy';
    if (signal < -0.6 && certainty > 0.7) return 'strong-sell';
    if (signal < -0.3) return 'sell';
    
    return 'hold';
  }
  
  private calculateRiskLevel(scenarios: ScenarioIntelligence[], env: EnvironmentalState): number {
    const volatileScenario = scenarios.find(s => s.scenario === 'volatile');
    const baseRisk = env.pulse.stressIndex / 100;
    const scenarioRisk = volatileScenario ? volatileScenario.probability * volatileScenario.risk : 0;
    
    return Math.min(1, baseRisk * 0.6 + scenarioRisk * 0.4);
  }
  
  private calculateOpportunityScore(strategies: StrategyIntelligence[], alignment: number): number {
    const bestStrategy = strategies.reduce((max, s) => 
      s.expectedValue > max.expectedValue ? s : max
    );
    
    return bestStrategy.suitability * alignment;
  }
  
  private calculateInformationDensity(env: EnvironmentalState): number {
    const hasData = (env.coherence > 50 && env.weather.visibility > 50) ? 1 : 0.5;
    const quality = env.coherence / 100;
    
    return hasData * quality;
  }
  
  private calculateCertaintyIndex(
    timeframeAlignment: number,
    indicatorConsensus: number,
    scenarioConviction: number
  ): number {
    return (timeframeAlignment * 0.35 + indicatorConsensus * 0.35 + scenarioConviction * 0.3);
  }
  
  /**
   * Get current state
   */
  public getCurrentState(): ParallelIntelligenceState | null {
    return this.currentState;
  }
  
  /**
   * Get state history
   */
  public getHistory(): ParallelIntelligenceState[] {
    return [...this.stateHistory];
  }
  
  /**
   * Get specific dimension
   */
  public getTimeframeIntelligence(timeframe: Timeframe): TimeframeIntelligence | undefined {
    return this.currentState?.timeframes.find(tf => tf.timeframe === timeframe);
  }
  
  public getScenarioIntelligence(scenario: ScenarioType): ScenarioIntelligence | undefined {
    return this.currentState?.scenarios.find(s => s.scenario === scenario);
  }
  
  public getStrategyIntelligence(strategy: StrategyType): StrategyIntelligence | undefined {
    return this.currentState?.strategies.find(s => s.strategy === strategy);
  }
}
