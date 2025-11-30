/**
 * 🛡️ STABILITY PROVIDER
 * 
 * React provider for Level 9.3 - Stability & Reflex Layer
 * Connects reflex engine + stability field to the UI
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ReflexEngine, type ReflexState } from './ReflexEngine';
import { StabilityFieldCore, type StabilityFieldState } from './StabilityFieldCore';
import { ReflexMapper, type SignalPattern } from './ReflexMapper';
import { useEnvironmentalConsciousness } from '../environmental/EnvironmentalConsciousnessCore';
import { useCognitiveFusion } from '../cognitive/CognitiveFusionProvider';

// ============================================
// CONTEXT
// ============================================

interface StabilityContextValue {
  reflexState: ReflexState | null;
  stabilityState: StabilityFieldState | null;
  activePatterns: SignalPattern[];
  
  // Reflex queries
  getActiveReflexes: () => ReflexState['activeReflexes'];
  getReflexMode: () => ReflexState['mode'];
  getSystemStress: () => number;
  getReflexScore: () => number;
  
  // Stability queries
  getStability: () => number;
  getOverallHealth: () => number;
  isOverheating: () => boolean;
  getVisualParameters: () => {
    colorWarmth: number;
    glowIntensity: number;
    particleDensity: number;
    driftSpeed: number;
  };
  
  // Control
  setSensitivity: (sensitivity: number) => void;
  setIntensity: (intensity: number) => void;
  setCoolingRate: (rate: number) => void;
  reset: () => void;
}

const StabilityContext = createContext<StabilityContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface StabilityProviderProps {
  children: React.ReactNode;
  updateInterval?: number;      // ms (default: 16ms = 60fps)
  enabled?: boolean;
}

export function StabilityProvider({
  children,
  updateInterval = 1000 / 60,  // 60fps
  enabled = true
}: StabilityProviderProps) {
  // Engine instances
  const reflexEngine = useRef(new ReflexEngine());
  const stabilityCore = useRef(new StabilityFieldCore());
  const reflexMapper = useRef(new ReflexMapper());
  
  // State
  const [reflexState, setReflexState] = useState<ReflexState | null>(null);
  const [stabilityState, setStabilityState] = useState<StabilityFieldState | null>(null);
  const [activePatterns, setActivePatterns] = useState<SignalPattern[]>([]);
  
  // Dependencies
  const { state: environmentalState } = useEnvironmentalConsciousness();
  const cognitiveFusion = useCognitiveFusion();
  
  // Convert cognitive fusion state to emotional state format
  const emotionalState = cognitiveFusion ? {
    energy: cognitiveFusion.sharedEmotionalState === 'overclocked' ? 1.0 :
            cognitiveFusion.sharedEmotionalState === 'alert' ? 0.8 :
            cognitiveFusion.sharedEmotionalState === 'focused' ? 0.6 :
            cognitiveFusion.sharedEmotionalState === 'stressed' ? 0.5 : 0.3,
    valence: cognitiveFusion.sharedEmotionalState === 'calm' ? 0.8 :
             cognitiveFusion.sharedEmotionalState === 'focused' ? 0.7 :
             cognitiveFusion.sharedEmotionalState === 'alert' ? 0.5 :
             cognitiveFusion.sharedEmotionalState === 'stressed' ? 0.3 : 0.2,
    intensity: cognitiveFusion.sharedIntensity / 100,
    volatility: cognitiveFusion.sharedEmotionalState === 'stressed' || 
                cognitiveFusion.sharedEmotionalState === 'overclocked' ? 0.7 : 0.3,
    presence: 0.8
  } : null;
  
  // Update timer
  const updateTimer = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // UPDATE LOOP
  // ============================================

  useEffect(() => {
    if (!enabled || !environmentalState || !emotionalState) return;

    const startUpdateLoop = () => {
      if (updateTimer.current) clearInterval(updateTimer.current);
      
      updateTimer.current = setInterval(() => {
        const timestamp = Date.now();
        
        // Update reflex engine
        const newReflexState = reflexEngine.current.update(
          environmentalState,
          emotionalState,
          timestamp
        );
        setReflexState(newReflexState);
        
        // Update stability field
        const newStabilityState = stabilityCore.current.update(
          environmentalState,
          emotionalState,
          newReflexState,
          timestamp
        );
        setStabilityState(newStabilityState);
        
        // Map active patterns
        const patterns = reflexMapper.current.mapSignalsToReflexes(
          environmentalState,
          emotionalState
        );
        setActivePatterns(patterns);
      }, updateInterval);
    };

    startUpdateLoop();

    return () => {
      if (updateTimer.current) {
        clearInterval(updateTimer.current);
        updateTimer.current = null;
      }
    };
  }, [enabled, environmentalState, emotionalState, updateInterval]);

  // ============================================
  // REFLEX QUERIES
  // ============================================

  const getActiveReflexes = () => {
    return reflexState?.activeReflexes || [];
  };

  const getReflexMode = () => {
    return reflexState?.mode || 'calm';
  };

  const getSystemStress = () => {
    return reflexState?.systemStress || 0;
  };

  const getReflexScore = () => {
    return reflexState?.reflexScore || 100;
  };

  // ============================================
  // STABILITY QUERIES
  // ============================================

  const getStability = () => {
    return stabilityState?.stability || 1.0;
  };

  const getOverallHealth = () => {
    return stabilityState?.overallHealth || 100;
  };

  const isOverheating = () => {
    return stabilityState?.overheating || false;
  };

  const getVisualParameters = () => {
    return stabilityCore.current.getVisualParameters();
  };

  // ============================================
  // CONTROL
  // ============================================

  const setSensitivity = (sensitivity: number) => {
    reflexEngine.current.setSensitivity(sensitivity);
  };

  const setIntensity = (intensity: number) => {
    reflexEngine.current.setIntensity(intensity);
  };

  const setCoolingRate = (rate: number) => {
    stabilityCore.current.setCoolingRate(rate);
  };

  const reset = () => {
    reflexEngine.current.reset();
    stabilityCore.current.reset();
    setReflexState(null);
    setStabilityState(null);
    setActivePatterns([]);
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: StabilityContextValue = {
    reflexState,
    stabilityState,
    activePatterns,
    getActiveReflexes,
    getReflexMode,
    getSystemStress,
    getReflexScore,
    getStability,
    getOverallHealth,
    isOverheating,
    getVisualParameters,
    setSensitivity,
    setIntensity,
    setCoolingRate,
    reset
  };

  return (
    <StabilityContext.Provider value={value}>
      {/* Inject reflex visual effects into DOM */}
      <ReflexVisualEffects 
        activeReflexes={reflexState?.activeReflexes || []}
        visualParams={getVisualParameters()}
      />
      {children}
    </StabilityContext.Provider>
  );
}

// ============================================
// REFLEX VISUAL EFFECTS
// ============================================

interface ReflexVisualEffectsProps {
  activeReflexes: ReflexState['activeReflexes'];
  visualParams: {
    colorWarmth: number;
    glowIntensity: number;
    particleDensity: number;
    driftSpeed: number;
  };
}

function ReflexVisualEffects({ activeReflexes, visualParams }: ReflexVisualEffectsProps) {
  return (
    <>
      {/* Global CSS variables for visual parameters */}
      <style jsx global>{`
        :root {
          --reflex-color-warmth: ${visualParams.colorWarmth};
          --reflex-glow-intensity: ${visualParams.glowIntensity};
          --reflex-particle-density: ${visualParams.particleDensity};
          --reflex-drift-speed: ${visualParams.driftSpeed};
        }
      `}</style>
      
      {/* Active reflex overlays */}
      {activeReflexes.map((reflex, index) => (
        <div
          key={`${reflex.type}-${reflex.triggeredAt}`}
          className={`reflex-overlay ${reflex.visualEffect.cssClass}`}
          style={{
            '--reflex-color': reflex.visualEffect.color,
            '--reflex-intensity': reflex.intensity,
            '--reflex-duration': `${reflex.visualEffect.duration}ms`,
            zIndex: 9000 + index
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ============================================
// HOOKS
// ============================================

export function useStability() {
  const context = useContext(StabilityContext);
  if (!context) {
    throw new Error('useStability must be used within StabilityProvider');
  }
  return context;
}

// Convenience hooks
export function useReflexState() {
  const { reflexState } = useStability();
  return reflexState;
}

export function useStabilityState() {
  const { stabilityState } = useStability();
  return stabilityState;
}

export function useActiveReflexes() {
  const { getActiveReflexes } = useStability();
  return getActiveReflexes();
}

export function useVisualParameters() {
  const { getVisualParameters } = useStability();
  return getVisualParameters();
}
