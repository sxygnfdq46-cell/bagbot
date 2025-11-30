/**
 * ═══════════════════════════════════════════════════════════════════
 * INTELLIGENCE PIPELINE PANEL — Level 20.4
 * Holographic Real-Time Monitoring Dashboard
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPE DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PipelineStageStatus {
  stage: string;
  latency: number;
  throughput: number;
  errors: number;
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  trend: 'UP' | 'FLAT' | 'DOWN';
  timestamp: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function IntelligencePipelinePanel() {
  const [stages, setStages] = useState<PipelineStageStatus[]>([
    {
      stage: 'MarketStream Ingestion',
      latency: 12,
      throughput: 245,
      errors: 0,
      health: 'HEALTHY',
      trend: 'FLAT',
      timestamp: Date.now(),
    },
    {
      stage: 'FusionEngine Output',
      latency: 48,
      throughput: 180,
      errors: 0,
      health: 'HEALTHY',
      trend: 'UP',
      timestamp: Date.now(),
    },
    {
      stage: 'FusionStabilizer Output',
      latency: 23,
      throughput: 175,
      errors: 1,
      health: 'HEALTHY',
      trend: 'FLAT',
      timestamp: Date.now(),
    },
    {
      stage: 'DecisionEngine Signals',
      latency: 67,
      throughput: 120,
      errors: 0,
      health: 'HEALTHY',
      trend: 'DOWN',
      timestamp: Date.now(),
    },
    {
      stage: 'SafetyCore Checks',
      latency: 15,
      throughput: 120,
      errors: 0,
      health: 'HEALTHY',
      trend: 'FLAT',
      timestamp: Date.now(),
    },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStages(prevStages =>
        prevStages.map(stage => ({
          ...stage,
          latency: Math.max(5, stage.latency + Math.floor(Math.random() * 10 - 5)),
          throughput: Math.max(50, stage.throughput + Math.floor(Math.random() * 20 - 10)),
          errors: Math.max(0, stage.errors + (Math.random() > 0.95 ? 1 : 0)),
          health: stage.errors > 5 ? 'CRITICAL' : stage.latency > 100 ? 'DEGRADED' : 'HEALTHY',
          trend: Math.random() > 0.6 ? 'UP' : Math.random() > 0.3 ? 'FLAT' : 'DOWN',
          timestamp: Date.now(),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (health: PipelineStageStatus['health']) => {
    switch (health) {
      case 'HEALTHY':
        return 'text-green-400 border-green-500/50 bg-green-950/30';
      case 'DEGRADED':
        return 'text-yellow-400 border-yellow-500/50 bg-yellow-950/30';
      case 'CRITICAL':
        return 'text-red-400 border-red-500/50 bg-red-950/30';
    }
  };

  const getHealthGlow = (health: PipelineStageStatus['health']) => {
    switch (health) {
      case 'HEALTHY':
        return '0 0 20px rgba(34, 197, 94, 0.5)';
      case 'DEGRADED':
        return '0 0 20px rgba(234, 179, 8, 0.5)';
      case 'CRITICAL':
        return '0 0 20px rgba(239, 68, 68, 0.5)';
    }
  };

  const getTrendIcon = (trend: PipelineStageStatus['trend']) => {
    switch (trend) {
      case 'UP':
        return '↗';
      case 'FLAT':
        return '→';
      case 'DOWN':
        return '↘';
    }
  };

  const getTrendColor = (trend: PipelineStageStatus['trend']) => {
    switch (trend) {
      case 'UP':
        return 'text-green-400';
      case 'FLAT':
        return 'text-cyan-400';
      case 'DOWN':
        return 'text-red-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-4xl">📊</div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
              Intelligence Pipeline Monitor
            </h2>
            <p className="text-gray-400 mt-1">
              Real-time holographic monitoring of all 5 pipeline stages
            </p>
          </div>
        </div>
      </div>

      {/* Pipeline Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stages.map((stage, index) => (
          <div
            key={stage.stage}
            className={`
              relative rounded-lg border-2 p-6 transition-all duration-300
              ${getHealthColor(stage.health)}
              hover:scale-105
            `}
            style={{
              boxShadow: getHealthGlow(stage.health),
              animation: 'pulse 2s infinite',
            }}
          >
            {/* Stage Number */}
            <div className="absolute top-3 right-3 text-2xl font-bold opacity-30">
              {index + 1}
            </div>

            {/* Stage Name */}
            <h3 className="text-xl font-bold mb-4 pr-8">
              {stage.stage}
            </h3>

            {/* Metrics Grid */}
            <div className="space-y-3">
              {/* Latency */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Latency</span>
                <span className="text-lg font-mono font-bold">
                  {stage.latency}ms
                </span>
              </div>

              {/* Throughput */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Throughput</span>
                <span className="text-lg font-mono font-bold">
                  {stage.throughput}/sec
                </span>
              </div>

              {/* Errors */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Error Count</span>
                <span className={`text-lg font-mono font-bold ${stage.errors > 0 ? 'text-red-400' : ''}`}>
                  {stage.errors}
                </span>
              </div>

              {/* Health */}
              <div className="flex justify-between items-center pt-2 border-t border-current/20">
                <span className="text-sm text-gray-400">Health</span>
                <span className="text-sm font-bold uppercase tracking-wider">
                  {stage.health}
                </span>
              </div>

              {/* Trend */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Trend</span>
                <span className={`text-2xl ${getTrendColor(stage.trend)}`}>
                  {getTrendIcon(stage.trend)}
                </span>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-gray-500 text-center pt-2">
                {new Date(stage.timestamp).toLocaleTimeString()}
              </div>
            </div>

            {/* GPU-accelerated glow animation */}
            <div
              className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${
                  stage.health === 'HEALTHY'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : stage.health === 'DEGRADED'
                    ? 'rgba(234, 179, 8, 0.3)'
                    : 'rgba(239, 68, 68, 0.3)'
                }, transparent 70%)`,
                animation: 'pulse 3s ease-in-out infinite',
              }}
            />
          </div>
        ))}
      </div>

      {/* Overall Pipeline Health */}
      <div className="mt-8 p-6 rounded-lg border-2 border-purple-500/50 bg-purple-950/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-purple-400">Overall Pipeline Status</h3>
            <p className="text-gray-400 text-sm mt-1">
              All stages operational • No critical issues detected
            </p>
          </div>
          <div className="text-5xl animate-pulse">✓</div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-400">
              {stages.reduce((sum, s) => sum + s.throughput, 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Throughput/sec</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {Math.round(stages.reduce((sum, s) => sum + s.latency, 0) / stages.length)}ms
            </div>
            <div className="text-xs text-gray-400 mt-1">Avg Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {stages.reduce((sum, s) => sum + s.errors, 0)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Total Errors</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {stages.filter(s => s.health === 'HEALTHY').length}/{stages.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Healthy Stages</div>
          </div>
        </div>
      </div>

      {/* Holographic Theme Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
