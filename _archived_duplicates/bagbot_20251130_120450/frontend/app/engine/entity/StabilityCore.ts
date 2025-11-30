/**
 * LEVEL 7.5: STABILITY CORE (SC-1)
 * 
 * A 7-layer stabilizing engine that:
 * - tracks emotional drift
 * - enforces personality boundaries
 * - prevents over-evolution
 * - resets micro-anomalies
 * - smooths behaviour curves
 * - maintains consistency across days
 * - ensures no wild identity swings
 * 
 * This keeps BagBot grounded, even as it evolves to match you.
 */

import type { GenomeSnapshot } from './BehaviorGenome';
import type { MemorySnapshot } from './EntityMemory';
import type { EvolutionTimeline } from './EvolutionClock';
import type { IdentityCore } from './IdentityAnchor';
import type { ExpressionOutput } from './ExpressionCore';

// ============================================
// DRIFT TRACKING
// ============================================

export interface EmotionalDrift {
  currentBaseline: number;        // 0-100: Current emotional baseline
  originalBaseline: number;       // 0-100: Original baseline (from first week)
  driftAmount: number;            // 0-100: How far from original
  driftRate: number;              // Units per day
  isStable: boolean;              // Is drift within acceptable range?
}

export interface PersonalityBoundaries {
  temperamentRange: [number, number];  // Min/max temperament score
  styleRange: [number, number];        // Min/max style score
  energyRange: [number, number];       // Min/max energy level
  maxDailyShift: number;               // Maximum change per day
}

// ============================================
// ANOMALY DETECTION
// ============================================

export interface MicroAnomaly {
  timestamp: number;
  type: 'spike' | 'drop' | 'oscillation' | 'drift';
  parameter: string;
  severity: number;               // 0-100
  corrected: boolean;
}

// ============================================
// STABILITY METRICS
// ============================================

export interface StabilityMetrics {
  emotionalDrift: EmotionalDrift;
  anomalyCount: number;
  lastReset: number;
  stabilityScore: number;         // 0-100: Overall stability
  groundedness: number;           // 0-100: How grounded personality is
  consistencyScore: number;       // 0-100: Day-to-day consistency
}

// ============================================
// STABILITY CORE CLASS
// ============================================

export class StabilityCore {
  private storageKey = 'bagbot_stability_core_v1';
  
  // Drift tracking
  private emotionalDrift: EmotionalDrift = {
    currentBaseline: 50,
    originalBaseline: 50,
    driftAmount: 0,
    driftRate: 0,
    isStable: true
  };
  
  // Personality boundaries (enforced limits)
  private boundaries: PersonalityBoundaries = {
    temperamentRange: [30, 70],   // Can't go too calm or too energetic
    styleRange: [25, 75],          // Can't go too subtle or too bold
    energyRange: [20, 80],         // Can't go too low or too high
    maxDailyShift: 5               // Max 5 points per day
  };
  
  // Anomaly tracking
  private anomalies: MicroAnomaly[] = [];
  private readonly MAX_ANOMALIES = 50;
  
  // Stability state
  private metrics: StabilityMetrics = {
    emotionalDrift: { ...this.emotionalDrift },
    anomalyCount: 0,
    lastReset: Date.now(),
    stabilityScore: 100,
    groundedness: 100,
    consistencyScore: 100
  };
  
  // Previous genome (for consistency checking)
  private previousGenome: GenomeSnapshot | null = null;
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Stabilize genome and expression to prevent wild swings
   */
  stabilize(
    genome: GenomeSnapshot,
    expression: ExpressionOutput,
    memory: MemorySnapshot,
    timeline: EvolutionTimeline,
    identity: IdentityCore
  ): {
    stabilizedGenome: GenomeSnapshot;
    stabilizedExpression: ExpressionOutput;
    corrections: string[];
  } {
    const corrections: string[] = [];
    
    // Layer 1: Track emotional drift
    this.trackEmotionalDrift(genome, identity);
    
    // Layer 2: Enforce personality boundaries
    const boundedGenome = this.enforcePersonalityBoundaries(genome, corrections);
    
    // Layer 3: Prevent over-evolution
    const evolutionCheckedGenome = this.preventOverEvolution(
      boundedGenome,
      timeline,
      corrections
    );
    
    // Layer 4: Reset micro-anomalies
    const anomalyCheckedGenome = this.resetMicroAnomalies(
      evolutionCheckedGenome,
      corrections
    );
    
    // Layer 5: Smooth behaviour curves
    const smoothedGenome = this.smoothBehaviourCurves(
      anomalyCheckedGenome,
      corrections
    );
    
    // Layer 6: Maintain consistency across days
    const consistentGenome = this.maintainConsistency(
      smoothedGenome,
      corrections
    );
    
    // Layer 7: Ensure no wild identity swings
    const stabilizedGenome = this.ensureNoWildSwings(
      consistentGenome,
      identity,
      corrections
    );
    
    // Stabilize expression output
    const stabilizedExpression = this.stabilizeExpression(expression);
    
    // Update metrics
    this.updateMetrics(stabilizedGenome, timeline);
    
    // Store current genome for next comparison
    this.previousGenome = { ...stabilizedGenome };
    
    // Save to storage
    this.saveToStorage();
    
    return {
      stabilizedGenome,
      stabilizedExpression,
      corrections
    };
  }
  
  /**
   * Get current stability metrics
   */
  getMetrics(): StabilityMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Check if genome needs stabilization
   */
  needsStabilization(genome: GenomeSnapshot): boolean {
    if (!this.previousGenome) return false;
    
    // Check for large parameter changes
    const params = genome.parameters;
    const prevParams = this.previousGenome.parameters;
    
    let maxChange = 0;
    for (const key in params) {
      const change = Math.abs(params[key as keyof typeof params] - prevParams[key as keyof typeof prevParams]);
      maxChange = Math.max(maxChange, change);
    }
    
    return maxChange > this.boundaries.maxDailyShift;
  }
  
  /**
   * Reset stability tracking (use with caution)
   */
  reset(): void {
    this.emotionalDrift = {
      currentBaseline: 50,
      originalBaseline: 50,
      driftAmount: 0,
      driftRate: 0,
      isStable: true
    };
    
    this.anomalies = [];
    this.previousGenome = null;
    
    this.metrics = {
      emotionalDrift: { ...this.emotionalDrift },
      anomalyCount: 0,
      lastReset: Date.now(),
      stabilityScore: 100,
      groundedness: 100,
      consistencyScore: 100
    };
    
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // LAYER 1: TRACK EMOTIONAL DRIFT
  // ============================================
  
  private trackEmotionalDrift(genome: GenomeSnapshot, identity: IdentityCore): void {
    // Update original baseline if this is first genome
    if (this.emotionalDrift.originalBaseline === 50 && identity.generationsLived < 2) {
      this.emotionalDrift.originalBaseline = identity.emotionalBaseline;
    }
    
    // Calculate current baseline from genome
    this.emotionalDrift.currentBaseline = genome.parameters.emotionalElasticity;
    
    // Calculate drift amount
    this.emotionalDrift.driftAmount = Math.abs(
      this.emotionalDrift.currentBaseline - this.emotionalDrift.originalBaseline
    );
    
    // Calculate drift rate (if we have previous genome)
    if (this.previousGenome) {
      const timeDelta = genome.lastEvolution - this.previousGenome.lastEvolution;
      const daysElapsed = timeDelta / (24 * 60 * 60 * 1000);
      
      if (daysElapsed > 0) {
        const baselineDelta = Math.abs(
          genome.parameters.emotionalElasticity -
          this.previousGenome.parameters.emotionalElasticity
        );
        this.emotionalDrift.driftRate = baselineDelta / daysElapsed;
      }
    }
    
    // Check if drift is stable (within 20 points of original)
    this.emotionalDrift.isStable = this.emotionalDrift.driftAmount < 20;
  }
  
  // ============================================
  // LAYER 2: ENFORCE PERSONALITY BOUNDARIES
  // ============================================
  
  private enforcePersonalityBoundaries(
    genome: GenomeSnapshot,
    corrections: string[]
  ): GenomeSnapshot {
    const bounded = { ...genome };
    const params = { ...bounded.parameters };
    
    // Calculate temperament score
    const temperamentScore = (params.patienceFactor + (100 - params.responsivenessSpeed)) / 2;
    
    if (temperamentScore < this.boundaries.temperamentRange[0]) {
      // Too energetic - increase patience, decrease responsiveness
      const adjustment = this.boundaries.temperamentRange[0] - temperamentScore;
      params.patienceFactor += adjustment * 0.5;
      params.responsivenessSpeed -= adjustment * 0.5;
      corrections.push('Enforced minimum temperament boundary');
    } else if (temperamentScore > this.boundaries.temperamentRange[1]) {
      // Too calm - decrease patience, increase responsiveness
      const adjustment = temperamentScore - this.boundaries.temperamentRange[1];
      params.patienceFactor -= adjustment * 0.5;
      params.responsivenessSpeed += adjustment * 0.5;
      corrections.push('Enforced maximum temperament boundary');
    }
    
    // Calculate style score
    const styleScore = (params.visualAssertiveness + params.predictionBoldness) / 2;
    
    if (styleScore < this.boundaries.styleRange[0]) {
      // Too subtle - increase assertiveness and boldness
      const adjustment = this.boundaries.styleRange[0] - styleScore;
      params.visualAssertiveness += adjustment;
      params.predictionBoldness += adjustment;
      corrections.push('Enforced minimum style boundary');
    } else if (styleScore > this.boundaries.styleRange[1]) {
      // Too bold - decrease assertiveness and boldness
      const adjustment = styleScore - this.boundaries.styleRange[1];
      params.visualAssertiveness -= adjustment;
      params.predictionBoldness -= adjustment;
      corrections.push('Enforced maximum style boundary');
    }
    
    // Calculate energy score
    const energyScore = (params.ambientPulse + params.responsivenessSpeed) / 2;
    
    if (energyScore < this.boundaries.energyRange[0]) {
      // Too low energy
      const adjustment = this.boundaries.energyRange[0] - energyScore;
      params.ambientPulse += adjustment;
      params.responsivenessSpeed += adjustment * 0.5;
      corrections.push('Enforced minimum energy boundary');
    } else if (energyScore > this.boundaries.energyRange[1]) {
      // Too high energy
      const adjustment = energyScore - this.boundaries.energyRange[1];
      params.ambientPulse -= adjustment;
      params.responsivenessSpeed -= adjustment * 0.5;
      corrections.push('Enforced maximum energy boundary');
    }
    
    // Clamp all parameters to 10-90 range
    for (const key in params) {
      params[key as keyof typeof params] = this.clamp(
        params[key as keyof typeof params],
        10,
        90
      );
    }
    
    bounded.parameters = params;
    return bounded;
  }
  
  // ============================================
  // LAYER 3: PREVENT OVER-EVOLUTION
  // ============================================
  
  private preventOverEvolution(
    genome: GenomeSnapshot,
    timeline: EvolutionTimeline,
    corrections: string[]
  ): GenomeSnapshot {
    if (!this.previousGenome) return genome;
    
    const limited = { ...genome };
    const params = { ...limited.parameters };
    const prevParams = this.previousGenome.parameters;
    
    // Check each parameter for excessive change
    let correctionMade = false;
    
    for (const key in params) {
      const current = params[key as keyof typeof params];
      const previous = prevParams[key as keyof typeof prevParams];
      const change = Math.abs(current - previous);
      
      if (change > this.boundaries.maxDailyShift) {
        // Limit change to maxDailyShift
        const direction = current > previous ? 1 : -1;
        params[key as keyof typeof params] = previous + (direction * this.boundaries.maxDailyShift);
        correctionMade = true;
      }
    }
    
    if (correctionMade) {
      corrections.push('Limited evolution rate to prevent over-evolution');
    }
    
    limited.parameters = params;
    return limited;
  }
  
  // ============================================
  // LAYER 4: RESET MICRO-ANOMALIES
  // ============================================
  
  private resetMicroAnomalies(
    genome: GenomeSnapshot,
    corrections: string[]
  ): GenomeSnapshot {
    if (!this.previousGenome) return genome;
    
    const cleaned = { ...genome };
    const params = { ...cleaned.parameters };
    const prevParams = this.previousGenome.parameters;
    
    // Detect anomalies
    const newAnomalies: MicroAnomaly[] = [];
    
    for (const key in params) {
      const current = params[key as keyof typeof params];
      const previous = prevParams[key as keyof typeof prevParams];
      const change = current - previous;
      
      // Detect spike (sudden increase > 15)
      if (change > 15) {
        newAnomalies.push({
          timestamp: Date.now(),
          type: 'spike',
          parameter: key,
          severity: change,
          corrected: true
        });
        
        // Smooth spike
        params[key as keyof typeof params] = previous + (change * 0.3);
        corrections.push(`Reset ${key} spike anomaly`);
      }
      
      // Detect drop (sudden decrease > 15)
      if (change < -15) {
        newAnomalies.push({
          timestamp: Date.now(),
          type: 'drop',
          parameter: key,
          severity: Math.abs(change),
          corrected: true
        });
        
        // Smooth drop
        params[key as keyof typeof params] = previous + (change * 0.3);
        corrections.push(`Reset ${key} drop anomaly`);
      }
    }
    
    // Add new anomalies to tracking
    this.anomalies.push(...newAnomalies);
    
    // Keep only recent anomalies
    if (this.anomalies.length > this.MAX_ANOMALIES) {
      this.anomalies = this.anomalies.slice(-this.MAX_ANOMALIES);
    }
    
    cleaned.parameters = params;
    return cleaned;
  }
  
  // ============================================
  // LAYER 5: SMOOTH BEHAVIOUR CURVES
  // ============================================
  
  private smoothBehaviourCurves(
    genome: GenomeSnapshot,
    corrections: string[]
  ): GenomeSnapshot {
    if (!this.previousGenome) return genome;
    
    const smoothed = { ...genome };
    const params = { ...smoothed.parameters };
    const prevParams = this.previousGenome.parameters;
    
    // Apply exponential moving average for smooth transitions
    const smoothingFactor = 0.7; // 70% current, 30% previous
    let smoothingApplied = false;
    
    for (const key in params) {
      const current = params[key as keyof typeof params];
      const previous = prevParams[key as keyof typeof prevParams];
      
      // Check if change is abrupt (> 8 points)
      if (Math.abs(current - previous) > 8) {
        // Apply smoothing
        params[key as keyof typeof params] = 
          (current * smoothingFactor) + (previous * (1 - smoothingFactor));
        smoothingApplied = true;
      }
    }
    
    if (smoothingApplied) {
      corrections.push('Applied behaviour curve smoothing');
    }
    
    smoothed.parameters = params;
    return smoothed;
  }
  
  // ============================================
  // LAYER 6: MAINTAIN CONSISTENCY ACROSS DAYS
  // ============================================
  
  private maintainConsistency(
    genome: GenomeSnapshot,
    corrections: string[]
  ): GenomeSnapshot {
    if (!this.previousGenome || genome.generation < 3) {
      return genome; // Need at least 3 generations for consistency checking
    }
    
    const consistent = { ...genome };
    const params = { ...consistent.parameters };
    const prevParams = this.previousGenome.parameters;
    
    // Check for inconsistent patterns
    // Example: if patience increased yesterday, it shouldn't drop drastically today
    let inconsistencyFound = false;
    
    for (const key in params) {
      const current = params[key as keyof typeof params];
      const previous = prevParams[key as keyof typeof prevParams];
      
      const currentChange = current - previous;
      
      // Check if direction changed drastically
      if (Math.abs(currentChange) > 10) {
        // Apply consistency damping (reduce change by 40%)
        params[key as keyof typeof params] = previous + (currentChange * 0.6);
        inconsistencyFound = true;
      }
    }
    
    if (inconsistencyFound) {
      corrections.push('Applied consistency damping across days');
    }
    
    consistent.parameters = params;
    return consistent;
  }
  
  // ============================================
  // LAYER 7: ENSURE NO WILD IDENTITY SWINGS
  // ============================================
  
  private ensureNoWildSwings(
    genome: GenomeSnapshot,
    identity: IdentityCore,
    corrections: string[]
  ): GenomeSnapshot {
    const stable = { ...genome };
    const params = { ...stable.parameters };
    
    // Check if emotional elasticity is too far from identity baseline
    const elasticityDrift = Math.abs(
      params.emotionalElasticity - identity.emotionalBaseline
    );
    
    if (elasticityDrift > 25) {
      // Pull back toward identity baseline
      const direction = params.emotionalElasticity > identity.emotionalBaseline ? -1 : 1;
      params.emotionalElasticity += direction * 3;
      corrections.push('Prevented emotional elasticity identity swing');
    }
    
    // Check if visual assertiveness is too far from identity presence
    const assertivenessDrift = Math.abs(
      params.visualAssertiveness - identity.identityPresenceLevel
    );
    
    if (assertivenessDrift > 30) {
      // Pull back toward identity presence
      const direction = params.visualAssertiveness > identity.identityPresenceLevel ? -1 : 1;
      params.visualAssertiveness += direction * 3;
      corrections.push('Prevented visual assertiveness identity swing');
    }
    
    stable.parameters = params;
    return stable;
  }
  
  // ============================================
  // EXPRESSION STABILIZATION
  // ============================================
  
  private stabilizeExpression(expression: ExpressionOutput): ExpressionOutput {
    const stabilized = { ...expression };
    
    // Ensure mood tone strength is within reasonable range (30-90)
    if (stabilized.mood.toneStrength < 30) {
      stabilized.mood.toneStrength = 30;
    } else if (stabilized.mood.toneStrength > 90) {
      stabilized.mood.toneStrength = 90;
    }
    
    // Ensure attention intensity is not overwhelming (max 85)
    if (stabilized.attention.acknowledgementLevel > 85) {
      stabilized.attention.acknowledgementLevel = 85;
    }
    
    return stabilized;
  }
  
  // ============================================
  // METRICS UPDATE
  // ============================================
  
  private updateMetrics(genome: GenomeSnapshot, timeline: EvolutionTimeline): void {
    // Update emotional drift metric
    this.metrics.emotionalDrift = { ...this.emotionalDrift };
    
    // Update anomaly count (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.metrics.anomalyCount = this.anomalies.filter(a => a.timestamp > oneDayAgo).length;
    
    // Calculate stability score (100 - penalties)
    let stabilityScore = 100;
    
    // Penalty for emotional drift
    stabilityScore -= Math.min(30, this.emotionalDrift.driftAmount);
    
    // Penalty for anomalies
    stabilityScore -= Math.min(20, this.metrics.anomalyCount * 2);
    
    // Bonus for genome stability
    stabilityScore += (genome.stability * 0.2);
    
    this.metrics.stabilityScore = this.clamp(stabilityScore, 0, 100);
    
    // Calculate groundedness (inverse of drift rate)
    this.metrics.groundedness = this.clamp(
      100 - (this.emotionalDrift.driftRate * 10),
      0,
      100
    );
    
    // Calculate consistency score from timeline
    const trajectoryBonus = timeline.overallTrajectory === 'stable' ? 20 :
                            timeline.overallTrajectory === 'maturing' ? 10 : 0;
    
    this.metrics.consistencyScore = this.clamp(
      genome.stability + trajectoryBonus,
      0,
      100
    );
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
      const state = {
        emotionalDrift: this.emotionalDrift,
        boundaries: this.boundaries,
        anomalies: this.anomalies,
        metrics: this.metrics,
        previousGenome: this.previousGenome
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.warn('[StabilityCore] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const state = JSON.parse(stored);
        this.emotionalDrift = state.emotionalDrift || this.emotionalDrift;
        this.boundaries = state.boundaries || this.boundaries;
        this.anomalies = state.anomalies || [];
        this.metrics = state.metrics || this.metrics;
        this.previousGenome = state.previousGenome || null;
      }
    } catch (error) {
      console.warn('[StabilityCore] Failed to load:', error);
    }
  }
}
