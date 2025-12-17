/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎮 TRADE SIMULATION ENGINE — Level 20.6
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Full risk-free simulation sandbox that replays synthetic and
 * historical-like data through the complete trading intelligence pipeline.
 * 
 * PIPELINE FLOW:
 * Market Data → FusionEngine → Stabilizer → DecisionEngine → 
 * Safety Layers → TradingPipelineCore → Transaction Simulator → Analytics
 * 
 * FEATURES:
 * • Adjustable simulation clock (1x-20x speed)
 * • 3 market modes (Stable/Whipsaw/BlackSwan)
 * • Realistic OHLC candle generation
 * • Virtual trade execution with P/L tracking
 * • Full shield interaction testing
 * • Comprehensive analytics dashboard
 * • Real-time UI event streaming
 * 
 * PURPOSE:
 * BagBot learns behavior in simulation before touching live markets.
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import type {
  FusionOutput,
  StabilizedFusion,
  IntelligenceSnapshot,
  TechnicalSnapshot,
} from '../../frontend/src/engine/fusion/FusionTypes';

import type { TradingDecision } from './DecisionEngine';
import type { FinalDecisionSnapshot } from './FusionDecisionBridge';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Market simulation modes
 */
export type MarketMode = 'STABLE_TREND' | 'WHIPSAW_CHAOS' | 'BLACK_SWAN';

/**
 * Simulation speed multipliers
 */
export type SimulationSpeed = 1 | 2 | 5 | 10 | 20;

/**
 * Simulation state
 */
export type SimulationState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

/**
 * OHLC Candle
 */
export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Virtual trade
 */
export interface VirtualTrade {
  id: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  fusionScore: number;
  exitReason?: 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP' | 'INTELLIGENCE_OVERRIDE' | 'EMERGENCY_HALT' | 'MANUAL';
  pnl?: number;
  duration?: number;
}

/**
 * Simulation tick data
 */
export interface SimulationTick {
  tick: number;
  timestamp: number;
  candle: Candle;
  technical: TechnicalSnapshot;
  intelligence: IntelligenceSnapshot;
  fusion: FusionOutput;
  stabilized: StabilizedFusion;
  decision: FinalDecisionSnapshot;
  trade?: VirtualTrade;
  pnl: number;
  floatingPnl: number;
}

/**
 * Simulation analytics
 */
export interface SimulationAnalytics {
  totalTicks: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  largestGain: number;
  largestLoss: number;
  actionDistribution: {
    BUY: number;
    SELL: number;
    HOLD: number;
    WAIT: number;
  };
  avgFusionScore: number;
  avgConfidence: number;
  avgVolatility: number;
  riskDistribution: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
  shieldInteractions: {
    cascadeDetections: number;
    riskOverrides: number;
    driftWarnings: number;
    executionBlocks: number;
  };
}

/**
 * Simulation configuration
 */
export interface SimulationConfig {
  mode: MarketMode;
  speed: SimulationSpeed;
  duration: number; // ticks
  initialPrice: number;
  volatility: number; // 0-1
  symbol: string;
  enableShields: boolean;
  enableTrading: boolean;
  positionSize: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  trailingStopPercent: number;
}

/**
 * Simulation event types
 */
export type SimulationEventType =
  | 'tick'
  | 'trade-opened'
  | 'trade-closed'
  | 'decision-change'
  | 'shield-alert'
  | 'simulation-complete'
  | 'simulation-paused'
  | 'simulation-resumed';

type SimulationEventCallback = (data: any) => void;
type UnsubscribeFn = () => void;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRADE SIMULATION ENGINE CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class TradeSimulationEngine {
  private static instance: TradeSimulationEngine;

  private config: SimulationConfig;
  private state: SimulationState = 'IDLE';
  private currentTick: number = 0;
  private currentPrice: number;
  private tickHistory: SimulationTick[] = [];
  private openTrades: VirtualTrade[] = [];
  private closedTrades: VirtualTrade[] = [];
  private analytics: SimulationAnalytics;
  private eventListeners: Map<SimulationEventType, SimulationEventCallback[]> = new Map();
  private clockInterval: ReturnType<typeof setInterval> | null = null;
  private lastCandle: Candle | null = null;

  // Market generation state
  private trendDirection: number = 1; // 1 = up, -1 = down
  private trendStrength: number = 0.5;
  private volatilitySpike: number = 0;
  private emaPrice: number;

  private constructor(config: Partial<SimulationConfig> = {}) {
    this.config = {
      mode: 'STABLE_TREND',
      speed: 1,
      duration: 1000,
      initialPrice: 1.09000,
      volatility: 0.3,
      symbol: 'EUR/USD',
      enableShields: true,
      enableTrading: true,
      positionSize: 1000,
      stopLossPercent: 0.5,
      takeProfitPercent: 1.0,
      trailingStopPercent: 0.3,
      ...config,
    };

    this.currentPrice = this.config.initialPrice;
    this.emaPrice = this.config.initialPrice;

    this.analytics = this.initializeAnalytics();
  }

  /**
   * Singleton accessor
   */
  static getInstance(config?: Partial<SimulationConfig>): TradeSimulationEngine {
    if (!TradeSimulationEngine.instance || config) {
      TradeSimulationEngine.instance = new TradeSimulationEngine(config);
    }
    return TradeSimulationEngine.instance;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PUBLIC API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Start simulation
   */
  async start(): Promise<void> {
    if (this.state === 'RUNNING') {
      console.warn('[TradeSimulationEngine] Already running');
      return;
    }

    this.state = 'RUNNING';
    this.currentTick = 0;
    this.tickHistory = [];
    this.openTrades = [];
    this.closedTrades = [];
    this.analytics = this.initializeAnalytics();

    // Start simulation clock
    const tickInterval = 1000 / this.config.speed; // Adjust based on speed
    this.clockInterval = setInterval(() => {
      this.processTick();
    }, tickInterval);
  }

  /**
   * Pause simulation
   */
  pause(): void {
    if (this.state !== 'RUNNING') return;

    this.state = 'PAUSED';
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    this.emit('simulation-paused', {
      tick: this.currentTick,
      analytics: this.analytics,
    });
  }

  /**
   * Resume simulation
   */
  resume(): void {
    if (this.state !== 'PAUSED') return;

    this.state = 'RUNNING';
    const tickInterval = 1000 / this.config.speed;
    this.clockInterval = setInterval(() => {
      this.processTick();
    }, tickInterval);

    this.emit('simulation-resumed', {
      tick: this.currentTick,
    });
  }

  /**
   * Stop simulation
   */
  stop(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    this.state = 'COMPLETED';

    // Close any open trades
    this.openTrades.forEach(trade => {
      this.closeTrade(trade, 'MANUAL', this.currentPrice);
    });

    this.emit('simulation-complete', {
      analytics: this.analytics,
      tickHistory: this.tickHistory,
      closedTrades: this.closedTrades,
    });
  }

  /**
   * Get current state
   */
  getState(): SimulationState {
    return this.state;
  }

  /**
   * Get analytics
   */
  getAnalytics(): SimulationAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get tick history
   */
  getTickHistory(limit?: number): SimulationTick[] {
    return limit ? this.tickHistory.slice(-limit) : [...this.tickHistory];
  }

  /**
   * Get closed trades
   */
  getClosedTrades(limit?: number): VirtualTrade[] {
    return limit ? this.closedTrades.slice(-limit) : [...this.closedTrades];
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: SimulationSpeed): void {
    this.config.speed = speed;

    if (this.state === 'RUNNING' && this.clockInterval) {
      clearInterval(this.clockInterval);
      const tickInterval = 1000 / speed;
      this.clockInterval = setInterval(() => {
        this.processTick();
      }, tickInterval);
    }
  }

  /**
   * Set market mode
   */
  setMode(mode: MarketMode): void {
    this.config.mode = mode;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIMULATION CLOCK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Process single simulation tick
   */
  private async processTick(): Promise<void> {
    this.currentTick++;

    // Check if simulation complete
    if (this.currentTick > this.config.duration) {
      this.stop();
      return;
    }

    // 1. Generate market data
    const candle = this.generateCandle();
    const technical = this.generateTechnical(candle);
    const intelligence = this.generateIntelligence();

    // 2. Run fusion pipeline
    const { FusionEngine } = await import('../../frontend/src/engine/fusion/FusionEngine');
    const { FusionStabilizer } = await import('../../frontend/src/engine/fusion/FusionStabilizer');
    const { getFusionDecisionBridge } = await import('./FusionDecisionBridge');

    const fusionEngine = FusionEngine.getInstance();
    const stabilizer = FusionStabilizer.getInstance();
    const bridge = getFusionDecisionBridge();

    const fusion = fusionEngine.computeFusion(intelligence, technical);
    const stabilized = stabilizer.stabilize(fusion);

    // 3. Generate decision
    const decision = await bridge.processDecision(intelligence, technical, {
      shieldState: this.getShieldState(intelligence),
      emotionalDegradation: intelligence.riskLevel / 100,
      executionWarning: false,
      memoryUnstable: false,
    });

    // 4. Update analytics
    this.updateAnalytics(decision, fusion, stabilized);

    // 5. Handle trading
    let trade: VirtualTrade | undefined;
    if (this.config.enableTrading) {
      trade = this.handleTrading(decision, candle);
    }

    // 6. Calculate P/L
    const { pnl, floatingPnl } = this.calculatePnL();

    // 7. Create tick snapshot
    const tick: SimulationTick = {
      tick: this.currentTick,
      timestamp: Date.now(),
      candle,
      technical,
      intelligence,
      fusion,
      stabilized,
      decision,
      trade,
      pnl,
      floatingPnl,
    };

    this.tickHistory.push(tick);
    if (this.tickHistory.length > 1000) {
      this.tickHistory.shift();
    }

    // 8. Emit events
    this.emit('tick', tick);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MARKET GENERATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Generate realistic OHLC candle
   */
  private generateCandle(): Candle {
    const timestamp = Date.now();
    const baseVolatility = this.config.volatility;

    // Mode-specific behavior
    let movement = 0;
    let volatilityMultiplier = 1;

    switch (this.config.mode) {
      case 'STABLE_TREND':
        movement = this.trendDirection * this.trendStrength * 0.0001;
        volatilityMultiplier = 0.5;
        // Gradual trend shifts
        if (Math.random() > 0.95) {
          this.trendDirection *= -1;
        }
        break;

      case 'WHIPSAW_CHAOS':
        movement = (Math.random() - 0.5) * 0.0003;
        volatilityMultiplier = 2.0;
        // Frequent reversals
        if (Math.random() > 0.9) {
          this.trendDirection *= -1;
        }
        break;

      case 'BLACK_SWAN':
        // Normal movement with sudden spikes
        if (Math.random() > 0.98) {
          this.volatilitySpike = 5.0;
        }
        movement = this.trendDirection * 0.0001;
        volatilityMultiplier = 1.0 + this.volatilitySpike;
        this.volatilitySpike *= 0.8; // Decay
        break;
    }

    // EMA-based price movement
    const targetPrice = this.currentPrice + movement;
    this.emaPrice = 0.9 * this.emaPrice + 0.1 * targetPrice;
    this.currentPrice = this.emaPrice;

    // Generate OHLC
    const noise = baseVolatility * volatilityMultiplier;
    const open = this.lastCandle?.close ?? this.currentPrice;
    const high = this.currentPrice + Math.random() * noise * 0.0001;
    const low = this.currentPrice - Math.random() * noise * 0.0001;
    const close = this.currentPrice + (Math.random() - 0.5) * noise * 0.00005;
    const volume = 1000000 + Math.random() * 500000;

    const candle: Candle = {
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    };

    this.lastCandle = candle;
    this.currentPrice = close;

    return candle;
  }

  /**
   * Generate technical snapshot from candle
   */
  private generateTechnical(candle: Candle): TechnicalSnapshot {
    const recentCandles = this.tickHistory.slice(-20).map(t => t.candle);
    recentCandles.push(candle);

    // Calculate momentum
    const momentum = recentCandles.length >= 10
      ? ((candle.close - recentCandles[recentCandles.length - 10].close) / recentCandles[recentCandles.length - 10].close) * 100
      : 0;

    // Calculate RSI (simplified)
    const rsi = 50 + momentum * 0.5;

    // Calculate MACD (simplified)
    const macd = momentum * 0.01;

    // Determine trend
    let trend: 'up' | 'down' | 'sideways' = 'sideways';
    if (momentum > 2) trend = 'up';
    else if (momentum < -2) trend = 'down';

    return {
      price: candle.close,
      momentum,
      rsi: Math.max(0, Math.min(100, rsi)),
      macd,
      volume: candle.volume,
      trend,
    };
  }

  /**
   * Generate intelligence snapshot
   */
  private generateIntelligence(): IntelligenceSnapshot {
    // Simulate shield intelligence
    const baseRisk = 30 + Math.random() * 20;
    const cascadeRisk = Math.random() * 0.3;
    const threatCount = Math.floor(Math.random() * 5);

    // Intelligence score inversely related to risk
    const intelligenceScore = Math.max(0, Math.min(100, 100 - baseRisk + Math.random() * 10));

    return {
      intelligenceScore,
      riskLevel: baseRisk,
      threatCount,
      cascadeRisk,
      predictions: [],
    };
  }

  /**
   * Get shield state from intelligence
   */
  private getShieldState(intelligence: IntelligenceSnapshot): 'Green' | 'Yellow' | 'Orange' | 'Red' {
    if (intelligence.riskLevel < 30) return 'Green';
    if (intelligence.riskLevel < 50) return 'Yellow';
    if (intelligence.riskLevel < 70) return 'Orange';
    return 'Red';
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRADE MANAGEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Handle trading logic
   */
  private handleTrading(decision: FinalDecisionSnapshot, candle: Candle): VirtualTrade | undefined {
    // Check existing trades for exits
    this.openTrades.forEach(trade => {
      this.checkTradeExit(trade, candle, decision);
    });

    // Open new trade if signal and no existing trades
    if (this.openTrades.length === 0 && (decision.signal === 'BUY' || decision.signal === 'SELL')) {
      if (decision.confidence >= 0.7) {
        return this.openTrade(decision, candle);
      }
    }

    return undefined;
  }

  /**
   * Open new trade
   */
  private openTrade(decision: FinalDecisionSnapshot, candle: Candle): VirtualTrade {
    const trade: VirtualTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: decision.signal as 'BUY' | 'SELL',
      entryPrice: candle.close,
      entryTime: Date.now(),
      stopLoss: decision.signal === 'BUY'
        ? candle.close * (1 - this.config.stopLossPercent / 100)
        : candle.close * (1 + this.config.stopLossPercent / 100),
      takeProfit: decision.signal === 'BUY'
        ? candle.close * (1 + this.config.takeProfitPercent / 100)
        : candle.close * (1 - this.config.takeProfitPercent / 100),
      confidence: decision.confidence,
      fusionScore: decision.score,
    };

    this.openTrades.push(trade);
    this.emit('trade-opened', trade);

    return trade;
  }

  /**
   * Check if trade should be exited
   */
  private checkTradeExit(trade: VirtualTrade, candle: Candle, decision: FinalDecisionSnapshot): void {
    const price = candle.close;

    // Stop loss check
    if (trade.type === 'BUY' && price <= trade.stopLoss) {
      this.closeTrade(trade, 'STOP_LOSS', price);
      return;
    }
    if (trade.type === 'SELL' && price >= trade.stopLoss) {
      this.closeTrade(trade, 'STOP_LOSS', price);
      return;
    }

    // Take profit check
    if (trade.type === 'BUY' && price >= trade.takeProfit) {
      this.closeTrade(trade, 'TAKE_PROFIT', price);
      return;
    }
    if (trade.type === 'SELL' && price <= trade.takeProfit) {
      this.closeTrade(trade, 'TAKE_PROFIT', price);
      return;
    }

    // Intelligence override (low confidence or WAIT signal)
    if (decision.confidence < 0.4 || decision.signal === 'WAIT') {
      this.closeTrade(trade, 'INTELLIGENCE_OVERRIDE', price);
      return;
    }

    // Trailing stop (if profitable)
    const pnlPercent = trade.type === 'BUY'
      ? ((price - trade.entryPrice) / trade.entryPrice) * 100
      : ((trade.entryPrice - price) / trade.entryPrice) * 100;

    if (pnlPercent > this.config.trailingStopPercent) {
      const trailingStop = trade.type === 'BUY'
        ? price * (1 - this.config.trailingStopPercent / 100)
        : price * (1 + this.config.trailingStopPercent / 100);

      if (trade.type === 'BUY' && price <= trailingStop) {
        this.closeTrade(trade, 'TRAILING_STOP', price);
      } else if (trade.type === 'SELL' && price >= trailingStop) {
        this.closeTrade(trade, 'TRAILING_STOP', price);
      }
    }
  }

  /**
   * Close trade
   */
  private closeTrade(trade: VirtualTrade, reason: VirtualTrade['exitReason'], exitPrice: number): void {
    trade.exitPrice = exitPrice;
    trade.exitTime = Date.now();
    trade.exitReason = reason;
    trade.duration = trade.exitTime - trade.entryTime;

    // Calculate P/L
    if (trade.type === 'BUY') {
      trade.pnl = (exitPrice - trade.entryPrice) * this.config.positionSize;
    } else {
      trade.pnl = (trade.entryPrice - exitPrice) * this.config.positionSize;
    }

    // Move to closed trades
    this.closedTrades.push(trade);
    this.openTrades = this.openTrades.filter(t => t.id !== trade.id);

    this.emit('trade-closed', trade);
  }

  /**
   * Calculate current P/L
   */
  private calculatePnL(): { pnl: number; floatingPnl: number } {
    // Closed P/L
    const pnl = this.closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

    // Floating P/L
    const floatingPnl = this.openTrades.reduce((sum, trade) => {
      if (trade.type === 'BUY') {
        return sum + (this.currentPrice - trade.entryPrice) * this.config.positionSize;
      } else {
        return sum + (trade.entryPrice - this.currentPrice) * this.config.positionSize;
      }
    }, 0);

    return { pnl, floatingPnl };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ANALYTICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Initialize analytics
   */
  private initializeAnalytics(): SimulationAnalytics {
    return {
      totalTicks: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgReturn: 0,
      maxDrawdown: 0,
      largestGain: 0,
      largestLoss: 0,
      actionDistribution: { BUY: 0, SELL: 0, HOLD: 0, WAIT: 0 },
      avgFusionScore: 0,
      avgConfidence: 0,
      avgVolatility: 0,
      riskDistribution: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      shieldInteractions: {
        cascadeDetections: 0,
        riskOverrides: 0,
        driftWarnings: 0,
        executionBlocks: 0,
      },
    };
  }

  /**
   * Update analytics with new data
   */
  private updateAnalytics(
    decision: FinalDecisionSnapshot,
    fusion: FusionOutput,
    stabilized: StabilizedFusion
  ): void {
    this.analytics.totalTicks++;

    // Action distribution
    this.analytics.actionDistribution[decision.signal]++;

    // Fusion & confidence averages
    this.analytics.avgFusionScore = 
      (this.analytics.avgFusionScore * (this.analytics.totalTicks - 1) + fusion.fusionScore) / 
      this.analytics.totalTicks;

    this.analytics.avgConfidence =
      (this.analytics.avgConfidence * (this.analytics.totalTicks - 1) + decision.confidence) /
      this.analytics.totalTicks;

    this.analytics.avgVolatility =
      (this.analytics.avgVolatility * (this.analytics.totalTicks - 1) + fusion.volatility) /
      this.analytics.totalTicks;

    // Risk distribution
    this.analytics.riskDistribution[decision.risk]++;

    // Trade analytics
    const newClosedTrades = this.closedTrades.length - this.analytics.totalTrades;
    if (newClosedTrades > 0) {
      const recentTrades = this.closedTrades.slice(-newClosedTrades);
      recentTrades.forEach(trade => {
        this.analytics.totalTrades++;
        if (trade.pnl && trade.pnl > 0) {
          this.analytics.winningTrades++;
          this.analytics.largestGain = Math.max(this.analytics.largestGain, trade.pnl);
        } else if (trade.pnl && trade.pnl < 0) {
          this.analytics.losingTrades++;
          this.analytics.largestLoss = Math.min(this.analytics.largestLoss, trade.pnl);
        }
      });

      this.analytics.winRate = this.analytics.totalTrades > 0
        ? this.analytics.winningTrades / this.analytics.totalTrades
        : 0;

      const totalPnl = this.closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      this.analytics.avgReturn = this.analytics.totalTrades > 0
        ? totalPnl / this.analytics.totalTrades
        : 0;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT SYSTEM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Subscribe to simulation events
   */
  on(eventType: SimulationEventType, callback: SimulationEventCallback): UnsubscribeFn {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    const listeners = this.eventListeners.get(eventType)!;
    listeners.push(callback);

    return () => {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit event
   */
  private emit(eventType: SimulationEventType, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[TradeSimulationEngine] Event callback error:`, error);
        }
      });
    }
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXPORTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convenience function to get simulator instance
 */
export function getTradeSimulator(config?: Partial<SimulationConfig>): TradeSimulationEngine {
  return TradeSimulationEngine.getInstance(config);
}

/**
 * Default export
 */
export default TradeSimulationEngine;
