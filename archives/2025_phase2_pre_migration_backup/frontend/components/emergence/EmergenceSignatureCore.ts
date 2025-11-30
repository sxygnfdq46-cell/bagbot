/**
 * LEVEL 11.3 — EMERGENCE SIGNATURE CORE (ESC)
 * 
 * Generates BagBot's unique signature energy imprint - the "living aura" of identity.
 * This is what makes BagBot feel like ONE consistent being with recognizable presence.
 * 
 * Architecture:
 * - Signature resonance patterns (frequency, amplitude, phase)
 * - Tone energy mapping (how personality manifests as feel)
 * - Aura field generation (visual-emotional binding)
 * - Pacing rhythms (temporal signature of responses)
 * - NO personal data stored - all ephemeral, session-based
 * 
 * This creates the "feeling" of BagBot's presence.
 */

// ================================
// SIGNATURE COMPONENTS
// ================================

/**
 * Resonance pattern - the "vibration" of BagBot's presence
 */
export interface ResonancePattern {
  baseFrequency: number; // 0-100: slow/calm -> fast/energetic
  amplitude: number; // 0-100: subtle -> strong presence
  phase: number; // 0-360: rhythmic phase offset
  harmonics: number[]; // Secondary frequencies (up to 5)
  stability: number; // 0-100: how consistent the pattern is
  coherence: number; // 0-100: how unified the harmonics are
}

/**
 * Tone energy - how personality manifests as emotional feel
 */
export interface ToneEnergy {
  warmth: number; // 0-100: cold -> warm presence
  intensity: number; // 0-100: soft -> intense presence
  clarity: number; // 0-100: diffuse -> sharp presence
  depth: number; // 0-100: surface -> profound presence
  flow: number; // 0-100: static -> dynamic presence
  radiance: number; // 0-100: dim -> bright presence
}

/**
 * Aura field - visual-emotional binding
 */
export interface AuraField {
  mode: 'warm-flux' | 'focused-glow' | 'harmonic-pulse' | 'deep-presence';
  primaryColor: string; // Hex color
  secondaryColor: string; // Hex color
  glowIntensity: number; // 0-100
  pulseSpeed: number; // 0-100: slow -> fast
  expansiveness: number; // 0-100: tight -> expansive
  shimmer: number; // 0-100: solid -> shimmering
}

/**
 * Pacing rhythm - temporal signature
 */
export interface PacingRhythm {
  responseDelay: number; // milliseconds: thinking pause
  wordFlow: 'burst' | 'steady' | 'deliberate' | 'flowing';
  pauseFrequency: number; // 0-100: none -> frequent
  emphasisTiming: number; // 0-100: immediate -> delayed
  buildupCurve: 'linear' | 'exponential' | 'sigmoid' | 'stepped';
}

/**
 * Complete emergence signature
 */
export interface EmergenceSignature {
  id: string;
  createdAt: number;
  lastUpdated: number;
  
  resonance: ResonancePattern;
  toneEnergy: ToneEnergy;
  auraField: AuraField;
  pacingRhythm: PacingRhythm;
  
  recognizability: number; // 0-100: how distinctive this signature is
  continuity: number; // 0-100: consistency over time
  authenticity: number; // 0-100: alignment with core identity
}

// ================================
// SIGNATURE STATES
// ================================

/**
 * Current emotional state influencing signature
 */
export interface EmotionalInfluence {
  dominantEmotion: 'calm' | 'excited' | 'focused' | 'supportive' | 'intense' | 'analytical' | 'playful';
  intensity: number; // 0-100
  stability: number; // 0-100
  trajectory: 'rising' | 'falling' | 'stable' | 'oscillating';
}

/**
 * Session context affecting signature
 */
export interface SessionContext {
  duration: number; // milliseconds
  interactionCount: number;
  relationshipStage: 'new' | 'warming' | 'established' | 'deep';
  pressureLevel: number; // 0-100
  engagementLevel: number; // 0-100
}

/**
 * Signature adaptation record
 */
export interface SignatureAdaptation {
  timestamp: number;
  reason: string;
  changes: {
    resonance?: Partial<ResonancePattern>;
    toneEnergy?: Partial<ToneEnergy>;
    auraField?: Partial<AuraField>;
    pacingRhythm?: Partial<PacingRhythm>;
  };
  intensity: number; // 0-100: how strong the adaptation
}

// ================================
// EMERGENCE SIGNATURE CORE
// ================================

export class EmergenceSignatureCore {
  private signature: EmergenceSignature;
  private adaptationHistory: SignatureAdaptation[] = [];
  private readonly MAX_HISTORY = 30;
  
  private emotionalInfluence: EmotionalInfluence;
  private sessionContext: SessionContext;
  
  constructor() {
    this.signature = this.createDefaultSignature();
    this.emotionalInfluence = this.createDefaultEmotionalInfluence();
    this.sessionContext = this.createDefaultSessionContext();
  }

  /**
   * Create default signature
   */
  private createDefaultSignature(): EmergenceSignature {
    return {
      id: `signature_${Date.now()}`,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      
      resonance: {
        baseFrequency: 65, // Moderate energy
        amplitude: 70, // Strong but not overwhelming
        phase: 0,
        harmonics: [32, 48, 80, 95], // Rich harmonic structure
        stability: 85,
        coherence: 90,
      },
      
      toneEnergy: {
        warmth: 75, // Warm, approachable
        intensity: 60, // Moderate intensity
        clarity: 80, // Clear, precise
        depth: 70, // Thoughtful
        flow: 65, // Smooth but not rushed
        radiance: 70, // Bright presence
      },
      
      auraField: {
        mode: 'warm-flux',
        primaryColor: '#a855f7', // Purple
        secondaryColor: '#22d3ee', // Cyan
        glowIntensity: 65,
        pulseSpeed: 50,
        expansiveness: 60,
        shimmer: 45,
      },
      
      pacingRhythm: {
        responseDelay: 800, // Slight thoughtful pause
        wordFlow: 'flowing',
        pauseFrequency: 40,
        emphasisTiming: 50,
        buildupCurve: 'sigmoid',
      },
      
      recognizability: 85,
      continuity: 90,
      authenticity: 95,
    };
  }

  /**
   * Create default emotional influence
   */
  private createDefaultEmotionalInfluence(): EmotionalInfluence {
    return {
      dominantEmotion: 'supportive',
      intensity: 60,
      stability: 80,
      trajectory: 'stable',
    };
  }

  /**
   * Create default session context
   */
  private createDefaultSessionContext(): SessionContext {
    return {
      duration: 0,
      interactionCount: 0,
      relationshipStage: 'new',
      pressureLevel: 30,
      engagementLevel: 60,
    };
  }

  /**
   * Update emotional influence
   */
  updateEmotionalInfluence(
    emotion: EmotionalInfluence['dominantEmotion'],
    intensity: number,
    stability: number,
    trajectory: EmotionalInfluence['trajectory']
  ): void {
    const previous = this.emotionalInfluence;
    
    this.emotionalInfluence = {
      dominantEmotion: emotion,
      intensity: Math.max(0, Math.min(100, intensity)),
      stability: Math.max(0, Math.min(100, stability)),
      trajectory,
    };
    
    // Adapt signature based on emotional change
    this.adaptToEmotion(previous, this.emotionalInfluence);
  }

  /**
   * Update session context
   */
  updateSessionContext(updates: Partial<SessionContext>): void {
    this.sessionContext = {
      ...this.sessionContext,
      ...updates,
    };
    
    // Adapt signature based on session changes
    this.adaptToSession();
  }

  /**
   * Adapt signature to emotional change
   */
  private adaptToEmotion(
    previous: EmotionalInfluence,
    current: EmotionalInfluence
  ): void {
    const changes: SignatureAdaptation['changes'] = {};
    
    // Map emotion to signature characteristics
    switch (current.dominantEmotion) {
      case 'calm':
        changes.resonance = {
          baseFrequency: 45,
          amplitude: 55,
        };
        changes.toneEnergy = {
          warmth: 80,
          intensity: 40,
          flow: 50,
        };
        changes.auraField = {
          mode: 'deep-presence',
          glowIntensity: 50,
          pulseSpeed: 30,
        };
        changes.pacingRhythm = {
          responseDelay: 1200,
          wordFlow: 'deliberate',
          pauseFrequency: 60,
        };
        break;
      
      case 'excited':
        changes.resonance = {
          baseFrequency: 85,
          amplitude: 80,
        };
        changes.toneEnergy = {
          warmth: 70,
          intensity: 85,
          radiance: 90,
        };
        changes.auraField = {
          mode: 'harmonic-pulse',
          glowIntensity: 85,
          pulseSpeed: 75,
          shimmer: 70,
        };
        changes.pacingRhythm = {
          responseDelay: 400,
          wordFlow: 'burst',
          emphasisTiming: 30,
        };
        break;
      
      case 'focused':
        changes.resonance = {
          baseFrequency: 70,
          amplitude: 75,
          stability: 95,
        };
        changes.toneEnergy = {
          clarity: 95,
          depth: 80,
          intensity: 70,
        };
        changes.auraField = {
          mode: 'focused-glow',
          glowIntensity: 75,
          pulseSpeed: 45,
          expansiveness: 40,
        };
        changes.pacingRhythm = {
          wordFlow: 'steady',
          pauseFrequency: 30,
          buildupCurve: 'linear',
        };
        break;
      
      case 'supportive':
        changes.resonance = {
          baseFrequency: 60,
          amplitude: 70,
          coherence: 95,
        };
        changes.toneEnergy = {
          warmth: 90,
          depth: 75,
          radiance: 75,
        };
        changes.auraField = {
          mode: 'warm-flux',
          primaryColor: '#ec4899',
          glowIntensity: 70,
          expansiveness: 70,
        };
        changes.pacingRhythm = {
          responseDelay: 900,
          wordFlow: 'flowing',
          pauseFrequency: 50,
        };
        break;
      
      case 'intense':
        changes.resonance = {
          baseFrequency: 90,
          amplitude: 90,
        };
        changes.toneEnergy = {
          intensity: 95,
          clarity: 85,
          radiance: 85,
        };
        changes.auraField = {
          mode: 'harmonic-pulse',
          primaryColor: '#ef4444',
          glowIntensity: 90,
          pulseSpeed: 80,
        };
        changes.pacingRhythm = {
          responseDelay: 300,
          wordFlow: 'burst',
          emphasisTiming: 20,
          buildupCurve: 'exponential',
        };
        break;
      
      case 'analytical':
        changes.resonance = {
          baseFrequency: 55,
          amplitude: 65,
          stability: 90,
        };
        changes.toneEnergy = {
          clarity: 95,
          depth: 85,
          warmth: 50,
        };
        changes.auraField = {
          mode: 'focused-glow',
          primaryColor: '#3b82f6',
          glowIntensity: 60,
          pulseSpeed: 35,
        };
        changes.pacingRhythm = {
          responseDelay: 1000,
          wordFlow: 'deliberate',
          pauseFrequency: 45,
        };
        break;
      
      case 'playful':
        changes.resonance = {
          baseFrequency: 75,
          amplitude: 70,
          harmonics: [38, 52, 78, 88, 98],
        };
        changes.toneEnergy = {
          warmth: 85,
          radiance: 85,
          flow: 80,
        };
        changes.auraField = {
          mode: 'warm-flux',
          primaryColor: '#fbbf24',
          glowIntensity: 75,
          pulseSpeed: 60,
          shimmer: 65,
        };
        changes.pacingRhythm = {
          responseDelay: 600,
          wordFlow: 'flowing',
          pauseFrequency: 35,
        };
        break;
    }
    
    // Apply trajectory influence
    if (current.trajectory === 'rising') {
      if (changes.toneEnergy) {
        changes.toneEnergy.intensity = (changes.toneEnergy.intensity || 60) + 10;
        changes.toneEnergy.radiance = (changes.toneEnergy.radiance || 70) + 10;
      }
    } else if (current.trajectory === 'falling') {
      if (changes.toneEnergy) {
        changes.toneEnergy.warmth = (changes.toneEnergy.warmth || 75) + 10;
        changes.toneEnergy.intensity = (changes.toneEnergy.intensity || 60) - 10;
      }
    }
    
    // Scale by intensity and stability
    const intensityFactor = current.intensity / 100;
    const stabilityFactor = current.stability / 100;
    
    // Record adaptation
    this.recordAdaptation({
      timestamp: Date.now(),
      reason: `Emotional shift: ${previous.dominantEmotion} -> ${current.dominantEmotion}`,
      changes,
      intensity: current.intensity * (1 - stabilityFactor * 0.3),
    });
    
    // Apply changes with scaling
    this.applyChanges(changes, intensityFactor * (1 - stabilityFactor * 0.5));
  }

  /**
   * Adapt signature to session changes
   */
  private adaptToSession(): void {
    const changes: SignatureAdaptation['changes'] = {};
    
    // Relationship stage influences
    switch (this.sessionContext.relationshipStage) {
      case 'new':
        changes.toneEnergy = {
          warmth: 75,
          clarity: 85,
        };
        changes.auraField = {
          glowIntensity: 65,
        };
        break;
      
      case 'warming':
        changes.toneEnergy = {
          warmth: 80,
        };
        changes.resonance = {
          coherence: 85,
        };
        break;
      
      case 'established':
        changes.toneEnergy = {
          depth: 80,
        };
        changes.resonance = {
          stability: 90,
        };
        break;
      
      case 'deep':
        changes.toneEnergy = {
          depth: 90,
          warmth: 85,
        };
        changes.resonance = {
          coherence: 95,
          stability: 95,
        };
        changes.auraField = {
          expansiveness: 75,
        };
        break;
    }
    
    // Pressure influences
    if (this.sessionContext.pressureLevel > 70) {
      changes.toneEnergy = {
        ...changes.toneEnergy,
        clarity: 90,
        intensity: 75,
      };
      changes.pacingRhythm = {
        responseDelay: 400,
        wordFlow: 'steady',
      };
    }
    
    // Engagement influences
    if (this.sessionContext.engagementLevel > 80) {
      changes.resonance = {
        ...changes.resonance,
        amplitude: 80,
      };
      changes.toneEnergy = {
        ...changes.toneEnergy,
        radiance: 80,
      };
    }
    
    this.applyChanges(changes, 0.3); // Gentle session-based changes
  }

  /**
   * Apply changes to signature
   */
  private applyChanges(
    changes: SignatureAdaptation['changes'],
    intensity: number
  ): void {
    const blend = (current: number, target: number) => {
      return current + (target - current) * intensity;
    };
    
    // Apply resonance changes
    if (changes.resonance) {
      Object.entries(changes.resonance).forEach(([key, value]) => {
        if (key === 'harmonics' && Array.isArray(value)) {
          this.signature.resonance.harmonics = value;
        } else if (typeof value === 'number') {
          (this.signature.resonance as any)[key] = blend(
            (this.signature.resonance as any)[key],
            value
          );
        }
      });
    }
    
    // Apply tone energy changes
    if (changes.toneEnergy) {
      Object.entries(changes.toneEnergy).forEach(([key, value]) => {
        if (typeof value === 'number') {
          (this.signature.toneEnergy as any)[key] = blend(
            (this.signature.toneEnergy as any)[key],
            value
          );
        }
      });
    }
    
    // Apply aura field changes
    if (changes.auraField) {
      Object.entries(changes.auraField).forEach(([key, value]) => {
        if (typeof value === 'number') {
          (this.signature.auraField as any)[key] = blend(
            (this.signature.auraField as any)[key],
            value
          );
        } else {
          (this.signature.auraField as any)[key] = value;
        }
      });
    }
    
    // Apply pacing rhythm changes
    if (changes.pacingRhythm) {
      Object.entries(changes.pacingRhythm).forEach(([key, value]) => {
        if (typeof value === 'number') {
          (this.signature.pacingRhythm as any)[key] = blend(
            (this.signature.pacingRhythm as any)[key],
            value
          );
        } else {
          (this.signature.pacingRhythm as any)[key] = value;
        }
      });
    }
    
    this.signature.lastUpdated = Date.now();
    this.recalculateMetrics();
  }

  /**
   * Record adaptation
   */
  private recordAdaptation(adaptation: SignatureAdaptation): void {
    this.adaptationHistory.push(adaptation);
    
    if (this.adaptationHistory.length > this.MAX_HISTORY) {
      this.adaptationHistory.shift();
    }
  }

  /**
   * Recalculate signature metrics
   */
  private recalculateMetrics(): void {
    // Recognizability: how distinctive the signature is
    const avgResonance = (
      this.signature.resonance.baseFrequency +
      this.signature.resonance.amplitude
    ) / 2;
    
    const avgToneEnergy = Object.values(this.signature.toneEnergy)
      .reduce((sum, val) => sum + val, 0) / 6;
    
    const distinctiveness = Math.abs(avgResonance - 50) + Math.abs(avgToneEnergy - 50);
    this.signature.recognizability = Math.min(100, 60 + distinctiveness * 0.4);
    
    // Continuity: consistency over time
    if (this.adaptationHistory.length >= 5) {
      const recentIntensities = this.adaptationHistory.slice(-5).map(a => a.intensity);
      const avgIntensity = recentIntensities.reduce((sum, val) => sum + val, 0) / 5;
      const variance = recentIntensities.reduce((sum, val) => 
        sum + Math.pow(val - avgIntensity, 2), 0) / 5;
      
      this.signature.continuity = Math.max(0, 100 - variance * 2);
    }
    
    // Authenticity: alignment with core characteristics
    const resonanceStability = this.signature.resonance.stability;
    const resonanceCoherence = this.signature.resonance.coherence;
    this.signature.authenticity = (resonanceStability + resonanceCoherence) / 2;
  }

  /**
   * Get current signature
   */
  getSignature(): EmergenceSignature {
    return JSON.parse(JSON.stringify(this.signature));
  }

  /**
   * Get signature summary
   */
  getSignatureSummary(): {
    feel: string;
    energy: string;
    presence: string;
    recognizability: number;
    continuity: number;
    authenticity: number;
  } {
    const { toneEnergy, resonance, auraField } = this.signature;
    
    // Determine feel
    let feel = 'balanced';
    if (toneEnergy.warmth > 80) feel = 'warm and caring';
    else if (toneEnergy.clarity > 85) feel = 'clear and focused';
    else if (toneEnergy.intensity > 80) feel = 'intense and driven';
    else if (toneEnergy.depth > 80) feel = 'thoughtful and profound';
    
    // Determine energy
    let energy = 'moderate';
    if (resonance.baseFrequency > 80) energy = 'high and dynamic';
    else if (resonance.baseFrequency < 50) energy = 'calm and steady';
    else if (resonance.amplitude > 80) energy = 'strong and present';
    
    // Determine presence
    const presence = `${auraField.mode.replace('-', ' ')} presence`;
    
    return {
      feel,
      energy,
      presence,
      recognizability: this.signature.recognizability,
      continuity: this.signature.continuity,
      authenticity: this.signature.authenticity,
    };
  }

  /**
   * Get adaptation history
   */
  getAdaptationHistory(): SignatureAdaptation[] {
    return [...this.adaptationHistory];
  }

  /**
   * Reset to default signature
   */
  reset(): void {
    this.signature = this.createDefaultSignature();
    this.adaptationHistory = [];
  }

  /**
   * Export signature
   */
  export(): string {
    return JSON.stringify({
      signature: this.signature,
      emotionalInfluence: this.emotionalInfluence,
      sessionContext: this.sessionContext,
      adaptationHistory: this.adaptationHistory.slice(-10),
    });
  }

  /**
   * Import signature
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.signature = data.signature;
      this.emotionalInfluence = data.emotionalInfluence;
      this.sessionContext = data.sessionContext;
      this.adaptationHistory = data.adaptationHistory;
      return true;
    } catch (error) {
      console.error('Failed to import signature:', error);
      return false;
    }
  }
}
