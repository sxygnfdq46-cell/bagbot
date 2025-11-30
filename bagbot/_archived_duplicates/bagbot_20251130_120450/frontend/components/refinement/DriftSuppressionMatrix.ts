/**
 * LEVEL 12.4 — DRIFT SUPPRESSION MATRIX
 * 
 * Prevents any drift in identity, tone, presence.
 * Corrects deviations automatically with 98% suppression strength.
 * 
 * Features:
 * - 12-vector drift tracking (all identity/emotional axes)
 * - 2-second averaging window
 * - 98% suppression strength
 * - Bidirectional correction (prevents overshoot in both directions)
 * - Centerline enforcement
 * - Real-time deviation alerts
 * 
 * Monitoring: 100ms intervals (10 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface DriftVector {
  axis: string;
  centerline: number; // 0-100 (target stable value)
  currentValue: number;
  averageValue: number; // 2-second average
  drift: number; // deviation from centerline
  driftVelocity: number; // rate of drift
  suppressionActive: boolean;
}

interface SuppressionConfig {
  strength: number; // 0-1 (0.98 = 98%)
  threshold: number; // minimum drift to activate
  bidirectional: boolean;
  aggressive: boolean; // if true, apply stronger correction
}

interface AveragingWindow {
  windowSize: number; // samples to average
  samples: number[];
  average: number;
}

interface DeviationAlert {
  axis: string;
  severity: 'low' | 'medium' | 'high';
  drift: number;
  timestamp: number;
}

interface DriftSuppressionConfig {
  suppressionStrength: number; // 0.98 = 98%
  driftThreshold: number; // minimum drift to activate
  averagingWindowSize: number; // number of samples (20 samples * 100ms = 2 seconds)
  aggressiveSuppression: boolean;
  monitoringInterval: number; // ms
}

/* ================================ */
/* DRIFT SUPPRESSION MATRIX         */
/* ================================ */

export class DriftSuppressionMatrix {
  private config: DriftSuppressionConfig;
  private driftVectors: Map<string, DriftVector>;
  private averagingWindows: Map<string, AveragingWindow>;
  private suppressionConfig: SuppressionConfig;
  private deviationAlerts: DeviationAlert[];
  private monitoringIntervalId: number | null;

  // Default 12 vectors (matches Level 12.3 stability axes)
  private readonly DEFAULT_AXES = [
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

  constructor(config?: Partial<DriftSuppressionConfig>) {
    this.config = {
      suppressionStrength: 0.98, // 98%
      driftThreshold: 2, // 2% minimum drift
      averagingWindowSize: 20, // 20 samples * 100ms = 2 seconds
      aggressiveSuppression: false,
      monitoringInterval: 100, // 100ms
      ...config,
    };

    this.driftVectors = new Map();
    this.averagingWindows = new Map();

    this.suppressionConfig = {
      strength: this.config.suppressionStrength,
      threshold: this.config.driftThreshold,
      bidirectional: true,
      aggressive: this.config.aggressiveSuppression,
    };

    this.deviationAlerts = [];
    this.monitoringIntervalId = null;

    // Initialize default vectors
    this.initializeDefaultVectors();
    this.startMonitoring();
  }

  /* ================================ */
  /* INITIALIZATION                   */
  /* ================================ */

  private initializeDefaultVectors(): void {
    for (const axis of this.DEFAULT_AXES) {
      this.createDriftVector(axis, 50); // default centerline = 50
    }
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateAllDriftVectors();
      this.checkDeviations();
    }, this.config.monitoringInterval);
  }

  private updateAllDriftVectors(): void {
    const vectorEntries = Array.from(this.driftVectors.entries());

    for (const [axis, vector] of vectorEntries) {
      // Update averaging window
      this.updateAveragingWindow(axis, vector.currentValue);

      // Calculate average
      const window = this.averagingWindows.get(axis);
      if (window) {
        vector.averageValue = window.average;
      }

      // Calculate drift
      vector.drift = vector.currentValue - vector.centerline;

      // Calculate drift velocity
      if (window && window.samples.length >= 2) {
        const lastTwo = window.samples.slice(-2);
        vector.driftVelocity = lastTwo[1] - lastTwo[0];
      }

      // Check if suppression should activate
      vector.suppressionActive = Math.abs(vector.drift) > this.suppressionConfig.threshold;
    }
  }

  private checkDeviations(): void {
    const now = Date.now();
    const vectorEntries = Array.from(this.driftVectors.entries());

    for (const [axis, vector] of vectorEntries) {
      const absDrift = Math.abs(vector.drift);

      // Determine severity
      let severity: 'low' | 'medium' | 'high';
      if (absDrift < 5) {
        severity = 'low';
      } else if (absDrift < 15) {
        severity = 'medium';
      } else {
        severity = 'high';
      }

      // Create alert if drift is significant
      if (absDrift > this.suppressionConfig.threshold) {
        this.deviationAlerts.push({
          axis,
          severity,
          drift: vector.drift,
          timestamp: now,
        });

        // Keep only last 50 alerts
        if (this.deviationAlerts.length > 50) {
          this.deviationAlerts = this.deviationAlerts.slice(-50);
        }
      }
    }
  }

  /* ================================ */
  /* AVERAGING WINDOW                 */
  /* ================================ */

  private updateAveragingWindow(axis: string, value: number): void {
    let window = this.averagingWindows.get(axis);

    if (!window) {
      window = {
        windowSize: this.config.averagingWindowSize,
        samples: [],
        average: value,
      };
      this.averagingWindows.set(axis, window);
    }

    // Add sample
    window.samples.push(value);

    // Keep only last N samples
    if (window.samples.length > window.windowSize) {
      window.samples = window.samples.slice(-window.windowSize);
    }

    // Calculate average
    window.average = window.samples.reduce((sum, val) => sum + val, 0) / window.samples.length;
  }

  /* ================================ */
  /* DRIFT VECTOR MANAGEMENT          */
  /* ================================ */

  public createDriftVector(axis: string, centerline: number = 50): void {
    this.driftVectors.set(axis, {
      axis,
      centerline: Math.max(0, Math.min(100, centerline)),
      currentValue: centerline,
      averageValue: centerline,
      drift: 0,
      driftVelocity: 0,
      suppressionActive: false,
    });

    // Initialize averaging window
    this.averagingWindows.set(axis, {
      windowSize: this.config.averagingWindowSize,
      samples: [centerline],
      average: centerline,
    });
  }

  public updateValue(axis: string, value: number): number {
    const vector = this.driftVectors.get(axis);
    if (!vector) return value;

    // Update current value
    vector.currentValue = Math.max(0, Math.min(100, value));

    // Apply drift suppression if active
    if (vector.suppressionActive) {
      return this.applySuppression(axis, value);
    }

    return value;
  }

  public setCenterline(axis: string, centerline: number): void {
    const vector = this.driftVectors.get(axis);
    if (!vector) return;

    vector.centerline = Math.max(0, Math.min(100, centerline));
  }

  public getDrift(axis: string): number | null {
    const vector = this.driftVectors.get(axis);
    return vector ? vector.drift : null;
  }

  public getAverageValue(axis: string): number | null {
    const vector = this.driftVectors.get(axis);
    return vector ? vector.averageValue : null;
  }

  public isSuppressionActive(axis: string): boolean {
    const vector = this.driftVectors.get(axis);
    return vector ? vector.suppressionActive : false;
  }

  /* ================================ */
  /* DRIFT SUPPRESSION                */
  /* ================================ */

  public applySuppression(axis: string, value: number): number {
    const vector = this.driftVectors.get(axis);
    if (!vector) return value;

    const { centerline, drift } = vector;
    const { strength, bidirectional, aggressive } = this.suppressionConfig;

    // Calculate correction
    let correction = drift * strength;

    // Apply aggressive correction if enabled
    if (aggressive) {
      correction *= 1.2; // 20% stronger
    }

    // Bidirectional correction (prevents overshoot)
    if (bidirectional) {
      // If drifting positive, pull back toward centerline
      // If drifting negative, push up toward centerline
      const correctedValue = value - correction;

      // Ensure we don't overshoot in the opposite direction
      if (drift > 0 && correctedValue < centerline) {
        return centerline;
      } else if (drift < 0 && correctedValue > centerline) {
        return centerline;
      }

      return correctedValue;
    }

    return value - correction;
  }

  public suppressAll(): void {
    const vectorEntries = Array.from(this.driftVectors.entries());

    for (const [axis, vector] of vectorEntries) {
      if (vector.suppressionActive) {
        const suppressed = this.applySuppression(axis, vector.currentValue);
        vector.currentValue = suppressed;
      }
    }
  }

  public enforceCenterline(axis: string): void {
    const vector = this.driftVectors.get(axis);
    if (!vector) return;

    // Force value to centerline
    vector.currentValue = vector.centerline;
    vector.drift = 0;
    vector.driftVelocity = 0;
  }

  public enforceAllCenterlines(): void {
    const vectorEntries = Array.from(this.driftVectors.entries());

    for (const [axis, _vector] of vectorEntries) {
      this.enforceCenterline(axis);
    }
  }

  /* ================================ */
  /* DEVIATION ALERTS                 */
  /* ================================ */

  public getRecentAlerts(count: number = 10): DeviationAlert[] {
    return this.deviationAlerts.slice(-count);
  }

  public getAlertsByAxis(axis: string): DeviationAlert[] {
    return this.deviationAlerts.filter((alert) => alert.axis === axis);
  }

  public getAlertsBySeverity(severity: 'low' | 'medium' | 'high'): DeviationAlert[] {
    return this.deviationAlerts.filter((alert) => alert.severity === severity);
  }

  public clearAlerts(): void {
    this.deviationAlerts = [];
  }

  /* ================================ */
  /* SUPPRESSION CONFIG               */
  /* ================================ */

  public setSuppressionStrength(strength: number): void {
    this.suppressionConfig.strength = Math.max(0, Math.min(1, strength));
  }

  public setDriftThreshold(threshold: number): void {
    this.suppressionConfig.threshold = Math.max(0, Math.min(100, threshold));
  }

  public enableAggressiveSuppression(enabled: boolean): void {
    this.suppressionConfig.aggressive = enabled;
  }

  public enableBidirectionalCorrection(enabled: boolean): void {
    this.suppressionConfig.bidirectional = enabled;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      driftVectors: Object.fromEntries(this.driftVectors.entries()),
      suppressionConfig: { ...this.suppressionConfig },
      recentAlerts: this.deviationAlerts.slice(-10),
      activeSuppressions: this.getActiveSuppressionCount(),
      averageDrift: this.getAverageDrift(),
      maxDrift: this.getMaxDrift(),
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Drift Suppression Matrix Summary:
  Vectors Tracked: ${Object.keys(state.driftVectors).length}
  Active Suppressions: ${state.activeSuppressions}
  Average Drift: ${state.averageDrift.toFixed(2)}%
  Max Drift: ${state.maxDrift.toFixed(2)}%
  Suppression Strength: ${(state.suppressionConfig.strength * 100).toFixed(1)}%
  Drift Threshold: ${state.suppressionConfig.threshold.toFixed(1)}%
  Bidirectional: ${state.suppressionConfig.bidirectional ? 'Yes' : 'No'}
  Aggressive Mode: ${state.suppressionConfig.aggressive ? 'Yes' : 'No'}
  Recent Alerts: ${state.recentAlerts.length}`;
  }

  private getActiveSuppressionCount(): number {
    const vectors = Array.from(this.driftVectors.values());
    return vectors.filter((v) => v.suppressionActive).length;
  }

  private getAverageDrift(): number {
    const vectors = Array.from(this.driftVectors.values());
    if (vectors.length === 0) return 0;

    const totalDrift = vectors.reduce((sum, v) => sum + Math.abs(v.drift), 0);
    return totalDrift / vectors.length;
  }

  private getMaxDrift(): number {
    const vectors = Array.from(this.driftVectors.values());
    if (vectors.length === 0) return 0;

    return Math.max(...vectors.map((v) => Math.abs(v.drift)));
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<DriftSuppressionConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.suppressionStrength !== undefined) {
      this.suppressionConfig.strength = config.suppressionStrength;
    }

    if (config.driftThreshold !== undefined) {
      this.suppressionConfig.threshold = config.driftThreshold;
    }

    if (config.aggressiveSuppression !== undefined) {
      this.suppressionConfig.aggressive = config.aggressiveSuppression;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.driftVectors.clear();
    this.averagingWindows.clear();
    this.deviationAlerts = [];

    // Re-initialize default vectors
    this.initializeDefaultVectors();
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

      // Restore drift vectors
      const vectors = parsed.state.driftVectors;
      this.driftVectors.clear();
      for (const [axis, vector] of Object.entries(vectors)) {
        this.driftVectors.set(axis, vector as DriftVector);
      }

      // Restore suppression config
      this.suppressionConfig = parsed.state.suppressionConfig;
    } catch (error) {
      console.error('[DriftSuppressionMatrix] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.driftVectors.clear();
    this.averagingWindows.clear();
    this.deviationAlerts = [];
  }
}
