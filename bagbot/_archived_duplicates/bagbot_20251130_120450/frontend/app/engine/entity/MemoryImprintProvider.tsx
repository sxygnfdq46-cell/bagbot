/**
 * LEVEL 7.3-7.4: MEMORY IMPRINT PROVIDER WITH BEHAVIORAL EVOLUTION
 * 
 * Binds the memory + evolution system into:
 * - Ascension (L5)
 * - Consciousness (L6.1)
 * - Cognitive Fusion (L6.2)
 * - Symbiotic Engine (L7.1-7.2)
 * - Memory Imprint (L7.3)
 * - Behavioral Evolution (L7.4)
 * 
 * So the system no longer "resets." It remembers your patterns across days and sessions,
 * AND evolves its behavior based on how YOU change over time.
 */

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { EntityMemory, MemorySnapshot, InteractionEvent } from './EntityMemory';
import { SoulLinkCore, SoulLinkScores } from './SoulLinkCore';
import { BehaviorGenome, GenomeSnapshot, PersonalityProfile } from './BehaviorGenome';
import { EvolutionClock, EvolutionTimeline } from './EvolutionClock';
import { ResonanceMatrix, ResonanceMetrics } from './ResonanceMatrix';
import { IdentityAnchor, IdentityCore } from './IdentityAnchor';
import { StabilityCore, StabilityMetrics } from './StabilityCore';
import { SelfHeal, HealthDiagnostics } from './SelfHeal';
import { HarmonicLimiter, HarmonicState } from './HarmonicLimiter';
import { CognitiveWeights, WeightBalance } from './CognitiveWeights';
import { IdentityRing, IdentityLock } from './IdentityRing';
import { useEntity } from './EntityProvider';
import { useBehavior } from '../bic/BehaviorProvider';
import { useCognitiveFusion } from '../cognitive/CognitiveFusionProvider';

// ============================================
// CONTEXT TYPES
// ============================================

export interface MemoryImprintContext {
  // Level 7.3: Memory & Soul-Link
  memory: MemorySnapshot | null;
  soulLink: SoulLinkScores | null;
  personalityMap: {
    dominantMood: string;
    navigationStyle: string;
    peakTime: string;
    engagementStyle: string;
    emotionalBaseline: string;
    interactionRhythm: number;
  } | null;
  relationshipStatus: string;
  bondQuality: {
    stable: boolean;
    growing: boolean;
    harmonious: boolean;
    deep: boolean;
  } | null;
  driftProfile: string; // 'calm' | 'focused' | 'active' | 'intense'
  
  // Level 7.4: Behavioral Evolution
  genome: GenomeSnapshot | null;
  evolutionTimeline: EvolutionTimeline | null;
  resonanceMetrics: ResonanceMetrics | null;
  identityCore: IdentityCore | null;
  personalityProfile: PersonalityProfile | null;
  
  // Level 7.5: Stability & Self-Regulation
  stabilityMetrics: StabilityMetrics | null;
  healthDiagnostics: HealthDiagnostics | null;
  harmonicState: HarmonicState | null;
  weightBalance: WeightBalance | null;
  identityLock: IdentityLock | null;
  
  recordInteraction: (event: Partial<InteractionEvent>) => void;
  clearMemory: () => void;
  resetEvolution: () => void;
  resetStability: () => void;
}

const MemoryImprintContext = createContext<MemoryImprintContext | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

export function MemoryImprintProvider({ children }: { children: ReactNode }) {
  // Core engines - Level 7.3
  const entityMemoryRef = useRef<EntityMemory>(new EntityMemory());
  const soulLinkRef = useRef<SoulLinkCore>(new SoulLinkCore());
  
  // Core engines - Level 7.4
  const behaviorGenomeRef = useRef<BehaviorGenome>(new BehaviorGenome());
  const evolutionClockRef = useRef<EvolutionClock>(new EvolutionClock());
  const resonanceMatrixRef = useRef<ResonanceMatrix>(new ResonanceMatrix());
  const identityAnchorRef = useRef<IdentityAnchor>(new IdentityAnchor());
  
  // Core engines - Level 7.5
  const stabilityCoreRef = useRef<StabilityCore>(new StabilityCore());
  const selfHealRef = useRef<SelfHeal>(new SelfHeal());
  const harmonicLimiterRef = useRef<HarmonicLimiter>(new HarmonicLimiter());
  const cognitiveWeightsRef = useRef<CognitiveWeights>(new CognitiveWeights());
  const identityRingRef = useRef<IdentityRing>(new IdentityRing());
  
  // Consciousness layer hooks
  const { entity, expression } = useEntity();
  const { behavior } = useBehavior();
  const { cognitive } = useCognitiveFusion();
  
  // State - Level 7.3
  const [memory, setMemory] = useState<MemorySnapshot | null>(null);
  const [soulLink, setSoulLink] = useState<SoulLinkScores | null>(null);
  const [personalityMap, setPersonalityMap] = useState<MemoryImprintContext['personalityMap']>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<string>('discovering');
  const [bondQuality, setBondQuality] = useState<MemoryImprintContext['bondQuality']>(null);
  const [driftProfile, setDriftProfile] = useState<string>('calm');
  
  // State - Level 7.4
  const [genome, setGenome] = useState<GenomeSnapshot | null>(null);
  const [evolutionTimeline, setEvolutionTimeline] = useState<EvolutionTimeline | null>(null);
  const [resonanceMetrics, setResonanceMetrics] = useState<ResonanceMetrics | null>(null);
  const [identityCore, setIdentityCore] = useState<IdentityCore | null>(null);
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  
  // State - Level 7.5
  const [stabilityMetrics, setStabilityMetrics] = useState<StabilityMetrics | null>(null);
  const [healthDiagnostics, setHealthDiagnostics] = useState<HealthDiagnostics | null>(null);
  const [harmonicState, setHarmonicState] = useState<HarmonicState | null>(null);
  const [weightBalance, setWeightBalance] = useState<WeightBalance | null>(null);
  const [identityLock, setIdentityLock] = useState<IdentityLock | null>(null);
  
  // Tracking refs
  const lastInteractionTime = useRef<number>(Date.now());
  const currentRoute = useRef<string>('');
  const interactionBuffer = useRef<InteractionEvent[]>([]);
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  useEffect(() => {
    // Load initial memory and soul-link (Level 7.3)
    const initialMemory = entityMemoryRef.current.getMemorySnapshot();
    const initialSoulLink = soulLinkRef.current.getScores();
    const initialPersonality = entityMemoryRef.current.getPersonalityMap();
    const initialStatus = soulLinkRef.current.getRelationshipStatus();
    const initialQuality = soulLinkRef.current.getBondQuality();
    
    setMemory(initialMemory);
    setSoulLink(initialSoulLink);
    setPersonalityMap(initialPersonality);
    setRelationshipStatus(initialStatus);
    setBondQuality(initialQuality);
    setDriftProfile(calculateDriftProfile(initialPersonality));
    
    // Load initial evolution state (Level 7.4)
    const initialGenome = behaviorGenomeRef.current.getSnapshot();
    const initialTimeline = evolutionClockRef.current.getTimeline();
    const initialResonance = resonanceMatrixRef.current.getMetrics();
    const initialIdentity = identityAnchorRef.current.getIdentity();
    const initialProfile = behaviorGenomeRef.current.getPersonalityProfile();
    
    setGenome(initialGenome);
    setEvolutionTimeline(initialTimeline);
    setResonanceMetrics(initialResonance);
    setIdentityCore(initialIdentity);
    setPersonalityProfile(initialProfile);
    
    // Initialize identity anchor from first genome
    identityAnchorRef.current.initializeIdentity(initialGenome);
    
    // Load initial stability state (Level 7.5)
    const initialStability = stabilityCoreRef.current.getMetrics();
    const initialHealth = selfHealRef.current.getDiagnostics();
    const initialHarmonic = harmonicLimiterRef.current.getState();
    const initialWeights = cognitiveWeightsRef.current.getWeights();
    const initialLock = identityRingRef.current.getLock();
    
    setStabilityMetrics(initialStability);
    setHealthDiagnostics(initialHealth);
    setHarmonicState(initialHarmonic);
    setWeightBalance({ weights: initialWeights, isBalanced: true, imbalances: [], totalWeight: 200, targetWeight: 200 });
    setIdentityLock(initialLock);
    
    // Track current route
    if (typeof window !== 'undefined') {
      currentRoute.current = window.location.pathname;
    }
  }, []);
  
  // ============================================
  // MEMORY UPDATE LOOP (Every 5 seconds)
  // ============================================
  
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (!entity || !expression) return;
      
      // Get updated memory snapshot
      const updatedMemory = entityMemoryRef.current.getMemorySnapshot();
      setMemory(updatedMemory);
      
      // Update soul-link based on current state
      const updatedSoulLink = soulLinkRef.current.update(
        updatedMemory,
        expression,
        entity
      );
      setSoulLink(updatedSoulLink);
      
      // Update personality map
      const updatedPersonality = entityMemoryRef.current.getPersonalityMap();
      setPersonalityMap(updatedPersonality);
      
      // Update relationship status
      const updatedStatus = soulLinkRef.current.getRelationshipStatus();
      setRelationshipStatus(updatedStatus);
      
      // Update bond quality
      const updatedQuality = soulLinkRef.current.getBondQuality();
      setBondQuality(updatedQuality);
      
      // Update drift profile
      setDriftProfile(calculateDriftProfile(updatedPersonality));
      
      // ============================================
      // LEVEL 7.4: BEHAVIORAL EVOLUTION UPDATE
      // ============================================
      
      // Update evolution timeline
      const currentGenome = behaviorGenomeRef.current.getSnapshot();
      evolutionClockRef.current.update(updatedMemory, currentGenome);
      const updatedTimeline = evolutionClockRef.current.getTimeline();
      setEvolutionTimeline(updatedTimeline);
      
      // Check if genome should evolve (every 24 hours)
      if (behaviorGenomeRef.current.shouldEvolve()) {
        behaviorGenomeRef.current.evolve(updatedMemory, updatedSoulLink);
        
        // Get updated genome after evolution
        const evolvedGenome = behaviorGenomeRef.current.getSnapshot();
        
        // Anchor genome to prevent excessive drift
        const anchoredGenome = identityAnchorRef.current.anchorGenome(
          evolvedGenome,
          updatedMemory,
          updatedTimeline
        );
        
        // Update genome state
        setGenome(anchoredGenome);
        
        // Update personality profile
        const updatedProfile = behaviorGenomeRef.current.getPersonalityProfile();
        setPersonalityProfile(updatedProfile);
        
        // Update identity core
        const updatedIdentity = identityAnchorRef.current.getIdentity();
        setIdentityCore(updatedIdentity);
      }
      
      // Perform resonance analysis (every 24 hours)
      if (resonanceMatrixRef.current.shouldAnalyze()) {
        resonanceMatrixRef.current.analyze(
          updatedMemory,
          currentGenome,
          updatedTimeline
        );
        
        const updatedResonance = resonanceMatrixRef.current.getMetrics();
        setResonanceMetrics(updatedResonance);
      }
    }, 5000);
    
    return () => clearInterval(updateInterval);
  }, [entity, expression]);
  
  // ============================================
  // AUTO-INTERACTION TRACKING
  // ============================================
  
  // Track mouse events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleMouseMove = () => {
      recordAutoInteraction('hover');
    };
    
    const handleClick = () => {
      recordAutoInteraction('click');
    };
    
    const handleScroll = () => {
      recordAutoInteraction('scroll');
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [expression, behavior]);
  
  // Track keyboard events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleKeyPress = () => {
      recordAutoInteraction('key');
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [expression, behavior]);
  
  // Track route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRouteChange = () => {
      const newRoute = window.location.pathname;
      if (newRoute !== currentRoute.current) {
        recordAutoInteraction('page-change');
        currentRoute.current = newRoute;
      }
    };
    
    // Check route every second
    const routeInterval = setInterval(handleRouteChange, 1000);
    return () => clearInterval(routeInterval);
  }, [expression, behavior]);
  
  // Track focus/blur
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleFocus = () => {
      recordAutoInteraction('focus');
    };
    
    const handleBlur = () => {
      recordAutoInteraction('blur');
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [expression, behavior]);
  
  // ============================================
  // INTERACTION RECORDING
  // ============================================
  
  const recordAutoInteraction = (type: InteractionEvent['type']) => {
    if (!expression || !behavior) return;
    
    const now = Date.now();
    const timeSinceLast = now - lastInteractionTime.current;
    
    // Throttle to prevent spam (min 100ms between events)
    if (timeSinceLast < 100) return;
    
    lastInteractionTime.current = now;
    
    const event: InteractionEvent = {
      timestamp: now,
      type,
      pageRoute: currentRoute.current,
      mood: expression.mood.currentTone,
      intensity: expression.mood.toneStrength,
      velocity: timeSinceLast < 1000 ? 1000 / timeSinceLast : 0,
      duration: timeSinceLast,
      emotionalTone: behavior.emotionalState
    };
    
    entityMemoryRef.current.recordInteraction(event);
  };
  
  const recordInteraction = (partial: Partial<InteractionEvent>) => {
    if (!expression || !behavior) return;
    
    const event: InteractionEvent = {
      timestamp: Date.now(),
      type: partial.type || 'click',
      pageRoute: partial.pageRoute || currentRoute.current,
      mood: partial.mood || expression.mood.currentTone,
      intensity: partial.intensity || expression.mood.toneStrength,
      velocity: partial.velocity || 0,
      duration: partial.duration || 0,
      emotionalTone: partial.emotionalTone || behavior.emotionalState
    };
    
    entityMemoryRef.current.recordInteraction(event);
  };
  
  // ============================================
  // MEMORY MANAGEMENT
  // ============================================
  
  const clearMemory = () => {
    entityMemoryRef.current.clearMemory();
    soulLinkRef.current.reset();
    
    const freshMemory = entityMemoryRef.current.getMemorySnapshot();
    const freshSoulLink = soulLinkRef.current.getScores();
    const freshPersonality = entityMemoryRef.current.getPersonalityMap();
    
    setMemory(freshMemory);
    setSoulLink(freshSoulLink);
    setPersonalityMap(freshPersonality);
    setRelationshipStatus('discovering');
    setBondQuality(soulLinkRef.current.getBondQuality());
    setDriftProfile('calm');
  };
  
  const resetEvolution = () => {
    behaviorGenomeRef.current.reset();
    evolutionClockRef.current.reset();
    resonanceMatrixRef.current.reset();
    identityAnchorRef.current.reset();
    
    const freshGenome = behaviorGenomeRef.current.getSnapshot();
    const freshTimeline = evolutionClockRef.current.getTimeline();
    const freshResonance = resonanceMatrixRef.current.getMetrics();
    const freshIdentity = identityAnchorRef.current.getIdentity();
    const freshProfile = behaviorGenomeRef.current.getPersonalityProfile();
    
    setGenome(freshGenome);
    setEvolutionTimeline(freshTimeline);
    setResonanceMetrics(freshResonance);
    setIdentityCore(freshIdentity);
    setPersonalityProfile(freshProfile);
    
    // Re-initialize identity from fresh genome
    identityAnchorRef.current.initializeIdentity(freshGenome);
  };
  
  const resetStability = () => {
    stabilityCoreRef.current.reset();
    selfHealRef.current.reset();
    harmonicLimiterRef.current.reset();
    cognitiveWeightsRef.current.reset();
    identityRingRef.current.unlock();
    
    const freshStability = stabilityCoreRef.current.getMetrics();
    const freshHealth = selfHealRef.current.getDiagnostics();
    const freshHarmonic = harmonicLimiterRef.current.getState();
    const freshWeights = cognitiveWeightsRef.current.getWeights();
    const freshLock = identityRingRef.current.getLock();
    
    setStabilityMetrics(freshStability);
    setHealthDiagnostics(freshHealth);
    setHarmonicState(freshHarmonic);
    setWeightBalance({ weights: freshWeights, isBalanced: true, imbalances: [], totalWeight: 200, targetWeight: 200 });
    setIdentityLock(freshLock);
  };
  
  // ============================================
  // DRIFT PROFILE CALCULATION
  // ============================================
  
  const calculateDriftProfile = (personality: MemoryImprintContext['personalityMap'] | null): string => {
    if (!personality) return 'calm';
    
    const { dominantMood, interactionRhythm, engagementStyle } = personality;
    
    // Intense profile: High rhythm + stressed/overclocked mood
    if (interactionRhythm > 50 && (dominantMood === 'stressed' || dominantMood === 'overclocked')) {
      return 'intense';
    }
    
    // Active profile: High rhythm + alert/focused mood
    if (interactionRhythm > 40 && (dominantMood === 'alert' || dominantMood === 'focused')) {
      return 'active';
    }
    
    // Focused profile: Moderate rhythm + focused mood + deep-focus style
    if (interactionRhythm > 20 && dominantMood === 'focused' && engagementStyle === 'deep-focus') {
      return 'focused';
    }
    
    // Calm profile: Low rhythm + calm mood
    return 'calm';
  };
  
  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const contextValue: MemoryImprintContext = {
    // Level 7.3: Memory & Soul-Link
    memory,
    soulLink,
    personalityMap,
    relationshipStatus,
    bondQuality,
    driftProfile,
    
    // Level 7.4: Behavioral Evolution
    genome,
    evolutionTimeline,
    resonanceMetrics,
    identityCore,
    personalityProfile,
    
    // Level 7.5: Stability & Self-Regulation
    stabilityMetrics,
    healthDiagnostics,
    harmonicState,
    weightBalance,
    identityLock,
    
    recordInteraction,
    clearMemory,
    resetEvolution,
    resetStability
  };
  
  return (
    <MemoryImprintContext.Provider value={contextValue}>
      {children}
    </MemoryImprintContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useMemoryImprint(): MemoryImprintContext {
  const context = useContext(MemoryImprintContext);
  if (!context) {
    throw new Error('useMemoryImprint must be used within MemoryImprintProvider');
  }
  return context;
}
