/**
 * Market Flow Anticipation Engine - Flow Calculators
 * 
 * Core calculation functions for flow analysis.
 * Each calculator returns a normalized 0-100 score (or -100 to +100 for directional).
 */

import type { FlowSnapshot } from './flowTypes';

/**
 * Calculate tick acceleration
 * Measures how quickly price is moving (rate of change of velocity)
 * 
 * @returns Score 0-100 (higher = faster acceleration)
 */
export function calcTickAcceleration(
  currentSnapshot: FlowSnapshot,
  previousSnapshots: FlowSnapshot[]
): {
  score: number;
  direction: "UP" | "DOWN" | "FLAT";
  rawAccel: number;
} {
  if (previousSnapshots.length < 2) {
    return { score: 0, direction: "FLAT", rawAccel: 0 };
  }
  
  // Get recent tick velocities
  const current = currentSnapshot.tickVelocity;
  const prev1 = previousSnapshots[previousSnapshots.length - 1]?.tickVelocity || current;
  const prev2 = previousSnapshots[previousSnapshots.length - 2]?.tickVelocity || prev1;
  
  // Calculate acceleration (change in velocity)
  const accel1 = current - prev1;
  const accel2 = prev1 - prev2;
  const rawAccel = accel1; // Primary acceleration
  const smoothedAccel = (accel1 + accel2) / 2; // Smoothed
  
  // Determine direction
  let direction: "UP" | "DOWN" | "FLAT" = "FLAT";
  if (smoothedAccel > 0.5) direction = "UP";
  else if (smoothedAccel < -0.5) direction = "DOWN";
  
  // Normalize to 0-100 score
  // Assume typical acceleration range is -10 to +10 ticks/sec
  const normalizedAccel = Math.abs(smoothedAccel);
  const score = Math.min(100, (normalizedAccel / 10) * 100);
  
  return {
    score: Math.round(score),
    direction,
    rawAccel: smoothedAccel,
  };
}

/**
 * Calculate liquidity tension
 * Measures stress in orderbook (thin liquidity = high tension)
 * 
 * @returns Score 0-100 (higher = more tension/stress)
 */
export function calcLiquidityTension(
  snapshot: FlowSnapshot,
  previousSnapshots: FlowSnapshot[]
): {
  score: number;
  direction: "INCREASING" | "DECREASING" | "STABLE";
  depthQuality: "DEEP" | "NORMAL" | "THIN" | "CRITICAL";
} {
  const { bidDepth, askDepth, volume, spreadBps } = snapshot;
  
  // Calculate total depth
  const totalDepth = bidDepth + askDepth;
  
  // Depth quality assessment
  let depthQuality: "DEEP" | "NORMAL" | "THIN" | "CRITICAL";
  if (totalDepth > volume * 10) depthQuality = "DEEP";
  else if (totalDepth > volume * 5) depthQuality = "NORMAL";
  else if (totalDepth > volume * 2) depthQuality = "THIN";
  else depthQuality = "CRITICAL";
  
  // Base tension from depth
  let tensionScore = 0;
  if (depthQuality === "CRITICAL") tensionScore = 80;
  else if (depthQuality === "THIN") tensionScore = 60;
  else if (depthQuality === "NORMAL") tensionScore = 30;
  else tensionScore = 10;
  
  // Adjust for spread (wide spread = more tension)
  const spreadTension = Math.min(30, spreadBps * 2); // Up to +30 points
  tensionScore += spreadTension;
  
  // Clamp to 0-100
  tensionScore = Math.min(100, Math.max(0, tensionScore));
  
  // Determine direction by comparing to previous
  let direction: "INCREASING" | "DECREASING" | "STABLE" = "STABLE";
  if (previousSnapshots.length > 0) {
    const prevSnapshot = previousSnapshots[previousSnapshots.length - 1];
    const prevDepth = prevSnapshot.bidDepth + prevSnapshot.askDepth;
    const depthChange = ((totalDepth - prevDepth) / prevDepth) * 100;
    
    if (depthChange < -10) direction = "INCREASING"; // Depth decreased = tension up
    else if (depthChange > 10) direction = "DECREASING"; // Depth increased = tension down
  }
  
  return {
    score: Math.round(tensionScore),
    direction,
    depthQuality,
  };
}

/**
 * Calculate orderbook imbalance pressure
 * Measures buy vs sell pressure in orderbook
 * 
 * @returns Score -100 to +100 (negative = sell pressure, positive = buy pressure)
 */
export function calcImbalancePressure(
  snapshot: FlowSnapshot,
  previousSnapshots: FlowSnapshot[]
): {
  score: number;
  strength: "WEAK" | "MODERATE" | "STRONG" | "EXTREME";
  bidAskRatio: number;
} {
  const { bidDepth, askDepth } = snapshot;
  
  // Calculate bid/ask ratio
  const bidAskRatio = bidDepth / (askDepth || 1); // Avoid division by zero
  
  // Calculate imbalance (-100 to +100)
  // Ratio > 1 = more bids (buy pressure)
  // Ratio < 1 = more asks (sell pressure)
  let imbalanceScore = 0;
  
  if (bidAskRatio > 1) {
    // Buy pressure
    // Ratio of 2.0 = +50, ratio of 3.0 = +75, ratio of 4.0 = +90
    imbalanceScore = Math.min(100, (bidAskRatio - 1) * 50);
  } else {
    // Sell pressure
    // Ratio of 0.5 = -50, ratio of 0.33 = -75, ratio of 0.25 = -90
    imbalanceScore = -Math.min(100, (1 / bidAskRatio - 1) * 50);
  }
  
  // Determine strength
  const absScore = Math.abs(imbalanceScore);
  let strength: "WEAK" | "MODERATE" | "STRONG" | "EXTREME";
  if (absScore < 20) strength = "WEAK";
  else if (absScore < 40) strength = "MODERATE";
  else if (absScore < 70) strength = "STRONG";
  else strength = "EXTREME";
  
  return {
    score: Math.round(imbalanceScore),
    strength,
    bidAskRatio: Math.round(bidAskRatio * 100) / 100,
  };
}

/**
 * Calculate micro volatility
 * Measures short-term price instability
 * 
 * @returns Score 0-100 (higher = more volatile)
 */
export function calcMicroVolatility(
  snapshot: FlowSnapshot,
  previousSnapshots: FlowSnapshot[]
): {
  score: number;
  trend: "RISING" | "FALLING" | "STABLE";
  priceRange: number;
} {
  const { price, high, low, bid, ask } = snapshot;
  
  // Calculate price range as % of price
  const priceRange = ((high - low) / price) * 100;
  
  // Calculate bid-ask spread as % of price
  const spreadPct = ((ask - bid) / price) * 100;
  
  // Base volatility from range
  let volatilityScore = Math.min(100, priceRange * 10); // 1% range = 10 points
  
  // Add spread component
  volatilityScore += Math.min(30, spreadPct * 100); // Wide spread = more volatility
  
  // Look at price changes if we have history
  if (previousSnapshots.length >= 3) {
    const recent = previousSnapshots.slice(-3);
    const prices = [...recent.map(s => s.price), price];
    
    // Calculate standard deviation of recent prices
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cvPct = (stdDev / mean) * 100; // Coefficient of variation
    
    // Add volatility from price variance
    volatilityScore += Math.min(40, cvPct * 20);
  }
  
  // Clamp to 0-100
  volatilityScore = Math.min(100, Math.max(0, volatilityScore));
  
  // Determine trend
  let trend: "RISING" | "FALLING" | "STABLE" = "STABLE";
  if (previousSnapshots.length >= 2) {
    const prev1 = previousSnapshots[previousSnapshots.length - 1];
    const prev2 = previousSnapshots[previousSnapshots.length - 2];
    
    const currentRange = high - low;
    const prev1Range = prev1.high - prev1.low;
    const prev2Range = prev2.high - prev2.low;
    
    const avgPrevRange = (prev1Range + prev2Range) / 2;
    const rangeChange = ((currentRange - avgPrevRange) / avgPrevRange) * 100;
    
    if (rangeChange > 15) trend = "RISING";
    else if (rangeChange < -15) trend = "FALLING";
  }
  
  return {
    score: Math.round(volatilityScore),
    trend,
    priceRange: Math.round(priceRange * 100) / 100,
  };
}

/**
 * Calculate combined flow score
 * Weighted combination of all flow metrics
 * 
 * @returns Score 0-100 and direction
 */
export function calcCombinedFlowScore(
  tickAccel: number,
  liquidityTension: number,
  imbalancePressure: number,
  microVolatility: number,
  weights: {
    tickAccel: number;
    liquidityTension: number;
    imbalance: number;
    volatility: number;
  }
): {
  score: number;
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
} {
  // Normalize all to 0-100 for weighting
  // ImbalancePressure is -100 to +100, so convert to magnitude
  const imbalanceMagnitude = Math.abs(imbalancePressure);
  const imbalanceDirection = imbalancePressure > 0 ? 1 : -1;
  
  // Calculate base score (0-100)
  const baseScore = 
    tickAccel * weights.tickAccel +
    (100 - liquidityTension) * weights.liquidityTension + // Invert tension (low tension = good)
    imbalanceMagnitude * weights.imbalance +
    (100 - microVolatility) * weights.volatility; // Invert volatility (low vol = good)
  
  // Determine direction from imbalance
  let direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  if (imbalancePressure > 20) direction = "BULLISH";
  else if (imbalancePressure < -20) direction = "BEARISH";
  else direction = "NEUTRAL";
  
  return {
    score: Math.round(Math.min(100, Math.max(0, baseScore))),
    direction,
  };
}

/**
 * Detect fake-out conditions
 * High volatility + low imbalance + high tension = likely fake move
 * 
 * @returns Boolean indicating fake-out detection
 */
export function detectFakeout(
  tickAccel: number,
  liquidityTension: number,
  imbalancePressure: number,
  microVolatility: number,
  config: {
    volatilityThreshold: number;
    imbalanceThreshold: number;
  }
): {
  isFakeout: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let fakeoutScore = 0;
  
  // High volatility suggests erratic movement
  if (microVolatility > config.volatilityThreshold) {
    fakeoutScore += 30;
    reasons.push(`High micro-volatility (${microVolatility}/100)`);
  }
  
  // Low imbalance suggests no conviction
  const absImbalance = Math.abs(imbalancePressure);
  if (absImbalance < config.imbalanceThreshold) {
    fakeoutScore += 30;
    reasons.push(`Weak orderbook imbalance (${absImbalance}/100)`);
  }
  
  // High tension suggests thin liquidity (fake moves happen in thin markets)
  if (liquidityTension > 60) {
    fakeoutScore += 20;
    reasons.push(`High liquidity tension (${liquidityTension}/100)`);
  }
  
  // High acceleration with low imbalance = stop hunt / fake breakout
  if (tickAccel > 60 && absImbalance < 30) {
    fakeoutScore += 20;
    reasons.push("High acceleration without orderbook support");
  }
  
  const isFakeout = fakeoutScore >= 50; // Need 50+ points to flag as fake
  
  return {
    isFakeout,
    confidence: Math.min(100, fakeoutScore),
    reasons: isFakeout ? reasons : [],
  };
}

/**
 * Analyze liquidity profile in detail
 */
export function analyzeLiquidityProfile(snapshot: FlowSnapshot): {
  totalDepth: number;
  bidAskRatio: number;
  imbalance: number;
  spreadQuality: "TIGHT" | "NORMAL" | "WIDE" | "EXTREME";
  avgBidSize: number;
  avgAskSize: number;
} {
  const { bidDepth, askDepth, bidLevels, askLevels, spreadBps } = snapshot;
  
  const totalDepth = bidDepth + askDepth;
  const bidAskRatio = bidDepth / (askDepth || 1);
  
  // Calculate imbalance
  const imbalance = ((bidDepth - askDepth) / totalDepth) * 100;
  
  // Spread quality
  let spreadQuality: "TIGHT" | "NORMAL" | "WIDE" | "EXTREME";
  if (spreadBps < 5) spreadQuality = "TIGHT";
  else if (spreadBps < 15) spreadQuality = "NORMAL";
  else if (spreadBps < 30) spreadQuality = "WIDE";
  else spreadQuality = "EXTREME";
  
  // Average sizes
  const avgBidSize = bidLevels > 0 ? bidDepth / bidLevels : 0;
  const avgAskSize = askLevels > 0 ? askDepth / askLevels : 0;
  
  return {
    totalDepth: Math.round(totalDepth * 100) / 100,
    bidAskRatio: Math.round(bidAskRatio * 100) / 100,
    imbalance: Math.round(imbalance * 100) / 100,
    spreadQuality,
    avgBidSize: Math.round(avgBidSize * 100) / 100,
    avgAskSize: Math.round(avgAskSize * 100) / 100,
  };
}
