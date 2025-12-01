"use client";

import React from "react";
import PredictionHalo from "./PredictionHalo";
import FutureArcs from "./FutureArcs";
import ProbabilityWave from "./ProbabilityWave";

interface PredictiveVisionHaloProps {
  confidence: number; // 0-100
  riskLevel: number; // 0-100
  direction: "up" | "down" | "neutral";
  intensity: number; // 0-100
  probability: number; // 0-1
  anomaly: boolean;
}

export default function PredictiveVisionHalo({
  confidence,
  riskLevel,
  direction,
  intensity,
  probability,
  anomaly,
}: PredictiveVisionHaloProps) {
  return (
    <div className="relative w-full rounded-xl border border-cyan-500/30 bg-slate-900/40 backdrop-blur-sm p-6">
      {/* Hologram Title */}
      <div className="mb-6 text-center">
        <h3
          className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-purple-400"
          style={{
            textShadow: "0 0 20px rgba(6,182,212,0.5), 0 0 40px rgba(34,197,94,0.3)",
          }}
        >
          PREDICTIVE VISION HALO
        </h3>
      </div>

      {/* Main Vision Container */}
      <div className="relative w-full aspect-square max-w-md mx-auto">
        {/* Background Halo */}
        <PredictionHalo confidence={confidence} riskLevel={riskLevel} anomaly={anomaly} />

        {/* Overlaid Future Arcs */}
        <FutureArcs direction={direction} intensity={intensity} />
      </div>

      {/* Probability Wave */}
      <div className="mt-6">
        <ProbabilityWave probability={probability} anomaly={anomaly} />
      </div>

      {/* Metrics Display */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="flex justify-between p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-cyan-300">Confidence</span>
          <span className="text-cyan-100 font-mono">{confidence.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-red-500/10 border border-red-500/20">
          <span className="text-red-300">Risk Level</span>
          <span className="text-red-100 font-mono">{riskLevel.toFixed(0)}%</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-green-500/10 border border-green-500/20">
          <span className="text-green-300">Direction</span>
          <span className="text-green-100 font-mono uppercase">{direction}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-purple-500/10 border border-purple-500/20">
          <span className="text-purple-300">Probability</span>
          <span className="text-purple-100 font-mono">{(probability * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Anomaly Alert */}
      {anomaly && (
        <div className="mt-4 p-3 rounded-lg border-2 border-red-500/50 bg-red-950/30 text-center">
          <div className="flex items-center justify-center gap-2 text-red-300">
            <span className="text-xl animate-pulse">⚠️</span>
            <span className="font-bold">ANOMALY DETECTED</span>
          </div>
        </div>
      )}
    </div>
  );
}
