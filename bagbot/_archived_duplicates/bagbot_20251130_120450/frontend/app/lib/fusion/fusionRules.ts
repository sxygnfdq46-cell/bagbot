/**
 * Deep Execution Fusion Layer (DEFL) - Fusion Rules
 * 
 * Rules that govern how EXO and X-REACTOR decisions are harmonized.
 * Each rule can block execution, force cancel, or suggest adjustments.
 */

import type {
  FusionContext,
  FusionRuleResult,
  HarmonyMetrics,
  FusionCommand,
  FusionConfig,
} from './types';

/**
 * Rule: Check harmony between EXO and X-REACTOR
 * Fundamental alignment check
 */
export function rule_harmony_check(
  harmony: HarmonyMetrics,
  config: FusionConfig
): FusionRuleResult {
  const { overallHarmony, hasConflict, conflictSeverity } = harmony;
  
  // Pass if harmony is sufficient
  const passed = overallHarmony >= config.minHarmonyForExecute && !hasConflict;
  
  // Block if harmony too low
  const blockExecution = overallHarmony < config.minHarmonyForScale;
  
  // Force cancel on critical conflicts
  const forceCancel = 
    hasConflict && 
    conflictSeverity === "CRITICAL" && 
    config.emergencyAbortOnConflict;
  
  // Suggest command based on harmony level
  let suggestedCommand: FusionCommand | undefined;
  if (overallHarmony >= config.minHarmonyForExecute) {
    suggestedCommand = "EXECUTE";
  } else if (overallHarmony >= config.minHarmonyForScale) {
    suggestedCommand = "SCALE";
  } else {
    suggestedCommand = "CANCEL";
  }
  
  const harmonyAdjustment = 0; // No adjustment - this is the base check
  
  return {
    ruleName: "Harmony Check Rule",
    passed,
    blockExecution,
    forceCancel,
    suggestedCommand,
    harmonyAdjustment,
    reason: passed
      ? `Harmony excellent: ${overallHarmony.toFixed(1)}%`
      : `Harmony insufficient: ${overallHarmony.toFixed(1)}% (min: ${config.minHarmonyForExecute}%)`,
    priority: 10, // HIGHEST PRIORITY
  };
}

/**
 * Rule: Resolve conflicts between EXO and X-REACTOR
 * Determines which layer takes precedence
 */
export function rule_conflict_resolution(
  context: FusionContext,
  harmony: HarmonyMetrics
): FusionRuleResult {
  const { exoDecision, reactorDecision } = context;
  const { hasConflict, conflictType, conflictSeverity } = harmony;
  
  if (!hasConflict) {
    return {
      ruleName: "Conflict Resolution Rule",
      passed: true,
      blockExecution: false,
      forceCancel: false,
      harmonyAdjustment: 10, // Bonus for no conflict
      reason: "No conflict detected",
      priority: 9,
    };
  }
  
  // X-REACTOR has veto power on safety issues
  const reactorVeto = 
    reactorDecision.command === "EMERGENCY_ABORT" ||
    (reactorDecision.command === "CANCEL" && reactorDecision.confidence >= 80);
  
  if (reactorVeto) {
    return {
      ruleName: "Conflict Resolution Rule",
      passed: false,
      blockExecution: true,
      forceCancel: true,
      suggestedCommand: "CANCEL",
      harmonyAdjustment: -30,
      reason: `X-REACTOR veto: ${reactorDecision.reason[0] || "Safety abort"}`,
      priority: 9,
    };
  }
  
  // EXO has authority on strategic decisions
  const exoOverride = 
    exoDecision.command === "CANCEL" && 
    exoDecision.confidence >= 85;
  
  if (exoOverride) {
    return {
      ruleName: "Conflict Resolution Rule",
      passed: false,
      blockExecution: true,
      forceCancel: false,
      suggestedCommand: "CANCEL",
      harmonyAdjustment: -20,
      reason: `EXO override: Strategic cancellation (${exoDecision.confidence}% confidence)`,
      priority: 9,
    };
  }
  
  // Moderate conflict - scale down
  if (conflictSeverity === "MEDIUM" || conflictSeverity === "LOW") {
    return {
      ruleName: "Conflict Resolution Rule",
      passed: false,
      blockExecution: false,
      forceCancel: false,
      suggestedCommand: "SCALE",
      harmonyAdjustment: -15,
      reason: `${conflictSeverity} conflict detected: ${conflictType} - scaling recommended`,
      priority: 9,
    };
  }
  
  // High/Critical conflict - cancel
  return {
    ruleName: "Conflict Resolution Rule",
    passed: false,
    blockExecution: true,
    forceCancel: true,
    suggestedCommand: "CANCEL",
    harmonyAdjustment: -40,
    reason: `${conflictSeverity} conflict: ${conflictType} - cannot reconcile`,
    priority: 9,
  };
}

/**
 * Rule: Balance latency considerations
 * Ensures timing harmony between layers
 */
export function rule_latency_balance(
  context: FusionContext,
  config: FusionConfig
): FusionRuleResult {
  const { reactorDecision } = context;
  const { delayMs, latencyMs = 0 } = reactorDecision;
  
  // Check if delay is reasonable
  const delayAcceptable = delayMs <= config.maxDelayMs;
  const latencyGood = latencyMs < 100; // <100ms is good
  
  const passed = delayAcceptable && (delayMs === 0 || latencyGood);
  
  // Block if delay excessive
  const blockExecution = delayMs > config.maxDelayMs * 1.5;
  
  // Force cancel if latency critical
  const forceCancel = latencyMs > 200 && delayMs > config.maxDelayMs;
  
  let suggestedCommand: FusionCommand | undefined;
  if (delayMs > 0 && delayMs <= config.maxDelayMs) {
    suggestedCommand = "DELAY";
  } else if (blockExecution) {
    suggestedCommand = "CANCEL";
  }
  
  // Harmony adjustment based on latency
  let harmonyAdjustment = 0;
  if (latencyGood && delayMs === 0) {
    harmonyAdjustment = 5; // Perfect timing
  } else if (latencyMs > 100) {
    harmonyAdjustment = -10; // Poor latency
  }
  
  return {
    ruleName: "Latency Balance Rule",
    passed,
    blockExecution,
    forceCancel,
    suggestedCommand,
    harmonyAdjustment,
    reason: passed
      ? `Timing optimal (latency: ${latencyMs.toFixed(1)}ms, delay: ${delayMs}ms)`
      : `Timing issues (latency: ${latencyMs.toFixed(1)}ms, delay: ${delayMs}ms)`,
    priority: 7,
  };
}

/**
 * Rule: Equalize pressure recommendations
 * Ensures size recommendations are balanced
 */
export function rule_pressure_equalization(
  context: FusionContext,
  config: FusionConfig
): FusionRuleResult {
  const { exoDecision, reactorDecision } = context;
  const { targetSize: exoSize } = exoDecision;
  const { finalSize: reactorSize, pressureScore = 50 } = reactorDecision;
  
  // Calculate size discrepancy
  const maxSize = Math.max(exoSize, reactorSize);
  const minSize = Math.min(exoSize, reactorSize);
  const discrepancy = maxSize > 0 ? (maxSize - minSize) / maxSize : 0;
  
  // Check if discrepancy acceptable
  const passed = discrepancy <= config.maxSizeDiscrepancy;
  
  // Block if extreme discrepancy
  const blockExecution = discrepancy > config.maxSizeDiscrepancy * 2;
  
  // Force cancel if pressure very unfavorable
  const forceCancel = pressureScore < 30 && discrepancy > config.maxSizeDiscrepancy;
  
  // Suggest scaling if moderate discrepancy
  let suggestedCommand: FusionCommand | undefined;
  if (discrepancy > config.maxSizeDiscrepancy && !blockExecution) {
    suggestedCommand = "SCALE";
  }
  
  // Harmony adjustment based on size alignment
  let harmonyAdjustment = 0;
  if (discrepancy < 0.05) {
    harmonyAdjustment = 10; // Excellent alignment
  } else if (discrepancy > config.maxSizeDiscrepancy) {
    harmonyAdjustment = -20; // Poor alignment
  }
  
  return {
    ruleName: "Pressure Equalization Rule",
    passed,
    blockExecution,
    forceCancel,
    suggestedCommand,
    harmonyAdjustment,
    reason: passed
      ? `Size recommendations aligned (${(discrepancy * 100).toFixed(1)}% difference)`
      : `Size discrepancy too high (${(discrepancy * 100).toFixed(1)}% vs max ${config.maxSizeDiscrepancy * 100}%)`,
    priority: 6,
  };
}

/**
 * Rule: Emergency fusion abort
 * Catches critical conditions that require immediate abort
 */
export function rule_fusion_emergency(
  context: FusionContext,
  harmony: HarmonyMetrics,
  config: FusionConfig
): FusionRuleResult {
  const { exoDecision, reactorDecision } = context;
  
  // Emergency conditions
  const reactorEmergency = reactorDecision.command === "EMERGENCY_ABORT";
  const criticalConflict = 
    harmony.hasConflict && 
    harmony.conflictSeverity === "CRITICAL";
  const extremeLowHarmony = harmony.overallHarmony < 30;
  const bothLayersCancel = 
    exoDecision.command === "CANCEL" && 
    reactorDecision.command === "CANCEL";
  const extremeConfidenceDrop = 
    Math.abs(exoDecision.confidence - reactorDecision.confidence) > config.confidenceDiscrepancyMax * 1.5;
  
  const emergencyDetected = 
    reactorEmergency || 
    criticalConflict || 
    extremeLowHarmony || 
    (bothLayersCancel && config.emergencyAbortOnConflict) ||
    extremeConfidenceDrop;
  
  const passed = !emergencyDetected;
  
  let reason = "No emergency conditions";
  if (reactorEmergency) reason = "🚨 X-REACTOR EMERGENCY ABORT";
  else if (criticalConflict) reason = "🚨 CRITICAL CONFLICT - Layers cannot agree";
  else if (extremeLowHarmony) reason = `🚨 EXTREME LOW HARMONY (${harmony.overallHarmony.toFixed(1)}%)`;
  else if (bothLayersCancel) reason = "🚨 Both layers recommend CANCEL";
  else if (extremeConfidenceDrop) reason = "🚨 Extreme confidence discrepancy detected";
  
  return {
    ruleName: "Fusion Emergency Rule",
    passed,
    blockExecution: emergencyDetected,
    forceCancel: emergencyDetected,
    suggestedCommand: emergencyDetected ? "EMERGENCY_ABORT" : undefined,
    harmonyAdjustment: emergencyDetected ? -50 : 0,
    reason,
    priority: 10, // HIGHEST PRIORITY (ties with harmony check)
  };
}

/**
 * Apply all fusion rules
 */
export function applyAllFusionRules(
  context: FusionContext,
  harmony: HarmonyMetrics,
  config: FusionConfig
): FusionRuleResult[] {
  const rules = [
    rule_harmony_check(harmony, config),
    rule_conflict_resolution(context, harmony),
    rule_latency_balance(context, config),
    rule_pressure_equalization(context, config),
    rule_fusion_emergency(context, harmony, config),
  ];
  
  // Sort by priority (highest first)
  return rules.sort((a, b) => b.priority - a.priority);
}

/**
 * Aggregate rule results into fusion decision guidance
 */
export function aggregateFusionRules(rules: FusionRuleResult[]): {
  shouldExecute: boolean;
  shouldDelay: boolean;
  shouldCancel: boolean;
  shouldScale: boolean;
  emergencyAbort: boolean;
  suggestedCommand: FusionCommand;
  totalHarmonyAdjustment: number;
  blockingRules: FusionRuleResult[];
  passingRules: FusionRuleResult[];
  blockingReasons: string[];
} {
  const blockingRules = rules.filter(r => r.blockExecution);
  const forceCancelRules = rules.filter(r => r.forceCancel);
  const passingRules = rules.filter(r => r.passed);
  
  const emergencyAbort = rules.some(r => 
    r.suggestedCommand === "EMERGENCY_ABORT" && r.blockExecution
  );
  
  const shouldCancel = 
    forceCancelRules.length > 0 || 
    blockingRules.length >= 2 || // 2+ blocking rules = cancel
    emergencyAbort;
  
  const shouldScale = 
    !shouldCancel && 
    rules.some(r => r.suggestedCommand === "SCALE" && !r.blockExecution);
  
  const shouldDelay = 
    !shouldCancel && 
    !shouldScale && 
    rules.some(r => r.suggestedCommand === "DELAY" && !r.blockExecution);
  
  const shouldExecute = 
    !shouldCancel && 
    !shouldScale && 
    !shouldDelay && 
    passingRules.length >= 4; // At least 4/5 rules pass
  
  // Determine suggested command
  let suggestedCommand: FusionCommand;
  if (emergencyAbort) {
    suggestedCommand = "EMERGENCY_ABORT";
  } else if (shouldCancel) {
    suggestedCommand = "CANCEL";
  } else if (shouldScale) {
    suggestedCommand = "SCALE";
  } else if (shouldDelay) {
    suggestedCommand = "DELAY";
  } else if (shouldExecute) {
    suggestedCommand = "EXECUTE";
  } else {
    suggestedCommand = "CANCEL"; // Conservative default
  }
  
  // Calculate total harmony adjustment
  const totalHarmonyAdjustment = rules.reduce(
    (sum, r) => sum + r.harmonyAdjustment, 
    0
  );
  
  const blockingReasons = blockingRules.map(r => r.reason);
  
  return {
    shouldExecute,
    shouldDelay,
    shouldCancel,
    shouldScale,
    emergencyAbort,
    suggestedCommand,
    totalHarmonyAdjustment,
    blockingRules,
    passingRules,
    blockingReasons,
  };
}
