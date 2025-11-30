/**
 * LEVEL 6.1 BIC — PUBLIC EXPORTS
 * Single import point for all BIC functionality
 */

export { BehaviorCore } from './BehaviorCore';
export { BehaviorMap } from './behaviorMap';
export { BehaviorProvider, useBehavior } from './BehaviorProvider';

export type {
  EmotionalState,
  BehaviorOutput,
  BehaviorData,
  MarketSummary,
  PriceData,
  VolatilityMetrics,
  StrategyPerformance,
  SystemHealth,
  LiquidityMetrics,
} from './BehaviorCore';

export type { UIReaction } from './behaviorMap';
