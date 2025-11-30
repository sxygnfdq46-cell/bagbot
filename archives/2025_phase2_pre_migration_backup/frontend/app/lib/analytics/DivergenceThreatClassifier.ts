import { 
  DivergenceThreatScore,
  DivergenceThreatSummary,
  DivergenceDirection,
  ThreatZone
} from "./DivergenceThreatModel";

export class DivergenceThreatClassifier {

  static classify(input: {
    rawStrength: number;        // incoming divergence score 0–100
    rawConfidence: number;      // 0–100
    volatility: number;         // 0–100
    direction: DivergenceDirection;
    history: DivergenceThreatScore[];
    timestamp: number;
  }): DivergenceThreatSummary {

    const {
      rawStrength,
      rawConfidence,
      volatility,
      direction,
      history,
      timestamp
    } = input;

    // Normalize strength - weak signals get penalized
    const strength = Math.max(0, Math.min(100, rawStrength));

    // Volatility penalty: higher vol reduces safety
    const volPenalty = Math.min(40, volatility * 0.4);

    // Reversal probability rises when:
    // - volatility high
    // - strength weak
    // - confidence low
    const reversalProbability =
      Math.min(
        100,
        (volatility * 0.5) +
        ((100 - strength) * 0.3) +
        ((100 - rawConfidence) * 0.2)
      );

    // Compute final confidence
    const confidence = Math.max(
      0,
      Math.min(
        100,
        rawConfidence - volPenalty
      )
    );

    // Threat zone logic
    let zone: ThreatZone = "GREEN";
    if (reversalProbability > 60 || volatility > 70) zone = "YELLOW";
    if (reversalProbability > 75 || volatility > 85) zone = "RED";

    const threat: DivergenceThreatScore = {
      strength,
      direction,
      confidence,
      volatilityImpact: volatility,
      reversalProbability,
      zone,
      timestamp
    };

    const result: DivergenceThreatSummary = {
      threat,
      history: [...history, threat].slice(-50)
    };

    return result;
  }
}

export default DivergenceThreatClassifier;
