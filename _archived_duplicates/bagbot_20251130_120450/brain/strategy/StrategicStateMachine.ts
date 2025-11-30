/**
 * LEVEL 22 — Strategic Intelligence Layer
 * Strategic State Machine (SSM)
 *
 * Determines BagBot's operational mode based on
 * market conditions + storyline interpretation.
 */

export type StrategyState =
  | "TREND_MODE"
  | "MEAN_REVERSION_MODE"
  | "BREAKOUT_MODE"
  | "SCALPING_MODE"
  | "DEFENSIVE_MODE"
  | "VOLATILITY_SHIELD_MODE"
  | "PROFIT_LOCK_MODE";

export class StrategicStateMachine {
  public evaluateState(storyline: string, metrics: any): StrategyState {
    const { volatility, trend, liquidity } = metrics;

    // ---- High-risk protection ----
    if (volatility > 0.85) return "VOLATILITY_SHIELD_MODE";
    if (liquidity < 0.2) return "DEFENSIVE_MODE";

    // ---- High-confidence profit locking ----
    if (trend > 0.8 && liquidity > 0.6) return "PROFIT_LOCK_MODE";

    // ---- Strategy selection ----
    if (trend > 0.4) return "TREND_MODE";
    if (trend < -0.4) return "MEAN_REVERSION_MODE";
    if (volatility > 0.6) return "BREAKOUT_MODE";

    // ---- Default fast scalping behavior ----
    return "SCALPING_MODE";
  }
}
