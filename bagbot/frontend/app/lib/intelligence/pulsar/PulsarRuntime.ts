import { PulsarScanner } from "./PulsarScanner";

export interface PulsarAnalysis {
  strength: number;
  confidence: number;
  liquidity: number;
  trendBreak: number;
  shockScore: number;
  direction: "UP" | "DOWN" | "FLAT";
}

/**
 * PulsarRuntime
 * Acts as a safe runtime adapter that processes raw market data
 * using the PulsarScanner and returns a normalized intelligence packet.
 */
export default class PulsarRuntime {
  private scanner: PulsarScanner;

  constructor(scanner?: PulsarScanner) {
    this.scanner = scanner ?? new PulsarScanner();
  }

  /**
   * Analyze incoming market data and return normalized pulsar intelligence.
   * Expected data includes:
   *  - strength
   *  - confidence
   *  - liquidityShock
   *  - trendBreak
   *  - volatilityShock
   */
  analyze(data: any): PulsarAnalysis {
    const result = this.scanner.scan(data);

    // Calculate derived metrics from scanner output
    const avgIntensity = (result.volatility + result.anomaly + result.liquidityShock + result.trendBreak) / 4;

    return {
      strength: avgIntensity,
      confidence: avgIntensity > 0.5 ? 70 : 40,
      liquidity: result.liquidityShock ?? 0,
      trendBreak: result.trendBreak ?? 0,
      shockScore: Math.max(result.volatility, result.anomaly),
      direction: avgIntensity > 0.6 ? "UP" : avgIntensity < 0.4 ? "DOWN" : "FLAT",
    };
  }
}
