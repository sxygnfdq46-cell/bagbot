/**
 * LEVEL 11.5 — IDENTITY PERSISTENCE LAYER
 * 
 * Permanent identity root for BagBot's unified presence.
 * Always active, always aware, controls the unified presence aura.
 * Ensures Level 11.1-11.4 integration remains stable across all surfaces.
 * 
 * Architecture:
 * - React Context Provider for global access
 * - Automatic initialization on mount
 * - Cross-tab synchronization coordination
 * - Aura effect orchestration via UnifiedPulseEngine
 * - Integration with all Level 11 systems
 * 
 * Usage: Wrap your app with <IdentityPersistenceLayer>
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { PresenceFieldCore, PresenceFieldState } from './PresenceFieldCore';
import { ContinuityStabilityEngine, ContinuityState } from './ContinuityStabilityEngine';
import { MultiSurfaceAwarenessMatrix, SurfaceAwarenessState, SurfaceType } from './MultiSurfaceAwarenessMatrix';
import { UnifiedPulseEngine, PulseState } from './UnifiedPulseEngine';

// ================================
// CONTEXT
// ================================

export interface UnifiedPresenceContextValue {
  presenceCore: PresenceFieldCore;
  continuityEngine: ContinuityStabilityEngine;
  surfaceMatrix: MultiSurfaceAwarenessMatrix;
  pulseEngine: UnifiedPulseEngine;
  
  // States
  presenceState: PresenceFieldState | null;
  continuityState: ContinuityState | null;
  surfaceState: SurfaceAwarenessState | null;
  pulseState: PulseState | null;
  
  // Actions
  activateSurface: (surface: SurfaceType) => void;
  updateEmotion: (emotion: PresenceFieldState['emotionalLayer']['primaryEmotion'], intensity: number) => void;
  updateTone: (warmth: number, formality: number, enthusiasm: number) => void;
}

const UnifiedPresenceContext = createContext<UnifiedPresenceContextValue | null>(null);

// ================================
// HOOK
// ================================

export const useUnifiedPresence = () => {
  const context = useContext(UnifiedPresenceContext);
  if (!context) {
    throw new Error('useUnifiedPresence must be used within IdentityPersistenceLayer');
  }
  return context;
};

// ================================
// IDENTITY PERSISTENCE LAYER
// ================================

export interface IdentityPersistenceLayerProps {
  children: ReactNode;
  enableCrossTabSync?: boolean;
  enableGPUEffects?: boolean;
}

export const IdentityPersistenceLayer: React.FC<IdentityPersistenceLayerProps> = ({
  children,
  enableCrossTabSync = true,
  enableGPUEffects = true,
}) => {
  // Engine instances (persistent refs)
  const presenceCoreRef = useRef<PresenceFieldCore | null>(null);
  const continuityEngineRef = useRef<ContinuityStabilityEngine | null>(null);
  const surfaceMatrixRef = useRef<MultiSurfaceAwarenessMatrix | null>(null);
  const pulseEngineRef = useRef<UnifiedPulseEngine | null>(null);
  
  // States
  const [presenceState, setPresenceState] = useState<PresenceFieldState | null>(null);
  const [continuityState, setContinuityState] = useState<ContinuityState | null>(null);
  const [surfaceState, setSurfaceState] = useState<SurfaceAwarenessState | null>(null);
  const [pulseState, setPulseState] = useState<PulseState | null>(null);
  
  // Aura container ref
  const auraContainerRef = useRef<HTMLDivElement>(null);
  
  /**
   * Initialize engines (once on mount)
   */
  useEffect(() => {
    // Initialize engines
    presenceCoreRef.current = new PresenceFieldCore({
      enableCrossTabSync,
      smoothingFactor: 0.7,
      minContinuityStrength: 60,
      syncInterval: 500,
      reactionDebounce: 200,
    });
    
    continuityEngineRef.current = new ContinuityStabilityEngine();
    surfaceMatrixRef.current = new MultiSurfaceAwarenessMatrix();
    pulseEngineRef.current = new UnifiedPulseEngine({
      baseBPM: 60,
      breathMultiplier: 4,
      auraRotationSpeed: 30,
      enableEmotionalSync: true,
      enableGPUOptimization: enableGPUEffects,
    });
    
    // Initial state sync
    setPresenceState(presenceCoreRef.current.getState());
    setContinuityState(continuityEngineRef.current.getState());
    setSurfaceState(surfaceMatrixRef.current.getState());
    setPulseState(pulseEngineRef.current.getState());
    
    // Subscribe to pulse updates
    const unsubscribe = pulseEngineRef.current.subscribe((state) => {
      setPulseState(state);
      updateAuraEffects(state);
    });
    
    // Periodic state sync (1 second)
    const interval = setInterval(() => {
      if (presenceCoreRef.current) setPresenceState(presenceCoreRef.current.getState());
      if (continuityEngineRef.current) {
        continuityEngineRef.current.update();
        setContinuityState(continuityEngineRef.current.getState());
      }
      if (surfaceMatrixRef.current) setSurfaceState(surfaceMatrixRef.current.getState());
    }, 1000);
    
    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(interval);
      presenceCoreRef.current?.destroy();
      pulseEngineRef.current?.destroy();
    };
  }, [enableCrossTabSync, enableGPUEffects]);
  
  /**
   * Update aura effects (apply pulse state to DOM)
   */
  const updateAuraEffects = (pulse: PulseState): void => {
    if (!auraContainerRef.current || !enableGPUEffects) return;
    
    const container = auraContainerRef.current;
    const cssProps = pulseEngineRef.current?.getCSSProperties() || {};
    
    // Apply CSS custom properties
    Object.entries(cssProps).forEach(([key, value]) => {
      container.style.setProperty(key, value);
    });
    
    // Additional presence-based properties
    if (presenceState) {
      container.style.setProperty(
        '--presence-continuity',
        (presenceState.continuityStrength / 100).toFixed(3)
      );
      container.style.setProperty(
        '--presence-coherence',
        (presenceState.identityAnchor.coherence / 100).toFixed(3)
      );
    }
    
    if (continuityState) {
      container.style.setProperty(
        '--continuity-confidence',
        (continuityState.continuityConfidence / 100).toFixed(3)
      );
      container.style.setProperty(
        '--tone-warmth',
        (continuityState.toneProfile.warmth / 100).toFixed(3)
      );
      container.style.setProperty(
        '--tone-enthusiasm',
        (continuityState.toneProfile.enthusiasm / 100).toFixed(3)
      );
    }
    
    if (surfaceState) {
      container.style.setProperty(
        '--surface-coherence',
        (surfaceState.contextCoherence / 100).toFixed(3)
      );
    }
  };
  
  /**
   * Activate surface
   */
  const activateSurface = (surface: SurfaceType): void => {
    surfaceMatrixRef.current?.activateSurface(surface, 70);
    setSurfaceState(surfaceMatrixRef.current?.getState() || null);
  };
  
  /**
   * Update emotion
   */
  const updateEmotion = (
    emotion: PresenceFieldState['emotionalLayer']['primaryEmotion'],
    intensity: number
  ): void => {
    presenceCoreRef.current?.update({
      emotionalShift: { emotion, intensity },
    });
    setPresenceState(presenceCoreRef.current?.getState() || null);
    
    // Sync with pulse
    pulseEngineRef.current?.setEmotionalBeat(emotion, intensity);
  };
  
  /**
   * Update tone
   */
  const updateTone = (warmth: number, formality: number, enthusiasm: number): void => {
    continuityEngineRef.current?.updateTone({
      warmth,
      formality,
      enthusiasm,
      strength: 50,
    });
    setContinuityState(continuityEngineRef.current?.getState() || null);
    
    // Sync pulse intensity with enthusiasm
    pulseEngineRef.current?.setPulseIntensity(enthusiasm);
  };
  
  // Context value
  const contextValue: UnifiedPresenceContextValue = {
    presenceCore: presenceCoreRef.current!,
    continuityEngine: continuityEngineRef.current!,
    surfaceMatrix: surfaceMatrixRef.current!,
    pulseEngine: pulseEngineRef.current!,
    
    presenceState,
    continuityState,
    surfaceState,
    pulseState,
    
    activateSurface,
    updateEmotion,
    updateTone,
  };
  
  return (
    <UnifiedPresenceContext.Provider value={contextValue}>
      {/* Aura Container (GPU effects) */}
      {enableGPUEffects && (
        <div ref={auraContainerRef} className="unified-presence-aura">
          <div className="unified-pulse-glow"></div>
          <div className="unified-breath-wave"></div>
          <div className="unified-continuity-shimmer"></div>
          <div className="unified-coherence-grid"></div>
          <div className="unified-identity-anchor"></div>
        </div>
      )}
      
      {/* Children */}
      {children}
    </UnifiedPresenceContext.Provider>
  );
};

export default IdentityPersistenceLayer;
