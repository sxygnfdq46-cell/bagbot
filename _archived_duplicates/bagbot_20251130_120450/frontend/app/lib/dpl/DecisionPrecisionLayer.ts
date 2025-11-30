/**
 * 🎯 DECISION PRECISION LAYER (DPL)
 * 
 * STEP 24.37 — Decision Precision Layer
 * 
 * Purpose:
 * DPL is the final precision filter before execution. It performs micro-level
 * validation checks to ensure the fusion signal is safe to execute RIGHT NOW.
 * 
 * This prevents:
 * ❌ Trading against short-term micro-trends
 * ❌ Execution during volatility spikes
 * ❌ Fighting strong opposing orderbook pressure
 * ❌ High slippage due to poor liquidity
 * ❌ Ignoring conflicting candlestick patterns
 * 
 * Responsibilities:
 * - Micro-trend alignment check (1-5 minute trends)
 * - Volatility band validation (no trading in extreme volatility)
 * - Orderbook pressure analysis (detect opposing forces)
 * - Liquidity and slippage validation (ensure adequate depth)
 * - Candlestick precision check (recent candle alignment)
 * - Combine all validators into final decision
 * 
 * Think of DPL as the "execution safety officer" - it has veto power over
 * fusion decisions if market conditions are not suitable for immediate execution.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Fast execution (<15ms)
 * - Granular validation feedback
 */

import type {
  DPLDecision,
  DPLValidatorResult,
  DPLContext,
  DPLConfig,
  DPLStatistics,
  MicroTrendData,
  OrderbookData,
  CandleData,
} from './types';
import {
  validateMicroTrends,
  validateVolatility,
  validatePressure,
  validateLiquidity,
  validateCandlePrecision,
  calculateOverallScore,
  countPassedValidators,
  getFailedValidators,
  getPassedValidators,
} from './validators';

// ============================================================================
// DECISION PRECISION LAYER CLASS
// ============================================================================

export class DecisionPrecisionLayer {
  private config: DPLConfig;
  private lastDecision: DPLDecision | null = null;
  private evaluationCount: number = 0;

  // Statistics
  private stats: DPLStatistics = {
    totalEvaluations: 0,
    tradesAllowed: 0,
    tradesBlocked: 0,
    blockReasons: {},
    averageConfidence: 0,
    averageOverallScore: 0,
    validatorPassRates: {},
    lastEvaluationTime: 0,
  };

  constructor(config?: Partial<DPLConfig>) {
    this.config = {
      enableMicroTrends: config?.enableMicroTrends ?? true,
      enableVolatilityBands: config?.enableVolatilityBands ?? true,
      enableOpposingPressure: config?.enableOpposingPressure ?? true,
      enableLiquiditySlip: config?.enableLiquiditySlip ?? true,
      enableCandlePrecision: config?.enableCandlePrecision ?? true,
      minValidatorsToPass: config?.minValidatorsToPass ?? 3,
      minOverallScore: config?.minOverallScore ?? 60,
      microTrendThreshold: config?.microTrendThreshold ?? 40,
      volatilityBandThreshold: config?.volatilityBandThreshold ?? 70,
      liquidityMinThreshold: config?.liquidityMinThreshold ?? 50,
      spreadMaxThreshold: config?.spreadMaxThreshold ?? 0.5,
      opposingPressureMaxThreshold: config?.opposingPressureMaxThreshold ?? 0.6,
      candleAlignmentRequired: config?.candleAlignmentRequired ?? true,
    };

    console.log('🎯 DecisionPrecisionLayer initialized');
  }

  // ==========================================================================
  // MICRO TREND CHECK
  // ==========================================================================

  public microTrendCheck(context: DPLContext): DPLValidatorResult {
    if (!this.config.enableMicroTrends) {
      return {
        validatorName: 'microTrend',
        pass: true,
        score: 50,
        reason: 'Micro-trend check disabled',
      };
    }

    return validateMicroTrends(context);
  }

  // ==========================================================================
  // VOLATILITY BAND CHECK
  // ==========================================================================

  public volatilityBandCheck(context: DPLContext): DPLValidatorResult {
    if (!this.config.enableVolatilityBands) {
      return {
        validatorName: 'volatilityBand',
        pass: true,
        score: 50,
        reason: 'Volatility band check disabled',
      };
    }

    return validateVolatility(context);
  }

  // ==========================================================================
  // OPPOSING PRESSURE CHECK
  // ==========================================================================

  public opposingPressureCheck(
    orderbook: OrderbookData | undefined,
    context: DPLContext
  ): DPLValidatorResult {
    if (!this.config.enableOpposingPressure) {
      return {
        validatorName: 'opposingPressure',
        pass: true,
        score: 50,
        reason: 'Opposing pressure check disabled',
      };
    }

    return validatePressure(orderbook, context.fusionResult.signal);
  }

  // ==========================================================================
  // LIQUIDITY SLIP CHECK
  // ==========================================================================

  public liquiditySlipCheck(orderbook: OrderbookData | undefined): DPLValidatorResult {
    if (!this.config.enableLiquiditySlip) {
      return {
        validatorName: 'liquiditySlip',
        pass: true,
        score: 50,
        reason: 'Liquidity slip check disabled',
      };
    }

    return validateLiquidity(orderbook);
  }

  // ==========================================================================
  // CANDLE PRECISION CHECK
  // ==========================================================================

  public candlePrecisionCheck(
    candleData: CandleData | undefined,
    signal: 'LONG' | 'SHORT' | 'NEUTRAL'
  ): DPLValidatorResult {
    if (!this.config.enableCandlePrecision) {
      return {
        validatorName: 'candlePrecision',
        pass: true,
        score: 50,
        reason: 'Candle precision check disabled',
      };
    }

    return validateCandlePrecision(candleData, signal);
  }

  // ==========================================================================
  // REFINE DECISION — Main decision refinement
  // ==========================================================================

  public refineDecision(
    fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
    validators: DPLValidatorResult[]
  ): DPLDecision {
    const startTime = Date.now();
    this.evaluationCount++;
    this.stats.totalEvaluations++;

    console.log(`🎯 DPL Evaluation #${this.evaluationCount} — Refining ${fusionResult.signal} decision...`);

    // Calculate overall score
    const overallScore = calculateOverallScore(validators);

    // Count passed validators
    const passedCount = countPassedValidators(validators);
    const failedValidators = getFailedValidators(validators);
    const passedValidators = getPassedValidators(validators);

    // Determine if trade is allowed
    const meetsValidatorThreshold = passedCount >= this.config.minValidatorsToPass;
    const meetsScoreThreshold = overallScore >= this.config.minOverallScore;
    const allowTrade = meetsValidatorThreshold && meetsScoreThreshold;

    // Determine action
    let action: 'LONG' | 'SHORT' | 'WAIT' = 'WAIT';
    if (allowTrade) {
      action = fusionResult.signal === 'NEUTRAL' ? 'WAIT' : fusionResult.signal;
    }

    // Calculate confidence (fusion strength × overall score / 100)
    const confidence = Math.round((fusionResult.strength * overallScore) / 100);

    // Collect reasons
    const reasons: string[] = [];
    if (allowTrade) {
      reasons.push(`Trade allowed: ${passedCount}/${validators.length} validators passed`);
      reasons.push(`Overall score: ${overallScore.toFixed(0)}/100`);
    } else {
      if (!meetsValidatorThreshold) {
        reasons.push(
          `Insufficient validators passed: ${passedCount}/${validators.length} (min: ${this.config.minValidatorsToPass})`
        );
      }
      if (!meetsScoreThreshold) {
        reasons.push(
          `Overall score too low: ${overallScore.toFixed(0)}/100 (min: ${this.config.minOverallScore})`
        );
      }
      reasons.push(`Failed validators: ${failedValidators.join(', ')}`);
    }

    // Build debug info
    const validatorScores: Record<string, number> = {};
    for (const v of validators) {
      validatorScores[v.validatorName] = v.score;
    }

    const debug = {
      validatorScores,
      failedValidators,
      passedValidators,
      evaluationTime: Date.now() - startTime,
      microTrendInfo: {
        direction: 'UNKNOWN',
        strength: 0,
        momentum: 0,
      },
      orderbookInfo: undefined as any,
      candleInfo: undefined as any,
    };

    // Extract metadata for debug
    for (const v of validators) {
      if (v.validatorName === 'microTrend' && v.metadata) {
        debug.microTrendInfo = {
          direction: v.metadata.direction || 'UNKNOWN',
          strength: v.metadata.strength || 0,
          momentum: v.metadata.momentum || 0,
        };
      }
      if (v.validatorName === 'opposingPressure' && v.metadata) {
        debug.orderbookInfo = {
          imbalance: v.metadata.imbalance || 0,
          spread: 0,
          liquidityScore: 0,
        };
      }
      if (v.validatorName === 'liquiditySlip' && v.metadata) {
        if (!debug.orderbookInfo) {
          debug.orderbookInfo = { imbalance: 0, spread: 0, liquidityScore: 0 };
        }
        debug.orderbookInfo.liquidityScore = v.metadata.score || 0;
        debug.orderbookInfo.spread = v.metadata.spread || 0;
      }
      if (v.validatorName === 'candlePrecision' && v.metadata) {
        debug.candleInfo = {
          direction: v.metadata.direction || 'UNKNOWN',
          bodyPercent: v.metadata.bodyPercent || 0,
          pattern: v.metadata.pattern || 'normal',
        };
      }
    }

    const decision: DPLDecision = {
      allowTrade,
      action,
      confidence,
      reasons,
      validatorResults: validators,
      overallScore,
      debug,
      timestamp: Date.now(),
    };

    // Update statistics
    this.updateStatistics(decision, validators);

    // Store decision
    this.lastDecision = decision;

    console.log(
      `✅ DPL Result: ${allowTrade ? 'ALLOW' : 'BLOCK'} ${action} | ` +
      `Confidence: ${confidence} | Score: ${overallScore.toFixed(0)}`
    );

    return decision;
  }

  // ==========================================================================
  // GET SNAPSHOT
  // ==========================================================================

  public getSnapshot(): DPLDecision | null {
    return this.lastDecision;
  }

  // ==========================================================================
  // GET STATISTICS
  // ==========================================================================

  public getStatistics(): DPLStatistics {
    return { ...this.stats };
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(decision: DPLDecision, validators: DPLValidatorResult[]): void {
    // Update trade counts
    if (decision.allowTrade) {
      this.stats.tradesAllowed++;
    } else {
      this.stats.tradesBlocked++;

      // Track block reasons
      for (const failed of getFailedValidators(validators)) {
        this.stats.blockReasons[failed] = (this.stats.blockReasons[failed] || 0) + 1;
      }
    }

    // Update averages
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (this.stats.totalEvaluations - 1) + decision.confidence) /
      this.stats.totalEvaluations;

    this.stats.averageOverallScore =
      (this.stats.averageOverallScore * (this.stats.totalEvaluations - 1) + decision.overallScore) /
      this.stats.totalEvaluations;

    // Update validator pass rates
    for (const v of validators) {
      if (!this.stats.validatorPassRates[v.validatorName]) {
        this.stats.validatorPassRates[v.validatorName] = 0;
      }

      const currentRate = this.stats.validatorPassRates[v.validatorName];
      const newRate =
        (currentRate * (this.stats.totalEvaluations - 1) + (v.pass ? 1 : 0)) /
        this.stats.totalEvaluations;

      this.stats.validatorPassRates[v.validatorName] = newRate;
    }

    // Update evaluation time
    this.stats.lastEvaluationTime = decision.debug.evaluationTime;
  }

  // ==========================================================================
  // EVALUATE — Main Entry Point
  // ==========================================================================

  public evaluate(
    fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
    marketContext: {
      shield: string;
      threats: number;
      volatility: string;
      riskLevel?: 'low' | 'medium' | 'high';
    },
    microTrendData: MicroTrendData,
    orderbookData?: OrderbookData,
    candleData?: CandleData
  ): DPLDecision {
    const context: DPLContext = {
      fusionResult,
      marketContext,
      microTrendData,
      orderbookData,
      candleData,
      timestamp: Date.now(),
    };

    // Run all validators
    const validators: DPLValidatorResult[] = [];

    validators.push(this.microTrendCheck(context));
    validators.push(this.volatilityBandCheck(context));
    validators.push(this.opposingPressureCheck(orderbookData, context));
    validators.push(this.liquiditySlipCheck(orderbookData));
    validators.push(this.candlePrecisionCheck(candleData, fusionResult.signal));

    // Refine decision
    return this.refineDecision(fusionResult, validators);
  }

  // ==========================================================================
  // GET VERSION
  // ==========================================================================

  public getVersion(): string {
    return '1.0.0 — STEP 24.37';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let layer: DecisionPrecisionLayer | null = null;

export function getDecisionPrecisionLayer(
  config?: Partial<DPLConfig>
): DecisionPrecisionLayer {
  if (!layer) {
    layer = new DecisionPrecisionLayer(config);
  }
  return layer;
}

export default getDecisionPrecisionLayer;
