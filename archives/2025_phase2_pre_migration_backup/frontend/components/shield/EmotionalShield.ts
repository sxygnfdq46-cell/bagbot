/**
 * ═══════════════════════════════════════════════════════════════════
 * EMOTIONAL SHIELD — Level 18.3
 * ═══════════════════════════════════════════════════════════════════
 * Protects BagBot's emotional stability by preventing:
 * - Emotional overflow cascades
 * - Instability loops
 * - Resonance failures
 * - Rapid emotional oscillations
 * - Emotional state corruption
 * 
 * Integration:
 * - Connects to Level 11 (Emotional Engine)
 * - Reports to ShieldCore (Level 18.1)
 * - Feeds diagnostics to Admin Panel (Level 17)
 * 
 * Safety: Read-only monitoring + manual intervention gates
 * ═══════════════════════════════════════════════════════════════════
 */

import { getShieldCore, type ThreatLevel } from './ShieldCore';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

export type EmotionalState = 
  | 'calm' 
  | 'excited' 
  | 'stressed' 
  | 'overwhelmed' 
  | 'unstable' 
  | 'critical';

export type EmotionalBand = 'core' | 'surface' | 'reactive' | 'ambient';

export interface EmotionalReading {
  timestamp: number;
  state: EmotionalState;
  intensity: number; // 0-100
  valence: number; // -100 to +100 (negative to positive)
  arousal: number; // 0-100 (calm to excited)
  stability: number; // 0-100 (unstable to stable)
  coherence: number; // 0-100 (chaotic to coherent)
}

export interface EmotionalBandState {
  band: EmotionalBand;
  energy: number; // 0-100
  frequency: number; // Hz equivalent
  amplitude: number; // 0-100
  phase: number; // 0-360 degrees
  lastUpdate: number;
}

export interface EmotionalThreat {
  type: 'overflow' | 'oscillation' | 'cascade' | 'resonance' | 'corruption';
  severity: ThreatLevel;
  affectedBands: EmotionalBand[];
  triggerValue: number;
  threshold: number;
  duration: number; // ms
  message: string;
}

export interface EmotionalShieldConfig {
  enabled: boolean;
  monitoringInterval: number; // ms
  historySize: number; // readings to keep
  thresholds: {
    overflowIntensity: number;
    oscillationRate: number; // changes per second
    cascadeDepth: number; // affected bands
    resonanceStrength: number;
    stabilityMinimum: number;
  };
  dampening: {
    enabled: boolean;
    linearFactor: number; // 0-1
    exponentialFactor: number; // 0-1
    harmonicFactor: number; // 0-1
  };
  bounds: {
    intensityMax: number;
    valenceMin: number;
    valenceMax: number;
    arousalMax: number;
  };
}

export interface EmotionalShieldStatus {
  active: boolean;
  currentState: EmotionalState;
  intensity: number;
  stability: number;
  coherence: number;
  threatsDetected: number;
  threatsResolved: number;
  dampeningActive: boolean;
  affectedBands: EmotionalBand[];
  lastCheck: number;
}

export interface EmotionalMetrics {
  checksPerformed: number;
  overflowEvents: number;
  oscillationEvents: number;
  cascadeEvents: number;
  resonanceEvents: number;
  corruptionEvents: number;
  dampeningActivations: number;
  averageIntensity: number;
  averageStability: number;
  averageCoherence: number;
  stabilityHistory: Array<{ timestamp: number; value: number }>;
}

// ─────────────────────────────────────────────────────────────────
// EMOTIONAL SHIELD CLASS
// ─────────────────────────────────────────────────────────────────

export class EmotionalShield {
  private config: EmotionalShieldConfig;
  private status: EmotionalShieldStatus;
  private metrics: EmotionalMetrics;
  private history: EmotionalReading[];
  private bands: Map<EmotionalBand, EmotionalBandState>;
  private monitoringTimer: number | null;
  private shieldCore: ReturnType<typeof getShieldCore>;
  private isInitialized: boolean;
  private threatCallbacks: Array<(threat: EmotionalThreat) => void>;

  constructor(config?: Partial<EmotionalShieldConfig>) {
    this.config = {
      enabled: true,
      monitoringInterval: 2000, // 2 seconds
      historySize: 100,
      thresholds: {
        overflowIntensity: 85,
        oscillationRate: 5, // 5 changes per second
        cascadeDepth: 2, // 2+ bands affected
        resonanceStrength: 75,
        stabilityMinimum: 30
      },
      dampening: {
        enabled: true,
        linearFactor: 0.2,
        exponentialFactor: 0.3,
        harmonicFactor: 0.15
      },
      bounds: {
        intensityMax: 95,
        valenceMin: -90,
        valenceMax: 90,
        arousalMax: 95
      },
      ...config
    };

    this.status = {
      active: false,
      currentState: 'calm',
      intensity: 0,
      stability: 100,
      coherence: 100,
      threatsDetected: 0,
      threatsResolved: 0,
      dampeningActive: false,
      affectedBands: [],
      lastCheck: Date.now()
    };

    this.metrics = {
      checksPerformed: 0,
      overflowEvents: 0,
      oscillationEvents: 0,
      cascadeEvents: 0,
      resonanceEvents: 0,
      corruptionEvents: 0,
      dampeningActivations: 0,
      averageIntensity: 0,
      averageStability: 100,
      averageCoherence: 100,
      stabilityHistory: []
    };

    this.history = [];
    this.bands = new Map();
    this.monitoringTimer = null;
    this.shieldCore = getShieldCore();
    this.isInitialized = false;
    this.threatCallbacks = [];

    // Initialize emotional bands
    this.initializeBands();
  }

  /**
   * Initialize emotional bands
   */
  private initializeBands(): void {
    const bandTypes: EmotionalBand[] = ['core', 'surface', 'reactive', 'ambient'];
    
    bandTypes.forEach(band => {
      this.bands.set(band, {
        band,
        energy: 50,
        frequency: this.getBandBaseFrequency(band),
        amplitude: 50,
        phase: 0,
        lastUpdate: Date.now()
      });
    });
  }

  /**
   * Get base frequency for band
   */
  private getBandBaseFrequency(band: EmotionalBand): number {
    switch (band) {
      case 'core': return 0.1; // Very slow, deep emotions
      case 'surface': return 0.5; // Moderate, conscious feelings
      case 'reactive': return 2.0; // Fast, immediate reactions
      case 'ambient': return 0.3; // Background emotional tone
    }
  }

  /**
   * Initialize the emotional shield
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[EmotionalShield] Already initialized');
      return;
    }

    console.log('[EmotionalShield] Initializing emotional protection...');

    if (this.config.enabled) {
      this.startMonitoring();
      this.status.active = true;
    }

    this.isInitialized = true;
    console.log('[EmotionalShield] Emotional shield ONLINE ✓');
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      return;
    }

    this.monitoringTimer = window.setInterval(() => {
      this.performCheck();
    }, this.config.monitoringInterval);

    console.log(`[EmotionalShield] Monitoring started (${this.config.monitoringInterval}ms)`);
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('[EmotionalShield] Monitoring stopped');
    }
  }

  /**
   * Perform emotional check
   */
  private performCheck(): void {
    this.metrics.checksPerformed++;
    this.status.lastCheck = Date.now();

    // Generate current reading (simulated - in real implementation, this would read from Level 11)
    const reading = this.generateReading();

    // Add to history
    this.history.push(reading);
    if (this.history.length > this.config.historySize) {
      this.history = this.history.slice(-this.config.historySize);
    }

    // Update status
    this.status.currentState = this.determineState(reading);
    this.status.intensity = reading.intensity;
    this.status.stability = reading.stability;
    this.status.coherence = reading.coherence;

    // Check for threats
    this.checkOverflow(reading);
    this.checkOscillation();
    this.checkCascade();
    this.checkResonance();
    this.checkCorruption(reading);

    // Apply dampening if needed
    if (this.config.dampening.enabled && this.shouldDampen(reading)) {
      this.applyDampening(reading);
    }

    // Update metrics
    this.updateMetrics(reading);
  }

  /**
   * Generate emotional reading (simulated)
   */
  private generateReading(): EmotionalReading {
    // In real implementation, this would interface with Level 11 Emotional Engine
    // For now, simulate realistic emotional state
    const baseIntensity = Math.random() * 100;
    const noise = (Math.random() - 0.5) * 20;
    
    return {
      timestamp: Date.now(),
      state: this.status.currentState,
      intensity: Math.max(0, Math.min(100, baseIntensity + noise)),
      valence: (Math.random() - 0.5) * 200,
      arousal: Math.random() * 100,
      stability: Math.max(0, Math.min(100, this.status.stability + (Math.random() - 0.5) * 10)),
      coherence: Math.max(0, Math.min(100, this.status.coherence + (Math.random() - 0.5) * 10))
    };
  }

  /**
   * Determine emotional state from reading
   */
  private determineState(reading: EmotionalReading): EmotionalState {
    if (reading.stability < 20) return 'critical';
    if (reading.stability < 40) return 'unstable';
    if (reading.intensity > 80) return 'overwhelmed';
    if (reading.arousal > 70) return 'stressed';
    if (reading.arousal > 50) return 'excited';
    return 'calm';
  }

  /**
   * Check for emotional overflow
   */
  private checkOverflow(reading: EmotionalReading): void {
    if (reading.intensity > this.config.thresholds.overflowIntensity) {
      const threat: EmotionalThreat = {
        type: 'overflow',
        severity: reading.intensity > 95 ? 5 : reading.intensity > 90 ? 4 : 3,
        affectedBands: Array.from(this.bands.keys()),
        triggerValue: reading.intensity,
        threshold: this.config.thresholds.overflowIntensity,
        duration: 0,
        message: `Emotional intensity overflow: ${reading.intensity.toFixed(1)}%`
      };

      this.reportThreat(threat);
      this.metrics.overflowEvents++;
    }
  }

  /**
   * Check for rapid oscillations
   */
  private checkOscillation(): void {
    if (this.history.length < 5) return;

    const recent = this.history.slice(-5);
    let changes = 0;

    for (let i = 1; i < recent.length; i++) {
      const delta = Math.abs(recent[i].intensity - recent[i - 1].intensity);
      if (delta > 20) changes++;
    }

    const rate = changes / ((recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000);

    if (rate > this.config.thresholds.oscillationRate) {
      const threat: EmotionalThreat = {
        type: 'oscillation',
        severity: rate > 10 ? 4 : rate > 7 ? 3 : 2,
        affectedBands: ['surface', 'reactive'],
        triggerValue: rate,
        threshold: this.config.thresholds.oscillationRate,
        duration: recent[recent.length - 1].timestamp - recent[0].timestamp,
        message: `Rapid emotional oscillation: ${rate.toFixed(1)} changes/sec`
      };

      this.reportThreat(threat);
      this.metrics.oscillationEvents++;
    }
  }

  /**
   * Check for cascade failures
   */
  private checkCascade(): void {
    const affectedBands: EmotionalBand[] = [];

    this.bands.forEach((state, band) => {
      if (state.energy > 80 || state.amplitude > 85) {
        affectedBands.push(band);
      }
    });

    if (affectedBands.length >= this.config.thresholds.cascadeDepth) {
      const threat: EmotionalThreat = {
        type: 'cascade',
        severity: affectedBands.length === 4 ? 5 : affectedBands.length === 3 ? 4 : 3,
        affectedBands,
        triggerValue: affectedBands.length,
        threshold: this.config.thresholds.cascadeDepth,
        duration: 0,
        message: `Emotional cascade across ${affectedBands.length} bands: ${affectedBands.join(', ')}`
      };

      this.reportThreat(threat);
      this.metrics.cascadeEvents++;
      this.status.affectedBands = affectedBands;
    } else {
      this.status.affectedBands = [];
    }
  }

  /**
   * Check for resonance failures
   */
  private checkResonance(): void {
    // Check for harmonic resonance between bands
    const bands = Array.from(this.bands.values());
    
    for (let i = 0; i < bands.length; i++) {
      for (let j = i + 1; j < bands.length; j++) {
        const freq1 = bands[i].frequency;
        const freq2 = bands[j].frequency;
        const ratio = freq1 / freq2;

        // Check for harmonic ratios (2:1, 3:2, etc.)
        const harmonicRatios = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
        const isHarmonic = harmonicRatios.some(r => Math.abs(ratio - r) < 0.1);

        if (isHarmonic && bands[i].amplitude > 70 && bands[j].amplitude > 70) {
          const strength = (bands[i].amplitude + bands[j].amplitude) / 2;

          if (strength > this.config.thresholds.resonanceStrength) {
            const threat: EmotionalThreat = {
              type: 'resonance',
              severity: strength > 90 ? 4 : strength > 85 ? 3 : 2,
              affectedBands: [bands[i].band, bands[j].band],
              triggerValue: strength,
              threshold: this.config.thresholds.resonanceStrength,
              duration: 0,
              message: `Harmonic resonance between ${bands[i].band} and ${bands[j].band}: ${strength.toFixed(1)}%`
            };

            this.reportThreat(threat);
            this.metrics.resonanceEvents++;
          }
        }
      }
    }
  }

  /**
   * Check for emotional corruption
   */
  private checkCorruption(reading: EmotionalReading): void {
    // Check for impossible or corrupted states
    const isCorrupted = 
      reading.intensity < 0 || reading.intensity > 100 ||
      reading.valence < -100 || reading.valence > 100 ||
      reading.arousal < 0 || reading.arousal > 100 ||
      reading.stability < 0 || reading.stability > 100 ||
      reading.coherence < 0 || reading.coherence > 100;

    if (isCorrupted) {
      const threat: EmotionalThreat = {
        type: 'corruption',
        severity: 5,
        affectedBands: Array.from(this.bands.keys()),
        triggerValue: 0,
        threshold: 0,
        duration: 0,
        message: 'Emotional state corruption detected - values out of bounds'
      };

      this.reportThreat(threat);
      this.metrics.corruptionEvents++;
    }
  }

  /**
   * Check if dampening should be applied
   */
  private shouldDampen(reading: EmotionalReading): boolean {
    return (
      reading.intensity > 75 ||
      reading.stability < this.config.thresholds.stabilityMinimum ||
      this.status.affectedBands.length > 0
    );
  }

  /**
   * Apply emotional dampening
   */
  private applyDampening(reading: EmotionalReading): void {
    this.status.dampeningActive = true;
    this.metrics.dampeningActivations++;

    // Apply linear dampening (reduces overall intensity)
    const linearDamping = reading.intensity * this.config.dampening.linearFactor;

    // Apply exponential dampening (reduces spikes more aggressively)
    const excessIntensity = Math.max(0, reading.intensity - 70);
    const exponentialDamping = excessIntensity * this.config.dampening.exponentialFactor;

    // Apply harmonic dampening (reduces resonance)
    this.bands.forEach((state) => {
      if (state.amplitude > 70) {
        const damping = (state.amplitude - 70) * this.config.dampening.harmonicFactor;
        state.amplitude = Math.max(0, state.amplitude - damping);
      }
    });

    const totalDamping = linearDamping + exponentialDamping;

    console.log(`[EmotionalShield] Dampening applied: -${totalDamping.toFixed(1)}% intensity`);

    // Note: In real implementation, this would send dampening signals to Level 11
    // For now, just log and update internal state
    setTimeout(() => {
      this.status.dampeningActive = false;
    }, 1000);
  }

  /**
   * Report threat to ShieldCore
   */
  private reportThreat(threat: EmotionalThreat): void {
    this.status.threatsDetected++;

    // Report to ShieldCore
    const threatId = this.shieldCore.reportThreat(
      'emotional',
      threat.severity,
      'EmotionalShield',
      threat.message,
      threat
    );

    // Notify callbacks
    this.threatCallbacks.forEach(cb => cb(threat));

    console.warn(`[EmotionalShield] THREAT: ${threat.type} - ${threat.message}`);

    // Auto-resolve after duration (for simulation)
    if (threat.duration > 0) {
      setTimeout(() => {
        this.shieldCore.resolveThreat(threatId);
        this.status.threatsResolved++;
      }, threat.duration + 1000);
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(reading: EmotionalReading): void {
    // Update averages
    const total = this.metrics.checksPerformed;
    this.metrics.averageIntensity = 
      (this.metrics.averageIntensity * (total - 1) + reading.intensity) / total;
    this.metrics.averageStability = 
      (this.metrics.averageStability * (total - 1) + reading.stability) / total;
    this.metrics.averageCoherence = 
      (this.metrics.averageCoherence * (total - 1) + reading.coherence) / total;

    // Update stability history
    this.metrics.stabilityHistory.push({
      timestamp: reading.timestamp,
      value: reading.stability
    });

    // Trim history
    if (this.metrics.stabilityHistory.length > 100) {
      this.metrics.stabilityHistory = this.metrics.stabilityHistory.slice(-100);
    }
  }

  /**
   * Register threat callback
   */
  onThreat(callback: (threat: EmotionalThreat) => void): () => void {
    this.threatCallbacks.push(callback);
    return () => {
      this.threatCallbacks = this.threatCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Get current status
   */
  getStatus(): EmotionalShieldStatus {
    return { ...this.status };
  }

  /**
   * Get metrics
   */
  getMetrics(): EmotionalMetrics {
    return { ...this.metrics };
  }

  /**
   * Get emotional history
   */
  getHistory(): EmotionalReading[] {
    return [...this.history];
  }

  /**
   * Get band states
   */
  getBands(): Map<EmotionalBand, EmotionalBandState> {
    return new Map(this.bands);
  }

  /**
   * Get current reading
   */
  getCurrentReading(): EmotionalReading | null {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null;
  }

  /**
   * Force emotional state (for testing)
   */
  forceState(reading: Partial<EmotionalReading>): void {
    const fullReading: EmotionalReading = {
      timestamp: Date.now(),
      state: reading.state || this.status.currentState,
      intensity: reading.intensity ?? this.status.intensity,
      valence: reading.valence ?? 0,
      arousal: reading.arousal ?? 50,
      stability: reading.stability ?? this.status.stability,
      coherence: reading.coherence ?? this.status.coherence
    };

    this.history.push(fullReading);
    this.status.currentState = fullReading.state;
    this.status.intensity = fullReading.intensity;
    this.status.stability = fullReading.stability;
    this.status.coherence = fullReading.coherence;

    console.log('[EmotionalShield] Forced state:', fullReading);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EmotionalShieldConfig>): void {
    const wasMonitoring = this.monitoringTimer !== null;

    if (wasMonitoring) {
      this.stopMonitoring();
    }

    this.config = { ...this.config, ...config };

    if (wasMonitoring && this.config.enabled) {
      this.startMonitoring();
    }

    console.log('[EmotionalShield] Configuration updated');
  }

  /**
   * Enable shield
   */
  enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      this.status.active = true;
      this.startMonitoring();
      console.log('[EmotionalShield] ENABLED');
    }
  }

  /**
   * Disable shield
   */
  disable(): void {
    if (this.config.enabled) {
      this.config.enabled = false;
      this.status.active = false;
      this.stopMonitoring();
      console.log('[EmotionalShield] DISABLED');
    }
  }

  /**
   * Reset shield
   */
  reset(): void {
    console.log('[EmotionalShield] Resetting...');

    this.history = [];
    this.status.threatsDetected = 0;
    this.status.threatsResolved = 0;
    this.status.affectedBands = [];
    this.metrics.checksPerformed = 0;
    this.metrics.overflowEvents = 0;
    this.metrics.oscillationEvents = 0;
    this.metrics.cascadeEvents = 0;
    this.metrics.resonanceEvents = 0;
    this.metrics.corruptionEvents = 0;
    this.metrics.dampeningActivations = 0;
    this.metrics.stabilityHistory = [];

    this.initializeBands();

    console.log('[EmotionalShield] Reset complete');
  }

  /**
   * Dispose shield
   */
  dispose(): void {
    console.log('[EmotionalShield] Disposing...');

    this.stopMonitoring();
    this.history = [];
    this.bands.clear();
    this.threatCallbacks = [];
    this.isInitialized = false;

    console.log('[EmotionalShield] Disposed');
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'critical';
    intensity: number;
    stability: number;
    coherence: number;
    activeThreats: number;
  } {
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (this.status.stability < 30 || this.status.coherence < 30) {
      overall = 'critical';
    } else if (this.status.stability < 60 || this.status.coherence < 60 || this.status.intensity > 80) {
      overall = 'degraded';
    }

    return {
      overall,
      intensity: this.status.intensity,
      stability: this.status.stability,
      coherence: this.status.coherence,
      activeThreats: this.status.threatsDetected - this.status.threatsResolved
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let emotionalShieldInstance: EmotionalShield | null = null;

/**
 * Get global emotional shield instance
 */
export function getEmotionalShield(): EmotionalShield {
  if (!emotionalShieldInstance) {
    emotionalShieldInstance = new EmotionalShield();
    emotionalShieldInstance.initialize();
  }
  return emotionalShieldInstance;
}

/**
 * Initialize emotional shield with custom config
 */
export function initializeEmotionalShield(config?: Partial<EmotionalShieldConfig>): EmotionalShield {
  if (emotionalShieldInstance) {
    console.warn('[EmotionalShield] Already initialized, returning existing instance');
    return emotionalShieldInstance;
  }

  emotionalShieldInstance = new EmotionalShield(config);
  emotionalShieldInstance.initialize();
  return emotionalShieldInstance;
}

/**
 * Dispose global emotional shield
 */
export function disposeEmotionalShield(): void {
  if (emotionalShieldInstance) {
    emotionalShieldInstance.dispose();
    emotionalShieldInstance = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get state color
 */
export function getEmotionalStateColor(state: EmotionalState): string {
  switch (state) {
    case 'calm': return '#10b981'; // green-500
    case 'excited': return '#3b82f6'; // blue-500
    case 'stressed': return '#f59e0b'; // amber-500
    case 'overwhelmed': return '#f97316'; // orange-500
    case 'unstable': return '#f87171'; // red-400
    case 'critical': return '#ef4444'; // red-500
  }
}

/**
 * Get band color
 */
export function getBandColor(band: EmotionalBand): string {
  switch (band) {
    case 'core': return '#8b5cf6'; // purple-500
    case 'surface': return '#06b6d4'; // cyan-500
    case 'reactive': return '#f59e0b'; // amber-500
    case 'ambient': return '#6366f1'; // indigo-500
  }
}

/**
 * Format stability percentage
 */
export function formatStability(stability: number): string {
  if (stability >= 80) return 'Excellent';
  if (stability >= 60) return 'Good';
  if (stability >= 40) return 'Fair';
  if (stability >= 20) return 'Poor';
  return 'Critical';
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export default EmotionalShield;
