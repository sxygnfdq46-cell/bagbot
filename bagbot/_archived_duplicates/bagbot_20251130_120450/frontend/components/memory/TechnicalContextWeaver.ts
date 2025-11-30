/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.2: TECHNICAL CONTEXT WEAVER
 * ═══════════════════════════════════════════════════════════════════
 * Weaves technical context across days, maintaining architectural
 * continuity and preventing system drift.
 * 
 * SAFETY: Technical continuity only, no decision-making
 * PURPOSE: Remember what was being built and why
 * ═══════════════════════════════════════════════════════════════════
 */

import type { MemoryEntry, MemoryType } from './RollingMemoryCore';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export interface ContextThread {
  id: string;
  name: string;
  description: string;
  startedAt: number;
  lastUpdatedAt: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  
  // Timeline
  entries: string[];          // Memory entry IDs in chronological order
  milestones: ContextMilestone[];
  
  // Relationships
  parentThreadId?: string;
  childThreadIds: string[];
  relatedThreadIds: string[];
  
  // Metadata
  level?: number;             // Which system level
  components: string[];       // Affected components
  tags: string[];
  confidence: number;         // 0-100, how coherent is this thread
}

export interface ContextMilestone {
  timestamp: number;
  description: string;
  memoryIds: string[];
  significance: 'minor' | 'major' | 'critical';
}

export interface ContextWeave {
  threads: ContextThread[];
  connections: ContextConnection[];
  timeline: TimelineNode[];
  summary: string;
  coherenceScore: number;     // 0-100, overall system coherence
}

export interface ContextConnection {
  fromThreadId: string;
  toThreadId: string;
  type: 'sequence' | 'dependency' | 'alternative' | 'conflict';
  strength: number;           // 0-100
  description: string;
}

export interface TimelineNode {
  timestamp: number;
  threadId: string;
  entryId: string;
  type: MemoryType;
  summary: string;
  significance: number;       // 0-100
}

export interface ContextGap {
  timeRange: [number, number];
  affectedThreads: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
}

export interface ContinuityReport {
  overall: 'excellent' | 'good' | 'fragmented' | 'lost';
  activeThreads: number;
  completedThreads: number;
  gaps: ContextGap[];
  recommendations: string[];
  lastSessionEnd: number;
  currentSessionStart: number;
}

// ─────────────────────────────────────────────────────────────────
// TECHNICAL CONTEXT WEAVER CLASS
// ─────────────────────────────────────────────────────────────────

export class TechnicalContextWeaver {
  private threads: Map<string, ContextThread>;
  private connections: ContextConnection[];
  private sessionBreakThreshold: number; // ms
  
  constructor(sessionBreakThreshold: number = 14400000) { // 4 hours default
    this.threads = new Map();
    this.connections = [];
    this.sessionBreakThreshold = sessionBreakThreshold;
  }

  // ─────────────────────────────────────────────────────────────
  // THREAD MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  createThread(params: {
    name: string;
    description: string;
    level?: number;
    components?: string[];
    tags?: string[];
    parentThreadId?: string;
  }): string {
    
    const id = `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const thread: ContextThread = {
      id,
      name: params.name,
      description: params.description,
      startedAt: now,
      lastUpdatedAt: now,
      status: 'active',
      entries: [],
      milestones: [],
      parentThreadId: params.parentThreadId,
      childThreadIds: [],
      relatedThreadIds: [],
      level: params.level,
      components: params.components || [],
      tags: params.tags || [],
      confidence: 100
    };
    
    this.threads.set(id, thread);
    
    // Link to parent
    if (params.parentThreadId) {
      const parent = this.threads.get(params.parentThreadId);
      if (parent) {
        parent.childThreadIds.push(id);
        this.addConnection({
          fromThreadId: params.parentThreadId,
          toThreadId: id,
          type: 'sequence',
          strength: 80,
          description: 'Parent-child relationship'
        });
      }
    }
    
    console.log(`[CONTEXT WEAVER] Created thread: ${params.name} (${id})`);
    return id;
  }

  addToThread(threadId: string, memoryId: string, significance?: 'minor' | 'major' | 'critical'): boolean {
    const thread = this.threads.get(threadId);
    
    if (!thread) {
      return false;
    }
    
    const now = Date.now();
    
    // Add entry
    thread.entries.push(memoryId);
    thread.lastUpdatedAt = now;
    
    // Create milestone if significant
    if (significance && significance !== 'minor') {
      thread.milestones.push({
        timestamp: now,
        description: `${significance} update`,
        memoryIds: [memoryId],
        significance
      });
    }
    
    // Recalculate confidence
    this.updateThreadConfidence(threadId);
    
    return true;
  }

  updateThread(threadId: string, updates: Partial<Pick<ContextThread, 'name' | 'description' | 'status' | 'tags' | 'components'>>): boolean {
    const thread = this.threads.get(threadId);
    
    if (!thread) {
      return false;
    }
    
    if (updates.name) thread.name = updates.name;
    if (updates.description) thread.description = updates.description;
    if (updates.status) thread.status = updates.status;
    if (updates.tags) thread.tags = updates.tags;
    if (updates.components) thread.components = updates.components;
    
    thread.lastUpdatedAt = Date.now();
    
    return true;
  }

  getThread(threadId: string): ContextThread | null {
    return this.threads.get(threadId) || null;
  }

  getActiveThreads(): ContextThread[] {
    return Array.from(this.threads.values())
      .filter(t => t.status === 'active')
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  }

  getThreadsByLevel(level: number): ContextThread[] {
    return Array.from(this.threads.values())
      .filter(t => t.level === level)
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
  }

  // ─────────────────────────────────────────────────────────────
  // CONTEXT WEAVING
  // ─────────────────────────────────────────────────────────────

  weave(memoryEntries: MemoryEntry[]): ContextWeave {
    // Sort by time
    const sorted = [...memoryEntries].sort((a, b) => a.createdAt - b.createdAt);
    
    // Build timeline
    const timeline: TimelineNode[] = sorted.map(entry => ({
      timestamp: entry.createdAt,
      threadId: this.findThreadForEntry(entry.id) || 'unthreaded',
      entryId: entry.id,
      type: entry.type,
      summary: entry.content.summary,
      significance: entry.retentionScore
    }));
    
    // Get all threads
    const threads = Array.from(this.threads.values());
    
    // Calculate coherence
    const coherenceScore = this.calculateCoherence(threads, memoryEntries);
    
    // Generate summary
    const summary = this.generateSummary(threads, timeline);
    
    return {
      threads,
      connections: this.connections,
      timeline,
      summary,
      coherenceScore
    };
  }

  private findThreadForEntry(entryId: string): string | undefined {
    for (const thread of this.threads.values()) {
      if (thread.entries.includes(entryId)) {
        return thread.id;
      }
    }
    return undefined;
  }

  private calculateCoherence(threads: ContextThread[], entries: MemoryEntry[]): number {
    if (threads.length === 0 || entries.length === 0) {
      return 0;
    }
    
    let totalScore = 0;
    let factors = 0;
    
    // Factor 1: Thread confidence
    const avgThreadConfidence = threads.reduce((sum, t) => sum + t.confidence, 0) / threads.length;
    totalScore += avgThreadConfidence;
    factors++;
    
    // Factor 2: Entry coverage (how many entries are in threads)
    const threadedEntries = new Set(threads.flatMap(t => t.entries));
    const coverageRate = (threadedEntries.size / entries.length) * 100;
    totalScore += coverageRate;
    factors++;
    
    // Factor 3: Connection strength
    const avgConnectionStrength = this.connections.length > 0
      ? this.connections.reduce((sum, c) => sum + c.strength, 0) / this.connections.length
      : 50;
    totalScore += avgConnectionStrength;
    factors++;
    
    // Factor 4: Recency (recent activity = higher coherence)
    const now = Date.now();
    const recentThreads = threads.filter(t => now - t.lastUpdatedAt < 86400000); // 24h
    const recencyScore = (recentThreads.length / threads.length) * 100;
    totalScore += recencyScore;
    factors++;
    
    return Math.round(totalScore / factors);
  }

  private generateSummary(threads: ContextThread[], timeline: TimelineNode[]): string {
    const active = threads.filter(t => t.status === 'active');
    const completed = threads.filter(t => t.status === 'completed');
    
    if (active.length === 0 && completed.length === 0) {
      return 'No active technical context';
    }
    
    const parts: string[] = [];
    
    if (active.length > 0) {
      const activeNames = active.map(t => t.name).join(', ');
      parts.push(`Active: ${activeNames}`);
    }
    
    if (completed.length > 0) {
      parts.push(`${completed.length} completed`);
    }
    
    if (timeline.length > 0) {
      const latest = timeline[timeline.length - 1];
      parts.push(`Latest: ${latest.summary}`);
    }
    
    return parts.join('. ');
  }

  // ─────────────────────────────────────────────────────────────
  // CONNECTIONS
  // ─────────────────────────────────────────────────────────────

  addConnection(connection: ContextConnection): void {
    // Check if connection already exists
    const exists = this.connections.some(c =>
      c.fromThreadId === connection.fromThreadId &&
      c.toThreadId === connection.toThreadId &&
      c.type === connection.type
    );
    
    if (!exists) {
      this.connections.push(connection);
      
      // Add to related threads
      const fromThread = this.threads.get(connection.fromThreadId);
      const toThread = this.threads.get(connection.toThreadId);
      
      if (fromThread && !fromThread.relatedThreadIds.includes(connection.toThreadId)) {
        fromThread.relatedThreadIds.push(connection.toThreadId);
      }
      
      if (toThread && !toThread.relatedThreadIds.includes(connection.fromThreadId)) {
        toThread.relatedThreadIds.push(connection.fromThreadId);
      }
    }
  }

  removeConnection(fromThreadId: string, toThreadId: string): boolean {
    const index = this.connections.findIndex(c =>
      c.fromThreadId === fromThreadId && c.toThreadId === toThreadId
    );
    
    if (index >= 0) {
      this.connections.splice(index, 1);
      return true;
    }
    
    return false;
  }

  getConnections(threadId: string): ContextConnection[] {
    return this.connections.filter(c =>
      c.fromThreadId === threadId || c.toThreadId === threadId
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GAP DETECTION
  // ─────────────────────────────────────────────────────────────

  detectGaps(entries: MemoryEntry[]): ContextGap[] {
    const gaps: ContextGap[] = [];
    
    if (entries.length === 0) {
      return gaps;
    }
    
    // Sort by time
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    
    // Find time gaps
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      const gapDuration = next.createdAt - current.createdAt;
      
      // If gap > session break threshold
      if (gapDuration > this.sessionBreakThreshold) {
        const affectedThreads = this.findAffectedThreads(current.createdAt, next.createdAt);
        
        const severity = this.assessGapSeverity(gapDuration, affectedThreads);
        
        gaps.push({
          timeRange: [current.createdAt, next.createdAt],
          affectedThreads: affectedThreads.map(t => t.id),
          description: `${Math.round(gapDuration / 3600000)}h gap in context`,
          severity,
          suggestions: this.generateGapSuggestions(affectedThreads)
        });
      }
    }
    
    return gaps;
  }

  private findAffectedThreads(startTime: number, endTime: number): ContextThread[] {
    return Array.from(this.threads.values()).filter(thread => {
      // Thread was active during this period
      return thread.startedAt <= endTime && thread.lastUpdatedAt >= startTime;
    });
  }

  private assessGapSeverity(gapMs: number, threads: ContextThread[]): 'low' | 'medium' | 'high' | 'critical' {
    const hours = gapMs / 3600000;
    
    // Critical if > 48h or many active threads
    if (hours > 48 || threads.length > 5) {
      return 'critical';
    }
    
    // High if > 24h or critical threads
    if (hours > 24 || threads.some(t => t.confidence < 50)) {
      return 'high';
    }
    
    // Medium if > 12h
    if (hours > 12) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateGapSuggestions(threads: ContextThread[]): string[] {
    const suggestions: string[] = [];
    
    if (threads.length > 0) {
      suggestions.push(`Review ${threads.length} affected thread(s)`);
      
      const active = threads.filter(t => t.status === 'active');
      if (active.length > 0) {
        suggestions.push(`Resume ${active.length} active thread(s)`);
      }
    }
    
    suggestions.push('Check for context loss or architectural drift');
    
    return suggestions;
  }

  // ─────────────────────────────────────────────────────────────
  // CONTINUITY ANALYSIS
  // ─────────────────────────────────────────────────────────────

  analyzeContinuity(entries: MemoryEntry[]): ContinuityReport {
    const gaps = this.detectGaps(entries);
    const activeThreads = this.getActiveThreads();
    const completedThreads = Array.from(this.threads.values())
      .filter(t => t.status === 'completed');
    
    // Determine overall status
    let overall: ContinuityReport['overall'];
    
    const criticalGaps = gaps.filter(g => g.severity === 'critical' || g.severity === 'high');
    
    if (criticalGaps.length > 0) {
      overall = 'lost';
    } else if (gaps.length > 2) {
      overall = 'fragmented';
    } else if (activeThreads.length > 0 && gaps.length <= 1) {
      overall = 'good';
    } else if (activeThreads.length > 0 && gaps.length === 0) {
      overall = 'excellent';
    } else {
      overall = 'fragmented';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (criticalGaps.length > 0) {
      recommendations.push('URGENT: Critical context gaps detected');
      recommendations.push('Review recent build history immediately');
    }
    
    if (activeThreads.length === 0) {
      recommendations.push('No active threads - consider resuming work');
    }
    
    activeThreads.filter(t => t.confidence < 60).forEach(thread => {
      recommendations.push(`Low confidence in thread: ${thread.name}`);
    });
    
    // Session detection
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    const lastSessionEnd = sorted.length > 0
      ? sorted[sorted.length - 1].createdAt
      : 0;
    
    const now = Date.now();
    const currentSessionStart = now - lastSessionEnd > this.sessionBreakThreshold
      ? now
      : lastSessionEnd;
    
    return {
      overall,
      activeThreads: activeThreads.length,
      completedThreads: completedThreads.length,
      gaps,
      recommendations,
      lastSessionEnd,
      currentSessionStart
    };
  }

  // ─────────────────────────────────────────────────────────────
  // THREAD CONFIDENCE
  // ─────────────────────────────────────────────────────────────

  private updateThreadConfidence(threadId: string): void {
    const thread = this.threads.get(threadId);
    
    if (!thread) {
      return;
    }
    
    let confidence = 100;
    const now = Date.now();
    
    // Factor 1: Time since last update
    const hoursSinceUpdate = (now - thread.lastUpdatedAt) / 3600000;
    if (hoursSinceUpdate > 48) confidence -= 30;
    else if (hoursSinceUpdate > 24) confidence -= 15;
    else if (hoursSinceUpdate > 12) confidence -= 5;
    
    // Factor 2: Number of entries
    if (thread.entries.length < 3) confidence -= 20;
    else if (thread.entries.length > 10) confidence += 10;
    
    // Factor 3: Milestones
    if (thread.milestones.length === 0) confidence -= 10;
    
    // Factor 4: Connections
    const connections = this.getConnections(thread.id);
    if (connections.length === 0) confidence -= 15;
    
    // Factor 5: Status
    if (thread.status === 'paused') confidence -= 20;
    else if (thread.status === 'abandoned') confidence = 0;
    
    thread.confidence = Math.max(0, Math.min(100, confidence));
  }

  recalculateAllConfidence(): void {
    for (const thread of this.threads.values()) {
      this.updateThreadConfidence(thread.id);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SEARCH & QUERY
  // ─────────────────────────────────────────────────────────────

  searchThreads(query: string): ContextThread[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.threads.values()).filter(thread => {
      return (
        thread.name.toLowerCase().includes(lowerQuery) ||
        thread.description.toLowerCase().includes(lowerQuery) ||
        thread.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        thread.components.some(comp => comp.toLowerCase().includes(lowerQuery))
      );
    });
  }

  getThreadPath(threadId: string): ContextThread[] {
    const path: ContextThread[] = [];
    let currentId: string | undefined = threadId;
    
    while (currentId) {
      const thread = this.threads.get(currentId);
      if (!thread) break;
      
      path.unshift(thread);
      currentId = thread.parentThreadId;
    }
    
    return path;
  }

  getThreadTree(threadId: string): ContextThread[] {
    const tree: ContextThread[] = [];
    const thread = this.threads.get(threadId);
    
    if (!thread) {
      return tree;
    }
    
    tree.push(thread);
    
    // Add children recursively
    for (const childId of thread.childThreadIds) {
      tree.push(...this.getThreadTree(childId));
    }
    
    return tree;
  }

  // ─────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────

  getStatistics() {
    const threads = Array.from(this.threads.values());
    
    const byStatus = {
      active: threads.filter(t => t.status === 'active').length,
      paused: threads.filter(t => t.status === 'paused').length,
      completed: threads.filter(t => t.status === 'completed').length,
      abandoned: threads.filter(t => t.status === 'abandoned').length
    };
    
    const totalEntries = threads.reduce((sum, t) => sum + t.entries.length, 0);
    const avgEntriesPerThread = threads.length > 0 ? totalEntries / threads.length : 0;
    const avgConfidence = threads.length > 0
      ? threads.reduce((sum, t) => sum + t.confidence, 0) / threads.length
      : 0;
    
    const now = Date.now();
    const activeIn24h = threads.filter(t => now - t.lastUpdatedAt < 86400000).length;
    
    return {
      totalThreads: threads.length,
      byStatus,
      totalConnections: this.connections.length,
      totalEntries,
      avgEntriesPerThread: Math.round(avgEntriesPerThread),
      avgConfidence: Math.round(avgConfidence),
      activeIn24h
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  purgeOldThreads(maxAgeMs: number): number {
    const now = Date.now();
    let purged = 0;
    
    for (const [id, thread] of this.threads.entries()) {
      if (now - thread.lastUpdatedAt > maxAgeMs && thread.status !== 'active') {
        this.threads.delete(id);
        purged++;
        
        // Remove connections
        this.connections = this.connections.filter(c =>
          c.fromThreadId !== id && c.toThreadId !== id
        );
      }
    }
    
    return purged;
  }

  clear(): void {
    this.threads.clear();
    this.connections = [];
    console.log('[CONTEXT WEAVER] Cleared all threads and connections');
  }
}
