/**
 * LEVEL 13.3 — DIMENSIONAL EXECUTION PATHING (DEP)
 * 
 * Unified 4-dimensional task organization system.
 * 
 * Dimensions:
 * 1. TIME - When tasks execute (order, dependencies, sequencing)
 * 2. SCOPE - Where tasks execute (frontend/backend/worker, layers)
 * 3. IMPACT - What tasks change (UI/wiring/config, risk levels)
 * 4. MODE - How tasks execute (build/integration/display/diagnostics)
 * 
 * Result: Next-generation construction engine with perfect ordering,
 * conflict avoidance, and multi-step build organization.
 * 
 * CRITICAL SAFETY: NO autonomous execution, NO independent decision-making.
 * BagBot is still a tool, not a mind.
 */

import { TimeDimensionLayer } from './TimeDimensionLayer';
import { ScopeDimensionLayer } from './ScopeDimensionLayer';
import { ImpactDimensionLayer } from './ImpactDimensionLayer';
import { ModeDimensionLayer } from './ModeDimensionLayer';

/* ================================ */
/* TYPES                            */
/* ================================ */

interface DEPTask {
  taskId: string;
  name: string;
  description: string;
  
  // Time dimension
  executionOrder: number;
  dependencies: string[];
  waitForSignal: boolean;
  estimatedDuration: number;
  
  // Scope dimension
  systemPart: 'frontend' | 'backend' | 'worker' | 'shared' | 'config';
  layer: 'visual' | 'logic' | 'connection' | 'storage' | 'config';
  subsystems: string[];
  affectedFiles: string[];
  
  // Impact dimension
  changeType: 'ui' | 'wiring' | 'config' | 'logic' | 'storage' | 'architecture';
  impactLevel: 'small' | 'medium' | 'large' | 'critical';
  affectedAreas: Array<{
    areaId: string;
    areaType: 'component' | 'module' | 'service' | 'config' | 'database';
    estimatedChanges: number;
    criticalityScore: number;
  }>;
  cascadeEffects: Array<{
    effectId: string;
    sourceTaskId: string;
    targetArea: string;
    effectType: 'requires-update' | 'breaks-dependency' | 'invalidates-cache';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  rollbackComplexity: number;
  
  // Mode dimension
  executionMode: 'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe';
  allowedModes: Array<'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe'>;
  modeRequirements: Array<{
    requirementId: string;
    mode: 'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe';
    condition: string;
    satisfied: boolean;
  }>;
  
  metadata: Record<string, any>;
}

interface ExecutionPath {
  pathId: string;
  tasks: DEPTask[];
  executionOrder: string[]; // Ordered task IDs
  phases: ExecutionPhase[];
  conflicts: Conflict[];
  estimatedDuration: number;
  riskScore: number;
}

interface ExecutionPhase {
  phaseId: string;
  name: string;
  taskIds: string[];
  sequenceType: 'sequential' | 'parallel';
  canProceed: boolean;
  blockingReasons: string[];
}

interface Conflict {
  conflictId: string;
  taskIds: string[];
  dimension: 'time' | 'scope' | 'impact' | 'mode';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolution: string | null;
}

interface FourDimensionalAnalysis {
  taskId: string;
  timeScore: number;      // 0-100 (ready to execute?)
  scopeScore: number;     // 0-100 (isolated/conflict-free?)
  impactScore: number;    // 0-100 (low risk?)
  modeScore: number;      // 0-100 (compatible with current mode?)
  overallScore: number;   // 0-100 (average of all dimensions)
  recommendation: string;
}

interface DEPSnapshot {
  timestamp: number;
  currentMode: string;
  activeTasks: number;
  readyTasks: number;
  blockedTasks: number;
  conflicts: number;
  overallHealth: number; // 0-100
}

/* ================================ */
/* DIMENSIONAL EXECUTION PATHING    */
/* ================================ */

export class DimensionalExecutionPathing {
  // 4 Dimension Layers
  private timeLayer: TimeDimensionLayer;
  private scopeLayer: ScopeDimensionLayer;
  private impactLayer: ImpactDimensionLayer;
  private modeLayer: ModeDimensionLayer;

  // Task Registry
  private tasks: Map<string, DEPTask>;

  // Execution State
  private executionPaths: Map<string, ExecutionPath>;
  private activePathId: string | null;

  constructor() {
    this.timeLayer = new TimeDimensionLayer();
    this.scopeLayer = new ScopeDimensionLayer();
    this.impactLayer = new ImpactDimensionLayer();
    this.modeLayer = new ModeDimensionLayer();

    this.tasks = new Map();
    this.executionPaths = new Map();
    this.activePathId = null;
  }

  /* ================================ */
  /* TASK REGISTRATION                */
  /* ================================ */

  public registerTask(task: DEPTask): void {
    this.tasks.set(task.taskId, task);

    // Register in all 4 dimensions
    this.timeLayer.registerTask({
      taskId: task.taskId,
      name: task.name,
      executionOrder: task.executionOrder,
      dependencies: task.dependencies,
      waitForSignal: task.waitForSignal,
      estimatedDuration: task.estimatedDuration,
    });

    this.scopeLayer.registerTask({
      taskId: task.taskId,
      name: task.name,
      systemPart: task.systemPart,
      layer: task.layer,
      subsystems: task.subsystems,
      affectedFiles: task.affectedFiles,
      scopeMetadata: task.metadata,
    });

    this.impactLayer.registerTask({
      taskId: task.taskId,
      name: task.name,
      changeType: task.changeType,
      impactLevel: task.impactLevel,
      affectedAreas: task.affectedAreas,
      cascadeEffects: task.cascadeEffects,
      rollbackComplexity: task.rollbackComplexity,
      impactMetadata: task.metadata,
    });

    this.modeLayer.registerTask({
      taskId: task.taskId,
      name: task.name,
      executionMode: task.executionMode,
      allowedModes: task.allowedModes,
      modeRequirements: task.modeRequirements,
      modeMetadata: task.metadata,
    });
  }

  /* ================================ */
  /* 4D ANALYSIS                      */
  /* ================================ */

  public analyzeFourDimensions(taskId: string): FourDimensionalAnalysis {
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        taskId,
        timeScore: 0,
        scopeScore: 0,
        impactScore: 0,
        modeScore: 0,
        overallScore: 0,
        recommendation: 'Task not found',
      };
    }

    // Time dimension score (is it ready?)
    const temporalTask = this.timeLayer.getTask(taskId);
    let timeScore = 0;
    if (temporalTask) {
      if (temporalTask.temporalStatus === 'ready') timeScore = 100;
      else if (temporalTask.temporalStatus === 'executing') timeScore = 80;
      else if (temporalTask.temporalStatus === 'waiting-signal') timeScore = 60;
      else if (temporalTask.temporalStatus === 'waiting-dependencies') timeScore = 20;
      else timeScore = 0;
    }

    // Scope dimension score (is it isolated?)
    const scopeScore = this.scopeLayer.getIsolationScore(taskId);

    // Impact dimension score (is it low risk?)
    const impactMap = this.impactLayer['impactMaps'].get(taskId);
    const impactScore = impactMap ? 100 - impactMap.riskScore : 0;

    // Mode dimension score (is it compatible?)
    const modeScore = this.modeLayer.getCompatibilityScore(taskId, this.modeLayer.getCurrentMode());

    // Overall score (average)
    const overallScore = (timeScore + scopeScore + impactScore + modeScore) / 4;

    // Generate recommendation
    let recommendation = '';
    if (overallScore >= 80) {
      recommendation = 'EXCELLENT - Task is ready, isolated, low-risk, and mode-compatible. Execute now.';
    } else if (overallScore >= 60) {
      recommendation = 'GOOD - Task is mostly ready. Check specific dimensions for minor issues.';
    } else if (overallScore >= 40) {
      recommendation = 'CAUTION - Task has some concerns. Review dimensions before executing.';
    } else {
      recommendation = 'NOT READY - Task has significant issues. Do not execute yet.';
    }

    return {
      taskId,
      timeScore,
      scopeScore,
      impactScore,
      modeScore,
      overallScore,
      recommendation,
    };
  }

  /* ================================ */
  /* EXECUTION PATH GENERATION        */
  /* ================================ */

  public generateExecutionPath(taskIds: string[]): ExecutionPath {
    const pathId = `path_${Date.now()}`;
    const tasks = taskIds.map(id => this.tasks.get(id)!).filter(Boolean);

    // Get execution order from time dimension
    const executionOrder = this.timeLayer.getExecutionOrder().filter(id => taskIds.includes(id));

    // Identify phases
    const phases = this.identifyPhases(executionOrder);

    // Detect conflicts across all dimensions
    const conflicts = this.detectAllConflicts(taskIds);

    // Calculate total duration
    const estimatedDuration = tasks.reduce((sum, t) => sum + t.estimatedDuration, 0);

    // Calculate overall risk
    const riskScores = taskIds.map(id => {
      const impactMap = this.impactLayer['impactMaps'].get(id);
      return impactMap ? impactMap.riskScore : 0;
    });
    const riskScore = riskScores.reduce((sum, r) => sum + r, 0) / riskScores.length || 0;

    const path: ExecutionPath = {
      pathId,
      tasks,
      executionOrder,
      phases,
      conflicts,
      estimatedDuration,
      riskScore,
    };

    this.executionPaths.set(pathId, path);
    this.activePathId = pathId;

    return path;
  }

  private identifyPhases(executionOrder: string[]): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    let currentPhase: ExecutionPhase | null = null;

    for (let i = 0; i < executionOrder.length; i++) {
      const taskId = executionOrder[i];
      const task = this.tasks.get(taskId);
      if (!task) continue;

      // Check if we need a new phase (mode change or significant order jump)
      if (!currentPhase || 
          (i > 0 && task.executionOrder - this.tasks.get(executionOrder[i - 1])!.executionOrder > 100)) {
        if (currentPhase) phases.push(currentPhase);

        currentPhase = {
          phaseId: `phase_${phases.length + 1}`,
          name: `Phase ${phases.length + 1}`,
          taskIds: [],
          sequenceType: 'sequential',
          canProceed: true,
          blockingReasons: [],
        };
      }

      currentPhase.taskIds.push(taskId);

      // Check if phase can proceed
      const analysis = this.analyzeFourDimensions(taskId);
      if (analysis.overallScore < 60) {
        currentPhase.canProceed = false;
        currentPhase.blockingReasons.push(`${task.name}: ${analysis.recommendation}`);
      }
    }

    if (currentPhase) phases.push(currentPhase);

    return phases;
  }

  private detectAllConflicts(taskIds: string[]): Conflict[] {
    const conflicts: Conflict[] = [];

    // Time conflicts
    const timeConflicts = this.timeLayer.detectTemporalConflicts();
    for (const tc of timeConflicts) {
      if (tc.taskIds.some(id => taskIds.includes(id))) {
        conflicts.push({
          conflictId: tc.conflictId,
          taskIds: tc.taskIds,
          dimension: 'time',
          severity: tc.severity as 'low' | 'medium' | 'high' | 'critical',
          description: tc.reason,
          resolution: 'Adjust execution order or resolve dependencies',
        });
      }
    }

    // Scope conflicts
    const scopeConflicts = this.scopeLayer.getConflicts();
    for (const sc of scopeConflicts) {
      if (sc.taskIds.some(id => taskIds.includes(id))) {
        conflicts.push({
          conflictId: sc.conflictId,
          taskIds: sc.taskIds,
          dimension: 'scope',
          severity: sc.severity as 'low' | 'medium' | 'high' | 'critical',
          description: sc.reason,
          resolution: 'Isolate tasks or execute sequentially',
        });
      }
    }

    // Mode conflicts (tasks not allowed in current mode)
    const notAllowed = this.modeLayer.getTasksNotAllowedInCurrentMode();
    const conflictingTaskIds = notAllowed.filter(t => taskIds.includes(t.taskId)).map(t => t.taskId);
    if (conflictingTaskIds.length > 0) {
      conflicts.push({
        conflictId: `mode_conflict_${Date.now()}`,
        taskIds: conflictingTaskIds,
        dimension: 'mode',
        severity: 'high',
        description: `Tasks not allowed in current mode: ${this.modeLayer.getCurrentMode()}`,
        resolution: `Transition to appropriate mode or remove tasks`,
      });
    }

    return conflicts;
  }

  /* ================================ */
  /* EXECUTION CONTROL                */
  /* ================================ */

  public getNextTask(): DEPTask | null {
    const temporalNext = this.timeLayer.getNextTask();
    if (!temporalNext) return null;

    return this.tasks.get(temporalNext.taskId) || null;
  }

  public canProceed(): boolean {
    const next = this.getNextTask();
    if (!next) return false;

    const analysis = this.analyzeFourDimensions(next.taskId);
    return analysis.overallScore >= 60;
  }

  public getBlockingReasons(): string[] {
    const next = this.getNextTask();
    if (!next) return ['No tasks in queue'];

    const reasons: string[] = [];
    const analysis = this.analyzeFourDimensions(next.taskId);

    if (analysis.timeScore < 60) reasons.push(`Time: Not ready (score: ${analysis.timeScore})`);
    if (analysis.scopeScore < 60) reasons.push(`Scope: Conflicts detected (score: ${analysis.scopeScore})`);
    if (analysis.impactScore < 60) reasons.push(`Impact: High risk (score: ${analysis.impactScore})`);
    if (analysis.modeScore < 60) reasons.push(`Mode: Not compatible (score: ${analysis.modeScore})`);

    return reasons;
  }

  /* ================================ */
  /* MODE MANAGEMENT                  */
  /* ================================ */

  public transitionMode(mode: 'build' | 'integration' | 'display' | 'diagnostics' | 'maintenance' | 'safe', trigger: string): boolean {
    return this.modeLayer.transitionMode(mode, trigger);
  }

  public getCurrentMode(): string {
    return this.modeLayer.getCurrentMode();
  }

  /* ================================ */
  /* SNAPSHOT & MONITORING            */
  /* ================================ */

  public captureSnapshot(): DEPSnapshot {
    const activeTasks = Array.from(this.tasks.values()).length;
    const readyTasks = this.timeLayer.getReadyTasks().length;
    const waitingTasks = this.timeLayer.getWaitingTasks().length;
    const blockedTasks = activeTasks - readyTasks - waitingTasks;

    const conflicts = this.activePathId 
      ? this.executionPaths.get(this.activePathId)?.conflicts.length || 0
      : 0;

    // Calculate overall health
    let health = 100;
    health -= conflicts * 10;
    health -= blockedTasks * 5;
    const readyRatio = activeTasks > 0 ? readyTasks / activeTasks : 1;
    health *= readyRatio;

    return {
      timestamp: Date.now(),
      currentMode: this.modeLayer.getCurrentMode(),
      activeTasks,
      readyTasks,
      blockedTasks,
      conflicts,
      overallHealth: Math.max(0, Math.min(100, health)),
    };
  }

  /* ================================ */
  /* SUMMARY & REPORTING              */
  /* ================================ */

  public getSummary(): string {
    const snapshot = this.captureSnapshot();
    const next = this.getNextTask();
    const canProceed = this.canProceed();
    const blocking = this.getBlockingReasons();

    return `╔══════════════════════════════════════════════════════════════════╗
║         LEVEL 13.3 — DIMENSIONAL EXECUTION PATHING (DEP)         ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4-DIMENSIONAL STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TIME Dimension: ${this.timeLayer.getReadyTasks().length} ready, ${this.timeLayer.getWaitingTasks().length} waiting
  SCOPE Dimension: ${this.scopeLayer.getAvailableSubsystems().length} subsystems available
  IMPACT Dimension: ${this.impactLayer.getLowRiskTasks().length} low-risk tasks
  MODE Dimension: ${this.modeLayer.getCurrentMode()} mode active

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXECUTION STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Tasks: ${snapshot.activeTasks}
  Ready: ${snapshot.readyTasks}
  Blocked: ${snapshot.blockedTasks}
  Conflicts: ${snapshot.conflicts}
  Overall Health: ${snapshot.overallHealth.toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${next ? `
  Name: ${next.name}
  Can Proceed: ${canProceed ? 'YES ✅' : 'NO ❌'}
  ${canProceed ? '' : `
  Blocking Reasons:
    ${blocking.map(r => `- ${r}`).join('\n    ')}`}
  ` : 'No tasks in queue'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ NO autonomous execution
  ✅ NO independent decision-making
  ✅ ALL actions require user command
  ✅ BagBot is a TOOL, not a mind

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Result: Next-generation construction engine with perfect ordering,
        conflict avoidance, and multi-step build organization.
`;
  }

  public getLayerSummaries(): {
    time: string;
    scope: string;
    impact: string;
    mode: string;
  } {
    return {
      time: this.timeLayer.getSummary(),
      scope: this.scopeLayer.getSummary(),
      impact: this.impactLayer.getSummary(),
      mode: this.modeLayer.getSummary(),
    };
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.tasks.clear();
    this.executionPaths.clear();
    this.activePathId = null;
    this.timeLayer.clear();
    this.scopeLayer.clear();
    this.impactLayer.clear();
    this.modeLayer.clear();
  }
}
