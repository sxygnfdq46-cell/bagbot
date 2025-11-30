/**
 * 🌡️ ENVIRONMENTAL EMOTION MAPPER (EEM)
 * 
 * Converts environmental metrics into emotional tone modifiers.
 * Lets BagBot "FEEL" the external market conditions.
 */

import type { 
  MarketWeatherState, 
  FlowFieldState, 
  VolumeGravityState,
  TrendJetstreamState,
  MicroburstSensorState,
  LiquidityThermostatState
} from '../environmental';

export interface EnvironmentalEmotionState {
  // Emotional state multipliers (0-2, where 1 = neutral)
  calmBoost: number;           // Clear weather increases calm
  alertnessSpike: number;      // Storms/microbursts increase alertness
  stressLoad: number;          // Gravity pressure + flow turbulence
  overclockTrigger: number;    // Jetstream + high momentum
  resonanceLevel: number;      // How aligned environment is
  
  // Dominant environmental emotion
  dominantEmotion: EnvironmentalEmotion;
  emotionIntensity: number;    // 0-100
  
  // Environmental feeling
  marketFeeling: MarketFeeling;
  feelingConfidence: number;   // 0-100
}

export type EnvironmentalEmotion = 
  | 'calm'           // Clear weather, low volatility
  | 'alert'          // Storms approaching, microbursts
  | 'stressed'       // High turbulence, pressure
  | 'overclocked'    // Jetstream + momentum surge
  | 'uncertain'      // Fog, conflicting signals
  | 'excited'        // Strong flow, building energy
  | 'anxious'        // Pre-storm tension
  | 'focused';       // Stable jetstream

export type MarketFeeling = 
  | 'serene'         // Everything calm
  | 'tense'          // Building pressure
  | 'chaotic'        // High turbulence
  | 'powerful'       // Strong momentum
  | 'uncertain'      // Conflicting signals
  | 'electric';      // High energy, microbursts

export interface EmotionMappingInput {
  weather: MarketWeatherState;
  flow: FlowFieldState;
  gravity: VolumeGravityState;
  jetstream: TrendJetstreamState;
  microbursts: MicroburstSensorState;
  temperature: LiquidityThermostatState;
}

export class EnvironmentalEmotionMapper {
  private state: EnvironmentalEmotionState;
  private history: EnvironmentalEmotionState[];
  private readonly HISTORY_SIZE = 100;

  constructor() {
    this.state = this.getDefaultState();
    this.history = [];
  }

  private getDefaultState(): EnvironmentalEmotionState {
    return {
      calmBoost: 1.0,
      alertnessSpike: 1.0,
      stressLoad: 1.0,
      overclockTrigger: 1.0,
      resonanceLevel: 0.5,
      dominantEmotion: 'calm',
      emotionIntensity: 50,
      marketFeeling: 'serene',
      feelingConfidence: 70
    };
  }

  // ============================================
  // UPDATE
  // ============================================

  public update(input: EmotionMappingInput): EnvironmentalEmotionState {
    // Calculate emotional multipliers from environment
    this.calculateCalmBoost(input.weather, input.temperature);
    this.calculateAlertnessSpike(input.microbursts, input.weather);
    this.calculateStressLoad(input.flow, input.gravity);
    this.calculateOverclockTrigger(input.jetstream, input.gravity);
    this.calculateResonanceLevel(input);

    // Determine dominant emotion
    this.determineDominantEmotion(input);

    // Classify market feeling
    this.classifyMarketFeeling(input);

    // Store in history
    this.history.push({ ...this.state });
    if (this.history.length > this.HISTORY_SIZE) {
      this.history.shift();
    }

    return this.state;
  }

  // ============================================
  // CALM BOOST
  // ============================================

  private calculateCalmBoost(
    weather: MarketWeatherState,
    temperature: LiquidityThermostatState
  ): void {
    let boost = 1.0;

    // Clear weather increases calm
    if (weather.condition === 'clear') {
      boost += 0.3;
    } else if (weather.condition === 'partly_cloudy') {
      boost += 0.15;
    } else if (weather.condition === 'fog') {
      boost -= 0.2; // Uncertainty reduces calm
    } else if (weather.condition === 'thunderstorm' || weather.condition === 'blizzard') {
      boost -= 0.4; // Storms destroy calm
    }

    // Low temperature (low volatility) increases calm
    if (weather.temperature < 30) {
      boost += 0.2;
    }

    // Good liquidity increases calm
    if (temperature.liquidityHealth > 70) {
      boost += 0.15;
    }

    // Low severity increases calm
    if (weather.severity < 30) {
      boost += 0.1;
    }

    this.state.calmBoost = Math.max(0.3, Math.min(2.0, boost));
  }

  // ============================================
  // ALERTNESS SPIKE
  // ============================================

  private calculateAlertnessSpike(
    microbursts: MicroburstSensorState,
    weather: MarketWeatherState
  ): void {
    let spike = 1.0;

    // Microbursts trigger alertness
    const burstCount = microbursts.activeBursts.length;
    if (burstCount > 0) {
      spike += burstCount * 0.15;
    }

    // High burst frequency = sustained alertness
    if (microbursts.burstFrequency > 5) {
      spike += 0.3;
    }

    // Forecast probability increases alertness
    if (microbursts.forecastConfidence > 70 && microbursts.nextBurstProbability > 60) {
      spike += 0.25;
    }

    // Storms increase alertness
    if (weather.condition === 'thunderstorm' || weather.condition === 'heavy_rain') {
      spike += 0.2;
    }

    // High severity increases alertness
    if (weather.severity > 70) {
      spike += 0.3;
    }

    this.state.alertnessSpike = Math.max(0.5, Math.min(2.5, spike));
  }

  // ============================================
  // STRESS LOAD
  // ============================================

  private calculateStressLoad(
    flow: FlowFieldState,
    gravity: VolumeGravityState
  ): void {
    let stress = 1.0;

    // High turbulence increases stress
    if (flow.turbulence > 60) {
      stress += (flow.turbulence - 60) / 100;
    }

    // Low coherence (conflicting flows) increases stress
    if (flow.coherence < 40) {
      stress += (40 - flow.coherence) / 80;
    }

    // High distortion (gravity field warping) increases stress
    if (gravity.distortion > 50) {
      stress += (gravity.distortion - 50) / 100;
    }

    // Low stability increases stress
    if (gravity.stability < 50) {
      stress += (50 - gravity.stability) / 100;
    }

    // Multiple vortices create stress
    const vortexCount = flow.vortices.length;
    if (vortexCount > 2) {
      stress += (vortexCount - 2) * 0.1;
    }

    this.state.stressLoad = Math.max(0.5, Math.min(2.5, stress));
  }

  // ============================================
  // OVERCLOCK TRIGGER
  // ============================================

  private calculateOverclockTrigger(
    jetstream: TrendJetstreamState,
    gravity: VolumeGravityState
  ): void {
    let overclock = 1.0;

    // Active jetstream increases overclock
    if (jetstream.jetstream) {
      const velocity = jetstream.jetstream.velocity;
      const width = jetstream.jetstream.width;
      
      if (velocity > 70) {
        overclock += 0.4;
      }
      
      if (width > 70) {
        overclock += 0.3; // Wide jetstream = sustained overclock
      }
    }

    // High trend strength increases overclock
    if (jetstream.trendStrength > 60) {
      overclock += (jetstream.trendStrength - 60) / 100;
    }

    // High field strength (volume gravity) increases overclock
    if (gravity.fieldStrength > 60) {
      overclock += (gravity.fieldStrength - 60) / 100;
    }

    // Strong tide (oscillation) can trigger overclock
    if (gravity.tideStrength > 70) {
      overclock += 0.2;
    }

    this.state.overclockTrigger = Math.max(0.5, Math.min(2.5, overclock));
  }

  // ============================================
  // RESONANCE LEVEL
  // ============================================

  private calculateResonanceLevel(input: EmotionMappingInput): void {
    // Resonance = how aligned all environmental systems are
    
    const factors: number[] = [];

    // Weather clarity contributes to resonance
    factors.push(input.weather.visibility);

    // Flow coherence contributes
    factors.push(input.flow.coherence);

    // Gravity stability contributes
    factors.push(input.gravity.stability);

    // Jetstream stability contributes
    factors.push(input.jetstream.trendStability);

    // Low turbulence contributes
    factors.push(100 - input.flow.turbulence);

    // Low microburst density contributes (calm = resonant)
    factors.push(100 - input.microbursts.burstDensity);

    // Calculate average
    const avgResonance = factors.reduce((sum, f) => sum + f, 0) / factors.length;

    // Check for alignment (all pointing same direction)
    let alignment = 0;
    
    // Weather + jetstream alignment
    const weatherBullish = input.weather.pressure > 60;
    const jetstreamBullish = input.jetstream.jetstream && 
      (input.jetstream.jetstream.direction < 90 || input.jetstream.jetstream.direction > 270);
    
    if (weatherBullish === jetstreamBullish) {
      alignment += 25;
    }

    // Flow alignment with jetstream
    const flowBullish = input.flow.dominantFlow.direction < 90 || 
                        input.flow.dominantFlow.direction > 270;
    
    if (flowBullish === jetstreamBullish) {
      alignment += 25;
    }

    // Combine resonance and alignment
    this.state.resonanceLevel = (avgResonance * 0.7 + alignment * 0.3) / 100;
  }

  // ============================================
  // DOMINANT EMOTION
  // ============================================

  private determineDominantEmotion(input: EmotionMappingInput): void {
    const emotions: Array<{ emotion: EnvironmentalEmotion; score: number }> = [];

    // Calm: clear weather, low volatility, high liquidity
    const calmScore = 
      (input.weather.condition === 'clear' ? 30 : 0) +
      (input.weather.temperature < 30 ? 20 : 0) +
      (input.temperature.liquidityHealth > 70 ? 25 : 0) +
      (input.microbursts.activeBursts.length === 0 ? 25 : 0);
    emotions.push({ emotion: 'calm', score: calmScore });

    // Alert: storms, microbursts, high severity
    const alertScore = 
      (input.weather.condition === 'thunderstorm' ? 40 : 0) +
      (input.microbursts.activeBursts.length * 15) +
      (input.weather.severity > 70 ? 30 : 0) +
      (input.microbursts.forecastConfidence > 70 ? 15 : 0);
    emotions.push({ emotion: 'alert', score: alertScore });

    // Stressed: high turbulence, distortion, conflicting signals
    const stressedScore = 
      (input.flow.turbulence > 60 ? 30 : 0) +
      (input.gravity.distortion > 50 ? 25 : 0) +
      (input.flow.coherence < 40 ? 25 : 0) +
      (input.jetstream.shearZones.length * 10);
    emotions.push({ emotion: 'stressed', score: stressedScore });

    // Overclocked: jetstream + high momentum
    const overclockedScore = 
      (input.jetstream.jetstream ? 40 : 0) +
      (input.jetstream.trendStrength > 60 ? 30 : 0) +
      (input.gravity.fieldStrength > 60 ? 20 : 0) +
      (input.jetstream.jetstream?.velocity || 0 > 70 ? 10 : 0);
    emotions.push({ emotion: 'overclocked', score: overclockedScore });

    // Uncertain: fog, low visibility, conflicting winds
    const uncertainScore = 
      (input.weather.condition === 'fog' ? 50 : 0) +
      (input.weather.visibility < 40 ? 30 : 0) +
      (input.jetstream.crossCurrents.length * 10) +
      (this.state.resonanceLevel < 0.3 ? 10 : 0);
    emotions.push({ emotion: 'uncertain', score: uncertainScore });

    // Excited: building energy, strong flow, pre-storm
    const excitedScore = 
      (input.flow.dominantFlow.strength > 70 ? 30 : 0) +
      (input.gravity.tideStrength > 60 ? 25 : 0) +
      (input.microbursts.burstEnergy > 60 ? 25 : 0) +
      (input.weather.severity > 40 && input.weather.severity < 70 ? 20 : 0);
    emotions.push({ emotion: 'excited', score: excitedScore });

    // Anxious: building storms, forecast warnings
    const anxiousScore = 
      (input.weather.condition === 'overcast' ? 30 : 0) +
      (input.microbursts.nextBurstProbability > 60 ? 30 : 0) +
      (input.weather.severity > 50 && input.weather.condition !== 'thunderstorm' ? 25 : 0) +
      (input.gravity.distortion > 40 ? 15 : 0);
    emotions.push({ emotion: 'anxious', score: anxiousScore });

    // Focused: stable jetstream, aligned systems
    const focusedScore = 
      (input.jetstream.jetstream && input.jetstream.trendStability > 70 ? 50 : 0) +
      (this.state.resonanceLevel > 0.7 ? 30 : 0) +
      (input.flow.coherence > 70 ? 20 : 0);
    emotions.push({ emotion: 'focused', score: focusedScore });

    // Find highest score
    emotions.sort((a, b) => b.score - a.score);
    
    this.state.dominantEmotion = emotions[0].emotion;
    this.state.emotionIntensity = Math.min(100, emotions[0].score);
  }

  // ============================================
  // MARKET FEELING
  // ============================================

  private classifyMarketFeeling(input: EmotionMappingInput): void {
    // Serene: calm, clear, low energy
    if (
      input.weather.condition === 'clear' &&
      input.weather.severity < 30 &&
      input.microbursts.activeBursts.length === 0 &&
      input.flow.turbulence < 40
    ) {
      this.state.marketFeeling = 'serene';
      this.state.feelingConfidence = 90;
      return;
    }

    // Electric: high energy, microbursts, strong momentum
    if (
      input.microbursts.activeBursts.length > 2 ||
      input.microbursts.burstFrequency > 8 ||
      (input.jetstream.jetstream && input.jetstream.jetstream.velocity > 80)
    ) {
      this.state.marketFeeling = 'electric';
      this.state.feelingConfidence = 85;
      return;
    }

    // Chaotic: high turbulence, distortion, conflicting signals
    if (
      input.flow.turbulence > 70 ||
      input.gravity.distortion > 60 ||
      input.jetstream.shearZones.length > 2
    ) {
      this.state.marketFeeling = 'chaotic';
      this.state.feelingConfidence = 80;
      return;
    }

    // Powerful: strong jetstream, high field strength
    if (
      input.jetstream.jetstream &&
      input.jetstream.trendStrength > 70 &&
      input.gravity.fieldStrength > 60
    ) {
      this.state.marketFeeling = 'powerful';
      this.state.feelingConfidence = 85;
      return;
    }

    // Uncertain: fog, low visibility, conflicting winds
    if (
      input.weather.condition === 'fog' ||
      input.weather.visibility < 40 ||
      this.state.resonanceLevel < 0.3
    ) {
      this.state.marketFeeling = 'uncertain';
      this.state.feelingConfidence = 75;
      return;
    }

    // Tense: building pressure, pre-storm
    this.state.marketFeeling = 'tense';
    this.state.feelingConfidence = 70;
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): EnvironmentalEmotionState {
    return { ...this.state };
  }

  public getEmotionalMultipliers() {
    return {
      calm: this.state.calmBoost,
      alertness: this.state.alertnessSpike,
      stress: this.state.stressLoad,
      overclock: this.state.overclockTrigger,
      resonance: this.state.resonanceLevel
    };
  }

  public getDominantEmotion() {
    return {
      emotion: this.state.dominantEmotion,
      intensity: this.state.emotionIntensity
    };
  }

  public getMarketFeeling() {
    return {
      feeling: this.state.marketFeeling,
      confidence: this.state.feelingConfidence
    };
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.history = [];
  }
}
