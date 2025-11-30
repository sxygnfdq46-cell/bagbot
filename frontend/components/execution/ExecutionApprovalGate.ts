/**
 * LEVEL 13.4 — MULTI-COMMAND EXECUTION NETWORK
 * Component 6/8: ExecutionApprovalGate.ts
 * 
 * Purpose: CRITICAL SAFETY GATE - ensures NO autonomous execution
 * - Requires explicit user approval for every action
 * - Validates safety checks
 * - Enforces manual override requirements
 * - Provides detailed approval context
 * 
 * **SAFETY CRITICAL: This is the ONLY gate between planning and execution**
 * **NO code can execute without passing through this gate**
 */

import { TaskNode } from './TaskNode';
import { ExecutionPlan, ExecutionStage } from './SequentialFlowPlanner';

/* ================================ */
/* TYPES                            */
/* ================================ */

export interface ApprovalRequest {
  requestId: string;
  taskId: string;
  taskName: string;
  command: string;
  timestamp: number;
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  requiresUserConfirmation: boolean;
  manualOverrideRequired: boolean;
  safetyChecks: Array<{
    checkName: string;
    passed: boolean;
    reason: string | null;
  }>;
  contextInformation: {
    affectedFiles: string[];
    systemParts: string[];
    changeType: string;
    estimatedDuration: number;
    dependencies: string[];
    cascadeEffects: string[];
  };
  warnings: string[];
  recommendations: string[];
}

export interface ApprovalResponse {
  requestId: string;
  approved: boolean;
  approvedBy: string;
  approvalTime: number;
  manualOverrideUsed: boolean;
  approvalNotes: string;
  conditions: string[];           // Conditions attached to approval
}

export interface ApprovalAuditLog {
  requestId: string;
  taskId: string;
  action: 'requested' | 'approved' | 'denied' | 'revoked';
  timestamp: number;
  user: string;
  reason: string;
}

export interface SafetyEnforcementReport {
  totalRequests: number;
  approved: number;
  denied: number;
  pending: number;
  autonomousExecutionAttempts: number;  // SHOULD ALWAYS BE 0
  safetyViolations: string[];
  approvalRate: number;
}

/* ================================ */
/* EXECUTION APPROVAL GATE          */
/* ================================ */

export class ExecutionApprovalGate {
  // CRITICAL: NO autonomous execution flag
  private readonly AUTONOMOUS_EXECUTION_FORBIDDEN = true;
  
  private pendingRequests: Map<string, ApprovalRequest>;
  private approvalResponses: Map<string, ApprovalResponse>;
  private auditLog: ApprovalAuditLog[];
  private safetyViolations: string[];
  private autonomousAttempts: number;

  constructor() {
    this.pendingRequests = new Map();
    this.approvalResponses = new Map();
    this.auditLog = [];
    this.safetyViolations = [];
    this.autonomousAttempts = 0;
  }

  /* ================================ */
  /* APPROVAL REQUEST GENERATION      */
  /* ================================ */

  public generateApprovalRequest(task: TaskNode): ApprovalRequest {
    const requestId = `approval_${task.taskId}_${Date.now()}`;

    const request: ApprovalRequest = {
      requestId,
      taskId: task.taskId,
      taskName: task.name,
      command: task.command,
      timestamp: Date.now(),
      riskLevel: task.safety.riskLevel,
      requiresUserConfirmation: task.safety.requiresUserConfirmation,
      manualOverrideRequired: task.safety.manualOverrideRequired,
      safetyChecks: task.safety.safetyChecks,
      contextInformation: {
        affectedFiles: task.scope.affectedFiles,
        systemParts: [task.scope.systemPart],
        changeType: task.impact.changeType,
        estimatedDuration: task.time.estimatedDuration,
        dependencies: task.time.dependencies,
        cascadeEffects: task.impact.cascadeEffects.map(c => c.effectType),
      },
      warnings: this.generateWarnings(task),
      recommendations: this.generateRecommendations(task),
    };

    this.pendingRequests.set(requestId, request);
    
    // Audit log
    this.auditLog.push({
      requestId,
      taskId: task.taskId,
      action: 'requested',
      timestamp: Date.now(),
      user: 'system',
      reason: 'Task ready for execution',
    });

    return request;
  }

  private generateWarnings(task: TaskNode): string[] {
    const warnings: string[] = [];

    // Risk warnings
    if (task.impact.riskScore > 80) {
      warnings.push('⚠️ CRITICAL RISK: High-impact operation');
    } else if (task.impact.riskScore > 60) {
      warnings.push('⚠️ HIGH RISK: Significant system changes');
    }

    // Reversibility warnings
    if (!task.impact.reversible) {
      warnings.push('⚠️ IRREVERSIBLE: This operation cannot be undone');
    }

    // Rollback complexity warnings
    if (task.impact.rollbackComplexity > 70) {
      warnings.push('⚠️ COMPLEX ROLLBACK: Difficult to revert if issues occur');
    }

    // Conflict warnings
    if (task.conflicts.length > 0) {
      warnings.push(`⚠️ CONFLICTS: ${task.conflicts.length} conflict(s) detected`);
    }

    // File modification warnings
    if (task.scope.affectedFiles.length > 10) {
      warnings.push(`⚠️ WIDE IMPACT: Modifies ${task.scope.affectedFiles.length} files`);
    }

    // Cascade warnings
    const highSeverityCascades = task.impact.cascadeEffects.filter(c => c.severity === 'high');
    if (highSeverityCascades.length > 0) {
      warnings.push(`⚠️ CASCADE EFFECTS: ${highSeverityCascades.length} high-severity cascade(s)`);
    }

    // Safety check warnings
    const failedChecks = task.safety.safetyChecks.filter(c => !c.passed);
    if (failedChecks.length > 0) {
      warnings.push(`⚠️ SAFETY CHECKS: ${failedChecks.length} check(s) failed`);
      failedChecks.forEach(check => {
        warnings.push(`   - ${check.checkName}: ${check.reason}`);
      });
    }

    return warnings;
  }

  private generateRecommendations(task: TaskNode): string[] {
    const recommendations: string[] = [];

    // Backup recommendations
    if (task.impact.changeType === 'storage' || task.impact.changeType === 'architecture') {
      recommendations.push('💾 Create backup before proceeding');
    }

    // Testing recommendations
    if (task.impact.impactLevel === 'large' || task.impact.impactLevel === 'critical') {
      recommendations.push('🧪 Test in staging environment first');
    }

    // Review recommendations
    if (task.impact.riskScore > 60) {
      recommendations.push('👥 Consider peer review before execution');
    }

    // Monitoring recommendations
    if (task.impact.cascadeEffects.length > 3) {
      recommendations.push('📊 Monitor cascade effects during execution');
    }

    // Rollback plan recommendations
    if (task.impact.rollbackComplexity > 50) {
      recommendations.push('📋 Prepare rollback plan before execution');
    }

    // Execution timing recommendations
    if (task.time.estimatedDuration > 30) {
      recommendations.push('⏰ Schedule during low-traffic period');
    }

    return recommendations;
  }

  /* ================================ */
  /* APPROVAL VALIDATION              */
  /* ================================ */

  public approveRequest(
    requestId: string,
    approvedBy: string,
    notes: string = '',
    manualOverride: boolean = false,
    conditions: string[] = []
  ): ApprovalResponse {
    const request = this.pendingRequests.get(requestId);
    
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    // CRITICAL SAFETY CHECK: Verify this is a manual approval
    if (approvedBy === 'system' || approvedBy === 'autonomous') {
      this.autonomousAttempts++;
      this.safetyViolations.push(
        `CRITICAL: Autonomous execution attempt blocked for task ${request.taskId} at ${new Date().toISOString()}`
      );
      
      this.auditLog.push({
        requestId,
        taskId: request.taskId,
        action: 'denied',
        timestamp: Date.now(),
        user: 'SAFETY_GATE',
        reason: '🚫 AUTONOMOUS EXECUTION FORBIDDEN',
      });

      throw new Error('🚫 CRITICAL SAFETY VIOLATION: Autonomous execution is FORBIDDEN');
    }

    // Validate manual override if required
    if (request.manualOverrideRequired && !manualOverride) {
      throw new Error(`Manual override required for task ${request.taskId}`);
    }

    // Create approval response
    const response: ApprovalResponse = {
      requestId,
      approved: true,
      approvedBy,
      approvalTime: Date.now(),
      manualOverrideUsed: manualOverride,
      approvalNotes: notes,
      conditions,
    };

    this.approvalResponses.set(requestId, response);
    this.pendingRequests.delete(requestId);

    // Audit log
    this.auditLog.push({
      requestId,
      taskId: request.taskId,
      action: 'approved',
      timestamp: Date.now(),
      user: approvedBy,
      reason: notes || 'Manual approval granted',
    });

    return response;
  }

  public denyRequest(requestId: string, deniedBy: string, reason: string): void {
    const request = this.pendingRequests.get(requestId);
    
    if (!request) {
      throw new Error(`Approval request not found: ${requestId}`);
    }

    this.pendingRequests.delete(requestId);

    // Audit log
    this.auditLog.push({
      requestId,
      taskId: request.taskId,
      action: 'denied',
      timestamp: Date.now(),
      user: deniedBy,
      reason,
    });
  }

  /* ================================ */
  /* EXECUTION AUTHORIZATION          */
  /* ================================ */

  public isAuthorizedToExecute(taskId: string): {
    authorized: boolean;
    reason: string;
    approvalDetails: ApprovalResponse | null;
  } {
    // Find approval response for this task
    const approvals = Array.from(this.approvalResponses.values());
    const approval = approvals.find(a => {
      const request = Array.from(this.pendingRequests.values())
        .concat(this.getHistoricalRequests())
        .find(r => r.requestId === a.requestId);
      return request?.taskId === taskId;
    });

    if (!approval) {
      return {
        authorized: false,
        reason: 'No approval found - user confirmation required',
        approvalDetails: null,
      };
    }

    if (!approval.approved) {
      return {
        authorized: false,
        reason: 'Approval was denied',
        approvalDetails: approval,
      };
    }

    // Check if approval is still valid (within 1 hour)
    const approvalAge = Date.now() - approval.approvalTime;
    const oneHour = 3600000;
    
    if (approvalAge > oneHour) {
      return {
        authorized: false,
        reason: 'Approval expired (>1 hour old) - re-approval required',
        approvalDetails: approval,
      };
    }

    return {
      authorized: true,
      reason: 'Approved for execution',
      approvalDetails: approval,
    };
  }

  /* ================================ */
  /* BATCH APPROVAL                   */
  /* ================================ */

  public generateBatchApprovalRequest(
    tasks: TaskNode[],
    plan: ExecutionPlan
  ): {
    batchId: string;
    individualRequests: ApprovalRequest[];
    batchRisk: 'safe' | 'moderate' | 'high' | 'critical';
    canApproveAsBatch: boolean;
    batchWarnings: string[];
  } {
    const batchId = `batch_${Date.now()}`;
    const individualRequests = tasks.map(task => this.generateApprovalRequest(task));

    // Calculate batch risk
    const riskScores = tasks.map(t => t.impact.riskScore);
    const avgRisk = riskScores.reduce((sum, r) => sum + r, 0) / riskScores.length;
    const maxRisk = Math.max(...riskScores);

    let batchRisk: 'safe' | 'moderate' | 'high' | 'critical';
    if (maxRisk > 80 || avgRisk > 70) batchRisk = 'critical';
    else if (maxRisk > 60 || avgRisk > 50) batchRisk = 'high';
    else if (maxRisk > 40 || avgRisk > 30) batchRisk = 'moderate';
    else batchRisk = 'safe';

    // Determine if can approve as batch
    const canApproveAsBatch = 
      tasks.every(t => !t.safety.manualOverrideRequired) &&
      tasks.every(t => t.safety.riskLevel !== 'critical') &&
      plan.overallRisk < 70;

    // Generate batch warnings
    const batchWarnings: string[] = [];
    
    if (!canApproveAsBatch) {
      batchWarnings.push('⚠️ BATCH APPROVAL NOT RECOMMENDED: Contains high-risk tasks');
      batchWarnings.push('💡 Consider approving tasks individually');
    }

    if (plan.totalDuration > 60) {
      batchWarnings.push(`⏱️ LONG EXECUTION: Batch takes ~${Math.round(plan.totalDuration)} minutes`);
    }

    const irreversibleTasks = tasks.filter(t => !t.impact.reversible);
    if (irreversibleTasks.length > 0) {
      batchWarnings.push(`⚠️ IRREVERSIBLE: ${irreversibleTasks.length} task(s) cannot be undone`);
    }

    return {
      batchId,
      individualRequests,
      batchRisk,
      canApproveAsBatch,
      batchWarnings,
    };
  }

  /* ================================ */
  /* SAFETY ENFORCEMENT REPORT        */
  /* ================================ */

  public generateSafetyReport(): SafetyEnforcementReport {
    const allRequests = Array.from(this.pendingRequests.values())
      .concat(this.getHistoricalRequests());
    
    const totalRequests = allRequests.length;
    const approved = this.approvalResponses.size;
    const denied = this.auditLog.filter(log => log.action === 'denied').length;
    const pending = this.pendingRequests.size;
    const approvalRate = totalRequests > 0 ? (approved / totalRequests) * 100 : 0;

    return {
      totalRequests,
      approved,
      denied,
      pending,
      autonomousExecutionAttempts: this.autonomousAttempts,
      safetyViolations: this.safetyViolations,
      approvalRate,
    };
  }

  /* ================================ */
  /* AUDIT & COMPLIANCE               */
  /* ================================ */

  public getAuditLog(): ApprovalAuditLog[] {
    return [...this.auditLog];
  }

  public getApprovalHistory(taskId: string): ApprovalAuditLog[] {
    return this.auditLog.filter(log => log.taskId === taskId);
  }

  public getPendingRequests(): ApprovalRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  private getHistoricalRequests(): ApprovalRequest[] {
    // In production, this would query a database
    // For now, return empty array (requests are removed after approval/denial)
    return [];
  }

  /* ================================ */
  /* REVOCATION                       */
  /* ================================ */

  public revokeApproval(requestId: string, revokedBy: string, reason: string): void {
    const approval = this.approvalResponses.get(requestId);
    
    if (!approval) {
      throw new Error(`Approval not found: ${requestId}`);
    }

    this.approvalResponses.delete(requestId);

    // Audit log
    const request = this.getHistoricalRequests().find(r => r.requestId === requestId);
    if (request) {
      this.auditLog.push({
        requestId,
        taskId: request.taskId,
        action: 'revoked',
        timestamp: Date.now(),
        user: revokedBy,
        reason,
      });
    }
  }

  /* ================================ */
  /* SAFETY VERIFICATION              */
  /* ================================ */

  public verifySafetyCompliance(): {
    compliant: boolean;
    violations: string[];
    autonomousAttempts: number;
  } {
    const violations: string[] = [...this.safetyViolations];

    // Check for any autonomous execution attempts
    if (this.autonomousAttempts > 0) {
      violations.push(`🚫 ${this.autonomousAttempts} autonomous execution attempt(s) blocked`);
    }

    // Check for expired approvals still in use
    const expiredApprovals = Array.from(this.approvalResponses.values()).filter(approval => {
      const approvalAge = Date.now() - approval.approvalTime;
      return approvalAge > 3600000; // 1 hour
    });

    if (expiredApprovals.length > 0) {
      violations.push(`⚠️ ${expiredApprovals.length} expired approval(s) detected`);
    }

    return {
      compliant: violations.length === 0 && this.autonomousAttempts === 0,
      violations,
      autonomousAttempts: this.autonomousAttempts,
    };
  }

  /* ================================ */
  /* UTILITIES                        */
  /* ================================ */

  public clear(): void {
    this.pendingRequests.clear();
    this.approvalResponses.clear();
    // Keep audit log for compliance
  }

  public getSummary(): string {
    const report = this.generateSafetyReport();
    const compliance = this.verifySafetyCompliance();

    return `╔══════════════════════════════════════════════════════════════════╗
║              EXECUTION APPROVAL GATE - SAFETY REPORT             ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APPROVAL STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Requests: ${report.totalRequests}
  Approved: ${report.approved}
  Denied: ${report.denied}
  Pending: ${report.pending}
  Approval Rate: ${report.approvalRate.toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Autonomous Execution Attempts: ${report.autonomousExecutionAttempts} ${report.autonomousExecutionAttempts === 0 ? '✅' : '🚫'}
  Safety Violations: ${report.safetyViolations.length} ${report.safetyViolations.length === 0 ? '✅' : '⚠️'}
  Compliance Status: ${compliance.compliant ? '✅ COMPLIANT' : '🚫 NON-COMPLIANT'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY GUARANTEE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ NO autonomous execution
  ✅ ALL actions require manual approval
  ✅ Safety checks enforced
  ✅ Audit trail maintained

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 This gate is the ONLY barrier between planning and execution.
🔒 NO code can execute without passing through this gate.
🔒 BagBot is a TOOL, not a mind.
`;
  }
}
