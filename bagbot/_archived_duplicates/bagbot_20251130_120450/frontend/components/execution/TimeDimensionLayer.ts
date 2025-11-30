/**
 * LEVEL 13.3 — TIME DIMENSION LAYER
 * 
 * Tracks WHEN tasks should execute in the temporal dimension.
 * 
 * Features:
 * - Execution order (sequential, parallel, conditional)
 * - Dependency chains (what depends on what)
 * - Wait-for-signal states (user confirmation needed)
 * - Execution timeline visualization
 * 
 * Safety: Read-only temporal analysis, NO autonomous execution
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface TemporalTask {
  taskId: string;
  name: string;
  executionOrder: number; // Lower = earlier
  dependencies: string[]; // Task IDs that must complete first
  waitForSignal: boolean; // Requires user confirmation
  estimatedDuration: number; // milliseconds
  actualDuration: number | null;
  scheduledAt: number | null; // timestamp
  startedAt: number | null;
  completedAt: number | null;
  temporalStatus: TemporalStatus;
}

type TemporalStatus = 
  | 'scheduled'
  | 'waiting-dependencies'
  | 'waiting-signal'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'failed';

interface DependencyChain {
  rootTaskId: string;
  chain: string[][]; // Nested arrays represent parallel groups
  criticalPath: string[]; // Longest path through dependencies
  totalEstimatedDuration: number;
}

interface ExecutionTimeline {
  tasks: TemporalTask[];
  currentTime: number;
  startTime: number | null;
  endTime: number | null;
  phases: ExecutionPhase[];
}

interface ExecutionPhase {
  phaseId: string;
  name: string;
  taskIds: string[];
  sequenceType: 'sequential' | 'parallel' | 'conditional';
  startTime: number | null;
  endTime: number | null;
  status: 'pending' | 'active' | 'completed' | 'blocked';
}

interface WaitState {
  taskId: string;
  reason: string;
  waitingSince: number;
  signal: string | null; // What signal we're waiting for
  timeout: number | null; // Optional timeout
}

interface TemporalConflict {
  conflictId: string;
  taskIds: string[];
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

/* ================================ */
/* TIME DIMENSION LAYER             */
/* ================================ */

export class TimeDimensionLayer {
  private tasks: Map<string, TemporalTask>;
  private dependencyGraph: Map<string, string[]>; // taskId -> dependents
  private waitStates: Map<string, WaitState>;
  private timeline: ExecutionTimeline;
  private conflicts: TemporalConflict[];

  constructor() {
    this.tasks = new Map();
    this.dependencyGraph = new Map();
    this.waitStates = new Map();
    this.conflicts = [];
    
    this.timeline = {
      tasks: [],
      currentTime: Date.now(),
      startTime: null,
      endTime: null,
      phases: [],
    };
  }

  /* ================================ */
  /* TASK REGISTRATION                */
  /* ================================ */

  public registerTask(task: Omit<TemporalTask, 'temporalStatus' | 'actualDuration' | 'scheduledAt' | 'startedAt' | 'completedAt'>): void {
    const fullTask: TemporalTask = {
      ...task,
      temporalStatus: 'scheduled',
      actualDuration: null,
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
    };

    this.tasks.set(task.taskId, fullTask);

    // Build dependency graph
    for (const depId of task.dependencies) {
      if (!this.dependencyGraph.has(depId)) {
        this.dependencyGraph.set(depId, []);
      }
      this.dependencyGraph.get(depId)!.push(task.taskId);
    }

    // Update temporal status
    this.updateTemporalStatus(task.taskId);

    // Rebuild timeline
    this.rebuildTimeline();
  }

  /* ================================ */
  /* TEMPORAL STATUS MANAGEMENT       */
  /* ================================ */

  private updateTemporalStatus(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Check if dependencies are satisfied
    const unsatisfiedDeps = task.dependencies.filter(depId => {
      const dep = this.tasks.get(depId);
      return !dep || dep.temporalStatus !== 'completed';
    });

    if (unsatisfiedDeps.length > 0) {
      task.temporalStatus = 'waiting-dependencies';
    } else if (task.waitForSignal) {
      task.temporalStatus = 'waiting-signal';
    } else {
      task.temporalStatus = 'ready';
    }
  }

  public markTaskReady(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.temporalStatus === 'waiting-dependencies') {
      // Cannot force ready if dependencies not satisfied
      return false;
    }

    task.temporalStatus = 'ready';
    return true;
  }

  public markTaskExecuting(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.temporalStatus !== 'ready') return false;

    task.temporalStatus = 'executing';
    task.startedAt = Date.now();

    return true;
  }

  public markTaskCompleted(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.temporalStatus = 'completed';
    task.completedAt = Date.now();

    if (task.startedAt) {
      task.actualDuration = task.completedAt - task.startedAt;
    }

    // Update dependent tasks
    const dependents = this.dependencyGraph.get(taskId) || [];
    for (const depId of dependents) {
      this.updateTemporalStatus(depId);
    }

    return true;
  }

  /* ================================ */
  /* DEPENDENCY ANALYSIS              */
  /* ================================ */

  public buildDependencyChain(rootTaskId: string): DependencyChain {
    const visited = new Set<string>();
    const chain: string[][] = [];
    let criticalPath: string[] = [];
    let maxDuration = 0;

    const buildChain = (taskId: string, level: number, currentPath: string[], currentDuration: number): void => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = this.tasks.get(taskId);
      if (!task) return;

      if (!chain[level]) chain[level] = [];
      chain[level].push(taskId);

      const newPath = [...currentPath, taskId];
      const newDuration = currentDuration + task.estimatedDuration;

      // Check if this is the critical path
      if (newDuration > maxDuration) {
        maxDuration = newDuration;
        criticalPath = newPath;
      }

      // Process dependencies
      for (const depId of task.dependencies) {
        buildChain(depId, level + 1, newPath, newDuration);
      }
    };

    buildChain(rootTaskId, 0, [], 0);

    return {
      rootTaskId,
      chain,
      criticalPath,
      totalEstimatedDuration: maxDuration,
    };
  }

  public getExecutionOrder(): string[] {
    const ordered: string[] = [];
    const visited = new Set<string>();

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;

      const task = this.tasks.get(taskId);
      if (!task) return;

      // Visit dependencies first
      for (const depId of task.dependencies) {
        visit(depId);
      }

      visited.add(taskId);
      ordered.push(taskId);
    };

    // Sort tasks by execution order, then visit
    const sortedTasks = Array.from(this.tasks.values()).sort((a, b) => a.executionOrder - b.executionOrder);

    for (const task of sortedTasks) {
      visit(task.taskId);
    }

    return ordered;
  }

  /* ================================ */
  /* WAIT STATE MANAGEMENT            */
  /* ================================ */

  public addWaitState(taskId: string, reason: string, signal?: string, timeout?: number): void {
    const waitState: WaitState = {
      taskId,
      reason,
      waitingSince: Date.now(),
      signal: signal || null,
      timeout: timeout || null,
    };

    this.waitStates.set(taskId, waitState);

    const task = this.tasks.get(taskId);
    if (task) {
      task.temporalStatus = 'waiting-signal';
    }
  }

  public provideSignal(taskId: string, providedSignal: string): boolean {
    const waitState = this.waitStates.get(taskId);
    if (!waitState) return false;

    if (waitState.signal && waitState.signal !== providedSignal) {
      return false;
    }

    this.waitStates.delete(taskId);
    this.markTaskReady(taskId);

    return true;
  }

  public getWaitingTasks(): TemporalTask[] {
    return Array.from(this.tasks.values()).filter(
      t => t.temporalStatus === 'waiting-signal'
    );
  }

  /* ================================ */
  /* TIMELINE MANAGEMENT              */
  /* ================================ */

  private rebuildTimeline(): void {
    this.timeline.tasks = Array.from(this.tasks.values());
    this.timeline.currentTime = Date.now();

    // Identify phases
    this.timeline.phases = this.identifyPhases();
  }

  private identifyPhases(): ExecutionPhase[] {
    const phases: ExecutionPhase[] = [];
    const tasksByOrder = Array.from(this.tasks.values()).sort((a, b) => a.executionOrder - b.executionOrder);

    let currentPhase: ExecutionPhase | null = null;
    let lastOrder = -1;

    for (const task of tasksByOrder) {
      // Check if we need a new phase (significant jump in execution order)
      if (task.executionOrder - lastOrder > 100 || !currentPhase) {
        if (currentPhase) phases.push(currentPhase);

        currentPhase = {
          phaseId: `phase_${phases.length + 1}`,
          name: `Phase ${phases.length + 1}`,
          taskIds: [],
          sequenceType: 'sequential',
          startTime: null,
          endTime: null,
          status: 'pending',
        };
      }

      currentPhase.taskIds.push(task.taskId);
      lastOrder = task.executionOrder;
    }

    if (currentPhase) phases.push(currentPhase);

    return phases;
  }

  public getTimeline(): ExecutionTimeline {
    return {
      ...this.timeline,
      tasks: [...this.timeline.tasks],
      phases: this.timeline.phases.map(p => ({ ...p })),
    };
  }

  /* ================================ */
  /* CONFLICT DETECTION               */
  /* ================================ */

  public detectTemporalConflicts(): TemporalConflict[] {
    const conflicts: TemporalConflict[] = [];

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies();
    if (circularDeps.length > 0) {
      conflicts.push({
        conflictId: `circular_${Date.now()}`,
        taskIds: circularDeps,
        reason: 'Circular dependency detected',
        severity: 'high',
      });
    }

    // Check for tasks with same execution order but dependencies
    const orderGroups = new Map<number, string[]>();
    for (const task of Array.from(this.tasks.values())) {
      if (!orderGroups.has(task.executionOrder)) {
        orderGroups.set(task.executionOrder, []);
      }
      orderGroups.get(task.executionOrder)!.push(task.taskId);
    }

    for (const [order, taskIds] of Array.from(orderGroups.entries())) {
      if (taskIds.length > 1) {
        // Check if any have dependencies on each other
        const hasDeps = taskIds.some((id1: string) => {
          const task1 = this.tasks.get(id1)!;
          return taskIds.some((id2: string) => id1 !== id2 && task1.dependencies.includes(id2));
        });

        if (hasDeps) {
          conflicts.push({
            conflictId: `order_conflict_${order}`,
            taskIds,
            reason: `Tasks at order ${order} have dependencies on each other`,
            severity: 'medium',
          });
        }
      }
    }

    this.conflicts = conflicts;
    return conflicts;
  }

  private detectCircularDependencies(): string[] {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    let cycle: string[] = [];

    const visit = (taskId: string, path: string[]): boolean => {
      if (visiting.has(taskId)) {
        // Found cycle
        const cycleStart = path.indexOf(taskId);
        cycle = path.slice(cycleStart);
        return true;
      }

      if (visited.has(taskId)) return false;

      visiting.add(taskId);
      path.push(taskId);

      const task = this.tasks.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (visit(depId, [...path])) return true;
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);

      return false;
    };

    for (const taskId of Array.from(this.tasks.keys())) {
      if (visit(taskId, [])) break;
    }

    return cycle;
  }

  /* ================================ */
  /* QUERY METHODS                    */
  /* ================================ */

  public getTask(taskId: string): TemporalTask | undefined {
    return this.tasks.get(taskId);
  }

  public getReadyTasks(): TemporalTask[] {
    return Array.from(this.tasks.values()).filter(t => t.temporalStatus === 'ready');
  }

  public getExecutingTasks(): TemporalTask[] {
    return Array.from(this.tasks.values()).filter(t => t.temporalStatus === 'executing');
  }

  public getNextTask(): TemporalTask | null {
    const ready = this.getReadyTasks();
    if (ready.length === 0) return null;

    // Return task with lowest execution order
    return ready.reduce((min, task) => 
      task.executionOrder < min.executionOrder ? task : min
    );
  }

  /* ================================ */
  /* SUMMARY                          */
  /* ================================ */

  public getSummary(): string {
    const ready = this.getReadyTasks();
    const executing = this.getExecutingTasks();
    const waiting = this.getWaitingTasks();
    const completed = Array.from(this.tasks.values()).filter(t => t.temporalStatus === 'completed');

    return `Time Dimension Layer Summary:

TEMPORAL STATUS:
  Ready: ${ready.length}
  Executing: ${executing.length}
  Waiting Signal: ${waiting.length}
  Completed: ${completed.length}
  Total: ${this.tasks.size}

TIMELINE:
  Phases: ${this.timeline.phases.length}
  Conflicts: ${this.conflicts.length}

NEXT TASK: ${this.getNextTask()?.name || 'None'}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.tasks.clear();
    this.dependencyGraph.clear();
    this.waitStates.clear();
    this.conflicts = [];
    this.timeline = {
      tasks: [],
      currentTime: Date.now(),
      startTime: null,
      endTime: null,
      phases: [],
    };
  }
}
