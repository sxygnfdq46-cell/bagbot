/**
 * LEVEL 12.1 — GUARDIAN STATE CORE (GSC)
 * 
 * The stabilizing nervous system across ALL layers (Levels 1-11.5).
 * Monitors, protects, balances, and self-corrects the entire AI system in real-time.
 * 
 * Architecture:
 * - System load tracking (CPU, memory, FPS, latency)
 * - Emotional overflow prevention (intensity caps, decay triggers)
 * - Extreme state normalization (overclock, hyperspace, storm modes)
 * - Multi-channel signal stabilization (reduces noise, smooths spikes)
 * - Integrity monitoring (detects anomalies, prevents cascades)
 * 
 * Outputs:
 * - guardianState: Complete stability snapshot
 * - integrityScore: 0-100 overall system health
 * - protectionLevel: none/low/medium/high/critical
 * 
 * PRIVACY: Zero data storage, ephemeral only, real-time monitoring.
 */

// ================================
// TYPES
// ================================

export type ProtectionLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type SystemPhase = 'idle' | 'active' | 'stressed' | 'overloaded' | 'recovering';
export type StabilityMode = 'passive' | 'reactive' | 'protective' | 'emergency';

/**
 * System load metrics
 */
export interface SystemLoad {
  cpuUsage: number; // 0-100: estimated CPU usage
  memoryPressure: number; // 0-100: memory stress level
  fps: number; // Current frames per second
  latency: number; // Milliseconds average response time
  renderLoad: number; // 0-100: GPU/render thread load
  networkActivity: number; // 0-100: network request intensity
}

/**
 * Emotional overflow state
 */
export interface EmotionalOverflow {
  intensityLevel: number; // 0-100: current emotional intensity
  stabilityThreshold: number; // 0-100: threshold before overflow
  overflowRisk: number; // 0-100: risk of emotional overflow
  decayRate: number; // 0-1: how fast emotions decay
  activeEmotions: string[]; // Currently active emotions
  suppressedEmotions: string[]; // Emotions being dampened
}

/**
 * Extreme state detection
 */
export interface ExtremeState {
  isOverclocked: boolean; // System running beyond safe limits
  isHyperspace: boolean; // Ultra-high processing mode active
  isStormMode: boolean; // Visual storm effects active
  isCascading: boolean; // Failure cascade in progress
  extremeIntensity: number; // 0-100: severity of extreme state
  normalizationProgress: number; // 0-100: progress toward normal
}

/**
 * Signal stability
 */
export interface SignalStability {
  noiseLevel: number; // 0-100: signal noise
  coherence: number; // 0-100: signal coherence
  smoothness: number; // 0-100: transition smoothness
  peakCount: number; // Number of signal spikes in last period
  averageAmplitude: number; // Average signal strength
  stabilizationStrength: number; // 0-100: stabilization force applied
}

/**
 * Integrity monitoring
 */
export interface IntegrityMonitoring {
  systemIntegrity: number; // 0-100: overall system health
  layerCoherence: number; // 0-100: cross-layer alignment
  anomalyCount: number; // Number of detected anomalies
  cascadeRisk: number; // 0-100: risk of cascading failure
  selfCorrectionActive: boolean; // Is self-correction running
  lastAnomalyTimestamp: number; // When last anomaly detected
}

/**
 * Guardian state (complete snapshot)
 */
export interface GuardianState {
  timestamp: number;
  
  // Core metrics
  systemLoad: SystemLoad;
  emotionalOverflow: EmotionalOverflow;
  extremeState: ExtremeState;
  signalStability: SignalStability;
  integrityMonitoring: IntegrityMonitoring;
  
  // Guardian metrics
  protectionLevel: ProtectionLevel;
  systemPhase: SystemPhase;
  stabilityMode: StabilityMode;
  integrityScore: number; // 0-100: unified health score
  guardianStrength: number; // 0-100: protection intensity
  
  // Balance state
  isBalanced: boolean;
  balanceScore: number; // 0-100: how balanced system is
  stabilizationActive: boolean;
  lastInterventionTimestamp: number;
}

/**
 * Guardian configuration
 */
export interface GuardianConfig {
  enableProtection: boolean;
  emotionalIntensityCap: number; // 0-100: max allowed intensity
  fpsThreshold: number; // Minimum acceptable FPS
  latencyThreshold: number; // Maximum acceptable latency (ms)
  anomalyThreshold: number; // Max anomalies before intervention
  stabilizationStrength: number; // 0-1: how aggressively to stabilize
  selfCorrectionEnabled: boolean;
  cascadePreventionEnabled: boolean;
}

/**
 * Guardian intervention record
 */
export interface GuardianIntervention {
  timestamp: number;
  type: 'emotional' | 'performance' | 'cascade' | 'extreme' | 'signal';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  action: string;
  beforeState: Partial<GuardianState>;
  afterState: Partial<GuardianState>;
}

// ================================
// GUARDIAN STATE CORE
// ================================

export class GuardianStateCore {
  private state: GuardianState;
  private config: GuardianConfig;
  private interventionHistory: GuardianIntervention[] = [];
  private readonly MAX_INTERVENTIONS = 100;
  
  // Performance monitoring
  private fpsHistory: number[] = [];
  private latencyHistory: number[] = [];
  private readonly MAX_HISTORY = 60; // 60 seconds at 1s intervals
  
  // Signal tracking
  private signalBuffer: number[] = [];
  private readonly SIGNAL_BUFFER_SIZE = 30;
  
  // Anomaly detection
  private anomalyLog: Array<{ timestamp: number; type: string }> = [];
  
  // RAF loop
  private rafId: number | null = null;
  private lastFrameTime = 0;
  
  constructor(config?: Partial<GuardianConfig>) {
    this.config = {
      enableProtection: true,
      emotionalIntensityCap: 85,
      fpsThreshold: 30,
      latencyThreshold: 100,
      anomalyThreshold: 5,
      stabilizationStrength: 0.7,
      selfCorrectionEnabled: true,
      cascadePreventionEnabled: true,
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
  private createDefaultState(): GuardianState {
    return {
      timestamp: Date.now(),
      
      systemLoad: {
        cpuUsage: 0,
        memoryPressure: 0,
        fps: 60,
        latency: 0,
        renderLoad: 0,
        networkActivity: 0,
      },
      
      emotionalOverflow: {
        intensityLevel: 0,
        stabilityThreshold: 80,
        overflowRisk: 0,
        decayRate: 0.95,
        activeEmotions: [],
        suppressedEmotions: [],
      },
      
      extremeState: {
        isOverclocked: false,
        isHyperspace: false,
        isStormMode: false,
        isCascading: false,
        extremeIntensity: 0,
        normalizationProgress: 100,
      },
      
      signalStability: {
        noiseLevel: 0,
        coherence: 100,
        smoothness: 100,
        peakCount: 0,
        averageAmplitude: 50,
        stabilizationStrength: 0,
      },
      
      integrityMonitoring: {
        systemIntegrity: 100,
        layerCoherence: 100,
        anomalyCount: 0,
        cascadeRisk: 0,
        selfCorrectionActive: false,
        lastAnomalyTimestamp: 0,
      },
      
      protectionLevel: 'none',
      systemPhase: 'idle',
      stabilityMode: 'passive',
      integrityScore: 100,
      guardianStrength: 0,
      
      isBalanced: true,
      balanceScore: 100,
      stabilizationActive: false,
      lastInterventionTimestamp: 0,
    };
  }
  
  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    if (this.rafId !== null) return;
    
    const monitor = (timestamp: number) => {
      // Calculate FPS
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        const fps = Math.round(1000 / delta);
        this.updateFPS(fps);
      }
      this.lastFrameTime = timestamp;
      
      // Update system load
      this.updateSystemLoad();
      
      // Check for interventions
      this.checkInterventions();
      
      // Continue monitoring
      this.rafId = requestAnimationFrame(monitor);
    };
    
    this.rafId = requestAnimationFrame(monitor);
    
    // Periodic integrity checks
    setInterval(() => this.performIntegrityCheck(), 1000);
  }
  
  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  /**
   * Update FPS tracking
   */
  private updateFPS(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.MAX_HISTORY) {
      this.fpsHistory.shift();
    }
    
    const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
    this.state.systemLoad.fps = Math.round(avgFPS);
    
    // Detect performance issues
    if (avgFPS < this.config.fpsThreshold) {
      this.recordAnomaly('low-fps');
    }
  }
  
  /**
   * Update system load metrics
   */
  private updateSystemLoad(): void {
    // Estimate CPU usage from FPS drop
    const fpsRatio = this.state.systemLoad.fps / 60;
    this.state.systemLoad.cpuUsage = Math.round((1 - fpsRatio) * 100);
    
    // Estimate memory pressure (browser-specific)
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      this.state.systemLoad.memoryPressure = Math.round(usedRatio * 100);
    }
    
    // Estimate render load
    this.state.systemLoad.renderLoad = Math.min(
      100,
      this.state.systemLoad.cpuUsage + this.state.emotionalOverflow.intensityLevel / 2
    );
  }
  
  /**
   * Update emotional overflow state
   */
  public updateEmotionalState(emotion: string, intensity: number): void {
    const beforeState = { ...this.state };
    
    // Add to active emotions
    if (!this.state.emotionalOverflow.activeEmotions.includes(emotion)) {
      this.state.emotionalOverflow.activeEmotions.push(emotion);
    }
    
    // Update intensity
    this.state.emotionalOverflow.intensityLevel = Math.min(
      this.config.emotionalIntensityCap,
      intensity
    );
    
    // Calculate overflow risk
    const threshold = this.state.emotionalOverflow.stabilityThreshold;
    this.state.emotionalOverflow.overflowRisk = Math.max(
      0,
      ((intensity - threshold) / (100 - threshold)) * 100
    );
    
    // Suppress emotion if intensity too high
    if (intensity > this.config.emotionalIntensityCap) {
      if (!this.state.emotionalOverflow.suppressedEmotions.includes(emotion)) {
        this.state.emotionalOverflow.suppressedEmotions.push(emotion);
      }
      
      this.recordIntervention('emotional', 'moderate', 'Capped emotional intensity', beforeState);
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Update extreme state detection
   */
  public updateExtremeState(type: 'overclock' | 'hyperspace' | 'storm', active: boolean): void {
    const beforeState = { ...this.state };
    
    if (type === 'overclock') this.state.extremeState.isOverclocked = active;
    if (type === 'hyperspace') this.state.extremeState.isHyperspace = active;
    if (type === 'storm') this.state.extremeState.isStormMode = active;
    
    // Calculate extreme intensity
    const extremeCount = [
      this.state.extremeState.isOverclocked,
      this.state.extremeState.isHyperspace,
      this.state.extremeState.isStormMode,
    ].filter(Boolean).length;
    
    this.state.extremeState.extremeIntensity = (extremeCount / 3) * 100;
    
    // Trigger normalization if too extreme
    if (extremeCount >= 2 && this.config.selfCorrectionEnabled) {
      this.normalizeExtremeState();
      this.recordIntervention('extreme', 'major', 'Normalized extreme state', beforeState);
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Normalize extreme state
   */
  private normalizeExtremeState(): void {
    // Gradually bring system back to normal
    const normalizeStep = () => {
      if (this.state.extremeState.normalizationProgress < 100) {
        this.state.extremeState.normalizationProgress += 5;
        
        // Reduce extreme flags as we normalize
        if (this.state.extremeState.normalizationProgress > 50) {
          this.state.extremeState.isStormMode = false;
        }
        if (this.state.extremeState.normalizationProgress > 75) {
          this.state.extremeState.isHyperspace = false;
        }
        if (this.state.extremeState.normalizationProgress >= 100) {
          this.state.extremeState.isOverclocked = false;
          this.state.extremeState.extremeIntensity = 0;
        }
        
        setTimeout(normalizeStep, 100);
      }
    };
    
    normalizeStep();
  }
  
  /**
   * Update signal stability
   */
  public updateSignal(value: number): void {
    this.signalBuffer.push(value);
    if (this.signalBuffer.length > this.SIGNAL_BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    // Calculate noise level
    const mean = this.signalBuffer.reduce((a, b) => a + b, 0) / this.signalBuffer.length;
    const variance = this.signalBuffer.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.signalBuffer.length;
    this.state.signalStability.noiseLevel = Math.min(100, Math.sqrt(variance));
    
    // Calculate coherence (inverse of noise)
    this.state.signalStability.coherence = 100 - this.state.signalStability.noiseLevel;
    
    // Count peaks
    let peakCount = 0;
    for (let i = 1; i < this.signalBuffer.length - 1; i++) {
      if (
        this.signalBuffer[i] > this.signalBuffer[i - 1] &&
        this.signalBuffer[i] > this.signalBuffer[i + 1]
      ) {
        peakCount++;
      }
    }
    this.state.signalStability.peakCount = peakCount;
    
    // Average amplitude
    this.state.signalStability.averageAmplitude = mean;
    
    // Apply stabilization if noise too high
    if (this.state.signalStability.noiseLevel > 30) {
      this.state.signalStability.stabilizationStrength = this.config.stabilizationStrength * 100;
      this.state.stabilizationActive = true;
    } else {
      this.state.signalStability.stabilizationStrength = 0;
      this.state.stabilizationActive = false;
    }
    
    this.state.timestamp = Date.now();
  }
  
  /**
   * Perform integrity check
   */
  private performIntegrityCheck(): void {
    // Count recent anomalies (last 60 seconds)
    const recentAnomalies = this.anomalyLog.filter(
      a => Date.now() - a.timestamp < 60000
    );
    this.state.integrityMonitoring.anomalyCount = recentAnomalies.length;
    
    // Calculate system integrity
    const fpsHealth = (this.state.systemLoad.fps / 60) * 100;
    const memoryHealth = 100 - this.state.systemLoad.memoryPressure;
    const emotionalHealth = 100 - this.state.emotionalOverflow.overflowRisk;
    const signalHealth = this.state.signalStability.coherence;
    
    this.state.integrityMonitoring.systemIntegrity = Math.round(
      (fpsHealth + memoryHealth + emotionalHealth + signalHealth) / 4
    );
    
    // Calculate layer coherence (how well all layers align)
    const extremePenalty = this.state.extremeState.extremeIntensity;
    const anomalyPenalty = Math.min(50, this.state.integrityMonitoring.anomalyCount * 10);
    this.state.integrityMonitoring.layerCoherence = Math.max(
      0,
      100 - extremePenalty - anomalyPenalty
    );
    
    // Calculate cascade risk
    if (
      this.state.integrityMonitoring.anomalyCount > this.config.anomalyThreshold &&
      this.state.systemLoad.fps < this.config.fpsThreshold
    ) {
      this.state.integrityMonitoring.cascadeRisk = Math.min(
        100,
        (this.state.integrityMonitoring.anomalyCount * 10) + (60 - this.state.systemLoad.fps)
      );
    } else {
      this.state.integrityMonitoring.cascadeRisk = 0;
    }
    
    // Detect cascade
    if (this.state.integrityMonitoring.cascadeRisk > 60) {
      this.state.extremeState.isCascading = true;
      if (this.config.cascadePreventionEnabled) {
        this.preventCascade();
      }
    } else {
      this.state.extremeState.isCascading = false;
    }
    
    // Calculate unified integrity score
    this.state.integrityScore = Math.round(
      (this.state.integrityMonitoring.systemIntegrity + 
       this.state.integrityMonitoring.layerCoherence) / 2
    );
  }
  
  /**
   * Prevent cascading failure
   */
  private preventCascade(): void {
    const beforeState = { ...this.state };
    
    this.state.integrityMonitoring.selfCorrectionActive = true;
    
    // Emergency measures
    this.state.emotionalOverflow.intensityLevel *= 0.5; // Halve emotional intensity
    this.state.extremeState.isStormMode = false; // Cancel storm
    this.state.extremeState.isHyperspace = false; // Exit hyperspace
    this.state.systemLoad.renderLoad = Math.min(50, this.state.systemLoad.renderLoad); // Cap render load
    
    // Clear anomaly log
    this.anomalyLog = [];
    this.state.integrityMonitoring.anomalyCount = 0;
    this.state.integrityMonitoring.cascadeRisk = 0;
    
    this.recordIntervention('cascade', 'critical', 'Prevented cascading failure', beforeState);
    
    // Deactivate self-correction after 5 seconds
    setTimeout(() => {
      this.state.integrityMonitoring.selfCorrectionActive = false;
    }, 5000);
  }
  
  /**
   * Check for interventions
   */
  private checkInterventions(): void {
    // Determine protection level
    if (this.state.integrityMonitoring.cascadeRisk > 60) {
      this.state.protectionLevel = 'critical';
    } else if (this.state.integrityMonitoring.anomalyCount > this.config.anomalyThreshold) {
      this.state.protectionLevel = 'high';
    } else if (this.state.emotionalOverflow.overflowRisk > 50) {
      this.state.protectionLevel = 'medium';
    } else if (this.state.signalStability.noiseLevel > 30) {
      this.state.protectionLevel = 'low';
    } else {
      this.state.protectionLevel = 'none';
    }
    
    // Determine system phase
    if (this.state.extremeState.isCascading) {
      this.state.systemPhase = 'overloaded';
    } else if (this.state.systemLoad.cpuUsage > 70) {
      this.state.systemPhase = 'stressed';
    } else if (this.state.emotionalOverflow.intensityLevel > 50) {
      this.state.systemPhase = 'active';
    } else if (this.state.integrityMonitoring.selfCorrectionActive) {
      this.state.systemPhase = 'recovering';
    } else {
      this.state.systemPhase = 'idle';
    }
    
    // Determine stability mode
    if (this.state.protectionLevel === 'critical') {
      this.state.stabilityMode = 'emergency';
    } else if (this.state.protectionLevel === 'high') {
      this.state.stabilityMode = 'protective';
    } else if (this.state.protectionLevel === 'medium' || this.state.protectionLevel === 'low') {
      this.state.stabilityMode = 'reactive';
    } else {
      this.state.stabilityMode = 'passive';
    }
    
    // Calculate guardian strength
    const protectionLevelMap = { none: 0, low: 25, medium: 50, high: 75, critical: 100 };
    this.state.guardianStrength = protectionLevelMap[this.state.protectionLevel];
    
    // Calculate balance score
    this.state.balanceScore = Math.round(
      (this.state.integrityScore + 
       (100 - this.state.emotionalOverflow.overflowRisk) + 
       this.state.signalStability.coherence) / 3
    );
    
    this.state.isBalanced = this.state.balanceScore > 70;
  }
  
  /**
   * Record anomaly
   */
  private recordAnomaly(type: string): void {
    this.anomalyLog.push({ timestamp: Date.now(), type });
    
    // Limit log size
    if (this.anomalyLog.length > 100) {
      this.anomalyLog.shift();
    }
    
    this.state.integrityMonitoring.lastAnomalyTimestamp = Date.now();
  }
  
  /**
   * Record intervention
   */
  private recordIntervention(
    type: GuardianIntervention['type'],
    severity: GuardianIntervention['severity'],
    action: string,
    beforeState: Partial<GuardianState>
  ): void {
    this.interventionHistory.push({
      timestamp: Date.now(),
      type,
      severity,
      action,
      beforeState,
      afterState: { ...this.state },
    });
    
    if (this.interventionHistory.length > this.MAX_INTERVENTIONS) {
      this.interventionHistory.shift();
    }
    
    this.state.lastInterventionTimestamp = Date.now();
  }
  
  /**
   * Get current state
   */
  public getState(): GuardianState {
    return { ...this.state };
  }
  
  /**
   * Get summary
   */
  public getSummary(): string {
    return `Guardian State: ${this.state.systemPhase} | Protection: ${this.state.protectionLevel} | Integrity: ${this.state.integrityScore}% | Balance: ${this.state.balanceScore}%`;
  }
  
  /**
   * Get recent interventions
   */
  public getRecentInterventions(count = 10): GuardianIntervention[] {
    return this.interventionHistory.slice(-count);
  }
  
  /**
   * Reset state
   */
  public reset(): void {
    this.state = this.createDefaultState();
    this.interventionHistory = [];
    this.fpsHistory = [];
    this.latencyHistory = [];
    this.signalBuffer = [];
    this.anomalyLog = [];
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
      console.error('GuardianStateCore: Failed to import state', error);
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
