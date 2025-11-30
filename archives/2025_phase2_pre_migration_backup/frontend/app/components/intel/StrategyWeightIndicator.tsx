"use client";

import { useEffect, useState } from "react";
import { threatWeightedStrategy } from "../../../app/lib/intel/ThreatWeightedStrategy";
import { getStrategyMode } from "../../../app/lib/intel/ThreatStrategyIntegration";

export default function StrategyWeightIndicator() {
  const [mode, setMode] = useState<"AGGRESSIVE" | "BALANCED" | "DEFENSIVE">("BALANCED");
  const [weights, setWeights] = useState({ 
    neural: 1, 
    fusion: 1, 
    trend: 1, 
    volatility: 1, 
    reversal: 1 
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const currentWeights = threatWeightedStrategy.getWeights();
      const currentMode = getStrategyMode();
      setWeights(currentWeights);
      setMode(currentMode);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getModeColor = () => {
    if (mode === "AGGRESSIVE") return "text-cyan-400 border-cyan-500/40 bg-cyan-500/10";
    if (mode === "DEFENSIVE") return "text-red-400 border-red-500/40 bg-red-500/10";
    return "text-green-400 border-green-500/40 bg-green-500/10";
  };

  return (
    <div className={`fixed bottom-6 left-6 z-40 px-4 py-3 rounded-lg backdrop-blur-lg border transition-all ${getModeColor()}`}>
      <div className="text-xs font-bold mb-2">
        📊 Strategy Mode: {mode}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80">
        <div>Neural: {weights.neural.toFixed(1)}x</div>
        <div>Fusion: {weights.fusion.toFixed(1)}x</div>
        <div>Trend: {weights.trend.toFixed(1)}x</div>
        <div>Volatility: {weights.volatility.toFixed(1)}x</div>
        <div className="col-span-2">Reversal: {weights.reversal.toFixed(1)}x</div>
      </div>
    </div>
  );
}
