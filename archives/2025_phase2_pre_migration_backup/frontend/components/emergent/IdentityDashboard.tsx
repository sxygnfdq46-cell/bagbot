/**
 * LEVEL 11.2 — IDENTITY DASHBOARD UI
 * 
 * Complete control panel for BagBot's emergent personality.
 * Provides visibility and control over all personality systems.
 * 
 * Features:
 * - Personality vector map (live 51 traits)
 * - Tone meter
 * - Emotional intensity bar
 * - Stability graph
 * - Adaptation timeline
 * - Core identity dial
 * - Full adjustment controls
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PersonalityVectorEngine, PersonalityVector, EmotionalState, InteractionContext } from './PersonalityVectorEngine';
import { IdentityStabilityAnchor } from './IdentityStabilityAnchor';
import { AdaptiveToneEngine, ToneType, BlendedTone } from './AdaptiveToneEngine';
import { ContextualMemoryLayer } from './ContextualMemoryLayer';

// ================================
// DASHBOARD STATE
// ================================

interface DashboardState {
  vectorEngine: PersonalityVectorEngine;
  stabilityAnchor: IdentityStabilityAnchor;
  toneEngine: AdaptiveToneEngine;
  memoryLayer: ContextualMemoryLayer;
  updateInterval: NodeJS.Timeout | null;
}

// ================================
// IDENTITY DASHBOARD COMPONENT
// ================================

export function IdentityDashboard() {
  const [activeTab, setActiveTab] = useState<'vector' | 'tone' | 'stability' | 'memory' | 'controls'>('vector');
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Initialize engines
  useEffect(() => {
    const vectorEngine = new PersonalityVectorEngine();
    const signature = vectorEngine.getSignature();
    const stabilityAnchor = new IdentityStabilityAnchor(
      signature.coreIdentity,
      signature.vector
    );
    const toneEngine = new AdaptiveToneEngine(signature.vector);
    const memoryLayer = new ContextualMemoryLayer();

    const updateInterval = setInterval(() => {
      vectorEngine.processNaturalDynamics();
      stabilityAnchor.applyNaturalRecovery();
      setRefreshKey(prev => prev + 1);
    }, 5000); // Update every 5 seconds

    setDashboardState({
      vectorEngine,
      stabilityAnchor,
      toneEngine,
      memoryLayer,
      updateInterval,
    });

    return () => {
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  // Reset to core
  const handleResetToCore = useCallback(() => {
    if (!dashboardState || isLocked) return;
    dashboardState.vectorEngine.resetToCore();
    dashboardState.stabilityAnchor.resetToCore();
    setRefreshKey(prev => prev + 1);
  }, [dashboardState, isLocked]);

  // Toggle lock
  const handleToggleLock = useCallback(() => {
    setIsLocked(prev => !prev);
  }, []);

  if (!dashboardState) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-cyan-400 animate-pulse">Initializing Identity Systems...</div>
      </div>
    );
  }

  return (
    <div className="identity-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h2 className="text-2xl font-bold text-white mb-2">🧠 Identity Dashboard</h2>
        <p className="text-gray-400 text-sm">Level 11.2 — Emergent Personality Engine</p>
        
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleResetToCore}
            disabled={isLocked}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLocked
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            Reset to Core
          </button>
          
          <button
            onClick={handleToggleLock}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLocked
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {isLocked ? '🔒 Locked' : '🔓 Unlocked'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        {[
          { id: 'vector' as const, label: '📊 Personality Vector', icon: '📊' },
          { id: 'tone' as const, label: '🎵 Adaptive Tone', icon: '🎵' },
          { id: 'stability' as const, label: '⚖️ Stability', icon: '⚖️' },
          { id: 'memory' as const, label: '🧠 Memory', icon: '🧠' },
          { id: 'controls' as const, label: '🎛️ Controls', icon: '🎛️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'tab-active' : ''}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {activeTab === 'vector' && (
          <PersonalityVectorPanel engine={dashboardState.vectorEngine} />
        )}
        {activeTab === 'tone' && (
          <TonePanel engine={dashboardState.toneEngine} />
        )}
        {activeTab === 'stability' && (
          <StabilityPanel anchor={dashboardState.stabilityAnchor} />
        )}
        {activeTab === 'memory' && (
          <MemoryPanel layer={dashboardState.memoryLayer} />
        )}
        {activeTab === 'controls' && (
          <ControlsPanel
            engine={dashboardState.vectorEngine}
            isLocked={isLocked}
            onUpdate={() => setRefreshKey(prev => prev + 1)}
          />
        )}
      </div>
    </div>
  );
}

// ================================
// PERSONALITY VECTOR PANEL
// ================================

function PersonalityVectorPanel({ engine }: { engine: PersonalityVectorEngine }) {
  const signature = engine.getSignature();
  const summary = engine.getPersonalitySummary();

  return (
    <div className="personality-vector-panel">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Card */}
        <div className="summary-card persona-warm persona-transition">
          <h3 className="text-lg font-semibold text-white mb-4">Personality Summary</h3>
          
          <div className="space-y-3">
            <div className="metric-row">
              <span className="text-gray-400">Dominant Cluster:</span>
              <span className="text-cyan-400 font-medium">{summary.dominantCluster}</span>
            </div>
            
            <div className="metric-row">
              <span className="text-gray-400">Emotional Tone:</span>
              <span className="text-purple-400 font-medium">{summary.emotionalTone}</span>
            </div>
            
            <div className="metric-row">
              <span className="text-gray-400">Overall Balance:</span>
              <span className="text-green-400 font-medium">{summary.overallBalance.toFixed(1)}/100</span>
            </div>
            
            <div className="metric-row">
              <span className="text-gray-400">Stability:</span>
              <span className="text-blue-400 font-medium">{signature.stabilityScore.toFixed(1)}/100</span>
            </div>
            
            <div className="metric-row">
              <span className="text-gray-400">Coherence:</span>
              <span className="text-yellow-400 font-medium">{signature.coherenceScore.toFixed(1)}/100</span>
            </div>
          </div>
        </div>

        {/* Top Traits */}
        <div className="summary-card persona-focused persona-transition">
          <h3 className="text-lg font-semibold text-white mb-4">Top 5 Traits</h3>
          
          <div className="space-y-3">
            {summary.dominantTraits.map((trait, index) => (
              <div key={`${trait.cluster}-${trait.trait}`} className="trait-item">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-300 text-sm">
                    {index + 1}. {trait.cluster}.{trait.trait}
                  </span>
                  <span className="text-cyan-400 font-medium">{trait.value.toFixed(0)}</span>
                </div>
                <div className="trait-bar">
                  <div
                    className="trait-bar-fill"
                    style={{ width: `${trait.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Clusters */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(signature.vector).map(([cluster, traits]) => {
          const avg = engine.getClusterAverage(cluster as keyof PersonalityVector);
          
          return (
            <div key={cluster} className={`cluster-card cluster-${cluster} persona-transition`}>
              <h4 className="text-md font-semibold text-white mb-3 capitalize">{cluster}</h4>
              
              <div className="text-2xl font-bold text-cyan-400 mb-3">
                {avg.toFixed(1)}
              </div>
              
              <div className="space-y-2">
                {Object.entries(traits as any).slice(0, 3).map(([trait, value]) => (
                  <div key={trait} className="flex justify-between text-xs">
                    <span className="text-gray-400">{trait}:</span>
                    <span className="text-gray-300">{(value as number).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================================
// TONE PANEL
// ================================

function TonePanel({ engine }: { engine: AdaptiveToneEngine }) {
  const currentTone = engine.getCurrentTone();
  const profile = engine.getBlendedProfile();
  const summary = engine.getToneSummary();

  return (
    <div className="tone-panel">
      {/* Current Tone */}
      <div className={`tone-display tone-${currentTone.primary} persona-transition`}>
        <h3 className="text-xl font-bold text-white mb-2">Current Tone</h3>
        <div className="text-3xl font-bold text-cyan-400 mb-4">
          {summary.currentTone}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {summary.characteristics.map(char => (
            <span key={char} className="tone-badge">
              {char}
            </span>
          ))}
        </div>
        
        <div className="space-y-2">
          <div className="metric-row">
            <span className="text-gray-400">Intensity:</span>
            <span className="text-purple-400 font-medium">{currentTone.intensity.toFixed(0)}%</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Context:</span>
            <span className="text-gray-300 text-sm">{currentTone.context}</span>
          </div>
        </div>
      </div>

      {/* Style Guide */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="style-guide-card">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Sentences</h4>
          <p className="text-white text-sm">{summary.styleGuide.sentences}</p>
        </div>
        
        <div className="style-guide-card">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Words</h4>
          <p className="text-white text-sm">{summary.styleGuide.words}</p>
        </div>
        
        <div className="style-guide-card">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">Rhythm</h4>
          <p className="text-white text-sm">{summary.styleGuide.rhythm}</p>
        </div>
      </div>

      {/* Tone Profile Details */}
      <div className="mt-6 tone-details-grid">
        {[
          { label: 'Warmth', value: profile.warmthLevel },
          { label: 'Energy', value: profile.energyLevel },
          { label: 'Support', value: profile.supportLevel },
          { label: 'Urgency', value: profile.urgencyLevel },
          { label: 'Formality', value: profile.formalityLevel },
          { label: 'Technical', value: profile.technicalDensity },
        ].map(metric => (
          <div key={metric.label} className="tone-metric">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">{metric.label}</span>
              <span className="text-cyan-400 font-medium">{metric.value.toFixed(0)}</span>
            </div>
            <div className="trait-bar">
              <div
                className="trait-bar-fill"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================
// STABILITY PANEL
// ================================

function StabilityPanel({ anchor }: { anchor: IdentityStabilityAnchor }) {
  const metrics = anchor.getStabilityMetrics();
  const trend = anchor.getStabilityTrend();
  const score = anchor.getStabilityScore();

  return (
    <div className="stability-panel">
      {/* Stability Score */}
      <div className={`stability-score-card stability-${metrics.stabilityHealth} persona-transition`}>
        <h3 className="text-xl font-bold text-white mb-2">Stability Score</h3>
        <div className="text-5xl font-bold text-cyan-400 mb-2">
          {score.toFixed(1)}
        </div>
        <div className="text-gray-400 text-sm uppercase tracking-wide">
          {metrics.stabilityHealth}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="text-gray-400 text-sm mb-1">Drift from Core</div>
          <div className="text-2xl font-bold text-purple-400">
            {metrics.driftFromCore.toFixed(1)}
          </div>
          <div className="text-gray-500 text-xs">lower is better</div>
        </div>
        
        <div className="metric-card">
          <div className="text-gray-400 text-sm mb-1">Change Rate</div>
          <div className="text-2xl font-bold text-blue-400">
            {metrics.changeRate.toFixed(2)}/min
          </div>
          <div className="text-gray-500 text-xs">points per minute</div>
        </div>
        
        <div className="metric-card">
          <div className="text-gray-400 text-sm mb-1">Emergency Brake</div>
          <div className={`text-2xl font-bold ${metrics.emergencyBrakeActive ? 'text-red-400' : 'text-green-400'}`}>
            {metrics.emergencyBrakeActive ? 'ACTIVE' : 'Inactive'}
          </div>
          <div className="text-gray-500 text-xs">safety system</div>
        </div>
      </div>

      {/* Recent Snapshots */}
      {metrics.recentSnapshots.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-3">Recent History</h4>
          <div className="space-y-2">
            {metrics.recentSnapshots.slice(-5).reverse().map((snapshot, index) => {
              const timeAgo = Math.floor((Date.now() - snapshot.timestamp) / 1000);
              const minutes = Math.floor(timeAgo / 60);
              const seconds = timeAgo % 60;
              
              return (
                <div
                  key={snapshot.timestamp}
                  className={`snapshot-item stability-${snapshot.stabilityHealth}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">
                      {minutes > 0 ? `${minutes}m ${seconds}s ago` : `${seconds}s ago`}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-gray-300 text-sm">
                        Drift: {snapshot.driftFromCore.toFixed(1)}
                      </span>
                      <span className="text-gray-300 text-sm">
                        Rate: {snapshot.changeRate.toFixed(2)}/min
                      </span>
                      <span className="text-cyan-400 text-sm font-medium">
                        {snapshot.stabilityHealth}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ================================
// MEMORY PANEL
// ================================

function MemoryPanel({ layer }: { layer: ContextualMemoryLayer }) {
  const memory = layer.getSessionMemory();
  const summary = layer.getSessionSummary();

  return (
    <div className="memory-panel">
      {/* Session Summary */}
      <div className="session-summary persona-warm persona-transition">
        <h3 className="text-xl font-bold text-white mb-4">Session Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="stat-item">
            <div className="text-gray-400 text-sm">Duration</div>
            <div className="text-2xl font-bold text-cyan-400">{summary.duration}</div>
          </div>
          
          <div className="stat-item">
            <div className="text-gray-400 text-sm">Interactions</div>
            <div className="text-2xl font-bold text-purple-400">{summary.interactions}</div>
          </div>
          
          <div className="stat-item">
            <div className="text-gray-400 text-sm">Relationship</div>
            <div className="text-lg font-medium text-green-400 capitalize">{summary.relationshipStage}</div>
          </div>
          
          <div className="stat-item">
            <div className="text-gray-400 text-sm">Emotion</div>
            <div className="text-lg font-medium text-yellow-400 capitalize">{summary.dominantEmotion}</div>
          </div>
          
          <div className="stat-item">
            <div className="text-gray-400 text-sm">Avg Pressure</div>
            <div className="text-2xl font-bold text-red-400">{summary.averagePressure}</div>
          </div>
          
          <div className="stat-item">
            <div className="text-gray-400 text-sm">Key Moments</div>
            <div className="text-2xl font-bold text-blue-400">{summary.significantMoments}</div>
          </div>
        </div>
      </div>

      {/* Interaction Pattern */}
      <div className="mt-6 pattern-card">
        <h4 className="text-lg font-semibold text-white mb-3">Interaction Pattern</h4>
        
        <div className="space-y-3">
          <div className="metric-row">
            <span className="text-gray-400">Speed:</span>
            <span className="text-cyan-400 font-medium capitalize">{memory.interactionPattern.interactionSpeed}</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Message Length:</span>
            <span className="text-purple-400 font-medium capitalize">{memory.interactionPattern.messageLength}</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Questions/10:</span>
            <span className="text-green-400 font-medium">{memory.interactionPattern.questionFrequency}</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Directives/10:</span>
            <span className="text-yellow-400 font-medium">{memory.interactionPattern.directiveFrequency}</span>
          </div>
        </div>
      </div>

      {/* Emotional Mode */}
      <div className="mt-6 pattern-card">
        <h4 className="text-lg font-semibold text-white mb-3">Emotional Mode</h4>
        
        <div className="space-y-3">
          <div className="metric-row">
            <span className="text-gray-400">Dominant:</span>
            <span className="text-cyan-400 font-medium capitalize">{memory.emotionalMode.dominant}</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Strength:</span>
            <span className="text-purple-400 font-medium">{memory.emotionalMode.strength.toFixed(0)}%</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Stability:</span>
            <span className="text-green-400 font-medium">{memory.emotionalMode.stability.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Pressure Level */}
      <div className={`mt-6 pattern-card pressure-${memory.pressureLevel.current > 70 ? 'high' : memory.pressureLevel.current > 40 ? 'medium' : 'low'}`}>
        <h4 className="text-lg font-semibold text-white mb-3">Pressure Level</h4>
        
        <div className="space-y-3">
          <div className="metric-row">
            <span className="text-gray-400">Current:</span>
            <span className="text-red-400 font-bold text-xl">{memory.pressureLevel.current.toFixed(0)}</span>
          </div>
          
          <div className="metric-row">
            <span className="text-gray-400">Trend:</span>
            <span className="text-yellow-400 font-medium capitalize">{memory.pressureLevel.trend}</span>
          </div>
          
          {memory.pressureLevel.sources.length > 0 && (
            <div className="metric-row">
              <span className="text-gray-400">Sources:</span>
              <span className="text-gray-300 text-sm">{memory.pressureLevel.sources.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================
// CONTROLS PANEL
// ================================

function ControlsPanel({
  engine,
  isLocked,
  onUpdate,
}: {
  engine: PersonalityVectorEngine;
  isLocked: boolean;
  onUpdate: () => void;
}) {
  const signature = engine.getSignature();
  const [selectedCluster, setSelectedCluster] = useState<keyof PersonalityVector>('warmth');

  const handleTraitAdjustment = useCallback((
    cluster: keyof PersonalityVector,
    trait: string,
    value: number
  ) => {
    if (isLocked) return;
    
    const updates: Partial<PersonalityVector> = {
      [cluster]: {
        [trait]: value,
      },
    };
    
    engine.updateCoreIdentity(updates as any);
    onUpdate();
  }, [engine, isLocked, onUpdate]);

  const clusterTraits = Object.entries((signature.vector as any)[selectedCluster]) as Array<[string, number]>;

  return (
    <div className="controls-panel">
      <div className={`controls-header ${isLocked ? 'opacity-50' : ''}`}>
        <h3 className="text-xl font-bold text-white mb-2">Personality Controls</h3>
        {isLocked && (
          <p className="text-yellow-400 text-sm">🔒 Controls locked - unlock to make changes</p>
        )}
      </div>

      {/* Cluster Selector */}
      <div className="cluster-selector mt-4">
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {Object.keys(signature.vector).map(cluster => (
            <button
              key={cluster}
              onClick={() => setSelectedCluster(cluster as keyof PersonalityVector)}
              disabled={isLocked}
              className={`cluster-button ${selectedCluster === cluster ? 'active' : ''} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cluster}
            </button>
          ))}
        </div>
      </div>

      {/* Trait Sliders */}
      <div className="mt-6 trait-sliders">
        <h4 className="text-lg font-semibold text-white mb-4 capitalize">{selectedCluster} Cluster</h4>
        
        <div className="space-y-4">
          {clusterTraits.map(([trait, value]) => (
            <div key={trait} className="trait-control">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm capitalize">{trait}</label>
                <span className="text-cyan-400 font-medium">{value.toFixed(0)}</span>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => handleTraitAdjustment(selectedCluster, trait, Number(e.target.value))}
                disabled={isLocked}
                className={`trait-slider ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IdentityDashboard;
