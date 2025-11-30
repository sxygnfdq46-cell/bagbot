/**
 * Market Flow Anticipation Engine (MFAE) - Types
 * 
 * Real-time market flow analysis to detect genuine moves vs fake-outs.
 * Analyzes tick acceleration, liquidity tension, and orderbook dynamics.
 */

export type FlowIntent = 
  | "BULLISH"      // Strong upward flow
  | "BEARISH"      // Strong downward flow
  | "STALLED"      // No clear direction
  | "FAKE_MOVE";   // False breakout/breakdown

/**
 * Market snapshot for flow analysis
 */
export interface FlowSnapshot {
  symbol: string;
  timestamp: number;
  
  // Price data
  price: number;
  bid: number;
  ask: number;
  high: number;        // Recent high
  low: number;         // Recent low
  
  // Volume and velocity
  volume: number;      // Current volume
  volumeMA: number;    // Volume moving average
  tickCount: number;   // Number of ticks in window
  tickVelocity: number; // Ticks per second
  
  // Orderbook
  bidDepth: number;    // Total bid liquidity
  askDepth: number;    // Total ask liquidity
  bidLevels: number;   // Number of bid levels
  askLevels: number;   // Number of ask levels
  
  // Spread
  spreadBps: number;   // Bid-ask spread in basis points
  
  // Momentum indicators
  rsi?: number;        // RSI if available
  macd?: number;       // MACD if available
}

/**
 * Liquidity profile analysis
 */
export interface LiquidityProfile {
  totalDepth: number;           // Total orderbook depth
  bidAskRatio: number;          // Bid depth / Ask depth
  imbalance: number;            // -100 to +100 (negative = sell pressure)
  tension: number;              // 0-100 (liquidity stress level)
  
  // Layer analysis
  topLayerBid: number;          // Liquidity at best bid
  topLayerAsk: number;          // Liquidity at best ask
  deepLayerBid: number;         // Liquidity 5+ levels deep
  deepLayerAsk: number;         // Liquidity 5+ levels deep
  
  // Quality metrics
  avgBidSize: number;           // Average bid order size
  avgAskSize: number;           // Average ask order size
  spreadQuality: "TIGHT" | "NORMAL" | "WIDE" | "EXTREME";
}

/**
 * Flow metrics computed by MFAE
 */
export interface FlowMetrics {
  // Tick acceleration
  tickAccel: number;            // Rate of change of tick velocity (0-100)
  tickAccelDirection: "UP" | "DOWN" | "FLAT";
  
  // Liquidity tension
  liquidityTension: number;     // 0-100 (higher = more stress)
  tensionDirection: "INCREASING" | "DECREASING" | "STABLE";
  
  // Orderbook imbalance
  imbalancePressure: number;    // -100 to +100
  imbalanceStrength: "WEAK" | "MODERATE" | "STRONG" | "EXTREME";
  
  // Micro volatility
  microVolatility: number;      // 0-100
  volatilityTrend: "RISING" | "FALLING" | "STABLE";
  
  // Combined score
  flowScore: number;            // 0-100 (higher = stronger flow)
  flowDirection: "BULLISH" | "BEARISH" | "NEUTRAL";
}

/**
 * Final flow intent result
 */
export interface FlowIntentResult {
  flowIntent: FlowIntent;
  confidence: number;           // 0-100
  reason: string[];
  timestamp: number;
  
  // Detailed metrics
  metrics: FlowMetrics;
  liquidityProfile: LiquidityProfile;
  
  // Diagnostic info
  tickAccel: number;
  liquidityTension: number;
  imbalancePressure: number;
  microVolatility: number;
  
  // Alerts
  fakeoutDetected: boolean;
  liquidityCrisis: boolean;
  momentumShift: boolean;
}

/**
 * Flow state for history tracking
 */
export interface FlowState {
  lastIntent: FlowIntentResult | null;
  totalAnalyses: number;
  
  // Intent counts
  bullishCount: number;
  bearishCount: number;
  stalledCount: number;
  fakeMovesCount: number;
  
  // Averages
  avgConfidence: number;
  avgTickAccel: number;
  avgLiquidityTension: number;
  avgImbalance: number;
  
  lastUpdate: number;
}

/**
 * MFAE configuration
 */
export interface MFAEConfig {
  // Tick acceleration thresholds
  minTickAccel: number;         // Min acceleration for movement (0-100)
  highTickAccel: number;        // High acceleration threshold
  
  // Liquidity tension thresholds
  maxLiquidityTension: number;  // Max tension before crisis (0-100)
  normalTension: number;        // Normal tension baseline
  
  // Imbalance thresholds
  minImbalanceForSignal: number; // Min imbalance to trigger signal
  extremeImbalance: number;      // Extreme imbalance threshold
  
  // Volatility thresholds
  maxVolatility: number;         // Max acceptable volatility
  stableVolatility: number;      // Stable volatility range
  
  // Flow score thresholds
  minFlowScoreForBullish: number;  // Min score for bullish (0-100)
  minFlowScoreForBearish: number;  // Min score for bearish (0-100)
  
  // Confidence requirements
  minConfidence: number;         // Min confidence to act (0-100)
  
  // Fake-out detection
  enableFakeoutDetection: boolean;
  fakeoutVolatilityThreshold: number;
  fakeoutImbalanceThreshold: number;
  
  // Weights for flow score calculation
  weights: {
    tickAccel: number;           // Weight for tick acceleration
    liquidityTension: number;    // Weight for liquidity tension
    imbalance: number;           // Weight for imbalance
    volatility: number;          // Weight for volatility
  };
}

/**
 * Default MFAE configuration
 */
export const DEFAULT_MFAE_CONFIG: MFAEConfig = {
  // Tick acceleration
  minTickAccel: 20,              // Need 20+ acceleration
  highTickAccel: 60,             // 60+ is strong acceleration
  
  // Liquidity tension
  maxLiquidityTension: 75,       // 75+ is crisis
  normalTension: 40,             // 40 is normal baseline
  
  // Imbalance
  minImbalanceForSignal: 30,     // Need ±30 imbalance for signal
  extremeImbalance: 70,          // ±70 is extreme
  
  // Volatility
  maxVolatility: 80,             // Max 80/100 volatility
  stableVolatility: 30,          // <30 is stable
  
  // Flow scores
  minFlowScoreForBullish: 65,    // Need 65+ for bullish
  minFlowScoreForBearish: 65,    // Need 65+ for bearish (absolute)
  
  // Confidence
  minConfidence: 60,             // Need 60+ confidence
  
  // Fake-out detection
  enableFakeoutDetection: true,
  fakeoutVolatilityThreshold: 70,  // High volatility suggests fake
  fakeoutImbalanceThreshold: 20,   // Low imbalance suggests fake
  
  // Weights
  weights: {
    tickAccel: 0.30,             // 30% weight
    liquidityTension: 0.25,      // 25% weight
    imbalance: 0.30,             // 30% weight
    volatility: 0.15,            // 15% weight
  },
};

/**
 * Historical flow data point
 */
export interface FlowDataPoint {
  timestamp: number;
  snapshot: FlowSnapshot;
  result: FlowIntentResult;
}

/**
 * Flow trend analysis
 */
export interface FlowTrend {
  direction: "STRENGTHENING" | "WEAKENING" | "STABLE" | "REVERSING";
  recentIntent: FlowIntent;
  intentStability: number;      // 0-100 (how stable is the intent)
  momentumScore: number;        // 0-100 (flow momentum strength)
  trendDuration: number;        // Milliseconds in current trend
}

/**
 * Alert types for flow engine
 */
export interface FlowAlert {
  type: "FAKE_MOVE" | "LIQUIDITY_CRISIS" | "MOMENTUM_SHIFT" | "FLOW_REVERSAL";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  timestamp: number;
  context: any;
}
