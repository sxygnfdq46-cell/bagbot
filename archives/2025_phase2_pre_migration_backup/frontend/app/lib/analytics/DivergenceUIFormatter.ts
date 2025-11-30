/**
 * Divergence UI Formatter
 * 
 * Transforms raw intelligence results from DivergenceOrchestrator
 * into clean, visual-ready data structures optimized for UI consumption.
 * 
 * Responsibilities:
 * - Format orchestrated results for each UI panel
 * - Extract and normalize key metrics for dashboard summaries
 * - Handle error states and partial results gracefully
 * - Ensure all UI data is properly typed and safe to render
 */

import type {
  FullAnalysisResult,
  ErrorResult,
} from './DivergenceOrchestrator';

import type {
  DivergenceScanResult,
} from '../../engines/RealityDivergenceScanner';

import type {
  CorrelationResult,
  RootCauseResult,
  PredictionResult,
  ThreatClusterResult,
} from './AnalyticsBridge';

// ============================================================================
// UI-Ready Type Definitions
// ============================================================================

export interface FormattedSummary {
  divergenceScore: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  forecastConfidence: number;
  status: 'complete' | 'partial' | 'error';
  timestamp: number;
  warnings?: string[];
}

export interface FormattedDivergence {
  score: number;
  severityLevel: 'low' | 'medium' | 'high' | 'critical';
  slippageDeviation: number;
  spreadAnomaly: number;
  volatilityMismatch: number;
  executionQualityScore: number;
  fillDelayScore: number;
  trend: 'improving' | 'stable' | 'degrading';
  anomalies: string[];
}

export interface FormattedCorrelations {
  matrix: Record<string, Record<string, number>>;
  strongest: { pair: [string, string]; correlation: number } | null;
  weakest: { pair: [string, string]; correlation: number } | null;
  totalPairs: number;
}

export interface FormattedRootCauses {
  causes: Array<{
    factor: string;
    confidence: number;
    impact: number;
    evidence: string[];
  }>;
  severity: 'minimal' | 'moderate' | 'severe' | 'critical';
  explanation: string;
  totalCauses: number;
}

export interface FormattedForecast {
  projections: {
    nearTerm: Record<string, { value: number; confidence: number }>;
    midTerm: Record<string, { value: number; confidence: number }>;
  };
  confidence: number;
  horizon: 'short' | 'medium' | 'long';
  ranges: {
    nearTerm: { min: number; max: number };
    midTerm: { min: number; max: number };
  };
}

export interface FormattedThreats {
  clusters: Array<{
    id: string;
    threats: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    commonality: string;
    count: number;
  }>;
  level: 'low' | 'medium' | 'high' | 'critical';
  alerts: string[];
  totalThreats: number;
  criticalCount: number;
}

export interface FormattedUIData {
  summary: FormattedSummary;
  divergencePanel: FormattedDivergence;
  correlationsPanel: FormattedCorrelations;
  rootCausePanel: FormattedRootCauses;
  forecastingPanel: FormattedForecast;
  threatClusterPanel: FormattedThreats;
}

export interface ErrorUIData {
  status: 'error';
  message: string;
  panels: {
    divergencePanel: null;
    correlationsPanel: null;
    rootCausePanel: null;
    forecastingPanel: null;
    threatClusterPanel: null;
  };
}

// ============================================================================
// Divergence UI Formatter Class
// ============================================================================

export default class DivergenceUIFormatter {
  /**
   * Format orchestrated analysis results for UI consumption
   */
  format(orchestrated: FullAnalysisResult | ErrorResult): FormattedUIData | ErrorUIData {
    // Handle error state
    if (!orchestrated || orchestrated.status === 'error') {
      return this.buildErrorState(orchestrated as ErrorResult);
    }

    // Handle partial or complete results
    const fullResult = orchestrated as FullAnalysisResult;

    return {
      summary: this.buildSummary(fullResult),
      divergencePanel: this.formatDivergence(fullResult.divergence),
      correlationsPanel: this.formatCorrelations(fullResult.correlations),
      rootCausePanel: this.formatRootCauses(fullResult.rootCauses),
      forecastingPanel: this.formatForecast(fullResult.forecasting),
      threatClusterPanel: this.formatThreats(fullResult.threatClusters),
    };
  }

  // ==========================================================================
  // Private Formatting Methods
  // ==========================================================================

  /**
   * Build dashboard summary with key metrics
   */
  private buildSummary(data: FullAnalysisResult): FormattedSummary {
    // Extract divergence score
    const divergence = 'fallback' in data.divergence ? data.divergence.fallback : data.divergence;
    const divergenceScore = divergence.divergenceIndex || 0;

    // Extract threat level
    const threats = 'fallback' in data.threatClusters ? data.threatClusters.fallback : data.threatClusters;
    const threatLevel = this.determineThreatLevel(threats);

    // Extract forecast confidence
    const forecast = 'fallback' in data.forecasting ? data.forecasting.fallback : data.forecasting;
    const forecastConfidence = this.calculateForecastConfidence(forecast);

    return {
      divergenceScore,
      threatLevel,
      forecastConfidence,
      status: data.status,
      timestamp: data.timestamp,
      warnings: data.warnings,
    };
  }

  /**
   * Format divergence scan results for panel display
   */
  private formatDivergence(div: DivergenceScanResult | { error: string; fallback: DivergenceScanResult }): FormattedDivergence {
    const data = 'fallback' in div ? div.fallback : div;

    // Determine trend based on divergence index
    const trend = this.determineTrend(data.divergenceIndex);

    // Build anomaly list
    const anomalies: string[] = [];
    if (Math.abs(data.slippageDeviation) > 0.5) {
      anomalies.push(`Slippage deviation: ${data.slippageDeviation.toFixed(2)} pips`);
    }
    if (Math.abs(data.spreadAnomaly) > 0.3) {
      anomalies.push(`Spread anomaly: ${data.spreadAnomaly.toFixed(2)} pips`);
    }
    if (Math.abs(data.volatilityMismatch) > 10) {
      anomalies.push(`Volatility mismatch: ${data.volatilityMismatch.toFixed(1)}%`);
    }
    if (data.executionQualityScore < 60) {
      anomalies.push(`Low execution quality: ${data.executionQualityScore.toFixed(0)}/100`);
    }
    if (data.fillDelayScore < 60) {
      anomalies.push(`High fill delay: ${data.fillDelayScore.toFixed(0)}/100`);
    }

    return {
      score: data.divergenceIndex,
      severityLevel: data.severityLevel,
      slippageDeviation: data.slippageDeviation,
      spreadAnomaly: data.spreadAnomaly,
      volatilityMismatch: data.volatilityMismatch,
      executionQualityScore: data.executionQualityScore,
      fillDelayScore: data.fillDelayScore,
      trend,
      anomalies,
    };
  }

  /**
   * Format correlation analysis for panel display
   */
  private formatCorrelations(c: CorrelationResult | { error: string; fallback: CorrelationResult }): FormattedCorrelations {
    const data = 'fallback' in c ? c.fallback : c;

    // Find strongest and weakest correlations
    let strongest: { pair: [string, string]; correlation: number } | null = null;
    let weakest: { pair: [string, string]; correlation: number } | null = null;

    if (data.strongPairs && data.strongPairs.length > 0) {
      // Sort by absolute correlation value
      const sorted = [...data.strongPairs].sort((a, b) => 
        Math.abs(b.correlation) - Math.abs(a.correlation)
      );
      strongest = sorted[0] || null;
      weakest = sorted[sorted.length - 1] || null;
    }

    return {
      matrix: data.matrix || {},
      strongest,
      weakest,
      totalPairs: data.strongPairs?.length || 0,
    };
  }

  /**
   * Format root cause analysis for panel display
   */
  private formatRootCauses(rc: RootCauseResult | { error: string; fallback: RootCauseResult }): FormattedRootCauses {
    const data = 'fallback' in rc ? rc.fallback : rc;

    const causes = [
      ...data.primaryCauses.map((c) => ({
        factor: c.factor,
        confidence: c.confidence,
        impact: c.impact,
        evidence: c.evidence || [],
      })),
      ...data.secondaryCauses.map((c) => ({
        factor: c.factor,
        confidence: c.confidence,
        impact: c.impact,
        evidence: [] as string[],
      })),
    ];

    // Determine severity based on primary causes
    const severity = this.determineCauseSeverity(data.primaryCauses);

    // Build explanation
    const explanation = this.buildCauseExplanation(data.primaryCauses);

    return {
      causes,
      severity,
      explanation,
      totalCauses: causes.length,
    };
  }

  /**
   * Format forecast results for panel display
   */
  private formatForecast(f: PredictionResult | { error: string; fallback: PredictionResult }): FormattedForecast {
    const data = 'fallback' in f ? f.fallback : f;

    // Extract projections
    const projections = {
      nearTerm: data.nearTerm.predictions || {},
      midTerm: data.midTerm.predictions || {},
    };

    // Calculate overall confidence
    const confidence = this.calculateForecastConfidence(data);

    // Determine horizon
    const horizon = this.determineHorizon(data);

    // Extract ranges
    const ranges = {
      nearTerm: data.nearTerm.range || { min: 0, max: 0 },
      midTerm: data.midTerm.range || { min: 0, max: 0 },
    };

    return {
      projections,
      confidence,
      horizon,
      ranges,
    };
  }

  /**
   * Format threat clusters for panel display
   */
  private formatThreats(t: ThreatClusterResult | { error: string; fallback: ThreatClusterResult }): FormattedThreats {
    const data = 'fallback' in t ? t.fallback : t;

    // Build alert list
    const alerts: string[] = [];
    if (data.criticalCount > 0) {
      alerts.push(`${data.criticalCount} critical threats detected`);
    }
    if (data.totalThreats > 10) {
      alerts.push(`High threat volume: ${data.totalThreats} total`);
    }

    // Determine overall threat level
    const level = this.determineThreatLevel(data);

    return {
      clusters: data.clusters || [],
      level,
      alerts,
      totalThreats: data.totalThreats,
      criticalCount: data.criticalCount,
    };
  }

  /**
   * Build error state for UI
   */
  private buildErrorState(raw: ErrorResult | null): ErrorUIData {
    return {
      status: 'error',
      message: raw?.message || 'Invalid Orchestrator Output',
      panels: {
        divergencePanel: null,
        correlationsPanel: null,
        rootCausePanel: null,
        forecastingPanel: null,
        threatClusterPanel: null,
      },
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Determine divergence trend
   */
  private determineTrend(score: number): 'improving' | 'stable' | 'degrading' {
    // In production, this would compare to historical values
    // For now, use thresholds
    if (score < 20) return 'improving';
    if (score < 40) return 'stable';
    return 'degrading';
  }

  /**
   * Determine threat level from threat cluster data
   */
  private determineThreatLevel(threats: ThreatClusterResult): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.criticalCount > 0) return 'critical';
    if (threats.totalThreats > 10) return 'high';
    if (threats.totalThreats > 5) return 'medium';
    return 'low';
  }

  /**
   * Calculate forecast confidence
   */
  private calculateForecastConfidence(forecast: PredictionResult): number {
    const predictions = forecast.nearTerm.predictions;
    if (!predictions || Object.keys(predictions).length === 0) return 0;

    // Average confidence across all predictions
    const confidences = Object.values(predictions).map((p) => p.confidence);
    const sum = confidences.reduce((acc, val) => acc + val, 0);
    return sum / confidences.length;
  }

  /**
   * Determine cause severity
   */
  private determineCauseSeverity(
    primaryCauses: Array<{ confidence: number; impact: number }>
  ): 'minimal' | 'moderate' | 'severe' | 'critical' {
    if (primaryCauses.length === 0) return 'minimal';

    const maxImpact = Math.max(...primaryCauses.map((c) => c.impact));
    const avgConfidence = primaryCauses.reduce((sum, c) => sum + c.confidence, 0) / primaryCauses.length;

    const severityScore = maxImpact * avgConfidence;

    if (severityScore > 0.8) return 'critical';
    if (severityScore > 0.6) return 'severe';
    if (severityScore > 0.4) return 'moderate';
    return 'minimal';
  }

  /**
   * Build human-readable cause explanation
   */
  private buildCauseExplanation(
    primaryCauses: Array<{ factor: string; confidence: number }>
  ): string {
    if (primaryCauses.length === 0) {
      return 'No significant root causes identified.';
    }

    if (primaryCauses.length === 1) {
      return `Primary cause: ${primaryCauses[0].factor} (${(primaryCauses[0].confidence * 100).toFixed(0)}% confidence)`;
    }

    const topTwo = primaryCauses.slice(0, 2);
    return `Primary causes: ${topTwo[0].factor} (${(topTwo[0].confidence * 100).toFixed(0)}%) and ${topTwo[1].factor} (${(topTwo[1].confidence * 100).toFixed(0)}%)`;
  }

  /**
   * Determine forecast horizon
   */
  private determineHorizon(forecast: PredictionResult): 'short' | 'medium' | 'long' {
    // Parse horizon strings (e.g., "1h", "4h", "24h")
    const nearTermHorizon = forecast.nearTerm.horizon;
    if (nearTermHorizon.includes('h')) {
      const hours = parseInt(nearTermHorizon);
      if (hours <= 1) return 'short';
      if (hours <= 6) return 'medium';
      return 'long';
    }
    return 'medium';
  }
}
