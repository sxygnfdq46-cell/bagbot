'use client';

import { useState, useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * RESOURCE MATRIX — Level 17.4 Module
 * ═══════════════════════════════════════════════════════════════════
 * Real-time monitoring of CPU, Memory, GPU, and Context threads
 * 
 * Features:
 * - Live resource meters
 * - Performance indicators
 * - Usage trends
 * - Alert thresholds
 * ═══════════════════════════════════════════════════════════════════
 */

interface ResourceMetrics {
  cpu: number;
  memory: number;
  gpu: number;
  contextThreads: number;
  webWorkers: number; // New metric
  eventLoopDelay: number; // New metric in ms
}

export default function ResourceMatrix() {
  const [metrics, setMetrics] = useState<ResourceMetrics>({
    cpu: 45,
    memory: 62,
    gpu: 28,
    contextThreads: 147,
    webWorkers: 6, // 0-12 range
    eventLoopDelay: 8 // 0-100ms range
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + (Math.random() * 10 - 5))),
        memory: Math.min(100, Math.max(0, prev.memory + (Math.random() * 8 - 4))),
        gpu: Math.min(100, Math.max(0, prev.gpu + (Math.random() * 15 - 7))),
        contextThreads: Math.floor(Math.min(500, Math.max(50, prev.contextThreads + (Math.random() * 20 - 10)))),
        webWorkers: Math.floor(Math.min(12, Math.max(0, prev.webWorkers + (Math.random() * 2 - 1)))),
        eventLoopDelay: Math.min(100, Math.max(0, prev.eventLoopDelay + (Math.random() * 10 - 5)))
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const getUsageColor = (value: number) => {
    if (value < 50) return 'from-green-500 to-emerald-400';
    if (value < 75) return 'from-yellow-500 to-orange-400';
    return 'from-orange-500 to-red-500';
  };

  const getUsageStatus = (value: number) => {
    if (value < 50) return 'Optimal';
    if (value < 75) return 'Moderate';
    return 'High';
  };

  const resources = [
    {
      name: 'CPU Usage',
      value: metrics.cpu,
      unit: '%',
      icon: '🔧',
      max: 100,
      type: 'percentage' as const
    },
    {
      name: 'Memory Usage',
      value: metrics.memory,
      unit: '%',
      icon: '🧠',
      max: 100,
      type: 'percentage' as const
    },
    {
      name: 'GPU Effects',
      value: metrics.gpu,
      unit: '%',
      icon: '🎨',
      max: 100,
      type: 'percentage' as const
    },
    {
      name: 'Context Threads',
      value: metrics.contextThreads,
      unit: '',
      icon: '🧵',
      max: 500,
      type: 'count' as const
    },
    {
      name: 'Web Workers',
      value: metrics.webWorkers,
      unit: '',
      icon: '⚡',
      max: 12,
      type: 'count' as const
    },
    {
      name: 'Event Loop Delay',
      value: metrics.eventLoopDelay,
      unit: 'ms',
      icon: '⏱️',
      max: 100,
      type: 'latency' as const
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource, index) => {
        const percentage = (resource.value / resource.max) * 100;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
          <div key={index} className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4 ring-meter-card">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{resource.icon}</span>
              <div className={`text-xs px-2 py-0.5 rounded border ${
                percentage < 50 ? 'border-green-500/40 text-green-400 bg-green-500/10' :
                percentage < 75 ? 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10' :
                'border-red-500/40 text-red-400 bg-red-500/10'
              }`}>
                {getUsageStatus(percentage)}
              </div>
            </div>

            {/* Ring Meter with SVG */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-28 h-28 mb-3">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(123, 43, 255, 0.1)"
                    strokeWidth="8"
                  />
                  {/* Progress Ring with Gradient */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={`url(#gradient-${index})`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="ring-meter-progress"
                    style={{ 
                      transition: 'stroke-dashoffset 1s ease',
                      filter: 'drop-shadow(0 0 8px rgba(123, 43, 255, 0.6))'
                    }}
                  />
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={
                        percentage < 50 ? '#10b981' :
                        percentage < 75 ? '#f59e0b' :
                        '#ef4444'
                      } />
                      <stop offset="100%" stopColor={
                        percentage < 50 ? '#34d399' :
                        percentage < 75 ? '#fbbf24' :
                        '#f87171'
                      } />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Center Value */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-2xl font-bold bg-gradient-to-r ${getUsageColor(percentage)} bg-clip-text text-transparent`}>
                    {resource.type === 'count' 
                      ? resource.value.toFixed(0)
                      : resource.value.toFixed(1)}
                  </div>
                  <div className="text-xs text-purple-400">
                    {resource.unit || (resource.type === 'count' ? `/${resource.max}` : '')}
                  </div>
                </div>
              </div>

              {/* Resource Name */}
              <div className="text-sm font-medium text-purple-200 text-center">
                {resource.name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
