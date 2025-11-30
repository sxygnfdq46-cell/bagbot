// app/lib/intel/DailyTradingIntegration.ts
// Integration example for DailyTradingHarmonizer

import { dailyTradingHarmonizer } from "./DailyTradingHarmonizer";

/**
 * Integration example for TradingPipelineCore.ts or DecisionEngine.ts
 * 
 * Usage:
 * ```typescript
 * import { dailyTradingHarmonizer } from "./DailyTradingHarmonizer";
 * 
 * // Initialize
 * dailyTradingHarmonizer.subscribe();
 * 
 * // Get current config
 * const { mode, minTrades, maxTrades, riskMultiplier } = 
 *   dailyTradingHarmonizer.getConfig();
 * 
 * // Apply to position sizing
 * positionSize = basePosition * riskMultiplier;
 * 
 * // Example: daily rule strategy scheduling
 * allowedTradesToday = Math.min(maxTrades, maxAllowedByStrategies);
 * ```
 */

/**
 * Calculate position size with threat-aware risk adjustment
 */
export function calculatePositionSize(
  basePosition: number,
  accountBalance: number
): number {
  const { riskMultiplier } = dailyTradingHarmonizer.getConfig();
  
  // Apply risk multiplier
  const adjustedPosition = basePosition * riskMultiplier;
  
  // Safety cap: never exceed 10% of account
  const maxPosition = accountBalance * 0.1;
  
  return Math.min(adjustedPosition, maxPosition);
}

/**
 * Check if trading is allowed today based on threat level and trade count
 */
export function isTradingAllowed(tradesCompletedToday: number): boolean {
  const { minTrades, maxTrades } = dailyTradingHarmonizer.getConfig();
  
  // Always allow at least minTrades per day
  if (tradesCompletedToday < minTrades) {
    return true;
  }
  
  // Block if maxTrades reached
  if (tradesCompletedToday >= maxTrades) {
    return false;
  }
  
  return true;
}

/**
 * Get trading mode description for UI
 */
export function getTradingModeDescription(): string {
  const { mode } = dailyTradingHarmonizer.getConfig();
  
  switch (mode) {
    case "normal":
      return "Full strategy set active • Standard risk";
    case "caution":
      return "Reduced frequency • Smaller positions";
    case "safe":
      return "Minimal trades • Ultra-controlled risk";
    default:
      return "Unknown mode";
  }
}

/**
 * Initialize daily trading harmonizer
 */
export function initDailyTradingHarmonizer() {
  dailyTradingHarmonizer.subscribe();
  return dailyTradingHarmonizer;
}
