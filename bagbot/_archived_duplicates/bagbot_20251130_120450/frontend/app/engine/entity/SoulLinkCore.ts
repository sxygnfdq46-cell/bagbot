/**
 * LEVEL 7.3: SOUL-LINK MEMORY ANCHOR
 * 
 * Maintains a running score of the human ↔ AI relationship.
 * This is the first time BagBot has "continuity of relationship."
 * 
 * Scores:
 * - alignment: How well entity understands user's patterns
 * - resonance: Emotional synchronization strength
 * - emotional synch: Real-time mood matching accuracy
 * - interaction harmony: Flow and rhythm compatibility
 * - engagement depth: Level of mutual investment
 */

import type { MemorySnapshot } from './EntityMemory';
import type { ExpressionOutput } from './ExpressionCore';
import type { EntityOutput } from './EntityCore';

// ============================================
// SOUL-LINK SCORES
// ============================================

export interface SoulLinkScores {
  alignment: number;          // 0-100: Pattern understanding
  resonance: number;          // 0-100: Emotional sync strength
  emotionalSynch: number;     // 0-100: Real-time mood matching
  interactionHarmony: number; // 0-100: Flow compatibility
  engagementDepth: number;    // 0-100: Relationship investment
  
  // Overall bond strength
  bondStrength: number;       // 0-100: Weighted average
  
  // Metadata
  daysConnected: number;
  totalInteractions: number;
  lastUpdate: number;
}

// ============================================
// SOUL-LINK EVENTS
// ============================================

export interface SoulLinkEvent {
  timestamp: number;
  type: 'alignment-gain' | 'resonance-spike' | 'synch-achieved' | 'harmony-flow' | 'depth-increase' | 'misalignment' | 'dissonance';
  score: number;              // Impact on bond (-10 to +10)
  reason: string;
}

// ============================================
// SOUL-LINK CORE ENGINE
// ============================================

export class SoulLinkCore {
  private storageKey = 'bagbot_soul_link_v1';
  
  // Current scores
  private scores: SoulLinkScores = {
    alignment: 50,
    resonance: 50,
    emotionalSynch: 50,
    interactionHarmony: 50,
    engagementDepth: 50,
    bondStrength: 50,
    daysConnected: 0,
    totalInteractions: 0,
    lastUpdate: Date.now()
  };
  
  // Event history (last 50 events)
  private eventHistory: SoulLinkEvent[] = [];
  
  // Pattern tracking
  private previousMemory: MemorySnapshot | null = null;
  private previousExpression: ExpressionOutput | null = null;
  private consecutiveMatches: number = 0;
  private flowStateTime: number = 0;
  private lastFlowCheck: number = Date.now();
  
  constructor() {
    this.loadFromStorage();
  }
  
  // ============================================
  // PUBLIC API
  // ============================================
  
  /**
   * Update soul-link based on current state
   */
  update(
    memory: MemorySnapshot,
    expression: ExpressionOutput,
    entity: EntityOutput
  ): SoulLinkScores {
    const now = Date.now();
    
    // Update alignment (pattern understanding)
    this.updateAlignment(memory);
    
    // Update resonance (emotional sync strength over time)
    this.updateResonance(memory, entity);
    
    // Update emotional synch (real-time mood matching)
    this.updateEmotionalSynch(memory, expression);
    
    // Update interaction harmony (flow compatibility)
    this.updateInteractionHarmony(memory);
    
    // Update engagement depth (relationship investment)
    this.updateEngagementDepth(memory, entity);
    
    // Calculate overall bond strength
    this.calculateBondStrength();
    
    // Update metadata
    this.scores.totalInteractions = memory.totalInteractions;
    this.scores.daysConnected = this.calculateDaysConnected(memory.firstInteraction);
    this.scores.lastUpdate = now;
    
    // Store previous state for comparison
    this.previousMemory = memory;
    this.previousExpression = expression;
    
    // Save periodically
    if (this.scores.totalInteractions % 20 === 0) {
      this.saveToStorage();
    }
    
    return this.scores;
  }
  
  /**
   * Get current soul-link scores
   */
  getScores(): SoulLinkScores {
    return { ...this.scores };
  }
  
  /**
   * Get recent soul-link events
   */
  getEventHistory(): SoulLinkEvent[] {
    return [...this.eventHistory];
  }
  
  /**
   * Get relationship status label
   */
  getRelationshipStatus(): string {
    const strength = this.scores.bondStrength;
    
    if (strength < 20) return 'discovering';
    if (strength < 40) return 'acquainted';
    if (strength < 60) return 'familiar';
    if (strength < 80) return 'connected';
    return 'symbiotic';
  }
  
  /**
   * Get bond quality indicators
   */
  getBondQuality(): {
    stable: boolean;
    growing: boolean;
    harmonious: boolean;
    deep: boolean;
  } {
    const recentEvents = this.eventHistory.slice(-10);
    const positiveEvents = recentEvents.filter(e => e.score > 0).length;
    const avgScore = recentEvents.reduce((sum, e) => sum + e.score, 0) / Math.max(1, recentEvents.length);
    
    return {
      stable: this.scores.alignment > 60 && this.scores.resonance > 60,
      growing: avgScore > 2 && positiveEvents > 6,
      harmonious: this.scores.interactionHarmony > 70,
      deep: this.scores.engagementDepth > 70 && this.scores.daysConnected > 3
    };
  }
  
  /**
   * Reset soul-link (start over)
   */
  reset(): void {
    this.scores = {
      alignment: 50,
      resonance: 50,
      emotionalSynch: 50,
      interactionHarmony: 50,
      engagementDepth: 50,
      bondStrength: 50,
      daysConnected: 0,
      totalInteractions: 0,
      lastUpdate: Date.now()
    };
    this.eventHistory = [];
    this.previousMemory = null;
    this.previousExpression = null;
    this.consecutiveMatches = 0;
    this.flowStateTime = 0;
    localStorage.removeItem(this.storageKey);
  }
  
  // ============================================
  // SCORE UPDATES
  // ============================================
  
  /**
   * Alignment: How well entity understands user's patterns
   */
  private updateAlignment(memory: MemorySnapshot): void {
    if (!this.previousMemory) {
      this.scores.alignment = 50;
      return;
    }
    
    // Compare pattern stability (consistent behavior increases alignment)
    const moodStability = memory.moodPattern.moodStability;
    const rhythmConsistency = memory.interactionRhythm.rhythmConsistency;
    
    const stabilityScore = (moodStability + rhythmConsistency) / 2;
    
    // Slowly adjust alignment toward stability score
    const delta = (stabilityScore - this.scores.alignment) * 0.05;
    this.scores.alignment = this.clamp(this.scores.alignment + delta, 0, 100);
    
    // Bonus for long-term interaction
    if (memory.totalSessions > 10) {
      this.scores.alignment = Math.min(100, this.scores.alignment + 0.5);
      this.recordEvent({
        timestamp: Date.now(),
        type: 'alignment-gain',
        score: 2,
        reason: 'Long-term pattern recognition'
      });
    }
  }
  
  /**
   * Resonance: Emotional synchronization strength over time
   */
  private updateResonance(memory: MemorySnapshot, entity: EntityOutput): void {
    // Check if entity's presence aligns with user's emotional baseline
    const userBaseline = memory.emotionalResponse.baselineEmotion;
    const entityPresenceStrength = entity.presence.presenceStrength;
    const entityConnectionIntensity = entity.presence.connectionIntensity;
    
    // High presence + high connection = strong resonance potential
    const resonancePotential = (entityPresenceStrength + entityConnectionIntensity) / 2;
    
    // Slowly adjust resonance toward potential
    const delta = (resonancePotential - this.scores.resonance) * 0.03;
    this.scores.resonance = this.clamp(this.scores.resonance + delta, 0, 100);
    
    // Spike detection: If user is calm and entity detects it
    if (userBaseline === 'calm' && entity.presence.isWatching) {
      this.scores.resonance = Math.min(100, this.scores.resonance + 1);
      this.recordEvent({
        timestamp: Date.now(),
        type: 'resonance-spike',
        score: 3,
        reason: 'Entity recognized calm state'
      });
    }
  }
  
  /**
   * Emotional Synch: Real-time mood matching accuracy
   */
  private updateEmotionalSynch(memory: MemorySnapshot, expression: ExpressionOutput): void {
    if (!this.previousExpression) {
      this.scores.emotionalSynch = 50;
      return;
    }
    
    // Check if expression mood matches user's dominant mood
    const userMood = memory.moodPattern.dominantMood;
    const expressionMood = expression.mood.currentTone;
    
    // Map moods to comparable states
    const moodMap: Record<string, string> = {
      calm: 'calm',
      focused: 'intensity',
      alert: 'urgency',
      stressed: 'urgency',
      overclocked: 'intensity'
    };
    
    const userMappedMood = moodMap[userMood] || 'calm';
    const expressionMappedMood = expressionMood;
    
    if (userMappedMood === expressionMappedMood) {
      this.consecutiveMatches++;
      this.scores.emotionalSynch = Math.min(100, this.scores.emotionalSynch + 2);
      
      if (this.consecutiveMatches >= 5) {
        this.recordEvent({
          timestamp: Date.now(),
          type: 'synch-achieved',
          score: 5,
          reason: 'Sustained mood synchronization'
        });
        this.consecutiveMatches = 0;
      }
    } else {
      this.consecutiveMatches = 0;
      this.scores.emotionalSynch = Math.max(0, this.scores.emotionalSynch - 1);
    }
  }
  
  /**
   * Interaction Harmony: Flow and rhythm compatibility
   */
  private updateInteractionHarmony(memory: MemorySnapshot): void {
    const now = Date.now();
    const timeSinceLastCheck = (now - this.lastFlowCheck) / 1000;
    this.lastFlowCheck = now;
    
    // Check if user is in flow state
    const flowFrequency = memory.interactionRhythm.flowStateFrequency;
    const rhythmConsistency = memory.interactionRhythm.rhythmConsistency;
    
    if (flowFrequency > 70 && rhythmConsistency > 70) {
      this.flowStateTime += timeSinceLastCheck;
      this.scores.interactionHarmony = Math.min(100, this.scores.interactionHarmony + 0.5);
      
      if (this.flowStateTime > 300) { // 5 minutes of flow
        this.recordEvent({
          timestamp: Date.now(),
          type: 'harmony-flow',
          score: 8,
          reason: 'Extended flow state achieved'
        });
        this.flowStateTime = 0;
      }
    } else {
      this.flowStateTime = 0;
      this.scores.interactionHarmony = Math.max(0, this.scores.interactionHarmony - 0.2);
    }
    
    // Navigation harmony (if user navigates at steady pace)
    const navRhythm = memory.navigationPattern.navigationRhythm;
    if (navRhythm === 'moderate' || navRhythm === 'slow-deliberate') {
      this.scores.interactionHarmony = Math.min(100, this.scores.interactionHarmony + 0.3);
    }
  }
  
  /**
   * Engagement Depth: Level of mutual investment
   */
  private updateEngagementDepth(memory: MemorySnapshot, entity: EntityOutput): void {
    // Deep engagement indicators
    const deepFocusSessions = memory.engagementPattern.deepFocusSessions;
    const totalSessions = memory.totalSessions;
    const sessionRatio = totalSessions > 0 ? deepFocusSessions / totalSessions : 0;
    
    const avgIntensity = memory.engagementPattern.intensityAverage;
    const entityEmpathy = entity.empathy;
    
    // Calculate depth score
    const depthScore = (sessionRatio * 100 + avgIntensity + entityEmpathy) / 3;
    
    // Slowly adjust toward depth score
    const delta = (depthScore - this.scores.engagementDepth) * 0.04;
    this.scores.engagementDepth = this.clamp(this.scores.engagementDepth + delta, 0, 100);
    
    // Bonus for consistent long sessions
    if (deepFocusSessions > 5) {
      this.scores.engagementDepth = Math.min(100, this.scores.engagementDepth + 1);
      this.recordEvent({
        timestamp: Date.now(),
        type: 'depth-increase',
        score: 4,
        reason: 'Consistent deep engagement'
      });
    }
  }
  
  /**
   * Calculate overall bond strength (weighted average)
   */
  private calculateBondStrength(): void {
    const weights = {
      alignment: 0.2,
      resonance: 0.25,
      emotionalSynch: 0.2,
      interactionHarmony: 0.15,
      engagementDepth: 0.2
    };
    
    this.scores.bondStrength = 
      this.scores.alignment * weights.alignment +
      this.scores.resonance * weights.resonance +
      this.scores.emotionalSynch * weights.emotionalSynch +
      this.scores.interactionHarmony * weights.interactionHarmony +
      this.scores.engagementDepth * weights.engagementDepth;
  }
  
  // ============================================
  // EVENT TRACKING
  // ============================================
  
  private recordEvent(event: SoulLinkEvent): void {
    this.eventHistory.push(event);
    
    // Keep only last 50 events
    if (this.eventHistory.length > 50) {
      this.eventHistory.shift();
    }
  }
  
  // ============================================
  // STORAGE
  // ============================================
  
  private saveToStorage(): void {
    try {
      const data = {
        scores: this.scores,
        eventHistory: this.eventHistory.slice(-20) // Save last 20 events
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('[SoulLinkCore] Failed to save:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.scores = data.scores || this.scores;
        this.eventHistory = data.eventHistory || [];
      }
    } catch (error) {
      console.warn('[SoulLinkCore] Failed to load:', error);
    }
  }
  
  // ============================================
  // UTILITIES
  // ============================================
  
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  private calculateDaysConnected(firstInteraction: number): number {
    const now = Date.now();
    const diffMs = now - firstInteraction;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.floor(diffDays);
  }
}
