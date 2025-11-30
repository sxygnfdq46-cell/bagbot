"use client";

import { useEffect, useState } from "react";
import { threatSyncOrchestrator } from "@/engines/threat/ThreatSyncOrchestrator";

export default function ThreatInfluenceIndicator() {
  const [severity, setSeverity] = useState(0);
  const [modifier, setModifier] = useState(1.0);

  useEffect(() => {
    const unsub = threatSyncOrchestrator.subscribe((stats) => {
      setSeverity(stats.severity || 0);
      
      // Calculate modifier based on severity
      if (stats.severity < 0.4) setModifier(1.0);
      else if (stats.severity <= 0.65) setModifier(0.7);
      else setModifier(0.4);
    });
    return () => unsub();
  }, []);

  if (severity < 0.4) return null; // Hide when green

  const isYellow = severity >= 0.4 && severity <= 0.65;
  const isRed = severity > 0.65;

  return (
    <div className={`fixed top-20 left-6 z-40 px-4 py-2 rounded-lg backdrop-blur-lg border transition-all ${
      isYellow 
        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' 
        : 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
    }`}>
      <div className="text-xs font-bold mb-1">
        ⚠️ Threat Influence Active
      </div>
      <div className="text-xs opacity-80">
        Fusion modifier: {(modifier * 100).toFixed(0)}%
      </div>
    </div>
  );
}
