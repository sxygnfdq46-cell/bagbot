/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.1: STRATEGIC STATE MONITOR
 * ═══════════════════════════════════════════════════════════════════
 * Real-time monitoring of system health, emotional stability, and
 * execution readiness. Provides risk assessment and trend forecasting.
 * 
 * SAFETY: Read-only monitoring, no execution capability
 * PURPOSE: Pre-execution state analysis and warning system
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type RiskLevel = 'safe' | 'caution' | 'warning' | 'danger' | 'critical';
export type TrendDirection = 'improving' | 'stable' | 'degrading' | 'failing';
export type StabilityZone = 'optimal' | 'acceptable' | 'stressed' | 'unstable' | 'critical';

export interface SystemLoadMetrics {
  cpu: number;              // 0-100%
  memory: number;           // 0-100%
  activeFlows: number;
  queuedTasks: number;
  avgResponseTime: number;  // ms
  errorRate: number;        // 0-1
  timestamp: number;
}

export interface EmotionalStabilityMetrics {
  coreTemperament: number;      // 0-100
  adaptiveFlexibility: number;  // 0-100
  resonanceCoherence: number;   // 0-100
  toneStability: number;        // 0-100
  presenceConsistency: number;  // 0-100
  emotionalLoad: number;        // 0-100 (higher = more strain)
  harmonicBalance: number;      // 0-100
  timestamp: number;
}

export interface FlowCongestionMetrics {
  activeFlows: number;
  blockedFlows: number;
  conflictingFlows: number;
  avgFlowDuration: number;  // ms
  longestFlowWait: number;  // ms
  throughput: number;       // flows/min
  bottleneckScore: number;  // 0-100
  timestamp: number;
}

export interface StateDriftMetrics {
  intentionDrift: number;       // 0-100
  behaviorDrift: number;        // 0-100
  toneDrift: number;            // 0-100
  contextDrift: number;         // 0-100
  baselineDeviation: number;    // 0-100
  driftVelocity: number;        // rate of change
  timestamp: number;
}

export interface LongChainFatigueMetrics {
  chainDepth: number;
  chainDuration: number;        // ms
  decisionCount: number;
  contextSwitches: number;
  cumulativeComplexity: number; // 0-100
  fatigueScore: number;         // 0-100
  recoveryNeeded: number;       // ms
  timestamp: number;
}

export interface InstabilitySignature {
  type: 'oscillation' | 'spike' | 'drift' | 'cascade' | 'resonance';
  severity: number;          // 0-100
  frequency: number;         // occurrences/min
  duration: number;          // ms
  affectedSystems: string[];
  predictedEscalation: number; // 0-100
  timestamp: number;
}

export interface SystemHealthSnapshot {
  overall: RiskLevel;
  stability: StabilityZone;
  trend: TrendDirection;
  
  load: SystemLoadMetrics;
  emotional: EmotionalStabilityMetrics;
  congestion: FlowCongestionMetrics;
  drift: StateDriftMetrics;
  fatigue: LongChainFatigueMetrics;
  
  instabilities: InstabilitySignature[];
  warnings: string[];
  recommendations: string[];
  
  timestamp: number;
  nextCheckIn: number;
}

export interface TrendProjection {
  timeHorizon: number;      // ms into future
  expectedLoad: number;     // 0-100
  expectedStability: number; // 0-100
  expectedRisk: RiskLevel;
  confidence: number;       // 0-100
  breakingPoints: number[]; // timestamps where issues may occur
}

export interface HealthThresholds {
  load: {
    optimal: number;
    acceptable: number;
    stressed: number;
    critical: number;
  };
  emotional: {
    optimal: number;
    acceptable: number;
    stressed: number;
    critical: number;
  };
  congestion: {
    optimal: number;
    acceptable: number;
    stressed: number;
    critical: number;
  };
  drift: {
    optimal: number;
    acceptable: number;
    stressed: number;
    critical: number;
  };
  fatigue: {
    optimal: number;
    acceptable: number;
    stressed: number;
    critical: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// DEFAULT THRESHOLDS
// ─────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS: HealthThresholds = {
  load: {
    optimal: 40,
    acceptable: 60,
    stressed: 80,
    critical: 95
  },
  emotional: {
    optimal: 80,
    acceptable: 60,
    stressed: 40,
    critical: 20
  },
  congestion: {
    optimal: 30,
    acceptable: 50,
    stressed: 70,
    critical: 90
  },
  drift: {
    optimal: 10,
    acceptable: 25,
    stressed: 50,
    critical: 80
  },
  fatigue: {
    optimal: 20,
    acceptable: 40,
    stressed: 60,
    critical: 85
  }
};

// ─────────────────────────────────────────────────────────────────
// STRATEGIC STATE MONITOR CLASS
// ─────────────────────────────────────────────────────────────────

export class StrategicStateMonitor {
  private thresholds: HealthThresholds;
  private history: SystemHealthSnapshot[];
  private maxHistorySize: number;
  private monitoringInterval: number;
  private intervalId?: NodeJS.Timeout;
  
  constructor(
    thresholds: Partial<HealthThresholds> = {},
    maxHistorySize: number = 100,
    monitoringInterval: number = 5000
  ) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
    this.history = [];
    this.maxHistorySize = maxHistorySize;
    this.monitoringInterval = monitoringInterval;
  }

  // ─────────────────────────────────────────────────────────────
  // MONITORING LIFECYCLE
  // ─────────────────────────────────────────────────────────────

  startMonitoring(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.captureSnapshot();
    }, this.monitoringInterval);
    
    // Capture initial snapshot
    this.captureSnapshot();
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SNAPSHOT CAPTURE
  // ─────────────────────────────────────────────────────────────

  captureSnapshot(): SystemHealthSnapshot {
    const now = Date.now();
    
    const load = this.captureLoadMetrics();
    const emotional = this.captureEmotionalMetrics();
    const congestion = this.captureCongestionMetrics();
    const drift = this.captureDriftMetrics();
    const fatigue = this.captureFatigueMetrics();
    
    const instabilities = this.detectInstabilities({
      load,
      emotional,
      congestion,
      drift,
      fatigue
    });
    
    const stability = this.calculateStabilityZone({
      load,
      emotional,
      congestion,
      drift,
      fatigue
    });
    
    const overall = this.calculateOverallRisk({
      load,
      emotional,
      congestion,
      drift,
      fatigue,
      instabilities
    });
    
    const trend = this.calculateTrend();
    
    const warnings = this.generateWarnings({
      load,
      emotional,
      congestion,
      drift,
      fatigue,
      instabilities
    });
    
    const recommendations = this.generateRecommendations({
      load,
      emotional,
      congestion,
      drift,
      fatigue,
      stability,
      overall
    });
    
    const snapshot: SystemHealthSnapshot = {
      overall,
      stability,
      trend,
      load,
      emotional,
      congestion,
      drift,
      fatigue,
      instabilities,
      warnings,
      recommendations,
      timestamp: now,
      nextCheckIn: now + this.monitoringInterval
    };
    
    this.addToHistory(snapshot);
    
    return snapshot;
  }

  // ─────────────────────────────────────────────────────────────
  // METRICS CAPTURE (Mock implementation - integrate with real system)
  // ─────────────────────────────────────────────────────────────

  private captureLoadMetrics(): SystemLoadMetrics {
    // In production, integrate with actual system metrics
    return {
      cpu: Math.random() * 60 + 20,
      memory: Math.random() * 50 + 30,
      activeFlows: Math.floor(Math.random() * 5),
      queuedTasks: Math.floor(Math.random() * 10),
      avgResponseTime: Math.random() * 200 + 50,
      errorRate: Math.random() * 0.05,
      timestamp: Date.now()
    };
  }

  private captureEmotionalMetrics(): EmotionalStabilityMetrics {
    return {
      coreTemperament: Math.random() * 20 + 75,
      adaptiveFlexibility: Math.random() * 20 + 70,
      resonanceCoherence: Math.random() * 25 + 70,
      toneStability: Math.random() * 20 + 75,
      presenceConsistency: Math.random() * 15 + 80,
      emotionalLoad: Math.random() * 30 + 20,
      harmonicBalance: Math.random() * 20 + 75,
      timestamp: Date.now()
    };
  }

  private captureCongestionMetrics(): FlowCongestionMetrics {
    return {
      activeFlows: Math.floor(Math.random() * 5),
      blockedFlows: Math.floor(Math.random() * 2),
      conflictingFlows: Math.floor(Math.random() * 2),
      avgFlowDuration: Math.random() * 3000 + 1000,
      longestFlowWait: Math.random() * 5000 + 2000,
      throughput: Math.random() * 10 + 5,
      bottleneckScore: Math.random() * 40 + 10,
      timestamp: Date.now()
    };
  }

  private captureDriftMetrics(): StateDriftMetrics {
    return {
      intentionDrift: Math.random() * 15 + 5,
      behaviorDrift: Math.random() * 20 + 10,
      toneDrift: Math.random() * 10 + 5,
      contextDrift: Math.random() * 15 + 10,
      baselineDeviation: Math.random() * 20 + 10,
      driftVelocity: Math.random() * 5,
      timestamp: Date.now()
    };
  }

  private captureFatigueMetrics(): LongChainFatigueMetrics {
    return {
      chainDepth: Math.floor(Math.random() * 5 + 1),
      chainDuration: Math.random() * 30000 + 5000,
      decisionCount: Math.floor(Math.random() * 20 + 5),
      contextSwitches: Math.floor(Math.random() * 10 + 2),
      cumulativeComplexity: Math.random() * 40 + 20,
      fatigueScore: Math.random() * 30 + 15,
      recoveryNeeded: Math.random() * 10000 + 2000,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INSTABILITY DETECTION
  // ─────────────────────────────────────────────────────────────

  private detectInstabilities(metrics: {
    load: SystemLoadMetrics;
    emotional: EmotionalStabilityMetrics;
    congestion: FlowCongestionMetrics;
    drift: StateDriftMetrics;
    fatigue: LongChainFatigueMetrics;
  }): InstabilitySignature[] {
    const instabilities: InstabilitySignature[] = [];
    
    // Check for load spikes
    if (metrics.load.cpu > 80 || metrics.load.memory > 85) {
      instabilities.push({
        type: 'spike',
        severity: Math.max(metrics.load.cpu, metrics.load.memory),
        frequency: 1,
        duration: 0,
        affectedSystems: ['load', 'performance'],
        predictedEscalation: 60,
        timestamp: Date.now()
      });
    }
    
    // Check for emotional oscillation
    if (metrics.emotional.emotionalLoad > 70) {
      instabilities.push({
        type: 'oscillation',
        severity: metrics.emotional.emotionalLoad,
        frequency: 2,
        duration: 5000,
        affectedSystems: ['emotional', 'tone'],
        predictedEscalation: 45,
        timestamp: Date.now()
      });
    }
    
    // Check for drift
    if (metrics.drift.baselineDeviation > 50) {
      instabilities.push({
        type: 'drift',
        severity: metrics.drift.baselineDeviation,
        frequency: 1,
        duration: 10000,
        affectedSystems: ['identity', 'behavior'],
        predictedEscalation: 55,
        timestamp: Date.now()
      });
    }
    
    // Check for cascade risk
    if (metrics.congestion.bottleneckScore > 70 && metrics.load.activeFlows > 3) {
      instabilities.push({
        type: 'cascade',
        severity: metrics.congestion.bottleneckScore,
        frequency: 1,
        duration: metrics.congestion.avgFlowDuration,
        affectedSystems: ['flow', 'execution'],
        predictedEscalation: 70,
        timestamp: Date.now()
      });
    }
    
    // Check for resonance issues
    if (metrics.emotional.resonanceCoherence < 50) {
      instabilities.push({
        type: 'resonance',
        severity: 100 - metrics.emotional.resonanceCoherence,
        frequency: 3,
        duration: 3000,
        affectedSystems: ['emotional', 'presence'],
        predictedEscalation: 40,
        timestamp: Date.now()
      });
    }
    
    return instabilities;
  }

  // ─────────────────────────────────────────────────────────────
  // RISK CALCULATIONS
  // ─────────────────────────────────────────────────────────────

  private calculateStabilityZone(metrics: {
    load: SystemLoadMetrics;
    emotional: EmotionalStabilityMetrics;
    congestion: FlowCongestionMetrics;
    drift: StateDriftMetrics;
    fatigue: LongChainFatigueMetrics;
  }): StabilityZone {
    const scores = {
      load: this.calculateLoadScore(metrics.load),
      emotional: this.calculateEmotionalScore(metrics.emotional),
      congestion: this.calculateCongestionScore(metrics.congestion),
      drift: this.calculateDriftScore(metrics.drift),
      fatigue: this.calculateFatigueScore(metrics.fatigue)
    };
    
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;
    
    if (avgScore >= 80) return 'optimal';
    if (avgScore >= 60) return 'acceptable';
    if (avgScore >= 40) return 'stressed';
    if (avgScore >= 20) return 'unstable';
    return 'critical';
  }

  private calculateOverallRisk(context: {
    load: SystemLoadMetrics;
    emotional: EmotionalStabilityMetrics;
    congestion: FlowCongestionMetrics;
    drift: StateDriftMetrics;
    fatigue: LongChainFatigueMetrics;
    instabilities: InstabilitySignature[];
  }): RiskLevel {
    let riskScore = 0;
    
    // Load contribution
    riskScore += this.calculateLoadRisk(context.load) * 0.2;
    
    // Emotional contribution
    riskScore += this.calculateEmotionalRisk(context.emotional) * 0.25;
    
    // Congestion contribution
    riskScore += this.calculateCongestionRisk(context.congestion) * 0.15;
    
    // Drift contribution
    riskScore += this.calculateDriftRisk(context.drift) * 0.2;
    
    // Fatigue contribution
    riskScore += this.calculateFatigueRisk(context.fatigue) * 0.15;
    
    // Instability contribution
    const maxInstabilitySeverity = Math.max(
      ...context.instabilities.map(i => i.severity),
      0
    );
    riskScore += (maxInstabilitySeverity / 100) * 0.05;
    
    if (riskScore < 0.2) return 'safe';
    if (riskScore < 0.4) return 'caution';
    if (riskScore < 0.6) return 'warning';
    if (riskScore < 0.8) return 'danger';
    return 'critical';
  }

  private calculateTrend(): TrendDirection {
    if (this.history.length < 3) return 'stable';
    
    const recent = this.history.slice(-3);
    const scores = recent.map(s => this.snapshotToScore(s));
    
    const trend = scores[2] - scores[0];
    
    if (trend > 10) return 'improving';
    if (trend < -10) return 'degrading';
    if (trend < -30) return 'failing';
    return 'stable';
  }

  // ─────────────────────────────────────────────────────────────
  // SCORING HELPERS
  // ─────────────────────────────────────────────────────────────

  private calculateLoadScore(load: SystemLoadMetrics): number {
    const cpuScore = 100 - load.cpu;
    const memScore = 100 - load.memory;
    const errorScore = (1 - load.errorRate) * 100;
    
    return (cpuScore + memScore + errorScore) / 3;
  }

  private calculateEmotionalScore(emotional: EmotionalStabilityMetrics): number {
    return (
      emotional.coreTemperament +
      emotional.adaptiveFlexibility +
      emotional.resonanceCoherence +
      emotional.toneStability +
      emotional.presenceConsistency +
      emotional.harmonicBalance +
      (100 - emotional.emotionalLoad)
    ) / 7;
  }

  private calculateCongestionScore(congestion: FlowCongestionMetrics): number {
    return 100 - congestion.bottleneckScore;
  }

  private calculateDriftScore(drift: StateDriftMetrics): number {
    return 100 - drift.baselineDeviation;
  }

  private calculateFatigueScore(fatigue: LongChainFatigueMetrics): number {
    return 100 - fatigue.fatigueScore;
  }

  private calculateLoadRisk(load: SystemLoadMetrics): number {
    return (load.cpu + load.memory + load.errorRate * 100) / 300;
  }

  private calculateEmotionalRisk(emotional: EmotionalStabilityMetrics): number {
    return emotional.emotionalLoad / 100;
  }

  private calculateCongestionRisk(congestion: FlowCongestionMetrics): number {
    return congestion.bottleneckScore / 100;
  }

  private calculateDriftRisk(drift: StateDriftMetrics): number {
    return drift.baselineDeviation / 100;
  }

  private calculateFatigueRisk(fatigue: LongChainFatigueMetrics): number {
    return fatigue.fatigueScore / 100;
  }

  private snapshotToScore(snapshot: SystemHealthSnapshot): number {
    const riskToScore: Record<RiskLevel, number> = {
      safe: 100,
      caution: 70,
      warning: 50,
      danger: 30,
      critical: 10
    };
    
    return riskToScore[snapshot.overall];
  }

  // ─────────────────────────────────────────────────────────────
  // WARNING GENERATION
  // ─────────────────────────────────────────────────────────────

  private generateWarnings(context: {
    load: SystemLoadMetrics;
    emotional: EmotionalStabilityMetrics;
    congestion: FlowCongestionMetrics;
    drift: StateDriftMetrics;
    fatigue: LongChainFatigueMetrics;
    instabilities: InstabilitySignature[];
  }): string[] {
    const warnings: string[] = [];
    
    if (context.load.cpu > this.thresholds.load.stressed) {
      warnings.push(`High CPU usage: ${context.load.cpu.toFixed(1)}%`);
    }
    
    if (context.emotional.emotionalLoad > this.thresholds.emotional.stressed) {
      warnings.push(`Elevated emotional load: ${context.emotional.emotionalLoad.toFixed(1)}`);
    }
    
    if (context.congestion.bottleneckScore > this.thresholds.congestion.stressed) {
      warnings.push(`Flow bottleneck detected: ${context.congestion.bottleneckScore.toFixed(1)}`);
    }
    
    if (context.drift.baselineDeviation > this.thresholds.drift.stressed) {
      warnings.push(`Significant baseline drift: ${context.drift.baselineDeviation.toFixed(1)}`);
    }
    
    if (context.fatigue.fatigueScore > this.thresholds.fatigue.stressed) {
      warnings.push(`Long-chain fatigue detected: ${context.fatigue.fatigueScore.toFixed(1)}`);
    }
    
    context.instabilities.forEach(inst => {
      if (inst.severity > 60) {
        warnings.push(`${inst.type} instability in ${inst.affectedSystems.join(', ')}`);
      }
    });
    
    return warnings;
  }

  // ─────────────────────────────────────────────────────────────
  // RECOMMENDATION GENERATION
  // ─────────────────────────────────────────────────────────────

  private generateRecommendations(context: {
    load: SystemLoadMetrics;
    emotional: EmotionalStabilityMetrics;
    congestion: FlowCongestionMetrics;
    drift: StateDriftMetrics;
    fatigue: LongChainFatigueMetrics;
    stability: StabilityZone;
    overall: RiskLevel;
  }): string[] {
    const recommendations: string[] = [];
    
    if (context.overall === 'critical' || context.overall === 'danger') {
      recommendations.push('⚠️ Delay non-critical operations until system stabilizes');
    }
    
    if (context.stability === 'critical' || context.stability === 'unstable') {
      recommendations.push('Consider reducing concurrent flow execution');
    }
    
    if (context.emotional.emotionalLoad > 70) {
      recommendations.push('Allow emotional recalibration time before complex tasks');
    }
    
    if (context.fatigue.fatigueScore > 60) {
      recommendations.push(`Recovery period recommended: ${(context.fatigue.recoveryNeeded / 1000).toFixed(1)}s`);
    }
    
    if (context.drift.baselineDeviation > 50) {
      recommendations.push('Baseline recalibration suggested');
    }
    
    if (context.congestion.blockedFlows > 0) {
      recommendations.push(`Resolve ${context.congestion.blockedFlows} blocked flow(s) before adding new tasks`);
    }
    
    if (context.overall === 'safe' && context.stability === 'optimal') {
      recommendations.push('✅ System ready for complex operations');
    }
    
    return recommendations;
  }

  // ─────────────────────────────────────────────────────────────
  // TREND PROJECTION
  // ─────────────────────────────────────────────────────────────

  projectTrend(timeHorizon: number): TrendProjection {
    if (this.history.length < 5) {
      return {
        timeHorizon,
        expectedLoad: 50,
        expectedStability: 70,
        expectedRisk: 'caution',
        confidence: 30,
        breakingPoints: []
      };
    }
    
    const recent = this.history.slice(-10);
    const loadTrend = this.calculateMetricTrend(recent.map(s => s.load.cpu));
    const stabilityTrend = this.calculateMetricTrend(
      recent.map(s => this.calculateEmotionalScore(s.emotional))
    );
    
    const expectedLoad = Math.min(100, Math.max(0, 
      recent[recent.length - 1].load.cpu + loadTrend * (timeHorizon / 5000)
    ));
    
    const expectedStability = Math.min(100, Math.max(0,
      this.calculateEmotionalScore(recent[recent.length - 1].emotional) + 
      stabilityTrend * (timeHorizon / 5000)
    ));
    
    let expectedRisk: RiskLevel = 'safe';
    if (expectedLoad > 80 || expectedStability < 40) expectedRisk = 'danger';
    else if (expectedLoad > 60 || expectedStability < 60) expectedRisk = 'warning';
    else if (expectedLoad > 40 || expectedStability < 70) expectedRisk = 'caution';
    
    const confidence = Math.min(100, recent.length * 10);
    
    return {
      timeHorizon,
      expectedLoad,
      expectedStability,
      expectedRisk,
      confidence,
      breakingPoints: []
    };
  }

  private calculateMetricTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const recent = values[values.length - 1];
    const older = values[values.length - 2];
    
    return recent - older;
  }

  // ─────────────────────────────────────────────────────────────
  // HISTORY MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  private addToHistory(snapshot: SystemHealthSnapshot): void {
    this.history.push(snapshot);
    
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getHistory(count?: number): SystemHealthSnapshot[] {
    if (!count) return [...this.history];
    return this.history.slice(-count);
  }

  getLatestSnapshot(): SystemHealthSnapshot | null {
    return this.history[this.history.length - 1] || null;
  }

  clearHistory(): void {
    this.history = [];
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────

  isSystemHealthy(): boolean {
    const latest = this.getLatestSnapshot();
    if (!latest) return true;
    
    return latest.overall === 'safe' || latest.overall === 'caution';
  }

  requiresRecovery(): boolean {
    const latest = this.getLatestSnapshot();
    if (!latest) return false;
    
    return latest.overall === 'critical' || latest.stability === 'critical';
  }

  getRecoveryTime(): number {
    const latest = this.getLatestSnapshot();
    if (!latest) return 0;
    
    return latest.fatigue.recoveryNeeded;
  }
}
