/**
 * PHASE 3 — THE TRUTH ENGINE
 * Truth Reconciliation Engine (TRE)
 * 
 * This merges Sim vs Live discrepancies using:
 * - Bayesian inferencing
 * - Kalman-style correction
 * - Weighted error reconciliation
 * - Time-decay truth filters
 * 
 * The output is a Corrected Reality Profile, containing:
 * - corrected volatility
 * - corrected edge probability
 * - corrected win expectancy
 * - corrected risk curves
 * - corrected drawdown forecasts
 * 
 * This profile becomes the new truth BagBot uses for live trading.
 */

export interface SimulationProfile {
  volatility: number;
  edgeProbability: number;
  winExpectancy: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
}

export interface LiveProfile {
  volatility: number;
  edgeProbability: number;
  winExpectancy: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  sampleSize: number;  // Number of live trades
}

export interface CorrectedRealityProfile {
  correctedVolatility: number;
  correctedEdgeProbability: number;
  correctedWinExpectancy: number;
  correctedRiskCurves: number;
  correctedDrawdownForecast: number;
  correctedSharpe: number;
  correctedProfitFactor: number;
  confidence: number;  // How confident we are in this correction
  timestamp: number;
}

export class TruthReconciliationEngine {
  private readonly MIN_SAMPLE_SIZE = 30;  // Minimum trades for reliable correction
  private readonly TIME_DECAY_FACTOR = 0.95;  // Newer data weighted more heavily

  /**
   * Merge simulation and live profiles using Bayesian-style weighting
   */
  reconcile(sim: SimulationProfile, live: LiveProfile): CorrectedRealityProfile {
    // If sample size too small, trust simulation more
    const liveWeight = this.calculateLiveWeight(live.sampleSize);
    const simWeight = 1 - liveWeight;

    // Bayesian-weighted reconciliation
    const correctedVolatility = this.bayesianMerge(
      sim.volatility,
      live.volatility,
      simWeight,
      liveWeight
    );

    const correctedEdgeProbability = this.bayesianMerge(
      sim.edgeProbability,
      live.edgeProbability,
      simWeight,
      liveWeight
    );

    const correctedWinExpectancy = this.bayesianMerge(
      sim.winExpectancy,
      live.winExpectancy,
      simWeight,
      liveWeight
    );

    // Kalman-style correction for drawdown (pessimistic adjustment)
    const correctedDrawdownForecast = this.kalmanCorrection(
      sim.maxDrawdown,
      live.maxDrawdown,
      1.2  // Apply 20% safety margin
    );

    // Risk curve adjustment (blend of sim and live risk profiles)
    const correctedRiskCurves = this.weightedAverage(
      1.0,  // Sim risk baseline
      live.maxDrawdown / (sim.maxDrawdown + 0.001),  // Live risk ratio
      simWeight,
      liveWeight
    );

    // Sharpe and profit factor corrections
    const correctedSharpe = this.bayesianMerge(
      sim.sharpeRatio,
      live.sharpeRatio,
      simWeight,
      liveWeight
    );

    const correctedProfitFactor = this.bayesianMerge(
      sim.profitFactor,
      live.profitFactor,
      simWeight,
      liveWeight
    );

    // Confidence in correction (based on sample size and agreement)
    const confidence = this.calculateConfidence(sim, live, live.sampleSize);

    return {
      correctedVolatility,
      correctedEdgeProbability,
      correctedWinExpectancy,
      correctedRiskCurves,
      correctedDrawdownForecast,
      correctedSharpe,
      correctedProfitFactor,
      confidence,
      timestamp: Date.now(),
    };
  }

  /**
   * Bayesian-style merge of two values with weights
   */
  private bayesianMerge(
    simValue: number,
    liveValue: number,
    simWeight: number,
    liveWeight: number
  ): number {
    return simValue * simWeight + liveValue * liveWeight;
  }

  /**
   * Kalman-style correction with safety margin
   */
  private kalmanCorrection(
    simValue: number,
    liveValue: number,
    safetyMargin: number
  ): number {
    // Take the worse of the two, then apply safety margin
    const worst = Math.max(simValue, liveValue);
    return worst * safetyMargin;
  }

  /**
   * Weighted average calculation
   */
  private weightedAverage(
    value1: number,
    value2: number,
    weight1: number,
    weight2: number
  ): number {
    return (value1 * weight1 + value2 * weight2) / (weight1 + weight2);
  }

  /**
   * Calculate weight for live data based on sample size
   */
  private calculateLiveWeight(sampleSize: number): number {
    if (sampleSize < this.MIN_SAMPLE_SIZE) {
      // Not enough data, trust simulation more
      return sampleSize / this.MIN_SAMPLE_SIZE * 0.5;
    }
    
    // Gradually increase live weight as sample grows
    return Math.min(0.8, 0.5 + (sampleSize - this.MIN_SAMPLE_SIZE) / 200);
  }

  /**
   * Calculate confidence in the correction
   */
  private calculateConfidence(
    sim: SimulationProfile,
    live: LiveProfile,
    sampleSize: number
  ): number {
    // Base confidence from sample size
    let confidence = Math.min(1.0, sampleSize / 100);

    // Reduce confidence if sim and live diverge significantly
    const volatilityDiff = Math.abs(sim.volatility - live.volatility);
    const edgeDiff = Math.abs(sim.edgeProbability - live.edgeProbability);
    
    const divergence = (volatilityDiff + edgeDiff) / 2;
    confidence *= (1 - Math.min(0.5, divergence));

    return Math.max(0.1, confidence);
  }

  /**
   * Apply time-decay filter to historical corrections
   */
  applyTimeDecay(oldProfile: CorrectedRealityProfile, newProfile: CorrectedRealityProfile): CorrectedRealityProfile {
    const decayedOld = {
      ...oldProfile,
      correctedVolatility: oldProfile.correctedVolatility * this.TIME_DECAY_FACTOR,
      correctedEdgeProbability: oldProfile.correctedEdgeProbability * this.TIME_DECAY_FACTOR,
    };

    // Merge decayed old with new
    return {
      correctedVolatility: (decayedOld.correctedVolatility + newProfile.correctedVolatility) / 2,
      correctedEdgeProbability: (decayedOld.correctedEdgeProbability + newProfile.correctedEdgeProbability) / 2,
      correctedWinExpectancy: newProfile.correctedWinExpectancy,
      correctedRiskCurves: newProfile.correctedRiskCurves,
      correctedDrawdownForecast: newProfile.correctedDrawdownForecast,
      correctedSharpe: newProfile.correctedSharpe,
      correctedProfitFactor: newProfile.correctedProfitFactor,
      confidence: (decayedOld.confidence + newProfile.confidence) / 2,
      timestamp: Date.now(),
    };
  }
}
