'use client';

import { useState, useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * THREAD INSPECTOR — Level 17.4 Module
 * ═══════════════════════════════════════════════════════════════════
 * Displays 50+ AI micro-threads with live activity monitoring
 * 
 * Features:
 * - Live activity bars for each thread
 * - Bottleneck detection
 * - Thread health scoring
 * - Color-coded status indicators
 * ═══════════════════════════════════════════════════════════════════
 */

interface Thread {
  id: string;
  name: string;
  activity: number; // 0-100
  health: number; // 0-100
  status: 'active' | 'idle' | 'blocked' | 'waiting';
  cpu: number; // 0-100
}

const generateThreads = (): Thread[] => {
  const threadNames = [
    // Core Reasoning (8)
    'Memory Parser', 'Context Builder', 'Emotional Analyzer', 'Risk Calculator',
    'Decision Engine', 'Pattern Matcher', 'Sentiment Tracker', 'Intent Router',
    // Processing Layer (8)
    'Response Generator', 'Safety Validator', 'Approval Manager', 'State Syncer',
    'Event Processor', 'Queue Manager', 'Priority Sorter', 'Conflict Resolver',
    // Data Layer (8)
    'Data Aggregator', 'Metric Collector', 'Performance Monitor', 'Error Handler',
    'Retry Manager', 'Timeout Watcher', 'Resource Allocator', 'Load Balancer',
    // Storage & Cache (8)
    'Cache Manager', 'Storage Writer', 'Index Builder', 'Query Optimizer',
    'Connection Pool', 'Session Handler', 'Auth Validator', 'Token Manager',
    // Sync & Coordination (8)
    'Broadcast Syncer', 'Tab Coordinator', 'State Reconciler', 'Diff Calculator',
    'Merge Resolver', 'Conflict Detector', 'Version Tracker', 'Snapshot Manager',
    // Memory Management (8)
    'History Pruner', 'Cleanup Worker', 'GC Coordinator', 'Memory Optimizer',
    'Thread Scheduler', 'Task Dispatcher', 'Work Stealer', 'Job Executor',
    // Output & Logging (8)
    'Result Aggregator', 'Output Formatter', 'Log Writer', 'Metric Exporter',
    'Debug Tracer', 'Alert Generator', 'Report Builder', 'Stream Handler',
    // New Threads (8) - Total 64
    'Neural Predictor', 'Trend Analyzer', 'Anomaly Detector', 'Load Forecaster',
    'Health Checker', 'Circuit Breaker', 'Rate Limiter', 'Backpressure Manager'
  ];

  return threadNames.map((name, index) => ({
    id: `thread-${index}`,
    name,
    activity: Math.floor(Math.random() * 100),
    health: Math.floor(75 + Math.random() * 25), // 75-100 range for varied states
    status: ['active', 'idle', 'blocked', 'waiting'][Math.floor(Math.random() * 4)] as Thread['status'],
    cpu: Math.floor(Math.random() * 60) // 0-60% CPU per thread
  }));
};

export default function ThreadInspector() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);

  useEffect(() => {
    setThreads(generateThreads());

    const interval = setInterval(() => {
      setThreads(prev => prev.map(thread => ({
        ...thread,
        activity: Math.min(100, Math.max(0, thread.activity + (Math.random() * 20 - 10))),
        cpu: Math.min(100, Math.max(0, thread.cpu + (Math.random() * 10 - 5)))
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: Thread['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'idle': return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
      case 'blocked': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'waiting': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-400';
    if (health >= 75) return 'text-yellow-400';
    if (health >= 60) return 'text-orange-400'; // Warning state
    return 'text-red-400'; // Overload state
  };

  const getHealthGlow = (health: number) => {
    if (health >= 90) return '';
    if (health >= 75) return '';
    if (health >= 60) return 'thread-warning'; // Orange warning
    return 'thread-overload'; // Red glow
  };

  const getPerformanceRank = (thread: Thread): string => {
    const score = (thread.health * 0.6) + ((100 - thread.cpu) * 0.3) + (thread.activity * 0.1);
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  const getRankColor = (rank: string): string => {
    switch (rank) {
      case 'S': return 'text-purple-300 border-purple-400 bg-purple-500/20';
      case 'A': return 'text-green-300 border-green-400 bg-green-500/20';
      case 'B': return 'text-blue-300 border-blue-400 bg-blue-500/20';
      case 'C': return 'text-yellow-300 border-yellow-400 bg-yellow-500/20';
      default: return 'text-red-300 border-red-400 bg-red-500/20';
    }
  };

  const bottlenecks = threads.filter(t => t.status === 'blocked' || t.cpu > 80);
  const avgHealth = threads.reduce((sum, t) => sum + t.health, 0) / threads.length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-3">
          <div className="text-xs text-purple-400 mb-1">Total Threads</div>
          <div className="text-2xl font-bold text-purple-200">{threads.length}</div>
        </div>
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-3">
          <div className="text-xs text-purple-400 mb-1">Avg Health</div>
          <div className={`text-2xl font-bold ${getHealthColor(avgHealth)}`}>
            {avgHealth.toFixed(0)}%
          </div>
        </div>
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-3">
          <div className="text-xs text-purple-400 mb-1">Bottlenecks</div>
          <div className={`text-2xl font-bold ${bottlenecks.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {bottlenecks.length}
          </div>
        </div>
      </div>

      {/* Thread List with Performance Ranks & Pulse Indicators */}
      <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
        {threads.map(thread => {
          const rank = getPerformanceRank(thread);
          const rankColor = getRankColor(rank);
          const healthGlow = getHealthGlow(thread.health);

          return (
            <div
              key={thread.id}
              onClick={() => setSelectedThread(thread)}
              className={`bg-purple-950/20 border border-purple-800/30 rounded-lg p-3 hover:border-purple-500/50 transition-all duration-240 cursor-pointer thread-card ${healthGlow}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Pulse Indicator */}
                  <div className={`pulse-indicator pulse-indicator-${thread.status}`} />
                  
                  <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(thread.status)}`}>
                    {thread.status}
                  </span>
                  <span className="text-sm text-purple-200 truncate">{thread.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Performance Rank Badge */}
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${rankColor} performance-rank`}>
                    {rank}
                  </span>
                  <span className={`text-xs font-medium ${getHealthColor(thread.health)}`}>
                    {thread.health}%
                  </span>
                </div>
              </div>

              {/* Activity Bar with GPU animation */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-purple-400">Activity</span>
                  <span className="text-purple-300">{thread.activity.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-300 transition-all duration-500 activity-bar-glow"
                    style={{ width: `${thread.activity}%` }}
                  />
                </div>
              </div>

              {/* CPU Bar with overload detection */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-purple-400">CPU</span>
                  <span className={`${thread.cpu > 80 ? 'text-red-400 font-bold' : 'text-purple-300'}`}>
                    {thread.cpu.toFixed(0)}% {thread.cpu > 80 && '⚠️'}
                  </span>
                </div>
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      thread.cpu > 80 ? 'bg-gradient-to-r from-red-500 to-orange-500 cpu-overload-glow' :
                      'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}
                    style={{ width: `${thread.cpu}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottleneck Alert */}
      {bottlenecks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span>⚠️</span>
            <span className="font-medium">{bottlenecks.length} bottleneck(s) detected</span>
          </div>
        </div>
      )}
    </div>
  );
}
