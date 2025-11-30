"use client";

import React from "react";
import { motion } from "framer-motion";

interface PredictionHaloProps {
  confidence: number; // 0-100: Overall confidence
  riskLevel: number; // 0-100: Risk assessment
  anomaly: boolean; // Anomaly detection flag
}

export default function PredictionHalo({
  confidence,
  riskLevel,
  anomaly,
}: PredictionHaloProps) {
  // Calculate halo opacity based on confidence
  const haloOpacity = 0.2 + (confidence / 100) * 0.6; // 0.2 to 0.8

  // Calculate pulse speed based on risk level (higher risk = faster pulse)
  const pulseDuration = 4 - (riskLevel / 100) * 2; // 4s to 2s

  // Determine halo color based on state
  const getHaloColor = () => {
    if (anomaly) {
      return {
        start: "rgba(168, 85, 247, 0.4)", // Purple
        middle: "rgba(239, 68, 68, 0.3)", // Red
        end: "rgba(168, 85, 247, 0.1)", // Purple fade
      };
    }
    if (riskLevel > 70) {
      return {
        start: "rgba(239, 68, 68, 0.4)", // Red
        middle: "rgba(251, 146, 60, 0.3)", // Orange
        end: "rgba(239, 68, 68, 0.1)", // Red fade
      };
    }
    if (confidence > 70) {
      return {
        start: "rgba(34, 197, 94, 0.4)", // Green
        middle: "rgba(6, 182, 212, 0.3)", // Cyan
        end: "rgba(34, 197, 94, 0.1)", // Green fade
      };
    }
    return {
      start: "rgba(59, 130, 246, 0.4)", // Blue
      middle: "rgba(168, 85, 247, 0.3)", // Purple
      end: "rgba(59, 130, 246, 0.1)", // Blue fade
    };
  };

  const haloColors = getHaloColor();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Outer Halo Ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "90%",
          height: "90%",
          background: `radial-gradient(circle, ${haloColors.start} 0%, ${haloColors.middle} 40%, ${haloColors.end} 70%, transparent 100%)`,
          opacity: haloOpacity,
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [haloOpacity * 0.8, haloOpacity, haloOpacity * 0.8],
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Middle Fog Layer */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "70%",
          height: "70%",
          background: `radial-gradient(circle, ${haloColors.start} 0%, ${haloColors.middle} 50%, transparent 100%)`,
          opacity: haloOpacity * 0.6,
          filter: "blur(20px)",
        }}
        animate={{
          scale: [1.02, 0.98, 1.02],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: pulseDuration * 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Inner Core Glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: "40%",
          height: "40%",
          background: `radial-gradient(circle, ${haloColors.start} 0%, ${haloColors.middle} 60%, transparent 100%)`,
          opacity: haloOpacity * 0.8,
          filter: "blur(15px)",
        }}
        animate={{
          scale: [0.95, 1.08, 0.95],
          opacity: [haloOpacity * 0.6, haloOpacity * 0.9, haloOpacity * 0.6],
        }}
        transition={{
          duration: pulseDuration * 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Anomaly Warning Ring */}
      {anomaly && (
        <motion.div
          className="absolute rounded-full border-2"
          style={{
            width: "95%",
            height: "95%",
            borderColor: "rgba(239, 68, 68, 0.6)",
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.4), inset 0 0 30px rgba(239, 68, 68, 0.2)",
          }}
          animate={{
            scale: [1, 1.03, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Center Dot */}
      <motion.div
        className="absolute w-3 h-3 rounded-full"
        style={{
          background: anomaly
            ? "rgba(239, 68, 68, 0.8)"
            : confidence > 70
            ? "rgba(34, 197, 94, 0.8)"
            : "rgba(59, 130, 246, 0.8)",
          boxShadow: `0 0 20px ${
            anomaly
              ? "rgba(239, 68, 68, 0.6)"
              : confidence > 70
              ? "rgba(34, 197, 94, 0.6)"
              : "rgba(59, 130, 246, 0.6)"
          }`,
        }}
        animate={{
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
