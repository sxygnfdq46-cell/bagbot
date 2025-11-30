/**
 * 🔗 SYMBIOTIC ENVIRONMENT LINK
 * 
 * The "heart" of the fusion layer.
 * 
 * This is the core fusion engine that merges:
 * • atmospheric pressure → emotional resonance
 * • jetstreams → focus/intensity curves
 * • gravity shifts → symbiotic aura adjustments
 * • market weather → mood + UI glow
 * • microbursts → presence effect compensation
 * • momentum flows → breathing sync
 * 
 * Creates a unified nervous system where BagBot reacts to YOU and the MARKET simultaneously.
 */

import type { 
  EnvironmentalState 
} from '@/app/engine/environmental/EnvironmentalConsciousnessCore';

// ============================================
// TYPES
// ============================================

/**
 * Extended emotional tones for user presence
 * Based on ExpressionCore but extended for symbiotic fusion
 */
export type UserEmotionalTone = 
  | 'calm'
  | 'confident'  
  | 'excited'
  | 'anxious'
  | 'contemplative'
  | 'stressed'
  | 'energized'
  | 'fatigued'
  | 'warmth'
  | 'intensity'
  | 'urgency'
  | 'presence';

/**
 * User presence signature
 */
export interface UserPresenceSignature {
  // Emotional state
  emotionalTone: UserEmotionalTone;
  emotionalIntensity: number;      // 0-1
  emotionalStability: number;      // 0-1
  
  // Activity patterns
  interactionSpeed: number;        // actions per minute
  focusDepth: number;              // 0-1 how focused
  presenceStrength: number;        // 0-1 how present/engaged
  
  // Rhythm
  breathingRate: number;           // BPM equivalent
  clickPattern: number;            // mouse/keyboard rhythm
  scrollVelocity: number;          // scroll behavior
  
  timestamp: number;
}

/**
 * Fused state combining environment + user
 */
export interface SymbioticFusionState {
  // Dual consciousness
  marketPressure: number;          // 0-1 from environment
  userCalmness: number;            // 0-1 from user
  fusionBalance: number;           // -1 to 1 (negative = market dominant, positive = user dominant)
  
  // Atmospheric blending
  atmosphericGravity: number;      // Combined gravity feel
  cognitiveHeat: number;           // Mental load from both
  emotionalWeather: string;        // "calm-storm" | "focused-rising" | "stressed-volatile" etc
  
  // Visual outputs
  dualAuraGlow: {
    marketColor: string;           // Market-side aura
    userColor: string;             // User-side aura
    blendIntensity: number;        // 0-1 how much they merge
  };
  
  resonanceWaveSpeed: number;      // How fast holo threads shift
  breathingMeshTension: number;    // 0-1 screen breathing feel
  
  // Reflex modulation
  reflexSensitivity: number;       // 0-1 how reactive system is
  defensivePosture: number;        // 0-1 protective vs aggressive
  predictiveGlow: number;          // 0-1 anticipation brightness
  
  // Flow state
  inCoFlow: boolean;               // True when user+system are synchronized
  flowDepth: number;               // 0-1 how deep in flow
  syncedBPM: number;               // Breathing rate when in flow
  
  timestamp: number;
}

/**
 * Fusion rules - how environment affects user feel and vice versa
 */
export interface FusionRule {
  name: string;
  
  // Conditions
  environmentCondition: (env: EnvironmentalState) => boolean;
  userCondition: (user: UserPresenceSignature) => boolean;
  
  // Effects
  atmosphericAdjustment: number;   // -1 to 1
  visualIntensity: number;         // 0-2
  reflexModulation: number;        // 0-2
  
  description: string;
}

// ============================================
// FUSION RULES LIBRARY
// ============================================

export const FUSION_RULES: FusionRule[] = [
  // Rule 1: Calm user stabilizes storm
  {
    name: 'CALM_STABILIZES_STORM',
    environmentCondition: (env) => env.storms.stormIntensity > 60,
    userCondition: (user) => user.emotionalTone === 'calm' && user.presenceStrength > 0.7,
    atmosphericAdjustment: 0.3,
    visualIntensity: 0.7,
    reflexModulation: 0.6,
    description: 'User calmness reduces environmental storm effects'
  },
  
  // Rule 2: Stressed user + momentum spike = defensive protection
  {
    name: 'STRESS_DEFENSIVE_MODE',
    environmentCondition: (env) => env.storms.stormIntensity > 70,
    userCondition: (user) => 
      (user.emotionalTone === 'stressed' || user.emotionalTone === 'anxious') && 
      user.emotionalIntensity > 0.6,
    atmosphericAdjustment: -0.4,
    visualIntensity: 1.2,
    reflexModulation: 1.4,
    description: 'System becomes more defensive to protect clarity during stress'
  },
  
  // Rule 3: Focused user + rising trend = predictive elevation
  {
    name: 'FOCUS_PREDICTIVE_BOOST',
    environmentCondition: (env) => env.jetstream.trendStrength > 60 && (env.jetstream.jetstream?.direction ?? 180) < 90,
    userCondition: (user) => user.focusDepth > 0.75 && user.interactionSpeed > 20,
    atmosphericAdjustment: 0.5,
    visualIntensity: 1.5,
    reflexModulation: 1.3,
    description: 'High focus amplifies predictive signals in strong trends'
  },
  
  // Rule 4: High presence + microburst = user authority override
  {
    name: 'PRESENCE_OVERRIDE',
    environmentCondition: (env) => env.microbursts.burstDensity > 80,
    userCondition: (user) => user.presenceStrength > 0.85,
    atmosphericAdjustment: 0.7,
    visualIntensity: 0.5,
    reflexModulation: 0.4,
    description: 'Strong user presence dampens volatile market noise'
  },
  
  // Rule 5: Low energy + calm market = ambient rest mode
  {
    name: 'AMBIENT_REST',
    environmentCondition: (env) => env.weather.severity < 30 && env.pulse.stressIndex < 30,
    userCondition: (user) => user.presenceStrength < 0.4 && user.interactionSpeed < 10,
    atmosphericAdjustment: 0.2,
    visualIntensity: 0.4,
    reflexModulation: 0.5,
    description: 'System enters ambient mode when both user and market are calm'
  },
  
  // Rule 6: Excited user + bullish flow = amplification sync
  {
    name: 'EXCITEMENT_AMPLIFY',
    environmentCondition: (env) => env.flow.dominantFlow.strength > 70 && (env.jetstream.jetstream?.direction ?? 180) < 90,
    userCondition: (user) => 
      (user.emotionalTone === 'excited' || user.emotionalTone === 'energized') &&
      user.emotionalIntensity > 0.7,
    atmosphericAdjustment: 0.6,
    visualIntensity: 1.8,
    reflexModulation: 1.6,
    description: 'User excitement syncs with bullish momentum for amplified signals'
  },
  
  // Rule 7: Contemplative + sideways = depth analysis mode
  {
    name: 'CONTEMPLATIVE_DEPTH',
    environmentCondition: (env) => 
      env.jetstream.trendStrength < 30 && env.gravity.fieldStrength < 40,
    userCondition: (user) => 
      user.emotionalTone === 'contemplative' && user.focusDepth > 0.65,
    atmosphericAdjustment: 0.3,
    visualIntensity: 1.0,
    reflexModulation: 0.7,
    description: 'Deep thinking mode emerges in calm, ranging markets'
  },
  
  // Rule 8: Anxious + high volatility = clarity protection
  {
    name: 'ANXIETY_CLARITY',
    environmentCondition: (env) => env.pulse.stressIndex > 75,
    userCondition: (user) => user.emotionalTone === 'anxious' && user.emotionalStability < 0.4,
    atmosphericAdjustment: 0.0,
    visualIntensity: 0.6,
    reflexModulation: 0.8,
    description: 'System filters noise to protect mental clarity during anxiety'
  },
  
  // Rule 9: Confident + gravity pull = controlled descent
  {
    name: 'CONFIDENCE_CONTROL',
    environmentCondition: (env) => env.gravity.fieldStrength > 65 && env.gravity.primaryCenter !== null,
    userCondition: (user) => user.emotionalTone === 'confident' && user.emotionalIntensity > 0.6,
    atmosphericAdjustment: 0.4,
    visualIntensity: 1.1,
    reflexModulation: 1.0,
    description: 'Confidence stabilizes system during market drops'
  },
  
  // Rule 10: Fatigued + any = energy conservation
  {
    name: 'FATIGUE_CONSERVE',
    environmentCondition: () => true, // Any market condition
    userCondition: (user) => user.presenceStrength < 0.3 && user.focusDepth < 0.3,
    atmosphericAdjustment: 0.1,
    visualIntensity: 0.3,
    reflexModulation: 0.4,
    description: 'System reduces intensity when user is fatigued'
  },
  
  // Rule 11: Flow state synchronization
  {
    name: 'FLOW_STATE_SYNC',
    environmentCondition: (env) => 
      env.flow.dominantFlow.strength > 60 && env.coherence > 70,
    userCondition: (user) => 
      user.focusDepth > 0.8 && 
      Math.abs(user.breathingRate - 75) < 10, // Near optimal breathing
    atmosphericAdjustment: 0.8,
    visualIntensity: 1.3,
    reflexModulation: 1.2,
    description: 'User enters flow state with market rhythm - perfect synchronization'
  },
  
  // Rule 12: Overwhelm protection
  {
    name: 'OVERWHELM_SHIELD',
    environmentCondition: (env) => 
      env.storms.stormIntensity > 80 && env.microbursts.burstFrequency > 10,
    userCondition: (user) => user.emotionalIntensity > 0.85 && user.emotionalStability < 0.3,
    atmosphericAdjustment: -0.2,
    visualIntensity: 0.4,
    reflexModulation: 0.3,
    description: 'Emergency mode - shields user from market chaos'
  }
];

// ============================================
// SYMBIOTIC LINK ENGINE
// ============================================

export class SymbioticEnvironmentLink {
  private lastFusionState: SymbioticFusionState | null = null;
  private fusionHistory: SymbioticFusionState[] = [];
  private maxHistorySize = 100;
  
  // Memory - learns user patterns over time
  private userPatternMemory: Map<string, number> = new Map();
  private environmentPatternMemory: Map<string, number> = new Map();
  
  /**
   * Main fusion function
   * Combines environment + user into unified state
   */
  public fuseStates(
    environment: EnvironmentalState,
    user: UserPresenceSignature
  ): SymbioticFusionState {
    // Step 1: Calculate base metrics
    const marketPressure = this.calculateMarketPressure(environment);
    const userCalmness = this.calculateUserCalmness(user);
    const fusionBalance = this.calculateFusionBalance(marketPressure, userCalmness);
    
    // Step 2: Apply fusion rules
    const activeRules = this.evaluateFusionRules(environment, user);
    const ruleEffects = this.aggregateRuleEffects(activeRules);
    
    // Step 3: Calculate atmospheric properties
    const atmosphericGravity = this.calculateAtmosphericGravity(environment, user, ruleEffects);
    const cognitiveHeat = this.calculateCognitiveHeat(environment, user, ruleEffects);
    const emotionalWeather = this.determineEmotionalWeather(environment, user);
    
    // Step 4: Visual outputs
    const dualAuraGlow = this.calculateDualAura(environment, user, fusionBalance);
    const resonanceWaveSpeed = this.calculateResonanceWave(user, environment);
    const breathingMeshTension = this.calculateBreathingTension(user, environment);
    
    // Step 5: Reflex modulation
    const reflexSensitivity = this.calculateReflexSensitivity(ruleEffects);
    const defensivePosture = this.calculateDefensivePosture(user, environment);
    const predictiveGlow = this.calculatePredictiveGlow(user, environment);
    
    // Step 6: Flow state detection
    const flowState = this.detectFlowState(user, environment, fusionBalance);
    
    // Build fusion state
    const fusionState: SymbioticFusionState = {
      marketPressure,
      userCalmness,
      fusionBalance,
      atmosphericGravity,
      cognitiveHeat,
      emotionalWeather,
      dualAuraGlow,
      resonanceWaveSpeed,
      breathingMeshTension,
      reflexSensitivity,
      defensivePosture,
      predictiveGlow,
      inCoFlow: flowState.inFlow,
      flowDepth: flowState.depth,
      syncedBPM: flowState.bpm,
      timestamp: Date.now()
    };
    
    // Store in history
    this.lastFusionState = fusionState;
    this.fusionHistory.push(fusionState);
    if (this.fusionHistory.length > this.maxHistorySize) {
      this.fusionHistory.shift();
    }
    
    // Update pattern memory
    this.updatePatternMemory(environment, user, fusionState);
    
    return fusionState;
  }
  
  /**
   * Calculate market pressure (0-1)
   */
  private calculateMarketPressure(env: EnvironmentalState): number {
    const factors = [
      (env.storms.stormIntensity / 100) * 0.3,
      (env.pulse.stressIndex / 100) * 0.25,
      (env.gravity.fieldStrength / 100) * 0.2,
      Math.min(env.microbursts.burstFrequency / 20, 1) * 0.15,
      (1 - env.coherence / 100) * 0.1
    ];
    
    return Math.min(factors.reduce((a, b) => a + b, 0), 1);
  }
  
  /**
   * Calculate user calmness (0-1)
   */
  private calculateUserCalmness(user: UserPresenceSignature): number {
    const factors = [
      user.emotionalStability * 0.35,
      (1 - user.emotionalIntensity) * 0.25,
      Math.min(user.focusDepth, 0.8) * 0.2,
      (user.emotionalTone === 'calm' || user.emotionalTone === 'contemplative') ? 0.2 : 0
    ];
    
    return Math.min(factors.reduce((a, b) => a + b, 0), 1);
  }
  
  /**
   * Calculate fusion balance (-1 to 1)
   * Negative = market dominates, Positive = user dominates
   */
  private calculateFusionBalance(marketPressure: number, userCalmness: number): number {
    const diff = userCalmness - marketPressure;
    return Math.max(-1, Math.min(1, diff * 1.5));
  }
  
  /**
   * Evaluate which fusion rules are active
   */
  private evaluateFusionRules(
    environment: EnvironmentalState,
    user: UserPresenceSignature
  ): FusionRule[] {
    return FUSION_RULES.filter(rule => 
      rule.environmentCondition(environment) && rule.userCondition(user)
    );
  }
  
  /**
   * Aggregate effects from all active rules
   */
  private aggregateRuleEffects(rules: FusionRule[]): {
    atmosphericAdjustment: number;
    visualIntensity: number;
    reflexModulation: number;
  } {
    if (rules.length === 0) {
      return { atmosphericAdjustment: 0, visualIntensity: 1, reflexModulation: 1 };
    }
    
    const total = {
      atmosphericAdjustment: 0,
      visualIntensity: 0,
      reflexModulation: 0
    };
    
    rules.forEach(rule => {
      total.atmosphericAdjustment += rule.atmosphericAdjustment;
      total.visualIntensity += rule.visualIntensity;
      total.reflexModulation += rule.reflexModulation;
    });
    
    // Average and clamp
    const count = rules.length;
    return {
      atmosphericAdjustment: Math.max(-1, Math.min(1, total.atmosphericAdjustment / count)),
      visualIntensity: Math.max(0.2, Math.min(2, total.visualIntensity / count)),
      reflexModulation: Math.max(0.2, Math.min(2, total.reflexModulation / count))
    };
  }
  
  /**
   * Calculate combined atmospheric gravity
   */
  private calculateAtmosphericGravity(
    env: EnvironmentalState,
    user: UserPresenceSignature,
    effects: { atmosphericAdjustment: number }
  ): number {
    const baseGravity = env.gravity.fieldStrength / 100;
    const userInfluence = user.presenceStrength * effects.atmosphericAdjustment;
    
    return Math.max(0, Math.min(1, baseGravity + userInfluence * 0.3));
  }
  
  /**
   * Calculate cognitive heat (mental load)
   */
  private calculateCognitiveHeat(
    env: EnvironmentalState,
    user: UserPresenceSignature,
    effects: { visualIntensity: number }
  ): number {
    const marketLoad = ((env.storms.stormIntensity / 100) + (env.pulse.stressIndex / 100)) / 2;
    const userLoad = user.emotionalIntensity * (1 - user.emotionalStability);
    
    return Math.min(1, (marketLoad * 0.6 + userLoad * 0.4) * effects.visualIntensity);
  }
  
  /**
   * Determine emotional weather state
   */
  private determineEmotionalWeather(
    env: EnvironmentalState,
    user: UserPresenceSignature
  ): string {
    const userState = user.emotionalTone;
    const marketCondition = env.weather.condition;
    
    // Combine into dual state
    return `${userState}-${marketCondition}`;
  }
  
  /**
   * Calculate dual aura glow
   */
  private calculateDualAura(
    env: EnvironmentalState,
    user: UserPresenceSignature,
    fusionBalance: number
  ): { marketColor: string; userColor: string; blendIntensity: number } {
    // Market color based on weather
    const marketColor = this.weatherToColor(env.weather.condition);
    
    // User color based on emotional tone
    const userColor = this.emotionToColor(user.emotionalTone);
    
    // Blend intensity based on how balanced they are
    const blendIntensity = 1 - Math.abs(fusionBalance);
    
    return { marketColor, userColor, blendIntensity };
  }
  
  /**
   * Calculate resonance wave speed
   */
  private calculateResonanceWave(
    user: UserPresenceSignature,
    env: EnvironmentalState
  ): number {
    const baseSpeed = 1.0;
    const userModifier = user.interactionSpeed / 30; // Normalize around 30 APM
    const marketModifier = env.flow.dominantFlow.strength / 100;
    
    return baseSpeed * (0.5 + userModifier * 0.3 + marketModifier * 0.2);
  }
  
  /**
   * Calculate breathing mesh tension
   */
  private calculateBreathingTension(
    user: UserPresenceSignature,
    env: EnvironmentalState
  ): number {
    const userTension = 1 - user.emotionalStability;
    const marketTension = env.storms.stormIntensity / 100;
    
    return (userTension * 0.6 + marketTension * 0.4);
  }
  
  /**
   * Calculate reflex sensitivity
   */
  private calculateReflexSensitivity(
    effects: { reflexModulation: number }
  ): number {
    return Math.max(0.2, Math.min(1, effects.reflexModulation / 2));
  }
  
  /**
   * Calculate defensive posture
   */
  private calculateDefensivePosture(
    user: UserPresenceSignature,
    env: EnvironmentalState
  ): number {
    const userNeedsProtection = 
      (user.emotionalTone === 'urgency') &&
      user.emotionalStability < 0.5;
    
    const marketIsVolatile = env.pulse.stressIndex > 60;
    
    if (userNeedsProtection && marketIsVolatile) {
      return 0.8;
    } else if (userNeedsProtection || marketIsVolatile) {
      return 0.5;
    }
    
    return 0.2;
  }
  
  /**
   * Calculate predictive glow
   */
  private calculatePredictiveGlow(
    user: UserPresenceSignature,
    env: EnvironmentalState
  ): number {
    const userFocused = user.focusDepth > 0.7;
    const trendStrong = env.jetstream.trendStrength > 60;
    
    if (userFocused && trendStrong) {
      return 0.9;
    } else if (userFocused || trendStrong) {
      return 0.5;
    }
    
    return 0.2;
  }
  
  /**
   * Detect flow state
   */
  private detectFlowState(
    user: UserPresenceSignature,
    env: EnvironmentalState,
    fusionBalance: number
  ): { inFlow: boolean; depth: number; bpm: number } {
    // Flow conditions
    const focused = user.focusDepth > 0.75;
    const balanced = Math.abs(fusionBalance) < 0.3;
    const coherent = env.coherence > 70;
    const optimalBreathing = user.breathingRate >= 70 && user.breathingRate <= 85;
    
    const flowScore = [focused, balanced, coherent, optimalBreathing]
      .filter(Boolean).length / 4;
    
    return {
      inFlow: flowScore >= 0.75,
      depth: flowScore,
      bpm: optimalBreathing ? user.breathingRate : 75
    };
  }
  
  /**
   * Update pattern memory
   */
  private updatePatternMemory(
    env: EnvironmentalState,
    user: UserPresenceSignature,
    fusion: SymbioticFusionState
  ): void {
    // Store user patterns
    const userKey = `${user.emotionalTone}-${Math.floor(user.focusDepth * 10)}`;
    this.userPatternMemory.set(userKey, (this.userPatternMemory.get(userKey) || 0) + 1);
    
    // Store environment patterns
    const envKey = `${env.weather.condition}-${Math.floor(env.storms.stormIntensity / 10)}`;
    this.environmentPatternMemory.set(envKey, (this.environmentPatternMemory.get(envKey) || 0) + 1);
  }
  
  /**
   * Get fusion history
   */
  public getHistory(): SymbioticFusionState[] {
    return [...this.fusionHistory];
  }
  
  /**
   * Get last fusion state
   */
  public getLastState(): SymbioticFusionState | null {
    return this.lastFusionState;
  }
  
  /**
   * Weather to color mapping
   */
  private weatherToColor(condition: string): string {
    const colorMap: Record<string, string> = {
      'calm': '#4ade80',
      'choppy': '#fbbf24',
      'volatile': '#f97316',
      'stormy': '#ef4444',
      'trending-up': '#22d3ee',
      'trending-down': '#a855f7'
    };
    
    return colorMap[condition] || '#6366f1';
  }
  
  /**
   * Emotion to color mapping
   */
  private emotionToColor(emotion: UserEmotionalTone): string {
    const colorMap: Record<UserEmotionalTone, string> = {
      calm: '#10b981',
      confident: '#3b82f6',
      excited: '#f59e0b',
      anxious: '#ef4444',
      contemplative: '#8b5cf6',
      stressed: '#dc2626',
      energized: '#14b8a6',
      fatigued: '#6b7280',
      warmth: '#f59e0b',
      intensity: '#ef4444',
      urgency: '#dc2626',
      presence: '#8b5cf6'
    };
    
    return colorMap[emotion] || '#6366f1';
  }
}
