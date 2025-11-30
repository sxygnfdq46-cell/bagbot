"use client";

import { useEffect, useState } from "react";
import { threatSyncOrchestrator, ThreatSeverity } from "../../../engines/threat/ThreatSyncOrchestrator";

// Convert severity string to number
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

interface ThreatData {
  totalThreats: number;
  severity: "green" | "yellow" | "red";
  sources: string[];
}

export default function ThreatReactivePanel() {
  const [data, setData] = useState<ThreatData>({
    totalThreats: 0,
    severity: "green",
    sources: []
  });

  useEffect(() => {
    const unsub = threatSyncOrchestrator.subscribe((stats) => {
      const severityNum = severityToNumber(stats.severity);
      
      // Map numeric severity to color
      let severityColor: "green" | "yellow" | "red" = "green";
      if (severityNum > 0.65) severityColor = "red";
      else if (severityNum > 0.4) severityColor = "yellow";

      setData({
        totalThreats: 0, // ThreatState doesn't have totalThreats
        severity: severityColor,
        sources: [stats.source]
      });
    });
    return () => unsub();
  }, []);

  const getSeverityColor = () => {
    if (data.severity === "green") return "text-green-400 border-green-500/40 bg-green-500/10";
    if (data.severity === "yellow") return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  const getAnimationClass = () => {
    if (data.severity === "green") return "";
    if (data.severity === "yellow") return "animate-pulse";
    return "animate-pulse ring-2 ring-red-500/50";
  };

  return (
    <div className={`panel threat-${data.severity} ${getSeverityColor()} ${getAnimationClass()} 
      backdrop-blur-xl border rounded-2xl p-6 transition-all duration-500`}>
      
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
        <span className="text-3xl">🛡️</span>
        Threat Monitor
      </h2>

      <div className="threat-count text-6xl font-black mb-4">
        {data.totalThreats}
      </div>

      <div className={`severity-badge inline-block px-4 py-2 rounded-full text-sm font-bold mb-4 ${getSeverityColor()}`}>
        {data.severity.toUpperCase()}
      </div>

      <div className="threat-sources mt-6">
        <h3 className="text-sm font-semibold mb-2 opacity-70">Active Sources:</h3>
        <ul className="space-y-1">
          {data.sources.map((src) => (
            <li key={src} className="text-sm opacity-90 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current"></span>
              {src}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
