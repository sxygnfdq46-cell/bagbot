/**
 * X-REACTOR (Execution Reactor Engine) - Types
 * 
 * Final micro-second validation layer before order execution.
 * Makes real-time go/no-go decisions based on spread, latency, orderbook pressure.
 */

export type ReactorCommand = 
  | "EXECUTE"           // All checks pass - fire immediately
  | "DELAY"             // Wait for better conditions
  | "CANCEL"            // Conditions deteriorated - abort
  | "SCALE"             // Reduce size due to risk
  | "EMERGENCY_ABORT";  // Critical failure detected

export type OrderType = 
  | "MARKET"       // Execute at market price
  | "LIMIT"        // Execute at limit price
  | "STOP"         // Stop loss order
  | "STOP_LIMIT";  // Stop limit order

/**
 * Final execution decision from X-REACTOR
 */
export interface ReactorDecision {
  command: ReactorCommand;
  delayMs: number;              // Microseconds to delay (0 = immediate)
  finalSize: number;            // Final position size after scaling
  orderType: OrderType;         // Order type selection
  reason: string[];             // Explanation for decision
  confidence: number;           // 0-100 confidence in decision
  timestamp: number;            // Decision timestamp
  
  // Diagnostic info
  spreadBps: number;            // Current spread in basis points
  latencyMs: number;            // Current latency
  pressureScore: number;        // Orderbook pressure (0-100)
  volatilityScore: number;      // Micro-volatility (0-100)
  reversalRisk: number;         // Reversal risk (0-100)
}

/**
 * Market snapshot for micro-second decision making
 */
export interface MarketSnapshot {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  timestamp: number;
  volume24h?: number;
  lastUpdateMs?: number;        // Milliseconds since last update
}

/**
 * Orderbook state for pressure analysis
 */
export interface OrderbookState {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  timestamp: number;
  bidDepth: number;             // Total bid liquidity
  askDepth: number;             // Total ask liquidity
  imbalance: number;            // -100 to +100 (negative = sell pressure)
}

/**
 * Latency monitoring data
 */
export interface LatencyLog {
  avgMs: number;                // Average latency
  p50Ms: number;                // 50th percentile
  p95Ms: number;                // 95th percentile
  p99Ms: number;                // 99th percentile
  lastMs: number;               // Most recent latency
  timestamp: number;
}

/**
 * Input context for X-REACTOR
 */
export interface ReactorContext {
  exoDecision: {
    command: "EXECUTE" | "WAIT" | "CANCEL" | "SCALE";
    confidence: number;
    targetSize: number;
    direction: "LONG" | "SHORT";
    reason: string[];
  };
  marketSnapshot: MarketSnapshot;
  orderbook: OrderbookState;
  latencyLog: LatencyLog;
  timestamp: number;
}

/**
 * Result from micro-level monitoring check
 */
export interface MicroCheckResult {
  checkName: string;
  passed: boolean;
  score: number;              // 0-100
  value: number;              // Raw measured value
  threshold: number;          // Threshold that was checked
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}

/**
 * Result from reactor rule evaluation
 */
export interface ReactorRuleResult {
  ruleName: string;
  passed: boolean;
  blockExecution: boolean;    // If true, must abort
  delayMs: number;            // Suggested delay
  scaleDown: number;          // Suggested size reduction (0-1)
  reason: string;
  priority: number;           // 1-10 (10 = highest priority)
}

/**
 * Reactor configuration and thresholds
 */
export interface ReactorConfig {
  // Spread thresholds
  maxSpreadBps: number;           // Max acceptable spread in basis points
  idealSpreadBps: number;         // Ideal spread target
  
  // Latency thresholds
  maxLatencyMs: number;           // Max acceptable latency
  idealLatencyMs: number;         // Ideal latency target
  
  // Orderbook pressure thresholds
  minPressureScore: number;       // Min favorable pressure (0-100)
  maxImbalance: number;           // Max orderbook imbalance
  
  // Volatility thresholds
  maxVolatilityScore: number;     // Max acceptable volatility
  
  // Reversal risk thresholds
  maxReversalRisk: number;        // Max acceptable reversal risk
  
  // Timing
  maxDelayMs: number;             // Max time to wait for better conditions
  minDelayMs: number;             // Min delay increment
  
  // Scaling
  minScaleDown: number;           // Min size reduction (0-1)
  maxScaleDown: number;           // Max size reduction (0-1)
}

/**
 * X-REACTOR statistics and performance metrics
 */
export interface ReactorMetrics {
  totalDecisions: number;
  executedCount: number;
  delayedCount: number;
  cancelledCount: number;
  scaledCount: number;
  abortedCount: number;
  
  avgConfidence: number;
  avgDelayMs: number;
  avgSpreadBps: number;
  avgLatencyMs: number;
  
  emergencyAborts: number;
  ruleViolations: number;
  
  lastDecision: ReactorDecision | null;
  lastUpdate: number;
}

/**
 * Default reactor configuration
 */
export const DEFAULT_REACTOR_CONFIG: ReactorConfig = {
  // Spread
  maxSpreadBps: 15,              // 0.15% max spread
  idealSpreadBps: 5,             // 0.05% ideal spread
  
  // Latency
  maxLatencyMs: 100,             // 100ms max latency
  idealLatencyMs: 20,            // 20ms ideal latency
  
  // Orderbook pressure
  minPressureScore: 40,          // At least 40/100 pressure
  maxImbalance: 70,              // Max 70% imbalance
  
  // Volatility
  maxVolatilityScore: 80,        // Max 80/100 volatility
  
  // Reversal risk
  maxReversalRisk: 60,           // Max 60/100 reversal risk
  
  // Timing
  maxDelayMs: 500,               // Max 500ms delay
  minDelayMs: 50,                // Min 50ms delay increment
  
  // Scaling
  minScaleDown: 0.5,             // Min 50% size
  maxScaleDown: 0.1,             // Can reduce to 10% size
};
