/**
 * 🌈 ADAPTIVE MOOD CLIMATE ENGINE (AMCE)
 * 
 * Combines internal emotional state + external atmospheric state
 * to create the dominant UI mood/climate.
 */

import type { EnvironmentalEmotionState, MarketFeeling, EnvironmentalEmotion } from './EnvironmentalEmotionMapper';

// Internal emotional state (from Level 7)
export interface EmotionalState {
  dominantEmotion: 'calm' | 'alert' | 'stressed' | 'excited' | 'focused' | 'uncertain' | 'anxious' | 'confused';
  emotionalIntensity: number;   // 0-100
  stability: number;            // 0-100
}

export interface MoodClimateState {
  // Fusion mood
  currentMood: FusionMood;
  fusionMood: FusionMood;       // Alias for convenience
  moodIntensity: number;        // 0-100
  moodStability: number;        // 0-100 (how stable mood is)
  
  // Visual output for UI
  visualMode: VisualMode;
  
  // Effect parameters
  clarity: number;              // 0-100 (how clear/sharp visuals are)
  glow: number;                 // 0-100 (ambient light intensity)
  pulse: number;                // 0-100 (animation speed)
  drift: number;                // 0-100 (holographic movement)
  flare: number;                // 0-100 (particle intensity)
  
  // Color scheme
  primaryHue: number;           // 0-360 degrees
  saturation: number;           // 0-100
  brightness: number;           // 0-100
  
  // Atmospheric effects
  fogDensity: number;           // 0-100
  particleDensity: number;      // 0-100
  waveFrequency: number;        // Hz
  turbulenceLevel: number;      // 0-100
}

export type FusionMood = 
  | 'crystal_state'      // Calm + Focused = Crystal clarity
  | 'edge_state'         // Alert + Focused = Sharp edges
  | 'tempest_mode'       // Stressed + Storm = Chaotic energy
  | 'hyperflight'        // Overclocked + Jetstream = Fast motion
  | 'zen_flow'           // Calm + Serene = Peaceful flow
  | 'war_mode'           // Alert + Powerful = Aggressive stance
  | 'fog_drift'          // Uncertain + Fog = Hazy uncertainty
  | 'electric_surge'     // Excited + Electric = High energy
  | 'pressure_build'     // Anxious + Tense = Building tension
  | 'harmonic_sync';     // High resonance + alignment

export interface VisualMode {
  name: string;
  description: string;
  effects: VisualEffects;
}

export type ParticleType = 'soft' | 'sharp' | 'electric' | 'magnetic' | 'plasma';
export type WaveformType = 'sine' | 'square' | 'triangle' | 'saw' | 'noise';

export interface VisualEffects {
  clarity: number;
  glow: number;
  pulseSpeed: number;
  driftAmount: number;
  flareIntensity: number;
  particleType: ParticleType;
  waveform: WaveformType;
}

export interface ColorScheme {
  hue: number;                  // 0-360
  saturation: number;           // 0-100
  brightness: number;           // 0-100
}

export interface AtmosphericEffects {
  fogDensity: number;           // 0-100
  particleDensity: number;      // 0-100
  waveFrequency: number;        // Hz
  turbulenceLevel: number;      // 0-100
}

export class AdaptiveMoodClimateEngine {
  private state: MoodClimateState;
  private history: MoodClimateState[];
  private readonly HISTORY_SIZE = 100;
  private transitionProgress: number = 0;
  private previousMood: FusionMood | null = null;

  constructor() {
    this.state = this.getDefaultState();
    this.history = [];
  }

  private getDefaultState(): MoodClimateState {
    return {
      currentMood: 'crystal_state',
      fusionMood: 'crystal_state',
      moodIntensity: 50,
      moodStability: 80,
      visualMode: this.getVisualModeForMood('crystal_state'),
      clarity: 80,
      glow: 50,
      pulse: 60,
      drift: 30,
      flare: 20,
      primaryHue: 200, // Blue
      saturation: 60,
      brightness: 70,
      fogDensity: 0,
      particleDensity: 30,
      waveFrequency: 1.0,
      turbulenceLevel: 10
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(
    internalEmotion: EmotionalState,
    environmentalEmotion: EnvironmentalEmotionState
  ): MoodClimateState {
    // Determine fusion mood from both states
    const newMood = this.determineFusionMood(internalEmotion, environmentalEmotion);

    // Handle mood transitions
    if (newMood !== this.state.currentMood) {
      this.previousMood = this.state.currentMood;
      this.transitionProgress = 0;
      this.state.currentMood = newMood;
      this.state.fusionMood = newMood; // Sync alias
    } else {
      // Increment transition progress
      this.transitionProgress = Math.min(1, this.transitionProgress + 0.05);
    }

    // Calculate mood intensity and stability
    this.calculateMoodMetrics(internalEmotion, environmentalEmotion);

    // Get visual mode for current mood
    this.state.visualMode = this.getVisualModeForMood(this.state.currentMood);

    // Calculate effect parameters
    this.calculateEffectParameters(internalEmotion, environmentalEmotion);

    // Calculate color scheme
    this.calculateColorScheme(internalEmotion, environmentalEmotion);

    // Calculate atmospheric effects
    this.calculateAtmosphericEffects(environmentalEmotion);

    // Store in history
    this.history.push({ ...this.state });
    if (this.history.length > this.HISTORY_SIZE) {
      this.history.shift();
    }

    return this.state;
  }

  // ============================================
  // FUSION MOOD DETERMINATION
  // ============================================

  private determineFusionMood(
    internal: EmotionalState,
    environmental: EnvironmentalEmotionState
  ): FusionMood {
    const internalPrimary = internal.dominantEmotion;
    const envEmotion = environmental.dominantEmotion;
    const marketFeeling = environmental.marketFeeling;
    const resonance = environmental.resonanceLevel;

    // High resonance + stable = Harmonic Sync
    if (resonance > 0.75 && internal.stability > 70) {
      return 'harmonic_sync';
    }

    // Calm + Serene = Zen Flow
    if (internalPrimary === 'calm' && marketFeeling === 'serene') {
      return 'zen_flow';
    }

    // Calm + Focused (internal) + Clear environment = Crystal State
    if (
      (internalPrimary === 'calm' || internalPrimary === 'focused') &&
      envEmotion === 'calm' &&
      environmental.calmBoost > 1.2
    ) {
      return 'crystal_state';
    }

    // Alert + Focused = Edge State
    if (
      (internalPrimary === 'alert' || internalPrimary === 'focused') &&
      envEmotion === 'alert'
    ) {
      return 'edge_state';
    }

    // Stressed + Storm/Chaos = Tempest Mode
    if (
      internalPrimary === 'stressed' &&
      (envEmotion === 'stressed' || marketFeeling === 'chaotic')
    ) {
      return 'tempest_mode';
    }

    // Overclocked + Jetstream = Hyperflight
    if (
      internalPrimary === 'excited' &&
      (envEmotion === 'overclocked' || environmental.overclockTrigger > 1.5)
    ) {
      return 'hyperflight';
    }

    // Alert + Powerful = War Mode
    if (
      internalPrimary === 'alert' &&
      marketFeeling === 'powerful'
    ) {
      return 'war_mode';
    }

    // Uncertain + Fog = Fog Drift
    if (
      (internalPrimary === 'uncertain' || internalPrimary === 'confused') &&
      (envEmotion === 'uncertain' || marketFeeling === 'uncertain')
    ) {
      return 'fog_drift';
    }

    // Excited + Electric = Electric Surge
    if (
      internalPrimary === 'excited' &&
      (marketFeeling === 'electric' || envEmotion === 'excited')
    ) {
      return 'electric_surge';
    }

    // Anxious + Tense = Pressure Build
    if (
      internalPrimary === 'anxious' &&
      (envEmotion === 'anxious' || marketFeeling === 'tense')
    ) {
      return 'pressure_build';
    }

    // Default: Crystal State
    return 'crystal_state';
  }

  // ============================================
  // VISUAL MODES
  // ============================================

  private getVisualModeForMood(mood: FusionMood): VisualMode {
    switch (mood) {
      case 'crystal_state':
        return {
          name: 'Crystal State',
          description: 'High clarity, soft glow, minimal turbulence',
          effects: {
            clarity: 95,
            glow: 40,
            pulseSpeed: 50,
            driftAmount: 20,
            flareIntensity: 10,
            particleType: 'soft',
            waveform: 'sine'
          }
        };

      case 'edge_state':
        return {
          name: 'Edge State',
          description: 'Sharp edges, quick pulses, strong holo-fields',
          effects: {
            clarity: 90,
            glow: 60,
            pulseSpeed: 80,
            driftAmount: 40,
            flareIntensity: 50,
            particleType: 'sharp',
            waveform: 'square'
          }
        };

      case 'tempest_mode':
        return {
          name: 'Tempest Mode',
          description: 'Wide-frame drift, red flares, high turbulence',
          effects: {
            clarity: 60,
            glow: 70,
            pulseSpeed: 100,
            driftAmount: 90,
            flareIntensity: 85,
            particleType: 'plasma',
            waveform: 'noise'
          }
        };

      case 'hyperflight':
        return {
          name: 'Hyperflight',
          description: 'Fast holo-mesh movement, white-hot streaks',
          effects: {
            clarity: 85,
            glow: 90,
            pulseSpeed: 120,
            driftAmount: 100,
            flareIntensity: 95,
            particleType: 'electric',
            waveform: 'saw'
          }
        };

      case 'zen_flow':
        return {
          name: 'Zen Flow',
          description: 'Peaceful flow, soft colors, gentle waves',
          effects: {
            clarity: 80,
            glow: 30,
            pulseSpeed: 40,
            driftAmount: 50,
            flareIntensity: 5,
            particleType: 'soft',
            waveform: 'sine'
          }
        };

      case 'war_mode':
        return {
          name: 'War Mode',
          description: 'Aggressive stance, sharp particles, intense glow',
          effects: {
            clarity: 100,
            glow: 80,
            pulseSpeed: 90,
            driftAmount: 30,
            flareIntensity: 70,
            particleType: 'sharp',
            waveform: 'square'
          }
        };

      case 'fog_drift':
        return {
          name: 'Fog Drift',
          description: 'Hazy uncertainty, soft edges, slow drift',
          effects: {
            clarity: 40,
            glow: 35,
            pulseSpeed: 45,
            driftAmount: 60,
            flareIntensity: 15,
            particleType: 'soft',
            waveform: 'noise'
          }
        };

      case 'electric_surge':
        return {
          name: 'Electric Surge',
          description: 'High energy, electric particles, rapid pulses',
          effects: {
            clarity: 75,
            glow: 85,
            pulseSpeed: 110,
            driftAmount: 70,
            flareIntensity: 80,
            particleType: 'electric',
            waveform: 'triangle'
          }
        };

      case 'pressure_build':
        return {
          name: 'Pressure Build',
          description: 'Building tension, increasing intensity',
          effects: {
            clarity: 70,
            glow: 55,
            pulseSpeed: 70,
            driftAmount: 45,
            flareIntensity: 40,
            particleType: 'magnetic',
            waveform: 'triangle'
          }
        };

      case 'harmonic_sync':
        return {
          name: 'Harmonic Sync',
          description: 'Perfect alignment, synchronized waves',
          effects: {
            clarity: 95,
            glow: 65,
            pulseSpeed: 60,
            driftAmount: 35,
            flareIntensity: 45,
            particleType: 'magnetic',
            waveform: 'sine'
          }
        };
    }
  }

  // ============================================
  // MOOD METRICS
  // ============================================

  private calculateMoodMetrics(
    internal: EmotionalState,
    environmental: EnvironmentalEmotionState
  ): void {
    // Intensity = combination of internal and environmental intensity
    this.state.moodIntensity = (
      internal.emotionalIntensity * 0.6 +
      environmental.emotionIntensity * 0.4
    );

    // Stability = how stable both systems are
    this.state.moodStability = (
      internal.stability * 0.6 +
      environmental.resonanceLevel * 100 * 0.4
    );
  }

  // ============================================
  // EFFECT PARAMETERS
  // ============================================

  private calculateEffectParameters(
    internal: EmotionalState,
    environmental: EnvironmentalEmotionState
  ): void {
    const effects = this.state.visualMode.effects;

    // Base values from visual mode
    let clarity = effects.clarity;
    let glow = effects.glow;
    let pulse = effects.pulseSpeed;
    let drift = effects.driftAmount;
    let flare = effects.flareIntensity;

    // Modify by environmental factors
    clarity *= environmental.resonanceLevel + 0.5; // Resonance increases clarity
    glow *= environmental.alertnessSpike / 1.5; // Alertness increases glow
    pulse *= environmental.overclockTrigger / 1.2; // Overclock increases pulse speed
    drift *= environmental.stressLoad / 1.3; // Stress increases drift
    flare *= environmental.alertnessSpike / 1.2; // Alertness increases flare

    // Modify by internal emotional intensity
    const intensityMod = 0.7 + (internal.emotionalIntensity / 200);
    glow *= intensityMod;
    pulse *= intensityMod;
    flare *= intensityMod;

    // Apply transition smoothing
    const smooth = this.transitionProgress;
    this.state.clarity = this.lerp(this.state.clarity, clarity, smooth * 0.1);
    this.state.glow = this.lerp(this.state.glow, glow, smooth * 0.15);
    this.state.pulse = this.lerp(this.state.pulse, pulse, smooth * 0.2);
    this.state.drift = this.lerp(this.state.drift, drift, smooth * 0.12);
    this.state.flare = this.lerp(this.state.flare, flare, smooth * 0.18);

    // Clamp values
    this.state.clarity = Math.max(20, Math.min(100, this.state.clarity));
    this.state.glow = Math.max(10, Math.min(100, this.state.glow));
    this.state.pulse = Math.max(30, Math.min(150, this.state.pulse));
    this.state.drift = Math.max(10, Math.min(100, this.state.drift));
    this.state.flare = Math.max(5, Math.min(100, this.state.flare));
  }

  // ============================================
  // COLOR SCHEME
  // ============================================

  private calculateColorScheme(
    internal: EmotionalState,
    environmental: EnvironmentalEmotionState
  ): void {
    // Map mood to hue
    const hueMap: Record<FusionMood, number> = {
      crystal_state: 200,    // Blue
      edge_state: 280,       // Purple
      tempest_mode: 0,       // Red
      hyperflight: 0,        // White (will be adjusted)
      zen_flow: 180,         // Cyan
      war_mode: 30,          // Gold/Orange
      fog_drift: 240,        // Blue-purple
      electric_surge: 50,    // Yellow
      pressure_build: 15,    // Orange-red
      harmonic_sync: 280     // Purple
    };

    const targetHue = hueMap[this.state.currentMood];
    
    // Smooth hue transition
    const hueDiff = ((targetHue - this.state.primaryHue + 180) % 360) - 180;
    this.state.primaryHue = (this.state.primaryHue + hueDiff * 0.1 + 360) % 360;

    // Saturation based on intensity
    this.state.saturation = 40 + this.state.moodIntensity * 0.5;

    // Brightness based on environmental factors
    this.state.brightness = 50 + environmental.calmBoost * 15 + environmental.alertnessSpike * 10;
    this.state.brightness = Math.max(40, Math.min(100, this.state.brightness));
  }

  // ============================================
  // ATMOSPHERIC EFFECTS
  // ============================================

  private calculateAtmosphericEffects(environmental: EnvironmentalEmotionState): void {
    // Fog density from environmental uncertainty
    const fogTarget = environmental.dominantEmotion === 'uncertain' ? 60 : 10;
    this.state.fogDensity = this.lerp(this.state.fogDensity, fogTarget, 0.1);

    // Particle density from market feeling
    let particleTarget = 30;
    if (environmental.marketFeeling === 'electric') particleTarget = 80;
    else if (environmental.marketFeeling === 'chaotic') particleTarget = 90;
    else if (environmental.marketFeeling === 'powerful') particleTarget = 60;
    else if (environmental.marketFeeling === 'serene') particleTarget = 20;
    
    this.state.particleDensity = this.lerp(this.state.particleDensity, particleTarget, 0.12);

    // Wave frequency from overclock trigger
    this.state.waveFrequency = 0.8 + environmental.overclockTrigger * 0.6;

    // Turbulence from stress load
    const turbulenceTarget = environmental.stressLoad * 40;
    this.state.turbulenceLevel = this.lerp(this.state.turbulenceLevel, turbulenceTarget, 0.15);
  }

  // ============================================
  // HELPERS
  // ============================================

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): MoodClimateState {
    return { ...this.state };
  }

  public getCurrentMood(): { mood: FusionMood; intensity: number; stability: number } {
    return {
      mood: this.state.currentMood,
      intensity: this.state.moodIntensity,
      stability: this.state.moodStability
    };
  }

  public getVisualParameters() {
    return {
      clarity: this.state.clarity,
      glow: this.state.glow,
      pulse: this.state.pulse,
      drift: this.state.drift,
      flare: this.state.flare,
      color: {
        hue: this.state.primaryHue,
        saturation: this.state.saturation,
        brightness: this.state.brightness
      },
      atmosphere: {
        fog: this.state.fogDensity,
        particles: this.state.particleDensity,
        waveFreq: this.state.waveFrequency,
        turbulence: this.state.turbulenceLevel
      }
    };
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.history = [];
    this.transitionProgress = 0;
    this.previousMood = null;
  }
}
