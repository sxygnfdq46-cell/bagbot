/**
 * LEVEL 11.4 — COLLECTIVE INTELLIGENCE HUB
 * 
 * Dashboard UI for collective field visualization:
 * - Collective field metrics (pressure, momentum, emotional bias)
 * - Intent vector synthesis (BagBot, Market, User alignment)
 * - Consensus memory patterns (cycles, seasonal moods)
 * - Liquidity personality & volatility temperament
 * - GPU-accelerated aura effects orchestration
 * 
 * Real-time monitoring of crowd behavior, intent alignment, and memory echoes.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CollectiveFieldEngine, CollectiveField } from './CollectiveFieldEngine';
import { IntentVectorSynthesizer, SynthesizedIntent } from './IntentVectorSynthesizer';
import { ConsensusMemoryEcho, MemoryEchoState } from './ConsensusMemoryEcho';

// ================================
// COLLECTIVE INTELLIGENCE HUB
// ================================

export const CollectiveIntelligenceHub: React.FC = () => {
  // Engines
  const [fieldEngine] = useState(() => new CollectiveFieldEngine());
  const [intentSynthesizer] = useState(() => new IntentVectorSynthesizer());
  const [memoryEcho] = useState(() => new ConsensusMemoryEcho());

  // State
  const [fieldState, setFieldState] = useState<CollectiveField | null>(null);
  const [intentState, setIntentState] = useState<SynthesizedIntent | null>(null);
  const [memoryState, setMemoryState] = useState<MemoryEchoState | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Aura container ref
  const auraContainerRef = useRef<HTMLDivElement>(null);

  // Update loop
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Simulate micro-signals (replace with real data)
      fieldEngine.updateMicroSignals({
        volatilitySpike: Math.random() * 100,
        anomalyDensity: Math.random() * 100,
        pacingAcceleration: (Math.random() - 0.5) * 100,
        liquidityShift: (Math.random() - 0.5) * 100,
        interactionBurst: Math.random() * 100,
        patternFragmentation: Math.random() * 100,
      });

      const field = fieldEngine.getState();
      setFieldState(field);

      // Update intent synthesizer (replace with real data)
      intentSynthesizer.updateBagBotIntent({
        vector: {
          direction: Math.random() * 360,
          magnitude: Math.random() * 100,
          confidence: 70 + Math.random() * 30,
          velocity: Math.random() * 100,
          stability: Math.random() * 100,
        },
        strategy: 'accumulate',
        conviction: Math.random() * 100,
        timeHorizon: 'medium',
        riskTolerance: Math.random() * 100,
      });

      intentSynthesizer.updateMarketIntent({
        vector: {
          direction: Math.random() * 360,
          magnitude: Math.random() * 100,
          confidence: 60 + Math.random() * 40,
          velocity: Math.random() * 100,
          stability: Math.random() * 100,
        },
        trend: 'bullish',
        strength: Math.random() * 100,
        participation: Math.random() * 100,
        consolidation: Math.random() * 100,
      });

      intentSynthesizer.updateUserIntent({
        vector: {
          direction: Math.random() * 360,
          magnitude: Math.random() * 100,
          confidence: 50 + Math.random() * 50,
          velocity: Math.random() * 100,
          stability: Math.random() * 100,
        },
        focus: 'monitoring',
        urgency: Math.random() * 100,
        engagement: Math.random() * 100,
        sentiment: 'confident',
      });

      const intent = intentSynthesizer.getState();
      setIntentState(intent);

      // Record pattern in memory
      memoryEcho.recordPattern({
        pressure: field.pressure,
        momentum: field.momentum,
        emotionalBias: field.emotionalBias,
        crowdPhase: field.crowdPhase,
        coherence: field.coherence,
        volatility: field.turbulence,
      });

      const memory = memoryEcho.getState();
      setMemoryState(memory);

      // Update aura effects
      updateAuraEffects(field, intent, memory);
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, fieldEngine, intentSynthesizer, memoryEcho]);

  /**
   * Update aura effects
   */
  const updateAuraEffects = (
    field: CollectiveField,
    intent: SynthesizedIntent,
    memory: MemoryEchoState
  ): void => {
    if (!auraContainerRef.current) return;

    const container = auraContainerRef.current;

    // Update CSS variables for dynamic effects
    container.style.setProperty('--pressure-level', `${field.pressure}`);
    container.style.setProperty('--momentum-direction', `${field.momentum}`);
    container.style.setProperty('--coherence-level', `${field.coherence}`);
    container.style.setProperty('--turbulence-level', `${field.turbulence}`);

    // Intent vector angles
    container.style.setProperty('--bagbot-angle', `${intent.bagbotIntent.vector.direction}deg`);
    container.style.setProperty('--market-angle', `${intent.marketIntent.vector.direction}deg`);
    container.style.setProperty('--user-angle', `${intent.userIntent.vector.direction}deg`);

    // Update class names for intensity variants
    const shimmer = container.querySelector('.crowd-shimmer');
    if (shimmer) {
      shimmer.className = `crowd-shimmer intensity-${getIntensityLevel(field.density)}`;
    }

    const pressureDistortion = container.querySelector('.pressure-distortion');
    if (pressureDistortion) {
      pressureDistortion.className = `pressure-distortion level-${getPressureLevel(field.pressure)}`;
    }

    const massIntentGlow = container.querySelector('.mass-intent-glow');
    if (massIntentGlow) {
      const direction = field.momentum > 10 ? 'bullish' : field.momentum < -10 ? 'bearish' : 'neutral';
      const strength = Math.abs(field.momentum) > 30 ? 'strong' : Math.abs(field.momentum) > 15 ? 'moderate' : 'weak';
      massIntentGlow.className = `mass-intent-glow direction-${direction} strength-${strength}`;
    }

    const turbulenceVortex = container.querySelector('.turbulence-vortex');
    if (turbulenceVortex) {
      turbulenceVortex.className = `turbulence-vortex level-${getTurbulenceLevel(field.turbulence)}`;
    }

    const crowdPhaseAura = container.querySelector('.crowd-phase-aura');
    if (crowdPhaseAura) {
      crowdPhaseAura.className = `crowd-phase-aura phase-${field.crowdPhase}`;
    }
  };

  /**
   * Get intensity level
   */
  const getIntensityLevel = (density: number): string => {
    if (density > 75) return 'extreme';
    if (density > 50) return 'high';
    if (density > 25) return 'medium';
    return 'low';
  };

  /**
   * Get pressure level
   */
  const getPressureLevel = (pressure: number): string => {
    if (pressure > 75) return 'extreme';
    if (pressure > 50) return 'high';
    if (pressure > 25) return 'medium';
    return 'low';
  };

  /**
   * Get turbulence level
   */
  const getTurbulenceLevel = (turbulence: number): string => {
    if (turbulence > 75) return 'extreme';
    if (turbulence > 50) return 'high';
    if (turbulence > 25) return 'moderate';
    return 'low';
  };

  return (
    <div className="collective-intelligence-hub min-h-screen bg-vanta-black text-white p-6">
      {/* Aura Container */}
      <div ref={auraContainerRef} className="collective-field">
        <div className="collective-field-canvas collective-field-layer-background">
          <div className="crowd-shimmer intensity-medium"></div>
          <div className="coherence-grid state-unified"></div>
        </div>
        <div className="collective-field-canvas collective-field-layer-mid">
          <div className="pressure-distortion level-medium"></div>
          <div className="mass-intent-glow direction-neutral strength-moderate"></div>
          <div className="turbulence-vortex level-moderate"></div>
          <div className="crowd-phase-aura phase-neutral"></div>
        </div>
        <div className="collective-field-canvas collective-field-layer-foreground">
          <div className="field-wave-container frequency-normal">
            <div className="field-wave"></div>
            <div className="field-wave"></div>
            <div className="field-wave"></div>
          </div>
          <div className="consensus-ring strength-moderate"></div>
          <div className="alignment-beam type-convergence"></div>
          <div className="momentum-streak direction-bullish strength-moderate"></div>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ textShadow: 'var(--glow-cyan)' }}>
          Collective Intelligence Hub
        </h1>
        <p className="text-gray-400">
          Sensing crowd behavior, intent alignment, and consensus memory echoes
        </p>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`mt-4 px-4 py-2 rounded-lg ${
            isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          } transition-colors`}
        >
          {isActive ? 'Pause' : 'Resume'}
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collective Field Panel */}
        <div className="bg-shadow-gray bg-opacity-90 rounded-lg p-6 border border-neon-cyan">
          <h2 className="text-2xl font-bold mb-4 text-neon-cyan">Collective Field</h2>
          {fieldState ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Pressure</span>
                  <span className="text-lg font-bold">{fieldState.pressure.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-deep-void rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
                    style={{ width: `${fieldState.pressure}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-400">Momentum</span>
                  <span className="text-lg font-bold">{fieldState.momentum.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-deep-void rounded-full overflow-hidden relative">
                  <div
                    className={`h-full absolute transition-all duration-500 ${
                      fieldState.momentum > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.abs(fieldState.momentum) * 2}%`,
                      left: fieldState.momentum > 0 ? '50%' : 'auto',
                      right: fieldState.momentum < 0 ? '50%' : 'auto',
                    }}
                  ></div>
                  <div className="absolute top-0 left-1/2 w-px h-full bg-gray-600"></div>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400">Emotional Bias</span>
                <p className="text-lg font-bold">
                  {fieldState.emotionalBias === 'fear' && (
                    <span className="text-red-400">😨 Fear</span>
                  )}
                  {fieldState.emotionalBias === 'neutral' && (
                    <span className="text-gray-400">😐 Neutral</span>
                  )}
                  {fieldState.emotionalBias === 'greed' && (
                    <span className="text-green-400">🤑 Greed</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Crowd Phase</span>
                <p className="text-lg font-bold capitalize">{fieldState.crowdPhase}</p>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Coherence</span>
                  <span>{fieldState.coherence.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Density</span>
                  <span>{fieldState.density.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Turbulence</span>
                  <span>{fieldState.turbulence.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Initializing...</p>
          )}
        </div>

        {/* Intent Synthesis Panel */}
        <div className="bg-shadow-gray bg-opacity-90 rounded-lg p-6 border border-neon-magenta">
          <h2 className="text-2xl font-bold mb-4 text-neon-magenta">Intent Synthesis</h2>
          {intentState ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-400">BagBot Intent</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full h-2 bg-deep-void rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${intentState.bagbotIntent.vector.magnitude}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono">
                    {intentState.bagbotIntent.vector.direction.toFixed(0)}°
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400">Market Intent</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full h-2 bg-deep-void rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${intentState.marketIntent.vector.magnitude}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono">
                    {intentState.marketIntent.vector.direction.toFixed(0)}°
                  </span>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400">User Intent</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full h-2 bg-deep-void rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${intentState.userIntent.vector.magnitude}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-mono">
                    {intentState.userIntent.vector.direction.toFixed(0)}°
                  </span>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">System Coherence</span>
                  <span className="font-bold">{intentState.systemCoherence.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Intent Conflict</span>
                  <span className="font-bold text-red-400">
                    {intentState.intentConflict.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Alignment Pattern</span>
                  <p className="text-lg font-bold capitalize">
                    {intentState.alignmentPattern.type}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Initializing...</p>
          )}
        </div>

        {/* Memory Echo Panel */}
        <div className="bg-shadow-gray bg-opacity-90 rounded-lg p-6 border border-neon-teal">
          <h2 className="text-2xl font-bold mb-4 text-neon-teal">Memory Echoes</h2>
          {memoryState ? (
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-400">Total Patterns</span>
                <p className="text-2xl font-bold">{memoryState.totalPatterns}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Memory Health</span>
                <div className="h-2 bg-deep-void rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500"
                    style={{ width: `${memoryState.memoryHealth}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-400">Detected Cycles</span>
                <p className="text-lg font-bold">{memoryState.cycles.length}</p>
                {memoryState.cycles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {memoryState.cycles.slice(0, 3).map(cycle => (
                      <li key={cycle.id} className="text-xs text-gray-400 capitalize">
                        • {cycle.type.replace('-', ' ')} ({cycle.confidence.toFixed(0)}% confidence)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="pt-3 border-t border-gray-700">
                <div>
                  <span className="text-sm text-gray-400">Liquidity Personality</span>
                  <p className="text-lg font-bold capitalize">
                    {memoryState.liquidityPersonality.trait}
                  </p>
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-400">Volatility Temperament</span>
                  <p className="text-lg font-bold capitalize">
                    {memoryState.volatilityTemperament.disposition}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Initializing...</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center text-sm text-gray-500">
        <p>
          Level 11.4 — Collective Intelligence Layer — Zero Data Storage — Pattern-Safe Only
        </p>
      </div>
    </div>
  );
};

export default CollectiveIntelligenceHub;
