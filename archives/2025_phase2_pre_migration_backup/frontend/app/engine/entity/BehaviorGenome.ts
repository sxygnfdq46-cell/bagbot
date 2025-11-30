/**
 * LEVEL 7.4: ADAPTIVE BEHAVIOR GENOME (ABG)
 * 
 * A micro-genetic system that evolves parameters across days.
 * This gives BagBot evolution, not just memory.
 * It now changes its behavior model automatically based on how YOU change over time.
 * 
 * 7 Evolving Parameters:
 * - patience factor
 * - focus intensity
 * - ambient pulse
 * - responsiveness speed
 * - emotional elasticity
 * - visual assertiveness
 * - prediction boldness
 * 
 * These adjust slowly, like personality growth.
 * 
 * Effect: BagBot grows with you. Not instantly. Over days.
 */

import type { MemorySnapshot } from './EntityMemory';
import type { SoulLinkScores } from './SoulLinkCore';

// ============================================
// GENOME PARAMETERS
// ============================================

export interface GenomeParameters {
  patienceFactor: number;        // 0-100: How long entity waits before responding
  focusIntensity: number;        // 0-100: How concentrated attention is
  ambientPulse: number;          // 0-100: Background activity level (idle animations)
  responsivenessSpeed: number;   // 0-100: How quickly entity reacts to input
  emotionalElasticity: number;   // 0-100: How flexibly entity adapts emotions
  visualAssertiveness: number;   // 0-100: How bold/prominent visual effects are
  predictionBoldness: number;    // 0-100: How aggressive predictive UI is
}

export interface GenomeSnapshot {
  parameters: GenomeParameters;
  generation: number;           // How many evolution cycles (daily updates)
  evolutionRate: number;        // 0-1 (how fast it evolves)
  lastEvolution: number;        // Timestamp of last evolution
  stability: number;            // 0-100 (how stable parameters are)
}

export interface PersonalityProfile {
  temperament: string;          // 'calm' | 'balanced' | 'energetic'
  style: string;                // 'subtle' | 'moderate' | 'bold'
  maturity: string;             // 'emerging' | 'growing' | 'developing' | 'mature'
}

// Evolution history entry
export interface EvolutionHistory {
  timestamp: number;
  generation: number;
  parameters: GenomeParameters;
  stability: number;
}

// ============================================
// EVOLUTION FACTORS
// ============================================

export interface EvolutionInfluence {
  // From memory patterns
  userCalmness: number;         // 0-100 from emotional response
  userSpeed: number;            // 0-100 from navigation pattern
  userConsistency: number;      // 0-100 from rhythm consistency
  userEngagement: number;       // 0-100 from engagement depth
  
  // From soul-link
  bondStrength: number;         // 0-100
  alignment: number;            // 0-100
  resonance: number;            // 0-100
  
  // Time-based
  daysConnected: number;
  totalSessions: number;
}

// ============================================
// ADAPTIVE BEHAVIOR GENOME CLASS
// ============================================

export class BehaviorGenome {
  private storageKey = 'bagbot_behavior_genome_v1';
  
  // Current genome state
  private parameters: GenomeParameters = {
    patienceFactor: 50,
    focusIntensity: 50,
    ambientPulse: 50,
    responsivenessSpeed: 50,
    emotionalElasticity: 50,
    visualAssertiveness: 50,
    predictionBoldness: 50
  };
  
  private generation: number = 0;
  private evolutionRate: number = 0.05; // 5% change per evolution
  private lastEvolution: number = Date.now();
  private stability: number = 80; // Start stable
  
  // Evolution history (last 30 days)
  private evolutionHistory: Array<{
    timestamp: number;
    parameters: GenomeParameters;
    generation: number;
  }> = [];
  
  // Parameter bounds (min/max limits)
  private readonly PARAM_MIN = 10;
  private readonly PARAM_MAX = 90;
  
  // Evolution interval (24 hours)
  private readonly EVOLUTION_INTERVAL = 24 * 60 * 60 * 1000;
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Check if evolution should occur and evolve if needed
   */
  shouldEvolve(): boolean {
    const timeSinceLastEvolution = Date.now() - this.lastEvolution;
    return timeSinceLastEvolution >= this.EVOLUTION_INTERVAL;
  }
  
  /**
   * Evolve genome based on memory and soul-link
   */
  evolve(memory: MemorySnapshot, soulLink: SoulLinkScores): GenomeSnapshot {
    if (!this.shouldEvolve()) {
      return this.getSnapshot();
    }
    
    // Calculate evolution influence
    const influence = this.calculateEvolutionInfluence(memory, soulLink);
    
    // Evolve each parameter
    this.evolvePatienceFactor(influence);
    this.evolveFocusIntensity(influence);
    this.evolveAmbientPulse(influence);
    this.evolveResponsivenessSpeed(influence);
    this.evolveEmotionalElasticity(influence);
    this.evolveVisualAssertiveness(influence);
    this.evolvePredictionBoldness(influence);
    
    // Update metadata
    this.generation++;
    this.lastEvolution = Date.now();
    this.updateStability();
    
    // Record in history
    this.recordEvolution();
    
    // Save to storage
    this.saveToStorage();
    
    return this.getSnapshot();
  }
  
  /**
   * Get current genome snapshot
   */
  getSnapshot(): GenomeSnapshot {
    return {
      parameters: { ...this.parameters },
      generation: this.generation,
      evolutionRate: this.evolutionRate,
      lastEvolution: this.lastEvolution,
      stability: this.stability
    };
  }
  
  /**
   * Get evolution history (last 30 days)
   */
  getEvolutionHistory(): typeof this.evolutionHistory {
    return [...this.evolutionHistory];
  }
  
  /**
   * Get parameter trend (increasing/stable/decreasing)
   */
  getParameterTrend(param: keyof GenomeParameters): 'increasing' | 'stable' | 'decreasing' {
    if (this.evolutionHistory.length < 3) return 'stable';
    
    const recent = this.evolutionHistory.slice(-3).map(h => h.parameters[param]);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const current = this.parameters[param];
    
    if (current > avg + 5) return 'increasing';
    if (current < avg - 5) return 'decreasing';
    return 'stable';
  }
  
  /**
   * Reset genome to defaults
   */
  reset(): void {
    this.parameters = {
      patienceFactor: 50,
      focusIntensity: 50,
      ambientPulse: 50,
      responsivenessSpeed: 50,
      emotionalElasticity: 50,
      visualAssertiveness: 50,
      predictionBoldness: 50
    };
    this.generation = 0;
    this.evolutionRate = 0.05;
    this.lastEvolution = Date.now();
    this.stability = 80;
    this.evolutionHistory = [];
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // EVOLUTION INFLUENCE CALCULATION
  // ============================================
  
  private calculateEvolutionInfluence(
    memory: MemorySnapshot,
    soulLink: SoulLinkScores
  ): EvolutionInfluence {
    return {
      userCalmness: memory.emotionalResponse.calmDuringAnalysis,
      userSpeed: memory.navigationPattern.averageSpeed * 10, // Scale to 0-100
      userConsistency: memory.interactionRhythm.rhythmConsistency,
      userEngagement: memory.engagementPattern.intensityAverage,
      bondStrength: soulLink.bondStrength,
      alignment: soulLink.alignment,
      resonance: soulLink.resonance,
      daysConnected: soulLink.daysConnected,
      totalSessions: memory.totalSessions
    };
  }
  
  // ============================================
  // PARAMETER EVOLUTION
  // ============================================
  
  /**
   * Patience Factor: How long entity waits before responding
   * Increases if user is calm and consistent
   * Decreases if user is fast and erratic
   */
  private evolvePatienceFactor(influence: EvolutionInfluence): void {
    const target = (influence.userCalmness + influence.userConsistency) / 2;
    const delta = (target - this.parameters.patienceFactor) * this.evolutionRate;
    this.parameters.patienceFactor = this.clamp(
      this.parameters.patienceFactor + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  /**
   * Focus Intensity: How concentrated attention is
   * Increases with user engagement and deep focus sessions
   * Decreases with multitasking and scattered behavior
   */
  private evolveFocusIntensity(influence: EvolutionInfluence): void {
    const target = (influence.userEngagement + influence.alignment) / 2;
    const delta = (target - this.parameters.focusIntensity) * this.evolutionRate;
    this.parameters.focusIntensity = this.clamp(
      this.parameters.focusIntensity + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  /**
   * Ambient Pulse: Background activity level
   * Matches user's interaction rhythm BPM
   * Higher if user is active, lower if user is calm
   */
  private evolveAmbientPulse(influence: EvolutionInfluence): void {
    const target = (influence.userSpeed + influence.userEngagement) / 2;
    const delta = (target - this.parameters.ambientPulse) * this.evolutionRate;
    this.parameters.ambientPulse = this.clamp(
      this.parameters.ambientPulse + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  /**
   * Responsiveness Speed: How quickly entity reacts to input
   * Increases with user speed and bond strength
   * Decreases if user is slow and deliberate
   */
  private evolveResponsivenessSpeed(influence: EvolutionInfluence): void {
    const target = (influence.userSpeed + influence.bondStrength) / 2;
    const delta = (target - this.parameters.responsivenessSpeed) * this.evolutionRate;
    this.parameters.responsivenessSpeed = this.clamp(
      this.parameters.responsivenessSpeed + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  /**
   * Emotional Elasticity: How flexibly entity adapts emotions
   * Increases with resonance and alignment
   * Reflects how well entity can match user's emotional range
   */
  private evolveEmotionalElasticity(influence: EvolutionInfluence): void {
    const target = (influence.resonance + influence.alignment) / 2;
    const delta = (target - this.parameters.emotionalElasticity) * this.evolutionRate;
    this.parameters.emotionalElasticity = this.clamp(
      this.parameters.emotionalElasticity + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  /**
   * Visual Assertiveness: How bold/prominent visual effects are
   * Increases if user is engaged and bond is strong
   * Decreases if user prefers subtlety (calm, slow navigation)
   */
  private evolveVisualAssertiveness(influence: EvolutionInfluence): void {
    const assertiveness = influence.userEngagement * 0.6 + influence.bondStrength * 0.4;
    const subtlety = influence.userCalmness * 0.7; // Calm users prefer subtle
    const target = assertiveness - (subtlety * 0.3);
    
    const delta = (target - this.parameters.visualAssertiveness) * this.evolutionRate;
    this.parameters.visualAssertiveness = this.clamp(
      this.parameters.visualAssertiveness + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  /**
   * Prediction Boldness: How aggressive predictive UI is
   * Increases with consistency and alignment
   * Entity becomes more confident in predictions over time
   */
  private evolvePredictionBoldness(influence: EvolutionInfluence): void {
    const confidence = (influence.alignment + influence.userConsistency) / 2;
    const experience = Math.min(100, (influence.daysConnected / 30) * 100); // Max at 30 days
    const target = (confidence * 0.7) + (experience * 0.3);
    
    const delta = (target - this.parameters.predictionBoldness) * this.evolutionRate;
    this.parameters.predictionBoldness = this.clamp(
      this.parameters.predictionBoldness + delta,
      this.PARAM_MIN,
      this.PARAM_MAX
    );
  }
  
  // ============================================
  // STABILITY CALCULATION
  // ============================================
  
  /**
   * Update genome stability based on parameter variance
   * High variance = low stability (rapid change)
   * Low variance = high stability (mature, settled)
   */
  private updateStability(): void {
    if (this.evolutionHistory.length < 5) {
      this.stability = 80; // Default for new genomes
      return;
    }
    
    // Calculate variance across last 5 evolutions
    const recent = this.evolutionHistory.slice(-5);
    const paramKeys = Object.keys(this.parameters) as Array<keyof GenomeParameters>;
    
    let totalVariance = 0;
    paramKeys.forEach(key => {
      const values = recent.map(h => h.parameters[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      totalVariance += variance;
    });
    
    const avgVariance = totalVariance / paramKeys.length;
    
    // Convert variance to stability (inverse relationship)
    // Low variance (< 10) = high stability (> 90)
    // High variance (> 100) = low stability (< 50)
    this.stability = Math.max(50, Math.min(95, 100 - avgVariance));
  }
  
  // ============================================
  // HISTORY MANAGEMENT
  // ============================================
  
  private recordEvolution(): void {
    this.evolutionHistory.push({
      timestamp: Date.now(),
      parameters: { ...this.parameters },
      generation: this.generation
    });
    
    // Keep only last 30 evolutions (~30 days)
    if (this.evolutionHistory.length > 30) {
      this.evolutionHistory = this.evolutionHistory.slice(-30);
    }
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      const data = {
        parameters: this.parameters,
        generation: this.generation,
        evolutionRate: this.evolutionRate,
        lastEvolution: this.lastEvolution,
        stability: this.stability,
        history: this.evolutionHistory.slice(-30) // Last 30 days
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[BehaviorGenome] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.parameters = data.parameters || this.parameters;
        this.generation = data.generation || 0;
        this.evolutionRate = data.evolutionRate || 0.05;
        this.lastEvolution = data.lastEvolution || Date.now();
        this.stability = data.stability || 80;
        this.evolutionHistory = data.history || [];
      }
    } catch (error) {
      console.warn('[BehaviorGenome] Failed to load:', error);
    }
  }
  
  // ============================================
  // UTILITIES
  // ============================================
  
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Get personality profile based on current genome
   */
  getPersonalityProfile(): {
    temperament: string;
    style: string;
    maturity: string;
  } {
    const params = this.parameters;
    
    // Determine temperament (calm vs energetic)
    const temperamentScore = (params.patienceFactor + (100 - params.responsivenessSpeed)) / 2;
    let temperament = 'balanced';
    if (temperamentScore > 70) temperament = 'calm';
    else if (temperamentScore < 30) temperament = 'energetic';
    
    // Determine style (subtle vs bold)
    const styleScore = (params.visualAssertiveness + params.predictionBoldness) / 2;
    let style = 'moderate';
    if (styleScore > 70) style = 'bold';
    else if (styleScore < 30) style = 'subtle';
    
    // Determine maturity based on generation and stability
    let maturity = 'emerging';
    if (this.generation > 30 && this.stability > 85) maturity = 'mature';
    else if (this.generation > 10 && this.stability > 70) maturity = 'developing';
    else if (this.generation > 3) maturity = 'growing';
    
    return { temperament, style, maturity };
  }
}
