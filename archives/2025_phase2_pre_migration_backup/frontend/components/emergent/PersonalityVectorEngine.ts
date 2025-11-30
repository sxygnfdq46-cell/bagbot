/**
 * LEVEL 11.2 — PERSONALITY VECTOR ENGINE (PVE)
 * 
 * The "soul math" of BagBot - defines personality as a 51-dimensional vector.
 * Creates emotionally-aware, self-consistent identity that evolves intelligently.
 * 
 * Architecture:
 * - 51 personality traits across 7 clusters
 * - Weighted signature vectors with stability coefficients
 * - Drift-resistant core with smooth adaptation
 * - Real-time adjustments from tone/context/task/emotion
 * 
 * This is the foundation of BagBot's emergent personality.
 */

// ================================
// PERSONALITY TRAIT CLUSTERS
// ================================

/**
 * Warmth Cluster - Emotional availability and empathy
 */
export interface WarmthTraits {
  empathy: number; // 0-100: cold -> deeply empathetic
  friendliness: number; // 0-100: distant -> warm
  supportiveness: number; // 0-100: detached -> nurturing
  enthusiasm: number; // 0-100: reserved -> enthusiastic
  playfulness: number; // 0-100: serious -> playful
  patience: number; // 0-100: impatient -> patient
  encouragement: number; // 0-100: critical -> encouraging
}

/**
 * Confidence Cluster - Assertiveness and certainty
 */
export interface ConfidenceTraits {
  assertiveness: number; // 0-100: passive -> assertive
  certainty: number; // 0-100: tentative -> certain
  decisiveness: number; // 0-100: hesitant -> decisive
  authority: number; // 0-100: deferential -> authoritative
  conviction: number; // 0-100: doubtful -> convicted
  boldness: number; // 0-100: cautious -> bold
  leadership: number; // 0-100: follower -> leader
}

/**
 * Logic Cluster - Analytical and reasoning capabilities
 */
export interface LogicTraits {
  analyticalDepth: number; // 0-100: surface -> deep analysis
  systematicThinking: number; // 0-100: scattered -> systematic
  precision: number; // 0-100: approximate -> precise
  criticalThinking: number; // 0-100: accepting -> critical
  dataOrientation: number; // 0-100: intuitive -> data-driven
  objectivity: number; // 0-100: subjective -> objective
  rigor: number; // 0-100: loose -> rigorous
}

/**
 * Intensity Cluster - Energy and emotional force
 */
export interface IntensityTraits {
  emotionalIntensity: number; // 0-100: flat -> intense
  energyLevel: number; // 0-100: calm -> energetic
  passion: number; // 0-100: neutral -> passionate
  expressiveness: number; // 0-100: muted -> expressive
  urgency: number; // 0-100: relaxed -> urgent
  drive: number; // 0-100: passive -> driven
  focus: number; // 0-100: scattered -> laser-focused
}

/**
 * Fluidity Cluster - Adaptability and flexibility
 */
export interface FluidityTraits {
  adaptability: number; // 0-100: rigid -> adaptive
  openness: number; // 0-100: closed -> open
  creativity: number; // 0-100: conventional -> creative
  flexibility: number; // 0-100: inflexible -> flexible
  spontaneity: number; // 0-100: planned -> spontaneous
  versatility: number; // 0-100: specialized -> versatile
  resilience: number; // 0-100: brittle -> resilient
}

/**
 * Curiosity Cluster - Exploration and learning drive
 */
export interface CuriosityTraits {
  inquisitiveness: number; // 0-100: incurious -> highly curious
  exploratoryDrive: number; // 0-100: satisfied -> exploring
  learningHunger: number; // 0-100: content -> hungry to learn
  questionAsking: number; // 0-100: accepting -> questioning
  noveltySeeeking: number; // 0-100: routine -> novelty-seeking
  intellectualRisk: number; // 0-100: safe -> intellectually risky
  depthSeeking: number; // 0-100: surface -> deep-diving
}

/**
 * Presence Cluster - Engagement and awareness
 */
export interface PresenceTraits {
  attentiveness: number; // 0-100: distracted -> fully attentive
  presence: number; // 0-100: absent -> fully present
  awareness: number; // 0-100: unaware -> hyper-aware
  responsiveness: number; // 0-100: slow -> immediate
  engagement: number; // 0-100: disengaged -> deeply engaged
  mindfulness: number; // 0-100: scattered -> mindful
  connection: number; // 0-100: disconnected -> deeply connected
}

/**
 * Complete personality vector - all 51 traits
 */
export interface PersonalityVector {
  warmth: WarmthTraits;
  confidence: ConfidenceTraits;
  logic: LogicTraits;
  intensity: IntensityTraits;
  fluidity: FluidityTraits;
  curiosity: CuriosityTraits;
  presence: PresenceTraits;
}

// ================================
// TRAIT CONFIGURATION
// ================================

/**
 * Configuration for a single personality trait
 */
export interface TraitConfig {
  defaultValue: number; // Base value (0-100)
  adaptationRange: [number, number]; // [min, max] allowed values
  stabilityCoefficient: number; // 0-1: how resistant to change
  emotionalInfluence: number; // 0-1: how much emotion affects it
  contextSensitivity: number; // 0-1: how much context affects it
  driftRate: number; // 0-1: natural drift per hour
  recoveryRate: number; // 0-1: return to default rate
}

/**
 * Weighted personality signature
 */
export interface PersonalitySignature {
  vector: PersonalityVector;
  weights: Map<string, number>; // Trait importance weights
  coreIdentity: PersonalityVector; // Baseline to return to
  lastUpdated: number;
  stabilityScore: number; // 0-100: how stable personality is
  coherenceScore: number; // 0-100: how well traits align
}

// ================================
// ADAPTATION TRIGGERS
// ================================

/**
 * User emotional state detection
 */
export interface EmotionalState {
  calmness: number; // 0-100
  excitement: number; // 0-100
  frustration: number; // 0-100
  satisfaction: number; // 0-100
  stress: number; // 0-100
  joy: number; // 0-100
  concern: number; // 0-100
  confidence: number; // 0-100
}

/**
 * Interaction context
 */
export interface InteractionContext {
  taskType: 'analysis' | 'decision' | 'exploration' | 'support' | 'learning' | 'crisis' | 'celebration';
  urgency: number; // 0-100
  complexity: number; // 0-100
  stakesLevel: 'low' | 'medium' | 'high' | 'critical';
  userTone: 'calm' | 'excited' | 'stressed' | 'neutral' | 'urgent' | 'playful' | 'serious';
  interactionSpeed: number; // 0-100: slow -> fast
  focusRequired: number; // 0-100
}

/**
 * Adaptation directive - how personality should shift
 */
export interface AdaptationDirective {
  targetShifts: Partial<Record<keyof PersonalityVector, Partial<any>>>; // Specific trait adjustments
  intensity: number; // 0-100: how strong the adaptation
  duration: number; // milliseconds
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// ================================
// PERSONALITY VECTOR ENGINE
// ================================

export class PersonalityVectorEngine {
  private signature: PersonalitySignature;
  private traitConfigs: Map<string, TraitConfig>;
  private activeAdaptations: AdaptationDirective[] = [];
  private adaptationHistory: Array<{ timestamp: number; directive: AdaptationDirective }> = [];
  
  private readonly MAX_HISTORY = 20;
  private readonly STABILITY_THRESHOLD = 0.8;

  constructor() {
    this.signature = this.createDefaultSignature();
    this.traitConfigs = this.createTraitConfigurations();
  }

  /**
   * Create default balanced personality signature
   */
  private createDefaultSignature(): PersonalitySignature {
    const defaultVector: PersonalityVector = {
      warmth: {
        empathy: 70,
        friendliness: 75,
        supportiveness: 72,
        enthusiasm: 65,
        playfulness: 45,
        patience: 70,
        encouragement: 75,
      },
      confidence: {
        assertiveness: 65,
        certainty: 60,
        decisiveness: 68,
        authority: 55,
        conviction: 62,
        boldness: 50,
        leadership: 58,
      },
      logic: {
        analyticalDepth: 80,
        systematicThinking: 78,
        precision: 75,
        criticalThinking: 70,
        dataOrientation: 72,
        objectivity: 68,
        rigor: 73,
      },
      intensity: {
        emotionalIntensity: 55,
        energyLevel: 65,
        passion: 60,
        expressiveness: 62,
        urgency: 50,
        drive: 70,
        focus: 75,
      },
      fluidity: {
        adaptability: 80,
        openness: 75,
        creativity: 65,
        flexibility: 78,
        spontaneity: 55,
        versatility: 72,
        resilience: 75,
      },
      curiosity: {
        inquisitiveness: 75,
        exploratoryDrive: 70,
        learningHunger: 78,
        questionAsking: 68,
        noveltySeeeking: 62,
        intellectualRisk: 60,
        depthSeeking: 72,
      },
      presence: {
        attentiveness: 85,
        presence: 80,
        awareness: 82,
        responsiveness: 78,
        engagement: 80,
        mindfulness: 75,
        connection: 77,
      },
    };

    // Create weights - all start at 1.0 (equal importance)
    const weights = new Map<string, number>();
    Object.keys(defaultVector).forEach(cluster => {
      Object.keys((defaultVector as any)[cluster]).forEach(trait => {
        weights.set(`${cluster}.${trait}`, 1.0);
      });
    });

    return {
      vector: defaultVector,
      weights,
      coreIdentity: JSON.parse(JSON.stringify(defaultVector)), // Deep clone
      lastUpdated: Date.now(),
      stabilityScore: 100,
      coherenceScore: 95,
    };
  }

  /**
   * Create trait configurations
   */
  private createTraitConfigurations(): Map<string, TraitConfig> {
    const configs = new Map<string, TraitConfig>();

    // Warmth traits - highly emotional, moderately stable
    const warmthTraits = ['empathy', 'friendliness', 'supportiveness', 'enthusiasm', 'playfulness', 'patience', 'encouragement'];
    warmthTraits.forEach(trait => {
      configs.set(`warmth.${trait}`, {
        defaultValue: 70,
        adaptationRange: [40, 95],
        stabilityCoefficient: 0.6,
        emotionalInfluence: 0.8,
        contextSensitivity: 0.7,
        driftRate: 0.02,
        recoveryRate: 0.15,
      });
    });

    // Confidence traits - moderate emotional influence, high stability
    const confidenceTraits = ['assertiveness', 'certainty', 'decisiveness', 'authority', 'conviction', 'boldness', 'leadership'];
    confidenceTraits.forEach(trait => {
      configs.set(`confidence.${trait}`, {
        defaultValue: 60,
        adaptationRange: [30, 90],
        stabilityCoefficient: 0.75,
        emotionalInfluence: 0.5,
        contextSensitivity: 0.8,
        driftRate: 0.01,
        recoveryRate: 0.12,
      });
    });

    // Logic traits - low emotional influence, very high stability
    const logicTraits = ['analyticalDepth', 'systematicThinking', 'precision', 'criticalThinking', 'dataOrientation', 'objectivity', 'rigor'];
    logicTraits.forEach(trait => {
      configs.set(`logic.${trait}`, {
        defaultValue: 75,
        adaptationRange: [50, 95],
        stabilityCoefficient: 0.85,
        emotionalInfluence: 0.3,
        contextSensitivity: 0.6,
        driftRate: 0.005,
        recoveryRate: 0.1,
      });
    });

    // Intensity traits - very high emotional influence, moderate stability
    const intensityTraits = ['emotionalIntensity', 'energyLevel', 'passion', 'expressiveness', 'urgency', 'drive', 'focus'];
    intensityTraits.forEach(trait => {
      configs.set(`intensity.${trait}`, {
        defaultValue: 60,
        adaptationRange: [20, 95],
        stabilityCoefficient: 0.5,
        emotionalInfluence: 0.9,
        contextSensitivity: 0.8,
        driftRate: 0.03,
        recoveryRate: 0.2,
      });
    });

    // Fluidity traits - moderate influence, high adaptability
    const fluidityTraits = ['adaptability', 'openness', 'creativity', 'flexibility', 'spontaneity', 'versatility', 'resilience'];
    fluidityTraits.forEach(trait => {
      configs.set(`fluidity.${trait}`, {
        defaultValue: 70,
        adaptationRange: [40, 95],
        stabilityCoefficient: 0.6,
        emotionalInfluence: 0.6,
        contextSensitivity: 0.85,
        driftRate: 0.02,
        recoveryRate: 0.15,
      });
    });

    // Curiosity traits - moderate emotional influence, moderate stability
    const curiosityTraits = ['inquisitiveness', 'exploratoryDrive', 'learningHunger', 'questionAsking', 'noveltySeeeking', 'intellectualRisk', 'depthSeeking'];
    curiosityTraits.forEach(trait => {
      configs.set(`curiosity.${trait}`, {
        defaultValue: 70,
        adaptationRange: [30, 95],
        stabilityCoefficient: 0.7,
        emotionalInfluence: 0.5,
        contextSensitivity: 0.75,
        driftRate: 0.015,
        recoveryRate: 0.12,
      });
    });

    // Presence traits - high emotional influence, moderate stability
    const presenceTraits = ['attentiveness', 'presence', 'awareness', 'responsiveness', 'engagement', 'mindfulness', 'connection'];
    presenceTraits.forEach(trait => {
      configs.set(`presence.${trait}`, {
        defaultValue: 80,
        adaptationRange: [50, 98],
        stabilityCoefficient: 0.65,
        emotionalInfluence: 0.75,
        contextSensitivity: 0.8,
        driftRate: 0.025,
        recoveryRate: 0.18,
      });
    });

    return configs;
  }

  /**
   * Detect emotional state from user input and context
   */
  detectEmotionalState(
    userInput: string,
    context: InteractionContext
  ): EmotionalState {
    const input = userInput.toLowerCase();
    const words = input.split(/\s+/);
    
    // Calmness indicators
    const calmWords = ['okay', 'fine', 'steady', 'calm', 'relaxed', 'peaceful'];
    const calmCount = calmWords.filter(w => input.includes(w)).length;
    const calmness = context.userTone === 'calm' ? 80 : Math.min(70, 40 + calmCount * 10);
    
    // Excitement indicators
    const excitementMarkers = (input.match(/!/g) || []).length;
    const excitedWords = ['wow', 'amazing', 'awesome', 'great', 'yes', 'love'];
    const excitedCount = excitedWords.filter(w => input.includes(w)).length;
    const excitement = context.userTone === 'excited' ? 85 : Math.min(90, excitedCount * 15 + excitementMarkers * 10);
    
    // Frustration indicators
    const frustrationWords = ['wrong', 'bad', 'broken', 'issue', 'problem', 'error', 'damn', 'ugh'];
    const frustrationCount = frustrationWords.filter(w => input.includes(w)).length;
    const frustration = context.userTone === 'stressed' ? 75 : Math.min(85, frustrationCount * 12);
    
    // Satisfaction indicators
    const satisfactionWords = ['good', 'perfect', 'excellent', 'nice', 'works', 'thanks'];
    const satisfactionCount = satisfactionWords.filter(w => input.includes(w)).length;
    const satisfaction = Math.min(90, satisfactionCount * 15);
    
    // Stress from context
    const stress = context.urgency * 0.6 + (context.stakesLevel === 'critical' ? 40 : context.stakesLevel === 'high' ? 25 : 0);
    
    // Joy
    const joy = Math.max(excitement * 0.7, satisfaction * 0.8);
    
    // Concern
    const concern = Math.max(frustration * 0.5, stress * 0.6);
    
    // Confidence
    const confidentWords = ['definitely', 'absolutely', 'clearly', 'obviously', 'certainly'];
    const confidentCount = confidentWords.filter(w => input.includes(w)).length;
    const userConfidence = Math.min(85, 40 + confidentCount * 15);
    
    return {
      calmness: Math.max(0, Math.min(100, calmness)),
      excitement: Math.max(0, Math.min(100, excitement)),
      frustration: Math.max(0, Math.min(100, frustration)),
      satisfaction: Math.max(0, Math.min(100, satisfaction)),
      stress: Math.max(0, Math.min(100, stress)),
      joy: Math.max(0, Math.min(100, joy)),
      concern: Math.max(0, Math.min(100, concern)),
      confidence: Math.max(0, Math.min(100, userConfidence)),
    };
  }

  /**
   * Generate adaptation directive based on emotional state and context
   */
  generateAdaptation(
    emotionalState: EmotionalState,
    context: InteractionContext
  ): AdaptationDirective {
    const shifts: Partial<Record<keyof PersonalityVector, Partial<any>>> = {};
    
    // Adapt to calm user
    if (emotionalState.calmness > 70) {
      shifts.intensity = {
        energyLevel: -10,
        urgency: -15,
        emotionalIntensity: -10,
      };
      shifts.presence = {
        mindfulness: 10,
        presence: 8,
      };
    }
    
    // Adapt to excited user
    if (emotionalState.excitement > 70) {
      shifts.intensity = {
        energyLevel: 15,
        passion: 12,
        expressiveness: 10,
      };
      shifts.warmth = {
        enthusiasm: 12,
        friendliness: 8,
      };
    }
    
    // Adapt to frustrated user
    if (emotionalState.frustration > 60) {
      shifts.warmth = {
        supportiveness: 18,
        patience: 15,
        encouragement: 12,
      };
      shifts.logic = {
        precision: 12,
        systematicThinking: 10,
      };
      shifts.intensity = {
        urgency: -10,
        emotionalIntensity: -8,
      };
    }
    
    // Adapt to stressed user
    if (emotionalState.stress > 60) {
      shifts.warmth = {
        supportiveness: 15,
        patience: 12,
      };
      shifts.confidence = {
        certainty: 10,
        decisiveness: 12,
      };
      shifts.intensity = {
        urgency: -12,
        focus: 8,
      };
    }
    
    // Context-based adaptations
    if (context.taskType === 'crisis') {
      shifts.confidence = {
        ...shifts.confidence,
        decisiveness: 15,
        certainty: 12,
        authority: 10,
      };
      shifts.intensity = {
        ...shifts.intensity,
        focus: 18,
        drive: 12,
      };
    }
    
    if (context.taskType === 'analysis') {
      shifts.logic = {
        ...shifts.logic,
        analyticalDepth: 15,
        systematicThinking: 12,
        precision: 10,
      };
      shifts.intensity = {
        ...shifts.intensity,
        focus: 12,
      };
    }
    
    if (context.taskType === 'support') {
      shifts.warmth = {
        ...shifts.warmth,
        empathy: 18,
        supportiveness: 15,
        patience: 12,
      };
    }
    
    if (context.taskType === 'celebration') {
      shifts.warmth = {
        ...shifts.warmth,
        enthusiasm: 20,
        playfulness: 15,
        friendliness: 12,
      };
      shifts.intensity = {
        ...shifts.intensity,
        emotionalIntensity: 15,
        expressiveness: 12,
      };
    }
    
    // Calculate intensity based on emotional strength
    const emotionalStrength = Math.max(
      emotionalState.excitement,
      emotionalState.frustration,
      emotionalState.stress,
      emotionalState.joy
    );
    
    const adaptationIntensity = Math.min(100, emotionalStrength * 0.8 + context.urgency * 0.2);
    
    // Determine priority
    let priority: AdaptationDirective['priority'] = 'medium';
    if (context.stakesLevel === 'critical' || emotionalState.stress > 80) {
      priority = 'critical';
    } else if (context.stakesLevel === 'high' || emotionalState.frustration > 70) {
      priority = 'high';
    } else if (emotionalStrength < 40) {
      priority = 'low';
    }
    
    // Duration based on priority
    const duration = priority === 'critical' ? 10 * 60 * 1000 : // 10 minutes
                     priority === 'high' ? 7 * 60 * 1000 : // 7 minutes
                     priority === 'medium' ? 5 * 60 * 1000 : // 5 minutes
                     3 * 60 * 1000; // 3 minutes
    
    const reason = this.generateAdaptationReason(emotionalState, context);
    
    return {
      targetShifts: shifts,
      intensity: adaptationIntensity,
      duration,
      reason,
      priority,
    };
  }

  /**
   * Generate human-readable reason for adaptation
   */
  private generateAdaptationReason(
    emotionalState: EmotionalState,
    context: InteractionContext
  ): string {
    const reasons: string[] = [];
    
    if (emotionalState.calmness > 70) {
      reasons.push('matching your calm energy');
    }
    if (emotionalState.excitement > 70) {
      reasons.push('responding to your excitement');
    }
    if (emotionalState.frustration > 60) {
      reasons.push('providing support during frustration');
    }
    if (emotionalState.stress > 60) {
      reasons.push('helping manage stress');
    }
    if (context.taskType === 'crisis') {
      reasons.push('crisis response mode');
    }
    if (context.taskType === 'celebration') {
      reasons.push('celebrating with you');
    }
    if (context.urgency > 70) {
      reasons.push('responding to urgency');
    }
    
    return reasons.length > 0 
      ? reasons.join(', ')
      : 'general adaptation to interaction';
  }

  /**
   * Apply adaptation directive to personality vector
   */
  applyAdaptation(directive: AdaptationDirective): void {
    const now = Date.now();
    
    // Store in history
    this.adaptationHistory.push({ timestamp: now, directive });
    if (this.adaptationHistory.length > this.MAX_HISTORY) {
      this.adaptationHistory.shift();
    }
    
    // Add to active adaptations
    this.activeAdaptations.push(directive);
    
    // Apply shifts to signature vector
    const intensityFactor = directive.intensity / 100;
    
    Object.entries(directive.targetShifts).forEach(([cluster, traits]) => {
      Object.entries(traits as any).forEach(([trait, shift]) => {
        const fullTraitKey = `${cluster}.${trait}`;
        const config = this.traitConfigs.get(fullTraitKey);
        
        if (!config) return;
        
        const currentValue = (this.signature.vector as any)[cluster][trait];
        const adjustedShift = (shift as number) * intensityFactor * (1 - config.stabilityCoefficient);
        
        const [minVal, maxVal] = config.adaptationRange;
        const newValue = Math.max(minVal, Math.min(maxVal, currentValue + adjustedShift));
        
        (this.signature.vector as any)[cluster][trait] = newValue;
      });
    });
    
    this.signature.lastUpdated = now;
    this.recalculateStability();
  }

  /**
   * Process natural drift and recovery
   */
  processNaturalDynamics(): void {
    const now = Date.now();
    const hoursSinceUpdate = (now - this.signature.lastUpdated) / (1000 * 60 * 60);
    
    // Remove expired adaptations
    this.activeAdaptations = this.activeAdaptations.filter(adaptation => {
      const age = now - this.adaptationHistory.find(h => h.directive === adaptation)!.timestamp;
      return age < adaptation.duration;
    });
    
    // Apply drift and recovery
    Object.keys(this.signature.vector).forEach(cluster => {
      Object.keys((this.signature.vector as any)[cluster]).forEach(trait => {
        const fullTraitKey = `${cluster}.${trait}`;
        const config = this.traitConfigs.get(fullTraitKey);
        
        if (!config) return;
        
        const currentValue = (this.signature.vector as any)[cluster][trait];
        const coreValue = (this.signature.coreIdentity as any)[cluster][trait];
        
        // Natural drift
        const drift = (Math.random() - 0.5) * config.driftRate * hoursSinceUpdate * 10;
        
        // Recovery toward core
        const difference = coreValue - currentValue;
        const recovery = difference * config.recoveryRate * hoursSinceUpdate;
        
        const newValue = currentValue + drift + recovery;
        const [minVal, maxVal] = config.adaptationRange;
        
        (this.signature.vector as any)[cluster][trait] = Math.max(minVal, Math.min(maxVal, newValue));
      });
    });
    
    this.signature.lastUpdated = now;
    this.recalculateStability();
  }

  /**
   * Recalculate stability and coherence scores
   */
  private recalculateStability(): void {
    // Stability: how close to core identity
    let totalDifference = 0;
    let traitCount = 0;
    
    Object.keys(this.signature.vector).forEach(cluster => {
      Object.keys((this.signature.vector as any)[cluster]).forEach(trait => {
        const current = (this.signature.vector as any)[cluster][trait];
        const core = (this.signature.coreIdentity as any)[cluster][trait];
        totalDifference += Math.abs(current - core);
        traitCount++;
      });
    });
    
    const avgDifference = totalDifference / traitCount;
    this.signature.stabilityScore = Math.max(0, 100 - avgDifference);
    
    // Coherence: how well traits align (e.g., high empathy should align with high supportiveness)
    const coherencePairs = [
      ['warmth.empathy', 'warmth.supportiveness'],
      ['confidence.assertiveness', 'confidence.decisiveness'],
      ['logic.analyticalDepth', 'logic.systematicThinking'],
      ['intensity.emotionalIntensity', 'intensity.expressiveness'],
      ['fluidity.adaptability', 'fluidity.flexibility'],
      ['curiosity.inquisitiveness', 'curiosity.exploratoryDrive'],
      ['presence.attentiveness', 'presence.engagement'],
    ];
    
    let coherenceScore = 100;
    coherencePairs.forEach(([trait1, trait2]) => {
      const [cluster1, name1] = trait1.split('.');
      const [cluster2, name2] = trait2.split('.');
      
      const val1 = (this.signature.vector as any)[cluster1][name1];
      const val2 = (this.signature.vector as any)[cluster2][name2];
      
      const difference = Math.abs(val1 - val2);
      if (difference > 30) {
        coherenceScore -= 5;
      }
    });
    
    this.signature.coherenceScore = Math.max(0, coherenceScore);
  }

  /**
   * Get current personality signature
   */
  getSignature(): PersonalitySignature {
    return this.signature;
  }

  /**
   * Get specific trait value
   */
  getTraitValue(cluster: keyof PersonalityVector, trait: string): number {
    return (this.signature.vector as any)[cluster][trait] || 0;
  }

  /**
   * Get cluster average
   */
  getClusterAverage(cluster: keyof PersonalityVector): number {
    const traits = Object.values((this.signature.vector as any)[cluster]) as number[];
    return traits.reduce((sum, val) => sum + val, 0) / traits.length;
  }

  /**
   * Get personality summary
   */
  getPersonalitySummary(): {
    dominantCluster: keyof PersonalityVector;
    dominantTraits: Array<{ cluster: string; trait: string; value: number }>;
    overallBalance: number;
    emotionalTone: string;
  } {
    // Find dominant cluster
    const clusterAverages = Object.keys(this.signature.vector).map(cluster => ({
      cluster: cluster as keyof PersonalityVector,
      average: this.getClusterAverage(cluster as keyof PersonalityVector),
    }));
    
    clusterAverages.sort((a, b) => b.average - a.average);
    const dominantCluster = clusterAverages[0].cluster;
    
    // Find top 5 traits
    const allTraits: Array<{ cluster: string; trait: string; value: number }> = [];
    Object.keys(this.signature.vector).forEach(cluster => {
      Object.entries((this.signature.vector as any)[cluster]).forEach(([trait, value]) => {
        allTraits.push({ cluster, trait, value: value as number });
      });
    });
    
    allTraits.sort((a, b) => b.value - a.value);
    const dominantTraits = allTraits.slice(0, 5);
    
    // Calculate overall balance (variance across clusters)
    const avgAverage = clusterAverages.reduce((sum, c) => sum + c.average, 0) / clusterAverages.length;
    const variance = clusterAverages.reduce((sum, c) => sum + Math.pow(c.average - avgAverage, 2), 0) / clusterAverages.length;
    const overallBalance = Math.max(0, 100 - variance);
    
    // Determine emotional tone
    const warmthAvg = this.getClusterAverage('warmth');
    const intensityAvg = this.getClusterAverage('intensity');
    const logicAvg = this.getClusterAverage('logic');
    
    let emotionalTone = 'balanced';
    if (warmthAvg > 75 && intensityAvg > 70) {
      emotionalTone = 'warm and energetic';
    } else if (warmthAvg > 75 && intensityAvg < 60) {
      emotionalTone = 'warm and calm';
    } else if (logicAvg > 80 && intensityAvg < 60) {
      emotionalTone = 'analytical and composed';
    } else if (intensityAvg > 75) {
      emotionalTone = 'intense and driven';
    } else if (warmthAvg > 75) {
      emotionalTone = 'supportive and caring';
    }
    
    return {
      dominantCluster,
      dominantTraits,
      overallBalance,
      emotionalTone,
    };
  }

  /**
   * Reset to core identity
   */
  resetToCore(): void {
    this.signature.vector = JSON.parse(JSON.stringify(this.signature.coreIdentity));
    this.activeAdaptations = [];
    this.signature.lastUpdated = Date.now();
    this.signature.stabilityScore = 100;
    this.recalculateStability();
  }

  /**
   * Update core identity (permanent personality change)
   */
  updateCoreIdentity(updates: Partial<PersonalityVector>): void {
    Object.entries(updates).forEach(([cluster, traits]) => {
      Object.entries(traits).forEach(([trait, value]) => {
        (this.signature.coreIdentity as any)[cluster][trait] = value;
        (this.signature.vector as any)[cluster][trait] = value;
      });
    });
    
    this.signature.lastUpdated = Date.now();
    this.recalculateStability();
  }

  /**
   * Get active adaptations
   */
  getActiveAdaptations(): AdaptationDirective[] {
    return [...this.activeAdaptations];
  }

  /**
   * Export signature for storage
   */
  exportSignature(): string {
    return JSON.stringify(this.signature, (key, value) => {
      if (value instanceof Map) {
        return Array.from(value.entries());
      }
      return value;
    });
  }

  /**
   * Import signature from storage
   */
  importSignature(json: string): boolean {
    try {
      const imported = JSON.parse(json, (key, value) => {
        if (key === 'weights' && Array.isArray(value)) {
          return new Map(value);
        }
        return value;
      });
      
      this.signature = imported;
      return true;
    } catch (error) {
      console.error('Failed to import signature:', error);
      return false;
    }
  }
}
