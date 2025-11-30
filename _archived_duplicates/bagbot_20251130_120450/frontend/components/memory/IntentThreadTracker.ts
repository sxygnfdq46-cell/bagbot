/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.3: INTENT THREAD TRACKER
 * ═══════════════════════════════════════════════════════════════════
 * Tracks technical intentions across sessions to prevent goal drift
 * and ensure builds stay aligned with original purpose.
 * 
 * SAFETY: Technical goals only, no autonomous decision-making
 * PURPOSE: Remember what you're trying to accomplish and why
 * ═══════════════════════════════════════════════════════════════════
 */

import type { MemoryEntry } from './RollingMemoryCore';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type IntentStatus = 'declared' | 'in_progress' | 'achieved' | 'blocked' | 'abandoned';
export type IntentType = 'build' | 'fix' | 'refactor' | 'integrate' | 'optimize' | 'document';

export interface TechnicalIntent {
  id: string;
  type: IntentType;
  status: IntentStatus;
  
  // Core declaration
  goal: string;                 // What you're trying to achieve
  reason: string;               // Why you're doing it
  success_criteria: string[];   // How to know when it's done
  
  // Temporal tracking
  declaredAt: number;
  startedAt?: number;
  achievedAt?: number;
  abandonedAt?: number;
  estimatedDuration?: number;   // ms
  
  // Progress tracking
  progress: number;             // 0-100
  milestones: IntentMilestone[];
  blockers: IntentBlocker[];
  
  // Context
  level?: number;
  components: string[];
  dependencies: string[];       // Other intent IDs this depends on
  relatedIntents: string[];
  memoryReferences: string[];   // Related memory entries
  
  // Clarity
  clarity: number;              // 0-100, how well-defined
  ambiguities: string[];
  assumptions: string[];
  
  // Metadata
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface IntentMilestone {
  timestamp: number;
  description: string;
  evidence: string[];           // Memory IDs or descriptions
  progressDelta: number;        // Change in progress %
}

export interface IntentBlocker {
  id: string;
  description: string;
  discoveredAt: number;
  resolvedAt?: number;
  severity: 'minor' | 'major' | 'critical';
  workaround?: string;
  resolution?: string;
}

export interface IntentChain {
  primary: TechnicalIntent;
  dependencies: TechnicalIntent[];
  dependents: TechnicalIntent[];
  sequence: TechnicalIntent[];   // Chronological order
  criticalPath: string[];        // IDs in critical path
}

export interface IntentDrift {
  intentId: string;
  originalGoal: string;
  currentDirection: string;
  driftSeverity: number;        // 0-100
  detectedAt: number;
  causes: string[];
  recommendations: string[];
}

export interface IntentAlignment {
  intentId: string;
  alignedWith: string[];        // Other intent IDs
  conflictsWith: string[];
  complementsOf: string[];
  overallAlignment: number;     // 0-100
}

export interface IntentSummary {
  total: number;
  byStatus: Record<IntentStatus, number>;
  byType: Record<IntentType, number>;
  avgProgress: number;
  avgClarity: number;
  activeCount: number;
  blockedCount: number;
  achievedToday: number;
}

// ─────────────────────────────────────────────────────────────────
// INTENT THREAD TRACKER CLASS
// ─────────────────────────────────────────────────────────────────

export class IntentThreadTracker {
  private intents: Map<string, TechnicalIntent>;
  private driftHistory: IntentDrift[];
  
  constructor() {
    this.intents = new Map();
    this.driftHistory = [];
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT DECLARATION
  // ─────────────────────────────────────────────────────────────

  declare(params: {
    goal: string;
    reason: string;
    success_criteria: string[];
    type?: IntentType;
    priority?: TechnicalIntent['priority'];
    level?: number;
    components?: string[];
    dependencies?: string[];
    estimatedDuration?: number;
    tags?: string[];
  }): string {
    
    const id = `intent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    // Calculate initial clarity
    const clarity = this.calculateClarity(
      params.goal,
      params.reason,
      params.success_criteria
    );
    
    const intent: TechnicalIntent = {
      id,
      type: params.type || 'build',
      status: 'declared',
      goal: params.goal,
      reason: params.reason,
      success_criteria: params.success_criteria,
      declaredAt: now,
      progress: 0,
      milestones: [],
      blockers: [],
      level: params.level,
      components: params.components || [],
      dependencies: params.dependencies || [],
      relatedIntents: [],
      memoryReferences: [],
      clarity,
      ambiguities: this.detectAmbiguities(params.goal, params.success_criteria),
      assumptions: [],
      tags: params.tags || [],
      priority: params.priority || 'medium',
      estimatedDuration: params.estimatedDuration
    };
    
    this.intents.set(id, intent);
    
    console.log(`[INTENT TRACKER] Declared: ${params.goal} (${id})`);
    console.log(`[INTENT TRACKER] Clarity: ${clarity}% | Ambiguities: ${intent.ambiguities.length}`);
    
    return id;
  }

  start(intentId: string): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent || intent.status !== 'declared') {
      return false;
    }
    
    intent.status = 'in_progress';
    intent.startedAt = Date.now();
    
    console.log(`[INTENT TRACKER] Started: ${intent.goal}`);
    return true;
  }

  achieve(intentId: string, evidence?: string[]): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return false;
    }
    
    const now = Date.now();
    
    intent.status = 'achieved';
    intent.achievedAt = now;
    intent.progress = 100;
    
    // Add final milestone
    intent.milestones.push({
      timestamp: now,
      description: 'Goal achieved',
      evidence: evidence || [],
      progressDelta: 100 - (intent.milestones.length > 0
        ? intent.milestones[intent.milestones.length - 1].progressDelta
        : 0)
    });
    
    console.log(`[INTENT TRACKER] Achieved: ${intent.goal}`);
    
    // Calculate actual duration
    if (intent.startedAt) {
      const actualDuration = now - intent.startedAt;
      console.log(`[INTENT TRACKER] Duration: ${Math.round(actualDuration / 1000)}s`);
    }
    
    return true;
  }

  abandon(intentId: string, reason: string): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return false;
    }
    
    intent.status = 'abandoned';
    intent.abandonedAt = Date.now();
    
    // Record as assumption for future reference
    intent.assumptions.push(`Abandoned: ${reason}`);
    
    console.log(`[INTENT TRACKER] Abandoned: ${intent.goal} - ${reason}`);
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // PROGRESS TRACKING
  // ─────────────────────────────────────────────────────────────

  updateProgress(intentId: string, progress: number, description?: string, evidence?: string[]): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return false;
    }
    
    const previousProgress = intent.progress;
    intent.progress = Math.max(0, Math.min(100, progress));
    
    // Add milestone if significant progress
    if (Math.abs(intent.progress - previousProgress) >= 10) {
      intent.milestones.push({
        timestamp: Date.now(),
        description: description || `Progress: ${intent.progress}%`,
        evidence: evidence || [],
        progressDelta: intent.progress - previousProgress
      });
    }
    
    // Check if achieved
    if (intent.progress >= 100 && intent.status === 'in_progress') {
      this.achieve(intentId, evidence);
    }
    
    return true;
  }

  addBlocker(intentId: string, blocker: Omit<IntentBlocker, 'id' | 'discoveredAt'>): string | null {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return null;
    }
    
    const blockerId = `blocker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const fullBlocker: IntentBlocker = {
      id: blockerId,
      discoveredAt: Date.now(),
      ...blocker
    };
    
    intent.blockers.push(fullBlocker);
    
    // Update status if critical
    if (blocker.severity === 'critical' && intent.status === 'in_progress') {
      intent.status = 'blocked';
    }
    
    console.log(`[INTENT TRACKER] Blocker added to ${intent.goal}: ${blocker.description}`);
    
    return blockerId;
  }

  resolveBlocker(intentId: string, blockerId: string, resolution: string): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return false;
    }
    
    const blocker = intent.blockers.find(b => b.id === blockerId);
    
    if (!blocker) {
      return false;
    }
    
    blocker.resolvedAt = Date.now();
    blocker.resolution = resolution;
    
    // Resume if all critical blockers resolved
    const unresolvedCritical = intent.blockers.filter(b =>
      !b.resolvedAt && b.severity === 'critical'
    );
    
    if (unresolvedCritical.length === 0 && intent.status === 'blocked') {
      intent.status = 'in_progress';
    }
    
    console.log(`[INTENT TRACKER] Blocker resolved: ${blocker.description}`);
    
    return true;
  }

  addMilestone(intentId: string, milestone: Omit<IntentMilestone, 'timestamp'>): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return false;
    }
    
    intent.milestones.push({
      timestamp: Date.now(),
      ...milestone
    });
    
    // Update progress if specified
    if (milestone.progressDelta) {
      intent.progress = Math.max(0, Math.min(100, intent.progress + milestone.progressDelta));
    }
    
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // DRIFT DETECTION
  // ─────────────────────────────────────────────────────────────

  detectDrift(intentId: string, currentActions: string[]): IntentDrift | null {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return null;
    }
    
    // Calculate semantic similarity between goal and current actions
    const goalWords = this.extractKeywords(intent.goal);
    const actionWords = currentActions.flatMap(action => this.extractKeywords(action));
    
    const overlap = goalWords.filter(word => actionWords.includes(word));
    const alignment = goalWords.length > 0 ? (overlap.length / goalWords.length) * 100 : 100;
    const driftSeverity = 100 - alignment;
    
    // Only report if significant drift
    if (driftSeverity < 30) {
      return null;
    }
    
    const drift: IntentDrift = {
      intentId,
      originalGoal: intent.goal,
      currentDirection: currentActions.join(', '),
      driftSeverity,
      detectedAt: Date.now(),
      causes: this.inferDriftCauses(intent, currentActions),
      recommendations: this.generateDriftRecommendations(intent, driftSeverity)
    };
    
    this.driftHistory.push(drift);
    
    console.warn(`[INTENT TRACKER] Drift detected: ${driftSeverity.toFixed(1)}% drift from "${intent.goal}"`);
    
    return drift;
  }

  private inferDriftCauses(intent: TechnicalIntent, currentActions: string[]): string[] {
    const causes: string[] = [];
    
    // Blocker-induced drift
    if (intent.blockers.filter(b => !b.resolvedAt).length > 0) {
      causes.push('Active blockers forcing alternative approaches');
    }
    
    // Unclear goals
    if (intent.clarity < 60) {
      causes.push('Low goal clarity leading to scope expansion');
    }
    
    // Ambiguities
    if (intent.ambiguities.length > 0) {
      causes.push('Ambiguities causing misalignment');
    }
    
    // Time pressure
    if (intent.estimatedDuration) {
      const elapsed = Date.now() - (intent.startedAt || intent.declaredAt);
      if (elapsed > intent.estimatedDuration * 1.5) {
        causes.push('Behind schedule, taking shortcuts');
      }
    }
    
    return causes;
  }

  private generateDriftRecommendations(intent: TechnicalIntent, severity: number): string[] {
    const recommendations: string[] = [];
    
    if (severity > 70) {
      recommendations.push('CRITICAL: Review and redefine goal immediately');
      recommendations.push('Consider abandoning and re-declaring intent');
    } else if (severity > 50) {
      recommendations.push('HIGH: Realign actions with original goal');
      recommendations.push('Review success criteria');
    } else {
      recommendations.push('MODERATE: Monitor alignment closely');
      recommendations.push('Document deviations and reasons');
    }
    
    // Specific recommendations
    if (intent.blockers.length > 0) {
      recommendations.push('Address active blockers to reduce drift');
    }
    
    if (intent.ambiguities.length > 0) {
      recommendations.push('Clarify ambiguous aspects of goal');
    }
    
    return recommendations;
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT CHAINS
  // ─────────────────────────────────────────────────────────────

  getChain(intentId: string): IntentChain | null {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return null;
    }
    
    // Get dependencies
    const dependencies = intent.dependencies
      .map(id => this.intents.get(id))
      .filter((i): i is TechnicalIntent => i !== undefined);
    
    // Get dependents (intents that depend on this one)
    const dependents = Array.from(this.intents.values())
      .filter(i => i.dependencies.includes(intentId));
    
    // Build chronological sequence
    const allRelated = [intent, ...dependencies, ...dependents];
    const sequence = allRelated.sort((a, b) => a.declaredAt - b.declaredAt);
    
    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(intent);
    
    return {
      primary: intent,
      dependencies,
      dependents,
      sequence,
      criticalPath
    };
  }

  private calculateCriticalPath(intent: TechnicalIntent): string[] {
    const path: string[] = [intent.id];
    
    // Add unfinished dependencies
    const unfinishedDeps = intent.dependencies
      .map(id => this.intents.get(id))
      .filter((i): i is TechnicalIntent => i !== undefined && i.status !== 'achieved');
    
    unfinishedDeps.forEach(dep => {
      path.unshift(dep.id);
      // Recursively add their dependencies
      const subPath = this.calculateCriticalPath(dep);
      path.unshift(...subPath.filter(id => !path.includes(id)));
    });
    
    return path;
  }

  // ─────────────────────────────────────────────────────────────
  // ALIGNMENT ANALYSIS
  // ─────────────────────────────────────────────────────────────

  analyzeAlignment(intentId: string): IntentAlignment {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return {
        intentId,
        alignedWith: [],
        conflictsWith: [],
        complementsOf: [],
        overallAlignment: 0
      };
    }
    
    const alignedWith: string[] = [];
    const conflictsWith: string[] = [];
    const complementsOf: string[] = [];
    
    // Compare with all other active intents
    for (const other of this.intents.values()) {
      if (other.id === intentId) continue;
      if (other.status === 'achieved' || other.status === 'abandoned') continue;
      
      const relationship = this.determineRelationship(intent, other);
      
      if (relationship === 'aligned') alignedWith.push(other.id);
      else if (relationship === 'conflict') conflictsWith.push(other.id);
      else if (relationship === 'complement') complementsOf.push(other.id);
    }
    
    // Calculate overall alignment score
    const totalActive = Array.from(this.intents.values())
      .filter(i => i.status === 'in_progress' || i.status === 'declared').length - 1;
    
    const alignmentScore = totalActive > 0
      ? ((alignedWith.length + complementsOf.length) / totalActive) * 100
      : 100;
    
    return {
      intentId,
      alignedWith,
      conflictsWith,
      complementsOf,
      overallAlignment: Math.round(alignmentScore)
    };
  }

  private determineRelationship(intent1: TechnicalIntent, intent2: TechnicalIntent): 'aligned' | 'conflict' | 'complement' | 'unrelated' {
    // Check component overlap
    const sharedComponents = intent1.components.filter(c => intent2.components.includes(c));
    
    // Check tag overlap
    const sharedTags = intent1.tags.filter(t => intent2.tags.includes(t));
    
    // Check dependencies
    const isDependency = intent1.dependencies.includes(intent2.id) || intent2.dependencies.includes(intent1.id);
    
    // Same level and components = likely aligned
    if (intent1.level === intent2.level && sharedComponents.length > 0) {
      return 'aligned';
    }
    
    // Dependency relationship = complement
    if (isDependency) {
      return 'complement';
    }
    
    // Same components but different types = potential conflict
    if (sharedComponents.length > 0 && intent1.type !== intent2.type) {
      return 'conflict';
    }
    
    // Similar tags = aligned
    if (sharedTags.length >= 2) {
      return 'aligned';
    }
    
    return 'unrelated';
  }

  // ─────────────────────────────────────────────────────────────
  // CLARITY ANALYSIS
  // ─────────────────────────────────────────────────────────────

  private calculateClarity(goal: string, reason: string, criteria: string[]): number {
    let score = 100;
    
    // Goal clarity
    if (goal.length < 20) score -= 20;
    if (goal.includes('?')) score -= 10;
    if (this.extractKeywords(goal).length < 3) score -= 15;
    
    // Reason clarity
    if (reason.length < 10) score -= 20;
    if (reason === goal) score -= 10; // Redundant
    
    // Success criteria
    if (criteria.length === 0) score -= 30;
    else if (criteria.length < 2) score -= 15;
    
    // Vague words
    const vagueWords = ['maybe', 'somehow', 'probably', 'might', 'could', 'eventually'];
    const goalVague = vagueWords.some(word => goal.toLowerCase().includes(word));
    if (goalVague) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private detectAmbiguities(goal: string, criteria: string[]): string[] {
    const ambiguities: string[] = [];
    
    // Vague quantifiers
    const vagueQuantifiers = ['some', 'few', 'many', 'several', 'various'];
    vagueQuantifiers.forEach(word => {
      if (goal.toLowerCase().includes(word)) {
        ambiguities.push(`Vague quantifier: "${word}"`);
      }
    });
    
    // Unclear timeline
    const timeWords = ['soon', 'later', 'eventually', 'sometime'];
    timeWords.forEach(word => {
      if (goal.toLowerCase().includes(word)) {
        ambiguities.push(`Unclear timeline: "${word}"`);
      }
    });
    
    // Missing measurables in criteria
    if (criteria.every(c => !this.hasMeasurable(c))) {
      ambiguities.push('No measurable success criteria');
    }
    
    return ambiguities;
  }

  private hasMeasurable(criterion: string): boolean {
    const measurablePatterns = [
      /\d+/,                    // Numbers
      /complete|done|finished/, // Completion terms
      /test|verify|validate/,   // Verification terms
      /error.*zero|no.*error/i  // Error conditions
    ];
    
    return measurablePatterns.some(pattern => pattern.test(criterion));
  }

  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  // ─────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────

  getIntent(intentId: string): TechnicalIntent | null {
    return this.intents.get(intentId) || null;
  }

  getActive(): TechnicalIntent[] {
    return Array.from(this.intents.values())
      .filter(i => i.status === 'in_progress' || i.status === 'declared')
      .sort((a, b) => b.progress - a.progress);
  }

  getBlocked(): TechnicalIntent[] {
    return Array.from(this.intents.values())
      .filter(i => i.status === 'blocked');
  }

  getByLevel(level: number): TechnicalIntent[] {
    return Array.from(this.intents.values())
      .filter(i => i.level === level);
  }

  search(query: string): TechnicalIntent[] {
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.intents.values()).filter(intent => {
      return (
        intent.goal.toLowerCase().includes(lowerQuery) ||
        intent.reason.toLowerCase().includes(lowerQuery) ||
        intent.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        intent.components.some(comp => comp.toLowerCase().includes(lowerQuery))
      );
    });
  }

  // ─────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────

  getSummary(): IntentSummary {
    const intents = Array.from(this.intents.values());
    const now = Date.now();
    const today = now - 86400000; // 24 hours
    
    const byStatus: Record<IntentStatus, number> = {
      declared: 0,
      in_progress: 0,
      achieved: 0,
      blocked: 0,
      abandoned: 0
    };
    
    const byType: Record<IntentType, number> = {
      build: 0,
      fix: 0,
      refactor: 0,
      integrate: 0,
      optimize: 0,
      document: 0
    };
    
    let totalProgress = 0;
    let totalClarity = 0;
    let activeCount = 0;
    let blockedCount = 0;
    let achievedToday = 0;
    
    intents.forEach(intent => {
      byStatus[intent.status]++;
      byType[intent.type]++;
      totalProgress += intent.progress;
      totalClarity += intent.clarity;
      
      if (intent.status === 'in_progress' || intent.status === 'declared') {
        activeCount++;
      }
      
      if (intent.status === 'blocked') {
        blockedCount++;
      }
      
      if (intent.achievedAt && intent.achievedAt > today) {
        achievedToday++;
      }
    });
    
    return {
      total: intents.length,
      byStatus,
      byType,
      avgProgress: intents.length > 0 ? Math.round(totalProgress / intents.length) : 0,
      avgClarity: intents.length > 0 ? Math.round(totalClarity / intents.length) : 0,
      activeCount,
      blockedCount,
      achievedToday
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  archive(intentId: string): boolean {
    const intent = this.intents.get(intentId);
    
    if (!intent) {
      return false;
    }
    
    // Only archive achieved or abandoned intents
    if (intent.status !== 'achieved' && intent.status !== 'abandoned') {
      return false;
    }
    
    // In a real system, this would move to long-term storage
    this.intents.delete(intentId);
    
    console.log(`[INTENT TRACKER] Archived: ${intent.goal}`);
    return true;
  }

  purgeOld(maxAgeMs: number): number {
    const now = Date.now();
    let purged = 0;
    
    for (const [id, intent] of this.intents.entries()) {
      const age = now - intent.declaredAt;
      
      if (age > maxAgeMs && (intent.status === 'achieved' || intent.status === 'abandoned')) {
        this.intents.delete(id);
        purged++;
      }
    }
    
    return purged;
  }

  clear(): void {
    this.intents.clear();
    this.driftHistory = [];
    console.log('[INTENT TRACKER] Cleared all intents');
  }
}
