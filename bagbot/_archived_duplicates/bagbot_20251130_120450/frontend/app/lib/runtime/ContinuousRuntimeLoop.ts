import { runFullSpectrumTick } from "../engine/TradingPipelineCore";
import { eventBus } from "./eventBus";
import { safetyManager } from "./SafetyManager";
import { hypervision } from "../hypervision/HypervisionCore";

class ContinuousRuntimeLoop {
  isRunning = false;
  interval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 1000) {
    if (this.isRunning) return;
    this.isRunning = true;

    this.interval = setInterval(() => {
      try {
        const safetyLevel = safetyManager.detectOverdrive();
        const safetyAdjustments = safetyManager.applyStabilizer(safetyLevel);

        if (safetyAdjustments.emergencyStop) {
          console.log("🛑 EMERGENCY STOP — Runtime Overdrive Detected");
          return; // skip trading actions
        }

        if (safetyAdjustments.safeMode) {
          console.log(`⚠️ SAFE MODE ACTIVATED — Level: ${safetyLevel}`);
        }

        const result = runFullSpectrumTick();

        // Update hypervision metrics
        hypervision.updateMetrics({
          cpuLoad: 50, // placeholder
          shieldScore: result.shield.fusionScore || 0,
          coherence: 85, // placeholder
          marketThreat: result.shield.fusionScore || 0,
          strategyHarmony: 90, // placeholder
        });

        // Auto-healing
        const healing = hypervision.autoHeal();
        if (healing.action !== "none") {
          console.log(`🔧 Auto-heal triggered: ${healing.action}`);
          // apply healing logic here in future
        }

        console.log("Runtime Tick:", {
          shield: result.shield.classification,
          strategy: result.strategyDecision.strategyMode,
          decision: result.decision.action,
          trade: result.trade.orderType,
        });

        eventBus.emit("tick", {
          timestamp: new Date().toISOString(),
          shield: result.shield.classification,
          strategy: result.strategyDecision.strategyMode,
          decision: result.decision.action,
          trade: result.trade.orderType,
          safetyLevel,
          distortion: result.distortion || 0
        });
      } catch (err) {
        console.error("Runtime Loop Error:", err);
      }
    }, intervalMs);
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const continuousRuntime = new ContinuousRuntimeLoop();
