// ThreatClusterEngine.ts
// BagBot Shield Intelligence — Threat Clustering System
// 0 autonomous actions — analysis only
// All logic runs only when invoked by ShieldOrchestrator

import { CorrelationEvent, ThreatRecord, ShieldType } from '@/src/engine/stability-shield/types';
import { dot, magnitude } from '@/src/engine/stability-shield/vectorMath';

export interface ClusterResult {
  clusterId: string;
  members: ThreatRecord[];
  strength: number; // 0-100
  centroid: number[];
  summary: string;
  topSeverity: number;
  confidence: number;
}

export class ThreatClusterEngine {
  private clusters: ClusterResult[] = [];
  private readonly VECTOR_SIZE = 5; // severity, shield, source, signature, recency

  constructor() {}

  /** MAIN ENTRY */
  public analyzeThreats(threats: ThreatRecord[]): ClusterResult[] {
    if (!threats.length) return [];

    const vectors = threats.map(t => this.toVector(t));

    const { centroids, groups } = this.kMeansLike(threats, vectors);

    this.clusters = this.buildClusters(threats, groups, centroids);

    return this.clusters;
  }

  /** Convert threat → 5-dim vector */
  private toVector(t: ThreatRecord): number[] {
    return [
      t.severity,                       // 0-5
      this.encodeShield(t.shield),      // 0-3
      this.encodeSource(t.source),      // 0-3
      this.signatureHash(t.message),    // 0-1 normalized
      this.recencyWeight(t.timestamp),  // 0-1
    ];
  }

  private encodeShield(shield: ShieldType): number {
    switch (shield) {
      case 'stability': return 0;
      case 'emotional': return 1;
      case 'execution': return 2;
      case 'memory': return 3;
      default: return 0;
    }
  }

  private encodeSource(src: string): number {
    if (src.includes('memory')) return 0;
    if (src.includes('worker')) return 1;
    if (src.includes('ui')) return 2;
    return 3;
  }

  /** Convert message signature into 0-1 bucket */
  private signatureHash(msg: string): number {
    let h = 0;
    for (let i = 0; i < msg.length; i++) h = (h << 5) - h + msg.charCodeAt(i) % 1000;
    return h / 1000;
  }

  private recencyWeight(ts: number): number {
    const minutes = (Date.now() - ts) / 60000;
    return Math.max(0, 1 - minutes / 10);
  }

  /** Lightweight KMeans clustering (deterministic k-cluster mode) */
  private kMeansLike(threats: ThreatRecord[], vectors: number[][]): {
    centroids: number[][];
    groups: number[][];
  } {
    const k = Math.min(5, threats.length);
    let centroids = vectors.slice(0, k);
    let groups: number[][] = Array.from({ length: k }, () => []);

    for (let iter = 0; iter < 5; iter++) {
      groups = Array.from({ length: k }, () => []);

      vectors.forEach((v, idx) => {
        let best = 0;
        let bestScore = -Infinity;

        for (let c = 0; c < k; c++) {
          const score = this.cosine(v, centroids[c]);
          if (score > bestScore) {
            bestScore = score;
            best = c;
          }
        }

        groups[best].push(idx);
      });

      // Update centroids
      centroids.length = k;
      for (let i = 0; i < k; i++) {
        if (!groups[i].length) continue;
        const sum = Array(this.VECTOR_SIZE).fill(0);
        groups[i].forEach(idx => {
          const v = vectors[idx];
          for (let j = 0; j < this.VECTOR_SIZE; j++) sum[j] += v[j];
        });
        centroids[i] = sum.map(x => x / groups[i].length);
      }
    }

    return { centroids, groups };
  }

  private cosine(a: number[], b: number[]): number {
    const d = dot(a, b);
    const ma = magnitude(a);
    const mb = magnitude(b);
    if (ma === 0 || mb === 0) return 0;
    return d / (ma * mb);
  }

  /** Convert grouped indexes into final cluster objects */
  private buildClusters(
    threats: ThreatRecord[],
    groups: number[][],
    centroids: number[][]
  ): ClusterResult[] {
    return groups
      .filter(g => g.length)
      .map((g, i) => {
        const items = g.map(idx => threats[idx]);

        return {
          clusterId: `cluster-${i}`,
          members: items,
          strength: this.computeStrength(items),
          centroid: centroids[i],
          summary: this.buildSummary(items),
          topSeverity: Math.max(...items.map(t => t.severity)),
          confidence: this.computeConfidence(items),
        };
      })
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3); // top-3 only
  }

  private computeStrength(items: ThreatRecord[]): number {
    const s = items.reduce((acc, t) => acc + t.severity, 0);
    return Math.min(100, (s / (items.length + 5)) * 100);
  }

  private computeConfidence(items: ThreatRecord[]): number {
    const uniqueSources = new Set(items.map(t => t.source)).size;
    const varPenalty = uniqueSources > 2 ? 0.7 : 1;
    return Math.min(
      100,
      Math.round((items.length * varPenalty + 12))
    );
  }

  private buildSummary(items: ThreatRecord[]): string {
    const sev = Math.max(...items.map(t => t.severity));
    const main = items[0];

    return `Cluster of ${items.length} threats — severity ${sev}, source ${main.source}, shield ${main.shield}`;
  }

  /** Public getter */
  public getClusters() {
    return this.clusters;
  }
}
