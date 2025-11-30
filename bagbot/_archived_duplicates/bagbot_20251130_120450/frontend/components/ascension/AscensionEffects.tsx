/**
 * GOD-MODE LEVEL 5 — THE ASCENSION SUITE
 * React components for the 8 final transformation systems
 * 
 * These sit on top of the Quantum Layer (Level 4) and provide
 * the ultimate peak of browser UI capabilities.
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ========================================
// SYSTEM 1: NEURAL-SYNAPSE UI
// ========================================

interface NeuralSynapseProps {
  active?: boolean;
  marketPulse?: number; // 0-100 intensity
  children: React.ReactNode;
}

export const NeuralSynapse: React.FC<NeuralSynapseProps> = ({ 
  active = false, 
  marketPulse = 0,
  children 
}) => {
  const [synapses, setSynapses] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || marketPulse < 30) return;

    const interval = setInterval(() => {
      const newSynapse = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100
      };
      setSynapses(prev => [...prev, newSynapse]);
      
      // Remove after animation
      setTimeout(() => {
        setSynapses(prev => prev.filter(s => s.id !== newSynapse.id));
      }, 800);
    }, 2000 - (marketPulse * 15)); // Faster with higher pulse

    return () => clearInterval(interval);
  }, [active, marketPulse]);

  return (
    <div ref={containerRef} className={`neural-synapse ${active ? 'neural-active' : ''}`}>
      {synapses.map(synapse => (
        <div
          key={synapse.id}
          className="synapse-fire"
          style={{
            position: 'absolute',
            top: `${synapse.y}%`,
            left: `${synapse.x}%`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,255,255,1) 0%, rgba(0,255,255,0) 70%)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        />
      ))}
      {children}
    </div>
  );
};

// ========================================
// SYSTEM 2: AI-EMOTION HOLOAURA
// ========================================

type AIEmotion = 'curious' | 'thinking' | 'excited' | 'confused' | 'confident' | 'idle';

interface AIEmotionAuraProps {
  emotion: AIEmotion;
  intensity?: number; // 0-1
  children: React.ReactNode;
}

export const AIEmotionAura: React.FC<AIEmotionAuraProps> = ({ 
  emotion, 
  intensity = 1,
  children 
}) => {
  const emotionClass = emotion !== 'idle' ? `ai-emotion-${emotion}` : '';
  
  return (
    <div 
      className={emotionClass}
      style={{
        position: 'relative',
        borderRadius: '12px',
        padding: '2px',
        opacity: intensity,
        transition: 'opacity 0.5s ease'
      }}
    >
      {children}
    </div>
  );
};

// ========================================
// SYSTEM 3: GRAVITY-WARP TRANSITIONS
// ========================================

interface GravityWarpProps {
  isEntering?: boolean;
  isExiting?: boolean;
  children: React.ReactNode;
}

export const GravityWarp: React.FC<GravityWarpProps> = ({ 
  isEntering, 
  isExiting, 
  children 
}) => {
  const warpClass = isEntering ? 'gravity-warp-enter' : isExiting ? 'gravity-warp-exit' : '';
  
  return (
    <div 
      className={warpClass}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {children}
    </div>
  );
};

// Spacetime distortion effect
export const SpacetimeBend: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="spacetime-bend">
      {children}
    </div>
  );
};

// ========================================
// SYSTEM 4: TEMPORAL DISPLACEMENT FX
// ========================================

interface TemporalDisplacementProps {
  active?: boolean;
  children: React.ReactNode;
}

export const TemporalDisplacement: React.FC<TemporalDisplacementProps> = ({ 
  active = false, 
  children 
}) => {
  const [echoes, setEchoes] = useState<number[]>([]);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const echoId = Date.now();
      setEchoes(prev => [...prev, echoId]);
      
      setTimeout(() => {
        setEchoes(prev => prev.filter(id => id !== echoId));
      }, 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <div className={active ? 'temporal-pulse' : ''} style={{ position: 'relative' }}>
      {echoes.map(echoId => (
        <div
          key={echoId}
          className="temporal-echo"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '8px',
            pointerEvents: 'none'
          }}
        />
      ))}
      <div className={active ? 'chrono-distort' : ''}>
        {children}
      </div>
    </div>
  );
};

// ========================================
// SYSTEM 5: QUANTUM RIPPLE PROPAGATION
// ========================================

interface QuantumRippleProps {
  trigger?: boolean;
  origin?: { x: number; y: number };
  children: React.ReactNode;
}

export const QuantumRipple: React.FC<QuantumRippleProps> = ({ 
  trigger, 
  origin = { x: 50, y: 50 },
  children 
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((x: number, y: number) => {
    const rippleId = Date.now();
    setRipples(prev => [...prev, { id: rippleId, x, y }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 1200);
  }, []);

  useEffect(() => {
    if (trigger) {
      createRipple(origin.x, origin.y);
    }
  }, [trigger, origin, createRipple]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    createRipple(x, y);
  };

  return (
    <div 
      ref={containerRef}
      onClick={handleClick}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="ripple-origin"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            width: '20px',
            height: '20px',
            marginLeft: '-10px',
            marginTop: '-10px'
          }}
        />
      ))}
      {children}
    </div>
  );
};

// Signal-specific ripple (for Signals page)
export const SignalRipple: React.FC<{ trigger: boolean; color?: string }> = ({ 
  trigger, 
  color = 'rgba(255, 0, 255, 0.6)' 
}) => {
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      const rippleId = Date.now();
      setRipples(prev => [...prev, rippleId]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(id => id !== rippleId));
      }, 1000);
    }
  }, [trigger]);

  return (
    <>
      {ripples.map(rippleId => (
        <div
          key={rippleId}
          className="signal-ripple"
          style={{
            left: '50%',
            top: '50%',
            width: '40px',
            height: '40px',
            marginLeft: '-20px',
            marginTop: '-20px',
            borderColor: color
          }}
        />
      ))}
    </>
  );
};

// ========================================
// SYSTEM 6: HALOFLUX LAYER
// ========================================

type HaloFluxIntensity = 'idle' | 'active' | 'intense';

interface HaloFluxProps {
  intensity: HaloFluxIntensity;
}

export const HaloFlux: React.FC<HaloFluxProps> = ({ intensity }) => {
  return (
    <div 
      className={`haloflux-layer haloflux-${intensity}`}
      aria-hidden="true"
    />
  );
};

// ========================================
// SYSTEM 7: EVENT-DRIVEN AURORA STREAMS
// ========================================

interface AuroraStreamProps {
  event: 'trade' | 'signal' | 'order' | 'alert' | 'system';
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const AuroraStream: React.FC<AuroraStreamProps> = ({ event, position = 'top' }) => {
  const [streams, setStreams] = useState<number[]>([]);

  useEffect(() => {
    const streamId = Date.now();
    setStreams(prev => [...prev, streamId]);
    
    setTimeout(() => {
      setStreams(prev => prev.filter(id => id !== streamId));
    }, 3000);
  }, [event]);

  const positionStyles = {
    top: { top: '10%', left: 0 },
    bottom: { bottom: '10%', left: 0 },
    left: { left: 0, top: '50%', width: '2px', height: '100%', transform: 'rotate(90deg)' },
    right: { right: 0, top: '50%', width: '2px', height: '100%', transform: 'rotate(90deg)' }
  };

  return (
    <>
      {streams.map(streamId => (
        <div
          key={streamId}
          className="aurora-stream"
          style={{
            ...positionStyles[position],
            zIndex: 9999
          }}
        />
      ))}
    </>
  );
};

// Aurora burst (for major events)
export const AuroraBurst: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <div
      className="aurora-burst"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: '100px',
        height: '100px',
        marginLeft: '-50px',
        marginTop: '-50px',
        zIndex: 9999
      }}
    />
  );
};

// Global aurora background
export const AuroraBackground: React.FC = () => {
  return <div className="aurora-background" aria-hidden="true" />;
};

// ========================================
// SYSTEM 8: ADAPTIVE HUD SCALING
// ========================================

interface AdaptiveHUDProps {
  mode: 'compact' | 'expand' | 'normal';
  priority?: boolean;
  children: React.ReactNode;
}

export const AdaptiveHUD: React.FC<AdaptiveHUDProps> = ({ 
  mode, 
  priority = false,
  children 
}) => {
  const hudClass = 
    mode === 'compact' ? 'hud-compact' :
    mode === 'expand' ? 'hud-expand' :
    '';
  
  const priorityClass = priority ? 'hud-priority' : '';

  return (
    <div className={`${hudClass} ${priorityClass}`.trim()}>
      {children}
    </div>
  );
};

// HUD item with enter/exit animations
interface HUDItemProps {
  visible: boolean;
  children: React.ReactNode;
}

export const HUDItem: React.FC<HUDItemProps> = ({ visible, children }) => {
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div className={visible ? 'hud-enter' : 'hud-exit'}>
      {children}
    </div>
  );
};

// ========================================
// MASTER ASCENSION WRAPPER
// ========================================

interface AscensionMasterProps {
  enableNeural?: boolean;
  enableTemporal?: boolean;
  haloIntensity?: HaloFluxIntensity;
  marketPulse?: number;
  children: React.ReactNode;
}

export const AscensionMaster: React.FC<AscensionMasterProps> = ({
  enableNeural = false,
  enableTemporal = false,
  haloIntensity = 'idle',
  marketPulse = 0,
  children
}) => {
  return (
    <>
      <HaloFlux intensity={haloIntensity} />
      <AuroraBackground />
      <NeuralSynapse active={enableNeural} marketPulse={marketPulse}>
        <TemporalDisplacement active={enableTemporal}>
          {children}
        </TemporalDisplacement>
      </NeuralSynapse>
    </>
  );
};
