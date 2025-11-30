/**
 * LEVEL 12.2 — SOVEREIGN ORCHESTRATION HUB
 * 
 * Orchestrates all Sovereignty engines with unified balance cycle.
 * Provides long-term coherence tracking and full system exports.
 * 
 * Engines Managed:
 * - EmotionalFieldRegulator: Bandwidth limiting, intensity governance
 * - SovereignBalanceEngine: Prediction, recentering, tone correction
 * - AdaptivePresenceMatrix: Personality preservation, 12-layer grid
 * - EmotionalRhythmController: Oscillation moderation, harmonic pacing
 * - StateCoherenceDirector: Multi-layer coherence enforcement
 * 
 * Features:
 * - Unified 100ms balance cycle
 * - Sovereign mode selection (passive/reactive/active/emergency)
 * - Cross-engine stability arbitration
 * - Long-term coherence tracking
 * - Full state export/import
 * - Automatic intervention coordination
 * 
 * Privacy: Zero data storage (ephemeral only)
 */

import { EmotionalFieldRegulator } from './EmotionalFieldRegulator';
import { SovereignBalanceEngine } from './SovereignBalanceEngine';
import { AdaptivePresenceMatrix } from './AdaptivePresenceMatrix';
import { EmotionalRhythmController } from './EmotionalRhythmController';
import { StateCoherenceDirector } from './StateCoherenceDirector';

/* ================================ */
/* TYPES                            */
/* ================================ */

type SovereignMode = 'passive' | 'reactive' | 'active' | 'emergency';

interface OrchestrationConfig {
  balanceCycleInterval: number; // ms
  coherenceCheckInterval: number; // ms
  stabilityThreshold: number; // 0-100
  emergencyThreshold: number; // 0-100
  modeTransitionCooldown: number; // ms
}

interface SystemWideMetrics {
  sovereigntyStrength: number; // 0-100
  overallStability: number; // 0-100
  harmonicResonance: number; // 0-100
  coherenceScore: number; // 0-100
  systemHealth: number; // 0-100
}

interface LongTermTracking {
  uptime: number; // ms
  totalInterventions: number;
  modeChanges: number;
  stabilityHistory: number[]; // last 100 samples
  peakStress: number; // 0-100
  averageCoherence: number; // 0-100
}

/* ================================ */
/* SOVEREIGN ORCHESTRATION HUB      */
/* ================================ */

export class SovereignOrchestrationHub {
  // Engine instances
  private fieldRegulator: EmotionalFieldRegulator;
  private balanceEngine: SovereignBalanceEngine;
  private presenceMatrix: AdaptivePresenceMatrix;
  private rhythmController: EmotionalRhythmController;
  private coherenceDirector: StateCoherenceDirector;

  // Configuration
  private config: OrchestrationConfig;

  // State
  private currentMode: SovereignMode;
  private lastModeChange: number; // timestamp
  private systemMetrics: SystemWideMetrics;
  private longTermTracking: LongTermTracking;
  private startTime: number; // timestamp

  // Intervals
  private balanceCycleIntervalId: number | null;
  private coherenceCheckIntervalId: number | null;

  constructor(config?: Partial<OrchestrationConfig>) {
    this.config = {
      balanceCycleInterval: 100,
      coherenceCheckInterval: 1000,
      stabilityThreshold: 60,
      emergencyThreshold: 30,
      modeTransitionCooldown: 3000,
      ...config,
    };

    // Initialize engines
    this.fieldRegulator = new EmotionalFieldRegulator();
    this.balanceEngine = new SovereignBalanceEngine();
    this.presenceMatrix = new AdaptivePresenceMatrix();
    this.rhythmController = new EmotionalRhythmController();
    this.coherenceDirector = new StateCoherenceDirector();

    // Initialize state
    this.currentMode = 'passive';
    this.lastModeChange = Date.now();
    this.startTime = Date.now();

    this.systemMetrics = {
      sovereigntyStrength: 0,
      overallStability: 100,
      harmonicResonance: 100,
      coherenceScore: 100,
      systemHealth: 100,
    };

    this.longTermTracking = {
      uptime: 0,
      totalInterventions: 0,
      modeChanges: 0,
      stabilityHistory: [],
      peakStress: 0,
      averageCoherence: 100,
    };

    this.balanceCycleIntervalId = null;
    this.coherenceCheckIntervalId = null;

    this.startOrchestration();
  }

  /* ================================ */
  /* ORCHESTRATION                    */
  /* ================================ */

  private startOrchestration(): void {
    if (typeof window === 'undefined') return;

    // Balance cycle (100ms)
    this.balanceCycleIntervalId = window.setInterval(() => {
      this.runBalanceCycle();
    }, this.config.balanceCycleInterval);

    // Coherence check (1s)
    this.coherenceCheckIntervalId = window.setInterval(() => {
      this.runCoherenceCheck();
    }, this.config.coherenceCheckInterval);
  }

  private runBalanceCycle(): void {
    // Update system metrics
    this.updateSystemMetrics();

    // Check for mode transitions
    this.evaluateModeTransition();

    // Update long-term tracking
    this.updateLongTermTracking();
  }

  private runCoherenceCheck(): void {
    const coherenceState = this.coherenceDirector.getState();

    // Update coherence metrics in presence matrix
    // Note: Presence matrix manages its own coherence internally
    // No direct updates needed here - coherence is calculated automatically

    // Synchronize layers if coherence is low
    if (coherenceState.overallCoherence < this.config.stabilityThreshold) {
      this.coherenceDirector.synchronizeLayers(80);
      this.longTermTracking.totalInterventions++;
    }
  }

  /* ================================ */
  /* UNIFIED API                      */
  /* ================================ */

  public updateEmotionalState(intensity: number): void {
    // Update all engines
    this.fieldRegulator.regulateIntensity(intensity);
    this.balanceEngine.updateIntensity(intensity);
    this.presenceMatrix.updateIntensity(intensity);
    this.rhythmController.updateIntensity(intensity);
  }

  public updateTone(warmth: number, formality: number, enthusiasm: number, stability: number): void {
    // Enforce tone ranges
    const enforcedTone = this.coherenceDirector.enforceToneRanges(warmth, formality, enthusiasm, stability);

    // Update engines
    this.balanceEngine.updateTone(enforcedTone.warmth, enforcedTone.formality, enforcedTone.enthusiasm, enforcedTone.stability);
    this.presenceMatrix.updateTone(enforcedTone.warmth, enforcedTone.formality, enforcedTone.enthusiasm, enforcedTone.stability);
  }

  public updatePresenceStrength(value: number): void {
    this.presenceMatrix.updatePresenceStrength(value);

    // Update rhythm controller with presence phase
    const presencePhase = (value / 100) * 360;
    this.rhythmController.updatePresencePhase(presencePhase);
  }

  public updateVisualIntensity(value: number): void {
    this.balanceEngine.updateVisualIntensity(value);
  }

  public enablePrediction(enabled: boolean): void {
    this.balanceEngine.enablePrediction(enabled ? 10 : 0);
  }

  public setTargetTone(warmth: number, formality: number, enthusiasm: number, stability: number): void {
    this.balanceEngine.setTargetTone(warmth, formality, enthusiasm, stability);
  }

  public setCorePersonality(
    warmth: number,
    formality: number,
    enthusiasm: number,
    stability: number,
    authenticity: number
  ): void {
    this.presenceMatrix.setCorePersonality(warmth, formality, enthusiasm, stability);
  }

  public setBaseFrequency(hz: number): void {
    this.rhythmController.setBaseFrequency(hz);
  }

  /* ================================ */
  /* SOVEREIGN MODE MANAGEMENT        */
  /* ================================ */

  public getSovereignMode(): SovereignMode {
    return this.currentMode;
  }

  public setSovereignMode(mode: SovereignMode): void {
    const now = Date.now();

    // Check cooldown
    if (now - this.lastModeChange < this.config.modeTransitionCooldown) {
      return;
    }

    this.currentMode = mode;
    this.lastModeChange = now;
    this.longTermTracking.modeChanges++;

    // Adjust engine parameters based on mode
    this.applyModeConfiguration(mode);
  }

  private applyModeConfiguration(mode: SovereignMode): void {
    switch (mode) {
      case 'passive':
        // Minimal intervention
        this.coherenceDirector.setInterventionConfig({
          correctionStrength: 0.3,
          interventionCooldown: 10000,
        });
        break;

      case 'reactive':
        // Moderate intervention
        this.coherenceDirector.setInterventionConfig({
          correctionStrength: 0.5,
          interventionCooldown: 5000,
        });
        break;

      case 'active':
        // Strong intervention
        this.coherenceDirector.setInterventionConfig({
          correctionStrength: 0.7,
          interventionCooldown: 2000,
        });
        break;

      case 'emergency':
        // Maximum intervention
        this.coherenceDirector.setInterventionConfig({
          correctionStrength: 0.9,
          interventionCooldown: 1000,
        });
        break;
    }
  }

  private evaluateModeTransition(): void {
    const { overallStability } = this.systemMetrics;

    // Auto-transition to emergency if stability is critically low
    if (overallStability < this.config.emergencyThreshold && this.currentMode !== 'emergency') {
      this.setSovereignMode('emergency');
      return;
    }

    // Auto-transition to active if stability is low
    if (overallStability < this.config.stabilityThreshold && this.currentMode === 'passive') {
      this.setSovereignMode('active');
      return;
    }

    // Auto-transition to reactive if stability is recovering
    if (overallStability >= this.config.stabilityThreshold && this.currentMode === 'active') {
      this.setSovereignMode('reactive');
      return;
    }

    // Auto-transition to passive if stability is high
    if (overallStability >= 80 && this.currentMode === 'reactive') {
      this.setSovereignMode('passive');
      return;
    }
  }

  /* ================================ */
  /* SYSTEM-WIDE METRICS              */
  /* ================================ */

  private updateSystemMetrics(): void {
    const fieldState = this.fieldRegulator.getState();
    const balanceState = this.balanceEngine.getState();
    const presenceState = this.presenceMatrix.getState();
    const rhythmState = this.rhythmController.getState();
    const coherenceState = this.coherenceDirector.getState();

    // Calculate sovereignty strength (0-100)
    const sovereigntyStrength =
      fieldState.bandwidth.adaptiveCapacity * 0.2 +
      balanceState.prediction.confidenceLevel * 0.2 +
      presenceState.alignment.alignmentScore * 0.2 +
      rhythmState.smoothness.smoothnessScore * 0.2 +
      coherenceState.layerSyncScore * 0.2;

    // Calculate overall stability (0-100)
    const overallStability =
      fieldState.stabilization.stabilityScore * 0.3 +
      (100 - Math.abs(balanceState.recentering.currentDeviation)) * 0.3 +
      (100 - presenceState.preservation.driftAmount) * 0.2 +
      rhythmState.smoothness.smoothnessScore * 0.2;

    // Calculate harmonic resonance (0-100)
    const harmonicResonance =
      presenceState.alignment.toneResonance * 0.4 +
      (100 - rhythmState.dampening.chaosLevel) * 0.3 +
      rhythmState.smoothness.smoothnessScore * 0.3;

    // Calculate system health (0-100)
    const systemHealth = (sovereigntyStrength + overallStability + harmonicResonance + coherenceState.overallCoherence) / 4;

    this.systemMetrics = {
      sovereigntyStrength,
      overallStability,
      harmonicResonance,
      coherenceScore: coherenceState.overallCoherence,
      systemHealth,
    };
  }

  public getSystemMetrics(): SystemWideMetrics {
    return { ...this.systemMetrics };
  }

  /* ================================ */
  /* LONG-TERM TRACKING               */
  /* ================================ */

  private updateLongTermTracking(): void {
    const now = Date.now();

    this.longTermTracking.uptime = now - this.startTime;

    // Update stability history
    this.longTermTracking.stabilityHistory.push(this.systemMetrics.overallStability);
    if (this.longTermTracking.stabilityHistory.length > 100) {
      this.longTermTracking.stabilityHistory.shift();
    }

    // Track peak stress
    const currentStress = 100 - this.systemMetrics.overallStability;
    if (currentStress > this.longTermTracking.peakStress) {
      this.longTermTracking.peakStress = currentStress;
    }

    // Calculate average coherence
    const coherenceHistory = this.coherenceDirector.getState().coherenceHistory;
    if (coherenceHistory.length > 0) {
      const sum = coherenceHistory.reduce((acc, val) => acc + val, 0);
      this.longTermTracking.averageCoherence = sum / coherenceHistory.length;
    }
  }

  public getLongTermTracking(): LongTermTracking {
    return { ...this.longTermTracking };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      currentMode: this.currentMode,
      systemMetrics: this.getSystemMetrics(),
      longTermTracking: this.getLongTermTracking(),
      engineStates: {
        fieldRegulator: this.fieldRegulator.getState(),
        balanceEngine: this.balanceEngine.getState(),
        presenceMatrix: this.presenceMatrix.getState(),
        rhythmController: this.rhythmController.getState(),
        coherenceDirector: this.coherenceDirector.getState(),
      },
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Sovereign Orchestration Hub Summary:
=== System Overview ===
  Mode: ${state.currentMode}
  Sovereignty Strength: ${Math.round(state.systemMetrics.sovereigntyStrength * 100) / 100}
  Overall Stability: ${Math.round(state.systemMetrics.overallStability * 100) / 100}
  Harmonic Resonance: ${Math.round(state.systemMetrics.harmonicResonance * 100) / 100}
  Coherence Score: ${Math.round(state.systemMetrics.coherenceScore * 100) / 100}
  System Health: ${Math.round(state.systemMetrics.systemHealth * 100) / 100}

=== Long-Term Tracking ===
  Uptime: ${Math.round(state.longTermTracking.uptime / 1000)}s
  Total Interventions: ${state.longTermTracking.totalInterventions}
  Mode Changes: ${state.longTermTracking.modeChanges}
  Peak Stress: ${Math.round(state.longTermTracking.peakStress * 100) / 100}
  Average Coherence: ${Math.round(state.longTermTracking.averageCoherence * 100) / 100}

=== Engine Status ===
  Field Regulator: Intensity ${Math.round(state.engineStates.fieldRegulator.governance.currentIntensity)}, Stability ${Math.round(state.engineStates.fieldRegulator.stabilization.stabilityScore)}
  Balance Engine: Prediction ${state.engineStates.balanceEngine.prediction.predictedTone}, Deviation ${Math.round(state.engineStates.balanceEngine.recentering.currentDeviation)}
  Presence Matrix: Drift ${Math.round(state.engineStates.presenceMatrix.preservation.driftAmount)}, Coherence ${Math.round(state.engineStates.presenceMatrix.grid.overallCoherence)}
  Rhythm Controller: Frequency ${Math.round(state.engineStates.rhythmController.moderation.oscillationFrequency * 100) / 100}Hz, Chaos ${Math.round(state.engineStates.rhythmController.dampening.chaosLevel)}
  Coherence Director: Overall ${Math.round(state.engineStates.coherenceDirector.overallCoherence)}, Sync ${Math.round(state.engineStates.coherenceDirector.layerSyncScore)}`;
  }

  /* ================================ */
  /* FULL EXPORT/IMPORT               */
  /* ================================ */

  public export(): string {
    return JSON.stringify({
      config: this.config,
      currentMode: this.currentMode,
      lastModeChange: this.lastModeChange,
      systemMetrics: this.systemMetrics,
      longTermTracking: this.longTermTracking,
      startTime: this.startTime,
      engines: {
        fieldRegulator: this.fieldRegulator.export(),
        balanceEngine: this.balanceEngine.export(),
        presenceMatrix: this.presenceMatrix.export(),
        rhythmController: this.rhythmController.export(),
        coherenceDirector: this.coherenceDirector.export(),
      },
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.currentMode = parsed.currentMode;
      this.lastModeChange = parsed.lastModeChange;
      this.systemMetrics = parsed.systemMetrics;
      this.longTermTracking = parsed.longTermTracking;
      this.startTime = parsed.startTime;

      this.fieldRegulator.import(parsed.engines.fieldRegulator);
      this.balanceEngine.import(parsed.engines.balanceEngine);
      this.presenceMatrix.import(parsed.engines.presenceMatrix);
      this.rhythmController.import(parsed.engines.rhythmController);
      this.coherenceDirector.import(parsed.engines.coherenceDirector);
    } catch (error) {
      console.error('[SovereignOrchestrationHub] Import failed:', error);
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.fieldRegulator.reset();
    this.balanceEngine.reset();
    this.presenceMatrix.reset();
    this.rhythmController.reset();
    this.coherenceDirector.reset();

    this.currentMode = 'passive';
    this.lastModeChange = Date.now();
    this.startTime = Date.now();

    this.systemMetrics = {
      sovereigntyStrength: 0,
      overallStability: 100,
      harmonicResonance: 100,
      coherenceScore: 100,
      systemHealth: 100,
    };

    this.longTermTracking = {
      uptime: 0,
      totalInterventions: 0,
      modeChanges: 0,
      stabilityHistory: [],
      peakStress: 0,
      averageCoherence: 100,
    };
  }

  public destroy(): void {
    if (this.balanceCycleIntervalId !== null) {
      clearInterval(this.balanceCycleIntervalId);
      this.balanceCycleIntervalId = null;
    }

    if (this.coherenceCheckIntervalId !== null) {
      clearInterval(this.coherenceCheckIntervalId);
      this.coherenceCheckIntervalId = null;
    }

    this.fieldRegulator.destroy();
    this.balanceEngine.destroy();
    this.presenceMatrix.destroy();
    this.rhythmController.destroy();
    this.coherenceDirector.destroy();
  }
}
