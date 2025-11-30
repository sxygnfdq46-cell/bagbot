/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.2: MULTI-PATH FORECAST ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * Simulates multiple execution paths for commands to predict outcomes
 * across time horizons, impact gradients, and system states.
 * 
 * SAFETY: Simulation only - no execution capability
 * PURPOSE: Pre-execution outcome forecasting and path analysis
 * ═══════════════════════════════════════════════════════════════════
 */

import type { RiskLevel, SystemHealthSnapshot } from './StrategicStateMonitor';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type PathOutcome = 'success' | 'partial' | 'failure' | 'catastrophic';
export type PathType = 'optimal' | 'safe' | 'risky' | 'alternative' | 'catastrophic';

export interface TimeHorizon {
  short: number;    // 1-5s
  medium: number;   // 5-30s
  long: number;     // 30-90s
}

export interface ImpactGradient {
  immediate: number;      // 0-100
  shortTerm: number;      // 0-100
  mediumTerm: number;     // 0-100
  longTerm: number;       // 0-100
  cascading: number;      // 0-100 (likelihood of cascade effects)
}

export interface SystemTemperature {
  processing: number;     // 0-100 (CPU/computational load)
  emotional: number;      // 0-100 (emotional system strain)
  coordination: number;   // 0-100 (inter-system coordination stress)
  memory: number;         // 0-100 (context/memory pressure)
  overall: number;        // 0-100 (weighted average)
}

export interface EmotionalLoadProfile {
  baseline: number;         // 0-100
  peak: number;            // 0-100
  sustained: number;       // 0-100
  recovery: number;        // 0-100 (ability to recover)
  volatility: number;      // 0-100 (oscillation magnitude)
}

export interface StabilityCurve {
  timestamps: number[];
  stability: number[];      // 0-100 at each timestamp
  criticalPoints: number[]; // timestamps where stability drops significantly
  recoveryPoints: number[]; // timestamps where stability improves
  breakpoint?: number;      // timestamp where stability fails
}

export interface ExecutionPath {
  id: string;
  type: PathType;
  probability: number;      // 0-100 (likelihood of this path occurring)
  
  // Outcomes
  outcome: PathOutcome;
  successRate: number;      // 0-100
  
  // Temporal analysis
  duration: number;         // ms
  timeHorizon: TimeHorizon;
  
  // Impact analysis
  impact: ImpactGradient;
  
  // System state
  temperature: SystemTemperature;
  emotionalLoad: EmotionalLoadProfile;
  stability: StabilityCurve;
  
  // Risks
  risks: PathRisk[];
  warnings: string[];
  
  // Advantages
  advantages: string[];
  
  // Dependencies
  dependencies: string[];
  blockers: string[];
  
  // Metadata
  confidence: number;       // 0-100
  recommended: boolean;
  timestamp: number;
}

export interface PathRisk {
  type: 'timing' | 'resource' | 'stability' | 'cascade' | 'conflict' | 'unknown';
  severity: RiskLevel;
  likelihood: number;       // 0-100
  impact: number;          // 0-100
  description: string;
  mitigation?: string;
  timestamp: number;
}

export interface ForecastScenario {
  command: string;
  context: {
    currentState: SystemHealthSnapshot;
    recentHistory: SystemHealthSnapshot[];
    activeFlows: number;
    queuedTasks: number;
  };
  
  paths: ExecutionPath[];
  
  recommended: ExecutionPath;
  safest: ExecutionPath;
  fastest: ExecutionPath;
  riskiest: ExecutionPath;
  
  overallRisk: RiskLevel;
  confidence: number;
  
  timestamp: number;
}

export interface PathComparison {
  pathA: ExecutionPath;
  pathB: ExecutionPath;
  
  betterPath: ExecutionPath;
  reason: string;
  
  differences: {
    duration: number;
    successRate: number;
    risk: number;
    stability: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// MULTI-PATH FORECAST ENGINE CLASS
// ─────────────────────────────────────────────────────────────────

export class MultiPathForecastEngine {
  private simulationCount: number;
  private maxPathsToGenerate: number;
  
  constructor(
    simulationCount: number = 1000,
    maxPathsToGenerate: number = 5
  ) {
    this.simulationCount = simulationCount;
    this.maxPathsToGenerate = maxPathsToGenerate;
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN FORECAST METHOD
  // ─────────────────────────────────────────────────────────────

  async forecastCommand(
    command: string,
    currentState: SystemHealthSnapshot,
    recentHistory: SystemHealthSnapshot[] = []
  ): Promise<ForecastScenario> {
    
    const context = {
      currentState,
      recentHistory,
      activeFlows: currentState.congestion.activeFlows,
      queuedTasks: currentState.load.queuedTasks
    };
    
    // Generate multiple execution paths
    const paths = await this.generatePaths(command, context);
    
    // Identify key paths
    const recommended = this.selectRecommendedPath(paths);
    const safest = this.selectSafestPath(paths);
    const fastest = this.selectFastestPath(paths);
    const riskiest = this.selectRiskiestPath(paths);
    
    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(paths);
    
    // Calculate confidence
    const confidence = this.calculateForecastConfidence(paths, context);
    
    return {
      command,
      context,
      paths,
      recommended,
      safest,
      fastest,
      riskiest,
      overallRisk,
      confidence,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PATH GENERATION
  // ─────────────────────────────────────────────────────────────

  private async generatePaths(
    command: string,
    context: ForecastScenario['context']
  ): Promise<ExecutionPath[]> {
    
    const paths: ExecutionPath[] = [];
    
    // Generate optimal path
    paths.push(await this.generateOptimalPath(command, context));
    
    // Generate safe path
    paths.push(await this.generateSafePath(command, context));
    
    // Generate risky path
    paths.push(await this.generateRiskyPath(command, context));
    
    // Generate alternative paths
    const altCount = Math.min(2, this.maxPathsToGenerate - 3);
    for (let i = 0; i < altCount; i++) {
      paths.push(await this.generateAlternativePath(command, context, i));
    }
    
    // Sort by recommendation score
    paths.sort((a, b) => {
      const scoreA = this.calculatePathScore(a);
      const scoreB = this.calculatePathScore(b);
      return scoreB - scoreA;
    });
    
    return paths.slice(0, this.maxPathsToGenerate);
  }

  private async generateOptimalPath(
    command: string,
    context: ForecastScenario['context']
  ): Promise<ExecutionPath> {
    
    const duration = this.estimateDuration(command, context, 'optimal');
    const timeHorizon = this.calculateTimeHorizon(duration);
    
    return {
      id: `path-optimal-${Date.now()}`,
      type: 'optimal',
      probability: 75,
      outcome: 'success',
      successRate: 90,
      duration,
      timeHorizon,
      impact: this.calculateImpact(command, context, 'optimal'),
      temperature: this.calculateTemperature(context, 'optimal'),
      emotionalLoad: this.calculateEmotionalLoad(context, 'optimal'),
      stability: this.projectStabilityCurve(context, duration, 'optimal'),
      risks: this.identifyRisks(command, context, 'optimal'),
      warnings: ['Standard execution parameters'],
      advantages: [
        'Balanced performance and safety',
        'Predictable execution time',
        'Minimal system strain'
      ],
      dependencies: this.extractDependencies(command),
      blockers: [],
      confidence: 85,
      recommended: true,
      timestamp: Date.now()
    };
  }

  private async generateSafePath(
    command: string,
    context: ForecastScenario['context']
  ): Promise<ExecutionPath> {
    
    const duration = this.estimateDuration(command, context, 'safe');
    const timeHorizon = this.calculateTimeHorizon(duration);
    
    return {
      id: `path-safe-${Date.now()}`,
      type: 'safe',
      probability: 90,
      outcome: 'success',
      successRate: 95,
      duration: duration * 1.3, // Slower but safer
      timeHorizon,
      impact: this.calculateImpact(command, context, 'safe'),
      temperature: this.calculateTemperature(context, 'safe'),
      emotionalLoad: this.calculateEmotionalLoad(context, 'safe'),
      stability: this.projectStabilityCurve(context, duration * 1.3, 'safe'),
      risks: this.identifyRisks(command, context, 'safe'),
      warnings: [],
      advantages: [
        'Maximum stability preservation',
        'Lowest risk of failure',
        'Graceful error handling'
      ],
      dependencies: this.extractDependencies(command),
      blockers: [],
      confidence: 90,
      recommended: false,
      timestamp: Date.now()
    };
  }

  private async generateRiskyPath(
    command: string,
    context: ForecastScenario['context']
  ): Promise<ExecutionPath> {
    
    const duration = this.estimateDuration(command, context, 'risky');
    const timeHorizon = this.calculateTimeHorizon(duration);
    
    return {
      id: `path-risky-${Date.now()}`,
      type: 'risky',
      probability: 40,
      outcome: 'partial',
      successRate: 60,
      duration: duration * 0.7, // Faster but risky
      timeHorizon,
      impact: this.calculateImpact(command, context, 'risky'),
      temperature: this.calculateTemperature(context, 'risky'),
      emotionalLoad: this.calculateEmotionalLoad(context, 'risky'),
      stability: this.projectStabilityCurve(context, duration * 0.7, 'risky'),
      risks: this.identifyRisks(command, context, 'risky'),
      warnings: [
        'High system strain',
        'Potential stability issues',
        'Risk of cascade failures'
      ],
      advantages: [
        'Fastest execution time',
        'Maximum throughput'
      ],
      dependencies: this.extractDependencies(command),
      blockers: ['High current system load'],
      confidence: 50,
      recommended: false,
      timestamp: Date.now()
    };
  }

  private async generateAlternativePath(
    command: string,
    context: ForecastScenario['context'],
    index: number
  ): Promise<ExecutionPath> {
    
    const duration = this.estimateDuration(command, context, 'alternative');
    const timeHorizon = this.calculateTimeHorizon(duration);
    const variance = (index + 1) * 0.15;
    
    return {
      id: `path-alt-${index}-${Date.now()}`,
      type: 'alternative',
      probability: 65 - (index * 15),
      outcome: 'success',
      successRate: 80 - (index * 10),
      duration: duration * (1 + variance),
      timeHorizon,
      impact: this.calculateImpact(command, context, 'alternative'),
      temperature: this.calculateTemperature(context, 'alternative'),
      emotionalLoad: this.calculateEmotionalLoad(context, 'alternative'),
      stability: this.projectStabilityCurve(context, duration, 'alternative'),
      risks: this.identifyRisks(command, context, 'alternative'),
      warnings: [`Alternative execution strategy ${index + 1}`],
      advantages: [
        'Different resource utilization',
        'Varied execution pattern'
      ],
      dependencies: this.extractDependencies(command),
      blockers: [],
      confidence: 70 - (index * 10),
      recommended: false,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CALCULATION HELPERS
  // ─────────────────────────────────────────────────────────────

  private estimateDuration(
    command: string,
    context: ForecastScenario['context'],
    pathType: PathType
  ): number {
    // Base duration estimate
    let baseDuration = 5000 + Math.random() * 15000;
    
    // Adjust for current system load
    const loadFactor = context.currentState.load.cpu / 100;
    baseDuration *= (1 + loadFactor * 0.5);
    
    // Adjust for path type
    const typeMultipliers: Record<PathType, number> = {
      optimal: 1.0,
      safe: 1.3,
      risky: 0.7,
      alternative: 1.1,
      catastrophic: 0.5
    };
    
    return baseDuration * typeMultipliers[pathType];
  }

  private calculateTimeHorizon(duration: number): TimeHorizon {
    return {
      short: Math.min(duration, 5000),
      medium: Math.min(duration, 30000),
      long: duration
    };
  }

  private calculateImpact(
    command: string,
    context: ForecastScenario['context'],
    pathType: PathType
  ): ImpactGradient {
    
    const baseImpact = 40 + Math.random() * 20;
    
    const typeMultipliers: Record<PathType, number> = {
      optimal: 1.0,
      safe: 0.7,
      risky: 1.5,
      alternative: 1.1,
      catastrophic: 2.5
    };
    
    const multiplier = typeMultipliers[pathType];
    
    return {
      immediate: baseImpact * 0.8 * multiplier,
      shortTerm: baseImpact * 1.0 * multiplier,
      mediumTerm: baseImpact * 0.9 * multiplier,
      longTerm: baseImpact * 0.6 * multiplier,
      cascading: baseImpact * 0.4 * multiplier
    };
  }

  private calculateTemperature(
    context: ForecastScenario['context'],
    pathType: PathType
  ): SystemTemperature {
    
    const current = context.currentState;
    const baseTemp = current.load.cpu;
    
    const typeAdjustments: Record<PathType, number> = {
      optimal: 1.0,
      safe: 0.8,
      risky: 1.4,
      alternative: 1.1,
      catastrophic: 2.0
    };
    
    const adj = typeAdjustments[pathType];
    
    const processing = Math.min(100, baseTemp * adj);
    const emotional = Math.min(100, current.emotional.emotionalLoad * adj);
    const coordination = Math.min(100, current.congestion.bottleneckScore * adj);
    const memory = Math.min(100, current.load.memory * adj);
    
    return {
      processing,
      emotional,
      coordination,
      memory,
      overall: (processing + emotional + coordination + memory) / 4
    };
  }

  private calculateEmotionalLoad(
    context: ForecastScenario['context'],
    pathType: PathType
  ): EmotionalLoadProfile {
    
    const current = context.currentState.emotional;
    const baseLoad = current.emotionalLoad;
    
    const typeMultipliers: Record<PathType, number> = {
      optimal: 1.0,
      safe: 0.7,
      risky: 1.6,
      alternative: 1.2,
      catastrophic: 2.5
    };
    
    const mult = typeMultipliers[pathType];
    
    return {
      baseline: baseLoad,
      peak: Math.min(100, baseLoad * mult * 1.3),
      sustained: Math.min(100, baseLoad * mult),
      recovery: Math.max(0, 100 - (baseLoad * mult * 0.5)),
      volatility: Math.min(100, baseLoad * mult * 0.4)
    };
  }

  private projectStabilityCurve(
    context: ForecastScenario['context'],
    duration: number,
    pathType: PathType
  ): StabilityCurve {
    
    const steps = 20;
    const interval = duration / steps;
    const timestamps: number[] = [];
    const stability: number[] = [];
    const criticalPoints: number[] = [];
    const recoveryPoints: number[] = [];
    
    const baseStability = context.currentState.emotional.toneStability;
    
    const decayRates: Record<PathType, number> = {
      optimal: 0.01,
      safe: 0.005,
      risky: 0.03,
      alternative: 0.015,
      catastrophic: 0.08
    };
    
    const decay = decayRates[pathType];
    
    let currentStability = baseStability;
    const now = Date.now();
    
    for (let i = 0; i <= steps; i++) {
      const timestamp = now + (i * interval);
      timestamps.push(timestamp);
      
      // Add some noise
      const noise = (Math.random() - 0.5) * 5;
      currentStability = Math.max(0, Math.min(100, currentStability - decay * 100 + noise));
      
      stability.push(currentStability);
      
      if (currentStability < 40 && i > 0 && stability[i - 1] >= 40) {
        criticalPoints.push(timestamp);
      }
      
      if (currentStability > 60 && i > 0 && stability[i - 1] <= 60) {
        recoveryPoints.push(timestamp);
      }
    }
    
    const breakpoint = stability.findIndex(s => s < 20);
    
    return {
      timestamps,
      stability,
      criticalPoints,
      recoveryPoints,
      breakpoint: breakpoint >= 0 ? timestamps[breakpoint] : undefined
    };
  }

  private identifyRisks(
    command: string,
    context: ForecastScenario['context'],
    pathType: PathType
  ): PathRisk[] {
    
    const risks: PathRisk[] = [];
    
    // Timing risk
    if (context.currentState.congestion.bottleneckScore > 60) {
      risks.push({
        type: 'timing',
        severity: 'warning',
        likelihood: 70,
        impact: 50,
        description: 'Flow congestion may delay execution',
        mitigation: 'Wait for congestion to clear',
        timestamp: Date.now()
      });
    }
    
    // Resource risk
    if (context.currentState.load.cpu > 70) {
      risks.push({
        type: 'resource',
        severity: 'warning',
        likelihood: 65,
        impact: 60,
        description: 'High CPU usage may affect performance',
        mitigation: 'Reduce concurrent operations',
        timestamp: Date.now()
      });
    }
    
    // Stability risk
    if (context.currentState.emotional.emotionalLoad > 70) {
      risks.push({
        type: 'stability',
        severity: 'caution',
        likelihood: 55,
        impact: 70,
        description: 'Emotional load may affect tone consistency',
        mitigation: 'Allow recovery period',
        timestamp: Date.now()
      });
    }
    
    // Path-specific risks
    if (pathType === 'risky') {
      risks.push({
        type: 'cascade',
        severity: 'danger',
        likelihood: 45,
        impact: 85,
        description: 'High risk of cascading failures',
        mitigation: 'Use safe path instead',
        timestamp: Date.now()
      });
    }
    
    return risks;
  }

  private extractDependencies(command: string): string[] {
    // In production, parse command to extract actual dependencies
    return ['System state', 'Emotional stability'];
  }

  // ─────────────────────────────────────────────────────────────
  // PATH SELECTION
  // ─────────────────────────────────────────────────────────────

  private selectRecommendedPath(paths: ExecutionPath[]): ExecutionPath {
    return paths.reduce((best, path) => {
      const bestScore = this.calculatePathScore(best);
      const pathScore = this.calculatePathScore(path);
      return pathScore > bestScore ? path : best;
    });
  }

  private selectSafestPath(paths: ExecutionPath[]): ExecutionPath {
    return paths.reduce((safest, path) => {
      return path.successRate > safest.successRate ? path : safest;
    });
  }

  private selectFastestPath(paths: ExecutionPath[]): ExecutionPath {
    return paths.reduce((fastest, path) => {
      return path.duration < fastest.duration ? path : fastest;
    });
  }

  private selectRiskiestPath(paths: ExecutionPath[]): ExecutionPath {
    return paths.reduce((riskiest, path) => {
      const riskScore = this.calculateRiskScore(path);
      const riskiestScore = this.calculateRiskScore(riskiest);
      return riskScore > riskiestScore ? path : riskiest;
    });
  }

  private calculatePathScore(path: ExecutionPath): number {
    const successWeight = 0.35;
    const speedWeight = 0.15;
    const stabilityWeight = 0.25;
    const riskWeight = -0.25;
    
    const speedScore = 100 - (path.duration / 90000) * 100;
    const stabilityScore = path.stability.stability[0];
    const riskScore = this.calculateRiskScore(path);
    
    return (
      path.successRate * successWeight +
      speedScore * speedWeight +
      stabilityScore * stabilityWeight +
      riskScore * riskWeight
    );
  }

  private calculateRiskScore(path: ExecutionPath): number {
    return path.risks.reduce((total, risk) => {
      const severityScores: Record<RiskLevel, number> = {
        safe: 0,
        caution: 20,
        warning: 40,
        danger: 70,
        critical: 100
      };
      
      return total + (severityScores[risk.severity] * risk.likelihood / 100);
    }, 0);
  }

  // ─────────────────────────────────────────────────────────────
  // RISK ANALYSIS
  // ─────────────────────────────────────────────────────────────

  private calculateOverallRisk(paths: ExecutionPath[]): RiskLevel {
    const avgRisk = paths.reduce((sum, path) => {
      return sum + this.calculateRiskScore(path);
    }, 0) / paths.length;
    
    if (avgRisk < 20) return 'safe';
    if (avgRisk < 40) return 'caution';
    if (avgRisk < 60) return 'warning';
    if (avgRisk < 80) return 'danger';
    return 'critical';
  }

  private calculateForecastConfidence(
    paths: ExecutionPath[],
    context: ForecastScenario['context']
  ): number {
    let confidence = 70;
    
    // More history = more confidence
    confidence += Math.min(20, context.recentHistory.length * 2);
    
    // Path consistency
    const avgProbability = paths.reduce((sum, p) => sum + p.probability, 0) / paths.length;
    confidence += (avgProbability - 50) * 0.2;
    
    // System stability
    if (context.currentState.stability === 'optimal') {
      confidence += 10;
    } else if (context.currentState.stability === 'critical') {
      confidence -= 20;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  // ─────────────────────────────────────────────────────────────
  // PATH COMPARISON
  // ─────────────────────────────────────────────────────────────

  comparePaths(pathA: ExecutionPath, pathB: ExecutionPath): PathComparison {
    const scoreA = this.calculatePathScore(pathA);
    const scoreB = this.calculatePathScore(pathB);
    
    const betterPath = scoreA > scoreB ? pathA : pathB;
    
    let reason = '';
    if (pathA.successRate > pathB.successRate + 10) {
      reason = 'Path A has significantly higher success rate';
    } else if (pathB.successRate > pathA.successRate + 10) {
      reason = 'Path B has significantly higher success rate';
    } else if (pathA.duration < pathB.duration * 0.8) {
      reason = 'Path A is significantly faster';
    } else if (pathB.duration < pathA.duration * 0.8) {
      reason = 'Path B is significantly faster';
    } else {
      reason = 'Paths are similar, choosing based on overall score';
    }
    
    return {
      pathA,
      pathB,
      betterPath,
      reason,
      differences: {
        duration: pathB.duration - pathA.duration,
        successRate: pathA.successRate - pathB.successRate,
        risk: this.calculateRiskScore(pathB) - this.calculateRiskScore(pathA),
        stability: pathA.stability.stability[0] - pathB.stability.stability[0]
      }
    };
  }
}
