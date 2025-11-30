import DivergenceUIController from "./DivergenceUIController";
import { getFusionEngine } from "@/src/engine/fusion/FusionEngine";
import { getMarketSimulationEngine } from "../simulation/MarketSimulationEngine";
import type { DivergenceSignal } from "../simulation/MarketSimulationEngine";

export default class DivergenceInsightBridge {
    private controller: DivergenceUIController;
    private divergenceSignals: DivergenceSignal[] = [];
    private unsubscribeSimulation?: () => void;

    constructor() {
        this.controller = new DivergenceUIController();
        
        // Subscribe to simulated divergence signals
        if (typeof window !== 'undefined') {
            const engine = getMarketSimulationEngine();
            this.unsubscribeSimulation = engine.subscribe('divergence', (signal: DivergenceSignal) => {
                this.divergenceSignals.push(signal);
                if (this.divergenceSignals.length > 20) {
                    this.divergenceSignals.shift();
                }
            });
        }
    }

    /**
     * Fetch final UI-ready intelligence.
     */
    async getUIIntelligence() {
        const data = await this.controller.loadIntelligence();

        // NEW: Get fusion telemetry for Step 18
        const fusionEngine = getFusionEngine();
        const fusionTelemetry = this.getFusionTelemetry();

        return {
            panels: data?.panels || [],
            status: data?.status || "unknown",
            message: data?.message || null,
            fusionTelemetry,
            divergenceSignals: this.divergenceSignals.slice(-5),
        };
    }

    /**
     * NEW: Get fusion weighted telemetry for Step 18
     * Returns weighted contributions for UI display
     */
    private getFusionTelemetry() {
        // Mock data - in production, this would come from actual fusion computation
        // These values will be calculated in real-time from FusionEngine.computeFusion()
        return {
            core: 0.42,        // fusionCore weight * score
            divergence: 0.18,  // divergence weight * score  
            stabilizer: 0.10,  // stabilizer weight * score
        };
    }

    /**
     * Shortcut for UI refresh buttons.
     */
    async refresh() {
        return this.getUIIntelligence();
    }
}
