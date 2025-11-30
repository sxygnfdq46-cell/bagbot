/**
 * PHASE 3 — THE TRUTH ENGINE
 * Corrected Reality Profile
 * 
 * This defines the corrected volatility, corrected edge probability,
 * corrected win expectancy, corrected risk curves, and corrected drawdown forecasts.
 * 
 * This profile becomes the NEW TRUTH that BagBot uses for live trading decisions.
 */

export interface CorrectedRealityProfile {
  // Core metrics (corrected from sim vs live reconciliation)
  correctedVolatility: number;
  correctedEdgeProbability: number;
  correctedWinExpectancy: number;
  correctedRiskCurves: number;
  correctedDrawdownForecast: number;
  
  // Performance metrics
  correctedSharpe: number;
  correctedProfitFactor: number;
  
  // Metadata
  confidence: number;  // 0-1, how reliable this profile is
  timestamp: number;
  sampleSize: number;  // Number of trades this is based on
  
  // Status flags
  isReliable: boolean;
  needsMoreData: boolean;
  divergenceWarning: boolean;
}

/**
 * Factory for creating and validating CorrectedRealityProfiles
 */
export class CorrectedRealityProfileFactory {
  private readonly MIN_CONFIDENCE = 0.3;
  private readonly MIN_SAMPLE = 30;
  private readonly MAX_DIVERGENCE = 0.5;

  /**
   * Create a new profile with validation
   */
  create(
    correctedVolatility: number,
    correctedEdgeProbability: number,
    correctedWinExpectancy: number,
    correctedRiskCurves: number,
    correctedDrawdownForecast: number,
    correctedSharpe: number,
    correctedProfitFactor: number,
    confidence: number,
    sampleSize: number
  ): CorrectedRealityProfile {
    // Validate inputs
    const isReliable = confidence >= this.MIN_CONFIDENCE && sampleSize >= this.MIN_SAMPLE;
    const needsMoreData = sampleSize < this.MIN_SAMPLE;
    
    // Check for dangerous divergence
    const avgMetric = (correctedVolatility + correctedEdgeProbability + correctedWinExpectancy) / 3;
    const divergenceWarning = avgMetric > this.MAX_DIVERGENCE || avgMetric < -this.MAX_DIVERGENCE;

    return {
      correctedVolatility: this.clamp(correctedVolatility, 0, 2),
      correctedEdgeProbability: this.clamp(correctedEdgeProbability, 0, 1),
      correctedWinExpectancy: this.clamp(correctedWinExpectancy, -1, 1),
      correctedRiskCurves: this.clamp(correctedRiskCurves, 0, 3),
      correctedDrawdownForecast: this.clamp(correctedDrawdownForecast, 0, 1),
      correctedSharpe: this.clamp(correctedSharpe, -5, 10),
      correctedProfitFactor: this.clamp(correctedProfitFactor, 0, 10),
      confidence: this.clamp(confidence, 0, 1),
      timestamp: Date.now(),
      sampleSize,
      isReliable,
      needsMoreData,
      divergenceWarning,
    };
  }

  /**
   * Create a default safe profile (used when no data available)
   */
  createSafeDefault(): CorrectedRealityProfile {
    return this.create(
      0.5,   // Conservative volatility estimate
      0.5,   // Neutral edge probability
      0,     // No expected edge
      1.0,   // Baseline risk
      0.2,   // Conservative drawdown forecast
      0,     // Neutral Sharpe
      1.0,   // Breakeven profit factor
      0.1,   // Low confidence
      0      // No samples
    );
  }

  /**
   * Merge two profiles (useful for combining multiple timeframes)
   */
  merge(profile1: CorrectedRealityProfile, profile2: CorrectedRealityProfile): CorrectedRealityProfile {
    const totalSamples = profile1.sampleSize + profile2.sampleSize;
    const weight1 = profile1.sampleSize / totalSamples;
    const weight2 = profile2.sampleSize / totalSamples;

    return this.create(
      profile1.correctedVolatility * weight1 + profile2.correctedVolatility * weight2,
      profile1.correctedEdgeProbability * weight1 + profile2.correctedEdgeProbability * weight2,
      profile1.correctedWinExpectancy * weight1 + profile2.correctedWinExpectancy * weight2,
      profile1.correctedRiskCurves * weight1 + profile2.correctedRiskCurves * weight2,
      profile1.correctedDrawdownForecast * weight1 + profile2.correctedDrawdownForecast * weight2,
      profile1.correctedSharpe * weight1 + profile2.correctedSharpe * weight2,
      profile1.correctedProfitFactor * weight1 + profile2.correctedProfitFactor * weight2,
      (profile1.confidence + profile2.confidence) / 2,
      totalSamples
    );
  }

  /**
   * Clamp value between min and max
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
