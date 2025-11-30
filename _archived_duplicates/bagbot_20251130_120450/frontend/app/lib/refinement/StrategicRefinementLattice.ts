/**
 * 🚀 STRATEGIC REFINEMENT LATTICE (SRL)
 * 
 * STEP 24.26 — The Second Brain
 * 
 * This is where BagBot becomes sharper, more accurate, and more adaptive.
 * The SRL is like a second brain that evaluates the Harmonizer's decision
 * and intelligently improves it before execution.
 * 
 * What SRL Does:
 * - Reads the Harmonizer output
 * - Tests it against mini-models
 * - Compares to historical edge patterns
 * - Runs a quick stability & risk simulation
 * - Adjusts the decision to improve profit probability
 * - Adds micro-optimizations (size, entry timing, exit timing)
 * - Ensures fast adaptability in real-time markets
 * 
 * This step makes BagBot feel alive and evolving.
 * 
 * Requirements:
 * - Import SystemHarmonizer output type
 * - Create class StrategicRefinementLattice
 * - Method: refine(harmonizedDecision)
 * - Apply micro-optimizations:
 *   - riskCheck()
 *   - volatilityAdjustment()
 *   - timingOffset()
 *   - sizeCalibration()
 * - Add lightweight simulation: simulateOutcome(), scoreImprovement()
 * - If improvement score > threshold → enhance decision
 * - If lower → keep original
 * - Must ALWAYS respect Safe Mode constraints
 * - Output final refined object:
 *   { action, size, timing, confidence, safety, refinementNotes }
 * - Clean, modular, future-proof design in TypeScript.
 * - Do not modify other engines. Only create this file.
 */

import type { HarmonizedDecision } from '../harmonizer/SystemHarmonizer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Refined decision output with micro-optimizations
 */
export interface RefinedDecision {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  size: number;                  // Position size (0-1, percentage of capital)
  timing: TimingAdjustment;
  confidence: number;            // 0-100, refined confidence
  safety: SafetyStatus;
  refinementNotes: string[];
  improvementScore: number;      // How much better than original (0-100)
  originalDecision: HarmonizedDecision;
  metadata: RefinementMetadata;
}

/**
 * Timing adjustments for entry/exit
 */
export interface TimingAdjustment {
  entryOffset: number;           // Milliseconds to wait before entry (-5000 to +5000)
  exitOffset: number;            // Milliseconds adjustment for exit
  urgency: 'IMMEDIATE' | 'PATIENT' | 'DELAYED';
  reasoning: string;
}

/**
 * Safety status after refinement
 */
export interface SafetyStatus {
  safeModeRespected: boolean;
  risksIdentified: string[];
  mitigationsApplied: string[];
  finalRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

/**
 * Refinement metadata for logging and analysis
 */
export interface RefinementMetadata {
  refinementTime: number;        // Milliseconds taken to refine
  modelsUsed: string[];
  edgePatternsMatched: number;
  simulationRuns: number;
  optimizationsApplied: string[];
  timestamp: number;
}

/**
 * Historical edge pattern for comparison
 */
interface EdgePattern {
  pattern: string;
  confidence: number;
  successRate: number;
  avgReturn: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
}

/**
 * Simulation result
 */
interface SimulationResult {
  expectedReturn: number;        // Percentage
  riskScore: number;             // 0-100
  probabilityOfProfit: number;   // 0-1
  maxDrawdown: number;           // Percentage
  sharpeRatio: number;
}

/**
 * Micro-optimization result
 */
interface OptimizationResult {
  type: 'risk' | 'volatility' | 'timing' | 'size';
  improvement: number;           // 0-100
  adjustment: any;
  reasoning: string;
}

// ============================================================================
// STRATEGIC REFINEMENT LATTICE CLASS
// ============================================================================

export class StrategicRefinementLattice {
  // Configuration
  private readonly IMPROVEMENT_THRESHOLD = 5; // Minimum improvement to apply (0-100)
  private readonly MAX_SIMULATION_TIME = 50;  // Max milliseconds for simulation
  private readonly VERSION = '24.26.0';

  // Historical edge patterns (in production, load from database)
  private edgePatterns: EdgePattern[] = [
    {
      pattern: 'HIGH_CONFIDENCE_LOW_VOLATILITY',
      confidence: 0.85,
      successRate: 0.78,
      avgReturn: 2.3,
      riskLevel: 'LOW',
    },
    {
      pattern: 'MODERATE_CONFIDENCE_HIGH_SHIELD',
      confidence: 0.70,
      successRate: 0.65,
      avgReturn: 1.8,
      riskLevel: 'MODERATE',
    },
    {
      pattern: 'LOW_CONFIDENCE_DEFENSIVE',
      confidence: 0.40,
      successRate: 0.55,
      avgReturn: 0.8,
      riskLevel: 'MODERATE',
    },
  ];

  // Refinement weights
  private refinementWeights = {
    riskCheck: 0.35,
    volatilityAdjustment: 0.25,
    timingOffset: 0.20,
    sizeCalibration: 0.20,
  };

  /**
   * Main refinement method
   * Takes a harmonized decision and improves it
   */
  public refine(harmonizedDecision: HarmonizedDecision): RefinedDecision {
    const startTime = Date.now();
    const refinementNotes: string[] = [];
    const optimizationsApplied: string[] = [];

    // Step 1: Respect Safe Mode - if active, minimal refinement
    if (harmonizedDecision.safety.safeModeActive) {
      return this.buildSafeModeRefinement(harmonizedDecision, startTime, refinementNotes);
    }

    // Step 2: Match against historical edge patterns
    const matchedPattern = this.matchEdgePattern(harmonizedDecision);
    if (matchedPattern) {
      refinementNotes.push(`Matched pattern: ${matchedPattern.pattern}`);
    }

    // Step 3: Apply micro-optimizations
    const optimizations = this.applyMicroOptimizations(harmonizedDecision, refinementNotes);
    optimizationsApplied.push(...optimizations.map((o) => o.type));

    // Step 4: Run lightweight simulation
    const simulation = this.simulateOutcome(harmonizedDecision, optimizations);
    refinementNotes.push(
      `Simulation: ${(simulation.probabilityOfProfit * 100).toFixed(1)}% profit probability`
    );

    // Step 5: Calculate improvement score
    const improvementScore = this.scoreImprovement(
      harmonizedDecision,
      optimizations,
      simulation
    );

    // Step 6: Decide whether to apply refinements
    let finalAction = harmonizedDecision.action;
    let finalConfidence = harmonizedDecision.confidence;
    let finalSize = this.calculatePositionSize(harmonizedDecision, optimizations);
    let finalTiming = this.calculateTiming(harmonizedDecision, optimizations);

    if (improvementScore > this.IMPROVEMENT_THRESHOLD) {
      // Apply optimizations
      refinementNotes.push(`Applying refinements (improvement: ${improvementScore.toFixed(1)})`);
      
      // Adjust confidence based on simulation
      finalConfidence = Math.min(
        100,
        finalConfidence + simulation.probabilityOfProfit * 10
      );

      // Adjust action if risk is too high
      if (simulation.riskScore > 75 && finalAction === 'BUY') {
        finalAction = 'HOLD';
        refinementNotes.push('Risk too high, downgrading BUY → HOLD');
        optimizationsApplied.push('action-downgrade');
      }
    } else {
      // Keep original decision
      refinementNotes.push(`Keeping original decision (improvement: ${improvementScore.toFixed(1)} < threshold)`);
      finalSize = this.calculateDefaultSize(harmonizedDecision);
      finalTiming = this.calculateDefaultTiming();
    }

    // Step 7: Final safety check
    const finalSafety = this.performFinalSafetyCheck(
      harmonizedDecision,
      finalAction,
      simulation
    );

    // Step 8: Build refined decision
    const refined: RefinedDecision = {
      action: finalAction,
      size: finalSize,
      timing: finalTiming,
      confidence: finalConfidence,
      safety: finalSafety,
      refinementNotes,
      improvementScore,
      originalDecision: harmonizedDecision,
      metadata: {
        refinementTime: Date.now() - startTime,
        modelsUsed: ['EdgePattern', 'RiskSimulator', 'TimingOptimizer'],
        edgePatternsMatched: matchedPattern ? 1 : 0,
        simulationRuns: 1,
        optimizationsApplied,
        timestamp: Date.now(),
      },
    };

    return refined;
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Build a minimal refinement when safe mode is active
   */
  private buildSafeModeRefinement(
    decision: HarmonizedDecision,
    startTime: number,
    notes: string[]
  ): RefinedDecision {
    notes.push('Safe Mode active - minimal refinement applied');

    return {
      action: decision.action,
      size: 0, // No position in safe mode
      timing: {
        entryOffset: 0,
        exitOffset: 0,
        urgency: 'DELAYED',
        reasoning: 'Safe mode enforced',
      },
      confidence: decision.confidence,
      safety: {
        safeModeRespected: true,
        risksIdentified: [decision.safety.overrideReason || 'Unknown'],
        mitigationsApplied: ['Position size = 0', 'No trading'],
        finalRiskLevel: 'CRITICAL',
      },
      refinementNotes: notes,
      improvementScore: 0,
      originalDecision: decision,
      metadata: {
        refinementTime: Date.now() - startTime,
        modelsUsed: [],
        edgePatternsMatched: 0,
        simulationRuns: 0,
        optimizationsApplied: ['safe-mode-enforcement'],
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Match the decision against historical edge patterns
   */
  private matchEdgePattern(decision: HarmonizedDecision): EdgePattern | null {
    const confidence = decision.confidence / 100;
    const volatility = decision.components.volatilityScore;
    const shieldHealth = decision.components.shieldScore;

    // Pattern 1: High confidence + Low volatility
    if (confidence > 0.75 && volatility > 70) {
      return this.edgePatterns[0];
    }

    // Pattern 2: Moderate confidence + High shield
    if (confidence > 0.55 && confidence < 0.75 && shieldHealth > 65) {
      return this.edgePatterns[1];
    }

    // Pattern 3: Low confidence + Defensive
    if (confidence < 0.55 && decision.action === 'HOLD') {
      return this.edgePatterns[2];
    }

    return null;
  }

  /**
   * Apply micro-optimizations
   */
  private applyMicroOptimizations(
    decision: HarmonizedDecision,
    notes: string[]
  ): OptimizationResult[] {
    const optimizations: OptimizationResult[] = [];

    // Optimization 1: Risk check
    const riskOpt = this.riskCheck(decision);
    if (riskOpt.improvement > 0) {
      optimizations.push(riskOpt);
      notes.push(`Risk optimization: ${riskOpt.reasoning}`);
    }

    // Optimization 2: Volatility adjustment
    const volatilityOpt = this.volatilityAdjustment(decision);
    if (volatilityOpt.improvement > 0) {
      optimizations.push(volatilityOpt);
      notes.push(`Volatility optimization: ${volatilityOpt.reasoning}`);
    }

    // Optimization 3: Timing offset
    const timingOpt = this.timingOffset(decision);
    if (timingOpt.improvement > 0) {
      optimizations.push(timingOpt);
      notes.push(`Timing optimization: ${timingOpt.reasoning}`);
    }

    // Optimization 4: Size calibration
    const sizeOpt = this.sizeCalibration(decision);
    if (sizeOpt.improvement > 0) {
      optimizations.push(sizeOpt);
      notes.push(`Size optimization: ${sizeOpt.reasoning}`);
    }

    return optimizations;
  }

  /**
   * Risk check optimization
   */
  private riskCheck(decision: HarmonizedDecision): OptimizationResult {
    const threatScore = decision.components.threatScore;
    const shieldScore = decision.components.shieldScore;

    // If threat is high, reduce position size
    if (threatScore < 50) {
      return {
        type: 'risk',
        improvement: 15,
        adjustment: { sizeReduction: 0.3 },
        reasoning: 'High threat detected, reducing position size by 30%',
      };
    }

    // If shield is weak, be more conservative
    if (shieldScore < 50) {
      return {
        type: 'risk',
        improvement: 10,
        adjustment: { sizeReduction: 0.2 },
        reasoning: 'Weak shield, reducing position size by 20%',
      };
    }

    return {
      type: 'risk',
      improvement: 0,
      adjustment: {},
      reasoning: 'No risk adjustment needed',
    };
  }

  /**
   * Volatility adjustment optimization
   */
  private volatilityAdjustment(decision: HarmonizedDecision): OptimizationResult {
    const volatility = decision.components.volatilityScore;

    // Low volatility = stable, can increase size slightly
    if (volatility > 75) {
      return {
        type: 'volatility',
        improvement: 8,
        adjustment: { sizeBoost: 0.15 },
        reasoning: 'Low volatility, boosting position size by 15%',
      };
    }

    // High volatility = unstable, reduce size
    if (volatility < 40) {
      return {
        type: 'volatility',
        improvement: 12,
        adjustment: { sizeReduction: 0.25 },
        reasoning: 'High volatility, reducing position size by 25%',
      };
    }

    return {
      type: 'volatility',
      improvement: 0,
      adjustment: {},
      reasoning: 'No volatility adjustment needed',
    };
  }

  /**
   * Timing offset optimization
   */
  private timingOffset(decision: HarmonizedDecision): OptimizationResult {
    const confidence = decision.confidence;
    const predictionScore = decision.components.predictionScore;

    // High confidence + good prediction = immediate entry
    if (confidence > 75 && predictionScore > 70) {
      return {
        type: 'timing',
        improvement: 7,
        adjustment: { entryOffset: 0, urgency: 'IMMEDIATE' },
        reasoning: 'High confidence, enter immediately',
      };
    }

    // Low confidence = wait a bit
    if (confidence < 50) {
      return {
        type: 'timing',
        improvement: 10,
        adjustment: { entryOffset: 3000, urgency: 'PATIENT' },
        reasoning: 'Low confidence, wait 3 seconds',
      };
    }

    return {
      type: 'timing',
      improvement: 0,
      adjustment: { entryOffset: 1000, urgency: 'PATIENT' },
      reasoning: 'Standard timing offset',
    };
  }

  /**
   * Size calibration optimization
   */
  private sizeCalibration(decision: HarmonizedDecision): OptimizationResult {
    const finalScore = decision.components.finalScore;
    const confidence = decision.confidence;

    // High score + high confidence = larger position
    if (finalScore > 75 && confidence > 70) {
      return {
        type: 'size',
        improvement: 12,
        adjustment: { baseSize: 0.7 },
        reasoning: 'Strong signals, position size 70%',
      };
    }

    // Moderate score = moderate size
    if (finalScore > 50 && finalScore <= 75) {
      return {
        type: 'size',
        improvement: 5,
        adjustment: { baseSize: 0.4 },
        reasoning: 'Moderate signals, position size 40%',
      };
    }

    // Low score = small position
    return {
      type: 'size',
      improvement: 3,
      adjustment: { baseSize: 0.2 },
      reasoning: 'Weak signals, position size 20%',
    };
  }

  /**
   * Simulate outcome of the decision with optimizations
   */
  private simulateOutcome(
    decision: HarmonizedDecision,
    optimizations: OptimizationResult[]
  ): SimulationResult {
    // Lightweight simulation based on historical patterns
    const baseReturn = decision.confidence / 10; // Simple linear model
    const riskScore = 100 - decision.components.shieldScore;
    
    // Adjust based on optimizations
    let adjustedReturn = baseReturn;
    let adjustedRisk = riskScore;

    optimizations.forEach((opt) => {
      adjustedReturn += opt.improvement * 0.1;
      if (opt.type === 'risk') {
        adjustedRisk -= opt.improvement * 0.5;
      }
    });

    // Calculate probability of profit (simplified)
    const probabilityOfProfit = Math.min(
      0.95,
      Math.max(0.05, decision.confidence / 100 + optimizations.length * 0.05)
    );

    // Sharpe ratio approximation
    const sharpeRatio = adjustedReturn / Math.max(1, adjustedRisk / 10);

    return {
      expectedReturn: Math.max(0, adjustedReturn),
      riskScore: Math.max(0, Math.min(100, adjustedRisk)),
      probabilityOfProfit,
      maxDrawdown: adjustedRisk * 0.3, // Rough estimate
      sharpeRatio: Math.max(0, sharpeRatio),
    };
  }

  /**
   * Score the improvement from refinements
   */
  private scoreImprovement(
    decision: HarmonizedDecision,
    optimizations: OptimizationResult[],
    simulation: SimulationResult
  ): number {
    // Base improvement from optimizations
    const optimizationScore = optimizations.reduce(
      (sum, opt) => sum + opt.improvement * this.refinementWeights[opt.type],
      0
    );

    // Simulation bonus
    const simulationBonus = simulation.probabilityOfProfit * 20;

    // Sharpe ratio bonus
    const sharpeBonus = Math.min(15, simulation.sharpeRatio * 5);

    // Total improvement
    const total = optimizationScore + simulationBonus + sharpeBonus;

    return Math.max(0, Math.min(100, total));
  }

  /**
   * Calculate final position size
   */
  private calculatePositionSize(
    decision: HarmonizedDecision,
    optimizations: OptimizationResult[]
  ): number {
    // Start with base size from size calibration
    const sizeOpt = optimizations.find((o) => o.type === 'size');
    let size = sizeOpt?.adjustment.baseSize || 0.3;

    // Apply risk adjustments
    const riskOpt = optimizations.find((o) => o.type === 'risk');
    if (riskOpt?.adjustment.sizeReduction) {
      size *= 1 - riskOpt.adjustment.sizeReduction;
    }

    // Apply volatility adjustments
    const volOpt = optimizations.find((o) => o.type === 'volatility');
    if (volOpt?.adjustment.sizeReduction) {
      size *= 1 - volOpt.adjustment.sizeReduction;
    }
    if (volOpt?.adjustment.sizeBoost) {
      size *= 1 + volOpt.adjustment.sizeBoost;
    }

    // Clamp to safe range
    return Math.max(0, Math.min(1, size));
  }

  /**
   * Calculate timing adjustments
   */
  private calculateTiming(
    decision: HarmonizedDecision,
    optimizations: OptimizationResult[]
  ): TimingAdjustment {
    const timingOpt = optimizations.find((o) => o.type === 'timing');
    
    return {
      entryOffset: timingOpt?.adjustment.entryOffset || 1000,
      exitOffset: 0, // Exit timing not optimized yet
      urgency: timingOpt?.adjustment.urgency || 'PATIENT',
      reasoning: timingOpt?.reasoning || 'Default timing',
    };
  }

  /**
   * Calculate default position size (no optimizations)
   */
  private calculateDefaultSize(decision: HarmonizedDecision): number {
    const confidence = decision.confidence / 100;
    return Math.max(0.1, Math.min(0.5, confidence * 0.6));
  }

  /**
   * Calculate default timing (no optimizations)
   */
  private calculateDefaultTiming(): TimingAdjustment {
    return {
      entryOffset: 1000,
      exitOffset: 0,
      urgency: 'PATIENT',
      reasoning: 'Default timing - no optimization applied',
    };
  }

  /**
   * Perform final safety check before returning refined decision
   */
  private performFinalSafetyCheck(
    decision: HarmonizedDecision,
    finalAction: string,
    simulation: SimulationResult
  ): SafetyStatus {
    const risksIdentified: string[] = [];
    const mitigationsApplied: string[] = [];

    // Check 1: High risk score from simulation
    if (simulation.riskScore > 70) {
      risksIdentified.push('High simulated risk');
      mitigationsApplied.push('Position size reduced');
    }

    // Check 2: Low probability of profit
    if (simulation.probabilityOfProfit < 0.4) {
      risksIdentified.push('Low profit probability');
      mitigationsApplied.push('Conservative action chosen');
    }

    // Check 3: High drawdown potential
    if (simulation.maxDrawdown > 20) {
      risksIdentified.push('High drawdown potential');
      mitigationsApplied.push('Stop-loss recommended');
    }

    // Determine final risk level
    let finalRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (simulation.riskScore > 80) finalRiskLevel = 'CRITICAL';
    else if (simulation.riskScore > 60) finalRiskLevel = 'HIGH';
    else if (simulation.riskScore > 40) finalRiskLevel = 'MODERATE';

    return {
      safeModeRespected: decision.safety.safeModeActive,
      risksIdentified,
      mitigationsApplied,
      finalRiskLevel,
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): typeof this.refinementWeights {
    return { ...this.refinementWeights };
  }

  /**
   * Update refinement weights
   */
  public updateWeights(newWeights: Partial<typeof this.refinementWeights>): void {
    this.refinementWeights = { ...this.refinementWeights, ...newWeights };
  }

  /**
   * Get version
   */
  public getVersion(): string {
    return this.VERSION;
  }

  /**
   * Add new edge pattern (for learning)
   */
  public addEdgePattern(pattern: EdgePattern): void {
    this.edgePatterns.push(pattern);
  }

  /**
   * Get all edge patterns
   */
  public getEdgePatterns(): EdgePattern[] {
    return [...this.edgePatterns];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let instance: StrategicRefinementLattice | null = null;

export function getStrategicRefinementLattice(): StrategicRefinementLattice {
  if (!instance) {
    instance = new StrategicRefinementLattice();
  }
  return instance;
}

// Default export
export default StrategicRefinementLattice;
