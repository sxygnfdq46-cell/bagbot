import { CorrelationMatrixEngine } from "@/components/shield/brain/CorrelationMatrix";
import { RootCauseEngine } from "@/components/shield/brain/RootCauseEngine";

// Placeholder for PredictionHorizon
class PredictionHorizon {
  forecast() {
    return {
      window30s: { state: 'GREEN', confidence: 0.8 },
      window2min: { state: 'GREEN', confidence: 0.75 },
      window5min: { state: 'YELLOW', confidence: 0.7 },
      window10min: { state: 'YELLOW', confidence: 0.65 },
      riskShift: 0.5
    };
  }
}

export type RiskClass = "GREEN" | "YELLOW" | "ORANGE" | "RED";

export interface RiskScoreOutput {
  score: number; // 0-100
  riskClass: RiskClass;
  confidence: number; // 0-1
  contributors: Array<{ factor: string; weight: number }>;
  trend: "UP" | "DOWN" | "STABLE";
  timestamp: number;
}

export class RiskScoringEngine {
  private correlation: CorrelationMatrixEngine;
  private rootCause: RootCauseEngine;
  private prediction: PredictionHorizon;

  private previousScore: number = 0;

  constructor(
    correlation: CorrelationMatrixEngine,
    rootCause: RootCauseEngine,
    prediction: PredictionHorizon
  ) {
    this.correlation = correlation;
    this.rootCause = rootCause;
    this.prediction = prediction;
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
    const corr = this.correlation.getGraph();
    const rootCauseSummary = this.rootCause.getGraphSummary();
    const horizon = this.prediction.forecast();

    // 1 – Correlation weight (volatility + entropy)
    const intensity = corr.pairs && corr.pairs.length > 0
      ? corr.pairs.reduce((sum: number, p: any) => sum + Math.abs(p.pearsonCoefficient), 0) / corr.pairs.length
      : 0;
    const corrStrength = this.normalize(intensity);

    // 2 – Root cause weight
    const nodeCount = rootCauseSummary.nodeCount || 0;
    const rootWeight = Math.min(1, nodeCount / 10); // Normalize by expected max nodes

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
    const confidence = 0.6 + (corr.pairs?.length || 0) * 0.04;

    // Trend
    const riskTrend = this.trend(score, this.previousScore);
    this.previousScore = score;

    const riskClass = this.classify(score);

    // Top contributors
    const contributors: Array<{ factor: string; weight: number }> = [];
    if (corrStrength > 0.3) contributors.push({ factor: 'Correlation Intensity', weight: corrStrength });
    if (rootWeight > 0.3) contributors.push({ factor: 'Root Causes', weight: rootWeight });
    if (Math.abs(horizon.riskShift) > 0.5) contributors.push({ factor: 'Prediction Shift', weight: Math.abs(horizon.riskShift) });

    return {
      score,
      riskClass,
      confidence: Math.min(1, confidence),
      contributors,
      trend: riskTrend,
      timestamp: Date.now(),
    };
  }
}
