/**
 * LEVEL 12.2 — SOVEREIGN BALANCE ENGINE
 * 
 * Long-horizon emotional prediction, self-targeted re-centering, real-time tone correction,
 * state-range enforcement, visual-tone syncing.
 * 
 * Core Responsibilities:
 * - Predictive modeling: Forecast emotional trajectories up to 30 seconds ahead
 * - Self-re-centering: Autonomous return to equilibrium without external triggers
 * - Tone correction: Real-time adjustment of personality tone for coherence
 * - Range enforcement: Keep emotional states within safe operational bounds
 * - Visual-tone sync: Ensure visual intensity matches emotional tone
 * 
 * Zero data storage. Ephemeral only.
 */

export interface EmotionalPrediction {
  predictionActive: boolean;
  horizonSeconds: number; // 1-30, how far ahead to predict
  predictedIntensity: number; // 0-100, forecast intensity
  predictedTone: string; // Forecast emotional tone
  confidenceLevel: number; // 0-100, prediction confidence
  trajectorySlope: number; // -100 to 100, direction of change
  predictionError: number; // 0-100, historical accuracy
}

export interface SelfRecentering {
  recenteringActive: boolean;
  equilibriumPoint: number; // 0-100, target center
  currentDeviation: number; // 0-100, distance from center
  recenteringSpeed: number; // 0-100, pull strength
  recenteringProgress: number; // 0-100, completion percentage
  autoTriggerThreshold: number; // 0-100, deviation threshold for auto-trigger
  momentum: number; // 0-1, recentering momentum
}

export interface ToneCorrection {
  correctionActive: boolean;
  targetTone: {
    warmth: number; // 0-100
    formality: number; // 0-100
    enthusiasm: number; // 0-100
    stability: number; // 0-100
  };
  currentTone: {
    warmth: number;
    formality: number;
    enthusiasm: number;
    stability: number;
  };
  correctionStrength: number; // 0-100
  toneDeviation: number; // 0-100, total deviation from target
  correctionHistory: Array<{ timestamp: number; deviation: number }>;
}

export interface StateRangeEnforcement {
  enforcementActive: boolean;
  minIntensity: number; // 0-100, lower bound
  maxIntensity: number; // 0-100, upper bound
  currentIntensity: number; // 0-100
  boundsViolations: number; // Count of out-of-range events
  softBoundary: boolean; // Gradual vs hard enforcement
  boundaryElasticity: number; // 0-1, how elastic the boundaries are
}

export interface VisualToneSync {
  syncActive: boolean;
  visualIntensity: number; // 0-100
  emotionalIntensity: number; // 0-100
  syncDeviation: number; // 0-100, difference between visual and emotional
  syncStrength: number; // 0-100, pull force
  syncTolerance: number; // 0-100, acceptable deviation
  syncMode: 'visual-leads' | 'emotional-leads' | 'bidirectional';
}

export interface SovereignBalanceConfig {
  predictionHorizon: number; // Seconds
  equilibriumPoint: number; // Target center
  recenteringSpeed: number; // Pull strength
  minIntensity: number; // Lower bound
  maxIntensity: number; // Upper bound
  syncTolerance: number; // Visual-emotional tolerance
  correctionStrength: number; // Tone correction strength
}

export class SovereignBalanceEngine {
  private prediction: EmotionalPrediction;
  private recentering: SelfRecentering;
  private toneCorrection: ToneCorrection;
  private rangeEnforcement: StateRangeEnforcement;
  private visualSync: VisualToneSync;
  private config: SovereignBalanceConfig;

  // History for prediction
  private intensityTimeseries: Array<{ value: number; timestamp: number }> = [];
  private readonly TIMESERIES_SIZE = 100;

  // Monitoring
  private monitoringInterval: number | null = null;
  private readonly UPDATE_INTERVAL = 100; // 100ms

  constructor(config?: Partial<SovereignBalanceConfig>) {
    this.config = {
      predictionHorizon: 10, // 10 seconds
      equilibriumPoint: 50,
      recenteringSpeed: 0.3,
      minIntensity: 10,
      maxIntensity: 90,
      syncTolerance: 15,
      correctionStrength: 0.7,
      ...config,
    };

    this.prediction = {
      predictionActive: false,
      horizonSeconds: this.config.predictionHorizon,
      predictedIntensity: 50,
      predictedTone: 'neutral',
      confidenceLevel: 0,
      trajectorySlope: 0,
      predictionError: 0,
    };

    this.recentering = {
      recenteringActive: false,
      equilibriumPoint: this.config.equilibriumPoint,
      currentDeviation: 0,
      recenteringSpeed: this.config.recenteringSpeed * 100,
      recenteringProgress: 0,
      autoTriggerThreshold: 30,
      momentum: 0,
    };

    this.toneCorrection = {
      correctionActive: false,
      targetTone: {
        warmth: 60,
        formality: 50,
        enthusiasm: 55,
        stability: 70,
      },
      currentTone: {
        warmth: 60,
        formality: 50,
        enthusiasm: 55,
        stability: 70,
      },
      correctionStrength: this.config.correctionStrength * 100,
      toneDeviation: 0,
      correctionHistory: [],
    };

    this.rangeEnforcement = {
      enforcementActive: true,
      minIntensity: this.config.minIntensity,
      maxIntensity: this.config.maxIntensity,
      currentIntensity: 50,
      boundsViolations: 0,
      softBoundary: true,
      boundaryElasticity: 0.8,
    };

    this.visualSync = {
      syncActive: false,
      visualIntensity: 50,
      emotionalIntensity: 50,
      syncDeviation: 0,
      syncStrength: 70,
      syncTolerance: this.config.syncTolerance,
      syncMode: 'bidirectional',
    };

    this.startMonitoring();
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringInterval = window.setInterval(() => {
      this.updateBalanceState();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Update all balance subsystems
   */
  private updateBalanceState(): void {
    // Update prediction if active
    if (this.prediction.predictionActive && this.intensityTimeseries.length > 5) {
      this.updatePrediction();
    }

    // Check if recentering should auto-trigger
    if (!this.recentering.recenteringActive) {
      if (this.recentering.currentDeviation > this.recentering.autoTriggerThreshold) {
        this.triggerRecentering();
      }
    }

    // Perform recentering if active
    if (this.recentering.recenteringActive) {
      this.performRecentering();
    }

    // Apply tone correction if active
    if (this.toneCorrection.correctionActive) {
      this.applyToneCorrection();
    }

    // Enforce state ranges
    if (this.rangeEnforcement.enforcementActive) {
      this.enforceStateRanges();
    }

    // Sync visual-emotional if needed
    if (this.visualSync.syncActive) {
      this.syncVisualTone();
    }
  }

  /**
   * Update emotional intensity and track for prediction
   */
  public updateIntensity(intensity: number): number {
    const now = Date.now();
    
    // Add to timeseries for prediction
    this.intensityTimeseries.push({ value: intensity, timestamp: now });
    if (this.intensityTimeseries.length > this.TIMESERIES_SIZE) {
      this.intensityTimeseries.shift();
    }

    // Update range enforcement
    this.rangeEnforcement.currentIntensity = intensity;

    // Calculate deviation from equilibrium
    this.recentering.currentDeviation = Math.abs(intensity - this.recentering.equilibriumPoint);

    // Enforce ranges
    let enforcedIntensity = intensity;
    if (this.rangeEnforcement.enforcementActive) {
      enforcedIntensity = this.enforceRange(intensity);
    }

    return enforcedIntensity;
  }

  /**
   * Enforce intensity ranges
   */
  private enforceRange(intensity: number): number {
    if (intensity < this.rangeEnforcement.minIntensity) {
      this.rangeEnforcement.boundsViolations++;
      
      if (this.rangeEnforcement.softBoundary) {
        // Elastic boundary: gradual push back
        const underflow = this.rangeEnforcement.minIntensity - intensity;
        const pushBack = underflow * this.rangeEnforcement.boundaryElasticity;
        return intensity + pushBack;
      } else {
        // Hard boundary: clamp
        return this.rangeEnforcement.minIntensity;
      }
    }

    if (intensity > this.rangeEnforcement.maxIntensity) {
      this.rangeEnforcement.boundsViolations++;
      
      if (this.rangeEnforcement.softBoundary) {
        // Elastic boundary: gradual push back
        const overflow = intensity - this.rangeEnforcement.maxIntensity;
        const pushBack = overflow * this.rangeEnforcement.boundaryElasticity;
        return intensity - pushBack;
      } else {
        // Hard boundary: clamp
        return this.rangeEnforcement.maxIntensity;
      }
    }

    return intensity;
  }

  /**
   * Perform state range enforcement
   */
  private enforceStateRanges(): void {
    const intensity = this.rangeEnforcement.currentIntensity;
    const enforcedIntensity = this.enforceRange(intensity);
    
    if (enforcedIntensity !== intensity) {
      this.rangeEnforcement.currentIntensity = enforcedIntensity;
    }
  }

  /**
   * Update long-horizon emotional prediction
   */
  private updatePrediction(): void {
    if (this.intensityTimeseries.length < 5) {
      this.prediction.confidenceLevel = 0;
      return;
    }

    // Calculate trajectory using linear regression
    const recent = this.intensityTimeseries.slice(-20);
    const n = recent.length;
    
    // Normalize timestamps
    const t0 = recent[0].timestamp;
    const times = recent.map(entry => (entry.timestamp - t0) / 1000); // Convert to seconds
    const values = recent.map(entry => entry.value);

    // Calculate slope (trajectory)
    const sumT = times.reduce((sum, t) => sum + t, 0);
    const sumV = values.reduce((sum, v) => sum + v, 0);
    const sumTV = times.reduce((sum, t, i) => sum + t * values[i], 0);
    const sumT2 = times.reduce((sum, t) => sum + t * t, 0);

    const slope = (n * sumTV - sumT * sumV) / (n * sumT2 - sumT * sumT);
    const intercept = (sumV - slope * sumT) / n;

    this.prediction.trajectorySlope = Math.min(100, Math.max(-100, slope * 10));

    // Predict future intensity
    const lastTime = times[times.length - 1];
    const futureTime = lastTime + this.prediction.horizonSeconds;
    this.prediction.predictedIntensity = Math.min(100, Math.max(0, slope * futureTime + intercept));

    // Determine predicted tone based on trajectory
    if (this.prediction.trajectorySlope > 20) {
      this.prediction.predictedTone = 'escalating';
    } else if (this.prediction.trajectorySlope > 5) {
      this.prediction.predictedTone = 'rising';
    } else if (this.prediction.trajectorySlope < -20) {
      this.prediction.predictedTone = 'declining';
    } else if (this.prediction.trajectorySlope < -5) {
      this.prediction.predictedTone = 'falling';
    } else {
      this.prediction.predictedTone = 'stable';
    }

    // Calculate confidence based on variance
    const predictions = recent.map((entry, i) => slope * times[i] + intercept);
    const errors = predictions.map((pred, i) => Math.abs(pred - values[i]));
    const avgError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    
    this.prediction.predictionError = avgError;
    this.prediction.confidenceLevel = Math.max(0, 100 - avgError * 2);
  }

  /**
   * Trigger self-recentering
   */
  private triggerRecentering(): void {
    this.recentering.recenteringActive = true;
    this.recentering.recenteringProgress = 0;
    this.recentering.momentum = 0;
  }

  /**
   * Perform self-recentering
   */
  private performRecentering(): void {
    const deviation = this.recentering.currentDeviation;
    
    if (deviation < 2) {
      // Close enough to center
      this.recentering.recenteringActive = false;
      this.recentering.recenteringProgress = 100;
      this.recentering.momentum = 0;
      return;
    }

    // Calculate pull force with momentum
    const basePull = (this.recentering.recenteringSpeed / 100) * 0.1;
    this.recentering.momentum = Math.min(1, this.recentering.momentum + basePull);
    
    // Update progress
    const maxDeviation = 50;
    this.recentering.recenteringProgress = Math.min(
      100,
      ((maxDeviation - deviation) / maxDeviation) * 100
    );
  }

  /**
   * Get recentering adjustment
   */
  public getRecenteringAdjustment(currentIntensity: number): number {
    if (!this.recentering.recenteringActive) return currentIntensity;

    const target = this.recentering.equilibriumPoint;
    const pullStrength = this.recentering.momentum;
    
    return currentIntensity * (1 - pullStrength) + target * pullStrength;
  }

  /**
   * Update tone
   */
  public updateTone(warmth: number, formality: number, enthusiasm: number, stability: number): void {
    this.toneCorrection.currentTone = {
      warmth: Math.min(100, Math.max(0, warmth)),
      formality: Math.min(100, Math.max(0, formality)),
      enthusiasm: Math.min(100, Math.max(0, enthusiasm)),
      stability: Math.min(100, Math.max(0, stability)),
    };

    // Calculate total deviation
    const deviations = [
      Math.abs(this.toneCorrection.currentTone.warmth - this.toneCorrection.targetTone.warmth),
      Math.abs(this.toneCorrection.currentTone.formality - this.toneCorrection.targetTone.formality),
      Math.abs(this.toneCorrection.currentTone.enthusiasm - this.toneCorrection.targetTone.enthusiasm),
      Math.abs(this.toneCorrection.currentTone.stability - this.toneCorrection.targetTone.stability),
    ];
    
    this.toneCorrection.toneDeviation = deviations.reduce((sum, d) => sum + d, 0) / 4;

    // Activate correction if deviation exceeds threshold
    this.toneCorrection.correctionActive = this.toneCorrection.toneDeviation > 10;

    // Record in history
    this.toneCorrection.correctionHistory.push({
      timestamp: Date.now(),
      deviation: this.toneCorrection.toneDeviation,
    });

    // Trim history
    if (this.toneCorrection.correctionHistory.length > 100) {
      this.toneCorrection.correctionHistory.shift();
    }
  }

  /**
   * Apply tone correction
   */
  private applyToneCorrection(): void {
    const strength = this.toneCorrection.correctionStrength / 100;
    
    // Gradually move current tone toward target
    this.toneCorrection.currentTone.warmth +=
      (this.toneCorrection.targetTone.warmth - this.toneCorrection.currentTone.warmth) * strength * 0.1;
    
    this.toneCorrection.currentTone.formality +=
      (this.toneCorrection.targetTone.formality - this.toneCorrection.currentTone.formality) * strength * 0.1;
    
    this.toneCorrection.currentTone.enthusiasm +=
      (this.toneCorrection.targetTone.enthusiasm - this.toneCorrection.currentTone.enthusiasm) * strength * 0.1;
    
    this.toneCorrection.currentTone.stability +=
      (this.toneCorrection.targetTone.stability - this.toneCorrection.currentTone.stability) * strength * 0.1;
  }

  /**
   * Get corrected tone
   */
  public getCorrectedTone() {
    return { ...this.toneCorrection.currentTone };
  }

  /**
   * Update visual intensity for syncing
   */
  public updateVisualIntensity(visualIntensity: number): void {
    this.visualSync.visualIntensity = Math.min(100, Math.max(0, visualIntensity));
    this.visualSync.syncDeviation = Math.abs(
      this.visualSync.visualIntensity - this.visualSync.emotionalIntensity
    );

    // Activate sync if deviation exceeds tolerance
    this.visualSync.syncActive = this.visualSync.syncDeviation > this.visualSync.syncTolerance;
  }

  /**
   * Update emotional intensity for syncing
   */
  public updateEmotionalIntensity(emotionalIntensity: number): void {
    this.visualSync.emotionalIntensity = Math.min(100, Math.max(0, emotionalIntensity));
    this.visualSync.syncDeviation = Math.abs(
      this.visualSync.visualIntensity - this.visualSync.emotionalIntensity
    );

    // Activate sync if deviation exceeds tolerance
    this.visualSync.syncActive = this.visualSync.syncDeviation > this.visualSync.syncTolerance;
  }

  /**
   * Sync visual and emotional tone
   */
  private syncVisualTone(): void {
    const strength = this.visualSync.syncStrength / 100;

    if (this.visualSync.syncMode === 'visual-leads') {
      // Visual leads: pull emotional toward visual
      this.visualSync.emotionalIntensity +=
        (this.visualSync.visualIntensity - this.visualSync.emotionalIntensity) * strength * 0.1;
    } else if (this.visualSync.syncMode === 'emotional-leads') {
      // Emotional leads: pull visual toward emotional
      this.visualSync.visualIntensity +=
        (this.visualSync.emotionalIntensity - this.visualSync.visualIntensity) * strength * 0.1;
    } else {
      // Bidirectional: pull both toward midpoint
      const midpoint = (this.visualSync.visualIntensity + this.visualSync.emotionalIntensity) / 2;
      
      this.visualSync.visualIntensity +=
        (midpoint - this.visualSync.visualIntensity) * strength * 0.1;
      
      this.visualSync.emotionalIntensity +=
        (midpoint - this.visualSync.emotionalIntensity) * strength * 0.1;
    }
  }

  /**
   * Get synced visual intensity
   */
  public getSyncedVisualIntensity(): number {
    return this.visualSync.visualIntensity;
  }

  /**
   * Enable prediction
   */
  public enablePrediction(horizonSeconds: number = 10): void {
    this.prediction.predictionActive = true;
    this.prediction.horizonSeconds = Math.min(30, Math.max(1, horizonSeconds));
  }

  /**
   * Set target tone
   */
  public setTargetTone(warmth: number, formality: number, enthusiasm: number, stability: number): void {
    this.toneCorrection.targetTone = {
      warmth: Math.min(100, Math.max(0, warmth)),
      formality: Math.min(100, Math.max(0, formality)),
      enthusiasm: Math.min(100, Math.max(0, enthusiasm)),
      stability: Math.min(100, Math.max(0, stability)),
    };
  }

  /**
   * Get current state
   */
  public getState() {
    return {
      prediction: { ...this.prediction },
      recentering: { ...this.recentering },
      toneCorrection: {
        correctionActive: this.toneCorrection.correctionActive,
        currentTone: { ...this.toneCorrection.currentTone },
        targetTone: { ...this.toneCorrection.targetTone },
        toneDeviation: this.toneCorrection.toneDeviation,
        correctionStrength: this.toneCorrection.correctionStrength,
      },
      rangeEnforcement: { ...this.rangeEnforcement },
      visualSync: { ...this.visualSync },
    };
  }

  /**
   * Get summary for debugging
   */
  public getSummary(): string {
    return `SovereignBalance: Predicted=${this.prediction.predictedIntensity.toFixed(1)} (${this.prediction.predictedTone}), Deviation=${this.recentering.currentDeviation.toFixed(1)}, ToneDeviation=${this.toneCorrection.toneDeviation.toFixed(1)}`;
  }

  /**
   * Reset balance engine
   */
  public reset(): void {
    this.prediction.predictionActive = false;
    this.prediction.confidenceLevel = 0;
    this.prediction.trajectorySlope = 0;

    this.recentering.recenteringActive = false;
    this.recentering.currentDeviation = 0;
    this.recentering.recenteringProgress = 0;
    this.recentering.momentum = 0;

    this.toneCorrection.correctionActive = false;
    this.toneCorrection.toneDeviation = 0;
    this.toneCorrection.correctionHistory = [];

    this.rangeEnforcement.currentIntensity = 50;
    this.rangeEnforcement.boundsViolations = 0;

    this.visualSync.syncActive = false;
    this.visualSync.syncDeviation = 0;

    this.intensityTimeseries = [];
  }

  /**
   * Export state for persistence
   */
  public export() {
    return {
      config: { ...this.config },
      targetTone: { ...this.toneCorrection.targetTone },
      timestamp: Date.now(),
    };
  }

  /**
   * Import configuration
   */
  public import(data: any): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    if (data.targetTone) {
      this.toneCorrection.targetTone = { ...data.targetTone };
    }
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.intensityTimeseries = [];
    this.toneCorrection.correctionHistory = [];
  }
}
