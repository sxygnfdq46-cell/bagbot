/**
 * Execution Override - Dynamic Execution Safety Layer
 * 
 * Final safety check before and during trade execution.
 * Can halt or modify trades based on real-time market conditions.
 */

import {
  OverrideRules,
  RuleContext,
  RuleResult,
  RuleConfig,
} from './overrideRules';

/**
 * Override result
 */
export interface OverrideResult {
  override: boolean;
  reason: string;
  severity: number;
  timestamp: number;
  triggeredRules: string[];
  context: string;
  action: 'ALLOW' | 'BLOCK' | 'MODIFY';
  modifications?: TradeModification;
}

/**
 * Trade modification suggestions
 */
export interface TradeModification {
  reduceSize?: number;      // Reduce size by %
  tightenStop?: number;      // Tighten stop by %
  adjustEntry?: number;      // Adjust entry price by %
  delayExecution?: number;   // Delay execution by seconds
  splitOrder?: number;       // Split into N orders
}

/**
 * Override context types
 */
export type OverrideContext = 'PRE_TRADE' | 'MID_TRADE' | 'POST_TRADE' | 'MODIFICATION';

/**
 * Trade snapshot (simplified)
 */
export interface TradeSnapshot {
  symbol: string;
  price: number;
  spread?: number;
  volatility?: number;
  expectedSlippage?: number;
  momentumChange?: number;
  reversalConfidence?: number;
  liquidity?: number;
  conflictCount?: number;
  priceGap?: number;
  timestamp: number;
}

/**
 * Position snapshot (simplified)
 */
export interface PositionSnapshot {
  symbol: string;
  size: number;
  entry: number;
  current: number;
  pnl: number;
  pnlPercent: number;
  duration: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  warnings: string[];
  score: number;          // 0-100 (higher = safer)
}

/**
 * Override summary
 */
export interface OverrideSummary {
  totalOverrides: number;
  allowedCount: number;
  blockedCount: number;
  modifiedCount: number;
  criticalOverrides: number;
  topReasons: Array<{ reason: string; count: number }>;
  averageSeverity: number;
  lastOverride: OverrideResult | null;
}

/**
 * Execution Override Engine
 */
export class ExecutionOverride {
  private overrideHistory: OverrideResult[] = [];
  private shieldActive: boolean = false;
  private threatLevel: number = 0;
  private volatilityLevel: number = 0;
  private flowState: string = 'NORMAL';
  
  // Configuration
  private config = {
    maxHistorySize: 100,
    criticalSeverityThreshold: 80,
    modificationThreshold: 60,
    enableModifications: true,
  };
  
  constructor() {
    console.log('[ExecutionOverride] Initialized');
  }
  
  // ============================================================================
  // Core Methods
  // ============================================================================
  
  /**
   * Check pre-trade conditions
   * Called before initiating a trade
   */
  checkPreTrade(snapshot: TradeSnapshot): OverrideResult {
    console.log(`[ExecutionOverride] Pre-trade check for ${snapshot.symbol}`);
    
    const context: RuleContext = {
      snapshot,
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
      volatilityLevel: this.volatilityLevel,
      flowState: this.flowState,
    };
    
    // Run all rules
    const triggeredRules = OverrideRules.getTriggered(context);
    const shouldOverride = OverrideRules.shouldOverride(context);
    const summary = OverrideRules.getSummary(context);
    
    // Determine action
    let action: 'ALLOW' | 'BLOCK' | 'MODIFY' = 'ALLOW';
    let modifications: TradeModification | undefined = undefined;
    
    if (shouldOverride) {
      if (summary.highestSeverity >= this.config.criticalSeverityThreshold) {
        action = 'BLOCK';
      } else if (
        summary.highestSeverity >= this.config.modificationThreshold &&
        this.config.enableModifications
      ) {
        action = 'MODIFY';
        modifications = this.generateModifications(triggeredRules, snapshot);
      } else {
        action = 'BLOCK';
      }
    }
    
    const result: OverrideResult = {
      override: shouldOverride,
      reason: this.buildOverrideReason(triggeredRules, 'PRE_TRADE'),
      severity: summary.highestSeverity,
      timestamp: Date.now(),
      triggeredRules: triggeredRules.map(r => r.reason),
      context: 'PRE_TRADE',
      action,
      modifications,
    };
    
    // Store in history
    this.addToHistory(result);
    
    console.log(`[ExecutionOverride] Pre-trade result: ${action} (severity: ${result.severity})`);
    
    return result;
  }
  
  /**
   * Check mid-trade conditions
   * Called during active trade
   */
  checkMidTrade(snapshot: TradeSnapshot, position: PositionSnapshot): OverrideResult {
    console.log(`[ExecutionOverride] Mid-trade check for ${snapshot.symbol} position`);
    
    const context: RuleContext = {
      snapshot,
      position,
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
      volatilityLevel: this.volatilityLevel,
      flowState: this.flowState,
    };
    
    // Run all rules
    const triggeredRules = OverrideRules.getTriggered(context);
    const shouldOverride = OverrideRules.shouldOverride(context);
    const summary = OverrideRules.getSummary(context);
    
    // Determine action
    let action: 'ALLOW' | 'BLOCK' | 'MODIFY' = 'ALLOW';
    let modifications: TradeModification | undefined = undefined;
    
    if (shouldOverride) {
      // Mid-trade: prefer modifications over blocking
      if (summary.highestSeverity >= this.config.criticalSeverityThreshold) {
        action = 'BLOCK'; // Force close position
      } else if (summary.highestSeverity >= this.config.modificationThreshold) {
        action = 'MODIFY'; // Adjust position
        modifications = this.generatePositionModifications(triggeredRules, position, snapshot);
      } else {
        action = 'ALLOW'; // Monitor but continue
      }
    }
    
    const result: OverrideResult = {
      override: shouldOverride,
      reason: this.buildOverrideReason(triggeredRules, 'MID_TRADE'),
      severity: summary.highestSeverity,
      timestamp: Date.now(),
      triggeredRules: triggeredRules.map(r => r.reason),
      context: 'MID_TRADE',
      action,
      modifications,
    };
    
    // Store in history
    this.addToHistory(result);
    
    console.log(`[ExecutionOverride] Mid-trade result: ${action} (severity: ${result.severity})`);
    
    return result;
  }
  
  /**
   * Apply override
   * Force an override with custom reason
   */
  applyOverride(
    reason: string,
    severity: number = 100,
    context: OverrideContext = 'MODIFICATION'
  ): OverrideResult {
    console.log(`[ExecutionOverride] Applying manual override: ${reason}`);
    
    const result: OverrideResult = {
      override: true,
      reason,
      severity,
      timestamp: Date.now(),
      triggeredRules: ['MANUAL_OVERRIDE'],
      context,
      action: severity >= this.config.criticalSeverityThreshold ? 'BLOCK' : 'MODIFY',
    };
    
    this.addToHistory(result);
    
    return result;
  }
  
  /**
   * Validate execution conditions
   * Comprehensive safety check
   */
  validateExecutionConditions(snapshot: TradeSnapshot): ValidationResult {
    console.log(`[ExecutionOverride] Validating execution conditions for ${snapshot.symbol}`);
    
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;
    
    const context: RuleContext = {
      snapshot,
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
      volatilityLevel: this.volatilityLevel,
      flowState: this.flowState,
    };
    
    // Run all rules and categorize
    const allRules = OverrideRules.runAll(context);
    
    allRules.forEach(rule => {
      if (rule.triggered) {
        if (rule.severity >= this.config.criticalSeverityThreshold) {
          issues.push(rule.reason);
          score -= 20;
        } else if (rule.severity >= this.config.modificationThreshold) {
          warnings.push(rule.reason);
          score -= 10;
        } else {
          warnings.push(rule.reason);
          score -= 5;
        }
      }
    });
    
    // Additional validations
    if (!snapshot.price || snapshot.price <= 0) {
      issues.push('Invalid price data');
      score -= 25;
    }
    
    if (snapshot.spread && snapshot.spread > snapshot.price * 0.01) {
      warnings.push('Wide spread detected (>1%)');
      score -= 5;
    }
    
    // Shield/Threat checks
    if (this.shieldActive) {
      issues.push('Shield is active - trading blocked');
      score = 0;
    }
    
    if (this.threatLevel > 90) {
      issues.push('Critical threat level detected');
      score = Math.min(score, 20);
    }
    
    score = Math.max(0, Math.min(100, score));
    
    return {
      valid: issues.length === 0 && score >= 60,
      issues,
      warnings,
      score,
    };
  }
  
  /**
   * Get override summary
   */
  getOverrideSummary(): OverrideSummary {
    const total = this.overrideHistory.length;
    const allowed = this.overrideHistory.filter(o => o.action === 'ALLOW').length;
    const blocked = this.overrideHistory.filter(o => o.action === 'BLOCK').length;
    const modified = this.overrideHistory.filter(o => o.action === 'MODIFY').length;
    const critical = this.overrideHistory.filter(
      o => o.severity >= this.config.criticalSeverityThreshold
    ).length;
    
    // Count reasons
    const reasonCounts = new Map<string, number>();
    this.overrideHistory.forEach(o => {
      const count = reasonCounts.get(o.reason) || 0;
      reasonCounts.set(o.reason, count + 1);
    });
    
    const topReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const avgSeverity = total > 0
      ? this.overrideHistory.reduce((sum, o) => sum + o.severity, 0) / total
      : 0;
    
    return {
      totalOverrides: total,
      allowedCount: allowed,
      blockedCount: blocked,
      modifiedCount: modified,
      criticalOverrides: critical,
      topReasons,
      averageSeverity: avgSeverity,
      lastOverride: this.overrideHistory[this.overrideHistory.length - 1] || null,
    };
  }
  
  // ============================================================================
  // Helper Methods
  // ============================================================================
  
  /**
   * Build override reason from triggered rules
   */
  private buildOverrideReason(rules: RuleResult[], context: OverrideContext): string {
    if (rules.length === 0) {
      return 'All conditions met';
    }
    
    if (rules.length === 1) {
      return rules[0].reason;
    }
    
    const topRule = rules.reduce((max, curr) => 
      curr.severity > max.severity ? curr : max
    );
    
    return `${topRule.reason} (+${rules.length - 1} other issues)`;
  }
  
  /**
   * Generate trade modifications
   */
  private generateModifications(
    rules: RuleResult[],
    snapshot: TradeSnapshot
  ): TradeModification {
    const modifications: TradeModification = {};
    
    // Check for specific issues
    const hasSpreadIssue = rules.some(r => r.reason.includes('Spread'));
    const hasVolatilityIssue = rules.some(r => r.reason.includes('Volatility'));
    const hasLiquidityIssue = rules.some(r => r.reason.includes('Liquidity'));
    const hasSlippageIssue = rules.some(r => r.reason.includes('Slippage'));
    
    if (hasSpreadIssue || hasSlippageIssue) {
      modifications.reduceSize = 50; // Reduce by 50%
      modifications.splitOrder = 3;  // Split into 3 orders
    }
    
    if (hasVolatilityIssue) {
      modifications.reduceSize = 60; // Reduce by 60%
      modifications.tightenStop = 20; // Tighten stop by 20%
    }
    
    if (hasLiquidityIssue) {
      modifications.reduceSize = 70; // Reduce by 70%
      modifications.splitOrder = 5;  // Split into 5 orders
      modifications.delayExecution = 5; // Delay 5 seconds
    }
    
    return modifications;
  }
  
  /**
   * Generate position modifications
   */
  private generatePositionModifications(
    rules: RuleResult[],
    position: PositionSnapshot,
    snapshot: TradeSnapshot
  ): TradeModification {
    const modifications: TradeModification = {};
    
    // Check for specific issues
    const hasCriticalIssue = rules.some(r => r.severity >= 90);
    const hasHighSeverity = rules.some(r => r.severity >= 70);
    
    if (hasCriticalIssue) {
      modifications.reduceSize = 100; // Close entire position
    } else if (hasHighSeverity) {
      modifications.reduceSize = 50; // Reduce by 50%
      modifications.tightenStop = 30; // Tighten stop by 30%
    } else {
      modifications.tightenStop = 15; // Tighten stop by 15%
    }
    
    return modifications;
  }
  
  /**
   * Add to history
   */
  private addToHistory(result: OverrideResult): void {
    this.overrideHistory.push(result);
    
    // Maintain size limit
    if (this.overrideHistory.length > this.config.maxHistorySize) {
      this.overrideHistory.shift();
    }
  }
  
  // ============================================================================
  // State Management
  // ============================================================================
  
  /**
   * Update shield state
   */
  setShieldActive(active: boolean): void {
    this.shieldActive = active;
    console.log(`[ExecutionOverride] Shield ${active ? 'activated' : 'deactivated'}`);
  }
  
  /**
   * Update threat level
   */
  setThreatLevel(level: number): void {
    this.threatLevel = level;
    console.log(`[ExecutionOverride] Threat level set to ${level}`);
  }
  
  /**
   * Update volatility level
   */
  setVolatilityLevel(level: number): void {
    this.volatilityLevel = level;
    console.log(`[ExecutionOverride] Volatility level set to ${level}`);
  }
  
  /**
   * Update flow state
   */
  setFlowState(state: string): void {
    this.flowState = state;
    console.log(`[ExecutionOverride] Flow state set to ${state}`);
  }
  
  /**
   * Get override history
   */
  getHistory(): OverrideResult[] {
    return [...this.overrideHistory];
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.overrideHistory = [];
    console.log('[ExecutionOverride] History cleared');
  }
  
  /**
   * Get recent overrides
   */
  getRecentOverrides(count: number = 10): OverrideResult[] {
    return this.overrideHistory.slice(-count);
  }
  
  /**
   * Get blocked trades
   */
  getBlockedTrades(): OverrideResult[] {
    return this.overrideHistory.filter(o => o.action === 'BLOCK');
  }
  
  /**
   * Get modified trades
   */
  getModifiedTrades(): OverrideResult[] {
    return this.overrideHistory.filter(o => o.action === 'MODIFY');
  }
  
  // ============================================================================
  // Configuration
  // ============================================================================
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config };
    console.log('[ExecutionOverride] Configuration updated:', config);
  }
  
  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Reset configuration
   */
  resetConfig(): void {
    this.config = {
      maxHistorySize: 100,
      criticalSeverityThreshold: 80,
      modificationThreshold: 60,
      enableModifications: true,
    };
    console.log('[ExecutionOverride] Configuration reset to defaults');
  }
  
  // ============================================================================
  // Analytics
  // ============================================================================
  
  /**
   * Get override statistics
   */
  getStatistics(): {
    totalChecks: number;
    overrideRate: number;
    blockRate: number;
    modificationRate: number;
    averageSeverity: number;
    criticalCount: number;
  } {
    const total = this.overrideHistory.length;
    const overrides = this.overrideHistory.filter(o => o.override).length;
    const blocks = this.overrideHistory.filter(o => o.action === 'BLOCK').length;
    const modifications = this.overrideHistory.filter(o => o.action === 'MODIFY').length;
    const critical = this.overrideHistory.filter(
      o => o.severity >= this.config.criticalSeverityThreshold
    ).length;
    
    const avgSeverity = total > 0
      ? this.overrideHistory.reduce((sum, o) => sum + o.severity, 0) / total
      : 0;
    
    return {
      totalChecks: total,
      overrideRate: total > 0 ? (overrides / total) * 100 : 0,
      blockRate: total > 0 ? (blocks / total) * 100 : 0,
      modificationRate: total > 0 ? (modifications / total) * 100 : 0,
      averageSeverity: avgSeverity,
      criticalCount: critical,
    };
  }
  
  /**
   * Export state
   */
  exportState() {
    return {
      overrideHistory: this.overrideHistory,
      shieldActive: this.shieldActive,
      threatLevel: this.threatLevel,
      volatilityLevel: this.volatilityLevel,
      flowState: this.flowState,
      config: this.config,
      summary: this.getOverrideSummary(),
      statistics: this.getStatistics(),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let overrideInstance: ExecutionOverride | null = null;

/**
 * Get ExecutionOverride instance
 */
export function getExecutionOverride(): ExecutionOverride {
  if (!overrideInstance) {
    overrideInstance = new ExecutionOverride();
  }
  return overrideInstance;
}

/**
 * Reset ExecutionOverride instance
 */
export function resetExecutionOverride(): void {
  overrideInstance = null;
  console.log('[ExecutionOverride] Instance reset');
}

export default ExecutionOverride;
