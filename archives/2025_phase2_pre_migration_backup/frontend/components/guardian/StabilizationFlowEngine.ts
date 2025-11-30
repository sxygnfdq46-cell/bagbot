/**
 * LEVEL 12.1 — STABILIZATION FLOW ENGINE
 * 
 * Handles spike smoothing, prevents cascading emotional/visual overload,
 * auto-centers BagBot during high activity, ensures entire AI stays stable under extreme load.
 * 
 * Core Responsibilities:
 * - Spike smoothing: Detect and smooth prediction/emotional spikes
 * - Overload prevention: Stop cascading failures before they propagate
 * - Auto-centering: Return system to equilibrium during high activity
 * - Extreme load handling: Maintain stability under maximum stress
 * 
 * Zero data storage. Ephemeral only.
 */

export interface SpikeDetectionState {
  spikeActive: boolean;
  spikeType: 'emotional' | 'visual' | 'prediction' | 'cognitive' | 'none';
  spikeAmplitude: number; // 0-100
  spikeFrequency: number; // 0-100 Hz
  spikeDuration: number; // milliseconds
  smoothingActive: boolean;
  smoothingStrength: number; // 0-100
  residualEnergy: number; // 0-100
}

export interface OverloadPreventionState {
  overloadDetected: boolean;
  overloadSource: 'emotional' | 'visual' | 'cognitive' | 'memory' | 'multi' | 'none';
  overloadLevel: number; // 0-100
  cascadeRisk: number; // 0-100
  preventionActive: boolean;
  containmentStrength: number; // 0-100
  affectedLayers: string[]; // Layer names experiencing overload
}

export interface AutoCenteringState {
  centeringActive: boolean;
  deviationLevel: number; // 0-100, distance from equilibrium
  equilibriumPoint: number; // 0-100, target center
  centeringProgress: number; // 0-100
  centeringSpeed: number; // 0-100, how fast to return
  stabilizationForce: number; // 0-100, pull strength toward center
}

export interface ExtremeLoadState {
  extremeLoadActive: boolean;
  loadLevel: number; // 0-100
  loadType: 'sustained' | 'burst' | 'oscillating' | 'chaotic' | 'none';
  stressPoints: number; // Count of stress accumulation points
  emergencyProtocol: boolean;
  degradationRisk: number; // 0-100
  recoveryCapacity: number; // 0-100
}

export interface FlowStabilityMetrics {
  smoothness: number; // 0-100, how smooth the flow is
  consistency: number; // 0-100, variance over time
  resilience: number; // 0-100, recovery capability
  adaptability: number; // 0-100, response to changes
  overallStability: number; // 0-100, composite score
}

export interface StabilizationFlowConfig {
  spikeThreshold: number; // Amplitude threshold for spike detection
  overloadThreshold: number; // Level threshold for overload detection
  centeringSpeed: number; // Speed of auto-centering (0-1)
  extremeLoadThreshold: number; // Threshold for extreme load activation
  smoothingStrength: number; // Base smoothing strength (0-1)
}

export class StabilizationFlowEngine {
  private spikeState: SpikeDetectionState;
  private overloadState: OverloadPreventionState;
  private centeringState: AutoCenteringState;
  private extremeLoadState: ExtremeLoadState;
  private flowMetrics: FlowStabilityMetrics;
  private config: StabilizationFlowConfig;

  // History tracking
  private spikeHistory: Array<{ timestamp: number; amplitude: number; type: string }> = [];
  private overloadHistory: Array<{ timestamp: number; level: number; source: string }> = [];
  private loadHistory: number[] = []; // Last 60 seconds of load levels
  
  // Monitoring
  private monitoringInterval: number | null = null;
  private lastUpdateTime: number = Date.now();
  
  // Spike buffer for smoothing
  private spikeBuffer: Array<{ value: number; timestamp: number }> = [];
  private readonly SPIKE_BUFFER_SIZE = 20;
  
  // Auto-centering momentum
  private centeringMomentum: number = 0;
  private readonly MOMENTUM_DECAY = 0.95;

  constructor(config?: Partial<StabilizationFlowConfig>) {
    this.config = {
      spikeThreshold: 60,
      overloadThreshold: 75,
      centeringSpeed: 0.5,
      extremeLoadThreshold: 85,
      smoothingStrength: 0.7,
      ...config,
    };

    this.spikeState = {
      spikeActive: false,
      spikeType: 'none',
      spikeAmplitude: 0,
      spikeFrequency: 0,
      spikeDuration: 0,
      smoothingActive: false,
      smoothingStrength: 0,
      residualEnergy: 0,
    };

    this.overloadState = {
      overloadDetected: false,
      overloadSource: 'none',
      overloadLevel: 0,
      cascadeRisk: 0,
      preventionActive: false,
      containmentStrength: 0,
      affectedLayers: [],
    };

    this.centeringState = {
      centeringActive: false,
      deviationLevel: 0,
      equilibriumPoint: 50,
      centeringProgress: 0,
      centeringSpeed: this.config.centeringSpeed * 100,
      stabilizationForce: 0,
    };

    this.extremeLoadState = {
      extremeLoadActive: false,
      loadLevel: 0,
      loadType: 'none',
      stressPoints: 0,
      emergencyProtocol: false,
      degradationRisk: 0,
      recoveryCapacity: 100,
    };

    this.flowMetrics = {
      smoothness: 100,
      consistency: 100,
      resilience: 100,
      adaptability: 100,
      overallStability: 100,
    };

    this.startMonitoring();
  }

  /**
   * Start continuous monitoring (100ms intervals)
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;
    
    this.monitoringInterval = window.setInterval(() => {
      this.updateFlowState();
      this.updateMetrics();
    }, 100);
  }

  /**
   * Update overall flow state
   */
  private updateFlowState(): void {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Update spike state
    if (this.spikeState.spikeActive) {
      this.spikeState.spikeDuration += deltaTime;
      this.applySpikeSmoothing();
    }

    // Update auto-centering
    if (this.centeringState.centeringActive) {
      this.performAutoCentering(deltaTime);
    }

    // Update extreme load state
    if (this.extremeLoadState.extremeLoadActive) {
      this.handleExtremeLoad(deltaTime);
    }

    // Decay residual energy
    if (this.spikeState.residualEnergy > 0) {
      this.spikeState.residualEnergy = Math.max(0, this.spikeState.residualEnergy - 0.5);
    }

    // Decay centering momentum
    this.centeringMomentum *= this.MOMENTUM_DECAY;

    // Clean old history
    this.cleanHistory();
  }

  /**
   * Detect and handle spikes
   */
  public detectSpike(
    type: 'emotional' | 'visual' | 'prediction' | 'cognitive',
    amplitude: number,
    frequency: number = 0
  ): void {
    if (amplitude > this.config.spikeThreshold) {
      this.spikeState.spikeActive = true;
      this.spikeState.spikeType = type;
      this.spikeState.spikeAmplitude = Math.min(100, amplitude);
      this.spikeState.spikeFrequency = frequency;
      this.spikeState.spikeDuration = 0;
      this.spikeState.smoothingActive = true;
      this.spikeState.smoothingStrength = Math.min(
        100,
        amplitude * this.config.smoothingStrength
      );

      // Add to spike buffer
      this.spikeBuffer.push({
        value: amplitude,
        timestamp: Date.now(),
      });
      if (this.spikeBuffer.length > this.SPIKE_BUFFER_SIZE) {
        this.spikeBuffer.shift();
      }

      // Record in history
      this.spikeHistory.push({
        timestamp: Date.now(),
        amplitude,
        type,
      });

      // Trigger auto-centering if spike is severe
      if (amplitude > 80) {
        this.triggerAutoCentering(amplitude);
      }
    }
  }

  /**
   * Apply spike smoothing
   */
  private applySpikeSmoothing(): void {
    if (!this.spikeState.smoothingActive || this.spikeBuffer.length < 3) return;

    // Calculate smoothed value from buffer
    const recentSpikes = this.spikeBuffer.slice(-10);
    const avgAmplitude = recentSpikes.reduce((sum, s) => sum + s.value, 0) / recentSpikes.length;
    
    // Gradually reduce spike amplitude toward average
    const targetAmplitude = avgAmplitude * 0.8;
    const smoothingRate = this.config.smoothingStrength;
    
    this.spikeState.spikeAmplitude =
      this.spikeState.spikeAmplitude * (1 - smoothingRate) + targetAmplitude * smoothingRate;

    // If amplitude drops below threshold, deactivate spike
    if (this.spikeState.spikeAmplitude < this.config.spikeThreshold * 0.5) {
      this.spikeState.residualEnergy = this.spikeState.spikeAmplitude * 0.5;
      this.spikeState.spikeActive = false;
      this.spikeState.smoothingActive = false;
      this.spikeState.spikeType = 'none';
    }
  }

  /**
   * Smooth a value using the spike buffer
   */
  public smoothValue(value: number): number {
    if (this.spikeBuffer.length < 3) return value;

    const recentValues = this.spikeBuffer.slice(-5).map(s => s.value);
    const avgValue = recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
    
    // Blend current value with average
    const smoothingStrength = this.config.smoothingStrength;
    return value * (1 - smoothingStrength) + avgValue * smoothingStrength;
  }

  /**
   * Detect overload conditions
   */
  public detectOverload(
    source: 'emotional' | 'visual' | 'cognitive' | 'memory' | 'multi',
    level: number,
    affectedLayers: string[] = []
  ): void {
    if (level > this.config.overloadThreshold) {
      this.overloadState.overloadDetected = true;
      this.overloadState.overloadSource = source;
      this.overloadState.overloadLevel = Math.min(100, level);
      this.overloadState.affectedLayers = affectedLayers;
      
      // Calculate cascade risk based on affected layers
      this.overloadState.cascadeRisk = Math.min(
        100,
        (affectedLayers.length * 20) + (level - this.config.overloadThreshold)
      );

      // Activate prevention if cascade risk is high
      if (this.overloadState.cascadeRisk > 50) {
        this.activateOverloadPrevention();
      }

      // Record in history
      this.overloadHistory.push({
        timestamp: Date.now(),
        level,
        source,
      });

      // Trigger extreme load handling if necessary
      if (level > this.config.extremeLoadThreshold) {
        this.triggerExtremeLoad(level, 'burst');
      }
    }
  }

  /**
   * Activate overload prevention measures
   */
  private activateOverloadPrevention(): void {
    this.overloadState.preventionActive = true;
    this.overloadState.containmentStrength = Math.min(
      100,
      this.overloadState.cascadeRisk * 1.2
    );

    // Trigger auto-centering to stabilize system
    this.triggerAutoCentering(this.overloadState.overloadLevel);
  }

  /**
   * Prevent cascading overload
   */
  public preventCascade(): void {
    if (!this.overloadState.overloadDetected) return;

    // Reduce overload level gradually
    const reductionRate = this.overloadState.containmentStrength / 100;
    this.overloadState.overloadLevel = Math.max(
      0,
      this.overloadState.overloadLevel * (1 - reductionRate * 0.1)
    );

    // Reduce cascade risk
    this.overloadState.cascadeRisk = Math.max(
      0,
      this.overloadState.cascadeRisk * 0.9
    );

    // Deactivate if overload is contained
    if (this.overloadState.overloadLevel < this.config.overloadThreshold * 0.5) {
      this.overloadState.overloadDetected = false;
      this.overloadState.preventionActive = false;
      this.overloadState.overloadSource = 'none';
      this.overloadState.affectedLayers = [];
    }
  }

  /**
   * Trigger auto-centering
   */
  private triggerAutoCentering(deviationLevel: number): void {
    this.centeringState.centeringActive = true;
    this.centeringState.deviationLevel = Math.min(100, deviationLevel);
    this.centeringState.centeringProgress = 0;
    
    // Calculate stabilization force based on deviation
    this.centeringState.stabilizationForce = Math.min(
      100,
      (deviationLevel / 100) * 80 + 20
    );

    // Add momentum for smoother centering
    this.centeringMomentum = Math.min(1, this.centeringMomentum + 0.2);
  }

  /**
   * Perform auto-centering
   */
  private performAutoCentering(deltaTime: number): void {
    if (!this.centeringState.centeringActive) return;

    // Calculate centering step
    const centeringRate = (this.config.centeringSpeed + this.centeringMomentum) * (deltaTime / 1000);
    const centeringStep = this.centeringState.stabilizationForce * centeringRate;

    // Reduce deviation
    this.centeringState.deviationLevel = Math.max(
      0,
      this.centeringState.deviationLevel - centeringStep
    );

    // Update progress
    const maxDeviation = 100;
    this.centeringState.centeringProgress = Math.min(
      100,
      ((maxDeviation - this.centeringState.deviationLevel) / maxDeviation) * 100
    );

    // Deactivate if centered
    if (this.centeringState.deviationLevel < 5) {
      this.centeringState.centeringActive = false;
      this.centeringState.centeringProgress = 100;
      this.centeringMomentum = 0;
    }
  }

  /**
   * Trigger extreme load handling
   */
  private triggerExtremeLoad(
    loadLevel: number,
    loadType: 'sustained' | 'burst' | 'oscillating' | 'chaotic'
  ): void {
    this.extremeLoadState.extremeLoadActive = true;
    this.extremeLoadState.loadLevel = Math.min(100, loadLevel);
    this.extremeLoadState.loadType = loadType;
    
    // Increment stress points
    this.extremeLoadState.stressPoints++;

    // Calculate degradation risk
    this.extremeLoadState.degradationRisk = Math.min(
      100,
      (loadLevel - this.config.extremeLoadThreshold) * 2 + this.extremeLoadState.stressPoints * 5
    );

    // Activate emergency protocol if degradation risk is critical
    if (this.extremeLoadState.degradationRisk > 80) {
      this.activateEmergencyProtocol();
    }

    // Add to load history
    this.loadHistory.push(loadLevel);
    if (this.loadHistory.length > 60) {
      this.loadHistory.shift();
    }
  }

  /**
   * Handle extreme load conditions
   */
  private handleExtremeLoad(deltaTime: number): void {
    if (!this.extremeLoadState.extremeLoadActive) return;

    // Gradually reduce load level
    const recoveryRate = (this.extremeLoadState.recoveryCapacity / 100) * (deltaTime / 1000);
    this.extremeLoadState.loadLevel = Math.max(
      0,
      this.extremeLoadState.loadLevel * (1 - recoveryRate * 0.05)
    );

    // Reduce degradation risk
    this.extremeLoadState.degradationRisk = Math.max(
      0,
      this.extremeLoadState.degradationRisk * 0.98
    );

    // Deactivate if load is under control
    if (this.extremeLoadState.loadLevel < this.config.extremeLoadThreshold * 0.7) {
      this.extremeLoadState.extremeLoadActive = false;
      this.extremeLoadState.loadType = 'none';
      this.extremeLoadState.emergencyProtocol = false;
      
      // Decay stress points
      this.extremeLoadState.stressPoints = Math.max(
        0,
        this.extremeLoadState.stressPoints - 1
      );
    }
  }

  /**
   * Activate emergency protocol
   */
  private activateEmergencyProtocol(): void {
    this.extremeLoadState.emergencyProtocol = true;
    
    // Reduce recovery capacity temporarily (system is stressed)
    this.extremeLoadState.recoveryCapacity = Math.max(
      30,
      this.extremeLoadState.recoveryCapacity * 0.7
    );

    // Force aggressive auto-centering
    this.triggerAutoCentering(100);

    // Activate overload prevention
    this.overloadState.preventionActive = true;
    this.overloadState.containmentStrength = 100;
  }

  /**
   * Update stability metrics
   */
  private updateMetrics(): void {
    // Smoothness: inverse of spike activity
    const spikeActivity = this.spikeState.spikeActive ? this.spikeState.spikeAmplitude : 0;
    this.flowMetrics.smoothness = Math.max(0, 100 - spikeActivity);

    // Consistency: inverse of variance in load history
    if (this.loadHistory.length > 5) {
      const avgLoad = this.loadHistory.reduce((sum, l) => sum + l, 0) / this.loadHistory.length;
      const variance = this.loadHistory.reduce((sum, l) => sum + Math.pow(l - avgLoad, 2), 0) / this.loadHistory.length;
      this.flowMetrics.consistency = Math.max(0, 100 - Math.sqrt(variance));
    }

    // Resilience: recovery capacity
    this.flowMetrics.resilience = this.extremeLoadState.recoveryCapacity;

    // Adaptability: inverse of deviation from equilibrium
    this.flowMetrics.adaptability = Math.max(
      0,
      100 - this.centeringState.deviationLevel
    );

    // Overall stability: weighted average
    this.flowMetrics.overallStability =
      (this.flowMetrics.smoothness * 0.3 +
        this.flowMetrics.consistency * 0.2 +
        this.flowMetrics.resilience * 0.3 +
        this.flowMetrics.adaptability * 0.2);
  }

  /**
   * Clean old history entries
   */
  private cleanHistory(): void {
    const now = Date.now();
    const maxAge = 60000; // 60 seconds

    this.spikeHistory = this.spikeHistory.filter(
      entry => now - entry.timestamp < maxAge
    );
    
    this.overloadHistory = this.overloadHistory.filter(
      entry => now - entry.timestamp < maxAge
    );

    this.spikeBuffer = this.spikeBuffer.filter(
      entry => now - entry.timestamp < maxAge
    );
  }

  /**
   * Get current state
   */
  public getState() {
    return {
      spike: { ...this.spikeState },
      overload: { ...this.overloadState },
      centering: { ...this.centeringState },
      extremeLoad: { ...this.extremeLoadState },
      metrics: { ...this.flowMetrics },
    };
  }

  /**
   * Get summary for debugging
   */
  public getSummary(): string {
    return `StabilizationFlow: Stability=${this.flowMetrics.overallStability.toFixed(1)}%, Spike=${this.spikeState.spikeActive ? 'Active' : 'None'}, Overload=${this.overloadState.overloadDetected ? 'Detected' : 'None'}, Centering=${this.centeringState.centeringActive ? 'Active' : 'Idle'}, ExtremeLoad=${this.extremeLoadState.extremeLoadActive ? 'Active' : 'None'}`;
  }

  /**
   * Reset stabilization flow
   */
  public reset(): void {
    this.spikeState = {
      spikeActive: false,
      spikeType: 'none',
      spikeAmplitude: 0,
      spikeFrequency: 0,
      spikeDuration: 0,
      smoothingActive: false,
      smoothingStrength: 0,
      residualEnergy: 0,
    };

    this.overloadState = {
      overloadDetected: false,
      overloadSource: 'none',
      overloadLevel: 0,
      cascadeRisk: 0,
      preventionActive: false,
      containmentStrength: 0,
      affectedLayers: [],
    };

    this.centeringState = {
      centeringActive: false,
      deviationLevel: 0,
      equilibriumPoint: 50,
      centeringProgress: 0,
      centeringSpeed: this.config.centeringSpeed * 100,
      stabilizationForce: 0,
    };

    this.extremeLoadState = {
      extremeLoadActive: false,
      loadLevel: 0,
      loadType: 'none',
      stressPoints: 0,
      emergencyProtocol: false,
      degradationRisk: 0,
      recoveryCapacity: 100,
    };

    this.flowMetrics = {
      smoothness: 100,
      consistency: 100,
      resilience: 100,
      adaptability: 100,
      overallStability: 100,
    };

    this.spikeHistory = [];
    this.overloadHistory = [];
    this.loadHistory = [];
    this.spikeBuffer = [];
    this.centeringMomentum = 0;
  }

  /**
   * Export state for persistence
   */
  public export() {
    return {
      config: { ...this.config },
      metrics: { ...this.flowMetrics },
      timestamp: Date.now(),
    };
  }

  /**
   * Import configuration
   */
  public import(data: any): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.spikeHistory = [];
    this.overloadHistory = [];
    this.loadHistory = [];
    this.spikeBuffer = [];
  }
}
