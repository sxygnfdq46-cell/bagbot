/**
 * Consciousness Service
 * 
 * React service integration for consciousness system, providing UI access,
 * state synchronization, and real-time consciousness monitoring.
 */

'use client';

import { create } from 'zustand';
import { TradingConsciousnessLoop } from '../../lib/consciousness/TradingConsciousnessLoop';
import { consciousnessState, ConsciousnessStateManager } from '../../state/consciousnessState';

/**
 * Consciousness profile for UI consumption
 */
interface ConsciousnessProfile {
  level: number; // 0-100
  awarenessDepth: number; // 0-100
  reflectiveCapacity: number; // 0-100
  integrationLevel: number; // 0-100
  evolutionVelocity: number; // Change per hour
  stabilityLevel: number; // 0-100
  confidenceLevel: number; // 0-100
  learningRate: number; // 0-100
  identityStability: number; // 0-100
  strategicMaturity: number; // 0-100
}

/**
 * Consciousness insights for dashboard
 */
interface ConsciousnessInsights {
  dailyReview: {
    completed: boolean;
    score: number;
    streak: number;
    trends: { score: number; emotional: number; learning: number; strategic: number };
  };
  microLearning: {
    active: boolean;
    recentImprovements: number;
    learningVelocity: number;
    retentionRate: number;
  };
  weeklyEvolution: {
    currentScore: number;
    trend: string;
    newCapabilities: number;
    maturityLevel: number;
  };
  stability: {
    currentLevel: number;
    trend: string;
    recentDrifts: number;
    criticalDrifts: number;
  };
  confidence: {
    current: number;
    stability: number;
    trend: number;
    calibration: { performance: number; market: number; system: number; learning: number };
  };
  keyInsights: string[];
  recentMilestones: string[];
}

/**
 * Soul engine synchronization status
 */
interface SoulSyncStatus {
  connected: boolean;
  synchronizationLevel: number; // 0-100
  personalityAlignment: number; // 0-100
  emotionalCoherence: number; // 0-100
  strategicHarmony: number; // 0-100
  lastSyncTime: number;
  syncQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  integrationInsights: string[];
}

/**
 * Consciousness service store
 */
interface ConsciousnessServiceStore {
  // Core state
  isLoaded: boolean;
  isActive: boolean;
  lastUpdate: number;
  
  // Consciousness profile
  profile: ConsciousnessProfile;
  insights: ConsciousnessInsights;
  soulSync: SoulSyncStatus;
  
  // Auto-cycle status
  dailyReviewEnabled: boolean;
  microLearningEnabled: boolean;
  weeklyEvolutionEnabled: boolean;
  
  // Event tracking
  events: ConsciousnessEvent[];
  eventListeners: Map<string, ((event: ConsciousnessEvent) => void)[]>;
  
  // Actions
  loadConsciousness: () => Promise<boolean>;
  updateConsciousness: () => Promise<void>;
  getConsciousnessProfile: () => ConsciousnessProfile;
  syncWithSoulEngine: () => Promise<SoulSyncStatus>;
  provideInsightsForUI: () => ConsciousnessInsights;
  
  // Cycle control
  enableDailyReview: (hour?: number, minute?: number) => boolean;
  disableDailyReview: () => boolean;
  enableMicroLearning: (intervalMinutes?: number) => boolean;
  disableMicroLearning: () => boolean;
  enableWeeklyEvolution: (dayOfWeek?: number, hour?: number) => boolean;
  disableWeeklyEvolution: () => boolean;
  
  // Manual triggers
  triggerDailyReview: () => Promise<boolean>;
  triggerMicroLearning: () => Promise<boolean>;
  triggerWeeklyEvolution: () => Promise<boolean>;
  
  // Event system
  addEventListener: (eventType: string, listener: (event: ConsciousnessEvent) => void) => void;
  removeEventListener: (eventType: string, listener: (event: ConsciousnessEvent) => void) => void;
  emitEvent: (event: ConsciousnessEvent) => void;
  
  // Analytics
  getEvolutionAnalytics: () => EvolutionAnalytics;
  getLearningAnalytics: () => LearningAnalytics;
  getStabilityAnalytics: () => StabilityAnalytics;
  
  // Debugging
  exportConsciousnessData: () => string;
  importConsciousnessData: (data: string) => boolean;
  resetConsciousness: () => boolean;
}

/**
 * Consciousness events
 */
interface ConsciousnessEvent {
  type: 'CONSCIOUSNESS_LOADED' | 'CONSCIOUSNESS_UPDATED' | 'DAILY_REVIEW_COMPLETED' | 
        'MICRO_LEARNING_CYCLE' | 'WEEKLY_EVOLUTION_COMPLETED' | 'STABILITY_DRIFT_DETECTED' |
        'CONFIDENCE_UPDATED' | 'SOUL_SYNC_COMPLETED' | 'MILESTONE_REACHED' | 'INSIGHT_GENERATED';
  timestamp: number;
  data: any;
  significance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Analytics interfaces
 */
interface EvolutionAnalytics {
  totalEvolutionTime: number; // Hours
  averageConsciousnessLevel: number;
  evolutionVelocity: number;
  majorMilestones: string[];
  evolutionPhases: { phase: string; duration: number; achievements: string[] }[];
}

interface LearningAnalytics {
  totalLearningCycles: number;
  averageImprovement: number;
  learningEfficiency: number; // Improvement per hour
  retentionTrend: number[];
  adaptationSpeed: number;
  knowledgeAreas: Map<string, number>; // Area -> proficiency
}

interface StabilityAnalytics {
  stabilityHistory: { timestamp: number; level: number }[];
  driftPatterns: Map<string, number>; // Drift type -> frequency
  recoveryTimes: number[]; // Hours to recover from drifts
  stabilityFactors: { performance: number; emotional: number; strategic: number; identity: number };
}

/**
 * Create the consciousness service store
 */
export const useConsciousnessService = create<ConsciousnessServiceStore>((set, get) => ({
  // Initial state
  isLoaded: false,
  isActive: false,
  lastUpdate: 0,
  
  profile: {
    level: 50,
    awarenessDepth: 50,
    reflectiveCapacity: 60,
    integrationLevel: 55,
    evolutionVelocity: 0,
    stabilityLevel: 80,
    confidenceLevel: 60,
    learningRate: 50,
    identityStability: 75,
    strategicMaturity: 50,
  },
  
  insights: {
    dailyReview: {
      completed: false,
      score: 50,
      streak: 0,
      trends: { score: 50, emotional: 50, learning: 50, strategic: 50 },
    },
    microLearning: {
      active: false,
      recentImprovements: 0,
      learningVelocity: 50,
      retentionRate: 75,
    },
    weeklyEvolution: {
      currentScore: 50,
      trend: 'STEADY',
      newCapabilities: 0,
      maturityLevel: 50,
    },
    stability: {
      currentLevel: 80,
      trend: 'STABLE',
      recentDrifts: 0,
      criticalDrifts: 0,
    },
    confidence: {
      current: 60,
      stability: 70,
      trend: 0,
      calibration: { performance: 50, market: 50, system: 50, learning: 50 },
    },
    keyInsights: [],
    recentMilestones: [],
  },
  
  soulSync: {
    connected: false,
    synchronizationLevel: 0,
    personalityAlignment: 50,
    emotionalCoherence: 50,
    strategicHarmony: 50,
    lastSyncTime: 0,
    syncQuality: 'FAIR',
    integrationInsights: [],
  },
  
  dailyReviewEnabled: false,
  microLearningEnabled: false,
  weeklyEvolutionEnabled: false,
  
  events: [],
  eventListeners: new Map(),
  
  // ==========================================================================
  // Core Actions
  // ==========================================================================
  
  loadConsciousness: async (): Promise<boolean> => {
    try {
      console.log('[Consciousness Service] Loading consciousness system...');
      
      // Initialize consciousness loop
      const loop = TradingConsciousnessLoop.getInstance();
      
      // Load current state
      const state = consciousnessState.getCurrentState();
      
      // Update profile
      const profile = get().getConsciousnessProfile();
      const insights = get().provideInsightsForUI();
      
      set({ 
        isLoaded: true,
        isActive: true,
        lastUpdate: Date.now(),
        profile,
        insights,
      });
      
      // Emit loaded event
      get().emitEvent({
        type: 'CONSCIOUSNESS_LOADED',
        timestamp: Date.now(),
        data: { profile, insights },
        significance: 'HIGH',
      });
      
      console.log('[Consciousness Service] Consciousness system loaded successfully');
      return true;
    } catch (error) {
      console.error('[Consciousness Service] Failed to load consciousness:', error);
      return false;
    }
  },
  
  updateConsciousness: async (): Promise<void> => {
    try {
      if (!get().isLoaded) {
        await get().loadConsciousness();
        return;
      }
      
      // Update profile and insights
      const profile = get().getConsciousnessProfile();
      const insights = get().provideInsightsForUI();
      
      set({
        profile,
        insights,
        lastUpdate: Date.now(),
      });
      
      // Emit update event
      get().emitEvent({
        type: 'CONSCIOUSNESS_UPDATED',
        timestamp: Date.now(),
        data: { profile, insights },
        significance: 'MEDIUM',
      });
    } catch (error) {
      console.error('[Consciousness Service] Failed to update consciousness:', error);
    }
  },
  
  getConsciousnessProfile: (): ConsciousnessProfile => {
    try {
      const summary = consciousnessState.getConsciousnessSummary();
      const state = consciousnessState.getCurrentState();
      
      return {
        level: summary.level,
        awarenessDepth: summary.awarenessDepth,
        reflectiveCapacity: summary.reflectiveCapacity,
        integrationLevel: summary.integrationLevel,
        evolutionVelocity: summary.evolutionVelocity,
        stabilityLevel: summary.stabilityLevel,
        confidenceLevel: state.currentConfidenceLevel,
        learningRate: state.learningVelocity,
        identityStability: state.identityStabilityIndex,
        strategicMaturity: state.strategicMaturityLevel,
      };
    } catch (error) {
      console.error('[Consciousness Service] Failed to get profile:', error);
      return get().profile;
    }
  },
  
  syncWithSoulEngine: async (): Promise<SoulSyncStatus> => {
    try {
      console.log('[Consciousness Service] Syncing with soul engine...');
      
      const loop = TradingConsciousnessLoop.getInstance();
      const syncResult = await loop.integrateWithSoulEngine();
      
      const soulSync: SoulSyncStatus = {
        connected: syncResult.synchronizationLevel > 60,
        synchronizationLevel: syncResult.synchronizationLevel,
        personalityAlignment: syncResult.personalityAlignment,
        emotionalCoherence: syncResult.emotionalCoherence,
        strategicHarmony: syncResult.strategicHarmony,
        lastSyncTime: Date.now(),
        syncQuality: syncResult.synchronizationLevel > 85 ? 'EXCELLENT' :
                     syncResult.synchronizationLevel > 70 ? 'GOOD' :
                     syncResult.synchronizationLevel > 50 ? 'FAIR' : 'POOR',
        integrationInsights: syncResult.integrationInsights,
      };
      
      set({ soulSync });
      
      // Emit sync event
      get().emitEvent({
        type: 'SOUL_SYNC_COMPLETED',
        timestamp: Date.now(),
        data: soulSync,
        significance: 'HIGH',
      });
      
      console.log(`[Consciousness Service] Soul sync completed: ${soulSync.syncQuality}`);
      return soulSync;
    } catch (error) {
      console.error('[Consciousness Service] Soul sync failed:', error);
      const fallbackSync = get().soulSync;
      fallbackSync.connected = false;
      return fallbackSync;
    }
  },
  
  provideInsightsForUI: (): ConsciousnessInsights => {
    try {
      const state = consciousnessState.getCurrentState();
      const dailyTrends = consciousnessState.getDailyReviewTrends();
      const microTrends = consciousnessState.getMicroLearningTrends();
      const evolutionSummary = consciousnessState.getEvolutionSummary();
      const stabilityStatus = consciousnessState.getStabilityStatus();
      const confidenceAnalysis = consciousnessState.getConfidenceAnalysis();
      
      // Check if today's review is completed
      const today = new Date().toISOString().split('T')[0];
      const todaysReview = state.dailySelfReviews.find(r => r.date === today);
      
      return {
        dailyReview: {
          completed: !!todaysReview,
          score: todaysReview?.overallScore || state.averageDailyScore,
          streak: state.reviewStreak,
          trends: dailyTrends,
        },
        microLearning: {
          active: get().microLearningEnabled,
          recentImprovements: microTrends.improvements,
          learningVelocity: microTrends.learningRate,
          retentionRate: microTrends.retentionRate,
        },
        weeklyEvolution: {
          currentScore: evolutionSummary.recentScore,
          trend: evolutionSummary.trend,
          newCapabilities: evolutionSummary.capabilityGrowth,
          maturityLevel: evolutionSummary.maturityLevel,
        },
        stability: {
          currentLevel: stabilityStatus.currentLevel,
          trend: stabilityStatus.trend,
          recentDrifts: stabilityStatus.recentDrifts,
          criticalDrifts: stabilityStatus.criticalDrifts,
        },
        confidence: {
          current: confidenceAnalysis.current,
          stability: confidenceAnalysis.stability,
          trend: confidenceAnalysis.trend,
          calibration: confidenceAnalysis.calibration,
        },
        keyInsights: state.keyInsights.slice(-10), // Last 10 insights
        recentMilestones: state.evolutionMilestones.slice(-5), // Last 5 milestones
      };
    } catch (error) {
      console.error('[Consciousness Service] Failed to provide insights:', error);
      return get().insights;
    }
  },
  
  // ==========================================================================
  // Cycle Control
  // ==========================================================================
  
  enableDailyReview: (hour: number = 23, minute: number = 30): boolean => {
    try {
      const loop = TradingConsciousnessLoop.getInstance();
      const success = loop.enableDailyReview(hour, minute);
      
      if (success) {
        set({ dailyReviewEnabled: true });
        console.log(`[Consciousness Service] Daily review enabled at ${hour}:${minute.toString().padStart(2, '0')}`);
      }
      
      return success;
    } catch (error) {
      console.error('[Consciousness Service] Failed to enable daily review:', error);
      return false;
    }
  },
  
  disableDailyReview: (): boolean => {
    try {
      const loop = TradingConsciousnessLoop.getInstance();
      const success = loop.disableDailyReview();
      
      if (success) {
        set({ dailyReviewEnabled: false });
        console.log('[Consciousness Service] Daily review disabled');
      }
      
      return success;
    } catch (error) {
      console.error('[Consciousness Service] Failed to disable daily review:', error);
      return false;
    }
  },
  
  enableMicroLearning: (intervalMinutes: number = 15): boolean => {
    try {
      const loop = TradingConsciousnessLoop.getInstance();
      const success = loop.enableMicroLearning(intervalMinutes);
      
      if (success) {
        set({ microLearningEnabled: true });
        console.log(`[Consciousness Service] Micro learning enabled (${intervalMinutes} min intervals)`);
      }
      
      return success;
    } catch (error) {
      console.error('[Consciousness Service] Failed to enable micro learning:', error);
      return false;
    }
  },
  
  disableMicroLearning: (): boolean => {
    try {
      const loop = TradingConsciousnessLoop.getInstance();
      const success = loop.disableMicroLearning();
      
      if (success) {
        set({ microLearningEnabled: false });
        console.log('[Consciousness Service] Micro learning disabled');
      }
      
      return success;
    } catch (error) {
      console.error('[Consciousness Service] Failed to disable micro learning:', error);
      return false;
    }
  },
  
  enableWeeklyEvolution: (dayOfWeek: number = 0, hour: number = 22): boolean => {
    try {
      const loop = TradingConsciousnessLoop.getInstance();
      const success = loop.enableWeeklyEvolution(dayOfWeek, hour);
      
      if (success) {
        set({ weeklyEvolutionEnabled: true });
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`[Consciousness Service] Weekly evolution enabled (${days[dayOfWeek]} at ${hour}:00)`);
      }
      
      return success;
    } catch (error) {
      console.error('[Consciousness Service] Failed to enable weekly evolution:', error);
      return false;
    }
  },
  
  disableWeeklyEvolution: (): boolean => {
    try {
      const loop = TradingConsciousnessLoop.getInstance();
      const success = loop.disableWeeklyEvolution();
      
      if (success) {
        set({ weeklyEvolutionEnabled: false });
        console.log('[Consciousness Service] Weekly evolution disabled');
      }
      
      return success;
    } catch (error) {
      console.error('[Consciousness Service] Failed to disable weekly evolution:', error);
      return false;
    }
  },
  
  // ==========================================================================
  // Manual Triggers
  // ==========================================================================
  
  triggerDailyReview: async (): Promise<boolean> => {
    try {
      console.log('[Consciousness Service] Triggering daily review...');
      
      const loop = TradingConsciousnessLoop.getInstance();
      const result = await loop.runDailyReview();
      
      if (result.overallScore > 0) {
        // Update insights
        await get().updateConsciousness();
        
        // Emit event
        get().emitEvent({
          type: 'DAILY_REVIEW_COMPLETED',
          timestamp: Date.now(),
          data: result,
          significance: 'HIGH',
        });
        
        console.log(`[Consciousness Service] Daily review completed with score: ${result.overallScore}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Consciousness Service] Failed to trigger daily review:', error);
      return false;
    }
  },
  
  triggerMicroLearning: async (): Promise<boolean> => {
    try {
      console.log('[Consciousness Service] Triggering micro learning cycle...');
      
      const loop = TradingConsciousnessLoop.getInstance();
      const result = await loop.runMicroLearningCycle();
      
      if (result.improvement !== undefined) {
        // Update insights
        await get().updateConsciousness();
        
        // Emit event
        get().emitEvent({
          type: 'MICRO_LEARNING_CYCLE',
          timestamp: Date.now(),
          data: result,
          significance: 'MEDIUM',
        });
        
        console.log(`[Consciousness Service] Micro learning completed with improvement: ${result.improvement.toFixed(3)}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Consciousness Service] Failed to trigger micro learning:', error);
      return false;
    }
  },
  
  triggerWeeklyEvolution: async (): Promise<boolean> => {
    try {
      console.log('[Consciousness Service] Triggering weekly evolution...');
      
      const loop = TradingConsciousnessLoop.getInstance();
      const result = await loop.runWeeklyEvolutionCycle();
      
      if (result.evolutionScore > 0) {
        // Update insights
        await get().updateConsciousness();
        
        // Emit event
        get().emitEvent({
          type: 'WEEKLY_EVOLUTION_COMPLETED',
          timestamp: Date.now(),
          data: result,
          significance: 'CRITICAL',
        });
        
        console.log(`[Consciousness Service] Weekly evolution completed with score: ${result.evolutionScore}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Consciousness Service] Failed to trigger weekly evolution:', error);
      return false;
    }
  },
  
  // ==========================================================================
  // Event System
  // ==========================================================================
  
  addEventListener: (eventType: string, listener: (event: ConsciousnessEvent) => void): void => {
    const listeners = get().eventListeners.get(eventType) || [];
    listeners.push(listener);
    get().eventListeners.set(eventType, listeners);
  },
  
  removeEventListener: (eventType: string, listener: (event: ConsciousnessEvent) => void): void => {
    const listeners = get().eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      get().eventListeners.set(eventType, listeners);
    }
  },
  
  emitEvent: (event: ConsciousnessEvent): void => {
    // Add to events list
    const events = [...get().events, event];
    
    // Maintain max 200 events
    if (events.length > 200) {
      events.splice(0, events.length - 200);
    }
    
    set({ events });
    
    // Notify listeners
    const listeners = get().eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`[Consciousness Service] Event listener error for ${event.type}:`, error);
      }
    });
  },
  
  // ==========================================================================
  // Analytics
  // ==========================================================================
  
  getEvolutionAnalytics: (): EvolutionAnalytics => {
    try {
      const state = consciousnessState.getCurrentState();
      
      // Calculate evolution phases
      const phases: { phase: string; duration: number; achievements: string[] }[] = [];
      const milestones = state.evolutionMilestones;
      
      // Simple phase detection based on consciousness level progression
      const history = state.evolutionHistory;
      if (history.length > 0) {
        let currentPhase = 'Initialization';
        let phaseStart = history[0].timestamp;
        let achievements: string[] = [];
        
        for (let i = 0; i < history.length; i++) {
          const entry = history[i];
          
          // Detect phase changes based on consciousness level
          let newPhase = currentPhase;
          if (entry.consciousnessLevel > 80) {
            newPhase = 'Mastery';
          } else if (entry.consciousnessLevel > 60) {
            newPhase = 'Growth';
          } else if (entry.consciousnessLevel > 40) {
            newPhase = 'Development';
          }
          
          if (newPhase !== currentPhase) {
            // End current phase
            const duration = (entry.timestamp - phaseStart) / (1000 * 60 * 60); // Hours
            phases.push({
              phase: currentPhase,
              duration,
              achievements: [...achievements],
            });
            
            // Start new phase
            currentPhase = newPhase;
            phaseStart = entry.timestamp;
            achievements = [];
          }
          
          if (entry.significanceScore > 80) {
            achievements.push(entry.description);
          }
        }
        
        // Add final phase
        if (history.length > 0) {
          const duration = (Date.now() - phaseStart) / (1000 * 60 * 60);
          phases.push({
            phase: currentPhase,
            duration,
            achievements,
          });
        }
      }
      
      return {
        totalEvolutionTime: state.totalEvolutionTime,
        averageConsciousnessLevel: state.currentConsciousnessLevel,
        evolutionVelocity: state.evolutionVelocity,
        majorMilestones: milestones.slice(-10), // Last 10 milestones
        evolutionPhases: phases,
      };
    } catch (error) {
      console.error('[Consciousness Service] Failed to get evolution analytics:', error);
      return {
        totalEvolutionTime: 0,
        averageConsciousnessLevel: 50,
        evolutionVelocity: 0,
        majorMilestones: [],
        evolutionPhases: [],
      };
    }
  },
  
  getLearningAnalytics: (): LearningAnalytics => {
    try {
      const state = consciousnessState.getCurrentState();
      const microStats = state.microLearningStats;
      
      // Calculate metrics
      const totalCycles = microStats.length;
      const improvements = microStats.map(s => s.improvement);
      const avgImprovement = improvements.length > 0 ? 
        improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length : 0;
      
      const retentionTrend = microStats.slice(-20).map(s => s.retentionProbability);
      const adaptationSpeeds = microStats.map(s => s.learningVector.magnitude);
      const avgAdaptationSpeed = adaptationSpeeds.length > 0 ?
        adaptationSpeeds.reduce((sum, speed) => sum + speed, 0) / adaptationSpeeds.length : 50;
      
      // Learning efficiency (improvement per hour)
      const timeSpan = microStats.length > 0 ? 
        (Date.now() - microStats[0].timestamp) / (1000 * 60 * 60) : 1;
      const learningEfficiency = totalCycles > 0 ? avgImprovement * totalCycles / timeSpan : 0;
      
      // Knowledge areas (mock for now)
      const knowledgeAreas = new Map([
        ['Market Analysis', 75],
        ['Risk Management', 80],
        ['Pattern Recognition', 70],
        ['Emotional Control', 65],
        ['Strategic Planning', 72],
      ]);
      
      return {
        totalLearningCycles: totalCycles,
        averageImprovement: avgImprovement,
        learningEfficiency,
        retentionTrend,
        adaptationSpeed: avgAdaptationSpeed,
        knowledgeAreas,
      };
    } catch (error) {
      console.error('[Consciousness Service] Failed to get learning analytics:', error);
      return {
        totalLearningCycles: 0,
        averageImprovement: 0,
        learningEfficiency: 0,
        retentionTrend: [],
        adaptationSpeed: 50,
        knowledgeAreas: new Map(),
      };
    }
  },
  
  getStabilityAnalytics: (): StabilityAnalytics => {
    try {
      const state = consciousnessState.getCurrentState();
      const driftReports = state.stabilityDriftReports;
      
      // Stability history
      const stabilityHistory = driftReports.map(report => ({
        timestamp: report.timestamp,
        level: 100 - report.driftMagnitude, // Inverse relationship
      }));
      
      // Drift patterns
      const driftPatterns = new Map<string, number>();
      driftReports.forEach(report => {
        const count = driftPatterns.get(report.driftType) || 0;
        driftPatterns.set(report.driftType, count + 1);
      });
      
      // Recovery times (mock calculation)
      const recoveryTimes = driftReports.filter(r => r.severity !== 'LOW').map(r => r.timeToCorrection);
      
      // Stability factors
      const recentReports = driftReports.slice(-20);
      const performanceDrifts = recentReports.filter(r => r.driftType === 'PERFORMANCE').length;
      const emotionalDrifts = recentReports.filter(r => r.driftType === 'EMOTIONAL').length;
      const strategicDrifts = recentReports.filter(r => r.driftType === 'STRATEGIC').length;
      const identityDrifts = recentReports.filter(r => r.driftType === 'IDENTITY').length;
      
      const total = Math.max(1, performanceDrifts + emotionalDrifts + strategicDrifts + identityDrifts);
      
      return {
        stabilityHistory,
        driftPatterns,
        recoveryTimes,
        stabilityFactors: {
          performance: Math.max(0, 100 - (performanceDrifts / total) * 100),
          emotional: Math.max(0, 100 - (emotionalDrifts / total) * 100),
          strategic: Math.max(0, 100 - (strategicDrifts / total) * 100),
          identity: Math.max(0, 100 - (identityDrifts / total) * 100),
        },
      };
    } catch (error) {
      console.error('[Consciousness Service] Failed to get stability analytics:', error);
      return {
        stabilityHistory: [],
        driftPatterns: new Map(),
        recoveryTimes: [],
        stabilityFactors: { performance: 80, emotional: 75, strategic: 82, identity: 85 },
      };
    }
  },
  
  // ==========================================================================
  // Debugging
  // ==========================================================================
  
  exportConsciousnessData: (): string => {
    try {
      const state = consciousnessState.getCurrentState();
      const serviceState = get();
      
      const exportData = {
        consciousnessState: state,
        serviceState: {
          profile: serviceState.profile,
          insights: serviceState.insights,
          soulSync: serviceState.soulSync,
          cycleStates: {
            dailyReviewEnabled: serviceState.dailyReviewEnabled,
            microLearningEnabled: serviceState.microLearningEnabled,
            weeklyEvolutionEnabled: serviceState.weeklyEvolutionEnabled,
          },
        },
        exportTimestamp: Date.now(),
      };
      
      return JSON.stringify(exportData, (key, value) => {
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        return value;
      }, 2);
    } catch (error) {
      console.error('[Consciousness Service] Failed to export data:', error);
      return '{}';
    }
  },
  
  importConsciousnessData: (data: string): boolean => {
    try {
      const importData = JSON.parse(data);
      
      if (importData.consciousnessState) {
        consciousnessState.importState(JSON.stringify(importData.consciousnessState));
      }
      
      if (importData.serviceState) {
        const { profile, insights, soulSync, cycleStates } = importData.serviceState;
        
        set({
          profile: profile || get().profile,
          insights: insights || get().insights,
          soulSync: soulSync || get().soulSync,
          dailyReviewEnabled: cycleStates?.dailyReviewEnabled || false,
          microLearningEnabled: cycleStates?.microLearningEnabled || false,
          weeklyEvolutionEnabled: cycleStates?.weeklyEvolutionEnabled || false,
        });
      }
      
      console.log('[Consciousness Service] Data imported successfully');
      return true;
    } catch (error) {
      console.error('[Consciousness Service] Failed to import data:', error);
      return false;
    }
  },
  
  resetConsciousness: (): boolean => {
    try {
      // Reset consciousness loop
      const loop = TradingConsciousnessLoop.getInstance();
      loop.disableDailyReview();
      loop.disableMicroLearning();
      loop.disableWeeklyEvolution();
      
      // Reset service state
      set({
        isLoaded: false,
        isActive: false,
        lastUpdate: 0,
        profile: {
          level: 50,
          awarenessDepth: 50,
          reflectiveCapacity: 60,
          integrationLevel: 55,
          evolutionVelocity: 0,
          stabilityLevel: 80,
          confidenceLevel: 60,
          learningRate: 50,
          identityStability: 75,
          strategicMaturity: 50,
        },
        insights: {
          dailyReview: {
            completed: false,
            score: 50,
            streak: 0,
            trends: { score: 50, emotional: 50, learning: 50, strategic: 50 },
          },
          microLearning: {
            active: false,
            recentImprovements: 0,
            learningVelocity: 50,
            retentionRate: 75,
          },
          weeklyEvolution: {
            currentScore: 50,
            trend: 'STEADY',
            newCapabilities: 0,
            maturityLevel: 50,
          },
          stability: {
            currentLevel: 80,
            trend: 'STABLE',
            recentDrifts: 0,
            criticalDrifts: 0,
          },
          confidence: {
            current: 60,
            stability: 70,
            trend: 0,
            calibration: { performance: 50, market: 50, system: 50, learning: 50 },
          },
          keyInsights: [],
          recentMilestones: [],
        },
        soulSync: {
          connected: false,
          synchronizationLevel: 0,
          personalityAlignment: 50,
          emotionalCoherence: 50,
          strategicHarmony: 50,
          lastSyncTime: 0,
          syncQuality: 'FAIR',
          integrationInsights: [],
        },
        dailyReviewEnabled: false,
        microLearningEnabled: false,
        weeklyEvolutionEnabled: false,
        events: [],
        eventListeners: new Map(),
      });
      
      console.log('[Consciousness Service] Consciousness system reset');
      return true;
    } catch (error) {
      console.error('[Consciousness Service] Failed to reset consciousness:', error);
      return false;
    }
  },
}));

// Auto-load consciousness on service initialization
if (typeof window !== 'undefined') {
  const service = useConsciousnessService.getState();
  service.loadConsciousness();
}