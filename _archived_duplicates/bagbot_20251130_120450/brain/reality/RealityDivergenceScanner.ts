/**
 * PHASE 3 — THE TRUTH ENGINE
 * Reality Divergence Scanner (RDS)
 * 
 * This module constantly compares:
 * - Backtest results
 * - Live results  
 * - Expected results (from modeling)
 * 
 * It measures the "truth gap" between what SHOULD happen and what DID happen.
 * If reality is drifting → BagBot adapts live.
 */

export interface PerformanceSnapshot {
  winRate: number;
  avgSlippage: number;
  avgSpread: number;
  volatility: number;
  liquidity: number;
  fillQuality: number;
  timestamp: number;
}

export interface DivergenceReport {
  slippageDeviation: number;     // How far actual slippage differs from expected
  spreadDeviation: number;        // Spread mismatch
  volatilityMismatch: number;     // Volatility reality vs model
  liquidityMismatch: number;      // Liquidity reality vs model
  fillQualityRating: number;      // 0-100 score
  executionRiskScore: number;     // Higher = more dangerous
  truthGap: number;               // Overall divergence score
  status: "ALIGNED" | "DRIFTING" | "CRITICAL";
}

export class RealityDivergenceScanner {
  private backtestBaseline: PerformanceSnapshot | null = null;
  private liveHistory: PerformanceSnapshot[] = [];
  private expectedModel: PerformanceSnapshot | null = null;

  /**
   * Set the backtest baseline (what we expect in ideal conditions)
   */
  setBacktestBaseline(snapshot: PerformanceSnapshot): void {
    this.backtestBaseline = snapshot;
  }

  /**
   * Set the expected model (what we predict for current market)
   */
  setExpectedModel(snapshot: PerformanceSnapshot): void {
    this.expectedModel = snapshot;
  }

  /**
   * Register a live execution result
   */
  registerLiveResult(snapshot: PerformanceSnapshot): void {
    this.liveHistory.push(snapshot);
    
    // Keep only last 100 results
    if (this.liveHistory.length > 100) {
      this.liveHistory.shift();
    }
  }

  /**
   * Compute the divergence between expected and actual reality
   */
  scan(): DivergenceReport {
    if (!this.backtestBaseline || !this.expectedModel || this.liveHistory.length === 0) {
      return this.getEmptyReport();
    }

    const liveAvg = this.computeLiveAverage();

    // Calculate individual deviations
    const slippageDeviation = Math.abs(liveAvg.avgSlippage - this.expectedModel.avgSlippage);
    const spreadDeviation = Math.abs(liveAvg.avgSpread - this.expectedModel.avgSpread);
    const volatilityMismatch = Math.abs(liveAvg.volatility - this.expectedModel.volatility);
    const liquidityMismatch = Math.abs(liveAvg.liquidity - this.expectedModel.liquidity);

    // Fill quality rating (0-100)
    const fillQualityRating = Math.max(0, 100 - (slippageDeviation * 10 + spreadDeviation * 5));

    // Execution risk score (higher = more dangerous)
    const executionRiskScore = 
      slippageDeviation * 0.4 +
      spreadDeviation * 0.3 +
      volatilityMismatch * 0.2 +
      liquidityMismatch * 0.1;

    // Overall truth gap
    const truthGap = 
      (slippageDeviation + spreadDeviation + volatilityMismatch + liquidityMismatch) / 4;

    // Determine status
    let status: "ALIGNED" | "DRIFTING" | "CRITICAL";
    if (truthGap < 0.1) {
      status = "ALIGNED";
    } else if (truthGap < 0.3) {
      status = "DRIFTING";
    } else {
      status = "CRITICAL";
    }

    return {
      slippageDeviation,
      spreadDeviation,
      volatilityMismatch,
      liquidityMismatch,
      fillQualityRating,
      executionRiskScore,
      truthGap,
      status,
    };
  }

  private computeLiveAverage(): PerformanceSnapshot {
    const count = this.liveHistory.length;
    
    return {
      winRate: this.liveHistory.reduce((sum, s) => sum + s.winRate, 0) / count,
      avgSlippage: this.liveHistory.reduce((sum, s) => sum + s.avgSlippage, 0) / count,
      avgSpread: this.liveHistory.reduce((sum, s) => sum + s.avgSpread, 0) / count,
      volatility: this.liveHistory.reduce((sum, s) => sum + s.volatility, 0) / count,
      liquidity: this.liveHistory.reduce((sum, s) => sum + s.liquidity, 0) / count,
      fillQuality: this.liveHistory.reduce((sum, s) => sum + s.fillQuality, 0) / count,
      timestamp: Date.now(),
    };
  }

  private getEmptyReport(): DivergenceReport {
    return {
      slippageDeviation: 0,
      spreadDeviation: 0,
      volatilityMismatch: 0,
      liquidityMismatch: 0,
      fillQualityRating: 100,
      executionRiskScore: 0,
      truthGap: 0,
      status: "ALIGNED",
    };
  }
}
