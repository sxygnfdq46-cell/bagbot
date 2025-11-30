/**
 * DVBE Types - Dynamic Volatility Behavior Engine
 * 
 * Type definitions for volatility behavior analysis.
 * Tracks volatility patterns, phase transitions, and behavior states.
 */

/**
 * Volatility behavior patterns
 */
export type VolatilityBehavior =
  | "CALM_TO_EXPLOSIVE"    // Sudden explosion from calm state
  | "COMPRESSION"          // Building pressure before breakout
  | "FAKE_SPIKE"           // False volatility spike (mean-revert)
  | "SHOCKWAVE"            // Major market event cascade
  | "AFTERSHOCK"           // Secondary volatility waves
  | "LIQUIDITY_EVAP"       // Liquidity disappearing
  | "VOLATILITY_DRIFT"     // Gradual volatility shift
  | "ACCELERATION_ZONE"    // Increasing volatility momentum
  | "REVERSION_PHASE"      // Returning to baseline
  | "UNKNOWN";             // Unclassified

/**
 * Volatility phase states
 */
export type VolatilityPhase =
  | "DORMANT"              // Extremely low volatility
  | "CALM"                 // Normal low volatility
  | "WARMING"              // Volatility increasing
  | "ACTIVE"               // Elevated volatility
  | "EXPLOSIVE"            // Very high volatility
  | "CRITICAL"             // Dangerous volatility levels
  | "COOLING"              // Volatility decreasing
  | "STABILIZING";         // Returning to normal

/**
 * Volatility severity levels (0-100)
 */
export type VolatilitySeverity = number;

/**
 * Volatility snapshot - current market volatility state
 */
export interface VolatilitySnapshot {
  timestamp: number;
  
  // Core volatility metrics
  currentVol: number;           // Current volatility (0-100)
  avgVol5m: number;             // 5-minute average
  avgVol15m: number;            // 15-minute average
  avgVol1h: number;             // 1-hour average
  
  // Rate of change
  volDelta1m: number;           // 1-minute change
  volDelta5m: number;           // 5-minute change
  volAcceleration: number;      // Rate of rate of change
  
  // Spread & liquidity
  spreadWidth: number;          // Current spread (bps)
  spreadVol: number;            // Spread volatility
  liquidityDepth: number;       // Total liquidity depth
  liquidityChange: number;      // Liquidity rate of change
  
  // Orderbook pressure
  bidPressure: number;          // Bid-side pressure (0-100)
  askPressure: number;          // Ask-side pressure (0-100)
  pressureImbalance: number;    // Net pressure (-100 to 100)
  
  // Price action
  priceRangeShort: number;      // Short-term price range
  priceRangeMedium: number;     // Medium-term price range
  priceVelocity: number;        // Price movement speed
  
  // Market structure
  tickFrequency: number;        // Ticks per second
  tradeFrequency: number;       // Trades per second
  avgTradeSize: number;         // Average trade size
  largeTradeCount: number;      // Large trade count (recent)
}

/**
 * Behavior detection result
 */
export interface BehaviorResult {
  behavior: VolatilityBehavior;
  phase: VolatilityPhase;
  severity: VolatilitySeverity;
  confidence: number;           // Detection confidence (0-100)
  
  // Detailed metrics
  metrics: VolatilityMetrics;
  
  // Context
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tradingAdvice: "CONTINUE" | "REDUCE" | "PAUSE" | "HALT";
  
  // Flags
  isExplosive: boolean;
  isCompressing: boolean;
  isFakeSpike: boolean;
  isShockwave: boolean;
  isAftershock: boolean;
  isLiquidityEvap: boolean;
  isDrifting: boolean;
  isAccelerating: boolean;
  isReverting: boolean;
  
  // Predictions
  predictedPhase: VolatilityPhase | null;
  phaseChangeProb: number;      // Probability of phase change (0-100)
  timeToChange: number | null;  // Estimated time to phase change (ms)
  
  timestamp: number;
}

/**
 * Volatility metrics - comprehensive behavior analysis
 */
export interface VolatilityMetrics {
  // Explosion metrics
  explosionScore: number;       // Calm→Explosive likelihood (0-100)
  explosionTrigger: string | null;
  explosionSeverity: number;
  
  // Compression metrics
  compressionScore: number;     // Compression strength (0-100)
  compressionDuration: number;  // How long compressed (ms)
  breakoutProb: number;         // Breakout probability (0-100)
  
  // Fake spike metrics
  fakeSpikeScore: number;       // Fake spike likelihood (0-100)
  meanReversionProb: number;    // Reversion probability (0-100)
  spikeStrength: number;
  
  // Shockwave metrics
  shockwaveScore: number;       // Shockwave probability (0-100)
  shockwaveOrigin: string | null;
  cascadeRisk: number;          // Cascade risk (0-100)
  
  // Aftershock metrics
  aftershockScore: number;      // Aftershock probability (0-100)
  aftershockWaves: number;      // Number of waves detected
  aftershockDecay: number;      // Decay rate
  
  // Liquidity evaporation metrics
  liquidityEvapScore: number;   // Evaporation score (0-100)
  evaporationRate: number;      // Rate of evaporation
  recoveryTime: number | null;  // Estimated recovery (ms)
  
  // Drift metrics
  driftScore: number;           // Drift strength (0-100)
  driftDirection: "UP" | "DOWN" | "NEUTRAL";
  driftSpeed: number;
  
  // Acceleration metrics
  accelerationScore: number;    // Acceleration strength (0-100)
  accelerationRate: number;     // Rate of acceleration
  accelerationPeak: number | null;
  
  // Reversion metrics
  reversionScore: number;       // Reversion strength (0-100)
  targetVolatility: number;     // Target volatility level
  reversionSpeed: number;
}

/**
 * Phase transition - tracks volatility phase changes
 */
export interface PhaseTransition {
  timestamp: number;
  fromPhase: VolatilityPhase;
  toPhase: VolatilityPhase;
  trigger: string;              // What caused the transition
  duration: number;             // Duration in previous phase (ms)
  severity: number;             // Transition severity (0-100)
  
  // Context at transition
  volatilityLevel: number;
  behaviorAtTransition: VolatilityBehavior;
  
  // Prediction accuracy (if predicted)
  wasPredicted: boolean;
  predictionAccuracy: number | null;  // 0-100
}

/**
 * Volatility statistics - aggregated behavior data
 */
export interface VolatilityStats {
  // Current state
  currentBehavior: VolatilityBehavior;
  currentPhase: VolatilityPhase;
  currentSeverity: number;
  
  // Averages
  avgVolatility: number;
  avgSeverity: number;
  avgPhaseChangeProb: number;
  
  // Counts
  totalStates: number;
  totalTransitions: number;
  behaviorCounts: Record<VolatilityBehavior, number>;
  phaseCounts: Record<VolatilityPhase, number>;
  
  // Risk metrics
  explosionCount: number;
  shockwaveCount: number;
  liquidityEvapCount: number;
  criticalPhaseCount: number;
  
  // Timing
  avgPhaseDuration: number;
  longestPhaseDuration: number;
  shortestPhaseDuration: number;
  
  // Accuracy
  predictionAccuracy: number;   // Overall prediction accuracy (0-100)
  falsePositiveRate: number;    // False positive rate (0-100)
}

/**
 * Volatility context - current volatility environment
 */
export interface VolatilityContext {
  result: BehaviorResult;
  recentTransitions: PhaseTransition[];
  stats: VolatilityStats;
  
  // Environment classification
  environment: "STABLE" | "VOLATILE" | "EXTREME" | "UNPREDICTABLE";
  environmentScore: number;     // 0-100
  
  // Trading conditions
  isSafeToTrade: boolean;
  recommendedPositionSize: number;  // 0-100 (% of normal)
  riskMultiplier: number;       // Risk adjustment multiplier
  
  // Warnings
  warnings: string[];
  alerts: string[];
}

/**
 * Volatility behavior configuration
 */
export interface DVBEConfig {
  // Detection thresholds
  explosionThreshold: number;       // Default: 70
  compressionThreshold: number;     // Default: 65
  fakeSpikeThreshold: number;       // Default: 60
  shockwaveThreshold: number;       // Default: 75
  liquidityEvapThreshold: number;   // Default: 70
  
  // Phase thresholds
  dormantVolThreshold: number;      // Default: 10
  calmVolThreshold: number;         // Default: 30
  activeVolThreshold: number;       // Default: 50
  explosiveVolThreshold: number;    // Default: 70
  criticalVolThreshold: number;     // Default: 85
  
  // Timing windows
  shortTermWindow: number;          // Default: 60000 (1 min)
  mediumTermWindow: number;         // Default: 300000 (5 min)
  longTermWindow: number;           // Default: 3600000 (1 hour)
  
  // Risk management
  haltOnExplosion: boolean;         // Default: true
  haltOnShockwave: boolean;         // Default: true
  haltOnLiquidityEvap: boolean;     // Default: true
  
  // Performance
  maxHistorySize: number;           // Default: 300
  enablePredictions: boolean;       // Default: true
  enableTransitionTracking: boolean;// Default: true
}

/**
 * Volatility trend - directional volatility movement
 */
export interface VolatilityTrend {
  direction: "INCREASING" | "DECREASING" | "STABLE" | "OSCILLATING";
  strength: number;             // Trend strength (0-100)
  consistency: number;          // How consistent is trend (0-100)
  duration: number;             // Trend duration (ms)
  
  // Projections
  projectedVol: number;         // Projected volatility level
  projectedPhase: VolatilityPhase;
  confidenceInterval: [number, number];  // [low, high]
}

/**
 * Behavior pattern - recurring volatility pattern
 */
export interface BehaviorPattern {
  patternId: string;
  behavior: VolatilityBehavior;
  frequency: number;            // Occurrences
  avgDuration: number;          // Average duration (ms)
  avgSeverity: number;
  
  // Timing
  typicalStartPhase: VolatilityPhase;
  typicalEndPhase: VolatilityPhase;
  
  // Triggers
  commonTriggers: string[];
  
  // Outcomes
  nextBehaviorProb: Record<VolatilityBehavior, number>;
  nextPhaseProb: Record<VolatilityPhase, number>;
}

/**
 * Volatility anomaly - unusual volatility behavior
 */
export interface VolatilityAnomaly {
  timestamp: number;
  anomalyType: string;
  severity: number;             // Anomaly severity (0-100)
  description: string;
  
  // Context
  currentBehavior: VolatilityBehavior;
  currentPhase: VolatilityPhase;
  expectedBehavior: VolatilityBehavior | null;
  
  // Impact
  riskImpact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tradingImpact: string;
  
  // Resolution
  resolved: boolean;
  resolutionTime: number | null;
}

/**
 * Export all types
 */
export type {
  VolatilityBehavior,
  VolatilityPhase,
  VolatilitySeverity,
  VolatilitySnapshot,
  BehaviorResult,
  VolatilityMetrics,
  PhaseTransition,
  VolatilityStats,
  VolatilityContext,
  DVBEConfig,
  VolatilityTrend,
  BehaviorPattern,
  VolatilityAnomaly,
};
