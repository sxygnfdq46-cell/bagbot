/**
 * ═══════════════════════════════════════════════════════════════════
 * 🚀 META SIGNAL ENGINE — Level 21 (Phase 1: Scaffolding)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * The "Supervisor of Supervisors" — sits above all intelligence systems
 * and determines BagBot's final state of readiness before trading.
 * 
 * ORCHESTRATES:
 * • FusionEngine
 * • FusionStabilizer
 * • DecisionEngine
 * • TradingPipelineCore
 * • Shield Intelligence
 * • Prediction Horizon
 * • Risk Scoring
 * • Threat Clustering
 * 
 * PROVIDES:
 * • Market State Classification (7 states)
 * • Readiness Score (0-100)
 * • Daily Trading Enforcement
 * • Intelligent Mode Switching
 * • Trade Window Management
 * • Event Broadcasting
 * 
 * MISSION:
 * "BagBot must trade every day — safely."
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import type {
  FusionOutput,
  StabilizedFusion,
  IntelligenceSnapshot,
  TechnicalSnapshot,
} from '../../frontend/src/engine/fusion/FusionTypes';

import type { FinalDecisionSnapshot } from './FusionDecisionBridge';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Market state classifications
 */
export enum MarketState {
  STRONG_TREND = 'STRONG_TREND',
  WEAK_TREND = 'WEAK_TREND',
  RANGING = 'RANGING',
  LOW_VOLATILITY_COMPRESSION = 'LOW_VOLATILITY_COMPRESSION',
  HIGH_VOLATILITY_EXPANSION = 'HIGH_VOLATILITY_EXPANSION',
  DIRTY_CHOPPY = 'DIRTY_CHOPPY',
  ILLIQUID_DANGEROUS = 'ILLIQUID_DANGEROUS',
}

/**
 * Trading modes (auto-selected by MetaSignalEngine)
 */
export enum TradingMode {
  TREND = 'TREND',
  RANGE = 'RANGE',
  SCALP = 'SCALP',
  COMPRESSION_BREAKOUT = 'COMPRESSION_BREAKOUT',
  CHAOS_DEFENSE = 'CHAOS_DEFENSE',
}

/**
 * Readiness levels
 */
export enum ReadinessLevel {
  TRADING_ALLOWED = 'TRADING_ALLOWED',      // 65-100
  LIGHT_SCANNING = 'LIGHT_SCANNING',        // 40-64
  STRICT_HOLD = 'STRICT_HOLD',              // 0-39
}

/**
 * Trade window state
 */
export enum TradeWindowState {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  EXPIRED = 'EXPIRED',
  TRANSITIONING = 'TRANSITIONING',
}

/**
 * Daily opportunity mode state
 */
export enum DailyOpportunityState {
  INACTIVE = 'INACTIVE',
  MONITORING = 'MONITORING',
  THRESHOLD_SOFTENING = 'THRESHOLD_SOFTENING',
  ACTIVE = 'ACTIVE',
}

/**
 * Meta signal output — the ultimate trading readiness package
 */
export interface MetaSignalOutput {
  // Core readiness
  readinessScore: number;                   // 0-100
  readinessLevel: ReadinessLevel;
  safeToTrade: boolean;
  
  // Market classification
  marketState: MarketState;
  tradingMode: TradingMode;
  
  // Window management
  tradeWindow: TradeWindowState;
  windowOpenedAt?: number;
  windowExpiresAt?: number;
  
  // Daily enforcement
  dailyOpportunity: DailyOpportunityState;
  hoursSinceLastTrade: number;
  tradesCompletedToday: number;
  
  // Intelligence inputs
  fusionScore: number;
  stabilizedScore: number;
  driftScore: number;
  noiseLevel: number;
  shieldRisk: number;
  predictionAlignment: number;
  volatilityProfile: number;
  liquidityScore: number;
  
  // Reasoning
  reasoning: string[];
  warnings: string[];
  
  timestamp: number;
}

/**
 * Readiness components breakdown
 */
export interface ReadinessComponents {
  fusionComponent: number;          // 0-100 (weight: 30%)
  stabilityComponent: number;       // 0-100 (weight: 20%)
  shieldComponent: number;          // 0-100 (weight: 20%)
  predictionComponent: number;      // 0-100 (weight: 15%)
  liquidityComponent: number;       // 0-100 (weight: 10%)
  volatilityComponent: number;      // 0-100 (weight: 5%)
}

/**
 * Market conditions snapshot
 */
export interface MarketConditions {
  trendStrength: number;            // 0-100
  volatility: number;               // 0-100
  liquidity: number;                // 0-100
  spread: number;                   // in pips
  orderBookImbalance: number;       // -1 to 1
  timeOfDay: 'ASIAN' | 'LONDON' | 'NY' | 'OVERLAP' | 'DEAD';
  isDangerousHours: boolean;
}

/**
 * Daily trading stats
 */
export interface DailyTradingStats {
  tradesCompleted: number;
  lastTradeTime: number | null;
  hoursSinceLastTrade: number;
  opportunityModeActivatedAt: number | null;
  windowsOpened: number;
  windowsClosed: number;
}

/**
 * Meta signal configuration
 */
export interface MetaSignalConfig {
  // Readiness thresholds
  readiness: {
    tradingAllowed: number;         // Default: 65
    lightScanning: number;          // Default: 40
    strictHold: number;             // Default: 0
  };
  
  // Readiness weights
  weights: {
    fusion: number;                 // Default: 0.30
    stability: number;              // Default: 0.20
    shield: number;                 // Default: 0.20
    prediction: number;             // Default: 0.15
    liquidity: number;              // Default: 0.10
    volatility: number;             // Default: 0.05
  };
  
  // Daily enforcement
  dailyEnforcement: {
    enabled: boolean;               // Default: true
    softThresholdHours: number;     // Default: 18
    opportunityModeHours: number;   // Default: 22
    maxTradesPerDay: number;        // Default: 10
  };
  
  // Window management
  windowManagement: {
    minWindowDuration: number;      // Default: 300000 (5 min)
    maxWindowDuration: number;      // Default: 3600000 (1 hour)
    cooldownAfterTrade: number;     // Default: 600000 (10 min)
  };
  
  // Market state thresholds
  marketStateThresholds: {
    strongTrendMin: number;         // Default: 70
    weakTrendMin: number;           // Default: 40
    compressionMax: number;         // Default: 20
    expansionMin: number;           // Default: 80
    chopThreshold: number;          // Default: 0.6
  };
}

/**
 * Meta signal event types
 */
export type MetaSignalEventType =
  | 'market-state-change'
  | 'readiness-change'
  | 'daily-opportunity-mode-activated'
  | 'trade-window-opened'
  | 'trade-window-closed'
  | 'safe-to-trade'
  | 'unsafe-to-trade'
  | 'mode-switch'
  | 'threshold-softened';

type MetaSignalEventCallback = (data: any) => void;
type UnsubscribeFn = () => void;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// META SIGNAL ENGINE CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class MetaSignalEngine {
  private static instance: MetaSignalEngine;
  
  private config: MetaSignalConfig;
  private currentState: MetaSignalOutput | null = null;
  private stateHistory: MetaSignalOutput[] = [];
  private dailyStats: DailyTradingStats;
  private eventListeners: Map<MetaSignalEventType, MetaSignalEventCallback[]> = new Map();
  
  // State tracking
  private lastMarketState: MarketState = MarketState.RANGING;
  private lastTradingMode: TradingMode = TradingMode.RANGE;
  private currentWindow: TradeWindowState = TradeWindowState.CLOSED;
  private windowOpenTime: number | null = null;
  private lastSafeToTrade: boolean = false;

  private constructor(config?: Partial<MetaSignalConfig>) {
    this.config = this.initializeConfig(config);
    this.dailyStats = this.initializeDailyStats();
  }

  /**
   * Singleton accessor
   */
  static getInstance(config?: Partial<MetaSignalConfig>): MetaSignalEngine {
    if (!MetaSignalEngine.instance) {
      MetaSignalEngine.instance = new MetaSignalEngine(config);
    }
    return MetaSignalEngine.instance;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUBLIC API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Generate meta signal from all intelligence inputs
   * 
   * This is the main entry point that orchestrates all systems.
   */
  async generateMetaSignal(
    fusion: FusionOutput,
    stabilized: StabilizedFusion,
    decision: FinalDecisionSnapshot,
    intelligence: IntelligenceSnapshot,
    technical: TechnicalSnapshot
  ): Promise<MetaSignalOutput> {
    // 1. Extract market conditions
    const conditions = this.extractMarketConditions(technical, intelligence);
    
    // 2. Classify market state
    const marketState = this.classifyMarketState(conditions, fusion, stabilized);
    
    // 3. Calculate readiness components
    const components = this.calculateReadinessComponents(
      fusion,
      stabilized,
      decision,
      intelligence,
      conditions
    );
    
    // 4. Calculate overall readiness score
    const readinessScore = this.calculateReadinessScore(components);
    const readinessLevel = this.determineReadinessLevel(readinessScore);
    
    // 5. Determine trading mode
    const tradingMode = this.determineTradingMode(marketState, conditions, readinessScore);
    
    // 6. Update daily stats
    this.updateDailyStats();
    
    // 7. Check daily enforcement
    const dailyOpportunity = this.checkDailyEnforcement(readinessScore);
    
    // 8. Manage trade windows
    const { tradeWindow, windowOpenedAt, windowExpiresAt } = this.manageTradeWindow(
      readinessScore,
      marketState,
      dailyOpportunity
    );
    
    // 9. Determine if safe to trade
    const safeToTrade = this.determineSafeToTrade(
      readinessScore,
      readinessLevel,
      tradeWindow,
      marketState
    );
    
    // 10. Generate reasoning
    const { reasoning, warnings } = this.generateReasoning(
      marketState,
      readinessScore,
      readinessLevel,
      safeToTrade,
      dailyOpportunity,
      components
    );
    
    // 11. Create meta signal output
    const metaSignal: MetaSignalOutput = {
      readinessScore,
      readinessLevel,
      safeToTrade,
      marketState,
      tradingMode,
      tradeWindow,
      windowOpenedAt,
      windowExpiresAt,
      dailyOpportunity,
      hoursSinceLastTrade: this.dailyStats.hoursSinceLastTrade,
      tradesCompletedToday: this.dailyStats.tradesCompleted,
      fusionScore: fusion.fusionScore,
      stabilizedScore: stabilized.score,
      driftScore: this.calculateDriftScore(stabilized),
      noiseLevel: this.calculateNoiseLevel(fusion, stabilized),
      shieldRisk: intelligence.riskLevel,
      predictionAlignment: this.calculatePredictionAlignment(intelligence),
      volatilityProfile: conditions.volatility,
      liquidityScore: conditions.liquidity,
      reasoning,
      warnings,
      timestamp: Date.now(),
    };
    
    // 12. Emit events
    this.emitEvents(metaSignal);
    
    // 13. Store state
    this.currentState = metaSignal;
    this.stateHistory.push(metaSignal);
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }
    
    return metaSignal;
  }

  /**
   * Get current meta signal state
   */
  getCurrentState(): MetaSignalOutput | null {
    return this.currentState;
  }

  /**
   * Get state history
   */
  getStateHistory(limit: number = 50): MetaSignalOutput[] {
    return this.stateHistory.slice(-limit);
  }

  /**
   * Get daily trading stats
   */
  getDailyStats(): DailyTradingStats {
    return { ...this.dailyStats };
  }

  /**
   * Record trade completion (updates daily stats)
   */
  recordTradeCompletion(): void {
    this.dailyStats.tradesCompleted++;
    this.dailyStats.lastTradeTime = Date.now();
    this.dailyStats.hoursSinceLastTrade = 0;
  }

  /**
   * Reset daily stats (call at market open or midnight)
   */
  resetDailyStats(): void {
    this.dailyStats = this.initializeDailyStats();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MetaSignalConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MARKET STATE CLASSIFICATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Classify market state (7 states)
   * 
   * Phase 1: Placeholder implementation
   * Phase 2: Full ML-based classification
   */
  private classifyMarketState(
    conditions: MarketConditions,
    fusion: FusionOutput,
    stabilized: StabilizedFusion
  ): MarketState {
    // TODO Phase 2: Implement full classification logic
    
    // Placeholder logic
    if (conditions.isDangerousHours) {
      return MarketState.ILLIQUID_DANGEROUS;
    }
    
    if (conditions.trendStrength >= this.config.marketStateThresholds.strongTrendMin) {
      return MarketState.STRONG_TREND;
    }
    
    if (conditions.volatility >= this.config.marketStateThresholds.expansionMin) {
      return MarketState.HIGH_VOLATILITY_EXPANSION;
    }
    
    if (conditions.volatility <= this.config.marketStateThresholds.compressionMax) {
      return MarketState.LOW_VOLATILITY_COMPRESSION;
    }
    
    if (conditions.trendStrength >= this.config.marketStateThresholds.weakTrendMin) {
      return MarketState.WEAK_TREND;
    }
    
    // Default to ranging
    return MarketState.RANGING;
  }

  /**
   * Extract market conditions from technical data
   * 
   * Phase 1: Basic extraction
   * Phase 2: Advanced order book analysis
   */
  private extractMarketConditions(
    technical: TechnicalSnapshot,
    intelligence: IntelligenceSnapshot
  ): MarketConditions {
    // TODO Phase 2: Implement full extraction logic
    
    // Placeholder
    return {
      trendStrength: Math.abs(technical.momentum),
      volatility: Math.abs(technical.rsi - 50) * 2,
      liquidity: 50, // Placeholder
      spread: 0.0001, // Placeholder
      orderBookImbalance: 0, // Placeholder
      timeOfDay: this.getTimeOfDay(),
      isDangerousHours: this.isDangerousHours(),
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READINESS CALCULATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Calculate readiness components
   * 
   * Phase 1: Basic calculation
   * Phase 2: Advanced weighted scoring
   */
  private calculateReadinessComponents(
    fusion: FusionOutput,
    stabilized: StabilizedFusion,
    decision: FinalDecisionSnapshot,
    intelligence: IntelligenceSnapshot,
    conditions: MarketConditions
  ): ReadinessComponents {
    // TODO Phase 2: Implement sophisticated scoring
    
    return {
      fusionComponent: stabilized.score,
      stabilityComponent: stabilized.confidence,
      shieldComponent: 100 - intelligence.riskLevel,
      predictionComponent: 50, // Placeholder
      liquidityComponent: conditions.liquidity,
      volatilityComponent: 100 - Math.abs(conditions.volatility - 50),
    };
  }

  /**
   * Calculate overall readiness score (0-100)
   */
  private calculateReadinessScore(components: ReadinessComponents): number {
    const weights = this.config.weights;
    
    const score =
      components.fusionComponent * weights.fusion +
      components.stabilityComponent * weights.stability +
      components.shieldComponent * weights.shield +
      components.predictionComponent * weights.prediction +
      components.liquidityComponent * weights.liquidity +
      components.volatilityComponent * weights.volatility;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine readiness level from score
   */
  private determineReadinessLevel(score: number): ReadinessLevel {
    if (score >= this.config.readiness.tradingAllowed) {
      return ReadinessLevel.TRADING_ALLOWED;
    }
    if (score >= this.config.readiness.lightScanning) {
      return ReadinessLevel.LIGHT_SCANNING;
    }
    return ReadinessLevel.STRICT_HOLD;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRADING MODE DETERMINATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Determine optimal trading mode
   * 
   * Phase 1: Rule-based selection
   * Phase 2: ML-based adaptive selection
   */
  private determineTradingMode(
    marketState: MarketState,
    conditions: MarketConditions,
    readinessScore: number
  ): TradingMode {
    // TODO Phase 2: Implement adaptive mode selection
    
    switch (marketState) {
      case MarketState.STRONG_TREND:
      case MarketState.WEAK_TREND:
        return TradingMode.TREND;
      
      case MarketState.RANGING:
        return TradingMode.RANGE;
      
      case MarketState.LOW_VOLATILITY_COMPRESSION:
        return TradingMode.COMPRESSION_BREAKOUT;
      
      case MarketState.HIGH_VOLATILITY_EXPANSION:
        return TradingMode.SCALP;
      
      case MarketState.DIRTY_CHOPPY:
      case MarketState.ILLIQUID_DANGEROUS:
        return TradingMode.CHAOS_DEFENSE;
      
      default:
        return TradingMode.RANGE;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DAILY ENFORCEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Check daily enforcement rules
   * 
   * Implements: "BagBot must trade every day — safely."
   */
  private checkDailyEnforcement(readinessScore: number): DailyOpportunityState {
    if (!this.config.dailyEnforcement.enabled) {
      return DailyOpportunityState.INACTIVE;
    }
    
    const hours = this.dailyStats.hoursSinceLastTrade;
    
    // Check if opportunity mode was already activated
    if (this.dailyStats.opportunityModeActivatedAt) {
      return DailyOpportunityState.ACTIVE;
    }
    
    // Check if threshold softening needed
    if (hours >= this.config.dailyEnforcement.softThresholdHours && 
        hours < this.config.dailyEnforcement.opportunityModeHours) {
      return DailyOpportunityState.THRESHOLD_SOFTENING;
    }
    
    // Check if opportunity mode should activate
    if (hours >= this.config.dailyEnforcement.opportunityModeHours) {
      this.activateOpportunityMode();
      return DailyOpportunityState.ACTIVE;
    }
    
    return DailyOpportunityState.MONITORING;
  }

  /**
   * Activate daily opportunity mode
   */
  private activateOpportunityMode(): void {
    this.dailyStats.opportunityModeActivatedAt = Date.now();
    this.emit('daily-opportunity-mode-activated', {
      hoursSinceLastTrade: this.dailyStats.hoursSinceLastTrade,
      tradesCompleted: this.dailyStats.tradesCompleted,
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRADE WINDOW MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Manage trade windows
   * 
   * Opens/closes windows based on readiness and conditions
   */
  private manageTradeWindow(
    readinessScore: number,
    marketState: MarketState,
    dailyOpportunity: DailyOpportunityState
  ): {
    tradeWindow: TradeWindowState;
    windowOpenedAt?: number;
    windowExpiresAt?: number;
  } {
    const now = Date.now();
    
    // Check if window should be opened
    const shouldOpen = 
      readinessScore >= this.config.readiness.tradingAllowed &&
      marketState !== MarketState.ILLIQUID_DANGEROUS &&
      this.currentWindow === TradeWindowState.CLOSED;
    
    if (shouldOpen) {
      this.openTradeWindow();
      return {
        tradeWindow: TradeWindowState.OPEN,
        windowOpenedAt: now,
        windowExpiresAt: now + this.config.windowManagement.maxWindowDuration,
      };
    }
    
    // Check if window should be closed
    const shouldClose =
      readinessScore < this.config.readiness.lightScanning ||
      marketState === MarketState.ILLIQUID_DANGEROUS;
    
    if (shouldClose && this.currentWindow === TradeWindowState.OPEN) {
      this.closeTradeWindow();
      return {
        tradeWindow: TradeWindowState.CLOSED,
      };
    }
    
    // Check if window expired
    if (this.windowOpenTime && 
        now - this.windowOpenTime > this.config.windowManagement.maxWindowDuration) {
      this.currentWindow = TradeWindowState.EXPIRED;
    }
    
    return {
      tradeWindow: this.currentWindow,
      windowOpenedAt: this.windowOpenTime ?? undefined,
      windowExpiresAt: this.windowOpenTime 
        ? this.windowOpenTime + this.config.windowManagement.maxWindowDuration
        : undefined,
    };
  }

  /**
   * Open trade window
   */
  private openTradeWindow(): void {
    this.currentWindow = TradeWindowState.OPEN;
    this.windowOpenTime = Date.now();
    this.dailyStats.windowsOpened++;
    
    this.emit('trade-window-opened', {
      timestamp: this.windowOpenTime,
    });
  }

  /**
   * Close trade window
   */
  private closeTradeWindow(): void {
    this.currentWindow = TradeWindowState.CLOSED;
    this.dailyStats.windowsClosed++;
    
    this.emit('trade-window-closed', {
      timestamp: Date.now(),
      duration: this.windowOpenTime ? Date.now() - this.windowOpenTime : 0,
    });
    
    this.windowOpenTime = null;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HELPER METHODS (Phase 1: Placeholders)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private calculateDriftScore(stabilized: StabilizedFusion): number {
    // TODO Phase 2: Implement drift calculation
    return 0;
  }

  private calculateNoiseLevel(fusion: FusionOutput, stabilized: StabilizedFusion): number {
    // TODO Phase 2: Implement noise calculation
    return Math.abs(fusion.fusionScore - stabilized.score);
  }

  private calculatePredictionAlignment(intelligence: IntelligenceSnapshot): number {
    // TODO Phase 2: Implement prediction alignment
    return 50;
  }

  private getTimeOfDay(): MarketConditions['timeOfDay'] {
    const hour = new Date().getUTCHours();
    
    if (hour >= 0 && hour < 8) return 'ASIAN';
    if (hour >= 8 && hour < 12) return 'LONDON';
    if (hour >= 12 && hour < 16) return 'OVERLAP';
    if (hour >= 16 && hour < 22) return 'NY';
    return 'DEAD';
  }

  private isDangerousHours(): boolean {
    const timeOfDay = this.getTimeOfDay();
    return timeOfDay === 'DEAD';
  }

  private determineSafeToTrade(
    readinessScore: number,
    readinessLevel: ReadinessLevel,
    tradeWindow: TradeWindowState,
    marketState: MarketState
  ): boolean {
    return (
      readinessLevel === ReadinessLevel.TRADING_ALLOWED &&
      tradeWindow === TradeWindowState.OPEN &&
      marketState !== MarketState.ILLIQUID_DANGEROUS
    );
  }

  private generateReasoning(
    marketState: MarketState,
    readinessScore: number,
    readinessLevel: ReadinessLevel,
    safeToTrade: boolean,
    dailyOpportunity: DailyOpportunityState,
    components: ReadinessComponents
  ): { reasoning: string[]; warnings: string[] } {
    const reasoning: string[] = [];
    const warnings: string[] = [];
    
    reasoning.push(`Market state: ${marketState}`);
    reasoning.push(`Readiness: ${readinessScore.toFixed(1)} (${readinessLevel})`);
    
    if (safeToTrade) {
      reasoning.push('Safe to trade - all systems green');
    } else {
      reasoning.push('Not safe to trade - conditions not met');
    }
    
    if (dailyOpportunity === DailyOpportunityState.ACTIVE) {
      warnings.push('Daily opportunity mode active - expanded thresholds');
    }
    
    return { reasoning, warnings };
  }

  private updateDailyStats(): void {
    if (this.dailyStats.lastTradeTime) {
      const hoursSince = (Date.now() - this.dailyStats.lastTradeTime) / (1000 * 60 * 60);
      this.dailyStats.hoursSinceLastTrade = hoursSince;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INITIALIZATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private initializeConfig(config?: Partial<MetaSignalConfig>): MetaSignalConfig {
    return {
      readiness: {
        tradingAllowed: 65,
        lightScanning: 40,
        strictHold: 0,
      },
      weights: {
        fusion: 0.30,
        stability: 0.20,
        shield: 0.20,
        prediction: 0.15,
        liquidity: 0.10,
        volatility: 0.05,
      },
      dailyEnforcement: {
        enabled: true,
        softThresholdHours: 18,
        opportunityModeHours: 22,
        maxTradesPerDay: 10,
      },
      windowManagement: {
        minWindowDuration: 300000,      // 5 min
        maxWindowDuration: 3600000,     // 1 hour
        cooldownAfterTrade: 600000,     // 10 min
      },
      marketStateThresholds: {
        strongTrendMin: 70,
        weakTrendMin: 40,
        compressionMax: 20,
        expansionMin: 80,
        chopThreshold: 0.6,
      },
      ...config,
    };
  }

  private initializeDailyStats(): DailyTradingStats {
    return {
      tradesCompleted: 0,
      lastTradeTime: null,
      hoursSinceLastTrade: 24, // Start with 24 hours
      opportunityModeActivatedAt: null,
      windowsOpened: 0,
      windowsClosed: 0,
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT SYSTEM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  on(eventType: MetaSignalEventType, callback: MetaSignalEventCallback): UnsubscribeFn {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);
    
    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }

  private emit(eventType: MetaSignalEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[MetaSignalEngine] Event callback error:`, error);
        }
      });
    }
  }

  private emitEvents(metaSignal: MetaSignalOutput): void {
    // Market state change
    if (metaSignal.marketState !== this.lastMarketState) {
      this.emit('market-state-change', {
        from: this.lastMarketState,
        to: metaSignal.marketState,
      });
      this.lastMarketState = metaSignal.marketState;
    }
    
    // Trading mode change
    if (metaSignal.tradingMode !== this.lastTradingMode) {
      this.emit('mode-switch', {
        from: this.lastTradingMode,
        to: metaSignal.tradingMode,
      });
      this.lastTradingMode = metaSignal.tradingMode;
    }
    
    // Safe to trade status change
    if (metaSignal.safeToTrade !== this.lastSafeToTrade) {
      this.emit(metaSignal.safeToTrade ? 'safe-to-trade' : 'unsafe-to-trade', metaSignal);
      this.lastSafeToTrade = metaSignal.safeToTrade;
    }
    
    // Readiness change (if significant)
    if (this.currentState) {
      const delta = Math.abs(metaSignal.readinessScore - this.currentState.readinessScore);
      if (delta > 10) {
        this.emit('readiness-change', {
          from: this.currentState.readinessScore,
          to: metaSignal.readinessScore,
          delta,
        });
      }
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getMetaSignalEngine(config?: Partial<MetaSignalConfig>): MetaSignalEngine {
  return MetaSignalEngine.getInstance(config);
}

export default MetaSignalEngine;
