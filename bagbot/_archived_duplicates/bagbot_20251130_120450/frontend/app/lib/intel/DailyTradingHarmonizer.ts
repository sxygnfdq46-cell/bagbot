// app/lib/intel/DailyTradingHarmonizer.ts
// Step 24.10 — Daily Trading Harmonizer

import { threatSyncOrchestrator } from "@/engines/threat/ThreatSyncOrchestrator";
import { temporalThreatMemory } from "./TemporalThreatMemory";

interface TradingConfig {
  mode: "normal" | "caution" | "safe";
  minTrades: number;
  maxTrades: number;
  riskMultiplier: number;
}

class DailyTradingHarmonizer {
  private config: TradingConfig = {
    mode: "normal",
    minTrades: 1,
    maxTrades: 3,
    riskMultiplier: 1.0,
  };

  private unsubscribe: (() => void) | null = null;

  subscribe() {
    if (this.unsubscribe) return; // Already subscribed

    this.unsubscribe = threatSyncOrchestrator.subscribe((state) => {
      const { severity } = state;
      this.update(severity);
    });
  }

  getConfig(): TradingConfig {
    return this.config;
  }

  private update(severity: number) {
    // Get memory mode for additional context
    const memoryMode = temporalThreatMemory.getMode();
    
    // Apply memory-based risk adjustment
    let memoryMultiplier = 1.0;
    if (memoryMode === "memory-danger") memoryMultiplier = 0.5;
    else if (memoryMode === "memory-caution") memoryMultiplier = 0.8;
    
    if (severity < 0.4) {
      // GREEN: Normal trading (but check memory)
      this.config = {
        mode: "normal",
        minTrades: 1,
        maxTrades: 4,
        riskMultiplier: 1.0 * memoryMultiplier
      };
    } 
    else if (severity >= 0.4 && severity <= 0.65) {
      // YELLOW: Caution mode
      this.config = {
        mode: "caution",
        minTrades: 1,
        maxTrades: 2,
        riskMultiplier: 0.6 * memoryMultiplier
      };
    } 
    else {
      // RED: Safe mode
      this.config = {
        mode: "safe",
        minTrades: 1,
        maxTrades: 1,
        riskMultiplier: 0.25 * memoryMultiplier
      };
    }
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const dailyTradingHarmonizer = new DailyTradingHarmonizer();
