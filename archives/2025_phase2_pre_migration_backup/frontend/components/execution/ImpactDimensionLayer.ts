/**
 * LEVEL 13.3 — IMPACT DIMENSION LAYER
 * 
 * Tracks WHAT CHANGES tasks will make to the system.
 * 
 * Features:
 * - Change type classification (UI/wiring/config)
 * - Impact level assessment (small/medium/large)
 * - Cascade detection (what else changes)
 * - Rollback complexity estimation
 * 
 * Safety: Read-only impact analysis, NO autonomous execution
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface ImpactedTask {
  taskId: string;
  name: string;
  changeType: ChangeType;
  impactLevel: ImpactLevel;
  affectedAreas: AffectedArea[];
  cascadeEffects: CascadeEffect[];
  rollbackComplexity: number; // 0-100
  impactMetadata: Record<string, any>;
}

type ChangeType = 
  | 'ui'          // UI changes (visual, styling)
  | 'wiring'      // API wiring, connections, data flow
  | 'config'      // Configuration changes
  | 'logic'       // Business logic changes
  | 'storage'     // Database/state changes
  | 'architecture'; // Structural changes

type ImpactLevel = 
  | 'small'       // < 5 files, minimal risk
  | 'medium'      // 5-20 files, moderate risk
  | 'large'       // 20+ files, high risk
  | 'critical';   // Core system changes

interface AffectedArea {
  areaId: string;
  areaType: 'component' | 'module' | 'service' | 'config' | 'database';
  estimatedChanges: number; // Number of lines/files
  criticalityScore: number; // 0-100
}

interface CascadeEffect {
  effectId: string;
  sourceTaskId: string;
  targetArea: string;
  effectType: 'requires-update' | 'breaks-dependency' | 'invalidates-cache';
  severity: 'low' | 'medium' | 'high';
  description: string;
}

interface ImpactMap {
  taskId: string;
  directImpact: string[]; // Directly affected components
  indirectImpact: string[]; // Cascade affected components
  riskScore: number; // 0-100
}

interface RollbackPlan {
  taskId: string;
  complexity: number; // 0-100
  steps: RollbackStep[];
  estimatedTime: number; // milliseconds
  requiresBackup: boolean;
}

interface RollbackStep {
  stepId: string;
  description: string;
  action: 'revert-file' | 'restore-config' | 'rebuild' | 'manual';
  affectedFiles: string[];
  estimatedDuration: number;
}

/* ================================ */
/* IMPACT DIMENSION LAYER           */
/* ================================ */

export class ImpactDimensionLayer {
  private tasks: Map<string, ImpactedTask>;
  private impactMaps: Map<string, ImpactMap>;
  private rollbackPlans: Map<string, RollbackPlan>;
  private cascadeGraph: Map<string, CascadeEffect[]>; // taskId -> cascades

  constructor() {
    this.tasks = new Map();
    this.impactMaps = new Map();
    this.rollbackPlans = new Map();
    this.cascadeGraph = new Map();
  }

  /* ================================ */
  /* TASK REGISTRATION                */
  /* ================================ */

  public registerTask(task: ImpactedTask): void {
    this.tasks.set(task.taskId, task);

    // Generate impact map
    const impactMap = this.generateImpactMap(task);
    this.impactMaps.set(task.taskId, impactMap);

    // Generate rollback plan
    const rollbackPlan = this.generateRollbackPlan(task);
    this.rollbackPlans.set(task.taskId, rollbackPlan);

    // Build cascade graph
    this.cascadeGraph.set(task.taskId, task.cascadeEffects);

    // Analyze cascades
    this.analyzeCascadeEffects(task.taskId);
  }

  /* ================================ */
  /* IMPACT ANALYSIS                  */
  /* ================================ */

  private generateImpactMap(task: ImpactedTask): ImpactMap {
    const directImpact: string[] = [];
    const indirectImpact: string[] = [];

    // Direct impact from affected areas
    for (const area of task.affectedAreas) {
      directImpact.push(area.areaId);
    }

    // Indirect impact from cascade effects
    for (const cascade of task.cascadeEffects) {
      if (!directImpact.includes(cascade.targetArea)) {
        indirectImpact.push(cascade.targetArea);
      }
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(task);

    return {
      taskId: task.taskId,
      directImpact,
      indirectImpact,
      riskScore,
    };
  }

  private calculateRiskScore(task: ImpactedTask): number {
    let risk = 0;

    // Impact level contribution
    switch (task.impactLevel) {
      case 'small':
        risk += 10;
        break;
      case 'medium':
        risk += 30;
        break;
      case 'large':
        risk += 60;
        break;
      case 'critical':
        risk += 90;
        break;
    }

    // Change type contribution
    switch (task.changeType) {
      case 'ui':
        risk += 5;
        break;
      case 'wiring':
        risk += 20;
        break;
      case 'config':
        risk += 15;
        break;
      case 'logic':
        risk += 25;
        break;
      case 'storage':
        risk += 30;
        break;
      case 'architecture':
        risk += 40;
        break;
    }

    // Affected areas contribution
    const criticalAreas = task.affectedAreas.filter(a => a.criticalityScore > 70);
    risk += criticalAreas.length * 10;

    // Cascade effects contribution
    const highSeverityCascades = task.cascadeEffects.filter(c => c.severity === 'high');
    risk += highSeverityCascades.length * 5;

    return Math.max(0, Math.min(100, risk));
  }

  public assessImpactLevel(fileCount: number, criticalityAvg: number): ImpactLevel {
    if (fileCount < 5 && criticalityAvg < 50) return 'small';
    if (fileCount < 20 && criticalityAvg < 70) return 'medium';
    if (fileCount < 50 || criticalityAvg < 90) return 'large';
    return 'critical';
  }

  /* ================================ */
  /* CASCADE ANALYSIS                 */
  /* ================================ */

  private analyzeCascadeEffects(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const visited = new Set<string>();
    const cascades: CascadeEffect[] = [];

    const analyze = (currentTaskId: string, depth: number): void => {
      if (visited.has(currentTaskId) || depth > 5) return;
      visited.add(currentTaskId);

      const effects = this.cascadeGraph.get(currentTaskId) || [];
      for (const effect of effects) {
        cascades.push(effect);

        // Find tasks that target the affected area
        for (const [tId, t] of Array.from(this.tasks.entries())) {
          if (t.affectedAreas.some((a: any) => a.areaId === effect.targetArea)) {
            analyze(tId, depth + 1);
          }
        }
      }
    };

    analyze(taskId, 0);

    // Update task with full cascade chain
    task.cascadeEffects = cascades;
  }

  public getCascadeChain(taskId: string): CascadeEffect[] {
    return this.cascadeGraph.get(taskId) || [];
  }

  public getTotalCascadeImpact(taskId: string): number {
    const cascades = this.getCascadeChain(taskId);
    const highSeverity = cascades.filter(c => c.severity === 'high').length;
    const mediumSeverity = cascades.filter(c => c.severity === 'medium').length;
    const lowSeverity = cascades.filter(c => c.severity === 'low').length;

    return (highSeverity * 10) + (mediumSeverity * 5) + (lowSeverity * 2);
  }

  /* ================================ */
  /* ROLLBACK PLANNING                */
  /* ================================ */

  private generateRollbackPlan(task: ImpactedTask): RollbackPlan {
    const steps: RollbackStep[] = [];
    let totalDuration = 0;

    // Generate steps based on change type
    switch (task.changeType) {
      case 'ui':
        steps.push({
          stepId: 'revert_ui',
          description: 'Revert UI component changes',
          action: 'revert-file',
          affectedFiles: task.affectedAreas.map(a => a.areaId),
          estimatedDuration: 300000, // 5 min
        });
        totalDuration += 300000;
        break;

      case 'wiring':
        steps.push({
          stepId: 'revert_wiring',
          description: 'Revert API wiring changes',
          action: 'revert-file',
          affectedFiles: task.affectedAreas.map(a => a.areaId),
          estimatedDuration: 600000, // 10 min
        });
        steps.push({
          stepId: 'rebuild_connections',
          description: 'Rebuild connection layer',
          action: 'rebuild',
          affectedFiles: [],
          estimatedDuration: 900000, // 15 min
        });
        totalDuration += 1500000;
        break;

      case 'config':
        steps.push({
          stepId: 'restore_config',
          description: 'Restore configuration files',
          action: 'restore-config',
          affectedFiles: task.affectedAreas.map(a => a.areaId),
          estimatedDuration: 180000, // 3 min
        });
        totalDuration += 180000;
        break;

      case 'logic':
        steps.push({
          stepId: 'revert_logic',
          description: 'Revert business logic changes',
          action: 'revert-file',
          affectedFiles: task.affectedAreas.map(a => a.areaId),
          estimatedDuration: 600000, // 10 min
        });
        totalDuration += 600000;
        break;

      case 'storage':
        steps.push({
          stepId: 'manual_rollback',
          description: 'Manual database rollback required',
          action: 'manual',
          affectedFiles: [],
          estimatedDuration: 1800000, // 30 min
        });
        totalDuration += 1800000;
        break;

      case 'architecture':
        steps.push({
          stepId: 'manual_architecture_rollback',
          description: 'Manual architecture rollback required',
          action: 'manual',
          affectedFiles: [],
          estimatedDuration: 3600000, // 1 hour
        });
        totalDuration += 3600000;
        break;
    }

    return {
      taskId: task.taskId,
      complexity: task.rollbackComplexity,
      steps,
      estimatedTime: totalDuration,
      requiresBackup: task.changeType === 'storage' || task.changeType === 'architecture',
    };
  }

  public getRollbackPlan(taskId: string): RollbackPlan | undefined {
    return this.rollbackPlans.get(taskId);
  }

  /* ================================ */
  /* IMPACT COMPARISON                */
  /* ================================ */

  public compareImpacts(taskId1: string, taskId2: string): {
    task1Risk: number;
    task2Risk: number;
    recommendation: string;
  } {
    const map1 = this.impactMaps.get(taskId1);
    const map2 = this.impactMaps.get(taskId2);

    if (!map1 || !map2) {
      return {
        task1Risk: 0,
        task2Risk: 0,
        recommendation: 'Cannot compare - tasks not found',
      };
    }

    const task1Risk = map1.riskScore;
    const task2Risk = map2.riskScore;

    let recommendation = '';
    if (task1Risk < task2Risk) {
      recommendation = `Task 1 has lower risk (${task1Risk} vs ${task2Risk}). Consider executing Task 1 first.`;
    } else if (task2Risk < task1Risk) {
      recommendation = `Task 2 has lower risk (${task2Risk} vs ${task1Risk}). Consider executing Task 2 first.`;
    } else {
      recommendation = `Both tasks have equal risk (${task1Risk}). Check other dimensions for prioritization.`;
    }

    return { task1Risk, task2Risk, recommendation };
  }

  /* ================================ */
  /* QUERY METHODS                    */
  /* ================================ */

  public getTask(taskId: string): ImpactedTask | undefined {
    return this.tasks.get(taskId);
  }

  public getTasksByChangeType(changeType: ChangeType): ImpactedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.changeType === changeType);
  }

  public getTasksByImpactLevel(impactLevel: ImpactLevel): ImpactedTask[] {
    return Array.from(this.tasks.values()).filter(t => t.impactLevel === impactLevel);
  }

  public getHighRiskTasks(threshold: number = 70): ImpactedTask[] {
    return Array.from(this.tasks.values()).filter(t => {
      const map = this.impactMaps.get(t.taskId);
      return map && map.riskScore >= threshold;
    });
  }

  public getLowRiskTasks(threshold: number = 30): ImpactedTask[] {
    return Array.from(this.tasks.values()).filter(t => {
      const map = this.impactMaps.get(t.taskId);
      return map && map.riskScore <= threshold;
    });
  }

  /* ================================ */
  /* SUMMARY                          */
  /* ================================ */

  public getSummary(): string {
    const highRisk = this.getHighRiskTasks();
    const lowRisk = this.getLowRiskTasks();
    const avgRisk = Array.from(this.impactMaps.values()).reduce((sum, map) => sum + map.riskScore, 0) / this.impactMaps.size || 0;

    return `Impact Dimension Layer Summary:

RISK DISTRIBUTION:
  High Risk (≥70): ${highRisk.length}
  Low Risk (≤30): ${lowRisk.length}
  Average Risk: ${avgRisk.toFixed(1)}

CHANGE TYPES:
  UI: ${this.getTasksByChangeType('ui').length}
  Wiring: ${this.getTasksByChangeType('wiring').length}
  Config: ${this.getTasksByChangeType('config').length}
  Logic: ${this.getTasksByChangeType('logic').length}
  Storage: ${this.getTasksByChangeType('storage').length}
  Architecture: ${this.getTasksByChangeType('architecture').length}

IMPACT LEVELS:
  Small: ${this.getTasksByImpactLevel('small').length}
  Medium: ${this.getTasksByImpactLevel('medium').length}
  Large: ${this.getTasksByImpactLevel('large').length}
  Critical: ${this.getTasksByImpactLevel('critical').length}

TOTAL TASKS: ${this.tasks.size}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.tasks.clear();
    this.impactMaps.clear();
    this.rollbackPlans.clear();
    this.cascadeGraph.clear();
  }
}
