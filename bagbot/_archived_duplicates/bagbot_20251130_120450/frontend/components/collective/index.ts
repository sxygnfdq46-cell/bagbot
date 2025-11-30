/**
 * LEVEL 11.4 — COLLECTIVE INTELLIGENCE SYSTEM
 * 
 * Export hub for all collective intelligence components:
 * - CollectiveFieldEngine: Crowd behavior sensing
 * - IntentVectorSynthesizer: Multi-directional intent alignment
 * - ConsensusMemoryEcho: Pattern-safe memory storage
 * - CollectiveIntelligenceHub: Dashboard UI
 * 
 * Unified orchestrator for complete collective intelligence.
 */

// ================================
// CORE ENGINES
// ================================

export {
  CollectiveFieldEngine,
  type CollectiveField,
  type MicroSignals,
  type VolatilityCluster,
  type EnvironmentalCue,
  type LiquidityRhythm,
} from './CollectiveFieldEngine';

export {
  IntentVectorSynthesizer,
  type IntentVector,
  type BagBotIntent,
  type MarketIntent,
  type UserIntent,
  type IntentOverlap,
  type AlignmentPattern,
  type DivergencePattern,
  type WeightedTrajectory,
  type HarmonicResonance,
  type SynthesizedIntent,
} from './IntentVectorSynthesizer';

export {
  ConsensusMemoryEcho,
  type PatternFragment,
  type CrowdCycle,
  type SeasonalMood,
  type LiquidityPersonality,
  type VolatilityTemperament,
  type MemoryEchoState,
} from './ConsensusMemoryEcho';

// ================================
// UI COMPONENTS
// ================================

export { CollectiveIntelligenceHub } from './CollectiveIntelligenceHub';

// ================================
// UNIFIED ORCHESTRATOR
// ================================

import { CollectiveFieldEngine } from './CollectiveFieldEngine';
import { IntentVectorSynthesizer } from './IntentVectorSynthesizer';
import { ConsensusMemoryEcho } from './ConsensusMemoryEcho';

/**
 * CollectiveIntelligenceSystem - Unified orchestrator
 * 
 * Coordinates all 3 engines for complete collective intelligence:
 * 1. CollectiveFieldEngine: Crowd behavior sensing
 * 2. IntentVectorSynthesizer: Intent alignment detection
 * 3. ConsensusMemoryEcho: Pattern memory storage
 * 
 * Usage:
 * ```tsx
 * const system = new CollectiveIntelligenceSystem();
 * 
 * // Update with real-time data
 * system.update({
 *   volatility: 45,
 *   momentum: 12,
 *   pressure: 60,
 *   bagbotIntent: { direction: 90, magnitude: 70, confidence: 80 },
 *   marketIntent: { direction: 85, magnitude: 75, confidence: 75 },
 *   userIntent: { direction: 95, magnitude: 60, confidence: 70 }
 * });
 * 
 * // Get complete state
 * const state = system.getState();
 * console.log(state.field.crowdPhase); // 'accumulation'
 * console.log(state.intent.systemCoherence); // 85.3
 * console.log(state.memory.totalPatterns); // 42
 * ```
 */
export class CollectiveIntelligenceSystem {
  private fieldEngine: CollectiveFieldEngine;
  private intentSynthesizer: IntentVectorSynthesizer;
  private memoryEcho: ConsensusMemoryEcho;

  constructor() {
    this.fieldEngine = new CollectiveFieldEngine();
    this.intentSynthesizer = new IntentVectorSynthesizer();
    this.memoryEcho = new ConsensusMemoryEcho();
  }

  /**
   * Update all engines with new data
   */
  update(input: {
    // Field inputs
    volatility?: number;
    momentum?: number;
    pressure?: number;
    anomalyDensity?: number;
    liquidityShift?: number;

    // Intent inputs
    bagbotIntent?: Partial<{
      direction: number;
      magnitude: number;
      confidence: number;
      velocity: number;
      stability: number;
      strategy: 'accumulate' | 'distribute' | 'hold' | 'defensive' | 'aggressive';
      conviction: number;
      timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
      riskTolerance: number;
    }>;
    marketIntent?: Partial<{
      direction: number;
      magnitude: number;
      confidence: number;
      velocity: number;
      stability: number;
      trend: 'bullish' | 'bearish' | 'sideways' | 'volatile';
      strength: number;
      participation: number;
      consolidation: number;
    }>;
    userIntent?: Partial<{
      direction: number;
      magnitude: number;
      confidence: number;
      velocity: number;
      stability: number;
      focus: 'exploration' | 'decision' | 'monitoring' | 'learning';
      urgency: number;
      engagement: number;
      sentiment: 'curious' | 'confident' | 'uncertain' | 'anxious';
    }>;
  }): void {
    // Update field engine
    if (
      input.volatility !== undefined ||
      input.anomalyDensity !== undefined ||
      input.liquidityShift !== undefined
    ) {
      this.fieldEngine.updateMicroSignals({
        volatilitySpike: input.volatility ?? 0,
        anomalyDensity: input.anomalyDensity ?? 0,
        pacingAcceleration: input.momentum ?? 0,
        liquidityShift: input.liquidityShift ?? 0,
        interactionBurst: 0,
        patternFragmentation: 0,
      });
    }

    // Update intent synthesizer
    if (input.bagbotIntent) {
      this.intentSynthesizer.updateBagBotIntent({
        vector: {
          direction: input.bagbotIntent.direction ?? 0,
          magnitude: input.bagbotIntent.magnitude ?? 0,
          confidence: input.bagbotIntent.confidence ?? 0,
          velocity: input.bagbotIntent.velocity ?? 0,
          stability: input.bagbotIntent.stability ?? 0,
        },
        strategy: input.bagbotIntent.strategy ?? 'hold',
        conviction: input.bagbotIntent.conviction ?? 0,
        timeHorizon: input.bagbotIntent.timeHorizon ?? 'medium',
        riskTolerance: input.bagbotIntent.riskTolerance ?? 0,
      });
    }

    if (input.marketIntent) {
      this.intentSynthesizer.updateMarketIntent({
        vector: {
          direction: input.marketIntent.direction ?? 0,
          magnitude: input.marketIntent.magnitude ?? 0,
          confidence: input.marketIntent.confidence ?? 0,
          velocity: input.marketIntent.velocity ?? 0,
          stability: input.marketIntent.stability ?? 0,
        },
        trend: input.marketIntent.trend ?? 'sideways',
        strength: input.marketIntent.strength ?? 0,
        participation: input.marketIntent.participation ?? 0,
        consolidation: input.marketIntent.consolidation ?? 0,
      });
    }

    if (input.userIntent) {
      this.intentSynthesizer.updateUserIntent({
        vector: {
          direction: input.userIntent.direction ?? 0,
          magnitude: input.userIntent.magnitude ?? 0,
          confidence: input.userIntent.confidence ?? 0,
          velocity: input.userIntent.velocity ?? 0,
          stability: input.userIntent.stability ?? 0,
        },
        focus: input.userIntent.focus ?? 'monitoring',
        urgency: input.userIntent.urgency ?? 0,
        engagement: input.userIntent.engagement ?? 0,
        sentiment: input.userIntent.sentiment ?? 'curious',
      });
    }

    // Update memory echo
    const field = this.fieldEngine.getState();
    this.memoryEcho.recordPattern({
      pressure: input.pressure ?? field.pressure,
      momentum: input.momentum ?? field.momentum,
      emotionalBias: field.emotionalBias,
      crowdPhase: field.crowdPhase,
      coherence: field.coherence,
      volatility: input.volatility ?? field.turbulence,
    });
  }

  /**
   * Get complete system state
   */
  getState() {
    return {
      field: this.fieldEngine.getState(),
      intent: this.intentSynthesizer.getState(),
      memory: this.memoryEcho.getState(),
      timestamp: Date.now(),
    };
  }

  /**
   * Get field engine
   */
  getFieldEngine(): CollectiveFieldEngine {
    return this.fieldEngine;
  }

  /**
   * Get intent synthesizer
   */
  getIntentSynthesizer(): IntentVectorSynthesizer {
    return this.intentSynthesizer;
  }

  /**
   * Get memory echo
   */
  getMemoryEcho(): ConsensusMemoryEcho {
    return this.memoryEcho;
  }

  /**
   * Reset all engines
   */
  reset(): void {
    this.fieldEngine.reset();
    this.intentSynthesizer.reset();
    this.memoryEcho.reset();
  }

  /**
   * Export complete state
   */
  export(): string {
    return JSON.stringify({
      field: this.fieldEngine.export(),
      intent: this.intentSynthesizer.export(),
      memory: this.memoryEcho.export(),
    });
  }

  /**
   * Import complete state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      const fieldSuccess = this.fieldEngine.import(data.field);
      const intentSuccess = this.intentSynthesizer.import(data.intent);
      const memorySuccess = this.memoryEcho.import(data.memory);
      return fieldSuccess && intentSuccess && memorySuccess;
    } catch (error) {
      console.error('Failed to import collective intelligence state:', error);
      return false;
    }
  }
}
