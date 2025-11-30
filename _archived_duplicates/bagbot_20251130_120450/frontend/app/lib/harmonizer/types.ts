/**
 * 🔥 HARMONIZER TYPES
 * 
 * STEP 24.32 — Type Definitions
 * 
 * Purpose:
 * Comprehensive TypeScript type definitions for the Shield-Network Harmonizer Layer (SNHL).
 * These types define the contract between all intelligence subsystems and the harmonizer.
 * 
 * Requirements:
 * - Complete type safety for all harmonizer operations
 * - Clear interfaces for engine inputs and outputs
 * - Strict typing for HIF (Harmonized Intelligence Frame)
 * - Configuration types for customization
 */

// ============================================================================
// HARMONIZED INTELLIGENCE FRAME (HIF) — Main Output
// ============================================================================

/**
 * HIF — The unified intelligence frame output by SNHL
 * This is what the Trading Brain uses to make final decisions.
 */
export interface HIF {
  timestamp: number; // Unix timestamp
  tradeBias: number; // -1 (bearish) to +1 (bullish)
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  recommendedAction: 'LONG' | 'SHORT' | 'WAIT';
  shieldState: 'CALM' | 'DEFENSIVE' | 'AGGRO_OBS' | 'PROTECTIVE';
  threatLevel: number; // 0-100
  volatilityStatus: 'low' | 'medium' | 'high';
  systemMode: 'normal' | 'safe' | 'aggressive';
  hasConflicts: boolean;
  frameNumber: number;
}

// ============================================================================
// HARMONIZER INPUT — Signals from All Engines
// ============================================================================

/**
 * HarmonizerInput — Collected signals from all subsystems
 */
export interface HarmonizerInput {
  shieldEngine: ShieldEngineSignal | null;
  threatClusterEngine: ThreatClusterSignal | null;
  correlationMatrix: CorrelationMatrixSignal | null;
  predictionHorizon: PredictionHorizonSignal | null;
  rootCauseEngine: RootCauseSignal | null;
  executionPrecisionCore: ExecutionPrecisionSignal | null;
  survivalMatrix: SurvivalMatrixSignal | null;
  tradingPipelineCore: TradingPipelineSignal | null;
  decisionEngine: DecisionEngineSignal | null;
  temporalMemoryEngine: TemporalMemorySignal | null;
  autonomousResponseLoop: ARLSignal | null;
  reactorSyncEngine: ReactorSignal | null; // Read-only, for visual context
}

// ============================================================================
// INDIVIDUAL ENGINE SIGNALS
// ============================================================================

export interface ShieldEngineSignal {
  threatLevel: number; // 0-1
  confidence: number; // 0-100
  recommendedAction: 'ATTACK' | 'DEFEND' | 'NEUTRAL';
  shieldState: string;
}

export interface ThreatClusterSignal {
  aggregatedScore: number; // 0-100
  clusterCount: number;
  highestThreat: number;
}

export interface CorrelationMatrixSignal {
  correlation: number; // -1 to +1
  confidence: number; // 0-100
  strength: 'weak' | 'moderate' | 'strong';
}

export interface PredictionHorizonSignal {
  forecastConfidence: number; // 0-100
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  timeframe: string;
}

export interface RootCauseSignal {
  stabilityScore: number; // 0-100
  rootCauses: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface ExecutionPrecisionSignal {
  readinessScore: number; // 0-100
  readiness: 'READY' | 'NOT_READY' | 'CAUTION';
  slippageRisk: number;
}

export interface SurvivalMatrixSignal {
  survivalScore: number; // 0-100
  survivalPath: string;
  threatFactors: number;
}

export interface TradingPipelineSignal {
  healthScore: number; // 0-100
  activeOrders: number;
  pipelineStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export interface DecisionEngineSignal {
  confidence: number; // 0-100
  action: 'LONG' | 'SHORT' | 'WAIT';
  reasoning: string;
}

export interface TemporalMemorySignal {
  reliability: number; // 0-100
  memoryDepth: number;
  recentPatterns: string[];
}

export interface ARLSignal {
  mode: 'CALM' | 'ALERT' | 'DEFENSIVE' | 'AGGRESSIVE_OBSERVATION';
  intensity: number; // 0-100
  reactorActivity: number;
}

export interface ReactorSignal {
  mode: string;
  glowIntensity: number;
  pulseFrequency: number;
}

// ============================================================================
// NORMALIZED SIGNALS
// ============================================================================

/**
 * NormalizedSignal — All signals normalized to 0-100 scale
 */
export interface NormalizedSignal {
  source: string; // Engine name
  value: number; // 0-100 normalized value
  confidence: number; // 0-100
  tradeBias: number; // -1 (bearish) to +1 (bullish)
}

// ============================================================================
// HARMONIZED SIGNALS — After Blending
// ============================================================================

/**
 * HarmonizedSignals — Result of conflict resolution and blending
 */
export interface HarmonizedSignals {
  value: number; // 0-100 blended value
  confidence: number; // 0-100 blended confidence
  tradeBias: number; // -1 to +1 blended bias
  riskLevel: 'low' | 'medium' | 'high';
  volatilityStatus: 'low' | 'medium' | 'high';
}

// ============================================================================
// CONFLICTED SIGNALS
// ============================================================================

/**
 * ConflictedSignals — Detected contradictions between engines
 */
export interface ConflictedSignals {
  type: 'trade-direction' | 'risk-assessment' | 'timing' | 'confidence-mismatch';
  sources: string[]; // List of conflicting engine names
  description: string;
}

// ============================================================================
// HARMONIZER CONFIGURATION
// ============================================================================

/**
 * HarmonizerConfig — Configuration for SNHL behavior
 */
export interface HarmonizerConfig {
  loopFrequency: number; // milliseconds (default: 120ms)
  conflictResolutionStrategy: 'weighted-average' | 'majority-vote' | 'highest-confidence';
  normalizationScale: {
    min: number; // default: 0
    max: number; // default: 100
  };
  enableConflictLogging: boolean; // default: false
  weights: {
    shieldEngine: number; // 0.25 recommended
    threatClusterEngine: number; // 0.10
    correlationMatrix: number; // 0.08
    predictionHorizon: number; // 0.10
    rootCauseEngine: number; // 0.08
    executionPrecisionCore: number; // 0.12
    survivalMatrix: number; // 0.10
    tradingPipelineCore: number; // 0.05
    decisionEngine: number; // 0.08
    temporalMemoryEngine: number; // 0.04
    autonomousResponseLoop: number; // 0.00 (visual only)
  };
}

// ============================================================================
// EXECUTION INSTRUCTION — NET Output
// ============================================================================

/**
 * ExecutionInstruction — Output from Neural Execution Translator (NET)
 * This is the final action instruction sent to execution systems.
 */
export interface ExecutionInstruction {
  action:
    | 'EXECUTE_LONG'
    | 'EXECUTE_SHORT'
    | 'HOLD'
    | 'REDUCE_POSITION'
    | 'CLOSE_IMMEDIATELY'
    | 'AVOID_MARKET'
    | 'ENTER_SCOUT_MODE'
    | 'ENTER_AGGRO_MODE';
  confidence: number; // 0-100
  positionSize?: number; // Percentage or fixed size
  stopLoss?: number; // Price level
  takeProfit?: number; // Price level
  urgency: 'immediate' | 'normal' | 'patient';
  reasoning: string;
  safetyChecks: SafetyGateResult;
  timestamp: number;
}

// ============================================================================
// EXECUTION CONTEXT — NET Input Context
// ============================================================================

/**
 * ExecutionContext — Additional context for NET translation
 */
export interface ExecutionContext {
  currentPosition?: {
    direction: 'LONG' | 'SHORT' | 'NONE';
    size: number;
    entryPrice: number;
    unrealizedPnL: number;
  };
  accountBalance: number;
  availableMargin: number;
  recentTrades: number; // Count of recent trades
  dailyPnL: number;
  maxDrawdown: number;
}

// ============================================================================
// SAFETY GATE RESULT
// ============================================================================

/**
 * SafetyGateResult — Result of deep sanity checks
 */
export interface SafetyGateResult {
  passed: boolean;
  checks: {
    shieldStateCheck: boolean; // Shield state prevents stupid mistakes
    threatLevelCheck: boolean; // Threat level overrides greed
    confidenceAlignmentCheck: boolean; // Confidence must align with bias
    volatilitySpikeCheck: boolean; // Volatility spikes pause entries
    dailyConsistencyCheck: boolean; // Daily consistency rules apply
  };
  blockedReason?: string; // If not passed, why?
}

// ============================================================================
// ACTION CONFIDENCE LEVEL
// ============================================================================

/**
 * ActionConfidenceLevel — Confidence categorization
 */
export type ActionConfidenceLevel = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';

// ============================================================================
// THREAT OVERRIDE STATE
// ============================================================================

/**
 * ThreatOverrideState — When threat level forces override
 */
export interface ThreatOverrideState {
  isActive: boolean;
  reason: string;
  overriddenAction: string;
  enforcedAction: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  HIF as default,
  HarmonizerInput,
  HarmonizerConfig,
  ConflictedSignals,
  HarmonizedSignals,
  NormalizedSignal,
  ExecutionInstruction,
  ExecutionContext,
  SafetyGateResult,
  ActionConfidenceLevel,
  ThreatOverrideState,
};
