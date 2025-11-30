import { shieldFusion } from "./ShieldFusionSynchronizer";
import { tradingBrain } from "../trading/TradingBrainCore";
import { adaptiveShieldStrategySelector } from "../strategy/AdaptiveShieldStrategySelector";

class ShieldBrainSyncLayer {
  sync() {
    // 1. Read shield intelligence
    const shield = shieldFusion.generateFusionSignal();

    // 2. Feed shield awareness to Trading Brain
    tradingBrain.updateShieldStatus({
      score: shield.score,
      classification: shield.classification,
      rootCause: shield.rootCause,
      hedge: shield.hedge
    });

    // 3. Strategy selector adjusts based on shield environment
    adaptiveShieldStrategySelector.updateShieldContext({
      shieldLevel: shield.classification,
      shieldScore: shield.score,
      hedgeMode: shield.hedge
    });

    // 4. Final unified decision
    return {
      fusionScore: shield.score,
      threatLevel: shield.classification,
      hedgeMode: shield.hedge,
      finalAction: this.determineAction(shield)
    };
  }

  determineAction(shield: any): string {
    if (shield.classification === "CRITICAL_THREAT") {
      return "NO_TRADING";
    }
    if (shield.classification === "HIGH_THREAT") {
      return "MICRO_MODE";
    }
    if (shield.classification === "MODERATE_THREAT") {
      return "RISK_ADJUSTED";
    }
    return "FULL_OPERATION";
  }
}

export const shieldBrainSync = new ShieldBrainSyncLayer();
