"use client";

import { useEffect, useState } from "react";
import { dailyTradingHarmonizer } from "../../../app/lib/intel/DailyTradingHarmonizer";

export default function DailyTradingIndicator() {
  const [mode, setMode] = useState("normal");
  const [config, setConfig] = useState({
    minTrades: 1,
    maxTrades: 3,
    riskMultiplier: 1.0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const currentConfig = dailyTradingHarmonizer.getConfig();
      setMode(currentConfig.mode);
      setConfig(currentConfig);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getModeColor = () => {
    if (mode === "normal") return "text-cyan-400 border-cyan-500/40 bg-cyan-500/10";
    if (mode === "caution") return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  const getModeIcon = () => {
    if (mode === "normal") return "🚀";
    if (mode === "caution") return "⚠️";
    return "🛡️";
  };

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-lg backdrop-blur-lg border transition-all ${getModeColor()}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getModeIcon()}</span>
        <div>
          <div className="text-sm font-bold uppercase">
            {mode} Mode
          </div>
          <div className="text-xs opacity-80 flex gap-4 mt-1">
            <span>Trades: {config.minTrades}-{config.maxTrades}</span>
            <span>Risk: {(config.riskMultiplier * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
