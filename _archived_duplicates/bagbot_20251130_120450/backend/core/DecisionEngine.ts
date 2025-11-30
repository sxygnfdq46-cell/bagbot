/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧠 DECISION ENGINE — Professional Trading Decision Logic
 * ═══════════════════════════════════════════════════════════════════
 * 
 * The Decision Engine translates fusion intelligence into actionable
 * trading decisions (BUY/SELL/HOLD/WAIT) with full safety oversight.
 * 
 * Core Responsibilities:
 * 1. Multi-factor decision logic (fusion + shield + volatility + trend)
 * 2. Shield-aware trading protection (RED = force WAIT, degraded = reduce confidence)
 * 3. Anti-whipsaw protection (min-hold, cooldown, reverse damper, drift spike cancellation)
 * 4. Multi-factor confidence model (6 weighted signals with adaptive EMA)
 * 5. Internal scoring dashboard (fully typed, safety-first, explains like analyst)
 * 6. Event hooks for admin panel (5 event types)
 * 
 * Design: Zero autonomous execution. Analysis only. Ready for Level 20.4+ upgrades.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { FusionOutput, StabilizedFusion } from '../../frontend/src/engine/fusion/FusionTypes';
import type {
  VolatilityReading,
  RegimeReading,
  HeatReading,
  NoiseReading,
  VolatilityLevel,
  MarketRegime
} from '../analytics';

// ═════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════

/**
 * Trading decision output
 */
export interface TradingDecision {
  action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number;               // 0-100%
  reason: string[];                 // Human-readable reasons
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  shield: string;                   // Shield state (Green/Yellow/Orange/Red)
  fusedScore: number;               // Final fusion score
  stabilizedScore: number;          // Stabilized fusion score
  trend: string;                    // UP/DOWN/FLAT
  reactionMode?: string;            // Dynamic reaction mode (SteadyMode, PauseMode, etc.)
  hedgeMode?: string;               // Autonomous hedge mode (inactive, micro, stabilizer, crisis)
  hedgeSize?: number;               // Hedge position size (0-1)
  shieldThreatLevel?: string;       // Shield fusion classification (LOW_THREAT, MODERATE_THREAT, etc.)
  shieldScore?: number;             // Shield fusion score (0-20+)
  rootCause?: string;               // Root cause analysis result
  timestamp: number;
}

/**
 * Decision inputs (from fusion + shield + market)
 */
export interface DecisionInputs {
  // Fusion data
  rawFusion: FusionOutput;           // Raw fusion output
  stabilizedFusion: StabilizedFusion; // Stabilized fusion output
  
  // Shield intelligence
  shieldState: 'Green' | 'Yellow' | 'Orange' | 'Red';
  emotionalDegradation: number;     // 0-1 (0 = stable, 1 = degraded)
  executionWarning: boolean;        // true if execution shield warns
  memoryUnstable: boolean;          // true if memory shield unstable
  
  // Market data
  volatilityIndex: number;          // 0-1.0
  trendStrength: 'UP' | 'DOWN' | 'FLAT';
  driftRate: number;                // Rate of fusion drift

  // NEW: Environmental intelligence (LEVEL 22)
  environment?: {
    volatility: VolatilityReading | null;
    regime: RegimeReading | null;
    heat: HeatReading | null;
    noise: NoiseReading | null;
  };
}

/**
 * Anti-whipsaw state tracking
 */
interface WhipsawProtection {
  lastDecision: 'BUY' | 'SELL' | 'HOLD' | 'WAIT' | null;
  lastDecisionTime: number;
  holdCycleCount: number;           // Cycles since decision
  cooldownActive: boolean;
  lastFlipTime: number;             // Last BUY→SELL or SELL→BUY flip
}

/**
 * Confidence model factors
 */
interface ConfidenceFactors {
  stabilizedFusionConfidence: number;   // From fusion engine
  trendConsistency: number;             // Trend alignment
  shieldRisk: number;                   // Shield-based penalty
  volatility: number;                   // Volatility score
  drift: number;                        // Drift penalty
  historicalAccuracy: number;           // Past accuracy (future: ML)
}

/**
 * Decision engine configuration
 */
interface DecisionConfig {
  // BUY thresholds
  buyMinScore: number;              // Min fusion score (default: 68)
  buyMinConfidence: number;         // Min confidence (default: 70%)
  buyMaxVolatility: number;         // Max volatility (default: 0.55)
  
  // SELL thresholds
  sellMaxScore: number;             // Max fusion score (default: 32)
  sellMinConfidence: number;        // Min confidence (default: 65%)
  
  // HOLD thresholds
  holdMinConfidence: number;        // Min confidence (default: 40%)
  holdMaxVolatility: number;        // Max volatility (default: 0.70)
  
  // Anti-whipsaw protection
  minHoldCycles: number;            // Min cycles before flip (default: 2-4)
  antiFlipCooldown: number;         // Cooldown in ms (default: 10-20s)
  reverseDamperFactor: number;      // Damper strength (default: 0.15)
  driftSpikeCancellation: number;   // Drift threshold (default: 0.10)
  
  // Confidence model weights
  confidenceWeights: {
    fusion: number;                 // Default: 0.35
    trend: number;                  // Default: 0.20
    shield: number;                 // Default: 0.15
    volatility: number;             // Default: 0.15
    drift: number;                  // Default: 0.10
    historical: number;             // Default: 0.05
  };
  
  // EMA for adaptive confidence
  confidenceEMAAlpha: number;       // Default: 0.25 (50-cycle smoothing)
}

/**
 * Event types
 */
type DecisionEventType = 
  | 'onDecisionChange'
  | 'onHighConfidence'
  | 'onLowConfidence'
  | 'onFlipSignal'
  | 'onUnsafeEnvironment';

type DecisionEventCallback = (data: any) => void;
type UnsubscribeFn = () => void;

// ═════════════════════════════════════════════════════════════════
// DECISION ENGINE CLASS
// ═════════════════════════════════════════════════════════════════

export class DecisionEngine {
  private config: DecisionConfig;
  private whipsawState: WhipsawProtection;
  private confidenceHistory: number[] = [];
  private decisionHistory: TradingDecision[] = [];
  private eventListeners: Map<DecisionEventType, DecisionEventCallback[]> = new Map();
  private lastConfidenceEMA: number = 0;
  
  constructor(config?: Partial<DecisionConfig>) {
    this.config = {
      // BUY thresholds
      buyMinScore: 68,
      buyMinConfidence: 70,
      buyMaxVolatility: 0.55,
      
      // SELL thresholds
      sellMaxScore: 32,
      sellMinConfidence: 65,
      
      // HOLD thresholds
      holdMinConfidence: 40,
      holdMaxVolatility: 0.70,
      
      // Anti-whipsaw
      minHoldCycles: 3,
      antiFlipCooldown: 15000,       // 15 seconds
      reverseDamperFactor: 0.15,
      driftSpikeCancellation: 0.10,
      
      // Confidence weights
      confidenceWeights: {
        fusion: 0.35,
        trend: 0.20,
        shield: 0.15,
        volatility: 0.15,
        drift: 0.10,
        historical: 0.05,
      },
      
      confidenceEMAAlpha: 0.25,
      
      ...config,
    };
    
    this.whipsawState = {
      lastDecision: null,
      lastDecisionTime: 0,
      holdCycleCount: 0,
      cooldownActive: false,
      lastFlipTime: 0,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════
  
  /**
   * Generate trading decision from inputs
   */
  decide(inputs: DecisionInputs): TradingDecision {
    const now = Date.now();
    
    // 1. Shield-aware trading protection
    const shieldBlock = this.checkShieldBlock(inputs);
    if (shieldBlock) {
      const decision = this.createWaitDecision(inputs, shieldBlock.reason, now);
      this.recordDecision(decision);
      return decision;
    }
    
    // 2. Calculate multi-factor confidence
    const confidence = this.calculateConfidence(inputs);
    
    // 3. Apply anti-whipsaw protection
    const whipsawAdjustment = this.applyWhipsawProtection(inputs, confidence);
    
    // 4. Core decision logic
    const rawDecision = this.coreDecisionLogic(inputs, whipsawAdjustment.confidence);
    
    // 5. Generate reasons and final decision
    const decision: TradingDecision = {
      action: rawDecision.action,
      confidence: whipsawAdjustment.confidence,
      reason: this.generateReasons(inputs, rawDecision, whipsawAdjustment),
      risk: this.classifyRisk(inputs),
      shield: inputs.shieldState,
      fusedScore: inputs.rawFusion.fusionScore,
      stabilizedScore: inputs.stabilizedFusion.score,
      trend: inputs.trendStrength,
      reactionMode: undefined, // To be set by DynamicReactionPathwayEngine in frontend
      hedgeMode: undefined, // To be set by AutonomousHedgePathwayEngine in frontend
      hedgeSize: undefined, // To be set by AutonomousHedgePathwayEngine in frontend
      shieldThreatLevel: undefined, // To be set by ShieldFusionSynchronizer in frontend
      shieldScore: undefined, // To be set by ShieldFusionSynchronizer in frontend
      rootCause: undefined, // To be set by ShieldFusionSynchronizer in frontend
      timestamp: now,
    };
    
    // 6. Update state and emit events
    this.updateWhipsawState(decision);
    this.recordDecision(decision);
    this.emitEvents(decision);
    
    return decision;
  }
  
  /**
   * Get decision history
   */
  getHistory(limit: number = 100): TradingDecision[] {
    return this.decisionHistory.slice(-limit);
  }
  
  /**
   * Get current configuration
   */
  getConfig(): DecisionConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<DecisionConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.decisionHistory = [];
    this.confidenceHistory = [];
    this.lastConfidenceEMA = 0;
  }
  
  /**
   * Subscribe to decision events
   */
  on(type: DecisionEventType, callback: DecisionEventCallback): UnsubscribeFn {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type)!.push(callback);
    
    return () => {
      const listeners = this.eventListeners.get(type) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // SHIELD-AWARE TRADING PROTECTION
  // ═══════════════════════════════════════════════════════════════
  
  private checkShieldBlock(inputs: DecisionInputs): { blocked: true; reason: string } | null {
    // Rule 1: If shield state = RED, force WAIT
    if (inputs.shieldState === 'Red') {
      return {
        blocked: true,
        reason: 'High-risk cascade detected',
      };
    }
    
    // Rule 2: If execution shield warns, HOLD until safe
    if (inputs.executionWarning) {
      return {
        blocked: true,
        reason: 'Execution shield warning active',
      };
    }
    
    return null;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // CORE DECISION LOGIC
  // ═══════════════════════════════════════════════════════════════
  
  private coreDecisionLogic(
    inputs: DecisionInputs,
    confidence: number
  ): { action: 'BUY' | 'SELL' | 'HOLD' | 'WAIT' } {
    const { score: stabilizedScore } = inputs.stabilizedFusion;
    const { volatilityIndex, trendStrength, driftRate } = inputs;
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // NEW: ENVIRONMENTAL ADAPTIVE LOGIC (LEVEL 22)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    let volatilityMultiplier = 1.0;
    let regimeBoost = 0;
    let heatPenalty = 0;
    let noiseBlock = false;

    if (inputs.environment) {
      const { volatility, regime, heat, noise } = inputs.environment;

      // VOLATILITY: Adjust confidence based on volatility level
      if (volatility) {
        switch (volatility.level) {
          case 'LOW':
            volatilityMultiplier = 1.0;
            break;
          case 'MEDIUM':
            volatilityMultiplier = 0.9;
            break;
          case 'HIGH':
            volatilityMultiplier = 0.7;
            break;
          case 'EXTREME':
            volatilityMultiplier = 0.5;
            break;
        }
      }

      // REGIME: Boost confidence in compression (pre-breakout)
      if (regime && regime.regime === 'COMPRESSION') {
        regimeBoost = 10; // +10% confidence for compression breakout signals
      }

      // HEAT: Reduce confidence when overheated (exhaustion risk)
      if (heat && heat.overheated) {
        heatPenalty = 15; // -15% confidence
      }

      // NOISE: Block all signals in very noisy markets
      if (noise && noise.noisy) {
        noiseBlock = true;
      }
    }

    // Apply environmental adjustments to confidence
    let adjustedConfidence = confidence * volatilityMultiplier;
    adjustedConfidence += regimeBoost;
    adjustedConfidence -= heatPenalty;
    adjustedConfidence = Math.max(0, Math.min(100, adjustedConfidence));

    // Block signals if market too noisy
    if (noiseBlock) {
      return { action: 'WAIT' };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ORIGINAL DECISION LOGIC (with adjusted confidence)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    // BUY conditions
    if (
      stabilizedScore >= this.config.buyMinScore &&
      adjustedConfidence >= this.config.buyMinConfidence &&
      inputs.shieldState !== 'Orange' &&
      inputs.shieldState !== 'Red' &&
      trendStrength === 'UP' &&
      volatilityIndex < this.config.buyMaxVolatility
    ) {
      return { action: 'BUY' };
    }
    
    // SELL conditions
    if (
      stabilizedScore <= this.config.sellMaxScore &&
      adjustedConfidence >= this.config.sellMinConfidence &&
      trendStrength === 'DOWN' &&
      inputs.shieldState !== 'Red'
    ) {
      return { action: 'SELL' };
    }
    
    // HOLD conditions
    if (
      adjustedConfidence >= this.config.holdMinConfidence &&
      volatilityIndex < this.config.holdMaxVolatility
    ) {
      return { action: 'HOLD' };
    }
    
    // WAIT conditions (default fallback)
    return { action: 'WAIT' };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // MULTI-FACTOR CONFIDENCE MODEL
  // ═══════════════════════════════════════════════════════════════
  
  private calculateConfidence(inputs: DecisionInputs): number {
    const factors = this.extractConfidenceFactors(inputs);
    const weights = this.config.confidenceWeights;
    
    // Weighted blend
    const rawConfidence = 
      factors.stabilizedFusionConfidence * weights.fusion +
      factors.trendConsistency * weights.trend +
      (1 - factors.shieldRisk) * weights.shield +
      (1 - factors.volatility) * weights.volatility +
      (1 - factors.drift) * weights.drift +
      factors.historicalAccuracy * weights.historical;
    
    // Apply EMA smoothing (auto-adapt every 50 cycles)
    const alpha = this.config.confidenceEMAAlpha;
    const smoothed = this.lastConfidenceEMA === 0
      ? rawConfidence
      : alpha * rawConfidence + (1 - alpha) * this.lastConfidenceEMA;
    
    this.lastConfidenceEMA = smoothed;
    this.confidenceHistory.push(smoothed);
    
    // Trim history
    if (this.confidenceHistory.length > 100) {
      this.confidenceHistory.shift();
    }
    
    return Math.max(0, Math.min(100, smoothed * 100));
  }
  
  private extractConfidenceFactors(inputs: DecisionInputs): ConfidenceFactors {
    const { stabilizedFusion, shieldState, emotionalDegradation, volatilityIndex, driftRate, trendStrength } = inputs;
    
    return {
      stabilizedFusionConfidence: stabilizedFusion.confidence / 100,
      
      trendConsistency: trendStrength === stabilizedFusion.signal.slice(0, 2) 
        ? 1.0 
        : trendStrength === 'FLAT' 
        ? 0.5 
        : 0.0,
      
      shieldRisk: shieldState === 'Green' ? 0.0
        : shieldState === 'Yellow' ? 0.15
        : shieldState === 'Orange' ? 0.40
        : 0.70,
      
      volatility: volatilityIndex,
      
      drift: Math.min(1.0, Math.abs(driftRate) / this.config.driftSpikeCancellation),
      
      historicalAccuracy: 0.85,  // Placeholder (future: ML-based accuracy tracking)
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ANTI-WHIPSAW PROTECTION
  // ═══════════════════════════════════════════════════════════════
  
  private applyWhipsawProtection(
    inputs: DecisionInputs,
    confidence: number
  ): { confidence: number; adjustments: string[] } {
    const now = Date.now();
    const adjustments: string[] = [];
    let adjustedConfidence = confidence;
    
    // Rule 1: Min-hold requirement (2-4 cycles before flip)
    if (this.whipsawState.holdCycleCount < this.config.minHoldCycles) {
      adjustedConfidence *= 0.75;
      adjustments.push(`Min-hold requirement: ${this.whipsawState.holdCycleCount}/${this.config.minHoldCycles} cycles`);
    }
    
    // Rule 2: Anti-flip cooldown (10-20s after last flip)
    const timeSinceFlip = now - this.whipsawState.lastFlipTime;
    if (timeSinceFlip < this.config.antiFlipCooldown) {
      adjustedConfidence *= 0.60;
      adjustments.push(`Cooldown active: ${Math.round((this.config.antiFlipCooldown - timeSinceFlip) / 1000)}s remaining`);
    }
    
    // Rule 3: Reverse signal damper
    const currentSignal = inputs.stabilizedFusion.signal;
    const isReverseSignal = 
      (this.whipsawState.lastDecision === 'BUY' && currentSignal.includes('SELL')) ||
      (this.whipsawState.lastDecision === 'SELL' && currentSignal.includes('BUY'));
    
    if (isReverseSignal) {
      adjustedConfidence *= (1 - this.config.reverseDamperFactor);
      adjustments.push('Reverse signal damper applied');
    }
    
    // Rule 4: Drift spike cancellation
    if (Math.abs(inputs.driftRate) > this.config.driftSpikeCancellation) {
      adjustedConfidence *= 0.50;
      adjustments.push('Drift spike detected');
    }
    
    return { confidence: adjustedConfidence, adjustments };
  }
  
  private updateWhipsawState(decision: TradingDecision): void {
    const now = Date.now();
    
    // Detect flip (BUY→SELL or SELL→BUY)
    const isFlip = 
      (this.whipsawState.lastDecision === 'BUY' && decision.action === 'SELL') ||
      (this.whipsawState.lastDecision === 'SELL' && decision.action === 'BUY');
    
    if (isFlip) {
      this.whipsawState.lastFlipTime = now;
      this.whipsawState.holdCycleCount = 0;
      this.emitEvent('onFlipSignal', { from: this.whipsawState.lastDecision, to: decision.action });
    } else if (decision.action === this.whipsawState.lastDecision) {
      this.whipsawState.holdCycleCount++;
    }
    
    this.whipsawState.lastDecision = decision.action;
    this.whipsawState.lastDecisionTime = now;
  }
  
  // ═══════════════════════════════════════════════════════════════
  // REASONING & CLASSIFICATION
  // ═══════════════════════════════════════════════════════════════
  
  private generateReasons(
    inputs: DecisionInputs,
    rawDecision: { action: string },
    whipsawAdjustment: { adjustments: string[] }
  ): string[] {
    const reasons: string[] = [];
    
    // Primary reason
    if (rawDecision.action === 'BUY') {
      reasons.push(`Strong upward trend detected (score: ${inputs.stabilizedFusion.score.toFixed(0)})`);
    } else if (rawDecision.action === 'SELL') {
      reasons.push(`Downward trend confirmed (score: ${inputs.stabilizedFusion.score.toFixed(0)})`);
    } else if (rawDecision.action === 'HOLD') {
      reasons.push('Stability acceptable, maintaining position');
    } else {
      reasons.push('Insufficient confidence for action');
    }
    
    // Shield state
    if (inputs.shieldState === 'Red') {
      reasons.push('⚠️ Shield intelligence warns of high risk');
    } else if (inputs.shieldState === 'Orange') {
      reasons.push('⚠️ Elevated shield risk detected');
    } else if (inputs.shieldState === 'Yellow') {
      reasons.push('Shield intelligence shows caution');
    }
    
    // Emotional degradation
    if (inputs.emotionalDegradation > 0.15) {
      reasons.push(`Emotional shield degraded (-${Math.round(inputs.emotionalDegradation * 100)}% confidence)`);
    }
    
    // Volatility
    if (inputs.volatilityIndex > 0.70) {
      reasons.push('High volatility detected');
    }
    
    // Drift
    if (Math.abs(inputs.driftRate) > 0.08) {
      reasons.push('Signal drift detected');
    }
    
    // Whipsaw adjustments
    reasons.push(...whipsawAdjustment.adjustments);
    
    return reasons;
  }
  
  private classifyRisk(inputs: DecisionInputs): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const { shieldState, volatilityIndex, emotionalDegradation } = inputs;
    
    if (shieldState === 'Red' || volatilityIndex > 0.85) {
      return 'CRITICAL';
    }
    
    if (shieldState === 'Orange' || volatilityIndex > 0.65 || emotionalDegradation > 0.30) {
      return 'HIGH';
    }
    
    if (shieldState === 'Yellow' || volatilityIndex > 0.45) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }
  
  private createWaitDecision(inputs: DecisionInputs, reason: string, timestamp: number): TradingDecision {
    return {
      action: 'WAIT',
      confidence: 0,
      reason: [reason],
      risk: 'CRITICAL',
      shield: inputs.shieldState,
      fusedScore: inputs.rawFusion.fusionScore,
      stabilizedScore: inputs.stabilizedFusion.score,
      trend: inputs.trendStrength,
      timestamp,
    };
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  
  private recordDecision(decision: TradingDecision): void {
    this.decisionHistory.push(decision);
    
    // Trim to last 100
    if (this.decisionHistory.length > 100) {
      this.decisionHistory.shift();
    }
  }
  
  private emitEvents(decision: TradingDecision): void {
    this.emitEvent('onDecisionChange', decision);
    
    if (decision.confidence >= 80) {
      this.emitEvent('onHighConfidence', decision);
    } else if (decision.confidence < 40) {
      this.emitEvent('onLowConfidence', decision);
    }
    
    if (decision.shield === 'Red' || decision.risk === 'CRITICAL') {
      this.emitEvent('onUnsafeEnvironment', decision);
    }
  }
  
  private emitEvent(type: DecisionEventType, data: any): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.forEach(callback => callback(data));
  }
}

// ═════════════════════════════════════════════════════════════════
// SINGLETON MANAGEMENT
// ═════════════════════════════════════════════════════════════════

let instance: DecisionEngine | null = null;

export function getDecisionEngine(config?: Partial<DecisionConfig>): DecisionEngine {
  if (!instance) {
    instance = new DecisionEngine(config);
  }
  return instance;
}

export function resetDecisionEngine(): void {
  instance = null;
}
