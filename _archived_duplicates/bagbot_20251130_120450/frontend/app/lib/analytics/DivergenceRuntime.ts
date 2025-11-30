import DivergenceController from "./DivergenceController";
import { DivergenceThreatSummary } from "./DivergenceThreatModel";

class DivergenceRuntime {

  private controller = new DivergenceController();
  private latest: DivergenceThreatSummary | null = null;

  tick(timestamp: number) {

    // Mock data - replace with actual fusion engine and indicators when available
    const fusion = { volatility: 50 };
    const metrics = {
      divergenceStrength: 70,
      divergenceConfidence: 80,
      divergenceDirection: "BULLISH" as const
    };

    if (!fusion || !metrics) return;

    const divergence = this.controller.update({
      strength: metrics.divergenceStrength ?? 0,
      confidence: metrics.divergenceConfidence ?? 0,
      volatility: fusion.volatility ?? 0,
      direction: metrics.divergenceDirection ?? "NEUTRAL",
      timestamp
    });

    this.latest = divergence;

    // TODO: Emit event when eventBus is available
    // eventBus.emit("divergence-update", divergence);
  }

  getSummary() {
    return this.latest;
  }

  getController() {
    return this.controller;
  }
}

const divergenceRuntime = new DivergenceRuntime();
export default divergenceRuntime;
