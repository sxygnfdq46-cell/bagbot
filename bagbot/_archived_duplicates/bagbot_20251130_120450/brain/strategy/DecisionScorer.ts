/**
 * LEVEL 22 — Strategic Intelligence Layer
 * Decision Scorer
 *
 * Combines signals, context, and safety layers to produce
 * a final confidence score for entering trades.
 */

export interface DecisionContext {
  opportunityScore: number;
  trendAlignment: number;        // multi-timeframe alignment
  riskLevel: number;              // output from RiskEngine (0-1)
  shieldThreat: number;           // BrainShield threat level (0-1)
  marketStability: number;        // volatility + liquidity mix
  dailyPerformance: number;       // profit factor for the day
}

export interface TradeDecision {
  score: number;
  action: "ENTER" | "SKIP";
  reason: string;
  timestamp: number;
}

export class DecisionScorer {
  score(ctx: DecisionContext): TradeDecision {
    const {
      opportunityScore,
      trendAlignment,
      riskLevel,
      shieldThreat,
      marketStability,
      dailyPerformance,
    } = ctx;

    let total = 0;
    let reasons: string[] = [];

    // Opportunity score (foundation)
    total += opportunityScore * 0.4;

    // Trend alignment = strong predictor of success
    if (trendAlignment > 0.5) {
      total += 20;
      reasons.push("Trend alignment confirmed");
    }

    // Market stability helps avoid fakeouts
    if (marketStability > 0.6) {
      total += 15;
      reasons.push("Stable market conditions");
    }

    // Risk level (inverted)
    if (riskLevel < 0.4) {
      total += 15;
      reasons.push("Low-risk environment");
    }

    // Shield threat (inverted)
    if (shieldThreat < 0.5) {
      total += 15;
      reasons.push("Low threat from BrainShield");
    }

    // Daily performance mode
    if (dailyPerformance > 0) {
      total += 10;
      reasons.push("Positive daily performance momentum");
    }

    const finalScore = Math.min(100, Math.max(0, total));

    return {
      score: finalScore,
      action: finalScore > 60 ? "ENTER" : "SKIP",
      reason: reasons.join(", ") || "Insufficient conditions",
      timestamp: Date.now(),
    };
  }
}
