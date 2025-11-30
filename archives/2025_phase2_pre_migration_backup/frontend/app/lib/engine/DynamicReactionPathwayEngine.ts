import { shieldRiskCurveEngine } from "../risk/ShieldRiskCurveEngine";
import { temporalThreatMemory } from "../intel/TemporalThreatMemory";

// Placeholder for future implementation
const predictionHorizon: { shortTermRisk: number } = { shortTermRisk: 0 };
const clusterEngine: { threatDensity: number } = { threatDensity: 0 };
const trendSync: { hasAnomaly: boolean } = { hasAnomaly: false };

export interface ReactionProfile {
  mode: string;
  action: string;
  description: string;
}

class DynamicReactionPathwayEngine {
  evaluateReaction(): string {
    const riskProfile = shieldRiskCurveEngine.computeRiskProfile();
    const risk = riskProfile.risk;

    const horizonRisk = predictionHorizon.shortTermRisk;
    const memoryRisk = temporalThreatMemory.getThreatScore();
    const clusterRisk = clusterEngine.threatDensity;
    const trendConflict = trendSync.hasAnomaly;

    let score = 0;
    score += risk * 4; // 0-4
    score += horizonRisk; // 0-2
    score += memoryRisk * 0.5; // 0-2.5
    if (clusterRisk > 0.4) score += 1.5;
    if (trendConflict) score += 2;

    // 7 reaction modes based on score thresholds
    if (score < 2) return "SteadyMode";
    if (score < 4) return "ReduceMode";
    if (score < 6) return "MicroTradeMode";
    if (score < 8) return "PauseMode";
    if (score < 10) return "HedgeMode";
    if (score < 12) return "ReverseMode";
    return "LockdownMode";
  }

  getReactionProfile(): ReactionProfile {
    const reaction = this.evaluateReaction();

    switch (reaction) {
      case "SteadyMode":
        return { 
          mode: "SteadyMode",
          action: "normal", 
          description: "Market stable — normal trading." 
        };
      
      case "ReduceMode":
        return { 
          mode: "ReduceMode",
          action: "reduce", 
          description: "Caution detected — reduced exposure." 
        };
      
      case "MicroTradeMode":
        return { 
          mode: "MicroTradeMode",
          action: "microtrade", 
          description: "High risk — tiny trades only." 
        };
      
      case "PauseMode":
        return { 
          mode: "PauseMode",
          action: "pause", 
          description: "Threat spike — pausing trading." 
        };
      
      case "LockdownMode":
        return { 
          mode: "LockdownMode",
          action: "lockdown", 
          description: "Critical danger — closing all positions." 
        };
      
      case "HedgeMode":
        return { 
          mode: "HedgeMode",
          action: "hedge", 
          description: "Trend conflict — hedging positions." 
        };
      
      case "ReverseMode":
        return { 
          mode: "ReverseMode",
          action: "reverse", 
          description: "Strong reversal detected — flips direction." 
        };
      
      default:
        return { 
          mode: "SteadyMode",
          action: "normal", 
          description: "Fallback — normal trading." 
        };
    }
  }
}

export const dynamicReactionPathway = new DynamicReactionPathwayEngine();
