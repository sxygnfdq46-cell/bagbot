"use client";

import { useState, useEffect } from "react";
import { getShieldFusionSignal } from "../../lib/engine/ShieldFusionIntegration";

export default function ShieldFusionIndicator() {
  const [signal, setSignal] = useState({ score: 0, classification: "LOW_THREAT", rootCause: "none", hedge: "NO_HEDGE" });

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getShieldFusionSignal();
      setSignal(current);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getClassificationColor = () => {
    switch (signal.classification) {
      case "LOW_THREAT": return "text-green-400 border-green-500/30 bg-green-500/10";
      case "MODERATE_THREAT": return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "HIGH_THREAT": return "text-orange-400 border-orange-500/30 bg-orange-500/10";
      case "CRITICAL_THREAT": return "text-red-500 border-red-500/50 bg-red-500/20";
      default: return "text-gray-400 border-gray-500/30 bg-gray-500/10";
    }
  };

  const getClassificationIcon = () => {
    switch (signal.classification) {
      case "LOW_THREAT": return "🟢";
      case "MODERATE_THREAT": return "🟡";
      case "HIGH_THREAT": return "🟠";
      case "CRITICAL_THREAT": return "🔴";
      default: return "⚪";
    }
  };

  const getClassificationLabel = () => {
    switch (signal.classification) {
      case "LOW_THREAT": return "LOW";
      case "MODERATE_THREAT": return "MODERATE";
      case "HIGH_THREAT": return "HIGH";
      case "CRITICAL_THREAT": return "CRITICAL";
      default: return "UNKNOWN";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`backdrop-blur-md border rounded-lg p-4 transition-all duration-500 ${getClassificationColor()}`}>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{getClassificationIcon()}</div>
          <div>
            <div className="text-xs font-bold opacity-80">SHIELD FUSION</div>
            <div className="text-2xl font-bold">{signal.score.toFixed(1)}</div>
            <div className="text-sm font-semibold">{getClassificationLabel()} THREAT</div>
            <div className="text-xs opacity-70 mt-1">
              Root: {signal.rootCause} | Hedge: {signal.hedge}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
