/**
 * DVBE Volatility Models
 * 
 * Statistical models for detecting volatility behaviors and patterns.
 * Each model returns a score (0-100) indicating likelihood/strength.
 */

import type { VolatilitySnapshot } from './volatilityTypes';

/**
 * Model result interface
 */
interface ModelResult {
  score: number;              // 0-100
  confidence: number;         // 0-100
  metrics: Record<string, any>;
  trigger?: string;
}

// ============================================================================
// Calm → Explosive Model
// ============================================================================

/**
 * Detect sudden explosion from calm state
 * 
 * Looks for:
 * - Low recent volatility followed by spike
 * - Rapid acceleration
 * - Liquidity shock
 */
export function detectCalmToExplosive(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check if was calm recently
  const wasCalm = snapshot.avgVol5m < 30 && snapshot.avgVol15m < 35;
  const isNowVolatile = snapshot.currentVol > 60;
  
  if (wasCalm && isNowVolatile) {
    score += 40;
    metrics.wasCalmNowVolatile = true;
  }
  
  // Check acceleration
  if (snapshot.volAcceleration > 20) {
    score += 30;
    metrics.highAcceleration = snapshot.volAcceleration;
  }
  
  // Check 1-minute delta
  if (snapshot.volDelta1m > 30) {
    score += 20;
    metrics.rapidIncrease = snapshot.volDelta1m;
  }
  
  // Check liquidity shock
  if (snapshot.liquidityChange < -40) {
    score += 10;
    metrics.liquidityShock = snapshot.liquidityChange;
  }
  
  // Determine trigger
  let trigger: string | undefined;
  if (snapshot.largeTradeCount > 5) {
    trigger = "large_trades";
  } else if (Math.abs(snapshot.pressureImbalance) > 60) {
    trigger = "pressure_imbalance";
  } else if (snapshot.spreadWidth > snapshot.avgVol15m * 2) {
    trigger = "spread_explosion";
  }
  
  const confidence = Math.min(100, score * 0.9 + (trigger ? 10 : 0));
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
    trigger,
  };
}

// ============================================================================
// Compression Model
// ============================================================================

/**
 * Detect volatility compression (building pressure)
 * 
 * Looks for:
 * - Decreasing volatility
 * - Narrowing price range
 * - Increasing pressure
 * - Potential breakout setup
 */
export function detectCompression(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check if volatility is decreasing
  if (snapshot.volDelta5m < -10 && snapshot.currentVol < snapshot.avgVol15m) {
    score += 25;
    metrics.decreasingVolatility = true;
  }
  
  // Check price range compression
  if (snapshot.priceRangeShort < snapshot.priceRangeMedium * 0.5) {
    score += 20;
    metrics.compressedRange = true;
  }
  
  // Check if pressure is building
  const pressure = Math.abs(snapshot.pressureImbalance);
  if (pressure > 40) {
    score += 20;
    metrics.buildingPressure = pressure;
  }
  
  // Check duration of compression
  if (history.length >= 5) {
    const recent = history.slice(-5);
    const allCompressed = recent.every(s => s.currentVol < 40);
    if (allCompressed) {
      score += 20;
      metrics.sustainedCompression = true;
    }
  }
  
  // Check liquidity stability (should be present during compression)
  if (snapshot.liquidityDepth > 50 && Math.abs(snapshot.liquidityChange) < 20) {
    score += 15;
    metrics.stableLiquidity = true;
  }
  
  // Calculate breakout probability
  const breakoutProb = Math.min(100, score + pressure * 0.5);
  metrics.breakoutProb = breakoutProb;
  
  const confidence = Math.min(100, score * 0.85 + 15);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

// ============================================================================
// Fake Spike Detector
// ============================================================================

/**
 * Detect false volatility spikes (mean-reverting)
 * 
 * Looks for:
 * - Sudden spike without follow-through
 * - Rapid mean reversion
 * - Low volume on spike
 * - No fundamental trigger
 */
export function detectFakeSpike(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check for sudden spike
  const isSpike = snapshot.currentVol > snapshot.avgVol5m + 25;
  if (isSpike) {
    score += 30;
    metrics.suddenSpike = true;
  }
  
  // Check if spike lacks follow-through (low tick frequency)
  if (snapshot.tickFrequency < snapshot.avgVol5m * 0.3) {
    score += 25;
    metrics.lowFollowThrough = true;
  }
  
  // Check mean reversion indicators
  const revertingToMean = 
    snapshot.currentVol > snapshot.avgVol15m &&
    snapshot.volDelta1m < 0;
  
  if (revertingToMean) {
    score += 25;
    metrics.meanReversion = true;
  }
  
  // Check if liquidity didn't change much (fake spikes don't drain liquidity)
  if (Math.abs(snapshot.liquidityChange) < 15) {
    score += 10;
    metrics.stableLiquidity = true;
  }
  
  // Check if spread is normalizing
  if (snapshot.spreadVol < snapshot.currentVol * 0.3) {
    score += 10;
    metrics.normalizingSpread = true;
  }
  
  // Mean reversion probability
  const meanReversionProb = Math.min(100, score + (revertingToMean ? 20 : 0));
  metrics.meanReversionProb = meanReversionProb;
  
  const confidence = Math.min(100, score * 0.8 + 20);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

// ============================================================================
// Shockwave Probability Model
// ============================================================================

/**
 * Detect major market event shockwave
 * 
 * Looks for:
 * - Extreme volatility spike
 * - Cascade across metrics
 * - Liquidity crisis
 * - Persistent elevated volatility
 */
export function detectShockwave(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check extreme volatility
  if (snapshot.currentVol > 80) {
    score += 35;
    metrics.extremeVolatility = snapshot.currentVol;
  }
  
  // Check cascade (multiple metrics spiking)
  const cascadeCount = [
    snapshot.spreadWidth > 100,
    snapshot.liquidityChange < -50,
    Math.abs(snapshot.pressureImbalance) > 70,
    snapshot.volAcceleration > 30,
    snapshot.priceVelocity > 80,
  ].filter(Boolean).length;
  
  if (cascadeCount >= 3) {
    score += 30;
    metrics.cascadeMetrics = cascadeCount;
  }
  
  // Check liquidity crisis
  if (snapshot.liquidityDepth < 30 || snapshot.liquidityChange < -60) {
    score += 20;
    metrics.liquidityCrisis = true;
  }
  
  // Check if volatility is sustained (not just a spike)
  if (snapshot.avgVol5m > 70) {
    score += 15;
    metrics.sustainedVolatility = true;
  }
  
  // Determine origin
  let origin: string | undefined;
  if (snapshot.largeTradeCount > 10) {
    origin = "large_trade_cascade";
  } else if (snapshot.liquidityChange < -70) {
    origin = "liquidity_collapse";
  } else if (Math.abs(snapshot.pressureImbalance) > 80) {
    origin = "extreme_pressure";
  } else {
    origin = "unknown_event";
  }
  
  metrics.origin = origin;
  metrics.cascadeRisk = Math.min(100, score + cascadeCount * 5);
  
  const confidence = Math.min(100, score * 0.95 + 5);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
    trigger: origin,
  };
}

// ============================================================================
// Aftershock Model
// ============================================================================

/**
 * Detect aftershock waves following major event
 * 
 * Looks for:
 * - Secondary volatility spikes
 * - Decreasing amplitude
 * - Regular intervals
 */
export function detectAftershock(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  if (history.length < 10) {
    return { score: 0, confidence: 0, metrics };
  }
  
  // Look for previous shockwave
  const hadShockwave = history.some(s => s.currentVol > 75);
  if (!hadShockwave) {
    return { score: 0, confidence: 0, metrics };
  }
  
  // Count secondary spikes
  const recent = history.slice(-10);
  const spikes = recent.filter(s => s.currentVol > 60);
  
  if (spikes.length >= 2) {
    score += 30;
    metrics.secondarySpikes = spikes.length;
  }
  
  // Check if amplitude is decreasing (key aftershock characteristic)
  const isDecreasing = 
    snapshot.currentVol < snapshot.avgVol5m &&
    snapshot.avgVol5m < snapshot.avgVol15m;
  
  if (isDecreasing) {
    score += 30;
    metrics.decreasingAmplitude = true;
  }
  
  // Check volatility decay rate
  const decayRate = (snapshot.avgVol15m - snapshot.currentVol) / snapshot.avgVol15m;
  if (decayRate > 0.1 && decayRate < 0.5) {
    score += 20;
    metrics.healthyDecay = decayRate;
  }
  
  // Check if still elevated but calming
  if (snapshot.currentVol > 40 && snapshot.currentVol < 70) {
    score += 20;
    metrics.elevatedButCalming = true;
  }
  
  metrics.aftershockWaves = spikes.length;
  metrics.aftershockDecay = decayRate;
  
  const confidence = Math.min(100, score * 0.85 + 15);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

// ============================================================================
// Liquidity Evaporation Curve
// ============================================================================

/**
 * Detect liquidity disappearing from market
 * 
 * Looks for:
 * - Rapid liquidity decrease
 * - Increasing spread
 * - Decreasing trade frequency
 * - Depth collapse
 */
export function detectLiquidityEvaporation(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check rapid liquidity decrease
  if (snapshot.liquidityChange < -40) {
    score += 35;
    metrics.rapidDecrease = snapshot.liquidityChange;
  }
  
  // Check low liquidity depth
  if (snapshot.liquidityDepth < 30) {
    score += 25;
    metrics.lowDepth = snapshot.liquidityDepth;
  }
  
  // Check spread widening (liquidity crisis signal)
  if (snapshot.spreadWidth > 80) {
    score += 20;
    metrics.wideSpread = snapshot.spreadWidth;
  }
  
  // Check decreasing trade frequency
  if (snapshot.tradeFrequency < 2) {
    score += 10;
    metrics.lowTradeFreq = snapshot.tradeFrequency;
  }
  
  // Check pressure imbalance (one-sided market)
  if (Math.abs(snapshot.pressureImbalance) > 65) {
    score += 10;
    metrics.oneSidedMarket = snapshot.pressureImbalance;
  }
  
  // Calculate evaporation rate
  const evaporationRate = Math.abs(snapshot.liquidityChange);
  metrics.evaporationRate = evaporationRate;
  
  // Estimate recovery time (rough heuristic)
  let recoveryTime: number | null = null;
  if (evaporationRate > 30) {
    // Faster evaporation = longer recovery
    recoveryTime = Math.min(3600000, evaporationRate * 60000); // 1-60 minutes
  }
  metrics.estimatedRecoveryTime = recoveryTime;
  
  const confidence = Math.min(100, score * 0.9 + 10);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

// ============================================================================
// Drift Model
// ============================================================================

/**
 * Detect gradual volatility drift (baseline shift)
 * 
 * Looks for:
 * - Consistent directional change
 * - Gradual increase/decrease
 * - No sudden spikes
 */
export function detectVolatilityDrift(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  if (history.length < 15) {
    return { score: 0, confidence: 0, metrics };
  }
  
  // Check if volatility is gradually changing
  const isGradual = 
    Math.abs(snapshot.volDelta1m) < 15 &&
    Math.abs(snapshot.volDelta5m) > 10;
  
  if (isGradual) {
    score += 30;
    metrics.gradualChange = true;
  }
  
  // Check consistency over longer period
  const avgDiff = snapshot.avgVol15m - snapshot.avgVol1h;
  if (Math.abs(avgDiff) > 15) {
    score += 25;
    metrics.sustainedDrift = avgDiff;
  }
  
  // Determine direction
  let direction: "UP" | "DOWN" | "NEUTRAL" = "NEUTRAL";
  if (snapshot.currentVol > snapshot.avgVol15m + 10) {
    direction = "UP";
    score += 20;
  } else if (snapshot.currentVol < snapshot.avgVol15m - 10) {
    direction = "DOWN";
    score += 20;
  }
  
  metrics.driftDirection = direction;
  
  // Calculate drift speed
  const driftSpeed = Math.abs(snapshot.volDelta5m);
  metrics.driftSpeed = driftSpeed;
  
  // Check if no sudden spikes (key drift characteristic)
  if (snapshot.volAcceleration < 10) {
    score += 25;
    metrics.noSuddenSpikes = true;
  }
  
  const confidence = Math.min(100, score * 0.8 + 20);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

// ============================================================================
// Acceleration Model
// ============================================================================

/**
 * Detect volatility acceleration zones
 * 
 * Looks for:
 * - Increasing rate of change
 * - Momentum building
 * - Potential peak approaching
 */
export function detectAccelerationZone(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check high acceleration
  if (snapshot.volAcceleration > 15) {
    score += 35;
    metrics.highAcceleration = snapshot.volAcceleration;
  }
  
  // Check increasing deltas
  const isAccelerating = 
    Math.abs(snapshot.volDelta1m) > Math.abs(snapshot.volDelta5m) * 0.3;
  
  if (isAccelerating) {
    score += 25;
    metrics.increasingRate = true;
  }
  
  // Check price velocity correlation
  if (snapshot.priceVelocity > 60 && snapshot.currentVol > 50) {
    score += 20;
    metrics.priceVolCorrelation = true;
  }
  
  // Check if building momentum
  if (snapshot.currentVol > snapshot.avgVol5m + 15) {
    score += 10;
    metrics.momentumBuilding = true;
  }
  
  // Check tick frequency increase
  if (snapshot.tickFrequency > snapshot.avgVol5m * 0.8) {
    score += 10;
    metrics.increasingActivity = true;
  }
  
  // Estimate peak (when acceleration might slow)
  let peakEstimate: number | null = null;
  if (snapshot.volAcceleration > 20) {
    peakEstimate = snapshot.currentVol + (snapshot.volAcceleration * 2);
  }
  metrics.estimatedPeak = peakEstimate;
  
  metrics.accelerationRate = snapshot.volAcceleration;
  
  const confidence = Math.min(100, score * 0.85 + 15);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

// ============================================================================
// Reversion Phase Model
// ============================================================================

/**
 * Detect return to baseline volatility
 * 
 * Looks for:
 * - Decreasing volatility
 * - Approaching historical average
 * - Stabilizing metrics
 */
export function detectReversionPhase(
  snapshot: VolatilitySnapshot,
  history: VolatilitySnapshot[]
): ModelResult {
  let score = 0;
  const metrics: Record<string, any> = {};
  
  // Check if volatility is decreasing
  if (snapshot.volDelta5m < -10) {
    score += 30;
    metrics.decreasingVolatility = true;
  }
  
  // Check if approaching longer-term average
  const targetVol = snapshot.avgVol1h;
  const distanceToTarget = Math.abs(snapshot.currentVol - targetVol);
  
  if (distanceToTarget < 20) {
    score += 25;
    metrics.nearTarget = true;
  }
  
  // Check stabilizing spread
  if (snapshot.spreadVol < 30 && snapshot.spreadWidth < 60) {
    score += 20;
    metrics.stabilizingSpread = true;
  }
  
  // Check liquidity recovery
  if (snapshot.liquidityChange > 10 && snapshot.liquidityDepth > 40) {
    score += 15;
    metrics.liquidityRecovery = true;
  }
  
  // Check decreasing acceleration
  if (Math.abs(snapshot.volAcceleration) < 5) {
    score += 10;
    metrics.lowAcceleration = true;
  }
  
  metrics.targetVolatility = targetVol;
  metrics.reversionSpeed = Math.abs(snapshot.volDelta5m);
  
  const confidence = Math.min(100, score * 0.85 + 15);
  
  return {
    score: Math.min(100, score),
    confidence,
    metrics,
  };
}

/**
 * Export all models
 */
export const VolatilityModels = {
  detectCalmToExplosive,
  detectCompression,
  detectFakeSpike,
  detectShockwave,
  detectAftershock,
  detectLiquidityEvaporation,
  detectVolatilityDrift,
  detectAccelerationZone,
  detectReversionPhase,
};

export default VolatilityModels;
