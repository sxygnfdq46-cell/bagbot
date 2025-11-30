"use client";

import { useEffect, useState } from "react";
import { temporalThreatMemory } from "../../../app/lib/intel/TemporalThreatMemory";

export default function ThreatMemoryIndicator() {
  const [memoryMode, setMemoryMode] = useState("clear");
  const [threatScore, setThreatScore] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryMode(temporalThreatMemory.getMode());
      setThreatScore(temporalThreatMemory.getThreatScore());
      setEventCount(temporalThreatMemory.getMemoryCount());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (memoryMode === "clear") return null; // Hide when clear

  const getModeColor = () => {
    if (memoryMode === "memory-caution") return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  const getModeIcon = () => {
    if (memoryMode === "memory-caution") return "⚠️";
    return "🧠";
  };

  return (
    <div className={`fixed top-20 right-6 z-40 px-4 py-2 rounded-lg backdrop-blur-lg border transition-all ${getModeColor()}`}>
      <div className="text-xs font-bold mb-1 flex items-center gap-2">
        <span>{getModeIcon()}</span>
        Threat Memory Active
      </div>
      <div className="text-xs opacity-80">
        <div>Score: {threatScore.toFixed(1)}/5.0</div>
        <div>Events: {eventCount} (3h window)</div>
      </div>
    </div>
  );
}
