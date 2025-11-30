/**
 * ═══════════════════════════════════════════════════════════════════
 * CORRELATION MATRIX ENGINE — Phase 5.2
 * ═══════════════════════════════════════════════════════════════════
 * Advanced 6-dimensional cross-shield correlation analysis
 * 
 * Features:
 * - Pearson correlation coefficients (-1.0 to +1.0)
 * - Weighted cascade detection (weak/moderate/severe/critical)
 * - Noise filtering with Z-score smoothing
 * - Causal direction prediction via time-lag analysis
 * - AI-readable insight generation
 * - Real-time correlation graph updates
 * 
 * Correlations Tracked:
 * - Stability ↔ Emotional
 * - Stability ↔ Execution
 * - Stability ↔ Memory
 * - Emotional ↔ Execution
 * - Emotional ↔ Memory
 * - Execution ↔ Memory
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ShieldType } from './ShieldBrainCore';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

/**
 * Correlation pair
 */
export interface CorrelationPair {
  source: ShieldType;
  target: ShieldType;
  pearsonCoefficient: number; // -1.0 to +1.0
  strength: CorrelationStrength;
  direction: CorrelationDirection;
  impact: CorrelationImpact;
  causalDirection: CausalDirection;
  confidence: number; // 0-1.0
  lastUpdated: number;
}

/**
 * Dynamic correlation graph state
 */
export interface CorrelationGraph {
  pairs: CorrelationPair[];
  strongLinks: CorrelationPair[]; // |r| > 0.7
  weakLinks: CorrelationPair[]; // |r| < 0.3
  negativeLinks: CorrelationPair[]; // r < 0
  cascadesDetected: number;
  timestamp: number;
}

/**
 * Cascade detection result
 */
export interface CascadeDetection {
  level: CascadeLevel;
  affectedPairs: CorrelationPair[];
  riskScore: number; // 0-1.0
  description: string;
  propagationPath: ShieldType[];
  estimatedImpact: ImpactEstimate;
}

/**
 * Time-series data point for correlation
 */
export interface CorrelationDataPoint {
  timestamp: number;
  sourceValue: number;
  targetValue: number;
}

/**
 * Correlation strength
 */
export type CorrelationStrength = 'very-weak' | 'weak' | 'moderate' | 'strong' | 'very-strong';

/**
 * Correlation direction
 */
export type CorrelationDirection = 'positive' | 'negative' | 'neutral';

/**
 * Correlation impact
 */
export type CorrelationImpact = 'stabilizing' | 'destabilizing' | 'neutral';

/**
 * Causal direction
 */
export type CausalDirection = 'source-to-target' | 'target-to-source' | 'bidirectional' | 'unclear';

/**
 * Cascade level
 */
export type CascadeLevel = 'none' | 'weak' | 'moderate' | 'severe' | 'critical';

/**
 * Impact estimate
 */
export interface ImpactEstimate {
  severity: number; // 0-5
  affectedShields: ShieldType[];
  timeToPropagate: number; // seconds
  probability: number; // 0-1.0
}

/**
 * Correlation matrix configuration
 */
export interface CorrelationMatrixConfig {
  windowSize: number; // Number of data points to analyze
  updateInterval: number; // Milliseconds between updates
  noiseThreshold: number; // Z-score threshold for outliers
  cascadeThreshold: number; // Correlation threshold for cascade
  minConfidence: number; // Minimum confidence to report
  timeLagSteps: number; // Number of time steps for causal analysis
}

// ─────────────────────────────────────────────────────────────────
// CORRELATION MATRIX ENGINE
// ─────────────────────────────────────────────────────────────────

export class CorrelationMatrixEngine {
  private config: CorrelationMatrixConfig;
  private active: boolean = false;

  // Time-series data storage (rolling window)
  private stabilityData: number[] = [];
  private emotionalData: number[] = [];
  private executionData: number[] = [];
  private memoryData: number[] = [];
  private timestamps: number[] = [];

  // Current correlation state
  private currentGraph: CorrelationGraph;
  private cascadeDetection: CascadeDetection | null = null;

  // Event callbacks
  private correlationSpikeCallbacks: Array<(pair: CorrelationPair) => void> = [];
  private cascadeDetectedCallbacks: Array<(cascade: CascadeDetection) => void> = [];
  private negativeLinkCallbacks: Array<(pair: CorrelationPair) => void> = [];
  private strongLinkCallbacks: Array<(pair: CorrelationPair) => void> = [];

  constructor(config?: Partial<CorrelationMatrixConfig>) {
    this.config = {
      windowSize: 20, // Rolling 20-cycle window
      updateInterval: 5000,
      noiseThreshold: 2.0, // 2 standard deviations
      cascadeThreshold: 0.6,
      minConfidence: 0.5,
      timeLagSteps: 3,
      ...config
    };

    this.currentGraph = this.createEmptyGraph();
  }

  /**
   * Add new data point
   */
  addDataPoint(
    stabilityValue: number,
    emotionalValue: number,
    executionValue: number,
    memoryValue: number
  ): void {
    const timestamp = Date.now();

    // Apply noise filtering
    const filteredStability = this.applyNoiseFilter(stabilityValue, this.stabilityData);
    const filteredEmotional = this.applyNoiseFilter(emotionalValue, this.emotionalData);
    const filteredExecution = this.applyNoiseFilter(executionValue, this.executionData);
    const filteredMemory = this.applyNoiseFilter(memoryValue, this.memoryData);

    // Add to rolling window
    this.stabilityData.push(filteredStability);
    this.emotionalData.push(filteredEmotional);
    this.executionData.push(filteredExecution);
    this.memoryData.push(filteredMemory);
    this.timestamps.push(timestamp);

    // Trim to window size
    if (this.stabilityData.length > this.config.windowSize) {
      this.stabilityData.shift();
      this.emotionalData.shift();
      this.executionData.shift();
      this.memoryData.shift();
      this.timestamps.shift();
    }

    // Recalculate correlations if we have enough data
    if (this.stabilityData.length >= 5) {
      this.updateCorrelations();
    }
  }

  /**
   * Apply noise filtering with Z-score outlier detection
   */
  private applyNoiseFilter(newValue: number, dataset: number[]): number {
    if (dataset.length < 3) return newValue; // Need minimum data

    const mean = this.calculateMean(dataset);
    const stdDev = this.calculateStdDev(dataset, mean);

    if (stdDev === 0) return newValue; // No variation

    const zScore = Math.abs((newValue - mean) / stdDev);

    // If outlier, clip to threshold
    if (zScore > this.config.noiseThreshold) {
      const sign = newValue > mean ? 1 : -1;
      return mean + sign * this.config.noiseThreshold * stdDev;
    }

    return newValue;
  }

  /**
   * Update all correlations
   */
  private updateCorrelations(): void {
    const pairs: CorrelationPair[] = [];

    // 1. Stability ↔ Emotional
    pairs.push(this.calculateCorrelation('stability', 'emotional', this.stabilityData, this.emotionalData));

    // 2. Stability ↔ Execution
    pairs.push(this.calculateCorrelation('stability', 'execution', this.stabilityData, this.executionData));

    // 3. Stability ↔ Memory
    pairs.push(this.calculateCorrelation('stability', 'memory', this.stabilityData, this.memoryData));

    // 4. Emotional ↔ Execution
    pairs.push(this.calculateCorrelation('emotional', 'execution', this.emotionalData, this.executionData));

    // 5. Emotional ↔ Memory
    pairs.push(this.calculateCorrelation('emotional', 'memory', this.emotionalData, this.memoryData));

    // 6. Execution ↔ Memory
    pairs.push(this.calculateCorrelation('execution', 'memory', this.executionData, this.memoryData));

    // Update graph
    this.currentGraph = {
      pairs,
      strongLinks: pairs.filter(p => Math.abs(p.pearsonCoefficient) > 0.7),
      weakLinks: pairs.filter(p => Math.abs(p.pearsonCoefficient) < 0.3),
      negativeLinks: pairs.filter(p => p.pearsonCoefficient < 0),
      cascadesDetected: 0,
      timestamp: Date.now()
    };

    // Detect cascades
    this.detectCascades();

    // Trigger callbacks
    this.triggerCallbacks();
  }

  /**
   * Calculate Pearson correlation coefficient between two shields
   */
  private calculateCorrelation(
    source: ShieldType,
    target: ShieldType,
    sourceData: number[],
    targetData: number[]
  ): CorrelationPair {
    // Calculate Pearson coefficient
    const pearsonCoefficient = this.calculatePearson(sourceData, targetData);

    // Determine strength
    const strength = this.determineStrength(pearsonCoefficient);

    // Determine direction
    const direction: CorrelationDirection = 
      pearsonCoefficient > 0.1 ? 'positive' : 
      pearsonCoefficient < -0.1 ? 'negative' : 
      'neutral';

    // Determine impact
    const impact = this.determineImpact(pearsonCoefficient, sourceData, targetData);

    // Determine causal direction
    const causalDirection = this.determineCausalDirection(sourceData, targetData);

    // Calculate confidence
    const confidence = this.calculateConfidence(sourceData.length, Math.abs(pearsonCoefficient));

    return {
      source,
      target,
      pearsonCoefficient,
      strength,
      direction,
      impact,
      causalDirection,
      confidence,
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculatePearson(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const meanX = this.calculateMean(x);
    const meanY = this.calculateMean(y);

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumXSquared += dx * dx;
      sumYSquared += dy * dy;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    
    if (denominator === 0) return 0;

    return numerator / denominator;
  }

  /**
   * Determine correlation strength
   */
  private determineStrength(coefficient: number): CorrelationStrength {
    const abs = Math.abs(coefficient);
    
    if (abs >= 0.9) return 'very-strong';
    if (abs >= 0.7) return 'strong';
    if (abs >= 0.4) return 'moderate';
    if (abs >= 0.2) return 'weak';
    return 'very-weak';
  }

  /**
   * Determine correlation impact
   */
  private determineImpact(
    coefficient: number,
    sourceData: number[],
    targetData: number[]
  ): CorrelationImpact {
    // Check if both are trending in healthy direction
    const sourceTrend = this.calculateTrend(sourceData);
    const targetTrend = this.calculateTrend(targetData);

    // Positive correlation + both improving = stabilizing
    if (coefficient > 0.5 && sourceTrend > 0 && targetTrend > 0) {
      return 'stabilizing';
    }

    // Negative correlation + one degrading = destabilizing
    if (coefficient < -0.5 && (sourceTrend < 0 || targetTrend < 0)) {
      return 'destabilizing';
    }

    // Strong correlation + one degrading = destabilizing
    if (Math.abs(coefficient) > 0.7 && (sourceTrend < 0 || targetTrend < 0)) {
      return 'destabilizing';
    }

    return 'neutral';
  }

  /**
   * Determine causal direction using time-lag correlation
   */
  private determineCausalDirection(
    sourceData: number[],
    targetData: number[]
  ): CausalDirection {
    if (sourceData.length < this.config.timeLagSteps + 2) {
      return 'unclear';
    }

    // Calculate correlation with source leading
    const sourceLeading = this.calculateTimeLagCorrelation(
      sourceData,
      targetData,
      this.config.timeLagSteps
    );

    // Calculate correlation with target leading
    const targetLeading = this.calculateTimeLagCorrelation(
      targetData,
      sourceData,
      this.config.timeLagSteps
    );

    const diff = Math.abs(sourceLeading - targetLeading);

    if (diff < 0.1) return 'bidirectional';
    if (sourceLeading > targetLeading) return 'source-to-target';
    if (targetLeading > sourceLeading) return 'target-to-source';

    return 'unclear';
  }

  /**
   * Calculate time-lagged correlation
   */
  private calculateTimeLagCorrelation(
    leading: number[],
    lagging: number[],
    lag: number
  ): number {
    if (leading.length < lag + 1) return 0;

    const leadingSlice = leading.slice(0, -lag);
    const laggingSlice = lagging.slice(lag);

    return Math.abs(this.calculatePearson(leadingSlice, laggingSlice));
  }

  /**
   * Calculate confidence based on sample size and coefficient
   */
  private calculateConfidence(sampleSize: number, coefficient: number): number {
    // Larger sample + stronger correlation = higher confidence
    const sampleFactor = Math.min(sampleSize / this.config.windowSize, 1.0);
    const coefficientFactor = Math.abs(coefficient);

    return (sampleFactor * 0.5 + coefficientFactor * 0.5);
  }

  /**
   * Detect cascade patterns
   */
  private detectCascades(): void {
    const strongDestabilizing = this.currentGraph.pairs.filter(
      p => p.impact === 'destabilizing' && Math.abs(p.pearsonCoefficient) > this.config.cascadeThreshold
    );

    if (strongDestabilizing.length === 0) {
      this.cascadeDetection = null;
      return;
    }

    // Calculate cascade level
    const level = this.determineCascadeLevel(strongDestabilizing.length, strongDestabilizing);

    // Calculate risk score
    const riskScore = this.calculateCascadeRisk(strongDestabilizing);

    // Determine propagation path
    const propagationPath = this.tracePropagationPath(strongDestabilizing);

    // Estimate impact
    const estimatedImpact = this.estimateCascadeImpact(strongDestabilizing, propagationPath);

    // Generate description
    const description = this.generateCascadeDescription(level, strongDestabilizing, propagationPath);

    this.cascadeDetection = {
      level,
      affectedPairs: strongDestabilizing,
      riskScore,
      description,
      propagationPath,
      estimatedImpact
    };

    this.currentGraph.cascadesDetected = strongDestabilizing.length;
  }

  /**
   * Determine cascade level
   */
  private determineCascadeLevel(
    count: number,
    pairs: CorrelationPair[]
  ): CascadeLevel {
    const avgCoefficient = pairs.reduce((sum, p) => sum + Math.abs(p.pearsonCoefficient), 0) / pairs.length;

    if (count >= 4 && avgCoefficient > 0.8) return 'critical';
    if (count >= 3 && avgCoefficient > 0.7) return 'severe';
    if (count >= 2 && avgCoefficient > 0.6) return 'moderate';
    if (count >= 1) return 'weak';

    return 'none';
  }

  /**
   * Calculate cascade risk score
   */
  private calculateCascadeRisk(pairs: CorrelationPair[]): number {
    if (pairs.length === 0) return 0;

    // Weight by coefficient strength and confidence
    const totalRisk = pairs.reduce((sum, pair) => {
      const coefficientWeight = Math.abs(pair.pearsonCoefficient);
      const confidenceWeight = pair.confidence;
      return sum + (coefficientWeight * confidenceWeight);
    }, 0);

    return Math.min(totalRisk / pairs.length, 1.0);
  }

  /**
   * Trace propagation path through shields
   */
  private tracePropagationPath(pairs: CorrelationPair[]): ShieldType[] {
    const path: ShieldType[] = [];
    const visited = new Set<ShieldType>();

    // Start with the pair with strongest correlation
    const sorted = [...pairs].sort((a, b) => 
      Math.abs(b.pearsonCoefficient) - Math.abs(a.pearsonCoefficient)
    );

    if (sorted.length > 0) {
      const start = sorted[0];
      path.push(start.source);
      visited.add(start.source);
      path.push(start.target);
      visited.add(start.target);

      // Add connected shields
      for (const pair of sorted.slice(1)) {
        if (visited.has(pair.source) && !visited.has(pair.target)) {
          path.push(pair.target);
          visited.add(pair.target);
        } else if (visited.has(pair.target) && !visited.has(pair.source)) {
          path.push(pair.source);
          visited.add(pair.source);
        }
      }
    }

    return path;
  }

  /**
   * Estimate cascade impact
   */
  private estimateCascadeImpact(
    pairs: CorrelationPair[],
    path: ShieldType[]
  ): ImpactEstimate {
    const avgSeverity = pairs.reduce((sum, p) => 
      sum + Math.abs(p.pearsonCoefficient) * 5, 0
    ) / pairs.length;

    const timeToPropagate = path.length * 5; // 5 seconds per hop

    const probability = this.calculateCascadeRisk(pairs);

    return {
      severity: Math.min(Math.round(avgSeverity), 5),
      affectedShields: path,
      timeToPropagate,
      probability
    };
  }

  /**
   * Generate cascade description
   */
  private generateCascadeDescription(
    level: CascadeLevel,
    pairs: CorrelationPair[],
    path: ShieldType[]
  ): string {
    const pathStr = path.join(' → ');
    const count = pairs.length;

    switch (level) {
      case 'critical':
        return `CRITICAL multishield failure risk detected: ${count} destabilizing correlations. Propagation path: ${pathStr}`;
      case 'severe':
        return `Severe cascade detected: ${count} strong destabilizing links. Path: ${pathStr}`;
      case 'moderate':
        return `Moderate cascade detected: ${count} destabilizing correlations across shields`;
      case 'weak':
        return `Weak cascade detected: ${count} destabilizing link(s)`;
      default:
        return 'No cascade detected';
    }
  }

  /**
   * Trigger event callbacks
   */
  private triggerCallbacks(): void {
    // Correlation spikes (sudden changes)
    const spikes = this.detectCorrelationSpikes();
    spikes.forEach(pair => {
      this.correlationSpikeCallbacks.forEach(cb => {
        try { cb(pair); } catch (e) { console.error('[CorrelationMatrix] Callback error:', e); }
      });
    });

    // Cascade detected
    if (this.cascadeDetection && this.cascadeDetection.level !== 'none') {
      this.cascadeDetectedCallbacks.forEach(cb => {
        try { cb(this.cascadeDetection!); } catch (e) { console.error('[CorrelationMatrix] Callback error:', e); }
      });
    }

    // Negative links
    this.currentGraph.negativeLinks.forEach(pair => {
      if (Math.abs(pair.pearsonCoefficient) > 0.5) {
        this.negativeLinkCallbacks.forEach(cb => {
          try { cb(pair); } catch (e) { console.error('[CorrelationMatrix] Callback error:', e); }
        });
      }
    });

    // Strong links
    this.currentGraph.strongLinks.forEach(pair => {
      this.strongLinkCallbacks.forEach(cb => {
        try { cb(pair); } catch (e) { console.error('[CorrelationMatrix] Callback error:', e); }
      });
    });
  }

  /**
   * Detect sudden correlation spikes
   */
  private detectCorrelationSpikes(): CorrelationPair[] {
    // Compare with previous values (simplified - in production, track history)
    return this.currentGraph.pairs.filter(pair => 
      Math.abs(pair.pearsonCoefficient) > 0.8 && pair.confidence > 0.7
    );
  }

  /**
   * Calculate mean
   */
  private calculateMean(data: number[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(data: number[], mean: number): number {
    if (data.length === 0) return 0;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate trend (simple linear regression slope)
   */
  private calculateTrend(data: number[]): number {
    const n = data.length;
    if (n < 2) return 0;

    const indices = Array.from({ length: n }, (_, i) => i);
    const meanX = this.calculateMean(indices);
    const meanY = this.calculateMean(data);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (data[i] - meanY);
      denominator += Math.pow(indices[i] - meanX, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Create empty graph
   */
  private createEmptyGraph(): CorrelationGraph {
    return {
      pairs: [],
      strongLinks: [],
      weakLinks: [],
      negativeLinks: [],
      cascadesDetected: 0,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get current correlation graph
   */
  getGraph(): CorrelationGraph {
    return { ...this.currentGraph };
  }

  /**
   * Get cascade detection result
   */
  getCascadeDetection(): CascadeDetection | null {
    return this.cascadeDetection ? { ...this.cascadeDetection } : null;
  }

  /**
   * Get specific correlation pair
   */
  getCorrelation(source: ShieldType, target: ShieldType): CorrelationPair | null {
    return this.currentGraph.pairs.find(p => 
      (p.source === source && p.target === target) ||
      (p.source === target && p.target === source)
    ) || null;
  }

  /**
   * Generate AI-readable insights
   */
  generateInsights(): string[] {
    const insights: string[] = [];

    // Strong correlations
    this.currentGraph.strongLinks.forEach(pair => {
      const direction = pair.causalDirection === 'source-to-target' ? '→' :
                       pair.causalDirection === 'target-to-source' ? '←' : '↔';
      insights.push(
        `${pair.source} ${direction} ${pair.target} (${(pair.pearsonCoefficient * 100).toFixed(0)}% correlation, ${(pair.confidence * 100).toFixed(0)}% confidence)`
      );
    });

    // Negative relationships
    this.currentGraph.negativeLinks.forEach(pair => {
      if (Math.abs(pair.pearsonCoefficient) > 0.5) {
        insights.push(
          `Strong negative relationship between ${pair.source} & ${pair.target} shields`
        );
      }
    });

    // Cascade warnings
    if (this.cascadeDetection && this.cascadeDetection.level !== 'none') {
      insights.push(this.cascadeDetection.description);
    }

    return insights;
  }

  /**
   * Subscribe to correlation spikes
   */
  onCorrelationSpike(callback: (pair: CorrelationPair) => void): () => void {
    this.correlationSpikeCallbacks.push(callback);
    return () => {
      const index = this.correlationSpikeCallbacks.indexOf(callback);
      if (index > -1) this.correlationSpikeCallbacks.splice(index, 1);
    };
  }

  /**
   * Subscribe to cascade detection
   */
  onCascadeDetected(callback: (cascade: CascadeDetection) => void): () => void {
    this.cascadeDetectedCallbacks.push(callback);
    return () => {
      const index = this.cascadeDetectedCallbacks.indexOf(callback);
      if (index > -1) this.cascadeDetectedCallbacks.splice(index, 1);
    };
  }

  /**
   * Subscribe to negative links
   */
  onNegativeLinkDetected(callback: (pair: CorrelationPair) => void): () => void {
    this.negativeLinkCallbacks.push(callback);
    return () => {
      const index = this.negativeLinkCallbacks.indexOf(callback);
      if (index > -1) this.negativeLinkCallbacks.splice(index, 1);
    };
  }

  /**
   * Subscribe to strong links
   */
  onStrongLinkDetected(callback: (pair: CorrelationPair) => void): () => void {
    this.strongLinkCallbacks.push(callback);
    return () => {
      const index = this.strongLinkCallbacks.indexOf(callback);
      if (index > -1) this.strongLinkCallbacks.splice(index, 1);
    };
  }

  /**
   * Reset all data
   */
  reset(): void {
    this.stabilityData = [];
    this.emotionalData = [];
    this.executionData = [];
    this.memoryData = [];
    this.timestamps = [];
    this.currentGraph = this.createEmptyGraph();
    this.cascadeDetection = null;
  }

  /**
   * Get current data summary
   */
  getDataSummary(): {
    dataPoints: number;
    timespan: number;
    correlationCount: number;
    strongLinks: number;
    weakLinks: number;
    negativeLinks: number;
  } {
    const timespan = this.timestamps.length > 0 
      ? this.timestamps[this.timestamps.length - 1] - this.timestamps[0]
      : 0;

    return {
      dataPoints: this.stabilityData.length,
      timespan,
      correlationCount: this.currentGraph.pairs.length,
      strongLinks: this.currentGraph.strongLinks.length,
      weakLinks: this.currentGraph.weakLinks.length,
      negativeLinks: this.currentGraph.negativeLinks.length
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let correlationMatrixInstance: CorrelationMatrixEngine | null = null;

/**
 * Get correlation matrix instance
 */
export function getCorrelationMatrix(): CorrelationMatrixEngine {
  if (!correlationMatrixInstance) {
    correlationMatrixInstance = new CorrelationMatrixEngine();
  }
  return correlationMatrixInstance;
}

/**
 * Initialize correlation matrix with custom config
 */
export function initializeCorrelationMatrix(config?: Partial<CorrelationMatrixConfig>): CorrelationMatrixEngine {
  correlationMatrixInstance = new CorrelationMatrixEngine(config);
  return correlationMatrixInstance;
}

/**
 * Dispose correlation matrix
 */
export function disposeCorrelationMatrix(): void {
  if (correlationMatrixInstance) {
    correlationMatrixInstance.reset();
    correlationMatrixInstance = null;
  }
}
