/**
 * X-REACTOR - Reactor Rules
 * 
 * Decision rules that determine final execution command.
 * Each rule can block execution, suggest delays, or scale down position size.
 */

import type {
  ReactorRuleResult,
  MicroCheckResult,
  ReactorContext,
} from './types';

/**
 * Rule: Spread must be tight enough for execution
 */
export function rule_spread_tight(
  spreadCheck: MicroCheckResult,
  confidence: number
): ReactorRuleResult {
  const { passed, value, threshold, score } = spreadCheck;
  
  // Critical if spread > threshold
  const blockExecution = !passed && value > threshold * 1.5;
  
  // Suggest delay if spread slightly high
  let delayMs = 0;
  if (!passed) {
    delayMs = Math.min(200, (value - threshold) * 20); // Scale with spread
  }
  
  // Scale down if spread moderately high
  let scaleDown = 1.0;
  if (!passed && !blockExecution) {
    scaleDown = Math.max(0.5, threshold / value); // Reduce proportionally
  }
  
  return {
    ruleName: "Spread Tightness Rule",
    passed,
    blockExecution,
    delayMs: Math.round(delayMs),
    scaleDown,
    reason: passed
      ? `Spread acceptable: ${value.toFixed(2)} bps`
      : `Spread too wide: ${value.toFixed(2)} bps (max: ${threshold})`,
    priority: 9, // High priority
  };
}

/**
 * Rule: Latency must be within acceptable range
 */
export function rule_latency_safe(
  latencyCheck: MicroCheckResult,
  confidence: number
): ReactorRuleResult {
  const { passed, value, threshold, score } = latencyCheck;
  
  // Block if latency extremely high
  const blockExecution = !passed && value > threshold * 1.5;
  
  // Suggest delay to wait for better latency
  let delayMs = 0;
  if (!passed) {
    delayMs = Math.min(300, value - threshold); // Wait longer for high latency
  }
  
  // No scaling for latency - either execute or don't
  const scaleDown = 1.0;
  
  return {
    ruleName: "Latency Safety Rule",
    passed,
    blockExecution,
    delayMs: Math.round(delayMs),
    scaleDown,
    reason: passed
      ? `Latency acceptable: ${value.toFixed(1)}ms`
      : `Latency too high: ${value.toFixed(1)}ms (max: ${threshold}ms)`,
    priority: 8, // High priority
  };
}

/**
 * Rule: Orderbook pressure must favor trade direction
 */
export function rule_pressure_favorable(
  pressureCheck: MicroCheckResult,
  confidence: number
): ReactorRuleResult {
  const { passed, value, threshold, score } = pressureCheck;
  
  // Block if pressure very unfavorable
  const blockExecution = !passed && value < threshold * 0.5;
  
  // Delay if pressure slightly unfavorable
  let delayMs = 0;
  if (!passed) {
    delayMs = Math.min(250, (threshold - value) * 5);
  }
  
  // Scale down based on pressure deficiency
  let scaleDown = 1.0;
  if (!passed && !blockExecution) {
    scaleDown = Math.max(0.3, value / threshold);
  }
  
  return {
    ruleName: "Orderbook Pressure Rule",
    passed,
    blockExecution,
    delayMs: Math.round(delayMs),
    scaleDown,
    reason: passed
      ? `Pressure favorable: ${value.toFixed(1)}/100`
      : `Pressure unfavorable: ${value.toFixed(1)}/100 (min: ${threshold})`,
    priority: 7,
  };
}

/**
 * Rule: Volatility must be within safe range
 */
export function rule_volatility_safe(
  volatilityCheck: MicroCheckResult,
  confidence: number
): ReactorRuleResult {
  const { passed, value, threshold, score } = volatilityCheck;
  
  // Block if volatility extreme
  const blockExecution = !passed && value > threshold * 1.3;
  
  // Delay to let volatility settle
  let delayMs = 0;
  if (!passed) {
    delayMs = Math.min(300, (value - threshold) * 3);
  }
  
  // Scale down in high volatility
  let scaleDown = 1.0;
  if (!passed && !blockExecution) {
    scaleDown = Math.max(0.4, threshold / value);
  }
  
  return {
    ruleName: "Volatility Safety Rule",
    passed,
    blockExecution,
    delayMs: Math.round(delayMs),
    scaleDown,
    reason: passed
      ? `Volatility safe: ${value.toFixed(1)}/100`
      : `Volatility too high: ${value.toFixed(1)}/100 (max: ${threshold})`,
    priority: 6,
  };
}

/**
 * Rule: Reversal risk must be acceptable
 */
export function rule_no_reversal(
  reversalCheck: MicroCheckResult,
  confidence: number
): ReactorRuleResult {
  const { passed, value, threshold, score } = reversalCheck;
  
  // Block if reversal risk very high
  const blockExecution = !passed && value > threshold * 1.2;
  
  // Delay to reassess momentum
  let delayMs = 0;
  if (!passed) {
    delayMs = Math.min(200, (value - threshold) * 4);
  }
  
  // Scale down if reversal risk elevated
  let scaleDown = 1.0;
  if (!passed && !blockExecution) {
    scaleDown = Math.max(0.5, threshold / value);
  }
  
  return {
    ruleName: "No Reversal Rule",
    passed,
    blockExecution,
    delayMs: Math.round(delayMs),
    scaleDown,
    reason: passed
      ? `Reversal risk low: ${value.toFixed(1)}/100`
      : `Reversal risk high: ${value.toFixed(1)}/100 (max: ${threshold})`,
    priority: 7,
  };
}

/**
 * Emergency stop rule - critical safety check
 * Combines multiple factors to determine if execution must abort
 */
export function emergency_stop_rule(
  checks: MicroCheckResult[],
  exoConfidence: number,
  context: ReactorContext
): ReactorRuleResult {
  const criticalChecks = checks.filter(c => c.severity === "CRITICAL");
  const criticalCount = criticalChecks.length;
  
  // Emergency conditions
  const tooManyCritical = criticalCount >= 3; // 3+ critical failures
  const allFailed = checks.every(c => !c.passed); // All checks failed
  const lowConfidence = exoConfidence < 30; // Very low confidence
  const extremeSpread = checks.find(c => c.checkName.includes("Spread") && c.value > c.threshold * 2);
  
  const blockExecution = tooManyCritical || allFailed || (lowConfidence && criticalCount >= 2) || !!extremeSpread;
  
  let reason = "Conditions acceptable";
  if (tooManyCritical) reason = `EMERGENCY: ${criticalCount} critical failures detected`;
  else if (allFailed) reason = "EMERGENCY: All checks failed";
  else if (lowConfidence && criticalCount >= 2) reason = `EMERGENCY: Low confidence (${exoConfidence}) + ${criticalCount} critical failures`;
  else if (extremeSpread) reason = `EMERGENCY: Extreme spread detected (${extremeSpread.value.toFixed(2)} bps)`;
  
  return {
    ruleName: "Emergency Stop Rule",
    passed: !blockExecution,
    blockExecution,
    delayMs: 0, // No delay on emergency - abort immediately
    scaleDown: 0, // No scaling - abort completely
    reason,
    priority: 10, // HIGHEST PRIORITY
  };
}

/**
 * Apply all reactor rules and aggregate results
 */
export function applyAllRules(
  checks: MicroCheckResult[],
  exoConfidence: number,
  context: ReactorContext
): ReactorRuleResult[] {
  const spreadCheck = checks.find(c => c.checkName.includes("Spread"));
  const latencyCheck = checks.find(c => c.checkName.includes("Latency"));
  const pressureCheck = checks.find(c => c.checkName.includes("Pressure"));
  const volatilityCheck = checks.find(c => c.checkName.includes("Volatility"));
  const reversalCheck = checks.find(c => c.checkName.includes("Reversal"));
  
  // Defensive defaults
  const defaultCheck: MicroCheckResult = {
    checkName: "default",
    passed: true,
    score: 50,
    value: 0,
    threshold: 0,
    message: "Not available",
    severity: "INFO",
  };
  
  const rules = [
    rule_spread_tight(spreadCheck || defaultCheck, exoConfidence),
    rule_latency_safe(latencyCheck || defaultCheck, exoConfidence),
    rule_pressure_favorable(pressureCheck || defaultCheck, exoConfidence),
    rule_volatility_safe(volatilityCheck || defaultCheck, exoConfidence),
    rule_no_reversal(reversalCheck || defaultCheck, exoConfidence),
    emergency_stop_rule(checks, exoConfidence, context),
  ];
  
  // Sort by priority (highest first)
  return rules.sort((a, b) => b.priority - a.priority);
}

/**
 * Aggregate rule results into execution decision
 */
export function aggregateRuleDecision(rules: ReactorRuleResult[]): {
  shouldExecute: boolean;
  shouldDelay: boolean;
  shouldCancel: boolean;
  shouldScale: boolean;
  emergencyAbort: boolean;
  maxDelayMs: number;
  minScaleDown: number;
  blockingReasons: string[];
} {
  const blockingRules = rules.filter(r => r.blockExecution);
  const emergencyRule = rules.find(r => r.ruleName.includes("Emergency"));
  const emergencyAbort = emergencyRule?.blockExecution || false;
  
  const shouldCancel = blockingRules.length > 0;
  const shouldDelay = rules.some(r => r.delayMs > 0 && !r.blockExecution);
  const shouldScale = rules.some(r => r.scaleDown < 1.0 && !r.blockExecution);
  const shouldExecute = !shouldCancel && rules.filter(r => r.passed).length >= 4; // At least 4 rules pass
  
  const maxDelayMs = Math.max(0, ...rules.map(r => r.delayMs));
  const minScaleDown = Math.min(1.0, ...rules.filter(r => r.scaleDown < 1.0).map(r => r.scaleDown));
  
  const blockingReasons = blockingRules.map(r => r.reason);
  
  return {
    shouldExecute,
    shouldDelay,
    shouldCancel,
    shouldScale,
    emergencyAbort,
    maxDelayMs,
    minScaleDown: isFinite(minScaleDown) ? minScaleDown : 1.0,
    blockingReasons,
  };
}
