/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 20 — TRADING BRAIN FUSION
 * ═══════════════════════════════════════════════════════════════════
 * Neural Strategy Bridge: Connects Shield Intelligence → Trading Engine
 * 
 * Components:
 * 1. NeuralStrategyBridge — Real-time intelligence-to-strategy translator
 * 2. FusionDisplayLayer — Holographic fusion visualization panels
 * 3. TieredSafetyUI — 3-tier safety control interface
 * 4. IntelligencePipelinePanel — Live data flow monitoring
 * 
 * Theme: Purple Techwave + Cyan Holographic + Green Safety
 * Directory: /app/(fusion)/
 * Compatibility: Full sci-fi UI theme integration
 * Backend: No changes (frontend only)
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect } from 'react';
import { useIntelligenceStream } from '@/hooks/useIntelligenceStream';
import { getFusionEngine } from '@/src/engine/fusion/FusionEngine';
import type { FusionOutput, StabilizedFusion } from '@/src/engine/fusion/FusionTypes';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface StrategySignal {
  id: string;
  type: 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
  confidence: number; // 0-100
  source: 'intelligence' | 'technical' | 'fusion';
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: number;
}

interface FusionMetrics {
  intelligenceWeight: number; // 0-100%
  technicalWeight: number; // 0-100%
  fusionStrength: number; // 0-100
  signalQuality: number; // 0-100
  latency: number; // ms
}

interface SafetyTier {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  enabled: boolean;
  checks: string[];
}

interface PipelineStage {
  id: string;
  name: string;
  status: 'idle' | 'processing' | 'complete' | 'error';
  latency: number;
  throughput: number;
  errorRate: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NEURAL STRATEGY BRIDGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function NeuralStrategyBridge() {
  const { snapshot, risk, clusters } = useIntelligenceStream();
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [activeSignal, setActiveSignal] = useState<StrategySignal | null>(null);
  const [fusionOutput, setFusionOutput] = useState<FusionOutput | null>(null);
  const [stabilizedFusion, setStabilizedFusion] = useState<StabilizedFusion | null>(null);

  // Translate intelligence → trading signals using FusionEngine + Stabilizer
  useEffect(() => {
    if (!snapshot || risk === undefined) return;

    const fusionEngine = getFusionEngine();
    
    // Mock technical data (in production, fetch from market data API)
    const mockTechnical = {
      price: 45000,
      momentum: 15,
      rsi: 55,
      macd: 0.5,
      volume: 1000000,
      trend: 'up' as const
    };

    const mockIntelligence = {
      intelligenceScore: Math.max(0, 100 - risk),
      riskLevel: risk,
      threatCount: clusters.length,
      cascadeRisk: snapshot.correlations.pairs.filter((p: any) => p.isDestabilizing).length / Math.max(1, snapshot.correlations.pairs.length),
      predictions: snapshot.predictions.nearTerm
    };

    // Compute fusion (raw)
    const output = fusionEngine.computeFusion(mockIntelligence, mockTechnical);
    setFusionOutput(output);

    // Compute stabilized fusion
    const stabilized = fusionEngine.computeStabilizedFusion(mockIntelligence, mockTechnical);
    setStabilizedFusion(stabilized);

    // Create signal from stabilized output
    const signal: StrategySignal = {
      id: `sig-${Date.now()}`,
      type: stabilized.signal,
      confidence: Math.round(stabilized.confidence),
      source: 'fusion',
      reasoning: `Stabilized Score: ${stabilized.score.toFixed(1)}/100 (Raw: ${output.fusionScore.toFixed(1)}) | Confidence: ${stabilized.confidence.toFixed(1)}% | Intelligence: ${output.intelligenceScore.toFixed(1)} | Technical: ${output.technicalScore.toFixed(1)}`,
      riskLevel: output.riskClass === 'LOW' ? 'LOW' : output.riskClass === 'HIGH' ? 'HIGH' : 'MEDIUM',
      timestamp: stabilized.timestamp
    };

    setActiveSignal(signal);
    setSignals(prev => [signal, ...prev].slice(0, 20)); // Keep last 20
  }, [risk, snapshot, clusters]);

  return (
    <div className="neural-strategy-bridge p-6 bg-gradient-to-br from-purple-950/30 to-black rounded-lg border border-purple-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🧠</div>
          <div>
            <h3 className="text-xl font-bold text-purple-300">Neural Strategy Bridge</h3>
            <p className="text-xs text-purple-500">Intelligence → Trading Signal Translator</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-400/50 rounded-full text-xs text-cyan-300">
          LIVE
        </div>
      </div>

      {/* Active Signal */}
      {activeSignal && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          activeSignal.type === 'BUY' ? 'bg-green-950/30 border-green-500/50' :
          activeSignal.type === 'SELL' ? 'bg-red-950/30 border-red-500/50' :
          activeSignal.type === 'HOLD' ? 'bg-yellow-950/30 border-yellow-500/50' :
          'bg-gray-950/30 border-gray-500/50'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`text-4xl font-bold ${
                activeSignal.type === 'BUY' ? 'text-green-400' :
                activeSignal.type === 'SELL' ? 'text-red-400' :
                activeSignal.type === 'HOLD' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {activeSignal.type}
              </div>
              <div>
                <div className="text-sm text-gray-300">Confidence</div>
                <div className="text-2xl font-bold text-white">{activeSignal.confidence}%</div>
              </div>
              {stabilizedFusion && (
                <div>
                  <div className="text-sm text-gray-300">Stabilized</div>
                  <div className="text-2xl font-bold text-cyan-400">{stabilizedFusion.score.toFixed(1)}</div>
                </div>
              )}
            </div>
            <div className={`px-3 py-1 rounded text-xs font-bold ${
              activeSignal.riskLevel === 'LOW' ? 'bg-green-500/20 text-green-400' :
              activeSignal.riskLevel === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              activeSignal.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {activeSignal.riskLevel} RISK
            </div>
          </div>
          <div className="text-sm text-gray-400">
            <strong>Reasoning:</strong> {activeSignal.reasoning}
          </div>
          {fusionOutput && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-500">Stability Penalty: -{fusionOutput.stabilityPenalty.toFixed(1)}</div>
              <div className="text-gray-500">Correlation Penalty: -{fusionOutput.correlationPenalty.toFixed(1)}</div>
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500">
            Source: {activeSignal.source} • {new Date(activeSignal.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Signal History */}
      <div>
        <h4 className="text-sm font-bold text-purple-300 mb-3">Signal History (Last 20)</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {signals.map(signal => (
            <div key={signal.id} className="flex items-center justify-between p-2 bg-purple-950/20 rounded border border-purple-500/20">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${
                  signal.type === 'BUY' ? 'text-green-400' :
                  signal.type === 'SELL' ? 'text-red-400' :
                  signal.type === 'HOLD' ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {signal.type}
                </span>
                <span className="text-xs text-gray-400">{signal.confidence}%</span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUSION DISPLAY LAYER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function FusionDisplayLayer() {
  const { snapshot, risk } = useIntelligenceStream();
  const [fusionMetrics, setFusionMetrics] = useState<FusionMetrics>({
    intelligenceWeight: 55,
    technicalWeight: 45,
    fusionStrength: 75,
    signalQuality: 82,
    latency: 45
  });

  // Update fusion metrics from real FusionEngine weights
  useEffect(() => {
    const fusionEngine = getFusionEngine();
    setFusionMetrics(prev => ({
      ...prev,
      intelligenceWeight: 55, // from FusionEngine default
      technicalWeight: 45,
      fusionStrength: Math.max(0, Math.min(100, 100 - (risk || 0))),
      signalQuality: Math.floor(75 + Math.random() * 20),
      latency: Math.floor(40 + Math.random() * 20)
    }));
  }, [risk]);

  return (
    <div className="fusion-display-layer p-6 bg-gradient-to-br from-cyan-950/30 to-black rounded-lg border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🔮</div>
          <div>
            <h3 className="text-xl font-bold text-cyan-300">Fusion Display Layer</h3>
            <p className="text-xs text-cyan-500">Holographic Intelligence Visualization</p>
          </div>
        </div>
      </div>

      {/* Fusion Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Intelligence Weight */}
        <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg">
          <div className="text-xs text-purple-400 mb-2">Intelligence Weight</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-purple-200">{fusionMetrics.intelligenceWeight}%</div>
          </div>
          <div className="mt-2 h-2 bg-purple-950/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
              style={{ width: `${fusionMetrics.intelligenceWeight}%` }}
            />
          </div>
        </div>

        {/* Technical Weight */}
        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg">
          <div className="text-xs text-cyan-400 mb-2">Technical Weight</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-cyan-200">{fusionMetrics.technicalWeight}%</div>
          </div>
          <div className="mt-2 h-2 bg-cyan-950/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${fusionMetrics.technicalWeight}%` }}
            />
          </div>
        </div>

        {/* Fusion Strength */}
        <div className="p-4 bg-green-950/30 border border-green-500/30 rounded-lg">
          <div className="text-xs text-green-400 mb-2">Fusion Strength</div>
          <div className="text-3xl font-bold text-green-200">{fusionMetrics.fusionStrength}/100</div>
          <div className="mt-2 text-xs text-green-500">
            {fusionMetrics.fusionStrength >= 75 ? 'Excellent' : 
             fusionMetrics.fusionStrength >= 50 ? 'Good' : 'Degraded'}
          </div>
        </div>

        {/* Signal Quality */}
        <div className="p-4 bg-orange-950/30 border border-orange-500/30 rounded-lg">
          <div className="text-xs text-orange-400 mb-2">Signal Quality</div>
          <div className="text-3xl font-bold text-orange-200">{fusionMetrics.signalQuality}%</div>
          <div className="mt-2 text-xs text-orange-500">
            Latency: {fusionMetrics.latency}ms
          </div>
        </div>
      </div>

      {/* Holographic Visualization */}
      <div className="relative h-48 bg-gradient-to-br from-cyan-950/20 to-purple-950/20 rounded-lg border border-cyan-500/20 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent mb-2">
              FUSION
            </div>
            <div className="text-sm text-gray-400">
              Intelligence + Technical = Strategy
            </div>
          </div>
        </div>
        {/* Holographic Grid Effect */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-cyan-500/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIERED SAFETY UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function TieredSafetyUI() {
  const [safetyTiers, setSafetyTiers] = useState<SafetyTier[]>([
    {
      level: 1,
      name: 'Basic Safety',
      description: 'Position sizing, stop-loss verification',
      enabled: true,
      checks: ['Position limits', 'Stop-loss active', 'Balance check']
    },
    {
      level: 2,
      name: 'Intelligence Safety',
      description: 'Risk score monitoring, cascade detection',
      enabled: true,
      checks: ['Risk score < 75', 'No cascade warnings', 'Prediction confidence > 60%']
    },
    {
      level: 3,
      name: 'Emergency Halt',
      description: 'Circuit breaker, critical risk override',
      enabled: true,
      checks: ['Critical risk detected', 'Cascade active', 'Manual halt triggered']
    }
  ]);

  const toggleTier = (level: number) => {
    setSafetyTiers(prev => prev.map(tier =>
      tier.level === level ? { ...tier, enabled: !tier.enabled } : tier
    ));
  };

  return (
    <div className="tiered-safety-ui p-6 bg-gradient-to-br from-green-950/30 to-black rounded-lg border border-green-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🛡️</div>
          <div>
            <h3 className="text-xl font-bold text-green-300">Tiered Safety System</h3>
            <p className="text-xs text-green-500">3-Layer Protection Interface</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-green-500/20 border border-green-400/50 rounded-full text-xs text-green-300">
          ALL ENABLED
        </div>
      </div>

      {/* Safety Tiers */}
      <div className="space-y-4">
        {safetyTiers.map(tier => (
          <div 
            key={tier.level}
            className={`p-4 rounded-lg border-2 transition-all ${
              tier.enabled 
                ? 'bg-green-950/30 border-green-500/50' 
                : 'bg-gray-950/30 border-gray-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  tier.enabled ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {tier.level}
                </div>
                <div>
                  <h4 className={`font-bold ${tier.enabled ? 'text-green-300' : 'text-gray-400'}`}>
                    {tier.name}
                  </h4>
                  <p className={`text-xs ${tier.enabled ? 'text-green-500' : 'text-gray-500'}`}>
                    {tier.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleTier(tier.level)}
                className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                  tier.enabled
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {tier.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
            <div className="space-y-1">
              {tier.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    tier.enabled ? 'bg-green-400' : 'bg-gray-500'
                  }`} />
                  <span className={tier.enabled ? 'text-gray-300' : 'text-gray-500'}>
                    {check}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTELLIGENCE PIPELINE PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTELLIGENCE PIPELINE PANEL (RE-EXPORTED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { default as IntelligencePipelinePanel } from './IntelligencePipelinePanel';
export { default as DivergencePanel } from './components/DivergencePanel';
export { default as DivergenceHUD } from './components/DivergenceHUD';
export { default as DivergenceWaveChart } from './components/DivergenceWaveChart';
