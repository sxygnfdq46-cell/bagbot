/**
 * LEVEL 11.3 — EMOTIONAL TRAJECTORY ENGINE (ETE)
 * 
 * Tracks emotional movement over time - the "arc" of feeling through a session.
 * Creates continuity and coherence by understanding WHERE emotions are going.
 * 
 * Architecture:
 * - 7 trajectory patterns: rise, fall, resolve, focus, calm, flare, harmonic
 * - Momentum tracking (emotional velocity and acceleration)
 * - Peak/valley detection
 * - Transition smoothness analysis
 * - Predictive trajectory modeling
 * 
 * This makes BagBot understand emotional FLOW, not just states.
 */

// ================================
// TRAJECTORY TYPES
// ================================

/**
 * Trajectory pattern types
 */
export type TrajectoryPattern = 
  | 'rise'       // Emotions building up
  | 'fall'       // Emotions calming down
  | 'resolve'    // Coming to clarity/resolution
  | 'focus'      // Narrowing to single emotion
  | 'calm'       // Settling into peace
  | 'flare'      // Sudden emotional spike
  | 'harmonic';  // Oscillating between states

/**
 * Emotional point in time
 */
export interface EmotionalPoint {
  timestamp: number;
  emotions: {
    calm: number;
    excited: number;
    focused: number;
    supportive: number;
    intense: number;
    analytical: number;
    playful: number;
  };
  dominantEmotion: keyof EmotionalPoint['emotions'];
  intensity: number; // 0-100
}

/**
 * Emotional momentum
 */
export interface EmotionalMomentum {
  velocity: number; // -100 to 100: falling fast -> rising fast
  acceleration: number; // -100 to 100: decelerating -> accelerating
  direction: 'rising' | 'falling' | 'stable' | 'oscillating';
  magnitude: number; // 0-100: how strong the momentum
}

/**
 * Peak or valley in emotional trajectory
 */
export interface EmotionalExtreme {
  timestamp: number;
  type: 'peak' | 'valley';
  emotion: string;
  intensity: number;
  leadingPattern: TrajectoryPattern;
  trailingPattern: TrajectoryPattern;
}

/**
 * Trajectory segment
 */
export interface TrajectorySegment {
  startTime: number;
  endTime: number;
  pattern: TrajectoryPattern;
  startPoint: EmotionalPoint;
  endPoint: EmotionalPoint;
  smoothness: number; // 0-100: chaotic -> smooth
  coherence: number; // 0-100: scattered -> unified
}

/**
 * Complete emotional trajectory
 */
export interface EmotionalTrajectory {
  sessionStart: number;
  currentTime: number;
  duration: number;
  
  points: EmotionalPoint[];
  segments: TrajectorySegment[];
  extremes: EmotionalExtreme[];
  
  currentPattern: TrajectoryPattern;
  currentMomentum: EmotionalMomentum;
  
  overallArc: 'ascending' | 'descending' | 'stable' | 'cyclical';
  coherence: number; // 0-100: how unified the emotional journey is
  smoothness: number; // 0-100: how smooth transitions are
}

// ================================
// EMOTIONAL TRAJECTORY ENGINE
// ================================

export class EmotionalTrajectoryEngine {
  private trajectory: EmotionalTrajectory;
  private readonly MAX_POINTS = 100;
  private readonly SEGMENT_MIN_DURATION = 30000; // 30 seconds
  
  constructor() {
    this.trajectory = this.createInitialTrajectory();
  }

  /**
   * Create initial trajectory
   */
  private createInitialTrajectory(): EmotionalTrajectory {
    const now = Date.now();
    
    return {
      sessionStart: now,
      currentTime: now,
      duration: 0,
      points: [],
      segments: [],
      extremes: [],
      currentPattern: 'calm',
      currentMomentum: {
        velocity: 0,
        acceleration: 0,
        direction: 'stable',
        magnitude: 0,
      },
      overallArc: 'stable',
      coherence: 100,
      smoothness: 100,
    };
  }

  /**
   * Record emotional point
   */
  recordPoint(emotions: EmotionalPoint['emotions']): void {
    const now = Date.now();
    
    // Find dominant emotion
    const entries = Object.entries(emotions) as Array<[keyof typeof emotions, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    const dominantEmotion = entries[0][0];
    
    // Calculate intensity
    const intensity = entries[0][1];
    
    const point: EmotionalPoint = {
      timestamp: now,
      emotions,
      dominantEmotion,
      intensity,
    };
    
    this.trajectory.points.push(point);
    
    if (this.trajectory.points.length > this.MAX_POINTS) {
      this.trajectory.points.shift();
    }
    
    this.trajectory.currentTime = now;
    this.trajectory.duration = now - this.trajectory.sessionStart;
    
    // Update analysis
    this.updateMomentum();
    this.detectExtremes();
    this.updatePattern();
    this.updateSegments();
    this.recalculateMetrics();
  }

  /**
   * Update emotional momentum
   */
  private updateMomentum(): void {
    if (this.trajectory.points.length < 3) {
      this.trajectory.currentMomentum = {
        velocity: 0,
        acceleration: 0,
        direction: 'stable',
        magnitude: 0,
      };
      return;
    }
    
    const recent = this.trajectory.points.slice(-5);
    
    // Calculate velocity (rate of emotional change)
    let totalVelocity = 0;
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const curr = recent[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // seconds
      
      const intensityChange = curr.intensity - prev.intensity;
      totalVelocity += intensityChange / timeDiff;
    }
    
    const avgVelocity = totalVelocity / (recent.length - 1);
    
    // Calculate acceleration (rate of velocity change)
    let acceleration = 0;
    if (recent.length >= 4) {
      const firstHalf = recent.slice(0, 2);
      const secondHalf = recent.slice(-2);
      
      const firstVelocity = (firstHalf[1].intensity - firstHalf[0].intensity) /
        ((firstHalf[1].timestamp - firstHalf[0].timestamp) / 1000);
      
      const secondVelocity = (secondHalf[1].intensity - secondHalf[0].intensity) /
        ((secondHalf[1].timestamp - secondHalf[0].timestamp) / 1000);
      
      acceleration = secondVelocity - firstVelocity;
    }
    
    // Determine direction
    let direction: EmotionalMomentum['direction'] = 'stable';
    if (Math.abs(avgVelocity) > 2) {
      if (avgVelocity > 0) direction = 'rising';
      else direction = 'falling';
    }
    
    // Check for oscillation
    const velocities: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      const change = recent[i].intensity - recent[i - 1].intensity;
      velocities.push(Math.sign(change));
    }
    
    const oscillations = velocities.filter((v, i) => 
      i > 0 && v !== velocities[i - 1]
    ).length;
    
    if (oscillations >= 2) {
      direction = 'oscillating';
    }
    
    // Calculate magnitude
    const magnitude = Math.min(100, Math.abs(avgVelocity) * 10);
    
    this.trajectory.currentMomentum = {
      velocity: Math.max(-100, Math.min(100, avgVelocity * 10)),
      acceleration: Math.max(-100, Math.min(100, acceleration * 10)),
      direction,
      magnitude,
    };
  }

  /**
   * Detect emotional peaks and valleys
   */
  private detectExtremes(): void {
    if (this.trajectory.points.length < 5) return;
    
    const recent = this.trajectory.points.slice(-7);
    const middle = recent[Math.floor(recent.length / 2)];
    
    // Check if middle point is a peak or valley
    const beforeIntensities = recent.slice(0, Math.floor(recent.length / 2))
      .map(p => p.intensity);
    const afterIntensities = recent.slice(Math.ceil(recent.length / 2))
      .map(p => p.intensity);
    
    const avgBefore = beforeIntensities.reduce((sum, v) => sum + v, 0) / beforeIntensities.length;
    const avgAfter = afterIntensities.reduce((sum, v) => sum + v, 0) / afterIntensities.length;
    
    const threshold = 10; // Minimum difference to be considered extreme
    
    // Peak detection
    if (middle.intensity > avgBefore + threshold && 
        middle.intensity > avgAfter + threshold) {
      
      // Check if we already recorded this peak
      const recentExtreme = this.trajectory.extremes[this.trajectory.extremes.length - 1];
      if (!recentExtreme || Math.abs(recentExtreme.timestamp - middle.timestamp) > 10000) {
        this.trajectory.extremes.push({
          timestamp: middle.timestamp,
          type: 'peak',
          emotion: middle.dominantEmotion,
          intensity: middle.intensity,
          leadingPattern: this.determinePattern(recent.slice(0, Math.floor(recent.length / 2))),
          trailingPattern: this.determinePattern(recent.slice(Math.ceil(recent.length / 2))),
        });
      }
    }
    
    // Valley detection
    if (middle.intensity < avgBefore - threshold && 
        middle.intensity < avgAfter - threshold) {
      
      const recentExtreme = this.trajectory.extremes[this.trajectory.extremes.length - 1];
      if (!recentExtreme || Math.abs(recentExtreme.timestamp - middle.timestamp) > 10000) {
        this.trajectory.extremes.push({
          timestamp: middle.timestamp,
          type: 'valley',
          emotion: middle.dominantEmotion,
          intensity: middle.intensity,
          leadingPattern: this.determinePattern(recent.slice(0, Math.floor(recent.length / 2))),
          trailingPattern: this.determinePattern(recent.slice(Math.ceil(recent.length / 2))),
        });
      }
    }
    
    // Keep only recent extremes
    if (this.trajectory.extremes.length > 20) {
      this.trajectory.extremes.shift();
    }
  }

  /**
   * Update current pattern
   */
  private updatePattern(): void {
    if (this.trajectory.points.length < 3) {
      this.trajectory.currentPattern = 'calm';
      return;
    }
    
    const recent = this.trajectory.points.slice(-5);
    this.trajectory.currentPattern = this.determinePattern(recent);
  }

  /**
   * Determine pattern from points
   */
  private determinePattern(points: EmotionalPoint[]): TrajectoryPattern {
    if (points.length < 2) return 'calm';
    
    const { direction, magnitude, velocity } = this.calculateLocalMomentum(points);
    
    // Flare: sudden spike
    if (magnitude > 60 && Math.abs(velocity) > 8) {
      return 'flare';
    }
    
    // Rise: building up
    if (direction === 'rising' && magnitude > 30) {
      return 'rise';
    }
    
    // Fall: calming down
    if (direction === 'falling' && magnitude > 30) {
      return 'fall';
    }
    
    // Oscillating: harmonic
    if (direction === 'oscillating') {
      return 'harmonic';
    }
    
    // Check for focus pattern (narrowing to single emotion)
    const emotionVariances = this.calculateEmotionVariances(points);
    const avgVariance = Object.values(emotionVariances)
      .reduce((sum, v) => sum + v, 0) / Object.keys(emotionVariances).length;
    
    if (avgVariance < 10 && points[points.length - 1].intensity > 60) {
      return 'focus';
    }
    
    // Check for resolve pattern (coming to clarity)
    const intensities = points.map(p => p.intensity);
    const startIntensity = intensities[0];
    const endIntensity = intensities[intensities.length - 1];
    const midIntensities = intensities.slice(1, -1);
    
    const hasVariation = midIntensities.some(i => Math.abs(i - startIntensity) > 15);
    const reachesStability = Math.abs(endIntensity - 60) < 20;
    
    if (hasVariation && reachesStability) {
      return 'resolve';
    }
    
    // Default to calm
    if (points[points.length - 1].intensity < 50) {
      return 'calm';
    }
    
    return 'calm';
  }

  /**
   * Calculate local momentum
   */
  private calculateLocalMomentum(points: EmotionalPoint[]): {
    direction: EmotionalMomentum['direction'];
    magnitude: number;
    velocity: number;
  } {
    if (points.length < 2) {
      return { direction: 'stable', magnitude: 0, velocity: 0 };
    }
    
    let totalVelocity = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const intensityChange = curr.intensity - prev.intensity;
      totalVelocity += intensityChange / timeDiff;
    }
    
    const avgVelocity = totalVelocity / (points.length - 1);
    
    let direction: EmotionalMomentum['direction'] = 'stable';
    if (Math.abs(avgVelocity) > 2) {
      direction = avgVelocity > 0 ? 'rising' : 'falling';
    }
    
    // Check oscillation
    const signs: number[] = [];
    for (let i = 1; i < points.length; i++) {
      signs.push(Math.sign(points[i].intensity - points[i - 1].intensity));
    }
    const changes = signs.filter((s, i) => i > 0 && s !== signs[i - 1]).length;
    if (changes >= 2) direction = 'oscillating';
    
    const magnitude = Math.min(100, Math.abs(avgVelocity) * 10);
    
    return { direction, magnitude, velocity: avgVelocity };
  }

  /**
   * Calculate emotion variances
   */
  private calculateEmotionVariances(points: EmotionalPoint[]): Record<string, number> {
    const emotions = ['calm', 'excited', 'focused', 'supportive', 'intense', 'analytical', 'playful'];
    const variances: Record<string, number> = {};
    
    emotions.forEach(emotion => {
      const values = points.map(p => p.emotions[emotion as keyof EmotionalPoint['emotions']]);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      variances[emotion] = variance;
    });
    
    return variances;
  }

  /**
   * Update trajectory segments
   */
  private updateSegments(): void {
    if (this.trajectory.points.length < 5) return;
    
    // Check if current segment is long enough
    const lastSegment = this.trajectory.segments[this.trajectory.segments.length - 1];
    
    if (lastSegment) {
      const currentDuration = Date.now() - lastSegment.startTime;
      
      // If pattern changed and minimum duration passed, create new segment
      if (currentDuration > this.SEGMENT_MIN_DURATION && 
          lastSegment.pattern !== this.trajectory.currentPattern) {
        
        const endPoint = this.trajectory.points[this.trajectory.points.length - 1];
        
        // Complete previous segment
        lastSegment.endTime = endPoint.timestamp;
        lastSegment.endPoint = endPoint;
        this.calculateSegmentMetrics(lastSegment);
        
        // Start new segment
        this.trajectory.segments.push({
          startTime: endPoint.timestamp,
          endTime: endPoint.timestamp,
          pattern: this.trajectory.currentPattern,
          startPoint: endPoint,
          endPoint: endPoint,
          smoothness: 100,
          coherence: 100,
        });
      }
    } else {
      // Create first segment
      const startPoint = this.trajectory.points[0];
      this.trajectory.segments.push({
        startTime: startPoint.timestamp,
        endTime: startPoint.timestamp,
        pattern: this.trajectory.currentPattern,
        startPoint,
        endPoint: startPoint,
        smoothness: 100,
        coherence: 100,
      });
    }
    
    // Keep only recent segments
    if (this.trajectory.segments.length > 30) {
      this.trajectory.segments.shift();
    }
  }

  /**
   * Calculate segment metrics
   */
  private calculateSegmentMetrics(segment: TrajectorySegment): void {
    const segmentPoints = this.trajectory.points.filter(p =>
      p.timestamp >= segment.startTime && p.timestamp <= segment.endTime
    );
    
    if (segmentPoints.length < 2) {
      segment.smoothness = 100;
      segment.coherence = 100;
      return;
    }
    
    // Smoothness: measure transition steadiness
    const intensityChanges = [];
    for (let i = 1; i < segmentPoints.length; i++) {
      const change = Math.abs(segmentPoints[i].intensity - segmentPoints[i - 1].intensity);
      intensityChanges.push(change);
    }
    
    const avgChange = intensityChanges.reduce((sum, c) => sum + c, 0) / intensityChanges.length;
    const variance = intensityChanges.reduce((sum, c) => 
      sum + Math.pow(c - avgChange, 2), 0) / intensityChanges.length;
    
    segment.smoothness = Math.max(0, 100 - variance * 2);
    
    // Coherence: measure emotional consistency
    const dominantEmotions = segmentPoints.map(p => p.dominantEmotion);
    const uniqueEmotions = new Set(dominantEmotions).size;
    segment.coherence = Math.max(0, 100 - (uniqueEmotions - 1) * 20);
  }

  /**
   * Recalculate overall metrics
   */
  private recalculateMetrics(): void {
    if (this.trajectory.points.length < 3) {
      this.trajectory.overallArc = 'stable';
      this.trajectory.coherence = 100;
      this.trajectory.smoothness = 100;
      return;
    }
    
    // Overall arc
    const startIntensity = this.trajectory.points[0].intensity;
    const endIntensity = this.trajectory.points[this.trajectory.points.length - 1].intensity;
    const diff = endIntensity - startIntensity;
    
    if (Math.abs(diff) < 15) {
      this.trajectory.overallArc = 'stable';
    } else if (diff > 15) {
      this.trajectory.overallArc = 'ascending';
    } else {
      this.trajectory.overallArc = 'descending';
    }
    
    // Check for cyclical
    if (this.trajectory.extremes.length >= 4) {
      const recentExtremes = this.trajectory.extremes.slice(-4);
      const peaks = recentExtremes.filter(e => e.type === 'peak').length;
      const valleys = recentExtremes.filter(e => e.type === 'valley').length;
      
      if (peaks >= 2 && valleys >= 2) {
        this.trajectory.overallArc = 'cyclical';
      }
    }
    
    // Overall coherence
    if (this.trajectory.segments.length > 0) {
      const avgCoherence = this.trajectory.segments
        .reduce((sum, s) => sum + s.coherence, 0) / this.trajectory.segments.length;
      this.trajectory.coherence = avgCoherence;
    }
    
    // Overall smoothness
    if (this.trajectory.segments.length > 0) {
      const avgSmoothness = this.trajectory.segments
        .reduce((sum, s) => sum + s.smoothness, 0) / this.trajectory.segments.length;
      this.trajectory.smoothness = avgSmoothness;
    }
  }

  /**
   * Get trajectory
   */
  getTrajectory(): EmotionalTrajectory {
    return JSON.parse(JSON.stringify(this.trajectory));
  }

  /**
   * Get trajectory summary
   */
  getTrajectorySummary(): {
    pattern: TrajectoryPattern;
    arc: string;
    momentum: string;
    duration: string;
    peaksAndValleys: number;
    coherence: number;
    smoothness: number;
  } {
    const minutes = Math.floor(this.trajectory.duration / 60000);
    const seconds = Math.floor((this.trajectory.duration % 60000) / 1000);
    
    let momentum = 'stable';
    if (this.trajectory.currentMomentum.direction === 'rising') {
      momentum = `rising (${this.trajectory.currentMomentum.magnitude.toFixed(0)}%)`;
    } else if (this.trajectory.currentMomentum.direction === 'falling') {
      momentum = `falling (${this.trajectory.currentMomentum.magnitude.toFixed(0)}%)`;
    } else if (this.trajectory.currentMomentum.direction === 'oscillating') {
      momentum = 'oscillating';
    }
    
    return {
      pattern: this.trajectory.currentPattern,
      arc: this.trajectory.overallArc,
      momentum,
      duration: minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`,
      peaksAndValleys: this.trajectory.extremes.length,
      coherence: this.trajectory.coherence,
      smoothness: this.trajectory.smoothness,
    };
  }

  /**
   * Predict next trajectory
   */
  predictNext(): {
    likelyPattern: TrajectoryPattern;
    confidence: number;
    expectedIntensity: number;
  } {
    if (this.trajectory.points.length < 5) {
      return {
        likelyPattern: 'calm',
        confidence: 50,
        expectedIntensity: 50,
      };
    }
    
    // Use current momentum to predict
    const { direction, magnitude, velocity } = this.trajectory.currentMomentum;
    const currentIntensity = this.trajectory.points[this.trajectory.points.length - 1].intensity;
    
    let likelyPattern: TrajectoryPattern = this.trajectory.currentPattern;
    let expectedIntensity = currentIntensity + velocity;
    
    // Pattern transitions based on momentum
    if (direction === 'rising' && currentIntensity > 70) {
      likelyPattern = 'flare';
    } else if (direction === 'falling' && currentIntensity < 40) {
      likelyPattern = 'calm';
    } else if (direction === 'stable' && currentIntensity > 60) {
      likelyPattern = 'focus';
    } else if (this.trajectory.extremes.length >= 2) {
      const lastExtreme = this.trajectory.extremes[this.trajectory.extremes.length - 1];
      if (lastExtreme.type === 'peak') {
        likelyPattern = 'resolve';
      }
    }
    
    // Confidence based on pattern stability
    const recentPatterns = this.trajectory.segments.slice(-3).map(s => s.pattern);
    const patternConsistency = recentPatterns.filter(p => p === this.trajectory.currentPattern).length;
    const confidence = Math.min(90, 50 + patternConsistency * 15);
    
    return {
      likelyPattern,
      confidence,
      expectedIntensity: Math.max(0, Math.min(100, expectedIntensity)),
    };
  }

  /**
   * Reset trajectory
   */
  reset(): void {
    this.trajectory = this.createInitialTrajectory();
  }

  /**
   * Export trajectory
   */
  export(): string {
    return JSON.stringify({
      trajectory: this.trajectory,
    });
  }

  /**
   * Import trajectory
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.trajectory = data.trajectory;
      return true;
    } catch (error) {
      console.error('Failed to import trajectory:', error);
      return false;
    }
  }
}
