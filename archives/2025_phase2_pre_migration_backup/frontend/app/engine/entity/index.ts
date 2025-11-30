/**
 * LEVEL 7 — ENTITY MODE EXPORTS
 * Single import point for Symbiotic Entity Layer
 */

// Level 7.1: Entity Core
export { EntityCore } from './EntityCore';
export { EntityProvider, useEntity } from './EntityProvider';

// Level 7.2: Expression Core
export { ExpressionCore } from './ExpressionCore';
export { RippleEngine } from './RippleEngine';
export { AttentionStream } from './AttentionStream';

// Level 7.3: Memory Imprint
export { EntityMemory } from './EntityMemory';
export { SoulLinkCore } from './SoulLinkCore';

// Level 7.4: Behavioral Evolution
export { BehaviorGenome } from './BehaviorGenome';
export { EvolutionClock } from './EvolutionClock';
export { ResonanceMatrix } from './ResonanceMatrix';
export { IdentityAnchor } from './IdentityAnchor';

// Level 7.5: Stability & Self-Regulation
export { StabilityCore } from './StabilityCore';
export { SelfHeal } from './SelfHeal';
export { HarmonicLimiter } from './HarmonicLimiter';
export { CognitiveWeights } from './CognitiveWeights';
export { IdentityRing } from './IdentityRing';

// Unified Provider (Level 7.3 + 7.4 + 7.5)
export { MemoryImprintProvider, useMemoryImprint } from './MemoryImprintProvider';

// ============================================
// TYPE EXPORTS
// ============================================

// Level 7.1 Types
export type {
  EntityPresence,
  EntityAura,
  UserInteractionState,
  EntityOutput,
} from './EntityCore';

// Level 7.2 Types
export type {
  GlowType,
  MicroGlowExpression,
  EmotionalGradient,
  RippleState,
  EmotionalTone,
  MoodState,
  ShadowResonance,
  ResponseWarmth,
  AttentionBurst,
  MicroAttentionState,
  ExpressionOutput,
} from './ExpressionCore';

// Level 7.3 Types
export type {
  MoodPattern,
  NavigationPattern,
  TimePattern,
  EngagementPattern,
  EmotionalResponse,
  InteractionRhythm,
  MemorySnapshot,
  InteractionEvent,
} from './EntityMemory';

export type {
  SoulLinkScores,
  SoulLinkEvent,
} from './SoulLinkCore';

// Level 7.4 Types
export type {
  GenomeParameters,
  GenomeSnapshot,
  PersonalityProfile,
  EvolutionHistory,
} from './BehaviorGenome';

export type {
  ShortTermTrend,
  MidTermTrend,
  LongTermGrowth,
  EvolutionTimeline,
} from './EvolutionClock';

export type {
  ResonanceMetrics,
  CrossAnalysisResult,
} from './ResonanceMatrix';

export type {
  IdentityCore,
  DriftBounds,
} from './IdentityAnchor';

// Level 7.5 Types
export type {
  EmotionalDrift,
  PersonalityBoundaries,
  MicroAnomaly,
  StabilityMetrics,
} from './StabilityCore';

export type {
  HealthDiagnostics,
  HealingAction,
  SelfHealState,
} from './SelfHeal';

export type {
  VisualLimits,
  HarmonicState,
} from './HarmonicLimiter';

export type {
  CognitiveWeightsData,
  WeightBalance,
} from './CognitiveWeights';

export type {
  IdentityLock,
  LockConditions,
} from './IdentityRing';

