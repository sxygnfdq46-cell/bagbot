/**
 * GDS State - Global Decision Superhighway State Management
 * 
 * Manages persistent state for signal routing, decisions, and performance metrics.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SignalType, SignalTier, EngineName } from '@/app/lib/decision/GDSTopology';
import { SignalPayload, FinalDecision, EngineResponse } from '@/app/lib/decision/GDSRouter';

/**
 * Signal in backlog
 */
interface BacklogSignal {
  id: string;
  payload: SignalPayload;
  tier: SignalTier;
  queuedAt: number;
  priority: number;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

/**
 * Routing performance for an engine
 */
interface EnginePerformance {
  engine: EngineName;
  totalRequests: number;
  successfulResponses: number;
  failedResponses: number;
  timeouts: number;
  avgResponseTime: number;
  lastResponseTime: number;
  approvalRate: number;    // % of times engine approved
  avgConfidence: number;   // Average confidence score
  lastActive: number;      // Timestamp of last activity
}

/**
 * Decision history entry
 */
interface DecisionHistory {
  decision: FinalDecision;
  signal: SignalPayload;
  timestamp: number;
}

/**
 * Performance snapshot
 */
interface PerformanceSnapshot {
  timestamp: number;
  totalSignals: number;
  tier1Signals: number;
  tier2Signals: number;
  tier3Signals: number;
  avgProcessingTime: number;
  timeouts: number;
  consensusFailures: number;
  successRate: number;
}

/**
 * GDS State Interface
 */
interface GDSState {
  // Signal backlog
  signalBacklog: BacklogSignal[];
  backlogSize: number;
  maxBacklogSize: number;
  
  // Routing performance
  enginePerformance: Map<EngineName, EnginePerformance>;
  routingPerformance: {
    totalSignals: number;
    tier1Signals: number;
    tier2Signals: number;
    tier3Signals: number;
    avgProcessingTime: number;
    timeouts: number;
    consensusFailures: number;
  };
  
  // Decision history
  lastDecision: FinalDecision | null;
  decisionHistory: DecisionHistory[];
  maxHistorySize: number;
  
  // Engine response tracking
  engineResponseMap: Map<string, EngineResponse[]>; // signalId -> responses
  
  // Performance snapshots
  performanceSnapshots: PerformanceSnapshot[];
  maxSnapshots: number;
  
  // Analytics
  analytics: {
    totalDecisions: number;
    approvedDecisions: number;
    rejectedDecisions: number;
    modifiedDecisions: number;
    deferredDecisions: number;
    avgConfidence: number;
    consensusRate: number;
    engineReliability: Map<EngineName, number>; // 0-100
  };
  
  // Actions
  addToBacklog: (signal: BacklogSignal) => void;
  removeFromBacklog: (signalId: string) => void;
  updateBacklogStatus: (signalId: string, status: BacklogSignal['status']) => void;
  clearBacklog: () => void;
  
  recordDecision: (decision: FinalDecision, signal: SignalPayload) => void;
  updateEnginePerformance: (engine: EngineName, response: EngineResponse, success: boolean) => void;
  recordEngineResponses: (signalId: string, responses: EngineResponse[]) => void;
  
  updateRoutingPerformance: (stats: Partial<GDSState['routingPerformance']>) => void;
  createPerformanceSnapshot: () => void;
  
  getBacklogByTier: (tier: SignalTier) => BacklogSignal[];
  getEnginePerformance: (engine: EngineName) => EnginePerformance | undefined;
  getRecentDecisions: (count: number) => DecisionHistory[];
  getDecisionsByType: (type: SignalType) => DecisionHistory[];
  
  getPerformanceSummary: () => {
    overallHealth: number;
    grade: string;
    issues: string[];
    strengths: string[];
    recommendations: string[];
  };
  
  reset: () => void;
}

/**
 * Create GDS State Store
 */
export const useGDSState = create<GDSState>()(
  persist(
    (set, get) => ({
      // Initial state
      signalBacklog: [],
      backlogSize: 0,
      maxBacklogSize: 100,
      
      enginePerformance: new Map(),
      routingPerformance: {
        totalSignals: 0,
        tier1Signals: 0,
        tier2Signals: 0,
        tier3Signals: 0,
        avgProcessingTime: 0,
        timeouts: 0,
        consensusFailures: 0,
      },
      
      lastDecision: null,
      decisionHistory: [],
      maxHistorySize: 500,
      
      engineResponseMap: new Map(),
      
      performanceSnapshots: [],
      maxSnapshots: 300,
      
      analytics: {
        totalDecisions: 0,
        approvedDecisions: 0,
        rejectedDecisions: 0,
        modifiedDecisions: 0,
        deferredDecisions: 0,
        avgConfidence: 0,
        consensusRate: 0,
        engineReliability: new Map(),
      },
      
      // ==========================================================================
      // Backlog Management
      // ==========================================================================
      
      addToBacklog: (signal: BacklogSignal) => set((state) => {
        const newBacklog = [...state.signalBacklog, signal];
        
        // Enforce max size
        if (newBacklog.length > state.maxBacklogSize) {
          newBacklog.shift(); // Remove oldest
        }
        
        return {
          signalBacklog: newBacklog,
          backlogSize: newBacklog.length,
        };
      }),
      
      removeFromBacklog: (signalId: string) => set((state) => {
        const newBacklog = state.signalBacklog.filter(s => s.id !== signalId);
        return {
          signalBacklog: newBacklog,
          backlogSize: newBacklog.length,
        };
      }),
      
      updateBacklogStatus: (signalId: string, status: BacklogSignal['status']) => set((state) => {
        const newBacklog = state.signalBacklog.map(s =>
          s.id === signalId ? { ...s, status } : s
        );
        return { signalBacklog: newBacklog };
      }),
      
      clearBacklog: () => set({
        signalBacklog: [],
        backlogSize: 0,
      }),
      
      // ==========================================================================
      // Decision Recording
      // ==========================================================================
      
      recordDecision: (decision: FinalDecision, signal: SignalPayload) => set((state) => {
        const historyEntry: DecisionHistory = {
          decision,
          signal,
          timestamp: Date.now(),
        };
        
        const newHistory = [...state.decisionHistory, historyEntry];
        if (newHistory.length > state.maxHistorySize) {
          newHistory.shift();
        }
        
        // Update analytics
        const newAnalytics = { ...state.analytics };
        newAnalytics.totalDecisions++;
        
        if (decision.decision === 'APPROVE') newAnalytics.approvedDecisions++;
        else if (decision.decision === 'REJECT') newAnalytics.rejectedDecisions++;
        else if (decision.decision === 'MODIFY') newAnalytics.modifiedDecisions++;
        else if (decision.decision === 'DEFER') newAnalytics.deferredDecisions++;
        
        // Update average confidence
        const totalDec = newAnalytics.totalDecisions;
        newAnalytics.avgConfidence = 
          (state.analytics.avgConfidence * (totalDec - 1) + decision.confidence) / totalDec;
        
        // Update consensus rate
        const consensusCount = decision.consensus ? 1 : 0;
        newAnalytics.consensusRate =
          (state.analytics.consensusRate * (totalDec - 1) + (consensusCount * 100)) / totalDec;
        
        return {
          lastDecision: decision,
          decisionHistory: newHistory,
          analytics: newAnalytics,
        };
      }),
      
      // ==========================================================================
      // Engine Performance
      // ==========================================================================
      
      updateEnginePerformance: (engine: EngineName, response: EngineResponse, success: boolean) => set((state) => {
        const perfMap = new Map(state.enginePerformance);
        const existing = perfMap.get(engine);
        
        if (existing) {
          // Update existing
          const totalRequests = existing.totalRequests + 1;
          const successfulResponses = success ? existing.successfulResponses + 1 : existing.successfulResponses;
          const failedResponses = success ? existing.failedResponses : existing.failedResponses + 1;
          const timeouts = response.processingTime >= 1000 ? existing.timeouts + 1 : existing.timeouts;
          
          const avgResponseTime = 
            (existing.avgResponseTime * existing.totalRequests + response.processingTime) / totalRequests;
          
          const approvalRate =
            (existing.approvalRate * existing.totalRequests + (response.approved ? 100 : 0)) / totalRequests;
          
          const avgConfidence =
            (existing.avgConfidence * existing.totalRequests + response.confidence) / totalRequests;
          
          perfMap.set(engine, {
            ...existing,
            totalRequests,
            successfulResponses,
            failedResponses,
            timeouts,
            avgResponseTime,
            lastResponseTime: response.processingTime,
            approvalRate,
            avgConfidence,
            lastActive: Date.now(),
          });
        } else {
          // Create new
          perfMap.set(engine, {
            engine,
            totalRequests: 1,
            successfulResponses: success ? 1 : 0,
            failedResponses: success ? 0 : 1,
            timeouts: response.processingTime >= 1000 ? 1 : 0,
            avgResponseTime: response.processingTime,
            lastResponseTime: response.processingTime,
            approvalRate: response.approved ? 100 : 0,
            avgConfidence: response.confidence,
            lastActive: Date.now(),
          });
        }
        
        // Update engine reliability in analytics
        const reliability = perfMap.get(engine)!;
        const reliabilityScore = 
          (reliability.successfulResponses / reliability.totalRequests) * 100;
        
        const newAnalytics = { ...state.analytics };
        newAnalytics.engineReliability.set(engine, reliabilityScore);
        
        return {
          enginePerformance: perfMap,
          analytics: newAnalytics,
        };
      }),
      
      recordEngineResponses: (signalId: string, responses: EngineResponse[]) => set((state) => {
        const responseMap = new Map(state.engineResponseMap);
        responseMap.set(signalId, responses);
        
        // Keep only last 100 signal responses
        if (responseMap.size > 100) {
          const firstKey = responseMap.keys().next().value;
          responseMap.delete(firstKey);
        }
        
        return { engineResponseMap: responseMap };
      }),
      
      // ==========================================================================
      // Routing Performance
      // ==========================================================================
      
      updateRoutingPerformance: (stats: Partial<GDSState['routingPerformance']>) => set((state) => ({
        routingPerformance: {
          ...state.routingPerformance,
          ...stats,
        },
      })),
      
      createPerformanceSnapshot: () => set((state) => {
        const { routingPerformance, analytics } = state;
        
        const snapshot: PerformanceSnapshot = {
          timestamp: Date.now(),
          totalSignals: routingPerformance.totalSignals,
          tier1Signals: routingPerformance.tier1Signals,
          tier2Signals: routingPerformance.tier2Signals,
          tier3Signals: routingPerformance.tier3Signals,
          avgProcessingTime: routingPerformance.avgProcessingTime,
          timeouts: routingPerformance.timeouts,
          consensusFailures: routingPerformance.consensusFailures,
          successRate: analytics.totalDecisions > 0
            ? ((analytics.approvedDecisions + analytics.modifiedDecisions) / analytics.totalDecisions) * 100
            : 0,
        };
        
        const newSnapshots = [...state.performanceSnapshots, snapshot];
        if (newSnapshots.length > state.maxSnapshots) {
          newSnapshots.shift();
        }
        
        return { performanceSnapshots: newSnapshots };
      }),
      
      // ==========================================================================
      // Queries
      // ==========================================================================
      
      getBacklogByTier: (tier: SignalTier) => {
        return get().signalBacklog.filter(s => s.tier === tier);
      },
      
      getEnginePerformance: (engine: EngineName) => {
        return get().enginePerformance.get(engine);
      },
      
      getRecentDecisions: (count: number) => {
        const history = get().decisionHistory;
        return history.slice(-count);
      },
      
      getDecisionsByType: (type: SignalType) => {
        return get().decisionHistory.filter(h => h.signal.type === type);
      },
      
      // ==========================================================================
      // Performance Summary
      // ==========================================================================
      
      getPerformanceSummary: () => {
        const state = get();
        const { routingPerformance, analytics, enginePerformance } = state;
        
        const issues: string[] = [];
        const strengths: string[] = [];
        const recommendations: string[] = [];
        
        // Calculate overall health (0-100)
        let healthScore = 100;
        
        // Check processing time
        if (routingPerformance.avgProcessingTime > 500) {
          healthScore -= 20;
          issues.push('High average processing time (>500ms)');
          recommendations.push('Optimize engine response times or adjust timeouts');
        } else if (routingPerformance.avgProcessingTime < 200) {
          strengths.push('Excellent processing time (<200ms)');
        }
        
        // Check timeout rate
        const timeoutRate = routingPerformance.totalSignals > 0
          ? (routingPerformance.timeouts / routingPerformance.totalSignals) * 100
          : 0;
        
        if (timeoutRate > 10) {
          healthScore -= 25;
          issues.push(`High timeout rate (${timeoutRate.toFixed(1)}%)`);
          recommendations.push('Increase engine timeout thresholds or reduce load');
        } else if (timeoutRate < 2) {
          strengths.push('Low timeout rate');
        }
        
        // Check consensus rate
        if (analytics.consensusRate < 60) {
          healthScore -= 15;
          issues.push('Low consensus rate among engines');
          recommendations.push('Review engine configurations and signal routing rules');
        } else if (analytics.consensusRate > 85) {
          strengths.push('High consensus rate');
        }
        
        // Check confidence
        if (analytics.avgConfidence < 50) {
          healthScore -= 15;
          issues.push('Low average decision confidence');
          recommendations.push('Improve engine algorithms or data quality');
        } else if (analytics.avgConfidence > 75) {
          strengths.push('High average confidence');
        }
        
        // Check backlog
        const backlogUtilization = (state.backlogSize / state.maxBacklogSize) * 100;
        if (backlogUtilization > 80) {
          healthScore -= 10;
          issues.push('Signal backlog near capacity');
          recommendations.push('Increase processing capacity or backlog size');
        }
        
        // Check engine reliability
        let lowReliabilityEngines = 0;
        enginePerformance.forEach((perf, engine) => {
          const reliability = (perf.successfulResponses / perf.totalRequests) * 100;
          if (reliability < 70) {
            lowReliabilityEngines++;
            issues.push(`Low reliability for ${engine} (${reliability.toFixed(1)}%)`);
          }
        });
        
        if (lowReliabilityEngines > 0) {
          healthScore -= lowReliabilityEngines * 5;
          recommendations.push('Investigate and fix unreliable engines');
        }
        
        // Determine grade
        let grade: string;
        if (healthScore >= 90) grade = 'A';
        else if (healthScore >= 80) grade = 'B';
        else if (healthScore >= 70) grade = 'C';
        else if (healthScore >= 60) grade = 'D';
        else grade = 'F';
        
        return {
          overallHealth: Math.max(0, healthScore),
          grade,
          issues,
          strengths,
          recommendations,
        };
      },
      
      // ==========================================================================
      // Reset
      // ==========================================================================
      
      reset: () => set({
        signalBacklog: [],
        backlogSize: 0,
        enginePerformance: new Map(),
        routingPerformance: {
          totalSignals: 0,
          tier1Signals: 0,
          tier2Signals: 0,
          tier3Signals: 0,
          avgProcessingTime: 0,
          timeouts: 0,
          consensusFailures: 0,
        },
        lastDecision: null,
        decisionHistory: [],
        engineResponseMap: new Map(),
        performanceSnapshots: [],
        analytics: {
          totalDecisions: 0,
          approvedDecisions: 0,
          rejectedDecisions: 0,
          modifiedDecisions: 0,
          deferredDecisions: 0,
          avgConfidence: 0,
          consensusRate: 0,
          engineReliability: new Map(),
        },
      }),
    }),
    {
      name: 'gds-state',
      // Only persist essential data
      partialize: (state) => ({
        decisionHistory: state.decisionHistory.slice(-50), // Keep last 50
        performanceSnapshots: state.performanceSnapshots.slice(-20), // Keep last 20
        analytics: state.analytics,
      }),
    }
  )
);

export default useGDSState;
