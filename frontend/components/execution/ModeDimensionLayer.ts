/**
 * LEVEL 13.3 — MODE DIMENSION LAYER
 * 
 * Tracks HOW tasks execute across different operational modes.
 * 
 * Features:
 * - Execution mode detection (build/integration/display/diagnostics)
 * - Mode transitions
 * - Mode-specific constraints
 * - Mode history tracking
 * 
 * Safety: Read-only mode analysis, NO autonomous execution
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface ModedTask {
  taskId: string;
  name: string;
  executionMode: ExecutionMode;
  allowedModes: ExecutionMode[];
  modeRequirements: ModeRequirement[];
  modeMetadata: Record<string, any>;
}

type ExecutionMode = 
  | 'build'         // Building new features
  | 'integration'   // Integrating components
  | 'display'       // Displaying/visualizing
  | 'diagnostics'   // Debugging/analyzing
  | 'maintenance'   // Cleanup/optimization
  | 'safe';         // Safe mode (restricted)

interface ModeRequirement {
  requirementId: string;
  mode: ExecutionMode;
  condition: string;
  satisfied: boolean;
}

interface ModeTransition {
  transitionId: string;
  fromMode: ExecutionMode;
  toMode: ExecutionMode;
  timestamp: number;
  trigger: string;
  allowed: boolean;
  reason: string | null;
}

interface ModeConstraint {
  constraintId: string;
  mode: ExecutionMode;
  constraintType: 'requires' | 'forbids' | 'limits';
  target: string;
  description: string;
}

interface ModeState {
  currentMode: ExecutionMode;
  previousMode: ExecutionMode | null;
  modeHistory: ModeTransition[];
  activeConstraints: ModeConstraint[];
  lastTransition: number;
}

/* ================================ */
/* MODE DIMENSION LAYER             */
/* ================================ */

export class ModeDimensionLayer {
  private tasks: Map<string, ModedTask>;
  private modeState: ModeState;
  private modeConstraints: Map<ExecutionMode, ModeConstraint[]>;
  private transitionRules: Map<string, boolean>; // fromMode_toMode -> allowed

  constructor() {
    this.tasks = new Map();
    this.modeConstraints = new Map();
    this.transitionRules = new Map();

    this.modeState = {
      currentMode: 'safe',
      previousMode: null,
      modeHistory: [],
      activeConstraints: [],
      lastTransition: Date.now(),
    };

    this.initializeModeConstraints();
    this.initializeTransitionRules();
  }

  /* ================================ */
  /* INITIALIZATION                   */
  /* ================================ */

  private initializeModeConstraints(): void {
    // Build mode constraints
    this.modeConstraints.set('build', [
      {
        constraintId: 'build_1',
        mode: 'build',
        constraintType: 'requires',
        target: 'user-confirmation',
        description: 'Build mode requires user confirmation for destructive operations',
      },
      {
        constraintId: 'build_2',
        mode: 'build',
        constraintType: 'forbids',
        target: 'autonomous-execution',
        description: 'Build mode forbids autonomous execution',
      },
    ]);

    // Integration mode constraints
    this.modeConstraints.set('integration', [
      {
        constraintId: 'integration_1',
        mode: 'integration',
        constraintType: 'requires',
        target: 'dependency-check',
        description: 'Integration mode requires dependency checking',
      },
      {
        constraintId: 'integration_2',
        mode: 'integration',
        constraintType: 'limits',
        target: 'concurrent-tasks',
        description: 'Integration mode limits concurrent tasks to prevent conflicts',
      },
    ]);

    // Display mode constraints
    this.modeConstraints.set('display', [
      {
        constraintId: 'display_1',
        mode: 'display',
        constraintType: 'forbids',
        target: 'data-modification',
        description: 'Display mode forbids data modification',
      },
    ]);

    // Diagnostics mode constraints
    this.modeConstraints.set('diagnostics', [
      {
        constraintId: 'diagnostics_1',
        mode: 'diagnostics',
        constraintType: 'requires',
        target: 'logging',
        description: 'Diagnostics mode requires comprehensive logging',
      },
    ]);

    // Safe mode constraints
    this.modeConstraints.set('safe', [
      {
        constraintId: 'safe_1',
        mode: 'safe',
        constraintType: 'forbids',
        target: 'all-modifications',
        description: 'Safe mode forbids all modifications',
      },
      {
        constraintId: 'safe_2',
        mode: 'safe',
        constraintType: 'limits',
        target: 'operations',
        description: 'Safe mode limits to read-only operations',
      },
    ]);
  }

  private initializeTransitionRules(): void {
    const modes: ExecutionMode[] = ['build', 'integration', 'display', 'diagnostics', 'maintenance', 'safe'];

    // Allow all transitions TO safe mode
    for (const from of modes) {
      this.transitionRules.set(`${from}_safe`, true);
    }

    // Allow transitions FROM safe mode to any other mode
    for (const to of modes) {
      if (to !== 'safe') {
        this.transitionRules.set(`safe_${to}`, true);
      }
    }

    // Define specific allowed transitions
    const allowedTransitions = [
      ['build', 'integration'],
      ['build', 'diagnostics'],
      ['integration', 'build'],
      ['integration', 'diagnostics'],
      ['integration', 'display'],
      ['display', 'diagnostics'],
      ['diagnostics', 'build'],
      ['diagnostics', 'integration'],
      ['maintenance', 'build'],
      ['maintenance', 'diagnostics'],
    ];

    for (const [from, to] of allowedTransitions) {
      this.transitionRules.set(`${from}_${to}`, true);
    }
  }

  /* ================================ */
  /* TASK REGISTRATION                */
  /* ================================ */

  public registerTask(task: ModedTask): void {
    this.tasks.set(task.taskId, task);

    // Validate task against current mode
    this.validateTaskMode(task.taskId);
  }

  private validateTaskMode(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Check if task is allowed in current mode
    if (!task.allowedModes.includes(this.modeState.currentMode)) {
      console.warn(
        `[ModeDimensionLayer] Task ${task.name} not allowed in mode ${this.modeState.currentMode}`
      );
      return false;
    }

    // Check mode requirements
    for (const req of task.modeRequirements) {
      if (req.mode === this.modeState.currentMode && !req.satisfied) {
        console.warn(
          `[ModeDimensionLayer] Task ${task.name} has unsatisfied requirement: ${req.condition}`
        );
        return false;
      }
    }

    return true;
  }

  /* ================================ */
  /* MODE MANAGEMENT                  */
  /* ================================ */

  public transitionMode(toMode: ExecutionMode, trigger: string): boolean {
    const fromMode = this.modeState.currentMode;

    // Check if transition is allowed
    const transitionKey = `${fromMode}_${toMode}`;
    const allowed = this.transitionRules.get(transitionKey) === true;

    const transition: ModeTransition = {
      transitionId: `trans_${Date.now()}`,
      fromMode,
      toMode,
      timestamp: Date.now(),
      trigger,
      allowed,
      reason: allowed ? null : `Transition from ${fromMode} to ${toMode} is not allowed`,
    };

    this.modeState.modeHistory.push(transition);

    if (!allowed) {
      return false;
    }

    // Execute transition
    this.modeState.previousMode = fromMode;
    this.modeState.currentMode = toMode;
    this.modeState.lastTransition = Date.now();

    // Update active constraints
    this.modeState.activeConstraints = this.modeConstraints.get(toMode) || [];

    return true;
  }

  public getCurrentMode(): ExecutionMode {
    return this.modeState.currentMode;
  }

  public canTransitionTo(toMode: ExecutionMode): boolean {
    const transitionKey = `${this.modeState.currentMode}_${toMode}`;
    return this.transitionRules.get(transitionKey) === true;
  }

  public getModeHistory(limit: number = 10): ModeTransition[] {
    return this.modeState.modeHistory.slice(-limit);
  }

  /* ================================ */
  /* CONSTRAINT MANAGEMENT            */
  /* ================================ */

  public getActiveConstraints(): ModeConstraint[] {
    return [...this.modeState.activeConstraints];
  }

  public checkConstraint(constraintType: 'requires' | 'forbids' | 'limits', target: string): boolean {
    const constraints = this.modeState.activeConstraints.filter(
      c => c.constraintType === constraintType && c.target === target
    );

    if (constraintType === 'forbids') {
      return constraints.length === 0; // Returns true if NOT forbidden
    }

    if (constraintType === 'requires') {
      // Would need additional logic to verify requirement is met
      return true;
    }

    if (constraintType === 'limits') {
      // Would need additional logic to check if within limits
      return true;
    }

    return true;
  }

  public isOperationAllowed(operation: string): boolean {
    // Check if current mode forbids this operation
    const forbidConstraints = this.modeState.activeConstraints.filter(
      c => c.constraintType === 'forbids'
    );

    for (const constraint of forbidConstraints) {
      if (operation.includes(constraint.target) || constraint.target === 'all-modifications') {
        return false;
      }
    }

    return true;
  }

  /* ================================ */
  /* TASK MODE ANALYSIS               */
  /* ================================ */

  public getTasksByMode(mode: ExecutionMode): ModedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.executionMode === mode);
  }

  public getTasksAllowedInMode(mode: ExecutionMode): ModedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.allowedModes.includes(mode));
  }

  public getTasksNotAllowedInCurrentMode(): ModedTask[] {
    return Array.from(this.tasks.values()).filter(
      t => !t.allowedModes.includes(this.modeState.currentMode)
    );
  }

  public getCompatibilityScore(taskId: string, mode: ExecutionMode): number {
    const task = this.tasks.get(taskId);
    if (!task) return 0;

    let score = 0;

    // Base score if mode is allowed
    if (task.allowedModes.includes(mode)) {
      score += 50;
    }

    // Add score if it's the primary execution mode
    if (task.executionMode === mode) {
      score += 30;
    }

    // Add score for satisfied requirements
    const modeReqs = task.modeRequirements.filter(r => r.mode === mode);
    const satisfiedReqs = modeReqs.filter(r => r.satisfied);
    if (modeReqs.length > 0) {
      score += (satisfiedReqs.length / modeReqs.length) * 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /* ================================ */
  /* MODE RECOMMENDATIONS             */
  /* ================================ */

  public recommendModeForTask(taskId: string): ExecutionMode | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    // Primary execution mode is the recommendation
    return task.executionMode;
  }

  public recommendModeTransition(): ExecutionMode | null {
    const currentTasks = Array.from(this.tasks.values());

    // Count tasks by mode
    const modeCounts = new Map<ExecutionMode, number>();
    for (const task of currentTasks) {
      modeCounts.set(task.executionMode, (modeCounts.get(task.executionMode) || 0) + 1);
    }

    // Find mode with most tasks
    let maxCount = 0;
    let recommendedMode: ExecutionMode | null = null;

    for (const [mode, count] of Array.from(modeCounts.entries())) {
      if (count > maxCount && this.canTransitionTo(mode)) {
        maxCount = count;
        recommendedMode = mode;
      }
    }

    return recommendedMode;
  }

  /* ================================ */
  /* SUMMARY                          */
  /* ================================ */

  public getSummary(): string {
    const buildTasks = this.getTasksByMode('build');
    const integrationTasks = this.getTasksByMode('integration');
    const displayTasks = this.getTasksByMode('display');
    const diagnosticsTasks = this.getTasksByMode('diagnostics');
    const notAllowed = this.getTasksNotAllowedInCurrentMode();

    return `Mode Dimension Layer Summary:

CURRENT MODE: ${this.modeState.currentMode}
PREVIOUS MODE: ${this.modeState.previousMode || 'None'}

ACTIVE CONSTRAINTS: ${this.modeState.activeConstraints.length}

TASKS BY MODE:
  Build: ${buildTasks.length}
  Integration: ${integrationTasks.length}
  Display: ${displayTasks.length}
  Diagnostics: ${diagnosticsTasks.length}

TASKS NOT ALLOWED IN CURRENT MODE: ${notAllowed.length}

MODE TRANSITIONS: ${this.modeState.modeHistory.length}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.tasks.clear();
    this.modeState = {
      currentMode: 'safe',
      previousMode: null,
      modeHistory: [],
      activeConstraints: [],
      lastTransition: Date.now(),
    };
  }
}
