export interface DivergenceSignal {
  type: "REVERSAL" | "CONTINUATION" | "NEUTRAL";
  confidence: number;   // 0-100
  strength: number;     // 0-100
  risk: "LOW" | "MODERATE" | "HIGH";
  reasoning: string;
}

interface DivergenceInputs {
  bullishStrength: number;
  bearishStrength: number;
  delta: number; // difference between bullish & bearish
  volatility: number;
  trendDirection: "UP" | "DOWN" | "FLAT";
}

export function computeDivergenceSignal(data: DivergenceInputs): DivergenceSignal {
  const { bullishStrength, bearishStrength, delta, volatility, trendDirection } = data;

  const absDelta = Math.abs(delta);

  // Confidence based on separation + volatility
  const confidence =
    Math.min(100, Math.max(0, absDelta * 1.2 - volatility * 0.4));

  let type: DivergenceSignal["type"] = "NEUTRAL";
  let risk: DivergenceSignal["risk"] = "MODERATE";
  let reasoning = "";

  // Reversal logic
  if (trendDirection === "UP" && bearishStrength > bullishStrength + 12) {
    type = "REVERSAL";
    risk = "HIGH";
    reasoning = "Bearish divergence forming against bullish trend.";
  } else if (trendDirection === "DOWN" && bullishStrength > bearishStrength + 12) {
    type = "REVERSAL";
    risk = "HIGH";
    reasoning = "Bullish divergence forming against bearish trend.";
  }

  // Continuation logic
  if (type === "NEUTRAL") {
    if (trendDirection === "UP" && bullishStrength > bearishStrength) {
      type = "CONTINUATION";
      reasoning = "Bullish divergence aligned with trend.";
      risk = "LOW";
    } else if (trendDirection === "DOWN" && bearishStrength > bullishStrength) {
      type = "CONTINUATION";
      reasoning = "Bearish divergence aligned with trend.";
      risk = "LOW";
    }
  }

  // Weak signal case
  if (confidence < 20) {
    type = "NEUTRAL";
    risk = "LOW";
    reasoning = "Divergence too weak to classify.";
  }

  return {
    type,
    confidence,
    strength: absDelta,
    risk,
    reasoning,
  };
}
