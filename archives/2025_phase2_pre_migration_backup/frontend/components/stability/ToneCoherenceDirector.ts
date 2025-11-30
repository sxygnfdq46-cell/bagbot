/**
 * LEVEL 12.3 — TONE COHERENCE DIRECTOR
 * 
 * 5-vector consistency tracking across emotional layers:
 * Tone → Expression → Presence → Aura → Visual
 * 
 * Features:
 * - 5-layer coherence tracking
 * - Ratio correction between layers
 * - Mismatch detection and auto-fix
 * - Real-time coherence scoring
 * - Multi-vector consistency enforcement
 * - Cross-layer alignment algorithms
 * - Coherence visualization data
 * 
 * Monitoring: 100ms intervals (10 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type CoherenceLayer = 'tone' | 'expression' | 'presence' | 'aura' | 'visual';

interface LayerVector {
  layer: CoherenceLayer;
  value: number; // 0-100
  target: number; // 0-100
  coherence: number; // 0-100 (alignment with other layers)
}

interface CoherenceRatio {
  layer1: CoherenceLayer;
  layer2: CoherenceLayer;
  expectedRatio: number; // e.g., 1.0 = equal, 1.2 = layer1 20% higher
  currentRatio: number;
  deviation: number; // % deviation from expected
}

interface MismatchDetection {
  detected: boolean;
  mismatchedLayers: CoherenceLayer[];
  severity: number; // 0-100
  correctionNeeded: boolean;
}

interface CoherenceCorrection {
  active: boolean;
  targetLayer: CoherenceLayer;
  correctionStrength: number; // 0-1
  progress: number; // 0-1
}

interface CoherenceScore {
  overall: number; // 0-100
  byLayer: Map<CoherenceLayer, number>;
  variance: number;
  stability: number; // inverse of variance
}

interface ToneCoherenceConfig {
  targetCoherence: number; // 0-100
  correctionStrength: number;
  maxDeviation: number; // % allowed deviation
  monitoringInterval: number; // ms
}

/* ================================ */
/* TONE COHERENCE DIRECTOR          */
/* ================================ */

export class ToneCoherenceDirector {
  private config: ToneCoherenceConfig;
  private layerVectors: Map<CoherenceLayer, LayerVector>;
  private coherenceRatios: CoherenceRatio[];
  private mismatchDetection: MismatchDetection;
  private coherenceCorrection: CoherenceCorrection;
  private coherenceScore: CoherenceScore;
  private layerHistory: Map<CoherenceLayer, number[]>;
  private monitoringIntervalId: number | null;

  constructor(config?: Partial<ToneCoherenceConfig>) {
    this.config = {
      targetCoherence: 90,
      correctionStrength: 0.8,
      maxDeviation: 15, // 15% max deviation
      monitoringInterval: 100,
      ...config,
    };

    // Initialize layer vectors
    this.layerVectors = new Map();
    const layers: CoherenceLayer[] = ['tone', 'expression', 'presence', 'aura', 'visual'];

    for (const layer of layers) {
      this.layerVectors.set(layer, {
        layer,
        value: 50,
        target: 50,
        coherence: 100,
      });
    }

    // Define expected ratios between layers
    this.coherenceRatios = [
      { layer1: 'tone', layer2: 'expression', expectedRatio: 1.0, currentRatio: 1.0, deviation: 0 },
      { layer1: 'expression', layer2: 'presence', expectedRatio: 1.1, currentRatio: 1.0, deviation: 0 },
      { layer1: 'presence', layer2: 'aura', expectedRatio: 0.9, currentRatio: 1.0, deviation: 0 },
      { layer1: 'aura', layer2: 'visual', expectedRatio: 1.0, currentRatio: 1.0, deviation: 0 },
      { layer1: 'tone', layer2: 'visual', expectedRatio: 1.0, currentRatio: 1.0, deviation: 0 },
    ];

    this.mismatchDetection = {
      detected: false,
      mismatchedLayers: [],
      severity: 0,
      correctionNeeded: false,
    };

    this.coherenceCorrection = {
      active: false,
      targetLayer: 'tone',
      correctionStrength: this.config.correctionStrength,
      progress: 0,
    };

    this.coherenceScore = {
      overall: 100,
      byLayer: new Map(),
      variance: 0,
      stability: 100,
    };

    this.layerHistory = new Map();
    this.monitoringIntervalId = null;

    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateCoherenceRatios();
      this.updateMismatchDetection();
      this.updateCoherenceScore();
      this.updateCoherenceCorrection();
    }, this.config.monitoringInterval);
  }

  private updateCoherenceRatios(): void {
    for (const ratio of this.coherenceRatios) {
      const layer1 = this.layerVectors.get(ratio.layer1);
      const layer2 = this.layerVectors.get(ratio.layer2);

      if (!layer1 || !layer2) continue;

      // Calculate current ratio (avoid division by zero)
      ratio.currentRatio = layer2.value === 0 ? 1 : layer1.value / layer2.value;

      // Calculate deviation from expected ratio
      ratio.deviation = Math.abs((ratio.currentRatio - ratio.expectedRatio) / ratio.expectedRatio) * 100;
    }
  }

  private updateMismatchDetection(): void {
    const mismatchedLayers: CoherenceLayer[] = [];
    let totalDeviation = 0;

    // Check each ratio for deviation
    for (const ratio of this.coherenceRatios) {
      if (ratio.deviation > this.config.maxDeviation) {
        if (!mismatchedLayers.includes(ratio.layer1)) {
          mismatchedLayers.push(ratio.layer1);
        }
        if (!mismatchedLayers.includes(ratio.layer2)) {
          mismatchedLayers.push(ratio.layer2);
        }
      }

      totalDeviation += ratio.deviation;
    }

    const avgDeviation = totalDeviation / this.coherenceRatios.length;

    this.mismatchDetection.detected = mismatchedLayers.length > 0;
    this.mismatchDetection.mismatchedLayers = mismatchedLayers;
    this.mismatchDetection.severity = Math.min(100, avgDeviation * 2);
    this.mismatchDetection.correctionNeeded = this.mismatchDetection.severity > 20;
  }

  private updateCoherenceScore(): void {
    const layers = Array.from(this.layerVectors.values());

    // Calculate overall coherence (inverse of deviation)
    const deviations = this.coherenceRatios.map((r) => r.deviation);
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;

    this.coherenceScore.overall = Math.max(0, 100 - avgDeviation);

    // Calculate coherence by layer
    for (const layer of layers) {
      const layerRatios = this.coherenceRatios.filter((r) => r.layer1 === layer.layer || r.layer2 === layer.layer);

      const layerDeviation = layerRatios.reduce((sum, r) => sum + r.deviation, 0) / layerRatios.length;

      const layerCoherence = Math.max(0, 100 - layerDeviation);
      layer.coherence = layerCoherence;
      this.coherenceScore.byLayer.set(layer.layer, layerCoherence);
    }

    // Calculate variance
    const values = layers.map((l) => l.value);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    this.coherenceScore.variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;

    // Stability = inverse of variance
    this.coherenceScore.stability = Math.max(0, 100 - this.coherenceScore.variance);
  }

  private updateCoherenceCorrection(): void {
    if (!this.coherenceCorrection.active) return;

    // Increment correction progress
    const progressIncrement = this.config.monitoringInterval / 2000; // 2 seconds to full correction
    this.coherenceCorrection.progress = Math.min(1, this.coherenceCorrection.progress + progressIncrement);

    // Apply correction
    this.applyCoherenceCorrection();

    // Complete correction if progress is 1
    if (this.coherenceCorrection.progress >= 1) {
      this.coherenceCorrection.active = false;
    }
  }

  /* ================================ */
  /* LAYER VECTORS                    */
  /* ================================ */

  public updateLayer(layer: CoherenceLayer, value: number): void {
    const vector = this.layerVectors.get(layer);
    if (!vector) return;

    vector.value = Math.max(0, Math.min(100, value));

    // Add to history
    let history = this.layerHistory.get(layer);
    if (!history) {
      history = [];
      this.layerHistory.set(layer, history);
    }

    history.push(vector.value);

    // Keep only last 20 samples
    if (history.length > 20) {
      history.shift();
    }
  }

  public setTarget(layer: CoherenceLayer, target: number): void {
    const vector = this.layerVectors.get(layer);
    if (!vector) return;

    vector.target = Math.max(0, Math.min(100, target));
  }

  public getLayerValue(layer: CoherenceLayer): number | null {
    const vector = this.layerVectors.get(layer);
    return vector ? vector.value : null;
  }

  public getLayerCoherence(layer: CoherenceLayer): number | null {
    const vector = this.layerVectors.get(layer);
    return vector ? vector.coherence : null;
  }

  /* ================================ */
  /* COHERENCE RATIOS                 */
  /* ================================ */

  public getRatio(layer1: CoherenceLayer, layer2: CoherenceLayer): CoherenceRatio | null {
    return this.coherenceRatios.find((r) => r.layer1 === layer1 && r.layer2 === layer2) || null;
  }

  public setExpectedRatio(layer1: CoherenceLayer, layer2: CoherenceLayer, expectedRatio: number): void {
    const ratio = this.coherenceRatios.find((r) => r.layer1 === layer1 && r.layer2 === layer2);

    if (ratio) {
      ratio.expectedRatio = Math.max(0.1, Math.min(10, expectedRatio));
    }
  }

  /* ================================ */
  /* MISMATCH DETECTION               */
  /* ================================ */

  public getMismatchStatus(): MismatchDetection {
    return { ...this.mismatchDetection };
  }

  public detectMismatches(): CoherenceLayer[] {
    return [...this.mismatchDetection.mismatchedLayers];
  }

  /* ================================ */
  /* COHERENCE CORRECTION             */
  /* ================================ */

  public activateCorrection(targetLayer?: CoherenceLayer): void {
    // If no target specified, correct the layer with lowest coherence
    if (!targetLayer) {
      let lowestCoherence = 100;
      let lowestLayer: CoherenceLayer = 'tone';

      const byLayerEntries = Array.from(this.coherenceScore.byLayer.entries());
      for (const [layer, coherence] of byLayerEntries) {
        if (coherence < lowestCoherence) {
          lowestCoherence = coherence;
          lowestLayer = layer;
        }
      }

      targetLayer = lowestLayer;
    }

    this.coherenceCorrection.active = true;
    this.coherenceCorrection.targetLayer = targetLayer;
    this.coherenceCorrection.progress = 0;
  }

  public deactivateCorrection(): void {
    this.coherenceCorrection.active = false;
  }

  private applyCoherenceCorrection(): void {
    const targetLayer = this.coherenceCorrection.targetLayer;
    const vector = this.layerVectors.get(targetLayer);

    if (!vector) return;

    // Calculate target value from other layers
    const otherLayers = Array.from(this.layerVectors.values()).filter((v) => v.layer !== targetLayer);

    const avgOtherLayers = otherLayers.reduce((sum, v) => sum + v.value, 0) / otherLayers.length;

    // Pull toward average
    const correction = (avgOtherLayers - vector.value) * this.coherenceCorrection.correctionStrength * this.coherenceCorrection.progress * 0.1;

    vector.value += correction;
    vector.value = Math.max(0, Math.min(100, vector.value));
  }

  public correctAllLayers(): void {
    // Calculate overall average
    const layers = Array.from(this.layerVectors.values());
    const avg = layers.reduce((sum, v) => sum + v.value, 0) / layers.length;

    // Pull all layers toward average
    for (const vector of layers) {
      const correction = (avg - vector.value) * this.config.correctionStrength * 0.1;
      vector.value += correction;
      vector.value = Math.max(0, Math.min(100, vector.value));
    }
  }

  /* ================================ */
  /* COHERENCE SCORE                  */
  /* ================================ */

  public getCoherenceScore(): number {
    return this.coherenceScore.overall;
  }

  public getCoherenceByLayer(layer: CoherenceLayer): number | null {
    return this.coherenceScore.byLayer.get(layer) || null;
  }

  public getCoherenceStability(): number {
    return this.coherenceScore.stability;
  }

  /* ================================ */
  /* CROSS-LAYER ALIGNMENT            */
  /* ================================ */

  public alignLayers(sourceLayers: CoherenceLayer[], targetLayer: CoherenceLayer): void {
    const sourceVectors = sourceLayers.map((l) => this.layerVectors.get(l)).filter((v) => v !== undefined) as LayerVector[];

    const targetVector = this.layerVectors.get(targetLayer);

    if (!targetVector || sourceVectors.length === 0) return;

    // Calculate average of source layers
    const avgSource = sourceVectors.reduce((sum, v) => sum + v.value, 0) / sourceVectors.length;

    // Align target to average
    targetVector.value = avgSource;
  }

  public cascadeAlignment(startLayer: CoherenceLayer): void {
    const layerOrder: CoherenceLayer[] = ['tone', 'expression', 'presence', 'aura', 'visual'];

    const startIndex = layerOrder.indexOf(startLayer);
    if (startIndex === -1) return;

    // Cascade from start layer to all subsequent layers
    for (let i = startIndex + 1; i < layerOrder.length; i++) {
      const prevLayer = layerOrder[i - 1];
      const currentLayer = layerOrder[i];

      const prevVector = this.layerVectors.get(prevLayer);
      const currentVector = this.layerVectors.get(currentLayer);

      if (!prevVector || !currentVector) continue;

      // Find expected ratio
      const ratio = this.coherenceRatios.find((r) => r.layer1 === prevLayer && r.layer2 === currentLayer);

      if (ratio) {
        currentVector.value = prevVector.value / ratio.expectedRatio;
      } else {
        currentVector.value = prevVector.value;
      }

      currentVector.value = Math.max(0, Math.min(100, currentVector.value));
    }
  }

  /* ================================ */
  /* VISUALIZATION DATA               */
  /* ================================ */

  public getVisualizationData() {
    const layers = Array.from(this.layerVectors.values());

    return {
      layers: layers.map((v) => ({
        layer: v.layer,
        value: v.value,
        target: v.target,
        coherence: v.coherence,
      })),
      ratios: this.coherenceRatios.map((r) => ({
        layer1: r.layer1,
        layer2: r.layer2,
        expectedRatio: r.expectedRatio,
        currentRatio: r.currentRatio,
        deviation: r.deviation,
      })),
      mismatch: { ...this.mismatchDetection },
      overallCoherence: this.coherenceScore.overall,
    };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      layerVectors: Array.from(this.layerVectors.entries()).map(([_layer, vector]) => ({ ...vector })),
      coherenceRatios: [...this.coherenceRatios],
      mismatchDetection: { ...this.mismatchDetection },
      coherenceCorrection: { ...this.coherenceCorrection },
      coherenceScore: {
        overall: this.coherenceScore.overall,
        byLayer: Array.from(this.coherenceScore.byLayer.entries()),
        variance: this.coherenceScore.variance,
        stability: this.coherenceScore.stability,
      },
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Tone Coherence Director Summary:
  Overall Coherence: ${Math.round(state.coherenceScore.overall)}
  Stability: ${Math.round(state.coherenceScore.stability)}
  Mismatch Detected: ${state.mismatchDetection.detected ? 'Yes' : 'No'}
  Mismatched Layers: ${state.mismatchDetection.mismatchedLayers.join(', ') || 'None'}
  Severity: ${Math.round(state.mismatchDetection.severity)}
  Correction Active: ${state.coherenceCorrection.active ? 'Yes' : 'No'}
  Target Layer: ${state.coherenceCorrection.targetLayer}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<ToneCoherenceConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.correctionStrength !== undefined) {
      this.coherenceCorrection.correctionStrength = config.correctionStrength;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    const layers: CoherenceLayer[] = ['tone', 'expression', 'presence', 'aura', 'visual'];

    this.layerVectors.clear();

    for (const layer of layers) {
      this.layerVectors.set(layer, {
        layer,
        value: 50,
        target: 50,
        coherence: 100,
      });
    }

    this.coherenceRatios.forEach((ratio) => {
      ratio.currentRatio = 1.0;
      ratio.deviation = 0;
    });

    this.mismatchDetection = {
      detected: false,
      mismatchedLayers: [],
      severity: 0,
      correctionNeeded: false,
    };

    this.coherenceCorrection = {
      active: false,
      targetLayer: 'tone',
      correctionStrength: this.config.correctionStrength,
      progress: 0,
    };

    this.layerHistory.clear();
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
      layerHistory: Array.from(this.layerHistory.entries()),
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      // Restore layer vectors
      this.layerVectors.clear();
      for (const layerData of parsed.state.layerVectors) {
        this.layerVectors.set(layerData.layer, layerData);
      }

      this.coherenceRatios = parsed.state.coherenceRatios;
      this.mismatchDetection = parsed.state.mismatchDetection;
      this.coherenceCorrection = parsed.state.coherenceCorrection;

      // Restore coherence score
      this.coherenceScore.overall = parsed.state.coherenceScore.overall;
      this.coherenceScore.variance = parsed.state.coherenceScore.variance;
      this.coherenceScore.stability = parsed.state.coherenceScore.stability;
      this.coherenceScore.byLayer = new Map(parsed.state.coherenceScore.byLayer);

      this.layerHistory = new Map(parsed.layerHistory);
    } catch (error) {
      console.error('[ToneCoherenceDirector] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.layerVectors.clear();
    this.layerHistory.clear();
  }
}
