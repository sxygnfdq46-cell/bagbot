/**
 * LEVEL 7.5: HARMONIC DRIFT LIMITER
 * 
 * Controls:
 * - color drift
 * - aura pulse speed
 * - particle chaos
 * - glow over-saturation
 * - complexity explosion
 * 
 * Keeps visuals powerful but never overwhelming.
 */

import type { ExpressionOutput } from './ExpressionCore';
import type { GenomeSnapshot } from './BehaviorGenome';

// ============================================
// VISUAL LIMITS
// ============================================

export interface VisualLimits {
  maxColorDrift: number;          // Maximum hue rotation (degrees)
  maxPulseSpeed: number;          // Maximum animation speed (0-2)
  maxParticleChaos: number;       // Maximum particle randomness (0-1)
  maxGlowSaturation: number;      // Maximum saturation (0-1)
  maxComplexityLevel: number;     // Maximum visual complexity (0-10)
}

// ============================================
// HARMONIC STATE
// ============================================

export interface HarmonicState {
  currentColorDrift: number;      // Current hue offset (-10 to 10)
  currentPulseSpeed: number;      // Current pulse multiplier (0.5-1.5)
  currentParticleChaos: number;   // Current chaos level (0-1)
  currentGlowSaturation: number;  // Current saturation (0-1)
  currentComplexityLevel: number; // Current complexity (0-10)
  
  isHarmonic: boolean;            // Are all values within limits?
  limitationsActive: string[];    // Which limits are being enforced
}

// ============================================
// HARMONIC LIMITER CLASS
// ============================================

export class HarmonicLimiter {
  private storageKey = 'bagbot_harmonic_limiter_v1';
  
  // Default limits (never overwhelming)
  private limits: VisualLimits = {
    maxColorDrift: 15,            // ±15° max hue shift
    maxPulseSpeed: 1.8,           // 1.8x max speed
    maxParticleChaos: 0.7,        // 70% max chaos
    maxGlowSaturation: 0.85,      // 85% max saturation
    maxComplexityLevel: 7         // Level 7/10 max complexity
  };
  
  // Current state
  private state: HarmonicState = {
    currentColorDrift: 0,
    currentPulseSpeed: 1.0,
    currentParticleChaos: 0.3,
    currentGlowSaturation: 0.6,
    currentComplexityLevel: 4,
    isHarmonic: true,
    limitationsActive: []
  };
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Limit expression visuals to maintain harmony
   */
  limitExpression(
    expression: ExpressionOutput,
    genome: GenomeSnapshot
  ): {
    limitedExpression: ExpressionOutput;
    state: HarmonicState;
    corrections: string[];
  } {
    const corrections: string[] = [];
    const limited = { ...expression };
    
    // 1. Control color drift
    const colorDrift = this.calculateColorDrift(genome);
    if (Math.abs(colorDrift) > this.limits.maxColorDrift) {
      this.state.currentColorDrift = Math.sign(colorDrift) * this.limits.maxColorDrift;
      corrections.push('Limited color drift to ±15°');
    } else {
      this.state.currentColorDrift = colorDrift;
    }
    
    // 2. Control aura pulse speed
    const pulseSpeed = this.calculatePulseSpeed(genome, expression);
    if (pulseSpeed > this.limits.maxPulseSpeed) {
      this.state.currentPulseSpeed = this.limits.maxPulseSpeed;
      corrections.push('Limited pulse speed to 1.8x');
    } else {
      this.state.currentPulseSpeed = pulseSpeed;
    }
    
    // 3. Control particle chaos
    const particleChaos = this.calculateParticleChaos(genome, expression);
    if (particleChaos > this.limits.maxParticleChaos) {
      this.state.currentParticleChaos = this.limits.maxParticleChaos;
      corrections.push('Limited particle chaos to 70%');
    } else {
      this.state.currentParticleChaos = particleChaos;
    }
    
    // 4. Control glow over-saturation
    const glowSaturation = this.calculateGlowSaturation(genome, expression);
    if (glowSaturation > this.limits.maxGlowSaturation) {
      this.state.currentGlowSaturation = this.limits.maxGlowSaturation;
      
      // Apply saturation limit to expression
      limited.microGlow.intensity = Math.min(limited.microGlow.intensity, 85);
      corrections.push('Limited glow saturation to 85%');
    } else {
      this.state.currentGlowSaturation = glowSaturation;
    }
    
    // 5. Control complexity explosion
    const complexityLevel = this.calculateComplexity(genome, expression);
    if (complexityLevel > this.limits.maxComplexityLevel) {
      this.state.currentComplexityLevel = this.limits.maxComplexityLevel;
      
      // Simplify expression
      limited.ripple.resonanceLevel = Math.min(limited.ripple.resonanceLevel, 60);
      limited.attention.acknowledgementLevel = Math.min(limited.attention.acknowledgementLevel, 75);
      corrections.push('Limited visual complexity to level 7/10');
    } else {
      this.state.currentComplexityLevel = complexityLevel;
    }
    
    // Update harmonic status
    this.state.isHarmonic = corrections.length === 0;
    this.state.limitationsActive = corrections;
    
    this.saveToStorage();
    
    return {
      limitedExpression: limited,
      state: this.getState(),
      corrections
    };
  }
  
  /**
   * Get current harmonic state
   */
  getState(): HarmonicState {
    return { ...this.state };
  }
  
  /**
   * Get visual limits
   */
  getLimits(): VisualLimits {
    return { ...this.limits };
  }
  
  /**
   * Update limits (for user customization)
   */
  setLimits(newLimits: Partial<VisualLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    this.saveToStorage();
  }
  
  /**
   * Reset to default limits
   */
  reset(): void {
    this.limits = {
      maxColorDrift: 15,
      maxPulseSpeed: 1.8,
      maxParticleChaos: 0.7,
      maxGlowSaturation: 0.85,
      maxComplexityLevel: 7
    };
    
    this.state = {
      currentColorDrift: 0,
      currentPulseSpeed: 1.0,
      currentParticleChaos: 0.3,
      currentGlowSaturation: 0.6,
      currentComplexityLevel: 4,
      isHarmonic: true,
      limitationsActive: []
    };
    
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // CALCULATION METHODS
  // ============================================
  
  /**
   * Calculate color drift from genome evolution
   */
  private calculateColorDrift(genome: GenomeSnapshot): number {
    // Color drifts based on generation and emotional elasticity
    const generationDrift = (genome.generation % 30) * 0.5; // ±15° over 30 generations
    const elasticityInfluence = (genome.parameters.emotionalElasticity - 50) * 0.1;
    
    return generationDrift + elasticityInfluence - 7.5; // Center around 0
  }
  
  /**
   * Calculate aura pulse speed
   */
  private calculatePulseSpeed(genome: GenomeSnapshot, expression: ExpressionOutput): number {
    // Pulse speed from ambient pulse + mood intensity
    const genomeSpeed = genome.parameters.ambientPulse / 100;
    const moodSpeed = expression.mood.toneStrength / 100;
    
    return 0.5 + (genomeSpeed + moodSpeed) * 0.5;
  }
  
  /**
   * Calculate particle chaos level
   */
  private calculateParticleChaos(genome: GenomeSnapshot, expression: ExpressionOutput): number {
    // Chaos from responsiveness + ripple density
    const genomeVariance = genome.parameters.responsivenessSpeed / 100;
    const rippleChaos = expression.ripple.resonanceLevel / 100;
    
    return (genomeVariance + rippleChaos) / 2;
  }
  
  /**
   * Calculate glow saturation
   */
  private calculateGlowSaturation(genome: GenomeSnapshot, expression: ExpressionOutput): number {
    // Saturation from visual assertiveness + glow intensity
    const assertiveness = genome.parameters.visualAssertiveness / 100;
    const glowIntensity = expression.microGlow.intensity / 100;
    
    return (assertiveness + glowIntensity) / 2;
  }
  
  /**
   * Calculate overall visual complexity
   */
  private calculateComplexity(genome: GenomeSnapshot, expression: ExpressionOutput): number {
    // Complexity = sum of active visual systems
    let complexity = 0;
    
    // +1 for each parameter above 60
    const params = genome.parameters;
    if (params.visualAssertiveness > 60) complexity += 1;
    if (params.predictionBoldness > 60) complexity += 1;
    if (params.focusIntensity > 60) complexity += 1;
    
    // +1 for each expression system with high intensity
    if (expression.microGlow.intensity > 70) complexity += 1;
    if (expression.ripple.resonanceLevel > 60) complexity += 1;
    if (expression.mood.toneStrength > 75) complexity += 1;
    if (expression.shadow.diffusionLevel > 70) complexity += 1;
    if (expression.warmth.feedbackIntensity > 70) complexity += 1;
    if (expression.attention.acknowledgementLevel > 70) complexity += 1;
    
    // +1 for genome maturity (adds more features over time)
    if (genome.generation > 15) complexity += 1;
    
    return complexity;
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      const data = {
        limits: this.limits,
        state: this.state
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[HarmonicLimiter] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.limits = data.limits || this.limits;
        this.state = data.state || this.state;
      }
    } catch (error) {
      console.warn('[HarmonicLimiter] Failed to load:', error);
    }
  }
}
