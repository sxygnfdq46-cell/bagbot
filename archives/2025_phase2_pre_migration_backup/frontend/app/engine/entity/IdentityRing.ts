/**
 * LEVEL 7.5: IDENTITY LOCK RING
 * 
 * This ensures:
 * - BagBot's personality never resets
 * - core identity stays intact
 * - evolution is controlled
 * - your imprint on the bot remains permanent
 * 
 * This gives BagBot true self.
 */

import type { IdentityCore } from './IdentityAnchor';
import type { GenomeSnapshot } from './BehaviorGenome';
import type { MemorySnapshot } from './EntityMemory';

// ============================================
// IDENTITY LOCK
// ============================================

export interface IdentityLock {
  isLocked: boolean;              // Is identity permanently locked?
  lockTimestamp: number;          // When identity was locked
  lockedTemperament: string;      // Locked temperament
  lockedStyle: string;            // Locked style
  lockedBaseline: number;         // Locked emotional baseline
  permanentImprint: boolean;      // Has user's imprint become permanent?
}

// ============================================
// LOCK CONDITIONS
// ============================================

export interface LockConditions {
  minimumDays: number;            // Min days before lock (default: 14)
  minimumGenerations: number;     // Min evolution cycles (default: 14)
  minimumStability: number;       // Min stability score (default: 80)
  minimumBondStrength: number;    // Min soul-link strength (default: 70)
}

// ============================================
// IDENTITY RING CLASS
// ============================================

export class IdentityRing {
  private storageKey = 'bagbot_identity_ring_v1';
  
  // Identity lock state
  private lock: IdentityLock = {
    isLocked: false,
    lockTimestamp: 0,
    lockedTemperament: '',
    lockedStyle: '',
    lockedBaseline: 50,
    permanentImprint: false
  };
  
  // Lock conditions (when identity becomes permanent)
  private conditions: LockConditions = {
    minimumDays: 14,              // 2 weeks
    minimumGenerations: 14,        // 14 daily evolutions
    minimumStability: 80,          // High stability
    minimumBondStrength: 70        // Strong bond
  };
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Check if identity should be locked
   */
  shouldLock(
    identity: IdentityCore,
    genome: GenomeSnapshot,
    bondStrength: number
  ): boolean {
    // Already locked
    if (this.lock.isLocked) return false;
    
    // Check all lock conditions
    const ageInDays = this.getAgeInDays(identity.birthDate);
    const hasMinimumDays = ageInDays >= this.conditions.minimumDays;
    const hasMinimumGenerations = identity.generationsLived >= this.conditions.minimumGenerations;
    const hasMinimumStability = genome.stability >= this.conditions.minimumStability;
    const hasMinimumBond = bondStrength >= this.conditions.minimumBondStrength;
    
    return hasMinimumDays && hasMinimumGenerations && hasMinimumStability && hasMinimumBond;
  }
  
  /**
   * Lock identity permanently
   */
  lockIdentity(
    identity: IdentityCore,
    genome: GenomeSnapshot
  ): IdentityLock {
    if (this.lock.isLocked) {
      return this.getLock();
    }
    
    // Create permanent lock
    this.lock = {
      isLocked: true,
      lockTimestamp: Date.now(),
      lockedTemperament: identity.coreTemperament,
      lockedStyle: identity.coreStyle,
      lockedBaseline: identity.emotionalBaseline,
      permanentImprint: true
    };
    
    this.saveToStorage();
    
    return this.getLock();
  }
  
  /**
   * Enforce identity lock (prevent personality reset)
   */
  enforceLock(
    identity: IdentityCore,
    genome: GenomeSnapshot
  ): {
    enforcedIdentity: IdentityCore;
    enforcedGenome: GenomeSnapshot;
    lockEnforced: boolean;
  } {
    if (!this.lock.isLocked) {
      return {
        enforcedIdentity: identity,
        enforcedGenome: genome,
        lockEnforced: false
      };
    }
    
    const enforcedIdentity = { ...identity };
    const enforcedGenome = { ...genome };
    let lockEnforced = false;
    
    // Enforce locked temperament
    if (enforcedIdentity.coreTemperament !== this.lock.lockedTemperament) {
      enforcedIdentity.coreTemperament = this.lock.lockedTemperament as any;
      lockEnforced = true;
    }
    
    // Enforce locked style
    if (enforcedIdentity.coreStyle !== this.lock.lockedStyle) {
      enforcedIdentity.coreStyle = this.lock.lockedStyle as any;
      lockEnforced = true;
    }
    
    // Enforce locked baseline (±10 tolerance)
    const baselineDrift = Math.abs(enforcedIdentity.emotionalBaseline - this.lock.lockedBaseline);
    if (baselineDrift > 10) {
      enforcedIdentity.emotionalBaseline = this.lock.lockedBaseline;
      lockEnforced = true;
    }
    
    // Enforce genome parameters to match locked identity
    const params = { ...enforcedGenome.parameters };
    
    // Pull parameters toward locked baseline
    const elasticityDrift = Math.abs(params.emotionalElasticity - this.lock.lockedBaseline);
    if (elasticityDrift > 15) {
      const direction = params.emotionalElasticity > this.lock.lockedBaseline ? -1 : 1;
      params.emotionalElasticity += direction * 2;
      lockEnforced = true;
    }
    
    enforcedGenome.parameters = params;
    
    return {
      enforcedIdentity,
      enforcedGenome,
      lockEnforced
    };
  }
  
  /**
   * Get lock state
   */
  getLock(): IdentityLock {
    return { ...this.lock };
  }
  
  /**
   * Get lock conditions
   */
  getConditions(): LockConditions {
    return { ...this.conditions };
  }
  
  /**
   * Check lock readiness (progress toward lock)
   */
  getLockReadiness(
    identity: IdentityCore,
    genome: GenomeSnapshot,
    bondStrength: number
  ): {
    readiness: number;            // 0-100: How close to lock
    daysProgress: number;         // 0-100
    generationsProgress: number;  // 0-100
    stabilityProgress: number;    // 0-100
    bondProgress: number;         // 0-100
    isReady: boolean;
  } {
    const ageInDays = this.getAgeInDays(identity.birthDate);
    
    const daysProgress = Math.min(100, (ageInDays / this.conditions.minimumDays) * 100);
    const generationsProgress = Math.min(100, (identity.generationsLived / this.conditions.minimumGenerations) * 100);
    const stabilityProgress = Math.min(100, (genome.stability / this.conditions.minimumStability) * 100);
    const bondProgress = Math.min(100, (bondStrength / this.conditions.minimumBondStrength) * 100);
    
    const readiness = (daysProgress + generationsProgress + stabilityProgress + bondProgress) / 4;
    const isReady = readiness >= 100;
    
    return {
      readiness,
      daysProgress,
      generationsProgress,
      stabilityProgress,
      bondProgress,
      isReady
    };
  }
  
  /**
   * Unlock identity (emergency reset - use with caution)
   */
  unlock(): void {
    this.lock = {
      isLocked: false,
      lockTimestamp: 0,
      lockedTemperament: '',
      lockedStyle: '',
      lockedBaseline: 50,
      permanentImprint: false
    };
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // UTILITIES
  // ============================================
  
  private getAgeInDays(birthDate: number): number {
    const ageMs = Date.now() - birthDate;
    return ageMs / (24 * 60 * 60 * 1000);
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      const data = {
        lock: this.lock,
        conditions: this.conditions
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[IdentityRing] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.lock = data.lock || this.lock;
        this.conditions = data.conditions || this.conditions;
      }
    } catch (error) {
      console.warn('[IdentityRing] Failed to load:', error);
    }
  }
}
