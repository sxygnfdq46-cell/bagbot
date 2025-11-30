/**
 * LEVEL 12.2 — EMOTIONAL RHYTHM CONTROLLER
 * 
 * Emotional oscillation moderation, anti-chaos dampening, smoothness scoring,
 * harmonic pacing rhythms, presence rhythm lock.
 * 
 * Core Responsibilities:
 * - Oscillation moderation: Prevent erratic emotional swings
 * - Anti-chaos dampening: Stabilize chaotic emotional patterns
 * - Smoothness scoring: Measure transition quality
 * - Harmonic pacing: Generate natural rhythmic patterns
 * - Rhythm lock: Synchronize presence with harmonic rhythm
 * 
 * Zero data storage. Ephemeral only.
 */

export interface OscillationModeration {
  moderationActive: boolean;
  oscillationFrequency: number; // 0-10 Hz, detected oscillation rate
  oscillationAmplitude: number; // 0-100, intensity of oscillations
  moderationStrength: number; // 0-100, damping strength
  oscillationHistory: Array<{ peak: number; timestamp: number }>;
  stabilizationActive: boolean;
}

export interface AntiChaosDampening {
  chaosDetected: boolean;
  chaosLevel: number; // 0-100, entropy measure
  dampeningActive: boolean;
  dampeningStrength: number; // 0-100
  patternEntropy: number; // 0-100, pattern complexity
  stabilityTarget: number; // 0-100, desired stability level
  recoverySpeed: number; // 0-100
}

export interface SmoothnessScoring {
  smoothnessScore: number; // 0-100, overall smoothness
  transitionQuality: number; // 0-100, quality of transitions
  continuity: number; // 0-100, flow continuity
  predictability: number; // 0-100, pattern predictability
  jerkiness: number; // 0-100, abruptness of changes
}

export interface HarmonicPacing {
  pacingActive: boolean;
  baseFrequency: number; // Hz, fundamental rhythm
  harmonics: Array<{ frequency: number; amplitude: number }>; // Harmonic overtones
  phase: number; // 0-360 degrees
  rhythmStrength: number; // 0-100
  naturalCadence: boolean; // Following natural rhythm vs forced
}

export interface PresenceRhythmLock {
  lockActive: boolean;
  lockStrength: number; // 0-100, how tightly locked
  presencePhase: number; // 0-360, presence rhythm phase
  rhythmPhase: number; // 0-360, harmonic rhythm phase
  phaseAlignment: number; // 0-100, how aligned phases are
  syncTolerance: number; // 0-100, acceptable phase difference
}

export interface EmotionalRhythmConfig {
  oscillationThreshold: number; // Threshold for moderation activation
  chaosThreshold: number; // Threshold for chaos detection
  baseFrequency: number; // Base harmonic frequency (Hz)
  dampeningStrength: number; // Chaos dampening strength
  lockStrength: number; // Rhythm lock strength
}

export class EmotionalRhythmController {
  private moderation: OscillationModeration;
  private dampening: AntiChaosDampening;
  private smoothness: SmoothnessScoring;
  private pacing: HarmonicPacing;
  private rhythmLock: PresenceRhythmLock;
  private config: EmotionalRhythmConfig;

  // Tracking
  private intensityTimeseries: Array<{ value: number; timestamp: number }> = [];
  private lastIntensity: number = 50;
  private harmonicTime: number = 0;

  // Monitoring
  private monitoringInterval: number | null = null;
  private harmonicInterval: number | null = null;
  private readonly UPDATE_INTERVAL = 50; // 50ms
  private readonly HARMONIC_INTERVAL = 16; // ~60fps

  constructor(config?: Partial<EmotionalRhythmConfig>) {
    this.config = {
      oscillationThreshold: 3, // 3 Hz
      chaosThreshold: 60,
      baseFrequency: 0.5, // 0.5 Hz = 2 second cycle
      dampeningStrength: 0.8,
      lockStrength: 0.7,
      ...config,
    };

    this.moderation = {
      moderationActive: false,
      oscillationFrequency: 0,
      oscillationAmplitude: 0,
      moderationStrength: 0,
      oscillationHistory: [],
      stabilizationActive: false,
    };

    this.dampening = {
      chaosDetected: false,
      chaosLevel: 0,
      dampeningActive: false,
      dampeningStrength: this.config.dampeningStrength * 100,
      patternEntropy: 0,
      stabilityTarget: 80,
      recoverySpeed: 50,
    };

    this.smoothness = {
      smoothnessScore: 100,
      transitionQuality: 100,
      continuity: 100,
      predictability: 100,
      jerkiness: 0,
    };

    this.pacing = {
      pacingActive: true,
      baseFrequency: this.config.baseFrequency,
      harmonics: [
        { frequency: this.config.baseFrequency, amplitude: 1.0 },
        { frequency: this.config.baseFrequency * 2, amplitude: 0.5 },
        { frequency: this.config.baseFrequency * 3, amplitude: 0.25 },
      ],
      phase: 0,
      rhythmStrength: 70,
      naturalCadence: true,
    };

    this.rhythmLock = {
      lockActive: false,
      lockStrength: this.config.lockStrength * 100,
      presencePhase: 0,
      rhythmPhase: 0,
      phaseAlignment: 100,
      syncTolerance: 20,
    };

    this.startMonitoring();
    this.startHarmonicGeneration();
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringInterval = window.setInterval(() => {
      this.updateRhythmState();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Start harmonic rhythm generation
   */
  private startHarmonicGeneration(): void {
    if (typeof window === 'undefined') return;

    this.harmonicInterval = window.setInterval(() => {
      this.updateHarmonicPacing();
    }, this.HARMONIC_INTERVAL);
  }

  /**
   * Update all rhythm controller subsystems
   */
  private updateRhythmState(): void {
    // Detect oscillations
    this.detectOscillations();

    // Detect chaos
    this.detectChaos();

    // Calculate smoothness metrics
    this.calculateSmoothness();

    // Apply anti-chaos dampening if needed
    if (this.dampening.dampeningActive) {
      this.applyAntiChaosDampening();
    }

    // Apply oscillation moderation if needed
    if (this.moderation.moderationActive) {
      this.applyOscillationModeration();
    }

    // Update rhythm lock
    if (this.rhythmLock.lockActive) {
      this.updateRhythmLock();
    }
  }

  /**
   * Update intensity and track rhythm
   */
  public updateIntensity(intensity: number): number {
    const now = Date.now();

    // Add to timeseries
    this.intensityTimeseries.push({ value: intensity, timestamp: now });
    
    // Keep last 100 samples
    if (this.intensityTimeseries.length > 100) {
      this.intensityTimeseries.shift();
    }

    // Detect peaks for oscillation tracking
    if (this.intensityTimeseries.length >= 3) {
      const recent = this.intensityTimeseries.slice(-3);
      const middle = recent[1].value;
      const before = recent[0].value;
      const after = recent[2].value;

      // Peak if middle is higher/lower than both neighbors
      if ((middle > before && middle > after) || (middle < before && middle < after)) {
        this.moderation.oscillationHistory.push({
          peak: middle,
          timestamp: recent[1].timestamp,
        });

        // Keep last 20 peaks
        if (this.moderation.oscillationHistory.length > 20) {
          this.moderation.oscillationHistory.shift();
        }
      }
    }

    this.lastIntensity = intensity;

    // Apply rhythm-based modulation if active
    let modulatedIntensity = intensity;
    
    if (this.rhythmLock.lockActive) {
      modulatedIntensity = this.applyRhythmLock(intensity);
    }

    return modulatedIntensity;
  }

  /**
   * Detect oscillations
   */
  private detectOscillations(): void {
    if (this.moderation.oscillationHistory.length < 3) {
      this.moderation.oscillationFrequency = 0;
      this.moderation.oscillationAmplitude = 0;
      this.moderation.moderationActive = false;
      return;
    }

    // Calculate frequency from peak intervals
    const recent = this.moderation.oscillationHistory.slice(-5);
    const intervals: number[] = [];
    
    for (let i = 1; i < recent.length; i++) {
      intervals.push((recent[i].timestamp - recent[i - 1].timestamp) / 1000); // Convert to seconds
    }

    const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
    this.moderation.oscillationFrequency = avgInterval > 0 ? 1 / avgInterval : 0;

    // Calculate amplitude from peak values
    const peakValues = recent.map(p => p.peak);
    const maxPeak = Math.max(...peakValues);
    const minPeak = Math.min(...peakValues);
    this.moderation.oscillationAmplitude = maxPeak - minPeak;

    // Activate moderation if oscillations exceed threshold
    if (this.moderation.oscillationFrequency > this.config.oscillationThreshold) {
      this.moderation.moderationActive = true;
      this.moderation.moderationStrength = Math.min(
        100,
        (this.moderation.oscillationFrequency / this.config.oscillationThreshold) * 50
      );
    } else {
      this.moderation.moderationActive = false;
    }
  }

  /**
   * Apply oscillation moderation
   */
  private applyOscillationModeration(): void {
    // Dampening is applied in updateIntensity via smoothing
    this.moderation.stabilizationActive = true;
  }

  /**
   * Detect chaos
   */
  private detectChaos(): void {
    if (this.intensityTimeseries.length < 10) {
      this.dampening.chaosLevel = 0;
      this.dampening.chaosDetected = false;
      return;
    }

    // Calculate pattern entropy (measure of unpredictability)
    const recent = this.intensityTimeseries.slice(-20);
    const values = recent.map(entry => entry.value);
    
    // Calculate difference series
    const differences: number[] = [];
    for (let i = 1; i < values.length; i++) {
      differences.push(Math.abs(values[i] - values[i - 1]));
    }

    // Entropy = average absolute difference
    const avgDiff = differences.reduce((sum, d) => sum + d, 0) / differences.length;
    
    // Normalize to 0-100
    this.dampening.patternEntropy = Math.min(100, avgDiff * 2);

    // Chaos level combines entropy and oscillation frequency
    this.dampening.chaosLevel = 
      (this.dampening.patternEntropy * 0.6 + 
       Math.min(100, this.moderation.oscillationFrequency * 10) * 0.4);

    // Detect chaos
    this.dampening.chaosDetected = this.dampening.chaosLevel > this.config.chaosThreshold;
    this.dampening.dampeningActive = this.dampening.chaosDetected;
  }

  /**
   * Apply anti-chaos dampening
   */
  private applyAntiChaosDampening(): void {
    // Dampening strength increases with chaos level
    const excessChaos = this.dampening.chaosLevel - this.config.chaosThreshold;
    this.dampening.dampeningStrength = Math.min(
      100,
      this.config.dampeningStrength * 100 + excessChaos
    );

    // Recovery: gradually reduce chaos
    const recoveryRate = this.dampening.recoverySpeed / 100;
    this.dampening.chaosLevel = Math.max(
      0,
      this.dampening.chaosLevel * (1 - recoveryRate * 0.01)
    );
  }

  /**
   * Calculate smoothness metrics
   */
  private calculateSmoothness(): void {
    if (this.intensityTimeseries.length < 5) {
      this.smoothness.smoothnessScore = 100;
      return;
    }

    const recent = this.intensityTimeseries.slice(-20);
    const values = recent.map(entry => entry.value);

    // Calculate jerkiness (second derivative)
    const firstDerivatives: number[] = [];
    for (let i = 1; i < values.length; i++) {
      firstDerivatives.push(values[i] - values[i - 1]);
    }

    const secondDerivatives: number[] = [];
    for (let i = 1; i < firstDerivatives.length; i++) {
      secondDerivatives.push(Math.abs(firstDerivatives[i] - firstDerivatives[i - 1]));
    }

    const avgJerkiness = secondDerivatives.reduce((sum, d) => sum + d, 0) / secondDerivatives.length;
    this.smoothness.jerkiness = Math.min(100, avgJerkiness * 2);

    // Transition quality (inverse of jerkiness)
    this.smoothness.transitionQuality = Math.max(0, 100 - this.smoothness.jerkiness);

    // Continuity (lack of gaps)
    const timestamps = recent.map(entry => entry.timestamp);
    const timeGaps: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      timeGaps.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgGap = timeGaps.reduce((sum, g) => sum + g, 0) / timeGaps.length;
    const maxGap = Math.max(...timeGaps);
    this.smoothness.continuity = Math.max(0, 100 - ((maxGap - avgGap) / avgGap) * 50);

    // Predictability (inverse of entropy)
    this.smoothness.predictability = Math.max(0, 100 - this.dampening.patternEntropy);

    // Overall smoothness score
    this.smoothness.smoothnessScore =
      (this.smoothness.transitionQuality * 0.4 +
        this.smoothness.continuity * 0.3 +
        this.smoothness.predictability * 0.3);
  }

  /**
   * Update harmonic pacing
   */
  private updateHarmonicPacing(): void {
    if (!this.pacing.pacingActive) return;

    // Advance harmonic time
    this.harmonicTime += this.HARMONIC_INTERVAL / 1000; // Convert to seconds

    // Update phase
    this.pacing.phase = (this.harmonicTime * this.pacing.baseFrequency * 360) % 360;

    // Update rhythm lock phase
    this.rhythmLock.rhythmPhase = this.pacing.phase;
  }

  /**
   * Get harmonic value at current time
   */
  public getHarmonicValue(): number {
    if (!this.pacing.pacingActive) return 0.5;

    // Combine harmonics
    let value = 0;
    this.pacing.harmonics.forEach(harmonic => {
      const phase = (this.harmonicTime * harmonic.frequency * 2 * Math.PI);
      value += Math.sin(phase) * harmonic.amplitude;
    });

    // Normalize to 0-1
    const maxAmplitude = this.pacing.harmonics.reduce((sum, h) => sum + h.amplitude, 0);
    return (value / maxAmplitude + 1) / 2; // Shift from [-1,1] to [0,1]
  }

  /**
   * Update rhythm lock
   */
  private updateRhythmLock(): void {
    // Calculate phase alignment
    const phaseDiff = Math.abs(this.rhythmLock.presencePhase - this.rhythmLock.rhythmPhase);
    const normalizedDiff = Math.min(phaseDiff, 360 - phaseDiff); // Handle wrap-around
    
    this.rhythmLock.phaseAlignment = Math.max(0, 100 - (normalizedDiff / 180) * 100);
  }

  /**
   * Apply rhythm lock to intensity
   */
  private applyRhythmLock(intensity: number): number {
    // Get harmonic modulation
    const harmonicValue = this.getHarmonicValue();
    const lockStrength = this.rhythmLock.lockStrength / 100;

    // Blend intensity with harmonic rhythm
    const rhythmicIntensity = 50 + (harmonicValue - 0.5) * 50; // Scale to 0-100
    
    return intensity * (1 - lockStrength) + rhythmicIntensity * lockStrength;
  }

  /**
   * Update presence phase for rhythm lock
   */
  public updatePresencePhase(phase: number): void {
    this.rhythmLock.presencePhase = phase % 360;
    
    // Activate lock if phase difference is within tolerance
    const phaseDiff = Math.abs(this.rhythmLock.presencePhase - this.rhythmLock.rhythmPhase);
    const normalizedDiff = Math.min(phaseDiff, 360 - phaseDiff);
    
    this.rhythmLock.lockActive = normalizedDiff < this.rhythmLock.syncTolerance;
  }

  /**
   * Set base frequency
   */
  public setBaseFrequency(frequency: number): void {
    this.pacing.baseFrequency = Math.min(10, Math.max(0.1, frequency));
    
    // Update harmonics
    this.pacing.harmonics = [
      { frequency: this.pacing.baseFrequency, amplitude: 1.0 },
      { frequency: this.pacing.baseFrequency * 2, amplitude: 0.5 },
      { frequency: this.pacing.baseFrequency * 3, amplitude: 0.25 },
    ];
  }

  /**
   * Get current state
   */
  public getState() {
    return {
      moderation: { ...this.moderation },
      dampening: { ...this.dampening },
      smoothness: { ...this.smoothness },
      pacing: {
        pacingActive: this.pacing.pacingActive,
        baseFrequency: this.pacing.baseFrequency,
        phase: this.pacing.phase,
        rhythmStrength: this.pacing.rhythmStrength,
        naturalCadence: this.pacing.naturalCadence,
      },
      rhythmLock: { ...this.rhythmLock },
    };
  }

  /**
   * Get summary for debugging
   */
  public getSummary(): string {
    return `EmotionalRhythm: Smoothness=${this.smoothness.smoothnessScore.toFixed(1)}%, Chaos=${this.dampening.chaosLevel.toFixed(1)}, Oscillation=${this.moderation.oscillationFrequency.toFixed(2)}Hz, RhythmLock=${this.rhythmLock.lockActive ? 'Active' : 'Inactive'}`;
  }

  /**
   * Reset rhythm controller
   */
  public reset(): void {
    this.moderation.moderationActive = false;
    this.moderation.oscillationFrequency = 0;
    this.moderation.oscillationAmplitude = 0;
    this.moderation.oscillationHistory = [];

    this.dampening.chaosDetected = false;
    this.dampening.chaosLevel = 0;
    this.dampening.dampeningActive = false;

    this.smoothness.smoothnessScore = 100;
    this.smoothness.transitionQuality = 100;
    this.smoothness.continuity = 100;
    this.smoothness.predictability = 100;
    this.smoothness.jerkiness = 0;

    this.rhythmLock.lockActive = false;
    this.rhythmLock.phaseAlignment = 100;

    this.intensityTimeseries = [];
    this.harmonicTime = 0;
  }

  /**
   * Export state for persistence
   */
  public export() {
    return {
      config: { ...this.config },
      harmonicTime: this.harmonicTime,
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
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.harmonicInterval !== null) {
      clearInterval(this.harmonicInterval);
      this.harmonicInterval = null;
    }

    this.intensityTimeseries = [];
    this.moderation.oscillationHistory = [];
  }
}
