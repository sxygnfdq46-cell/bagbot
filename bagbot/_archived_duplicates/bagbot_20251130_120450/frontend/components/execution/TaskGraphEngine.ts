/**
 * LEVEL 13.4 — MULTI-COMMAND EXECUTION NETWORK
 * Component 2/8: TaskGraphEngine.ts
 * 
 * Purpose: Build complete task graph
 * - Create branches, chains, loops
 * - Prevent cycles
 * - Validate 4D conflict resolution
 * - Build orchestrated task map
 */

import { TaskNode, TaskConflict, ConflictType } from './TaskNode';
import { DimensionalExecutionPathing } from './DimensionalExecutionPathing';

/* ================================ */
/* TYPES                            */
/* ================================ */

export interface TaskGraph {
  nodes: Map<string, TaskNode>;
  edges: Map<string, string[]>;      // taskId -> [dependent task IDs]
  reverseEdges: Map<string, string[]>; // taskId -> [dependency task IDs]
  roots: string[];                    // Tasks with no dependencies
  leaves: string[];                   // Tasks with no dependents
  layers: string[][];                 // Topologically sorted layers
  cycles: string[][];                 // Detected cycles
}

export interface GraphStatistics {
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
  avgFanOut: number;
  avgFanIn: number;
  parallelizableGroups: string[][];
  criticalPath: string[];
  totalEstimatedDuration: number;
  conflicts: TaskConflict[];
}

/* ================================ */
/* TASK GRAPH ENGINE                */
/* ================================ */

export class TaskGraphEngine {
  private graph: TaskGraph;
  private depEngine: DimensionalExecutionPathing;
  
  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      reverseEdges: new Map(),
      roots: [],
      leaves: [],
      layers: [],
      cycles: [],
    };
    this.depEngine = new DimensionalExecutionPathing();
  }

  /* ================================ */
  /* GRAPH CONSTRUCTION               */
  /* ================================ */

  public addTask(task: TaskNode): void {
    this.graph.nodes.set(task.taskId, task);
    this.graph.edges.set(task.taskId, []);
    this.graph.reverseEdges.set(task.taskId, []);
    
    // Register in 4D engine
    this.depEngine.registerTask({
      taskId: task.taskId,
      name: task.name,
      description: task.metadata.description,
      
      // Time dimension
      executionOrder: task.time.executionOrder,
      dependencies: task.time.dependencies,
      waitForSignal: task.time.waitForSignal,
      estimatedDuration: task.time.estimatedDuration,
      
      // Scope dimension
      systemPart: task.scope.systemPart,
      layer: task.scope.layer,
      subsystems: task.scope.subsystems,
      affectedFiles: task.scope.affectedFiles,
      
      // Impact dimension
      changeType: task.impact.changeType,
      impactLevel: task.impact.impactLevel,
      affectedAreas: task.impact.affectedAreas,
      cascadeEffects: task.impact.cascadeEffects.map(c => ({
        effectId: c.effectId,
        sourceTaskId: task.taskId,
        targetArea: c.targetTaskId || 'unknown',
        effectType: c.effectType,
        severity: c.severity,
        description: `${c.effectType} effect on ${c.targetTaskId || 'unknown'}`,
      })),
      rollbackComplexity: task.impact.rollbackComplexity,
      
      // Mode dimension
      executionMode: task.mode.executionMode,
      allowedModes: task.mode.allowedModes,
      modeRequirements: task.mode.modeRequirements,
      
      metadata: task.metadata,
    });
  }

  public addDependency(fromTaskId: string, toTaskId: string): boolean {
    // fromTask depends on toTask (toTask must complete before fromTask)
    
    if (!this.graph.nodes.has(fromTaskId) || !this.graph.nodes.has(toTaskId)) {
      console.warn(`Cannot add dependency: Task not found`);
      return false;
    }
    
    // Check if this would create a cycle
    if (this.wouldCreateCycle(fromTaskId, toTaskId)) {
      console.warn(`Cannot add dependency: Would create cycle`);
      return false;
    }
    
    // Add edge (toTask -> fromTask in forward direction)
    const toEdges = this.graph.edges.get(toTaskId) || [];
    if (!toEdges.includes(fromTaskId)) {
      toEdges.push(fromTaskId);
      this.graph.edges.set(toTaskId, toEdges);
    }
    
    // Add reverse edge (fromTask <- toTask)
    const fromReverseEdges = this.graph.reverseEdges.get(fromTaskId) || [];
    if (!fromReverseEdges.includes(toTaskId)) {
      fromReverseEdges.push(toTaskId);
      this.graph.reverseEdges.set(fromTaskId, fromReverseEdges);
    }
    
    // Update task node dependencies
    const fromTask = this.graph.nodes.get(fromTaskId)!;
    if (!fromTask.time.dependencies.includes(toTaskId)) {
      fromTask.time.dependencies.push(toTaskId);
    }
    if (!fromTask.dependencies.parentTasks.includes(toTaskId)) {
      fromTask.dependencies.parentTasks.push(toTaskId);
    }
    
    const toTask = this.graph.nodes.get(toTaskId)!;
    if (!toTask.time.dependents.includes(fromTaskId)) {
      toTask.time.dependents.push(fromTaskId);
    }
    if (!toTask.dependencies.childTasks.includes(fromTaskId)) {
      toTask.dependencies.childTasks.push(fromTaskId);
    }
    
    return true;
  }

  /* ================================ */
  /* CYCLE DETECTION                  */
  /* ================================ */

  private wouldCreateCycle(fromTaskId: string, toTaskId: string): boolean {
    // Check if adding edge (toTask -> fromTask) would create cycle
    // This happens if there's already a path from fromTask to toTask
    return this.hasPath(fromTaskId, toTaskId);
  }

  private hasPath(fromTaskId: string, toTaskId: string): boolean {
    const visited = new Set<string>();
    const queue: string[] = [fromTaskId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === toTaskId) {
        return true; // Path found
      }
      
      if (visited.has(current)) continue;
      visited.add(current);
      
      const dependents = this.graph.edges.get(current) || [];
      queue.push(...dependents);
    }
    
    return false;
  }

  public detectCycles(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (taskId: string, path: string[]): void => {
      if (visiting.has(taskId)) {
        // Cycle detected
        const cycleStart = path.indexOf(taskId);
        cycles.push(path.slice(cycleStart).concat(taskId));
        return;
      }
      
      if (visited.has(taskId)) return;
      
      visiting.add(taskId);
      path.push(taskId);
      
      const dependents = this.graph.edges.get(taskId) || [];
      for (const dependent of dependents) {
        visit(dependent, [...path]);
      }
      
      visiting.delete(taskId);
      visited.add(taskId);
    };
    
    for (const taskId of Array.from(this.graph.nodes.keys())) {
      if (!visited.has(taskId)) {
        visit(taskId, []);
      }
    }
    
    this.graph.cycles = cycles;
    return cycles;
  }

  /* ================================ */
  /* TOPOLOGICAL ORDERING             */
  /* ================================ */

  public buildTopologicalLayers(): string[][] {
    const layers: string[][] = [];
    const inDegree = new Map<string, number>();
    
    // Calculate in-degree for each node
    for (const taskId of Array.from(this.graph.nodes.keys())) {
      const dependencies = this.graph.reverseEdges.get(taskId) || [];
      inDegree.set(taskId, dependencies.length);
    }
    
    // Process nodes layer by layer
    while (inDegree.size > 0) {
      const currentLayer: string[] = [];
      
      // Find all nodes with in-degree 0
      for (const [taskId, degree] of Array.from(inDegree.entries())) {
        if (degree === 0) {
          currentLayer.push(taskId);
        }
      }
      
      if (currentLayer.length === 0) {
        // No nodes with in-degree 0 means there's a cycle
        console.warn('Cannot build topological layers: Cycle detected');
        break;
      }
      
      // Remove these nodes and update in-degrees
      for (const taskId of currentLayer) {
        inDegree.delete(taskId);
        
        const dependents = this.graph.edges.get(taskId) || [];
        for (const dependent of dependents) {
          const currentDegree = inDegree.get(dependent) || 0;
          inDegree.set(dependent, currentDegree - 1);
        }
      }
      
      layers.push(currentLayer);
    }
    
    this.graph.layers = layers;
    return layers;
  }

  /* ================================ */
  /* 4D CONFLICT VALIDATION           */
  /* ================================ */

  public validate4DConflicts(): TaskConflict[] {
    const conflicts: TaskConflict[] = [];
    
    // Use DimensionalExecutionPathing to detect conflicts
    const allTaskIds = Array.from(this.graph.nodes.keys());
    const path = this.depEngine.generateExecutionPath(allTaskIds);
    
    // Add conflicts to task nodes
    for (const conflict of path.conflicts) {
      const taskConflict = {
        conflictId: conflict.conflictId,
        conflictType: conflict.dimension as 'temporal' | 'scope' | 'impact' | 'mode' | 'resource',
        severity: conflict.severity,
        conflictingTaskIds: conflict.taskIds,
        description: conflict.description,
        resolution: conflict.resolution,
        canProceed: conflict.severity !== 'critical',
      };
      
      for (const taskId of conflict.taskIds) {
        const task = this.graph.nodes.get(taskId);
        if (task) {
          task.addConflict(taskConflict);
        }
      }
      conflicts.push(taskConflict);
    }
    
    return conflicts;
  }

  /* ================================ */
  /* GRAPH ANALYSIS                   */
  /* ================================ */

  public identifyRoots(): string[] {
    const roots: string[] = [];
    
    for (const [taskId, dependencies] of Array.from(this.graph.reverseEdges.entries())) {
      if (dependencies.length === 0) {
        roots.push(taskId);
      }
    }
    
    this.graph.roots = roots;
    return roots;
  }

  public identifyLeaves(): string[] {
    const leaves: string[] = [];
    
    for (const [taskId, dependents] of Array.from(this.graph.edges.entries())) {
      if (dependents.length === 0) {
        leaves.push(taskId);
      }
    }
    
    this.graph.leaves = leaves;
    return leaves;
  }

  public calculateDependencyDepth(taskId: string): number {
    let maxDepth = 0;
    const visited = new Set<string>();
    
    const visit = (id: string, depth: number): void => {
      if (visited.has(id)) return;
      visited.add(id);
      
      maxDepth = Math.max(maxDepth, depth);
      
      const dependencies = this.graph.reverseEdges.get(id) || [];
      for (const depId of dependencies) {
        visit(depId, depth + 1);
      }
    };
    
    visit(taskId, 0);
    
    const task = this.graph.nodes.get(taskId);
    if (task) {
      task.dependencies.dependencyDepth = maxDepth;
    }
    
    return maxDepth;
  }

  public buildTransitiveClosure(): void {
    // Build ancestor and descendant relationships
    for (const taskId of Array.from(this.graph.nodes.keys())) {
      const task = this.graph.nodes.get(taskId)!;
      
      // Build ancestors (all tasks this depends on)
      const ancestors = new Set<string>();
      const queue: string[] = [...task.time.dependencies];
      
      while (queue.length > 0) {
        const depId = queue.shift()!;
        if (ancestors.has(depId)) continue;
        ancestors.add(depId);
        
        const depTask = this.graph.nodes.get(depId);
        if (depTask) {
          queue.push(...depTask.time.dependencies);
        }
      }
      
      task.dependencies.ancestorTasks = Array.from(ancestors);
      
      // Build descendants (all tasks that depend on this)
      const descendants = new Set<string>();
      const queue2: string[] = [...task.time.dependents];
      
      while (queue2.length > 0) {
        const depId = queue2.shift()!;
        if (descendants.has(depId)) continue;
        descendants.add(depId);
        
        const depTask = this.graph.nodes.get(depId);
        if (depTask) {
          queue2.push(...depTask.time.dependents);
        }
      }
      
      task.dependencies.descendantTasks = Array.from(descendants);
      
      // Calculate fan-in and fan-out
      task.dependencies.fanIn = task.time.dependencies.length;
      task.dependencies.fanOut = task.time.dependents.length;
    }
  }

  /* ================================ */
  /* STATISTICS                       */
  /* ================================ */

  public getStatistics(): GraphStatistics {
    const nodes = Array.from(this.graph.nodes.values());
    const edges = Array.from(this.graph.edges.values()).flat();
    
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    
    const depths = nodes.map(n => n.dependencies.dependencyDepth);
    const maxDepth = Math.max(...depths, 0);
    
    const fanOuts = nodes.map(n => n.dependencies.fanOut);
    const avgFanOut = fanOuts.reduce((sum, f) => sum + f, 0) / totalNodes || 0;
    
    const fanIns = nodes.map(n => n.dependencies.fanIn);
    const avgFanIn = fanIns.reduce((sum, f) => sum + f, 0) / totalNodes || 0;
    
    const parallelizableGroups = this.graph.layers;
    
    const criticalPath = this.findCriticalPath();
    
    const totalEstimatedDuration = nodes.reduce((sum, n) => sum + n.time.estimatedDuration, 0);
    
    const conflicts = Array.from(this.graph.nodes.values())
      .flatMap(n => n.conflicts);
    
    return {
      totalNodes,
      totalEdges,
      maxDepth,
      avgFanOut,
      avgFanIn,
      parallelizableGroups,
      criticalPath,
      totalEstimatedDuration,
      conflicts,
    };
  }

  private findCriticalPath(): string[] {
    // Find longest path from roots to leaves
    let longestPath: string[] = [];
    let maxDuration = 0;
    
    for (const rootId of this.graph.roots) {
      const path = this.findLongestPathFrom(rootId);
      const duration = path.reduce((sum, id) => {
        const task = this.graph.nodes.get(id);
        return sum + (task?.time.estimatedDuration || 0);
      }, 0);
      
      if (duration > maxDuration) {
        maxDuration = duration;
        longestPath = path;
      }
    }
    
    return longestPath;
  }

  private findLongestPathFrom(taskId: string): string[] {
    const task = this.graph.nodes.get(taskId);
    if (!task) return [];
    
    const dependents = this.graph.edges.get(taskId) || [];
    
    if (dependents.length === 0) {
      return [taskId];
    }
    
    let longestPath: string[] = [];
    let maxDuration = 0;
    
    for (const dependentId of dependents) {
      const path = this.findLongestPathFrom(dependentId);
      const duration = path.reduce((sum, id) => {
        const t = this.graph.nodes.get(id);
        return sum + (t?.time.estimatedDuration || 0);
      }, 0);
      
      if (duration > maxDuration) {
        maxDuration = duration;
        longestPath = path;
      }
    }
    
    return [taskId, ...longestPath];
  }

  /* ================================ */
  /* PRIORITY NORMALIZATION           */
  /* ================================ */

  public normalizePriorities(): void {
    // Assign priorities based on graph structure
    for (const taskId of Array.from(this.graph.nodes.keys())) {
      const task = this.graph.nodes.get(taskId)!;
      
      // Priority factors:
      // 1. Dependency depth (deeper = higher priority)
      // 2. Fan-out (more dependents = higher priority)
      // 3. Risk score (higher risk = higher priority for review)
      // 4. Critical path membership
      
      let priorityScore = 0;
      
      priorityScore += task.dependencies.dependencyDepth * 10;
      priorityScore += task.dependencies.fanOut * 5;
      priorityScore += task.impact.riskScore * 0.5;
      
      const criticalPath = this.findCriticalPath();
      if (criticalPath.includes(taskId)) {
        priorityScore += 50;
      }
      
      // Map score to priority
      if (priorityScore >= 80) task.priority = 'critical';
      else if (priorityScore >= 50) task.priority = 'high';
      else if (priorityScore >= 20) task.priority = 'medium';
      else task.priority = 'low';
    }
  }

  /* ================================ */
  /* GRAPH ACCESS                     */
  /* ================================ */

  public getGraph(): TaskGraph {
    return this.graph;
  }

  public getTask(taskId: string): TaskNode | undefined {
    return this.graph.nodes.get(taskId);
  }

  public getAllTasks(): TaskNode[] {
    return Array.from(this.graph.nodes.values());
  }

  public clear(): void {
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      reverseEdges: new Map(),
      roots: [],
      leaves: [],
      layers: [],
      cycles: [],
    };
    this.depEngine.clear();
  }
}
