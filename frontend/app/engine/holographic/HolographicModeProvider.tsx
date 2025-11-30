/**
 * 🚀 HOLOGRAPHIC MODE PROVIDER
 * 
 * Unified provider for all Level 8 — Holographic Adaptive Mode components.
 * Integrates with Level 7 (Entity + Evolution) systems.
 */

'use client';

import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import {
  HoloSkin,
  HoloSkinState,
  EmotionalResonance,
  ResonanceState,
  PanelManager,
  PanelManagerState,
  HolographicForecast,
  ForecastState,
  AdaptiveLightIntelligence,
  ALIState,
  PresenceEffectV2,
  PresenceEffectState,
} from './index';
import { useMemoryImprint } from '../entity/MemoryImprintProvider';
import { useEntity } from '../entity/EntityProvider';

// ============================================
// CONTEXT TYPES
// ============================================

interface HolographicModeContextValue {
  // States
  holoSkin: HoloSkinState | null;
  emotionalResonance: ResonanceState | null;
  panelManager: PanelManagerState | null;
  holographicForecast: ForecastState | null;
  adaptiveLightIntelligence: ALIState | null;
  presenceEffect: PresenceEffectState | null;

  // Methods
  trackInteraction: (type: 'keypress' | 'click' | 'hover' | 'scroll' | 'command', metadata?: any) => void;
  trackCursor: (position: { x: number; y: number }) => void;
  triggerRipple: (type: 'speech' | 'typing' | 'click' | 'hover', position?: { x: number; y: number }) => void;
  registerPanel: (id: string, type: any, priority?: number) => void;
  unregisterPanel: (id: string) => void;
  trackPanelFocus: (id: string) => void;
  markPredictionFulfilled: (type: any, what: string) => void;
  registerPanelForShadow: (id: string, reactive?: boolean) => void;

  // Getters
  getHoloMeshForRendering: () => any;
  getResonanceVisuals: () => any;
  getForecastVisuals: () => any;
  getGlowLayers: () => any;
  getThinkingNodes: () => any;
  getGridTilt: () => { angleX: number; angleY: number };
  getRippleWaves: () => any[];
  getPresenceIntensity: () => number;

  // Reset
  reset: () => void;
}

const HolographicModeContext = createContext<HolographicModeContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export function HolographicModeProvider({ children }: { children: React.ReactNode }) {
  // Get Level 7 context (Entity + Evolution)
  const memoryContext = useMemoryImprint();
  
  // Get expression from Entity Provider (Level 6.1)
  const { expression } = useEntity();

  // Initialize Level 8 engines (refs for persistence)
  const holoSkinRef = useRef<HoloSkin | null>(null);
  const emotionalResonanceRef = useRef<EmotionalResonance | null>(null);
  const panelManagerRef = useRef<PanelManager | null>(null);
  const holographicForecastRef = useRef<HolographicForecast | null>(null);
  const aliRef = useRef<AdaptiveLightIntelligence | null>(null);
  const presenceEffectRef = useRef<PresenceEffectV2 | null>(null);

  // State for components
  const [holoSkin, setHoloSkin] = useState<HoloSkinState | null>(null);
  const [emotionalResonance, setEmotionalResonance] = useState<ResonanceState | null>(null);
  const [panelManager, setPanelManager] = useState<PanelManagerState | null>(null);
  const [holographicForecast, setHolographicForecast] = useState<ForecastState | null>(null);
  const [ali, setAli] = useState<ALIState | null>(null);
  const [presenceEffect, setPresenceEffect] = useState<PresenceEffectState | null>(null);

  // Cursor tracking
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
  const [isInteracting, setIsInteracting] = useState(false);

  // System metrics
  const [systemMetrics, setSystemMetrics] = useState({
    load: 0,
    apiCalls: 0,
    apiPending: 0,
    dataLoading: false,
    connectionStatus: 'connected' as 'connected' | 'connecting' | 'disconnected',
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize all Level 8 engines
    holoSkinRef.current = new HoloSkin();
    emotionalResonanceRef.current = new EmotionalResonance();
    panelManagerRef.current = new PanelManager();
    holographicForecastRef.current = new HolographicForecast();
    aliRef.current = new AdaptiveLightIntelligence();
    presenceEffectRef.current = new PresenceEffectV2();

    // Set initial states
    setHoloSkin(holoSkinRef.current.getState());
    setEmotionalResonance(emotionalResonanceRef.current.getState());
    setPanelManager(panelManagerRef.current.getState());
    setHolographicForecast(holographicForecastRef.current.getState());
    setAli(aliRef.current.getState());
    setPresenceEffect(presenceEffectRef.current.getState());

    // Track cursor globally
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setCursorPosition({ x, y });
      setIsInteracting(true);

      // Reset interaction flag after delay
      setTimeout(() => setIsInteracting(false), 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // ============================================
  // UPDATE LOOP
  // ============================================

  useEffect(() => {
    if (!memoryContext.genome || !expression) return;

    const interval = setInterval(() => {
      // Update all Level 8 systems
      if (holoSkinRef.current) {
        const newState = holoSkinRef.current.update(
          memoryContext.genome!,
          expression,
          cursorPosition,
          { load: systemMetrics.load, apiCalls: systemMetrics.apiCalls }
        );
        setHoloSkin(newState);
      }

      if (emotionalResonanceRef.current) {
        const newState = emotionalResonanceRef.current.update(
          memoryContext.genome!,
          expression
        );
        setEmotionalResonance(newState);
      }

      if (panelManagerRef.current) {
        panelManagerRef.current.update(memoryContext.genome!);
        setPanelManager(panelManagerRef.current.getState());
      }

      if (holographicForecastRef.current) {
        const newState = holographicForecastRef.current.update(
          memoryContext.genome!,
          expression,
          {
            apiPending: systemMetrics.apiPending,
            dataLoading: systemMetrics.dataLoading,
            connectionStatus: systemMetrics.connectionStatus,
          }
        );
        setHolographicForecast(newState);
      }

      if (aliRef.current) {
        const newState = aliRef.current.update(
          memoryContext.genome!,
          expression,
          {
            isThinking: false, // TODO: track from AI responses
            cursorPosition,
          }
        );
        setAli(newState);
      }

      if (presenceEffectRef.current) {
        const newState = presenceEffectRef.current.update(
          memoryContext.genome!,
          expression,
          {
            cursorPosition,
            screenCenter: { x: 50, y: 50 },
            isInteracting,
          }
        );
        setPresenceEffect(newState);
      }
    }, 1000 / 30); // 30 FPS update rate

    return () => clearInterval(interval);
  }, [
    memoryContext.genome,
    expression,
    cursorPosition,
    isInteracting,
    systemMetrics,
  ]);

  // ============================================
  // METHODS
  // ============================================

  const trackInteraction = (
    type: 'keypress' | 'click' | 'hover' | 'scroll' | 'command',
    metadata?: any
  ) => {
    emotionalResonanceRef.current?.recordInteraction(type, metadata);

    // Auto-trigger ripples for certain interactions
    if (type === 'keypress' || type === 'click') {
      presenceEffectRef.current?.trackUserActivity(type === 'keypress' ? 'typing' : 'click');
    }
  };

  const trackCursor = (position: { x: number; y: number }) => {
    setCursorPosition(position);
  };

  const triggerRipple = (
    type: 'speech' | 'typing' | 'click' | 'hover',
    position?: { x: number; y: number }
  ) => {
    presenceEffectRef.current?.triggerRipple(type, position);
  };

  const registerPanel = (id: string, type: any, priority: number = 5) => {
    panelManagerRef.current?.registerPanel(id, type, priority);
  };

  const unregisterPanel = (id: string) => {
    panelManagerRef.current?.unregisterPanel(id);
  };

  const trackPanelFocus = (id: string) => {
    panelManagerRef.current?.trackFocus(id);
  };

  const markPredictionFulfilled = (type: any, what: string) => {
    holographicForecastRef.current?.markPredictionFulfilled(type, what);
  };

  const registerPanelForShadow = (id: string, reactive: boolean = true) => {
    aliRef.current?.registerPanel(id, reactive);
  };

  // Getters
  const getHoloMeshForRendering = () => holoSkinRef.current?.getMeshForRendering();
  const getResonanceVisuals = () => ({
    visualResponse: emotionalResonanceRef.current?.getVisualResponse(),
    holoLines: emotionalResonanceRef.current?.getHoloLines(),
  });
  const getForecastVisuals = () => holographicForecastRef.current?.getVisuals();
  const getGlowLayers = () => aliRef.current?.getGlowLayers();
  const getThinkingNodes = () => aliRef.current?.getThinkingNodes();
  const getGridTilt = () => presenceEffectRef.current?.getGridTilt() || { angleX: 0, angleY: 0 };
  const getRippleWaves = () => presenceEffectRef.current?.getRippleWaves() || [];
  const getPresenceIntensity = () => presenceEffectRef.current?.getPresenceIntensity() || 0;

  const reset = () => {
    holoSkinRef.current?.reset();
    emotionalResonanceRef.current?.reset();
    panelManagerRef.current?.reset();
    holographicForecastRef.current?.reset();
    aliRef.current?.reset();
    presenceEffectRef.current?.reset();
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: HolographicModeContextValue = {
    // States
    holoSkin,
    emotionalResonance,
    panelManager,
    holographicForecast,
    adaptiveLightIntelligence: ali,
    presenceEffect,

    // Methods
    trackInteraction,
    trackCursor,
    triggerRipple,
    registerPanel,
    unregisterPanel,
    trackPanelFocus,
    markPredictionFulfilled,
    registerPanelForShadow,

    // Getters
    getHoloMeshForRendering,
    getResonanceVisuals,
    getForecastVisuals,
    getGlowLayers,
    getThinkingNodes,
    getGridTilt,
    getRippleWaves,
    getPresenceIntensity,

    // Reset
    reset,
  };

  return (
    <HolographicModeContext.Provider value={value}>
      {children}
    </HolographicModeContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useHolographicMode() {
  const context = useContext(HolographicModeContext);
  if (!context) {
    throw new Error('useHolographicMode must be used within HolographicModeProvider');
  }
  return context;
}
