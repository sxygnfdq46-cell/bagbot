/**
 * 🌐 ENVIRONMENTAL FUSION PROVIDER
 * 
 * Unifies Level 9.2's fusion layer into a single React provider.
 * Connects Level 7 (Emotional) + Level 9 (Environmental) → Unified Mood.
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { EnvironmentalEmotionMapper, EnvironmentalEmotionState } from './EnvironmentalEmotionMapper';
import { AdaptiveMoodClimateEngine, MoodClimateState, FusionMood } from './AdaptiveMoodClimateEngine';
import { CrossSystemHarmonizer, SystemTimeline } from './CrossSystemHarmonizer';
import { MarketClimateVFXBlend, ClimateVFXState } from './MarketClimateVFXBlend';
import { EnvironmentalMemoryLayer, EnvironmentalMemoryState } from './EnvironmentalMemoryLayer';

// Import Level 7 and Level 9 types (assuming these exist)
// import { useEmotionalCore } from '../emotional';
// import { useEnvironmentalConsciousness } from '../environmental';

export interface EnvironmentalFusionState {
  // Fusion mood
  fusionMood: FusionMood;
  moodClimate: MoodClimateState;
  
  // Environmental emotions
  environmentalEmotion: EnvironmentalEmotionState;
  
  // Visual effects
  vfx: ClimateVFXState;
  
  // Memory
  memory: EnvironmentalMemoryState;
  
  // System timeline
  timeline: SystemTimeline;
  
  // Unified metrics
  unifiedIntensity: number;     // 0-100
  unifiedStability: number;     // 0-100
  unifiedCoherence: number;     // 0-100
  
  // Active status
  isActive: boolean;
  lastUpdate: number;
}

interface EnvironmentalFusionContextValue {
  state: EnvironmentalFusionState;
  
  // Mood queries
  getCurrentMood: () => FusionMood;
  getMoodIntensity: () => number;
  getMoodStability: () => number;
  
  // Visual queries
  getVisualEffects: () => ClimateVFXState;
  getColorResonances: () => { blue: number; purple: number; gold: number; red: number; white: number };
  
  // Memory queries
  getEmotionalAdaptations: () => { stress: number; alert: number; calm: number };
  getRecognizedPatterns: () => any[];
  
  // Timeline queries
  getGlobalPhase: () => number;
  getCoherence: () => number;
  getHarmony: () => number;
  
  // Control
  reset: () => void;
}

const EnvironmentalFusionContext = createContext<EnvironmentalFusionContextValue | undefined>(undefined);

interface EnvironmentalFusionProviderProps {
  children: ReactNode;
  updateInterval?: number;      // ms between updates (default: 100)
}

export const EnvironmentalFusionProvider: React.FC<EnvironmentalFusionProviderProps> = ({ 
  children,
  updateInterval = 100
}) => {
  // ============================================
  // FUSION COMPONENTS
  // ============================================
  
  const emotionMapperRef = useRef<EnvironmentalEmotionMapper>(new EnvironmentalEmotionMapper());
  const moodEngineRef = useRef<AdaptiveMoodClimateEngine>(new AdaptiveMoodClimateEngine());
  const harmonizerRef = useRef<CrossSystemHarmonizer>(new CrossSystemHarmonizer());
  const vfxBlendRef = useRef<MarketClimateVFXBlend>(new MarketClimateVFXBlend());
  const memoryLayerRef = useRef<EnvironmentalMemoryLayer>(new EnvironmentalMemoryLayer());

  // ============================================
  // STATE
  // ============================================
  
  const [state, setState] = useState<EnvironmentalFusionState>({
    fusionMood: 'crystal_state',
    moodClimate: moodEngineRef.current.getState(),
    environmentalEmotion: emotionMapperRef.current.getState(),
    vfx: vfxBlendRef.current.getState(),
    memory: memoryLayerRef.current.getState(),
    timeline: harmonizerRef.current.getTimeline(),
    unifiedIntensity: 50,
    unifiedStability: 70,
    unifiedCoherence: 80,
    isActive: true,
    lastUpdate: Date.now()
  });

  // ============================================
  // MASTER UPDATE LOOP
  // ============================================
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.isActive) return;

      const now = Date.now();
      const deltaTime = now - state.lastUpdate;

      // Update timeline
      const timeline = harmonizerRef.current.updateTimeline(deltaTime);

      // TODO: Fetch internal emotional state from Level 7
      // const emotionalState = useEmotionalCore();
      // For now, use placeholder
      const internalEmotion = {
        dominantEmotion: 'calm' as const,
        emotionalIntensity: 60,
        stability: 70
      };

      // TODO: Fetch environmental state from Level 9
      // const envState = useEnvironmentalConsciousness();
      // For now, use placeholder with complete MarketWeatherState
      const environmentalInput = {
        weather: {
          condition: 'clear' as const,
          temperature: 30,
          visibility: 80,
          windSpeed: 20,
          severity: 20,
          forecast: [],
          pressure: 50,
          humidity: 40,
          atmosphere: {
            lower: { temperature: 30, pressure: 50, density: 40, turbulence: 20, stability: 70 },
            middle: { temperature: 30, pressure: 50, density: 40, turbulence: 15, stability: 75 },
            upper: { temperature: 30, pressure: 50, density: 40, turbulence: 10, stability: 80 }
          },
          patterns: [],
          effects: {
            fogDensity: 0.1,
            cloudCover: 0.2,
            precipitation: 0,
            lightning: 0
          }
        },
        gravity: {
          massPoints: [],
          primaryCenter: null,
          secondaryCenter: null,
          attractionZones: [],
          repulsionZones: [],
          totalMass: 40,
          centerStrength: 30,
          balance: 60,
          stability: 70,
          fieldStrength: 40,
          tideStrength: 20,
          distortion: 20
        },
        flow: {
          velocity: 40,
          turbulence: 25,
          coherence: 70,
          direction: { x: 1, y: 0 },
          shearZones: [],
          vortices: [],
          dominantFlow: { direction: 0, strength: 40, consistency: 70 },
          streams: [],
          grid: [],
          gridSize: { rows: 10, cols: 10 },
          cellSize: 50,
          sources: [],
          sinks: [],
          totalFlow: 40
        },
        jetstream: {
          jetstream: null,
          crossCurrents: [],
          tradewinds: { direction: 0, speed: 40, consistency: 70, coverage: 60, pressure: 50 },
          westerlies: { direction: 0, speed: 50, consistency: 75, coverage: 70, pressure: 55 },
          jetlayer: { direction: 0, speed: 60, consistency: 80, coverage: 80, pressure: 60 },
          trendStrength: 60,
          trendDuration: 0,
          trendStability: 70,
          directionConfidence: 75,
          shearZones: [],
          turbulence: 20
        },
        microbursts: {
          activeBursts: [],
          burstCount: 0,
          sensitivity: 70,
          detectionThreshold: 10,
          anticipation: 60,
          burstFrequency: 0,
          avgBurstMagnitude: 0,
          burstDensity: 0,
          burstEnergy: 20,
          pressureWaves: [],
          waveInterference: 10,
          nextBurstProbability: 30,
          timeToNextBurst: 5000,
          forecastConfidence: 50
        },
        temperature: {
          currentTemp: 50,
          targetTemp: 60,
          heatIndex: 55,
          spreadHeat: 40,
          depthHeat: 50,
          volumeHeat: 45,
          velocityHeat: 50,
          hotZones: [],
          coldZones: [],
          thermalGradient: 30,
          regulationMode: 'maintaining' as const,
          regulationStrength: 40,
          liquidityHealth: 70,
          stressLevel: 20,
          fragmentation: 15
        }
      };

      // 1. Map environmental metrics to emotions
      const environmentalEmotion = emotionMapperRef.current.update(environmentalInput);

      // 2. Fuse internal + environmental into mood
      const moodClimate = moodEngineRef.current.update(internalEmotion, environmentalEmotion);

      // 3. Generate VFX from fusion mood
      const vfx = vfxBlendRef.current.update(
        environmentalInput.weather,
        environmentalInput.flow,
        environmentalInput.gravity,
        {
          activeStorms: [],
          buildingPressure: [],
          surges: [],
          surgeForecast: [],
          microScale: { momentum: 20, velocity: 10, acceleration: 0, direction: 0, volatility: 15, coherence: 70 },
          miniScale: { momentum: 25, velocity: 15, acceleration: 0, direction: 0, volatility: 20, coherence: 75 },
          shortScale: { momentum: 30, velocity: 20, acceleration: 0, direction: 0, volatility: 25, coherence: 80 },
          mediumScale: { momentum: 35, velocity: 25, acceleration: 0, direction: 0, volatility: 30, coherence: 85 },
          longScale: { momentum: 40, velocity: 30, acceleration: 0, direction: 0, volatility: 35, coherence: 90 },
          stormIntensity: 20,
          stormProbability: 30,
          energyLevel: 30,
          discharge: 10
        },
        moodClimate.fusionMood
      );

      // 4. Update memory (record environmental events)
      const memory = memoryLayerRef.current.getState();

      // 5. Update harmonizer harmony score
      harmonizerRef.current.updateHarmonyScore(
        internalEmotion.stability,
        70, // behavioral coherence (placeholder)
        environmentalEmotion.resonanceLevel * 100,
        80 // holographic alignment (placeholder)
      );

      // 6. Calculate unified metrics
      const unifiedIntensity = (
        moodClimate.moodIntensity * 0.5 +
        environmentalEmotion.alertnessSpike * 20 +
        environmentalEmotion.overclockTrigger * 20
      );

      const unifiedStability = (
        moodClimate.moodStability * 0.6 +
        internalEmotion.stability * 0.4
      );

      const unifiedCoherence = (
        harmonizerRef.current.getCoherence() * 0.5 +
        environmentalInput.flow.coherence * 0.5
      );

      // Update state
      setState({
        fusionMood: moodClimate.fusionMood,
        moodClimate,
        environmentalEmotion,
        vfx,
        memory,
        timeline,
        unifiedIntensity: Math.min(100, unifiedIntensity),
        unifiedStability,
        unifiedCoherence,
        isActive: true,
        lastUpdate: now
      });

    }, updateInterval);

    return () => clearInterval(interval);
  }, [state.isActive, state.lastUpdate, updateInterval]);

  // ============================================
  // MEMORY DECAY (once per minute)
  // ============================================
  
  useEffect(() => {
    const decayInterval = setInterval(() => {
      memoryLayerRef.current.applyMemoryDecay();
    }, 60000); // 1 minute

    return () => clearInterval(decayInterval);
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const contextValue: EnvironmentalFusionContextValue = {
    state,
    
    // Mood queries
    getCurrentMood: () => state.fusionMood,
    getMoodIntensity: () => state.moodClimate.moodIntensity,
    getMoodStability: () => state.moodClimate.moodStability,
    
    // Visual queries
    getVisualEffects: () => state.vfx,
    getColorResonances: () => vfxBlendRef.current.getColorResonances(),
    
    // Memory queries
    getEmotionalAdaptations: () => memoryLayerRef.current.getEmotionalAdaptations(),
    getRecognizedPatterns: () => memoryLayerRef.current.getRecognizedPatterns(),
    
    // Timeline queries
    getGlobalPhase: () => harmonizerRef.current.getGlobalPhase(),
    getCoherence: () => harmonizerRef.current.getCoherence(),
    getHarmony: () => harmonizerRef.current.getHarmony(),
    
    // Control
    reset: () => {
      emotionMapperRef.current = new EnvironmentalEmotionMapper();
      moodEngineRef.current = new AdaptiveMoodClimateEngine();
      harmonizerRef.current = new CrossSystemHarmonizer();
      vfxBlendRef.current = new MarketClimateVFXBlend();
      memoryLayerRef.current = new EnvironmentalMemoryLayer();
      
      setState({
        fusionMood: 'crystal_state',
        moodClimate: moodEngineRef.current.getState(),
        environmentalEmotion: emotionMapperRef.current.getState(),
        vfx: vfxBlendRef.current.getState(),
        memory: memoryLayerRef.current.getState(),
        timeline: harmonizerRef.current.getTimeline(),
        unifiedIntensity: 50,
        unifiedStability: 70,
        unifiedCoherence: 80,
        isActive: true,
        lastUpdate: Date.now()
      });
    }
  };

  return (
    <EnvironmentalFusionContext.Provider value={contextValue}>
      {children}
    </EnvironmentalFusionContext.Provider>
  );
};

// ============================================
// HOOKS
// ============================================

export const useEnvironmentalFusion = (): EnvironmentalFusionContextValue => {
  const context = useContext(EnvironmentalFusionContext);
  if (!context) {
    throw new Error('useEnvironmentalFusion must be used within EnvironmentalFusionProvider');
  }
  return context;
};

export const useFusionMood = () => {
  const { state, getCurrentMood, getMoodIntensity, getMoodStability } = useEnvironmentalFusion();
  return {
    mood: getCurrentMood(),
    intensity: getMoodIntensity(),
    stability: getMoodStability(),
    climate: state.moodClimate
  };
};

export const useFusionVFX = () => {
  const { state, getVisualEffects, getColorResonances } = useEnvironmentalFusion();
  return {
    vfx: getVisualEffects(),
    colors: getColorResonances(),
    particleField: state.vfx.particleField,
    waveDistortion: state.vfx.waveDistortion,
    magneticLines: state.vfx.magneticLines,
    streamEffect: state.vfx.streamEffect
  };
};

export const useFusionTimeline = () => {
  const { state, getGlobalPhase, getCoherence, getHarmony } = useEnvironmentalFusion();
  return {
    timeline: state.timeline,
    phase: getGlobalPhase(),
    coherence: getCoherence(),
    harmony: getHarmony()
  };
};

export const useFusionMemory = () => {
  const { state, getEmotionalAdaptations, getRecognizedPatterns } = useEnvironmentalFusion();
  return {
    memory: state.memory,
    adaptations: getEmotionalAdaptations(),
    patterns: getRecognizedPatterns()
  };
};
