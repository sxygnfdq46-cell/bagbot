export class RealityDistortionStabilizer {
  distortionLevel = 0;

  detect(market: any) {
    let level = 0;

    // 6 chaos indicators
    if (market.volatility > 3.5) level += 1;
    if (market.liquidity < 20) level += 1;
    if (market.momentumInversion) level += 1;
    if (market.correlationBreak) level += 1;

    this.distortionLevel = level;

    return level;
  }

  applyFilters(signal: any) {
    if (this.distortionLevel === 0) return signal;

    // Level 1 filter
    if (this.distortionLevel === 1) {
      signal.confidence *= 0.9;
    }

    // Level 2 filter
    if (this.distortionLevel === 2) {
      signal.confidence *= 0.75;
      signal.delayMs += 80;
    }

    // Level 3 filter — Safe Mode
    if (this.distortionLevel >= 3) {
      signal.confidence *= 0.65;
      signal.delayMs += 150;
      signal.forceSafeMode = true;
    }

    return signal;
  }
}

export const RDS = new RealityDistortionStabilizer();
