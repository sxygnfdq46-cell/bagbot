"use client";

import { useEffect, useState } from "react";
import { getCurrentRiskProfile } from "../../../app/lib/risk/RiskIntegration";

export default function RiskCurveIndicator() {
  const [profile, setProfile] = useState({
    risk: 0.5,
    lotSize: 0.5,
    stopLoss: 0.1,
    takeProfit: 0.05,
    tradeFrequency: 0.5,
    mode: "normal"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProfile(getCurrentRiskProfile());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getModeColor = () => {
    if (profile.mode === "hypertrade") return "text-green-400 border-green-500/40 bg-green-500/10";
    if (profile.mode === "normal") return "text-cyan-400 border-cyan-500/40 bg-cyan-500/10";
    if (profile.mode === "reduced") return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  const getModeIcon = () => {
    if (profile.mode === "hypertrade") return "🚀";
    if (profile.mode === "normal") return "📊";
    if (profile.mode === "reduced") return "🛡️";
    return "🔒";
  };

  const getRiskBarWidth = () => {
    return `${profile.risk * 100}%`;
  };

  const getRiskBarColor = () => {
    if (profile.risk <= 0.2) return "bg-green-500";
    if (profile.risk <= 0.4) return "bg-cyan-500";
    if (profile.risk <= 0.7) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={`fixed top-6 right-6 z-40 px-4 py-3 rounded-lg backdrop-blur-lg border transition-all ${getModeColor()} min-w-[280px]`}>
      <div className="text-xs font-bold mb-2 flex items-center gap-2">
        <span className="text-lg">{getModeIcon()}</span>
        Risk Curve: {profile.mode.toUpperCase()}
      </div>
      
      {/* Risk Bar */}
      <div className="w-full h-2 bg-black/40 rounded-full mb-3 overflow-hidden">
        <div 
          className={`h-full ${getRiskBarColor()} transition-all duration-500`}
          style={{ width: getRiskBarWidth() }}
        />
      </div>

      {/* Risk Parameters */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs opacity-80">
        <div>Lot: {(profile.lotSize * 100).toFixed(0)}%</div>
        <div>SL: {(profile.stopLoss * 100).toFixed(1)}%</div>
        <div>TP: {(profile.takeProfit * 100).toFixed(1)}%</div>
        <div>Freq: {(profile.tradeFrequency * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}
