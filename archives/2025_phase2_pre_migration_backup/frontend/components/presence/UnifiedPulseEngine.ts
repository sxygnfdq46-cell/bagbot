/**
 * LEVEL 11.5 — UNIFIED PULSE ENGINE (UPE)
 * 
 * The "heartbeat" of BagBot across the entire system.
 * One global pulse. Synchronized breathing and aura. Emotional timing harmonization.
 * 
 * Architecture:
 * - Global pulse generator (single heartbeat for all surfaces)
 * - Synchronized breathing rhythm (inhale/exhale cycle)
 * - Aura sync phase (coordinates all visual effects)
 * - Emotional timing harmonization (mood shifts sync with pulse)
 * - GPU-optimized rhythmic effects
 * 
 * Outputs:
 * - pulsePhase: 0-1 (current pulse position)
 * - auraSyncPhase: 0-360° (aura rotation phase)
 * - breathPhase: 'inhale' | 'exhale' | 'hold'
 * 
 * PRIVACY: Zero data storage, ephemeral only, pure timing coordination.
 */

// ================================
// TYPES
// ================================

export type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export interface EmotionalBeat {
  emotion: 'calm' | 'curious' | 'confident' | 'cautious' | 'determined';
  beatStrength: number; // 0-100: how strong this beat is
  syncAlignment: number; // 0-100: how aligned with pulse
}

/**
 * Pulse state
 */
export interface PulseState {
  timestamp: number;
  
  // Core pulse
  pulsePhase: number; // 0-1: current position in pulse cycle
  pulseBPM: number; // Beats per minute
  pulseIntensity: number; // 0-100: strength of pulse
  
  // Breathing rhythm
  breathPhase: BreathPhase;
  breathProgress: number; // 0-1: progress through current phase
  breathCycleTime: number; // milliseconds per full cycle
  
  // Aura sync
  auraSyncPhase: number; // 0-360: rotation phase
  auraRotationSpeed: number; // degrees per second
  auraIntensity: number; // 0-100: visual effect strength
  
  // Emotional harmonization
  emotionalBeat: EmotionalBeat;
  
  // Timing metrics
  globalSync: number; // 0-100: cross-system synchronization
  rhythmStability: number; // 0-100: consistency of timing
}

/**
 * Pulse configuration
 */
export interface PulseConfig {
  baseBPM: number; // Base beats per minute
  breathMultiplier: number; // Breath cycle = pulse cycle * multiplier
  auraRotationSpeed: number; // Degrees per second
  enableEmotionalSync: boolean;
  enableGPUOptimization: boolean;
}

/**
 * Pulse callback
 */
export type PulseCallback = (state: PulseState) => void;

// ================================
// UNIFIED PULSE ENGINE
// ================================

export class UnifiedPulseEngine {
  private state: PulseState;
  private config: PulseConfig;
  private pulseStartTime: number;
  private animationFrameId: number | null = null;
  private callbacks: Set<PulseCallback> = new Set();
  
  // Breath phase timing (as fraction of breath cycle)
  private readonly BREATH_PHASES = {
    inhale: 0.4, // 40% of cycle
    holdIn: 0.1, // 10% of cycle
    exhale: 0.4, // 40% of cycle
    holdOut: 0.1, // 10% of cycle
  };
  
  constructor(config?: Partial<PulseConfig>) {
    this.config = {
      baseBPM: 60, // 1 beat per second
      breathMultiplier: 4, // 4 pulses per breath
      auraRotationSpeed: 30, // 30 degrees per second
      enableEmotionalSync: true,
      enableGPUOptimization: true,
      ...config,
    };
    
    this.pulseStartTime = Date.now();
    this.state = this.createDefaultState();
    
    // Start pulse loop
    this.start();
  }

  /**
   * Create default pulse state
   */
  private createDefaultState(): PulseState {
    return {
      timestamp: Date.now(),
      
      pulsePhase: 0,
      pulseBPM: this.config.baseBPM,
      pulseIntensity: 70,
      
      breathPhase: 'inhale',
      breathProgress: 0,
      breathCycleTime: (60000 / this.config.baseBPM) * this.config.breathMultiplier,
      
      auraSyncPhase: 0,
      auraRotationSpeed: this.config.auraRotationSpeed,
      auraIntensity: 80,
      
      emotionalBeat: {
        emotion: 'calm',
        beatStrength: 60,
        syncAlignment: 80,
      },
      
      globalSync: 90,
      rhythmStability: 85,
    };
  }

  /**
   * Start pulse loop
   */
  start(): void {
    if (this.animationFrameId !== null) return; // Already running
    
    this.pulseStartTime = Date.now();
    this.loop();
  }

  /**
   * Stop pulse loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }
  }

  /**
   * Main pulse loop
   */
  private loop = (): void => {
    const now = Date.now();
    const elapsed = now - this.pulseStartTime;
    
    // Calculate pulse phase (0-1)
    const pulseCycleTime = 60000 / this.state.pulseBPM;
    this.state.pulsePhase = (elapsed % pulseCycleTime) / pulseCycleTime;
    
    // Calculate breath phase
    this.updateBreathPhase(elapsed);
    
    // Calculate aura sync phase
    const auraElapsedDegrees = (elapsed / 1000) * this.state.auraRotationSpeed;
    this.state.auraSyncPhase = auraElapsedDegrees % 360;
    
    // Harmonize emotional beat
    this.harmonizeEmotionalBeat();
    
    // Update timestamp
    this.state.timestamp = now;
    
    // Notify callbacks
    this.notifyCallbacks();
    
    // Next frame
    if (typeof requestAnimationFrame !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  /**
   * Update breath phase
   */
  private updateBreathPhase(elapsed: number): void {
    const breathCycleTime = this.state.breathCycleTime;
    const cycleProgress = (elapsed % breathCycleTime) / breathCycleTime;
    
    // Determine which phase we're in
    let cumulativeProgress = 0;
    
    if (cycleProgress < (cumulativeProgress += this.BREATH_PHASES.inhale)) {
      this.state.breathPhase = 'inhale';
      this.state.breathProgress = cycleProgress / this.BREATH_PHASES.inhale;
    } else if (cycleProgress < (cumulativeProgress += this.BREATH_PHASES.holdIn)) {
      this.state.breathPhase = 'hold-in';
      this.state.breathProgress =
        (cycleProgress - (cumulativeProgress - this.BREATH_PHASES.holdIn)) /
        this.BREATH_PHASES.holdIn;
    } else if (cycleProgress < (cumulativeProgress += this.BREATH_PHASES.exhale)) {
      this.state.breathPhase = 'exhale';
      this.state.breathProgress =
        (cycleProgress - (cumulativeProgress - this.BREATH_PHASES.exhale)) /
        this.BREATH_PHASES.exhale;
    } else {
      this.state.breathPhase = 'hold-out';
      this.state.breathProgress =
        (cycleProgress - (cumulativeProgress - this.BREATH_PHASES.holdOut)) /
        this.BREATH_PHASES.holdOut;
    }
  }

  /**
   * Harmonize emotional beat with pulse
   */
  private harmonizeEmotionalBeat(): void {
    // Emotional beat strength follows pulse intensity
    const pulseStrength = Math.sin(this.state.pulsePhase * Math.PI * 2) * 0.5 + 0.5;
    this.state.emotionalBeat.beatStrength =
      this.state.emotionalBeat.beatStrength * 0.9 + pulseStrength * 100 * 0.1;
    
    // Sync alignment: higher during pulse peaks
    const peakAlignment = pulseStrength > 0.8 ? 95 : 80;
    this.state.emotionalBeat.syncAlignment =
      this.state.emotionalBeat.syncAlignment * 0.95 + peakAlignment * 0.05;
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    this.state.pulseBPM = Math.max(30, Math.min(120, bpm)); // Clamp 30-120 BPM
    this.state.breathCycleTime = (60000 / this.state.pulseBPM) * this.config.breathMultiplier;
  }

  /**
   * Set pulse intensity
   */
  setPulseIntensity(intensity: number): void {
    this.state.pulseIntensity = Math.max(0, Math.min(100, intensity));
  }

  /**
   * Set aura intensity
   */
  setAuraIntensity(intensity: number): void {
    this.state.auraIntensity = Math.max(0, Math.min(100, intensity));
  }

  /**
   * Set aura rotation speed
   */
  setAuraRotationSpeed(degreesPerSecond: number): void {
    this.state.auraRotationSpeed = Math.max(0, Math.min(360, degreesPerSecond));
  }

  /**
   * Set emotional beat
   */
  setEmotionalBeat(emotion: PulseState['emotionalBeat']['emotion'], strength: number = 70): void {
    this.state.emotionalBeat.emotion = emotion;
    this.state.emotionalBeat.beatStrength = Math.max(0, Math.min(100, strength));
  }

  /**
   * Get pulse value (0-1 sine wave)
   */
  getPulseValue(): number {
    return Math.sin(this.state.pulsePhase * Math.PI * 2) * 0.5 + 0.5;
  }

  /**
   * Get breath value (0-1 smooth curve)
   */
  getBreathValue(): number {
    if (this.state.breathPhase === 'inhale') {
      // Ease in
      return Math.sin(this.state.breathProgress * Math.PI * 0.5);
    } else if (this.state.breathPhase === 'hold-in') {
      return 1;
    } else if (this.state.breathPhase === 'exhale') {
      // Ease out
      return Math.cos(this.state.breathProgress * Math.PI * 0.5);
    } else {
      return 0;
    }
  }

  /**
   * Subscribe to pulse updates
   */
  subscribe(callback: PulseCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Notify all callbacks
   */
  private notifyCallbacks(): void {
    for (const callback of Array.from(this.callbacks)) {
      callback(this.getState());
    }
  }

  /**
   * Get current state
   */
  getState(): PulseState {
    return { ...this.state };
  }

  /**
   * Get state summary
   */
  getSummary(): {
    pulse: string;
    breath: string;
    aura: string;
    emotional: string;
  } {
    const { pulseBPM, pulseIntensity, breathPhase, auraIntensity, emotionalBeat } = this.state;
    
    const pulse = `${pulseBPM} BPM (${pulseIntensity.toFixed(0)}%)`;
    
    const breath = `${breathPhase} (${(this.state.breathProgress * 100).toFixed(0)}%)`;
    
    const aura = `${this.state.auraSyncPhase.toFixed(0)}° (${auraIntensity.toFixed(0)}%)`;
    
    const emotional = `${emotionalBeat.emotion} (sync: ${emotionalBeat.syncAlignment.toFixed(0)}%)`;
    
    return { pulse, breath, aura, emotional };
  }

  /**
   * Get CSS custom properties (for GPU effects)
   */
  getCSSProperties(): Record<string, string> {
    return {
      '--pulse-phase': this.state.pulsePhase.toFixed(3),
      '--pulse-value': this.getPulseValue().toFixed(3),
      '--pulse-intensity': (this.state.pulseIntensity / 100).toFixed(3),
      '--breath-value': this.getBreathValue().toFixed(3),
      '--aura-phase': `${this.state.auraSyncPhase.toFixed(1)}deg`,
      '--aura-intensity': (this.state.auraIntensity / 100).toFixed(3),
      '--emotional-beat': (this.state.emotionalBeat.beatStrength / 100).toFixed(3),
    };
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.state = this.createDefaultState();
    this.pulseStartTime = Date.now();
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      state: this.state,
      config: this.config,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.state = data.state;
      this.config = data.config;
      return true;
    } catch (error) {
      console.error('Failed to import pulse state:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.callbacks.clear();
  }
}
