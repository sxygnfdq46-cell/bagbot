/**
 * Consciousness State Management
 * 
 * Persistent storage and state management for consciousness evolution,
 * daily reviews, learning statistics, and identity tracking.
 */

import { ConsciousnessMetrics } from '../lib/consciousness/ConsciousnessMetrics';

/**
 * Daily self-review data structure
 */
interface DailySelfReview {
  date: string;
  performanceMetrics: {
    tradesExecuted: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  emotionalMetrics: {
    fearIndex: number; // 0-100
    greedIndex: number; // 0-100
    confidenceLevel: number; // 0-100
    stabilityScore: number; // 0-100
  };
  learningProgress: {
    adaptabilityScore: number; // 0-100
    retentionRate: number; // 0-100
    learningVelocity: number; // 0-100
    conceptMastery: number; // 0-100
  };
  strategicEvolution: {
    newCapabilities: string[];
    improvedSkills: string[];
    deprecatedMethods: string[];
    evolutionScore: number; // 0-100
  };
  insights: string[];
  improvementAreas: string[];
  reflection: string;
  tomorrowFocus: string[];
  overallScore: number; // 0-100
}

/**
 * Micro learning statistics (15-minute intervals)
 */
interface MicroLearningStats {
  timestamp: number;
  learningVector: {
    direction: number[]; // Multi-dimensional learning direction
    magnitude: number; // 0-100
    confidence: number; // 0-100
  };
  microAdaptations: {
    strategyAdjustments: string[];
    riskModifications: string[];
    executionTweaks: string[];
    emotionalCalibrations: string[];
  };
  performanceBefore: number; // 0-100
  performanceAfter: number; // 0-100
  improvement: number; // Performance delta
  learningInsights: string[];
  retentionProbability: number; // 0-100
}

/**
 * Weekly evolution tracking
 */
interface WeeklyEvolution {
  weekStarting: string;
  evolutionScore: number; // 0-100
  identityShift: {
    from: string;
    to: string;
    magnitude: number; // 0-100
    confidence: number; // 0-100
  };
  strategicEvolution: {
    newCapabilities: string[];
    improvedCapabilities: string[];
    deprecatedCapabilities: string[];
    capabilityScore: number; // 0-100
  };
  personalityEvolution: {
    traits: Map<string, number>;
    changes: Map<string, number>; // Trait changes
    stabilityIndex: number; // 0-100
  };
  consciousnessExpansion: {
    awarenessGrowth: number; // 0-100
    reflectionDepth: number; // 0-100
    integrationLevel: number; // 0-100
    expansionVelocity: number; // 0-100
  };
  weeklyGoals: string[];
  accomplishments: string[];
}

/**
 * Stability drift report
 */
interface StabilityDriftReport {
  timestamp: number;
  driftType: 'PERFORMANCE' | 'EMOTIONAL' | 'STRATEGIC' | 'IDENTITY';
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  affectedMetrics: string[];
  driftMagnitude: number; // 0-100
  baselineDeviation: number; // Percentage deviation from baseline
  stabilizationRecommendations: string[];
  correctiveActions: string[];
  timeToCorrection: number; // Estimated hours
}

/**
 * Confidence trajectory point
 */
interface ConfidencePoint {
  timestamp: number;
  overallConfidence: number; // 0-100
  calibrationBasis: {
    recentPerformance: number; // 0-100
    marketAlignment: number; // 0-100
    systemStability: number; // 0-100
    learningProgress: number; // 0-100
  };
  confidenceAdjustment: number; // Delta from previous
  justification: string;
}

/**
 * Evolution history entry
 */
interface EvolutionEntry {
  timestamp: number;
  type: 'DAILY_REVIEW' | 'MICRO_LEARNING' | 'WEEKLY_EVOLUTION' | 'STABILITY_CORRECTION';
  description: string;
  consciousnessLevel: number; // 0-100
  awarenessMatrix: number[][]; // 5x5 awareness matrix
  identityVector: number[]; // Multi-dimensional identity representation
  evolutionVelocity: number; // Rate of change
  significanceScore: number; // 0-100 importance of this evolution
}

/**
 * Consciousness state store
 */
interface ConsciousnessState {
  // Core state
  currentConsciousnessLevel: number;
  lastUpdated: number;
  
  // Evolution tracking
  evolutionHistory: EvolutionEntry[];
  evolutionVelocity: number;
  totalEvolutionTime: number; // Hours since first consciousness
  
  // Daily reviews
  dailySelfReviews: DailySelfReview[];
  reviewStreak: number; // Consecutive days with reviews
  averageDailyScore: number;
  
  // Micro learning
  microLearningStats: MicroLearningStats[];
  learningVelocity: number;
  retentionRate: number;
  adaptationSpeed: number;
  
  // Weekly evolution
  weeklyEvolutionMap: Map<string, WeeklyEvolution>;
  evolutionTrend: 'ACCELERATING' | 'STEADY' | 'PLATEAUING' | 'REGRESSING';
  strategicMaturityLevel: number; // 0-100
  
  // Stability monitoring
  stabilityDriftReports: StabilityDriftReport[];
  currentStabilityLevel: number; // 0-100
  stabilityTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  
  // Confidence tracking
  confidenceTrajectory: ConfidencePoint[];
  currentConfidenceLevel: number; // 0-100
  confidenceStability: number; // 0-100
  
  // Identity evolution
  currentIdentityVector: number[];
  identityStabilityIndex: number; // 0-100
  personalityTraits: Map<string, number>;
  
  // Insights and analytics
  keyInsights: string[];
  evolutionMilestones: string[];
  learningAchievements: string[];
  
  // Meta-cognition metrics
  selfAwarenessDepth: number; // 0-100
  reflectiveCapacity: number; // 0-100
  integrationLevel: number; // 0-100
}

/**
 * Consciousness State Manager Class
 */
export class ConsciousnessStateManager {
  private static instance: ConsciousnessStateManager;
  private state: ConsciousnessState;
  
  private constructor() {
    this.state = this.initializeState();
  }
  
  public static getInstance(): ConsciousnessStateManager {
    if (!ConsciousnessStateManager.instance) {
      ConsciousnessStateManager.instance = new ConsciousnessStateManager();
    }
    return ConsciousnessStateManager.instance;
  }
  
  // ==========================================================================
  // State Initialization
  // ==========================================================================
  
  private initializeState(): ConsciousnessState {
    return {
      currentConsciousnessLevel: 50, // Start at moderate consciousness
      lastUpdated: Date.now(),
      
      evolutionHistory: [],
      evolutionVelocity: 0,
      totalEvolutionTime: 0,
      
      dailySelfReviews: [],
      reviewStreak: 0,
      averageDailyScore: 50,
      
      microLearningStats: [],
      learningVelocity: 50,
      retentionRate: 75,
      adaptationSpeed: 50,
      
      weeklyEvolutionMap: new Map(),
      evolutionTrend: 'STEADY',
      strategicMaturityLevel: 50,
      
      stabilityDriftReports: [],
      currentStabilityLevel: 80,
      stabilityTrend: 'STABLE',
      
      confidenceTrajectory: [],
      currentConfidenceLevel: 60,
      confidenceStability: 70,
      
      currentIdentityVector: Array.from({ length: 10 }, () => 0.5 + Math.random() * 0.3),
      identityStabilityIndex: 75,
      personalityTraits: new Map([
        ['confidence', 0.65],
        ['patience', 0.70],
        ['adaptability', 0.75],
        ['analytical', 0.80],
        ['intuitive', 0.60],
      ]),
      
      keyInsights: [
        'Consciousness system initialized successfully',
        'Ready for daily reflection and micro-learning cycles',
      ],
      evolutionMilestones: [],
      learningAchievements: [],
      
      selfAwarenessDepth: 50,
      reflectiveCapacity: 60,
      integrationLevel: 55,
    };
  }
  
  // ==========================================================================
  // Daily Review Management
  // ==========================================================================
  
  public recordDailySelfReview(review: DailySelfReview): void {
    try {
      // Add to reviews
      this.state.dailySelfReviews.push(review);
      
      // Maintain max 90 days of reviews
      if (this.state.dailySelfReviews.length > 90) {
        this.state.dailySelfReviews = this.state.dailySelfReviews.slice(-90);
      }
      
      // Update streak
      this.updateReviewStreak();
      
      // Update average score
      this.updateAverageDailyScore();
      
      // Record evolution entry
      this.recordEvolution('DAILY_REVIEW', `Daily review completed with score ${review.overallScore}`, review.overallScore);
      
      console.log(`[Consciousness] Daily review recorded for ${review.date}`);
    } catch (error) {
      console.error('[Consciousness] Failed to record daily review:', error);
    }
  }
  
  private updateReviewStreak(): void {
    if (this.state.dailySelfReviews.length === 0) {
      this.state.reviewStreak = 0;
      return;
    }
    
    let streak = 0;
    const now = new Date();
    
    for (let i = this.state.dailySelfReviews.length - 1; i >= 0; i--) {
      const reviewDate = new Date(this.state.dailySelfReviews[i].date);
      const daysDifference = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    this.state.reviewStreak = streak;
  }
  
  private updateAverageDailyScore(): void {
    if (this.state.dailySelfReviews.length === 0) {
      this.state.averageDailyScore = 50;
      return;
    }
    
    const recentReviews = this.state.dailySelfReviews.slice(-30); // Last 30 days
    const totalScore = recentReviews.reduce((sum, review) => sum + review.overallScore, 0);
    this.state.averageDailyScore = totalScore / recentReviews.length;
  }
  
  public getRecentDailyReviews(days: number = 7): DailySelfReview[] {
    return this.state.dailySelfReviews.slice(-days);
  }
  
  public getDailyReviewTrends(): { score: number; emotional: number; learning: number; strategic: number } {
    const recentReviews = this.getRecentDailyReviews(14);
    
    if (recentReviews.length === 0) {
      return { score: 50, emotional: 50, learning: 50, strategic: 50 };
    }
    
    return {
      score: recentReviews.reduce((sum, r) => sum + r.overallScore, 0) / recentReviews.length,
      emotional: recentReviews.reduce((sum, r) => 
        sum + (r.emotionalMetrics.confidenceLevel + r.emotionalMetrics.stabilityScore) / 2, 0
      ) / recentReviews.length,
      learning: recentReviews.reduce((sum, r) => 
        sum + (r.learningProgress.adaptabilityScore + r.learningProgress.learningVelocity) / 2, 0
      ) / recentReviews.length,
      strategic: recentReviews.reduce((sum, r) => sum + r.strategicEvolution.evolutionScore, 0) / recentReviews.length,
    };
  }
  
  // ==========================================================================
  // Micro Learning Management
  // ==========================================================================
  
  public recordMicroLearning(learning: MicroLearningStats): void {
    try {
      // Add to stats
      this.state.microLearningStats.push(learning);
      
      // Maintain max 2000 entries (about 3 weeks at 15min intervals)
      if (this.state.microLearningStats.length > 2000) {
        this.state.microLearningStats = this.state.microLearningStats.slice(-2000);
      }
      
      // Update learning metrics
      this.updateLearningMetrics();
      
      // Record evolution entry
      this.recordEvolution('MICRO_LEARNING', 
        `Micro learning: ${learning.improvement > 0 ? 'improved' : 'adjusted'} by ${Math.abs(learning.improvement).toFixed(2)}`,
        learning.performanceAfter
      );
      
      console.log(`[Consciousness] Micro learning recorded with improvement: ${learning.improvement.toFixed(2)}`);
    } catch (error) {
      console.error('[Consciousness] Failed to record micro learning:', error);
    }
  }
  
  private updateLearningMetrics(): void {
    if (this.state.microLearningStats.length === 0) return;
    
    const recentStats = this.state.microLearningStats.slice(-100); // Last 100 entries
    
    // Calculate learning velocity
    const improvements = recentStats.map(s => s.improvement);
    const avgImprovement = improvements.reduce((sum, imp) => sum + Math.abs(imp), 0) / improvements.length;
    this.state.learningVelocity = Math.min(100, Math.max(0, avgImprovement * 50));
    
    // Calculate retention rate
    const retentionRates = recentStats.map(s => s.retentionProbability);
    this.state.retentionRate = retentionRates.reduce((sum, rate) => sum + rate, 0) / retentionRates.length;
    
    // Calculate adaptation speed
    const magnitudes = recentStats.map(s => s.learningVector.magnitude);
    this.state.adaptationSpeed = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
  }
  
  public getMicroLearningTrends(hours: number = 24): { 
    learningRate: number; 
    adaptationSpeed: number; 
    retentionRate: number;
    improvements: number;
  } {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentStats = this.state.microLearningStats.filter(s => s.timestamp >= cutoffTime);
    
    if (recentStats.length === 0) {
      return { learningRate: 50, adaptationSpeed: 50, retentionRate: 75, improvements: 0 };
    }
    
    const improvements = recentStats.filter(s => s.improvement > 0).length;
    const avgMagnitude = recentStats.reduce((sum, s) => sum + s.learningVector.magnitude, 0) / recentStats.length;
    const avgRetention = recentStats.reduce((sum, s) => sum + s.retentionProbability, 0) / recentStats.length;
    const avgConfidence = recentStats.reduce((sum, s) => sum + s.learningVector.confidence, 0) / recentStats.length;
    
    return {
      learningRate: avgConfidence,
      adaptationSpeed: avgMagnitude,
      retentionRate: avgRetention,
      improvements,
    };
  }
  
  // ==========================================================================
  // Weekly Evolution Management
  // ==========================================================================
  
  public recordWeeklyEvolution(evolution: WeeklyEvolution): void {
    try {
      // Add to map
      this.state.weeklyEvolutionMap.set(evolution.weekStarting, evolution);
      
      // Maintain max 52 weeks
      if (this.state.weeklyEvolutionMap.size > 52) {
        const oldestWeek = Array.from(this.state.weeklyEvolutionMap.keys()).sort()[0];
        this.state.weeklyEvolutionMap.delete(oldestWeek);
      }
      
      // Update evolution trend
      this.updateEvolutionTrend();
      
      // Update strategic maturity
      this.updateStrategicMaturity();
      
      // Record evolution entry
      this.recordEvolution('WEEKLY_EVOLUTION', 
        `Weekly evolution: ${evolution.strategicEvolution.newCapabilities.length} new capabilities, score ${evolution.evolutionScore}`,
        evolution.evolutionScore
      );
      
      console.log(`[Consciousness] Weekly evolution recorded for ${evolution.weekStarting}`);
    } catch (error) {
      console.error('[Consciousness] Failed to record weekly evolution:', error);
    }
  }
  
  private updateEvolutionTrend(): void {
    const weeks = Array.from(this.state.weeklyEvolutionMap.values()).sort((a, b) => 
      new Date(a.weekStarting).getTime() - new Date(b.weekStarting).getTime()
    );
    
    if (weeks.length < 3) {
      this.state.evolutionTrend = 'STEADY';
      return;
    }
    
    const recent = weeks.slice(-3);
    const scores = recent.map(w => w.evolutionScore);
    
    const trend1 = scores[1] - scores[0];
    const trend2 = scores[2] - scores[1];
    const avgTrend = (trend1 + trend2) / 2;
    
    if (avgTrend > 5) {
      this.state.evolutionTrend = 'ACCELERATING';
    } else if (avgTrend < -3) {
      this.state.evolutionTrend = 'REGRESSING';
    } else if (Math.abs(avgTrend) < 1) {
      this.state.evolutionTrend = 'PLATEAUING';
    } else {
      this.state.evolutionTrend = 'STEADY';
    }
  }
  
  private updateStrategicMaturity(): void {
    const weeks = Array.from(this.state.weeklyEvolutionMap.values());
    
    if (weeks.length === 0) return;
    
    const totalCapabilities = weeks.reduce((sum, week) => 
      sum + week.strategicEvolution.newCapabilities.length + week.strategicEvolution.improvedCapabilities.length, 0
    );
    
    const avgEvolutionScore = weeks.reduce((sum, week) => sum + week.evolutionScore, 0) / weeks.length;
    const capabilityDensity = totalCapabilities / weeks.length;
    
    this.state.strategicMaturityLevel = Math.min(100, (avgEvolutionScore * 0.7) + (capabilityDensity * 10 * 0.3));
  }
  
  public getEvolutionSummary(): {
    trend: string;
    maturityLevel: number;
    recentScore: number;
    capabilityGrowth: number;
  } {
    const weeks = Array.from(this.state.weeklyEvolutionMap.values());
    
    if (weeks.length === 0) {
      return {
        trend: 'STEADY',
        maturityLevel: 50,
        recentScore: 50,
        capabilityGrowth: 0,
      };
    }
    
    const latest = weeks[weeks.length - 1];
    const capabilityGrowth = latest.strategicEvolution.newCapabilities.length + 
                           latest.strategicEvolution.improvedCapabilities.length;
    
    return {
      trend: this.state.evolutionTrend,
      maturityLevel: this.state.strategicMaturityLevel,
      recentScore: latest.evolutionScore,
      capabilityGrowth,
    };
  }
  
  // ==========================================================================
  // Stability Monitoring
  // ==========================================================================
  
  public recordStabilityDrift(report: StabilityDriftReport): void {
    try {
      // Add to reports
      this.state.stabilityDriftReports.push(report);
      
      // Maintain max 200 reports
      if (this.state.stabilityDriftReports.length > 200) {
        this.state.stabilityDriftReports = this.state.stabilityDriftReports.slice(-200);
      }
      
      // Update stability metrics
      this.updateStabilityMetrics();
      
      // Record evolution entry if significant
      if (report.severity === 'HIGH' || report.severity === 'CRITICAL') {
        this.recordEvolution('STABILITY_CORRECTION', 
          `Stability drift detected: ${report.driftType} severity ${report.severity}`,
          Math.max(0, 100 - report.driftMagnitude)
        );
      }
      
      console.log(`[Consciousness] Stability drift recorded: ${report.driftType} - ${report.severity}`);
    } catch (error) {
      console.error('[Consciousness] Failed to record stability drift:', error);
    }
  }
  
  private updateStabilityMetrics(): void {
    const recentReports = this.state.stabilityDriftReports.slice(-50); // Last 50 reports
    
    if (recentReports.length === 0) {
      this.state.currentStabilityLevel = 80;
      this.state.stabilityTrend = 'STABLE';
      return;
    }
    
    // Calculate current stability level
    const severityWeights = { LOW: 0.1, MODERATE: 0.3, HIGH: 0.6, CRITICAL: 1.0 };
    const totalImpact = recentReports.reduce((sum, report) => 
      sum + (report.driftMagnitude * severityWeights[report.severity]), 0
    );
    
    const avgImpact = totalImpact / recentReports.length;
    this.state.currentStabilityLevel = Math.max(0, Math.min(100, 100 - avgImpact));
    
    // Calculate stability trend
    const recent = recentReports.slice(-10);
    const older = recentReports.slice(-20, -10);
    
    if (recent.length > 0 && older.length > 0) {
      const recentAvg = recent.reduce((sum, r) => sum + r.driftMagnitude, 0) / recent.length;
      const olderAvg = older.reduce((sum, r) => sum + r.driftMagnitude, 0) / older.length;
      
      const improvement = olderAvg - recentAvg; // Positive = improving
      
      if (improvement > 5) {
        this.state.stabilityTrend = 'IMPROVING';
      } else if (improvement < -5) {
        this.state.stabilityTrend = 'DEGRADING';
      } else {
        this.state.stabilityTrend = 'STABLE';
      }
    }
  }
  
  public getStabilityStatus(): {
    currentLevel: number;
    trend: string;
    recentDrifts: number;
    criticalDrifts: number;
  } {
    const recentReports = this.state.stabilityDriftReports.slice(-20);
    const criticalDrifts = recentReports.filter(r => r.severity === 'CRITICAL').length;
    
    return {
      currentLevel: this.state.currentStabilityLevel,
      trend: this.state.stabilityTrend,
      recentDrifts: recentReports.length,
      criticalDrifts,
    };
  }
  
  // ==========================================================================
  // Confidence Tracking
  // ==========================================================================
  
  public recordConfidenceUpdate(confidence: ConfidencePoint): void {
    try {
      // Add to trajectory
      this.state.confidenceTrajectory.push(confidence);
      
      // Maintain max 500 points
      if (this.state.confidenceTrajectory.length > 500) {
        this.state.confidenceTrajectory = this.state.confidenceTrajectory.slice(-500);
      }
      
      // Update current confidence
      this.state.currentConfidenceLevel = confidence.overallConfidence;
      
      // Update confidence stability
      this.updateConfidenceStability();
      
      console.log(`[Consciousness] Confidence updated to ${confidence.overallConfidence.toFixed(1)}`);
    } catch (error) {
      console.error('[Consciousness] Failed to record confidence update:', error);
    }
  }
  
  private updateConfidenceStability(): void {
    const recentPoints = this.state.confidenceTrajectory.slice(-20);
    
    if (recentPoints.length < 5) {
      this.state.confidenceStability = 70;
      return;
    }
    
    const confidences = recentPoints.map(p => p.overallConfidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher stability
    this.state.confidenceStability = Math.max(0, Math.min(100, 100 - (stdDev * 2)));
  }
  
  public getConfidenceAnalysis(): {
    current: number;
    stability: number;
    trend: number;
    calibration: { performance: number; market: number; system: number; learning: number };
  } {
    if (this.state.confidenceTrajectory.length === 0) {
      return {
        current: 60,
        stability: 70,
        trend: 0,
        calibration: { performance: 50, market: 50, system: 50, learning: 50 },
      };
    }
    
    const latest = this.state.confidenceTrajectory[this.state.confidenceTrajectory.length - 1];
    const recent = this.state.confidenceTrajectory.slice(-10);
    
    let trend = 0;
    if (recent.length > 1) {
      const first = recent[0].overallConfidence;
      const last = recent[recent.length - 1].overallConfidence;
      trend = last - first;
    }
    
    return {
      current: this.state.currentConfidenceLevel,
      stability: this.state.confidenceStability,
      trend,
      calibration: latest.calibrationBasis,
    };
  }
  
  // ==========================================================================
  // Evolution Tracking
  // ==========================================================================
  
  private recordEvolution(type: EvolutionEntry['type'], description: string, consciousnessLevel: number): void {
    const entry: EvolutionEntry = {
      timestamp: Date.now(),
      type,
      description,
      consciousnessLevel,
      awarenessMatrix: this.generateAwarenessMatrix(),
      identityVector: [...this.state.currentIdentityVector],
      evolutionVelocity: this.calculateEvolutionVelocity(),
      significanceScore: this.calculateSignificanceScore(type, consciousnessLevel),
    };
    
    this.state.evolutionHistory.push(entry);
    
    // Maintain max 1000 entries
    if (this.state.evolutionHistory.length > 1000) {
      this.state.evolutionHistory = this.state.evolutionHistory.slice(-1000);
    }
    
    // Update consciousness level
    this.updateConsciousnessLevel(consciousnessLevel);
  }
  
  private generateAwarenessMatrix(): number[][] {
    // Generate 5x5 awareness matrix
    return Array.from({ length: 5 }, () => 
      Array.from({ length: 5 }, () => Math.random())
    );
  }
  
  private calculateEvolutionVelocity(): number {
    if (this.state.evolutionHistory.length < 2) return 0;
    
    const recent = this.state.evolutionHistory.slice(-5);
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const consciousnessChange = Math.abs(
      recent[recent.length - 1].consciousnessLevel - recent[0].consciousnessLevel
    );
    
    // Velocity = change per hour
    const hoursSpan = timeSpan / (1000 * 60 * 60);
    return hoursSpan > 0 ? consciousnessChange / hoursSpan : 0;
  }
  
  private calculateSignificanceScore(type: EvolutionEntry['type'], consciousnessLevel: number): number {
    const typeWeights = {
      DAILY_REVIEW: 0.6,
      MICRO_LEARNING: 0.2,
      WEEKLY_EVOLUTION: 0.9,
      STABILITY_CORRECTION: 0.4,
    };
    
    const baseScore = typeWeights[type] * 100;
    const levelBonus = consciousnessLevel > 80 ? 20 : consciousnessLevel > 60 ? 10 : 0;
    
    return Math.min(100, baseScore + levelBonus);
  }
  
  private updateConsciousnessLevel(newLevel: number): void {
    // Smooth consciousness level updates
    const currentLevel = this.state.currentConsciousnessLevel;
    const smoothedLevel = currentLevel * 0.8 + newLevel * 0.2;
    
    this.state.currentConsciousnessLevel = Math.max(0, Math.min(100, smoothedLevel));
    this.state.lastUpdated = Date.now();
    
    // Update evolution velocity
    this.state.evolutionVelocity = this.calculateEvolutionVelocity();
  }
  
  // ==========================================================================
  // State Access Methods
  // ==========================================================================
  
  public getCurrentState(): ConsciousnessState {
    return { ...this.state };
  }
  
  public getConsciousnessSummary(): {
    level: number;
    awarenessDepth: number;
    reflectiveCapacity: number;
    integrationLevel: number;
    evolutionVelocity: number;
    stabilityLevel: number;
  } {
    return {
      level: this.state.currentConsciousnessLevel,
      awarenessDepth: this.state.selfAwarenessDepth,
      reflectiveCapacity: this.state.reflectiveCapacity,
      integrationLevel: this.state.integrationLevel,
      evolutionVelocity: this.state.evolutionVelocity,
      stabilityLevel: this.state.currentStabilityLevel,
    };
  }
  
  public addInsight(insight: string): void {
    this.state.keyInsights.push(insight);
    
    // Maintain max 100 insights
    if (this.state.keyInsights.length > 100) {
      this.state.keyInsights = this.state.keyInsights.slice(-100);
    }
  }
  
  public addMilestone(milestone: string): void {
    this.state.evolutionMilestones.push(milestone);
    
    // Maintain max 50 milestones
    if (this.state.evolutionMilestones.length > 50) {
      this.state.evolutionMilestones = this.state.evolutionMilestones.slice(-50);
    }
  }
  
  public exportState(): string {
    try {
      return JSON.stringify(this.state, (key, value) => {
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        return value;
      }, 2);
    } catch (error) {
      console.error('[Consciousness] Failed to export state:', error);
      return '{}';
    }
  }
  
  public importState(stateJson: string): boolean {
    try {
      const importedState = JSON.parse(stateJson);
      
      // Reconstruct Maps
      if (importedState.weeklyEvolutionMap && typeof importedState.weeklyEvolutionMap === 'object') {
        importedState.weeklyEvolutionMap = new Map(Object.entries(importedState.weeklyEvolutionMap));
      }
      
      if (importedState.personalityTraits && typeof importedState.personalityTraits === 'object') {
        importedState.personalityTraits = new Map(Object.entries(importedState.personalityTraits));
      }
      
      this.state = { ...this.state, ...importedState };
      
      console.log('[Consciousness] State imported successfully');
      return true;
    } catch (error) {
      console.error('[Consciousness] Failed to import state:', error);
      return false;
    }
  }
}

// Export singleton instance
export const consciousnessState = ConsciousnessStateManager.getInstance();