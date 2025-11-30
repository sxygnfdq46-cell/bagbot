/**
 * LEVEL 13.4 — MULTI-COMMAND EXECUTION NETWORK
 * Component 5/8: ConditionalFlowResolver.ts
 * 
 * Purpose: Resolves conditional execution paths
 * - Handles if/then/else logic
 * - Manages branching execution
 * - Validates conditional prerequisites
 * - Dynamically adjusts execution plan based on results
 */

import { TaskNode, TaskStatus } from './TaskNode';
import { ExecutionPlan, ExecutionStage } from './SequentialFlowPlanner';

/* ================================ */
/* TYPES                            */
/* ================================ */

export interface ConditionalRule {
  ruleId: string;
  condition: ConditionalExpression;
  thenBranch: string[];             // Task IDs to execute if true
  elseBranch: string[];             // Task IDs to execute if false
  priority: number;
}

export interface ConditionalExpression {
  type: 'task-status' | 'task-output' | 'risk-threshold' | 'user-decision' | 'composite';
  operator?: 'AND' | 'OR' | 'NOT';
  operands?: ConditionalExpression[];
  taskId?: string;
  expectedStatus?: TaskStatus;
  outputPattern?: string;           // Regex pattern to match output
  riskThreshold?: number;
  userQuestion?: string;
  userResponse?: boolean | null;
}

export interface ConditionalBranch {
  branchId: string;
  condition: ConditionalExpression;
  taskIds: string[];
  isActive: boolean;
  evaluationResult: boolean | null;
  evaluatedAt: number | null;
}

export interface DynamicExecutionPlan {
  basePlan: ExecutionPlan;
  activeBranches: ConditionalBranch[];
  pendingEvaluations: ConditionalRule[];
  executedBranches: string[];
  skippedBranches: string[];
}

/* ================================ */
/* CONDITIONAL FLOW RESOLVER        */
/* ================================ */

export class ConditionalFlowResolver {
  private rules: Map<string, ConditionalRule>;
  private branches: Map<string, ConditionalBranch>;
  private taskResults: Map<string, {status: TaskStatus, output: string | null}>;

  constructor() {
    this.rules = new Map();
    this.branches = new Map();
    this.taskResults = new Map();
  }

  /* ================================ */
  /* RULE MANAGEMENT                  */
  /* ================================ */

  public addRule(rule: ConditionalRule): void {
    this.rules.set(rule.ruleId, rule);

    // Create branches for then/else
    if (rule.thenBranch.length > 0) {
      const thenBranch: ConditionalBranch = {
        branchId: `${rule.ruleId}_then`,
        condition: rule.condition,
        taskIds: rule.thenBranch,
        isActive: false,
        evaluationResult: null,
        evaluatedAt: null,
      };
      this.branches.set(thenBranch.branchId, thenBranch);
    }

    if (rule.elseBranch.length > 0) {
      const elseBranch: ConditionalBranch = {
        branchId: `${rule.ruleId}_else`,
        condition: { type: 'composite', operator: 'NOT', operands: [rule.condition] },
        taskIds: rule.elseBranch,
        isActive: false,
        evaluationResult: null,
        evaluatedAt: null,
      };
      this.branches.set(elseBranch.branchId, elseBranch);
    }
  }

  /* ================================ */
  /* CONDITION EVALUATION             */
  /* ================================ */

  public evaluateCondition(
    condition: ConditionalExpression,
    taskResults: Map<string, TaskNode>
  ): boolean | null {
    switch (condition.type) {
      case 'task-status':
        return this.evaluateTaskStatus(condition, taskResults);
      
      case 'task-output':
        return this.evaluateTaskOutput(condition, taskResults);
      
      case 'risk-threshold':
        return this.evaluateRiskThreshold(condition, taskResults);
      
      case 'user-decision':
        return this.evaluateUserDecision(condition);
      
      case 'composite':
        return this.evaluateComposite(condition, taskResults);
      
      default:
        console.warn(`Unknown condition type: ${condition.type}`);
        return null;
    }
  }

  private evaluateTaskStatus(
    condition: ConditionalExpression,
    taskResults: Map<string, TaskNode>
  ): boolean | null {
    if (!condition.taskId || !condition.expectedStatus) return null;

    const task = taskResults.get(condition.taskId);
    if (!task) return null;

    return task.status === condition.expectedStatus;
  }

  private evaluateTaskOutput(
    condition: ConditionalExpression,
    taskResults: Map<string, TaskNode>
  ): boolean | null {
    if (!condition.taskId || !condition.outputPattern) return null;

    const task = taskResults.get(condition.taskId);
    if (!task || !task.executionResult.output) return null;

    try {
      const regex = new RegExp(condition.outputPattern);
      return regex.test(task.executionResult.output);
    } catch (e) {
      console.error('Invalid regex pattern:', condition.outputPattern);
      return null;
    }
  }

  private evaluateRiskThreshold(
    condition: ConditionalExpression,
    taskResults: Map<string, TaskNode>
  ): boolean | null {
    if (!condition.taskId || condition.riskThreshold === undefined) return null;

    const task = taskResults.get(condition.taskId);
    if (!task) return null;

    return task.impact.riskScore <= condition.riskThreshold;
  }

  private evaluateUserDecision(condition: ConditionalExpression): boolean | null {
    if (!condition.userQuestion) return null;

    // User response must be provided externally
    return condition.userResponse === true;
  }

  private evaluateComposite(
    condition: ConditionalExpression,
    taskResults: Map<string, TaskNode>
  ): boolean | null {
    if (!condition.operator || !condition.operands) return null;

    const operandResults = condition.operands.map(op => 
      this.evaluateCondition(op, taskResults)
    );

    // If any operand is null (unevaluated), return null
    if (operandResults.some(r => r === null)) return null;

    switch (condition.operator) {
      case 'AND':
        return operandResults.every(r => r === true);
      
      case 'OR':
        return operandResults.some(r => r === true);
      
      case 'NOT':
        return operandResults[0] === false;
      
      default:
        return null;
    }
  }

  /* ================================ */
  /* BRANCH ACTIVATION                */
  /* ================================ */

  public evaluateBranches(taskResults: Map<string, TaskNode>): void {
    for (const branch of Array.from(this.branches.values())) {
      if (branch.isActive || branch.evaluationResult !== null) continue;

      const result = this.evaluateCondition(branch.condition, taskResults);

      if (result !== null) {
        branch.evaluationResult = result;
        branch.evaluatedAt = Date.now();
        branch.isActive = result;
      }
    }
  }

  public getActiveBranches(): ConditionalBranch[] {
    return Array.from(this.branches.values()).filter(b => b.isActive);
  }

  public getPendingBranches(): ConditionalBranch[] {
    return Array.from(this.branches.values()).filter(b => b.evaluationResult === null);
  }

  /* ================================ */
  /* DYNAMIC PLAN ADJUSTMENT          */
  /* ================================ */

  public adjustExecutionPlan(
    basePlan: ExecutionPlan,
    taskResults: Map<string, TaskNode>
  ): DynamicExecutionPlan {
    // Evaluate all branches
    this.evaluateBranches(taskResults);

    const activeBranches = this.getActiveBranches();
    const pendingBranches = this.getPendingBranches();

    // Collect tasks from active branches
    const activeTaskIds = new Set(activeBranches.flatMap(b => b.taskIds));

    // Collect tasks from inactive branches (to skip)
    const inactiveBranches = Array.from(this.branches.values()).filter(
      b => b.evaluationResult === false
    );
    const skippedTaskIds = new Set(inactiveBranches.flatMap(b => b.taskIds));

    // Filter base plan stages to include only active tasks
    const adjustedStages = basePlan.stages.map(stage => {
      const filteredTaskIds = stage.taskIds.filter(id => 
        !skippedTaskIds.has(id) && (activeTaskIds.size === 0 || activeTaskIds.has(id))
      );

      return {
        ...stage,
        taskIds: filteredTaskIds,
      };
    }).filter(stage => stage.taskIds.length > 0);

    // Build dynamic plan
    const dynamicPlan: DynamicExecutionPlan = {
      basePlan: {
        ...basePlan,
        stages: adjustedStages,
      },
      activeBranches,
      pendingEvaluations: Array.from(this.rules.values()).filter(rule => {
        const thenBranch = this.branches.get(`${rule.ruleId}_then`);
        return thenBranch?.evaluationResult === null;
      }),
      executedBranches: activeBranches.map(b => b.branchId),
      skippedBranches: inactiveBranches.map(b => b.branchId),
    };

    return dynamicPlan;
  }

  /* ================================ */
  /* PREREQUISITE VALIDATION          */
  /* ================================ */

  public validateConditionalPrerequisites(
    taskId: string,
    taskResults: Map<string, TaskNode>
  ): {valid: boolean, blockers: string[]} {
    const blockers: string[] = [];

    // Find branches containing this task
    const relevantBranches = Array.from(this.branches.values()).filter(b => 
      b.taskIds.includes(taskId)
    );

    for (const branch of relevantBranches) {
      // Check if branch is active
      if (branch.evaluationResult === null) {
        blockers.push(`Branch ${branch.branchId} not yet evaluated`);
      } else if (branch.evaluationResult === false) {
        blockers.push(`Branch ${branch.branchId} evaluated to false - task skipped`);
      }
    }

    return {
      valid: blockers.length === 0,
      blockers,
    };
  }

  /* ================================ */
  /* USER DECISION HANDLING           */
  /* ================================ */

  public getUserDecisionConditions(): ConditionalExpression[] {
    const userDecisions: ConditionalExpression[] = [];

    const collectUserDecisions = (condition: ConditionalExpression): void => {
      if (condition.type === 'user-decision') {
        userDecisions.push(condition);
      } else if (condition.type === 'composite' && condition.operands) {
        condition.operands.forEach(collectUserDecisions);
      }
    };

    for (const rule of Array.from(this.rules.values())) {
      collectUserDecisions(rule.condition);
    }

    return userDecisions;
  }

  public provideUserDecision(userQuestion: string, response: boolean): void {
    for (const rule of Array.from(this.rules.values())) {
      this.updateUserDecision(rule.condition, userQuestion, response);
    }
  }

  private updateUserDecision(
    condition: ConditionalExpression,
    userQuestion: string,
    response: boolean
  ): void {
    if (condition.type === 'user-decision' && condition.userQuestion === userQuestion) {
      condition.userResponse = response;
    } else if (condition.type === 'composite' && condition.operands) {
      condition.operands.forEach(op => this.updateUserDecision(op, userQuestion, response));
    }
  }

  /* ================================ */
  /* BRANCH SUMMARY                   */
  /* ================================ */

  public getBranchSummary(): {
    total: number;
    active: number;
    inactive: number;
    pending: number;
  } {
    const branches = Array.from(this.branches.values());
    
    return {
      total: branches.length,
      active: branches.filter(b => b.isActive).length,
      inactive: branches.filter(b => b.evaluationResult === false).length,
      pending: branches.filter(b => b.evaluationResult === null).length,
    };
  }

  /* ================================ */
  /* UTILITIES                        */
  /* ================================ */

  public clear(): void {
    this.rules.clear();
    this.branches.clear();
    this.taskResults.clear();
  }

  public exportRules(): ConditionalRule[] {
    return Array.from(this.rules.values());
  }

  public exportBranches(): ConditionalBranch[] {
    return Array.from(this.branches.values());
  }
}
