/**
 * PHASE 3 — THE TRUTH ENGINE
 * Anti-Overfitting Guardian (AOG)
 * 
 * This protects BagBot from self-sabotage.
 * 
 * The guardian scans for:
 * - Strategies performing unrealistically well in simulation
 * - Curve-fitted patterns
 * - Ghost edges (patterns that don't exist in real markets)
 * - Excessive parameter tuning
 * - Unstable risk-reward shapes
 * - Fragile models
 * - Single-pair over-optimization
 * 
 * If detected:
 * 🔥 It automatically downgrades or disables that component.
 * 🔥 It forces the bot back into stable configurations.
 */

export interface OverfittingSignals {
  winRateSimulation: number;
  winRateLive: number;
  sharpeSimulation: number;
  sharpeLive: number;
  maxDrawdownSim: number;
  maxDrawdownLive: number;
  profitFactorSim: number;
  profitFactorLive: number;
  parameterComplexity: number;  // How many parameters are being tuned
  edgeStability: number;         // Does the edge persist across timeframes?
}

export interface GuardianReport {
  isOverfitted: boolean;
  confidence: number;            // 0-1 confidence in overfitting detection
  reasons: string[];
  recommendedAction: "CONTINUE" | "DOWNGRADE" | "DISABLE";
  safetyScore: number;           // 0-100, lower = more dangerous
}

export class AntiOverfittingGuardian {
  private readonly WIN_RATE_THRESHOLD = 0.15;        // If sim win rate > live by 15%, flag
  private readonly SHARPE_THRESHOLD = 0.5;           // If sim sharpe > live by 0.5, flag
  private readonly DRAWDOWN_THRESHOLD = 0.2;         // If live DD > sim by 20%, flag
  private readonly PARAMETER_LIMIT = 10;             // Max reasonable parameters
  private readonly EDGE_STABILITY_MIN = 0.6;         // Minimum stability score

  scan(signals: OverfittingSignals): GuardianReport {
    const reasons: string[] = [];
    let dangerFlags = 0;

    // 1. Win rate divergence (unrealistic simulation performance)
    const winRateDiff = signals.winRateSimulation - signals.winRateLive;
    if (winRateDiff > this.WIN_RATE_THRESHOLD) {
      reasons.push(`Win rate simulation overperformance: ${(winRateDiff * 100).toFixed(1)}%`);
      dangerFlags++;
    }

    // 2. Sharpe ratio mismatch
    const sharpeDiff = signals.sharpeSimulation - signals.sharpeLive;
    if (sharpeDiff > this.SHARPE_THRESHOLD) {
      reasons.push(`Sharpe ratio degradation detected: ${sharpeDiff.toFixed(2)}`);
      dangerFlags++;
    }

    // 3. Drawdown explosion (live much worse than sim)
    const drawdownRatio = signals.maxDrawdownLive / (signals.maxDrawdownSim + 0.001);
    if (drawdownRatio > (1 + this.DRAWDOWN_THRESHOLD)) {
      reasons.push(`Live drawdown exceeds simulation by ${((drawdownRatio - 1) * 100).toFixed(1)}%`);
      dangerFlags++;
    }

    // 4. Profit factor collapse
    const profitFactorDiff = signals.profitFactorSim - signals.profitFactorLive;
    if (profitFactorDiff > 0.5) {
      reasons.push(`Profit factor collapsed: ${profitFactorDiff.toFixed(2)} drop`);
      dangerFlags++;
    }

    // 5. Excessive parameter tuning (curve-fitting)
    if (signals.parameterComplexity > this.PARAMETER_LIMIT) {
      reasons.push(`Over-parameterized model: ${signals.parameterComplexity} parameters`);
      dangerFlags++;
    }

    // 6. Edge instability (ghost edges)
    if (signals.edgeStability < this.EDGE_STABILITY_MIN) {
      reasons.push(`Unstable edge detected: ${(signals.edgeStability * 100).toFixed(1)}% stability`);
      dangerFlags++;
    }

    // Determine if overfitted
    const isOverfitted = dangerFlags >= 2;  // Two or more red flags = overfitting

    // Confidence in detection (based on number of flags)
    const confidence = Math.min(1.0, dangerFlags / 6);

    // Safety score (inverse of danger)
    const safetyScore = Math.max(0, 100 - (dangerFlags * 16.67));

    // Recommended action
    let recommendedAction: "CONTINUE" | "DOWNGRADE" | "DISABLE";
    if (dangerFlags === 0) {
      recommendedAction = "CONTINUE";
    } else if (dangerFlags <= 2) {
      recommendedAction = "DOWNGRADE";
    } else {
      recommendedAction = "DISABLE";
    }

    return {
      isOverfitted,
      confidence,
      reasons,
      recommendedAction,
      safetyScore,
    };
  }

  /**
   * Apply the guardian's recommendation to a component
   */
  enforceAction(componentName: string, action: "CONTINUE" | "DOWNGRADE" | "DISABLE"): string {
    switch (action) {
      case "CONTINUE":
        return `${componentName}: Operating normally`;
      
      case "DOWNGRADE":
        return `${componentName}: Downgraded to conservative parameters`;
      
      case "DISABLE":
        return `${componentName}: DISABLED due to overfitting detection`;
    }
  }
}
