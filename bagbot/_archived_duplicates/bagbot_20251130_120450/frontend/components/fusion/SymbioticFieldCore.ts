/**
 * 🌐 SYMBIOTIC FIELD CORE
 * 
 * A multi-layer holographic field that blends:
 * • emotional tone
 * • atmospheric pressure
 * • visual intensity
 * • glow warmth
 * • cognitive heat
 * • reflex dampening
 * 
 * The entire UI now feels like a living atmosphere around you.
 */

import type { UserPresenceSignature, SymbioticFusionState } from './SymbioticEnvironmentLink';
import type { PresenceMapping } from './EnvironmentPresenceMapper';
import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';

// ============================================
// TYPES
// ============================================

/**
 * Field layer - each aspect of the holographic field
 */
export interface FieldLayer {
  name: string;
  intensity: number;           // 0-1 strength
  color: string;               // CSS color
  pulseRate: number;           // Hz
  blendMode: 'add' | 'multiply' | 'screen' | 'overlay';
  opacity: number;             // 0-1
}

/**
 * Complete field state
 */
export interface SymbioticFieldState {
  // Core layers
  emotionalLayer: FieldLayer;
  atmosphericLayer: FieldLayer;
  cognitiveLayer: FieldLayer;
  reflexLayer: FieldLayer;
  
  // Composite properties
  overallIntensity: number;    // 0-1
  overallWarmth: number;       // 0-1 (cool to warm)
  overallClarity: number;      // 0-1 (foggy to crystal clear)
  
  // Visual outputs
  ambientGlow: {
    color: string;
    intensity: number;
    radius: number;            // px
    softness: number;          // 0-1
  };
  
  meshProperties: {
    density: number;           // 0-1
    tension: number;           // 0-1
    breathingRate: number;     // BPM
    waveAmplitude: number;     // 0-1
  };
  
  particleField: {
    count: number;
    speed: number;
    turbulence: number;        // 0-1
    magnetism: number;         // 0-1 attraction to center
  };
  
  // Atmospheric effects
  driftStrength: number;       // 0-1
  gravityPull: number;         // -1 to 1 (up/down)
  windSpeed: number;           // 0-1
  
  timestamp: number;
}

/**
 * Field preset configurations
 */
export interface FieldPreset {
  name: string;
  description: string;
  layers: {
    emotional: Partial<FieldLayer>;
    atmospheric: Partial<FieldLayer>;
    cognitive: Partial<FieldLayer>;
    reflex: Partial<FieldLayer>;
  };
}

// ============================================
// FIELD PRESETS
// ============================================

export const FIELD_PRESETS: Record<string, FieldPreset> = {
  // Calm states
  SERENE: {
    name: 'Serene',
    description: 'Peaceful, low-intensity ambient field',
    layers: {
      emotional: { intensity: 0.3, color: '#10b981', pulseRate: 0.5, opacity: 0.4 },
      atmospheric: { intensity: 0.2, color: '#3b82f6', pulseRate: 0.3, opacity: 0.3 },
      cognitive: { intensity: 0.2, color: '#8b5cf6', pulseRate: 0.4, opacity: 0.2 },
      reflex: { intensity: 0.1, color: '#6366f1', pulseRate: 0.2, opacity: 0.1 }
    }
  },
  
  // Focused states
  FOCUSED: {
    name: 'Focused',
    description: 'Sharp, clear, heightened awareness',
    layers: {
      emotional: { intensity: 0.6, color: '#3b82f6', pulseRate: 1.2, opacity: 0.6 },
      atmospheric: { intensity: 0.5, color: '#22d3ee', pulseRate: 1.0, opacity: 0.5 },
      cognitive: { intensity: 0.8, color: '#8b5cf6', pulseRate: 1.5, opacity: 0.7 },
      reflex: { intensity: 0.7, color: '#6366f1', pulseRate: 1.3, opacity: 0.6 }
    }
  },
  
  // Excited states
  ENERGIZED: {
    name: 'Energized',
    description: 'High energy, amplified signals',
    layers: {
      emotional: { intensity: 0.8, color: '#f59e0b', pulseRate: 2.0, opacity: 0.7 },
      atmospheric: { intensity: 0.7, color: '#f97316', pulseRate: 1.8, opacity: 0.6 },
      cognitive: { intensity: 0.6, color: '#14b8a6', pulseRate: 1.7, opacity: 0.5 },
      reflex: { intensity: 0.9, color: '#06b6d4', pulseRate: 2.2, opacity: 0.7 }
    }
  },
  
  // Stressed states
  DEFENSIVE: {
    name: 'Defensive',
    description: 'Protected, filtered, clarity-focused',
    layers: {
      emotional: { intensity: 0.5, color: '#ef4444', pulseRate: 0.8, opacity: 0.4 },
      atmospheric: { intensity: 0.3, color: '#3b82f6', pulseRate: 0.6, opacity: 0.3 },
      cognitive: { intensity: 0.7, color: '#8b5cf6', pulseRate: 1.0, opacity: 0.6 },
      reflex: { intensity: 0.4, color: '#6366f1', pulseRate: 0.5, opacity: 0.3 }
    }
  },
  
  // Flow states
  FLOW: {
    name: 'Flow',
    description: 'Perfect synchronization, optimal performance',
    layers: {
      emotional: { intensity: 0.7, color: '#22d3ee', pulseRate: 1.25, opacity: 0.7 },
      atmospheric: { intensity: 0.7, color: '#3b82f6', pulseRate: 1.25, opacity: 0.7 },
      cognitive: { intensity: 0.7, color: '#8b5cf6', pulseRate: 1.25, opacity: 0.7 },
      reflex: { intensity: 0.7, color: '#6366f1', pulseRate: 1.25, opacity: 0.7 }
    }
  },
  
  // Storm states
  TURBULENT: {
    name: 'Turbulent',
    description: 'High volatility, chaotic environment',
    layers: {
      emotional: { intensity: 0.6, color: '#ef4444', pulseRate: 2.5, opacity: 0.5 },
      atmospheric: { intensity: 0.9, color: '#f97316', pulseRate: 2.8, opacity: 0.7 },
      cognitive: { intensity: 0.5, color: '#dc2626', pulseRate: 2.3, opacity: 0.4 },
      reflex: { intensity: 0.8, color: '#991b1b', pulseRate: 3.0, opacity: 0.6 }
    }
  },
  
  // Contemplative states
  ANALYTICAL: {
    name: 'Analytical',
    description: 'Deep thinking, methodical processing',
    layers: {
      emotional: { intensity: 0.4, color: '#8b5cf6', pulseRate: 0.7, opacity: 0.5 },
      atmospheric: { intensity: 0.4, color: '#6366f1', pulseRate: 0.6, opacity: 0.4 },
      cognitive: { intensity: 0.8, color: '#a855f7', pulseRate: 0.9, opacity: 0.7 },
      reflex: { intensity: 0.5, color: '#7c3aed', pulseRate: 0.8, opacity: 0.5 }
    }
  },
  
  // Rest states
  AMBIENT: {
    name: 'Ambient',
    description: 'Minimal presence, energy conservation',
    layers: {
      emotional: { intensity: 0.2, color: '#6b7280', pulseRate: 0.3, opacity: 0.2 },
      atmospheric: { intensity: 0.2, color: '#4b5563', pulseRate: 0.2, opacity: 0.2 },
      cognitive: { intensity: 0.1, color: '#374151', pulseRate: 0.2, opacity: 0.1 },
      reflex: { intensity: 0.1, color: '#1f2937', pulseRate: 0.1, opacity: 0.1 }
    }
  }
};

// ============================================
// SYMBIOTIC FIELD CORE ENGINE
// ============================================

export class SymbioticFieldCore {
  private currentFieldState: SymbioticFieldState | null = null;
  private fieldHistory: SymbioticFieldState[] = [];
  private maxHistorySize = 50;
  
  // Transition state
  private transitionProgress = 1.0; // 1.0 = fully transitioned
  private transitionDuration = 2000; // ms
  private transitionStartTime = 0;
  private previousState: SymbioticFieldState | null = null;
  
  /**
   * Generate field state from all inputs
   */
  public generateField(
    user: UserPresenceSignature,
    environment: EnvironmentalState,
    fusion: SymbioticFusionState,
    mapping: PresenceMapping
  ): SymbioticFieldState {
    // Select base preset
    const preset = this.selectPreset(user, fusion);
    
    // Build layers
    const emotionalLayer = this.buildEmotionalLayer(user, preset, mapping);
    const atmosphericLayer = this.buildAtmosphericLayer(environment, preset, mapping);
    const cognitiveLayer = this.buildCognitiveLayer(user, environment, preset, mapping);
    const reflexLayer = this.buildReflexLayer(fusion, preset, mapping);
    
    // Calculate composite properties
    const overallIntensity = this.calculateOverallIntensity([
      emotionalLayer,
      atmosphericLayer,
      cognitiveLayer,
      reflexLayer
    ]);
    
    const overallWarmth = this.calculateWarmth(user, environment);
    const overallClarity = this.calculateClarity(mapping, fusion);
    
    // Generate visual outputs
    const ambientGlow = this.generateAmbientGlow(
      emotionalLayer,
      atmosphericLayer,
      overallIntensity,
      overallWarmth
    );
    
    const meshProperties = this.generateMeshProperties(
      user,
      environment,
      fusion,
      mapping
    );
    
    const particleField = this.generateParticleField(
      environment,
      mapping,
      overallIntensity
    );
    
    // Calculate atmospheric effects
    const driftStrength = this.calculateDrift(environment, user);
    const gravityPull = this.calculateGravity(environment, mapping);
    const windSpeed = this.calculateWind(environment, fusion);
    
    // Build complete state
    const fieldState: SymbioticFieldState = {
      emotionalLayer,
      atmosphericLayer,
      cognitiveLayer,
      reflexLayer,
      overallIntensity,
      overallWarmth,
      overallClarity,
      ambientGlow,
      meshProperties,
      particleField,
      driftStrength,
      gravityPull,
      windSpeed,
      timestamp: Date.now()
    };
    
    // Handle transition
    if (this.currentFieldState && this.shouldTransition(this.currentFieldState, fieldState)) {
      this.startTransition(fieldState);
    } else {
      this.currentFieldState = fieldState;
    }
    
    // Store in history
    this.fieldHistory.push(fieldState);
    if (this.fieldHistory.length > this.maxHistorySize) {
      this.fieldHistory.shift();
    }
    
    return fieldState;
  }
  
  /**
   * Select appropriate preset based on conditions
   */
  private selectPreset(
    user: UserPresenceSignature,
    fusion: SymbioticFusionState
  ): FieldPreset {
    // Flow state
    if (fusion.inCoFlow) {
      return FIELD_PRESETS.FLOW;
    }
    
    // Energy level
    if (user.presenceStrength < 0.3) {
      return FIELD_PRESETS.AMBIENT;
    }
    
    // Emotional tone
    switch (user.emotionalTone) {
      case 'calm':
      case 'contemplative':
        return FIELD_PRESETS.SERENE;
      
      case 'confident':
        return FIELD_PRESETS.FOCUSED;
      
      case 'excited':
      case 'energized':
        return FIELD_PRESETS.ENERGIZED;
      
      case 'stressed':
      case 'anxious':
        return FIELD_PRESETS.DEFENSIVE;
      
      default:
        return FIELD_PRESETS.SERENE;
    }
  }
  
  /**
   * Build emotional layer
   */
  private buildEmotionalLayer(
    user: UserPresenceSignature,
    preset: FieldPreset,
    mapping: PresenceMapping
  ): FieldLayer {
    const base = preset.layers.emotional;
    
    return {
      name: 'emotional',
      intensity: (base.intensity || 0.5) * user.emotionalIntensity * (1 + mapping.glowAdjustment),
      color: base.color || '#6366f1',
      pulseRate: (base.pulseRate || 1.0) * (0.5 + user.emotionalIntensity * 0.5),
      blendMode: 'screen',
      opacity: (base.opacity || 0.5) * user.presenceStrength
    };
  }
  
  /**
   * Build atmospheric layer
   */
  private buildAtmosphericLayer(
    environment: EnvironmentalState,
    preset: FieldPreset,
    mapping: PresenceMapping
  ): FieldLayer {
    const base = preset.layers.atmospheric;
    const marketPressure = ((environment.storms.stormIntensity / 100) + (environment.pulse.stressIndex / 100)) / 2;
    
    return {
      name: 'atmospheric',
      intensity: (base.intensity || 0.5) * marketPressure * mapping.marketInfluenceLevel,
      color: base.color || '#3b82f6',
      pulseRate: (base.pulseRate || 1.0) * (1 + (environment.pulse.stressIndex / 100)),
      blendMode: 'add',
      opacity: (base.opacity || 0.5) * (environment.awareness / 100)
    };
  }
  
  /**
   * Build cognitive layer
   */
  private buildCognitiveLayer(
    user: UserPresenceSignature,
    environment: EnvironmentalState,
    preset: FieldPreset,
    mapping: PresenceMapping
  ): FieldLayer {
    const base = preset.layers.cognitive;
    const cognitiveLoad = (user.focusDepth + (environment.storms.stormIntensity / 100)) / 2;
    
    return {
      name: 'cognitive',
      intensity: (base.intensity || 0.5) * cognitiveLoad,
      color: base.color || '#8b5cf6',
      pulseRate: (base.pulseRate || 1.0) * (0.5 + user.focusDepth * 1.5),
      blendMode: 'overlay',
      opacity: (base.opacity || 0.5) * mapping.signalClarityBoost
    };
  }
  
  /**
   * Build reflex layer
   */
  private buildReflexLayer(
    fusion: SymbioticFusionState,
    preset: FieldPreset,
    mapping: PresenceMapping
  ): FieldLayer {
    const base = preset.layers.reflex;
    
    return {
      name: 'reflex',
      intensity: (base.intensity || 0.5) * fusion.reflexSensitivity,
      color: base.color || '#6366f1',
      pulseRate: (base.pulseRate || 1.0) * mapping.reflexSpeedMultiplier,
      blendMode: 'add',
      opacity: (base.opacity || 0.5) * (1 - fusion.defensivePosture * 0.5)
    };
  }
  
  /**
   * Calculate overall intensity
   */
  private calculateOverallIntensity(layers: FieldLayer[]): number {
    const sum = layers.reduce((acc, layer) => acc + layer.intensity * layer.opacity, 0);
    return Math.min(1, sum / layers.length);
  }
  
  /**
   * Calculate warmth (cool to warm color shift)
   */
  private calculateWarmth(
    user: UserPresenceSignature,
    environment: EnvironmentalState
  ): number {
    const userWarmth = user.emotionalTone === 'excited' || user.emotionalTone === 'energized' ? 0.7 : 0.3;
    const marketWarmth = environment.jetstream.trendStrength > 60 ? 0.6 : 0.4;
    
    return (userWarmth * 0.6 + marketWarmth * 0.4);
  }
  
  /**
   * Calculate clarity
   */
  private calculateClarity(
    mapping: PresenceMapping,
    fusion: SymbioticFusionState
  ): number {
    return mapping.signalClarityBoost * (1 - fusion.cognitiveHeat * 0.3);
  }
  
  /**
   * Generate ambient glow
   */
  private generateAmbientGlow(
    emotional: FieldLayer,
    atmospheric: FieldLayer,
    intensity: number,
    warmth: number
  ): { color: string; intensity: number; radius: number; softness: number } {
    // Blend emotional and atmospheric colors
    const color = this.blendColors(emotional.color, atmospheric.color, 0.5);
    
    return {
      color,
      intensity: intensity * 0.8,
      radius: 200 + intensity * 300,
      softness: 0.7 + warmth * 0.3
    };
  }
  
  /**
   * Generate mesh properties
   */
  private generateMeshProperties(
    user: UserPresenceSignature,
    environment: EnvironmentalState,
    fusion: SymbioticFusionState,
    mapping: PresenceMapping
  ): {
    density: number;
    tension: number;
    breathingRate: number;
    waveAmplitude: number;
  } {
    return {
      density: 0.5 + mapping.particleDensityAdjustment * 0.3,
      tension: fusion.breathingMeshTension,
      breathingRate: fusion.inCoFlow ? fusion.syncedBPM : 60 + user.emotionalIntensity * 30,
      waveAmplitude: 0.3 + (environment.flow.dominantFlow.strength / 100) * 0.4
    };
  }
  
  /**
   * Generate particle field
   */
  private generateParticleField(
    environment: EnvironmentalState,
    mapping: PresenceMapping,
    intensity: number
  ): {
    count: number;
    speed: number;
    turbulence: number;
    magnetism: number;
  } {
    const baseCount = 50;
    const densityMultiplier = 1 + mapping.particleDensityAdjustment;
    
    return {
      count: Math.floor(baseCount * densityMultiplier * intensity),
      speed: 0.5 + (environment.flow.dominantFlow.strength / 100) * 1.5,
      turbulence: environment.storms.stormIntensity / 100,
      magnetism: mapping.userAuthorityLevel
    };
  }
  
  /**
   * Calculate drift strength
   */
  private calculateDrift(
    environment: EnvironmentalState,
    user: UserPresenceSignature
  ): number {
    const marketDrift = (environment.flow.dominantFlow.strength / 100) * 0.6;
    const userDrift = (1 - user.focusDepth) * 0.4;
    
    return marketDrift + userDrift;
  }
  
  /**
   * Calculate gravity pull
   */
  private calculateGravity(
    environment: EnvironmentalState,
    mapping: PresenceMapping
  ): number {
    const baseGravity = (environment.gravity.fieldStrength / 100) *
      (environment.gravity.primaryCenter ? -1 : 1);    // User authority can counteract gravity
    const authorityModifier = mapping.userAuthorityLevel * 0.5;
    
    return baseGravity * (1 - authorityModifier);
  }
  
  /**
   * Calculate wind speed
   */
  private calculateWind(
    environment: EnvironmentalState,
    fusion: SymbioticFusionState
  ): number {
    return (environment.jetstream.trendStrength / 100) * (1 - fusion.userCalmness * 0.3);
  }
  
  /**
   * Check if transition is needed
   */
  private shouldTransition(current: SymbioticFieldState, next: SymbioticFieldState): boolean {
    const intensityDiff = Math.abs(current.overallIntensity - next.overallIntensity);
    const warmthDiff = Math.abs(current.overallWarmth - next.overallWarmth);
    
    return intensityDiff > 0.2 || warmthDiff > 0.2;
  }
  
  /**
   * Start field transition
   */
  private startTransition(targetState: SymbioticFieldState): void {
    this.previousState = this.currentFieldState;
    this.currentFieldState = targetState;
    this.transitionStartTime = Date.now();
    this.transitionProgress = 0;
  }
  
  /**
   * Get current field with transition applied
   */
  public getCurrentField(): SymbioticFieldState | null {
    if (!this.currentFieldState) return null;
    
    // Update transition progress
    if (this.transitionProgress < 1.0) {
      const elapsed = Date.now() - this.transitionStartTime;
      this.transitionProgress = Math.min(1.0, elapsed / this.transitionDuration);
    }
    
    // If still transitioning, blend states
    if (this.transitionProgress < 1.0 && this.previousState) {
      return this.blendFieldStates(
        this.previousState,
        this.currentFieldState,
        this.transitionProgress
      );
    }
    
    return this.currentFieldState;
  }
  
  /**
   * Blend two field states
   */
  private blendFieldStates(
    from: SymbioticFieldState,
    to: SymbioticFieldState,
    progress: number
  ): SymbioticFieldState {
    const lerp = (a: number, b: number) => a + (b - a) * progress;
    
    return {
      ...to,
      overallIntensity: lerp(from.overallIntensity, to.overallIntensity),
      overallWarmth: lerp(from.overallWarmth, to.overallWarmth),
      overallClarity: lerp(from.overallClarity, to.overallClarity),
      ambientGlow: {
        ...to.ambientGlow,
        intensity: lerp(from.ambientGlow.intensity, to.ambientGlow.intensity),
        radius: lerp(from.ambientGlow.radius, to.ambientGlow.radius)
      },
      meshProperties: {
        ...to.meshProperties,
        density: lerp(from.meshProperties.density, to.meshProperties.density),
        tension: lerp(from.meshProperties.tension, to.meshProperties.tension),
        breathingRate: lerp(from.meshProperties.breathingRate, to.meshProperties.breathingRate)
      },
      particleField: {
        ...to.particleField,
        count: Math.floor(lerp(from.particleField.count, to.particleField.count)),
        speed: lerp(from.particleField.speed, to.particleField.speed),
        turbulence: lerp(from.particleField.turbulence, to.particleField.turbulence)
      },
      driftStrength: lerp(from.driftStrength, to.driftStrength),
      gravityPull: lerp(from.gravityPull, to.gravityPull),
      windSpeed: lerp(from.windSpeed, to.windSpeed)
    };
  }
  
  /**
   * Blend two colors
   */
  private blendColors(color1: string, color2: string, ratio: number): string {
    // Simple hex color blending
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    
    const r = Math.floor(r1 + (r2 - r1) * ratio);
    const g = Math.floor(g1 + (g2 - g1) * ratio);
    const b = Math.floor(b1 + (b2 - b1) * ratio);
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  
  /**
   * Get field history
   */
  public getHistory(): SymbioticFieldState[] {
    return [...this.fieldHistory];
  }
}
