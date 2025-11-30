/**
 * Pattern Rules - Dynamic Pattern Recognition Rule Definitions
 * 
 * Configurable rules for pattern detection, weighting, and analysis.
 * Rules automatically adjust based on market regime shifts.
 */

/**
 * Pattern weight configuration
 */
export interface PatternWeights {
  priceAction: number;           // Weight for price action patterns
  volumeProfile: number;          // Weight for volume patterns
  momentum: number;               // Weight for momentum patterns
  volatility: number;             // Weight for volatility patterns
  timeframe: number;              // Weight for timeframe alignment
  confluence: number;             // Weight for pattern confluence
  historicalSuccess: number;      // Weight for historical pattern success
}

/**
 * Pattern detection configuration
 */
export interface PatternConfig {
  deviationSensitivity: number;   // Sensitivity to pattern deviations (0-1)
  crossTimeframeFactor: number;   // Factor for cross-timeframe patterns (0-1)
  volatilitySignatureScore: number; // Min score for volatility signatures (0-100)
  minConfidenceThreshold: number;  // Min confidence for pattern detection (0-100)
  patternDecayRate: number;        // How fast patterns decay (0-1)
  adaptiveScaling: boolean;        // Enable adaptive weight scaling
}

/**
 * Pattern type definitions
 */
export enum PatternType {
  // Price action
  DOUBLE_TOP = 'DOUBLE_TOP',
  DOUBLE_BOTTOM = 'DOUBLE_BOTTOM',
  HEAD_SHOULDERS = 'HEAD_SHOULDERS',
  INVERSE_HEAD_SHOULDERS = 'INVERSE_HEAD_SHOULDERS',
  TRIANGLE_ASCENDING = 'TRIANGLE_ASCENDING',
  TRIANGLE_DESCENDING = 'TRIANGLE_DESCENDING',
  TRIANGLE_SYMMETRICAL = 'TRIANGLE_SYMMETRICAL',
  WEDGE_RISING = 'WEDGE_RISING',
  WEDGE_FALLING = 'WEDGE_FALLING',
  FLAG_BULL = 'FLAG_BULL',
  FLAG_BEAR = 'FLAG_BEAR',
  PENNANT = 'PENNANT',
  CUP_HANDLE = 'CUP_HANDLE',
  
  // Candlestick
  DOJI = 'DOJI',
  HAMMER = 'HAMMER',
  SHOOTING_STAR = 'SHOOTING_STAR',
  ENGULFING_BULL = 'ENGULFING_BULL',
  ENGULFING_BEAR = 'ENGULFING_BEAR',
  MORNING_STAR = 'MORNING_STAR',
  EVENING_STAR = 'EVENING_STAR',
  
  // Momentum
  DIVERGENCE_BULL = 'DIVERGENCE_BULL',
  DIVERGENCE_BEAR = 'DIVERGENCE_BEAR',
  MOMENTUM_SHIFT = 'MOMENTUM_SHIFT',
  EXHAUSTION = 'EXHAUSTION',
  
  // Volatility
  COMPRESSION = 'COMPRESSION',
  EXPANSION = 'EXPANSION',
  SQUEEZE = 'SQUEEZE',
  BREAKOUT = 'BREAKOUT',
  
  // Custom
  CUSTOM = 'CUSTOM',
}

/**
 * Pattern significance
 */
export enum PatternSignificance {
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  MAJOR = 'MAJOR',
  CRITICAL = 'CRITICAL',
}

/**
 * Default pattern weights
 */
export const DEFAULT_PATTERN_WEIGHTS: PatternWeights = {
  priceAction: 1.0,
  volumeProfile: 0.8,
  momentum: 0.9,
  volatility: 0.7,
  timeframe: 0.6,
  confluence: 1.2,
  historicalSuccess: 1.1,
};

/**
 * Default pattern configuration
 */
export const DEFAULT_PATTERN_CONFIG: PatternConfig = {
  deviationSensitivity: 0.7,
  crossTimeframeFactor: 0.8,
  volatilitySignatureScore: 60,
  minConfidenceThreshold: 55,
  patternDecayRate: 0.05,
  adaptiveScaling: true,
};

/**
 * Regime-specific pattern adjustments
 */
export const REGIME_PATTERN_ADJUSTMENTS: Record<string, Partial<PatternWeights>> = {
  STABLE: {
    priceAction: 1.2,
    momentum: 0.7,
    volatility: 0.5,
  },
  
  VOLATILE: {
    priceAction: 0.8,
    volatility: 1.5,
    momentum: 1.3,
  },
  
  TRENDING: {
    momentum: 1.4,
    priceAction: 1.1,
    timeframe: 0.9,
  },
  
  RANGING: {
    priceAction: 1.3,
    momentum: 0.6,
    volumeProfile: 1.1,
  },
  
  BREAKOUT: {
    volatility: 1.4,
    momentum: 1.3,
    confluence: 1.5,
  },
  
  CRISIS: {
    volatility: 1.8,
    priceAction: 0.5,
    momentum: 1.6,
  },
};

// Current state
let currentWeights: PatternWeights = { ...DEFAULT_PATTERN_WEIGHTS };
let currentConfig: PatternConfig = { ...DEFAULT_PATTERN_CONFIG };
let currentRegime: string = 'STABLE';

// ============================================================================
// Pattern Weighting
// ============================================================================

/**
 * Calculate pattern weight based on type and context
 */
export function calculatePatternWeight(
  patternType: PatternType,
  context: {
    timeframe?: string;
    confluence?: number;
    historicalSuccess?: number;
    volatility?: number;
  }
): number {
  let weight = 1.0;
  
  // Base weight by pattern type
  if ([
    PatternType.HEAD_SHOULDERS,
    PatternType.INVERSE_HEAD_SHOULDERS,
    PatternType.DOUBLE_TOP,
    PatternType.DOUBLE_BOTTOM,
  ].includes(patternType)) {
    weight *= currentWeights.priceAction * 1.2; // High-importance patterns
  } else if ([
    PatternType.DIVERGENCE_BULL,
    PatternType.DIVERGENCE_BEAR,
  ].includes(patternType)) {
    weight *= currentWeights.momentum * 1.3;
  } else if ([
    PatternType.COMPRESSION,
    PatternType.SQUEEZE,
    PatternType.BREAKOUT,
  ].includes(patternType)) {
    weight *= currentWeights.volatility * 1.2;
  } else {
    weight *= currentWeights.priceAction;
  }
  
  // Confluence boost
  if (context.confluence && context.confluence > 1) {
    weight *= 1 + (context.confluence - 1) * currentWeights.confluence * 0.1;
  }
  
  // Historical success boost
  if (context.historicalSuccess && context.historicalSuccess > 0.6) {
    weight *= 1 + context.historicalSuccess * currentWeights.historicalSuccess * 0.2;
  }
  
  // Volatility adjustment
  if (context.volatility) {
    const volFactor = Math.max(0.7, Math.min(1.3, context.volatility / 50));
    weight *= volFactor;
  }
  
  return weight;
}

/**
 * Calculate deviation tolerance
 */
export function calculateDeviationTolerance(patternType: PatternType): number {
  const baseTolerance = 0.05; // 5% base tolerance
  
  // Adjust based on sensitivity
  const adjustedTolerance = baseTolerance / currentConfig.deviationSensitivity;
  
  // Pattern-specific adjustments
  if ([
    PatternType.TRIANGLE_ASCENDING,
    PatternType.TRIANGLE_DESCENDING,
    PatternType.WEDGE_RISING,
    PatternType.WEDGE_FALLING,
  ].includes(patternType)) {
    return adjustedTolerance * 1.5; // More tolerance for trend-based patterns
  }
  
  if ([
    PatternType.DOJI,
    PatternType.HAMMER,
    PatternType.SHOOTING_STAR,
  ].includes(patternType)) {
    return adjustedTolerance * 0.7; // Less tolerance for candlestick patterns
  }
  
  return adjustedTolerance;
}

/**
 * Calculate cross-timeframe score
 */
export function calculateCrossTimeframeScore(
  patterns: Array<{ timeframe: string; confidence: number }>
): number {
  if (patterns.length === 0) return 0;
  if (patterns.length === 1) return patterns[0].confidence;
  
  // Weight by timeframe hierarchy
  const timeframeWeights: Record<string, number> = {
    '1m': 0.3,
    '5m': 0.5,
    '15m': 0.7,
    '1h': 1.0,
    '4h': 1.2,
    '1d': 1.5,
  };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  patterns.forEach(p => {
    const tfWeight = timeframeWeights[p.timeframe] || 1.0;
    weightedSum += p.confidence * tfWeight;
    totalWeight += tfWeight;
  });
  
  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Apply cross-timeframe factor
  const confluenceBonus = (patterns.length - 1) * currentConfig.crossTimeframeFactor * 10;
  
  return Math.min(100, baseScore + confluenceBonus);
}

/**
 * Calculate volatility signature score
 */
export function calculateVolatilitySignature(
  currentVol: number,
  recentVolHistory: number[]
): number {
  if (recentVolHistory.length < 3) return 0;
  
  const avgVol = recentVolHistory.reduce((sum, v) => sum + v, 0) / recentVolHistory.length;
  const stdDev = Math.sqrt(
    recentVolHistory.reduce((sum, v) => sum + Math.pow(v - avgVol, 2), 0) / recentVolHistory.length
  );
  
  // Z-score
  const zScore = stdDev > 0 ? Math.abs((currentVol - avgVol) / stdDev) : 0;
  
  // Convert to 0-100 score
  const score = Math.min(100, zScore * 20);
  
  return score;
}

// ============================================================================
// Pattern Significance
// ============================================================================

/**
 * Determine pattern significance
 */
export function determineSignificance(
  patternType: PatternType,
  confidence: number,
  weight: number
): PatternSignificance {
  const combinedScore = confidence * weight;
  
  if (combinedScore >= 80 && [
    PatternType.HEAD_SHOULDERS,
    PatternType.DOUBLE_TOP,
    PatternType.DOUBLE_BOTTOM,
    PatternType.BREAKOUT,
  ].includes(patternType)) {
    return PatternSignificance.CRITICAL;
  }
  
  if (combinedScore >= 70) {
    return PatternSignificance.MAJOR;
  }
  
  if (combinedScore >= 50) {
    return PatternSignificance.MODERATE;
  }
  
  return PatternSignificance.MINOR;
}

/**
 * Get significance multiplier
 */
export function getSignificanceMultiplier(significance: PatternSignificance): number {
  const multipliers = {
    [PatternSignificance.MINOR]: 1.0,
    [PatternSignificance.MODERATE]: 1.3,
    [PatternSignificance.MAJOR]: 1.6,
    [PatternSignificance.CRITICAL]: 2.0,
  };
  
  return multipliers[significance];
}

// ============================================================================
// Regime Management
// ============================================================================

/**
 * Set current regime
 */
export function setCurrentRegime(regime: string): void {
  currentRegime = regime;
  applyRegimeAdjustments(regime);
  console.log(`[Pattern Rules] Regime set to: ${regime}`);
}

/**
 * Get current regime
 */
export function getCurrentRegime(): string {
  return currentRegime;
}

/**
 * Apply regime-specific adjustments
 */
function applyRegimeAdjustments(regime: string): void {
  const adjustments = REGIME_PATTERN_ADJUSTMENTS[regime];
  
  if (adjustments) {
    currentWeights = {
      ...DEFAULT_PATTERN_WEIGHTS,
      ...adjustments,
    };
    
    console.log(`[Pattern Rules] Applied adjustments for regime: ${regime}`);
  }
}

// ============================================================================
// Weight Management
// ============================================================================

/**
 * Get current pattern weights
 */
export function getPatternWeights(): PatternWeights {
  return { ...currentWeights };
}

/**
 * Get current pattern config
 */
export function getPatternConfig(): PatternConfig {
  return { ...currentConfig };
}

/**
 * Update pattern weights
 */
export function updatePatternWeights(weights: Partial<PatternWeights>): void {
  currentWeights = { ...currentWeights, ...weights };
  console.log('[Pattern Rules] Updated pattern weights:', weights);
}

/**
 * Update pattern config
 */
export function updatePatternConfig(config: Partial<PatternConfig>): void {
  currentConfig = { ...currentConfig, ...config };
  console.log('[Pattern Rules] Updated pattern config:', config);
}

/**
 * Adjust weight by factor
 */
export function adjustPatternWeight(key: keyof PatternWeights, factor: number): void {
  currentWeights[key] *= factor;
  console.log(`[Pattern Rules] Adjusted weight '${key}' by ${factor} to ${currentWeights[key]}`);
}

// ============================================================================
// Pattern Validation
// ============================================================================

/**
 * Validate pattern confidence
 */
export function validatePatternConfidence(confidence: number): boolean {
  return confidence >= currentConfig.minConfidenceThreshold;
}

/**
 * Validate volatility signature
 */
export function validateVolatilitySignature(score: number): boolean {
  return score >= currentConfig.volatilitySignatureScore;
}

/**
 * Calculate pattern decay
 */
export function calculatePatternDecay(age: number): number {
  // Age in milliseconds
  const hours = age / (1000 * 60 * 60);
  return Math.exp(-currentConfig.patternDecayRate * hours);
}

// ============================================================================
// Shield/Threat Adjustments
// ============================================================================

/**
 * Adjust for shield state
 */
export function adjustForShield(shieldActive: boolean): void {
  if (shieldActive) {
    // Increase sensitivity to bearish patterns
    currentConfig.deviationSensitivity *= 1.2;
    
    console.log('[Pattern Rules] Adjusted for shield activation');
  } else {
    // Restore normal sensitivity
    currentConfig.deviationSensitivity = DEFAULT_PATTERN_CONFIG.deviationSensitivity;
    
    console.log('[Pattern Rules] Adjusted for shield deactivation');
  }
}

/**
 * Adjust for threat level
 */
export function adjustForThreatLevel(threatLevel: number): void {
  if (threatLevel > 80) {
    // High threat: prioritize volatility patterns
    currentWeights.volatility *= 1.5;
    currentWeights.priceAction *= 0.8;
    
    console.log('[Pattern Rules] Adjusted for high threat level');
  } else if (threatLevel < 30) {
    // Low threat: restore normal weights
    currentWeights = { ...DEFAULT_PATTERN_WEIGHTS };
    
    console.log('[Pattern Rules] Adjusted for low threat level');
  }
}

/**
 * Adjust for volatility
 */
export function adjustForVolatility(volatilityLevel: number): void {
  if (volatilityLevel > 80) {
    // High volatility: increase signature score threshold
    currentConfig.volatilitySignatureScore = Math.min(80, currentConfig.volatilitySignatureScore * 1.2);
    
    console.log('[Pattern Rules] Adjusted for high volatility');
  } else if (volatilityLevel < 30) {
    // Low volatility: decrease threshold
    currentConfig.volatilitySignatureScore = DEFAULT_PATTERN_CONFIG.volatilitySignatureScore;
    
    console.log('[Pattern Rules] Adjusted for low volatility');
  }
}

// ============================================================================
// Reset & Export
// ============================================================================

/**
 * Reset to defaults
 */
export function resetToDefaults(): void {
  currentWeights = { ...DEFAULT_PATTERN_WEIGHTS };
  currentConfig = { ...DEFAULT_PATTERN_CONFIG };
  currentRegime = 'STABLE';
  
  console.log('[Pattern Rules] Reset to default values');
}

/**
 * Export state
 */
export function exportRulesState() {
  return {
    weights: currentWeights,
    config: currentConfig,
    regime: currentRegime,
  };
}

/**
 * Import state
 */
export function importRulesState(state: any): void {
  if (state.weights) {
    currentWeights = state.weights;
  }
  if (state.config) {
    currentConfig = state.config;
  }
  if (state.regime) {
    currentRegime = state.regime;
  }
  
  console.log('[Pattern Rules] Imported state');
}

// Export rules object
export const PatternRules = {
  // Pattern weighting
  calculateWeight: calculatePatternWeight,
  calculateDeviation: calculateDeviationTolerance,
  calculateCrossTimeframe: calculateCrossTimeframeScore,
  calculateVolSignature: calculateVolatilitySignature,
  
  // Significance
  determineSignificance,
  getSignificanceMultiplier,
  
  // Regime management
  setRegime: setCurrentRegime,
  getRegime: getCurrentRegime,
  
  // Weight management
  getWeights: getPatternWeights,
  getConfig: getPatternConfig,
  updateWeights: updatePatternWeights,
  updateConfig: updatePatternConfig,
  adjustWeight: adjustPatternWeight,
  
  // Validation
  validateConfidence: validatePatternConfidence,
  validateVolSignature: validateVolatilitySignature,
  calculateDecay: calculatePatternDecay,
  
  // Shield/Threat adjustments
  adjustForShield,
  adjustForThreatLevel,
  adjustForVolatility,
  
  // Reset & export
  reset: resetToDefaults,
  export: exportRulesState,
  import: importRulesState,
  
  // Constants
  DEFAULT_WEIGHTS: DEFAULT_PATTERN_WEIGHTS,
  DEFAULT_CONFIG: DEFAULT_PATTERN_CONFIG,
  REGIME_ADJUSTMENTS: REGIME_PATTERN_ADJUSTMENTS,
  PatternType,
  PatternSignificance,
};

export default PatternRules;
