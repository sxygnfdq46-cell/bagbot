"use client";

import { useEffect, useState } from "react";
import { threatSyncOrchestrator, ThreatSeverity } from "../../../engines/threat/ThreatSyncOrchestrator";

// Convert severity string to number for UI calculations
const severityToNumber = (severity: ThreatSeverity): number => {
  switch (severity) {
    case 'NONE': return 0;
    case 'LOW': return 0.25;
    case 'MEDIUM': return 0.5;
    case 'HIGH': return 0.75;
    case 'CRITICAL': return 1.0;
    default: return 0;
  }
};

export default function ThreatInfluenceIndicator() {
  const [severity, setSeverity] = useState(0);
  const [modifier, setModifier] = useState(1.0);

  useEffect(() => {
    const unsub = threatSyncOrchestrator.subscribe((stats) => {
      const severityNum = severityToNumber(stats.severity);
      setSeverity(severityNum);
      
      // Calculate modifier based on severity
      if (severityNum < 0.4) setModifier(1.0);
      else if (severityNum <= 0.65) setModifier(0.7);
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
