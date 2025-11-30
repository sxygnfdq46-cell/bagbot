/**
 * LEVEL 22 — Strategic Intelligence Layer
 * Opportunity Scanner
 *
 * Detects high-probability trading opportunities
 * based on real-time market metrics.
 */

export interface OpportunitySignal {
  symbol: string;
  score: number;
  reason: string;
  timestamp: number;
}

export class OpportunityScanner {
  scan(symbol: string, metrics: any): OpportunitySignal | null {
    const {
      volatility,
      trend,
      liquidity,
      momentum,
      supportPressure,
      resistancePressure,
    } = metrics;

    let score = 0;
    let reasons: string[] = [];

    // Trend confirmation
    if (Math.abs(trend) > 0.6) {
      score += 20;
      reasons.push("Strong trend detected");
    }

    // Volatility expansion means breakout potential
    if (volatility > 0.7) {
      score += 25;
      reasons.push("Volatility expansion");
    }

    // Liquidity improves execution quality
    if (liquidity > 0.5) {
      score += 15;
      reasons.push("Healthy liquidity");
    }

    // Momentum bursts
    if (momentum > 0.65) {
      score += 20;
      reasons.push("Momentum burst");
    }

    // Support/resistance compression (powerful)
    if (supportPressure > 0.7 || resistancePressure > 0.7) {
      score += 30;
      reasons.push("Compression zone");
    }

    // Minimum required score
    if (score < 40) return null;

    return {
      symbol,
      score,
      reason: reasons.join(", "),
      timestamp: Date.now(),
    };
  }
}
