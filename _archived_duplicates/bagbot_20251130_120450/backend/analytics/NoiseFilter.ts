// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOISE FILTER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Detects choppy/erratic price action that produces false signals
// Range: 0-100 (0 = clean trend, 100 = pure noise)

export interface NoiseReading {
  noise: number; // 0-100
  choppiness: number; // Market choppiness index
  efficiency: number; // Directional efficiency (0-1)
  noisy: boolean; // True if noise > 70 (high false signal risk)
  clean: boolean; // True if noise < 30 (good signal quality)
  timestamp: number;
}

export interface NoiseFilterConfig {
  lookbackPeriod: number; // Bars for analysis (default: 20)
  noisyThreshold: number; // Above = noisy (default: 70)
  cleanThreshold: number; // Below = clean (default: 30)
}

/**
 * NoiseFilter - Signal quality detector
 * 
 * Purpose: Identify choppy markets that generate false signals
 * 
 * Noise Levels:
 *   - 0-30: CLEAN - Strong trends, reliable signals
 *   - 30-50: MODERATE - Some chop, acceptable
 *   - 50-70: CHOPPY - Increased false signals
 *   - 70-100: NOISY - High whipsaw risk, avoid trading
 * 
 * Detection Methods:
 *   - Choppiness Index: Measures directional inconsistency
 *   - Efficiency Ratio: Path efficiency (straight line vs actual)
 *   - Price oscillation: Frequency of direction changes
 * 
 * Trading Logic:
 *   - NOISY (>70): Block all signals, wait for clarity
 *   - CHOPPY (50-70): Increase confidence threshold by 20%
 *   - CLEAN (<30): Normal operation, signals reliable
 */
export class NoiseFilter {
  private config: NoiseFilterConfig;
  private priceHistory: number[] = [];
  private lastReading: NoiseReading | null = null;

  constructor(config?: Partial<NoiseFilterConfig>) {
    this.config = {
      lookbackPeriod: config?.lookbackPeriod ?? 20,
      noisyThreshold: config?.noisyThreshold ?? 70,
      cleanThreshold: config?.cleanThreshold ?? 30,
    };
  }

  /**
   * Update price history and recompute noise
   * @param price - Current market price
   */
  update(price: number): NoiseReading {
    this.priceHistory.push(price);
    
    // Keep only lookback period
    if (this.priceHistory.length > this.config.lookbackPeriod + 1) {
      this.priceHistory.shift();
    }

    this.lastReading = this.compute();
    return this.lastReading;
  }

  /**
   * Compute noise metrics
   */
  private compute(): NoiseReading {
    if (this.priceHistory.length < 3) {
      return {
        noise: 50,
        choppiness: 50,
        efficiency: 0.5,
        noisy: false,
        clean: false,
        timestamp: Date.now(),
      };
    }

    const choppiness = this.calculateChoppiness();
    const efficiency = this.calculateEfficiency();

    // Combine metrics into noise score (0-100)
    // High choppiness + low efficiency = high noise
    const noise = (choppiness + (1 - efficiency) * 100) / 2;

    const noisy = noise > this.config.noisyThreshold;
    const clean = noise < this.config.cleanThreshold;

    return {
      noise,
      choppiness,
      efficiency,
      noisy,
      clean,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate Choppiness Index
   * Measures market consolidation vs trending
   * 0-100: 0 = pure trend, 100 = pure chop
   */
  private calculateChoppiness(): number {
    const prices = this.priceHistory;
    const n = prices.length;
    
    if (n < 2) return 50;

    // Calculate true range sum
    let trueRangeSum = 0;
    for (let i = 1; i < n; i++) {
      const high = Math.max(prices[i], prices[i - 1]);
      const low = Math.min(prices[i], prices[i - 1]);
      trueRangeSum += (high - low);
    }

    // Calculate high-low range
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;

    if (range === 0) return 100; // No movement = pure chop

    // Choppiness formula
    const choppiness = 100 * Math.log10(trueRangeSum / range) / Math.log10(n);
    
    return Math.max(0, Math.min(100, choppiness));
  }

  /**
   * Calculate Efficiency Ratio (Kaufman)
   * Measures how efficiently price moves from A to B
   * 0 = no net movement, 1 = perfect straight line
   */
  private calculateEfficiency(): number {
    const prices = this.priceHistory;
    const n = prices.length;
    
    if (n < 2) return 0.5;

    // Net change (straight line distance)
    const netChange = Math.abs(prices[n - 1] - prices[0]);

    // Total path traveled (sum of all moves)
    let totalChange = 0;
    for (let i = 1; i < n; i++) {
      totalChange += Math.abs(prices[i] - prices[i - 1]);
    }

    if (totalChange === 0) return 0; // No movement

    // Efficiency = net change / total change
    return netChange / totalChange;
  }

  /**
   * Get last computed reading
   */
  getReading(): NoiseReading | null {
    return this.lastReading;
  }

  /**
   * Check if market is noisy (high whipsaw risk)
   */
  isNoisy(): boolean {
    return this.lastReading?.noisy ?? false;
  }

  /**
   * Check if market is clean (good signal quality)
   */
  isClean(): boolean {
    return this.lastReading?.clean ?? false;
  }

  /**
   * Get noise-based confidence multiplier
   * Reduces confidence in noisy markets
   */
  getConfidenceMultiplier(): number {
    if (!this.lastReading) return 1.0;

    const { noise } = this.lastReading;

    if (noise > this.config.noisyThreshold) {
      // Very noisy: reduce confidence severely
      // 70 -> 1.0, 80 -> 0.7, 90 -> 0.4, 100 -> 0.1
      return Math.max(0.1, 1.0 - (noise - this.config.noisyThreshold) / 40);
    } else if (noise > 50) {
      // Moderately choppy: slight reduction
      // 50 -> 1.0, 60 -> 0.9, 70 -> 0.8
      return Math.max(0.8, 1.0 - (noise - 50) / 100);
    }

    // Clean market: full confidence
    return 1.0;
  }

  /**
   * Should block signals due to excessive noise?
   */
  shouldBlockSignals(): boolean {
    if (!this.lastReading) return false;
    return this.lastReading.noise > this.config.noisyThreshold;
  }

  /**
   * Get noise zone classification
   */
  getNoiseZone(): 'CLEAN' | 'MODERATE' | 'CHOPPY' | 'NOISY' {
    if (!this.lastReading) return 'MODERATE';

    const { noise } = this.lastReading;

    if (noise < 30) return 'CLEAN';
    if (noise < 50) return 'MODERATE';
    if (noise < 70) return 'CHOPPY';
    return 'NOISY';
  }

  /**
   * Reset history
   */
  reset(): void {
    this.priceHistory = [];
    this.lastReading = null;
  }
}

export default NoiseFilter;
