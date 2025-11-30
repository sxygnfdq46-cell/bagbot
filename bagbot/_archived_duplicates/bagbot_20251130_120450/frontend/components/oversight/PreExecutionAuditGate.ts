/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.6: PRE-EXECUTION AUDIT GATE
 * ═══════════════════════════════════════════════════════════════════
 * HARD SAFETY GATE: No execution without explicit human approval.
 * Logs everything, enforces timeout, provides complete context.
 * 
 * CRITICAL RULE: BagBot CANNOT execute without Davis's approval
 * PURPOSE: Final human-in-the-loop safety checkpoint
 * ═══════════════════════════════════════════════════════════════════
 */

import type { OversightReport } from './OversightRecommendationEngine';
import type { RiskMap } from './RiskMapGenerator';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'modified';
export type ApprovalDecision = 'approve' | 'reject' | 'rewrite' | 'defer';

export interface ApprovalRequest {
  id: string;
  command: string;
  timestamp: number;
  expiresAt: number;
  
  // Complete context
  oversightReport: OversightReport;
  riskMap: RiskMap;
  
  // Status
  status: ApprovalStatus;
  decision?: ApprovalDecision;
  decisionTimestamp?: number;
  decisionReason?: string;
  
  // Modified command (if rewrite chosen)
  modifiedCommand?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  command: string;
  decision: ApprovalDecision;
  decisionReason: string;
  
  // Context snapshot
  riskZone: string;
  shouldProceed: boolean;
  warningCount: number;
  confidence: number;
  
  // Execution results (filled after execution)
  executed: boolean;
  executionStarted?: number;
  executionCompleted?: number;
  executionSuccess?: boolean;
  executionError?: string;
}

export interface AuditHistory {
  entries: AuditEntry[];
  totalApprovals: number;
  totalRejections: number;
  totalRewrites: number;
  totalExpirations: number;
  
  // Statistics
  averageDecisionTime: number; // ms
  approvalRate: number;        // percentage
  successRate: number;         // percentage
}

export interface GateConfiguration {
  approvalTimeout: number;     // ms (default 1 hour)
  requireExplicitApproval: boolean;
  allowAutoApprovalForSafeCommands: boolean;
  logAllDecisions: boolean;
  maxHistorySize: number;
}

// ─────────────────────────────────────────────────────────────────
// PRE-EXECUTION AUDIT GATE CLASS
// ─────────────────────────────────────────────────────────────────

export class PreExecutionAuditGate {
  private config: GateConfiguration;
  private pendingRequests: Map<string, ApprovalRequest>;
  private auditHistory: AuditEntry[];
  private maxHistorySize: number;
  
  constructor(config?: Partial<GateConfiguration>) {
    this.config = {
      approvalTimeout: 3600000,              // 1 hour
      requireExplicitApproval: true,
      allowAutoApprovalForSafeCommands: false,
      logAllDecisions: true,
      maxHistorySize: 1000,
      ...config
    };
    
    this.pendingRequests = new Map();
    this.auditHistory = [];
    this.maxHistorySize = this.config.maxHistorySize;
  }

  // ─────────────────────────────────────────────────────────────
  // REQUEST APPROVAL
  // ─────────────────────────────────────────────────────────────

  async requestApproval(
    command: string,
    oversightReport: OversightReport,
    riskMap: RiskMap
  ): Promise<ApprovalRequest> {
    
    const id = `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const expiresAt = timestamp + this.config.approvalTimeout;
    
    const request: ApprovalRequest = {
      id,
      command,
      timestamp,
      expiresAt,
      oversightReport,
      riskMap,
      status: 'pending'
    };
    
    // Store pending request
    this.pendingRequests.set(id, request);
    
    // Log request creation
    console.log(`[AUDIT GATE] Approval requested for: "${command}"`);
    console.log(`[AUDIT GATE] Request ID: ${id}`);
    console.log(`[AUDIT GATE] Expires at: ${new Date(expiresAt).toISOString()}`);
    
    // Set expiration timer
    this.scheduleExpiration(id, this.config.approvalTimeout);
    
    return request;
  }

  // ─────────────────────────────────────────────────────────────
  // APPROVAL DECISION
  // ─────────────────────────────────────────────────────────────

  async recordDecision(
    requestId: string,
    decision: ApprovalDecision,
    reason?: string,
    modifiedCommand?: string
  ): Promise<boolean> {
    
    const request = this.pendingRequests.get(requestId);
    
    if (!request) {
      console.error(`[AUDIT GATE] Request ${requestId} not found`);
      return false;
    }
    
    // Check if expired
    if (Date.now() > request.expiresAt) {
      console.error(`[AUDIT GATE] Request ${requestId} has expired`);
      request.status = 'expired';
      this.pendingRequests.delete(requestId);
      return false;
    }
    
    // Check if already decided
    if (request.status !== 'pending') {
      console.error(`[AUDIT GATE] Request ${requestId} already ${request.status}`);
      return false;
    }
    
    // Record decision
    const decisionTimestamp = Date.now();
    
    request.decision = decision;
    request.decisionTimestamp = decisionTimestamp;
    request.decisionReason = reason || this.getDefaultReason(decision);
    
    // Update status
    if (decision === 'approve') {
      request.status = 'approved';
    } else if (decision === 'reject') {
      request.status = 'rejected';
    } else if (decision === 'rewrite') {
      request.status = 'modified';
      request.modifiedCommand = modifiedCommand;
    }
    
    // Log decision
    console.log(`[AUDIT GATE] Decision: ${decision.toUpperCase()}`);
    console.log(`[AUDIT GATE] Reason: ${request.decisionReason}`);
    console.log(`[AUDIT GATE] Decision time: ${decisionTimestamp - request.timestamp}ms`);
    
    // Create audit entry
    if (this.config.logAllDecisions) {
      this.createAuditEntry(request);
    }
    
    // Remove from pending
    this.pendingRequests.delete(requestId);
    
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // EXECUTION TRACKING
  // ─────────────────────────────────────────────────────────────

  recordExecutionStart(auditId: string): void {
    const entry = this.auditHistory.find(e => e.id === auditId);
    if (entry && entry.decision === 'approve') {
      entry.executed = true;
      entry.executionStarted = Date.now();
      console.log(`[AUDIT GATE] Execution started for ${auditId}`);
    }
  }

  recordExecutionComplete(
    auditId: string,
    success: boolean,
    error?: string
  ): void {
    const entry = this.auditHistory.find(e => e.id === auditId);
    if (entry && entry.executed) {
      entry.executionCompleted = Date.now();
      entry.executionSuccess = success;
      entry.executionError = error;
      
      const duration = entry.executionCompleted - (entry.executionStarted || 0);
      console.log(`[AUDIT GATE] Execution completed for ${auditId}`);
      console.log(`[AUDIT GATE] Success: ${success}`);
      console.log(`[AUDIT GATE] Duration: ${duration}ms`);
      if (error) {
        console.error(`[AUDIT GATE] Error: ${error}`);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────

  canExecute(requestId: string): boolean {
    const request = this.pendingRequests.get(requestId);
    
    // Must have approval request
    if (!request) {
      // Check if in history (already decided)
      const auditEntry = this.auditHistory.find(e => e.id === requestId);
      if (auditEntry) {
        return auditEntry.decision === 'approve';
      }
      return false;
    }
    
    // Must be approved
    if (request.status !== 'approved') {
      return false;
    }
    
    // Must not be expired
    if (Date.now() > request.expiresAt) {
      return false;
    }
    
    return true;
  }

  requiresApproval(command: string, oversightReport: OversightReport): boolean {
    // Always require approval if configured
    if (this.config.requireExplicitApproval) {
      return true;
    }
    
    // Auto-approve safe commands if allowed
    if (this.config.allowAutoApprovalForSafeCommands) {
      if (
        oversightReport.shouldProceed &&
        oversightReport.riskMap.overallZone === 'SAFE' &&
        oversightReport.warnings.length === 0
      ) {
        return false;
      }
    }
    
    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT HISTORY
  // ─────────────────────────────────────────────────────────────

  private createAuditEntry(request: ApprovalRequest): void {
    const entry: AuditEntry = {
      id: request.id,
      timestamp: request.timestamp,
      command: request.command,
      decision: request.decision!,
      decisionReason: request.decisionReason!,
      
      // Context snapshot
      riskZone: request.riskMap.overallZone,
      shouldProceed: request.oversightReport.shouldProceed,
      warningCount: request.oversightReport.warnings.length,
      confidence: request.oversightReport.confidence,
      
      // Execution results (to be filled later)
      executed: false
    };
    
    this.auditHistory.unshift(entry);
    
    // Trim history if needed
    if (this.auditHistory.length > this.maxHistorySize) {
      this.auditHistory = this.auditHistory.slice(0, this.maxHistorySize);
    }
  }

  getAuditHistory(): AuditHistory {
    const totalApprovals = this.auditHistory.filter(e => e.decision === 'approve').length;
    const totalRejections = this.auditHistory.filter(e => e.decision === 'reject').length;
    const totalRewrites = this.auditHistory.filter(e => e.decision === 'rewrite').length;
    const totalExpirations = this.auditHistory.filter(e => e.decision === 'defer').length;
    
    const total = this.auditHistory.length;
    const approvalRate = total > 0 ? (totalApprovals / total) * 100 : 0;
    
    const executedEntries = this.auditHistory.filter(e => e.executed && e.executionCompleted);
    const successfulExecutions = executedEntries.filter(e => e.executionSuccess).length;
    const successRate = executedEntries.length > 0 
      ? (successfulExecutions / executedEntries.length) * 100 
      : 0;
    
    const decisionsWithTime = this.auditHistory.filter(e => e.decisionReason);
    const totalDecisionTime = decisionsWithTime.reduce((sum, e) => {
      return sum + (e.timestamp - e.timestamp); // Would use actual decision timestamp
    }, 0);
    const averageDecisionTime = decisionsWithTime.length > 0 
      ? totalDecisionTime / decisionsWithTime.length 
      : 0;
    
    return {
      entries: this.auditHistory,
      totalApprovals,
      totalRejections,
      totalRewrites,
      totalExpirations,
      averageDecisionTime,
      approvalRate,
      successRate
    };
  }

  getRecentDecisions(count: number = 10): AuditEntry[] {
    return this.auditHistory.slice(0, count);
  }

  searchAuditHistory(query: {
    command?: string;
    decision?: ApprovalDecision;
    riskZone?: string;
    dateRange?: [number, number];
  }): AuditEntry[] {
    
    return this.auditHistory.filter(entry => {
      if (query.command && !entry.command.includes(query.command)) {
        return false;
      }
      
      if (query.decision && entry.decision !== query.decision) {
        return false;
      }
      
      if (query.riskZone && entry.riskZone !== query.riskZone) {
        return false;
      }
      
      if (query.dateRange) {
        const [start, end] = query.dateRange;
        if (entry.timestamp < start || entry.timestamp > end) {
          return false;
        }
      }
      
      return true;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // PENDING REQUESTS
  // ─────────────────────────────────────────────────────────────

  getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  getRequest(requestId: string): ApprovalRequest | undefined {
    return this.pendingRequests.get(requestId);
  }

  cancelRequest(requestId: string): boolean {
    const request = this.pendingRequests.get(requestId);
    if (request && request.status === 'pending') {
      this.recordDecision(requestId, 'reject', 'Cancelled by user');
      return true;
    }
    return false;
  }

  // ─────────────────────────────────────────────────────────────
  // EXPIRATION
  // ─────────────────────────────────────────────────────────────

  private scheduleExpiration(requestId: string, timeout: number): void {
    setTimeout(() => {
      const request = this.pendingRequests.get(requestId);
      if (request && request.status === 'pending') {
        console.warn(`[AUDIT GATE] Request ${requestId} expired`);
        request.status = 'expired';
        
        // Create audit entry for expiration
        if (this.config.logAllDecisions) {
          const entry: AuditEntry = {
            id: request.id,
            timestamp: request.timestamp,
            command: request.command,
            decision: 'defer',
            decisionReason: 'Request expired without decision',
            riskZone: request.riskMap.overallZone,
            shouldProceed: request.oversightReport.shouldProceed,
            warningCount: request.oversightReport.warnings.length,
            confidence: request.oversightReport.confidence,
            executed: false
          };
          this.auditHistory.unshift(entry);
        }
        
        this.pendingRequests.delete(requestId);
      }
    }, timeout);
  }

  // ─────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────

  private getDefaultReason(decision: ApprovalDecision): string {
    switch (decision) {
      case 'approve':
        return 'Approved for execution';
      case 'reject':
        return 'Rejected - too risky';
      case 'rewrite':
        return 'Requires modification';
      case 'defer':
        return 'Deferred for later';
      default:
        return 'No reason provided';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────

  getStatistics() {
    const history = this.getAuditHistory();
    const pending = this.getPendingRequests();
    
    return {
      pending: pending.length,
      totalDecisions: history.entries.length,
      approvals: history.totalApprovals,
      rejections: history.totalRejections,
      rewrites: history.totalRewrites,
      expirations: history.totalExpirations,
      approvalRate: Math.round(history.approvalRate),
      successRate: Math.round(history.successRate),
      averageDecisionTime: Math.round(history.averageDecisionTime)
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────────

  updateConfig(updates: Partial<GateConfiguration>): void {
    this.config = { ...this.config, ...updates };
    console.log('[AUDIT GATE] Configuration updated:', updates);
  }

  getConfig(): GateConfiguration {
    return { ...this.config };
  }

  // ─────────────────────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────────────────────

  reset(): void {
    this.pendingRequests.clear();
    this.auditHistory = [];
    console.log('[AUDIT GATE] Reset complete');
  }

  clearHistory(): void {
    this.auditHistory = [];
    console.log('[AUDIT GATE] History cleared');
  }
}
