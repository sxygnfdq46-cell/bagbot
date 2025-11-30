/**
 * 🔷 LEVEL 8.4 — HOLOGRAPHIC FORECAST LAYER
 * 
 * A transparent particle layer that subtly predicts:
 * - Upcoming bot actions
 * - System changes
 * - Data movement
 * - Connection states
 * 
 * Visually: light trails, pulses, micro-spark holograms.
 */

import { GenomeSnapshot } from '../entity/BehaviorGenome';
import { ExpressionOutput } from '../entity/ExpressionCore';

// ============================================
// TYPES
// ============================================

export interface ForecastState {
  predictions: Prediction[];
  particles: ForecastParticle[];
  trails: LightTrail[];
  microSparks: MicroSpark[];
  predictionAccuracy: number; // 0-100
}

export interface Prediction {
  id: string;
  type: 'action' | 'system' | 'data' | 'connection';
  what: string; // Description of prediction
  confidence: number; // 0-100
  timeWindow: number; // milliseconds until predicted event
  createdAt: number;
  fulfilled: boolean;
}

export interface ForecastParticle {
  id: string;
  x: number; // percentage
  y: number;
  vx: number; // velocity
  vy: number;
  size: number; // 0-10
  opacity: number; // 0-1
  hue: number; // 0-360
  predictionType: Prediction['type'];
  lifetime: number; // ms
  createdAt: number;
}

export interface LightTrail {
  id: string;
  points: Array<{ x: number; y: number; timestamp: number }>;
  hue: number;
  intensity: number; // 0-100
  fadeSpeed: number; // 0-1
  maxLength: number;
  predictionType: Prediction['type'];
}

export interface MicroSpark {
  id: string;
  x: number;
  y: number;
  pulseRadius: number; // current radius
  maxRadius: number;
  intensity: number; // 0-100
  hue: number;
  lifetime: number;
  createdAt: number;
  predictionType: Prediction['type'];
}

// ============================================
// HOLOGRAPHIC FORECAST LAYER
// ============================================

export class HolographicForecast {
  private state: ForecastState;
  private genome: GenomeSnapshot | null = null;
  private expression: ExpressionOutput | null = null;
  private readonly STORAGE_KEY = 'bagbot_holographic_forecast_v1';

  // Prediction tracking
  private predictionHistory: Array<{ predicted: string; actual: string; match: boolean }> = [];

  // Particle configuration
  private readonly MAX_PARTICLES = 50;
  private readonly MAX_TRAILS = 15;
  private readonly MAX_SPARKS = 8;
  private readonly PARTICLE_LIFETIME = 3000; // ms
  private readonly TRAIL_LIFETIME = 2000;
  private readonly SPARK_LIFETIME = 1500;

  // Spawn rates (ms)
  private readonly PARTICLE_SPAWN_RATE = 200;
  private readonly TRAIL_SPAWN_RATE = 500;
  private readonly SPARK_SPAWN_RATE = 800;

  private lastParticleSpawn = 0;
  private lastTrailSpawn = 0;
  private lastSparkSpawn = 0;

  constructor() {
    this.state = this.getDefaultState();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getDefaultState(): ForecastState {
    return {
      predictions: [],
      particles: [],
      trails: [],
      microSparks: [],
      predictionAccuracy: 50, // Start at 50%
    };
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  public update(
    genome: GenomeSnapshot,
    expression: ExpressionOutput,
    systemState: {
      apiPending: number;
      dataLoading: boolean;
      connectionStatus: 'connected' | 'connecting' | 'disconnected';
    }
  ): ForecastState {
    this.genome = genome;
    this.expression = expression;

    // Generate predictions based on current state
    this.generatePredictions(systemState);

    // Spawn forecast visuals
    this.spawnForecastVisuals();

    // Update existing visuals
    this.updateParticles();
    this.updateTrails();
    this.updateSparks();

    // Clean up old predictions
    this.cleanupOldPredictions();

    this.saveToStorage();
    return this.state;
  }

  // ============================================
  // PREDICTION ENGINE
  // ============================================

  private generatePredictions(systemState: {
    apiPending: number;
    dataLoading: boolean;
    connectionStatus: string;
  }): void {
    if (!this.genome || !this.expression) return;

    const now = Date.now();
    const { parameters } = this.genome;

    // Prediction 1: Bot action based on behavior patterns
    if (parameters.predictionBoldness > 60) {
      this.addPrediction({
        type: 'action',
        what: 'Bot will respond within 500ms',
        confidence: parameters.predictionBoldness,
        timeWindow: 500,
      });
    }

    // Prediction 2: System changes based on API activity
    if (systemState.apiPending > 0) {
      this.addPrediction({
        type: 'system',
        what: `${systemState.apiPending} API calls completing`,
        confidence: 70 + Math.min(20, systemState.apiPending * 5),
        timeWindow: 1000 + systemState.apiPending * 200,
      });
    }

    // Prediction 3: Data movement
    if (systemState.dataLoading) {
      this.addPrediction({
        type: 'data',
        what: 'Data will finish loading',
        confidence: 80,
        timeWindow: 1500,
      });
    }

    // Prediction 4: Connection state changes
    if (systemState.connectionStatus === 'connecting') {
      this.addPrediction({
        type: 'connection',
        what: 'Connection will establish',
        confidence: 65,
        timeWindow: 2000,
      });
    }

    // Check for prediction fulfillment
    this.checkPredictionFulfillment();
  }

  private addPrediction(
    prediction: Omit<Prediction, 'id' | 'createdAt' | 'fulfilled'>
  ): void {
    // Avoid duplicates
    const exists = this.state.predictions.find(
      p => p.type === prediction.type && p.what === prediction.what
    );

    if (exists) return;

    const newPrediction: Prediction = {
      id: `pred-${Date.now()}-${Math.random()}`,
      ...prediction,
      createdAt: Date.now(),
      fulfilled: false,
    };

    this.state.predictions.push(newPrediction);

    // Spawn visual for this prediction
    this.spawnPredictionVisual(newPrediction);
  }

  public markPredictionFulfilled(type: Prediction['type'], what: string): void {
    const prediction = this.state.predictions.find(
      p => p.type === type && p.what === what && !p.fulfilled
    );

    if (prediction) {
      prediction.fulfilled = true;

      // Track accuracy
      this.predictionHistory.push({
        predicted: what,
        actual: what,
        match: true,
      });

      this.updateAccuracy();

      // Spawn celebration spark
      this.spawnCelebrationSpark(prediction);
    }
  }

  private checkPredictionFulfillment(): void {
    const now = Date.now();

    this.state.predictions.forEach(prediction => {
      if (prediction.fulfilled) return;

      // Check if prediction window has passed
      const timeSinceCreation = now - prediction.createdAt;
      if (timeSinceCreation > prediction.timeWindow + 1000) {
        // Prediction missed
        this.predictionHistory.push({
          predicted: prediction.what,
          actual: 'timeout',
          match: false,
        });

        prediction.fulfilled = true; // Mark as processed
        this.updateAccuracy();
      }
    });
  }

  private updateAccuracy(): void {
    if (this.predictionHistory.length === 0) return;

    // Calculate accuracy from last 50 predictions
    const recent = this.predictionHistory.slice(-50);
    const matches = recent.filter(h => h.match).length;

    this.state.predictionAccuracy = (matches / recent.length) * 100;
  }

  private cleanupOldPredictions(): void {
    const now = Date.now();
    const maxAge = 10000; // Keep predictions for 10 seconds

    this.state.predictions = this.state.predictions.filter(
      p => now - p.createdAt < maxAge
    );
  }

  // ============================================
  // VISUAL EFFECTS
  // ============================================

  private spawnForecastVisuals(): void {
    const now = Date.now();

    // Spawn particles
    if (now - this.lastParticleSpawn > this.PARTICLE_SPAWN_RATE) {
      this.spawnParticle();
      this.lastParticleSpawn = now;
    }

    // Spawn trails
    if (now - this.lastTrailSpawn > this.TRAIL_SPAWN_RATE) {
      this.spawnTrail();
      this.lastTrailSpawn = now;
    }

    // Spawn sparks
    if (now - this.lastSparkSpawn > this.SPARK_SPAWN_RATE && this.state.predictions.length > 0) {
      this.spawnSpark();
      this.lastSparkSpawn = now;
    }
  }

  private spawnPredictionVisual(prediction: Prediction): void {
    // Spawn a cluster of particles for new prediction
    for (let i = 0; i < 3; i++) {
      this.spawnParticle(prediction.type);
    }

    // Spawn a trail
    this.spawnTrail(prediction.type);
  }

  private spawnParticle(predictionType?: Prediction['type']): void {
    if (this.state.particles.length >= this.MAX_PARTICLES) {
      // Remove oldest
      this.state.particles.shift();
    }

    const type = predictionType || this.getRandomPredictionType();

    const particle: ForecastParticle = {
      id: `particle-${Date.now()}-${Math.random()}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 2 + Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.4,
      hue: this.getHueForPredictionType(type),
      predictionType: type,
      lifetime: this.PARTICLE_LIFETIME,
      createdAt: Date.now(),
    };

    this.state.particles.push(particle);
  }

  private spawnTrail(predictionType?: Prediction['type']): void {
    if (this.state.trails.length >= this.MAX_TRAILS) {
      this.state.trails.shift();
    }

    const type = predictionType || this.getRandomPredictionType();

    const trail: LightTrail = {
      id: `trail-${Date.now()}-${Math.random()}`,
      points: [],
      hue: this.getHueForPredictionType(type),
      intensity: 60 + Math.random() * 30,
      fadeSpeed: 0.02 + Math.random() * 0.03,
      maxLength: 10 + Math.floor(Math.random() * 15),
      predictionType: type,
    };

    // Add initial point
    trail.points.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      timestamp: Date.now(),
    });

    this.state.trails.push(trail);
  }

  private spawnSpark(predictionType?: Prediction['type']): void {
    if (this.state.microSparks.length >= this.MAX_SPARKS) {
      this.state.microSparks.shift();
    }

    const type = predictionType || this.getRandomPredictionType();

    const spark: MicroSpark = {
      id: `spark-${Date.now()}-${Math.random()}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      pulseRadius: 0,
      maxRadius: 20 + Math.random() * 40,
      intensity: 70 + Math.random() * 30,
      hue: this.getHueForPredictionType(type),
      lifetime: this.SPARK_LIFETIME,
      createdAt: Date.now(),
      predictionType: type,
    };

    this.state.microSparks.push(spark);
  }

  private spawnCelebrationSpark(prediction: Prediction): void {
    // Spawn bright spark when prediction is fulfilled
    const spark: MicroSpark = {
      id: `celebration-${Date.now()}`,
      x: 50 + (Math.random() - 0.5) * 30,
      y: 50 + (Math.random() - 0.5) * 30,
      pulseRadius: 0,
      maxRadius: 60,
      intensity: 95,
      hue: this.getHueForPredictionType(prediction.type),
      lifetime: 2000,
      createdAt: Date.now(),
      predictionType: prediction.type,
    };

    this.state.microSparks.push(spark);
  }

  private getRandomPredictionType(): Prediction['type'] {
    const types: Prediction['type'][] = ['action', 'system', 'data', 'connection'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getHueForPredictionType(type: Prediction['type']): number {
    const baseHue = this.expression?.mood ? this.getMoodHue(this.expression.mood.currentTone) : 210;

    switch (type) {
      case 'action':
        return baseHue; // Base color
      case 'system':
        return (baseHue + 90) % 360; // Triadic color
      case 'data':
        return (baseHue + 180) % 360; // Complementary
      case 'connection':
        return (baseHue + 270) % 360; // Triadic opposite
      default:
        return baseHue;
    }
  }

  // ============================================
  // UPDATE VISUALS
  // ============================================

  private updateParticles(): void {
    const now = Date.now();

    this.state.particles = this.state.particles
      .filter(p => now - p.createdAt < p.lifetime)
      .map(particle => {
        const age = now - particle.createdAt;
        const lifeRatio = age / particle.lifetime;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = 100;
        if (particle.x > 100) particle.x = 0;
        if (particle.y < 0) particle.y = 100;
        if (particle.y > 100) particle.y = 0;

        // Fade out
        particle.opacity = Math.max(0, 0.8 * (1 - lifeRatio));

        return particle;
      });
  }

  private updateTrails(): void {
    const now = Date.now();

    this.state.trails.forEach(trail => {
      // Add new point (trail grows)
      if (trail.points.length < trail.maxLength) {
        const lastPoint = trail.points[trail.points.length - 1];

        trail.points.push({
          x: lastPoint.x + (Math.random() - 0.5) * 3,
          y: lastPoint.y + (Math.random() - 0.5) * 3,
          timestamp: now,
        });
      }

      // Fade intensity
      trail.intensity *= (1 - trail.fadeSpeed);

      // Remove old points
      trail.points = trail.points.filter(
        p => now - p.timestamp < this.TRAIL_LIFETIME
      );
    });

    // Remove empty trails
    this.state.trails = this.state.trails.filter(
      t => t.points.length > 0 && t.intensity > 5
    );
  }

  private updateSparks(): void {
    const now = Date.now();

    this.state.microSparks = this.state.microSparks
      .filter(s => now - s.createdAt < s.lifetime)
      .map(spark => {
        const age = now - spark.createdAt;
        const lifeRatio = age / spark.lifetime;

        // Expand pulse
        spark.pulseRadius = spark.maxRadius * lifeRatio;

        // Fade intensity
        spark.intensity *= (1 - lifeRatio * 0.05);

        return spark;
      });
  }

  // ============================================
  // GETTERS
  // ============================================

  private getMoodHue(tone: string): number {
    switch (tone) {
      case 'warmth': return 30;
      case 'intensity': return 0;
      case 'calm': return 210;
      case 'urgency': return 350;
      case 'presence': return 280;
      default: return 210;
    }
  }

  public getState(): ForecastState {
    return this.state;
  }

  public getPredictions(): Prediction[] {
    return this.state.predictions.filter(p => !p.fulfilled);
  }

  public getVisuals(): {
    particles: ForecastParticle[];
    trails: LightTrail[];
    sparks: MicroSpark[];
  } {
    return {
      particles: this.state.particles,
      trails: this.state.trails,
      sparks: this.state.microSparks,
    };
  }

  public getAccuracy(): number {
    return this.state.predictionAccuracy;
  }

  // ============================================
  // STORAGE
  // ============================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const dataToSave = {
        predictionAccuracy: this.state.predictionAccuracy,
        predictionHistory: this.predictionHistory.slice(-50), // Last 50
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[HolographicForecast] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.predictionAccuracy !== undefined) {
        this.state.predictionAccuracy = data.predictionAccuracy;
      }

      if (data.predictionHistory) {
        this.predictionHistory = data.predictionHistory;
      }
    } catch (error) {
      console.error('[HolographicForecast] Failed to load:', error);
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.predictionHistory = [];
    this.saveToStorage();
  }
}
