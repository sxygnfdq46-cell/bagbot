/**
 * Divergence Orchestrator
 * 
 * High-level coordinator for full divergence analysis pipeline.
 * Manages the sequence of analytics operations and ensures the UI
 * receives complete, normalized, and user-ready intelligence data.
 * 
 * Responsibilities:
 * - Initialize and manage AnalyticsBridge
 * - Orchestrate multi-stage analysis in correct order
 * - Normalize all results for UI consumption
 * - Ensure UI never receives incomplete or broken data
 * - Provide graceful fallbacks for any failures
 */

import AnalyticsBridge, {
  type CorrelationInput,
  type CorrelationResult,
  type DiagnosticsData,
  type RootCauseResult,
  type PredictionData,
  type PredictionResult,
  type ThreatClusterResult,
} from './AnalyticsBridge';

import type {
  BacktestData,
  LiveData,
  MarketMeta,
  DivergenceScanResult,
} from '../../engines/RealityDivergenceScanner';

// ============================================================================
// Type Definitions
// ============================================================================

export interface FullAnalysisParams {
  backtestData: BacktestData;
  liveData: LiveData;
  marketMeta: MarketMeta;
  expectedModel?: any;
}

export interface FullAnalysisResult {
  divergence: DivergenceScanResult | { error: string; fallback: DivergenceScanResult };
  correlations: CorrelationResult | { error: string; fallback: CorrelationResult };
  rootCauses: RootCauseResult | { error: string; fallback: RootCauseResult };
  forecasting: PredictionResult | { error: string; fallback: PredictionResult };
  threatClusters: ThreatClusterResult | { error: string; fallback: ThreatClusterResult };
  status: 'complete' | 'partial' | 'error';
  timestamp: number;
  warnings?: string[];
}

export interface ErrorResult {
  status: 'error';
  message: string;
  fallback: true;
  timestamp: number;
}

// ============================================================================
// Divergence Orchestrator Class
// ============================================================================

export class DivergenceOrchestrator {
  private bridge: AnalyticsBridge;
  private warnings: string[] = [];

  constructor() {
    this.bridge = new AnalyticsBridge();
  }

  /**
   * Run full divergence analysis pipeline
   * 
   * Executes all analytics engines in sequence:
   * 1. Reality divergence scanning
   * 2. Correlation analysis
   * 3. Root cause detection
   * 4. Outcome forecasting
   * 5. Threat clustering
   * 
   * Returns unified intelligence bundle for UI consumption
   */
  async runFullAnalysis(params: FullAnalysisParams): Promise<FullAnalysisResult | ErrorResult> {
    this.warnings = [];
    const startTime = Date.now();

    try {
      // =====================================================================
      // STAGE 1: Compute Reality Divergence
      // =====================================================================
      const divergence = await this.bridge.computeDivergence(
        params.backtestData,
        params.liveData,
        params.marketMeta,
        params.expectedModel
      );

      // Check for divergence errors
      if ('error' in divergence) {
        this.warnings.push(`Divergence scan failed: ${divergence.error}`);
      }

      // =====================================================================
      // STAGE 2: Compute Correlations
      // =====================================================================
      const correlationInput: CorrelationInput = this.prepareLiveDataForCorrelation(params.liveData);
      const correlations = await this.bridge.computeCorrelations(correlationInput);

      // Check for correlation errors
      if ('error' in correlations) {
        this.warnings.push(`Correlation analysis failed: ${correlations.error}`);
      }

      // =====================================================================
      // STAGE 3: Root Cause Analysis
      // =====================================================================
      const diagnosticsData: DiagnosticsData = this.prepareDiagnosticsData(
        divergence,
        correlations
      );
      const rootCauses = await this.bridge.detectRootCauses(diagnosticsData);

      // Check for root cause errors
      if ('error' in rootCauses) {
        this.warnings.push(`Root cause detection failed: ${rootCauses.error}`);
      }

      // =====================================================================
      // STAGE 4: Forecasting Engine
      // =====================================================================
      const predictionData: PredictionData = this.preparePredictionData(params.liveData);
      const forecasting = await this.bridge.forecastOutcomes(predictionData);

      // Check for forecasting errors
      if ('error' in forecasting) {
        this.warnings.push(`Outcome forecasting failed: ${forecasting.error}`);
      }

      // =====================================================================
      // STAGE 5: Threat Clustering
      // =====================================================================
      const threatDiagnostics: DiagnosticsData = this.prepareThreatDiagnostics(
        divergence,
        rootCauses
      );
      const threatClusters = await this.bridge.clusterThreats(threatDiagnostics);

      // Check for threat clustering errors
      if ('error' in threatClusters) {
        this.warnings.push(`Threat clustering failed: ${threatClusters.error}`);
      }

      // =====================================================================
      // Assemble Final UI Bundle
      // =====================================================================
      const status = this.determineStatus();
      const analysisResult: FullAnalysisResult = {
        divergence,
        correlations,
        rootCauses,
        forecasting,
        threatClusters,
        status,
        timestamp: Date.now(),
        warnings: this.warnings.length > 0 ? this.warnings : undefined,
      };

      return analysisResult;
    } catch (err: any) {
      // Critical orchestration failure
      console.error('DivergenceOrchestrator: Critical failure', err);
      
      return {
        status: 'error',
        message: err?.message || 'Unknown Orchestrator Error',
        fallback: true,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Run quick divergence scan (Stage 1 only)
   * Useful for real-time monitoring without full analysis overhead
   */
  async runQuickScan(params: FullAnalysisParams): Promise<DivergenceScanResult | ErrorResult> {
    try {
      const divergence = await this.bridge.computeDivergence(
        params.backtestData,
        params.liveData,
        params.marketMeta,
        params.expectedModel
      );

      if ('error' in divergence) {
        return {
          status: 'error',
          message: divergence.error,
          fallback: true,
          timestamp: Date.now(),
        };
      }

      return divergence;
    } catch (err: any) {
      return {
        status: 'error',
        message: err?.message || 'Quick scan failed',
        fallback: true,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Clear bridge cache and reset orchestrator
   */
  reset(): void {
    this.bridge.clearCache();
    this.warnings = [];
  }

  /**
   * Check health of all analytics engines
   */
  async healthCheck(): Promise<{
    orchestrator: boolean;
    bridge: boolean;
    engines: {
      scanner: boolean;
      correlation: boolean;
      rootCause: boolean;
      prediction: boolean;
      threat: boolean;
    };
  }> {
    try {
      const engineHealth = await this.bridge.healthCheck();
      
      return {
        orchestrator: true,
        bridge: true,
        engines: engineHealth,
      };
    } catch (err) {
      return {
        orchestrator: false,
        bridge: false,
        engines: {
          scanner: false,
          correlation: false,
          rootCause: false,
          prediction: false,
          threat: false,
        },
      };
    }
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Prepare live data for correlation analysis
   */
  private prepareLiveDataForCorrelation(liveData: LiveData): CorrelationInput {
    // Convert live data to correlation input format
    return {
      metrics: {
        slippage: [liveData.slippage],
        spread: [liveData.avgSpread],
        volatility: [liveData.volatility],
        fillDelay: [liveData.fillDelay],
        executionScore: [liveData.executionScore],
      },
      timeWindow: 3600, // 1 hour default
      pairs: [
        ['slippage', 'spread'],
        ['slippage', 'volatility'],
        ['spread', 'volatility'],
        ['fillDelay', 'executionScore'],
      ],
    };
  }

  /**
   * Prepare diagnostics data for root cause analysis
   */
  private prepareDiagnosticsData(
    divergence: DivergenceScanResult | { error: string; fallback: DivergenceScanResult },
    correlations: CorrelationResult | { error: string; fallback: CorrelationResult }
  ): DiagnosticsData {
    const div = 'fallback' in divergence ? divergence.fallback : divergence;
    const corr = 'fallback' in correlations ? correlations.fallback : correlations;

    const errors: Array<{ type: string; message: string; severity: string }> = [];
    const warnings: Array<{ type: string; message: string }> = [];

    // Convert divergence severity to diagnostics
    if (div.severityLevel === 'critical') {
      errors.push({
        type: 'divergence',
        message: `Critical divergence detected: ${div.divergenceIndex.toFixed(1)}`,
        severity: 'critical',
      });
    } else if (div.severityLevel === 'high') {
      errors.push({
        type: 'divergence',
        message: `High divergence detected: ${div.divergenceIndex.toFixed(1)}`,
        severity: 'high',
      });
    } else if (div.severityLevel === 'medium') {
      warnings.push({
        type: 'divergence',
        message: `Medium divergence detected: ${div.divergenceIndex.toFixed(1)}`,
      });
    }

    return {
      errors,
      warnings,
      metrics: {
        divergenceIndex: div.divergenceIndex,
        slippageDeviation: div.slippageDeviation,
        spreadAnomaly: div.spreadAnomaly,
        volatilityMismatch: div.volatilityMismatch,
        executionQualityScore: div.executionQualityScore,
        fillDelayScore: div.fillDelayScore,
      },
      context: {
        divergence: div,
        correlations: corr,
      },
    };
  }

  /**
   * Prepare prediction data for forecasting engine
   */
  private preparePredictionData(liveData: LiveData): PredictionData {
    return {
      currentMetrics: {
        slippage: liveData.slippage,
        spread: liveData.avgSpread,
        volatility: liveData.volatility,
        fillDelay: liveData.fillDelay,
        executionScore: liveData.executionScore,
      },
      historicalData: [
        // Placeholder - in production, this would come from time-series data
        {
          slippage: liveData.slippage,
          spread: liveData.avgSpread,
          volatility: liveData.volatility,
        },
      ],
      marketConditions: {
        sampleSize: liveData.sampleSize,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Prepare diagnostics for threat clustering
   */
  private prepareThreatDiagnostics(
    divergence: DivergenceScanResult | { error: string; fallback: DivergenceScanResult },
    rootCauses: RootCauseResult | { error: string; fallback: RootCauseResult }
  ): DiagnosticsData {
    const div = 'fallback' in divergence ? divergence.fallback : divergence;
    const rc = 'fallback' in rootCauses ? rootCauses.fallback : rootCauses;

    const errors: Array<{ type: string; message: string; severity: string }> = [];
    const warnings: Array<{ type: string; message: string }> = [];

    // Add root causes as errors/warnings
    rc.primaryCauses.forEach((cause) => {
      errors.push({
        type: 'root_cause',
        message: cause.factor,
        severity: cause.confidence > 0.8 ? 'high' : 'medium',
      });
    });

    rc.secondaryCauses.forEach((cause) => {
      warnings.push({
        type: 'root_cause',
        message: cause.factor,
      });
    });

    return {
      errors,
      warnings,
      metrics: {
        divergenceIndex: div.divergenceIndex,
        rootCauseCount: rc.primaryCauses.length + rc.secondaryCauses.length,
      },
      context: {
        divergence: div,
        rootCauses: rc,
      },
    };
  }

  /**
   * Determine overall analysis status based on warnings
   */
  private determineStatus(): 'complete' | 'partial' | 'error' {
    if (this.warnings.length === 0) {
      return 'complete';
    }
    if (this.warnings.length < 3) {
      return 'partial';
    }
    return 'error';
  }
}

export default DivergenceOrchestrator;
