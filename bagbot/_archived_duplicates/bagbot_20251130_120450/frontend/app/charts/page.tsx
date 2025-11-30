'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { NeonTabs } from '@/design-system/components/tabs/NeonTabs';
import { HoloButton } from '@/design-system/components/buttons/HoloButton';
import { useTheme } from '../providers';
import { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import { useAPI, useAPIPoll } from '@/lib/hooks/useAPI';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { ParticleUniverse, CameraDrift, HoloRefract } from '@/components/quantum/QuantumEffects';
import { GravityWarp, QuantumRipple } from '@/components/ascension/AscensionEffects';

export default function ChartsPage() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('btc');
  const [timeframe, setTimeframe] = useState('15m');

  // Fetch candle data
  const symbolMap: Record<string, string> = { btc: 'BTCUSDT', eth: 'ETHUSDT', sol: 'SOLUSDT' };
  const symbol = symbolMap[activeTab] || 'BTCUSDT';
  
  const { data: candleData } = useAPIPoll<any[]>(
    `/api/market/candles?symbol=${symbol}&timeframe=${timeframe}&limit=100`,
    10000
  );

  // Fetch orderbook
  const { data: orderbookData } = useAPIPoll<any>(
    `/api/market/orderbook?symbol=${symbol}`,
    2000
  );

  // WebSocket for real-time prices
  const { data: livePrice } = useWebSocket<any>({
    channel: 'prices',
    filters: { symbol },
    enabled: true,
    autoConnect: true,
  });

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <SciFiShell>
      <ParticleUniverse enabled={true} />
      
      <PageTransition direction="up">
      <GravityWarp isEntering={true}>
      <QuantumRipple trigger={livePrice ? true : false}>
      <CameraDrift>
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
              Price Charts
            </h1>
            </AnimatedText>
            <p style={{ color: theme.text.tertiary }}>
              Real-time market visualization and technical analysis
            </p>
          </div>
          {/* Timeframe Selector */}
          <div className="flex gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className="px-4 py-2 rounded transition-smooth font-medium hover-lift"
                style={{
                  background: timeframe === tf 
                    ? 'rgba(0, 246, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${timeframe === tf ? theme.border.active : theme.border.subtle}`,
                  color: timeframe === tf ? theme.colors.neonCyan : theme.text.secondary,
                  boxShadow: timeframe === tf ? theme.shadows.glow.soft : 'none',
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Tabs */}
        <NeonTabs
          tabs={[
            { id: 'btc', label: 'BTC/USDT', icon: '₿' },
            { id: 'eth', label: 'ETH/USDT', icon: 'Ξ' },
            { id: 'sol', label: 'SOL/USDT', icon: '◎' },
            { id: 'avax', label: 'AVAX/USDT', icon: '▲' },
          ]}
          defaultTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Main Chart */}
        <AnimatedCard variant="pulse-cyan" delay={100}>
        <HoloCard glowColor="cyan">
          <div 
            className="h-96 flex items-center justify-center rounded relative"
            style={{ background: 'rgba(0, 0, 0, 0.4)' }}
          >
            {/* Chart Placeholder */}
            <div className="text-center">
              <div className="text-7xl mb-4">📊</div>
              <p className="text-xl font-semibold mb-2" style={{ color: theme.text.primary }}>
                Interactive TradingView Chart
              </p>
              <p style={{ color: theme.text.tertiary }}>
                Live candlestick chart with indicators will load here
              </p>
            </div>

            {/* Overlay Stats */}
            <div 
              className="absolute top-4 left-4 glass-panel holo-border rounded p-4"
              style={{
                background: 'rgba(0, 0, 0, 0.8)',
                border: `1px solid ${theme.border.default}`,
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: theme.text.tertiary }}>O:</span>
                  <span className="font-mono font-bold" style={{ color: theme.text.primary }}>
                    $67,842
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: theme.text.tertiary }}>H:</span>
                  <span className="font-mono font-bold" style={{ color: theme.colors.success }}>
                    $68,124
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: theme.text.tertiary }}>L:</span>
                  <span className="font-mono font-bold" style={{ color: theme.colors.error }}>
                    $67,612
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: theme.text.tertiary }}>C:</span>
                  <span className="font-mono font-bold" style={{ color: theme.colors.neonCyan }}>
                    $67,891
                  </span>
                </div>
              </div>
            </div>
          </div>
        </HoloCard>
        </AnimatedCard>

        {/* Technical Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedCard variant="pulse-cyan" delay={200}>
          <HoloCard title="RSI (14)" subtitle="Relative Strength Index" glowColor="cyan">
            <div className="space-y-3">
              <div className="text-center">
                <div 
                  className="text-5xl font-bold mb-2"
                  style={{ color: theme.colors.neonCyan }}
                >
                  62.4
                </div>
                <span 
                  className="px-3 py-1 rounded text-sm font-bold"
                  style={{ 
                    background: 'rgba(0, 246, 255, 0.2)',
                    color: theme.colors.neonCyan 
                  }}
                >
                  NEUTRAL
                </span>
              </div>
              <div 
                className="h-3 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div
                  className="h-full"
                  style={{
                    width: '62.4%',
                    background: theme.colors.neonCyan,
                    boxShadow: theme.shadows.glow.cyan,
                  }}
                />
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>

          <AnimatedCard variant="pulse-magenta" delay={250}>
          <HoloCard title="MACD" subtitle="Moving Average Convergence" glowColor="magenta">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.tertiary }}>MACD:</span>
                <span className="font-bold" style={{ color: theme.colors.success }}>+124.8</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.tertiary }}>Signal:</span>
                <span className="font-bold" style={{ color: theme.colors.neonCyan }}>+98.2</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.tertiary }}>Histogram:</span>
                <span className="font-bold" style={{ color: theme.colors.success }}>+26.6</span>
              </div>
              <div className="text-center">
                <span 
                  className="px-3 py-1 rounded text-sm font-bold"
                  style={{ 
                    background: 'rgba(0, 255, 170, 0.2)',
                    color: theme.colors.success 
                  }}
                >
                  BULLISH
                </span>
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>

          <AnimatedCard variant="pulse-green" delay={300}>
          <HoloCard title="Bollinger Bands" subtitle="Volatility indicator" glowColor="teal">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.tertiary }}>Upper:</span>
                <span className="font-bold font-mono" style={{ color: theme.colors.error }}>
                  $68,420
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.tertiary }}>Middle:</span>
                <span className="font-bold font-mono" style={{ color: theme.colors.neonCyan }}>
                  $67,891
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: theme.text.tertiary }}>Lower:</span>
                <span className="font-bold font-mono" style={{ color: theme.colors.success }}>
                  $67,362
                </span>
              </div>
              <div className="text-center">
                <span 
                  className="px-3 py-1 rounded text-sm font-bold"
                  style={{ 
                    background: 'rgba(255, 170, 0, 0.2)',
                    color: theme.colors.warning 
                  }}
                >
                  MID-RANGE
                </span>
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>
        </div>

        {/* Market Depth & Order Book */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedCard variant="pulse-cyan" delay={100}>
          <HoloCard title="Order Book" subtitle="Live bids & asks" glowColor="cyan">
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <div 
                  className="text-sm font-bold mb-3 text-center"
                  style={{ color: theme.colors.success }}
                >
                  BIDS
                </div>
                {[
                  { price: '67,891', size: '1.24' },
                  { price: '67,890', size: '2.15' },
                  { price: '67,889', size: '0.84' },
                  { price: '67,888', size: '3.42' },
                  { price: '67,887', size: '1.67' },
                ].map((order, i) => (
                  <div 
                    key={i}
                    className="flex justify-between text-sm p-2 rounded mb-1"
                    style={{ background: 'rgba(0, 255, 170, 0.1)' }}
                  >
                    <span className="font-mono" style={{ color: theme.colors.success }}>
                      ${order.price}
                    </span>
                    <span style={{ color: theme.text.tertiary }}>{order.size}</span>
                  </div>
                ))}
              </div>

              {/* Asks */}
              <div>
                <div 
                  className="text-sm font-bold mb-3 text-center"
                  style={{ color: theme.colors.error }}
                >
                  ASKS
                </div>
                {[
                  { price: '67,892', size: '0.94' },
                  { price: '67,893', size: '1.82' },
                  { price: '67,894', size: '2.41' },
                  { price: '67,895', size: '1.23' },
                  { price: '67,896', size: '3.15' },
                ].map((order, i) => (
                  <div 
                    key={i}
                    className="flex justify-between text-sm p-2 rounded mb-1"
                    style={{ background: 'rgba(255, 0, 85, 0.1)' }}
                  >
                    <span className="font-mono" style={{ color: theme.colors.error }}>
                      ${order.price}
                    </span>
                    <span style={{ color: theme.text.tertiary }}>{order.size}</span>
                  </div>
                ))}
              </div>
            </div>
          </HoloCard>
          </AnimatedCard>

          <AnimatedCard variant="pulse-magenta" delay={200}>
          <HoloCard title="Recent Trades" subtitle="Last executed orders" glowColor="magenta">
            <div className="space-y-2">
              {[
                { time: '14:23:45', price: '67,891', size: '0.15', side: 'BUY' },
                { time: '14:23:42', price: '67,890', size: '0.24', side: 'SELL' },
                { time: '14:23:38', price: '67,892', size: '0.42', side: 'BUY' },
                { time: '14:23:35', price: '67,889', size: '0.18', side: 'SELL' },
                { time: '14:23:31', price: '67,893', size: '0.31', side: 'BUY' },
                { time: '14:23:28', price: '67,891', size: '0.52', side: 'BUY' },
                { time: '14:23:24', price: '67,888', size: '0.27', side: 'SELL' },
              ].map((trade, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded"
                  style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                >
                  <span className="text-xs font-mono" style={{ color: theme.text.tertiary }}>
                    {trade.time}
                  </span>
                  <span 
                    className="font-mono font-bold"
                    style={{ 
                      color: trade.side === 'BUY' ? theme.colors.success : theme.colors.error 
                    }}
                  >
                    ${trade.price}
                  </span>
                  <span className="text-sm" style={{ color: theme.text.secondary }}>
                    {trade.size}
                  </span>
                </div>
              ))}
            </div>
          </HoloCard>
          </AnimatedCard>
        </div>
      </div>
      </HoloRefract>
      </CameraDrift>
      </QuantumRipple>
      </GravityWarp>
      </PageTransition>
    </SciFiShell>
  );
}
