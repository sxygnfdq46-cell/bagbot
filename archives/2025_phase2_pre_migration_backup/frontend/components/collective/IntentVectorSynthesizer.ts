/**
 * LEVEL 11.4 — INTENT VECTOR SYNTHESIZER (IVS)
 * 
 * Merges BagBot's internal direction + market's collective direction + user interaction direction.
 * Creates intent overlap scores, alignment/divergence patterns, probability-weighted trajectories.
 * 
 * Architecture:
 * - Intent vector extraction (BagBot, market, user)
 * - Vector alignment calculation
 * - Divergence pattern detection
 * - Trajectory probability weighting
 * - Harmonic resonance analysis
 * 
 * This makes BagBot sense the "pulse of the environment" through multi-directional intent.
 */

// ================================
// INTENT TYPES
// ================================

/**
 * Intent vector - directional force with magnitude
 */
export interface IntentVector {
  direction: number; // 0-360 degrees (0=north, 90=east, 180=south, 270=west)
  magnitude: number; // 0-100: strength of intent
  confidence: number; // 0-100: how certain
  velocity: number; // 0-100: speed of change
  stability: number; // 0-100: how consistent over time
}

/**
 * BagBot's internal intent
 */
export interface BagBotIntent {
  vector: IntentVector;
  strategy: 'accumulate' | 'distribute' | 'hold' | 'defensive' | 'aggressive';
  conviction: number; // 0-100
  timeHorizon: 'immediate' | 'short' | 'medium' | 'long';
  riskTolerance: number; // 0-100
}

/**
 * Market's collective intent
 */
export interface MarketIntent {
  vector: IntentVector;
  trend: 'bullish' | 'bearish' | 'sideways' | 'volatile';
  strength: number; // 0-100
  participation: number; // 0-100: how many actors involved
  consolidation: number; // 0-100: how unified
}

/**
 * User interaction intent
 */
export interface UserIntent {
  vector: IntentVector;
  focus: 'exploration' | 'decision' | 'monitoring' | 'learning';
  urgency: number; // 0-100
  engagement: number; // 0-100
  sentiment: 'curious' | 'confident' | 'uncertain' | 'anxious';
}

/**
 * Intent overlap score
 */
export interface IntentOverlap {
  bagbotMarket: number; // 0-100: alignment
  bagbotUser: number; // 0-100: alignment
  marketUser: number; // 0-100: alignment
  threeWayAlignment: number; // 0-100: all three aligned
  dominantIntent: 'bagbot' | 'market' | 'user' | 'balanced';
}

/**
 * Alignment pattern
 */
export interface AlignmentPattern {
  type: 'convergence' | 'divergence' | 'rotation' | 'oscillation' | 'stable';
  intensity: number; // 0-100
  duration: number; // milliseconds
  direction: 'toward-bagbot' | 'toward-market' | 'toward-user' | 'scattered';
}

/**
 * Divergence pattern
 */
export interface DivergencePattern {
  type: 'split' | 'scatter' | 'polarization' | 'decoupling';
  severity: number; // 0-100
  primaryGap: 'bagbot-market' | 'bagbot-user' | 'market-user';
  angularSeparation: number; // 0-180 degrees
  risk: 'low' | 'moderate' | 'high' | 'extreme';
}

/**
 * Probability-weighted trajectory
 */
export interface WeightedTrajectory {
  direction: number; // 0-360 degrees
  probability: number; // 0-100
  timeframe: number; // milliseconds
  confidence: number; // 0-100
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

/**
 * Harmonic resonance
 */
export interface HarmonicResonance {
  frequency: number; // 0-100: oscillation rate
  amplitude: number; // 0-100: strength
  phase: number; // 0-360: phase offset
  coherence: number; // 0-100: how synchronized
  nodes: number; // 1-5: resonance nodes
}

/**
 * Synthesized intent state
 */
export interface SynthesizedIntent {
  timestamp: number;
  
  // Component intents
  bagbotIntent: BagBotIntent;
  marketIntent: MarketIntent;
  userIntent: UserIntent;
  
  // Alignment
  overlap: IntentOverlap;
  alignmentPattern: AlignmentPattern;
  divergencePattern: DivergencePattern | null;
  
  // Trajectories
  trajectories: WeightedTrajectory[];
  mostLikely: WeightedTrajectory;
  
  // Resonance
  resonance: HarmonicResonance;
  
  // Meta
  systemCoherence: number; // 0-100: overall alignment
  intentConflict: number; // 0-100: internal tension
}

// ================================
// INTENT VECTOR SYNTHESIZER
// ================================

export class IntentVectorSynthesizer {
  private synthesizedIntent: SynthesizedIntent;
  private intentHistory: Array<{
    timestamp: number;
    overlap: IntentOverlap;
    coherence: number;
  }> = [];
  
  private readonly MAX_HISTORY = 100;
  
  constructor() {
    this.synthesizedIntent = this.createDefaultIntent();
  }

  /**
   * Create default intent
   */
  private createDefaultIntent(): SynthesizedIntent {
    const defaultVector: IntentVector = {
      direction: 0,
      magnitude: 50,
      confidence: 60,
      velocity: 30,
      stability: 70,
    };
    
    return {
      timestamp: Date.now(),
      
      bagbotIntent: {
        vector: { ...defaultVector, direction: 45 },
        strategy: 'hold',
        conviction: 60,
        timeHorizon: 'medium',
        riskTolerance: 50,
      },
      
      marketIntent: {
        vector: { ...defaultVector, direction: 90 },
        trend: 'sideways',
        strength: 50,
        participation: 60,
        consolidation: 70,
      },
      
      userIntent: {
        vector: { ...defaultVector, direction: 0 },
        focus: 'monitoring',
        urgency: 40,
        engagement: 50,
        sentiment: 'curious',
      },
      
      overlap: {
        bagbotMarket: 70,
        bagbotUser: 60,
        marketUser: 65,
        threeWayAlignment: 65,
        dominantIntent: 'balanced',
      },
      
      alignmentPattern: {
        type: 'stable',
        intensity: 50,
        duration: 0,
        direction: 'scattered',
      },
      
      divergencePattern: null,
      
      trajectories: [],
      mostLikely: {
        direction: 45,
        probability: 60,
        timeframe: 60000,
        confidence: 60,
        scenario: 'realistic',
      },
      
      resonance: {
        frequency: 50,
        amplitude: 40,
        phase: 0,
        coherence: 70,
        nodes: 2,
      },
      
      systemCoherence: 70,
      intentConflict: 20,
    };
  }

  /**
   * Update BagBot intent
   */
  updateBagBotIntent(intent: Partial<BagBotIntent>): void {
    this.synthesizedIntent.bagbotIntent = {
      ...this.synthesizedIntent.bagbotIntent,
      ...intent,
    };
    
    this.recalculateIntent();
  }

  /**
   * Update market intent
   */
  updateMarketIntent(intent: Partial<MarketIntent>): void {
    this.synthesizedIntent.marketIntent = {
      ...this.synthesizedIntent.marketIntent,
      ...intent,
    };
    
    this.recalculateIntent();
  }

  /**
   * Update user intent
   */
  updateUserIntent(intent: Partial<UserIntent>): void {
    this.synthesizedIntent.userIntent = {
      ...this.synthesizedIntent.userIntent,
      ...intent,
    };
    
    this.recalculateIntent();
  }

  /**
   * Recalculate synthesized intent
   */
  private recalculateIntent(): void {
    this.synthesizedIntent.timestamp = Date.now();
    
    // Calculate overlap
    this.calculateOverlap();
    
    // Detect alignment pattern
    this.detectAlignmentPattern();
    
    // Detect divergence pattern
    this.detectDivergencePattern();
    
    // Generate trajectories
    this.generateTrajectories();
    
    // Calculate resonance
    this.calculateResonance();
    
    // Update meta metrics
    this.updateMetaMetrics();
    
    // Record history
    this.recordHistory();
  }

  /**
   * Calculate intent overlap
   */
  private calculateOverlap(): void {
    const { bagbotIntent: bagbot, marketIntent: market, userIntent: user } = this.synthesizedIntent;
    
    // Calculate pairwise alignment (angular difference)
    const bagbotMarket = this.calculateAlignment(
      bagbot.vector,
      market.vector
    );
    const bagbotUser = this.calculateAlignment(
      bagbot.vector,
      user.vector
    );
    const marketUser = this.calculateAlignment(
      market.vector,
      user.vector
    );
    
    // Three-way alignment is the minimum of pairwise
    const threeWayAlignment = Math.min(bagbotMarket, bagbotUser, marketUser);
    
    // Determine dominant intent
    let dominantIntent: IntentOverlap['dominantIntent'] = 'balanced';
    
    const magnitudes = [
      { name: 'bagbot' as const, mag: bagbot.vector.magnitude },
      { name: 'market' as const, mag: market.vector.magnitude },
      { name: 'user' as const, mag: user.vector.magnitude },
    ];
    magnitudes.sort((a, b) => b.mag - a.mag);
    
    if (magnitudes[0].mag > magnitudes[1].mag + 20) {
      dominantIntent = magnitudes[0].name;
    }
    
    this.synthesizedIntent.overlap = {
      bagbotMarket,
      bagbotUser,
      marketUser,
      threeWayAlignment,
      dominantIntent,
    };
  }

  /**
   * Calculate alignment between two vectors
   */
  private calculateAlignment(v1: IntentVector, v2: IntentVector): number {
    // Angular difference (0-180 degrees)
    let angleDiff = Math.abs(v1.direction - v2.direction);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    
    // Convert to alignment score (0-100)
    const angularAlignment = 100 - (angleDiff / 180) * 100;
    
    // Weight by magnitude and confidence
    const magnitudeWeight = (v1.magnitude + v2.magnitude) / 200;
    const confidenceWeight = (v1.confidence + v2.confidence) / 200;
    
    return (
      angularAlignment * 0.6 +
      magnitudeWeight * 100 * 0.2 +
      confidenceWeight * 100 * 0.2
    );
  }

  /**
   * Detect alignment pattern
   */
  private detectAlignmentPattern(): void {
    if (this.intentHistory.length < 5) {
      this.synthesizedIntent.alignmentPattern = {
        type: 'stable',
        intensity: 50,
        duration: 0,
        direction: 'scattered',
      };
      return;
    }
    
    const recent = this.intentHistory.slice(-10);
    const coherences = recent.map(h => h.coherence);
    const overlaps = recent.map(h => h.overlap.threeWayAlignment);
    
    // Detect pattern type
    let type: AlignmentPattern['type'] = 'stable';
    
    // Convergence: increasing alignment
    const alignmentTrend = overlaps[overlaps.length - 1] - overlaps[0];
    if (alignmentTrend > 15) type = 'convergence';
    else if (alignmentTrend < -15) type = 'divergence';
    
    // Rotation: direction changes but alignment stable
    const { bagbotIntent: bagbot, marketIntent: market, userIntent: user } = this.synthesizedIntent;
    const avgDirection = (bagbot.vector.direction + market.vector.direction + user.vector.direction) / 3;
    const directionVariance = this.variance([
      bagbot.vector.direction,
      market.vector.direction,
      user.vector.direction,
    ]);
    
    if (directionVariance > 50 && Math.abs(alignmentTrend) < 10) {
      type = 'rotation';
    }
    
    // Oscillation: rapid changes
    const coherenceVariance = this.variance(coherences);
    if (coherenceVariance > 30) type = 'oscillation';
    
    // Intensity: magnitude of pattern
    const intensity = Math.min(100, Math.abs(alignmentTrend) * 3 + coherenceVariance);
    
    // Duration: how long pattern persists
    const duration = (Date.now() - recent[0].timestamp);
    
    // Direction: toward which intent
    let direction: AlignmentPattern['direction'] = 'scattered';
    if (bagbot.vector.magnitude > market.vector.magnitude + 15 &&
        bagbot.vector.magnitude > user.vector.magnitude + 15) {
      direction = 'toward-bagbot';
    } else if (market.vector.magnitude > bagbot.vector.magnitude + 15 &&
               market.vector.magnitude > user.vector.magnitude + 15) {
      direction = 'toward-market';
    } else if (user.vector.magnitude > bagbot.vector.magnitude + 15 &&
               user.vector.magnitude > market.vector.magnitude + 15) {
      direction = 'toward-user';
    }
    
    this.synthesizedIntent.alignmentPattern = {
      type,
      intensity,
      duration,
      direction,
    };
  }

  /**
   * Detect divergence pattern
   */
  private detectDivergencePattern(): void {
    const { overlap } = this.synthesizedIntent;
    
    // Check if any pair is significantly misaligned
    const threshold = 40;
    
    if (
      overlap.bagbotMarket < threshold ||
      overlap.bagbotUser < threshold ||
      overlap.marketUser < threshold
    ) {
      // Find primary gap
      let primaryGap: DivergencePattern['primaryGap'] = 'bagbot-market';
      let minAlignment = overlap.bagbotMarket;
      
      if (overlap.bagbotUser < minAlignment) {
        primaryGap = 'bagbot-user';
        minAlignment = overlap.bagbotUser;
      }
      if (overlap.marketUser < minAlignment) {
        primaryGap = 'market-user';
        minAlignment = overlap.marketUser;
      }
      
      // Determine type
      let type: DivergencePattern['type'] = 'split';
      if (overlap.threeWayAlignment < 30) type = 'scatter';
      if (minAlignment < 20) type = 'polarization';
      if (overlap.bagbotMarket < 25 && overlap.marketUser > 60) type = 'decoupling';
      
      // Severity
      const severity = 100 - minAlignment;
      
      // Angular separation
      const { bagbotIntent: bagbot, marketIntent: market, userIntent: user } = this.synthesizedIntent;
      let angularSeparation = 0;
      if (primaryGap === 'bagbot-market') {
        angularSeparation = this.angularDistance(bagbot.vector.direction, market.vector.direction);
      } else if (primaryGap === 'bagbot-user') {
        angularSeparation = this.angularDistance(bagbot.vector.direction, user.vector.direction);
      } else {
        angularSeparation = this.angularDistance(market.vector.direction, user.vector.direction);
      }
      
      // Risk assessment
      let risk: DivergencePattern['risk'] = 'low';
      if (severity > 70) risk = 'extreme';
      else if (severity > 50) risk = 'high';
      else if (severity > 30) risk = 'moderate';
      
      this.synthesizedIntent.divergencePattern = {
        type,
        severity,
        primaryGap,
        angularSeparation,
        risk,
      };
    } else {
      this.synthesizedIntent.divergencePattern = null;
    }
  }

  /**
   * Calculate angular distance
   */
  private angularDistance(angle1: number, angle2: number): number {
    let diff = Math.abs(angle1 - angle2);
    if (diff > 180) diff = 360 - diff;
    return diff;
  }

  /**
   * Generate probability-weighted trajectories
   */
  private generateTrajectories(): void {
    const { bagbotIntent: bagbot, marketIntent: market, userIntent: user, overlap } = this.synthesizedIntent;
    
    const trajectories: WeightedTrajectory[] = [];
    
    // Optimistic: BagBot + Market aligned high
    if (overlap.bagbotMarket > 60) {
      const avgDirection = (bagbot.vector.direction + market.vector.direction) / 2;
      const avgMagnitude = (bagbot.vector.magnitude + market.vector.magnitude) / 2;
      
      trajectories.push({
        direction: avgDirection,
        probability: overlap.bagbotMarket,
        timeframe: 30000,
        confidence: (bagbot.vector.confidence + market.vector.confidence) / 2,
        scenario: 'optimistic',
      });
    }
    
    // Realistic: weighted average of all three
    const totalMagnitude = bagbot.vector.magnitude + market.vector.magnitude + user.vector.magnitude;
    const weightedDirection =
      (bagbot.vector.direction * bagbot.vector.magnitude +
       market.vector.direction * market.vector.magnitude +
       user.vector.direction * user.vector.magnitude) /
      totalMagnitude;
    
    trajectories.push({
      direction: weightedDirection,
      probability: overlap.threeWayAlignment,
      timeframe: 60000,
      confidence: (bagbot.vector.confidence + market.vector.confidence + user.vector.confidence) / 3,
      scenario: 'realistic',
    });
    
    // Pessimistic: dominant intent only
    const dominant = overlap.dominantIntent;
    let dominantVector: IntentVector;
    if (dominant === 'bagbot') dominantVector = bagbot.vector;
    else if (dominant === 'market') dominantVector = market.vector;
    else if (dominant === 'user') dominantVector = user.vector;
    else dominantVector = bagbot.vector;
    
    trajectories.push({
      direction: dominantVector.direction,
      probability: 100 - overlap.threeWayAlignment,
      timeframe: 90000,
      confidence: dominantVector.confidence * 0.7,
      scenario: 'pessimistic',
    });
    
    this.synthesizedIntent.trajectories = trajectories;
    
    // Most likely is highest probability
    this.synthesizedIntent.mostLikely = trajectories.reduce((prev, curr) =>
      curr.probability > prev.probability ? curr : prev
    );
  }

  /**
   * Calculate harmonic resonance
   */
  private calculateResonance(): void {
    const { bagbotIntent: bagbot, marketIntent: market, userIntent: user } = this.synthesizedIntent;
    
    // Frequency: rate of velocity changes
    const avgVelocity = (bagbot.vector.velocity + market.vector.velocity + user.vector.velocity) / 3;
    
    // Amplitude: magnitude variance
    const magnitudes = [bagbot.vector.magnitude, market.vector.magnitude, user.vector.magnitude];
    const magnitudeVariance = this.variance(magnitudes);
    const amplitude = Math.min(100, magnitudeVariance * 2);
    
    // Phase: angular offset from alignment
    const directions = [bagbot.vector.direction, market.vector.direction, user.vector.direction];
    const avgDirection = directions.reduce((sum, d) => sum + d, 0) / 3;
    const phase = Math.abs(bagbot.vector.direction - avgDirection);
    
    // Coherence: stability alignment
    const stabilities = [bagbot.vector.stability, market.vector.stability, user.vector.stability];
    const avgStability = stabilities.reduce((sum, s) => sum + s, 0) / 3;
    const coherence = avgStability;
    
    // Nodes: count of high-alignment pairs
    let nodes = 0;
    if (this.synthesizedIntent.overlap.bagbotMarket > 70) nodes++;
    if (this.synthesizedIntent.overlap.bagbotUser > 70) nodes++;
    if (this.synthesizedIntent.overlap.marketUser > 70) nodes++;
    nodes = Math.max(1, nodes);
    
    this.synthesizedIntent.resonance = {
      frequency: avgVelocity,
      amplitude,
      phase,
      coherence,
      nodes,
    };
  }

  /**
   * Update meta metrics
   */
  private updateMetaMetrics(): void {
    const { overlap, resonance } = this.synthesizedIntent;
    
    // System coherence: overall alignment
    this.synthesizedIntent.systemCoherence = overlap.threeWayAlignment;
    
    // Intent conflict: misalignment + low resonance coherence
    const avgMisalignment = (
      (100 - overlap.bagbotMarket) +
      (100 - overlap.bagbotUser) +
      (100 - overlap.marketUser)
    ) / 3;
    
    this.synthesizedIntent.intentConflict = (avgMisalignment + (100 - resonance.coherence)) / 2;
  }

  /**
   * Record history
   */
  private recordHistory(): void {
    this.intentHistory.push({
      timestamp: this.synthesizedIntent.timestamp,
      overlap: this.synthesizedIntent.overlap,
      coherence: this.synthesizedIntent.systemCoherence,
    });
    
    if (this.intentHistory.length > this.MAX_HISTORY) {
      this.intentHistory.shift();
    }
  }

  /**
   * Get current state
   */
  getState(): SynthesizedIntent {
    return JSON.parse(JSON.stringify(this.synthesizedIntent));
  }

  /**
   * Get synthesized intent
   */
  getIntent(): SynthesizedIntent {
    return JSON.parse(JSON.stringify(this.synthesizedIntent));
  }

  /**
   * Get intent summary
   */
  getIntentSummary(): {
    alignment: string;
    trajectory: string;
    conflict: string;
    resonance: string;
  } {
    const { overlap, mostLikely, intentConflict, resonance } = this.synthesizedIntent;
    
    let alignment = 'scattered';
    if (overlap.threeWayAlignment > 80) alignment = 'highly aligned';
    else if (overlap.threeWayAlignment > 60) alignment = 'aligned';
    else if (overlap.threeWayAlignment > 40) alignment = 'partially aligned';
    
    const trajectoryDir = mostLikely.direction;
    let trajectory = 'neutral';
    if (trajectoryDir >= 315 || trajectoryDir < 45) trajectory = 'north (bullish)';
    else if (trajectoryDir >= 45 && trajectoryDir < 135) trajectory = 'east (momentum)';
    else if (trajectoryDir >= 135 && trajectoryDir < 225) trajectory = 'south (bearish)';
    else trajectory = 'west (defensive)';
    
    let conflict = 'low';
    if (intentConflict > 70) conflict = 'extreme';
    else if (intentConflict > 50) conflict = 'high';
    else if (intentConflict > 30) conflict = 'moderate';
    
    let resonanceDesc = 'stable';
    if (resonance.frequency > 70) resonanceDesc = 'high-frequency';
    else if (resonance.amplitude > 70) resonanceDesc = 'high-amplitude';
    else if (resonance.coherence > 80) resonanceDesc = 'coherent';
    
    return {
      alignment,
      trajectory,
      conflict,
      resonance: resonanceDesc,
    };
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  }

  /**
   * Reset synthesizer
   */
  reset(): void {
    this.synthesizedIntent = this.createDefaultIntent();
    this.intentHistory = [];
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      intent: this.synthesizedIntent,
      history: this.intentHistory,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.synthesizedIntent = data.intent;
      this.intentHistory = data.history;
      return true;
    } catch (error) {
      console.error('Failed to import intent state:', error);
      return false;
    }
  }
}
