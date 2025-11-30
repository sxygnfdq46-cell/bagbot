"use client";

import React, { useState, useEffect } from "react";
import { eventBus } from "../../lib/runtime/eventBus";

export default function RDSIndicator() {
  const [distortionLevel, setDistortionLevel] = useState(0);

  useEffect(() => {
    const handler = (data: any) => {
      if (data.distortion !== undefined) {
        setDistortionLevel(data.distortion);
      }
    };

    eventBus.on("tick", handler);
    return () => {
      eventBus.off("tick", handler);
    };
  }, []);

  const getLevelColor = () => {
    if (distortionLevel === 0) return "text-green-400";
    if (distortionLevel === 1) return "text-yellow-400";
    if (distortionLevel === 2) return "text-orange-400";
    return "text-red-400";
  };

  const getLevelLabel = () => {
    if (distortionLevel === 0) return "STABLE";
    if (distortionLevel === 1) return "MINOR";
    if (distortionLevel === 2) return "MODERATE";
    return "CRITICAL";
  };

  return (
    <div className="fixed bottom-32 right-4 bg-black/50 backdrop-blur-md border border-gray-700 rounded-lg p-3 w-56 shadow-lg">
      <div className="text-white text-xs font-bold mb-2 border-b border-gray-600 pb-1">
        ⚠️ REALITY DISTORTION STABILIZER
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-300 text-xs">Distortion Level:</span>
        <span className={`text-sm font-bold ${getLevelColor()}`}>
          {distortionLevel}/3 — {getLevelLabel()}
        </span>
      </div>

      {distortionLevel >= 3 && (
        <div className="mt-2 text-xs text-red-400 border-t border-red-900/50 pt-2">
          🛡️ SAFE MODE ACTIVE
        </div>
      )}
    </div>
  );
}
