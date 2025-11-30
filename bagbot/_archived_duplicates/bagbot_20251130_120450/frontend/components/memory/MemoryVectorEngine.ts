/**
 * LEVEL 13.1 — MEMORY VECTOR ENGINE
 * 
 * Builds internal "meaning maps" for semantic understanding.
 * Links topics, anticipates next steps, understands building style.
 * Makes BagBot feel intuitive.
 * 
 * Features:
 * - Semantic topic linking
 * - Instruction understanding
 * - Context vector generation
 * - Relationship mapping
 * - Intent prediction
 * - Next-step anticipation
 * 
 * Privacy: Computational patterns only, no raw data storage
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface MemoryVector {
  vectorId: string;
  content: string; // semantic content
  embedding: number[]; // simplified semantic representation
  timestamp: number;
  category: VectorCategory;
  tags: string[];
  strength: number; // 0-100
}

type VectorCategory =
  | 'topic'
  | 'instruction'
  | 'concept'
  | 'workflow'
  | 'preference'
  | 'context';

interface TopicLink {
  linkId: string;
  sourceVectorId: string;
  targetVectorId: string;
  relationshipType: RelationType;
  strength: number; // 0-100
  bidirectional: boolean;
  createdAt: number;
}

type RelationType =
  | 'related-to'
  | 'follows-from'
  | 'requires'
  | 'contradicts'
  | 'expands-on'
  | 'similar-to';

interface SemanticCluster {
  clusterId: string;
  centroid: number[]; // center point of cluster
  vectorIds: string[];
  dominantTopic: string;
  coherence: number; // 0-100
}

interface IntentPrediction {
  predictedIntent: string;
  confidence: number; // 0-100
  basedOnVectors: string[];
  alternativeIntents: Array<{
    intent: string;
    confidence: number;
  }>;
}

interface NextStepSuggestion {
  suggestionId: string;
  description: string;
  confidence: number; // 0-100
  reasoning: string;
  relatedVectors: string[];
  priority: number; // 1-10
}

interface BuildingStyle {
  styleId: string;
  characteristics: {
    preferredApproach: 'incremental' | 'comprehensive' | 'exploratory';
    detailLevel: 'high' | 'medium' | 'low';
    pacingPreference: 'fast' | 'moderate' | 'deliberate';
    feedbackStyle: 'frequent' | 'milestone' | 'completion';
  };
  confidence: number; // 0-100
  observationCount: number;
}

interface MeaningMap {
  vectors: MemoryVector[];
  links: TopicLink[];
  clusters: SemanticCluster[];
  buildingStyle: BuildingStyle | null;
}

interface MemoryVectorEngineConfig {
  maxVectors: number;
  maxLinks: number;
  embeddingDimensions: number;
  clusterThreshold: number; // cosine similarity
  linkStrengthDecay: number; // per day
  minLinkStrength: number;
}

/* ================================ */
/* MEMORY VECTOR ENGINE             */
/* ================================ */

export class MemoryVectorEngine {
  private config: MemoryVectorEngineConfig;

  // Vector State
  private vectors: Map<string, MemoryVector>;
  private links: Map<string, TopicLink>;
  private clusters: Map<string, SemanticCluster>;

  // Building Style
  private buildingStyle: BuildingStyle | null;

  // Tracking
  private lastClusterUpdate: number;

  constructor(config?: Partial<MemoryVectorEngineConfig>) {
    this.config = {
      maxVectors: 200,
      maxLinks: 500,
      embeddingDimensions: 32, // simplified for efficiency
      clusterThreshold: 0.7,
      linkStrengthDecay: 0.05, // 5% per day
      minLinkStrength: 20,
      ...config,
    };

    this.vectors = new Map();
    this.links = new Map();
    this.clusters = new Map();
    this.buildingStyle = null;

    this.lastClusterUpdate = Date.now();
  }

  /* ================================ */
  /* VECTOR MANAGEMENT                */
  /* ================================ */

  public addVector(
    content: string,
    category: VectorCategory,
    tags: string[] = []
  ): string {
    const now = Date.now();

    // Generate embedding (simplified semantic representation)
    const embedding = this.generateEmbedding(content);

    const vector: MemoryVector = {
      vectorId: `vec_${now}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      embedding,
      timestamp: now,
      category,
      tags,
      strength: 100,
    };

    this.vectors.set(vector.vectorId, vector);

    // Auto-link to similar vectors
    this.autoLinkVector(vector);

    // Prune if exceeding max
    this.pruneVectors();

    // Update clusters periodically
    if (now - this.lastClusterUpdate > 60000) { // every minute
      this.updateClusters();
      this.lastClusterUpdate = now;
    }

    return vector.vectorId;
  }

  private generateEmbedding(content: string): number[] {
    // Simplified embedding: hash-based semantic representation
    // In production, use proper embedding models
    const words = content.toLowerCase().split(/\s+/);
    const embedding = new Array(this.config.embeddingDimensions).fill(0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const dim = (charCode * (j + 1)) % this.config.embeddingDimensions;
        embedding[dim] += 1 / (words.length + 1);
      }
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    magA = Math.sqrt(magA);
    magB = Math.sqrt(magB);

    if (magA === 0 || magB === 0) return 0;

    return dotProduct / (magA * magB);
  }

  private pruneVectors(): void {
    if (this.vectors.size <= this.config.maxVectors) return;

    // Remove weakest vectors
    const sorted = Array.from(this.vectors.values()).sort((a, b) => a.strength - b.strength);
    const toRemove = sorted.slice(0, this.vectors.size - this.config.maxVectors);

    for (const vector of toRemove) {
      this.removeVector(vector.vectorId);
    }
  }

  private removeVector(vectorId: string): void {
    this.vectors.delete(vectorId);

    // Remove associated links
    const linksToRemove: string[] = [];
    const linkEntries = Array.from(this.links.entries());
    for (const [linkId, link] of linkEntries) {
      if (link.sourceVectorId === vectorId || link.targetVectorId === vectorId) {
        linksToRemove.push(linkId);
      }
    }

    for (const linkId of linksToRemove) {
      this.links.delete(linkId);
    }

    // Remove from clusters
    const clusterArray = Array.from(this.clusters.values());
    for (const cluster of clusterArray) {
      cluster.vectorIds = cluster.vectorIds.filter((id: string) => id !== vectorId);
    }
  }

  public getVector(vectorId: string): MemoryVector | undefined {
    return this.vectors.get(vectorId);
  }

  public getVectorsByCategory(category: VectorCategory): MemoryVector[] {
    return Array.from(this.vectors.values()).filter(v => v.category === category);
  }

  public getVectorsByTag(tag: string): MemoryVector[] {
    return Array.from(this.vectors.values()).filter(v => v.tags.includes(tag));
  }

  /* ================================ */
  /* TOPIC LINKING                    */
  /* ================================ */

  private autoLinkVector(vector: MemoryVector): void {
    const existingVectors = Array.from(this.vectors.values()).filter(v => v.vectorId !== vector.vectorId);

    for (const existing of existingVectors) {
      const similarity = this.cosineSimilarity(vector.embedding, existing.embedding);

      if (similarity >= this.config.clusterThreshold) {
        this.createLink(
          vector.vectorId,
          existing.vectorId,
          'similar-to',
          similarity * 100,
          true
        );
      }
    }
  }

  public createLink(
    sourceVectorId: string,
    targetVectorId: string,
    relationshipType: RelationType,
    strength: number = 80,
    bidirectional: boolean = false
  ): string {
    const now = Date.now();

    const link: TopicLink = {
      linkId: `link_${now}_${Math.random().toString(36).substr(2, 9)}`,
      sourceVectorId,
      targetVectorId,
      relationshipType,
      strength: Math.max(0, Math.min(100, strength)),
      bidirectional,
      createdAt: now,
    };

    this.links.set(link.linkId, link);

    // Prune if exceeding max
    this.pruneLinks();

    return link.linkId;
  }

  private pruneLinks(): void {
    if (this.links.size <= this.config.maxLinks) return;

    // Remove weakest links
    const sorted = Array.from(this.links.values()).sort((a, b) => a.strength - b.strength);
    const toRemove = sorted.slice(0, this.links.size - this.config.maxLinks);

    for (const link of toRemove) {
      this.links.delete(link.linkId);
    }
  }

  public getLinksForVector(vectorId: string): TopicLink[] {
    return Array.from(this.links.values()).filter(
      l => l.sourceVectorId === vectorId || (l.bidirectional && l.targetVectorId === vectorId)
    );
  }

  public getRelatedVectors(vectorId: string, minStrength: number = 60): MemoryVector[] {
    const links = this.getLinksForVector(vectorId).filter(l => l.strength >= minStrength);

    const relatedIds = new Set<string>();
    for (const link of links) {
      if (link.sourceVectorId === vectorId) {
        relatedIds.add(link.targetVectorId);
      } else if (link.bidirectional && link.targetVectorId === vectorId) {
        relatedIds.add(link.sourceVectorId);
      }
    }

    return Array.from(relatedIds)
      .map(id => this.vectors.get(id))
      .filter(Boolean) as MemoryVector[];
  }

  /* ================================ */
  /* CLUSTERING                       */
  /* ================================ */

  private updateClusters(): void {
    // Simple k-means-like clustering
    this.clusters.clear();

    const vectors = Array.from(this.vectors.values());
    if (vectors.length === 0) return;

    // Group similar vectors
    const visited = new Set<string>();

    for (const vector of vectors) {
      if (visited.has(vector.vectorId)) continue;

      const clusterVectors: MemoryVector[] = [vector];
      visited.add(vector.vectorId);

      // Find similar vectors
      for (const other of vectors) {
        if (visited.has(other.vectorId)) continue;

        const similarity = this.cosineSimilarity(vector.embedding, other.embedding);
        if (similarity >= this.config.clusterThreshold) {
          clusterVectors.push(other);
          visited.add(other.vectorId);
        }
      }

      // Create cluster if has multiple vectors
      if (clusterVectors.length >= 2) {
        const centroid = this.calculateCentroid(clusterVectors.map(v => v.embedding));
        const coherence = this.calculateClusterCoherence(clusterVectors);
        const dominantTopic = this.extractDominantTopic(clusterVectors);

        const cluster: SemanticCluster = {
          clusterId: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          centroid,
          vectorIds: clusterVectors.map(v => v.vectorId),
          dominantTopic,
          coherence,
        };

        this.clusters.set(cluster.clusterId, cluster);
      }
    }
  }

  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= embeddings.length;
    }

    return centroid;
  }

  private calculateClusterCoherence(vectors: MemoryVector[]): number {
    if (vectors.length < 2) return 100;

    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        const similarity = this.cosineSimilarity(vectors[i].embedding, vectors[j].embedding);
        totalSimilarity += similarity;
        pairCount++;
      }
    }

    return pairCount > 0 ? (totalSimilarity / pairCount) * 100 : 100;
  }

  private extractDominantTopic(vectors: MemoryVector[]): string {
    // Extract most common tags/words
    const tagCounts = new Map<string, number>();

    for (const vector of vectors) {
      for (const tag of vector.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }

    if (tagCounts.size === 0) return 'General';

    const sorted = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  public getClusters(): SemanticCluster[] {
    return Array.from(this.clusters.values());
  }

  /* ================================ */
  /* INTENT PREDICTION                */
  /* ================================ */

  public predictIntent(currentContext: string[]): IntentPrediction {
    // Generate embedding for current context
    const contextEmbedding = this.generateEmbedding(currentContext.join(' '));

    // Find most similar vectors
    const similarities: Array<{ vectorId: string; similarity: number }> = [];

    const vectorArray = Array.from(this.vectors.values());
    for (const vector of vectorArray) {
      const similarity = this.cosineSimilarity(contextEmbedding, vector.embedding);
      similarities.push({ vectorId: vector.vectorId, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);

    // Top 5 most similar
    const topSimilar = similarities.slice(0, 5);

    if (topSimilar.length === 0) {
      return {
        predictedIntent: 'exploration',
        confidence: 50,
        basedOnVectors: [],
        alternativeIntents: [],
      };
    }

    // Aggregate categories
    const categoryScores = new Map<string, number>();

    for (const { vectorId, similarity } of topSimilar) {
      const vector = this.vectors.get(vectorId);
      if (!vector) continue;

      const category = vector.category;
      categoryScores.set(category, (categoryScores.get(category) || 0) + similarity);
    }

    const sorted = Array.from(categoryScores.entries()).sort((a, b) => b[1] - a[1]);

    const predictedIntent = sorted[0]?.[0] || 'exploration';
    const confidence = Math.min(100, (sorted[0]?.[1] || 0) * 100);

    const alternativeIntents = sorted.slice(1, 4).map(([intent, score]) => ({
      intent,
      confidence: Math.min(100, score * 100),
    }));

    return {
      predictedIntent,
      confidence,
      basedOnVectors: topSimilar.map(s => s.vectorId),
      alternativeIntents,
    };
  }

  /* ================================ */
  /* NEXT-STEP ANTICIPATION           */
  /* ================================ */

  public suggestNextSteps(currentVectorIds: string[]): NextStepSuggestion[] {
    const suggestions: NextStepSuggestion[] = [];

    // Analyze links from current vectors
    const linkedVectors = new Map<string, number>(); // vectorId -> relevance score

    for (const vectorId of currentVectorIds) {
      const links = this.getLinksForVector(vectorId);

      for (const link of links) {
        const targetId = link.sourceVectorId === vectorId ? link.targetVectorId : link.sourceVectorId;

        if (link.relationshipType === 'follows-from' || link.relationshipType === 'expands-on') {
          linkedVectors.set(targetId, (linkedVectors.get(targetId) || 0) + link.strength);
        }
      }
    }

    // Sort by relevance
    const sorted = Array.from(linkedVectors.entries()).sort((a, b) => b[1] - a[1]);

    // Generate suggestions from top linked vectors
    for (const [vectorId, score] of sorted.slice(0, 5)) {
      const vector = this.vectors.get(vectorId);
      if (!vector) continue;

      suggestions.push({
        suggestionId: `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        description: vector.content,
        confidence: Math.min(100, score),
        reasoning: `Based on related ${vector.category} patterns`,
        relatedVectors: [vectorId],
        priority: Math.ceil(score / 20),
      });
    }

    return suggestions;
  }

  /* ================================ */
  /* BUILDING STYLE DETECTION         */
  /* ================================ */

  public observeBuildingBehavior(
    approach: 'incremental' | 'comprehensive' | 'exploratory',
    detailLevel: 'high' | 'medium' | 'low',
    pacing: 'fast' | 'moderate' | 'deliberate',
    feedback: 'frequent' | 'milestone' | 'completion'
  ): void {
    if (!this.buildingStyle) {
      this.buildingStyle = {
        styleId: `style_${Date.now()}`,
        characteristics: {
          preferredApproach: approach,
          detailLevel,
          pacingPreference: pacing,
          feedbackStyle: feedback,
        },
        confidence: 60,
        observationCount: 1,
      };
      return;
    }

    // Update if consistent
    if (
      this.buildingStyle.characteristics.preferredApproach === approach &&
      this.buildingStyle.characteristics.detailLevel === detailLevel
    ) {
      this.buildingStyle.confidence = Math.min(100, this.buildingStyle.confidence + 10);
    } else {
      this.buildingStyle.confidence = Math.max(30, this.buildingStyle.confidence - 5);
    }

    this.buildingStyle.observationCount++;

    // Update characteristics
    this.buildingStyle.characteristics = {
      preferredApproach: approach,
      detailLevel,
      pacingPreference: pacing,
      feedbackStyle: feedback,
    };
  }

  public getBuildingStyle(): BuildingStyle | null {
    return this.buildingStyle ? { ...this.buildingStyle } : null;
  }

  /* ================================ */
  /* MEANING MAP ACCESS               */
  /* ================================ */

  public getMeaningMap(): MeaningMap {
    return {
      vectors: Array.from(this.vectors.values()),
      links: Array.from(this.links.values()),
      clusters: Array.from(this.clusters.values()),
      buildingStyle: this.buildingStyle ? { ...this.buildingStyle } : null,
    };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      vectors: Array.from(this.vectors.values()),
      links: Array.from(this.links.values()),
      clusters: Array.from(this.clusters.values()),
      buildingStyle: this.buildingStyle,
      lastClusterUpdate: this.lastClusterUpdate,
    };
  }

  public getSummary(): string {
    const vectors = this.vectors.size;
    const links = this.links.size;
    const clusters = this.clusters.size;
    const style = this.buildingStyle;

    return `Memory Vector Engine Summary:
  Vectors: ${vectors}
  Links: ${links}
  Clusters: ${clusters}
  Building Style: ${style ? `${style.characteristics.preferredApproach} (${style.confidence.toFixed(0)}% confidence)` : 'Learning'}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.vectors.clear();
    this.links.clear();
    this.clusters.clear();
    this.buildingStyle = null;
    this.lastClusterUpdate = Date.now();
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
      this.lastClusterUpdate = state.lastClusterUpdate;
      this.buildingStyle = state.buildingStyle;

      // Restore maps
      this.vectors.clear();
      for (const vector of state.vectors) {
        this.vectors.set(vector.vectorId, vector);
      }

      this.links.clear();
      for (const link of state.links) {
        this.links.set(link.linkId, link);
      }

      this.clusters.clear();
      for (const cluster of state.clusters) {
        this.clusters.set(cluster.clusterId, cluster);
      }
    } catch (error) {
      console.error('[MemoryVectorEngine] Import failed:', error);
    }
  }
}
