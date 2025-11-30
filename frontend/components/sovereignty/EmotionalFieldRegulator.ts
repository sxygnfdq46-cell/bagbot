/**
 * LEVEL 12.2 — EMOTIONAL FIELD REGULATOR
 * 
 * Emotional-bandwidth limiter, intensity governor, overflow damping curves,
 * stress-load compensation, state-smoothing algorithm, adaptive stabilization hooks.
 * 
 * Core Responsibilities:
 * - Bandwidth limiting: Prevent emotional state changes from exceeding safe rates
 * - Intensity governance: Cap emotional peaks while preserving authenticity
 * - Overflow damping: Apply exponential decay curves to excessive intensity
 * - Stress compensation: Adjust bandwidth based on system load
 * - State smoothing: Apply rolling averages for stable emotional transitions
 * - Adaptive stabilization: Dynamic response to emotional volatility
 * 
 * Zero data storage. Ephemeral only.
 */

export interface EmotionalBandwidth {
  maxChangeRate: number; // 0-100, max intensity change per second
  currentChangeRate: number; // 0-100, actual change rate
  bandwidthUtilization: number; // 0-100, percentage of max bandwidth used
  rateLimitActive: boolean;
  throttledChanges: number; // Count of throttled changes
  adaptiveCapacity: number; // 0-100, dynamic bandwidth adjustment
}

export interface IntensityGovernance {
  maxIntensity: number; // 0-100, absolute ceiling
  currentIntensity: number; // 0-100
  peakIntensity: number; // 0-100, highest reached in session
  governorActive: boolean;
  cappedEvents: number; // Count of capped intensity spikes
  targetIntensity: number; // 0-100, ideal intensity level
  intensityMargin: number; // 0-100, buffer before capping
}

export interface OverflowDamping {
  dampingActive: boolean;
  dampingStrength: number; // 0-100, intensity of damping
  overflowLevel: number; // 0-100, how much over limit
  decayCurve: 'linear' | 'exponential' | 'logarithmic' | 'sigmoid';
  decayRate: number; // 0-1, speed of decay
  residualOverflow: number; // 0-100, remaining overflow after damping
}

export interface StressCompensation {
  systemStress: number; // 0-100, overall system stress
  cpuLoad: number; // 0-100
  memoryPressure: number; // 0-100
  emotionalLoad: number; // 0-100
  compensationActive: boolean;
  bandwidthReduction: number; // 0-100, percentage reduction
  stressThreshold: number; // 0-100, when to activate
}

export interface StateSmoothing {
  smoothingActive: boolean;
  smoothingWindow: number; // milliseconds, rolling window size
  smoothingStrength: number; // 0-1, blend factor
  historyBuffer: Array<{ value: number; timestamp: number }>;
  smoothedValue: number; // 0-100
  variance: number; // 0-100, measure of volatility
}

export interface AdaptiveStabilization {
  stabilizationActive: boolean;
  volatilityLevel: number; // 0-100, detected volatility
  stabilizationStrength: number; // 0-100, response strength
  adaptiveMode: 'passive' | 'reactive' | 'aggressive' | 'emergency';
  learningRate: number; // 0-1, adaptation speed
  stabilityScore: number; // 0-100, overall stability
}

export interface EmotionalFieldConfig {
  maxChangeRate: number; // Max bandwidth
  maxIntensity: number; // Intensity ceiling
  decayRate: number; // Overflow decay speed
  stressThreshold: number; // Stress compensation trigger
  smoothingWindow: number; // Smoothing buffer size (ms)
  smoothingStrength: number; // Smoothing blend factor
  adaptiveLearningRate: number; // Adaptation speed
}

export class EmotionalFieldRegulator {
  private bandwidth: EmotionalBandwidth;
  private governance: IntensityGovernance;
  private damping: OverflowDamping;
  private compensation: StressCompensation;
  private smoothing: StateSmoothing;
  private stabilization: AdaptiveStabilization;
  private config: EmotionalFieldConfig;

  // History tracking
  private intensityHistory: Array<{ value: number; timestamp: number }> = [];
  private changeRateHistory: number[] = [];
  private lastUpdateTime: number = Date.now();
  private lastIntensity: number = 50;

  // Monitoring
  private monitoringInterval: number | null = null;
  private readonly HISTORY_SIZE = 100;
  private readonly UPDATE_INTERVAL = 50; // 50ms = 20 updates/second

  constructor(config?: Partial<EmotionalFieldConfig>) {
    this.config = {
      maxChangeRate: 30, // 30 intensity units per second
      maxIntensity: 90, // Cap at 90 to preserve margin
      decayRate: 0.85, // 15% decay per cycle
      stressThreshold: 70, // Activate compensation at 70% stress
      smoothingWindow: 1000, // 1 second rolling window
      smoothingStrength: 0.6, // 60% smoothing
      adaptiveLearningRate: 0.1, // 10% learning rate
      ...config,
    };

    this.bandwidth = {
      maxChangeRate: this.config.maxChangeRate,
      currentChangeRate: 0,
      bandwidthUtilization: 0,
      rateLimitActive: false,
      throttledChanges: 0,
      adaptiveCapacity: 100,
    };

    this.governance = {
      maxIntensity: this.config.maxIntensity,
      currentIntensity: 50,
      peakIntensity: 50,
      governorActive: false,
      cappedEvents: 0,
      targetIntensity: 50,
      intensityMargin: 10,
    };

    this.damping = {
      dampingActive: false,
      dampingStrength: 0,
      overflowLevel: 0,
      decayCurve: 'exponential',
      decayRate: this.config.decayRate,
      residualOverflow: 0,
    };

    this.compensation = {
      systemStress: 0,
      cpuLoad: 0,
      memoryPressure: 0,
      emotionalLoad: 0,
      compensationActive: false,
      bandwidthReduction: 0,
      stressThreshold: this.config.stressThreshold,
    };

    this.smoothing = {
      smoothingActive: true,
      smoothingWindow: this.config.smoothingWindow,
      smoothingStrength: this.config.smoothingStrength,
      historyBuffer: [],
      smoothedValue: 50,
      variance: 0,
    };

    this.stabilization = {
      stabilizationActive: false,
      volatilityLevel: 0,
      stabilizationStrength: 0,
      adaptiveMode: 'passive',
      learningRate: this.config.adaptiveLearningRate,
      stabilityScore: 100,
    };

    this.startMonitoring();
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringInterval = window.setInterval(() => {
      this.updateRegulatorState();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Update all regulator subsystems
   */
  private updateRegulatorState(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = now;

    // Update bandwidth utilization
    this.updateBandwidthUtilization(deltaTime);

    // Apply overflow damping
    if (this.damping.dampingActive) {
      this.applyOverflowDamping(deltaTime);
    }

    // Update stress compensation
    this.updateStressCompensation();

    // Apply state smoothing
    this.applyStateSmoothing();

    // Update adaptive stabilization
    this.updateAdaptiveStabilization();

    // Clean old history
    this.cleanHistory(now);
  }

  /**
   * Regulate emotional intensity with bandwidth limiting and governance
   */
  public regulateIntensity(rawIntensity: number): number {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / 1000;

    // Step 1: Calculate change rate
    const intensityChange = Math.abs(rawIntensity - this.lastIntensity);
    const changeRate = deltaTime > 0 ? intensityChange / deltaTime : 0;

    // Step 2: Apply bandwidth limiting
    let regulatedIntensity = rawIntensity;
    const adjustedMaxRate = this.bandwidth.maxChangeRate * (this.bandwidth.adaptiveCapacity / 100);

    if (changeRate > adjustedMaxRate) {
      // Throttle change to max rate
      const maxChange = adjustedMaxRate * deltaTime;
      const direction = rawIntensity > this.lastIntensity ? 1 : -1;
      regulatedIntensity = this.lastIntensity + (maxChange * direction);
      
      this.bandwidth.rateLimitActive = true;
      this.bandwidth.throttledChanges++;
    } else {
      this.bandwidth.rateLimitActive = false;
    }

    // Step 3: Apply intensity governance
    if (regulatedIntensity > this.governance.maxIntensity) {
      regulatedIntensity = this.governance.maxIntensity;
      this.governance.governorActive = true;
      this.governance.cappedEvents++;
      
      // Activate overflow damping
      this.damping.overflowLevel = rawIntensity - this.governance.maxIntensity;
      this.damping.dampingActive = true;
    } else {
      this.governance.governorActive = false;
    }

    // Step 4: Apply stress compensation
    if (this.compensation.compensationActive) {
      const stressFactor = 1 - (this.compensation.bandwidthReduction / 100);
      regulatedIntensity = this.lastIntensity + ((regulatedIntensity - this.lastIntensity) * stressFactor);
    }

    // Step 5: Add to smoothing buffer
    this.smoothing.historyBuffer.push({
      value: regulatedIntensity,
      timestamp: now,
    });

    // Trim buffer to window size
    const windowStart = now - this.smoothing.smoothingWindow;
    this.smoothing.historyBuffer = this.smoothing.historyBuffer.filter(
      entry => entry.timestamp >= windowStart
    );

    // Step 6: Apply state smoothing
    if (this.smoothing.smoothingActive && this.smoothing.historyBuffer.length > 1) {
      const smoothedValue = this.calculateSmoothedValue();
      regulatedIntensity = regulatedIntensity * (1 - this.smoothing.smoothingStrength) + 
                           smoothedValue * this.smoothing.smoothingStrength;
      this.smoothing.smoothedValue = regulatedIntensity;
    }

    // Step 7: Apply adaptive stabilization
    if (this.stabilization.stabilizationActive) {
      regulatedIntensity = this.applyStabilization(regulatedIntensity);
    }

    // Update state
    this.governance.currentIntensity = regulatedIntensity;
    this.governance.peakIntensity = Math.max(this.governance.peakIntensity, regulatedIntensity);
    this.lastIntensity = regulatedIntensity;

    // Record in history
    this.intensityHistory.push({ value: regulatedIntensity, timestamp: now });
    if (this.intensityHistory.length > this.HISTORY_SIZE) {
      this.intensityHistory.shift();
    }

    this.bandwidth.currentChangeRate = changeRate;
    this.changeRateHistory.push(changeRate);
    if (this.changeRateHistory.length > this.HISTORY_SIZE) {
      this.changeRateHistory.shift();
    }

    return regulatedIntensity;
  }

  /**
   * Update bandwidth utilization
   */
  private updateBandwidthUtilization(deltaTime: number): void {
    const adjustedMaxRate = this.bandwidth.maxChangeRate * (this.bandwidth.adaptiveCapacity / 100);
    
    if (adjustedMaxRate > 0) {
      this.bandwidth.bandwidthUtilization = 
        Math.min(100, (this.bandwidth.currentChangeRate / adjustedMaxRate) * 100);
    }

    // Adapt bandwidth capacity based on stress
    if (this.compensation.compensationActive) {
      this.bandwidth.adaptiveCapacity = Math.max(
        30,
        100 - this.compensation.bandwidthReduction
      );
    } else {
      // Gradually recover capacity
      this.bandwidth.adaptiveCapacity = Math.min(
        100,
        this.bandwidth.adaptiveCapacity + (5 * deltaTime)
      );
    }
  }

  /**
   * Apply overflow damping curves
   */
  private applyOverflowDamping(deltaTime: number): void {
    if (this.damping.overflowLevel <= 0) {
      this.damping.dampingActive = false;
      this.damping.residualOverflow = 0;
      return;
    }

    // Calculate damping strength based on overflow level
    this.damping.dampingStrength = Math.min(100, this.damping.overflowLevel * 1.5);

    // Apply decay curve
    let decayFactor = 1;
    switch (this.damping.decayCurve) {
      case 'linear':
        decayFactor = 1 - (this.damping.decayRate * deltaTime);
        break;
      case 'exponential':
        decayFactor = Math.pow(this.damping.decayRate, deltaTime * 10);
        break;
      case 'logarithmic':
        decayFactor = 1 - (Math.log(1 + this.damping.decayRate * deltaTime * 10) / 10);
        break;
      case 'sigmoid':
        const t = deltaTime * 10;
        decayFactor = 1 / (1 + Math.exp(-5 * (t - 0.5)));
        decayFactor = 1 - decayFactor;
        break;
    }

    // Apply decay
    this.damping.overflowLevel *= decayFactor;
    this.damping.residualOverflow = this.damping.overflowLevel;

    // Deactivate if overflow is negligible
    if (this.damping.overflowLevel < 1) {
      this.damping.dampingActive = false;
      this.damping.overflowLevel = 0;
      this.damping.residualOverflow = 0;
    }
  }

  /**
   * Update stress compensation
   */
  private updateStressCompensation(): void {
    // Calculate overall system stress
    this.compensation.systemStress = 
      (this.compensation.cpuLoad * 0.3 +
       this.compensation.memoryPressure * 0.3 +
       this.compensation.emotionalLoad * 0.4);

    // Activate compensation if stress exceeds threshold
    if (this.compensation.systemStress > this.compensation.stressThreshold) {
      this.compensation.compensationActive = true;
      
      // Calculate bandwidth reduction based on stress level
      const stressOverage = this.compensation.systemStress - this.compensation.stressThreshold;
      this.compensation.bandwidthReduction = Math.min(70, stressOverage * 2);
    } else {
      this.compensation.compensationActive = false;
      this.compensation.bandwidthReduction = 0;
    }
  }

  /**
   * Apply state smoothing
   */
  private applyStateSmoothing(): void {
    if (this.smoothing.historyBuffer.length < 2) return;

    // Calculate variance
    const values = this.smoothing.historyBuffer.map(entry => entry.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    this.smoothing.variance = Math.sqrt(variance);

    // Adjust smoothing strength based on variance
    if (this.smoothing.variance > 20) {
      // High variance: increase smoothing
      this.smoothing.smoothingStrength = Math.min(0.9, this.config.smoothingStrength + 0.2);
    } else if (this.smoothing.variance < 5) {
      // Low variance: decrease smoothing
      this.smoothing.smoothingStrength = Math.max(0.3, this.config.smoothingStrength - 0.2);
    } else {
      // Normal variance: use default
      this.smoothing.smoothingStrength = this.config.smoothingStrength;
    }
  }

  /**
   * Calculate smoothed value from buffer
   */
  private calculateSmoothedValue(): number {
    if (this.smoothing.historyBuffer.length === 0) return this.lastIntensity;

    // Weighted moving average (recent values weighted more)
    let totalWeight = 0;
    let weightedSum = 0;

    this.smoothing.historyBuffer.forEach((entry, index) => {
      const weight = index + 1; // Linear weighting
      weightedSum += entry.value * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : this.lastIntensity;
  }

  /**
   * Update adaptive stabilization
   */
  private updateAdaptiveStabilization(): void {
    // Calculate volatility from recent change rates
    if (this.changeRateHistory.length > 5) {
      const recentRates = this.changeRateHistory.slice(-10);
      const avgRate = recentRates.reduce((sum, r) => sum + r, 0) / recentRates.length;
      const maxRate = Math.max(...recentRates);
      
      this.stabilization.volatilityLevel = Math.min(100, (maxRate / this.bandwidth.maxChangeRate) * 100);
      
      // Determine adaptive mode
      if (this.stabilization.volatilityLevel > 80) {
        this.stabilization.adaptiveMode = 'emergency';
        this.stabilization.stabilizationStrength = 90;
      } else if (this.stabilization.volatilityLevel > 60) {
        this.stabilization.adaptiveMode = 'aggressive';
        this.stabilization.stabilizationStrength = 70;
      } else if (this.stabilization.volatilityLevel > 40) {
        this.stabilization.adaptiveMode = 'reactive';
        this.stabilization.stabilizationStrength = 50;
      } else {
        this.stabilization.adaptiveMode = 'passive';
        this.stabilization.stabilizationStrength = 30;
      }
      
      this.stabilization.stabilizationActive = this.stabilization.volatilityLevel > 30;
    }

    // Calculate stability score
    this.stabilization.stabilityScore = Math.max(
      0,
      100 - this.stabilization.volatilityLevel
    );
  }

  /**
   * Apply stabilization to intensity
   */
  private applyStabilization(intensity: number): number {
    // Pull intensity toward target with adaptive strength
    const targetPull = this.governance.targetIntensity;
    const pullStrength = this.stabilization.stabilizationStrength / 100;
    
    return intensity * (1 - pullStrength) + targetPull * pullStrength;
  }

  /**
   * Update system stress metrics
   */
  public updateStressMetrics(cpu: number, memory: number, emotional: number): void {
    this.compensation.cpuLoad = Math.min(100, Math.max(0, cpu));
    this.compensation.memoryPressure = Math.min(100, Math.max(0, memory));
    this.compensation.emotionalLoad = Math.min(100, Math.max(0, emotional));
  }

  /**
   * Set target intensity for stabilization
   */
  public setTargetIntensity(target: number): void {
    this.governance.targetIntensity = Math.min(100, Math.max(0, target));
  }

  /**
   * Set decay curve type
   */
  public setDecayCurve(curve: 'linear' | 'exponential' | 'logarithmic' | 'sigmoid'): void {
    this.damping.decayCurve = curve;
  }

  /**
   * Clean old history entries
   */
  private cleanHistory(now: number): void {
    const maxAge = 60000; // 60 seconds

    this.intensityHistory = this.intensityHistory.filter(
      entry => now - entry.timestamp < maxAge
    );
  }

  /**
   * Get current state
   */
  public getState() {
    return {
      bandwidth: { ...this.bandwidth },
      governance: { ...this.governance },
      damping: { ...this.damping },
      compensation: { ...this.compensation },
      smoothing: {
        smoothingActive: this.smoothing.smoothingActive,
        smoothingStrength: this.smoothing.smoothingStrength,
        smoothedValue: this.smoothing.smoothedValue,
        variance: this.smoothing.variance,
      },
      stabilization: { ...this.stabilization },
    };
  }

  /**
   * Get summary for debugging
   */
  public getSummary(): string {
    return `EmotionalField: Intensity=${this.governance.currentIntensity.toFixed(1)}, Bandwidth=${this.bandwidth.bandwidthUtilization.toFixed(1)}%, Stability=${this.stabilization.stabilityScore.toFixed(1)}%, Mode=${this.stabilization.adaptiveMode}`;
  }

  /**
   * Reset regulator
   */
  public reset(): void {
    this.bandwidth.currentChangeRate = 0;
    this.bandwidth.bandwidthUtilization = 0;
    this.bandwidth.rateLimitActive = false;
    this.bandwidth.throttledChanges = 0;
    this.bandwidth.adaptiveCapacity = 100;

    this.governance.currentIntensity = 50;
    this.governance.peakIntensity = 50;
    this.governance.governorActive = false;
    this.governance.cappedEvents = 0;
    this.governance.targetIntensity = 50;

    this.damping.dampingActive = false;
    this.damping.dampingStrength = 0;
    this.damping.overflowLevel = 0;
    this.damping.residualOverflow = 0;

    this.compensation.systemStress = 0;
    this.compensation.compensationActive = false;
    this.compensation.bandwidthReduction = 0;

    this.smoothing.historyBuffer = [];
    this.smoothing.smoothedValue = 50;
    this.smoothing.variance = 0;

    this.stabilization.stabilizationActive = false;
    this.stabilization.volatilityLevel = 0;
    this.stabilization.stabilizationStrength = 0;
    this.stabilization.adaptiveMode = 'passive';
    this.stabilization.stabilityScore = 100;

    this.intensityHistory = [];
    this.changeRateHistory = [];
    this.lastIntensity = 50;
  }

  /**
   * Export state for persistence
   */
  public export() {
    return {
      config: { ...this.config },
      governance: { ...this.governance },
      stabilization: { ...this.stabilization },
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
    if (data.governance?.targetIntensity) {
      this.governance.targetIntensity = data.governance.targetIntensity;
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

    this.intensityHistory = [];
    this.changeRateHistory = [];
    this.smoothing.historyBuffer = [];
  }
}
