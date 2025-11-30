/**
 * ═══════════════════════════════════════════════════════════════════
 * 🧠 FUSION DECISION BRIDGE — Level 20.5
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Main orchestrator that unifies:
 * - FusionEngine.ts
 * - FusionStabilizer.ts
 * - DecisionEngine.ts
 * - TradingPipelineCore.ts
 * 
 * Into one seamless intelligence pipeline that outputs a unified
 * trading decision object with full protection guards.
 * 
 * PERFORMANCE REQUIREMENTS:
 * • < 3ms runtime
 * • 100% deterministic
 * • Never blocks UI
 * • Perfectly synchronized with Level 20 Fusion Pipeline
 * 
 * SAFETY GUARANTEES:
 * • 0 autonomous execution (analysis only, never executes)
 * • No signal if confidence < threshold
 * • Auto-WAIT if noise spikes
 * • Auto-HOLD if volatility > limit
 * • Auto-neutralize on cascade alerts (from shield)
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import type { 
  FusionOutput, 
  StabilizedFusion,
  IntelligenceSnapshot,
  TechnicalSnapshot 
} from '../../frontend/src/engine/fusion/FusionTypes';

import type { 
  TradingDecision,
  DecisionInputs 
} from './DecisionEngine';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Final decision snapshot — the ultimate trading intelligence output
 */
export interface FinalDecisionSnapshot {
  signal: "BUY" | "SELL" | "HOLD" | "WAIT";
  score: number;                      // 0-100
  confidence: number;                 // 0-1
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  stabilized: boolean;
  raw: FusionSnapshot;
  timestamp: number;
}

/**
 * Raw fusion data snapshot
 */
interface FusionSnapshot {
  timestamps: {
    raw: number;
    stabilized: number;
  };
  raw: FusionOutput;
  stabilized: StabilizedFusion;
}

/**
 * Event types emitted by the bridge
 */
export type BridgeEventType = 
  | 'decision-update'           // New decision generated
  | 'confidence-shift'          // Confidence changed significantly
  | 'risk-alert'                // Risk level increased
  | 'signal-stability-alert'    // Signal became unstable
  | 'neutralization-trigger';   // Shield forced neutralization

type BridgeEventCallback = (data: any) => void;
type UnsubscribeFn = () => void;

/**
 * Bridge configuration
 */
interface BridgeConfig {
  minConfidenceThreshold: number;     // Default: 0.60 (60%)
  noiseSpikeCancellation: number;     // Default: 0.12
  volatilityLimit: number;            // Default: 0.70
  enableShieldOverride: boolean;      // Default: true
  enableCascadeNeutralization: boolean; // Default: true
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUSION DECISION BRIDGE CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class FusionDecisionBridge {
  private static instance: FusionDecisionBridge;
  
  private config: BridgeConfig;
  private eventListeners: Map<BridgeEventType, BridgeEventCallback[]> = new Map();
  private lastDecision: FinalDecisionSnapshot | null = null;
  private decisionHistory: FinalDecisionSnapshot[] = [];
  
  private constructor(config?: Partial<BridgeConfig>) {
    this.config = {
      minConfidenceThreshold: 0.60,
      noiseSpikeCancellation: 0.12,
      volatilityLimit: 0.70,
      enableShieldOverride: true,
      enableCascadeNeutralization: true,
      ...config,
    };
  }
  
  /**
   * Singleton accessor
   */
  static getInstance(config?: Partial<BridgeConfig>): FusionDecisionBridge {
    if (!FusionDecisionBridge.instance) {
      FusionDecisionBridge.instance = new FusionDecisionBridge(config);
    }
    return FusionDecisionBridge.instance;
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUBLIC API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Process complete pipeline: Fusion → Stabilizer → Decision → Safety
   * 
   * This is the main entry point for generating trading decisions.
   * 
   * @param intelligence - Intelligence snapshot from ShieldIntelligenceAPI
   * @param technical - Technical data snapshot from market
   * @param decisionInputs - Additional decision context (shield state, etc.)
   * @returns Final decision snapshot with full metadata
   */
  async processDecision(
    intelligence: IntelligenceSnapshot,
    technical: TechnicalSnapshot,
    decisionInputs: Partial<DecisionInputs>
  ): Promise<FinalDecisionSnapshot> {
    const startTime = performance.now();
    
    // Step 1: Import engines (lazy loaded for performance)
    const { FusionEngine } = await import('../../frontend/src/engine/fusion/FusionEngine');
    const { FusionStabilizer } = await import('../../frontend/src/engine/fusion/FusionStabilizer');
    const { DecisionEngine } = await import('./DecisionEngine');
    
    // Step 2: Get singleton instances
    const fusionEngine = FusionEngine.getInstance();
    const stabilizer = FusionStabilizer.getInstance();
    const decisionEngine = new DecisionEngine();
    
    // Step 3: Compute raw fusion
    const rawFusion: FusionOutput = fusionEngine.computeFusion(intelligence, technical);
    
    // Step 4: Stabilize fusion
    const stabilizedFusion: StabilizedFusion = stabilizer.stabilize(rawFusion);
    
    // Step 5: Prepare decision inputs
    const fullDecisionInputs: DecisionInputs = {
      rawFusion,
      stabilizedFusion,
      shieldState: decisionInputs.shieldState || 'Green',
      emotionalDegradation: decisionInputs.emotionalDegradation || 0,
      executionWarning: decisionInputs.executionWarning || false,
      memoryUnstable: decisionInputs.memoryUnstable || false,
      volatilityIndex: rawFusion.volatility / 100, // Convert to 0-1
      trendStrength: this.mapTrendToStrength(technical.trend),
      driftRate: this.calculateDriftRate(stabilizedFusion.score),
    };
    
    // Step 6: Generate decision
    const decision: TradingDecision = decisionEngine.decide(fullDecisionInputs);
    
    // Step 7: Apply protection guards
    const protectedDecision = this.applyProtectionGuards(
      decision,
      stabilizedFusion,
      fullDecisionInputs
    );
    
    // Step 8: Create final snapshot
    const snapshot: FinalDecisionSnapshot = {
      signal: protectedDecision.action,
      score: protectedDecision.fusedScore,
      confidence: protectedDecision.confidence / 100, // Convert to 0-1
      risk: protectedDecision.risk,
      reason: protectedDecision.reason.join('; '),
      stabilized: true,
      raw: {
        timestamps: {
          raw: rawFusion.timestamp,
          stabilized: stabilizedFusion.timestamp,
        },
        raw: rawFusion,
        stabilized: stabilizedFusion,
      },
      timestamp: Date.now(),
    };
    
    // Step 9: Emit events
    this.emitEvents(snapshot, decision);
    
    // Step 10: Store history
    this.lastDecision = snapshot;
    this.decisionHistory.push(snapshot);
    if (this.decisionHistory.length > 100) {
      this.decisionHistory.shift();
    }
    
    // Step 11: Performance check
    const runtime = performance.now() - startTime;
    if (runtime > 3) {
      console.warn(`[FusionDecisionBridge] Runtime exceeded 3ms: ${runtime.toFixed(2)}ms`);
    }
    
    return snapshot;
  }
  
  /**
   * Get last decision
   */
  getLastDecision(): FinalDecisionSnapshot | null {
    return this.lastDecision;
  }
  
  /**
   * Get decision history
   */
  getDecisionHistory(limit: number = 50): FinalDecisionSnapshot[] {
    return this.decisionHistory.slice(-limit);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT SYSTEM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Subscribe to bridge events
   */
  on(eventType: BridgeEventType, callback: BridgeEventCallback): UnsubscribeFn {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Emit event to all subscribers
   */
  private emit(eventType: BridgeEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[FusionDecisionBridge] Event callback error:`, error);
        }
      });
    }
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROTECTION GUARDS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Apply protection guards to decision
   */
  private applyProtectionGuards(
    decision: TradingDecision,
    stabilized: StabilizedFusion,
    inputs: DecisionInputs
  ): TradingDecision {
    let action = decision.action;
    let confidence = decision.confidence;
    const reasons = [...decision.reason];
    
    // Guard 1: Confidence threshold
    if (confidence < this.config.minConfidenceThreshold * 100) {
      action = 'WAIT';
      reasons.push(`Confidence ${confidence.toFixed(0)}% below threshold ${(this.config.minConfidenceThreshold * 100).toFixed(0)}%`);
    }
    
    // Guard 2: Noise spike cancellation
    if (this.detectNoiseSpike(stabilized)) {
      action = 'WAIT';
      reasons.push('Noise spike detected - signal unstable');
      this.emit('signal-stability-alert', { stabilized, reason: 'noise-spike' });
    }
    
    // Guard 3: Volatility limit
    if (inputs.volatilityIndex > this.config.volatilityLimit) {
      action = 'HOLD';
      reasons.push(`Volatility ${(inputs.volatilityIndex * 100).toFixed(0)}% exceeds limit ${(this.config.volatilityLimit * 100).toFixed(0)}%`);
    }
    
    // Guard 4: Shield override (RED state = force WAIT)
    if (this.config.enableShieldOverride && inputs.shieldState === 'Red') {
      action = 'WAIT';
      reasons.push('Shield RED - unsafe trading environment');
      this.emit('neutralization-trigger', { 
        reason: 'shield-red',
        originalAction: decision.action,
        shieldState: inputs.shieldState 
      });
    }
    
    // Guard 5: Cascade neutralization
    if (this.config.enableCascadeNeutralization && inputs.emotionalDegradation > 0.7) {
      action = 'WAIT';
      reasons.push('High emotional degradation - cascade risk detected');
      this.emit('neutralization-trigger', { 
        reason: 'cascade-alert',
        originalAction: decision.action,
        degradation: inputs.emotionalDegradation 
      });
    }
    
    // Guard 6: Execution shield warning
    if (inputs.executionWarning) {
      confidence = Math.min(confidence, 60);
      reasons.push('Execution shield warning - confidence reduced');
    }
    
    // Guard 7: Memory instability
    if (inputs.memoryUnstable) {
      confidence = Math.min(confidence, 50);
      reasons.push('Memory shield unstable - confidence reduced');
    }
    
    return {
      ...decision,
      action,
      confidence,
      reason: reasons,
    };
  }
  
  /**
   * Detect noise spike in stabilized fusion
   */
  private detectNoiseSpike(stabilized: StabilizedFusion): boolean {
    if (this.decisionHistory.length < 3) return false;
    
    const recentScores = this.decisionHistory
      .slice(-3)
      .map(d => d.score);
    
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const deviation = Math.abs(stabilized.score - avgScore);
    
    return deviation > (this.config.noiseSpikeCancellation * 100);
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // UTILITY METHODS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  
  /**
   * Map technical trend to decision trend strength
   */
  private mapTrendToStrength(trend: 'up' | 'down' | 'sideways'): 'UP' | 'DOWN' | 'FLAT' {
    switch (trend) {
      case 'up': return 'UP';
      case 'down': return 'DOWN';
      case 'sideways': return 'FLAT';
    }
  }
  
  /**
   * Calculate drift rate from recent stabilized scores
   */
  private calculateDriftRate(currentScore: number): number {
    if (this.decisionHistory.length < 5) return 0;
    
    const recentScores = this.decisionHistory
      .slice(-5)
      .map(d => d.score);
    
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const drift = Math.abs(currentScore - avgScore) / 100; // Normalize to 0-1
    
    return drift;
  }
  
  /**
   * Emit appropriate events based on decision state
   */
  private emitEvents(snapshot: FinalDecisionSnapshot, decision: TradingDecision): void {
    // Always emit decision update
    this.emit('decision-update', {
      signal: snapshot.signal,
      confidence: snapshot.confidence,
      risk: snapshot.risk,
      timestamp: snapshot.timestamp,
    });
    
    // Emit confidence shift if significant change
    if (this.lastDecision) {
      const confidenceDelta = Math.abs(snapshot.confidence - this.lastDecision.confidence);
      if (confidenceDelta > 0.15) {
        this.emit('confidence-shift', {
          from: this.lastDecision.confidence,
          to: snapshot.confidence,
          delta: confidenceDelta,
        });
      }
    }
    
    // Emit high confidence
    if (snapshot.confidence > 0.85) {
      this.emit('confidence-shift', {
        level: 'high',
        confidence: snapshot.confidence,
        signal: snapshot.signal,
      });
    }
    
    // Emit low confidence
    if (snapshot.confidence < 0.45) {
      this.emit('confidence-shift', {
        level: 'low',
        confidence: snapshot.confidence,
        signal: snapshot.signal,
      });
    }
    
    // Emit risk alert if HIGH
    if (snapshot.risk === 'HIGH') {
      this.emit('risk-alert', {
        risk: snapshot.risk,
        score: snapshot.score,
        reason: snapshot.reason,
      });
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convenience function to get bridge instance
 */
export function getFusionDecisionBridge(config?: Partial<BridgeConfig>): FusionDecisionBridge {
  return FusionDecisionBridge.getInstance(config);
}

/**
 * Default export
 */
export default FusionDecisionBridge;
