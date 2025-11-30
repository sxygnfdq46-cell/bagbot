/**
 * LEVEL 12.4 — STABILITY REFINEMENT CORE
 * 
 * Micro-corrections every 50ms for ultra-smooth transitions.
 * Prevents emotional overshoot with precision clamping.
 * 
 * Features:
 * - 3 smoothing algorithms (exponential, gaussian, cubic)
 * - 0.1 precision clamps (10% max change per cycle)
 * - Gradient-return logic (smooth return to baseline)
 * - Micro-equilibrium lock mode
 * - Sovereign-probability weighting
 * - Ultra-fine tuning every 50ms
 * 
 * Monitoring: 50ms intervals (20 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type SmoothingAlgorithm = 'exponential' | 'gaussian' | 'cubic';

interface RefinementVector {
  current: number; // 0-100
  target: number; // 0-100
  baseline: number; // 0-100 (equilibrium point)
  velocity: number; // rate of change
  smoothness: number; // 0-100
}

interface MicroCorrection {
  axis: string;
  deviation: number; // from target
  correctionAmount: number;
  appliedAt: number; // timestamp
}

interface PrecisionClamp {
  maxChangePerCycle: number; // 0.1 = 10%
  clampActive: boolean;
  clampedValues: number;
}

interface GradientReturn {
  active: boolean;
  startValue: number;
  targetValue: number;
  duration: number; // ms
  progress: number; // 0-1
  curve: SmoothingAlgorithm;
}

interface MicroEquilibrium {
  locked: boolean;
  lockThreshold: number; // stability score to lock
  equilibriumPoints: Map<string, number>;
  lockStrength: number; // 0-1
}

interface SovereignProbability {
  weight: number; // 0-1 (how much sovereign state influences)
  sovereignState: Map<string, number>;
  probabilityScores: Map<string, number>;
}

interface StabilityRefinementConfig {
  smoothingAlgorithm: SmoothingAlgorithm;
  maxChangePerCycle: number;
  gradientReturnDuration: number; // ms
  microEquilibriumThreshold: number; // stability score
  sovereignWeight: number; // 0-1
  monitoringInterval: number; // ms
}

/* ================================ */
/* STABILITY REFINEMENT CORE        */
/* ================================ */

export class StabilityRefinementCore {
  private config: StabilityRefinementConfig;
  private refinementVectors: Map<string, RefinementVector>;
  private microCorrections: MicroCorrection[];
  private precisionClamp: PrecisionClamp;
  private gradientReturn: GradientReturn;
  private microEquilibrium: MicroEquilibrium;
  private sovereignProbability: SovereignProbability;
  private monitoringIntervalId: number | null;

  constructor(config?: Partial<StabilityRefinementConfig>) {
    this.config = {
      smoothingAlgorithm: 'exponential',
      maxChangePerCycle: 0.1, // 10% max change
      gradientReturnDuration: 2000, // 2 seconds
      microEquilibriumThreshold: 95, // lock at 95+ stability
      sovereignWeight: 0.8,
      monitoringInterval: 50, // 50ms
      ...config,
    };

    this.refinementVectors = new Map();
    this.microCorrections = [];

    this.precisionClamp = {
      maxChangePerCycle: this.config.maxChangePerCycle,
      clampActive: true,
      clampedValues: 0,
    };

    this.gradientReturn = {
      active: false,
      startValue: 0,
      targetValue: 0,
      duration: this.config.gradientReturnDuration,
      progress: 0,
      curve: this.config.smoothingAlgorithm,
    };

    this.microEquilibrium = {
      locked: false,
      lockThreshold: this.config.microEquilibriumThreshold,
      equilibriumPoints: new Map(),
      lockStrength: 0,
    };

    this.sovereignProbability = {
      weight: this.config.sovereignWeight,
      sovereignState: new Map(),
      probabilityScores: new Map(),
    };

    this.monitoringIntervalId = null;
    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateAllVectors();
      this.updateGradientReturn();
      this.updateMicroEquilibrium();
      this.updateSovereignProbability();
    }, this.config.monitoringInterval);
  }

  private updateAllVectors(): void {
    const vectorEntries = Array.from(this.refinementVectors.entries());

    for (const [axis, vector] of vectorEntries) {
      // Calculate deviation
      const deviation = vector.target - vector.current;

      // Apply micro-correction if needed
      if (Math.abs(deviation) > 0.1) {
        const correction = this.calculateMicroCorrection(axis, deviation);
        this.applyMicroCorrection(axis, correction);
      }

      // Update smoothness score
      vector.smoothness = Math.max(0, 100 - Math.abs(vector.velocity) * 10);
    }
  }

  private updateGradientReturn(): void {
    if (!this.gradientReturn.active) return;

    // Increment progress
    const progressIncrement = this.config.monitoringInterval / this.gradientReturn.duration;
    this.gradientReturn.progress = Math.min(1, this.gradientReturn.progress + progressIncrement);

    // Complete if progress reaches 1
    if (this.gradientReturn.progress >= 1) {
      this.gradientReturn.active = false;
    }
  }

  private updateMicroEquilibrium(): void {
    // Calculate overall stability
    const vectors = Array.from(this.refinementVectors.values());
    if (vectors.length === 0) return;

    const avgSmoothness = vectors.reduce((sum, v) => sum + v.smoothness, 0) / vectors.length;

    // Lock if above threshold
    if (avgSmoothness >= this.microEquilibrium.lockThreshold && !this.microEquilibrium.locked) {
      this.lockMicroEquilibrium();
    }

    // Unlock if drops below threshold
    if (avgSmoothness < this.microEquilibrium.lockThreshold - 5 && this.microEquilibrium.locked) {
      this.unlockMicroEquilibrium();
    }

    // Update lock strength
    if (this.microEquilibrium.locked) {
      this.microEquilibrium.lockStrength = Math.min(1, (avgSmoothness - this.microEquilibrium.lockThreshold) / 5);
    }
  }

  private updateSovereignProbability(): void {
    const vectorEntries = Array.from(this.refinementVectors.entries());

    for (const [axis, vector] of vectorEntries) {
      const sovereignValue = this.sovereignProbability.sovereignState.get(axis);

      if (sovereignValue !== undefined) {
        // Calculate probability score (how close to sovereign state)
        const deviation = Math.abs(vector.current - sovereignValue);
        const probability = Math.max(0, 100 - deviation);
        this.sovereignProbability.probabilityScores.set(axis, probability);
      }
    }
  }

  /* ================================ */
  /* SMOOTHING ALGORITHMS             */
  /* ================================ */

  private applyExponentialSmoothing(current: number, target: number, alpha: number = 0.3): number {
    return current + alpha * (target - current);
  }

  private applyGaussianSmoothing(current: number, target: number, sigma: number = 2): number {
    const deviation = target - current;
    const gaussianWeight = Math.exp(-(deviation * deviation) / (2 * sigma * sigma));
    return current + deviation * gaussianWeight;
  }

  private applyCubicSmoothing(current: number, target: number, progress: number): number {
    // Cubic ease-in-out
    const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    return current + (target - current) * t;
  }

  private smoothValue(axis: string, current: number, target: number): number {
    const algorithm = this.config.smoothingAlgorithm;

    let smoothed: number;

    switch (algorithm) {
      case 'exponential':
        smoothed = this.applyExponentialSmoothing(current, target, 0.3);
        break;

      case 'gaussian':
        smoothed = this.applyGaussianSmoothing(current, target, 2);
        break;

      case 'cubic':
        smoothed = this.applyCubicSmoothing(current, target, 0.5);
        break;

      default:
        smoothed = this.applyExponentialSmoothing(current, target, 0.3);
    }

    return smoothed;
  }

  /* ================================ */
  /* PRECISION CLAMP                  */
  /* ================================ */

  private applyPrecisionClamp(axis: string, newValue: number, currentValue: number): number {
    if (!this.precisionClamp.clampActive) return newValue;

    const maxChange = this.precisionClamp.maxChangePerCycle * 100; // convert to 0-100 scale
    const actualChange = newValue - currentValue;

    if (Math.abs(actualChange) > maxChange) {
      this.precisionClamp.clampedValues++;

      // Clamp to max allowed change
      const sign = actualChange > 0 ? 1 : -1;
      return currentValue + sign * maxChange;
    }

    return newValue;
  }

  /* ================================ */
  /* MICRO-CORRECTIONS                */
  /* ================================ */

  private calculateMicroCorrection(axis: string, deviation: number): number {
    // Apply sovereign probability weighting
    const probabilityScore = this.sovereignProbability.probabilityScores.get(axis) || 50;
    const weight = (probabilityScore / 100) * this.sovereignProbability.weight;

    // Calculate correction amount
    let correction = deviation * 0.2; // 20% of deviation per cycle

    // Apply sovereign weight
    correction *= 1 + weight;

    // Apply micro-equilibrium lock if active
    if (this.microEquilibrium.locked) {
      correction *= 1 - this.microEquilibrium.lockStrength * 0.5; // reduce correction when locked
    }

    return correction;
  }

  private applyMicroCorrection(axis: string, correction: number): void {
    const vector = this.refinementVectors.get(axis);
    if (!vector) return;

    const now = Date.now();

    // Record correction
    this.microCorrections.push({
      axis,
      deviation: vector.target - vector.current,
      correctionAmount: correction,
      appliedAt: now,
    });

    // Apply smoothing
    const smoothed = this.smoothValue(axis, vector.current, vector.current + correction);

    // Apply precision clamp
    const clamped = this.applyPrecisionClamp(axis, smoothed, vector.current);

    // Update velocity
    vector.velocity = (clamped - vector.current) / (this.config.monitoringInterval / 1000);

    // Update current value
    vector.current = clamped;

    // Keep only last 100 corrections
    if (this.microCorrections.length > 100) {
      this.microCorrections = this.microCorrections.slice(-100);
    }
  }

  /* ================================ */
  /* GRADIENT RETURN                  */
  /* ================================ */

  public activateGradientReturn(axis: string, targetValue: number): void {
    const vector = this.refinementVectors.get(axis);
    if (!vector) return;

    this.gradientReturn.active = true;
    this.gradientReturn.startValue = vector.current;
    this.gradientReturn.targetValue = targetValue;
    this.gradientReturn.progress = 0;
    this.gradientReturn.curve = this.config.smoothingAlgorithm;
  }

  public getGradientReturnValue(axis: string): number | null {
    if (!this.gradientReturn.active) return null;

    const vector = this.refinementVectors.get(axis);
    if (!vector) return null;

    const progress = this.gradientReturn.progress;
    const start = this.gradientReturn.startValue;
    const target = this.gradientReturn.targetValue;

    return this.applyCubicSmoothing(start, target, progress);
  }

  /* ================================ */
  /* MICRO-EQUILIBRIUM LOCK           */
  /* ================================ */

  private lockMicroEquilibrium(): void {
    this.microEquilibrium.locked = true;

    // Capture current values as equilibrium points
    const vectorEntries = Array.from(this.refinementVectors.entries());
    for (const [axis, vector] of vectorEntries) {
      this.microEquilibrium.equilibriumPoints.set(axis, vector.current);
    }
  }

  private unlockMicroEquilibrium(): void {
    this.microEquilibrium.locked = false;
    this.microEquilibrium.lockStrength = 0;
  }

  public isMicroEquilibriumLocked(): boolean {
    return this.microEquilibrium.locked;
  }

  /* ================================ */
  /* SOVEREIGN PROBABILITY            */
  /* ================================ */

  public setSovereignState(axis: string, value: number): void {
    this.sovereignProbability.sovereignState.set(axis, Math.max(0, Math.min(100, value)));
  }

  public getSovereignProbability(axis: string): number | null {
    return this.sovereignProbability.probabilityScores.get(axis) || null;
  }

  public setSovereignWeight(weight: number): void {
    this.sovereignProbability.weight = Math.max(0, Math.min(1, weight));
  }

  /* ================================ */
  /* VECTOR MANAGEMENT                */
  /* ================================ */

  public createVector(axis: string, initialValue: number = 50): void {
    this.refinementVectors.set(axis, {
      current: initialValue,
      target: initialValue,
      baseline: initialValue,
      velocity: 0,
      smoothness: 100,
    });

    // Initialize sovereign state
    this.sovereignProbability.sovereignState.set(axis, initialValue);
    this.sovereignProbability.probabilityScores.set(axis, 100);
  }

  public updateVector(axis: string, value: number): void {
    const vector = this.refinementVectors.get(axis);
    if (!vector) return;

    vector.target = Math.max(0, Math.min(100, value));
  }

  public setBaseline(axis: string, baseline: number): void {
    const vector = this.refinementVectors.get(axis);
    if (!vector) return;

    vector.baseline = Math.max(0, Math.min(100, baseline));
  }

  public getCurrentValue(axis: string): number | null {
    const vector = this.refinementVectors.get(axis);
    return vector ? vector.current : null;
  }

  public getVelocity(axis: string): number | null {
    const vector = this.refinementVectors.get(axis);
    return vector ? vector.velocity : null;
  }

  public getSmoothness(axis: string): number | null {
    const vector = this.refinementVectors.get(axis);
    return vector ? vector.smoothness : null;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      refinementVectors: Object.fromEntries(this.refinementVectors.entries()),
      microCorrections: this.microCorrections.slice(-10), // last 10
      precisionClamp: { ...this.precisionClamp },
      gradientReturn: { ...this.gradientReturn },
      microEquilibrium: {
        locked: this.microEquilibrium.locked,
        lockThreshold: this.microEquilibrium.lockThreshold,
        lockStrength: this.microEquilibrium.lockStrength,
        equilibriumCount: this.microEquilibrium.equilibriumPoints.size,
      },
      sovereignProbability: {
        weight: this.sovereignProbability.weight,
        averageProbability: this.getAverageSovereignProbability(),
      },
    };
  }

  public getSummary(): string {
    const state = this.getState();
    const vectorCount = Object.keys(state.refinementVectors).length;

    return `Stability Refinement Core Summary:
  Vectors Tracked: ${vectorCount}
  Smoothing Algorithm: ${this.config.smoothingAlgorithm}
  Max Change Per Cycle: ${(this.config.maxChangePerCycle * 100).toFixed(1)}%
  Clamp Active: ${state.precisionClamp.clampActive ? 'Yes' : 'No'}
  Clamped Values: ${state.precisionClamp.clampedValues}
  Gradient Return: ${state.gradientReturn.active ? 'Active' : 'Inactive'}
  Micro-Equilibrium: ${state.microEquilibrium.locked ? 'Locked' : 'Unlocked'}
  Lock Strength: ${(state.microEquilibrium.lockStrength * 100).toFixed(1)}%
  Sovereign Weight: ${(state.sovereignProbability.weight * 100).toFixed(1)}%
  Avg Sovereign Probability: ${state.sovereignProbability.averageProbability.toFixed(1)}`;
  }

  private getAverageSovereignProbability(): number {
    const scores = Array.from(this.sovereignProbability.probabilityScores.values());
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<StabilityRefinementConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.maxChangePerCycle !== undefined) {
      this.precisionClamp.maxChangePerCycle = config.maxChangePerCycle;
    }

    if (config.gradientReturnDuration !== undefined) {
      this.gradientReturn.duration = config.gradientReturnDuration;
    }

    if (config.microEquilibriumThreshold !== undefined) {
      this.microEquilibrium.lockThreshold = config.microEquilibriumThreshold;
    }

    if (config.sovereignWeight !== undefined) {
      this.sovereignProbability.weight = config.sovereignWeight;
    }

    if (config.smoothingAlgorithm !== undefined) {
      this.gradientReturn.curve = config.smoothingAlgorithm;
    }
  }

  public setMaxChangePerCycle(maxChange: number): void {
    this.precisionClamp.maxChangePerCycle = Math.max(0, Math.min(1, maxChange));
  }

  public enablePrecisionClamp(enabled: boolean): void {
    this.precisionClamp.clampActive = enabled;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.refinementVectors.clear();
    this.microCorrections = [];

    this.precisionClamp = {
      maxChangePerCycle: this.config.maxChangePerCycle,
      clampActive: true,
      clampedValues: 0,
    };

    this.gradientReturn = {
      active: false,
      startValue: 0,
      targetValue: 0,
      duration: this.config.gradientReturnDuration,
      progress: 0,
      curve: this.config.smoothingAlgorithm,
    };

    this.microEquilibrium.locked = false;
    this.microEquilibrium.equilibriumPoints.clear();
    this.microEquilibrium.lockStrength = 0;

    this.sovereignProbability.sovereignState.clear();
    this.sovereignProbability.probabilityScores.clear();
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      // Restore vectors
      const vectors = parsed.state.refinementVectors;
      this.refinementVectors.clear();
      for (const [axis, vector] of Object.entries(vectors)) {
        this.refinementVectors.set(axis, vector as RefinementVector);
      }

      // Restore other state
      this.precisionClamp = parsed.state.precisionClamp;
      this.gradientReturn = parsed.state.gradientReturn;
    } catch (error) {
      console.error('[StabilityRefinementCore] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.refinementVectors.clear();
    this.microCorrections = [];
    this.microEquilibrium.equilibriumPoints.clear();
    this.sovereignProbability.sovereignState.clear();
    this.sovereignProbability.probabilityScores.clear();
  }
}
