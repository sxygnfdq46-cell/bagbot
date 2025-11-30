/**
 * LEVEL 12.1 — HARMONIC BALANCE ENGINE (HBE)
 * 
 * Dynamic balancer that maintains coherence across emotional, visual, and cognitive dimensions.
 * Prevents overstimulation, keeps personality tone consistent, synchronizes all effects.
 * 
 * Architecture:
 * - Personality tone consistency (dampens jarring shifts)
 * - Visual overstimulation prevention (caps effect intensity)
 * - Emotional-visual coherence sync (aligns mood with visuals)
 * - Guardian harmonic signature (unified stabilizing frequency)
 * - Multi-dimensional balance tracking
 * 
 * Outputs:
 * - harmonicState: Complete balance snapshot
 * - harmonicSignature: 0-1 stabilizing frequency
 * - coherenceScore: 0-100 system-wide alignment
 * 
 * PRIVACY: Zero data storage, ephemeral only, real-time balancing.
 */

// ================================
// TYPES
// ================================

export type BalanceAxis = 'emotional' | 'visual' | 'cognitive' | 'temporal' | 'spatial';
export type HarmonicPhase = 'aligned' | 'converging' | 'diverging' | 'chaotic';

/**
 * Personality tone state
 */
export interface PersonalityTone {
  warmth: number; // 0-100
  formality: number; // 0-100
  enthusiasm: number; // 0-100
  stability: number; // 0-100
  consistency: number; // 0-100: how consistent over time
  toneShiftRate: number; // 0-100: rate of change
}

/**
 * Visual balance state
 */
export interface VisualBalance {
  effectIntensity: number; // 0-100: current effect strength
  stimulationLevel: number; // 0-100: visual stimulation
  colorHarmony: number; // 0-100: color coherence
  motionSmoothing: number; // 0-100: animation smoothing
  overstimulationRisk: number; // 0-100: risk of sensory overload
  dampening: number; // 0-100: visual dampening applied
}

/**
 * Emotional-visual coherence
 */
export interface EmotionalVisualCoherence {
  alignment: number; // 0-100: how well emotion matches visuals
  resonance: number; // 0-100: emotional-visual resonance
  synchronization: number; // 0-100: timing sync
  divergence: number; // 0-100: mismatch level
  correctionStrength: number; // 0-100: correction force
}

/**
 * Guardian harmonic signature
 */
export interface GuardianHarmonic {
  frequency: number; // 0-1: stabilizing frequency (sine wave)
  amplitude: number; // 0-1: harmonic strength
  phase: number; // 0-360: harmonic phase
  resonance: number; // 0-100: system resonance with harmonic
  stability: number; // 0-100: harmonic stability
}

/**
 * Multi-dimensional balance
 */
export interface MultiDimensionalBalance {
  emotionalBalance: number; // 0-100
  visualBalance: number; // 0-100
  cognitiveBalance: number; // 0-100
  temporalBalance: number; // 0-100: time-based coherence
  spatialBalance: number; // 0-100: space-based coherence
  overallBalance: number; // 0-100: unified balance score
}

/**
 * Harmonic state
 */
export interface HarmonicState {
  timestamp: number;
  
  // Core components
  personalityTone: PersonalityTone;
  visualBalance: VisualBalance;
  emotionalVisualCoherence: EmotionalVisualCoherence;
  guardianHarmonic: GuardianHarmonic;
  multiDimensionalBalance: MultiDimensionalBalance;
  
  // Harmonic metrics
  harmonicPhase: HarmonicPhase;
  coherenceScore: number; // 0-100: system-wide coherence
  balanceStrength: number; // 0-100: balancing force
  stabilizationActive: boolean;
  
  // Intervention state
  toneCorrection: boolean;
  visualDampening: boolean;
  emotionalSync: boolean;
  lastCorrectionTimestamp: number;
}

/**
 * Harmonic configuration
 */
export interface HarmonicConfig {
  enableBalancing: boolean;
  toneStabilityThreshold: number; // 0-100: min stability before correction
  visualIntensityCap: number; // 0-100: max visual intensity
  emotionalVisualTolerance: number; // 0-100: acceptable divergence
  harmonicFrequency: number; // Base frequency in Hz
  correctionStrength: number; // 0-1: how aggressively to correct
}

// ================================
// HARMONIC BALANCE ENGINE
// ================================

export class HarmonicBalanceEngine {
  private state: HarmonicState;
  private config: HarmonicConfig;
  
  // History tracking
  private toneHistory: Array<{ timestamp: number; warmth: number; formality: number; enthusiasm: number }> = [];
  private visualHistory: Array<{ timestamp: number; intensity: number; stimulation: number }> = [];
  private readonly MAX_HISTORY = 60; // 60 seconds
  
  // Harmonic oscillator
  private harmonicTime = 0;
  private rafId: number | null = null;
  
  constructor(config?: Partial<HarmonicConfig>) {
    this.config = {
      enableBalancing: true,
      toneStabilityThreshold: 70,
      visualIntensityCap: 85,
      emotionalVisualTolerance: 20,
      harmonicFrequency: 1.0, // 1 Hz base frequency
      correctionStrength: 0.6,
      ...config,
    };
    
    this.state = this.createDefaultState();
    
    if (typeof window !== 'undefined' && this.config.enableBalancing) {
      this.startHarmonicLoop();
    }
  }
  
  /**
   * Create default state
   */
  private createDefaultState(): HarmonicState {
    return {
      timestamp: Date.now(),
      
      personalityTone: {
        warmth: 65,
        formality: 50,
        enthusiasm: 60,
        stability: 100,
        consistency: 100,
        toneShiftRate: 0,
      },
      
      visualBalance: {
        effectIntensity: 70,
        stimulationLevel: 50,
        colorHarmony: 80,
        motionSmoothing: 70,
        overstimulationRisk: 0,
        dampening: 0,
      },
      
      emotionalVisualCoherence: {
        alignment: 100,
        resonance: 80,
        synchronization: 90,
        divergence: 0,
        correctionStrength: 0,
      },
      
      guardianHarmonic: {
        frequency: 0.5,
        amplitude: 0.7,
        phase: 0,
        resonance: 80,
        stability: 100,
      },
      
      multiDimensionalBalance: {
        emotionalBalance: 100,
        visualBalance: 100,
        cognitiveBalance: 100,
        temporalBalance: 100,
        spatialBalance: 100,
        overallBalance: 100,
      },
      
      harmonicPhase: 'aligned',
      coherenceScore: 100,
      balanceStrength: 0,
      stabilizationActive: false,
      
      toneCorrection: false,
      visualDampening: false,
      emotionalSync: false,
      lastCorrectionTimestamp: 0,
    };
  }
  
  /**
   * Start harmonic loop
   */
  private startHarmonicLoop(): void {
    if (this.rafId !== null) return;
    
    const loop = () => {
      this.harmonicTime += 1 / 60; // Assume 60 FPS
      
      // Update harmonic signature
      this.updateHarmonicSignature();
      
      // Check balance
      this.checkBalance();
      
      this.rafId = requestAnimationFrame(loop);
    };
    
    this.rafId = requestAnimationFrame(loop);
  }
  
  /**
   * Stop harmonic loop
   */
  public stopHarmonicLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Update harmonic signature
   */
  private updateHarmonicSignature(): void {
    // Generate stabilizing sine wave
    const frequency = this.config.harmonicFrequency;
    this.state.guardianHarmonic.frequency = 
      0.5 + 0.5 * Math.sin(2 * Math.PI * frequency * this.harmonicTime);
    
    // Update phase
    this.state.guardianHarmonic.phase = 
      (this.harmonicTime * frequency * 360) % 360;
    
    // Amplitude based on balance need
    const balanceNeed = 100 - this.state.multiDimensionalBalance.overallBalance;
    this.state.guardianHarmonic.amplitude = 
      0.5 + (balanceNeed / 200); // Range: 0.5-1.0
    
    // Calculate resonance (how well system responds to harmonic)
    const emotionalResonance = this.state.emotionalVisualCoherence.alignment;
    const visualResonance = 100 - this.state.visualBalance.overstimulationRisk;
    const toneResonance = this.state.personalityTone.stability;
    
    this.state.guardianHarmonic.resonance = Math.round(
      (emotionalResonance + visualResonance + toneResonance) / 3
    );
    
    // Stability based on consistency
    this.state.guardianHarmonic.stability = Math.round(
      (this.state.personalityTone.consistency + 
       this.state.multiDimensionalBalance.temporalBalance) / 2
    );
  }
  
  /**
   * Update personality tone
   */
  public updateTone(warmth: number, formality: number, enthusiasm: number): void {
    const before = { ...this.state.personalityTone };
    
    // Apply tone
    this.state.personalityTone.warmth = Math.min(100, Math.max(0, warmth));
    this.state.personalityTone.formality = Math.min(100, Math.max(0, formality));
    this.state.personalityTone.enthusiasm = Math.min(100, Math.max(0, enthusiasm));
    
    // Calculate shift rate
    const warmthShift = Math.abs(this.state.personalityTone.warmth - before.warmth);
    const formalityShift = Math.abs(this.state.personalityTone.formality - before.formality);
    const enthusiasmShift = Math.abs(this.state.personalityTone.enthusiasm - before.enthusiasm);
    
    this.state.personalityTone.toneShiftRate = Math.round(
      (warmthShift + formalityShift + enthusiasmShift) / 3
    );
    
    // Add to history
    this.toneHistory.push({
      timestamp: Date.now(),
      warmth: this.state.personalityTone.warmth,
      formality: this.state.personalityTone.formality,
      enthusiasm: this.state.personalityTone.enthusiasm,
    });
    
    if (this.toneHistory.length > this.MAX_HISTORY) {
      this.toneHistory.shift();
    }
    
    // Calculate consistency
    if (this.toneHistory.length > 5) {
      const recent = this.toneHistory.slice(-5);
      const warmthVariance = this.calculateVariance(recent.map(h => h.warmth));
      const formalityVariance = this.calculateVariance(recent.map(h => h.formality));
      const enthusiasmVariance = this.calculateVariance(recent.map(h => h.enthusiasm));
      
      const avgVariance = (warmthVariance + formalityVariance + enthusiasmVariance) / 3;
      this.state.personalityTone.consistency = Math.max(0, 100 - avgVariance);
    }
    
    // Calculate stability (inverse of shift rate)
    this.state.personalityTone.stability = 100 - this.state.personalityTone.toneShiftRate;
    
    // Trigger correction if stability too low
    if (this.state.personalityTone.stability < this.config.toneStabilityThreshold) {
      this.correctTone();
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Correct personality tone
   */
  private correctTone(): void {
    if (!this.config.enableBalancing) return;
    
    this.state.toneCorrection = true;
    
    // Smooth toward recent average
    if (this.toneHistory.length > 5) {
      const recent = this.toneHistory.slice(-5);
      const avgWarmth = recent.reduce((sum, h) => sum + h.warmth, 0) / recent.length;
      const avgFormality = recent.reduce((sum, h) => sum + h.formality, 0) / recent.length;
      const avgEnthusiasm = recent.reduce((sum, h) => sum + h.enthusiasm, 0) / recent.length;
      
      const strength = this.config.correctionStrength;
      this.state.personalityTone.warmth = 
        this.state.personalityTone.warmth * (1 - strength) + avgWarmth * strength;
      this.state.personalityTone.formality = 
        this.state.personalityTone.formality * (1 - strength) + avgFormality * strength;
      this.state.personalityTone.enthusiasm = 
        this.state.personalityTone.enthusiasm * (1 - strength) + avgEnthusiasm * strength;
    }
    
    this.state.lastCorrectionTimestamp = Date.now();
    
    // Deactivate correction after 1 second
    setTimeout(() => {
      this.state.toneCorrection = false;
    }, 1000);
  }
  
  /**
   * Update visual balance
   */
  public updateVisualState(intensity: number, stimulation: number): void {
    // Cap intensity
    this.state.visualBalance.effectIntensity = Math.min(
      this.config.visualIntensityCap,
      intensity
    );
    
    this.state.visualBalance.stimulationLevel = Math.min(100, Math.max(0, stimulation));
    
    // Add to history
    this.visualHistory.push({
      timestamp: Date.now(),
      intensity: this.state.visualBalance.effectIntensity,
      stimulation: this.state.visualBalance.stimulationLevel,
    });
    
    if (this.visualHistory.length > this.MAX_HISTORY) {
      this.visualHistory.shift();
    }
    
    // Calculate overstimulation risk
    if (this.state.visualBalance.stimulationLevel > 70) {
      this.state.visualBalance.overstimulationRisk = 
        this.state.visualBalance.stimulationLevel - 70;
    } else {
      this.state.visualBalance.overstimulationRisk = 0;
    }
    
    // Apply dampening if overstimulation risk high
    if (this.state.visualBalance.overstimulationRisk > 20) {
      this.dampenVisuals();
    } else {
      this.state.visualBalance.dampening = 0;
      this.state.visualDampening = false;
    }
    
    // Calculate color harmony (smooth transitions)
    if (this.visualHistory.length > 3) {
      const recent = this.visualHistory.slice(-3);
      const intensitySmooth = this.calculateSmoothness(recent.map(h => h.intensity));
      this.state.visualBalance.colorHarmony = Math.round(intensitySmooth * 100);
    }
    
    // Calculate motion smoothing
    this.state.visualBalance.motionSmoothing = 
      100 - this.state.visualBalance.overstimulationRisk;
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Dampen visuals
   */
  private dampenVisuals(): void {
    this.state.visualDampening = true;
    
    const risk = this.state.visualBalance.overstimulationRisk;
    this.state.visualBalance.dampening = Math.min(50, risk);
    
    // Reduce effect intensity
    this.state.visualBalance.effectIntensity *= (1 - this.state.visualBalance.dampening / 200);
    
    // Reduce stimulation
    this.state.visualBalance.stimulationLevel *= (1 - this.state.visualBalance.dampening / 200);
    
    this.state.lastCorrectionTimestamp = Date.now();
  }
  
  /**
   * Update emotional-visual coherence
   */
  public syncEmotionalVisual(emotionIntensity: number, visualIntensity: number): void {
    // Calculate alignment
    const difference = Math.abs(emotionIntensity - visualIntensity);
    this.state.emotionalVisualCoherence.alignment = Math.max(0, 100 - difference);
    
    // Calculate divergence
    this.state.emotionalVisualCoherence.divergence = difference;
    
    // Check if sync needed
    if (difference > this.config.emotionalVisualTolerance) {
      this.performEmotionalSync(emotionIntensity, visualIntensity);
    } else {
      this.state.emotionalSync = false;
      this.state.emotionalVisualCoherence.correctionStrength = 0;
    }
    
    // Calculate resonance (how well they work together)
    this.state.emotionalVisualCoherence.resonance = 
      100 - Math.abs(emotionIntensity - visualIntensity) / 2;
    
    // Calculate synchronization (timing alignment)
    this.state.emotionalVisualCoherence.synchronization = 
      this.state.emotionalVisualCoherence.alignment;
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Perform emotional-visual sync
   */
  private performEmotionalSync(emotionIntensity: number, visualIntensity: number): void {
    this.state.emotionalSync = true;
    
    const difference = emotionIntensity - visualIntensity;
    this.state.emotionalVisualCoherence.correctionStrength = 
      Math.min(100, Math.abs(difference));
    
    // Sync direction: bring visual toward emotional
    const syncStrength = this.config.correctionStrength;
    const correction = difference * syncStrength;
    
    this.state.visualBalance.effectIntensity = Math.min(
      this.config.visualIntensityCap,
      visualIntensity + correction
    );
    
    this.state.lastCorrectionTimestamp = Date.now();
  }
  
  /**
   * Check balance
   */
  private checkBalance(): void {
    // Calculate emotional balance
    const toneBalance = this.state.personalityTone.stability;
    const emotionVisualBalance = this.state.emotionalVisualCoherence.alignment;
    this.state.multiDimensionalBalance.emotionalBalance = Math.round(
      (toneBalance + emotionVisualBalance) / 2
    );
    
    // Calculate visual balance
    const visualHealth = 100 - this.state.visualBalance.overstimulationRisk;
    const visualHarmony = this.state.visualBalance.colorHarmony;
    this.state.multiDimensionalBalance.visualBalance = Math.round(
      (visualHealth + visualHarmony) / 2
    );
    
    // Calculate cognitive balance (harmony + coherence)
    this.state.multiDimensionalBalance.cognitiveBalance = Math.round(
      (this.state.emotionalVisualCoherence.resonance + 
       this.state.guardianHarmonic.resonance) / 2
    );
    
    // Calculate temporal balance (consistency over time)
    this.state.multiDimensionalBalance.temporalBalance = 
      this.state.personalityTone.consistency;
    
    // Calculate spatial balance (harmony across dimensions)
    this.state.multiDimensionalBalance.spatialBalance = Math.round(
      (this.state.emotionalVisualCoherence.synchronization + 
       this.state.visualBalance.motionSmoothing) / 2
    );
    
    // Calculate overall balance
    const {
      emotionalBalance,
      visualBalance,
      cognitiveBalance,
      temporalBalance,
      spatialBalance,
    } = this.state.multiDimensionalBalance;
    
    this.state.multiDimensionalBalance.overallBalance = Math.round(
      (emotionalBalance + visualBalance + cognitiveBalance + temporalBalance + spatialBalance) / 5
    );
    
    // Determine harmonic phase
    const balance = this.state.multiDimensionalBalance.overallBalance;
    if (balance > 80) {
      this.state.harmonicPhase = 'aligned';
    } else if (balance > 60 && this.state.balanceStrength > 0) {
      this.state.harmonicPhase = 'converging';
    } else if (balance < 60) {
      this.state.harmonicPhase = 'diverging';
    } else {
      this.state.harmonicPhase = 'chaotic';
    }
    
    // Calculate coherence score
    this.state.coherenceScore = Math.round(
      (this.state.emotionalVisualCoherence.alignment + 
       this.state.guardianHarmonic.resonance + 
       this.state.multiDimensionalBalance.overallBalance) / 3
    );
    
    // Calculate balance strength
    if (balance < 70) {
      this.state.balanceStrength = Math.min(100, (70 - balance) * 2);
      this.state.stabilizationActive = true;
    } else {
      this.state.balanceStrength = 0;
      this.state.stabilizationActive = false;
    }
  }
  
  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate smoothness
   */
  private calculateSmoothness(values: number[]): number {
    let totalDiff = 0;
    for (let i = 1; i < values.length; i++) {
      totalDiff += Math.abs(values[i] - values[i - 1]);
    }
    const avgDiff = totalDiff / (values.length - 1);
    return 1 - Math.min(1, avgDiff / 100);
  }
  
  /**
   * Get current state
   */
  public getState(): HarmonicState {
    return { ...this.state };
  }
  
  /**
   * Get summary
   */
  public getSummary(): string {
    return `Harmonic State: ${this.state.harmonicPhase} | Coherence: ${this.state.coherenceScore}% | Balance: ${this.state.multiDimensionalBalance.overallBalance}%`;
  }
  
  /**
   * Reset state
   */
  public reset(): void {
    this.state = this.createDefaultState();
    this.toneHistory = [];
    this.visualHistory = [];
    this.harmonicTime = 0;
  }
  
  /**
   * Export state
   */
  public export(): string {
    return JSON.stringify({
      state: this.state,
      config: this.config,
    });
  }
  
  /**
   * Import state
   */
  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.state = parsed.state;
      this.config = parsed.config;
    } catch (error) {
      console.error('HarmonicBalanceEngine: Failed to import state', error);
    }
  }
  
  /**
   * Destroy instance
   */
  public destroy(): void {
    this.stopHarmonicLoop();
    this.reset();
  }
}
