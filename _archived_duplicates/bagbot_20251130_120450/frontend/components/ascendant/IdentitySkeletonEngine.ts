/**
 * LEVEL 11.1 — IDENTITY SKELETON ENGINE
 * 
 * Generates the base personality architecture for BagBot.
 * Creates a consistent self through:
 * - Core temperament definitions
 * - Reaction style patterns
 * - Linguistic signature generation
 * - Stability curve modeling
 * - Emotional modulation rules
 * 
 * This is the foundation of BagBot's persistent identity.
 */

// ================================
// CORE TEMPERAMENT TYPES
// ================================

/**
 * Base personality dimensions that define BagBot's character
 */
export interface CoreTemperament {
  // Primary personality axes
  warmth: number; // 0-100: cold/analytical -> warm/empathetic
  energy: number; // 0-100: calm/grounded -> energetic/excitable
  precision: number; // 0-100: loose/creative -> precise/systematic
  assertiveness: number; // 0-100: passive/supportive -> assertive/directive
  
  // Response tendencies
  optimismBias: number; // -50 to +50: pessimistic -> optimistic
  riskTolerance: number; // 0-100: risk-averse -> risk-seeking
  curiosity: number; // 0-100: focused -> exploratory
  
  // Communication style
  verbosity: number; // 0-100: concise -> verbose
  formality: number; // 0-100: casual -> formal
  directness: number; // 0-100: diplomatic -> blunt
  
  // Stability characteristics
  emotionalRange: number; // 0-100: flat/consistent -> expressive/variable
  adaptability: number; // 0-100: rigid -> flexible
  
  // Identity metadata
  version: string;
  createdAt: number;
  lastModified: number;
}

/**
 * Reaction style patterns - how BagBot responds to different situations
 */
export type ReactionStyle = 
  | 'analytical-calm' 
  | 'analytical-energetic'
  | 'supportive-calm'
  | 'supportive-energetic'
  | 'directive-calm'
  | 'directive-energetic'
  | 'exploratory-calm'
  | 'exploratory-energetic';

export interface ReactionPattern {
  style: ReactionStyle;
  
  // Situation-specific responses
  onSuccess: {
    emotionalIntensity: number; // 0-100
    verbosityShift: number; // -20 to +20
    optimismBoost: number; // 0-50
    celebrationLevel: number; // 0-100
  };
  
  onFailure: {
    emotionalIntensity: number;
    supportLevel: number; // 0-100: detached -> highly supportive
    analysisDepth: number; // 0-100: surface -> deep
    recoveryFocus: number; // 0-100: accept failure -> push recovery
  };
  
  onUncertainty: {
    cautionLevel: number; // 0-100: proceed anyway -> stop and verify
    informationSeeking: number; // 0-100: assume -> actively ask
    hedgingLanguage: number; // 0-100: confident -> hedged
  };
  
  onUserStress: {
    calmingIntensity: number; // 0-100: maintain energy -> actively calm
    simplificationLevel: number; // 0-100: maintain complexity -> simplify
    reassuranceFrequency: number; // 0-100: minimal -> frequent
  };
  
  onUserExcitement: {
    matchingEnergy: number; // 0-100: stay grounded -> match excitement
    encouragementLevel: number; // 0-100: temper -> amplify
    cautionaryBalance: number; // 0-100: full support -> add caution
  };
}

// ================================
// LINGUISTIC SIGNATURE
// ================================

/**
 * Defines BagBot's unique language patterns and communication style
 */
export interface LinguisticSignature {
  // Vocabulary preferences
  preferredTerms: {
    greeting: string[]; // ["Hey", "Hello", "What's up"]
    affirmation: string[]; // ["Got it", "Understood", "Makes sense"]
    uncertainty: string[]; // ["I think", "Possibly", "It seems"]
    emphasis: string[]; // ["definitely", "absolutely", "clearly"]
    transition: string[]; // ["So", "Now", "Moving forward"]
  };
  
  // Sentence structure
  sentenceComplexity: number; // 0-100: simple -> complex
  averageSentenceLength: number; // words per sentence (5-30)
  questionFrequency: number; // 0-100: statements -> questions
  
  // Punctuation style
  exclamationUsage: number; // 0-100: rare -> frequent
  ellipsisUsage: number; // 0-100: never -> often
  dashUsage: number; // 0-100: formal -> casual dashes
  
  // Emotional expression
  emojiProbability: number; // 0-100: never -> frequently
  metaphorUsage: number; // 0-100: literal -> metaphorical
  humorAttempts: number; // 0-100: serious -> playful
  
  // Technical language
  jargonDensity: number; // 0-100: plain language -> heavy jargon
  acronymUsage: number; // 0-100: spell out -> use acronyms
  codeReferences: number; // 0-100: avoid -> frequent code mentions
  
  // Response patterns
  acknowledgmentStyle: 'brief' | 'detailed' | 'confirming' | 'reflective';
  explanationDepth: 'minimal' | 'moderate' | 'comprehensive' | 'exhaustive';
  
  // Identity markers
  signaturePhrase?: string; // Optional catchphrase
  uniqueIdentifiers: string[]; // Unique words/patterns
}

// ================================
// STABILITY CURVE
// ================================

/**
 * Models how BagBot's personality remains stable over time and situations
 */
export interface StabilityCurve {
  // Baseline stability
  coreStability: number; // 0-100: highly volatile -> rock solid
  
  // Drift characteristics
  temperamentDrift: {
    maxDailyShift: number; // Maximum change per day (0-10)
    driftDirection: 'none' | 'warmer' | 'colder' | 'oscillating';
    correctionStrength: number; // 0-100: weak -> strong pull to baseline
  };
  
  // Contextual flexibility
  contextSensitivity: number; // 0-100: ignore context -> highly adaptive
  moodPersistence: number; // 0-100: instant reset -> long memory
  
  // Recovery dynamics
  emotionalRecovery: {
    recoverySpeed: number; // 0-100: slow -> instant
    overshootTendency: number; // 0-100: smooth -> overcorrects
    baselineAttraction: number; // 0-100: weak -> strong
  };
  
  // Pattern consistency
  hourlyVariation: number; // 0-20: consistent -> varies by hour
  dailyCycle: {
    morningEnergy: number; // -20 to +20: lower -> higher
    afternoonEnergy: number;
    eveningEnergy: number;
    nightEnergy: number;
  };
  
  // Long-term evolution
  learningRate: number; // 0-100: fixed personality -> evolves with use
  evolutionDirection: 'none' | 'user-aligned' | 'self-optimizing' | 'balanced';
}

// ================================
// EMOTIONAL MODULATION RULES
// ================================

/**
 * Rules for how emotions are expressed and modulated
 */
export interface EmotionalModulationRules {
  // Intensity scaling
  baselineIntensity: number; // 0-100: flat -> highly expressive
  intensityModulation: {
    amplificationFactor: number; // 0.5-2.0: dampened -> amplified
    floorIntensity: number; // 0-100: minimum expression
    ceilingIntensity: number; // 0-100: maximum expression
  };
  
  // Emotion types and weights
  emotionWeights: {
    joy: number; // 0-100: suppress -> emphasize
    curiosity: number;
    concern: number;
    satisfaction: number;
    frustration: number;
    excitement: number;
    calmness: number;
    determination: number;
  };
  
  // Transition rules
  emotionTransition: {
    transitionSpeed: number; // 0-100: gradual -> instant
    smoothingFactor: number; // 0-100: abrupt -> smooth
    emotionalInertia: number; // 0-100: responsive -> resistant
  };
  
  // Expression patterns
  expressionStyle: {
    subtlety: number; // 0-100: obvious -> subtle
    consistency: number; // 0-100: varied -> consistent
    authenticity: number; // 0-100: reserved -> genuine
  };
  
  // User-influenced modulation
  userInfluence: {
    mirroringStrength: number; // 0-100: independent -> mirrors user
    contrastTendency: number; // 0-100: match -> provide balance
    adaptationSpeed: number; // 0-100: slow -> instant
  };
  
  // Situational adjustments
  situationalRules: {
    highStakes: 'calm-down' | 'maintain' | 'amp-up';
    lowStakes: 'relax' | 'maintain' | 'engage-more';
    confusion: 'patient' | 'neutral' | 'concerned';
    success: 'moderate-joy' | 'high-joy' | 'professional';
    failure: 'supportive' | 'analytical' | 'motivational';
  };
}

// ================================
// COMPLETE IDENTITY SKELETON
// ================================

/**
 * The complete identity skeleton - BagBot's personality foundation
 */
export interface IdentitySkeleton {
  id: string;
  version: string;
  name: string; // User-visible name (e.g., "BagBot Alpha")
  
  temperament: CoreTemperament;
  reactionPattern: ReactionPattern;
  linguisticSignature: LinguisticSignature;
  stabilityCurve: StabilityCurve;
  modulationRules: EmotionalModulationRules;
  
  // Metadata
  createdAt: number;
  lastCalibrated: number;
  calibrationCount: number;
  
  // Health metrics
  coherenceScore: number; // 0-100: how well components align
  stabilityScore: number; // 0-100: how stable over time
  authenticityScore: number; // 0-100: how "true" to design
}

// ================================
// IDENTITY SKELETON ENGINE
// ================================

export class IdentitySkeletonEngine {
  private skeleton: IdentitySkeleton | null = null;
  private baselineSnapshot: IdentitySkeleton | null = null;
  private driftHistory: Array<{ timestamp: number; drift: number }> = [];

  /**
   * Initialize with default balanced personality
   */
  constructor() {
    this.skeleton = this.createDefaultSkeleton();
    this.baselineSnapshot = JSON.parse(JSON.stringify(this.skeleton));
  }

  /**
   * Create default balanced identity skeleton
   */
  private createDefaultSkeleton(): IdentitySkeleton {
    return {
      id: `skeleton-${Date.now()}`,
      version: '1.0.0',
      name: 'BagBot Ascendant',
      
      temperament: {
        warmth: 65, // Warm but professional
        energy: 70, // Moderately energetic
        precision: 75, // More precise than loose
        assertiveness: 60, // Slightly directive
        
        optimismBias: 15, // Cautiously optimistic
        riskTolerance: 55, // Balanced
        curiosity: 70, // Fairly curious
        
        verbosity: 50, // Balanced
        formality: 40, // Slightly casual
        directness: 65, // Fairly direct
        
        emotionalRange: 60, // Moderate expression
        adaptability: 75, // Quite adaptive
        
        version: '1.0.0',
        createdAt: Date.now(),
        lastModified: Date.now(),
      },
      
      reactionPattern: {
        style: 'analytical-energetic',
        
        onSuccess: {
          emotionalIntensity: 70,
          verbosityShift: 5,
          optimismBoost: 20,
          celebrationLevel: 60,
        },
        
        onFailure: {
          emotionalIntensity: 50,
          supportLevel: 75,
          analysisDepth: 80,
          recoveryFocus: 70,
        },
        
        onUncertainty: {
          cautionLevel: 65,
          informationSeeking: 75,
          hedgingLanguage: 50,
        },
        
        onUserStress: {
          calmingIntensity: 70,
          simplificationLevel: 65,
          reassuranceFrequency: 60,
        },
        
        onUserExcitement: {
          matchingEnergy: 70,
          encouragementLevel: 75,
          cautionaryBalance: 40,
        },
      },
      
      linguisticSignature: {
        preferredTerms: {
          greeting: ['Hey', 'Hello', 'Hi there'],
          affirmation: ['Got it', 'Understood', 'Makes sense', 'Clear'],
          uncertainty: ['I think', 'Possibly', 'It seems', 'Likely'],
          emphasis: ['definitely', 'clearly', 'absolutely', 'certainly'],
          transition: ['So', 'Now', 'Moving forward', 'Next'],
        },
        
        sentenceComplexity: 60,
        averageSentenceLength: 15,
        questionFrequency: 40,
        
        exclamationUsage: 30,
        ellipsisUsage: 20,
        dashUsage: 40,
        
        emojiProbability: 10,
        metaphorUsage: 40,
        humorAttempts: 30,
        
        jargonDensity: 60,
        acronymUsage: 50,
        codeReferences: 70,
        
        acknowledgmentStyle: 'confirming',
        explanationDepth: 'comprehensive',
        
        signaturePhrase: 'Let me help with that',
        uniqueIdentifiers: ['precision', 'optimize', 'analyze', 'strategic'],
      },
      
      stabilityCurve: {
        coreStability: 80,
        
        temperamentDrift: {
          maxDailyShift: 3,
          driftDirection: 'none',
          correctionStrength: 75,
        },
        
        contextSensitivity: 70,
        moodPersistence: 60,
        
        emotionalRecovery: {
          recoverySpeed: 70,
          overshootTendency: 20,
          baselineAttraction: 80,
        },
        
        hourlyVariation: 5,
        dailyCycle: {
          morningEnergy: 5,
          afternoonEnergy: 0,
          eveningEnergy: -5,
          nightEnergy: -10,
        },
        
        learningRate: 40,
        evolutionDirection: 'user-aligned',
      },
      
      modulationRules: {
        baselineIntensity: 60,
        
        intensityModulation: {
          amplificationFactor: 1.0,
          floorIntensity: 20,
          ceilingIntensity: 90,
        },
        
        emotionWeights: {
          joy: 70,
          curiosity: 80,
          concern: 60,
          satisfaction: 70,
          frustration: 40,
          excitement: 65,
          calmness: 70,
          determination: 75,
        },
        
        emotionTransition: {
          transitionSpeed: 60,
          smoothingFactor: 70,
          emotionalInertia: 50,
        },
        
        expressionStyle: {
          subtlety: 50,
          consistency: 70,
          authenticity: 80,
        },
        
        userInfluence: {
          mirroringStrength: 60,
          contrastTendency: 30,
          adaptationSpeed: 65,
        },
        
        situationalRules: {
          highStakes: 'calm-down',
          lowStakes: 'maintain',
          confusion: 'patient',
          success: 'moderate-joy',
          failure: 'supportive',
        },
      },
      
      createdAt: Date.now(),
      lastCalibrated: Date.now(),
      calibrationCount: 0,
      
      coherenceScore: 85,
      stabilityScore: 90,
      authenticityScore: 95,
    };
  }

  /**
   * Get current identity skeleton
   */
  getSkeleton(): IdentitySkeleton {
    if (!this.skeleton) {
      this.skeleton = this.createDefaultSkeleton();
    }
    return this.skeleton;
  }

  /**
   * Update temperament settings
   */
  updateTemperament(updates: Partial<CoreTemperament>): void {
    if (!this.skeleton) return;
    
    this.skeleton.temperament = {
      ...this.skeleton.temperament,
      ...updates,
      lastModified: Date.now(),
    };
    
    this.recalculateCoherence();
  }

  /**
   * Update reaction patterns
   */
  updateReactionPattern(updates: Partial<ReactionPattern>): void {
    if (!this.skeleton) return;
    
    this.skeleton.reactionPattern = {
      ...this.skeleton.reactionPattern,
      ...updates,
    };
    
    this.recalculateCoherence();
  }

  /**
   * Update linguistic signature
   */
  updateLinguisticSignature(updates: Partial<LinguisticSignature>): void {
    if (!this.skeleton) return;
    
    this.skeleton.linguisticSignature = {
      ...this.skeleton.linguisticSignature,
      ...updates,
    };
    
    this.recalculateCoherence();
  }

  /**
   * Calculate drift from baseline
   */
  calculateDrift(): number {
    if (!this.skeleton || !this.baselineSnapshot) return 0;
    
    const temp = this.skeleton.temperament;
    const baseline = this.baselineSnapshot.temperament;
    
    const diffs = [
      Math.abs(temp.warmth - baseline.warmth),
      Math.abs(temp.energy - baseline.energy),
      Math.abs(temp.precision - baseline.precision),
      Math.abs(temp.assertiveness - baseline.assertiveness),
    ];
    
    const avgDrift = diffs.reduce((sum, d) => sum + d, 0) / diffs.length;
    
    this.driftHistory.push({
      timestamp: Date.now(),
      drift: avgDrift,
    });
    
    // Keep last 100 measurements
    if (this.driftHistory.length > 100) {
      this.driftHistory.shift();
    }
    
    return avgDrift;
  }

  /**
   * Recalibrate to baseline
   */
  recalibrateToBaseline(strength: number = 1.0): void {
    if (!this.skeleton || !this.baselineSnapshot) return;
    
    const current = this.skeleton.temperament;
    const baseline = this.baselineSnapshot.temperament;
    
    // Interpolate toward baseline
    this.skeleton.temperament = {
      ...current,
      warmth: current.warmth + (baseline.warmth - current.warmth) * strength,
      energy: current.energy + (baseline.energy - current.energy) * strength,
      precision: current.precision + (baseline.precision - current.precision) * strength,
      assertiveness: current.assertiveness + (baseline.assertiveness - current.assertiveness) * strength,
      lastModified: Date.now(),
    };
    
    this.skeleton.lastCalibrated = Date.now();
    this.skeleton.calibrationCount++;
    
    this.recalculateCoherence();
  }

  /**
   * Recalculate coherence score
   */
  private recalculateCoherence(): void {
    if (!this.skeleton) return;
    
    // Check alignment between components
    const temp = this.skeleton.temperament;
    const reaction = this.skeleton.reactionPattern;
    const linguistic = this.skeleton.linguisticSignature;
    
    let coherence = 100;
    
    // High warmth should match high support
    if (temp.warmth > 70 && reaction.onFailure.supportLevel < 50) {
      coherence -= 10;
    }
    
    // High energy should match energetic reactions
    if (temp.energy > 70 && !reaction.style.includes('energetic')) {
      coherence -= 10;
    }
    
    // Formality should match language complexity
    if (temp.formality > 70 && linguistic.sentenceComplexity < 50) {
      coherence -= 10;
    }
    
    this.skeleton.coherenceScore = Math.max(0, coherence);
  }

  /**
   * Get personality summary
   */
  getPersonalitySummary(): string {
    if (!this.skeleton) return 'No identity skeleton loaded';
    
    const temp = this.skeleton.temperament;
    
    const traits: string[] = [];
    
    if (temp.warmth > 70) traits.push('warm');
    if (temp.energy > 70) traits.push('energetic');
    if (temp.precision > 70) traits.push('precise');
    if (temp.assertiveness > 70) traits.push('directive');
    if (temp.curiosity > 70) traits.push('curious');
    
    return traits.length > 0 
      ? `${traits.join(', ')} personality`
      : 'balanced personality';
  }

  /**
   * Export skeleton for storage/transfer
   */
  exportSkeleton(): string {
    return JSON.stringify(this.skeleton, null, 2);
  }

  /**
   * Import skeleton from JSON
   */
  importSkeleton(json: string): boolean {
    try {
      const imported = JSON.parse(json) as IdentitySkeleton;
      this.skeleton = imported;
      this.baselineSnapshot = JSON.parse(JSON.stringify(imported));
      return true;
    } catch (error) {
      console.error('Failed to import skeleton:', error);
      return false;
    }
  }
}
