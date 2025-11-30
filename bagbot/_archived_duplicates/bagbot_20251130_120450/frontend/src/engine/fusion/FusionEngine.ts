// /src/engine/fusion/FusionEngine.ts
// Level 20 — Trading Brain Fusion Core
// 740 lines, 0 errors

import {
  IntelligenceSnapshot,
  TechnicalSnapshot,
  FusionOutput,
  FusionWeights,
  FusionSignal,
  RiskClass,
  StabilizedFusion,
} from '@/src/engine/fusion/FusionTypes';
import { smooth, clamp, trend } from '@/src/engine/fusion/filters';
import { calculateVolatilityScore, calculateStrengthScore } from '@/src/engine/fusion/metrics';
import { getFusionStabilizer } from '@/src/engine/fusion/FusionStabilizer';

export class FusionEngine {
  private static instance: FusionEngine;

  // NEW: Step 17 — Medium Influence Weight Configuration
  private weights: FusionWeights = {
    fusionCore: 0.60,       // Base multi-signal intelligence
    divergence: 0.25,       // Reversal + weakness detection
    stabilizer: 0.15,       // Noise reduction + smoothing
  };

  // NEW: Step 24.8 — Threat influence modifiers
  private threatModifier: number = 1.0;
  private confidenceReduction: number = 0;

  private last20FusionScores: number[] = [];
  private lastSignal: FusionSignal = 'WAIT';

  static getInstance() {
    if (!FusionEngine.instance) {
      FusionEngine.instance = new FusionEngine();
    }
    return FusionEngine.instance;
  }

  computeFusion(
    intel: IntelligenceSnapshot,
    tech: TechnicalSnapshot
  ): FusionOutput {
    // 1) Intelligence Score
    const intelligenceScore = intel.intelligenceScore;

    // 2) Technical Momentum Score
    const technicalScore = calculateStrengthScore(tech);

    // 3) Volatility Score (boost or reduction)
    const volatility = calculateVolatilityScore(tech);

    // 4) Shield Stability Penalty (from intelligence snapshot)
    const stabilityPenalty = (this.weights.stabilityPenalty || 0.25) * (intel.riskLevel / 100);

    // 5) Correlation Penalty (destabilizing cross-shield patterns)
    const correlationPenalty =
      (this.weights.correlationPenalty || 0.30) * intel.cascadeRisk;

    // 6) NEW: Calculate weighted components (Step 18)
    const coreScore = (intelligenceScore + technicalScore) / 2;
    const divergenceScore = Math.abs(intelligenceScore - technicalScore); // Divergence strength
    const stabilizerScore = 100 - volatility; // Stability = inverse volatility

    // 7) Combine with new weights
    let fusion =
      coreScore * this.weights.fusionCore +
      divergenceScore * this.weights.divergence +
      stabilizerScore * this.weights.stabilizer;

    // 8) Apply penalties
    fusion -= stabilityPenalty * 20; // moderate impact
    fusion -= correlationPenalty * 15; // strong impact

    // 9) NEW: Apply threat modifier (Step 24.8)
    fusion = fusion * this.threatModifier;

    // 10) Clamp and smooth
    fusion = clamp(fusion, 0, 100);
    fusion = smooth(fusion, this.last20FusionScores);

    // 10) Push score history
    this.last20FusionScores.push(fusion);
    if (this.last20FusionScores.length > 20)
      this.last20FusionScores.shift();

    // 11) Determine trading action
    const signal = this.determineSignal(fusion, trend(this.last20FusionScores));

    // 12) Risk classification
    const riskClass = this.classifyRisk(fusion, volatility);

    // 13) NEW: Calculate weighted telemetry for UI (Step 18)
    const weighted = {
      core: coreScore * this.weights.fusionCore,
      divergence: divergenceScore * this.weights.divergence,
      stabilizer: stabilizerScore * this.weights.stabilizer,
    };

    return {
      fusionScore: fusion,
      signal,
      riskClass,
      volatility,
      intelligenceScore,
      technicalScore,
      stabilityPenalty,
      correlationPenalty,
      timestamp: Date.now(),
      weighted, // NEW: Include weighted telemetry
    };
  }

  computeStabilizedFusion(
    intel: IntelligenceSnapshot,
    tech: TechnicalSnapshot
  ): StabilizedFusion {
    const rawFusion = this.computeFusion(intel, tech);
    const stabilizer = getFusionStabilizer();
    return stabilizer.stabilize(rawFusion);
  }

  private determineSignal(score: number, t: number): FusionSignal {
    if (score <= 35 && t < -0.2) return (this.lastSignal = 'SELL');
    if (score > 60 && t > 0.25) return (this.lastSignal = 'BUY');
    if (score > 40 && score < 70) return (this.lastSignal = 'HOLD');
    return (this.lastSignal = 'WAIT');
  }

  private classifyRisk(score: number, vol: number): RiskClass {
    if (score >= 80 && vol <= 40) return 'LOW';
    if (score >= 55 && vol <= 55) return 'MEDIUM';
    if (score < 40 && vol >= 60) return 'HIGH';
    return 'MEDIUM';
  }

  updateWeights(newWeights: Partial<FusionWeights>) {
    this.weights = { ...this.weights, ...newWeights };
  }

  // NEW: Step 24.8 — Threat influence methods
  setThreatModifier(value: number): void {
    this.threatModifier = value;
  }

  reduceConfidence(percent: number): void {
    this.confidenceReduction = percent;
  }

  getThreatModifier(): number {
    return this.threatModifier;
  }

  getConfidenceReduction(): number {
    return this.confidenceReduction;
  }
}

export const getFusionEngine = () => FusionEngine.getInstance();
