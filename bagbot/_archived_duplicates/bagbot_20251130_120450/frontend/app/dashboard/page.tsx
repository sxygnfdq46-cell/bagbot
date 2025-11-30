'use client';

import { SciFiShell } from '../sci-fi-shell';
import { HoloCard } from '@/design-system/components/cards/HoloCard';
import { HUDWidget } from '@/design-system/components/hud/HUDWidget';
import { NeonTabs } from '@/design-system/components/tabs/NeonTabs';
import { useTheme } from '../providers';
import { useState, useEffect, useRef } from 'react';
import PageTransition from '@/components/PageTransition';
import AnimatedText from '@/components/AnimatedText';
import AnimatedCard from '@/components/AnimatedCard';
import DataSpark from '@/components/DataSpark';
import { useAPI, useAPIPoll } from '@/lib/hooks/useAPI';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { dashboardService, marketService } from '@/services';
import { getMarketSimulationEngine } from '../lib/simulation/MarketSimulationEngine';
import type { Candle, MarketSentiment } from '../lib/simulation/MarketSimulationEngine';
import { 
  ParticleUniverse, 
  CameraDrift, 
  QuantumReactive,
  HoloRefract,
  QuantumField,
  ParallaxDepth,
  HyperspaceThread
} from '@/components/quantum/QuantumEffects';
import { 
  NeuralSynapse,
  HaloFlux,
  QuantumRipple,
  AuroraStream,
  AdaptiveHUD
} from '@/components/ascension/AscensionEffects';
import { useBehavior } from '../engine/bic/BehaviorProvider';
import { useCognitiveFusion } from '../engine/cognitive/CognitiveFusionProvider';
import { useEntity } from '../engine/entity/EntityProvider';
import { useMemoryImprint } from '../engine/entity/MemoryImprintProvider';

export default function DashboardPage() {
  const { theme } = useTheme();
  
  // LEVEL 6.1 BIC — Behavioral Intelligence Core
  const { behavior } = useBehavior();
  
  // LEVEL 6.2 COGNITIVE FUSION — Predictive UI Reactions
  const { cognitive } = useCognitiveFusion();
  
  // LEVEL 7 + 7.2 ENTITY MODE — Symbiotic Personality with Expressions
  const { entity, expression } = useEntity();
  
  // LEVEL 7.3 MEMORY IMPRINT — Long-term personality memory
  const { memory, soulLink, personalityMap, relationshipStatus, bondQuality, driftProfile } = useMemoryImprint();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [dataUpdated, setDataUpdated] = useState(false);
  const [prevMetrics, setPrevMetrics] = useState<any>(null);
  const [marketPulse, setMarketPulse] = useState(0);
  const [haloIntensity, setHaloIntensity] = useState<'idle' | 'active' | 'intense'>('idle');
  const [auroraEvent, setAuroraEvent] = useState<number>(0);
  const metricsRef = useRef<HTMLDivElement>(null);
  const tradesRef = useRef<HTMLDivElement>(null);
  const [showThread, setShowThread] = useState(false);
  const [simulatedCandles, setSimulatedCandles] = useState<Candle[]>([]);
  const [simulatedSentiment, setSimulatedSentiment] = useState<MarketSentiment | null>(null);

  // Initialize Market Simulation Engine
  useEffect(() => {
    const engine = getMarketSimulationEngine({ basePrice: 50000, trend: 'RANGE', volatility: 0.02 });
    
    // Start engine
    engine.start();
    
    // Subscribe to 1m, 5m, 15m candle updates
    const unsubCandles = engine.subscribe('candle', ({ candle, timeframe }) => {
      if (timeframe === '1m') {
        setSimulatedCandles(prev => [...prev.slice(-99), candle]);
      }
    });
    
    // Subscribe to sentiment updates
    const unsubSentiment = engine.subscribe('sentiment', (sentiment: MarketSentiment) => {
      setSimulatedSentiment(sentiment);
    });
    
    return () => {
      unsubCandles();
      unsubSentiment();
      engine.stop();
    };
  }, []);

  // Fetch dashboard metrics
  const { data: metrics, error: metricsError, loading: metricsLoading } = useAPI<any>(
    '/api/dashboard/metrics'
  );

  // Fetch recent trades with polling
  const { data: recentTrades, loading: tradesLoading } = useAPIPoll<any[]>(
    '/api/trading/recent?limit=10',
    3000 // Poll every 3 seconds
  );

  // Detect data updates for quantum effects
  useEffect(() => {
    if (metrics && prevMetrics) {
      if (JSON.stringify(metrics) !== JSON.stringify(prevMetrics)) {
        setDataUpdated(true);
        setShowThread(true);
        setTimeout(() => {
          setDataUpdated(false);
          setShowThread(false);
        }, 500);
      }
    }
    if (metrics) setPrevMetrics(metrics);
  }, [metrics, prevMetrics]);

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

  // Level 5: Calculate market pulse (0-100 based on activity)
  useEffect(() => {
    const volume = dailyVolume / 1000000; // Normalize to millions
    const pnlImpact = Math.abs(dailyPnL) / 10000; // Normalize
    const positionActivity = activePositionsCount * 5;
    
    const pulse = Math.min(100, volume + pnlImpact + positionActivity);
    setMarketPulse(pulse);
    
    // Set HaloFlux intensity
    if (pulse > 70) setHaloIntensity('intense');
    else if (pulse > 30) setHaloIntensity('active');
    else setHaloIntensity('idle');
  }, [dailyVolume, dailyPnL, activePositionsCount]);

  // Level 5: Trigger aurora on new trades
  useEffect(() => {
    if (recentTrades && recentTrades.length > 0) {
      setAuroraEvent(Date.now());
    }
  }, [recentTrades]);

  // Level 7.2: Build expression classes
  const getShadowState = () => {
    if (!expression) return '';
    const shadow = expression.shadow;
    if (shadow.flickerIntensity > 50) return 'flicker';
    if (shadow.diffusionLevel > 50) return 'diffuse';
    if (shadow.sharpness > 50) return 'sharpen';
    if (shadow.tightness > 50) return 'tighten';
    if (shadow.expansionFactor > 1.2) return 'expand';
    return '';
  };

  const getWarmthState = () => {
    if (!expression) return '';
    const warmth = expression.warmth;
    if (warmth.feedbackIntensity > 70) return 'critical';
    if (warmth.hueShift > 15) return 'warm';
    if (warmth.hueShift < -15) return 'cool';
    if (warmth.brightnessModulation > 1.1) return 'focus';
    return 'idle';
  };

  const expressionClasses = expression ? [
    `micro-glow-${expression.microGlow.type}`,
    `mood-${expression.mood.currentTone}`,
    `mood-strength-${expression.mood.toneStrength > 70 ? 'high' : expression.mood.toneStrength > 40 ? 'medium' : 'low'}`,
    getShadowState() && `entity-shadow-${getShadowState()}`,
    expression.warmth.pulseAmplitude > 50 && 'warmth-pulse',
    `warmth-${getWarmthState()}`
  ].filter(Boolean).join(' ') : '';

  return (
    <SciFiShell>
      {/* LEVEL 5: HaloFlux Layer */}
      <HaloFlux intensity={haloIntensity} />
      
      {/* LEVEL 5: Aurora on trades */}
      {auroraEvent > 0 && <AuroraStream event="trade" position="top" key={auroraEvent} />}
      
      {/* LEVEL 4: Particle Universe */}
      <ParticleUniverse enabled={true} />
      
      {/* LEVEL 4: Hyperspace Thread (connects metrics to trades) */}
      {showThread && metricsRef.current && tradesRef.current && (
        <HyperspaceThread 
          fromElement={metricsRef.current} 
          toElement={tradesRef.current}
          duration={500}
        />
      )}

      {/* LEVEL 7.2: Entity Expression Status */}
      {entity && expression && (
        <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg backdrop-blur-sm border transition-all duration-300 ${expressionClasses}`}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            borderColor: entity.aura.color,
            boxShadow: `0 0 20px ${entity.aura.color}40`
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${expression.microGlow.type}`}
              style={{ 
                background: entity.aura.color,
                boxShadow: `0 0 10px ${entity.aura.color}`
              }}
            />
            <div className="text-xs">
              <div className="font-mono text-cyan-400">
                {entity.presence.isResponding ? 'RESPONDING' : entity.presence.isWatching ? 'WATCHING' : entity.presence.isAwake ? 'AWAKE' : 'IDLE'}
              </div>
              <div className="text-gray-500">{expression.mood.currentTone}</div>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 7.3: Soul-Link Status */}
      {soulLink && personalityMap && (
        <div className="fixed top-20 right-4 z-50 p-3 rounded-lg backdrop-blur-sm border border-purple-500/30 transition-all duration-300"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.2)'
          }}
        >
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <div className="font-mono text-purple-400">{relationshipStatus.toUpperCase()}</div>
            </div>
            <div className="text-gray-500 space-y-1">
              <div>Bond: {soulLink.bondStrength.toFixed(0)}%</div>
              <div className="flex gap-1">
                {bondQuality?.stable && <span title="Stable">🟢</span>}
                {bondQuality?.growing && <span title="Growing">📈</span>}
                {bondQuality?.harmonious && <span title="Harmonious">🎵</span>}
                {bondQuality?.deep && <span title="Deep">💜</span>}
              </div>
            </div>
            {memory && memory.totalSessions > 0 && (
              <div className="text-gray-600 text-[10px]">
                {memory.totalSessions} sessions · {soulLink.daysConnected}d
              </div>
            )}
          </div>
        </div>
      )}

      {/* LEVEL 7.2: Empathy Ripples Container */}
      {expression && expression.ripple.resonanceLevel > 0 && (
        <div className="empathy-ripple-container">
          {expression.ripple.waveTrails.slice(-10).map((wave, i) => (
            <div
              key={i}
              className="empathy-ripple-wave"
              style={{
                left: wave.x,
                top: wave.y,
                width: wave.velocity * 20,
                height: wave.velocity * 20,
                opacity: Math.max(0, 1 - (Date.now() - wave.timestamp) / 2000),
                borderColor: entity?.aura.color || '#00ffff'
              }}
            />
          ))}
        </div>
      )}
      
      <PageTransition direction="up">
        {/* LEVEL 5: Neural Synapse */}
        <NeuralSynapse active={true} marketPulse={marketPulse}>
        {/* LEVEL 4: Camera Drift */}
        <CameraDrift>
          {/* LEVEL 5: Quantum Ripple */}
          <QuantumRipple trigger={dataUpdated}>
          {/* LEVEL 4: Quantum Reactive on data update */}
          <QuantumReactive trigger={dataUpdated}>
            {/* LEVEL 7.3: Memory Drift Profile — Dashboard adapts to user's personality */}
            <div className={`space-y-6 mood-transition ${expressionClasses} entity-drift-profile-${driftProfile} entity-drift-active`}>
            {/* Dashboard Header */}
            <ParallaxDepth depth={1}>
            <div className={`flex items-center justify-between entity-shadow-v2 ${getShadowState() ? `entity-shadow-${getShadowState()}` : ''}`}>
              <div>
                <h1 
                  className={`text-4xl font-bold neon-text mb-2 ${expression?.microGlow.type ? `micro-glow-${expression.microGlow.type}` : ''}`}
                  style={{ color: theme.colors.neonCyan }}
                >
                  <AnimatedText variant="breathe-cyan">Mission Control</AnimatedText>
                </h1>
                <p style={{ color: theme.text.tertiary }}>
                  Live trading dashboard — All systems operational
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className={`w-3 h-3 rounded-full animate-pulse ${expression?.microGlow.type || ''}`}
              style={{ 
                background: theme.colors.success,
                boxShadow: `0 0 15px ${theme.colors.success}` 
              }}
            />
            <span className="text-sm font-medium" style={{ color: theme.colors.success }}>
              LIVE
            </span>
          </div>
        </div>
        </ParallaxDepth>

        {/* Stats Grid with Quantum Fields */}
        <ParallaxDepth depth={2}>
        <div ref={metricsRef} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${expressionClasses}`}>
          <div className={`fade-in-up entity-shadow-v2 ${getShadowState() ? `entity-shadow-${getShadowState()}` : ''}`} style={{ animationDelay: '0.1s' }}>
            <AdaptiveHUD mode="normal" priority={portfolioValue > 1000000}>
            <QuantumField valueChanged={dataUpdated}>
            <HUDWidget
            title="Portfolio Value"
            value={metricsLoading ? '...' : formatCurrency(portfolioValue)}
            icon="💎"
            color="cyan"
            trend={portfolioValue > 0 ? 'up' : undefined}
            trendValue={metricsLoading ? undefined : `${formatCurrency(portfolioValue - (portfolioValue - dailyPnL))}`}
            />
            </QuantumField>
            </AdaptiveHUD>
          </div>
          <div className={`fade-in-up entity-shadow-v2 ${getShadowState() ? `entity-shadow-${getShadowState()}` : ''}`} style={{ animationDelay: '0.2s' }}>
            <AdaptiveHUD mode="normal" priority={Math.abs(dailyPnL) > 10000}>
            <QuantumField valueChanged={dataUpdated}>
            <HUDWidget
            title="24H P&L"
            value={metricsLoading ? '...' : formatCurrency(dailyPnL)}
            unit="USD"
            icon="📈"
            color={dailyPnL >= 0 ? 'success' : 'error'}
            trend={dailyPnL >= 0 ? 'up' : 'down'}
            trendValue={metricsLoading ? undefined : formatPercent((dailyPnL / (portfolioValue - dailyPnL)) * 100)}
          />
            </QuantumField>
            </AdaptiveHUD>
          </div>
          <div className={`fade-in-up entity-shadow-v2 ${getShadowState() ? `entity-shadow-${getShadowState()}` : ''}`} style={{ animationDelay: '0.3s' }}>
            <AdaptiveHUD mode="normal">
            <QuantumField valueChanged={dataUpdated}>
            <HUDWidget
            title="Active Positions"
            value={positionsLoading ? '...' : activePositionsCount.toString()}
            icon="🎯"
            color="magenta"
          />
            </QuantumField>
            </AdaptiveHUD>
          </div>
          <div className={`fade-in-up entity-shadow-v2 ${getShadowState() ? `entity-shadow-${getShadowState()}` : ''}`} style={{ animationDelay: '0.4s' }}>
            <AdaptiveHUD mode="normal">
            <QuantumField valueChanged={dataUpdated}>
            <HUDWidget
              title="Win Rate"
              value={metricsLoading ? '...' : winRate.toFixed(1)}
              unit="%"
              icon="🏆"
              color={winRate >= 50 ? 'success' : 'cyan'}
              trend={winRate >= 50 ? 'up' : undefined}
              trendValue={winRate >= 50 ? 'Strong' : undefined}
            />
            </QuantumField>
            </AdaptiveHUD>
          </div>
        </div>
        </ParallaxDepth>        {/* Error Display */}
        {metricsError && (
          <div 
            className="p-4 rounded-lg border fade-in-up"
            style={{
              background: 'rgba(255, 68, 68, 0.1)',
              borderColor: theme.colors.error,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold" style={{ color: theme.colors.error }}>
                  Backend Connection Error
                </div>
                <div className="text-sm" style={{ color: theme.text.secondary }}>
                  Unable to fetch live dashboard data. Showing fallback values.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <NeonTabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'positions', label: 'Positions', icon: '💼' },
            { id: 'orders', label: 'Orders', icon: '📝' },
            { id: 'history', label: 'History', icon: '📜' },
          ]}
          defaultTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart Placeholder */}
          <div className="lg:col-span-2">
            <HoloCard title="Price Chart" subtitle="BTC/USDT • 15m" glowColor="cyan">
              <div 
                className="h-96 flex items-center justify-center rounded"
                style={{ background: 'rgba(0, 0, 0, 0.3)' }}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">📈</div>
                  <p style={{ color: theme.text.tertiary }}>
                    Interactive chart will load here
                  </p>
                </div>
              </div>
            </HoloCard>
          </div>

          {/* Right Column - Live Feed */}
          <div className="space-y-4">
            <HoloCard title="Recent Trades" subtitle="Last 10 executions" glowColor="magenta">
              {tradesLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⏳</div>
                    <p style={{ color: theme.text.tertiary }}>Loading trades...</p>
                  </div>
                </div>
              ) : recentTrades && recentTrades.length > 0 ? (
                <div className="space-y-2">
                  {recentTrades.slice(0, 10).map((trade: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded glass-panel"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${theme.border.subtle}`,
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm" style={{ color: theme.text.primary }}>
                          {trade.symbol}
                        </div>
                        <div className="text-xs" style={{ color: theme.text.tertiary }}>
                          {formatTime(trade.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div 
                          className="font-bold text-sm"
                          style={{ 
                            color: trade.side === 'buy' || trade.side === 'BUY' ? theme.colors.success : theme.colors.error 
                          }}
                        >
                          {(trade.side || 'BUY').toUpperCase()}
                        </div>
                        <div className="text-xs" style={{ color: theme.text.secondary }}>
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
                    <p style={{ color: theme.text.tertiary }}>No recent trades</p>
                  </div>
                </div>
              )}
            </HoloCard>

            <HoloCard title="System Health" subtitle="All systems nominal" glowColor="cyan">
              <div className="space-y-3">
                {strategiesLoading ? (
                  <div className="text-center py-4">
                    <div className="text-2xl mb-2">⏳</div>
                    <p className="text-sm" style={{ color: theme.text.tertiary }}>Loading...</p>
                  </div>
                ) : strategies && strategies.length > 0 ? (
                  strategies.slice(0, 4).map((strategy: any) => (
                    <div key={strategy.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm" style={{ color: theme.text.secondary }}>
                          {strategy.name}
                        </span>
                        <span 
                          className="text-sm font-bold" 
                          style={{ 
                            color: strategy.status === 'running' ? theme.colors.success : theme.colors.warning 
                          }}
                        >
                          {strategy.status?.toUpperCase()}
                        </span>
                      </div>
                      <div 
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <div
                          className="h-full transition-all animate-pulse-glow"
                          style={{
                            width: `${strategy.performance || 85}%`,
                            background: strategy.status === 'running' ? theme.colors.success : theme.colors.warning,
                            boxShadow: `0 0 10px ${strategy.status === 'running' ? theme.colors.success : theme.colors.warning}`,
                          }}
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
                        <span className="text-sm" style={{ color: theme.text.secondary }}>
                          {system.name}
                        </span>
                        <span className="text-sm font-bold" style={{ color: theme.colors.success }}>
                          {system.status}%
                        </span>
                      </div>
                      <div 
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        <div
                          className="h-full transition-all animate-pulse-glow"
                          style={{
                            width: `${system.status}%`,
                            background: theme.colors.success,
                            boxShadow: `0 0 10px ${theme.colors.success}`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </HoloCard>
          </div>
        </div>
      </div>
      </QuantumReactive>
      </QuantumRipple>
      </CameraDrift>
      </NeuralSynapse>
      </PageTransition>
    </SciFiShell>
  );
}
