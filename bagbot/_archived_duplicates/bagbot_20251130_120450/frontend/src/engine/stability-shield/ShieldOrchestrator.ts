/**
 * ═══════════════════════════════════════════════════════════════════
 * SHIELD ORCHESTRATOR — Phase 5 Integration Layer
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Unified real-time processor that orchestrates:
 * - CorrelationMatrix: Cross-shield correlation analysis
 * - RootCauseEngine: Causal chain detection and DAG building
 * - PredictionHorizon: 4-window forecasting (30s → 10min)
 * - RiskScoringEngine: Multi-signal fusion into 0-100 score
 * 
 * Features:
 * - Live updating every 5 seconds (configurable)
 * - Event routing to UI components
 * - Unified intelligence payload
 * - Automatic data pipeline orchestration
 * - Thread-safe state management
 * - Performance monitoring
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import { CorrelationMatrixEngine } from '@/components/shield/brain/CorrelationMatrix';
import { RootCauseEngine } from '@/components/shield/brain/RootCauseEngine';
import { RiskScoringEngine, RiskScoreOutput, RiskClass } from './RiskScoringEngine';

// Placeholder for PredictionHorizon until implemented
class PredictionHorizon {
  forecast() {
    return {
      window30s: { state: 'GREEN', confidence: 0.8 },
      window2min: { state: 'GREEN', confidence: 0.75 },
      window5min: { state: 'YELLOW', confidence: 0.7 },
      window10min: { state: 'YELLOW', confidence: 0.65 },
      riskShift: 0.5
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

/**
 * Unified intelligence output for UI consumption
 */
export interface ShieldIntelligencePayload {
  // Overall status
  timestamp: number;
  riskScore: number; // 0-100
  riskClass: RiskClass;
  confidence: number; // 0-1
  trend: "UP" | "DOWN" | "STABLE";
  
  // Correlations
  correlations: {
    intensity: number; // 0-1
    destabilizing: number; // Count
    strongLinks: Array<{ from: string; to: string; strength: number }>;
  };
  
  // Root causes
  rootCauses: {
    active: number; // Count
    primary: string | null;
    contributors: Array<{ cause: string; weight: number }>;
  };
  
  // Predictions
  predictions: {
    horizon30s: { state: string; confidence: number };
    horizon2min: { state: string; confidence: number };
    horizon5min: { state: string; confidence: number };
    horizon10min: { state: string; confidence: number };
    riskShift: number; // -2 to +2
  };
  
  // Performance
  performance: {
    cycleTime: number; // milliseconds
    lastUpdate: number;
    health: "HEALTHY" | "DEGRADED" | "CRITICAL";
  };
}

/**
 * Event types for UI subscriptions
 */
export type ShieldEvent = 
  | { type: 'intelligence-update'; payload: ShieldIntelligencePayload }
  | { type: 'high-risk-detected'; payload: { score: number; class: RiskClass } }
  | { type: 'cascade-warning'; payload: { intensity: number; links: number } }
  | { type: 'prediction-shift'; payload: { horizon: string; from: string; to: string } }
  | { type: 'performance-degraded'; payload: { cycleTime: number; threshold: number } };

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  updateInterval: number; // Milliseconds between analysis cycles
  autoStart: boolean; // Start automatically on initialization
  performanceThreshold: number; // Max cycle time before degradation warning (ms)
  highRiskThreshold: number; // Score threshold for high-risk events (0-100)
}

/**
 * Orchestrator state
 */
export type OrchestratorState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR';

// ─────────────────────────────────────────────────────────────────
// SHIELD ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────

export class ShieldOrchestrator {
  // Engine instances
  private correlation: CorrelationMatrixEngine;
  private rootCause: RootCauseEngine;
  private prediction: PredictionHorizon;
  private riskScoring: RiskScoringEngine;
  
  // Configuration
  private config: OrchestratorConfig;
  
  // State management
  private state: OrchestratorState = 'IDLE';
  private currentPayload: ShieldIntelligencePayload | null = null;
  private updateTimer: NodeJS.Timeout | null = null;
  private lastCycleStart: number = 0;
  
  // Event subscribers
  private eventCallbacks: Map<string, Array<(event: ShieldEvent) => void>> = new Map();
  
  // Performance tracking
  private cycleTimes: number[] = [];
  private readonly MAX_CYCLE_HISTORY = 20;

  constructor(config?: Partial<OrchestratorConfig>) {
    // Initialize configuration
    this.config = {
      updateInterval: 5000, // 5 seconds default
      autoStart: false,
      performanceThreshold: 1000, // 1 second max cycle time
      highRiskThreshold: 75, // ORANGE/RED threshold
      ...config
    };

    // Initialize engines in correct dependency order
    this.correlation = new CorrelationMatrixEngine();
    this.rootCause = new RootCauseEngine();
    this.prediction = new PredictionHorizon();
    this.riskScoring = new RiskScoringEngine(
      this.correlation,
      this.rootCause,
      this.prediction
    );

    // Auto-start if configured
    if (this.config.autoStart) {
      this.start();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // LIFECYCLE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────

  /**
   * Start the orchestrator (begin live updates)
   */
  public start(): void {
    if (this.state === 'RUNNING') {
      console.warn('[ShieldOrchestrator] Already running');
      return;
    }

    console.log('[ShieldOrchestrator] Starting intelligence pipeline...');
    this.state = 'RUNNING';
    
    // Run first analysis immediately
    this.runAnalysisCycle();
    
    // Schedule recurring updates
    this.updateTimer = setInterval(() => {
      this.runAnalysisCycle();
    }, this.config.updateInterval);
  }

  /**
   * Pause the orchestrator (stop updates but preserve state)
   */
  public pause(): void {
    if (this.state !== 'RUNNING') {
      console.warn('[ShieldOrchestrator] Not running');
      return;
    }

    console.log('[ShieldOrchestrator] Pausing...');
    this.state = 'PAUSED';
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Resume from paused state
   */
  public resume(): void {
    if (this.state !== 'PAUSED') {
      console.warn('[ShieldOrchestrator] Not paused');
      return;
    }

    console.log('[ShieldOrchestrator] Resuming...');
    this.start();
  }

  /**
   * Stop the orchestrator completely
   */
  public stop(): void {
    console.log('[ShieldOrchestrator] Stopping...');
    
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    this.state = 'IDLE';
    this.currentPayload = null;
    this.cycleTimes = [];
  }

  // ─────────────────────────────────────────────────────────────────
  // ANALYSIS PIPELINE
  // ─────────────────────────────────────────────────────────────────

  /**
   * Run a complete analysis cycle through all engines
   */
  private runAnalysisCycle(): void {
    this.lastCycleStart = Date.now();

    try {
      // Step 1: Correlation analysis - use getGraph() method
      const correlationGraph = this.correlation.getGraph();
      
      // Step 2: Root cause analysis - use getGraphSummary() method
      const rootCauseData = this.rootCause.getGraphSummary();
      
      // Step 3: Prediction forecasting
      const forecastData = this.prediction.forecast();
      
      // Step 4: Risk scoring (combines all inputs)
      const riskOutput = this.riskScoring.calculateRisk();
      
      // Step 5: Build unified payload
      const payload = this.buildIntelligencePayload(
        correlationGraph,
        rootCauseData,
        forecastData,
        riskOutput
      );
      
      // Calculate cycle performance
      const cycleTime = Date.now() - this.lastCycleStart;
      this.trackCycleTime(cycleTime);
      
      // Update payload with performance data
      payload.performance = {
        cycleTime,
        lastUpdate: Date.now(),
        health: this.getPerformanceHealth(cycleTime)
      };
      
      // Store current payload
      this.currentPayload = payload;
      
      // Emit events
      this.emitIntelligenceUpdate(payload);
      this.checkAndEmitAlerts(payload);
      
    } catch (error) {
      console.error('[ShieldOrchestrator] Analysis cycle failed:', error);
      this.state = 'ERROR';
      this.stop();
    }
  }

  /**
   * Build unified intelligence payload from all engine outputs
   */
  private buildIntelligencePayload(
    correlationGraph: any,
    rootCauseSummary: any,
    forecastData: any,
    riskOutput: RiskScoreOutput
  ): ShieldIntelligencePayload {
    // Extract correlation insights
    const destabilizingCount = correlationGraph.cascadesDetected || 0;
    const strongLinks = (correlationGraph.strongLinks || []).map((link: any) => ({
      from: link.source,
      to: link.target,
      strength: Math.abs(link.pearsonCoefficient)
    }));
    
    // Calculate correlation intensity from pairs
    const intensity = correlationGraph.pairs && correlationGraph.pairs.length > 0
      ? correlationGraph.pairs.reduce((sum: number, p: any) => sum + Math.abs(p.pearsonCoefficient), 0) / correlationGraph.pairs.length
      : 0;
    
    // Extract root cause insights from graph summary
    const activeCount = rootCauseSummary.nodeCount || 0;
    const primaryCause = activeCount > 0 ? 'System event detected' : null;
    
    // Build mock contributors from risk output
    const contributors = (riskOutput.contributors || []).map(c => ({
      cause: c.factor,
      weight: c.weight
    }));
    
    // Extract prediction insights
    const predictions = {
      horizon30s: forecastData.window30s || { state: 'GREEN', confidence: 0.8 },
      horizon2min: forecastData.window2min || { state: 'GREEN', confidence: 0.75 },
      horizon5min: forecastData.window5min || { state: 'YELLOW', confidence: 0.7 },
      horizon10min: forecastData.window10min || { state: 'YELLOW', confidence: 0.65 },
      riskShift: forecastData.riskShift || 0
    };

    return {
      timestamp: Date.now(),
      riskScore: riskOutput.score,
      riskClass: riskOutput.riskClass,
      confidence: riskOutput.confidence,
      trend: riskOutput.trend,
      
      correlations: {
        intensity,
        destabilizing: destabilizingCount,
        strongLinks
      },
      
      rootCauses: {
        active: activeCount,
        primary: primaryCause,
        contributors
      },
      
      predictions,
      
      performance: {
        cycleTime: 0, // Will be updated after cycle completes
        lastUpdate: Date.now(),
        health: 'HEALTHY'
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // EVENT SYSTEM
  // ─────────────────────────────────────────────────────────────────

  /**
   * Subscribe to orchestrator events
   */
  public on(eventType: ShieldEvent['type'], callback: (event: ShieldEvent) => void): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, []);
    }
    
    this.eventCallbacks.get(eventType)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.eventCallbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit intelligence update event
   */
  private emitIntelligenceUpdate(payload: ShieldIntelligencePayload): void {
    this.emitEvent({
      type: 'intelligence-update',
      payload
    });
  }

  /**
   * Check conditions and emit alert events
   */
  private checkAndEmitAlerts(payload: ShieldIntelligencePayload): void {
    // High risk detection
    if (payload.riskScore >= this.config.highRiskThreshold) {
      this.emitEvent({
        type: 'high-risk-detected',
        payload: {
          score: payload.riskScore,
          class: payload.riskClass
        }
      });
    }

    // Cascade warning
    if (payload.correlations.destabilizing > 2) {
      this.emitEvent({
        type: 'cascade-warning',
        payload: {
          intensity: payload.correlations.intensity,
          links: payload.correlations.destabilizing
        }
      });
    }

    // Performance degradation
    if (payload.performance.health === 'DEGRADED' || payload.performance.health === 'CRITICAL') {
      this.emitEvent({
        type: 'performance-degraded',
        payload: {
          cycleTime: payload.performance.cycleTime,
          threshold: this.config.performanceThreshold
        }
      });
    }
  }

  /**
   * Generic event emitter
   */
  private emitEvent(event: ShieldEvent): void {
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[ShieldOrchestrator] Event callback error (${event.type}):`, error);
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // PERFORMANCE MONITORING
  // ─────────────────────────────────────────────────────────────────

  /**
   * Track analysis cycle time
   */
  private trackCycleTime(cycleTime: number): void {
    this.cycleTimes.push(cycleTime);
    
    // Keep only recent history
    if (this.cycleTimes.length > this.MAX_CYCLE_HISTORY) {
      this.cycleTimes.shift();
    }
  }

  /**
   * Get performance health status
   */
  private getPerformanceHealth(cycleTime: number): "HEALTHY" | "DEGRADED" | "CRITICAL" {
    const threshold = this.config.performanceThreshold;
    
    if (cycleTime > threshold * 2) {
      return 'CRITICAL';
    } else if (cycleTime > threshold) {
      return 'DEGRADED';
    }
    
    return 'HEALTHY';
  }

  /**
   * Get average cycle time
   */
  public getAverageCycleTime(): number {
    if (this.cycleTimes.length === 0) return 0;
    
    const sum = this.cycleTimes.reduce((a, b) => a + b, 0);
    return sum / this.cycleTimes.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get current intelligence payload
   */
  public getCurrentIntelligence(): ShieldIntelligencePayload | null {
    return this.currentPayload;
  }

  /**
   * Get orchestrator state
   */
  public getState(): OrchestratorState {
    return this.state;
  }

  /**
   * Force an immediate analysis cycle (outside of scheduled updates)
   */
  public forceUpdate(): void {
    if (this.state === 'ERROR') {
      console.warn('[ShieldOrchestrator] Cannot force update in ERROR state');
      return;
    }
    
    console.log('[ShieldOrchestrator] Forcing immediate analysis cycle...');
    this.runAnalysisCycle();
  }

  /**
   * Update configuration (will apply on next cycle)
   */
  public updateConfig(config: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
    
    // If update interval changed and we're running, restart timer
    if (config.updateInterval && this.state === 'RUNNING') {
      this.pause();
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    avgCycleTime: number;
    minCycleTime: number;
    maxCycleTime: number;
    recentCycles: number[];
  } {
    return {
      avgCycleTime: this.getAverageCycleTime(),
      minCycleTime: this.cycleTimes.length > 0 ? Math.min(...this.cycleTimes) : 0,
      maxCycleTime: this.cycleTimes.length > 0 ? Math.max(...this.cycleTimes) : 0,
      recentCycles: [...this.cycleTimes]
    };
  }

  /**
   * Access individual engines (for advanced use cases)
   */
  public getEngines(): {
    correlation: CorrelationMatrixEngine;
    rootCause: RootCauseEngine;
    prediction: PredictionHorizon;
    riskScoring: RiskScoringEngine;
  } {
    return {
      correlation: this.correlation,
      rootCause: this.rootCause,
      prediction: this.prediction,
      riskScoring: this.riskScoring
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let orchestratorInstance: ShieldOrchestrator | null = null;

/**
 * Get singleton orchestrator instance
 */
export function getShieldOrchestrator(): ShieldOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ShieldOrchestrator({ autoStart: false });
  }
  return orchestratorInstance;
}

/**
 * Initialize orchestrator with custom configuration
 */
export function initializeShieldOrchestrator(config?: Partial<OrchestratorConfig>): ShieldOrchestrator {
  orchestratorInstance = new ShieldOrchestrator(config);
  return orchestratorInstance;
}

/**
 * Dispose orchestrator instance
 */
export function disposeShieldOrchestrator(): void {
  if (orchestratorInstance) {
    orchestratorInstance.stop();
    orchestratorInstance = null;
  }
}
