/**
 * ═══════════════════════════════════════════════════════════════════
 * SHIELD BRAIN CORE — Phase 5 Intelligence Layer
 * ═══════════════════════════════════════════════════════════════════
 * Central intelligence coordinator for all shield systems
 * 
 * Features:
 * - Cross-shield correlation analysis
 * - Root cause identification
 * - Predictive threat forecasting (0-10 minutes)
 * - Probability & severity calculations
 * - Threat deduplication & clustering
 * - High-level reasoning API
 * - Unified shield intelligence score
 * 
 * Architecture:
 * - Orchestrates 6 sub-engines
 * - Event-driven analysis
 * - Real-time intelligence updates
 * - Zero autonomous actions (analysis only)
 * 
 * Integration:
 * - Connects to all 5 shield engines
 * - Provides unified intelligence API
 * - Powers admin visualization layer
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import { getShieldCore, type ShieldState } from '../ShieldCore';
import { getEmotionalShield } from '../EmotionalShield';
import { getExecutionShield } from '../ExecutionShield';
import { getMemoryIntegrityShield } from '../MemoryIntegrityShield';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

/**
 * Unified shield intelligence state
 */
export interface ShieldIntelligenceState {
  // Overall health
  overallScore: number; // 0-100 (100 = perfect)
  state: ShieldState;
  timestamp: number;

  // Correlation analysis
  correlations: ShieldCorrelation[];
  cascadeRisk: number; // 0-1.0

  // Root cause
  rootCauses: RootCause[];
  primaryCause: RootCause | null;

  // Predictions
  predictions: ThreatPrediction[];
  horizonMinutes: number;

  // Risk assessment
  riskLevel: RiskLevel;
  probability: number; // 0-1.0
  confidence: number; // 0-1.0

  // Threat clusters
  clusters: ThreatCluster[];
  topThreats: ThreatCluster[];

  // Reasoning
  explanation: string;
  recommendations: string[];
}

/**
 * Shield correlation between two engines
 */
export interface ShieldCorrelation {
  source: ShieldType;
  target: ShieldType;
  strength: number; // 0-1.0 (1 = fully correlated)
  direction: 'positive' | 'negative' | 'neutral';
  impact: 'stabilizing' | 'destabilizing' | 'neutral';
  description: string;
}

/**
 * Root cause analysis result
 */
export interface RootCause {
  id: string;
  type: 'primary' | 'secondary' | 'contributing';
  source: ShieldType;
  description: string;
  impact: ImpactDepth;
  chainOfEvents: string[];
  affectedShields: ShieldType[];
  timestamp: number;
  confidence: number; // 0-1.0
}

/**
 * Threat prediction
 */
export interface ThreatPrediction {
  id: string;
  horizon: number; // Minutes ahead (0-10)
  type: PredictionType;
  severity: number; // 0-5
  probability: number; // 0-1.0
  confidence: number; // 0-1.0
  description: string;
  affectedShields: ShieldType[];
  recommendedActions: string[];
}

/**
 * Threat cluster (deduplicated)
 */
export interface ThreatCluster {
  id: string;
  category: string;
  count: number;
  severity: number; // Average severity
  probability: number; // Combined probability
  threats: string[]; // Threat IDs
  description: string;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Shield types
 */
export type ShieldType = 'stability' | 'emotional' | 'execution' | 'memory' | 'core';

/**
 * Impact depth
 */
export type ImpactDepth = 'superficial' | 'moderate' | 'deep' | 'system-level';

/**
 * Prediction type
 */
export type PredictionType = 'safe' | 'attention' | 'escalation' | 'critical';

/**
 * Risk level
 */
export type RiskLevel = 'minimal' | 'low' | 'moderate' | 'high' | 'critical';

/**
 * Shield brain configuration
 */
export interface ShieldBrainConfig {
  correlationWindow: number; // Milliseconds to analyze
  predictionHorizon: number; // Minutes ahead (default 10)
  clusterThreshold: number; // Similarity threshold (0-1.0)
  updateInterval: number; // Milliseconds between analysis
  cascadeDetectionEnabled: boolean;
  rootCauseAnalysisEnabled: boolean;
  predictionEnabled: boolean;
  deduplicationEnabled: boolean;
}

// ─────────────────────────────────────────────────────────────────
// SHIELD BRAIN CORE
// ─────────────────────────────────────────────────────────────────

export class ShieldBrainCore {
  private config: ShieldBrainConfig;
  private active: boolean = false;
  private updateTimer: NodeJS.Timeout | null = null;

  // Shield instances
  private shieldCore = getShieldCore();
  private emotionalShield = getEmotionalShield();
  private executionShield = getExecutionShield();
  private memoryShield = getMemoryIntegrityShield();

  // Current state
  private currentState: ShieldIntelligenceState;

  // Analysis history
  private correlationHistory: ShieldCorrelation[] = [];
  private rootCauseHistory: RootCause[] = [];
  private predictionHistory: ThreatPrediction[] = [];
  private clusterHistory: ThreatCluster[] = [];

  // Event callbacks
  private stateChangeCallbacks: Array<(state: ShieldIntelligenceState) => void> = [];
  private predictionCallbacks: Array<(prediction: ThreatPrediction) => void> = [];
  private cascadeCallbacks: Array<(correlation: ShieldCorrelation) => void> = [];

  constructor(config?: Partial<ShieldBrainConfig>) {
    this.config = {
      correlationWindow: 60000, // 1 minute
      predictionHorizon: 10, // 10 minutes
      clusterThreshold: 0.7,
      updateInterval: 5000, // 5 seconds
      cascadeDetectionEnabled: true,
      rootCauseAnalysisEnabled: true,
      predictionEnabled: true,
      deduplicationEnabled: true,
      ...config
    };

    this.currentState = this.createInitialState();
  }

  /**
   * Initialize shield brain
   */
  initialize(): void {
    if (this.active) {
      console.warn('[ShieldBrainCore] Already initialized');
      return;
    }

    console.log('[ShieldBrainCore] Initializing intelligence layer...');

    this.active = true;

    // Perform initial analysis
    this.performAnalysis();

    // Start periodic analysis
    this.startAnalysisTimer();

    console.log('[ShieldBrainCore] Intelligence layer online');
  }

  /**
   * Start analysis timer
   */
  private startAnalysisTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(() => {
      this.performAnalysis();
    }, this.config.updateInterval);
  }

  /**
   * Stop analysis timer
   */
  private stopAnalysisTimer(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Perform comprehensive analysis
   */
  private performAnalysis(): void {
    const timestamp = Date.now();

    // 1. Correlation analysis
    const correlations = this.analyzeCorrelations();

    // 2. Cascade detection
    const cascadeRisk = this.detectCascadeRisk(correlations);

    // 3. Root cause analysis
    const rootCauses = this.analyzeRootCauses();
    const primaryCause = this.identifyPrimaryCause(rootCauses);

    // 4. Predictive analysis
    const predictions = this.generatePredictions();

    // 5. Risk assessment
    const { riskLevel, probability, confidence } = this.assessRisk(
      correlations,
      rootCauses,
      predictions
    );

    // 6. Threat clustering
    const clusters = this.clusterThreats();
    const topThreats = this.rankTopThreats(clusters);

    // 7. Overall score
    const overallScore = this.calculateOverallScore(
      correlations,
      cascadeRisk,
      rootCauses,
      predictions,
      riskLevel
    );

    // 8. High-level reasoning
    const { explanation, recommendations } = this.generateReasoning(
      overallScore,
      correlations,
      primaryCause,
      predictions,
      topThreats
    );

    // Update state
    const shieldStatus = this.shieldCore.getStatus();
    this.currentState = {
      overallScore,
      state: shieldStatus.state,
      timestamp,
      correlations,
      cascadeRisk,
      rootCauses,
      primaryCause,
      predictions,
      horizonMinutes: this.config.predictionHorizon,
      riskLevel,
      probability,
      confidence,
      clusters,
      topThreats,
      explanation,
      recommendations
    };

    // Store in history
    this.updateHistory(correlations, rootCauses, predictions, clusters);

    // Trigger callbacks
    this.triggerStateChangeCallbacks();

    // Check for cascades
    if (this.config.cascadeDetectionEnabled && cascadeRisk > 0.6) {
      this.triggerCascadeCallbacks(correlations.filter(c => c.impact === 'destabilizing'));
    }

    // Check for critical predictions
    const criticalPredictions = predictions.filter(p => p.type === 'critical');
    if (criticalPredictions.length > 0) {
      criticalPredictions.forEach(p => this.triggerPredictionCallbacks(p));
    }
  }

  /**
   * Analyze cross-shield correlations
   */
  private analyzeCorrelations(): ShieldCorrelation[] {
    const correlations: ShieldCorrelation[] = [];

    // Stability ↔ Emotional
    correlations.push(this.analyzeCorrelation('stability', 'emotional'));

    // Emotional ↔ Execution
    correlations.push(this.analyzeCorrelation('emotional', 'execution'));

    // Execution ↔ Memory
    correlations.push(this.analyzeCorrelation('execution', 'memory'));

    // Memory ↔ Core
    correlations.push(this.analyzeCorrelation('memory', 'core'));

    // Additional cross-correlations
    correlations.push(this.analyzeCorrelation('stability', 'execution'));
    correlations.push(this.analyzeCorrelation('emotional', 'memory'));

    return correlations;
  }

  /**
   * Analyze correlation between two shields
   */
  private analyzeCorrelation(source: ShieldType, target: ShieldType): ShieldCorrelation {
    // Get shield metrics
    const sourceMetrics = this.getShieldMetrics(source);
    const targetMetrics = this.getShieldMetrics(target);

    // Calculate correlation strength (simplified)
    const strength = this.calculateCorrelationStrength(sourceMetrics, targetMetrics);

    // Determine direction
    const direction = strength > 0.5 ? 'positive' : strength < -0.5 ? 'negative' : 'neutral';

    // Determine impact
    const impact = this.determineImpact(source, target, strength, sourceMetrics, targetMetrics);

    // Generate description
    const description = this.generateCorrelationDescription(source, target, strength, impact);

    return {
      source,
      target,
      strength: Math.abs(strength),
      direction,
      impact,
      description
    };
  }

  /**
   * Get metrics for a shield
   */
  private getShieldMetrics(shield: ShieldType): any {
    switch (shield) {
      case 'core':
        return this.shieldCore.getStatus();
      case 'emotional':
        return this.emotionalShield.getStatus();
      case 'execution':
        return this.executionShield.getStatus();
      case 'memory':
        return this.memoryShield.getStatus();
      case 'stability':
        return { active: true, health: 'healthy' }; // Mock for now
    }
  }

  /**
   * Calculate correlation strength between two metric sets
   */
  private calculateCorrelationStrength(metricsA: any, metricsB: any): number {
    // Simplified correlation calculation
    // In real implementation, use Pearson correlation on time-series data
    
    const healthScoreA = metricsA.active ? 1 : 0;
    const healthScoreB = metricsB.active ? 1 : 0;

    return (healthScoreA + healthScoreB) / 2 - 0.5;
  }

  /**
   * Determine impact of correlation
   */
  private determineImpact(
    source: ShieldType,
    target: ShieldType,
    strength: number,
    metricsA: any,
    metricsB: any
  ): 'stabilizing' | 'destabilizing' | 'neutral' {
    // If both shields are healthy and correlated, it's stabilizing
    if (metricsA.active && metricsB.active && Math.abs(strength) > 0.6) {
      return 'stabilizing';
    }

    // If one shield is degraded and correlation is strong, it's destabilizing
    if ((!metricsA.active || !metricsB.active) && Math.abs(strength) > 0.6) {
      return 'destabilizing';
    }

    return 'neutral';
  }

  /**
   * Generate correlation description
   */
  private generateCorrelationDescription(
    source: ShieldType,
    target: ShieldType,
    strength: number,
    impact: 'stabilizing' | 'destabilizing' | 'neutral'
  ): string {
    const strengthDesc = Math.abs(strength) > 0.7 ? 'strongly' : Math.abs(strength) > 0.4 ? 'moderately' : 'weakly';
    
    if (impact === 'destabilizing') {
      return `${source} shield ${strengthDesc} destabilizing ${target} shield`;
    } else if (impact === 'stabilizing') {
      return `${source} shield ${strengthDesc} stabilizing ${target} shield`;
    } else {
      return `${source} and ${target} shields ${strengthDesc} correlated`;
    }
  }

  /**
   * Detect cascade risk
   */
  private detectCascadeRisk(correlations: ShieldCorrelation[]): number {
    const destabilizingCount = correlations.filter(c => c.impact === 'destabilizing').length;
    const totalCount = correlations.length;

    return destabilizingCount / totalCount;
  }

  /**
   * Analyze root causes
   */
  private analyzeRootCauses(): RootCause[] {
    const causes: RootCause[] = [];
    const activeThreats = this.shieldCore.getActiveThreats();

    // Analyze each active threat for root causes
    activeThreats.forEach(threat => {
      const cause = this.identifyRootCause(threat);
      if (cause) {
        causes.push(cause);
      }
    });

    return causes;
  }

  /**
   * Identify root cause for a threat
   */
  private identifyRootCause(threat: any): RootCause | null {
    // Simplified root cause identification
    // In real implementation, analyze chain of events and dependencies

    return {
      id: `rc-${threat.id}`,
      type: 'primary',
      source: threat.source as ShieldType,
      description: `Root cause: ${threat.message}`,
      impact: 'moderate',
      chainOfEvents: [threat.message],
      affectedShields: [threat.source as ShieldType],
      timestamp: threat.timestamp,
      confidence: 0.75
    };
  }

  /**
   * Identify primary cause
   */
  private identifyPrimaryCause(causes: RootCause[]): RootCause | null {
    if (causes.length === 0) return null;

    // Find the cause with highest confidence and deepest impact
    return causes.reduce((primary, cause) => {
      const impactScore = this.getImpactScore(cause.impact);
      const primaryScore = this.getImpactScore(primary.impact);

      if (impactScore > primaryScore || 
          (impactScore === primaryScore && cause.confidence > primary.confidence)) {
        return cause;
      }
      return primary;
    });
  }

  /**
   * Get impact score
   */
  private getImpactScore(impact: ImpactDepth): number {
    switch (impact) {
      case 'system-level': return 4;
      case 'deep': return 3;
      case 'moderate': return 2;
      case 'superficial': return 1;
    }
  }

  /**
   * Generate predictions
   */
  private generatePredictions(): ThreatPrediction[] {
    if (!this.config.predictionEnabled) return [];

    const predictions: ThreatPrediction[] = [];
    const shieldStatus = this.shieldCore.getStatus();

    // Analyze trends and generate predictions
    // Simplified prediction logic
    if (shieldStatus.threatLevel > 50) {
      predictions.push({
        id: `pred-${Date.now()}`,
        horizon: 5,
        type: 'escalation',
        severity: 4,
        probability: 0.7,
        confidence: 0.8,
        description: 'Threat level trending upward - escalation likely in 5 minutes',
        affectedShields: ['core'],
        recommendedActions: ['Monitor closely', 'Review active threats']
      });
    }

    return predictions;
  }

  /**
   * Assess overall risk
   */
  private assessRisk(
    correlations: ShieldCorrelation[],
    rootCauses: RootCause[],
    predictions: ThreatPrediction[]
  ): { riskLevel: RiskLevel; probability: number; confidence: number } {
    // Calculate risk based on multiple factors
    const cascadeRisk = correlations.filter(c => c.impact === 'destabilizing').length / correlations.length;
    const rootCauseRisk = rootCauses.length > 0 ? 0.5 : 0;
    const predictionRisk = predictions.filter(p => p.type === 'critical' || p.type === 'escalation').length / Math.max(predictions.length, 1);

    const overallRisk = (cascadeRisk * 0.4 + rootCauseRisk * 0.3 + predictionRisk * 0.3);
    const probability = Math.min(overallRisk, 1.0);
    const confidence = 0.75; // Simplified

    let riskLevel: RiskLevel;
    if (overallRisk > 0.8) riskLevel = 'critical';
    else if (overallRisk > 0.6) riskLevel = 'high';
    else if (overallRisk > 0.4) riskLevel = 'moderate';
    else if (overallRisk > 0.2) riskLevel = 'low';
    else riskLevel = 'minimal';

    return { riskLevel, probability, confidence };
  }

  /**
   * Cluster threats
   */
  private clusterThreats(): ThreatCluster[] {
    if (!this.config.deduplicationEnabled) return [];

    const activeThreats = this.shieldCore.getActiveThreats();
    const clusters: ThreatCluster[] = [];

    // Group threats by category (simplified clustering)
    const categoryMap = new Map<string, any[]>();

    activeThreats.forEach(threat => {
      const category = threat.type;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(threat);
    });

    // Create clusters
    categoryMap.forEach((threats, category) => {
      const avgSeverity = threats.reduce((sum, t) => sum + t.level, 0) / threats.length;
      
      clusters.push({
        id: `cluster-${category}`,
        category,
        count: threats.length,
        severity: avgSeverity,
        probability: 0.8,
        threats: threats.map(t => t.id),
        description: `${threats.length} ${category} threats detected`,
        firstSeen: Math.min(...threats.map(t => t.timestamp)),
        lastSeen: Math.max(...threats.map(t => t.timestamp))
      });
    });

    return clusters;
  }

  /**
   * Rank top threats
   */
  private rankTopThreats(clusters: ThreatCluster[]): ThreatCluster[] {
    return clusters
      .sort((a, b) => b.severity * b.count - a.severity * a.count)
      .slice(0, 3);
  }

  /**
   * Calculate overall shield score
   */
  private calculateOverallScore(
    correlations: ShieldCorrelation[],
    cascadeRisk: number,
    rootCauses: RootCause[],
    predictions: ThreatPrediction[],
    riskLevel: RiskLevel
  ): number {
    const shieldStatus = this.shieldCore.getStatus();
    
    // Start with base score from threat level
    let score = 100 - shieldStatus.threatLevel;

    // Penalize for destabilizing correlations
    const destabilizingCount = correlations.filter(c => c.impact === 'destabilizing').length;
    score -= destabilizingCount * 5;

    // Penalize for cascade risk
    score -= cascadeRisk * 20;

    // Penalize for root causes
    score -= rootCauses.length * 3;

    // Penalize for critical predictions
    const criticalPredictions = predictions.filter(p => p.type === 'critical').length;
    score -= criticalPredictions * 10;

    // Ensure score is 0-100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate high-level reasoning
   */
  private generateReasoning(
    overallScore: number,
    correlations: ShieldCorrelation[],
    primaryCause: RootCause | null,
    predictions: ThreatPrediction[],
    topThreats: ThreatCluster[]
  ): { explanation: string; recommendations: string[] } {
    let explanation = '';
    const recommendations: string[] = [];

    // Overall assessment
    if (overallScore >= 90) {
      explanation = 'All shields operating normally. System is stable.';
    } else if (overallScore >= 70) {
      explanation = 'Minor anomalies detected. System is generally healthy.';
    } else if (overallScore >= 50) {
      explanation = 'Moderate issues detected. Close monitoring recommended.';
    } else {
      explanation = 'Significant threats detected. Immediate attention required.';
    }

    // Add primary cause if exists
    if (primaryCause) {
      explanation += ` Root cause: ${primaryCause.description}.`;
      recommendations.push(`Address root cause: ${primaryCause.source} shield`);
    }

    // Add destabilizing correlations
    const destabilizing = correlations.filter(c => c.impact === 'destabilizing');
    if (destabilizing.length > 0) {
      explanation += ` ${destabilizing[0].description}.`;
      recommendations.push('Monitor cross-shield interactions');
    }

    // Add predictions
    const criticalPreds = predictions.filter(p => p.type === 'critical' || p.type === 'escalation');
    if (criticalPreds.length > 0) {
      explanation += ` ${criticalPreds[0].description}.`;
      recommendations.push(...criticalPreds[0].recommendedActions);
    }

    // Add top threats
    if (topThreats.length > 0) {
      recommendations.push(`Review top threat: ${topThreats[0].category}`);
    }

    return { explanation, recommendations };
  }

  /**
   * Update analysis history
   */
  private updateHistory(
    correlations: ShieldCorrelation[],
    rootCauses: RootCause[],
    predictions: ThreatPrediction[],
    clusters: ThreatCluster[]
  ): void {
    // Keep last 100 entries
    const maxHistory = 100;

    this.correlationHistory.push(...correlations);
    if (this.correlationHistory.length > maxHistory) {
      this.correlationHistory = this.correlationHistory.slice(-maxHistory);
    }

    this.rootCauseHistory.push(...rootCauses);
    if (this.rootCauseHistory.length > maxHistory) {
      this.rootCauseHistory = this.rootCauseHistory.slice(-maxHistory);
    }

    this.predictionHistory.push(...predictions);
    if (this.predictionHistory.length > maxHistory) {
      this.predictionHistory = this.predictionHistory.slice(-maxHistory);
    }

    this.clusterHistory.push(...clusters);
    if (this.clusterHistory.length > maxHistory) {
      this.clusterHistory = this.clusterHistory.slice(-maxHistory);
    }
  }

  /**
   * Create initial state
   */
  private createInitialState(): ShieldIntelligenceState {
    return {
      overallScore: 100,
      state: 'GREEN',
      timestamp: Date.now(),
      correlations: [],
      cascadeRisk: 0,
      rootCauses: [],
      primaryCause: null,
      predictions: [],
      horizonMinutes: this.config.predictionHorizon,
      riskLevel: 'minimal',
      probability: 0,
      confidence: 0,
      clusters: [],
      topThreats: [],
      explanation: 'Shield intelligence layer initializing...',
      recommendations: []
    };
  }

  /**
   * Trigger state change callbacks
   */
  private triggerStateChangeCallbacks(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('[ShieldBrainCore] Error in state change callback:', error);
      }
    });
  }

  /**
   * Trigger prediction callbacks
   */
  private triggerPredictionCallbacks(prediction: ThreatPrediction): void {
    this.predictionCallbacks.forEach(callback => {
      try {
        callback(prediction);
      } catch (error) {
        console.error('[ShieldBrainCore] Error in prediction callback:', error);
      }
    });
  }

  /**
   * Trigger cascade callbacks
   */
  private triggerCascadeCallbacks(correlations: ShieldCorrelation[]): void {
    correlations.forEach(correlation => {
      this.cascadeCallbacks.forEach(callback => {
        try {
          callback(correlation);
        } catch (error) {
          console.error('[ShieldBrainCore] Error in cascade callback:', error);
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get current intelligence state
   */
  getState(): ShieldIntelligenceState {
    return { ...this.currentState };
  }

  /**
   * Get correlation history
   */
  getCorrelationHistory(): ShieldCorrelation[] {
    return [...this.correlationHistory];
  }

  /**
   * Get root cause history
   */
  getRootCauseHistory(): RootCause[] {
    return [...this.rootCauseHistory];
  }

  /**
   * Get prediction history
   */
  getPredictionHistory(): ThreatPrediction[] {
    return [...this.predictionHistory];
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: ShieldIntelligenceState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    return () => {
      const index = this.stateChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to predictions
   */
  onPrediction(callback: (prediction: ThreatPrediction) => void): () => void {
    this.predictionCallbacks.push(callback);
    return () => {
      const index = this.predictionCallbacks.indexOf(callback);
      if (index > -1) {
        this.predictionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to cascades
   */
  onCascade(callback: (correlation: ShieldCorrelation) => void): () => void {
    this.cascadeCallbacks.push(callback);
    return () => {
      const index = this.cascadeCallbacks.indexOf(callback);
      if (index > -1) {
        this.cascadeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ShieldBrainConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart timer with new interval if changed
    if (config.updateInterval) {
      this.stopAnalysisTimer();
      this.startAnalysisTimer();
    }
  }

  /**
   * Get configuration
   */
  getConfig(): ShieldBrainConfig {
    return { ...this.config };
  }

  /**
   * Check if active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Disable shield brain
   */
  disable(): void {
    if (!this.active) return;

    this.stopAnalysisTimer();
    this.active = false;
    console.log('[ShieldBrainCore] Intelligence layer disabled');
  }

  /**
   * Enable shield brain
   */
  enable(): void {
    if (this.active) return;

    this.active = true;
    this.startAnalysisTimer();
    console.log('[ShieldBrainCore] Intelligence layer enabled');
  }

  /**
   * Dispose shield brain
   */
  dispose(): void {
    this.disable();
    this.stateChangeCallbacks = [];
    this.predictionCallbacks = [];
    this.cascadeCallbacks = [];
    this.correlationHistory = [];
    this.rootCauseHistory = [];
    this.predictionHistory = [];
    this.clusterHistory = [];
    console.log('[ShieldBrainCore] Intelligence layer disposed');
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let shieldBrainInstance: ShieldBrainCore | null = null;

/**
 * Get shield brain instance
 */
export function getShieldBrain(): ShieldBrainCore {
  if (!shieldBrainInstance) {
    shieldBrainInstance = new ShieldBrainCore();
  }
  return shieldBrainInstance;
}

/**
 * Initialize shield brain with custom config
 */
export function initializeShieldBrain(config?: Partial<ShieldBrainConfig>): ShieldBrainCore {
  shieldBrainInstance = new ShieldBrainCore(config);
  shieldBrainInstance.initialize();
  return shieldBrainInstance;
}

/**
 * Dispose shield brain
 */
export function disposeShieldBrain(): void {
  if (shieldBrainInstance) {
    shieldBrainInstance.dispose();
    shieldBrainInstance = null;
  }
}
