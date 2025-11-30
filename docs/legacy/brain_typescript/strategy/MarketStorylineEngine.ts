/**
 * LEVEL 22 — Strategic Intelligence Layer
 * Market Storyline Engine (MSE)
 *
 * Converts raw market data into interpreted "story states"
 * similar to how a human trader understands the market.
 */

export class MarketStorylineEngine {
  public evaluate(market: any) {
    const volatility = market.volatility ?? 0;
    const trend = market.trend ?? 0;
    const liquidity = market.liquidity ?? 0;

    let storyline = "Neutral market conditions.";

    if (trend > 0.6 && liquidity > 0.5) {
      storyline = "Strong trend forming with supportive liquidity.";
    } else if (trend < -0.6 && liquidity > 0.5) {
      storyline = "Bearish move building energy.";
    } else if (volatility > 0.7) {
      storyline = "High volatility — unstable structure.";
    } else if (liquidity < 0.3) {
      storyline = "Thin liquidity — expect random spikes.";
    }

    return {
      storyline,
      metrics: { volatility, trend, liquidity },
    };
  }
}
