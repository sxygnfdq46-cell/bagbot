/**
 * X-REACTOR (Execution Reactor Engine)
 * 
 * Final micro-second decision layer before order execution.
 * Performs real-time validation of spread, latency, orderbook pressure.
 * Makes split-second go/no-go decisions with emergency abort capability.
 * 
 * Performance Target: <10ms execution time
 * 
 * Architecture:
 * EXO Decision → X-REACTOR → Final Execution Command
 */

import type {
  ReactorDecision,
  ReactorContext,
  ReactorConfig,
  ReactorMetrics,
  MicroCheckResult,
  ReactorRuleResult,
  ReactorCommand,
  OrderType,
  DEFAULT_REACTOR_CONFIG,
} from './types';

import {
  runAllMonitors,
  aggregateMonitorScore,
} from './runtimeMonitors';

import {
  applyAllRules,
  aggregateRuleDecision,
} from './reactorRules';

import { DEFAULT_REACTOR_CONFIG as defaultConfig } from './types';

/**
 * X-REACTOR - Execution Reactor Engine
 * 
 * Singleton class that performs final pre-execution validation.
 */
export class XReactor {
  private context: ReactorContext | null = null;
  private config: ReactorConfig;
  private metrics: ReactorMetrics;
  private lastDecision: ReactorDecision | null = null;
  
  private checks: MicroCheckResult[] = [];
  private rules: ReactorRuleResult[] = [];
  
  constructor(config: Partial<ReactorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.metrics = {
      totalDecisions: 0,
      executedCount: 0,
      delayedCount: 0,
      cancelledCount: 0,
      scaledCount: 0,
      abortedCount: 0,
      avgConfidence: 0,
      avgDelayMs: 0,
      avgSpreadBps: 0,
      avgLatencyMs: 0,
      emergencyAborts: 0,
      ruleViolations: 0,
      lastDecision: null,
      lastUpdate: Date.now(),
    };
  }
  
  /**
   * Load execution context from EXO and market data
   */
  load(
    exoDecision: {
      command: "EXECUTE" | "WAIT" | "CANCEL" | "SCALE";
      confidence: number;
      targetSize: number;
      direction: "LONG" | "SHORT";
      reason: string[];
    },
    marketSnapshot: ReactorContext["marketSnapshot"],
    orderbook: ReactorContext["orderbook"],
    latencyLog: ReactorContext["latencyLog"]
  ): void {
    this.context = {
      exoDecision,
      marketSnapshot,
      orderbook,
      latencyLog,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Run reactor analysis and produce final execution decision
   */
  runReactor(): ReactorDecision {
    if (!this.context) {
      throw new Error("XReactor: Context not loaded. Call load() first.");
    }
    
    const startTime = performance.now();
    
    // Step 1: Run all runtime monitors
    this.checks = runAllMonitors(
      this.context.marketSnapshot,
      this.context.orderbook,
      this.context.latencyLog,
      this.context.exoDecision.direction,
      this.config
    );
    
    // Step 2: Apply reactor rules
    this.rules = this.applyReactorRules();
    
    // Step 3: Check for emergency abort conditions
    const emergencyAbort = this.emergencyAbortCheck();
    
    // Step 4: Compute micro-delays
    const delayMs = this.computeMicroDelays();
    
    // Step 5: Compute order type selection
    const orderType = this.computeOrderTypeSwitch();
    
    // Step 6: Compute final decision
    const decision = this.computeFinalDecision(emergencyAbort, delayMs, orderType);
    
    // Update metrics
    this.updateMetrics(decision);
    
    // Store decision
    this.lastDecision = decision;
    this.metrics.lastDecision = decision;
    
    const executionTime = performance.now() - startTime;
    if (executionTime > 10) {
      console.warn(`XReactor: Slow execution (${executionTime.toFixed(2)}ms)`);
    }
    
    return decision;
  }
  
  /**
   * Apply all reactor rules
   */
  applyReactorRules(): ReactorRuleResult[] {
    if (!this.context) {
      return [];
    }
    
    return applyAllRules(
      this.checks,
      this.context.exoDecision.confidence,
      this.context
    );
  }
  
  /**
   * Compute optimal micro-delays based on conditions
   */
  computeMicroDelays(): number {
    if (!this.context) {
      return 0;
    }
    
    const ruleDecision = aggregateRuleDecision(this.rules);
    
    // If emergency abort or cancel, no delay
    if (ruleDecision.emergencyAbort || ruleDecision.shouldCancel) {
      return 0;
    }
    
    // If should delay, use max delay from rules
    if (ruleDecision.shouldDelay) {
      const delayMs = Math.min(ruleDecision.maxDelayMs, this.config.maxDelayMs);
      return Math.max(this.config.minDelayMs, delayMs);
    }
    
    // No delay needed
    return 0;
  }
  
  /**
   * Compute optimal order type based on conditions
   */
  computeOrderTypeSwitch(): OrderType {
    if (!this.context) {
      return "MARKET";
    }
    
    const { marketSnapshot, latencyLog, exoDecision } = this.context;
    const monitorAgg = aggregateMonitorScore(this.checks);
    
    // Get spread check
    const spreadCheck = this.checks.find(c => c.checkName.includes("Spread"));
    const spreadBps = spreadCheck?.value || 0;
    
    // Decision logic:
    // - MARKET: When conditions are perfect (low spread, low latency, high confidence)
    // - LIMIT: When spread is wide but conditions acceptable
    // - STOP_LIMIT: When protecting against reversal
    
    const perfectConditions = 
      monitorAgg.overallScore >= 80 &&
      spreadBps <= this.config.idealSpreadBps &&
      latencyLog.lastMs <= this.config.idealLatencyMs;
    
    if (perfectConditions && exoDecision.confidence >= 80) {
      return "MARKET"; // Execute immediately at market
    }
    
    const reversalCheck = this.checks.find(c => c.checkName.includes("Reversal"));
    const highReversalRisk = reversalCheck && reversalCheck.value > this.config.maxReversalRisk * 0.7;
    
    if (highReversalRisk) {
      return "STOP_LIMIT"; // Protect against reversal
    }
    
    const wideSpread = spreadBps > this.config.idealSpreadBps * 2;
    if (wideSpread) {
      return "LIMIT"; // Get better price with limit order
    }
    
    // Default to LIMIT for safety
    return "LIMIT";
  }
  
  /**
   * Check for emergency abort conditions
   */
  emergencyAbortCheck(): boolean {
    const emergencyRule = this.rules.find(r => r.ruleName.includes("Emergency"));
    return emergencyRule?.blockExecution || false;
  }
  
  /**
   * Compute final execution command
   */
  private computeFinalDecision(
    emergencyAbort: boolean,
    delayMs: number,
    orderType: OrderType
  ): ReactorDecision {
    if (!this.context) {
      throw new Error("XReactor: No context available");
    }
    
    const { exoDecision, marketSnapshot, latencyLog } = this.context;
    const ruleDecision = aggregateRuleDecision(this.rules);
    const monitorAgg = aggregateMonitorScore(this.checks);
    
    // Get diagnostic values
    const spreadCheck = this.checks.find(c => c.checkName.includes("Spread"));
    const pressureCheck = this.checks.find(c => c.checkName.includes("Pressure"));
    const volatilityCheck = this.checks.find(c => c.checkName.includes("Volatility"));
    const reversalCheck = this.checks.find(c => c.checkName.includes("Reversal"));
    
    const spreadBps = spreadCheck?.value || 0;
    const latencyMs = latencyLog.lastMs;
    const pressureScore = pressureCheck?.score || 0;
    const volatilityScore = volatilityCheck?.value || 0;
    const reversalRisk = reversalCheck?.value || 0;
    
    // Decision logic cascade
    let command: ReactorCommand;
    let finalSize = exoDecision.targetSize;
    let reason: string[] = [];
    let confidence = exoDecision.confidence;
    
    // 1. Emergency abort - highest priority
    if (emergencyAbort) {
      command = "EMERGENCY_ABORT";
      finalSize = 0;
      reason = ["🚨 EMERGENCY ABORT", ...ruleDecision.blockingReasons];
      confidence = 0;
    }
    // 2. EXO said CANCEL or blocking rules
    else if (exoDecision.command === "CANCEL" || ruleDecision.shouldCancel) {
      command = "CANCEL";
      finalSize = 0;
      reason = ["Trade cancelled", ...ruleDecision.blockingReasons];
      confidence = Math.min(confidence, 30);
    }
    // 3. Delay if conditions not optimal
    else if (ruleDecision.shouldDelay && delayMs > 0) {
      command = "DELAY";
      reason = [
        `Delaying ${delayMs}ms for better conditions`,
        `Monitor score: ${monitorAgg.overallScore}/100`,
      ];
      if (spreadCheck && !spreadCheck.passed) {
        reason.push(`Spread: ${spreadBps.toFixed(2)} bps`);
      }
      if (monitorAgg.warningCount > 0) {
        reason.push(`${monitorAgg.warningCount} warnings detected`);
      }
      confidence = Math.min(confidence, 70);
    }
    // 4. Scale down if rules suggest
    else if (ruleDecision.shouldScale) {
      command = "SCALE";
      finalSize = exoDecision.targetSize * ruleDecision.minScaleDown;
      reason = [
        `Scaling down to ${(ruleDecision.minScaleDown * 100).toFixed(0)}% size`,
        `Monitor score: ${monitorAgg.overallScore}/100`,
      ];
      this.rules
        .filter(r => r.scaleDown < 1.0)
        .forEach(r => reason.push(r.reason));
      confidence = Math.min(confidence, 80);
    }
    // 5. Execute - all conditions favorable
    else if (ruleDecision.shouldExecute && monitorAgg.overallScore >= 60) {
      command = "EXECUTE";
      reason = [
        "✅ All conditions favorable",
        `Monitor score: ${monitorAgg.overallScore}/100`,
        `${monitorAgg.passedCount}/${this.checks.length} checks passed`,
        `Spread: ${spreadBps.toFixed(2)} bps`,
        `Latency: ${latencyMs.toFixed(1)}ms`,
      ];
      confidence = Math.min(confidence + 10, 100); // Boost confidence
    }
    // 6. Default to CANCEL if uncertain
    else {
      command = "CANCEL";
      finalSize = 0;
      reason = [
        "Insufficient conditions for execution",
        `Monitor score: ${monitorAgg.overallScore}/100`,
        `${monitorAgg.failedCount} checks failed`,
      ];
      confidence = Math.min(confidence, 40);
    }
    
    return {
      command,
      delayMs,
      finalSize: Math.round(finalSize * 100) / 100, // Round to 2 decimals
      orderType,
      reason,
      confidence: Math.round(confidence),
      timestamp: Date.now(),
      spreadBps: Math.round(spreadBps * 100) / 100,
      latencyMs: Math.round(latencyMs * 10) / 10,
      pressureScore: Math.round(pressureScore),
      volatilityScore: Math.round(volatilityScore),
      reversalRisk: Math.round(reversalRisk),
    };
  }
  
  /**
   * Update metrics after decision
   */
  private updateMetrics(decision: ReactorDecision): void {
    this.metrics.totalDecisions++;
    
    // Count by command type
    switch (decision.command) {
      case "EXECUTE":
        this.metrics.executedCount++;
        break;
      case "DELAY":
        this.metrics.delayedCount++;
        break;
      case "CANCEL":
        this.metrics.cancelledCount++;
        break;
      case "SCALE":
        this.metrics.scaledCount++;
        break;
      case "EMERGENCY_ABORT":
        this.metrics.abortedCount++;
        this.metrics.emergencyAborts++;
        break;
    }
    
    // Count rule violations
    const blockingRules = this.rules.filter(r => r.blockExecution).length;
    this.metrics.ruleViolations += blockingRules;
    
    // Update running averages
    const n = this.metrics.totalDecisions;
    this.metrics.avgConfidence = 
      (this.metrics.avgConfidence * (n - 1) + decision.confidence) / n;
    this.metrics.avgDelayMs = 
      (this.metrics.avgDelayMs * (n - 1) + decision.delayMs) / n;
    this.metrics.avgSpreadBps = 
      (this.metrics.avgSpreadBps * (n - 1) + decision.spreadBps) / n;
    this.metrics.avgLatencyMs = 
      (this.metrics.avgLatencyMs * (n - 1) + decision.latencyMs) / n;
    
    this.metrics.lastUpdate = Date.now();
  }
  
  /**
   * Get final execution command (public interface)
   */
  getFinalCommand(): ReactorDecision {
    if (!this.lastDecision) {
      throw new Error("XReactor: No decision available. Call runReactor() first.");
    }
    return this.lastDecision;
  }
  
  /**
   * Get reactor metrics and statistics
   */
  getMetrics(): ReactorMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get current checks and rules (for debugging)
   */
  getDiagnostics(): {
    checks: MicroCheckResult[];
    rules: ReactorRuleResult[];
    monitorScore: ReturnType<typeof aggregateMonitorScore>;
    ruleDecision: ReturnType<typeof aggregateRuleDecision>;
  } {
    return {
      checks: this.checks,
      rules: this.rules,
      monitorScore: aggregateMonitorScore(this.checks),
      ruleDecision: aggregateRuleDecision(this.rules),
    };
  }
  
  /**
   * Update reactor configuration
   */
  updateConfig(config: Partial<ReactorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalDecisions: 0,
      executedCount: 0,
      delayedCount: 0,
      cancelledCount: 0,
      scaledCount: 0,
      abortedCount: 0,
      avgConfidence: 0,
      avgDelayMs: 0,
      avgSpreadBps: 0,
      avgLatencyMs: 0,
      emergencyAborts: 0,
      ruleViolations: 0,
      lastDecision: null,
      lastUpdate: Date.now(),
    };
  }
}

// Singleton instance
let reactorInstance: XReactor | null = null;

/**
 * Get or create X-REACTOR singleton instance
 */
export function getReactor(config?: Partial<ReactorConfig>): XReactor {
  if (!reactorInstance) {
    reactorInstance = new XReactor(config);
  } else if (config) {
    reactorInstance.updateConfig(config);
  }
  return reactorInstance;
}

/**
 * Reset reactor instance (for testing)
 */
export function resetReactor(): void {
  reactorInstance = null;
}
