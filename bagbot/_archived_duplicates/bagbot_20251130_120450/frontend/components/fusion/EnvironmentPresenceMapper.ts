/**
 * 🗺️ ENVIRONMENT PRESENCE MAPPER
 * 
 * Maps your presence signals to environment states.
 * 
 * Examples:
 * • Davis = calm + market storm → UI stabilizes to match calmness
 * • Davis = stressed + momentum spike → Bot responds defensively to protect clarity
 * • Davis = focused + rising trend → Bot elevates predictive glow + HUD sharpness
 * • Davis = high presence + microburst → You override turbulence (bot trusts your clarity)
 * 
 * This gives you AUTHORITY over storms.
 */

import type { UserPresenceSignature, SymbioticFusionState } from './SymbioticEnvironmentLink';
import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';

// ============================================
// TYPES
// ============================================

/**
 * Presence mapping result
 */
export interface PresenceMapping {
  // Authority metrics
  userAuthorityLevel: number;      // 0-1 how much control user has
  marketInfluenceLevel: number;    // 0-1 how much market influences
  
  // Response modes
  stabilizationNeeded: boolean;    // Should UI calm down?
  amplificationNeeded: boolean;    // Should UI amplify signals?
  protectionNeeded: boolean;       // Should UI protect user?
  elevationNeeded: boolean;        // Should UI elevate predictive features?
  
  // Visual adjustments
  glowAdjustment: number;          // -1 to 1 glow change
  meshTensionAdjustment: number;   // -1 to 1 breathing change
  particleDensityAdjustment: number; // -1 to 1 particle count change
  
  // Behavioral shifts
  reflexSpeedMultiplier: number;   // 0.5 to 2 reflex speed
  signalClarityBoost: number;      // 0 to 1 signal filtering
  predictiveRangeExtension: number; // 0 to 1 how far ahead to look
  
  // Authority states
  userOverridesVolatility: boolean;
  userSetsRhythm: boolean;
  userDefinesClarity: boolean;
  
  timestamp: number;
}

/**
 * Presence scenario templates
 */
export interface PresenceScenario {
  name: string;
  description: string;
  
  // Matching conditions
  userConditions: Partial<UserPresenceSignature>;
  environmentConditions: Partial<EnvironmentalState>;
  
  // Mapping outputs
  mapping: Partial<PresenceMapping>;
}

// ============================================
// SCENARIO LIBRARY
// ============================================

export const PRESENCE_SCENARIOS: PresenceScenario[] = [
  // Scenario 1: Calm Authority (Davis calm in storm)
  {
    name: 'CALM_AUTHORITY',
    description: 'User calmness overrides market chaos',
    userConditions: {
      emotionalTone: 'calm',
      emotionalStability: 0.7,
      presenceStrength: 0.7
    },
    environmentConditions: {}, // Will check storms in logic
    mapping: {
      userAuthorityLevel: 0.8,
      marketInfluenceLevel: 0.3,
      stabilizationNeeded: true,
      glowAdjustment: -0.3,
      meshTensionAdjustment: -0.5,
      particleDensityAdjustment: -0.4,
      reflexSpeedMultiplier: 0.7,
      signalClarityBoost: 0.6,
      userOverridesVolatility: true
    }
  },
  
  // Scenario 2: Defensive Protection (Stressed + volatile)
  {
    name: 'DEFENSIVE_PROTECTION',
    description: 'System shields user from overwhelming market noise',
    userConditions: {
      emotionalTone: 'stressed',
      emotionalStability: 0.3
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.4,
      marketInfluenceLevel: 0.6,
      protectionNeeded: true,
      glowAdjustment: -0.2,
      meshTensionAdjustment: -0.3,
      particleDensityAdjustment: -0.6,
      reflexSpeedMultiplier: 0.6,
      signalClarityBoost: 0.8,
      userDefinesClarity: true
    }
  },
  
  // Scenario 3: Focused Elevation (Focused + strong trend)
  {
    name: 'FOCUSED_ELEVATION',
    description: 'High focus amplifies predictive capabilities',
    userConditions: {
      focusDepth: 0.75,
      interactionSpeed: 20
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.7,
      marketInfluenceLevel: 0.7,
      elevationNeeded: true,
      glowAdjustment: 0.5,
      meshTensionAdjustment: 0.2,
      particleDensityAdjustment: 0.3,
      reflexSpeedMultiplier: 1.3,
      predictiveRangeExtension: 0.7,
      userSetsRhythm: true
    }
  },
  
  // Scenario 4: Presence Override (High presence + microburst)
  {
    name: 'PRESENCE_OVERRIDE',
    description: 'Strong user presence dampens market volatility',
    userConditions: {
      presenceStrength: 0.85
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.9,
      marketInfluenceLevel: 0.2,
      stabilizationNeeded: true,
      glowAdjustment: -0.1,
      meshTensionAdjustment: -0.4,
      particleDensityAdjustment: -0.5,
      reflexSpeedMultiplier: 0.5,
      signalClarityBoost: 0.9,
      userOverridesVolatility: true,
      userDefinesClarity: true
    }
  },
  
  // Scenario 5: Ambient Rest (Low energy + calm market)
  {
    name: 'AMBIENT_REST',
    description: 'System enters minimal mode for rest',
    userConditions: {
      presenceStrength: 0.3,
      interactionSpeed: 8
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.3,
      marketInfluenceLevel: 0.3,
      stabilizationNeeded: true,
      glowAdjustment: -0.5,
      meshTensionAdjustment: -0.6,
      particleDensityAdjustment: -0.7,
      reflexSpeedMultiplier: 0.5,
      signalClarityBoost: 0.3
    }
  },
  
  // Scenario 6: Excitement Amplify (Excited + bullish)
  {
    name: 'EXCITEMENT_AMPLIFY',
    description: 'User excitement syncs with bullish momentum',
    userConditions: {
      emotionalTone: 'excited',
      emotionalIntensity: 0.7
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.6,
      marketInfluenceLevel: 0.8,
      amplificationNeeded: true,
      glowAdjustment: 0.6,
      meshTensionAdjustment: 0.4,
      particleDensityAdjustment: 0.5,
      reflexSpeedMultiplier: 1.6,
      predictiveRangeExtension: 0.5,
      userSetsRhythm: true
    }
  },
  
  // Scenario 7: Contemplative Depth (Contemplative + sideways)
  {
    name: 'CONTEMPLATIVE_DEPTH',
    description: 'Deep analysis mode in ranging markets',
    userConditions: {
      emotionalTone: 'contemplative',
      focusDepth: 0.65
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.7,
      marketInfluenceLevel: 0.4,
      elevationNeeded: false,
      glowAdjustment: 0.2,
      meshTensionAdjustment: 0.0,
      particleDensityAdjustment: 0.1,
      reflexSpeedMultiplier: 0.8,
      signalClarityBoost: 0.7,
      predictiveRangeExtension: 0.4
    }
  },
  
  // Scenario 8: Anxiety Shield (Anxious + high volatility)
  {
    name: 'ANXIETY_SHIELD',
    description: 'Maximum filtering to protect mental clarity',
    userConditions: {
      emotionalTone: 'anxious',
      emotionalStability: 0.3
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.5,
      marketInfluenceLevel: 0.3,
      protectionNeeded: true,
      glowAdjustment: -0.4,
      meshTensionAdjustment: -0.5,
      particleDensityAdjustment: -0.7,
      reflexSpeedMultiplier: 0.4,
      signalClarityBoost: 0.95,
      userDefinesClarity: true
    }
  },
  
  // Scenario 9: Confident Control (Confident + gravity pull)
  {
    name: 'CONFIDENT_CONTROL',
    description: 'Confidence stabilizes system during drops',
    userConditions: {
      emotionalTone: 'confident',
      emotionalIntensity: 0.6
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.75,
      marketInfluenceLevel: 0.5,
      stabilizationNeeded: false,
      amplificationNeeded: false,
      glowAdjustment: 0.3,
      meshTensionAdjustment: 0.0,
      particleDensityAdjustment: 0.2,
      reflexSpeedMultiplier: 1.0,
      signalClarityBoost: 0.5,
      predictiveRangeExtension: 0.6
    }
  },
  
  // Scenario 10: Fatigue Conservation (Fatigued + any)
  {
    name: 'FATIGUE_CONSERVATION',
    description: 'Reduce all intensity when user is tired',
    userConditions: {
      presenceStrength: 0.25,
      focusDepth: 0.25
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.2,
      marketInfluenceLevel: 0.4,
      stabilizationNeeded: true,
      glowAdjustment: -0.6,
      meshTensionAdjustment: -0.7,
      particleDensityAdjustment: -0.8,
      reflexSpeedMultiplier: 0.4,
      signalClarityBoost: 0.6
    }
  },
  
  // Scenario 11: Flow State Sync (Perfect conditions)
  {
    name: 'FLOW_STATE_SYNC',
    description: 'User and market in perfect harmony',
    userConditions: {
      focusDepth: 0.8,
      breathingRate: 75
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.8,
      marketInfluenceLevel: 0.8,
      elevationNeeded: true,
      amplificationNeeded: false,
      glowAdjustment: 0.4,
      meshTensionAdjustment: 0.1,
      particleDensityAdjustment: 0.3,
      reflexSpeedMultiplier: 1.2,
      signalClarityBoost: 0.8,
      predictiveRangeExtension: 0.8,
      userSetsRhythm: true,
      userDefinesClarity: true
    }
  },
  
  // Scenario 12: Overwhelm Emergency (Extreme conditions)
  {
    name: 'OVERWHELM_EMERGENCY',
    description: 'Emergency shield mode',
    userConditions: {
      emotionalIntensity: 0.9,
      emotionalStability: 0.2
    },
    environmentConditions: {},
    mapping: {
      userAuthorityLevel: 0.6,
      marketInfluenceLevel: 0.1,
      protectionNeeded: true,
      glowAdjustment: -0.7,
      meshTensionAdjustment: -0.8,
      particleDensityAdjustment: -0.9,
      reflexSpeedMultiplier: 0.3,
      signalClarityBoost: 0.99,
      userOverridesVolatility: true,
      userDefinesClarity: true
    }
  }
];

// ============================================
// ENVIRONMENT PRESENCE MAPPER
// ============================================

export class EnvironmentPresenceMapper {
  private lastMapping: PresenceMapping | null = null;
  private mappingHistory: PresenceMapping[] = [];
  private maxHistorySize = 50;
  
  /**
   * Main mapping function
   * Determines how user presence should modify environment
   */
  public mapPresence(
    user: UserPresenceSignature,
    environment: EnvironmentalState,
    fusion?: SymbioticFusionState
  ): PresenceMapping {
    // Find matching scenarios
    const matchingScenarios = this.findMatchingScenarios(user, environment);
    
    // If no scenarios match, use default
    if (matchingScenarios.length === 0) {
      return this.createDefaultMapping(user, environment);
    }
    
    // Aggregate scenario mappings
    const aggregatedMapping = this.aggregateScenarios(matchingScenarios);
    
    // Apply environmental modifiers
    const modifiedMapping = this.applyEnvironmentModifiers(
      aggregatedMapping,
      environment
    );
    
    // Apply fusion state if available
    const finalMapping = fusion
      ? this.applyFusionModifiers(modifiedMapping, fusion)
      : modifiedMapping;
    
    // Store in history
    this.lastMapping = finalMapping;
    this.mappingHistory.push(finalMapping);
    if (this.mappingHistory.length > this.maxHistorySize) {
      this.mappingHistory.shift();
    }
    
    return finalMapping;
  }
  
  /**
   * Find scenarios that match current conditions
   */
  private findMatchingScenarios(
    user: UserPresenceSignature,
    environment: EnvironmentalState
  ): PresenceScenario[] {
    return PRESENCE_SCENARIOS.filter(scenario => {
      const userMatch = this.matchesUserConditions(user, scenario.userConditions);
      const envMatch = this.matchesEnvironmentConditions(environment, scenario.environmentConditions);
      return userMatch && envMatch;
    });
  }
  
  /**
   * Check if user matches scenario conditions
   */
  private matchesUserConditions(
    user: UserPresenceSignature,
    conditions: Partial<UserPresenceSignature>
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      const userValue = user[key as keyof UserPresenceSignature];
      
      if (typeof value === 'string') {
        if (userValue !== value) return false;
      } else if (typeof value === 'number') {
        if (typeof userValue !== 'number') return false;
        // Allow 20% tolerance for numeric conditions
        if (Math.abs(userValue - value) > value * 0.2) return false;
      }
    }
    return true;
  }
  
  /**
   * Check if environment matches scenario conditions
   */
  private matchesEnvironmentConditions(
    environment: EnvironmentalState,
    conditions: Partial<EnvironmentalState>
  ): boolean {
    // If no conditions specified, always matches
    if (Object.keys(conditions).length === 0) return true;
    
    // Check nested conditions
    for (const [key, value] of Object.entries(conditions)) {
      const envValue = environment[key as keyof EnvironmentalState];
      if (JSON.stringify(envValue) !== JSON.stringify(value)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Aggregate multiple scenario mappings
   */
  private aggregateScenarios(scenarios: PresenceScenario[]): PresenceMapping {
    const base: PresenceMapping = {
      userAuthorityLevel: 0.5,
      marketInfluenceLevel: 0.5,
      stabilizationNeeded: false,
      amplificationNeeded: false,
      protectionNeeded: false,
      elevationNeeded: false,
      glowAdjustment: 0,
      meshTensionAdjustment: 0,
      particleDensityAdjustment: 0,
      reflexSpeedMultiplier: 1.0,
      signalClarityBoost: 0.5,
      predictiveRangeExtension: 0.3,
      userOverridesVolatility: false,
      userSetsRhythm: false,
      userDefinesClarity: false,
      timestamp: Date.now()
    };
    
    if (scenarios.length === 0) return base;
    
    // Average numeric values
    let totalAuthority = 0;
    let totalMarketInfluence = 0;
    let totalGlow = 0;
    let totalMesh = 0;
    let totalParticles = 0;
    let totalReflex = 0;
    let totalClarity = 0;
    let totalPredictive = 0;
    
    // Count boolean flags
    let stabilizationCount = 0;
    let amplificationCount = 0;
    let protectionCount = 0;
    let elevationCount = 0;
    let overrideVolatilityCount = 0;
    let setsRhythmCount = 0;
    let definesClarityCount = 0;
    
    scenarios.forEach(scenario => {
      const m = scenario.mapping;
      
      totalAuthority += m.userAuthorityLevel || 0.5;
      totalMarketInfluence += m.marketInfluenceLevel || 0.5;
      totalGlow += m.glowAdjustment || 0;
      totalMesh += m.meshTensionAdjustment || 0;
      totalParticles += m.particleDensityAdjustment || 0;
      totalReflex += m.reflexSpeedMultiplier || 1.0;
      totalClarity += m.signalClarityBoost || 0.5;
      totalPredictive += m.predictiveRangeExtension || 0.3;
      
      if (m.stabilizationNeeded) stabilizationCount++;
      if (m.amplificationNeeded) amplificationCount++;
      if (m.protectionNeeded) protectionCount++;
      if (m.elevationNeeded) elevationCount++;
      if (m.userOverridesVolatility) overrideVolatilityCount++;
      if (m.userSetsRhythm) setsRhythmCount++;
      if (m.userDefinesClarity) definesClarityCount++;
    });
    
    const count = scenarios.length;
    const halfCount = count / 2;
    
    return {
      userAuthorityLevel: totalAuthority / count,
      marketInfluenceLevel: totalMarketInfluence / count,
      stabilizationNeeded: stabilizationCount > halfCount,
      amplificationNeeded: amplificationCount > halfCount,
      protectionNeeded: protectionCount > halfCount,
      elevationNeeded: elevationCount > halfCount,
      glowAdjustment: totalGlow / count,
      meshTensionAdjustment: totalMesh / count,
      particleDensityAdjustment: totalParticles / count,
      reflexSpeedMultiplier: totalReflex / count,
      signalClarityBoost: totalClarity / count,
      predictiveRangeExtension: totalPredictive / count,
      userOverridesVolatility: overrideVolatilityCount > halfCount,
      userSetsRhythm: setsRhythmCount > halfCount,
      userDefinesClarity: definesClarityCount > halfCount,
      timestamp: Date.now()
    };
  }
  
  /**
   * Apply environment-specific modifiers
   */
  private applyEnvironmentModifiers(
    mapping: PresenceMapping,
    environment: EnvironmentalState
  ): PresenceMapping {
    const modified = { ...mapping };
    
    // High stress reduces user authority
    if (environment.pulse.stressIndex > 80) {
      modified.userAuthorityLevel *= 0.8;
      modified.marketInfluenceLevel *= 1.2;
    }
    
    // Strong trends boost predictive range
    if (environment.jetstream.trendStrength > 70) {
      modified.predictiveRangeExtension = Math.min(1, modified.predictiveRangeExtension * 1.3);
    }
    
    // Storms require protection
    if (environment.storms.stormIntensity > 70) {
      modified.protectionNeeded = true;
      modified.signalClarityBoost = Math.min(1, modified.signalClarityBoost * 1.2);
    }
    
    // Low coherence needs stabilization
    if (environment.coherence < 50) {
      modified.stabilizationNeeded = true;
      modified.reflexSpeedMultiplier *= 0.8;
    }
    
    return modified;
  }
  
  /**
   * Apply fusion state modifiers
   */
  private applyFusionModifiers(
    mapping: PresenceMapping,
    fusion: SymbioticFusionState
  ): PresenceMapping {
    const modified = { ...mapping };
    
    // If in co-flow, boost everything
    if (fusion.inCoFlow) {
      modified.userAuthorityLevel = Math.min(1, modified.userAuthorityLevel * 1.2);
      modified.reflexSpeedMultiplier *= 1.1;
      modified.predictiveRangeExtension = Math.min(1, modified.predictiveRangeExtension * 1.2);
      modified.userSetsRhythm = true;
    }
    
    // Fusion balance affects authority
    if (fusion.fusionBalance > 0.5) {
      // User dominant
      modified.userAuthorityLevel = Math.min(1, modified.userAuthorityLevel * 1.3);
      modified.marketInfluenceLevel *= 0.7;
    } else if (fusion.fusionBalance < -0.5) {
      // Market dominant
      modified.userAuthorityLevel *= 0.7;
      modified.marketInfluenceLevel = Math.min(1, modified.marketInfluenceLevel * 1.3);
    }
    
    return modified;
  }
  
  /**
   * Create default mapping when no scenarios match
   */
  private createDefaultMapping(
    user: UserPresenceSignature,
    environment: EnvironmentalState
  ): PresenceMapping {
    return {
      userAuthorityLevel: user.presenceStrength * 0.7,
      marketInfluenceLevel: environment.awareness / 100,
      stabilizationNeeded: environment.storms.stormIntensity > 50,
      amplificationNeeded: false,
      protectionNeeded: user.emotionalStability < 0.4,
      elevationNeeded: user.focusDepth > 0.7,
      glowAdjustment: 0,
      meshTensionAdjustment: 0,
      particleDensityAdjustment: 0,
      reflexSpeedMultiplier: 1.0,
      signalClarityBoost: 0.5,
      predictiveRangeExtension: user.focusDepth * 0.5,
      userOverridesVolatility: false,
      userSetsRhythm: false,
      userDefinesClarity: false,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get last mapping
   */
  public getLastMapping(): PresenceMapping | null {
    return this.lastMapping;
  }
  
  /**
   * Get mapping history
   */
  public getHistory(): PresenceMapping[] {
    return [...this.mappingHistory];
  }
  
  /**
   * Get active scenario names
   */
  public getActiveScenarios(
    user: UserPresenceSignature,
    environment: EnvironmentalState
  ): string[] {
    return this.findMatchingScenarios(user, environment)
      .map(s => s.name);
  }
}
