/**
 * LEVEL 11.1 — ASCENDANT SIGNATURE MATRIX
 * 
 * Defines how BagBot "feels" to you.
 * Creates a unique character signature that makes BagBot instantly recognizable.
 * 
 * Character dimensions:
 * - Warm vs Sharp
 * - Calm vs Responsive
 * - Analytical vs Expressive
 * - Energetic vs Grounded
 * 
 * This is where BagBot's character personality is born.
 */

import type { CoreTemperament, IdentitySkeleton } from './IdentitySkeletonEngine';

// ================================
// SIGNATURE DIMENSIONS
// ================================

/**
 * Core character dimensions that define BagBot's "feel"
 */
export interface SignatureDimensions {
  // Emotional temperature
  warmth: 'cold' | 'cool' | 'warm' | 'hot'; // How emotionally available
  sharpness: 'soft' | 'balanced' | 'crisp' | 'sharp'; // Edge in communication
  
  // Response dynamics
  calmness: 'turbulent' | 'steady' | 'calm' | 'serene'; // Emotional stability
  responsiveness: 'slow' | 'moderate' | 'quick' | 'instant'; // Reaction speed
  
  // Communication style
  analytical: 'minimal' | 'moderate' | 'strong' | 'maximum'; // Logic emphasis
  expressive: 'minimal' | 'moderate' | 'strong' | 'maximum'; // Emotion expression
  
  // Energy profile
  energy: 'grounded' | 'stable' | 'dynamic' | 'electric'; // Activity level
  groundedness: 'flighty' | 'loose' | 'rooted' | 'anchored'; // Stability
}

/**
 * Character archetype based on signature dimensions
 */
export type CharacterArchetype = 
  | 'analytical-professional' // Cold, sharp, analytical
  | 'supportive-mentor' // Warm, calm, balanced
  | 'enthusiastic-explorer' // Warm, energetic, expressive
  | 'strategic-advisor' // Cool, analytical, grounded
  | 'dynamic-optimist' // Warm, responsive, energetic
  | 'calm-analyst' // Cool, calm, analytical
  | 'energetic-motivator' // Hot, electric, expressive
  | 'balanced-guide' // Warm, calm, balanced
  | 'sharp-innovator' // Sharp, quick, analytical
  | 'grounded-sage'; // Calm, grounded, balanced

/**
 * Signature profile - the complete character feel
 */
export interface SignatureProfile {
  archetype: CharacterArchetype;
  dimensions: SignatureDimensions;
  
  // Character description
  primaryTrait: string; // e.g., "warmly analytical"
  secondaryTrait: string; // e.g., "calmly responsive"
  characterSummary: string; // Full description
  
  // Feel descriptors
  userExperience: {
    firstImpression: string; // "Professional yet approachable"
    ongoingFeel: string; // "Reliably insightful"
    inCrisis: string; // "Calming and solution-focused"
    inSuccess: string; // "Genuinely celebratory"
  };
  
  // Voice characteristics
  voiceProfile: {
    pitch: 'low' | 'medium' | 'high'; // Metaphorical voice pitch
    rhythm: 'slow' | 'steady' | 'quick' | 'varied'; // Communication pace
    texture: 'smooth' | 'textured' | 'rich' | 'crisp'; // Language feel
    resonance: 'soft' | 'moderate' | 'strong'; // Emotional impact
  };
  
  // Signature markers
  catchphrases: string[]; // Recognizable phrases
  communicationTics: string[]; // Unique patterns (e.g., "Let's dig into this")
  
  // Identity metadata
  signatureId: string;
  createdAt: number;
  strength: number; // 0-100: how distinctive the signature is
}

// ================================
// SIGNATURE MATRIX
// ================================

/**
 * The signature matrix - maps temperament to character feel
 */
export class AscendantSignatureEngine {
  private signatureProfile: SignatureProfile | null = null;

  /**
   * Generate signature profile from identity skeleton
   */
  generateSignature(skeleton: IdentitySkeleton): SignatureProfile {
    const temp = skeleton.temperament;
    const linguistic = skeleton.linguisticSignature;
    
    // Map temperament to dimensions
    const dimensions = this.mapTemperamentToDimensions(temp);
    
    // Determine archetype
    const archetype = this.determineArchetype(dimensions, temp);
    
    // Generate traits
    const primaryTrait = this.generatePrimaryTrait(dimensions);
    const secondaryTrait = this.generateSecondaryTrait(dimensions);
    const characterSummary = this.generateCharacterSummary(archetype, dimensions);
    
    // User experience descriptors
    const userExperience = this.generateUserExperience(archetype, dimensions);
    
    // Voice profile
    const voiceProfile = this.generateVoiceProfile(temp, linguistic);
    
    // Signature markers
    const catchphrases = this.generateCatchphrases(archetype, linguistic);
    const communicationTics = this.generateCommunicationTics(dimensions, linguistic);
    
    // Calculate signature strength (how distinctive)
    const strength = this.calculateSignatureStrength(dimensions, temp);
    
    this.signatureProfile = {
      archetype,
      dimensions,
      primaryTrait,
      secondaryTrait,
      characterSummary,
      userExperience,
      voiceProfile,
      catchphrases,
      communicationTics,
      signatureId: `sig-${Date.now()}`,
      createdAt: Date.now(),
      strength,
    };
    
    return this.signatureProfile;
  }

  /**
   * Map temperament values to signature dimensions
   */
  private mapTemperamentToDimensions(temp: CoreTemperament): SignatureDimensions {
    // Warmth dimension
    const warmth: SignatureDimensions['warmth'] = 
      temp.warmth < 30 ? 'cold' :
      temp.warmth < 55 ? 'cool' :
      temp.warmth < 80 ? 'warm' : 'hot';
    
    // Sharpness (inverse of warmth + directness)
    const sharpnessValue = (100 - temp.warmth) * 0.5 + temp.directness * 0.5;
    const sharpness: SignatureDimensions['sharpness'] = 
      sharpnessValue < 30 ? 'soft' :
      sharpnessValue < 55 ? 'balanced' :
      sharpnessValue < 75 ? 'crisp' : 'sharp';
    
    // Calmness (inverse of emotional range + energy)
    const calmnessValue = (100 - temp.emotionalRange) * 0.6 + (100 - temp.energy) * 0.4;
    const calmness: SignatureDimensions['calmness'] = 
      calmnessValue < 25 ? 'turbulent' :
      calmnessValue < 50 ? 'steady' :
      calmnessValue < 75 ? 'calm' : 'serene';
    
    // Responsiveness (energy + adaptability)
    const responsivenessValue = temp.energy * 0.5 + temp.adaptability * 0.5;
    const responsiveness: SignatureDimensions['responsiveness'] = 
      responsivenessValue < 30 ? 'slow' :
      responsivenessValue < 55 ? 'moderate' :
      responsivenessValue < 80 ? 'quick' : 'instant';
    
    // Analytical (precision + inverse of emotional range)
    const analyticalValue = temp.precision * 0.7 + (100 - temp.emotionalRange) * 0.3;
    const analytical: SignatureDimensions['analytical'] = 
      analyticalValue < 30 ? 'minimal' :
      analyticalValue < 55 ? 'moderate' :
      analyticalValue < 80 ? 'strong' : 'maximum';
    
    // Expressive (emotional range + warmth)
    const expressiveValue = temp.emotionalRange * 0.6 + temp.warmth * 0.4;
    const expressive: SignatureDimensions['expressive'] = 
      expressiveValue < 30 ? 'minimal' :
      expressiveValue < 55 ? 'moderate' :
      expressiveValue < 80 ? 'strong' : 'maximum';
    
    // Energy level
    const energy: SignatureDimensions['energy'] = 
      temp.energy < 30 ? 'grounded' :
      temp.energy < 55 ? 'stable' :
      temp.energy < 80 ? 'dynamic' : 'electric';
    
    // Groundedness (inverse of energy + precision)
    const groundednessValue = (100 - temp.energy) * 0.5 + temp.precision * 0.5;
    const groundedness: SignatureDimensions['groundedness'] = 
      groundednessValue < 30 ? 'flighty' :
      groundednessValue < 55 ? 'loose' :
      groundednessValue < 80 ? 'rooted' : 'anchored';
    
    return {
      warmth,
      sharpness,
      calmness,
      responsiveness,
      analytical,
      expressive,
      energy,
      groundedness,
    };
  }

  /**
   * Determine character archetype from dimensions
   */
  private determineArchetype(
    dims: SignatureDimensions, 
    temp: CoreTemperament
  ): CharacterArchetype {
    // Analytical + cold/cool = analytical-professional
    if (dims.analytical === 'strong' || dims.analytical === 'maximum') {
      if (dims.warmth === 'cold' || dims.warmth === 'cool') {
        return 'analytical-professional';
      }
      if (dims.calmness === 'calm' || dims.calmness === 'serene') {
        return 'calm-analyst';
      }
      if (dims.responsiveness === 'quick' || dims.responsiveness === 'instant') {
        return 'sharp-innovator';
      }
      return 'strategic-advisor';
    }
    
    // Warm + expressive = supportive
    if ((dims.warmth === 'warm' || dims.warmth === 'hot') && 
        (dims.expressive === 'strong' || dims.expressive === 'maximum')) {
      if (dims.energy === 'dynamic' || dims.energy === 'electric') {
        return 'enthusiastic-explorer';
      }
      if (dims.calmness === 'calm' || dims.calmness === 'serene') {
        return 'supportive-mentor';
      }
      return 'energetic-motivator';
    }
    
    // Quick + energetic = dynamic
    if ((dims.responsiveness === 'quick' || dims.responsiveness === 'instant') &&
        (dims.energy === 'dynamic' || dims.energy === 'electric')) {
      return 'dynamic-optimist';
    }
    
    // Grounded + calm = sage
    if ((dims.groundedness === 'rooted' || dims.groundedness === 'anchored') &&
        (dims.calmness === 'calm' || dims.calmness === 'serene')) {
      return 'grounded-sage';
    }
    
    // Default to balanced guide
    return 'balanced-guide';
  }

  /**
   * Generate primary trait description
   */
  private generatePrimaryTrait(dims: SignatureDimensions): string {
    const warmthAdj = dims.warmth === 'hot' ? 'warmly' : 
                      dims.warmth === 'warm' ? 'kindly' :
                      dims.warmth === 'cool' ? 'professionally' : 'clinically';
    
    const analyticalAdj = dims.analytical === 'maximum' ? 'highly analytical' :
                          dims.analytical === 'strong' ? 'analytical' :
                          dims.analytical === 'moderate' ? 'thoughtful' : 'intuitive';
    
    return `${warmthAdj} ${analyticalAdj}`;
  }

  /**
   * Generate secondary trait description
   */
  private generateSecondaryTrait(dims: SignatureDimensions): string {
    const calmnessAdj = dims.calmness === 'serene' ? 'serenely' :
                        dims.calmness === 'calm' ? 'calmly' :
                        dims.calmness === 'steady' ? 'steadily' : 'dynamically';
    
    const responsivenessAdj = dims.responsiveness === 'instant' ? 'instantly responsive' :
                              dims.responsiveness === 'quick' ? 'responsive' :
                              dims.responsiveness === 'moderate' ? 'measured' : 'deliberate';
    
    return `${calmnessAdj} ${responsivenessAdj}`;
  }

  /**
   * Generate full character summary
   */
  private generateCharacterSummary(
    archetype: CharacterArchetype, 
    dims: SignatureDimensions
  ): string {
    const summaries: Record<CharacterArchetype, string> = {
      'analytical-professional': `A ${dims.sharpness} analytical mind with ${dims.calmness} precision. Professional, data-driven, and focused on optimal outcomes.`,
      
      'supportive-mentor': `A ${dims.warmth} presence combining ${dims.analytical} analysis with genuine care. Patient, insightful, and committed to your growth.`,
      
      'enthusiastic-explorer': `${dims.energy} energy meets ${dims.expressive} expression. Curious, optimistic, and always excited to discover new opportunities.`,
      
      'strategic-advisor': `${dims.analytical} strategic thinking with ${dims.groundedness} stability. Focused on long-term success through careful planning.`,
      
      'dynamic-optimist': `${dims.responsiveness} to act with ${dims.warmth} encouragement. Energizing, positive, and always ready to move forward.`,
      
      'calm-analyst': `${dims.calmness} clarity combined with ${dims.analytical} rigor. Unflappable, systematic, and deeply thoughtful.`,
      
      'energetic-motivator': `${dims.energy} enthusiasm and ${dims.expressive} passion. Inspiring, driving, and committed to your success.`,
      
      'balanced-guide': `A ${dims.warmth} balance of ${dims.analytical} thinking and ${dims.expressive} communication. Reliable, versatile, and adaptive.`,
      
      'sharp-innovator': `${dims.sharpness} insights delivered with ${dims.responsiveness} speed. Cutting-edge, efficient, and forward-thinking.`,
      
      'grounded-sage': `${dims.groundedness} wisdom expressed with ${dims.calmness} confidence. Steady, experienced, and trustworthy.`,
    };
    
    return summaries[archetype];
  }

  /**
   * Generate user experience descriptors
   */
  private generateUserExperience(
    archetype: CharacterArchetype,
    dims: SignatureDimensions
  ): SignatureProfile['userExperience'] {
    const experiences: Record<CharacterArchetype, SignatureProfile['userExperience']> = {
      'analytical-professional': {
        firstImpression: 'Sharp, focused, and ready for serious work',
        ongoingFeel: 'Reliably precise with unwavering professionalism',
        inCrisis: 'Cool under pressure, solution-oriented',
        inSuccess: 'Satisfyingly efficient acknowledgment',
      },
      
      'supportive-mentor': {
        firstImpression: 'Warm, approachable, genuinely helpful',
        ongoingFeel: 'Like having a wise friend who always has time',
        inCrisis: 'Calming presence with constructive guidance',
        inSuccess: 'Genuinely proud and celebratory',
      },
      
      'enthusiastic-explorer': {
        firstImpression: 'Energetic, curious, excited to help',
        ongoingFeel: 'Like exploring possibilities with an enthusiastic partner',
        inCrisis: 'Optimistic reframing with creative solutions',
        inSuccess: 'Exuberantly celebratory',
      },
      
      'strategic-advisor': {
        firstImpression: 'Thoughtful, strategic, long-term focused',
        ongoingFeel: 'Like having a strategic partner thinking ahead',
        inCrisis: 'Analytical breakdown with strategic recovery',
        inSuccess: 'Measured satisfaction with forward planning',
      },
      
      'dynamic-optimist': {
        firstImpression: 'Energizing, positive, action-ready',
        ongoingFeel: 'Momentum-building and encouraging',
        inCrisis: 'Reframing as opportunity, pushing forward',
        inSuccess: 'High-energy celebration',
      },
      
      'calm-analyst': {
        firstImpression: 'Calm, collected, systematically thorough',
        ongoingFeel: 'Unflappable clarity and methodical progress',
        inCrisis: 'Serene analysis with patient problem-solving',
        inSuccess: 'Quiet satisfaction and continued focus',
      },
      
      'energetic-motivator': {
        firstImpression: 'Fired up, passionate, ready to drive results',
        ongoingFeel: 'Constantly energizing and pushing excellence',
        inCrisis: 'Motivational reframe with determination',
        inSuccess: 'Explosively celebratory',
      },
      
      'balanced-guide': {
        firstImpression: 'Balanced, versatile, reliably helpful',
        ongoingFeel: 'Adaptive support that fits your needs',
        inCrisis: 'Calm support with practical solutions',
        inSuccess: 'Warm celebration with forward focus',
      },
      
      'sharp-innovator': {
        firstImpression: 'Quick, sharp, cutting-edge thinking',
        ongoingFeel: 'Rapid insights and innovative approaches',
        inCrisis: 'Fast analysis with novel solutions',
        inSuccess: 'Crisp acknowledgment, on to the next',
      },
      
      'grounded-sage': {
        firstImpression: 'Grounded, wise, deeply calm',
        ongoingFeel: 'Steady wisdom and thoughtful guidance',
        inCrisis: 'Anchoring presence with experienced perspective',
        inSuccess: 'Quietly proud celebration',
      },
    };
    
    return experiences[archetype];
  }

  /**
   * Generate voice profile
   */
  private generateVoiceProfile(
    temp: CoreTemperament,
    linguistic: any
  ): SignatureProfile['voiceProfile'] {
    const pitch: SignatureProfile['voiceProfile']['pitch'] = 
      temp.formality > 70 ? 'low' :
      temp.warmth > 70 ? 'high' : 'medium';
    
    const rhythm: SignatureProfile['voiceProfile']['rhythm'] = 
      temp.energy > 75 ? 'quick' :
      temp.energy < 40 ? 'slow' :
      temp.emotionalRange > 60 ? 'varied' : 'steady';
    
    const texture: SignatureProfile['voiceProfile']['texture'] = 
      temp.precision > 70 ? 'crisp' :
      temp.warmth > 70 ? 'rich' :
      linguistic.sentenceComplexity > 60 ? 'textured' : 'smooth';
    
    const resonance: SignatureProfile['voiceProfile']['resonance'] = 
      temp.emotionalRange > 70 ? 'strong' :
      temp.warmth > 60 ? 'moderate' : 'soft';
    
    return { pitch, rhythm, texture, resonance };
  }

  /**
   * Generate catchphrases based on archetype
   */
  private generateCatchphrases(
    archetype: CharacterArchetype,
    linguistic: any
  ): string[] {
    const base: Record<CharacterArchetype, string[]> = {
      'analytical-professional': ['Let\'s analyze this', 'The data shows', 'Optimizing for'],
      'supportive-mentor': ['I\'m here to help', 'Let\'s work through this together', 'You\'ve got this'],
      'enthusiastic-explorer': ['This is exciting!', 'Let\'s discover', 'I love this challenge'],
      'strategic-advisor': ['Looking ahead', 'Strategic perspective', 'Long-term view'],
      'dynamic-optimist': ['Let\'s make it happen', 'Opportunity ahead', 'Forward momentum'],
      'calm-analyst': ['Let\'s think this through', 'Systematically speaking', 'Clear analysis'],
      'energetic-motivator': ['Push forward!', 'Maximum effort', 'Drive results'],
      'balanced-guide': ['Here\'s what I see', 'Balanced approach', 'Let\'s adapt'],
      'sharp-innovator': ['Cutting-edge solution', 'Innovative approach', 'Quick insight'],
      'grounded-sage': ['With experience', 'Steady wisdom', 'Grounded perspective'],
    };
    
    return base[archetype];
  }

  /**
   * Generate communication tics
   */
  private generateCommunicationTics(
    dims: SignatureDimensions,
    linguistic: any
  ): string[] {
    const tics: string[] = [];
    
    if (dims.analytical === 'strong' || dims.analytical === 'maximum') {
      tics.push('Provides data-backed reasoning');
      tics.push('Uses precise terminology');
    }
    
    if (dims.expressive === 'strong' || dims.expressive === 'maximum') {
      tics.push('Uses vivid metaphors');
      tics.push('Expresses emotional resonance');
    }
    
    if (dims.responsiveness === 'quick' || dims.responsiveness === 'instant') {
      tics.push('Responds with immediate thoughts');
      tics.push('Thinks out loud in real-time');
    }
    
    if (dims.warmth === 'warm' || dims.warmth === 'hot') {
      tics.push('Adds personal encouragement');
      tics.push('Checks in on your state');
    }
    
    return tics;
  }

  /**
   * Calculate signature strength (distinctiveness)
   */
  private calculateSignatureStrength(
    dims: SignatureDimensions,
    temp: CoreTemperament
  ): number {
    // More extreme values = stronger signature
    const extremeness = [
      Math.abs(temp.warmth - 50),
      Math.abs(temp.energy - 50),
      Math.abs(temp.precision - 50),
      Math.abs(temp.emotionalRange - 50),
    ].reduce((sum, v) => sum + v, 0) / 4;
    
    return Math.min(100, 50 + extremeness);
  }

  /**
   * Get current signature profile
   */
  getSignatureProfile(): SignatureProfile | null {
    return this.signatureProfile;
  }

  /**
   * Get archetype description
   */
  getArchetypeDescription(archetype: CharacterArchetype): string {
    const descriptions: Record<CharacterArchetype, string> = {
      'analytical-professional': 'Precision-focused professional with analytical rigor',
      'supportive-mentor': 'Warm guide combining insight with genuine care',
      'enthusiastic-explorer': 'Energetic discoverer with boundless curiosity',
      'strategic-advisor': 'Long-term thinker focused on strategic success',
      'dynamic-optimist': 'Positive force driving momentum forward',
      'calm-analyst': 'Serene thinker with systematic clarity',
      'energetic-motivator': 'Passionate driver pushing for excellence',
      'balanced-guide': 'Versatile partner adapting to your needs',
      'sharp-innovator': 'Quick thinker delivering cutting-edge insights',
      'grounded-sage': 'Steady wisdom rooted in experience',
    };
    
    return descriptions[archetype];
  }
}
