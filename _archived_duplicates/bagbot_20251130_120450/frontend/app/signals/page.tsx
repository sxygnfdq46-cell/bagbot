'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { NeonTabs } from '@/design-system/components/tabs/NeonTabs';
import { useTheme } from '../providers';
import { useState, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPIPoll } from '@/lib/hooks/useAPI';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { SignalStorm, HoloRefract, ParticleUniverse } from '@/components/quantum/QuantumEffects';
import { SignalRipple, AuroraStream, NeuralSynapse } from '@/components/ascension/AscensionEffects';

export default function SignalsPage() {
  const { theme } = useTheme();
  const [rippleTrigger, setRippleTrigger] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [signalPulse, setSignalPulse] = useState(0);
  const [auroraEvent, setAuroraEvent] = useState<number>(0);

  // Fetch recent signals with polling
  const { data: signalsData } = useAPIPoll<any[]>('/api/signals/recent?limit=20', 2000);

  // WebSocket for real-time signals
  const { data: liveSignal } = useWebSocket<any>({
    channel: 'signals',
    enabled: true,
    autoConnect: true,
  });

  // Level 5: Track signal pulse and trigger effects
  useEffect(() => {
    if (liveSignal) {
      const strength = liveSignal.strength || 50;
      setSignalPulse(strength);
      setRippleTrigger(true);
      setAuroraEvent(Date.now());
      setTimeout(() => setRippleTrigger(false), 300);
    }
  }, [liveSignal]);

  const signals = signalsData ?? [
    {
      pair: 'BTC/USDT',
      type: 'BUY',
      price: '$67,842',
      confidence: 92,
      source: 'Neural Alpha',
      time: '2m ago',
    },
    {
      pair: 'ETH/USDT',
      type: 'SELL',
      price: '$3,421',
      confidence: 87,
      source: 'Mean Reversion',
      time: '5m ago',
    },
    {
      pair: 'SOL/USDT',
      type: 'BUY',
      price: '$142.80',
      confidence: 95,
      source: 'Breakout Hunter',
      time: '8m ago',
    },
    {
      pair: 'AVAX/USDT',
      type: 'BUY',
      price: '$38.92',
      confidence: 78,
      source: 'Grid Bot',
      time: '12m ago',
    },
    {
      pair: 'BTC/USDT',
      type: 'SELL',
      price: '$67,891',
      confidence: 84,
      source: 'Neural Alpha',
      time: '15m ago',
    },
  ];

  return (
    <SciFiShell>
      {/* LEVEL 5: Aurora on signals */}
      {auroraEvent > 0 && <AuroraStream event="signal" position="top" key={auroraEvent} />}
      {rippleTrigger && <SignalRipple trigger={rippleTrigger} color="rgba(255, 0, 255, 0.6)" />}
      
      {/* LEVEL 4: Signal Storm Effect */}
      <SignalStorm intensity={liveSignal ? 2 : 1} />
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
        {/* LEVEL 5: Neural Synapse */}
        <NeuralSynapse active={true} marketPulse={signalPulse}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <AnimatedText variant="breathe-cyan">
          <h1 
            className="text-4xl font-bold neon-text mb-2"
            style={{ color: theme.colors.neonCyan }}
          >
            Signal Feed
          </h1>
          </AnimatedText>
          <p style={{ color: theme.text.tertiary }}>
            Real-time trading signals from all active strategies
          </p>
        </div>

        {/* Signal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Signals Today', value: '847', icon: '📡' },
            { label: 'Avg Confidence', value: '86.4%', icon: '🎯' },
            { label: 'Executed', value: '723', icon: '✅' },
            { label: 'Success Rate', value: '79.2%', icon: '🏆' },
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
                style={{ color: theme.colors.neonCyan }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <NeonTabs
          tabs={[
            { id: 'all', label: 'All Signals', icon: '📡' },
            { id: 'buy', label: 'Buy Only', icon: '📈' },
            { id: 'sell', label: 'Sell Only', icon: '📉' },
            { id: 'high', label: 'High Confidence', icon: '⭐' },
          ]}
          defaultTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Signals List */}
        <div className="space-y-3">
          {signals.map((signal: any, index: number) => (
            <AnimatedCard key={signal.id || index} variant={signal.type === 'BUY' || signal.side === 'buy' ? 'pulse-green' : 'pulse-magenta'} delay={100 + index * 50}>
            <HoloCard
              glowColor={(signal.type === 'BUY' || signal.side === 'buy') ? 'cyan' : 'magenta'}
            >
              <div className="flex items-center justify-between">
                {/* Left: Signal Type & Pair */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: signal.type === 'BUY' 
                        ? 'rgba(0, 255, 170, 0.2)' 
                        : 'rgba(255, 0, 85, 0.2)',
                      border: `2px solid ${signal.type === 'BUY' ? theme.colors.success : theme.colors.error}`,
                      boxShadow: signal.type === 'BUY'
                        ? `0 0 20px ${theme.colors.success}`
                        : `0 0 20px ${theme.colors.error}`,
                      color: signal.type === 'BUY' ? theme.colors.success : theme.colors.error,
                    }}
                  >
                    {signal.type === 'BUY' ? '↗' : '↘'}
                  </div>
                  <div>
                    <h3 
                      className="text-2xl font-bold mb-1"
                      style={{ color: theme.text.primary }}
                    >
                      {signal.pair}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: theme.text.tertiary }}
                      >
                        Source: {signal.source}
                      </span>
                      <span 
                        className="text-xs"
                        style={{ color: theme.text.tertiary }}
                      >
                        {signal.time}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Price & Confidence */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-sm mb-1" style={{ color: theme.text.tertiary }}>
                      Target Price
                    </div>
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.neonCyan }}
                    >
                      {signal.price}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm mb-1" style={{ color: theme.text.tertiary }}>
                      Confidence
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="text-2xl font-bold"
                        style={{ 
                          color: signal.confidence >= 90 
                            ? theme.colors.success 
                            : signal.confidence >= 80 
                            ? theme.colors.neonCyan 
                            : theme.colors.warning 
                        }}
                      >
                        {signal.confidence}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Confidence Bar */}
                <div className="w-32">
                  <div 
                    className="h-3 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <div
                      className="h-full animate-pulse-glow"
                      style={{
                        width: `${signal.confidence}%`,
                        background: signal.confidence >= 90 
                          ? theme.colors.success 
                          : signal.confidence >= 80 
                          ? theme.colors.neonCyan 
                          : theme.colors.warning,
                        boxShadow: `0 0 10px ${theme.colors.neonCyan}`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </HoloCard>
            </AnimatedCard>
          ))}
        </div>

        {/* Live Signal Stream Status */}
        <AnimatedCard variant="pulse-cyan" delay={300}>
        <HoloCard title="Signal Stream Status" subtitle="Real-time feed health" glowColor="cyan">
          <div className="grid grid-cols-3 gap-6">
            {[
              { name: 'Neural Alpha', status: 'ACTIVE', signals: 342 },
              { name: 'Mean Reversion', status: 'ACTIVE', signals: 287 },
              { name: 'Breakout Hunter', status: 'ACTIVE', signals: 218 },
            ].map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: theme.text.secondary }}>{source.name}</span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-bold"
                    style={{ 
                      background: 'rgba(0, 255, 170, 0.2)',
                      color: theme.colors.success 
                    }}
                  >
                    {source.status}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1" style={{ color: theme.colors.neonCyan }}>
                  {source.signals}
                </div>
                <div className="text-xs" style={{ color: theme.text.tertiary }}>
                  signals today
                </div>
              </div>
            ))}
          </div>
        </HoloCard>
        </AnimatedCard>
      </div>
      </NeuralSynapse>
      </PageTransition>
    </SciFiShell>
  );
}
