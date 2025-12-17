// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HEAT INDEX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Measures momentum intensity and overextension risk
// Range: 0-100 (0 = cold/stale, 100 = red-hot/exhausted)

export interface HeatReading {
  heat: number; // 0-100
  momentum: number; // Raw momentum value
  acceleration: number; // Rate of momentum change
  overheated: boolean; // True if heat > 80 (risk of exhaustion)
  cold: boolean; // True if heat < 20 (stale market)
  timestamp: number;
}

export interface HeatIndexConfig {
  lookbackPeriod: number; // Bars for momentum calculation (default: 14)
  accelerationPeriod: number; // Bars for acceleration (default: 3)
  overheatedThreshold: number; // Heat level = overheated (default: 80)
  coldThreshold: number; // Heat level = cold (default: 20)
}

/**
 * HeatIndex - Momentum intensity tracker
 * 
 * Purpose: Detect overheated (exhaustion) and cold (stale) market conditions
 * 
 * Heat Levels:
 *   - 0-20: COLD - Stale market, low activity
 *   - 20-40: COOL - Subdued momentum
 *   - 40-60: MODERATE - Balanced conditions
 *   - 60-80: WARM - Strong momentum
 *   - 80-100: OVERHEATED - Exhaustion risk, potential reversal
 * 
 * Trading Logic:
 *   - OVERHEATED (>80): Reduce position size, take profits, avoid chasing
 *   - COLD (<20): Avoid trend trades, wait for catalyst
 *   - MODERATE (40-60): Normal trading conditions
 */
export class HeatIndex {
  private config: HeatIndexConfig;
  private priceHistory: number[] = [];
  private momentumHistory: number[] = [];
  private lastReading: HeatReading | null = null;

  constructor(config?: Partial<HeatIndexConfig>) {
    this.config = {
      lookbackPeriod: config?.lookbackPeriod ?? 14,
      accelerationPeriod: config?.accelerationPeriod ?? 3,
      overheatedThreshold: config?.overheatedThreshold ?? 80,
      coldThreshold: config?.coldThreshold ?? 20,
    };
  }

  /**
   * Update price history and recompute heat
   * @param price - Current market price
   */
  update(price: number): HeatReading {
    this.priceHistory.push(price);
    
    // Keep only lookback period + extra for momentum calculation
    const maxHistory = this.config.lookbackPeriod + this.config.accelerationPeriod + 1;
    if (this.priceHistory.length > maxHistory) {
      this.priceHistory.shift();
    }

    this.lastReading = this.compute();
    return this.lastReading;
  }

  /**
   * Compute heat index
   */
  private compute(): HeatReading {
    if (this.priceHistory.length < 2) {
      return {
        heat: 50,
        momentum: 0,
        acceleration: 0,
        overheated: false,
        cold: false,
        timestamp: Date.now(),
      };
    }

    // Calculate momentum (rate of change)
    const momentum = this.calculateMomentum();
    this.momentumHistory.push(momentum);
    
    if (this.momentumHistory.length > this.config.accelerationPeriod + 1) {
      this.momentumHistory.shift();
    }

    // Calculate acceleration (momentum of momentum)
    const acceleration = this.calculateAcceleration();

    // Calculate heat (0-100)
    // Combine momentum magnitude and acceleration
    const momentumScore = Math.min(100, Math.abs(momentum) * 100);
    const accelerationScore = Math.min(100, Math.abs(acceleration) * 200);
    
    // Weighted average: 70% momentum, 30% acceleration
    const heat = momentumScore * 0.7 + accelerationScore * 0.3;

    const overheated = heat > this.config.overheatedThreshold;
    const cold = heat < this.config.coldThreshold;

    return {
      heat,
      momentum,
      acceleration,
      overheated,
      cold,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate momentum using rate of change
   */
  private calculateMomentum(): number {
    const n = Math.min(this.config.lookbackPeriod, this.priceHistory.length);
    if (n < 2) return 0;

    const recent = this.priceHistory.slice(-n);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    // Rate of change
    return (newest - oldest) / oldest;
  }

  /**
   * Calculate acceleration (rate of momentum change)
   */
  private calculateAcceleration(): number {
    if (this.momentumHistory.length < 2) return 0;

    const n = Math.min(this.config.accelerationPeriod, this.momentumHistory.length);
    const recent = this.momentumHistory.slice(-n);

    // Simple difference of recent vs older momentum
    const older = recent[0];
    const newer = recent[recent.length - 1];

    return newer - older;
  }

  /**
   * Get last computed reading
   */
  getReading(): HeatReading | null {
    return this.lastReading;
  }

  /**
   * Check if market is overheated
   */
  isOverheated(): boolean {
    return this.lastReading?.overheated ?? false;
  }

  /**
   * Check if market is cold
   */
  isCold(): boolean {
    return this.lastReading?.cold ?? false;
  }

  /**
   * Get heat-based confidence multiplier
   * Reduces confidence when overheated or cold
   */
  getConfidenceMultiplier(): number {
    if (!this.lastReading) return 1.0;

    const { heat } = this.lastReading;

    if (heat > this.config.overheatedThreshold) {
      // Overheated: reduce confidence linearly
      // 80 -> 1.0, 90 -> 0.8, 100 -> 0.6
      return Math.max(0.6, 1.0 - (heat - this.config.overheatedThreshold) / 50);
    } else if (heat < this.config.coldThreshold) {
      // Cold: reduce confidence linearly
      // 20 -> 1.0, 10 -> 0.8, 0 -> 0.6
      return Math.max(0.6, heat / this.config.coldThreshold);
    }

    // Moderate heat: full confidence
    return 1.0;
  }

  /**
   * Get heat zone classification
   */
  getHeatZone(): 'COLD' | 'COOL' | 'MODERATE' | 'WARM' | 'OVERHEATED' {
    if (!this.lastReading) return 'MODERATE';

    const { heat } = this.lastReading;

    if (heat < 20) return 'COLD';
    if (heat < 40) return 'COOL';
    if (heat < 60) return 'MODERATE';
    if (heat < 80) return 'WARM';
    return 'OVERHEATED';
  }

  /**
   * Reset history
   */
  reset(): void {
    this.priceHistory = [];
    this.momentumHistory = [];
    this.lastReading = null;
  }
}

export default HeatIndex;
