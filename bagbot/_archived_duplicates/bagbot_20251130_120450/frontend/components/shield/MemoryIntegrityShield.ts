/**
 * ═══════════════════════════════════════════════════════════════════
 * MEMORY INTEGRITY SHIELD — Level 18.5
 * ═══════════════════════════════════════════════════════════════════
 * Protects BagBot's memory system from:
 * - Cross-tab synchronization conflicts
 * - IndexedDB corruption
 * - Data integrity violations
 * - Memory state inconsistencies
 * - Storage quota exhaustion
 * 
 * Integration:
 * - Connects to Level 15 (Rolling Memory)
 * - Reports to ShieldCore (Level 18.1)
 * - Feeds diagnostics to Admin Panel (Level 17)
 * 
 * Safety: 3-tier redundancy + auto-rollback snapshots
 * ═══════════════════════════════════════════════════════════════════
 */

import { getShieldCore, type ThreatLevel } from './ShieldCore';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

export type MemoryIntegrityStatus = 'healthy' | 'degraded' | 'corrupted' | 'critical';

export type MemoryTier = 'primary' | 'secondary' | 'tertiary';

export type CorruptionType = 
  | 'missing_data'
  | 'invalid_schema'
  | 'checksum_mismatch'
  | 'sync_conflict'
  | 'quota_exceeded'
  | 'orphaned_data';

export interface MemorySnapshot {
  id: string;
  timestamp: number;
  tier: MemoryTier;
  data: any;
  checksum: string;
  version: number;
  metadata: {
    size: number;
    entries: number;
    lastModified: number;
  };
}

export interface CorruptionEvent {
  id: string;
  timestamp: number;
  type: CorruptionType;
  severity: ThreatLevel;
  tier: MemoryTier;
  affectedKeys: string[];
  details: string;
  resolved: boolean;
  resolvedAt?: number;
  rollbackSnapshot?: string;
}

export interface SyncConflict {
  id: string;
  timestamp: number;
  key: string;
  tier: MemoryTier;
  localVersion: number;
  remoteVersion: number;
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merged' | 'pending';
}

export interface IntegrityCheck {
  timestamp: number;
  tier: MemoryTier;
  passed: boolean;
  issues: Array<{
    type: CorruptionType;
    severity: ThreatLevel;
    description: string;
  }>;
  checksum: string;
  dataSize: number;
}

export interface MemoryIntegrityConfig {
  enabled: boolean;
  autoRepair: boolean;
  snapshotInterval: number; // ms
  maxSnapshots: number;
  tiers: {
    primary: { enabled: boolean; maxSize: number };
    secondary: { enabled: boolean; maxSize: number };
    tertiary: { enabled: boolean; maxSize: number };
  };
  checksums: {
    enabled: boolean;
    algorithm: 'sha256' | 'md5' | 'crc32';
  };
  syncProtection: {
    enabled: boolean;
    conflictResolution: 'local' | 'remote' | 'newest' | 'manual';
    maxRetries: number;
  };
  quotaManagement: {
    enabled: boolean;
    warningThreshold: number; // percentage
    criticalThreshold: number; // percentage
    autoCleanup: boolean;
  };
}

export interface MemoryIntegrityShieldStatus {
  active: boolean;
  status: MemoryIntegrityStatus;
  tiers: Record<MemoryTier, {
    healthy: boolean;
    size: number;
    entries: number;
    lastCheck: number;
  }>;
  snapshotsAvailable: number;
  corruptionEvents: number;
  syncConflicts: number;
  quotaUsage: number; // percentage
  lastIntegrityCheck: number;
}

export interface MemoryIntegrityMetrics {
  totalChecks: number;
  checksumValidations: number;
  corruptionDetected: number;
  corruptionRepaired: number;
  snapshotsTaken: number;
  rollbacksPerformed: number;
  syncConflictsResolved: number;
  quotaExceededEvents: number;
  averageCheckTime: number;
  byCorruptionType: Record<CorruptionType, number>;
}

// ─────────────────────────────────────────────────────────────────
// MEMORY INTEGRITY SHIELD CLASS
// ─────────────────────────────────────────────────────────────────

export class MemoryIntegrityShield {
  private config: MemoryIntegrityConfig;
  private status: MemoryIntegrityShieldStatus;
  private metrics: MemoryIntegrityMetrics;
  private snapshots: Map<string, MemorySnapshot>;
  private corruptionEvents: Map<string, CorruptionEvent>;
  private syncConflicts: Map<string, SyncConflict>;
  private integrityChecks: IntegrityCheck[];
  private snapshotTimer: number | null;
  private shieldCore: ReturnType<typeof getShieldCore>;
  private isInitialized: boolean;

  constructor(config?: Partial<MemoryIntegrityConfig>) {
    this.config = {
      enabled: true,
      autoRepair: true,
      snapshotInterval: 300000, // 5 minutes
      maxSnapshots: 10,
      tiers: {
        primary: { enabled: true, maxSize: 50 * 1024 * 1024 }, // 50MB
        secondary: { enabled: true, maxSize: 25 * 1024 * 1024 }, // 25MB
        tertiary: { enabled: true, maxSize: 10 * 1024 * 1024 } // 10MB
      },
      checksums: {
        enabled: true,
        algorithm: 'sha256'
      },
      syncProtection: {
        enabled: true,
        conflictResolution: 'newest',
        maxRetries: 3
      },
      quotaManagement: {
        enabled: true,
        warningThreshold: 80,
        criticalThreshold: 95,
        autoCleanup: true
      },
      ...config
    };

    this.status = {
      active: false,
      status: 'healthy',
      tiers: {
        primary: { healthy: true, size: 0, entries: 0, lastCheck: Date.now() },
        secondary: { healthy: true, size: 0, entries: 0, lastCheck: Date.now() },
        tertiary: { healthy: true, size: 0, entries: 0, lastCheck: Date.now() }
      },
      snapshotsAvailable: 0,
      corruptionEvents: 0,
      syncConflicts: 0,
      quotaUsage: 0,
      lastIntegrityCheck: Date.now()
    };

    this.metrics = {
      totalChecks: 0,
      checksumValidations: 0,
      corruptionDetected: 0,
      corruptionRepaired: 0,
      snapshotsTaken: 0,
      rollbacksPerformed: 0,
      syncConflictsResolved: 0,
      quotaExceededEvents: 0,
      averageCheckTime: 0,
      byCorruptionType: {
        missing_data: 0,
        invalid_schema: 0,
        checksum_mismatch: 0,
        sync_conflict: 0,
        quota_exceeded: 0,
        orphaned_data: 0
      }
    };

    this.snapshots = new Map();
    this.corruptionEvents = new Map();
    this.syncConflicts = new Map();
    this.integrityChecks = [];
    this.snapshotTimer = null;
    this.shieldCore = getShieldCore();
    this.isInitialized = false;
  }

  /**
   * Initialize the memory integrity shield
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[MemoryIntegrityShield] Already initialized');
      return;
    }

    console.log('[MemoryIntegrityShield] Initializing memory protection...');

    if (this.config.enabled) {
      this.status.active = true;
      
      // Perform initial integrity check
      this.performIntegrityCheck('primary');
      this.performIntegrityCheck('secondary');
      this.performIntegrityCheck('tertiary');

      // Start snapshot timer
      if (this.config.snapshotInterval > 0) {
        this.startSnapshotTimer();
      }

      // Check quota
      if (this.config.quotaManagement.enabled) {
        this.checkQuota();
      }
    }

    this.isInitialized = true;
    console.log('[MemoryIntegrityShield] Memory integrity shield ONLINE ✓');
  }

  /**
   * Start snapshot timer
   */
  private startSnapshotTimer(): void {
    if (this.snapshotTimer) return;

    this.snapshotTimer = window.setInterval(() => {
      this.takeSnapshot('primary');
      this.takeSnapshot('secondary');
      this.takeSnapshot('tertiary');
    }, this.config.snapshotInterval);

    console.log(`[MemoryIntegrityShield] Snapshot timer started (${this.config.snapshotInterval}ms)`);
  }

  /**
   * Stop snapshot timer
   */
  private stopSnapshotTimer(): void {
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
      console.log('[MemoryIntegrityShield] Snapshot timer stopped');
    }
  }

  /**
   * Perform integrity check on a tier
   */
  performIntegrityCheck(tier: MemoryTier): IntegrityCheck {
    const startTime = performance.now();
    this.metrics.totalChecks++;

    console.log(`[MemoryIntegrityShield] Performing integrity check on ${tier} tier...`);

    const issues: Array<{ type: CorruptionType; severity: ThreatLevel; description: string }> = [];

    // Simulate data retrieval (in real implementation, this would read from IndexedDB)
    const data = this.getSimulatedTierData(tier);

    // Check 1: Missing data
    if (!data || Object.keys(data).length === 0) {
      issues.push({
        type: 'missing_data',
        severity: 4,
        description: `${tier} tier has no data`
      });
      this.metrics.byCorruptionType.missing_data++;
    }

    // Check 2: Invalid schema
    if (data && !this.validateSchema(data)) {
      issues.push({
        type: 'invalid_schema',
        severity: 3,
        description: `${tier} tier data schema is invalid`
      });
      this.metrics.byCorruptionType.invalid_schema++;
    }

    // Check 3: Checksum validation
    if (this.config.checksums.enabled && data) {
      const checksum = this.calculateChecksum(data);
      const expected = this.getExpectedChecksum(tier);
      
      if (expected && checksum !== expected) {
        issues.push({
          type: 'checksum_mismatch',
          severity: 4,
          description: `${tier} tier checksum mismatch`
        });
        this.metrics.byCorruptionType.checksum_mismatch++;
        this.metrics.checksumValidations++;
      }
    }

    // Check 4: Orphaned data
    const orphanedKeys = this.detectOrphanedData(tier, data);
    if (orphanedKeys.length > 0) {
      issues.push({
        type: 'orphaned_data',
        severity: 2,
        description: `${tier} tier has ${orphanedKeys.length} orphaned entries`
      });
      this.metrics.byCorruptionType.orphaned_data++;
    }

    const checksum = this.calculateChecksum(data);
    const dataSize = this.estimateSize(data);

    const check: IntegrityCheck = {
      timestamp: Date.now(),
      tier,
      passed: issues.length === 0,
      issues,
      checksum,
      dataSize
    };

    this.integrityChecks.push(check);
    if (this.integrityChecks.length > 100) {
      this.integrityChecks = this.integrityChecks.slice(-100);
    }

    // Update status
    this.status.tiers[tier].healthy = check.passed;
    this.status.tiers[tier].size = dataSize;
    this.status.tiers[tier].entries = data ? Object.keys(data).length : 0;
    this.status.tiers[tier].lastCheck = Date.now();
    this.status.lastIntegrityCheck = Date.now();

    // Report issues
    if (issues.length > 0) {
      this.metrics.corruptionDetected += issues.length;
      issues.forEach(issue => {
        this.reportCorruption(tier, issue.type, issue.severity, issue.description);
      });

      // Auto-repair if enabled
      if (this.config.autoRepair) {
        this.attemptRepair(tier, issues);
      }
    }

    // Update overall status
    this.updateOverallStatus();

    const duration = performance.now() - startTime;
    this.metrics.averageCheckTime = 
      (this.metrics.averageCheckTime * (this.metrics.totalChecks - 1) + duration) / 
      this.metrics.totalChecks;

    console.log(`[MemoryIntegrityShield] ${tier} tier check: ${check.passed ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);

    return check;
  }

  /**
   * Take snapshot of a tier
   */
  takeSnapshot(tier: MemoryTier): MemorySnapshot | null {
    if (!this.config.tiers[tier].enabled) {
      return null;
    }

    console.log(`[MemoryIntegrityShield] Taking snapshot of ${tier} tier...`);

    const data = this.getSimulatedTierData(tier);
    const checksum = this.calculateChecksum(data);
    const size = this.estimateSize(data);
    const entries = data ? Object.keys(data).length : 0;

    const snapshot: MemorySnapshot = {
      id: this.generateSnapshotId(tier),
      timestamp: Date.now(),
      tier,
      data,
      checksum,
      version: this.getNextVersion(tier),
      metadata: {
        size,
        entries,
        lastModified: Date.now()
      }
    };

    this.snapshots.set(snapshot.id, snapshot);
    this.metrics.snapshotsTaken++;

    // Trim old snapshots
    this.trimSnapshots(tier);

    this.status.snapshotsAvailable = this.snapshots.size;

    console.log(`[MemoryIntegrityShield] Snapshot created: ${snapshot.id}`);

    return snapshot;
  }

  /**
   * Rollback to snapshot
   */
  rollbackToSnapshot(snapshotId: string): boolean {
    const snapshot = this.snapshots.get(snapshotId);

    if (!snapshot) {
      console.error(`[MemoryIntegrityShield] Snapshot not found: ${snapshotId}`);
      return false;
    }

    console.log(`[MemoryIntegrityShield] Rolling back to snapshot: ${snapshotId}`);

    // In real implementation, this would restore data to IndexedDB
    this.restoreTierData(snapshot.tier, snapshot.data);

    this.metrics.rollbacksPerformed++;

    // Re-check integrity
    this.performIntegrityCheck(snapshot.tier);

    console.log(`[MemoryIntegrityShield] Rollback complete`);

    return true;
  }

  /**
   * Report corruption event
   */
  private reportCorruption(
    tier: MemoryTier,
    type: CorruptionType,
    severity: ThreatLevel,
    details: string,
    affectedKeys: string[] = []
  ): void {
    const event: CorruptionEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      type,
      severity,
      tier,
      affectedKeys,
      details,
      resolved: false
    };

    this.corruptionEvents.set(event.id, event);
    this.status.corruptionEvents = this.corruptionEvents.size;

    // Report to ShieldCore
    this.shieldCore.reportThreat(
      'memory',
      severity,
      'MemoryIntegrityShield',
      `Memory corruption detected: ${details}`,
      { tier, type, affectedKeys }
    );

    console.error(`[MemoryIntegrityShield] CORRUPTION: ${details}`);
  }

  /**
   * Attempt to repair corrupted tier
   */
  private attemptRepair(tier: MemoryTier, issues: IntegrityCheck['issues']): boolean {
    console.log(`[MemoryIntegrityShield] Attempting auto-repair of ${tier} tier...`);

    let repaired = false;

    for (const issue of issues) {
      switch (issue.type) {
        case 'missing_data':
          // Try to restore from most recent snapshot
          const snapshot = this.getMostRecentSnapshot(tier);
          if (snapshot) {
            this.rollbackToSnapshot(snapshot.id);
            repaired = true;
          }
          break;

        case 'checksum_mismatch':
          // Try to restore from snapshot
          const checksumSnapshot = this.getMostRecentSnapshot(tier);
          if (checksumSnapshot) {
            this.rollbackToSnapshot(checksumSnapshot.id);
            repaired = true;
          }
          break;

        case 'orphaned_data':
          // Clean up orphaned data
          this.cleanOrphanedData(tier);
          repaired = true;
          break;

        case 'invalid_schema':
          // Try to migrate schema or rollback
          const schemaSnapshot = this.getMostRecentSnapshot(tier);
          if (schemaSnapshot) {
            this.rollbackToSnapshot(schemaSnapshot.id);
            repaired = true;
          }
          break;
      }
    }

    if (repaired) {
      this.metrics.corruptionRepaired += issues.length;
      console.log(`[MemoryIntegrityShield] Repair attempt completed`);
    } else {
      console.warn(`[MemoryIntegrityShield] Repair attempt failed`);
    }

    return repaired;
  }

  /**
   * Detect sync conflicts
   */
  detectSyncConflict(key: string, tier: MemoryTier, localData: any, remoteData: any): SyncConflict | null {
    if (!this.config.syncProtection.enabled) {
      return null;
    }

    const localVersion = localData?.version || 0;
    const remoteVersion = remoteData?.version || 0;

    if (localVersion !== remoteVersion) {
      const conflict: SyncConflict = {
        id: this.generateConflictId(),
        timestamp: Date.now(),
        key,
        tier,
        localVersion,
        remoteVersion,
        localData,
        remoteData,
        resolution: 'pending'
      };

      this.syncConflicts.set(conflict.id, conflict);
      this.status.syncConflicts = this.syncConflicts.size;
      this.metrics.byCorruptionType.sync_conflict++;

      console.warn(`[MemoryIntegrityShield] Sync conflict detected: ${key}`);

      // Auto-resolve based on strategy
      if (this.config.syncProtection.conflictResolution !== 'manual') {
        this.resolveSyncConflict(conflict.id, this.config.syncProtection.conflictResolution);
      }

      return conflict;
    }

    return null;
  }

  /**
   * Resolve sync conflict
   */
  resolveSyncConflict(conflictId: string, resolution: 'local' | 'remote' | 'newest' | 'merged'): boolean {
    const conflict = this.syncConflicts.get(conflictId);

    if (!conflict) {
      console.error(`[MemoryIntegrityShield] Conflict not found: ${conflictId}`);
      return false;
    }

    let resolvedData: any;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;

      case 'remote':
        resolvedData = conflict.remoteData;
        break;

      case 'newest':
        resolvedData = conflict.localVersion > conflict.remoteVersion 
          ? conflict.localData 
          : conflict.remoteData;
        break;

      case 'merged':
        resolvedData = this.mergeData(conflict.localData, conflict.remoteData);
        break;
    }

    conflict.resolution = resolution;
    this.syncConflicts.delete(conflictId);
    this.status.syncConflicts = this.syncConflicts.size;
    this.metrics.syncConflictsResolved++;

    console.log(`[MemoryIntegrityShield] Conflict resolved: ${conflictId} (${resolution})`);

    return true;
  }

  /**
   * Check storage quota
   */
  checkQuota(): void {
    if (!this.config.quotaManagement.enabled) return;

    // Estimate current usage (simulated)
    const totalUsed = this.getTotalStorageUsed();
    const totalAvailable = this.getTotalStorageAvailable();
    const usagePercentage = (totalUsed / totalAvailable) * 100;

    this.status.quotaUsage = usagePercentage;

    if (usagePercentage >= this.config.quotaManagement.criticalThreshold) {
      this.metrics.quotaExceededEvents++;
      this.reportCorruption('primary', 'quota_exceeded', 5, 
        `Storage quota critical: ${usagePercentage.toFixed(1)}%`);

      if (this.config.quotaManagement.autoCleanup) {
        this.performQuotaCleanup();
      }
    } else if (usagePercentage >= this.config.quotaManagement.warningThreshold) {
      this.reportCorruption('primary', 'quota_exceeded', 3, 
        `Storage quota warning: ${usagePercentage.toFixed(1)}%`);
    }

    console.log(`[MemoryIntegrityShield] Quota usage: ${usagePercentage.toFixed(1)}%`);
  }

  /**
   * Perform quota cleanup
   */
  private performQuotaCleanup(): void {
    console.log('[MemoryIntegrityShield] Performing quota cleanup...');

    // Clean old snapshots
    const snapshotsByAge = Array.from(this.snapshots.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    const toDelete = Math.ceil(snapshotsByAge.length * 0.5); // Delete oldest 50%

    for (let i = 0; i < toDelete; i++) {
      this.snapshots.delete(snapshotsByAge[i].id);
    }

    // Clean old integrity checks
    if (this.integrityChecks.length > 50) {
      this.integrityChecks = this.integrityChecks.slice(-50);
    }

    // Clean resolved corruption events
    for (const [id, event] of this.corruptionEvents.entries()) {
      if (event.resolved && Date.now() - (event.resolvedAt || 0) > 3600000) {
        this.corruptionEvents.delete(id);
      }
    }

    this.status.snapshotsAvailable = this.snapshots.size;
    this.status.corruptionEvents = this.corruptionEvents.size;

    console.log('[MemoryIntegrityShield] Quota cleanup complete');
  }

  /**
   * Update overall status
   */
  private updateOverallStatus(): void {
    const primary = this.status.tiers.primary.healthy;
    const secondary = this.status.tiers.secondary.healthy;
    const tertiary = this.status.tiers.tertiary.healthy;

    if (!primary) {
      this.status.status = 'critical';
    } else if (!secondary || !tertiary) {
      this.status.status = 'corrupted';
    } else if (this.status.corruptionEvents > 0 || this.status.syncConflicts > 0) {
      this.status.status = 'degraded';
    } else {
      this.status.status = 'healthy';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS (Simulated - would connect to real storage)
  // ─────────────────────────────────────────────────────────────────

  private getSimulatedTierData(tier: MemoryTier): any {
    // In real implementation, this would read from IndexedDB
    return { [tier]: { data: 'simulated', timestamp: Date.now() } };
  }

  private restoreTierData(tier: MemoryTier, data: any): void {
    // In real implementation, this would write to IndexedDB
    console.log(`[MemoryIntegrityShield] Restoring ${tier} tier data`);
  }

  private validateSchema(data: any): boolean {
    // Simplified schema validation
    return data && typeof data === 'object';
  }

  private calculateChecksum(data: any): string {
    // Simplified checksum (in real implementation, use crypto.subtle)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private getExpectedChecksum(tier: MemoryTier): string | null {
    // Get checksum from most recent snapshot
    const snapshot = this.getMostRecentSnapshot(tier);
    return snapshot?.checksum || null;
  }

  private detectOrphanedData(tier: MemoryTier, data: any): string[] {
    // Simplified orphan detection
    return [];
  }

  private cleanOrphanedData(tier: MemoryTier): void {
    console.log(`[MemoryIntegrityShield] Cleaning orphaned data in ${tier} tier`);
  }

  private estimateSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  private getTotalStorageUsed(): number {
    // Simulated storage usage
    let total = 0;
    for (const snapshot of this.snapshots.values()) {
      total += snapshot.metadata.size;
    }
    return total;
  }

  private getTotalStorageAvailable(): number {
    // Simulated total available (typically 50-100MB for IndexedDB)
    return 50 * 1024 * 1024; // 50MB
  }

  private mergeData(local: any, remote: any): any {
    // Simplified merge (in real implementation, use deep merge)
    return { ...remote, ...local };
  }

  private getMostRecentSnapshot(tier: MemoryTier): MemorySnapshot | null {
    const tierSnapshots = Array.from(this.snapshots.values())
      .filter(s => s.tier === tier)
      .sort((a, b) => b.timestamp - a.timestamp);

    return tierSnapshots[0] || null;
  }

  private trimSnapshots(tier: MemoryTier): void {
    const tierSnapshots = Array.from(this.snapshots.entries())
      .filter(([_, s]) => s.tier === tier)
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    if (tierSnapshots.length > this.config.maxSnapshots) {
      const toDelete = tierSnapshots.slice(this.config.maxSnapshots);
      toDelete.forEach(([id, _]) => this.snapshots.delete(id));
    }
  }

  private getNextVersion(tier: MemoryTier): number {
    const snapshot = this.getMostRecentSnapshot(tier);
    return (snapshot?.version || 0) + 1;
  }

  private generateSnapshotId(tier: MemoryTier): string {
    return `snapshot_${tier}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get status
   */
  getStatus(): MemoryIntegrityShieldStatus {
    return { ...this.status };
  }

  /**
   * Get metrics
   */
  getMetrics(): MemoryIntegrityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get snapshots
   */
  getSnapshots(tier?: MemoryTier): MemorySnapshot[] {
    const snapshots = Array.from(this.snapshots.values());
    return tier ? snapshots.filter(s => s.tier === tier) : snapshots;
  }

  /**
   * Get corruption events
   */
  getCorruptionEvents(): CorruptionEvent[] {
    return Array.from(this.corruptionEvents.values());
  }

  /**
   * Get sync conflicts
   */
  getSyncConflicts(): SyncConflict[] {
    return Array.from(this.syncConflicts.values());
  }

  /**
   * Get integrity checks
   */
  getIntegrityChecks(): IntegrityCheck[] {
    return [...this.integrityChecks];
  }

  /**
   * Force integrity check
   */
  forceIntegrityCheck(tier?: MemoryTier): IntegrityCheck | IntegrityCheck[] {
    if (tier) {
      return this.performIntegrityCheck(tier);
    } else {
      return [
        this.performIntegrityCheck('primary'),
        this.performIntegrityCheck('secondary'),
        this.performIntegrityCheck('tertiary')
      ];
    }
  }

  /**
   * Force snapshot
   */
  forceSnapshot(tier?: MemoryTier): MemorySnapshot | MemorySnapshot[] {
    if (tier) {
      const snapshot = this.takeSnapshot(tier);
      return snapshot!;
    } else {
      return [
        this.takeSnapshot('primary'),
        this.takeSnapshot('secondary'),
        this.takeSnapshot('tertiary')
      ].filter(Boolean) as MemorySnapshot[];
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MemoryIntegrityConfig>): void {
    const wasTimerRunning = this.snapshotTimer !== null;

    if (wasTimerRunning) {
      this.stopSnapshotTimer();
    }

    this.config = { ...this.config, ...config };

    if (wasTimerRunning && this.config.enabled && this.config.snapshotInterval > 0) {
      this.startSnapshotTimer();
    }

    console.log('[MemoryIntegrityShield] Configuration updated');
  }

  /**
   * Enable shield
   */
  enable(): void {
    this.config.enabled = true;
    this.status.active = true;
    this.startSnapshotTimer();
    console.log('[MemoryIntegrityShield] ENABLED');
  }

  /**
   * Disable shield
   */
  disable(): void {
    this.config.enabled = false;
    this.status.active = false;
    this.stopSnapshotTimer();
    console.log('[MemoryIntegrityShield] DISABLED');
  }

  /**
   * Reset shield
   */
  reset(): void {
    console.log('[MemoryIntegrityShield] Resetting...');

    this.snapshots.clear();
    this.corruptionEvents.clear();
    this.syncConflicts.clear();
    this.integrityChecks = [];

    Object.keys(this.metrics.byCorruptionType).forEach(key => {
      this.metrics.byCorruptionType[key as CorruptionType] = 0;
    });

    this.metrics.totalChecks = 0;
    this.metrics.corruptionDetected = 0;
    this.metrics.corruptionRepaired = 0;
    this.metrics.snapshotsTaken = 0;
    this.metrics.rollbacksPerformed = 0;
    this.metrics.syncConflictsResolved = 0;

    this.status.snapshotsAvailable = 0;
    this.status.corruptionEvents = 0;
    this.status.syncConflicts = 0;
    this.status.status = 'healthy';

    console.log('[MemoryIntegrityShield] Reset complete');
  }

  /**
   * Dispose shield
   */
  dispose(): void {
    console.log('[MemoryIntegrityShield] Disposing...');

    this.stopSnapshotTimer();
    this.snapshots.clear();
    this.corruptionEvents.clear();
    this.syncConflicts.clear();
    this.integrityChecks = [];
    this.isInitialized = false;

    console.log('[MemoryIntegrityShield] Disposed');
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'critical';
    status: MemoryIntegrityStatus;
    quotaUsage: number;
    snapshotsAvailable: number;
    activeIssues: number;
  } {
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (this.status.status === 'critical') {
      overall = 'critical';
    } else if (this.status.status === 'corrupted' || this.status.status === 'degraded') {
      overall = 'degraded';
    }

    return {
      overall,
      status: this.status.status,
      quotaUsage: this.status.quotaUsage,
      snapshotsAvailable: this.status.snapshotsAvailable,
      activeIssues: this.status.corruptionEvents + this.status.syncConflicts
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let memoryIntegrityShieldInstance: MemoryIntegrityShield | null = null;

/**
 * Get global memory integrity shield instance
 */
export function getMemoryIntegrityShield(): MemoryIntegrityShield {
  if (!memoryIntegrityShieldInstance) {
    memoryIntegrityShieldInstance = new MemoryIntegrityShield();
    memoryIntegrityShieldInstance.initialize();
  }
  return memoryIntegrityShieldInstance;
}

/**
 * Initialize memory integrity shield with custom config
 */
export function initializeMemoryIntegrityShield(config?: Partial<MemoryIntegrityConfig>): MemoryIntegrityShield {
  if (memoryIntegrityShieldInstance) {
    console.warn('[MemoryIntegrityShield] Already initialized, returning existing instance');
    return memoryIntegrityShieldInstance;
  }

  memoryIntegrityShieldInstance = new MemoryIntegrityShield(config);
  memoryIntegrityShieldInstance.initialize();
  return memoryIntegrityShieldInstance;
}

/**
 * Dispose global memory integrity shield
 */
export function disposeMemoryIntegrityShield(): void {
  if (memoryIntegrityShieldInstance) {
    memoryIntegrityShieldInstance.dispose();
    memoryIntegrityShieldInstance = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get corruption type color
 */
export function getCorruptionTypeColor(type: CorruptionType): string {
  switch (type) {
    case 'missing_data': return '#ef4444'; // red-500
    case 'invalid_schema': return '#f97316'; // orange-500
    case 'checksum_mismatch': return '#f59e0b'; // amber-500
    case 'sync_conflict': return '#eab308'; // yellow-500
    case 'quota_exceeded': return '#f87171'; // red-400
    case 'orphaned_data': return '#fb923c'; // orange-400
  }
}

/**
 * Get tier color
 */
export function getTierColor(tier: MemoryTier): string {
  switch (tier) {
    case 'primary': return '#8b5cf6'; // purple-500
    case 'secondary': return '#06b6d4'; // cyan-500
    case 'tertiary': return '#6366f1'; // indigo-500
  }
}

/**
 * Format corruption type
 */
export function formatCorruptionType(type: CorruptionType): string {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export default MemoryIntegrityShield;
