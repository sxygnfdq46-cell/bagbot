// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VOLATILITY ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Computes real-time market volatility levels
// Classifies: LOW / MEDIUM / HIGH / EXTREME

export type VolatilityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface VolatilityReading {
  level: VolatilityLevel;
  score: number; // 0-100
  atr: number; // Average True Range
  stdDev: number; // Standard deviation of returns
  timestamp: number;
}

export interface VolatilityConfig {
  lookbackPeriod: number; // Number of bars for calculation
  lowThreshold: number; // Below this = LOW (default: 20)
  mediumThreshold: number; // Below this = MEDIUM (default: 50)
  highThreshold: number; // Below this = HIGH, above = EXTREME (default: 75)
}

/**
 * VolatilityEngine - Real-time market volatility scanner
 * 
 * Purpose: Measures price movement intensity to adjust risk parameters
 * Strategy:
 *   - LOW: Stable conditions, normal position sizing
 *   - MEDIUM: Moderate movement, standard risk
 *   - HIGH: Elevated volatility, reduce exposure 50%
 *   - EXTREME: Wild swings, reduce exposure 75% or pause
 */
export class VolatilityEngine {
  private config: VolatilityConfig;
  private priceHistory: number[] = [];
  private lastReading: VolatilityReading | null = null;

  constructor(config?: Partial<VolatilityConfig>) {
    this.config = {
      lookbackPeriod: config?.lookbackPeriod ?? 20,
      lowThreshold: config?.lowThreshold ?? 20,
      mediumThreshold: config?.mediumThreshold ?? 50,
      highThreshold: config?.highThreshold ?? 75,
    };
  }

  /**
   * Update price history and recompute volatility
   * @param price - Current market price
   */
  update(price: number): VolatilityReading {
    this.priceHistory.push(price);
    
    // Keep only lookback period
    if (this.priceHistory.length > this.config.lookbackPeriod + 1) {
      this.priceHistory.shift();
    }

    this.lastReading = this.compute();
    return this.lastReading;
  }

  /**
   * Compute volatility metrics
   */
  private compute(): VolatilityReading {
    if (this.priceHistory.length < 2) {
      return {
        level: 'LOW',
        score: 0,
        atr: 0,
        stdDev: 0,
        timestamp: Date.now(),
      };
    }

    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < this.priceHistory.length; i++) {
      const ret = (this.priceHistory[i] - this.priceHistory[i - 1]) / this.priceHistory[i - 1];
      returns.push(ret);
    }

    // Calculate standard deviation
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Calculate ATR (simplified)
    let atr = 0;
    for (let i = 1; i < this.priceHistory.length; i++) {
      const high = this.priceHistory[i];
      const low = this.priceHistory[i - 1];
      atr += Math.abs(high - low);
    }
    atr /= (this.priceHistory.length - 1);

    // Normalize to 0-100 scale
    // stdDev * 100 gives us percentage volatility
    // Typical values: 0.5% = LOW, 2% = MEDIUM, 5% = HIGH, 10%+ = EXTREME
    const score = Math.min(100, stdDev * 100 * 10); // Scale up for visibility

    // Classify
    let level: VolatilityLevel = 'LOW';
    if (score >= this.config.highThreshold) {
      level = 'EXTREME';
    } else if (score >= this.config.mediumThreshold) {
      level = 'HIGH';
    } else if (score >= this.config.lowThreshold) {
      level = 'MEDIUM';
    }

    return {
      level,
      score,
      atr,
      stdDev,
      timestamp: Date.now(),
    };
  }

  /**
   * Get last computed reading
   */
  getReading(): VolatilityReading | null {
    return this.lastReading;
  }

  /**
   * Get risk multiplier based on current volatility
   * Used to scale position sizes:
   *   - LOW: 1.0x (full size)
   *   - MEDIUM: 0.8x
   *   - HIGH: 0.5x
   *   - EXTREME: 0.25x
   */
  getRiskMultiplier(): number {
    if (!this.lastReading) return 1.0;

    switch (this.lastReading.level) {
      case 'LOW':
        return 1.0;
      case 'MEDIUM':
        return 0.8;
      case 'HIGH':
        return 0.5;
      case 'EXTREME':
        return 0.25;
      default:
        return 1.0;
    }
  }

  /**
   * Reset history
   */
  reset(): void {
    this.priceHistory = [];
    this.lastReading = null;
  }
}

export default VolatilityEngine;
