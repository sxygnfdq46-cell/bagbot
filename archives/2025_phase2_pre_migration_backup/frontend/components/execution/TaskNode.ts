/**
 * LEVEL 13.4 — MULTI-COMMAND EXECUTION NETWORK
 * Component 1/8: TaskNode.ts
 * 
 * Purpose: Holds ALL metadata for every command
 * - 4D structure (Time, Scope, Impact, Mode)
 * - Links to parent/child tasks
 * - Readiness flags
 * - Safety constraints
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

export type TaskStatus = 
  | 'pending'           // Not yet ready
  | 'ready'             // Dependencies satisfied, can execute
  | 'waiting-signal'    // Needs user confirmation
  | 'executing'         // Currently running
  | 'completed'         // Successfully finished
  | 'failed'            // Execution failed
  | 'blocked'           // Blocked by conflicts
  | 'cancelled';        // User cancelled

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export type ConflictType = 
  | 'temporal'          // Time dimension conflict
  | 'scope'             // Scope dimension conflict
  | 'impact'            // Impact dimension conflict
  | 'mode'              // Mode dimension conflict
  | 'resource';         // Resource contention

export interface TaskMetadata {
  createdAt: number;
  createdBy: string;
  description: string;
  tags: string[];
  estimatedCost: number; // Resource cost (arbitrary units)
  actualCost: number | null;
  notes: string[];
}

/* ================================ */
/* 4D METADATA CONTAINERS           */
/* ================================ */

export interface TimeDimension {
  executionOrder: number;           // Lower = earlier
  dependencies: string[];           // Task IDs that must complete first
  dependents: string[];             // Task IDs that depend on this
  waitForSignal: boolean;           // Requires user confirmation
  estimatedDuration: number;        // Minutes
  actualDuration: number | null;    // Minutes (null until completed)
  scheduledAt: number | null;       // Timestamp
  startedAt: number | null;         // Timestamp
  completedAt: number | null;       // Timestamp
  deadline: number | null;          // Optional deadline timestamp
  canRunInParallel: boolean;        // Can run concurrently with others
}

export interface ScopeDimension {
  systemPart: 'frontend' | 'backend' | 'worker' | 'shared' | 'config';
  layer: 'visual' | 'logic' | 'connection' | 'storage' | 'config';
  subsystems: string[];             // Affected subsystems
  affectedFiles: string[];          // Files to be modified
  requiredResources: string[];      // Required resources (DB, API, etc)
  isolationScore: number;           // 0-100 (higher = more isolated)
  scopeVector: number[];            // 6D scope vector [fx, bx, wx, vis, log, con]
}

export interface ImpactDimension {
  changeType: 'ui' | 'wiring' | 'config' | 'logic' | 'storage' | 'architecture';
  impactLevel: 'small' | 'medium' | 'large' | 'critical';
  affectedAreas: Array<{
    areaId: string;
    areaType: 'component' | 'module' | 'service' | 'config' | 'database';
    estimatedChanges: number;       // Lines/files
    criticalityScore: number;       // 0-100
  }>;
  cascadeEffects: Array<{
    effectId: string;
    targetTaskId: string | null;    // Task affected by this cascade
    effectType: 'requires-update' | 'breaks-dependency' | 'invalidates-cache';
    severity: 'low' | 'medium' | 'high';
  }>;
  riskScore: number;                // 0-100 (higher = riskier)
  rollbackComplexity: number;       // 0-100 (higher = harder to rollback)
  reversible: boolean;              // Can this be undone?
}

export interface ModeDimension {
  executionMode: 'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe';
  allowedModes: Array<'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe'>;
  modeRequirements: Array<{
    requirementId: string;
    mode: 'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe';
    condition: string;
    satisfied: boolean;
  }>;
  modeCompatibilityScore: number;   // 0-100 (with current mode)
  transitionRequired: boolean;      // Requires mode change before execution
  targetMode: string | null;        // Mode to transition to (if required)
}

/* ================================ */
/* SAFETY CONSTRAINTS               */
/* ================================ */

export interface SafetyConstraints {
  requiresUserConfirmation: boolean;
  forbiddenOperations: string[];    // Operations not allowed
  requiredPermissions: string[];    // Permissions needed
  riskLevel: 'safe' | 'moderate' | 'high' | 'critical';
  safetyChecks: Array<{
    checkId: string;
    checkName: string;
    passed: boolean;
    reason: string | null;          // If not passed
  }>;
  autonomousExecutionAllowed: boolean; // ALWAYS FALSE for safety
  manualOverrideRequired: boolean;  // Requires explicit user command
}

/* ================================ */
/* CONFLICT MARKERS                 */
/* ================================ */

export interface TaskConflict {
  conflictId: string;
  conflictType: ConflictType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  conflictingTaskIds: string[];
  description: string;
  resolution: string | null;        // How to resolve
  canProceed: boolean;              // Can execute despite conflict
}

/* ================================ */
/* DEPENDENCY REFERENCES            */
/* ================================ */

export interface DependencyGraph {
  parentTasks: string[];            // Direct parents
  childTasks: string[];             // Direct children
  ancestorTasks: string[];          // All ancestors (transitive)
  descendantTasks: string[];        // All descendants (transitive)
  siblingTasks: string[];           // Tasks with same parent
  criticalPath: string[];           // Critical path to this task
  dependencyDepth: number;          // Depth in dependency tree
  fanIn: number;                    // Number of parents
  fanOut: number;                   // Number of children
}

/* ================================ */
/* READINESS FLAGS                  */
/* ================================ */

export interface ReadinessFlags {
  allDependenciesSatisfied: boolean;
  noConflictsDetected: boolean;
  resourcesAvailable: boolean;
  modeCompatible: boolean;
  safetyChecksPassed: boolean;
  userApprovalReceived: boolean;
  overallReady: boolean;            // AND of all above
  blockers: string[];               // List of blocking reasons
  readinessScore: number;           // 0-100 (confidence level)
}

/* ================================ */
/* TASK NODE                        */
/* ================================ */

export class TaskNode {
  // Core identity
  public taskId: string;
  public name: string;
  public command: string;           // Original command text
  public taskType: string;          // Type of task (e.g., 'code-change', 'test', 'deploy')
  
  // Status
  public status: TaskStatus;
  public priority: TaskPriority;
  
  // 4D dimensions
  public time: TimeDimension;
  public scope: ScopeDimension;
  public impact: ImpactDimension;
  public mode: ModeDimension;
  
  // Safety & constraints
  public safety: SafetyConstraints;
  
  // Graph structure
  public dependencies: DependencyGraph;
  
  // Conflicts
  public conflicts: TaskConflict[];
  
  // Readiness
  public readiness: ReadinessFlags;
  
  // Metadata
  public metadata: TaskMetadata;
  
  // Execution result
  public executionResult: {
    success: boolean;
    output: string | null;
    error: string | null;
    startTime: number | null;
    endTime: number | null;
    attempts: number;
  };

  constructor(taskId: string, name: string, command: string) {
    this.taskId = taskId;
    this.name = name;
    this.command = command;
    this.taskType = 'unknown';
    
    this.status = 'pending';
    this.priority = 'medium';
    
    // Initialize 4D dimensions with defaults
    this.time = {
      executionOrder: 0,
      dependencies: [],
      dependents: [],
      waitForSignal: false,
      estimatedDuration: 0,
      actualDuration: null,
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      deadline: null,
      canRunInParallel: false,
    };
    
    this.scope = {
      systemPart: 'shared',
      layer: 'logic',
      subsystems: [],
      affectedFiles: [],
      requiredResources: [],
      isolationScore: 50,
      scopeVector: [33, 33, 33, 33, 33, 33], // Neutral vector
    };
    
    this.impact = {
      changeType: 'logic',
      impactLevel: 'small',
      affectedAreas: [],
      cascadeEffects: [],
      riskScore: 0,
      rollbackComplexity: 0,
      reversible: true,
    };
    
    this.mode = {
      executionMode: 'safe',
      allowedModes: ['safe'],
      modeRequirements: [],
      modeCompatibilityScore: 100,
      transitionRequired: false,
      targetMode: null,
    };
    
    // Initialize safety constraints (STRICT by default)
    this.safety = {
      requiresUserConfirmation: true,      // ALWAYS require confirmation
      forbiddenOperations: [],
      requiredPermissions: [],
      riskLevel: 'moderate',
      safetyChecks: [],
      autonomousExecutionAllowed: false,   // NEVER allow autonomous execution
      manualOverrideRequired: true,        // ALWAYS require manual override
    };
    
    // Initialize empty dependency graph
    this.dependencies = {
      parentTasks: [],
      childTasks: [],
      ancestorTasks: [],
      descendantTasks: [],
      siblingTasks: [],
      criticalPath: [],
      dependencyDepth: 0,
      fanIn: 0,
      fanOut: 0,
    };
    
    // Initialize empty conflicts
    this.conflicts = [];
    
    // Initialize readiness (not ready by default)
    this.readiness = {
      allDependenciesSatisfied: false,
      noConflictsDetected: true,
      resourcesAvailable: false,
      modeCompatible: false,
      safetyChecksPassed: false,
      userApprovalReceived: false,
      overallReady: false,
      blockers: ['Not yet evaluated'],
      readinessScore: 0,
    };
    
    // Initialize metadata
    this.metadata = {
      createdAt: Date.now(),
      createdBy: 'system',
      description: '',
      tags: [],
      estimatedCost: 1,
      actualCost: null,
      notes: [],
    };
    
    // Initialize execution result
    this.executionResult = {
      success: false,
      output: null,
      error: null,
      startTime: null,
      endTime: null,
      attempts: 0,
    };
  }

  /* ================================ */
  /* READINESS EVALUATION             */
  /* ================================ */

  public evaluateReadiness(): void {
    const flags = this.readiness;
    
    // Check dependencies
    flags.allDependenciesSatisfied = this.time.dependencies.length === 0 || 
      this.dependencies.parentTasks.every(parentId => {
        // This will be checked by graph engine
        return true; // Placeholder
      });
    
    // Check conflicts
    flags.noConflictsDetected = this.conflicts.length === 0 || 
      this.conflicts.every(c => c.canProceed);
    
    // Check resources (placeholder)
    flags.resourcesAvailable = this.scope.requiredResources.length === 0;
    
    // Check mode compatibility
    flags.modeCompatible = this.mode.modeCompatibilityScore >= 60 && !this.mode.transitionRequired;
    
    // Check safety
    flags.safetyChecksPassed = this.safety.safetyChecks.length === 0 || 
      this.safety.safetyChecks.every(check => check.passed);
    
    // User approval (always required by default)
    flags.userApprovalReceived = !this.safety.requiresUserConfirmation;
    
    // Overall readiness (AND of all flags)
    flags.overallReady = 
      flags.allDependenciesSatisfied &&
      flags.noConflictsDetected &&
      flags.resourcesAvailable &&
      flags.modeCompatible &&
      flags.safetyChecksPassed &&
      flags.userApprovalReceived;
    
    // Collect blockers
    flags.blockers = [];
    if (!flags.allDependenciesSatisfied) flags.blockers.push('Dependencies not satisfied');
    if (!flags.noConflictsDetected) flags.blockers.push('Conflicts detected');
    if (!flags.resourcesAvailable) flags.blockers.push('Resources unavailable');
    if (!flags.modeCompatible) flags.blockers.push('Mode incompatible');
    if (!flags.safetyChecksPassed) flags.blockers.push('Safety checks failed');
    if (!flags.userApprovalReceived) flags.blockers.push('User approval required');
    
    // Calculate readiness score (0-100)
    const scoreComponents = [
      flags.allDependenciesSatisfied ? 20 : 0,
      flags.noConflictsDetected ? 20 : 0,
      flags.resourcesAvailable ? 15 : 0,
      flags.modeCompatible ? 15 : 0,
      flags.safetyChecksPassed ? 15 : 0,
      flags.userApprovalReceived ? 15 : 0,
    ];
    flags.readinessScore = scoreComponents.reduce((sum, score) => sum + score, 0);
  }

  /* ================================ */
  /* STATUS TRANSITIONS               */
  /* ================================ */

  public markReady(): void {
    if (this.readiness.overallReady) {
      this.status = 'ready';
    }
  }

  public markWaitingSignal(): void {
    this.status = 'waiting-signal';
    this.time.waitForSignal = true;
  }

  public markExecuting(): void {
    this.status = 'executing';
    this.time.startedAt = Date.now();
    this.executionResult.startTime = Date.now();
    this.executionResult.attempts += 1;
  }

  public markCompleted(output?: string): void {
    this.status = 'completed';
    this.time.completedAt = Date.now();
    this.executionResult.endTime = Date.now();
    this.executionResult.success = true;
    if (output) this.executionResult.output = output;
    
    // Calculate actual duration
    if (this.time.startedAt && this.time.completedAt) {
      this.time.actualDuration = (this.time.completedAt - this.time.startedAt) / 60000; // Minutes
    }
  }

  public markFailed(error: string): void {
    this.status = 'failed';
    this.executionResult.endTime = Date.now();
    this.executionResult.success = false;
    this.executionResult.error = error;
  }

  public markBlocked(reason: string): void {
    this.status = 'blocked';
    if (!this.readiness.blockers.includes(reason)) {
      this.readiness.blockers.push(reason);
    }
  }

  public markCancelled(): void {
    this.status = 'cancelled';
  }

  /* ================================ */
  /* CONFLICT MANAGEMENT              */
  /* ================================ */

  public addConflict(conflict: TaskConflict): void {
    this.conflicts.push(conflict);
    this.readiness.noConflictsDetected = this.conflicts.every(c => c.canProceed);
    this.evaluateReadiness();
  }

  public resolveConflict(conflictId: string, resolution: string): void {
    const conflict = this.conflicts.find(c => c.conflictId === conflictId);
    if (conflict) {
      conflict.resolution = resolution;
      conflict.canProceed = true;
    }
    this.evaluateReadiness();
  }

  public clearConflicts(): void {
    this.conflicts = [];
    this.readiness.noConflictsDetected = true;
    this.evaluateReadiness();
  }

  /* ================================ */
  /* METADATA HELPERS                 */
  /* ================================ */

  public addNote(note: string): void {
    this.metadata.notes.push(`[${new Date().toISOString()}] ${note}`);
  }

  public addTag(tag: string): void {
    if (!this.metadata.tags.includes(tag)) {
      this.metadata.tags.push(tag);
    }
  }

  /* ================================ */
  /* SERIALIZATION                    */
  /* ================================ */

  public toJSON(): any {
    return {
      taskId: this.taskId,
      name: this.name,
      command: this.command,
      taskType: this.taskType,
      status: this.status,
      priority: this.priority,
      time: this.time,
      scope: this.scope,
      impact: this.impact,
      mode: this.mode,
      safety: this.safety,
      dependencies: this.dependencies,
      conflicts: this.conflicts,
      readiness: this.readiness,
      metadata: this.metadata,
      executionResult: this.executionResult,
    };
  }

  public static fromJSON(json: any): TaskNode {
    const node = new TaskNode(json.taskId, json.name, json.command);
    
    // Restore all properties
    node.taskType = json.taskType || 'unknown';
    node.status = json.status || 'pending';
    node.priority = json.priority || 'medium';
    node.time = json.time;
    node.scope = json.scope;
    node.impact = json.impact;
    node.mode = json.mode;
    node.safety = json.safety;
    node.dependencies = json.dependencies;
    node.conflicts = json.conflicts || [];
    node.readiness = json.readiness;
    node.metadata = json.metadata;
    node.executionResult = json.executionResult;
    
    return node;
  }
}
