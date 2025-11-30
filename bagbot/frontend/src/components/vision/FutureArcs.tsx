"use client";

import React from "react";
import { motion } from "framer-motion";

interface FutureArcsProps {
  direction: "up" | "down" | "neutral"; // Predicted market direction
  intensity: number; // 0-100: Prediction strength
}

export default function FutureArcs({ direction, intensity }: FutureArcsProps) {
  // Number of arcs based on intensity (3-5 arcs)
  const arcCount = Math.min(5, Math.max(3, Math.floor(3 + (intensity / 50))));

  // Color logic based on direction
  const getArcColor = () => {
    switch (direction) {
      case "up":
        return {
          primary: "rgba(34, 197, 94, 0.6)", // Green
          secondary: "rgba(6, 182, 212, 0.4)", // Cyan
          glow: "rgba(34, 197, 94, 0.8)",
        };
      case "down":
        return {
          primary: "rgba(239, 68, 68, 0.6)", // Red
          secondary: "rgba(251, 146, 60, 0.4)", // Orange
          glow: "rgba(239, 68, 68, 0.8)",
        };
      case "neutral":
        return {
          primary: "rgba(168, 85, 247, 0.6)", // Purple
          secondary: "rgba(59, 130, 246, 0.4)", // Blue
          glow: "rgba(168, 85, 247, 0.8)",
        };
      default:
        return {
          primary: "rgba(100, 116, 139, 0.6)", // Gray
          secondary: "rgba(71, 85, 105, 0.4)", // Dark gray
          glow: "rgba(100, 116, 139, 0.8)",
        };
    }
  };

  const colors = getArcColor();

  // Calculate arc properties
  const baseRadius = 60;
  const arcSpacing = 15;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 200 200"
        className="overflow-visible"
      >
        <defs>
          {/* Arc gradient */}
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} stopOpacity="0" />
            <stop offset="50%" stopColor={colors.primary} stopOpacity="1" />
            <stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="arcGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Render arcs */}
        {Array.from({ length: arcCount }).map((_, index) => {
          const radius = baseRadius + index * arcSpacing;
          const strokeWidth = 2 + (intensity / 100) * 3; // 2-5px based on intensity
          const opacity = 0.4 + (intensity / 100) * 0.5; // 0.4-0.9

          // Arc path based on direction
          const startAngle = direction === "up" ? 220 : direction === "down" ? 40 : 180;
          const endAngle = direction === "up" ? 320 : direction === "down" ? 140 : 360;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const startX = 100 + radius * Math.cos(startRad);
          const startY = 100 + radius * Math.sin(startRad);
          const endX = 100 + radius * Math.cos(endRad);
          const endY = 100 + radius * Math.sin(endRad);

          const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;

          return (
            <motion.path
              key={`arc-${index}`}
              d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
              fill="none"
              stroke="url(#arcGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={opacity}
              filter="url(#arcGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1, 0],
                opacity: [0, opacity, 0],
              }}
              transition={{
                duration: 3 + index * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.3,
              }}
            />
          );
        })}

        {/* Direction indicator */}
        {direction !== "neutral" && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {direction === "up" ? (
              <path
                d="M 100 70 L 110 85 L 100 80 L 90 85 Z"
                fill={colors.glow}
                opacity={0.8}
              />
            ) : (
              <path
                d="M 100 130 L 110 115 L 100 120 L 90 115 Z"
                fill={colors.glow}
                opacity={0.8}
              />
            )}
          </motion.g>
        )}
      </svg>
    </div>
  );
}
