/**
 * LEVEL 11.2 — CONTEXTUAL MEMORY LAYER (CML)
 * 
 * Session-level memory that makes BagBot feel like it's carrying conversation with presence.
 * 100% privacy-safe - no personal data stored, only interaction patterns.
 * 
 * Architecture:
 * - Interaction pace tracking
 * - Preferred tone detection
 * - Pressure level monitoring
 * - Emotional mode continuity
 * - Identity context signals
 * 
 * This creates conversational presence without violating privacy.
 */

import { PersonalityVector } from './PersonalityVectorEngine';
import { EmotionalState, InteractionContext } from './PersonalityVectorEngine';
import { ToneType, BlendedTone } from './AdaptiveToneEngine';

// ================================
// MEMORY STRUCTURES
// ================================

/**
 * User interaction pattern
 */
export interface InteractionPattern {
  avgResponseTime: number; // milliseconds
  interactionSpeed: 'slow' | 'moderate' | 'fast' | 'very fast';
  messageLength: 'brief' | 'moderate' | 'detailed';
  questionFrequency: number; // per 10 messages
  directiveFrequency: number; // commands per 10 messages
}

/**
 * Preferred tone pattern
 */
export interface TonePreference {
  dominantTones: Array<{ tone: ToneType; frequency: number }>;
  toneShiftPatterns: Array<{ from: ToneType; to: ToneType; count: number }>;
  preferredIntensity: number; // 0-100
  consistencyScore: number; // 0-100: how consistent preferences are
}

/**
 * Pressure level tracking
 */
export interface PressureLevel {
  current: number; // 0-100
  trend: 'rising' | 'falling' | 'stable';
  sources: Array<'urgency' | 'complexity' | 'stakes' | 'stress' | 'frustration'>;
  peakTimestamp?: number;
  sustainedHigh: boolean; // true if high for >5 minutes
}

/**
 * Emotional mode continuity
 */
export interface EmotionalMode {
  dominant: keyof EmotionalState;
  secondary?: keyof EmotionalState;
  strength: number; // 0-100
  duration: number; // milliseconds in current mode
  stability: number; // 0-100: how stable the mode is
  lastTransition?: {
    from: keyof EmotionalState;
    to: keyof EmotionalState;
    timestamp: number;
  };
}

/**
 * Identity context signal
 */
export interface IdentityContextSignal {
  taskFocus: InteractionContext['taskType'];
  engagementLevel: number; // 0-100
  attentionQuality: 'scattered' | 'partial' | 'focused' | 'deep focus';
  conversationDepth: number; // 0-100
  relationshipStage: 'new' | 'warming' | 'established' | 'deep';
}

/**
 * Session memory snapshot
 */
export interface SessionMemory {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  
  interactionPattern: InteractionPattern;
  tonePreference: TonePreference;
  pressureLevel: PressureLevel;
  emotionalMode: EmotionalMode;
  identityContext: IdentityContextSignal;
  
  interactionCount: number;
  significantMoments: Array<{
    timestamp: number;
    type: 'breakthrough' | 'frustration' | 'celebration' | 'crisis' | 'insight';
    context: string;
  }>;
}

// ================================
// CONTEXTUAL MEMORY LAYER
// ================================

export class ContextualMemoryLayer {
  private sessionMemory: SessionMemory;
  private interactionHistory: Array<{
    timestamp: number;
    responseTime: number;
    messageLength: number;
    isQuestion: boolean;
    isDirective: boolean;
  }> = [];
  
  private toneHistory: Array<{
    timestamp: number;
    tone: ToneType;
    intensity: number;
  }> = [];
  
  private emotionalHistory: Array<{
    timestamp: number;
    state: EmotionalState;
  }> = [];
  
  private pressureHistory: Array<{
    timestamp: number;
    level: number;
    sources: PressureLevel['sources'];
  }> = [];
  
  private readonly MAX_INTERACTION_HISTORY = 100;
  private readonly MAX_TONE_HISTORY = 50;
  private readonly MAX_EMOTIONAL_HISTORY = 50;
  private readonly MAX_PRESSURE_HISTORY = 50;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor(sessionId?: string) {
    this.sessionMemory = this.createNewSession(sessionId);
  }

  /**
   * Create new session
   */
  private createNewSession(sessionId?: string): SessionMemory {
    return {
      sessionId: sessionId || `session_${Date.now()}`,
      startTime: Date.now(),
      lastActivity: Date.now(),
      
      interactionPattern: {
        avgResponseTime: 3000,
        interactionSpeed: 'moderate',
        messageLength: 'moderate',
        questionFrequency: 3,
        directiveFrequency: 5,
      },
      
      tonePreference: {
        dominantTones: [],
        toneShiftPatterns: [],
        preferredIntensity: 60,
        consistencyScore: 50,
      },
      
      pressureLevel: {
        current: 30,
        trend: 'stable',
        sources: [],
        sustainedHigh: false,
      },
      
      emotionalMode: {
        dominant: 'calmness',
        strength: 60,
        duration: 0,
        stability: 80,
      },
      
      identityContext: {
        taskFocus: 'exploration',
        engagementLevel: 60,
        attentionQuality: 'focused',
        conversationDepth: 40,
        relationshipStage: 'new',
      },
      
      interactionCount: 0,
      significantMoments: [],
    };
  }

  /**
   * Record interaction
   */
  recordInteraction(
    userInput: string,
    responseTime: number,
    context: InteractionContext
  ): void {
    const now = Date.now();
    
    // Update session
    this.sessionMemory.lastActivity = now;
    this.sessionMemory.interactionCount++;
    
    // Record interaction details
    const words = userInput.split(/\s+/).length;
    const isQuestion = userInput.includes('?');
    const isDirective = /^(do|create|build|make|show|give|tell|explain|add|update|fix)/i.test(userInput);
    
    this.interactionHistory.push({
      timestamp: now,
      responseTime,
      messageLength: words,
      isQuestion,
      isDirective,
    });
    
    if (this.interactionHistory.length > this.MAX_INTERACTION_HISTORY) {
      this.interactionHistory.shift();
    }
    
    // Update interaction pattern
    this.updateInteractionPattern();
    
    // Update identity context
    this.updateIdentityContext(context);
  }

  /**
   * Record tone usage
   */
  recordTone(tone: BlendedTone): void {
    const now = Date.now();
    
    this.toneHistory.push({
      timestamp: now,
      tone: tone.primary,
      intensity: tone.intensity,
    });
    
    if (this.toneHistory.length > this.MAX_TONE_HISTORY) {
      this.toneHistory.shift();
    }
    
    // Update tone preference
    this.updateTonePreference();
  }

  /**
   * Record emotional state
   */
  recordEmotionalState(state: EmotionalState): void {
    const now = Date.now();
    
    this.emotionalHistory.push({
      timestamp: now,
      state,
    });
    
    if (this.emotionalHistory.length > this.MAX_EMOTIONAL_HISTORY) {
      this.emotionalHistory.shift();
    }
    
    // Update emotional mode
    this.updateEmotionalMode();
  }

  /**
   * Record pressure level
   */
  recordPressure(context: InteractionContext, emotionalState: EmotionalState): void {
    const now = Date.now();
    
    // Calculate pressure from multiple sources
    const sources: PressureLevel['sources'] = [];
    let pressure = 0;
    
    if (context.urgency > 60) {
      sources.push('urgency');
      pressure += context.urgency * 0.3;
    }
    
    if (context.complexity > 70) {
      sources.push('complexity');
      pressure += context.complexity * 0.2;
    }
    
    if (context.stakesLevel === 'critical') {
      sources.push('stakes');
      pressure += 40;
    } else if (context.stakesLevel === 'high') {
      sources.push('stakes');
      pressure += 25;
    }
    
    if (emotionalState.stress > 60) {
      sources.push('stress');
      pressure += emotionalState.stress * 0.3;
    }
    
    if (emotionalState.frustration > 60) {
      sources.push('frustration');
      pressure += emotionalState.frustration * 0.25;
    }
    
    pressure = Math.min(100, pressure);
    
    this.pressureHistory.push({
      timestamp: now,
      level: pressure,
      sources,
    });
    
    if (this.pressureHistory.length > this.MAX_PRESSURE_HISTORY) {
      this.pressureHistory.shift();
    }
    
    // Update pressure level
    this.updatePressureLevel();
  }

  /**
   * Update interaction pattern
   */
  private updateInteractionPattern(): void {
    if (this.interactionHistory.length < 2) return;
    
    // Calculate average response time
    const avgResponseTime = this.interactionHistory
      .reduce((sum, i) => sum + i.responseTime, 0) / this.interactionHistory.length;
    
    // Determine speed
    let interactionSpeed: InteractionPattern['interactionSpeed'] = 'moderate';
    if (avgResponseTime < 1000) {
      interactionSpeed = 'very fast';
    } else if (avgResponseTime < 3000) {
      interactionSpeed = 'fast';
    } else if (avgResponseTime > 10000) {
      interactionSpeed = 'slow';
    }
    
    // Calculate average message length
    const avgLength = this.interactionHistory
      .reduce((sum, i) => sum + i.messageLength, 0) / this.interactionHistory.length;
    
    let messageLength: InteractionPattern['messageLength'] = 'moderate';
    if (avgLength < 10) {
      messageLength = 'brief';
    } else if (avgLength > 30) {
      messageLength = 'detailed';
    }
    
    // Count questions and directives in last 10 interactions
    const recent10 = this.interactionHistory.slice(-10);
    const questionFrequency = recent10.filter(i => i.isQuestion).length;
    const directiveFrequency = recent10.filter(i => i.isDirective).length;
    
    this.sessionMemory.interactionPattern = {
      avgResponseTime,
      interactionSpeed,
      messageLength,
      questionFrequency,
      directiveFrequency,
    };
  }

  /**
   * Update tone preference
   */
  private updateTonePreference(): void {
    if (this.toneHistory.length < 3) return;
    
    // Count tone frequencies
    const toneCount = new Map<ToneType, number>();
    this.toneHistory.forEach(t => {
      toneCount.set(t.tone, (toneCount.get(t.tone) || 0) + 1);
    });
    
    // Create dominant tones array
    const dominantTones = Array.from(toneCount.entries())
      .map(([tone, count]) => ({
        tone,
        frequency: (count / this.toneHistory.length) * 100,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3);
    
    // Detect tone shift patterns
    const shiftPatterns = new Map<string, number>();
    for (let i = 1; i < this.toneHistory.length; i++) {
      const from = this.toneHistory[i - 1].tone;
      const to = this.toneHistory[i].tone;
      if (from !== to) {
        const key = `${from}->${to}`;
        shiftPatterns.set(key, (shiftPatterns.get(key) || 0) + 1);
      }
    }
    
    const toneShiftPatterns = Array.from(shiftPatterns.entries())
      .map(([pattern, count]) => {
        const [from, to] = pattern.split('->') as [ToneType, ToneType];
        return { from, to, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate preferred intensity
    const avgIntensity = this.toneHistory
      .reduce((sum, t) => sum + t.intensity, 0) / this.toneHistory.length;
    
    // Calculate consistency score
    const topToneFreq = dominantTones[0]?.frequency || 0;
    const consistencyScore = Math.min(100, topToneFreq * 2);
    
    this.sessionMemory.tonePreference = {
      dominantTones,
      toneShiftPatterns,
      preferredIntensity: avgIntensity,
      consistencyScore,
    };
  }

  /**
   * Update emotional mode
   */
  private updateEmotionalMode(): void {
    if (this.emotionalHistory.length === 0) return;
    
    const recent = this.emotionalHistory.slice(-5);
    
    // Find dominant emotion
    const emotionSums = {
      calmness: 0,
      excitement: 0,
      frustration: 0,
      satisfaction: 0,
      stress: 0,
      joy: 0,
      concern: 0,
      confidence: 0,
    };
    
    recent.forEach(e => {
      Object.keys(emotionSums).forEach(emotion => {
        emotionSums[emotion as keyof EmotionalState] += e.state[emotion as keyof EmotionalState];
      });
    });
    
    const emotionAvgs = Object.entries(emotionSums).map(([emotion, sum]) => ({
      emotion: emotion as keyof EmotionalState,
      avg: sum / recent.length,
    }));
    
    emotionAvgs.sort((a, b) => b.avg - a.avg);
    
    const dominant = emotionAvgs[0].emotion;
    const secondary = emotionAvgs[1].emotion;
    const strength = emotionAvgs[0].avg;
    
    // Calculate duration in current mode
    const now = Date.now();
    let duration = 0;
    
    if (this.sessionMemory.emotionalMode.dominant === dominant) {
      duration = this.sessionMemory.emotionalMode.duration + (now - this.emotionalHistory[this.emotionalHistory.length - 1].timestamp);
    }
    
    // Calculate stability (how consistent emotions are)
    const variance = emotionAvgs.reduce((sum, e) => 
      sum + Math.pow(e.avg - strength, 2), 0) / emotionAvgs.length;
    const stability = Math.max(0, 100 - variance);
    
    // Detect transition
    let lastTransition = this.sessionMemory.emotionalMode.lastTransition;
    if (this.sessionMemory.emotionalMode.dominant !== dominant) {
      lastTransition = {
        from: this.sessionMemory.emotionalMode.dominant,
        to: dominant,
        timestamp: now,
      };
    }
    
    this.sessionMemory.emotionalMode = {
      dominant,
      secondary: secondary !== dominant ? secondary : undefined,
      strength,
      duration,
      stability,
      lastTransition,
    };
  }

  /**
   * Update pressure level
   */
  private updatePressureLevel(): void {
    if (this.pressureHistory.length === 0) return;
    
    const recent = this.pressureHistory.slice(-5);
    const current = recent[recent.length - 1].level;
    
    // Determine trend
    let trend: PressureLevel['trend'] = 'stable';
    if (recent.length >= 3) {
      const first = recent[0].level;
      const last = recent[recent.length - 1].level;
      
      if (last - first > 15) {
        trend = 'rising';
      } else if (first - last > 15) {
        trend = 'falling';
      }
    }
    
    // Collect unique sources
    const allSources = new Set<PressureLevel['sources'][number]>();
    recent.forEach(p => {
      p.sources.forEach(s => allSources.add(s));
    });
    
    // Check for sustained high pressure
    const highPressureCount = recent.filter(p => p.level > 70).length;
    const sustainedHigh = highPressureCount >= 3;
    
    // Find peak
    const peakEntry = this.pressureHistory.reduce((max, p) => 
      p.level > max.level ? p : max
    );
    
    this.sessionMemory.pressureLevel = {
      current,
      trend,
      sources: Array.from(allSources),
      peakTimestamp: peakEntry.level > 75 ? peakEntry.timestamp : undefined,
      sustainedHigh,
    };
  }

  /**
   * Update identity context
   */
  private updateIdentityContext(context: InteractionContext): void {
    // Update task focus
    this.sessionMemory.identityContext.taskFocus = context.taskType;
    
    // Calculate engagement level
    const engagementLevel = Math.min(100, 
      context.urgency * 0.3 + 
      context.focusRequired * 0.4 + 
      this.sessionMemory.interactionPattern.questionFrequency * 3
    );
    
    // Determine attention quality
    let attentionQuality: IdentityContextSignal['attentionQuality'] = 'focused';
    if (context.focusRequired > 80) {
      attentionQuality = 'deep focus';
    } else if (context.focusRequired < 40) {
      attentionQuality = 'scattered';
    } else if (context.focusRequired < 60) {
      attentionQuality = 'partial';
    }
    
    // Calculate conversation depth
    const conversationDepth = Math.min(100,
      (this.sessionMemory.interactionCount / 10) * 20 +
      this.sessionMemory.identityContext.conversationDepth * 0.8
    );
    
    // Determine relationship stage
    let relationshipStage: IdentityContextSignal['relationshipStage'] = 'new';
    if (this.sessionMemory.interactionCount > 50) {
      relationshipStage = 'deep';
    } else if (this.sessionMemory.interactionCount > 20) {
      relationshipStage = 'established';
    } else if (this.sessionMemory.interactionCount > 5) {
      relationshipStage = 'warming';
    }
    
    this.sessionMemory.identityContext = {
      taskFocus: context.taskType,
      engagementLevel,
      attentionQuality,
      conversationDepth,
      relationshipStage,
    };
  }

  /**
   * Record significant moment
   */
  recordSignificantMoment(
    type: SessionMemory['significantMoments'][number]['type'],
    context: string
  ): void {
    this.sessionMemory.significantMoments.push({
      timestamp: Date.now(),
      type,
      context,
    });
    
    // Keep only last 20
    if (this.sessionMemory.significantMoments.length > 20) {
      this.sessionMemory.significantMoments.shift();
    }
  }

  /**
   * Get session memory
   */
  getSessionMemory(): SessionMemory {
    return JSON.parse(JSON.stringify(this.sessionMemory));
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    const now = Date.now();
    return (now - this.sessionMemory.lastActivity) < this.SESSION_TIMEOUT;
  }

  /**
   * Reset session
   */
  resetSession(): void {
    const newSessionId = `session_${Date.now()}`;
    this.sessionMemory = this.createNewSession(newSessionId);
    this.interactionHistory = [];
    this.toneHistory = [];
    this.emotionalHistory = [];
    this.pressureHistory = [];
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionMemory.startTime;
  }

  /**
   * Get session summary
   */
  getSessionSummary(): {
    duration: string;
    interactions: number;
    dominantEmotion: string;
    averagePressure: number;
    relationshipStage: string;
    significantMoments: number;
  } {
    const duration = this.getSessionDuration();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    const avgPressure = this.pressureHistory.length > 0
      ? this.pressureHistory.reduce((sum, p) => sum + p.level, 0) / this.pressureHistory.length
      : 30;
    
    return {
      duration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      interactions: this.sessionMemory.interactionCount,
      dominantEmotion: this.sessionMemory.emotionalMode.dominant,
      averagePressure: Math.round(avgPressure),
      relationshipStage: this.sessionMemory.identityContext.relationshipStage,
      significantMoments: this.sessionMemory.significantMoments.length,
    };
  }

  /**
   * Export session data
   */
  export(): string {
    return JSON.stringify({
      sessionMemory: this.sessionMemory,
      interactionHistory: this.interactionHistory.slice(-20),
      toneHistory: this.toneHistory.slice(-20),
      emotionalHistory: this.emotionalHistory.slice(-20),
      pressureHistory: this.pressureHistory.slice(-20),
    });
  }

  /**
   * Import session data
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      this.sessionMemory = data.sessionMemory;
      this.interactionHistory = data.interactionHistory;
      this.toneHistory = data.toneHistory;
      this.emotionalHistory = data.emotionalHistory;
      this.pressureHistory = data.pressureHistory;
      
      return true;
    } catch (error) {
      console.error('Failed to import CML state:', error);
      return false;
    }
  }
}
