/**
 * GDS Service - Global Decision Superhighway Service
 * 
 * React service for integrating GDS routing with the application.
 * Provides interface for signal submission, decision retrieval, and monitoring.
 */

import { GDSRouter, SignalPayload, FinalDecision } from '@/app/lib/decision/GDSRouter';
import { useGDSState } from '@/app/state/gdsState';
import { SignalType, SignalTier, EngineName } from '@/app/lib/decision/GDSTopology';

/**
 * Signal submission request
 */
export interface SignalRequest {
  type: SignalType;
  data: any;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Signal response
 */
export interface SignalResponse {
  success: boolean;
  decision: FinalDecision | null;
  error?: string;
  queuePosition?: number;
}

/**
 * GDS load status
 */
export interface LoadStatus {
  backlogSize: number;
  backlogUtilization: number; // 0-100%
  avgProcessingTime: number;
  signalsInTransit: number;
  tier1Load: number;
  tier2Load: number;
  tier3Load: number;
  overloaded: boolean;
}

/**
 * Event types
 */
export enum GDSEvent {
  SIGNAL_RECEIVED = 'SIGNAL_RECEIVED',
  DECISION_MADE = 'DECISION_MADE',
  CRITICAL_DECISION = 'CRITICAL_DECISION',
  CONSENSUS_FAILURE = 'CONSENSUS_FAILURE',
  ENGINE_TIMEOUT = 'ENGINE_TIMEOUT',
  HIGH_LOAD = 'HIGH_LOAD',
  BACKLOG_WARNING = 'BACKLOG_WARNING',
  PERFORMANCE_DEGRADED = 'PERFORMANCE_DEGRADED',
}

/**
 * GDS Service Class
 */
class GDSServiceClass {
  private static instance: GDSServiceClass;
  
  // Event listeners
  private listeners: Map<GDSEvent, Set<(data: any) => void>> = new Map();
  
  // Processing queue
  private processingQueue: SignalRequest[] = [];
  private isProcessing = false;
  
  // Load tracking
  private loadWindow: number[] = []; // Last 60 seconds of signal counts
  private loadWindowSize = 60;
  
  private constructor() {
    console.log('[GDS Service] Initialized');
    this.initializeLoadTracking();
  }
  
  public static getInstance(): GDSServiceClass {
    if (!GDSServiceClass.instance) {
      GDSServiceClass.instance = new GDSServiceClass();
    }
    return GDSServiceClass.instance;
  }
  
  // ==========================================================================
  // Signal Submission
  // ==========================================================================
  
  /**
   * Push signal to GDS for routing
   */
  async pushSignal(request: SignalRequest): Promise<SignalResponse> {
    try {
      // Create signal payload
      const payload: SignalPayload = {
        type: request.type,
        data: request.data,
        priority: 0, // Will be assigned by router
        timestamp: Date.now(),
        source: request.source,
        metadata: request.metadata,
      };
      
      // Emit signal received event
      this.emitEvent(GDSEvent.SIGNAL_RECEIVED, { request, payload });
      
      // Add to backlog
      const state = useGDSState.getState();
      const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      state.addToBacklog({
        id: signalId,
        payload,
        tier: this.getTierForSignal(request.type),
        queuedAt: Date.now(),
        priority: this.getPriorityForSignal(request.type),
        status: 'QUEUED',
      });
      
      // Route signal
      state.updateBacklogStatus(signalId, 'PROCESSING');
      const decision = await GDSRouter.routeSignal(request.type, request.data);
      state.updateBacklogStatus(signalId, 'COMPLETED');
      
      // Record decision
      state.recordDecision(decision, payload);
      
      // Record engine responses
      state.recordEngineResponses(signalId, decision.responses);
      
      // Update engine performance
      decision.responses.forEach(response => {
        const success = !decision.missingEngines.includes(response.engine);
        state.updateEnginePerformance(response.engine, response, success);
      });
      
      // Update routing performance
      const routingStats = GDSRouter.getRoutingStats();
      state.updateRoutingPerformance({
        totalSignals: routingStats.totalSignals,
        tier1Signals: routingStats.tier1Signals,
        tier2Signals: routingStats.tier2Signals,
        tier3Signals: routingStats.tier3Signals,
        avgProcessingTime: routingStats.avgProcessingTime,
        timeouts: routingStats.timeouts,
        consensusFailures: routingStats.consensusFailures,
      });
      
      // Create performance snapshot every 20 signals
      if (routingStats.totalSignals % 20 === 0) {
        state.createPerformanceSnapshot();
      }
      
      // Emit decision event
      this.emitEvent(GDSEvent.DECISION_MADE, { decision, payload });
      
      // Check for critical decisions
      if (decision.tier === SignalTier.TIER_1_CRITICAL_THREAT) {
        this.emitEvent(GDSEvent.CRITICAL_DECISION, { decision, payload });
      }
      
      // Check for consensus failures
      if (!decision.consensus) {
        this.emitEvent(GDSEvent.CONSENSUS_FAILURE, { decision, payload });
      }
      
      // Remove from backlog
      state.removeFromBacklog(signalId);
      
      // Update load tracking
      this.updateLoadTracking();
      
      return {
        success: true,
        decision,
      };
    } catch (error) {
      console.error('[GDS Service] Signal routing failed:', error);
      
      // Mark as failed in backlog
      const state = useGDSState.getState();
      const failedSignal = state.signalBacklog.find(s => s.payload.type === request.type);
      if (failedSignal) {
        state.updateBacklogStatus(failedSignal.id, 'FAILED');
      }
      
      return {
        success: false,
        decision: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Batch push multiple signals
   */
  async pushSignalBatch(requests: SignalRequest[]): Promise<SignalResponse[]> {
    const responses: SignalResponse[] = [];
    
    for (const request of requests) {
      const response = await this.pushSignal(request);
      responses.push(response);
    }
    
    return responses;
  }
  
  // ==========================================================================
  // Decision Retrieval
  // ==========================================================================
  
  /**
   * Get final decision for a signal type
   */
  getFinalDecision(type: SignalType): FinalDecision | null {
    const state = useGDSState.getState();
    const decisions = state.getDecisionsByType(type);
    
    return decisions.length > 0 ? decisions[decisions.length - 1].decision : null;
  }
  
  /**
   * Get recent decisions
   */
  getRecentDecisions(count: number = 10): FinalDecision[] {
    const state = useGDSState.getState();
    const history = state.getRecentDecisions(count);
    
    return history.map(h => h.decision);
  }
  
  /**
   * Get last decision
   */
  getLastDecision(): FinalDecision | null {
    const state = useGDSState.getState();
    return state.lastDecision;
  }
  
  // ==========================================================================
  // Load Monitoring
  // ==========================================================================
  
  /**
   * Monitor routing load
   */
  monitorRoutingLoad(): LoadStatus {
    const state = useGDSState.getState();
    const routingStats = GDSRouter.getRoutingStats();
    
    const backlogSize = state.backlogSize;
    const maxBacklog = state.maxBacklogSize;
    const backlogUtilization = (backlogSize / maxBacklog) * 100;
    
    // Calculate tier loads (signals per minute)
    const recentSignals = this.loadWindow.reduce((sum, count) => sum + count, 0);
    const avgSignalsPerSecond = recentSignals / this.loadWindowSize;
    
    const tier1Load = (routingStats.tier1Signals / routingStats.totalSignals) * avgSignalsPerSecond;
    const tier2Load = (routingStats.tier2Signals / routingStats.totalSignals) * avgSignalsPerSecond;
    const tier3Load = (routingStats.tier3Signals / routingStats.totalSignals) * avgSignalsPerSecond;
    
    // Check if overloaded
    const overloaded = 
      backlogUtilization > 80 ||
      routingStats.avgProcessingTime > 800 ||
      routingStats.timeouts > routingStats.totalSignals * 0.1;
    
    const loadStatus: LoadStatus = {
      backlogSize,
      backlogUtilization,
      avgProcessingTime: routingStats.avgProcessingTime,
      signalsInTransit: routingStats.signalsInTransit,
      tier1Load,
      tier2Load,
      tier3Load,
      overloaded,
    };
    
    // Emit events if needed
    if (overloaded) {
      this.emitEvent(GDSEvent.HIGH_LOAD, loadStatus);
    }
    
    if (backlogUtilization > 90) {
      this.emitEvent(GDSEvent.BACKLOG_WARNING, { backlogSize, maxBacklog });
    }
    
    if (routingStats.avgProcessingTime > 600) {
      this.emitEvent(GDSEvent.PERFORMANCE_DEGRADED, { 
        avgProcessingTime: routingStats.avgProcessingTime 
      });
    }
    
    return loadStatus;
  }
  
  /**
   * Initialize load tracking
   */
  private initializeLoadTracking(): void {
    // Initialize window
    this.loadWindow = new Array(this.loadWindowSize).fill(0);
    
    // Update every second
    setInterval(() => {
      this.loadWindow.shift();
      this.loadWindow.push(0);
    }, 1000);
  }
  
  /**
   * Update load tracking
   */
  private updateLoadTracking(): void {
    // Increment current second's count
    this.loadWindow[this.loadWindow.length - 1]++;
  }
  
  // ==========================================================================
  // Engine Integration
  // ==========================================================================
  
  /**
   * Sync with Sentience Engine
   */
  syncWithSentience(): {
    sentienceScore: number;
    emotionalBias: number;
    pressureZones: number;
    recommendation: string;
  } {
    // This would integrate with SentienceEngine in production
    // For now, return mock data
    
    return {
      sentienceScore: 0,
      emotionalBias: 0,
      pressureZones: 0,
      recommendation: 'Sentience integration pending',
    };
  }
  
  /**
   * Sync with Execution Engine
   */
  syncWithExecution(): {
    pendingOrders: number;
    activePositions: number;
    executionReady: boolean;
    recommendation: string;
  } {
    // This would integrate with ExecutionEngine in production
    // For now, return mock data
    
    return {
      pendingOrders: 0,
      activePositions: 0,
      executionReady: true,
      recommendation: 'Execution integration pending',
    };
  }
  
  // ==========================================================================
  // Performance & Analytics
  // ==========================================================================
  
  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const state = useGDSState.getState();
    return state.getPerformanceSummary();
  }
  
  /**
   * Get engine performance
   */
  getEnginePerformance(engine: EngineName) {
    const state = useGDSState.getState();
    return state.getEnginePerformance(engine);
  }
  
  /**
   * Get all engine performance
   */
  getAllEnginePerformance() {
    const state = useGDSState.getState();
    const allPerf: Record<string, any> = {};
    
    state.enginePerformance.forEach((perf, engine) => {
      allPerf[engine] = perf;
    });
    
    return allPerf;
  }
  
  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    const state = useGDSState.getState();
    return {
      routing: state.routingPerformance,
      analytics: state.analytics,
      backlog: {
        size: state.backlogSize,
        maxSize: state.maxBacklogSize,
        utilization: (state.backlogSize / state.maxBacklogSize) * 100,
      },
    };
  }
  
  /**
   * Get performance snapshots
   */
  getPerformanceSnapshots(count: number = 20) {
    const state = useGDSState.getState();
    return state.performanceSnapshots.slice(-count);
  }
  
  // ==========================================================================
  // Event System
  // ==========================================================================
  
  /**
   * Add event listener
   */
  addEventListener(event: GDSEvent, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(event: GDSEvent, callback: (data: any) => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }
  
  /**
   * Emit event
   */
  private emitEvent(event: GDSEvent, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[GDS Service] Event callback error:`, error);
        }
      });
    }
  }
  
  // ==========================================================================
  // Utilities
  // ==========================================================================
  
  /**
   * Get tier for signal type
   */
  private getTierForSignal(type: SignalType): SignalTier {
    const rule = GDSRouter.getRoutingStats();
    // This would use GDSTopology.getTierForSignal in production
    return SignalTier.TIER_2_OPPORTUNITY; // Default
  }
  
  /**
   * Get priority for signal type
   */
  private getPriorityForSignal(type: SignalType): number {
    // This would use GDSRouter.assignPriority in production
    return 50; // Default
  }
  
  /**
   * Check if signal is critical
   */
  isCriticalSignal(type: SignalType): boolean {
    const tier = this.getTierForSignal(type);
    return tier === SignalTier.TIER_1_CRITICAL_THREAT;
  }
  
  /**
   * Check if GDS is healthy
   */
  isHealthy(): boolean {
    const summary = this.getPerformanceSummary();
    return summary.overallHealth >= 70;
  }
  
  /**
   * Check if GDS is overloaded
   */
  isOverloaded(): boolean {
    const loadStatus = this.monitorRoutingLoad();
    return loadStatus.overloaded;
  }
  
  /**
   * Get health status
   */
  getHealthStatus() {
    const summary = this.getPerformanceSummary();
    const loadStatus = this.monitorRoutingLoad();
    
    return {
      healthy: this.isHealthy(),
      overloaded: this.isOverloaded(),
      grade: summary.grade,
      health: summary.overallHealth,
      load: loadStatus,
      issues: summary.issues,
      recommendations: summary.recommendations,
    };
  }
  
  // ==========================================================================
  // Testing & Utilities
  // ==========================================================================
  
  /**
   * Test signal routing
   */
  async testSignalRouting(type: SignalType): Promise<SignalResponse> {
    return this.pushSignal({
      type,
      data: { test: true, timestamp: Date.now() },
      source: 'test',
      metadata: { test: true },
    });
  }
  
  /**
   * Test all signal types
   */
  async testAllSignalTypes(): Promise<Map<SignalType, SignalResponse>> {
    const results = new Map<SignalType, SignalResponse>();
    
    const signalTypes = Object.values(SignalType);
    
    for (const type of signalTypes) {
      const response = await this.testSignalRouting(type);
      results.set(type, response);
    }
    
    return results;
  }
  
  /**
   * Reset GDS state
   */
  reset(): void {
    const state = useGDSState.getState();
    state.reset();
    GDSRouter.clearStats();
    
    console.log('[GDS Service] State reset');
  }
}

// Singleton export
export const gdsService = GDSServiceClass.getInstance();

export default GDSServiceClass;
