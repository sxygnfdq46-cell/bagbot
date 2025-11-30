/**
 * Divergence UI Controller
 * 
 * High-level controller connecting the orchestrator, formatter, and UI dashboards.
 * Provides a clean, promise-based interface for frontend components to load
 * and refresh divergence intelligence data.
 * 
 * Architecture:
 * - Orchestrates analysis pipeline via DivergenceOrchestrator
 * - Formats raw results via DivergenceUIFormatter
 * - Exposes simple async methods for UI consumption
 * - Never assumes server availability
 * - Fully self-contained in frontend layer
 */

import DivergenceOrchestrator, {
  type FullAnalysisParams,
  type FullAnalysisResult,
  type ErrorResult,
} from './DivergenceOrchestrator';

import DivergenceUIFormatter, {
  type FormattedUIData,
  type ErrorUIData,
} from './DivergenceUIFormatter';

import type {
  BacktestData,
  LiveData,
  MarketMeta,
} from '../../engines/RealityDivergenceScanner';

// ============================================================================
// Type Definitions
// ============================================================================

export interface IntelligenceLoadParams {
  backtestData: BacktestData;
  liveData: LiveData;
  marketMeta: MarketMeta;
  expectedModel?: any;
}

export interface IntelligenceLoadResult {
  data?: FormattedUIData;
  error?: {
    status: 'error';
    message: string;
    panels: null;
  };
  timestamp: number;
}

// ============================================================================
// Divergence UI Controller Class
// ============================================================================

export default class DivergenceUIController {
  private orchestrator: DivergenceOrchestrator;
  private formatter: DivergenceUIFormatter;
  private lastLoadTime: number = 0;
  private isLoading: boolean = false;

  constructor() {
    this.orchestrator = new DivergenceOrchestrator();
    this.formatter = new DivergenceUIFormatter();
  }

  /**
   * Entry point for the UI.
   * 
   * Called by the dashboard when the user loads:
   * - Intelligence Panel
   * - Threat Monitor
   * - Divergence Engine section
   * 
   * Returns formatted, UI-ready intelligence data or error state.
   */
  async loadIntelligence(params: IntelligenceLoadParams): Promise<IntelligenceLoadResult> {
    // Prevent concurrent loads
    if (this.isLoading) {
      return {
        error: {
          status: 'error',
          message: 'Intelligence load already in progress',
          panels: null,
        },
        timestamp: Date.now(),
      };
    }

    this.isLoading = true;

    try {
      // Run full analysis pipeline
      const analysisParams: FullAnalysisParams = {
        backtestData: params.backtestData,
        liveData: params.liveData,
        marketMeta: params.marketMeta,
        expectedModel: params.expectedModel,
      };

      const rawResult = await this.orchestrator.runFullAnalysis(analysisParams);

      // Check if orchestrator returned error
      if (rawResult.status === 'error') {
        const errorResult = rawResult as ErrorResult;
        return {
          error: {
            status: 'error',
            message: errorResult.message,
            panels: null,
          },
          timestamp: Date.now(),
        };
      }

      // Format results for UI
      const formattedResult = this.formatter.format(rawResult);

      // Check if formatter returned error
      if ('status' in formattedResult && formattedResult.status === 'error') {
        const errorUIData = formattedResult as ErrorUIData;
        return {
          error: {
            status: 'error',
            message: errorUIData.message,
            panels: null,
          },
          timestamp: Date.now(),
        };
      }

      // Update last load time
      this.lastLoadTime = Date.now();

      // Return success result
      return {
        data: formattedResult as FormattedUIData,
        timestamp: this.lastLoadTime,
      };
    } catch (err: any) {
      // Critical controller failure
      console.error('DivergenceUIController: Critical failure', err);
      
      return {
        error: {
          status: 'error',
          message: err?.message || 'UIController failed',
          panels: null,
        },
        timestamp: Date.now(),
      };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Quick divergence scan without full analysis pipeline.
   * 
   * Useful for:
   * - Real-time monitoring
   * - Quick health checks
   * - Lightweight dashboard widgets
   * 
   * Returns only divergence scan results, formatted for UI.
   */
  async quickScan(params: IntelligenceLoadParams): Promise<{
    divergence?: any;
    error?: { status: 'error'; message: string };
    timestamp: number;
  }> {
    try {
      const analysisParams: FullAnalysisParams = {
        backtestData: params.backtestData,
        liveData: params.liveData,
        marketMeta: params.marketMeta,
        expectedModel: params.expectedModel,
      };

      const rawResult = await this.orchestrator.runQuickScan(analysisParams);

      // Check for error
      if ('status' in rawResult && rawResult.status === 'error') {
        return {
          error: {
            status: 'error',
            message: rawResult.message,
          },
          timestamp: Date.now(),
        };
      }

      // Format divergence for UI (rawResult is DivergenceScanResult at this point)
      const formattedDivergence = this.formatter.format({
        divergence: rawResult as any,
        correlations: { matrix: {}, strongPairs: [], timestamp: Date.now() },
        rootCauses: { primaryCauses: [], secondaryCauses: [], timestamp: Date.now() },
        forecasting: {
          nearTerm: { horizon: '1h', predictions: {}, range: { min: 0, max: 0 } },
          midTerm: { horizon: '4h', predictions: {}, range: { min: 0, max: 0 } },
          timestamp: Date.now(),
        },
        threatClusters: { clusters: [], totalThreats: 0, criticalCount: 0, timestamp: Date.now() },
        status: 'complete' as const,
        timestamp: Date.now(),
      });

      return {
        divergence: (formattedDivergence as FormattedUIData).divergencePanel,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        error: {
          status: 'error',
          message: err?.message || 'Quick scan failed',
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Manual refresh from UI.
   * Keeps UI responsive by allowing user-triggered reloads.
   */
  async refresh(params: IntelligenceLoadParams): Promise<IntelligenceLoadResult> {
    return this.loadIntelligence(params);
  }

  /**
   * Reset controller state.
   * Useful for:
   * - Clearing cached data
   * - Resetting after configuration changes
   * - Manual troubleshooting
   */
  reset(): void {
    this.orchestrator.reset();
    this.lastLoadTime = 0;
    this.isLoading = false;
  }

  /**
   * Health check for all analytics components.
   * 
   * Returns status of:
   * - Controller
   * - Orchestrator
   * - All analytics engines
   */
  async healthCheck(): Promise<{
    controller: boolean;
    orchestrator: boolean;
    formatter: boolean;
    engines: {
      scanner: boolean;
      correlation: boolean;
      rootCause: boolean;
      prediction: boolean;
      threat: boolean;
    };
    lastLoadTime: number;
    isLoading: boolean;
  }> {
    try {
      const orchestratorHealth = await this.orchestrator.healthCheck();
      
      return {
        controller: true,
        orchestrator: orchestratorHealth.orchestrator,
        formatter: true, // Formatter is synchronous and always available
        engines: orchestratorHealth.engines,
        lastLoadTime: this.lastLoadTime,
        isLoading: this.isLoading,
      };
    } catch (err) {
      return {
        controller: false,
        orchestrator: false,
        formatter: false,
        engines: {
          scanner: false,
          correlation: false,
          rootCause: false,
          prediction: false,
          threat: false,
        },
        lastLoadTime: this.lastLoadTime,
        isLoading: this.isLoading,
      };
    }
  }

  /**
   * Get last load timestamp.
   * Useful for displaying "last updated" info in UI.
   */
  getLastLoadTime(): number {
    return this.lastLoadTime;
  }

  /**
   * Check if controller is currently loading data.
   * Useful for showing loading spinners in UI.
   */
  getLoadingState(): boolean {
    return this.isLoading;
  }
}
