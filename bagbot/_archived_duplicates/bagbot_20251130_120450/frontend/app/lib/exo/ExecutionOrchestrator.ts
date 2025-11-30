/**
 * 🎼 EXECUTION ORCHESTRATOR (EXO)
 * 
 * STEP 24.39 — Execution Orchestrator
 * 
 * Purpose:
 * EXO is the final decision authority before execution. It orchestrates all
 * intelligence layers (DPL, MSFE, EAE, Shield) and applies safety rules to
 * produce the ultimate EXECUTE/WAIT/CANCEL/SCALE command.
 * 
 * This prevents:
 * ❌ Conflicting signals causing bad decisions
 * ❌ Executing under unsafe conditions
 * ❌ Ignoring critical safety rules
 * ❌ Poor risk management
 * ❌ Oversized positions
 * 
 * Responsibilities:
 * - Load inputs from all decision layers
 * - Merge signals into unified decision
 * - Apply execution safety rules
 * - Compute final command (EXECUTE/WAIT/CANCEL/SCALE)
 * - Calculate final position size
 * - Assess risk score
 * - Provide transparent reasoning
 * 
 * Think of EXO as the "mission control commander" - taking input from all
 * systems and making the final go/no-go decision.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Fast execution (<25ms)
 * - Complete transparency
 */

import type {
  EXODecision,
  EXOContext,
  EXOConfig,
  EXOStatistics,
  SignalMergeData,
  ExecutionRuleResult,
  EXOMetadata,
  RuleContext,
  OrderbookData,
} from './types';
import type { DPLDecision } from '../dpl/types';
import type { FusionResult } from '../msfe/types';
import type { EAETiming } from '../eae/types';
import { mergeDecisionLayers, createLayerInputsSummary } from './mergeSignals';
import {
  evaluateAllRules,
  hasBlockingFailures,
  getBlockingRules,
  getFailedRules,
  calculateRuleScore,
} from './rules';

// ============================================================================
// EXECUTION ORCHESTRATOR CLASS
// ============================================================================

export class ExecutionOrchestrator {
  private config: EXOConfig;
  private lastDecision: EXODecision | null = null;
  private evaluationCount: number = 0;

  // Current inputs (loaded via loadInputs)
  private currentInputs: {
    dpl: DPLDecision | null;
    fusion: FusionResult | null;
    eae: EAETiming | null;
    shield: string;
    context: EXOContext | null;
    orderbook: OrderbookData | undefined;
  } = {
    dpl: null,
    fusion: null,
    eae: null,
    shield: 'CALM',
    context: null,
    orderbook: undefined,
  };

  // Statistics
  private stats: EXOStatistics = {
    totalEvaluations: 0,
    executionsIssued: 0,
    executionsBlocked: 0,
    waitsIssued: 0,
    cancelsIssued: 0,
    scalesIssued: 0,
    averageStrength: 0,
    averageRiskScore: 0,
    ruleBlockRate: {},
    lastEvaluationTime: 0,
  };

  constructor(config?: Partial<EXOConfig>) {
    this.config = {
      enableSignalMerge: config?.enableSignalMerge ?? true,
      enableRuleValidation: config?.enableRuleValidation ?? true,
      minExecutionStrength: config?.minExecutionStrength ?? 60,
      maxRiskScore: config?.maxRiskScore ?? 70,
      signalWeights: config?.signalWeights || {
        dpl: 0.35,
        fusion: 0.30,
        eae: 0.25,
        shield: 0.10,
      },
      blockingRules: config?.blockingRules || [
        'min_timing',
        'shield_ok',
        'spread_ok',
        'liquidity_ok',
      ],
      scalingEnabled: config?.scalingEnabled ?? true,
      maxPositionSize: config?.maxPositionSize ?? 1.0,
      minPositionSize: config?.minPositionSize ?? 0.1,
    };

    console.log('🎼 ExecutionOrchestrator initialized');
  }

  // ==========================================================================
  // LOAD INPUTS — Load all decision layer inputs
  // ==========================================================================

  public loadInputs(
    dpl: DPLDecision,
    fusion: FusionResult,
    eae: EAETiming,
    shield: string,
    context: EXOContext,
    orderbook?: OrderbookData
  ): void {
    this.currentInputs = {
      dpl,
      fusion,
      eae,
      shield,
      context,
      orderbook,
    };

    console.log('🎼 EXO: Inputs loaded');
  }

  // ==========================================================================
  // MERGE SIGNALS — Merge all decision layers
  // ==========================================================================

  public mergeSignals(): SignalMergeData {
    const { dpl, fusion, eae, shield } = this.currentInputs;

    if (!dpl || !fusion || !eae) {
      throw new Error('Cannot merge signals - inputs not loaded');
    }

    if (!this.config.enableSignalMerge) {
      // Fallback: use DPL signal
      return {
        finalSignal: dpl.allowTrade ? (dpl.action as any) : 'WAIT',
        signalStrength: dpl.confidence,
        confidence: dpl.confidence,
        weights: this.config.signalWeights,
        alignment: {
          dplAligned: true,
          fusionAligned: true,
          eaeAligned: true,
          shieldAligned: true,
          overallAlignment: 100,
        },
        conflicts: [],
      };
    }

    return mergeDecisionLayers(dpl, fusion, eae, shield);
  }

  // ==========================================================================
  // APPLY RULES — Apply execution safety rules
  // ==========================================================================

  public applyRules(): ExecutionRuleResult[] {
    const { eae, shield, context, orderbook } = this.currentInputs;

    if (!context) {
      throw new Error('Cannot apply rules - context not loaded');
    }

    if (!this.config.enableRuleValidation) {
      return []; // Skip rules
    }

    const ruleContext: RuleContext = {
      eaeTiming: eae || undefined,
      shieldState: shield,
      marketContext: context.marketContext,
      orderbook,
      currentPosition: context.currentPosition,
      accountBalance: context.accountBalance,
      timestamp: Date.now(),
    };

    return evaluateAllRules(eae || undefined, shield, ruleContext, orderbook);
  }

  // ==========================================================================
  // COMPUTE FINAL DECISION — Main orchestration logic
  // ==========================================================================

  public computeFinalDecision(): EXODecision {
    const startTime = Date.now();
    this.evaluationCount++;
    this.stats.totalEvaluations++;

    console.log(`🎼 EXO Evaluation #${this.evaluationCount} — Computing final decision...`);

    const { dpl, fusion, eae, shield, context } = this.currentInputs;

    if (!dpl || !fusion || !eae || !context) {
      throw new Error('Cannot compute decision - inputs not loaded');
    }

    // Step 1: Merge signals
    const signalMerge = this.mergeSignals();

    // Step 2: Apply rules
    const ruleResults = this.applyRules();

    // Step 3: Check for blocking failures
    const hasBlocking = hasBlockingFailures(ruleResults);
    const blockingRules = getBlockingRules(ruleResults);
    const failedRules = getFailedRules(ruleResults);

    // Step 4: Determine command
    let command: EXODecision['command'] = 'WAIT';
    const reasons: string[] = [];

    if (hasBlocking) {
      command = 'WAIT';
      reasons.push(`Blocking rules failed: ${blockingRules.join(', ')}`);
    } else if (signalMerge.finalSignal === 'WAIT') {
      command = 'WAIT';
      reasons.push('Merged signal is WAIT');
    } else if (signalMerge.confidence < this.config.minExecutionStrength) {
      command = 'WAIT';
      reasons.push(
        `Confidence ${signalMerge.confidence} below minimum (${this.config.minExecutionStrength})`
      );
    } else {
      command = 'EXECUTE';
      reasons.push(`All conditions met - ${signalMerge.finalSignal} signal confirmed`);
      reasons.push(`Confidence: ${signalMerge.confidence}`);
    }

    // Step 5: Calculate risk score
    const riskScore = this.calculateRiskScore(signalMerge, ruleResults, context);

    // Check if risk too high
    if (riskScore > this.config.maxRiskScore && command === 'EXECUTE') {
      command = 'SCALE';
      reasons.push(`Risk score ${riskScore} exceeds max (${this.config.maxRiskScore}) - scaling down`);
    }

    // Step 6: Calculate final position size
    const finalSize = this.calculateFinalSize(signalMerge, riskScore, eae);

    // Step 7: Build metadata
    const metadata: EXOMetadata = {
      signalMerge,
      ruleResults,
      passedRules: ruleResults.filter((r) => r.passed).map((r) => r.ruleName),
      failedRules,
      blockingRules,
      layerInputs: {
        dpl: dpl.action,
        fusion: fusion.signal,
        eae: eae.fire ? 'FIRE' : 'WAIT',
        shield,
      },
      computationTime: Date.now() - startTime,
    };

    const decision: EXODecision = {
      command,
      reason: reasons,
      strength: signalMerge.confidence,
      timing: eae,
      riskScore,
      finalSize,
      metadata,
      timestamp: Date.now(),
    };

    // Update statistics
    this.updateStatistics(decision, ruleResults);

    // Store decision
    this.lastDecision = decision;

    console.log(
      `✅ EXO Decision: ${command} | ` +
      `Strength: ${decision.strength} | Risk: ${riskScore} | Size: ${(finalSize * 100).toFixed(0)}%`
    );

    return decision;
  }

  // ==========================================================================
  // GET DECISION
  // ==========================================================================

  public getDecision(): EXODecision | null {
    return this.lastDecision;
  }

  // ==========================================================================
  // GET SNAPSHOT
  // ==========================================================================

  public getSnapshot(): EXODecision | null {
    return this.lastDecision;
  }

  // ==========================================================================
  // GET STATISTICS
  // ==========================================================================

  public getStatistics(): EXOStatistics {
    return { ...this.stats };
  }

  // ==========================================================================
  // CALCULATE RISK SCORE
  // ==========================================================================

  private calculateRiskScore(
    signalMerge: SignalMergeData,
    ruleResults: ExecutionRuleResult[],
    context: EXOContext
  ): number {
    let riskScore = 0;

    // Conflict risk (20%)
    const conflictRisk = signalMerge.conflicts.length * 10; // Each conflict adds 10 points
    riskScore += Math.min(conflictRisk, 20);

    // Alignment risk (20%)
    const alignmentRisk = (100 - signalMerge.alignment.overallAlignment) * 0.2;
    riskScore += alignmentRisk;

    // Rule risk (30%)
    const ruleScore = calculateRuleScore(ruleResults);
    const ruleRisk = (100 - ruleScore) * 0.3;
    riskScore += ruleRisk;

    // Volatility risk (15%)
    const volatility = context.marketContext.volatility;
    const volatilityRisk =
      volatility === 'extreme' ? 15 : volatility === 'high' ? 10 : volatility === 'medium' ? 5 : 0;
    riskScore += volatilityRisk;

    // Shield risk (15%)
    const shield = context.shieldState;
    const shieldRisk =
      shield === 'DEFENSIVE' ? 15 : shield === 'PROTECTIVE' ? 10 : shield === 'AGGRO_OBS' ? 5 : 0;
    riskScore += shieldRisk;

    return Math.round(Math.min(riskScore, 100));
  }

  // ==========================================================================
  // CALCULATE FINAL SIZE
  // ==========================================================================

  private calculateFinalSize(
    signalMerge: SignalMergeData,
    riskScore: number,
    eae: EAETiming
  ): number {
    // Start with EAE recommended size
    let size = eae.recommendedSize;

    // Adjust by confidence
    const confidenceMultiplier = signalMerge.confidence / 100;
    size *= confidenceMultiplier;

    // Adjust by risk (inverse relationship)
    const riskMultiplier = 1 - riskScore / 100;
    size *= riskMultiplier;

    // Clamp to min/max
    size = Math.max(this.config.minPositionSize, Math.min(this.config.maxPositionSize, size));

    return Math.round(size * 100) / 100;
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(decision: EXODecision, ruleResults: ExecutionRuleResult[]): void {
    // Update command counts
    switch (decision.command) {
      case 'EXECUTE':
        this.stats.executionsIssued++;
        break;
      case 'WAIT':
        this.stats.waitsIssued++;
        break;
      case 'CANCEL':
        this.stats.cancelsIssued++;
        break;
      case 'SCALE':
        this.stats.scalesIssued++;
        break;
    }

    if (decision.command !== 'EXECUTE') {
      this.stats.executionsBlocked++;
    }

    // Update averages
    this.stats.averageStrength =
      (this.stats.averageStrength * (this.stats.totalEvaluations - 1) + decision.strength) /
      this.stats.totalEvaluations;

    this.stats.averageRiskScore =
      (this.stats.averageRiskScore * (this.stats.totalEvaluations - 1) + decision.riskScore) /
      this.stats.totalEvaluations;

    // Update rule block rates
    for (const rule of ruleResults.filter((r) => !r.passed)) {
      if (!this.stats.ruleBlockRate[rule.ruleName]) {
        this.stats.ruleBlockRate[rule.ruleName] = 0;
      }
      this.stats.ruleBlockRate[rule.ruleName] =
        (this.stats.ruleBlockRate[rule.ruleName] * (this.stats.totalEvaluations - 1) + 1) /
        this.stats.totalEvaluations;
    }

    // Update evaluation time
    this.stats.lastEvaluationTime = decision.metadata.computationTime;
  }

  // ==========================================================================
  // GET VERSION
  // ==========================================================================

  public getVersion(): string {
    return '1.0.0 — STEP 24.39';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let orchestrator: ExecutionOrchestrator | null = null;

export function getExecutionOrchestrator(
  config?: Partial<EXOConfig>
): ExecutionOrchestrator {
  if (!orchestrator) {
    orchestrator = new ExecutionOrchestrator(config);
  }
  return orchestrator;
}

export default getExecutionOrchestrator;
