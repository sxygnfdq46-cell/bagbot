/**
 * LEVEL 22 — Strategic Intelligence Layer
 * Trade Trigger (Virtual Execution Layer)
 *
 * This module receives the final decision score and determines
 * whether BagBot should initiate a trade sequence.
 */

import { TradeDecision } from "./DecisionScorer";

export interface TriggerOutput {
  approved: boolean;
  action: "ENTER" | "SKIP";
  confidence: number;
  reason: string;
  timestamp: number;
  cooldown: number;  // minutes until next scan allowed
}

export class TradeTrigger {
  private lastTradeTime: number | null = null;

  fire(decision: TradeDecision): TriggerOutput {
    const now = Date.now();
    const cooldownMinutes = 3;  // short cooldown for daily-trading mode

    // Reject if cooldown still active
    if (this.lastTradeTime) {
      const elapsed = (now - this.lastTradeTime) / 60000;
      if (elapsed < cooldownMinutes) {
        return {
          approved: false,
          action: "SKIP",
          confidence: decision.score,
          reason: "Cooldown active — waiting for next cycle",
          timestamp: now,
          cooldown: cooldownMinutes - elapsed,
        };
      }
    }

    // Only enter if DecisionScorer approved
    if (decision.action !== "ENTER") {
      return {
        approved: false,
        action: "SKIP",
        confidence: decision.score,
        reason: "Conditions not strong enough",
        timestamp: now,
        cooldown: 0,
      };
    }

    // Approve the trade
    this.lastTradeTime = now;

    return {
      approved: true,
      action: "ENTER",
      confidence: decision.score,
      reason: decision.reason,
      timestamp: now,
      cooldown: cooldownMinutes,
    };
  }
}
