/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.5: OVERSIGHT RECOMMENDATION ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * Aggregates all oversight signals and generates human-readable
 * recommendations, alternatives, and warnings.
 * 
 * SAFETY: Does NOT execute - only advises
 * PURPOSE: Translate technical analysis into actionable guidance
 * ═══════════════════════════════════════════════════════════════════
 */

import type { SystemHealthSnapshot, TrendProjection } from './StrategicStateMonitor';
import type { ForecastScenario, ExecutionPath } from './MultiPathForecastEngine';
import type { CommandIntent, ClarificationRequest } from './IntentClarificationMatrix';
import type { RiskMap, RiskZone } from './RiskMapGenerator';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RecommendationType = 
  | 'execution_plan'
  | 'alternative'
  | 'warning'
  | 'optimization'
  | 'safety'
  | 'clarification';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string[];
  impacts: string[];
  actionable: boolean;
  action?: string;
}

export interface ExecutionPlan {
  recommended: boolean;
  path: ExecutionPath;
  rationale: string;
  expectedDuration: number;
  expectedOutcomes: string[];
  potentialRisks: string[];
  mitigations: string[];
  confidence: number;
}

export interface Alternative {
  id: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  riskReduction: number; // percentage
  timeImpact: number;    // ms difference
  recommendation: string;
}

export interface RedundantStep {
  step: string;
  reason: string;
  canSkip: boolean;
  timeSavings: number;
}

export interface SystematicImpact {
  category: 'stability' | 'performance' | 'coordination' | 'resource' | 'emotional';
  current: number;      // 0-100
  projected: number;    // 0-100
  delta: number;        // change
  description: string;
  severity: 'positive' | 'neutral' | 'negative' | 'critical';
}

export interface EmotionalImpact {
  loadChange: number;        // delta in emotional load
  toneShift: string;         // expected tone change
  harmonicImpact: number;    // -100 to +100
  recoveryTime: number;      // ms
  recommendations: string[];
}

export interface OversightReport {
  command: string;
  timestamp: number;
  
  // Core recommendations
  executionPlan: ExecutionPlan;
  alternatives: Alternative[];
  warnings: Recommendation[];
  optimizations: Recommendation[];
  
  // Analysis
  redundantSteps: RedundantStep[];
  systematicImpacts: SystematicImpact[];
  emotionalImpact: EmotionalImpact;
  
  // Overall guidance
  shouldProceed: boolean;
  requiresClarification: boolean;
  clarifications?: ClarificationRequest;
  finalAdvice: string;
  
  // Meta
  confidence: number;
  analysisDepth: number;
}

// ─────────────────────────────────────────────────────────────────
// OVERSIGHT RECOMMENDATION ENGINE CLASS
// ─────────────────────────────────────────────────────────────────

export class OversightRecommendationEngine {
  private maxAlternatives: number;
  private redundancyThreshold: number;
  
  constructor(maxAlternatives: number = 3, redundancyThreshold: number = 70) {
    this.maxAlternatives = maxAlternatives;
    this.redundancyThreshold = redundancyThreshold;
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN RECOMMENDATION GENERATION
  // ─────────────────────────────────────────────────────────────

  async generateReport(
    command: string,
    health: SystemHealthSnapshot,
    trend: TrendProjection,
    forecast: ForecastScenario,
    intent: CommandIntent,
    riskMap: RiskMap
  ): Promise<OversightReport> {
    
    // Generate execution plan
    const executionPlan = this.createExecutionPlan(forecast, riskMap, health);
    
    // Identify alternatives
    const alternatives = this.identifyAlternatives(forecast, riskMap, intent);
    
    // Generate warnings
    const warnings = this.generateWarnings(riskMap, health, trend, intent);
    
    // Find optimizations
    const optimizations = this.findOptimizations(forecast, health, intent);
    
    // Detect redundant steps
    const redundantSteps = this.detectRedundantSteps(forecast, intent);
    
    // Calculate impacts
    const systematicImpacts = this.calculateSystematicImpacts(forecast, health, trend);
    const emotionalImpact = this.calculateEmotionalImpact(forecast, health);
    
    // Determine if clarification needed
    const requiresClarification = intent.confidence < 70;
    const clarifications = requiresClarification ? { questions: [], suggestions: [], alternatives: [], severity: 'high' as const } : undefined;
    
    // Overall decision
    const shouldProceed = this.determineProceedRecommendation(
      riskMap,
      health,
      intent,
      warnings
    );
    
    // Generate final advice
    const finalAdvice = this.generateFinalAdvice(
      shouldProceed,
      executionPlan,
      riskMap,
      warnings
    );
    
    // Calculate confidence and depth
    const confidence = this.calculateOverallConfidence(forecast, riskMap, intent);
    const analysisDepth = this.calculateAnalysisDepth(
      forecast,
      riskMap,
      alternatives,
      optimizations
    );
    
    return {
      command,
      timestamp: Date.now(),
      executionPlan,
      alternatives,
      warnings,
      optimizations,
      redundantSteps,
      systematicImpacts,
      emotionalImpact,
      shouldProceed,
      requiresClarification,
      clarifications,
      finalAdvice,
      confidence,
      analysisDepth
    };
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTION PLAN CREATION
  // ─────────────────────────────────────────────────────────────

  private createExecutionPlan(
    forecast: ForecastScenario,
    riskMap: RiskMap,
    health: SystemHealthSnapshot
  ): ExecutionPlan {
    
    // Select recommended path
    const path = forecast.paths[forecast.recommended];
    
    // Build rationale
    const rationale = this.buildExecutionRationale(path, riskMap, health);
    
    // Extract expected outcomes
    const expectedOutcomes = path.outcome.successes.slice(0, 5);
    
    // Identify potential risks
    const potentialRisks = path.risks.map(r => r.description);
    
    // Generate mitigations
    const mitigations = this.generateMitigations(path, riskMap);
    
    return {
      recommended: riskMap.overallZone !== 'FORBIDDEN',
      path,
      rationale,
      expectedDuration: path.duration,
      expectedOutcomes,
      potentialRisks,
      mitigations,
      confidence: forecast.confidence
    };
  }

  private buildExecutionRationale(
    path: ExecutionPath,
    riskMap: RiskMap,
    health: SystemHealthSnapshot
  ): string {
    
    const reasons: string[] = [];
    
    // Success probability
    const successProb = typeof path.outcome === 'object' ? 75 : 50;
    if (successProb > 80) {
      reasons.push('High success probability');
    } else if (successProb > 60) {
      reasons.push('Moderate success probability');
    } else {
      reasons.push('Lower success probability, proceed with caution');
    }
    
    // System health
    if (health.overall === 'safe' || health.overall === 'caution') {
      reasons.push('System health is acceptable');
    } else {
      reasons.push('System health requires monitoring');
    }
    
    // Risk zone
    if (riskMap.overallZone === 'SAFE') {
      reasons.push('Risk level is within safe bounds');
    } else if (riskMap.overallZone === 'CAUTION') {
      reasons.push('Risk level requires careful execution');
    } else {
      reasons.push('Risk level is elevated');
    }
    
    return reasons.join('. ') + '.';
  }

  private generateMitigations(path: ExecutionPath, riskMap: RiskMap): string[] {
    const mitigations: string[] = [];
    
    // From path risks
    path.risks.forEach(risk => {
      if (risk.mitigation) {
        mitigations.push(risk.mitigation);
      }
    });
    
    // From risk map hazards
    riskMap.hazards.forEach(hazard => {
      if (hazard.mitigation && hazard.severity !== 'safe') {
        mitigations.push(hazard.mitigation);
      }
    });
    
    // From bottlenecks
    riskMap.bottlenecks.forEach(bottleneck => {
      mitigations.push(bottleneck.resolution);
    });
    
    // Deduplicate
    return Array.from(new Set(mitigations));
  }

  // ─────────────────────────────────────────────────────────────
  // ALTERNATIVE IDENTIFICATION
  // ─────────────────────────────────────────────────────────────

  private identifyAlternatives(
    forecast: ForecastScenario,
    riskMap: RiskMap,
    intent: CommandIntent
  ): Alternative[] {
    
    const alternatives: Alternative[] = [];
    
    // Safe path alternative
    const safePath = forecast.paths[forecast.safest];
    const recommendedPath = forecast.paths[forecast.recommended];
    if (safePath.id !== recommendedPath.id) {
      alternatives.push({
        id: 'safe-path',
        description: 'Use safest execution path with minimal risk',
        advantages: [
          'Lowest risk of failure',
          'Better stability guarantees',
          'Easier to monitor and control'
        ],
        disadvantages: [
          `Slower execution (~${safePath.duration}ms vs ${recommendedPath.duration}ms)`,
          'May be overly conservative'
        ],
        riskReduction: this.calculateRiskReduction(recommendedPath, safePath),
        timeImpact: safePath.duration - recommendedPath.duration,
        recommendation: 'Consider if system stability is a concern'
      });
    }
    
    // Fast path alternative
    const fastPath = forecast.paths[forecast.fastest];
    if (fastPath.id !== recommendedPath.id && riskMap.overallZone !== 'FORBIDDEN') {
      alternatives.push({
        id: 'fast-path',
        description: 'Use fastest execution path with acceptable risk',
        advantages: [
          `Faster execution (~${fastPath.duration}ms)`,
          'More efficient resource usage'
        ],
        disadvantages: [
          'Higher risk of complications',
          'Less stable execution',
          'Requires more monitoring'
        ],
        riskReduction: this.calculateRiskReduction(forecast.recommendedPath, fastPath),
        timeImpact: fastPath.duration - forecast.recommendedPath.duration,
        recommendation: 'Consider if time is critical and risks are acceptable'
      });
    }
    
    // Rewrite alternative
    if (!intent.alignment.isValid || riskMap.overallZone === 'FORBIDDEN') {
      alternatives.push({
        id: 'rewrite',
        description: 'Rewrite command with reduced scope or different approach',
        advantages: [
          'Address fundamental issues with current command',
          'Potentially much lower risk',
          'Better alignment with system capabilities'
        ],
        disadvantages: [
          'Requires manual effort',
          'May not achieve original intent'
        ],
        riskReduction: 50,
        timeImpact: 0,
        recommendation: 'Strongly recommended due to current risks'
      });
    }
    
    return alternatives.slice(0, this.maxAlternatives);
  }

  private calculateRiskReduction(basePath: ExecutionPath, altPath: ExecutionPath): number {
    const baseRisk = basePath.risks.reduce((sum, r) => sum + r.probability, 0);
    const altRisk = altPath.risks.reduce((sum, r) => sum + r.probability, 0);
    
    if (baseRisk === 0) return 0;
    return Math.round(((baseRisk - altRisk) / baseRisk) * 100);
  }

  // ─────────────────────────────────────────────────────────────
  // WARNING GENERATION
  // ─────────────────────────────────────────────────────────────

  private generateWarnings(
    riskMap: RiskMap,
    health: SystemHealthSnapshot,
    trend: TrendProjection,
    intent: CommandIntent
  ): Recommendation[] {
    
    const warnings: Recommendation[] = [];
    
    // Critical blockers
    if (riskMap.blockers.length > 0) {
      warnings.push({
        id: 'critical-blockers',
        type: 'warning',
        priority: 'critical',
        title: 'Execution Blocked',
        description: riskMap.blockers.join('. '),
        rationale: ['Critical issues prevent safe execution'],
        impacts: ['Cannot proceed without resolving blockers'],
        actionable: true,
        action: 'Resolve blockers or rewrite command'
      });
    }
    
    // System health warnings
    if (health.overall === 'danger' || health.overall === 'critical') {
      warnings.push({
        id: 'system-health',
        type: 'warning',
        priority: 'high',
        title: 'System Health Critical',
        description: `System health is ${health.overall}`,
        rationale: health.diagnostics,
        impacts: ['Increased failure risk', 'Potential instability'],
        actionable: true,
        action: 'Wait for system to stabilize'
      });
    }
    
    // Trend warnings
    if (trend.direction === 'degrading') {
      warnings.push({
        id: 'degrading-trend',
        type: 'warning',
        priority: 'medium',
        title: 'System Degrading',
        description: 'System metrics are trending negatively',
        rationale: [`Projected to reach ${trend.projectedRisk} in ${trend.timeToRisk}ms`],
        impacts: ['Conditions may worsen during execution'],
        actionable: true,
        action: 'Execute sooner or wait for improvement'
      });
    }
    
    // Intent alignment warnings
    if (!intent.alignment.isWithinBoundaries) {
      warnings.push({
        id: 'boundary-violation',
        type: 'safety',
        priority: 'critical',
        title: 'Safety Boundary Violation',
        description: 'Command exceeds system safety boundaries',
        rationale: [`Boundary alignment: ${intent.alignment.boundaryAlignment}%`],
        impacts: ['May cause system damage or data loss'],
        actionable: true,
        action: 'Rewrite command within boundaries'
      });
    }
    
    // Risk map warnings
    riskMap.warnings.forEach((warning, idx) => {
      warnings.push({
        id: `risk-warning-${idx}`,
        type: 'warning',
        priority: 'high',
        title: 'Risk Detected',
        description: warning,
        rationale: ['Identified by risk map analysis'],
        impacts: ['May affect execution success'],
        actionable: false
      });
    });
    
    return warnings.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ─────────────────────────────────────────────────────────────
  // OPTIMIZATION FINDING
  // ─────────────────────────────────────────────────────────────

  private findOptimizations(
    forecast: ForecastScenario,
    health: SystemHealthSnapshot,
    intent: CommandIntent
  ): Recommendation[] {
    
    const optimizations: Recommendation[] = [];
    
    // Parallel execution opportunity
    const canParallelize = forecast.paths.some(p => p.id.includes('parallel'));
    if (canParallelize && health.load.cpu < 60) {
      optimizations.push({
        id: 'parallelize',
        type: 'optimization',
        priority: 'medium',
        title: 'Parallel Execution Available',
        description: 'Tasks can be executed in parallel for faster completion',
        rationale: ['Low CPU usage allows parallel execution'],
        impacts: ['Reduced total execution time'],
        actionable: true,
        action: 'Use parallel execution mode'
      });
    }
    
    // Resource efficiency
    if (health.load.memory < 50 && health.load.cpu < 50) {
      optimizations.push({
        id: 'resource-efficiency',
        type: 'optimization',
        priority: 'low',
        title: 'System Resources Available',
        description: 'System has ample resources for execution',
        rationale: ['CPU and memory usage are low'],
        impacts: ['Optimal execution conditions'],
        actionable: false
      });
    }
    
    return optimizations;
  }

  // ─────────────────────────────────────────────────────────────
  // REDUNDANT STEP DETECTION
  // ─────────────────────────────────────────────────────────────

  private detectRedundantSteps(
    forecast: ForecastScenario,
    intent: CommandIntent
  ): RedundantStep[] {
    
    const redundant: RedundantStep[] = [];
    
    // This would require deeper analysis of execution steps
    // For now, provide template structure
    
    return redundant;
  }

  // ─────────────────────────────────────────────────────────────
  // IMPACT CALCULATION
  // ─────────────────────────────────────────────────────────────

  private calculateSystematicImpacts(
    forecast: ForecastScenario,
    health: SystemHealthSnapshot,
    trend: TrendProjection
  ): SystematicImpact[] {
    
    const impacts: SystematicImpact[] = [];
    const path = forecast.recommendedPath;
    
    // Stability impact
    const stabilityDelta = trend.direction === 'improving' ? 10 : -15;
    impacts.push({
      category: 'stability',
      current: health.congestion.stabilityIndex,
      projected: Math.max(0, Math.min(100, health.congestion.stabilityIndex + stabilityDelta)),
      delta: stabilityDelta,
      description: `Execution will ${stabilityDelta > 0 ? 'improve' : 'stress'} system stability`,
      severity: stabilityDelta > 0 ? 'positive' : stabilityDelta < -20 ? 'negative' : 'neutral'
    });
    
    // Performance impact
    const perfDelta = health.load.cpu > 70 ? -10 : 5;
    impacts.push({
      category: 'performance',
      current: 100 - health.load.cpu,
      projected: Math.max(0, 100 - health.load.cpu + perfDelta),
      delta: perfDelta,
      description: 'Expected performance change during execution',
      severity: perfDelta > 0 ? 'positive' : perfDelta < -15 ? 'negative' : 'neutral'
    });
    
    // Resource impact
    const resourceDelta = -8;
    impacts.push({
      category: 'resource',
      current: 100 - health.load.memory,
      projected: Math.max(0, 100 - health.load.memory + resourceDelta),
      delta: resourceDelta,
      description: 'Resource availability will decrease during execution',
      severity: resourceDelta < -20 ? 'critical' : resourceDelta < -10 ? 'negative' : 'neutral'
    });
    
    return impacts;
  }

  private calculateEmotionalImpact(
    forecast: ForecastScenario,
    health: SystemHealthSnapshot
  ): EmotionalImpact {
    
    const path = forecast.recommendedPath;
    
    // Estimate emotional load change
    const loadChange = path.emotionalLoad - health.emotional.emotionalLoad;
    
    // Determine tone shift
    let toneShift = 'stable';
    if (loadChange > 20) toneShift = 'stressed';
    else if (loadChange > 10) toneShift = 'elevated';
    else if (loadChange < -10) toneShift = 'relaxed';
    
    // Calculate harmonic impact
    const harmonicImpact = health.emotional.harmonicBalance - path.emotionalLoad;
    
    // Estimate recovery time
    const recoveryTime = Math.abs(loadChange) * 500;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (loadChange > 15) {
      recommendations.push('Consider emotional recovery period after execution');
    }
    if (harmonicImpact < -20) {
      recommendations.push('Monitor tone consistency during execution');
    }
    
    return {
      loadChange,
      toneShift,
      harmonicImpact,
      recoveryTime,
      recommendations
    };
  }

  // ─────────────────────────────────────────────────────────────
  // DECISION LOGIC
  // ─────────────────────────────────────────────────────────────

  private determineProceedRecommendation(
    riskMap: RiskMap,
    health: SystemHealthSnapshot,
    intent: CommandIntent,
    warnings: Recommendation[]
  ): boolean {
    
    // Block if forbidden zone
    if (riskMap.overallZone === 'FORBIDDEN') {
      return false;
    }
    
    // Block if critical warnings
    const criticalWarnings = warnings.filter(w => w.priority === 'critical');
    if (criticalWarnings.length > 0) {
      return false;
    }
    
    // Block if not within boundaries
    if (!intent.alignment.isWithinBoundaries) {
      return false;
    }
    
    // Block if not executable
    if (!intent.alignment.isExecutable) {
      return false;
    }
    
    // Block if critical system health
    if (health.overall === 'critical') {
      return false;
    }
    
    // Otherwise, can proceed (with caution if needed)
    return true;
  }

  private generateFinalAdvice(
    shouldProceed: boolean,
    plan: ExecutionPlan,
    riskMap: RiskMap,
    warnings: Recommendation[]
  ): string {
    
    if (!shouldProceed) {
      return `❌ Execution NOT recommended. ${riskMap.blockers[0] || 'Risk level too high'}. Consider rewriting command or waiting for better conditions.`;
    }
    
    if (riskMap.overallZone === 'UNSTABLE') {
      return `⚠️ Proceed with EXTREME caution. System is in unstable zone. Monitor closely and be prepared to abort.`;
    }
    
    if (riskMap.overallZone === 'CAUTION') {
      return `⚡ Proceed with caution. ${warnings.length} warning${warnings.length !== 1 ? 's' : ''} detected. Monitor execution closely.`;
    }
    
    return `✅ Safe to proceed. Expected duration: ~${Math.round(plan.expectedDuration / 1000)}s. Success probability: ${plan.path.outcome.successProbability}%.`;
  }

  // ─────────────────────────────────────────────────────────────
  // META CALCULATIONS
  // ─────────────────────────────────────────────────────────────

  private calculateOverallConfidence(
    forecast: ForecastScenario,
    riskMap: RiskMap,
    intent: CommandIntent
  ): number {
    
    // Average of sub-confidences
    const forecastConf = forecast.confidence;
    const riskConf = riskMap.confidence;
    const intentConf = intent.alignment.overall;
    
    return Math.round((forecastConf + riskConf + intentConf) / 3);
  }

  private calculateAnalysisDepth(
    forecast: ForecastScenario,
    riskMap: RiskMap,
    alternatives: Alternative[],
    optimizations: Recommendation[]
  ): number {
    
    let depth = 0;
    
    // Points for thorough forecast
    depth += Math.min(30, forecast.paths.length * 7);
    
    // Points for risk analysis
    depth += Math.min(30, riskMap.hazards.length * 3 + riskMap.bottlenecks.length * 5);
    
    // Points for alternatives
    depth += alternatives.length * 10;
    
    // Points for optimizations
    depth += optimizations.length * 5;
    
    return Math.min(100, depth);
  }
}
