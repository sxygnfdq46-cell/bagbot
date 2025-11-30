export type DivergenceDirection = "BULLISH" | "BEARISH" | "NEUTRAL";
export type ThreatZone = "GREEN" | "YELLOW" | "RED";

export interface DivergenceThreatScore {
  strength: number;              // 0-100
  direction: DivergenceDirection;
  confidence: number;            // 0-100
  volatilityImpact: number;      // 0-100
  reversalProbability: number;   // 0-100
  zone: ThreatZone;
  timestamp: number;
}

export interface DivergenceThreatSummary {
  threat: DivergenceThreatScore;
  history: DivergenceThreatScore[];
}
