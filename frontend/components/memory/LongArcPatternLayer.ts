/**
 * LEVEL 13.1 — LONG-ARC PATTERN LAYER
 * 
 * Detects recurring behaviors, preferences, and patterns over time.
 * Long-term pattern recognition without personal data storage.
 * 
 * Features:
 * - Behavioral pattern detection
 * - Preference learning (no PII)
 * - Interaction style tracking
 * - Topic affinity scoring
 * - Command usage frequency
 * - Temporal pattern recognition
 * 
 * Retention: Session-based aggregates (no raw data persistence)
 * Privacy: No identifiable personal information stored
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface BehaviorPattern {
  patternId: string;
  type: PatternType;
  description: string;
  frequency: number; // times observed
  confidence: number; // 0-100
  firstObserved: number;
  lastObserved: number;
  strength: number; // 0-100 (how strong the pattern is)
}

type PatternType =
  | 'command-sequence'
  | 'topic-preference'
  | 'interaction-style'
  | 'time-of-use'
  | 'complexity-preference'
  | 'feedback-pattern';

interface Preference {
  preferenceId: string;
  category: PreferenceCategory;
  key: string; // e.g., "code-style", "explanation-depth"
  value: string | number; // e.g., "concise", 7
  confidence: number; // 0-100
  observationCount: number;
  lastUpdated: number;
}

type PreferenceCategory =
  | 'communication'
  | 'technical'
  | 'workflow'
  | 'ui'
  | 'domain';

interface InteractionStyle {
  styleId: string;
  characteristics: {
    directness: number; // 0-100
    detailOrientation: number; // 0-100
    technicalDepth: number; // 0-100
    formality: number; // 0-100
  };
  averageMessageLength: number;
  questionToCommandRatio: number;
  feedbackFrequency: number; // per 10 interactions
  preferredComplexity: 'simple' | 'moderate' | 'advanced';
}

interface TopicAffinity {
  topic: string;
  affinityScore: number; // 0-100
  interactionCount: number;
  successCount: number; // count of successful interactions
  successRate: number; // 0-100 (positive outcomes)
  averageDuration: number; // seconds per interaction
  lastInteraction: number;
}

interface CommandUsage {
  command: string;
  useCount: number;
  successCount: number;
  failCount: number;
  averageExecutionTime: number; // ms
  lastUsed: number;
  usagePattern: 'frequent' | 'occasional' | 'rare';
}

interface TemporalPattern {
  patternId: string;
  description: string;
  timeOfDay: number[]; // hours when observed (0-23)
  daysOfWeek: number[]; // days when observed (0-6)
  frequency: number;
  confidence: number; // 0-100
}

interface PatternAnalysis {
  topPatterns: BehaviorPattern[];
  strongPreferences: Preference[];
  dominantStyle: InteractionStyle | null;
  topicAffinities: TopicAffinity[];
  commandUsage: CommandUsage[];
  temporalPatterns: TemporalPattern[];
}

interface LongArcPatternConfig {
  minPatternFrequency: number; // minimum observations
  minConfidenceThreshold: number; // minimum confidence to track
  maxPatterns: number;
  maxPreferences: number;
  decayRate: number; // pattern strength decay per day
}

/* ================================ */
/* LONG-ARC PATTERN LAYER           */
/* ================================ */

export class LongArcPatternLayer {
  private config: LongArcPatternConfig;

  // Pattern State
  private patterns: Map<string, BehaviorPattern>;
  private preferences: Map<string, Preference>;
  private interactionStyle: InteractionStyle | null;
  private topicAffinities: Map<string, TopicAffinity>;
  private commandUsage: Map<string, CommandUsage>;
  private temporalPatterns: Map<string, TemporalPattern>;

  // Tracking
  private lastDecayTimestamp: number;

  constructor(config?: Partial<LongArcPatternConfig>) {
    this.config = {
      minPatternFrequency: 3,
      minConfidenceThreshold: 60,
      maxPatterns: 50,
      maxPreferences: 30,
      decayRate: 0.02, // 2% per day
      ...config,
    };

    this.patterns = new Map();
    this.preferences = new Map();
    this.interactionStyle = null;
    this.topicAffinities = new Map();
    this.commandUsage = new Map();
    this.temporalPatterns = new Map();

    this.lastDecayTimestamp = Date.now();
  }

  /* ================================ */
  /* PATTERN DETECTION                */
  /* ================================ */

  public observePattern(
    type: PatternType,
    description: string
  ): string {
    const now = Date.now();

    // Check if pattern exists
    const existingPattern = Array.from(this.patterns.values()).find(
      p => p.type === type && p.description === description
    );

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastObserved = now;
      existingPattern.confidence = Math.min(100, existingPattern.confidence + 5);
      existingPattern.strength = this.calculatePatternStrength(existingPattern);

      return existingPattern.patternId;
    }

    // Create new pattern
    const pattern: BehaviorPattern = {
      patternId: `pattern_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      frequency: 1,
      confidence: 50,
      firstObserved: now,
      lastObserved: now,
      strength: 50,
    };

    this.patterns.set(pattern.patternId, pattern);

    // Prune if exceeding max
    this.prunePatterns();

    return pattern.patternId;
  }

  private calculatePatternStrength(pattern: BehaviorPattern): number {
    const now = Date.now();
    const daysSinceFirst = (now - pattern.firstObserved) / (24 * 60 * 60 * 1000);

    // Frequency score (normalized)
    const frequencyScore = Math.min(100, (pattern.frequency / (daysSinceFirst + 1)) * 50);

    // Recency score
    const daysSinceLast = (now - pattern.lastObserved) / (24 * 60 * 60 * 1000);
    const recencyScore = Math.max(0, 100 - daysSinceLast * 10);

    // Combined strength
    return (frequencyScore * 0.6 + recencyScore * 0.4);
  }

  private prunePatterns(): void {
    // Remove weak patterns if exceeding max
    if (this.patterns.size > this.config.maxPatterns) {
      const sorted = Array.from(this.patterns.values()).sort((a, b) => a.strength - b.strength);
      const toRemove = sorted.slice(0, this.patterns.size - this.config.maxPatterns);

      for (const pattern of toRemove) {
        this.patterns.delete(pattern.patternId);
      }
    }
  }

  public getPatterns(minStrength: number = 60): BehaviorPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.strength >= minStrength)
      .sort((a, b) => b.strength - a.strength);
  }

  public getPatternsByType(type: PatternType): BehaviorPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.type === type);
  }

  /* ================================ */
  /* PREFERENCE LEARNING              */
  /* ================================ */

  public learnPreference(
    category: PreferenceCategory,
    key: string,
    value: string | number
  ): void {
    const now = Date.now();
    const prefKey = `${category}:${key}`;

    if (this.preferences.has(prefKey)) {
      const pref = this.preferences.get(prefKey)!;
      pref.value = value;
      pref.observationCount++;
      pref.confidence = Math.min(100, pref.confidence + 5);
      pref.lastUpdated = now;
    } else {
      const preference: Preference = {
        preferenceId: `pref_${now}_${Math.random().toString(36).substr(2, 9)}`,
        category,
        key,
        value,
        confidence: 60,
        observationCount: 1,
        lastUpdated: now,
      };

      this.preferences.set(prefKey, preference);
    }

    // Prune if exceeding max
    this.prunePreferences();
  }

  private prunePreferences(): void {
    if (this.preferences.size > this.config.maxPreferences) {
      const sorted = Array.from(this.preferences.values()).sort((a, b) => a.confidence - b.confidence);
      const toRemove = sorted.slice(0, this.preferences.size - this.config.maxPreferences);

      for (const pref of toRemove) {
        const key = `${pref.category}:${pref.key}`;
        this.preferences.delete(key);
      }
    }
  }

  public getPreferences(minConfidence: number = 70): Preference[] {
    return Array.from(this.preferences.values())
      .filter(p => p.confidence >= minConfidence)
      .sort((a, b) => b.confidence - a.confidence);
  }

  public getPreferencesByCategory(category: PreferenceCategory): Preference[] {
    return Array.from(this.preferences.values()).filter(p => p.category === category);
  }

  /* ================================ */
  /* INTERACTION STYLE                */
  /* ================================ */

  public updateInteractionStyle(
    messageLength: number,
    isQuestion: boolean,
    hasFeedback: boolean,
    complexity: 'simple' | 'moderate' | 'advanced'
  ): void {
    if (!this.interactionStyle) {
      this.interactionStyle = {
        styleId: `style_${Date.now()}`,
        characteristics: {
          directness: 50,
          detailOrientation: 50,
          technicalDepth: 50,
          formality: 50,
        },
        averageMessageLength: messageLength,
        questionToCommandRatio: isQuestion ? 1 : 0,
        feedbackFrequency: hasFeedback ? 1 : 0,
        preferredComplexity: complexity,
      };
      return;
    }

    // Update moving averages
    const alpha = 0.1; // smoothing factor

    this.interactionStyle.averageMessageLength =
      this.interactionStyle.averageMessageLength * (1 - alpha) + messageLength * alpha;

    const questionValue = isQuestion ? 1 : 0;
    this.interactionStyle.questionToCommandRatio =
      this.interactionStyle.questionToCommandRatio * (1 - alpha) + questionValue * alpha;

    const feedbackValue = hasFeedback ? 1 : 0;
    this.interactionStyle.feedbackFrequency =
      this.interactionStyle.feedbackFrequency * (1 - alpha) + feedbackValue * alpha;

    // Update complexity preference
    if (complexity !== this.interactionStyle.preferredComplexity) {
      this.interactionStyle.preferredComplexity = complexity;
    }
  }

  public getInteractionStyle(): InteractionStyle | null {
    return this.interactionStyle ? { ...this.interactionStyle } : null;
  }

  /* ================================ */
  /* TOPIC AFFINITY                   */
  /* ================================ */

  public recordTopicInteraction(
    topic: string,
    duration: number,
    wasSuccessful: boolean
  ): void {
    const now = Date.now();

    if (this.topicAffinities.has(topic)) {
      const affinity = this.topicAffinities.get(topic)!;
      affinity.interactionCount++;

      if (wasSuccessful) {
        affinity.successCount = (affinity.successCount || 0) + 1;
      }

      affinity.successRate = ((affinity.successCount || 0) / affinity.interactionCount) * 100;

      // Update average duration
      const alpha = 0.2;
      affinity.averageDuration = affinity.averageDuration * (1 - alpha) + duration * alpha;

      affinity.lastInteraction = now;

      // Update affinity score
      affinity.affinityScore = this.calculateTopicAffinity(affinity);
    } else {
      const affinity: TopicAffinity = {
        topic,
        affinityScore: 60,
        interactionCount: 1,
        successCount: wasSuccessful ? 1 : 0,
        successRate: wasSuccessful ? 100 : 0,
        averageDuration: duration,
        lastInteraction: now,
      };

      this.topicAffinities.set(topic, affinity);
    }
  }

  private calculateTopicAffinity(affinity: TopicAffinity): number {
    // Factors: interaction count, success rate, recency
    const countScore = Math.min(100, affinity.interactionCount * 10);
    const successScore = affinity.successRate;

    const now = Date.now();
    const daysSinceLast = (now - affinity.lastInteraction) / (24 * 60 * 60 * 1000);
    const recencyScore = Math.max(0, 100 - daysSinceLast * 5);

    return (countScore * 0.4 + successScore * 0.3 + recencyScore * 0.3);
  }

  public getTopicAffinities(minScore: number = 60): TopicAffinity[] {
    return Array.from(this.topicAffinities.values())
      .filter(a => a.affinityScore >= minScore)
      .sort((a, b) => b.affinityScore - a.affinityScore);
  }

  /* ================================ */
  /* COMMAND USAGE                    */
  /* ================================ */

  public recordCommandUsage(
    command: string,
    executionTime: number,
    wasSuccessful: boolean
  ): void {
    const now = Date.now();

    if (this.commandUsage.has(command)) {
      const usage = this.commandUsage.get(command)!;
      usage.useCount++;

      if (wasSuccessful) {
        usage.successCount++;
      } else {
        usage.failCount++;
      }

      // Update average execution time
      const alpha = 0.2;
      usage.averageExecutionTime = usage.averageExecutionTime * (1 - alpha) + executionTime * alpha;

      usage.lastUsed = now;

      // Update usage pattern
      usage.usagePattern = this.determineUsagePattern(usage.useCount);
    } else {
      const usage: CommandUsage = {
        command,
        useCount: 1,
        successCount: wasSuccessful ? 1 : 0,
        failCount: wasSuccessful ? 0 : 1,
        averageExecutionTime: executionTime,
        lastUsed: now,
        usagePattern: 'rare',
      };

      this.commandUsage.set(command, usage);
    }
  }

  private determineUsagePattern(useCount: number): 'frequent' | 'occasional' | 'rare' {
    if (useCount >= 20) return 'frequent';
    if (useCount >= 5) return 'occasional';
    return 'rare';
  }

  public getCommandUsage(): CommandUsage[] {
    return Array.from(this.commandUsage.values())
      .sort((a, b) => b.useCount - a.useCount);
  }

  public getFrequentCommands(): CommandUsage[] {
    return Array.from(this.commandUsage.values()).filter(c => c.usagePattern === 'frequent');
  }

  /* ================================ */
  /* TEMPORAL PATTERNS                */
  /* ================================ */

  public recordTemporalPattern(description: string): void {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Check if pattern exists
    const existing = Array.from(this.temporalPatterns.values()).find(
      p => p.description === description
    );

    if (existing) {
      if (!existing.timeOfDay.includes(hour)) {
        existing.timeOfDay.push(hour);
      }
      if (!existing.daysOfWeek.includes(day)) {
        existing.daysOfWeek.push(day);
      }
      existing.frequency++;
      existing.confidence = Math.min(100, existing.confidence + 5);
    } else {
      const pattern: TemporalPattern = {
        patternId: `temporal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description,
        timeOfDay: [hour],
        daysOfWeek: [day],
        frequency: 1,
        confidence: 50,
      };

      this.temporalPatterns.set(pattern.patternId, pattern);
    }
  }

  public getTemporalPatterns(minConfidence: number = 60): TemporalPattern[] {
    return Array.from(this.temporalPatterns.values())
      .filter(p => p.confidence >= minConfidence)
      .sort((a, b) => b.frequency - a.frequency);
  }

  /* ================================ */
  /* PATTERN DECAY                    */
  /* ================================ */

  private applyDecay(): void {
    const now = Date.now();
    const daysSinceLastDecay = (now - this.lastDecayTimestamp) / (24 * 60 * 60 * 1000);

    if (daysSinceLastDecay < 1) return; // Only decay once per day

    const decayFactor = Math.pow(1 - this.config.decayRate, daysSinceLastDecay);

    // Decay patterns
    const patternArray = Array.from(this.patterns.values());
    for (const pattern of patternArray) {
      pattern.strength *= decayFactor;
    }

    // Decay preferences
    const prefArray = Array.from(this.preferences.values());
    for (const pref of prefArray) {
      pref.confidence *= decayFactor;
    }

    // Decay topic affinities
    const affinityArray = Array.from(this.topicAffinities.values());
    for (const affinity of affinityArray) {
      affinity.affinityScore *= decayFactor;
    }

    this.lastDecayTimestamp = now;
  }

  /* ================================ */
  /* PATTERN ANALYSIS                 */
  /* ================================ */

  public analyzePatterns(): PatternAnalysis {
    this.applyDecay();

    return {
      topPatterns: this.getPatterns(70).slice(0, 10),
      strongPreferences: this.getPreferences(80).slice(0, 10),
      dominantStyle: this.getInteractionStyle(),
      topicAffinities: this.getTopicAffinities(70).slice(0, 10),
      commandUsage: this.getCommandUsage().slice(0, 10),
      temporalPatterns: this.getTemporalPatterns(70).slice(0, 10),
    };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      patterns: Array.from(this.patterns.values()),
      preferences: Array.from(this.preferences.values()),
      interactionStyle: this.interactionStyle,
      topicAffinities: Array.from(this.topicAffinities.values()),
      commandUsage: Array.from(this.commandUsage.values()),
      temporalPatterns: Array.from(this.temporalPatterns.values()),
      lastDecayTimestamp: this.lastDecayTimestamp,
    };
  }

  public getSummary(): string {
    const patterns = this.getPatterns(70);
    const preferences = this.getPreferences(80);
    const topAffinities = this.getTopicAffinities(70).slice(0, 3);
    const frequentCommands = this.getFrequentCommands();

    return `Long-Arc Pattern Layer Summary:
  Behavior Patterns: ${patterns.length}
  Strong Preferences: ${preferences.length}
  Topic Affinities: ${topAffinities.map(a => a.topic).join(', ') || 'None'}
  Frequent Commands: ${frequentCommands.length}
  Temporal Patterns: ${this.temporalPatterns.size}
  Interaction Style: ${this.interactionStyle ? 'Detected' : 'Learning'}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.patterns.clear();
    this.preferences.clear();
    this.interactionStyle = null;
    this.topicAffinities.clear();
    this.commandUsage.clear();
    this.temporalPatterns.clear();
    this.lastDecayTimestamp = Date.now();
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      const state = parsed.state;
      this.lastDecayTimestamp = state.lastDecayTimestamp;
      this.interactionStyle = state.interactionStyle;

      // Restore maps
      this.patterns.clear();
      for (const pattern of state.patterns) {
        this.patterns.set(pattern.patternId, pattern);
      }

      this.preferences.clear();
      for (const pref of state.preferences) {
        const key = `${pref.category}:${pref.key}`;
        this.preferences.set(key, pref);
      }

      this.topicAffinities.clear();
      for (const affinity of state.topicAffinities) {
        this.topicAffinities.set(affinity.topic, affinity);
      }

      this.commandUsage.clear();
      for (const usage of state.commandUsage) {
        this.commandUsage.set(usage.command, usage);
      }

      this.temporalPatterns.clear();
      for (const pattern of state.temporalPatterns) {
        this.temporalPatterns.set(pattern.patternId, pattern);
      }
    } catch (error) {
      console.error('[LongArcPatternLayer] Import failed:', error);
    }
  }
}
