// app/lib/strategy/StrategyIntegration.ts
// Integration example for AdaptiveShieldStrategySelector

import { adaptiveShieldStrategySelector } from "./AdaptiveShieldStrategySelector";

/**
 * Integration with DecisionEngine.ts
 * 
 * Usage:
 * ```typescript
 * import { adaptiveShieldStrategySelector } from "../strategy/AdaptiveShieldStrategySelector";
 * 
 * const selectedStrategy = adaptiveShieldStrategySelector.selectStrategy();
 * 
 * decision.strategy = selectedStrategy;
 * 
 * // If pause:
 * if (selectedStrategy === "NO_TRADE_MODE") {
 *   decision.allowTrade = false;
 * }
 * ```
 */

/**
 * Get current strategy recommendation
 */
export function getCurrentStrategy(): string {
  return adaptiveShieldStrategySelector.selectStrategy();
}

/**
 * Get shield mode and strategy description
 */
export function getStrategyInfo(): {
  mode: string;
  strategy: string;
  shieldScore: number;
  description: string;
} {
  const mode = adaptiveShieldStrategySelector.getMode();
  const score = adaptiveShieldStrategySelector.getShieldScore();
  
  let description = "";
  switch (mode.strategy) {
    case "aggressive":
      description = "Aggressive / high-profit";
      break;
    case "hybrid":
      description = "Hybrid strategy";
      break;
    case "defensive":
      description = "Defensive / tight SL";
      break;
    case "pause":
      description = "Pause or micro-trade";
      break;
  }

  return {
    mode: mode.mode,
    strategy: mode.strategy,
    shieldScore: score,
    description,
  };
}

/**
 * Check if trading should be paused
 */
export function shouldPauseTrad(): boolean {
  const strategy = adaptiveShieldStrategySelector.selectStrategy();
  return strategy === "NO_TRADE_MODE";
}
