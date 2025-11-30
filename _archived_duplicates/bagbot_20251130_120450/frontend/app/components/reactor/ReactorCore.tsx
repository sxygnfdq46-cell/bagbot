/**
 * 🔥 REACTOR CORE — Visual Heart of BagBot
 * 
 * STEP 24.31 Part 2 — React Component
 * 
 * This is the animated reactor visual component that displays BagBot's
 * real-time internal state as a living, breathing alien engine.
 * 
 * Requirements:
 * - React functional component using hooks
 * - Accepts ReactorState as prop
 * - Renders:
 *   * central pulsar (animated core)
 *   * shield rings (orbital protection layers)
 *   * energy grid (lattice background)
 *   * threat arcs (danger indicators)
 *   * surge lines (power surges)
 * - Use CSS animations + dynamic inline updates
 * - Fully frontend-safe
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import type { ReactorState } from '@/app/lib/avrs/ReactorSyncEngine';
import './reactor.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReactorCoreProps {
  reactorState: ReactorState;
  width?: number;
  height?: number;
  className?: string;
}

// ============================================================================
// REACTOR CORE COMPONENT
// ============================================================================

export const ReactorCore: React.FC<ReactorCoreProps> = ({
  reactorState,
  width = 400,
  height = 400,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent SSR issues
  }

  const {
    mode,
    corePulsar,
    shieldRings,
    energyGrid,
    threatArcs,
    surgeLines,
    primaryColor,
    secondaryColor,
    glowIntensity,
    pulseFrequency,
  } = reactorState;

  // Calculate center point
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div
      ref={containerRef}
      className={`reactor-core-container ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
      }}
      data-mode={mode}
    >
      {/* Energy Grid Background */}
      {energyGrid.visible && (
        <div
          className="energy-grid"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: energyGrid.intensity,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                ${primaryColor}20 0px,
                transparent 1px,
                transparent ${width / energyGrid.gridDensity}px,
                ${primaryColor}20 ${width / energyGrid.gridDensity + 1}px
              ),
              repeating-linear-gradient(
                90deg,
                ${primaryColor}20 0px,
                transparent 1px,
                transparent ${height / energyGrid.gridDensity}px,
                ${primaryColor}20 ${height / energyGrid.gridDensity + 1}px
              )
            `,
            animation: `gridFlow ${10 / energyGrid.flowSpeed}s linear infinite`,
          }}
        />
      )}

      {/* Shield Rings */}
      <div
        className="shield-rings-container"
        style={{
          position: 'absolute',
          inset: 0,
          transform: `rotate(${shieldRings.rotation}deg)`,
          transition: 'transform 0.1s linear',
        }}
      >
        {Array.from({ length: shieldRings.count }).map((_, index) => {
          const ringSize =
            50 + index * shieldRings.spacing * (1 - shieldRings.compression * 0.5);
          const ringOpacity = 0.8 - index * 0.1;

          return (
            <div
              key={`ring-${index}`}
              className="shield-ring"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${ringSize}px`,
                height: `${ringSize}px`,
                transform: 'translate(-50%, -50%)',
                border: `${shieldRings.thickness}px solid ${primaryColor}`,
                borderRadius: '50%',
                opacity: ringOpacity * glowIntensity,
                boxShadow: `
                  0 0 ${10 * glowIntensity}px ${primaryColor},
                  inset 0 0 ${8 * glowIntensity}px ${primaryColor}
                `,
                animation: `ringPulse ${2 / pulseFrequency}s ease-in-out infinite`,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          );
        })}
      </div>

      {/* Threat Arcs */}
      {threatArcs.visible && (
        <div className="threat-arcs-container">
          {Array.from({ length: threatArcs.count }).map((_, index) => {
            const angle = (360 / threatArcs.count) * index;
            const arcLength = 60 + Math.random() * 40;

            return (
              <div
                key={`threat-${index}`}
                className="threat-arc"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${arcLength}px`,
                  height: '3px',
                  background: `linear-gradient(90deg, transparent, ${threatArcs.color}, transparent)`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(${
                    width / 4
                  }px)`,
                  opacity: threatArcs.intensity,
                  animation: `threatFlicker ${1 / threatArcs.flickerSpeed}s ease-in-out infinite`,
                  animationDelay: `${index * 0.15}s`,
                  filter: `blur(${1 + Math.random()}px)`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Core Pulsar */}
      <div
        className="core-pulsar"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '80px',
          height: '80px',
          transform: `translate(-50%, -50%) scale(${corePulsar.scale}) rotate(${corePulsar.rotation}deg)`,
          opacity: corePulsar.opacity,
          transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 30% 30%,
              ${primaryColor}ff,
              ${primaryColor}cc 40%,
              ${secondaryColor}88 70%,
              transparent 100%
            )
          `,
          boxShadow: `
            0 0 ${20 * glowIntensity}px ${primaryColor},
            0 0 ${40 * glowIntensity}px ${secondaryColor},
            inset 0 0 ${15 * glowIntensity}px ${primaryColor}
          `,
          animation: `corePulse ${1 / corePulsar.pulseSpeed}s ease-in-out infinite`,
        }}
      >
        {/* Inner core glow */}
        <div
          style={{
            position: 'absolute',
            inset: '20%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${primaryColor}, transparent)`,
            animation: `innerGlow ${1.5 / corePulsar.pulseSpeed}s ease-in-out infinite`,
          }}
        />
      </div>

      {/* Surge Lines */}
      {surgeLines.active && (
        <div className="surge-lines-container">
          {Array.from({ length: surgeLines.count }).map((_, index) => {
            const angle = (360 / surgeLines.count) * index;

            return (
              <div
                key={`surge-${index}`}
                className="surge-line"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '2px',
                  height: `${height / 2}px`,
                  background: `linear-gradient(to bottom, ${surgeLines.color}, transparent)`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  transformOrigin: 'center center',
                  opacity: surgeLines.intensity,
                  animation: `surgePulse ${0.8 / surgeLines.speed}s ease-in-out infinite`,
                  animationDelay: `${index * 0.1}s`,
                  filter: 'blur(1px)',
                }}
              />
            );
          })}
        </div>
      )}

      {/* Mode indicator */}
      <div
        className="mode-indicator"
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 12px',
          background: `${primaryColor}20`,
          border: `1px solid ${primaryColor}60`,
          borderRadius: '12px',
          color: primaryColor,
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          boxShadow: `0 0 10px ${primaryColor}40`,
        }}
      >
        {mode.replace('_', ' ')}
      </div>
    </div>
  );
};

export default ReactorCore;
