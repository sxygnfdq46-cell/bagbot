/**
 * 🛡️ STABILITY FIELD CORE
 * 
 * Auto-regulates quantum + holographic + particle systems
 * Prevents visual chaos and system overload
 * 
 * This is the "immune system" that keeps BagBot healthy.
 */

import type { EnvironmentalState } from '../environmental/EnvironmentalConsciousnessCore';
import type { ReflexState } from './ReflexEngine';

// Emotional state interface (compatible with cognitive fusion)
export interface EmotionalState {
  energy: number;       // 0-1
  valence: number;      // 0-1 (negative to positive)
  intensity: number;    // 0-1
  volatility: number;   // 0-1
  presence: number;     // 0-1
}

// ============================================
// STABILITY STATE
// ============================================

export interface StabilityFieldState {
  // Core metrics
  stability: number;           // 0-1 overall stability
  damping: number;            // 0-1 dampening force
  regulation: number;         // 0-1 regulatory strength
  
  // System health
  quantumHealth: number;      // 0-100
  holographicHealth: number;  // 0-100
  particleHealth: number;     // 0-100
  overallHealth: number;      // 0-100
  
  // Active regulations
  activeRegulations: Regulation[];
  
  // Thermal management
  temperature: number;        // 0-1 system heat
  coolingRate: number;        // per second
  overheating: boolean;
  
  // Drift control
  driftSpeed: number;         // 0-1 current drift velocity
  driftLimit: number;         // max allowed drift
  driftSmoothing: number;     // smoothing factor
  
  // Visual intensity
  colorWarmth: number;        // 0-1 color temperature
  glowIntensity: number;      // 0-1 glow strength
  particleDensity: number;    // 0-1 particle count
  
  // Performance
  frameStability: number;     // 0-1 frame rate stability
  lastUpdate: number;
}

export interface Regulation {
  type: 'thermal' | 'quantum' | 'holographic' | 'particle' | 'drift' | 'intensity';
  action: string;
  strength: number;           // 0-1
  appliedAt: number;
  duration: number;           // ms
}

// ============================================
// STABILITY FIELD CORE
// ============================================

export class StabilityFieldCore {
  private state: StabilityFieldState;
  private listeners: Set<(state: StabilityFieldState) => void> = new Set();
  
  // Regulation thresholds
  private readonly THRESHOLDS = {
    overheating: 0.85,
    quantumOverload: 0.9,
    holographicStorm: 0.88,
    particleExplosion: 0.92,
    driftChaos: 0.8,
    intensityOverdrive: 0.95
  };
  
  // Regulation parameters
  private readonly REGULATION = {
    thermalCoolingRate: 0.2,      // per second
    driftSmoothingFactor: 0.15,
    intensityDampening: 0.3,
    particleThrottling: 0.25,
    quantumStabilization: 0.35,
    holographicCalming: 0.28
  };
  
  // Update frequency
  private updateInterval: number = 1000 / 60; // 60fps

  constructor() {
    this.state = {
      stability: 1.0,
      damping: 0.5,
      regulation: 0.7,
      quantumHealth: 100,
      holographicHealth: 100,
      particleHealth: 100,
      overallHealth: 100,
      activeRegulations: [],
      temperature: 0.3,
      coolingRate: 0.1,
      overheating: false,
      driftSpeed: 0.5,
      driftLimit: 0.8,
      driftSmoothing: 0.15,
      colorWarmth: 0.6,
      glowIntensity: 0.7,
      particleDensity: 0.6,
      frameStability: 1.0,
      lastUpdate: Date.now()
    };
  }

  // ============================================
  // UPDATE LOOP
  // ============================================

  public update(
    environmental: EnvironmentalState,
    emotional: EmotionalState,
    reflex: ReflexState,
    timestamp: number = Date.now()
  ): StabilityFieldState {
    const deltaTime = (timestamp - this.state.lastUpdate) / 1000; // seconds
    
    // Calculate system loads
    const quantumLoad = this.calculateQuantumLoad(environmental, emotional);
    const holographicLoad = this.calculateHolographicLoad(environmental, emotional);
    const particleLoad = this.calculateParticleLoad(reflex, emotional);
    
    // Update system health
    this.state.quantumHealth = this.calculateHealth(quantumLoad);
    this.state.holographicHealth = this.calculateHealth(holographicLoad);
    this.state.particleHealth = this.calculateHealth(particleLoad);
    this.state.overallHealth = (
      this.state.quantumHealth +
      this.state.holographicHealth +
      this.state.particleHealth
    ) / 3;
    
    // Thermal management
    this.updateTemperature(quantumLoad, holographicLoad, particleLoad, deltaTime);
    
    // Apply regulations
    this.applyRegulations(quantumLoad, holographicLoad, particleLoad, timestamp);
    
    // Update visual parameters
    this.updateVisualParameters(environmental, emotional, reflex);
    
    // Calculate stability
    this.state.stability = this.calculateStability();
    
    // Frame stability (mock - would use real perf data)
    this.state.frameStability = this.calculateFrameStability();
    
    // Clean up expired regulations
    this.state.activeRegulations = this.state.activeRegulations.filter(reg => {
      const elapsed = timestamp - reg.appliedAt;
      return elapsed < reg.duration;
    });
    
    this.state.lastUpdate = timestamp;
    this.notifyListeners();
    
    return this.state;
  }

  // ============================================
  // LOAD CALCULATIONS
  // ============================================

  private calculateQuantumLoad(
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): number {
    // Quantum systems respond to environmental awareness and emotional energy
    const envLoad = 
      environmental.awareness / 100 * 0.4 +
      environmental.coherence / 100 * 0.3 +
      (environmental.weather.temperature / 100) * 0.3;
    
    const emotionalLoad = emotional.energy * 0.6 + emotional.volatility * 0.4;
    
    return (envLoad + emotionalLoad) / 2;
  }

  private calculateHolographicLoad(
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): number {
    // Holographic systems respond to flow, gravity, and emotional intensity
    const envLoad =
      environmental.flow.dominantFlow.strength / 100 * 0.3 +
      environmental.gravity.fieldStrength / 100 * 0.3 +
      environmental.jetstream.trendStrength / 100 * 0.4;
    
    const emotionalLoad = 
      Math.abs(emotional.valence - 0.5) * 2 * 0.5 +
      emotional.intensity * 0.5;
    
    return (envLoad + emotionalLoad) / 2;
  }

  private calculateParticleLoad(
    reflex: ReflexState,
    emotional: EmotionalState
  ): number {
    // Particle systems respond to reflexes and emotional volatility
    const reflexLoad = 
      reflex.activeReflexes.length / 5 * 0.6 +
      reflex.systemStress * 0.4;
    
    const emotionalLoad = emotional.volatility;
    
    return (reflexLoad + emotionalLoad) / 2;
  }

  private calculateHealth(load: number): number {
    // Convert load (0-1) to health (100-0)
    // Healthy systems can handle moderate load
    if (load < 0.6) return 100;
    if (load < 0.8) return 100 - (load - 0.6) / 0.2 * 30; // 100 -> 70
    return 70 - (load - 0.8) / 0.2 * 70; // 70 -> 0
  }

  // ============================================
  // THERMAL MANAGEMENT
  // ============================================

  private updateTemperature(
    quantumLoad: number,
    holographicLoad: number,
    particleLoad: number,
    deltaTime: number
  ): void {
    // Heat generated by system loads
    const heatGeneration = (quantumLoad + holographicLoad + particleLoad) / 3 * 0.5;
    
    // Natural cooling
    const naturalCooling = this.state.coolingRate * deltaTime;
    
    // Emergency cooling if overheating
    const emergencyCooling = this.state.overheating ? 
      this.REGULATION.thermalCoolingRate * deltaTime : 0;
    
    // Update temperature
    this.state.temperature += heatGeneration * deltaTime;
    this.state.temperature -= (naturalCooling + emergencyCooling);
    this.state.temperature = Math.max(0, Math.min(1, this.state.temperature));
    
    // Check overheating
    this.state.overheating = this.state.temperature > this.THRESHOLDS.overheating;
  }

  // ============================================
  // REGULATIONS
  // ============================================

  private applyRegulations(
    quantumLoad: number,
    holographicLoad: number,
    particleLoad: number,
    timestamp: number
  ): void {
    // Thermal regulation
    if (this.state.overheating) {
      this.addRegulation({
        type: 'thermal',
        action: 'Emergency cooling cycle',
        strength: this.REGULATION.thermalCoolingRate,
        appliedAt: timestamp,
        duration: 3000
      });
    }
    
    // Quantum stabilization
    if (quantumLoad > this.THRESHOLDS.quantumOverload) {
      this.addRegulation({
        type: 'quantum',
        action: 'Quantum field stabilization',
        strength: this.REGULATION.quantumStabilization,
        appliedAt: timestamp,
        duration: 2000
      });
      this.state.damping = Math.min(1, this.state.damping + 0.2);
    }
    
    // Holographic calming
    if (holographicLoad > this.THRESHOLDS.holographicStorm) {
      this.addRegulation({
        type: 'holographic',
        action: 'Holographic dampening field',
        strength: this.REGULATION.holographicCalming,
        appliedAt: timestamp,
        duration: 2500
      });
    }
    
    // Particle throttling
    if (particleLoad > this.THRESHOLDS.particleExplosion) {
      this.addRegulation({
        type: 'particle',
        action: 'Particle density reduction',
        strength: this.REGULATION.particleThrottling,
        appliedAt: timestamp,
        duration: 2000
      });
      this.state.particleDensity *= 0.7;
    }
    
    // Drift control
    if (this.state.driftSpeed > this.THRESHOLDS.driftChaos) {
      this.addRegulation({
        type: 'drift',
        action: 'Drift velocity smoothing',
        strength: this.REGULATION.driftSmoothingFactor,
        appliedAt: timestamp,
        duration: 1500
      });
      this.state.driftSpeed *= 0.8;
    }
    
    // Intensity dampening
    const totalIntensity = this.state.glowIntensity + this.state.particleDensity;
    if (totalIntensity > this.THRESHOLDS.intensityOverdrive) {
      this.addRegulation({
        type: 'intensity',
        action: 'Visual intensity reduction',
        strength: this.REGULATION.intensityDampening,
        appliedAt: timestamp,
        duration: 3000
      });
      this.state.glowIntensity *= 0.85;
    }
  }

  private addRegulation(regulation: Regulation): void {
    // Don't add duplicate regulations
    const exists = this.state.activeRegulations.some(
      reg => reg.type === regulation.type
    );
    if (!exists) {
      this.state.activeRegulations.push(regulation);
    }
  }

  // ============================================
  // VISUAL PARAMETERS
  // ============================================

  private updateVisualParameters(
    environmental: EnvironmentalState,
    emotional: EmotionalState,
    reflex: ReflexState
  ): void {
    // Color warmth based on emotional valence and temperature
    const targetWarmth = 
      emotional.valence * 0.5 +
      (1 - this.state.temperature) * 0.3 +
      (environmental.temperature.currentTemp / 100) * 0.2;
    
    this.state.colorWarmth = this.smoothTransition(
      this.state.colorWarmth,
      targetWarmth,
      0.1
    );
    
    // Glow intensity based on energy and stability
    const targetGlow = 
      emotional.energy * 0.6 +
      (1 - reflex.systemStress) * 0.4;
    
    this.state.glowIntensity = this.smoothTransition(
      this.state.glowIntensity,
      targetGlow * (this.state.overheating ? 0.7 : 1.0),
      0.15
    );
    
    // Particle density based on activity
    const targetDensity = 
      reflex.activeReflexes.length / 5 * 0.4 +
      emotional.volatility * 0.3 +
      environmental.coherence / 100 * 0.3;
    
    this.state.particleDensity = this.smoothTransition(
      this.state.particleDensity,
      Math.min(0.9, targetDensity),
      0.12
    );
    
    // Drift speed based on flow and stability
    const targetDrift = 
      (environmental.flow.dominantFlow.strength / 100) * 0.5 +
      (1 - this.state.stability) * 0.5;
    
    this.state.driftSpeed = this.smoothTransition(
      this.state.driftSpeed,
      Math.min(this.state.driftLimit, targetDrift),
      this.state.driftSmoothing
    );
  }

  private smoothTransition(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
  }

  // ============================================
  // STABILITY CALCULATION
  // ============================================

  private calculateStability(): number {
    // Base stability from health
    const healthStability = this.state.overallHealth / 100 * 0.4;
    
    // Thermal stability
    const thermalStability = (1 - this.state.temperature) * 0.3;
    
    // Regulation effectiveness
    const regulationBonus = this.state.activeRegulations.length > 0 ? 0.15 : 0;
    
    // Drift stability
    const driftStability = (1 - this.state.driftSpeed / this.state.driftLimit) * 0.15;
    
    return Math.min(1, healthStability + thermalStability + regulationBonus + driftStability);
  }

  private calculateFrameStability(): number {
    // Simplified frame stability calculation
    // In production, this would use real performance metrics
    const loadFactor = 
      (this.state.quantumHealth + this.state.holographicHealth + this.state.particleHealth) / 300;
    
    const thermalPenalty = this.state.overheating ? 0.2 : 0;
    
    return Math.max(0.5, Math.min(1, loadFactor - thermalPenalty));
  }

  // ============================================
  // PUBLIC GETTERS
  // ============================================

  public getState(): StabilityFieldState {
    return { ...this.state };
  }

  public getStability(): number {
    return this.state.stability;
  }

  public getOverallHealth(): number {
    return this.state.overallHealth;
  }

  public isOverheating(): boolean {
    return this.state.overheating;
  }

  public getActiveRegulations(): Regulation[] {
    return [...this.state.activeRegulations];
  }

  public getVisualParameters(): {
    colorWarmth: number;
    glowIntensity: number;
    particleDensity: number;
    driftSpeed: number;
  } {
    return {
      colorWarmth: this.state.colorWarmth,
      glowIntensity: this.state.glowIntensity,
      particleDensity: this.state.particleDensity,
      driftSpeed: this.state.driftSpeed
    };
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  public setCoolingRate(rate: number): void {
    this.state.coolingRate = Math.max(0, Math.min(1, rate));
  }

  public setDriftLimit(limit: number): void {
    this.state.driftLimit = Math.max(0, Math.min(1, limit));
  }

  public setRegulation(strength: number): void {
    this.state.regulation = Math.max(0, Math.min(1, strength));
  }

  // ============================================
  // LISTENERS
  // ============================================

  public subscribe(listener: (state: StabilityFieldState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // ============================================
  // RESET
  // ============================================

  public reset(): void {
    this.state = {
      stability: 1.0,
      damping: 0.5,
      regulation: 0.7,
      quantumHealth: 100,
      holographicHealth: 100,
      particleHealth: 100,
      overallHealth: 100,
      activeRegulations: [],
      temperature: 0.3,
      coolingRate: 0.1,
      overheating: false,
      driftSpeed: 0.5,
      driftLimit: 0.8,
      driftSmoothing: 0.15,
      colorWarmth: 0.6,
      glowIntensity: 0.7,
      particleDensity: 0.6,
      frameStability: 1.0,
      lastUpdate: Date.now()
    };
    this.notifyListeners();
  }
}
