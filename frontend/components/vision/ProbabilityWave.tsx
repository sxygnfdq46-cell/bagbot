"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ProbabilityWaveProps {
  probability: number; // 0-1: Probability value
  anomaly: boolean; // Anomaly flag
}

export default function ProbabilityWave({
  probability,
  anomaly,
}: ProbabilityWaveProps) {
  const [waveOffset, setWaveOffset] = useState(0);

  // Animate wave offset
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset((prev) => (prev + 1) % 360);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Color logic based on probability and anomaly
  const getWaveColor = () => {
    if (anomaly) {
      return {
        stroke: "rgba(168, 85, 247, 0.8)", // Purple
        fill: "rgba(168, 85, 247, 0.2)",
        glow: "rgba(168, 85, 247, 0.6)",
      };
    }
    if (probability > 0.7) {
      return {
        stroke: "rgba(34, 197, 94, 0.8)", // Green - upward potential
        fill: "rgba(34, 197, 94, 0.2)",
        glow: "rgba(34, 197, 94, 0.6)",
      };
    }
    if (probability < 0.3) {
      return {
        stroke: "rgba(239, 68, 68, 0.8)", // Red - downward risk
        fill: "rgba(239, 68, 68, 0.2)",
        glow: "rgba(239, 68, 68, 0.6)",
      };
    }
    return {
      stroke: "rgba(59, 130, 246, 0.8)", // Blue - stable
      fill: "rgba(59, 130, 246, 0.2)",
      glow: "rgba(59, 130, 246, 0.6)",
    };
  };

  const colors = getWaveColor();

  // Generate wave path
  const generateWavePath = () => {
    const points = [];
    const amplitude = 20 + probability * 30; // Wave height based on probability
    const frequency = 0.05;
    const baseY = 100;

    for (let x = 0; x <= 300; x += 5) {
      const y =
        baseY +
        Math.sin((x + waveOffset) * frequency) * amplitude +
        Math.sin((x + waveOffset) * frequency * 2) * (amplitude * 0.3);
      points.push(`${x},${y}`);
    }

    // Create closed path for fill
    const pathData = `M 0,${baseY} L ${points.join(" L ")} L 300,${baseY} Z`;
    return pathData;
  };

  // Generate stroke-only wave path
  const generateStrokePath = () => {
    const points = [];
    const amplitude = 20 + probability * 30;
    const frequency = 0.05;
    const baseY = 100;

    for (let x = 0; x <= 300; x += 3) {
      const y =
        baseY +
        Math.sin((x + waveOffset) * frequency) * amplitude +
        Math.sin((x + waveOffset) * frequency * 2) * (amplitude * 0.3);
      points.push(`${x},${y}`);
    }

    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="relative w-full h-32">
      <svg width="100%" height="100%" viewBox="0 0 300 200" preserveAspectRatio="none">
        <defs>
          {/* Gradient for fill */}
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.8" />
            <stop offset="100%" stopColor={colors.fill} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="waveGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Wave fill */}
        <motion.path
          d={generateWavePath()}
          fill="url(#waveGradient)"
          opacity={0.6}
          animate={{
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Wave stroke */}
        <motion.path
          d={generateStrokePath()}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={2}
          strokeLinecap="round"
          filter="url(#waveGlow)"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Anomaly particles */}
        {anomaly && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.circle
                key={`particle-${i}`}
                cx={60 + i * 50}
                cy={100}
                r={2}
                fill={colors.glow}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  y: [-20, 20, -20],
                  x: [0, Math.sin(i) * 10, 0],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}
      </svg>

      {/* Probability label */}
      <div className="absolute top-2 right-2 text-xs font-mono">
        <span
          className="px-2 py-1 rounded"
          style={{
            color: colors.stroke,
            backgroundColor: colors.fill,
            border: `1px solid ${colors.stroke}`,
          }}
        >
          {(probability * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
