'use client';

import { useEffect, useState } from 'react';
import { getBotStatus, getLiveMetrics, startBot, stopBot, BotStatus, BotMetrics } from '@/services/bot';
import { botWebSocket, BotEventType } from '@/lib/websocket-client';
import { APIError } from '@/lib/api-client';
import { apiClient } from '@/lib/api-client';

export default function BotDashboardPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch initial data
  useEffect(() => {
    loadData();
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const token = apiClient.tokens.getToken();
    
    botWebSocket.connect(token || undefined).catch(err => {
      console.error('WebSocket connection failed:', err);
    });

    const unsubscribeConnection = botWebSocket.onConnectionChange(setWsConnected);

    // Subscribe to bot events
    const unsubscribeStatus = botWebSocket.on('status_update', (data) => {
      setStatus(prev => ({ ...prev, ...data }));
    });

    const unsubscribeMetrics = botWebSocket.on('metrics_update', (data) => {
      setMetrics(prev => ({ ...prev, ...data }));
    });

    return () => {
      unsubscribeConnection();
      unsubscribeStatus();
      unsubscribeMetrics();
      botWebSocket.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [statusData, metricsData] = await Promise.all([
        getBotStatus(),
        getLiveMetrics()
      ]);
      setStatus(statusData);
      setMetrics(metricsData);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('Failed to load bot data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartBot = async () => {
    try {
      setActionLoading(true);
      await startBot({ mode: 'paper' });
      await loadData();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopBot = async () => {
    try {
      setActionLoading(true);
      await stopBot();
      await loadData();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Bot Dashboard</h1>
            <p className="text-gray-400 mt-1">Real-time trading bot status and metrics</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              wsConnected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
            }`}>
              {wsConnected ? '● Connected' : '○ Disconnected'}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300">
            {error}
          </div>
        )}

        {/* Status Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Bot Status</h2>
            <div className="flex gap-3">
              {status?.running ? (
                <button
                  onClick={handleStopBot}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                >
                  {actionLoading ? 'Stopping...' : 'Stop Bot'}
                </button>
              ) : (
                <button
                  onClick={handleStartBot}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                >
                  {actionLoading ? 'Starting...' : 'Start Bot'}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Status</p>
              <p className={`text-lg font-bold mt-1 ${
                status?.running ? 'text-green-400' : 'text-red-400'
              }`}>
                {status?.running ? 'Running' : 'Stopped'}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Mode</p>
              <p className="text-lg font-bold text-white mt-1 uppercase">
                {status?.mode || 'N/A'}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Health</p>
              <p className={`text-lg font-bold mt-1 capitalize ${
                status?.health === 'healthy' ? 'text-green-400' :
                status?.health === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {status?.health || 'Unknown'}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Open Positions</p>
              <p className="text-lg font-bold text-white mt-1">
                {status?.open_positions || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Performance Metrics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Total P&L</p>
              <p className={`text-2xl font-bold mt-1 ${
                (metrics?.pnl_total || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${(metrics?.pnl_total || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Today's P&L</p>
              <p className={`text-2xl font-bold mt-1 ${
                (metrics?.pnl_today || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${(metrics?.pnl_today || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {((metrics?.win_rate || 0) * 100).toFixed(1)}%
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Total Trades</p>
              <p className="text-2xl font-bold text-white mt-1">
                {metrics?.total_trades || 0}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(metrics?.sharpe_ratio || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {((metrics?.max_drawdown || 0) * 100).toFixed(2)}%
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Winning Trades</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                {metrics?.winning_trades || 0}
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-gray-400 text-sm">Losing Trades</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {metrics?.losing_trades || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Active Strategies */}
        {status?.active_strategies && status.active_strategies.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Active Strategies</h2>
            <div className="flex flex-wrap gap-2">
              {status.active_strategies.map((strategy, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 text-sm"
                >
                  {strategy}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
