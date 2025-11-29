'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '../../design-system/components/cards/HoloCard';
import { NeonTabs } from '../../design-system/components/tabs/NeonTabs';
import { GlassInput } from '../../design-system/components/inputs/GlassInput';
import { useTheme } from '../providers';
import { useState } from 'react';
import PageTransition from '../../components/PageTransition';
import AnimatedText from '../../components/AnimatedText';
import AnimatedCard from '../../components/AnimatedCard';
import { useAPIPoll } from '../../lib/hooks/useAPI';
import { useWebSocket } from '../../lib/hooks/useWebSocket';
import { ParticleUniverse, HoloRefract } from '../../components/quantum/QuantumEffects';
import { TemporalDisplacement } from '../../components/ascension/AscensionEffects';

export default function LogsPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch recent logs with polling
  const { data: logsData } = useAPIPoll<any[]>('/api/logs/recent?limit=50', 3000);

  // WebSocket for live log tail
  const { data: liveLogs } = useWebSocket<any>({
    channel: 'logs',
    filters: { level: activeTab !== 'all' ? activeTab : undefined },
    enabled: true,
    autoConnect: true,
  });

  const logs = logsData ?? [
    { time: '14:23:45', level: 'INFO', source: 'Trading Engine', message: 'Order executed: BTC/USDT BUY 0.15 @ $67,891' },
    { time: '14:23:42', level: 'INFO', source: 'Risk Manager', message: 'Position check passed for strategy Neural Alpha' },
    { time: '14:23:38', level: 'WARN', source: 'Data Feed', message: 'Transient connection delay to Binance (recovered in 142ms)' },
    { time: '14:23:35', level: 'INFO', source: 'Neural Engine', message: 'Model prediction generated: BTC/USDT confidence 92%' },
    { time: '14:23:21', level: 'INFO', source: 'Trading Engine', message: 'Signal received from Neural Alpha strategy' },
    { time: '14:23:18', level: 'INFO', source: 'Order Router', message: 'Order submitted to exchange: ID #7821847' },
    { time: '14:23:12', level: 'ERROR', source: 'Risk Manager', message: 'Position blocked: Exceeds max exposure limit' },
    { time: '14:23:08', level: 'INFO', source: 'Data Feed', message: 'Market data update: 12,847 ticks processed' },
    { time: '14:22:54', level: 'INFO', source: 'Neural Engine', message: 'Training epoch 1847 completed, accuracy: 87.3%' },
    { time: '14:22:47', level: 'WARN', source: 'Trading Engine', message: 'High latency detected: 89ms order execution time' },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return theme.colors.neonCyan;
      case 'WARN': return theme.colors.warning;
      case 'ERROR': return theme.colors.error;
      default: return theme.text.secondary;
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'INFO': return 'rgba(0, 246, 255, 0.1)';
      case 'WARN': return 'rgba(255, 170, 0, 0.1)';
      case 'ERROR': return 'rgba(255, 0, 85, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <SciFiShell>
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
      <TemporalDisplacement active={liveLogs ? true : false}>
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
              System Logs
            </h1>
            </AnimatedText>
            <p style={{ color: theme.text.tertiary }}>
              Real-time activity monitoring and debugging
            </p>
          </div>
        </div>

        {/* Log Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Logs', value: '24,891', color: 'cyan', icon: '📝' },
            { label: 'Errors (24H)', value: '12', color: 'error', icon: '❌' },
            { label: 'Warnings', value: '47', color: 'warning', icon: '⚠️' },
            { label: 'Info', value: '24,832', color: 'success', icon: 'ℹ️' },
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
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-sm" style={{ color: theme.text.tertiary }}>
                  {stat.label}
                </span>
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

        {/* Tabs & Search */}
        <div className="flex items-center justify-between gap-6">
          <NeonTabs
            tabs={[
              { id: 'all', label: 'All Logs', icon: '📋' },
              { id: 'info', label: 'Info', icon: 'ℹ️' },
              { id: 'warn', label: 'Warnings', icon: '⚠️' },
              { id: 'error', label: 'Errors', icon: '❌' },
            ]}
            defaultTab={activeTab}
            onChange={setActiveTab}
          />
          <div className="flex-1 max-w-md">
            <GlassInput
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Logs Display */}
        <AnimatedCard variant="pulse-cyan" delay={100}>
        <HoloCard glowColor="cyan">
          <div className="space-y-2 font-mono text-sm">
            {logs.map((log: any, index: number) => (
              <div
                key={log.id || index}
                className="flex items-start gap-4 p-3 rounded transition-smooth hover-lift hover:scale-[1.01]"
                style={{
                  background: getLevelBg(log.level),
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <span className="text-xs" style={{ color: theme.text.tertiary }}>
                  {log.time}
                </span>
                <span 
                  className="font-bold px-2 py-0.5 rounded text-xs min-w-[60px] text-center"
                  style={{ 
                    background: getLevelBg(log.level),
                    color: getLevelColor(log.level),
                    border: `1px solid ${getLevelColor(log.level)}`,
                  }}
                >
                  {log.level}
                </span>
                <span 
                  className="text-xs font-semibold min-w-[120px]"
                  style={{ color: theme.colors.neonCyan }}
                >
                  {log.source}
                </span>
                <span className="flex-1" style={{ color: theme.text.secondary }}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </HoloCard>
        </AnimatedCard>

        {/* Log Sources */}
        <AnimatedCard variant="pulse-magenta" delay={200}>
        <HoloCard title="Active Log Sources" subtitle="System components reporting" glowColor="magenta">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Trading Engine', count: '8,247', status: 'active' },
              { name: 'Risk Manager', count: '4,891', status: 'active' },
              { name: 'Data Feed', count: '6,124', status: 'active' },
              { name: 'Neural Engine', count: '3,412', status: 'active' },
              { name: 'Order Router', count: '2,217', status: 'active' },
            ].map((source) => (
              <div
                key={source.name}
                className="p-3 rounded glass-panel"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${theme.border.subtle}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                      background: theme.colors.success,
                      boxShadow: `0 0 10px ${theme.colors.success}`,
                    }}
                  />
                  <span className="text-sm font-semibold" style={{ color: theme.text.primary }}>
                    {source.name}
                  </span>
                </div>
                <div className="text-xs" style={{ color: theme.text.tertiary }}>
                  {source.count} logs today
                </div>
              </div>
            ))}
          </div>
        </HoloCard>
        </AnimatedCard>
      </div>
      </HoloRefract>
      </TemporalDisplacement>
      </PageTransition>
    </SciFiShell>
  );
}
