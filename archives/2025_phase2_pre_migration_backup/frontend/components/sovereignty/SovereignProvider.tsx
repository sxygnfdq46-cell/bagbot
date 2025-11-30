'use client';

/**
 * LEVEL 12.2 — SOVEREIGN PROVIDER
 * 
 * React Context Provider for Sovereignty state broadcasting.
 * Manages all 4 Sovereignty engines and injects CSS properties.
 * 
 * Engines:
 * - EmotionalFieldRegulator: Bandwidth limiting, intensity governance
 * - SovereignBalanceEngine: Prediction, recentering, tone correction
 * - AdaptivePresenceMatrix: Personality preservation, 12-layer grid
 * - EmotionalRhythmController: Oscillation moderation, harmonic pacing
 * 
 * Features:
 * - Global state broadcasting via React Context
 * - CSS custom property injection
 * - Unified API access hooks
 * - Real-time metric updates
 * - Zero data storage (ephemeral only)
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { EmotionalFieldRegulator } from './EmotionalFieldRegulator';
import { SovereignBalanceEngine } from './SovereignBalanceEngine';
import { AdaptivePresenceMatrix } from './AdaptivePresenceMatrix';
import { EmotionalRhythmController } from './EmotionalRhythmController';

/* ================================ */
/* TYPES                            */
/* ================================ */

interface SovereignState {
  // Field regulator state
  emotionalIntensity: number;
  bandwidthUtilization: number;
  emotionalStability: number;
  emotionalSmoothness: number;
  stabilizationMode: 'passive' | 'reactive' | 'aggressive' | 'emergency';

  // Balance engine state
  predictedIntensity: number;
  predictedTone: 'escalating' | 'rising' | 'stable' | 'falling' | 'declining';
  toneDeviation: number;
  displacementAmount: number;
  recenteringActive: boolean;

  // Presence matrix state
  presenceStrength: number;
  toneResonance: number;
  personalityDrift: number;
  layerCoherence: number;

  // Rhythm controller state
  oscillationFrequency: number;
  chaosLevel: number;
  smoothnessScore: number;
  rhythmLockActive: boolean;
  sovereignHarmonic: number;
  sovereignPhase: number;
  sovereignAmplitude: number;

  // Overall
  sovereigntyStrength: number;
}

interface SovereignContextValue {
  state: SovereignState;
  updateIntensity: (value: number) => void;
  updateTone: (warmth: number, formality: number, enthusiasm: number, stability: number) => void;
  updatePresenceStrength: (value: number) => void;
  updateVisualIntensity: (value: number) => void;
  enablePrediction: (enabled: boolean) => void;
  setTargetTone: (warmth: number, formality: number, enthusiasm: number, stability: number) => void;
  setCorePersonality: (warmth: number, formality: number, enthusiasm: number, stability: number, authenticity: number) => void;
  setBaseFrequency: (hz: number) => void;
  reset: () => void;
}

/* ================================ */
/* CONTEXT                          */
/* ================================ */

const SovereignContext = createContext<SovereignContextValue | undefined>(undefined);

export function useSovereignty(): SovereignContextValue {
  const context = useContext(SovereignContext);
  if (!context) {
    throw new Error('useSovereignty must be used within SovereignProvider');
  }
  return context;
}

/* ================================ */
/* PROVIDER                         */
/* ================================ */

interface SovereignProviderProps {
  children: React.ReactNode;
}

export function SovereignProvider({ children }: SovereignProviderProps): JSX.Element {
  // Engine instances
  const fieldRegulatorRef = useRef<EmotionalFieldRegulator | null>(null);
  const balanceEngineRef = useRef<SovereignBalanceEngine | null>(null);
  const presenceMatrixRef = useRef<AdaptivePresenceMatrix | null>(null);
  const rhythmControllerRef = useRef<EmotionalRhythmController | null>(null);

  // State
  const [state, setState] = useState<SovereignState>({
    emotionalIntensity: 50,
    bandwidthUtilization: 0,
    emotionalStability: 100,
    emotionalSmoothness: 100,
    stabilizationMode: 'passive',
    predictedIntensity: 50,
    predictedTone: 'stable',
    toneDeviation: 0,
    displacementAmount: 0,
    recenteringActive: false,
    presenceStrength: 50,
    toneResonance: 100,
    personalityDrift: 0,
    layerCoherence: 100,
    oscillationFrequency: 0,
    chaosLevel: 0,
    smoothnessScore: 100,
    rhythmLockActive: false,
    sovereignHarmonic: 0.5,
    sovereignPhase: 0,
    sovereignAmplitude: 0.7,
    sovereigntyStrength: 0,
  });

  // Initialize engines
  useEffect(() => {
    fieldRegulatorRef.current = new EmotionalFieldRegulator();
    balanceEngineRef.current = new SovereignBalanceEngine();
    presenceMatrixRef.current = new AdaptivePresenceMatrix();
    rhythmControllerRef.current = new EmotionalRhythmController();

    return () => {
      fieldRegulatorRef.current?.destroy();
      balanceEngineRef.current?.destroy();
      presenceMatrixRef.current?.destroy();
      rhythmControllerRef.current?.destroy();
    };
  }, []);

  // Update CSS properties
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty('--sovereign-harmonic', state.sovereignHarmonic.toString());
    root.style.setProperty('--sovereign-phase', `${state.sovereignPhase}deg`);
    root.style.setProperty('--sovereign-amplitude', state.sovereignAmplitude.toString());
    root.style.setProperty('--emotional-intensity', state.emotionalIntensity.toString());
    root.style.setProperty('--emotional-stability', state.emotionalStability.toString());
    root.style.setProperty('--emotional-smoothness', state.emotionalSmoothness.toString());
    root.style.setProperty('--bandwidth-utilization', state.bandwidthUtilization.toString());
    root.style.setProperty('--tone-deviation', state.toneDeviation.toString());
    root.style.setProperty('--displacement-amount', state.displacementAmount.toString());
    root.style.setProperty('--recentering-active', state.recenteringActive ? '1' : '0');
    root.style.setProperty('--oscillation-frequency', state.oscillationFrequency.toString());
    root.style.setProperty('--chaos-level', state.chaosLevel.toString());
    root.style.setProperty('--rhythm-lock-active', state.rhythmLockActive ? '1' : '0');
    root.style.setProperty('--layer-coherence', state.layerCoherence.toString());
    root.style.setProperty('--sovereignty-strength', state.sovereigntyStrength.toString());
    root.style.setProperty('--stability-mode', state.stabilizationMode);

    // Set data attributes for CSS selectors
    const rootElement = document.body.parentElement;
    if (rootElement) {
      rootElement.setAttribute('data-sovereignty-active', 'true');
      rootElement.setAttribute('data-stability-mode', state.stabilizationMode);
      rootElement.setAttribute('data-chaos-high', state.chaosLevel > 60 ? 'true' : 'false');
      rootElement.setAttribute('data-bandwidth-high', state.bandwidthUtilization > 70 ? 'true' : 'false');
      rootElement.setAttribute('data-coherence-low', state.layerCoherence < 70 ? 'true' : 'false');
      rootElement.setAttribute('data-moderation-active', state.oscillationFrequency > 3 ? 'true' : 'false');
    }
  }, [state]);

  // State update cycle (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const fieldRegulator = fieldRegulatorRef.current;
      const balanceEngine = balanceEngineRef.current;
      const presenceMatrix = presenceMatrixRef.current;
      const rhythmController = rhythmControllerRef.current;

      if (!fieldRegulator || !balanceEngine || !presenceMatrix || !rhythmController) return;

      const fieldState = fieldRegulator.getState();
      const balanceState = balanceEngine.getState();
      const presenceState = presenceMatrix.getState();
      const rhythmState = rhythmController.getState();

      // Calculate sovereignty strength (0-100)
      const sovereigntyStrength =
        fieldState.bandwidth.adaptiveCapacity * 0.25 +
        (100 - balanceState.prediction.confidenceLevel) * 0.25 +
        presenceState.alignment.alignmentScore * 0.25 +
        rhythmState.smoothness.smoothnessScore * 0.25;

      setState({
        emotionalIntensity: fieldState.governance.currentIntensity,
        bandwidthUtilization: fieldState.bandwidth.bandwidthUtilization,
        emotionalStability: fieldState.stabilization.stabilityScore,
        emotionalSmoothness: fieldState.smoothing.smoothingStrength * 100,
        stabilizationMode: fieldState.stabilization.adaptiveMode,
        predictedIntensity: balanceState.prediction.predictedIntensity,
        predictedTone: balanceState.prediction.predictedTone as any,
        toneDeviation: balanceState.toneCorrection.toneDeviation,
        displacementAmount: presenceState.displacement.displacementAmount,
        recenteringActive: balanceState.recentering.currentDeviation > 30,
        presenceStrength: presenceState.alignment.presenceStrength,
        toneResonance: presenceState.alignment.toneResonance,
        personalityDrift: presenceState.preservation.driftAmount,
        layerCoherence: presenceState.grid.overallCoherence,
        oscillationFrequency: rhythmState.moderation.oscillationFrequency,
        chaosLevel: rhythmState.dampening.chaosLevel,
        smoothnessScore: rhythmState.smoothness.smoothnessScore,
        rhythmLockActive: rhythmState.rhythmLock.lockActive,
        sovereignHarmonic: balanceState.prediction.trajectorySlope / 200 + 0.5, // normalize to 0-1
        sovereignPhase: rhythmState.rhythmLock.rhythmPhase,
        sovereignAmplitude: fieldState.governance.currentIntensity / 100,
        sovereigntyStrength,
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // API methods
  const updateIntensity = (value: number): void => {
    const fieldRegulator = fieldRegulatorRef.current;
    const balanceEngine = balanceEngineRef.current;
    const presenceMatrix = presenceMatrixRef.current;
    const rhythmController = rhythmControllerRef.current;

    if (!fieldRegulator || !balanceEngine || !presenceMatrix || !rhythmController) return;

    // Update all engines
    fieldRegulator.regulateIntensity(value);
    balanceEngine.updateIntensity(value);
    presenceMatrix.updateIntensity(value);
    rhythmController.updateIntensity(value);
  };

  const updateTone = (warmth: number, formality: number, enthusiasm: number, stability: number): void => {
    const balanceEngine = balanceEngineRef.current;
    const presenceMatrix = presenceMatrixRef.current;

    if (!balanceEngine || !presenceMatrix) return;

    balanceEngine.updateTone(warmth, formality, enthusiasm, stability);
    presenceMatrix.updateTone(warmth, formality, enthusiasm, stability);
  };

  const updatePresenceStrength = (value: number): void => {
    const presenceMatrix = presenceMatrixRef.current;
    const rhythmController = rhythmControllerRef.current;

    if (!presenceMatrix || !rhythmController) return;

    presenceMatrix.updatePresenceStrength(value);
    
    // Update presence phase for rhythm lock
    const presencePhase = (value / 100) * 360;
    rhythmController.updatePresencePhase(presencePhase);
  };

  const updateVisualIntensity = (value: number): void => {
    const balanceEngine = balanceEngineRef.current;

    if (!balanceEngine) return;

    balanceEngine.updateVisualIntensity(value);
  };

  const enablePrediction = (enabled: boolean): void => {
    const balanceEngine = balanceEngineRef.current;

    if (!balanceEngine) return;

    balanceEngine.enablePrediction(enabled ? 10 : 0);
  };

  const setTargetTone = (warmth: number, formality: number, enthusiasm: number, stability: number): void => {
    const balanceEngine = balanceEngineRef.current;

    if (!balanceEngine) return;

    balanceEngine.setTargetTone(warmth, formality, enthusiasm, stability);
  };

  const setCorePersonality = (
    warmth: number,
    formality: number,
    enthusiasm: number,
    stability: number,
    authenticity: number
  ): void => {
    const presenceMatrix = presenceMatrixRef.current;

    if (!presenceMatrix) return;

    presenceMatrix.setCorePersonality(warmth, formality, enthusiasm, stability);
  };

  const setBaseFrequency = (hz: number): void => {
    const rhythmController = rhythmControllerRef.current;

    if (!rhythmController) return;

    rhythmController.setBaseFrequency(hz);
  };

  const reset = (): void => {
    fieldRegulatorRef.current?.reset();
    balanceEngineRef.current?.reset();
    presenceMatrixRef.current?.reset();
    rhythmControllerRef.current?.reset();
  };

  const contextValue: SovereignContextValue = {
    state,
    updateIntensity,
    updateTone,
    updatePresenceStrength,
    updateVisualIntensity,
    enablePrediction,
    setTargetTone,
    setCorePersonality,
    setBaseFrequency,
    reset,
  };

  return (
    <SovereignContext.Provider value={contextValue}>
      <div className="adaptive-sovereignty-root">{children}</div>
    </SovereignContext.Provider>
  );
}
