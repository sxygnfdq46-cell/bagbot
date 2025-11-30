/**
 * LEVEL 13.2 — STATE-AWARENESS LAYER
 * 
 * Tracks BagBot's internal state to prevent confusion and guarantee correctness.
 * 
 * Features:
 * - Active mode tracking (frontend / backend / fullstack)
 * - Building level tracking (Level 1 → Level 13.2 → etc)
 * - Wait mode detection (Copilot paused)
 * - Blueprint locking status
 * - Subsystem enable/disable tracking
 * - State transition validation
 * 
 * Safety: Read-only state tracking, no autonomous state changes
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface SystemState {
  stateId: string;
  timestamp: number;
  activeMode: ActiveMode;
  buildingLevel: string; // e.g., "Level 13.2"
  waitMode: WaitModeState;
  blueprintLocking: BlueprintLockState;
  subsystems: Map<string, SubsystemState>;
  metadata: Record<string, any>;
}

type ActiveMode = 'frontend' | 'backend' | 'fullstack' | 'safe' | 'idle';

interface WaitModeState {
  isWaiting: boolean;
  reason: string | null;
  waitingSince: number | null;
  expectedResumption: number | null; // timestamp
}

interface BlueprintLockState {
  isLocked: boolean;
  lockedBlueprints: string[];
  lockReason: string | null;
  lockedSince: number | null;
}

interface SubsystemState {
  subsystemId: string;
  name: string;
  enabled: boolean;
  status: 'active' | 'inactive' | 'error' | 'initializing';
  lastActivity: number;
  errorMessage: string | null;
}

interface StateTransition {
  transitionId: string;
  fromState: Partial<SystemState>;
  toState: Partial<SystemState>;
  timestamp: number;
  trigger: string; // what caused the transition
  validated: boolean;
}

interface StateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface StateSnapshot {
  timestamp: number;
  mode: ActiveMode;
  level: string;
  waiting: boolean;
  locked: boolean;
  activeSubsystems: number;
  stateHealth: number; // 0-100
}

interface StateAwarenessConfig {
  trackTransitions: boolean;
  maxTransitionHistory: number;
  validateTransitions: boolean;
  enableHealthMonitoring: boolean;
}

/* ================================ */
/* STATE-AWARENESS LAYER            */
/* ================================ */

export class StateAwarenessLayer {
  private config: StateAwarenessConfig;

  // Current State
  private currentState: SystemState;

  // Transition History
  private transitionHistory: StateTransition[];

  // State Health
  private stateHealth: number;

  constructor(config?: Partial<StateAwarenessConfig>) {
    this.config = {
      trackTransitions: true,
      maxTransitionHistory: 50,
      validateTransitions: true,
      enableHealthMonitoring: true,
      ...config,
    };

    const now = Date.now();

    this.currentState = {
      stateId: `state_${now}`,
      timestamp: now,
      activeMode: 'idle',
      buildingLevel: 'Level 0',
      waitMode: {
        isWaiting: false,
        reason: null,
        waitingSince: null,
        expectedResumption: null,
      },
      blueprintLocking: {
        isLocked: false,
        lockedBlueprints: [],
        lockReason: null,
        lockedSince: null,
      },
      subsystems: new Map(),
      metadata: {},
    };

    this.transitionHistory = [];
    this.stateHealth = 100;
  }

  /* ================================ */
  /* MODE MANAGEMENT                  */
  /* ================================ */

  public setActiveMode(mode: ActiveMode, reason?: string): boolean {
    if (!this.validateModeTransition(this.currentState.activeMode, mode)) {
      return false;
    }

    const oldMode = this.currentState.activeMode;
    this.currentState.activeMode = mode;
    this.currentState.timestamp = Date.now();

    if (reason) {
      this.currentState.metadata.modeChangeReason = reason;
    }

    this.recordTransition(
      { activeMode: oldMode },
      { activeMode: mode },
      `Mode change: ${oldMode} → ${mode}`
    );

    this.updateStateHealth();

    return true;
  }

  private validateModeTransition(from: ActiveMode, to: ActiveMode): boolean {
    // Any mode can transition to 'safe' or 'idle'
    if (to === 'safe' || to === 'idle') return true;

    // 'idle' can transition to any mode
    if (from === 'idle') return true;

    // All other transitions are allowed
    return true;
  }

  public getActiveMode(): ActiveMode {
    return this.currentState.activeMode;
  }

  public isSafeMode(): boolean {
    return this.currentState.activeMode === 'safe';
  }

  /* ================================ */
  /* BUILDING LEVEL TRACKING          */
  /* ================================ */

  public setBuildingLevel(level: string, description?: string): void {
    const oldLevel = this.currentState.buildingLevel;
    this.currentState.buildingLevel = level;
    this.currentState.timestamp = Date.now();

    if (description) {
      this.currentState.metadata.levelDescription = description;
    }

    this.recordTransition(
      { buildingLevel: oldLevel },
      { buildingLevel: level },
      `Building level: ${oldLevel} → ${level}`
    );

    this.updateStateHealth();
  }

  public getBuildingLevel(): string {
    return this.currentState.buildingLevel;
  }

  public parseLevelNumber(): number | null {
    const match = this.currentState.buildingLevel.match(/Level (\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
  }

  /* ================================ */
  /* WAIT MODE MANAGEMENT             */
  /* ================================ */

  public enterWaitMode(
    reason: string,
    expectedResumption?: number
  ): void {
    this.currentState.waitMode = {
      isWaiting: true,
      reason,
      waitingSince: Date.now(),
      expectedResumption: expectedResumption || null,
    };

    this.recordTransition(
      { waitMode: { isWaiting: false } } as any,
      { waitMode: { isWaiting: true, reason } } as any,
      `Entered wait mode: ${reason}`
    );

    this.updateStateHealth();
  }

  public exitWaitMode(): void {
    this.currentState.waitMode = {
      isWaiting: false,
      reason: null,
      waitingSince: null,
      expectedResumption: null,
    };

    this.recordTransition(
      { waitMode: { isWaiting: true } } as any,
      { waitMode: { isWaiting: false } } as any,
      'Exited wait mode'
    );

    this.updateStateHealth();
  }

  public isWaiting(): boolean {
    return this.currentState.waitMode.isWaiting;
  }

  public getWaitMode(): WaitModeState {
    return { ...this.currentState.waitMode };
  }

  /* ================================ */
  /* BLUEPRINT LOCKING                */
  /* ================================ */

  public lockBlueprint(
    blueprintId: string,
    reason: string
  ): void {
    if (!this.currentState.blueprintLocking.isLocked) {
      this.currentState.blueprintLocking.isLocked = true;
      this.currentState.blueprintLocking.lockedSince = Date.now();
    }

    this.currentState.blueprintLocking.lockedBlueprints.push(blueprintId);
    this.currentState.blueprintLocking.lockReason = reason;

    this.recordTransition(
      {},
      { blueprintLocking: { isLocked: true, lockedBlueprints: [blueprintId] } } as any,
      `Locked blueprint: ${blueprintId}`
    );

    this.updateStateHealth();
  }

  public unlockBlueprint(blueprintId: string): void {
    this.currentState.blueprintLocking.lockedBlueprints =
      this.currentState.blueprintLocking.lockedBlueprints.filter(
        id => id !== blueprintId
      );

    if (this.currentState.blueprintLocking.lockedBlueprints.length === 0) {
      this.currentState.blueprintLocking.isLocked = false;
      this.currentState.blueprintLocking.lockReason = null;
      this.currentState.blueprintLocking.lockedSince = null;
    }

    this.recordTransition(
      {},
      { blueprintLocking: { lockedBlueprints: [] } } as any,
      `Unlocked blueprint: ${blueprintId}`
    );

    this.updateStateHealth();
  }

  public isBlueprintLocked(blueprintId?: string): boolean {
    if (!blueprintId) {
      return this.currentState.blueprintLocking.isLocked;
    }

    return this.currentState.blueprintLocking.lockedBlueprints.includes(blueprintId);
  }

  public getBlueprintLocking(): BlueprintLockState {
    return {
      ...this.currentState.blueprintLocking,
      lockedBlueprints: [...this.currentState.blueprintLocking.lockedBlueprints],
    };
  }

  /* ================================ */
  /* SUBSYSTEM MANAGEMENT             */
  /* ================================ */

  public registerSubsystem(
    subsystemId: string,
    name: string,
    enabled: boolean = true
  ): void {
    const subsystem: SubsystemState = {
      subsystemId,
      name,
      enabled,
      status: enabled ? 'active' : 'inactive',
      lastActivity: Date.now(),
      errorMessage: null,
    };

    this.currentState.subsystems.set(subsystemId, subsystem);

    this.updateStateHealth();
  }

  public enableSubsystem(subsystemId: string): boolean {
    const subsystem = this.currentState.subsystems.get(subsystemId);
    if (!subsystem) return false;

    subsystem.enabled = true;
    subsystem.status = 'active';
    subsystem.lastActivity = Date.now();

    this.recordTransition(
      {},
      { subsystems: new Map([[subsystemId, { enabled: true }]]) } as any,
      `Enabled subsystem: ${subsystem.name}`
    );

    this.updateStateHealth();

    return true;
  }

  public disableSubsystem(subsystemId: string): boolean {
    const subsystem = this.currentState.subsystems.get(subsystemId);
    if (!subsystem) return false;

    subsystem.enabled = false;
    subsystem.status = 'inactive';
    subsystem.lastActivity = Date.now();

    this.recordTransition(
      {},
      { subsystems: new Map([[subsystemId, { enabled: false }]]) } as any,
      `Disabled subsystem: ${subsystem.name}`
    );

    this.updateStateHealth();

    return true;
  }

  public setSubsystemError(subsystemId: string, error: string): boolean {
    const subsystem = this.currentState.subsystems.get(subsystemId);
    if (!subsystem) return false;

    subsystem.status = 'error';
    subsystem.errorMessage = error;
    subsystem.lastActivity = Date.now();

    this.updateStateHealth();

    return true;
  }

  public getSubsystem(subsystemId: string): SubsystemState | undefined {
    return this.currentState.subsystems.get(subsystemId);
  }

  public getEnabledSubsystems(): SubsystemState[] {
    return Array.from(this.currentState.subsystems.values()).filter(
      s => s.enabled
    );
  }

  public getSubsystemCount(): { total: number; enabled: number; active: number } {
    const all = Array.from(this.currentState.subsystems.values());
    return {
      total: all.length,
      enabled: all.filter(s => s.enabled).length,
      active: all.filter(s => s.status === 'active').length,
    };
  }

  /* ================================ */
  /* STATE TRANSITIONS                */
  /* ================================ */

  private recordTransition(
    fromState: Partial<SystemState>,
    toState: Partial<SystemState>,
    trigger: string
  ): void {
    if (!this.config.trackTransitions) return;

    const transition: StateTransition = {
      transitionId: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromState,
      toState,
      timestamp: Date.now(),
      trigger,
      validated: this.config.validateTransitions,
    };

    this.transitionHistory.push(transition);

    // Prune old transitions
    if (this.transitionHistory.length > this.config.maxTransitionHistory) {
      this.transitionHistory.shift();
    }
  }

  public getTransitionHistory(limit: number = 10): StateTransition[] {
    return this.transitionHistory.slice(-limit);
  }

  public getLastTransition(): StateTransition | null {
    return this.transitionHistory[this.transitionHistory.length - 1] || null;
  }

  /* ================================ */
  /* STATE VALIDATION                 */
  /* ================================ */

  public validateCurrentState(): StateValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mode validity
    const validModes: ActiveMode[] = ['frontend', 'backend', 'fullstack', 'safe', 'idle'];
    if (!validModes.includes(this.currentState.activeMode)) {
      errors.push(`Invalid active mode: ${this.currentState.activeMode}`);
    }

    // Check wait mode consistency
    if (this.currentState.waitMode.isWaiting && !this.currentState.waitMode.reason) {
      warnings.push('Wait mode active without reason');
    }

    // Check blueprint locking consistency
    if (this.currentState.blueprintLocking.isLocked &&
        this.currentState.blueprintLocking.lockedBlueprints.length === 0) {
      warnings.push('Blueprint locking active but no blueprints locked');
    }

    // Check subsystem health
    const errorSubsystems = Array.from(this.currentState.subsystems.values()).filter(
      s => s.status === 'error'
    );
    if (errorSubsystems.length > 0) {
      warnings.push(`${errorSubsystems.length} subsystem(s) in error state`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /* ================================ */
  /* STATE HEALTH MONITORING          */
  /* ================================ */

  private updateStateHealth(): void {
    if (!this.config.enableHealthMonitoring) return;

    let health = 100;

    // Deduct for wait mode
    if (this.currentState.waitMode.isWaiting) {
      health -= 10;
    }

    // Deduct for blueprint locking
    if (this.currentState.blueprintLocking.isLocked) {
      health -= 5;
    }

    // Deduct for subsystem errors
    const errorSubsystems = Array.from(this.currentState.subsystems.values()).filter(
      s => s.status === 'error'
    );
    health -= errorSubsystems.length * 10;

    // Deduct for safe mode
    if (this.currentState.activeMode === 'safe') {
      health -= 20;
    }

    this.stateHealth = Math.max(0, Math.min(100, health));
  }

  public getStateHealth(): number {
    return this.stateHealth;
  }

  /* ================================ */
  /* STATE SNAPSHOT                   */
  /* ================================ */

  public captureSnapshot(): StateSnapshot {
    return {
      timestamp: Date.now(),
      mode: this.currentState.activeMode,
      level: this.currentState.buildingLevel,
      waiting: this.currentState.waitMode.isWaiting,
      locked: this.currentState.blueprintLocking.isLocked,
      activeSubsystems: this.getEnabledSubsystems().length,
      stateHealth: this.stateHealth,
    };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getCurrentState(): SystemState {
    return {
      ...this.currentState,
      waitMode: { ...this.currentState.waitMode },
      blueprintLocking: {
        ...this.currentState.blueprintLocking,
        lockedBlueprints: [...this.currentState.blueprintLocking.lockedBlueprints],
      },
      subsystems: new Map(this.currentState.subsystems),
      metadata: { ...this.currentState.metadata },
    };
  }

  public getState() {
    return {
      currentState: this.getCurrentState(),
      transitionHistory: [...this.transitionHistory],
      stateHealth: this.stateHealth,
    };
  }

  public getSummary(): string {
    const state = this.currentState;
    const subsystemCount = this.getSubsystemCount();
    const validation = this.validateCurrentState();

    return `State-Awareness Layer Summary:

CURRENT STATE:
  Active Mode: ${state.activeMode}
  Building Level: ${state.buildingLevel}
  Wait Mode: ${state.waitMode.isWaiting ? `Yes (${state.waitMode.reason})` : 'No'}
  Blueprint Locking: ${state.blueprintLocking.isLocked ? `Yes (${state.blueprintLocking.lockedBlueprints.length} locked)` : 'No'}
  
SUBSYSTEMS:
  Total: ${subsystemCount.total}
  Enabled: ${subsystemCount.enabled}
  Active: ${subsystemCount.active}

STATE HEALTH: ${this.stateHealth.toFixed(1)}%

VALIDATION:
  Valid: ${validation.isValid ? 'Yes' : 'No'}
  Errors: ${validation.errors.length}
  Warnings: ${validation.warnings.length}

TRANSITIONS: ${this.transitionHistory.length} recorded`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    const now = Date.now();

    this.currentState = {
      stateId: `state_${now}`,
      timestamp: now,
      activeMode: 'idle',
      buildingLevel: 'Level 0',
      waitMode: {
        isWaiting: false,
        reason: null,
        waitingSince: null,
        expectedResumption: null,
      },
      blueprintLocking: {
        isLocked: false,
        lockedBlueprints: [],
        lockReason: null,
        lockedSince: null,
      },
      subsystems: new Map(),
      metadata: {},
    };

    this.transitionHistory = [];
    this.stateHealth = 100;
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
      this.currentState = state.currentState;
      this.transitionHistory = state.transitionHistory;
      this.stateHealth = state.stateHealth;

      // Restore subsystems Map
      this.currentState.subsystems = new Map(
        Object.entries(state.currentState.subsystems || {})
      );
    } catch (error) {
      console.error('[StateAwarenessLayer] Import failed:', error);
    }
  }
}
