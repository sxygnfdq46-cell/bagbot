"use client";

import { useState, useEffect } from "react";
import { getReactionProfile } from "../../lib/engine/ReactionIntegration";

export default function ReactionModeIndicator() {
  const [profile, setProfile] = useState({ mode: "SteadyMode", action: "normal", description: "Market stable — normal trading." });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getReactionProfile();
      setProfile(current);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getModeIcon = () => {
    switch (profile.mode) {
      case "SteadyMode": return "📊";
      case "ReduceMode": return "⚠️";
      case "MicroTradeMode": return "🔒";
      case "PauseMode": return "⏸️";
      case "LockdownMode": return "🛑";
      case "HedgeMode": return "🛡️";
      case "ReverseMode": return "🔄";
      default: return "📊";
    }
  };

  const getModeColor = () => {
    switch (profile.mode) {
      case "SteadyMode": return "text-green-400 border-green-500/30 bg-green-500/10";
      case "ReduceMode": return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "MicroTradeMode": return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      case "PauseMode": return "text-red-400 border-red-500/30 bg-red-500/10";
      case "LockdownMode": return "text-red-600 border-red-600/50 bg-red-600/20";
      case "HedgeMode": return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
      case "ReverseMode": return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default: return "text-gray-400 border-gray-500/30 bg-gray-500/10";
    }
  };

  return (
    <div className="fixed top-24 left-4 z-50">
      <div className={`backdrop-blur-md border rounded-lg p-3 transition-all duration-500 ${getModeColor()}`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getModeIcon()}</div>
          <div>
            <div className="text-xs font-bold opacity-80">REACTION MODE</div>
            <div className="text-lg font-bold">{profile.mode}</div>
            <div className="text-xs opacity-70">{profile.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
