/**
 * LEVEL 13.1 — SESSION INTENT LAYER
 * 
 * Understands session goals, user intent, and task objectives.
 * Mid-term context tracking - session-scoped memory.
 * 
 * Features:
 * - Intent detection & classification
 * - Goal tracking & completion
 * - Task state management
 * - Priority-based objective ordering
 * - Session continuity scoring
 * - Multi-turn intent accumulation
 * 
 * Retention: Current session only (cleared on session end)
 * Privacy: No cross-session data retention
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface Intent {
  intentId: string;
  type: IntentType;
  confidence: number; // 0-100
  detectedAt: number;
  resolvedAt: number | null;
  status: 'active' | 'resolved' | 'abandoned';
  description: string;
  relatedTopics: string[];
}

type IntentType =
  | 'question'
  | 'command'
  | 'task'
  | 'exploration'
  | 'clarification'
  | 'feedback'
  | 'navigation'
  | 'configuration';

interface Goal {
  goalId: string;
  title: string;
  description: string;
  priority: number; // 1-10
  progress: number; // 0-100
  startedAt: number;
  completedAt: number | null;
  status: 'active' | 'completed' | 'blocked' | 'cancelled';
  subGoals: string[]; // goal IDs
  relatedIntents: string[]; // intent IDs
}

interface TaskState {
  taskId: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  retryCount: number;
  maxRetries: number;
  dependencies: string[]; // task IDs
}

interface SessionObjective {
  objectiveId: string;
  title: string;
  priority: number; // 1-10
  achievementScore: number; // 0-100
  startedAt: number;
  estimatedCompletion: number | null; // timestamp
  goals: string[]; // goal IDs
}

interface ContinuityScore {
  overall: number; // 0-100
  intentClarity: number; // 0-100
  goalAlignment: number; // 0-100
  taskCompletion: number; // 0-100
}

interface SessionIntentConfig {
  maxActiveIntents: number;
  maxActiveGoals: number;
  intentTimeoutMs: number; // auto-abandon after
  goalTimeoutMs: number; // auto-block after
  confidenceThreshold: number; // minimum to track
}

/* ================================ */
/* SESSION INTENT LAYER             */
/* ================================ */

export class SessionIntentLayer {
  private config: SessionIntentConfig;

  // Intent State
  private intents: Map<string, Intent>;
  private goals: Map<string, Goal>;
  private tasks: Map<string, TaskState>;
  private objectives: Map<string, SessionObjective>;

  // Session Tracking
  private sessionStartTime: number;
  private continuityScore: ContinuityScore;

  constructor(config?: Partial<SessionIntentConfig>) {
    this.config = {
      maxActiveIntents: 10,
      maxActiveGoals: 5,
      intentTimeoutMs: 300000, // 5 minutes
      goalTimeoutMs: 1800000, // 30 minutes
      confidenceThreshold: 60,
      ...config,
    };

    this.intents = new Map();
    this.goals = new Map();
    this.tasks = new Map();
    this.objectives = new Map();

    this.sessionStartTime = Date.now();

    this.continuityScore = {
      overall: 100,
      intentClarity: 100,
      goalAlignment: 100,
      taskCompletion: 100,
    };
  }

  /* ================================ */
  /* INTENT MANAGEMENT                */
  /* ================================ */

  public detectIntent(
    type: IntentType,
    description: string,
    confidence: number = 80,
    relatedTopics: string[] = []
  ): string {
    const now = Date.now();

    const intent: Intent = {
      intentId: `intent_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      confidence: Math.max(0, Math.min(100, confidence)),
      detectedAt: now,
      resolvedAt: null,
      status: 'active',
      description,
      relatedTopics,
    };

    // Only track if confidence meets threshold
    if (intent.confidence < this.config.confidenceThreshold) {
      return intent.intentId;
    }

    this.intents.set(intent.intentId, intent);

    // Prune old intents if exceeding max
    this.pruneIntents();

    // Update continuity
    this.updateContinuity();

    return intent.intentId;
  }

  public resolveIntent(intentId: string): void {
    const intent = this.intents.get(intentId);
    if (!intent) return;

    intent.status = 'resolved';
    intent.resolvedAt = Date.now();

    this.updateContinuity();
  }

  public abandonIntent(intentId: string): void {
    const intent = this.intents.get(intentId);
    if (!intent) return;

    intent.status = 'abandoned';

    this.updateContinuity();
  }

  private pruneIntents(): void {
    const now = Date.now();
    const activeIntents = Array.from(this.intents.values()).filter(i => i.status === 'active');

    // Remove timed-out intents
    const intentsToAbandon: string[] = [];
    for (const intent of activeIntents) {
      const elapsed = now - intent.detectedAt;
      if (elapsed > this.config.intentTimeoutMs) {
        intentsToAbandon.push(intent.intentId);
      }
    }

    for (const intentId of intentsToAbandon) {
      this.abandonIntent(intentId);
    }

    // Remove oldest if exceeding max
    const stillActiveIntents = Array.from(this.intents.values()).filter(i => i.status === 'active');
    if (stillActiveIntents.length > this.config.maxActiveIntents) {
      const sorted = stillActiveIntents.sort((a, b) => a.detectedAt - b.detectedAt);
      const toRemove = sorted.slice(0, stillActiveIntents.length - this.config.maxActiveIntents);

      for (const intent of toRemove) {
        this.abandonIntent(intent.intentId);
      }
    }
  }

  public getActiveIntents(): Intent[] {
    return Array.from(this.intents.values())
      .filter(i => i.status === 'active')
      .sort((a, b) => b.confidence - a.confidence);
  }

  public getIntentsByType(type: IntentType): Intent[] {
    return Array.from(this.intents.values()).filter(i => i.type === type);
  }

  /* ================================ */
  /* GOAL MANAGEMENT                  */
  /* ================================ */

  public addGoal(
    title: string,
    description: string,
    priority: number = 5,
    subGoals: string[] = []
  ): string {
    const now = Date.now();

    const goal: Goal = {
      goalId: `goal_${now}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      priority: Math.max(1, Math.min(10, priority)),
      progress: 0,
      startedAt: now,
      completedAt: null,
      status: 'active',
      subGoals,
      relatedIntents: [],
    };

    this.goals.set(goal.goalId, goal);

    // Prune old goals if exceeding max
    this.pruneGoals();

    // Update continuity
    this.updateContinuity();

    return goal.goalId;
  }

  public updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.progress = Math.max(0, Math.min(100, progress));

    if (goal.progress >= 100) {
      this.completeGoal(goalId);
    }

    this.updateContinuity();
  }

  public completeGoal(goalId: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = 'completed';
    goal.progress = 100;
    goal.completedAt = Date.now();

    this.updateContinuity();
  }

  public blockGoal(goalId: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    goal.status = 'blocked';

    this.updateContinuity();
  }

  public linkIntentToGoal(intentId: string, goalId: string): void {
    const goal = this.goals.get(goalId);
    if (!goal) return;

    if (!goal.relatedIntents.includes(intentId)) {
      goal.relatedIntents.push(intentId);
    }
  }

  private pruneGoals(): void {
    const now = Date.now();
    const activeGoals = Array.from(this.goals.values()).filter(g => g.status === 'active');

    // Block timed-out goals
    for (const goal of activeGoals) {
      const elapsed = now - goal.startedAt;
      if (elapsed > this.config.goalTimeoutMs) {
        this.blockGoal(goal.goalId);
      }
    }

    // Remove oldest completed/cancelled if exceeding max
    const stillActiveGoals = Array.from(this.goals.values()).filter(g => g.status === 'active');
    if (stillActiveGoals.length > this.config.maxActiveGoals) {
      const sorted = stillActiveGoals.sort((a, b) => a.priority - b.priority);
      const toCancel = sorted.slice(0, stillActiveGoals.length - this.config.maxActiveGoals);

      for (const goal of toCancel) {
        goal.status = 'cancelled';
      }
    }
  }

  public getActiveGoals(): Goal[] {
    return Array.from(this.goals.values())
      .filter(g => g.status === 'active')
      .sort((a, b) => b.priority - a.priority);
  }

  public getGoalsByPriority(minPriority: number = 5): Goal[] {
    return this.getActiveGoals().filter(g => g.priority >= minPriority);
  }

  /* ================================ */
  /* TASK MANAGEMENT                  */
  /* ================================ */

  public addTask(
    name: string,
    dependencies: string[] = [],
    maxRetries: number = 3
  ): string {
    const now = Date.now();

    const task: TaskState = {
      taskId: `task_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      retryCount: 0,
      maxRetries,
      dependencies,
    };

    this.tasks.set(task.taskId, task);

    this.updateContinuity();

    return task.taskId;
  }

  public startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Check dependencies
    const canStart = task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep && dep.status === 'completed';
    });

    if (canStart) {
      task.status = 'in-progress';
      task.updatedAt = Date.now();
    }

    this.updateContinuity();
  }

  public completeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.completedAt = Date.now();
    task.updatedAt = Date.now();

    this.updateContinuity();
  }

  public failTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.retryCount++;

    if (task.retryCount >= task.maxRetries) {
      task.status = 'failed';
    } else {
      task.status = 'pending';
    }

    task.updatedAt = Date.now();

    this.updateContinuity();
  }

  public getTasks(): TaskState[] {
    return Array.from(this.tasks.values());
  }

  public getTasksByStatus(status: TaskState['status']): TaskState[] {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  /* ================================ */
  /* OBJECTIVE MANAGEMENT             */
  /* ================================ */

  public addObjective(
    title: string,
    priority: number = 5,
    goals: string[] = []
  ): string {
    const now = Date.now();

    const objective: SessionObjective = {
      objectiveId: `objective_${now}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      priority: Math.max(1, Math.min(10, priority)),
      achievementScore: 0,
      startedAt: now,
      estimatedCompletion: null,
      goals,
    };

    this.objectives.set(objective.objectiveId, objective);

    return objective.objectiveId;
  }

  public updateObjectiveAchievement(objectiveId: string): void {
    const objective = this.objectives.get(objectiveId);
    if (!objective) return;

    // Calculate achievement based on goal progress
    const goalObjects = objective.goals.map(gid => this.goals.get(gid)).filter(Boolean) as Goal[];

    if (goalObjects.length === 0) {
      objective.achievementScore = 0;
      return;
    }

    const totalProgress = goalObjects.reduce((sum, g) => sum + g.progress, 0);
    objective.achievementScore = totalProgress / goalObjects.length;
  }

  public getObjectives(): SessionObjective[] {
    return Array.from(this.objectives.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /* ================================ */
  /* CONTINUITY TRACKING              */
  /* ================================ */

  private updateContinuity(): void {
    // Intent clarity: ratio of active high-confidence intents
    const allIntents = Array.from(this.intents.values());
    const activeIntents = allIntents.filter(i => i.status === 'active');
    const highConfidenceIntents = activeIntents.filter(i => i.confidence >= 80);

    const intentClarity = activeIntents.length > 0
      ? (highConfidenceIntents.length / activeIntents.length) * 100
      : 100;

    // Goal alignment: ratio of active goals with progress
    const allGoals = Array.from(this.goals.values());
    const activeGoals = allGoals.filter(g => g.status === 'active');
    const progressingGoals = activeGoals.filter(g => g.progress > 0);

    const goalAlignment = activeGoals.length > 0
      ? (progressingGoals.length / activeGoals.length) * 100
      : 100;

    // Task completion: ratio of completed tasks
    const allTasks = Array.from(this.tasks.values());
    const completedTasks = allTasks.filter(t => t.status === 'completed');

    const taskCompletion = allTasks.length > 0
      ? (completedTasks.length / allTasks.length) * 100
      : 100;

    // Overall continuity
    const overall = (intentClarity + goalAlignment + taskCompletion) / 3;

    this.continuityScore = {
      overall,
      intentClarity,
      goalAlignment,
      taskCompletion,
    };
  }

  public getContinuityScore(): ContinuityScore {
    return { ...this.continuityScore };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      intents: Array.from(this.intents.values()),
      goals: Array.from(this.goals.values()),
      tasks: Array.from(this.tasks.values()),
      objectives: Array.from(this.objectives.values()),
      sessionStartTime: this.sessionStartTime,
      continuityScore: { ...this.continuityScore },
    };
  }

  public getSummary(): string {
    const activeIntents = this.getActiveIntents();
    const activeGoals = this.getActiveGoals();
    const pendingTasks = this.getTasksByStatus('pending');
    const inProgressTasks = this.getTasksByStatus('in-progress');
    const continuity = this.continuityScore;

    return `Session Intent Layer Summary:
  Active Intents: ${activeIntents.length}
  Active Goals: ${activeGoals.length}
  Pending Tasks: ${pendingTasks.length}
  In-Progress Tasks: ${inProgressTasks.length}
  Objectives: ${this.objectives.size}
  Overall Continuity: ${continuity.overall.toFixed(1)}%
  Intent Clarity: ${continuity.intentClarity.toFixed(1)}%
  Goal Alignment: ${continuity.goalAlignment.toFixed(1)}%
  Task Completion: ${continuity.taskCompletion.toFixed(1)}%`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.intents.clear();
    this.goals.clear();
    this.tasks.clear();
    this.objectives.clear();

    this.sessionStartTime = Date.now();

    this.continuityScore = {
      overall: 100,
      intentClarity: 100,
      goalAlignment: 100,
      taskCompletion: 100,
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
      this.sessionStartTime = state.sessionStartTime;
      this.continuityScore = state.continuityScore;

      // Restore maps
      this.intents.clear();
      for (const intent of state.intents) {
        this.intents.set(intent.intentId, intent);
      }

      this.goals.clear();
      for (const goal of state.goals) {
        this.goals.set(goal.goalId, goal);
      }

      this.tasks.clear();
      for (const task of state.tasks) {
        this.tasks.set(task.taskId, task);
      }

      this.objectives.clear();
      for (const objective of state.objectives) {
        this.objectives.set(objective.objectiveId, objective);
      }
    } catch (error) {
      console.error('[SessionIntentLayer] Import failed:', error);
    }
  }
}
