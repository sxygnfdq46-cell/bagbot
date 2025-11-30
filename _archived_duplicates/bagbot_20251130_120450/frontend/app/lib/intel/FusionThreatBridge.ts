// app/lib/intel/FusionThreatBridge.ts
// Step 24.8 — Threat → Fusion Influence Link

import { threatSyncOrchestrator } from "@/engines/threat/ThreatSyncOrchestrator";
import { getFusionEngine } from "@/src/engine/fusion/FusionEngine";

class FusionThreatBridge {
  private threatModifier: number = 1.0;
  private confidenceReduction: number = 0;
  private freezeHighRisk: boolean = false;
  private unsubscribe: (() => void) | null = null;

  init() {
    if (this.unsubscribe) return; // Already initialized

    this.unsubscribe = threatSyncOrchestrator.subscribe((stats) => {
      const severity = stats.severity || 0;
      const totalThreats = stats.totalThreats || 0;

      // GREEN (normal): Full confidence, no modification
      if (severity < 0.4) {
        this.threatModifier = 1.0;
        this.confidenceReduction = 0;
        this.freezeHighRisk = false;
      }
      // YELLOW (caution mode): Reduce aggression, lower confidence
      else if (severity >= 0.4 && severity <= 0.65) {
        this.threatModifier = 0.7;
        this.confidenceReduction = 5;
        this.freezeHighRisk = false;
      }
      // RED (danger mode): Strong suppression, optional freeze
      else {
        this.threatModifier = 0.4;
        this.confidenceReduction = 15;
        this.freezeHighRisk = totalThreats > 5; // Freeze if 5+ threats
      }

      // Apply modifiers to FusionEngine
      this.applyToFusion();
    });
  }

  private applyToFusion() {
    const fusion = getFusionEngine();
    
    // Update fusion weights to reflect threat influence
    fusion.updateWeights({
      fusionCore: 0.60 * this.threatModifier,
      divergence: 0.25 * this.threatModifier,
      stabilizer: 0.15 + (1 - this.threatModifier) * 0.1, // Increase stability in danger
    });

    // Apply modifiers directly to fusion engine
    fusion.setThreatModifier(this.threatModifier);
    fusion.reduceConfidence(this.confidenceReduction);
  }

  getThreatModifier(): number {
    return this.threatModifier;
  }

  getConfidenceReduction(): number {
    return this.confidenceReduction;
  }

  shouldFreezeHighRisk(): boolean {
    return this.freezeHighRisk;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const initFusionThreatBridge = () => {
  const bridge = new FusionThreatBridge();
  bridge.init();
  return bridge;
};

export { FusionThreatBridge };
