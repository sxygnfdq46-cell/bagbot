/**
 * LEVEL 13.4 — MULTI-COMMAND EXECUTION NETWORK
 * Component 4/8: SequentialFlowPlanner.ts
 * 
 * Purpose: Creates the final ordered execution plan
 * - Groups tasks by dependency
 * - Detects bottlenecks or missing prerequisites
 * - Produces a topological 4D timeline
 */

import { TaskNode } from './TaskNode';
import { TaskGraphEngine } from './TaskGraphEngine';
import { ChainCompatibilityMatrix } from './ChainCompatibilityMatrix';

/* ================================ */
/* TYPES                            */
/* ================================ */

export interface ExecutionStage {
  stageId: string;
  stageName: string;
  taskIds: string[];
  executionMode: 'sequential' | 'parallel';
  estimatedDuration: number;
  canProceed: boolean;
  prerequisites: string[];          // Stage IDs that must complete first
  blockers: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ExecutionPlan {
  planId: string;
  stages: ExecutionStage[];
  totalDuration: number;
  criticalPath: string[];
  bottlenecks: string[];
  parallelizationOpportunities: string[][];
  overallRisk: number;               // 0-100
  canExecute: boolean;
  recommendations: string[];
}

export interface LoadBalanceAnalysis {
  stageId: string;
  taskCount: number;
  totalDuration: number;
  avgDuration: number;
  variance: number;
  isBottleneck: boolean;
  recommendations: string[];
}

/* ================================ */
/* SEQUENTIAL FLOW PLANNER          */
/* ================================ */

export class SequentialFlowPlanner {
  private graphEngine: TaskGraphEngine;
  private compatibilityMatrix: ChainCompatibilityMatrix;

  constructor(graphEngine: TaskGraphEngine) {
    this.graphEngine = graphEngine;
    this.compatibilityMatrix = new ChainCompatibilityMatrix();
  }

  /* ================================ */
  /* EXECUTION PLAN GENERATION        */
  /* ================================ */

  public generateExecutionPlan(): ExecutionPlan {
    const planId = `plan_${Date.now()}`;
    
    // Build topological layers
    const layers = this.graphEngine.buildTopologicalLayers();
    
    // Convert layers to stages
    const stages: ExecutionStage[] = [];
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const tasks = layer.map(id => this.graphEngine.getTask(id)!).filter(Boolean);
      
      if (tasks.length === 0) continue;
      
      const stage = this.createStage(i, tasks, stages);
      stages.push(stage);
    }
    
    // Calculate total duration (sequential execution of stages)
    const totalDuration = stages.reduce((sum, s) => sum + s.estimatedDuration, 0);
    
    // Find critical path
    const stats = this.graphEngine.getStatistics();
    const criticalPath = stats.criticalPath;
    
    // Detect bottlenecks
    const bottlenecks = this.detectBottlenecks(stages);
    
    // Find parallelization opportunities
    const parallelizationOpportunities = this.findParallelizationOpportunities(stages);
    
    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(stages);
    
    // Check if plan can execute
    const canExecute = stages.every(s => s.canProceed) && bottlenecks.length === 0;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(stages, bottlenecks, parallelizationOpportunities, overallRisk);
    
    return {
      planId,
      stages,
      totalDuration,
      criticalPath,
      bottlenecks,
      parallelizationOpportunities,
      overallRisk,
      canExecute,
      recommendations,
    };
  }

  /* ================================ */
  /* STAGE CREATION                   */
  /* ================================ */

  private createStage(index: number, tasks: TaskNode[], previousStages: ExecutionStage[]): ExecutionStage {
    const stageId = `stage_${index + 1}`;
    const stageName = `Stage ${index + 1}: ${this.generateStageName(tasks)}`;
    const taskIds = tasks.map(t => t.taskId);
    
    // Determine execution mode (sequential vs parallel)
    const executionMode = this.determineExecutionMode(tasks);
    
    // Calculate estimated duration
    const estimatedDuration = executionMode === 'parallel'
      ? Math.max(...tasks.map(t => t.time.estimatedDuration))
      : tasks.reduce((sum, t) => sum + t.time.estimatedDuration, 0);
    
    // Find prerequisites (previous stages)
    const prerequisites = this.findPrerequisites(tasks, previousStages);
    
    // Check if stage can proceed
    const compatibility = this.compatibilityMatrix.calculateChainCompatibility(tasks);
    const canProceed = compatibility.safetyRating !== 'unsafe' && 
                       tasks.every(t => t.readiness.overallReady);
    
    // Collect blockers
    const blockers: string[] = [];
    if (!canProceed) {
      if (compatibility.safetyRating === 'unsafe') {
        blockers.push(...compatibility.blockers);
      }
      const notReadyTasks = tasks.filter(t => !t.readiness.overallReady);
      for (const task of notReadyTasks) {
        blockers.push(`${task.name}: ${task.readiness.blockers.join(', ')}`);
      }
    }
    
    // Calculate risk level
    const riskLevel = this.calculateStageRiskLevel(tasks, compatibility);
    
    return {
      stageId,
      stageName,
      taskIds,
      executionMode,
      estimatedDuration,
      canProceed,
      prerequisites,
      blockers,
      riskLevel,
    };
  }

  private generateStageName(tasks: TaskNode[]): string {
    // Generate descriptive name based on task types
    const changeTypes = new Set(tasks.map(t => t.impact.changeType));
    const systemParts = new Set(tasks.map(t => t.scope.systemPart));
    
    if (changeTypes.size === 1) {
      const type = Array.from(changeTypes)[0];
      return `${type.charAt(0).toUpperCase() + type.slice(1)} Changes`;
    }
    
    if (systemParts.size === 1) {
      const part = Array.from(systemParts)[0];
      return `${part.charAt(0).toUpperCase() + part.slice(1)} Updates`;
    }
    
    return `Mixed Operations (${tasks.length} tasks)`;
  }

  private determineExecutionMode(tasks: TaskNode[]): 'sequential' | 'parallel' {
    // Can run in parallel if:
    // 1. All tasks allow parallel execution
    // 2. No shared resources
    // 3. No file conflicts
    // 4. Compatible scopes
    
    const allAllowParallel = tasks.every(t => t.time.canRunInParallel);
    if (!allAllowParallel) return 'sequential';
    
    // Check for file conflicts
    const allFiles = tasks.flatMap(t => t.scope.affectedFiles);
    const uniqueFiles = new Set(allFiles);
    if (allFiles.length !== uniqueFiles.size) return 'sequential'; // Duplicate files
    
    // Check for subsystem conflicts
    const allSubsystems = tasks.flatMap(t => t.scope.subsystems);
    const uniqueSubsystems = new Set(allSubsystems);
    if (allSubsystems.length !== uniqueSubsystems.size) {
      // Multiple tasks affecting same subsystem - be cautious
      return 'sequential';
    }
    
    return 'parallel';
  }

  private findPrerequisites(tasks: TaskNode[], previousStages: ExecutionStage[]): string[] {
    const prerequisites: string[] = [];
    
    for (const task of tasks) {
      for (const depId of task.time.dependencies) {
        // Find which stage contains this dependency
        const stage = previousStages.find(s => s.taskIds.includes(depId));
        if (stage && !prerequisites.includes(stage.stageId)) {
          prerequisites.push(stage.stageId);
        }
      }
    }
    
    return prerequisites;
  }

  private calculateStageRiskLevel(tasks: TaskNode[], compatibility: any): 'low' | 'medium' | 'high' | 'critical' {
    const avgRisk = tasks.reduce((sum, t) => sum + t.impact.riskScore, 0) / tasks.length;
    
    if (compatibility.safetyRating === 'unsafe' || avgRisk > 80) return 'critical';
    if (compatibility.safetyRating === 'needs-review' || avgRisk > 60) return 'high';
    if (avgRisk > 40) return 'medium';
    return 'low';
  }

  /* ================================ */
  /* BOTTLENECK DETECTION             */
  /* ================================ */

  private detectBottlenecks(stages: ExecutionStage[]): string[] {
    const bottlenecks: string[] = [];
    
    for (const stage of stages) {
      const analysis = this.analyzeStageLoad(stage);
      
      if (analysis.isBottleneck) {
        bottlenecks.push(`${stage.stageName}: ${analysis.recommendations.join(', ')}`);
      }
    }
    
    return bottlenecks;
  }

  private analyzeStageLoad(stage: ExecutionStage): LoadBalanceAnalysis {
    const tasks = stage.taskIds.map(id => this.graphEngine.getTask(id)!).filter(Boolean);
    const taskCount = tasks.length;
    const totalDuration = stage.estimatedDuration;
    const avgDuration = totalDuration / taskCount;
    
    // Calculate variance in task durations
    const durations = tasks.map(t => t.time.estimatedDuration);
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / taskCount;
    
    // Bottleneck criteria:
    // 1. Single task much longer than others (high variance)
    // 2. Many tasks in sequential mode
    // 3. High fan-out (many tasks depend on one task)
    
    const isBottleneck = variance > 100 || 
                        (stage.executionMode === 'sequential' && taskCount > 5) ||
                        tasks.some(t => t.dependencies.fanOut > 10);
    
    const recommendations: string[] = [];
    
    if (variance > 100) {
      recommendations.push('High variance in task durations - consider splitting long tasks');
    }
    
    if (stage.executionMode === 'sequential' && taskCount > 5) {
      recommendations.push('Many sequential tasks - look for parallelization opportunities');
    }
    
    const highFanOutTasks = tasks.filter(t => t.dependencies.fanOut > 10);
    if (highFanOutTasks.length > 0) {
      recommendations.push(`High fan-out tasks: ${highFanOutTasks.map(t => t.name).join(', ')}`);
    }
    
    return {
      stageId: stage.stageId,
      taskCount,
      totalDuration,
      avgDuration,
      variance,
      isBottleneck,
      recommendations,
    };
  }

  /* ================================ */
  /* PARALLELIZATION OPPORTUNITIES    */
  /* ================================ */

  private findParallelizationOpportunities(stages: ExecutionStage[]): string[][] {
    const opportunities: string[][] = [];
    
    for (const stage of stages) {
      if (stage.executionMode === 'sequential') {
        const tasks = stage.taskIds.map(id => this.graphEngine.getTask(id)!).filter(Boolean);
        
        // Find independent task groups
        const groups = this.findIndependentGroups(tasks);
        
        if (groups.length > 1) {
          opportunities.push(groups.map(g => g.map(t => t.name).join(', ')));
        }
      }
    }
    
    return opportunities;
  }

  private findIndependentGroups(tasks: TaskNode[]): TaskNode[][] {
    const groups: TaskNode[][] = [];
    const assigned = new Set<string>();
    
    for (const task of tasks) {
      if (assigned.has(task.taskId)) continue;
      
      // Find all tasks independent of this one
      const group: TaskNode[] = [task];
      assigned.add(task.taskId);
      
      for (const otherTask of tasks) {
        if (assigned.has(otherTask.taskId)) continue;
        
        // Check if independent (no dependency relationship)
        const hasPath1 = task.dependencies.descendantTasks.includes(otherTask.taskId);
        const hasPath2 = otherTask.dependencies.descendantTasks.includes(task.taskId);
        
        if (!hasPath1 && !hasPath2) {
          // Check compatibility
          const compatibility = this.compatibilityMatrix.calculatePairwiseCompatibility(task, otherTask);
          
          if (compatibility.canCoexist && compatibility.scopeCompatibility > 70) {
            group.push(otherTask);
            assigned.add(otherTask.taskId);
          }
        }
      }
      
      groups.push(group);
    }
    
    return groups;
  }

  /* ================================ */
  /* RISK CALCULATION                 */
  /* ================================ */

  private calculateOverallRisk(stages: ExecutionStage[]): number {
    if (stages.length === 0) return 0;
    
    const riskValues = {
      'low': 10,
      'medium': 40,
      'high': 70,
      'critical': 95,
    };
    
    const totalRisk = stages.reduce((sum, s) => sum + riskValues[s.riskLevel], 0);
    const avgRisk = totalRisk / stages.length;
    
    // Adjust for blockers
    const blockersCount = stages.reduce((sum, s) => sum + s.blockers.length, 0);
    const blockerPenalty = Math.min(blockersCount * 5, 30);
    
    return Math.min(100, avgRisk + blockerPenalty);
  }

  /* ================================ */
  /* RECOMMENDATIONS                  */
  /* ================================ */

  private generateRecommendations(
    stages: ExecutionStage[], 
    bottlenecks: string[], 
    parallelizationOpportunities: string[][], 
    overallRisk: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Risk-based recommendations
    if (overallRisk > 70) {
      recommendations.push('⚠️ HIGH RISK: Consider breaking plan into smaller chunks');
      recommendations.push('⚠️ Execute critical stages first with validation');
    } else if (overallRisk > 40) {
      recommendations.push('⚠️ MODERATE RISK: Review high-risk stages before execution');
    }
    
    // Bottleneck recommendations
    if (bottlenecks.length > 0) {
      recommendations.push(`🔧 BOTTLENECKS DETECTED: ${bottlenecks.length} stage(s) need optimization`);
      recommendations.push(...bottlenecks.map(b => `   - ${b}`));
    }
    
    // Parallelization recommendations
    if (parallelizationOpportunities.length > 0) {
      recommendations.push(`⚡ PARALLELIZATION: ${parallelizationOpportunities.length} opportunity(ies) found`);
      recommendations.push('   Consider executing independent task groups in parallel');
    }
    
    // Stage-specific recommendations
    const highRiskStages = stages.filter(s => s.riskLevel === 'critical' || s.riskLevel === 'high');
    if (highRiskStages.length > 0) {
      recommendations.push(`🔴 HIGH-RISK STAGES: ${highRiskStages.map(s => s.stageName).join(', ')}`);
      recommendations.push('   Require manual approval before execution');
    }
    
    // Duration recommendations
    const totalDuration = stages.reduce((sum, s) => sum + s.estimatedDuration, 0);
    if (totalDuration > 60) {
      recommendations.push(`⏱️ LONG EXECUTION: Plan takes ~${Math.round(totalDuration)} minutes`);
      recommendations.push('   Consider scheduling during low-activity periods');
    }
    
    return recommendations;
  }

  /* ================================ */
  /* UTILITIES                        */
  /* ================================ */

  public clear(): void {
    this.compatibilityMatrix.clearCache();
  }
}
