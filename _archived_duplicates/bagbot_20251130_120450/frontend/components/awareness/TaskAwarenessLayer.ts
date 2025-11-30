/**
 * LEVEL 13.2 — TASK-AWARENESS LAYER
 * 
 * Tracks ongoing tasks, sequences, dependencies, and next steps.
 * Creates flow-intelligent behavior — BagBot won't get lost in complex builds.
 * 
 * Features:
 * - Ongoing task tracking
 * - Task sequence management
 * - Dependency resolution
 * - Next-step prediction
 * - Confirmation state tracking
 * - Pause/proceed logic
 * 
 * Safety: Read-only awareness, no autonomous execution
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface TaskNode {
  taskId: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: number; // 1-10
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  dependencies: string[]; // task IDs
  blockedBy: string[]; // task IDs blocking this one
  estimatedDuration: number; // milliseconds
  actualDuration: number | null;
  tags: string[];
  metadata: Record<string, any>;
}

type TaskStatus =
  | 'pending'
  | 'waiting-confirmation'
  | 'ready'
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface TaskSequence {
  sequenceId: string;
  name: string;
  description: string;
  taskIds: string[]; // ordered list
  currentIndex: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  completedAt: number | null;
}

interface DependencyGraph {
  nodes: Map<string, TaskNode>;
  edges: Map<string, string[]>; // taskId -> dependent task IDs
  resolvedOrder: string[]; // topological sort
}

interface NextStepPrediction {
  predictedTaskId: string | null;
  confidence: number; // 0-100
  reasoning: string;
  alternativeTasks: Array<{
    taskId: string;
    confidence: number;
    reason: string;
  }>;
}

interface ConfirmationState {
  taskId: string;
  question: string;
  options: string[];
  defaultOption: string | null;
  timeout: number; // milliseconds
  askedAt: number;
}

interface FlowIntelligence {
  currentFocus: string | null; // current task ID
  nextRecommended: string | null; // next task ID
  blockedTasks: string[]; // task IDs
  readyTasks: string[]; // task IDs
  waitingConfirmation: string[]; // task IDs
  shouldPause: boolean;
  shouldProceed: boolean;
  flowScore: number; // 0-100 (how smoothly tasks are flowing)
}

interface TaskAwarenessConfig {
  maxActiveTasks: number;
  maxSequences: number;
  autoResolveReady: boolean; // auto-start ready tasks
  confirmationTimeoutMs: number;
  enableFlowIntelligence: boolean;
}

/* ================================ */
/* TASK-AWARENESS LAYER             */
/* ================================ */

export class TaskAwarenessLayer {
  private config: TaskAwarenessConfig;

  // Task State
  private tasks: Map<string, TaskNode>;
  private sequences: Map<string, TaskSequence>;
  private dependencyGraph: DependencyGraph;

  // Confirmation State
  private confirmationStates: Map<string, ConfirmationState>;

  // Flow Intelligence
  private flowIntelligence: FlowIntelligence;

  constructor(config?: Partial<TaskAwarenessConfig>) {
    this.config = {
      maxActiveTasks: 20,
      maxSequences: 5,
      autoResolveReady: false,
      confirmationTimeoutMs: 300000, // 5 minutes
      enableFlowIntelligence: true,
      ...config,
    };

    this.tasks = new Map();
    this.sequences = new Map();
    this.dependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      resolvedOrder: [],
    };

    this.confirmationStates = new Map();

    this.flowIntelligence = {
      currentFocus: null,
      nextRecommended: null,
      blockedTasks: [],
      readyTasks: [],
      waitingConfirmation: [],
      shouldPause: false,
      shouldProceed: true,
      flowScore: 100,
    };
  }

  /* ================================ */
  /* TASK MANAGEMENT                  */
  /* ================================ */

  public addTask(
    name: string,
    description: string,
    priority: number = 5,
    dependencies: string[] = [],
    estimatedDuration: number = 60000, // 1 minute default
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): string {
    const now = Date.now();

    const task: TaskNode = {
      taskId: `task_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      status: dependencies.length > 0 ? 'pending' : 'ready',
      priority: Math.max(1, Math.min(10, priority)),
      createdAt: now,
      startedAt: null,
      completedAt: null,
      dependencies,
      blockedBy: [],
      estimatedDuration,
      actualDuration: null,
      tags,
      metadata,
    };

    // Check if dependencies are satisfied
    if (dependencies.length > 0) {
      const unsatisfiedDeps = this.getUnsatisfiedDependencies(dependencies);
      if (unsatisfiedDeps.length > 0) {
        task.status = 'pending';
        task.blockedBy = unsatisfiedDeps;
      } else {
        task.status = 'ready';
      }
    }

    this.tasks.set(task.taskId, task);

    // Update dependency graph
    this.updateDependencyGraph();

    // Update flow intelligence
    this.updateFlowIntelligence();

    return task.taskId;
  }

  private getUnsatisfiedDependencies(dependencies: string[]): string[] {
    const unsatisfied: string[] = [];

    for (const depId of dependencies) {
      const dep = this.tasks.get(depId);
      if (!dep || dep.status !== 'completed') {
        unsatisfied.push(depId);
      }
    }

    return unsatisfied;
  }

  public startTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Check if task is ready
    if (task.status !== 'ready') {
      return false;
    }

    task.status = 'in-progress';
    task.startedAt = Date.now();

    // Update flow intelligence
    this.flowIntelligence.currentFocus = taskId;
    this.updateFlowIntelligence();

    return true;
  }

  public completeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'completed';
    task.completedAt = Date.now();

    if (task.startedAt) {
      task.actualDuration = task.completedAt - task.startedAt;
    }

    // Unblock dependent tasks
    this.unblockDependentTasks(taskId);

    // Update flow intelligence
    if (this.flowIntelligence.currentFocus === taskId) {
      this.flowIntelligence.currentFocus = null;
    }
    this.updateFlowIntelligence();

    return true;
  }

  public pauseTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'in-progress') return false;

    task.status = 'paused';

    // Update flow intelligence
    this.flowIntelligence.shouldPause = true;
    this.updateFlowIntelligence();

    return true;
  }

  public resumeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'paused') return false;

    task.status = 'in-progress';
    task.startedAt = Date.now();

    // Update flow intelligence
    this.flowIntelligence.shouldPause = false;
    this.flowIntelligence.currentFocus = taskId;
    this.updateFlowIntelligence();

    return true;
  }

  public failTask(taskId: string, reason?: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'failed';
    task.completedAt = Date.now();

    if (reason) {
      task.metadata.failureReason = reason;
    }

    // Update flow intelligence
    this.updateFlowIntelligence();

    return true;
  }

  private unblockDependentTasks(completedTaskId: string): void {
    const allTasks = Array.from(this.tasks.values());

    for (const task of allTasks) {
      if (task.dependencies.includes(completedTaskId)) {
        // Remove from blockedBy
        task.blockedBy = task.blockedBy.filter(id => id !== completedTaskId);

        // If no more blockers, mark as ready
        if (task.blockedBy.length === 0 && task.status === 'pending') {
          task.status = 'ready';
        }
      }
    }
  }

  /* ================================ */
  /* TASK SEQUENCES                   */
  /* ================================ */

  public createSequence(
    name: string,
    description: string,
    taskIds: string[]
  ): string {
    const now = Date.now();

    const sequence: TaskSequence = {
      sequenceId: `seq_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      taskIds,
      currentIndex: 0,
      status: 'not-started',
      createdAt: now,
      completedAt: null,
    };

    this.sequences.set(sequence.sequenceId, sequence);

    return sequence.sequenceId;
  }

  public advanceSequence(sequenceId: string): boolean {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return false;

    // Check if current task is completed
    const currentTaskId = sequence.taskIds[sequence.currentIndex];
    const currentTask = this.tasks.get(currentTaskId);

    if (!currentTask || currentTask.status !== 'completed') {
      return false;
    }

    // Move to next task
    sequence.currentIndex++;

    if (sequence.currentIndex >= sequence.taskIds.length) {
      sequence.status = 'completed';
      sequence.completedAt = Date.now();
    } else {
      sequence.status = 'in-progress';
    }

    return true;
  }

  public getSequenceProgress(sequenceId: string): number {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return 0;

    const completedTasks = sequence.taskIds
      .slice(0, sequence.currentIndex)
      .filter(taskId => {
        const task = this.tasks.get(taskId);
        return task && task.status === 'completed';
      }).length;

    return (completedTasks / sequence.taskIds.length) * 100;
  }

  /* ================================ */
  /* DEPENDENCY GRAPH                 */
  /* ================================ */

  private updateDependencyGraph(): void {
    // Rebuild dependency graph
    this.dependencyGraph.nodes.clear();
    this.dependencyGraph.edges.clear();

    const allTasks = Array.from(this.tasks.values());

    for (const task of allTasks) {
      this.dependencyGraph.nodes.set(task.taskId, task);

      for (const depId of task.dependencies) {
        if (!this.dependencyGraph.edges.has(depId)) {
          this.dependencyGraph.edges.set(depId, []);
        }
        this.dependencyGraph.edges.get(depId)!.push(task.taskId);
      }
    }

    // Topological sort
    this.dependencyGraph.resolvedOrder = this.topologicalSort();
  }

  private topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): boolean => {
      if (visited.has(taskId)) return true;
      if (visiting.has(taskId)) return false; // cycle detected

      visiting.add(taskId);

      const task = this.tasks.get(taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (!visit(depId)) return false;
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      sorted.push(taskId);

      return true;
    };

    const allTaskIds = Array.from(this.tasks.keys());
    for (const taskId of allTaskIds) {
      if (!visited.has(taskId)) {
        visit(taskId);
      }
    }

    return sorted;
  }

  public getDependencyChain(taskId: string): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const task = this.tasks.get(id);
      if (!task) return;

      for (const depId of task.dependencies) {
        traverse(depId);
      }

      chain.push(id);
    };

    traverse(taskId);
    return chain;
  }

  /* ================================ */
  /* NEXT-STEP PREDICTION             */
  /* ================================ */

  public predictNextStep(): NextStepPrediction {
    // Get ready tasks
    const readyTasks = this.getReadyTasks();

    if (readyTasks.length === 0) {
      return {
        predictedTaskId: null,
        confidence: 0,
        reasoning: 'No tasks are currently ready to start',
        alternativeTasks: [],
      };
    }

    // Sort by priority and position in dependency order
    const sortedTasks = readyTasks.sort((a, b) => {
      // First by priority
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      // Then by dependency order
      const aIndex = this.dependencyGraph.resolvedOrder.indexOf(a.taskId);
      const bIndex = this.dependencyGraph.resolvedOrder.indexOf(b.taskId);

      return aIndex - bIndex;
    });

    const predictedTask = sortedTasks[0];
    const confidence = Math.min(100, predictedTask.priority * 10);

    const alternativeTasks = sortedTasks.slice(1, 4).map(task => ({
      taskId: task.taskId,
      confidence: Math.min(100, task.priority * 8),
      reason: `Priority ${task.priority} task: ${task.name}`,
    }));

    return {
      predictedTaskId: predictedTask.taskId,
      confidence,
      reasoning: `Priority ${predictedTask.priority} task ready to start: ${predictedTask.name}`,
      alternativeTasks,
    };
  }

  private getReadyTasks(): TaskNode[] {
    return Array.from(this.tasks.values()).filter(
      task => task.status === 'ready'
    );
  }

  /* ================================ */
  /* CONFIRMATION STATE               */
  /* ================================ */

  public requestConfirmation(
    taskId: string,
    question: string,
    options: string[],
    defaultOption: string | null = null,
    timeout: number = this.config.confirmationTimeoutMs
  ): void {
    const now = Date.now();

    const state: ConfirmationState = {
      taskId,
      question,
      options,
      defaultOption,
      timeout,
      askedAt: now,
    };

    this.confirmationStates.set(taskId, state);

    // Update task status
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'waiting-confirmation';
    }

    // Update flow intelligence
    this.updateFlowIntelligence();
  }

  public provideConfirmation(taskId: string, answer: string): boolean {
    const state = this.confirmationStates.get(taskId);
    if (!state) return false;

    // Validate answer
    if (!state.options.includes(answer)) {
      return false;
    }

    // Update task metadata
    const task = this.tasks.get(taskId);
    if (task) {
      task.metadata.confirmation = answer;
      task.status = 'ready';
    }

    // Remove confirmation state
    this.confirmationStates.delete(taskId);

    // Update flow intelligence
    this.updateFlowIntelligence();

    return true;
  }

  public getPendingConfirmations(): ConfirmationState[] {
    return Array.from(this.confirmationStates.values());
  }

  /* ================================ */
  /* FLOW INTELLIGENCE                */
  /* ================================ */

  private updateFlowIntelligence(): void {
    const allTasks = Array.from(this.tasks.values());

    // Update lists
    this.flowIntelligence.blockedTasks = allTasks
      .filter(t => t.status === 'pending')
      .map(t => t.taskId);

    this.flowIntelligence.readyTasks = allTasks
      .filter(t => t.status === 'ready')
      .map(t => t.taskId);

    this.flowIntelligence.waitingConfirmation = allTasks
      .filter(t => t.status === 'waiting-confirmation')
      .map(t => t.taskId);

    // Determine pause/proceed
    this.flowIntelligence.shouldPause =
      this.flowIntelligence.waitingConfirmation.length > 0 ||
      allTasks.some(t => t.status === 'paused');

    this.flowIntelligence.shouldProceed =
      !this.flowIntelligence.shouldPause &&
      this.flowIntelligence.readyTasks.length > 0;

    // Predict next recommended task
    const prediction = this.predictNextStep();
    this.flowIntelligence.nextRecommended = prediction.predictedTaskId;

    // Calculate flow score
    this.flowIntelligence.flowScore = this.calculateFlowScore();
  }

  private calculateFlowScore(): number {
    const allTasks = Array.from(this.tasks.values());
    if (allTasks.length === 0) return 100;

    const completedCount = allTasks.filter(t => t.status === 'completed').length;
    const inProgressCount = allTasks.filter(t => t.status === 'in-progress').length;
    const readyCount = allTasks.filter(t => t.status === 'ready').length;
    const blockedCount = allTasks.filter(t => t.status === 'pending').length;
    const waitingCount = allTasks.filter(t => t.status === 'waiting-confirmation').length;

    // Score factors
    const completionScore = (completedCount / allTasks.length) * 40;
    const progressScore = inProgressCount > 0 ? 20 : 0;
    const readinessScore = (readyCount / Math.max(1, allTasks.length - completedCount)) * 20;
    const blockagePenalty = (blockedCount / allTasks.length) * -20;
    const waitingPenalty = (waitingCount / allTasks.length) * -10;

    return Math.max(
      0,
      Math.min(
        100,
        completionScore + progressScore + readinessScore + blockagePenalty + waitingPenalty
      )
    );
  }

  public getFlowIntelligence(): FlowIntelligence {
    return { ...this.flowIntelligence };
  }

  /* ================================ */
  /* QUERY METHODS                    */
  /* ================================ */

  public getTask(taskId: string): TaskNode | undefined {
    return this.tasks.get(taskId);
  }

  public getTasksByStatus(status: TaskStatus): TaskNode[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  public getTasksByTag(tag: string): TaskNode[] {
    return Array.from(this.tasks.values()).filter(t => t.tags.includes(tag));
  }

  public getActiveTasks(): TaskNode[] {
    return Array.from(this.tasks.values()).filter(
      t => t.status === 'in-progress' || t.status === 'paused'
    );
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      tasks: Array.from(this.tasks.values()),
      sequences: Array.from(this.sequences.values()),
      confirmationStates: Array.from(this.confirmationStates.values()),
      flowIntelligence: { ...this.flowIntelligence },
    };
  }

  public getSummary(): string {
    const allTasks = Array.from(this.tasks.values());
    const flow = this.flowIntelligence;
    const prediction = this.predictNextStep();

    const completed = allTasks.filter(t => t.status === 'completed').length;
    const inProgress = allTasks.filter(t => t.status === 'in-progress').length;
    const ready = allTasks.filter(t => t.status === 'ready').length;
    const blocked = allTasks.filter(t => t.status === 'pending').length;
    const waiting = allTasks.filter(t => t.status === 'waiting-confirmation').length;

    return `Task-Awareness Layer Summary:

TASK OVERVIEW:
  Total Tasks: ${allTasks.length}
  Completed: ${completed}
  In Progress: ${inProgress}
  Ready: ${ready}
  Blocked: ${blocked}
  Waiting Confirmation: ${waiting}

FLOW INTELLIGENCE:
  Flow Score: ${flow.flowScore.toFixed(1)}%
  Current Focus: ${flow.currentFocus ? this.tasks.get(flow.currentFocus)?.name : 'None'}
  Next Recommended: ${prediction.predictedTaskId ? this.tasks.get(prediction.predictedTaskId)?.name : 'None'}
  Should Pause: ${flow.shouldPause ? 'Yes' : 'No'}
  Should Proceed: ${flow.shouldProceed ? 'Yes' : 'No'}

SEQUENCES: ${this.sequences.size} active`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.tasks.clear();
    this.sequences.clear();
    this.confirmationStates.clear();

    this.dependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      resolvedOrder: [],
    };

    this.flowIntelligence = {
      currentFocus: null,
      nextRecommended: null,
      blockedTasks: [],
      readyTasks: [],
      waitingConfirmation: [],
      shouldPause: false,
      shouldProceed: true,
      flowScore: 100,
    };
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

      // Restore tasks
      this.tasks.clear();
      for (const task of state.tasks) {
        this.tasks.set(task.taskId, task);
      }

      // Restore sequences
      this.sequences.clear();
      for (const sequence of state.sequences) {
        this.sequences.set(sequence.sequenceId, sequence);
      }

      // Restore confirmation states
      this.confirmationStates.clear();
      for (const confirmState of state.confirmationStates) {
        this.confirmationStates.set(confirmState.taskId, confirmState);
      }

      this.flowIntelligence = state.flowIntelligence;

      // Rebuild dependency graph
      this.updateDependencyGraph();
    } catch (error) {
      console.error('[TaskAwarenessLayer] Import failed:', error);
    }
  }
}
