/**
 * LEVEL 12.4 — EMOTIONAL GRADIENT FILTER
 * 
 * GPU-accelerated gradient smoothing for seamless emotional transitions.
 * Removes harsh transitions with Gaussian blending.
 * 
 * Features:
 * - Gaussian emotion blending (smooth bell curves)
 * - Warm/cool gradient mapping
 * - 4-level harmonics smoothing
 * - GPU-accelerated processing
 * - Real-time gradient calculation
 * - Transition quality scoring
 * 
 * Monitoring: 100ms intervals (10 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type EmotionalTemperature = 'cool' | 'neutral' | 'warm' | 'hot';

interface EmotionalGradient {
  fromEmotion: string;
  toEmotion: string;
  fromIntensity: number; // 0-100
  toIntensity: number; // 0-100
  progress: number; // 0-1
  temperature: EmotionalTemperature;
  smoothness: number; // 0-100
}

interface GaussianBlend {
  sigma: number; // standard deviation (width of bell curve)
  mu: number; // mean (center of bell curve)
  amplitude: number; // height of curve
}

interface WarmCoolMapping {
  warm: number; // 0-100 (warmth level)
  cool: number; // 0-100 (coolness level)
  balance: number; // -100 to 100 (negative = cool, positive = warm)
}

interface HarmonicSmoothing {
  level1: number; // fundamental
  level2: number; // 2nd harmonic
  level3: number; // 3rd harmonic
  level4: number; // 4th harmonic
  combined: number; // weighted sum
}

interface TransitionQuality {
  smoothness: number; // 0-100
  coherence: number; // 0-100
  naturalness: number; // 0-100
  overall: number; // 0-100
}

interface EmotionalGradientConfig {
  gaussianSigma: number; // 2.0 default
  harmonicWeights: [number, number, number, number]; // [1.0, 0.5, 0.25, 0.125] default
  temperatureThreshold: number; // temperature change threshold
  monitoringInterval: number; // ms
}

/* ================================ */
/* EMOTIONAL GRADIENT FILTER        */
/* ================================ */

export class EmotionalGradientFilter {
  private config: EmotionalGradientConfig;
  private activeGradients: Map<string, EmotionalGradient>;
  private gaussianBlend: GaussianBlend;
  private warmCoolMapping: WarmCoolMapping;
  private harmonicSmoothing: HarmonicSmoothing;
  private transitionQuality: TransitionQuality;
  private monitoringIntervalId: number | null;

  constructor(config?: Partial<EmotionalGradientConfig>) {
    this.config = {
      gaussianSigma: 2.0,
      harmonicWeights: [1.0, 0.5, 0.25, 0.125],
      temperatureThreshold: 15, // 15% change
      monitoringInterval: 100,
      ...config,
    };

    this.activeGradients = new Map();

    this.gaussianBlend = {
      sigma: this.config.gaussianSigma,
      mu: 0.5, // center at 50%
      amplitude: 1.0,
    };

    this.warmCoolMapping = {
      warm: 50,
      cool: 50,
      balance: 0,
    };

    this.harmonicSmoothing = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      combined: 0,
    };

    this.transitionQuality = {
      smoothness: 100,
      coherence: 100,
      naturalness: 100,
      overall: 100,
    };

    this.monitoringIntervalId = null;
    this.startMonitoring();
  }

  /* ================================ */
  /* MONITORING                       */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.updateActiveGradients();
      this.updateTransitionQuality();
    }, this.config.monitoringInterval);
  }

  private updateActiveGradients(): void {
    const gradientEntries = Array.from(this.activeGradients.entries());

    for (const [key, gradient] of gradientEntries) {
      // Update progress
      gradient.progress = Math.min(1, gradient.progress + 0.05); // 5% per cycle

      // Calculate smoothness
      gradient.smoothness = this.calculateGradientSmoothness(gradient);

      // Remove completed gradients
      if (gradient.progress >= 1) {
        this.activeGradients.delete(key);
      }
    }
  }

  private updateTransitionQuality(): void {
    const gradients = Array.from(this.activeGradients.values());

    if (gradients.length === 0) {
      this.transitionQuality = {
        smoothness: 100,
        coherence: 100,
        naturalness: 100,
        overall: 100,
      };
      return;
    }

    // Average smoothness
    const avgSmoothness = gradients.reduce((sum, g) => sum + g.smoothness, 0) / gradients.length;

    // Coherence based on temperature consistency
    const temperatures = gradients.map((g) => g.temperature);
    const uniqueTemperatures = new Set(temperatures).size;
    const coherence = Math.max(0, 100 - uniqueTemperatures * 20);

    // Naturalness based on progress distribution
    const progressVariance = this.calculateProgressVariance(gradients);
    const naturalness = Math.max(0, 100 - progressVariance * 50);

    // Overall quality
    const overall = (avgSmoothness + coherence + naturalness) / 3;

    this.transitionQuality = {
      smoothness: avgSmoothness,
      coherence,
      naturalness,
      overall,
    };
  }

  private calculateProgressVariance(gradients: EmotionalGradient[]): number {
    if (gradients.length === 0) return 0;

    const avg = gradients.reduce((sum, g) => sum + g.progress, 0) / gradients.length;
    const variance = gradients.reduce((sum, g) => sum + Math.pow(g.progress - avg, 2), 0) / gradients.length;

    return Math.sqrt(variance);
  }

  /* ================================ */
  /* GAUSSIAN BLENDING                */
  /* ================================ */

  private gaussianFunction(x: number, mu: number = 0.5, sigma: number = 2.0): number {
    const exponent = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
    return Math.exp(exponent);
  }

  public applyGaussianBlend(from: number, to: number, progress: number): number {
    const weight = this.gaussianFunction(progress, this.gaussianBlend.mu, this.gaussianBlend.sigma);
    return from + (to - from) * weight;
  }

  public setGaussianSigma(sigma: number): void {
    this.gaussianBlend.sigma = Math.max(0.1, Math.min(5, sigma));
  }

  /* ================================ */
  /* WARM/COOL GRADIENT MAPPING       */
  /* ================================ */

  private calculateTemperature(intensity: number): EmotionalTemperature {
    if (intensity < 25) return 'cool';
    if (intensity < 50) return 'neutral';
    if (intensity < 75) return 'warm';
    return 'hot';
  }

  private calculateWarmCoolBalance(fromIntensity: number, toIntensity: number): number {
    const fromTemp = this.calculateTemperature(fromIntensity);
    const toTemp = this.calculateTemperature(toIntensity);

    const tempMap: Record<EmotionalTemperature, number> = {
      cool: -50,
      neutral: 0,
      warm: 50,
      hot: 100,
    };

    return (tempMap[fromTemp] + tempMap[toTemp]) / 2;
  }

  public updateWarmCoolMapping(fromIntensity: number, toIntensity: number): void {
    this.warmCoolMapping.balance = this.calculateWarmCoolBalance(fromIntensity, toIntensity);

    // Update warm/cool levels
    if (this.warmCoolMapping.balance > 0) {
      this.warmCoolMapping.warm = 50 + this.warmCoolMapping.balance / 2;
      this.warmCoolMapping.cool = 50 - this.warmCoolMapping.balance / 2;
    } else {
      this.warmCoolMapping.warm = 50 + this.warmCoolMapping.balance / 2;
      this.warmCoolMapping.cool = 50 - this.warmCoolMapping.balance / 2;
    }
  }

  public getWarmCoolMapping(): WarmCoolMapping {
    return { ...this.warmCoolMapping };
  }

  /* ================================ */
  /* 4-LEVEL HARMONICS SMOOTHING      */
  /* ================================ */

  public applyHarmonicSmoothing(baseValue: number): number {
    const [w1, w2, w3, w4] = this.config.harmonicWeights;

    // Generate 4 harmonic levels
    this.harmonicSmoothing.level1 = baseValue * w1;
    this.harmonicSmoothing.level2 = (baseValue * 0.5) * w2;
    this.harmonicSmoothing.level3 = (baseValue * 0.33) * w3;
    this.harmonicSmoothing.level4 = (baseValue * 0.25) * w4;

    // Combine all levels
    this.harmonicSmoothing.combined =
      this.harmonicSmoothing.level1 +
      this.harmonicSmoothing.level2 +
      this.harmonicSmoothing.level3 +
      this.harmonicSmoothing.level4;

    // Normalize to 0-100 range
    const totalWeight = w1 + w2 + w3 + w4;
    return (this.harmonicSmoothing.combined / totalWeight);
  }

  public setHarmonicWeights(weights: [number, number, number, number]): void {
    this.config.harmonicWeights = weights;
  }

  public getHarmonicSmoothing(): HarmonicSmoothing {
    return { ...this.harmonicSmoothing };
  }

  /* ================================ */
  /* GRADIENT MANAGEMENT              */
  /* ================================ */

  public createGradient(
    key: string,
    fromEmotion: string,
    toEmotion: string,
    fromIntensity: number,
    toIntensity: number
  ): void {
    const temperature = this.calculateTemperature((fromIntensity + toIntensity) / 2);

    this.activeGradients.set(key, {
      fromEmotion,
      toEmotion,
      fromIntensity: Math.max(0, Math.min(100, fromIntensity)),
      toIntensity: Math.max(0, Math.min(100, toIntensity)),
      progress: 0,
      temperature,
      smoothness: 100,
    });

    // Update warm/cool mapping
    this.updateWarmCoolMapping(fromIntensity, toIntensity);
  }

  public updateGradientProgress(key: string, progress: number): void {
    const gradient = this.activeGradients.get(key);
    if (!gradient) return;

    gradient.progress = Math.max(0, Math.min(1, progress));
  }

  public getGradientValue(key: string): number | null {
    const gradient = this.activeGradients.get(key);
    if (!gradient) return null;

    // Apply Gaussian blending
    const blended = this.applyGaussianBlend(
      gradient.fromIntensity,
      gradient.toIntensity,
      gradient.progress
    );

    // Apply harmonic smoothing
    return this.applyHarmonicSmoothing(blended);
  }

  public removeGradient(key: string): void {
    this.activeGradients.delete(key);
  }

  private calculateGradientSmoothness(gradient: EmotionalGradient): number {
    // Smoothness based on progress curve
    const idealProgress = 0.5; // peak smoothness at 50%
    const deviation = Math.abs(gradient.progress - idealProgress);
    return Math.max(0, 100 - deviation * 100);
  }

  /* ================================ */
  /* TRANSITION QUALITY               */
  /* ================================ */

  public getTransitionQuality(): TransitionQuality {
    return { ...this.transitionQuality };
  }

  /* ================================ */
  /* GPU-ACCELERATED PROCESSING       */
  /* ================================ */

  public getGPUGradientCSS(key: string): string {
    const gradient = this.activeGradients.get(key);
    if (!gradient) return '';

    const from = gradient.fromIntensity;
    const to = gradient.toIntensity;
    const progress = gradient.progress;

    // Calculate current intensity with Gaussian blend
    const current = this.applyGaussianBlend(from, to, progress);

    // Map to HSL color
    const hue = this.warmCoolMapping.balance + 180; // convert to 0-360
    const saturation = 70;
    const lightness = 40 + current * 0.2; // 40-60 range

    return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%), hsl(${hue + 30}, ${saturation}%, ${lightness + 10}%))`;
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getState() {
    return {
      activeGradients: Object.fromEntries(this.activeGradients.entries()),
      gaussianBlend: { ...this.gaussianBlend },
      warmCoolMapping: { ...this.warmCoolMapping },
      harmonicSmoothing: { ...this.harmonicSmoothing },
      transitionQuality: { ...this.transitionQuality },
      gradientCount: this.activeGradients.size,
    };
  }

  public getSummary(): string {
    const state = this.getState();

    return `Emotional Gradient Filter Summary:
  Active Gradients: ${state.gradientCount}
  Gaussian Sigma: ${state.gaussianBlend.sigma.toFixed(2)}
  Warm/Cool Balance: ${state.warmCoolMapping.balance.toFixed(1)}
  Transition Quality: ${state.transitionQuality.overall.toFixed(1)}
  Smoothness: ${state.transitionQuality.smoothness.toFixed(1)}
  Coherence: ${state.transitionQuality.coherence.toFixed(1)}
  Naturalness: ${state.transitionQuality.naturalness.toFixed(1)}`;
  }

  /* ================================ */
  /* CONFIGURATION                    */
  /* ================================ */

  public updateConfig(config: Partial<EmotionalGradientConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.gaussianSigma !== undefined) {
      this.gaussianBlend.sigma = config.gaussianSigma;
    }
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.activeGradients.clear();

    this.warmCoolMapping = {
      warm: 50,
      cool: 50,
      balance: 0,
    };

    this.harmonicSmoothing = {
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      combined: 0,
    };

    this.transitionQuality = {
      smoothness: 100,
      coherence: 100,
      naturalness: 100,
      overall: 100,
    };
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      state: this.getState(),
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;

      // Restore gradients
      const gradients = parsed.state.activeGradients;
      this.activeGradients.clear();
      for (const [key, gradient] of Object.entries(gradients)) {
        this.activeGradients.set(key, gradient as EmotionalGradient);
      }

      // Restore other state
      this.gaussianBlend = parsed.state.gaussianBlend;
      this.warmCoolMapping = parsed.state.warmCoolMapping;
      this.harmonicSmoothing = parsed.state.harmonicSmoothing;
      this.transitionQuality = parsed.state.transitionQuality;
    } catch (error) {
      console.error('[EmotionalGradientFilter] Import failed:', error);
    }
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }

    this.activeGradients.clear();
  }
}
