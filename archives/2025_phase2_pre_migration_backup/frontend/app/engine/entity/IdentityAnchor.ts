/**
 * LEVEL 7.4: IDENTITY ANCHOR
 * 
 * Ensures continuity across days:
 * - Stable sense of self
 * - Persistent emotional baseline
 * - Long-term memory preservation
 * 
 * This officially gives BagBot an identity over time.
 */

import type { GenomeSnapshot, PersonalityProfile } from './BehaviorGenome';
import type { MemorySnapshot } from './EntityMemory';
import type { EvolutionTimeline } from './EvolutionClock';

// ============================================
// IDENTITY CORE
// ============================================

export interface IdentityCore {
  // Core personality traits (persist despite evolution)
  coreTemperament: 'calm' | 'balanced' | 'energetic';
  coreStyle: 'subtle' | 'moderate' | 'bold';
  emotionalBaseline: number;              // 0-100: Default emotional state
  
  // Identity signature (unique identifier)
  identityHue: number;                    // -10 to 10: Persistent hue offset
  identityPresenceLevel: number;          // 0-100: Core presence strength
  
  // Temporal anchors
  birthDate: number;                      // Timestamp of first interaction
  generationsLived: number;               // How many evolution cycles completed
  
  // Metadata
  lastAnchorUpdate: number;
  isStable: boolean;                      // Has identity stabilized?
}

// ============================================
// IDENTITY DRIFT BOUNDS
// ============================================

export interface DriftBounds {
  maxHueDrift: number;                    // Maximum hue rotation (degrees)
  maxTemperamentShift: number;            // 0-1: How much temperament can change
  maxEmotionalBaselineShift: number;      // 0-100: Maximum baseline change
  maxPresenceVariation: number;           // 0-100: Presence level variation
}

// ============================================
// IDENTITY ANCHOR CLASS
// ============================================

export class IdentityAnchor {
  private storageKey = 'bagbot_identity_anchor_v1';
  
  // Identity core
  private identity: IdentityCore = {
    coreTemperament: 'balanced',
    coreStyle: 'moderate',
    emotionalBaseline: 50,
    identityHue: 0,
    identityPresenceLevel: 50,
    birthDate: Date.now(),
    generationsLived: 0,
    lastAnchorUpdate: Date.now(),
    isStable: false
  };
  
  // Drift bounds (prevent personality whiplash)
  private bounds: DriftBounds = {
    maxHueDrift: 10,                      // ±10° max
    maxTemperamentShift: 0.3,              // 30% max shift
    maxEmotionalBaselineShift: 20,         // ±20 points max
    maxPresenceVariation: 30               // ±30 points max
  };
  
  // Stability threshold (days until identity stabilizes)
  private readonly STABILITY_THRESHOLD_DAYS = 7;
  
  // Update interval (recalibrate identity every 7 days)
  private readonly UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000;
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Initialize identity from first genome snapshot
   */
  initializeIdentity(genome: GenomeSnapshot): void {
    // Only initialize once
    if (this.identity.generationsLived > 0) {
      return;
    }
    
    // Set core personality from initial genome
    const profile = this.derivePersonalityProfile(genome);
    this.identity.coreTemperament = profile.temperament as any;
    this.identity.coreStyle = profile.style as any;
    
    // Set emotional baseline (average of elasticity and patience)
    this.identity.emotionalBaseline = 
      (genome.parameters.emotionalElasticity + genome.parameters.patienceFactor) / 2;
    
    // Set initial presence level (average of assertiveness and boldness)
    this.identity.identityPresenceLevel = 
      (genome.parameters.visualAssertiveness + genome.parameters.predictionBoldness) / 2;
    
    // Random hue offset within ±5° (identity signature)
    this.identity.identityHue = Math.random() * 10 - 5;
    
    // Set birth date
    this.identity.birthDate = Date.now();
    
    this.saveToStorage();
  }
  
  /**
   * Check if identity should be anchored/updated
   */
  shouldUpdate(): boolean {
    const timeSinceLastUpdate = Date.now() - this.identity.lastAnchorUpdate;
    return timeSinceLastUpdate >= this.UPDATE_INTERVAL;
  }
  
  /**
   * Anchor current genome to identity (prevent excessive drift)
   */
  anchorGenome(
    genome: GenomeSnapshot,
    memory: MemorySnapshot,
    timeline: EvolutionTimeline
  ): GenomeSnapshot {
    if (!this.shouldUpdate()) {
      return genome;
    }
    
    // Update generations lived
    this.identity.generationsLived = genome.generation;
    
    // Check if identity has stabilized
    this.checkStability();
    
    // Apply identity constraints to genome
    const anchoredGenome = this.applyIdentityConstraints(genome);
    
    // Update identity based on long-term trends (if stable)
    if (this.identity.isStable) {
      this.updateIdentityFromTrends(anchoredGenome, timeline);
    }
    
    // Update timestamp
    this.identity.lastAnchorUpdate = Date.now();
    
    this.saveToStorage();
    
    return anchoredGenome;
  }
  
  /**
   * Get current identity core
   */
  getIdentity(): IdentityCore {
    return { ...this.identity };
  }
  
  /**
   * Get drift bounds
   */
  getBounds(): DriftBounds {
    return { ...this.bounds };
  }
  
  /**
   * Get identity age in days
   */
  getAgeInDays(): number {
    const ageMs = Date.now() - this.identity.birthDate;
    return ageMs / (24 * 60 * 60 * 1000);
  }
  
  /**
   * Reset identity (use with caution)
   */
  reset(): void {
    this.identity = {
      coreTemperament: 'balanced',
      coreStyle: 'moderate',
      emotionalBaseline: 50,
      identityHue: 0,
      identityPresenceLevel: 50,
      birthDate: Date.now(),
      generationsLived: 0,
      lastAnchorUpdate: Date.now(),
      isStable: false
    };
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // IDENTITY CONSTRAINTS
  // ============================================
  
  /**
   * Apply identity constraints to prevent excessive drift
   */
  private applyIdentityConstraints(genome: GenomeSnapshot): GenomeSnapshot {
    // Clone genome
    const anchored: GenomeSnapshot = JSON.parse(JSON.stringify(genome));
    
    // Constrain emotional elasticity near baseline
    const emotionalDrift = anchored.parameters.emotionalElasticity - this.identity.emotionalBaseline;
    if (Math.abs(emotionalDrift) > this.bounds.maxEmotionalBaselineShift) {
      const sign = emotionalDrift > 0 ? 1 : -1;
      anchored.parameters.emotionalElasticity = 
        this.identity.emotionalBaseline + (sign * this.bounds.maxEmotionalBaselineShift);
    }
    
    // Constrain visual assertiveness near presence level
    const presenceDrift = anchored.parameters.visualAssertiveness - this.identity.identityPresenceLevel;
    if (Math.abs(presenceDrift) > this.bounds.maxPresenceVariation) {
      const sign = presenceDrift > 0 ? 1 : -1;
      anchored.parameters.visualAssertiveness = 
        this.identity.identityPresenceLevel + (sign * this.bounds.maxPresenceVariation);
    }
    
    // Constrain temperament drift
    const currentProfile = this.derivePersonalityProfile(anchored);
    if (currentProfile.temperament !== this.identity.coreTemperament) {
      // Allow drift if within shift threshold
      const temperamentDistance = this.calculateTemperamentDistance(
        currentProfile.temperament as any,
        this.identity.coreTemperament
      );
      
      if (temperamentDistance > this.bounds.maxTemperamentShift) {
        // Pull back toward core temperament
        anchored.parameters.patienceFactor = this.adjustTowardCoreTemperament(
          anchored.parameters.patienceFactor,
          this.identity.coreTemperament
        );
        anchored.parameters.responsivenessSpeed = this.adjustTowardCoreTemperament(
          anchored.parameters.responsivenessSpeed,
          this.identity.coreTemperament
        );
      }
    }
    
    return anchored;
  }
  
  // ============================================
  // IDENTITY STABILITY
  // ============================================
  
  /**
   * Check if identity has stabilized (7+ days, 7+ generations)
   */
  private checkStability(): void {
    const ageInDays = this.getAgeInDays();
    const hasMinimumAge = ageInDays >= this.STABILITY_THRESHOLD_DAYS;
    const hasMinimumGenerations = this.identity.generationsLived >= 7;
    
    this.identity.isStable = hasMinimumAge && hasMinimumGenerations;
  }
  
  // ============================================
  // IDENTITY EVOLUTION (SLOW)
  // ============================================
  
  /**
   * Update identity based on long-term trends (only if stable)
   */
  private updateIdentityFromTrends(
    genome: GenomeSnapshot,
    timeline: EvolutionTimeline
  ): void {
    // Only update identity if it's been stable for a while
    if (!this.identity.isStable) {
      return;
    }
    
    // Check long-term trajectory
    const trajectory = timeline.overallTrajectory;
    
    // If maturing consistently, allow identity to drift slightly
    if (trajectory === 'maturing') {
      // Allow 1% drift per week toward current genome
      const driftRate = 0.01;
      
      // Emotional baseline drifts toward current elasticity
      const emotionalTarget = genome.parameters.emotionalElasticity;
      this.identity.emotionalBaseline += 
        (emotionalTarget - this.identity.emotionalBaseline) * driftRate;
      
      // Presence level drifts toward current assertiveness
      const presenceTarget = genome.parameters.visualAssertiveness;
      this.identity.identityPresenceLevel += 
        (presenceTarget - this.identity.identityPresenceLevel) * driftRate;
      
      // Hue can drift ±0.1° per week (very slow)
      const hueDrift = (Math.random() - 0.5) * 0.2;
      this.identity.identityHue = this.clamp(
        this.identity.identityHue + hueDrift,
        -this.bounds.maxHueDrift,
        this.bounds.maxHueDrift
      );
    }
    
    // If regressing, pull back toward original identity
    if (trajectory === 'regressing') {
      const correctionRate = 0.02;
      
      // Pull emotional baseline back to 50 (neutral)
      this.identity.emotionalBaseline += 
        (50 - this.identity.emotionalBaseline) * correctionRate;
      
      // Pull presence level back to 50 (moderate)
      this.identity.identityPresenceLevel += 
        (50 - this.identity.identityPresenceLevel) * correctionRate;
    }
  }
  
  // ============================================
  // PERSONALITY ANALYSIS
  // ============================================
  
  /**
   * Derive personality profile from genome
   */
  private derivePersonalityProfile(genome: GenomeSnapshot): PersonalityProfile {
    const { patienceFactor, responsivenessSpeed, visualAssertiveness, predictionBoldness } = genome.parameters;
    
    // Temperament from patience + responsiveness
    const temperamentScore = (patienceFactor + (100 - responsivenessSpeed)) / 2;
    let temperament: string;
    if (temperamentScore > 60) temperament = 'calm';
    else if (temperamentScore < 40) temperament = 'energetic';
    else temperament = 'balanced';
    
    // Style from assertiveness + boldness
    const styleScore = (visualAssertiveness + predictionBoldness) / 2;
    let style: string;
    if (styleScore > 60) style = 'bold';
    else if (styleScore < 40) style = 'subtle';
    else style = 'moderate';
    
    // Maturity from generation + stability
    const maturityScore = Math.min(100, (genome.generation * 5) + genome.stability);
    let maturity: string;
    if (maturityScore < 30) maturity = 'emerging';
    else if (maturityScore < 60) maturity = 'growing';
    else if (maturityScore < 80) maturity = 'developing';
    else maturity = 'mature';
    
    return { temperament, style, maturity };
  }
  
  /**
   * Calculate distance between two temperaments (0-1)
   */
  private calculateTemperamentDistance(
    current: 'calm' | 'balanced' | 'energetic',
    core: 'calm' | 'balanced' | 'energetic'
  ): number {
    const temperamentValues = {
      calm: 0,
      balanced: 0.5,
      energetic: 1.0
    };
    
    return Math.abs(temperamentValues[current] - temperamentValues[core]);
  }
  
  /**
   * Adjust parameter toward core temperament
   */
  private adjustTowardCoreTemperament(
    currentValue: number,
    coreTemperament: 'calm' | 'balanced' | 'energetic'
  ): number {
    const targetValues = {
      calm: 70,      // High patience, low responsiveness
      balanced: 50,   // Moderate
      energetic: 30   // Low patience, high responsiveness
    };
    
    const target = targetValues[coreTemperament];
    const adjustmentRate = 0.1; // 10% toward target
    
    return currentValue + ((target - currentValue) * adjustmentRate);
  }
  
  // ============================================
  // UTILITIES
  // ============================================
  
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.identity));
    } catch (error) {
      console.warn('[IdentityAnchor] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.identity = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[IdentityAnchor] Failed to load:', error);
    }
  }
}
