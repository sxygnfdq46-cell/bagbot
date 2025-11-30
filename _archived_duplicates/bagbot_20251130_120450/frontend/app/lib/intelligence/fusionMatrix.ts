/**
 * Fusion Matrix - Cross-Engine Output Merger
 * 
 * Merges outputs from all intelligence engines into unified matrix.
 * Handles cross-correlation, conflict detection, and signal aggregation.
 */

import type { FusionWeights } from './fusionWeights';

/**
 * Individual engine result interface
 */
export interface EngineResult {
  engineName: string;
  action: "BUY" | "SELL" | "HOLD" | "CLOSE" | "REDUCE" | "HALT" | "WAIT";
  confidence: number;          // 0-100
  reason: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  metadata: Record<string, any>;
  timestamp: number;
}

/**
 * Shield Engine result
 */
export interface ShieldResult extends EngineResult {
  engineName: "shield";
  shieldActive: boolean;
  threatLevel: number;
  blockedReasons: string[];
}

/**
 * Threat Engine result
 */
export interface ThreatResult extends EngineResult {
  engineName: "threat";
  threats: Array<{
    type: string;
    severity: number;
    description: string;
  }>;
  overallThreatScore: number;
}

/**
 * Root Cause Engine result
 */
export interface RootCauseResult extends EngineResult {
  engineName: "rootCause";
  rootCauses: string[];
  primaryCause: string;
  causalityScore: number;
}

/**
 * Prediction Horizon result
 */
export interface PredictionResult extends EngineResult {
  engineName: "prediction";
  predictedDirection: "UP" | "DOWN" | "NEUTRAL";
  predictedChange: number;      // Expected % change
  timeHorizon: number;          // Milliseconds
  predictionConfidence: number;
}

/**
 * Volatility Behavior Engine result
 */
export interface VolatilityResult extends EngineResult {
  engineName: "volatility";
  phase: string;
  behavior: string;
  severity: number;
  tradingAdvice: "CONTINUE" | "REDUCE" | "PAUSE" | "HALT";
}

/**
 * Execution Engine result
 */
export interface ExecutionResult extends EngineResult {
  engineName: "execution";
  executionQuality: number;     // 0-100
  slippage: number;
  liquidityScore: number;
  recommendedOrderType: string;
}

/**
 * Decision Engine result
 */
export interface DecisionResult extends EngineResult {
  engineName: "decision";
  decisionScore: number;
  alternatives: Array<{
    action: string;
    score: number;
  }>;
}

/**
 * Market Flow Engine result
 */
export interface FlowResult extends EngineResult {
  engineName: "flow";
  flowIntent: "BULLISH" | "BEARISH" | "STALLED" | "FAKE_MOVE";
  flowScore: number;
  liquidityCrisis: boolean;
  momentumShift: boolean;
}

/**
 * Pattern Recognition result
 */
export interface PatternResult extends EngineResult {
  engineName: "pattern";
  patterns: string[];
  patternStrength: number;
  historicalAccuracy: number;
}

/**
 * Risk Management result
 */
export interface RiskResult extends EngineResult {
  engineName: "risk";
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  maxPositionSize: number;
  stopLoss: number | null;
}

/**
 * All possible engine results
 */
export type AnyEngineResult = 
  | ShieldResult
  | ThreatResult
  | RootCauseResult
  | PredictionResult
  | VolatilityResult
  | ExecutionResult
  | DecisionResult
  | FlowResult
  | PatternResult
  | RiskResult;

/**
 * Fusion matrix - merged engine outputs
 */
export interface FusionMatrix {
  // All engine results
  engines: {
    shield?: ShieldResult;
    threat?: ThreatResult;
    rootCause?: RootCauseResult;
    prediction?: PredictionResult;
    volatility?: VolatilityResult;
    execution?: ExecutionResult;
    decision?: DecisionResult;
    flow?: FlowResult;
    pattern?: PatternResult;
    risk?: RiskResult;
  };
  
  // Aggregated metrics
  aggregated: {
    avgConfidence: number;
    consensusAction: string | null;
    consensusStrength: number;      // 0-100 (how much agreement)
    conflictLevel: number;          // 0-100 (disagreement level)
    overallRisk: number;            // 0-100
    signalQuality: number;          // 0-100
  };
  
  // Action distribution
  actionDistribution: Record<string, number>;  // How many engines suggest each action
  
  // Conflicts
  conflicts: Array<{
    engines: string[];
    conflictType: string;
    severity: number;
    description: string;
  }>;
  
  // Correlations
  correlations: Array<{
    engine1: string;
    engine2: string;
    correlation: number;  // -1 to 1
    agreement: boolean;
  }>;
  
  timestamp: number;
}

// ============================================================================
// Matrix Construction
// ============================================================================

/**
 * Create fusion matrix from engine results
 */
export function createFusionMatrix(results: AnyEngineResult[]): FusionMatrix {
  const matrix: FusionMatrix = {
    engines: {},
    aggregated: {
      avgConfidence: 0,
      consensusAction: null,
      consensusStrength: 0,
      conflictLevel: 0,
      overallRisk: 0,
      signalQuality: 0,
    },
    actionDistribution: {},
    conflicts: [],
    correlations: [],
    timestamp: Date.now(),
  };
  
  // Organize results by engine
  results.forEach(result => {
    (matrix.engines as any)[result.engineName] = result;
  });
  
  // Calculate aggregated metrics
  matrix.aggregated = calculateAggregatedMetrics(results);
  
  // Calculate action distribution
  matrix.actionDistribution = calculateActionDistribution(results);
  
  // Detect conflicts
  matrix.conflicts = detectConflicts(results);
  
  // Calculate correlations
  matrix.correlations = calculateCorrelations(results);
  
  return matrix;
}

/**
 * Calculate aggregated metrics
 */
function calculateAggregatedMetrics(results: AnyEngineResult[]): FusionMatrix['aggregated'] {
  if (results.length === 0) {
    return {
      avgConfidence: 0,
      consensusAction: null,
      consensusStrength: 0,
      conflictLevel: 0,
      overallRisk: 0,
      signalQuality: 0,
    };
  }
  
  // Average confidence
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  // Consensus action (most common)
  const actionCounts: Record<string, number> = {};
  results.forEach(r => {
    actionCounts[r.action] = (actionCounts[r.action] || 0) + 1;
  });
  
  const consensusAction = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
  
  const consensusCount = consensusAction ? actionCounts[consensusAction] : 0;
  const consensusStrength = (consensusCount / results.length) * 100;
  
  // Conflict level (inverse of consensus)
  const conflictLevel = 100 - consensusStrength;
  
  // Overall risk (from risk engine or high priority engines)
  const riskEngine = results.find(r => r.engineName === "risk") as RiskResult | undefined;
  const overallRisk = riskEngine?.riskScore || avgConfidence;
  
  // Signal quality (based on confidence and consensus)
  const signalQuality = (avgConfidence * 0.6) + (consensusStrength * 0.4);
  
  return {
    avgConfidence: Math.round(avgConfidence),
    consensusAction,
    consensusStrength: Math.round(consensusStrength),
    conflictLevel: Math.round(conflictLevel),
    overallRisk: Math.round(overallRisk),
    signalQuality: Math.round(signalQuality),
  };
}

/**
 * Calculate action distribution
 */
function calculateActionDistribution(results: AnyEngineResult[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  results.forEach(r => {
    distribution[r.action] = (distribution[r.action] || 0) + 1;
  });
  
  return distribution;
}

/**
 * Detect conflicts between engines
 */
function detectConflicts(results: AnyEngineResult[]): FusionMatrix['conflicts'] {
  const conflicts: FusionMatrix['conflicts'] = [];
  
  // Check for action conflicts
  const actions = results.map(r => ({ engine: r.engineName, action: r.action }));
  const uniqueActions = [...new Set(actions.map(a => a.action))];
  
  if (uniqueActions.length > 2) {
    const conflictingEngines = actions.map(a => a.engine);
    conflicts.push({
      engines: conflictingEngines,
      conflictType: "action_disagreement",
      severity: 50 + (uniqueActions.length * 10),
      description: `${uniqueActions.length} different actions suggested: ${uniqueActions.join(', ')}`,
    });
  }
  
  // Check for shield vs execution conflict
  const shield = results.find(r => r.engineName === "shield") as ShieldResult | undefined;
  const execution = results.find(r => r.engineName === "execution");
  
  if (shield?.shieldActive && execution?.action !== "HOLD" && execution?.action !== "WAIT") {
    conflicts.push({
      engines: ["shield", "execution"],
      conflictType: "shield_override",
      severity: 80,
      description: "Shield is active but execution wants to trade",
    });
  }
  
  // Check for volatility vs prediction conflict
  const volatility = results.find(r => r.engineName === "volatility") as VolatilityResult | undefined;
  const prediction = results.find(r => r.engineName === "prediction") as PredictionResult | undefined;
  
  if (volatility?.tradingAdvice === "HALT" && prediction?.action !== "HOLD") {
    conflicts.push({
      engines: ["volatility", "prediction"],
      conflictType: "volatility_warning",
      severity: 70,
      description: "High volatility suggests halt, but prediction wants to trade",
    });
  }
  
  // Check for threat vs decision conflict
  const threat = results.find(r => r.engineName === "threat") as ThreatResult | undefined;
  const decision = results.find(r => r.engineName === "decision");
  
  if (threat && threat.overallThreatScore > 70 && decision?.action !== "HOLD") {
    conflicts.push({
      engines: ["threat", "decision"],
      conflictType: "threat_warning",
      severity: 60,
      description: "High threat level detected while decision suggests trading",
    });
  }
  
  return conflicts;
}

/**
 * Calculate correlations between engines
 */
function calculateCorrelations(results: AnyEngineResult[]): FusionMatrix['correlations'] {
  const correlations: FusionMatrix['correlations'] = [];
  
  // Compare all pairs of engines
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const r1 = results[i];
      const r2 = results[j];
      
      // Simple correlation based on action agreement
      const actionMatch = r1.action === r2.action;
      
      // Confidence correlation
      const confidenceDiff = Math.abs(r1.confidence - r2.confidence);
      const confidenceCorr = 1 - (confidenceDiff / 100);
      
      // Combined correlation
      const correlation = actionMatch ? confidenceCorr : -confidenceCorr;
      
      correlations.push({
        engine1: r1.engineName,
        engine2: r2.engineName,
        correlation: Math.round(correlation * 100) / 100,
        agreement: actionMatch,
      });
    }
  }
  
  return correlations;
}

// ============================================================================
// Matrix Analysis
// ============================================================================

/**
 * Get strongest signal from matrix
 */
export function getStrongestSignal(matrix: FusionMatrix): AnyEngineResult | null {
  const results = Object.values(matrix.engines).filter(Boolean) as AnyEngineResult[];
  
  if (results.length === 0) return null;
  
  // Sort by confidence and priority
  const priorityScores: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  };
  
  return results.sort((a, b) => {
    const aScore = a.confidence + priorityScores[a.priority];
    const bScore = b.confidence + priorityScores[b.priority];
    return bScore - aScore;
  })[0];
}

/**
 * Get defensive signals (shield, threat, volatility)
 */
export function getDefensiveSignals(matrix: FusionMatrix): AnyEngineResult[] {
  return Object.values(matrix.engines)
    .filter(Boolean)
    .filter(r => ['shield', 'threat', 'volatility', 'risk'].includes(r!.engineName)) as AnyEngineResult[];
}

/**
 * Get offensive signals (execution, prediction, pattern)
 */
export function getOffensiveSignals(matrix: FusionMatrix): AnyEngineResult[] {
  return Object.values(matrix.engines)
    .filter(Boolean)
    .filter(r => ['execution', 'prediction', 'pattern', 'flow'].includes(r!.engineName)) as AnyEngineResult[];
}

/**
 * Check if matrix suggests halt
 */
export function shouldHalt(matrix: FusionMatrix): boolean {
  const shield = matrix.engines.shield;
  const volatility = matrix.engines.volatility;
  const threat = matrix.engines.threat;
  const risk = matrix.engines.risk;
  
  if (shield?.shieldActive) return true;
  if (volatility?.tradingAdvice === "HALT") return true;
  if (threat && threat.overallThreatScore > 80) return true;
  if (risk?.riskLevel === "CRITICAL") return true;
  
  return false;
}

/**
 * Check if matrix has high confidence
 */
export function hasHighConfidence(matrix: FusionMatrix, threshold: number = 70): boolean {
  return matrix.aggregated.avgConfidence >= threshold &&
         matrix.aggregated.consensusStrength >= 60;
}

/**
 * Get matrix quality score (0-100)
 */
export function getMatrixQuality(matrix: FusionMatrix): number {
  let score = matrix.aggregated.signalQuality;
  
  // Deduct for conflicts
  score -= matrix.conflicts.length * 5;
  
  // Deduct for low consensus
  if (matrix.aggregated.consensusStrength < 50) {
    score -= 20;
  }
  
  // Bonus for high correlation
  const avgCorrelation = matrix.correlations.length > 0
    ? matrix.correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / matrix.correlations.length
    : 0;
  score += avgCorrelation * 10;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Merge matrix with weights
 */
export function mergeMatrixWithWeights(
  matrix: FusionMatrix,
  weights: FusionWeights
): {
  weightedAction: string;
  weightedConfidence: number;
  contributions: Array<{ engine: string; contribution: number }>;
} {
  const contributions: Array<{ engine: string; contribution: number }> = [];
  const actionScores: Record<string, number> = {};
  let totalWeight = 0;
  
  // Calculate weighted contributions
  Object.entries(matrix.engines).forEach(([engineName, result]) => {
    if (!result) return;
    
    const weight = (weights as any)[engineName] || 0;
    const contribution = result.confidence * weight;
    
    contributions.push({
      engine: engineName,
      contribution: Math.round(contribution * 100) / 100,
    });
    
    // Accumulate action scores
    actionScores[result.action] = (actionScores[result.action] || 0) + contribution;
    totalWeight += weight * result.confidence;
  });
  
  // Find highest weighted action
  const weightedAction = Object.entries(actionScores)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || "HOLD";
  
  // Calculate weighted confidence
  const weightedConfidence = totalWeight / Object.keys(matrix.engines).length;
  
  return {
    weightedAction,
    weightedConfidence: Math.round(weightedConfidence),
    contributions: contributions.sort((a, b) => b.contribution - a.contribution),
  };
}

/**
 * Export matrix utilities
 */
export const FusionMatrixUtil = {
  create: createFusionMatrix,
  getStrongestSignal,
  getDefensiveSignals,
  getOffensiveSignals,
  shouldHalt,
  hasHighConfidence,
  getQuality: getMatrixQuality,
  mergeWithWeights: mergeMatrixWithWeights,
};

export default FusionMatrixUtil;
