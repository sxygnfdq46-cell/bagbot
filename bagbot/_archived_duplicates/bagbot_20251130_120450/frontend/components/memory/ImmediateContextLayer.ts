/**
 * LEVEL 13.1 — IMMEDIATE CONTEXT LAYER
 * 
 * Tracks current conversation threads, immediate context, and active topics.
 * Ephemeral layer with sliding window - no permanent storage.
 * 
 * Features:
 * - Conversation thread tracking
 * - Active topic detection
 * - Context window management (sliding)
 * - Turn-by-turn memory
 * - Topic coherence scoring
 * - Recency-weighted relevance
 * 
 * Retention: Last N turns only (default 50)
 * Privacy: Zero persistent storage (session-only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface ConversationTurn {
  turnId: string;
  timestamp: number;
  userMessage: string;
  botResponse: string;
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: number; // 0-100
}

interface ActiveTopic {
  topic: string;
  firstMention: number; // timestamp
  lastMention: number; // timestamp
  mentionCount: number;
  relevance: number; // 0-100 (recency-weighted)
  relatedTopics: string[];
}

interface ContextWindow {
  turns: ConversationTurn[];
  maxTurns: number;
  currentTurnCount: number;
  oldestTurnTimestamp: number;
  newestTurnTimestamp: number;
}

interface CoherenceScore {
  overall: number; // 0-100
  topicContinuity: number; // 0-100
  sentimentStability: number; // 0-100
  intentClarity: number; // 0-100
}

interface ImmediateContextConfig {
  maxTurns: number; // sliding window size
  relevanceDecayRate: number; // 0-1 per minute
  importanceThreshold: number; // minimum to keep
  topicDetectionEnabled: boolean;
  sentimentTrackingEnabled: boolean;
}

/* ================================ */
/* IMMEDIATE CONTEXT LAYER          */
/* ================================ */

export class ImmediateContextLayer {
  private config: ImmediateContextConfig;
  
  // Context State
  private contextWindow: ContextWindow;
  private activeTopics: Map<string, ActiveTopic>;
  
  // Coherence Tracking
  private coherenceScore: CoherenceScore;
  
  // Recency Tracking
  private lastUpdateTimestamp: number;

  constructor(config?: Partial<ImmediateContextConfig>) {
    this.config = {
      maxTurns: 50,
      relevanceDecayRate: 0.05, // 5% per minute
      importanceThreshold: 30,
      topicDetectionEnabled: true,
      sentimentTrackingEnabled: true,
      ...config,
    };

    // Initialize context window
    this.contextWindow = {
      turns: [],
      maxTurns: this.config.maxTurns,
      currentTurnCount: 0,
      oldestTurnTimestamp: 0,
      newestTurnTimestamp: 0,
    };

    this.activeTopics = new Map();

    this.coherenceScore = {
      overall: 100,
      topicContinuity: 100,
      sentimentStability: 100,
      intentClarity: 100,
    };

    this.lastUpdateTimestamp = Date.now();
  }

  /* ================================ */
  /* TURN MANAGEMENT                  */
  /* ================================ */

  public addTurn(
    userMessage: string,
    botResponse: string,
    topics: string[] = [],
    sentiment: 'positive' | 'neutral' | 'negative' = 'neutral',
    importance: number = 50
  ): void {
    const now = Date.now();

    const turn: ConversationTurn = {
      turnId: `turn_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      userMessage,
      botResponse,
      topics: this.config.topicDetectionEnabled ? topics : [],
      sentiment: this.config.sentimentTrackingEnabled ? sentiment : 'neutral',
      importance: Math.max(0, Math.min(100, importance)),
    };

    // Add to window
    this.contextWindow.turns.push(turn);
    this.contextWindow.currentTurnCount++;
    this.contextWindow.newestTurnTimestamp = now;

    if (this.contextWindow.turns.length === 1) {
      this.contextWindow.oldestTurnTimestamp = now;
    }

    // Slide window if exceeds max
    if (this.contextWindow.turns.length > this.contextWindow.maxTurns) {
      this.contextWindow.turns.shift();
      this.contextWindow.oldestTurnTimestamp = this.contextWindow.turns[0]?.timestamp || now;
    }

    // Update active topics
    if (this.config.topicDetectionEnabled) {
      this.updateActiveTopics(topics, now);
    }

    // Update coherence
    this.updateCoherence();

    this.lastUpdateTimestamp = now;
  }

  /* ================================ */
  /* TOPIC MANAGEMENT                 */
  /* ================================ */

  private updateActiveTopics(topics: string[], timestamp: number): void {
    for (const topic of topics) {
      if (this.activeTopics.has(topic)) {
        const activeTopic = this.activeTopics.get(topic)!;
        activeTopic.lastMention = timestamp;
        activeTopic.mentionCount++;
        activeTopic.relevance = this.calculateRelevance(activeTopic);
      } else {
        this.activeTopics.set(topic, {
          topic,
          firstMention: timestamp,
          lastMention: timestamp,
          mentionCount: 1,
          relevance: 100,
          relatedTopics: [],
        });
      }
    }

    // Decay relevance for all topics
    this.decayRelevance(timestamp);

    // Remove topics with low relevance
    const topicsToRemove: string[] = [];
    const topicEntries = Array.from(this.activeTopics.entries());

    for (const [topic, data] of topicEntries) {
      if (data.relevance < 10) {
        topicsToRemove.push(topic);
      }
    }

    for (const topic of topicsToRemove) {
      this.activeTopics.delete(topic);
    }
  }

  private calculateRelevance(topic: ActiveTopic): number {
    const now = Date.now();
    const timeSinceLastMention = now - topic.lastMention;
    const minutesSince = timeSinceLastMention / 60000;

    // Decay relevance over time
    const decayFactor = Math.exp(-this.config.relevanceDecayRate * minutesSince);

    // Boost based on mention count
    const mentionBoost = Math.min(20, topic.mentionCount * 5);

    return Math.max(0, Math.min(100, 80 * decayFactor + mentionBoost));
  }

  private decayRelevance(currentTimestamp: number): void {
    const topicEntries = Array.from(this.activeTopics.entries());

    for (const [_topic, data] of topicEntries) {
      data.relevance = this.calculateRelevance(data);
    }
  }

  public getActiveTopics(): ActiveTopic[] {
    return Array.from(this.activeTopics.values())
      .sort((a, b) => b.relevance - a.relevance);
  }

  public getTopicsByRelevance(minRelevance: number = 50): ActiveTopic[] {
    return this.getActiveTopics().filter(t => t.relevance >= minRelevance);
  }

  /* ================================ */
  /* COHERENCE TRACKING               */
  /* ================================ */

  private updateCoherence(): void {
    const turns = this.contextWindow.turns;

    if (turns.length < 2) {
      this.coherenceScore = {
        overall: 100,
        topicContinuity: 100,
        sentimentStability: 100,
        intentClarity: 100,
      };
      return;
    }

    // Topic continuity: how many consecutive turns share topics
    let topicMatches = 0;
    for (let i = 1; i < turns.length; i++) {
      const prevTopics = new Set(turns[i - 1].topics);
      const currTopics = turns[i].topics;

      const hasSharedTopic = currTopics.some(t => prevTopics.has(t));
      if (hasSharedTopic) topicMatches++;
    }

    const topicContinuity = (topicMatches / (turns.length - 1)) * 100;

    // Sentiment stability: variance in sentiment
    const sentiments = turns.map(t => {
      switch (t.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });

    const avgSentiment = sentiments.reduce((a: number, b: number) => a + b, 0 as number) / sentiments.length;
    const sentimentVariance = sentiments.reduce((sum: number, val: number) => sum + Math.pow(val - avgSentiment, 2), 0 as number) / sentiments.length;
    const sentimentStability = Math.max(0, 100 - sentimentVariance * 50);

    // Intent clarity: based on importance scores
    const avgImportance = turns.reduce((sum, t) => sum + t.importance, 0) / turns.length;
    const intentClarity = avgImportance;

    // Overall coherence
    const overall = (topicContinuity + sentimentStability + intentClarity) / 3;

    this.coherenceScore = {
      overall,
      topicContinuity,
      sentimentStability,
      intentClarity,
    };
  }

  public getCoherenceScore(): CoherenceScore {
    return { ...this.coherenceScore };
  }

  /* ================================ */
  /* CONTEXT RETRIEVAL                */
  /* ================================ */

  public getRecentTurns(count: number = 10): ConversationTurn[] {
    return this.contextWindow.turns.slice(-count);
  }

  public getTurnsByTopic(topic: string): ConversationTurn[] {
    return this.contextWindow.turns.filter(t => t.topics.includes(topic));
  }

  public getTurnsByImportance(minImportance: number = 70): ConversationTurn[] {
    return this.contextWindow.turns.filter(t => t.importance >= minImportance);
  }

  public getContextSummary(): string {
    const recentTurns = this.getRecentTurns(5);
    const topTopics = this.getTopicsByRelevance(60);

    let summary = `Immediate Context (Last ${this.contextWindow.currentTurnCount} turns):\n`;

    if (topTopics.length > 0) {
      summary += `Active Topics: ${topTopics.slice(0, 5).map(t => t.topic).join(', ')}\n`;
    }

    if (recentTurns.length > 0) {
      summary += `Recent Focus: ${recentTurns[recentTurns.length - 1].topics.join(', ')}\n`;
    }

    summary += `Coherence: ${this.coherenceScore.overall.toFixed(1)}%`;

    return summary;
  }

  /* ================================ */
  /* CONTEXT WINDOW ACCESS            */
  /* ================================ */

  public getContextWindow(): ContextWindow {
    return {
      turns: [...this.contextWindow.turns],
      maxTurns: this.contextWindow.maxTurns,
      currentTurnCount: this.contextWindow.currentTurnCount,
      oldestTurnTimestamp: this.contextWindow.oldestTurnTimestamp,
      newestTurnTimestamp: this.contextWindow.newestTurnTimestamp,
    };
  }

  public getTurnCount(): number {
    return this.contextWindow.currentTurnCount;
  }

  public getWindowSize(): number {
    return this.contextWindow.turns.length;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      contextWindow: this.getContextWindow(),
      activeTopics: Array.from(this.activeTopics.values()),
      coherenceScore: { ...this.coherenceScore },
      lastUpdateTimestamp: this.lastUpdateTimestamp,
    };
  }

  public getSummary(): string {
    const window = this.contextWindow;
    const topTopics = this.getTopicsByRelevance(60);
    const coherence = this.coherenceScore;

    return `Immediate Context Layer Summary:
  Turn Count: ${window.currentTurnCount}
  Window Size: ${window.turns.length}/${window.maxTurns}
  Active Topics: ${this.activeTopics.size}
  Top Topics: ${topTopics.slice(0, 3).map(t => t.topic).join(', ') || 'None'}
  Overall Coherence: ${coherence.overall.toFixed(1)}%
  Topic Continuity: ${coherence.topicContinuity.toFixed(1)}%
  Sentiment Stability: ${coherence.sentimentStability.toFixed(1)}%
  Intent Clarity: ${coherence.intentClarity.toFixed(1)}%`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<ImmediateContextConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.maxTurns !== undefined) {
      this.contextWindow.maxTurns = config.maxTurns;

      // Trim window if new max is smaller
      while (this.contextWindow.turns.length > this.contextWindow.maxTurns) {
        this.contextWindow.turns.shift();
      }

      if (this.contextWindow.turns.length > 0) {
        this.contextWindow.oldestTurnTimestamp = this.contextWindow.turns[0].timestamp;
      }
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.contextWindow.turns = [];
    this.contextWindow.currentTurnCount = 0;
    this.contextWindow.oldestTurnTimestamp = 0;
    this.contextWindow.newestTurnTimestamp = 0;
    this.activeTopics.clear();

    this.coherenceScore = {
      overall: 100,
      topicContinuity: 100,
      sentimentStability: 100,
      intentClarity: 100,
    };
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
      this.contextWindow = state.contextWindow;
      this.coherenceScore = state.coherenceScore;
      this.lastUpdateTimestamp = state.lastUpdateTimestamp;

      // Restore active topics
      this.activeTopics.clear();
      for (const topic of state.activeTopics) {
        this.activeTopics.set(topic.topic, topic);
      }
    } catch (error) {
      console.error('[ImmediateContextLayer] Import failed:', error);
    }
  }
}
