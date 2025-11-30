"use client";

import { useEffect, useState } from "react";
import { getStrategyInfo } from "../../../app/lib/strategy/StrategyIntegration";

export default function ShieldStrategyIndicator() {
  const [info, setInfo] = useState({
    mode: "safe",
    strategy: "aggressive",
    shieldScore: 0,
    description: "Aggressive / high-profit"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setInfo(getStrategyInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getModeColor = () => {
    if (info.mode === "safe") return "text-cyan-400 border-cyan-500/40 bg-cyan-500/10";
    if (info.mode === "caution") return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    if (info.mode === "danger") return "text-orange-400 border-orange-500/40 bg-orange-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse";
  };

  const getModeIcon = () => {
    if (info.mode === "safe") return "🚀";
    if (info.mode === "caution") return "⚖️";
    if (info.mode === "danger") return "🛡️";
    return "⏸️";
  };

  return (
    <div className={`fixed bottom-6 right-6 z-40 px-4 py-3 rounded-lg backdrop-blur-lg border transition-all ${getModeColor()}`}>
      <div className="text-xs font-bold mb-2 flex items-center gap-2">
        <span className="text-lg">{getModeIcon()}</span>
        Shield Strategy: {info.strategy.toUpperCase()}
      </div>
      <div className="text-xs opacity-80 space-y-1">
        <div>{info.description}</div>
        <div className="flex gap-3">
          <span>Mode: {info.mode}</span>
          <span>Score: {info.shieldScore}/10</span>
        </div>
      </div>
    </div>
  );
}
