/**
 * Reality Divergence Scanner
 * 
 * Compares backtest expectations vs live execution reality.
 * Detects discrepancies in slippage, spread, volatility, and execution quality.
 */

export interface BacktestData {
  slippage: number;
  avgSpread: number;
  volatility: number;
  fillDelay: number;
  executionScore: number;
}

export interface LiveData {
  slippage: number;
  avgSpread: number;
  volatility: number;
  fillDelay: number;
  executionScore: number;
  sampleSize: number;
}

export interface MarketMeta {
  avgSpread: number;
  expectedSlippage: number;
  baseVolatility: number;
}

export interface ExpectedModel {
  slippage: number;
  spread: number;
  volatility: number;
  fillDelay: number;
}

export interface DivergenceScanResult {
  slippageDeviation: number;
  spreadAnomaly: number;
  volatilityMismatch: number;
  executionQualityScore: number;
  fillDelayScore: number;
  divergenceIndex: number;
  severityLevel: "low" | "medium" | "high" | "critical";
}

export default class RealityDivergenceScanner {
  private readonly SLIPPAGE_WEIGHT = 0.3;
  private readonly SPREAD_WEIGHT = 0.25;
  private readonly VOLATILITY_WEIGHT = 0.2;
  private readonly EXECUTION_WEIGHT = 0.15;
  private readonly FILL_DELAY_WEIGHT = 0.1;

  /**
   * Scan for divergence between backtest and live execution
   */
  scan(
    backtestData: BacktestData,
    liveData: LiveData,
    marketMeta: MarketMeta,
    expectedModel?: ExpectedModel
  ): DivergenceScanResult {
    // Sanitize inputs with safe defaults
    const sanitizedBacktest = this.sanitizeBacktestData(backtestData);
    const sanitizedLive = this.sanitizeLiveData(liveData);
    const sanitizedMeta = this.sanitizeMarketMeta(marketMeta);

    // Use expected model if provided, otherwise use backtest as baseline
    const baseline = expectedModel 
      ? this.sanitizeExpectedModel(expectedModel)
      : {
          slippage: sanitizedBacktest.slippage,
          spread: sanitizedBacktest.avgSpread,
          volatility: sanitizedBacktest.volatility,
          fillDelay: sanitizedBacktest.fillDelay,
        };

    // Compute deviations
    const slippageDeviation = this.computeSlippageDeviation(
      sanitizedLive.slippage,
      baseline.slippage
    );

    const spreadAnomaly = this.computeSpreadAnomaly(
      sanitizedLive.avgSpread,
      sanitizedMeta.avgSpread
    );

    const volatilityMismatch = this.computeVolatilityMismatch(
      sanitizedLive.volatility,
      baseline.volatility
    );

    const executionQualityScore = this.computeExecutionQualityScore(
      sanitizedLive.executionScore,
      sanitizedBacktest.executionScore,
      slippageDeviation,
      spreadAnomaly
    );

    const fillDelayScore = this.computeFillDelayScore(
      sanitizedLive.fillDelay,
      baseline.fillDelay
    );

    // Compute overall divergence index
    const divergenceIndex = this.computeDivergenceIndex(
      slippageDeviation,
      spreadAnomaly,
      volatilityMismatch,
      executionQualityScore,
      fillDelayScore
    );

    // Determine severity level
    const severityLevel = this.determineSeverityLevel(divergenceIndex);

    return {
      slippageDeviation,
      spreadAnomaly,
      volatilityMismatch,
      executionQualityScore,
      fillDelayScore,
      divergenceIndex,
      severityLevel,
    };
  }

  /**
   * Compute slippage deviation
   */
  private computeSlippageDeviation(liveSlippage: number, baselineSlippage: number): number {
    return liveSlippage - baselineSlippage;
  }

  /**
   * Compute spread anomaly
   */
  private computeSpreadAnomaly(liveSpread: number, expectedSpread: number): number {
    return liveSpread - expectedSpread;
  }

  /**
   * Compute volatility mismatch using percentage change
   */
  private computeVolatilityMismatch(liveVolatility: number, baselineVolatility: number): number {
    if (baselineVolatility === 0) return 0;
    return ((liveVolatility - baselineVolatility) / baselineVolatility) * 100;
  }

  /**
   * Compute execution quality score (0-100)
   */
  private computeExecutionQualityScore(
    liveScore: number,
    backtestScore: number,
    slippageDeviation: number,
    spreadAnomaly: number
  ): number {
    // Start with live score
    let qualityScore = liveScore;

    // Penalize for slippage deviation
    const slippagePenalty = Math.abs(slippageDeviation) * 10;
    qualityScore -= slippagePenalty;

    // Penalize for spread anomaly
    const spreadPenalty = Math.abs(spreadAnomaly) * 5;
    qualityScore -= spreadPenalty;

    // Compare to backtest expectations
    const backtestDiff = backtestScore - liveScore;
    if (backtestDiff > 0) {
      qualityScore -= backtestDiff * 0.5;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, qualityScore));
  }

  /**
   * Compute fill delay score (inverse - lower delay = higher score)
   */
  private computeFillDelayScore(liveDelay: number, baselineDelay: number): number {
    const delayIncrease = liveDelay - baselineDelay;
    
    // Convert to 0-100 score (lower delay = higher score)
    const baseScore = 100;
    const penalty = delayIncrease * 2; // Each ms of extra delay = -2 points
    
    return Math.max(0, Math.min(100, baseScore - penalty));
  }

  /**
   * Compute weighted divergence index
   */
  private computeDivergenceIndex(
    slippageDeviation: number,
    spreadAnomaly: number,
    volatilityMismatch: number,
    executionQualityScore: number,
    fillDelayScore: number
  ): number {
    // Normalize each component to 0-100 scale
    const normalizedSlippage = Math.min(100, Math.abs(slippageDeviation) * 10);
    const normalizedSpread = Math.min(100, Math.abs(spreadAnomaly) * 20);
    const normalizedVolatility = Math.min(100, Math.abs(volatilityMismatch));
    const normalizedExecution = 100 - executionQualityScore; // Invert (higher score = lower divergence)
    const normalizedFillDelay = 100 - fillDelayScore; // Invert

    // Weighted combination
    const divergence =
      normalizedSlippage * this.SLIPPAGE_WEIGHT +
      normalizedSpread * this.SPREAD_WEIGHT +
      normalizedVolatility * this.VOLATILITY_WEIGHT +
      normalizedExecution * this.EXECUTION_WEIGHT +
      normalizedFillDelay * this.FILL_DELAY_WEIGHT;

    return Math.max(0, Math.min(100, divergence));
  }

  /**
   * Determine severity level based on divergence index
   */
  private determineSeverityLevel(divergenceIndex: number): "low" | "medium" | "high" | "critical" {
    if (divergenceIndex < 25) return "low";
    if (divergenceIndex < 50) return "medium";
    if (divergenceIndex < 75) return "high";
    return "critical";
  }

  /**
   * Sanitize backtest data
   */
  private sanitizeBacktestData(data: BacktestData): BacktestData {
    return {
      slippage: Number(data.slippage) || 0,
      avgSpread: Number(data.avgSpread) || 0,
      volatility: Number(data.volatility) || 0,
      fillDelay: Number(data.fillDelay) || 0,
      executionScore: Number(data.executionScore) || 50,
    };
  }

  /**
   * Sanitize live data
   */
  private sanitizeLiveData(data: LiveData): LiveData {
    return {
      slippage: Number(data.slippage) || 0,
      avgSpread: Number(data.avgSpread) || 0,
      volatility: Number(data.volatility) || 0,
      fillDelay: Number(data.fillDelay) || 0,
      executionScore: Number(data.executionScore) || 50,
      sampleSize: Number(data.sampleSize) || 0,
    };
  }

  /**
   * Sanitize market meta
   */
  private sanitizeMarketMeta(meta: MarketMeta): MarketMeta {
    return {
      avgSpread: Number(meta.avgSpread) || 0,
      expectedSlippage: Number(meta.expectedSlippage) || 0,
      baseVolatility: Number(meta.baseVolatility) || 0,
    };
  }

  /**
   * Sanitize expected model
   */
  private sanitizeExpectedModel(model: ExpectedModel): ExpectedModel {
    return {
      slippage: Number(model.slippage) || 0,
      spread: Number(model.spread) || 0,
      volatility: Number(model.volatility) || 0,
      fillDelay: Number(model.fillDelay) || 0,
    };
  }
}
