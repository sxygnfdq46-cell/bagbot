/**
 * Market Flow Anticipation Engine (MFAE)
 * 
 * Real-time market flow analysis engine that detects genuine moves vs fake-outs.
 * Analyzes tick acceleration, liquidity tension, orderbook imbalances, and micro-volatility.
 * 
 * Performance Target: <8ms execution time
 * 
 * Key Features:
 * - Detects momentum shifts before they're obvious
 * - Identifies fake breakouts/breakdowns
 * - Measures liquidity stress and crisis conditions
 * - Analyzes orderbook pressure dynamics
 */

import type {
  FlowSnapshot,
  FlowIntentResult,
  FlowMetrics,
  LiquidityProfile,
  MFAEConfig,
  FlowIntent,
  FlowState,
  DEFAULT_MFAE_CONFIG,
} from './flowTypes';

import {
  calcTickAcceleration,
  calcLiquidityTension,
  calcImbalancePressure,
  calcMicroVolatility,
  calcCombinedFlowScore,
  detectFakeout,
  analyzeLiquidityProfile,
} from './flowCalculators';

import { DEFAULT_MFAE_CONFIG as defaultConfig } from './flowTypes';

/**
 * Market Flow Anticipation Engine
 * 
 * Singleton class for flow analysis
 */
export class MarketFlowAnticipation {
  private snapshot: FlowSnapshot | null = null;
  private snapshotHistory: FlowSnapshot[] = [];
  private config: MFAEConfig;
  private state: FlowState;
  
  private tickAccelResult: ReturnType<typeof calcTickAcceleration> | null = null;
  private liquidityTensionResult: ReturnType<typeof calcLiquidityTension> | null = null;
  private imbalanceResult: ReturnType<typeof calcImbalancePressure> | null = null;
  private volatilityResult: ReturnType<typeof calcMicroVolatility> | null = null;
  
  private lastResult: FlowIntentResult | null = null;
  
  private readonly maxHistorySize = 50; // Keep last 50 snapshots for analysis
  
  constructor(config: Partial<MFAEConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.state = {
      lastIntent: null,
      totalAnalyses: 0,
      bullishCount: 0,
      bearishCount: 0,
      stalledCount: 0,
      fakeMovesCount: 0,
      avgConfidence: 0,
      avgTickAccel: 0,
      avgLiquidityTension: 0,
      avgImbalance: 0,
      lastUpdate: Date.now(),
    };
  }
  
  /**
   * Load market snapshot for analysis
   */
  loadSnapshot(snapshot: FlowSnapshot): void {
    this.snapshot = snapshot;
    
    // Add to history
    this.snapshotHistory.push(snapshot);
    
    // Maintain history size
    if (this.snapshotHistory.length > this.maxHistorySize) {
      this.snapshotHistory.shift();
    }
  }
  
  /**
   * Compute tick acceleration
   */
  computeTickAccel(): {
    score: number;
    direction: "UP" | "DOWN" | "FLAT";
  } {
    if (!this.snapshot) {
      throw new Error("MFAE: No snapshot loaded. Call loadSnapshot() first.");
    }
    
    this.tickAccelResult = calcTickAcceleration(
      this.snapshot,
      this.snapshotHistory.slice(0, -1) // Exclude current snapshot
    );
    
    return {
      score: this.tickAccelResult.score,
      direction: this.tickAccelResult.direction,
    };
  }
  
  /**
   * Compute liquidity tension
   */
  computeLiquidityTension(): {
    score: number;
    direction: "INCREASING" | "DECREASING" | "STABLE";
    depthQuality: "DEEP" | "NORMAL" | "THIN" | "CRITICAL";
  } {
    if (!this.snapshot) {
      throw new Error("MFAE: No snapshot loaded.");
    }
    
    this.liquidityTensionResult = calcLiquidityTension(
      this.snapshot,
      this.snapshotHistory.slice(0, -1)
    );
    
    return {
      score: this.liquidityTensionResult.score,
      direction: this.liquidityTensionResult.direction,
      depthQuality: this.liquidityTensionResult.depthQuality,
    };
  }
  
  /**
   * Compute orderbook imbalance
   */
  computeOrderbookImbalance(): {
    score: number;
    strength: "WEAK" | "MODERATE" | "STRONG" | "EXTREME";
    bidAskRatio: number;
  } {
    if (!this.snapshot) {
      throw new Error("MFAE: No snapshot loaded.");
    }
    
    this.imbalanceResult = calcImbalancePressure(
      this.snapshot,
      this.snapshotHistory.slice(0, -1)
    );
    
    return {
      score: this.imbalanceResult.score,
      strength: this.imbalanceResult.strength,
      bidAskRatio: this.imbalanceResult.bidAskRatio,
    };
  }
  
  /**
   * Compute micro-volatility
   */
  computeMicroVolatility(): {
    score: number;
    trend: "RISING" | "FALLING" | "STABLE";
    priceRange: number;
  } {
    if (!this.snapshot) {
      throw new Error("MFAE: No snapshot loaded.");
    }
    
    this.volatilityResult = calcMicroVolatility(
      this.snapshot,
      this.snapshotHistory.slice(0, -1)
    );
    
    return {
      score: this.volatilityResult.score,
      trend: this.volatilityResult.trend,
      priceRange: this.volatilityResult.priceRange,
    };
  }
  
  /**
   * Compute flow intent from all metrics
   */
  computeFlowIntent(): FlowIntent {
    if (!this.tickAccelResult || !this.liquidityTensionResult || 
        !this.imbalanceResult || !this.volatilityResult) {
      throw new Error("MFAE: Must compute all metrics first");
    }
    
    const tickAccel = this.tickAccelResult.score;
    const liquidityTension = this.liquidityTensionResult.score;
    const imbalance = this.imbalanceResult.score;
    const volatility = this.volatilityResult.score;
    
    // Calculate combined flow score
    const flowScore = calcCombinedFlowScore(
      tickAccel,
      liquidityTension,
      imbalance,
      volatility,
      this.config.weights
    );
    
    // Check for fake-out
    const fakeoutCheck = this.config.enableFakeoutDetection 
      ? detectFakeout(
          tickAccel,
          liquidityTension,
          imbalance,
          volatility,
          {
            volatilityThreshold: this.config.fakeoutVolatilityThreshold,
            imbalanceThreshold: this.config.fakeoutImbalanceThreshold,
          }
        )
      : { isFakeout: false, confidence: 0, reasons: [] };
    
    // Determine intent
    let intent: FlowIntent;
    
    // Fake-out detection takes priority
    if (fakeoutCheck.isFakeout && fakeoutCheck.confidence >= 60) {
      intent = "FAKE_MOVE";
    }
    // Bullish flow
    else if (
      flowScore.direction === "BULLISH" &&
      flowScore.score >= this.config.minFlowScoreForBullish &&
      imbalance > this.config.minImbalanceForSignal
    ) {
      intent = "BULLISH";
    }
    // Bearish flow
    else if (
      flowScore.direction === "BEARISH" &&
      flowScore.score >= this.config.minFlowScoreForBearish &&
      imbalance < -this.config.minImbalanceForSignal
    ) {
      intent = "BEARISH";
    }
    // Stalled/No clear direction
    else {
      intent = "STALLED";
    }
    
    return intent;
  }
  
  /**
   * Get final flow signal with full analysis
   */
  getFinalFlowSignal(): FlowIntentResult {
    if (!this.snapshot) {
      throw new Error("MFAE: No snapshot loaded");
    }
    
    const startTime = performance.now();
    
    // Compute all metrics
    const tickAccel = this.computeTickAccel();
    const liquidityTension = this.computeLiquidityTension();
    const imbalance = this.computeOrderbookImbalance();
    const volatility = this.computeMicroVolatility();
    
    // Compute flow intent
    const flowIntent = this.computeFlowIntent();
    
    // Calculate combined flow score
    const flowScore = calcCombinedFlowScore(
      tickAccel.score,
      liquidityTension.score,
      imbalance.score,
      volatility.score,
      this.config.weights
    );
    
    // Build flow metrics
    const flowMetrics: FlowMetrics = {
      tickAccel: tickAccel.score,
      tickAccelDirection: tickAccel.direction,
      liquidityTension: liquidityTension.score,
      tensionDirection: liquidityTension.direction,
      imbalancePressure: imbalance.score,
      imbalanceStrength: imbalance.strength,
      microVolatility: volatility.score,
      volatilityTrend: volatility.trend,
      flowScore: flowScore.score,
      flowDirection: flowScore.direction,
    };
    
    // Analyze liquidity profile
    const liquidityProfile = this.buildLiquidityProfile();
    
    // Detect fake-out
    const fakeoutCheck = this.config.enableFakeoutDetection
      ? detectFakeout(
          tickAccel.score,
          liquidityTension.score,
          imbalance.score,
          volatility.score,
          {
            volatilityThreshold: this.config.fakeoutVolatilityThreshold,
            imbalanceThreshold: this.config.fakeoutImbalanceThreshold,
          }
        )
      : { isFakeout: false, confidence: 0, reasons: [] };
    
    // Calculate confidence
    const confidence = this.calculateConfidence(
      flowIntent,
      flowScore.score,
      tickAccel.score,
      liquidityTension.score,
      Math.abs(imbalance.score),
      volatility.score,
      fakeoutCheck.isFakeout
    );
    
    // Build reason array
    const reason = this.buildReasonArray(
      flowIntent,
      flowMetrics,
      liquidityProfile,
      fakeoutCheck
    );
    
    // Detect alerts
    const fakeoutDetected = fakeoutCheck.isFakeout;
    const liquidityCrisis = liquidityTension.score > this.config.maxLiquidityTension;
    const momentumShift = this.detectMomentumShift(flowIntent);
    
    const result: FlowIntentResult = {
      flowIntent,
      confidence,
      reason,
      timestamp: Date.now(),
      metrics: flowMetrics,
      liquidityProfile,
      tickAccel: tickAccel.score,
      liquidityTension: liquidityTension.score,
      imbalancePressure: imbalance.score,
      microVolatility: volatility.score,
      fakeoutDetected,
      liquidityCrisis,
      momentumShift,
    };
    
    // Update state
    this.updateState(result);
    
    // Store result
    this.lastResult = result;
    this.state.lastIntent = result;
    
    const executionTime = performance.now() - startTime;
    if (executionTime > 8) {
      console.warn(`MFAE: Slow execution (${executionTime.toFixed(2)}ms)`);
    }
    
    return result;
  }
  
  /**
   * Build liquidity profile
   */
  private buildLiquidityProfile(): LiquidityProfile {
    if (!this.snapshot) {
      throw new Error("MFAE: No snapshot");
    }
    
    const profile = analyzeLiquidityProfile(this.snapshot);
    
    return {
      totalDepth: profile.totalDepth,
      bidAskRatio: profile.bidAskRatio,
      imbalance: profile.imbalance,
      tension: this.liquidityTensionResult?.score || 0,
      topLayerBid: this.snapshot.bidDepth * 0.3, // Assume 30% in top layer
      topLayerAsk: this.snapshot.askDepth * 0.3,
      deepLayerBid: this.snapshot.bidDepth * 0.7, // Assume 70% in deep layers
      deepLayerAsk: this.snapshot.askDepth * 0.7,
      avgBidSize: profile.avgBidSize,
      avgAskSize: profile.avgAskSize,
      spreadQuality: profile.spreadQuality,
    };
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    intent: FlowIntent,
    flowScore: number,
    tickAccel: number,
    tension: number,
    imbalance: number,
    volatility: number,
    isFakeout: boolean
  ): number {
    let confidence = 50; // Base confidence
    
    // Add confidence for strong flow score
    if (flowScore > 70) confidence += 20;
    else if (flowScore > 50) confidence += 10;
    
    // Add confidence for strong imbalance
    if (imbalance > 50) confidence += 15;
    else if (imbalance > 30) confidence += 10;
    
    // Add confidence for high acceleration
    if (tickAccel > 60) confidence += 10;
    
    // Reduce confidence for high tension (unstable)
    if (tension > 70) confidence -= 20;
    else if (tension > 50) confidence -= 10;
    
    // Reduce confidence for high volatility (erratic)
    if (volatility > 70) confidence -= 15;
    else if (volatility > 50) confidence -= 10;
    
    // Reduce confidence for fake-out
    if (isFakeout) confidence -= 30;
    
    // Intent-specific adjustments
    if (intent === "FAKE_MOVE") confidence = Math.min(confidence, 40);
    else if (intent === "STALLED") confidence = Math.min(confidence, 60);
    
    return Math.max(0, Math.min(100, Math.round(confidence)));
  }
  
  /**
   * Build reason array
   */
  private buildReasonArray(
    intent: FlowIntent,
    metrics: FlowMetrics,
    profile: LiquidityProfile,
    fakeout: { isFakeout: boolean; reasons: string[] }
  ): string[] {
    const reasons: string[] = [];
    
    // Intent-specific reasons
    if (intent === "BULLISH") {
      reasons.push("🟢 BULLISH flow detected");
      reasons.push(`Flow score: ${metrics.flowScore}/100`);
      reasons.push(`Imbalance: +${metrics.imbalancePressure}/100 (buy pressure)`);
    } else if (intent === "BEARISH") {
      reasons.push("🔴 BEARISH flow detected");
      reasons.push(`Flow score: ${metrics.flowScore}/100`);
      reasons.push(`Imbalance: ${metrics.imbalancePressure}/100 (sell pressure)`);
    } else if (intent === "FAKE_MOVE") {
      reasons.push("⚠️  FAKE MOVE detected");
      reasons.push(...fakeout.reasons);
    } else {
      reasons.push("⏸️  Flow STALLED - no clear direction");
      reasons.push(`Flow score: ${metrics.flowScore}/100`);
    }
    
    // Tick acceleration
    reasons.push(`Tick accel: ${metrics.tickAccel}/100 (${metrics.tickAccelDirection})`);
    
    // Liquidity
    reasons.push(`Liquidity tension: ${metrics.liquidityTension}/100 (${metrics.tensionDirection})`);
    reasons.push(`Spread: ${profile.spreadQuality}`);
    
    // Volatility
    if (metrics.microVolatility > 60) {
      reasons.push(`⚠️  High volatility: ${metrics.microVolatility}/100`);
    }
    
    return reasons;
  }
  
  /**
   * Detect momentum shift
   */
  private detectMomentumShift(currentIntent: FlowIntent): boolean {
    if (!this.lastResult) return false;
    
    const prevIntent = this.lastResult.flowIntent;
    
    // Shift detected if intent changed significantly
    if (prevIntent === "BULLISH" && currentIntent === "BEARISH") return true;
    if (prevIntent === "BEARISH" && currentIntent === "BULLISH") return true;
    if ((prevIntent === "BULLISH" || prevIntent === "BEARISH") && currentIntent === "FAKE_MOVE") return true;
    
    return false;
  }
  
  /**
   * Update state after analysis
   */
  private updateState(result: FlowIntentResult): void {
    this.state.totalAnalyses++;
    
    // Count by intent
    switch (result.flowIntent) {
      case "BULLISH":
        this.state.bullishCount++;
        break;
      case "BEARISH":
        this.state.bearishCount++;
        break;
      case "STALLED":
        this.state.stalledCount++;
        break;
      case "FAKE_MOVE":
        this.state.fakeMovesCount++;
        break;
    }
    
    // Update averages
    const n = this.state.totalAnalyses;
    this.state.avgConfidence = (this.state.avgConfidence * (n - 1) + result.confidence) / n;
    this.state.avgTickAccel = (this.state.avgTickAccel * (n - 1) + result.tickAccel) / n;
    this.state.avgLiquidityTension = (this.state.avgLiquidityTension * (n - 1) + result.liquidityTension) / n;
    this.state.avgImbalance = (this.state.avgImbalance * (n - 1) + Math.abs(result.imbalancePressure)) / n;
    
    this.state.lastUpdate = Date.now();
  }
  
  /**
   * Get flow state
   */
  getFlowState(): FlowState {
    return { ...this.state };
  }
  
  /**
   * Get last result
   */
  getLastResult(): FlowIntentResult | null {
    return this.lastResult;
  }
  
  /**
   * Get snapshot history
   */
  getSnapshotHistory(): FlowSnapshot[] {
    return [...this.snapshotHistory];
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<MFAEConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Reset state
   */
  resetState(): void {
    this.state = {
      lastIntent: null,
      totalAnalyses: 0,
      bullishCount: 0,
      bearishCount: 0,
      stalledCount: 0,
      fakeMovesCount: 0,
      avgConfidence: 0,
      avgTickAccel: 0,
      avgLiquidityTension: 0,
      avgImbalance: 0,
      lastUpdate: Date.now(),
    };
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.snapshotHistory = [];
  }
}

// Singleton instance
let mfaeInstance: MarketFlowAnticipation | null = null;

/**
 * Get or create MFAE singleton instance
 */
export function getMFAE(config?: Partial<MFAEConfig>): MarketFlowAnticipation {
  if (!mfaeInstance) {
    mfaeInstance = new MarketFlowAnticipation(config);
  } else if (config) {
    mfaeInstance.updateConfig(config);
  }
  return mfaeInstance;
}

/**
 * Reset MFAE instance (for testing)
 */
export function resetMFAE(): void {
  mfaeInstance = null;
}
