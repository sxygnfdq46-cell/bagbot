/**
 * 🔮 STRATEGY FUSION ENGINE (MSFE)
 * 
 * STEP 24.36 — Multi-Layer Strategy Fusion
 * 
 * Purpose:
 * MSFE is the strategy orchestrator that takes outputs from MULTIPLE trading
 * strategies and fuses them into a single, weighted, conflict-resolved signal.
 * 
 * This prevents:
 * ❌ Following a single strategy blindly
 * ❌ Ignoring strategy disagreements
 * ❌ Equal weighting when some strategies perform better
 * ❌ Strategy conflicts causing random decisions
 * 
 * Responsibilities:
 * - Score each strategy's output
 * - Assign dynamic weights based on context (shield, threats, volatility)
 * - Fuse signals using weighted averaging
 * - Resolve conflicts when strategies disagree
 * - Output unified signal with strength and debug info
 * 
 * Think of MSFE as the "strategy parliament" where each strategy gets a vote,
 * but vote weight depends on current conditions and past performance.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Fast execution (<30ms)
 * - Transparent weight assignment
 */

import type {
  StrategyScore,
  WeightMap,
  FusionResult,
  MarketContext,
  MSFEConfig,
  StrategyOutput,
} from './types';
import {
  computeDynamicWeights,
  normalizeWeights,
  adaptWeightsByThreat,
  adaptWeightsByVolatility,
} from './weights';

// ============================================================================
// STRATEGY FUSION ENGINE CLASS
// ============================================================================

export class StrategyFusionEngine {
  private config: MSFEConfig;
  private lastFusion: FusionResult | null = null;
  private fusionCount: number = 0;

  // Performance tracking per strategy
  private strategyPerformance: Map<string, number[]> = new Map();

  // Statistics
  private stats = {
    totalFusions: 0,
    longSignals: 0,
    shortSignals: 0,
    neutralSignals: 0,
    conflictsResolved: 0,
    averageStrength: 0,
    lastFusionTime: 0,
  };

  constructor(config?: Partial<MSFEConfig>) {
    this.config = {
      enableDynamicWeights: config?.enableDynamicWeights ?? true,
      enableConflictResolution: config?.enableConflictResolution ?? true,
      enablePerformanceTracking: config?.enablePerformanceTracking ?? true,
      baseWeights: config?.baseWeights || {
        momentumStrategy: 0.25,
        meanReversionStrategy: 0.20,
        trendFollowingStrategy: 0.20,
        volatilityStrategy: 0.15,
        sentimentStrategy: 0.10,
        patternStrategy: 0.10,
      },
      conflictThreshold: config?.conflictThreshold ?? 0.4, // Signal spread > 0.4 = conflict
      minStrengthForSignal: config?.minStrengthForSignal ?? 30,
      performanceWindow: config?.performanceWindow ?? 20, // Last 20 fusions
    };

    console.log('🔮 StrategyFusionEngine initialized');
  }

  // ==========================================================================
  // SCORE STRATEGIES — Evaluate each strategy
  // ==========================================================================

  public scoreStrategies(
    strategyOutputs: StrategyOutput[],
    marketContext: MarketContext
  ): StrategyScore[] {
    const scores: StrategyScore[] = [];

    for (const output of strategyOutputs) {
      // Base score from strategy output
      let score = output.confidence || 50;

      // Adjust score based on market context alignment
      score = this.adjustScoreByContext(score, output, marketContext);

      // Apply historical performance adjustment
      if (this.config.enablePerformanceTracking) {
        score = this.adjustScoreByPerformance(score, output.strategyName);
      }

      // Clamp score to 0-100
      score = Math.max(0, Math.min(100, score));

      scores.push({
        strategyName: output.strategyName,
        signal: output.signal,
        confidence: output.confidence,
        rawScore: output.confidence,
        adjustedScore: score,
        reasoning: output.reasoning || '',
      });
    }

    return scores;
  }

  // ==========================================================================
  // ASSIGN WEIGHTS — Dynamic weight assignment
  // ==========================================================================

  public assignWeights(
    scores: StrategyScore[],
    shield: string,
    threats: number,
    volatility: string
  ): WeightMap {
    let weights: WeightMap = {};

    // Start with base weights
    for (const score of scores) {
      weights[score.strategyName] = this.config.baseWeights[score.strategyName] || 0.1;
    }

    // Compute dynamic weights based on scores and context
    if (this.config.enableDynamicWeights) {
      const context: MarketContext = {
        shield,
        threats,
        volatility,
        timestamp: Date.now(),
      };

      weights = computeDynamicWeights(scores, context, this.config.baseWeights);
    }

    // Adapt weights by threat level
    weights = adaptWeightsByThreat(weights, shield, threats);

    // Adapt weights by volatility
    weights = adaptWeightsByVolatility(weights, volatility);

    // Normalize to sum to 1.0
    weights = normalizeWeights(weights);

    return weights;
  }

  // ==========================================================================
  // FUSE SIGNALS — Weighted signal fusion
  // ==========================================================================

  public fuseSignals(
    scores: StrategyScore[],
    weights: WeightMap
  ): { signal: FusionResult['signal']; strength: number; debug: any } {
    let longStrength = 0;
    let shortStrength = 0;
    let neutralStrength = 0;

    const debug: any = {
      contributions: {},
      totalWeight: 0,
    };

    // Calculate weighted contributions
    for (const score of scores) {
      const weight = weights[score.strategyName] || 0;
      const contribution = score.adjustedScore * weight;

      debug.contributions[score.strategyName] = {
        signal: score.signal,
        score: score.adjustedScore,
        weight: weight.toFixed(3),
        contribution: contribution.toFixed(2),
      };

      debug.totalWeight += weight;

      // Accumulate by signal type
      if (score.signal === 'LONG') {
        longStrength += contribution;
      } else if (score.signal === 'SHORT') {
        shortStrength += contribution;
      } else {
        neutralStrength += contribution;
      }
    }

    // Determine dominant signal
    const maxStrength = Math.max(longStrength, shortStrength, neutralStrength);
    let signal: FusionResult['signal'] = 'NEUTRAL';

    if (longStrength === maxStrength && longStrength > this.config.minStrengthForSignal) {
      signal = 'LONG';
    } else if (shortStrength === maxStrength && shortStrength > this.config.minStrengthForSignal) {
      signal = 'SHORT';
    }

    // Calculate signal strength (0-100)
    const strength = Number(maxStrength.toFixed(1));

    debug.longStrength = longStrength.toFixed(2);
    debug.shortStrength = shortStrength.toFixed(2);
    debug.neutralStrength = neutralStrength.toFixed(2);
    debug.dominantSignal = signal;

    return { signal, strength, debug };
  }

  // ==========================================================================
  // RESOLVE CONFLICTS — Handle strategy disagreements
  // ==========================================================================

  public resolveConflicts(
    fusionResult: { signal: FusionResult['signal']; strength: number; debug: any },
    scores: StrategyScore[]
  ): FusionResult {
    if (!this.config.enableConflictResolution) {
      return {
        signal: fusionResult.signal,
        strength: fusionResult.strength,
        weights: {},
        hasConflict: false,
        conflictResolution: null,
        debug: fusionResult.debug,
        timestamp: Date.now(),
      };
    }

    // Detect conflict: significant disagreement between strategies
    const longCount = scores.filter((s) => s.signal === 'LONG').length;
    const shortCount = scores.filter((s) => s.signal === 'SHORT').length;
    const neutralCount = scores.filter((s) => s.signal === 'NEUTRAL').length;

    const totalStrategies = scores.length;
    const maxCount = Math.max(longCount, shortCount, neutralCount);
    const agreement = maxCount / totalStrategies;

    const hasConflict = agreement < (1 - this.config.conflictThreshold);

    let conflictResolution = null;

    if (hasConflict) {
      this.stats.conflictsResolved++;

      // Conflict resolution strategy: Favor neutral if disagreement is high
      if (agreement < 0.5) {
        conflictResolution = {
          originalSignal: fusionResult.signal,
          resolvedSignal: 'NEUTRAL' as const,
          reason: `High disagreement (${(agreement * 100).toFixed(0)}% agreement) - defaulting to NEUTRAL`,
          strategyDistribution: {
            LONG: longCount,
            SHORT: shortCount,
            NEUTRAL: neutralCount,
          },
        };

        fusionResult.signal = 'NEUTRAL';
        fusionResult.strength = Math.min(fusionResult.strength, 50); // Reduce strength
      } else {
        conflictResolution = {
          originalSignal: fusionResult.signal,
          resolvedSignal: fusionResult.signal,
          reason: `Moderate disagreement (${(agreement * 100).toFixed(0)}% agreement) - keeping dominant signal but reducing strength`,
          strategyDistribution: {
            LONG: longCount,
            SHORT: shortCount,
            NEUTRAL: neutralCount,
          },
        };

        fusionResult.strength *= 0.7; // Reduce strength by 30%
      }
    }

    return {
      signal: fusionResult.signal,
      strength: fusionResult.strength,
      weights: {},
      hasConflict,
      conflictResolution,
      debug: fusionResult.debug,
      timestamp: Date.now(),
    };
  }

  // ==========================================================================
  // ADJUST SCORE BY CONTEXT
  // ==========================================================================

  private adjustScoreByContext(
    score: number,
    output: StrategyOutput,
    context: MarketContext
  ): number {
    let adjustment = 0;

    // Adjust for volatility alignment
    if (context.volatility === 'high' && output.strategyName === 'volatilityStrategy') {
      adjustment += 10; // Volatility strategy performs better in high volatility
    }

    // Adjust for trend alignment
    if (context.shield === 'AGGRO_OBS' && output.strategyName === 'trendFollowingStrategy') {
      adjustment += 10; // Trend following works well in aggressive mode
    }

    // Adjust for mean reversion in ranging markets
    if (context.shield === 'CALM' && output.strategyName === 'meanReversionStrategy') {
      adjustment += 10;
    }

    return score + adjustment;
  }

  // ==========================================================================
  // ADJUST SCORE BY PERFORMANCE
  // ==========================================================================

  private adjustScoreByPerformance(score: number, strategyName: string): number {
    const history = this.strategyPerformance.get(strategyName) || [];

    if (history.length === 0) {
      return score; // No history yet
    }

    // Calculate average performance
    const avgPerformance = history.reduce((sum, p) => sum + p, 0) / history.length;

    // Adjust score based on performance (±20%)
    const performanceMultiplier = 0.8 + (avgPerformance / 100) * 0.4; // 0.8 to 1.2
    return score * performanceMultiplier;
  }

  // ==========================================================================
  // UPDATE PERFORMANCE TRACKING
  // ==========================================================================

  private updatePerformanceTracking(strategyName: string, score: number): void {
    if (!this.config.enablePerformanceTracking) {
      return;
    }

    const history = this.strategyPerformance.get(strategyName) || [];
    history.push(score);

    // Keep only recent performance
    if (history.length > this.config.performanceWindow) {
      history.shift();
    }

    this.strategyPerformance.set(strategyName, history);
  }

  // ==========================================================================
  // GET FUSION SNAPSHOT
  // ==========================================================================

  public getFusionSnapshot(): FusionResult | null {
    return this.lastFusion;
  }

  // ==========================================================================
  // GET STATISTICS
  // ==========================================================================

  public getStatistics() {
    return { ...this.stats };
  }

  // ==========================================================================
  // EVALUATE FUSION — Main Entry Point
  // ==========================================================================

  public evaluate(
    strategyOutputs: StrategyOutput[],
    marketContext: MarketContext
  ): FusionResult {
    const startTime = Date.now();
    this.fusionCount++;
    this.stats.totalFusions++;

    console.log(`🔮 MSFE Fusion #${this.fusionCount} — Fusing ${strategyOutputs.length} strategies...`);

    // Step 1: Score strategies
    const scores = this.scoreStrategies(strategyOutputs, marketContext);

    // Step 2: Assign weights
    const weights = this.assignWeights(
      scores,
      marketContext.shield,
      marketContext.threats,
      marketContext.volatility
    );

    // Step 3: Fuse signals
    const fusionResult = this.fuseSignals(scores, weights);

    // Step 4: Resolve conflicts
    const finalResult = this.resolveConflicts(fusionResult, scores);

    // Add weights to result
    finalResult.weights = weights;

    // Update statistics
    this.updateStatistics(finalResult, startTime);

    // Store result
    this.lastFusion = finalResult;

    console.log(
      `✅ MSFE Result: ${finalResult.signal} (strength: ${finalResult.strength}) | ` +
      `Conflict: ${finalResult.hasConflict ? 'YES' : 'NO'}`
    );

    return finalResult;
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(result: FusionResult, startTime: number): void {
    this.stats.lastFusionTime = Date.now() - startTime;

    switch (result.signal) {
      case 'LONG':
        this.stats.longSignals++;
        break;
      case 'SHORT':
        this.stats.shortSignals++;
        break;
      case 'NEUTRAL':
        this.stats.neutralSignals++;
        break;
    }

    // Update average strength
    this.stats.averageStrength =
      (this.stats.averageStrength * (this.stats.totalFusions - 1) + result.strength) /
      this.stats.totalFusions;
  }

  // ==========================================================================
  // GET VERSION
  // ==========================================================================

  public getVersion(): string {
    return '1.0.0 — STEP 24.36';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let engine: StrategyFusionEngine | null = null;

export function getStrategyFusionEngine(
  config?: Partial<MSFEConfig>
): StrategyFusionEngine {
  if (!engine) {
    engine = new StrategyFusionEngine(config);
  }
  return engine;
}

export default getStrategyFusionEngine;
