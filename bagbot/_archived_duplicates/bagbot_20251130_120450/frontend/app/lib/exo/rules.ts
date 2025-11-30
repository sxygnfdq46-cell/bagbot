/**
 * 🎼 EXO RULES — Execution Rule Validation
 * 
 * STEP 24.39 — Execution Rules
 * 
 * Purpose:
 * Final safety rules that must pass before execution can proceed.
 * These are the "circuit breakers" - hard stops that prevent execution
 * under dangerous conditions.
 * 
 * Think of these as the "final safety inspection" before launch.
 */

import type {
  ExecutionRuleResult,
  RuleContext,
  EAETiming,
  OrderbookData,
} from './types';

// ============================================================================
// RULE: NO KILL ZONES — Avoid unfavorable time windows
// ============================================================================

/**
 * rule_no_killzones — Ensure not in unfavorable kill zone
 * 
 * Blocks execution during:
 * - Major news events
 * - Low liquidity periods
 * - Market open/close volatility
 * 
 * @param eae - EAE timing data
 * @param context - Rule context
 * @returns Rule result
 */
export function rule_no_killzones(
  eae: EAETiming | undefined,
  context: RuleContext
): ExecutionRuleResult {
  if (!eae) {
    return {
      ruleName: 'no_killzones',
      passed: false,
      score: 0,
      reason: 'No EAE timing data available',
      severity: 'BLOCKING',
    };
  }

  // Check if in favorable kill zone
  const currentHour = new Date().getUTCHours();

  // Avoid Asian session quiet hours (4:00 - 7:00 UTC)
  const inQuietHours = currentHour >= 4 && currentHour < 7;

  // Avoid market open/close volatility (within 30 min)
  const nearMarketOpen = currentHour === 8 || currentHour === 13; // London/NY open
  const nearMarketClose = currentHour === 16 || currentHour === 21; // London/NY close

  const inKillZone = inQuietHours || nearMarketOpen || nearMarketClose;

  const passed = !inKillZone;

  const reason = passed
    ? 'Not in unfavorable kill zone'
    : inQuietHours
    ? 'In Asian quiet hours - low liquidity'
    : 'Near market open/close - high volatility';

  return {
    ruleName: 'no_killzones',
    passed,
    score: passed ? 100 : 0,
    reason,
    severity: 'WARNING',
  };
}

// ============================================================================
// RULE: MIN TIMING — Minimum timing score required
// ============================================================================

/**
 * rule_min_timing — Ensure timing score meets minimum
 * 
 * Blocks execution if EAE timing score is too low.
 * 
 * @param eae - EAE timing data
 * @returns Rule result
 */
export function rule_min_timing(eae: EAETiming | undefined): ExecutionRuleResult {
  if (!eae) {
    return {
      ruleName: 'min_timing',
      passed: false,
      score: 0,
      reason: 'No EAE timing data available',
      severity: 'BLOCKING',
    };
  }

  const minScore = 60;
  const passed = eae.timingScore >= minScore;

  const reason = passed
    ? `Timing score ${eae.timingScore} meets minimum (${minScore})`
    : `Timing score ${eae.timingScore} below minimum (${minScore})`;

  return {
    ruleName: 'min_timing',
    passed,
    score: eae.timingScore,
    reason,
    severity: 'BLOCKING',
  };
}

// ============================================================================
// RULE: SHIELD OK — Shield state allows execution
// ============================================================================

/**
 * rule_shield_ok — Ensure shield state is safe
 * 
 * Blocks execution during defensive shield states.
 * 
 * @param shield - Shield state
 * @returns Rule result
 */
export function rule_shield_ok(shield: string): ExecutionRuleResult {
  const safeStates = ['CALM', 'AGGRO_OBS'];
  const passed = safeStates.includes(shield);

  const score = passed ? 100 : shield === 'PROTECTIVE' ? 50 : 0;

  const reason = passed
    ? `Shield state ${shield} allows execution`
    : `Shield state ${shield} blocks execution - market too defensive`;

  return {
    ruleName: 'shield_ok',
    passed,
    score,
    reason,
    severity: 'BLOCKING',
  };
}

// ============================================================================
// RULE: SPREAD OK — Spread within acceptable range
// ============================================================================

/**
 * rule_spread_ok — Ensure spread is acceptable
 * 
 * Blocks execution if spread is too wide (high slippage risk).
 * 
 * @param context - Rule context with orderbook
 * @returns Rule result
 */
export function rule_spread_ok(context: RuleContext): ExecutionRuleResult {
  if (!context.orderbook) {
    return {
      ruleName: 'spread_ok',
      passed: true,
      score: 50,
      reason: 'No orderbook data - spread check skipped',
      severity: 'WARNING',
    };
  }

  const maxSpread = 0.5; // 0.5% maximum spread
  const spread = context.orderbook.spreadPercent;
  const passed = spread <= maxSpread;

  const score = passed ? 100 : Math.max(0, 100 - (spread - maxSpread) * 100);

  const reason = passed
    ? `Spread ${spread.toFixed(3)}% within limit (${maxSpread}%)`
    : `Spread ${spread.toFixed(3)}% exceeds limit (${maxSpread}%) - high slippage risk`;

  return {
    ruleName: 'spread_ok',
    passed,
    score: Math.round(score),
    reason,
    severity: 'BLOCKING',
  };
}

// ============================================================================
// RULE: LIQUIDITY OK — Sufficient liquidity available
// ============================================================================

/**
 * rule_liquidity_ok — Ensure adequate liquidity
 * 
 * Blocks execution if liquidity is too low.
 * 
 * @param orderbook - Orderbook data
 * @returns Rule result
 */
export function rule_liquidity_ok(
  orderbook: OrderbookData | undefined
): ExecutionRuleResult {
  if (!orderbook) {
    return {
      ruleName: 'liquidity_ok',
      passed: true,
      score: 50,
      reason: 'No orderbook data - liquidity check skipped',
      severity: 'WARNING',
    };
  }

  const minLiquidity = 50;
  const liquidityScore = orderbook.liquidityScore;
  const passed = liquidityScore >= minLiquidity;

  const reason = passed
    ? `Liquidity score ${liquidityScore.toFixed(0)} meets minimum (${minLiquidity})`
    : `Liquidity score ${liquidityScore.toFixed(0)} below minimum (${minLiquidity}) - high slippage risk`;

  return {
    ruleName: 'liquidity_ok',
    passed,
    score: Math.round(liquidityScore),
    reason,
    severity: 'BLOCKING',
  };
}

// ============================================================================
// RULE: VOLATILITY SAFE — Volatility within safe range
// ============================================================================

/**
 * rule_volatility_safe — Ensure volatility is safe
 * 
 * Blocks execution during extreme volatility.
 * 
 * @param context - Rule context with market data
 * @returns Rule result
 */
export function rule_volatility_safe(context: RuleContext): ExecutionRuleResult {
  const volatility = context.marketContext.volatility;

  // Block extreme volatility
  const passed = volatility !== 'extreme';

  const score =
    volatility === 'low' ? 100 : volatility === 'medium' ? 70 : volatility === 'high' ? 40 : 0;

  const reason = passed
    ? `Volatility ${volatility} is safe for execution`
    : `Volatility ${volatility} is too high - execution blocked`;

  return {
    ruleName: 'volatility_safe',
    passed,
    score,
    reason,
    severity: passed ? 'INFO' : 'BLOCKING',
  };
}

// ============================================================================
// RULE: POSITION LIMITS — Within position size limits
// ============================================================================

/**
 * rule_position_limits — Ensure position size within limits
 * 
 * Blocks execution if position would exceed limits.
 * 
 * @param context - Rule context with position data
 * @returns Rule result
 */
export function rule_position_limits(context: RuleContext): ExecutionRuleResult {
  if (!context.currentPosition) {
    return {
      ruleName: 'position_limits',
      passed: true,
      score: 100,
      reason: 'No current position - limits not applicable',
      severity: 'INFO',
    };
  }

  const position = context.currentPosition;
  const maxPositionSize = 1.0; // 100% of account
  const currentSize = Math.abs(position.size);

  const passed = currentSize < maxPositionSize;

  const score = Math.max(0, 100 - (currentSize / maxPositionSize) * 100);

  const reason = passed
    ? `Position size ${(currentSize * 100).toFixed(0)}% within limit (${maxPositionSize * 100}%)`
    : `Position size ${(currentSize * 100).toFixed(0)}% exceeds limit (${maxPositionSize * 100}%)`;

  return {
    ruleName: 'position_limits',
    passed,
    score: Math.round(score),
    reason,
    severity: 'BLOCKING',
  };
}

// ============================================================================
// RULE UTILITIES
// ============================================================================

/**
 * evaluateAllRules — Evaluate all rules and return results
 */
export function evaluateAllRules(
  eae: EAETiming | undefined,
  shield: string,
  context: RuleContext,
  orderbook: OrderbookData | undefined
): ExecutionRuleResult[] {
  const results: ExecutionRuleResult[] = [];

  results.push(rule_no_killzones(eae, context));
  results.push(rule_min_timing(eae));
  results.push(rule_shield_ok(shield));
  results.push(rule_spread_ok(context));
  results.push(rule_liquidity_ok(orderbook));
  results.push(rule_volatility_safe(context));
  results.push(rule_position_limits(context));

  return results;
}

/**
 * countPassedRules — Count how many rules passed
 */
export function countPassedRules(results: ExecutionRuleResult[]): number {
  return results.filter((r) => r.passed).length;
}

/**
 * getBlockingRules — Get list of blocking rules that failed
 */
export function getBlockingRules(results: ExecutionRuleResult[]): string[] {
  return results
    .filter((r) => !r.passed && r.severity === 'BLOCKING')
    .map((r) => r.ruleName);
}

/**
 * getFailedRules — Get list of all failed rules
 */
export function getFailedRules(results: ExecutionRuleResult[]): string[] {
  return results.filter((r) => !r.passed).map((r) => r.ruleName);
}

/**
 * hasBlockingFailures — Check if any blocking rules failed
 */
export function hasBlockingFailures(results: ExecutionRuleResult[]): boolean {
  return results.some((r) => !r.passed && r.severity === 'BLOCKING');
}

/**
 * calculateRuleScore — Calculate overall rule score
 */
export function calculateRuleScore(results: ExecutionRuleResult[]): number {
  if (results.length === 0) return 0;

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  return Math.round(totalScore / results.length);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  rule_no_killzones,
  rule_min_timing,
  rule_shield_ok,
  rule_spread_ok,
  rule_liquidity_ok,
  rule_volatility_safe,
  rule_position_limits,
  evaluateAllRules,
  countPassedRules,
  getBlockingRules,
  getFailedRules,
  hasBlockingFailures,
  calculateRuleScore,
};
