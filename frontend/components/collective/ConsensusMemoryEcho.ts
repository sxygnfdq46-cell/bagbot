/**
 * LEVEL 11.4 — CONSENSUS MEMORY ECHO (CME)
 * 
 * Memory-safe pattern storage (NO user data, only abstract pattern fragments).
 * Detects repeating crowd cycles, seasonal mood shifts, liquidity personality, volatility temperament.
 * 
 * Architecture:
 * - Pattern fragment storage (abstracted, anonymized)
 * - Cycle detection (repeating crowd behaviors)
 * - Seasonal mood tracking (temporal emotional patterns)
 * - Liquidity personality profiling
 * - Volatility temperament analysis
 * 
 * PRIVACY-SAFE: Stores only statistical patterns, NO personal/identifiable data.
 */

// ================================
// MEMORY TYPES
// ================================

/**
 * Pattern fragment - abstract memory unit
 */
export interface PatternFragment {
  id: string;
  timestamp: number;
  
  // Abstract pattern signature (NO raw data)
  signature: {
    pressureLevel: 'low' | 'medium' | 'high' | 'extreme';
    momentumDirection: 'bullish' | 'bearish' | 'neutral';
    emotionalBias: 'fear' | 'neutral' | 'greed';
    crowdPhase: 'accumulation' | 'distribution' | 'neutral' | 'panic';
    coherence: 'scattered' | 'unified';
  };
  
  // Contextual markers
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: 'weekday' | 'weekend';
  volatilityRegime: 'low' | 'moderate' | 'high' | 'extreme';
  
  // Pattern strength
  strength: number; // 0-100
  recurrence: number; // How many times seen
}

/**
 * Crowd cycle - repeating behavioral pattern
 */
export interface CrowdCycle {
  id: string;
  type: 'panic-recovery' | 'accumulation-distribution' | 'consolidation-breakout' | 'oscillation';
  
  // Cycle characteristics
  averageDuration: number; // milliseconds
  phaseCount: number; // How many phases
  predictability: number; // 0-100
  
  // Pattern signature sequence
  phases: PatternFragment['signature'][];
  
  // Occurrence tracking
  lastSeen: number;
  occurrenceCount: number;
  confidence: number; // 0-100: how reliable
}

/**
 * Seasonal mood - temporal emotional pattern
 */
export interface SeasonalMood {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  
  // Mood profile
  dominantEmotion: 'fear' | 'neutral' | 'greed';
  typicalPressure: number; // 0-100
  typicalMomentum: number; // -50 to +50
  
  // Timing
  peakTime: string; // e.g., "14:00", "Monday", "Week 1"
  troughTime: string;
  
  // Reliability
  consistency: number; // 0-100: how predictable
  sampleSize: number; // How many data points
}

/**
 * Liquidity personality - characteristic flow behavior
 */
export interface LiquidityPersonality {
  trait: 'steady' | 'erratic' | 'aggressive' | 'defensive' | 'adaptive';
  
  // Behavioral profile
  averageFlowRate: number; // 0-100
  depthStability: number; // 0-100
  imbalanceTendency: 'buy-biased' | 'sell-biased' | 'balanced';
  
  // Response patterns
  volatilityResponse: 'dampening' | 'amplifying' | 'neutral';
  pressureResponse: 'absorbing' | 'fleeing' | 'neutral';
  
  // Meta
  confidence: number; // 0-100
  observationPeriod: number; // milliseconds
}

/**
 * Volatility temperament - characteristic volatility behavior
 */
export interface VolatilityTemperament {
  disposition: 'calm' | 'nervous' | 'explosive' | 'bipolar' | 'controlled';
  
  // Volatility profile
  baselineLevel: number; // 0-100
  spikeFrequency: number; // spikes per hour
  averageSpikeIntensity: number; // 0-100
  clusterTendency: number; // 0-100: how much spikes cluster
  
  // Timing patterns
  activeHours: string[]; // e.g., ["09:00-10:00", "14:00-15:00"]
  quietHours: string[];
  
  // Predictability
  forecastability: number; // 0-100
  regime: 'low' | 'moderate' | 'high' | 'extreme';
}

/**
 * Memory echo state
 */
export interface MemoryEchoState {
  timestamp: number;
  
  // Stored patterns
  fragments: PatternFragment[];
  cycles: CrowdCycle[];
  seasonalMoods: SeasonalMood[];
  liquidityPersonality: LiquidityPersonality;
  volatilityTemperament: VolatilityTemperament;
  
  // Meta
  totalPatterns: number;
  oldestPattern: number;
  memoryHealth: number; // 0-100: quality of pattern database
}

// ================================
// CONSENSUS MEMORY ECHO
// ================================

export class ConsensusMemoryEcho {
  private fragments: PatternFragment[] = [];
  private cycles: CrowdCycle[] = [];
  private seasonalMoods: SeasonalMood[] = [];
  private liquidityPersonality: LiquidityPersonality;
  private volatilityTemperament: VolatilityTemperament;
  
  private readonly MAX_FRAGMENTS = 500;
  private readonly MAX_CYCLES = 20;
  
  constructor() {
    this.liquidityPersonality = this.createDefaultLiquidityPersonality();
    this.volatilityTemperament = this.createDefaultVolatilityTemperament();
  }

  /**
   * Create default liquidity personality
   */
  private createDefaultLiquidityPersonality(): LiquidityPersonality {
    return {
      trait: 'steady',
      averageFlowRate: 50,
      depthStability: 70,
      imbalanceTendency: 'balanced',
      volatilityResponse: 'neutral',
      pressureResponse: 'neutral',
      confidence: 50,
      observationPeriod: 0,
    };
  }

  /**
   * Create default volatility temperament
   */
  private createDefaultVolatilityTemperament(): VolatilityTemperament {
    return {
      disposition: 'calm',
      baselineLevel: 30,
      spikeFrequency: 2,
      averageSpikeIntensity: 40,
      clusterTendency: 30,
      activeHours: [],
      quietHours: [],
      forecastability: 50,
      regime: 'moderate',
    };
  }

  /**
   * Record pattern fragment
   */
  recordPattern(input: {
    pressure: number;
    momentum: number;
    emotionalBias: 'fear' | 'neutral' | 'greed';
    crowdPhase: 'accumulation' | 'distribution' | 'neutral' | 'panic';
    coherence: number;
    volatility: number;
  }): void {
    const now = Date.now();
    const date = new Date(now);
    
    // Abstract the pattern
    const signature: PatternFragment['signature'] = {
      pressureLevel: this.categorizePressure(input.pressure),
      momentumDirection: this.categorizeMomentum(input.momentum),
      emotionalBias: input.emotionalBias,
      crowdPhase: input.crowdPhase,
      coherence: input.coherence > 60 ? 'unified' : 'scattered',
    };
    
    // Contextual markers
    const hour = date.getHours();
    const timeOfDay = this.categorizeTimeOfDay(hour);
    const dayOfWeek = date.getDay() === 0 || date.getDay() === 6 ? 'weekend' : 'weekday';
    const volatilityRegime = this.categorizeVolatility(input.volatility);
    
    // Check if similar pattern exists
    const existing = this.findSimilarFragment(signature, timeOfDay, dayOfWeek);
    
    if (existing) {
      // Increment recurrence
      existing.recurrence++;
      existing.timestamp = now;
      existing.strength = Math.min(100, existing.strength + 2);
    } else {
      // Create new fragment
      const fragment: PatternFragment = {
        id: `fragment-${now}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: now,
        signature,
        timeOfDay,
        dayOfWeek,
        volatilityRegime,
        strength: 30,
        recurrence: 1,
      };
      
      this.fragments.push(fragment);
      
      // Prune old fragments
      if (this.fragments.length > this.MAX_FRAGMENTS) {
        this.fragments.sort((a, b) => a.strength - b.strength);
        this.fragments.shift();
      }
    }
    
    // Update cycles
    this.updateCycles();
    
    // Update seasonal moods
    this.updateSeasonalMoods(signature, timeOfDay, date);
    
    // Update liquidity personality
    this.updateLiquidityPersonality(input);
    
    // Update volatility temperament
    this.updateVolatilityTemperament(input.volatility, hour);
  }

  /**
   * Categorize pressure
   */
  private categorizePressure(pressure: number): PatternFragment['signature']['pressureLevel'] {
    if (pressure > 75) return 'extreme';
    if (pressure > 50) return 'high';
    if (pressure > 25) return 'medium';
    return 'low';
  }

  /**
   * Categorize momentum
   */
  private categorizeMomentum(momentum: number): PatternFragment['signature']['momentumDirection'] {
    if (momentum > 10) return 'bullish';
    if (momentum < -10) return 'bearish';
    return 'neutral';
  }

  /**
   * Categorize time of day
   */
  private categorizeTimeOfDay(hour: number): PatternFragment['timeOfDay'] {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 23) return 'evening';
    return 'night';
  }

  /**
   * Categorize volatility
   */
  private categorizeVolatility(volatility: number): PatternFragment['volatilityRegime'] {
    if (volatility > 75) return 'extreme';
    if (volatility > 50) return 'high';
    if (volatility > 25) return 'moderate';
    return 'low';
  }

  /**
   * Find similar fragment
   */
  private findSimilarFragment(
    signature: PatternFragment['signature'],
    timeOfDay: PatternFragment['timeOfDay'],
    dayOfWeek: PatternFragment['dayOfWeek']
  ): PatternFragment | undefined {
    return this.fragments.find(
      f =>
        f.signature.pressureLevel === signature.pressureLevel &&
        f.signature.momentumDirection === signature.momentumDirection &&
        f.signature.emotionalBias === signature.emotionalBias &&
        f.signature.crowdPhase === signature.crowdPhase &&
        f.timeOfDay === timeOfDay &&
        f.dayOfWeek === dayOfWeek
    );
  }

  /**
   * Update cycles
   */
  private updateCycles(): void {
    if (this.fragments.length < 10) return;
    
    // Detect panic-recovery cycle
    this.detectPanicRecoveryCycle();
    
    // Detect accumulation-distribution cycle
    this.detectAccumulationDistributionCycle();
    
    // Prune old cycles
    if (this.cycles.length > this.MAX_CYCLES) {
      this.cycles.sort((a, b) => a.confidence - b.confidence);
      this.cycles.shift();
    }
  }

  /**
   * Detect panic-recovery cycle
   */
  private detectPanicRecoveryCycle(): void {
    const recentFragments = this.fragments.slice(-20);
    
    // Look for panic followed by neutral/accumulation
    const panicIndices: number[] = [];
    recentFragments.forEach((f, i) => {
      if (f.signature.crowdPhase === 'panic') panicIndices.push(i);
    });
    
    panicIndices.forEach(panicIndex => {
      if (panicIndex < recentFragments.length - 3) {
        const after = recentFragments.slice(panicIndex + 1, panicIndex + 4);
        const hasRecovery = after.some(
          f => f.signature.crowdPhase === 'neutral' || f.signature.crowdPhase === 'accumulation'
        );
        
        if (hasRecovery) {
          // Record cycle
          const existing = this.cycles.find(c => c.type === 'panic-recovery');
          
          if (existing) {
            existing.occurrenceCount++;
            existing.lastSeen = Date.now();
            existing.confidence = Math.min(100, existing.confidence + 5);
          } else {
            this.cycles.push({
              id: `cycle-panic-recovery-${Date.now()}`,
              type: 'panic-recovery',
              averageDuration: 180000, // 3 minutes
              phaseCount: 2,
              predictability: 60,
              phases: [
                { pressureLevel: 'extreme', momentumDirection: 'bearish', emotionalBias: 'fear', crowdPhase: 'panic', coherence: 'scattered' },
                { pressureLevel: 'medium', momentumDirection: 'neutral', emotionalBias: 'neutral', crowdPhase: 'neutral', coherence: 'unified' },
              ],
              lastSeen: Date.now(),
              occurrenceCount: 1,
              confidence: 50,
            });
          }
        }
      }
    });
  }

  /**
   * Detect accumulation-distribution cycle
   */
  private detectAccumulationDistributionCycle(): void {
    const recentFragments = this.fragments.slice(-30);
    
    // Look for accumulation followed by distribution
    const accumulationIndices: number[] = [];
    recentFragments.forEach((f, i) => {
      if (f.signature.crowdPhase === 'accumulation') accumulationIndices.push(i);
    });
    
    accumulationIndices.forEach(accIndex => {
      if (accIndex < recentFragments.length - 5) {
        const after = recentFragments.slice(accIndex + 1, accIndex + 6);
        const hasDistribution = after.some(f => f.signature.crowdPhase === 'distribution');
        
        if (hasDistribution) {
          const existing = this.cycles.find(c => c.type === 'accumulation-distribution');
          
          if (existing) {
            existing.occurrenceCount++;
            existing.lastSeen = Date.now();
            existing.confidence = Math.min(100, existing.confidence + 3);
          } else {
            this.cycles.push({
              id: `cycle-acc-dist-${Date.now()}`,
              type: 'accumulation-distribution',
              averageDuration: 300000, // 5 minutes
              phaseCount: 2,
              predictability: 55,
              phases: [
                { pressureLevel: 'low', momentumDirection: 'bullish', emotionalBias: 'neutral', crowdPhase: 'accumulation', coherence: 'unified' },
                { pressureLevel: 'high', momentumDirection: 'bearish', emotionalBias: 'greed', crowdPhase: 'distribution', coherence: 'scattered' },
              ],
              lastSeen: Date.now(),
              occurrenceCount: 1,
              confidence: 50,
            });
          }
        }
      }
    });
  }

  /**
   * Update seasonal moods
   */
  private updateSeasonalMoods(
    signature: PatternFragment['signature'],
    timeOfDay: PatternFragment['timeOfDay'],
    date: Date
  ): void {
    // Update hourly mood
    this.updateMoodPeriod('hourly', signature, timeOfDay);
    
    // Update daily mood
    const dayKey = date.getDay().toString();
    this.updateMoodPeriod('daily', signature, dayKey);
  }

  /**
   * Update mood period
   */
  private updateMoodPeriod(
    period: SeasonalMood['period'],
    signature: PatternFragment['signature'],
    key: string
  ): void {
    let mood = this.seasonalMoods.find(m => m.period === period && m.peakTime === key);
    
    if (!mood) {
      mood = {
        period,
        dominantEmotion: signature.emotionalBias,
        typicalPressure: signature.pressureLevel === 'extreme' ? 80 : signature.pressureLevel === 'high' ? 60 : signature.pressureLevel === 'medium' ? 40 : 20,
        typicalMomentum: signature.momentumDirection === 'bullish' ? 30 : signature.momentumDirection === 'bearish' ? -30 : 0,
        peakTime: key,
        troughTime: key,
        consistency: 40,
        sampleSize: 1,
      };
      this.seasonalMoods.push(mood);
    } else {
      // Update with weighted average
      mood.sampleSize++;
      const weight = 1 / mood.sampleSize;
      
      const newPressure = signature.pressureLevel === 'extreme' ? 80 : signature.pressureLevel === 'high' ? 60 : signature.pressureLevel === 'medium' ? 40 : 20;
      mood.typicalPressure = mood.typicalPressure * (1 - weight) + newPressure * weight;
      
      const newMomentum = signature.momentumDirection === 'bullish' ? 30 : signature.momentumDirection === 'bearish' ? -30 : 0;
      mood.typicalMomentum = mood.typicalMomentum * (1 - weight) + newMomentum * weight;
      
      mood.consistency = Math.min(100, mood.consistency + 2);
    }
  }

  /**
   * Update liquidity personality
   */
  private updateLiquidityPersonality(input: {
    pressure: number;
    momentum: number;
    volatility: number;
  }): void {
    // Simplified personality update
    const personality = this.liquidityPersonality;
    
    // Flow rate: correlated with momentum
    const flowRate = Math.abs(input.momentum) * 2;
    personality.averageFlowRate =
      personality.averageFlowRate * 0.9 + flowRate * 0.1;
    
    // Depth stability: inverse of volatility
    const stability = 100 - input.volatility;
    personality.depthStability =
      personality.depthStability * 0.9 + stability * 0.1;
    
    // Imbalance tendency
    if (input.momentum > 10) personality.imbalanceTendency = 'buy-biased';
    else if (input.momentum < -10) personality.imbalanceTendency = 'sell-biased';
    else personality.imbalanceTendency = 'balanced';
    
    // Volatility response
    if (input.volatility > 70 && input.pressure < 50) {
      personality.volatilityResponse = 'dampening';
    } else if (input.volatility > 70 && input.pressure > 70) {
      personality.volatilityResponse = 'amplifying';
    } else {
      personality.volatilityResponse = 'neutral';
    }
    
    // Determine trait
    if (personality.depthStability > 75) personality.trait = 'steady';
    else if (personality.depthStability < 40) personality.trait = 'erratic';
    else if (personality.averageFlowRate > 70) personality.trait = 'aggressive';
    else if (personality.averageFlowRate < 30) personality.trait = 'defensive';
    else personality.trait = 'adaptive';
    
    personality.confidence = Math.min(100, personality.confidence + 0.5);
    personality.observationPeriod += 1000;
  }

  /**
   * Update volatility temperament
   */
  private updateVolatilityTemperament(volatility: number, hour: number): void {
    const temperament = this.volatilityTemperament;
    
    // Baseline level: long-term average
    temperament.baselineLevel =
      temperament.baselineLevel * 0.95 + volatility * 0.05;
    
    // Spike detection
    if (volatility > 70) {
      temperament.spikeFrequency =
        temperament.spikeFrequency * 0.9 + 1 * 0.1;
      temperament.averageSpikeIntensity =
        temperament.averageSpikeIntensity * 0.9 + volatility * 0.1;
      
      // Track active hours
      const hourStr = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      if (!temperament.activeHours.includes(hourStr) && temperament.activeHours.length < 10) {
        temperament.activeHours.push(hourStr);
      }
    } else if (volatility < 30) {
      // Track quiet hours
      const hourStr = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      if (!temperament.quietHours.includes(hourStr) && temperament.quietHours.length < 10) {
        temperament.quietHours.push(hourStr);
      }
    }
    
    // Determine disposition
    if (temperament.baselineLevel < 25) temperament.disposition = 'calm';
    else if (temperament.spikeFrequency > 5) temperament.disposition = 'explosive';
    else if (temperament.baselineLevel > 60) temperament.disposition = 'nervous';
    else temperament.disposition = 'controlled';
    
    // Regime
    if (temperament.baselineLevel > 75) temperament.regime = 'extreme';
    else if (temperament.baselineLevel > 50) temperament.regime = 'high';
    else if (temperament.baselineLevel > 25) temperament.regime = 'moderate';
    else temperament.regime = 'low';
    
    temperament.forecastability = Math.min(100, temperament.forecastability + 0.3);
  }

  /**
   * Get memory state
   */
  getState(): MemoryEchoState {
    return {
      timestamp: Date.now(),
      fragments: [...this.fragments],
      cycles: [...this.cycles],
      seasonalMoods: [...this.seasonalMoods],
      liquidityPersonality: { ...this.liquidityPersonality },
      volatilityTemperament: { ...this.volatilityTemperament },
      totalPatterns: this.fragments.length,
      oldestPattern: this.fragments.length > 0 ? this.fragments[0].timestamp : 0,
      memoryHealth: this.calculateMemoryHealth(),
    };
  }

  /**
   * Calculate memory health
   */
  private calculateMemoryHealth(): number {
    if (this.fragments.length === 0) return 0;
    
    // Health based on fragment strength and cycle confidence
    const avgFragmentStrength =
      this.fragments.reduce((sum, f) => sum + f.strength, 0) / this.fragments.length;
    
    const avgCycleConfidence =
      this.cycles.length > 0
        ? this.cycles.reduce((sum, c) => sum + c.confidence, 0) / this.cycles.length
        : 50;
    
    return (avgFragmentStrength + avgCycleConfidence) / 2;
  }

  /**
   * Find matching patterns
   */
  findMatches(query: Partial<PatternFragment['signature']>): PatternFragment[] {
    return this.fragments.filter(f => {
      if (query.pressureLevel && f.signature.pressureLevel !== query.pressureLevel) return false;
      if (query.momentumDirection && f.signature.momentumDirection !== query.momentumDirection) return false;
      if (query.emotionalBias && f.signature.emotionalBias !== query.emotionalBias) return false;
      if (query.crowdPhase && f.signature.crowdPhase !== query.crowdPhase) return false;
      return true;
    }).sort((a, b) => b.strength - a.strength);
  }

  /**
   * Predict next pattern
   */
  predictNext(): PatternFragment | null {
    if (this.fragments.length < 5) return null;
    
    // Find strongest recent pattern
    const recent = this.fragments.slice(-10);
    recent.sort((a, b) => b.strength - a.strength);
    
    return recent[0];
  }

  /**
   * Reset memory
   */
  reset(): void {
    this.fragments = [];
    this.cycles = [];
    this.seasonalMoods = [];
    this.liquidityPersonality = this.createDefaultLiquidityPersonality();
    this.volatilityTemperament = this.createDefaultVolatilityTemperament();
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      fragments: this.fragments,
      cycles: this.cycles,
      seasonalMoods: this.seasonalMoods,
      liquidityPersonality: this.liquidityPersonality,
      volatilityTemperament: this.volatilityTemperament,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.fragments = data.fragments;
      this.cycles = data.cycles;
      this.seasonalMoods = data.seasonalMoods;
      this.liquidityPersonality = data.liquidityPersonality;
      this.volatilityTemperament = data.volatilityTemperament;
      return true;
    } catch (error) {
      console.error('Failed to import memory state:', error);
      return false;
    }
  }
}
