'use client';

import { useEffect, useState } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { MetricCard } from '@/components/neon/MetricCard';
import { ReactorCore } from '@/components/neon/ReactorCore';
import { DataStream } from '@/components/neon/DataStream';
import { StatusIndicator } from '@/components/neon/StatusIndicator';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { AlertPanel } from '@/components/neon/AlertPanel';
import { useMarketData } from '@/hooks/useMarketData';
import { useRealTimeSignals } from '@/hooks/useRealTimeSignals';
import { useRiskEvents } from '@/hooks/useRiskEvents';
import { TrendingUp, DollarSign, Activity, AlertTriangle, Zap, Brain } from 'lucide-react';

interface SystemStatus {
  brain: 'active' | 'idle' | 'warning' | 'error';
  trading: 'active' | 'idle' | 'warning' | 'error';
  risk: 'active' | 'idle' | 'warning' | 'error';
  market: 'active' | 'idle' | 'warning' | 'error';
}

export default function DashboardPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    brain: 'active',
    trading: 'active',
    risk: 'active',
    market: 'active'
  });
  
  const [metrics, setMetrics] = useState({
    totalPnL: '+$12,450.32',
    dailyPnL: '+$1,234.56',
    winRate: '68.4%',
    activePositions: 7,
    signalsToday: 23,
    riskLevel: 'MODERATE'
  });

  const marketData = useMarketData(['AAPL', 'TSLA', 'NVDA']);
  const signals = useRealTimeSignals(10);
  const riskEvents = useRiskEvents(5);

  // Fetch system metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/brain/status');
        const data = await response.json();
        
        setSystemStatus({
          brain: data.brain_active ? 'active' : 'idle',
          trading: data.trading_active ? 'active' : 'idle',
          risk: data.risk_active ? 'active' : 'idle',
          market: data.market_connected ? 'active' : 'warning'
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const streamItems = signals.map(signal => ({
    id: signal.id,
    timestamp: signal.timestamp,
    type: signal.signal === 'BUY' ? 'buy' as const : signal.signal === 'SELL' ? 'sell' as const : 'info' as const,
    message: `${signal.strategy}: ${signal.signal} ${signal.symbol}`,
    value: `${(signal.confidence * 100).toFixed(0)}%`
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              AI Command Center
            </h1>
            <p className="text-gray-400">Real-time autonomous trading system dashboard</p>
          </div>
          
          <ReactorCore size="lg" status={systemStatus.brain} showRings />
        </div>

        {/* System Status Bar */}
        <NeonCard glow="cyan" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-neon-cyan" />
                <span className="text-sm text-gray-300">AI Brain</span>
                <StatusIndicator status={systemStatus.brain === 'active' ? 'online' : 'offline'} size="sm" />
              </div>
              
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-neon-magenta" />
                <span className="text-sm text-gray-300">Trading Engine</span>
                <StatusIndicator status={systemStatus.trading === 'active' ? 'online' : 'offline'} size="sm" />
              </div>
              
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-neon-yellow" />
                <span className="text-sm text-gray-300">Risk Monitor</span>
                <StatusIndicator status={systemStatus.risk === 'active' ? 'online' : 'offline'} size="sm" />
              </div>
              
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-neon-green" />
                <span className="text-sm text-gray-300">Market Feed</span>
                <StatusIndicator status={systemStatus.market === 'active' ? 'online' : 'warning'} size="sm" />
              </div>
            </div>

            <NeonBadge variant="green" pulse>
              SYSTEM OPERATIONAL
            </NeonBadge>
          </div>
        </NeonCard>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total P&L"
          value={metrics.totalPnL}
          subtitle="All-time performance"
          trend="up"
          trendValue="+12.4%"
          icon={<DollarSign />}
          glow="green"
        />
        
        <MetricCard
          title="Today's P&L"
          value={metrics.dailyPnL}
          subtitle="Last 24 hours"
          trend="up"
          trendValue="+3.2%"
          icon={<TrendingUp />}
          glow="cyan"
        />
        
        <MetricCard
          title="Win Rate"
          value={metrics.winRate}
          subtitle={`${metrics.activePositions} active positions`}
          icon={<Activity />}
          glow="magenta"
        />
        
        <MetricCard
          title="Signals Today"
          value={metrics.signalsToday}
          subtitle="AI-generated signals"
          icon={<Zap />}
          glow="yellow"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Signal Stream */}
        <div className="lg:col-span-2">
          <NeonCard glow="cyan" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Live Signal Stream</h2>
              <NeonBadge variant="cyan">{signals.length} recent</NeonBadge>
            </div>
            <DataStream 
              items={streamItems}
              maxItems={10}
              autoScroll
            />
          </NeonCard>
        </div>

        {/* Risk Alerts */}
        <div>
          <NeonCard glow="yellow" className="h-full">
            <h2 className="text-xl font-bold text-white mb-4">Risk Alerts</h2>
            <div className="space-y-3">
              {riskEvents.length > 0 ? (
                riskEvents.map(event => (
                  <AlertPanel
                    key={event.id}
                    title={event.type.replace('_', ' ').toUpperCase()}
                    message={event.message}
                    type={event.severity === 'critical' || event.severity === 'high' ? 'error' : 'warning'}
                    timestamp={new Date(event.timestamp).toLocaleTimeString()}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active risk alerts</p>
                </div>
              )}
            </div>
          </NeonCard>
        </div>
      </div>

      {/* Market Overview */}
      <div className="mt-6">
        <NeonCard glow="magenta">
          <h2 className="text-xl font-bold text-white mb-4">Market Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(marketData).map(([symbol, data]) => (
              <div key={symbol} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-white">{symbol}</span>
                  <NeonBadge 
                    variant={data.change >= 0 ? 'green' : 'red'}
                    size="sm"
                  >
                    {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                  </NeonBadge>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${data.price.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">
                  Vol: {(data.volume / 1000000).toFixed(1)}M
                </div>
              </div>
            ))}
          </div>
        </NeonCard>
      </div>
    </div>
  );
}
