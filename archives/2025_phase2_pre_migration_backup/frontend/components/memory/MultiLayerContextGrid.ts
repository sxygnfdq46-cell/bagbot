/**
 * LEVEL 13.1 — MULTI-LAYER CONTEXT GRID (MCG)
 * 
 * Orchestrates all 3 memory layers + vector engine.
 * Forms BagBot's complete dimensional memory system.
 * 
 * Features:
 * - 3-layer memory integration
 * - Cross-layer context synthesis
 * - Unified memory query interface
 * - Intelligent context prioritization
 * - Adaptive memory refresh
 * - Holistic understanding
 * 
 * Architecture: Immediate → Session → Long-Arc + Vector Engine
 */

import { ImmediateContextLayer } from './ImmediateContextLayer';
import { SessionIntentLayer } from './SessionIntentLayer';
import { LongArcPatternLayer } from './LongArcPatternLayer';
import { MemoryVectorEngine } from './MemoryVectorEngine';

/* ================================ */
/* TYPES                            */
/* ================================ */

interface ContextSnapshot {
  timestamp: number;
  immediateContext: {
    recentTopics: string[];
    coherence: number;
    turnCount: number;
  };
  sessionIntent: {
    activeIntents: number;
    activeGoals: number;
    continuity: number;
  };
  longArcPatterns: {
    topPatterns: string[];
    strongPreferences: number;
    buildingStyle: string | null;
  };
  vectorEngine: {
    vectorCount: number;
    clusterCount: number;
    predictedIntent: string;
  };
}

interface UnifiedQuery {
  queryType: 'topic' | 'intent' | 'pattern' | 'context' | 'prediction';
  queryValue: string;
  layerPriority?: Array<'immediate' | 'session' | 'long-arc' | 'vector'>;
  minConfidence?: number;
}

interface UnifiedResponse {
  queryId: string;
  results: Array<{
    source: 'immediate' | 'session' | 'long-arc' | 'vector';
    data: any;
    relevance: number; // 0-100
    confidence: number; // 0-100
  }>;
  synthesis: string;
  confidence: number; // overall
}

interface MemoryHealth {
  overall: number; // 0-100
  layerHealth: {
    immediate: number;
    session: number;
    longArc: number;
    vector: number;
  };
  coherence: number; // cross-layer coherence
  lastRefresh: number;
}

interface MultiLayerContextGridConfig {
  enableAutoRefresh: boolean;
  refreshIntervalMs: number;
  enableCrossLayerSynthesis: boolean;
  minQueryConfidence: number;
}

/* ================================ */
/* MULTI-LAYER CONTEXT GRID         */
/* ================================ */

export class MultiLayerContextGrid {
  private config: MultiLayerContextGridConfig;

  // Memory Layers
  private immediateLayer: ImmediateContextLayer;
  private sessionLayer: SessionIntentLayer;
  private longArcLayer: LongArcPatternLayer;
  private vectorEngine: MemoryVectorEngine;

  // Grid State
  private memoryHealth: MemoryHealth;
  private lastRefresh: number;
  private refreshInterval: NodeJS.Timeout | null;

  constructor(config?: Partial<MultiLayerContextGridConfig>) {
    this.config = {
      enableAutoRefresh: true,
      refreshIntervalMs: 30000, // 30 seconds
      enableCrossLayerSynthesis: true,
      minQueryConfidence: 50,
      ...config,
    };

    // Initialize layers
    this.immediateLayer = new ImmediateContextLayer();
    this.sessionLayer = new SessionIntentLayer();
    this.longArcLayer = new LongArcPatternLayer();
    this.vectorEngine = new MemoryVectorEngine();

    this.memoryHealth = {
      overall: 100,
      layerHealth: {
        immediate: 100,
        session: 100,
        longArc: 100,
        vector: 100,
      },
      coherence: 100,
      lastRefresh: Date.now(),
    };

    this.lastRefresh = Date.now();
    this.refreshInterval = null;

    if (this.config.enableAutoRefresh) {
      this.startAutoRefresh();
    }
  }

  /* ================================ */
  /* LAYER ACCESS                     */
  /* ================================ */

  public getImmediateLayer(): ImmediateContextLayer {
    return this.immediateLayer;
  }

  public getSessionLayer(): SessionIntentLayer {
    return this.sessionLayer;
  }

  public getLongArcLayer(): LongArcPatternLayer {
    return this.longArcLayer;
  }

  public getVectorEngine(): MemoryVectorEngine {
    return this.vectorEngine;
  }

  /* ================================ */
  /* CONTEXT RECORDING                */
  /* ================================ */

  public recordInteraction(
    userMessage: string,
    botResponse: string,
    topics: string[] = [],
    intent: string = 'exploration',
    sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  ): void {
    // Immediate layer: add turn
    this.immediateLayer.addTurn(userMessage, botResponse, topics, sentiment, 70);

    // Session layer: detect intent
    const intentType = this.mapIntentType(intent);
    this.sessionLayer.detectIntent(intentType, userMessage, 80, topics);

    // Vector engine: add vectors for topics
    for (const topic of topics) {
      this.vectorEngine.addVector(topic, 'topic', topics);
    }

    // Long-arc layer: observe patterns
    if (topics.length > 0) {
      this.longArcLayer.observePattern('topic-preference', topics.join(', '));
    }

    // Update memory health
    this.updateMemoryHealth();
  }

  private mapIntentType(intent: string): any {
    const mapping: Record<string, string> = {
      exploration: 'exploration',
      question: 'question',
      command: 'command',
      task: 'task',
      clarification: 'clarification',
      feedback: 'feedback',
    };

    return mapping[intent] || 'exploration';
  }

  /* ================================ */
  /* UNIFIED QUERY INTERFACE          */
  /* ================================ */

  public query(query: UnifiedQuery): UnifiedResponse {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const results: UnifiedResponse['results'] = [];

    const minConfidence = query.minConfidence || this.config.minQueryConfidence;

    // Query each layer based on priority
    const layers = query.layerPriority || ['immediate', 'session', 'long-arc', 'vector'];

    for (const layer of layers) {
      switch (layer) {
        case 'immediate':
          const immediateResults = this.queryImmediateLayer(query);
          if (immediateResults.confidence >= minConfidence) {
            results.push(immediateResults);
          }
          break;

        case 'session':
          const sessionResults = this.querySessionLayer(query);
          if (sessionResults.confidence >= minConfidence) {
            results.push(sessionResults);
          }
          break;

        case 'long-arc':
          const longArcResults = this.queryLongArcLayer(query);
          if (longArcResults.confidence >= minConfidence) {
            results.push(longArcResults);
          }
          break;

        case 'vector':
          const vectorResults = this.queryVectorEngine(query);
          if (vectorResults.confidence >= minConfidence) {
            results.push(vectorResults);
          }
          break;
      }
    }

    // Synthesize results
    const synthesis = this.config.enableCrossLayerSynthesis
      ? this.synthesizeResults(results, query)
      : 'Cross-layer synthesis disabled';

    const overallConfidence = results.length > 0
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
      : 0;

    return {
      queryId,
      results,
      synthesis,
      confidence: overallConfidence,
    };
  }

  private queryImmediateLayer(query: UnifiedQuery): UnifiedResponse['results'][0] {
    const data: any = {};
    let relevance = 0;
    let confidence = 0;

    switch (query.queryType) {
      case 'topic':
        const turns = this.immediateLayer.getTurnsByTopic(query.queryValue);
        data.turns = turns;
        relevance = turns.length > 0 ? 90 : 30;
        confidence = turns.length > 0 ? 85 : 40;
        break;

      case 'context':
        data.context = this.immediateLayer.getContextSummary();
        relevance = 80;
        confidence = 75;
        break;

      default:
        data.activeTopics = this.immediateLayer.getActiveTopics();
        relevance = 70;
        confidence = 70;
    }

    return {
      source: 'immediate',
      data,
      relevance,
      confidence,
    };
  }

  private querySessionLayer(query: UnifiedQuery): UnifiedResponse['results'][0] {
    const data: any = {};
    let relevance = 0;
    let confidence = 0;

    switch (query.queryType) {
      case 'intent':
        const intents = this.sessionLayer.getActiveIntents();
        data.intents = intents;
        relevance = intents.length > 0 ? 90 : 40;
        confidence = intents.length > 0 ? 85 : 50;
        break;

      case 'context':
        data.goals = this.sessionLayer.getActiveGoals();
        data.tasks = this.sessionLayer.getTasks();
        relevance = 85;
        confidence = 80;
        break;

      default:
        data.summary = this.sessionLayer.getSummary();
        relevance = 70;
        confidence = 70;
    }

    return {
      source: 'session',
      data,
      relevance,
      confidence,
    };
  }

  private queryLongArcLayer(query: UnifiedQuery): UnifiedResponse['results'][0] {
    const data: any = {};
    let relevance = 0;
    let confidence = 0;

    switch (query.queryType) {
      case 'pattern':
        const patterns = this.longArcLayer.getPatterns(60);
        data.patterns = patterns;
        relevance = patterns.length > 0 ? 90 : 30;
        confidence = patterns.length > 0 ? 85 : 40;
        break;

      case 'topic':
        const affinities = this.longArcLayer.getTopicAffinities(60);
        const matching = affinities.filter(a => a.topic.includes(query.queryValue));
        data.affinities = matching;
        relevance = matching.length > 0 ? 80 : 30;
        confidence = matching.length > 0 ? 75 : 40;
        break;

      default:
        data.preferences = this.longArcLayer.getPreferences(70);
        data.buildingStyle = this.longArcLayer.getInteractionStyle();
        relevance = 75;
        confidence = 70;
    }

    return {
      source: 'long-arc',
      data,
      relevance,
      confidence,
    };
  }

  private queryVectorEngine(query: UnifiedQuery): UnifiedResponse['results'][0] {
    const data: any = {};
    let relevance = 0;
    let confidence = 0;

    switch (query.queryType) {
      case 'prediction':
        const prediction = this.vectorEngine.predictIntent([query.queryValue]);
        data.prediction = prediction;
        relevance = 90;
        confidence = prediction.confidence;
        break;

      case 'topic':
        const vectors = this.vectorEngine.getVectorsByTag(query.queryValue);
        data.vectors = vectors;
        relevance = vectors.length > 0 ? 85 : 40;
        confidence = vectors.length > 0 ? 80 : 50;
        break;

      default:
        data.meaningMap = this.vectorEngine.getMeaningMap();
        relevance = 75;
        confidence = 70;
    }

    return {
      source: 'vector',
      data,
      relevance,
      confidence,
    };
  }

  private synthesizeResults(
    results: UnifiedResponse['results'],
    query: UnifiedQuery
  ): string {
    if (results.length === 0) {
      return `No results found for ${query.queryType} query: "${query.queryValue}"`;
    }

    let synthesis = `Multi-layer analysis for "${query.queryValue}":\n`;

    for (const result of results) {
      synthesis += `\n[${result.source.toUpperCase()}] (relevance: ${result.relevance.toFixed(0)}%, confidence: ${result.confidence.toFixed(0)}%)\n`;

      switch (result.source) {
        case 'immediate':
          if (result.data.turns) {
            synthesis += `  Recent mentions: ${result.data.turns.length} turns\n`;
          }
          if (result.data.activeTopics) {
            synthesis += `  Active topics: ${result.data.activeTopics.slice(0, 3).map((t: any) => t.topic).join(', ')}\n`;
          }
          break;

        case 'session':
          if (result.data.intents) {
            synthesis += `  Active intents: ${result.data.intents.length}\n`;
          }
          if (result.data.goals) {
            synthesis += `  Active goals: ${result.data.goals.length}\n`;
          }
          break;

        case 'long-arc':
          if (result.data.patterns) {
            synthesis += `  Detected patterns: ${result.data.patterns.length}\n`;
          }
          if (result.data.affinities) {
            synthesis += `  Topic affinity: ${result.data.affinities[0]?.affinityScore.toFixed(0) || 0}%\n`;
          }
          break;

        case 'vector':
          if (result.data.prediction) {
            synthesis += `  Predicted intent: ${result.data.prediction.predictedIntent} (${result.data.prediction.confidence.toFixed(0)}%)\n`;
          }
          if (result.data.vectors) {
            synthesis += `  Related vectors: ${result.data.vectors.length}\n`;
          }
          break;
      }
    }

    return synthesis;
  }

  /* ================================ */
  /* CONTEXT SNAPSHOT                 */
  /* ================================ */

  public captureSnapshot(): ContextSnapshot {
    const immediateState = this.immediateLayer.getState();
    const sessionState = this.sessionLayer.getState();
    const longArcState = this.longArcLayer.getState();
    const vectorState = this.vectorEngine.getState();

    const immediateCoherence = this.immediateLayer.getCoherenceScore();
    const sessionContinuity = this.sessionLayer.getContinuityScore();
    const topPatterns = this.longArcLayer.getPatterns(70).slice(0, 5);
    const buildingStyle = this.longArcLayer.getInteractionStyle();
    const prediction = this.vectorEngine.predictIntent(['current']);

    return {
      timestamp: Date.now(),
      immediateContext: {
        recentTopics: immediateState.activeTopics.slice(0, 5).map((t: any) => t.topic),
        coherence: immediateCoherence.overall,
        turnCount: immediateState.contextWindow.currentTurnCount,
      },
      sessionIntent: {
        activeIntents: sessionState.intents.filter((i: any) => i.status === 'active').length,
        activeGoals: sessionState.goals.filter((g: any) => g.status === 'active').length,
        continuity: sessionContinuity.overall,
      },
      longArcPatterns: {
        topPatterns: topPatterns.map((p: any) => p.description),
        strongPreferences: longArcState.preferences.filter((p: any) => p.confidence >= 80).length,
        buildingStyle: buildingStyle ? buildingStyle.preferredComplexity : null,
      },
      vectorEngine: {
        vectorCount: vectorState.vectors.length,
        clusterCount: vectorState.clusters.length,
        predictedIntent: prediction.predictedIntent,
      },
    };
  }

  /* ================================ */
  /* MEMORY HEALTH                    */
  /* ================================ */

  private updateMemoryHealth(): void {
    const immediateCoherence = this.immediateLayer.getCoherenceScore();
    const sessionContinuity = this.sessionLayer.getContinuityScore();

    // Layer health scores
    const immediateHealth = immediateCoherence.overall;
    const sessionHealth = sessionContinuity.overall;
    const longArcHealth = 100; // Simplified - could be based on pattern strength
    const vectorHealth = 100; // Simplified - could be based on cluster coherence

    // Cross-layer coherence
    const coherence = (immediateHealth + sessionHealth + longArcHealth + vectorHealth) / 4;

    // Overall health
    const overall = coherence;

    this.memoryHealth = {
      overall,
      layerHealth: {
        immediate: immediateHealth,
        session: sessionHealth,
        longArc: longArcHealth,
        vector: vectorHealth,
      },
      coherence,
      lastRefresh: Date.now(),
    };
  }

  public getMemoryHealth(): MemoryHealth {
    return { ...this.memoryHealth };
  }

  /* ================================ */
  /* AUTO-REFRESH                     */
  /* ================================ */

  private startAutoRefresh(): void {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(() => {
      this.refresh();
    }, this.config.refreshIntervalMs);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private refresh(): void {
    this.updateMemoryHealth();
    this.lastRefresh = Date.now();
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      immediateLayer: this.immediateLayer.getState(),
      sessionLayer: this.sessionLayer.getState(),
      longArcLayer: this.longArcLayer.getState(),
      vectorEngine: this.vectorEngine.getState(),
      memoryHealth: { ...this.memoryHealth },
      lastRefresh: this.lastRefresh,
    };
  }

  public getSummary(): string {
    const snapshot = this.captureSnapshot();
    const health = this.memoryHealth;
    const style = this.longArcLayer.getInteractionStyle();

    return `Multi-Layer Context Grid Summary:
  
IMMEDIATE CONTEXT:
  Recent Topics: ${snapshot.immediateContext.recentTopics.slice(0, 3).join(', ') || 'None'}
  Turn Count: ${snapshot.immediateContext.turnCount}
  Coherence: ${snapshot.immediateContext.coherence.toFixed(1)}%

SESSION INTENT:
  Active Intents: ${snapshot.sessionIntent.activeIntents}
  Active Goals: ${snapshot.sessionIntent.activeGoals}
  Continuity: ${snapshot.sessionIntent.continuity.toFixed(1)}%

LONG-ARC PATTERNS:
  Top Patterns: ${snapshot.longArcPatterns.topPatterns.length}
  Strong Preferences: ${snapshot.longArcPatterns.strongPreferences}
  Building Style: ${style ? style.preferredComplexity : 'Learning'}

VECTOR ENGINE:
  Vectors: ${snapshot.vectorEngine.vectorCount}
  Clusters: ${snapshot.vectorEngine.clusterCount}
  Predicted Intent: ${snapshot.vectorEngine.predictedIntent}

MEMORY HEALTH:
  Overall: ${health.overall.toFixed(1)}%
  Immediate Layer: ${health.layerHealth.immediate.toFixed(1)}%
  Session Layer: ${health.layerHealth.session.toFixed(1)}%
  Long-Arc Layer: ${health.layerHealth.longArc.toFixed(1)}%
  Vector Engine: ${health.layerHealth.vector.toFixed(1)}%`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.immediateLayer.clear();
    this.sessionLayer.clear();
    this.longArcLayer.clear();
    this.vectorEngine.clear();

    this.memoryHealth = {
      overall: 100,
      layerHealth: {
        immediate: 100,
        session: 100,
        longArc: 100,
        vector: 100,
      },
      coherence: 100,
      lastRefresh: Date.now(),
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

      this.immediateLayer.import(JSON.stringify({ config: {}, state: state.immediateLayer }));
      this.sessionLayer.import(JSON.stringify({ config: {}, state: state.sessionLayer }));
      this.longArcLayer.import(JSON.stringify({ config: {}, state: state.longArcLayer }));
      this.vectorEngine.import(JSON.stringify({ config: {}, state: state.vectorEngine }));

      this.memoryHealth = state.memoryHealth;
      this.lastRefresh = state.lastRefresh;
    } catch (error) {
      console.error('[MultiLayerContextGrid] Import failed:', error);
    }
  }

  public destroy(): void {
    this.stopAutoRefresh();
    this.clear();
  }
}
