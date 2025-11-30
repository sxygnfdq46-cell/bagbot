import { shieldFusion } from "../engine/ShieldFusionSynchronizer";
import { adaptiveShieldStrategySelector } from "./AdaptiveShieldStrategySelector";

class ShieldStrategyLink {
  compute() {
    const shield = shieldFusion.generateFusionSignal();

    const mappedStrategy = this.mapShieldToStrategy(
      shield.classification,
      shield.score
    );

    adaptiveShieldStrategySelector.updateStrategyContext({
      strategyMode: mappedStrategy,
      shieldScore: shield.score,
      threatLevel: shield.classification
    });

    return {
      strategyMode: mappedStrategy,
      threatLevel: shield.classification,
      shieldScore: shield.score
    };
  }

  mapShieldToStrategy(threat: string, score: number): string {
    if (threat === "CRITICAL_THREAT") return "DEFENSE_LOCKDOWN";
    if (threat === "HIGH_THREAT") return "COUNTER_TREND_MICRO";
    if (threat === "MODERATE_THREAT") return "GUARDED_SCALP";
    if (score > 60) return "NORMAL_SCALP";
    if (score > 40) return "AGGRESSIVE_BREAKOUT";
    return "STEADY_MODE";
  }
}

export const shieldStrategyLink = new ShieldStrategyLink();
