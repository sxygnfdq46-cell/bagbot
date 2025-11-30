/**
 * ═══════════════════════════════════════════════════════════════════
 * ENHANCED INTELLIGENCE PIPELINE PANEL
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Real-time monitoring for all 8 intelligence nodes:
 * - Cognitive Pulse Engine
 * - Neural Sync Grid
 * - Memory Integrity Shield
 * - Rolling Memory Core
 * - Execution Shield
 * - Decision Memory Core
 * - Threat Sync Orchestrator
 * - Divergence Analysis Modules
 * 
 * Features:
 * - Safe Mode status display
 * - Node health monitoring
 * - Performance metrics
 * - Interactive controls
 * - Holographic UI design
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

"use client";

import React, { useEffect, useState } from 'react';
import { 
  getIntelligencePipeline, 
  type IntelligenceNode, 
  type PipelineMetrics,
  type NodeHealth,
  type NodeStatus
} from '../../lib/intelligence/IntelligencePipelineCoordinator';

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface NodeCardProps {
  node: IntelligenceNode;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}

// ─────────────────────────────────────────────────────────────────
// HEALTH COLOR MAPPING
// ─────────────────────────────────────────────────────────────────

const healthColors: Record<NodeHealth, { bg: string; border: string; glow: string; text: string }> = {
  HEALTHY: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/50',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    text: 'text-green-400'
  },
  DEGRADED: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/50',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    text: 'text-yellow-400'
  },
  CRITICAL: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    text: 'text-red-400'
  },
  OFFLINE: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/50',
    glow: 'shadow-[0_0_20px_rgba(107,114,128,0.3)]',
    text: 'text-gray-400'
  }
};

const statusIcons: Record<NodeStatus, string> = {
  INITIALIZING: '⏳',
  RUNNING: '▶️',
  PAUSED: '⏸️',
  ERROR: '❌'
};

// ─────────────────────────────────────────────────────────────────
// NODE CARD COMPONENT
// ─────────────────────────────────────────────────────────────────

const NodeCard: React.FC<NodeCardProps> = ({ node, onPause, onResume, onReset }) => {
  const colors = healthColors[node.health];
  
  return (
    <div className={`
      relative p-4 rounded-lg border-2 backdrop-blur-sm
      ${colors.bg} ${colors.border} ${colors.glow}
      transition-all duration-300 hover:scale-105
    `}>
      {/* Safe Mode Badge */}
      {node.safeMode && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-blue-500/20 border border-blue-500/50">
          <span className="text-xs text-blue-400 font-mono">🛡️ SAFE MODE</span>
        </div>
      )}
      
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{statusIcons[node.status]}</span>
        <div className="flex-1">
          <h3 className="font-bold text-white">{node.name}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-wider">{node.type}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-mono ${colors.text} ${colors.bg}`}>
          {node.health}
        </div>
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-xs text-gray-400">Latency</p>
          <p className="text-sm font-mono text-white">{node.latency.toFixed(1)}ms</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Throughput</p>
          <p className="text-sm font-mono text-white">{node.throughput.toFixed(0)}/s</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Errors</p>
          <p className="text-sm font-mono text-white">{node.errorCount}</p>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex gap-2">
        {node.status === 'RUNNING' && (
          <button
            onClick={onPause}
            className="flex-1 px-2 py-1 text-xs rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50 transition-colors"
          >
            Pause
          </button>
        )}
        {node.status === 'PAUSED' && (
          <button
            onClick={onResume}
            className="flex-1 px-2 py-1 text-xs rounded bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 transition-colors"
          >
            Resume
          </button>
        )}
        {node.errorCount > 0 && (
          <button
            onClick={onReset}
            className="flex-1 px-2 py-1 text-xs rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function EnhancedIntelligencePipelinePanel() {
  const [nodes, setNodes] = useState<IntelligenceNode[]>([]);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const pipeline = getIntelligencePipeline();
    
    // Initialize pipeline
    if (!initialized) {
      pipeline.initialize().then(() => {
        setInitialized(true);
      });
    }

    // Subscribe to updates
    const unsubscribe = pipeline.subscribe((state) => {
      setNodes(Array.from(state.nodes.values()));
      setMetrics(state.metrics);
    });

    return () => {
      unsubscribe();
    };
  }, [initialized]);

  const handlePauseNode = (id: string) => {
    getIntelligencePipeline().pauseNode(id);
  };

  const handleResumeNode = (id: string) => {
    getIntelligencePipeline().resumeNode(id);
  };

  const handleResetNode = (id: string) => {
    getIntelligencePipeline().resetNode(id);
  };

  if (!initialized || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <p className="text-white font-bold">Initializing Intelligence Pipeline...</p>
          <p className="text-gray-400 text-sm">Safe Mode Active</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Safe Mode Banner */}
      {metrics.safeMode && (
        <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-blue-400">SAFE MODE ACTIVE</h2>
              <p className="text-sm text-gray-300">
                All intelligence nodes using simulated data. No real trading operations.
              </p>
            </div>
            <div className="px-4 py-2 rounded bg-green-500/20 border border-green-500/50">
              <span className="text-green-400 font-mono text-sm">✓ PROTECTED</span>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/50">
          <p className="text-xs text-gray-400 uppercase">Total Nodes</p>
          <p className="text-2xl font-bold text-white">{metrics.totalNodes}</p>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50">
          <p className="text-xs text-gray-400 uppercase">Healthy</p>
          <p className="text-2xl font-bold text-green-400">{metrics.healthyNodes}</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/50">
          <p className="text-xs text-gray-400 uppercase">Avg Latency</p>
          <p className="text-2xl font-bold text-white">{metrics.averageLatency.toFixed(1)}ms</p>
        </div>
        <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/50">
          <p className="text-xs text-gray-400 uppercase">Throughput</p>
          <p className="text-2xl font-bold text-white">{metrics.totalThroughput.toFixed(0)}/s</p>
        </div>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
          <p className="text-xs text-gray-400 uppercase">Total Errors</p>
          <p className="text-2xl font-bold text-yellow-400">{metrics.totalErrors}</p>
        </div>
        <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/50">
          <p className="text-xs text-gray-400 uppercase">Uptime</p>
          <p className="text-2xl font-bold text-white">
            {Math.floor(metrics.uptime / 60000)}m
          </p>
        </div>
      </div>

      {/* Intelligence Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            onPause={() => handlePauseNode(node.id)}
            onResume={() => handleResumeNode(node.id)}
            onReset={() => handleResetNode(node.id)}
          />
        ))}
      </div>

      {/* Pipeline Health Visualization */}
      <div className="p-6 rounded-lg bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-2 border-purple-500/30">
        <h3 className="text-lg font-bold text-white mb-4">Pipeline Health</h3>
        <div className="flex items-center gap-2 h-8">
          {nodes.map((node) => {
            const colors = healthColors[node.health];
            return (
              <div
                key={node.id}
                className={`flex-1 h-full rounded ${colors.bg} ${colors.border} border-2 ${colors.glow} transition-all duration-500`}
                title={`${node.name}: ${node.health}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Cognitive</span>
          <span>Memory</span>
          <span>Execution</span>
          <span>Threat</span>
          <span>Divergence</span>
        </div>
      </div>
    </div>
  );
}
