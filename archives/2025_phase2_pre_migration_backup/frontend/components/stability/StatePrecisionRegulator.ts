/**
 * LEVEL 12.3 — STATE PRECISION REGULATOR
 * 
 * Overshoot correction, precision scoring,
 * boundary enforcement, stability smoothing window.
 * 
 * Features:
 * - Overshoot detection and correction
 * - Precision scoring (0-100)
 * - Hard/soft boundary enforcement
 * - Stability smoothing window
 * - State prediction bounding
 * - Precise state control under load
 * - Multi-layer precision tracking
 * 
 * Monitoring: 100ms intervals (10 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface PrecisionMetrics {
  precisionScore: number; // 0-100
  overshootCount: number;
  boundaryViolations: number;
  smoothnessScore: number;
  averageError: number;
}

interface OvershootCorrection {
  active: boolean;
  overshootMagnitude: number;
  correctionFactor: number; // 0-1
  damping: number; // 0-1
}

interface BoundaryEnforcement {
  hardMin: number;
  hardMax: number;
  softMin: number;
  softMax: number;
  mode: 'hard' | 'soft' | 'adaptive';
  violationPenalty: number;
}

interface SmoothingWindow {
  windowSize: number; // number of samples
  samples: number[];
  smoothedValue: number;
  variance: number;
}

interface StateBounds {
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number; // 0-100
}

interface StatePrecisionConfig {
  targetPrecision: number; // 0-100
  overshootThreshold: number; // % beyond target
  dampingFactor: number;
  smoothingWindowSize: number;
  boundaryMode: 'hard' | 'soft' | 'adaptive';
  monitoringInterval: number; // ms
}

/* ================================ */
/* STATE PRECISION REGULATOR        */
/* ================================ */

export class StatePrecisionRegulator {
  private config: StatePrecisionConfig;
  private precisionMetrics: PrecisionMetrics;
  private overshootCorrection: OvershootCorrection;
  private boundaryEnforcement: BoundaryEnforcement;
  private smoothingWindows: Map<string, SmoothingWindow>;
  private stateBounds: Map<string, StateBounds>;
  private stateHistory: Map<string, number[]>;
  private monitoringIntervalId: number | null;

  constructor(config?: Partial<StatePrecisionConfig>) {
    this.config = {
      targetPrecision: 95,
      overshootThreshold: 10, // 10% beyond target
      dampingFactor: 0.7,
      smoothingWindowSize: 10,
      boundaryMode: 'soft',
      monitoringInterval: 100,
      ...config,
    };

    this.precisionMetrics = {
      precisionScore: 100,
      overshootCount: 0,
      boundaryViolations: 0,
      smoothnessScore: 100,
      averageError: 0,
    };

    this.overshootCorrection = {
      active: false,
      overshootMagnitude: 0,
      correctionFactor: 0.8,
      damping: this.config.dampingFactor,
    };

    this.boundaryEnforcement = {
      hardMin: 0,
      hardMax: 100,
      softMin: 10,
      softMax: 90,
      mode: this.config.boundaryMode,
      violationPenalty: 10,
    };

    this.smoothingWindows = new Map();
    this.stateBounds = new Map();
    this.stateHistory = new Map();
    this.monitoringIntervalId = null;

    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updatePrecisionMetrics();
      this.updateOvershootCorrection();
    }, this.config.monitoringInterval);
  }

  private updatePrecisionMetrics(): void {
    // Calculate average error across all tracked states
    let totalError = 0;
    let stateCount = 0;

    const historyEntries = Array.from(this.stateHistory.entries());
    for (const [key, history] of historyEntries) {
      if (history.length < 2) continue;

      const bounds = this.stateBounds.get(key);
      if (!bounds) continue;

      const currentValue = history[history.length - 1];
      const error = Math.abs(currentValue - bounds.predictedValue);

      totalError += error;
      stateCount++;
    }

    this.precisionMetrics.averageError = stateCount > 0 ? totalError / stateCount : 0;

    // Calculate precision score (inverse of average error)
    this.precisionMetrics.precisionScore = Math.max(0, 100 - this.precisionMetrics.averageError * 2);

    // Calculate smoothness score
    let totalSmoothness = 0;
    let windowCount = 0;

    const windows = Array.from(this.smoothingWindows.values());
    for (const window of windows) {
      if (window.samples.length < 3) continue;

      // Calculate jerkiness (second derivative)
      let jerkiness = 0;
      for (let i = 2; i < window.samples.length; i++) {
        const secondDerivative = window.samples[i] - 2 * window.samples[i - 1] + window.samples[i - 2];
        jerkiness += Math.abs(secondDerivative);
      }

      const avgJerkiness = jerkiness / (window.samples.length - 2);
      const smoothness = Math.max(0, 100 - avgJerkiness * 5);

      totalSmoothness += smoothness;
      windowCount++;
    }

    this.precisionMetrics.smoothnessScore = windowCount > 0 ? totalSmoothness / windowCount : 100;
  }

  private updateOvershootCorrection(): void {
    // Gradually reduce overshoot magnitude
    if (this.overshootCorrection.overshootMagnitude > 0) {
      this.overshootCorrection.overshootMagnitude *= 0.95;

      if (this.overshootCorrection.overshootMagnitude < 0.1) {
        this.overshootCorrection.overshootMagnitude = 0;
        this.overshootCorrection.active = false;
      }
    }
  }

  /* ================================ */
  /* OVERSHOOT CORRECTION             */
  /* ================================ */

  public detectOvershoot(key: string, currentValue: number, targetValue: number): boolean {
    const deviation = Math.abs(currentValue - targetValue);
    const thresholdExceeded = deviation > this.config.overshootThreshold;

    if (thresholdExceeded) {
      this.overshootCorrection.active = true;
      this.overshootCorrection.overshootMagnitude = deviation;
      this.precisionMetrics.overshootCount++;
      return true;
    }

    return false;
  }

  public correctOvershoot(currentValue: number, targetValue: number): number {
    if (!this.overshootCorrection.active) return currentValue;

    const deviation = currentValue - targetValue;
    const correction = deviation * this.overshootCorrection.correctionFactor;
    const dampedCorrection = correction * this.overshootCorrection.damping;

    return currentValue - dampedCorrection;
  }

  /* ================================ */
  /* BOUNDARY ENFORCEMENT             */
  /* ================================ */

  public enforceHardBoundary(value: number): number {
    return Math.max(this.boundaryEnforcement.hardMin, Math.min(this.boundaryEnforcement.hardMax, value));
  }

  public enforceSoftBoundary(value: number): number {
    const { softMin, softMax } = this.boundaryEnforcement;

    if (value < softMin) {
      const deviation = softMin - value;
      const penalty = Math.min(deviation * 0.5, 10);
      this.precisionMetrics.precisionScore -= penalty;
      return softMin + (value - softMin) * 0.2; // Allow 20% penetration
    }

    if (value > softMax) {
      const deviation = value - softMax;
      const penalty = Math.min(deviation * 0.5, 10);
      this.precisionMetrics.precisionScore -= penalty;
      return softMax + (value - softMax) * 0.2; // Allow 20% penetration
    }

    return value;
  }

  public enforceAdaptiveBoundary(value: number, history: number[]): number {
    if (history.length < 5) return this.enforceSoftBoundary(value);

    // Calculate adaptive bounds from history
    const avg = history.reduce((sum, val) => sum + val, 0) / history.length;
    const variance = history.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    const adaptiveMin = avg - stdDev * 2;
    const adaptiveMax = avg + stdDev * 2;

    if (value < adaptiveMin) {
      this.precisionMetrics.boundaryViolations++;
      return adaptiveMin + (value - adaptiveMin) * 0.3;
    }

    if (value > adaptiveMax) {
      this.precisionMetrics.boundaryViolations++;
      return adaptiveMax + (value - adaptiveMax) * 0.3;
    }

    return value;
  }

  public enforceBoundary(key: string, value: number): number {
    const history = this.stateHistory.get(key) || [];

    switch (this.boundaryEnforcement.mode) {
      case 'hard':
        return this.enforceHardBoundary(value);
      case 'soft':
        return this.enforceSoftBoundary(value);
      case 'adaptive':
        return this.enforceAdaptiveBoundary(value, history);
      default:
        return value;
    }
  }

  public setBoundaries(hardMin: number, hardMax: number, softMin: number, softMax: number): void {
    this.boundaryEnforcement.hardMin = hardMin;
    this.boundaryEnforcement.hardMax = hardMax;
    this.boundaryEnforcement.softMin = softMin;
    this.boundaryEnforcement.softMax = softMax;
  }

  /* ================================ */
  /* SMOOTHING WINDOW                 */
  /* ================================ */

  public addToSmoothingWindow(key: string, value: number): number {
    let window = this.smoothingWindows.get(key);

    if (!window) {
      window = {
        windowSize: this.config.smoothingWindowSize,
        samples: [],
        smoothedValue: value,
        variance: 0,
      };
      this.smoothingWindows.set(key, window);
    }

    // Add sample
    window.samples.push(value);

    // Keep only last N samples
    if (window.samples.length > window.windowSize) {
      window.samples = window.samples.slice(-window.windowSize);
    }

    // Calculate smoothed value (moving average)
    const sum = window.samples.reduce((acc, val) => acc + val, 0);
    window.smoothedValue = sum / window.samples.length;

    // Calculate variance
    const avg = window.smoothedValue;
    window.variance = window.samples.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / window.samples.length;

    return window.smoothedValue;
  }

  public getSmoothedValue(key: string): number | null {
    const window = this.smoothingWindows.get(key);
    return window ? window.smoothedValue : null;
  }

  public getSmoothingVariance(key: string): number | null {
    const window = this.smoothingWindows.get(key);
    return window ? window.variance : null;
  }

  /* ================================ */
  /* STATE PREDICTION BOUNDING        */
  /* ================================ */

  public predictWithBounds(key: string, value: number): StateBounds {
    const history = this.stateHistory.get(key) || [];

    // Add current value to history
    history.push(value);
    if (history.length > 20) {
      history.shift(); // Keep last 20
    }
    this.stateHistory.set(key, history);

    if (history.length < 3) {
      // Not enough data for prediction
      return {
        predictedValue: value,
        lowerBound: value - 5,
        upperBound: value + 5,
        confidence: 50,
      };
    }

    // Linear regression prediction
    const n = history.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const yValues = history;

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next value
    const predictedValue = slope * n + intercept;

    // Calculate prediction error
    const errors = history.map((y, i) => Math.abs(y - (slope * i + intercept)));
    const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length;

    // Confidence based on error
    const confidence = Math.max(0, 100 - avgError * 2);

    // Bounds based on error
    const lowerBound = predictedValue - avgError * 1.5;
    const upperBound = predictedValue + avgError * 1.5;

    const bounds: StateBounds = {
      predictedValue,
      lowerBound,
      upperBound,
      confidence,
    };

    this.stateBounds.set(key, bounds);
    return bounds;
  }

  public getStateBounds(key: string): StateBounds | null {
    return this.stateBounds.get(key) || null;
  }

  /* ================================ */
  /* PRECISE STATE CONTROL            */
  /* ================================ */

  public regulateState(key: string, value: number, targetValue: number): number {
    // Step 1: Add to smoothing window
    const smoothed = this.addToSmoothingWindow(key, value);

    // Step 2: Detect and correct overshoot
    this.detectOvershoot(key, smoothed, targetValue);
    const corrected = this.correctOvershoot(smoothed, targetValue);

    // Step 3: Enforce boundaries
    const bounded = this.enforceBoundary(key, corrected);

    // Step 4: Update prediction bounds
    this.predictWithBounds(key, bounded);

    return bounded;
  }

  /* ================================ */
  /* PRECISION SCORING                */
  /* ================================ */

  public calculatePrecision(key: string): number {
    const window = this.smoothingWindows.get(key);
    if (!window || window.samples.length < 3) return 100;

    // Precision = inverse of variance
    const precisionScore = Math.max(0, 100 - window.variance * 2);
    return precisionScore;
  }

  public getOverallPrecision(): number {
    return this.precisionMetrics.precisionScore;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      precisionMetrics: { ...this.precisionMetrics },
      overshootCorrection: { ...this.overshootCorrection },
      boundaryEnforcement: { ...this.boundaryEnforcement },
      smoothingWindows: this.smoothingWindows.size,
      stateBounds: this.stateBounds.size,
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `State Precision Regulator Summary:
  Precision Score: ${Math.round(state.precisionMetrics.precisionScore)}
  Smoothness Score: ${Math.round(state.precisionMetrics.smoothnessScore)}
  Average Error: ${state.precisionMetrics.averageError.toFixed(2)}
  Overshoot Count: ${state.precisionMetrics.overshootCount}
  Boundary Violations: ${state.precisionMetrics.boundaryViolations}
  Overshoot Correction: ${state.overshootCorrection.active ? 'Active' : 'Inactive'}
  Boundary Mode: ${state.boundaryEnforcement.mode}
  Tracked States: ${state.smoothingWindows}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<StatePrecisionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.dampingFactor !== undefined) {
      this.overshootCorrection.damping = config.dampingFactor;
    }

    if (config.boundaryMode !== undefined) {
      this.boundaryEnforcement.mode = config.boundaryMode;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.precisionMetrics = {
      precisionScore: 100,
      overshootCount: 0,
      boundaryViolations: 0,
      smoothnessScore: 100,
      averageError: 0,
    };

    this.overshootCorrection = {
      active: false,
      overshootMagnitude: 0,
      correctionFactor: 0.8,
      damping: this.config.dampingFactor,
    };

    this.smoothingWindows.clear();
    this.stateBounds.clear();
    this.stateHistory.clear();
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
      stateHistory: Array.from(this.stateHistory.entries()),
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.precisionMetrics = parsed.state.precisionMetrics;
      this.overshootCorrection = parsed.state.overshootCorrection;
      this.boundaryEnforcement = parsed.state.boundaryEnforcement;
      this.stateHistory = new Map(parsed.stateHistory);
    } catch (error) {
      console.error('[StatePrecisionRegulator] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.smoothingWindows.clear();
    this.stateBounds.clear();
    this.stateHistory.clear();
  }
}
