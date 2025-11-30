/**
 * LEVEL 7.5: COGNITIVE WEIGHT BALANCER
 * 
 * Balances:
 * - reasoning depth
 * - emotional sensitivity
 * - prediction intensity
 * - UI responsiveness
 * 
 * So nothing becomes too heavy or too light as BagBot evolves.
 */

import type { GenomeSnapshot } from './BehaviorGenome';
import type { MemorySnapshot } from './EntityMemory';

// ============================================
// COGNITIVE WEIGHTS
// ============================================

export interface CognitiveWeightsData {
  reasoningDepth: number;         // 0-100: How deeply bot analyzes
  emotionalSensitivity: number;   // 0-100: How responsive to emotions
  predictionIntensity: number;    // 0-100: How aggressive predictions are
  uiResponsiveness: number;       // 0-100: How reactive UI is
}

// ============================================
// WEIGHT BALANCE
// ============================================

export interface WeightBalance {
  weights: CognitiveWeightsData;
  isBalanced: boolean;
  imbalances: string[];
  totalWeight: number;            // Sum of all weights
  targetWeight: number;           // Target sum (200 = balanced)
}

// ============================================
// COGNITIVE WEIGHTS CLASS
// ============================================

export class CognitiveWeights {
  private storageKey = 'bagbot_cognitive_weights_v1';
  
  // Current weights (should sum to ~200 for balance)
  private weights: CognitiveWeightsData = {
    reasoningDepth: 50,
    emotionalSensitivity: 50,
    predictionIntensity: 50,
    uiResponsiveness: 50
  };
  
  // Target sum for balanced state
  private readonly TARGET_WEIGHT = 200;
  private readonly BALANCE_TOLERANCE = 20;
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Balance cognitive weights based on genome
   */
  balance(
    genome: GenomeSnapshot,
    memory: MemorySnapshot
  ): WeightBalance {
    // Calculate weights from genome parameters
    const newWeights = this.calculateWeights(genome, memory);
    
    // Check if weights are balanced
    const totalWeight = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    const imbalances: string[] = [];
    
    // If total weight is too high or low, rebalance
    if (Math.abs(totalWeight - this.TARGET_WEIGHT) > this.BALANCE_TOLERANCE) {
      const scaleFactor = this.TARGET_WEIGHT / totalWeight;
      
      for (const key in newWeights) {
        const originalWeight = newWeights[key as keyof CognitiveWeightsData];
        newWeights[key as keyof CognitiveWeightsData] = originalWeight * scaleFactor;
      }
      
      imbalances.push('Scaled all weights to achieve target sum');
    }
    
    // Check individual weight limits (10-90 range)
    for (const key in newWeights) {
      const weight = newWeights[key as keyof CognitiveWeightsData];
      
      if (weight < 10) {
        newWeights[key as keyof CognitiveWeightsData] = 10;
        imbalances.push(`${key} too low, increased to 10`);
      } else if (weight > 90) {
        newWeights[key as keyof CognitiveWeightsData] = 90;
        imbalances.push(`${key} too high, decreased to 90`);
      }
    }
    
    // Check for extreme imbalances (one weight > 2x another)
    const weightValues = Object.values(newWeights);
    const maxWeight = Math.max(...weightValues);
    const minWeight = Math.min(...weightValues);
    
    if (maxWeight > minWeight * 2.5) {
      // Apply compression to reduce extreme differences
      const mean = weightValues.reduce((sum, w) => sum + w, 0) / weightValues.length;
      
      for (const key in newWeights) {
        const weight = newWeights[key as keyof CognitiveWeightsData];
        const deviation = weight - mean;
        newWeights[key as keyof CognitiveWeightsData] = mean + (deviation * 0.7);
      }
      
      imbalances.push('Compressed extreme weight differences');
    }
    
    // Update weights
    this.weights = newWeights;
    
    // Recalculate total after adjustments
    const finalTotal = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    const isBalanced = Math.abs(finalTotal - this.TARGET_WEIGHT) <= this.BALANCE_TOLERANCE;
    
    this.saveToStorage();
    
    return {
      weights: this.getWeights(),
      isBalanced,
      imbalances,
      totalWeight: finalTotal,
      targetWeight: this.TARGET_WEIGHT
    };
  }
  
  /**
   * Get current cognitive weights
   */
  getWeights(): CognitiveWeightsData {
    return { ...this.weights };
  }
  
  /**
   * Get weight distribution (percentages)
   */
  getDistribution(): { [key: string]: number } {
    const total = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
    const distribution: { [key: string]: number } = {};
    
    for (const key in this.weights) {
      distribution[key] = (this.weights[key as keyof CognitiveWeightsData] / total) * 100;
    }
    
    return distribution;
  }
  
  /**
   * Reset to balanced defaults
   */
  reset(): void {
    this.weights = {
      reasoningDepth: 50,
      emotionalSensitivity: 50,
      predictionIntensity: 50,
      uiResponsiveness: 50
    };
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // WEIGHT CALCULATION
  // ============================================
  
  private calculateWeights(
    genome: GenomeSnapshot,
    memory: MemorySnapshot
  ): CognitiveWeightsData {
    const params = genome.parameters;
    
    // Reasoning depth: from focus intensity + patience
    const reasoningDepth = (params.focusIntensity + params.patienceFactor) / 2;
    
    // Emotional sensitivity: from emotional elasticity + engagement
    const engagementScore = memory.engagementPattern.intensityAverage;
    const emotionalSensitivity = (params.emotionalElasticity + engagementScore) / 2;
    
    // Prediction intensity: from prediction boldness + consistency
    const consistencyScore = memory.interactionRhythm.rhythmConsistency;
    const predictionIntensity = (params.predictionBoldness + consistencyScore) / 2;
    
    // UI responsiveness: from responsiveness speed + ambient pulse
    const uiResponsiveness = (params.responsivenessSpeed + params.ambientPulse) / 2;
    
    return {
      reasoningDepth,
      emotionalSensitivity,
      predictionIntensity,
      uiResponsiveness
    };
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.weights));
    } catch (error) {
      console.warn('[CognitiveWeights] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.weights = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[CognitiveWeights] Failed to load:', error);
    }
  }
}
