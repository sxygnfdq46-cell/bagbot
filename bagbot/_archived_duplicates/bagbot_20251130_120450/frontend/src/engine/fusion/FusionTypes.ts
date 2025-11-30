// /src/engine/fusion/FusionTypes.ts
// Type definitions for Trading Brain Fusion

export interface IntelligenceSnapshot {
  intelligenceScore: number; // 0-100
  riskLevel: number; // 0-100
  threatCount: number;
  cascadeRisk: number; // 0-1
  predictions: any[];
}

export interface TechnicalSnapshot {
  price: number;
  momentum: number; // -100 to 100
  rsi: number; // 0-100
  macd: number;
  volume: number;
  trend: 'up' | 'down' | 'sideways';
}

export interface FusionOutput {
  fusionScore: number; // 0-100
  signal: FusionSignal;
  riskClass: RiskClass;
  volatility: number;
  intelligenceScore: number;
  technicalScore: number;
  stabilityPenalty: number;
  correlationPenalty: number;
  timestamp: number;
  // NEW: Weighted telemetry for UI (Step 18)
  weighted?: {
    core: number;
    divergence: number;
    stabilizer: number;
  };
}

export interface FusionWeights {
  // NEW: Step 17 weight configuration
  fusionCore: number; // 0.60 — Base multi-signal intelligence
  divergence: number; // 0.25 — Reversal + weakness detection
  stabilizer: number; // 0.15 — Noise reduction + smoothing
  // Legacy weights (kept for backward compatibility)
  intelligence?: number;
  technical?: number;
  stabilityPenalty?: number;
  volatilityBoost?: number;
  correlationPenalty?: number;
}

export type FusionSignal = 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
export type RiskClass = 'LOW' | 'MEDIUM' | 'HIGH';

export interface StabilizedFusion {
  score: number; // 0-100 (stabilized)
  confidence: number; // 0-100
  signal: FusionSignal;
  timestamp: number;
}

export interface StabilizerConfig {
  smoothingFactor: number; // 0.35
  confidenceWeight: number; // 0.25
  noiseGate: number; // 0.7
  driftThreshold: number; // 12
  trendAlignmentBoost: number; // 0.15
  volatilityDampening: number; // 0.15
  shieldPenalty: number; // 0.22
}
