/**
 * ⚡ NEURAL EXECUTION TRANSLATOR (NET)
 * 
 * STEP 24.33 — Intelligence → Action Translator
 * 
 * Purpose:
 * This is the CRITICAL bridge between BagBot's intelligence (HIF) and execution.
 * NET converts the Harmonized Intelligence Frame into precise, safe, execution-ready
 * instructions that the Trading Brain can act upon.
 * 
 * Responsibilities:
 * - Accept HIF (Harmonized Intelligence Frame)
 * - Apply deep sanity checks (safety gates)
 * - Translate intelligence into execution actions
 * - Ensure every action is:
 *   * Interpreted correctly
 *   * Cleansed of noise
 *   * Precision-aligned with shield logic
 *   * Safe under turbulence
 *   * Ready for execution
 * 
 * Prevents:
 * ❌ Random trades
 * ❌ Conflicting decisions
 * ❌ Misinterpreted signals
 * ❌ Overreacting or underreacting
 * 
 * This is the "translator" between BagBot's brain and its hands.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Deep safety validation
 * - Clear action outputs
 */

import type {
  HIF,
  ExecutionInstruction,
  ExecutionContext,
  SafetyGateResult,
  ThreatOverrideState,
  ActionConfidenceLevel,
} from '@/app/lib/harmonizer/types';

// ============================================================================
// NET CONFIGURATION
// ============================================================================

export interface NETConfig {
  enableSafetyGates: boolean; // Default: true
  minConfidenceForEntry: number; // Default: 60 (0-100)
  maxThreatLevelForEntry: number; // Default: 70 (0-100)
  volatilitySpikePauseThreshold: number; // Default: 80 (0-100)
  conflictOverrideAction: 'WAIT' | 'REDUCE_POSITION' | 'HOLD'; // Default: WAIT
  aggressiveModeMultiplier: number; // Default: 1.2
  safeModeMultiplier: number; // Default: 0.6
}

// ============================================================================
// NEURAL EXECUTION TRANSLATOR CLASS
// ============================================================================

export class NeuralExecutionTranslator {
  private config: NETConfig;
  private lastInstruction: ExecutionInstruction | null = null;
  private translationCount: number = 0;

  // Statistics
  private stats = {
    totalTranslations: 0,
    safetyGateBlocks: 0,
    threatOverrides: 0,
    conflictOverrides: 0,
    lastTranslationTime: 0,
  };

  constructor(config?: Partial<NETConfig>) {
    this.config = {
      enableSafetyGates: config?.enableSafetyGates ?? true,
      minConfidenceForEntry: config?.minConfidenceForEntry ?? 60,
      maxThreatLevelForEntry: config?.maxThreatLevelForEntry ?? 70,
      volatilitySpikePauseThreshold: config?.volatilitySpikePauseThreshold ?? 80,
      conflictOverrideAction: config?.conflictOverrideAction ?? 'WAIT',
      aggressiveModeMultiplier: config?.aggressiveModeMultiplier ?? 1.2,
      safeModeMultiplier: config?.safeModeMultiplier ?? 0.6,
    };

    console.log('⚡ NeuralExecutionTranslator initialized');
  }

  // ==========================================================================
  // TRANSLATE HIF → ExecutionInstruction
  // ==========================================================================

  public translate(hif: HIF, context?: ExecutionContext): ExecutionInstruction {
    const startTime = Date.now();
    this.translationCount++;
    this.stats.totalTranslations++;

    console.log(`⚡ NET Translation #${this.translationCount} — HIF → Execution`);

    // Step 1: Apply safety gates
    const safetyResult = this.applySafetyGates(hif);

    // Step 2: Check for threat overrides
    const threatOverride = this.checkThreatOverride(hif);

    // Step 3: Compute base action
    let action = this.computeAction(hif, safetyResult, threatOverride);

    // Step 4: Apply context adjustments
    if (context) {
      action = this.applyContextAdjustments(action, context, hif);
    }

    // Step 5: Finalize action
    const instruction = this.finalizeAction(action, hif, safetyResult, context);

    // Step 6: Update statistics
    this.updateStatistics(startTime, safetyResult, threatOverride);

    // Step 7: Store and return
    this.lastInstruction = instruction;
    return instruction;
  }

  // ==========================================================================
  // APPLY SAFETY GATES — Deep Sanity Checks
  // ==========================================================================

  public applySafetyGates(hif: HIF): SafetyGateResult {
    const checks = {
      shieldStateCheck: true,
      threatLevelCheck: true,
      confidenceAlignmentCheck: true,
      volatilitySpikeCheck: true,
      dailyConsistencyCheck: true,
    };

    let passed = true;
    let blockedReason: string | undefined;

    // 1. Shield State Check
    if (hif.shieldState === 'DEFENSIVE' && hif.recommendedAction !== 'WAIT') {
      checks.shieldStateCheck = false;
      passed = false;
      blockedReason = 'Shield is DEFENSIVE — no new entries allowed';
    }

    // 2. Threat Level Check
    if (hif.threatLevel > this.config.maxThreatLevelForEntry && hif.recommendedAction !== 'WAIT') {
      checks.threatLevelCheck = false;
      passed = false;
      blockedReason = `Threat level too high (${hif.threatLevel}) — no entries`;
    }

    // 3. Confidence Alignment Check
    if (Math.abs(hif.tradeBias) > 0.3 && hif.confidence < this.config.minConfidenceForEntry) {
      checks.confidenceAlignmentCheck = false;
      passed = false;
      blockedReason = `Confidence (${hif.confidence}) too low for bias (${hif.tradeBias})`;
    }

    // 4. Volatility Spike Check
    const volatilityScore =
      hif.volatilityStatus === 'high' ? 90 : hif.volatilityStatus === 'medium' ? 50 : 20;
    if (volatilityScore > this.config.volatilitySpikePauseThreshold) {
      checks.volatilitySpikeCheck = false;
      passed = false;
      blockedReason = 'Volatility spike detected — pausing entries';
    }

    // 5. Daily Consistency Check (placeholder — would check daily rules)
    // For now, always passes
    checks.dailyConsistencyCheck = true;

    if (!passed) {
      this.stats.safetyGateBlocks++;
      console.warn(`⚠️ Safety Gate BLOCKED: ${blockedReason}`);
    }

    return { passed, checks, blockedReason };
  }

  // ==========================================================================
  // CHECK THREAT OVERRIDE
  // ==========================================================================

  private checkThreatOverride(hif: HIF): ThreatOverrideState {
    // If threat level is critical (>80), force exit/hold
    if (hif.threatLevel > 80) {
      this.stats.threatOverrides++;
      return {
        isActive: true,
        reason: `Critical threat level: ${hif.threatLevel}`,
        overriddenAction: hif.recommendedAction,
        enforcedAction: 'CLOSE_IMMEDIATELY',
      };
    }

    return {
      isActive: false,
      reason: '',
      overriddenAction: '',
      enforcedAction: '',
    };
  }

  // ==========================================================================
  // COMPUTE ACTION — Translate HIF to action
  // ==========================================================================

  public computeAction(
    hif: HIF,
    safetyResult: SafetyGateResult,
    threatOverride: ThreatOverrideState
  ): ExecutionInstruction['action'] {
    // If safety gates failed, return safe action
    if (!safetyResult.passed) {
      return this.config.conflictOverrideAction === 'WAIT' ? 'HOLD' : this.config.conflictOverrideAction;
    }

    // If threat override is active, enforce override action
    if (threatOverride.isActive) {
      return threatOverride.enforcedAction as ExecutionInstruction['action'];
    }

    // If conflicts detected, wait
    if (hif.hasConflicts) {
      this.stats.conflictOverrides++;
      return 'HOLD';
    }

    // Translate recommendedAction to ExecutionInstruction action
    switch (hif.recommendedAction) {
      case 'LONG':
        // Check system mode
        if (hif.systemMode === 'aggressive' && hif.confidence > 75) {
          return 'ENTER_AGGRO_MODE';
        }
        if (hif.systemMode === 'safe' || hif.confidence < 50) {
          return 'ENTER_SCOUT_MODE';
        }
        return 'EXECUTE_LONG';

      case 'SHORT':
        if (hif.systemMode === 'aggressive' && hif.confidence > 75) {
          return 'ENTER_AGGRO_MODE';
        }
        if (hif.systemMode === 'safe' || hif.confidence < 50) {
          return 'ENTER_SCOUT_MODE';
        }
        return 'EXECUTE_SHORT';

      case 'WAIT':
        return 'HOLD';

      default:
        return 'HOLD';
    }
  }

  // ==========================================================================
  // APPLY CONTEXT ADJUSTMENTS
  // ==========================================================================

  private applyContextAdjustments(
    action: ExecutionInstruction['action'],
    context: ExecutionContext,
    hif: HIF
  ): ExecutionInstruction['action'] {
    // If already in position, check if we should reduce or exit
    if (context.currentPosition && context.currentPosition.direction !== 'NONE') {
      const unrealizedPnL = context.currentPosition.unrealizedPnL;

      // If losing position and threat high, close immediately
      if (unrealizedPnL < 0 && hif.threatLevel > 70) {
        return 'CLOSE_IMMEDIATELY';
      }

      // If winning position but confidence dropped, reduce
      if (unrealizedPnL > 0 && hif.confidence < 50) {
        return 'REDUCE_POSITION';
      }

      // If direction mismatch, close or reduce
      const positionDirection = context.currentPosition.direction;
      if (
        (positionDirection === 'LONG' && action === 'EXECUTE_SHORT') ||
        (positionDirection === 'SHORT' && action === 'EXECUTE_LONG')
      ) {
        return 'REDUCE_POSITION';
      }
    }

    // If daily PnL is negative and below max drawdown, avoid market
    if (context.dailyPnL < 0 && Math.abs(context.dailyPnL) > context.maxDrawdown) {
      return 'AVOID_MARKET';
    }

    return action;
  }

  // ==========================================================================
  // FINALIZE ACTION — Create ExecutionInstruction
  // ==========================================================================

  public finalizeAction(
    action: ExecutionInstruction['action'],
    hif: HIF,
    safetyResult: SafetyGateResult,
    context?: ExecutionContext
  ): ExecutionInstruction {
    // Determine urgency
    let urgency: ExecutionInstruction['urgency'] = 'normal';
    if (action === 'CLOSE_IMMEDIATELY' || hif.threatLevel > 80) {
      urgency = 'immediate';
    } else if (action === 'ENTER_SCOUT_MODE' || hif.confidence < 50) {
      urgency = 'patient';
    }

    // Calculate position size based on confidence and system mode
    let positionSize = this.calculatePositionSize(hif, context);

    // Calculate stop loss and take profit
    const { stopLoss, takeProfit } = this.calculateRiskLevels(hif, action);

    // Generate reasoning
    const reasoning = this.generateReasoning(action, hif, safetyResult);

    const instruction: ExecutionInstruction = {
      action,
      confidence: hif.confidence,
      positionSize,
      stopLoss,
      takeProfit,
      urgency,
      reasoning,
      safetyChecks: safetyResult,
      timestamp: Date.now(),
    };

    console.log(`✅ NET Output: ${action} (confidence: ${hif.confidence}, urgency: ${urgency})`);

    return instruction;
  }

  // ==========================================================================
  // CALCULATE POSITION SIZE
  // ==========================================================================

  private calculatePositionSize(hif: HIF, context?: ExecutionContext): number {
    // Base size: 100%
    let size = 100;

    // Adjust for confidence (50-100 confidence → 0.5x-1.0x size)
    const confidenceMultiplier = hif.confidence / 100;
    size *= confidenceMultiplier;

    // Adjust for system mode
    if (hif.systemMode === 'aggressive') {
      size *= this.config.aggressiveModeMultiplier;
    } else if (hif.systemMode === 'safe') {
      size *= this.config.safeModeMultiplier;
    }

    // Cap at 100%
    size = Math.min(size, 100);

    // Minimum 10% for scout mode
    if (size < 10) {
      size = 10;
    }

    return Number(size.toFixed(1));
  }

  // ==========================================================================
  // CALCULATE RISK LEVELS (Stop Loss & Take Profit)
  // ==========================================================================

  private calculateRiskLevels(
    hif: HIF,
    action: ExecutionInstruction['action']
  ): { stopLoss?: number; takeProfit?: number } {
    // Placeholder values (would be calculated from market data)
    // For now, return percentage-based levels

    if (action === 'HOLD' || action === 'AVOID_MARKET') {
      return {};
    }

    // Risk-reward based on confidence
    const riskPercent = hif.confidence > 70 ? 1.5 : hif.confidence > 50 ? 2.0 : 2.5;
    const rewardPercent = riskPercent * 2; // 2:1 reward-risk ratio

    return {
      stopLoss: riskPercent, // Percentage (to be converted to price)
      takeProfit: rewardPercent, // Percentage (to be converted to price)
    };
  }

  // ==========================================================================
  // GENERATE REASONING
  // ==========================================================================

  private generateReasoning(
    action: ExecutionInstruction['action'],
    hif: HIF,
    safetyResult: SafetyGateResult
  ): string {
    if (!safetyResult.passed) {
      return `Action blocked by safety gates: ${safetyResult.blockedReason}`;
    }

    const parts = [
      `HIF recommendation: ${hif.recommendedAction}`,
      `Confidence: ${hif.confidence}/100`,
      `Trade bias: ${(hif.tradeBias * 100).toFixed(0)}%`,
      `Risk level: ${hif.riskLevel}`,
      `Shield state: ${hif.shieldState}`,
    ];

    if (hif.hasConflicts) {
      parts.push('⚠️ Conflicts detected — holding');
    }

    return parts.join(' | ');
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(
    startTime: number,
    safetyResult: SafetyGateResult,
    threatOverride: ThreatOverrideState
  ): void {
    this.stats.lastTranslationTime = Date.now() - startTime;
  }

  // ==========================================================================
  // GET LAST ACTION
  // ==========================================================================

  public getLastAction(): ExecutionInstruction | null {
    return this.lastInstruction;
  }

  // ==========================================================================
  // GET STATISTICS
  // ==========================================================================

  public getStatistics() {
    return { ...this.stats };
  }

  // ==========================================================================
  // GET VERSION
  // ==========================================================================

  public getVersion(): string {
    return '1.0.0 — STEP 24.33';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let translator: NeuralExecutionTranslator | null = null;

export function getNeuralExecutionTranslator(
  config?: Partial<NETConfig>
): NeuralExecutionTranslator {
  if (!translator) {
    translator = new NeuralExecutionTranslator(config);
  }
  return translator;
}

export default getNeuralExecutionTranslator;
