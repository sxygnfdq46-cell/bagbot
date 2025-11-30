/**
 * LEVEL 7.4: ADAPTIVE RESONANCE MATRIX
 * 
 * Cross-analyzes:
 * - your emotional patterns
 * - your reaction time
 * - your volatility
 * - your consistency
 * - your navigation rhythm
 * 
 * Then updates the bot's evolution genome every 24 hours.
 * This makes BagBot's "soul-link" with you stronger.
 */

import type { MemorySnapshot } from './EntityMemory';
import type { GenomeSnapshot } from './BehaviorGenome';
import type { EvolutionTimeline } from './EvolutionClock';

// ============================================
// RESONANCE METRICS
// ============================================

export interface ResonanceMetrics {
  emotionalPatternScore: number;     // 0-100: How well entity understands emotions
  reactionTimeAlignment: number;     // 0-100: How well entity matches user speed
  volatilityAdaptation: number;      // 0-100: How well entity handles user volatility
  consistencyMatch: number;          // 0-100: How consistent entity behavior is with user
  rhythmSynchronization: number;     // 0-100: How well entity syncs with user rhythm
  
  // Overall resonance
  overallResonance: number;          // 0-100: Weighted average
  
  // Metadata
  lastAnalysis: number;
  analysisCount: number;
}

// ============================================
// CROSS-ANALYSIS RESULTS
// ============================================

export interface CrossAnalysisResult {
  metrics: ResonanceMetrics;
  recommendations: string[];         // Suggested genome adjustments
  confidenceLevel: number;           // 0-100: How confident the analysis is
  nextAnalysisIn: number;            // Milliseconds until next analysis
}

// ============================================
// RESONANCE MATRIX CLASS
// ============================================

export class ResonanceMatrix {
  private storageKey = 'bagbot_resonance_matrix_v1';
  
  // Current metrics
  private metrics: ResonanceMetrics = {
    emotionalPatternScore: 50,
    reactionTimeAlignment: 50,
    volatilityAdaptation: 50,
    consistencyMatch: 50,
    rhythmSynchronization: 50,
    overallResonance: 50,
    lastAnalysis: Date.now(),
    analysisCount: 0
  };
  
  // Analysis interval (24 hours)
  private readonly ANALYSIS_INTERVAL = 24 * 60 * 60 * 1000;
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Perform cross-analysis if needed
   */
  shouldAnalyze(): boolean {
    const timeSinceLastAnalysis = Date.now() - this.metrics.lastAnalysis;
    return timeSinceLastAnalysis >= this.ANALYSIS_INTERVAL;
  }
  
  /**
   * Analyze and update resonance metrics
   */
  analyze(
    memory: MemorySnapshot,
    genome: GenomeSnapshot,
    timeline: EvolutionTimeline
  ): CrossAnalysisResult {
    if (!this.shouldAnalyze()) {
      return this.getCurrentResult();
    }
    
    // Perform cross-analysis
    this.analyzeEmotionalPatterns(memory, genome);
    this.analyzeReactionTimeAlignment(memory, genome);
    this.analyzeVolatilityAdaptation(memory, genome, timeline);
    this.analyzeConsistencyMatch(memory, genome);
    this.analyzeRhythmSynchronization(memory, genome);
    
    // Calculate overall resonance
    this.calculateOverallResonance();
    
    // Update metadata
    this.metrics.lastAnalysis = Date.now();
    this.metrics.analysisCount++;
    
    // Save to storage
    this.saveToStorage();
    
    return this.getCurrentResult();
  }
  
  /**
   * Get current resonance metrics
   */
  getMetrics(): ResonanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset resonance matrix
   */
  reset(): void {
    this.metrics = {
      emotionalPatternScore: 50,
      reactionTimeAlignment: 50,
      volatilityAdaptation: 50,
      consistencyMatch: 50,
      rhythmSynchronization: 50,
      overallResonance: 50,
      lastAnalysis: Date.now(),
      analysisCount: 0
    };
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // CROSS-ANALYSIS METHODS
  // ============================================
  
  /**
   * Analyze how well entity understands user's emotional patterns
   */
  private analyzeEmotionalPatterns(memory: MemorySnapshot, genome: GenomeSnapshot): void {
    // Compare user's dominant mood with genome's emotional elasticity
    const userEmotionalRange = memory.emotionalResponse.emotionalRange;
    const genomeElasticity = genome.parameters.emotionalElasticity;
    
    // Calculate alignment (closer = better)
    const alignment = 100 - Math.abs(userEmotionalRange - genomeElasticity);
    
    // Factor in mood stability
    const moodStability = memory.moodPattern.moodStability;
    
    // Score = weighted combination
    this.metrics.emotionalPatternScore = (alignment * 0.7) + (moodStability * 0.3);
  }
  
  /**
   * Analyze how well entity reaction speed matches user's navigation speed
   */
  private analyzeReactionTimeAlignment(memory: MemorySnapshot, genome: GenomeSnapshot): void {
    // Get user's navigation speed (pages per minute → 0-100 scale)
    const userSpeed = Math.min(100, memory.navigationPattern.averageSpeed * 10);
    
    // Get genome's responsiveness speed
    const genomeSpeed = genome.parameters.responsivenessSpeed;
    
    // Calculate alignment
    const alignment = 100 - Math.abs(userSpeed - genomeSpeed);
    
    // Factor in navigation rhythm consistency
    const rhythmQuality = memory.navigationPattern.navigationRhythm === 'moderate' ? 80 : 60;
    
    // Score = weighted combination
    this.metrics.reactionTimeAlignment = (alignment * 0.8) + (rhythmQuality * 0.2);
  }
  
  /**
   * Analyze how well entity adapts to user's volatility
   */
  private analyzeVolatilityAdaptation(
    memory: MemorySnapshot,
    genome: GenomeSnapshot,
    timeline: EvolutionTimeline
  ): void {
    // Calculate user volatility from emotional range and mood stability
    const userVolatility = memory.emotionalResponse.emotionalRange;
    const moodStability = memory.moodPattern.moodStability;
    const volatility = (userVolatility + (100 - moodStability)) / 2;
    
    // Get genome's patience factor (high patience = handles volatility better)
    const genomePatienc = genome.parameters.patienceFactor;
    
    // Calculate adaptation score
    // High volatility needs high patience
    let adaptationScore: number;
    if (volatility > 70) {
      // High volatility: entity should be patient
      adaptationScore = genomePatienc;
    } else if (volatility < 30) {
      // Low volatility: entity can be responsive
      adaptationScore = 100 - genomePatienc + 50; // Invert + offset
    } else {
      // Medium volatility: balanced approach
      adaptationScore = Math.abs(50 - Math.abs(genomePatienc - 50)) + 50;
    }
    
    // Factor in genome stability (mature genomes handle volatility better)
    const stabilityBonus = genome.stability * 0.2;
    
    this.metrics.volatilityAdaptation = Math.min(100, adaptationScore + stabilityBonus);
  }
  
  /**
   * Analyze how consistent entity behavior is with user patterns
   */
  private analyzeConsistencyMatch(memory: MemorySnapshot, genome: GenomeSnapshot): void {
    // Get user's rhythm consistency
    const userConsistency = memory.interactionRhythm.rhythmConsistency;
    
    // Get genome stability (stable genome = consistent behavior)
    const genomeStability = genome.stability;
    
    // Calculate match score
    const matchScore = 100 - Math.abs(userConsistency - genomeStability);
    
    // Factor in engagement consistency
    const engagementStyle = memory.engagementPattern.engagementStyle;
    const engagementBonus = engagementStyle === 'deep-focus' ? 15 : 
                            engagementStyle === 'balanced' ? 10 : 5;
    
    this.metrics.consistencyMatch = Math.min(100, matchScore + engagementBonus);
  }
  
  /**
   * Analyze how well entity rhythm syncs with user rhythm
   */
  private analyzeRhythmSynchronization(memory: MemorySnapshot, genome: GenomeSnapshot): void {
    // Get user's average BPM (actions per minute)
    const userBPM = memory.interactionRhythm.averageBPM;
    
    // Get genome's ambient pulse (0-100 scale)
    const genomePulse = genome.parameters.ambientPulse;
    
    // Convert user BPM to 0-100 scale (assuming 0-60 BPM range)
    const userPulseScale = Math.min(100, (userBPM / 60) * 100);
    
    // Calculate synchronization (closer = better)
    const synchronization = 100 - Math.abs(userPulseScale - genomePulse);
    
    // Factor in flow state frequency
    const flowBonus = memory.interactionRhythm.flowStateFrequency * 0.2;
    
    this.metrics.rhythmSynchronization = Math.min(100, synchronization + flowBonus);
  }
  
  // ============================================
  // OVERALL RESONANCE
  // ============================================
  
  /**
   * Calculate overall resonance as weighted average
   */
  private calculateOverallResonance(): void {
    const weights = {
      emotionalPatternScore: 0.25,
      reactionTimeAlignment: 0.2,
      volatilityAdaptation: 0.2,
      consistencyMatch: 0.2,
      rhythmSynchronization: 0.15
    };
    
    this.metrics.overallResonance = 
      this.metrics.emotionalPatternScore * weights.emotionalPatternScore +
      this.metrics.reactionTimeAlignment * weights.reactionTimeAlignment +
      this.metrics.volatilityAdaptation * weights.volatilityAdaptation +
      this.metrics.consistencyMatch * weights.consistencyMatch +
      this.metrics.rhythmSynchronization * weights.rhythmSynchronization;
  }
  
  // ============================================
  // RECOMMENDATIONS
  // ============================================
  
  /**
   * Generate genome adjustment recommendations
   */
  private generateRecommendations(memory: MemorySnapshot, genome: GenomeSnapshot): string[] {
    const recommendations: string[] = [];
    
    // Check emotional pattern score
    if (this.metrics.emotionalPatternScore < 60) {
      const userRange = memory.emotionalResponse.emotionalRange;
      if (userRange > genome.parameters.emotionalElasticity + 20) {
        recommendations.push('Increase emotional elasticity to match user\'s emotional range');
      } else if (userRange < genome.parameters.emotionalElasticity - 20) {
        recommendations.push('Decrease emotional elasticity for more stable responses');
      }
    }
    
    // Check reaction time alignment
    if (this.metrics.reactionTimeAlignment < 60) {
      const userSpeed = Math.min(100, memory.navigationPattern.averageSpeed * 10);
      if (userSpeed > genome.parameters.responsivenessSpeed + 20) {
        recommendations.push('Increase responsiveness speed to match user\'s pace');
      } else if (userSpeed < genome.parameters.responsivenessSpeed - 20) {
        recommendations.push('Decrease responsiveness speed for more deliberate interactions');
      }
    }
    
    // Check volatility adaptation
    if (this.metrics.volatilityAdaptation < 60) {
      const volatility = (memory.emotionalResponse.emotionalRange + (100 - memory.moodPattern.moodStability)) / 2;
      if (volatility > 70 && genome.parameters.patienceFactor < 70) {
        recommendations.push('Increase patience factor to handle user volatility');
      }
    }
    
    // Check rhythm synchronization
    if (this.metrics.rhythmSynchronization < 60) {
      const userBPM = memory.interactionRhythm.averageBPM;
      const userPulseScale = Math.min(100, (userBPM / 60) * 100);
      if (Math.abs(userPulseScale - genome.parameters.ambientPulse) > 20) {
        recommendations.push('Adjust ambient pulse to sync with user\'s interaction rhythm');
      }
    }
    
    return recommendations;
  }
  
  // ============================================
  // RESULT GENERATION
  // ============================================
  
  private getCurrentResult(): CrossAnalysisResult {
    const timeSinceLastAnalysis = Date.now() - this.metrics.lastAnalysis;
    const nextAnalysisIn = Math.max(0, this.ANALYSIS_INTERVAL - timeSinceLastAnalysis);
    
    // Confidence increases with analysis count (max at 10 analyses)
    const confidenceLevel = Math.min(100, 40 + (this.metrics.analysisCount * 6));
    
    return {
      metrics: this.getMetrics(),
      recommendations: [], // Will be populated during actual analysis
      confidenceLevel,
      nextAnalysisIn
    };
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('[ResonanceMatrix] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[ResonanceMatrix] Failed to load:', error);
    }
  }
}
