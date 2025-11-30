"use client";

import { useEffect, useState } from "react";
import { threatSyncOrchestrator } from "@/engines/threat/ThreatSyncOrchestrator";

export default function ThreatOverlay() {
  const [activeThreats, setActiveThreats] = useState(0);

  useEffect(() => {
    const unsubscribe = threatSyncOrchestrator.subscribe((stats) => {
      setActiveThreats(stats.totalThreats || 0);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className="rounded-full h-14 w-14 flex items-center justify-center bg-black/40 backdrop-blur-xl border border-red-500 animate-pulse shadow-red-500/40 shadow-xl"
        style={{
          border: activeThreats > 0 ? "border-red-500" : "border-gray-600",
        }}
      >
        <span className="text-white font-bold text-lg">{activeThreats}</span>
      </div>
    </div>
  );
}
