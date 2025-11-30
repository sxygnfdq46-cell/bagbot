/**
 * ⚙️ AUTONOMOUS EXECUTION GOVERNOR (AEG)
 * 
 * STEP 24.35 — Execution Speed & Size Controller
 * 
 * Purpose:
 * AEG is the final decision-maker on HOW execution happens.
 * It doesn't decide IF to execute (that's NET + ERF), but rather:
 * - HOW FAST (speed: FAST, STAGED, SLOW, DELAY)
 * - HOW MUCH (size: FULL, PARTIAL, MICRO)
 * - HOW AGGRESSIVE (aggression: AGGRESSIVE, NEUTRAL, DEFENSIVE, FROZEN)
 * 
 * This prevents:
 * ❌ Executing too fast in dangerous conditions
 * ❌ Using full position size when caution is needed
 * ❌ Being overly aggressive in high-threat environments
 * ❌ Freezing when opportunities are clear
 * 
 * Responsibilities:
 * - Calculate execution speed based on ERF + ESM
 * - Calculate position size based on shield + risk
 * - Calculate aggression level based on threat + shield
 * - Output final execution governance rules
 * 
 * Think of AEG as the "execution throttle" that adapts BagBot's behavior
 * to current market and shield conditions.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Fast execution (<10ms)
 * - Clear execution rules
 */

import type { HIF } from '@/app/lib/harmonizer/types';
import type { ERFValidationResult } from '@/app/lib/erf/types';
import type {
  ExecutionSpeed,
  ExecutionSize,
  AggressionMode,
  GovernorResult,
  GovernorContext,
  AEGConfig,
} from './types';

// ============================================================================
// AUTONOMOUS EXECUTION GOVERNOR CLASS
// ============================================================================

export class AutonomousExecutionGovernor {
  private config: AEGConfig;
  private lastResult: GovernorResult | null = null;
  private evaluationCount: number = 0;

  // Statistics
  private stats = {
    totalEvaluations: 0,
    allowedCount: 0,
    deniedCount: 0,
    fastExecutions: 0,
    stagedExecutions: 0,
    slowExecutions: 0,
    delayedExecutions: 0,
    fullSizeExecutions: 0,
    partialSizeExecutions: 0,
    microSizeExecutions: 0,
    aggressiveMode: 0,
    neutralMode: 0,
    defensiveMode: 0,
    frozenMode: 0,
    lastEvaluationTime: 0,
  };

  constructor(config?: Partial<AEGConfig>) {
    this.config = {
      enableSpeedControl: config?.enableSpeedControl ?? true,
      enableSizeControl: config?.enableSizeControl ?? true,
      enableAggressionControl: config?.enableAggressionControl ?? true,
      speedWeights: config?.speedWeights || {
        erfStatus: 0.4,
        esmHealth: 0.3,
        volatility: 0.2,
        latency: 0.1,
      },
      sizeWeights: config?.sizeWeights || {
        shieldState: 0.35,
        riskLevel: 0.30,
        confidence: 0.25,
        survivalScore: 0.10,
      },
      aggressionWeights: config?.aggressionWeights || {
        threatLevel: 0.40,
        shieldState: 0.30,
        confidence: 0.20,
        volatility: 0.10,
      },
      thresholds: config?.thresholds || {
        fastSpeedMin: 80,
        stagedSpeedMin: 60,
        slowSpeedMin: 40,
        fullSizeMin: 75,
        partialSizeMin: 50,
        aggressiveMin: 70,
        neutralMin: 40,
        defensiveMin: 20,
      },
    };

    console.log('⚙️ AutonomousExecutionGovernor initialized');
  }

  // ==========================================================================
  // COMPUTE FINAL EXECUTION RULE — Main Entry Point
  // ==========================================================================

  public computeFinalExecutionRule(
    erfStatus: ERFValidationResult,
    esmStatus: any, // ESM status (survival score, path, etc.)
    hif: HIF
  ): GovernorResult {
    const startTime = Date.now();
    this.evaluationCount++;
    this.stats.totalEvaluations++;

    console.log(`⚙️ AEG Evaluation #${this.evaluationCount} — Computing execution governance...`);

    // Build context
    const context: GovernorContext = {
      erfStatus,
      esmStatus,
      hif,
      timestamp: Date.now(),
    };

    // Step 1: Calculate execution speed
    const speed = this.calculateExecutionSpeed(erfStatus, esmStatus);

    // Step 2: Calculate execution size
    const size = this.calculateExecutionSize(hif.shieldState, hif.riskLevel, hif.confidence, esmStatus);

    // Step 3: Calculate aggression level
    const aggression = this.calculateAggressionLevel(hif.threatLevel, hif.shieldState, hif.confidence);

    // Step 4: Determine if execution is allowed
    const allowed = this.determineAllowed(erfStatus, esmStatus, speed, aggression);

    // Step 5: Generate reasoning
    const reasoning = this.generateReasoning(speed, size, aggression, allowed, context);

    // Create result
    const result: GovernorResult = {
      speed,
      size,
      aggression,
      allowed,
      reasoning,
      context,
      evaluationTime: Date.now() - startTime,
      timestamp: Date.now(),
    };

    // Update statistics
    this.updateStatistics(result);

    // Store result
    this.lastResult = result;

    console.log(
      `✅ AEG Result: ${allowed ? '✓ ALLOWED' : '✗ DENIED'} | Speed: ${speed} | Size: ${size} | Aggression: ${aggression}`
    );

    return result;
  }

  // ==========================================================================
  // CALCULATE EXECUTION SPEED
  // ==========================================================================

  public calculateExecutionSpeed(
    erfStatus: ERFValidationResult,
    esmStatus: any
  ): ExecutionSpeed {
    if (!this.config.enableSpeedControl) {
      return 'FAST';
    }

    const weights = this.config.speedWeights;
    let speedScore = 0;

    // Factor 1: ERF status (40% weight)
    const erfScore =
      erfStatus.filterDecision === 'OK' ? 100 :
      erfStatus.filterDecision === 'DELAY' ? 40 :
      erfStatus.filterDecision === 'MODIFY' ? 60 :
      20; // ABORT
    speedScore += erfScore * weights.erfStatus;

    // Factor 2: ESM health (30% weight)
    const esmHealth = esmStatus?.survivalScore || 50;
    speedScore += esmHealth * weights.esmHealth;

    // Factor 3: Volatility (20% weight)
    const volatilityScore =
      erfStatus.marketSyncState === 'FULLY_SYNCED' ? 100 :
      erfStatus.marketSyncState === 'MOSTLY_SYNCED' ? 70 :
      erfStatus.marketSyncState === 'PARTIALLY_SYNCED' ? 40 :
      20;
    speedScore += volatilityScore * weights.volatility;

    // Factor 4: Latency (10% weight)
    const latencyScore =
      erfStatus.latencyStatus === 'EXCELLENT' ? 100 :
      erfStatus.latencyStatus === 'GOOD' ? 80 :
      erfStatus.latencyStatus === 'ACCEPTABLE' ? 60 :
      erfStatus.latencyStatus === 'DEGRADED' ? 30 :
      10;
    speedScore += latencyScore * weights.latency;

    // Determine speed based on score
    const thresholds = this.config.thresholds;
    if (speedScore >= thresholds.fastSpeedMin) return 'FAST';
    if (speedScore >= thresholds.stagedSpeedMin) return 'STAGED';
    if (speedScore >= thresholds.slowSpeedMin) return 'SLOW';
    return 'DELAY';
  }

  // ==========================================================================
  // CALCULATE EXECUTION SIZE
  // ==========================================================================

  public calculateExecutionSize(
    shieldState: HIF['shieldState'],
    riskLevel: HIF['riskLevel'],
    confidence: number,
    esmStatus: any
  ): ExecutionSize {
    if (!this.config.enableSizeControl) {
      return 'FULL';
    }

    const weights = this.config.sizeWeights;
    let sizeScore = 0;

    // Factor 1: Shield state (35% weight)
    const shieldScore =
      shieldState === 'CALM' ? 100 :
      shieldState === 'PROTECTIVE' ? 70 :
      shieldState === 'AGGRO_OBS' ? 85 :
      30; // DEFENSIVE
    sizeScore += shieldScore * weights.shieldState;

    // Factor 2: Risk level (30% weight)
    const riskScore =
      riskLevel === 'low' ? 100 :
      riskLevel === 'medium' ? 60 :
      30; // high
    sizeScore += riskScore * weights.riskLevel;

    // Factor 3: Confidence (25% weight)
    sizeScore += confidence * weights.confidence;

    // Factor 4: Survival score (10% weight)
    const survivalScore = esmStatus?.survivalScore || 50;
    sizeScore += survivalScore * weights.survivalScore;

    // Determine size based on score
    const thresholds = this.config.thresholds;
    if (sizeScore >= thresholds.fullSizeMin) return 'FULL';
    if (sizeScore >= thresholds.partialSizeMin) return 'PARTIAL';
    return 'MICRO';
  }

  // ==========================================================================
  // CALCULATE AGGRESSION LEVEL
  // ==========================================================================

  public calculateAggressionLevel(
    threatLevel: number,
    shieldState: HIF['shieldState'],
    confidence: number
  ): AggressionMode {
    if (!this.config.enableAggressionControl) {
      return 'NEUTRAL';
    }

    const weights = this.config.aggressionWeights;
    let aggressionScore = 0;

    // Factor 1: Threat level (40% weight) - INVERSE
    const threatScore = 100 - threatLevel; // Lower threat = higher aggression
    aggressionScore += threatScore * weights.threatLevel;

    // Factor 2: Shield state (30% weight)
    const shieldScore =
      shieldState === 'AGGRO_OBS' ? 100 :
      shieldState === 'CALM' ? 70 :
      shieldState === 'PROTECTIVE' ? 50 :
      20; // DEFENSIVE
    aggressionScore += shieldScore * weights.shieldState;

    // Factor 3: Confidence (20% weight)
    aggressionScore += confidence * weights.confidence;

    // Factor 4: Volatility (10% weight) - placeholder
    const volatilityScore = 50; // Would come from ERF
    aggressionScore += volatilityScore * weights.volatility;

    // Determine aggression based on score
    const thresholds = this.config.thresholds;
    if (aggressionScore >= thresholds.aggressiveMin) return 'AGGRESSIVE';
    if (aggressionScore >= thresholds.neutralMin) return 'NEUTRAL';
    if (aggressionScore >= thresholds.defensiveMin) return 'DEFENSIVE';
    return 'FROZEN';
  }

  // ==========================================================================
  // DETERMINE ALLOWED
  // ==========================================================================

  private determineAllowed(
    erfStatus: ERFValidationResult,
    esmStatus: any,
    speed: ExecutionSpeed,
    aggression: AggressionMode
  ): boolean {
    // Rule 1: ERF must not abort
    if (erfStatus.filterDecision === 'ABORT') {
      return false;
    }

    // Rule 2: Cannot be frozen
    if (aggression === 'FROZEN') {
      return false;
    }

    // Rule 3: Speed cannot be DELAY
    if (speed === 'DELAY') {
      return false;
    }

    // Rule 4: ESM survival score must be > 20
    const survivalScore = esmStatus?.survivalScore || 0;
    if (survivalScore < 20) {
      return false;
    }

    // Rule 5: ERF market sync must not be completely out of sync
    if (erfStatus.marketSyncState === 'OUT_OF_SYNC') {
      return false;
    }

    return true;
  }

  // ==========================================================================
  // GENERATE REASONING
  // ==========================================================================

  private generateReasoning(
    speed: ExecutionSpeed,
    size: ExecutionSize,
    aggression: AggressionMode,
    allowed: boolean,
    context: GovernorContext
  ): string {
    if (!allowed) {
      const reasons: string[] = [];
      
      if (context.erfStatus.filterDecision === 'ABORT') {
        reasons.push('ERF aborted execution');
      }
      if (aggression === 'FROZEN') {
        reasons.push('Aggression level is FROZEN');
      }
      if (speed === 'DELAY') {
        reasons.push('Execution speed is DELAY');
      }
      if ((context.esmStatus?.survivalScore || 0) < 20) {
        reasons.push('ESM survival score too low');
      }
      if (context.erfStatus.marketSyncState === 'OUT_OF_SYNC') {
        reasons.push('Market out of sync');
      }

      return `Execution DENIED: ${reasons.join(', ')}`;
    }

    return `Execution ALLOWED: Speed=${speed}, Size=${size}, Aggression=${aggression} | ERF=${context.erfStatus.filterDecision}, Shield=${context.hif.shieldState}, Threat=${context.hif.threatLevel}`;
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(result: GovernorResult): void {
    this.stats.lastEvaluationTime = result.evaluationTime;

    if (result.allowed) {
      this.stats.allowedCount++;
    } else {
      this.stats.deniedCount++;
    }

    // Speed stats
    switch (result.speed) {
      case 'FAST':
        this.stats.fastExecutions++;
        break;
      case 'STAGED':
        this.stats.stagedExecutions++;
        break;
      case 'SLOW':
        this.stats.slowExecutions++;
        break;
      case 'DELAY':
        this.stats.delayedExecutions++;
        break;
    }

    // Size stats
    switch (result.size) {
      case 'FULL':
        this.stats.fullSizeExecutions++;
        break;
      case 'PARTIAL':
        this.stats.partialSizeExecutions++;
        break;
      case 'MICRO':
        this.stats.microSizeExecutions++;
        break;
    }

    // Aggression stats
    switch (result.aggression) {
      case 'AGGRESSIVE':
        this.stats.aggressiveMode++;
        break;
      case 'NEUTRAL':
        this.stats.neutralMode++;
        break;
      case 'DEFENSIVE':
        this.stats.defensiveMode++;
        break;
      case 'FROZEN':
        this.stats.frozenMode++;
        break;
    }
  }

  // ==========================================================================
  // GET GOVERNOR STATE
  // ==========================================================================

  public getGovernorState(): GovernorResult | null {
    return this.lastResult;
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
    return '1.0.0 — STEP 24.35';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let governor: AutonomousExecutionGovernor | null = null;

export function getAutonomousExecutionGovernor(
  config?: Partial<AEGConfig>
): AutonomousExecutionGovernor {
  if (!governor) {
    governor = new AutonomousExecutionGovernor(config);
  }
  return governor;
}

export default getAutonomousExecutionGovernor;
