'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { HoloButton } from '@/design-system/components/buttons/HoloButton';
import { GlassInput } from '@/design-system/components/inputs/GlassInput';
import { NeonTabs } from '@/design-system/components/tabs/NeonTabs';
import { useTheme } from '../providers';
import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIMutation } from '@/lib/hooks/useAPI';
import { ParticleUniverse, QuantumField, HoloRefract } from '@/components/quantum/QuantumEffects';
import { AdaptiveHUD, AuroraStream } from '@/components/ascension/AscensionEffects';

export default function BacktestPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('config');

  // Fetch backtest configs
  const { data: configs } = useAPI<any[]>('/api/backtest/configs');

  // Fetch recent backtest results
  const { data: results } = useAPI<any[]>('/api/backtest/results?limit=10');

  // Run backtest mutation
  const runBacktest = useAPIMutation('/api/backtest/run', 'POST');

  const handleRunBacktest = async (configId: string) => {
    try {
      await runBacktest({ config_id: configId });
    } catch (error) {
      console.error('Backtest failed:', error);
    }
  };

  return (
    <SciFiShell>
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
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
              Backtesting Lab
            </h1>
            </AnimatedText>
            <p style={{ color: theme.text.tertiary }}>
              Test strategies against historical data
            </p>
          </div>
          <HoloButton variant="primary" size="lg" className="hover-lift hover-glow transition-smooth">
            ▶ Run Backtest
          </HoloButton>
        </div>

        {/* Tabs */}
        <NeonTabs
          tabs={[
            { id: 'config', label: 'Configuration', icon: '⚙️' },
            { id: 'results', label: 'Results', icon: '📊' },
            { id: 'history', label: 'History', icon: '📜' },
          ]}
          defaultTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatedCard variant="pulse-cyan" delay={100}>
            <HoloCard title="Strategy Selection" subtitle="Choose strategy to test" glowColor="cyan">
              <div className="space-y-4">
                <GlassInput label="Strategy" value="Neural Momentum Alpha" />
                <GlassInput label="Trading Pair" value="BTC/USDT" />
                <GlassInput label="Timeframe" value="15m" />
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-magenta" delay={150}>
            <HoloCard title="Date Range" subtitle="Historical period" glowColor="magenta">
              <div className="space-y-4">
                <GlassInput label="Start Date" value="2024-01-01" type="date" />
                <GlassInput label="End Date" value="2024-11-26" type="date" />
                <div className="text-sm" style={{ color: theme.text.tertiary }}>
                  Duration: 330 days
                </div>
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-cyan" delay={200}>
            <HoloCard title="Capital Settings" subtitle="Initial conditions" glowColor="cyan">
              <div className="space-y-4">
                <GlassInput label="Initial Capital ($)" value="100000" />
                <GlassInput label="Position Size ($)" value="10000" />
                <GlassInput label="Commission (%)" value="0.1" />
              </div>
            </HoloCard>
            </AnimatedCard>

            <AnimatedCard variant="pulse-magenta" delay={250}>
            <HoloCard title="Risk Parameters" subtitle="Safety limits" glowColor="magenta">
              <div className="space-y-4">
                <GlassInput label="Stop Loss (%)" value="2" />
                <GlassInput label="Take Profit (%)" value="5" />
                <GlassInput label="Max Drawdown (%)" value="15" />
              </div>
            </HoloCard>
            </AnimatedCard>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Return', value: '+147.8%', color: 'success', icon: '💰' },
                { label: 'Win Rate', value: '73.2%', color: 'cyan', icon: '🎯' },
                { label: 'Sharpe Ratio', value: '2.84', color: 'magenta', icon: '📈' },
                { label: 'Max Drawdown', value: '-8.4%', color: 'error', icon: '📉' },
              ].map((metric, idx) => (
                <div
                  key={metric.label}
                  className="p-4 rounded glass-panel holo-border animate-fade-in-up"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${theme.border.default}`,
                    animationDelay: `${0.1 + idx * 0.1}s`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{metric.icon}</span>
                    <span className="text-sm" style={{ color: theme.text.tertiary }}>
                      {metric.label}
                    </span>
                  </div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: theme.colors[metric.color as keyof typeof theme.colors] }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Equity Curve */}
            <AnimatedCard variant="pulse-cyan" delay={100}>
            <HoloCard title="Equity Curve" subtitle="Portfolio value over time" glowColor="cyan">
              <div 
                className="h-80 flex items-center justify-center rounded"
                style={{ background: 'rgba(0, 0, 0, 0.3)' }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <p style={{ color: theme.text.tertiary }}>
                    Equity curve visualization will load here
                  </p>
                </div>
              </div>
            </HoloCard>
            </AnimatedCard>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatedCard variant="pulse-magenta" delay={200}>
              <HoloCard title="Trade Statistics" subtitle="Execution metrics" glowColor="magenta">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Total Trades</span>
                    <span className="font-bold" style={{ color: theme.colors.neonCyan }}>1,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Winning Trades</span>
                    <span className="font-bold" style={{ color: theme.colors.success }}>1,352</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Losing Trades</span>
                    <span className="font-bold" style={{ color: theme.colors.error }}>495</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Avg Win</span>
                    <span className="font-bold" style={{ color: theme.colors.success }}>+$847</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Avg Loss</span>
                    <span className="font-bold" style={{ color: theme.colors.error }}>-$412</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Profit Factor</span>
                    <span className="font-bold" style={{ color: theme.colors.neonMagenta }}>2.47</span>
                  </div>
                </div>
              </HoloCard>
              </AnimatedCard>

              <AnimatedCard variant="pulse-cyan" delay={250}>
              <HoloCard title="Risk Metrics" subtitle="Risk analysis" glowColor="cyan">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Sharpe Ratio</span>
                    <span className="font-bold" style={{ color: theme.colors.success }}>2.84</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Sortino Ratio</span>
                    <span className="font-bold" style={{ color: theme.colors.success }}>3.21</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Max Drawdown</span>
                    <span className="font-bold" style={{ color: theme.colors.error }}>-8.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Volatility</span>
                    <span className="font-bold" style={{ color: theme.colors.warning }}>14.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: theme.text.secondary }}>Calmar Ratio</span>
                    <span className="font-bold" style={{ color: theme.colors.neonCyan }}>17.6</span>
                  </div>
                </div>
              </HoloCard>
              </AnimatedCard>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <AnimatedCard variant="pulse-cyan" delay={100}>
          <HoloCard title="Backtest History" subtitle="Previous test runs" glowColor="cyan">
            <div className="space-y-3">
              {[
                { date: '2024-11-25', strategy: 'Neural Momentum Alpha', return: '+147.8%', trades: 1847 },
                { date: '2024-11-20', strategy: 'Mean Reversion Pro', return: '+98.4%', trades: 1242 },
                { date: '2024-11-15', strategy: 'Breakout Hunter', return: '+124.2%', trades: 891 },
                { date: '2024-11-10', strategy: 'Grid Trading Bot', return: '+67.8%', trades: 2147 },
              ].map((test, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded glass-panel hover:scale-[1.01] transition-all"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${theme.border.subtle}`,
                  }}
                >
                  <div>
                    <div className="font-bold mb-1" style={{ color: theme.text.primary }}>
                      {test.strategy}
                    </div>
                    <div className="text-sm" style={{ color: theme.text.tertiary }}>
                      {test.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs mb-1" style={{ color: theme.text.tertiary }}>Return</div>
                      <div className="font-bold" style={{ color: theme.colors.success }}>
                        {test.return}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs mb-1" style={{ color: theme.text.tertiary }}>Trades</div>
                      <div className="font-bold" style={{ color: theme.colors.neonCyan }}>
                        {test.trades}
                      </div>
                    </div>
                    <HoloButton variant="ghost" size="sm" className="hover-lift transition-smooth">
                      View →
                    </HoloButton>
                  </div>
                </div>
              ))}
            </div>
          </HoloCard>
          </AnimatedCard>
        )}
      </div>
      </HoloRefract>
      </PageTransition>
    </SciFiShell>
  );
}
