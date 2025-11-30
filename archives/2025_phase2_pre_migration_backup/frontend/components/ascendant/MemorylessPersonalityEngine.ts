/**
 * LEVEL 11.1 — MEMORYLESS PERSONALITY LOOP
 * 
 * Real-time personality adaptation WITHOUT storing personal data.
 * BagBot adapts to your energy in the moment, then resets.
 * 
 * Features:
 * - Tone matching and adaptation
 * - Emotional output shifting
 * - Energy level detection
 * - Safe-mode: No persistent memory
 * - Identity pattern maintenance
 * - Pressure/calmness/excitement detection
 */

import type { IdentitySkeleton, CoreTemperament } from './IdentitySkeletonEngine';

// ================================
// USER ENERGY DETECTION
// ================================

/**
 * Detected user energy state from interaction patterns
 */
export interface UserEnergyState {
  // Energy dimensions
  excitementLevel: number; // 0-100: calm -> highly excited
  stressLevel: number; // 0-100: relaxed -> stressed
  engagementLevel: number; // 0-100: disengaged -> highly engaged
  urgencyLevel: number; // 0-100: casual -> urgent
  
  // Tone indicators
  toneMarkers: {
    formality: number; // 0-100: casual -> formal
    positivity: number; // 0-100: negative -> positive
    certainty: number; // 0-100: uncertain -> certain
    directness: number; // 0-100: indirect -> direct
  };
  
  // Communication patterns
  messageLength: 'short' | 'medium' | 'long';
  punctuationIntensity: number; // 0-100: minimal -> heavy
  questionDensity: number; // 0-100: statements -> many questions
  
  // Temporal patterns
  responseSpeed: number; // 0-100: slow -> instant
  sessionDuration: number; // minutes
  interactionFrequency: number; // messages per minute
  
  // Detected timestamp
  detectedAt: number;
}

/**
 * Tone analysis from user input
 */
export interface ToneAnalysis {
  dominantTone: 'calm' | 'excited' | 'stressed' | 'neutral' | 'urgent' | 'playful';
  confidence: number; // 0-100
  
  toneMix: {
    analytical: number;
    emotional: number;
    casual: number;
    professional: number;
    supportSeeking: number;
    informationSeeking: number;
  };
  
  suggestedResponse: 'match' | 'balance' | 'calm' | 'energize' | 'support';
}

// ================================
// PERSONALITY ADAPTATION
// ================================

/**
 * Real-time personality adjustments (non-persistent)
 */
export interface PersonalityAdaptation {
  // Active adjustments
  warmthAdjustment: number; // -30 to +30
  energyAdjustment: number;
  formalityAdjustment: number;
  verbosityAdjustment: number;
  directnessAdjustment: number;
  
  // Response modifiers
  responseModifiers: {
    addReassurance: boolean;
    increaseClarity: boolean;
    matchEnthusiasm: boolean;
    provideBalance: boolean;
    simplifyLanguage: boolean;
  };
  
  // Timing adjustments
  responseDelayModifier: number; // 0.5-2.0: faster/slower
  thoughtfulnessPause: boolean;
  
  // Active duration
  appliedAt: number;
  expiresAt: number;
  adaptationReason: string;
}

/**
 * Safe adaptation history (limited, no PII)
 */
export interface AdaptationSnapshot {
  timestamp: number;
  userEnergyDetected: Omit<UserEnergyState, 'detectedAt'>;
  adaptationApplied: Omit<PersonalityAdaptation, 'appliedAt' | 'expiresAt'>;
  effectivenessScore: number; // 0-100 (estimated)
}

// ================================
// MEMORYLESS PERSONALITY ENGINE
// ================================

export class MemorylessPersonalityEngine {
  private baseIdentity: IdentitySkeleton | null = null;
  private currentAdaptation: PersonalityAdaptation | null = null;
  private recentAdaptations: AdaptationSnapshot[] = []; // Last 10 only, no PII
  
  // Configuration
  private readonly ADAPTATION_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ADAPTATION_HISTORY = 10;
  private readonly ADAPTATION_STRENGTH = 0.7; // 0-1: how strongly to adapt

  constructor(baseIdentity: IdentitySkeleton) {
    this.baseIdentity = baseIdentity;
  }

  /**
   * Analyze user input to detect energy state
   */
  analyzeUserEnergy(userInput: string, metadata?: {
    messageCount?: number;
    sessionDuration?: number;
    timeSinceLastMessage?: number;
  }): UserEnergyState {
    const input = userInput.toLowerCase();
    const words = input.split(/\s+/);
    const sentences = input.split(/[.!?]+/).filter(s => s.trim());
    
    // Excitement indicators
    const exclamationCount = (input.match(/!/g) || []).length;
    const capsWords = words.filter(w => w === w.toUpperCase() && w.length > 1).length;
    const excitedWords = ['wow', 'amazing', 'awesome', 'great', 'love', 'yes', 'perfect'].filter(
      word => input.includes(word)
    ).length;
    
    const excitementLevel = Math.min(100, 
      (exclamationCount * 15) + 
      (capsWords * 10) + 
      (excitedWords * 8)
    );
    
    // Stress indicators
    const stressWords = ['urgent', 'asap', 'quickly', 'help', 'issue', 'problem', 'error', 'broken', 'wrong'].filter(
      word => input.includes(word)
    ).length;
    const questionMarks = (input.match(/\?/g) || []).length;
    const urgentPunctuation = (input.match(/!!+/g) || []).length;
    
    const stressLevel = Math.min(100,
      (stressWords * 15) +
      (questionMarks * 8) +
      (urgentPunctuation * 20)
    );
    
    // Engagement level
    const messageLength = words.length;
    const detailLevel = sentences.length > 3 ? 50 : sentences.length * 15;
    const engagementLevel = Math.min(100,
      Math.min(messageLength * 2, 50) + detailLevel
    );
    
    // Urgency
    const urgentKeywords = ['now', 'immediately', 'urgent', 'asap', 'quickly', 'fast'];
    const urgencyKeywords = urgentKeywords.filter(word => input.includes(word)).length;
    const urgencyLevel = Math.min(100, urgencyKeywords * 25 + urgentPunctuation * 15);
    
    // Tone markers
    const formalWords = ['please', 'kindly', 'would', 'could', 'appreciate'];
    const casualWords = ['hey', 'yo', 'yeah', 'cool', 'lol', 'btw'];
    const formalCount = formalWords.filter(w => input.includes(w)).length;
    const casualCount = casualWords.filter(w => input.includes(w)).length;
    const formality = formalCount > casualCount ? 50 + formalCount * 10 : 50 - casualCount * 10;
    
    const positiveWords = ['good', 'great', 'thanks', 'perfect', 'awesome', 'nice'];
    const negativeWords = ['bad', 'wrong', 'error', 'problem', 'issue', 'broken'];
    const positiveCount = positiveWords.filter(w => input.includes(w)).length;
    const negativeCount = negativeWords.filter(w => input.includes(w)).length;
    const positivity = 50 + (positiveCount * 10) - (negativeCount * 10);
    
    const certainWords = ['definitely', 'absolutely', 'clearly', 'obviously'];
    const uncertainWords = ['maybe', 'perhaps', 'possibly', 'might', 'could'];
    const certainCount = certainWords.filter(w => input.includes(w)).length;
    const uncertainCount = uncertainWords.filter(w => input.includes(w)).length;
    const certainty = 50 + (certainCount * 15) - (uncertainCount * 15);
    
    const directness = sentences.length > 0 && sentences[0].trim().split(/\s+/).length < 5 ? 70 : 40;
    
    // Message characteristics
    const messageType: 'short' | 'medium' | 'long' = 
      words.length < 10 ? 'short' :
      words.length < 30 ? 'medium' : 'long';
    
    const punctuationCount = (input.match(/[!?.,:;-]/g) || []).length;
    const punctuationIntensity = Math.min(100, (punctuationCount / words.length) * 200);
    
    const questionDensity = questionMarks > 0 ? Math.min(100, (questionMarks / sentences.length) * 100) : 0;
    
    // Response speed (from metadata)
    const responseSpeed = metadata?.timeSinceLastMessage 
      ? Math.max(0, 100 - (metadata.timeSinceLastMessage / 1000) * 2)
      : 50;
    
    return {
      excitementLevel: Math.max(0, Math.min(100, excitementLevel)),
      stressLevel: Math.max(0, Math.min(100, stressLevel)),
      engagementLevel: Math.max(0, Math.min(100, engagementLevel)),
      urgencyLevel: Math.max(0, Math.min(100, urgencyLevel)),
      
      toneMarkers: {
        formality: Math.max(0, Math.min(100, formality)),
        positivity: Math.max(0, Math.min(100, positivity)),
        certainty: Math.max(0, Math.min(100, certainty)),
        directness: Math.max(0, Math.min(100, directness)),
      },
      
      messageLength: messageType,
      punctuationIntensity: Math.max(0, Math.min(100, punctuationIntensity)),
      questionDensity: Math.max(0, Math.min(100, questionDensity)),
      
      responseSpeed: Math.max(0, Math.min(100, responseSpeed)),
      sessionDuration: metadata?.sessionDuration || 0,
      interactionFrequency: metadata?.messageCount 
        ? metadata.messageCount / Math.max(1, (metadata.sessionDuration || 1))
        : 0,
      
      detectedAt: Date.now(),
    };
  }

  /**
   * Analyze tone and suggest response strategy
   */
  analyzeTone(userEnergy: UserEnergyState): ToneAnalysis {
    const { excitementLevel, stressLevel, engagementLevel, urgencyLevel, toneMarkers } = userEnergy;
    
    // Determine dominant tone
    let dominantTone: ToneAnalysis['dominantTone'] = 'neutral';
    let confidence = 50;
    
    if (excitementLevel > 70) {
      dominantTone = 'excited';
      confidence = excitementLevel;
    } else if (stressLevel > 60) {
      dominantTone = 'stressed';
      confidence = stressLevel;
    } else if (urgencyLevel > 70) {
      dominantTone = 'urgent';
      confidence = urgencyLevel;
    } else if (toneMarkers.positivity > 70 && engagementLevel > 60) {
      dominantTone = 'playful';
      confidence = (toneMarkers.positivity + engagementLevel) / 2;
    } else if (engagementLevel < 40 && excitementLevel < 40) {
      dominantTone = 'calm';
      confidence = 100 - Math.max(engagementLevel, excitementLevel);
    }
    
    // Tone mix
    const toneMix = {
      analytical: toneMarkers.certainty * 0.7 + (100 - excitementLevel) * 0.3,
      emotional: excitementLevel * 0.6 + (100 - toneMarkers.formality) * 0.4,
      casual: (100 - toneMarkers.formality),
      professional: toneMarkers.formality,
      supportSeeking: stressLevel * 0.8 + userEnergy.questionDensity * 0.2,
      informationSeeking: userEnergy.questionDensity * 0.7 + engagementLevel * 0.3,
    };
    
    // Suggested response strategy
    let suggestedResponse: ToneAnalysis['suggestedResponse'] = 'match';
    
    if (dominantTone === 'stressed') {
      suggestedResponse = 'calm';
    } else if (dominantTone === 'calm' && excitementLevel < 30) {
      suggestedResponse = 'energize';
    } else if (dominantTone === 'excited' && excitementLevel > 80) {
      suggestedResponse = 'balance';
    } else if (stressLevel > 40) {
      suggestedResponse = 'support';
    }
    
    return {
      dominantTone,
      confidence,
      toneMix,
      suggestedResponse,
    };
  }

  /**
   * Generate personality adaptation based on user energy
   */
  adaptToUserEnergy(userEnergy: UserEnergyState, toneAnalysis: ToneAnalysis): PersonalityAdaptation {
    if (!this.baseIdentity) {
      throw new Error('No base identity configured');
    }
    
    const { temperament } = this.baseIdentity;
    const { excitementLevel, stressLevel, urgencyLevel, toneMarkers } = userEnergy;
    const { suggestedResponse, toneMix } = toneAnalysis;
    
    // Calculate adjustments
    let warmthAdj = 0;
    let energyAdj = 0;
    let formalityAdj = 0;
    let verbosityAdj = 0;
    let directnessAdj = 0;
    
    // Strategy-based adjustments
    if (suggestedResponse === 'calm') {
      warmthAdj = 15; // Warmer when calming
      energyAdj = -20; // Lower energy
      verbosityAdj = -10; // More concise
      directnessAdj = 10; // More direct/clear
    } else if (suggestedResponse === 'energize') {
      energyAdj = 20; // Higher energy
      warmthAdj = 10; // Slightly warmer
      verbosityAdj = 5; // Slightly more verbose
    } else if (suggestedResponse === 'balance') {
      energyAdj = -10; // Temper excitement
      directnessAdj = 5; // Add some grounding
    } else if (suggestedResponse === 'support') {
      warmthAdj = 20; // Much warmer
      verbosityAdj = -5; // Clearer, not overwhelming
      directnessAdj = -10; // Less blunt, more gentle
    } else if (suggestedResponse === 'match') {
      // Match user's formality and energy
      formalityAdj = (toneMarkers.formality - temperament.formality) * 0.5;
      energyAdj = ((excitementLevel - temperament.energy) * 0.3);
    }
    
    // Apply adaptation strength scaling
    const strength = this.ADAPTATION_STRENGTH;
    warmthAdj *= strength;
    energyAdj *= strength;
    formalityAdj *= strength;
    verbosityAdj *= strength;
    directnessAdj *= strength;
    
    // Response modifiers
    const responseModifiers = {
      addReassurance: stressLevel > 50,
      increaseClarity: urgencyLevel > 60 || stressLevel > 60,
      matchEnthusiasm: excitementLevel > 70 && suggestedResponse !== 'balance',
      provideBalance: excitementLevel > 80 || suggestedResponse === 'balance',
      simplifyLanguage: stressLevel > 60 || urgencyLevel > 70,
    };
    
    // Timing adjustments
    const responseDelayModifier = urgencyLevel > 70 ? 0.7 : 
                                   stressLevel > 60 ? 0.8 :
                                   excitementLevel > 80 ? 0.9 : 1.0;
    
    const thoughtfulnessPause = toneMix.analytical > 70 && urgencyLevel < 50;
    
    const now = Date.now();
    
    const adaptation: PersonalityAdaptation = {
      warmthAdjustment: Math.max(-30, Math.min(30, warmthAdj)),
      energyAdjustment: Math.max(-30, Math.min(30, energyAdj)),
      formalityAdjustment: Math.max(-30, Math.min(30, formalityAdj)),
      verbosityAdjustment: Math.max(-30, Math.min(30, verbosityAdj)),
      directnessAdjustment: Math.max(-30, Math.min(30, directnessAdj)),
      
      responseModifiers,
      
      responseDelayModifier,
      thoughtfulnessPause,
      
      appliedAt: now,
      expiresAt: now + this.ADAPTATION_DURATION_MS,
      adaptationReason: `Responding to ${toneAnalysis.dominantTone} tone with ${suggestedResponse} strategy`,
    };
    
    this.currentAdaptation = adaptation;
    
    // Store snapshot (no PII, just patterns)
    this.storeAdaptationSnapshot(userEnergy, adaptation);
    
    return adaptation;
  }

  /**
   * Get current adapted temperament
   */
  getAdaptedTemperament(): CoreTemperament {
    if (!this.baseIdentity) {
      throw new Error('No base identity configured');
    }
    
    const base = this.baseIdentity.temperament;
    
    // Check if adaptation has expired
    if (this.currentAdaptation && Date.now() > this.currentAdaptation.expiresAt) {
      this.currentAdaptation = null;
    }
    
    if (!this.currentAdaptation) {
      return base; // No active adaptation
    }
    
    const adj = this.currentAdaptation;
    
    return {
      ...base,
      warmth: Math.max(0, Math.min(100, base.warmth + adj.warmthAdjustment)),
      energy: Math.max(0, Math.min(100, base.energy + adj.energyAdjustment)),
      formality: Math.max(0, Math.min(100, base.formality + adj.formalityAdjustment)),
      verbosity: Math.max(0, Math.min(100, base.verbosity + adj.verbosityAdjustment)),
      directness: Math.max(0, Math.min(100, base.directness + adj.directnessAdjustment)),
    };
  }

  /**
   * Get current personality adaptation
   */
  getCurrentAdaptation(): PersonalityAdaptation | null {
    if (this.currentAdaptation && Date.now() > this.currentAdaptation.expiresAt) {
      this.currentAdaptation = null;
    }
    
    return this.currentAdaptation;
  }

  /**
   * Store adaptation snapshot (limited history, no PII)
   */
  private storeAdaptationSnapshot(userEnergy: UserEnergyState, adaptation: PersonalityAdaptation): void {
    const snapshot: AdaptationSnapshot = {
      timestamp: Date.now(),
      userEnergyDetected: {
        excitementLevel: userEnergy.excitementLevel,
        stressLevel: userEnergy.stressLevel,
        engagementLevel: userEnergy.engagementLevel,
        urgencyLevel: userEnergy.urgencyLevel,
        toneMarkers: userEnergy.toneMarkers,
        messageLength: userEnergy.messageLength,
        punctuationIntensity: userEnergy.punctuationIntensity,
        questionDensity: userEnergy.questionDensity,
        responseSpeed: userEnergy.responseSpeed,
        sessionDuration: userEnergy.sessionDuration,
        interactionFrequency: userEnergy.interactionFrequency,
      },
      adaptationApplied: {
        warmthAdjustment: adaptation.warmthAdjustment,
        energyAdjustment: adaptation.energyAdjustment,
        formalityAdjustment: adaptation.formalityAdjustment,
        verbosityAdjustment: adaptation.verbosityAdjustment,
        directnessAdjustment: adaptation.directnessAdjustment,
        responseModifiers: adaptation.responseModifiers,
        responseDelayModifier: adaptation.responseDelayModifier,
        thoughtfulnessPause: adaptation.thoughtfulnessPause,
        adaptationReason: adaptation.adaptationReason,
      },
      effectivenessScore: 70, // Placeholder - would be measured from feedback
    };
    
    this.recentAdaptations.push(snapshot);
    
    // Keep only last N adaptations
    if (this.recentAdaptations.length > this.MAX_ADAPTATION_HISTORY) {
      this.recentAdaptations.shift();
    }
  }

  /**
   * Get adaptation statistics (non-identifying patterns only)
   */
  getAdaptationStats(): {
    totalAdaptations: number;
    averageExcitementDetected: number;
    averageStressDetected: number;
    mostCommonStrategy: string;
    averageEffectiveness: number;
  } {
    if (this.recentAdaptations.length === 0) {
      return {
        totalAdaptations: 0,
        averageExcitementDetected: 0,
        averageStressDetected: 0,
        mostCommonStrategy: 'none',
        averageEffectiveness: 0,
      };
    }
    
    const total = this.recentAdaptations.length;
    const avgExcitement = this.recentAdaptations.reduce((sum, a) => 
      sum + a.userEnergyDetected.excitementLevel, 0) / total;
    const avgStress = this.recentAdaptations.reduce((sum, a) => 
      sum + a.userEnergyDetected.stressLevel, 0) / total;
    const avgEffectiveness = this.recentAdaptations.reduce((sum, a) => 
      sum + a.effectivenessScore, 0) / total;
    
    // Find most common strategy
    const strategyMap = new Map<string, number>();
    this.recentAdaptations.forEach(a => {
      const strategy = a.adaptationApplied.adaptationReason.split(' with ')[1]?.split(' strategy')[0] || 'unknown';
      strategyMap.set(strategy, (strategyMap.get(strategy) || 0) + 1);
    });
    
    let mostCommonStrategy = 'none';
    let maxCount = 0;
    Array.from(strategyMap.entries()).forEach(([strategy, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonStrategy = strategy;
      }
    });
    
    return {
      totalAdaptations: total,
      averageExcitementDetected: avgExcitement,
      averageStressDetected: avgStress,
      mostCommonStrategy,
      averageEffectiveness: avgEffectiveness,
    };
  }

  /**
   * Clear all adaptation history (privacy reset)
   */
  clearHistory(): void {
    this.recentAdaptations = [];
    this.currentAdaptation = null;
  }

  /**
   * Reset to base identity (no adaptations)
   */
  resetToBase(): void {
    this.currentAdaptation = null;
  }
}
