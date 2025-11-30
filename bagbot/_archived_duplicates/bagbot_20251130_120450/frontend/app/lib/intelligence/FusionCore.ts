/**
 * FusionCore - Cross-Engine Fusion Layer
 * 
 * Unifies all intelligence engines into single decision-making system.
 * Handles conflict resolution, weight management, and unified output generation.
 */

import type {
  FusionMatrix,
  AnyEngineResult,
} from './fusionMatrix';

import {
  createFusionMatrix,
  shouldHalt,
  hasHighConfidence,
  getMatrixQuality,
  mergeMatrixWithWeights,
  getDefensiveSignals,
  getOffensiveSignals,
} from './fusionMatrix';

import type {
  FusionWeights,
  WeightContext,
} from './fusionWeights';

import {
  calculateFusionWeights,
  determineMarketCondition,
  explainWeights,
} from './fusionWeights';

/**
 * Unified fusion decision
 */
export interface FusionDecision {
  // Final decision
  action: "BUY" | "SELL" | "HOLD" | "CLOSE" | "REDUCE" | "HALT" | "WAIT";
  confidence: number;          // 0-100
  reason: string;
  
  // Supporting data
  engines: Record<string, AnyEngineResult>;
  matrix: FusionMatrix;
  weights: FusionWeights;
  
  // Metadata
  conflictResolution: {
    hadConflicts: boolean;
    conflictsResolved: number;
    resolutionMethod: string;
  };
  
  qualityMetrics: {
    matrixQuality: number;
    signalStrength: number;
    consensusLevel: number;
    riskLevel: string;
  };
  
  timestamp: number;
}

/**
 * Fusion summary - high-level overview
 */
export interface FusionSummary {
  decision: FusionDecision;
  
  // Key insights
  insights: string[];
  warnings: string[];
  opportunities: string[];
  
  // Engine contributions
  topContributors: Array<{
    engine: string;
    contribution: number;
    reason: string;
  }>;
  
  // Market context
  marketCondition: string;
  volatilityLevel: number;
  riskLevel: string;
  
  // Recommendation
  recommendation: string;
  alternativeActions: Array<{
    action: string;
    score: number;
    reason: string;
  }>;
}

/**
 * Engine registry
 */
interface EngineRegistry {
  [key: string]: any;  // Actual engine instances
}

/**
 * FusionCore class
 */
export class FusionCore {
  private engines: EngineRegistry = {};
  private lastMatrix: FusionMatrix | null = null;
  private lastWeights: FusionWeights | null = null;
  private lastDecision: FusionDecision | null = null;
  
  constructor() {
    console.log('[FusionCore] Initialized');
  }
  
  /**
   * Inject engine instances
   */
  injectEngines(engines: EngineRegistry): void {
    this.engines = { ...engines };
    console.log('[FusionCore] Engines injected:', Object.keys(this.engines));
  }
  
  /**
   * Main fusion operation - combine all engines
   */
  fuse(snapshot: any, context?: Partial<WeightContext>): FusionDecision {
    console.log('[FusionCore] Starting fusion...');
    
    // Step 1: Collect results from all engines
    const results = this.collectEngineResults(snapshot);
    
    // Step 2: Create fusion matrix
    const matrix = createFusionMatrix(results);
    this.lastMatrix = matrix;
    
    // Step 3: Calculate dynamic weights
    const weightContext = this.buildWeightContext(matrix, context);
    const weights = calculateFusionWeights(weightContext);
    this.lastWeights = weights;
    
    // Step 4: Check for immediate halt conditions
    if (shouldHalt(matrix)) {
      return this.createHaltDecision(matrix, weights, "Critical conditions detected");
    }
    
    // Step 5: Resolve conflicts
    const conflictResolution = this.resolveConflicts(matrix, weights);
    
    // Step 6: Generate unified decision
    const decision = this.generateUnifiedDecision(matrix, weights, conflictResolution);
    
    this.lastDecision = decision;
    
    console.log('[FusionCore] Fusion complete:', decision.action, `(${decision.confidence}%)`);
    
    return decision;
  }
  
  /**
   * Collect results from all engines
   */
  private collectEngineResults(snapshot: any): AnyEngineResult[] {
    const results: AnyEngineResult[] = [];
    
    // Note: This is a simplified version. In production, each engine
    // would have its own method to generate a result from the snapshot.
    
    Object.entries(this.engines).forEach(([name, engine]) => {
      try {
        // Call engine's analyze/evaluate method
        const result = engine.analyze ? engine.analyze(snapshot) : null;
        
        if (result) {
          results.push({
            ...result,
            engineName: name,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error(`[FusionCore] Error collecting result from ${name}:`, error);
      }
    });
    
    return results;
  }
  
  /**
   * Build weight context from matrix and external context
   */
  private buildWeightContext(
    matrix: FusionMatrix,
    externalContext?: Partial<WeightContext>
  ): WeightContext {
    // Extract confidence levels from matrix
    const confidenceLevels: Record<string, number> = {};
    Object.entries(matrix.engines).forEach(([name, result]) => {
      if (result) {
        confidenceLevels[name] = result.confidence;
      }
    });
    
    // Determine market condition
    const volatilityLevel = matrix.engines.volatility?.severity || 50;
    const riskEngine = matrix.engines.risk;
    const riskLevel = riskEngine?.riskLevel || 
      (matrix.aggregated.overallRisk > 75 ? "HIGH" : 
       matrix.aggregated.overallRisk > 50 ? "MEDIUM" : "LOW");
    
    const marketCondition = externalContext?.marketCondition || 
      determineMarketCondition({ volatilityLevel, riskLevel });
    
    // Determine time of day (simplified)
    const hour = new Date().getHours();
    let timeOfDay: "ASIAN" | "EUROPEAN" | "US" | "OVERNIGHT";
    if (hour >= 0 && hour < 8) timeOfDay = "ASIAN";
    else if (hour >= 8 && hour < 13) timeOfDay = "EUROPEAN";
    else if (hour >= 13 && hour < 20) timeOfDay = "US";
    else timeOfDay = "OVERNIGHT";
    
    return {
      marketCondition,
      volatilityLevel,
      riskLevel: riskLevel as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      confidenceLevels,
      recentAccuracy: externalContext?.recentAccuracy || {},
      timeOfDay: externalContext?.timeOfDay || timeOfDay,
    };
  }
  
  /**
   * Resolve conflicts between engines
   */
  resolveConflicts(matrix: FusionMatrix, weights: FusionWeights): {
    hadConflicts: boolean;
    conflictsResolved: number;
    resolutionMethod: string;
    resolvedAction: string | null;
  } {
    if (matrix.conflicts.length === 0) {
      return {
        hadConflicts: false,
        conflictsResolved: 0,
        resolutionMethod: "no_conflicts",
        resolvedAction: null,
      };
    }
    
    console.log(`[FusionCore] Resolving ${matrix.conflicts.length} conflicts...`);
    
    // Resolution strategy:
    // 1. Shield override - if shield blocks, always respect it
    // 2. Volatility warning - if volatility says halt, prioritize safety
    // 3. Threat warning - high threats override aggressive actions
    // 4. Weighted voting - use weights to break ties
    
    let resolutionMethod = "weighted_voting";
    let resolvedAction: string | null = null;
    
    // Check for shield override
    const shieldConflict = matrix.conflicts.find(c => c.conflictType === "shield_override");
    if (shieldConflict) {
      resolutionMethod = "shield_override";
      resolvedAction = "HOLD";
      console.log('[FusionCore] Shield override - forcing HOLD');
    }
    
    // Check for volatility warning
    if (!resolvedAction) {
      const volatilityConflict = matrix.conflicts.find(c => c.conflictType === "volatility_warning");
      if (volatilityConflict && matrix.engines.volatility?.severity > 80) {
        resolutionMethod = "volatility_halt";
        resolvedAction = "HALT";
        console.log('[FusionCore] High volatility - forcing HALT');
      }
    }
    
    // Check for threat warning
    if (!resolvedAction) {
      const threatConflict = matrix.conflicts.find(c => c.conflictType === "threat_warning");
      if (threatConflict && matrix.engines.threat && matrix.engines.threat.overallThreatScore > 80) {
        resolutionMethod = "threat_override";
        resolvedAction = "HOLD";
        console.log('[FusionCore] High threat - forcing HOLD');
      }
    }
    
    // Use weighted voting for remaining conflicts
    if (!resolvedAction) {
      const merged = mergeMatrixWithWeights(matrix, weights);
      resolvedAction = merged.weightedAction;
      console.log('[FusionCore] Weighted voting resolved to:', resolvedAction);
    }
    
    return {
      hadConflicts: true,
      conflictsResolved: matrix.conflicts.length,
      resolutionMethod,
      resolvedAction,
    };
  }
  
  /**
   * Generate unified decision from matrix and weights
   */
  generateUnifiedDecision(
    matrix: FusionMatrix,
    weights: FusionWeights,
    conflictResolution: ReturnType<typeof FusionCore.prototype.resolveConflicts>
  ): FusionDecision {
    // Merge matrix with weights
    const merged = mergeMatrixWithWeights(matrix, weights);
    
    // Use resolved action if conflicts were found
    const finalAction = conflictResolution.resolvedAction || merged.weightedAction;
    
    // Calculate final confidence
    let confidence = merged.weightedConfidence;
    
    // Adjust confidence based on conflicts
    if (conflictResolution.hadConflicts) {
      confidence *= 0.8;  // Reduce confidence by 20% if conflicts exist
    }
    
    // Adjust confidence based on consensus
    if (matrix.aggregated.consensusStrength < 60) {
      confidence *= 0.9;  // Reduce confidence by 10% for low consensus
    }
    
    // Generate reason
    const reason = this.generateReason(matrix, merged, conflictResolution);
    
    // Build quality metrics
    const qualityMetrics = {
      matrixQuality: getMatrixQuality(matrix),
      signalStrength: Math.round(merged.weightedConfidence),
      consensusLevel: matrix.aggregated.consensusStrength,
      riskLevel: matrix.engines.risk?.riskLevel || "MEDIUM",
    };
    
    // Create decision
    const decision: FusionDecision = {
      action: finalAction as any,
      confidence: Math.round(confidence),
      reason,
      engines: matrix.engines as any,
      matrix,
      weights,
      conflictResolution: {
        hadConflicts: conflictResolution.hadConflicts,
        conflictsResolved: conflictResolution.conflictsResolved,
        resolutionMethod: conflictResolution.resolutionMethod,
      },
      qualityMetrics,
      timestamp: Date.now(),
    };
    
    return decision;
  }
  
  /**
   * Generate human-readable reason
   */
  private generateReason(
    matrix: FusionMatrix,
    merged: ReturnType<typeof mergeMatrixWithWeights>,
    conflictResolution: ReturnType<typeof FusionCore.prototype.resolveConflicts>
  ): string {
    const reasons: string[] = [];
    
    // Add consensus info
    if (matrix.aggregated.consensusStrength > 70) {
      reasons.push(`Strong consensus (${matrix.aggregated.consensusStrength}%) for ${matrix.aggregated.consensusAction}`);
    }
    
    // Add top contributors
    const topContributors = merged.contributions.slice(0, 3);
    const contributorNames = topContributors.map(c => c.engine).join(', ');
    reasons.push(`Top contributors: ${contributorNames}`);
    
    // Add conflict resolution if applicable
    if (conflictResolution.hadConflicts) {
      reasons.push(`Resolved ${conflictResolution.conflictsResolved} conflicts via ${conflictResolution.resolutionMethod}`);
    }
    
    // Add defensive signals if present
    const defensive = getDefensiveSignals(matrix);
    if (defensive.length > 0 && defensive.some(d => d.priority === "CRITICAL")) {
      reasons.push('⚠️ Critical defensive signals detected');
    }
    
    return reasons.join('; ');
  }
  
  /**
   * Create halt decision
   */
  private createHaltDecision(
    matrix: FusionMatrix,
    weights: FusionWeights,
    reason: string
  ): FusionDecision {
    return {
      action: "HALT",
      confidence: 100,
      reason,
      engines: matrix.engines as any,
      matrix,
      weights,
      conflictResolution: {
        hadConflicts: false,
        conflictsResolved: 0,
        resolutionMethod: "immediate_halt",
      },
      qualityMetrics: {
        matrixQuality: getMatrixQuality(matrix),
        signalStrength: 100,
        consensusLevel: 100,
        riskLevel: "CRITICAL",
      },
      timestamp: Date.now(),
    };
  }
  
  /**
   * Get comprehensive fusion summary
   */
  getFusionSummary(): FusionSummary {
    if (!this.lastDecision || !this.lastMatrix || !this.lastWeights) {
      throw new Error('[FusionCore] No fusion data available. Run fuse() first.');
    }
    
    const decision = this.lastDecision;
    const matrix = this.lastMatrix;
    const weights = this.lastWeights;
    
    // Generate insights
    const insights = this.generateInsights(matrix);
    const warnings = this.generateWarnings(matrix);
    const opportunities = this.generateOpportunities(matrix);
    
    // Get top contributors
    const merged = mergeMatrixWithWeights(matrix, weights);
    const topContributors = merged.contributions.slice(0, 5).map(c => ({
      engine: c.engine,
      contribution: c.contribution,
      reason: (matrix.engines as any)[c.engine]?.reason || 'N/A',
    }));
    
    // Market context
    const marketCondition = determineMarketCondition({
      volatilityLevel: matrix.engines.volatility?.severity || 50,
      riskLevel: decision.qualityMetrics.riskLevel as any,
    });
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(decision, matrix);
    
    // Calculate alternative actions
    const alternativeActions = this.calculateAlternatives(matrix, weights);
    
    const summary: FusionSummary = {
      decision,
      insights,
      warnings,
      opportunities,
      topContributors,
      marketCondition,
      volatilityLevel: matrix.engines.volatility?.severity || 50,
      riskLevel: decision.qualityMetrics.riskLevel,
      recommendation,
      alternativeActions,
    };
    
    return summary;
  }
  
  /**
   * Generate insights from matrix
   */
  private generateInsights(matrix: FusionMatrix): string[] {
    const insights: string[] = [];
    
    if (matrix.aggregated.signalQuality > 80) {
      insights.push('Excellent signal quality across all engines');
    }
    
    if (matrix.aggregated.consensusStrength > 80) {
      insights.push('High consensus among engines - strong conviction');
    }
    
    const defensive = getDefensiveSignals(matrix);
    const offensive = getOffensiveSignals(matrix);
    
    if (defensive.every(d => d.confidence > 70)) {
      insights.push('All defensive systems showing high confidence');
    }
    
    if (offensive.every(o => o.confidence > 70)) {
      insights.push('All offensive systems aligned - favorable conditions');
    }
    
    return insights;
  }
  
  /**
   * Generate warnings from matrix
   */
  private generateWarnings(matrix: FusionMatrix): string[] {
    const warnings: string[] = [];
    
    if (matrix.engines.shield?.shieldActive) {
      warnings.push('⚠️ Shield is active - trading restricted');
    }
    
    if (matrix.engines.volatility?.severity > 75) {
      warnings.push('⚠️ High volatility detected');
    }
    
    if (matrix.engines.threat && matrix.engines.threat.overallThreatScore > 70) {
      warnings.push('⚠️ Elevated threat level');
    }
    
    if (matrix.conflicts.length > 2) {
      warnings.push('⚠️ Multiple engine conflicts detected');
    }
    
    if (matrix.aggregated.consensusStrength < 40) {
      warnings.push('⚠️ Low consensus - uncertain conditions');
    }
    
    return warnings;
  }
  
  /**
   * Generate opportunities from matrix
   */
  private generateOpportunities(matrix: FusionMatrix): string[] {
    const opportunities: string[] = [];
    
    if (matrix.engines.prediction && matrix.engines.prediction.confidence > 75) {
      opportunities.push('Strong prediction signal detected');
    }
    
    if (matrix.engines.flow && matrix.engines.flow.flowScore > 75) {
      opportunities.push('Favorable market flow conditions');
    }
    
    if (matrix.engines.pattern && matrix.engines.pattern.patternStrength > 75) {
      opportunities.push('High-probability pattern identified');
    }
    
    if (matrix.aggregated.overallRisk < 30 && matrix.aggregated.avgConfidence > 70) {
      opportunities.push('Low risk, high confidence environment');
    }
    
    return opportunities;
  }
  
  /**
   * Generate recommendation text
   */
  private generateRecommendation(decision: FusionDecision, matrix: FusionMatrix): string {
    if (decision.action === "HALT") {
      return "HALT all trading - critical conditions detected. Wait for conditions to normalize.";
    }
    
    if (decision.confidence > 80 && decision.qualityMetrics.consensusLevel > 70) {
      return `Strong ${decision.action} signal with high confidence. Proceed with recommended action.`;
    }
    
    if (decision.confidence < 50 || matrix.conflicts.length > 2) {
      return "Low confidence or conflicting signals. Consider waiting for clearer conditions.";
    }
    
    return `Moderate ${decision.action} signal. Proceed with caution and appropriate risk management.`;
  }
  
  /**
   * Calculate alternative actions
   */
  private calculateAlternatives(matrix: FusionMatrix, weights: FusionWeights): FusionSummary['alternativeActions'] {
    const alternatives: FusionSummary['alternativeActions'] = [];
    
    // Score each possible action
    Object.entries(matrix.actionDistribution).forEach(([action, count]) => {
      if (count === 0) return;
      
      // Calculate score based on count and weighted confidence
      const score = (count / Object.values(matrix.engines).length) * 100;
      
      alternatives.push({
        action,
        score: Math.round(score),
        reason: `${count} engines support this action`,
      });
    });
    
    return alternatives.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Get last decision
   */
  getLastDecision(): FusionDecision | null {
    return this.lastDecision;
  }
  
  /**
   * Get last matrix
   */
  getLastMatrix(): FusionMatrix | null {
    return this.lastMatrix;
  }
  
  /**
   * Get last weights
   */
  getLastWeights(): FusionWeights | null {
    return this.lastWeights;
  }
  
  /**
   * Reset fusion core
   */
  reset(): void {
    this.lastMatrix = null;
    this.lastWeights = null;
    this.lastDecision = null;
    console.log('[FusionCore] Reset complete');
  }
}

/**
 * Singleton instance
 */
let fusionCoreInstance: FusionCore | null = null;

/**
 * Get FusionCore instance
 */
export function getFusionCore(): FusionCore {
  if (!fusionCoreInstance) {
    fusionCoreInstance = new FusionCore();
  }
  return fusionCoreInstance;
}

/**
 * Reset singleton
 */
export function resetFusionCore(): void {
  if (fusionCoreInstance) {
    fusionCoreInstance.reset();
  }
  fusionCoreInstance = null;
}

export default FusionCore;
