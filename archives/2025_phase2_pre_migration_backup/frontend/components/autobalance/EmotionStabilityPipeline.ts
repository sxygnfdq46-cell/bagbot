/**
 * LEVEL 12.5 — EMOTION STABILITY PIPELINE
 * 
 * Smooths emotional content by eliminating spikes and blending transitions.
 * Maintains consistent emotional warmth while ensuring human-like flow.
 * 
 * Features:
 * - Spike elimination (instant detection & smoothing)
 * - Transition blending (seamless emotional shifts)
 * - Warmth consistency (stable emotional baseline)
 * - Human-like flow (natural emotional rhythm)
 * - Equilibrium preservation
 * 
 * Monitoring: 10ms intervals (100 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type EmotionType = 'joy' | 'calm' | 'enthusiasm' | 'empathy' | 'confidence' | 'warmth';

interface EmotionalState {
  emotion: EmotionType;
  intensity: number; // 0-100
  warmth: number; // 0-100
  stability: number; // 0-100
}

interface EmotionalSpike {
  detectedAt: number; // timestamp
  emotion: EmotionType;
  peakIntensity: number;
  smoothedTo: number;
  duration: number; // ms
}

interface TransitionBlend {
  fromEmotion: EmotionType;
  toEmotion: EmotionType;
  progress: number; // 0-1
  smoothness: number; // 0-100
  active: boolean;
}

interface WarmthBaseline {
  target: number; // 0-100
  current: number; // 0-100
  consistency: number; // 0-100
}

interface EmotionalFlow {
  rhythm: 'natural' | 'forced' | 'chaotic';
  coherence: number; // 0-100
  humanLikeness: number; // 0-100
}

interface EmotionStabilityConfig {
  monitoringInterval: number; // ms
  spikeThreshold: number; // intensity change threshold
  smoothingStrength: number; // 0-1
  transitionDuration: number; // ms
  warmthTarget: number; // 0-100
  enabled: boolean;
}

/* ================================ */
/* EMOTION STABILITY PIPELINE       */
/* ================================ */

export class EmotionStabilityPipeline {
  private config: EmotionStabilityConfig;
  
  // Emotional State
  private currentState: EmotionalState;
  private previousState: EmotionalState;
  private stateHistory: EmotionalState[];
  
  // Spike Detection
  private recentSpikes: EmotionalSpike[];
  private intensityHistory: number[];
  
  // Transition Management
  private activeTransition: TransitionBlend | null;
  
  // Warmth Baseline
  private warmthBaseline: WarmthBaseline;
  
  // Flow Analysis
  private emotionalFlow: EmotionalFlow;
  
  // Monitoring
  private monitoringIntervalId: number | null;

  constructor(config?: Partial<EmotionStabilityConfig>) {
    this.config = {
      monitoringInterval: 10, // 100 Hz
      spikeThreshold: 20, // 20% change
      smoothingStrength: 0.7,
      transitionDuration: 500, // 500ms
      warmthTarget: 75,
      enabled: true,
      ...config,
    };

    // Initialize emotional state
    this.currentState = {
      emotion: 'warmth',
      intensity: 70,
      warmth: this.config.warmthTarget,
      stability: 100,
    };

    this.previousState = { ...this.currentState };
    this.stateHistory = [this.currentState];
    this.recentSpikes = [];
    this.intensityHistory = [];
    this.activeTransition = null;

    // Initialize warmth baseline
    this.warmthBaseline = {
      target: this.config.warmthTarget,
      current: this.config.warmthTarget,
      consistency: 100,
    };

    // Initialize flow
    this.emotionalFlow = {
      rhythm: 'natural',
      coherence: 100,
      humanLikeness: 100,
    };

    this.monitoringIntervalId = null;

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /* ================================ */
  /* MONITORING (100 Hz)              */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.detectSpikes();
      this.updateTransition();
      this.maintainWarmth();
      this.analyzeFlow();
      this.updateStability();
    }, this.config.monitoringInterval);
  }

  /* ================================ */
  /* SPIKE DETECTION & ELIMINATION    */
  /* ================================ */

  private detectSpikes(): void {
    // Track intensity history
    this.intensityHistory.push(this.currentState.intensity);
    if (this.intensityHistory.length > 50) {
      this.intensityHistory.shift();
    }

    // Detect spike (sudden change)
    if (this.intensityHistory.length >= 2) {
      const current = this.intensityHistory[this.intensityHistory.length - 1];
      const previous = this.intensityHistory[this.intensityHistory.length - 2];
      const change = Math.abs(current - previous);

      if (change >= this.config.spikeThreshold) {
        // Spike detected - smooth it
        this.eliminateSpike(current, previous);
      }
    }
  }

  private eliminateSpike(peakIntensity: number, baseline: number): void {
    const now = Date.now();

    // Smooth to midpoint
    const smoothedTo = baseline + (peakIntensity - baseline) * this.config.smoothingStrength;
    this.currentState.intensity = smoothedTo;

    // Record spike
    const spike: EmotionalSpike = {
      detectedAt: now,
      emotion: this.currentState.emotion,
      peakIntensity,
      smoothedTo,
      duration: 0, // will be updated
    };

    this.recentSpikes.push(spike);

    // Keep last 20 spikes
    if (this.recentSpikes.length > 20) {
      this.recentSpikes.shift();
    }
  }

  /* ================================ */
  /* TRANSITION BLENDING              */
  /* ================================ */

  private updateTransition(): void {
    if (!this.activeTransition) return;

    // Update progress
    this.activeTransition.progress = Math.min(1, this.activeTransition.progress + (this.config.monitoringInterval / this.config.transitionDuration));

    // Blend emotions
    const fromIntensity = this.previousState.intensity;
    const toIntensity = this.currentState.intensity;
    const blendedIntensity = fromIntensity + (toIntensity - fromIntensity) * this.activeTransition.progress;

    this.currentState.intensity = blendedIntensity;

    // Calculate smoothness (inverse of rate of change)
    const changeRate = Math.abs(toIntensity - fromIntensity) / this.config.transitionDuration;
    this.activeTransition.smoothness = Math.max(0, 100 - changeRate * 100);

    // Complete transition
    if (this.activeTransition.progress >= 1) {
      this.activeTransition.active = false;
      this.activeTransition = null;
    }
  }

  public startTransition(toEmotion: EmotionType, toIntensity: number): void {
    this.previousState = { ...this.currentState };

    this.activeTransition = {
      fromEmotion: this.currentState.emotion,
      toEmotion,
      progress: 0,
      smoothness: 100,
      active: true,
    };

    this.currentState.emotion = toEmotion;
    // Intensity will be blended in updateTransition
  }

  /* ================================ */
  /* WARMTH MAINTENANCE               */
  /* ================================ */

  private maintainWarmth(): void {
    // Drift towards warmth baseline
    const diff = this.warmthBaseline.target - this.warmthBaseline.current;
    this.warmthBaseline.current += diff * 0.1; // 10% per cycle

    // Apply to current state
    this.currentState.warmth = this.warmthBaseline.current;

    // Calculate consistency
    const deviation = Math.abs(this.currentState.warmth - this.warmthBaseline.target);
    this.warmthBaseline.consistency = Math.max(0, 100 - deviation * 2);
  }

  /* ================================ */
  /* FLOW ANALYSIS                    */
  /* ================================ */

  private analyzeFlow(): void {
    // Analyze recent emotional changes
    if (this.stateHistory.length < 10) {
      this.emotionalFlow.rhythm = 'natural';
      this.emotionalFlow.coherence = 100;
      this.emotionalFlow.humanLikeness = 100;
      return;
    }

    const recent = this.stateHistory.slice(-10);

    // Calculate intensity variance
    const intensities = recent.map(s => s.intensity);
    const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - avgIntensity, 2), 0) / intensities.length;

    // Determine rhythm
    if (variance < 50) {
      this.emotionalFlow.rhythm = 'natural';
    } else if (variance < 200) {
      this.emotionalFlow.rhythm = 'forced';
    } else {
      this.emotionalFlow.rhythm = 'chaotic';
    }

    // Calculate coherence (inverse of variance)
    this.emotionalFlow.coherence = Math.max(0, 100 - Math.sqrt(variance));

    // Calculate human-likeness (natural rhythm + high coherence)
    const rhythmScore = this.emotionalFlow.rhythm === 'natural' ? 100 : 
                       this.emotionalFlow.rhythm === 'forced' ? 60 : 30;
    this.emotionalFlow.humanLikeness = (rhythmScore + this.emotionalFlow.coherence) / 2;
  }

  /* ================================ */
  /* STABILITY UPDATE                 */
  /* ================================ */

  private updateStability(): void {
    // Stability based on:
    // - Low spike count
    // - High warmth consistency
    // - Natural flow rhythm

    const spikeScore = Math.max(0, 100 - this.recentSpikes.length * 5);
    const warmthScore = this.warmthBaseline.consistency;
    const flowScore = this.emotionalFlow.humanLikeness;

    this.currentState.stability = (spikeScore + warmthScore + flowScore) / 3;

    // Store in history
    this.stateHistory.push({ ...this.currentState });
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
  }

  /* ================================ */
  /* STATE MANAGEMENT                 */
  /* ================================ */

  public updateEmotion(emotion: EmotionType, intensity: number): void {
    if (emotion !== this.currentState.emotion) {
      this.startTransition(emotion, intensity);
    } else {
      this.currentState.intensity = Math.max(0, Math.min(100, intensity));
    }
  }

  public setWarmthTarget(target: number): void {
    this.warmthBaseline.target = Math.max(0, Math.min(100, target));
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getCurrentState(): EmotionalState {
    return { ...this.currentState };
  }

  public getActiveTransition(): TransitionBlend | null {
    return this.activeTransition ? { ...this.activeTransition } : null;
  }

  public getWarmthBaseline(): WarmthBaseline {
    return { ...this.warmthBaseline };
  }

  public getEmotionalFlow(): EmotionalFlow {
    return { ...this.emotionalFlow };
  }

  public getRecentSpikes(count: number = 10): EmotionalSpike[] {
    return this.recentSpikes.slice(-count);
  }

  public getState() {
    return {
      currentState: { ...this.currentState },
      previousState: { ...this.previousState },
      stateHistory: this.stateHistory.slice(-20),
      recentSpikes: this.recentSpikes.slice(-10),
      activeTransition: this.activeTransition ? { ...this.activeTransition } : null,
      warmthBaseline: { ...this.warmthBaseline },
      emotionalFlow: { ...this.emotionalFlow },
    };
  }

  public getSummary(): string {
    const state = this.currentState;
    const warmth = this.warmthBaseline;
    const flow = this.emotionalFlow;

    return `Emotion Stability Pipeline Summary:
  Current Emotion: ${state.emotion}
  Intensity: ${state.intensity.toFixed(1)}
  Warmth: ${state.warmth.toFixed(1)} (target: ${warmth.target})
  Stability: ${state.stability.toFixed(1)}%
  Warmth Consistency: ${warmth.consistency.toFixed(1)}%
  Flow Rhythm: ${flow.rhythm}
  Flow Coherence: ${flow.coherence.toFixed(1)}%
  Human-Likeness: ${flow.humanLikeness.toFixed(1)}%
  Recent Spikes: ${this.recentSpikes.length}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.currentState = {
      emotion: 'warmth',
      intensity: 70,
      warmth: this.config.warmthTarget,
      stability: 100,
    };

    this.previousState = { ...this.currentState };
    this.stateHistory = [this.currentState];
    this.recentSpikes = [];
    this.intensityHistory = [];
    this.activeTransition = null;
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
  }
}
