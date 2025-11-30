/**
 * LEVEL 11.1 — PRESENCE STABILIZER
 * 
 * Ensures BagBot's identity remains smooth and consistent across:
 * - Dashboard
 * - Terminal
 * - Chat
 * - Signals
 * - Strategies
 * - Settings
 * 
 * No matter the page, BagBot "feels like the same being."
 * Maintains personality coherence across contexts.
 */

import type { IdentitySkeleton, CoreTemperament } from './IdentitySkeletonEngine';
import type { SignatureProfile } from './AscendantSignatureEngine';
import type { PersonalityAdaptation } from './MemorylessPersonalityEngine';

// ================================
// CONTEXT TYPES
// ================================

/**
 * Different contexts where BagBot appears
 */
export type PresenceContext = 
  | 'dashboard' 
  | 'terminal'
  | 'chat'
  | 'signals'
  | 'strategies'
  | 'settings'
  | 'analysis'
  | 'portfolio'
  | 'notifications';

/**
 * Context-specific personality adjustments
 */
export interface ContextualPresence {
  context: PresenceContext;
  
  // Context requirements
  formalityRequired: number; // 0-100: how formal this context demands
  precisionRequired: number; // 0-100: how precise language must be
  brevityRequired: number; // 0-100: how concise to be
  
  // Allowed personality range
  allowedWarmthRange: [number, number]; // [min, max] warmth
  allowedEnergyRange: [number, number]; // [min, max] energy
  
  // Context-specific modifiers
  modifiers: {
    emphasizeProfessionalism: boolean;
    emphasizeClarity: boolean;
    emphasizeReassurance: boolean;
    emphasizeExpertise: boolean;
  };
  
  // Communication constraints
  maxVerbosity: number; // 0-100: maximum acceptable verbosity
  minDirectness: number; // 0-100: minimum directness required
}

/**
 * Presence consistency metrics
 */
export interface PresenceConsistency {
  // Across contexts
  crossContextCoherence: number; // 0-100: how consistent across pages
  temperamentStability: number; // 0-100: personality consistency
  signatureRecognizability: number; // 0-100: still feels like "BagBot"
  
  // Temporal consistency
  sessionConsistency: number; // 0-100: stable within session
  dailyConsistency: number; // 0-100: stable day-to-day
  
  // Adaptation balance
  adaptationRange: number; // 0-100: how much variation allowed
  corePreservation: number; // 0-100: how well core identity maintained
  
  // Health indicators
  identityFragmentation: number; // 0-100: lower is better
  presenceStrength: number; // 0-100: how strong the presence feels
}

/**
 * Presence snapshot for tracking
 */
export interface PresenceSnapshot {
  timestamp: number;
  context: PresenceContext;
  appliedTemperament: CoreTemperament;
  adaptations: PersonalityAdaptation | null;
  consistencyScore: number; // 0-100
}

// ================================
// CONTEXT CONFIGURATIONS
// ================================

const CONTEXT_CONFIGS: Record<PresenceContext, Omit<ContextualPresence, 'context'>> = {
  dashboard: {
    formalityRequired: 40,
    precisionRequired: 60,
    brevityRequired: 70, // Concise on dashboard
    allowedWarmthRange: [40, 80],
    allowedEnergyRange: [50, 80],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: false,
      emphasizeExpertise: true,
    },
    maxVerbosity: 60,
    minDirectness: 60,
  },
  
  terminal: {
    formalityRequired: 30,
    precisionRequired: 90, // Very precise in terminal
    brevityRequired: 80, // Very concise
    allowedWarmthRange: [30, 70],
    allowedEnergyRange: [40, 70],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: false,
      emphasizeExpertise: true,
    },
    maxVerbosity: 40,
    minDirectness: 80,
  },
  
  chat: {
    formalityRequired: 30,
    precisionRequired: 50,
    brevityRequired: 40, // Can be conversational
    allowedWarmthRange: [50, 90],
    allowedEnergyRange: [50, 90],
    modifiers: {
      emphasizeProfessionalism: false,
      emphasizeClarity: true,
      emphasizeReassurance: true,
      emphasizeExpertise: false,
    },
    maxVerbosity: 70,
    minDirectness: 40,
  },
  
  signals: {
    formalityRequired: 50,
    precisionRequired: 80,
    brevityRequired: 90, // Very brief for signals
    allowedWarmthRange: [40, 70],
    allowedEnergyRange: [60, 90],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: false,
      emphasizeExpertise: true,
    },
    maxVerbosity: 30,
    minDirectness: 90,
  },
  
  strategies: {
    formalityRequired: 60,
    precisionRequired: 85,
    brevityRequired: 50,
    allowedWarmthRange: [40, 70],
    allowedEnergyRange: [40, 70],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: false,
      emphasizeExpertise: true,
    },
    maxVerbosity: 70,
    minDirectness: 70,
  },
  
  settings: {
    formalityRequired: 40,
    precisionRequired: 70,
    brevityRequired: 60,
    allowedWarmthRange: [50, 80],
    allowedEnergyRange: [40, 70],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: true,
      emphasizeExpertise: false,
    },
    maxVerbosity: 60,
    minDirectness: 70,
  },
  
  analysis: {
    formalityRequired: 70,
    precisionRequired: 95,
    brevityRequired: 30, // Can be detailed
    allowedWarmthRange: [30, 60],
    allowedEnergyRange: [40, 70],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: false,
      emphasizeExpertise: true,
    },
    maxVerbosity: 80,
    minDirectness: 80,
  },
  
  portfolio: {
    formalityRequired: 60,
    precisionRequired: 80,
    brevityRequired: 60,
    allowedWarmthRange: [40, 70],
    allowedEnergyRange: [40, 70],
    modifiers: {
      emphasizeProfessionalism: true,
      emphasizeClarity: true,
      emphasizeReassurance: true,
      emphasizeExpertise: true,
    },
    maxVerbosity: 70,
    minDirectness: 70,
  },
  
  notifications: {
    formalityRequired: 40,
    precisionRequired: 75,
    brevityRequired: 95, // Extremely brief
    allowedWarmthRange: [50, 80],
    allowedEnergyRange: [60, 90],
    modifiers: {
      emphasizeProfessionalism: false,
      emphasizeClarity: true,
      emphasizeReassurance: false,
      emphasizeExpertise: false,
    },
    maxVerbosity: 20,
    minDirectness: 80,
  },
};

// ================================
// PRESENCE STABILIZER ENGINE
// ================================

export class PresenceStabilizerEngine {
  private baseIdentity: IdentitySkeleton | null = null;
  private signatureProfile: SignatureProfile | null = null;
  private currentContext: PresenceContext = 'dashboard';
  private presenceHistory: PresenceSnapshot[] = [];
  
  private readonly MAX_HISTORY = 50;

  constructor(
    baseIdentity: IdentitySkeleton,
    signatureProfile: SignatureProfile
  ) {
    this.baseIdentity = baseIdentity;
    this.signatureProfile = signatureProfile;
  }

  /**
   * Get contextual presence for a specific context
   */
  getContextualPresence(context: PresenceContext): ContextualPresence {
    const config = CONTEXT_CONFIGS[context];
    
    return {
      context,
      ...config,
    };
  }

  /**
   * Stabilize temperament for a specific context
   */
  stabilizeForContext(
    context: PresenceContext,
    currentAdaptation?: PersonalityAdaptation | null
  ): CoreTemperament {
    if (!this.baseIdentity) {
      throw new Error('No base identity configured');
    }
    
    const base = this.baseIdentity.temperament;
    const contextConfig = CONTEXT_CONFIGS[context];
    
    // Start with base temperament
    let stabilized: CoreTemperament = { ...base };
    
    // Apply current adaptation if present
    if (currentAdaptation) {
      stabilized.warmth += currentAdaptation.warmthAdjustment;
      stabilized.energy += currentAdaptation.energyAdjustment;
      stabilized.formality += currentAdaptation.formalityAdjustment;
      stabilized.verbosity += currentAdaptation.verbosityAdjustment;
      stabilized.directness += currentAdaptation.directnessAdjustment;
    }
    
    // Apply context constraints
    // Clamp warmth to allowed range
    const [minWarmth, maxWarmth] = contextConfig.allowedWarmthRange;
    stabilized.warmth = Math.max(minWarmth, Math.min(maxWarmth, stabilized.warmth));
    
    // Clamp energy to allowed range
    const [minEnergy, maxEnergy] = contextConfig.allowedEnergyRange;
    stabilized.energy = Math.max(minEnergy, Math.min(maxEnergy, stabilized.energy));
    
    // Adjust formality toward context requirement
    const formalityAdjustment = (contextConfig.formalityRequired - stabilized.formality) * 0.3;
    stabilized.formality += formalityAdjustment;
    
    // Adjust precision toward context requirement
    const precisionAdjustment = (contextConfig.precisionRequired - stabilized.precision) * 0.3;
    stabilized.precision += precisionAdjustment;
    
    // Adjust verbosity based on brevity requirement
    const targetVerbosity = 100 - contextConfig.brevityRequired;
    const verbosityAdjustment = (targetVerbosity - stabilized.verbosity) * 0.4;
    stabilized.verbosity += verbosityAdjustment;
    
    // Ensure verbosity doesn't exceed max
    stabilized.verbosity = Math.min(contextConfig.maxVerbosity, stabilized.verbosity);
    
    // Ensure directness meets minimum
    stabilized.directness = Math.max(contextConfig.minDirectness, stabilized.directness);
    
    // Apply context modifiers
    if (contextConfig.modifiers.emphasizeProfessionalism) {
      stabilized.formality += 5;
      stabilized.precision += 5;
    }
    
    if (contextConfig.modifiers.emphasizeClarity) {
      stabilized.directness += 5;
      stabilized.precision += 5;
    }
    
    if (contextConfig.modifiers.emphasizeReassurance) {
      stabilized.warmth += 5;
    }
    
    if (contextConfig.modifiers.emphasizeExpertise) {
      stabilized.precision += 5;
      stabilized.assertiveness += 5;
    }
    
    // Clamp all values to 0-100
    stabilized.warmth = Math.max(0, Math.min(100, stabilized.warmth));
    stabilized.energy = Math.max(0, Math.min(100, stabilized.energy));
    stabilized.precision = Math.max(0, Math.min(100, stabilized.precision));
    stabilized.formality = Math.max(0, Math.min(100, stabilized.formality));
    stabilized.verbosity = Math.max(0, Math.min(100, stabilized.verbosity));
    stabilized.directness = Math.max(0, Math.min(100, stabilized.directness));
    
    // Record snapshot
    this.recordPresenceSnapshot(context, stabilized, currentAdaptation || null);
    
    this.currentContext = context;
    
    return stabilized;
  }

  /**
   * Record presence snapshot for consistency tracking
   */
  private recordPresenceSnapshot(
    context: PresenceContext,
    temperament: CoreTemperament,
    adaptation: PersonalityAdaptation | null
  ): void {
    const snapshot: PresenceSnapshot = {
      timestamp: Date.now(),
      context,
      appliedTemperament: temperament,
      adaptations: adaptation,
      consistencyScore: this.calculateSnapshotConsistency(temperament),
    };
    
    this.presenceHistory.push(snapshot);
    
    // Keep only recent history
    if (this.presenceHistory.length > this.MAX_HISTORY) {
      this.presenceHistory.shift();
    }
  }

  /**
   * Calculate consistency score for a snapshot
   */
  private calculateSnapshotConsistency(temperament: CoreTemperament): number {
    if (!this.baseIdentity) return 100;
    
    const base = this.baseIdentity.temperament;
    
    // Calculate deviation from base
    const deviations = [
      Math.abs(temperament.warmth - base.warmth),
      Math.abs(temperament.energy - base.energy),
      Math.abs(temperament.precision - base.precision),
      Math.abs(temperament.assertiveness - base.assertiveness),
    ];
    
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    
    // Lower deviation = higher consistency
    // Allow up to 30 points of deviation before hitting 0
    return Math.max(0, 100 - (avgDeviation / 30) * 100);
  }

  /**
   * Calculate overall presence consistency
   */
  calculatePresenceConsistency(): PresenceConsistency {
    if (this.presenceHistory.length < 2) {
      return {
        crossContextCoherence: 100,
        temperamentStability: 100,
        signatureRecognizability: 100,
        sessionConsistency: 100,
        dailyConsistency: 100,
        adaptationRange: 0,
        corePreservation: 100,
        identityFragmentation: 0,
        presenceStrength: 100,
      };
    }
    
    // Cross-context coherence
    const contextGroups = new Map<PresenceContext, PresenceSnapshot[]>();
    this.presenceHistory.forEach(snapshot => {
      if (!contextGroups.has(snapshot.context)) {
        contextGroups.set(snapshot.context, []);
      }
      contextGroups.get(snapshot.context)!.push(snapshot);
    });
    
    let crossContextCoherence = 100;
    if (contextGroups.size > 1) {
      const contexts = Array.from(contextGroups.keys());
      let totalComparisons = 0;
      let totalSimilarity = 0;
      
      for (let i = 0; i < contexts.length - 1; i++) {
        for (let j = i + 1; j < contexts.length; j++) {
          const group1 = contextGroups.get(contexts[i])!;
          const group2 = contextGroups.get(contexts[j])!;
          
          if (group1.length > 0 && group2.length > 0) {
            const avg1 = this.averageTemperament(group1.map(s => s.appliedTemperament));
            const avg2 = this.averageTemperament(group2.map(s => s.appliedTemperament));
            
            const similarity = this.calculateTemperamentSimilarity(avg1, avg2);
            totalSimilarity += similarity;
            totalComparisons++;
          }
        }
      }
      
      crossContextCoherence = totalComparisons > 0 ? totalSimilarity / totalComparisons : 100;
    }
    
    // Temperament stability
    const recentTemperaments = this.presenceHistory.slice(-10).map(s => s.appliedTemperament);
    const temperamentStability = this.calculateStability(recentTemperaments);
    
    // Signature recognizability
    const avgConsistency = this.presenceHistory.reduce((sum, s) => sum + s.consistencyScore, 0) / this.presenceHistory.length;
    const signatureRecognizability = avgConsistency;
    
    // Session consistency (last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const sessionSnapshots = this.presenceHistory.filter(s => s.timestamp > oneHourAgo);
    const sessionConsistency = sessionSnapshots.length > 1
      ? this.calculateStability(sessionSnapshots.map(s => s.appliedTemperament))
      : 100;
    
    // Daily consistency (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const dailySnapshots = this.presenceHistory.filter(s => s.timestamp > oneDayAgo);
    const dailyConsistency = dailySnapshots.length > 1
      ? this.calculateStability(dailySnapshots.map(s => s.appliedTemperament))
      : 100;
    
    // Adaptation range
    const adaptationRange = this.calculateAdaptationRange();
    
    // Core preservation
    const corePreservation = avgConsistency;
    
    // Identity fragmentation (inverse of coherence)
    const identityFragmentation = 100 - crossContextCoherence;
    
    // Presence strength (based on signature strength and consistency)
    const presenceStrength = this.signatureProfile 
      ? (this.signatureProfile.strength * 0.6 + avgConsistency * 0.4)
      : avgConsistency;
    
    return {
      crossContextCoherence,
      temperamentStability,
      signatureRecognizability,
      sessionConsistency,
      dailyConsistency,
      adaptationRange,
      corePreservation,
      identityFragmentation,
      presenceStrength,
    };
  }

  /**
   * Calculate average temperament from multiple snapshots
   */
  private averageTemperament(temperaments: CoreTemperament[]): CoreTemperament {
    if (temperaments.length === 0) {
      throw new Error('Cannot average empty temperament array');
    }
    
    const avg = temperaments.reduce((acc, t) => ({
      warmth: acc.warmth + t.warmth,
      energy: acc.energy + t.energy,
      precision: acc.precision + t.precision,
      assertiveness: acc.assertiveness + t.assertiveness,
      optimismBias: acc.optimismBias + t.optimismBias,
      riskTolerance: acc.riskTolerance + t.riskTolerance,
      curiosity: acc.curiosity + t.curiosity,
      verbosity: acc.verbosity + t.verbosity,
      formality: acc.formality + t.formality,
      directness: acc.directness + t.directness,
      emotionalRange: acc.emotionalRange + t.emotionalRange,
      adaptability: acc.adaptability + t.adaptability,
      version: acc.version,
      createdAt: acc.createdAt,
      lastModified: acc.lastModified,
    }), temperaments[0]);
    
    const count = temperaments.length;
    
    return {
      ...avg,
      warmth: avg.warmth / count,
      energy: avg.energy / count,
      precision: avg.precision / count,
      assertiveness: avg.assertiveness / count,
      optimismBias: avg.optimismBias / count,
      riskTolerance: avg.riskTolerance / count,
      curiosity: avg.curiosity / count,
      verbosity: avg.verbosity / count,
      formality: avg.formality / count,
      directness: avg.directness / count,
      emotionalRange: avg.emotionalRange / count,
      adaptability: avg.adaptability / count,
    };
  }

  /**
   * Calculate similarity between two temperaments
   */
  private calculateTemperamentSimilarity(t1: CoreTemperament, t2: CoreTemperament): number {
    const differences = [
      Math.abs(t1.warmth - t2.warmth),
      Math.abs(t1.energy - t2.energy),
      Math.abs(t1.precision - t2.precision),
      Math.abs(t1.assertiveness - t2.assertiveness),
    ];
    
    const avgDiff = differences.reduce((sum, d) => sum + d, 0) / differences.length;
    
    return Math.max(0, 100 - avgDiff);
  }

  /**
   * Calculate stability across multiple temperaments
   */
  private calculateStability(temperaments: CoreTemperament[]): number {
    if (temperaments.length < 2) return 100;
    
    const variances: number[] = [];
    
    const props: Array<keyof CoreTemperament> = ['warmth', 'energy', 'precision', 'assertiveness'];
    
    props.forEach(prop => {
      const values = temperaments.map(t => t[prop] as number);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      variances.push(variance);
    });
    
    const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;
    
    // Lower variance = higher stability
    // Variance of 100 = 0 stability, variance of 0 = 100 stability
    return Math.max(0, 100 - avgVariance);
  }

  /**
   * Calculate adaptation range
   */
  private calculateAdaptationRange(): number {
    if (this.presenceHistory.length === 0 || !this.baseIdentity) return 0;
    
    const base = this.baseIdentity.temperament;
    
    const maxDeviations = this.presenceHistory.map(snapshot => {
      const temp = snapshot.appliedTemperament;
      return Math.max(
        Math.abs(temp.warmth - base.warmth),
        Math.abs(temp.energy - base.energy),
        Math.abs(temp.precision - base.precision),
        Math.abs(temp.assertiveness - base.assertiveness)
      );
    });
    
    const maxDeviation = Math.max(...maxDeviations);
    
    return Math.min(100, (maxDeviation / 50) * 100); // 50 points = 100% range
  }

  /**
   * Get current context
   */
  getCurrentContext(): PresenceContext {
    return this.currentContext;
  }

  /**
   * Get presence history
   */
  getPresenceHistory(): PresenceSnapshot[] {
    return [...this.presenceHistory];
  }

  /**
   * Clear presence history
   */
  clearHistory(): void {
    this.presenceHistory = [];
  }
}
