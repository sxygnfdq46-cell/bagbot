// app/lib/intel/ThreatWeightedStrategy.ts
// Step 24.9 — Threat-Weighted Strategy Prioritizer

import { threatSyncOrchestrator } from "@/engines/threat/ThreatSyncOrchestrator";

interface StrategyWeights {
  neural: number;
  fusion: number;
  trend: number;
  volatility: number;
  reversal: number;
}

class ThreatWeightedStrategy {
  private weights: StrategyWeights = {
    neural: 1,
    fusion: 1,
    trend: 1,
    volatility: 1,
    reversal: 1
  };

  private unsubscribe: (() => void) | null = null;

  subscribe() {
    if (this.unsubscribe) return; // Already subscribed

    this.unsubscribe = threatSyncOrchestrator.subscribe((state) => {
      const { severity } = state;
      this.adjust(severity);
    });
  }

  getWeights(): StrategyWeights {
    return this.weights;
  }

  private adjust(severity: number) {
    if (severity < 0.4) {
      // GREEN (normal): Equal weighting, balanced approach
      this.weights = {
        neural: 1.0,
        fusion: 1.0,
        trend: 1.0,
        volatility: 1.0,
        reversal: 1.0
      };
    } 
    else if (severity >= 0.4 && severity <= 0.65) {
      // YELLOW (caution): Rely more on volatility protection, watch for reversals
      this.weights = {
        neural: 0.8,
        fusion: 0.7,
        trend: 0.6,
        volatility: 1.2,  // Increase volatility awareness
        reversal: 1.4     // Watch for reversals
      };
    } 
    else {
      // RED (danger): Strong risk shield, prioritize reversals
      this.weights = {
        neural: 0.4,
        fusion: 0.3,
        trend: 0.2,
        volatility: 1.8,  // Strong risk shield
        reversal: 2.0     // Reversal = most important signal
      };
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const threatWeightedStrategy = new ThreatWeightedStrategy();
