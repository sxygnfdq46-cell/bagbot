/**
 * 🗺️ REFLEX MAPPER
 * 
 * Maps environmental + emotional signals → specific reflex actions
 * The translation layer between detection and response
 */

import type { EnvironmentalState } from '../environmental/EnvironmentalConsciousnessCore';
import type { ReflexType, ReflexMode } from './ReflexEngine';

// Emotional state interface (compatible with cognitive fusion)
export interface EmotionalState {
  energy: number;       // 0-1
  valence: number;      // 0-1 (negative to positive)
  intensity: number;    // 0-1
  volatility: number;   // 0-1
  presence: number;     // 0-1
}

// ============================================
// SIGNAL PATTERNS
// ============================================

export interface SignalPattern {
  name: string;
  environmental: EnvironmentalSignal;
  emotional: EmotionalSignal;
  reflexAction: ReflexAction;
  priority: number;          // 0-10
}

export interface EnvironmentalSignal {
  type: 'weather' | 'flow' | 'gravity' | 'storms' | 'jetstream' | 'temperature' | 'microbursts' | 'pulse';
  condition: (env: EnvironmentalState) => boolean;
  intensity: (env: EnvironmentalState) => number;
}

export interface EmotionalSignal {
  type: 'energy' | 'valence' | 'intensity' | 'volatility' | 'presence';
  condition: (emo: EmotionalState) => boolean;
  intensity: (emo: EmotionalState) => number;
}

export interface ReflexAction {
  reflex: ReflexType;
  mode: ReflexMode;
  description: string;
  visualClass: string;
  audioTrigger?: string;
}

// ============================================
// REFLEX MAPPER
// ============================================

export class ReflexMapper {
  private patterns: SignalPattern[] = [];

  constructor() {
    this.initializePatterns();
  }

  // ============================================
  // PATTERN INITIALIZATION
  // ============================================

  private initializePatterns(): void {
    // Pattern 1: Volatility Spike + Stress → Defensive Pulse
    this.patterns.push({
      name: 'Volatility Emergency',
      environmental: {
        type: 'weather',
        condition: (env) => env.weather.temperature > 70,
        intensity: (env) => env.weather.temperature / 100
      },
      emotional: {
        type: 'volatility',
        condition: (emo) => emo.volatility > 0.6,
        intensity: (emo) => emo.volatility
      },
      reflexAction: {
        reflex: 'defensive_pulse',
        mode: 'defensive',
        description: 'Emergency defensive stance',
        visualClass: 'reflex-emergency-pulse',
        audioTrigger: 'alert-high'
      },
      priority: 10
    });

    // Pattern 2: Calm + Rising Momentum → Expansion Glow
    this.patterns.push({
      name: 'Confident Expansion',
      environmental: {
        type: 'jetstream',
        condition: (env) => env.jetstream.trendStrength > 50 && (env.jetstream.jetstream?.direction ?? 0) < 90,
        intensity: (env) => env.jetstream.trendStrength / 100
      },
      emotional: {
        type: 'valence',
        condition: (emo) => emo.valence > 0.6 && emo.volatility < 0.4,
        intensity: (emo) => emo.valence
      },
      reflexAction: {
        reflex: 'expansion_glow',
        mode: 'aggressive',
        description: 'Confident expansion posture',
        visualClass: 'reflex-expansion-glow',
        audioTrigger: 'confidence-rise'
      },
      priority: 7
    });

    // Pattern 3: Jetstream Pressure + Overclock → Rapid Cooling
    this.patterns.push({
      name: 'System Overclock',
      environmental: {
        type: 'jetstream',
        condition: (env) => env.jetstream.trendStrength > 75,
        intensity: (env) => env.jetstream.trendStrength / 100
      },
      emotional: {
        type: 'energy',
        condition: (emo) => emo.energy > 0.8,
        intensity: (emo) => emo.energy
      },
      reflexAction: {
        reflex: 'rapid_cooling',
        mode: 'defensive',
        description: 'Thermal regulation cycle',
        visualClass: 'reflex-rapid-cooling',
        audioTrigger: 'cooling-engage'
      },
      priority: 9
    });

    // Pattern 4: Liquidity Freeze → Blue Stasis Filter
    this.patterns.push({
      name: 'Liquidity Lockup',
      environmental: {
        type: 'temperature',
        condition: (env) => env.temperature.currentTemp < 30,
        intensity: (env) => 1 - (env.temperature.currentTemp / 100)
      },
      emotional: {
        type: 'valence',
        condition: (emo) => emo.valence < 0.4,
        intensity: (emo) => 1 - emo.valence
      },
      reflexAction: {
        reflex: 'stasis_filter',
        mode: 'calm',
        description: 'Protective stasis field',
        visualClass: 'reflex-stasis-filter',
        audioTrigger: 'freeze-engage'
      },
      priority: 8
    });

    // Pattern 5: Atmospheric Inversion → Polarity Shift
    this.patterns.push({
      name: 'Atmospheric Reversal',
      environmental: {
        type: 'weather',
        condition: (env) => Math.abs((env.weather.pressure - 50) / 50) > 0.6,
        intensity: (env) => Math.abs((env.weather.pressure - 50) / 50)
      },
      emotional: {
        type: 'valence',
        condition: (emo) => {
          // Emotional-environmental mismatch
          return Math.abs(emo.valence - 0.5) > 0.3;
        },
        intensity: (emo) => Math.abs(emo.valence - 0.5) * 2
      },
      reflexAction: {
        reflex: 'polarity_shift',
        mode: 'defensive',
        description: 'Polarity adaptation',
        visualClass: 'reflex-polarity-shift',
        audioTrigger: 'polarity-flip'
      },
      priority: 6
    });

    // Pattern 6: Microburst Spike → Shock Absorption
    this.patterns.push({
      name: 'Microburst Impact',
      environmental: {
        type: 'microbursts',
        condition: (env) => env.microbursts.burstEnergy > 70,
        intensity: (env) => env.microbursts.burstEnergy / 100
      },
      emotional: {
        type: 'volatility',
        condition: (emo) => emo.volatility > 0.5,
        intensity: (emo) => emo.volatility
      },
      reflexAction: {
        reflex: 'shock_absorption',
        mode: 'defensive',
        description: 'Impact dampening',
        visualClass: 'reflex-shock-absorption',
        audioTrigger: 'impact-absorb'
      },
      priority: 10
    });

    // Pattern 7: Heavy Momentum → Reinforcement
    this.patterns.push({
      name: 'Momentum Bracing',
      environmental: {
        type: 'gravity',
        condition: (env) => env.gravity.fieldStrength > 75,
        intensity: (env) => env.gravity.fieldStrength / 100
      },
      emotional: {
        type: 'intensity',
        condition: (emo) => emo.intensity > 0.6,
        intensity: (emo) => emo.intensity
      },
      reflexAction: {
        reflex: 'momentum_brace',
        mode: 'defensive',
        description: 'Structural reinforcement',
        visualClass: 'reflex-momentum-brace',
        audioTrigger: 'brace-engage'
      },
      priority: 8
    });

    // Pattern 8: High Energy + Low Volatility → Expansion
    this.patterns.push({
      name: 'Stable Expansion',
      environmental: {
        type: 'flow',
        condition: (env) => env.flow.dominantFlow.strength > 60,
        intensity: (env) => env.flow.dominantFlow.strength / 100
      },
      emotional: {
        type: 'energy',
        condition: (emo) => emo.energy > 0.7 && emo.volatility < 0.3,
        intensity: (emo) => emo.energy
      },
      reflexAction: {
        reflex: 'expansion_glow',
        mode: 'aggressive',
        description: 'Stable growth mode',
        visualClass: 'reflex-stable-expansion',
        audioTrigger: 'growth-engage'
      },
      priority: 5
    });

    // Pattern 9: Storm Activity → Multiple Reflexes
    this.patterns.push({
      name: 'Storm Response',
      environmental: {
        type: 'storms',
        condition: (env) => env.storms.stormIntensity > 60,
        intensity: (env) => env.storms.stormIntensity / 100
      },
      emotional: {
        type: 'volatility',
        condition: (emo) => emo.volatility > 0.5,
        intensity: (emo) => emo.volatility
      },
      reflexAction: {
        reflex: 'defensive_pulse',
        mode: 'defensive',
        description: 'Storm protection mode',
        visualClass: 'reflex-storm-defense',
        audioTrigger: 'storm-alert'
      },
      priority: 9
    });

    // Pattern 10: Calm Recovery State
    this.patterns.push({
      name: 'Recovery Mode',
      environmental: {
        type: 'pulse',
        condition: (env) => env.pulse.regularity > 60 && env.pulse.marketVitality > 70,
        intensity: (env) => env.pulse.marketVitality / 100
      },
      emotional: {
        type: 'valence',
        condition: (emo) => emo.valence > 0.5 && emo.volatility < 0.3,
        intensity: (emo) => emo.valence
      },
      reflexAction: {
        reflex: 'expansion_glow',
        mode: 'calm',
        description: 'Healing expansion',
        visualClass: 'reflex-recovery-glow',
        audioTrigger: 'recovery-pulse'
      },
      priority: 4
    });

    // Sort by priority (highest first)
    this.patterns.sort((a, b) => b.priority - a.priority);
  }

  // ============================================
  // MAPPING LOGIC
  // ============================================

  public mapSignalsToReflexes(
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): SignalPattern[] {
    const matchedPatterns: SignalPattern[] = [];

    for (const pattern of this.patterns) {
      // Check if both environmental and emotional conditions are met
      const envMatch = pattern.environmental.condition(environmental);
      const emoMatch = pattern.emotional.condition(emotional);

      if (envMatch && emoMatch) {
        matchedPatterns.push(pattern);
      }
    }

    // Return patterns sorted by priority
    return matchedPatterns;
  }

  public getBestReflex(
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): SignalPattern | null {
    const matches = this.mapSignalsToReflexes(environmental, emotional);
    return matches.length > 0 ? matches[0] : null;
  }

  public calculateReflexIntensity(
    pattern: SignalPattern,
    environmental: EnvironmentalState,
    emotional: EmotionalState
  ): number {
    const envIntensity = pattern.environmental.intensity(environmental);
    const emoIntensity = pattern.emotional.intensity(emotional);
    
    // Weighted average (environmental signals slightly more important)
    return envIntensity * 0.6 + emoIntensity * 0.4;
  }

  // ============================================
  // PATTERN QUERIES
  // ============================================

  public getPatternsByReflexType(reflexType: ReflexType): SignalPattern[] {
    return this.patterns.filter(p => p.reflexAction.reflex === reflexType);
  }

  public getPatternsByMode(mode: ReflexMode): SignalPattern[] {
    return this.patterns.filter(p => p.reflexAction.mode === mode);
  }

  public getAllPatterns(): SignalPattern[] {
    return [...this.patterns];
  }

  // ============================================
  // PATTERN EXAMPLES
  // ============================================

  public getExampleScenarios(): Array<{
    scenario: string;
    pattern: string;
    reflex: string;
    description: string;
  }> {
    return [
      {
        scenario: 'Volatility spike + stress',
        pattern: 'Volatility Emergency',
        reflex: 'Defensive Pulse',
        description: 'Red-violet emergency pulse, immediate defensive stance'
      },
      {
        scenario: 'Calm + rising momentum',
        pattern: 'Confident Expansion',
        reflex: 'Expansion Glow',
        description: 'Warm confident glow expansion, aggressive growth mode'
      },
      {
        scenario: 'Jetstream pressure + overclock',
        pattern: 'System Overclock',
        reflex: 'Rapid Cooling',
        description: 'Cyan cooling cycle, thermal regulation engaged'
      },
      {
        scenario: 'Liquidity freeze',
        pattern: 'Liquidity Lockup',
        reflex: 'Blue Stasis Filter',
        description: 'Protective blue filter, slow-motion preservation'
      },
      {
        scenario: 'Atmospheric inversion',
        pattern: 'Atmospheric Reversal',
        reflex: 'Polarity Shift',
        description: 'Yellow-white polarity adaptation, stance reversal'
      },
      {
        scenario: 'Microburst spikes',
        pattern: 'Microburst Impact',
        reflex: 'Shock Absorption',
        description: 'Ripple dampening effect, impact absorption'
      },
      {
        scenario: 'Heavy momentum',
        pattern: 'Momentum Bracing',
        reflex: 'Reinforced Glow Field',
        description: 'Blue structural reinforcement, brace for impact'
      }
    ];
  }
}
