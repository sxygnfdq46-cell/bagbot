'use client';

import { useState, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { MetricCard } from '@/components/neon/MetricCard';
import { StatusIndicator } from '@/components/neon/StatusIndicator';
import { Plug, CheckCircle, XCircle, RefreshCw, Settings } from 'lucide-react';

interface MarketAdapter {
  id: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'options';
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastUpdate: string;
  latency: number;
  symbolsTracked: number;
  dataPoints: number;
  errorRate: number;
}

export default function MarketAdaptersPage() {
  const [adapters, setAdapters] = useState<MarketAdapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdapters();
    const interval = setInterval(fetchAdapters, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdapters = async () => {
    try {
      const response = await fetch('/api/market/adapters');
      const data = await response.json();
      setAdapters(data.adapters || mockAdapters);
    } catch (error) {
      console.error('Failed to fetch adapters:', error);
      setAdapters(mockAdapters);
    } finally {
      setLoading(false);
    }
  };

  const reconnectAdapter = async (adapterId: string) => {
    try {
      await fetch(`/api/market/adapters/${adapterId}/reconnect`, {
        method: 'POST'
      });
      fetchAdapters();
    } catch (error) {
      console.error('Failed to reconnect adapter:', error);
    }
  };

  const connectedCount = adapters.filter(a => a.status === 'connected').length;
  const avgLatency = adapters.length > 0
    ? (adapters.reduce((sum, a) => sum + a.latency, 0) / adapters.length).toFixed(0)
    : '0';

  const statusVariant = (status: string): 'online' | 'offline' | 'warning' | 'loading' => {
    switch (status) {
      case 'connected': return 'online';
      case 'disconnected': return 'offline';
      case 'error': return 'offline';
      case 'connecting': return 'loading';
      default: return 'offline';
    }
  };

  const typeColors: Record<string, 'cyan' | 'magenta' | 'green' | 'yellow'> = {
    stock: 'cyan',
    crypto: 'magenta',
    forex: 'green',
    options: 'yellow'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Market Adapters</h1>
        <p className="text-gray-400">Real-time market data connectors and feeds</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Connected Adapters"
          value={`${connectedCount}/${adapters.length}`}
          subtitle="Active connections"
          icon={<Plug />}
          glow="green"
        />
        
        <MetricCard
          title="Avg Latency"
          value={`${avgLatency}ms`}
          subtitle="Response time"
          icon={<RefreshCw />}
          glow="cyan"
        />
        
        <MetricCard
          title="Symbols Tracked"
          value={adapters.reduce((sum, a) => sum + a.symbolsTracked, 0)}
          subtitle="Across all adapters"
          glow="magenta"
        />
        
        <MetricCard
          title="Data Points/min"
          value={adapters.reduce((sum, a) => sum + a.dataPoints, 0)}
          subtitle="Real-time throughput"
          glow="yellow"
        />
      </div>

      {/* Adapter Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-20 text-gray-500">
            <div className="animate-spin-slow w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading adapters...</p>
          </div>
        ) : adapters.map(adapter => (
          <NeonCard 
            key={adapter.id}
            glow={typeColors[adapter.type]}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-white">{adapter.name}</h3>
                    <NeonBadge 
                      variant={typeColors[adapter.type]}
                      size="sm"
                    >
                      {adapter.type.toUpperCase()}
                    </NeonBadge>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIndicator 
                      status={statusVariant(adapter.status)}
                      label={adapter.status.toUpperCase()}
                      size="sm"
                      showPulse={adapter.status === 'connected'}
                    />
                    <span className="text-sm text-gray-500">
                      {new Date(adapter.lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {adapter.status === 'connected' ? (
                  <CheckCircle className="w-8 h-8 text-neon-green" />
                ) : adapter.status === 'error' ? (
                  <XCircle className="w-8 h-8 text-red-400" />
                ) : (
                  <Plug className="w-8 h-8 text-gray-600" />
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Latency</p>
                  <p className={`text-lg font-bold ${
                    adapter.latency < 100 ? 'text-neon-green' :
                    adapter.latency < 200 ? 'text-neon-yellow' : 'text-red-400'
                  }`}>
                    {adapter.latency}ms
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Symbols</p>
                  <p className="text-lg font-bold text-neon-cyan">
                    {adapter.symbolsTracked}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Data Points</p>
                  <p className="text-lg font-bold text-neon-magenta">
                    {adapter.dataPoints}/min
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Error Rate</p>
                  <p className={`text-lg font-bold ${
                    adapter.errorRate < 1 ? 'text-neon-green' :
                    adapter.errorRate < 5 ? 'text-neon-yellow' : 'text-red-400'
                  }`}>
                    {adapter.errorRate.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Status Details */}
              {adapter.status === 'error' && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">
                    Connection error: Failed to establish connection
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {adapter.status === 'disconnected' || adapter.status === 'error' ? (
                  <NeonButton
                    variant="primary"
                    size="sm"
                    onClick={() => reconnectAdapter(adapter.id)}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reconnect
                  </NeonButton>
                ) : (
                  <NeonButton variant="secondary" size="sm">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </NeonButton>
                )}
                <NeonButton variant="secondary" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  Configure
                </NeonButton>
              </div>
            </div>
          </NeonCard>
        ))}
      </div>

      {/* Connection Health */}
      <div className="mt-6">
        <NeonCard glow="cyan">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Connection Health</h2>
            <div className="space-y-3">
              {adapters.map(adapter => (
                <div key={adapter.id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded">
                  <div className="flex items-center gap-3">
                    <StatusIndicator 
                      status={statusVariant(adapter.status)}
                      size="sm"
                      showPulse={adapter.status === 'connected'}
                    />
                    <span className="text-white font-medium">{adapter.name}</span>
                    <NeonBadge variant={typeColors[adapter.type]} size="sm">
                      {adapter.type}
                    </NeonBadge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">{adapter.latency}ms</span>
                    <span className={
                      adapter.errorRate < 1 ? 'text-neon-green' :
                      adapter.errorRate < 5 ? 'text-neon-yellow' : 'text-red-400'
                    }>
                      {adapter.errorRate.toFixed(1)}% errors
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  );
}

// Mock data
const mockAdapters: MarketAdapter[] = [
  {
    id: '1',
    name: 'Alpaca Markets',
    type: 'stock',
    status: 'connected',
    lastUpdate: new Date().toISOString(),
    latency: 45,
    symbolsTracked: 250,
    dataPoints: 1200,
    errorRate: 0.3
  },
  {
    id: '2',
    name: 'Binance',
    type: 'crypto',
    status: 'connected',
    lastUpdate: new Date().toISOString(),
    latency: 78,
    symbolsTracked: 180,
    dataPoints: 2400,
    errorRate: 0.8
  },
  {
    id: '3',
    name: 'Interactive Brokers',
    type: 'options',
    status: 'connected',
    lastUpdate: new Date().toISOString(),
    latency: 92,
    symbolsTracked: 125,
    dataPoints: 850,
    errorRate: 1.2
  },
  {
    id: '4',
    name: 'FOREX.com',
    type: 'forex',
    status: 'error',
    lastUpdate: new Date(Date.now() - 120000).toISOString(),
    latency: 320,
    symbolsTracked: 50,
    dataPoints: 0,
    errorRate: 12.5
  }
];
