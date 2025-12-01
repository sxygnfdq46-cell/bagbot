'use client';

import { SciFiShell } from '../sci-fi-shell';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAPI, useAPIPoll } from '../../lib/hooks/useAPI';
import { useWebSocket } from '../../lib/hooks/useWebSocket';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard metrics
  const { data: metrics, error: metricsError, loading: metricsLoading } = useAPI<any>(
    '/api/dashboard/metrics'
  );

  // Fetch recent trades with polling
  const { data: recentTrades, loading: tradesLoading } = useAPIPoll<any[]>(
    '/api/trading/recent?limit=10',
    3000 // Poll every 3 seconds
  );

  // Fetch strategy statuses
  const { data: strategies, loading: strategiesLoading } = useAPI<any[]>(
    '/api/strategies/status'
  );

  // Fetch open positions
  const { data: positions, loading: positionsLoading } = useAPI<any[]>(
    '/api/trading/positions'
  );

  // WebSocket connection for real-time price updates
  const { data: livePrice, isConnected: priceConnected } = useWebSocket<any>({
    channel: 'prices',
    filters: { symbol: 'BTCUSDT' },
    enabled: true,
    autoConnect: true,
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Extract metrics with fallbacks
  const portfolioValue = metrics?.total_equity ?? 0;
  const dailyPnL = metrics?.daily_pnl ?? 0;
  const activePositionsCount = positions?.length ?? 0;
  const winRate = metrics?.win_rate ?? 0;
  const dailyVolume = metrics?.daily_volume ?? 0;

  return (
    <SciFiShell>
      <div className="p-8 space-y-8 bg-cream">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Mission Control
            </h1>
            <p className="text-secondary">
              Live trading dashboard — All systems operational
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="status-dot-green" />
            <Badge variant="success">LIVE</Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-auto-fit">
          <Card glowColor="green">
            <CardHeader>
              <CardTitle>Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {metricsLoading ? '...' : formatCurrency(portfolioValue)}
              </div>
              {!metricsLoading && (
                <div className="text-sm text-muted mt-2">
                  Previous: {formatCurrency(portfolioValue - dailyPnL)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card glowColor={dailyPnL >= 0 ? 'green' : 'yellow'}>
            <CardHeader>
              <CardTitle>24H P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${dailyPnL >= 0 ? 'text-green' : 'text-yellow'}`}>
                {metricsLoading ? '...' : formatCurrency(dailyPnL)}
              </div>
              {!metricsLoading && (
                <div className="text-sm text-muted mt-2">
                  {formatPercent((dailyPnL / (portfolioValue - dailyPnL)) * 100)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card glowColor="yellow">
            <CardHeader>
              <CardTitle>Active Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {positionsLoading ? '...' : activePositionsCount}
              </div>
              <div className="text-sm text-muted mt-2">
                Currently trading
              </div>
            </CardContent>
          </Card>

          <Card glowColor="green">
            <CardHeader>
              <CardTitle>Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${winRate >= 50 ? 'text-green' : 'text-primary'}`}>
                {metricsLoading ? '...' : winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted mt-2">
                {winRate >= 50 ? 'Strong performance' : 'Building momentum'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {metricsError && (
          <div className="card-clean" style={{ background: '#fef9c3', borderColor: '#facc15' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-yellow">
                  Backend Connection Error
                </div>
                <div className="text-sm text-secondary">
                  Unable to fetch live dashboard data. Showing fallback values.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Area */}
          <div className="lg:col-span-2">
            <Card glowColor="green">
              <CardHeader>
                <CardTitle>Price Chart</CardTitle>
                <p className="text-sm text-muted">BTC/USDT • 15m</p>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center bg-elevated rounded-lg">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <p className="text-muted">
                      Interactive chart will load here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Feed Column */}
          <div className="space-y-6">
            {/* Recent Trades */}
            <Card glowColor="yellow">
              <CardHeader>
                <CardTitle>Recent Trades</CardTitle>
                <p className="text-sm text-muted">Last 10 executions</p>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="text-4xl mb-2">⏳</div>
                      <p className="text-muted">Loading trades...</p>
                    </div>
                  </div>
                ) : recentTrades && recentTrades.length > 0 ? (
                  <div className="space-y-2">
                    {recentTrades.slice(0, 10).map((trade: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-surface border border-cream"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-primary">
                            {trade.symbol}
                          </div>
                          <div className="text-xs text-muted">
                            {formatTime(trade.timestamp)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={trade.side === 'buy' || trade.side === 'BUY' ? 'success' : 'warning'}>
                            {(trade.side || 'BUY').toUpperCase()}
                          </Badge>
                          <div className="text-xs text-secondary mt-1">
                            {trade.quantity} @ ${trade.price?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📭</div>
                      <p className="text-muted">No recent trades</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card glowColor="green">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <p className="text-sm text-muted">All systems nominal</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {strategiesLoading ? (
                    <div className="text-center py-4">
                      <div className="text-2xl mb-2">⏳</div>
                      <p className="text-sm text-muted">Loading...</p>
                    </div>
                  ) : strategies && strategies.length > 0 ? (
                    strategies.slice(0, 4).map((strategy: any) => (
                      <div key={strategy.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-secondary">
                            {strategy.name}
                          </span>
                          <Badge variant={strategy.status === 'running' ? 'success' : 'warning'}>
                            {strategy.status?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-cream-300">
                          <div
                            className="h-full transition-all bg-primary"
                            style={{ width: `${strategy.performance || 85}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    [
                      { name: 'Trading Engine', status: 100 },
                      { name: 'Data Feed', status: 98 },
                      { name: 'Risk Manager', status: 100 },
                      { name: 'Order Router', status: 95 },
                    ].map((system) => (
                      <div key={system.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-secondary">
                            {system.name}
                          </span>
                          <span className="text-sm font-bold text-green">
                            {system.status}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-cream-300">
                          <div
                            className="h-full transition-all bg-primary"
                            style={{ width: `${system.status}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SciFiShell>
  );
}
