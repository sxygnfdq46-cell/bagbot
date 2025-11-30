/**
 * ⚡ EXECUTION SURVIVAL MATRIX (ESM)
 * 
 * STEP 24.29 — One of the most powerful upgrades in the entire shield-network
 * 
 * This is where BagBot finally gains mid-trade survival intelligence —
 * the ability to adapt, shift, and defend a running position like a living organism.
 * 
 * Purpose:
 * The ESM is BagBot's self-defense system during live trades.
 * It continuously evaluates the trade's survival probability and chooses the safest path.
 * 
 * It works hand-in-hand with:
 * - Real-Time Execution Monitor (RTEM)
 * - Threat Memory
 * - Hedge Pathway Engine
 * - Volatility Pulse Engine
 * - Adaptive Shield
 * 
 * What ESM actually does:
 * 
 * 1. Computes survival probability
 *    Based on:
 *    - volatility pulse
 *    - momentum decay
 *    - orderbook pressure
 *    - RTEM anomaly flags
 *    - threat signatures
 * 
 * 2. Chooses an optimal survival route
 *    It selects between four survival pathways:
 *    - PATH 1 — HOLD (if the trade is safe and trending)
 *    - PATH 2 — MICRO-ADJUST (small SL tightening, small TP shift)
 *    - PATH 3 — RAPID EXIT (triggered when survival probability drops below threshold)
 *    - PATH 4 — SHIFT/REVERSAL (trade flip signal - frontend only simulation)
 * 
 * 3. Generates a "Survival Report Packet"
 *    This goes to the new UI:
 *    {
 *      tradeId,
 *      survivalScore: number,
 *      survivalPath: string,
 *      threatFactors: string[],
 *      recommendedAction: string,
 *      executionUrgency: "low" | "medium" | "high"
 *    }
 * 
 * Architecture:
 * ESM sits on top of RTEM:
 * RTEM → ESM → UI Decision Layer
 * 
 * - RTEM detects anomalies
 * - ESM calculates survival outcome
 * - UI shows BagBot's decision reasoning
 * 
 * This is exactly how a top-tier AI trader survives volatile markets.
 * 
 * Requirements:
 * - Frontend-only TypeScript module
 * - Export class ExecutionSurvivalMatrix
 * - Inputs:
 *   - rtemPacket
 *   - volatilityPulse
 *   - threatMemorySnapshot
 *   - hedgeSignals (optional)
 * - Methods to implement:
 *   * computeSurvivalScore()
 *   * determineSurvivalPath()
 *   * evaluateThreatFactors()
 *   * generateSurvivalPacket()
 * - Must support 4 survival paths:
 *   PATH_HOLD
 *   PATH_MICROADJUST
 *   PATH_RAPID_EXIT
 *   PATH_SHIFT_REVERSAL
 * - Must be modular and lightweight.
 * - Must NOT make backend or API calls.
 * - Designed to integrate with:
 *   - RealTimeExecutionMonitor
 *   - Hedge Pathway Engine
 *   - Stability Shield Engine
 * - Output must follow:
 *   {
 *     tradeId,
 *     survivalScore: number,
 *     survivalPath: string,
 *     threatFactors: string[],
 *     recommendedAction: string,
 *     executionUrgency: "low" | "medium" | "high"
 *   }
 */

import type { RTEMStatusPacket, AnomalyFlag } from '../monitoring/RealTimeExecutionMonitor';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Volatility pulse data
 */
export interface VolatilityPulse {
  current: number;               // 0-100
  trend: 'RISING' | 'FALLING' | 'STABLE';
  momentum: number;              // -100 to +100
  shockRisk: number;             // 0-100
}

/**
 * Threat memory snapshot
 */
export interface ThreatMemorySnapshot {
  recentThreats: string[];
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  cascadeRisk: number;           // 0-1
  activeThreatCount: number;
}

/**
 * Hedge signals (optional)
 */
export interface HedgeSignals {
  hedgeActive: boolean;
  hedgeStrength: number;         // 0-100
  correlationProtection: number; // 0-100
}

/**
 * ESM input data
 */
export interface ESMInput {
  rtemPacket: RTEMStatusPacket;
  volatilityPulse: VolatilityPulse;
  threatMemorySnapshot: ThreatMemorySnapshot;
  hedgeSignals?: HedgeSignals;
  marketMomentum?: number;       // -100 to +100
  orderbookPressure?: number;    // -100 to +100 (negative = sell pressure)
}

/**
 * Survival path options
 */
export type SurvivalPath = 
  | 'PATH_HOLD'
  | 'PATH_MICROADJUST'
  | 'PATH_RAPID_EXIT'
  | 'PATH_SHIFT_REVERSAL';

/**
 * Execution urgency level
 */
export type ExecutionUrgency = 'low' | 'medium' | 'high';

/**
 * Survival report packet (output)
 */
export interface SurvivalReportPacket {
  tradeId: string;
  survivalScore: number;         // 0-100
  survivalPath: SurvivalPath;
  threatFactors: string[];
  recommendedAction: string;
  executionUrgency: ExecutionUrgency;
  pathReasoning: string;
  adjustments?: SurvivalAdjustments;
  metadata: SurvivalMetadata;
}

/**
 * Survival adjustments for MICRO-ADJUST path
 */
export interface SurvivalAdjustments {
  stopLossAdjustment?: number;   // % adjustment
  takeProfitAdjustment?: number; // % adjustment
  positionSizeAdjustment?: number; // % adjustment
  holdTimeExtension?: number;    // milliseconds
}

/**
 * Survival metadata
 */
export interface SurvivalMetadata {
  computationTime: number;       // milliseconds
  confidenceLevel: number;       // 0-100
  alternativePaths: SurvivalPath[];
  timestamp: number;
}

/**
 * Threat evaluation result
 */
interface ThreatEvaluation {
  factors: string[];
  severity: number;              // 0-100
  urgency: ExecutionUrgency;
}

// ============================================================================
// EXECUTION SURVIVAL MATRIX CLASS
// ============================================================================

export class ExecutionSurvivalMatrix {
  // Configuration thresholds
  private readonly SURVIVAL_THRESHOLDS = {
    critical: 30,                // Below this = RAPID_EXIT
    low: 50,                     // Below this = MICRO_ADJUST
    safe: 70,                    // Above this = HOLD
  };

  private readonly THREAT_WEIGHTS = {
    volatility: 0.30,
    anomalies: 0.25,
    threats: 0.20,
    momentum: 0.15,
    orderbook: 0.10,
  };

  private readonly VERSION = '24.29.0';

  /**
   * Main survival evaluation method
   */
  public evaluate(input: ESMInput): SurvivalReportPacket {
    const startTime = Date.now();

    // Step 1: Compute survival score
    const survivalScore = this.computeSurvivalScore(input);

    // Step 2: Evaluate threat factors
    const threatEval = this.evaluateThreatFactors(input);

    // Step 3: Determine survival path
    const survivalPath = this.determineSurvivalPath(
      survivalScore,
      threatEval,
      input
    );

    // Step 4: Generate recommended action and reasoning
    const { action, reasoning, urgency } = this.generateActionReasoning(
      survivalPath,
      survivalScore,
      threatEval,
      input
    );

    // Step 5: Calculate adjustments (if MICRO_ADJUST path)
    const adjustments = survivalPath === 'PATH_MICROADJUST'
      ? this.calculateAdjustments(input, survivalScore)
      : undefined;

    // Step 6: Determine alternative paths
    const alternativePaths = this.determineAlternativePaths(
      survivalPath,
      survivalScore
    );

    // Step 7: Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(
      survivalScore,
      threatEval,
      input
    );

    // Step 8: Build survival report packet
    const packet: SurvivalReportPacket = {
      tradeId: input.rtemPacket.tradeId,
      survivalScore,
      survivalPath,
      threatFactors: threatEval.factors,
      recommendedAction: action,
      executionUrgency: urgency,
      pathReasoning: reasoning,
      adjustments,
      metadata: {
        computationTime: Date.now() - startTime,
        confidenceLevel,
        alternativePaths,
        timestamp: Date.now(),
      },
    };

    return packet;
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Compute overall survival score (0-100)
   */
  private computeSurvivalScore(input: ESMInput): number {
    let score = 0;

    // Component 1: RTEM health score (base survival)
    const rtemHealth = input.rtemPacket.healthScore;
    score += rtemHealth * 0.40; // 40% weight

    // Component 2: Volatility factor (inverted - low vol = higher survival)
    const volatilityFactor = 100 - input.volatilityPulse.current;
    score += volatilityFactor * this.THREAT_WEIGHTS.volatility * 100;

    // Component 3: Anomaly penalty
    const anomalyPenalty = input.rtemPacket.anomalyCount * 5;
    const criticalPenalty = input.rtemPacket.criticalAnomalies * 15;
    score -= anomalyPenalty + criticalPenalty;

    // Component 4: Threat level penalty
    const threatPenalty = this.calculateThreatPenalty(
      input.threatMemorySnapshot.threatLevel
    );
    score -= threatPenalty;

    // Component 5: Momentum bonus/penalty
    if (input.marketMomentum !== undefined) {
      const momentumBonus = input.marketMomentum * 0.1; // -10 to +10
      score += momentumBonus;
    }

    // Component 6: Orderbook pressure adjustment
    if (input.orderbookPressure !== undefined) {
      const pressureAdj = input.orderbookPressure * 0.05; // -5 to +5
      score += pressureAdj;
    }

    // Component 7: Hedge protection bonus
    if (input.hedgeSignals?.hedgeActive) {
      const hedgeBonus = input.hedgeSignals.hedgeStrength * 0.15;
      score += hedgeBonus;
    }

    // Component 8: Volatility shock risk penalty
    const shockPenalty = input.volatilityPulse.shockRisk * 0.2;
    score -= shockPenalty;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate threat level penalty
   */
  private calculateThreatPenalty(threatLevel: string): number {
    switch (threatLevel) {
      case 'CRITICAL':
        return 40;
      case 'HIGH':
        return 25;
      case 'MODERATE':
        return 10;
      case 'LOW':
      default:
        return 0;
    }
  }

  /**
   * Evaluate threat factors from all inputs
   */
  private evaluateThreatFactors(input: ESMInput): ThreatEvaluation {
    const factors: string[] = [];
    let severity = 0;

    // Factor 1: RTEM anomalies
    if (input.rtemPacket.criticalAnomalies > 0) {
      factors.push(`${input.rtemPacket.criticalAnomalies} critical anomalies detected`);
      severity += 30;
    } else if (input.rtemPacket.anomalyCount > 0) {
      factors.push(`${input.rtemPacket.anomalyCount} anomalies detected`);
      severity += 15;
    }

    // Factor 2: Volatility threats
    if (input.volatilityPulse.current > 80) {
      factors.push('Extreme volatility detected');
      severity += 25;
    } else if (input.volatilityPulse.current > 60) {
      factors.push('High volatility environment');
      severity += 12;
    }

    // Factor 3: Volatility shock risk
    if (input.volatilityPulse.shockRisk > 70) {
      factors.push('High volatility shock risk');
      severity += 20;
    }

    // Factor 4: Threat memory warnings
    if (input.threatMemorySnapshot.threatLevel === 'CRITICAL') {
      factors.push('Critical threat level in memory');
      severity += 35;
    } else if (input.threatMemorySnapshot.threatLevel === 'HIGH') {
      factors.push('High threat level detected');
      severity += 20;
    }

    // Factor 5: Active threat count
    if (input.threatMemorySnapshot.activeThreatCount > 3) {
      factors.push(`${input.threatMemorySnapshot.activeThreatCount} active threats`);
      severity += 15;
    }

    // Factor 6: Cascade risk
    if (input.threatMemorySnapshot.cascadeRisk > 0.7) {
      factors.push('High cascade risk detected');
      severity += 18;
    }

    // Factor 7: Negative momentum
    if (input.marketMomentum !== undefined && input.marketMomentum < -50) {
      factors.push('Strong negative momentum');
      severity += 15;
    }

    // Factor 8: Orderbook pressure against position
    if (input.orderbookPressure !== undefined && input.orderbookPressure < -60) {
      factors.push('Heavy sell pressure in orderbook');
      severity += 12;
    }

    // Factor 9: Recent threat signatures
    if (input.threatMemorySnapshot.recentThreats.length > 0) {
      factors.push(`Recent threats: ${input.threatMemorySnapshot.recentThreats.slice(0, 2).join(', ')}`);
      severity += 8;
    }

    // Factor 10: Negative PnL
    if (input.rtemPacket.currentPnL < 0) {
      const pnlPercent = (input.rtemPacket.currentPnL / input.rtemPacket.liveMetrics.currentPnL) * 100;
      if (Math.abs(pnlPercent) > 5) {
        factors.push(`Significant unrealized loss: ${pnlPercent.toFixed(1)}%`);
        severity += Math.min(25, Math.abs(pnlPercent) * 3);
      }
    }

    // Determine urgency based on severity
    let urgency: ExecutionUrgency = 'low';
    if (severity > 60) urgency = 'high';
    else if (severity > 30) urgency = 'medium';

    return {
      factors,
      severity: Math.min(100, severity),
      urgency,
    };
  }

  /**
   * Determine optimal survival path
   */
  private determineSurvivalPath(
    survivalScore: number,
    threatEval: ThreatEvaluation,
    input: ESMInput
  ): SurvivalPath {
    // Rule 1: Critical survival score = RAPID EXIT
    if (survivalScore < this.SURVIVAL_THRESHOLDS.critical) {
      return 'PATH_RAPID_EXIT';
    }

    // Rule 2: Critical anomalies = RAPID EXIT
    if (input.rtemPacket.criticalAnomalies > 0) {
      return 'PATH_RAPID_EXIT';
    }

    // Rule 3: Critical threat level = RAPID EXIT
    if (input.threatMemorySnapshot.threatLevel === 'CRITICAL') {
      return 'PATH_RAPID_EXIT';
    }

    // Rule 4: Strong reversal signal + high urgency = SHIFT/REVERSAL
    if (
      threatEval.urgency === 'high' &&
      input.marketMomentum !== undefined &&
      Math.abs(input.marketMomentum) > 70
    ) {
      return 'PATH_SHIFT_REVERSAL';
    }

    // Rule 5: Low survival score but not critical = MICRO-ADJUST
    if (
      survivalScore >= this.SURVIVAL_THRESHOLDS.critical &&
      survivalScore < this.SURVIVAL_THRESHOLDS.low
    ) {
      return 'PATH_MICROADJUST';
    }

    // Rule 6: Moderate threats with some anomalies = MICRO-ADJUST
    if (
      input.rtemPacket.anomalyCount > 0 &&
      survivalScore < this.SURVIVAL_THRESHOLDS.safe
    ) {
      return 'PATH_MICROADJUST';
    }

    // Rule 7: Safe score + trending well = HOLD
    if (
      survivalScore >= this.SURVIVAL_THRESHOLDS.safe &&
      input.rtemPacket.currentPnL >= 0
    ) {
      return 'PATH_HOLD';
    }

    // Default: MICRO-ADJUST (cautious approach)
    return 'PATH_MICROADJUST';
  }

  /**
   * Generate action, reasoning, and urgency for the chosen path
   */
  private generateActionReasoning(
    path: SurvivalPath,
    survivalScore: number,
    threatEval: ThreatEvaluation,
    input: ESMInput
  ): { action: string; reasoning: string; urgency: ExecutionUrgency } {
    switch (path) {
      case 'PATH_HOLD':
        return {
          action: 'HOLD',
          reasoning: `Trade healthy (survival: ${survivalScore.toFixed(1)}). Continue monitoring with current parameters.`,
          urgency: 'low',
        };

      case 'PATH_MICROADJUST':
        return {
          action: 'MICRO-ADJUST',
          reasoning: `Moderate risk detected (survival: ${survivalScore.toFixed(1)}). Tightening stop-loss and adjusting take-profit for protection.`,
          urgency: threatEval.urgency,
        };

      case 'PATH_RAPID_EXIT':
        return {
          action: 'RAPID EXIT',
          reasoning: `Critical survival threat (score: ${survivalScore.toFixed(1)}). ${threatEval.factors[0] || 'Multiple threats detected'}. Exit immediately to preserve capital.`,
          urgency: 'high',
        };

      case 'PATH_SHIFT_REVERSAL':
        return {
          action: 'SHIFT/REVERSAL SIGNAL',
          reasoning: `Strong reversal pattern detected (momentum: ${input.marketMomentum?.toFixed(1) || 'N/A'}). Consider flip signal for position reversal.`,
          urgency: 'medium',
        };

      default:
        return {
          action: 'MONITOR',
          reasoning: 'Default monitoring mode',
          urgency: 'low',
        };
    }
  }

  /**
   * Calculate micro-adjustments for MICRO-ADJUST path
   */
  private calculateAdjustments(
    input: ESMInput,
    survivalScore: number
  ): SurvivalAdjustments {
    const adjustments: SurvivalAdjustments = {};

    // Tighten stop-loss based on survival score
    if (survivalScore < 60) {
      adjustments.stopLossAdjustment = -0.5; // Tighten by 0.5%
    } else if (survivalScore < 50) {
      adjustments.stopLossAdjustment = -1.0; // Tighten by 1%
    }

    // Adjust take-profit if volatility is high
    if (input.volatilityPulse.current > 70) {
      adjustments.takeProfitAdjustment = -0.3; // Take profit earlier
    }

    // Reduce position size if threats are high
    if (input.threatMemorySnapshot.threatLevel === 'HIGH') {
      adjustments.positionSizeAdjustment = -0.2; // Reduce by 20%
    }

    // Extend hold time if momentum is positive
    if (input.marketMomentum !== undefined && input.marketMomentum > 50) {
      adjustments.holdTimeExtension = 60000; // Extend by 1 minute
    }

    return adjustments;
  }

  /**
   * Determine alternative survival paths
   */
  private determineAlternativePaths(
    chosenPath: SurvivalPath,
    survivalScore: number
  ): SurvivalPath[] {
    const alternatives: SurvivalPath[] = [];

    // Add reasonable alternatives based on score
    if (chosenPath !== 'PATH_HOLD' && survivalScore > 60) {
      alternatives.push('PATH_HOLD');
    }

    if (chosenPath !== 'PATH_MICROADJUST' && survivalScore > 40 && survivalScore < 70) {
      alternatives.push('PATH_MICROADJUST');
    }

    if (chosenPath !== 'PATH_RAPID_EXIT' && survivalScore < 40) {
      alternatives.push('PATH_RAPID_EXIT');
    }

    if (chosenPath !== 'PATH_SHIFT_REVERSAL') {
      alternatives.push('PATH_SHIFT_REVERSAL');
    }

    return alternatives;
  }

  /**
   * Calculate confidence level in the survival assessment
   */
  private calculateConfidenceLevel(
    survivalScore: number,
    threatEval: ThreatEvaluation,
    input: ESMInput
  ): number {
    let confidence = 80; // Base confidence

    // Reduce confidence if survival score is near threshold boundaries
    if (
      Math.abs(survivalScore - this.SURVIVAL_THRESHOLDS.critical) < 5 ||
      Math.abs(survivalScore - this.SURVIVAL_THRESHOLDS.low) < 5 ||
      Math.abs(survivalScore - this.SURVIVAL_THRESHOLDS.safe) < 5
    ) {
      confidence -= 15;
    }

    // Reduce confidence if threat severity is high
    if (threatEval.severity > 70) {
      confidence -= 20;
    } else if (threatEval.severity > 40) {
      confidence -= 10;
    }

    // Reduce confidence if many anomalies
    if (input.rtemPacket.anomalyCount > 3) {
      confidence -= 15;
    }

    // Boost confidence if hedge is active
    if (input.hedgeSignals?.hedgeActive && input.hedgeSignals.hedgeStrength > 70) {
      confidence += 10;
    }

    // Boost confidence if RTEM health is very high
    if (input.rtemPacket.healthScore > 85) {
      confidence += 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get version
   */
  public getVersion(): string {
    return this.VERSION;
  }

  /**
   * Get configuration
   */
  public getConfig() {
    return {
      survivalThresholds: { ...this.SURVIVAL_THRESHOLDS },
      threatWeights: { ...this.THREAT_WEIGHTS },
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let instance: ExecutionSurvivalMatrix | null = null;

export function getExecutionSurvivalMatrix(): ExecutionSurvivalMatrix {
  if (!instance) {
    instance = new ExecutionSurvivalMatrix();
  }
  return instance;
}

// Default export
export default ExecutionSurvivalMatrix;
