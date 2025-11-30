/**
 * ⏰ EAE RHYTHM — Market Rhythm Analysis
 * 
 * STEP 24.38 — Market Rhythm Functions
 * 
 * Purpose:
 * Analyze market rhythm patterns to identify optimal execution timing.
 * Detects market "heartbeat", micro-cycles, and volatility waves.
 * 
 * Think of this as reading the market's pulse - understanding its natural
 * rhythm helps time entries at optimal moments (expansion phases, low volatility).
 */

import type {
  RhythmData,
  MarketHeartbeat,
  MicroCycle,
  VolatilityWave,
  CandleData,
  EAEContext,
} from './types';

// ============================================================================
// CALCULATE MARKET HEARTBEAT
// ============================================================================

/**
 * calculateMarketHeartbeat — Calculate market's rhythmic heartbeat
 * 
 * Analyzes recent candles to detect regular price oscillation patterns.
 * The "heartbeat" represents the average cycle time between price movements.
 * 
 * @param candles - Recent candle data (minimum 10 candles)
 * @returns Market heartbeat data
 */
export function calculateMarketHeartbeat(candles: CandleData[]): MarketHeartbeat {
  if (candles.length < 10) {
    return {
      bpm: 0,
      interval: 0,
      variance: 1,
      strength: 0,
      lastBeat: Date.now(),
      nextExpectedBeat: Date.now() + 60000,
    };
  }

  // Detect peaks and troughs (direction changes)
  const beats: number[] = [];
  let lastDirection = candles[0].direction;

  for (let i = 1; i < candles.length; i++) {
    const currentDirection = candles[i].direction;

    // Direction change = beat
    if (currentDirection !== lastDirection && currentDirection !== 'NEUTRAL') {
      beats.push(candles[i].timestamp);
      lastDirection = currentDirection;
    }
  }

  if (beats.length < 2) {
    return {
      bpm: 0,
      interval: 0,
      variance: 1,
      strength: 0,
      lastBeat: Date.now(),
      nextExpectedBeat: Date.now() + 60000,
    };
  }

  // Calculate intervals between beats
  const intervals: number[] = [];
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i] - beats[i - 1]);
  }

  // Average interval
  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

  // Calculate variance (how regular is the heartbeat)
  const variance =
    intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) /
    intervals.length;
  const stdDev = Math.sqrt(variance);
  const normalizedVariance = Math.min(stdDev / avgInterval, 1); // 0 = perfect, 1 = chaotic

  // Convert to BPM (beats per minute)
  const bpm = avgInterval > 0 ? (60000 / avgInterval) : 0;

  // Strength based on regularity and frequency
  const regularityScore = (1 - normalizedVariance) * 100;
  const frequencyScore = Math.min(bpm / 10, 1) * 100; // Optimal ~10 BPM
  const strength = (regularityScore * 0.6 + frequencyScore * 0.4);

  const lastBeat = beats[beats.length - 1];
  const nextExpectedBeat = lastBeat + avgInterval;

  return {
    bpm: Math.round(bpm * 10) / 10,
    interval: Math.round(avgInterval),
    variance: Math.round(normalizedVariance * 100) / 100,
    strength: Math.round(strength),
    lastBeat,
    nextExpectedBeat,
  };
}

// ============================================================================
// DETECT MICRO CYCLES
// ============================================================================

/**
 * detectMicroCycles — Detect short-term price cycles
 * 
 * Identifies oscillation patterns in recent price action.
 * Micro-cycles help predict when price is likely to reverse or continue.
 * 
 * @param candles - Recent candle data (minimum 5 candles)
 * @returns Array of detected micro-cycles
 */
export function detectMicroCycles(candles: CandleData[]): MicroCycle[] {
  if (candles.length < 5) {
    return [];
  }

  const cycles: MicroCycle[] = [];
  let cycleStart: CandleData | null = null;
  let cycleDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
  let cycleHigh = -Infinity;
  let cycleLow = Infinity;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];

    // Update range
    cycleHigh = Math.max(cycleHigh, candle.high);
    cycleLow = Math.min(cycleLow, candle.low);

    // Detect cycle start
    if (!cycleStart) {
      cycleStart = candle;
      cycleDirection = candle.direction;
      continue;
    }

    // Detect direction change (cycle end)
    if (
      candle.direction !== 'NEUTRAL' &&
      candle.direction !== cycleDirection &&
      i - candles.indexOf(cycleStart) >= 2
    ) {
      // Close current cycle
      const duration = candle.timestamp - cycleStart.timestamp;
      const amplitude = cycleHigh - cycleLow;

      // Calculate confidence based on cycle clarity
      const bodyStrength = candles
        .slice(candles.indexOf(cycleStart), i)
        .reduce((sum, c) => sum + c.bodyPercent, 0) / (i - candles.indexOf(cycleStart));

      const confidence = Math.min(bodyStrength, 100);

      cycles.push({
        startTime: cycleStart.timestamp,
        endTime: candle.timestamp,
        duration,
        amplitude,
        direction: cycleDirection,
        confidence: Math.round(confidence),
      });

      // Start new cycle
      cycleStart = candle;
      cycleDirection = candle.direction;
      cycleHigh = candle.high;
      cycleLow = candle.low;
    }
  }

  return cycles;
}

// ============================================================================
// DETECT VOLATILITY WAVES
// ============================================================================

/**
 * detectVolatilityWaves — Detect volatility oscillation patterns
 * 
 * Analyzes volatility changes over time to identify waves.
 * Trading during volatility troughs is often safer.
 * 
 * @param context - EAE context with market data
 * @returns Array of volatility waves
 */
export function detectVolatilityWaves(context: EAEContext): VolatilityWave[] {
  const candles = context.candleData;

  if (!candles || candles.length < 10) {
    return [];
  }

  // Calculate volatility for each candle (high - low)
  const volatilities = candles.map((c) => ({
    timestamp: c.timestamp,
    volatility: c.high - c.low,
  }));

  // Detect peaks and troughs
  const waves: VolatilityWave[] = [];
  let waveStart: typeof volatilities[0] | null = null;
  let wavePeak: typeof volatilities[0] | null = null;
  let phase: 'RISING' | 'PEAK' | 'FALLING' | 'TROUGH' = 'RISING';

  for (let i = 1; i < volatilities.length - 1; i++) {
    const prev = volatilities[i - 1];
    const curr = volatilities[i];
    const next = volatilities[i + 1];

    // Detect peak (local maximum)
    if (curr.volatility > prev.volatility && curr.volatility > next.volatility) {
      if (!wavePeak) {
        waveStart = waveStart || prev;
        wavePeak = curr;
        phase = 'PEAK';
      }
    }

    // Detect trough (local minimum)
    if (
      curr.volatility < prev.volatility &&
      curr.volatility < next.volatility &&
      wavePeak
    ) {
      // Complete wave
      waves.push({
        startTime: waveStart?.timestamp || wavePeak.timestamp,
        peakTime: wavePeak.timestamp,
        endTime: curr.timestamp,
        peakVolatility: wavePeak.volatility,
        currentVolatility: curr.volatility,
        phase: 'TROUGH',
      });

      // Reset for next wave
      waveStart = curr;
      wavePeak = null;
      phase = 'RISING';
    }
  }

  return waves;
}

// ============================================================================
// CALCULATE RHYTHM SCORE
// ============================================================================

/**
 * calculateRhythmScore — Calculate overall rhythm quality score
 * 
 * Combines heartbeat, micro-cycles, and volatility waves into single score.
 * Higher score = more predictable market rhythm.
 * 
 * @param rhythmData - Rhythm analysis data
 * @returns Rhythm score (0-100)
 */
export function calculateRhythmScore(rhythmData: RhythmData): number {
  let score = 0;

  // Heartbeat contribution (40%)
  const heartbeatScore = rhythmData.heartbeat > 0 ? rhythmData.rhythmScore : 0;
  score += heartbeatScore * 0.4;

  // Micro-cycle contribution (30%)
  const avgCycleConfidence =
    rhythmData.microCycles.length > 0
      ? rhythmData.microCycles.reduce((sum, c) => sum + c.confidence, 0) /
        rhythmData.microCycles.length
      : 0;
  score += avgCycleConfidence * 0.3;

  // Volatility wave contribution (30%)
  const volatilityStability =
    rhythmData.volatilityWaves.length > 0
      ? 100 - Math.min(rhythmData.volatilityWaves.length * 10, 100)
      : 50;
  score += volatilityStability * 0.3;

  return Math.round(score);
}

// ============================================================================
// DETECT RHYTHM ALIGNMENT
// ============================================================================

/**
 * detectRhythmAlignment — Check if current moment aligns with rhythm
 * 
 * Returns true if we're at an optimal point in the market rhythm.
 * (e.g., near expected beat, in expansion phase, low volatility)
 * 
 * @param rhythmData - Rhythm analysis data
 * @returns Alignment status
 */
export function detectRhythmAlignment(rhythmData: RhythmData): boolean {
  const now = Date.now();

  // Check if near expected pulse
  const timeSincePulse = now - rhythmData.lastPulse;
  const timeToNextPulse = rhythmData.nextExpectedPulse - now;
  const nearPulse = Math.abs(timeToNextPulse) < rhythmData.heartbeat * 0.2; // Within 20% of expected

  // Check phase
  const favorablePhase =
    rhythmData.currentPhase === 'EXPANSION' ||
    (rhythmData.currentPhase === 'NEUTRAL' && rhythmData.phaseStrength < 30);

  // Check rhythm quality
  const goodRhythm = rhythmData.rhythmScore >= 60;

  return nearPulse && favorablePhase && goodRhythm;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateMarketHeartbeat,
  detectMicroCycles,
  detectVolatilityWaves,
  calculateRhythmScore,
  detectRhythmAlignment,
};
