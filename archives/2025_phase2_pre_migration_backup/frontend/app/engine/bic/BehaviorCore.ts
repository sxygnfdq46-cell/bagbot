/**
 * LEVEL 6.1 — BEHAVIORAL INTELLIGENCE CORE (BIC)
 * The nervous system that makes BagBot feel alive
 * 
 * Ingests all backend data streams and converts them to emotional states
 * that drive the UI visual systems (Level 4 Quantum + Level 5 Ascension)
 * 
 * 100% READ-ONLY | Zero backend modifications | Pure UI intelligence
 */

export type EmotionalState = 'calm' | 'focused' | 'alert' | 'stressed' | 'overclocked';

export interface MarketSummary {
  total_volume_24h: number;
  price_change_percent: number;
  volatility_index: number;
  active_pairs: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  change_24h: number;
  volume: number;
}

export interface VolatilityMetrics {
  current: number;
  avg_1h: number;
  max_24h: number;
  trend: 'rising' | 'falling' | 'stable';
}

export interface StrategyPerformance {
  active: number;
  total_pnl: number;
  win_rate: number;
  avg_execution_time_ms: number;
}

export interface SystemHealth {
  uptime_percent: number;
  cpu_percent: number;
  memory_mb: number;
  worker_count: number;
  error_count_1h: number;
}

export interface LiquidityMetrics {
  bid_depth: number;
  ask_depth: number;
  spread_percent: number;
}

export interface BehaviorData {
  marketSummary?: MarketSummary;
  prices?: PriceData[];
  volatility?: VolatilityMetrics;
  strategies?: StrategyPerformance;
  systemHealth?: SystemHealth;
  liquidity?: LiquidityMetrics;
}

export interface BehaviorOutput {
  // Core emotional state
  emotionalState: EmotionalState;
  
  // UI driver values (0-100)
  auraIntensity: number;           // AI Emotion Aura strength
  hudGlowStrength: number;         // HUD brightness multiplier
  backgroundPulseSpeed: number;    // HaloFlux animation speed
  dataRippleFrequency: number;     // Quantum ripple trigger rate
  colorTemperature: number;        // Hue shift amount (-180 to 180)
  
  // System warnings
  systemWarnings: string[];
  
  // Market mood descriptor
  marketMood: string;
  
  // Intensity level (for Neural Synapse, etc)
  intensity: number;
}

export class BehaviorCore {
  private currentState: EmotionalState = 'calm';
  private previousData: BehaviorData = {};
  private warningBuffer: string[] = [];
  
  /**
   * Main ingestion point - called at 60fps from BehaviorProvider
   * Analyzes all data streams and outputs behavioral signals
   */
  public ingest(data: BehaviorData): BehaviorOutput {
    // Calculate emotional state from all data sources
    const emotionalState = this.calculateEmotionalState(data);
    
    // Convert state to UI parameters
    const output: BehaviorOutput = {
      emotionalState,
      auraIntensity: this.calculateAuraIntensity(data),
      hudGlowStrength: this.calculateHUDGlow(data),
      backgroundPulseSpeed: this.calculatePulseSpeed(data),
      dataRippleFrequency: this.calculateRippleFrequency(data),
      colorTemperature: this.calculateColorTemperature(data),
      systemWarnings: [...this.warningBuffer],
      marketMood: this.describeMarketMood(data),
      intensity: this.calculateIntensity(data),
    };
    
    // Update state
    this.currentState = emotionalState;
    this.previousData = data;
    this.warningBuffer = [];
    
    return output;
  }
  
  /**
   * EMOTIONAL STATE CALCULATION
   * Maps raw data → emotional states
   */
  private calculateEmotionalState(data: BehaviorData): EmotionalState {
    let stressScore = 0;
    
    // Market volatility stress
    if (data.volatility) {
      const volRatio = data.volatility.current / data.volatility.avg_1h;
      if (volRatio > 2) stressScore += 3;
      else if (volRatio > 1.5) stressScore += 2;
      else if (volRatio > 1.2) stressScore += 1;
    }
    
    // System health stress
    if (data.systemHealth) {
      if (data.systemHealth.cpu_percent > 90) stressScore += 3;
      else if (data.systemHealth.cpu_percent > 75) stressScore += 2;
      
      if (data.systemHealth.error_count_1h > 10) stressScore += 2;
      
      if (data.systemHealth.uptime_percent < 95) stressScore += 2;
    }
    
    // Strategy performance stress
    if (data.strategies) {
      if (data.strategies.total_pnl < -5000) stressScore += 3;
      else if (data.strategies.total_pnl < -1000) stressScore += 2;
      
      if (data.strategies.win_rate < 30) stressScore += 2;
      
      if (data.strategies.avg_execution_time_ms > 1000) stressScore += 1;
    }
    
    // Liquidity stress
    if (data.liquidity) {
      if (data.liquidity.spread_percent > 0.5) stressScore += 2;
    }
    
    // Map stress score to emotional state
    if (stressScore >= 8) return 'overclocked';
    if (stressScore >= 5) return 'stressed';
    if (stressScore >= 3) return 'alert';
    if (stressScore >= 1) return 'focused';
    return 'calm';
  }
  
  /**
   * AURA INTENSITY (0-100)
   * Drives AI Emotion Aura brightness
   */
  private calculateAuraIntensity(data: BehaviorData): number {
    let intensity = 50; // Base
    
    // Increase with market activity
    if (data.marketSummary) {
      const volumeBoost = Math.min(30, (data.marketSummary.total_volume_24h / 1000000000) * 10);
      intensity += volumeBoost;
    }
    
    // Increase with volatility
    if (data.volatility) {
      const volBoost = Math.min(20, data.volatility.current * 2);
      intensity += volBoost;
    }
    
    return Math.min(100, Math.max(0, intensity));
  }
  
  /**
   * HUD GLOW STRENGTH (0-100)
   * Drives HUD widget brightness
   */
  private calculateHUDGlow(data: BehaviorData): number {
    let glow = 50; // Base
    
    // Increase with positive P&L
    if (data.strategies) {
      if (data.strategies.total_pnl > 0) {
        glow += Math.min(25, (data.strategies.total_pnl / 1000) * 5);
      } else {
        glow -= Math.min(20, Math.abs(data.strategies.total_pnl) / 1000 * 5);
      }
    }
    
    // Increase with high win rate
    if (data.strategies && data.strategies.win_rate > 60) {
      glow += 15;
    }
    
    return Math.min(100, Math.max(20, glow));
  }
  
  /**
   * BACKGROUND PULSE SPEED (0-100)
   * Drives HaloFlux animation speed
   */
  private calculatePulseSpeed(data: BehaviorData): number {
    let speed = 30; // Base (slow)
    
    // Speed up with market activity
    if (data.marketSummary) {
      const priceChange = Math.abs(data.marketSummary.price_change_percent);
      speed += Math.min(40, priceChange * 2);
    }
    
    // Speed up with system load
    if (data.systemHealth) {
      speed += Math.min(30, data.systemHealth.cpu_percent / 3);
    }
    
    return Math.min(100, Math.max(10, speed));
  }
  
  /**
   * DATA RIPPLE FREQUENCY (0-100)
   * Drives Quantum Ripple trigger rate
   */
  private calculateRippleFrequency(data: BehaviorData): number {
    let frequency = 10; // Base (rare)
    
    // Increase with price volatility
    if (data.volatility) {
      frequency += Math.min(50, data.volatility.current * 5);
    }
    
    // Increase with active strategies
    if (data.strategies) {
      frequency += Math.min(30, data.strategies.active * 3);
    }
    
    return Math.min(100, Math.max(5, frequency));
  }
  
  /**
   * COLOR TEMPERATURE (-180 to 180)
   * Drives hue-rotate for color shifts
   */
  private calculateColorTemperature(data: BehaviorData): number {
    let temp = 0; // Neutral
    
    // Shift to green on profits
    if (data.strategies && data.strategies.total_pnl > 1000) {
      temp += Math.min(60, (data.strategies.total_pnl / 5000) * 60);
    }
    
    // Shift to red on losses
    if (data.strategies && data.strategies.total_pnl < -1000) {
      temp -= Math.min(60, (Math.abs(data.strategies.total_pnl) / 5000) * 60);
    }
    
    // Shift to blue in calm markets
    if (data.volatility && data.volatility.current < 5) {
      temp += 30;
    }
    
    // Shift to orange in stressed markets
    if (this.currentState === 'stressed' || this.currentState === 'overclocked') {
      temp += 45;
    }
    
    return Math.min(180, Math.max(-180, temp));
  }
  
  /**
   * INTENSITY (0-100)
   * Master intensity for Neural Synapse, particle density, etc
   */
  private calculateIntensity(data: BehaviorData): number {
    let intensity = 20; // Base
    
    // Volume impact
    if (data.marketSummary) {
      intensity += Math.min(30, (data.marketSummary.total_volume_24h / 1000000000) * 10);
    }
    
    // Volatility impact
    if (data.volatility) {
      intensity += Math.min(25, data.volatility.current * 2.5);
    }
    
    // Activity impact
    if (data.strategies) {
      intensity += Math.min(25, data.strategies.active * 5);
    }
    
    return Math.min(100, Math.max(5, intensity));
  }
  
  /**
   * MARKET MOOD DESCRIPTOR
   * Human-readable description
   */
  private describeMarketMood(data: BehaviorData): string {
    if (this.currentState === 'overclocked') {
      return 'EXTREME VOLATILITY - MAXIMUM ALERT';
    }
    if (this.currentState === 'stressed') {
      return 'High volatility detected - Elevated monitoring';
    }
    if (this.currentState === 'alert') {
      return 'Market activity increasing - Active monitoring';
    }
    if (this.currentState === 'focused') {
      return 'Normal trading conditions - Focused execution';
    }
    return 'Markets calm - Steady state operations';
  }
  
  /**
   * Add system warning to buffer
   */
  public addWarning(warning: string): void {
    if (this.warningBuffer.length < 5) {
      this.warningBuffer.push(warning);
    }
  }
  
  /**
   * Get current emotional state
   */
  public getCurrentState(): EmotionalState {
    return this.currentState;
  }
}
