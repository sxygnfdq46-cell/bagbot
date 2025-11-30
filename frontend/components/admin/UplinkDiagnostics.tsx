'use client';

import { useState, useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * UPLINK DIAGNOSTICS — Level 17.4 Module
 * ═══════════════════════════════════════════════════════════════════
 * System connectivity and synchronization monitoring
 * 
 * Features:
 * - WebSocket connection health
 * - API latency tracking
 * - Cross-tab broadcast channel status
 * - Error packet logging
 * - Network performance metrics
 * ═══════════════════════════════════════════════════════════════════
 */

interface UplinkMetrics {
  websocket: {
    status: 'connected' | 'disconnected' | 'reconnecting';
    uptime: string;
    latency: number;
    messages: number;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    successRate: number;
    requests: number;
  };
  broadcast: {
    status: 'active' | 'inactive';
    channels: number;
    synced: number;
    conflicts: number;
  };
  recovery: {
    systemStatus: 'operational' | 'recovering' | 'degraded';
    lastRecovery: string;
    autoRecoveryEnabled: boolean;
    recoveryAttempts: number;
  };
  syncPackets: Array<{
    id: string;
    timestamp: string;
    source: string;
    size: number; // bytes
    status: 'synced' | 'pending' | 'failed';
  }>;
  errors: Array<{
    id: string;
    timestamp: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export default function UplinkDiagnostics() {
  const [metrics, setMetrics] = useState<UplinkMetrics>({
    websocket: {
      status: 'connected',
      uptime: '47d 12h',
      latency: 23,
      messages: 15847
    },
    api: {
      status: 'healthy',
      latency: 145,
      successRate: 99.7,
      requests: 28934
    },
    broadcast: {
      status: 'active',
      channels: 4,
      synced: 3,
      conflicts: 0
    },
    recovery: {
      systemStatus: 'operational',
      lastRecovery: '3h ago',
      autoRecoveryEnabled: true,
      recoveryAttempts: 0
    },
    syncPackets: [],
    errors: []
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        websocket: {
          ...prev.websocket,
          latency: Math.max(5, Math.min(100, prev.websocket.latency + (Math.random() * 10 - 5))),
          messages: prev.websocket.messages + Math.floor(Math.random() * 5)
        },
        api: {
          ...prev.api,
          latency: Math.max(50, Math.min(500, prev.api.latency + (Math.random() * 50 - 25))),
          requests: prev.api.requests + Math.floor(Math.random() * 10)
        }
      }));

      // Occasionally add sync packets
      if (Math.random() > 0.7) {
        const sources = ['WebSocket', 'API', 'Broadcast', 'Storage'];
        const statuses: Array<'synced' | 'pending' | 'failed'> = ['synced', 'synced', 'pending', 'failed'];
        
        setMetrics(prev => ({
          ...prev,
          syncPackets: [
            {
              id: `sync-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              source: sources[Math.floor(Math.random() * sources.length)],
              size: Math.floor(Math.random() * 5000) + 100,
              status: statuses[Math.floor(Math.random() * statuses.length)]
            },
            ...prev.syncPackets.slice(0, 9) // Keep last 10
          ]
        }));
      }

      // Occasionally add error packets
      if (Math.random() > 0.85) {
        const errorTypes = ['Network timeout', 'API rate limit', 'Parse error', 'Connection reset'];
        const severities: Array<'low' | 'medium' | 'high'> = ['low', 'low', 'medium', 'high'];
        
        setMetrics(prev => ({
          ...prev,
          errors: [
            {
              id: `error-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
              message: 'Temporary connectivity issue detected',
              severity: severities[Math.floor(Math.random() * severities.length)]
            },
            ...prev.errors.slice(0, 9) // Keep last 10 errors
          ]
        }));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'active':
        return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'reconnecting':
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'disconnected':
      case 'down':
      case 'inactive':
        return 'text-red-400 bg-red-500/20 border-red-500/40';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/40';
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-red-400 bg-red-500/20';
    }
  };

  const getLatencyColor = (latency: number, threshold: number) => {
    if (latency < threshold * 0.5) return 'text-green-400';
    if (latency < threshold) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WebSocket */}
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔌</span>
              <span className="text-sm font-medium text-purple-200">WebSocket</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(metrics.websocket.status)}`}>
              {metrics.websocket.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">Uptime</span>
              <span className="text-purple-200 font-medium">{metrics.websocket.uptime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Latency</span>
              <span className={`font-medium ${getLatencyColor(metrics.websocket.latency, 50)}`}>
                {metrics.websocket.latency}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Messages</span>
              <span className="text-purple-200 font-medium">{metrics.websocket.messages.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* API */}
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              <span className="text-sm font-medium text-purple-200">API</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(metrics.api.status)}`}>
              {metrics.api.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">Latency</span>
              <span className={`font-medium ${getLatencyColor(metrics.api.latency, 300)}`}>
                {metrics.api.latency}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Success Rate</span>
              <span className="text-green-400 font-medium">{metrics.api.successRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Requests</span>
              <span className="text-purple-200 font-medium">{metrics.api.requests.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Broadcast Channel */}
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📡</span>
              <span className="text-sm font-medium text-purple-200">Broadcast</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(metrics.broadcast.status)}`}>
              {metrics.broadcast.status}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-purple-400">Channels</span>
              <span className="text-purple-200 font-medium">{metrics.broadcast.channels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Synced</span>
              <span className="text-green-400 font-medium">{metrics.broadcast.synced}/{metrics.broadcast.channels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-400">Conflicts</span>
              <span className={`font-medium ${metrics.broadcast.conflicts > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {metrics.broadcast.conflicts}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery System Alerts */}
      <div className={`bg-purple-950/20 border rounded-lg p-4 recovery-system-panel ${
        metrics.recovery.systemStatus === 'operational' ? 'border-green-500/30' :
        metrics.recovery.systemStatus === 'recovering' ? 'border-yellow-500/40' :
        'border-red-500/40'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <h4 className="text-sm font-medium text-purple-200">Recovery System</h4>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase ${
            metrics.recovery.systemStatus === 'operational' ? 'text-green-400 bg-green-500/20 border-green-500/40' :
            metrics.recovery.systemStatus === 'recovering' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40' :
            'text-red-400 bg-red-500/20 border-red-500/40'
          }`}>
            {metrics.recovery.systemStatus}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="bg-purple-950/30 rounded p-2">
            <div className="text-xs text-purple-400 mb-1">Last Recovery</div>
            <div className="text-sm text-purple-200 font-medium">{metrics.recovery.lastRecovery}</div>
          </div>
          <div className="bg-purple-950/30 rounded p-2">
            <div className="text-xs text-purple-400 mb-1">Auto-Recovery</div>
            <div className={`text-sm font-medium ${metrics.recovery.autoRecoveryEnabled ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.recovery.autoRecoveryEnabled ? '✓ Enabled' : '✗ Disabled'}
            </div>
          </div>
          <div className="bg-purple-950/30 rounded p-2">
            <div className="text-xs text-purple-400 mb-1">Attempts (24h)</div>
            <div className={`text-sm font-medium ${
              metrics.recovery.recoveryAttempts === 0 ? 'text-green-400' :
              metrics.recovery.recoveryAttempts < 5 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {metrics.recovery.recoveryAttempts}
            </div>
          </div>
        </div>

        {metrics.recovery.systemStatus !== 'operational' && (
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded p-2 text-xs text-yellow-400">
            ⚠️ System attempting automatic recovery...
          </div>
        )}
      </div>

      {/* Sync Packets Log */}
      <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-purple-200">Sync Packets</h4>
          <span className="text-xs text-purple-400">Last 10 packets</span>
        </div>

        {metrics.syncPackets.length === 0 ? (
          <div className="text-center py-4 text-sm text-purple-500">
            No sync activity
          </div>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
            {metrics.syncPackets.map(packet => (
              <div key={packet.id} className="bg-purple-950/30 rounded p-2 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded border font-medium uppercase ${
                    packet.status === 'synced' ? 'text-green-400 bg-green-500/20 border-green-500/40' :
                    packet.status === 'pending' ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40' :
                    'text-red-400 bg-red-500/20 border-red-500/40'
                  }`}>
                    {packet.status}
                  </span>
                  <span className="text-purple-200 font-medium">{packet.source}</span>
                  <span className="text-purple-400 truncate">{(packet.size / 1000).toFixed(1)}KB</span>
                </div>
                <span className="text-purple-500 text-xs">{packet.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Packets Log */}
      <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-purple-200">Error Packets</h4>
          <span className="text-xs text-purple-400">{metrics.errors.length} total</span>
        </div>

        {metrics.errors.length === 0 ? (
          <div className="text-center py-8 text-sm text-purple-500">
            No errors detected
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {metrics.errors.map(error => (
              <div key={error.id} className="bg-purple-950/30 rounded p-3 text-xs">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${getSeverityColor(error.severity)}`}>
                      {error.severity}
                    </span>
                    <span className="text-purple-200 font-medium">{error.type}</span>
                  </div>
                  <span className="text-purple-500">{error.timestamp}</span>
                </div>
                <div className="text-purple-400">{error.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Performance Graph */}
      <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-purple-200 mb-3">Network Performance</h4>
        <div className="flex items-end gap-1 h-20">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="flex-1 bg-gradient-to-t from-purple-500 to-purple-300 rounded-t opacity-70"
              style={{ 
                height: `${30 + Math.random() * 70}%`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-purple-500 mt-2">
          <span>-40s</span>
          <span>-20s</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}
