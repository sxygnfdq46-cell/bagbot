/**
 * LEVEL 12.1 — GUARDIAN ORCHESTRATION HUB
 * 
 * Connects all Guardian subsystems, runs self-balancing cycle (100ms),
 * oversees long-term integrity, provides full export + compatibility for Level 11–12 layers.
 * 
 * Core Responsibilities:
 * - Orchestrate all Guardian engines (StateCore, HarmonicBalance, ProtectionReflex, StabilizationFlow)
 * - Run unified self-balancing cycle every 100ms
 * - Monitor long-term system integrity across all layers
 * - Provide unified API for Level 1-11.5 integration
 * - Export/import complete Guardian state
 * 
 * Zero data storage. Ephemeral only.
 */

import { GuardianStateCore } from './GuardianStateCore';
import { HarmonicBalanceEngine } from './HarmonicBalanceEngine';
import { ProtectionReflexMatrix } from './ProtectionReflexMatrix';
import { StabilizationFlowEngine } from './StabilizationFlowEngine';

export interface GuardianOrchestrationState {
  orchestrationActive: boolean;
  balanceCycleCount: number;
  lastBalanceCycle: number;
  systemHealth: number; // 0-100, overall health score
  integrityScore: number; // 0-100, long-term integrity
  stabilityScore: number; // 0-100, current stability
  orchestrationPhase: 'initialization' | 'monitoring' | 'balancing' | 'intervention' | 'recovery';
}

export interface SystemWideMetrics {
  guardianStrength: number; // 0-100
  harmonicResonance: number; // 0-100
  protectionLevel: number; // 0-100
  stabilizationEfficiency: number; // 0-100
  overallPerformance: number; // 0-100
}

export interface LongTermIntegrity {
  uptime: number; // milliseconds
  totalInterventions: number;
  successfulInterventions: number;
  failedInterventions: number;
  interventionSuccessRate: number; // 0-100
  averageStability: number; // 0-100, rolling average
  peakStress: number; // 0-100, highest stress encountered
  recoveryTime: number; // milliseconds, average recovery time
}

export interface GuardianOrchestrationConfig {
  balanceCycleInterval: number; // milliseconds
  integrityCheckInterval: number; // milliseconds
  interventionThreshold: number; // 0-100, when to intervene
  autoBalance: boolean;
  autoProtect: boolean;
  autoStabilize: boolean;
}

export class GuardianOrchestrationHub {
  private guardianCore: GuardianStateCore;
  private harmonicEngine: HarmonicBalanceEngine;
  private protectionMatrix: ProtectionReflexMatrix;
  private stabilizationFlow: StabilizationFlowEngine;

  private orchestrationState: GuardianOrchestrationState;
  private systemMetrics: SystemWideMetrics;
  private longTermIntegrity: LongTermIntegrity;
  private config: GuardianOrchestrationConfig;

  // Monitoring
  private balanceCycleInterval: number | null = null;
  private integrityCheckInterval: number | null = null;
  private startTime: number = Date.now();

  // History for long-term tracking
  private stabilityHistory: number[] = [];
  private readonly STABILITY_HISTORY_SIZE = 600; // 10 minutes at 1s intervals

  constructor(config?: Partial<GuardianOrchestrationConfig>) {
    this.config = {
      balanceCycleInterval: 100,
      integrityCheckInterval: 1000,
      interventionThreshold: 70,
      autoBalance: true,
      autoProtect: true,
      autoStabilize: true,
      ...config,
    };

    // Initialize all Guardian engines
    this.guardianCore = new GuardianStateCore({
      emotionalIntensityCap: 85,
      fpsThreshold: 30,
      latencyThreshold: 100,
      stabilizationStrength: 0.7,
    });

    this.harmonicEngine = new HarmonicBalanceEngine({
      toneStabilityThreshold: 70,
      visualIntensityCap: 85,
      harmonicFrequency: 1.0,
      correctionStrength: 0.6,
    });

    this.protectionMatrix = new ProtectionReflexMatrix({
      cascadeThreshold: 3,
      unstableValueThreshold: 70,
      stormIntensityThreshold: 75,
      interventionStrength: 0.8,
    });

    this.stabilizationFlow = new StabilizationFlowEngine({
      spikeThreshold: 60,
      overloadThreshold: 75,
      centeringSpeed: 0.5,
      extremeLoadThreshold: 85,
      smoothingStrength: 0.7,
    });

    this.orchestrationState = {
      orchestrationActive: false,
      balanceCycleCount: 0,
      lastBalanceCycle: Date.now(),
      systemHealth: 100,
      integrityScore: 100,
      stabilityScore: 100,
      orchestrationPhase: 'initialization',
    };

    this.systemMetrics = {
      guardianStrength: 0,
      harmonicResonance: 0,
      protectionLevel: 0,
      stabilizationEfficiency: 0,
      overallPerformance: 100,
    };

    this.longTermIntegrity = {
      uptime: 0,
      totalInterventions: 0,
      successfulInterventions: 0,
      failedInterventions: 0,
      interventionSuccessRate: 100,
      averageStability: 100,
      peakStress: 0,
      recoveryTime: 0,
    };

    this.startOrchestration();
  }

  /**
   * Start orchestration (balance cycle + integrity checks)
   */
  private startOrchestration(): void {
    if (typeof window === 'undefined') return;

    this.orchestrationState.orchestrationActive = true;
    this.orchestrationState.orchestrationPhase = 'monitoring';

    // Balance cycle (100ms)
    this.balanceCycleInterval = window.setInterval(() => {
      this.runBalanceCycle();
    }, this.config.balanceCycleInterval);

    // Integrity check (1s)
    this.integrityCheckInterval = window.setInterval(() => {
      this.performIntegrityCheck();
    }, this.config.integrityCheckInterval);
  }

  /**
   * Run unified self-balancing cycle
   */
  private runBalanceCycle(): void {
    const now = Date.now();
    this.orchestrationState.balanceCycleCount++;
    this.orchestrationState.lastBalanceCycle = now;

    // Get states from all engines
    const guardianState = this.guardianCore.getState();
    const harmonicState = this.harmonicEngine.getState();
    const protectionState = this.protectionMatrix.getState();
    const stabilizationState = this.stabilizationFlow.getState();

    // Update system metrics
    this.updateSystemMetrics(guardianState, harmonicState, protectionState, stabilizationState);

    // Check if intervention is needed
    if (this.systemMetrics.overallPerformance < this.config.interventionThreshold) {
      this.orchestrationState.orchestrationPhase = 'intervention';
      this.performIntervention(guardianState, harmonicState, protectionState, stabilizationState);
    } else if (this.orchestrationState.orchestrationPhase === 'intervention') {
      this.orchestrationState.orchestrationPhase = 'recovery';
    } else if (this.orchestrationState.orchestrationPhase === 'recovery') {
      // Check if recovery is complete
      if (this.systemMetrics.overallPerformance > 80) {
        this.orchestrationState.orchestrationPhase = 'monitoring';
      }
    }

    // Auto-balance if enabled
    if (this.config.autoBalance && harmonicState.multiDimensionalBalance.overallBalance < 70) {
      this.orchestrationState.orchestrationPhase = 'balancing';
      // Balance checking happens internally in the engine
    }

    // Auto-protect if enabled  
    if (this.config.autoProtect && guardianState.protectionLevel !== 'none') {
      // Protection updates happen automatically in the engine
    }

    // Auto-stabilize if enabled
    if (this.config.autoStabilize && stabilizationState.spike.spikeActive) {
      this.stabilizationFlow.preventCascade();
    }
  }

  /**
   * Update system-wide metrics
   */
  private updateSystemMetrics(
    guardianState: any,
    harmonicState: any,
    protectionState: any,
    stabilizationState: any
  ): void {
    // Guardian strength: based on integrity and protection
    this.systemMetrics.guardianStrength =
      (guardianState.integrity.systemIntegrity * 0.6 +
        (guardianState.protectionLevel === 'critical' ? 100 :
         guardianState.protectionLevel === 'high' ? 80 :
         guardianState.protectionLevel === 'medium' ? 60 :
         guardianState.protectionLevel === 'low' ? 40 : 20) * 0.4);

    // Harmonic resonance: based on balance
    this.systemMetrics.harmonicResonance =
      harmonicState.multiDimensionalBalance.overallBalance;

    // Protection level: based on reflex strength and threat level
    this.systemMetrics.protectionLevel =
      protectionState.reflexStrength;

    // Stabilization efficiency: based on flow metrics
    this.systemMetrics.stabilizationEfficiency =
      stabilizationState.metrics.overallStability;

    // Overall performance: weighted average
    this.systemMetrics.overallPerformance =
      (this.systemMetrics.guardianStrength * 0.3 +
        this.systemMetrics.harmonicResonance * 0.25 +
        this.systemMetrics.protectionLevel * 0.25 +
        this.systemMetrics.stabilizationEfficiency * 0.2);

    // Update orchestration state
    this.orchestrationState.systemHealth = this.systemMetrics.overallPerformance;
    this.orchestrationState.stabilityScore = this.systemMetrics.stabilizationEfficiency;
  }

  /**
   * Perform intervention when system performance drops
   */
  private performIntervention(
    guardianState: any,
    harmonicState: any,
    protectionState: any,
    stabilizationState: any
  ): void {
    this.longTermIntegrity.totalInterventions++;
    const interventionStart = Date.now();

    let interventionSuccess = true;

    // Intervention 1: Address emotional overflow
    if (guardianState.emotionalOverflow.overflowRisk > 70) {
      // Normalization happens automatically in GuardianStateCore
      interventionSuccess = guardianState.emotionalOverflow.overflowRisk < 80;
    }

    // Intervention 2: Correct tone imbalance
    if (harmonicState.tone.consistency < 60) {
      // Tone correction happens automatically in HarmonicBalanceEngine
      interventionSuccess = harmonicState.tone.consistency > 50;
    }

    // Intervention 3: Dampen visual overstimulation
    if (harmonicState.visual.overstimulationRisk > 20) {
      // Visual dampening happens automatically in HarmonicBalanceEngine
      interventionSuccess = harmonicState.visual.overstimulationRisk < 30;
    }

    // Intervention 4: Sync emotional-visual divergence
    if (harmonicState.coherence.divergence > 30) {
      // Sync happens automatically in HarmonicBalanceEngine
      interventionSuccess = harmonicState.coherence.divergence < 40;
    }

    // Intervention 5: Prevent cascades
    if (protectionState.cascadeActive) {
      // Cascade prevention happens automatically in ProtectionReflexMatrix
      interventionSuccess = !protectionState.cascadeActive;
    }

    // Intervention 6: Cancel visual storms
    if (protectionState.stormActive) {
      // Storm cancellation happens automatically in ProtectionReflexMatrix
      interventionSuccess = !protectionState.stormActive;
    }

    // Intervention 7: Regulate prediction spikes
    if (stabilizationState.spike.spikeActive) {
      this.stabilizationFlow.preventCascade();
    }

    // Intervention 8: Handle extreme load
    if (stabilizationState.extremeLoad.extremeLoadActive) {
      // Trigger auto-centering through stabilization flow
      // (internal method, already running)
      interventionSuccess = stabilizationState.extremeLoad.degradationRisk < 80;
    }

    // Record intervention outcome
    const interventionEnd = Date.now();
    const interventionTime = interventionEnd - interventionStart;

    if (interventionSuccess) {
      this.longTermIntegrity.successfulInterventions++;
    } else {
      this.longTermIntegrity.failedInterventions++;
    }

    // Update intervention success rate
    this.longTermIntegrity.interventionSuccessRate =
      (this.longTermIntegrity.successfulInterventions /
        this.longTermIntegrity.totalInterventions) * 100;

    // Update average recovery time
    this.longTermIntegrity.recoveryTime =
      (this.longTermIntegrity.recoveryTime * (this.longTermIntegrity.totalInterventions - 1) +
        interventionTime) / this.longTermIntegrity.totalInterventions;
  }

  /**
   * Perform long-term integrity check
   */
  private performIntegrityCheck(): void {
    // Update uptime
    this.longTermIntegrity.uptime = Date.now() - this.startTime;

    // Update stability history
    this.stabilityHistory.push(this.orchestrationState.stabilityScore);
    if (this.stabilityHistory.length > this.STABILITY_HISTORY_SIZE) {
      this.stabilityHistory.shift();
    }

    // Calculate average stability
    if (this.stabilityHistory.length > 0) {
      this.longTermIntegrity.averageStability =
        this.stabilityHistory.reduce((sum, s) => sum + s, 0) / this.stabilityHistory.length;
    }

    // Track peak stress
    const currentStress = 100 - this.orchestrationState.systemHealth;
    if (currentStress > this.longTermIntegrity.peakStress) {
      this.longTermIntegrity.peakStress = currentStress;
    }

    // Update integrity score based on long-term metrics
    this.orchestrationState.integrityScore =
      (this.longTermIntegrity.interventionSuccessRate * 0.4 +
        this.longTermIntegrity.averageStability * 0.4 +
        (100 - this.longTermIntegrity.peakStress) * 0.2);
  }

  /**
   * Update emotional state across all engines
   */
  public updateEmotionalState(emotion: string, intensity: number): void {
    // Update guardian core
    this.guardianCore.updateEmotionalState(emotion, intensity);

    // Check for spikes
    if (intensity > 60) {
      this.stabilizationFlow.detectSpike('emotional', intensity);
    }

    // Check for overload
    if (intensity > 75) {
      this.stabilizationFlow.detectOverload('emotional', intensity, ['Guardian', 'Harmonic']);
    }
  }

  /**
   * Update visual state across all engines
   */
  public updateVisualState(intensity: number, stimulation: number): void {
    // Update harmonic engine
    this.harmonicEngine.updateVisualState(intensity, stimulation);

    // Check for spikes
    if (intensity > 60 || stimulation > 60) {
      this.stabilizationFlow.detectSpike('visual', Math.max(intensity, stimulation));
    }

    // Check for overload
    if (intensity > 75 || stimulation > 75) {
      this.stabilizationFlow.detectOverload('visual', Math.max(intensity, stimulation), ['Harmonic', 'Visual']);
    }
  }

  /**
   * Update tone across all engines
   */
  public updateTone(warmth: number, formality: number, enthusiasm: number): void {
    this.harmonicEngine.updateTone(warmth, formality, enthusiasm);
  }

  /**
   * Detect cascade and prevent
   */
  public detectCascade(layerName: string, depth: number): void {
    this.protectionMatrix.detectCascade(layerName, depth);
    
    if (depth > 3) {
      this.stabilizationFlow.detectOverload('multi', depth * 20, [layerName]);
    }
  }

  /**
   * Get unified Guardian state
   */
  public getState() {
    return {
      orchestration: { ...this.orchestrationState },
      metrics: { ...this.systemMetrics },
      integrity: { ...this.longTermIntegrity },
      guardian: this.guardianCore.getState(),
      harmonic: this.harmonicEngine.getState(),
      protection: this.protectionMatrix.getState(),
      stabilization: this.stabilizationFlow.getState(),
    };
  }

  /**
   * Get summary for debugging
   */
  public getSummary(): string {
    return `GuardianOrchestration: Health=${this.orchestrationState.systemHealth.toFixed(1)}%, Integrity=${this.orchestrationState.integrityScore.toFixed(1)}%, Phase=${this.orchestrationState.orchestrationPhase}, Cycles=${this.orchestrationState.balanceCycleCount}, Interventions=${this.longTermIntegrity.totalInterventions} (${this.longTermIntegrity.interventionSuccessRate.toFixed(1)}% success)`;
  }

  /**
   * Export complete Guardian state
   */
  public export() {
    return {
      orchestration: {
        config: { ...this.config },
        state: { ...this.orchestrationState },
        metrics: { ...this.systemMetrics },
        integrity: { ...this.longTermIntegrity },
      },
      engines: {
        guardian: this.guardianCore.export(),
        harmonic: this.harmonicEngine.export(),
        protection: this.protectionMatrix.export(),
        stabilization: this.stabilizationFlow.export(),
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Import Guardian state
   */
  public import(data: any): void {
    if (data.orchestration?.config) {
      this.config = { ...this.config, ...data.orchestration.config };
    }

    if (data.engines?.guardian) {
      this.guardianCore.import(data.engines.guardian);
    }

    if (data.engines?.harmonic) {
      this.harmonicEngine.import(data.engines.harmonic);
    }

    if (data.engines?.protection) {
      this.protectionMatrix.import(data.engines.protection);
    }

    if (data.engines?.stabilization) {
      this.stabilizationFlow.import(data.engines.stabilization);
    }
  }

  /**
   * Reset all engines
   */
  public reset(): void {
    this.guardianCore.reset();
    this.harmonicEngine.reset();
    this.protectionMatrix.reset();
    this.stabilizationFlow.reset();

    this.orchestrationState = {
      orchestrationActive: true,
      balanceCycleCount: 0,
      lastBalanceCycle: Date.now(),
      systemHealth: 100,
      integrityScore: 100,
      stabilityScore: 100,
      orchestrationPhase: 'monitoring',
    };

    this.systemMetrics = {
      guardianStrength: 0,
      harmonicResonance: 0,
      protectionLevel: 0,
      stabilizationEfficiency: 0,
      overallPerformance: 100,
    };

    this.stabilityHistory = [];
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.balanceCycleInterval !== null) {
      clearInterval(this.balanceCycleInterval);
      this.balanceCycleInterval = null;
    }

    if (this.integrityCheckInterval !== null) {
      clearInterval(this.integrityCheckInterval);
      this.integrityCheckInterval = null;
    }

    this.guardianCore.destroy();
    this.harmonicEngine.destroy();
    this.protectionMatrix.destroy();
    this.stabilizationFlow.destroy();

    this.stabilityHistory = [];
  }
}
