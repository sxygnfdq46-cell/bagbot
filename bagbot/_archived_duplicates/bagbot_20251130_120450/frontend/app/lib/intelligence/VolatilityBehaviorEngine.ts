/**
 * DVBE - Dynamic Volatility Behavior Engine
 * 
 * Core engine for analyzing volatility patterns and behaviors.
 * Detects calm→explosive transitions, compression, fake spikes, shockwaves, and more.
 */

import type {
  VolatilitySnapshot,
  BehaviorResult,
  VolatilityMetrics,
  VolatilityBehavior,
  VolatilityPhase,
  DVBEConfig,
} from './volatilityTypes';

import {
  detectCalmToExplosive,
  detectCompression,
  detectFakeSpike,
  detectShockwave,
  detectAftershock,
  detectLiquidityEvaporation,
  detectVolatilityDrift,
  detectAccelerationZone,
  detectReversionPhase,
} from './volatilityModels';

/**
 * Default DVBE configuration
 */
const DEFAULT_CONFIG: DVBEConfig = {
  // Detection thresholds
  explosionThreshold: 70,
  compressionThreshold: 65,
  fakeSpikeThreshold: 60,
  shockwaveThreshold: 75,
  liquidityEvapThreshold: 70,
  
  // Phase thresholds
  dormantVolThreshold: 10,
  calmVolThreshold: 30,
  activeVolThreshold: 50,
  explosiveVolThreshold: 70,
  criticalVolThreshold: 85,
  
  // Timing windows
  shortTermWindow: 60000,        // 1 minute
  mediumTermWindow: 300000,      // 5 minutes
  longTermWindow: 3600000,       // 1 hour
  
  // Risk management
  haltOnExplosion: true,
  haltOnShockwave: true,
  haltOnLiquidityEvap: true,
  
  // Performance
  maxHistorySize: 300,
  enablePredictions: true,
  enableTransitionTracking: true,
};

/**
 * VolatilityBehaviorEngine - Core DVBE class
 */
export class VolatilityBehaviorEngine {
  private currentSnapshot: VolatilitySnapshot | null = null;
  private history: VolatilitySnapshot[] = [];
  private config: DVBEConfig;
  
  constructor(config: Partial<DVBEConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('[DVBE] Engine initialized', this.config);
  }
  
  /**
   * Load new volatility snapshot
   */
  loadSnapshot(snapshot: VolatilitySnapshot): void {
    this.currentSnapshot = snapshot;
    
    // Add to history
    this.history.push(snapshot);
    
    // Maintain history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }
  
  /**
   * Detect calm→explosion transition
   */
  detectCalmToExplosion(): {
    detected: boolean;
    score: number;
    confidence: number;
    metrics: any;
    trigger?: string;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, metrics: {} };
    }
    
    const result = detectCalmToExplosive(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= this.config.explosionThreshold,
      score: result.score,
      confidence: result.confidence,
      metrics: result.metrics,
      trigger: result.trigger,
    };
  }
  
  /**
   * Detect volatility compression
   */
  detectCompression(): {
    detected: boolean;
    score: number;
    confidence: number;
    breakoutProb: number;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, breakoutProb: 0, metrics: {} };
    }
    
    const result = detectCompression(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= this.config.compressionThreshold,
      score: result.score,
      confidence: result.confidence,
      breakoutProb: result.metrics.breakoutProb || 0,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect fake spike
   */
  detectFakeSpike(): {
    detected: boolean;
    score: number;
    confidence: number;
    meanReversionProb: number;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, meanReversionProb: 0, metrics: {} };
    }
    
    const result = detectFakeSpike(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= this.config.fakeSpikeThreshold,
      score: result.score,
      confidence: result.confidence,
      meanReversionProb: result.metrics.meanReversionProb || 0,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect shockwave
   */
  detectShockwave(): {
    detected: boolean;
    score: number;
    confidence: number;
    origin?: string;
    cascadeRisk: number;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, cascadeRisk: 0, metrics: {} };
    }
    
    const result = detectShockwave(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= this.config.shockwaveThreshold,
      score: result.score,
      confidence: result.confidence,
      origin: result.trigger,
      cascadeRisk: result.metrics.cascadeRisk || 0,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect aftershock
   */
  detectAftershock(): {
    detected: boolean;
    score: number;
    confidence: number;
    waves: number;
    decay: number;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, waves: 0, decay: 0, metrics: {} };
    }
    
    const result = detectAftershock(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= 50, // Aftershock threshold
      score: result.score,
      confidence: result.confidence,
      waves: result.metrics.aftershockWaves || 0,
      decay: result.metrics.aftershockDecay || 0,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect liquidity evaporation
   */
  detectLiquidityEvap(): {
    detected: boolean;
    score: number;
    confidence: number;
    evaporationRate: number;
    recoveryTime: number | null;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, evaporationRate: 0, recoveryTime: null, metrics: {} };
    }
    
    const result = detectLiquidityEvaporation(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= this.config.liquidityEvapThreshold,
      score: result.score,
      confidence: result.confidence,
      evaporationRate: result.metrics.evaporationRate || 0,
      recoveryTime: result.metrics.estimatedRecoveryTime || null,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect volatility drift
   */
  detectVolatilityDrift(): {
    detected: boolean;
    score: number;
    confidence: number;
    direction: "UP" | "DOWN" | "NEUTRAL";
    speed: number;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, direction: "NEUTRAL", speed: 0, metrics: {} };
    }
    
    const result = detectVolatilityDrift(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= 60, // Drift threshold
      score: result.score,
      confidence: result.confidence,
      direction: result.metrics.driftDirection || "NEUTRAL",
      speed: result.metrics.driftSpeed || 0,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect acceleration zones
   */
  detectAccelerationZones(): {
    detected: boolean;
    score: number;
    confidence: number;
    accelerationRate: number;
    estimatedPeak: number | null;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, accelerationRate: 0, estimatedPeak: null, metrics: {} };
    }
    
    const result = detectAccelerationZone(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= 65, // Acceleration threshold
      score: result.score,
      confidence: result.confidence,
      accelerationRate: result.metrics.accelerationRate || 0,
      estimatedPeak: result.metrics.estimatedPeak || null,
      metrics: result.metrics,
    };
  }
  
  /**
   * Detect reversion phase
   */
  detectReversionPhase(): {
    detected: boolean;
    score: number;
    confidence: number;
    targetVolatility: number;
    reversionSpeed: number;
    metrics: any;
  } {
    if (!this.currentSnapshot) {
      return { detected: false, score: 0, confidence: 0, targetVolatility: 0, reversionSpeed: 0, metrics: {} };
    }
    
    const result = detectReversionPhase(this.currentSnapshot, this.history);
    
    return {
      detected: result.score >= 60, // Reversion threshold
      score: result.score,
      confidence: result.confidence,
      targetVolatility: result.metrics.targetVolatility || 0,
      reversionSpeed: result.metrics.reversionSpeed || 0,
      metrics: result.metrics,
    };
  }
  
  /**
   * Determine current volatility phase
   */
  private determinePhase(volatility: number): VolatilityPhase {
    const cfg = this.config;
    
    if (volatility < cfg.dormantVolThreshold) return "DORMANT";
    if (volatility < cfg.calmVolThreshold) return "CALM";
    if (volatility < cfg.activeVolThreshold) return "WARMING";
    if (volatility < cfg.explosiveVolThreshold) return "ACTIVE";
    if (volatility < cfg.criticalVolThreshold) return "EXPLOSIVE";
    return "CRITICAL";
  }
  
  /**
   * Determine primary behavior
   */
  private determinePrimaryBehavior(): {
    behavior: VolatilityBehavior;
    score: number;
    confidence: number;
  } {
    if (!this.currentSnapshot) {
      return { behavior: "UNKNOWN", score: 0, confidence: 0 };
    }
    
    // Run all detectors
    const explosion = this.detectCalmToExplosion();
    const compression = this.detectCompression();
    const fakeSpike = this.detectFakeSpike();
    const shockwave = this.detectShockwave();
    const aftershock = this.detectAftershock();
    const liquidityEvap = this.detectLiquidityEvap();
    const drift = this.detectVolatilityDrift();
    const acceleration = this.detectAccelerationZones();
    const reversion = this.detectReversionPhase();
    
    // Find highest scoring behavior
    const behaviors = [
      { behavior: "SHOCKWAVE" as VolatilityBehavior, score: shockwave.score, confidence: shockwave.confidence },
      { behavior: "CALM_TO_EXPLOSIVE" as VolatilityBehavior, score: explosion.score, confidence: explosion.confidence },
      { behavior: "LIQUIDITY_EVAP" as VolatilityBehavior, score: liquidityEvap.score, confidence: liquidityEvap.confidence },
      { behavior: "COMPRESSION" as VolatilityBehavior, score: compression.score, confidence: compression.confidence },
      { behavior: "FAKE_SPIKE" as VolatilityBehavior, score: fakeSpike.score, confidence: fakeSpike.confidence },
      { behavior: "AFTERSHOCK" as VolatilityBehavior, score: aftershock.score, confidence: aftershock.confidence },
      { behavior: "ACCELERATION_ZONE" as VolatilityBehavior, score: acceleration.score, confidence: acceleration.confidence },
      { behavior: "VOLATILITY_DRIFT" as VolatilityBehavior, score: drift.score, confidence: drift.confidence },
      { behavior: "REVERSION_PHASE" as VolatilityBehavior, score: reversion.score, confidence: reversion.confidence },
    ];
    
    const primary = behaviors.reduce((max, curr) => 
      curr.score > max.score ? curr : max
    );
    
    // If score is too low, return UNKNOWN
    if (primary.score < 40) {
      return { behavior: "UNKNOWN", score: primary.score, confidence: primary.confidence };
    }
    
    return primary;
  }
  
  /**
   * Get complete volatility behavior summary
   */
  getVolatilityBehaviorSummary(): BehaviorResult {
    if (!this.currentSnapshot) {
      throw new Error('[DVBE] No snapshot loaded');
    }
    
    // Determine primary behavior
    const primary = this.determinePrimaryBehavior();
    
    // Determine phase
    const phase = this.determinePhase(this.currentSnapshot.currentVol);
    
    // Calculate severity (0-100)
    const severity = Math.min(100, 
      (this.currentSnapshot.currentVol * 0.7) + 
      (primary.score * 0.3)
    );
    
    // Gather all detection results
    const explosion = this.detectCalmToExplosion();
    const compression = this.detectCompression();
    const fakeSpike = this.detectFakeSpike();
    const shockwave = this.detectShockwave();
    const aftershock = this.detectAftershock();
    const liquidityEvap = this.detectLiquidityEvap();
    const drift = this.detectVolatilityDrift();
    const acceleration = this.detectAccelerationZones();
    const reversion = this.detectReversionPhase();
    
    // Build comprehensive metrics
    const metrics: VolatilityMetrics = {
      // Explosion metrics
      explosionScore: explosion.score,
      explosionTrigger: explosion.trigger || null,
      explosionSeverity: explosion.score,
      
      // Compression metrics
      compressionScore: compression.score,
      compressionDuration: compression.metrics.sustainedCompression ? this.config.mediumTermWindow : 0,
      breakoutProb: compression.breakoutProb,
      
      // Fake spike metrics
      fakeSpikeScore: fakeSpike.score,
      meanReversionProb: fakeSpike.meanReversionProb,
      spikeStrength: fakeSpike.score,
      
      // Shockwave metrics
      shockwaveScore: shockwave.score,
      shockwaveOrigin: shockwave.origin || null,
      cascadeRisk: shockwave.cascadeRisk,
      
      // Aftershock metrics
      aftershockScore: aftershock.score,
      aftershockWaves: aftershock.waves,
      aftershockDecay: aftershock.decay,
      
      // Liquidity evaporation metrics
      liquidityEvapScore: liquidityEvap.score,
      evaporationRate: liquidityEvap.evaporationRate,
      recoveryTime: liquidityEvap.recoveryTime,
      
      // Drift metrics
      driftScore: drift.score,
      driftDirection: drift.direction,
      driftSpeed: drift.speed,
      
      // Acceleration metrics
      accelerationScore: acceleration.score,
      accelerationRate: acceleration.accelerationRate,
      accelerationPeak: acceleration.estimatedPeak,
      
      // Reversion metrics
      reversionScore: reversion.score,
      targetVolatility: reversion.targetVolatility,
      reversionSpeed: reversion.reversionSpeed,
    };
    
    // Determine risk level
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    if (phase === "CRITICAL" || shockwave.detected) {
      riskLevel = "CRITICAL";
    } else if (phase === "EXPLOSIVE" || explosion.detected || liquidityEvap.detected) {
      riskLevel = "HIGH";
    } else if (phase === "ACTIVE" || compression.detected || acceleration.detected) {
      riskLevel = "MEDIUM";
    } else {
      riskLevel = "LOW";
    }
    
    // Determine trading advice
    let tradingAdvice: "CONTINUE" | "REDUCE" | "PAUSE" | "HALT";
    if (riskLevel === "CRITICAL" || 
        (this.config.haltOnShockwave && shockwave.detected) ||
        (this.config.haltOnExplosion && explosion.detected && explosion.score > 85) ||
        (this.config.haltOnLiquidityEvap && liquidityEvap.detected && liquidityEvap.score > 80)) {
      tradingAdvice = "HALT";
    } else if (riskLevel === "HIGH" || fakeSpike.detected) {
      tradingAdvice = "PAUSE";
    } else if (riskLevel === "MEDIUM" || compression.detected) {
      tradingAdvice = "REDUCE";
    } else {
      tradingAdvice = "CONTINUE";
    }
    
    // Predict next phase (if enabled)
    let predictedPhase: VolatilityPhase | null = null;
    let phaseChangeProb = 0;
    let timeToChange: number | null = null;
    
    if (this.config.enablePredictions) {
      if (compression.detected && compression.breakoutProb > 70) {
        predictedPhase = "EXPLOSIVE";
        phaseChangeProb = compression.breakoutProb;
        timeToChange = 120000; // 2 minutes estimate
      } else if (explosion.detected) {
        predictedPhase = "CRITICAL";
        phaseChangeProb = 80;
        timeToChange = 60000; // 1 minute estimate
      } else if (reversion.detected) {
        predictedPhase = "CALM";
        phaseChangeProb = reversion.score;
        timeToChange = 300000; // 5 minutes estimate
      }
    }
    
    // Build result
    const result: BehaviorResult = {
      behavior: primary.behavior,
      phase,
      severity: Math.round(severity),
      confidence: Math.round(primary.confidence),
      
      metrics,
      
      riskLevel,
      tradingAdvice,
      
      // Flags
      isExplosive: explosion.detected,
      isCompressing: compression.detected,
      isFakeSpike: fakeSpike.detected,
      isShockwave: shockwave.detected,
      isAftershock: aftershock.detected,
      isLiquidityEvap: liquidityEvap.detected,
      isDrifting: drift.detected,
      isAccelerating: acceleration.detected,
      isReverting: reversion.detected,
      
      // Predictions
      predictedPhase,
      phaseChangeProb: Math.round(phaseChangeProb),
      timeToChange,
      
      timestamp: this.currentSnapshot.timestamp,
    };
    
    return result;
  }
  
  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): VolatilitySnapshot | null {
    return this.currentSnapshot;
  }
  
  /**
   * Get history
   */
  getHistory(): VolatilitySnapshot[] {
    return [...this.history];
  }
  
  /**
   * Get configuration
   */
  getConfig(): DVBEConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<DVBEConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[DVBE] Configuration updated', config);
  }
  
  /**
   * Reset engine
   */
  reset(): void {
    this.currentSnapshot = null;
    this.history = [];
    console.log('[DVBE] Engine reset');
  }
}

/**
 * Singleton instance
 */
let dvbeInstance: VolatilityBehaviorEngine | null = null;

/**
 * Get DVBE instance
 */
export function getVolatilityBehaviorEngine(config?: Partial<DVBEConfig>): VolatilityBehaviorEngine {
  if (!dvbeInstance) {
    dvbeInstance = new VolatilityBehaviorEngine(config);
  }
  return dvbeInstance;
}

/**
 * Reset singleton
 */
export function resetVolatilityBehaviorEngine(): void {
  if (dvbeInstance) {
    dvbeInstance.reset();
  }
  dvbeInstance = null;
}

export default VolatilityBehaviorEngine;
