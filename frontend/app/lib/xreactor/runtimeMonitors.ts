/**
 * X-REACTOR - Runtime Monitors
 * 
 * Real-time monitoring functions that check micro-conditions before execution.
 * Each monitor returns a MicroCheckResult with pass/fail and severity.
 */

import type {
  MicroCheckResult,
  MarketSnapshot,
  OrderbookState,
  LatencyLog,
} from './types';

/**
 * Monitor bid-ask spread tightness
 * Tight spread = favorable execution conditions
 */
export function monitorSpread(
  snapshot: MarketSnapshot,
  maxSpreadBps: number,
  idealSpreadBps: number
): MicroCheckResult {
  const { bid, ask } = snapshot;
  const spread = ask - bid;
  const midPrice = (bid + ask) / 2;
  const spreadBps = (spread / midPrice) * 10000; // basis points
  
  const passed = spreadBps <= maxSpreadBps;
  
  // Score: 100 at ideal, 0 at max, linear interpolation
  let score = 100;
  if (spreadBps > idealSpreadBps) {
    score = Math.max(
      0,
      100 - ((spreadBps - idealSpreadBps) / (maxSpreadBps - idealSpreadBps)) * 100
    );
  }
  
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  if (spreadBps > maxSpreadBps) severity = "CRITICAL";
  else if (spreadBps > idealSpreadBps * 2) severity = "WARNING";
  
  return {
    checkName: "Spread Monitor",
    passed,
    score: Math.round(score),
    value: spreadBps,
    threshold: maxSpreadBps,
    message: `Spread: ${spreadBps.toFixed(2)} bps (max: ${maxSpreadBps})`,
    severity,
  };
}

/**
 * Monitor micro-volatility from recent price changes
 * High volatility = risky execution timing
 */
export function monitorMicroVolatility(
  snapshot: MarketSnapshot,
  maxVolatilityScore: number
): MicroCheckResult {
  const { price, lastUpdateMs = 0 } = snapshot;
  
  // Simulate micro-volatility calculation
  // In production: use tick-by-tick price variance or ATR
  const timeSinceUpdate = lastUpdateMs;
  const baseVolatility = Math.abs((price % 100) / 100) * 100; // Mock calculation
  
  // Volatility increases with stale data
  const staleness = Math.min(timeSinceUpdate / 1000, 5); // Max 5s staleness
  const volatilityScore = Math.min(100, baseVolatility * (1 + staleness * 0.2));
  
  const passed = volatilityScore <= maxVolatilityScore;
  
  // Score: inverse of volatility
  const score = Math.max(0, 100 - volatilityScore);
  
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  if (volatilityScore > maxVolatilityScore) severity = "CRITICAL";
  else if (volatilityScore > maxVolatilityScore * 0.8) severity = "WARNING";
  
  return {
    checkName: "Micro-Volatility Monitor",
    passed,
    score: Math.round(score),
    value: volatilityScore,
    threshold: maxVolatilityScore,
    message: `Volatility: ${volatilityScore.toFixed(1)}/100 (max: ${maxVolatilityScore})`,
    severity,
  };
}

/**
 * Monitor orderbook pressure and depth
 * Favorable pressure = large liquidity in trade direction
 */
export function monitorOrderbookPressure(
  orderbook: OrderbookState,
  direction: "LONG" | "SHORT",
  minPressureScore: number,
  maxImbalance: number
): MicroCheckResult {
  const { bidDepth, askDepth, imbalance } = orderbook;
  
  // Calculate pressure score based on direction
  let pressureScore = 50; // Neutral
  
  if (direction === "LONG") {
    // For LONG: want high bid depth, low ask pressure
    const depthRatio = bidDepth / (bidDepth + askDepth);
    const imbalanceFactor = Math.max(0, 100 + imbalance) / 100; // Positive imbalance helps
    pressureScore = depthRatio * imbalanceFactor * 100;
  } else {
    // For SHORT: want high ask depth, low bid pressure
    const depthRatio = askDepth / (bidDepth + askDepth);
    const imbalanceFactor = Math.max(0, 100 - imbalance) / 100; // Negative imbalance helps
    pressureScore = depthRatio * imbalanceFactor * 100;
  }
  
  const imbalanceOk = Math.abs(imbalance) <= maxImbalance;
  const pressureOk = pressureScore >= minPressureScore;
  const passed = pressureOk && imbalanceOk;
  
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  if (!passed) severity = "CRITICAL";
  else if (pressureScore < minPressureScore * 1.2) severity = "WARNING";
  
  return {
    checkName: "Orderbook Pressure Monitor",
    passed,
    score: Math.round(pressureScore),
    value: pressureScore,
    threshold: minPressureScore,
    message: `Pressure: ${pressureScore.toFixed(1)}/100 (min: ${minPressureScore}), Imbalance: ${imbalance.toFixed(1)}%`,
    severity,
  };
}

/**
 * Monitor network latency to exchange
 * Low latency = execution advantage
 */
export function monitorLatency(
  latencyLog: LatencyLog,
  maxLatencyMs: number,
  idealLatencyMs: number
): MicroCheckResult {
  const { lastMs, p95Ms, avgMs } = latencyLog;
  
  // Use worst of last/p95 to be conservative
  const effectiveLatency = Math.max(lastMs, p95Ms);
  const passed = effectiveLatency <= maxLatencyMs;
  
  // Score: 100 at ideal, 0 at max
  let score = 100;
  if (effectiveLatency > idealLatencyMs) {
    score = Math.max(
      0,
      100 - ((effectiveLatency - idealLatencyMs) / (maxLatencyMs - idealLatencyMs)) * 100
    );
  }
  
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  if (effectiveLatency > maxLatencyMs) severity = "CRITICAL";
  else if (effectiveLatency > idealLatencyMs * 2) severity = "WARNING";
  
  return {
    checkName: "Latency Monitor",
    passed,
    score: Math.round(score),
    value: effectiveLatency,
    threshold: maxLatencyMs,
    message: `Latency: ${effectiveLatency.toFixed(1)}ms (avg: ${avgMs.toFixed(1)}ms, p95: ${p95Ms.toFixed(1)}ms, max: ${maxLatencyMs}ms)`,
    severity,
  };
}

/**
 * Monitor reversal risk from price action
 * High reversal risk = momentum exhaustion
 */
export function monitorReversalRisk(
  snapshot: MarketSnapshot,
  orderbook: OrderbookState,
  direction: "LONG" | "SHORT",
  maxReversalRisk: number
): MicroCheckResult {
  const { price, bid, ask } = snapshot;
  const { imbalance, bidDepth, askDepth } = orderbook;
  
  // Calculate reversal risk score (0-100)
  let reversalRisk = 50; // Neutral
  
  if (direction === "LONG") {
    // For LONG: risk increases if price near ask, negative imbalance
    const pricePosition = (price - bid) / (ask - bid); // 0-1
    const imbalancePenalty = Math.max(0, -imbalance); // Negative imbalance is bad
    const depthRatio = askDepth / (bidDepth + askDepth); // High ask depth = resistance
    
    reversalRisk = (pricePosition * 40) + (imbalancePenalty * 0.3) + (depthRatio * 30);
  } else {
    // For SHORT: risk increases if price near bid, positive imbalance
    const pricePosition = (ask - price) / (ask - bid); // 0-1
    const imbalancePenalty = Math.max(0, imbalance); // Positive imbalance is bad
    const depthRatio = bidDepth / (bidDepth + askDepth); // High bid depth = support
    
    reversalRisk = (pricePosition * 40) + (imbalancePenalty * 0.3) + (depthRatio * 30);
  }
  
  reversalRisk = Math.min(100, reversalRisk);
  const passed = reversalRisk <= maxReversalRisk;
  
  // Score: inverse of risk
  const score = Math.max(0, 100 - reversalRisk);
  
  let severity: "INFO" | "WARNING" | "CRITICAL" = "INFO";
  if (reversalRisk > maxReversalRisk) severity = "CRITICAL";
  else if (reversalRisk > maxReversalRisk * 0.8) severity = "WARNING";
  
  return {
    checkName: "Reversal Risk Monitor",
    passed,
    score: Math.round(score),
    value: reversalRisk,
    threshold: maxReversalRisk,
    message: `Reversal Risk: ${reversalRisk.toFixed(1)}/100 (max: ${maxReversalRisk})`,
    severity,
  };
}

/**
 * Run all monitors and return aggregated results
 */
export function runAllMonitors(
  snapshot: MarketSnapshot,
  orderbook: OrderbookState,
  latencyLog: LatencyLog,
  direction: "LONG" | "SHORT",
  config: {
    maxSpreadBps: number;
    idealSpreadBps: number;
    maxVolatilityScore: number;
    minPressureScore: number;
    maxImbalance: number;
    maxLatencyMs: number;
    idealLatencyMs: number;
    maxReversalRisk: number;
  }
): MicroCheckResult[] {
  return [
    monitorSpread(snapshot, config.maxSpreadBps, config.idealSpreadBps),
    monitorMicroVolatility(snapshot, config.maxVolatilityScore),
    monitorOrderbookPressure(orderbook, direction, config.minPressureScore, config.maxImbalance),
    monitorLatency(latencyLog, config.maxLatencyMs, config.idealLatencyMs),
    monitorReversalRisk(snapshot, orderbook, direction, config.maxReversalRisk),
  ];
}

/**
 * Calculate aggregate score from all monitors
 */
export function aggregateMonitorScore(checks: MicroCheckResult[]): {
  overallScore: number;
  passedCount: number;
  failedCount: number;
  criticalCount: number;
  warningCount: number;
} {
  const passedCount = checks.filter(c => c.passed).length;
  const failedCount = checks.length - passedCount;
  const criticalCount = checks.filter(c => c.severity === "CRITICAL").length;
  const warningCount = checks.filter(c => c.severity === "WARNING").length;
  
  // Weighted average of scores
  const overallScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
  
  return {
    overallScore: Math.round(overallScore),
    passedCount,
    failedCount,
    criticalCount,
    warningCount,
  };
}
