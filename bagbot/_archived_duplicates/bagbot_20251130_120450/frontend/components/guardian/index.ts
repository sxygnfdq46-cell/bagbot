/**
 * LEVEL 12.1 — SYMBIOTIC GUARDIAN ENGINE
 * 
 * Unified export hub for all Guardian components and types.
 * Provides comprehensive API for Level 1-11.5 integration.
 */

// Core Engines
export { GuardianStateCore } from './GuardianStateCore';
export { HarmonicBalanceEngine } from './HarmonicBalanceEngine';
export { ProtectionReflexMatrix } from './ProtectionReflexMatrix';
export { StabilizationFlowEngine } from './StabilizationFlowEngine';
export { GuardianOrchestrationHub } from './GuardianOrchestrationHub';

// React Components
export { SymbioticGuardianProvider, useGuardian } from './SymbioticGuardianProvider';

// Types - GuardianStateCore
export type {
  SystemLoad,
  EmotionalOverflow,
  ExtremeState,
  SignalStability,
  IntegrityMonitoring,
  GuardianConfig,
} from './GuardianStateCore';

// Types - HarmonicBalanceEngine
export type {
  PersonalityTone,
  VisualBalance,
  EmotionalVisualCoherence,
  GuardianHarmonic,
  MultiDimensionalBalance,
  HarmonicConfig,
} from './HarmonicBalanceEngine';

// Types - ProtectionReflexMatrix
export type {
  CascadePrevention,
  ValueContainment,
  VisualStorm,
  PredictionSpike,
  PrecisionMaintenance,
  ProtectionConfig,
} from './ProtectionReflexMatrix';

// Types - StabilizationFlowEngine
export type {
  SpikeDetectionState,
  OverloadPreventionState,
  AutoCenteringState,
  ExtremeLoadState,
  FlowStabilityMetrics,
  StabilizationFlowConfig,
} from './StabilizationFlowEngine';

// Types - GuardianOrchestrationHub
export type {
  GuardianOrchestrationState,
  SystemWideMetrics,
  LongTermIntegrity,
  GuardianOrchestrationConfig,
} from './GuardianOrchestrationHub';

/**
 * Guardian protection levels (used across engines)
 */
export type ProtectionLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Guardian system phases (used across engines)
 */
export type SystemPhase = 'idle' | 'active' | 'stressed' | 'overloaded' | 'recovering';

/**
 * Guardian stability modes (used across engines)
 */
export type StabilityMode = 'passive' | 'reactive' | 'protective' | 'emergency';

/**
 * Guardian reflex types (used in ProtectionReflexMatrix)
 */
export type ReflexType = 'cascade' | 'containment' | 'storm' | 'spike' | 'precision';

/**
 * Guardian threat levels (used across engines)
 */
export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Harmonic phases (used in HarmonicBalanceEngine)
 */
export type HarmonicPhase = 'aligned' | 'converging' | 'diverging' | 'chaotic';

/**
 * Reflex modes (used in ProtectionReflexMatrix)
 */
export type ReflexMode = 'dormant' | 'monitoring' | 'active' | 'emergency';

/**
 * Orchestration phases (used in GuardianOrchestrationHub)
 */
export type OrchestrationPhase = 'initialization' | 'monitoring' | 'balancing' | 'intervention' | 'recovery';
