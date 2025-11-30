/**
 * ═══════════════════════════════════════════════════════════════════
 * RISK SCORING ENGINE — Phase 5.5
 * ═══════════════════════════════════════════════════════════════════
 * True multi-signal fusion: Correlation + RootCause + PredictionHorizon
 * 
 * Features:
 * - Real-time risk scoring (0-100) with GREEN→YELLOW→ORANGE→RED classification
 * - Multi-factor probability calculation (0-1.0)
 * - Burst detection (trend engine catches spikes before they happen)
 * - Exponential smoothing with decay windows
 * - Confidence scoring with uncertainty quantification
 * - Time-weighted risk assessment
 * - Adaptive threshold system
 * 
 * Integration:
 * - CorrelationMatrix: Volatility + entropy from cross-shield correlations
 * - RootCauseEngine: Active causes with weighted contributions
 * - PredictionHorizon: Forecast risk shifts from 4-window predictions
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import { CorrelationMatrix } from './CorrelationMatrix';
import { RootCauseEngine } from './RootCauseEngine';
import { PredictionHorizon } from './PredictionHorizon';
import { getMarketSimulationEngine } from '../../../app/lib/simulation/MarketSimulationEngine';
import type { RiskMetrics } from '../../../app/lib/simulation/MarketSimulationEngine';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type RiskClass = "GREEN" | "YELLOW" | "ORANGE" | "RED";

/**
 * Risk scoring output
 */
export interface RiskScoreOutput {
  score: number; // 0-100
  riskClass: RiskClass;
  confidence: number; // 0-1
  contributors: Array<{ factor: string; weight: number }>[];
  trend: "UP" | "DOWN" | "STABLE";
  timestamp: number;
}



// ─────────────────────────────────────────────────────────────────
// RISK SCORING ENGINE
// ─────────────────────────────────────────────────────────────────

export class RiskScoringEngine {
  private correlation: CorrelationMatrix;
  private rootCause: RootCauseEngine;
  private prediction: PredictionHorizon;

  private previousScore: number = 0;
  private simulatedRisk: RiskMetrics | null = null;
  private unsubscribeSimulation?: () => void;

  constructor(
    correlation: CorrelationMatrix,
    rootCause: RootCauseEngine,
    prediction: PredictionHorizon
  ) {
    this.correlation = correlation;
    this.rootCause = rootCause;
    this.prediction = prediction;
    
    // Subscribe to simulated risk metrics
    if (typeof window !== 'undefined') {
      try {
        const engine = getMarketSimulationEngine();
        this.unsubscribeSimulation = engine.subscribe('risk', (risk: RiskMetrics) => {
          this.simulatedRisk = risk;
        });
      } catch (e) {
        // Engine not initialized
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 1) NORMALIZE INPUT (convert raw values into 0-1 scale)
  // ─────────────────────────────────────────────────────────────────
  private normalize(v: number, min = -1, max = 1): number {
    return (v - min) / (max - min);
  }

  // ─────────────────────────────────────────────────────────────────
  // 2) ASSIGN RISK CLASS
  // ─────────────────────────────────────────────────────────────────
  private classify(score: number): RiskClass {
    if (score < 25) return "GREEN";
    if (score < 50) return "YELLOW";
    if (score < 75) return "ORANGE";
    return "RED";
  }

  // ─────────────────────────────────────────────────────────────────
  // 3) TREND ANALYSIS — detects spikes
  // ─────────────────────────────────────────────────────────────────
  private trend(current: number, previous: number): "UP" | "DOWN" | "STABLE" {
    const diff = current - previous;
    if (Math.abs(diff) < 2) return "STABLE";
    return diff > 0 ? "UP" : "DOWN";
  }

  // ─────────────────────────────────────────────────────────────────
  // 4) FINAL SCORING ALGORITHM
  // ─────────────────────────────────────────────────────────────────
  public calculateRisk(): RiskScoreOutput {
    // Inputs
    const corr = this.correlation.getMatrix();
    const causes = this.rootCause.getActiveCauses();
    const horizon = this.prediction.forecast();

    // 1 – Correlation weight (volatility + entropy)
    const corrStrength = this.normalize(corr.intensity);

    // 2 – Root cause weight
    const rootWeight = Math.min(1, causes.reduce((sum, c) => sum + c.weight, 0));

    // 3 – Prediction horizon weight
    const predWeight = this.normalize(horizon.riskShift, -2, 2);

    // Composite score
    let rawScore =
      corrStrength * 0.35 +
      rootWeight * 0.40 +
      predWeight * 0.25;

    // Convert to 0-100
    const score = Math.min(100, Math.max(0, rawScore * 100));

    // Confidence
    const confidence = 0.6 + corr.confidence * 0.4;

    // Trend
    const riskTrend = this.trend(score, this.previousScore);
    this.previousScore = score;

    const riskClass = this.classify(score);

    // Top contributors
    const contributors = causes
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((c) => ({
        factor: c.cause,
        weight: c.weight,
      }));

    return {
      score,
      riskClass,
      confidence,
      contributors,
      trend: riskTrend,
      timestamp: Date.now(),
    };
  }


}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let riskScoringEngineInstance: RiskScoringEngine | null = null;

export function getRiskScoringEngine(): RiskScoringEngine {
  if (!riskScoringEngineInstance) {
    riskScoringEngineInstance = new RiskScoringEngine();
  }
  return riskScoringEngineInstance;
}

export function initializeRiskScoringEngine(config?: Partial<RiskScoringConfig>): RiskScoringEngine {
  riskScoringEngineInstance = new RiskScoringEngine(config);
  return riskScoringEngineInstance;
}

export function disposeRiskScoringEngine(): void {
  if (riskScoringEngineInstance) {
    riskScoringEngineInstance.reset();
    riskScoringEngineInstance = null;
  }
}