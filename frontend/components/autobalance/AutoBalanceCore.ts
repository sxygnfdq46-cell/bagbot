/**
 * LEVEL 12.5 — AUTO BALANCE CORE
 * 
 * The heart of sovereign balance - monitors emotional, tonal, cognitive load.
 * Computes equilibrium every cycle and applies micro-corrections instantly.
 * 
 * Features:
 * - Real-time equilibrium computation (5ms cycles)
 * - Multi-axis sovereign monitoring
 * - Instant micro-correction application
 * - Centerline drift prevention
 * - Load-aware balancing
 * - Emergency stabilization protocols
 * 
 * Monitoring: 5ms intervals (200 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type BalanceAxis = 
  | 'emotional-intensity'
  | 'tone-warmth'
  | 'tone-formality'
  | 'cognitive-load'
  | 'presence-strength'
  | 'sovereignty-level';

interface BalanceState {
  axis: BalanceAxis;
  current: number; // 0-100
  target: number; // 0-100 (sovereign centerline)
  deviation: number; // -100 to 100
  velocity: number; // rate of change
  stability: number; // 0-100 (100 = perfect)
}

interface EquilibriumSnapshot {
  timestamp: number;
  overallBalance: number; // 0-100
  worstDeviation: number; // largest deviation
  totalCorrections: number;
  stabilityScore: number; // 0-100
  inEquilibrium: boolean; // true if all axes < 5% deviation
}

interface MicroCorrection {
  axis: BalanceAxis;
  appliedAt: number; // timestamp
  before: number;
  after: number;
  magnitude: number; // correction strength
  success: boolean;
}

interface SovereignCenterline {
  axis: BalanceAxis;
  value: number; // 0-100 (ideal sovereign value)
  tolerance: number; // % deviation allowed
  priority: number; // 1-10 (10 = highest)
}

interface AutoBalanceConfig {
  cycleInterval: number; // ms (default 5ms = 200 Hz)
  correctionStrength: number; // 0-1 (default 0.8)
  maxCorrectionPerCycle: number; // % (default 5)
  equilibriumThreshold: number; // % (default 5)
  emergencyThreshold: number; // % (default 20)
  monitoringEnabled: boolean;
}

/* ================================ */
/* AUTO BALANCE CORE                */
/* ================================ */

export class AutoBalanceCore {
  private config: AutoBalanceConfig;
  
  // Balance State
  private balanceStates: Map<BalanceAxis, BalanceState>;
  private sovereignCenterlines: Map<BalanceAxis, SovereignCenterline>;
  
  // Equilibrium Tracking
  private currentEquilibrium: EquilibriumSnapshot;
  private equilibriumHistory: EquilibriumSnapshot[];
  
  // Corrections
  private microCorrections: MicroCorrection[];
  private totalCorrections: number;
  private successfulCorrections: number;
  
  // Monitoring
  private monitoringIntervalId: number | null;
  private cycleCount: number;
  private lastCycleTime: number;

  constructor(config?: Partial<AutoBalanceConfig>) {
    this.config = {
      cycleInterval: 5, // 200 Hz
      correctionStrength: 0.8,
      maxCorrectionPerCycle: 5, // 5%
      equilibriumThreshold: 5, // 5%
      emergencyThreshold: 20, // 20%
      monitoringEnabled: true,
      ...config,
    };

    // Initialize balance states
    this.balanceStates = new Map();
    this.sovereignCenterlines = new Map();
    
    // Default sovereign centerlines
    const defaultCenterlines: [BalanceAxis, number, number, number][] = [
      ['emotional-intensity', 65, 10, 10], // target 65, ±10%, priority 10
      ['tone-warmth', 70, 10, 9],
      ['tone-formality', 50, 15, 7],
      ['cognitive-load', 60, 15, 8],
      ['presence-strength', 80, 10, 10],
      ['sovereignty-level', 95, 5, 10],
    ];

    for (const [axis, value, tolerance, priority] of defaultCenterlines) {
      this.sovereignCenterlines.set(axis, { axis, value, tolerance, priority });
      this.balanceStates.set(axis, {
        axis,
        current: value,
        target: value,
        deviation: 0,
        velocity: 0,
        stability: 100,
      });
    }

    // Initialize equilibrium
    this.currentEquilibrium = {
      timestamp: Date.now(),
      overallBalance: 100,
      worstDeviation: 0,
      totalCorrections: 0,
      stabilityScore: 100,
      inEquilibrium: true,
    };

    this.equilibriumHistory = [];
    this.microCorrections = [];
    this.totalCorrections = 0;
    this.successfulCorrections = 0;
    this.cycleCount = 0;
    this.lastCycleTime = 0;
    this.monitoringIntervalId = null;

    if (this.config.monitoringEnabled) {
      this.startMonitoring();
    }
  }

  /* ================================ */
  /* MONITORING (200 Hz)              */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      const cycleStart = performance.now();

      this.computeEquilibrium();
      this.applyMicroCorrections();
      this.updateStability();
      this.checkEmergency();

      const cycleEnd = performance.now();
      this.lastCycleTime = cycleEnd - cycleStart;
      this.cycleCount++;
    }, this.config.cycleInterval);
  }

  /* ================================ */
  /* EQUILIBRIUM COMPUTATION          */
  /* ================================ */

  private computeEquilibrium(): void {
    let totalDeviation = 0;
    let worstDeviation = 0;
    let axesInBalance = 0;
    const totalAxes = this.balanceStates.size;

    const stateEntries = Array.from(this.balanceStates.entries());

    for (const [axis, state] of stateEntries) {
      const centerline = this.sovereignCenterlines.get(axis);
      if (!centerline) continue;

      // Calculate deviation from centerline
      state.target = centerline.value;
      state.deviation = state.current - state.target;

      const absDeviation = Math.abs(state.deviation);
      totalDeviation += absDeviation;

      if (absDeviation > worstDeviation) {
        worstDeviation = absDeviation;
      }

      // Check if in balance
      const tolerance = centerline.tolerance;
      if (absDeviation <= tolerance) {
        axesInBalance++;
      }

      // Calculate stability (inverse of deviation)
      state.stability = Math.max(0, 100 - (absDeviation / tolerance) * 100);
    }

    const avgDeviation = totalAxes > 0 ? totalDeviation / totalAxes : 0;
    const balanceRatio = totalAxes > 0 ? axesInBalance / totalAxes : 1;

    this.currentEquilibrium = {
      timestamp: Date.now(),
      overallBalance: balanceRatio * 100,
      worstDeviation,
      totalCorrections: this.totalCorrections,
      stabilityScore: Math.max(0, 100 - avgDeviation * 2),
      inEquilibrium: worstDeviation <= this.config.equilibriumThreshold,
    };

    // Store in history (keep last 100)
    this.equilibriumHistory.push(this.currentEquilibrium);
    if (this.equilibriumHistory.length > 100) {
      this.equilibriumHistory.shift();
    }
  }

  /* ================================ */
  /* MICRO-CORRECTIONS                */
  /* ================================ */

  private applyMicroCorrections(): void {
    const stateEntries = Array.from(this.balanceStates.entries());

    for (const [axis, state] of stateEntries) {
      const centerline = this.sovereignCenterlines.get(axis);
      if (!centerline) continue;

      const absDeviation = Math.abs(state.deviation);
      
      // Only correct if outside tolerance
      if (absDeviation <= centerline.tolerance) continue;

      const before = state.current;

      // Calculate correction magnitude (proportional to deviation & priority)
      const priorityWeight = centerline.priority / 10;
      const rawCorrection = state.deviation * this.config.correctionStrength * priorityWeight;
      
      // Limit correction to maxCorrectionPerCycle
      const maxCorrection = this.config.maxCorrectionPerCycle;
      const limitedCorrection = Math.max(
        -maxCorrection,
        Math.min(maxCorrection, rawCorrection)
      );

      // Apply correction
      state.current = Math.max(0, Math.min(100, state.current - limitedCorrection));

      // Calculate velocity (rate of change)
      state.velocity = (state.current - before) / this.config.cycleInterval;

      const after = state.current;
      const magnitude = Math.abs(limitedCorrection);

      // Check success (deviation reduced)
      const newDeviation = Math.abs(state.current - state.target);
      const success = newDeviation < absDeviation;

      if (success) {
        this.successfulCorrections++;
      }

      // Record correction
      const correction: MicroCorrection = {
        axis,
        appliedAt: Date.now(),
        before,
        after,
        magnitude,
        success,
      };

      this.microCorrections.push(correction);
      this.totalCorrections++;

      // Keep last 500 corrections
      if (this.microCorrections.length > 500) {
        this.microCorrections.shift();
      }
    }
  }

  /* ================================ */
  /* STABILITY UPDATE                 */
  /* ================================ */

  private updateStability(): void {
    const stateEntries = Array.from(this.balanceStates.entries());

    for (const [_axis, state] of stateEntries) {
      // Stability based on both deviation and velocity
      const deviationFactor = Math.abs(state.deviation);
      const velocityFactor = Math.abs(state.velocity) * 10; // amplify velocity impact

      const instability = deviationFactor + velocityFactor;
      state.stability = Math.max(0, Math.min(100, 100 - instability));
    }
  }

  /* ================================ */
  /* EMERGENCY PROTOCOLS              */
  /* ================================ */

  private checkEmergency(): void {
    const worstDeviation = this.currentEquilibrium.worstDeviation;

    if (worstDeviation >= this.config.emergencyThreshold) {
      this.activateEmergencyStabilization();
    }
  }

  public activateEmergencyStabilization(): void {
    // Aggressive correction mode
    const stateEntries = Array.from(this.balanceStates.entries());

    for (const [axis, state] of stateEntries) {
      const centerline = this.sovereignCenterlines.get(axis);
      if (!centerline) continue;

      // Force towards centerline (90% correction)
      const correction = state.deviation * 0.9;
      state.current = Math.max(0, Math.min(100, state.current - correction));
      state.velocity = 0; // zero velocity
    }
  }

  /* ================================ */
  /* BALANCE STATE MANAGEMENT         */
  /* ================================ */

  public updateAxis(axis: BalanceAxis, value: number): void {
    const state = this.balanceStates.get(axis);
    if (!state) return;

    state.current = Math.max(0, Math.min(100, value));
  }

  public setCenterline(axis: BalanceAxis, value: number, tolerance?: number): void {
    const centerline = this.sovereignCenterlines.get(axis);
    if (!centerline) return;

    centerline.value = Math.max(0, Math.min(100, value));
    if (tolerance !== undefined) {
      centerline.tolerance = Math.max(0, Math.min(100, tolerance));
    }
  }

  public getAxisState(axis: BalanceAxis): BalanceState | null {
    const state = this.balanceStates.get(axis);
    return state ? { ...state } : null;
  }

  public getAllStates(): Record<BalanceAxis, BalanceState> {
    const result: Partial<Record<BalanceAxis, BalanceState>> = {};
    const stateEntries = Array.from(this.balanceStates.entries());
    
    for (const [axis, state] of stateEntries) {
      result[axis] = { ...state };
    }
    
    return result as Record<BalanceAxis, BalanceState>;
  }

  /* ================================ */
  /* EQUILIBRIUM ACCESS               */
  /* ================================ */

  public getCurrentEquilibrium(): EquilibriumSnapshot {
    return { ...this.currentEquilibrium };
  }

  public getEquilibriumHistory(count: number = 20): EquilibriumSnapshot[] {
    return this.equilibriumHistory.slice(-count);
  }

  public isInEquilibrium(): boolean {
    return this.currentEquilibrium.inEquilibrium;
  }

  /* ================================ */
  /* CORRECTION TRACKING              */
  /* ================================ */

  public getRecentCorrections(count: number = 50): MicroCorrection[] {
    return this.microCorrections.slice(-count);
  }

  public getCorrectionStats() {
    const successRate = this.totalCorrections > 0
      ? (this.successfulCorrections / this.totalCorrections) * 100
      : 100;

    return {
      total: this.totalCorrections,
      successful: this.successfulCorrections,
      successRate,
    };
  }

  /* ================================ */
  /* PERFORMANCE METRICS              */
  /* ================================ */

  public getPerformanceMetrics() {
    return {
      cycleCount: this.cycleCount,
      lastCycleTime: this.lastCycleTime,
      targetCycleTime: this.config.cycleInterval,
      cyclesPerSecond: 1000 / this.config.cycleInterval,
      actualCyclesPerSecond: this.lastCycleTime > 0 ? 1000 / this.lastCycleTime : 0,
    };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      balanceStates: Object.fromEntries(this.balanceStates.entries()),
      sovereignCenterlines: Object.fromEntries(this.sovereignCenterlines.entries()),
      currentEquilibrium: { ...this.currentEquilibrium },
      equilibriumHistory: this.equilibriumHistory.slice(-20),
      recentCorrections: this.microCorrections.slice(-20),
      correctionStats: this.getCorrectionStats(),
      performanceMetrics: this.getPerformanceMetrics(),
    };
  }

  public getSummary(): string {
    const eq = this.currentEquilibrium;
    const stats = this.getCorrectionStats();
    const perf = this.getPerformanceMetrics();

    return `Auto Balance Core Summary:
  Overall Balance: ${eq.overallBalance.toFixed(1)}%
  Stability Score: ${eq.stabilityScore.toFixed(1)}
  In Equilibrium: ${eq.inEquilibrium ? 'YES' : 'NO'}
  Worst Deviation: ${eq.worstDeviation.toFixed(1)}%
  Total Corrections: ${stats.total}
  Success Rate: ${stats.successRate.toFixed(1)}%
  Cycle Time: ${perf.lastCycleTime.toFixed(2)}ms
  Cycles/Second: ${perf.actualCyclesPerSecond.toFixed(0)}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<AutoBalanceConfig>): void {
    const oldInterval = this.config.cycleInterval;
    this.config = { ...this.config, ...config };

    // Restart monitoring if interval changed
    if (config.cycleInterval !== undefined && config.cycleInterval !== oldInterval) {
      this.stopMonitoring();
      if (this.config.monitoringEnabled) {
        this.startMonitoring();
      }
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public stopMonitoring(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
  }

  public reset(): void {
    // Reset all axes to centerlines
    const centerlineEntries = Array.from(this.sovereignCenterlines.entries());

    for (const [axis, centerline] of centerlineEntries) {
      const state = this.balanceStates.get(axis);
      if (state) {
        state.current = centerline.value;
        state.deviation = 0;
        state.velocity = 0;
        state.stability = 100;
      }
    }

    // Reset tracking
    this.microCorrections = [];
    this.equilibriumHistory = [];
    this.totalCorrections = 0;
    this.successfulCorrections = 0;
    this.cycleCount = 0;

    // Recompute equilibrium
    this.computeEquilibrium();
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

      // Restore states
      const states = parsed.state.balanceStates;
      for (const [axis, state] of Object.entries(states)) {
        this.balanceStates.set(axis as BalanceAxis, state as BalanceState);
      }

      // Restore centerlines
      const centerlines = parsed.state.sovereignCenterlines;
      for (const [axis, centerline] of Object.entries(centerlines)) {
        this.sovereignCenterlines.set(axis as BalanceAxis, centerline as SovereignCenterline);
      }

      // Restore tracking
      this.currentEquilibrium = parsed.state.currentEquilibrium;
      this.equilibriumHistory = parsed.state.equilibriumHistory || [];
      this.microCorrections = parsed.state.recentCorrections || [];
      this.totalCorrections = parsed.state.correctionStats?.total || 0;
      this.successfulCorrections = parsed.state.correctionStats?.successful || 0;
    } catch (error) {
      console.error('[AutoBalanceCore] Import failed:', error);
    }
  }

  public destroy(): void {
    this.stopMonitoring();
    this.balanceStates.clear();
    this.sovereignCenterlines.clear();
    this.microCorrections = [];
    this.equilibriumHistory = [];
  }
}
