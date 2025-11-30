import { 
  DivergenceThreatScore,
  DivergenceThreatSummary,
  DivergenceDirection
} from "./DivergenceThreatModel";

import DivergenceThreatClassifier from "./DivergenceThreatClassifier";

export class DivergenceController {

  private history: DivergenceThreatScore[] = [];
  private latest: DivergenceThreatSummary | null = null;

  update(input: {
    strength: number;           // 0–100
    confidence: number;         // 0–100
    volatility: number;         // 0–100
    direction: DivergenceDirection;
    timestamp: number;
  }): DivergenceThreatSummary {

    const classified = DivergenceThreatClassifier.classify({
      rawStrength: input.strength,
      rawConfidence: input.confidence,
      volatility: input.volatility,
      direction: input.direction,
      history: this.history,
      timestamp: input.timestamp
    });

    this.history = classified.history.slice(-200);
    this.latest = classified;

    return classified;
  }

  getSummary(): DivergenceThreatSummary | null {
    return this.latest;
  }

  getHistory(): DivergenceThreatScore[] {
    return this.history;
  }
}

export default DivergenceController;
