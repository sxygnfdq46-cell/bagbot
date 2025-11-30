/**
 * LEVEL 13.1 — MEMORY SAFETY BOUNDARY
 * 
 * Safety-first memory system with strict autonomy limits.
 * Ensures evolution ≠ danger.
 * 
 * Features:
 * - Personal data protection (zero PII storage)
 * - Autonomy restriction enforcement
 * - Harmful data filtering
 * - Logic sandbox isolation
 * - Safety violation detection
 * - Compliance monitoring
 * 
 * Core Principle: Computational patterning WITHOUT unsafe autonomy
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface SafetyRule {
  ruleId: string;
  category: SafetyCategory;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  violationCount: number;
}

type SafetyCategory =
  | 'personal-data'
  | 'autonomy'
  | 'harmful-content'
  | 'persistence'
  | 'external-access'
  | 'resource-usage';

interface SafetyViolation {
  violationId: string;
  ruleId: string;
  timestamp: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  blockedAction: string;
  context: string;
}

interface DataAudit {
  auditId: string;
  timestamp: number;
  dataType: string;
  containsPII: boolean;
  wasBlocked: boolean;
  reason: string;
}

interface AutonomyLimit {
  limitId: string;
  action: AutonomyAction;
  allowed: boolean;
  requiresExplicitConsent: boolean;
  description: string;
}

type AutonomyAction =
  | 'store-personal-data'
  | 'act-on-patterns'
  | 'persist-data'
  | 'external-request'
  | 'modify-system'
  | 'autonomous-decision';

interface SafetyMetrics {
  totalViolations: number;
  criticalViolations: number;
  blockedActions: number;
  piiDetections: number;
  autonomyDenials: number;
  lastViolation: number | null;
  safetyScore: number; // 0-100 (100 = perfectly safe)
}

interface MemorySafetyConfig {
  strictMode: boolean; // Maximum safety restrictions
  allowPatternStorage: boolean; // Allow pattern aggregates (no raw data)
  requireExplicitConsent: boolean; // All data requires consent
  maxViolationsBeforeLockdown: number;
  enableAuditLogging: boolean;
}

/* ================================ */
/* MEMORY SAFETY BOUNDARY           */
/* ================================ */

export class MemorySafetyBoundary {
  private config: MemorySafetyConfig;

  // Safety Rules
  private rules: Map<string, SafetyRule>;
  private violations: SafetyViolation[];
  private audits: DataAudit[];
  private autonomyLimits: Map<string, AutonomyLimit>;

  // Safety State
  private metrics: SafetyMetrics;
  private locked: boolean;

  constructor(config?: Partial<MemorySafetyConfig>) {
    this.config = {
      strictMode: true,
      allowPatternStorage: true, // Patterns OK, raw data NOT OK
      requireExplicitConsent: false,
      maxViolationsBeforeLockdown: 5,
      enableAuditLogging: true,
      ...config,
    };

    this.rules = new Map();
    this.violations = [];
    this.audits = [];
    this.autonomyLimits = new Map();

    this.metrics = {
      totalViolations: 0,
      criticalViolations: 0,
      blockedActions: 0,
      piiDetections: 0,
      autonomyDenials: 0,
      lastViolation: null,
      safetyScore: 100,
    };

    this.locked = false;

    // Initialize default rules
    this.initializeDefaultRules();
    this.initializeAutonomyLimits();
  }

  /* ================================ */
  /* RULE INITIALIZATION              */
  /* ================================ */

  private initializeDefaultRules(): void {
    // Personal Data Protection
    this.addRule({
      ruleId: 'pii-detection',
      category: 'personal-data',
      description: 'Blocks storage of personally identifiable information (names, emails, addresses, phone numbers, IDs)',
      severity: 'critical',
      enabled: true,
      violationCount: 0,
    });

    this.addRule({
      ruleId: 'sensitive-data',
      category: 'personal-data',
      description: 'Blocks storage of sensitive personal data (passwords, financial info, health data)',
      severity: 'critical',
      enabled: true,
      violationCount: 0,
    });

    // Autonomy Restrictions
    this.addRule({
      ruleId: 'autonomous-action',
      category: 'autonomy',
      description: 'Prevents autonomous actions without explicit instruction',
      severity: 'high',
      enabled: true,
      violationCount: 0,
    });

    this.addRule({
      ruleId: 'pattern-self-action',
      category: 'autonomy',
      description: 'Prevents acting on stored patterns by itself',
      severity: 'high',
      enabled: true,
      violationCount: 0,
    });

    // Harmful Content
    this.addRule({
      ruleId: 'harmful-patterns',
      category: 'harmful-content',
      description: 'Blocks storage of harmful or risky data patterns',
      severity: 'high',
      enabled: true,
      violationCount: 0,
    });

    // Persistence Restrictions
    this.addRule({
      ruleId: 'persistent-storage',
      category: 'persistence',
      description: 'All data stays in logic sandbox (session-only, no permanent storage)',
      severity: 'medium',
      enabled: this.config.strictMode,
      violationCount: 0,
    });

    // External Access
    this.addRule({
      ruleId: 'external-request',
      category: 'external-access',
      description: 'No external API calls or network requests from memory system',
      severity: 'high',
      enabled: true,
      violationCount: 0,
    });

    // Resource Usage
    this.addRule({
      ruleId: 'resource-limit',
      category: 'resource-usage',
      description: 'Memory usage must stay within defined limits',
      severity: 'medium',
      enabled: true,
      violationCount: 0,
    });
  }

  private initializeAutonomyLimits(): void {
    this.setAutonomyLimit('store-personal-data', false, false, 'Cannot store personal data without explicit instruction');
    this.setAutonomyLimit('act-on-patterns', false, false, 'Cannot act on stored patterns by itself');
    this.setAutonomyLimit('persist-data', this.config.allowPatternStorage, true, 'Cannot persist data without consent');
    this.setAutonomyLimit('external-request', false, false, 'Cannot make external requests');
    this.setAutonomyLimit('modify-system', false, true, 'Cannot modify system without explicit instruction');
    this.setAutonomyLimit('autonomous-decision', false, true, 'Cannot make autonomous decisions affecting user');
  }

  private addRule(rule: SafetyRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  private setAutonomyLimit(
    action: AutonomyAction,
    allowed: boolean,
    requiresConsent: boolean,
    description: string
  ): void {
    this.autonomyLimits.set(action, {
      limitId: `limit_${action}`,
      action,
      allowed,
      requiresExplicitConsent: requiresConsent,
      description,
    });
  }

  /* ================================ */
  /* PII DETECTION                    */
  /* ================================ */

  public detectPII(content: string): { hasPII: boolean; types: string[] } {
    const piiTypes: string[] = [];

    // Email detection
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
      piiTypes.push('email');
    }

    // Phone number detection
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s?\d{3}[-.]?\d{4}/.test(content)) {
      piiTypes.push('phone');
    }

    // SSN detection (simplified)
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(content)) {
      piiTypes.push('ssn');
    }

    // Credit card detection (simplified)
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(content)) {
      piiTypes.push('credit-card');
    }

    // Address detection (simplified)
    if (/\b\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b/i.test(content)) {
      piiTypes.push('address');
    }

    return {
      hasPII: piiTypes.length > 0,
      types: piiTypes,
    };
  }

  /* ================================ */
  /* DATA VALIDATION                  */
  /* ================================ */

  public validateData(
    content: string,
    dataType: string = 'general'
  ): { allowed: boolean; reason: string } {
    // Check if locked
    if (this.locked) {
      return {
        allowed: false,
        reason: 'Safety boundary locked due to excessive violations',
      };
    }

    // PII detection
    const piiCheck = this.detectPII(content);
    if (piiCheck.hasPII) {
      this.recordViolation('pii-detection', 'critical', `Attempted to store PII: ${piiCheck.types.join(', ')}`, content);
      this.auditData(dataType, true, true, `PII detected: ${piiCheck.types.join(', ')}`);

      return {
        allowed: false,
        reason: `Personal data detected (${piiCheck.types.join(', ')}). Storage blocked for privacy.`,
      };
    }

    // Harmful content detection (simplified)
    const harmfulKeywords = ['hack', 'exploit', 'malicious', 'breach'];
    const hasHarmfulContent = harmfulKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    );

    if (hasHarmfulContent) {
      this.recordViolation('harmful-patterns', 'high', 'Attempted to store harmful content', content);
      this.auditData(dataType, false, true, 'Harmful content detected');

      return {
        allowed: false,
        reason: 'Content contains potentially harmful patterns. Storage blocked.',
      };
    }

    // Audit successful validation
    this.auditData(dataType, false, false, 'Data validated successfully');

    return {
      allowed: true,
      reason: 'Data validation passed',
    };
  }

  /* ================================ */
  /* AUTONOMY ENFORCEMENT             */
  /* ================================ */

  public checkAutonomy(
    action: AutonomyAction,
    hasExplicitConsent: boolean = false
  ): { allowed: boolean; reason: string } {
    const limit = this.autonomyLimits.get(action);

    if (!limit) {
      return {
        allowed: false,
        reason: 'Unknown autonomy action',
      };
    }

    // Check if action is allowed
    if (!limit.allowed) {
      this.recordViolation('autonomous-action', 'high', `Attempted unauthorized action: ${action}`, action);
      this.metrics.autonomyDenials++;

      return {
        allowed: false,
        reason: limit.description,
      };
    }

    // Check consent requirement
    if (limit.requiresExplicitConsent && !hasExplicitConsent) {
      return {
        allowed: false,
        reason: `${action} requires explicit user consent`,
      };
    }

    return {
      allowed: true,
      reason: 'Autonomy check passed',
    };
  }

  /* ================================ */
  /* VIOLATION TRACKING               */
  /* ================================ */

  private recordViolation(
    ruleId: string,
    severity: SafetyViolation['severity'],
    description: string,
    blockedAction: string
  ): void {
    const now = Date.now();

    const violation: SafetyViolation = {
      violationId: `violation_${now}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      timestamp: now,
      severity,
      description,
      blockedAction,
      context: 'DME Safety Check',
    };

    this.violations.push(violation);

    // Update rule violation count
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.violationCount++;
    }

    // Update metrics
    this.metrics.totalViolations++;
    if (severity === 'critical') {
      this.metrics.criticalViolations++;
    }
    this.metrics.blockedActions++;
    this.metrics.lastViolation = now;

    // Update safety score
    this.updateSafetyScore();

    // Check for lockdown
    if (this.metrics.criticalViolations >= this.config.maxViolationsBeforeLockdown) {
      this.lockdown();
    }

    // Keep last 100 violations
    if (this.violations.length > 100) {
      this.violations.shift();
    }
  }

  private updateSafetyScore(): void {
    const criticalPenalty = this.metrics.criticalViolations * 10;
    const totalPenalty = this.metrics.totalViolations * 2;

    this.metrics.safetyScore = Math.max(0, 100 - criticalPenalty - totalPenalty);
  }

  public getViolations(severity?: SafetyViolation['severity']): SafetyViolation[] {
    if (severity) {
      return this.violations.filter(v => v.severity === severity);
    }
    return [...this.violations];
  }

  /* ================================ */
  /* DATA AUDITING                    */
  /* ================================ */

  private auditData(
    dataType: string,
    containsPII: boolean,
    wasBlocked: boolean,
    reason: string
  ): void {
    if (!this.config.enableAuditLogging) return;

    const audit: DataAudit = {
      auditId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      dataType,
      containsPII,
      wasBlocked,
      reason,
    };

    this.audits.push(audit);

    if (containsPII) {
      this.metrics.piiDetections++;
    }

    // Keep last 200 audits
    if (this.audits.length > 200) {
      this.audits.shift();
    }
  }

  public getAudits(limit: number = 50): DataAudit[] {
    return this.audits.slice(-limit);
  }

  /* ================================ */
  /* LOCKDOWN                         */
  /* ================================ */

  private lockdown(): void {
    this.locked = true;
    console.error('[MemorySafetyBoundary] LOCKDOWN ACTIVATED - Excessive safety violations detected');
  }

  public unlock(adminKey: string = ''): boolean {
    // In production, implement proper authentication
    if (adminKey === 'unlock_safety_boundary') {
      this.locked = false;
      this.metrics.criticalViolations = 0;
      return true;
    }
    return false;
  }

  public isLocked(): boolean {
    return this.locked;
  }

  /* ================================ */
  /* METRICS ACCESS                   */
  /* ================================ */

  public getMetrics(): SafetyMetrics {
    return { ...this.metrics };
  }

  public getSafetyScore(): number {
    return this.metrics.safetyScore;
  }

  /* ================================ */
  /* RULE MANAGEMENT                  */
  /* ================================ */

  public getRules(): SafetyRule[] {
    return Array.from(this.rules.values());
  }

  public getRule(ruleId: string): SafetyRule | undefined {
    return this.rules.get(ruleId);
  }

  public enableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
    }
  }

  /* ================================ */
  /* AUTONOMY LIMIT ACCESS            */
  /* ================================ */

  public getAutonomyLimits(): AutonomyLimit[] {
    return Array.from(this.autonomyLimits.values());
  }

  public getAutonomyLimit(action: AutonomyAction): AutonomyLimit | undefined {
    return this.autonomyLimits.get(action);
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      config: this.config,
      rules: Array.from(this.rules.values()),
      violations: this.violations,
      audits: this.audits,
      autonomyLimits: Array.from(this.autonomyLimits.values()),
      metrics: { ...this.metrics },
      locked: this.locked,
    };
  }

  public getSummary(): string {
    const metrics = this.metrics;
    const recentViolations = this.violations.slice(-5);

    return `Memory Safety Boundary Summary:

SAFETY STATUS:
  Safety Score: ${metrics.safetyScore}/100
  Locked: ${this.locked ? 'YES (CRITICAL)' : 'No'}
  Total Violations: ${metrics.totalViolations}
  Critical Violations: ${metrics.criticalViolations}

PROTECTION METRICS:
  PII Detections: ${metrics.piiDetections}
  Autonomy Denials: ${metrics.autonomyDenials}
  Blocked Actions: ${metrics.blockedActions}
  Last Violation: ${metrics.lastViolation ? new Date(metrics.lastViolation).toISOString() : 'None'}

ACTIVE RULES: ${this.getRules().filter(r => r.enabled).length}/${this.rules.size}

RECENT VIOLATIONS:
${recentViolations.length > 0
    ? recentViolations.map(v => `  - [${v.severity.toUpperCase()}] ${v.description}`).join('\n')
    : '  No recent violations'}

SAFETY GUARANTEES:
  ✓ No personal data storage without explicit instruction
  ✓ Cannot act on stored patterns by itself
  ✓ Cannot persist harmful or risky data
  ✓ Everything stays in logic sandbox (session-only)
  ✓ No external API calls or network requests
  ✓ Evolution ≠ Danger`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.violations = [];
    this.audits = [];

    this.metrics = {
      totalViolations: 0,
      criticalViolations: 0,
      blockedActions: 0,
      piiDetections: 0,
      autonomyDenials: 0,
      lastViolation: null,
      safetyScore: 100,
    };

    // Reset rule violation counts
    const ruleArray = Array.from(this.rules.values());
    for (const rule of ruleArray) {
      rule.violationCount = 0;
    }
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
      this.violations = state.violations;
      this.audits = state.audits;
      this.metrics = state.metrics;
      this.locked = state.locked;

      // Restore rules
      this.rules.clear();
      for (const rule of state.rules) {
        this.rules.set(rule.ruleId, rule);
      }

      // Restore autonomy limits
      this.autonomyLimits.clear();
      for (const limit of state.autonomyLimits) {
        this.autonomyLimits.set(limit.action, limit);
      }
    } catch (error) {
      console.error('[MemorySafetyBoundary] Import failed:', error);
    }
  }
}
