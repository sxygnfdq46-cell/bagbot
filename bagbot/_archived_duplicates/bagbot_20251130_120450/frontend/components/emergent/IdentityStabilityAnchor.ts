/**
 * LEVEL 11.2 — IDENTITY STABILITY ANCHOR (ISA)
 * 
 * Prevents personality from changing too rapidly or drifting too far from core.
 * Provides smooth interpolation, dampening, and stability enforcement.
 * 
 * Architecture:
 * - Stability curve with drift limits
 * - Emotional spike dampening
 * - Reset-to-core behavior
 * - Smooth interpolation across states
 * - Coherence enforcement
 * 
 * This keeps BagBot feeling like one consistent being.
 */

import { PersonalityVector } from './PersonalityVectorEngine';

// ================================
// STABILITY CONFIGURATION
// ================================

/**
 * Stability curve configuration
 */
export interface StabilityCurve {
  maxDriftPerMinute: number; // Max change per minute (0-100)
  maxTotalDrift: number; // Max total drift from core (0-100)
  dampening: number; // 0-1: how much to dampen rapid changes
  smoothingWindow: number; // milliseconds: rolling average window
  recoveryStrength: number; // 0-1: pull toward core strength
  emergencyBrakeThreshold: number; // 0-100: when to force stop
}

/**
 * Stability state snapshot
 */
export interface StabilitySnapshot {
  timestamp: number;
  vector: PersonalityVector;
  driftFromCore: number; // 0-100
  changeRate: number; // per minute
  stabilityHealth: 'excellent' | 'good' | 'concerning' | 'critical';
}

/**
 * Interpolation configuration
 */
export interface InterpolationConfig {
  method: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
  duration: number; // milliseconds
  steps: number;
}

// ================================
// IDENTITY STABILITY ANCHOR
// ================================

export class IdentityStabilityAnchor {
  private coreIdentity: PersonalityVector;
  private currentVector: PersonalityVector;
  private previousVector: PersonalityVector;
  
  private stabilityCurve: StabilityCurve;
  private snapshots: StabilitySnapshot[] = [];
  
  private lastUpdateTime: number = Date.now();
  private readonly MAX_SNAPSHOTS = 50;
  
  private emergencyBrakeActive: boolean = false;
  private lastEmergencyBrake: number = 0;

  constructor(
    coreIdentity: PersonalityVector,
    initialVector: PersonalityVector,
    config?: Partial<StabilityCurve>
  ) {
    this.coreIdentity = JSON.parse(JSON.stringify(coreIdentity));
    this.currentVector = JSON.parse(JSON.stringify(initialVector));
    this.previousVector = JSON.parse(JSON.stringify(initialVector));
    
    this.stabilityCurve = {
      maxDriftPerMinute: 5, // Max 5 points per minute
      maxTotalDrift: 25, // Max 25 points total drift
      dampening: 0.7, // 70% dampening
      smoothingWindow: 2000, // 2 second smoothing
      recoveryStrength: 0.15, // 15% pull toward core per minute
      emergencyBrakeThreshold: 40, // Brake at 40+ drift
      ...config,
    };
    
    this.recordSnapshot();
  }

  /**
   * Apply stability constraints to proposed vector change
   */
  stabilize(
    proposedVector: PersonalityVector,
    reason: string = 'adaptation'
  ): PersonalityVector {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / (1000 * 60); // minutes
    
    // Calculate proposed drift
    const proposedDrift = this.calculateDrift(proposedVector, this.coreIdentity);
    const currentDrift = this.calculateDrift(this.currentVector, this.coreIdentity);
    
    // Check emergency brake
    if (proposedDrift > this.stabilityCurve.emergencyBrakeThreshold) {
      console.warn(`⚠️ ISA Emergency Brake: Drift ${proposedDrift.toFixed(1)} > ${this.stabilityCurve.emergencyBrakeThreshold}`);
      this.emergencyBrakeActive = true;
      this.lastEmergencyBrake = now;
      return this.currentVector; // No change
    }
    
    // Calculate max allowed change
    const maxChange = this.stabilityCurve.maxDriftPerMinute * deltaTime;
    
    // Calculate change rate
    const changeAmount = this.calculateDrift(proposedVector, this.currentVector);
    
    // If change is within limits, apply dampening
    if (changeAmount <= maxChange && proposedDrift <= this.stabilityCurve.maxTotalDrift) {
      const dampenedVector = this.applyDampening(proposedVector);
      return this.smoothTransition(dampenedVector);
    }
    
    // If change exceeds limits, scale it down
    if (changeAmount > maxChange) {
      const scaleFactor = maxChange / changeAmount;
      const scaledVector = this.scaleChange(proposedVector, scaleFactor);
      const dampenedVector = this.applyDampening(scaledVector);
      return this.smoothTransition(dampenedVector);
    }
    
    // If drift exceeds limits, pull toward core
    if (proposedDrift > this.stabilityCurve.maxTotalDrift) {
      const pullVector = this.pullTowardCore(proposedVector);
      const dampenedVector = this.applyDampening(pullVector);
      return this.smoothTransition(dampenedVector);
    }
    
    return this.currentVector; // Fallback
  }

  /**
   * Calculate drift between two vectors
   */
  private calculateDrift(vector1: PersonalityVector, vector2: PersonalityVector): number {
    let totalDiff = 0;
    let count = 0;
    
    Object.keys(vector1).forEach(cluster => {
      Object.keys((vector1 as any)[cluster]).forEach(trait => {
        const val1 = (vector1 as any)[cluster][trait];
        const val2 = (vector2 as any)[cluster][trait];
        totalDiff += Math.abs(val1 - val2);
        count++;
      });
    });
    
    return totalDiff / count; // Average drift
  }

  /**
   * Apply dampening to reduce rapid changes
   */
  private applyDampening(proposedVector: PersonalityVector): PersonalityVector {
    const dampened = JSON.parse(JSON.stringify(this.currentVector));
    const dampeningFactor = 1 - this.stabilityCurve.dampening;
    
    Object.keys(proposedVector).forEach(cluster => {
      Object.keys((proposedVector as any)[cluster]).forEach(trait => {
        const current = (this.currentVector as any)[cluster][trait];
        const proposed = (proposedVector as any)[cluster][trait];
        
        // Dampened = current + (proposed - current) * (1 - dampening)
        const dampenedValue = current + (proposed - current) * dampeningFactor;
        (dampened as any)[cluster][trait] = dampenedValue;
      });
    });
    
    return dampened;
  }

  /**
   * Scale down changes proportionally
   */
  private scaleChange(proposedVector: PersonalityVector, scaleFactor: number): PersonalityVector {
    const scaled = JSON.parse(JSON.stringify(this.currentVector));
    
    Object.keys(proposedVector).forEach(cluster => {
      Object.keys((proposedVector as any)[cluster]).forEach(trait => {
        const current = (this.currentVector as any)[cluster][trait];
        const proposed = (proposedVector as any)[cluster][trait];
        
        const change = (proposed - current) * scaleFactor;
        (scaled as any)[cluster][trait] = current + change;
      });
    });
    
    return scaled;
  }

  /**
   * Pull vector toward core identity
   */
  private pullTowardCore(proposedVector: PersonalityVector): PersonalityVector {
    const pulled = JSON.parse(JSON.stringify(proposedVector));
    
    Object.keys(proposedVector).forEach(cluster => {
      Object.keys((proposedVector as any)[cluster]).forEach(trait => {
        const proposed = (proposedVector as any)[cluster][trait];
        const core = (this.coreIdentity as any)[cluster][trait];
        
        // Pull toward core
        const diff = core - proposed;
        const pull = diff * this.stabilityCurve.recoveryStrength;
        (pulled as any)[cluster][trait] = proposed + pull;
      });
    });
    
    return pulled;
  }

  /**
   * Smooth transition using rolling average
   */
  private smoothTransition(targetVector: PersonalityVector): PersonalityVector {
    // Get recent snapshots within smoothing window
    const now = Date.now();
    const recentSnapshots = this.snapshots.filter(
      s => now - s.timestamp <= this.stabilityCurve.smoothingWindow
    );
    
    if (recentSnapshots.length === 0) {
      return targetVector;
    }
    
    // Calculate weighted average (more recent = higher weight)
    const smoothed = JSON.parse(JSON.stringify(targetVector));
    
    Object.keys(targetVector).forEach(cluster => {
      Object.keys((targetVector as any)[cluster]).forEach(trait => {
        let weightedSum = 0;
        let totalWeight = 0;
        
        recentSnapshots.forEach((snapshot, index) => {
          const age = now - snapshot.timestamp;
          const weight = 1 - (age / this.stabilityCurve.smoothingWindow);
          
          const value = (snapshot.vector as any)[cluster][trait];
          weightedSum += value * weight;
          totalWeight += weight;
        });
        
        // Include target with highest weight
        const targetValue = (targetVector as any)[cluster][trait];
        weightedSum += targetValue * 2;
        totalWeight += 2;
        
        (smoothed as any)[cluster][trait] = weightedSum / totalWeight;
      });
    });
    
    return smoothed;
  }

  /**
   * Interpolate between two vectors
   */
  interpolate(
    startVector: PersonalityVector,
    endVector: PersonalityVector,
    config: InterpolationConfig
  ): PersonalityVector[] {
    const frames: PersonalityVector[] = [];
    
    for (let i = 0; i <= config.steps; i++) {
      const t = i / config.steps;
      const easedT = this.applyEasing(t, config.method);
      
      const frame = JSON.parse(JSON.stringify(startVector));
      
      Object.keys(startVector).forEach(cluster => {
        Object.keys((startVector as any)[cluster]).forEach(trait => {
          const start = (startVector as any)[cluster][trait];
          const end = (endVector as any)[cluster][trait];
          
          (frame as any)[cluster][trait] = start + (end - start) * easedT;
        });
      });
      
      frames.push(frame);
    }
    
    return frames;
  }

  /**
   * Apply easing function
   */
  private applyEasing(t: number, method: InterpolationConfig['method']): number {
    switch (method) {
      case 'linear':
        return t;
      
      case 'ease-in':
        return t * t;
      
      case 'ease-out':
        return t * (2 - t);
      
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      
      case 'spring':
        // Simple spring with damping
        const frequency = 1.5;
        const damping = 0.7;
        return 1 - Math.exp(-damping * t * 4) * Math.cos(frequency * t * Math.PI * 2);
      
      default:
        return t;
    }
  }

  /**
   * Update current vector with stability applied
   */
  update(newVector: PersonalityVector, reason: string = 'update'): boolean {
    const stabilized = this.stabilize(newVector, reason);
    
    this.previousVector = JSON.parse(JSON.stringify(this.currentVector));
    this.currentVector = stabilized;
    this.lastUpdateTime = Date.now();
    
    this.recordSnapshot();
    
    // Check if change was significant
    const change = this.calculateDrift(this.previousVector, this.currentVector);
    return change > 0.1; // Return true if meaningful change occurred
  }

  /**
   * Record stability snapshot
   */
  private recordSnapshot(): void {
    const drift = this.calculateDrift(this.currentVector, this.coreIdentity);
    
    // Calculate change rate (per minute)
    let changeRate = 0;
    if (this.snapshots.length > 0) {
      const lastSnapshot = this.snapshots[this.snapshots.length - 1];
      const timeDiff = (Date.now() - lastSnapshot.timestamp) / (1000 * 60); // minutes
      const change = this.calculateDrift(this.currentVector, lastSnapshot.vector);
      changeRate = timeDiff > 0 ? change / timeDiff : 0;
    }
    
    // Determine health
    let stabilityHealth: StabilitySnapshot['stabilityHealth'] = 'excellent';
    if (drift > 30 || changeRate > 8) {
      stabilityHealth = 'critical';
    } else if (drift > 20 || changeRate > 6) {
      stabilityHealth = 'concerning';
    } else if (drift > 10 || changeRate > 4) {
      stabilityHealth = 'good';
    }
    
    const snapshot: StabilitySnapshot = {
      timestamp: Date.now(),
      vector: JSON.parse(JSON.stringify(this.currentVector)),
      driftFromCore: drift,
      changeRate,
      stabilityHealth,
    };
    
    this.snapshots.push(snapshot);
    
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  /**
   * Force reset to core identity
   */
  resetToCore(): void {
    this.previousVector = JSON.parse(JSON.stringify(this.currentVector));
    this.currentVector = JSON.parse(JSON.stringify(this.coreIdentity));
    this.lastUpdateTime = Date.now();
    this.emergencyBrakeActive = false;
    this.recordSnapshot();
  }

  /**
   * Gradual return to core over time
   */
  applyNaturalRecovery(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdateTime) / (1000 * 60); // minutes
    
    if (deltaTime < 0.1) return; // Skip if too soon
    
    const recoveryVector = JSON.parse(JSON.stringify(this.currentVector));
    
    Object.keys(this.currentVector).forEach(cluster => {
      Object.keys((this.currentVector as any)[cluster]).forEach(trait => {
        const current = (this.currentVector as any)[cluster][trait];
        const core = (this.coreIdentity as any)[cluster][trait];
        
        const diff = core - current;
        const recovery = diff * this.stabilityCurve.recoveryStrength * deltaTime;
        
        (recoveryVector as any)[cluster][trait] = current + recovery;
      });
    });
    
    this.update(recoveryVector, 'natural recovery');
  }

  /**
   * Update core identity
   */
  updateCoreIdentity(newCore: PersonalityVector): void {
    this.coreIdentity = JSON.parse(JSON.stringify(newCore));
  }

  /**
   * Get current stability metrics
   */
  getStabilityMetrics(): {
    driftFromCore: number;
    changeRate: number;
    stabilityHealth: StabilitySnapshot['stabilityHealth'];
    emergencyBrakeActive: boolean;
    timeSinceLastBrake: number;
    recentSnapshots: StabilitySnapshot[];
  } {
    const drift = this.calculateDrift(this.currentVector, this.coreIdentity);
    
    let changeRate = 0;
    if (this.snapshots.length >= 2) {
      const recent = this.snapshots.slice(-5); // Last 5 snapshots
      const totalTime = (recent[recent.length - 1].timestamp - recent[0].timestamp) / (1000 * 60);
      const totalChange = this.calculateDrift(recent[recent.length - 1].vector, recent[0].vector);
      changeRate = totalTime > 0 ? totalChange / totalTime : 0;
    }
    
    let stabilityHealth: StabilitySnapshot['stabilityHealth'] = 'excellent';
    if (drift > 30 || changeRate > 8) {
      stabilityHealth = 'critical';
    } else if (drift > 20 || changeRate > 6) {
      stabilityHealth = 'concerning';
    } else if (drift > 10 || changeRate > 4) {
      stabilityHealth = 'good';
    }
    
    const timeSinceLastBrake = this.lastEmergencyBrake > 0 
      ? Date.now() - this.lastEmergencyBrake 
      : Infinity;
    
    return {
      driftFromCore: drift,
      changeRate,
      stabilityHealth,
      emergencyBrakeActive: this.emergencyBrakeActive,
      timeSinceLastBrake,
      recentSnapshots: this.snapshots.slice(-10),
    };
  }

  /**
   * Deactivate emergency brake
   */
  releaseEmergencyBrake(): void {
    this.emergencyBrakeActive = false;
  }

  /**
   * Get stability configuration
   */
  getConfig(): StabilityCurve {
    return { ...this.stabilityCurve };
  }

  /**
   * Update stability configuration
   */
  updateConfig(updates: Partial<StabilityCurve>): void {
    this.stabilityCurve = {
      ...this.stabilityCurve,
      ...updates,
    };
  }

  /**
   * Get current vector
   */
  getCurrentVector(): PersonalityVector {
    return JSON.parse(JSON.stringify(this.currentVector));
  }

  /**
   * Get core identity
   */
  getCoreIdentity(): PersonalityVector {
    return JSON.parse(JSON.stringify(this.coreIdentity));
  }

  /**
   * Get stability trend over time
   */
  getStabilityTrend(): {
    timestamps: number[];
    drifts: number[];
    changeRates: number[];
    healthStates: string[];
  } {
    return {
      timestamps: this.snapshots.map(s => s.timestamp),
      drifts: this.snapshots.map(s => s.driftFromCore),
      changeRates: this.snapshots.map(s => s.changeRate),
      healthStates: this.snapshots.map(s => s.stabilityHealth),
    };
  }

  /**
   * Calculate stability score (0-100)
   */
  getStabilityScore(): number {
    const metrics = this.getStabilityMetrics();
    
    // Lower drift = higher score
    const driftScore = Math.max(0, 100 - metrics.driftFromCore * 2);
    
    // Lower change rate = higher score
    const rateScore = Math.max(0, 100 - metrics.changeRate * 10);
    
    // Health bonus
    const healthBonus = metrics.stabilityHealth === 'excellent' ? 20 :
                        metrics.stabilityHealth === 'good' ? 10 :
                        metrics.stabilityHealth === 'concerning' ? 0 : -20;
    
    // Emergency brake penalty
    const brakePenalty = this.emergencyBrakeActive ? -30 : 0;
    
    const score = (driftScore * 0.4 + rateScore * 0.4 + healthBonus + brakePenalty);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Export state for storage
   */
  export(): string {
    return JSON.stringify({
      coreIdentity: this.coreIdentity,
      currentVector: this.currentVector,
      stabilityCurve: this.stabilityCurve,
      snapshots: this.snapshots.slice(-10), // Last 10 only
      lastUpdateTime: this.lastUpdateTime,
    });
  }

  /**
   * Import state from storage
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      this.coreIdentity = data.coreIdentity;
      this.currentVector = data.currentVector;
      this.previousVector = JSON.parse(JSON.stringify(this.currentVector));
      this.stabilityCurve = data.stabilityCurve;
      this.snapshots = data.snapshots;
      this.lastUpdateTime = data.lastUpdateTime;
      
      return true;
    } catch (error) {
      console.error('Failed to import ISA state:', error);
      return false;
    }
  }
}
