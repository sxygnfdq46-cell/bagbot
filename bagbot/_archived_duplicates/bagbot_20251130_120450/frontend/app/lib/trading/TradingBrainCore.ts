interface ShieldStatus {
  score: number;
  classification: string;
  rootCause: string;
  hedge: string;
}

interface ShieldContext {
  shieldLevel: string;
  shieldScore: number;
  hedgeMode: string;
}

class TradingBrainCore {
  private currentShieldStatus: ShieldStatus | null = null;

  updateShieldStatus(status: ShieldStatus): void {
    this.currentShieldStatus = status;
  }

  getShieldStatus(): ShieldStatus | null {
    return this.currentShieldStatus;
  }

  isShieldBlocking(): boolean {
    if (!this.currentShieldStatus) return false;
    return this.currentShieldStatus.classification === "CRITICAL_THREAT";
  }

  getRecommendedMode(): string {
    if (!this.currentShieldStatus) return "FULL_OPERATION";
    
    switch (this.currentShieldStatus.classification) {
      case "CRITICAL_THREAT": return "NO_TRADING";
      case "HIGH_THREAT": return "MICRO_MODE";
      case "MODERATE_THREAT": return "RISK_ADJUSTED";
      default: return "FULL_OPERATION";
    }
  }
}

export const tradingBrain = new TradingBrainCore();
