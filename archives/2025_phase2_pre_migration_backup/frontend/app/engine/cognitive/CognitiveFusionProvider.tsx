/**
 * LEVEL 6.2 — COGNITIVE FUSION PROVIDER
 * React Context wrapper for Cognitive Fusion Layer
 * 
 * Provides predictive UI reactions and cross-page synchronization
 * Runs background cognitive threads (client-only, safe mode)
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useBehavior } from '../bic/BehaviorProvider';
import { CognitiveFusion, CognitiveOutput, PredictiveSignal } from './CognitiveFusion';

interface CognitiveFusionContextValue {
  cognitive: CognitiveOutput;
  isActive: boolean;
  
  // Cross-page shared state
  sharedEmotionalState: string;
  sharedIntensity: number;
  sharedPredictiveFlags: {
    volatilitySpike: boolean;
    dataFlood: boolean;
    signalBurst: boolean;
    systemStrain: boolean;
  };
}

const defaultCognitive: CognitiveOutput = {
  volatilitySpike: false,
  dataFlood: false,
  signalBurst: false,
  systemStrain: false,
  glowMultiplier: 1.0,
  pulseMultiplier: 1.0,
  intensityMultiplier: 1.0,
  predictiveSignal: {
    confidence: 0,
    anticipatedLoad: 0,
    prewarmIntensity: 0,
    expectedState: 'calm',
    timeToImpact: 400,
  },
  visualBinding: {
    particleDensity: 50,
    quantumFieldWarp: 50,
    holoFluxTension: 50,
    hyperspaceThreads: 50,
    cameraDrift: 50,
    neonPulse: 50,
  },
};

const CognitiveFusionContext = createContext<CognitiveFusionContextValue>({
  cognitive: defaultCognitive,
  isActive: false,
  sharedEmotionalState: 'calm',
  sharedIntensity: 50,
  sharedPredictiveFlags: {
    volatilitySpike: false,
    dataFlood: false,
    signalBurst: false,
    systemStrain: false,
  },
});

export const useCognitiveFusion = () => useContext(CognitiveFusionContext);

interface CognitiveFusionProviderProps {
  children: React.ReactNode;
}

export const CognitiveFusionProvider: React.FC<CognitiveFusionProviderProps> = ({ children }) => {
  const { behavior, isActive: bicActive } = useBehavior();
  const [cognitive, setCognitive] = useState<CognitiveOutput>(defaultCognitive);
  const [isActive, setIsActive] = useState(false);
  
  const fusionRef = useRef<CognitiveFusion>(new CognitiveFusion());
  
  // Background cognitive thread (60fps)
  useEffect(() => {
    if (!bicActive) return;
    
    let animationFrameId: number;
    let lastUpdate = Date.now();
    const targetFps = 60;
    const frameInterval = 1000 / targetFps;
    
    const cognitiveLoop = () => {
      const now = Date.now();
      const delta = now - lastUpdate;
      
      if (delta >= frameInterval) {
        // Fuse BIC behavior with cognitive predictions
        const output = fusionRef.current.fuse(behavior);
        setCognitive(output);
        setIsActive(true);
        lastUpdate = now - (delta % frameInterval);
      }
      
      animationFrameId = requestAnimationFrame(cognitiveLoop);
    };
    
    // Start the cognitive loop
    animationFrameId = requestAnimationFrame(cognitiveLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [bicActive, behavior]);
  
  // Cross-page synchronization state
  const contextValue: CognitiveFusionContextValue = {
    cognitive,
    isActive,
    sharedEmotionalState: behavior.emotionalState,
    sharedIntensity: behavior.intensity,
    sharedPredictiveFlags: {
      volatilitySpike: cognitive.volatilitySpike,
      dataFlood: cognitive.dataFlood,
      signalBurst: cognitive.signalBurst,
      systemStrain: cognitive.systemStrain,
    },
  };
  
  return (
    <CognitiveFusionContext.Provider value={contextValue}>
      {children}
    </CognitiveFusionContext.Provider>
  );
};
