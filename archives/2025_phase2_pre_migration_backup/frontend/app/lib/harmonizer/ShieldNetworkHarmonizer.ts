/**
 * 🔥 SHIELD-NETWORK HARMONIZER LAYER (SNHL)
 * 
 * STEP 24.32 — Air Traffic Control Tower of BagBot
 * 
 * Purpose:
 * This is the central intelligence synchronizer that collects signals from ALL
 * BagBot subsystems, normalizes them to a coherent scale, resolves conflicts,
 * and generates a unified Harmonized Intelligence Frame (HIF) every 120ms.
 * 
 * Responsibilities:
 * - Synchronize ALL intelligence subsystems:
 *   * Shield Engine
 *   * Threat Cluster Engine
 *   * Correlation Matrix
 *   * Prediction Horizon
 *   * Root Cause Engine
 *   * Execution Precision Core
 *   * Survival Matrix
 *   * Trading Pipeline Core
 *   * Decision Engine
 *   * Temporal Memory Engine
 *   * Autonomous Response Loop
 *   * Reactor Sync Engine (read-only)
 * 
 * - Maintain coherence between subsystems
 * - Prevent contradictions (e.g., one says "attack", another says "defend")
 * - Generate unified Harmonized Intelligence Frame (HIF) every 120ms
 * - Ensure stable, calculated, consistent trading behavior
 * 
 * This is the "brain of brains" — the final arbiter before action.
 * 
 * Requirements:
 * - Frontend-safe, no backend calls
 * - Singleton pattern
 * - Conflict resolution algorithm
 * - Normalization of all signal types
 * - Output: HIF with tradeBias, riskLevel, confidence, recommendedAction, etc.
 */

import type {
  HIF,
  HarmonizerInput,
  HarmonizerConfig,
  ConflictedSignals,
  HarmonizedSignals,
  NormalizedSignal,
} from './types';

// ============================================================================
// SHIELD-NETWORK HARMONIZER CLASS
// ============================================================================

export class ShieldNetworkHarmonizer {
  private config: HarmonizerConfig;
  private isRunning: boolean = false;
  private loopInterval: NodeJS.Timeout | null = null;
  private lastHIF: HIF | null = null;
  private frameCount: number = 0;

  // Engine references (to be attached)
  private engines: {
    shieldEngine?: any;
    threatClusterEngine?: any;
    correlationMatrix?: any;
    predictionHorizon?: any;
    rootCauseEngine?: any;
    executionPrecisionCore?: any;
    survivalMatrix?: any;
    tradingPipelineCore?: any;
    decisionEngine?: any;
    temporalMemoryEngine?: any;
    autonomousResponseLoop?: any;
    reactorSyncEngine?: any; // Read-only
  } = {};

  // Callbacks
  private onHIFGenerated?: (hif: HIF) => void;

  // Statistics
  private stats = {
    totalFrames: 0,
    conflictsResolved: 0,
    averageConfidence: 0,
    lastUpdateTime: 0,
  };

  constructor(config?: Partial<HarmonizerConfig>) {
    this.config = {
      loopFrequency: config?.loopFrequency || 120, // 120ms default
      conflictResolutionStrategy: config?.conflictResolutionStrategy || 'weighted-average',
      normalizationScale: config?.normalizationScale || { min: 0, max: 100 },
      enableConflictLogging: config?.enableConflictLogging || false,
      weights: config?.weights || {
        shieldEngine: 0.25,
        threatClusterEngine: 0.10,
        correlationMatrix: 0.08,
        predictionHorizon: 0.10,
        rootCauseEngine: 0.08,
        executionPrecisionCore: 0.12,
        survivalMatrix: 0.10,
        tradingPipelineCore: 0.05,
        decisionEngine: 0.08,
        temporalMemoryEngine: 0.04,
        autonomousResponseLoop: 0.00, // ARL drives visual only
      },
    };

    console.log('🔥 ShieldNetworkHarmonizer initialized');
  }

  // ==========================================================================
  // ATTACH ENGINES
  // ==========================================================================

  public attachEngines(engines: {
    shieldEngine?: any;
    threatClusterEngine?: any;
    correlationMatrix?: any;
    predictionHorizon?: any;
    rootCauseEngine?: any;
    executionPrecisionCore?: any;
    survivalMatrix?: any;
    tradingPipelineCore?: any;
    decisionEngine?: any;
    temporalMemoryEngine?: any;
    autonomousResponseLoop?: any;
    reactorSyncEngine?: any;
  }): void {
    this.engines = { ...engines };
    console.log('🔗 Engines attached to ShieldNetworkHarmonizer:', Object.keys(this.engines));
  }

  // ==========================================================================
  // START HARMONIZATION LOOP
  // ==========================================================================

  public start(onHIFGenerated?: (hif: HIF) => void): void {
    if (this.isRunning) {
      console.warn('⚠️ ShieldNetworkHarmonizer already running');
      return;
    }

    this.onHIFGenerated = onHIFGenerated;
    this.isRunning = true;
    this.frameCount = 0;

    console.log(`🚀 ShieldNetworkHarmonizer started — Loop frequency: ${this.config.loopFrequency}ms`);

    // Start autonomous loop
    this.loopInterval = setInterval(() => {
      this.harmonizeFrame();
    }, this.config.loopFrequency);
  }

  // ==========================================================================
  // STOP HARMONIZATION LOOP
  // ==========================================================================

  public stop(): void {
    if (!this.isRunning) {
      console.warn('⚠️ ShieldNetworkHarmonizer not running');
      return;
    }

    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }

    this.isRunning = false;
    console.log('🛑 ShieldNetworkHarmonizer stopped');
  }

  // ==========================================================================
  // HARMONIZE FRAME — Main Logic
  // ==========================================================================

  private harmonizeFrame(): void {
    const startTime = Date.now();
    this.frameCount++;

    // Step 1: Gather signals from all engines
    const signals = this.gatherSignals();

    // Step 2: Normalize all signals to 0-100 scale
    const normalizedSignals = this.normalizeSignals(signals);

    // Step 3: Detect and resolve conflicts
    const { hasConflicts, conflictedSignals, resolvedSignals } = this.resolveConflicts(
      normalizedSignals
    );

    // Step 4: Generate unified HIF
    const hif = this.generateHIF(resolvedSignals, hasConflicts);

    // Step 5: Update statistics
    this.updateStatistics(hif, startTime);

    // Step 6: Store and emit HIF
    this.lastHIF = hif;
    if (this.onHIFGenerated) {
      this.onHIFGenerated(hif);
    }

    // Optional: Log conflicts
    if (hasConflicts && this.config.enableConflictLogging) {
      console.warn('⚠️ SNHL detected conflicts:', conflictedSignals);
    }
  }

  // ==========================================================================
  // GATHER SIGNALS FROM ENGINES
  // ==========================================================================

  private gatherSignals(): HarmonizerInput {
    const input: HarmonizerInput = {
      shieldEngine: this.engines.shieldEngine?.getState?.() || null,
      threatClusterEngine: this.engines.threatClusterEngine?.getClusters?.() || null,
      correlationMatrix: this.engines.correlationMatrix?.getMatrix?.() || null,
      predictionHorizon: this.engines.predictionHorizon?.getPrediction?.() || null,
      rootCauseEngine: this.engines.rootCauseEngine?.getAnalysis?.() || null,
      executionPrecisionCore: this.engines.executionPrecisionCore?.getStatus?.() || null,
      survivalMatrix: this.engines.survivalMatrix?.getSurvivalScore?.() || null,
      tradingPipelineCore: this.engines.tradingPipelineCore?.getPipelineStatus?.() || null,
      decisionEngine: this.engines.decisionEngine?.getLastDecision?.() || null,
      temporalMemoryEngine: this.engines.temporalMemoryEngine?.getMemorySnapshot?.() || null,
      autonomousResponseLoop: this.engines.autonomousResponseLoop?.getLastFrame?.() || null,
      reactorSyncEngine: this.engines.reactorSyncEngine?.getReactorState?.() || null,
    };

    return input;
  }

  // ==========================================================================
  // NORMALIZE SIGNALS — Convert to 0-100 scale
  // ==========================================================================

  public normalizeSignals(signals: HarmonizerInput): NormalizedSignal[] {
    const normalized: NormalizedSignal[] = [];

    // Shield Engine: threat level (0-1) → 0-100
    if (signals.shieldEngine) {
      normalized.push({
        source: 'shieldEngine',
        value: (signals.shieldEngine.threatLevel || 0) * 100,
        confidence: signals.shieldEngine.confidence || 50,
        tradeBias: signals.shieldEngine.recommendedAction === 'ATTACK' ? 1 : signals.shieldEngine.recommendedAction === 'DEFEND' ? -1 : 0,
      });
    }

    // Threat Cluster Engine: aggregated threat score
    if (signals.threatClusterEngine) {
      const threatScore = signals.threatClusterEngine.aggregatedScore || 0;
      normalized.push({
        source: 'threatClusterEngine',
        value: threatScore,
        confidence: 60,
        tradeBias: threatScore > 70 ? -1 : threatScore < 30 ? 1 : 0,
      });
    }

    // Correlation Matrix: correlation strength (-1 to +1) → 0-100
    if (signals.correlationMatrix) {
      const correlation = signals.correlationMatrix.correlation || 0;
      normalized.push({
        source: 'correlationMatrix',
        value: (correlation + 1) * 50, // -1→0, 0→50, +1→100
        confidence: signals.correlationMatrix.confidence || 50,
        tradeBias: correlation > 0.5 ? 1 : correlation < -0.5 ? -1 : 0,
      });
    }

    // Prediction Horizon: forecast confidence (0-100)
    if (signals.predictionHorizon) {
      normalized.push({
        source: 'predictionHorizon',
        value: signals.predictionHorizon.forecastConfidence || 50,
        confidence: signals.predictionHorizon.confidence || 50,
        tradeBias: signals.predictionHorizon.direction === 'BULLISH' ? 1 : signals.predictionHorizon.direction === 'BEARISH' ? -1 : 0,
      });
    }

    // Root Cause Engine: stability score (0-100)
    if (signals.rootCauseEngine) {
      normalized.push({
        source: 'rootCauseEngine',
        value: signals.rootCauseEngine.stabilityScore || 50,
        confidence: 65,
        tradeBias: 0, // Root cause is neutral
      });
    }

    // Execution Precision Core: execution readiness (0-100)
    if (signals.executionPrecisionCore) {
      normalized.push({
        source: 'executionPrecisionCore',
        value: signals.executionPrecisionCore.readinessScore || 50,
        confidence: 70,
        tradeBias: signals.executionPrecisionCore.readiness === 'READY' ? 1 : 0,
      });
    }

    // Survival Matrix: survival score (0-100)
    if (signals.survivalMatrix) {
      normalized.push({
        source: 'survivalMatrix',
        value: signals.survivalMatrix.survivalScore || 50,
        confidence: 75,
        tradeBias: signals.survivalMatrix.survivalScore > 70 ? 1 : signals.survivalMatrix.survivalScore < 30 ? -1 : 0,
      });
    }

    // Trading Pipeline Core: pipeline health (0-100)
    if (signals.tradingPipelineCore) {
      normalized.push({
        source: 'tradingPipelineCore',
        value: signals.tradingPipelineCore.healthScore || 50,
        confidence: 60,
        tradeBias: 0,
      });
    }

    // Decision Engine: decision confidence (0-100)
    if (signals.decisionEngine) {
      normalized.push({
        source: 'decisionEngine',
        value: signals.decisionEngine.confidence || 50,
        confidence: signals.decisionEngine.confidence || 50,
        tradeBias: signals.decisionEngine.action === 'LONG' ? 1 : signals.decisionEngine.action === 'SHORT' ? -1 : 0,
      });
    }

    // Temporal Memory Engine: memory reliability (0-100)
    if (signals.temporalMemoryEngine) {
      normalized.push({
        source: 'temporalMemoryEngine',
        value: signals.temporalMemoryEngine.reliability || 50,
        confidence: 55,
        tradeBias: 0,
      });
    }

    // Autonomous Response Loop: mode intensity (0-100)
    if (signals.autonomousResponseLoop) {
      const modeScore =
        signals.autonomousResponseLoop.mode === 'CALM'
          ? 25
          : signals.autonomousResponseLoop.mode === 'ALERT'
          ? 50
          : signals.autonomousResponseLoop.mode === 'DEFENSIVE'
          ? 75
          : 100;
      normalized.push({
        source: 'autonomousResponseLoop',
        value: modeScore,
        confidence: 70,
        tradeBias: 0, // ARL is visual-only
      });
    }

    return normalized;
  }

  // ==========================================================================
  // RESOLVE CONFLICTS — Detect contradictions and blend
  // ==========================================================================

  public resolveConflicts(signals: NormalizedSignal[]): {
    hasConflicts: boolean;
    conflictedSignals: ConflictedSignals[];
    resolvedSignals: HarmonizedSignals;
  } {
    const conflictedSignals: ConflictedSignals[] = [];
    let hasConflicts = false;

    // Detect contradictions: opposing tradeBias
    const bullishSignals = signals.filter((s) => s.tradeBias > 0);
    const bearishSignals = signals.filter((s) => s.tradeBias < 0);

    if (bullishSignals.length > 0 && bearishSignals.length > 0) {
      hasConflicts = true;
      conflictedSignals.push({
        type: 'trade-direction',
        sources: [...bullishSignals.map((s) => s.source), ...bearishSignals.map((s) => s.source)],
        description: 'Some engines say BUY, others say SELL',
      });
    }

    // Resolve using weighted average
    const resolvedSignals = this.blendSignals(signals);

    // Increment conflict counter
    if (hasConflicts) {
      this.stats.conflictsResolved++;
    }

    return { hasConflicts, conflictedSignals, resolvedSignals };
  }

  // ==========================================================================
  // BLEND SIGNALS — Weighted average
  // ==========================================================================

  private blendSignals(signals: NormalizedSignal[]): HarmonizedSignals {
    let weightedValue = 0;
    let weightedConfidence = 0;
    let weightedTradeBias = 0;
    let totalWeight = 0;

    signals.forEach((signal) => {
      const weight = this.config.weights[signal.source as keyof typeof this.config.weights] || 0;
      weightedValue += signal.value * weight;
      weightedConfidence += signal.confidence * weight;
      weightedTradeBias += signal.tradeBias * weight;
      totalWeight += weight;
    });

    // Normalize
    const blendedValue = totalWeight > 0 ? weightedValue / totalWeight : 50;
    const blendedConfidence = totalWeight > 0 ? weightedConfidence / totalWeight : 50;
    const blendedTradeBias = totalWeight > 0 ? weightedTradeBias / totalWeight : 0;

    return {
      value: blendedValue,
      confidence: blendedConfidence,
      tradeBias: blendedTradeBias,
      riskLevel: this.calculateRiskLevel(signals),
      volatilityStatus: this.calculateVolatilityStatus(signals),
    };
  }

  // ==========================================================================
  // CALCULATE RISK LEVEL
  // ==========================================================================

  private calculateRiskLevel(signals: NormalizedSignal[]): 'low' | 'medium' | 'high' {
    const threatSignals = signals.filter((s) =>
      ['shieldEngine', 'threatClusterEngine', 'survivalMatrix'].includes(s.source)
    );
    const avgThreat =
      threatSignals.reduce((sum, s) => sum + s.value, 0) / (threatSignals.length || 1);

    if (avgThreat < 30) return 'low';
    if (avgThreat < 70) return 'medium';
    return 'high';
  }

  // ==========================================================================
  // CALCULATE VOLATILITY STATUS
  // ==========================================================================

  private calculateVolatilityStatus(signals: NormalizedSignal[]): 'low' | 'medium' | 'high' {
    const volatilitySignals = signals.filter((s) =>
      ['predictionHorizon', 'rootCauseEngine', 'autonomousResponseLoop'].includes(s.source)
    );
    const avgVolatility =
      volatilitySignals.reduce((sum, s) => sum + s.value, 0) / (volatilitySignals.length || 1);

    if (avgVolatility < 40) return 'low';
    if (avgVolatility < 70) return 'medium';
    return 'high';
  }

  // ==========================================================================
  // GENERATE HIF — Output Frame
  // ==========================================================================

  public generateHIF(signals: HarmonizedSignals, hasConflicts: boolean): HIF {
    // Determine recommended action
    let recommendedAction: 'LONG' | 'SHORT' | 'WAIT';
    if (Math.abs(signals.tradeBias) < 0.2) {
      recommendedAction = 'WAIT';
    } else if (signals.tradeBias > 0) {
      recommendedAction = 'LONG';
    } else {
      recommendedAction = 'SHORT';
    }

    // Determine shield state
    let shieldState: 'CALM' | 'DEFENSIVE' | 'AGGRO_OBS' | 'PROTECTIVE';
    if (signals.riskLevel === 'low') {
      shieldState = 'CALM';
    } else if (signals.riskLevel === 'high') {
      shieldState = 'DEFENSIVE';
    } else if (signals.tradeBias > 0.5) {
      shieldState = 'AGGRO_OBS';
    } else {
      shieldState = 'PROTECTIVE';
    }

    // Determine system mode
    let systemMode: 'normal' | 'safe' | 'aggressive';
    if (signals.riskLevel === 'high') {
      systemMode = 'safe';
    } else if (signals.tradeBias > 0.6 && signals.confidence > 70) {
      systemMode = 'aggressive';
    } else {
      systemMode = 'normal';
    }

    const hif: HIF = {
      timestamp: Date.now(),
      tradeBias: Number(signals.tradeBias.toFixed(2)), // -1 to +1
      riskLevel: signals.riskLevel,
      confidence: Number(signals.confidence.toFixed(1)), // 0-100
      recommendedAction,
      shieldState,
      threatLevel: signals.riskLevel === 'high' ? 80 : signals.riskLevel === 'medium' ? 50 : 20,
      volatilityStatus: signals.volatilityStatus,
      systemMode,
      hasConflicts,
      frameNumber: this.frameCount,
    };

    return hif;
  }

  // ==========================================================================
  // UPDATE STATISTICS
  // ==========================================================================

  private updateStatistics(hif: HIF, startTime: number): void {
    this.stats.totalFrames++;
    this.stats.averageConfidence =
      (this.stats.averageConfidence * (this.stats.totalFrames - 1) + hif.confidence) /
      this.stats.totalFrames;
    this.stats.lastUpdateTime = Date.now() - startTime;
  }

  // ==========================================================================
  // GET CURRENT HIF
  // ==========================================================================

  public getCurrentHIF(): HIF | null {
    return this.lastHIF;
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
    return '1.0.0 — STEP 24.32';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let harmonizer: ShieldNetworkHarmonizer | null = null;

export function getShieldNetworkHarmonizer(
  config?: Partial<HarmonizerConfig>
): ShieldNetworkHarmonizer {
  if (!harmonizer) {
    harmonizer = new ShieldNetworkHarmonizer(config);
  }
  return harmonizer;
}

export default getShieldNetworkHarmonizer;
