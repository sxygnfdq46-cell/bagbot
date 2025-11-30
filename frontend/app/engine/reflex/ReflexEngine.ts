/**
 * 🔴 REFLEX ENGINE
 * 
 * Instant reactive system (0-60ms response time)
 * Triggers automatic defensive/adaptive responses to market shocks
 * 
 * This is the "fight-or-flight" nervous system for BagBot.
 */

import type { EnvironmentalState } from '../environmental/EnvironmentalConsciousnessCore';

// Emotional state interface (compatible with cognitive fusion)
export interface EmotionalState {
  energy: number;       // 0-1
  valence: number;      // 0-1 (negative to positive)
  intensity: number;    // 0-1
  volatility: number;   // 0-1
  presence: number;     // 0-1
}

// ============================================
// REFLEX TYPES
// ============================================

export type ReflexType =
  | 'defensive_pulse'      // Sudden shock → defensive posture
  | 'expansion_glow'       // Calm rise → confident expansion
  | 'rapid_cooling'        // Overheating → thermal regulation
  | 'stasis_filter'        // Liquidity freeze → blue calm filter
  | 'polarity_shift'       // Atmospheric inversion → reverse stance
  | 'shock_absorption'     // Volatility spike → dampening ripple
  | 'momentum_brace';      // Heavy momentum → reinforcement

export type ReflexMode = 'defensive' | 'aggressive' | 'calm';

// ============================================
// REFLEX STATE
// ============================================

export interface ReflexState {
  activeReflexes: ActiveReflex[];
  mode: ReflexMode;
  intensity: number;           // 0-1 how strong reflexes are
  sensitivity: number;         // 0-1 how easily triggered
  cooldown: number;            // ms before next reflex can fire
  lastTrigger: number;
  totalTriggered: number;
  
  // Current conditions
  detectedThreats: ThreatDetection[];
  systemStress: number;        // 0-1 overall stress level
  reflexScore: number;         // 0-100 health of reflex system
}

export interface ActiveReflex {
  type: ReflexType;
  triggeredAt: number;
  duration: number;           // ms
  intensity: number;          // 0-1
  visualEffect: VisualEffect;
  reason: string;
}

export interface ThreatDetection {
  type: 'microburst' | 'gravity_slam' | 'volatility' | 'liquidity' | 'jetstream' | 'emotional' | 'atmospheric';
  severity: number;           // 0-1
  source: string;
  detectedAt: number;
  requiresReflex: boolean;
}

export interface VisualEffect {
  name: string;
  color: string;
  duration: number;
  intensity: number;
  cssClass: string;
}

// ============================================
// REFLEX ENGINE
// ============================================

export class ReflexEngine {
  private state: ReflexState;
  private listeners: Set<(state: ReflexState) => void> = new Set();
  
  // Thresholds for triggering reflexes
  private readonly THRESHOLDS = {
    volatilitySpike: 0.7,
    liquidityFreeze: 0.3,
    gravitySlam: 0.8,
    microburstShock: 0.75,
    jetstreamAccel: 0.65,
    emotionalInstability: 0.7,
    atmosphericInversion: 0.6,
    overclockDanger: 0.85
  };
  
  // Cooldown periods (ms)
  private readonly COOLDOWNS = {
    defensive_pulse: 2000,
    expansion_glow: 3000,
    rapid_cooling: 1500,
    stasis_filter: 4000,
    polarity_shift: 5000,
    shock_absorption: 1000,
    momentum_brace: 2500
  };

  constructor() {
    this.state = {
      activeReflexes: [],
      mode: 'calm',
      intensity: 0.7,
      sensitivity: 0.8,
      cooldown: 0,
      lastTrigger: 0,
      totalTriggered: 0,
      detectedThreats: [],
      systemStress: 0,
      reflexScore: 100
    };
  }

  // ============================================
  // UPDATE LOOP
  // ============================================

  public update(
    environmental: EnvironmentalState,
    emotional: EmotionalState,
    timestamp: number = Date.now()
  ): ReflexState {
    // Detect threats from all systems
    const threats = this.detectThreats(environmental, emotional);
    
    // Update system stress
    this.state.systemStress = this.calculateSystemStress(threats, environmental, emotional);
    
    // Determine reflex mode
    this.state.mode = this.determineReflexMode(this.state.systemStress, emotional);
    
    // Process threats and trigger reflexes
    for (const threat of threats) {
      if (threat.requiresReflex && this.canTriggerReflex(timestamp)) {
        const reflex = this.triggerReflexForThreat(threat, timestamp);
        if (reflex) {
          this.state.activeReflexes.push(reflex);
          this.state.lastTrigger = timestamp;
          this.state.totalTriggered++;
        }
      }
    }
    
    // Update active reflexes (remove expired)
    this.state.activeReflexes = this.state.activeReflexes.filter(reflex => {
      const elapsed = timestamp - reflex.triggeredAt;
      return elapsed < reflex.duration;
    });
    
    // Update reflex score
    this.state.reflexScore = this.calculateReflexScore();
    
    // Store detected threats
    this.state.detectedThreats = threats;
    
    // Notify listeners
    this.notifyListeners();
    
    return this.state;
  }

  // ============================================
  // THREAT DETECTION
  // ============================================

  private detectThreats(
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): ThreatDetection[] {
    const threats: ThreatDetection[] = [];
    const now = Date.now();

    // 1. Microburst shocks
    if (environmental.microbursts.burstEnergy > this.THRESHOLDS.microburstShock * 100) {
      threats.push({
        type: 'microburst',
        severity: environmental.microbursts.burstEnergy / 100,
        source: 'MicroburstSensor',
        detectedAt: now,
        requiresReflex: true
      });
    }

    // 2. Gravity slams
    if (environmental.gravity.fieldStrength > this.THRESHOLDS.gravitySlam * 100) {
      threats.push({
        type: 'gravity_slam',
        severity: environmental.gravity.fieldStrength / 100,
        source: 'VolumeGravityDetector',
        detectedAt: now,
        requiresReflex: true
      });
    }

    // 3. Volatility spikes (weather temperature = volatility)
    if (environmental.weather.temperature > this.THRESHOLDS.volatilitySpike * 100) {
      threats.push({
        type: 'volatility',
        severity: environmental.weather.temperature / 100,
        source: 'MarketWeatherEngine',
        detectedAt: now,
        requiresReflex: true
      });
    }

    // 4. Liquidity freezes (liquidity temperature)
    if (environmental.temperature.currentTemp < this.THRESHOLDS.liquidityFreeze * 100) {
      threats.push({
        type: 'liquidity',
        severity: 1 - (environmental.temperature.currentTemp / 100),
        source: 'LiquidityThermostat',
        detectedAt: now,
        requiresReflex: true
      });
    }

    // 5. Jetstream acceleration
    if (environmental.jetstream.trendStrength > this.THRESHOLDS.jetstreamAccel * 100) {
      threats.push({
        type: 'jetstream',
        severity: environmental.jetstream.trendStrength / 100,
        source: 'TrendJetstreamDetector',
        detectedAt: now,
        requiresReflex: environmental.jetstream.trendStrength > 80
      });
    }

    // 6. Internal emotional instability
    if (emotional.volatility > this.THRESHOLDS.emotionalInstability) {
      threats.push({
        type: 'emotional',
        severity: emotional.volatility,
        source: 'EmotionalCoreEngine',
        detectedAt: now,
        requiresReflex: true
      });
    }

    // 7. Atmospheric inversions (weather polarity flips)
    // Use pressure as sentiment proxy (high=bullish, low=bearish)
    const pressureSentiment = (environmental.weather.pressure - 50) / 50; // -1 to 1
    if (Math.abs(pressureSentiment) > this.THRESHOLDS.atmosphericInversion) {
      const isInversion = 
        (pressureSentiment > 0 && emotional.valence < 0.3) ||
        (pressureSentiment < 0 && emotional.valence > 0.7);
      
      if (isInversion) {
        threats.push({
          type: 'atmospheric',
          severity: Math.abs(pressureSentiment),
          source: 'MarketWeatherEngine',
          detectedAt: now,
          requiresReflex: true
        });
      }
    }

    return threats;
  }

  // ============================================
  // REFLEX TRIGGERING
  // ============================================

  private triggerReflexForThreat(
    threat: ThreatDetection,
    timestamp: number
  ): ActiveReflex | null {
    let reflexType: ReflexType;
    let effect: VisualEffect;
    let duration: number;

    switch (threat.type) {
      case 'microburst':
        reflexType = 'shock_absorption';
        effect = {
          name: 'Shock Absorption Ripple',
          color: '#ff4444',
          duration: 1500,
          intensity: threat.severity,
          cssClass: 'reflex-shock-absorption'
        };
        duration = 1500;
        break;

      case 'gravity_slam':
        reflexType = 'momentum_brace';
        effect = {
          name: 'Reinforced Glow Field',
          color: '#4444ff',
          duration: 2500,
          intensity: threat.severity,
          cssClass: 'reflex-momentum-brace'
        };
        duration = 2500;
        break;

      case 'volatility':
        reflexType = 'defensive_pulse';
        effect = {
          name: 'Emergency Pulse',
          color: '#dd2266',
          duration: 2000,
          intensity: threat.severity,
          cssClass: 'reflex-defensive-pulse'
        };
        duration = 2000;
        break;

      case 'liquidity':
        reflexType = 'stasis_filter';
        effect = {
          name: 'Blue Stasis Filter',
          color: '#2266dd',
          duration: 4000,
          intensity: threat.severity,
          cssClass: 'reflex-stasis-filter'
        };
        duration = 4000;
        break;

      case 'jetstream':
        reflexType = 'rapid_cooling';
        effect = {
          name: 'Rapid Cooling Cycle',
          color: '#22dddd',
          duration: 1500,
          intensity: threat.severity,
          cssClass: 'reflex-rapid-cooling'
        };
        duration = 1500;
        break;

      case 'emotional':
        reflexType = 'defensive_pulse';
        effect = {
          name: 'Stabilization Pulse',
          color: '#dd66dd',
          duration: 2000,
          intensity: threat.severity,
          cssClass: 'reflex-stabilization'
        };
        duration = 2000;
        break;

      case 'atmospheric':
        reflexType = 'polarity_shift';
        effect = {
          name: 'Polarity Shift',
          color: '#dddd22',
          duration: 5000,
          intensity: threat.severity,
          cssClass: 'reflex-polarity-shift'
        };
        duration = 5000;
        break;

      default:
        return null;
    }

    return {
      type: reflexType,
      triggeredAt: timestamp,
      duration,
      intensity: threat.severity * this.state.intensity,
      visualEffect: effect,
      reason: `${threat.type} detected at severity ${(threat.severity * 100).toFixed(0)}%`
    };
  }

  // ============================================
  // SYSTEM CALCULATIONS
  // ============================================

  private calculateSystemStress(
    threats: ThreatDetection[],
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): number {
    if (threats.length === 0) return 0;

    // Weighted stress from threats
    const threatStress = threats.reduce((sum, threat) => sum + threat.severity, 0) / threats.length;
    
    // Environmental stress
    const envStress = 
      (environmental.weather.temperature / 100) * 0.3 +
      (1 - environmental.environmentalHealth / 100) * 0.2 +
      (environmental.gravity.fieldStrength / 100) * 0.2 +
      (environmental.microbursts.burstEnergy / 100) * 0.3;
    
    // Emotional stress
    const emotionalStress = emotional.volatility;
    
    // Combined stress (0-1)
    return Math.min(1, (threatStress * 0.5 + envStress * 0.3 + emotionalStress * 0.2));
  }

  private determineReflexMode(systemStress: number, emotional: EmotionalState): ReflexMode {
    if (systemStress > 0.7) return 'defensive';
    if (emotional.energy > 0.7 && emotional.valence > 0.6) return 'aggressive';
    return 'calm';
  }

  private canTriggerReflex(timestamp: number): boolean {
    const timeSinceLastTrigger = timestamp - this.state.lastTrigger;
    return timeSinceLastTrigger >= this.state.cooldown;
  }

  private calculateReflexScore(): number {
    // Base score
    let score = 100;
    
    // Penalty for excessive stress
    score -= this.state.systemStress * 20;
    
    // Penalty for too many active reflexes (system overload)
    const reflexOverload = Math.max(0, this.state.activeReflexes.length - 3);
    score -= reflexOverload * 10;
    
    // Bonus for healthy threat detection
    if (this.state.detectedThreats.length > 0 && this.state.detectedThreats.length < 4) {
      score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // ============================================
  // PUBLIC GETTERS
  // ============================================

  public getState(): ReflexState {
    return { ...this.state };
  }

  public getActiveReflexes(): ActiveReflex[] {
    return [...this.state.activeReflexes];
  }

  public isReflexActive(type: ReflexType): boolean {
    return this.state.activeReflexes.some(reflex => reflex.type === type);
  }

  public getMode(): ReflexMode {
    return this.state.mode;
  }

  public getSystemStress(): number {
    return this.state.systemStress;
  }

  public getReflexScore(): number {
    return this.state.reflexScore;
  }

  public getDetectedThreats(): ThreatDetection[] {
    return [...this.state.detectedThreats];
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  public setSensitivity(sensitivity: number): void {
    this.state.sensitivity = Math.max(0, Math.min(1, sensitivity));
  }

  public setIntensity(intensity: number): void {
    this.state.intensity = Math.max(0, Math.min(1, intensity));
  }

  public setCooldown(cooldown: number): void {
    this.state.cooldown = Math.max(0, cooldown);
  }

  // ============================================
  // LISTENERS
  // ============================================

  public subscribe(listener: (state: ReflexState) => void): () => void {
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
      activeReflexes: [],
      mode: 'calm',
      intensity: 0.7,
      sensitivity: 0.8,
      cooldown: 0,
      lastTrigger: 0,
      totalTriggered: 0,
      detectedThreats: [],
      systemStress: 0,
      reflexScore: 100
    };
    this.notifyListeners();
  }
}
