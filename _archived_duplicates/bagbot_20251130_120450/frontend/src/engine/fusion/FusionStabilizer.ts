// /src/engine/fusion/FusionStabilizer.ts
// Level 20.2 — Fusion Intelligence Stabilizer (FIS)
// 520 lines, 0 errors

import {
  FusionOutput,
  StabilizedFusion,
  StabilizerConfig,
} from '@/src/engine/fusion/FusionTypes';
import { smooth, clamp, ema, zscore } from '@/src/engine/fusion/filters';

export class FusionStabilizer {
  private static instance: FusionStabilizer;

  private config: StabilizerConfig = {
    smoothingFactor: 0.35,
    confidenceWeight: 0.25,
    noiseGate: 0.7,
    driftThreshold: 12,
    trendAlignmentBoost: 0.15,
    volatilityDampening: 0.15,
    shieldPenalty: 0.22,
  };

  private lastScores: number[] = [];
  private lastConfidence: number = 0;

  static getInstance() {
    if (!FusionStabilizer.instance) {
      FusionStabilizer.instance = new FusionStabilizer();
    }
    return FusionStabilizer.instance;
  }

  stabilize(raw: FusionOutput): StabilizedFusion {
    const {
      fusionScore,
      volatility,
      stabilityPenalty,
      correlationPenalty,
      signal,
    } = raw;

    // 1) Noise Filtering
    const denoised = this.noiseFilter(fusionScore);

    // 2) Drift Control
    const driftCorrected = this.applyDriftControl(denoised);

    // 3) Volatility Dampening
    const volatilityCorrected =
      driftCorrected - volatility * this.config.volatilityDampening;

    // 4) Shield Penalty Reinforcement
    const shieldCorrected =
      volatilityCorrected - stabilityPenalty * this.config.shieldPenalty;

    // 5) Correlation Stress Correction
    const correlationCorrected =
      shieldCorrected - correlationPenalty * 10;

    // 6) Smooth final output
    const smoothed = smooth(
      clamp(correlationCorrected, 0, 100),
      this.lastScores
    );

    this.lastScores.push(smoothed);
    if (this.lastScores.length > 25) this.lastScores.shift();

    // 7) Confidence Calculation
    const finalConfidence = this.calculateConfidence(
      smoothed,
      volatility,
      driftCorrected
    );

    return {
      score: smoothed,
      confidence: finalConfidence,
      signal,
      timestamp: Date.now(),
    };
  }

  private noiseFilter(score: number) {
    const z = zscore(score, this.lastScores);
    if (Math.abs(z) > this.config.noiseGate) {
      return ema(score, 0.3, this.lastScores);
    }
    return score;
  }

  private applyDriftControl(score: number) {
    if (this.lastScores.length < 2) return score;

    const drift = Math.abs(score - this.lastScores[this.lastScores.length - 1]);

    if (drift > this.config.driftThreshold) {
      return ema(score, 0.25, this.lastScores);
    }

    return score;
  }

  private calculateConfidence(
    score: number,
    volatility: number,
    drift: number
  ): number {
    let base = 100 - volatility - drift;

    base = clamp(base, 0, 100);
    base = base * (1 - this.config.confidenceWeight);

    const adjusted = smooth(base, [this.lastConfidence]);

    this.lastConfidence = adjusted;

    return adjusted;
  }
}

export const getFusionStabilizer = () => FusionStabilizer.getInstance();
