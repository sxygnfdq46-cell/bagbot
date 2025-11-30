/**
 * 💨 MICROBURST SENSOR (MBS)
 * 
 * Identifies micro-volatility bursts before your UI sees them.
 * Detects sudden market movements milliseconds before they manifest.
 */

export interface MicroburstSensorState {
  // Active microbursts
  activeBursts: Microburst[];
  burstCount: number;
  
  // Detection
  sensitivity: number;          // 0-100 (how sensitive to bursts)
  detectionThreshold: number;   // Minimum magnitude to detect
  anticipation: number;         // 0-100 (how early we detect)
  
  // Burst metrics
  burstFrequency: number;       // Bursts per minute
  avgBurstMagnitude: number;    // Average size
  burstDensity: number;         // 0-100 (how clustered bursts are)
  burstEnergy: number;          // 0-100 (accumulated energy)
  
  // Pressure waves
  pressureWaves: PressureWave[];
  waveInterference: number;     // 0-100 (wave collisions)
  
  // Forecast
  nextBurstProbability: number; // 0-100
  timeToNextBurst: number;      // milliseconds
  forecastConfidence: number;   // 0-100
}

export interface Microburst {
  id: string;
  timestamp: number;
  magnitude: number;            // 0-100
  direction: 'up' | 'down';
  speed: number;                // How fast it developed
  duration: number;             // milliseconds
  epicenter: { x: number; y: number };
  shockRadius: number;          // How far effect spreads
  type: 'spike' | 'flash' | 'tremor' | 'jolt';
  intensity: number;            // 0-100
  age: number;
}

export interface PressureWave {
  origin: { x: number; y: number };
  radius: number;               // Current spread
  maxRadius: number;            // Max spread
  amplitude: number;            // Wave strength
  frequency: number;            // Oscillation rate
  phase: number;                // 0-360 degrees
  velocity: number;             // Expansion speed
  timestamp: number;
}

export interface TickData {
  timestamp: number;
  price: number;
  volume: number;
  side: 'buy' | 'sell' | 'unknown';
  aggressiveness: number;       // 0-1 (how aggressive the trade)
  delta: number;                // Price change from previous
}

export class MicroburstSensor {
  private state: MicroburstSensorState;
  private tickHistory: TickData[];
  private burstHistory: Microburst[];
  private readonly TICK_WINDOW = 100;    // Last 100 ticks
  private readonly BURST_HISTORY = 500;  // Keep 500 bursts in history
  private lastTickTime: number = 0;

  constructor() {
    this.state = this.getDefaultState();
    this.tickHistory = [];
    this.burstHistory = [];
  }

  private getDefaultState(): MicroburstSensorState {
    return {
      activeBursts: [],
      burstCount: 0,
      sensitivity: 70,
      detectionThreshold: 30,
      anticipation: 0,
      burstFrequency: 0,
      avgBurstMagnitude: 0,
      burstDensity: 0,
      burstEnergy: 0,
      pressureWaves: [],
      waveInterference: 0,
      nextBurstProbability: 0,
      timeToNextBurst: 0,
      forecastConfidence: 0
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(tick: TickData): MicroburstSensorState {
    // Add to history
    this.tickHistory.push(tick);
    if (this.tickHistory.length > this.TICK_WINDOW) {
      this.tickHistory.shift();
    }

    // Calculate time between ticks (for speed detection)
    const tickSpeed = this.lastTickTime > 0 
      ? tick.timestamp - this.lastTickTime 
      : 0;
    this.lastTickTime = tick.timestamp;

    // Detect microbursts
    this.detectMicrobursts(tick, tickSpeed);

    // Age existing bursts
    this.updateBursts();

    // Update pressure waves
    this.updatePressureWaves();

    // Calculate burst metrics
    this.calculateBurstMetrics();

    // Forecast next burst
    this.forecastNextBurst();

    return this.state;
  }

  // ============================================
  // BURST DETECTION
  // ============================================

  private detectMicrobursts(tick: TickData, tickSpeed: number): void {
    if (this.tickHistory.length < 5) return;

    // Get recent context
    const recent = this.tickHistory.slice(-5);
    const avgDelta = recent.reduce((sum, t) => sum + Math.abs(t.delta), 0) / recent.length;
    const avgVolume = recent.reduce((sum, t) => sum + t.volume, 0) / recent.length;

    // Detect burst conditions
    const magnitudeCondition = Math.abs(tick.delta) > avgDelta * 2; // 2x average
    const volumeCondition = tick.volume > avgVolume * 1.5;          // 1.5x average
    const speedCondition = tickSpeed < 50;                          // Fast tick (<50ms)
    const aggressionCondition = tick.aggressiveness > 0.7;         // Aggressive trade

    // Calculate detection score
    const detectionScore = 
      (magnitudeCondition ? 25 : 0) +
      (volumeCondition ? 25 : 0) +
      (speedCondition ? 25 : 0) +
      (aggressionCondition ? 25 : 0);

    // Adjust for sensitivity
    const adjustedScore = detectionScore * (this.state.sensitivity / 100);

    // Detect burst if score exceeds threshold
    if (adjustedScore >= this.state.detectionThreshold) {
      const burst = this.createMicroburst(tick, adjustedScore, tickSpeed);
      this.state.activeBursts.push(burst);
      this.burstHistory.push(burst);

      // Keep burst history limited
      if (this.burstHistory.length > this.BURST_HISTORY) {
        this.burstHistory.shift();
      }

      // Create pressure wave
      this.createPressureWave(burst);
    }
  }

  private createMicroburst(tick: TickData, magnitude: number, tickSpeed: number): Microburst {
    // Classify burst type
    let type: 'spike' | 'flash' | 'tremor' | 'jolt';
    if (magnitude > 80 && tickSpeed < 20) {
      type = 'flash'; // Extreme + ultra-fast
    } else if (magnitude > 70) {
      type = 'spike'; // Large movement
    } else if (tickSpeed < 30) {
      type = 'jolt'; // Very fast
    } else {
      type = 'tremor'; // Moderate
    }

    // Calculate shock radius (how far effect spreads)
    const shockRadius = 20 + (magnitude * 0.5) + (tick.volume * 10);

    return {
      id: `burst_${tick.timestamp}_${Math.random()}`,
      timestamp: tick.timestamp,
      magnitude,
      direction: tick.delta > 0 ? 'up' : 'down',
      speed: tickSpeed > 0 ? 1000 / tickSpeed : 100, // Ticks per second
      duration: this.estimateDuration(type),
      epicenter: { 
        x: 50 + (Math.random() * 30 - 15), 
        y: tick.delta > 0 ? 70 : 30 
      },
      shockRadius,
      type,
      intensity: magnitude,
      age: 0
    };
  }

  private estimateDuration(type: 'spike' | 'flash' | 'tremor' | 'jolt'): number {
    switch (type) {
      case 'flash': return 500;   // 0.5 seconds
      case 'spike': return 1000;  // 1 second
      case 'jolt': return 750;    // 0.75 seconds
      case 'tremor': return 1500; // 1.5 seconds
    }
  }

  // ============================================
  // BURST UPDATES
  // ============================================

  private updateBursts(): void {
    const now = Date.now();

    // Age and remove expired bursts
    this.state.activeBursts = this.state.activeBursts.filter(burst => {
      burst.age = now - burst.timestamp;
      return burst.age < burst.duration;
    });

    this.state.burstCount = this.state.activeBursts.length;

    // Update anticipation (how early we're detecting)
    if (this.state.activeBursts.length > 0) {
      // If we have active bursts, we're detecting well
      this.state.anticipation = Math.min(100, this.state.anticipation + 2);
    } else {
      // Decay if no detections
      this.state.anticipation = Math.max(0, this.state.anticipation - 1);
    }
  }

  // ============================================
  // PRESSURE WAVES
  // ============================================

  private createPressureWave(burst: Microburst): void {
    this.state.pressureWaves.push({
      origin: { ...burst.epicenter },
      radius: 0,
      maxRadius: burst.shockRadius,
      amplitude: burst.magnitude / 100,
      frequency: 2 + burst.speed * 0.01, // Hz
      phase: 0,
      velocity: 5 + burst.magnitude * 0.1, // Expansion speed
      timestamp: burst.timestamp
    });

    // Limit pressure waves
    if (this.state.pressureWaves.length > 10) {
      this.state.pressureWaves.shift();
    }
  }

  private updatePressureWaves(): void {
    const now = Date.now();

    // Update wave expansion
    for (let i = this.state.pressureWaves.length - 1; i >= 0; i--) {
      const wave = this.state.pressureWaves[i];
      const dt = (now - wave.timestamp) / 1000; // seconds

      // Expand radius
      wave.radius = Math.min(wave.maxRadius, wave.velocity * dt);

      // Update phase
      wave.phase = (wave.phase + wave.frequency * 360 * dt / 60) % 360;

      // Remove if fully expanded
      if (wave.radius >= wave.maxRadius) {
        this.state.pressureWaves.splice(i, 1);
      }
    }

    // Calculate wave interference
    this.calculateWaveInterference();
  }

  private calculateWaveInterference(): void {
    if (this.state.pressureWaves.length < 2) {
      this.state.waveInterference = 0;
      return;
    }

    let totalInterference = 0;
    let pairCount = 0;

    // Check all wave pairs
    for (let i = 0; i < this.state.pressureWaves.length; i++) {
      for (let j = i + 1; j < this.state.pressureWaves.length; j++) {
        const wave1 = this.state.pressureWaves[i];
        const wave2 = this.state.pressureWaves[j];

        // Calculate distance between wave centers
        const dx = wave1.origin.x - wave2.origin.x;
        const dy = wave1.origin.y - wave2.origin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check if waves overlap
        if (dist < wave1.radius + wave2.radius) {
          // Calculate interference strength
          const overlap = (wave1.radius + wave2.radius - dist) / Math.max(wave1.radius, wave2.radius);
          const phaseDiff = Math.abs(wave1.phase - wave2.phase);
          
          // Constructive interference if in phase, destructive if out of phase
          const interferenceType = phaseDiff < 90 || phaseDiff > 270 ? 1 : -1;
          const strength = overlap * Math.abs(Math.cos(phaseDiff * Math.PI / 180)) * interferenceType;

          totalInterference += Math.abs(strength) * (wave1.amplitude + wave2.amplitude);
          pairCount++;
        }
      }
    }

    this.state.waveInterference = pairCount > 0 
      ? Math.min(100, (totalInterference / pairCount) * 100)
      : 0;
  }

  // ============================================
  // BURST METRICS
  // ============================================

  private calculateBurstMetrics(): void {
    if (this.burstHistory.length === 0) {
      this.state.burstFrequency = 0;
      this.state.avgBurstMagnitude = 0;
      this.state.burstDensity = 0;
      this.state.burstEnergy = 0;
      return;
    }

    // Frequency: bursts per minute
    const now = Date.now();
    const recentBursts = this.burstHistory.filter(b => now - b.timestamp < 60000);
    this.state.burstFrequency = recentBursts.length;

    // Average magnitude
    this.state.avgBurstMagnitude = 
      recentBursts.reduce((sum, b) => sum + b.magnitude, 0) / recentBursts.length;

    // Density: how clustered bursts are in time
    if (recentBursts.length > 1) {
      const timestamps = recentBursts.map(b => b.timestamp).sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < timestamps.length; i++) {
        gaps.push(timestamps[i] - timestamps[i - 1]);
      }
      const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
      const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
      
      // Low variance = high density
      this.state.burstDensity = Math.max(0, 100 - Math.sqrt(variance) / 100);
    }

    // Energy: accumulated magnitude of active bursts
    this.state.burstEnergy = Math.min(100,
      this.state.activeBursts.reduce((sum, b) => sum + b.magnitude, 0) / 10
    );
  }

  // ============================================
  // FORECAST
  // ============================================

  private forecastNextBurst(): void {
    if (this.burstHistory.length < 3) {
      this.state.nextBurstProbability = 0;
      this.state.timeToNextBurst = 0;
      this.state.forecastConfidence = 0;
      return;
    }

    const now = Date.now();
    const recent = this.burstHistory.filter(b => now - b.timestamp < 60000);

    if (recent.length < 2) {
      this.state.nextBurstProbability = 0;
      this.state.timeToNextBurst = 0;
      this.state.forecastConfidence = 0;
      return;
    }

    // Calculate average time between bursts
    const timestamps = recent.map(b => b.timestamp).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;

    // Time since last burst
    const lastBurst = this.burstHistory[this.burstHistory.length - 1];
    const timeSinceLast = now - lastBurst.timestamp;

    // Probability increases as we approach average gap
    const progress = timeSinceLast / avgGap;
    this.state.nextBurstProbability = Math.min(100, progress * 80);

    // Time to next burst (estimate)
    this.state.timeToNextBurst = Math.max(0, avgGap - timeSinceLast);

    // Confidence based on burst density and pattern consistency
    const gapVariance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
    const consistency = Math.max(0, 100 - (Math.sqrt(gapVariance) / avgGap * 100));
    
    this.state.forecastConfidence = (consistency + this.state.burstDensity) / 2;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): MicroburstSensorState {
    return { ...this.state };
  }

  public getActiveBursts(): Microburst[] {
    return [...this.state.activeBursts];
  }

  public isActive(): boolean {
    return this.state.burstCount > 0;
  }

  public setSensitivity(sensitivity: number): void {
    this.state.sensitivity = Math.max(0, Math.min(100, sensitivity));
  }

  public setDetectionThreshold(threshold: number): void {
    this.state.detectionThreshold = Math.max(0, Math.min(100, threshold));
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.tickHistory = [];
    this.burstHistory = [];
    this.lastTickTime = 0;
  }
}
