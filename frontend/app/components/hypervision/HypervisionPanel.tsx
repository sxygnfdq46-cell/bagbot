"use client";

import React, { useState, useEffect } from "react";
import { eventBus } from "../../lib/runtime/eventBus";

export default function HypervisionPanel() {
  const [state, setState] = useState({
    runtimeLoad: 0,
    shieldHealth: 100,
    brainCoherence: 100,
    marketThreat: 0,
    strategyHarmony: 100,
    latency: 0,
    lastUpdate: Date.now(),
  });

  useEffect(() => {
    const handler = (data: any) => {
      setState(data);
    };

    eventBus.on("hypervision:update", handler);
    return () => {
      eventBus.off("hypervision:update", handler);
    };
  }, []);

  const getMetricColor = (value: number, inverted: boolean = false) => {
    if (inverted) {
      if (value < 30) return "text-green-400";
      if (value < 60) return "text-yellow-400";
      return "text-red-400";
    } else {
      if (value > 70) return "text-green-400";
      if (value > 40) return "text-yellow-400";
      return "text-red-400";
    }
  };

  return (
    <div className="fixed top-32 right-4 bg-black/50 backdrop-blur-md border border-gray-700 rounded-lg p-4 w-64 shadow-lg">
      <div className="text-white text-sm font-bold mb-2 border-b border-gray-600 pb-1">
        🔮 HYPERVISION MONITOR
      </div>

      <div className="space-y-2 text-xs text-gray-300">
        <div className="flex justify-between">
          <span>Runtime Load:</span>
          <span className={getMetricColor(state.runtimeLoad, true)}>
            {state.runtimeLoad}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Shield Health:</span>
          <span className={getMetricColor(state.shieldHealth)}>
            {state.shieldHealth}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Brain Coherence:</span>
          <span className={getMetricColor(state.brainCoherence)}>
            {state.brainCoherence}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Market Threat:</span>
          <span className={getMetricColor(state.marketThreat, true)}>
            {state.marketThreat.toFixed(1)}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Strategy Harmony:</span>
          <span className={getMetricColor(state.strategyHarmony)}>
            {state.strategyHarmony}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Latency:</span>
          <span
            className={
              state.latency > 1500
                ? "text-red-400"
                : state.latency > 1000
                ? "text-yellow-400"
                : "text-green-400"
            }
          >
            {state.latency}ms
          </span>
        </div>
      </div>
    </div>
  );
}
