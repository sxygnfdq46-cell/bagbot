/**
 * LEVEL 12.1 — PROTECTION REFLEX MATRIX (PRM)
 * 
 * Defensive engine that prevents cascading failures, contains unstable values,
 * and maintains calm precision during high-stress conditions.
 * 
 * Architecture:
 * - Cascading failure prevention (stops failure propagation)
 * - Unstable value containment (quarantines bad data)
 * - Visual storm cancellation (reduces overwhelming effects)
 * - Prediction spike regulation (smooths erratic predictions)
 * - Calm precision maintenance (enforces stability thresholds)
 * 
 * Outputs:
 * - reflexState: Complete protection snapshot
 * - protectionActive: boolean protection engaged
 * - interventionCount: Number of active interventions
 * 
 * PRIVACY: Zero data storage, ephemeral only, real-time protection.
 */

// ================================
// TYPES
// ================================

export type ReflexType = 'cascade' | 'containment' | 'storm' | 'spike' | 'precision';
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type ReflexMode = 'dormant' | 'monitoring' | 'active' | 'emergency';

/**
 * Cascade prevention state
 */
export interface CascadePrevention {
  cascadeDetected: boolean;
  cascadeDepth: number; // 0-10: number of layers affected
  originLayer: string | null; // Which layer started the cascade
  propagationSpeed: number; // 0-100: how fast cascade spreading
  containmentStrength: number; // 0-100: containment force
  breakersTriggered: string[]; // Circuit breakers activated
}

/**
 * Value containment state
 */
export interface ValueContainment {
  unstableValues: Map<string, number>; // Key: value ID, Value: instability score
  quarantineActive: boolean;
  quarantinedCount: number;
  stabilizationAttempts: number;
  successRate: number; // 0-100: stabilization success rate
  leakRisk: number; // 0-100: risk of unstable values escaping
}

/**
 * Visual storm state
 */
export interface VisualStorm {
  stormActive: boolean;
  stormIntensity: number; // 0-100: storm severity
  effectCount: number; // Number of simultaneous effects
  cancellationProgress: number; // 0-100: progress toward calm
  coolingRate: number; // 0-100: how fast storm cooling
  residualTurbulence: number; // 0-100: remaining disturbance
}

/**
 * Prediction spike state
 */
export interface PredictionSpike {
  spikeDetected: boolean;
  spikeAmplitude: number; // 0-100: spike severity
  spikeFrequency: number; // Spikes per second
  smoothingActive: boolean;
  regulationStrength: number; // 0-100: smoothing force
  predictionStability: number; // 0-100: prediction reliability
}

/**
 * Precision maintenance state
 */
export interface PrecisionMaintenance {
  precisionLevel: number; // 0-100: current precision
  calmness: number; // 0-100: system calmness
  focusStrength: number; // 0-100: focus intensity
  distractionLevel: number; // 0-100: distraction intensity
  stabilityThreshold: number; // 0-100: min acceptable stability
  enforcementActive: boolean;
}

/**
 * Reflex intervention
 */
export interface ReflexIntervention {
  timestamp: number;
  type: ReflexType;
  threatLevel: ThreatLevel;
  action: string;
  success: boolean;
  duration: number; // milliseconds
}

/**
 * Protection reflex state
 */
export interface ProtectionReflexState {
  timestamp: number;
  
  // Core components
  cascadePrevention: CascadePrevention;
  valueContainment: ValueContainment;
  visualStorm: VisualStorm;
  predictionSpike: PredictionSpike;
  precisionMaintenance: PrecisionMaintenance;
  
  // Reflex metrics
  reflexMode: ReflexMode;
  threatLevel: ThreatLevel;
  protectionActive: boolean;
  interventionCount: number;
  reflexStrength: number; // 0-100: protection force
  
  // Status
  systemSafe: boolean;
  lastInterventionTimestamp: number;
  activeReflexes: ReflexType[];
}

/**
 * Protection configuration
 */
export interface ProtectionConfig {
  enableProtection: boolean;
  cascadeThreshold: number; // 0-10: max cascade depth
  unstableValueThreshold: number; // 0-100: instability score trigger
  stormIntensityThreshold: number; // 0-100: storm severity trigger
  spikeAmplitudeThreshold: number; // 0-100: spike amplitude trigger
  precisionThreshold: number; // 0-100: min acceptable precision
  interventionStrength: number; // 0-1: how aggressively to intervene
}

// ================================
// PROTECTION REFLEX MATRIX
// ================================

export class ProtectionReflexMatrix {
  private state: ProtectionReflexState;
  private config: ProtectionConfig;
  private interventionHistory: ReflexIntervention[] = [];
  private readonly MAX_INTERVENTIONS = 100;
  
  // Monitoring
  private monitoringActive = false;
  private monitorIntervalId: number | null = null;
  
  constructor(config?: Partial<ProtectionConfig>) {
    this.config = {
      enableProtection: true,
      cascadeThreshold: 3,
      unstableValueThreshold: 70,
      stormIntensityThreshold: 75,
      spikeAmplitudeThreshold: 60,
      precisionThreshold: 60,
      interventionStrength: 0.8,
      ...config,
    };
    
    this.state = this.createDefaultState();
    
    if (typeof window !== 'undefined' && this.config.enableProtection) {
      this.startMonitoring();
    }
  }
  
  /**
   * Create default state
   */
  private createDefaultState(): ProtectionReflexState {
    return {
      timestamp: Date.now(),
      
      cascadePrevention: {
        cascadeDetected: false,
        cascadeDepth: 0,
        originLayer: null,
        propagationSpeed: 0,
        containmentStrength: 0,
        breakersTriggered: [],
      },
      
      valueContainment: {
        unstableValues: new Map(),
        quarantineActive: false,
        quarantinedCount: 0,
        stabilizationAttempts: 0,
        successRate: 100,
        leakRisk: 0,
      },
      
      visualStorm: {
        stormActive: false,
        stormIntensity: 0,
        effectCount: 0,
        cancellationProgress: 100,
        coolingRate: 0,
        residualTurbulence: 0,
      },
      
      predictionSpike: {
        spikeDetected: false,
        spikeAmplitude: 0,
        spikeFrequency: 0,
        smoothingActive: false,
        regulationStrength: 0,
        predictionStability: 100,
      },
      
      precisionMaintenance: {
        precisionLevel: 100,
        calmness: 100,
        focusStrength: 100,
        distractionLevel: 0,
        stabilityThreshold: 60,
        enforcementActive: false,
      },
      
      reflexMode: 'dormant',
      threatLevel: 'none',
      protectionActive: false,
      interventionCount: 0,
      reflexStrength: 0,
      
      systemSafe: true,
      lastInterventionTimestamp: 0,
      activeReflexes: [],
    };
  }
  
  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringActive) return;
    
    this.monitoringActive = true;
    this.monitorIntervalId = window.setInterval(() => {
      this.updateReflexState();
    }, 100); // Check every 100ms
  }
  
  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.monitorIntervalId !== null) {
      clearInterval(this.monitorIntervalId);
      this.monitorIntervalId = null;
    }
    this.monitoringActive = false;
  }
  
  /**
   * Detect cascade
   */
  public detectCascade(layerName: string, depth: number): void {
    if (depth > this.config.cascadeThreshold) {
      const beforeActive = this.state.cascadePrevention.cascadeDetected;
      
      this.state.cascadePrevention.cascadeDetected = true;
      this.state.cascadePrevention.cascadeDepth = depth;
      this.state.cascadePrevention.originLayer = layerName;
      this.state.cascadePrevention.propagationSpeed = Math.min(100, depth * 20);
      
      if (!beforeActive) {
        this.preventCascade();
      }
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Prevent cascade
   */
  private preventCascade(): void {
    const intervention: ReflexIntervention = {
      timestamp: Date.now(),
      type: 'cascade',
      threatLevel: 'high',
      action: 'Triggered circuit breakers',
      success: false,
      duration: 0,
    };
    
    const startTime = Date.now();
    
    // Trigger circuit breakers
    const breakers = [
      'EmotionalOverflow',
      'VisualOverload',
      'PredictionCascade',
      'MemoryPressure',
    ];
    
    breakers.forEach(breaker => {
      if (!this.state.cascadePrevention.breakersTriggered.includes(breaker)) {
        this.state.cascadePrevention.breakersTriggered.push(breaker);
      }
    });
    
    // Apply containment
    this.state.cascadePrevention.containmentStrength = 
      Math.round(this.config.interventionStrength * 100);
    
    // Reset cascade state
    setTimeout(() => {
      this.state.cascadePrevention.cascadeDetected = false;
      this.state.cascadePrevention.cascadeDepth = 0;
      this.state.cascadePrevention.originLayer = null;
      this.state.cascadePrevention.propagationSpeed = 0;
      this.state.cascadePrevention.containmentStrength = 0;
      this.state.cascadePrevention.breakersTriggered = [];
    }, 2000);
    
    intervention.success = true;
    intervention.duration = Date.now() - startTime;
    this.recordIntervention(intervention);
  }
  
  /**
   * Quarantine unstable value
   */
  public quarantineValue(valueId: string, instabilityScore: number): void {
    if (instabilityScore > this.config.unstableValueThreshold) {
      this.state.valueContainment.unstableValues.set(valueId, instabilityScore);
      this.state.valueContainment.quarantinedCount = this.state.valueContainment.unstableValues.size;
      this.state.valueContainment.quarantineActive = true;
      
      // Attempt stabilization
      this.attemptStabilization(valueId);
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Attempt stabilization
   */
  private attemptStabilization(valueId: string): void {
    this.state.valueContainment.stabilizationAttempts++;
    
    const instabilityScore = this.state.valueContainment.unstableValues.get(valueId);
    if (!instabilityScore) return;
    
    // Apply stabilization force
    const stabilized = instabilityScore * (1 - this.config.interventionStrength);
    
    if (stabilized < this.config.unstableValueThreshold) {
      // Stabilization successful
      this.state.valueContainment.unstableValues.delete(valueId);
      this.state.valueContainment.quarantinedCount = this.state.valueContainment.unstableValues.size;
      
      // Update success rate
      this.state.valueContainment.successRate = Math.min(100, this.state.valueContainment.successRate + 1);
      
      const intervention: ReflexIntervention = {
        timestamp: Date.now(),
        type: 'containment',
        threatLevel: 'medium',
        action: `Stabilized value ${valueId}`,
        success: true,
        duration: 0,
      };
      this.recordIntervention(intervention);
    }
    
    // Calculate leak risk
    const avgInstability = Array.from(this.state.valueContainment.unstableValues.values())
      .reduce((sum, val) => sum + val, 0) / (this.state.valueContainment.unstableValues.size || 1);
    
    this.state.valueContainment.leakRisk = Math.min(100, avgInstability);
  }
  
  /**
   * Cancel visual storm
   */
  public cancelStorm(intensity: number, effectCount: number): void {
    if (intensity > this.config.stormIntensityThreshold) {
      this.state.visualStorm.stormActive = true;
      this.state.visualStorm.stormIntensity = intensity;
      this.state.visualStorm.effectCount = effectCount;
      this.state.visualStorm.cancellationProgress = 0;
      
      this.initiateStormCancellation();
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Initiate storm cancellation
   */
  private initiateStormCancellation(): void {
    const intervention: ReflexIntervention = {
      timestamp: Date.now(),
      type: 'storm',
      threatLevel: 'high',
      action: 'Initiated storm cancellation',
      success: false,
      duration: 0,
    };
    
    const startTime = Date.now();
    
    // Gradually cancel storm
    const cancelStep = () => {
      if (this.state.visualStorm.cancellationProgress < 100) {
        this.state.visualStorm.cancellationProgress += 10;
        this.state.visualStorm.stormIntensity *= 0.85;
        this.state.visualStorm.coolingRate = 100 - this.state.visualStorm.stormIntensity;
        
        setTimeout(cancelStep, 200);
      } else {
        // Storm cancelled
        this.state.visualStorm.stormActive = false;
        this.state.visualStorm.stormIntensity = 0;
        this.state.visualStorm.effectCount = 0;
        this.state.visualStorm.coolingRate = 0;
        this.state.visualStorm.residualTurbulence = 10; // Small residual
        
        // Clear residual over time
        setTimeout(() => {
          this.state.visualStorm.residualTurbulence = 0;
        }, 1000);
        
        intervention.success = true;
        intervention.duration = Date.now() - startTime;
        this.recordIntervention(intervention);
      }
    };
    
    cancelStep();
  }
  
  /**
   * Regulate prediction spike
   */
  public regulateSpike(amplitude: number, frequency: number): void {
    if (amplitude > this.config.spikeAmplitudeThreshold) {
      this.state.predictionSpike.spikeDetected = true;
      this.state.predictionSpike.spikeAmplitude = amplitude;
      this.state.predictionSpike.spikeFrequency = frequency;
      this.state.predictionSpike.smoothingActive = true;
      
      this.applySpikeSmoothing(amplitude);
    } else {
      this.state.predictionSpike.spikeDetected = false;
      this.state.predictionSpike.smoothingActive = false;
      this.state.predictionSpike.regulationStrength = 0;
    }
    
    // Update prediction stability
    this.state.predictionSpike.predictionStability = 
      Math.max(0, 100 - amplitude);
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Apply spike smoothing
   */
  private applySpikeSmoothing(amplitude: number): void {
    this.state.predictionSpike.regulationStrength = 
      Math.min(100, amplitude * this.config.interventionStrength);
    
    const intervention: ReflexIntervention = {
      timestamp: Date.now(),
      type: 'spike',
      threatLevel: amplitude > 80 ? 'high' : 'medium',
      action: 'Applied spike smoothing',
      success: true,
      duration: 0,
    };
    
    this.recordIntervention(intervention);
  }
  
  /**
   * Enforce precision threshold
   */
  public enforcePrecision(currentPrecision: number, calmness: number): void {
    this.state.precisionMaintenance.precisionLevel = currentPrecision;
    this.state.precisionMaintenance.calmness = calmness;
    
    if (currentPrecision < this.config.precisionThreshold) {
      this.state.precisionMaintenance.enforcementActive = true;
      this.state.precisionMaintenance.focusStrength = 
        Math.round((this.config.precisionThreshold - currentPrecision) * 2);
      
      this.boostPrecision();
    } else {
      this.state.precisionMaintenance.enforcementActive = false;
      this.state.precisionMaintenance.focusStrength = 0;
    }
    
    // Calculate distraction level
    this.state.precisionMaintenance.distractionLevel = 100 - calmness;
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Boost precision
   */
  private boostPrecision(): void {
    const intervention: ReflexIntervention = {
      timestamp: Date.now(),
      type: 'precision',
      threatLevel: 'low',
      action: 'Boosted focus precision',
      success: true,
      duration: 0,
    };
    
    this.recordIntervention(intervention);
  }
  
  /**
   * Update reflex state
   */
  private updateReflexState(): void {
    // Count active reflexes
    const activeReflexes: ReflexType[] = [];
    
    if (this.state.cascadePrevention.cascadeDetected) activeReflexes.push('cascade');
    if (this.state.valueContainment.quarantineActive) activeReflexes.push('containment');
    if (this.state.visualStorm.stormActive) activeReflexes.push('storm');
    if (this.state.predictionSpike.spikeDetected) activeReflexes.push('spike');
    if (this.state.precisionMaintenance.enforcementActive) activeReflexes.push('precision');
    
    this.state.activeReflexes = activeReflexes;
    this.state.interventionCount = activeReflexes.length;
    this.state.protectionActive = activeReflexes.length > 0;
    
    // Determine threat level
    if (this.state.cascadePrevention.cascadeDetected) {
      this.state.threatLevel = 'critical';
    } else if (this.state.visualStorm.stormActive) {
      this.state.threatLevel = 'high';
    } else if (this.state.valueContainment.quarantineActive || this.state.predictionSpike.spikeDetected) {
      this.state.threatLevel = 'medium';
    } else if (this.state.precisionMaintenance.enforcementActive) {
      this.state.threatLevel = 'low';
    } else {
      this.state.threatLevel = 'none';
    }
    
    // Determine reflex mode
    if (this.state.threatLevel === 'critical') {
      this.state.reflexMode = 'emergency';
    } else if (this.state.protectionActive) {
      this.state.reflexMode = 'active';
    } else if (this.monitoringActive) {
      this.state.reflexMode = 'monitoring';
    } else {
      this.state.reflexMode = 'dormant';
    }
    
    // Calculate reflex strength
    const threatLevelMap = { none: 0, low: 25, medium: 50, high: 75, critical: 100 };
    this.state.reflexStrength = threatLevelMap[this.state.threatLevel];
    
    // Determine system safety
    this.state.systemSafe = 
      this.state.threatLevel === 'none' || this.state.threatLevel === 'low';
  }
  
  /**
   * Record intervention
   */
  private recordIntervention(intervention: ReflexIntervention): void {
    this.interventionHistory.push(intervention);
    
    if (this.interventionHistory.length > this.MAX_INTERVENTIONS) {
      this.interventionHistory.shift();
    }
    
    this.state.lastInterventionTimestamp = Date.now();
  }
  
  /**
   * Get current state
   */
  public getState(): ProtectionReflexState {
    return { ...this.state };
  }
  
  /**
   * Get summary
   */
  public getSummary(): string {
    return `Protection Reflex: ${this.state.reflexMode} | Threat: ${this.state.threatLevel} | Active: ${this.state.interventionCount} reflexes | Safe: ${this.state.systemSafe}`;
  }
  
  /**
   * Get recent interventions
   */
  public getRecentInterventions(count = 10): ReflexIntervention[] {
    return this.interventionHistory.slice(-count);
  }
  
  /**
   * Reset state
   */
  public reset(): void {
    this.state = this.createDefaultState();
    this.interventionHistory = [];
  }
  
  /**
   * Export state
   */
  public export(): string {
    return JSON.stringify({
      state: this.state,
      config: this.config,
      interventionHistory: this.interventionHistory,
    });
  }
  
  /**
   * Import state
   */
  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.state = parsed.state;
      this.config = parsed.config;
      this.interventionHistory = parsed.interventionHistory || [];
    } catch (error) {
      console.error('ProtectionReflexMatrix: Failed to import state', error);
    }
  }
  
  /**
   * Destroy instance
   */
  public destroy(): void {
    this.stopMonitoring();
    this.reset();
  }
}
