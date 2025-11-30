"use client";

import { useEffect, useState } from "react";
import { threatSyncOrchestrator, ThreatSeverity } from "../../../engines/threat/ThreatSyncOrchestrator";

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

export default function ThreatReactivePanel() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = threatSyncOrchestrator.subscribe((stats) => {
      setData(stats);
      const severityNum = severityToNumber(stats.severity);

      if (severityNum > 0.6) {
        setVisible(true);
        setTimeout(() => setVisible(false), 9000); // auto-hide after 9s
      }
    });

    return () => unsubscribe();
  }, []);

  if (!visible || !data) return null;

  return (
    <div className="fixed right-0 top-20 z-50 w-[380px] bg-black/60 backdrop-blur-2xl border border-red-500/40 rounded-l-2xl p-6 shadow-2xl animate-slide-left">
      <h1 className="text-red-400 font-bold text-lg mb-3">
        ⚠️ Threat Spike Detected
      </h1>

      <p className="text-white/90 text-sm mb-2">
        Severity Level: <span className="text-red-300">{(data.severity * 100).toFixed(1)}%</span>
      </p>

      <p className="text-white/80 text-sm mb-4">
        Active Clusters: {data.clusters?.length || 0}
      </p>

      <div className="bg-red-500/20 rounded-md p-3 border border-red-500/30 text-sm">
        {data.recommendation || "System evaluating safest response..."}
      </div>
    </div>
  );
}
