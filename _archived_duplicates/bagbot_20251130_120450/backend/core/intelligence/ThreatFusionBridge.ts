import { FusionEngine } from "./FusionEngine";
import { DivergenceRuntime } from "./DivergenceRuntime";
import { PulsarRuntime } from "./PulsarRuntime";

export interface ThreatInput {
  symbol: string;
  price: number;
  volume: number;
  volatility: number;
  timestamp: number;
}

export interface ThreatFuseOutput {
  symbol: string;
  fusionScore: number;
  divergenceScore: number;
  pulsarScore: number;
  combinedThreat: number;
  threatGrade: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: number;
}

export class ThreatFusionBridge {
  private fusion: FusionEngine;
  private divergence: DivergenceRuntime;
  private pulsar: PulsarRuntime;

  constructor() {
    this.fusion = new FusionEngine();
    this.divergence = new DivergenceRuntime();
    this.pulsar = new PulsarRuntime();
  }

  // Normalize a raw score into 0–1 territory
  private normalize(score: number, max: number = 100): number {
    return Math.min(1, Math.max(0, score / max));
  }

  computeThreat(input: ThreatInput): ThreatFuseOutput {
    // Collect independent engine scores
    const fusionRaw = this.fusion.computeSignalStrength({
      symbol: input.symbol,
      price: input.price,
      volatility: input.volatility,
      timestamp: input.timestamp,
    });

    const divergenceRaw = this.divergence.computeThreat({
      symbol: input.symbol,
      price: input.price,
      volume: input.volume,
      timestamp: input.timestamp,
    });

    const pulsarRaw = this.pulsar.computePulse({
      symbol: input.symbol,
      price: input.price,
      volatility: input.volatility,
      timestamp: input.timestamp,
    });

    // Normalize each engine score
    const fusionScore = this.normalize(fusionRaw);
    const divergenceScore = this.normalize(divergenceRaw);
    const pulsarScore = this.normalize(pulsarRaw);

    // Weighting profile (Level 24 standard)
    const combinedThreat =
      fusionScore * 0.45 +
      divergenceScore * 0.30 +
      pulsarScore * 0.25;

    // Threat grading
    let threatGrade: ThreatFuseOutput["threatGrade"] = "LOW";
    if (combinedThreat > 0.3) threatGrade = "MEDIUM";
    if (combinedThreat > 0.55) threatGrade = "HIGH";
    if (combinedThreat > 0.75) threatGrade = "CRITICAL";

    return {
      symbol: input.symbol,
      fusionScore,
      divergenceScore,
      pulsarScore,
      combinedThreat,
      threatGrade,
      timestamp: input.timestamp,
    };
  }
}

export default ThreatFusionBridge;
