/**
 * ⏰ EAE TYPES — Execution Alignment Engine Type Definitions
 * 
 * STEP 24.38 — Type Definitions
 * 
 * Purpose:
 * Complete TypeScript type definitions for the Execution Alignment Engine (EAE).
 * These types define timing windows, market rhythm, liquidity pulse, and execution alignment.
 */

// ============================================================================
// EAE TIMING — Main Output
// ============================================================================

/**
 * EAETiming — Final execution timing decision from EAE
 */
export interface EAETiming {
  fire: boolean; // Execute now?
  windowStart: number; // Unix timestamp
  windowEnd: number; // Unix timestamp
  timingScore: number; // 0-100
  recommendedSize: number; // Position size (0-1)
  conditions: string[]; // Human-readable conditions
  syncState: 'GOOD' | 'NEUTRAL' | 'BAD';
  debug: EAEDebug;
  timestamp: number;
}

// ============================================================================
// EAE CONTEXT
// ============================================================================

/**
 * EAEContext — Context data for EAE evaluation
 */
export interface EAEContext {
  dplDecision: {
    allowTrade: boolean;
    action: 'LONG' | 'SHORT' | 'WAIT';
    confidence: number;
  };
  fusionResult: {
    signal: 'LONG' | 'SHORT' | 'NEUTRAL';
    strength: number;
  };
  marketContext: {
    shield: string;
    threats: number;
    volatility: string;
  };
  rhythmData?: RhythmData;
  liquidityPulse?: LiquidityPulse;
  killZones?: KillZoneInfo[];
  candleData?: CandleData[];
  timestamp: number;
}

// ============================================================================
// RHYTHM DATA
// ============================================================================

/**
 * RhythmData — Market rhythm analysis
 */
export interface RhythmData {
  heartbeat: number; // Average cycle duration (ms)
  microCycles: MicroCycle[];
  volatilityWaves: VolatilityWave[];
  currentPhase: 'EXPANSION' | 'CONTRACTION' | 'NEUTRAL';
  phaseStrength: number; // 0-100
  rhythmScore: number; // 0-100 (how predictable/stable)
  lastPulse: number; // Unix timestamp
  nextExpectedPulse: number; // Unix timestamp
}

/**
 * MicroCycle — Short-term price cycle
 */
export interface MicroCycle {
  startTime: number;
  endTime: number;
  duration: number; // milliseconds
  amplitude: number; // Price range
  direction: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number; // 0-100
}

/**
 * VolatilityWave — Volatility oscillation pattern
 */
export interface VolatilityWave {
  startTime: number;
  peakTime: number;
  endTime: number;
  peakVolatility: number;
  currentVolatility: number;
  phase: 'RISING' | 'PEAK' | 'FALLING' | 'TROUGH';
}

// ============================================================================
// LIQUIDITY PULSE
// ============================================================================

/**
 * LiquidityPulse — Orderbook liquidity pulse analysis
 */
export interface LiquidityPulse {
  direction: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
  depth: number; // Total liquidity depth
  imbalance: number; // -1 to +1
  pulseRate: number; // Pulses per minute
  lastPulse: number; // Unix timestamp
  coherence: number; // 0-100 (how consistent)
  flowVelocity: number; // Rate of change
}

// ============================================================================
// KILL ZONE INFO
// ============================================================================

/**
 * KillZoneInfo — Time-based trading zone information
 */
export interface KillZoneInfo {
  name: string; // e.g., "London Open", "NY Session", "Asian Quiet"
  startTime: number; // Unix timestamp
  endTime: number; // Unix timestamp
  favorability: number; // 0-100 (how good for trading)
  volatilityExpected: 'LOW' | 'MEDIUM' | 'HIGH';
  liquidityExpected: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
  reason: string;
}

// ============================================================================
// CANDLE DATA (EXTENDED)
// ============================================================================

/**
 * CandleData — Extended candlestick data for rhythm analysis
 */
export interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bodySize: number;
  wickSize: number;
  bodyPercent: number;
}

// ============================================================================
// EAE DEBUG
// ============================================================================

/**
 * EAEDebug — Debug information for EAE evaluation
 */
export interface EAEDebug {
  rhythmScore: number;
  liquidityScore: number;
  killZoneScore: number;
  timingFactors: {
    rhythm: number;
    liquidity: number;
    killZone: number;
    volatility: number;
  };
  alignmentChecks: {
    rhythmAligned: boolean;
    liquidityAligned: boolean;
    killZoneActive: boolean;
    volatilityAcceptable: boolean;
  };
  computationTime: number; // milliseconds
}

// ============================================================================
// EAE CONFIGURATION
// ============================================================================

/**
 * EAEConfig — Configuration for Execution Alignment Engine
 */
export interface EAEConfig {
  enableRhythmAnalysis: boolean; // Default: true
  enableLiquidityPulse: boolean; // Default: true
  enableKillZones: boolean; // Default: true
  minTimingScore: number; // Default: 60 (min score to execute)
  minSyncState: 'GOOD' | 'NEUTRAL' | 'BAD'; // Default: NEUTRAL
  rhythmWeight: number; // Default: 0.35
  liquidityWeight: number; // Default: 0.35
  killZoneWeight: number; // Default: 0.30
  windowDuration: number; // Default: 300000 (5 minutes)
  baseSizing: number; // Default: 0.5 (50% of max position)
  maxSizing: number; // Default: 1.0 (100% of max position)
  minSizing: number; // Default: 0.1 (10% of max position)
}

// ============================================================================
// EAE STATISTICS
// ============================================================================

/**
 * EAEStatistics — Statistics tracked by EAE
 */
export interface EAEStatistics {
  totalEvaluations: number;
  executionsAllowed: number;
  executionsBlocked: number;
  averageTimingScore: number;
  averageSyncState: string;
  rhythmAlignmentRate: number; // 0-1
  liquidityAlignmentRate: number; // 0-1
  killZoneHitRate: number; // 0-1
  lastEvaluationTime: number; // milliseconds
}

// ============================================================================
// TIMING WINDOW
// ============================================================================

/**
 * TimingWindow — Optimal execution time window
 */
export interface TimingWindow {
  start: number; // Unix timestamp
  end: number; // Unix timestamp
  duration: number; // milliseconds
  score: number; // 0-100
  reason: string;
  factors: {
    rhythm: boolean;
    liquidity: boolean;
    killZone: boolean;
  };
}

// ============================================================================
// EXECUTION SIZING
// ============================================================================

/**
 * ExecutionSizing — Position size recommendation
 */
export interface ExecutionSizing {
  recommendedSize: number; // 0-1 (percentage of max position)
  minSize: number;
  maxSize: number;
  adjustmentFactor: number; // Multiplier based on conditions
  reason: string;
}

// ============================================================================
// SYNC STATE
// ============================================================================

/**
 * SyncState — Overall market synchronization state
 */
export interface SyncState {
  state: 'GOOD' | 'NEUTRAL' | 'BAD';
  score: number; // 0-100
  factors: {
    rhythm: number;
    liquidity: number;
    killZone: number;
    volatility: number;
  };
  alignment: {
    rhythmAligned: boolean;
    liquidityAligned: boolean;
    killZoneActive: boolean;
    volatilityAcceptable: boolean;
  };
}

// ============================================================================
// EAE SNAPSHOT
// ============================================================================

/**
 * EAESnapshot — High-level snapshot of EAE state
 */
export interface EAESnapshot {
  lastTiming: EAETiming | null;
  currentSyncState: 'GOOD' | 'NEUTRAL' | 'BAD';
  executionRate: number; // 0-1 (allowed / total)
  averageTimingScore: number;
  activeKillZone: string | null;
  rhythmStability: number; // 0-100
  liquidityHealth: number; // 0-100
  statistics: EAEStatistics;
  lastEvaluation: number; // timestamp
}

// ============================================================================
// MARKET HEARTBEAT
// ============================================================================

/**
 * MarketHeartbeat — Market rhythm heartbeat analysis
 */
export interface MarketHeartbeat {
  bpm: number; // Beats per minute (cycles per minute)
  interval: number; // Average interval between beats (ms)
  variance: number; // Heartbeat regularity (0-1, 0=perfect)
  strength: number; // 0-100
  lastBeat: number; // Unix timestamp
  nextExpectedBeat: number; // Unix timestamp
}

// ============================================================================
// ORDERBOOK DATA (EXTENDED)
// ============================================================================

/**
 * OrderbookData — Extended orderbook for pulse analysis
 */
export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  bidDepth: number;
  askDepth: number;
  spread: number;
  spreadPercent: number;
  imbalance: number;
  liquidityScore: number;
  timestamp: number;
}

/**
 * OrderbookLevel — Single orderbook level
 */
export interface OrderbookLevel {
  price: number;
  volume: number;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  EAETiming as default,
  EAEContext,
  RhythmData,
  MicroCycle,
  VolatilityWave,
  LiquidityPulse,
  KillZoneInfo,
  CandleData,
  EAEDebug,
  EAEConfig,
  EAEStatistics,
  TimingWindow,
  ExecutionSizing,
  SyncState,
  EAESnapshot,
  MarketHeartbeat,
  OrderbookData,
  OrderbookLevel,
};
