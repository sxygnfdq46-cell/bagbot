/**
 * LEVEL 21 — PHASE 4
 * EXECUTION INTELLIGENCE LAYER
 *
 * Handles:
 *  - Timing precision
 *  - Risk calibration
 *  - Dynamic lot size selection
 *  - Trade validation
 *  - Position filtering
 *  - Backend execution handoff
 *
 * This module works after SystemFusionBridge produces final decisions.
 */

import { MetaSignalOutput } from "../../backend/meta/MetaSignalEngine";

// ============================================================
// TYPE DEFINITIONS FOR PHASE 4
// ============================================================

interface DecisionOutput {
  action: "BUY" | "SELL" | "HOLD" | "CLOSE";
  confidence: number;
  reasoning: string;
  reason: string;
  symbol: string;
  [key: string]: any;
}

interface FusionState {
  confidence: number;
  trendStrength: number;
  noise: number;
  liquidity: number;
  volatility: number;
  [key: string]: any;
}

interface ShieldState {
  riskNormalized: number;
  globalRisk: string; // "LOW" | "MEDIUM" | "HIGH"
  threats: string[];
  isActive: boolean;
  [key: string]: any;
}

interface HorizonState {
  alignment: number;
  directionConfidence: number;
  prediction: number;
  confidence: number;
  timeframe: string;
  [key: string]: any;
}

export interface ExecutionRequest {
  decision: DecisionOutput;
  meta: MetaSignalOutput;
  fusion: FusionState;
  shield: ShieldState;
  horizon: HorizonState;
  timestamp: number;
}

export class ExecutionOrchestrator {
  constructor() {}

  /**
   * MAIN EXECUTION HANDLER
   * This performs final checks and prepares actions for the backend.
   */
  public prepareExecution(req: ExecutionRequest) {
    const { decision, meta, fusion, shield, horizon } = req;

    // 1. Hard Block — Shield Network Defense
    if (shield.globalRisk === "HIGH") {
      return this.block("Shield blocked execution — high risk detected.");
    }

    // 2. Liquidity + Spread Validation
    if (meta.readinessScore < 50) {
      return this.block("Spread too large — unsafe to execute.");
    }

    // 3. Volatility Calibration
    if (fusion.volatility > 0.8) {
      return this.block("Volatility above allowed threshold.");
    }

    // 4. Predictive Horizon Alignment
    if (!horizon.directionConfidence || horizon.directionConfidence < 0.55) {
      return this.block("Prediction confidence too low.");
    }

    // 5. Decision Confirmation
    if (!decision.action || decision.action === "HOLD") {
      return this.block("DecisionEngine indicates HOLD.");
    }

    // 6. Dynamic Position Sizing
    const lotSize = this.computeLotSize({
      risk: meta.readinessScore / 100,
      volatility: fusion.volatility,
      liquidity: fusion.liquidity,
      shield: shield.globalRisk,
    });

    return {
      status: "READY",
      action: decision.action,
      reason: decision.reason,
      lotSize,
      symbol: decision.symbol,
      timestamp: req.timestamp,
      meta,
      fusion,
      shield,
      horizon,
    };
  }

  private block(reason: string) {
    return {
      status: "BLOCKED",
      reason,
      timestamp: Date.now(),
    };
  }

  /**
   * Dynamic Lot Size System
   * Based on trend strength, volatility, and risk signals.
   */
  private computeLotSize(config: {
    risk: number;
    volatility: number;
    liquidity: number;
    shield: string;
  }) {
    const { risk, volatility, liquidity, shield } = config;

    // Defensive mode scaling
    if (shield === "MEDIUM") return 0.15;
    if (shield === "HIGH") return 0;

    // Liquidity-weighted scaling
    const base = 0.10 + liquidity * 0.05;

    // Volatility reducer
    const adjusted = base * (1 / (1 + volatility));

    // Risk alignment
    return Math.max(0.01, adjusted * (1 - risk));
  }
}
