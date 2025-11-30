// bagbot/frontend/app/components/threat/ThreatSyncDashboard.tsx

"use client";

import React, { useEffect, useState } from "react";
import { threatSyncOrchestrator } from "@/engines/threat/ThreatSyncOrchestrator";

export default function ThreatSyncDashboard() {
  const [feed, setFeed] = useState<any>(null);

  useEffect(() => {
    // Subscribe to real-time threat updates
    threatSyncOrchestrator.subscribe((data) => {
      setFeed(data);
    });

    // Trigger first sync
    threatSyncOrchestrator.sync();
  }, []);

  if (!feed) {
    return (
      <div className="text-cyan-300 animate-pulse p-6">
        Initializing Threat Sync Network…
      </div>
    );
  }

  return (
    <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-cyan-700/40 text-cyan-200 space-y-6">

      <h2 className="text-2xl font-bold text-cyan-300 tracking-wide">
        ⚡ Threat Sync Dashboard
      </h2>

      {/* Priority Level Gauge */}
      <div className="p-4 rounded-lg bg-black/20 border border-cyan-700/30">
        <p className="text-cyan-400 font-semibold">Priority Score</p>
        <div className="text-4xl font-bold text-cyan-300 mt-2">
          {feed.priorityScore}/100
        </div>
      </div>

      {/* Threat Clusters */}
      <div className="p-4 rounded-lg bg-black/20 border border-purple-700/40">
        <p className="text-purple-400 font-semibold">Active Threat Clusters</p>
        <pre className="text-xs mt-2 opacity-80">
          {JSON.stringify(feed.clusters, null, 2)}
        </pre>
      </div>

      {/* Prediction Horizon */}
      <div className="p-4 rounded-lg bg-black/20 border border-blue-700/40">
        <p className="text-blue-400 font-semibold">Prediction Window</p>
        <pre className="text-xs mt-2 opacity-80">
          {JSON.stringify(feed.prediction, null, 2)}
        </pre>
      </div>

      {/* Root Cause */}
      <div className="p-4 rounded-lg bg-black/20 border border-orange-700/40">
        <p className="text-orange-400 font-semibold">Root Cause Analysis</p>
        <pre className="text-xs mt-2 opacity-80">
          {JSON.stringify(feed.rootCause, null, 2)}
        </pre>
      </div>

      {/* Shield Signals */}
      <div className="p-4 rounded-lg bg-black/20 border border-green-700/40">
        <p className="text-green-400 font-semibold">Shield Signals</p>
        <pre className="text-xs mt-2 opacity-80">
          {JSON.stringify(feed.shieldSignals, null, 2)}
        </pre>
      </div>

      {/* Correlation Matrix */}
      <div className="p-4 rounded-lg bg-black/20 border border-yellow-600/40">
        <p className="text-yellow-400 font-semibold">Correlation Matrix</p>
        <pre className="text-xs mt-2 opacity-80">
          {JSON.stringify(feed.correlation, null, 2)}
        </pre>
      </div>

    </div>
  );
}
