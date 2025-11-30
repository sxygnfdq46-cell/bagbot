// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REGIME SCANNER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Detects current market regime to adapt strategy behavior
// Regimes: RANGING / TRENDING / BREAKOUT / COMPRESSION

export type MarketRegime = 'RANGING' | 'TRENDING' | 'BREAKOUT' | 'COMPRESSION';

export interface RegimeReading {
  regime: MarketRegime;
  confidence: number; // 0-100
  trendStrength: number; // 0-100, higher = stronger trend
  rangeWidth: number; // Price range percentage
  timestamp: number;
}

export interface RegimeScannerConfig {
  lookbackPeriod: number; // Bars to analyze (default: 50)
  trendThreshold: number; // Trend strength threshold (default: 60)
  rangeThreshold: number; // Range tightness threshold (default: 0.02)
  breakoutThreshold: number; // Breakout expansion threshold (default: 0.05)
}

/**
 * RegimeScanner - Market structure analyzer
 * 
 * Purpose: Classify current market behavior to optimize strategy selection
 * 
 * Regimes:
 *   - RANGING: Price moving sideways, low trend strength
 *   - TRENDING: Clear directional movement, high trend strength
 *   - BREAKOUT: Sharp expansion from consolidation
 *   - COMPRESSION: Tight range, potential energy build-up
 * 
 * Strategy Adaptation:
 *   - RANGING: Mean reversion, fade extremes
 *   - TRENDING: Trend following, ride momentum
 *   - BREAKOUT: Quick entries, wide stops
 *   - COMPRESSION: Prepare for expansion, boost confidence on break
 */
export class RegimeScanner {
  private config: RegimeScannerConfig;
  private priceHistory: number[] = [];
  private lastReading: RegimeReading | null = null;

  constructor(config?: Partial<RegimeScannerConfig>) {
    this.config = {
      lookbackPeriod: config?.lookbackPeriod ?? 50,
      trendThreshold: config?.trendThreshold ?? 60,
      rangeThreshold: config?.rangeThreshold ?? 0.02,
      breakoutThreshold: config?.breakoutThreshold ?? 0.05,
    };
  }

  /**
   * Update price history and recompute regime
   * @param price - Current market price
   */
  update(price: number): RegimeReading {
    this.priceHistory.push(price);
    
    // Keep only lookback period
    if (this.priceHistory.length > this.config.lookbackPeriod) {
      this.priceHistory.shift();
    }

    this.lastReading = this.compute();
    return this.lastReading;
  }

  /**
   * Compute market regime
   */
  private compute(): RegimeReading {
    if (this.priceHistory.length < 10) {
      return {
        regime: 'RANGING',
        confidence: 0,
        trendStrength: 0,
        rangeWidth: 0,
        timestamp: Date.now(),
      };
    }

    const prices = this.priceHistory;
    const n = prices.length;

    // Calculate trend strength using linear regression
    const trendStrength = this.calculateTrendStrength(prices);

    // Calculate range width (high-low as % of average)
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / n;
    const rangeWidth = (high - low) / avg;

    // Calculate recent volatility expansion
    const recentRange = this.calculateRecentRange(prices, 10);
    const historicalRange = this.calculateRecentRange(prices, n);
    const expansion = recentRange / historicalRange;

    // Classify regime
    let regime: MarketRegime = 'RANGING';
    let confidence = 50;

    if (expansion > 1.5 && rangeWidth > this.config.breakoutThreshold) {
      // Sharp expansion = BREAKOUT
      regime = 'BREAKOUT';
      confidence = Math.min(100, 50 + expansion * 20);
    } else if (rangeWidth < this.config.rangeThreshold) {
      // Tight range = COMPRESSION
      regime = 'COMPRESSION';
      confidence = Math.min(100, 50 + (1 - rangeWidth / this.config.rangeThreshold) * 50);
    } else if (trendStrength > this.config.trendThreshold) {
      // Strong directional move = TRENDING
      regime = 'TRENDING';
      confidence = Math.min(100, trendStrength);
    } else {
      // Default = RANGING
      regime = 'RANGING';
      confidence = Math.min(100, 50 + (1 - trendStrength / this.config.trendThreshold) * 30);
    }

    return {
      regime,
      confidence,
      trendStrength,
      rangeWidth,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate trend strength using linear regression R²
   * Returns 0-100, higher = stronger trend
   */
  private calculateTrendStrength(prices: number[]): number {
    const n = prices.length;
    if (n < 2) return 0;

    // Simple linear regression
    const xMean = (n - 1) / 2;
    const yMean = prices.reduce((sum, p) => sum + p, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (prices[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate R² (coefficient of determination)
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssRes += Math.pow(prices[i] - predicted, 2);
      ssTot += Math.pow(prices[i] - yMean, 2);
    }

    const r2 = 1 - (ssRes / ssTot);
    return Math.max(0, Math.min(100, r2 * 100));
  }

  /**
   * Calculate range for last N bars
   */
  private calculateRecentRange(prices: number[], bars: number): number {
    const recent = prices.slice(-bars);
    if (recent.length === 0) return 0;

    const high = Math.max(...recent);
    const low = Math.min(...recent);
    const avg = recent.reduce((sum, p) => sum + p, 0) / recent.length;

    return (high - low) / avg;
  }

  /**
   * Get last computed reading
   */
  getReading(): RegimeReading | null {
    return this.lastReading;
  }

  /**
   * Check if in trending regime
   */
  isTrending(): boolean {
    return this.lastReading?.regime === 'TRENDING';
  }

  /**
   * Check if in compression (tight range)
   */
  isCompression(): boolean {
    return this.lastReading?.regime === 'COMPRESSION';
  }

  /**
   * Check if breakout occurring
   */
  isBreakout(): boolean {
    return this.lastReading?.regime === 'BREAKOUT';
  }

  /**
   * Get confidence multiplier for current regime
   * COMPRESSION boosts confidence on breakout signals
   * RANGING reduces trend-following confidence
   */
  getConfidenceMultiplier(signalType: 'TREND' | 'REVERSAL' | 'BREAKOUT'): number {
    if (!this.lastReading) return 1.0;

    const { regime } = this.lastReading;

    if (signalType === 'BREAKOUT') {
      // Boost breakout signals in compression
      return regime === 'COMPRESSION' ? 1.3 : 1.0;
    } else if (signalType === 'TREND') {
      // Boost trend signals in trending regime
      return regime === 'TRENDING' ? 1.2 : regime === 'RANGING' ? 0.8 : 1.0;
    } else if (signalType === 'REVERSAL') {
      // Boost reversals in ranging market
      return regime === 'RANGING' ? 1.2 : regime === 'TRENDING' ? 0.7 : 1.0;
    }

    return 1.0;
  }

  /**
   * Reset history
   */
  reset(): void {
    this.priceHistory = [];
    this.lastReading = null;
  }
}

export default RegimeScanner;
