/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 20 — TRADING BRAIN FUSION
 * Main Dashboard Page
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect } from 'react';
import {
  NeuralStrategyBridge,
  FusionDisplayLayer,
  TieredSafetyUI,
  IntelligencePipelinePanel,
  DivergencePanel,
  DivergenceHUD,
  DivergenceWaveChart
} from './components';
import FusionTelemetryBars from './FusionTelemetryBars';
import NeuralSyncGrid from '@/src/components/intel/NeuralSyncGrid';
import CognitivePulseEngine from '@/src/components/intel/CognitivePulseEngine';
import DecisionMemoryCore from '@/src/components/intel/DecisionMemoryCore';
import PredictiveVisionHalo from '@/src/components/vision';
import ThreatReactivePanel from '../components/intel/ThreatReactivePanel';
import ThreatInfluenceIndicator from '../components/intel/ThreatInfluenceIndicator';
import StrategyWeightIndicator from '../components/intel/StrategyWeightIndicator';
import DailyTradingIndicator from '../components/intel/DailyTradingIndicator';
import ThreatMemoryIndicator from '../components/intel/ThreatMemoryIndicator';
import ShieldStrategyIndicator from '../components/strategy/ShieldStrategyIndicator';
import RiskCurveIndicator from '../components/risk/RiskCurveIndicator';
import ReactionModeIndicator from '../components/reaction/ReactionModeIndicator';
import HedgeModeIndicator from '../components/hedge/HedgeModeIndicator';
import ShieldFusionIndicator from '../components/shield/ShieldFusionIndicator';
import HypervisionPanel from '../components/hypervision/HypervisionPanel';
import RDSIndicator from '../components/stabilizer/RDSIndicator';
import { initFusionThreatBridge } from '../lib/intel/FusionThreatBridge';
import { initThreatWeightedStrategy } from '../lib/intel/ThreatStrategyIntegration';
import { initDailyTradingHarmonizer } from '../lib/intel/DailyTradingIntegration';

export default function TradingBrainFusionPage() {
  const [activeTab, setActiveTab] = useState<'bridge' | 'fusion' | 'safety' | 'pipeline'>('bridge');

  useEffect(() => {
    const bridge = initFusionThreatBridge();
    const strategy = initThreatWeightedStrategy();
    const harmonizer = initDailyTradingHarmonizer();
    return () => {
      bridge.destroy();
      strategy.destroy();
      harmonizer.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black p-6">
      {/* Divergence HUD */}
      <DivergenceHUD />
      
      {/* NEW: Shield Fusion Indicator */}
      <ShieldFusionIndicator />
      
      {/* NEW: Hypervision Monitor */}
      <HypervisionPanel />
      
      {/* NEW: RDS Indicator */}
      <RDSIndicator />
      
      {/* NEW: Risk Curve Indicator */}
      <RiskCurveIndicator />
      
      {/* NEW: Reaction Mode Indicator */}
      <ReactionModeIndicator />
      
      {/* NEW: Threat Influence Indicator */}
      <ThreatInfluenceIndicator />
      
      {/* NEW: Strategy Weight Indicator */}
      <StrategyWeightIndicator />
      
      {/* NEW: Hedge Mode Indicator */}
      <HedgeModeIndicator />
      
      {/* NEW: Daily Trading Indicator */}
      <DailyTradingIndicator />
      
      {/* NEW: Threat Memory Indicator */}
      <ThreatMemoryIndicator />
      
      {/* NEW: Shield Strategy Indicator */}
      <ShieldStrategyIndicator />
      
      {/* Neon Frame Anchors */}
      <div className="fixed top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/50" />
      <div className="fixed top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/50" />
      <div className="fixed bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/50" />
      <div className="fixed bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/50" />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-5xl">🚀</div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
              Trading Brain Fusion
            </h1>
            <p className="text-lg text-gray-400 mt-1">
              Level 20 • Neural Strategy Bridge • Intelligence-Driven Trading
            </p>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setActiveTab('bridge')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'bridge'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-950/30 text-purple-300 border border-purple-500/30 hover:bg-purple-950/50'
            }`}
          >
            🧠 Neural Bridge
          </button>
          <button
            onClick={() => setActiveTab('fusion')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'fusion'
                ? 'bg-cyan-500 text-white'
                : 'bg-cyan-950/30 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-950/50'
            }`}
          >
            🔮 Fusion Display
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'safety'
                ? 'bg-green-500 text-white'
                : 'bg-green-950/30 text-green-300 border border-green-500/30 hover:bg-green-950/50'
            }`}
          >
            🛡️ Safety Tiers
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'pipeline'
                ? 'bg-orange-500 text-white'
                : 'bg-orange-950/30 text-orange-300 border border-orange-500/30 hover:bg-orange-950/50'
            }`}
          >
            ⚡ Pipeline
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTab === 'bridge' && (
          <>
            <NeuralStrategyBridge />
            <IntelligencePipelinePanel />
            <DivergencePanel />
            <ThreatReactivePanel />
            <DivergenceWaveChart />
            {/* NEW: Fusion Telemetry Bars (Step 18) */}
            <div className="bg-black/40 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
                <span>📊</span> Fusion Weight Telemetry
              </h3>
              <FusionTelemetryBars />
            </div>
            {/* NEW: Neural Sync Grid (Step 19) */}
            <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6">
              <NeuralSyncGrid
                fusion={75}
                stability={82}
                divergence={45}
              />
            </div>
            {/* NEW: Cognitive Pulse Engine (Step 20) */}
            <CognitivePulseEngine
              fusionScore={78}
              divergenceScore={42}
              volatility={65}
              confidence={88}
            />
            {/* NEW: Decision Memory Core (Step 21) */}
            <DecisionMemoryCore
              recentDecisions={[
                { outcome: 'win' },
                { outcome: 'win' },
                { outcome: 'loss' },
                { outcome: 'win' },
                { outcome: 'neutral' },
                { outcome: 'win' },
                { outcome: 'anomaly' },
                { outcome: 'win' },
                { outcome: 'loss' },
                { outcome: 'win' },
                { outcome: 'win' },
                { outcome: 'neutral' },
              ]}
              confidence={82}
              learningPulse={68}
            />
            {/* NEW: Predictive Vision Halo (Step 22) */}
            <PredictiveVisionHalo
              confidence={75}
              riskLevel={35}
              direction="up"
              intensity={70}
              probability={0.78}
              anomaly={false}
            />
          </>
        )}
        {activeTab === 'fusion' && (
          <>
            <FusionDisplayLayer />
            <TieredSafetyUI />
          </>
        )}
        {activeTab === 'safety' && (
          <>
            <TieredSafetyUI />
            <NeuralStrategyBridge />
          </>
        )}
        {activeTab === 'pipeline' && (
          <>
            <IntelligencePipelinePanel />
            <FusionDisplayLayer />
            {/* NEW: Decision Memory Core (Step 21) */}
            <DecisionMemoryCore
              recentDecisions={[
                { outcome: 'win' },
                { outcome: 'win' },
                { outcome: 'loss' },
                { outcome: 'win' },
                { outcome: 'neutral' },
                { outcome: 'win' },
                { outcome: 'anomaly' },
                { outcome: 'win' },
                { outcome: 'loss' },
                { outcome: 'win' },
                { outcome: 'win' },
                { outcome: 'neutral' },
              ]}
              confidence={82}
              learningPulse={68}
            />
            {/* NEW: Predictive Vision Halo (Step 22) */}
            <PredictiveVisionHalo
              confidence={75}
              riskLevel={35}
              direction="up"
              intensity={70}
              probability={0.78}
              anomaly={false}
            />
          </>
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 border-t border-cyan-500/30 backdrop-blur-sm p-4">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-400">Intelligence Stream: LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-gray-400">Fusion Engine: ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-400">Safety Systems: ENABLED</span>
            </div>
          </div>
          <div className="text-gray-500">
            Level 20 • Trading Brain Fusion • v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
