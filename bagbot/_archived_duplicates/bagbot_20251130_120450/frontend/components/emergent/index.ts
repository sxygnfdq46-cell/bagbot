/**
 * LEVEL 11.2 — EMERGENT PERSONALITY ENGINE (EPE)
 * Export Hub
 * 
 * Central orchestrator for all emergent personality systems.
 * Coordinates PersonalityVectorEngine, IdentityStabilityAnchor,
 * AdaptiveToneEngine, ContextualMemoryLayer, and IdentityDashboard.
 */

// Core engines
export { PersonalityVectorEngine } from './PersonalityVectorEngine';
export { IdentityStabilityAnchor } from './IdentityStabilityAnchor';
export { AdaptiveToneEngine } from './AdaptiveToneEngine';
export { ContextualMemoryLayer } from './ContextualMemoryLayer';

// UI components
export { IdentityDashboard } from './IdentityDashboard';

// Type exports from PersonalityVectorEngine
export type {
  WarmthTraits,
  ConfidenceTraits,
  LogicTraits,
  IntensityTraits,
  FluidityTraits,
  CuriosityTraits,
  PresenceTraits,
  PersonalityVector,
  TraitConfig,
  PersonalitySignature,
  EmotionalState,
  InteractionContext,
  AdaptationDirective,
} from './PersonalityVectorEngine';

// Type exports from IdentityStabilityAnchor
export type {
  StabilityCurve,
  StabilitySnapshot,
  InterpolationConfig,
} from './IdentityStabilityAnchor';

// Type exports from AdaptiveToneEngine
export type {
  ToneType,
  ToneProfile,
  BlendedTone,
  SentenceModifiers,
  WordChoiceGuidelines,
  RhythmPattern,
} from './AdaptiveToneEngine';

// Type exports from ContextualMemoryLayer
export type {
  InteractionPattern,
  TonePreference,
  PressureLevel,
  EmotionalMode,
  IdentityContextSignal,
  SessionMemory,
} from './ContextualMemoryLayer';

// ================================
// UNIFIED EMERGENT PERSONALITY SYSTEM
// ================================

import { PersonalityVectorEngine, PersonalityVector, EmotionalState, InteractionContext } from './PersonalityVectorEngine';
import { IdentityStabilityAnchor } from './IdentityStabilityAnchor';
import { AdaptiveToneEngine, BlendedTone } from './AdaptiveToneEngine';
import { ContextualMemoryLayer } from './ContextualMemoryLayer';

/**
 * Complete emergent personality system orchestrator
 */
export class EmergentPersonalitySystem {
  private vectorEngine: PersonalityVectorEngine;
  private stabilityAnchor: IdentityStabilityAnchor;
  private toneEngine: AdaptiveToneEngine;
  private memoryLayer: ContextualMemoryLayer;
  
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly AUTO_UPDATE_INTERVAL = 5000; // 5 seconds

  constructor(autoUpdate: boolean = true) {
    // Initialize vector engine
    this.vectorEngine = new PersonalityVectorEngine();
    const signature = this.vectorEngine.getSignature();
    
    // Initialize stability anchor
    this.stabilityAnchor = new IdentityStabilityAnchor(
      signature.coreIdentity,
      signature.vector
    );
    
    // Initialize tone engine
    this.toneEngine = new AdaptiveToneEngine(signature.vector);
    
    // Initialize memory layer
    this.memoryLayer = new ContextualMemoryLayer();
    
    // Start auto-update if requested
    if (autoUpdate) {
      this.startAutoUpdate();
    }
  }

  /**
   * Process user input and adapt personality
   */
  processUserInput(
    userInput: string,
    context: InteractionContext,
    responseTime: number = 3000
  ): {
    tone: BlendedTone;
    personalityUpdated: boolean;
    stabilityHealth: string;
  } {
    // Detect emotional state
    const emotionalState = this.vectorEngine.detectEmotionalState(userInput, context);
    
    // Record in memory
    this.memoryLayer.recordInteraction(userInput, responseTime, context);
    this.memoryLayer.recordEmotionalState(emotionalState);
    this.memoryLayer.recordPressure(context, emotionalState);
    
    // Generate adaptation
    const adaptation = this.vectorEngine.generateAdaptation(emotionalState, context);
    this.vectorEngine.applyAdaptation(adaptation);
    
    // Apply stability constraints
    const currentVector = this.vectorEngine.getSignature().vector;
    const stabilizedVector = this.stabilityAnchor.stabilize(currentVector, adaptation.reason);
    const personalityUpdated = this.stabilityAnchor.update(stabilizedVector, adaptation.reason);
    
    // Update tone
    this.toneEngine.updateTone(emotionalState, context);
    const tone = this.toneEngine.getCurrentTone();
    this.memoryLayer.recordTone(tone);
    
    // Get stability health
    const metrics = this.stabilityAnchor.getStabilityMetrics();
    
    return {
      tone,
      personalityUpdated,
      stabilityHealth: metrics.stabilityHealth,
    };
  }

  /**
   * Get current state
   */
  getCurrentState(): {
    personality: PersonalityVector;
    tone: BlendedTone;
    stability: {
      score: number;
      drift: number;
      health: string;
    };
    session: {
      duration: string;
      interactions: number;
      relationshipStage: string;
    };
  } {
    const signature = this.vectorEngine.getSignature();
    const tone = this.toneEngine.getCurrentTone();
    const stabilityMetrics = this.stabilityAnchor.getStabilityMetrics();
    const stabilityScore = this.stabilityAnchor.getStabilityScore();
    const sessionSummary = this.memoryLayer.getSessionSummary();
    
    return {
      personality: signature.vector,
      tone,
      stability: {
        score: stabilityScore,
        drift: stabilityMetrics.driftFromCore,
        health: stabilityMetrics.stabilityHealth,
      },
      session: {
        duration: sessionSummary.duration,
        interactions: sessionSummary.interactions,
        relationshipStage: sessionSummary.relationshipStage,
      },
    };
  }

  /**
   * Get personality summary
   */
  getPersonalitySummary(): {
    dominantCluster: string;
    dominantTraits: Array<{ cluster: string; trait: string; value: number }>;
    emotionalTone: string;
    currentTone: string;
    stabilityScore: number;
  } {
    const personalitySummary = this.vectorEngine.getPersonalitySummary();
    const toneSummary = this.toneEngine.getToneSummary();
    const stabilityScore = this.stabilityAnchor.getStabilityScore();
    
    return {
      dominantCluster: personalitySummary.dominantCluster,
      dominantTraits: personalitySummary.dominantTraits,
      emotionalTone: personalitySummary.emotionalTone,
      currentTone: toneSummary.currentTone,
      stabilityScore,
    };
  }

  /**
   * Reset to core identity
   */
  resetToCore(): void {
    this.vectorEngine.resetToCore();
    this.stabilityAnchor.resetToCore();
    this.toneEngine.updatePersonality(this.vectorEngine.getSignature().vector);
  }

  /**
   * Update core identity (permanent change)
   */
  updateCoreIdentity(updates: Partial<PersonalityVector>): void {
    this.vectorEngine.updateCoreIdentity(updates);
    const signature = this.vectorEngine.getSignature();
    this.stabilityAnchor.updateCoreIdentity(signature.coreIdentity);
    this.toneEngine.updatePersonality(signature.vector);
  }

  /**
   * Start automatic update cycle
   */
  startAutoUpdate(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      this.vectorEngine.processNaturalDynamics();
      this.stabilityAnchor.applyNaturalRecovery();
      
      // Update tone with latest personality
      const signature = this.vectorEngine.getSignature();
      this.toneEngine.updatePersonality(signature.vector);
    }, this.AUTO_UPDATE_INTERVAL);
  }

  /**
   * Stop automatic update cycle
   */
  stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Export complete system state
   */
  export(): {
    vectorEngine: string;
    stabilityAnchor: string;
    memoryLayer: string;
  } {
    return {
      vectorEngine: this.vectorEngine.exportSignature(),
      stabilityAnchor: this.stabilityAnchor.export(),
      memoryLayer: this.memoryLayer.export(),
    };
  }

  /**
   * Import complete system state
   */
  import(data: {
    vectorEngine: string;
    stabilityAnchor: string;
    memoryLayer: string;
  }): boolean {
    try {
      const vectorSuccess = this.vectorEngine.importSignature(data.vectorEngine);
      const stabilitySuccess = this.stabilityAnchor.import(data.stabilityAnchor);
      const memorySuccess = this.memoryLayer.import(data.memoryLayer);
      
      if (vectorSuccess && stabilitySuccess && memorySuccess) {
        // Sync tone engine with imported personality
        const signature = this.vectorEngine.getSignature();
        this.toneEngine.updatePersonality(signature.vector);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to import EPE system state:', error);
      return false;
    }
  }

  /**
   * Get all engines (for advanced usage)
   */
  getEngines(): {
    vectorEngine: PersonalityVectorEngine;
    stabilityAnchor: IdentityStabilityAnchor;
    toneEngine: AdaptiveToneEngine;
    memoryLayer: ContextualMemoryLayer;
  } {
    return {
      vectorEngine: this.vectorEngine,
      stabilityAnchor: this.stabilityAnchor,
      toneEngine: this.toneEngine,
      memoryLayer: this.memoryLayer,
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAutoUpdate();
  }
}

// Default export
export default EmergentPersonalitySystem;
