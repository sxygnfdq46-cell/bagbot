/**
 * Conductor Service
 * 
 * React service for integrating the Autonomous Trading Conductor with the application.
 * Provides interface for cycle management, subsystem analysis, directive issuance, and insights.
 */

import { AutoTradingConductor, CycleResult, OrchestrationDirective } from '@/app/lib/conductor/AutoTradingConductor';
import { useConductorState } from '@/app/state/conductorState';
import {
  ConductorProfile,
  CONDUCTOR_PROFILES,
  getConductorProfile,
  getProfileNames,
} from '@/app/lib/conductor/ConductorRules';
import { gdsService } from '@/app/services/decision/gdsService';

/**
 * Subsystem analysis result
 */
export interface SubsystemAnalysis {
  subsystem: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
  health: number;
  issues: string[];
  recommendations: string[];
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  success: boolean;
  optimizationsApplied: number;
  improvements: string[];
  performanceGain: number; // 0-100
  timestamp: number;
}

/**
 * Conductor insights
 */
export interface ConductorInsights {
  overallPerformance: number;
  grade: string;
  cycleEfficiency: number;
  subsystemHealth: number;
  marketAlignment: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timestamp: number;
}

/**
 * Event types
 */
export enum ConductorEvent {
  CYCLE_STARTED = 'CYCLE_STARTED',
  CYCLE_COMPLETED = 'CYCLE_COMPLETED',
  CYCLE_FAILED = 'CYCLE_FAILED',
  DIRECTIVE_ISSUED = 'DIRECTIVE_ISSUED',
  MOOD_CHANGED = 'MOOD_CHANGED',
  PROFILE_CHANGED = 'PROFILE_CHANGED',
  CRITICAL_SUBSYSTEM = 'CRITICAL_SUBSYSTEM',
  OPTIMIZATION_COMPLETE = 'OPTIMIZATION_COMPLETE',
  HIGH_PERFORMANCE = 'HIGH_PERFORMANCE',
  LOW_PERFORMANCE = 'LOW_PERFORMANCE',
}

/**
 * Conductor Service Class
 */
class ConductorServiceClass {
  private static instance: ConductorServiceClass;
  
  // Event listeners
  private listeners: Map<ConductorEvent, Set<(data: any) => void>> = new Map();
  
  // Auto-optimization settings
  private autoOptimizeEnabled = false;
  private optimizationInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    console.log('[Conductor Service] Initialized');
  }
  
  public static getInstance(): ConductorServiceClass {
    if (!ConductorServiceClass.instance) {
      ConductorServiceClass.instance = new ConductorServiceClass();
    }
    return ConductorServiceClass.instance;
  }
  
  // ==========================================================================
  // Cycle Management
  // ==========================================================================
  
  /**
   * Begin orchestration cycle
   */
  async beginCycle(): Promise<CycleResult> {
    try {
      // Emit cycle started event
      this.emitEvent(ConductorEvent.CYCLE_STARTED, { timestamp: Date.now() });
      
      // Execute cycle
      const result = await AutoTradingConductor.beginCycle();
      
      // Update state
      const state = useConductorState.getState();
      state.updateConductorState(result.state);
      state.recordCycleResult(result);
      state.updateSubsystemHealth(result.state.subsystemHealth);
      state.recordDirectives(result.state.directives);
      
      // Create snapshot every 10 cycles
      if (result.cycleNumber % 10 === 0) {
        state.createSnapshot();
      }
      
      // Emit completion event
      if (result.success) {
        this.emitEvent(ConductorEvent.CYCLE_COMPLETED, result);
        
        // Check for mood changes
        const previousMood = state.conductorMood;
        if (result.state.conductorMood !== previousMood) {
          this.emitEvent(ConductorEvent.MOOD_CHANGED, {
            from: previousMood,
            to: result.state.conductorMood,
          });
        }
        
        // Check for critical subsystems
        if (result.state.subsystemHealth.criticalIssues.length > 0) {
          this.emitEvent(ConductorEvent.CRITICAL_SUBSYSTEM, {
            issues: result.state.subsystemHealth.criticalIssues,
          });
        }
        
        // Check performance
        const insights = this.conductorInsights();
        if (insights.overallPerformance >= 90) {
          this.emitEvent(ConductorEvent.HIGH_PERFORMANCE, { performance: insights.overallPerformance });
        } else if (insights.overallPerformance < 60) {
          this.emitEvent(ConductorEvent.LOW_PERFORMANCE, { performance: insights.overallPerformance });
        }
      } else {
        this.emitEvent(ConductorEvent.CYCLE_FAILED, result);
      }
      
      return result;
    } catch (error) {
      console.error('[Conductor Service] Cycle execution failed:', error);
      throw error;
    }
  }
  
  /**
   * Start auto-cycle
   */
  startAutoCycle(intervalMs?: number): void {
    const state = useConductorState.getState();
    const interval = intervalMs || state.autoCycleInterval;
    
    state.setAutoCycleActive(true);
    if (intervalMs) {
      state.setAutoCycleInterval(intervalMs);
    }
    
    AutoTradingConductor.startAutoCycle(interval);
    
    console.log(`[Conductor Service] Auto-cycle started (${interval}ms)`);
  }
  
  /**
   * Stop auto-cycle
   */
  stopAutoCycle(): void {
    const state = useConductorState.getState();
    state.setAutoCycleActive(false);
    
    AutoTradingConductor.stopAutoCycle();
    
    console.log('[Conductor Service] Auto-cycle stopped');
  }
  
  /**
   * Check if auto-cycle is active
   */
  isAutoCycleActive(): boolean {
    return AutoTradingConductor.isActive();
  }
  
  // ==========================================================================
  // Subsystem Analysis
  // ==========================================================================
  
  /**
   * Analyze all subsystems
   */
  analyzeSubsystems(): SubsystemAnalysis[] {
    const state = useConductorState.getState();
    
    if (!state.subsystemHealth) {
      return [];
    }
    
    const analyses: SubsystemAnalysis[] = [];
    
    state.subsystemHealth.subsystems.forEach((health, name) => {
      // Get health history to determine trend
      const history = state.getSubsystemHealthHistory(name, 10);
      let trend: SubsystemAnalysis['trend'] = 'STABLE';
      
      if (history.length >= 3) {
        const recentAvg = history.slice(-3).reduce((sum, h) => sum + h.health, 0) / 3;
        const olderAvg = history.slice(0, 3).reduce((sum, h) => sum + h.health, 0) / 3;
        
        if (recentAvg > olderAvg + 5) {
          trend = 'IMPROVING';
        } else if (recentAvg < olderAvg - 5) {
          trend = 'DEGRADING';
        }
      }
      
      analyses.push({
        subsystem: name,
        status: health.status,
        health: health.health,
        issues: health.issues,
        recommendations: health.recommendations,
        trend,
      });
    });
    
    // Sort by health (worst first)
    analyses.sort((a, b) => a.health - b.health);
    
    return analyses;
  }
  
  /**
   * Get subsystem summary
   */
  getSubsystemSummary() {
    const analyses = this.analyzeSubsystems();
    
    const healthy = analyses.filter(a => a.status === 'HEALTHY').length;
    const degraded = analyses.filter(a => a.status === 'DEGRADED').length;
    const critical = analyses.filter(a => a.status === 'CRITICAL').length;
    const offline = analyses.filter(a => a.status === 'OFFLINE').length;
    
    const avgHealth = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.health, 0) / analyses.length
      : 0;
    
    return {
      total: analyses.length,
      healthy,
      degraded,
      critical,
      offline,
      avgHealth,
      analyses,
    };
  }
  
  // ==========================================================================
  // Directive Management
  // ==========================================================================
  
  /**
   * Issue directives manually
   */
  async issueDirectives(directives: OrchestrationDirective[]): Promise<void> {
    const state = useConductorState.getState();
    
    // Record directives
    state.recordDirectives(directives);
    
    // Emit events
    directives.forEach(directive => {
      this.emitEvent(ConductorEvent.DIRECTIVE_ISSUED, directive);
    });
    
    // In production, these would be sent to actual subsystems
    console.log(`[Conductor Service] Issued ${directives.length} directives`);
  }
  
  /**
   * Get recent directives
   */
  getRecentDirectives(count: number = 20): OrchestrationDirective[] {
    const state = useConductorState.getState();
    return state.getRecentDirectives(count);
  }
  
  /**
   * Get directives by target
   */
  getDirectivesByTarget(target: string): OrchestrationDirective[] {
    const state = useConductorState.getState();
    return state.directiveHistory.filter(d => d.target === target);
  }
  
  /**
   * Get high priority directives
   */
  getHighPriorityDirectives(): OrchestrationDirective[] {
    const state = useConductorState.getState();
    return state.lastDirectives.filter(d => d.priority >= 80);
  }
  
  // ==========================================================================
  // Optimization
  // ==========================================================================
  
  /**
   * Auto-optimize system
   */
  async autoOptimize(): Promise<OptimizationResult> {
    const startTime = Date.now();
    const improvements: string[] = [];
    let optimizationsApplied = 0;
    
    try {
      // Get current insights
      const insights = this.conductorInsights();
      
      // Optimization 1: Adjust cycle interval based on load
      const state = useConductorState.getState();
      if (state.currentState && state.currentState.systemLoad > 80) {
        const currentInterval = state.autoCycleInterval;
        const newInterval = Math.min(currentInterval * 1.2, 10000);
        state.setAutoCycleInterval(newInterval);
        improvements.push(`Increased cycle interval to ${newInterval}ms to reduce load`);
        optimizationsApplied++;
      }
      
      // Optimization 2: Recommend profile changes based on performance
      if (insights.overallPerformance < 60) {
        improvements.push('Consider switching to CONSERVATIVE profile');
        optimizationsApplied++;
      }
      
      // Optimization 3: Sync with GDS for routing optimization
      const gdsHealth = await this.syncWithGDS();
      if (gdsHealth.overloaded) {
        improvements.push('GDS overloaded - reducing directive frequency');
        optimizationsApplied++;
      }
      
      // Optimization 4: Check risk engine sync
      const riskRecommendations = await this.syncWithRisk();
      if (riskRecommendations.length > 0) {
        improvements.push(...riskRecommendations);
        optimizationsApplied += riskRecommendations.length;
      }
      
      // Calculate performance gain (rough estimate)
      const performanceGain = Math.min(optimizationsApplied * 5, 30);
      
      const result: OptimizationResult = {
        success: true,
        optimizationsApplied,
        improvements,
        performanceGain,
        timestamp: Date.now(),
      };
      
      // Emit event
      this.emitEvent(ConductorEvent.OPTIMIZATION_COMPLETE, result);
      
      console.log(`[Conductor Service] Auto-optimization complete: ${optimizationsApplied} optimizations`);
      
      return result;
    } catch (error) {
      console.error('[Conductor Service] Auto-optimization failed:', error);
      
      return {
        success: false,
        optimizationsApplied: 0,
        improvements: ['Optimization failed'],
        performanceGain: 0,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * Enable auto-optimization
   */
  enableAutoOptimize(intervalMs: number = 60000): void {
    if (this.autoOptimizeEnabled) {
      console.warn('[Conductor Service] Auto-optimize already enabled');
      return;
    }
    
    this.autoOptimizeEnabled = true;
    console.log(`[Conductor Service] Auto-optimize enabled (${intervalMs}ms)`);
    
    this.optimizationInterval = setInterval(() => {
      this.autoOptimize().catch(error => {
        console.error('[Conductor Service] Auto-optimize error:', error);
      });
    }, intervalMs);
  }
  
  /**
   * Disable auto-optimization
   */
  disableAutoOptimize(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
    
    this.autoOptimizeEnabled = false;
    console.log('[Conductor Service] Auto-optimize disabled');
  }
  
  // ==========================================================================
  // External System Synchronization
  // ==========================================================================
  
  /**
   * Sync with Global Decision Superhighway
   */
  async syncWithGDS(): Promise<{
    healthy: boolean;
    overloaded: boolean;
    avgProcessingTime: number;
    recommendations: string[];
  }> {
    try {
      // Get GDS health status
      const healthStatus = gdsService.getHealthStatus();
      
      const recommendations: string[] = [];
      
      if (healthStatus.overloaded) {
        recommendations.push('Reduce signal submission rate');
      }
      
      if (!healthStatus.healthy) {
        recommendations.push('Review GDS configuration');
      }
      
      return {
        healthy: healthStatus.healthy,
        overloaded: healthStatus.overloaded,
        avgProcessingTime: healthStatus.load.avgProcessingTime,
        recommendations,
      };
    } catch (error) {
      console.error('[Conductor Service] GDS sync failed:', error);
      return {
        healthy: false,
        overloaded: false,
        avgProcessingTime: 0,
        recommendations: ['GDS sync failed'],
      };
    }
  }
  
  /**
   * Sync with Risk Engine
   */
  async syncWithRisk(): Promise<string[]> {
    const recommendations: string[] = [];
    
    // In production, this would query actual risk engine
    // For now, return mock recommendations based on conductor state
    
    const state = useConductorState.getState();
    
    if (state.currentState) {
      const { marketState, subsystemHealth } = state.currentState;
      
      if (marketState.threats > 70) {
        recommendations.push('High threat level - consider defensive positioning');
      }
      
      if (subsystemHealth.overall < 60) {
        recommendations.push('System health degraded - reduce position sizes');
      }
      
      if (marketState.volatility > 70) {
        recommendations.push('High volatility - tighten stop losses');
      }
    }
    
    return recommendations;
  }
  
  // ==========================================================================
  // Insights & Analytics
  // ==========================================================================
  
  /**
   * Get conductor insights
   */
  conductorInsights(): ConductorInsights {
    const state = useConductorState.getState();
    const stateInsights = state.getConductorInsights();
    
    // Calculate additional metrics
    let cycleEfficiency = 70;
    if (state.analytics.avgCycleTime < 200) cycleEfficiency = 95;
    else if (state.analytics.avgCycleTime < 400) cycleEfficiency = 85;
    else if (state.analytics.avgCycleTime > 600) cycleEfficiency = 50;
    
    let subsystemHealth = state.subsystemHealth?.overall || 0;
    
    let marketAlignment = 70;
    if (state.currentState) {
      const { marketState, conductorMood } = state.currentState;
      
      // Check if mood aligns with market conditions
      if (
        (marketState.threats > 70 && conductorMood === 'DEFENSIVE') ||
        (marketState.opportunities > 70 && conductorMood === 'OPPORTUNISTIC') ||
        (marketState.condition === 'VOLATILE' && conductorMood === 'CONSERVATIVE')
      ) {
        marketAlignment = 90;
      }
    }
    
    return {
      overallPerformance: stateInsights.overallPerformance,
      grade: stateInsights.grade,
      cycleEfficiency,
      subsystemHealth,
      marketAlignment,
      strengths: stateInsights.strengths,
      weaknesses: stateInsights.weaknesses,
      recommendations: stateInsights.recommendations,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const state = useConductorState.getState();
    const insights = this.conductorInsights();
    
    return {
      insights,
      analytics: state.analytics,
      currentState: state.currentState,
      activeProfile: state.activeProfile,
      isAutoCycleActive: state.isAutoCycleActive,
    };
  }
  
  /**
   * Get recent cycles
   */
  getRecentCycles(count: number = 10) {
    const state = useConductorState.getState();
    return state.getRecentCycles(count);
  }
  
  /**
   * Get performance snapshots
   */
  getPerformanceSnapshots(count: number = 20) {
    const state = useConductorState.getState();
    return state.snapshots.slice(-count);
  }
  
  // ==========================================================================
  // Profile Management
  // ==========================================================================
  
  /**
   * Set conductor profile
   */
  setProfile(profileName: string): void {
    const profile = getConductorProfile(profileName);
    
    if (!profile) {
      throw new Error(`Profile not found: ${profileName}`);
    }
    
    const state = useConductorState.getState();
    state.setActiveProfile(profile);
    
    // Emit event
    this.emitEvent(ConductorEvent.PROFILE_CHANGED, { profile });
    
    console.log(`[Conductor Service] Profile changed to: ${profileName}`);
  }
  
  /**
   * Get active profile
   */
  getActiveProfile(): ConductorProfile | null {
    const state = useConductorState.getState();
    return state.activeProfile;
  }
  
  /**
   * Get available profiles
   */
  getAvailableProfiles(): string[] {
    return getProfileNames();
  }
  
  /**
   * Get all profiles
   */
  getAllProfiles(): Record<string, ConductorProfile> {
    return CONDUCTOR_PROFILES;
  }
  
  // ==========================================================================
  // Event System
  // ==========================================================================
  
  /**
   * Add event listener
   */
  addEventListener(event: ConductorEvent, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(event: ConductorEvent, callback: (data: any) => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }
  
  /**
   * Emit event
   */
  private emitEvent(event: ConductorEvent, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[Conductor Service] Event callback error:`, error);
        }
      });
    }
  }
  
  // ==========================================================================
  // Testing & Utilities
  // ==========================================================================
  
  /**
   * Test cycle execution
   */
  async testCycle(): Promise<CycleResult> {
    console.log('[Conductor Service] Running test cycle...');
    return this.beginCycle();
  }
  
  /**
   * Reset conductor state
   */
  reset(): void {
    const state = useConductorState.getState();
    state.reset();
    
    console.log('[Conductor Service] State reset');
  }
  
  /**
   * Get cycle number
   */
  getCycleNumber(): number {
    return AutoTradingConductor.getCycleNumber();
  }
  
  /**
   * Get average cycle time
   */
  getAverageCycleTime(): number {
    return AutoTradingConductor.getAverageCycleTime();
  }
}

// Singleton export
export const conductorService = ConductorServiceClass.getInstance();

export default ConductorServiceClass;
