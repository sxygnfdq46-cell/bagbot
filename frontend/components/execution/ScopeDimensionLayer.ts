/**
 * LEVEL 13.3 — SCOPE DIMENSION LAYER
 * 
 * Tracks WHERE tasks execute in the system architecture.
 * 
 * Features:
 * - System part targeting (frontend/backend/worker)
 * - Layer detection (visual/logic/connection)
 * - Subsystem mapping
 * - Conflict detection (frontend vs backend work)
 * 
 * Safety: Read-only scope analysis, NO autonomous execution
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface ScopedTask {
  taskId: string;
  name: string;
  systemPart: SystemPart;
  layer: Layer;
  subsystems: string[]; // Which subsystems are affected
  affectedFiles: string[];
  scopeMetadata: Record<string, any>;
}

type SystemPart = 
  | 'frontend'
  | 'backend'
  | 'worker'
  | 'shared'
  | 'config';

type Layer = 
  | 'visual'      // UI components, styling
  | 'logic'       // Business logic, algorithms
  | 'connection'  // API calls, data flow
  | 'storage'     // Database, state management
  | 'config';     // Configuration files

interface ScopeMapping {
  taskId: string;
  scopeVector: ScopeVector;
}

interface ScopeVector {
  frontend: number;   // 0-100
  backend: number;    // 0-100
  worker: number;     // 0-100
  visual: number;     // 0-100
  logic: number;      // 0-100
  connection: number; // 0-100
}

interface ScopeConflict {
  conflictId: string;
  taskIds: string[];
  conflictType: 'cross-layer' | 'cross-system' | 'subsystem-collision';
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

interface SubsystemRegistry {
  subsystemId: string;
  name: string;
  systemPart: SystemPart;
  layer: Layer;
  activeTasks: string[];
  status: 'available' | 'busy' | 'locked';
}

/* ================================ */
/* SCOPE DIMENSION LAYER            */
/* ================================ */

export class ScopeDimensionLayer {
  private tasks: Map<string, ScopedTask>;
  private scopeMappings: Map<string, ScopeMapping>;
  private subsystemRegistry: Map<string, SubsystemRegistry>;
  private conflicts: ScopeConflict[];

  constructor() {
    this.tasks = new Map();
    this.scopeMappings = new Map();
    this.subsystemRegistry = new Map();
    this.conflicts = [];

    this.initializeSubsystems();
  }

  /* ================================ */
  /* INITIALIZATION                   */
  /* ================================ */

  private initializeSubsystems(): void {
    const defaultSubsystems: SubsystemRegistry[] = [
      {
        subsystemId: 'ui-components',
        name: 'UI Components',
        systemPart: 'frontend',
        layer: 'visual',
        activeTasks: [],
        status: 'available',
      },
      {
        subsystemId: 'business-logic',
        name: 'Business Logic',
        systemPart: 'backend',
        layer: 'logic',
        activeTasks: [],
        status: 'available',
      },
      {
        subsystemId: 'api-layer',
        name: 'API Layer',
        systemPart: 'backend',
        layer: 'connection',
        activeTasks: [],
        status: 'available',
      },
      {
        subsystemId: 'state-management',
        name: 'State Management',
        systemPart: 'frontend',
        layer: 'storage',
        activeTasks: [],
        status: 'available',
      },
      {
        subsystemId: 'worker-tasks',
        name: 'Worker Tasks',
        systemPart: 'worker',
        layer: 'logic',
        activeTasks: [],
        status: 'available',
      },
    ];

    for (const subsystem of defaultSubsystems) {
      this.subsystemRegistry.set(subsystem.subsystemId, subsystem);
    }
  }

  /* ================================ */
  /* TASK REGISTRATION                */
  /* ================================ */

  public registerTask(task: ScopedTask): void {
    this.tasks.set(task.taskId, task);

    // Generate scope vector
    const scopeVector = this.generateScopeVector(task);
    this.scopeMappings.set(task.taskId, {
      taskId: task.taskId,
      scopeVector,
    });

    // Update subsystem status
    for (const subsystemId of task.subsystems) {
      const subsystem = this.subsystemRegistry.get(subsystemId);
      if (subsystem) {
        subsystem.activeTasks.push(task.taskId);
        subsystem.status = 'busy';
      }
    }

    // Detect conflicts
    this.detectScopeConflicts();
  }

  private generateScopeVector(task: ScopedTask): ScopeVector {
    const vector: ScopeVector = {
      frontend: 0,
      backend: 0,
      worker: 0,
      visual: 0,
      logic: 0,
      connection: 0,
    };

    // System part weights
    switch (task.systemPart) {
      case 'frontend':
        vector.frontend = 100;
        break;
      case 'backend':
        vector.backend = 100;
        break;
      case 'worker':
        vector.worker = 100;
        break;
      case 'shared':
        vector.frontend = 50;
        vector.backend = 50;
        break;
      case 'config':
        vector.frontend = 33;
        vector.backend = 33;
        vector.worker = 33;
        break;
    }

    // Layer weights
    switch (task.layer) {
      case 'visual':
        vector.visual = 100;
        break;
      case 'logic':
        vector.logic = 100;
        break;
      case 'connection':
        vector.connection = 100;
        break;
      case 'storage':
        vector.logic = 50;
        vector.connection = 50;
        break;
      case 'config':
        vector.visual = 33;
        vector.logic = 33;
        vector.connection = 33;
        break;
    }

    return vector;
  }

  /* ================================ */
  /* SCOPE ANALYSIS                   */
  /* ================================ */

  public analyzeScopeCompatibility(taskId1: string, taskId2: string): number {
    const scope1 = this.scopeMappings.get(taskId1);
    const scope2 = this.scopeMappings.get(taskId2);

    if (!scope1 || !scope2) return 0;

    // Calculate vector similarity (0-100)
    const v1 = scope1.scopeVector;
    const v2 = scope2.scopeVector;

    const dotProduct = 
      v1.frontend * v2.frontend +
      v1.backend * v2.backend +
      v1.worker * v2.worker +
      v1.visual * v2.visual +
      v1.logic * v2.logic +
      v1.connection * v2.connection;

    const magnitude1 = Math.sqrt(
      v1.frontend ** 2 + v1.backend ** 2 + v1.worker ** 2 +
      v1.visual ** 2 + v1.logic ** 2 + v1.connection ** 2
    );

    const magnitude2 = Math.sqrt(
      v2.frontend ** 2 + v2.backend ** 2 + v2.worker ** 2 +
      v2.visual ** 2 + v2.logic ** 2 + v2.connection ** 2
    );

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    const similarity = (dotProduct / (magnitude1 * magnitude2)) * 100;

    return Math.max(0, Math.min(100, similarity));
  }

  public getTasksBySystemPart(systemPart: SystemPart): ScopedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.systemPart === systemPart);
  }

  public getTasksByLayer(layer: Layer): ScopedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.layer === layer);
  }

  public getTasksBySubsystem(subsystemId: string): ScopedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.subsystems.includes(subsystemId));
  }

  /* ================================ */
  /* CONFLICT DETECTION               */
  /* ================================ */

  private detectScopeConflicts(): void {
    const conflicts: ScopeConflict[] = [];

    // Cross-layer conflict detection (e.g., visual + connection in same subsystem)
    for (const [subsystemId, subsystem] of Array.from(this.subsystemRegistry.entries())) {
      if (subsystem.activeTasks.length > 1) {
        const tasks = subsystem.activeTasks.map((id: string) => this.tasks.get(id)!);
        const layers = new Set(tasks.map((t: ScopedTask) => t.layer));

        if (layers.size > 1 && layers.has('visual') && layers.has('connection')) {
          conflicts.push({
            conflictId: `cross_layer_${subsystemId}`,
            taskIds: subsystem.activeTasks,
            conflictType: 'cross-layer',
            severity: 'medium',
            reason: `Subsystem ${subsystem.name} has tasks across visual and connection layers`,
          });
        }
      }
    }

    // Check for cross-system conflicts (e.g., frontend + backend modifying same file)
    const fileGroups = new Map<string, string[]>();
    for (const task of Array.from(this.tasks.values())) {
      for (const file of task.affectedFiles) {
        if (!fileGroups.has(file)) {
          fileGroups.set(file, []);
        }
        fileGroups.get(file)!.push(task.taskId);
      }
    }

    for (const [file, taskIds] of Array.from(fileGroups.entries())) {
      if (taskIds.length > 1) {
        const tasks = taskIds.map((id: string) => this.tasks.get(id)!);
        const systemParts = new Set(tasks.map((t: ScopedTask) => t.systemPart));

        if (systemParts.size > 1) {
          conflicts.push({
            conflictId: `cross_system_${file}`,
            taskIds,
            conflictType: 'cross-system',
            severity: 'high',
            reason: `File ${file} is being modified by tasks in different system parts`,
          });
        }
      }
    }

    // Check for subsystem collisions (multiple tasks in locked subsystem)
    for (const [subsystemId, subsystem] of Array.from(this.subsystemRegistry.entries())) {
      if (subsystem.status === 'locked' && subsystem.activeTasks.length > 0) {
        conflicts.push({
          conflictId: `subsystem_locked_${subsystemId}`,
          taskIds: subsystem.activeTasks,
          conflictType: 'subsystem-collision',
          severity: 'high',
          reason: `Subsystem ${subsystem.name} is locked but has active tasks`,
        });
      }
    }

    this.conflicts = conflicts;
  }

  public getConflicts(): ScopeConflict[] {
    return [...this.conflicts];
  }

  /* ================================ */
  /* SUBSYSTEM MANAGEMENT             */
  /* ================================ */

  public registerSubsystem(subsystem: SubsystemRegistry): void {
    this.subsystemRegistry.set(subsystem.subsystemId, subsystem);
  }

  public lockSubsystem(subsystemId: string): boolean {
    const subsystem = this.subsystemRegistry.get(subsystemId);
    if (!subsystem) return false;

    subsystem.status = 'locked';
    return true;
  }

  public unlockSubsystem(subsystemId: string): boolean {
    const subsystem = this.subsystemRegistry.get(subsystemId);
    if (!subsystem) return false;

    subsystem.status = subsystem.activeTasks.length > 0 ? 'busy' : 'available';
    return true;
  }

  public completeTaskInSubsystem(taskId: string, subsystemId: string): void {
    const subsystem = this.subsystemRegistry.get(subsystemId);
    if (!subsystem) return;

    subsystem.activeTasks = subsystem.activeTasks.filter(id => id !== taskId);

    if (subsystem.activeTasks.length === 0 && subsystem.status !== 'locked') {
      subsystem.status = 'available';
    }
  }

  public getSubsystem(subsystemId: string): SubsystemRegistry | undefined {
    return this.subsystemRegistry.get(subsystemId);
  }

  public getAvailableSubsystems(): SubsystemRegistry[] {
    return Array.from(this.subsystemRegistry.values()).filter(s => s.status === 'available');
  }

  /* ================================ */
  /* ISOLATION CHECKING               */
  /* ================================ */

  public canIsolateTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Check if task's subsystems are available
    for (const subsystemId of task.subsystems) {
      const subsystem = this.subsystemRegistry.get(subsystemId);
      if (!subsystem || subsystem.status === 'locked') {
        return false;
      }
    }

    // Check if there are conflicts
    const taskConflicts = this.conflicts.filter(c => c.taskIds.includes(taskId));
    return taskConflicts.length === 0;
  }

  public getIsolationScore(taskId: string): number {
    const task = this.tasks.get(taskId);
    if (!task) return 0;

    let score = 100;

    // Deduct for busy subsystems
    const busySubsystems = task.subsystems.filter(id => {
      const subsystem = this.subsystemRegistry.get(id);
      return subsystem && subsystem.status === 'busy';
    });

    score -= busySubsystems.length * 10;

    // Deduct for conflicts
    const taskConflicts = this.conflicts.filter(c => c.taskIds.includes(taskId));
    score -= taskConflicts.length * 20;

    // Deduct for shared system parts
    if (task.systemPart === 'shared') score -= 15;
    if (task.systemPart === 'config') score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /* ================================ */
  /* SUMMARY                          */
  /* ================================ */

  public getSummary(): string {
    const frontendTasks = this.getTasksBySystemPart('frontend');
    const backendTasks = this.getTasksBySystemPart('backend');
    const workerTasks = this.getTasksBySystemPart('worker');
    const availableSubsystems = this.getAvailableSubsystems();

    return `Scope Dimension Layer Summary:

SYSTEM PARTS:
  Frontend: ${frontendTasks.length}
  Backend: ${backendTasks.length}
  Worker: ${workerTasks.length}
  Total: ${this.tasks.size}

SUBSYSTEMS:
  Available: ${availableSubsystems.length}
  Busy: ${Array.from(this.subsystemRegistry.values()).filter(s => s.status === 'busy').length}
  Locked: ${Array.from(this.subsystemRegistry.values()).filter(s => s.status === 'locked').length}

CONFLICTS: ${this.conflicts.length}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.tasks.clear();
    this.scopeMappings.clear();
    this.conflicts = [];

    // Reset subsystems
    for (const subsystem of Array.from(this.subsystemRegistry.values())) {
      subsystem.activeTasks = [];
      subsystem.status = 'available';
    }
  }
}
