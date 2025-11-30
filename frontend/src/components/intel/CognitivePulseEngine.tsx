"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface CognitivePulseEngineProps {
  fusionScore: number; // 0-100: Ring thickness
  divergenceScore: number; // 0-100: Glitch jitter
  volatility: number; // 0-100: Pulse speed
  confidence: number; // 0-100: Brightness
}

interface RingState {
  id: number;
  scale: number;
  opacity: number;
  rotation: number;
  jitterX: number;
  jitterY: number;
}

export default function CognitivePulseEngine({
  fusionScore,
  divergenceScore,
  volatility,
  confidence,
}: CognitivePulseEngineProps) {
  const [rings, setRings] = useState<RingState[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  // Number of rings (3-5 based on fusion score)
  const ringCount = Math.min(5, Math.max(3, Math.floor(3 + (fusionScore / 50))));

  // Ring colors progression (purple -> blue -> cyan)
  const ringColors = [
    { r: 168, g: 85, b: 247 }, // Purple #A855F7
    { r: 139, g: 92, b: 246 }, // Violet #8B5CF6
    { r: 99, g: 102, b: 241 }, // Indigo #6366F1
    { r: 59, g: 130, b: 246 }, // Blue #3B82F6
    { r: 6, g: 182, b: 212 }, // Cyan #06B6D4
  ];

  // Initialize rings
  useEffect(() => {
    const initialRings: RingState[] = [];
    for (let i = 0; i < ringCount; i = i + 1) {
      initialRings.push({
        id: i,
        scale: 0.2 + i * 0.2,
        opacity: 0.8 - i * 0.15,
        rotation: i * 60,
        jitterX: 0,
        jitterY: 0,
      });
    }
    setRings(initialRings);
  }, [ringCount]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.016; // ~60fps

      // Pulse speed based on volatility (0.5x to 3x speed)
      const speedMultiplier = 0.5 + (volatility / 100) * 2.5;
      const time = timeRef.current * speedMultiplier;

      setRings((prevRings) =>
        prevRings.map((ring, index) => {
          // Calculate pulse phase for this ring
          const phaseOffset = index * 0.3;
          const pulsePhase = Math.sin(time + phaseOffset);

          // Scale oscillation
          const baseScale = 0.2 + index * 0.2;
          const scaleAmplitude = 0.15;
          const scale = baseScale + pulsePhase * scaleAmplitude;

          // Opacity oscillation
          const baseOpacity = 0.8 - index * 0.15;
          const opacityAmplitude = 0.3;
          const opacity = Math.max(0.1, baseOpacity + pulsePhase * opacityAmplitude);

          // Rotation
          const rotationSpeed = 10 + index * 5;
          const rotation = (ring.rotation + rotationSpeed * 0.016) % 360;

          // Glitch jitter based on divergence
          let jitterX = 0;
          let jitterY = 0;
          if (divergenceScore > 50) {
            const jitterIntensity = (divergenceScore - 50) / 50;
            const shouldJitter = Math.random() < jitterIntensity * 0.1;
            if (shouldJitter) {
              jitterX = (Math.random() - 0.5) * 20 * jitterIntensity;
              jitterY = (Math.random() - 0.5) * 20 * jitterIntensity;
            }
          }

          return {
            ...ring,
            scale,
            opacity,
            rotation,
            jitterX,
            jitterY,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [volatility, divergenceScore]);

  // Calculate ring thickness based on fusion score (2-8px)
  const ringThickness = 2 + (fusionScore / 100) * 6;

  // Calculate brightness based on confidence (0.3 to 1.0)
  const brightnessMultiplier = 0.3 + (confidence / 100) * 0.7;

  return (
    <div className="relative w-full rounded-xl border border-cyan-500/30 bg-slate-900/40 backdrop-blur-sm p-6">
      {/* Hologram Title */}
      <div className="mb-4 text-center">
        <h3
          className="text-lg font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400"
          style={{
            textShadow: "0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(6,182,212,0.3)",
          }}
        >
          COGNITIVE PULSE ENGINE
        </h3>
      </div>

      {/* Pulse Rings Container */}
      <div className="relative w-full aspect-square max-w-md mx-auto flex items-center justify-center">
        {/* Center Core */}
        <motion.div
          className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            boxShadow: `0 0 20px rgba(168,85,247,${brightnessMultiplier}), 0 0 40px rgba(6,182,212,${brightnessMultiplier * 0.6})`,
          }}
        />

        {/* Concentric Rings */}
        {rings.map((ring, index) => {
          const color = ringColors[index % ringColors.length];
          const rgbColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
          const shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${ring.opacity * brightnessMultiplier})`;

          return (
            <motion.div
              key={ring.id}
              className="absolute rounded-full"
              style={{
                width: `${ring.scale * 100}%`,
                height: `${ring.scale * 100}%`,
                border: `${ringThickness}px solid ${rgbColor}`,
                opacity: ring.opacity * brightnessMultiplier,
                transform: `rotate(${ring.rotation}deg) translate(${ring.jitterX}px, ${ring.jitterY}px)`,
                boxShadow: `0 0 ${20 + index * 10}px ${shadowColor}, inset 0 0 ${15 + index * 5}px ${shadowColor}`,
                transition: "transform 0.1s ease-out",
              }}
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 1 + index * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Outer Glow */}
        <div
          className="absolute w-full h-full rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, transparent 40%, rgba(168,85,247,${0.1 * brightnessMultiplier}) 70%, transparent 100%)`,
          }}
        />
      </div>

      {/* Metrics Display */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="flex justify-between p-2 rounded bg-purple-500/10 border border-purple-500/20">
          <span className="text-purple-300">Fusion</span>
          <span className="text-purple-100 font-mono">{fusionScore.toFixed(0)}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-blue-500/10 border border-blue-500/20">
          <span className="text-blue-300">Confidence</span>
          <span className="text-blue-100 font-mono">{confidence.toFixed(0)}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-cyan-300">Volatility</span>
          <span className="text-cyan-100 font-mono">{volatility.toFixed(0)}</span>
        </div>
        <div className="flex justify-between p-2 rounded bg-red-500/10 border border-red-500/20">
          <span className="text-red-300">Divergence</span>
          <span className="text-red-100 font-mono">{divergenceScore.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
