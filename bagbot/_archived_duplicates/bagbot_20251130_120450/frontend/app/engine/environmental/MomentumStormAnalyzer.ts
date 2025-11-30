/**
 * ⚡ MOMENTUMSTORM ANALYZER (MSA)
 * 
 * Detects surges from 1% to 100 ms scale.
 * Tracks momentum waves and identifies building storms.
 */

export interface MomentumStormState {
  // Storm detection
  activeStorms: Storm[];
  buildingPressure: PressureFront[];
  
  // Surge tracking
  surges: MomentumSurge[];
  surgeForecast: SurgeForecast[];
  
  // Scale analysis
  microScale: ScaleMetrics;    // <100ms
  miniScale: ScaleMetrics;     // 100ms-1s
  shortScale: ScaleMetrics;    // 1s-1min
  mediumScale: ScaleMetrics;   // 1min-5min
  longScale: ScaleMetrics;     // 5min-1hr
  
  // Storm metrics
  stormIntensity: number;      // 0-100 (current storm strength)
  stormProbability: number;    // 0-100 (likelihood of storm)
  energyLevel: number;         // 0-100 (accumulated momentum)
  discharge: number;           // 0-100 (how much energy was released)
}

export interface Storm {
  id: string;
  type: 'momentum_burst' | 'trend_storm' | 'flash_crash' | 'melt_up';
  intensity: number;           // 0-100
  duration: number;            // milliseconds
  peakTime: number;            // timestamp
  direction: 'bullish' | 'bearish';
  scale: 'micro' | 'mini' | 'short' | 'medium' | 'long';
  epicenter: { x: number; y: number };
  radius: number;
  age: number;
}

export interface PressureFront {
  buildupRate: number;         // How fast pressure is building
  timeToStorm: number;         // Estimated ms until storm
  confidence: number;          // 0-100
  type: 'buying' | 'selling' | 'neutral';
  strength: number;            // 0-100
}

export interface MomentumSurge {
  timestamp: number;
  magnitude: number;           // 0-100
  duration: number;            // milliseconds
  scale: 'micro' | 'mini' | 'short' | 'medium' | 'long';
  direction: number;           // -1 to 1 (bearish to bullish)
  velocity: number;            // Rate of change
  acceleration: number;        // Change in velocity
}

export interface SurgeForecast {
  timestamp: number;           // When surge is expected
  probability: number;         // 0-100
  estimatedMagnitude: number;  // 0-100
  confidence: number;          // 0-100
}

export interface ScaleMetrics {
  momentum: number;            // Current momentum at this scale
  velocity: number;            // Rate of change
  acceleration: number;        // Change in velocity
  direction: number;           // -1 to 1
  volatility: number;          // Variance in momentum
  coherence: number;           // How aligned with other scales
}

export interface MomentumData {
  timestamp: number;
  price: number;
  volume: number;
  deltaVolume: number;         // Net buying pressure
  trades: number;
  aggressiveBuys: number;
  aggressiveSells: number;
}

export class MomentumStormAnalyzer {
  private state: MomentumStormState;
  private momentumHistory: Map<string, MomentumData[]>; // Scale -> data points
  private readonly MICRO_WINDOW = 10;      // 10 ticks (<100ms each)
  private readonly MINI_WINDOW = 10;       // 1 second
  private readonly SHORT_WINDOW = 60;      // 1 minute
  private readonly MEDIUM_WINDOW = 300;    // 5 minutes
  private readonly LONG_WINDOW = 3600;     // 1 hour

  constructor() {
    this.state = this.getDefaultState();
    this.momentumHistory = new Map([
      ['micro', []],
      ['mini', []],
      ['short', []],
      ['medium', []],
      ['long', []]
    ]);
  }

  private getDefaultState(): MomentumStormState {
    const defaultScale: ScaleMetrics = {
      momentum: 0,
      velocity: 0,
      acceleration: 0,
      direction: 0,
      volatility: 0,
      coherence: 50
    };

    return {
      activeStorms: [],
      buildingPressure: [],
      surges: [],
      surgeForecast: [],
      microScale: { ...defaultScale },
      miniScale: { ...defaultScale },
      shortScale: { ...defaultScale },
      mediumScale: { ...defaultScale },
      longScale: { ...defaultScale },
      stormIntensity: 0,
      stormProbability: 0,
      energyLevel: 0,
      discharge: 0
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(data: MomentumData): MomentumStormState {
    // Add to all scale histories
    for (const [scale, history] of Array.from(this.momentumHistory.entries())) {
      history.push({ ...data });
      
      // Trim based on scale window
      const maxSize = this.getWindowSize(scale);
      if (history.length > maxSize) {
        history.shift();
      }
    }

    // Analyze each scale
    this.analyzeScale('micro', this.MICRO_WINDOW);
    this.analyzeScale('mini', this.MINI_WINDOW);
    this.analyzeScale('short', this.SHORT_WINDOW);
    this.analyzeScale('medium', this.MEDIUM_WINDOW);
    this.analyzeScale('long', this.LONG_WINDOW);

    // Detect surges
    this.detectSurges(data);

    // Check for building pressure
    this.analyzePressure();

    // Detect active storms
    this.detectStorms();

    // Update storm metrics
    this.calculateStormMetrics();

    // Generate surge forecast
    this.forecastSurges();

    return this.state;
  }

  // ============================================
  // SCALE ANALYSIS
  // ============================================

  private analyzeScale(scale: string, windowSize: number): void {
    const history = this.momentumHistory.get(scale);
    if (!history || history.length < 2) return;

    const recent = history.slice(-windowSize);
    const metrics = this.calculateScaleMetrics(recent);

    // Update appropriate scale
    switch (scale) {
      case 'micro':
        this.state.microScale = metrics;
        break;
      case 'mini':
        this.state.miniScale = metrics;
        break;
      case 'short':
        this.state.shortScale = metrics;
        break;
      case 'medium':
        this.state.mediumScale = metrics;
        break;
      case 'long':
        this.state.longScale = metrics;
        break;
    }
  }

  private calculateScaleMetrics(data: MomentumData[]): ScaleMetrics {
    if (data.length < 2) {
      return {
        momentum: 0,
        velocity: 0,
        acceleration: 0,
        direction: 0,
        volatility: 0,
        coherence: 50
      };
    }

    // Calculate momentum (cumulative delta volume)
    const momentum = data.reduce((sum, d) => sum + d.deltaVolume, 0);
    const normalizedMomentum = Math.min(100, Math.max(-100, momentum / data.length * 10));

    // Calculate velocity (rate of change in price)
    const priceChanges = [];
    for (let i = 1; i < data.length; i++) {
      priceChanges.push((data[i].price - data[i - 1].price) / data[i - 1].price * 100);
    }
    const velocity = priceChanges.reduce((sum, pc) => sum + pc, 0) / priceChanges.length;

    // Calculate acceleration (change in velocity)
    let acceleration = 0;
    if (priceChanges.length > 1) {
      const recentVel = priceChanges.slice(-3).reduce((sum, pc) => sum + pc, 0) / 3;
      const earlierVel = priceChanges.slice(0, 3).reduce((sum, pc) => sum + pc, 0) / 3;
      acceleration = recentVel - earlierVel;
    }

    // Direction (-1 to 1)
    const direction = Math.sign(momentum) * Math.min(1, Math.abs(normalizedMomentum) / 50);

    // Volatility (variance in momentum)
    const avgMomentum = momentum / data.length;
    const variance = data.reduce((sum, d) => {
      return sum + Math.pow(d.deltaVolume - avgMomentum, 2);
    }, 0) / data.length;
    const volatility = Math.min(100, Math.sqrt(variance) * 10);

    // Coherence (calculated later in cross-scale analysis)
    const coherence = 50;

    return {
      momentum: normalizedMomentum,
      velocity,
      acceleration,
      direction,
      volatility,
      coherence
    };
  }

  // ============================================
  // SURGE DETECTION
  // ============================================

  private detectSurges(current: MomentumData): void {
    // Check each scale for surge conditions
    const scales: Array<{ name: 'micro' | 'mini' | 'short' | 'medium' | 'long'; metrics: ScaleMetrics }> = [
      { name: 'micro', metrics: this.state.microScale },
      { name: 'mini', metrics: this.state.miniScale },
      { name: 'short', metrics: this.state.shortScale },
      { name: 'medium', metrics: this.state.mediumScale },
      { name: 'long', metrics: this.state.longScale }
    ];

    for (const scale of scales) {
      const { metrics } = scale;

      // Surge detected when:
      // 1. High momentum (>60)
      // 2. High velocity
      // 3. Positive acceleration
      const isSurge = 
        Math.abs(metrics.momentum) > 60 &&
        Math.abs(metrics.velocity) > 0.5 &&
        metrics.acceleration * Math.sign(metrics.momentum) > 0;

      if (isSurge) {
        this.state.surges.push({
          timestamp: current.timestamp,
          magnitude: Math.abs(metrics.momentum),
          duration: this.getScaleDuration(scale.name),
          scale: scale.name,
          direction: metrics.direction,
          velocity: metrics.velocity,
          acceleration: metrics.acceleration
        });
      }
    }

    // Keep only recent surges (last 100)
    if (this.state.surges.length > 100) {
      this.state.surges = this.state.surges.slice(-100);
    }

    // Remove surges older than 1 hour
    const hourAgo = current.timestamp - 3600000;
    this.state.surges = this.state.surges.filter(s => s.timestamp > hourAgo);
  }

  // ============================================
  // PRESSURE ANALYSIS
  // ============================================

  private analyzePressure(): void {
    this.state.buildingPressure = [];

    // Look for patterns that indicate building pressure
    const scales = [this.state.microScale, this.state.miniScale, this.state.shortScale];
    
    // Check for sustained directional bias with increasing volatility
    let buyingPressure = 0;
    let sellingPressure = 0;

    for (const scale of scales) {
      if (scale.direction > 0 && scale.volatility > 40) {
        buyingPressure += scale.momentum;
      } else if (scale.direction < 0 && scale.volatility > 40) {
        sellingPressure += Math.abs(scale.momentum);
      }
    }

    // Create pressure fronts
    if (buyingPressure > 100) {
      const buildupRate = this.state.shortScale.acceleration;
      const timeToStorm = buildupRate > 0 ? 30000 / buildupRate : 60000; // Estimate

      this.state.buildingPressure.push({
        buildupRate,
        timeToStorm: Math.min(300000, Math.max(10000, timeToStorm)),
        confidence: Math.min(90, buyingPressure / 2),
        type: 'buying',
        strength: Math.min(100, buyingPressure / 3)
      });
    }

    if (sellingPressure > 100) {
      const buildupRate = Math.abs(this.state.shortScale.acceleration);
      const timeToStorm = buildupRate > 0 ? 30000 / buildupRate : 60000;

      this.state.buildingPressure.push({
        buildupRate,
        timeToStorm: Math.min(300000, Math.max(10000, timeToStorm)),
        confidence: Math.min(90, sellingPressure / 2),
        type: 'selling',
        strength: Math.min(100, sellingPressure / 3)
      });
    }
  }

  // ============================================
  // STORM DETECTION
  // ============================================

  private detectStorms(): void {
    // Age existing storms
    this.state.activeStorms = this.state.activeStorms.filter(storm => {
      storm.age++;
      return storm.age < 100; // Remove old storms
    });

    // Detect new storms based on extreme conditions
    const now = Date.now();

    // Momentum burst: Extreme micro/mini scale movement
    if (Math.abs(this.state.microScale.momentum) > 80 && 
        Math.abs(this.state.miniScale.momentum) > 70) {
      
      this.state.activeStorms.push({
        id: `storm_${now}_burst`,
        type: 'momentum_burst',
        intensity: Math.abs(this.state.microScale.momentum),
        duration: 5000, // 5 seconds
        peakTime: now,
        direction: this.state.microScale.direction > 0 ? 'bullish' : 'bearish',
        scale: 'micro',
        epicenter: { x: 50 + Math.random() * 20 - 10, y: 50 },
        radius: 30,
        age: 0
      });
    }

    // Trend storm: Sustained strong momentum across scales
    const coherentStrength = (
      Math.abs(this.state.shortScale.momentum) +
      Math.abs(this.state.mediumScale.momentum) +
      Math.abs(this.state.longScale.momentum)
    ) / 3;

    if (coherentStrength > 65 && 
        this.state.shortScale.direction === this.state.mediumScale.direction) {
      
      this.state.activeStorms.push({
        id: `storm_${now}_trend`,
        type: 'trend_storm',
        intensity: coherentStrength,
        duration: 300000, // 5 minutes
        peakTime: now,
        direction: this.state.shortScale.direction > 0 ? 'bullish' : 'bearish',
        scale: 'medium',
        epicenter: { x: 50, y: 50 },
        radius: 60,
        age: 0
      });
    }

    // Flash crash/melt up: Extreme acceleration + high volatility
    if (Math.abs(this.state.microScale.acceleration) > 2 && 
        this.state.microScale.volatility > 70) {
      
      const isFlashCrash = this.state.microScale.direction < 0;
      
      this.state.activeStorms.push({
        id: `storm_${now}_${isFlashCrash ? 'crash' : 'meltup'}`,
        type: isFlashCrash ? 'flash_crash' : 'melt_up',
        intensity: 95,
        duration: 2000, // 2 seconds
        peakTime: now,
        direction: isFlashCrash ? 'bearish' : 'bullish',
        scale: 'micro',
        epicenter: { x: 50, y: isFlashCrash ? 20 : 80 },
        radius: 50,
        age: 0
      });
    }

    // Limit storm count
    if (this.state.activeStorms.length > 5) {
      this.state.activeStorms.sort((a, b) => b.intensity - a.intensity);
      this.state.activeStorms = this.state.activeStorms.slice(0, 5);
    }
  }

  // ============================================
  // STORM METRICS
  // ============================================

  private calculateStormMetrics(): void {
    // Storm intensity = highest active storm intensity
    this.state.stormIntensity = this.state.activeStorms.length > 0
      ? Math.max(...this.state.activeStorms.map(s => s.intensity))
      : 0;

    // Storm probability from building pressure
    this.state.stormProbability = this.state.buildingPressure.length > 0
      ? Math.max(...this.state.buildingPressure.map(p => p.confidence))
      : 0;

    // Energy level = accumulated momentum across scales
    this.state.energyLevel = Math.min(100,
      (Math.abs(this.state.microScale.momentum) * 0.1 +
       Math.abs(this.state.miniScale.momentum) * 0.15 +
       Math.abs(this.state.shortScale.momentum) * 0.25 +
       Math.abs(this.state.mediumScale.momentum) * 0.3 +
       Math.abs(this.state.longScale.momentum) * 0.2)
    );

    // Discharge = how much energy released in recent surges
    const recentSurges = this.state.surges.slice(-10);
    this.state.discharge = recentSurges.length > 0
      ? Math.min(100, recentSurges.reduce((sum, s) => sum + s.magnitude, 0) / 10)
      : 0;
  }

  // ============================================
  // SURGE FORECAST
  // ============================================

  private forecastSurges(): void {
    this.state.surgeForecast = [];
    const now = Date.now();

    // Use building pressure to forecast surges
    for (const pressure of this.state.buildingPressure) {
      this.state.surgeForecast.push({
        timestamp: now + pressure.timeToStorm,
        probability: pressure.confidence,
        estimatedMagnitude: pressure.strength,
        confidence: pressure.confidence * 0.8 // Slightly lower for forecast
      });
    }

    // Add pattern-based forecasts
    if (this.state.energyLevel > 70 && this.state.discharge < 30) {
      // High energy, low discharge = surge likely
      this.state.surgeForecast.push({
        timestamp: now + 60000, // 1 minute
        probability: this.state.energyLevel,
        estimatedMagnitude: this.state.energyLevel * 0.8,
        confidence: 60
      });
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private getWindowSize(scale: string): number {
    switch (scale) {
      case 'micro': return this.MICRO_WINDOW;
      case 'mini': return this.MINI_WINDOW;
      case 'short': return this.SHORT_WINDOW;
      case 'medium': return this.MEDIUM_WINDOW;
      case 'long': return this.LONG_WINDOW;
      default: return 100;
    }
  }

  private getScaleDuration(scale: 'micro' | 'mini' | 'short' | 'medium' | 'long'): number {
    switch (scale) {
      case 'micro': return 100;
      case 'mini': return 1000;
      case 'short': return 60000;
      case 'medium': return 300000;
      case 'long': return 3600000;
    }
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): MomentumStormState {
    return { ...this.state };
  }

  public getActiveStorms(): Storm[] {
    return [...this.state.activeStorms];
  }

  public getSurges(scale?: 'micro' | 'mini' | 'short' | 'medium' | 'long'): MomentumSurge[] {
    if (scale) {
      return this.state.surges.filter(s => s.scale === scale);
    }
    return [...this.state.surges];
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.momentumHistory.forEach(history => history.length = 0);
  }
}
