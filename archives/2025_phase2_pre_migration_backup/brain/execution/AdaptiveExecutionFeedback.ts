/**
 * LEVEL 21 — PHASE 5
 * ADAPTIVE EXECUTION FEEDBACK LOOP (AEFL)
 *
 * This system continuously analyzes:
 *  - execution quality
 *  - fill price accuracy
 *  - slippage trends
 *  - volatility changes during execution
 *  - success rate of the orchestrator's decisions
 *  - spread impact
 *
 * It then adjusts:
 *  - risk scaling
 *  - lot sizing
 *  - timing windows
 *  - volatility tolerance
 */

export interface ExecutionReport {
  symbol: string;
  action: "BUY" | "SELL";
  requestedLot: number;
  executedLot: number;
  requestedPrice: number;
  filledPrice: number;
  spreadAtExecution: number;
  slippage: number;
  volatilityAtExecution: number;
  timestamp: number;
}

export interface AEFLState {
  avgSlippage: number;
  avgFillQuality: number;
  avgSpreadImpact: number;
  volatilityAdjustment: number;
  lotSizeAdjustment: number;
}

export class AdaptiveExecutionFeedback {
  private history: ExecutionReport[] = [];
  private state: AEFLState = {
    avgSlippage: 0,
    avgFillQuality: 1,
    avgSpreadImpact: 0,
    volatilityAdjustment: 1,
    lotSizeAdjustment: 1,
  };

  /**
   * Called after every trade execution.
   */
  public register(report: ExecutionReport) {
    this.history.push(report);

    // Limit memory to last 500 trades
    if (this.history.length > 500) this.history.shift();

    this.recalculateState();
  }

  private recalculateState() {
    const h = this.history;

    if (h.length === 0) return;

    // Average slippage calculations
    this.state.avgSlippage =
      h.reduce((a, b) => a + b.slippage, 0) / h.length;

    // Fill quality: 1 = perfect, <1 = bad
    this.state.avgFillQuality =
      h.reduce((a, b) => a + (b.requestedPrice / b.filledPrice), 0) /
      h.length;

    // Spread effect
    this.state.avgSpreadImpact =
      h.reduce((a, b) => a + b.spreadAtExecution, 0) / h.length;

    // Volatility adaptation
    this.state.volatilityAdjustment = this.computeVolatilityAdjustment();

    // Lot size tuning
    this.state.lotSizeAdjustment = this.computeLotSizeAdjustment();
  }

  private computeVolatilityAdjustment() {
    if (this.state.avgSlippage > 2.0) {
      return 0.7; // reduce aggression
    }
    if (this.state.avgSlippage < 0.5) {
      return 1.2; // allow more decisive entries
    }
    return 1.0;
  }

  private computeLotSizeAdjustment() {
    if (this.state.avgSpreadImpact > 3.0) {
      return 0.85; // smaller lots in bad market
    }
    if (this.state.avgFillQuality > 1.02) {
      return 1.15; // increase lot size when fills are excellent
    }
    return 1.0;
  }

  public getState(): AEFLState {
    return this.state;
  }
}
