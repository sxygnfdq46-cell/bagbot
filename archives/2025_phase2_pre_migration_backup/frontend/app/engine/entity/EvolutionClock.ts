/**
 * LEVEL 7.4: THREE-MONTH EVOLUTION TIMELINE ENGINE
 * 
 * Tracks short-term trends (5-30 min)
 *        mid-term trends (hours)
 *        long-term growth (days → months)
 * 
 * This creates stable evolution, not random shifts.
 * Ensures personality changes feel organic and intentional.
 */

import type { GenomeSnapshot } from './BehaviorGenome';
import type { MemorySnapshot } from './EntityMemory';

// ============================================
// TREND TIMEFRAMES
// ============================================

export interface ShortTermTrend {
  timeframe: '5min' | '15min' | '30min';
  activityLevel: number;        // 0-100
  emotionalIntensity: number;   // 0-100
  focusDepth: number;           // 0-100
  timestamp: number;
}

export interface MidTermTrend {
  timeframe: 'hour' | '3hour' | '6hour';
  averageActivity: number;      // 0-100
  dominantMood: string;
  engagementPeak: number;       // 0-100
  consistencyScore: number;     // 0-100
  timestamp: number;
}

export interface LongTermGrowth {
  timeframe: 'day' | 'week' | 'month';
  parameterChanges: Record<string, number>; // Parameter deltas
  stabilityTrend: 'increasing' | 'stable' | 'decreasing';
  maturationRate: number;       // 0-100 (how fast entity is maturing)
  timestamp: number;
}

// ============================================
// EVOLUTION TIMELINE
// ============================================

export interface EvolutionTimeline {
  shortTerm: ShortTermTrend[];
  midTerm: MidTermTrend[];
  longTerm: LongTermGrowth[];
  overallTrajectory: 'maturing' | 'stable' | 'regressing' | 'exploring';
}

// ============================================
// EVOLUTION CLOCK CLASS
// ============================================

export class EvolutionClock {
  private storageKey = 'bagbot_evolution_clock_v1';
  
  // Trend buffers
  private shortTermTrends: ShortTermTrend[] = [];
  private midTermTrends: MidTermTrend[] = [];
  private longTermGrowth: LongTermGrowth[] = [];
  
  // Tracking windows
  private readonly SHORT_TERM_WINDOW = 30 * 60 * 1000; // 30 minutes
  private readonly MID_TERM_WINDOW = 6 * 60 * 60 * 1000; // 6 hours
  private readonly LONG_TERM_WINDOW = 90 * 24 * 60 * 60 * 1000; // 90 days (3 months)
  
  // Last update timestamps
  private lastShortTermUpdate = Date.now();
  private lastMidTermUpdate = Date.now();
  private lastLongTermUpdate = Date.now();
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Update all trends based on current state
   */
  update(memory: MemorySnapshot, genome: GenomeSnapshot): EvolutionTimeline {
    const now = Date.now();
    
    // Update short-term trends (every 5 minutes)
    if (now - this.lastShortTermUpdate >= 5 * 60 * 1000) {
      this.updateShortTerm(memory);
      this.lastShortTermUpdate = now;
    }
    
    // Update mid-term trends (every hour)
    if (now - this.lastMidTermUpdate >= 60 * 60 * 1000) {
      this.updateMidTerm(memory);
      this.lastMidTermUpdate = now;
    }
    
    // Update long-term growth (every day)
    if (now - this.lastLongTermUpdate >= 24 * 60 * 60 * 1000) {
      this.updateLongTerm(genome);
      this.lastLongTermUpdate = now;
    }
    
    // Cleanup old data
    this.cleanup();
    
    // Save to storage
    this.saveToStorage();
    
    return this.getTimeline();
  }
  
  /**
   * Get current evolution timeline
   */
  getTimeline(): EvolutionTimeline {
    return {
      shortTerm: [...this.shortTermTrends],
      midTerm: [...this.midTermTrends],
      longTerm: [...this.longTermGrowth],
      overallTrajectory: this.calculateOverallTrajectory()
    };
  }
  
  /**
   * Get trend direction for a specific timeframe
   */
  getTrendDirection(timeframe: 'short' | 'mid' | 'long'): 'increasing' | 'stable' | 'decreasing' {
    if (timeframe === 'short' && this.shortTermTrends.length >= 3) {
      const recent = this.shortTermTrends.slice(-3);
      const trend = this.calculateTrendSlope(recent.map(t => t.activityLevel));
      if (trend > 5) return 'increasing';
      if (trend < -5) return 'decreasing';
      return 'stable';
    }
    
    if (timeframe === 'mid' && this.midTermTrends.length >= 3) {
      const recent = this.midTermTrends.slice(-3);
      const trend = this.calculateTrendSlope(recent.map(t => t.averageActivity));
      if (trend > 5) return 'increasing';
      if (trend < -5) return 'decreasing';
      return 'stable';
    }
    
    if (timeframe === 'long' && this.longTermGrowth.length >= 3) {
      const recent = this.longTermGrowth.slice(-3);
      const trend = this.calculateTrendSlope(recent.map(t => t.maturationRate));
      if (trend > 5) return 'increasing';
      if (trend < -5) return 'decreasing';
      return 'stable';
    }
    
    return 'stable';
  }
  
  /**
   * Predict future state based on trends
   */
  predictFutureState(daysAhead: number): {
    predictedActivity: number;
    predictedMaturity: number;
    confidence: number;
  } {
    if (this.longTermGrowth.length < 5) {
      return {
        predictedActivity: 50,
        predictedMaturity: 50,
        confidence: 20
      };
    }
    
    // Use linear regression on long-term growth
    const recentGrowth = this.longTermGrowth.slice(-10);
    const activityTrend = this.calculateTrendSlope(
      recentGrowth.map(g => Object.values(g.parameterChanges).reduce((a, b) => a + b, 0))
    );
    const maturityTrend = this.calculateTrendSlope(
      recentGrowth.map(g => g.maturationRate)
    );
    
    const currentActivity = recentGrowth[recentGrowth.length - 1].maturationRate;
    const currentMaturity = recentGrowth[recentGrowth.length - 1].maturationRate;
    
    const predictedActivity = Math.max(0, Math.min(100, currentActivity + (activityTrend * daysAhead)));
    const predictedMaturity = Math.max(0, Math.min(100, currentMaturity + (maturityTrend * daysAhead)));
    
    // Confidence based on trend stability
    const variance = this.calculateVariance(recentGrowth.map(g => g.maturationRate));
    const confidence = Math.max(0, Math.min(100, 100 - variance));
    
    return { predictedActivity, predictedMaturity, confidence };
  }
  
  /**
   * Reset evolution clock
   */
  reset(): void {
    this.shortTermTrends = [];
    this.midTermTrends = [];
    this.longTermGrowth = [];
    this.lastShortTermUpdate = Date.now();
    this.lastMidTermUpdate = Date.now();
    this.lastLongTermUpdate = Date.now();
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // TREND UPDATES
  // ============================================
  
  private updateShortTerm(memory: MemorySnapshot): void {
    // Calculate activity level from recent interactions
    const activityLevel = Math.min(100, memory.interactionRhythm.averageBPM * 2);
    
    // Calculate emotional intensity
    const emotionalIntensity = memory.engagementPattern.intensityAverage;
    
    // Calculate focus depth
    const focusDepth = memory.engagementPattern.engagementStyle === 'deep-focus' ? 80 : 50;
    
    const trend: ShortTermTrend = {
      timeframe: '5min',
      activityLevel,
      emotionalIntensity,
      focusDepth,
      timestamp: Date.now()
    };
    
    this.shortTermTrends.push(trend);
  }
  
  private updateMidTerm(memory: MemorySnapshot): void {
    // Calculate average activity from recent short-term trends
    const recentShort = this.shortTermTrends.slice(-12); // Last hour (12 × 5min)
    const averageActivity = recentShort.length > 0
      ? recentShort.reduce((sum, t) => sum + t.activityLevel, 0) / recentShort.length
      : 50;
    
    // Determine dominant mood
    const dominantMood = memory.moodPattern.dominantMood;
    
    // Calculate engagement peak
    const engagementPeak = memory.engagementPattern.intensityAverage;
    
    // Calculate consistency
    const consistencyScore = memory.interactionRhythm.rhythmConsistency;
    
    const trend: MidTermTrend = {
      timeframe: 'hour',
      averageActivity,
      dominantMood,
      engagementPeak,
      consistencyScore,
      timestamp: Date.now()
    };
    
    this.midTermTrends.push(trend);
  }
  
  private updateLongTerm(genome: GenomeSnapshot): void {
    // Calculate parameter changes from last long-term update
    const parameterChanges: Record<string, number> = {};
    
    if (this.longTermGrowth.length > 0) {
      const lastGrowth = this.longTermGrowth[this.longTermGrowth.length - 1];
      // For now, we'll track genome generation as a proxy
      parameterChanges.generation = genome.generation - (lastGrowth.parameterChanges.generation || 0);
    } else {
      parameterChanges.generation = genome.generation;
    }
    
    // Determine stability trend
    let stabilityTrend: LongTermGrowth['stabilityTrend'] = 'stable';
    if (this.longTermGrowth.length >= 2) {
      const current = genome.stability;
      const previous = this.longTermGrowth[this.longTermGrowth.length - 1].maturationRate;
      if (current > previous + 5) stabilityTrend = 'increasing';
      else if (current < previous - 5) stabilityTrend = 'decreasing';
    }
    
    // Calculate maturation rate (genome stability as proxy)
    const maturationRate = genome.stability;
    
    const growth: LongTermGrowth = {
      timeframe: 'day',
      parameterChanges,
      stabilityTrend,
      maturationRate,
      timestamp: Date.now()
    };
    
    this.longTermGrowth.push(growth);
  }
  
  // ============================================
  // TRAJECTORY CALCULATION
  // ============================================
  
  private calculateOverallTrajectory(): EvolutionTimeline['overallTrajectory'] {
    if (this.longTermGrowth.length < 3) return 'exploring';
    
    const recentGrowth = this.longTermGrowth.slice(-5);
    const maturationTrend = this.calculateTrendSlope(recentGrowth.map(g => g.maturationRate));
    const stabilityIncreasing = recentGrowth.filter(g => g.stabilityTrend === 'increasing').length > 2;
    
    if (maturationTrend > 2 && stabilityIncreasing) return 'maturing';
    if (Math.abs(maturationTrend) < 1) return 'stable';
    if (maturationTrend < -2) return 'regressing';
    return 'exploring';
  }
  
  // ============================================
  // CLEANUP
  // ============================================
  
  private cleanup(): void {
    const now = Date.now();
    
    // Remove short-term trends older than 30 minutes
    this.shortTermTrends = this.shortTermTrends.filter(
      t => now - t.timestamp < this.SHORT_TERM_WINDOW
    );
    
    // Remove mid-term trends older than 6 hours
    this.midTermTrends = this.midTermTrends.filter(
      t => now - t.timestamp < this.MID_TERM_WINDOW
    );
    
    // Remove long-term growth older than 90 days
    this.longTermGrowth = this.longTermGrowth.filter(
      g => now - g.timestamp < this.LONG_TERM_WINDOW
    );
  }
  
  // ============================================
  // MATH UTILITIES
  // ============================================
  
  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    values.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += Math.pow(x - xMean, 2);
    });
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      const data = {
        shortTerm: this.shortTermTrends.slice(-360), // Last 30 hours
        midTerm: this.midTermTrends.slice(-168), // Last week
        longTerm: this.longTermGrowth.slice(-90), // Last 90 days
        lastUpdates: {
          short: this.lastShortTermUpdate,
          mid: this.lastMidTermUpdate,
          long: this.lastLongTermUpdate
        }
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[EvolutionClock] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.shortTermTrends = data.shortTerm || [];
        this.midTermTrends = data.midTerm || [];
        this.longTermGrowth = data.longTerm || [];
        
        if (data.lastUpdates) {
          this.lastShortTermUpdate = data.lastUpdates.short || Date.now();
          this.lastMidTermUpdate = data.lastUpdates.mid || Date.now();
          this.lastLongTermUpdate = data.lastUpdates.long || Date.now();
        }
      }
    } catch (error) {
      console.warn('[EvolutionClock] Failed to load:', error);
    }
  }
}
