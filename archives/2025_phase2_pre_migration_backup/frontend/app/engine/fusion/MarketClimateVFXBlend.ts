/**
 * ✨ MARKET CLIMATE VFX BLEND
 * 
 * Blends Level 9's weather, flow, gravity, and storms
 * into advanced visual effects with color resonances.
 */

import type { 
  MarketWeatherState,
  FlowFieldState,
  VolumeGravityState,
  MomentumStormState
} from '../environmental';
import type { FusionMood } from './AdaptiveMoodClimateEngine';

export interface ClimateVFXState {
  // Color resonances
  blueResonance: number;        // 0-100 (calm, stable)
  purpleStability: number;      // 0-100 (focused, aligned)
  goldFrequency: number;        // 0-100 (alert, high energy)
  redMagneticFlux: number;      // 0-100 (stressed, volatile)
  whiteStreakIntensity: number; // 0-100 (overclocked, fast)
  
  // Advanced effects
  particleField: ParticleFieldConfig;
  waveDistortion: WaveConfig;
  magneticLines: MagneticLineConfig;
  streamEffect: StreamEffectConfig;
}

export interface ParticleFieldConfig {
  count: number;                // Number of particles
  type: 'soft' | 'sharp' | 'electric' | 'magnetic' | 'plasma';
  behavior: 'float' | 'orbit' | 'stream' | 'burst' | 'vortex';
  color: { r: number; g: number; b: number; a: number };
  size: number;
  speed: number;
  turbulence: number;
}

export interface WaveConfig {
  amplitude: number;            // 0-100
  frequency: number;            // Hz
  complexity: number;           // 1-10 (harmonic layers)
  distortionStrength: number;   // 0-100
}

export interface MagneticLineConfig {
  lineCount: number;            // Number of magnetic field lines
  strength: number;             // 0-100 (line visibility)
  color: { r: number; g: number; b: number; a: number };
  flowSpeed: number;            // Animation speed
  curvature: number;            // 0-100 (how curved)
}

export interface StreamEffectConfig {
  streamCount: number;          // Number of flow streams
  width: number;                // Stream width
  opacity: number;              // 0-1
  speed: number;                // Animation speed
  color: { r: number; g: number; b: number; a: number };
}

export class MarketClimateVFXBlend {
  private state: ClimateVFXState;

  constructor() {
    this.state = this.getDefaultState();
  }

  private getDefaultState(): ClimateVFXState {
    return {
      blueResonance: 50,
      purpleStability: 50,
      goldFrequency: 20,
      redMagneticFlux: 10,
      whiteStreakIntensity: 0,
      particleField: {
        count: 100,
        type: 'soft',
        behavior: 'float',
        color: { r: 100, g: 150, b: 255, a: 0.6 },
        size: 2,
        speed: 1,
        turbulence: 10
      },
      waveDistortion: {
        amplitude: 10,
        frequency: 1.0,
        complexity: 3,
        distortionStrength: 20
      },
      magneticLines: {
        lineCount: 10,
        strength: 30,
        color: { r: 150, g: 100, b: 255, a: 0.4 },
        flowSpeed: 1.0,
        curvature: 40
      },
      streamEffect: {
        streamCount: 5,
        width: 2,
        opacity: 0.5,
        speed: 1.5,
        color: { r: 100, g: 200, b: 255, a: 0.7 }
      }
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(
    weather: MarketWeatherState,
    flow: FlowFieldState,
    gravity: VolumeGravityState,
    storms: MomentumStormState,
    fusionMood: FusionMood
  ): ClimateVFXState {
    // Calculate color resonances
    this.calculateColorResonances(weather, storms, fusionMood);

    // Update particle field
    this.updateParticleField(weather, flow, storms, fusionMood);

    // Update wave distortion
    this.updateWaveDistortion(weather, storms);

    // Update magnetic lines
    this.updateMagneticLines(gravity, flow, fusionMood);

    // Update stream effects
    this.updateStreamEffects(flow, fusionMood);

    return this.state;
  }

  // ============================================
  // COLOR RESONANCES
  // ============================================

  private calculateColorResonances(
    weather: MarketWeatherState,
    storms: MomentumStormState,
    fusionMood: FusionMood
  ): void {
    // Blue Resonance: Calm conditions
    this.state.blueResonance = 
      (weather.condition === 'clear' ? 40 : 0) +
      (weather.temperature < 40 ? 30 : 0) +
      (weather.visibility > 70 ? 30 : 0) +
      (fusionMood === 'crystal_state' || fusionMood === 'zen_flow' ? 20 : 0);
    this.state.blueResonance = Math.min(100, this.state.blueResonance);

    // Purple Stability: Focused, aligned
    this.state.purpleStability =
      (fusionMood === 'edge_state' || fusionMood === 'harmonic_sync' ? 50 : 0) +
      (weather.visibility > 80 ? 30 : 0) +
      (storms.stormIntensity < 30 ? 20 : 0);
    this.state.purpleStability = Math.min(100, this.state.purpleStability);

    // Gold Frequency: Alert, high energy
    this.state.goldFrequency =
      (fusionMood === 'edge_state' || fusionMood === 'war_mode' ? 40 : 0) +
      (storms.activeStorms.length * 15) +
      (weather.severity > 50 ? 30 : 0);
    this.state.goldFrequency = Math.min(100, this.state.goldFrequency);

    // Red Magnetic Flux: Stressed, volatile
    this.state.redMagneticFlux =
      (fusionMood === 'tempest_mode' ? 60 : 0) +
      (weather.condition === 'thunderstorm' || weather.condition === 'heavy_rain' ? 30 : 0) +
      (storms.stormIntensity > 70 ? 40 : 0);
    this.state.redMagneticFlux = Math.min(100, this.state.redMagneticFlux);

    // White Streak Intensity: Overclocked, fast
    this.state.whiteStreakIntensity =
      (fusionMood === 'hyperflight' ? 80 : 0) +
      (storms.energyLevel > 80 ? 20 : 0);
    this.state.whiteStreakIntensity = Math.min(100, this.state.whiteStreakIntensity);
  }

  // ============================================
  // PARTICLE FIELD
  // ============================================

  private updateParticleField(
    weather: MarketWeatherState,
    flow: FlowFieldState,
    storms: MomentumStormState,
    fusionMood: FusionMood
  ): void {
    // Particle count based on storm activity
    this.state.particleField.count = 50 + storms.activeStorms.length * 50 + Math.floor(weather.severity);

    // Type based on mood
    if (fusionMood === 'electric_surge' || fusionMood === 'hyperflight') {
      this.state.particleField.type = 'electric';
    } else if (fusionMood === 'tempest_mode') {
      this.state.particleField.type = 'plasma';
    } else if (fusionMood === 'war_mode' || fusionMood === 'edge_state') {
      this.state.particleField.type = 'sharp';
    } else if (fusionMood === 'harmonic_sync') {
      this.state.particleField.type = 'magnetic';
    } else {
      this.state.particleField.type = 'soft';
    }

    // Behavior based on flow and storms
    if (flow.vortices.length > 0) {
      this.state.particleField.behavior = 'vortex';
    } else if (storms.activeStorms.length > 0) {
      this.state.particleField.behavior = 'burst';
    } else if (flow.dominantFlow.strength > 60) {
      this.state.particleField.behavior = 'stream';
    } else if (flow.coherence > 70) {
      this.state.particleField.behavior = 'orbit';
    } else {
      this.state.particleField.behavior = 'float';
    }

    // Speed and turbulence
    this.state.particleField.speed = 0.5 + (weather.windSpeed / 50);
    this.state.particleField.turbulence = flow.turbulence;

    // Size based on intensity
    this.state.particleField.size = 1 + (storms.stormIntensity / 50);

    // Color from resonances
    this.updateParticleColor();
  }

  private updateParticleColor(): void {
    const { blueResonance, purpleStability, goldFrequency, redMagneticFlux, whiteStreakIntensity } = this.state;

    // Blend colors based on resonances
    const r = (redMagneticFlux * 2.55 * 0.4) + (goldFrequency * 2.55 * 0.3) + (whiteStreakIntensity * 2.55 * 0.3);
    const g = (blueResonance * 1.5 * 0.3) + (purpleStability * 1.5 * 0.2) + (whiteStreakIntensity * 2.55 * 0.5);
    const b = (blueResonance * 2.55 * 0.6) + (purpleStability * 2.55 * 0.4);

    this.state.particleField.color = {
      r: Math.min(255, r),
      g: Math.min(255, g),
      b: Math.min(255, b),
      a: 0.6
    };
  }

  // ============================================
  // WAVE DISTORTION
  // ============================================

  private updateWaveDistortion(
    weather: MarketWeatherState,
    storms: MomentumStormState
  ): void {
    // Amplitude from weather severity
    this.state.waveDistortion.amplitude = 5 + (weather.severity / 2);

    // Frequency from storm energy
    this.state.waveDistortion.frequency = 0.5 + (storms.energyLevel / 50);

    // Complexity from active storms
    this.state.waveDistortion.complexity = Math.min(10, 2 + storms.activeStorms.length);

    // Distortion strength from weather turbulence
    this.state.waveDistortion.distortionStrength = weather.windSpeed;
  }

  // ============================================
  // MAGNETIC LINES
  // ============================================

  private updateMagneticLines(
    gravity: VolumeGravityState,
    flow: FlowFieldState,
    fusionMood: FusionMood
  ): void {
    // Line count from mass points
    this.state.magneticLines.lineCount = 5 + gravity.massPoints.length * 2;

    // Strength from field strength
    this.state.magneticLines.strength = gravity.fieldStrength * 0.8;

    // Flow speed from dominant flow
    this.state.magneticLines.flowSpeed = 0.5 + (flow.dominantFlow.strength / 50);

    // Curvature from distortion
    this.state.magneticLines.curvature = Math.min(100, gravity.distortion + 20);

    // Color based on mood
    if (fusionMood === 'tempest_mode') {
      this.state.magneticLines.color = { r: 255, g: 50, b: 50, a: 0.6 };
    } else if (fusionMood === 'electric_surge' || fusionMood === 'hyperflight') {
      this.state.magneticLines.color = { r: 255, g: 255, b: 255, a: 0.8 };
    } else if (fusionMood === 'war_mode') {
      this.state.magneticLines.color = { r: 255, g: 200, b: 50, a: 0.7 };
    } else {
      this.state.magneticLines.color = { r: 150, g: 100, b: 255, a: 0.5 };
    }
  }

  // ============================================
  // STREAM EFFECTS
  // ============================================

  private updateStreamEffects(
    flow: FlowFieldState,
    fusionMood: FusionMood
  ): void {
    // Stream count from active flow streams
    this.state.streamEffect.streamCount = Math.min(15, flow.streams.length + 3);

    // Width from flow strength
    this.state.streamEffect.width = 1 + (flow.dominantFlow.strength / 25);

    // Opacity from coherence
    this.state.streamEffect.opacity = 0.3 + (flow.coherence / 200);

    // Speed from dominant flow
    this.state.streamEffect.speed = 0.8 + (flow.dominantFlow.strength / 50);

    // Color based on mood + blue resonance
    const blueComponent = Math.min(255, 100 + this.state.blueResonance * 1.5);
    const greenComponent = Math.min(255, 150 + this.state.purpleStability);
    
    this.state.streamEffect.color = {
      r: fusionMood === 'tempest_mode' ? 255 : 100,
      g: greenComponent,
      b: blueComponent,
      a: this.state.streamEffect.opacity
    };
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): ClimateVFXState {
    return { ...this.state };
  }

  public getColorResonances() {
    return {
      blue: this.state.blueResonance,
      purple: this.state.purpleStability,
      gold: this.state.goldFrequency,
      red: this.state.redMagneticFlux,
      white: this.state.whiteStreakIntensity
    };
  }

  public getParticleField(): ParticleFieldConfig {
    return { ...this.state.particleField };
  }

  public getWaveDistortion(): WaveConfig {
    return { ...this.state.waveDistortion };
  }

  public getMagneticLines(): MagneticLineConfig {
    return { ...this.state.magneticLines };
  }

  public getStreamEffect(): StreamEffectConfig {
    return { ...this.state.streamEffect };
  }

  public reset(): void {
    this.state = this.getDefaultState();
  }
}
