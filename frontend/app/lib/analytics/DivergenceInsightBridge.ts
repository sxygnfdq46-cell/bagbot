import DivergenceUIController from "./DivergenceUIController";
import { getFusionEngine } from "../../../src/engine/fusion/FusionEngine";
import { getMarketSimulationEngine } from "../simulation/MarketSimulationEngine";

// Type stub for divergence signals (MarketSimulationEngine doesn't export this yet)
type DivergenceSignal = any;

export default class DivergenceInsightBridge {
    private controller: DivergenceUIController;
    private divergenceSignals: DivergenceSignal[] = [];
    private unsubscribeSimulation?: () => void;

    constructor() {
        this.controller = new DivergenceUIController();
        
        // Subscribe to simulated divergence signals
        // TODO: MarketSimulationEngine stub doesn't have subscribe method yet
        // if (typeof window !== 'undefined') {
        //     const engine = getMarketSimulationEngine();
        //     this.unsubscribeSimulation = engine.subscribe('divergence', (signal: DivergenceSignal) => {
        //         this.divergenceSignals.push(signal);
        //         if (this.divergenceSignals.length > 20) {
        //             this.divergenceSignals.shift();
        //         }
        //     });
        // }
    }

    /**
     * Fetch final UI-ready intelligence.
     */
    async getUIIntelligence() {
        // TODO: loadIntelligence requires params - using mock data for now
        const data = await this.controller.loadIntelligence({
            backtestData: {
                slippage: 0,
                avgSpread: 0,
                volatility: 0,
                fillDelay: 0,
                executionScore: 0,
            },
            liveData: {
                slippage: 0,
                avgSpread: 0,
                volatility: 0,
                fillDelay: 0,
                executionScore: 0,
                sampleSize: 0,
            },
            marketMeta: {
                avgSpread: 0,
                expectedSlippage: 0,
                baseVolatility: 0,
            },
        });

        // NEW: Get fusion telemetry for Step 18
        const fusionEngine = getFusionEngine();
        const fusionTelemetry = this.getFusionTelemetry();

        // Return UI-ready data structure
        if (data?.error) {
            return {
                status: data.error.status,
                message: data.error.message,
                panels: data.error.panels,
                fusionTelemetry,
                divergenceSignals: this.divergenceSignals.slice(-5),
            };
        }

        return {
            status: 'ok',
            message: null,
            panels: data?.data ? {
                divergencePanel: data.data.divergencePanel,
                correlationsPanel: data.data.correlationsPanel,
                rootCausePanel: data.data.rootCausePanel,
                forecastingPanel: data.data.forecastingPanel,
                threatClusterPanel: data.data.threatClusterPanel,
            } : null,
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
