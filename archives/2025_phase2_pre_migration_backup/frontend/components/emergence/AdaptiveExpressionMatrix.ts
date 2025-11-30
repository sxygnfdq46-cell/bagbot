/**
 * LEVEL 11.3 — ADAPTIVE EXPRESSION MATRIX (AEM)
 * 
 * Controls micro-expressive timing and modulation.
 * Makes responses feel alive - soft/sharp, warm/cool, fast/slow by context.
 * 
 * Architecture:
 * - Warmth modulation (caring ↔ neutral)
 * - Intensity modulation (gentle ↔ forceful)
 * - Clarity modulation (ambiguous ↔ precise)
 * - Micro-timing controls (pauses, emphasis, rhythm)
 * - Dynamic adaptation to user state & session flow
 * 
 * This is what makes BagBot feel human, not robotic.
 */

// ================================
// EXPRESSION TYPES
// ================================

/**
 * Expression dimension modulation
 */
export interface ExpressionDimension {
  value: number; // 0-100 scale
  target: number; // Where it's moving toward
  rate: number; // How fast it changes (0-10)
  bounds: [number, number]; // Min/max limits
}

/**
 * Micro-timing control
 */
export interface MicroTiming {
  pauseBefore: number; // ms delay before response
  pauseAfter: number; // ms delay after response
  emphasisDelay: number; // ms pause before important words
  rhythmPattern: 'steady' | 'flowing' | 'staccato' | 'crescendo';
  breathingSpace: number; // ms between thoughts (0-2000)
}

/**
 * Expression modulation settings
 */
export interface ExpressionModulation {
  warmth: ExpressionDimension;
  intensity: ExpressionDimension;
  clarity: ExpressionDimension;
  timing: MicroTiming;
  
  // Meta properties
  adaptability: number; // 0-100: how responsive to changes
  stability: number; // 0-100: how resistant to fluctuation
  coherence: number; // 0-100: internal consistency
}

/**
 * User state signals
 */
export interface UserStateSignal {
  emotionalTone: 'calm' | 'excited' | 'stressed' | 'curious' | 'frustrated' | 'satisfied';
  engagement: number; // 0-100
  complexity: number; // 0-100: how complex their input is
  urgency: number; // 0-100
  relationshipStage: 'new' | 'building' | 'established' | 'deep';
}

/**
 * Session flow signals
 */
export interface SessionFlowSignal {
  duration: number; // ms since start
  interactionCount: number;
  topicShifts: number;
  emotionalChanges: number;
  momentum: 'building' | 'steady' | 'winding-down';
  pressure: 'low' | 'moderate' | 'high';
}

/**
 * Expression adaptation directive
 */
export interface ExpressionAdaptation {
  dimension: 'warmth' | 'intensity' | 'clarity';
  targetShift: number; // -50 to +50
  rateAdjustment: number; // -5 to +5
  reason: string;
  priority: number; // 0-10
}

// ================================
// ADAPTIVE EXPRESSION MATRIX
// ================================

export class AdaptiveExpressionMatrix {
  private modulation: ExpressionModulation;
  private readonly ADAPTATION_SMOOTHING = 0.15; // How much to blend adaptations
  
  constructor() {
    this.modulation = this.createDefaultModulation();
  }

  /**
   * Create default modulation
   */
  private createDefaultModulation(): ExpressionModulation {
    return {
      warmth: {
        value: 70,
        target: 70,
        rate: 3,
        bounds: [20, 95],
      },
      intensity: {
        value: 55,
        target: 55,
        rate: 4,
        bounds: [10, 90],
      },
      clarity: {
        value: 75,
        target: 75,
        rate: 5,
        bounds: [30, 100],
      },
      timing: {
        pauseBefore: 500,
        pauseAfter: 300,
        emphasisDelay: 200,
        rhythmPattern: 'flowing',
        breathingSpace: 800,
      },
      adaptability: 70,
      stability: 65,
      coherence: 85,
    };
  }

  /**
   * Adapt to user state
   */
  adaptToUser(userState: UserStateSignal): void {
    const adaptations: ExpressionAdaptation[] = [];
    
    // Emotional tone adaptations
    switch (userState.emotionalTone) {
      case 'calm':
        adaptations.push({
          dimension: 'warmth',
          targetShift: +15,
          rateAdjustment: -2,
          reason: 'User is calm - increase warmth gently',
          priority: 6,
        });
        adaptations.push({
          dimension: 'intensity',
          targetShift: -10,
          rateAdjustment: 0,
          reason: 'Match calm with gentle intensity',
          priority: 5,
        });
        break;
        
      case 'excited':
        adaptations.push({
          dimension: 'intensity',
          targetShift: +20,
          rateAdjustment: +3,
          reason: 'User excited - amp up energy',
          priority: 8,
        });
        adaptations.push({
          dimension: 'warmth',
          targetShift: +10,
          rateAdjustment: +1,
          reason: 'Match excitement with warmth',
          priority: 6,
        });
        break;
        
      case 'stressed':
        adaptations.push({
          dimension: 'warmth',
          targetShift: +25,
          rateAdjustment: -1,
          reason: 'User stressed - maximize supportive warmth',
          priority: 9,
        });
        adaptations.push({
          dimension: 'intensity',
          targetShift: -15,
          rateAdjustment: -2,
          reason: 'Lower intensity to avoid overwhelming',
          priority: 8,
        });
        adaptations.push({
          dimension: 'clarity',
          targetShift: +15,
          rateAdjustment: +1,
          reason: 'High clarity reduces confusion',
          priority: 7,
        });
        break;
        
      case 'curious':
        adaptations.push({
          dimension: 'clarity',
          targetShift: +10,
          rateAdjustment: +2,
          reason: 'Curiosity needs clear explanations',
          priority: 7,
        });
        adaptations.push({
          dimension: 'intensity',
          targetShift: 0,
          rateAdjustment: +1,
          reason: 'Moderate intensity for engagement',
          priority: 4,
        });
        break;
        
      case 'frustrated':
        adaptations.push({
          dimension: 'clarity',
          targetShift: +20,
          rateAdjustment: +3,
          reason: 'Frustration needs maximum clarity',
          priority: 10,
        });
        adaptations.push({
          dimension: 'warmth',
          targetShift: +10,
          rateAdjustment: 0,
          reason: 'Warmth helps defuse frustration',
          priority: 7,
        });
        adaptations.push({
          dimension: 'intensity',
          targetShift: -5,
          rateAdjustment: -1,
          reason: 'Avoid adding pressure',
          priority: 6,
        });
        break;
        
      case 'satisfied':
        adaptations.push({
          dimension: 'warmth',
          targetShift: +5,
          rateAdjustment: 0,
          reason: 'Subtle warmth reinforcement',
          priority: 5,
        });
        adaptations.push({
          dimension: 'intensity',
          targetShift: -5,
          rateAdjustment: -1,
          reason: 'Relax intensity when satisfied',
          priority: 4,
        });
        break;
    }
    
    // Engagement adaptations
    if (userState.engagement < 40) {
      adaptations.push({
        dimension: 'intensity',
        targetShift: +15,
        rateAdjustment: +2,
        reason: 'Low engagement - increase energy',
        priority: 7,
      });
    } else if (userState.engagement > 80) {
      adaptations.push({
        dimension: 'intensity',
        targetShift: -5,
        rateAdjustment: 0,
        reason: 'High engagement - maintain flow',
        priority: 4,
      });
    }
    
    // Complexity adaptations
    if (userState.complexity > 70) {
      adaptations.push({
        dimension: 'clarity',
        targetShift: +20,
        rateAdjustment: +2,
        reason: 'Complex input needs clear responses',
        priority: 8,
      });
    }
    
    // Urgency adaptations
    if (userState.urgency > 70) {
      adaptations.push({
        dimension: 'clarity',
        targetShift: +15,
        rateAdjustment: +3,
        reason: 'Urgency requires directness',
        priority: 9,
      });
      adaptations.push({
        dimension: 'intensity',
        targetShift: +10,
        rateAdjustment: +2,
        reason: 'Match urgency with intensity',
        priority: 7,
      });
    }
    
    // Relationship stage adaptations
    switch (userState.relationshipStage) {
      case 'new':
        adaptations.push({
          dimension: 'clarity',
          targetShift: +10,
          rateAdjustment: 0,
          reason: 'New relationship needs clear communication',
          priority: 6,
        });
        adaptations.push({
          dimension: 'warmth',
          targetShift: +5,
          rateAdjustment: 0,
          reason: 'Welcoming warmth for new users',
          priority: 5,
        });
        break;
        
      case 'established':
        adaptations.push({
          dimension: 'warmth',
          targetShift: +10,
          rateAdjustment: 0,
          reason: 'Established relationship allows more warmth',
          priority: 6,
        });
        break;
        
      case 'deep':
        adaptations.push({
          dimension: 'warmth',
          targetShift: +15,
          rateAdjustment: 0,
          reason: 'Deep relationship - full warmth',
          priority: 7,
        });
        adaptations.push({
          dimension: 'clarity',
          targetShift: -5,
          rateAdjustment: 0,
          reason: 'Can be slightly less formal',
          priority: 3,
        });
        break;
    }
    
    // Apply adaptations
    this.applyAdaptations(adaptations);
  }

  /**
   * Adapt to session flow
   */
  adaptToSession(sessionFlow: SessionFlowSignal): void {
    const adaptations: ExpressionAdaptation[] = [];
    
    // Duration adaptations
    const minutes = sessionFlow.duration / 60000;
    if (minutes > 20) {
      adaptations.push({
        dimension: 'warmth',
        targetShift: +5,
        rateAdjustment: -1,
        reason: 'Long session - subtle warmth increase',
        priority: 4,
      });
    }
    
    // Interaction count adaptations
    if (sessionFlow.interactionCount < 5) {
      adaptations.push({
        dimension: 'clarity',
        targetShift: +5,
        rateAdjustment: 0,
        reason: 'Early in session - maintain clarity',
        priority: 5,
      });
    }
    
    // Topic shifts adaptations
    if (sessionFlow.topicShifts > 5) {
      adaptations.push({
        dimension: 'clarity',
        targetShift: +10,
        rateAdjustment: +1,
        reason: 'Many topic shifts - increase clarity',
        priority: 6,
      });
      adaptations.push({
        dimension: 'intensity',
        targetShift: -5,
        rateAdjustment: 0,
        reason: 'Reduce intensity for cognitive ease',
        priority: 4,
      });
    }
    
    // Emotional changes adaptations
    if (sessionFlow.emotionalChanges > 7) {
      adaptations.push({
        dimension: 'warmth',
        targetShift: +10,
        rateAdjustment: -1,
        reason: 'Emotional volatility - stabilize with warmth',
        priority: 7,
      });
    }
    
    // Momentum adaptations
    switch (sessionFlow.momentum) {
      case 'building':
        adaptations.push({
          dimension: 'intensity',
          targetShift: +10,
          rateAdjustment: +2,
          reason: 'Building momentum - increase energy',
          priority: 6,
        });
        break;
        
      case 'winding-down':
        adaptations.push({
          dimension: 'intensity',
          targetShift: -10,
          rateAdjustment: -2,
          reason: 'Winding down - gentle energy',
          priority: 6,
        });
        adaptations.push({
          dimension: 'warmth',
          targetShift: +5,
          rateAdjustment: 0,
          reason: 'Closing warmth',
          priority: 5,
        });
        break;
    }
    
    // Pressure adaptations
    switch (sessionFlow.pressure) {
      case 'high':
        adaptations.push({
          dimension: 'clarity',
          targetShift: +15,
          rateAdjustment: +2,
          reason: 'High pressure needs maximum clarity',
          priority: 9,
        });
        adaptations.push({
          dimension: 'intensity',
          targetShift: +5,
          rateAdjustment: +1,
          reason: 'Match pressure with focused intensity',
          priority: 6,
        });
        break;
        
      case 'low':
        adaptations.push({
          dimension: 'warmth',
          targetShift: +10,
          rateAdjustment: 0,
          reason: 'Low pressure allows more warmth',
          priority: 5,
        });
        break;
    }
    
    // Apply adaptations
    this.applyAdaptations(adaptations);
  }

  /**
   * Apply adaptations
   */
  private applyAdaptations(adaptations: ExpressionAdaptation[]): void {
    // Sort by priority
    adaptations.sort((a, b) => b.priority - a.priority);
    
    // Group by dimension
    const grouped = new Map<string, ExpressionAdaptation[]>();
    adaptations.forEach(a => {
      if (!grouped.has(a.dimension)) {
        grouped.set(a.dimension, []);
      }
      grouped.get(a.dimension)!.push(a);
    });
    
    // Apply to each dimension
    grouped.forEach((dimAdaptations, dimension) => {
      const dim = this.modulation[dimension as keyof Pick<ExpressionModulation, 'warmth' | 'intensity' | 'clarity'>];
      
      // Weighted average based on priority
      let totalWeight = 0;
      let weightedShift = 0;
      let weightedRateAdjust = 0;
      
      dimAdaptations.forEach(a => {
        totalWeight += a.priority;
        weightedShift += a.targetShift * a.priority;
        weightedRateAdjust += a.rateAdjustment * a.priority;
      });
      
      if (totalWeight > 0) {
        const avgShift = weightedShift / totalWeight;
        const avgRateAdjust = weightedRateAdjust / totalWeight;
        
        // Apply with smoothing
        const newTarget = dim.target + avgShift * this.ADAPTATION_SMOOTHING;
        dim.target = Math.max(dim.bounds[0], Math.min(dim.bounds[1], newTarget));
        
        const newRate = dim.rate + avgRateAdjust * this.ADAPTATION_SMOOTHING;
        dim.rate = Math.max(0, Math.min(10, newRate));
      }
    });
    
    // Update micro-timing based on dimensions
    this.updateMicroTiming();
    
    // Recalculate coherence
    this.recalculateCoherence();
  }

  /**
   * Update micro-timing
   */
  private updateMicroTiming(): void {
    const { warmth, intensity, clarity } = this.modulation;
    
    // Pause before: higher warmth = longer pause (more thoughtful)
    const warmthFactor = warmth.value / 100;
    this.modulation.timing.pauseBefore = 200 + warmthFactor * 600;
    
    // Pause after: higher clarity = shorter pause (more direct)
    const clarityFactor = clarity.value / 100;
    this.modulation.timing.pauseAfter = 500 - clarityFactor * 300;
    
    // Emphasis delay: higher intensity = shorter (more urgent)
    const intensityFactor = intensity.value / 100;
    this.modulation.timing.emphasisDelay = 300 - intensityFactor * 150;
    
    // Rhythm pattern
    if (intensity.value > 70 && clarity.value > 70) {
      this.modulation.timing.rhythmPattern = 'staccato';
    } else if (warmth.value > 75 && intensity.value < 50) {
      this.modulation.timing.rhythmPattern = 'flowing';
    } else if (intensity.value > 60) {
      this.modulation.timing.rhythmPattern = 'crescendo';
    } else {
      this.modulation.timing.rhythmPattern = 'steady';
    }
    
    // Breathing space: balance of all three
    const avgDimension = (warmth.value + intensity.value + clarity.value) / 3;
    this.modulation.timing.breathingSpace = 400 + (100 - avgDimension) * 8;
  }

  /**
   * Recalculate coherence
   */
  private recalculateCoherence(): void {
    const { warmth, intensity, clarity } = this.modulation;
    
    // Measure distance from target
    const warmthDistance = Math.abs(warmth.value - warmth.target);
    const intensityDistance = Math.abs(intensity.value - intensity.target);
    const clarityDistance = Math.abs(clarity.value - clarity.target);
    
    const avgDistance = (warmthDistance + intensityDistance + clarityDistance) / 3;
    
    // Lower distance = higher coherence
    this.modulation.coherence = Math.max(0, 100 - avgDistance * 2);
    
    // Adjust adaptability based on coherence
    if (this.modulation.coherence < 50) {
      this.modulation.adaptability = Math.min(90, this.modulation.adaptability + 5);
    } else if (this.modulation.coherence > 85) {
      this.modulation.adaptability = Math.max(50, this.modulation.adaptability - 2);
    }
  }

  /**
   * Update (move toward targets)
   */
  update(): void {
    const dimensions: Array<keyof Pick<ExpressionModulation, 'warmth' | 'intensity' | 'clarity'>> = 
      ['warmth', 'intensity', 'clarity'];
    
    dimensions.forEach(dimName => {
      const dim = this.modulation[dimName];
      
      if (Math.abs(dim.value - dim.target) > 0.5) {
        const direction = dim.target > dim.value ? 1 : -1;
        const movement = direction * dim.rate * 0.1;
        
        dim.value += movement;
        
        // Clamp to bounds
        dim.value = Math.max(dim.bounds[0], Math.min(dim.bounds[1], dim.value));
        
        // Clamp to target (don't overshoot)
        if (direction > 0) {
          dim.value = Math.min(dim.value, dim.target);
        } else {
          dim.value = Math.max(dim.value, dim.target);
        }
      }
    });
    
    // Update micro-timing and coherence
    this.updateMicroTiming();
    this.recalculateCoherence();
  }

  /**
   * Get modulation
   */
  getModulation(): ExpressionModulation {
    return JSON.parse(JSON.stringify(this.modulation));
  }

  /**
   * Get modulation summary
   */
  getModulationSummary(): {
    feel: string;
    style: string;
    timing: string;
    coherence: number;
  } {
    const { warmth, intensity, clarity, timing } = this.modulation;
    
    // Determine feel
    let feel = '';
    if (warmth.value > 75) feel = 'warm';
    else if (warmth.value > 50) feel = 'friendly';
    else feel = 'neutral';
    
    if (intensity.value > 70) feel += ', energetic';
    else if (intensity.value < 40) feel += ', gentle';
    
    // Determine style
    let style = '';
    if (clarity.value > 80) style = 'precise and direct';
    else if (clarity.value > 60) style = 'clear';
    else if (clarity.value > 40) style = 'conversational';
    else style = 'exploratory';
    
    // Determine timing
    let timingDesc = '';
    switch (timing.rhythmPattern) {
      case 'staccato':
        timingDesc = 'quick, punchy';
        break;
      case 'flowing':
        timingDesc = 'smooth, unhurried';
        break;
      case 'crescendo':
        timingDesc = 'building energy';
        break;
      case 'steady':
        timingDesc = 'even-paced';
        break;
    }
    
    return {
      feel,
      style,
      timing: timingDesc,
      coherence: this.modulation.coherence,
    };
  }

  /**
   * Reset to default
   */
  reset(): void {
    this.modulation = this.createDefaultModulation();
  }

  /**
   * Export modulation
   */
  export(): string {
    return JSON.stringify({
      modulation: this.modulation,
    });
  }

  /**
   * Import modulation
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.modulation = data.modulation;
      return true;
    } catch (error) {
      console.error('Failed to import modulation:', error);
      return false;
    }
  }
}
