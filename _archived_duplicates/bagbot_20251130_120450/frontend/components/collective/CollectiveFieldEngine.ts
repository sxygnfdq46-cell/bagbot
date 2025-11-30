/**
 * LEVEL 11.4 — COLLECTIVE FIELD ENGINE (CFE)
 * 
 * Senses group behavior, crowd emotional pressure, and collective momentum.
 * Creates a synthetic "crowd field" from environmental signals — ZERO data storage.
 * 
 * Architecture:
 * - Micro-signal aggregation (volatility, anomaly, pacing, liquidity)
 * - Crowd pressure calculation (0-100)
 * - Momentum tracking (-50 to +50)
 * - Emotional bias detection (fear/neutral/greed)
 * - Field coherence & density metrics
 * 
 * This makes BagBot sense the "pulse of the environment."
 */

// ================================
// FIELD TYPES
// ================================

/**
 * Micro-signals from environment
 */
export interface MicroSignals {
  volatilitySpike: number; // 0-100: how sharp recent volatility
  anomalyDensity: number; // 0-100: unusual patterns per time window
  pacingAcceleration: number; // -50 to +50: speed change rate
  liquidityShift: number; // -50 to +50: flow direction change
  interactionBurst: number; // 0-100: sudden activity spike
  patternFragmentation: number; // 0-100: loss of structure
}

/**
 * Volatility cluster analysis
 */
export interface VolatilityCluster {
  center: number; // Cluster centroid value
  radius: number; // Spread of cluster
  density: number; // 0-100: how packed
  trend: 'expanding' | 'contracting' | 'stable';
  emotionalBias: 'fear' | 'neutral' | 'greed';
}

/**
 * Environmental cue
 */
export interface EnvironmentalCue {
  type: 'tempo' | 'rhythm' | 'pressure' | 'flow' | 'resonance';
  intensity: number; // 0-100
  direction: 'inward' | 'outward' | 'circular' | 'chaotic';
  persistence: number; // 0-100: how long-lasting
}

/**
 * Liquidity rhythm pattern
 */
export interface LiquidityRhythm {
  flowRate: number; // 0-100: slow -> fast
  pulsePattern: 'steady' | 'erratic' | 'surge' | 'drain';
  depthStability: number; // 0-100: how stable
  imbalanceRatio: number; // -50 to +50: buy pressure vs sell
}

/**
 * Collective field state
 */
export interface CollectiveField {
  timestamp: number;
  
  // Core metrics
  pressure: number; // 0-100: crowd emotional pressure
  momentum: number; // -50 to +50: collective movement direction
  emotionalBias: 'fear' | 'neutral' | 'greed';
  
  // Field properties
  coherence: number; // 0-100: how unified the crowd is
  density: number; // 0-100: how concentrated activity is
  turbulence: number; // 0-100: chaotic vs smooth
  
  // Components
  volatilityClusters: VolatilityCluster[];
  environmentalCues: EnvironmentalCue[];
  liquidityRhythm: LiquidityRhythm;
  
  // Derived
  crowdPhase: 'accumulation' | 'distribution' | 'neutral' | 'panic';
  sentimentIntensity: number; // 0-100
}

/**
 * Field history point (for pattern detection)
 */
export interface FieldHistoryPoint {
  timestamp: number;
  pressure: number;
  momentum: number;
  emotionalBias: 'fear' | 'neutral' | 'greed';
  crowdPhase: CollectiveField['crowdPhase'];
}

// ================================
// COLLECTIVE FIELD ENGINE
// ================================

export class CollectiveFieldEngine {
  private currentField: CollectiveField;
  private fieldHistory: FieldHistoryPoint[];
  private readonly MAX_HISTORY = 200; // ~3.3 minutes at 1s intervals
  
  // Signal buffers
  private volatilityBuffer: number[] = [];
  private anomalyBuffer: number[] = [];
  private pacingBuffer: number[] = [];
  private liquidityBuffer: number[] = [];
  
  private readonly BUFFER_SIZE = 30; // 30-second windows
  
  constructor() {
    this.currentField = this.createDefaultField();
    this.fieldHistory = [];
  }

  /**
   * Create default field
   */
  private createDefaultField(): CollectiveField {
    return {
      timestamp: Date.now(),
      pressure: 30,
      momentum: 0,
      emotionalBias: 'neutral',
      coherence: 70,
      density: 40,
      turbulence: 20,
      volatilityClusters: [],
      environmentalCues: [],
      liquidityRhythm: {
        flowRate: 50,
        pulsePattern: 'steady',
        depthStability: 70,
        imbalanceRatio: 0,
      },
      crowdPhase: 'neutral',
      sentimentIntensity: 40,
    };
  }

  /**
   * Update field with micro-signals
   */
  updateMicroSignals(signals: MicroSignals): void {
    // Buffer signals
    this.volatilityBuffer.push(signals.volatilitySpike);
    this.anomalyBuffer.push(signals.anomalyDensity);
    this.pacingBuffer.push(signals.pacingAcceleration);
    this.liquidityBuffer.push(signals.liquidityShift);
    
    // Maintain buffer size
    if (this.volatilityBuffer.length > this.BUFFER_SIZE) {
      this.volatilityBuffer.shift();
      this.anomalyBuffer.shift();
      this.pacingBuffer.shift();
      this.liquidityBuffer.shift();
    }
    
    // Calculate pressure from signals
    const pressure = this.calculatePressure(signals);
    
    // Calculate momentum from buffers
    const momentum = this.calculateMomentum();
    
    // Detect emotional bias
    const emotionalBias = this.detectEmotionalBias(signals, momentum);
    
    // Update field
    this.currentField.timestamp = Date.now();
    this.currentField.pressure = pressure;
    this.currentField.momentum = momentum;
    this.currentField.emotionalBias = emotionalBias;
    
    // Calculate field properties
    this.calculateFieldProperties();
    
    // Update components
    this.updateVolatilityClusters();
    this.updateEnvironmentalCues(signals);
    this.updateLiquidityRhythm();
    
    // Determine crowd phase
    this.determineCrowdPhase();
    
    // Record history
    this.recordHistory();
  }

  /**
   * Calculate collective pressure
   */
  private calculatePressure(signals: MicroSignals): number {
    // Pressure increases with:
    // - High volatility spikes
    // - Dense anomalies
    // - Rapid pacing acceleration
    // - High interaction bursts
    // - Pattern fragmentation
    
    const weights = {
      volatility: 0.3,
      anomaly: 0.25,
      pacing: 0.15,
      burst: 0.2,
      fragmentation: 0.1,
    };
    
    const weightedSum =
      signals.volatilitySpike * weights.volatility +
      signals.anomalyDensity * weights.anomaly +
      Math.abs(signals.pacingAcceleration) * weights.pacing +
      signals.interactionBurst * weights.burst +
      signals.patternFragmentation * weights.fragmentation;
    
    // Blend with previous pressure (smoothing)
    const blendFactor = 0.3;
    const newPressure = weightedSum;
    const smoothedPressure =
      this.currentField.pressure * (1 - blendFactor) + newPressure * blendFactor;
    
    return Math.max(0, Math.min(100, smoothedPressure));
  }

  /**
   * Calculate collective momentum
   */
  private calculateMomentum(): number {
    if (this.pacingBuffer.length < 5) return 0;
    
    // Momentum is the directional trend of pacing + liquidity
    const recentPacing = this.pacingBuffer.slice(-10);
    const recentLiquidity = this.liquidityBuffer.slice(-10);
    
    // Calculate acceleration trend
    let pacingTrend = 0;
    for (let i = 1; i < recentPacing.length; i++) {
      pacingTrend += recentPacing[i] - recentPacing[i - 1];
    }
    pacingTrend /= recentPacing.length - 1;
    
    // Calculate liquidity trend
    const avgLiquidity =
      recentLiquidity.reduce((sum, v) => sum + v, 0) / recentLiquidity.length;
    
    // Combine trends
    const momentum = (pacingTrend * 0.6 + avgLiquidity * 0.4) * 2;
    
    return Math.max(-50, Math.min(50, momentum));
  }

  /**
   * Detect emotional bias
   */
  private detectEmotionalBias(
    signals: MicroSignals,
    momentum: number
  ): 'fear' | 'neutral' | 'greed' {
    // Fear: high volatility + negative momentum + high fragmentation
    const fearScore =
      signals.volatilitySpike * 0.4 +
      Math.max(0, -momentum) * 0.3 +
      signals.patternFragmentation * 0.3;
    
    // Greed: high burst + positive momentum + low anomaly
    const greedScore =
      signals.interactionBurst * 0.4 +
      Math.max(0, momentum) * 0.3 +
      (100 - signals.anomalyDensity) * 0.3;
    
    if (fearScore > 60) return 'fear';
    if (greedScore > 60) return 'greed';
    return 'neutral';
  }

  /**
   * Calculate field properties
   */
  private calculateFieldProperties(): void {
    // Coherence: inverse of turbulence + low anomaly variance
    const anomalyVariance =
      this.anomalyBuffer.length > 1
        ? this.variance(this.anomalyBuffer)
        : 0;
    this.currentField.coherence = Math.max(
      0,
      100 - anomalyVariance * 2 - this.currentField.turbulence * 0.5
    );
    
    // Density: average of volatility + anomaly + burst activity
    const avgVolatility =
      this.volatilityBuffer.length > 0
        ? this.volatilityBuffer.reduce((sum, v) => sum + v, 0) /
          this.volatilityBuffer.length
        : 0;
    const avgAnomaly =
      this.anomalyBuffer.length > 0
        ? this.anomalyBuffer.reduce((sum, v) => sum + v, 0) /
          this.anomalyBuffer.length
        : 0;
    
    this.currentField.density = (avgVolatility + avgAnomaly) / 2;
    
    // Turbulence: variance of pacing + volatility spikes
    const pacingVariance =
      this.pacingBuffer.length > 1
        ? this.variance(this.pacingBuffer)
        : 0;
    const volatilitySpikes = this.volatilityBuffer.filter(v => v > 70).length;
    
    this.currentField.turbulence = Math.min(
      100,
      pacingVariance * 1.5 + volatilitySpikes * 5
    );
  }

  /**
   * Update volatility clusters
   */
  private updateVolatilityClusters(): void {
    if (this.volatilityBuffer.length < 10) return;
    
    // Simple k-means clustering (k=3)
    const clusters = this.kMeansClustering(this.volatilityBuffer, 3);
    
    this.currentField.volatilityClusters = clusters.map(cluster => {
      const center = cluster.reduce((sum, v) => sum + v, 0) / cluster.length;
      const radius = Math.sqrt(this.variance(cluster));
      const density = (cluster.length / this.volatilityBuffer.length) * 100;
      
      // Trend: compare to previous clusters
      const trend = this.determineClusterTrend(center, radius);
      
      // Emotional bias based on center value
      let emotionalBias: 'fear' | 'neutral' | 'greed' = 'neutral';
      if (center > 70) emotionalBias = 'fear';
      else if (center < 30) emotionalBias = 'greed';
      
      return {
        center,
        radius,
        density,
        trend,
        emotionalBias,
      };
    });
  }

  /**
   * Simple k-means clustering
   */
  private kMeansClustering(data: number[], k: number): number[][] {
    if (data.length < k) return [data];
    
    // Initialize centroids
    const sorted = [...data].sort((a, b) => a - b);
    const centroids: number[] = [];
    for (let i = 0; i < k; i++) {
      centroids.push(sorted[Math.floor((i * sorted.length) / k)]);
    }
    
    // Iterate (max 10 iterations)
    for (let iter = 0; iter < 10; iter++) {
      // Assign points to nearest centroid
      const clusters: number[][] = Array(k)
        .fill(null)
        .map(() => []);
      
      data.forEach(point => {
        let minDist = Infinity;
        let nearestCluster = 0;
        
        centroids.forEach((centroid, i) => {
          const dist = Math.abs(point - centroid);
          if (dist < minDist) {
            minDist = dist;
            nearestCluster = i;
          }
        });
        
        clusters[nearestCluster].push(point);
      });
      
      // Update centroids
      let converged = true;
      clusters.forEach((cluster, i) => {
        if (cluster.length === 0) return;
        const newCentroid =
          cluster.reduce((sum, v) => sum + v, 0) / cluster.length;
        if (Math.abs(newCentroid - centroids[i]) > 0.1) {
          converged = false;
        }
        centroids[i] = newCentroid;
      });
      
      if (converged) return clusters.filter(c => c.length > 0);
    }
    
    return Array(k)
      .fill(null)
      .map(() => []);
  }

  /**
   * Determine cluster trend
   */
  private determineClusterTrend(
    center: number,
    radius: number
  ): 'expanding' | 'contracting' | 'stable' {
    // Compare to previous frame (simplified)
    const previousClusters = this.currentField.volatilityClusters;
    if (previousClusters.length === 0) return 'stable';
    
    // Find closest previous cluster
    const closest = previousClusters.reduce((prev, curr) =>
      Math.abs(curr.center - center) < Math.abs(prev.center - center)
        ? curr
        : prev
    );
    
    const radiusDiff = radius - closest.radius;
    if (radiusDiff > 2) return 'expanding';
    if (radiusDiff < -2) return 'contracting';
    return 'stable';
  }

  /**
   * Update environmental cues
   */
  private updateEnvironmentalCues(signals: MicroSignals): void {
    const cues: EnvironmentalCue[] = [];
    
    // Tempo cue from pacing
    if (this.pacingBuffer.length > 5) {
      const avgPacing =
        this.pacingBuffer.reduce((sum, v) => sum + Math.abs(v), 0) /
        this.pacingBuffer.length;
      cues.push({
        type: 'tempo',
        intensity: avgPacing * 2,
        direction: this.pacingBuffer[this.pacingBuffer.length - 1] > 0 ? 'outward' : 'inward',
        persistence: this.calculatePersistence(this.pacingBuffer),
      });
    }
    
    // Pressure cue from volatility
    cues.push({
      type: 'pressure',
      intensity: signals.volatilitySpike,
      direction: signals.volatilitySpike > 70 ? 'chaotic' : 'circular',
      persistence: this.calculatePersistence(this.volatilityBuffer),
    });
    
    // Flow cue from liquidity
    if (this.liquidityBuffer.length > 0) {
      const avgLiquidity =
        this.liquidityBuffer.reduce((sum, v) => sum + v, 0) /
        this.liquidityBuffer.length;
      cues.push({
        type: 'flow',
        intensity: Math.abs(avgLiquidity) * 2,
        direction: avgLiquidity > 0 ? 'outward' : 'inward',
        persistence: this.calculatePersistence(this.liquidityBuffer),
      });
    }
    
    // Resonance cue from coherence
    cues.push({
      type: 'resonance',
      intensity: this.currentField.coherence,
      direction: this.currentField.coherence > 70 ? 'circular' : 'chaotic',
      persistence: this.currentField.coherence,
    });
    
    this.currentField.environmentalCues = cues;
  }

  /**
   * Calculate persistence
   */
  private calculatePersistence(buffer: number[]): number {
    if (buffer.length < 3) return 50;
    
    // Persistence = consistency over time
    const variance = this.variance(buffer);
    return Math.max(0, 100 - variance * 2);
  }

  /**
   * Update liquidity rhythm
   */
  private updateLiquidityRhythm(): void {
    if (this.liquidityBuffer.length < 5) return;
    
    const recent = this.liquidityBuffer.slice(-10);
    
    // Flow rate: absolute average
    const flowRate =
      recent.reduce((sum, v) => sum + Math.abs(v), 0) / recent.length;
    
    // Pulse pattern: variance-based
    const variance = this.variance(recent);
    let pulsePattern: LiquidityRhythm['pulsePattern'] = 'steady';
    if (variance > 50) pulsePattern = 'erratic';
    else if (flowRate > 30 && variance < 20) pulsePattern = 'surge';
    else if (flowRate < 20 && recent[recent.length - 1] < 0) pulsePattern = 'drain';
    
    // Depth stability: inverse of variance
    const depthStability = Math.max(0, 100 - variance * 2);
    
    // Imbalance ratio: average direction
    const imbalanceRatio =
      recent.reduce((sum, v) => sum + v, 0) / recent.length;
    
    this.currentField.liquidityRhythm = {
      flowRate: Math.min(100, flowRate * 2),
      pulsePattern,
      depthStability,
      imbalanceRatio,
    };
  }

  /**
   * Determine crowd phase
   */
  private determineCrowdPhase(): void {
    const { pressure, momentum, emotionalBias } = this.currentField;
    
    // Accumulation: low pressure, positive momentum, neutral/greed
    if (
      pressure < 40 &&
      momentum > 10 &&
      (emotionalBias === 'neutral' || emotionalBias === 'greed')
    ) {
      this.currentField.crowdPhase = 'accumulation';
    }
    // Distribution: moderate pressure, negative momentum, greed
    else if (
      pressure > 50 &&
      momentum < -10 &&
      emotionalBias === 'greed'
    ) {
      this.currentField.crowdPhase = 'distribution';
    }
    // Panic: high pressure, negative momentum, fear
    else if (
      pressure > 70 &&
      momentum < -20 &&
      emotionalBias === 'fear'
    ) {
      this.currentField.crowdPhase = 'panic';
    }
    // Neutral: everything else
    else {
      this.currentField.crowdPhase = 'neutral';
    }
    
    // Sentiment intensity: magnitude of emotional bias
    if (emotionalBias === 'fear') {
      this.currentField.sentimentIntensity = pressure;
    } else if (emotionalBias === 'greed') {
      this.currentField.sentimentIntensity = 100 - pressure;
    } else {
      this.currentField.sentimentIntensity = 50;
    }
  }

  /**
   * Record history
   */
  private recordHistory(): void {
    this.fieldHistory.push({
      timestamp: this.currentField.timestamp,
      pressure: this.currentField.pressure,
      momentum: this.currentField.momentum,
      emotionalBias: this.currentField.emotionalBias,
      crowdPhase: this.currentField.crowdPhase,
    });
    
    if (this.fieldHistory.length > this.MAX_HISTORY) {
      this.fieldHistory.shift();
    }
  }

  /**
   * Get current field
   */
  getField(): CollectiveField {
    return JSON.parse(JSON.stringify(this.currentField));
  }

  /**
   * Get current state
   */
  getState(): CollectiveField {
    return { ...this.currentField };
  }

  /**
   * Get field summary
   */
  getFieldSummary(): {
    pressure: string;
    momentum: string;
    bias: string;
    phase: string;
    coherence: number;
  } {
    const { pressure, momentum, emotionalBias, crowdPhase, coherence } = this.currentField;
    
    let pressureDesc = 'low';
    if (pressure > 70) pressureDesc = 'extreme';
    else if (pressure > 50) pressureDesc = 'high';
    else if (pressure > 30) pressureDesc = 'moderate';
    
    let momentumDesc = 'neutral';
    if (momentum > 20) momentumDesc = 'strong bullish';
    else if (momentum > 0) momentumDesc = 'bullish';
    else if (momentum < -20) momentumDesc = 'strong bearish';
    else if (momentum < 0) momentumDesc = 'bearish';
    
    return {
      pressure: pressureDesc,
      momentum: momentumDesc,
      bias: emotionalBias,
      phase: crowdPhase,
      coherence,
    };
  }

  /**
   * Get field history
   */
  getHistory(): FieldHistoryPoint[] {
    return [...this.fieldHistory];
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return (
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    );
  }

  /**
   * Reset engine
   */
  reset(): void {
    this.currentField = this.createDefaultField();
    this.fieldHistory = [];
    this.volatilityBuffer = [];
    this.anomalyBuffer = [];
    this.pacingBuffer = [];
    this.liquidityBuffer = [];
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      field: this.currentField,
      history: this.fieldHistory,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.currentField = data.field;
      this.fieldHistory = data.history;
      return true;
    } catch (error) {
      console.error('Failed to import field state:', error);
      return false;
    }
  }
}
