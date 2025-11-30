'use client';

import { useState, useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * EXECUTION QUEUE VIEW — Level 17.4 Module
 * ═══════════════════════════════════════════════════════════════════
 * Displays task queue with 4D metadata and status tracking
 * 
 * Features:
 * - 4D task metadata (Time / Scope / Impact / Mode)
 * - Manual override capability
 * - Status indicators (Ready / Waiting / Requires Approval / Blocked)
 * - Priority visualization
 * ═══════════════════════════════════════════════════════════════════
 */

interface QueueTask {
  id: string;
  name: string;
  status: 'ready' | 'waiting' | 'requires-approval' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    time: string; // Estimated completion time
    scope: string; // Affected systems
    impact: string; // Risk level
    mode: string; // Execution mode
  };
  progress: number; // 0-100
  timestamp: number; // Unix timestamp for time-reversal
  completedAt?: number; // When task completed
}

export default function ExecutionQueueView() {
  const [timeOffset, setTimeOffset] = useState(0); // Time-reversal offset in minutes
  const [tasks, setTasks] = useState<QueueTask[]>([
    {
      id: 'task-1',
      name: 'Memory consolidation batch',
      status: 'ready',
      priority: 'high',
      metadata: {
        time: '2.3s',
        scope: 'Memory Layer',
        impact: 'Low',
        mode: 'Auto'
      },
      progress: 75,
      timestamp: Date.now()
    },
    {
      id: 'task-2',
      name: 'Emotional state recalibration',
      status: 'waiting',
      priority: 'medium',
      metadata: {
        time: '1.8s',
        scope: 'Emotional Engine',
        impact: 'Medium',
        mode: 'Supervised'
      },
      progress: 0,
      timestamp: Date.now() - 120000 // 2 min ago
    },
    {
      id: 'task-3',
      name: 'Risk assessment update',
      status: 'requires-approval',
      priority: 'critical',
      metadata: {
        time: '0.5s',
        scope: 'Risk Manager',
        impact: 'High',
        mode: 'Manual'
      },
      progress: 0,
      timestamp: Date.now() - 300000 // 5 min ago
    },
    {
      id: 'task-4',
      name: 'Pattern analysis cycle',
      status: 'ready',
      priority: 'low',
      metadata: {
        time: '5.2s',
        scope: 'Pattern Detector',
        impact: 'Low',
        mode: 'Auto'
      },
      progress: 25,
      timestamp: Date.now() - 600000, // 10 min ago
      completedAt: Date.now() - 480000 // Completed 8 min ago
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === 'ready' && task.progress < 100) {
          return { ...task, progress: Math.min(100, task.progress + Math.random() * 15) };
        }
        return task;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: QueueTask['status']) => {
    switch (status) {
      case 'ready': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'waiting': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
      case 'requires-approval': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'blocked': return 'text-red-400 bg-red-500/20 border-red-500/40';
    }
  };

  const getPriorityColor = (priority: QueueTask['priority']) => {
    switch (priority) {
      case 'low': return 'text-gray-400';
      case 'medium': return 'text-blue-400';
      case 'high': return 'text-orange-400';
      case 'critical': return 'text-red-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-purple-400';
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp + (timeOffset * 60000);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  };

  const filteredTasks = tasks.filter(task => {
    const taskTime = Date.now() - task.timestamp + (timeOffset * 60000);
    return taskTime >= 0; // Only show tasks within time window
  });

  return (
    <div className="space-y-4">
      {/* Time-Reversal Slider */}
      <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-4 time-reversal-panel">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-purple-300 flex items-center gap-2">
            <span>⏮️</span>
            <span>Time Reversal</span>
          </div>
          <div className="text-xs text-purple-400">
            {timeOffset === 0 ? 'Live' : `${timeOffset}m ago`}
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="60"
          value={timeOffset}
          onChange={(e) => setTimeOffset(parseInt(e.target.value))}
          className="time-slider w-full"
        />
        <div className="flex justify-between text-xs text-purple-500 mt-1">
          <span>Now</span>
          <span>30m</span>
          <span>60m ago</span>
        </div>
      </div>
      {/* Queue Summary */}
      <div className="grid grid-cols-4 gap-2">
        {(['ready', 'waiting', 'requires-approval', 'blocked'] as const).map(status => (
          <div key={status} className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-2">
            <div className="text-xs text-purple-400 mb-1 capitalize">{status.replace('-', ' ')}</div>
            <div className="text-lg font-bold text-purple-200">
              {filteredTasks.filter(t => t.status === status).length}
            </div>
          </div>
        ))}
      </div>

      {/* Task Queue */}
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className={`bg-purple-950/20 border border-purple-800/30 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-240 ${
              task.completedAt ? 'opacity-70' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`text-xs font-bold uppercase ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.completedAt && (
                    <span className="text-xs text-green-400">✓ Completed</span>
                  )}
                </div>
                <div className="text-sm font-medium text-purple-200">{task.name}</div>
                <div className="text-xs text-purple-500 mt-1">
                  {formatTimeAgo(task.timestamp)}
                </div>
              </div>
            </div>

            {/* 4D Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-purple-950/30 rounded p-2">
                <div className="text-purple-400">⏱ Time</div>
                <div className="text-purple-200 font-medium">{task.metadata.time}</div>
              </div>
              <div className="bg-purple-950/30 rounded p-2">
                <div className="text-purple-400">📦 Scope</div>
                <div className="text-purple-200 font-medium truncate">{task.metadata.scope}</div>
              </div>
              <div className="bg-purple-950/30 rounded p-2">
                <div className="text-purple-400">⚠️ Impact</div>
                <div className={`font-medium ${getImpactColor(task.metadata.impact)}`}>
                  {task.metadata.impact}
                </div>
              </div>
              <div className="bg-purple-950/30 rounded p-2">
                <div className="text-purple-400">⚙️ Mode</div>
                <div className="text-purple-200 font-medium">{task.metadata.mode}</div>
              </div>
            </div>

            {/* Progress Bar */}
            {task.status === 'ready' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-purple-400">Progress</span>
                  <span className="text-purple-300">{task.progress.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-purple-950/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-300 transition-all duration-1000"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {task.status === 'requires-approval' && (
              <div className="flex gap-2 mt-3">
                <button className="flex-1 px-3 py-2 text-xs bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 transition-colors">
                  Approve
                </button>
                <button className="flex-1 px-3 py-2 text-xs bg-red-500/20 border border-red-500/50 text-red-400 rounded hover:bg-red-500/30 transition-colors">
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
