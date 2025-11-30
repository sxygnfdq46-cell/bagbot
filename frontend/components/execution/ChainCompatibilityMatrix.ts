/**
 * LEVEL 13.4 — MULTI-COMMAND EXECUTION NETWORK
 * Component 3/8: ChainCompatibilityMatrix.ts
 * 
 * Purpose: Ensures tasks CAN coexist in a chain
 * - Combines 4D vectors
 * - Calculates chain risk
 * - Detects destructive or incompatible combinations
 */

import { TaskNode } from './TaskNode';

/* ================================ */
/* TYPES                            */
/* ================================ */

export interface CompatibilityScore {
  taskId1: string;
  taskId2: string;
  overallCompatibility: number;      // 0-100 (higher = more compatible)
  timeCompatibility: number;         // 0-100
  scopeCompatibility: number;        // 0-100
  impactCompatibility: number;       // 0-100
  modeCompatibility: number;         // 0-100
  canCoexist: boolean;               // Overall verdict
  warnings: string[];
}

export interface ChainCompatibility {
  taskIds: string[];
  overallRisk: number;               // 0-100 (higher = riskier)
  pairwiseScores: CompatibilityScore[];
  harmonicsScore: number;            // 0-100 (how well tasks work together)
  safetyRating: 'safe' | 'unsafe' | 'needs-review';
  recommendations: string[];
  blockers: string[];
}

export interface ImpactHarmonics {
  constructive: string[];            // Tasks that amplify each other positively
  destructive: string[];             // Tasks that conflict
  neutral: string[];                 // Independent tasks
  cascadeChains: string[][];         // Chains of cascading effects
}

/* ================================ */
/* CHAIN COMPATIBILITY MATRIX       */
/* ================================ */

export class ChainCompatibilityMatrix {
  private compatibilityCache: Map<string, CompatibilityScore>;

  constructor() {
    this.compatibilityCache = new Map();
  }

  /* ================================ */
  /* PAIRWISE COMPATIBILITY           */
  /* ================================ */

  public calculatePairwiseCompatibility(task1: TaskNode, task2: TaskNode): CompatibilityScore {
    const cacheKey = `${task1.taskId}_${task2.taskId}`;
    
    if (this.compatibilityCache.has(cacheKey)) {
      return this.compatibilityCache.get(cacheKey)!;
    }

    const warnings: string[] = [];

    // Time compatibility (can they run in sequence/parallel?)
    const timeCompatibility = this.calculateTimeCompatibility(task1, task2, warnings);

    // Scope compatibility (do they affect same areas?)
    const scopeCompatibility = this.calculateScopeCompatibility(task1, task2, warnings);

    // Impact compatibility (do changes conflict?)
    const impactCompatibility = this.calculateImpactCompatibility(task1, task2, warnings);

    // Mode compatibility (compatible execution modes?)
    const modeCompatibility = this.calculateModeCompatibility(task1, task2, warnings);

    // Overall compatibility (weighted average)
    const overallCompatibility = (
      timeCompatibility * 0.3 +
      scopeCompatibility * 0.3 +
      impactCompatibility * 0.25 +
      modeCompatibility * 0.15
    );

    const canCoexist = overallCompatibility >= 60 && warnings.filter(w => w.includes('CRITICAL')).length === 0;

    const score: CompatibilityScore = {
      taskId1: task1.taskId,
      taskId2: task2.taskId,
      overallCompatibility,
      timeCompatibility,
      scopeCompatibility,
      impactCompatibility,
      modeCompatibility,
      canCoexist,
      warnings,
    };

    this.compatibilityCache.set(cacheKey, score);
    return score;
  }

  private calculateTimeCompatibility(task1: TaskNode, task2: TaskNode, warnings: string[]): number {
    let score = 100;

    // Check if there's a dependency relationship
    if (task1.time.dependencies.includes(task2.taskId)) {
      // task1 depends on task2 - compatible (task2 runs first)
      score = 100;
    } else if (task2.time.dependencies.includes(task1.taskId)) {
      // task2 depends on task1 - compatible (task1 runs first)
      score = 100;
    } else if (task1.time.canRunInParallel && task2.time.canRunInParallel) {
      // Both can run in parallel - good compatibility
      score = 90;
    } else {
      // Must run sequentially but no dependency - moderate compatibility
      score = 70;
    }

    // Check deadlines
    if (task1.time.deadline && task2.time.deadline) {
      const deadline1 = task1.time.deadline;
      const deadline2 = task2.time.deadline;
      
      if (Math.abs(deadline1 - deadline2) < 3600000) { // Within 1 hour
        warnings.push('Tasks have close deadlines - may cause scheduling pressure');
        score -= 10;
      }
    }

    // Check execution order conflicts
    if (task1.time.executionOrder === task2.time.executionOrder) {
      warnings.push('CRITICAL: Tasks have same execution order');
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateScopeCompatibility(task1: TaskNode, task2: TaskNode, warnings: string[]): number {
    let score = 100;

    // Calculate cosine similarity of scope vectors
    const v1 = task1.scope.scopeVector;
    const v2 = task2.scope.scopeVector;
    
    const dotProduct = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
    
    const cosineSimilarity = mag1 * mag2 > 0 ? dotProduct / (mag1 * mag2) : 0;
    const similarityScore = cosineSimilarity * 100;

    // High similarity can be good or bad depending on context
    if (similarityScore > 80) {
      // Very similar scope - could be good (complementary) or bad (conflicting)
      
      // Check if affecting same files
      const commonFiles = task1.scope.affectedFiles.filter(f => 
        task2.scope.affectedFiles.includes(f)
      );
      
      if (commonFiles.length > 0) {
        warnings.push(`CRITICAL: Tasks modify same files: ${commonFiles.join(', ')}`);
        score -= 40;
      }
      
      // Check if same subsystems
      const commonSubsystems = task1.scope.subsystems.filter(s => 
        task2.scope.subsystems.includes(s)
      );
      
      if (commonSubsystems.length > 0) {
        warnings.push(`Tasks affect same subsystems: ${commonSubsystems.join(', ')}`);
        score -= 15;
      }
    } else if (similarityScore < 20) {
      // Very different scope - probably safe
      score = 95;
    } else {
      // Moderate similarity
      score = 80;
    }

    // Check system part conflicts
    if (task1.scope.systemPart === task2.scope.systemPart && 
        task1.scope.layer === task2.scope.layer) {
      warnings.push('Tasks affect same system part and layer');
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateImpactCompatibility(task1: TaskNode, task2: TaskNode, warnings: string[]): number {
    let score = 100;

    // Check if impacts are destructive to each other
    const risk1 = task1.impact.riskScore;
    const risk2 = task2.impact.riskScore;
    
    // High risk tasks together are concerning
    if (risk1 > 70 && risk2 > 70) {
      warnings.push('CRITICAL: Both tasks are high-risk');
      score -= 30;
    }

    // Check cascade effects between tasks
    const cascadesTo2 = task1.impact.cascadeEffects.some(c => 
      c.targetTaskId === task2.taskId
    );
    const cascadesTo1 = task2.impact.cascadeEffects.some(c => 
      c.targetTaskId === task1.taskId
    );

    if (cascadesTo2 || cascadesTo1) {
      if (cascadesTo2 && cascadesTo1) {
        warnings.push('CRITICAL: Tasks have mutual cascade effects');
        score -= 40;
      } else {
        warnings.push('Tasks have cascade relationship');
        score -= 15;
      }
    }

    // Check if change types are compatible
    const incompatiblePairs: Array<[string, string]> = [
      ['architecture', 'ui'],        // Don't mix structural with visual
      ['storage', 'ui'],             // Don't mix data layer with visual
      ['architecture', 'config'],    // Don't mix structural with config
    ];

    for (const [type1, type2] of incompatiblePairs) {
      if ((task1.impact.changeType === type1 && task2.impact.changeType === type2) ||
          (task1.impact.changeType === type2 && task2.impact.changeType === type1)) {
        warnings.push(`Incompatible change types: ${type1} + ${type2}`);
        score -= 20;
      }
    }

    // Check rollback complexity
    if (task1.impact.rollbackComplexity > 70 && task2.impact.rollbackComplexity > 70) {
      warnings.push('Both tasks have complex rollback - risky combination');
      score -= 15;
    }

    // Check reversibility
    if (!task1.impact.reversible || !task2.impact.reversible) {
      warnings.push('One or both tasks are irreversible');
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateModeCompatibility(task1: TaskNode, task2: TaskNode, warnings: string[]): number {
    let score = 100;

    // Check if modes are compatible
    const mode1 = task1.mode.executionMode;
    const mode2 = task2.mode.executionMode;

    if (mode1 === mode2) {
      score = 100; // Same mode - perfect
    } else {
      // Check if modes are allowed together
      const incompatibleModes: Array<[string, string]> = [
        ['safe', 'build'],           // Safe mode shouldn't mix with build
        ['diagnostics', 'build'],    // Don't mix debugging with building
        ['display', 'build'],        // Don't mix visualization with building
      ];

      for (const [m1, m2] of incompatibleModes) {
        if ((mode1 === m1 && mode2 === m2) || (mode1 === m2 && mode2 === m1)) {
          warnings.push(`Incompatible execution modes: ${m1} + ${m2}`);
          score -= 25;
        }
      }
    }

    // Check if mode transitions are needed
    if (task1.mode.transitionRequired || task2.mode.transitionRequired) {
      warnings.push('Mode transitions required');
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  /* ================================ */
  /* CHAIN COMPATIBILITY              */
  /* ================================ */

  public calculateChainCompatibility(tasks: TaskNode[]): ChainCompatibility {
    const taskIds = tasks.map(t => t.taskId);
    const pairwiseScores: CompatibilityScore[] = [];
    const warnings: string[] = [];
    const blockers: string[] = [];

    // Calculate all pairwise compatibilities
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const score = this.calculatePairwiseCompatibility(tasks[i], tasks[j]);
        pairwiseScores.push(score);

        if (!score.canCoexist) {
          blockers.push(`Tasks ${tasks[i].name} and ${tasks[j].name} cannot coexist`);
        }
      }
    }

    // Calculate overall risk (average of pairwise risks)
    const avgCompatibility = pairwiseScores.reduce((sum, s) => sum + s.overallCompatibility, 0) / 
                             (pairwiseScores.length || 1);
    const overallRisk = 100 - avgCompatibility;

    // Calculate harmonics (how well tasks work together)
    const harmonics = this.calculateImpactHarmonics(tasks);
    const harmonicsScore = this.calculateHarmonicsScore(harmonics, tasks.length);

    // Determine safety rating
    let safetyRating: 'safe' | 'unsafe' | 'needs-review';
    if (blockers.length > 0 || overallRisk > 70) {
      safetyRating = 'unsafe';
    } else if (overallRisk > 40 || harmonicsScore < 60) {
      safetyRating = 'needs-review';
    } else {
      safetyRating = 'safe';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (harmonics.destructive.length > 0) {
      recommendations.push(`Separate destructive task pairs: ${harmonics.destructive.join(', ')}`);
    }
    
    if (harmonics.constructive.length > 0) {
      recommendations.push(`Group constructive tasks together: ${harmonics.constructive.join(', ')}`);
    }
    
    if (overallRisk > 50) {
      recommendations.push('Consider breaking chain into smaller segments');
    }
    
    const highRiskTasks = tasks.filter(t => t.impact.riskScore > 70);
    if (highRiskTasks.length > 1) {
      recommendations.push('Execute high-risk tasks sequentially with validation between');
    }

    return {
      taskIds,
      overallRisk,
      pairwiseScores,
      harmonicsScore,
      safetyRating,
      recommendations,
      blockers,
    };
  }

  /* ================================ */
  /* IMPACT HARMONICS                 */
  /* ================================ */

  private calculateImpactHarmonics(tasks: TaskNode[]): ImpactHarmonics {
    const constructive: string[] = [];
    const destructive: string[] = [];
    const neutral: string[] = [];
    const cascadeChains: string[][] = [];

    // Analyze pairwise relationships
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const task1 = tasks[i];
        const task2 = tasks[j];
        const pairKey = `${task1.name} + ${task2.name}`;

        // Check for constructive relationship (complementary)
        const complementary = this.areComplementary(task1, task2);
        if (complementary) {
          constructive.push(pairKey);
        }

        // Check for destructive relationship (conflicting)
        const conflicting = this.areConflicting(task1, task2);
        if (conflicting) {
          destructive.push(pairKey);
        }

        // Check for neutral relationship
        if (!complementary && !conflicting) {
          neutral.push(pairKey);
        }
      }
    }

    // Build cascade chains
    for (const task of tasks) {
      const chain = this.buildCascadeChain(task, tasks);
      if (chain.length > 1) {
        cascadeChains.push(chain);
      }
    }

    return {
      constructive,
      destructive,
      neutral,
      cascadeChains,
    };
  }

  private areComplementary(task1: TaskNode, task2: TaskNode): boolean {
    // Tasks are complementary if:
    // 1. They affect different layers of same subsystem (e.g., visual + logic)
    // 2. One prepares for the other (e.g., wiring before ui)
    // 3. They have cascade relationship in correct direction

    const sameSubsystem = task1.scope.subsystems.some(s => task2.scope.subsystems.includes(s));
    const differentLayers = task1.scope.layer !== task2.scope.layer;

    if (sameSubsystem && differentLayers) {
      // Check if they're in natural order (e.g., logic before visual)
      const naturalOrder = ['storage', 'logic', 'connection', 'visual', 'config'];
      const idx1 = naturalOrder.indexOf(task1.scope.layer);
      const idx2 = naturalOrder.indexOf(task2.scope.layer);
      
      if (idx1 < idx2 && task1.time.executionOrder < task2.time.executionOrder) {
        return true;
      }
    }

    return false;
  }

  private areConflicting(task1: TaskNode, task2: TaskNode): boolean {
    // Tasks are conflicting if:
    // 1. They modify same files
    // 2. They have mutual cascade effects
    // 3. They're both high-risk in same area

    const commonFiles = task1.scope.affectedFiles.filter(f => 
      task2.scope.affectedFiles.includes(f)
    );

    if (commonFiles.length > 0) return true;

    const cascadesTo2 = task1.impact.cascadeEffects.some(c => c.targetTaskId === task2.taskId);
    const cascadesTo1 = task2.impact.cascadeEffects.some(c => c.targetTaskId === task1.taskId);

    if (cascadesTo2 && cascadesTo1) return true;

    if (task1.impact.riskScore > 70 && task2.impact.riskScore > 70) {
      const commonAreas = task1.impact.affectedAreas.filter(a1 => 
        task2.impact.affectedAreas.some(a2 => a1.areaId === a2.areaId)
      );
      if (commonAreas.length > 0) return true;
    }

    return false;
  }

  private buildCascadeChain(task: TaskNode, allTasks: TaskNode[]): string[] {
    const chain: string[] = [task.name];
    const visited = new Set<string>([task.taskId]);

    let current = task;
    while (true) {
      const nextCascade = current.impact.cascadeEffects.find(c => 
        c.targetTaskId && !visited.has(c.targetTaskId)
      );

      if (!nextCascade || !nextCascade.targetTaskId) break;

      const nextTask = allTasks.find(t => t.taskId === nextCascade.targetTaskId);
      if (!nextTask) break;

      chain.push(nextTask.name);
      visited.add(nextTask.taskId);
      current = nextTask;
    }

    return chain;
  }

  private calculateHarmonicsScore(harmonics: ImpactHarmonics, totalPairs: number): number {
    let score = 100;

    // Penalize for destructive relationships
    const destructiveRatio = harmonics.destructive.length / totalPairs;
    score -= destructiveRatio * 50;

    // Bonus for constructive relationships
    const constructiveRatio = harmonics.constructive.length / totalPairs;
    score += constructiveRatio * 20;

    // Penalize for long cascade chains (risk amplification)
    const longChains = harmonics.cascadeChains.filter(c => c.length > 3).length;
    score -= longChains * 10;

    return Math.max(0, Math.min(100, score));
  }

  /* ================================ */
  /* UTILITIES                        */
  /* ================================ */

  public clearCache(): void {
    this.compatibilityCache.clear();
  }
}
