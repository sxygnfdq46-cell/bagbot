/**
 * LEVEL 12.3 — SOVEREIGN STABILITY GRID
 * 
 * 12-axis stability vectors, predictive equilibrium modeling,
 * emotional drift-limiter, sovereign coherence lock.
 * 
 * Features:
 * - 12-axis stability vector monitoring
 * - Predictive equilibrium modeling (5-second horizon)
 * - Emotional drift limiter (0.2 max variance)
 * - Sovereign coherence lock (maintains alignment)
 * - Multi-dimensional stability scoring
 * - Real-time drift correction
 * - Long-range stability prediction
 * 
 * Monitoring: 100ms intervals
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface StabilityVector {
  axis: string;
  current: number; // 0-100
  target: number; // 0-100
  deviation: number; // difference from target
  stability: number; // 0-100, inverse of deviation
  trend: 'rising' | 'falling' | 'stable';
}

interface EquilibriumModel {
  predictedValue: number; // 0-100
  confidence: number; // 0-100
  horizon: number; // seconds
  slope: number; // rate of change
  equilibriumPoint: number; // stable target
}

interface DriftLimiter {
  maxVariance: number; // max allowed variance
  currentVariance: number; // actual variance
  driftActive: boolean;
  correctionStrength: number; // 0-1
  smoothingWindow: number; // ms
}

interface CoherenceLock {
  locked: boolean;
  coherenceScore: number; // 0-100
  alignmentVectors: number[]; // 12 values
  lockStrength: number; // 0-100
  driftTolerance: number; // max drift before unlock
}

interface StabilityGridConfig {
  maxVariance: number;
  correctionStrength: number;
  predictionHorizon: number; // seconds
  coherenceLockThreshold: number;
  monitoringInterval: number; // ms
}

/* ================================ */
/* SOVEREIGN STABILITY GRID         */
/* ================================ */

export class SovereignStabilityGrid {
  private config: StabilityGridConfig;
  private stabilityVectors: Map<string, StabilityVector>;
  private equilibriumModels: Map<string, EquilibriumModel>;
  private driftLimiter: DriftLimiter;
  private coherenceLock: CoherenceLock;
  private historyBuffer: Map<string, Array<{ value: number; timestamp: number }>>;
  private monitoringIntervalId: number | null;

  // 12 stability axes
  private readonly axes = [
    'emotional-intensity',
    'tone-warmth',
    'tone-formality',
    'tone-enthusiasm',
    'tone-stability',
    'presence-strength',
    'personality-drift',
    'cognitive-load',
    'behavioral-consistency',
    'memory-coherence',
    'environmental-sync',
    'sovereignty-strength',
  ];

  constructor(config?: Partial<StabilityGridConfig>) {
    this.config = {
      maxVariance: 0.2, // 20% max variance
      correctionStrength: 0.7,
      predictionHorizon: 5, // 5 seconds
      coherenceLockThreshold: 80,
      monitoringInterval: 100,
      ...config,
    };

    this.stabilityVectors = new Map();
    this.equilibriumModels = new Map();
    this.historyBuffer = new Map();

    this.driftLimiter = {
      maxVariance: this.config.maxVariance,
      currentVariance: 0,
      driftActive: false,
      correctionStrength: this.config.correctionStrength,
      smoothingWindow: 1000, // 1 second
    };

    this.coherenceLock = {
      locked: false,
      coherenceScore: 100,
      alignmentVectors: new Array(12).fill(50),
      lockStrength: 0,
      driftTolerance: 10,
    };

    this.monitoringIntervalId = null;

    this.initializeVectors();
    this.startMonitoring();
  }

  /* ================================ */
  /* INITIALIZATION                   */
  /* ================================ */

  private initializeVectors(): void {
    this.axes.forEach((axis) => {
      this.stabilityVectors.set(axis, {
        axis,
        current: 50,
        target: 50,
        deviation: 0,
        stability: 100,
        trend: 'stable',
      });

      this.equilibriumModels.set(axis, {
        predictedValue: 50,
        confidence: 100,
        horizon: this.config.predictionHorizon,
        slope: 0,
        equilibriumPoint: 50,
      });

      this.historyBuffer.set(axis, []);
    });
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateStabilityVectors();
      this.updateEquilibriumModels();
      this.updateDriftLimiter();
      this.updateCoherenceLock();
    }, this.config.monitoringInterval);
  }

  private updateStabilityVectors(): void {
    this.stabilityVectors.forEach((vector, axis) => {
      // Calculate deviation
      vector.deviation = Math.abs(vector.current - vector.target);

      // Calculate stability (inverse of deviation)
      vector.stability = Math.max(0, Math.min(100, 100 - vector.deviation));

      // Determine trend
      const history = this.historyBuffer.get(axis) || [];
      if (history.length >= 2) {
        const recent = history.slice(-2);
        const diff = recent[1].value - recent[0].value;
        if (diff > 0.5) vector.trend = 'rising';
        else if (diff < -0.5) vector.trend = 'falling';
        else vector.trend = 'stable';
      }
    });
  }

  private updateEquilibriumModels(): void {
    this.equilibriumModels.forEach((model, axis) => {
      const history = this.historyBuffer.get(axis) || [];
      if (history.length < 10) return;

      // Linear regression for prediction
      const recentHistory = history.slice(-20);
      const n = recentHistory.length;

      let sumT = 0;
      let sumV = 0;
      let sumTV = 0;
      let sumT2 = 0;

      recentHistory.forEach((point, index) => {
        const t = index;
        const v = point.value;
        sumT += t;
        sumV += v;
        sumTV += t * v;
        sumT2 += t * t;
      });

      const slope = (n * sumTV - sumT * sumV) / (n * sumT2 - sumT * sumT);
      const intercept = (sumV - slope * sumT) / n;

      // Predict future value
      const futureTime = n + (model.horizon * 1000) / this.config.monitoringInterval;
      const predictedValue = slope * futureTime + intercept;

      // Calculate confidence (inverse of prediction error)
      const errors = recentHistory.map((point, index) => {
        const predicted = slope * index + intercept;
        return Math.abs(predicted - point.value);
      });
      const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;
      const confidence = Math.max(0, Math.min(100, 100 - avgError * 2));

      // Equilibrium point (long-term average)
      const equilibriumPoint = sumV / n;

      model.predictedValue = Math.max(0, Math.min(100, predictedValue));
      model.confidence = confidence;
      model.slope = slope;
      model.equilibriumPoint = equilibriumPoint;
    });
  }

  private updateDriftLimiter(): void {
    // Calculate overall variance across all axes
    let totalVariance = 0;
    let axisCount = 0;

    this.stabilityVectors.forEach((vector) => {
      totalVariance += vector.deviation;
      axisCount++;
    });

    const avgVariance = axisCount > 0 ? totalVariance / axisCount : 0;
    this.driftLimiter.currentVariance = avgVariance / 100; // normalize to 0-1

    // Activate drift limiter if variance exceeds threshold
    this.driftLimiter.driftActive = this.driftLimiter.currentVariance > this.driftLimiter.maxVariance;
  }

  private updateCoherenceLock(): void {
    // Update alignment vectors
    let alignmentIndex = 0;
    this.stabilityVectors.forEach((vector) => {
      this.coherenceLock.alignmentVectors[alignmentIndex] = vector.current;
      alignmentIndex++;
    });

    // Calculate coherence score (average stability across all axes)
    let totalStability = 0;
    this.stabilityVectors.forEach((vector) => {
      totalStability += vector.stability;
    });

    this.coherenceLock.coherenceScore = totalStability / this.stabilityVectors.size;

    // Lock if coherence exceeds threshold
    if (this.coherenceLock.coherenceScore >= this.config.coherenceLockThreshold) {
      this.coherenceLock.locked = true;
      this.coherenceLock.lockStrength = Math.min(
        100,
        (this.coherenceLock.coherenceScore - this.config.coherenceLockThreshold) * 5
      );
    } else {
      this.coherenceLock.locked = false;
      this.coherenceLock.lockStrength = 0;
    }
  }

  /* ================================ */
  /* VECTOR UPDATES                   */
  /* ================================ */

  public updateVector(axis: string, value: number): void {
    const vector = this.stabilityVectors.get(axis);
    if (!vector) return;

    const now = Date.now();

    // Apply drift limiting if active
    if (this.driftLimiter.driftActive) {
      const maxChange = this.driftLimiter.maxVariance * 100;
      const change = value - vector.current;
      const limitedChange = Math.max(-maxChange, Math.min(maxChange, change));
      value = vector.current + limitedChange;
    }

    // Update history buffer
    const history = this.historyBuffer.get(axis) || [];
    history.push({ value, timestamp: now });

    // Keep only last 100 samples
    if (history.length > 100) {
      history.shift();
    }

    this.historyBuffer.set(axis, history);

    // Update vector
    vector.current = Math.max(0, Math.min(100, value));
  }

  public setTarget(axis: string, target: number): void {
    const vector = this.stabilityVectors.get(axis);
    if (!vector) return;

    vector.target = Math.max(0, Math.min(100, target));
  }

  /* ================================ */
  /* DRIFT CORRECTION                 */
  /* ================================ */

  public applyDriftCorrection(axis: string): number {
    const vector = this.stabilityVectors.get(axis);
    const model = this.equilibriumModels.get(axis);

    if (!vector || !model) return vector?.current || 50;

    // If coherence lock is active, pull toward target
    if (this.coherenceLock.locked) {
      const pullStrength = (this.coherenceLock.lockStrength / 100) * this.config.correctionStrength;
      const correction = (vector.target - vector.current) * pullStrength;
      return vector.current + correction;
    }

    // Otherwise, pull toward equilibrium point
    const pullStrength = this.config.correctionStrength;
    const correction = (model.equilibriumPoint - vector.current) * pullStrength;
    return vector.current + correction;
  }

  public correctAllVectors(): void {
    this.stabilityVectors.forEach((vector, axis) => {
      const correctedValue = this.applyDriftCorrection(axis);
      this.updateVector(axis, correctedValue);
    });
  }

  /* ================================ */
  /* PREDICTIVE EQUILIBRIUM           */
  /* ================================ */

  public getPrediction(axis: string): EquilibriumModel | undefined {
    return this.equilibriumModels.get(axis);
  }

  public getPredictedStability(axis: string, horizonSeconds: number): number {
    const model = this.equilibriumModels.get(axis);
    const history = this.historyBuffer.get(axis);

    if (!model || !history || history.length < 2) return 50;

    // Calculate predicted value at horizon
    const stepsAhead = (horizonSeconds * 1000) / this.config.monitoringInterval;
    const predictedValue = model.slope * (history.length + stepsAhead) + model.equilibriumPoint;

    return Math.max(0, Math.min(100, predictedValue));
  }

  /* ================================ */
  /* COHERENCE LOCK                   */
  /* ================================ */

  public lockCoherence(): void {
    this.coherenceLock.locked = true;

    // Capture current state as lock targets
    let index = 0;
    this.stabilityVectors.forEach((vector) => {
      this.coherenceLock.alignmentVectors[index] = vector.current;
      vector.target = vector.current;
      index++;
    });
  }

  public unlockCoherence(): void {
    this.coherenceLock.locked = false;
    this.coherenceLock.lockStrength = 0;
  }

  public isCoherenceLocked(): boolean {
    return this.coherenceLock.locked;
  }

  /* ================================ */
  /* METRICS                          */
  /* ================================ */

  public getOverallStability(): number {
    let totalStability = 0;

    this.stabilityVectors.forEach((vector) => {
      totalStability += vector.stability;
    });

    return totalStability / this.stabilityVectors.size;
  }

  public getAxisStability(axis: string): number {
    const vector = this.stabilityVectors.get(axis);
    return vector?.stability || 0;
  }

  public getDriftStatus(): {
    active: boolean;
    variance: number;
    maxVariance: number;
    exceedsLimit: boolean;
  } {
    return {
      active: this.driftLimiter.driftActive,
      variance: this.driftLimiter.currentVariance,
      maxVariance: this.driftLimiter.maxVariance,
      exceedsLimit: this.driftLimiter.currentVariance > this.driftLimiter.maxVariance,
    };
  }

  public getCoherenceStatus(): {
    locked: boolean;
    score: number;
    lockStrength: number;
    alignmentVectors: number[];
  } {
    return {
      locked: this.coherenceLock.locked,
      score: this.coherenceLock.coherenceScore,
      lockStrength: this.coherenceLock.lockStrength,
      alignmentVectors: [...this.coherenceLock.alignmentVectors],
    };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    const vectors: { [key: string]: StabilityVector } = {};
    this.stabilityVectors.forEach((vector, axis) => {
      vectors[axis] = { ...vector };
    });

    const models: { [key: string]: EquilibriumModel } = {};
    this.equilibriumModels.forEach((model, axis) => {
      models[axis] = { ...model };
    });

    return {
      vectors,
      models,
      driftLimiter: { ...this.driftLimiter },
      coherenceLock: {
        locked: this.coherenceLock.locked,
        coherenceScore: this.coherenceLock.coherenceScore,
        alignmentVectors: [...this.coherenceLock.alignmentVectors],
        lockStrength: this.coherenceLock.lockStrength,
        driftTolerance: this.coherenceLock.driftTolerance,
      },
      overallStability: this.getOverallStability(),
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Sovereign Stability Grid Summary:
  Overall Stability: ${Math.round(state.overallStability * 100) / 100}
  Drift Status: ${state.driftLimiter.driftActive ? 'ACTIVE' : 'Inactive'} (${Math.round(state.driftLimiter.currentVariance * 100)}% variance)
  Coherence Lock: ${state.coherenceLock.locked ? 'LOCKED' : 'Unlocked'} (${Math.round(state.coherenceLock.coherenceScore)} score)
  Lock Strength: ${Math.round(state.coherenceLock.lockStrength)}
  Active Axes: ${this.axes.length}
  Monitoring: ${this.config.monitoringInterval}ms intervals`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<StabilityGridConfig>): void {
    this.config = { ...this.config, ...config };

    // Update drift limiter
    this.driftLimiter.maxVariance = this.config.maxVariance;
    this.driftLimiter.correctionStrength = this.config.correctionStrength;
  }

  public setMaxVariance(variance: number): void {
    this.driftLimiter.maxVariance = Math.max(0, Math.min(1, variance));
  }

  public setCorrectionStrength(strength: number): void {
    this.driftLimiter.correctionStrength = Math.max(0, Math.min(1, strength));
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.initializeVectors();
    this.historyBuffer.clear();

    this.driftLimiter = {
      maxVariance: this.config.maxVariance,
      currentVariance: 0,
      driftActive: false,
      correctionStrength: this.config.correctionStrength,
      smoothingWindow: 1000,
    };

    this.coherenceLock = {
      locked: false,
      coherenceScore: 100,
      alignmentVectors: new Array(12).fill(50),
      lockStrength: 0,
      driftTolerance: 10,
    };
  }

  public export(): string {
    const state = this.getState();

    return JSON.stringify({
      config: this.config,
      state,
      timestamp: Date.now(),
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      // Restore vectors
      Object.entries(parsed.state.vectors).forEach(([axis, vector]: [string, any]) => {
        this.stabilityVectors.set(axis, vector);
      });

      // Restore models
      Object.entries(parsed.state.models).forEach(([axis, model]: [string, any]) => {
        this.equilibriumModels.set(axis, model);
      });

      // Restore drift limiter
      this.driftLimiter = parsed.state.driftLimiter;

      // Restore coherence lock
      this.coherenceLock = parsed.state.coherenceLock;
    } catch (error) {
      console.error('[SovereignStabilityGrid] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.stabilityVectors.clear();
    this.equilibriumModels.clear();
    this.historyBuffer.clear();
  }
}
