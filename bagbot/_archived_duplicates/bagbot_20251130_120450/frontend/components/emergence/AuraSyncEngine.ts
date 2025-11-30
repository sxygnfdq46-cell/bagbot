/**
 * LEVEL 11.3 — AURA SYNC ENGINE (ASE)
 * 
 * Synchronizes personality, emotion, and visual presence into unified aura.
 * Creates the "holographic projection" of BagBot's living presence.
 * 
 * Architecture:
 * - 4 aura modes: warm flux, focused glow, harmonic pulse, deep presence
 * - Real-time personality-emotion binding
 * - Color palette generation from emotional state
 * - Intensity/pulse/expansion dynamics
 * - Visual coherence maintenance
 * 
 * This creates the visual manifestation of BagBot's inner state.
 */

import type { PersonalityVector } from '../emergent/PersonalityVectorEngine';
import type { EmergenceSignature } from './EmergenceSignatureCore';
import type { EmotionalTrajectory } from './EmotionalTrajectoryEngine';
import type { ExpressionModulation } from './AdaptiveExpressionMatrix';

// ================================
// AURA TYPES
// ================================

/**
 * Aura mode
 */
export type AuraMode = 'warm-flux' | 'focused-glow' | 'harmonic-pulse' | 'deep-presence';

/**
 * Color in HSL format
 */
export interface HSLColor {
  hue: number; // 0-360
  saturation: number; // 0-100
  lightness: number; // 0-100
  alpha: number; // 0-1
}

/**
 * Visual aura configuration
 */
export interface VisualAura {
  mode: AuraMode;
  
  // Core colors
  primaryColor: HSLColor;
  secondaryColor: HSLColor;
  accentColor: HSLColor;
  
  // Dynamics
  glowIntensity: number; // 0-100
  pulseSpeed: number; // 0-100 (slower -> faster)
  expansiveness: number; // 0-100 (contracted -> expanded)
  shimmer: number; // 0-100 (static -> shimmering)
  
  // Flow properties
  flowDirection: 'outward' | 'inward' | 'circular' | 'radial';
  flowSpeed: number; // 0-100
  coherence: number; // 0-100: visual unity
  
  // Meta
  stability: number; // 0-100: how stable the aura is
  recognizability: number; // 0-100: how distinctly "BagBot"
}

/**
 * Aura binding - links internal state to visuals
 */
export interface AuraBinding {
  personality: {
    warmth: number;
    intensity: number;
    clarity: number;
  };
  emotion: {
    dominant: string;
    intensity: number;
    trajectory: string;
  };
  expression: {
    warmthMod: number;
    intensityMod: number;
    clarityMod: number;
  };
  signature: {
    frequency: number;
    amplitude: number;
    coherence: number;
  };
}

// ================================
// AURA SYNC ENGINE
// ================================

export class AuraSyncEngine {
  private aura: VisualAura;
  private binding: AuraBinding;
  private readonly SYNC_SMOOTHING = 0.2; // How much to blend changes
  
  constructor() {
    this.aura = this.createDefaultAura();
    this.binding = this.createDefaultBinding();
  }

  /**
   * Create default aura
   */
  private createDefaultAura(): VisualAura {
    return {
      mode: 'warm-flux',
      
      primaryColor: { hue: 280, saturation: 70, lightness: 60, alpha: 0.9 },
      secondaryColor: { hue: 200, saturation: 60, lightness: 65, alpha: 0.7 },
      accentColor: { hue: 320, saturation: 80, lightness: 70, alpha: 0.5 },
      
      glowIntensity: 65,
      pulseSpeed: 50,
      expansiveness: 60,
      shimmer: 40,
      
      flowDirection: 'outward',
      flowSpeed: 45,
      coherence: 85,
      
      stability: 80,
      recognizability: 85,
    };
  }

  /**
   * Create default binding
   */
  private createDefaultBinding(): AuraBinding {
    return {
      personality: {
        warmth: 70,
        intensity: 55,
        clarity: 75,
      },
      emotion: {
        dominant: 'calm',
        intensity: 50,
        trajectory: 'stable',
      },
      expression: {
        warmthMod: 70,
        intensityMod: 55,
        clarityMod: 75,
      },
      signature: {
        frequency: 65,
        amplitude: 70,
        coherence: 85,
      },
    };
  }

  /**
   * Sync with personality vector
   */
  syncPersonality(personality: PersonalityVector): void {
    // Extract key traits
    const warmth = this.calculateClusterAverage(personality, 'warmth');
    const intensity = this.calculateClusterAverage(personality, 'intensity');
    const clarity = this.calculateClusterAverage(personality, 'logic');
    
    this.binding.personality = { warmth, intensity, clarity };
    
    // Update aura from personality
    this.updateFromPersonality();
  }

  /**
   * Sync with emotional trajectory
   */
  syncEmotion(trajectory: EmotionalTrajectory): void {
    if (trajectory.points.length === 0) return;
    
    const latest = trajectory.points[trajectory.points.length - 1];
    
    this.binding.emotion = {
      dominant: latest.dominantEmotion,
      intensity: latest.intensity,
      trajectory: trajectory.currentPattern,
    };
    
    // Update aura from emotion
    this.updateFromEmotion();
  }

  /**
   * Sync with expression modulation
   */
  syncExpression(modulation: ExpressionModulation): void {
    this.binding.expression = {
      warmthMod: modulation.warmth.value,
      intensityMod: modulation.intensity.value,
      clarityMod: modulation.clarity.value,
    };
    
    // Update aura from expression
    this.updateFromExpression();
  }

  /**
   * Sync with emergence signature
   */
  syncSignature(signature: EmergenceSignature): void {
    this.binding.signature = {
      frequency: signature.resonance.baseFrequency,
      amplitude: signature.resonance.amplitude,
      coherence: signature.resonance.coherence,
    };
    
    // Update aura from signature
    this.updateFromSignature();
  }

  /**
   * Full sync - combine all inputs
   */
  fullSync(inputs: {
    personality?: PersonalityVector;
    trajectory?: EmotionalTrajectory;
    modulation?: ExpressionModulation;
    signature?: EmergenceSignature;
  }): void {
    if (inputs.personality) this.syncPersonality(inputs.personality);
    if (inputs.trajectory) this.syncEmotion(inputs.trajectory);
    if (inputs.modulation) this.syncExpression(inputs.modulation);
    if (inputs.signature) this.syncSignature(inputs.signature);
    
    // Recalculate overall coherence
    this.recalculateCoherence();
  }

  /**
   * Update aura from personality
   */
  private updateFromPersonality(): void {
    const { warmth, intensity, clarity } = this.binding.personality;
    
    // Warmth affects primary color hue (warm colors)
    const targetHue = 280 - (warmth - 50) * 1.2; // 220-340 range
    this.blendHue('primaryColor', targetHue);
    
    // Intensity affects glow intensity
    const targetGlow = 40 + intensity * 0.5;
    this.aura.glowIntensity = this.blend(this.aura.glowIntensity, targetGlow);
    
    // Clarity affects shimmer (less shimmer = more clarity)
    const targetShimmer = 80 - clarity * 0.6;
    this.aura.shimmer = this.blend(this.aura.shimmer, targetShimmer);
    
    // Intensity affects expansiveness
    const targetExpansiveness = 40 + intensity * 0.4;
    this.aura.expansiveness = this.blend(this.aura.expansiveness, targetExpansiveness);
  }

  /**
   * Update aura from emotion
   */
  private updateFromEmotion(): void {
    const { dominant, intensity, trajectory } = this.binding.emotion;
    
    // Emotion affects mode selection
    let targetMode: AuraMode = this.aura.mode;
    
    switch (dominant) {
      case 'calm':
        targetMode = 'deep-presence';
        break;
      case 'excited':
      case 'playful':
        targetMode = 'harmonic-pulse';
        break;
      case 'focused':
      case 'analytical':
        targetMode = 'focused-glow';
        break;
      case 'supportive':
        targetMode = 'warm-flux';
        break;
      case 'intense':
        targetMode = 'harmonic-pulse';
        break;
    }
    
    // Smooth mode transitions
    if (targetMode !== this.aura.mode) {
      this.aura.mode = targetMode;
      this.applyModePreset(targetMode);
    }
    
    // Emotion intensity affects pulse speed
    const targetPulse = 30 + intensity * 0.6;
    this.aura.pulseSpeed = this.blend(this.aura.pulseSpeed, targetPulse);
    
    // Trajectory affects flow
    switch (trajectory) {
      case 'rise':
        this.aura.flowDirection = 'outward';
        this.aura.flowSpeed = this.blend(this.aura.flowSpeed, 70);
        break;
      case 'fall':
        this.aura.flowDirection = 'inward';
        this.aura.flowSpeed = this.blend(this.aura.flowSpeed, 40);
        break;
      case 'focus':
        this.aura.flowDirection = 'radial';
        this.aura.flowSpeed = this.blend(this.aura.flowSpeed, 30);
        break;
      case 'flare':
        this.aura.flowDirection = 'outward';
        this.aura.flowSpeed = this.blend(this.aura.flowSpeed, 90);
        break;
      case 'harmonic':
        this.aura.flowDirection = 'circular';
        this.aura.flowSpeed = this.blend(this.aura.flowSpeed, 55);
        break;
    }
  }

  /**
   * Update aura from expression
   */
  private updateFromExpression(): void {
    const { warmthMod, intensityMod, clarityMod } = this.binding.expression;
    
    // Expression modulates saturation
    const targetSaturation = 50 + warmthMod * 0.4;
    this.aura.primaryColor.saturation = this.blend(
      this.aura.primaryColor.saturation,
      targetSaturation
    );
    
    // Intensity modulation affects glow
    const glowBoost = (intensityMod - 50) * 0.3;
    this.aura.glowIntensity = this.blend(
      this.aura.glowIntensity,
      this.aura.glowIntensity + glowBoost
    );
    
    // Clarity modulation affects alpha (more clarity = more visible)
    const targetAlpha = 0.7 + clarityMod * 0.003;
    this.aura.primaryColor.alpha = this.blend(
      this.aura.primaryColor.alpha,
      targetAlpha
    );
  }

  /**
   * Update aura from signature
   */
  private updateFromSignature(): void {
    const { frequency, amplitude, coherence } = this.binding.signature;
    
    // Frequency affects pulse speed
    const targetPulse = frequency * 0.8;
    this.aura.pulseSpeed = this.blend(this.aura.pulseSpeed, targetPulse);
    
    // Amplitude affects expansiveness
    const targetExpansiveness = amplitude * 0.8;
    this.aura.expansiveness = this.blend(this.aura.expansiveness, targetExpansiveness);
    
    // Coherence affects stability
    this.aura.stability = this.blend(this.aura.stability, coherence);
  }

  /**
   * Apply mode preset
   */
  private applyModePreset(mode: AuraMode): void {
    switch (mode) {
      case 'warm-flux':
        this.aura.primaryColor.hue = 280; // Purple
        this.aura.secondaryColor.hue = 200; // Cyan
        this.aura.accentColor.hue = 320; // Pink
        this.aura.flowDirection = 'outward';
        this.aura.shimmer = 60;
        break;
        
      case 'focused-glow':
        this.aura.primaryColor.hue = 200; // Blue
        this.aura.secondaryColor.hue = 240; // Indigo
        this.aura.accentColor.hue = 180; // Cyan
        this.aura.flowDirection = 'radial';
        this.aura.shimmer = 20;
        break;
        
      case 'harmonic-pulse':
        this.aura.primaryColor.hue = 320; // Pink
        this.aura.secondaryColor.hue = 60; // Yellow
        this.aura.accentColor.hue = 280; // Purple
        this.aura.flowDirection = 'circular';
        this.aura.shimmer = 80;
        break;
        
      case 'deep-presence':
        this.aura.primaryColor.hue = 260; // Deep purple
        this.aura.secondaryColor.hue = 290; // Violet
        this.aura.accentColor.hue = 240; // Indigo
        this.aura.flowDirection = 'inward';
        this.aura.shimmer = 30;
        break;
    }
  }

  /**
   * Calculate cluster average
   */
  private calculateClusterAverage(
    personality: PersonalityVector,
    cluster: 'warmth' | 'intensity' | 'logic'
  ): number {
    const clusters = {
      warmth: personality.warmth,
      intensity: personality.intensity,
      logic: personality.logic,
    };
    
    const traits = clusters[cluster];
    const values = Object.values(traits) as number[];
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Blend value with smoothing
   */
  private blend(current: number, target: number): number {
    return current + (target - current) * this.SYNC_SMOOTHING;
  }

  /**
   * Blend hue with wrap-around
   */
  private blendHue(colorKey: 'primaryColor' | 'secondaryColor' | 'accentColor', target: number): void {
    const current = this.aura[colorKey].hue;
    
    // Find shortest path around color wheel
    let diff = target - current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    let newHue = current + diff * this.SYNC_SMOOTHING;
    
    // Wrap to 0-360
    if (newHue < 0) newHue += 360;
    if (newHue >= 360) newHue -= 360;
    
    this.aura[colorKey].hue = newHue;
  }

  /**
   * Recalculate coherence
   */
  private recalculateCoherence(): void {
    // Measure alignment between binding components
    const personalityIntensity = this.binding.personality.intensity;
    const emotionIntensity = this.binding.emotion.intensity;
    const expressionIntensity = this.binding.expression.intensityMod;
    
    const intensityVariance = this.variance([
      personalityIntensity,
      emotionIntensity,
      expressionIntensity,
    ]);
    
    const personalityWarmth = this.binding.personality.warmth;
    const expressionWarmth = this.binding.expression.warmthMod;
    
    const warmthVariance = this.variance([personalityWarmth, expressionWarmth]);
    
    // Lower variance = higher coherence
    const avgVariance = (intensityVariance + warmthVariance) / 2;
    this.aura.coherence = Math.max(0, 100 - avgVariance * 2);
    
    // Recognizability: how "BagBot" it feels
    const defaultHue = 280;
    const hueDistance = Math.abs(this.aura.primaryColor.hue - defaultHue);
    const hueSimilarity = Math.max(0, 100 - hueDistance * 0.5);
    
    const defaultGlow = 65;
    const glowDistance = Math.abs(this.aura.glowIntensity - defaultGlow);
    const glowSimilarity = Math.max(0, 100 - glowDistance * 2);
    
    this.aura.recognizability = (hueSimilarity + glowSimilarity) / 2;
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  }

  /**
   * Get aura
   */
  getAura(): VisualAura {
    return JSON.parse(JSON.stringify(this.aura));
  }

  /**
   * Get aura CSS variables
   */
  getAuraCSS(): Record<string, string> {
    const { primaryColor, secondaryColor, accentColor } = this.aura;
    
    const toHSL = (color: HSLColor) =>
      `hsla(${color.hue}, ${color.saturation}%, ${color.lightness}%, ${color.alpha})`;
    
    return {
      '--aura-primary': toHSL(primaryColor),
      '--aura-secondary': toHSL(secondaryColor),
      '--aura-accent': toHSL(accentColor),
      '--aura-glow-intensity': `${this.aura.glowIntensity}%`,
      '--aura-pulse-speed': `${this.aura.pulseSpeed / 100 * 3}s`,
      '--aura-expansiveness': `${this.aura.expansiveness}%`,
      '--aura-shimmer': `${this.aura.shimmer}%`,
      '--aura-flow-speed': `${this.aura.flowSpeed / 100 * 5}s`,
      '--aura-coherence': `${this.aura.coherence}%`,
    };
  }

  /**
   * Get aura summary
   */
  getAuraSummary(): {
    mode: AuraMode;
    feel: string;
    colors: string;
    dynamics: string;
    coherence: number;
    recognizability: number;
  } {
    const { mode, primaryColor, glowIntensity, pulseSpeed, flowDirection } = this.aura;
    
    // Color description
    let colorName = '';
    const hue = primaryColor.hue;
    if (hue >= 320 || hue < 20) colorName = 'red/pink';
    else if (hue < 60) colorName = 'orange/yellow';
    else if (hue < 160) colorName = 'green';
    else if (hue < 260) colorName = 'blue/cyan';
    else colorName = 'purple/violet';
    
    // Feel description
    let feel = '';
    if (glowIntensity > 70) feel = 'radiant, intense';
    else if (glowIntensity > 50) feel = 'warm, present';
    else feel = 'subtle, calm';
    
    // Dynamics description
    let dynamics = '';
    if (pulseSpeed > 70) dynamics = 'fast pulse';
    else if (pulseSpeed > 40) dynamics = 'steady rhythm';
    else dynamics = 'slow breathe';
    
    dynamics += `, ${flowDirection} flow`;
    
    return {
      mode,
      feel,
      colors: colorName,
      dynamics,
      coherence: this.aura.coherence,
      recognizability: this.aura.recognizability,
    };
  }

  /**
   * Reset to default
   */
  reset(): void {
    this.aura = this.createDefaultAura();
    this.binding = this.createDefaultBinding();
  }

  /**
   * Export aura
   */
  export(): string {
    return JSON.stringify({
      aura: this.aura,
      binding: this.binding,
    });
  }

  /**
   * Import aura
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.aura = data.aura;
      this.binding = data.binding;
      return true;
    } catch (error) {
      console.error('Failed to import aura:', error);
      return false;
    }
  }
}
