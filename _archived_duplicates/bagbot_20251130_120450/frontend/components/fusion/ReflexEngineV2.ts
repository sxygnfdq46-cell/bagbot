/**
 * ⚡ REFLEX ENGINE V2
 * 
 * Enhanced reflex system with parallel processing and multi-path decision making.
 * 
 * KEY ENHANCEMENTS OVER V1:
 * • Parallel Processing: Evaluates multiple decision paths simultaneously
 * • Anticipatory Reactions: Predicts future states and pre-calculates responses
 * • Multi-Path Decisions: Considers multiple action paths and chooses optimal
 * • Adaptive Learning: Adjusts reflex sensitivity based on performance
 * • Context Awareness: Uses tri-phase temporal understanding
 * • Risk Intelligence: Sophisticated risk evaluation across scenarios
 * 
 * REFLEX TYPES:
 * • Protective: Immediate risk mitigation (stop-loss, position reduction)
 * • Opportunistic: Quick action on opportunities (entry signals, scaling)
 * • Adaptive: Environment-responsive adjustments (strategy shifts)
 * • Anticipatory: Pre-emptive actions based on prediction
 */

import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';
import type { ParallelIntelligenceState } from './ParallelIntelligenceCore';
import type { TriPhaseState } from './EnvTriPhaseAwareness';

// ============================================
// TYPES
// ============================================

export type ReflexType = 'protective' | 'opportunistic' | 'adaptive' | 'anticipatory';
export type ReflexPriority = 'critical' | 'high' | 'medium' | 'low';
export type ReflexState = 'primed' | 'triggered' | 'executing' | 'completed' | 'cancelled';

/**
 * Individual reflex response
 */
export interface Reflex {
  id: string;
  type: ReflexType;
  priority: ReflexPriority;
  state: ReflexState;
  
  // Trigger conditions
  trigger: ReflexTrigger;
  confidence: number;           // 0-1 confidence in this reflex
  sensitivity: number;          // 0-1 how easily triggered
  
  // Action
  action: ReflexAction;
  expectedImpact: number;       // 0-1 expected positive impact
  riskLevel: number;            // 0-1 risk of this action
  
  // Timing
  responseTime: number;         // milliseconds to execute
  expiresAt: number;            // timestamp when this reflex is no longer valid
  createdAt: number;
  triggeredAt?: number;
  completedAt?: number;
}

export interface ReflexTrigger {
  condition: string;            // Human-readable condition
  threshold: number;            // Numeric threshold if applicable
  currentValue: number;         // Current value of monitored metric
  met: boolean;                 // Whether trigger condition is met
  urgency: number;              // 0-1 how urgent this trigger is
}

export interface ReflexAction {
  type: 'enter' | 'exit' | 'scale-in' | 'scale-out' | 'adjust-stop' | 'hedge' | 'wait' | 'alert';
  description: string;
  parameters: Record<string, any>;
  reversible: boolean;          // Can this action be undone?
  requiresConfirmation: boolean; // Requires user confirmation?
}

/**
 * Decision path - a possible course of action
 */
export interface DecisionPath {
  id: string;
  name: string;
  
  // Path composition
  reflexChain: Reflex[];        // Sequence of reflexes in this path
  totalSteps: number;
  
  // Evaluation
  successProbability: number;   // 0-1 probability of success
  expectedValue: number;        // Expected outcome value
  riskScore: number;            // 0-1 overall risk
  rewardScore: number;          // 0-1 potential reward
  timeToComplete: number;       // milliseconds
  
  // Context
  scenarios: string[];          // Which scenarios this path addresses
  assumptions: string[];        // What must be true for this path to work
  
  score: number;                // Overall score for ranking
}

/**
 * Reflex Engine V2 State
 */
export interface ReflexEngineState {
  // Active reflexes
  activeReflexes: Reflex[];
  primedReflexes: Reflex[];     // Ready to trigger
  triggeredReflexes: Reflex[];  // Currently triggering
  executingReflexes: Reflex[];  // Currently executing
  
  // Decision paths
  evaluatedPaths: DecisionPath[];
  optimalPath: DecisionPath | null;
  alternativePaths: DecisionPath[];
  
  // Engine metrics
  reflexSensitivity: number;    // 0-1 overall sensitivity
  reactionSpeed: number;        // milliseconds average response time
  accuracyRate: number;         // 0-1 historical accuracy
  adaptationLevel: number;      // 0-1 how adapted to current conditions
  
  // Anticipatory state
  anticipatedTriggers: ReflexTrigger[];
  preparedActions: ReflexAction[];
  preCalculatedPaths: DecisionPath[];
  
  // Performance
  totalReflexes: number;
  successfulReflexes: number;
  failedReflexes: number;
  avgResponseTime: number;
  
  timestamp: number;
}

// ============================================
// REFLEX ENGINE V2
// ============================================

export class ReflexEngineV2 {
  private currentState: ReflexEngineState | null = null;
  private reflexHistory: Reflex[] = [];
  private maxHistorySize = 500;
  
  // Adaptive parameters
  private baseSensitivity = 0.6;
  private adaptationRate = 0.1;
  private learningEnabled = true;
  
  // Performance tracking
  private reflexPerformance: Map<string, { successes: number; failures: number; avgTime: number }> = new Map();
  
  /**
   * Main processing function
   */
  public process(
    environment: EnvironmentalState,
    intelligence: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null
  ): ReflexEngineState {
    // Generate reflexes based on current state
    const newReflexes = this.generateReflexes(environment, intelligence, triPhase);
    
    // Update existing reflexes
    const activeReflexes = this.updateReflexes(newReflexes);
    
    // Categorize by state
    const primedReflexes = activeReflexes.filter(r => r.state === 'primed');
    const triggeredReflexes = activeReflexes.filter(r => r.state === 'triggered');
    const executingReflexes = activeReflexes.filter(r => r.state === 'executing');
    
    // Evaluate decision paths
    const evaluatedPaths = this.evaluateDecisionPaths(activeReflexes, environment, intelligence);
    const optimalPath = evaluatedPaths.length > 0 
      ? evaluatedPaths.reduce((best, path) => path.score > best.score ? path : best)
      : null;
    const alternativePaths = evaluatedPaths.filter(p => p !== optimalPath).slice(0, 3);
    
    // Calculate sensitivity (adaptive)
    const reflexSensitivity = this.calculateAdaptiveSensitivity(environment, triPhase);
    
    // Calculate performance metrics
    const reactionSpeed = this.calculateAverageReactionSpeed();
    const accuracyRate = this.calculateAccuracyRate();
    const adaptationLevel = this.calculateAdaptationLevel(environment);
    
    // Anticipatory processing
    const anticipatedTriggers = triPhase ? this.anticipateTriggers(triPhase) : [];
    const preparedActions = this.prepareActions(anticipatedTriggers, intelligence);
    const preCalculatedPaths = this.preCalculatePaths(anticipatedTriggers, environment);
    
    // Performance stats
    const totalReflexes = this.reflexHistory.length;
    const successfulReflexes = this.reflexHistory.filter(r => 
      r.state === 'completed' && this.wasSuccessful(r)
    ).length;
    const failedReflexes = totalReflexes - successfulReflexes;
    const avgResponseTime = reactionSpeed;
    
    const state: ReflexEngineState = {
      activeReflexes,
      primedReflexes,
      triggeredReflexes,
      executingReflexes,
      evaluatedPaths,
      optimalPath,
      alternativePaths,
      reflexSensitivity,
      reactionSpeed,
      accuracyRate,
      adaptationLevel,
      anticipatedTriggers,
      preparedActions,
      preCalculatedPaths,
      totalReflexes,
      successfulReflexes,
      failedReflexes,
      avgResponseTime,
      timestamp: Date.now()
    };
    
    this.currentState = state;
    
    return state;
  }
  
  // ============================================
  // REFLEX GENERATION
  // ============================================
  
  private generateReflexes(
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null
  ): Reflex[] {
    const reflexes: Reflex[] = [];
    const now = Date.now();
    
    // Protective reflexes (highest priority)
    reflexes.push(...this.generateProtectiveReflexes(env, triPhase, now));
    
    // Opportunistic reflexes
    reflexes.push(...this.generateOpportunisticReflexes(env, intel, triPhase, now));
    
    // Adaptive reflexes
    reflexes.push(...this.generateAdaptiveReflexes(env, intel, now));
    
    // Anticipatory reflexes (unique to V2)
    if (triPhase) {
      reflexes.push(...this.generateAnticipatoryReflexes(triPhase, now));
    }
    
    return reflexes;
  }
  
  private generateProtectiveReflexes(
    env: EnvironmentalState,
    triPhase: TriPhaseState | null,
    now: number
  ): Reflex[] {
    const reflexes: Reflex[] = [];
    
    // High volatility protection
    if (env.pulse.stressIndex > 80) {
      reflexes.push({
        id: `protective_volatility_${now}`,
        type: 'protective',
        priority: 'critical',
        state: 'primed',
        trigger: {
          condition: 'Volatility spike detected',
          threshold: 80,
          currentValue: env.pulse.stressIndex,
          met: true,
          urgency: 0.9
        },
        confidence: 0.9,
        sensitivity: 0.9,
        action: {
          type: 'adjust-stop',
          description: 'Tighten stop-loss due to high volatility',
          parameters: { stopDistance: 'reduce_by_30_percent' },
          reversible: true,
          requiresConfirmation: false
        },
        expectedImpact: 0.7,
        riskLevel: 0.8,
        responseTime: 100,
        expiresAt: now + 300000, // 5 min
        createdAt: now
      });
    }
    
    // Trend reversal protection
    if (env.jetstream.trendStrength > 70 && env.flow.dominantFlow.strength < 30) {
      reflexes.push({
        id: `protective_reversal_${now}`,
        type: 'protective',
        priority: 'high',
        state: 'primed',
        trigger: {
          condition: 'Momentum divergence - reversal risk',
          threshold: 0.7,
          currentValue: Math.abs(env.jetstream.trendStrength - env.flow.dominantFlow.strength) / 100,
          met: true,
          urgency: 0.7
        },
        confidence: 0.75,
        sensitivity: 0.7,
        action: {
          type: 'scale-out',
          description: 'Reduce position size due to reversal risk',
          parameters: { reduction: 0.3 },
          reversible: false,
          requiresConfirmation: true
        },
        expectedImpact: 0.6,
        riskLevel: 0.6,
        responseTime: 500,
        expiresAt: now + 600000, // 10 min
        createdAt: now
      });
    }
    
    // Early warning response
    if (triPhase && triPhase.future.earlyWarnings.length > 0) {
      const warning = triPhase.future.earlyWarnings[0];
      reflexes.push({
        id: `protective_early_warning_${now}`,
        type: 'protective',
        priority: warning.severity > 0.7 ? 'critical' : 'high',
        state: 'primed',
        trigger: {
          condition: warning.description,
          threshold: warning.severity,
          currentValue: warning.probability,
          met: warning.probability > 0.6,
          urgency: warning.severity
        },
        confidence: warning.probability,
        sensitivity: 0.8,
        action: {
          type: 'alert',
          description: `Early warning: ${warning.description}`,
          parameters: { 
            actions: warning.mitigationActions,
            timeToImpact: warning.timeToImpact
          },
          reversible: true,
          requiresConfirmation: false
        },
        expectedImpact: 0.8,
        riskLevel: warning.severity,
        responseTime: 200,
        expiresAt: now + warning.timeToImpact,
        createdAt: now
      });
    }
    
    return reflexes;
  }
  
  private generateOpportunisticReflexes(
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null,
    now: number
  ): Reflex[] {
    const reflexes: Reflex[] = [];
    
    // Strong signal opportunity
    if (intel && Math.abs(intel.overallSignal) > 0.7 && intel.certaintyIndex > 0.7) {
      const isBullish = intel.overallSignal > 0;
      reflexes.push({
        id: `opportunistic_strong_signal_${now}`,
        type: 'opportunistic',
        priority: 'high',
        state: 'primed',
        trigger: {
          condition: `Strong ${isBullish ? 'bullish' : 'bearish'} signal with high certainty`,
          threshold: 0.7,
          currentValue: Math.abs(intel.overallSignal),
          met: true,
          urgency: 0.7
        },
        confidence: intel.certaintyIndex,
        sensitivity: 0.6,
        action: {
          type: 'enter',
          description: `Enter ${isBullish ? 'long' : 'short'} position`,
          parameters: { 
            direction: isBullish ? 'long' : 'short',
            size: 'standard',
            confidence: intel.certaintyIndex
          },
          reversible: true,
          requiresConfirmation: true
        },
        expectedImpact: intel.opportunityScore,
        riskLevel: intel.riskLevel,
        responseTime: 1000,
        expiresAt: now + 600000, // 10 min
        createdAt: now
      });
    }
    
    // Breakout opportunity
    if (env.pulse.stressIndex < 40 && env.flow.dominantFlow.strength > 70) {
      reflexes.push({
        id: `opportunistic_breakout_${now}`,
        type: 'opportunistic',
        priority: 'medium',
        state: 'primed',
        trigger: {
          condition: 'Low volatility + strong flow = breakout setup',
          threshold: 70,
          currentValue: env.flow.dominantFlow.strength,
          met: true,
          urgency: 0.6
        },
        confidence: 0.65,
        sensitivity: 0.5,
        action: {
          type: 'enter',
          description: 'Position for potential breakout',
          parameters: { 
            type: 'breakout',
            direction: env.flow.dominantFlow.direction < 180 ? 'long' : 'short'
          },
          reversible: true,
          requiresConfirmation: true
        },
        expectedImpact: 0.7,
        riskLevel: 0.4,
        responseTime: 2000,
        expiresAt: now + 900000, // 15 min
        createdAt: now
      });
    }
    
    // Future opportunity response
    if (triPhase && triPhase.future.opportunities.length > 0) {
      const opp = triPhase.future.opportunities[0];
      reflexes.push({
        id: `opportunistic_future_${now}`,
        type: 'opportunistic',
        priority: opp.quality > 0.7 ? 'high' : 'medium',
        state: 'primed',
        trigger: {
          condition: opp.description,
          threshold: opp.quality,
          currentValue: opp.probability,
          met: opp.probability > 0.6,
          urgency: opp.quality
        },
        confidence: opp.probability,
        sensitivity: 0.6,
        action: {
          type: 'enter',
          description: opp.description,
          parameters: { 
            type: opp.type,
            requirements: opp.requirements,
            timeWindow: opp.timeWindow
          },
          reversible: true,
          requiresConfirmation: true
        },
        expectedImpact: opp.quality,
        riskLevel: 1 - opp.probability,
        responseTime: 1500,
        expiresAt: now + opp.timeWindow,
        createdAt: now
      });
    }
    
    return reflexes;
  }
  
  private generateAdaptiveReflexes(
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null,
    now: number
  ): Reflex[] {
    const reflexes: Reflex[] = [];
    
    // Strategy adaptation
    if (intel && intel.optimalStrategy) {
      reflexes.push({
        id: `adaptive_strategy_${now}`,
        type: 'adaptive',
        priority: 'medium',
        state: 'primed',
        trigger: {
          condition: `Optimal strategy: ${intel.optimalStrategy}`,
          threshold: intel.strategyConfidence,
          currentValue: intel.strategyConfidence,
          met: intel.strategyConfidence > 0.6,
          urgency: 0.5
        },
        confidence: intel.strategyConfidence,
        sensitivity: 0.5,
        action: {
          type: 'adjust-stop',
          description: `Adapt to ${intel.optimalStrategy} strategy`,
          parameters: { 
            strategy: intel.optimalStrategy,
            adjustments: 'strategy_specific'
          },
          reversible: true,
          requiresConfirmation: false
        },
        expectedImpact: 0.6,
        riskLevel: 0.3,
        responseTime: 3000,
        expiresAt: now + 1800000, // 30 min
        createdAt: now
      });
    }
    
    // Timeframe adaptation
    if (intel && intel.dominantTimeframe) {
      reflexes.push({
        id: `adaptive_timeframe_${now}`,
        type: 'adaptive',
        priority: 'low',
        state: 'primed',
        trigger: {
          condition: `Dominant timeframe: ${intel.dominantTimeframe}`,
          threshold: intel.timeframeAlignment,
          currentValue: intel.timeframeAlignment,
          met: intel.timeframeAlignment > 0.6,
          urgency: 0.4
        },
        confidence: intel.timeframeAlignment,
        sensitivity: 0.4,
        action: {
          type: 'wait',
          description: `Adjust focus to ${intel.dominantTimeframe} timeframe`,
          parameters: { timeframe: intel.dominantTimeframe },
          reversible: true,
          requiresConfirmation: false
        },
        expectedImpact: 0.5,
        riskLevel: 0.2,
        responseTime: 5000,
        expiresAt: now + 3600000, // 1 hour
        createdAt: now
      });
    }
    
    return reflexes;
  }
  
  private generateAnticipatoryReflexes(triPhase: TriPhaseState, now: number): Reflex[] {
    const reflexes: Reflex[] = [];
    
    // Anticipate based on predictions
    if (triPhase.future.predictions.length > 0) {
      const prediction = triPhase.future.predictions[0];
      const predictedChange = prediction.predictedValue - prediction.currentValue;
      
      if (Math.abs(predictedChange) > 10) {
        reflexes.push({
          id: `anticipatory_prediction_${now}`,
          type: 'anticipatory',
          priority: 'medium',
          state: 'primed',
          trigger: {
            condition: `Anticipating ${prediction.metric} change: ${predictedChange.toFixed(1)}`,
            threshold: Math.abs(predictedChange),
            currentValue: prediction.currentValue,
            met: prediction.confidence > 0.6,
            urgency: prediction.confidence * 0.6
          },
          confidence: prediction.confidence,
          sensitivity: 0.5,
          action: {
            type: 'alert',
            description: `Prepare for ${prediction.metric} change`,
            parameters: { 
              metric: prediction.metric,
              expectedChange: predictedChange,
              timeHorizon: prediction.timeHorizon,
              rationale: prediction.rationale
            },
            reversible: true,
            requiresConfirmation: false
          },
          expectedImpact: 0.6,
          riskLevel: 0.4,
          responseTime: 500,
          expiresAt: now + prediction.timeHorizon,
          createdAt: now
        });
      }
    }
    
    // Anticipate scenario outcomes
    if (triPhase.future.futureScenarios.length > 0) {
      const likelyScenario = triPhase.future.futureScenarios.reduce((max, s) => 
        s.probability > max.probability ? s : max
      );
      
      if (likelyScenario.probability > 0.5) {
        reflexes.push({
          id: `anticipatory_scenario_${now}`,
          type: 'anticipatory',
          priority: 'high',
          state: 'primed',
          trigger: {
            condition: `Anticipating scenario: ${likelyScenario.name}`,
            threshold: likelyScenario.probability,
            currentValue: likelyScenario.probability,
            met: true,
            urgency: likelyScenario.probability * 0.7
          },
          confidence: likelyScenario.probability,
          sensitivity: 0.6,
          action: {
            type: 'wait',
            description: `Prepare for ${likelyScenario.name}`,
            parameters: { 
              scenario: likelyScenario.name,
              preparation: likelyScenario.preparation,
              triggers: likelyScenario.triggers
            },
            reversible: true,
            requiresConfirmation: false
          },
          expectedImpact: 0.7,
          riskLevel: 0.5,
          responseTime: 1000,
          expiresAt: now + likelyScenario.timeframe,
          createdAt: now
        });
      }
    }
    
    return reflexes;
  }
  
  // ============================================
  // REFLEX MANAGEMENT
  // ============================================
  
  private updateReflexes(newReflexes: Reflex[]): Reflex[] {
    const now = Date.now();
    const active: Reflex[] = [];
    
    for (const reflex of newReflexes) {
      // Check if expired
      if (reflex.expiresAt < now) continue;
      
      // Update state based on trigger
      if (reflex.trigger.met && reflex.state === 'primed') {
        reflex.state = 'triggered';
        reflex.triggeredAt = now;
      }
      
      // Add to history if completed
      if (reflex.state === 'completed' || reflex.state === 'cancelled') {
        this.reflexHistory.push(reflex);
        if (this.reflexHistory.length > this.maxHistorySize) {
          this.reflexHistory.shift();
        }
        continue;
      }
      
      active.push(reflex);
    }
    
    return active;
  }
  
  // ============================================
  // DECISION PATH EVALUATION
  // ============================================
  
  private evaluateDecisionPaths(
    reflexes: Reflex[],
    env: EnvironmentalState,
    intel: ParallelIntelligenceState | null
  ): DecisionPath[] {
    const paths: DecisionPath[] = [];
    
    // Single reflex paths
    for (const reflex of reflexes.filter(r => r.priority === 'critical' || r.priority === 'high')) {
      paths.push(this.createSingleReflexPath(reflex, env));
    }
    
    // Combined reflex paths
    const protectiveReflexes = reflexes.filter(r => r.type === 'protective');
    const opportunisticReflexes = reflexes.filter(r => r.type === 'opportunistic');
    
    if (protectiveReflexes.length > 0 && opportunisticReflexes.length > 0) {
      paths.push(this.createBalancedPath(protectiveReflexes, opportunisticReflexes, env));
    }
    
    // Score all paths
    for (const path of paths) {
      path.score = this.scorePath(path, intel);
    }
    
    return paths.sort((a, b) => b.score - a.score);
  }
  
  private createSingleReflexPath(reflex: Reflex, env: EnvironmentalState): DecisionPath {
    return {
      id: `path_single_${reflex.id}`,
      name: `${reflex.type}: ${reflex.action.description}`,
      reflexChain: [reflex],
      totalSteps: 1,
      successProbability: reflex.confidence,
      expectedValue: reflex.expectedImpact * reflex.confidence,
      riskScore: reflex.riskLevel,
      rewardScore: reflex.expectedImpact,
      timeToComplete: reflex.responseTime,
      scenarios: [reflex.trigger.condition],
      assumptions: [reflex.action.description],
      score: 0 // Will be calculated
    };
  }
  
  private createBalancedPath(
    protective: Reflex[],
    opportunistic: Reflex[],
    env: EnvironmentalState
  ): DecisionPath {
    const bestProtective = protective.reduce((max, r) => r.confidence > max.confidence ? r : max);
    const bestOpportunistic = opportunistic.reduce((max, r) => r.expectedImpact > max.expectedImpact ? r : max);
    
    const chain = [bestProtective, bestOpportunistic];
    const totalTime = chain.reduce((sum, r) => sum + r.responseTime, 0);
    const avgConfidence = chain.reduce((sum, r) => sum + r.confidence, 0) / chain.length;
    const avgRisk = chain.reduce((sum, r) => sum + r.riskLevel, 0) / chain.length;
    const avgReward = chain.reduce((sum, r) => sum + r.expectedImpact, 0) / chain.length;
    
    return {
      id: `path_balanced_${Date.now()}`,
      name: 'Balanced: Protect then Capitalize',
      reflexChain: chain,
      totalSteps: chain.length,
      successProbability: avgConfidence,
      expectedValue: avgReward * avgConfidence - avgRisk * 0.5,
      riskScore: avgRisk,
      rewardScore: avgReward,
      timeToComplete: totalTime,
      scenarios: chain.map(r => r.trigger.condition),
      assumptions: chain.map(r => r.action.description),
      score: 0
    };
  }
  
  private scorePath(path: DecisionPath, intel: ParallelIntelligenceState | null): number {
    const riskRewardRatio = path.rewardScore / Math.max(0.1, path.riskScore);
    const probabilityWeight = path.successProbability;
    const expectedValueWeight = path.expectedValue;
    const timeWeight = 1 / (path.timeToComplete / 1000); // Faster is better
    
    // Intel alignment bonus
    let intelBonus = 0;
    if (intel) {
      intelBonus = intel.certaintyIndex * 0.2;
    }
    
    return (
      riskRewardRatio * 0.3 +
      probabilityWeight * 0.3 +
      expectedValueWeight * 0.2 +
      timeWeight * 0.1 +
      intelBonus * 0.1
    );
  }
  
  // ============================================
  // ANTICIPATORY PROCESSING
  // ============================================
  
  private anticipateTriggers(triPhase: TriPhaseState): ReflexTrigger[] {
    const triggers: ReflexTrigger[] = [];
    
    // Anticipate from early warnings
    for (const warning of triPhase.future.earlyWarnings) {
      triggers.push({
        condition: `Anticipated: ${warning.description}`,
        threshold: warning.severity,
        currentValue: warning.probability,
        met: false, // Not yet met, but anticipated
        urgency: warning.severity * (1 - warning.timeToImpact / 600000) // Higher urgency as time approaches
      });
    }
    
    // Anticipate from opportunities
    for (const opp of triPhase.future.opportunities) {
      triggers.push({
        condition: `Anticipated opportunity: ${opp.description}`,
        threshold: opp.quality,
        currentValue: opp.probability,
        met: false,
        urgency: opp.quality * 0.7
      });
    }
    
    return triggers;
  }
  
  private prepareActions(triggers: ReflexTrigger[], intel: ParallelIntelligenceState | null): ReflexAction[] {
    const actions: ReflexAction[] = [];
    
    for (const trigger of triggers) {
      if (trigger.condition.includes('warning')) {
        actions.push({
          type: 'hedge',
          description: `Pre-emptive hedge for: ${trigger.condition}`,
          parameters: { trigger: trigger.condition },
          reversible: true,
          requiresConfirmation: true
        });
      } else if (trigger.condition.includes('opportunity')) {
        actions.push({
          type: 'alert',
          description: `Ready for: ${trigger.condition}`,
          parameters: { trigger: trigger.condition },
          reversible: true,
          requiresConfirmation: false
        });
      }
    }
    
    return actions;
  }
  
  private preCalculatePaths(triggers: ReflexTrigger[], env: EnvironmentalState): DecisionPath[] {
    // Pre-calculate decision paths for anticipated scenarios
    // This allows instant response when triggers actually occur
    const paths: DecisionPath[] = [];
    
    // Simplified - would be more comprehensive in production
    for (const trigger of triggers.slice(0, 3)) {
      paths.push({
        id: `precalc_${Date.now()}_${Math.random()}`,
        name: `Pre-calculated path for ${trigger.condition}`,
        reflexChain: [],
        totalSteps: 1,
        successProbability: trigger.currentValue,
        expectedValue: trigger.currentValue * trigger.urgency,
        riskScore: 1 - trigger.currentValue,
        rewardScore: trigger.urgency,
        timeToComplete: 100, // Pre-calculated, so very fast
        scenarios: [trigger.condition],
        assumptions: ['Trigger will occur'],
        score: trigger.currentValue * trigger.urgency
      });
    }
    
    return paths;
  }
  
  // ============================================
  // ADAPTIVE LEARNING
  // ============================================
  
  private calculateAdaptiveSensitivity(env: EnvironmentalState, triPhase: TriPhaseState | null): number {
    if (!this.learningEnabled) return this.baseSensitivity;
    
    // Adjust sensitivity based on conditions
    let adjustment = 0;
    
    // Increase sensitivity in volatile conditions
    if (env.pulse.stressIndex > 70) {
      adjustment += 0.2;
    }
    
    // Decrease sensitivity in unclear conditions
    if (env.coherence < 40) {
      adjustment -= 0.1;
    }
    
    // Adjust based on recent accuracy
    const accuracy = this.calculateAccuracyRate();
    if (accuracy < 0.5) {
      adjustment -= 0.15; // Lower sensitivity if we're not accurate
    } else if (accuracy > 0.8) {
      adjustment += 0.1; // Increase if we're doing well
    }
    
    const newSensitivity = Math.max(0.2, Math.min(1.0, this.baseSensitivity + adjustment));
    
    // Gradually adapt base sensitivity
    this.baseSensitivity += (newSensitivity - this.baseSensitivity) * this.adaptationRate;
    
    return this.baseSensitivity;
  }
  
  private calculateAdaptationLevel(env: EnvironmentalState): number {
    // How well adapted are we to current conditions?
    const recentReflexes = this.reflexHistory.slice(-20);
    if (recentReflexes.length === 0) return 0.5;
    
    const successRate = recentReflexes.filter(r => this.wasSuccessful(r)).length / recentReflexes.length;
    return successRate;
  }
  
  // ============================================
  // PERFORMANCE METRICS
  // ============================================
  
  private calculateAverageReactionSpeed(): number {
    const recentReflexes = this.reflexHistory.slice(-50);
    if (recentReflexes.length === 0) return 500;
    
    const completedReflexes = recentReflexes.filter(r => r.triggeredAt && r.completedAt);
    if (completedReflexes.length === 0) return 500;
    
    const totalTime = completedReflexes.reduce((sum, r) => 
      sum + (r.completedAt! - r.triggeredAt!), 0
    );
    
    return totalTime / completedReflexes.length;
  }
  
  private calculateAccuracyRate(): number {
    const recent = this.reflexHistory.slice(-100);
    if (recent.length === 0) return 0.5;
    
    const successful = recent.filter(r => this.wasSuccessful(r)).length;
    return successful / recent.length;
  }
  
  private wasSuccessful(reflex: Reflex): boolean {
    // Simplified success check - would be more sophisticated in production
    return reflex.state === 'completed' && reflex.confidence > 0.6;
  }
  
  /**
   * Public accessors
   */
  public getCurrentState(): ReflexEngineState | null {
    return this.currentState;
  }
  
  public getActiveReflexes(): Reflex[] {
    return this.currentState?.activeReflexes || [];
  }
  
  public getOptimalPath(): DecisionPath | null {
    return this.currentState?.optimalPath || null;
  }
  
  public getReflexHistory(): Reflex[] {
    return [...this.reflexHistory];
  }
  
  public setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
  }
  
  public setSensitivity(sensitivity: number): void {
    this.baseSensitivity = Math.max(0, Math.min(1, sensitivity));
  }
}
