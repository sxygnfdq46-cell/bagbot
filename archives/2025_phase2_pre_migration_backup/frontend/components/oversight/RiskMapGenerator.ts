/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.4: RISK MAP GENERATOR
 * ═══════════════════════════════════════════════════════════════════
 * Creates 4D risk maps showing hazards, bottlenecks, instabilities,
 * and system strain across time, scope, impact, and mode dimensions.
 * 
 * SAFETY: Analysis and visualization only - no execution
 * PURPOSE: Pre-execution risk visualization and assessment
 * ═══════════════════════════════════════════════════════════════════
 */

import type { RiskLevel, SystemHealthSnapshot } from './StrategicStateMonitor';
import type { ExecutionPath, ForecastScenario } from './MultiPathForecastEngine';
import type { CommandIntent } from './IntentClarificationMatrix';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type RiskZone = 'SAFE' | 'CAUTION' | 'UNSTABLE' | 'FORBIDDEN';
export type HazardType = 'resource' | 'timing' | 'stability' | 'cascade' | 'conflict' | 'unknown';

export interface RiskCoordinate {
  time: number;        // 0-100 (execution timeline position)
  scope: number;       // 0-100 (breadth of impact)
  impact: number;      // 0-100 (severity level)
  mode: 'sequential' | 'parallel' | 'conditional' | 'fallback';
}

export interface RiskPoint {
  coordinate: RiskCoordinate;
  level: RiskLevel;
  zone: RiskZone;
  hazards: Hazard[];
  score: number;       // 0-100 (combined risk score)
  timestamp: number;
}

export interface Hazard {
  type: HazardType;
  severity: RiskLevel;
  probability: number;  // 0-100
  description: string;
  affectedArea: {
    timeRange: [number, number];
    scopeRange: [number, number];
    impactRange: [number, number];
  };
  mitigation?: string;
}

export interface Bottleneck {
  location: RiskCoordinate;
  type: 'resource' | 'dependency' | 'flow' | 'processing';
  severity: number;     // 0-100
  cause: string;
  affectedPaths: string[];
  estimatedDelay: number; // ms
  resolution: string;
}

export interface InstabilityPocket {
  center: RiskCoordinate;
  radius: number;       // 0-100 (size of unstable region)
  intensity: number;    // 0-100
  type: 'oscillation' | 'drift' | 'cascade' | 'resonance';
  triggerConditions: string[];
  recoveryTime: number; // ms
}

export interface ResourceStrain {
  resource: 'cpu' | 'memory' | 'emotional' | 'coordination' | 'flow';
  current: number;      // 0-100
  projected: number;    // 0-100
  capacity: number;     // 0-100
  strain: number;       // 0-100 (how strained)
  breakpoint?: number;  // timestamp when resource exhausts
}

export interface ToneHarmonicMismatch {
  location: RiskCoordinate;
  expectedTone: string;
  actualTone: string;
  dissonance: number;   // 0-100
  impact: string;
  adjustment: string;
}

export interface RiskMap {
  id: string;
  command: string;
  forecast: ForecastScenario;
  
  // 4D Risk Grid
  riskPoints: RiskPoint[];
  
  // Specific risk elements
  hazards: Hazard[];
  bottlenecks: Bottleneck[];
  instabilities: InstabilityPocket[];
  strains: ResourceStrain[];
  mismatches: ToneHarmonicMismatch[];
  
  // Overall assessment
  overallZone: RiskZone;
  safeRegions: RiskCoordinate[];
  dangerRegions: RiskCoordinate[];
  forbiddenRegions: RiskCoordinate[];
  
  // Recommendations
  warnings: string[];
  blockers: string[];
  suggestions: string[];
  
  // Metadata
  confidence: number;   // 0-100
  timestamp: number;
}

export interface RiskAssessment {
  zone: RiskZone;
  score: number;        // 0-100
  canProceed: boolean;
  requiresRewriting: boolean;
  reasons: string[];
  recommendations: string[];
}

// ─────────────────────────────────────────────────────────────────
// RISK MAP GENERATOR CLASS
// ─────────────────────────────────────────────────────────────────

export class RiskMapGenerator {
  private gridResolution: number;
  private hazardThresholds: Record<RiskLevel, number>;
  
  constructor(gridResolution: number = 20) {
    this.gridResolution = gridResolution;
    this.hazardThresholds = {
      safe: 20,
      caution: 40,
      warning: 60,
      danger: 80,
      critical: 95
    };
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN GENERATION METHOD
  // ─────────────────────────────────────────────────────────────

  async generateRiskMap(
    command: string,
    forecast: ForecastScenario,
    intent: CommandIntent,
    currentState: SystemHealthSnapshot
  ): Promise<RiskMap> {
    
    // Generate 4D risk grid
    const riskPoints = this.generate4DRiskGrid(forecast, currentState);
    
    // Identify specific risk elements
    const hazards = this.identifyHazards(forecast, currentState);
    const bottlenecks = this.identifyBottlenecks(forecast, currentState);
    const instabilities = this.identifyInstabilityPockets(forecast, currentState);
    const strains = this.calculateResourceStrains(forecast, currentState);
    const mismatches = this.detectToneHarmonicMismatches(forecast, currentState);
    
    // Categorize regions
    const { safe, danger, forbidden } = this.categorizeRegions(riskPoints);
    
    // Overall assessment
    const overallZone = this.determineOverallZone(riskPoints, hazards, bottlenecks);
    
    // Generate guidance
    const warnings = this.generateWarnings(hazards, bottlenecks, instabilities);
    const blockers = this.identifyBlockers(overallZone, hazards, intent);
    const suggestions = this.generateSuggestions(overallZone, forecast);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(forecast, riskPoints);
    
    return {
      id: `risk-map-${Date.now()}`,
      command,
      forecast,
      riskPoints,
      hazards,
      bottlenecks,
      instabilities,
      strains,
      mismatches,
      overallZone,
      safeRegions: safe,
      dangerRegions: danger,
      forbiddenRegions: forbidden,
      warnings,
      blockers,
      suggestions,
      confidence,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4D RISK GRID GENERATION
  // ─────────────────────────────────────────────────────────────

  private generate4DRiskGrid(
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): RiskPoint[] {
    
    const points: RiskPoint[] = [];
    const modes: RiskCoordinate['mode'][] = ['sequential', 'parallel', 'conditional', 'fallback'];
    
    // Generate grid points
    for (let t = 0; t <= 100; t += 100 / this.gridResolution) {
      for (let s = 0; s <= 100; s += 100 / this.gridResolution) {
        for (let i = 0; i <= 100; i += 100 / this.gridResolution) {
          for (const mode of modes) {
            const coordinate: RiskCoordinate = { time: t, scope: s, impact: i, mode };
            const point = this.calculateRiskPoint(coordinate, forecast, currentState);
            points.push(point);
          }
        }
      }
    }
    
    return points;
  }

  private calculateRiskPoint(
    coordinate: RiskCoordinate,
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): RiskPoint {
    
    // Calculate base risk from coordinate
    let score = 0;
    
    // Time risk (earlier = less risk due to more time for recovery)
    score += (100 - coordinate.time) * 0.1;
    
    // Scope risk (broader = more risk)
    score += coordinate.scope * 0.2;
    
    // Impact risk (higher = more risk)
    score += coordinate.impact * 0.4;
    
    // Mode risk
    const modeRisk: Record<RiskCoordinate['mode'], number> = {
      sequential: 10,
      parallel: 30,
      conditional: 20,
      fallback: 15
    };
    score += modeRisk[coordinate.mode] * 0.3;
    
    // Adjust for system state
    if (currentState.overall === 'critical') score += 30;
    else if (currentState.overall === 'danger') score += 20;
    else if (currentState.overall === 'warning') score += 10;
    
    // Normalize
    score = Math.min(100, Math.max(0, score));
    
    // Determine level
    let level: RiskLevel = 'safe';
    if (score > 80) level = 'critical';
    else if (score > 60) level = 'danger';
    else if (score > 40) level = 'warning';
    else if (score > 20) level = 'caution';
    
    // Determine zone
    let zone: RiskZone = 'SAFE';
    if (score > 85) zone = 'FORBIDDEN';
    else if (score > 65) zone = 'UNSTABLE';
    else if (score > 40) zone = 'CAUTION';
    
    // Identify local hazards
    const hazards = this.identifyLocalHazards(coordinate, forecast, currentState);
    
    return {
      coordinate,
      level,
      zone,
      hazards,
      score,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HAZARD IDENTIFICATION
  // ─────────────────────────────────────────────────────────────

  private identifyHazards(
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): Hazard[] {
    
    const hazards: Hazard[] = [];
    
    // Resource hazards
    if (currentState.load.cpu > 80) {
      hazards.push({
        type: 'resource',
        severity: 'danger',
        probability: 75,
        description: 'High CPU usage may cause performance degradation',
        affectedArea: {
          timeRange: [0, 50],
          scopeRange: [50, 100],
          impactRange: [40, 100]
        },
        mitigation: 'Reduce concurrent operations or wait for CPU to stabilize'
      });
    }
    
    // Timing hazards
    if (forecast.context.queuedTasks > 5) {
      hazards.push({
        type: 'timing',
        severity: 'warning',
        probability: 60,
        description: 'Queue congestion may cause delays',
        affectedArea: {
          timeRange: [20, 80],
          scopeRange: [0, 100],
          impactRange: [0, 60]
        },
        mitigation: 'Process queue before adding new tasks'
      });
    }
    
    // Stability hazards
    if (currentState.emotional.emotionalLoad > 70) {
      hazards.push({
        type: 'stability',
        severity: 'warning',
        probability: 65,
        description: 'High emotional load may affect tone consistency',
        affectedArea: {
          timeRange: [0, 100],
          scopeRange: [60, 100],
          impactRange: [50, 100]
        },
        mitigation: 'Allow emotional recovery period'
      });
    }
    
    // Cascade hazards
    const highImpactPaths = forecast.paths.filter(p => p.impact.cascading > 60);
    if (highImpactPaths.length > 0) {
      hazards.push({
        type: 'cascade',
        severity: 'danger',
        probability: 50,
        description: 'Risk of cascading failures across multiple systems',
        affectedArea: {
          timeRange: [40, 100],
          scopeRange: [70, 100],
          impactRange: [70, 100]
        },
        mitigation: 'Use sequential execution with checkpoints'
      });
    }
    
    return hazards;
  }

  private identifyLocalHazards(
    coordinate: RiskCoordinate,
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): Hazard[] {
    
    // Return hazards that affect this specific coordinate
    return this.identifyHazards(forecast, currentState).filter(h => {
      const [tMin, tMax] = h.affectedArea.timeRange;
      const [sMin, sMax] = h.affectedArea.scopeRange;
      const [iMin, iMax] = h.affectedArea.impactRange;
      
      return (
        coordinate.time >= tMin && coordinate.time <= tMax &&
        coordinate.scope >= sMin && coordinate.scope <= sMax &&
        coordinate.impact >= iMin && coordinate.impact <= iMax
      );
    });
  }

  // ─────────────────────────────────────────────────────────────
  // BOTTLENECK IDENTIFICATION
  // ─────────────────────────────────────────────────────────────

  private identifyBottlenecks(
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): Bottleneck[] {
    
    const bottlenecks: Bottleneck[] = [];
    
    // Flow bottleneck
    if (currentState.congestion.bottleneckScore > 60) {
      bottlenecks.push({
        location: { time: 30, scope: 60, impact: 50, mode: 'parallel' },
        type: 'flow',
        severity: currentState.congestion.bottleneckScore,
        cause: 'High flow congestion',
        affectedPaths: forecast.paths.map(p => p.id),
        estimatedDelay: currentState.congestion.longestFlowWait,
        resolution: 'Clear blocked flows or reduce parallel execution'
      });
    }
    
    // Resource bottleneck
    if (currentState.load.memory > 85) {
      bottlenecks.push({
        location: { time: 50, scope: 80, impact: 70, mode: 'sequential' },
        type: 'resource',
        severity: currentState.load.memory,
        cause: 'Memory pressure',
        affectedPaths: [],
        estimatedDelay: 5000,
        resolution: 'Free memory or reduce scope'
      });
    }
    
    // Dependency bottleneck
    forecast.paths.forEach(path => {
      if (path.blockers.length > 0) {
        bottlenecks.push({
          location: { time: 20, scope: 40, impact: 60, mode: path.id.includes('safe') ? 'sequential' : 'parallel' },
          type: 'dependency',
          severity: 60,
          cause: `Blocked by: ${path.blockers.join(', ')}`,
          affectedPaths: [path.id],
          estimatedDelay: path.duration * 0.3,
          resolution: 'Resolve blockers before execution'
        });
      }
    });
    
    return bottlenecks;
  }

  // ─────────────────────────────────────────────────────────────
  // INSTABILITY POCKET DETECTION
  // ─────────────────────────────────────────────────────────────

  private identifyInstabilityPockets(
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): InstabilityPocket[] {
    
    const pockets: InstabilityPocket[] = [];
    
    // Check for oscillation pockets
    if (currentState.emotional.emotionalLoad > 60 && currentState.emotional.harmonicBalance < 60) {
      pockets.push({
        center: { time: 40, scope: 50, impact: 60, mode: 'parallel' },
        radius: 25,
        intensity: 70,
        type: 'oscillation',
        triggerConditions: ['High emotional load', 'Low harmonic balance'],
        recoveryTime: 15000
      });
    }
    
    // Check for drift pockets
    if (currentState.drift.baselineDeviation > 40) {
      pockets.push({
        center: { time: 60, scope: 70, impact: 50, mode: 'conditional' },
        radius: 30,
        intensity: currentState.drift.baselineDeviation,
        type: 'drift',
        triggerConditions: ['Baseline deviation', 'Context drift'],
        recoveryTime: 20000
      });
    }
    
    // Check for cascade pockets
    const riskyPaths = forecast.paths.filter(p => p.risks.some(r => r.type === 'cascade'));
    if (riskyPaths.length > 0) {
      pockets.push({
        center: { time: 70, scope: 80, impact: 85, mode: 'parallel' },
        radius: 20,
        intensity: 80,
        type: 'cascade',
        triggerConditions: ['Multiple concurrent operations', 'High system load'],
        recoveryTime: 30000
      });
    }
    
    return pockets;
  }

  // ─────────────────────────────────────────────────────────────
  // RESOURCE STRAIN CALCULATION
  // ─────────────────────────────────────────────────────────────

  private calculateResourceStrains(
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): ResourceStrain[] {
    
    const strains: ResourceStrain[] = [];
    
    // CPU strain
    strains.push({
      resource: 'cpu',
      current: currentState.load.cpu,
      projected: Math.min(100, currentState.load.cpu + 15),
      capacity: 100,
      strain: currentState.load.cpu,
      breakpoint: currentState.load.cpu > 90 ? Date.now() + 10000 : undefined
    });
    
    // Memory strain
    strains.push({
      resource: 'memory',
      current: currentState.load.memory,
      projected: Math.min(100, currentState.load.memory + 10),
      capacity: 100,
      strain: currentState.load.memory,
      breakpoint: currentState.load.memory > 95 ? Date.now() + 5000 : undefined
    });
    
    // Emotional strain
    strains.push({
      resource: 'emotional',
      current: currentState.emotional.emotionalLoad,
      projected: Math.min(100, currentState.emotional.emotionalLoad + 12),
      capacity: 100,
      strain: currentState.emotional.emotionalLoad,
      breakpoint: currentState.emotional.emotionalLoad > 85 ? Date.now() + 15000 : undefined
    });
    
    // Flow strain
    strains.push({
      resource: 'flow',
      current: currentState.congestion.bottleneckScore,
      projected: Math.min(100, currentState.congestion.bottleneckScore + 8),
      capacity: 100,
      strain: currentState.congestion.bottleneckScore
    });
    
    return strains;
  }

  // ─────────────────────────────────────────────────────────────
  // TONE HARMONIC MISMATCH DETECTION
  // ─────────────────────────────────────────────────────────────

  private detectToneHarmonicMismatches(
    forecast: ForecastScenario,
    currentState: SystemHealthSnapshot
  ): ToneHarmonicMismatch[] {
    
    const mismatches: ToneHarmonicMismatch[] = [];
    
    // Check if emotional load conflicts with expected tone
    if (currentState.emotional.emotionalLoad > 70 && currentState.emotional.toneStability < 60) {
      mismatches.push({
        location: { time: 50, scope: 60, impact: 55, mode: 'sequential' },
        expectedTone: 'stable',
        actualTone: 'stressed',
        dissonance: 100 - currentState.emotional.toneStability,
        impact: 'May affect communication quality',
        adjustment: 'Reduce emotional load before proceeding'
      });
    }
    
    return mismatches;
  }

  // ─────────────────────────────────────────────────────────────
  // REGION CATEGORIZATION
  // ─────────────────────────────────────────────────────────────

  private categorizeRegions(riskPoints: RiskPoint[]): {
    safe: RiskCoordinate[];
    danger: RiskCoordinate[];
    forbidden: RiskCoordinate[];
  } {
    
    const safe: RiskCoordinate[] = [];
    const danger: RiskCoordinate[] = [];
    const forbidden: RiskCoordinate[] = [];
    
    riskPoints.forEach(point => {
      if (point.zone === 'SAFE') {
        safe.push(point.coordinate);
      } else if (point.zone === 'UNSTABLE' || point.zone === 'CAUTION') {
        danger.push(point.coordinate);
      } else if (point.zone === 'FORBIDDEN') {
        forbidden.push(point.coordinate);
      }
    });
    
    return { safe, danger, forbidden };
  }

  // ─────────────────────────────────────────────────────────────
  // OVERALL ZONE DETERMINATION
  // ─────────────────────────────────────────────────────────────

  private determineOverallZone(
    riskPoints: RiskPoint[],
    hazards: Hazard[],
    bottlenecks: Bottleneck[]
  ): RiskZone {
    
    // Count points in each zone
    const zoneCounts = {
      SAFE: 0,
      CAUTION: 0,
      UNSTABLE: 0,
      FORBIDDEN: 0
    };
    
    riskPoints.forEach(p => zoneCounts[p.zone]++);
    
    // If more than 20% forbidden, overall is forbidden
    if (zoneCounts.FORBIDDEN > riskPoints.length * 0.2) {
      return 'FORBIDDEN';
    }
    
    // If critical hazards exist
    if (hazards.some(h => h.severity === 'critical')) {
      return 'FORBIDDEN';
    }
    
    // If blocking bottlenecks exist
    if (bottlenecks.some(b => b.severity > 90)) {
      return 'UNSTABLE';
    }
    
    // If more than 40% unstable
    if (zoneCounts.UNSTABLE > riskPoints.length * 0.4) {
      return 'UNSTABLE';
    }
    
    // If more than 30% caution
    if (zoneCounts.CAUTION > riskPoints.length * 0.3) {
      return 'CAUTION';
    }
    
    return 'SAFE';
  }

  // ─────────────────────────────────────────────────────────────
  // GUIDANCE GENERATION
  // ─────────────────────────────────────────────────────────────

  private generateWarnings(
    hazards: Hazard[],
    bottlenecks: Bottleneck[],
    instabilities: InstabilityPocket[]
  ): string[] {
    
    const warnings: string[] = [];
    
    hazards.forEach(h => {
      if (h.severity === 'danger' || h.severity === 'critical') {
        warnings.push(h.description);
      }
    });
    
    bottlenecks.forEach(b => {
      if (b.severity > 70) {
        warnings.push(b.cause);
      }
    });
    
    instabilities.forEach(i => {
      if (i.intensity > 70) {
        warnings.push(`${i.type} instability detected`);
      }
    });
    
    return warnings;
  }

  private identifyBlockers(
    zone: RiskZone,
    hazards: Hazard[],
    intent: CommandIntent
  ): string[] {
    
    const blockers: string[] = [];
    
    if (zone === 'FORBIDDEN') {
      blockers.push('Execution forbidden - risk level too high');
    }
    
    const criticalHazards = hazards.filter(h => h.severity === 'critical');
    criticalHazards.forEach(h => {
      blockers.push(`Critical hazard: ${h.description}`);
    });
    
    if (intent.alignment.withBoundaries < 80) {
      blockers.push('Command exceeds safety boundaries');
    }
    
    return blockers;
  }

  private generateSuggestions(zone: RiskZone, forecast: ForecastScenario): string[] {
    const suggestions: string[] = [];
    
    if (zone === 'FORBIDDEN') {
      suggestions.push('Rewrite command with reduced scope or impact');
      suggestions.push('Wait for system to stabilize before execution');
    } else if (zone === 'UNSTABLE') {
      suggestions.push('Consider using safe execution path');
      suggestions.push('Add recovery checkpoints');
    } else if (zone === 'CAUTION') {
      suggestions.push('Monitor execution closely');
      suggestions.push('Prepare rollback plan');
    } else {
      suggestions.push('Proceed with recommended execution path');
    }
    
    return suggestions;
  }

  // ─────────────────────────────────────────────────────────────
  // CONFIDENCE CALCULATION
  // ─────────────────────────────────────────────────────────────

  private calculateConfidence(
    forecast: ForecastScenario,
    riskPoints: RiskPoint[]
  ): number {
    
    let confidence = forecast.confidence;
    
    // Reduce if high variance in risk scores
    const scores = riskPoints.map(p => p.score);
    const variance = this.calculateVariance(scores);
    
    if (variance > 500) {
      confidence -= 15;
    } else if (variance > 300) {
      confidence -= 10;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
  }

  // ─────────────────────────────────────────────────────────────
  // RISK ASSESSMENT
  // ─────────────────────────────────────────────────────────────

  assessRisk(riskMap: RiskMap): RiskAssessment {
    const zone = riskMap.overallZone;
    const avgScore = riskMap.riskPoints.reduce((sum, p) => sum + p.score, 0) / riskMap.riskPoints.length;
    
    const canProceed = zone === 'SAFE' || zone === 'CAUTION';
    const requiresRewriting = zone === 'FORBIDDEN' || (zone === 'UNSTABLE' && avgScore > 75);
    
    const reasons: string[] = [];
    const recommendations: string[] = [];
    
    if (zone === 'FORBIDDEN') {
      reasons.push('Risk level exceeds acceptable thresholds');
      recommendations.push('Rewrite command or wait for better conditions');
    } else if (zone === 'UNSTABLE') {
      reasons.push('System state is unstable for this operation');
      recommendations.push('Use safer execution path or stabilize system first');
    } else if (zone === 'CAUTION') {
      reasons.push('Elevated risk requires careful monitoring');
      recommendations.push('Proceed with increased monitoring and rollback readiness');
    } else {
      reasons.push('Risk level is acceptable');
      recommendations.push('Execute with standard monitoring');
    }
    
    return {
      zone,
      score: avgScore,
      canProceed,
      requiresRewriting,
      reasons,
      recommendations
    };
  }
}
