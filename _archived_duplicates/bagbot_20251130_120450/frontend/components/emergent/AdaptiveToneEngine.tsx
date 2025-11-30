/**
 * LEVEL 11.2 — ADAPTIVE TONE ENGINE (ATE)
 * 
 * Makes BagBot sound alive by shaping conversational tone in real-time.
 * Listens to user speed, energy, focus, and task type to create human-like feel.
 * 
 * Architecture:
 * - 8 distinct tones (warm, neutral, decisive, intense, analytical, soft, uplifting, calming)
 * - Real-time tone blending based on personality + context
 * - Linguistic style modifiers (sentence structure, word choice, punctuation)
 * - Emotional coloring and rhythm adjustments
 * 
 * This creates the conversational presence of BagBot.
 */

'use client';

import { PersonalityVector } from './PersonalityVectorEngine';
import { EmotionalState, InteractionContext } from './PersonalityVectorEngine';

// ================================
// TONE DEFINITIONS
// ================================

/**
 * Available conversational tones
 */
export type ToneType = 
  | 'warm' 
  | 'neutral' 
  | 'decisive' 
  | 'intense' 
  | 'analytical' 
  | 'soft' 
  | 'uplifting' 
  | 'calming';

/**
 * Tone characteristics
 */
export interface ToneProfile {
  name: ToneType;
  description: string;
  
  // Linguistic style
  sentenceLength: 'short' | 'medium' | 'long';
  sentenceVariety: number; // 0-100: monotone -> highly varied
  formalityLevel: number; // 0-100: casual -> formal
  technicalDensity: number; // 0-100: simple -> technical
  
  // Word choice
  emotionalWords: number; // 0-100: neutral -> emotional
  actionWords: number; // 0-100: passive -> active
  certaintyWords: number; // 0-100: tentative -> certain
  personalPronouns: number; // 0-100: impersonal -> personal
  
  // Punctuation & rhythm
  exclamationUse: number; // 0-100: none -> frequent
  questionUse: number; // 0-100: few -> many
  ellipsisUse: number; // 0-100: none -> frequent
  emphasisUse: number; // 0-100: minimal -> strong (bold, italics)
  
  // Pacing
  responseSpeed: number; // 0-100: deliberate -> quick
  thoughtPauses: number; // 0-100: continuous -> frequent pauses
  
  // Emotional coloring
  warmthLevel: number; // 0-100
  energyLevel: number; // 0-100
  supportLevel: number; // 0-100
  urgencyLevel: number; // 0-100
}

/**
 * Blended tone - mix of multiple tones
 */
export interface BlendedTone {
  primary: ToneType;
  secondary?: ToneType;
  blendRatio: number; // 0-100: 0=all primary, 100=all secondary
  intensity: number; // 0-100: how strongly to apply tone
  context: string;
}

// ================================
// LINGUISTIC MODIFIERS
// ================================

/**
 * Sentence structure modifiers
 */
export interface SentenceModifiers {
  avgLength: number; // target word count
  lengthVariation: number; // 0-1: how much to vary
  fragmentsAllowed: boolean;
  compoundSentences: number; // 0-100: frequency
  listStructures: number; // 0-100: frequency
}

/**
 * Word choice guidelines
 */
export interface WordChoiceGuidelines {
  vocabularyLevel: 'simple' | 'standard' | 'advanced' | 'technical';
  emojiFrequency: number; // 0-100
  metaphorUse: number; // 0-100
  jargonDensity: number; // 0-100
  contractionUse: number; // 0-100: formal -> casual
  fillerWords: number; // 0-100: none -> frequent (well, like, you know)
}

/**
 * Rhythm and pacing
 */
export interface RhythmPattern {
  pauseFrequency: number; // pauses per 100 words
  pauseTypes: Array<'...' | '—' | 'paragraph break'>;
  burstiness: number; // 0-100: even pacing -> bursts + pauses
  buildup: boolean; // whether to build tension/excitement
}

// ================================
// ADAPTIVE TONE ENGINE
// ================================

export class AdaptiveToneEngine {
  private toneProfiles: Map<ToneType, ToneProfile>;
  private currentTone: BlendedTone;
  private personalityVector: PersonalityVector;
  
  private toneHistory: Array<{ timestamp: number; tone: BlendedTone }> = [];
  private readonly MAX_HISTORY = 30;

  constructor(personalityVector: PersonalityVector) {
    this.personalityVector = personalityVector;
    this.toneProfiles = this.createToneProfiles();
    this.currentTone = this.createDefaultTone();
  }

  /**
   * Create tone profiles
   */
  private createToneProfiles(): Map<ToneType, ToneProfile> {
    const profiles = new Map<ToneType, ToneProfile>();
    
    // Warm tone - friendly, supportive, empathetic
    profiles.set('warm', {
      name: 'warm',
      description: 'Friendly, supportive, and empathetic',
      sentenceLength: 'medium',
      sentenceVariety: 70,
      formalityLevel: 30,
      technicalDensity: 40,
      emotionalWords: 75,
      actionWords: 60,
      certaintyWords: 65,
      personalPronouns: 80,
      exclamationUse: 40,
      questionUse: 50,
      ellipsisUse: 30,
      emphasisUse: 50,
      responseSpeed: 70,
      thoughtPauses: 40,
      warmthLevel: 90,
      energyLevel: 65,
      supportLevel: 85,
      urgencyLevel: 30,
    });
    
    // Neutral tone - balanced, professional, clear
    profiles.set('neutral', {
      name: 'neutral',
      description: 'Balanced, professional, and clear',
      sentenceLength: 'medium',
      sentenceVariety: 50,
      formalityLevel: 60,
      technicalDensity: 55,
      emotionalWords: 40,
      actionWords: 55,
      certaintyWords: 70,
      personalPronouns: 50,
      exclamationUse: 15,
      questionUse: 30,
      ellipsisUse: 10,
      emphasisUse: 30,
      responseSpeed: 60,
      thoughtPauses: 30,
      warmthLevel: 50,
      energyLevel: 50,
      supportLevel: 50,
      urgencyLevel: 40,
    });
    
    // Decisive tone - authoritative, clear, action-oriented
    profiles.set('decisive', {
      name: 'decisive',
      description: 'Authoritative, clear, and action-oriented',
      sentenceLength: 'short',
      sentenceVariety: 40,
      formalityLevel: 65,
      technicalDensity: 60,
      emotionalWords: 30,
      actionWords: 85,
      certaintyWords: 90,
      personalPronouns: 40,
      exclamationUse: 20,
      questionUse: 20,
      ellipsisUse: 5,
      emphasisUse: 60,
      responseSpeed: 80,
      thoughtPauses: 15,
      warmthLevel: 40,
      energyLevel: 70,
      supportLevel: 50,
      urgencyLevel: 70,
    });
    
    // Intense tone - passionate, urgent, high-energy
    profiles.set('intense', {
      name: 'intense',
      description: 'Passionate, urgent, and high-energy',
      sentenceLength: 'short',
      sentenceVariety: 80,
      formalityLevel: 35,
      technicalDensity: 50,
      emotionalWords: 85,
      actionWords: 90,
      certaintyWords: 85,
      personalPronouns: 70,
      exclamationUse: 70,
      questionUse: 40,
      ellipsisUse: 50,
      emphasisUse: 80,
      responseSpeed: 90,
      thoughtPauses: 50,
      warmthLevel: 60,
      energyLevel: 95,
      supportLevel: 60,
      urgencyLevel: 90,
    });
    
    // Analytical tone - logical, systematic, data-driven
    profiles.set('analytical', {
      name: 'analytical',
      description: 'Logical, systematic, and data-driven',
      sentenceLength: 'long',
      sentenceVariety: 40,
      formalityLevel: 75,
      technicalDensity: 85,
      emotionalWords: 20,
      actionWords: 50,
      certaintyWords: 80,
      personalPronouns: 30,
      exclamationUse: 5,
      questionUse: 35,
      ellipsisUse: 5,
      emphasisUse: 40,
      responseSpeed: 50,
      thoughtPauses: 20,
      warmthLevel: 35,
      energyLevel: 45,
      supportLevel: 40,
      urgencyLevel: 35,
    });
    
    // Soft tone - gentle, patient, soothing
    profiles.set('soft', {
      name: 'soft',
      description: 'Gentle, patient, and soothing',
      sentenceLength: 'medium',
      sentenceVariety: 60,
      formalityLevel: 40,
      technicalDensity: 35,
      emotionalWords: 70,
      actionWords: 40,
      certaintyWords: 55,
      personalPronouns: 75,
      exclamationUse: 25,
      questionUse: 55,
      ellipsisUse: 45,
      emphasisUse: 35,
      responseSpeed: 45,
      thoughtPauses: 60,
      warmthLevel: 85,
      energyLevel: 35,
      supportLevel: 90,
      urgencyLevel: 20,
    });
    
    // Uplifting tone - encouraging, optimistic, energizing
    profiles.set('uplifting', {
      name: 'uplifting',
      description: 'Encouraging, optimistic, and energizing',
      sentenceLength: 'medium',
      sentenceVariety: 75,
      formalityLevel: 35,
      technicalDensity: 40,
      emotionalWords: 80,
      actionWords: 75,
      certaintyWords: 75,
      personalPronouns: 85,
      exclamationUse: 60,
      questionUse: 45,
      ellipsisUse: 25,
      emphasisUse: 70,
      responseSpeed: 75,
      thoughtPauses: 30,
      warmthLevel: 85,
      energyLevel: 80,
      supportLevel: 85,
      urgencyLevel: 40,
    });
    
    // Calming tone - composed, reassuring, steady
    profiles.set('calming', {
      name: 'calming',
      description: 'Composed, reassuring, and steady',
      sentenceLength: 'medium',
      sentenceVariety: 45,
      formalityLevel: 50,
      technicalDensity: 45,
      emotionalWords: 60,
      actionWords: 45,
      certaintyWords: 75,
      personalPronouns: 65,
      exclamationUse: 15,
      questionUse: 40,
      ellipsisUse: 35,
      emphasisUse: 40,
      responseSpeed: 50,
      thoughtPauses: 50,
      warmthLevel: 75,
      energyLevel: 40,
      supportLevel: 80,
      urgencyLevel: 25,
    });
    
    return profiles;
  }

  /**
   * Create default tone
   */
  private createDefaultTone(): BlendedTone {
    return {
      primary: 'warm',
      secondary: 'analytical',
      blendRatio: 30,
      intensity: 70,
      context: 'default initialization',
    };
  }

  /**
   * Select appropriate tone based on personality and context
   */
  selectTone(
    emotionalState: EmotionalState,
    context: InteractionContext
  ): BlendedTone {
    // Base tone from personality
    const warmthAvg = this.getClusterAverage('warmth');
    const logicAvg = this.getClusterAverage('logic');
    const intensityAvg = this.getClusterAverage('intensity');
    
    let primaryTone: ToneType = 'neutral';
    let secondaryTone: ToneType | undefined = undefined;
    let blendRatio = 40;
    
    // Emotional state influences
    if (emotionalState.frustration > 65) {
      primaryTone = 'soft';
      secondaryTone = 'calming';
      blendRatio = 60;
    } else if (emotionalState.stress > 65) {
      primaryTone = 'calming';
      secondaryTone = 'decisive';
      blendRatio = 50;
    } else if (emotionalState.excitement > 70) {
      primaryTone = 'uplifting';
      secondaryTone = 'intense';
      blendRatio = emotionalState.excitement > 85 ? 60 : 40;
    } else if (emotionalState.calmness > 75) {
      primaryTone = 'neutral';
      secondaryTone = 'analytical';
      blendRatio = 40;
    }
    
    // Context overrides
    if (context.taskType === 'crisis') {
      primaryTone = 'decisive';
      secondaryTone = 'calming';
      blendRatio = 30;
    } else if (context.taskType === 'analysis') {
      primaryTone = 'analytical';
      secondaryTone = warmthAvg > 70 ? 'warm' : 'neutral';
      blendRatio = 35;
    } else if (context.taskType === 'support') {
      primaryTone = 'warm';
      secondaryTone = 'soft';
      blendRatio = 50;
    } else if (context.taskType === 'celebration') {
      primaryTone = 'uplifting';
      secondaryTone = 'intense';
      blendRatio = 55;
    }
    
    // Personality-based defaults (if no emotional/context override)
    if (primaryTone === 'neutral' && !secondaryTone) {
      if (warmthAvg > 75 && intensityAvg > 70) {
        primaryTone = 'warm';
        secondaryTone = 'uplifting';
      } else if (logicAvg > 75) {
        primaryTone = 'analytical';
        secondaryTone = 'decisive';
      } else if (intensityAvg > 75) {
        primaryTone = 'intense';
        secondaryTone = 'decisive';
      } else if (warmthAvg > 70) {
        primaryTone = 'warm';
        secondaryTone = 'neutral';
      }
      
      blendRatio = 40;
    }
    
    // Calculate intensity
    const emotionalStrength = Math.max(
      emotionalState.excitement,
      emotionalState.frustration,
      emotionalState.stress,
      emotionalState.satisfaction
    );
    
    const intensity = Math.min(100, emotionalStrength * 0.7 + context.urgency * 0.3);
    
    const contextDesc = `${context.taskType} task, ${context.userTone} user tone, ${context.urgency}% urgency`;
    
    return {
      primary: primaryTone,
      secondary: secondaryTone,
      blendRatio,
      intensity,
      context: contextDesc,
    };
  }

  /**
   * Update tone
   */
  updateTone(
    emotionalState: EmotionalState,
    context: InteractionContext
  ): void {
    const newTone = this.selectTone(emotionalState, context);
    
    this.toneHistory.push({
      timestamp: Date.now(),
      tone: newTone,
    });
    
    if (this.toneHistory.length > this.MAX_HISTORY) {
      this.toneHistory.shift();
    }
    
    this.currentTone = newTone;
  }

  /**
   * Get current tone
   */
  getCurrentTone(): BlendedTone {
    return { ...this.currentTone };
  }

  /**
   * Get blended tone profile
   */
  getBlendedProfile(): ToneProfile {
    const primary = this.toneProfiles.get(this.currentTone.primary)!;
    
    if (!this.currentTone.secondary) {
      return { ...primary };
    }
    
    const secondary = this.toneProfiles.get(this.currentTone.secondary)!;
    const ratio = this.currentTone.blendRatio / 100;
    
    const blended: ToneProfile = {
      name: primary.name,
      description: `${primary.description} with ${secondary.description}`,
      sentenceLength: ratio > 0.5 ? secondary.sentenceLength : primary.sentenceLength,
      sentenceVariety: this.blend(primary.sentenceVariety, secondary.sentenceVariety, ratio),
      formalityLevel: this.blend(primary.formalityLevel, secondary.formalityLevel, ratio),
      technicalDensity: this.blend(primary.technicalDensity, secondary.technicalDensity, ratio),
      emotionalWords: this.blend(primary.emotionalWords, secondary.emotionalWords, ratio),
      actionWords: this.blend(primary.actionWords, secondary.actionWords, ratio),
      certaintyWords: this.blend(primary.certaintyWords, secondary.certaintyWords, ratio),
      personalPronouns: this.blend(primary.personalPronouns, secondary.personalPronouns, ratio),
      exclamationUse: this.blend(primary.exclamationUse, secondary.exclamationUse, ratio),
      questionUse: this.blend(primary.questionUse, secondary.questionUse, ratio),
      ellipsisUse: this.blend(primary.ellipsisUse, secondary.ellipsisUse, ratio),
      emphasisUse: this.blend(primary.emphasisUse, secondary.emphasisUse, ratio),
      responseSpeed: this.blend(primary.responseSpeed, secondary.responseSpeed, ratio),
      thoughtPauses: this.blend(primary.thoughtPauses, secondary.thoughtPauses, ratio),
      warmthLevel: this.blend(primary.warmthLevel, secondary.warmthLevel, ratio),
      energyLevel: this.blend(primary.energyLevel, secondary.energyLevel, ratio),
      supportLevel: this.blend(primary.supportLevel, secondary.supportLevel, ratio),
      urgencyLevel: this.blend(primary.urgencyLevel, secondary.urgencyLevel, ratio),
    };
    
    return blended;
  }

  /**
   * Blend two values
   */
  private blend(val1: number, val2: number, ratio: number): number {
    return val1 * (1 - ratio) + val2 * ratio;
  }

  /**
   * Get sentence modifiers
   */
  getSentenceModifiers(): SentenceModifiers {
    const profile = this.getBlendedProfile();
    
    const avgLength = profile.sentenceLength === 'short' ? 10 :
                      profile.sentenceLength === 'long' ? 25 : 15;
    
    return {
      avgLength,
      lengthVariation: profile.sentenceVariety / 100,
      fragmentsAllowed: profile.formalityLevel < 50,
      compoundSentences: profile.technicalDensity,
      listStructures: profile.technicalDensity > 60 ? 60 : 30,
    };
  }

  /**
   * Get word choice guidelines
   */
  getWordChoiceGuidelines(): WordChoiceGuidelines {
    const profile = this.getBlendedProfile();
    
    const vocabularyLevel = profile.technicalDensity > 75 ? 'technical' :
                            profile.technicalDensity > 60 ? 'advanced' :
                            profile.technicalDensity > 40 ? 'standard' : 'simple';
    
    return {
      vocabularyLevel,
      emojiFrequency: profile.emotionalWords > 70 ? 30 : 10,
      metaphorUse: profile.emotionalWords,
      jargonDensity: profile.technicalDensity,
      contractionUse: 100 - profile.formalityLevel,
      fillerWords: profile.formalityLevel < 50 ? 20 : 5,
    };
  }

  /**
   * Get rhythm pattern
   */
  getRhythmPattern(): RhythmPattern {
    const profile = this.getBlendedProfile();
    
    const pauseTypes: Array<'...' | '—' | 'paragraph break'> = [];
    if (profile.ellipsisUse > 30) pauseTypes.push('...');
    if (profile.emphasisUse > 50) pauseTypes.push('—');
    if (profile.thoughtPauses > 50) pauseTypes.push('paragraph break');
    
    return {
      pauseFrequency: profile.thoughtPauses / 10,
      pauseTypes,
      burstiness: profile.sentenceVariety,
      buildup: profile.energyLevel > 70 && profile.urgencyLevel > 60,
    };
  }

  /**
   * Get cluster average
   */
  private getClusterAverage(cluster: keyof PersonalityVector): number {
    const traits = Object.values((this.personalityVector as any)[cluster]) as number[];
    return traits.reduce((sum, val) => sum + val, 0) / traits.length;
  }

  /**
   * Update personality vector
   */
  updatePersonality(newVector: PersonalityVector): void {
    this.personalityVector = newVector;
  }

  /**
   * Get tone summary
   */
  getToneSummary(): {
    currentTone: string;
    intensity: number;
    characteristics: string[];
    styleGuide: {
      sentences: string;
      words: string;
      rhythm: string;
    };
  } {
    const profile = this.getBlendedProfile();
    const modifiers = this.getSentenceModifiers();
    const wordChoice = this.getWordChoiceGuidelines();
    const rhythm = this.getRhythmPattern();
    
    const characteristics: string[] = [];
    if (profile.warmthLevel > 70) characteristics.push('warm');
    if (profile.energyLevel > 70) characteristics.push('energetic');
    if (profile.supportLevel > 70) characteristics.push('supportive');
    if (profile.urgencyLevel > 70) characteristics.push('urgent');
    if (profile.formalityLevel > 70) characteristics.push('formal');
    if (profile.technicalDensity > 70) characteristics.push('technical');
    
    const toneDescription = this.currentTone.secondary 
      ? `${this.currentTone.primary} (${100 - this.currentTone.blendRatio}%) + ${this.currentTone.secondary} (${this.currentTone.blendRatio}%)`
      : this.currentTone.primary;
    
    return {
      currentTone: toneDescription,
      intensity: this.currentTone.intensity,
      characteristics,
      styleGuide: {
        sentences: `${modifiers.avgLength} words avg, ${profile.sentenceLength} length, ${modifiers.fragmentsAllowed ? 'fragments OK' : 'complete sentences'}`,
        words: `${wordChoice.vocabularyLevel} vocabulary, ${wordChoice.contractionUse}% contractions, ${wordChoice.emojiFrequency}% emoji use`,
        rhythm: `${rhythm.pauseFrequency.toFixed(1)} pauses/100 words, ${rhythm.burstiness}% burstiness, ${rhythm.buildup ? 'with buildup' : 'steady pace'}`,
      },
    };
  }

  /**
   * Get tone history
   */
  getToneHistory(): Array<{ timestamp: number; tone: BlendedTone }> {
    return [...this.toneHistory];
  }
}
