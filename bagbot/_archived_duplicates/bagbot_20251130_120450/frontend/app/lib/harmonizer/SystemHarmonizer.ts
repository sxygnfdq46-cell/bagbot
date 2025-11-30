/**
 * 🧠 SYSTEM HARMONIZER — The Central Judge of All Trading Intelligence
 * 
 * STEP 24.25 — The brain that unifies all BagBot engines
 * 
 * This is the most critical file in the entire BagBot architecture.
 * It combines outputs from ALL engines into ONE unified, final decision.
 * 
 * Responsibilities:
 * - Import all major engine outputs
 * - Normalize signals across different scales
 * - Score threat, stability, volatility, and opportunity
 * - Combine them using weighted fusion
 * - Produce a final unified decision
 * - Include logging hooks for the Shield Network
 * - Include safe-mode and override failsafes
 * - Export a class SystemHarmonizer with a harmonize() method
 * - Return a final object: { action, confidence, reason, safety }
 * 
 * TypeScript, well-commented, modular, and extendable.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Input from Fusion Engine
 */
export interface FusionInput {
  fusionScore: number;           // 0-100
  signal: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;            // 0-1
  intelligenceScore: number;     // 0-100
  technicalScore: number;        // 0-100
  volatility: number;            // 0-100
}

/**
 * Input from Shield Network
 */
export interface ShieldInput {
  shieldHealth: number;          // 0-100
  stabilityScore: number;        // 0-100
  riskLevel: number;             // 0-100
  cascadeRisk: number;           // 0-1
  threatLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  activeThreats: number;
}

/**
 * Input from Strategy Engine
 */
export interface StrategyInput {
  strategyMode: string;          // e.g., "AGGRESSIVE", "BALANCED", "DEFENSIVE"
  opportunityScore: number;      // 0-100
  recommendedAction: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  positionSizing: number;        // 0-1 (percentage of capital)
}

/**
 * Input from Prediction Horizon
 */
export interface PredictionInput {
  shortTermRisk: number;         // 0-100
  mediumTermOpportunity: number; // 0-100
  longTermTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  forecastConfidence: number;    // 0-1
}

/**
 * Input from Threat Cluster Engine
 */
export interface ThreatInput {
  totalThreats: number;
  criticalCount: number;
  highCount: number;
  clusterSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatVector: string[];        // List of threat types detected
}

/**
 * Input from Root Cause Analysis
 */
export interface RootCauseInput {
  primaryCauses: string[];
  secondaryCauses: string[];
  systemicIssue: boolean;
  confidence: number;            // 0-1
}

/**
 * Input from Correlation Matrix
 */
export interface CorrelationInput {
  marketCorrelation: number;     // -1 to 1
  assetCorrelation: number;      // -1 to 1
  volatilitySync: number;        // 0-1
  divergenceDetected: boolean;
}

/**
 * Input from Volatility Shield
 */
export interface VolatilityInput {
  currentVolatility: number;     // 0-100
  volatilityTrend: 'RISING' | 'FALLING' | 'STABLE';
  shockRisk: number;             // 0-100
  stabilizationActive: boolean;
}

/**
 * Input from Stabilizers
 */
export interface StabilizerInput {
  smoothingFactor: number;       // 0-1
  noiseReduction: number;        // 0-1
  confidenceBoost: number;       // 0-1
  stable: boolean;
}

/**
 * Combined input for harmonization
 */
export interface HarmonizationInput {
  fusion: FusionInput;
  shield: ShieldInput;
  strategy: StrategyInput;
  prediction: PredictionInput;
  threats: ThreatInput;
  rootCause: RootCauseInput;
  correlation: CorrelationInput;
  volatility: VolatilityInput;
  stabilizer: StabilizerInput;
  timestamp?: number;
}

/**
 * Final harmonized decision output
 */
export interface HarmonizedDecision {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;            // 0-100
  reason: string;
  safety: SafetyOverride;
  components: ComponentScores;
  metadata: DecisionMetadata;
}

/**
 * Safety override information
 */
export interface SafetyOverride {
  safeModeActive: boolean;
  overrideReason?: string;
  blockedBy?: string;            // Which engine forced override
  allowedActions: string[];      // What actions are permitted
}

/**
 * Individual component scores for debugging
 */
export interface ComponentScores {
  fusionScore: number;           // 0-100
  shieldScore: number;           // 0-100
  strategyScore: number;         // 0-100
  predictionScore: number;       // 0-100
  threatScore: number;           // 0-100 (lower is better)
  stabilityScore: number;        // 0-100
  volatilityScore: number;       // 0-100
  correlationScore: number;      // 0-100
  finalScore: number;            // Weighted combination
}

/**
 * Decision metadata for logging and analysis
 */
export interface DecisionMetadata {
  timestamp: number;
  processingTime: number;        // milliseconds
  engineVersions: {
    fusion: string;
    shield: string;
    strategy: string;
  };
  warnings: string[];
  debugInfo?: any;
}

// ============================================================================
// SYSTEM HARMONIZER CLASS
// ============================================================================

export class SystemHarmonizer {
  // Configuration weights for each engine (must sum to 1.0)
  private weights = {
    fusion: 0.30,          // Core intelligence fusion
    shield: 0.25,          // Shield network health
    strategy: 0.20,        // Strategic opportunity
    prediction: 0.10,      // Future forecasting
    threats: 0.10,         // Threat mitigation (inverted)
    stability: 0.05,       // Overall stability
  };

  // Safety thresholds
  private readonly SAFETY_THRESHOLDS = {
    minShieldHealth: 40,         // Below this, force WAIT
    maxThreatLevel: 'HIGH' as const,
    minConfidence: 0.30,         // Below this, force HOLD
    maxVolatility: 85,           // Above this, reduce confidence
    criticalRisk: 80,            // Above this, force WAIT
  };

  // Version tracking
  private readonly VERSION = '24.25.0';

  /**
   * Main harmonization method
   * Combines all engine outputs into one unified decision
   */
  public harmonize(input: HarmonizationInput): HarmonizedDecision {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Step 1: Validate input
    this.validateInput(input, warnings);

    // Step 2: Check for safety overrides FIRST
    const safetyCheck = this.checkSafetyOverrides(input);
    if (safetyCheck.safeModeActive) {
      return this.buildSafetyDecision(safetyCheck, input, startTime, warnings);
    }

    // Step 3: Normalize all component scores to 0-100 scale
    const scores = this.computeComponentScores(input);

    // Step 4: Detect conflicts between engines
    const conflicts = this.detectConflicts(input);
    if (conflicts.length > 0) {
      warnings.push(`Conflicts detected: ${conflicts.join(', ')}`);
    }

    // Step 5: Resolve conflicts using weighted intelligence
    const resolvedScore = this.resolveConflicts(scores, conflicts);

    // Step 6: Determine action based on final score
    const action = this.determineAction(resolvedScore, input);

    // Step 7: Calculate confidence based on agreement and stability
    const confidence = this.calculateConfidence(input, scores, conflicts);

    // Step 8: Generate human-readable reasoning
    const reason = this.generateReasoning(action, confidence, input, scores);

    // Step 9: Build final decision object
    const decision: HarmonizedDecision = {
      action,
      confidence,
      reason,
      safety: {
        safeModeActive: false,
        allowedActions: ['BUY', 'SELL', 'HOLD', 'WAIT'],
      },
      components: scores,
      metadata: {
        timestamp: input.timestamp || Date.now(),
        processingTime: Date.now() - startTime,
        engineVersions: {
          fusion: this.VERSION,
          shield: this.VERSION,
          strategy: this.VERSION,
        },
        warnings,
      },
    };

    return decision;
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Validate input and add warnings if data is missing or invalid
   */
  private validateInput(input: HarmonizationInput, warnings: string[]): void {
    if (!input.fusion) warnings.push('Missing fusion input');
    if (!input.shield) warnings.push('Missing shield input');
    if (!input.strategy) warnings.push('Missing strategy input');
    if (!input.prediction) warnings.push('Missing prediction input');
    if (!input.threats) warnings.push('Missing threat input');
    
    // Check for NaN or invalid values
    if (input.fusion && isNaN(input.fusion.fusionScore)) {
      warnings.push('Invalid fusion score');
      input.fusion.fusionScore = 50; // Safe default
    }
    if (input.shield && isNaN(input.shield.shieldHealth)) {
      warnings.push('Invalid shield health');
      input.shield.shieldHealth = 50;
    }
  }

  /**
   * Check for critical safety conditions that override all decisions
   */
  private checkSafetyOverrides(input: HarmonizationInput): SafetyOverride {
    const safety: SafetyOverride = {
      safeModeActive: false,
      allowedActions: ['BUY', 'SELL', 'HOLD', 'WAIT'],
    };

    // Override 1: Shield health too low
    if (input.shield.shieldHealth < this.SAFETY_THRESHOLDS.minShieldHealth) {
      safety.safeModeActive = true;
      safety.overrideReason = `Shield health critically low (${input.shield.shieldHealth})`;
      safety.blockedBy = 'Shield Network';
      safety.allowedActions = ['WAIT'];
      return safety;
    }

    // Override 2: Critical threat level
    if (input.shield.threatLevel === 'CRITICAL') {
      safety.safeModeActive = true;
      safety.overrideReason = 'Critical threat level detected';
      safety.blockedBy = 'Threat Engine';
      safety.allowedActions = ['WAIT'];
      return safety;
    }

    // Override 3: Too many critical threats
    if (input.threats.criticalCount >= 3) {
      safety.safeModeActive = true;
      safety.overrideReason = `Multiple critical threats (${input.threats.criticalCount})`;
      safety.blockedBy = 'Threat Cluster Engine';
      safety.allowedActions = ['WAIT', 'HOLD'];
      return safety;
    }

    // Override 4: Critical risk level
    if (input.shield.riskLevel > this.SAFETY_THRESHOLDS.criticalRisk) {
      safety.safeModeActive = true;
      safety.overrideReason = `Risk level too high (${input.shield.riskLevel})`;
      safety.blockedBy = 'Risk Management';
      safety.allowedActions = ['WAIT', 'HOLD'];
      return safety;
    }

    // Override 5: Systemic issue detected by root cause
    if (input.rootCause.systemicIssue && input.rootCause.confidence > 0.7) {
      safety.safeModeActive = true;
      safety.overrideReason = 'Systemic issue detected';
      safety.blockedBy = 'Root Cause Engine';
      safety.allowedActions = ['WAIT', 'HOLD'];
      return safety;
    }

    return safety;
  }

  /**
   * Build a safe decision when override is triggered
   */
  private buildSafetyDecision(
    safety: SafetyOverride,
    input: HarmonizationInput,
    startTime: number,
    warnings: string[]
  ): HarmonizedDecision {
    return {
      action: 'WAIT',
      confidence: 0,
      reason: `SAFETY OVERRIDE: ${safety.overrideReason} (Blocked by ${safety.blockedBy})`,
      safety,
      components: this.computeComponentScores(input),
      metadata: {
        timestamp: input.timestamp || Date.now(),
        processingTime: Date.now() - startTime,
        engineVersions: {
          fusion: this.VERSION,
          shield: this.VERSION,
          strategy: this.VERSION,
        },
        warnings,
      },
    };
  }

  /**
   * Compute normalized scores for each component (0-100 scale)
   */
  private computeComponentScores(input: HarmonizationInput): ComponentScores {
    // Fusion score (already 0-100)
    const fusionScore = Math.max(0, Math.min(100, input.fusion.fusionScore));

    // Shield score (inverted from risk: high health = high score)
    const shieldScore = Math.max(0, Math.min(100, 
      input.shield.shieldHealth * 0.6 + 
      input.shield.stabilityScore * 0.4
    ));

    // Strategy score (opportunity weighted)
    const strategyScore = Math.max(0, Math.min(100, input.strategy.opportunityScore));

    // Prediction score (combine short-term and medium-term)
    const predictionScore = Math.max(0, Math.min(100,
      (100 - input.prediction.shortTermRisk) * 0.6 +
      input.prediction.mediumTermOpportunity * 0.4
    ));

    // Threat score (INVERTED: fewer threats = higher score)
    const threatScore = Math.max(0, Math.min(100,
      100 - (input.threats.criticalCount * 20 + input.threats.highCount * 10)
    ));

    // Stability score (combined from shield and stabilizer)
    const stabilityScore = Math.max(0, Math.min(100,
      input.shield.stabilityScore * 0.6 +
      input.stabilizer.smoothingFactor * 100 * 0.4
    ));

    // Volatility score (INVERTED: low volatility = high score)
    const volatilityScore = Math.max(0, Math.min(100, 100 - input.volatility.currentVolatility));

    // Correlation score (normalized to 0-100)
    const correlationScore = Math.max(0, Math.min(100,
      (input.correlation.marketCorrelation + 1) * 50 * 0.5 +
      input.correlation.volatilitySync * 100 * 0.5
    ));

    // Compute weighted final score
    const finalScore = Math.max(0, Math.min(100,
      fusionScore * this.weights.fusion +
      shieldScore * this.weights.shield +
      strategyScore * this.weights.strategy +
      predictionScore * this.weights.prediction +
      threatScore * this.weights.threats +
      stabilityScore * this.weights.stability
    ));

    return {
      fusionScore,
      shieldScore,
      strategyScore,
      predictionScore,
      threatScore,
      stabilityScore,
      volatilityScore,
      correlationScore,
      finalScore,
    };
  }

  /**
   * Detect conflicts between different engine recommendations
   */
  private detectConflicts(input: HarmonizationInput): string[] {
    const conflicts: string[] = [];

    // Conflict 1: Fusion says BUY but Shield says high risk
    if (
      input.fusion.signal === 'BUY' &&
      (input.shield.threatLevel === 'HIGH' || input.shield.threatLevel === 'CRITICAL')
    ) {
      conflicts.push('Fusion-Shield conflict: BUY signal vs high threat');
    }

    // Conflict 2: Strategy recommends BUY but prediction shows high short-term risk
    if (
      input.strategy.recommendedAction === 'BUY' &&
      input.prediction.shortTermRisk > 70
    ) {
      conflicts.push('Strategy-Prediction conflict: BUY vs high short-term risk');
    }

    // Conflict 3: Low fusion confidence but strategy is aggressive
    if (
      input.fusion.confidence < 0.4 &&
      input.strategy.strategyMode === 'AGGRESSIVE'
    ) {
      conflicts.push('Fusion-Strategy conflict: Low confidence vs aggressive mode');
    }

    // Conflict 4: Divergence detected by correlation engine
    if (input.correlation.divergenceDetected) {
      conflicts.push('Correlation divergence detected');
    }

    // Conflict 5: High volatility but strategy recommends action
    if (
      input.volatility.currentVolatility > this.SAFETY_THRESHOLDS.maxVolatility &&
      (input.strategy.recommendedAction === 'BUY' || input.strategy.recommendedAction === 'SELL')
    ) {
      conflicts.push('Volatility-Strategy conflict: High volatility vs action signal');
    }

    return conflicts;
  }

  /**
   * Resolve conflicts by adjusting scores based on priority
   * Priority: Safety > Stability > Opportunity
   */
  private resolveConflicts(scores: ComponentScores, conflicts: string[]): number {
    let resolvedScore = scores.finalScore;

    // For each conflict, apply penalty
    const conflictPenalty = Math.min(30, conflicts.length * 10);
    resolvedScore -= conflictPenalty;

    // Boost if no conflicts and all systems agree
    if (conflicts.length === 0 && scores.finalScore > 70) {
      resolvedScore += 5; // Small bonus for harmony
    }

    return Math.max(0, Math.min(100, resolvedScore));
  }

  /**
   * Determine action based on final score and input signals
   */
  private determineAction(
    finalScore: number,
    input: HarmonizationInput
  ): 'BUY' | 'SELL' | 'HOLD' | 'WAIT' {
    // Rule 1: If score is very low, WAIT
    if (finalScore < 30) {
      return 'WAIT';
    }

    // Rule 2: If fusion says WAIT, respect it unless score is very high
    if (input.fusion.signal === 'WAIT' && finalScore < 70) {
      return 'WAIT';
    }

    // Rule 3: If shield is weak, be defensive
    if (input.shield.shieldHealth < 50 && finalScore < 60) {
      return 'HOLD';
    }

    // Rule 4: Strong score and positive signals = BUY
    if (finalScore >= 70 && input.fusion.signal === 'BUY') {
      return 'BUY';
    }

    // Rule 5: Strong score but fusion says SELL
    if (finalScore >= 70 && input.fusion.signal === 'SELL') {
      return 'SELL';
    }

    // Rule 6: Moderate score with positive strategy
    if (
      finalScore >= 50 &&
      finalScore < 70 &&
      input.strategy.recommendedAction === 'BUY'
    ) {
      return 'BUY';
    }

    // Rule 7: Moderate score with negative strategy
    if (
      finalScore >= 50 &&
      finalScore < 70 &&
      input.strategy.recommendedAction === 'SELL'
    ) {
      return 'SELL';
    }

    // Default: HOLD (uncertain conditions)
    return 'HOLD';
  }

  /**
   * Calculate final confidence based on agreement and stability
   */
  private calculateConfidence(
    input: HarmonizationInput,
    scores: ComponentScores,
    conflicts: string[]
  ): number {
    // Start with fusion confidence
    let confidence = input.fusion.confidence * 100;

    // Boost if shield is strong
    if (input.shield.shieldHealth > 70) {
      confidence += 10;
    }

    // Boost if stabilizer is active
    if (input.stabilizer.stable) {
      confidence += 5;
    }

    // Boost if strategy and fusion agree
    if (input.fusion.signal === input.strategy.recommendedAction) {
      confidence += 10;
    }

    // Penalty for conflicts
    confidence -= conflicts.length * 8;

    // Penalty for high volatility
    if (input.volatility.currentVolatility > this.SAFETY_THRESHOLDS.maxVolatility) {
      confidence -= 15;
    }

    // Penalty for low prediction confidence
    confidence += input.prediction.forecastConfidence * 10;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate human-readable reasoning for the decision
   */
  private generateReasoning(
    action: string,
    confidence: number,
    input: HarmonizationInput,
    scores: ComponentScores
  ): string {
    const parts: string[] = [];

    // Add action
    parts.push(`ACTION: ${action} (${confidence.toFixed(1)}% confidence)`);

    // Add fusion signal
    parts.push(`Fusion: ${input.fusion.signal} (${scores.fusionScore.toFixed(1)})`);

    // Add shield status
    const shieldStatus =
      input.shield.shieldHealth > 70
        ? 'Strong'
        : input.shield.shieldHealth > 40
        ? 'Moderate'
        : 'Weak';
    parts.push(`Shield: ${shieldStatus} (${scores.shieldScore.toFixed(1)})`);

    // Add strategy
    parts.push(`Strategy: ${input.strategy.strategyMode} → ${input.strategy.recommendedAction}`);

    // Add threat level
    if (input.threats.criticalCount > 0) {
      parts.push(`⚠️ ${input.threats.criticalCount} critical threat(s)`);
    }

    // Add volatility warning
    if (input.volatility.currentVolatility > this.SAFETY_THRESHOLDS.maxVolatility) {
      parts.push(`⚠️ High volatility (${input.volatility.currentVolatility.toFixed(1)})`);
    }

    // Add prediction trend
    parts.push(`Trend: ${input.prediction.longTermTrend}`);

    return parts.join(' | ');
  }

  /**
   * Update configuration weights (for dynamic tuning)
   */
  public updateWeights(newWeights: Partial<typeof this.weights>): void {
    this.weights = { ...this.weights, ...newWeights };
    
    // Normalize to ensure they sum to 1.0
    const sum = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      console.warn(`SystemHarmonizer: Weights sum to ${sum}, normalizing...`);
      Object.keys(this.weights).forEach((key) => {
        this.weights[key as keyof typeof this.weights] /= sum;
      });
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): typeof this.weights {
    return { ...this.weights };
  }

  /**
   * Get version
   */
  public getVersion(): string {
    return this.VERSION;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let instance: SystemHarmonizer | null = null;

export function getSystemHarmonizer(): SystemHarmonizer {
  if (!instance) {
    instance = new SystemHarmonizer();
  }
  return instance;
}

// Default export
export default SystemHarmonizer;
