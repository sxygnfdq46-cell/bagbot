/**
 * LEVEL 7 — ENTITY PROVIDER
 * React Context wrapper for Symbiotic Entity Mode
 * 
 * Provides the living personality layer with:
 * - Harmonic pulse (breathing motion)
 * - User interaction tracking
 * - Symbiotic aura system
 * - Soul-link alignment
 * - Cross-page entity shadow
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useBehavior } from '../bic/BehaviorProvider';
import { useCognitiveFusion } from '../cognitive/CognitiveFusionProvider';
import { EntityCore, EntityOutput, EntityPresence, EntityAura } from './EntityCore';
import { ExpressionCore, ExpressionOutput } from './ExpressionCore';
import { RippleEngine } from './RippleEngine';
import { AttentionStream } from './AttentionStream';

interface EntityContextValue {
  entity: EntityOutput;
  isActive: boolean;
  
  // LEVEL 7.2: Expression output
  expression: ExpressionOutput | null;
  
  // Cross-page shadow state
  entityShadow: {
    glowStrength: number;
    densityFactor: number;
    tempoMultiplier: number;
    presenceIntensity: number;
  };
}

const defaultEntity: EntityOutput = {
  presence: {
    presenceStrength: 0,
    pulsePhase: 0,
    pulseTempo: 45,
    connectionIntensity: 0,
    breathingAmplitude: 0.5,
    isAwake: false,
    isWatching: false,
    isResponding: false,
  },
  aura: {
    mode: 'calm-sync',
    color: '#0088ff',
    intensity: 35,
    radius: 45,
    shimmer: 30,
  },
  userState: {
    mouseActivity: 0,
    clickFrequency: 0,
    scrollVelocity: 0,
    keyboardActivity: 0,
    sessionDuration: 0,
    pageVisitCount: 0,
    averagePageTime: 0,
    interactionIntensity: 0,
    isInFlow: false,
    flowDepth: 0,
  },
  alignment: 50,
  resonance: 0,
  empathy: 0,
};

const EntityContext = createContext<EntityContextValue>({
  entity: defaultEntity,
  isActive: false,
  expression: null,
  entityShadow: {
    glowStrength: 50,
    densityFactor: 1.0,
    tempoMultiplier: 1.0,
    presenceIntensity: 0,
  },
});

export const useEntity = () => useContext(EntityContext);

interface EntityProviderProps {
  children: React.ReactNode;
}
export const EntityProvider: React.FC<EntityProviderProps> = ({ children }) => {
  const { behavior } = useBehavior();
  const { cognitive } = useCognitiveFusion();
  const [entity, setEntity] = useState<EntityOutput>(defaultEntity);
  const [expression, setExpression] = useState<ExpressionOutput | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pageContext, setPageContext] = useState<string>('unknown');
  
  const entityRef = useRef<EntityCore>(new EntityCore());
  const expressionRef = useRef<ExpressionCore>(new ExpressionCore());
  const rippleRef = useRef<RippleEngine>(new RippleEngine());
  const attentionRef = useRef<AttentionStream>(new AttentionStream());
  
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0, velocity: 0 });
  const lastCursorPosition = useRef({ x: 0, y: 0, time: Date.now() });
  
  // Detect page context from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      setPageContext(path === '/' ? 'home' : path.slice(1));
    }
  }, []);
  
  // User interaction tracking (Level 7 + 7.2)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = (e: MouseEvent) => {
      // Level 7: Entity tracking
      entityRef.current.trackMouseMove(e.clientX, e.clientY);
      
      // Level 7.2: Calculate cursor velocity
      const now = Date.now();
      const deltaTime = now - lastCursorPosition.current.time;
      const deltaX = e.clientX - lastCursorPosition.current.x;
      const deltaY = e.clientY - lastCursorPosition.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = deltaTime > 0 ? (distance / deltaTime) * 16.67 : 0; // Normalize to per-frame
      
      setCursorPosition({ x: e.clientX, y: e.clientY, velocity });
      lastCursorPosition.current = { x: e.clientX, y: e.clientY, time: now };
      
      // Attention tracking
      attentionRef.current.trackMouseMove(e.clientX, e.clientY);
      
      // Create cursor ripple
      rippleRef.current.createCursorRipple(e.clientX, e.clientY, velocity);
    };
    
    const handleClick = (e: MouseEvent) => {
      entityRef.current.trackClick();
      
      // Level 7.2: Create interaction ripple
      rippleRef.current.createInteractionRipple(e.clientX, e.clientY, 80);
      attentionRef.current.detectGlance(e.clientX, e.clientY);
    };
    
    const handleScroll = () => {
      entityRef.current.trackScroll();
    };
    
    const handleKeyPress = () => {
      entityRef.current.trackKeyPress();
      
      // Level 7.2: Track typing velocity
      rippleRef.current.trackTyping();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  
  // Entity + Expression consciousness loop (60fps)
  useEffect(() => {
    let animationFrameId: number;
    let lastUpdate = Date.now();
    const targetFps = 60;
    const frameInterval = 1000 / targetFps;
    
    const entityLoop = () => {
      const now = Date.now();
      const delta = now - lastUpdate;
      
      if (delta >= frameInterval) {
        // Process Level 7 entity with current state
        const output = entityRef.current.process(
          cognitive.visualBinding.quantumFieldWarp, // Data volatility proxy
          behavior.intensity,                        // Market pressure
          behavior.emotionalState,                   // Emotional state
          pageContext                                // Current page
        );
        
        setEntity(output);
        
        // Process Level 7.2 expressions
        const typingVelocity = rippleRef.current.getTypingVelocity();
        const expressionOutput = expressionRef.current.process(
          output.presence,
          output.aura,
          output.userState,
          behavior.emotionalState,
          behavior.intensity,
          typingVelocity,
          cursorPosition
        );
        
        setExpression(expressionOutput);
        
        // Update ripples
        rippleRef.current.update(delta);
        
        // Attention cleanup
        attentionRef.current.cleanup();
        
        setIsActive(true);
        lastUpdate = now - (delta % frameInterval);
      }
      
      animationFrameId = requestAnimationFrame(entityLoop);
    };
    
    // Start the entity consciousness loop
    animationFrameId = requestAnimationFrame(entityLoop);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [behavior, cognitive, pageContext, cursorPosition]);
  
  // Calculate cross-page entity shadow
  const entityShadow = {
    glowStrength: entity.presence.presenceStrength,
    densityFactor: 0.5 + (entity.aura.intensity / 200),
    tempoMultiplier: entity.presence.pulseTempo / 60, // Normalize to 1.0 at 60 BPM
    presenceIntensity: entity.presence.connectionIntensity,
  };
  
  const contextValue: EntityContextValue = {
    entity,
    isActive,
    expression,
    entityShadow,
  };
  
  return (
    <EntityContext.Provider value={contextValue}>
      {children}
    </EntityContext.Provider>
  );
};
