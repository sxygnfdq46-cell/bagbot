/**
 * LEVEL 11.5 — UNIFIED IDENTITY PRESENCE ENGINE (UIPE)
 * 
 * Export Hub: Centralized exports for unified presence system
 * 
 * Core Components:
 * - PresenceFieldCore: Cross-tab synchronization, continuity management
 * - ContinuityStabilityEngine: Tone stabilization, personality thread
 * - MultiSurfaceAwarenessMatrix: Context tracking across 12 surfaces
 * - UnifiedPulseEngine: Global heartbeat, breathing, aura coordination
 * - IdentityPersistenceLayer: React Context Provider, permanent identity root
 * 
 * Integration: Single unified presence across every tab, page, context
 */

/* ================================ */
/* CORE ENGINES                     */
/* ================================ */

export { PresenceFieldCore } from './PresenceFieldCore';
export type {
  PresenceConfig,
  PresenceFieldState,
  IdentityAnchor,
  EmotionalLayer,
  CognitiveLayer,
  EmotionalTrajectory,
  SyncRole,
  PresenceUpdateMessage,
} from './PresenceFieldCore';

export { ContinuityStabilityEngine } from './ContinuityStabilityEngine';
export type {
  ContinuityConfig,
  ContinuityState,
  IdentityMomentum,
  ToneProfile,
  CoreTraits,
  ChangeDampening,
  PredictedState,
  ToneShiftDirection,
  ToneShiftInput,
} from './ContinuityStabilityEngine';

export { MultiSurfaceAwarenessMatrix } from './MultiSurfaceAwarenessMatrix';
export type {
  SurfaceAwarenessConfig,
  SurfaceAwarenessState,
  SurfaceType,
  SurfaceContext,
  ActiveSurfaceVector,
  TransitionPhase,
  LayerIntegration,
  SurfaceTransition,
} from './MultiSurfaceAwarenessMatrix';

export { UnifiedPulseEngine } from './UnifiedPulseEngine';
export type {
  PulseConfig,
  PulseState,
  BreathPhase,
  EmotionalBeat,
  PulseCallback,
} from './UnifiedPulseEngine';

/* ================================ */
/* REACT INTEGRATION                */
/* ================================ */

export { IdentityPersistenceLayer, useUnifiedPresence } from './IdentityPersistenceLayer';
export type {
  UnifiedPresenceContextValue,
  IdentityPersistenceLayerProps,
} from './IdentityPersistenceLayer';

/* ================================ */
/* UNIFIED TYPES                    */
/* ================================ */

/**
 * Comprehensive snapshot of unified presence state across all engines
 */
export interface UnifiedPresenceSnapshot {
  presenceField: any;
  continuity: any;
  surfaceAwareness: any;
  pulse: any;
  timestamp: number;
}

/**
 * Unified presence configuration (all engines)
 */
export interface UnifiedPresenceConfig {
  presenceField?: Partial<any>;
  continuity?: Partial<any>;
  surfaceAwareness?: Partial<any>;
  pulse?: Partial<any>;
  enableCrossTabSync?: boolean;
  enableGPUEffects?: boolean;
}

/**
 * Unified presence actions (convenience methods)
 */
export interface UnifiedPresenceActions {
  activateSurface: (surface: any) => void;
  updateEmotion: (emotion: string, intensity: number) => void;
  updateTone: (warmth: number, formality: number, enthusiasm: number) => void;
  export: () => UnifiedPresenceSnapshot;
  import: (snapshot: UnifiedPresenceSnapshot) => void;
  reset: () => void;
}

/* ================================ */
/* UTILITY FUNCTIONS                */
/* ================================ */

/**
 * Creates a unified presence snapshot from all engines
 */
export function createSnapshot(
  presenceCore: any,
  continuityEngine: any,
  surfaceMatrix: any,
  pulseEngine: any
): UnifiedPresenceSnapshot {
  return {
    presenceField: presenceCore.getState(),
    continuity: continuityEngine.getState(),
    surfaceAwareness: surfaceMatrix.getState(),
    pulse: pulseEngine.getState(),
    timestamp: Date.now(),
  };
}

/**
 * Restores unified presence state from snapshot
 */
export function restoreSnapshot(
  snapshot: UnifiedPresenceSnapshot,
  presenceCore: any,
  continuityEngine: any,
  surfaceMatrix: any,
  pulseEngine: any
): void {
  presenceCore.import(JSON.stringify(snapshot.presenceField));
  continuityEngine.import(JSON.stringify(snapshot.continuity));
  surfaceMatrix.import(JSON.stringify(snapshot.surfaceAwareness));
  pulseEngine.import(JSON.stringify(snapshot.pulse));
}

/**
 * Validates unified presence snapshot structure
 */
export function validateSnapshot(snapshot: any): snapshot is UnifiedPresenceSnapshot {
  return (
    snapshot &&
    typeof snapshot === 'object' &&
    'presenceField' in snapshot &&
    'continuity' in snapshot &&
    'surfaceAwareness' in snapshot &&
    'pulse' in snapshot &&
    'timestamp' in snapshot &&
    typeof snapshot.timestamp === 'number'
  );
}

/* ================================ */
/* CONSTANTS                        */
/* ================================ */

export const UIPE_VERSION = '11.5.0';
export const UIPE_NAME = 'Unified Identity Presence Engine';

export const DEFAULT_CONFIG: Required<UnifiedPresenceConfig> = {
  presenceField: {
    enableCrossTabSync: true,
    smoothingFactor: 0.7,
    minContinuityStrength: 60,
    syncInterval: 500,
    reactionDebounce: 200,
  },
  continuity: {
    toneSmoothingFactor: 0.8,
    traitSmoothingFactor: 0.9,
    momentumDecay: 0.95,
    historyDurationSeconds: 60,
  },
  surfaceAwareness: {
    engagementDecayRate: 0.98,
    maxTransitions: 50,
  },
  pulse: {
    baseBPM: 60,
    breathMultiplier: 4,
    auraRotationSpeed: 30,
    enableEmotionalSync: true,
    enableGPUOptimization: true,
  },
  enableCrossTabSync: true,
  enableGPUEffects: true,
};
