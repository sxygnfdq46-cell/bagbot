/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 15.6: MEMORY AUDIT GATE
 * ═══════════════════════════════════════════════════════════════════
 * Mandatory safety gate ensuring memory is only used when approved.
 * Logs all read/write operations and enforces expiration.
 * 
 * SAFETY: Mandatory approval for all memory operations
 * PURPOSE: User control and transparency over memory usage
 * ═══════════════════════════════════════════════════════════════════
 */

import type { MemoryEntry, MemoryType } from './RollingMemoryCore';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type OperationType = 'read' | 'write' | 'update' | 'delete' | 'query' | 'purge';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface AuditEntry {
  id: string;
  operation: OperationType;
  timestamp: number;
  targetId?: string;
  targetType?: MemoryType;
  approved: boolean;
  approvedAt?: number;
  rejectedAt?: number;
  approver?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ApprovalRequest {
  id: string;
  operation: OperationType;
  description: string;
  targetId?: string;
  affectedEntries: number;
  requestedAt: number;
  expiresAt: number;
  status: ApprovalStatus;
  response?: ApprovalResponse;
}

export interface ApprovalResponse {
  approved: boolean;
  timestamp: number;
  reason?: string;
  approver: string;
}

export interface AuditLog {
  entries: AuditEntry[];
  totalOperations: number;
  approvedOperations: number;
  rejectedOperations: number;
  pendingApprovals: number;
}

export interface ExpirationPolicy {
  defaultTTL: number;           // ms (default 72 hours)
  type_overrides: Partial<Record<MemoryType, number>>;
  autoExpire: boolean;
  warnBeforeExpiry: number;     // ms (warn 1 hour before)
}

export interface MemoryStats {
  total: number;
  byType: Partial<Record<MemoryType, number>>;
  expiringSoon: number;
  expired: number;
  readsToday: number;
  writesToday: number;
}

// ─────────────────────────────────────────────────────────────────
// MEMORY AUDIT GATE CLASS
// ─────────────────────────────────────────────────────────────────

export class MemoryAuditGate {
  private auditLog: AuditEntry[];
  private pendingRequests: Map<string, ApprovalRequest>;
  private approvalCallbacks: Map<string, (approved: boolean) => void>;
  private expirationPolicy: ExpirationPolicy;
  private expirationTimers: Map<string, NodeJS.Timeout>;
  
  constructor(policy?: Partial<ExpirationPolicy>) {
    this.auditLog = [];
    this.pendingRequests = new Map();
    this.approvalCallbacks = new Map();
    this.expirationTimers = new Map();
    
    this.expirationPolicy = {
      defaultTTL: 72 * 3600 * 1000,  // 72 hours
      type_overrides: {
        error_context: 2 * 3600 * 1000,    // 2 hours
        build_state: 24 * 3600 * 1000,     // 24 hours
        task_history: 48 * 3600 * 1000,    // 48 hours
      },
      autoExpire: true,
      warnBeforeExpiry: 3600 * 1000,       // 1 hour
      ...policy
    };
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVAL REQUESTS
  // ─────────────────────────────────────────────────────────────

  async requestApproval(
    operation: OperationType,
    description: string,
    options: {
      targetId?: string;
      affectedEntries?: number;
      timeout?: number; // ms
    } = {}
  ): Promise<boolean> {
    const requestId = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timeout = options.timeout || 60000; // 1 minute default
    
    const request: ApprovalRequest = {
      id: requestId,
      operation,
      description,
      targetId: options.targetId,
      affectedEntries: options.affectedEntries || 1,
      requestedAt: Date.now(),
      expiresAt: Date.now() + timeout,
      status: 'pending'
    };
    
    this.pendingRequests.set(requestId, request);
    
    console.log(`[AUDIT GATE] Approval requested: ${description} (${requestId})`);
    
    // Return a promise that resolves when approval is given or times out
    return new Promise((resolve) => {
      this.approvalCallbacks.set(requestId, resolve);
      
      // Auto-reject on timeout
      setTimeout(() => {
        if (request.status === 'pending') {
          request.status = 'expired';
          this.pendingRequests.delete(requestId);
          this.approvalCallbacks.delete(requestId);
          
          console.warn(`[AUDIT GATE] Approval expired: ${requestId}`);
          resolve(false);
        }
      }, timeout);
    });
  }

  approve(requestId: string, approver: string = 'user', reason?: string): boolean {
    const request = this.pendingRequests.get(requestId);
    
    if (!request || request.status !== 'pending') {
      return false;
    }
    
    request.status = 'approved';
    request.response = {
      approved: true,
      timestamp: Date.now(),
      reason,
      approver
    };
    
    // Log the approval
    this.logOperation(request.operation, true, approver, {
      requestId,
      targetId: request.targetId,
      reason
    });
    
    // Execute callback
    const callback = this.approvalCallbacks.get(requestId);
    if (callback) {
      callback(true);
      this.approvalCallbacks.delete(requestId);
    }
    
    this.pendingRequests.delete(requestId);
    
    console.log(`[AUDIT GATE] Approved: ${request.description} by ${approver}`);
    return true;
  }

  reject(requestId: string, approver: string = 'user', reason?: string): boolean {
    const request = this.pendingRequests.get(requestId);
    
    if (!request || request.status !== 'pending') {
      return false;
    }
    
    request.status = 'rejected';
    request.response = {
      approved: false,
      timestamp: Date.now(),
      reason,
      approver
    };
    
    // Log the rejection
    this.logOperation(request.operation, false, approver, {
      requestId,
      targetId: request.targetId,
      reason
    });
    
    // Execute callback
    const callback = this.approvalCallbacks.get(requestId);
    if (callback) {
      callback(false);
      this.approvalCallbacks.delete(requestId);
    }
    
    this.pendingRequests.delete(requestId);
    
    console.log(`[AUDIT GATE] Rejected: ${request.description} by ${approver}`);
    return true;
  }

  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT LOGGING
  // ─────────────────────────────────────────────────────────────

  logOperation(
    operation: OperationType,
    approved: boolean,
    approver?: string,
    metadata?: Record<string, any>
  ): string {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const entry: AuditEntry = {
      id,
      operation,
      timestamp: Date.now(),
      targetId: metadata?.targetId,
      targetType: metadata?.targetType,
      approved,
      approver,
      reason: metadata?.reason,
      metadata
    };
    
    if (approved) {
      entry.approvedAt = Date.now();
    } else {
      entry.rejectedAt = Date.now();
    }
    
    this.auditLog.push(entry);
    
    return id;
  }

  getAuditLog(filters?: {
    operation?: OperationType;
    approved?: boolean;
    startTime?: number;
    endTime?: number;
    targetId?: string;
  }): AuditLog {
    let entries = [...this.auditLog];
    
    // Apply filters
    if (filters) {
      if (filters.operation) {
        entries = entries.filter(e => e.operation === filters.operation);
      }
      if (filters.approved !== undefined) {
        entries = entries.filter(e => e.approved === filters.approved);
      }
      if (filters.startTime) {
        entries = entries.filter(e => e.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        entries = entries.filter(e => e.timestamp <= filters.endTime!);
      }
      if (filters.targetId) {
        entries = entries.filter(e => e.targetId === filters.targetId);
      }
    }
    
    const approved = entries.filter(e => e.approved).length;
    const rejected = entries.filter(e => !e.approved).length;
    
    return {
      entries,
      totalOperations: entries.length,
      approvedOperations: approved,
      rejectedOperations: rejected,
      pendingApprovals: this.pendingRequests.size
    };
  }

  exportAuditLog(): string {
    return JSON.stringify(this.auditLog, null, 2);
  }

  clearOldAuditEntries(maxAgeMs: number): number {
    const now = Date.now();
    const before = this.auditLog.length;
    
    this.auditLog = this.auditLog.filter(entry => now - entry.timestamp < maxAgeMs);
    
    const removed = before - this.auditLog.length;
    console.log(`[AUDIT GATE] Cleared ${removed} old audit entries`);
    
    return removed;
  }

  // ─────────────────────────────────────────────────────────────
  // EXPIRATION MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  scheduleExpiration(entry: MemoryEntry): void {
    const ttl = this.getTTL(entry.type);
    const expiresAt = entry.createdAt + ttl;
    const timeUntilExpiry = expiresAt - Date.now();
    
    if (timeUntilExpiry <= 0) {
      console.warn(`[AUDIT GATE] Entry ${entry.id} already expired`);
      return;
    }
    
    // Schedule warning before expiry
    const warnTime = timeUntilExpiry - this.expirationPolicy.warnBeforeExpiry;
    if (warnTime > 0) {
      setTimeout(() => {
        console.warn(`[AUDIT GATE] Entry ${entry.id} expiring in ${this.expirationPolicy.warnBeforeExpiry / 60000} minutes`);
      }, warnTime);
    }
    
    // Schedule expiration
    const timer = setTimeout(() => {
      if (this.expirationPolicy.autoExpire) {
        this.expireEntry(entry.id);
      } else {
        console.warn(`[AUDIT GATE] Entry ${entry.id} has expired but autoExpire is disabled`);
      }
    }, timeUntilExpiry);
    
    this.expirationTimers.set(entry.id, timer);
  }

  private expireEntry(entryId: string): void {
    console.log(`[AUDIT GATE] Auto-expiring entry: ${entryId}`);
    
    // Log the expiration
    this.logOperation('delete', true, 'system:auto-expire', {
      targetId: entryId,
      reason: 'TTL exceeded'
    });
    
    // Clear timer
    const timer = this.expirationTimers.get(entryId);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(entryId);
    }
  }

  cancelExpiration(entryId: string): void {
    const timer = this.expirationTimers.get(entryId);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(entryId);
      console.log(`[AUDIT GATE] Cancelled expiration for ${entryId}`);
    }
  }

  getTTL(type: MemoryType): number {
    return this.expirationPolicy.type_overrides[type] || this.expirationPolicy.defaultTTL;
  }

  isExpired(entry: MemoryEntry): boolean {
    const ttl = this.getTTL(entry.type);
    const expiresAt = entry.createdAt + ttl;
    return Date.now() >= expiresAt;
  }

  getExpirationTime(entry: MemoryEntry): number {
    const ttl = this.getTTL(entry.type);
    return entry.createdAt + ttl;
  }

  getTimeUntilExpiry(entry: MemoryEntry): number {
    const expiresAt = this.getExpirationTime(entry);
    const remaining = expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  // ─────────────────────────────────────────────────────────────
  // SAFE OPERATION WRAPPERS
  // ─────────────────────────────────────────────────────────────

  async safeRead(entryId: string, skipApproval: boolean = false): Promise<boolean> {
    if (skipApproval) {
      this.logOperation('read', true, 'system:auto-approved', { targetId: entryId });
      return true;
    }
    
    const approved = await this.requestApproval(
      'read',
      `Read memory entry: ${entryId}`,
      { targetId: entryId }
    );
    
    return approved;
  }

  async safeWrite(entry: MemoryEntry, skipApproval: boolean = false): Promise<boolean> {
    // Check expiration
    if (this.isExpired(entry)) {
      console.error(`[AUDIT GATE] Cannot write expired entry: ${entry.id}`);
      return false;
    }
    
    if (skipApproval) {
      this.logOperation('write', true, 'system:auto-approved', {
        targetId: entry.id,
        targetType: entry.type
      });
      
      // Schedule expiration
      this.scheduleExpiration(entry);
      
      return true;
    }
    
    const approved = await this.requestApproval(
      'write',
      `Write memory entry: ${entry.type}`,
      { targetId: entry.id }
    );
    
    if (approved) {
      this.scheduleExpiration(entry);
    }
    
    return approved;
  }

  async safeUpdate(entryId: string, skipApproval: boolean = false): Promise<boolean> {
    if (skipApproval) {
      this.logOperation('update', true, 'system:auto-approved', { targetId: entryId });
      return true;
    }
    
    const approved = await this.requestApproval(
      'update',
      `Update memory entry: ${entryId}`,
      { targetId: entryId }
    );
    
    return approved;
  }

  async safeDelete(entryId: string, skipApproval: boolean = false): Promise<boolean> {
    if (skipApproval) {
      this.logOperation('delete', true, 'system:auto-approved', { targetId: entryId });
      this.cancelExpiration(entryId);
      return true;
    }
    
    const approved = await this.requestApproval(
      'delete',
      `Delete memory entry: ${entryId}`,
      { targetId: entryId }
    );
    
    if (approved) {
      this.cancelExpiration(entryId);
    }
    
    return approved;
  }

  async safePurge(count: number, skipApproval: boolean = false): Promise<boolean> {
    if (skipApproval) {
      this.logOperation('purge', true, 'system:auto-approved', { affectedEntries: count });
      return true;
    }
    
    const approved = await this.requestApproval(
      'purge',
      `Purge ${count} memory entries`,
      { affectedEntries: count }
    );
    
    return approved;
  }

  // ─────────────────────────────────────────────────────────────
  // STATISTICS & MONITORING
  // ─────────────────────────────────────────────────────────────

  getStatistics(entries: MemoryEntry[]): MemoryStats {
    const now = Date.now();
    const today = now - 86400000; // 24 hours
    
    const byType: Partial<Record<MemoryType, number>> = {};
    let expiringSoon = 0;
    let expired = 0;
    
    entries.forEach(entry => {
      // Count by type
      byType[entry.type] = (byType[entry.type] || 0) + 1;
      
      // Check expiration
      if (this.isExpired(entry)) {
        expired++;
      } else {
        const timeLeft = this.getTimeUntilExpiry(entry);
        if (timeLeft < this.expirationPolicy.warnBeforeExpiry) {
          expiringSoon++;
        }
      }
    });
    
    // Count recent operations
    const readsToday = this.auditLog.filter(e =>
      e.operation === 'read' && e.timestamp > today && e.approved
    ).length;
    
    const writesToday = this.auditLog.filter(e =>
      e.operation === 'write' && e.timestamp > today && e.approved
    ).length;
    
    return {
      total: entries.length,
      byType,
      expiringSoon,
      expired,
      readsToday,
      writesToday
    };
  }

  getApprovalRate(): number {
    if (this.auditLog.length === 0) return 100;
    
    const approved = this.auditLog.filter(e => e.approved).length;
    return Math.round((approved / this.auditLog.length) * 100);
  }

  getOperationBreakdown(): Record<OperationType, { approved: number; rejected: number }> {
    const breakdown: Record<OperationType, { approved: number; rejected: number }> = {
      read: { approved: 0, rejected: 0 },
      write: { approved: 0, rejected: 0 },
      update: { approved: 0, rejected: 0 },
      delete: { approved: 0, rejected: 0 },
      query: { approved: 0, rejected: 0 },
      purge: { approved: 0, rejected: 0 }
    };
    
    this.auditLog.forEach(entry => {
      if (entry.approved) {
        breakdown[entry.operation].approved++;
      } else {
        breakdown[entry.operation].rejected++;
      }
    });
    
    return breakdown;
  }

  // ─────────────────────────────────────────────────────────────
  // MANUAL CONTROLS
  // ─────────────────────────────────────────────────────────────

  extendExpiration(entryId: string, additionalTimeMs: number): void {
    // Cancel current timer
    this.cancelExpiration(entryId);
    
    // Schedule new expiration
    const timer = setTimeout(() => {
      if (this.expirationPolicy.autoExpire) {
        this.expireEntry(entryId);
      }
    }, additionalTimeMs);
    
    this.expirationTimers.set(entryId, timer);
    
    console.log(`[AUDIT GATE] Extended expiration for ${entryId} by ${Math.round(additionalTimeMs / 60000)} minutes`);
  }

  manualPurge(entryIds: string[]): void {
    entryIds.forEach(id => {
      this.cancelExpiration(id);
      this.logOperation('delete', true, 'user:manual-purge', { targetId: id });
    });
    
    console.log(`[AUDIT GATE] Manually purged ${entryIds.length} entries`);
  }

  updateExpirationPolicy(updates: Partial<ExpirationPolicy>): void {
    this.expirationPolicy = { ...this.expirationPolicy, ...updates };
    console.log('[AUDIT GATE] Expiration policy updated');
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  cleanup(): void {
    // Clear all timers
    for (const timer of this.expirationTimers.values()) {
      clearTimeout(timer);
    }
    this.expirationTimers.clear();
    
    // Clear pending requests
    this.pendingRequests.clear();
    this.approvalCallbacks.clear();
    
    console.log('[AUDIT GATE] Cleanup complete');
  }

  reset(): void {
    this.cleanup();
    this.auditLog = [];
    console.log('[AUDIT GATE] Reset complete');
  }
}
