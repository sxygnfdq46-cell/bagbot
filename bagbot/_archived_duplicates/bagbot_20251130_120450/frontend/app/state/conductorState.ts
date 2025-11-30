/**
 * Conductor State Management
 * 
 * Manages persistent state for the Autonomous Trading Conductor including
 * cycle history, directives, subsystem health, and orchestration analytics.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ConductorState,
  OrchestrationDirective,
  SubsystemHealth,
  AllSubsystemsHealth,
  CycleResult,
} from '@/app/lib/conductor/AutoTradingConductor';
import { ConductorProfile } from '@/app/lib/conductor/ConductorRules';

/**
 * Orchestration history entry
 */
interface OrchestrationHistory {
  cycleNumber: number;
  result: CycleResult;
  timestamp: number;
}

/**
 * Conductor performance snapshot
 */
interface ConductorSnapshot {
  timestamp: number;
  cycleNumber: number;
  conductorMood: ConductorState['conductorMood'];
  marketCondition: string;
  systemHealth: number;
  directivesIssued: number;
  cycleTime: number;
}

/**
 * Conductor analytics
 */
interface ConductorAnalytics {
  totalCycles: number;
  successfulCycles: number;
  failedCycles: number;
  avgCycleTime: number;
  totalDirectivesIssued: number;
  avgDirectivesPerCycle: number;
  avgSystemHealth: number;
  moodDistribution: Map<ConductorState['conductorMood'], number>;
  marketConditionDistribution: Map<string, number>;
}

/**
 * Conductor State Interface
 */
interface ConductorStateStore {
  // Current state
  currentState: ConductorState | null;
  cycleNumber: number;
  conductorMood: ConductorState['conductorMood'];
  
  // Active profile
  activeProfile: ConductorProfile | null;
  
  // Directives
  lastDirectives: OrchestrationDirective[];
  directiveHistory: OrchestrationDirective[];
  maxDirectiveHistory: number;
  
  // Subsystem health
  subsystemHealth: AllSubsystemsHealth | null;
  subsystemHealthHistory: Map<string, SubsystemHealth[]>;
  maxHealthHistory: number;
  
  // Orchestration history
  orchestrationHistory: OrchestrationHistory[];
  maxOrchestrationHistory: number;
  
  // Performance snapshots
  snapshots: ConductorSnapshot[];
  maxSnapshots: number;
  
  // Analytics
  analytics: ConductorAnalytics;
  
  // Auto-cycle state
  isAutoCycleActive: boolean;
  autoCycleInterval: number;
  
  // Actions
  updateConductorState: (state: ConductorState) => void;
  recordCycleResult: (result: CycleResult) => void;
  updateSubsystemHealth: (health: AllSubsystemsHealth) => void;
  recordDirective: (directive: OrchestrationDirective) => void;
  recordDirectives: (directives: OrchestrationDirective[]) => void;
  
  setActiveProfile: (profile: ConductorProfile) => void;
  setAutoCycleActive: (active: boolean) => void;
  setAutoCycleInterval: (interval: number) => void;
  
  createSnapshot: () => void;
  
  getRecentCycles: (count: number) => OrchestrationHistory[];
  getRecentDirectives: (count: number) => OrchestrationDirective[];
  getSubsystemHealthHistory: (subsystem: string, count: number) => SubsystemHealth[];
  
  getConductorInsights: () => {
    overallPerformance: number;
    grade: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  
  reset: () => void;
}

/**
 * Create Conductor State Store
 */
export const useConductorState = create<ConductorStateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentState: null,
      cycleNumber: 0,
      conductorMood: 'BALANCED',
      
      activeProfile: null,
      
      lastDirectives: [],
      directiveHistory: [],
      maxDirectiveHistory: 500,
      
      subsystemHealth: null,
      subsystemHealthHistory: new Map(),
      maxHealthHistory: 100,
      
      orchestrationHistory: [],
      maxOrchestrationHistory: 200,
      
      snapshots: [],
      maxSnapshots: 300,
      
      analytics: {
        totalCycles: 0,
        successfulCycles: 0,
        failedCycles: 0,
        avgCycleTime: 0,
        totalDirectivesIssued: 0,
        avgDirectivesPerCycle: 0,
        avgSystemHealth: 0,
        moodDistribution: new Map(),
        marketConditionDistribution: new Map(),
      },
      
      isAutoCycleActive: false,
      autoCycleInterval: 5000,
      
      // ==========================================================================
      // State Updates
      // ==========================================================================
      
      updateConductorState: (state: ConductorState) => set((prev) => {
        // Update analytics
        const newAnalytics = { ...prev.analytics };
        
        // Update mood distribution
        const moodCount = newAnalytics.moodDistribution.get(state.conductorMood) || 0;
        newAnalytics.moodDistribution.set(state.conductorMood, moodCount + 1);
        
        return {
          currentState: state,
          cycleNumber: state.cycleNumber,
          conductorMood: state.conductorMood,
          analytics: newAnalytics,
        };
      }),
      
      recordCycleResult: (result: CycleResult) => set((prev) => {
        const historyEntry: OrchestrationHistory = {
          cycleNumber: result.cycleNumber,
          result,
          timestamp: result.timestamp,
        };
        
        const newHistory = [...prev.orchestrationHistory, historyEntry];
        if (newHistory.length > prev.maxOrchestrationHistory) {
          newHistory.shift();
        }
        
        // Update analytics
        const newAnalytics = { ...prev.analytics };
        newAnalytics.totalCycles++;
        
        if (result.success) {
          newAnalytics.successfulCycles++;
        } else {
          newAnalytics.failedCycles++;
        }
        
        // Update average cycle time
        newAnalytics.avgCycleTime =
          (prev.analytics.avgCycleTime * (newAnalytics.totalCycles - 1) + result.duration) /
          newAnalytics.totalCycles;
        
        // Update directives count
        newAnalytics.totalDirectivesIssued += result.directivesIssued;
        newAnalytics.avgDirectivesPerCycle =
          newAnalytics.totalDirectivesIssued / newAnalytics.totalCycles;
        
        // Update system health average
        const systemHealth = result.state.subsystemHealth.overall;
        newAnalytics.avgSystemHealth =
          (prev.analytics.avgSystemHealth * (newAnalytics.totalCycles - 1) + systemHealth) /
          newAnalytics.totalCycles;
        
        // Update market condition distribution
        const conditionCount = newAnalytics.marketConditionDistribution.get(result.marketCondition) || 0;
        newAnalytics.marketConditionDistribution.set(result.marketCondition, conditionCount + 1);
        
        return {
          orchestrationHistory: newHistory,
          analytics: newAnalytics,
        };
      }),
      
      updateSubsystemHealth: (health: AllSubsystemsHealth) => set((prev) => {
        const newHealthHistory = new Map(prev.subsystemHealthHistory);
        
        // Update history for each subsystem
        health.subsystems.forEach((subsystemHealth, name) => {
          const history = newHealthHistory.get(name) || [];
          history.push(subsystemHealth);
          
          if (history.length > prev.maxHealthHistory) {
            history.shift();
          }
          
          newHealthHistory.set(name, history);
        });
        
        return {
          subsystemHealth: health,
          subsystemHealthHistory: newHealthHistory,
        };
      }),
      
      recordDirective: (directive: OrchestrationDirective) => set((prev) => {
        const newHistory = [...prev.directiveHistory, directive];
        if (newHistory.length > prev.maxDirectiveHistory) {
          newHistory.shift();
        }
        
        return {
          directiveHistory: newHistory,
        };
      }),
      
      recordDirectives: (directives: OrchestrationDirective[]) => set((prev) => {
        const newHistory = [...prev.directiveHistory, ...directives];
        
        // Trim to max size
        while (newHistory.length > prev.maxDirectiveHistory) {
          newHistory.shift();
        }
        
        return {
          lastDirectives: directives,
          directiveHistory: newHistory,
        };
      }),
      
      // ==========================================================================
      // Profile Management
      // ==========================================================================
      
      setActiveProfile: (profile: ConductorProfile) => set({
        activeProfile: profile,
      }),
      
      setAutoCycleActive: (active: boolean) => set({
        isAutoCycleActive: active,
      }),
      
      setAutoCycleInterval: (interval: number) => set({
        autoCycleInterval: interval,
      }),
      
      // ==========================================================================
      // Snapshots
      // ==========================================================================
      
      createSnapshot: () => set((prev) => {
        if (!prev.currentState) return prev;
        
        const snapshot: ConductorSnapshot = {
          timestamp: Date.now(),
          cycleNumber: prev.currentState.cycleNumber,
          conductorMood: prev.currentState.conductorMood,
          marketCondition: prev.currentState.marketState.condition,
          systemHealth: prev.currentState.subsystemHealth.overall,
          directivesIssued: prev.currentState.directives.length,
          cycleTime: prev.currentState.averageCycleTime,
        };
        
        const newSnapshots = [...prev.snapshots, snapshot];
        if (newSnapshots.length > prev.maxSnapshots) {
          newSnapshots.shift();
        }
        
        return { snapshots: newSnapshots };
      }),
      
      // ==========================================================================
      // Queries
      // ==========================================================================
      
      getRecentCycles: (count: number) => {
        const history = get().orchestrationHistory;
        return history.slice(-count);
      },
      
      getRecentDirectives: (count: number) => {
        const history = get().directiveHistory;
        return history.slice(-count);
      },
      
      getSubsystemHealthHistory: (subsystem: string, count: number) => {
        const history = get().subsystemHealthHistory.get(subsystem) || [];
        return history.slice(-count);
      },
      
      // ==========================================================================
      // Insights
      // ==========================================================================
      
      getConductorInsights: () => {
        const state = get();
        const { analytics, currentState, subsystemHealth } = state;
        
        const strengths: string[] = [];
        const weaknesses: string[] = [];
        const recommendations: string[] = [];
        
        // Calculate overall performance (0-100)
        let performance = 70; // Base score
        
        // Success rate
        const successRate = analytics.totalCycles > 0
          ? (analytics.successfulCycles / analytics.totalCycles) * 100
          : 0;
        
        if (successRate >= 95) {
          performance += 10;
          strengths.push('Excellent cycle success rate');
        } else if (successRate < 80) {
          performance -= 15;
          weaknesses.push('Low cycle success rate');
          recommendations.push('Review cycle failure logs');
        }
        
        // Cycle time
        if (analytics.avgCycleTime < 200) {
          performance += 5;
          strengths.push('Fast cycle execution');
        } else if (analytics.avgCycleTime > 500) {
          performance -= 10;
          weaknesses.push('Slow cycle execution');
          recommendations.push('Optimize subsystem performance');
        }
        
        // System health
        if (analytics.avgSystemHealth >= 80) {
          performance += 10;
          strengths.push('Strong subsystem health');
        } else if (analytics.avgSystemHealth < 60) {
          performance -= 15;
          weaknesses.push('Poor subsystem health');
          recommendations.push('Address subsystem issues immediately');
        }
        
        // Directives efficiency
        if (analytics.avgDirectivesPerCycle > 0 && analytics.avgDirectivesPerCycle < 10) {
          performance += 5;
          strengths.push('Efficient directive management');
        } else if (analytics.avgDirectivesPerCycle > 15) {
          performance -= 5;
          weaknesses.push('High directive volume');
          recommendations.push('Consolidate similar directives');
        }
        
        // Current state checks
        if (currentState) {
          if (currentState.systemLoad > 85) {
            performance -= 10;
            weaknesses.push('High system load');
            recommendations.push('Reduce activity or scale infrastructure');
          }
          
          if (currentState.marketState.threats > 70) {
            recommendations.push('Consider defensive positioning');
          }
          
          if (currentState.marketState.opportunities > 70 && currentState.conductorMood === 'CONSERVATIVE') {
            recommendations.push('High opportunities available - consider increasing activity');
          }
        }
        
        // Subsystem health checks
        if (subsystemHealth) {
          if (subsystemHealth.criticalIssues.length > 0) {
            performance -= 20;
            weaknesses.push(`${subsystemHealth.criticalIssues.length} critical subsystem issues`);
            recommendations.push('Address critical subsystem issues immediately');
          }
        }
        
        // Determine grade
        let grade: string;
        if (performance >= 90) grade = 'A';
        else if (performance >= 80) grade = 'B';
        else if (performance >= 70) grade = 'C';
        else if (performance >= 60) grade = 'D';
        else grade = 'F';
        
        return {
          overallPerformance: Math.max(0, Math.min(100, performance)),
          grade,
          strengths,
          weaknesses,
          recommendations,
        };
      },
      
      // ==========================================================================
      // Reset
      // ==========================================================================
      
      reset: () => set({
        currentState: null,
        cycleNumber: 0,
        conductorMood: 'BALANCED',
        lastDirectives: [],
        directiveHistory: [],
        subsystemHealth: null,
        subsystemHealthHistory: new Map(),
        orchestrationHistory: [],
        snapshots: [],
        analytics: {
          totalCycles: 0,
          successfulCycles: 0,
          failedCycles: 0,
          avgCycleTime: 0,
          totalDirectivesIssued: 0,
          avgDirectivesPerCycle: 0,
          avgSystemHealth: 0,
          moodDistribution: new Map(),
          marketConditionDistribution: new Map(),
        },
        isAutoCycleActive: false,
      }),
    }),
    {
      name: 'conductor-state',
      // Only persist essential data
      partialize: (state) => ({
        cycleNumber: state.cycleNumber,
        conductorMood: state.conductorMood,
        activeProfile: state.activeProfile,
        orchestrationHistory: state.orchestrationHistory.slice(-50), // Keep last 50
        snapshots: state.snapshots.slice(-100), // Keep last 100
        analytics: state.analytics,
        isAutoCycleActive: state.isAutoCycleActive,
        autoCycleInterval: state.autoCycleInterval,
      }),
    }
  )
);

export default useConductorState;
