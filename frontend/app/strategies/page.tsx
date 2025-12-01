'use client';

import { SciFiShell } from '../sci-fi-shell';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAPI, useAPIMutation } from '../../lib/hooks/useAPI';
import { useState } from 'react';

export default function StrategiesPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch strategies list
  const { data: strategiesData, loading: strategiesLoading, refetch } = useAPI<any[]>('/api/strategies');

  // Strategy action mutations
  const startStrategy = useAPIMutation('/api/strategies/start', 'POST');
  const stopStrategy = useAPIMutation('/api/strategies/stop', 'POST');
  const pauseStrategy = useAPIMutation('/api/strategies/pause', 'POST');

  // Handle strategy actions
  const handleStrategyAction = async (strategyId: string, action: 'start' | 'stop' | 'pause') => {
    setActionLoading(strategyId);
    try {
      if (action === 'start') await startStrategy({ strategy_id: strategyId });
      else if (action === 'stop') await stopStrategy({ strategy_id: strategyId });
      else if (action === 'pause') await pauseStrategy({ strategy_id: strategyId });
      await refetch();
    } catch (error) {
      console.error('Strategy action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const strategies = strategiesData ?? [
    {
      id: 'demo1',
      name: 'Neural Momentum Alpha',
      status: 'active',
      profit24h: '+$4,821',
      winRate: '78.4%',
      positions: 5,
      risk: 'LOW',
    },
    {
      id: 'demo2',
      name: 'Mean Reversion Pro',
      status: 'active',
      profit24h: '+$3,247',
      winRate: '81.2%',
      positions: 3,
      risk: 'MEDIUM',
    },
    {
      id: 'demo3',
      name: 'Breakout Hunter',
      status: 'active',
      profit24h: '+$2,891',
      winRate: '71.8%',
      positions: 4,
      risk: 'HIGH',
    },
    {
      id: 'demo4',
      name: 'Grid Trading Bot',
      status: 'paused',
      profit24h: '+$1,456',
      winRate: '88.9%',
      positions: 0,
      risk: 'LOW',
    },
  ];

  return (
    <SciFiShell>
      <div className="p-8 space-y-8 bg-cream">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              Strategy Arsenal
            </h1>
            <p className="text-secondary">
              Manage and monitor your algorithmic trading strategies
            </p>
          </div>
          <button className="btn-primary">
            + Deploy New Strategy
          </button>
        </div>

        {/* Strategy Stats */}
        <div className="grid-auto-fit">
          {[
            { label: 'Active Strategies', value: '3', variant: 'success' },
            { label: 'Total Positions', value: '12', variant: 'info' },
            { label: '24H Combined P&L', value: '+$11,959', variant: 'success' },
            { label: 'Avg Win Rate', value: '79.8%', variant: 'info' },
          ].map((stat) => (
            <Card key={stat.label} glowColor="green">
              <CardContent className="pt-6">
                <div className="text-sm mb-2 text-muted">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Strategies List */}
        <div className="space-y-4">
          {strategies.map((strategy: any) => (
            <Card
              key={strategy.id}
              glowColor={strategy.status === 'active' || strategy.status === 'running' ? 'green' : 'yellow'}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  {/* Left: Strategy Info */}
                  <div className="flex items-center gap-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2 text-primary">
                        {strategy.name}
                      </h3>
                      <div className="flex items-center gap-4">
                        <Badge variant={strategy.status === 'active' ? 'success' : 'warning'}>
                          {strategy.status.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-secondary">
                          Risk: <span className={`font-semibold ${
                            strategy.risk === 'LOW' ? 'text-green' : 
                            strategy.risk === 'MEDIUM' ? 'text-yellow' : 
                            'text-red-500'
                          }`}>
                            {strategy.risk}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Metrics */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-sm mb-1 text-muted">
                        24H P&L
                      </div>
                      <div className="text-xl font-bold text-green">
                        {strategy.profit24h}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm mb-1 text-muted">
                        Win Rate
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {strategy.winRate}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm mb-1 text-muted">
                        Positions
                      </div>
                      <div className="text-xl font-bold text-yellow">
                        {strategy.positions}
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center gap-4">
                    <button
                      className={`btn-${strategy.status === 'active' ? 'accent' : 'primary'} transition-smooth`}
                      onClick={() => {
                        const action = strategy.status === 'active' || strategy.status === 'running' ? 'pause' : 'start';
                        handleStrategyAction(strategy.id, action);
                      }}
                      disabled={actionLoading === strategy.id}
                    >
                      {actionLoading === strategy.id ? '⏳' : strategy.status === 'active' ? 'Pause' : 'Start'}
                    </button>
                    <button className="btn-outline">
                      ⚙️
                    </button>
                    <button className="btn-outline">
                      📊
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Strategy Performance Chart */}
        <Card glowColor="green">
          <CardHeader>
            <CardTitle>Combined Performance</CardTitle>
            <p className="text-sm text-muted">Last 7 days</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-elevated rounded-lg">
              <div className="text-center">
                <div className="text-6xl mb-4">📈</div>
                <p className="text-muted">
                  Performance chart visualization will load here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SciFiShell>
  );
}
