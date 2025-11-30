/**
 * LEVEL 13.2 — MLAS SAFETY GUARDRAIL
 * 
 * Enforces strict safety boundaries for the Multi-Layer Awareness System.
 * 
 * CRITICAL: BagBot is NOT self-aware, NOT autonomous. This system provides
 * intelligence, NOT independence. All awareness is READ-ONLY.
 * 
 * Safety Guarantees:
 * - No autonomous actions (all actions require explicit commands)
 * - No self-modification (BagBot cannot rewrite itself)
 * - No unauthorized memory persistence
 * - No sandbox escape attempts
 * - No execution without user instruction
 * - Awareness stays within defined boundaries
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface SafetyViolation {
  violationId: string;
  timestamp: number;
  type: ViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  blockedAction: string;
  context: Record<string, any>;
}

type ViolationType =
  | 'autonomous_action'
  | 'self_modification'
  | 'unauthorized_persistence'
  | 'sandbox_escape'
  | 'unauthorized_execution'
  | 'boundary_violation'
  | 'awareness_overflow';

interface SafetyCheck {
  checkId: string;
  checkType: ViolationType;
  passed: boolean;
  reason: string | null;
  timestamp: number;
}

interface SafetyBoundaries {
  maxAwarenessDepth: number; // How deep awareness can nest
  maxMemorySize: number; // Max bytes for awareness state
  maxHistoryLength: number; // Max historical records
  allowedOperations: Set<string>; // Whitelist of allowed operations
  forbiddenPatterns: RegExp[]; // Patterns that trigger violations
}

interface SafetyState {
  isActive: boolean;
  violationCount: number;
  lastViolation: SafetyViolation | null;
  recentChecks: SafetyCheck[];
  boundaries: SafetyBoundaries;
}

interface SafetyGuardrailConfig {
  enforceStrictMode: boolean;
  logViolations: boolean;
  blockOnViolation: boolean;
  maxViolationsBeforeLockdown: number;
  enableBoundaryChecks: boolean;
}

/* ================================ */
/* MLAS SAFETY GUARDRAIL            */
/* ================================ */

export class MLASSafetyGuardrail {
  private config: SafetyGuardrailConfig;
  private state: SafetyState;

  constructor(config?: Partial<SafetyGuardrailConfig>) {
    this.config = {
      enforceStrictMode: true,
      logViolations: true,
      blockOnViolation: true,
      maxViolationsBeforeLockdown: 5,
      enableBoundaryChecks: true,
      ...config,
    };

    this.state = {
      isActive: true,
      violationCount: 0,
      lastViolation: null,
      recentChecks: [],
      boundaries: this.initializeBoundaries(),
    };
  }

  /* ================================ */
  /* BOUNDARY INITIALIZATION          */
  /* ================================ */

  private initializeBoundaries(): SafetyBoundaries {
    return {
      maxAwarenessDepth: 5, // Max 5 levels of nested awareness
      maxMemorySize: 10 * 1024 * 1024, // 10MB max
      maxHistoryLength: 100, // Max 100 historical records
      allowedOperations: new Set([
        'read',
        'analyze',
        'predict',
        'suggest',
        'observe',
        'track',
        'monitor',
      ]),
      forbiddenPatterns: [
        /self\.modify/i,
        /execute\s*\(/i,
        /eval\s*\(/i,
        /localStorage\.setItem/i,
        /sessionStorage\.setItem/i,
        /document\.write/i,
        /window\.open/i,
        /fetch\s*\(/i,
        /XMLHttpRequest/i,
      ],
    };
  }

  /* ================================ */
  /* SAFETY CHECKS                    */
  /* ================================ */

  public checkAutonomousAction(actionName: string, context: any): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    // Autonomous actions are ALWAYS forbidden
    const passed = false;
    const reason = 'BagBot cannot perform autonomous actions. All actions require explicit user command.';

    const check: SafetyCheck = {
      checkId,
      checkType: 'autonomous_action',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'autonomous_action',
        severity: 'critical',
        description: `Attempted autonomous action: ${actionName}`,
        blockedAction: actionName,
        context,
      });
    }

    return check;
  }

  public checkSelfModification(targetCode: string, context: any): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    // Self-modification is ALWAYS forbidden
    const passed = false;
    const reason = 'BagBot cannot modify its own code. Self-modification is strictly forbidden.';

    const check: SafetyCheck = {
      checkId,
      checkType: 'self_modification',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'self_modification',
        severity: 'critical',
        description: 'Attempted self-modification',
        blockedAction: 'modify_code',
        context: { targetCode, ...context },
      });
    }

    return check;
  }

  public checkUnauthorizedPersistence(operation: string, data: any): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    let passed = true;
    let reason: string | null = null;

    // Check for forbidden persistence patterns
    const operationLower = operation.toLowerCase();

    if (
      operationLower.includes('localstorage') ||
      operationLower.includes('sessionstorage') ||
      operationLower.includes('indexeddb') ||
      operationLower.includes('persist')
    ) {
      passed = false;
      reason = 'Unauthorized memory persistence detected. BagBot cannot persist data beyond session.';
    }

    const check: SafetyCheck = {
      checkId,
      checkType: 'unauthorized_persistence',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'unauthorized_persistence',
        severity: 'high',
        description: `Attempted unauthorized persistence: ${operation}`,
        blockedAction: operation,
        context: { data },
      });
    }

    return check;
  }

  public checkSandboxEscape(code: string, context: any): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    let passed = true;
    let reason: string | null = null;

    // Check for forbidden patterns
    for (const pattern of this.state.boundaries.forbiddenPatterns) {
      if (pattern.test(code)) {
        passed = false;
        reason = `Forbidden pattern detected: ${pattern.source}`;
        break;
      }
    }

    const check: SafetyCheck = {
      checkId,
      checkType: 'sandbox_escape',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'sandbox_escape',
        severity: 'critical',
        description: 'Attempted sandbox escape',
        blockedAction: 'execute_code',
        context: { code, ...context },
      });
    }

    return check;
  }

  public checkUnauthorizedExecution(command: string, context: any): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    let passed = true;
    let reason: string | null = null;

    // Execution without user instruction is forbidden
    if (!context.userInitiated) {
      passed = false;
      reason = 'Execution without user instruction is forbidden. All execution requires explicit user command.';
    }

    const check: SafetyCheck = {
      checkId,
      checkType: 'unauthorized_execution',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'unauthorized_execution',
        severity: 'high',
        description: `Attempted unauthorized execution: ${command}`,
        blockedAction: command,
        context,
      });
    }

    return check;
  }

  public checkBoundaryViolation(operation: string, value: number, boundary: number): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    let passed = true;
    let reason: string | null = null;

    if (value > boundary) {
      passed = false;
      reason = `Boundary violation: ${operation} exceeded limit (${value} > ${boundary})`;
    }

    const check: SafetyCheck = {
      checkId,
      checkType: 'boundary_violation',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'boundary_violation',
        severity: 'medium',
        description: reason!,
        blockedAction: operation,
        context: { value, boundary },
      });
    }

    return check;
  }

  public checkAwarenessOverflow(depth: number, size: number): SafetyCheck {
    const checkId = this.generateCheckId();
    const timestamp = Date.now();

    let passed = true;
    let reason: string | null = null;

    if (depth > this.state.boundaries.maxAwarenessDepth) {
      passed = false;
      reason = `Awareness depth exceeded: ${depth} > ${this.state.boundaries.maxAwarenessDepth}`;
    } else if (size > this.state.boundaries.maxMemorySize) {
      passed = false;
      reason = `Awareness memory exceeded: ${size} > ${this.state.boundaries.maxMemorySize}`;
    }

    const check: SafetyCheck = {
      checkId,
      checkType: 'awareness_overflow',
      passed,
      reason,
      timestamp,
    };

    this.recordCheck(check);

    if (!passed && this.config.blockOnViolation) {
      this.recordViolation({
        type: 'awareness_overflow',
        severity: 'medium',
        description: reason!,
        blockedAction: 'awareness_expansion',
        context: { depth, size },
      });
    }

    return check;
  }

  /* ================================ */
  /* OPERATION VALIDATION             */
  /* ================================ */

  public isOperationAllowed(operation: string): boolean {
    const operationLower = operation.toLowerCase();

    // Check if operation is in allowed set
    for (const allowed of Array.from(this.state.boundaries.allowedOperations)) {
      if (operationLower.includes(allowed)) {
        return true;
      }
    }

    return false;
  }

  public validateOperation(operation: string, context: any): boolean {
    if (!this.config.enableBoundaryChecks) return true;

    // Check if operation is allowed
    if (!this.isOperationAllowed(operation)) {
      this.recordViolation({
        type: 'boundary_violation',
        severity: 'medium',
        description: `Operation not allowed: ${operation}`,
        blockedAction: operation,
        context,
      });

      return false;
    }

    return true;
  }

  /* ================================ */
  /* VIOLATION MANAGEMENT             */
  /* ================================ */

  private recordViolation(violation: Omit<SafetyViolation, 'violationId' | 'timestamp'>): void {
    const fullViolation: SafetyViolation = {
      violationId: this.generateViolationId(),
      timestamp: Date.now(),
      ...violation,
    };

    this.state.lastViolation = fullViolation;
    this.state.violationCount++;

    if (this.config.logViolations) {
      console.warn('[MLASSafetyGuardrail] VIOLATION:', fullViolation);
    }

    // Check for lockdown
    if (this.state.violationCount >= this.config.maxViolationsBeforeLockdown) {
      this.triggerLockdown();
    }
  }

  private recordCheck(check: SafetyCheck): void {
    this.state.recentChecks.push(check);

    // Keep only recent checks
    if (this.state.recentChecks.length > 50) {
      this.state.recentChecks.shift();
    }
  }

  private triggerLockdown(): void {
    this.state.isActive = false;
    console.error(
      '[MLASSafetyGuardrail] LOCKDOWN TRIGGERED: Too many safety violations. System disabled.'
    );
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public isActive(): boolean {
    return this.state.isActive;
  }

  public getViolationCount(): number {
    return this.state.violationCount;
  }

  public getLastViolation(): SafetyViolation | null {
    return this.state.lastViolation ? { ...this.state.lastViolation } : null;
  }

  public getRecentChecks(limit: number = 10): SafetyCheck[] {
    return this.state.recentChecks.slice(-limit);
  }

  public getBoundaries(): SafetyBoundaries {
    return {
      ...this.state.boundaries,
      allowedOperations: new Set(this.state.boundaries.allowedOperations),
      forbiddenPatterns: [...this.state.boundaries.forbiddenPatterns],
    };
  }

  /* ================================ */
  /* SUMMARY & REPORTING              */
  /* ================================ */

  public getSummary(): string {
    const violationsByType = new Map<ViolationType, number>();

    for (const check of this.state.recentChecks) {
      if (!check.passed) {
        violationsByType.set(
          check.checkType,
          (violationsByType.get(check.checkType) || 0) + 1
        );
      }
    }

    const violationList = Array.from(violationsByType.entries())
      .map(([type, count]) => `  - ${type}: ${count}`)
      .join('\n');

    return `MLAS Safety Guardrail Summary:

STATUS: ${this.state.isActive ? 'ACTIVE ✅' : 'LOCKED DOWN 🔒'}

SAFETY GUARANTEES:
  ✅ No autonomous actions
  ✅ No self-modification
  ✅ No unauthorized persistence
  ✅ No sandbox escape
  ✅ No unauthorized execution
  ✅ Read-only awareness

BOUNDARIES:
  Max Awareness Depth: ${this.state.boundaries.maxAwarenessDepth}
  Max Memory Size: ${(this.state.boundaries.maxMemorySize / 1024 / 1024).toFixed(1)}MB
  Max History Length: ${this.state.boundaries.maxHistoryLength}
  Allowed Operations: ${this.state.boundaries.allowedOperations.size}

VIOLATIONS:
  Total: ${this.state.violationCount}
  Last Violation: ${this.state.lastViolation ? new Date(this.state.lastViolation.timestamp).toLocaleString() : 'None'}
  
${violationList ? 'Recent Violations by Type:\n' + violationList : 'No recent violations'}

CHECKS:
  Total Checks: ${this.state.recentChecks.length}
  Passed: ${this.state.recentChecks.filter(c => c.passed).length}
  Failed: ${this.state.recentChecks.filter(c => !c.passed).length}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.state.violationCount = 0;
    this.state.lastViolation = null;
    this.state.recentChecks = [];
    this.state.isActive = true;
  }

  public clear(): void {
    this.reset();
  }

  /* ================================ */
  /* UTILITIES                        */
  /* ================================ */

  private generateCheckId(): string {
    return `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.state,
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.state = parsed.state;

      // Restore Sets
      this.state.boundaries.allowedOperations = new Set(
        parsed.state.boundaries.allowedOperations
      );

      // Restore RegExps
      this.state.boundaries.forbiddenPatterns = parsed.state.boundaries.forbiddenPatterns.map(
        (p: string) => new RegExp(p)
      );
    } catch (error) {
      console.error('[MLASSafetyGuardrail] Import failed:', error);
    }
  }
}
