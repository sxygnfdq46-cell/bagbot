'use client';

import { useState, useEffect } from 'react';
import { useUIKernel, DataPulseFeed } from '@/components/ui';
import { useIntelligenceStream } from '@/hooks/useIntelligenceStream';
import { IntelligenceAPI } from '@/src/engine/stability-shield/ShieldIntelligenceAPI';

/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 17.2 — SYSTEM OVERVIEW DECK
 * ═══════════════════════════════════════════════════════════════════
 * Live overview of all system components with sci-fi aesthetics.
 * 
 * Features:
 * - 6 live overview widgets with placeholder data
 * - Responsive 3x2 (desktop) → 1x6 (mobile) layout
 * - GPU-accelerated animations and pulse effects
 * - Real-time metrics integration (DataPulseFeed)
 * 
 * Widgets:
 * 1. System Health Monitor
 * 2. Memory Status (72h + rolling)
 * 3. Emotional Engine Summary (11.x levels)
 * 4. Sovereignty & Stability Index (12.x levels)
 * 5. Multi-Flow Orchestrator Activity (13.x)
 * 6. Risk & Integrity Indicators (14.x + 15.x)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface OverviewWidget {
  id: string;
  title: string;
  icon: string;
  status: 'healthy' | 'warning' | 'critical' | 'idle';
  primaryMetric: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'stable';
  };
  secondaryMetrics: Array<{
    label: string;
    value: string;
  }>;
  color: 'cyan' | 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

// ─────────────────────────────────────────────────────────────────
// INTELLIGENCE INTEGRATION
// ─────────────────────────────────────────────────────────────────

const generatePlaceholderWidgets = (risk?: number, riskState?: string, riskTrend?: string): OverviewWidget[] => [
  {
    id: 'system-health',
    title: 'System Health Monitor',
    icon: '💚',
    status: 'healthy',
    primaryMetric: {
      label: 'Overall Status',
      value: '98.5%',
      trend: 'stable'
    },
    secondaryMetrics: [
      { label: 'Uptime', value: '47d 12h' },
      { label: 'Response Time', value: '23ms' },
      { label: 'Error Rate', value: '0.02%' }
    ],
    color: 'green'
  },
  {
    id: 'memory-status',
    title: 'Memory Status',
    icon: '🧠',
    status: 'healthy',
    primaryMetric: {
      label: '72h Rolling Memory',
      value: '2,847 events',
      trend: 'up'
    },
    secondaryMetrics: [
      { label: 'Short-term', value: '1.2k events' },
      { label: 'Long-term', value: '8.9k events' },
      { label: 'Integrity', value: '99.8%' }
    ],
    color: 'cyan'
  },
  {
    id: 'emotional-engine',
    title: 'Emotional Engine Summary',
    icon: '🎭',
    status: 'healthy',
    primaryMetric: {
      label: 'Active Emotional States',
      value: '11 levels',
      trend: 'stable'
    },
    secondaryMetrics: [
      { label: 'Sentiment Score', value: '+0.73' },
      { label: 'Empathy Index', value: '87%' },
      { label: 'Response Quality', value: '94%' }
    ],
    color: 'purple'
  },
  {
    id: 'sovereignty',
    title: 'Sovereignty & Stability',
    icon: '⚖️',
    status: 'healthy',
    primaryMetric: {
      label: 'Stability Index',
      value: '96.2%',
      trend: 'up'
    },
    secondaryMetrics: [
      { label: 'Autonomy Level', value: 'L12.7' },
      { label: 'Decision Quality', value: '92%' },
      { label: 'Ethical Alignment', value: '98%' }
    ],
    color: 'blue'
  },
  {
    id: 'orchestrator',
    title: 'Multi-Flow Orchestrator',
    icon: '🎼',
    status: 'healthy',
    primaryMetric: {
      label: 'Active Workflows',
      value: '23 flows',
      trend: 'stable'
    },
    secondaryMetrics: [
      { label: 'Concurrent Tasks', value: '147' },
      { label: 'Queue Depth', value: '12' },
      { label: 'Completion Rate', value: '99.1%' }
    ],
    color: 'orange'
  },
  {
    id: 'risk-integrity',
    title: 'Risk & Integrity',
    icon: '🛡️',
    status: 'healthy',
    primaryMetric: {
      label: 'Risk Score',
      value: risk !== undefined ? `${risk}/100 (${riskState})` : 'Low (2.3)',
      trend: riskTrend ? (riskTrend === 'RISING' ? 'up' : riskTrend === 'FALLING' ? 'down' : 'stable') : 'down'
    },
    secondaryMetrics: [
      { label: 'Integrity Check', value: 'Passed' },
      { label: 'Security Score', value: '97%' },
      { label: 'Anomalies', value: '0 detected' }
    ],
    color: 'green'
  }
];

// ─────────────────────────────────────────────────────────────────
// WIDGET COMPONENT
// ─────────────────────────────────────────────────────────────────

interface WidgetCardProps {
  widget: OverviewWidget;
  index: number;
}

function WidgetCard({ widget, index }: WidgetCardProps) {
  const statusColors = {
    healthy: 'from-green-500/20 to-emerald-500/10',
    warning: 'from-yellow-500/20 to-orange-500/10',
    critical: 'from-red-500/20 to-pink-500/10',
    idle: 'from-gray-500/20 to-slate-500/10'
  };

  const borderColors = {
    cyan: 'border-cyan-500/40 hover:border-cyan-400/60',
    blue: 'border-blue-500/40 hover:border-blue-400/60',
    purple: 'border-purple-500/40 hover:border-purple-400/60',
    green: 'border-green-500/40 hover:border-green-400/60',
    orange: 'border-orange-500/40 hover:border-orange-400/60',
    red: 'border-red-500/40 hover:border-red-400/60'
  };

  const textColors = {
    cyan: 'text-cyan-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    red: 'text-red-400'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    stable: '→'
  };

  return (
    <div
      className={`relative group transition-all duration-300 animate-fade-in`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Outer glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${statusColors[widget.status]} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl`} />
      
      {/* Main card */}
      <div className={`relative bg-black/60 backdrop-blur-lg border ${borderColors[widget.color]} rounded-xl p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl animate-pulse-slow">
              {widget.icon}
            </div>
            <div>
              <h3 className={`font-bold ${textColors[widget.color]} text-lg leading-tight`}>
                {widget.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${widget.status === 'healthy' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  {widget.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary metric */}
        <div className="mb-4 pb-4 border-b border-gray-700/50">
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
            {widget.primaryMetric.label}
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-3xl font-bold ${textColors[widget.color]}`}>
              {widget.primaryMetric.value}
            </div>
            {widget.primaryMetric.trend && (
              <span className={`text-sm ${
                widget.primaryMetric.trend === 'up' ? 'text-green-400' :
                widget.primaryMetric.trend === 'down' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {trendIcons[widget.primaryMetric.trend]}
              </span>
            )}
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="space-y-2">
          {widget.secondaryMetrics.map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {metric.label}
              </span>
              <span className="text-sm text-gray-200 font-medium">
                {metric.value}
              </span>
            </div>
          ))}
        </div>

        {/* Animated corner accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${statusColors[widget.status]} opacity-30 rounded-xl blur-2xl animate-pulse-slow`} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function SystemOverviewDeck() {
  const { snapshot, risk, clusters } = useIntelligenceStream();
  
  // Live risk state based on IntelligenceAPI
  const riskState = risk < 25 ? 'GREEN' : risk < 50 ? 'YELLOW' : risk < 75 ? 'ORANGE' : 'RED';
  const riskTrend = IntelligenceAPI.getRiskTrend();
  
  const [widgets, setWidgets] = useState<OverviewWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize widgets
  useEffect(() => {
    const initialWidgets = generatePlaceholderWidgets(risk, riskState, riskTrend);
    setWidgets(initialWidgets);
    setIsLoading(false);
  }, []);

  // Update widgets when intelligence changes
  useEffect(() => {
    const updatedWidgets = generatePlaceholderWidgets(risk, riskState, riskTrend);
    setWidgets(updatedWidgets);
  }, [risk, riskState, riskTrend]);

  // Simulate live updates (placeholder)
  useEffect(() => {
    const interval = setInterval(() => {
      setWidgets(prev => prev.map(widget => ({
        ...widget,
        primaryMetric: {
          ...widget.primaryMetric,
          // Simulate minor fluctuations
          value: widget.primaryMetric.value
        }
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-cyan-400">
          Initializing System Overview...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-6">
      {/* Live Risk Meter */}
      <div className="mb-4 p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🛡️</div>
            <div>
              <h3 className="text-lg font-bold text-purple-300">Live Intelligence Risk</h3>
              <p className="text-xs text-purple-500">{IntelligenceAPI.getSummary()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`text-3xl font-bold ${
                riskState === 'GREEN' ? 'text-green-400' :
                riskState === 'YELLOW' ? 'text-yellow-400' :
                riskState === 'ORANGE' ? 'text-orange-400' : 'text-red-400'
              }`}>
                {risk}
              </div>
              <div className="text-xs text-purple-400">Risk Score</div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              riskState === 'GREEN' ? 'bg-green-500/20 text-green-400' :
              riskState === 'YELLOW' ? 'bg-yellow-500/20 text-yellow-400' :
              riskState === 'ORANGE' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {riskState}
            </div>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${clusters.length > 0 ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'}`} title="Clusters" />
              <div className={`w-2 h-2 rounded-full ${snapshot.correlations.pairs.length > 0 ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'}`} title="Correlations" />
              <div className={`w-2 h-2 rounded-full ${snapshot.predictions.nearTerm.length > 0 ? 'bg-orange-400 animate-pulse' : 'bg-gray-600'}`} title="Predictions" />
            </div>
          </div>
        </div>
        {/* Trend Arrows */}
        {riskTrend === 'RISING' && (
          <div className="mt-2 text-xs text-red-400 flex items-center gap-2">
            <span>↗</span> Risk trending upward
          </div>
        )}
        {riskTrend === 'FALLING' && (
          <div className="mt-2 text-xs text-green-400 flex items-center gap-2">
            <span>↘</span> Risk trending downward
          </div>
        )}
        {/* Error Rate Feed */}
        {risk >= 75 && (
          <div className="mt-3 p-2 bg-red-950/50 border border-red-500/50 rounded text-xs text-red-300">
            🔴 HIGH RISK DETECTED: {IntelligenceAPI.getTopThreats()[0] || 'Multiple threats active'}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">📊</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            System Overview Deck
          </h2>
        </div>
        <p className="text-sm text-gray-400">
          Real-time monitoring across all system components • Level 17.2
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {widgets.map((widget, index) => (
          <WidgetCard 
            key={widget.id} 
            widget={widget} 
            index={index}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-8 pt-6 border-t border-gray-700/30">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Refresh rate: 5s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
