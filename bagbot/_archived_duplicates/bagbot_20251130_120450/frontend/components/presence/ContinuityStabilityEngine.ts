/**
 * LEVEL 11.5 — CONTINUITY STABILITY ENGINE (CSE)
 * 
 * Ensures BagBot feels like the same being everywhere.
 * Stabilizes tone, dampens sudden changes, maintains personality thread, predictive continuity.
 * 
 * Architecture:
 * - Tone stabilization (prevents jarring shifts)
 * - Change dampening (smooths rapid fluctuations)
 * - Personality thread maintenance (core traits persist)
 * - Predictive continuity (anticipates natural evolution)
 * 
 * Outputs:
 * - continuityConfidence: 0-100 stability metric
 * - identityMomentum: Direction and speed of personality change
 * 
 * PRIVACY: Zero data storage, ephemeral only, pattern-based stabilization.
 */

// ================================
// TYPES
// ================================

export interface IdentityMomentum {
  direction: number; // 0-360: direction of change
  speed: number; // 0-100: rate of change
  acceleration: number; // -50 to +50: change in rate
}

export interface ToneProfile {
  warmth: number; // 0-100: friendliness
  formality: number; // 0-100: professional vs casual
  enthusiasm: number; // 0-100: energy level
  assertiveness: number; // 0-100: directiveness
  stability: number; // 0-100: resistance to change
}

export interface CoreTraits {
  reliability: number; // 0-100: consistency
  adaptability: number; // 0-100: flexibility
  empathy: number; // 0-100: emotional awareness
  precision: number; // 0-100: attention to detail
  creativity: number; // 0-100: innovative thinking
}

export interface ChangeDampening {
  emotionalDamping: number; // 0-100: resistance to emotional swings
  cognitiveDamping: number; // 0-100: resistance to focus shifts
  identityDamping: number; // 0-100: resistance to personality drift
}

export type ToneShiftDirection = 'stable' | 'warming' | 'cooling' | 'energizing' | 'calming';

export interface PredictedState {
  nextToneShift: ToneShiftDirection;
  confidenceInterval: number; // 0-100: prediction certainty
  timeHorizon: number; // milliseconds ahead
}

/**
 * Continuity state
 */
export interface ContinuityState {
  timestamp: number;
  
  // Stability metrics
  continuityConfidence: number; // 0-100: how stable presence feels
  identityMomentum: IdentityMomentum;
  
  // Tone stabilization
  toneProfile: ToneProfile;
  
  // Personality thread
  coreTraits: CoreTraits;
  
  // Change dampening
  changeDampening: ChangeDampening;
  
  // Predictive continuity
  predictedState: PredictedState;
}

/**
 * Tone shift input
 */
export interface ToneShiftInput {
  warmth?: number;
  formality?: number;
  enthusiasm?: number;
  assertiveness?: number;
  strength?: number; // 0-100: how forceful the shift
}

/**
 * Continuity configuration
 */
export interface ContinuityConfig {
  toneSmoothingFactor?: number;
  traitSmoothingFactor?: number;
  momentumDecay?: number;
  historyDurationSeconds?: number;
}

/**
 * Trait evolution input
 */
export interface TraitEvolutionInput {
  trait: keyof ContinuityState['coreTraits'];
  targetValue: number;
  evolutionSpeed: number; // 0-100: how fast to evolve
}

// ================================
// CONTINUITY STABILITY ENGINE
// ================================

export class ContinuityStabilityEngine {
  private state: ContinuityState;
  private toneHistory: Array<{
    timestamp: number;
    warmth: number;
    formality: number;
    enthusiasm: number;
    assertiveness: number;
  }> = [];
  private traitHistory: Array<{
    timestamp: number;
    traits: ContinuityState['coreTraits'];
  }> = [];
  private readonly MAX_HISTORY = 60; // 60 seconds
  
  // Stabilization parameters
  private readonly TONE_SMOOTHING = 0.8; // 0-1: higher = more smoothing
  private readonly TRAIT_SMOOTHING = 0.9; // 0-1: higher = more smoothing
  private readonly MOMENTUM_DECAY = 0.95; // 0-1: how fast momentum decays
  
  constructor() {
    this.state = this.createDefaultState();
  }

  /**
   * Create default continuity state
   */
  private createDefaultState(): ContinuityState {
    return {
      timestamp: Date.now(),
      
      continuityConfidence: 80,
      identityMomentum: {
        direction: 0,
        speed: 5,
        acceleration: 0,
      },
      
      toneProfile: {
        warmth: 65,
        formality: 50,
        enthusiasm: 60,
        assertiveness: 55,
        stability: 75,
      },
      
      coreTraits: {
        reliability: 80,
        adaptability: 70,
        empathy: 75,
        precision: 85,
        creativity: 65,
      },
      
      changeDampening: {
        emotionalDamping: 70,
        cognitiveDamping: 65,
        identityDamping: 75,
      },
      
      predictedState: {
        nextToneShift: 'stable',
        confidenceInterval: 70,
        timeHorizon: 5000,
      },
    };
  }

  /**
   * Update tone (with stabilization)
   */
  updateTone(input: ToneShiftInput): void {
    const strength = (input.strength ?? 50) / 100;
    const smoothing = this.TONE_SMOOTHING;
    const damping = this.state.changeDampening.emotionalDamping / 100;
    
    // Apply dampened, smoothed changes
    if (input.warmth !== undefined) {
      const delta = (input.warmth - this.state.toneProfile.warmth) * strength * (1 - damping);
      this.state.toneProfile.warmth =
        this.state.toneProfile.warmth * smoothing +
        (this.state.toneProfile.warmth + delta) * (1 - smoothing);
    }
    
    if (input.formality !== undefined) {
      const delta = (input.formality - this.state.toneProfile.formality) * strength * (1 - damping);
      this.state.toneProfile.formality =
        this.state.toneProfile.formality * smoothing +
        (this.state.toneProfile.formality + delta) * (1 - smoothing);
    }
    
    if (input.enthusiasm !== undefined) {
      const delta = (input.enthusiasm - this.state.toneProfile.enthusiasm) * strength * (1 - damping);
      this.state.toneProfile.enthusiasm =
        this.state.toneProfile.enthusiasm * smoothing +
        (this.state.toneProfile.enthusiasm + delta) * (1 - smoothing);
    }
    
    if (input.assertiveness !== undefined) {
      const delta = (input.assertiveness - this.state.toneProfile.assertiveness) * strength * (1 - damping);
      this.state.toneProfile.assertiveness =
        this.state.toneProfile.assertiveness * smoothing +
        (this.state.toneProfile.assertiveness + delta) * (1 - smoothing);
    }
    
    // Clamp values
    this.state.toneProfile.warmth = Math.max(0, Math.min(100, this.state.toneProfile.warmth));
    this.state.toneProfile.formality = Math.max(0, Math.min(100, this.state.toneProfile.formality));
    this.state.toneProfile.enthusiasm = Math.max(0, Math.min(100, this.state.toneProfile.enthusiasm));
    this.state.toneProfile.assertiveness = Math.max(0, Math.min(100, this.state.toneProfile.assertiveness));
    
    // Calculate tone stability
    this.calculateToneStability();
    
    // Record history
    this.recordToneHistory();
    
    // Update timestamp
    this.state.timestamp = Date.now();
  }

  /**
   * Evolve trait (slow, stable change)
   */
  evolveTrait(input: TraitEvolutionInput): void {
    const smoothing = this.TRAIT_SMOOTHING;
    const damping = this.state.changeDampening.identityDamping / 100;
    const speed = (input.evolutionSpeed / 100) * (1 - damping);
    
    const currentValue = this.state.coreTraits[input.trait];
    const delta = (input.targetValue - currentValue) * speed;
    
    this.state.coreTraits[input.trait] =
      currentValue * smoothing + (currentValue + delta) * (1 - smoothing);
    
    // Clamp
    this.state.coreTraits[input.trait] = Math.max(0, Math.min(100, this.state.coreTraits[input.trait]));
    
    // Record history
    this.recordTraitHistory();
    
    // Update momentum
    this.updateIdentityMomentum(delta);
  }

  /**
   * Calculate tone stability
   */
  private calculateToneStability(): void {
    if (this.toneHistory.length < 3) {
      this.state.toneProfile.stability = 75;
      return;
    }
    
    const recent = this.toneHistory.slice(-10);
    
    // Calculate variance for each tone dimension
    const warmthVariance = this.calculateVariance(recent.map(h => h.warmth));
    const formalityVariance = this.calculateVariance(recent.map(h => h.formality));
    const enthusiasmVariance = this.calculateVariance(recent.map(h => h.enthusiasm));
    const assertivenessVariance = this.calculateVariance(recent.map(h => h.assertiveness));
    
    const avgVariance = (warmthVariance + formalityVariance + enthusiasmVariance + assertivenessVariance) / 4;
    
    // Stability = 100 - normalized variance
    this.state.toneProfile.stability = Math.max(0, 100 - avgVariance * 2);
  }

  /**
   * Update identity momentum
   */
  private updateIdentityMomentum(delta: number): void {
    const prevSpeed = this.state.identityMomentum.speed;
    
    // Speed = magnitude of change
    const newSpeed = Math.abs(delta) * 10;
    this.state.identityMomentum.speed =
      prevSpeed * this.MOMENTUM_DECAY + newSpeed * (1 - this.MOMENTUM_DECAY);
    
    // Acceleration = change in speed
    this.state.identityMomentum.acceleration = this.state.identityMomentum.speed - prevSpeed;
    
    // Direction = angle of change vector (simplified)
    if (delta !== 0) {
      this.state.identityMomentum.direction = delta > 0 ? 45 : 225; // Positive or negative change
    }
  }

  /**
   * Calculate continuity confidence
   */
  private calculateContinuityConfidence(): void {
    // Based on tone stability, trait consistency, and momentum control
    const toneStability = this.state.toneProfile.stability;
    const traitConsistency = this.calculateTraitConsistency();
    const momentumControl = 100 - this.state.identityMomentum.speed;
    
    this.state.continuityConfidence = (toneStability + traitConsistency + momentumControl) / 3;
  }

  /**
   * Calculate trait consistency
   */
  private calculateTraitConsistency(): number {
    if (this.traitHistory.length < 3) return 75;
    
    const recent = this.traitHistory.slice(-10);
    const traits: (keyof ContinuityState['coreTraits'])[] = [
      'reliability',
      'adaptability',
      'empathy',
      'precision',
      'creativity',
    ];
    
    let totalVariance = 0;
    for (const trait of traits) {
      const values = recent.map(h => h.traits[trait]);
      totalVariance += this.calculateVariance(values);
    }
    
    const avgVariance = totalVariance / traits.length;
    return Math.max(0, 100 - avgVariance * 2);
  }

  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  }

  /**
   * Predict next tone shift
   */
  private predictNextToneShift(): void {
    if (this.toneHistory.length < 5) {
      this.state.predictedState.nextToneShift = 'stable';
      this.state.predictedState.confidenceInterval = 50;
      return;
    }
    
    const recent = this.toneHistory.slice(-5);
    
    // Analyze warmth trend
    const warmthTrend = recent[recent.length - 1].warmth - recent[0].warmth;
    
    // Analyze enthusiasm trend
    const enthusiasmTrend = recent[recent.length - 1].enthusiasm - recent[0].enthusiasm;
    
    // Predict shift
    if (Math.abs(warmthTrend) < 5 && Math.abs(enthusiasmTrend) < 5) {
      this.state.predictedState.nextToneShift = 'stable';
      this.state.predictedState.confidenceInterval = 80;
    } else if (warmthTrend > 0 && enthusiasmTrend > 0) {
      this.state.predictedState.nextToneShift = 'warming';
      this.state.predictedState.confidenceInterval = 70;
    } else if (warmthTrend < 0 && enthusiasmTrend < 0) {
      this.state.predictedState.nextToneShift = 'cooling';
      this.state.predictedState.confidenceInterval = 70;
    } else if (enthusiasmTrend > 0) {
      this.state.predictedState.nextToneShift = 'energizing';
      this.state.predictedState.confidenceInterval = 65;
    } else if (enthusiasmTrend < 0) {
      this.state.predictedState.nextToneShift = 'calming';
      this.state.predictedState.confidenceInterval = 65;
    } else {
      this.state.predictedState.nextToneShift = 'stable';
      this.state.predictedState.confidenceInterval = 60;
    }
  }

  /**
   * Record tone history
   */
  private recordToneHistory(): void {
    this.toneHistory.push({
      timestamp: Date.now(),
      warmth: this.state.toneProfile.warmth,
      formality: this.state.toneProfile.formality,
      enthusiasm: this.state.toneProfile.enthusiasm,
      assertiveness: this.state.toneProfile.assertiveness,
    });
    
    if (this.toneHistory.length > this.MAX_HISTORY) {
      this.toneHistory.shift();
    }
  }

  /**
   * Record trait history
   */
  private recordTraitHistory(): void {
    this.traitHistory.push({
      timestamp: Date.now(),
      traits: { ...this.state.coreTraits },
    });
    
    if (this.traitHistory.length > this.MAX_HISTORY) {
      this.traitHistory.shift();
    }
  }

  /**
   * Update (recalculate all metrics)
   */
  update(): void {
    this.calculateContinuityConfidence();
    this.predictNextToneShift();
    this.state.timestamp = Date.now();
  }

  /**
   * Get damped value (apply dampening to external input)
   */
  getDampedValue(input: number, currentValue: number, dampingType: 'emotional' | 'cognitive' | 'identity'): number {
    let damping = 0;
    if (dampingType === 'emotional') damping = this.state.changeDampening.emotionalDamping / 100;
    else if (dampingType === 'cognitive') damping = this.state.changeDampening.cognitiveDamping / 100;
    else damping = this.state.changeDampening.identityDamping / 100;
    
    const delta = (input - currentValue) * (1 - damping);
    return currentValue + delta;
  }

  /**
   * Get current state
   */
  getState(): ContinuityState {
    return { ...this.state };
  }

  /**
   * Get state summary
   */
  getSummary(): {
    continuity: string;
    tone: string;
    momentum: string;
    prediction: string;
  } {
    const { continuityConfidence, toneProfile, identityMomentum, predictedState } = this.state;
    
    let continuity = 'unified';
    if (continuityConfidence < 50) continuity = 'fragmented';
    else if (continuityConfidence > 85) continuity = 'seamless';
    
    const tone = `warmth:${toneProfile.warmth.toFixed(0)} formality:${toneProfile.formality.toFixed(0)} energy:${toneProfile.enthusiasm.toFixed(0)}`;
    
    let momentum = 'stable';
    if (identityMomentum.speed > 30) momentum = 'shifting rapidly';
    else if (identityMomentum.speed > 10) momentum = 'evolving';
    
    const prediction = `${predictedState.nextToneShift} (${predictedState.confidenceInterval.toFixed(0)}% confidence)`;
    
    return { continuity, tone, momentum, prediction };
  }

  /**
   * Reset to default
   */
  reset(): void {
    this.state = this.createDefaultState();
    this.toneHistory = [];
    this.traitHistory = [];
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      state: this.state,
      toneHistory: this.toneHistory,
      traitHistory: this.traitHistory,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.state = data.state;
      this.toneHistory = data.toneHistory;
      this.traitHistory = data.traitHistory;
      return true;
    } catch (error) {
      console.error('Failed to import continuity state:', error);
      return false;
    }
  }
}
