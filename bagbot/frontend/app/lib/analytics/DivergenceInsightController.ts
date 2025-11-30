// DivergenceSignalEngine is in backend, stub for now
const computeDivergenceSignal = (insight: DivergenceInsight) => ({
  type: "NEUTRAL" as const,
  confidence: 0,
  strength: 0,
  risk: "LOW" as const,
  reasoning: "Signal computation not available in frontend"
});

export interface DivergenceInsight {
  bullishStrength: number;
  bearishStrength: number;
  delta: number;
  volatility: number;
  trendDirection: "UP" | "DOWN" | "FLAT";
  confidence: number;
  timestamp: number;
}

export interface InsightWithSignal extends DivergenceInsight {
  signal: {
    type: "REVERSAL" | "CONTINUATION" | "NEUTRAL";
    confidence: number;
    strength: number;
    risk: "LOW" | "MODERATE" | "HIGH";
    reasoning: string;
  };
}

export default class DivergenceInsightController {
  /**
   * Get divergence insight with computed signal
   */
  async getInsight(data: Omit<DivergenceInsight, "timestamp">): Promise<InsightWithSignal> {
    const insight: DivergenceInsight = {
      ...data,
      timestamp: Date.now()
    };

    const signal = computeDivergenceSignal({
      bullishStrength: insight.bullishStrength,
      bearishStrength: insight.bearishStrength,
      delta: insight.delta,
      volatility: insight.volatility,
      trendDirection: insight.trendDirection,
      confidence: insight.confidence,
      timestamp: insight.timestamp,
    });

    return {
      ...insight,
      signal
    };
  }
}
