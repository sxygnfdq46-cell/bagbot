'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { HoloButton } from '@/design-system/components/buttons/HoloButton';
import { NeonSwitch } from '@/design-system/components/inputs/NeonSwitch';
import { useTheme } from '../providers';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIMutation } from '@/lib/hooks/useAPI';
import { useState, useEffect } from 'react';
import { ParticleUniverse, QuantumField, HoloRefract } from '@/components/quantum/QuantumEffects';
import { AdaptiveHUD, GravityWarp } from '@/components/ascension/AscensionEffects';

export default function StrategiesPage() {
  const { theme } = useTheme();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dataUpdated, setDataUpdated] = useState(false);

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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return theme.colors.success;
      case 'MEDIUM': return theme.colors.warning;
      case 'HIGH': return theme.colors.error;
      default: return theme.text.secondary;
    }
  };

  return (
    <SciFiShell>
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
      <GravityWarp isEntering={true}>
      <HoloRefract>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <AnimatedText variant="breathe-cyan">
            <h1 
              className="text-4xl font-bold neon-text mb-2"
              style={{ color: theme.colors.neonCyan }}
            >
              Strategy Arsenal
            </h1>
            </AnimatedText>
            <p style={{ color: theme.text.tertiary }}>
              Manage and monitor your algorithmic trading strategies
            </p>
          </div>
          <HoloButton variant="primary" size="lg" className="hover-lift hover-glow transition-smooth">
            + Deploy New Strategy
          </HoloButton>
        </div>

        {/* Strategy Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Strategies', value: '3', color: 'success' },
            { label: 'Total Positions', value: '12', color: 'cyan' },
            { label: '24H Combined P&L', value: '+$11,959', color: 'success' },
            { label: 'Avg Win Rate', value: '79.8%', color: 'magenta' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="p-4 rounded glass-panel holo-border animate-fade-in-up"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${theme.border.default}`,
                animationDelay: `${0.1 + idx * 0.1}s`,
              }}
            >
              <div className="text-sm mb-1" style={{ color: theme.text.tertiary }}>
                {stat.label}
              </div>
              <div 
                className="text-2xl font-bold"
                style={{ color: theme.colors[stat.color as keyof typeof theme.colors] }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Strategies List */}
        <div className="space-y-4">
          {strategies.map((strategy: any, index: number) => (
            <AnimatedCard key={strategy.id || index} variant="pulse-cyan" delay={100 + index * 100}>
            <HoloCard
              glowColor={strategy.status === 'active' || strategy.status === 'running' ? 'cyan' : 'magenta'}
            >
              <div className="flex items-center justify-between">
                {/* Left: Strategy Info */}
                <div className="flex items-center gap-6">
                  <div>
                    <h3 
                      className="text-xl font-bold mb-1"
                      style={{ color: theme.text.primary }}
                    >
                      {strategy.name}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span 
                        className="px-3 py-1 rounded text-xs font-bold uppercase"
                        style={{ 
                          background: strategy.status === 'active' 
                            ? 'rgba(0, 255, 170, 0.2)' 
                            : 'rgba(255, 170, 0, 0.2)',
                          color: strategy.status === 'active' 
                            ? theme.colors.success 
                            : theme.colors.warning 
                        }}
                      >
                        {strategy.status}
                      </span>
                      <span 
                        className="text-sm"
                        style={{ color: theme.text.tertiary }}
                      >
                        Risk: <span style={{ color: getRiskColor(strategy.risk) }}>
                          {strategy.risk}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Metrics */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-sm mb-1" style={{ color: theme.text.tertiary }}>
                      24H P&L
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: theme.colors.success }}
                    >
                      {strategy.profit24h}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm mb-1" style={{ color: theme.text.tertiary }}>
                      Win Rate
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: theme.colors.neonCyan }}
                    >
                      {strategy.winRate}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm mb-1" style={{ color: theme.text.tertiary }}>
                      Positions
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: theme.colors.neonMagenta }}
                    >
                      {strategy.positions}
                    </div>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-4">
                  <NeonSwitch
                    checked={strategy.status === 'active' || strategy.status === 'running'}
                    onChange={() => {
                      const action = strategy.status === 'active' || strategy.status === 'running' ? 'pause' : 'start';
                      handleStrategyAction(strategy.id, action);
                    }}
                    size="md"
                  />
                  <HoloButton 
                    variant="ghost" 
                    size="sm" 
                    className="hover-lift transition-smooth"
                  >
                    {actionLoading === strategy.id ? '⏳' : '⚙️'}
                  </HoloButton>
                  <HoloButton variant="ghost" size="sm" className="hover-lift transition-smooth">
                    📊
                  </HoloButton>
                </div>
              </div>
            </HoloCard>
            </AnimatedCard>
          ))}
        </div>

        {/* Strategy Performance Chart */}
        <AnimatedCard variant="pulse-magenta" delay={300}>
        <HoloCard
          title="Combined Performance"
          subtitle="Last 7 days"
          glowColor="cyan"
        >
          <div 
            className="h-64 flex items-center justify-center rounded"
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📈</div>
              <p style={{ color: theme.text.tertiary }}>
                Performance chart visualization will load here
              </p>
            </div>
          </div>
        </HoloCard>
        </AnimatedCard>
      </div>
      </HoloRefract>
      </GravityWarp>
      </PageTransition>
    </SciFiShell>
  );
}
