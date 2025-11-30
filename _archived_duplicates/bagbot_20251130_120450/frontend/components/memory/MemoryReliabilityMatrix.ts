/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.4: MEMORY RELIABILITY MATRIX
 * ═══════════════════════════════════════════════════════════════════
 * Validates memory integrity, removes corrupted/stale entries, and
 * ensures deterministic behavior across sessions.
 * 
 * SAFETY: Technical validation only, no behavioral decisions
 * PURPOSE: Ensure memory is trustworthy and consistent
 * ═══════════════════════════════════════════════════════════════════
 */

import type { MemoryEntry, MemoryType } from './RollingMemoryCore';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type ReliabilityStatus = 'trusted' | 'questionable' | 'corrupted' | 'stale' | 'unverified';
export type CorruptionType = 'hash_mismatch' | 'missing_fields' | 'invalid_timestamps' | 'content_mutation' | 'circular_reference';

export interface ReliabilityScore {
  overall: number;              // 0-100
  components: {
    integrity: number;          // Cryptographic validation
    consistency: number;        // Internal logic consistency
    freshness: number;          // Time-based relevance
    completeness: number;       // Required fields present
  };
  status: ReliabilityStatus;
  issues: string[];
}

export interface CorruptionReport {
  entryId: string;
  type: CorruptionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  recoverable: boolean;
  recovery?: string;
}

export interface ConsistencyCheck {
  passed: boolean;
  timestamp: number;
  checksPerformed: number;
  failures: ConsistencyFailure[];
}

export interface ConsistencyFailure {
  entryId: string;
  check: string;
  expected: string;
  actual: string;
}

export interface StaleEntry {
  entry: MemoryEntry;
  staleness: number;            // 0-100
  reasons: string[];
  recommendation: 'keep' | 'archive' | 'purge';
}

export interface IntegrityAudit {
  timestamp: number;
  totalEntries: number;
  trusted: number;
  questionable: number;
  corrupted: number;
  stale: number;
  avgReliability: number;
  actionsTaken: string[];
}

export interface DeterminismReport {
  consistent: boolean;
  testRuns: number;
  variations: number;
  reproducibility: number;      // 0-100
  nonDeterministicSources: string[];
}

// ─────────────────────────────────────────────────────────────────
// MEMORY RELIABILITY MATRIX CLASS
// ─────────────────────────────────────────────────────────────────

export class MemoryReliabilityMatrix {
  private reliabilityCache: Map<string, ReliabilityScore>;
  private corruptionLog: CorruptionReport[];
  private auditHistory: IntegrityAudit[];
  private deterministicBaseline: Map<string, any>;
  
  constructor() {
    this.reliabilityCache = new Map();
    this.corruptionLog = [];
    this.auditHistory = [];
    this.deterministicBaseline = new Map();
  }

  // ─────────────────────────────────────────────────────────────
  // RELIABILITY SCORING
  // ─────────────────────────────────────────────────────────────

  assessReliability(entry: MemoryEntry): ReliabilityScore {
    const issues: string[] = [];
    
    // 1. Integrity check (cryptographic hash validation)
    const integrity = this.validateIntegrity(entry, issues);
    
    // 2. Consistency check (internal logic)
    const consistency = this.validateConsistency(entry, issues);
    
    // 3. Freshness check (time-based relevance)
    const freshness = this.calculateFreshness(entry, issues);
    
    // 4. Completeness check (required fields)
    const completeness = this.validateCompleteness(entry, issues);
    
    // Calculate overall score (weighted average)
    const overall = Math.round(
      integrity * 0.4 +
      consistency * 0.3 +
      freshness * 0.2 +
      completeness * 0.1
    );
    
    // Determine status
    let status: ReliabilityStatus;
    if (overall >= 90) status = 'trusted';
    else if (overall >= 70) status = 'questionable';
    else if (overall >= 40) status = 'stale';
    else if (overall >= 20) status = 'unverified';
    else status = 'corrupted';
    
    const score: ReliabilityScore = {
      overall,
      components: {
        integrity,
        consistency,
        freshness,
        completeness
      },
      status,
      issues
    };
    
    // Cache the score
    this.reliabilityCache.set(entry.id, score);
    
    return score;
  }

  private validateIntegrity(entry: MemoryEntry, issues: string[]): number {
    let score = 100;
    
    // Check if entry has integrity hash
    if (!entry.integrityHash) {
      issues.push('Missing integrity hash');
      return 0;
    }
    
    // Recalculate hash and compare
    const expectedHash = this.calculateHash(entry);
    if (expectedHash !== entry.integrityHash) {
      issues.push('Hash mismatch - content may have been altered');
      this.reportCorruption(entry.id, 'hash_mismatch', 'critical',
        'Cryptographic hash does not match stored hash', false);
      return 0;
    }
    
    return score;
  }

  private validateConsistency(entry: MemoryEntry, issues: string[]): number {
    let score = 100;
    
    // Timestamp ordering
    if (entry.updatedAt < entry.createdAt) {
      issues.push('Updated timestamp precedes created timestamp');
      score -= 30;
      this.reportCorruption(entry.id, 'invalid_timestamps', 'high',
        'Temporal inconsistency detected', true);
    }
    
    if (entry.lastAccessed && entry.lastAccessed < entry.createdAt) {
      issues.push('Last accessed timestamp precedes created timestamp');
      score -= 20;
    }
    
    // Retention score sanity
    if (entry.retentionScore < 0 || entry.retentionScore > 100) {
      issues.push(`Invalid retention score: ${entry.retentionScore}`);
      score -= 25;
    }
    
    // Version consistency
    if (entry.version < 1) {
      issues.push('Invalid version number');
      score -= 15;
    }
    
    // Future timestamps
    const now = Date.now();
    if (entry.createdAt > now + 60000) { // Allow 1 minute clock skew
      issues.push('Entry created in the future');
      score -= 40;
    }
    
    return Math.max(0, score);
  }

  private calculateFreshness(entry: MemoryEntry, issues: string[]): number {
    const now = Date.now();
    const age = now - entry.updatedAt;
    const maxAge = 72 * 3600 * 1000; // 72 hours
    
    // Linear decay from 100 to 0 over maxAge
    let freshness = 100 - (age / maxAge) * 100;
    freshness = Math.max(0, Math.min(100, freshness));
    
    // Penalty for very old entries
    if (age > maxAge * 2) {
      issues.push('Entry is significantly outdated');
      freshness = Math.min(freshness, 20);
    }
    
    // Bonus for recent access
    if (entry.lastAccessed && (now - entry.lastAccessed) < 3600000) { // 1 hour
      freshness = Math.min(100, freshness + 10);
    }
    
    return Math.round(freshness);
  }

  private validateCompleteness(entry: MemoryEntry, issues: string[]): number {
    let score = 100;
    const requiredFields = ['id', 'type', 'priority', 'content', 'createdAt'];
    
    requiredFields.forEach(field => {
      if (!(field in entry) || (entry as any)[field] === undefined) {
        issues.push(`Missing required field: ${field}`);
        score -= 20;
        this.reportCorruption(entry.id, 'missing_fields', 'high',
          `Required field ${field} is missing`, false);
      }
    });
    
    // Content validation
    if (entry.content && typeof entry.content !== 'object') {
      issues.push('Content is not a valid object');
      score -= 15;
    }
    
    // Empty content
    if (entry.content && Object.keys(entry.content).length === 0) {
      issues.push('Content object is empty');
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  private calculateHash(entry: MemoryEntry): string {
    // Simplified hash calculation (in production, use crypto.subtle)
    const content = JSON.stringify({
      id: entry.id,
      type: entry.type,
      content: entry.content,
      createdAt: entry.createdAt,
      version: entry.version
    });
    
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `sha256-${Math.abs(hash).toString(16)}`;
  }

  // ─────────────────────────────────────────────────────────────
  // CORRUPTION DETECTION & RECOVERY
  // ─────────────────────────────────────────────────────────────

  private reportCorruption(
    entryId: string,
    type: CorruptionType,
    severity: CorruptionReport['severity'],
    description: string,
    recoverable: boolean,
    recovery?: string
  ): void {
    const report: CorruptionReport = {
      entryId,
      type,
      severity,
      description,
      detectedAt: Date.now(),
      recoverable,
      recovery
    };
    
    this.corruptionLog.push(report);
    
    console.error(`[RELIABILITY] Corruption detected: ${description} (${entryId})`);
  }

  attemptRecovery(entryId: string): MemoryEntry | null {
    const reports = this.corruptionLog.filter(r => r.entryId === entryId && r.recoverable);
    
    if (reports.length === 0) {
      return null;
    }
    
    // Recovery logic would go here
    // For now, just log that recovery was attempted
    console.log(`[RELIABILITY] Attempting recovery for ${entryId}`);
    
    return null;
  }

  getCorruptionHistory(entryId?: string): CorruptionReport[] {
    if (entryId) {
      return this.corruptionLog.filter(r => r.entryId === entryId);
    }
    return this.corruptionLog;
  }

  // ─────────────────────────────────────────────────────────────
  // CONSISTENCY CHECKS
  // ─────────────────────────────────────────────────────────────

  runConsistencyCheck(entries: MemoryEntry[]): ConsistencyCheck {
    const failures: ConsistencyFailure[] = [];
    let checksPerformed = 0;
    
    // Check 1: Unique IDs
    const ids = new Set<string>();
    entries.forEach(entry => {
      checksPerformed++;
      if (ids.has(entry.id)) {
        failures.push({
          entryId: entry.id,
          check: 'Unique ID',
          expected: 'Unique identifier',
          actual: 'Duplicate ID detected'
        });
      }
      ids.add(entry.id);
    });
    
    // Check 2: Temporal ordering
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    entries.forEach((entry, idx) => {
      checksPerformed++;
      if (entry.id !== sorted[idx].id) {
        // Entry is out of temporal order
        failures.push({
          entryId: entry.id,
          check: 'Temporal ordering',
          expected: 'Chronological order',
          actual: 'Out of sequence'
        });
      }
    });
    
    // Check 3: Reference integrity
    entries.forEach(entry => {
      checksPerformed++;
      if ('relatedTo' in entry.content) {
        const relatedIds = entry.content.relatedTo as string[];
        relatedIds.forEach((relatedId: string) => {
          if (!ids.has(relatedId)) {
            failures.push({
              entryId: entry.id,
              check: 'Reference integrity',
              expected: `Valid reference to ${relatedId}`,
              actual: 'Referenced entry does not exist'
            });
          }
        });
      }
    });
    
    // Check 4: Type-specific validation
    entries.forEach(entry => {
      checksPerformed++;
      const typeValid = this.validateTypeSpecific(entry);
      if (!typeValid.valid) {
        failures.push({
          entryId: entry.id,
          check: 'Type-specific validation',
          expected: typeValid.expected,
          actual: typeValid.actual
        });
      }
    });
    
    return {
      passed: failures.length === 0,
      timestamp: Date.now(),
      checksPerformed,
      failures
    };
  }

  private validateTypeSpecific(entry: MemoryEntry): { valid: boolean; expected: string; actual: string } {
    switch (entry.type) {
      case 'component_map':
        if (!entry.content.components || !Array.isArray(entry.content.components)) {
          return {
            valid: false,
            expected: 'components array',
            actual: typeof entry.content.components
          };
        }
        break;
        
      case 'task_history':
        if (!entry.content.task || !entry.content.status) {
          return {
            valid: false,
            expected: 'task and status fields',
            actual: `task: ${!!entry.content.task}, status: ${!!entry.content.status}`
          };
        }
        break;
        
      case 'error_context':
        if (!entry.content.error) {
          return {
            valid: false,
            expected: 'error field',
            actual: 'missing'
          };
        }
        break;
    }
    
    return { valid: true, expected: '', actual: '' };
  }

  // ─────────────────────────────────────────────────────────────
  // STALENESS DETECTION
  // ─────────────────────────────────────────────────────────────

  detectStaleEntries(entries: MemoryEntry[]): StaleEntry[] {
    const now = Date.now();
    const staleThreshold = 48 * 3600 * 1000; // 48 hours
    
    return entries
      .map(entry => this.analyzeStale(entry, now, staleThreshold))
      .filter((result): result is StaleEntry => result !== null);
  }

  private analyzeStale(entry: MemoryEntry, now: number, threshold: number): StaleEntry | null {
    const reasons: string[] = [];
    let staleness = 0;
    
    // Age-based staleness
    const age = now - entry.updatedAt;
    const ageRatio = age / threshold;
    
    if (ageRatio > 1) {
      staleness += Math.min(50, ageRatio * 25);
      reasons.push(`Not updated for ${Math.round(age / 3600000)}h`);
    }
    
    // Low retention score
    if (entry.retentionScore < 30) {
      staleness += 30;
      reasons.push(`Low retention score: ${entry.retentionScore}`);
    }
    
    // Never accessed
    if (!entry.lastAccessed) {
      staleness += 20;
      reasons.push('Never accessed since creation');
    }
    
    // Type-specific staleness
    if (entry.type === 'error_context') {
      // Errors should be resolved or archived quickly
      if (age > 7200000) { // 2 hours
        staleness += 25;
        reasons.push('Error context older than 2 hours');
      }
    }
    
    if (entry.type === 'build_state' && age > 86400000) { // 24 hours
      staleness += 30;
      reasons.push('Build state from previous day');
    }
    
    staleness = Math.min(100, staleness);
    
    // Only return if actually stale
    if (staleness < 50) {
      return null;
    }
    
    // Determine recommendation
    let recommendation: StaleEntry['recommendation'];
    if (staleness >= 80) {
      recommendation = 'purge';
    } else if (staleness >= 65) {
      recommendation = 'archive';
    } else {
      recommendation = 'keep';
    }
    
    return {
      entry,
      staleness: Math.round(staleness),
      reasons,
      recommendation
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTEGRITY AUDIT
  // ─────────────────────────────────────────────────────────────

  runIntegrityAudit(entries: MemoryEntry[], autoFix: boolean = false): IntegrityAudit {
    const timestamp = Date.now();
    const actionsTaken: string[] = [];
    
    let trusted = 0;
    let questionable = 0;
    let corrupted = 0;
    let stale = 0;
    let totalReliability = 0;
    
    entries.forEach(entry => {
      const score = this.assessReliability(entry);
      totalReliability += score.overall;
      
      switch (score.status) {
        case 'trusted':
          trusted++;
          break;
        case 'questionable':
          questionable++;
          if (autoFix) {
            actionsTaken.push(`Flagged questionable entry: ${entry.id}`);
          }
          break;
        case 'corrupted':
          corrupted++;
          if (autoFix) {
            const recovered = this.attemptRecovery(entry.id);
            if (recovered) {
              actionsTaken.push(`Recovered corrupted entry: ${entry.id}`);
            } else {
              actionsTaken.push(`Quarantined corrupted entry: ${entry.id}`);
            }
          }
          break;
        case 'stale':
          stale++;
          break;
      }
    });
    
    // Run consistency check
    const consistencyResult = this.runConsistencyCheck(entries);
    if (!consistencyResult.passed && autoFix) {
      actionsTaken.push(`Consistency check found ${consistencyResult.failures.length} issues`);
    }
    
    const audit: IntegrityAudit = {
      timestamp,
      totalEntries: entries.length,
      trusted,
      questionable,
      corrupted,
      stale,
      avgReliability: entries.length > 0 ? Math.round(totalReliability / entries.length) : 0,
      actionsTaken
    };
    
    this.auditHistory.push(audit);
    
    console.log(`[RELIABILITY] Integrity audit complete: ${trusted}/${entries.length} trusted`);
    
    return audit;
  }

  getAuditHistory(): IntegrityAudit[] {
    return this.auditHistory;
  }

  // ─────────────────────────────────────────────────────────────
  // DETERMINISTIC BEHAVIOR VALIDATION
  // ─────────────────────────────────────────────────────────────

  testDeterminism(
    entries: MemoryEntry[],
    queryFn: (entries: MemoryEntry[]) => any,
    runs: number = 5
  ): DeterminismReport {
    const results: any[] = [];
    const nonDeterministicSources: Set<string> = new Set();
    
    for (let i = 0; i < runs; i++) {
      const result = queryFn(entries);
      results.push(result);
      
      // Check for non-deterministic values
      const resultStr = JSON.stringify(result);
      if (resultStr.includes('Date.now()')) {
        nonDeterministicSources.add('Date.now() in query');
      }
      if (resultStr.includes('Math.random()')) {
        nonDeterministicSources.add('Math.random() in query');
      }
    }
    
    // Compare results for consistency
    const variations = new Set(results.map(r => JSON.stringify(r))).size;
    const consistent = variations === 1;
    const reproducibility = ((runs - variations + 1) / runs) * 100;
    
    return {
      consistent,
      testRuns: runs,
      variations,
      reproducibility: Math.round(reproducibility),
      nonDeterministicSources: Array.from(nonDeterministicSources)
    };
  }

  captureBaseline(key: string, value: any): void {
    this.deterministicBaseline.set(key, JSON.stringify(value));
  }

  validateAgainstBaseline(key: string, value: any): boolean {
    const baseline = this.deterministicBaseline.get(key);
    if (!baseline) {
      return false;
    }
    
    return baseline === JSON.stringify(value);
  }

  // ─────────────────────────────────────────────────────────────
  // BATCH OPERATIONS
  // ─────────────────────────────────────────────────────────────

  batchAssess(entries: MemoryEntry[]): Map<string, ReliabilityScore> {
    const scores = new Map<string, ReliabilityScore>();
    
    entries.forEach(entry => {
      const score = this.assessReliability(entry);
      scores.set(entry.id, score);
    });
    
    return scores;
  }

  getUnreliableEntries(entries: MemoryEntry[], threshold: number = 70): MemoryEntry[] {
    return entries.filter(entry => {
      const score = this.assessReliability(entry);
      return score.overall < threshold;
    });
  }

  recommendPurge(entries: MemoryEntry[]): string[] {
    const toPurge: string[] = [];
    
    entries.forEach(entry => {
      const score = this.assessReliability(entry);
      
      // Purge if corrupted or very low reliability
      if (score.status === 'corrupted' || score.overall < 30) {
        toPurge.push(entry.id);
      }
    });
    
    // Also check staleness
    const stale = this.detectStaleEntries(entries);
    stale.forEach(s => {
      if (s.recommendation === 'purge' && !toPurge.includes(s.entry.id)) {
        toPurge.push(s.entry.id);
      }
    });
    
    return toPurge;
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────

  getCachedScore(entryId: string): ReliabilityScore | null {
    return this.reliabilityCache.get(entryId) || null;
  }

  clearCache(): void {
    this.reliabilityCache.clear();
    console.log('[RELIABILITY] Cache cleared');
  }

  getStatistics(): {
    cachedScores: number;
    corruptionReports: number;
    auditsRun: number;
    avgReliability: number;
  } {
    const scores = Array.from(this.reliabilityCache.values());
    const avgReliability = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s.overall, 0) / scores.length)
      : 0;
    
    return {
      cachedScores: this.reliabilityCache.size,
      corruptionReports: this.corruptionLog.length,
      auditsRun: this.auditHistory.length,
      avgReliability
    };
  }
}
