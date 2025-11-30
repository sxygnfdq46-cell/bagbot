/**
 * LEVEL 12.2 — STATE COHERENCE DIRECTOR
 * 
 * Multi-layer coherence enforcement, state drift prevention,
 * coherence scoring, and intervention triggers.
 * 
 * Features:
 * - Cross-layer coherence tracking (12 perception layers)
 * - Tone-range enforcement
 * - State variance detection
 * - Drift-return logic (automatic correction)
 * - Coherence intervention triggers
 * - Layer synchronization scoring
 * - Real-time coherence metrics
 * 
 * Monitoring: 100ms intervals
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface LayerCoherence {
  layerName: string;
  coherenceScore: number; // 0-100
  driftAmount: number; // 0-100
  lastUpdate: number; // timestamp
}

interface ToneRangeConfig {
  warmth: { min: number; max: number };
  formality: { min: number; max: number };
  enthusiasm: { min: number; max: number };
  stability: { min: number; max: number };
}

interface StateVariance {
  currentValue: number;
  expectedValue: number;
  variance: number; // 0-100
  withinTolerance: boolean;
}

interface CoherenceInterventionConfig {
  lowCoherenceThreshold: number; // 0-100, trigger when below
  highDriftThreshold: number; // 0-100, trigger when above
  varianceThreshold: number; // 0-100, trigger when above
  correctionStrength: number; // 0-1
  interventionCooldown: number; // ms
}

interface StateCoherenceDirectorConfig {
  toneRanges: ToneRangeConfig;
  interventionConfig: CoherenceInterventionConfig;
  monitoringInterval: number; // ms
  coherenceHistorySize: number; // number of samples
}

/* ================================ */
/* STATE COHERENCE DIRECTOR         */
/* ================================ */

export class StateCoherenceDirector {
  private config: StateCoherenceDirectorConfig;
  private layerCoherence: Map<string, LayerCoherence>;
  private coherenceHistory: number[]; // last N overall coherence scores
  private lastIntervention: number; // timestamp
  private monitoringIntervalId: number | null;

  // Layer names (from AdaptivePresenceMatrix)
  private readonly layerNames = [
    'Core Identity',
    'Emotional Field',
    'Cognitive State',
    'Behavioral Pattern',
    'Memory Imprint',
    'Environmental Awareness',
    'Collective Consciousness',
    'Temporal Presence',
    'Spatial Presence',
    'Meta-Awareness',
    'Guardian Layer',
    'Sovereignty Layer',
  ];

  constructor(config?: Partial<StateCoherenceDirectorConfig>) {
    this.config = {
      toneRanges: {
        warmth: { min: 30, max: 90 },
        formality: { min: 20, max: 80 },
        enthusiasm: { min: 20, max: 90 },
        stability: { min: 40, max: 100 },
      },
      interventionConfig: {
        lowCoherenceThreshold: 60,
        highDriftThreshold: 40,
        varianceThreshold: 30,
        correctionStrength: 0.6,
        interventionCooldown: 5000, // 5 seconds
      },
      monitoringInterval: 100,
      coherenceHistorySize: 100,
      ...config,
    };

    this.layerCoherence = new Map();
    this.coherenceHistory = [];
    this.lastIntervention = 0;
    this.monitoringIntervalId = null;

    // Initialize layer coherence
    this.layerNames.forEach((layerName) => {
      this.layerCoherence.set(layerName, {
        layerName,
        coherenceScore: 100,
        driftAmount: 0,
        lastUpdate: Date.now(),
      });
    });

    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateCoherenceMetrics();
      this.checkInterventionTriggers();
    }, this.config.monitoringInterval);
  }

  private updateCoherenceMetrics(): void {
    const now = Date.now();

    // Calculate overall coherence
    let totalCoherence = 0;
    let layerCount = 0;

    this.layerCoherence.forEach((layer) => {
      totalCoherence += layer.coherenceScore;
      layerCount++;
    });

    const overallCoherence = layerCount > 0 ? totalCoherence / layerCount : 100;

    // Update history
    this.coherenceHistory.push(overallCoherence);
    if (this.coherenceHistory.length > this.config.coherenceHistorySize) {
      this.coherenceHistory.shift();
    }
  }

  /* ================================ */
  /* LAYER COHERENCE                  */
  /* ================================ */

  public updateLayerCoherence(layerName: string, presenceStrength: number, expectedStrength: number): void {
    const layer = this.layerCoherence.get(layerName);
    if (!layer) return;

    const now = Date.now();

    // Calculate drift
    const drift = Math.abs(presenceStrength - expectedStrength);

    // Calculate coherence score (inverse of drift, normalized)
    const coherenceScore = Math.max(0, Math.min(100, 100 - drift));

    layer.coherenceScore = coherenceScore;
    layer.driftAmount = drift;
    layer.lastUpdate = now;
  }

  public getLayerCoherence(layerName: string): LayerCoherence | undefined {
    return this.layerCoherence.get(layerName);
  }

  public getAllLayerCoherence(): LayerCoherence[] {
    return Array.from(this.layerCoherence.values());
  }

  /* ================================ */
  /* TONE RANGE ENFORCEMENT           */
  /* ================================ */

  public enforceToneRanges(
    warmth: number,
    formality: number,
    enthusiasm: number,
    stability: number
  ): { warmth: number; formality: number; enthusiasm: number; stability: number } {
    const { toneRanges } = this.config;

    return {
      warmth: this.clampToRange(warmth, toneRanges.warmth.min, toneRanges.warmth.max),
      formality: this.clampToRange(formality, toneRanges.formality.min, toneRanges.formality.max),
      enthusiasm: this.clampToRange(enthusiasm, toneRanges.enthusiasm.min, toneRanges.enthusiasm.max),
      stability: this.clampToRange(stability, toneRanges.stability.min, toneRanges.stability.max),
    };
  }

  private clampToRange(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  public setToneRanges(ranges: Partial<ToneRangeConfig>): void {
    this.config.toneRanges = { ...this.config.toneRanges, ...ranges };
  }

  /* ================================ */
  /* STATE VARIANCE DETECTION         */
  /* ================================ */

  public detectVariance(currentValue: number, expectedValue: number, tolerance: number): StateVariance {
    const variance = Math.abs(currentValue - expectedValue);
    const withinTolerance = variance <= tolerance;

    return {
      currentValue,
      expectedValue,
      variance,
      withinTolerance,
    };
  }

  public calculateIntensityVariance(intensityHistory: number[]): number {
    if (intensityHistory.length < 2) return 0;

    const mean = intensityHistory.reduce((sum, val) => sum + val, 0) / intensityHistory.length;
    const variance = intensityHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensityHistory.length;

    return Math.sqrt(variance);
  }

  /* ================================ */
  /* DRIFT-RETURN LOGIC               */
  /* ================================ */

  public calculateDriftCorrection(currentValue: number, targetValue: number): number {
    const drift = currentValue - targetValue;
    const { correctionStrength } = this.config.interventionConfig;

    // Gradual correction: pull toward target
    const correction = drift * correctionStrength;

    return currentValue - correction;
  }

  public applyDriftCorrection(layerName: string, currentStrength: number, targetStrength: number): number {
    const layer = this.layerCoherence.get(layerName);
    if (!layer) return currentStrength;

    // Only apply correction if drift is significant
    if (layer.driftAmount > this.config.interventionConfig.highDriftThreshold) {
      return this.calculateDriftCorrection(currentStrength, targetStrength);
    }

    return currentStrength;
  }

  /* ================================ */
  /* COHERENCE INTERVENTION TRIGGERS  */
  /* ================================ */

  private checkInterventionTriggers(): void {
    const now = Date.now();
    const { interventionConfig } = this.config;

    // Check cooldown
    if (now - this.lastIntervention < interventionConfig.interventionCooldown) {
      return;
    }

    // Check overall coherence
    const overallCoherence = this.getOverallCoherence();
    if (overallCoherence < interventionConfig.lowCoherenceThreshold) {
      this.triggerCoherenceIntervention('low-coherence', overallCoherence);
      return;
    }

    // Check for high drift in any layer
    const layers = Array.from(this.layerCoherence.values());
    for (const layer of layers) {
      if (layer.driftAmount > interventionConfig.highDriftThreshold) {
        this.triggerCoherenceIntervention('high-drift', layer.driftAmount, layer.layerName);
        return;
      }
    }

    // Check variance in coherence history
    if (this.coherenceHistory.length >= 10) {
      const recentHistory = this.coherenceHistory.slice(-10);
      const variance = this.calculateIntensityVariance(recentHistory);
      if (variance > interventionConfig.varianceThreshold) {
        this.triggerCoherenceIntervention('high-variance', variance);
        return;
      }
    }
  }

  private triggerCoherenceIntervention(
    reason: 'low-coherence' | 'high-drift' | 'high-variance',
    value: number,
    layerName?: string
  ): void {
    const now = Date.now();
    this.lastIntervention = now;

    // Log intervention (ephemeral only, no storage)
    if (typeof console !== 'undefined') {
      console.log('[StateCoherenceDirector] Intervention triggered:', {
        reason,
        value: Math.round(value * 100) / 100,
        layerName,
        timestamp: now,
      });
    }

    // Intervention actions would be implemented here
    // For now, just record the event
  }

  public forceIntervention(reason: string): void {
    this.lastIntervention = Date.now();
    if (typeof console !== 'undefined') {
      console.log('[StateCoherenceDirector] Manual intervention forced:', reason);
    }
  }

  /* ================================ */
  /* LAYER SYNCHRONIZATION            */
  /* ================================ */

  public calculateLayerSync(): number {
    if (this.layerCoherence.size === 0) return 100;

    const coherenceScores = Array.from(this.layerCoherence.values()).map((layer) => layer.coherenceScore);

    // Calculate variance across layers
    const mean = coherenceScores.reduce((sum, score) => sum + score, 0) / coherenceScores.length;
    const variance =
      coherenceScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / coherenceScores.length;

    // Sync score: inverse of variance (normalized)
    const syncScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) * 2));

    return syncScore;
  }

  public synchronizeLayers(targetCoherence: number): void {
    const { correctionStrength } = this.config.interventionConfig;

    this.layerCoherence.forEach((layer) => {
      if (layer.coherenceScore < targetCoherence) {
        // Pull toward target coherence
        const correction = (targetCoherence - layer.coherenceScore) * correctionStrength;
        layer.coherenceScore = Math.min(100, layer.coherenceScore + correction);
        layer.driftAmount = Math.max(0, layer.driftAmount - correction);
      }
    });
  }

  /* ================================ */
  /* METRICS & STATE                  */
  /* ================================ */

  public getOverallCoherence(): number {
    if (this.coherenceHistory.length === 0) return 100;

    // Use most recent coherence score
    return this.coherenceHistory[this.coherenceHistory.length - 1];
  }

  public getCoherenceTrend(): 'improving' | 'stable' | 'declining' {
    if (this.coherenceHistory.length < 5) return 'stable';

    const recent = this.coherenceHistory.slice(-5);
    const older = this.coherenceHistory.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  public getState() {
    return {
      overallCoherence: this.getOverallCoherence(),
      layerCoherence: this.getAllLayerCoherence(),
      layerSyncScore: this.calculateLayerSync(),
      coherenceTrend: this.getCoherenceTrend(),
      coherenceHistory: [...this.coherenceHistory],
      interventionConfig: { ...this.config.interventionConfig },
      toneRanges: { ...this.config.toneRanges },
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `StateCoherenceDirector Summary:
  Overall Coherence: ${Math.round(state.overallCoherence * 100) / 100}
  Layer Sync Score: ${Math.round(state.layerSyncScore * 100) / 100}
  Coherence Trend: ${state.coherenceTrend}
  Active Layers: ${state.layerCoherence.length}
  Low Coherence Layers: ${state.layerCoherence.filter((l) => l.coherenceScore < 70).length}
  High Drift Layers: ${state.layerCoherence.filter((l) => l.driftAmount > 30).length}
  History Size: ${state.coherenceHistory.length}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<StateCoherenceDirectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public setInterventionConfig(config: Partial<CoherenceInterventionConfig>): void {
    this.config.interventionConfig = { ...this.config.interventionConfig, ...config };
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.coherenceHistory = [];
    this.lastIntervention = 0;

    this.layerNames.forEach((layerName) => {
      this.layerCoherence.set(layerName, {
        layerName,
        coherenceScore: 100,
        driftAmount: 0,
        lastUpdate: Date.now(),
      });
    });
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      layerCoherence: Array.from(this.layerCoherence.entries()),
      coherenceHistory: this.coherenceHistory,
      lastIntervention: this.lastIntervention,
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.layerCoherence = new Map(parsed.layerCoherence);
      this.coherenceHistory = parsed.coherenceHistory;
      this.lastIntervention = parsed.lastIntervention;
    } catch (error) {
      console.error('[StateCoherenceDirector] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.layerCoherence.clear();
    this.coherenceHistory = [];
  }
}
