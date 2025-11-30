// ShieldIntelligenceAPI.ts
// BagBot Intelligence Access Layer
// Strict analysis-only: 0 autonomous actions, no execution commands

import { ShieldOrchestrator } from './ShieldOrchestrator';
import { ClusterResult } from './ThreatClusterEngine';
import { RootCauseResult } from './RootCauseEngine';
import { PredictionResult } from './PredictionHorizon';
import { CorrelationSnapshot } from './CorrelationMatrixEngine';
import { IntelligencePayload } from './types';

type Listener = (payload: IntelligencePayload) => void;
type RiskListener = (risk: number) => void;
type ClusterListener = (clusters: ClusterResult[]) => void;

export class ShieldIntelligenceAPI {
  private orchestrator = ShieldOrchestrator.getInstance();
  private listeners: Set<Listener> = new Set();
  private riskListeners: Set<RiskListener> = new Set();
  private clusterListeners: Set<ClusterListener> = new Set();

  private static instance: ShieldIntelligenceAPI;

  private constructor() {
    this.bindOrchestratorEvents();
  }

  static getInstance(): ShieldIntelligenceAPI {
    if (!this.instance) this.instance = new ShieldIntelligenceAPI();
    return this.instance;
  }

  /** Bind internal events → public API listeners */
  private bindOrchestratorEvents() {
    this.orchestrator.on('intelligence-update', (payload) => {
      this.listeners.forEach(cb => cb(payload));
    });

    this.orchestrator.on('high-risk-detected', (risk) => {
      this.riskListeners.forEach(cb => cb(risk));
    });

    this.orchestrator.on('cascade-warning', () => {
      // No action, events exposed in full payload
    });

    this.orchestrator.on('prediction-shift', () => {});
    this.orchestrator.on('performance-degraded', () => {});
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 DIRECT ACCESSORS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Full unified intelligence snapshot (safe, read-only) */
  public getSnapshot(): IntelligencePayload {
    return this.orchestrator.getLatestSnapshot();
  }

  /** All active threat clusters */
  public getClusters(): ClusterResult[] {
    return this.orchestrator.getThreatClusters();
  }

  /** Root-cause chain (causal DAG) */
  public getRootCause(): RootCauseResult {
    return this.orchestrator.getRootCause();
  }

  /** 4-stage forecast results */
  public getPredictions(): PredictionResult {
    return this.orchestrator.getPredictions();
  }

  /** Cross-shield correlation matrix */
  public getCorrelations(): CorrelationSnapshot {
    return this.orchestrator.getCorrelations();
  }

  /** Current Risk Score (0-100) */
  public getRiskScore(): number {
    return this.orchestrator.getRiskScore();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔔 SUBSCRIPTIONS — Admin Panel / UI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Subscribe to every intelligence update (admin dashboard) */
  public onUpdate(cb: Listener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Subscribe only to high-risk signals */
  public onRisk(cb: RiskListener) {
    this.riskListeners.add(cb);
    return () => this.riskListeners.delete(cb);
  }

  /** Subscribe to cluster changes */
  public onCluster(cb: ClusterListener) {
    this.clusterListeners.add(cb);
    return () => this.clusterListeners.delete(cb);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛡️ SAFETY API — No execution commands, no actions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Clear intelligence history (admin only, safe) */
  public clearHistory() {
    this.orchestrator.resetHistory();
  }

  /** Pause analysis loop (admin controlled) */
  public pauseAnalysis() {
    this.orchestrator.pause();
  }

  /** Resume analysis loop */
  public resumeAnalysis() {
    this.orchestrator.resume();
  }

  /** Hard stop (admin emergency only) */
  public stopAnalysis() {
    this.orchestrator.stop();
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧠 NATURAL LANGUAGE REASONING
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** High-level intelligence summary (human-readable) */
  public getSummary(): string {
    const snapshot = this.getSnapshot();
    const risk = snapshot.riskScore;
    const clusters = snapshot.clusters;
    const predictions = snapshot.predictions;

    if (risk < 25) {
      return `✅ All systems stable. Risk: ${risk}/100. No immediate threats detected.`;
    }

    if (risk < 50) {
      return `⚠️ Minor issues detected. Risk: ${risk}/100. ${clusters.length} active threat clusters. Monitor recommended.`;
    }

    if (risk < 75) {
      return `🟠 Moderate risk. Score: ${risk}/100. ${clusters.length} clusters active. ${predictions.nearTerm.length} predictions flagged. Review required.`;
    }

    return `🔴 HIGH RISK. Score: ${risk}/100. ${clusters.length} threats active. ${predictions.nearTerm.length} critical predictions. Immediate attention needed.`;
  }

  /** Top 3 threats requiring action */
  public getTopThreats(): string[] {
    const clusters = this.getClusters();
    if (clusters.length === 0) return ['No threats detected'];

    return clusters
      .sort((a, b) => {
        const scoreA = a.averageSeverity * a.members.length;
        const scoreB = b.averageSeverity * b.members.length;
        return scoreB - scoreA;
      })
      .slice(0, 3)
      .map(c => `${c.category}: ${c.members.length} threats, severity ${c.averageSeverity.toFixed(1)}`);
  }

  /** Primary root cause (if any) */
  public getPrimaryCause(): string {
    const rootCause = this.getRootCause();
    if (rootCause.chains.length === 0) return 'No root cause identified';

    const primary = rootCause.chains[0];
    return `${primary.sourceShield} → ${primary.affectedShields.join(', ')} (confidence: ${(primary.confidence * 100).toFixed(0)}%)`;
  }

  /** Upcoming risk (0-10 min forecast) */
  public getUpcomingRisk(): string {
    const predictions = this.getPredictions();
    
    if (predictions.nearTerm.length === 0 && predictions.midTerm.length === 0) {
      return 'No escalation predicted';
    }

    const criticalNear = predictions.nearTerm.filter(p => p.severity >= 4).length;
    const criticalMid = predictions.midTerm.filter(p => p.severity >= 4).length;

    if (criticalNear > 0) {
      return `⚠️ ${criticalNear} critical predictions in next 2 minutes`;
    }

    if (criticalMid > 0) {
      return `⚠️ ${criticalMid} critical predictions in next 5 minutes`;
    }

    return 'Elevated risk predicted within 10 minutes';
  }

  /** Destabilizing correlations */
  public getDestabilizingLinks(): string[] {
    const correlations = this.getCorrelations();
    const destabilizing = correlations.pairs.filter(p => 
      p.correlation < -0.5 || (p.correlation > 0.7 && p.cascadeRisk > 0.6)
    );

    if (destabilizing.length === 0) return ['No destabilizing links'];

    return destabilizing.map(p => 
      `${p.source} ↔ ${p.target}: ${(p.correlation * 100).toFixed(0)}% (cascade risk: ${(p.cascadeRisk * 100).toFixed(0)}%)`
    );
  }

  /** Recommended actions based on current state */
  public getRecommendations(): string[] {
    const snapshot = this.getSnapshot();
    const risk = snapshot.riskScore;
    const clusters = snapshot.clusters;
    const predictions = snapshot.predictions;
    const correlations = snapshot.correlations;

    const recommendations: string[] = [];

    // Risk-based recommendations
    if (risk >= 75) {
      recommendations.push('🔴 Immediate review required');
      recommendations.push('Consider pausing high-risk operations');
    } else if (risk >= 50) {
      recommendations.push('⚠️ Monitor shield health closely');
    }

    // Cluster-based recommendations
    if (clusters.length > 5) {
      recommendations.push(`Review ${clusters.length} active threat clusters`);
    }

    const highSeverityClusters = clusters.filter(c => c.averageSeverity >= 4);
    if (highSeverityClusters.length > 0) {
      recommendations.push(`Address ${highSeverityClusters.length} high-severity clusters`);
    }

    // Prediction-based recommendations
    const criticalPredictions = [
      ...predictions.nearTerm.filter(p => p.severity >= 4),
      ...predictions.midTerm.filter(p => p.severity >= 4)
    ];

    if (criticalPredictions.length > 0) {
      recommendations.push(`Prepare for ${criticalPredictions.length} predicted escalations`);
    }

    // Correlation-based recommendations
    const destabilizing = correlations.pairs.filter(p => p.correlation < -0.5);
    if (destabilizing.length > 0) {
      recommendations.push(`Investigate ${destabilizing.length} negative correlations`);
    }

    const cascadeRisks = correlations.pairs.filter(p => p.cascadeRisk > 0.6);
    if (cascadeRisks.length > 0) {
      recommendations.push(`Monitor ${cascadeRisks.length} cascade risks`);
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push('Continue normal monitoring');
    }

    return recommendations;
  }

  /** Full intelligence report (verbose) */
  public getFullReport(): {
    summary: string;
    riskScore: number;
    topThreats: string[];
    primaryCause: string;
    upcomingRisk: string;
    destabilizingLinks: string[];
    recommendations: string[];
    timestamp: number;
  } {
    return {
      summary: this.getSummary(),
      riskScore: this.getRiskScore(),
      topThreats: this.getTopThreats(),
      primaryCause: this.getPrimaryCause(),
      upcomingRisk: this.getUpcomingRisk(),
      destabilizingLinks: this.getDestabilizingLinks(),
      recommendations: this.getRecommendations(),
      timestamp: Date.now()
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 ADVANCED QUERIES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Filter threats by shield type */
  public getThreatsByShield(shield: 'stability' | 'emotional' | 'execution' | 'memory'): ClusterResult[] {
    return this.getClusters().filter(c => c.category === shield);
  }

  /** Get all predictions for specific severity */
  public getPredictionsBySeverity(minSeverity: number): Array<{
    description: string;
    severity: number;
    probability: number;
    timeframe: string;
  }> {
    const predictions = this.getPredictions();
    const all = [
      ...predictions.nearTerm.map(p => ({ ...p, timeframe: '0-2 min' })),
      ...predictions.midTerm.map(p => ({ ...p, timeframe: '2-5 min' })),
      ...predictions.longTerm.map(p => ({ ...p, timeframe: '5-10 min' }))
    ];

    return all
      .filter(p => p.severity >= minSeverity)
      .sort((a, b) => b.severity - a.severity);
  }

  /** Find strongest correlations (positive or negative) */
  public getStrongestCorrelations(limit: number = 3): Array<{
    source: string;
    target: string;
    correlation: number;
    cascadeRisk: number;
  }> {
    const correlations = this.getCorrelations();
    return correlations.pairs
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, limit)
      .map(p => ({
        source: p.source,
        target: p.target,
        correlation: p.correlation,
        cascadeRisk: p.cascadeRisk
      }));
  }

  /** Get causal chains by depth */
  public getCausalChainsByDepth(minDepth: number): RootCauseResult['chains'] {
    const rootCause = this.getRootCause();
    return rootCause.chains.filter(c => c.depth >= minDepth);
  }

  /** Check if any shield is in critical state */
  public isCriticalState(): boolean {
    const risk = this.getRiskScore();
    const predictions = this.getPredictions();
    const criticalPredictions = predictions.nearTerm.filter(p => p.severity >= 5).length;

    return risk >= 80 || criticalPredictions > 0;
  }

  /** Get trend over time (requires history) */
  public getRiskTrend(): 'RISING' | 'FALLING' | 'STABLE' {
    const snapshot = this.getSnapshot();
    // This would require historical tracking in orchestrator
    // For now, return based on predictions
    const predictions = this.getPredictions();
    const escalations = predictions.nearTerm.filter(p => p.severity >= 4).length;

    if (escalations > 0) return 'RISING';
    if (snapshot.riskScore < 30) return 'FALLING';
    return 'STABLE';
  }

  /** Get shield health breakdown */
  public getShieldHealthBreakdown(): {
    shield: string;
    threatCount: number;
    averageSeverity: number;
    status: 'HEALTHY' | 'ATTENTION' | 'WARNING' | 'CRITICAL';
  }[] {
    const clusters = this.getClusters();
    const shields = ['stability', 'emotional', 'execution', 'memory'];

    return shields.map(shield => {
      const shieldClusters = clusters.filter(c => c.category === shield);
      const threatCount = shieldClusters.reduce((sum, c) => sum + c.members.length, 0);
      const avgSeverity = shieldClusters.length > 0
        ? shieldClusters.reduce((sum, c) => sum + c.averageSeverity, 0) / shieldClusters.length
        : 0;

      let status: 'HEALTHY' | 'ATTENTION' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (avgSeverity >= 4) status = 'CRITICAL';
      else if (avgSeverity >= 3) status = 'WARNING';
      else if (avgSeverity >= 2) status = 'ATTENTION';

      return {
        shield,
        threatCount,
        averageSeverity: avgSeverity,
        status
      };
    });
  }

  /** Get cascade risk matrix */
  public getCascadeRiskMatrix(): {
    source: string;
    target: string;
    risk: number;
  }[] {
    const correlations = this.getCorrelations();
    return correlations.pairs
      .filter(p => p.cascadeRisk > 0.3)
      .sort((a, b) => b.cascadeRisk - a.cascadeRisk)
      .map(p => ({
        source: p.source,
        target: p.target,
        risk: p.cascadeRisk
      }));
  }

  /** Get prediction confidence summary */
  public getPredictionConfidence(): {
    nearTerm: number;
    midTerm: number;
    longTerm: number;
    overall: number;
  } {
    const predictions = this.getPredictions();

    const avgConfidence = (arr: any[]) => 
      arr.length > 0 ? arr.reduce((sum, p) => sum + p.confidence, 0) / arr.length : 1.0;

    const nearConf = avgConfidence(predictions.nearTerm);
    const midConf = avgConfidence(predictions.midTerm);
    const longConf = avgConfidence(predictions.longTerm);

    return {
      nearTerm: nearConf,
      midTerm: midConf,
      longTerm: longConf,
      overall: (nearConf + midConf + longConf) / 3
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎯 DEVELOPER-LEVEL REASONING (for LLM consumption)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /** Generate structured reasoning for LLM/AI consumption */
  public getStructuredReasoning(): {
    state: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
    riskScore: number;
    primaryIssues: string[];
    secondaryIssues: string[];
    predictedEvents: string[];
    rootCauses: string[];
    recommendations: string[];
    confidence: number;
  } {
    const snapshot = this.getSnapshot();
    const risk = snapshot.riskScore;
    const clusters = snapshot.clusters;
    const predictions = snapshot.predictions;
    const rootCause = this.getRootCause();
    const correlations = this.getCorrelations();

    // Determine state
    let state: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'GREEN';
    if (risk >= 75) state = 'RED';
    else if (risk >= 50) state = 'ORANGE';
    else if (risk >= 25) state = 'YELLOW';

    // Primary issues (high severity)
    const primaryIssues = clusters
      .filter(c => c.averageSeverity >= 4)
      .map(c => `${c.category}: ${c.members.length} threats at severity ${c.averageSeverity.toFixed(1)}`);

    // Secondary issues (moderate severity)
    const secondaryIssues = clusters
      .filter(c => c.averageSeverity >= 2 && c.averageSeverity < 4)
      .map(c => `${c.category}: ${c.members.length} threats at severity ${c.averageSeverity.toFixed(1)}`);

    // Predicted events
    const predictedEvents = [
      ...predictions.nearTerm.map(p => `[0-2min] ${p.description} (${(p.probability * 100).toFixed(0)}% likely)`),
      ...predictions.midTerm.map(p => `[2-5min] ${p.description} (${(p.probability * 100).toFixed(0)}% likely)`)
    ];

    // Root causes
    const rootCauses = rootCause.chains.map(c => 
      `${c.sourceShield} causing issues in ${c.affectedShields.join(', ')} (confidence: ${(c.confidence * 100).toFixed(0)}%)`
    );

    // Confidence (based on prediction confidence)
    const predConf = this.getPredictionConfidence();
    const confidence = predConf.overall;

    return {
      state,
      riskScore: risk,
      primaryIssues,
      secondaryIssues,
      predictedEvents,
      rootCauses,
      recommendations: this.getRecommendations(),
      confidence
    };
  }

  /** Export full intelligence as JSON (for logging/debugging) */
  public exportJSON(): string {
    const snapshot = this.getSnapshot();
    return JSON.stringify(snapshot, null, 2);
  }

  /** Get human-readable timestamp */
  public getLastUpdateTime(): string {
    const snapshot = this.getSnapshot();
    const date = new Date(snapshot.timestamp);
    return date.toLocaleTimeString();
  }
}

// Singleton accessor
export const IntelligenceAPI = ShieldIntelligenceAPI.getInstance();
