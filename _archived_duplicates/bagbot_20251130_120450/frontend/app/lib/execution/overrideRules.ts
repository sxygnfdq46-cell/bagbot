/**
 * Override Rules - Execution Override Rule Definitions
 * 
 * Dynamic rules that can halt or modify trades based on market conditions.
 * Rules are adjustable by Shield/Threat engines for adaptive protection.
 */

/**
 * Rule result interface
 */
export interface RuleResult {
  triggered: boolean;
  severity: number;        // 0-100
  reason: string;
  threshold: number;
  currentValue: number;
  override: boolean;       // Should override execution?
}

/**
 * Rule configuration
 */
export interface RuleConfig {
  enabled: boolean;
  threshold: number;
  severity: number;        // Base severity if triggered
  adjustable: boolean;     // Can be adjusted by engines?
}

/**
 * Override rule context
 */
export interface RuleContext {
  snapshot: any;
  position?: any;
  shieldActive?: boolean;
  threatLevel?: number;
  volatilityLevel?: number;
  flowState?: string;
}

/**
 * Default rule configurations
 */
export const DEFAULT_RULE_CONFIGS: Record<string, RuleConfig> = {
  spreadLimit: {
    enabled: true,
    threshold: 0.5,        // 0.5% spread limit
    severity: 70,
    adjustable: true,
  },
  
  volatilityLimit: {
    enabled: true,
    threshold: 80,         // Volatility > 80
    severity: 75,
    adjustable: true,
  },
  
  slippageLimit: {
    enabled: true,
    threshold: 0.3,        // 0.3% slippage limit
    severity: 65,
    adjustable: true,
  },
  
  momentumDrop: {
    enabled: true,
    threshold: -30,        // 30% momentum drop
    severity: 60,
    adjustable: true,
  },
  
  reversalSignal: {
    enabled: true,
    threshold: 70,         // Reversal confidence > 70
    severity: 55,
    adjustable: true,
  },
  
  liquidityThreshold: {
    enabled: true,
    threshold: 30,         // Liquidity < 30
    severity: 80,
    adjustable: true,
  },
  
  conflictRules: {
    enabled: true,
    threshold: 3,          // 3+ conflicts
    severity: 50,
    adjustable: false,     // Not adjustable
  },
};

/**
 * Current rule configurations (can be modified)
 */
let ruleConfigs: Record<string, RuleConfig> = { ...DEFAULT_RULE_CONFIGS };

// ============================================================================
// Spread Limit Rule
// ============================================================================

/**
 * Check if spread is too wide
 */
export function checkSpreadLimit(context: RuleContext): RuleResult {
  const config = ruleConfigs.spreadLimit;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const spread = context.snapshot?.spread || 0;
  const spreadPercent = (spread / context.snapshot?.price || 1) * 100;
  
  const triggered = spreadPercent > config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered 
      ? `Spread too wide: ${spreadPercent.toFixed(3)}% (limit: ${config.threshold}%)`
      : "Spread within limits",
    threshold: config.threshold,
    currentValue: spreadPercent,
    override: triggered,
  };
}

// ============================================================================
// Volatility Limit Rule
// ============================================================================

/**
 * Check if volatility is too high
 */
export function checkVolatilityLimit(context: RuleContext): RuleResult {
  const config = ruleConfigs.volatilityLimit;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const volatility = context.volatilityLevel || context.snapshot?.volatility || 0;
  const triggered = volatility > config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered
      ? `Volatility too high: ${volatility.toFixed(1)} (limit: ${config.threshold})`
      : "Volatility within limits",
    threshold: config.threshold,
    currentValue: volatility,
    override: triggered,
  };
}

// ============================================================================
// Slippage Limit Rule
// ============================================================================

/**
 * Check if expected slippage is too high
 */
export function checkSlippageLimit(context: RuleContext): RuleResult {
  const config = ruleConfigs.slippageLimit;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const slippage = context.snapshot?.expectedSlippage || 0;
  const triggered = slippage > config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered
      ? `Slippage too high: ${slippage.toFixed(3)}% (limit: ${config.threshold}%)`
      : "Slippage within limits",
    threshold: config.threshold,
    currentValue: slippage,
    override: triggered,
  };
}

// ============================================================================
// Momentum Drop Rule
// ============================================================================

/**
 * Check if momentum has dropped significantly
 */
export function checkMomentumDrop(context: RuleContext): RuleResult {
  const config = ruleConfigs.momentumDrop;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const momentumChange = context.snapshot?.momentumChange || 0;
  const triggered = momentumChange < config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered
      ? `Momentum drop detected: ${momentumChange.toFixed(1)}% (threshold: ${config.threshold}%)`
      : "Momentum stable",
    threshold: config.threshold,
    currentValue: momentumChange,
    override: triggered,
  };
}

// ============================================================================
// Reversal Signal Rule
// ============================================================================

/**
 * Check if reversal signal detected
 */
export function checkReversalSignal(context: RuleContext): RuleResult {
  const config = ruleConfigs.reversalSignal;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const reversalConfidence = context.snapshot?.reversalConfidence || 0;
  const triggered = reversalConfidence > config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered
      ? `Strong reversal signal: ${reversalConfidence.toFixed(1)} (threshold: ${config.threshold})`
      : "No reversal detected",
    threshold: config.threshold,
    currentValue: reversalConfidence,
    override: triggered,
  };
}

// ============================================================================
// Liquidity Threshold Rule
// ============================================================================

/**
 * Check if liquidity is too low
 */
export function checkLiquidityThreshold(context: RuleContext): RuleResult {
  const config = ruleConfigs.liquidityThreshold;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const liquidity = context.snapshot?.liquidity || 100;
  const triggered = liquidity < config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered
      ? `Liquidity too low: ${liquidity.toFixed(1)} (minimum: ${config.threshold})`
      : "Liquidity sufficient",
    threshold: config.threshold,
    currentValue: liquidity,
    override: triggered,
  };
}

// ============================================================================
// Conflict Rules
// ============================================================================

/**
 * Check if there are engine conflicts
 */
export function checkConflictRules(context: RuleContext): RuleResult {
  const config = ruleConfigs.conflictRules;
  
  if (!config.enabled) {
    return {
      triggered: false,
      severity: 0,
      reason: "Rule disabled",
      threshold: config.threshold,
      currentValue: 0,
      override: false,
    };
  }
  
  const conflictCount = context.snapshot?.conflictCount || 0;
  const triggered = conflictCount >= config.threshold;
  
  return {
    triggered,
    severity: triggered ? config.severity : 0,
    reason: triggered
      ? `Too many engine conflicts: ${conflictCount} (limit: ${config.threshold})`
      : "No significant conflicts",
    threshold: config.threshold,
    currentValue: conflictCount,
    override: triggered,
  };
}

// ============================================================================
// Shield Override Rule
// ============================================================================

/**
 * Check if shield is blocking execution
 */
export function checkShieldOverride(context: RuleContext): RuleResult {
  const shieldActive = context.shieldActive || false;
  
  return {
    triggered: shieldActive,
    severity: shieldActive ? 100 : 0,
    reason: shieldActive
      ? "Shield is active - all trading blocked"
      : "Shield inactive",
    threshold: 1,
    currentValue: shieldActive ? 1 : 0,
    override: shieldActive,
  };
}

// ============================================================================
// Threat Level Rule
// ============================================================================

/**
 * Check if threat level is too high
 */
export function checkThreatLevel(context: RuleContext): RuleResult {
  const threatLevel = context.threatLevel || 0;
  const threshold = 80;
  const triggered = threatLevel > threshold;
  
  return {
    triggered,
    severity: triggered ? 90 : 0,
    reason: triggered
      ? `Threat level critical: ${threatLevel.toFixed(1)} (limit: ${threshold})`
      : "Threat level acceptable",
    threshold,
    currentValue: threatLevel,
    override: triggered,
  };
}

// ============================================================================
// Position Size Rule
// ============================================================================

/**
 * Check if position size is too large relative to liquidity
 */
export function checkPositionSizeRule(context: RuleContext): RuleResult {
  const positionSize = context.position?.size || 0;
  const liquidity = context.snapshot?.liquidity || 100;
  const maxPercentOfLiquidity = 0.1; // 10% of available liquidity
  
  const liquidityUsage = positionSize / liquidity;
  const triggered = liquidityUsage > maxPercentOfLiquidity;
  
  return {
    triggered,
    severity: triggered ? 70 : 0,
    reason: triggered
      ? `Position too large: ${(liquidityUsage * 100).toFixed(1)}% of liquidity (limit: ${maxPercentOfLiquidity * 100}%)`
      : "Position size appropriate",
    threshold: maxPercentOfLiquidity,
    currentValue: liquidityUsage,
    override: triggered,
  };
}

// ============================================================================
// Price Gap Rule
// ============================================================================

/**
 * Check for sudden price gaps
 */
export function checkPriceGapRule(context: RuleContext): RuleResult {
  const priceGap = context.snapshot?.priceGap || 0;
  const threshold = 2.0; // 2% price gap
  const triggered = Math.abs(priceGap) > threshold;
  
  return {
    triggered,
    severity: triggered ? 75 : 0,
    reason: triggered
      ? `Large price gap detected: ${priceGap.toFixed(2)}% (limit: ${threshold}%)`
      : "No significant price gap",
    threshold,
    currentValue: Math.abs(priceGap),
    override: triggered,
  };
}

// ============================================================================
// Rule Management
// ============================================================================

/**
 * Get all rule configurations
 */
export function getAllRuleConfigs(): Record<string, RuleConfig> {
  return { ...ruleConfigs };
}

/**
 * Update rule configuration
 */
export function updateRuleConfig(ruleName: string, config: Partial<RuleConfig>): void {
  if (!ruleConfigs[ruleName]) {
    console.warn(`[Override Rules] Rule '${ruleName}' not found`);
    return;
  }
  
  // Only allow adjustments if rule is adjustable
  if (!ruleConfigs[ruleName].adjustable && config.threshold !== undefined) {
    console.warn(`[Override Rules] Rule '${ruleName}' is not adjustable`);
    return;
  }
  
  ruleConfigs[ruleName] = { ...ruleConfigs[ruleName], ...config };
  console.log(`[Override Rules] Updated rule '${ruleName}':`, config);
}

/**
 * Adjust rule threshold dynamically (by Shield/Threat engines)
 */
export function adjustRuleThreshold(
  ruleName: string,
  adjustment: number,
  reason: string
): void {
  const rule = ruleConfigs[ruleName];
  
  if (!rule) {
    console.warn(`[Override Rules] Rule '${ruleName}' not found`);
    return;
  }
  
  if (!rule.adjustable) {
    console.warn(`[Override Rules] Rule '${ruleName}' is not adjustable`);
    return;
  }
  
  const newThreshold = rule.threshold + adjustment;
  rule.threshold = Math.max(0, Math.min(100, newThreshold));
  
  console.log(`[Override Rules] Adjusted '${ruleName}' threshold by ${adjustment} to ${rule.threshold}: ${reason}`);
}

/**
 * Tighten all rules (increase protection)
 */
export function tightenAllRules(factor: number = 0.9): void {
  Object.entries(ruleConfigs).forEach(([name, config]) => {
    if (config.adjustable) {
      config.threshold *= factor;
      console.log(`[Override Rules] Tightened '${name}' threshold to ${config.threshold}`);
    }
  });
}

/**
 * Loosen all rules (reduce protection)
 */
export function loosenAllRules(factor: number = 1.1): void {
  Object.entries(ruleConfigs).forEach(([name, config]) => {
    if (config.adjustable) {
      config.threshold *= factor;
      console.log(`[Override Rules] Loosened '${name}' threshold to ${config.threshold}`);
    }
  });
}

/**
 * Reset all rules to defaults
 */
export function resetAllRules(): void {
  ruleConfigs = { ...DEFAULT_RULE_CONFIGS };
  console.log('[Override Rules] All rules reset to defaults');
}

/**
 * Enable/disable rule
 */
export function setRuleEnabled(ruleName: string, enabled: boolean): void {
  if (ruleConfigs[ruleName]) {
    ruleConfigs[ruleName].enabled = enabled;
    console.log(`[Override Rules] Rule '${ruleName}' ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/**
 * Run all rules
 */
export function runAllRules(context: RuleContext): RuleResult[] {
  return [
    checkShieldOverride(context),
    checkThreatLevel(context),
    checkSpreadLimit(context),
    checkVolatilityLimit(context),
    checkSlippageLimit(context),
    checkMomentumDrop(context),
    checkReversalSignal(context),
    checkLiquidityThreshold(context),
    checkConflictRules(context),
    checkPositionSizeRule(context),
    checkPriceGapRule(context),
  ];
}

/**
 * Get triggered rules
 */
export function getTriggeredRules(context: RuleContext): RuleResult[] {
  return runAllRules(context).filter(r => r.triggered);
}

/**
 * Get highest severity rule
 */
export function getHighestSeverityRule(context: RuleContext): RuleResult | null {
  const triggered = getTriggeredRules(context);
  
  if (triggered.length === 0) return null;
  
  return triggered.reduce((max, curr) => 
    curr.severity > max.severity ? curr : max
  );
}

/**
 * Should override execution?
 */
export function shouldOverrideExecution(context: RuleContext): boolean {
  const triggered = getTriggeredRules(context);
  return triggered.some(r => r.override);
}

/**
 * Get override summary
 */
export function getOverrideSummary(context: RuleContext): {
  shouldOverride: boolean;
  triggeredCount: number;
  highestSeverity: number;
  criticalRules: string[];
  allTriggered: RuleResult[];
} {
  const triggered = getTriggeredRules(context);
  const shouldOverride = shouldOverrideExecution(context);
  const highestSeverity = triggered.length > 0 
    ? Math.max(...triggered.map(r => r.severity))
    : 0;
  
  const criticalRules = triggered
    .filter(r => r.severity >= 70)
    .map(r => r.reason);
  
  return {
    shouldOverride,
    triggeredCount: triggered.length,
    highestSeverity,
    criticalRules,
    allTriggered: triggered,
  };
}

/**
 * Export rule functions
 */
export const OverrideRules = {
  // Individual rules
  checkSpreadLimit,
  checkVolatilityLimit,
  checkSlippageLimit,
  checkMomentumDrop,
  checkReversalSignal,
  checkLiquidityThreshold,
  checkConflictRules,
  checkShieldOverride,
  checkThreatLevel,
  checkPositionSizeRule,
  checkPriceGapRule,
  
  // Rule management
  getAllConfigs: getAllRuleConfigs,
  updateConfig: updateRuleConfig,
  adjustThreshold: adjustRuleThreshold,
  tightenAll: tightenAllRules,
  loosenAll: loosenAllRules,
  resetAll: resetAllRules,
  setEnabled: setRuleEnabled,
  
  // Execution
  runAll: runAllRules,
  getTriggered: getTriggeredRules,
  getHighestSeverity: getHighestSeverityRule,
  shouldOverride: shouldOverrideExecution,
  getSummary: getOverrideSummary,
  
  // Constants
  DEFAULT_CONFIGS: DEFAULT_RULE_CONFIGS,
};

export default OverrideRules;
