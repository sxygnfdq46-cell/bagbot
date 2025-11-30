/**
 * 🌊 LEVEL 9.2 — ENVIRONMENTAL-EMOTIONAL FUSION LAYER
 * 
 * Exports all fusion components, types, and providers.
 * Bridge between external market conditions and internal emotional state.
 */

// Core Components
export { EnvironmentalEmotionMapper } from './EnvironmentalEmotionMapper';
export { AdaptiveMoodClimateEngine } from './AdaptiveMoodClimateEngine';
export { CrossSystemHarmonizer } from './CrossSystemHarmonizer';
export { MarketClimateVFXBlend } from './MarketClimateVFXBlend';
export { EnvironmentalMemoryLayer } from './EnvironmentalMemoryLayer';

// Provider & Hooks
export { 
  EnvironmentalFusionProvider,
  useEnvironmentalFusion,
  useFusionMood,
  useFusionVFX,
  useFusionTimeline,
  useFusionMemory
} from './EnvironmentalFusionProvider';

// Types - EnvironmentalEmotionMapper
export type {
  EnvironmentalEmotionState,
  EmotionMappingInput,
  EnvironmentalEmotion,
  MarketFeeling
} from './EnvironmentalEmotionMapper';

// Types - AdaptiveMoodClimateEngine
export type {
  MoodClimateState,
  FusionMood,
  VisualMode,
  VisualEffects,
  ColorScheme,
  AtmosphericEffects,
  ParticleType,
  WaveformType
} from './AdaptiveMoodClimateEngine';

// Types - CrossSystemHarmonizer
export type {
  SystemTimeline,
  SyncCommand,
  SystemLayer
} from './CrossSystemHarmonizer';

// Types - MarketClimateVFXBlend
export type {
  ClimateVFXState,
  ParticleFieldConfig,
  WaveConfig,
  MagneticLineConfig,
  StreamEffectConfig
} from './MarketClimateVFXBlend';

// Types - EnvironmentalMemoryLayer
export type {
  EnvironmentalMemoryState,
  StormMemory,
  GravityShiftMemory,
  FlowMemory,
  AtmosphericTrend,
  EnvironmentalPattern,
  PatternCondition,
  ContextMatch,
  PastSituation
} from './EnvironmentalMemoryLayer';

// Types - Provider
export type {
  EnvironmentalFusionState
} from './EnvironmentalFusionProvider';
