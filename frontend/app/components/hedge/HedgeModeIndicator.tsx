"use client";

import { useState, useEffect } from "react";
import { getHedgeProfile } from "../../lib/engine/HedgeIntegration";

export default function HedgeModeIndicator() {
  const [profile, setProfile] = useState({ mode: "inactive", size: 0, comment: "Market stable — no hedge needed." });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getHedgeProfile();
      setProfile(current);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getModeIcon = () => {
    switch (profile.mode) {
      case "inactive": return "✓";
      case "micro": return "🛡️";
      case "stabilizer": return "⚖️";
      case "crisis": return "🚨";
      default: return "✓";
    }
  };

  const getModeColor = () => {
    switch (profile.mode) {
      case "inactive": return "text-gray-400 border-gray-500/30 bg-gray-500/10";
      case "micro": return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "stabilizer": return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      case "crisis": return "text-red-500 border-red-500/50 bg-red-500/20";
      default: return "text-gray-400 border-gray-500/30 bg-gray-500/10";
    }
  };

  const getModeLabel = () => {
    switch (profile.mode) {
      case "inactive": return "NO HEDGE";
      case "micro": return "MICRO HEDGE";
      case "stabilizer": return "STABILIZER";
      case "crisis": return "CRISIS HEDGE";
      default: return "NO HEDGE";
    }
  };

  return (
    <div className="fixed bottom-32 left-4 z-50">
      <div className={`backdrop-blur-md border rounded-lg p-3 transition-all duration-500 ${getModeColor()}`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getModeIcon()}</div>
          <div>
            <div className="text-xs font-bold opacity-80">HEDGE MODE</div>
            <div className="text-lg font-bold">{getModeLabel()}</div>
            <div className="text-xs opacity-70">{profile.comment}</div>
            {profile.size > 0 && (
              <div className="text-xs mt-1 font-mono">
                Size: {(profile.size * 100).toFixed(1)}% of position
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
