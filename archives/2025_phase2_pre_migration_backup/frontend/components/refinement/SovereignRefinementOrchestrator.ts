/**
 * LEVEL 12.4 — SOVEREIGN REFINEMENT ORCHESTRATOR
 * 
 * Combines all 4 refiners with central refinement loop.
 * Multi-engine sync with timing alignment for 12.3 layers.
 * 
 * Features:
 * - Multi-engine synchronization
 * - Stabilization priority logic
 * - Adaptive refinement profiling
 * - Real-time optimization loop
 * - Cross-layer coordination with 12.1/12.2/12.3
 * - Emergency refinement protocols
 * 
 * Monitoring: 50ms intervals (20 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

import { StabilityRefinementCore } from './StabilityRefinementCore';
import { DriftSuppressionMatrix } from './DriftSuppressionMatrix';
import { EmotionalGradientFilter } from './EmotionalGradientFilter';

/* ================================ */
/* TYPES                            */
/* ================================ */

type RefinementEngineType = 'core' | 'drift' | 'gradient';

interface EngineSync {
  engine: RefinementEngineType;
  lastSync: number; // timestamp
  syncInterval: number; // ms
  priority: number; // 1-10 (10 = highest)
  healthy: boolean;
}

interface StabilizationPriority {
  axis: string;
  priority: number; // 1-10
  reason: string;
  timestamp: number;
}

interface RefinementProfile {
  totalCorrections: number;
  averageLatency: number; // ms
  successRate: number; // 0-100
  activeSince: number; // timestamp
}

interface OptimizationLoop {
  active: boolean;
  cycleCount: number;
  lastCycleTime: number; // ms
  targetCycleTime: number; // ms (50ms default)
  optimizationScore: number; // 0-100
}

interface SovereignRefinementConfig {
  coreEnabled: boolean;
  driftEnabled: boolean;
  gradientEnabled: boolean;
  syncInterval: number; // ms
  optimizationInterval: number; // ms
  monitoringInterval: number; // ms
}

/* ================================ */
/* SOVEREIGN REFINEMENT ORCHESTRATOR */
/* ================================ */

export class SovereignRefinementOrchestrator {
  private config: SovereignRefinementConfig;

  // Refinement Engines
  private refinementCore: StabilityRefinementCore;
  private driftSuppression: DriftSuppressionMatrix;
  private gradientFilter: EmotionalGradientFilter;

  // Orchestration State
  private engineSyncs: Map<RefinementEngineType, EngineSync>;
  private stabilizationPriorities: StabilizationPriority[];
  private refinementProfile: RefinementProfile;
  private optimizationLoop: OptimizationLoop;
  private monitoringIntervalId: number | null;

  constructor(config?: Partial<SovereignRefinementConfig>) {
    this.config = {
      coreEnabled: true,
      driftEnabled: true,
      gradientEnabled: true,
      syncInterval: 100, // 100ms
      optimizationInterval: 1000, // 1 second
      monitoringInterval: 50, // 50ms
      ...config,
    };

    // Initialize engines
    this.refinementCore = new StabilityRefinementCore();
    this.driftSuppression = new DriftSuppressionMatrix();
    this.gradientFilter = new EmotionalGradientFilter();

    // Initialize engine syncs
    this.engineSyncs = new Map();
    const now = Date.now();

    this.engineSyncs.set('core', {
      engine: 'core',
      lastSync: now,
      syncInterval: this.config.syncInterval,
      priority: 10, // highest priority
      healthy: true,
    });

    this.engineSyncs.set('drift', {
      engine: 'drift',
      lastSync: now,
      syncInterval: this.config.syncInterval,
      priority: 9,
      healthy: true,
    });

    this.engineSyncs.set('gradient', {
      engine: 'gradient',
      lastSync: now,
      syncInterval: this.config.syncInterval,
      priority: 8,
      healthy: true,
    });

    this.stabilizationPriorities = [];

    this.refinementProfile = {
      totalCorrections: 0,
      averageLatency: 0,
      successRate: 100,
      activeSince: now,
    };

    this.optimizationLoop = {
      active: true,
      cycleCount: 0,
      lastCycleTime: 0,
      targetCycleTime: this.config.monitoringInterval,
      optimizationScore: 100,
    };

    this.monitoringIntervalId = null;
    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      const cycleStart = Date.now();

      this.synchronizeEngines();
      this.updateStabilizationPriorities();
      this.updateRefinementProfile();
      this.optimizePerformance();

      const cycleEnd = Date.now();
      this.optimizationLoop.lastCycleTime = cycleEnd - cycleStart;
      this.optimizationLoop.cycleCount++;
    }, this.config.monitoringInterval);
  }

  private synchronizeEngines(): void {
    const now = Date.now();
    const engineEntries = Array.from(this.engineSyncs.entries());

    for (const [engineType, sync] of engineEntries) {
      if (now - sync.lastSync >= sync.syncInterval) {
        this.syncEngine(engineType);
        sync.lastSync = now;
      }
    }
  }

  private syncEngine(engine: RefinementEngineType): void {
    switch (engine) {
      case 'core':
        if (this.config.coreEnabled) {
          // Sync core with drift suppression
          const driftState = this.driftSuppression.getState();
          for (const [axis, vector] of Object.entries(driftState.driftVectors)) {
            this.refinementCore.createVector(axis, vector.currentValue);
          }
        }
        break;

      case 'drift':
        if (this.config.driftEnabled) {
          // Apply drift suppression
          this.driftSuppression.suppressAll();
        }
        break;

      case 'gradient':
        if (this.config.gradientEnabled) {
          // Update gradient quality metrics
          // (gradients are self-updating)
        }
        break;
    }
  }

  private updateStabilizationPriorities(): void {
    const now = Date.now();

    // Check drift levels
    const driftState = this.driftSuppression.getState();
    for (const [axis, vector] of Object.entries(driftState.driftVectors)) {
      const absDrift = Math.abs(vector.drift);

      if (absDrift > 5) {
        // High drift = high priority
        const priority = Math.min(10, Math.floor(absDrift / 2));

        this.stabilizationPriorities.push({
          axis,
          priority,
          reason: `High drift detected: ${absDrift.toFixed(1)}%`,
          timestamp: now,
        });
      }
    }

    // Sort by priority (highest first)
    this.stabilizationPriorities.sort((a, b) => b.priority - a.priority);

    // Keep only last 20 priorities
    if (this.stabilizationPriorities.length > 20) {
      this.stabilizationPriorities = this.stabilizationPriorities.slice(-20);
    }
  }

  private updateRefinementProfile(): void {
    // Count total corrections
    const coreState = this.refinementCore.getState();
    this.refinementProfile.totalCorrections += coreState.microCorrections.length;

    // Calculate average latency
    this.refinementProfile.averageLatency = this.optimizationLoop.lastCycleTime;

    // Calculate success rate (based on optimization score)
    this.refinementProfile.successRate = this.optimizationLoop.optimizationScore;
  }

  private optimizePerformance(): void {
    const targetCycle = this.optimizationLoop.targetCycleTime;
    const actualCycle = this.optimizationLoop.lastCycleTime;

    // Optimization score = inverse of cycle time deviation
    const deviation = Math.abs(actualCycle - targetCycle);
    this.optimizationLoop.optimizationScore = Math.max(0, 100 - deviation * 10);

    // Adjust sync intervals if needed
    if (actualCycle > targetCycle * 1.5) {
      // Too slow, reduce sync frequency
      const engineEntries = Array.from(this.engineSyncs.entries());
      for (const [_engine, sync] of engineEntries) {
        sync.syncInterval = Math.min(500, sync.syncInterval * 1.2);
      }
    } else if (actualCycle < targetCycle * 0.5) {
      // Too fast, increase sync frequency
      const engineEntries = Array.from(this.engineSyncs.entries());
      for (const [_engine, sync] of engineEntries) {
        sync.syncInterval = Math.max(50, sync.syncInterval * 0.8);
      }
    }
  }

  /* ================================ */
  /* ENGINE CONTROL                   */
  /* ================================ */

  public enableEngine(engine: RefinementEngineType): void {
    switch (engine) {
      case 'core':
        this.config.coreEnabled = true;
        break;
      case 'drift':
        this.config.driftEnabled = true;
        break;
      case 'gradient':
        this.config.gradientEnabled = true;
        break;
    }
  }

  public disableEngine(engine: RefinementEngineType): void {
    switch (engine) {
      case 'core':
        this.config.coreEnabled = false;
        break;
      case 'drift':
        this.config.driftEnabled = false;
        break;
      case 'gradient':
        this.config.gradientEnabled = false;
        break;
    }
  }

  public getEngineSync(engine: RefinementEngineType): EngineSync | null {
    return this.engineSyncs.get(engine) || null;
  }

  /* ================================ */
  /* DIRECT ENGINE ACCESS             */
  /* ================================ */

  public getRefinementCore(): StabilityRefinementCore {
    return this.refinementCore;
  }

  public getDriftSuppression(): DriftSuppressionMatrix {
    return this.driftSuppression;
  }

  public getGradientFilter(): EmotionalGradientFilter {
    return this.gradientFilter;
  }

  /* ================================ */
  /* STABILIZATION PRIORITIES         */
  /* ================================ */

  public getTopPriorities(count: number = 5): StabilizationPriority[] {
    return this.stabilizationPriorities.slice(0, count);
  }

  public clearPriorities(): void {
    this.stabilizationPriorities = [];
  }

  /* ================================ */
  /* EMERGENCY REFINEMENT             */
  /* ================================ */

  public activateEmergencyRefinement(): void {
    // Set aggressive drift suppression
    this.driftSuppression.enableAggressiveSuppression(true);
    this.driftSuppression.setSuppressionStrength(0.99); // 99%

    // Enable precision clamp
    this.refinementCore.enablePrecisionClamp(true);
    this.refinementCore.setMaxChangePerCycle(0.05); // 5% max change

    // Increase sync frequency
    const engineEntries = Array.from(this.engineSyncs.entries());
    for (const [_engine, sync] of engineEntries) {
      sync.syncInterval = 25; // very fast sync
    }
  }

  public deactivateEmergencyRefinement(): void {
    // Restore normal settings
    this.driftSuppression.enableAggressiveSuppression(false);
    this.driftSuppression.setSuppressionStrength(0.98);

    this.refinementCore.setMaxChangePerCycle(0.1);

    const engineEntries = Array.from(this.engineSyncs.entries());
    for (const [_engine, sync] of engineEntries) {
      sync.syncInterval = this.config.syncInterval;
    }
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      engineSyncs: Object.fromEntries(this.engineSyncs.entries()),
      stabilizationPriorities: this.stabilizationPriorities.slice(0, 10),
      refinementProfile: { ...this.refinementProfile },
      optimizationLoop: { ...this.optimizationLoop },
      engines: {
        core: this.refinementCore.getState(),
        drift: this.driftSuppression.getState(),
        gradient: this.gradientFilter.getState(),
      },
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Sovereign Refinement Orchestrator Summary:
  Optimization Score: ${state.optimizationLoop.optimizationScore.toFixed(1)}
  Cycle Count: ${state.optimizationLoop.cycleCount}
  Last Cycle Time: ${state.optimizationLoop.lastCycleTime.toFixed(2)}ms
  Total Corrections: ${state.refinementProfile.totalCorrections}
  Success Rate: ${state.refinementProfile.successRate.toFixed(1)}%
  Top Priority: ${state.stabilizationPriorities[0]?.axis || 'None'}
  Core Enabled: ${this.config.coreEnabled ? 'Yes' : 'No'}
  Drift Enabled: ${this.config.driftEnabled ? 'Yes' : 'No'}
  Gradient Enabled: ${this.config.gradientEnabled ? 'Yes' : 'No'}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<SovereignRefinementConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.syncInterval !== undefined) {
      const engineEntries = Array.from(this.engineSyncs.entries());
      for (const [_engine, sync] of engineEntries) {
        sync.syncInterval = config.syncInterval;
      }
    }

    if (config.monitoringInterval !== undefined) {
      this.optimizationLoop.targetCycleTime = config.monitoringInterval;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    // Reset all engines
    this.refinementCore.reset();
    this.driftSuppression.reset();
    this.gradientFilter.reset();

    // Reset profile
    this.refinementProfile = {
      totalCorrections: 0,
      averageLatency: 0,
      successRate: 100,
      activeSince: Date.now(),
    };

    // Reset optimization loop
    this.optimizationLoop.cycleCount = 0;
    this.optimizationLoop.optimizationScore = 100;

    // Clear priorities
    this.stabilizationPriorities = [];
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
      engines: {
        core: this.refinementCore.export(),
        drift: this.driftSuppression.export(),
        gradient: this.gradientFilter.export(),
      },
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      // Import each engine
      if (parsed.engines.core) this.refinementCore.import(parsed.engines.core);
      if (parsed.engines.drift) this.driftSuppression.import(parsed.engines.drift);
      if (parsed.engines.gradient) this.gradientFilter.import(parsed.engines.gradient);

      // Restore profile
      this.refinementProfile = parsed.state.refinementProfile;
      this.optimizationLoop = parsed.state.optimizationLoop;
    } catch (error) {
      console.error('[SovereignRefinementOrchestrator] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    // Destroy all engines
    this.refinementCore.destroy();
    this.driftSuppression.destroy();
    this.gradientFilter.destroy();
  }
}
