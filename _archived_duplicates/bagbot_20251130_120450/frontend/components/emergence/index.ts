/**
 * LEVEL 11.3 — EMERGENCE SIGNATURE ENGINE (ESE) — EXPORT HUB
 * 
 * Unified orchestrator for BagBot's living presence system.
 * Integrates all Level 11.3 components into coherent whole.
 * 
 * Components:
 * - EmergenceSignatureCore: Signature energy imprint
 * - EmotionalTrajectoryEngine: Emotional arc tracking
 * - AdaptiveExpressionMatrix: Micro-expressive timing
 * - AuraSyncEngine: Visual presence synchronization
 * - IdentityResonanceHub: Dashboard UI
 * 
 * Full compatibility with Levels 1-11.2.
 */

// ================================
// CORE EXPORTS
// ================================

export { EmergenceSignatureCore } from './EmergenceSignatureCore';
export { EmotionalTrajectoryEngine } from './EmotionalTrajectoryEngine';
export { AdaptiveExpressionMatrix } from './AdaptiveExpressionMatrix';
export { AuraSyncEngine } from './AuraSyncEngine';
export { IdentityResonanceHub } from './IdentityResonanceHub';

// ================================
// TYPE EXPORTS
// ================================

export type {
  // EmergenceSignatureCore types
  ResonancePattern,
  ToneEnergy,
  AuraField,
  PacingRhythm,
  EmergenceSignature,
} from './EmergenceSignatureCore';

export type {
  // EmotionalTrajectoryEngine types
  TrajectoryPattern,
  EmotionalPoint,
  EmotionalMomentum,
  EmotionalExtreme,
  TrajectorySegment,
  EmotionalTrajectory,
} from './EmotionalTrajectoryEngine';

export type {
  // AdaptiveExpressionMatrix types
  ExpressionDimension,
  MicroTiming,
  ExpressionModulation,
  UserStateSignal,
  SessionFlowSignal,
  ExpressionAdaptation,
} from './AdaptiveExpressionMatrix';

export type {
  // AuraSyncEngine types
  AuraMode,
  HSLColor,
  VisualAura,
  AuraBinding,
} from './AuraSyncEngine';

// ================================
// UNIFIED SYSTEM
// ================================

import { EmergenceSignatureCore } from './EmergenceSignatureCore';
import { EmotionalTrajectoryEngine } from './EmotionalTrajectoryEngine';
import { AdaptiveExpressionMatrix } from './AdaptiveExpressionMatrix';
import { AuraSyncEngine } from './AuraSyncEngine';

import type { EmergenceSignature } from './EmergenceSignatureCore';
import type { EmotionalTrajectory } from './EmotionalTrajectoryEngine';
import type { ExpressionModulation, UserStateSignal, SessionFlowSignal } from './AdaptiveExpressionMatrix';
import type { VisualAura } from './AuraSyncEngine';

// Import Level 11.2 types for integration
import type { PersonalityVector } from '../emergent/PersonalityVectorEngine';

/**
 * Complete system state
 */
export interface EmergenceSystemState {
  signature: EmergenceSignature;
  trajectory: EmotionalTrajectory;
  expression: ExpressionModulation;
  aura: VisualAura;
  lastUpdate: number;
}

/**
 * System summary
 */
export interface EmergenceSystemSummary {
  presence: {
    feel: string;
    energy: string;
    mode: string;
    strength: number;
  };
  trajectory: {
    pattern: string;
    arc: string;
    momentum: string;
    duration: string;
  };
  expression: {
    feel: string;
    style: string;
    timing: string;
  };
  coherence: number;
}

/**
 * EMERGENCE SIGNATURE SYSTEM
 * 
 * Complete orchestrator for Level 11.3.
 * Manages all components and ensures synchronization.
 */
export class EmergenceSignatureSystem {
  private signatureCore: EmergenceSignatureCore;
  private trajectoryEngine: EmotionalTrajectoryEngine;
  private expressionMatrix: AdaptiveExpressionMatrix;
  private auraSyncEngine: AuraSyncEngine;
  
  private updateInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.signatureCore = new EmergenceSignatureCore();
    this.trajectoryEngine = new EmotionalTrajectoryEngine();
    this.expressionMatrix = new AdaptiveExpressionMatrix();
    this.auraSyncEngine = new AuraSyncEngine();
    
    // Start auto-update cycle
    this.startUpdateCycle();
  }

  /**
   * Process user interaction
   */
  processInteraction(input: {
    userState: UserStateSignal;
    sessionFlow: SessionFlowSignal;
    personality?: PersonalityVector;
  }): void {
    // Extract emotional state from user signals
    const emotions = this.inferEmotions(input.userState);
    
    // Update engines
    const dominantEmotion = this.getDominantEmotion(emotions);
    const avgIntensity = Object.values(emotions).reduce((sum, v) => sum + v, 0) / 7;
    
    this.signatureCore.updateEmotionalInfluence(
      dominantEmotion,
      avgIntensity,
      70, // stability
      'stable' // trajectory
    );
    
    // Map 'building' to 'warming' for compatibility
    const relationshipStage = input.userState.relationshipStage === 'building'
      ? 'warming'
      : input.userState.relationshipStage;
    
    this.signatureCore.updateSessionContext({
      duration: input.sessionFlow.duration,
      relationshipStage: relationshipStage as 'new' | 'warming' | 'established' | 'deep',
      pressureLevel: input.sessionFlow.pressure === 'high' ? 80 : 50,
      engagementLevel: input.userState.engagement,
    });
    
    this.trajectoryEngine.recordPoint(emotions);
    
    this.expressionMatrix.adaptToUser(input.userState);
    this.expressionMatrix.adaptToSession(input.sessionFlow);
    
    // Full sync
    if (input.personality) {
      this.auraSyncEngine.fullSync({
        personality: input.personality,
        trajectory: this.trajectoryEngine.getTrajectory(),
        modulation: this.expressionMatrix.getModulation(),
        signature: this.signatureCore.getSignature(),
      });
    } else {
      this.auraSyncEngine.fullSync({
        trajectory: this.trajectoryEngine.getTrajectory(),
        modulation: this.expressionMatrix.getModulation(),
        signature: this.signatureCore.getSignature(),
      });
    }
  }

  /**
   * Get dominant emotion
   */
  private getDominantEmotion(emotions: {
    calm: number;
    excited: number;
    focused: number;
    supportive: number;
    intense: number;
    analytical: number;
    playful: number;
  }): 'calm' | 'excited' | 'focused' | 'supportive' | 'intense' | 'analytical' | 'playful' {
    const entries = Object.entries(emotions) as Array<[keyof typeof emotions, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  /**
   * Infer emotions from user state
   */
  private inferEmotions(userState: UserStateSignal): {
    calm: number;
    excited: number;
    focused: number;
    supportive: number;
    intense: number;
    analytical: number;
    playful: number;
  } {
    const base = {
      calm: 30,
      excited: 20,
      focused: 40,
      supportive: 50,
      intense: 30,
      analytical: 40,
      playful: 20,
    };
    
    // Adjust based on emotional tone
    switch (userState.emotionalTone) {
      case 'calm':
        base.calm = 80;
        base.intense = 10;
        break;
      case 'excited':
        base.excited = 85;
        base.playful = 60;
        break;
      case 'stressed':
        base.intense = 70;
        base.supportive = 80;
        break;
      case 'curious':
        base.focused = 75;
        base.analytical = 65;
        break;
      case 'frustrated':
        base.intense = 65;
        base.supportive = 75;
        break;
      case 'satisfied':
        base.calm = 70;
        base.supportive = 60;
        break;
    }
    
    // Adjust based on engagement
    if (userState.engagement > 70) {
      base.focused += 15;
      base.excited += 10;
    } else if (userState.engagement < 40) {
      base.calm += 10;
    }
    
    // Adjust based on urgency
    if (userState.urgency > 70) {
      base.intense += 20;
      base.focused += 15;
    }
    
    // Normalize to 0-100
    Object.keys(base).forEach(key => {
      base[key as keyof typeof base] = Math.max(0, Math.min(100, base[key as keyof typeof base]));
    });
    
    return base;
  }

  /**
   * Get complete system state
   */
  getState(): EmergenceSystemState {
    return {
      signature: this.signatureCore.getSignature(),
      trajectory: this.trajectoryEngine.getTrajectory(),
      expression: this.expressionMatrix.getModulation(),
      aura: this.auraSyncEngine.getAura(),
      lastUpdate: Date.now(),
    };
  }

  /**
   * Get system summary
   */
  getSummary(): EmergenceSystemSummary {
    const signatureSummary = this.signatureCore.getSignatureSummary();
    const trajectorySummary = this.trajectoryEngine.getTrajectorySummary();
    const expressionSummary = this.expressionMatrix.getModulationSummary();
    const auraSummary = this.auraSyncEngine.getAuraSummary();
    
    const avgCoherence = (
      trajectorySummary.coherence +
      expressionSummary.coherence +
      auraSummary.coherence
    ) / 3;
    
    return {
      presence: {
        feel: signatureSummary.feel,
        energy: signatureSummary.energy,
        mode: auraSummary.mode,
        strength: auraSummary.recognizability,
      },
      trajectory: {
        pattern: trajectorySummary.pattern,
        arc: trajectorySummary.arc,
        momentum: trajectorySummary.momentum,
        duration: trajectorySummary.duration,
      },
      expression: {
        feel: expressionSummary.feel,
        style: expressionSummary.style,
        timing: expressionSummary.timing,
      },
      coherence: avgCoherence,
    };
  }

  /**
   * Get aura CSS variables
   */
  getAuraCSS(): Record<string, string> {
    return this.auraSyncEngine.getAuraCSS();
  }

  /**
   * Get components (for dashboard)
   */
  getComponents() {
    return {
      signatureCore: this.signatureCore,
      trajectoryEngine: this.trajectoryEngine,
      expressionMatrix: this.expressionMatrix,
      auraSyncEngine: this.auraSyncEngine,
    };
  }

  /**
   * Start auto-update cycle
   */
  private startUpdateCycle(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      // Update expression matrix (moves toward targets)
      this.expressionMatrix.update();
      
      // Re-sync aura
      this.auraSyncEngine.fullSync({
        trajectory: this.trajectoryEngine.getTrajectory(),
        modulation: this.expressionMatrix.getModulation(),
        signature: this.signatureCore.getSignature(),
      });
    }, 100); // 10 updates per second
  }

  /**
   * Stop auto-update cycle
   */
  stopUpdateCycle(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Reset all components
   */
  reset(): void {
    this.signatureCore = new EmergenceSignatureCore();
    this.trajectoryEngine = new EmotionalTrajectoryEngine();
    this.expressionMatrix = new AdaptiveExpressionMatrix();
    this.auraSyncEngine = new AuraSyncEngine();
  }

  /**
   * Export system state
   */
  export(): string {
    return JSON.stringify({
      signature: this.signatureCore.export(),
      trajectory: this.trajectoryEngine.export(),
      expression: this.expressionMatrix.export(),
      aura: this.auraSyncEngine.export(),
    });
  }

  /**
   * Import system state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      const success = [
        this.signatureCore.import(data.signature),
        this.trajectoryEngine.import(data.trajectory),
        this.expressionMatrix.import(data.expression),
        this.auraSyncEngine.import(data.aura),
      ].every(result => result);
      
      return success;
    } catch (error) {
      console.error('Failed to import system state:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopUpdateCycle();
  }
}
