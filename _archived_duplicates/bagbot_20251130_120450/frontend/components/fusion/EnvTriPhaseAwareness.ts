/**
 * 🕰️ TRI-PHASE AWARENESS SYSTEM
 * 
 * Processes environmental intelligence across three temporal dimensions simultaneously:
 * 
 * PAST (Memory Phase):
 * • Pattern recognition from historical states
 * • Learned behaviors and outcomes
 * • Cyclical patterns and seasonality
 * • Success/failure memory
 * 
 * PRESENT (Current Phase):
 * • Real-time environmental state
 * • Immediate conditions and signals
 * • Current market sentiment
 * • Live flow and pressure
 * 
 * FUTURE (Predictive Phase):
 * • Probabilistic forecasting
 * • Scenario projection
 * • Anticipatory signals
 * • Trend extrapolation
 * 
 * All three phases are processed in parallel to create temporal superposition -
 * understanding where we've been, where we are, and where we're going, all at once.
 */

import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';
import type { ParallelIntelligenceState } from './ParallelIntelligenceCore';

// ============================================
// TYPES
// ============================================

/**
 * Past Phase - Memory and historical patterns
 */
export interface MemoryPhaseState {
  // Historical pattern recognition
  recognizedPatterns: PatternMemory[];
  dominantPattern: string | null;
  patternConfidence: number;        // 0-1
  
  // Learned behaviors
  successfulStrategies: string[];   // Strategies that worked before
  failedStrategies: string[];       // Strategies that failed before
  contextSimilarity: number;        // 0-1 how similar current context is to past
  
  // Cyclical analysis
  cyclePhase: 'accumulation' | 'markup' | 'distribution' | 'markdown' | 'unknown';
  cycleProgress: number;            // 0-1 progress through current cycle
  cycleReliability: number;         // 0-1 how reliable the cycle detection is
  
  // Memory quality
  historicalDepth: number;          // How much history is available (hours)
  memoryClarity: number;            // 0-1 how clear/reliable historical data is
  recencyBias: number;              // 0-1 how much we weight recent vs distant past
  
  timestamp: number;
}

export interface PatternMemory {
  patternName: string;
  occurrences: number;              // How many times seen
  successRate: number;              // 0-1
  avgDuration: number;              // milliseconds
  lastSeen: number;                 // timestamp
  confidence: number;               // 0-1
  conditions: string[];             // What conditions trigger this pattern
  outcomes: string[];               // What typically happens after
}

/**
 * Present Phase - Real-time current state
 */
export interface PresentPhaseState {
  // Current snapshot
  currentEnvironment: EnvironmentalState;
  currentIntelligence: ParallelIntelligenceState | null;
  
  // Immediate conditions
  immediateSignals: ImmediateSignal[];
  strongestSignal: string;
  signalClarity: number;            // 0-1
  
  // Real-time metrics
  instantaneousVolatility: number;  // 0-1
  instantaneousMomentum: number;    // -1 to 1
  instantaneousPressure: number;    // 0-1
  instantaneousFlow: number;        // -1 to 1
  
  // Attention focus
  focusAreas: string[];             // What to pay attention to right now
  urgencyLevel: number;             // 0-1
  clarityIndex: number;             // 0-1 how clear the current situation is
  
  timestamp: number;
}

export interface ImmediateSignal {
  source: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'alert' | 'opportunity';
  strength: number;                 // 0-1
  urgency: number;                  // 0-1
  reliability: number;              // 0-1
  description: string;
  expiresAt: number;                // timestamp
}

/**
 * Future Phase - Predictive and anticipatory
 */
export interface FuturePhaseState {
  // Predictions
  predictions: Prediction[];
  mostLikelyOutcome: string;
  predictionConfidence: number;     // 0-1
  
  // Scenarios
  futureScenarios: FutureScenario[];
  bestCaseScenario: string;
  worstCaseScenario: string;
  expectedScenario: string;
  
  // Anticipatory signals
  earlyWarnings: EarlyWarning[];
  opportunities: Opportunity[];
  
  // Forecast horizon
  forecastHorizon: number;          // milliseconds into future
  forecastReliability: number;      // 0-1
  uncertaintyLevel: number;         // 0-1
  
  timestamp: number;
}

export interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeHorizon: number;              // milliseconds
  confidence: number;               // 0-1
  rationale: string;
}

export interface FutureScenario {
  name: string;
  probability: number;              // 0-1
  timeframe: number;                // milliseconds
  triggers: string[];               // What would make this happen
  implications: string[];           // What this would mean
  preparation: string[];            // What to do if this scenario activates
}

export interface EarlyWarning {
  type: 'risk' | 'reversal' | 'volatility' | 'breakdown' | 'exhaustion';
  severity: number;                 // 0-1
  timeToImpact: number;             // milliseconds
  probability: number;              // 0-1
  description: string;
  mitigationActions: string[];
}

export interface Opportunity {
  type: 'breakout' | 'reversion' | 'trend' | 'arbitrage' | 'momentum';
  quality: number;                  // 0-1
  timeWindow: number;               // milliseconds
  probability: number;              // 0-1
  description: string;
  requirements: string[];           // What needs to be true to take this
}

/**
 * Tri-Phase unified state
 */
export interface TriPhaseState {
  past: MemoryPhaseState;
  present: PresentPhaseState;
  future: FuturePhaseState;
  
  // Temporal synthesis
  temporalAlignment: number;        // 0-1 how aligned all three phases are
  temporalConflicts: number;        // Count of conflicts between phases
  temporalConfidence: number;       // 0-1 overall confidence across all phases
  
  // Unified intelligence
  unifiedSignal: number;            // -1 to 1 (synthesized across time)
  unifiedAction: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'wait';
  unifiedConfidence: number;        // 0-1
  
  // Temporal coherence
  narrativeContinuity: number;      // 0-1 how well the story flows past→present→future
  temporalEntropy: number;          // 0-1 disorder/chaos in temporal understanding
  
  timestamp: number;
}

// ============================================
// TRI-PHASE AWARENESS ENGINE
// ============================================

export class EnvTriPhaseAwareness {
  private currentTriPhase: TriPhaseState | null = null;
  private stateHistory: TriPhaseState[] = [];
  private maxHistorySize = 200; // Keep more history for memory phase
  
  // Historical environmental states for memory phase
  private environmentHistory: EnvironmentalState[] = [];
  private maxEnvironmentHistory = 500;
  
  // Pattern library
  private patternLibrary: Map<string, PatternMemory> = new Map();
  
  /**
   * Main tri-phase processing
   * Processes past, present, and future simultaneously
   */
  public process(
    currentEnvironment: EnvironmentalState,
    currentIntelligence: ParallelIntelligenceState | null
  ): TriPhaseState {
    // Store current environment in history
    this.environmentHistory.push(currentEnvironment);
    if (this.environmentHistory.length > this.maxEnvironmentHistory) {
      this.environmentHistory.shift();
    }
    
    // Process all three phases in parallel (simulated)
    const past = this.processMemoryPhase(currentEnvironment);
    const present = this.processPresentPhase(currentEnvironment, currentIntelligence);
    const future = this.processFuturePhase(currentEnvironment, currentIntelligence, past);
    
    // Temporal synthesis
    const temporalAlignment = this.calculateTemporalAlignment(past, present, future);
    const temporalConflicts = this.countTemporalConflicts(past, present, future);
    const temporalConfidence = this.calculateTemporalConfidence(past, present, future);
    
    // Unified intelligence
    const unifiedSignal = this.synthesizeTemporalSignal(past, present, future);
    const unifiedAction = this.determineUnifiedAction(unifiedSignal, temporalConfidence);
    const unifiedConfidence = temporalConfidence;
    
    // Temporal coherence
    const narrativeContinuity = this.calculateNarrativeContinuity(past, present, future);
    const temporalEntropy = this.calculateTemporalEntropy(past, present, future);
    
    const triPhase: TriPhaseState = {
      past,
      present,
      future,
      temporalAlignment,
      temporalConflicts,
      temporalConfidence,
      unifiedSignal,
      unifiedAction,
      unifiedConfidence,
      narrativeContinuity,
      temporalEntropy,
      timestamp: Date.now()
    };
    
    this.currentTriPhase = triPhase;
    this.stateHistory.push(triPhase);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
    
    return triPhase;
  }
  
  // ============================================
  // MEMORY PHASE (PAST)
  // ============================================
  
  private processMemoryPhase(currentEnv: EnvironmentalState): MemoryPhaseState {
    // Pattern recognition
    const recognizedPatterns = this.recognizePatterns(currentEnv);
    const dominantPattern = recognizedPatterns.length > 0 
      ? recognizedPatterns.reduce((max, p) => p.confidence > max.confidence ? p : max).patternName
      : null;
    const patternConfidence = recognizedPatterns.length > 0
      ? recognizedPatterns.reduce((max, p) => p.confidence > max.confidence ? p : max).confidence
      : 0;
    
    // Learned behaviors
    const successfulStrategies = this.recallSuccessfulStrategies(currentEnv);
    const failedStrategies = this.recallFailedStrategies(currentEnv);
    const contextSimilarity = this.calculateContextSimilarity(currentEnv);
    
    // Cyclical analysis
    const cyclePhase = this.detectCyclePhase(currentEnv);
    const cycleProgress = this.calculateCycleProgress(cyclePhase);
    const cycleReliability = this.calculateCycleReliability();
    
    // Memory quality
    const historicalDepth = (this.environmentHistory.length * 5) / 60; // Assuming 5min intervals, convert to hours
    const memoryClarity = this.calculateMemoryClarity();
    const recencyBias = 0.7; // Weight recent history more heavily
    
    return {
      recognizedPatterns,
      dominantPattern,
      patternConfidence,
      successfulStrategies,
      failedStrategies,
      contextSimilarity,
      cyclePhase,
      cycleProgress,
      cycleReliability,
      historicalDepth,
      memoryClarity,
      recencyBias,
      timestamp: Date.now()
    };
  }
  
  private recognizePatterns(currentEnv: EnvironmentalState): PatternMemory[] {
    const patterns: PatternMemory[] = [];
    
    // Define pattern templates
    const patternTemplates = [
      {
        name: 'Bull Run',
        check: (env: EnvironmentalState) => 
          env.jetstream.trendStrength > 70 && 
          env.flow.dominantFlow.strength > 60 &&
          env.jetstream.jetstream?.direction && env.jetstream.jetstream.direction < 90
      },
      {
        name: 'Bear Slide',
        check: (env: EnvironmentalState) => 
          env.jetstream.trendStrength > 70 && 
          env.flow.dominantFlow.strength > 60 &&
          env.jetstream.jetstream?.direction && env.jetstream.jetstream.direction > 270
      },
      {
        name: 'Consolidation',
        check: (env: EnvironmentalState) => 
          env.jetstream.trendStrength < 30 &&
          env.pulse.stressIndex < 40
      },
      {
        name: 'Volatility Spike',
        check: (env: EnvironmentalState) => 
          env.pulse.stressIndex > 80 &&
          env.storms.stormIntensity > 70
      },
      {
        name: 'Momentum Fade',
        check: (env: EnvironmentalState) => 
          env.flow.dominantFlow.strength < 30 &&
          env.jetstream.trendStrength < 40
      }
    ];
    
    // Check each pattern
    for (const template of patternTemplates) {
      if (template.check(currentEnv)) {
        let patternMemory = this.patternLibrary.get(template.name);
        
        if (!patternMemory) {
          patternMemory = {
            patternName: template.name,
            occurrences: 0,
            successRate: 0.5,
            avgDuration: 600000, // 10 min default
            lastSeen: Date.now(),
            confidence: 0.5,
            conditions: [],
            outcomes: []
          };
          this.patternLibrary.set(template.name, patternMemory);
        }
        
        // Update memory
        patternMemory.occurrences++;
        patternMemory.lastSeen = Date.now();
        patternMemory.confidence = Math.min(1, 0.5 + (patternMemory.occurrences * 0.05));
        
        patterns.push({ ...patternMemory });
      }
    }
    
    return patterns;
  }
  
  private recallSuccessfulStrategies(env: EnvironmentalState): string[] {
    // Simplified - would be based on actual historical performance
    const strategies: string[] = [];
    
    if (env.jetstream.trendStrength > 60) {
      strategies.push('Trend Following');
    }
    if (env.pulse.stressIndex > 70) {
      strategies.push('Scalping');
    }
    if (env.jetstream.trendStrength < 30) {
      strategies.push('Mean Reversion');
    }
    
    return strategies;
  }
  
  private recallFailedStrategies(env: EnvironmentalState): string[] {
    // Simplified - would be based on actual historical performance
    const strategies: string[] = [];
    
    if (env.pulse.stressIndex > 80) {
      strategies.push('Position Holding');
    }
    if (env.jetstream.trendStrength < 20) {
      strategies.push('Breakout Trading');
    }
    
    return strategies;
  }
  
  private calculateContextSimilarity(currentEnv: EnvironmentalState): number {
    if (this.environmentHistory.length < 10) return 0.5;
    
    // Compare current environment to recent history
    const recentHistory = this.environmentHistory.slice(-20);
    let similaritySum = 0;
    
    for (const pastEnv of recentHistory) {
      const trendSimilarity = 1 - Math.abs(currentEnv.jetstream.trendStrength - pastEnv.jetstream.trendStrength) / 100;
      const stressSimilarity = 1 - Math.abs(currentEnv.pulse.stressIndex - pastEnv.pulse.stressIndex) / 100;
      const flowSimilarity = 1 - Math.abs(currentEnv.flow.dominantFlow.strength - pastEnv.flow.dominantFlow.strength) / 100;
      
      similaritySum += (trendSimilarity + stressSimilarity + flowSimilarity) / 3;
    }
    
    return similaritySum / recentHistory.length;
  }
  
  private detectCyclePhase(env: EnvironmentalState): 'accumulation' | 'markup' | 'distribution' | 'markdown' | 'unknown' {
    const trend = env.jetstream.trendStrength;
    const volatility = env.pulse.stressIndex;
    const flow = env.flow.dominantFlow.strength;
    const direction = env.jetstream.jetstream?.direction ?? 180;
    
    // Accumulation: Low volatility, sideways, building flow
    if (trend < 30 && volatility < 40 && flow < 50) {
      return 'accumulation';
    }
    
    // Markup: Strong uptrend, increasing flow
    if (trend > 60 && direction < 90 && flow > 60) {
      return 'markup';
    }
    
    // Distribution: High volatility, weakening trend, high flow
    if (trend < 50 && volatility > 60 && flow > 70) {
      return 'distribution';
    }
    
    // Markdown: Strong downtrend
    if (trend > 60 && direction > 270) {
      return 'markdown';
    }
    
    return 'unknown';
  }
  
  private calculateCycleProgress(phase: string): number {
    // Simplified - would track actual cycle progression
    const progressMap: Record<string, number> = {
      accumulation: 0.2,
      markup: 0.5,
      distribution: 0.7,
      markdown: 0.9,
      unknown: 0.5
    };
    
    return progressMap[phase] || 0.5;
  }
  
  private calculateCycleReliability(): number {
    // Based on history length and consistency
    return Math.min(1, this.environmentHistory.length / 100);
  }
  
  private calculateMemoryClarity(): number {
    // How clear and reliable is our historical data
    if (this.environmentHistory.length < 10) return 0.3;
    
    // Check consistency of historical data
    const recentHistory = this.environmentHistory.slice(-50);
    const coherenceSum = recentHistory.reduce((sum, env) => sum + env.coherence, 0);
    const avgCoherence = coherenceSum / recentHistory.length;
    
    return avgCoherence / 100;
  }
  
  // ============================================
  // PRESENT PHASE (CURRENT)
  // ============================================
  
  private processPresentPhase(
    currentEnv: EnvironmentalState,
    currentIntelligence: ParallelIntelligenceState | null
  ): PresentPhaseState {
    // Immediate signals
    const immediateSignals = this.extractImmediateSignals(currentEnv, currentIntelligence);
    const strongestSignal = immediateSignals.length > 0
      ? immediateSignals.reduce((max, s) => s.strength > max.strength ? s : max).source
      : 'None';
    const signalClarity = this.calculateSignalClarity(immediateSignals);
    
    // Real-time metrics
    const instantaneousVolatility = currentEnv.pulse.stressIndex / 100;
    const instantaneousMomentum = (currentEnv.flow.dominantFlow.strength / 100) * 
      (currentEnv.flow.dominantFlow.direction < 180 ? 1 : -1);
    const instantaneousPressure = currentEnv.weather.pressure / 100;
    const instantaneousFlow = (currentEnv.flow.dominantFlow.strength / 100) *
      (currentEnv.flow.dominantFlow.direction < 180 ? 1 : -1);
    
    // Attention focus
    const focusAreas = this.identifyFocusAreas(currentEnv, immediateSignals);
    const urgencyLevel = this.calculateUrgency(immediateSignals, currentEnv);
    const clarityIndex = currentEnv.coherence / 100;
    
    return {
      currentEnvironment: currentEnv,
      currentIntelligence,
      immediateSignals,
      strongestSignal,
      signalClarity,
      instantaneousVolatility,
      instantaneousMomentum,
      instantaneousPressure,
      instantaneousFlow,
      focusAreas,
      urgencyLevel,
      clarityIndex,
      timestamp: Date.now()
    };
  }
  
  private extractImmediateSignals(
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null
  ): ImmediateSignal[] {
    const signals: ImmediateSignal[] = [];
    const now = Date.now();
    
    // Strong trend signal
    if (env.jetstream.trendStrength > 70) {
      signals.push({
        source: 'Trend Jetstream',
        type: env.jetstream.jetstream?.direction && env.jetstream.jetstream.direction < 90 ? 'bullish' : 'bearish',
        strength: env.jetstream.trendStrength / 100,
        urgency: 0.7,
        reliability: 0.8,
        description: 'Strong directional trend detected',
        expiresAt: now + 300000 // 5 min
      });
    }
    
    // Volatility alert
    if (env.pulse.stressIndex > 80) {
      signals.push({
        source: 'Stress Pulse',
        type: 'alert',
        strength: env.pulse.stressIndex / 100,
        urgency: 0.9,
        reliability: 0.9,
        description: 'High volatility detected',
        expiresAt: now + 180000 // 3 min
      });
    }
    
    // Flow opportunity
    if (env.flow.dominantFlow.strength > 70) {
      signals.push({
        source: 'Flow Patterns',
        type: 'opportunity',
        strength: env.flow.dominantFlow.strength / 100,
        urgency: 0.6,
        reliability: 0.7,
        description: 'Strong flow pattern detected',
        expiresAt: now + 600000 // 10 min
      });
    }
    
    // Intelligence synthesis
    if (intel && Math.abs(intel.overallSignal) > 0.6) {
      signals.push({
        source: 'Parallel Intelligence',
        type: intel.overallSignal > 0 ? 'bullish' : 'bearish',
        strength: Math.abs(intel.overallSignal),
        urgency: intel.certaintyIndex,
        reliability: intel.certaintyIndex,
        description: `Strong ${intel.actionRecommendation} signal from multi-dimensional analysis`,
        expiresAt: now + 300000 // 5 min
      });
    }
    
    return signals;
  }
  
  private calculateSignalClarity(signals: ImmediateSignal[]): number {
    if (signals.length === 0) return 0;
    
    const avgReliability = signals.reduce((sum, s) => sum + s.reliability, 0) / signals.length;
    const consistencyScore = this.calculateSignalConsistency(signals);
    
    return (avgReliability * 0.6 + consistencyScore * 0.4);
  }
  
  private calculateSignalConsistency(signals: ImmediateSignal[]): number {
    if (signals.length < 2) return 1;
    
    const bullishCount = signals.filter(s => s.type === 'bullish').length;
    const bearishCount = signals.filter(s => s.type === 'bearish').length;
    const neutralCount = signals.filter(s => s.type === 'neutral').length;
    
    const maxCount = Math.max(bullishCount, bearishCount, neutralCount);
    return maxCount / signals.length;
  }
  
  private identifyFocusAreas(env: EnvironmentalState, signals: ImmediateSignal[]): string[] {
    const areas: string[] = [];
    
    if (env.pulse.stressIndex > 70) areas.push('Volatility Management');
    if (env.jetstream.trendStrength > 60) areas.push('Trend Direction');
    if (env.flow.dominantFlow.strength > 60) areas.push('Flow Momentum');
    if (signals.some(s => s.urgency > 0.8)) areas.push('Immediate Action Required');
    if (env.storms.stormIntensity > 70) areas.push('Storm Activity');
    
    return areas;
  }
  
  private calculateUrgency(signals: ImmediateSignal[], env: EnvironmentalState): number {
    const signalUrgency = signals.length > 0
      ? signals.reduce((max, s) => Math.max(max, s.urgency), 0)
      : 0;
    
    const environmentalUrgency = env.pulse.stressIndex / 100 * 0.8;
    
    return Math.max(signalUrgency, environmentalUrgency);
  }
  
  // ============================================
  // FUTURE PHASE (PREDICTIVE)
  // ============================================
  
  private processFuturePhase(
    currentEnv: EnvironmentalState,
    currentIntel: ParallelIntelligenceState | null,
    memoryPhase: MemoryPhaseState
  ): FuturePhaseState {
    // Generate predictions
    const predictions = this.generatePredictions(currentEnv, memoryPhase);
    const mostLikelyOutcome = predictions.length > 0
      ? predictions.reduce((max, p) => p.confidence > max.confidence ? p : max).metric
      : 'Unknown';
    const predictionConfidence = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
      : 0.5;
    
    // Future scenarios
    const futureScenarios = this.generateFutureScenarios(currentEnv, currentIntel);
    const bestCase = futureScenarios.find(s => s.name.includes('Best'))?.name || 'Positive Movement';
    const worstCase = futureScenarios.find(s => s.name.includes('Worst'))?.name || 'Negative Movement';
    const expected = futureScenarios.reduce((max, s) => s.probability > max.probability ? s : max, futureScenarios[0])?.name || 'Continuation';
    
    // Anticipatory signals
    const earlyWarnings = this.detectEarlyWarnings(currentEnv, memoryPhase);
    const opportunities = this.identifyOpportunities(currentEnv, currentIntel);
    
    // Forecast metrics
    const forecastHorizon = 900000; // 15 min
    const forecastReliability = (currentEnv.coherence / 100) * (memoryPhase.memoryClarity);
    const uncertaintyLevel = 1 - forecastReliability;
    
    return {
      predictions,
      mostLikelyOutcome,
      predictionConfidence,
      futureScenarios,
      bestCaseScenario: bestCase,
      worstCaseScenario: worstCase,
      expectedScenario: expected,
      earlyWarnings,
      opportunities,
      forecastHorizon,
      forecastReliability,
      uncertaintyLevel,
      timestamp: Date.now()
    };
  }
  
  private generatePredictions(env: EnvironmentalState, memory: MemoryPhaseState): Prediction[] {
    const predictions: Prediction[] = [];
    
    // Predict volatility
    const currentVol = env.pulse.stressIndex;
    const predictedVol = currentVol + (memory.cyclePhase === 'distribution' ? 10 : -5);
    predictions.push({
      metric: 'Volatility',
      currentValue: currentVol,
      predictedValue: Math.max(0, Math.min(100, predictedVol)),
      timeHorizon: 600000, // 10 min
      confidence: 0.7,
      rationale: `Based on ${memory.cyclePhase} phase patterns`
    });
    
    // Predict trend strength
    const currentTrend = env.jetstream.trendStrength;
    const trendMomentum = env.flow.dominantFlow.strength > 60 ? 5 : -5;
    const predictedTrend = currentTrend + trendMomentum;
    predictions.push({
      metric: 'Trend Strength',
      currentValue: currentTrend,
      predictedValue: Math.max(0, Math.min(100, predictedTrend)),
      timeHorizon: 900000, // 15 min
      confidence: 0.65,
      rationale: 'Flow momentum analysis'
    });
    
    return predictions;
  }
  
  private generateFutureScenarios(
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null
  ): FutureScenario[] {
    const scenarios: FutureScenario[] = [];
    
    // Best case
    scenarios.push({
      name: 'Best Case: Strong Rally',
      probability: 0.2,
      timeframe: 1800000, // 30 min
      triggers: ['Bullish breakout', 'Volume surge', 'Positive catalyst'],
      implications: ['Strong upward movement', 'Increased volatility', 'Momentum continuation'],
      preparation: ['Set profit targets', 'Trail stop loss', 'Scale position']
    });
    
    // Expected case
    const likelyScenario = intel?.scenarios.find(s => s.scenario === intel.mostLikelyScenario);
    const expectedProb = intel && likelyScenario ? 
      (intel.scenarioConviction * likelyScenario.probability) : 0.5;
    scenarios.push({
      name: `Expected: ${intel?.mostLikelyScenario || 'Continuation'}`,
      probability: expectedProb,
      timeframe: 900000, // 15 min
      triggers: ['Current trend continues', 'No major disruptions'],
      implications: ['Moderate movement', 'Normal volatility'],
      preparation: ['Maintain strategy', 'Monitor key levels']
    });
    
    // Worst case
    scenarios.push({
      name: 'Worst Case: Sharp Reversal',
      probability: 0.15,
      timeframe: 1200000, // 20 min
      triggers: ['Support/resistance break', 'Negative catalyst', 'Stop cascade'],
      implications: ['Sharp reversal', 'High volatility', 'Potential losses'],
      preparation: ['Tighten stops', 'Reduce exposure', 'Prepare exit']
    });
    
    // Neutral case
    scenarios.push({
      name: 'Neutral: Consolidation',
      probability: 1 - expectedProb - 0.35,
      timeframe: 1800000, // 30 min
      triggers: ['Low volume', 'Balanced pressure', 'Range formation'],
      implications: ['Sideways movement', 'Low volatility', 'Accumulation phase'],
      preparation: ['Wait for clarity', 'Set range trades', 'Conserve capital']
    });
    
    return scenarios;
  }
  
  private detectEarlyWarnings(env: EnvironmentalState, memory: MemoryPhaseState): EarlyWarning[] {
    const warnings: EarlyWarning[] = [];
    
    // Volatility spike warning
    if (env.pulse.stressIndex > 70 && memory.cyclePhase === 'distribution') {
      warnings.push({
        type: 'volatility',
        severity: 0.8,
        timeToImpact: 300000, // 5 min
        probability: 0.7,
        description: 'Volatility spike likely during distribution phase',
        mitigationActions: ['Reduce position size', 'Widen stops', 'Increase cash']
      });
    }
    
    // Reversal warning
    if (env.jetstream.trendStrength > 80 && env.flow.dominantFlow.strength < 40) {
      warnings.push({
        type: 'reversal',
        severity: 0.6,
        timeToImpact: 600000, // 10 min
        probability: 0.5,
        description: 'Momentum divergence suggests potential reversal',
        mitigationActions: ['Lock profits', 'Trail stops', 'Watch for confirmation']
      });
    }
    
    return warnings;
  }
  
  private identifyOpportunities(
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null
  ): Opportunity[] {
    const opportunities: Opportunity[] = [];
    
    // Breakout opportunity
    if (env.pulse.stressIndex < 40 && env.flow.dominantFlow.strength > 60) {
      opportunities.push({
        type: 'breakout',
        quality: 0.7,
        timeWindow: 600000, // 10 min
        probability: 0.6,
        description: 'Low volatility + strong flow suggests breakout potential',
        requirements: ['Confirm direction', 'Volume confirmation', 'Clear resistance/support']
      });
    }
    
    // Trend opportunity
    if (intel && intel.timeframeAlignment > 0.7 && intel.certaintyIndex > 0.7) {
      opportunities.push({
        type: 'trend',
        quality: 0.8,
        timeWindow: 1800000, // 30 min
        probability: 0.7,
        description: 'High alignment across timeframes suggests strong trend',
        requirements: ['Entry on pullback', 'Momentum confirmation', 'Risk management']
      });
    }
    
    return opportunities;
  }
  
  // ============================================
  // TEMPORAL SYNTHESIS
  // ============================================
  
  private calculateTemporalAlignment(
    past: MemoryPhaseState,
    present: PresentPhaseState,
    future: FuturePhaseState
  ): number {
    // Check if past patterns align with present signals and future predictions
    const pastPresentAlignment = past.contextSimilarity * present.signalClarity;
    const presentFutureAlignment = present.clarityIndex * future.forecastReliability;
    const pastFutureAlignment = past.patternConfidence * future.predictionConfidence;
    
    return (pastPresentAlignment + presentFutureAlignment + pastFutureAlignment) / 3;
  }
  
  private countTemporalConflicts(
    past: MemoryPhaseState,
    present: PresentPhaseState,
    future: FuturePhaseState
  ): number {
    let conflicts = 0;
    
    // Check if successful strategies from past conflict with present signals
    if (past.successfulStrategies.includes('Trend Following') && present.instantaneousMomentum < -0.3) {
      conflicts++;
    }
    
    // Check if early warnings contradict opportunities
    if (future.earlyWarnings.length > 0 && future.opportunities.length > 0) {
      conflicts++;
    }
    
    return conflicts;
  }
  
  private calculateTemporalConfidence(
    past: MemoryPhaseState,
    present: PresentPhaseState,
    future: FuturePhaseState
  ): number {
    return (past.memoryClarity * 0.3 + present.clarityIndex * 0.4 + future.forecastReliability * 0.3);
  }
  
  private synthesizeTemporalSignal(
    past: MemoryPhaseState,
    present: PresentPhaseState,
    future: FuturePhaseState
  ): number {
    // Weight: Past 20%, Present 50%, Future 30%
    const pastSignal = past.patternConfidence * (past.cyclePhase === 'markup' ? 1 : past.cyclePhase === 'markdown' ? -1 : 0);
    const presentSignal = present.instantaneousMomentum;
    const futureSignal = future.predictions.length > 0
      ? (future.predictions[0].predictedValue - future.predictions[0].currentValue) / 100
      : 0;
    
    return pastSignal * 0.2 + presentSignal * 0.5 + futureSignal * 0.3;
  }
  
  private determineUnifiedAction(
    signal: number,
    confidence: number
  ): 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'wait' {
    if (confidence < 0.5) return 'wait';
    
    if (signal > 0.6 && confidence > 0.7) return 'strong-buy';
    if (signal > 0.3) return 'buy';
    if (signal < -0.6 && confidence > 0.7) return 'strong-sell';
    if (signal < -0.3) return 'sell';
    
    return 'hold';
  }
  
  private calculateNarrativeContinuity(
    past: MemoryPhaseState,
    present: PresentPhaseState,
    future: FuturePhaseState
  ): number {
    // How well does the story flow from past → present → future?
    const pastPresentFlow = past.contextSimilarity;
    const presentFutureFlow = future.forecastReliability;
    const overallCoherence = present.clarityIndex;
    
    return (pastPresentFlow * 0.3 + presentFutureFlow * 0.3 + overallCoherence * 0.4);
  }
  
  private calculateTemporalEntropy(
    past: MemoryPhaseState,
    present: PresentPhaseState,
    future: FuturePhaseState
  ): number {
    // Measure disorder/chaos in temporal understanding
    const memoryEntropy = 1 - past.memoryClarity;
    const presentEntropy = 1 - present.clarityIndex;
    const futureEntropy = future.uncertaintyLevel;
    
    return (memoryEntropy + presentEntropy + futureEntropy) / 3;
  }
  
  /**
   * Public accessors
   */
  public getCurrentTriPhase(): TriPhaseState | null {
    return this.currentTriPhase;
  }
  
  public getHistory(): TriPhaseState[] {
    return [...this.stateHistory];
  }
  
  public getMemoryPhase(): MemoryPhaseState | null {
    return this.currentTriPhase?.past || null;
  }
  
  public getPresentPhase(): PresentPhaseState | null {
    return this.currentTriPhase?.present || null;
  }
  
  public getFuturePhase(): FuturePhaseState | null {
    return this.currentTriPhase?.future || null;
  }
}
