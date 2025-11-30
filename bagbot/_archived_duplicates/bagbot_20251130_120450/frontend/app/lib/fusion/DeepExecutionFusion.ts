/**
 * Deep Execution Fusion Layer (DEFL)
 * 
 * Final harmonization layer that fuses EXO and X-REACTOR decisions.
 * Resolves conflicts and ensures unified, conflict-free execution command.
 * 
 * Performance Target: <5ms execution time
 * 
 * Architecture:
 * EXO Decision + X-REACTOR Decision → DEFL → Final Unified Command
 */

import type {
  FusionContext,
  FusionDecision,
  FusionConfig,
  FusionState,
  HarmonyMetrics,
  FusionRuleResult,
  FusionCommand,
  EXODecision,
  ReactorDecision,
  MarketSnapshot,
  OrderType,
  DEFAULT_FUSION_CONFIG,
} from './types';

import {
  applyAllFusionRules,
  aggregateFusionRules,
} from './fusionRules';

import { DEFAULT_FUSION_CONFIG as defaultConfig } from './types';

/**
 * Deep Execution Fusion Layer
 * 
 * Singleton class that harmonizes EXO and X-REACTOR decisions.
 */
export class DeepExecutionFusion {
  private context: FusionContext | null = null;
  private config: FusionConfig;
  private state: FusionState;
  
  private harmonyMetrics: HarmonyMetrics | null = null;
  private rules: FusionRuleResult[] = [];
  private lastDecision: FusionDecision | null = null;
  
  constructor(config: Partial<FusionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.state = {
      lastDecision: null,
      totalDecisions: 0,
      executedCount: 0,
      delayedCount: 0,
      cancelledCount: 0,
      scaledCount: 0,
      abortedCount: 0,
      avgHarmony: 0,
      avgConfidence: 0,
      conflictRate: 0,
      lastUpdate: Date.now(),
    };
  }
  
  /**
   * Load fusion context from EXO and X-REACTOR
   */
  load(
    exoDecision: EXODecision,
    reactorDecision: ReactorDecision,
    marketSnapshot: MarketSnapshot
  ): void {
    this.context = {
      exoDecision,
      reactorDecision,
      marketSnapshot,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Fuse decisions and produce final unified command
   */
  fuse(): FusionDecision {
    if (!this.context) {
      throw new Error("DeepExecutionFusion: Context not loaded. Call load() first.");
    }
    
    const startTime = performance.now();
    
    // Step 1: Compute harmony score
    this.harmonyMetrics = this.computeHarmonyScore();
    
    // Step 2: Apply fusion rules
    this.rules = this.applyFusionRules();
    
    // Step 3: Compute safe final command
    const decision = this.computeSafeFinalCommand();
    
    // Step 4: Update state
    this.updateState(decision);
    
    // Store decision
    this.lastDecision = decision;
    this.state.lastDecision = decision;
    
    const executionTime = performance.now() - startTime;
    if (executionTime > 5) {
      console.warn(`DEFL: Slow execution (${executionTime.toFixed(2)}ms)`);
    }
    
    return decision;
  }
  
  /**
   * Compute harmony score between EXO and X-REACTOR
   */
  computeHarmonyScore(): HarmonyMetrics {
    if (!this.context) {
      throw new Error("DeepExecutionFusion: No context available");
    }
    
    const { exoDecision, reactorDecision } = this.context;
    const { weights } = this.config;
    
    // 1. Command harmony - do commands align?
    const commandHarmony = this.computeCommandHarmony(
      exoDecision.command,
      reactorDecision.command
    );
    
    // 2. Confidence harmony - are confidence levels similar?
    const confidenceHarmony = this.computeConfidenceHarmony(
      exoDecision.confidence,
      reactorDecision.confidence
    );
    
    // 3. Size harmony - do size recommendations align?
    const sizeHarmony = this.computeSizeHarmony(
      exoDecision.targetSize,
      reactorDecision.finalSize
    );
    
    // 4. Timing harmony - is timing aligned?
    const timingHarmony = this.computeTimingHarmony(
      reactorDecision.delayMs
    );
    
    // 5. Overall harmony - weighted average
    const overallHarmony = 
      commandHarmony * weights.command +
      confidenceHarmony * weights.confidence +
      sizeHarmony * weights.size +
      timingHarmony * weights.timing;
    
    // Detect conflicts
    const { hasConflict, conflictType, conflictSeverity } = this.detectConflicts(
      commandHarmony,
      confidenceHarmony,
      sizeHarmony,
      timingHarmony
    );
    
    return {
      commandHarmony,
      confidenceHarmony,
      sizeHarmony,
      timingHarmony,
      overallHarmony,
      hasConflict,
      conflictType,
      conflictSeverity,
    };
  }
  
  /**
   * Compute command alignment (0-100)
   */
  private computeCommandHarmony(
    exoCmd: string,
    reactorCmd: string
  ): number {
    // Perfect alignment
    if (exoCmd === reactorCmd) return 100;
    
    // Compatible commands
    if (exoCmd === "EXECUTE" && reactorCmd === "EXECUTE") return 100;
    if (exoCmd === "CANCEL" && reactorCmd === "CANCEL") return 100;
    if (exoCmd === "SCALE" && reactorCmd === "SCALE") return 100;
    if (exoCmd === "WAIT" && reactorCmd === "DELAY") return 90; // Similar
    
    // Partial alignment
    if (exoCmd === "EXECUTE" && reactorCmd === "SCALE") return 70; // Can work
    if (exoCmd === "EXECUTE" && reactorCmd === "DELAY") return 60; // Can wait
    if (exoCmd === "SCALE" && reactorCmd === "EXECUTE") return 70;
    if (exoCmd === "WAIT" && reactorCmd === "EXECUTE") return 50;
    
    // Conflicting commands
    if (exoCmd === "EXECUTE" && reactorCmd === "CANCEL") return 20;
    if (exoCmd === "EXECUTE" && reactorCmd === "EMERGENCY_ABORT") return 0;
    if (reactorCmd === "EMERGENCY_ABORT") return 0; // Emergency overrides all
    
    // Default moderate harmony
    return 50;
  }
  
  /**
   * Compute confidence alignment (0-100)
   */
  private computeConfidenceHarmony(
    exoConf: number,
    reactorConf: number
  ): number {
    const diff = Math.abs(exoConf - reactorConf);
    
    // Perfect alignment
    if (diff < 5) return 100;
    
    // Good alignment
    if (diff < 15) return 90;
    
    // Moderate alignment
    if (diff < 30) return 70;
    
    // Poor alignment
    if (diff < 50) return 40;
    
    // Very poor alignment
    return 20;
  }
  
  /**
   * Compute size alignment (0-100)
   */
  private computeSizeHarmony(
    exoSize: number,
    reactorSize: number
  ): number {
    if (exoSize === 0 || reactorSize === 0) return 0;
    
    const ratio = Math.min(exoSize, reactorSize) / Math.max(exoSize, reactorSize);
    
    // Convert ratio to 0-100 score
    return ratio * 100;
  }
  
  /**
   * Compute timing alignment (0-100)
   */
  private computeTimingHarmony(delayMs: number): number {
    // No delay = perfect timing
    if (delayMs === 0) return 100;
    
    // Small delay = good timing
    if (delayMs < 100) return 90;
    
    // Moderate delay = acceptable
    if (delayMs < 300) return 70;
    
    // Large delay = poor timing
    if (delayMs < 500) return 50;
    
    // Excessive delay = very poor timing
    return 30;
  }
  
  /**
   * Detect conflicts and classify severity
   */
  private detectConflicts(
    cmdHarmony: number,
    confHarmony: number,
    sizeHarmony: number,
    timingHarmony: number
  ): {
    hasConflict: boolean;
    conflictType?: "COMMAND" | "CONFIDENCE" | "SIZE" | "TIMING";
    conflictSeverity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  } {
    // Find worst harmony score
    const scores = [
      { type: "COMMAND", score: cmdHarmony },
      { type: "CONFIDENCE", score: confHarmony },
      { type: "SIZE", score: sizeHarmony },
      { type: "TIMING", score: timingHarmony },
    ] as const;
    
    const worst = scores.reduce((min, curr) => 
      curr.score < min.score ? curr : min
    );
    
    // Determine if conflict exists and severity
    if (worst.score >= 70) {
      return { hasConflict: false };
    }
    
    let conflictSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    if (worst.score >= 50) {
      conflictSeverity = "LOW";
    } else if (worst.score >= 30) {
      conflictSeverity = "MEDIUM";
    } else if (worst.score >= 10) {
      conflictSeverity = "HIGH";
    } else {
      conflictSeverity = "CRITICAL";
    }
    
    return {
      hasConflict: true,
      conflictType: worst.type,
      conflictSeverity,
    };
  }
  
  /**
   * Apply all fusion rules
   */
  applyFusionRules(): FusionRuleResult[] {
    if (!this.context || !this.harmonyMetrics) {
      return [];
    }
    
    return applyAllFusionRules(
      this.context,
      this.harmonyMetrics,
      this.config
    );
  }
  
  /**
   * Compute safe final command based on harmony and rules
   */
  computeSafeFinalCommand(): FusionDecision {
    if (!this.context || !this.harmonyMetrics) {
      throw new Error("DeepExecutionFusion: Missing context or harmony metrics");
    }
    
    const { exoDecision, reactorDecision, marketSnapshot } = this.context;
    const ruleAgg = aggregateFusionRules(this.rules);
    
    // Adjust harmony score based on rules
    let adjustedHarmony = this.harmonyMetrics.overallHarmony + ruleAgg.totalHarmonyAdjustment;
    adjustedHarmony = Math.max(0, Math.min(100, adjustedHarmony)); // Clamp 0-100
    
    // Determine final command
    let finalCommand: FusionCommand;
    let finalSize: number;
    let orderType: OrderType;
    let confidence: number;
    let reason: string[] = [];
    
    // Emergency abort - highest priority
    if (ruleAgg.emergencyAbort) {
      finalCommand = "EMERGENCY_ABORT";
      finalSize = 0;
      orderType = reactorDecision.orderType;
      confidence = 0;
      reason = ["🚨 EMERGENCY ABORT", ...ruleAgg.blockingReasons];
    }
    // Cancel
    else if (ruleAgg.shouldCancel) {
      finalCommand = "CANCEL";
      finalSize = 0;
      orderType = reactorDecision.orderType;
      confidence = Math.min(exoDecision.confidence, reactorDecision.confidence);
      reason = ["Fusion cancelled", ...ruleAgg.blockingReasons];
    }
    // Delay
    else if (ruleAgg.shouldDelay) {
      finalCommand = "DELAY";
      finalSize = Math.min(exoDecision.targetSize, reactorDecision.finalSize);
      orderType = reactorDecision.orderType;
      confidence = (exoDecision.confidence + reactorDecision.confidence) / 2;
      reason = [
        `Delaying for better harmony (current: ${adjustedHarmony.toFixed(1)}%)`,
        `Command harmony: ${this.harmonyMetrics.commandHarmony.toFixed(1)}%`,
      ];
    }
    // Scale
    else if (ruleAgg.shouldScale) {
      finalCommand = "SCALE";
      // Use smaller of the two sizes (more conservative)
      finalSize = Math.min(exoDecision.targetSize, reactorDecision.finalSize);
      orderType = reactorDecision.orderType;
      confidence = (exoDecision.confidence + reactorDecision.confidence) / 2;
      reason = [
        "Scaling position due to harmony concerns",
        `Harmony: ${adjustedHarmony.toFixed(1)}%`,
        `EXO size: ${exoDecision.targetSize}, Reactor size: ${reactorDecision.finalSize}`,
      ];
    }
    // Execute
    else if (ruleAgg.shouldExecute) {
      finalCommand = "EXECUTE";
      // Use average of sizes if both recommend execution
      finalSize = (exoDecision.targetSize + reactorDecision.finalSize) / 2;
      orderType = reactorDecision.orderType; // Trust reactor for order type
      // Boost confidence on good harmony
      confidence = Math.min(
        100,
        (exoDecision.confidence + reactorDecision.confidence) / 2 + (adjustedHarmony > 90 ? 10 : 0)
      );
      reason = [
        "✅ Fusion approved execution",
        `Harmony: ${adjustedHarmony.toFixed(1)}%`,
        `${ruleAgg.passingRules.length}/${this.rules.length} rules passed`,
        `Final size: ${finalSize.toFixed(2)}`,
      ];
    }
    // Default to cancel if uncertain
    else {
      finalCommand = "CANCEL";
      finalSize = 0;
      orderType = reactorDecision.orderType;
      confidence = 30;
      reason = [
        "Insufficient conditions for fusion",
        `Harmony: ${adjustedHarmony.toFixed(1)}%`,
        `Passing rules: ${ruleAgg.passingRules.length}/${this.rules.length}`,
      ];
    }
    
    return {
      finalCommand,
      finalSize: Math.round(finalSize * 10000) / 10000, // Round to 4 decimals
      orderType,
      harmonyScore: Math.round(adjustedHarmony),
      confidence: Math.round(confidence),
      reason,
      timestamp: Date.now(),
      metrics: {
        exoCommand: exoDecision.command,
        reactorCommand: reactorDecision.command,
        harmonyMetrics: this.harmonyMetrics,
        rulesApplied: this.rules.length,
        rulesPassed: ruleAgg.passingRules.length,
        rulesFailed: this.rules.length - ruleAgg.passingRules.length,
        executionTimeMs: 0, // Will be updated by caller
      },
      sources: {
        exo: exoDecision,
        reactor: reactorDecision,
      },
    };
  }
  
  /**
   * Update fusion state after decision
   */
  private updateState(decision: FusionDecision): void {
    this.state.totalDecisions++;
    
    // Count by command
    switch (decision.finalCommand) {
      case "EXECUTE":
        this.state.executedCount++;
        break;
      case "DELAY":
        this.state.delayedCount++;
        break;
      case "CANCEL":
        this.state.cancelledCount++;
        break;
      case "SCALE":
        this.state.scaledCount++;
        break;
      case "EMERGENCY_ABORT":
        this.state.abortedCount++;
        break;
    }
    
    // Update averages
    const n = this.state.totalDecisions;
    this.state.avgHarmony = 
      (this.state.avgHarmony * (n - 1) + decision.harmonyScore) / n;
    this.state.avgConfidence = 
      (this.state.avgConfidence * (n - 1) + decision.confidence) / n;
    
    // Update conflict rate
    const hadConflict = decision.metrics.harmonyMetrics.hasConflict;
    const prevConflicts = this.state.conflictRate * (n - 1);
    this.state.conflictRate = (prevConflicts + (hadConflict ? 1 : 0)) / n;
    
    this.state.lastUpdate = Date.now();
  }
  
  /**
   * Get fusion state
   */
  getFusionState(): FusionState {
    return { ...this.state };
  }
  
  /**
   * Get last decision
   */
  getLastDecision(): FusionDecision | null {
    return this.lastDecision;
  }
  
  /**
   * Get diagnostics (for debugging)
   */
  getDiagnostics(): {
    context: FusionContext | null;
    harmony: HarmonyMetrics | null;
    rules: FusionRuleResult[];
    ruleAggregation: ReturnType<typeof aggregateFusionRules> | null;
  } {
    return {
      context: this.context,
      harmony: this.harmonyMetrics,
      rules: this.rules,
      ruleAggregation: this.rules.length > 0 
        ? aggregateFusionRules(this.rules) 
        : null,
    };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<FusionConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Reset state
   */
  resetState(): void {
    this.state = {
      lastDecision: null,
      totalDecisions: 0,
      executedCount: 0,
      delayedCount: 0,
      cancelledCount: 0,
      scaledCount: 0,
      abortedCount: 0,
      avgHarmony: 0,
      avgConfidence: 0,
      conflictRate: 0,
      lastUpdate: Date.now(),
    };
  }
}

// Singleton instance
let fusionInstance: DeepExecutionFusion | null = null;

/**
 * Get or create DEFL singleton instance
 */
export function getFusion(config?: Partial<FusionConfig>): DeepExecutionFusion {
  if (!fusionInstance) {
    fusionInstance = new DeepExecutionFusion(config);
  } else if (config) {
    fusionInstance.updateConfig(config);
  }
  return fusionInstance;
}

/**
 * Reset fusion instance (for testing)
 */
export function resetFusion(): void {
  fusionInstance = null;
}
