"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface DecisionRecord {
  outcome: "win" | "loss" | "neutral" | "anomaly";
}

interface DecisionMemoryCoreProps {
  recentDecisions: DecisionRecord[];
  confidence: number; // 0-100: Node glow intensity
  learningPulse: number; // 0-100: Ring pulse speed
}

export default function DecisionMemoryCore({
  recentDecisions,
  confidence,
  learningPulse,
}: DecisionMemoryCoreProps) {
  const [rotation, setRotation] = useState(0);

  // Ensure we have exactly 24 nodes (pad or truncate as needed)
  const nodeCount = 24;
  const nodes = [...recentDecisions];
  while (nodes.length < nodeCount) {
    nodes.push({ outcome: "neutral" });
  }
  const displayNodes = nodes.slice(0, nodeCount);

  // Subtle rotation animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 0.1) % 360);
    }, 50); // ~20fps for subtle effect

    return () => clearInterval(interval);
  }, []);

  // Node color logic
  const getNodeColor = (outcome: string) => {
    switch (outcome) {
      case "win":
        return { bg: "rgb(34, 197, 94)", shadow: "rgba(34, 197, 94, 0.8)", label: "green" };
      case "loss":
        return { bg: "rgb(239, 68, 68)", shadow: "rgba(239, 68, 68, 0.8)", label: "red" };
      case "neutral":
        return { bg: "rgb(59, 130, 246)", shadow: "rgba(59, 130, 246, 0.8)", label: "blue" };
      case "anomaly":
        return { bg: "rgb(168, 85, 247)", shadow: "rgba(168, 85, 247, 0.8)", label: "purple" };
      default:
        return { bg: "rgb(100, 116, 139)", shadow: "rgba(100, 116, 139, 0.8)", label: "gray" };
    }
  };

  // Calculate glow intensity from confidence
  const glowIntensity = 0.3 + (confidence / 100) * 0.7; // 0.3 to 1.0

  // Calculate pulse scale from learningPulse
  const pulseScale = 1 + (learningPulse / 100) * 0.15; // 1.0 to 1.15

  // Ring dimensions
  const ringRadius = 140;
  const ringStrokeWidth = 3;
  const nodeRadius = 8;

  return (
    <div className="relative w-full rounded-xl border border-purple-500/30 bg-slate-900/40 backdrop-blur-sm p-6">
      {/* Hologram Title */}
      <div className="mb-6 text-center">
        <h3
          className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-purple-400 to-cyan-400"
          style={{
            textShadow: "0 0 20px rgba(34,197,94,0.5), 0 0 40px rgba(168,85,247,0.3)",
          }}
        >
          DECISION MEMORY CORE
        </h3>
      </div>

      {/* Memory Ring Container */}
      <div className="relative w-full aspect-square max-w-sm mx-auto">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 320 320"
          className="overflow-visible"
        >
          <defs>
            {/* Gradient for ring */}
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(168, 85, 247)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="rgb(59, 130, 246)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.8" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Center Point */}
          <circle
            cx="160"
            cy="160"
            r="4"
            fill="url(#ringGradient)"
            opacity={glowIntensity}
          />

          {/* Pulsing Memory Ring */}
          <motion.circle
            cx="160"
            cy="160"
            r={ringRadius}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth={ringStrokeWidth}
            filter="url(#glow)"
            opacity={glowIntensity * 0.8}
            animate={{
              scale: [1, pulseScale, 1],
              opacity: [glowIntensity * 0.7, glowIntensity * 0.9, glowIntensity * 0.7],
            }}
            transition={{
              duration: 2 + (100 - learningPulse) / 50, // Faster pulse with higher learningPulse
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              transformOrigin: "160px 160px",
            }}
          />

          {/* Secondary Ring (dimmer) */}
          <circle
            cx="160"
            cy="160"
            r={ringRadius - 10}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth={1}
            opacity={glowIntensity * 0.3}
          />

          {/* Memory Nodes */}
          <g transform={`rotate(${rotation}, 160, 160)`}>
            {displayNodes.map((decision, index) => {
              const angle = (index / nodeCount) * 360;
              const angleRad = (angle - 90) * (Math.PI / 180);
              const x = 160 + ringRadius * Math.cos(angleRad);
              const y = 160 + ringRadius * Math.sin(angleRad);
              const color = getNodeColor(decision.outcome);

              return (
                <motion.g
                  key={`node-${index}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.02,
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                >
                  {/* Node glow */}
                  <circle
                    cx={x}
                    cy={y}
                    r={nodeRadius * 1.8}
                    fill={color.shadow}
                    opacity={glowIntensity * 0.3}
                    filter="url(#glow)"
                  />
                  
                  {/* Node core */}
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={nodeRadius}
                    fill={color.bg}
                    stroke="white"
                    strokeWidth="1"
                    opacity={glowIntensity}
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5 + index * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                    }}
                  />

                  {/* Node inner highlight */}
                  <circle
                    cx={x - nodeRadius * 0.3}
                    cy={y - nodeRadius * 0.3}
                    r={nodeRadius * 0.4}
                    fill="white"
                    opacity={glowIntensity * 0.6}
                  />
                </motion.g>
              );
            })}
          </g>

          {/* Outer Ring Guide */}
          <circle
            cx="160"
            cy="160"
            r={ringRadius + 15}
            fill="none"
            stroke="url(#ringGradient)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
            opacity={glowIntensity * 0.2}
          />
        </svg>
      </div>

      {/* Stats Display */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="flex justify-between p-2 rounded bg-green-500/10 border border-green-500/20">
          <span className="text-green-300">Wins</span>
          <span className="text-green-100 font-mono">
            {displayNodes.filter((d) => d.outcome === "win").length}
          </span>
        </div>
        <div className="flex justify-between p-2 rounded bg-red-500/10 border border-red-500/20">
          <span className="text-red-300">Losses</span>
          <span className="text-red-100 font-mono">
            {displayNodes.filter((d) => d.outcome === "loss").length}
          </span>
        </div>
        <div className="flex justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20">
          <span className="text-blue-300">Neutral</span>
          <span className="text-blue-100 font-mono">
            {displayNodes.filter((d) => d.outcome === "neutral").length}
          </span>
        </div>
        <div className="flex justify-between p-2 rounded bg-purple-500/10 border border-purple-500/20">
          <span className="text-purple-300">Anomalies</span>
          <span className="text-purple-100 font-mono">
            {displayNodes.filter((d) => d.outcome === "anomaly").length}
          </span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex justify-between mb-1">
            <span className="text-cyan-300">Confidence</span>
            <span className="text-cyan-100 font-mono">{confidence.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-cyan-950/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
          <div className="flex justify-between mb-1">
            <span className="text-purple-300">Learning</span>
            <span className="text-purple-100 font-mono">{learningPulse.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-purple-950/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
              style={{ width: `${learningPulse}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
