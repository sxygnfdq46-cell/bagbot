import { shieldFusion } from "../engine/ShieldFusionSynchronizer";
import { shieldStrategyLink } from "../strategy/ShieldStrategyLink";
import { decisionEngine } from "../decision/DecisionEngine";
import { tradingPipeline } from "../engine/TradingPipelineCore";
import { RDS } from "../stabilizers/RealityDistortionStabilizer";

class FullSpectrumSync {
  sync() {
    // 1. Get full shield output
    const shield = shieldFusion.generateFusionSignal();

    // RDS: Detect reality distortion from market data
    const distortion = RDS.detect({
      volatility: shield.fusionScore / 5, // normalize for detection
      liquidity: 50, // placeholder
      momentumInversion: false, // placeholder
      correlationBreak: false // placeholder
    });

    // 2. Update strategy mode from shield
    const strategyDecision = shieldStrategyLink.compute();

    // 3. Push strategy and shield into decision engine
    let decision = decisionEngine.process({
      shieldScore: shield.score,
      threatLevel: shield.classification,
      strategyMode: strategyDecision.strategyMode,
      rootSignal: shield.rootCause ?? null
    });

    // RDS: Apply filters to decision signal
    decision = RDS.applyFilters(decision);

    if (decision.forceSafeMode) {
      console.log("⚠️ RDS: Entering Anti-Chaos Safe Mode");
    }

    // 4. Push decision into trading pipeline
    const trade = tradingPipeline.execute({
      decision,
      threatLevel: shield.classification,
      strategyMode: strategyDecision.strategyMode
    });

    return {
      shield,
      strategyDecision,
      decision,
      trade,
      distortion
    };
  }
}

export const fullSpectrumSync = new FullSpectrumSync();
