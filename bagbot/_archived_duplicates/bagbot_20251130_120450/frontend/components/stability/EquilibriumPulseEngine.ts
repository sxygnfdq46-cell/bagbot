/**
 * LEVEL 12.3 — EQUILIBRIUM PULSE ENGINE
 * 
 * Auto-level BPM stability, tone-intensity equalizer,
 * anti-shock absorber, transition smoothers.
 * 
 * Features:
 * - Auto-leveling BPM stability (maintains rhythm)
 * - Tone-intensity equalizer (prevents mismatches)
 * - Anti-shock absorber (softens sudden changes)
 * - Transition smoothers (quadratic/sigmoid curves)
 * - Harmonic pacing with multiple modes
 * - Emergency stability fallback
 * - Smoothness scoring and optimization
 * 
 * Monitoring: 50ms intervals (20 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface BPMStability {
  targetBPM: number; // beats per minute
  currentBPM: number;
  stabilityScore: number; // 0-100
  autoLevelingActive: boolean;
  beatInterval: number; // ms between beats
}

interface ToneIntensityBalance {
  toneLevel: number; // 0-100
  intensityLevel: number; // 0-100
  balance: number; // -100 to 100 (negative = tone > intensity)
  equalized: boolean;
  equalizationStrength: number; // 0-1
}

interface ShockAbsorber {
  shockDetected: boolean;
  shockMagnitude: number; // 0-100
  absorptionActive: boolean;
  dampingFactor: number; // 0-1
  recoverySpeed: number; // 0-1
}

interface TransitionSmoother {
  mode: 'linear' | 'quadratic' | 'sigmoid' | 'exponential';
  smoothness: number; // 0-100
  transitionDuration: number; // ms
  currentProgress: number; // 0-1
}

interface EquilibriumPulseConfig {
  targetBPM: number;
  equalizationStrength: number;
  shockThreshold: number;
  dampingFactor: number;
  transitionMode: 'linear' | 'quadratic' | 'sigmoid' | 'exponential';
  monitoringInterval: number; // ms
}

/* ================================ */
/* EQUILIBRIUM PULSE ENGINE         */
/* ================================ */

export class EquilibriumPulseEngine {
  private config: EquilibriumPulseConfig;
  private bpmStability: BPMStability;
  private toneIntensityBalance: ToneIntensityBalance;
  private shockAbsorber: ShockAbsorber;
  private transitionSmoother: TransitionSmoother;
  private previousValues: Map<string, number>;
  private monitoringIntervalId: number | null;
  private beatTimestamps: number[];

  constructor(config?: Partial<EquilibriumPulseConfig>) {
    this.config = {
      targetBPM: 60, // 1 beat per second
      equalizationStrength: 0.7,
      shockThreshold: 30, // sudden change > 30 units
      dampingFactor: 0.6,
      transitionMode: 'sigmoid',
      monitoringInterval: 50,
      ...config,
    };

    this.bpmStability = {
      targetBPM: this.config.targetBPM,
      currentBPM: this.config.targetBPM,
      stabilityScore: 100,
      autoLevelingActive: true,
      beatInterval: (60 / this.config.targetBPM) * 1000,
    };

    this.toneIntensityBalance = {
      toneLevel: 50,
      intensityLevel: 50,
      balance: 0,
      equalized: true,
      equalizationStrength: this.config.equalizationStrength,
    };

    this.shockAbsorber = {
      shockDetected: false,
      shockMagnitude: 0,
      absorptionActive: false,
      dampingFactor: this.config.dampingFactor,
      recoverySpeed: 0.5,
    };

    this.transitionSmoother = {
      mode: this.config.transitionMode,
      smoothness: 100,
      transitionDuration: 1000, // 1 second default
      currentProgress: 1, // 1 = complete
    };

    this.previousValues = new Map();
    this.beatTimestamps = [];
    this.monitoringIntervalId = null;

    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateBPMStability();
      this.updateShockAbsorber();
      this.updateTransitionSmoother();
    }, this.config.monitoringInterval);
  }

  private updateBPMStability(): void {
    const now = Date.now();

    // Calculate current BPM from beat timestamps
    if (this.beatTimestamps.length >= 2) {
      const intervals: number[] = [];

      for (let i = 1; i < this.beatTimestamps.length; i++) {
        intervals.push(this.beatTimestamps[i] - this.beatTimestamps[i - 1]);
      }

      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      this.bpmStability.currentBPM = (60 / avgInterval) * 1000;
      this.bpmStability.beatInterval = avgInterval;

      // Calculate stability score (inverse of BPM variance)
      const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
      const stabilityScore = Math.max(0, 100 - Math.sqrt(variance) / 10);
      this.bpmStability.stabilityScore = stabilityScore;
    }

    // Auto-leveling: adjust toward target BPM
    if (this.bpmStability.autoLevelingActive) {
      const deviation = Math.abs(this.bpmStability.currentBPM - this.bpmStability.targetBPM);

      if (deviation > 5) {
        const correction = (this.bpmStability.targetBPM - this.bpmStability.currentBPM) * 0.1;
        this.bpmStability.currentBPM += correction;
      }
    }

    // Keep only last 20 beat timestamps
    if (this.beatTimestamps.length > 20) {
      this.beatTimestamps = this.beatTimestamps.slice(-20);
    }
  }

  private updateShockAbsorber(): void {
    // Gradually reduce shock magnitude
    if (this.shockAbsorber.shockMagnitude > 0) {
      this.shockAbsorber.shockMagnitude *= 1 - this.shockAbsorber.recoverySpeed * 0.05;

      if (this.shockAbsorber.shockMagnitude < 1) {
        this.shockAbsorber.shockMagnitude = 0;
        this.shockAbsorber.shockDetected = false;
        this.shockAbsorber.absorptionActive = false;
      }
    }
  }

  private updateTransitionSmoother(): void {
    // Increment transition progress
    if (this.transitionSmoother.currentProgress < 1) {
      const progressIncrement = this.config.monitoringInterval / this.transitionSmoother.transitionDuration;
      this.transitionSmoother.currentProgress = Math.min(1, this.transitionSmoother.currentProgress + progressIncrement);
    }
  }

  /* ================================ */
  /* BPM STABILITY                    */
  /* ================================ */

  public registerBeat(): void {
    const now = Date.now();
    this.beatTimestamps.push(now);
  }

  public setTargetBPM(bpm: number): void {
    this.bpmStability.targetBPM = Math.max(30, Math.min(180, bpm));
  }

  public enableAutoLeveling(enabled: boolean): void {
    this.bpmStability.autoLevelingActive = enabled;
  }

  /* ================================ */
  /* TONE-INTENSITY EQUALIZER         */
  /* ================================ */

  public updateToneIntensity(tone: number, intensity: number): void {
    this.toneIntensityBalance.toneLevel = Math.max(0, Math.min(100, tone));
    this.toneIntensityBalance.intensityLevel = Math.max(0, Math.min(100, intensity));

    // Calculate balance
    this.toneIntensityBalance.balance = this.toneIntensityBalance.toneLevel - this.toneIntensityBalance.intensityLevel;

    // Check if equalized (within 10 units)
    this.toneIntensityBalance.equalized = Math.abs(this.toneIntensityBalance.balance) <= 10;
  }

  public equalizeToneIntensity(): { tone: number; intensity: number } {
    const { toneLevel, intensityLevel, equalizationStrength } = this.toneIntensityBalance;

    // Calculate midpoint
    const midpoint = (toneLevel + intensityLevel) / 2;

    // Pull both toward midpoint
    const newTone = toneLevel + (midpoint - toneLevel) * equalizationStrength;
    const newIntensity = intensityLevel + (midpoint - intensityLevel) * equalizationStrength;

    return {
      tone: Math.max(0, Math.min(100, newTone)),
      intensity: Math.max(0, Math.min(100, newIntensity)),
    };
  }

  /* ================================ */
  /* ANTI-SHOCK ABSORBER              */
  /* ================================ */

  public processValue(key: string, value: number): number {
    const previousValue = this.previousValues.get(key);

    if (previousValue !== undefined) {
      const change = Math.abs(value - previousValue);

      // Detect shock
      if (change > this.config.shockThreshold) {
        this.shockAbsorber.shockDetected = true;
        this.shockAbsorber.shockMagnitude = Math.min(100, change);
        this.shockAbsorber.absorptionActive = true;
      }

      // Apply damping if shock is active
      if (this.shockAbsorber.absorptionActive) {
        const dampedChange = (value - previousValue) * (1 - this.shockAbsorber.dampingFactor);
        value = previousValue + dampedChange;
      }
    }

    this.previousValues.set(key, value);
    return value;
  }

  public setShockThreshold(threshold: number): void {
    this.config.shockThreshold = Math.max(0, Math.min(100, threshold));
  }

  public setDampingFactor(factor: number): void {
    this.shockAbsorber.dampingFactor = Math.max(0, Math.min(1, factor));
  }

  /* ================================ */
  /* TRANSITION SMOOTHERS             */
  /* ================================ */

  public startTransition(duration: number): void {
    this.transitionSmoother.transitionDuration = Math.max(100, duration);
    this.transitionSmoother.currentProgress = 0;
  }

  public getSmoothedValue(startValue: number, endValue: number): number {
    const progress = this.transitionSmoother.currentProgress;
    const mode = this.transitionSmoother.mode;

    let smoothedProgress: number;

    switch (mode) {
      case 'linear':
        smoothedProgress = progress;
        break;

      case 'quadratic':
        // Ease-in-out quadratic
        smoothedProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;

      case 'sigmoid':
        // Sigmoid curve (S-curve)
        smoothedProgress = 1 / (1 + Math.exp(-10 * (progress - 0.5)));
        break;

      case 'exponential':
        // Exponential ease-out
        smoothedProgress = 1 - Math.pow(1 - progress, 3);
        break;

      default:
        smoothedProgress = progress;
    }

    return startValue + (endValue - startValue) * smoothedProgress;
  }

  public setTransitionMode(mode: 'linear' | 'quadratic' | 'sigmoid' | 'exponential'): void {
    this.transitionSmoother.mode = mode;
  }

  /* ================================ */
  /* HARMONIC PACING                  */
  /* ================================ */

  public getHarmonicPulse(): number {
    const now = Date.now();
    const phase = (now % this.bpmStability.beatInterval) / this.bpmStability.beatInterval;

    // Sine wave pulse
    return (Math.sin(phase * Math.PI * 2) + 1) / 2; // normalized to 0-1
  }

  public getMultiHarmonicPulse(): number {
    const base = this.getHarmonicPulse();
    const harmonic2 = this.getHarmonicPulse() * 0.5; // half amplitude
    const harmonic3 = this.getHarmonicPulse() * 0.25; // quarter amplitude

    return (base + harmonic2 + harmonic3) / 1.75; // normalized
  }

  /* ================================ */
  /* EMERGENCY STABILITY              */
  /* ================================ */

  public activateEmergencyStability(): void {
    // Reset to safe defaults
    this.bpmStability.targetBPM = 60;
    this.bpmStability.autoLevelingActive = true;
    this.toneIntensityBalance.equalizationStrength = 0.9;
    this.shockAbsorber.dampingFactor = 0.8;
    this.shockAbsorber.absorptionActive = true;
    this.transitionSmoother.mode = 'sigmoid';
    this.transitionSmoother.transitionDuration = 2000; // 2 seconds
  }

  public deactivateEmergencyStability(): void {
    // Restore normal config
    this.bpmStability.targetBPM = this.config.targetBPM;
    this.toneIntensityBalance.equalizationStrength = this.config.equalizationStrength;
    this.shockAbsorber.dampingFactor = this.config.dampingFactor;
    this.shockAbsorber.absorptionActive = false;
    this.transitionSmoother.mode = this.config.transitionMode;
  }

  /* ================================ */
  /* SMOOTHNESS SCORING               */
  /* ================================ */

  public calculateSmoothness(): number {
    // Collect all previous values
    const values = Array.from(this.previousValues.values());

    if (values.length < 3) return 100;

    // Calculate jerkiness (second derivative)
    let jerkiness = 0;
    for (let i = 2; i < values.length; i++) {
      const secondDerivative = values[i] - 2 * values[i - 1] + values[i - 2];
      jerkiness += Math.abs(secondDerivative);
    }

    const avgJerkiness = jerkiness / (values.length - 2);

    // Smoothness score (inverse of jerkiness)
    const smoothness = Math.max(0, 100 - avgJerkiness * 5);

    this.transitionSmoother.smoothness = smoothness;
    return smoothness;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      bpmStability: { ...this.bpmStability },
      toneIntensityBalance: { ...this.toneIntensityBalance },
      shockAbsorber: { ...this.shockAbsorber },
      transitionSmoother: { ...this.transitionSmoother },
      smoothness: this.calculateSmoothness(),
      harmonicPulse: this.getHarmonicPulse(),
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Equilibrium Pulse Engine Summary:
  BPM: ${Math.round(state.bpmStability.currentBPM)} (target: ${state.bpmStability.targetBPM})
  BPM Stability: ${Math.round(state.bpmStability.stabilityScore)}
  Tone-Intensity Balance: ${Math.round(state.toneIntensityBalance.balance)}
  Equalized: ${state.toneIntensityBalance.equalized ? 'Yes' : 'No'}
  Shock Detected: ${state.shockAbsorber.shockDetected ? 'Yes' : 'No'}
  Shock Magnitude: ${Math.round(state.shockAbsorber.shockMagnitude)}
  Transition Mode: ${state.transitionSmoother.mode}
  Smoothness: ${Math.round(state.smoothness)}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<EquilibriumPulseConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.targetBPM !== undefined) {
      this.bpmStability.targetBPM = config.targetBPM;
    }

    if (config.equalizationStrength !== undefined) {
      this.toneIntensityBalance.equalizationStrength = config.equalizationStrength;
    }

    if (config.dampingFactor !== undefined) {
      this.shockAbsorber.dampingFactor = config.dampingFactor;
    }

    if (config.transitionMode !== undefined) {
      this.transitionSmoother.mode = config.transitionMode;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.bpmStability = {
      targetBPM: this.config.targetBPM,
      currentBPM: this.config.targetBPM,
      stabilityScore: 100,
      autoLevelingActive: true,
      beatInterval: (60 / this.config.targetBPM) * 1000,
    };

    this.toneIntensityBalance = {
      toneLevel: 50,
      intensityLevel: 50,
      balance: 0,
      equalized: true,
      equalizationStrength: this.config.equalizationStrength,
    };

    this.shockAbsorber = {
      shockDetected: false,
      shockMagnitude: 0,
      absorptionActive: false,
      dampingFactor: this.config.dampingFactor,
      recoverySpeed: 0.5,
    };

    this.transitionSmoother = {
      mode: this.config.transitionMode,
      smoothness: 100,
      transitionDuration: 1000,
      currentProgress: 1,
    };

    this.previousValues.clear();
    this.beatTimestamps = [];
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
      previousValues: Array.from(this.previousValues.entries()),
      beatTimestamps: this.beatTimestamps,
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.bpmStability = parsed.state.bpmStability;
      this.toneIntensityBalance = parsed.state.toneIntensityBalance;
      this.shockAbsorber = parsed.state.shockAbsorber;
      this.transitionSmoother = parsed.state.transitionSmoother;
      this.previousValues = new Map(parsed.previousValues);
      this.beatTimestamps = parsed.beatTimestamps;
    } catch (error) {
      console.error('[EquilibriumPulseEngine] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.previousValues.clear();
    this.beatTimestamps = [];
  }
}
