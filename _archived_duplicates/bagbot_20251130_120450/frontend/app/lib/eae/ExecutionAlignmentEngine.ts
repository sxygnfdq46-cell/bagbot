/**
 * ⏰ EXECUTION ALIGNMENT ENGINE (EAE)
 * 
 * STEP 24.38 — Execution Alignment Engine
 * 
 * Purpose:
 * EAE is the final timing optimizer before execution. It analyzes market rhythm,
 * liquidity pulse, and kill zones to determine the PERFECT moment to execute.
 * 
 * This prevents:
 * ❌ Executing at bad times (low liquidity, unfavorable rhythm)
 * ❌ Missing optimal execution windows
 * ❌ Entering during unfavorable kill zones
 * ❌ Poor timing leading to slippage
 * ❌ Oversized positions during weak market phases
 * 
 * Responsibilities:
 * - Analyze market rhythm (heartbeat, micro-cycles, volatility waves)
 * - Detect liquidity pulse (orderbook flow direction and strength)
 * - Identify kill zones (time-based trading sessions)
 * - Compute optimal timing window
 * - Compute recommended position sizing
 * - Align all factors into go/no-go decision
 * 
 * Think of EAE as the "execution conductor" - orchestrating all timing
 * factors to ensure trades execute at the most favorable moment.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Fast execution (<20ms)
 * - Transparent timing logic
 */

import type {
  EAETiming,
  EAEContext,
  EAEConfig,
  EAEStatistics,
  RhythmData,
  LiquidityPulse,
  KillZoneInfo,
  TimingWindow,
  ExecutionSizing,
  SyncState,
  CandleData,
  OrderbookData,
} from './types';
import {
  calculateMarketHeartbeat,
  detectMicroCycles,
  detectVolatilityWaves,
  calculateRhythmScore,
  detectRhythmAlignment,
} from './rhythm';
import {
  calculateLiquidityPulse,
  detectPulseAlignment,
  calculateLiquidityScore,
} from './liquidityPulse';

// ============================================================================
// EXECUTION ALIGNMENT ENGINE CLASS
// ============================================================================

export class ExecutionAlignmentEngine {
  private config: EAEConfig;
  private lastTiming: EAETiming | null = null;
  private evaluationCount: number = 0;

  // Statistics
  private stats: EAEStatistics = {
    totalEvaluations: 0,
    executionsAllowed: 0,
    executionsBlocked: 0,
    averageTimingScore: 0,
    averageSyncState: 'NEUTRAL',
    rhythmAlignmentRate: 0,
    liquidityAlignmentRate: 0,
    killZoneHitRate: 0,
    lastEvaluationTime: 0,
  };

  constructor(config?: Partial<EAEConfig>) {
    this.config = {
      enableRhythmAnalysis: config?.enableRhythmAnalysis ?? true,
      enableLiquidityPulse: config?.enableLiquidityPulse ?? true,
      enableKillZones: config?.enableKillZones ?? true,
      minTimingScore: config?.minTimingScore ?? 60,
      minSyncState: config?.minSyncState ?? 'NEUTRAL',
      rhythmWeight: config?.rhythmWeight ?? 0.35,
      liquidityWeight: config?.liquidityWeight ?? 0.35,
      killZoneWeight: config?.killZoneWeight ?? 0.30,
      windowDuration: config?.windowDuration ?? 300000, // 5 minutes
      baseSizing: config?.baseSizing ?? 0.5,
      maxSizing: config?.maxSizing ?? 1.0,
      minSizing: config?.minSizing ?? 0.1,
    };

    console.log('⏰ ExecutionAlignmentEngine initialized');
  }

  // ==========================================================================
  // ANALYZE MARKET RHYTHM
  // ==========================================================================

  public analyzeMarketRhythm(context: EAEContext): RhythmData {
    const candles = context.candleData || [];

    if (!this.config.enableRhythmAnalysis || candles.length < 5) {
      return {
        heartbeat: 0,
        microCycles: [],
        volatilityWaves: [],
        currentPhase: 'NEUTRAL',
        phaseStrength: 0,
        rhythmScore: 0,
        lastPulse: Date.now(),
        nextExpectedPulse: Date.now() + 60000,
      };
    }

    // Calculate market heartbeat
    const heartbeatData = calculateMarketHeartbeat(candles);

    // Detect micro-cycles
    const microCycles = detectMicroCycles(candles);

    // Detect volatility waves
    const volatilityWaves = detectVolatilityWaves(context);

    // Determine current phase
    let currentPhase: 'EXPANSION' | 'CONTRACTION' | 'NEUTRAL' = 'NEUTRAL';
    let phaseStrength = 0;

    if (microCycles.length > 0) {
      const recentCycle = microCycles[microCycles.length - 1];
      if (recentCycle.direction === 'UP' && recentCycle.confidence > 60) {
        currentPhase = 'EXPANSION';
        phaseStrength = recentCycle.confidence;
      } else if (recentCycle.direction === 'DOWN' && recentCycle.confidence > 60) {
        currentPhase = 'CONTRACTION';
        phaseStrength = recentCycle.confidence;
      }
    }

    const rhythmData: RhythmData = {
      heartbeat: heartbeatData.interval,
      microCycles,
      volatilityWaves,
      currentPhase,
      phaseStrength,
      rhythmScore: heartbeatData.strength,
      lastPulse: heartbeatData.lastBeat,
      nextExpectedPulse: heartbeatData.nextExpectedBeat,
    };

    return rhythmData;
  }

  // ==========================================================================
  // DETECT LIQUIDITY PULSE
  // ==========================================================================

  public detectLiquidityPulse(orderbook?: OrderbookData): LiquidityPulse {
    if (!this.config.enableLiquidityPulse || !orderbook) {
      return {
        direction: 'NEUTRAL',
        strength: 0,
        depth: 0,
        imbalance: 0,
        pulseRate: 0,
        lastPulse: Date.now(),
        coherence: 0,
        flowVelocity: 0,
      };
    }

    return calculateLiquidityPulse(orderbook);
  }

  // ==========================================================================
  // DETECT KILL ZONES
  // ==========================================================================

  public detectKillZones(context: EAEContext): KillZoneInfo[] {
    if (!this.config.enableKillZones) {
      return [];
    }

    const now = Date.now();
    const currentHour = new Date(now).getUTCHours();

    const zones: KillZoneInfo[] = [];

    // London Session (08:00 - 17:00 UTC)
    zones.push({
      name: 'London Session',
      startTime: now,
      endTime: now,
      favorability: currentHour >= 8 && currentHour < 17 ? 90 : 40,
      volatilityExpected: currentHour >= 8 && currentHour < 17 ? 'HIGH' : 'LOW',
      liquidityExpected: currentHour >= 8 && currentHour < 17 ? 'HIGH' : 'LOW',
      isActive: currentHour >= 8 && currentHour < 17,
      reason: 'European market hours - high liquidity',
    });

    // New York Session (13:00 - 22:00 UTC)
    zones.push({
      name: 'New York Session',
      startTime: now,
      endTime: now,
      favorability: currentHour >= 13 && currentHour < 22 ? 90 : 40,
      volatilityExpected: currentHour >= 13 && currentHour < 22 ? 'HIGH' : 'LOW',
      liquidityExpected: currentHour >= 13 && currentHour < 22 ? 'HIGH' : 'LOW',
      isActive: currentHour >= 13 && currentHour < 22,
      reason: 'US market hours - high liquidity',
    });

    // Asian Session (00:00 - 09:00 UTC)
    zones.push({
      name: 'Asian Session',
      startTime: now,
      endTime: now,
      favorability: currentHour >= 0 && currentHour < 9 ? 60 : 30,
      volatilityExpected: currentHour >= 0 && currentHour < 9 ? 'MEDIUM' : 'LOW',
      liquidityExpected: currentHour >= 0 && currentHour < 9 ? 'MEDIUM' : 'LOW',
      isActive: currentHour >= 0 && currentHour < 9,
      reason: 'Asian market hours - moderate liquidity',
    });

    return zones;
  }

  // ==========================================================================
  // COMPUTE TIMING WINDOW
  // ==========================================================================

  public computeTimingWindow(
    rhythm: RhythmData,
    liquidity: LiquidityPulse
  ): TimingWindow {
    const now = Date.now();

    // Base window: 5 minutes
    const duration = this.config.windowDuration;

    // Adjust window based on rhythm
    const rhythmAligned = detectRhythmAlignment(rhythm);
    const liquidityAligned = liquidity.strength >= 50;

    let score = 50;

    if (rhythmAligned) score += 25;
    if (liquidityAligned) score += 25;

    const reason =
      rhythmAligned && liquidityAligned
        ? 'Rhythm and liquidity aligned - optimal window'
        : rhythmAligned
        ? 'Rhythm aligned - good window'
        : liquidityAligned
        ? 'Liquidity aligned - acceptable window'
        : 'Sub-optimal window - low alignment';

    return {
      start: now,
      end: now + duration,
      duration,
      score,
      reason,
      factors: {
        rhythm: rhythmAligned,
        liquidity: liquidityAligned,
        killZone: true, // Placeholder
      },
    };
  }

  // ==========================================================================
  // COMPUTE SIZING
  // ==========================================================================

  public computeSizing(timingScore: number): ExecutionSizing {
    const baseSizing = this.config.baseSizing;
    const maxSizing = this.config.maxSizing;
    const minSizing = this.config.minSizing;

    // Adjust sizing based on timing score
    const adjustmentFactor = timingScore / 100;

    let recommendedSize = baseSizing * adjustmentFactor;

    // Clamp to min/max
    recommendedSize = Math.max(minSizing, Math.min(maxSizing, recommendedSize));

    const reason =
      timingScore >= 80
        ? 'Excellent timing - full position size'
        : timingScore >= 60
        ? 'Good timing - standard position size'
        : 'Weak timing - reduced position size';

    return {
      recommendedSize: Math.round(recommendedSize * 100) / 100,
      minSize: minSizing,
      maxSize: maxSizing,
      adjustmentFactor,
      reason,
    };
  }

  // ==========================================================================
  // ALIGN EXECUTION — Main Entry Point
  // ==========================================================================

  public alignExecution(
    dplDecision: { allowTrade: boolean; action: string; confidence: number },
    fusionResult: { signal: 'LONG' | 'SHORT' | 'NEUTRAL'; strength: number },
    context: EAEContext,
    orderbook?: OrderbookData
  ): EAETiming {
    const startTime = Date.now();
    this.evaluationCount++;
    this.stats.totalEvaluations++;

    console.log(`⏰ EAE Evaluation #${this.evaluationCount} — Aligning execution timing...`);

    // Step 1: Analyze rhythm
    const rhythm = this.analyzeMarketRhythm(context);

    // Step 2: Detect liquidity pulse
    const liquidity = this.detectLiquidityPulse(orderbook);

    // Step 3: Detect kill zones
    const killZones = this.detectKillZones(context);

    // Step 4: Compute timing window
    const timingWindow = this.computeTimingWindow(rhythm, liquidity);

    // Step 5: Calculate timing score
    const rhythmScore = calculateRhythmScore(rhythm);
    const liquidityScore = calculateLiquidityScore(liquidity);
    const activeKillZone = killZones.find((z) => z.isActive);
    const killZoneScore = activeKillZone?.favorability || 50;

    const timingScore =
      rhythmScore * this.config.rhythmWeight +
      liquidityScore * this.config.liquidityWeight +
      killZoneScore * this.config.killZoneWeight;

    // Step 6: Compute sizing
    const sizing = this.computeSizing(timingScore);

    // Step 7: Determine sync state
    const syncState: 'GOOD' | 'NEUTRAL' | 'BAD' =
      timingScore >= 75 ? 'GOOD' : timingScore >= 50 ? 'NEUTRAL' : 'BAD';

    // Step 8: Determine if execution should fire
    const meetsMinScore = timingScore >= this.config.minTimingScore;
    const meetsMinSync =
      syncState === 'GOOD' ||
      (syncState === 'NEUTRAL' && this.config.minSyncState !== 'GOOD');
    const dplAllows = dplDecision.allowTrade;

    const fire = meetsMinScore && meetsMinSync && dplAllows;

    // Step 9: Collect conditions
    const conditions: string[] = [];
    if (!dplAllows) {
      conditions.push('DPL blocked trade');
    }
    if (!meetsMinScore) {
      conditions.push(`Timing score too low: ${timingScore.toFixed(0)} (min: ${this.config.minTimingScore})`);
    }
    if (!meetsMinSync) {
      conditions.push(`Sync state insufficient: ${syncState} (min: ${this.config.minSyncState})`);
    }
    if (fire) {
      conditions.push('All conditions met - execution allowed');
    }

    // Step 10: Build debug info
    const rhythmAligned = detectRhythmAlignment(rhythm);
    const liquidityAligned = detectPulseAlignment(liquidity, fusionResult.signal);

    const debug = {
      rhythmScore,
      liquidityScore,
      killZoneScore,
      timingFactors: {
        rhythm: rhythmScore,
        liquidity: liquidityScore,
        killZone: killZoneScore,
        volatility: context.marketContext.volatility === 'low' ? 100 : context.marketContext.volatility === 'medium' ? 70 : 40,
      },
      alignmentChecks: {
        rhythmAligned,
        liquidityAligned,
        killZoneActive: !!activeKillZone,
        volatilityAcceptable: context.marketContext.volatility !== 'high',
      },
      computationTime: Date.now() - startTime,
    };

    const timing: EAETiming = {
      fire,
      windowStart: timingWindow.start,
      windowEnd: timingWindow.end,
      timingScore: Math.round(timingScore),
      recommendedSize: sizing.recommendedSize,
      conditions,
      syncState,
      debug,
      timestamp: Date.now(),
    };

    // Update statistics
    this.updateStatistics(timing, rhythmAligned, liquidityAligned, !!activeKillZone);

    // Store timing
    this.lastTiming = timing;

    console.log(
      `✅ EAE Result: ${fire ? 'FIRE' : 'HOLD'} | ` +
      `Score: ${timing.timingScore} | Sync: ${syncState} | Size: ${(sizing.recommendedSize * 100).toFixed(0)}%`
    );

    return timing;
  }

  // ==========================================================================
  // GET SNAPSHOT
  // ==========================================================================

  public getSnapshot(): EAETiming | null {
    return this.lastTiming;
  }

  // ==========================================================================
  // GET STATISTICS
  // ==========================================================================

  public getStatistics(): EAEStatistics {
    return { ...this.stats };
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(
    timing: EAETiming,
    rhythmAligned: boolean,
    liquidityAligned: boolean,
    killZoneActive: boolean
  ): void {
    // Update execution counts
    if (timing.fire) {
      this.stats.executionsAllowed++;
    } else {
      this.stats.executionsBlocked++;
    }

    // Update averages
    this.stats.averageTimingScore =
      (this.stats.averageTimingScore * (this.stats.totalEvaluations - 1) + timing.timingScore) /
      this.stats.totalEvaluations;

    // Update sync state average
    const syncStateValue = timing.syncState === 'GOOD' ? 2 : timing.syncState === 'NEUTRAL' ? 1 : 0;
    const avgSyncValue =
      (this.parseSyncStateValue(this.stats.averageSyncState) * (this.stats.totalEvaluations - 1) +
        syncStateValue) /
      this.stats.totalEvaluations;
    this.stats.averageSyncState =
      avgSyncValue >= 1.5 ? 'GOOD' : avgSyncValue >= 0.5 ? 'NEUTRAL' : 'BAD';

    // Update alignment rates
    this.stats.rhythmAlignmentRate =
      (this.stats.rhythmAlignmentRate * (this.stats.totalEvaluations - 1) +
        (rhythmAligned ? 1 : 0)) /
      this.stats.totalEvaluations;

    this.stats.liquidityAlignmentRate =
      (this.stats.liquidityAlignmentRate * (this.stats.totalEvaluations - 1) +
        (liquidityAligned ? 1 : 0)) /
      this.stats.totalEvaluations;

    this.stats.killZoneHitRate =
      (this.stats.killZoneHitRate * (this.stats.totalEvaluations - 1) +
        (killZoneActive ? 1 : 0)) /
      this.stats.totalEvaluations;

    // Update evaluation time
    this.stats.lastEvaluationTime = timing.debug.computationTime;
  }

  // ==========================================================================
  // HELPER: Parse sync state to numeric value
  // ==========================================================================

  private parseSyncStateValue(state: string): number {
    return state === 'GOOD' ? 2 : state === 'NEUTRAL' ? 1 : 0;
  }

  // ==========================================================================
  // GET VERSION
  // ==========================================================================

  public getVersion(): string {
    return '1.0.0 — STEP 24.38';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let engine: ExecutionAlignmentEngine | null = null;

export function getExecutionAlignmentEngine(
  config?: Partial<EAEConfig>
): ExecutionAlignmentEngine {
  if (!engine) {
    engine = new ExecutionAlignmentEngine(config);
  }
  return engine;
}

export default getExecutionAlignmentEngine;
