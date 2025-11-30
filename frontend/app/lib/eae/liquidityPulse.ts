/**
 * ⏰ EAE LIQUIDITY PULSE — Orderbook Liquidity Pulse Analysis
 * 
 * STEP 24.38 — Liquidity Pulse Functions
 * 
 * Purpose:
 * Analyze orderbook liquidity to detect directional "pulses" and flow.
 * Liquidity pulse represents the rhythm of buy/sell pressure over time.
 * 
 * Think of this as monitoring the orderbook's heartbeat - detecting when
 * liquidity is flowing in a particular direction and how strong that flow is.
 */

import type { LiquidityPulse, OrderbookData } from './types';

// ============================================================================
// CALCULATE LIQUIDITY PULSE
// ============================================================================

/**
 * calculateLiquidityPulse — Calculate overall liquidity pulse
 * 
 * Analyzes orderbook to detect directional liquidity flow patterns.
 * Combines direction, strength, and coherence into pulse analysis.
 * 
 * @param orderbook - Current orderbook snapshot
 * @param previousOrderbooks - Historical orderbook snapshots (for pulse rate)
 * @returns Liquidity pulse data
 */
export function calculateLiquidityPulse(
  orderbook: OrderbookData,
  previousOrderbooks?: OrderbookData[]
): LiquidityPulse {
  if (!orderbook) {
    return {
      direction: 'NEUTRAL',
      strength: 0,
      depth: 0,
      imbalance: 0,
      pulseRate: 0,
      lastPulse: Date.now(),
      coherence: 0,
      flowVelocity: 0,
    };
  }

  // Detect direction
  const direction = detectPulseDirection(orderbook);

  // Measure strength
  const strength = measurePulseStrength(orderbook);

  // Calculate total depth
  const depth = orderbook.bidDepth + orderbook.askDepth;

  // Get imbalance
  const imbalance = orderbook.imbalance;

  // Calculate pulse rate (if historical data available)
  let pulseRate = 0;
  let coherence = 0;
  let flowVelocity = 0;

  if (previousOrderbooks && previousOrderbooks.length > 0) {
    // Detect direction changes (pulses)
    const pulses: number[] = [];
    let lastDirection = detectPulseDirection(previousOrderbooks[0]);

    for (const prevBook of previousOrderbooks) {
      const currDirection = detectPulseDirection(prevBook);
      if (currDirection !== lastDirection && currDirection !== 'NEUTRAL') {
        pulses.push(prevBook.timestamp);
        lastDirection = currDirection;
      }
    }

    // Calculate pulse rate (pulses per minute)
    if (pulses.length > 1) {
      const timeSpan = orderbook.timestamp - previousOrderbooks[0].timestamp;
      pulseRate = (pulses.length / timeSpan) * 60000; // Per minute
    }

    // Calculate coherence (how consistent is the direction)
    const directions = previousOrderbooks.map((b) => detectPulseDirection(b));
    const dominantDirection = direction;
    const coherentCount = directions.filter((d) => d === dominantDirection).length;
    coherence = (coherentCount / directions.length) * 100;

    // Calculate flow velocity (rate of imbalance change)
    if (previousOrderbooks.length > 0) {
      const lastImbalance = previousOrderbooks[previousOrderbooks.length - 1].imbalance;
      const timeDiff = orderbook.timestamp - previousOrderbooks[previousOrderbooks.length - 1].timestamp;
      flowVelocity = timeDiff > 0 ? ((imbalance - lastImbalance) / timeDiff) * 1000 : 0; // Per second
    }
  }

  return {
    direction,
    strength: Math.round(strength),
    depth,
    imbalance,
    pulseRate: Math.round(pulseRate * 10) / 10,
    lastPulse: orderbook.timestamp,
    coherence: Math.round(coherence),
    flowVelocity: Math.round(flowVelocity * 1000) / 1000,
  };
}

// ============================================================================
// DETECT PULSE DIRECTION
// ============================================================================

/**
 * detectPulseDirection — Detect primary liquidity flow direction
 * 
 * Analyzes orderbook imbalance to determine if liquidity is flowing
 * toward buys, sells, or neutral.
 * 
 * @param orderbook - Orderbook snapshot
 * @returns Direction (BUY, SELL, NEUTRAL)
 */
export function detectPulseDirection(
  orderbook: OrderbookData
): 'BUY' | 'SELL' | 'NEUTRAL' {
  if (!orderbook) {
    return 'NEUTRAL';
  }

  const imbalance = orderbook.imbalance;
  const threshold = 0.15; // 15% imbalance threshold

  if (imbalance > threshold) {
    return 'BUY'; // More bid depth = buy pressure
  } else if (imbalance < -threshold) {
    return 'SELL'; // More ask depth = sell pressure
  } else {
    return 'NEUTRAL'; // Balanced
  }
}

// ============================================================================
// MEASURE PULSE STRENGTH
// ============================================================================

/**
 * measurePulseStrength — Measure strength of liquidity pulse
 * 
 * Combines imbalance magnitude, depth, and spread quality to determine
 * how strong the current liquidity pulse is.
 * 
 * @param orderbook - Orderbook snapshot
 * @returns Strength (0-100)
 */
export function measurePulseStrength(orderbook: OrderbookData): number {
  if (!orderbook) {
    return 0;
  }

  // Imbalance contribution (40%)
  const imbalanceMagnitude = Math.abs(orderbook.imbalance);
  const imbalanceScore = imbalanceMagnitude * 100;

  // Depth contribution (30%)
  const totalDepth = orderbook.bidDepth + orderbook.askDepth;
  const depthScore = Math.min(totalDepth / 1000, 1) * 100; // Normalize to 1000 units

  // Liquidity score contribution (30%)
  const liquidityScore = orderbook.liquidityScore;

  // Weighted strength
  const strength =
    imbalanceScore * 0.4 + depthScore * 0.3 + liquidityScore * 0.3;

  return Math.min(strength, 100);
}

// ============================================================================
// DETECT PULSE ALIGNMENT
// ============================================================================

/**
 * detectPulseAlignment — Check if liquidity pulse aligns with signal
 * 
 * Returns true if liquidity is flowing in the same direction as the
 * intended trade signal.
 * 
 * @param pulse - Liquidity pulse data
 * @param signal - Trade signal (LONG/SHORT/NEUTRAL)
 * @returns Alignment status
 */
export function detectPulseAlignment(
  pulse: LiquidityPulse,
  signal: 'LONG' | 'SHORT' | 'NEUTRAL'
): boolean {
  if (signal === 'NEUTRAL') {
    return true; // No alignment needed
  }

  // LONG signal needs BUY liquidity pulse
  if (signal === 'LONG') {
    return pulse.direction === 'BUY' && pulse.strength >= 40;
  }

  // SHORT signal needs SELL liquidity pulse
  if (signal === 'SHORT') {
    return pulse.direction === 'SELL' && pulse.strength >= 40;
  }

  return false;
}

// ============================================================================
// CALCULATE LIQUIDITY SCORE
// ============================================================================

/**
 * calculateLiquidityScore — Calculate overall liquidity quality score
 * 
 * Combines pulse strength, coherence, and depth into single score.
 * Higher score = better liquidity conditions for execution.
 * 
 * @param pulse - Liquidity pulse data
 * @returns Liquidity score (0-100)
 */
export function calculateLiquidityScore(pulse: LiquidityPulse): number {
  let score = 0;

  // Strength contribution (40%)
  score += pulse.strength * 0.4;

  // Coherence contribution (30%)
  score += pulse.coherence * 0.3;

  // Depth contribution (30%)
  const depthScore = Math.min(pulse.depth / 1000, 1) * 100;
  score += depthScore * 0.3;

  return Math.round(score);
}

// ============================================================================
// DETECT LIQUIDITY SPIKE
// ============================================================================

/**
 * detectLiquiditySpike — Detect sudden liquidity surge
 * 
 * Identifies rapid increases in liquidity that may indicate
 * institutional activity or major market events.
 * 
 * @param currentPulse - Current liquidity pulse
 * @param previousPulse - Previous liquidity pulse
 * @returns Spike detected (boolean)
 */
export function detectLiquiditySpike(
  currentPulse: LiquidityPulse,
  previousPulse?: LiquidityPulse
): boolean {
  if (!previousPulse) {
    return false;
  }

  // Check for sudden strength increase
  const strengthIncrease = currentPulse.strength - previousPulse.strength;
  const spikeThreshold = 30; // 30 point increase

  // Check for sudden depth increase
  const depthIncrease = currentPulse.depth - previousPulse.depth;
  const depthSpikeThreshold = previousPulse.depth * 0.5; // 50% increase

  return (
    strengthIncrease > spikeThreshold ||
    depthIncrease > depthSpikeThreshold
  );
}

// ============================================================================
// DETECT LIQUIDITY DRY-UP
// ============================================================================

/**
 * detectLiquidityDryUp — Detect sudden liquidity decrease
 * 
 * Identifies rapid decreases in liquidity that may indicate
 * poor execution conditions or market uncertainty.
 * 
 * @param currentPulse - Current liquidity pulse
 * @param previousPulse - Previous liquidity pulse
 * @returns Dry-up detected (boolean)
 */
export function detectLiquidityDryUp(
  currentPulse: LiquidityPulse,
  previousPulse?: LiquidityPulse
): boolean {
  if (!previousPulse) {
    return false;
  }

  // Check for sudden strength decrease
  const strengthDecrease = previousPulse.strength - currentPulse.strength;
  const dryUpThreshold = 30; // 30 point decrease

  // Check for sudden depth decrease
  const depthDecrease = previousPulse.depth - currentPulse.depth;
  const depthDryUpThreshold = previousPulse.depth * 0.5; // 50% decrease

  // Check for low absolute liquidity
  const lowLiquidity = currentPulse.strength < 30 || currentPulse.depth < 100;

  return (
    strengthDecrease > dryUpThreshold ||
    depthDecrease > depthDryUpThreshold ||
    lowLiquidity
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateLiquidityPulse,
  detectPulseDirection,
  measurePulseStrength,
  detectPulseAlignment,
  calculateLiquidityScore,
  detectLiquiditySpike,
  detectLiquidityDryUp,
};
