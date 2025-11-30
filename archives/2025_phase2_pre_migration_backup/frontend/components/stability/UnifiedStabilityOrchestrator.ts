/**
 * LEVEL 12.3 — UNIFIED STABILITY ORCHESTRATOR
 * 
 * Full orchestration of all stability engines.
 * Multi-engine synchronization, sovereign timing cycle.
 * 
 * Features:
 * - Orchestrates all 6 stability engines
 * - Multi-engine synchronization
 * - Stability routing (directs signals to appropriate engines)
 * - Sovereign timing cycle coordination
 * - Cross-engine coherence management
 * - Emergency stability protocol
 * - Unified state export/import
 * 
 * Monitoring: 50ms intervals (20 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

import { SovereignStabilityGrid } from './SovereignStabilityGrid';
import { EquilibriumPulseEngine } from './EquilibriumPulseEngine';
import { LongRangeIdentityAnchor } from './LongRangeIdentityAnchor';
import { StatePrecisionRegulator } from './StatePrecisionRegulator';
import { ToneCoherenceDirector } from './ToneCoherenceDirector';

/* ================================ */
/* TYPES                            */
/* ================================ */

type StabilityEngineType = 'grid' | 'pulse' | 'anchor' | 'precision' | 'coherence';

interface EngineStatus {
  engine: StabilityEngineType;
  active: boolean;
  healthy: boolean;
  performanceScore: number; // 0-100
  lastUpdate: number; // timestamp
}

interface OrchestrationMode {
  mode: 'balanced' | 'aggressive' | 'conservative' | 'emergency';
  priority: StabilityEngineType[];
  syncInterval: number; // ms
}

interface SovereignTimingCycle {
  phase: number; // 0-1 (position in cycle)
  cycleLength: number; // ms
  cycleCount: number;
  synchronized: boolean;
}

interface StabilityMetrics {
  overallStability: number; // 0-100
  gridStability: number;
  pulseStability: number;
  anchorStability: number;
  precisionStability: number;
  coherenceStability: number;
  emergencyActive: boolean;
}

interface UnifiedStabilityConfig {
  orchestrationMode: 'balanced' | 'aggressive' | 'conservative' | 'emergency';
  cycleLength: number; // ms
  syncInterval: number; // ms
  monitoringInterval: number; // ms
}

/* ================================ */
/* UNIFIED STABILITY ORCHESTRATOR   */
/* ================================ */

export class UnifiedStabilityOrchestrator {
  private config: UnifiedStabilityConfig;

  // Stability Engines
  private stabilityGrid: SovereignStabilityGrid;
  private pulseEngine: EquilibriumPulseEngine;
  private identityAnchor: LongRangeIdentityAnchor;
  private precisionRegulator: StatePrecisionRegulator;
  private coherenceDirector: ToneCoherenceDirector;

  // Orchestration State
  private engineStatuses: Map<StabilityEngineType, EngineStatus>;
  private orchestrationMode: OrchestrationMode;
  private timingCycle: SovereignTimingCycle;
  private stabilityMetrics: StabilityMetrics;
  private monitoringIntervalId: number | null;
  private lastSyncTime: number;

  constructor(config?: Partial<UnifiedStabilityConfig>) {
    this.config = {
      orchestrationMode: 'balanced',
      cycleLength: 5000, // 5 seconds
      syncInterval: 1000, // 1 second
      monitoringInterval: 50, // 50ms
      ...config,
    };

    // Initialize engines
    this.stabilityGrid = new SovereignStabilityGrid();
    this.pulseEngine = new EquilibriumPulseEngine();
    this.identityAnchor = new LongRangeIdentityAnchor();
    this.precisionRegulator = new StatePrecisionRegulator();
    this.coherenceDirector = new ToneCoherenceDirector();

    // Initialize engine statuses
    this.engineStatuses = new Map();
    const engines: StabilityEngineType[] = ['grid', 'pulse', 'anchor', 'precision', 'coherence'];

    for (const engine of engines) {
      this.engineStatuses.set(engine, {
        engine,
        active: true,
        healthy: true,
        performanceScore: 100,
        lastUpdate: Date.now(),
      });
    }

    // Initialize orchestration mode
    this.orchestrationMode = {
      mode: this.config.orchestrationMode,
      priority: ['grid', 'coherence', 'precision', 'pulse', 'anchor'],
      syncInterval: this.config.syncInterval,
    };

    // Initialize timing cycle
    this.timingCycle = {
      phase: 0,
      cycleLength: this.config.cycleLength,
      cycleCount: 0,
      synchronized: true,
    };

    // Initialize stability metrics
    this.stabilityMetrics = {
      overallStability: 100,
      gridStability: 100,
      pulseStability: 100,
      anchorStability: 100,
      precisionStability: 100,
      coherenceStability: 100,
      emergencyActive: false,
    };

    this.monitoringIntervalId = null;
    this.lastSyncTime = Date.now();

    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateTimingCycle();
      this.updateEngineStatuses();
      this.updateStabilityMetrics();
      this.checkSync();
    }, this.config.monitoringInterval);
  }

  private updateTimingCycle(): void {
    const now = Date.now();
    const cycleProgress = (now % this.timingCycle.cycleLength) / this.timingCycle.cycleLength;

    this.timingCycle.phase = cycleProgress;

    // Increment cycle count when phase wraps around
    if (cycleProgress < 0.01 && this.timingCycle.phase > 0.99) {
      this.timingCycle.cycleCount++;
    }
  }

  private updateEngineStatuses(): void {
    const now = Date.now();

    // Update each engine status
    const engineEntries = Array.from(this.engineStatuses.entries());
    for (const [engineType, status] of engineEntries) {
      status.lastUpdate = now;

      // Calculate performance score based on engine-specific metrics
      switch (engineType) {
        case 'grid':
          status.performanceScore = this.stabilityGrid.getOverallStability();
          break;
        case 'pulse':
          status.performanceScore = this.pulseEngine.getState().bpmStability.stabilityScore;
          break;
        case 'anchor':
          status.performanceScore = this.identityAnchor.getState().integrity;
          break;
        case 'precision':
          status.performanceScore = this.precisionRegulator.getOverallPrecision();
          break;
        case 'coherence':
          status.performanceScore = this.coherenceDirector.getCoherenceScore();
          break;
      }

      // Mark as healthy if performance > 50
      status.healthy = status.performanceScore > 50;
    }
  }

  private updateStabilityMetrics(): void {
    // Collect stability scores from each engine
    this.stabilityMetrics.gridStability = this.stabilityGrid.getOverallStability();
    this.stabilityMetrics.pulseStability = this.pulseEngine.getState().bpmStability.stabilityScore;
    this.stabilityMetrics.anchorStability = this.identityAnchor.getState().integrity;
    this.stabilityMetrics.precisionStability = this.precisionRegulator.getOverallPrecision();
    this.stabilityMetrics.coherenceStability = this.coherenceDirector.getCoherenceScore();

    // Calculate overall stability (weighted average)
    this.stabilityMetrics.overallStability =
      (this.stabilityMetrics.gridStability * 0.3 +
        this.stabilityMetrics.pulseStability * 0.2 +
        this.stabilityMetrics.anchorStability * 0.2 +
        this.stabilityMetrics.precisionStability * 0.15 +
        this.stabilityMetrics.coherenceStability * 0.15);

    // Check for emergency conditions
    if (this.stabilityMetrics.overallStability < 40) {
      this.activateEmergencyMode();
    } else if (this.stabilityMetrics.emergencyActive && this.stabilityMetrics.overallStability > 60) {
      this.deactivateEmergencyMode();
    }
  }

  private checkSync(): void {
    const now = Date.now();

    if (now - this.lastSyncTime >= this.orchestrationMode.syncInterval) {
      this.synchronizeEngines();
      this.lastSyncTime = now;
    }
  }

  /* ================================ */
  /* ENGINE ORCHESTRATION             */
  /* ================================ */

  public routeSignal(signal: string, value: number): void {
    // Route signal to appropriate engines based on signal type

    if (signal.includes('emotional')) {
      this.stabilityGrid.updateVector('emotional-intensity', value);
      this.coherenceDirector.updateLayer('tone', value);
    }

    if (signal.includes('tone')) {
      this.stabilityGrid.updateVector('tone-warmth', value);
      this.coherenceDirector.updateLayer('tone', value);
    }

    if (signal.includes('presence')) {
      this.stabilityGrid.updateVector('presence-strength', value);
      this.coherenceDirector.updateLayer('presence', value);
    }

    if (signal.includes('personality')) {
      this.stabilityGrid.updateVector('personality-drift', value);
      this.identityAnchor.updateSignature({ personalityCore: value });
    }

    if (signal.includes('behavior')) {
      this.stabilityGrid.updateVector('behavioral-consistency', value);
      this.identityAnchor.updateSignature({ behaviorPattern: value });
    }

    // Apply precision regulation
    const regulated = this.precisionRegulator.regulateState(signal, value, value);

    // Update pulse engine
    this.pulseEngine.processValue(signal, regulated);
  }

  public synchronizeEngines(): void {
    // Get current state from grid
    const gridState = this.stabilityGrid.getState();

    // Sync coherence director
    const toneWarmth = gridState.vectors['tone-warmth'];
    const presenceStrength = gridState.vectors['presence-strength'];
    const emotionalIntensity = gridState.vectors['emotional-intensity'];
    const personalityDrift = gridState.vectors['personality-drift'];
    const behavioralConsistency = gridState.vectors['behavioral-consistency'];

    this.coherenceDirector.updateLayer('tone', toneWarmth?.current || 50);
    this.coherenceDirector.updateLayer('presence', presenceStrength?.current || 50);

    // Sync identity anchor
    this.identityAnchor.updateSignature({
      emotionalBaseline: emotionalIntensity?.current || 50,
      toneBaseline: toneWarmth?.current || 50,
      presenceBaseline: presenceStrength?.current || 50,
      personalityCore: personalityDrift?.current || 50,
      behaviorPattern: behavioralConsistency?.current || 50,
    });

    // Check if all engines are in sync
    const allHealthy = Array.from(this.engineStatuses.values()).every((status) => status.healthy);
    this.timingCycle.synchronized = allHealthy;
  }

  /* ================================ */
  /* ORCHESTRATION MODES              */
  /* ================================ */

  public setOrchestrationMode(mode: 'balanced' | 'aggressive' | 'conservative' | 'emergency'): void {
    this.orchestrationMode.mode = mode;

    switch (mode) {
      case 'balanced':
        this.orchestrationMode.priority = ['grid', 'coherence', 'precision', 'pulse', 'anchor'];
        this.orchestrationMode.syncInterval = 1000;
        break;

      case 'aggressive':
        this.orchestrationMode.priority = ['grid', 'precision', 'coherence', 'pulse', 'anchor'];
        this.orchestrationMode.syncInterval = 500; // faster sync
        this.precisionRegulator.updateConfig({ dampingFactor: 0.9 });
        break;

      case 'conservative':
        this.orchestrationMode.priority = ['anchor', 'grid', 'coherence', 'precision', 'pulse'];
        this.orchestrationMode.syncInterval = 2000; // slower sync
        this.precisionRegulator.updateConfig({ dampingFactor: 0.6 });
        break;

      case 'emergency':
        this.orchestrationMode.priority = ['grid', 'anchor', 'precision', 'coherence', 'pulse'];
        this.orchestrationMode.syncInterval = 100; // very fast sync
        this.activateEmergencyMode();
        break;
    }
  }

  /* ================================ */
  /* EMERGENCY PROTOCOL               */
  /* ================================ */

  public activateEmergencyMode(): void {
    if (this.stabilityMetrics.emergencyActive) return;

    this.stabilityMetrics.emergencyActive = true;

    // Activate emergency protocols in each engine
    this.stabilityGrid.setMaxVariance(0.1); // stricter limits
    this.pulseEngine.activateEmergencyStability();
    this.identityAnchor.activateBaselineCorrection();
    this.precisionRegulator.updateConfig({
      dampingFactor: 0.9,
      boundaryMode: 'hard',
    });
    this.coherenceDirector.correctAllLayers();

    // Set emergency orchestration mode
    this.setOrchestrationMode('emergency');
  }

  public deactivateEmergencyMode(): void {
    if (!this.stabilityMetrics.emergencyActive) return;

    this.stabilityMetrics.emergencyActive = false;

    // Deactivate emergency protocols
    this.stabilityGrid.setMaxVariance(0.2); // restore normal limits
    this.pulseEngine.deactivateEmergencyStability();
    this.identityAnchor.deactivateBaselineCorrection();
    this.precisionRegulator.updateConfig({
      dampingFactor: 0.7,
      boundaryMode: 'soft',
    });

    // Restore balanced mode
    this.setOrchestrationMode('balanced');
  }

  /* ================================ */
  /* ENGINE CONTROL                   */
  /* ================================ */

  public enableEngine(engine: StabilityEngineType): void {
    const status = this.engineStatuses.get(engine);
    if (status) {
      status.active = true;
    }
  }

  public disableEngine(engine: StabilityEngineType): void {
    const status = this.engineStatuses.get(engine);
    if (status) {
      status.active = false;
    }
  }

  public getEngineStatus(engine: StabilityEngineType): EngineStatus | null {
    return this.engineStatuses.get(engine) || null;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      orchestrationMode: { ...this.orchestrationMode },
      timingCycle: { ...this.timingCycle },
      stabilityMetrics: { ...this.stabilityMetrics },
      engineStatuses: Array.from(this.engineStatuses.entries()).map(([_engine, status]) => ({ ...status })),
      engines: {
        grid: this.stabilityGrid.getState(),
        pulse: this.pulseEngine.getState(),
        anchor: this.identityAnchor.getState(),
        precision: this.precisionRegulator.getState(),
        coherence: this.coherenceDirector.getState(),
      },
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Unified Stability Orchestrator Summary:
  Orchestration Mode: ${state.orchestrationMode.mode}
  Overall Stability: ${Math.round(state.stabilityMetrics.overallStability)}
  Grid Stability: ${Math.round(state.stabilityMetrics.gridStability)}
  Pulse Stability: ${Math.round(state.stabilityMetrics.pulseStability)}
  Anchor Stability: ${Math.round(state.stabilityMetrics.anchorStability)}
  Precision Stability: ${Math.round(state.stabilityMetrics.precisionStability)}
  Coherence Stability: ${Math.round(state.stabilityMetrics.coherenceStability)}
  Emergency Active: ${state.stabilityMetrics.emergencyActive ? 'Yes' : 'No'}
  Timing Cycle: ${Math.round(state.timingCycle.phase * 100)}% (cycle ${state.timingCycle.cycleCount})
  Synchronized: ${state.timingCycle.synchronized ? 'Yes' : 'No'}`;
  }

  public getStabilityMetrics(): StabilityMetrics {
    return { ...this.stabilityMetrics };
  }

  /* ================================ */
  /* DIRECT ENGINE ACCESS             */
  /* ================================ */

  public getStabilityGrid(): SovereignStabilityGrid {
    return this.stabilityGrid;
  }

  public getPulseEngine(): EquilibriumPulseEngine {
    return this.pulseEngine;
  }

  public getIdentityAnchor(): LongRangeIdentityAnchor {
    return this.identityAnchor;
  }

  public getPrecisionRegulator(): StatePrecisionRegulator {
    return this.precisionRegulator;
  }

  public getCoherenceDirector(): ToneCoherenceDirector {
    return this.coherenceDirector;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<UnifiedStabilityConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.orchestrationMode !== undefined) {
      this.setOrchestrationMode(config.orchestrationMode);
    }

    if (config.cycleLength !== undefined) {
      this.timingCycle.cycleLength = config.cycleLength;
    }

    if (config.syncInterval !== undefined) {
      this.orchestrationMode.syncInterval = config.syncInterval;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    // Reset all engines
    this.stabilityGrid.reset();
    this.pulseEngine.reset();
    this.identityAnchor.reset();
    this.precisionRegulator.reset();
    this.coherenceDirector.reset();

    // Reset orchestration state
    this.timingCycle.phase = 0;
    this.timingCycle.cycleCount = 0;
    this.timingCycle.synchronized = true;

    this.stabilityMetrics = {
      overallStability: 100,
      gridStability: 100,
      pulseStability: 100,
      anchorStability: 100,
      precisionStability: 100,
      coherenceStability: 100,
      emergencyActive: false,
    };

    // Reset engine statuses
    const statuses = Array.from(this.engineStatuses.values());
    for (const status of statuses) {
      status.active = true;
      status.healthy = true;
      status.performanceScore = 100;
      status.lastUpdate = Date.now();
    }
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
      engines: {
        grid: this.stabilityGrid.export(),
        pulse: this.pulseEngine.export(),
        anchor: this.identityAnchor.export(),
        precision: this.precisionRegulator.export(),
        coherence: this.coherenceDirector.export(),
      },
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      // Import each engine
      if (parsed.engines.grid) this.stabilityGrid.import(parsed.engines.grid);
      if (parsed.engines.pulse) this.pulseEngine.import(parsed.engines.pulse);
      if (parsed.engines.anchor) this.identityAnchor.import(parsed.engines.anchor);
      if (parsed.engines.precision) this.precisionRegulator.import(parsed.engines.precision);
      if (parsed.engines.coherence) this.coherenceDirector.import(parsed.engines.coherence);

      // Restore orchestration state
      this.orchestrationMode = parsed.state.orchestrationMode;
      this.timingCycle = parsed.state.timingCycle;
      this.stabilityMetrics = parsed.state.stabilityMetrics;

      // Restore engine statuses
      this.engineStatuses.clear();
      for (const statusData of parsed.state.engineStatuses) {
        this.engineStatuses.set(statusData.engine, statusData);
      }
    } catch (error) {
      console.error('[UnifiedStabilityOrchestrator] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    // Destroy all engines
    this.stabilityGrid.destroy();
    this.pulseEngine.destroy();
    this.identityAnchor.destroy();
    this.precisionRegulator.destroy();
    this.coherenceDirector.destroy();
  }
}
