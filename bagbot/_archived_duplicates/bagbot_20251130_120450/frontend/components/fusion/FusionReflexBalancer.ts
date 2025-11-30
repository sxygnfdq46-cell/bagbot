/**
 * ⚖️ FUSION REFLEX BALANCER
 * 
 * Balances market reflex reactions with:
 * • your mood
 * • your energy
 * • your activity
 * • your focus depth
 * 
 * If the system wants to react aggressively, but you are calm → it slows down.
 * If the market is calm but you're intense → it amplifies sharpness + clarity.
 * 
 * This is true fusion.
 */

import type { UserPresenceSignature, SymbioticFusionState } from './SymbioticEnvironmentLink';
import type { PresenceMapping } from './EnvironmentPresenceMapper';
import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';

// ============================================
// TYPES
// ============================================

/**
 * Reflex behavior profile
 */
export interface ReflexProfile {
  // Response characteristics
  responseSpeed: number;         // 0-2 multiplier
  sensitivity: number;           // 0-1 how easily triggered
  aggressiveness: number;        // 0-1 how strong reactions are
  
  // Filtering
  noiseFilter: number;           // 0-1 how much to filter
  signalBoost: number;           // 0-2 signal amplification
  
  // Timing
  anticipationWindow: number;    // ms how far ahead to look
  reactionDelay: number;         // ms intentional delay
  
  // Behavior modes
  isDefensive: boolean;
  isAmplifying: boolean;
  isPredictive: boolean;
  isConservative: boolean;
}

/**
 * Reflex adjustment result
 */
export interface ReflexAdjustment {
  profile: ReflexProfile;
  
  // Balance metrics
  marketInfluence: number;       // 0-1
  userInfluence: number;         // 0-1
  fusionRatio: number;          // 0-1 how well balanced
  
  // Authority
  userHasControl: boolean;
  systemHasControl: boolean;
  sharedControl: boolean;
  
  // Visual feedback
  visualIntensity: number;       // 0-2
  glowPattern: 'steady' | 'pulsing' | 'breathing' | 'flickering';
  colorShift: number;            // -1 to 1 (cool to warm)
  
  timestamp: number;
}

/**
 * Balancing strategy
 */
export interface BalancingStrategy {
  name: string;
  description: string;
  
  // Conditions
  userCondition: (user: UserPresenceSignature) => boolean;
  marketCondition: (env: EnvironmentalState) => boolean;
  
  // Adjustments
  speedModifier: number;         // multiply response speed
  sensitivityModifier: number;   // multiply sensitivity
  filterStrength: number;        // 0-1
  
  priority: number;              // Higher = more important
}

// ============================================
// BALANCING STRATEGIES
// ============================================

export const BALANCING_STRATEGIES: BalancingStrategy[] = [
  // Strategy 1: Calm dominance
  {
    name: 'CALM_OVERRIDE',
    description: 'User calmness dampens market urgency',
    userCondition: (user) => user.emotionalTone === 'calm' && user.emotionalStability > 0.7,
    marketCondition: (env) => env.storms.stormIntensity > 50,
    speedModifier: 0.6,
    sensitivityModifier: 0.7,
    filterStrength: 0.3,
    priority: 9
  },
  
  // Strategy 2: Stress protection
  {
    name: 'STRESS_SHIELD',
    description: 'Protect user from overwhelming signals',
    userCondition: (user) => 
      (user.emotionalTone === 'stressed' || user.emotionalTone === 'anxious') && 
      user.emotionalStability < 0.4,
    marketCondition: (env) => env.pulse.stressIndex > 60,
    speedModifier: 0.5,
    sensitivityModifier: 0.4,
    filterStrength: 0.8,
    priority: 10
  },
  
  // Strategy 3: Focus amplification
  {
    name: 'FOCUS_AMPLIFY',
    description: 'High focus amplifies signal clarity',
    userCondition: (user) => user.focusDepth > 0.75,
    marketCondition: (env) => env.jetstream.trendStrength > 60,
    speedModifier: 1.3,
    sensitivityModifier: 1.2,
    filterStrength: 0.2,
    priority: 8
  },
  
  // Strategy 4: Excitement sync
  {
    name: 'EXCITEMENT_SYNC',
    description: 'User excitement matches market energy',
    userCondition: (user) => 
      (user.emotionalTone === 'excited' || user.emotionalTone === 'energized') &&
      user.emotionalIntensity > 0.7,
    marketCondition: (env) => env.flow.dominantFlow.strength > 60,
    speedModifier: 1.6,
    sensitivityModifier: 1.4,
    filterStrength: 0.1,
    priority: 7
  },
  
  // Strategy 5: Fatigue conservation
  {
    name: 'FATIGUE_CONSERVE',
    description: 'Reduce intensity when user is tired',
    userCondition: (user) => user.presenceStrength < 0.3 && user.focusDepth < 0.3,
    marketCondition: () => true,
    speedModifier: 0.4,
    sensitivityModifier: 0.5,
    filterStrength: 0.6,
    priority: 9
  },
  
  // Strategy 6: Confidence boost
  {
    name: 'CONFIDENCE_BOOST',
    description: 'Confidence enables aggressive positioning',
    userCondition: (user) => user.emotionalTone === 'confident' && user.emotionalIntensity > 0.6,
    marketCondition: (env) => env.gravity.fieldStrength > 50,
    speedModifier: 1.2,
    sensitivityModifier: 1.1,
    filterStrength: 0.3,
    priority: 7
  },
  
  // Strategy 7: Contemplative analysis
  {
    name: 'CONTEMPLATIVE_ANALYSIS',
    description: 'Deep thinking slows reflexes for analysis',
    userCondition: (user) => user.emotionalTone === 'contemplative' && user.focusDepth > 0.6,
    marketCondition: (env) => env.jetstream.trendStrength < 30,
    speedModifier: 0.8,
    sensitivityModifier: 0.9,
    filterStrength: 0.4,
    priority: 6
  },
  
  // Strategy 8: Microburst damping
  {
    name: 'MICROBURST_DAMP',
    description: 'User presence dampens volatility spikes',
    userCondition: (user) => user.presenceStrength > 0.8,
    marketCondition: (env) => env.microbursts.avgBurstMagnitude > 70,
    speedModifier: 0.5,
    sensitivityModifier: 0.6,
    filterStrength: 0.7,
    priority: 8
  },
  
  // Strategy 9: Flow state optimization
  {
    name: 'FLOW_OPTIMIZE',
    description: 'Perfect balance in flow state',
    userCondition: (user) => user.focusDepth > 0.8 && user.emotionalStability > 0.7,
    marketCondition: (env) => env.flow.dominantFlow.strength > 70 && env.coherence > 70,
    speedModifier: 1.2,
    sensitivityModifier: 1.1,
    filterStrength: 0.2,
    priority: 10
  },
  
  // Strategy 10: Emergency brake
  {
    name: 'EMERGENCY_BRAKE',
    description: 'Maximum protection in extreme conditions',
    userCondition: (user) => user.emotionalIntensity > 0.9 && user.emotionalStability < 0.2,
    marketCondition: (env) => env.storms.stormIntensity > 85 && env.microbursts.burstFrequency > 10,
    speedModifier: 0.3,
    sensitivityModifier: 0.3,
    filterStrength: 0.95,
    priority: 10
  }
];

// ============================================
// FUSION REFLEX BALANCER
// ============================================

export class FusionReflexBalancer {
  private currentProfile: ReflexProfile | null = null;
  private lastAdjustment: ReflexAdjustment | null = null;
  private adjustmentHistory: ReflexAdjustment[] = [];
  private maxHistorySize = 50;
  
  /**
   * Main balancing function
   * Returns adjusted reflex profile based on user + market
   */
  public balance(
    user: UserPresenceSignature,
    environment: EnvironmentalState,
    fusion: SymbioticFusionState,
    mapping: PresenceMapping
  ): ReflexAdjustment {
    // Find applicable strategies
    const activeStrategies = this.findActiveStrategies(user, environment);
    
    // Build base profile
    const baseProfile = this.buildBaseProfile(environment);
    
    // Apply strategies
    const adjustedProfile = this.applyStrategies(baseProfile, activeStrategies);
    
    // Apply fusion modifiers
    const fusionAdjustedProfile = this.applyFusionModifiers(adjustedProfile, fusion);
    
    // Apply user presence modifiers
    const finalProfile = this.applyPresenceModifiers(fusionAdjustedProfile, mapping, user);
    
    // Calculate balance metrics
    const balanceMetrics = this.calculateBalanceMetrics(user, environment, fusion);
    
    // Determine authority
    const authority = this.determineAuthority(mapping, fusion);
    
    // Generate visual feedback
    const visual = this.generateVisualFeedback(finalProfile, fusion, user);
    
    // Build adjustment result
    const adjustment: ReflexAdjustment = {
      profile: finalProfile,
      marketInfluence: balanceMetrics.marketInfluence,
      userInfluence: balanceMetrics.userInfluence,
      fusionRatio: balanceMetrics.fusionRatio,
      userHasControl: authority.userHasControl,
      systemHasControl: authority.systemHasControl,
      sharedControl: authority.sharedControl,
      visualIntensity: visual.intensity,
      glowPattern: visual.pattern,
      colorShift: visual.colorShift,
      timestamp: Date.now()
    };
    
    // Store
    this.currentProfile = finalProfile;
    this.lastAdjustment = adjustment;
    this.adjustmentHistory.push(adjustment);
    if (this.adjustmentHistory.length > this.maxHistorySize) {
      this.adjustmentHistory.shift();
    }
    
    return adjustment;
  }
  
  /**
   * Find active balancing strategies
   */
  private findActiveStrategies(
    user: UserPresenceSignature,
    environment: EnvironmentalState
  ): BalancingStrategy[] {
    return BALANCING_STRATEGIES
      .filter(strategy => 
        strategy.userCondition(user) && strategy.marketCondition(environment)
      )
      .sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Build base profile from market conditions
   */
  private buildBaseProfile(environment: EnvironmentalState): ReflexProfile {
    const volatility = environment.pulse.stressIndex / 100;
    const stormIntensity = environment.storms.stormIntensity / 100;
    
    return {
      responseSpeed: 1.0 + volatility * 0.5,
      sensitivity: 0.5 + stormIntensity * 0.3,
      aggressiveness: 0.5 + (environment.flow.dominantFlow.strength / 100) * 0.3,
      noiseFilter: 0.3,
      signalBoost: 1.0,
      anticipationWindow: 1000 + (environment.jetstream.trendStrength / 100) * 2000,
      reactionDelay: 100,
      isDefensive: stormIntensity > 0.7,
      isAmplifying: environment.flow.dominantFlow.strength > 70,
      isPredictive: environment.jetstream.trendStrength > 60,
      isConservative: environment.coherence < 50
    };
  }
  
  /**
   * Apply balancing strategies to profile
   */
  private applyStrategies(
    profile: ReflexProfile,
    strategies: BalancingStrategy[]
  ): ReflexProfile {
    if (strategies.length === 0) return profile;
    
    const adjusted = { ...profile };
    
    // Apply each strategy
    strategies.forEach(strategy => {
      adjusted.responseSpeed *= strategy.speedModifier;
      adjusted.sensitivity *= strategy.sensitivityModifier;
      adjusted.noiseFilter = Math.max(adjusted.noiseFilter, strategy.filterStrength);
    });
    
    // Clamp values
    adjusted.responseSpeed = Math.max(0.2, Math.min(2.0, adjusted.responseSpeed));
    adjusted.sensitivity = Math.max(0.1, Math.min(1.0, adjusted.sensitivity));
    adjusted.noiseFilter = Math.max(0, Math.min(1.0, adjusted.noiseFilter));
    
    return adjusted;
  }
  
  /**
   * Apply fusion state modifiers
   */
  private applyFusionModifiers(
    profile: ReflexProfile,
    fusion: SymbioticFusionState
  ): ReflexProfile {
    const adjusted = { ...profile };
    
    // Fusion balance affects response
    if (fusion.fusionBalance > 0.5) {
      // User dominant - slower, more filtered
      adjusted.responseSpeed *= 0.8;
      adjusted.noiseFilter = Math.min(1.0, adjusted.noiseFilter * 1.2);
    } else if (fusion.fusionBalance < -0.5) {
      // Market dominant - faster, more aggressive
      adjusted.responseSpeed *= 1.2;
      adjusted.aggressiveness = Math.min(1.0, adjusted.aggressiveness * 1.2);
    }
    
    // Defensive posture
    if (fusion.defensivePosture > 0.7) {
      adjusted.isDefensive = true;
      adjusted.noiseFilter = Math.min(1.0, adjusted.noiseFilter * 1.3);
      adjusted.reactionDelay += 50;
    }
    
    // Flow state
    if (fusion.inCoFlow) {
      adjusted.responseSpeed = 1.2;
      adjusted.sensitivity = 0.9;
      adjusted.signalBoost = 1.5;
      adjusted.isPredictive = true;
    }
    
    // Predictive glow
    if (fusion.predictiveGlow > 0.7) {
      adjusted.isPredictive = true;
      adjusted.anticipationWindow *= 1.5;
    }
    
    return adjusted;
  }
  
  /**
   * Apply user presence modifiers
   */
  private applyPresenceModifiers(
    profile: ReflexProfile,
    mapping: PresenceMapping,
    user: UserPresenceSignature
  ): ReflexProfile {
    const adjusted = { ...profile };
    
    // User authority
    if (mapping.userAuthorityLevel > 0.7) {
      adjusted.responseSpeed *= 0.9;
      adjusted.noiseFilter = Math.max(adjusted.noiseFilter, 0.5);
    }
    
    // Protection needed
    if (mapping.protectionNeeded) {
      adjusted.isDefensive = true;
      adjusted.noiseFilter = Math.max(adjusted.noiseFilter, 0.7);
      adjusted.signalBoost *= 1.3;
    }
    
    // Amplification needed
    if (mapping.amplificationNeeded) {
      adjusted.isAmplifying = true;
      adjusted.signalBoost *= 1.5;
      adjusted.responseSpeed *= 1.2;
    }
    
    // Elevation needed
    if (mapping.elevationNeeded) {
      adjusted.isPredictive = true;
      adjusted.anticipationWindow *= 1.3;
    }
    
    // Reflex speed multiplier from mapping
    adjusted.responseSpeed *= mapping.reflexSpeedMultiplier;
    
    // User sets rhythm
    if (mapping.userSetsRhythm) {
      adjusted.reactionDelay = Math.floor(60000 / user.breathingRate);
    }
    
    return adjusted;
  }
  
  /**
   * Calculate balance metrics
   */
  private calculateBalanceMetrics(
    user: UserPresenceSignature,
    environment: EnvironmentalState,
    fusion: SymbioticFusionState
  ): {
    marketInfluence: number;
    userInfluence: number;
    fusionRatio: number;
  } {
    const marketPressure = fusion.marketPressure;
    const userCalmness = fusion.userCalmness;
    
    const marketInfluence = marketPressure * (1 - user.presenceStrength * 0.3);
    const userInfluence = user.presenceStrength * (1 - marketPressure * 0.3);
    
    const total = marketInfluence + userInfluence;
    const balance = total > 0 ? Math.abs(marketInfluence - userInfluence) / total : 0;
    const fusionRatio = 1 - balance; // Higher = more balanced
    
    return {
      marketInfluence,
      userInfluence,
      fusionRatio
    };
  }
  
  /**
   * Determine who has control
   */
  private determineAuthority(
    mapping: PresenceMapping,
    fusion: SymbioticFusionState
  ): {
    userHasControl: boolean;
    systemHasControl: boolean;
    sharedControl: boolean;
  } {
    const userAuthority = mapping.userAuthorityLevel;
    const marketInfluence = mapping.marketInfluenceLevel;
    
    const userHasControl = userAuthority > 0.7 && marketInfluence < 0.4;
    const systemHasControl = marketInfluence > 0.7 && userAuthority < 0.4;
    const sharedControl = !userHasControl && !systemHasControl;
    
    return { userHasControl, systemHasControl, sharedControl };
  }
  
  /**
   * Generate visual feedback
   */
  private generateVisualFeedback(
    profile: ReflexProfile,
    fusion: SymbioticFusionState,
    user: UserPresenceSignature
  ): {
    intensity: number;
    pattern: 'steady' | 'pulsing' | 'breathing' | 'flickering';
    colorShift: number;
  } {
    // Intensity from profile
    const intensity = profile.responseSpeed * profile.sensitivity * profile.signalBoost / 2;
    
    // Pattern based on state
    let pattern: 'steady' | 'pulsing' | 'breathing' | 'flickering' = 'steady';
    
    if (fusion.inCoFlow) {
      pattern = 'breathing';
    } else if (profile.isDefensive) {
      pattern = 'steady';
    } else if (profile.isAmplifying) {
      pattern = 'pulsing';
    } else if (profile.aggressiveness > 0.7) {
      pattern = 'flickering';
    }
    
    // Color shift
    const userWarmth = user.emotionalTone === 'excited' || user.emotionalTone === 'energized' ? 0.7 : 0.3;
    const marketWarmth = profile.isAmplifying ? 0.6 : 0.4;
    const colorShift = (userWarmth * 0.6 + marketWarmth * 0.4) * 2 - 1; // -1 to 1
    
    return { intensity, pattern, colorShift };
  }
  
  /**
   * Get current profile
   */
  public getCurrentProfile(): ReflexProfile | null {
    return this.currentProfile;
  }
  
  /**
   * Get last adjustment
   */
  public getLastAdjustment(): ReflexAdjustment | null {
    return this.lastAdjustment;
  }
  
  /**
   * Get adjustment history
   */
  public getHistory(): ReflexAdjustment[] {
    return [...this.adjustmentHistory];
  }
  
  /**
   * Get active strategies for display
   */
  public getActiveStrategyNames(
    user: UserPresenceSignature,
    environment: EnvironmentalState
  ): string[] {
    return this.findActiveStrategies(user, environment)
      .map(s => s.name);
  }
}
