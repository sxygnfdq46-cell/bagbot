/**
 * 🧠 ENVIRONMENTAL MEMORY LAYER
 * 
 * BagBot remembers past environmental conditions.
 * Learns patterns, adjusts emotional transitions over time.
 */

export interface EnvironmentalMemoryState {
  // Recent history
  recentStorms: StormMemory[];
  recentGravityShifts: GravityShiftMemory[];
  recentVolatilityFlows: FlowMemory[];
  atmosphericTrends: AtmosphericTrend[];
  
  // Pattern recognition
  recognizedPatterns: EnvironmentalPattern[];
  confidenceLevel: number;      // 0-100 (how confident in patterns)
  
  // Emotional adaptation
  stressAdaptation: number;     // 0-2 (multiplier for stress response)
  alertAdaptation: number;      // 0-2 (multiplier for alert response)
  calmAdaptation: number;       // 0-2 (multiplier for calm response)
  
  // Context recall
  contextMatches: ContextMatch[];
  
  // Statistics
  totalStormsExperienced: number;
  totalGravityShifts: number;
  averageRecoveryTime: number;  // milliseconds
  longestStormDuration: number; // milliseconds
}

export interface StormMemory {
  timestamp: number;
  intensity: number;            // 0-100
  duration: number;             // milliseconds
  recoveryTime: number;         // milliseconds
  emotionalImpact: number;      // 0-100 (how much it affected emotions)
}

export interface GravityShiftMemory {
  timestamp: number;
  fromPressure: 'heavy' | 'neutral' | 'light';
  toPressure: 'heavy' | 'neutral' | 'light';
  magnitude: number;            // 0-100
  emotionalResponse: 'stressed' | 'alert' | 'calm' | 'excited';
}

export interface FlowMemory {
  timestamp: number;
  velocity: number;             // 0-100
  turbulence: number;           // 0-100
  direction: { x: number; y: number };
  coherence: number;            // 0-100
}

export interface AtmosphericTrend {
  pattern: 'morning_volatility' | 'afternoon_calm' | 'evening_surge' | 'night_stillness' | 'weekend_pattern';
  frequency: number;            // 0-1 (how often this pattern occurs)
  confidence: number;           // 0-100
  lastSeen: number;             // timestamp
}

export interface EnvironmentalPattern {
  id: string;
  description: string;
  conditions: PatternCondition[];
  frequency: number;            // 0-1
  confidence: number;           // 0-100
  emotionalOutcome: 'stress' | 'calm' | 'excitement' | 'alertness' | 'uncertainty';
}

export interface PatternCondition {
  type: 'weather' | 'gravity' | 'flow' | 'storm' | 'time';
  value: any;
  tolerance: number;            // How close it needs to match
}

export interface ContextMatch {
  currentSituation: string;
  pastSituations: PastSituation[];
  similarity: number;           // 0-100
  recommendation: string;
}

export interface PastSituation {
  timestamp: number;
  description: string;
  outcome: 'positive' | 'negative' | 'neutral';
  emotionalState: string;
  environmentalState: string;
}

export class EnvironmentalMemoryLayer {
  private state: EnvironmentalMemoryState;
  private readonly MAX_STORM_MEMORY = 50;
  private readonly MAX_GRAVITY_MEMORY = 50;
  private readonly MAX_FLOW_MEMORY = 100;
  private readonly MEMORY_DECAY_RATE = 0.95; // 5% decay per day

  constructor() {
    this.state = {
      recentStorms: [],
      recentGravityShifts: [],
      recentVolatilityFlows: [],
      atmosphericTrends: [],
      recognizedPatterns: [],
      confidenceLevel: 50,
      stressAdaptation: 1.0,
      alertAdaptation: 1.0,
      calmAdaptation: 1.0,
      contextMatches: [],
      totalStormsExperienced: 0,
      totalGravityShifts: 0,
      averageRecoveryTime: 30000,
      longestStormDuration: 0
    };
  }

  // ============================================
  // MEMORY RECORDING
  // ============================================

  public recordStorm(
    intensity: number,
    duration: number,
    emotionalImpact: number
  ): void {
    const memory: StormMemory = {
      timestamp: Date.now(),
      intensity,
      duration,
      recoveryTime: 0, // Will be set later
      emotionalImpact
    };

    this.state.recentStorms.unshift(memory);
    
    // Trim to max size
    if (this.state.recentStorms.length > this.MAX_STORM_MEMORY) {
      this.state.recentStorms.pop();
    }

    // Update statistics
    this.state.totalStormsExperienced++;
    if (duration > this.state.longestStormDuration) {
      this.state.longestStormDuration = duration;
    }

    // Check for patterns
    this.detectStormPatterns();
  }

  public recordStormRecovery(recoveryTime: number): void {
    if (this.state.recentStorms.length > 0) {
      this.state.recentStorms[0].recoveryTime = recoveryTime;
      this.updateAverageRecoveryTime();
    }
  }

  public recordGravityShift(
    fromPressure: 'heavy' | 'neutral' | 'light',
    toPressure: 'heavy' | 'neutral' | 'light',
    magnitude: number,
    emotionalResponse: 'stressed' | 'alert' | 'calm' | 'excited'
  ): void {
    const memory: GravityShiftMemory = {
      timestamp: Date.now(),
      fromPressure,
      toPressure,
      magnitude,
      emotionalResponse
    };

    this.state.recentGravityShifts.unshift(memory);
    
    if (this.state.recentGravityShifts.length > this.MAX_GRAVITY_MEMORY) {
      this.state.recentGravityShifts.pop();
    }

    this.state.totalGravityShifts++;
    this.detectGravityPatterns();
  }

  public recordFlow(
    velocity: number,
    turbulence: number,
    direction: { x: number; y: number },
    coherence: number
  ): void {
    const memory: FlowMemory = {
      timestamp: Date.now(),
      velocity,
      turbulence,
      direction,
      coherence
    };

    this.state.recentVolatilityFlows.unshift(memory);
    
    if (this.state.recentVolatilityFlows.length > this.MAX_FLOW_MEMORY) {
      this.state.recentVolatilityFlows.pop();
    }
  }

  // ============================================
  // PATTERN DETECTION
  // ============================================

  private detectStormPatterns(): void {
    if (this.state.recentStorms.length < 5) return;

    // Check for recovery pattern
    const recoveryTimes = this.state.recentStorms
      .slice(0, 5)
      .filter(s => s.recoveryTime > 0)
      .map(s => s.recoveryTime);

    if (recoveryTimes.length >= 3) {
      const avgRecovery = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
      
      // If recent storms recover faster, adapt stress response
      if (avgRecovery < this.state.averageRecoveryTime * 0.7) {
        this.state.stressAdaptation = Math.max(0.5, this.state.stressAdaptation - 0.05);
        
        // Add pattern
        this.addPattern({
          id: 'quick_recovery',
          description: 'Storms tend to recover quickly',
          conditions: [{ type: 'storm', value: 'active', tolerance: 1 }],
          frequency: 0.8,
          confidence: 80,
          emotionalOutcome: 'calm'
        });
      }
    }

    // Check for intensity pattern
    const recentIntensities = this.state.recentStorms.slice(0, 5).map(s => s.intensity);
    const avgIntensity = recentIntensities.reduce((a, b) => a + b, 0) / recentIntensities.length;
    
    if (avgIntensity > 70) {
      // High intensity storms are common
      this.state.alertAdaptation = Math.min(1.5, this.state.alertAdaptation + 0.05);
      
      this.addPattern({
        id: 'high_intensity_norm',
        description: 'High intensity storms are normal',
        conditions: [{ type: 'storm', value: 'high_intensity', tolerance: 0.3 }],
        frequency: 0.7,
        confidence: 75,
        emotionalOutcome: 'alertness'
      });
    }
  }

  private detectGravityPatterns(): void {
    if (this.state.recentGravityShifts.length < 5) return;

    // Check for oscillation pattern (heavy <-> light)
    const recentShifts = this.state.recentGravityShifts.slice(0, 5);
    let oscillations = 0;
    
    for (let i = 0; i < recentShifts.length - 1; i++) {
      const current = recentShifts[i];
      const next = recentShifts[i + 1];
      
      if (
        (current.fromPressure === 'heavy' && current.toPressure === 'light') ||
        (current.fromPressure === 'light' && current.toPressure === 'heavy')
      ) {
        oscillations++;
      }
    }

    if (oscillations >= 3) {
      this.addPattern({
        id: 'gravity_oscillation',
        description: 'Gravity oscillates between heavy and light',
        conditions: [{ type: 'gravity', value: 'oscillating', tolerance: 0.3 }],
        frequency: 0.6,
        confidence: 70,
        emotionalOutcome: 'uncertainty'
      });
    }
  }

  private detectAtmosphericTrends(): void {
    // Check time-of-day patterns
    const now = new Date();
    const hour = now.getHours();

    // Morning volatility (6am - 10am)
    if (hour >= 6 && hour < 10) {
      const morningFlows = this.state.recentVolatilityFlows.filter(f => {
        const fTime = new Date(f.timestamp);
        return fTime.getHours() >= 6 && fTime.getHours() < 10;
      });

      if (morningFlows.length >= 10) {
        const avgTurbulence = morningFlows.reduce((a, b) => a + b.turbulence, 0) / morningFlows.length;
        
        if (avgTurbulence > 50) {
          this.updateAtmosphericTrend('morning_volatility', 0.7, 75);
        }
      }
    }

    // Afternoon calm (12pm - 3pm)
    if (hour >= 12 && hour < 15) {
      const afternoonFlows = this.state.recentVolatilityFlows.filter(f => {
        const fTime = new Date(f.timestamp);
        return fTime.getHours() >= 12 && fTime.getHours() < 15;
      });

      if (afternoonFlows.length >= 10) {
        const avgTurbulence = afternoonFlows.reduce((a, b) => a + b.turbulence, 0) / afternoonFlows.length;
        
        if (avgTurbulence < 30) {
          this.updateAtmosphericTrend('afternoon_calm', 0.6, 70);
        }
      }
    }
  }

  // ============================================
  // PATTERN MANAGEMENT
  // ============================================

  private addPattern(pattern: EnvironmentalPattern): void {
    // Check if pattern already exists
    const existingIndex = this.state.recognizedPatterns.findIndex(p => p.id === pattern.id);
    
    if (existingIndex >= 0) {
      // Update existing pattern
      const existing = this.state.recognizedPatterns[existingIndex];
      existing.frequency = (existing.frequency + pattern.frequency) / 2;
      existing.confidence = Math.min(100, existing.confidence + 5);
    } else {
      // Add new pattern
      this.state.recognizedPatterns.push(pattern);
    }

    // Update confidence level
    this.updateConfidenceLevel();
  }

  private updateAtmosphericTrend(
    pattern: AtmosphericTrend['pattern'],
    frequency: number,
    confidence: number
  ): void {
    const existingIndex = this.state.atmosphericTrends.findIndex(t => t.pattern === pattern);
    
    if (existingIndex >= 0) {
      this.state.atmosphericTrends[existingIndex].frequency = frequency;
      this.state.atmosphericTrends[existingIndex].confidence = confidence;
      this.state.atmosphericTrends[existingIndex].lastSeen = Date.now();
    } else {
      this.state.atmosphericTrends.push({
        pattern,
        frequency,
        confidence,
        lastSeen: Date.now()
      });
    }
  }

  // ============================================
  // EMOTIONAL ADAPTATION
  // ============================================

  private updateAverageRecoveryTime(): void {
    const validRecoveryTimes = this.state.recentStorms
      .filter(s => s.recoveryTime > 0)
      .map(s => s.recoveryTime);

    if (validRecoveryTimes.length > 0) {
      this.state.averageRecoveryTime = 
        validRecoveryTimes.reduce((a, b) => a + b, 0) / validRecoveryTimes.length;
    }
  }

  private updateConfidenceLevel(): void {
    if (this.state.recognizedPatterns.length === 0) {
      this.state.confidenceLevel = 50;
      return;
    }

    const avgConfidence = this.state.recognizedPatterns.reduce((a, b) => a + b.confidence, 0) 
      / this.state.recognizedPatterns.length;
    
    this.state.confidenceLevel = avgConfidence;
  }

  // ============================================
  // CONTEXT RECALL
  // ============================================

  public findSimilarPastSituations(
    currentWeather: string,
    currentEmotion: string,
    currentEnvironment: string
  ): ContextMatch {
    // Simplified: In real implementation, this would use ML or similarity scoring
    const pastSituations: PastSituation[] = [];

    // Search through storm memories
    for (const storm of this.state.recentStorms.slice(0, 10)) {
      pastSituations.push({
        timestamp: storm.timestamp,
        description: `Storm with intensity ${storm.intensity}`,
        outcome: storm.recoveryTime < this.state.averageRecoveryTime ? 'positive' : 'neutral',
        emotionalState: storm.emotionalImpact > 50 ? 'stressed' : 'alert',
        environmentalState: 'stormy'
      });
    }

    const similarity = this.calculateSimilarity(currentWeather, currentEnvironment, pastSituations);

    return {
      currentSituation: `${currentWeather} with ${currentEmotion}`,
      pastSituations,
      similarity,
      recommendation: this.generateRecommendation(pastSituations, similarity)
    };
  }

  private calculateSimilarity(
    currentWeather: string,
    currentEnvironment: string,
    pastSituations: PastSituation[]
  ): number {
    // Simplified similarity calculation
    let totalSimilarity = 0;
    let count = 0;

    for (const past of pastSituations) {
      if (past.environmentalState.includes(currentWeather.toLowerCase())) {
        totalSimilarity += 80;
        count++;
      } else {
        totalSimilarity += 30;
        count++;
      }
    }

    return count > 0 ? totalSimilarity / count : 50;
  }

  private generateRecommendation(
    pastSituations: PastSituation[],
    similarity: number
  ): string {
    if (similarity > 70) {
      const positiveOutcomes = pastSituations.filter(s => s.outcome === 'positive').length;
      const total = pastSituations.length;
      
      if (positiveOutcomes / total > 0.6) {
        return 'Similar situations typically resolve positively. Maintain current strategy.';
      } else {
        return 'Similar situations have been challenging. Consider heightened caution.';
      }
    } else {
      return 'Novel situation. Proceeding with standard protocols.';
    }
  }

  // ============================================
  // MEMORY DECAY
  // ============================================

  public applyMemoryDecay(): void {
    // Decay pattern confidence over time
    for (const pattern of this.state.recognizedPatterns) {
      pattern.confidence *= this.MEMORY_DECAY_RATE;
      pattern.frequency *= this.MEMORY_DECAY_RATE;
    }

    // Remove patterns with very low confidence
    this.state.recognizedPatterns = this.state.recognizedPatterns.filter(
      p => p.confidence > 10
    );

    // Decay emotional adaptations back to neutral (1.0)
    this.state.stressAdaptation = this.lerp(this.state.stressAdaptation, 1.0, 0.01);
    this.state.alertAdaptation = this.lerp(this.state.alertAdaptation, 1.0, 0.01);
    this.state.calmAdaptation = this.lerp(this.state.calmAdaptation, 1.0, 0.01);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): EnvironmentalMemoryState {
    return { ...this.state };
  }

  public getEmotionalAdaptations() {
    return {
      stress: this.state.stressAdaptation,
      alert: this.state.alertAdaptation,
      calm: this.state.calmAdaptation
    };
  }

  public getRecognizedPatterns(): EnvironmentalPattern[] {
    return [...this.state.recognizedPatterns];
  }

  public getAtmosphericTrends(): AtmosphericTrend[] {
    return [...this.state.atmosphericTrends];
  }

  public getConfidenceLevel(): number {
    return this.state.confidenceLevel;
  }

  public reset(): void {
    this.state = {
      recentStorms: [],
      recentGravityShifts: [],
      recentVolatilityFlows: [],
      atmosphericTrends: [],
      recognizedPatterns: [],
      confidenceLevel: 50,
      stressAdaptation: 1.0,
      alertAdaptation: 1.0,
      calmAdaptation: 1.0,
      contextMatches: [],
      totalStormsExperienced: 0,
      totalGravityShifts: 0,
      averageRecoveryTime: 30000,
      longestStormDuration: 0
    };
  }
}
