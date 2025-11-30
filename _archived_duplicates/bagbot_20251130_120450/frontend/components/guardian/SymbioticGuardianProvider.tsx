/**
 * LEVEL 12.1 — SYMBIOTIC GUARDIAN PROVIDER
 * 
 * React Context Provider for global Guardian state broadcasting.
 * Integrates with Presence (11.5), Identity (11.1), Emotional (11.3), and Meta-Consciousness (10).
 * 
 * Architecture:
 * - Orchestrates 3 Guardian engines (StateCore, HarmonicBalance, ProtectionReflex)
 * - Broadcasts unified Guardian state to all components
 * - Injects CSS custom properties for visual stabilization
 * - Cross-layer integration with Levels 1-11.5
 * 
 * Usage: Wrap app with <SymbioticGuardianProvider>
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { GuardianStateCore, GuardianState } from './GuardianStateCore';
import { HarmonicBalanceEngine, HarmonicState } from './HarmonicBalanceEngine';
import { ProtectionReflexMatrix, ProtectionReflexState } from './ProtectionReflexMatrix';

// ================================
// CONTEXT
// ================================

export interface SymbioticGuardianContextValue {
  guardianCore: GuardianStateCore;
  harmonicEngine: HarmonicBalanceEngine;
  protectionMatrix: ProtectionReflexMatrix;
  
  // States
  guardianState: GuardianState | null;
  harmonicState: HarmonicState | null;
  protectionState: ProtectionReflexState | null;
  
  // Actions
  updateEmotionalState: (emotion: string, intensity: number) => void;
  updateVisualState: (intensity: number, stimulation: number) => void;
  detectCascade: (layerName: string, depth: number) => void;
  updateTone: (warmth: number, formality: number, enthusiasm: number) => void;
}

const SymbioticGuardianContext = createContext<SymbioticGuardianContextValue | null>(null);

// ================================
// HOOK
// ================================

export const useGuardian = () => {
  const context = useContext(SymbioticGuardianContext);
  if (!context) {
    throw new Error('useGuardian must be used within SymbioticGuardianProvider');
  }
  return context;
};

// ================================
// SYMBIOTIC GUARDIAN PROVIDER
// ================================

export interface SymbioticGuardianProviderProps {
  children: ReactNode;
  enableProtection?: boolean;
  enableBalancing?: boolean;
}

export const SymbioticGuardianProvider: React.FC<SymbioticGuardianProviderProps> = ({
  children,
  enableProtection = true,
  enableBalancing = true,
}) => {
  // Engine instances (persistent refs)
  const guardianCoreRef = useRef<GuardianStateCore | null>(null);
  const harmonicEngineRef = useRef<HarmonicBalanceEngine | null>(null);
  const protectionMatrixRef = useRef<ProtectionReflexMatrix | null>(null);
  
  // States
  const [guardianState, setGuardianState] = useState<GuardianState | null>(null);
  const [harmonicState, setHarmonicState] = useState<HarmonicState | null>(null);
  const [protectionState, setProtectionState] = useState<ProtectionReflexState | null>(null);
  
  // Guardian container ref (for CSS properties)
  const guardianContainerRef = useRef<HTMLDivElement>(null);
  
  /**
   * Initialize engines
   */
  useEffect(() => {
    // Create engines once
    if (!guardianCoreRef.current) {
      guardianCoreRef.current = new GuardianStateCore({
        enableProtection,
        emotionalIntensityCap: 85,
        fpsThreshold: 30,
        latencyThreshold: 100,
        stabilizationStrength: 0.7,
      });
    }
    
    if (!harmonicEngineRef.current) {
      harmonicEngineRef.current = new HarmonicBalanceEngine({
        enableBalancing,
        toneStabilityThreshold: 70,
        visualIntensityCap: 85,
        harmonicFrequency: 1.0,
        correctionStrength: 0.6,
      });
    }
    
    if (!protectionMatrixRef.current) {
      protectionMatrixRef.current = new ProtectionReflexMatrix({
        enableProtection,
        cascadeThreshold: 3,
        unstableValueThreshold: 70,
        stormIntensityThreshold: 75,
        interventionStrength: 0.8,
      });
    }
    
    // Initial state sync
    updateStates();
    
    // Periodic state sync (1 second)
    const syncInterval = setInterval(updateStates, 1000);
    
    // Cleanup
    return () => {
      clearInterval(syncInterval);
      guardianCoreRef.current?.destroy();
      harmonicEngineRef.current?.destroy();
      protectionMatrixRef.current?.destroy();
    };
  }, [enableProtection, enableBalancing]);
  
  /**
   * Update all states
   */
  const updateStates = () => {
    if (guardianCoreRef.current) {
      setGuardianState(guardianCoreRef.current.getState());
    }
    if (harmonicEngineRef.current) {
      setHarmonicState(harmonicEngineRef.current.getState());
    }
    if (protectionMatrixRef.current) {
      setProtectionState(protectionMatrixRef.current.getState());
    }
  };
  
  /**
   * Update CSS custom properties
   */
  useEffect(() => {
    if (!guardianContainerRef.current || !guardianState || !harmonicState || !protectionState) return;
    
    const container = guardianContainerRef.current;
    
    // Guardian harmonic properties
    container.style.setProperty('--guardian-harmonic', harmonicState.guardianHarmonic.frequency.toString());
    container.style.setProperty('--guardian-harmonic-phase', `${harmonicState.guardianHarmonic.phase}deg`);
    container.style.setProperty('--guardian-harmonic-amplitude', harmonicState.guardianHarmonic.amplitude.toString());
    
    // Guardian intensity properties
    container.style.setProperty('--guardian-intensity', (guardianState.guardianStrength / 100).toString());
    container.style.setProperty('--guardian-protection-level', guardianState.protectionLevel);
    
    // Balance properties
    container.style.setProperty('--guardian-balance', (harmonicState.coherenceScore / 100).toString());
    container.style.setProperty('--guardian-emotional-balance', (harmonicState.multiDimensionalBalance.emotionalBalance / 100).toString());
    container.style.setProperty('--guardian-visual-balance', (harmonicState.multiDimensionalBalance.visualBalance / 100).toString());
    
    // Protection properties
    container.style.setProperty('--guardian-reflex-strength', (protectionState.reflexStrength / 100).toString());
    container.style.setProperty('--guardian-threat-level', protectionState.threatLevel);
    container.style.setProperty('--guardian-protection-active', protectionState.protectionActive ? '1' : '0');
    
    // Integrity properties
    container.style.setProperty('--guardian-integrity', (guardianState.integrityScore / 100).toString());
    container.style.setProperty('--guardian-coherence', (harmonicState.coherenceScore / 100).toString());
    
    // Visual dampening
    container.style.setProperty('--guardian-dampening', (harmonicState.visualBalance.dampening / 100).toString());
    container.style.setProperty('--guardian-overstimulation-risk', (harmonicState.visualBalance.overstimulationRisk / 100).toString());
    
    // Cascade prevention
    container.style.setProperty('--guardian-cascade-risk', (guardianState.integrityMonitoring.cascadeRisk / 100).toString());
    container.style.setProperty('--guardian-cascade-active', protectionState.cascadePrevention.cascadeDetected ? '1' : '0');
  }, [guardianState, harmonicState, protectionState]);
  
  /**
   * Action: Update emotional state
   */
  const updateEmotionalState = (emotion: string, intensity: number) => {
    guardianCoreRef.current?.updateEmotionalState(emotion, intensity);
    updateStates();
  };
  
  /**
   * Action: Update visual state
   */
  const updateVisualState = (intensity: number, stimulation: number) => {
    harmonicEngineRef.current?.updateVisualState(intensity, stimulation);
    updateStates();
  };
  
  /**
   * Action: Detect cascade
   */
  const detectCascade = (layerName: string, depth: number) => {
    protectionMatrixRef.current?.detectCascade(layerName, depth);
    updateStates();
  };
  
  /**
   * Action: Update tone
   */
  const updateTone = (warmth: number, formality: number, enthusiasm: number) => {
    harmonicEngineRef.current?.updateTone(warmth, formality, enthusiasm);
    updateStates();
  };
  
  // Context value
  const contextValue: SymbioticGuardianContextValue = {
    guardianCore: guardianCoreRef.current!,
    harmonicEngine: harmonicEngineRef.current!,
    protectionMatrix: protectionMatrixRef.current!,
    
    guardianState,
    harmonicState,
    protectionState,
    
    updateEmotionalState,
    updateVisualState,
    detectCascade,
    updateTone,
  };
  
  return (
    <SymbioticGuardianContext.Provider value={contextValue}>
      {/* Guardian container for CSS custom properties */}
      <div 
        ref={guardianContainerRef}
        className="symbiotic-guardian-root"
        data-guardian-active={guardianState?.protectionLevel !== 'none'}
        data-harmonic-phase={harmonicState?.harmonicPhase}
        data-reflex-mode={protectionState?.reflexMode}
      >
        {children}
      </div>
    </SymbioticGuardianContext.Provider>
  );
};
