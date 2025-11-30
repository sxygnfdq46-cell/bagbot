// app/lib/risk/RiskIntegration.ts
// Integration example for ShieldRiskCurveEngine

import { shieldRiskCurveEngine } from "./ShieldRiskCurveEngine";

/**
 * Integration with DecisionEngine.ts
 * 
 * Usage:
 * ```typescript
 * import { shieldRiskCurveEngine } from "../risk/ShieldRiskCurveEngine";
 * 
 * const riskProfile = shieldRiskCurveEngine.computeRiskProfile();
 * 
 * decision.lotSize = riskProfile.lotSize;
 * decision.stopLoss = riskProfile.stopLoss;
 * decision.takeProfit = riskProfile.takeProfit;
 * decision.frequency = riskProfile.tradeFrequency;
 * decision.mode = riskProfile.mode;
 * ```
 * 
 * This automatically controls BagBot's behavior during real trades.
 */

/**
 * Get current risk profile for trading
 */
export function getCurrentRiskProfile() {
  return shieldRiskCurveEngine.computeRiskProfile();
}

/**
 * Get risk curve value (0-1)
 */
export function getRiskCurve(): number {
  return shieldRiskCurveEngine.calculateRiskCurve();
}

/**
 * Check if in hypertrade mode (risk very low)
 */
export function isHypertradeMode(): boolean {
  const profile = shieldRiskCurveEngine.computeRiskProfile();
  return profile.mode === "hypertrade";
}

/**
 * Check if in microtrade mode (risk very high)
 */
export function isMicrotradeMode(): boolean {
  const profile = shieldRiskCurveEngine.computeRiskProfile();
  return profile.mode === "microtrade";
}

/**
 * Get recommended lot size multiplier
 */
export function getLotSizeMultiplier(): number {
  const profile = shieldRiskCurveEngine.computeRiskProfile();
  return profile.lotSize;
}
