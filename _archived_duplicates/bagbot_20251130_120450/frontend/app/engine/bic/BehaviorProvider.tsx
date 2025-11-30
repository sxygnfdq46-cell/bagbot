/**
 * LEVEL 6.1 — GLOBAL BEHAVIOR CONTEXT
 * React Context + Provider for BIC
 * 
 * Wraps the entire app and provides behavior state at 60fps
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { BehaviorCore, BehaviorOutput } from './BehaviorCore';
import { useAPI, useAPIPoll } from '@/lib/hooks/useAPI';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

interface BehaviorContextValue {
  behavior: BehaviorOutput;
  isActive: boolean;
}

const defaultBehavior: BehaviorOutput = {
  emotionalState: 'calm',
  auraIntensity: 50,
  hudGlowStrength: 50,
  backgroundPulseSpeed: 30,
  dataRippleFrequency: 10,
  colorTemperature: 0,
  systemWarnings: [],
  marketMood: 'Initializing...',
  intensity: 20,
};

const BehaviorContext = createContext<BehaviorContextValue>({
  behavior: defaultBehavior,
  isActive: false,
});

export const useBehavior = () => useContext(BehaviorContext);

interface BehaviorProviderProps {
  children: React.ReactNode;
}

export const BehaviorProvider: React.FC<BehaviorProviderProps> = ({ children }) => {
  const [behavior, setBehavior] = useState<BehaviorOutput>(defaultBehavior);
  const [isActive, setIsActive] = useState(false);
  const coreRef = useRef<BehaviorCore>(new BehaviorCore());
  
  // Ingest market summary (every 5s)
  const { data: marketSummary } = useAPIPoll<any>('/api/market/summary', 5000);
  
  // Ingest prices (every 2s)
  const { data: prices } = useAPIPoll<any[]>('/api/market/prices', 2000);
  
  // Ingest volatility (every 3s)
  const { data: volatility } = useAPIPoll<any>('/api/market/volatility', 3000);
  
  // Ingest strategy performance (every 5s)
  const { data: strategies } = useAPIPoll<any>('/api/strategies/performance', 5000);
  
  // Ingest system health (every 5s)
  const { data: systemHealth } = useAPIPoll<any>('/api/system/health', 5000);
  
  // Ingest liquidity (every 5s)
  const { data: liquidity } = useAPIPoll<any>('/api/market/liquidity', 5000);
  
  // WebSocket for real-time price updates
  const { data: livePrice } = useWebSocket<any>({
    channel: 'prices',
    enabled: true,
    autoConnect: true,
  });
  
  // WebSocket for real-time signals
  const { data: liveSignal } = useWebSocket<any>({
    channel: 'signals',
    enabled: true,
    autoConnect: true,
  });
  
  // 60fps update cycle
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();
    const targetFps = 60;
    const frameInterval = 1000 / targetFps;
    
    const updateLoop = () => {
      const now = Date.now();
      const delta = now - lastUpdate;
      
      if (delta >= frameInterval) {
        // Ingest all current data
        const output = coreRef.current.ingest({
          marketSummary,
          prices,
          volatility,
          strategies,
          systemHealth,
          liquidity,
        });
        
        setBehavior(output);
        setIsActive(true);
        lastUpdate = now - (delta % frameInterval);
      }
      
      animationFrameId = requestAnimationFrame(updateLoop);
    };
    
    // Start the loop
    animationFrameId = requestAnimationFrame(updateLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [marketSummary, prices, volatility, strategies, systemHealth, liquidity]);
  
  // React to live price changes
  useEffect(() => {
    if (livePrice) {
      // Trigger immediate ripple or pulse effect
      const currentIntensity = behavior.intensity;
      setBehavior(prev => ({
        ...prev,
        intensity: Math.min(100, currentIntensity + 10),
      }));
      
      // Decay back after 500ms
      setTimeout(() => {
        setBehavior(prev => ({
          ...prev,
          intensity: currentIntensity,
        }));
      }, 500);
    }
  }, [livePrice, behavior.intensity]);
  
  // React to live signals
  useEffect(() => {
    if (liveSignal) {
      // Add warning if signal is strong
      if (liveSignal.confidence > 80) {
        coreRef.current.addWarning(`Strong ${liveSignal.type} signal: ${liveSignal.pair}`);
      }
    }
  }, [liveSignal]);
  
  return (
    <BehaviorContext.Provider value={{ behavior, isActive }}>
      {children}
    </BehaviorContext.Provider>
  );
};
