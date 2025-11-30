// ═══════════════════════════════════════════════════════════════════
// BAGBOT — LEVEL 21: MetaSignalEngine (Phase 1)
// Supervisory Signal Intelligence Layer
// ═══════════════════════════════════════════════════════════════════

// Placeholder types for Phase 1 (will be replaced with actual imports in Phase 2)
interface StabilizerOutput {
  riskNormalized: number;
}

interface FusionOutput {
  confidence: number;
  trendStrength: number;
  noise: number;
}

interface PredictionHorizonOutput {
  alignment: number;
}

interface RiskState {
  level: number;
}

export enum MarketState {
  STRONG_TREND = "STRONG_TREND",
  WEAK_TREND = "WEAK_TREND",
  RANGING = "RANGING",
  COMPRESSION = "COMPRESSION",
  EXPANSION = "EXPANSION",
  CHOP = "CHOP",
  ILLIQUID = "ILLIQUID"
}

export enum TradeMode {
  TREND = "TREND",
  RANGE = "RANGE",
  SCALP = "SCALP",
  COMPRESSION_BREAKOUT = "COMPRESSION_BREAKOUT",
  CHAOS_DEFENSE = "CHAOS_DEFENSE",
  DAILY_OPPORTUNITY = "DAILY_OPPORTUNITY"
}

export interface MetaSignalInputs {
  fusion: FusionOutput;
  shield: StabilizerOutput;
  horizon: PredictionHorizonOutput;
  risk: RiskState;
  spread: number;
  volatility: number;
  liquidity: number;
  timestamp: number;
}

export interface MetaSignalOutput {
  marketState: MarketState;
  tradeMode: TradeMode;
  readinessScore: number;        // 0-100
  tradeWindowOpen: boolean;
  alerts: string[];
}

export class MetaSignalEngine {
  private lastMarketState: MarketState | null = null;
  private lastReadiness = 0;
  private dailyTradeTriggered = false;
  private eventListeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  constructor() {
    // Initialize event system
  }

  // Simple event emitter
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Primary compute method
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  compute(inputs: MetaSignalInputs): MetaSignalOutput {
    const alerts: string[] = [];

    // STEP 1 — Classify market structure (placeholder logic)
    const marketState = this.classifyMarket(inputs);

    // STEP 2 — Generate readiness score
    const readinessScore = this.computeReadiness(inputs);

    // STEP 3 — Select trade mode
    const tradeMode = this.selectTradeMode(marketState, readinessScore);

    // STEP 4 — Determine if trade window is open
    const tradeWindowOpen = readinessScore >= 65;

    // STEP 5 — Detect state transitions & emit events
    this.handleTransitions(marketState, readinessScore, tradeMode);

    if (tradeMode === TradeMode.DAILY_OPPORTUNITY && !this.dailyTradeTriggered) {
      this.emit("daily-opportunity-mode-activated");
      this.dailyTradeTriggered = true;
    }

    return {
      marketState,
      tradeMode,
      readinessScore,
      tradeWindowOpen,
      alerts
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // MARKET CLASSIFIER (placeholder logic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private classifyMarket(inputs: MetaSignalInputs): MarketState {
    const v = inputs.volatility;
    const l = inputs.liquidity;

    if (l < 10) return MarketState.ILLIQUID;
    if (v < 3) return MarketState.COMPRESSION;
    if (v > 25) return MarketState.EXPANSION;
    if (inputs.fusion.trendStrength > 0.7) return MarketState.STRONG_TREND;
    if (inputs.fusion.trendStrength > 0.4) return MarketState.WEAK_TREND;
    if (inputs.fusion.noise > 0.6) return MarketState.CHOP;

    return MarketState.RANGING;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // READINESS SCORE (placeholder logic)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private computeReadiness(inputs: MetaSignalInputs): number {
    let score = 50;

    score += inputs.fusion.confidence * 20;
    score += (1 - inputs.shield.riskNormalized) * 20;
    score += inputs.horizon.alignment * 10;

    if (inputs.spread > 5) score -= 15;
    if (inputs.volatility > 30) score -= 10;

    // Clamp to 0–100
    return Math.max(0, Math.min(100, score));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TRADE MODE SELECTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private selectTradeMode(state: MarketState, readiness: number): TradeMode {
    if (readiness < 40) return TradeMode.CHAOS_DEFENSE;

    switch (state) {
      case MarketState.STRONG_TREND:
        return TradeMode.TREND;
      case MarketState.RANGING:
        return TradeMode.RANGE;
      case MarketState.COMPRESSION:
        return TradeMode.COMPRESSION_BREAKOUT;
      case MarketState.EXPANSION:
        return TradeMode.SCALP;
      case MarketState.CHOP:
      case MarketState.ILLIQUID:
        return TradeMode.CHAOS_DEFENSE;
      default:
        return TradeMode.RANGE;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EVENT SYSTEM FOR UI & PIPELINE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private handleTransitions(
    newState: MarketState,
    readiness: number,
    mode: TradeMode
  ) {
    if (newState !== this.lastMarketState) {
      this.emit("market-state-change", newState);
      this.lastMarketState = newState;
    }

    if (readiness !== this.lastReadiness) {
      this.emit("readiness-change", readiness);
      this.lastReadiness = readiness;
    }

    if (mode === TradeMode.DAILY_OPPORTUNITY && !this.dailyTradeTriggered) {
      this.emit("daily-opportunity-mode-activated");
      this.dailyTradeTriggered = true;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2 — ADVANCED MARKET CLASSIFIER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private classifyMarketAdvanced(inputs: MetaSignalInputs): MarketState {
    const { volatility, liquidity } = inputs;
    const t = inputs.fusion.trendStrength;
    const noise = inputs.fusion.noise;

    // AI-weight model
    let scoreTrend = t * (1 - noise);
    const scoreRange = (1 - t) * (1 - noise);
    const scoreChop = noise;
    const scoreExpansion = volatility / 30;
    const scoreCompression = 1 - volatility / 20;

    // Illiquidity override
    if (liquidity < 8) return MarketState.ILLIQUID;

    // Strong trend check
    if (scoreTrend > 0.7) return MarketState.STRONG_TREND;
    if (scoreExpansion > 0.8) return MarketState.EXPANSION;
    if (scoreCompression > 0.9) return MarketState.COMPRESSION;
    if (scoreTrend > 0.4) return MarketState.WEAK_TREND;
    if (scoreChop > 0.6) return MarketState.CHOP;

    return MarketState.RANGING;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2 — READINESS INTELLIGENCE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private computeReadinessAdvanced(inputs: MetaSignalInputs): number {
    let score = 50;

    score += inputs.fusion.confidence * 20;
    score += (1 - inputs.shield.riskNormalized) * 20;
    score += inputs.horizon.alignment * 10;

    if (inputs.spread > 5) score -= 15;
    if (inputs.volatility > 30) score -= 10;

    // Liquidity bonus
    if (inputs.liquidity > 40) score += 10;

    // Clamp 0-100
    return Math.max(0, Math.min(100, score));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2 — TRADE MODE SELECTOR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private selectTradeModeAdvanced(state: MarketState, readiness: number): TradeMode {
    // No trading below 35
    if (readiness < 35) return TradeMode.CHAOS_DEFENSE;

    switch (state) {
      case MarketState.STRONG_TREND:
        return readiness > 60
          ? TradeMode.TREND
          : TradeMode.SCALP;

      case MarketState.WEAK_TREND:
        return TradeMode.TREND;

      case MarketState.RANGING:
        return readiness > 55
          ? TradeMode.RANGE
          : TradeMode.SCALP;

      case MarketState.COMPRESSION:
        return TradeMode.COMPRESSION_BREAKOUT;

      case MarketState.EXPANSION:
        return TradeMode.SCALP;

      case MarketState.CHOP:
        return TradeMode.CHAOS_DEFENSE;

      case MarketState.ILLIQUID:
        return TradeMode.CHAOS_DEFENSE;

      default:
        return TradeMode.RANGE;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2 — DAILY TRADE ENFORCEMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private lastTradeDay: number | null = null;

  private ensureDailyTradeMode(timestamp: number): void {
    const currentDay = new Date(timestamp).getUTCDate();

    if (this.lastTradeDay !== currentDay) {
      this.dailyTradeTriggered = false;
      this.lastTradeDay = currentDay;
      this.emit("new-day-started");
    }
  }

  // Add inside compute():
  // this.ensureDailyTradeMode(inputs.timestamp);
  //
  // if (!this.dailyTradeTriggered && readinessScore > 60) {
  //   this.dailyTradeTriggered = true;
  //   this.emit("daily-trade-window");
  // }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2 — EXPLANATION ENGINE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  public explain(output: MetaSignalOutput): string {
    return `
Market State: ${output.marketState}
Trade Mode: ${output.tradeMode}
Readiness: ${output.readinessScore}
Window Open: ${output.tradeWindowOpen ? "YES" : "NO"}
    `.trim();
  }
}
