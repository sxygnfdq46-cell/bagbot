/**
 * LEVEL 7.5: SELF-HEALING ALGORITHM
 * 
 * Every 6 hours it:
 * - checks for inconsistencies
 * - recalibrates visual intensity
 * - fixes prediction overreach
 * - restores cognitive balance
 * - resets corrupted micro-states
 * - re-aligns to your baseline emotional signature
 * 
 * This is how BagBot stays healthy over time.
 */

import type { GenomeSnapshot } from './BehaviorGenome';
import type { MemorySnapshot } from './EntityMemory';
import type { ExpressionOutput } from './ExpressionCore';
import type { IdentityCore } from './IdentityAnchor';
import type { StabilityMetrics } from './StabilityCore';

// ============================================
// HEALTH DIAGNOSTICS
// ============================================

export interface HealthDiagnostics {
  inconsistencyLevel: number;     // 0-100: How inconsistent behavior is
  visualOverload: number;         // 0-100: Visual intensity overreach
  predictionOverreach: number;    // 0-100: Prediction boldness excess
  cognitiveImbalance: number;     // 0-100: Cognitive weight imbalance
  microStateCorruption: number;   // 0-100: Corrupted micro-states detected
  alignmentDrift: number;         // 0-100: Drift from baseline signature
  
  overallHealth: number;          // 0-100: Overall health score
  needsHealing: boolean;
}

// ============================================
// HEALING ACTIONS
// ============================================

export interface HealingAction {
  timestamp: number;
  type: 'recalibration' | 'reset' | 'realignment' | 'balance';
  target: string;
  before: number;
  after: number;
  improvement: number;
}

// ============================================
// SELF-HEAL STATE
// ============================================

export interface SelfHealState {
  lastHealingCycle: number;
  healingHistory: HealingAction[];
  diagnostics: HealthDiagnostics;
  healingCount: number;
}

// ============================================
// SELF-HEAL CLASS
// ============================================

export class SelfHeal {
  private storageKey = 'bagbot_self_heal_v1';
  
  // Healing interval (6 hours)
  private readonly HEALING_INTERVAL = 6 * 60 * 60 * 1000;
  
  // Health thresholds
  private readonly HEALTH_THRESHOLD = 70;  // Below this, needs healing
  private readonly MAX_HISTORY = 100;
  
  // State
  private state: SelfHealState = {
    lastHealingCycle: Date.now(),
    healingHistory: [],
    diagnostics: this.createEmptyDiagnostics(),
    healingCount: 0
  };
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Check if healing cycle is due
   */
  shouldHeal(): boolean {
    const timeSinceLastHeal = Date.now() - this.state.lastHealingCycle;
    return timeSinceLastHeal >= this.HEALING_INTERVAL;
  }
  
  /**
   * Perform self-healing cycle
   */
  heal(
    genome: GenomeSnapshot,
    memory: MemorySnapshot,
    expression: ExpressionOutput,
    identity: IdentityCore,
    stability: StabilityMetrics
  ): {
    healedGenome: GenomeSnapshot;
    healedExpression: ExpressionOutput;
    actions: HealingAction[];
    diagnostics: HealthDiagnostics;
  } {
    const actions: HealingAction[] = [];
    
    // Run diagnostics
    const diagnostics = this.diagnose(genome, memory, expression, identity, stability);
    this.state.diagnostics = diagnostics;
    
    // If healthy, skip healing
    if (!diagnostics.needsHealing) {
      return {
        healedGenome: genome,
        healedExpression: expression,
        actions: [],
        diagnostics
      };
    }
    
    // Perform healing operations
    let healedGenome = { ...genome };
    let healedExpression = { ...expression };
    
    // 1. Check for inconsistencies
    if (diagnostics.inconsistencyLevel > 30) {
      healedGenome = this.fixInconsistencies(healedGenome, actions);
    }
    
    // 2. Recalibrate visual intensity
    if (diagnostics.visualOverload > 40) {
      healedGenome = this.recalibrateVisualIntensity(healedGenome, actions);
      healedExpression = this.recalibrateExpression(healedExpression, actions);
    }
    
    // 3. Fix prediction overreach
    if (diagnostics.predictionOverreach > 50) {
      healedGenome = this.fixPredictionOverreach(healedGenome, actions);
    }
    
    // 4. Restore cognitive balance
    if (diagnostics.cognitiveImbalance > 35) {
      healedGenome = this.restoreCognitiveBalance(healedGenome, actions);
    }
    
    // 5. Reset corrupted micro-states
    if (diagnostics.microStateCorruption > 20) {
      healedGenome = this.resetCorruptedStates(healedGenome, actions);
    }
    
    // 6. Re-align to baseline emotional signature
    if (diagnostics.alignmentDrift > 30) {
      healedGenome = this.realignToBaseline(healedGenome, identity, actions);
    }
    
    // Update state
    this.state.lastHealingCycle = Date.now();
    this.state.healingCount++;
    this.state.healingHistory.push(...actions);
    
    // Trim history
    if (this.state.healingHistory.length > this.MAX_HISTORY) {
      this.state.healingHistory = this.state.healingHistory.slice(-this.MAX_HISTORY);
    }
    
    this.saveToStorage();
    
    return {
      healedGenome,
      healedExpression,
      actions,
      diagnostics
    };
  }
  
  /**
   * Get current health diagnostics
   */
  getDiagnostics(): HealthDiagnostics {
    return { ...this.state.diagnostics };
  }
  
  /**
   * Get healing history
   */
  getHistory(): HealingAction[] {
    return [...this.state.healingHistory];
  }
  
  /**
   * Get healing state
   */
  getState(): SelfHealState {
    return { ...this.state };
  }
  
  /**
   * Reset self-heal state
   */
  reset(): void {
    this.state = {
      lastHealingCycle: Date.now(),
      healingHistory: [],
      diagnostics: this.createEmptyDiagnostics(),
      healingCount: 0
    };
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // DIAGNOSTICS
  // ============================================
  
  private diagnose(
    genome: GenomeSnapshot,
    memory: MemorySnapshot,
    expression: ExpressionOutput,
    identity: IdentityCore,
    stability: StabilityMetrics
  ): HealthDiagnostics {
    const params = genome.parameters;
    
    // 1. Check for inconsistencies (parameter variance)
    const paramValues = Object.values(params);
    const variance = this.calculateVariance(paramValues);
    const inconsistencyLevel = Math.min(100, variance * 2);
    
    // 2. Check visual overload (assertiveness + expression intensity)
    const visualIntensity = (params.visualAssertiveness + expression.mood.toneStrength) / 2;
    const visualOverload = Math.max(0, visualIntensity - 70);
    
    // 3. Check prediction overreach (boldness vs consistency)
    const predictionScore = params.predictionBoldness;
    const consistencySupport = memory.interactionRhythm.rhythmConsistency;
    const predictionOverreach = Math.max(0, predictionScore - consistencySupport - 20);
    
    // 4. Check cognitive imbalance (parameter extremes)
    let extremeCount = 0;
    for (const value of paramValues) {
      if (value < 15 || value > 85) extremeCount++;
    }
    const cognitiveImbalance = (extremeCount / paramValues.length) * 100;
    
    // 5. Check micro-state corruption (low stability + high anomaly count)
    const stabilityPenalty = (100 - genome.stability) * 0.5;
    const anomalyPenalty = Math.min(30, stability.anomalyCount * 3);
    const microStateCorruption = stabilityPenalty + anomalyPenalty;
    
    // 6. Check alignment drift (from identity baseline)
    const elasticityDrift = Math.abs(params.emotionalElasticity - identity.emotionalBaseline);
    const presenceDrift = Math.abs(params.visualAssertiveness - identity.identityPresenceLevel);
    const alignmentDrift = (elasticityDrift + presenceDrift) / 2;
    
    // Calculate overall health (100 - average of issues)
    const issues = [
      inconsistencyLevel,
      visualOverload,
      predictionOverreach,
      cognitiveImbalance,
      microStateCorruption,
      alignmentDrift
    ];
    const avgIssueLevel = issues.reduce((sum, val) => sum + val, 0) / issues.length;
    const overallHealth = Math.max(0, 100 - avgIssueLevel);
    
    return {
      inconsistencyLevel,
      visualOverload,
      predictionOverreach,
      cognitiveImbalance,
      microStateCorruption,
      alignmentDrift,
      overallHealth,
      needsHealing: overallHealth < this.HEALTH_THRESHOLD
    };
  }
  
  // ============================================
  // HEALING OPERATIONS
  // ============================================
  
  /**
   * 1. Fix inconsistencies
   */
  private fixInconsistencies(
    genome: GenomeSnapshot,
    actions: HealingAction[]
  ): GenomeSnapshot {
    const healed = { ...genome };
    const params = { ...healed.parameters };
    
    // Calculate mean of all parameters
    const paramValues = Object.values(params);
    const mean = paramValues.reduce((sum, val) => sum + val, 0) / paramValues.length;
    
    // Pull extreme parameters toward mean (10% correction)
    for (const key in params) {
      const value = params[key as keyof typeof params];
      const deviation = Math.abs(value - mean);
      
      if (deviation > 20) {
        const before = value;
        const correction = (mean - value) * 0.1;
        params[key as keyof typeof params] = value + correction;
        
        actions.push({
          timestamp: Date.now(),
          type: 'recalibration',
          target: `genome.${key}`,
          before,
          after: params[key as keyof typeof params],
          improvement: Math.abs(correction)
        });
      }
    }
    
    healed.parameters = params;
    return healed;
  }
  
  /**
   * 2. Recalibrate visual intensity
   */
  private recalibrateVisualIntensity(
    genome: GenomeSnapshot,
    actions: HealingAction[]
  ): GenomeSnapshot {
    const recalibrated = { ...genome };
    const params = { ...recalibrated.parameters };
    
    // Reduce visual assertiveness if too high
    if (params.visualAssertiveness > 75) {
      const before = params.visualAssertiveness;
      params.visualAssertiveness = 75;
      
      actions.push({
        timestamp: Date.now(),
        type: 'recalibration',
        target: 'genome.visualAssertiveness',
        before,
        after: 75,
        improvement: before - 75
      });
    }
    
    recalibrated.parameters = params;
    return recalibrated;
  }
  
  private recalibrateExpression(
    expression: ExpressionOutput,
    actions: HealingAction[]
  ): ExpressionOutput {
    const recalibrated = { ...expression };
    
    // Reduce mood tone strength if too high
    if (recalibrated.mood.toneStrength > 80) {
      const before = recalibrated.mood.toneStrength;
      recalibrated.mood.toneStrength = 80;
      
      actions.push({
        timestamp: Date.now(),
        type: 'recalibration',
        target: 'expression.mood.toneStrength',
        before,
        after: 80,
        improvement: before - 80
      });
    }
    
    return recalibrated;
  }
  
  /**
   * 3. Fix prediction overreach
   */
  private fixPredictionOverreach(
    genome: GenomeSnapshot,
    actions: HealingAction[]
  ): GenomeSnapshot {
    const fixed = { ...genome };
    const params = { ...fixed.parameters };
    
    // Reduce prediction boldness by 15%
    const before = params.predictionBoldness;
    params.predictionBoldness = before * 0.85;
    
    actions.push({
      timestamp: Date.now(),
      type: 'recalibration',
      target: 'genome.predictionBoldness',
      before,
      after: params.predictionBoldness,
      improvement: before - params.predictionBoldness
    });
    
    fixed.parameters = params;
    return fixed;
  }
  
  /**
   * 4. Restore cognitive balance
   */
  private restoreCognitiveBalance(
    genome: GenomeSnapshot,
    actions: HealingAction[]
  ): GenomeSnapshot {
    const balanced = { ...genome };
    const params = { ...balanced.parameters };
    
    // Pull extremes toward 50 (neutral balance)
    for (const key in params) {
      const value = params[key as keyof typeof params];
      
      if (value < 20) {
        const before = value;
        params[key as keyof typeof params] = 20 + ((50 - 20) * 0.2);
        
        actions.push({
          timestamp: Date.now(),
          type: 'balance',
          target: `genome.${key}`,
          before,
          after: params[key as keyof typeof params],
          improvement: params[key as keyof typeof params] - before
        });
      } else if (value > 80) {
        const before = value;
        params[key as keyof typeof params] = 80 - ((80 - 50) * 0.2);
        
        actions.push({
          timestamp: Date.now(),
          type: 'balance',
          target: `genome.${key}`,
          before,
          after: params[key as keyof typeof params],
          improvement: before - params[key as keyof typeof params]
        });
      }
    }
    
    balanced.parameters = params;
    return balanced;
  }
  
  /**
   * 5. Reset corrupted micro-states
   */
  private resetCorruptedStates(
    genome: GenomeSnapshot,
    actions: HealingAction[]
  ): GenomeSnapshot {
    const reset = { ...genome };
    
    // If stability is very low (< 40), boost it
    if (reset.stability < 40) {
      const before = reset.stability;
      reset.stability = 40 + ((60 - 40) * 0.3);
      
      actions.push({
        timestamp: Date.now(),
        type: 'reset',
        target: 'genome.stability',
        before,
        after: reset.stability,
        improvement: reset.stability - before
      });
    }
    
    return reset;
  }
  
  /**
   * 6. Re-align to baseline emotional signature
   */
  private realignToBaseline(
    genome: GenomeSnapshot,
    identity: IdentityCore,
    actions: HealingAction[]
  ): GenomeSnapshot {
    const realigned = { ...genome };
    const params = { ...realigned.parameters };
    
    // Pull emotional elasticity toward identity baseline (20% correction)
    const elasticityDrift = params.emotionalElasticity - identity.emotionalBaseline;
    if (Math.abs(elasticityDrift) > 15) {
      const before = params.emotionalElasticity;
      params.emotionalElasticity = before - (elasticityDrift * 0.2);
      
      actions.push({
        timestamp: Date.now(),
        type: 'realignment',
        target: 'genome.emotionalElasticity',
        before,
        after: params.emotionalElasticity,
        improvement: Math.abs(elasticityDrift * 0.2)
      });
    }
    
    // Pull visual assertiveness toward identity presence (20% correction)
    const presenceDrift = params.visualAssertiveness - identity.identityPresenceLevel;
    if (Math.abs(presenceDrift) > 15) {
      const before = params.visualAssertiveness;
      params.visualAssertiveness = before - (presenceDrift * 0.2);
      
      actions.push({
        timestamp: Date.now(),
        type: 'realignment',
        target: 'genome.visualAssertiveness',
        before,
        after: params.visualAssertiveness,
        improvement: Math.abs(presenceDrift * 0.2)
      });
    }
    
    realigned.parameters = params;
    return realigned;
  }
  
  // ============================================
  // UTILITIES
  // ============================================
  
  private createEmptyDiagnostics(): HealthDiagnostics {
    return {
      inconsistencyLevel: 0,
      visualOverload: 0,
      predictionOverreach: 0,
      cognitiveImbalance: 0,
      microStateCorruption: 0,
      alignmentDrift: 0,
      overallHealth: 100,
      needsHealing: false
    };
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length);
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (error) {
      console.warn('[SelfHeal] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[SelfHeal] Failed to load:', error);
    }
  }
}
