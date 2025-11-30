/**
 * LEVEL 13.2 — MULTI-LAYER AWARENESS SYSTEM
 * 
 * Orchestrates all awareness layers into a unified system.
 * 
 * Layers:
 * 1. Task-Awareness Layer: Understands tasks, sequences, dependencies
 * 2. State-Awareness Layer: Tracks mode, level, wait state, locks
 * 3. Intent-Awareness Layer: Reads user direction, style, urgency
 * 4. MLAS Safety Guardrail: Enforces strict boundaries
 * 
 * Result: BagBot is smarter, more responsive, more reliable while staying
 * inside strict boundaries. Intelligence, NOT independence.
 */

import { TaskAwarenessLayer } from './TaskAwarenessLayer';
import { StateAwarenessLayer } from './StateAwarenessLayer';
import { IntentAwarenessLayer } from './IntentAwarenessLayer';
import { MLASSafetyGuardrail } from './MLASSafetyGuardrail';

/* ================================ */
/* TYPES                            */
/* ================================ */

interface AwarenessSnapshot {
  timestamp: number;
  taskFlow: {
    currentFocus: string | null;
    nextRecommended: string | null;
    shouldPause: boolean;
    shouldProceed: boolean;
    flowScore: number;
  };
  systemState: {
    activeMode: string;
    buildingLevel: string;
    waiting: boolean;
    locked: boolean;
    activeSubsystems: number;
    stateHealth: number;
  };
  userIntent: {
    direction: string;
    style: string;
    urgency: string;
    confidence: number;
    requiresConfirmation: boolean;
  } | null;
  safety: {
    isActive: boolean;
    violationCount: number;
    recentChecks: number;
  };
}

interface AwarenessRecommendation {
  recommendationId: string;
  timestamp: number;
  type: 'task' | 'state' | 'intent' | 'safety';
  action: string;
  reasoning: string;
  confidence: number;
  priority: number;
}

interface MultiLayerAwarenessConfig {
  enableTaskAwareness: boolean;
  enableStateAwareness: boolean;
  enableIntentAwareness: boolean;
  enableSafetyGuardrail: boolean;
  autoGenerateRecommendations: boolean;
}

/* ================================ */
/* MULTI-LAYER AWARENESS SYSTEM     */
/* ================================ */

export class MultiLayerAwarenessSystem {
  private config: MultiLayerAwarenessConfig;

  // Awareness Layers
  private taskLayer: TaskAwarenessLayer;
  private stateLayer: StateAwarenessLayer;
  private intentLayer: IntentAwarenessLayer;
  private safetyGuardrail: MLASSafetyGuardrail;

  // Recommendations
  private recommendations: AwarenessRecommendation[];

  constructor(config?: Partial<MultiLayerAwarenessConfig>) {
    this.config = {
      enableTaskAwareness: true,
      enableStateAwareness: true,
      enableIntentAwareness: true,
      enableSafetyGuardrail: true,
      autoGenerateRecommendations: true,
      ...config,
    };

    // Initialize layers
    this.taskLayer = new TaskAwarenessLayer();
    this.stateLayer = new StateAwarenessLayer();
    this.intentLayer = new IntentAwarenessLayer();
    this.safetyGuardrail = new MLASSafetyGuardrail();

    this.recommendations = [];
  }

  /* ================================ */
  /* LAYER ACCESS                     */
  /* ================================ */

  public getTaskLayer(): TaskAwarenessLayer {
    return this.taskLayer;
  }

  public getStateLayer(): StateAwarenessLayer {
    return this.stateLayer;
  }

  public getIntentLayer(): IntentAwarenessLayer {
    return this.intentLayer;
  }

  public getSafetyGuardrail(): MLASSafetyGuardrail {
    return this.safetyGuardrail;
  }

  /* ================================ */
  /* UNIFIED AWARENESS                */
  /* ================================ */

  public captureSnapshot(): AwarenessSnapshot {
    const taskFlowIntelligence = this.taskLayer.getFlowIntelligence();
    const stateSnapshot = this.stateLayer.captureSnapshot();
    const currentIntent = this.intentLayer.getCurrentIntent();

    return {
      timestamp: Date.now(),
      taskFlow: {
        currentFocus: taskFlowIntelligence.currentFocus,
        nextRecommended: taskFlowIntelligence.nextRecommended,
        shouldPause: taskFlowIntelligence.shouldPause,
        shouldProceed: taskFlowIntelligence.shouldProceed,
        flowScore: taskFlowIntelligence.flowScore,
      },
      systemState: {
        activeMode: stateSnapshot.mode,
        buildingLevel: stateSnapshot.level,
        waiting: stateSnapshot.waiting,
        locked: stateSnapshot.locked,
        activeSubsystems: stateSnapshot.activeSubsystems,
        stateHealth: stateSnapshot.stateHealth,
      },
      userIntent: currentIntent
        ? {
            direction: `${currentIntent.direction.category} → ${currentIntent.direction.target || 'unspecified'}`,
            style: `${currentIntent.style.buildingStyle} / ${currentIntent.style.verbosity}`,
            urgency: currentIntent.urgency.level,
            confidence: currentIntent.confidence,
            requiresConfirmation: this.intentLayer.requiresConfirmation(),
          }
        : null,
      safety: {
        isActive: this.safetyGuardrail.isActive(),
        violationCount: this.safetyGuardrail.getViolationCount(),
        recentChecks: this.safetyGuardrail.getRecentChecks().length,
      },
    };
  }

  /* ================================ */
  /* RECOMMENDATION ENGINE            */
  /* ================================ */

  public generateRecommendations(): AwarenessRecommendation[] {
    if (!this.config.autoGenerateRecommendations) return [];

    const recommendations: AwarenessRecommendation[] = [];

    // Task-based recommendations
    if (this.config.enableTaskAwareness) {
      const taskFlowIntelligence = this.taskLayer.getFlowIntelligence();

      if (taskFlowIntelligence.shouldPause) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'task',
          action: 'Pause task execution',
          reasoning: `Flow intelligence suggests pausing: ${taskFlowIntelligence.waitingConfirmation.length} confirmations pending`,
          confidence: 90,
          priority: 8,
        });
      }

      if (taskFlowIntelligence.shouldProceed && taskFlowIntelligence.nextRecommended) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'task',
          action: `Start task: ${taskFlowIntelligence.nextRecommended}`,
          reasoning: 'Flow intelligence recommends proceeding with next task',
          confidence: 80,
          priority: 7,
        });
      }

      if (taskFlowIntelligence.blockedTasks.length > 0) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'task',
          action: 'Resolve blocked tasks',
          reasoning: `${taskFlowIntelligence.blockedTasks.length} tasks are blocked by dependencies`,
          confidence: 70,
          priority: 6,
        });
      }
    }

    // State-based recommendations
    if (this.config.enableStateAwareness) {
      const stateSnapshot = this.stateLayer.captureSnapshot();

      if (stateSnapshot.waiting) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'state',
          action: 'Exit wait mode',
          reasoning: 'System is in wait mode - awaiting user input',
          confidence: 85,
          priority: 9,
        });
      }

      if (stateSnapshot.locked) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'state',
          action: 'Review blueprint locks',
          reasoning: 'Blueprint locking is active - may prevent modifications',
          confidence: 75,
          priority: 5,
        });
      }

      if (stateSnapshot.stateHealth < 70) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'state',
          action: 'Investigate state health issues',
          reasoning: `State health is low: ${stateSnapshot.stateHealth.toFixed(1)}%`,
          confidence: 80,
          priority: 7,
        });
      }
    }

    // Intent-based recommendations
    if (this.config.enableIntentAwareness) {
      const currentIntent = this.intentLayer.getCurrentIntent();

      if (currentIntent && this.intentLayer.requiresConfirmation()) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'intent',
          action: 'Request user confirmation',
          reasoning: `Intent confidence is low (${currentIntent.confidence.toFixed(1)}%) or conflicts detected`,
          confidence: 95,
          priority: 10,
        });
      }

      if (currentIntent && currentIntent.urgency.level === 'high') {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'intent',
          action: 'Prioritize high-urgency work',
          reasoning: 'User intent indicates high urgency',
          confidence: 90,
          priority: 9,
        });
      }
    }

    // Safety-based recommendations
    if (this.config.enableSafetyGuardrail) {
      const violationCount = this.safetyGuardrail.getViolationCount();

      if (violationCount > 0) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'safety',
          action: 'Review safety violations',
          reasoning: `${violationCount} safety violations detected`,
          confidence: 100,
          priority: 10,
        });
      }

      if (!this.safetyGuardrail.isActive()) {
        recommendations.push({
          recommendationId: this.generateRecommendationId(),
          timestamp: Date.now(),
          type: 'safety',
          action: 'SYSTEM LOCKDOWN - Reset required',
          reasoning: 'Safety guardrail triggered lockdown due to excessive violations',
          confidence: 100,
          priority: 10,
        });
      }
    }

    // Sort by priority (descending)
    recommendations.sort((a, b) => b.priority - a.priority);

    // Store recommendations
    this.recommendations = recommendations;

    return recommendations;
  }

  public getRecommendations(limit: number = 5): AwarenessRecommendation[] {
    return this.recommendations.slice(0, limit);
  }

  public getTopRecommendation(): AwarenessRecommendation | null {
    return this.recommendations[0] || null;
  }

  /* ================================ */
  /* UNIFIED OPERATIONS               */
  /* ================================ */

  public processUserCommand(command: string): void {
    // Safety check
    const safetyCheck = this.safetyGuardrail.checkUnauthorizedExecution(command, {
      userInitiated: true,
    });

    if (!safetyCheck.passed) {
      console.warn('[MLAS] Command blocked by safety guardrail');
      return;
    }

    // Analyze intent
    if (this.config.enableIntentAwareness) {
      this.intentLayer.analyzeIntent(command);
    }

    // Generate recommendations
    if (this.config.autoGenerateRecommendations) {
      this.generateRecommendations();
    }
  }

  public updateTaskFlow(taskId: string, status: string): void {
    // Safety check
    const safetyCheck = this.safetyGuardrail.validateOperation('task_update', { taskId, status });

    if (!safetyCheck) {
      console.warn('[MLAS] Task update blocked by safety guardrail');
      return;
    }

    // Update task (actual update done via TaskAwarenessLayer methods)
    // This is just for awareness tracking
  }

  public updateSystemState(mode: string, level: string): void {
    // Safety check
    const safetyCheck = this.safetyGuardrail.validateOperation('state_update', { mode, level });

    if (!safetyCheck) {
      console.warn('[MLAS] State update blocked by safety guardrail');
      return;
    }

    // Update state (actual update done via StateAwarenessLayer methods)
    // This is just for awareness tracking
  }

  /* ================================ */
  /* SYSTEM SUMMARY                   */
  /* ================================ */

  public getSummary(): string {
    const snapshot = this.captureSnapshot();
    const recommendations = this.getRecommendations(3);

    return `╔══════════════════════════════════════════════════════════════════╗
║                LEVEL 13.2 — MULTI-LAYER AWARENESS SYSTEM         ║
╚══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK-AWARENESS LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Current Focus: ${snapshot.taskFlow.currentFocus || 'None'}
  Next Recommended: ${snapshot.taskFlow.nextRecommended || 'None'}
  Should Pause: ${snapshot.taskFlow.shouldPause ? 'Yes ⏸️' : 'No'}
  Should Proceed: ${snapshot.taskFlow.shouldProceed ? 'Yes ▶️' : 'No'}
  Flow Score: ${snapshot.taskFlow.flowScore.toFixed(1)}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATE-AWARENESS LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Active Mode: ${snapshot.systemState.activeMode}
  Building Level: ${snapshot.systemState.buildingLevel}
  Wait Mode: ${snapshot.systemState.waiting ? 'Active ⏳' : 'Inactive'}
  Blueprint Locking: ${snapshot.systemState.locked ? 'Active 🔒' : 'Inactive'}
  Active Subsystems: ${snapshot.systemState.activeSubsystems}
  State Health: ${snapshot.systemState.stateHealth.toFixed(1)}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTENT-AWARENESS LAYER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${snapshot.userIntent ? `  Direction: ${snapshot.userIntent.direction}
  Style: ${snapshot.userIntent.style}
  Urgency: ${snapshot.userIntent.urgency}${snapshot.userIntent.requiresConfirmation ? ' ⚠️ REQUIRES CONFIRMATION' : ''}
  Confidence: ${snapshot.userIntent.confidence.toFixed(1)}%` : '  No current intent'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MLAS SAFETY GUARDRAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Status: ${snapshot.safety.isActive ? 'ACTIVE ✅' : 'LOCKED DOWN 🔒'}
  Violations: ${snapshot.safety.violationCount}
  Recent Checks: ${snapshot.safety.recentChecks}
  
  Safety Guarantees:
    ✅ No autonomous actions
    ✅ No self-modification
    ✅ No unauthorized persistence
    ✅ Read-only awareness

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOP RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recommendations.length > 0
  ? recommendations.map((r, i) => `  ${i + 1}. [${r.type.toUpperCase()}] ${r.action}
     Reason: ${r.reasoning}
     Confidence: ${r.confidence}% | Priority: ${r.priority}/10`).join('\n\n')
  : '  No recommendations at this time'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Result: BagBot is smarter, more responsive, and more reliable while
        staying inside strict boundaries. Intelligence, NOT independence.
`;
  }

  public getLayerSummaries(): {
    task: string;
    state: string;
    intent: string;
    safety: string;
  } {
    return {
      task: this.taskLayer.getSummary(),
      state: this.stateLayer.getSummary(),
      intent: this.intentLayer.getSummary(),
      safety: this.safetyGuardrail.getSummary(),
    };
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.taskLayer.clear();
    this.stateLayer.clear();
    this.intentLayer.clear();
    this.safetyGuardrail.clear();
    this.recommendations = [];
  }

  public reset(): void {
    this.clear();
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      taskLayer: this.taskLayer.export(),
      stateLayer: this.stateLayer.export(),
      intentLayer: this.intentLayer.export(),
      safetyGuardrail: this.safetyGuardrail.export(),
      recommendations: this.recommendations,
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.taskLayer.import(parsed.taskLayer);
      this.stateLayer.import(parsed.stateLayer);
      this.intentLayer.import(parsed.intentLayer);
      this.safetyGuardrail.import(parsed.safetyGuardrail);
      this.recommendations = parsed.recommendations;
    } catch (error) {
      console.error('[MultiLayerAwarenessSystem] Import failed:', error);
    }
  }

  /* ================================ */
  /* UTILITIES                        */
  /* ================================ */

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
