/**
 * LEVEL 11.1 — ASCENDANT IDENTITY CORE
 * 
 * Central export hub for all Ascendant Identity components and types.
 * 
 * Architecture:
 * - Identity Skeleton Engine: Core personality foundation
 * - Memoryless Personality Engine: Real-time adaptation (privacy-safe)
 * - Ascendant Signature Engine: Character feel definition
 * - Presence Stabilizer Engine: Cross-context consistency
 * - Ascendant Identity Overlay: Visualization component
 */

// ================================
// IDENTITY SKELETON
// ================================

export {
  IdentitySkeletonEngine,
  type IdentitySkeleton,
  type CoreTemperament,
  type ReactionStyle,
  type ReactionPattern,
  type LinguisticSignature,
  type StabilityCurve,
  type EmotionalModulationRules,
} from './IdentitySkeletonEngine';

// ================================
// MEMORYLESS PERSONALITY
// ================================

export {
  MemorylessPersonalityEngine,
  type UserEnergyState,
  type ToneAnalysis,
  type PersonalityAdaptation,
  type AdaptationSnapshot,
} from './MemorylessPersonalityEngine';

// ================================
// ASCENDANT SIGNATURE
// ================================

export {
  AscendantSignatureEngine,
  type SignatureDimensions,
  type CharacterArchetype,
  type SignatureProfile,
} from './AscendantSignatureEngine';

// ================================
// PRESENCE STABILIZER
// ================================

export {
  PresenceStabilizerEngine,
  type PresenceContext,
  type ContextualPresence,
  type PresenceConsistency,
  type PresenceSnapshot,
} from './PresenceStabilizerEngine';

// ================================
// VISUALIZATION COMPONENT
// ================================

export {
  AscendantIdentityOverlay,
} from './AscendantIdentityOverlay';

// ================================
// FULL SYSTEM CLASS
// ================================

/**
 * Complete Ascendant Identity System
 * Orchestrates all four engines for unified personality management
 */
export class AscendantIdentitySystem {
  private skeletonEngine: import('./IdentitySkeletonEngine').IdentitySkeletonEngine;
  private personalityEngine: import('./MemorylessPersonalityEngine').MemorylessPersonalityEngine;
  private signatureEngine: import('./AscendantSignatureEngine').AscendantSignatureEngine;
  private presenceEngine: import('./PresenceStabilizerEngine').PresenceStabilizerEngine;

  constructor() {
    // Initialize skeleton
    this.skeletonEngine = new (require('./IdentitySkeletonEngine').IdentitySkeletonEngine)();
    const skeleton = this.skeletonEngine.getSkeleton();
    
    // Initialize signature
    this.signatureEngine = new (require('./AscendantSignatureEngine').AscendantSignatureEngine)();
    const signature = this.signatureEngine.generateSignature(skeleton);
    
    // Initialize personality
    this.personalityEngine = new (require('./MemorylessPersonalityEngine').MemorylessPersonalityEngine)(skeleton);
    
    // Initialize presence
    this.presenceEngine = new (require('./PresenceStabilizerEngine').PresenceStabilizerEngine)(skeleton, signature);
  }

  /**
   * Get identity skeleton engine
   */
  getSkeletonEngine() {
    return this.skeletonEngine;
  }

  /**
   * Get personality engine
   */
  getPersonalityEngine() {
    return this.personalityEngine;
  }

  /**
   * Get signature engine
   */
  getSignatureEngine() {
    return this.signatureEngine;
  }

  /**
   * Get presence engine
   */
  getPresenceEngine() {
    return this.presenceEngine;
  }

  /**
   * Process user input and adapt personality
   */
  processUserInput(input: string, context: import('./PresenceStabilizerEngine').PresenceContext = 'chat') {
    // Analyze user energy
    const userEnergy = this.personalityEngine.analyzeUserEnergy(input);
    const toneAnalysis = this.personalityEngine.analyzeTone(userEnergy);
    
    // Adapt personality
    const adaptation = this.personalityEngine.adaptToUserEnergy(userEnergy, toneAnalysis);
    
    // Stabilize for context
    const stabilized = this.presenceEngine.stabilizeForContext(context, adaptation);
    
    return {
      userEnergy,
      toneAnalysis,
      adaptation,
      stabilizedTemperament: stabilized,
    };
  }

  /**
   * Get current personality state
   */
  getCurrentState() {
    return {
      skeleton: this.skeletonEngine.getSkeleton(),
      signature: this.signatureEngine.getSignatureProfile(),
      adaptation: this.personalityEngine.getCurrentAdaptation(),
      presenceConsistency: this.presenceEngine.calculatePresenceConsistency(),
    };
  }

  /**
   * Update base temperament
   */
  updateTemperament(updates: Partial<import('./IdentitySkeletonEngine').CoreTemperament>) {
    this.skeletonEngine.updateTemperament(updates);
    const updated = this.skeletonEngine.getSkeleton();
    
    // Regenerate signature
    this.signatureEngine.generateSignature(updated);
  }

  /**
   * Reset all adaptations
   */
  resetAdaptations() {
    this.personalityEngine.resetToBase();
  }

  /**
   * Clear all history (privacy reset)
   */
  clearHistory() {
    this.personalityEngine.clearHistory();
    this.presenceEngine.clearHistory();
  }
}
