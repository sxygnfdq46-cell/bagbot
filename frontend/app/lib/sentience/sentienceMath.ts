/**
 * Sentience Math - Mathematical Formulas for Market Sentience
 * 
 * Advanced mathematical functions for computing market sentience metrics.
 * Includes tension, liquidity flow, emotional momentum, volatility entropy, and pressure surge calculations.
 */

/**
 * Market tension formula
 * Measures the stress between price action and volume dynamics
 * 
 * @param priceChange - Recent price change percentage
 * @param volumeRatio - Current volume / average volume
 * @param volatility - Current volatility level (0-100)
 * @param spreadDeviation - Bid-ask spread deviation from normal
 * @returns Tension score (0-100)
 */
export function tensionFormula(
  priceChange: number,
  volumeRatio: number,
  volatility: number,
  spreadDeviation: number
): number {
  // Base tension from price-volume divergence
  const priceVolumeDivergence = Math.abs(priceChange) * (1 / Math.max(0.1, volumeRatio));
  
  // Volatility component (normalized)
  const volatilityComponent = volatility / 100;
  
  // Spread stress (wider spreads = more tension)
  const spreadStress = Math.min(1, Math.abs(spreadDeviation) / 5);
  
  // Combined tension with weighted components
  const rawTension = (
    priceVolumeDivergence * 0.4 +
    volatilityComponent * 0.3 +
    spreadStress * 0.3
  ) * 100;
  
  // Apply sigmoid transformation for smoothing
  const tension = 100 / (1 + Math.exp(-(rawTension - 50) / 15));
  
  return Math.max(0, Math.min(100, tension));
}

/**
 * Liquidity flow variance
 * Measures instability in liquidity provision
 * 
 * @param liquidityLevels - Array of recent liquidity levels
 * @param volumeProfile - Array of recent volume data
 * @param orderBookDepth - Current order book depth
 * @param marketImpact - Estimated market impact of standard order
 * @returns Variance score (0-100)
 */
export function liquidityFlowVariance(
  liquidityLevels: number[],
  volumeProfile: number[],
  orderBookDepth: number,
  marketImpact: number
): number {
  if (liquidityLevels.length < 2) {
    return 50; // Neutral when insufficient data
  }
  
  // Calculate variance of liquidity levels
  const mean = liquidityLevels.reduce((sum, val) => sum + val, 0) / liquidityLevels.length;
  const variance = liquidityLevels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / liquidityLevels.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? (stdDev / mean) : 0;
  
  // Volume profile instability
  const volumeMean = volumeProfile.reduce((sum, val) => sum + val, 0) / volumeProfile.length;
  const volumeVariance = volumeProfile.reduce((sum, val) => sum + Math.pow(val - volumeMean, 2), 0) / volumeProfile.length;
  const volumeCV = volumeMean > 0 ? (Math.sqrt(volumeVariance) / volumeMean) : 0;
  
  // Order book depth score (shallow = higher variance)
  const depthScore = Math.max(0, 1 - (orderBookDepth / 100));
  
  // Market impact score (higher impact = higher variance)
  const impactScore = Math.min(1, marketImpact / 10);
  
  // Combined variance with exponential scaling
  const rawVariance = (
    coefficientOfVariation * 40 +
    volumeCV * 30 +
    depthScore * 15 +
    impactScore * 15
  );
  
  return Math.max(0, Math.min(100, rawVariance * 100));
}

/**
 * Emotional momentum score
 * Quantifies market "emotion" through momentum and volatility patterns
 * 
 * @param momentum - Current momentum value
 * @param momentumAcceleration - Rate of momentum change
 * @param volatilityTrend - Volatility trend direction (-1 to 1)
 * @param volumeEmotionalSignal - Volume-based emotional indicator
 * @returns Emotional score (-100 to 100, negative = fear, positive = greed)
 */
export function emotionalMomentumScore(
  momentum: number,
  momentumAcceleration: number,
  volatilityTrend: number,
  volumeEmotionalSignal: number
): number {
  // Momentum component (normalized)
  const momentumComponent = Math.tanh(momentum / 50) * 40;
  
  // Acceleration amplifier (rapid changes = stronger emotion)
  const accelerationAmplifier = 1 + Math.min(1, Math.abs(momentumAcceleration) / 20);
  
  // Volatility context (rising vol with momentum = greed, rising vol against momentum = fear)
  const volatilityContext = momentum * volatilityTrend * 20;
  
  // Volume emotional signal (e.g., panic selling, FOMO buying)
  const volumeComponent = volumeEmotionalSignal * 25;
  
  // Combined emotional score
  const rawEmotion = (
    momentumComponent * accelerationAmplifier +
    volatilityContext +
    volumeComponent
  );
  
  // Apply dampening for extreme values
  const emotion = Math.tanh(rawEmotion / 70) * 100;
  
  return Math.max(-100, Math.min(100, emotion));
}

/**
 * Volatility entropy
 * Measures disorder/unpredictability in volatility patterns
 * Higher entropy = more chaotic, less predictable market
 * 
 * @param volatilityHistory - Array of recent volatility values
 * @param priceReturns - Array of recent price returns
 * @param regimeStability - Current regime stability (0-100)
 * @returns Entropy score (0-100)
 */
export function volatilityEntropy(
  volatilityHistory: number[],
  priceReturns: number[],
  regimeStability: number
): number {
  if (volatilityHistory.length < 5) {
    return 50; // Neutral when insufficient data
  }
  
  // Calculate Shannon entropy of volatility distribution
  const buckets = 10;
  const minVol = Math.min(...volatilityHistory);
  const maxVol = Math.max(...volatilityHistory);
  const range = maxVol - minVol || 1;
  const bucketSize = range / buckets;
  
  const distribution = new Array(buckets).fill(0);
  volatilityHistory.forEach(vol => {
    const bucketIndex = Math.min(buckets - 1, Math.floor((vol - minVol) / bucketSize));
    distribution[bucketIndex]++;
  });
  
  const total = volatilityHistory.length;
  let entropy = 0;
  distribution.forEach(count => {
    if (count > 0) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }
  });
  
  // Normalize entropy (max entropy for 10 buckets is log2(10) ≈ 3.32)
  const normalizedEntropy = entropy / Math.log2(buckets);
  
  // Price return unpredictability (coefficient of variation)
  const returnMean = priceReturns.reduce((sum, val) => sum + val, 0) / priceReturns.length;
  const returnVariance = priceReturns.reduce((sum, val) => sum + Math.pow(val - returnMean, 2), 0) / priceReturns.length;
  const returnCV = Math.abs(returnMean) > 0.01 ? (Math.sqrt(returnVariance) / Math.abs(returnMean)) : Math.sqrt(returnVariance);
  const unpredictability = Math.min(1, returnCV / 5);
  
  // Regime instability component (inverse of stability)
  const regimeInstability = (100 - regimeStability) / 100;
  
  // Combined entropy score
  const entropyScore = (
    normalizedEntropy * 50 +
    unpredictability * 30 +
    regimeInstability * 20
  ) * 100;
  
  return Math.max(0, Math.min(100, entropyScore));
}

/**
 * Pressure surge probability
 * Calculates likelihood of sudden pressure event (breakout, breakdown, or volatility spike)
 * 
 * @param compressionLevel - Market compression level (0-100)
 * @param volumeBuildup - Volume accumulation indicator (0-100)
 * @param patternTension - Pattern-based tension (0-100)
 * @param timeCompression - Time since last major move (normalized)
 * @param triggerProximity - Distance to key technical levels (0-1, closer = higher)
 * @returns Surge probability (0-100)
 */
export function pressureSurgeProbability(
  compressionLevel: number,
  volumeBuildup: number,
  patternTension: number,
  timeCompression: number,
  triggerProximity: number
): number {
  // Compression component (coiled spring effect)
  // Higher compression = higher probability
  const compressionFactor = Math.pow(compressionLevel / 100, 1.5);
  
  // Volume buildup (accumulation before surge)
  const volumeFactor = volumeBuildup / 100;
  
  // Pattern tension (technical setup quality)
  const patternFactor = patternTension / 100;
  
  // Time compression (pressure builds over time)
  // Use exponential curve - probability increases faster as time progresses
  const timeFactor = 1 - Math.exp(-timeCompression * 2);
  
  // Trigger proximity (near key levels = higher probability)
  const triggerFactor = Math.pow(triggerProximity, 0.8);
  
  // Combined probability with weighted factors
  const rawProbability = (
    compressionFactor * 0.30 +
    volumeFactor * 0.25 +
    patternFactor * 0.20 +
    timeFactor * 0.15 +
    triggerFactor * 0.10
  );
  
  // Apply sigmoid transformation for realistic probability curve
  const probability = 100 / (1 + Math.exp(-(rawProbability * 10 - 5)));
  
  return Math.max(0, Math.min(100, probability));
}

/**
 * Calculate market coherence
 * Measures how "aligned" different market components are
 * 
 * @param priceAction - Price momentum direction (-1 to 1)
 * @param volumeTrend - Volume trend direction (-1 to 1)
 * @param volatilityTrend - Volatility trend direction (-1 to 1)
 * @param orderFlowBalance - Order flow balance (-1 to 1)
 * @returns Coherence score (0-100)
 */
export function calculateCoherence(
  priceAction: number,
  volumeTrend: number,
  volatilityTrend: number,
  orderFlowBalance: number
): number {
  // Calculate pairwise correlations
  const priceVolCorr = priceAction * volumeTrend;
  const priceVolatCorr = Math.abs(priceAction) * volatilityTrend;
  const volumeOrderCorr = volumeTrend * orderFlowBalance;
  
  // Average correlation (transform from [-1,1] to [0,1])
  const avgCorrelation = (
    (priceVolCorr + 1) / 2 * 0.35 +
    (priceVolatCorr + 1) / 2 * 0.30 +
    (volumeOrderCorr + 1) / 2 * 0.35
  );
  
  return avgCorrelation * 100;
}

/**
 * Calculate market fragility
 * Measures how susceptible the market is to sudden moves
 * 
 * @param liquidityDepth - Order book depth (0-100)
 * @param volatilityLevel - Current volatility (0-100)
 * @param recentShocks - Number of recent shock events
 * @param trendStrength - Current trend strength (0-100)
 * @returns Fragility score (0-100)
 */
export function calculateFragility(
  liquidityDepth: number,
  volatilityLevel: number,
  recentShocks: number,
  trendStrength: number
): number {
  // Shallow liquidity = high fragility
  const liquidityFactor = (100 - liquidityDepth) / 100;
  
  // High volatility = high fragility
  const volatilityFactor = volatilityLevel / 100;
  
  // Recent shocks increase fragility (with diminishing returns)
  const shockFactor = Math.min(1, recentShocks / 5);
  
  // Weak trends = more fragile (directional conviction reduces fragility)
  const trendFactor = (100 - trendStrength) / 100;
  
  const fragility = (
    liquidityFactor * 0.35 +
    volatilityFactor * 0.30 +
    shockFactor * 0.20 +
    trendFactor * 0.15
  ) * 100;
  
  return Math.max(0, Math.min(100, fragility));
}

/**
 * Calculate emotional oscillator
 * Tracks fear/greed oscillations in the market
 * 
 * @param emotionalHistory - Array of recent emotional momentum scores
 * @returns Oscillator reading { value: -100 to 100, extreme: boolean, reversal: boolean }
 */
export function calculateEmotionalOscillator(
  emotionalHistory: number[]
): { value: number; extreme: boolean; reversal: boolean } {
  if (emotionalHistory.length < 3) {
    return { value: 0, extreme: false, reversal: false };
  }
  
  // Current emotional state
  const current = emotionalHistory[emotionalHistory.length - 1];
  
  // Calculate rate of change
  const previous = emotionalHistory[emotionalHistory.length - 2];
  const rateOfChange = current - previous;
  
  // Check for extremes (oversold/overbought)
  const extreme = Math.abs(current) > 75;
  
  // Check for reversal (emotion turning)
  let reversal = false;
  if (emotionalHistory.length >= 5) {
    const recent = emotionalHistory.slice(-5);
    const firstHalf = recent.slice(0, 3).reduce((sum, val) => sum + val, 0) / 3;
    const secondHalf = recent.slice(2).reduce((sum, val) => sum + val, 0) / 3;
    
    // Reversal if direction changed and magnitude is significant
    if (firstHalf * secondHalf < 0 && Math.abs(firstHalf - secondHalf) > 30) {
      reversal = true;
    }
  }
  
  // Apply exponential moving average for smoothing
  const smoothed = emotionalHistory.length > 1
    ? emotionalHistory.reduce((sum, val, idx) => {
        const weight = Math.exp(-0.3 * (emotionalHistory.length - 1 - idx));
        return sum + val * weight;
      }, 0) / emotionalHistory.reduce((sum, _, idx) => {
        return sum + Math.exp(-0.3 * (emotionalHistory.length - 1 - idx));
      }, 0)
    : current;
  
  return {
    value: Math.max(-100, Math.min(100, smoothed)),
    extreme,
    reversal,
  };
}

/**
 * Calculate stress gradient
 * Measures rate of stress buildup or release
 * 
 * @param stressHistory - Array of recent stress levels
 * @returns Gradient { value: rate of change, accelerating: boolean, critical: boolean }
 */
export function calculateStressGradient(
  stressHistory: number[]
): { value: number; accelerating: boolean; critical: boolean } {
  if (stressHistory.length < 3) {
    return { value: 0, accelerating: false, critical: false };
  }
  
  // Calculate first derivative (rate of change)
  const recent = stressHistory.slice(-3);
  const gradient = (recent[2] - recent[0]) / 2;
  
  // Calculate second derivative (acceleration)
  let acceleration = 0;
  let accelerating = false;
  if (stressHistory.length >= 5) {
    const olderGradient = (stressHistory[stressHistory.length - 3] - stressHistory[stressHistory.length - 5]) / 2;
    acceleration = gradient - olderGradient;
    accelerating = Math.abs(acceleration) > 2;
  }
  
  // Critical if stress is high AND rising quickly
  const currentStress = stressHistory[stressHistory.length - 1];
  const critical = currentStress > 70 && gradient > 5;
  
  return {
    value: gradient,
    accelerating,
    critical,
  };
}

// Export all functions
export const SentienceMath = {
  tensionFormula,
  liquidityFlowVariance,
  emotionalMomentumScore,
  volatilityEntropy,
  pressureSurgeProbability,
  calculateCoherence,
  calculateFragility,
  calculateEmotionalOscillator,
  calculateStressGradient,
};

export default SentienceMath;
