'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUIKernel } from '@/components/ui';
import { useIntelligenceStream } from '@/hooks/useIntelligenceStream';
import { IntelligenceAPI } from '@/src/engine/stability-shield/ShieldIntelligenceAPI';

/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 17.3 — USER INTELLIGENCE BOARD
 * ═══════════════════════════════════════════════════════════════════
 * Purple Techwave Theme: Advanced user behavior analytics
 * 
 * Features:
 * - 6 intelligence widgets with real-time monitoring
 * - Purple gradient aesthetics with GPU-accelerated effects
 * - Cognitive load, emotional signatures, engagement rhythms
 * - Pattern detection and anomaly sentinels
 * - Responsive layout with adaptive animations
 * 
 * Widgets:
 * 1. 🧠 Cognitive Load Meter (0-100 dial)
 * 2. 🎭 Emotional Signature Analyzer (11 emotional states)
 * 3. 🔄 Engagement Rhythm Tracker (phase-stability)
 * 4. 📈 Trend Forecast Node (30s predictions)
 * 5. 🧩 Pattern Map Engine (behavior clusters)
 * 6. 🔍 Anomaly Sentinel (unusual pattern detection)
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface IntelligenceWidget {
  id: string;
  title: string;
  icon: string;
  status: 'optimal' | 'elevated' | 'critical' | 'idle';
  primaryMetric: {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'rising' | 'falling' | 'stable';
  };
  secondaryMetrics?: Array<{
    label: string;
    value: string;
  }>;
  alertLevel?: 'none' | 'low' | 'medium' | 'high';
}

interface EmotionalState {
  name: string;
  intensity: number; // 0-100
  color: string;
}

// ─────────────────────────────────────────────────────────────────
// PLACEHOLDER DATA GENERATORS
// ─────────────────────────────────────────────────────────────────

const generateCognitiveLoad = (): number => {
  // Simulate cognitive load between 30-85
  return Math.floor(30 + Math.random() * 55);
};

const generateEmotionalStates = (): EmotionalState[] => [
  { name: 'Joy', intensity: Math.floor(60 + Math.random() * 30), color: '#fbbf24' },
  { name: 'Trust', intensity: Math.floor(70 + Math.random() * 20), color: '#60a5fa' },
  { name: 'Fear', intensity: Math.floor(10 + Math.random() * 20), color: '#f87171' },
  { name: 'Surprise', intensity: Math.floor(40 + Math.random() * 30), color: '#a78bfa' },
  { name: 'Sadness', intensity: Math.floor(15 + Math.random() * 25), color: '#94a3b8' },
  { name: 'Disgust', intensity: Math.floor(5 + Math.random() * 15), color: '#4ade80' },
  { name: 'Anger', intensity: Math.floor(10 + Math.random() * 20), color: '#ef4444' },
  { name: 'Anticipation', intensity: Math.floor(50 + Math.random() * 30), color: '#fb923c' },
  { name: 'Curiosity', intensity: Math.floor(65 + Math.random() * 25), color: '#c084fc' },
  { name: 'Empathy', intensity: Math.floor(75 + Math.random() * 20), color: '#22d3ee' },
  { name: 'Confidence', intensity: Math.floor(60 + Math.random() * 30), color: '#818cf8' }
];

const generateEngagementRhythm = () => ({
  phaseStability: Math.floor(75 + Math.random() * 20),
  rhythmVariance: (Math.random() * 0.3 + 0.1).toFixed(2),
  beatPattern: Array.from({ length: 24 }, () => Math.floor(40 + Math.random() * 60))
});

const generateTrendForecast = () => ({
  direction: Math.random() > 0.5 ? 'rising' : 'falling',
  confidence: Math.floor(70 + Math.random() * 25),
  prediction: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 15).toFixed(1)}%`
});

const generatePatternClusters = () => {
  return Array.from({ length: 16 }, (_, i) => ({
    id: i,
    intensity: Math.floor(Math.random() * 100),
    active: Math.random() > 0.6
  }));
};

const generateAnomalies = () => ({
  detected: Math.floor(Math.random() * 5),
  lastDetection: Math.floor(Math.random() * 45) + 1,
  severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
});

// ─────────────────────────────────────────────────────────────────
// WIDGET COMPONENTS
// ─────────────────────────────────────────────────────────────────

function CognitiveLoadMeter({ load }: { load: number }) {
  const getLoadColor = (value: number) => {
    if (value < 50) return 'from-green-500 to-emerald-400';
    if (value < 70) return 'from-yellow-500 to-orange-400';
    return 'from-orange-500 to-red-400';
  };

  const getLoadStatus = (value: number) => {
    if (value < 50) return 'Optimal';
    if (value < 70) return 'Elevated';
    return 'Critical';
  };

  return (
    <div className="purple-techwave-widget">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-4xl animate-pulse-slow">🧠</div>
          <div>
            <h3 className="text-lg font-bold text-purple-300">Cognitive Load</h3>
            <p className="text-xs text-purple-500">{getLoadStatus(load)}</p>
          </div>
        </div>
      </div>

      <div className="relative w-full h-32 flex items-center justify-center mb-4">
        {/* Radial background */}
        <div className="absolute inset-0 rounded-full opacity-20"
             style={{
               background: `conic-gradient(from 0deg, 
                 rgba(123, 43, 255, 0.3) 0%, 
                 rgba(216, 107, 255, 0.3) ${load}%, 
                 rgba(30, 20, 50, 0.3) ${load}%)`
             }}>
        </div>

        {/* Load value */}
        <div className="relative z-10 text-center">
          <div className={`text-5xl font-bold bg-gradient-to-br ${getLoadColor(load)} bg-clip-text text-transparent`}>
            {load}
          </div>
          <div className="text-xs text-purple-400 mt-1">Load Index</div>
        </div>

        {/* Animated pulse ring */}
        {load > 70 && (
          <div className="absolute inset-0 animate-pulse-ring border-2 border-purple-500 rounded-full" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Min</div>
          <div className="text-white font-medium">0</div>
        </div>
        <div className="text-center p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Avg</div>
          <div className="text-white font-medium">{Math.floor(load * 0.85)}</div>
        </div>
        <div className="text-center p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Peak</div>
          <div className="text-white font-medium">100</div>
        </div>
      </div>
    </div>
  );
}

function EmotionalSignatureAnalyzer({ states }: { states: EmotionalState[] }) {
  const topEmotion = useMemo(() => {
    if (states.length === 0) return null;
    return states.reduce((prev, current) => 
      current.intensity > prev.intensity ? current : prev
    );
  }, [states]);

  if (!topEmotion) return null;

  return (
    <div className="purple-techwave-widget">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl animate-pulse-slow">🎭</div>
        <div>
          <h3 className="text-lg font-bold text-purple-300">Emotional Signature</h3>
          <p className="text-xs text-purple-500">11 Spectrum States</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm text-purple-400 mb-2">Dominant Emotion</div>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-purple-200">{topEmotion.name}</div>
          <div className="text-lg text-purple-400">{topEmotion.intensity}%</div>
        </div>
      </div>

      <div className="space-y-2">
        {states.slice(0, 6).map((state) => (
          <div key={state.name} className="relative">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-purple-300">{state.name}</span>
              <span className="text-purple-400">{state.intensity}%</span>
            </div>
            <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-purple-300 rounded-full transition-all duration-1000"
                style={{ width: `${state.intensity}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-2 bg-purple-950/30 rounded text-xs text-purple-400 text-center">
        +{states.length - 6} more states tracked
      </div>
    </div>
  );
}

function EngagementRhythmTracker({ rhythm }: { rhythm: ReturnType<typeof generateEngagementRhythm> }) {
  return (
    <div className="purple-techwave-widget">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl animate-pulse-slow">🔄</div>
        <div>
          <h3 className="text-lg font-bold text-purple-300">Engagement Rhythm</h3>
          <p className="text-xs text-purple-500">Phase Stability</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-3xl font-bold text-purple-200 mb-1">
          {rhythm.phaseStability}%
        </div>
        <div className="text-xs text-purple-400">Stability Score</div>
      </div>

      {/* Wave visualization */}
      <div className="h-20 bg-purple-950/30 rounded-lg p-2 mb-4 overflow-hidden relative">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="url(#purpleGradient)"
            strokeWidth="2"
            points={rhythm.beatPattern.map((val, idx) => 
              `${(idx / rhythm.beatPattern.length) * 100}%,${100 - val}%`
            ).join(' ')}
          />
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7b2bff" />
              <stop offset="100%" stopColor="#d86bff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-purple-500/20 animate-shimmer" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Variance</div>
          <div className="text-white font-medium">{rhythm.rhythmVariance}</div>
        </div>
        <div className="p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Pattern</div>
          <div className="text-white font-medium">Wave-Beat</div>
        </div>
      </div>
    </div>
  );
}

function TrendForecastNode({ forecast }: { forecast: ReturnType<typeof generateTrendForecast> }) {
  return (
    <div className="purple-techwave-widget">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl animate-pulse-slow">📈</div>
        <div>
          <h3 className="text-lg font-bold text-purple-300">Trend Forecast</h3>
          <p className="text-xs text-purple-500">30s Prediction</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className={`text-6xl mb-2 ${forecast.direction === 'rising' ? 'text-green-400' : 'text-red-400'}`}>
          {forecast.direction === 'rising' ? '↗' : '↘'}
        </div>
        <div className="text-2xl font-bold text-purple-200 mb-1">
          {forecast.prediction}
        </div>
        <div className="text-xs text-purple-400">Predicted Change</div>
      </div>

      <div className="p-3 bg-purple-950/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-400">Confidence</span>
          <span className="text-sm text-purple-200 font-medium">{forecast.confidence}%</span>
        </div>
        <div className="h-2 bg-purple-950/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shimmer-animation"
            style={{ width: `${forecast.confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-4 text-center text-xs text-purple-500">
        Model refreshes every 30s
      </div>
    </div>
  );
}

function PatternMapEngine({ clusters }: { clusters: ReturnType<typeof generatePatternClusters> }) {
  return (
    <div className="purple-techwave-widget">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl animate-pulse-slow">🧩</div>
        <div>
          <h3 className="text-lg font-bold text-purple-300">Pattern Map</h3>
          <p className="text-xs text-purple-500">Behavior Clusters</p>
        </div>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className={`aspect-square rounded-lg border transition-all duration-300 ${
              cluster.active 
                ? 'bg-purple-500/30 border-purple-400 animate-pulse-slow' 
                : 'bg-purple-950/20 border-purple-800/30'
            }`}
            style={{ 
              opacity: cluster.intensity / 100,
              boxShadow: cluster.active ? '0 0 10px rgba(123, 43, 255, 0.5)' : 'none'
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Active</div>
          <div className="text-white font-medium">
            {clusters.filter(c => c.active).length}/16
          </div>
        </div>
        <div className="p-2 bg-purple-950/30 rounded">
          <div className="text-purple-400">Avg Intensity</div>
          <div className="text-white font-medium">
            {Math.floor(clusters.reduce((sum, c) => sum + c.intensity, 0) / clusters.length)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function AnomalySentinel({ anomalies }: { anomalies: ReturnType<typeof generateAnomalies> }) {
  const severityColors = {
    low: 'from-green-500/20 to-emerald-500/10',
    medium: 'from-yellow-500/20 to-orange-500/10',
    high: 'from-red-500/20 to-pink-500/10'
  };

  const severityBorder = {
    low: 'border-green-500/40',
    medium: 'border-yellow-500/40',
    high: 'border-red-500/40 animate-pulse'
  };

  return (
    <div className={`purple-techwave-widget border ${severityBorder[anomalies.severity as keyof typeof severityBorder]}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl animate-pulse-slow">🔍</div>
        <div>
          <h3 className="text-lg font-bold text-purple-300">Anomaly Sentinel</h3>
          <p className="text-xs text-purple-500">Pattern Detection</p>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-purple-200 mb-2">
          {anomalies.detected}
        </div>
        <div className="text-xs text-purple-400">Anomalies Detected</div>
      </div>

      <div className={`p-4 rounded-lg bg-gradient-to-br ${severityColors[anomalies.severity as keyof typeof severityColors]} mb-4`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-300">Severity Level</span>
          <span className={`text-sm font-bold uppercase ${
            anomalies.severity === 'high' ? 'text-red-400' :
            anomalies.severity === 'medium' ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {anomalies.severity}
          </span>
        </div>
        <div className="text-xs text-purple-400">
          Last detection: {anomalies.lastDetection}s ago
        </div>
      </div>

      <div className="text-center text-xs text-purple-500">
        Monitoring 24/7 • Real-time alerts
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function UserIntelligenceBoard() {
  const { snapshot, clusters } = useIntelligenceStream();
  const [cognitiveLoad, setCognitiveLoad] = useState(0);
  const [emotionalStates, setEmotionalStates] = useState<EmotionalState[]>([]);
  const [engagementRhythm, setEngagementRhythm] = useState(generateEngagementRhythm());
  const [trendForecast, setTrendForecast] = useState(generateTrendForecast());
  const [patternClusters, setPatternClusters] = useState(generatePatternClusters());
  const [anomalies, setAnomalies] = useState(generateAnomalies());
  const [isLoading, setIsLoading] = useState(true);

  // Shield health breakdown from intelligence
  const shieldHealth = IntelligenceAPI.getShieldHealthBreakdown();
  const emotionalFeed = shieldHealth.find(s => s.shield === 'emotional');
  const memoryFeed = shieldHealth.find(s => s.shield === 'memory');
  const executionFeed = shieldHealth.find(s => s.shield === 'execution');

  // Initialize data
  useEffect(() => {
    setCognitiveLoad(generateCognitiveLoad());
    setEmotionalStates(generateEmotionalStates());
    setIsLoading(false);
  }, []);

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCognitiveLoad(generateCognitiveLoad());
      setEmotionalStates(generateEmotionalStates());
      setEngagementRhythm(generateEngagementRhythm());
      setTrendForecast(generateTrendForecast());
      setPatternClusters(generatePatternClusters());
      setAnomalies(generateAnomalies());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-purple-400">
          Initializing Intelligence Board...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gradient-to-br from-purple-950/20 to-black">
      {/* Live Intelligence Feeds */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {/* Emotional Engine Feed */}
        <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-purple-300">🎭 Emotional Engine</h4>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              emotionalFeed?.status === 'HEALTHY' ? 'bg-green-500/20 text-green-400' :
              emotionalFeed?.status === 'ATTENTION' ? 'bg-yellow-500/20 text-yellow-400' :
              emotionalFeed?.status === 'WARNING' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {emotionalFeed?.status || 'IDLE'}
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-200">
            {emotionalFeed?.threatCount || 0} threats
          </div>
          <div className="text-xs text-purple-400">
            Avg Severity: {emotionalFeed?.averageSeverity.toFixed(1) || '0.0'}
          </div>
        </div>

        {/* Memory Integrity Feed */}
        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-cyan-300">🧠 Memory Integrity</h4>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              memoryFeed?.status === 'HEALTHY' ? 'bg-green-500/20 text-green-400' :
              memoryFeed?.status === 'ATTENTION' ? 'bg-yellow-500/20 text-yellow-400' :
              memoryFeed?.status === 'WARNING' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {memoryFeed?.status || 'IDLE'}
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-200">
            {memoryFeed?.threatCount || 0} threats
          </div>
          <div className="text-xs text-cyan-400">
            Avg Severity: {memoryFeed?.averageSeverity.toFixed(1) || '0.0'}
          </div>
        </div>

        {/* Execution Engine Stress Feed */}
        <div className="p-4 bg-orange-950/30 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-orange-300">⚙️ Execution Stress</h4>
            <div className={`px-2 py-1 rounded text-xs font-bold ${
              executionFeed?.status === 'HEALTHY' ? 'bg-green-500/20 text-green-400' :
              executionFeed?.status === 'ATTENTION' ? 'bg-yellow-500/20 text-yellow-400' :
              executionFeed?.status === 'WARNING' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {executionFeed?.status || 'IDLE'}
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-200">
            {executionFeed?.threatCount || 0} threats
          </div>
          <div className="text-xs text-orange-400">
            Avg Severity: {executionFeed?.averageSeverity.toFixed(1) || '0.0'}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">👥</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            User Intelligence Board
          </h2>
        </div>
        <p className="text-sm text-purple-400">
          Advanced behavior analytics • Purple Techwave Theme • Level 17.3
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CognitiveLoadMeter load={cognitiveLoad} />
        <EmotionalSignatureAnalyzer states={emotionalStates} />
        <EngagementRhythmTracker rhythm={engagementRhythm} />
        <TrendForecastNode forecast={trendForecast} />
        <PatternMapEngine clusters={patternClusters} />
        <AnomalySentinel anomalies={anomalies} />
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-purple-800/30">
        <div className="flex items-center justify-between text-xs text-purple-500">
          <div className="flex items-center gap-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Live Analysis
            </span>
          </div>
          <div>Refresh rate: 5s</div>
        </div>
      </div>
    </div>
  );
}
