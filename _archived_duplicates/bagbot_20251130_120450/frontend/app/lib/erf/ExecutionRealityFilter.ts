/**
 * 🛡️ EXECUTION REALITY FILTER (ERF)
 * 
 * STEP 24.34 — Market Reality Check Layer
 * 
 * Purpose:
 * ERF is the final reality check before execution. It validates that the action
 * from NET is actually safe and viable in CURRENT market conditions.
 * 
 * This prevents:
 * ❌ Trading into distorted markets
 * ❌ Executing during volatility spikes
 * ❌ Acting on stale data (latency issues)
 * ❌ Trading against major trend shifts
 * ❌ Ignoring real-time market anomalies
 * 
 * Responsibilities:
 * - Validate market state in real-time
 * - Check volatility conditions
 * - Detect latency/staleness issues
 * - Verify trend synchronization
 * - Detect market distortions
 * - Output: OK, DELAY, ABORT, or MODIFY
 * 
 * Think of ERF as the "sanity checkpoint" between intelligence and execution.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Fast execution (<20ms)
 * - Clear action recommendations
 */

import type { HIF, ExecutionInstruction } from '@/app/lib/harmonizer/types';
import type {
  RealityFilteredAction,
  DistortionType,
  MarketSyncState,
  LatencyStatus,
  ERFValidationResult,
  ERFConfig,
} from './types';

// ============================================================================
// EXECUTION REALITY FILTER CLASS
// ============================================================================

export class ExecutionRealityFilter {
  private config: ERFConfig;
  private lastStatus: ERFValidationResult | null = null;
  private validationCount: number = 0;

  // Market state tracking
  private lastMarketUpdate: number = Date.now();
  private volatilityHistory: number[] = [];
  private trendHistory: Array<{ timestamp: number; bias: number }> = [];

  // Statistics
  private stats = {
    totalValidations: 0,
    okCount: 0,
    delayCount: 0,
    abortCount: 0,
    modifyCount: 0,
    distortionsDetected: 0,
    latencyIssues: 0,
    lastValidationTime: 0,
  };

  constructor(config?: Partial<ERFConfig>) {
    this.config = {
      maxLatencyMs: config?.maxLatencyMs ?? 2000, // 2 seconds max staleness
      volatilityThreshold: config?.volatilityThreshold ?? 85, // 0-100
      distortionSensitivity: config?.distortionSensitivity ?? 0.7, // 0-1
      trendSyncWindow: config?.trendSyncWindow ?? 5000, // 5 seconds
      minConfidenceForExecution: config?.minConfidenceForExecution ?? 55,
      enableVolatilityCheck: config?.enableVolatilityCheck ?? true,
      enableLatencyCheck: config?.enableLatencyCheck ?? true,
      enableTrendSyncCheck: config?.enableTrendSyncCheck ?? true,
      enableDistortionDetection: config?.enableDistortionDetection ?? true,
    };

    console.log('🛡️ ExecutionRealityFilter initialized');
  }

  // ==========================================================================
  // VALIDATE MARKET — Main Entry Point
  // ==========================================================================

  public validateMarket(hif: HIF, action: ExecutionInstruction): ERFValidationResult {
    const startTime = Date.now();
    this.validationCount++;
    this.stats.totalValidations++;

    console.log(`🛡️ ERF Validation #${this.validationCount} — Checking market reality...`);

    // Step 1: Quick confidence check
    if (hif.confidence < this.config.minConfidenceForExecution) {
      return this.createResult('ABORT', 'LOW_CONFIDENCE', hif, action, startTime);
    }

    // Step 2: Check volatility
    const volatilityCheck = this.checkVolatility(hif);
    if (!volatilityCheck.passed) {
      return this.createResult('DELAY', volatilityCheck.reason as DistortionType, hif, action, startTime);
    }

    // Step 3: Check latency
    const latencyCheck = this.checkLatency();
    if (!latencyCheck.passed) {
      return this.createResult('ABORT', latencyCheck.reason as DistortionType, hif, action, startTime);
    }

    // Step 4: Check trend synchronization
    const trendCheck = this.checkTrendSync(hif);
    if (!trendCheck.passed) {
      return this.createResult('MODIFY', trendCheck.reason as DistortionType, hif, action, startTime);
    }

    // Step 5: Detect market distortion
    const distortionCheck = this.detectMarketDistortion(hif);
    if (distortionCheck.detected) {
      return this.createResult('DELAY', distortionCheck.distortionType!, hif, action, startTime);
    }

    // Step 6: Finalize decision
    const finalResult = this.finalize(action, hif, startTime);

    console.log(`✅ ERF Result: ${finalResult.filterDecision} — Market validation complete`);
    return finalResult;
  }

  // ==========================================================================
  // CHECK VOLATILITY
  // ==========================================================================

  public checkVolatility(hif: HIF): { passed: boolean; reason?: string } {
    if (!this.config.enableVolatilityCheck) {
      return { passed: true };
    }

    // Convert volatility status to numeric score
    const volatilityScore =
      hif.volatilityStatus === 'high' ? 90 : hif.volatilityStatus === 'medium' ? 50 : 20;

    // Store in history
    this.volatilityHistory.push(volatilityScore);
    if (this.volatilityHistory.length > 10) {
      this.volatilityHistory.shift();
    }

    // Calculate average volatility
    const avgVolatility =
      this.volatilityHistory.reduce((sum, v) => sum + v, 0) / this.volatilityHistory.length;

    // Check if volatility is too high
    if (avgVolatility > this.config.volatilityThreshold) {
      console.warn(`⚠️ ERF: Volatility too high (${avgVolatility.toFixed(1)})`);
      return {
        passed: false,
        reason: 'VOLATILITY_SPIKE',
      };
    }

    // Check for sudden volatility spike
    if (this.volatilityHistory.length >= 3) {
      const recent = this.volatilityHistory.slice(-3);
      const sudden = recent[2] - recent[0] > 40; // 40+ point jump

      if (sudden) {
        console.warn('⚠️ ERF: Sudden volatility spike detected');
        return {
          passed: false,
          reason: 'VOLATILITY_SPIKE',
        };
      }
    }

    return { passed: true };
  }

  // ==========================================================================
  // CHECK LATENCY
  // ==========================================================================

  public checkLatency(): { passed: boolean; reason?: string; latencyMs?: number } {
    if (!this.config.enableLatencyCheck) {
      return { passed: true };
    }

    const now = Date.now();
    const latencyMs = now - this.lastMarketUpdate;

    // Update last market timestamp
    this.lastMarketUpdate = now;

    // Check if data is stale
    if (latencyMs > this.config.maxLatencyMs) {
      console.warn(`⚠️ ERF: Stale data detected (${latencyMs}ms latency)`);
      this.stats.latencyIssues++;
      return {
        passed: false,
        reason: 'STALE_DATA',
        latencyMs,
      };
    }

    // Check for extreme latency (>5 seconds)
    if (latencyMs > 5000) {
      console.error(`❌ ERF: Extreme latency detected (${latencyMs}ms)`);
      return {
        passed: false,
        reason: 'EXTREME_LATENCY',
        latencyMs,
      };
    }

    return { passed: true, latencyMs };
  }

  // ==========================================================================
  // CHECK TREND SYNC
  // ==========================================================================

  public checkTrendSync(hif: HIF): { passed: boolean; reason?: string } {
    if (!this.config.enableTrendSyncCheck) {
      return { passed: true };
    }

    const now = Date.now();

    // Add current trend to history
    this.trendHistory.push({
      timestamp: now,
      bias: hif.tradeBias,
    });

    // Keep only recent history (within trendSyncWindow)
    this.trendHistory = this.trendHistory.filter(
      (t) => now - t.timestamp < this.config.trendSyncWindow
    );

    // Need at least 3 data points
    if (this.trendHistory.length < 3) {
      return { passed: true };
    }

    // Check for trend reversal
    const recent = this.trendHistory.slice(-3);
    const wasBullish = recent[0].bias > 0.3;
    const wasBearish = recent[0].bias < -0.3;
    const nowBullish = recent[2].bias > 0.3;
    const nowBearish = recent[2].bias < -0.3;

    if ((wasBullish && nowBearish) || (wasBearish && nowBullish)) {
      console.warn('⚠️ ERF: Trend reversal detected');
      return {
        passed: false,
        reason: 'TREND_REVERSAL',
      };
    }

    // Check for trend instability (high variance)
    const biases = this.trendHistory.map((t) => t.bias);
    const mean = biases.reduce((sum, b) => sum + b, 0) / biases.length;
    const variance =
      biases.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / biases.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0.5) {
      // High variance in trend
      console.warn('⚠️ ERF: Trend instability detected');
      return {
        passed: false,
        reason: 'TREND_INSTABILITY',
      };
    }

    return { passed: true };
  }

  // ==========================================================================
  // DETECT MARKET DISTORTION
  // ==========================================================================

  public detectMarketDistortion(hif: HIF): {
    detected: boolean;
    distortionType?: DistortionType;
    severity?: number;
  } {
    if (!this.config.enableDistortionDetection) {
      return { detected: false };
    }

    // Check for conflicting signals (already flagged by SNHL)
    if (hif.hasConflicts) {
      this.stats.distortionsDetected++;
      return {
        detected: true,
        distortionType: 'CONFLICTING_SIGNALS',
        severity: 0.8,
      };
    }

    // Check for extreme threat levels
    if (hif.threatLevel > 85) {
      this.stats.distortionsDetected++;
      return {
        detected: true,
        distortionType: 'EXTREME_THREAT',
        severity: hif.threatLevel / 100,
      };
    }

    // Check for low confidence with high bias (suspicious)
    if (Math.abs(hif.tradeBias) > 0.7 && hif.confidence < 50) {
      this.stats.distortionsDetected++;
      return {
        detected: true,
        distortionType: 'CONFIDENCE_MISMATCH',
        severity: 0.6,
      };
    }

    // Check for defensive shield state with aggressive recommendation
    if (hif.shieldState === 'DEFENSIVE' && hif.recommendedAction !== 'WAIT') {
      this.stats.distortionsDetected++;
      return {
        detected: true,
        distortionType: 'SHIELD_MISMATCH',
        severity: 0.7,
      };
    }

    // Check system mode vs risk level mismatch
    if (hif.systemMode === 'safe' && hif.riskLevel === 'high') {
      this.stats.distortionsDetected++;
      return {
        detected: true,
        distortionType: 'MODE_RISK_MISMATCH',
        severity: 0.5,
      };
    }

    return { detected: false };
  }

  // ==========================================================================
  // FINALIZE — Create final validation result
  // ==========================================================================

  public finalize(
    action: ExecutionInstruction,
    hif: HIF,
    startTime: number
  ): ERFValidationResult {
    // All checks passed — action is OK
    const result: ERFValidationResult = {
      filterDecision: 'OK',
      originalAction: action.action,
      modifiedAction: action.action,
      distortionType: null,
      marketSyncState: this.calculateMarketSyncState(hif),
      latencyStatus: this.calculateLatencyStatus(),
      confidence: hif.confidence,
      validationTime: Date.now() - startTime,
      timestamp: Date.now(),
      reason: 'All reality checks passed',
    };

    this.lastStatus = result;
    this.stats.okCount++;
    this.stats.lastValidationTime = result.validationTime;

    return result;
  }

  // ==========================================================================
  // CREATE RESULT — Helper for creating validation results
  // ==========================================================================

  private createResult(
    decision: RealityFilteredAction,
    distortionType: DistortionType,
    hif: HIF,
    action: ExecutionInstruction,
    startTime: number
  ): ERFValidationResult {
    let modifiedAction = action.action;
    let reason = '';

    // Determine modified action based on decision
    switch (decision) {
      case 'ABORT':
        modifiedAction = 'HOLD';
        reason = `Execution aborted: ${distortionType}`;
        this.stats.abortCount++;
        break;
      case 'DELAY':
        modifiedAction = 'HOLD';
        reason = `Execution delayed: ${distortionType}`;
        this.stats.delayCount++;
        break;
      case 'MODIFY':
        modifiedAction = this.suggestModifiedAction(action.action, distortionType);
        reason = `Execution modified: ${distortionType}`;
        this.stats.modifyCount++;
        break;
      default:
        reason = 'Unknown decision';
    }

    const result: ERFValidationResult = {
      filterDecision: decision,
      originalAction: action.action,
      modifiedAction,
      distortionType,
      marketSyncState: this.calculateMarketSyncState(hif),
      latencyStatus: this.calculateLatencyStatus(),
      confidence: hif.confidence,
      validationTime: Date.now() - startTime,
      timestamp: Date.now(),
      reason,
    };

    this.lastStatus = result;
    this.stats.lastValidationTime = result.validationTime;

    console.warn(`⚠️ ERF Decision: ${decision} — ${reason}`);

    return result;
  }

  // ==========================================================================
  // SUGGEST MODIFIED ACTION
  // ==========================================================================

  private suggestModifiedAction(
    originalAction: ExecutionInstruction['action'],
    distortionType: DistortionType
  ): ExecutionInstruction['action'] {
    // Modify action based on distortion type
    switch (distortionType) {
      case 'TREND_REVERSAL':
        return 'HOLD'; // Wait for trend to stabilize

      case 'TREND_INSTABILITY':
        return 'ENTER_SCOUT_MODE'; // Reduce position size

      case 'CONFIDENCE_MISMATCH':
        return 'HOLD'; // Wait for better signal

      case 'SHIELD_MISMATCH':
        return 'HOLD'; // Respect shield state

      case 'MODE_RISK_MISMATCH':
        return 'ENTER_SCOUT_MODE'; // Small position

      default:
        return 'HOLD';
    }
  }

  // ==========================================================================
  // CALCULATE MARKET SYNC STATE
  // ==========================================================================

  private calculateMarketSyncState(hif: HIF): MarketSyncState {
    const volatilityOk = hif.volatilityStatus !== 'high';
    const threatOk = hif.threatLevel < 70;
    const confidenceOk = hif.confidence > 50;
    const shieldOk = hif.shieldState !== 'DEFENSIVE';

    const score = [volatilityOk, threatOk, confidenceOk, shieldOk].filter(Boolean).length;

    if (score === 4) return 'FULLY_SYNCED';
    if (score >= 3) return 'MOSTLY_SYNCED';
    if (score >= 2) return 'PARTIALLY_SYNCED';
    return 'OUT_OF_SYNC';
  }

  // ==========================================================================
  // CALCULATE LATENCY STATUS
  // ==========================================================================

  private calculateLatencyStatus(): LatencyStatus {
    const latencyMs = Date.now() - this.lastMarketUpdate;

    if (latencyMs < 500) return 'EXCELLENT';
    if (latencyMs < 1000) return 'GOOD';
    if (latencyMs < 2000) return 'ACCEPTABLE';
    if (latencyMs < 5000) return 'DEGRADED';
    return 'CRITICAL';
  }

  // ==========================================================================
  // GET LAST STATUS
  // ==========================================================================

  public getLastStatus(): ERFValidationResult | null {
    return this.lastStatus;
  }

  // ==========================================================================
  // GET STATISTICS
  // ==========================================================================

  public getStatistics() {
    return { ...this.stats };
  }

  // ==========================================================================
  // RESET HISTORY
  // ==========================================================================

  public resetHistory(): void {
    this.volatilityHistory = [];
    this.trendHistory = [];
    console.log('🔄 ERF history reset');
  }

  // ==========================================================================
  // GET VERSION
  // ==========================================================================

  public getVersion(): string {
    return '1.0.0 — STEP 24.34';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let filter: ExecutionRealityFilter | null = null;

export function getExecutionRealityFilter(
  config?: Partial<ERFConfig>
): ExecutionRealityFilter {
  if (!filter) {
    filter = new ExecutionRealityFilter(config);
  }
  return filter;
}

export default getExecutionRealityFilter;
