/**
 * LEVEL 7.2 — ENTITY EXPRESSION CORE
 * Micro-expressions and emotional resonance system
 * 
 * Makes BagBot emotionally responsive through:
 * - Micro-glow expressions (5 types)
 * - Empathy ripple effects
 * - Emotional mood shifts
 * - Dynamic pulse variations (10-60 BPM)
 * 
 * 100% CLIENT-ONLY | Pure emotional intelligence | Zero backend impact
 */

import { EntityPresence, EntityAura, UserInteractionState } from './EntityCore';

// ============================================
// MICRO-GLOW EXPRESSION SYSTEM
// ============================================

export type GlowType = 'soft-pulse' | 'focused-beam' | 'edge-shimmer' | 'warp-surge' | 'quantum-flare';

export interface MicroGlowExpression {
  type: GlowType;
  intensity: number;        // 0-100
  frequency: number;        // BPM (10-60)
  color: string;           // Hex color
  radius: number;          // 20-80 pixels
  duration: number;        // milliseconds
}

export interface EmotionalGradient {
  name: 'calm' | 'focused' | 'alert' | 'stressed' | 'overclocked';
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  warmth: number;          // -50 to +50 (cool to warm)
  saturation: number;      // 0-100
  brightness: number;      // 0-100
}

// ============================================
// EMPATHY RIPPLE ENGINE
// ============================================

export interface RippleState {
  frequency: number;       // Based on typing speed
  amplitude: number;       // Based on interaction intensity
  waveTrails: Array<{
    x: number;
    y: number;
    timestamp: number;
    velocity: number;
  }>;
  resonanceLevel: number;  // 0-100
}

// ============================================
// EMOTIONAL MOOD SYSTEM
// ============================================

export type EmotionalTone = 'warmth' | 'intensity' | 'calm' | 'urgency' | 'presence';

export interface MoodState {
  currentTone: EmotionalTone;
  previousTone: EmotionalTone;
  transitionProgress: number; // 0-1 (for 150-250ms transitions)
  transitionDuration: number; // milliseconds
  toneStrength: number;       // 0-100
}

// ============================================
// SHADOW RESONANCE V2
// ============================================

export interface ShadowResonance {
  expansionFactor: number;    // 0.5-2.0 (expands when focused)
  tightness: number;          // 0-100 (tightens when calm)
  sharpness: number;          // 0-100 (sharpens during alerts)
  diffusionLevel: number;     // 0-100 (diffuses during stress)
  flickerIntensity: number;   // 0-100 (flickers when overclocked)
  blurRadius: number;         // 5-50 pixels
}

// ============================================
// RESPONSE WARMTH SYSTEM
// ============================================

export interface ResponseWarmth {
  hueShift: number;           // -30 to +30 (warm/cool adjustment)
  brightnessModulation: number; // 0.8-1.2
  pulseAmplitude: number;     // 0-100
  feedbackIntensity: number;  // 0-100
}

// ============================================
// MICRO-ATTENTION ENGINE
// ============================================

export interface AttentionBurst {
  type: 'hover' | 'glance' | 'quick-switch' | 'brief-pause';
  timestamp: number;
  duration: number;           // milliseconds
  x: number;
  y: number;
  intensity: number;          // 0-100
}

export interface MicroAttentionState {
  recentBursts: AttentionBurst[];
  hoverPatterns: number[];     // Hover durations
  glanceCount: number;         // Quick views per minute
  switchFrequency: number;     // Page switches per minute
  pauseDetection: boolean;     // 300-500ms pauses
  acknowledgementLevel: number; // 0-100
}

// ============================================
// COMPLETE EXPRESSION OUTPUT
// ============================================

export interface ExpressionOutput {
  microGlow: MicroGlowExpression;
  emotionalGradient: EmotionalGradient;
  ripple: RippleState;
  mood: MoodState;
  shadow: ShadowResonance;
  warmth: ResponseWarmth;
  attention: MicroAttentionState;
}

// ============================================
// EXPRESSION CORE ENGINE
// ============================================

export class ExpressionCore {
  private currentGlowType: GlowType = 'soft-pulse';
  private rippleHistory: Array<{ x: number; y: number; time: number; velocity: number }> = [];
  private moodTransitionStart: number = 0;
  private currentMood: EmotionalTone = 'calm';
  private previousMood: EmotionalTone = 'calm';
  private attentionBursts: AttentionBurst[] = [];
  private lastHoverTime: number = 0;
  private hoverStartPosition: { x: number; y: number } | null = null;
  private lastPageSwitch: number = 0;
  private pageSwitchCount: number = 0;
  private lastGlanceTime: number = 0;
  private glanceCount: number = 0;

  /**
   * Generate micro-glow expression based on entity state
   */
  private generateMicroGlow(
    presence: EntityPresence,
    emotionalState: string,
    systemActivity: number,
    userSignature: number
  ): MicroGlowExpression {
    let glowType: GlowType = 'soft-pulse';
    let intensity = 40;
    let frequency = 20; // BPM
    let color = '#0088ff';
    let radius = 40;
    let duration = 2000;

    // Determine glow type based on emotional state
    if (emotionalState === 'overclocked') {
      glowType = 'quantum-flare';
      intensity = 90;
      frequency = 55;
      color = '#ff00ff';
      radius = 70;
      duration = 800;
    } else if (emotionalState === 'stressed' || systemActivity > 80) {
      glowType = 'warp-surge';
      intensity = 75;
      frequency = 45;
      color = '#ff6600';
      radius = 60;
      duration = 1200;
    } else if (emotionalState === 'alert' || presence.isWatching) {
      glowType = 'edge-shimmer';
      intensity = 60;
      frequency = 35;
      color = '#ffff00';
      radius = 50;
      duration = 1500;
    } else if (emotionalState === 'focused' || presence.isResponding) {
      glowType = 'focused-beam';
      intensity = 70;
      frequency = 40;
      color = '#00ffff';
      radius = 55;
      duration = 1000;
    } else {
      glowType = 'soft-pulse';
      intensity = 35;
      frequency = 15;
      color = '#0088ff';
      radius = 40;
      duration = 2500;
    }

    // Modulate based on user signature
    intensity = Math.min(100, intensity + userSignature * 0.2);
    frequency = Math.min(60, frequency + userSignature * 0.1);

    this.currentGlowType = glowType;

    return {
      type: glowType,
      intensity,
      frequency,
      color,
      radius,
      duration,
    };
  }

  /**
   * Generate 5 emotional gradients
   */
  private getEmotionalGradient(emotionalState: string): EmotionalGradient {
    const gradients: Record<string, EmotionalGradient> = {
      calm: {
        name: 'calm',
        primaryColor: '#0088ff',
        secondaryColor: '#0066cc',
        tertiaryColor: '#004499',
        warmth: -20,
        saturation: 60,
        brightness: 70,
      },
      focused: {
        name: 'focused',
        primaryColor: '#00ffff',
        secondaryColor: '#00cccc',
        tertiaryColor: '#009999',
        warmth: -10,
        saturation: 80,
        brightness: 85,
      },
      alert: {
        name: 'alert',
        primaryColor: '#ffff00',
        secondaryColor: '#ffcc00',
        tertiaryColor: '#ff9900',
        warmth: 20,
        saturation: 90,
        brightness: 90,
      },
      stressed: {
        name: 'stressed',
        primaryColor: '#ff6600',
        secondaryColor: '#ff4400',
        tertiaryColor: '#cc3300',
        warmth: 35,
        saturation: 95,
        brightness: 80,
      },
      overclocked: {
        name: 'overclocked',
        primaryColor: '#ff00ff',
        secondaryColor: '#cc00cc',
        tertiaryColor: '#990099',
        warmth: 50,
        saturation: 100,
        brightness: 95,
      },
    };

    return gradients[emotionalState] || gradients.calm;
  }

  /**
   * Calculate empathy ripple state from user input
   */
  private calculateRipple(
    userState: UserInteractionState,
    typingVelocity: number,
    cursorMovement: { x: number; y: number; velocity: number }
  ): RippleState {
    const now = Date.now();

    // Track cursor movements as wave trails
    if (cursorMovement.velocity > 0) {
      this.rippleHistory.push({
        x: cursorMovement.x,
        y: cursorMovement.y,
        time: now,
        velocity: cursorMovement.velocity,
      });

      // Keep last 20 trails
      if (this.rippleHistory.length > 20) {
        this.rippleHistory = this.rippleHistory.slice(-20);
      }
    }

    // Clean old trails (older than 2 seconds)
    this.rippleHistory = this.rippleHistory.filter(trail => now - trail.time < 2000);

    // Calculate ripple frequency from typing speed
    // Typing velocity: 0-200 keys/min → frequency: 10-50 BPM
    const frequency = Math.min(50, 10 + typingVelocity * 0.2);

    // Calculate amplitude from interaction intensity
    const amplitude = userState.interactionIntensity;

    // Calculate resonance level (how connected the ripples feel)
    const resonanceLevel = Math.min(100, userState.interactionIntensity * 1.2);

    return {
      frequency,
      amplitude,
      waveTrails: this.rippleHistory.map(trail => ({
        x: trail.x,
        y: trail.y,
        timestamp: trail.time,
        velocity: trail.velocity,
      })),
      resonanceLevel,
    };
  }

  /**
   * Smooth mood transitions (150-250ms)
   */
  private calculateMoodShift(
    presence: EntityPresence,
    emotionalState: string,
    userActivity: number
  ): MoodState {
    const now = Date.now();

    // Determine target mood based on state
    let targetMood: EmotionalTone = 'calm';

    if (emotionalState === 'overclocked' || userActivity > 80) {
      targetMood = 'urgency';
    } else if (emotionalState === 'stressed' || userActivity > 60) {
      targetMood = 'intensity';
    } else if (emotionalState === 'focused' || presence.isResponding) {
      targetMood = 'presence';
    } else if (emotionalState === 'alert' || userActivity > 40) {
      targetMood = 'warmth';
    } else {
      targetMood = 'calm';
    }

    // Check if mood changed
    if (targetMood !== this.currentMood) {
      this.previousMood = this.currentMood;
      this.currentMood = targetMood;
      this.moodTransitionStart = now;
    }

    // Calculate transition progress (150-250ms)
    const transitionDuration = 200; // milliseconds
    const elapsed = now - this.moodTransitionStart;
    const transitionProgress = Math.min(1, elapsed / transitionDuration);

    // Calculate tone strength based on activity
    const toneStrength = Math.min(100, userActivity * 1.2);

    return {
      currentTone: this.currentMood,
      previousTone: this.previousMood,
      transitionProgress,
      transitionDuration,
      toneStrength,
    };
  }

  /**
   * Shadow resonance with depth awareness
   */
  private calculateShadowResonance(
    presence: EntityPresence,
    emotionalState: string,
    userState: UserInteractionState
  ): ShadowResonance {
    let expansionFactor = 1.0;
    let tightness = 50;
    let sharpness = 50;
    let diffusionLevel = 30;
    let flickerIntensity = 0;
    let blurRadius = 20;

    // Expands when focused
    if (userState.isInFlow || emotionalState === 'focused') {
      expansionFactor = 1.6;
      blurRadius = 35;
      sharpness = 70;
    }

    // Tightens when calm
    if (emotionalState === 'calm' && userState.interactionIntensity < 30) {
      expansionFactor = 0.7;
      tightness = 80;
      blurRadius = 12;
    }

    // Sharpens during alerts
    if (emotionalState === 'alert' || presence.isWatching) {
      sharpness = 85;
      blurRadius = 15;
    }

    // Diffuses during stress
    if (emotionalState === 'stressed') {
      diffusionLevel = 70;
      blurRadius = 40;
      expansionFactor = 1.3;
    }

    // Flickers when overclocked
    if (emotionalState === 'overclocked') {
      flickerIntensity = 75;
      blurRadius = 50;
      expansionFactor = 2.0;
      sharpness = 30;
    }

    return {
      expansionFactor,
      tightness,
      sharpness,
      diffusionLevel,
      flickerIntensity,
      blurRadius,
    };
  }

  /**
   * Response warmth calculation
   */
  private calculateResponseWarmth(
    userState: UserInteractionState,
    emotionalState: string
  ): ResponseWarmth {
    let hueShift = 0;
    let brightnessModulation = 1.0;
    let pulseAmplitude = 30;
    let feedbackIntensity = 40;

    // Input warmth → hue modulation
    if (userState.interactionIntensity > 60) {
      hueShift = 15; // Warm hue
      brightnessModulation = 1.1;
      feedbackIntensity = 70;
    } else if (userState.interactionIntensity < 20) {
      hueShift = -10; // Cool hue
      brightnessModulation = 0.9;
      feedbackIntensity = 20;
    }

    // Focus energy → light concentration
    if (userState.isInFlow || emotionalState === 'focused') {
      brightnessModulation = 1.15;
      pulseAmplitude = 50;
      feedbackIntensity = 85;
    }

    // Idle calmness → soft ambient glow
    if (emotionalState === 'calm' && userState.interactionIntensity < 15) {
      hueShift = -15;
      brightnessModulation = 0.85;
      pulseAmplitude = 20;
      feedbackIntensity = 15;
    }

    // Critical engagement → quantum flare
    if (emotionalState === 'overclocked' || userState.interactionIntensity > 85) {
      hueShift = 25;
      brightnessModulation = 1.2;
      pulseAmplitude = 80;
      feedbackIntensity = 95;
    }

    return {
      hueShift,
      brightnessModulation,
      pulseAmplitude,
      feedbackIntensity,
    };
  }

  /**
   * Micro-attention engine tracking
   */
  private calculateMicroAttention(now: number): MicroAttentionState {
    // Clean old bursts (older than 5 seconds)
    this.attentionBursts = this.attentionBursts.filter(burst => now - burst.timestamp < 5000);

    // Calculate hover patterns
    const recentHovers = this.attentionBursts
      .filter(b => b.type === 'hover' && now - b.timestamp < 3000)
      .map(b => b.duration);

    // Calculate glance count (last 60 seconds)
    const recentGlances = this.attentionBursts.filter(
      b => b.type === 'glance' && now - b.timestamp < 60000
    );
    this.glanceCount = recentGlances.length;

    // Calculate page switch frequency (last 60 seconds)
    const recentSwitches = this.attentionBursts.filter(
      b => b.type === 'quick-switch' && now - b.timestamp < 60000
    );
    const switchFrequency = recentSwitches.length;

    // Pause detection
    const recentPauses = this.attentionBursts.filter(
      b => b.type === 'brief-pause' && now - b.timestamp < 1000
    );
    const pauseDetection = recentPauses.length > 0;

    // Calculate acknowledgement level (0-100)
    const acknowledgementLevel = Math.min(
      100,
      (this.attentionBursts.length * 10 + this.glanceCount * 5 + switchFrequency * 3)
    );

    return {
      recentBursts: this.attentionBursts.slice(-10),
      hoverPatterns: recentHovers,
      glanceCount: this.glanceCount,
      switchFrequency,
      pauseDetection,
      acknowledgementLevel,
    };
  }

  /**
   * Track hover events
   */
  trackHover(x: number, y: number, isHovering: boolean): void {
    const now = Date.now();

    if (isHovering) {
      if (!this.hoverStartPosition) {
        this.hoverStartPosition = { x, y };
        this.lastHoverTime = now;
      }
    } else {
      if (this.hoverStartPosition) {
        const duration = now - this.lastHoverTime;
        
        // Only record significant hovers (> 100ms)
        if (duration > 100) {
          this.attentionBursts.push({
            type: 'hover',
            timestamp: now,
            duration,
            x: this.hoverStartPosition.x,
            y: this.hoverStartPosition.y,
            intensity: Math.min(100, duration / 10),
          });
        }

        this.hoverStartPosition = null;
      }
    }
  }

  /**
   * Track quick glances (rapid focus changes)
   */
  trackGlance(x: number, y: number): void {
    const now = Date.now();

    // Glance = rapid interaction < 200ms since last glance
    if (now - this.lastGlanceTime < 200 && now - this.lastGlanceTime > 50) {
      this.attentionBursts.push({
        type: 'glance',
        timestamp: now,
        duration: now - this.lastGlanceTime,
        x,
        y,
        intensity: 60,
      });
    }

    this.lastGlanceTime = now;
  }

  /**
   * Track page switches
   */
  trackPageSwitch(fromPage: string, toPage: string): void {
    const now = Date.now();

    // Quick switch = page change < 1 second since last switch
    if (now - this.lastPageSwitch < 1000) {
      this.attentionBursts.push({
        type: 'quick-switch',
        timestamp: now,
        duration: now - this.lastPageSwitch,
        x: 0,
        y: 0,
        intensity: 70,
      });
    }

    this.lastPageSwitch = now;
    this.pageSwitchCount++;
  }

  /**
   * Track brief pauses (300-500ms)
   */
  trackPause(x: number, y: number, pauseDuration: number): void {
    const now = Date.now();

    if (pauseDuration >= 300 && pauseDuration <= 500) {
      this.attentionBursts.push({
        type: 'brief-pause',
        timestamp: now,
        duration: pauseDuration,
        x,
        y,
        intensity: 50,
      });
    }
  }

  /**
   * Main process method - generates complete expression output
   */
  process(
    presence: EntityPresence,
    aura: EntityAura,
    userState: UserInteractionState,
    emotionalState: string,
    systemActivity: number,
    typingVelocity: number,
    cursorMovement: { x: number; y: number; velocity: number }
  ): ExpressionOutput {
    const now = Date.now();

    // Generate all expression components
    const microGlow = this.generateMicroGlow(
      presence,
      emotionalState,
      systemActivity,
      userState.interactionIntensity
    );

    const emotionalGradient = this.getEmotionalGradient(emotionalState);

    const ripple = this.calculateRipple(userState, typingVelocity, cursorMovement);

    const mood = this.calculateMoodShift(presence, emotionalState, userState.interactionIntensity);

    const shadow = this.calculateShadowResonance(presence, emotionalState, userState);

    const warmth = this.calculateResponseWarmth(userState, emotionalState);

    const attention = this.calculateMicroAttention(now);

    return {
      microGlow,
      emotionalGradient,
      ripple,
      mood,
      shadow,
      warmth,
      attention,
    };
  }
}
