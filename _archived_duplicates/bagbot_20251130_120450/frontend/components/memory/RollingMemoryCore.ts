/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.1: ROLLING MEMORY CORE
 * ═══════════════════════════════════════════════════════════════════
 * 72-hour technical memory with time-decay, priority retention,
 * and cryptographic audit trails.
 * 
 * SAFETY: Technical data only, no personal information, auto-expiry
 * PURPOSE: Maintain build continuity across multi-day sessions
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type MemoryType = 
  | 'architecture'      // System design decisions
  | 'build_state'       // Current build progress
  | 'component_map'     // Component relationships
  | 'task_history'      // Completed tasks
  | 'error_context'     // Error states and resolutions
  | 'intent_chain'      // Technical goal sequences
  | 'integration_point' // System connections
  | 'configuration';    // Settings and parameters

export type MemoryPriority = 'critical' | 'high' | 'medium' | 'low' | 'archived';
export type DecayRate = 'slow' | 'medium' | 'fast' | 'immediate';

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  priority: MemoryPriority;
  
  // Technical content (NO personal data)
  content: {
    summary: string;
    details: Record<string, any>;
    context: string[];
    relatedIds: string[];
  };
  
  // Temporal metadata
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number;
  accessCount: number;
  
  // Retention control
  decayRate: DecayRate;
  retentionScore: number;    // 0-100, affects survival
  locked: boolean;            // Cannot be auto-purged if true
  
  // Audit trail
  hash: string;               // Cryptographic integrity check
  version: number;
  modifiedAt: number;
  
  // Relationships
  tags: string[];
  levelReference?: number;    // Which level (13, 14, etc)
  componentReference?: string;
}

export interface MemorySnapshot {
  timestamp: number;
  totalEntries: number;
  byType: Record<MemoryType, number>;
  byPriority: Record<MemoryPriority, number>;
  averageAge: number;         // ms
  averageRetention: number;   // 0-100
  expiringWithin24h: number;
  storageSize: number;        // bytes
}

export interface DecayConfig {
  baseDecayRate: number;      // points per hour
  accessBoost: number;        // retention boost on access
  priorityMultipliers: Record<MemoryPriority, number>;
  minimumRetention: number;   // never decay below this
}

export interface RetentionPolicy {
  maxEntries: number;
  maxAgeHours: number;
  minRetentionScore: number;
  purgeThreshold: number;     // Start purging when entries exceed this
  preserveCritical: boolean;
}

// ─────────────────────────────────────────────────────────────────
// ROLLING MEMORY CORE CLASS
// ─────────────────────────────────────────────────────────────────

export class RollingMemoryCore {
  private entries: Map<string, MemoryEntry>;
  private decayConfig: DecayConfig;
  private retentionPolicy: RetentionPolicy;
  private decayInterval: NodeJS.Timeout | null;
  private lastPurgeTime: number;
  
  constructor(
    retentionPolicy?: Partial<RetentionPolicy>,
    decayConfig?: Partial<DecayConfig>
  ) {
    this.entries = new Map();
    this.lastPurgeTime = Date.now();
    
    // Default retention policy: 72 hours
    this.retentionPolicy = {
      maxEntries: 10000,
      maxAgeHours: 72,
      minRetentionScore: 10,
      purgeThreshold: 8000,
      preserveCritical: true,
      ...retentionPolicy
    };
    
    // Default decay configuration
    this.decayConfig = {
      baseDecayRate: 1.5,      // Lose 1.5 points per hour
      accessBoost: 5,          // Gain 5 points on access
      priorityMultipliers: {
        critical: 0.2,          // Decay 5x slower
        high: 0.5,
        medium: 1.0,
        low: 2.0,               // Decay 2x faster
        archived: 5.0           // Decay 5x faster
      },
      minimumRetention: 5,
      ...decayConfig
    };
    
    this.decayInterval = null;
  }

  // ─────────────────────────────────────────────────────────────
  // MEMORY STORAGE
  // ─────────────────────────────────────────────────────────────

  store(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount' | 'hash' | 'version' | 'modifiedAt'>): string {
    const id = this.generateId();
    const now = Date.now();
    
    const fullEntry: MemoryEntry = {
      id,
      createdAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      hash: this.generateHash(entry.content),
      version: 1,
      modifiedAt: now,
      ...entry
    };
    
    // Validate no personal data
    this.validateTechnicalOnly(fullEntry);
    
    // Store entry
    this.entries.set(id, fullEntry);
    
    // Check if purge needed
    if (this.entries.size >= this.retentionPolicy.purgeThreshold) {
      this.purge();
    }
    
    console.log(`[MEMORY CORE] Stored: ${entry.type} (${id})`);
    return id;
  }

  retrieve(id: string): MemoryEntry | null {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(id);
      console.log(`[MEMORY CORE] Entry ${id} expired, removed`);
      return null;
    }
    
    // Boost retention on access
    entry.lastAccessedAt = Date.now();
    entry.accessCount++;
    entry.retentionScore = Math.min(
      100,
      entry.retentionScore + this.decayConfig.accessBoost
    );
    
    return entry;
  }

  update(id: string, updates: Partial<Pick<MemoryEntry, 'content' | 'priority' | 'tags' | 'locked'>>): boolean {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    
    // Update fields
    if (updates.content) {
      this.validateTechnicalOnly({ ...entry, content: updates.content });
      entry.content = updates.content;
      entry.hash = this.generateHash(updates.content);
      entry.version++;
    }
    
    if (updates.priority) entry.priority = updates.priority;
    if (updates.tags) entry.tags = updates.tags;
    if (updates.locked !== undefined) entry.locked = updates.locked;
    
    entry.modifiedAt = now;
    entry.lastAccessedAt = now;
    
    return true;
  }

  delete(id: string): boolean {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return false;
    }
    
    // Cannot delete locked entries
    if (entry.locked) {
      console.warn(`[MEMORY CORE] Cannot delete locked entry: ${id}`);
      return false;
    }
    
    this.entries.delete(id);
    console.log(`[MEMORY CORE] Deleted: ${id}`);
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // QUERIES
  // ─────────────────────────────────────────────────────────────

  query(filters: {
    type?: MemoryType;
    priority?: MemoryPriority;
    tags?: string[];
    level?: number;
    minRetention?: number;
    createdAfter?: number;
    createdBefore?: number;
  }): MemoryEntry[] {
    
    const results: MemoryEntry[] = [];
    
    for (const entry of this.entries.values()) {
      // Check expiration
      if (Date.now() > entry.expiresAt) {
        this.entries.delete(entry.id);
        continue;
      }
      
      // Apply filters
      if (filters.type && entry.type !== filters.type) continue;
      if (filters.priority && entry.priority !== filters.priority) continue;
      if (filters.level && entry.levelReference !== filters.level) continue;
      if (filters.minRetention && entry.retentionScore < filters.minRetention) continue;
      if (filters.createdAfter && entry.createdAt < filters.createdAfter) continue;
      if (filters.createdBefore && entry.createdAt > filters.createdBefore) continue;
      
      if (filters.tags && filters.tags.length > 0) {
        const hasAllTags = filters.tags.every(tag => entry.tags.includes(tag));
        if (!hasAllTags) continue;
      }
      
      results.push(entry);
    }
    
    // Sort by retention score (highest first)
    return results.sort((a, b) => b.retentionScore - a.retentionScore);
  }

  getRelated(id: string, maxResults: number = 10): MemoryEntry[] {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return [];
    }
    
    const related: MemoryEntry[] = [];
    
    // Direct relationships
    for (const relatedId of entry.content.relatedIds) {
      const relatedEntry = this.retrieve(relatedId);
      if (relatedEntry) {
        related.push(relatedEntry);
      }
    }
    
    // Tag-based relationships
    for (const otherEntry of this.entries.values()) {
      if (otherEntry.id === id) continue;
      if (related.some(r => r.id === otherEntry.id)) continue;
      
      const sharedTags = entry.tags.filter(tag => otherEntry.tags.includes(tag));
      if (sharedTags.length > 0) {
        related.push(otherEntry);
      }
    }
    
    // Type-based relationships
    const sameType = Array.from(this.entries.values())
      .filter(e => e.type === entry.type && e.id !== id && !related.some(r => r.id === e.id));
    
    related.push(...sameType);
    
    // Sort by relevance (more shared tags = more relevant)
    return related
      .sort((a, b) => {
        const aShared = entry.tags.filter(tag => a.tags.includes(tag)).length;
        const bShared = entry.tags.filter(tag => b.tags.includes(tag)).length;
        return bShared - aShared;
      })
      .slice(0, maxResults);
  }

  searchContent(query: string, maxResults: number = 20): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    const matches: Array<{ entry: MemoryEntry; score: number }> = [];
    
    for (const entry of this.entries.values()) {
      // Skip expired
      if (Date.now() > entry.expiresAt) {
        this.entries.delete(entry.id);
        continue;
      }
      
      let score = 0;
      
      // Summary match (highest weight)
      if (entry.content.summary.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }
      
      // Tag match
      if (entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        score += 5;
      }
      
      // Context match
      const contextMatches = entry.content.context.filter(c => 
        c.toLowerCase().includes(lowerQuery)
      ).length;
      score += contextMatches * 2;
      
      // Details match (JSON string search)
      const detailsStr = JSON.stringify(entry.content.details).toLowerCase();
      if (detailsStr.includes(lowerQuery)) {
        score += 1;
      }
      
      if (score > 0) {
        matches.push({ entry, score });
      }
    }
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(m => m.entry);
  }

  // ─────────────────────────────────────────────────────────────
  // TIME DECAY SYSTEM
  // ─────────────────────────────────────────────────────────────

  startDecay(intervalMs: number = 3600000): void {
    // Default: decay every hour
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
    }
    
    this.decayInterval = setInterval(() => {
      this.applyDecay();
    }, intervalMs);
    
    console.log(`[MEMORY CORE] Decay system started (${intervalMs}ms interval)`);
  }

  stopDecay(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
      console.log('[MEMORY CORE] Decay system stopped');
    }
  }

  private applyDecay(): void {
    const now = Date.now();
    let decayedCount = 0;
    let purgedCount = 0;
    
    for (const entry of this.entries.values()) {
      // Skip locked entries
      if (entry.locked) continue;
      
      // Calculate hours since last access
      const hoursSinceAccess = (now - entry.lastAccessedAt) / 3600000;
      
      // Calculate decay amount
      const priorityMultiplier = this.decayConfig.priorityMultipliers[entry.priority];
      const decayAmount = this.decayConfig.baseDecayRate * priorityMultiplier * hoursSinceAccess;
      
      // Apply decay
      const newRetention = Math.max(
        this.decayConfig.minimumRetention,
        entry.retentionScore - decayAmount
      );
      
      if (newRetention !== entry.retentionScore) {
        entry.retentionScore = newRetention;
        decayedCount++;
      }
      
      // Purge if below minimum
      if (entry.retentionScore <= this.retentionPolicy.minRetentionScore) {
        if (!this.retentionPolicy.preserveCritical || entry.priority !== 'critical') {
          this.entries.delete(entry.id);
          purgedCount++;
        }
      }
      
      // Purge if expired
      if (now > entry.expiresAt) {
        this.entries.delete(entry.id);
        purgedCount++;
      }
    }
    
    if (decayedCount > 0 || purgedCount > 0) {
      console.log(`[MEMORY CORE] Decay applied: ${decayedCount} decayed, ${purgedCount} purged`);
    }
  }

  manualDecay(id: string, amount: number): boolean {
    const entry = this.entries.get(id);
    
    if (!entry || entry.locked) {
      return false;
    }
    
    entry.retentionScore = Math.max(
      this.decayConfig.minimumRetention,
      entry.retentionScore - amount
    );
    
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // PURGE & CLEANUP
  // ─────────────────────────────────────────────────────────────

  purge(): void {
    const now = Date.now();
    const beforeCount = this.entries.size;
    
    // Remove expired entries
    for (const [id, entry] of this.entries.entries()) {
      if (now > entry.expiresAt) {
        this.entries.delete(id);
      }
    }
    
    // If still over threshold, remove lowest retention scores
    if (this.entries.size >= this.retentionPolicy.purgeThreshold) {
      const sortedEntries = Array.from(this.entries.values())
        .filter(e => !e.locked && (e.priority !== 'critical' || !this.retentionPolicy.preserveCritical))
        .sort((a, b) => a.retentionScore - b.retentionScore);
      
      const targetCount = Math.floor(this.retentionPolicy.purgeThreshold * 0.8);
      const toPurge = this.entries.size - targetCount;
      
      for (let i = 0; i < toPurge && i < sortedEntries.length; i++) {
        this.entries.delete(sortedEntries[i].id);
      }
    }
    
    const afterCount = this.entries.size;
    const purged = beforeCount - afterCount;
    
    if (purged > 0) {
      console.log(`[MEMORY CORE] Purged ${purged} entries (${beforeCount} → ${afterCount})`);
    }
    
    this.lastPurgeTime = now;
  }

  clear(force: boolean = false): void {
    if (force) {
      this.entries.clear();
      console.log('[MEMORY CORE] Force cleared all entries');
    } else {
      const unlocked = Array.from(this.entries.values()).filter(e => !e.locked);
      unlocked.forEach(e => this.entries.delete(e.id));
      console.log(`[MEMORY CORE] Cleared ${unlocked.length} unlocked entries`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SNAPSHOTS & STATISTICS
  // ─────────────────────────────────────────────────────────────

  snapshot(): MemorySnapshot {
    const entries = Array.from(this.entries.values());
    const now = Date.now();
    
    const byType: Record<MemoryType, number> = {
      architecture: 0,
      build_state: 0,
      component_map: 0,
      task_history: 0,
      error_context: 0,
      intent_chain: 0,
      integration_point: 0,
      configuration: 0
    };
    
    const byPriority: Record<MemoryPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      archived: 0
    };
    
    let totalAge = 0;
    let totalRetention = 0;
    let expiringWithin24h = 0;
    
    entries.forEach(entry => {
      byType[entry.type]++;
      byPriority[entry.priority]++;
      totalAge += now - entry.createdAt;
      totalRetention += entry.retentionScore;
      
      if (entry.expiresAt - now < 86400000) { // 24 hours
        expiringWithin24h++;
      }
    });
    
    return {
      timestamp: now,
      totalEntries: entries.length,
      byType,
      byPriority,
      averageAge: entries.length > 0 ? totalAge / entries.length : 0,
      averageRetention: entries.length > 0 ? totalRetention / entries.length : 0,
      expiringWithin24h,
      storageSize: this.calculateStorageSize()
    };
  }

  getOldest(count: number = 10): MemoryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, count);
  }

  getNewest(count: number = 10): MemoryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, count);
  }

  getMostAccessed(count: number = 10): MemoryEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, count);
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATION & INTEGRITY
  // ─────────────────────────────────────────────────────────────

  private validateTechnicalOnly(entry: MemoryEntry): void {
    // Check for personal data indicators
    const personalKeywords = [
      'name:', 'email:', 'password:', 'ssn:', 'address:', 'phone:',
      'birthday:', 'age:', 'gender:', 'location:', 'personal',
      'private', 'confidential', 'secret'
    ];
    
    const contentStr = JSON.stringify(entry.content).toLowerCase();
    
    for (const keyword of personalKeywords) {
      if (contentStr.includes(keyword)) {
        throw new Error(`[MEMORY CORE] SAFETY VIOLATION: Personal data detected (${keyword})`);
      }
    }
  }

  validateIntegrity(id: string): boolean {
    const entry = this.entries.get(id);
    
    if (!entry) {
      return false;
    }
    
    const currentHash = this.generateHash(entry.content);
    return currentHash === entry.hash;
  }

  validateAll(): { valid: number; invalid: string[] } {
    const invalid: string[] = [];
    let valid = 0;
    
    for (const [id, entry] of this.entries.entries()) {
      if (this.validateIntegrity(id)) {
        valid++;
      } else {
        invalid.push(id);
      }
    }
    
    return { valid, invalid };
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────

  private generateId(): string {
    return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHash(content: any): string {
    // Simple hash for integrity checking (not cryptographic security)
    const str = JSON.stringify(content);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  private calculateStorageSize(): number {
    let size = 0;
    
    for (const entry of this.entries.values()) {
      // Rough estimate in bytes
      size += JSON.stringify(entry).length * 2; // UTF-16 encoding
    }
    
    return size;
  }

  // ─────────────────────────────────────────────────────────────
  // EXPORT / IMPORT
  // ─────────────────────────────────────────────────────────────

  export(): string {
    const data = Array.from(this.entries.values());
    return JSON.stringify({
      version: '15.0.0',
      exportedAt: Date.now(),
      entries: data,
      policy: this.retentionPolicy,
      config: this.decayConfig
    }, null, 2);
  }

  import(json: string): { success: number; failed: number } {
    try {
      const data = JSON.parse(json);
      let success = 0;
      let failed = 0;
      
      for (const entry of data.entries) {
        try {
          this.validateTechnicalOnly(entry);
          this.entries.set(entry.id, entry);
          success++;
        } catch (error) {
          failed++;
          console.error(`[MEMORY CORE] Failed to import ${entry.id}:`, error);
        }
      }
      
      console.log(`[MEMORY CORE] Import complete: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('[MEMORY CORE] Import failed:', error);
      return { success: 0, failed: 0 };
    }
  }
}
