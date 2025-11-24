'use client';

import { useState, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { MetricCard } from '@/components/neon/MetricCard';
import { Modal } from '@/components/neon/Modal';
import { NeonTabs } from '@/components/neon/NeonTabs';
import { AlertPanel } from '@/components/neon/AlertPanel';
import { ReactorCore } from '@/components/neon/ReactorCore';
import { useAIMessages } from '@/hooks/useAIMessages';
import { Brain, TrendingUp, Play, Pause, Settings, Info, BarChart3, Target } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  type: 'OB' | 'FVG' | 'Sweeps' | 'Breaker' | 'Supply' | 'Demand' | 'Trend' | 'MeanRev' | 'Volatility' | 'Micro' | 'HTF';
  enabled: boolean;
  confidence: number;
  description: string;
  rules: string[];
  htfRequirements: string[];
  marketSuitability: string[];
  performance: {
    totalTrades: number;
    winRate: number;
    avgReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    profitFactor: number;
  };
  backtest?: {
    period: string;
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    maxConsecutiveLosses: number;
  };
}

export default function StrategyArsenalPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { messages, sendMessage, loading: aiLoading } = useAIMessages();

  useEffect(() => {
    fetchStrategies();
    const interval = setInterval(fetchStrategies, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/strategy/list');
      const data = await response.json();
      setStrategies(data.strategies || mockStrategies);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
      setStrategies(mockStrategies);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: string) => {
    try {
      await fetch(`/api/strategy/${strategyId}/toggle`, {
        method: 'POST'
      });
      fetchStrategies();
    } catch (error) {
      console.error('Failed to toggle strategy:', error);
    }
  };

  const openStrategyDetail = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setDetailModalOpen(true);
    // Request AI commentary
    sendMessage(`Analyze the ${strategy.name} strategy performance and provide insights.`);
  };

  const typeColors: Record<string, 'cyan' | 'magenta' | 'green' | 'yellow' | 'orange'> = {
    OB: 'cyan',
    FVG: 'magenta',
    Sweeps: 'green',
    Breaker: 'yellow',
    Supply: 'orange',
    Demand: 'cyan',
    Trend: 'magenta',
    MeanRev: 'green',
    Volatility: 'yellow',
    Micro: 'orange',
    HTF: 'cyan'
  };

  const avgConfidence = strategies.length > 0
    ? (strategies.reduce((sum, s) => sum + s.confidence, 0) / strategies.length * 100).toFixed(1)
    : '0.0';

  const enabledCount = strategies.filter(s => s.enabled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Strategy Arsenal</h1>
            <p className="text-gray-400">AI-powered order flow and ICT strategies</p>
          </div>
          <ReactorCore 
            size="md" 
            status={enabledCount > 0 ? 'active' : 'idle'} 
            showRings 
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Active Strategies"
          value={`${enabledCount}/${strategies.length}`}
          subtitle="Currently enabled"
          icon={<Brain />}
          glow="cyan"
        />
        
        <MetricCard
          title="Avg Confidence"
          value={`${avgConfidence}%`}
          subtitle="AI confidence score"
          icon={<Target />}
          glow="magenta"
        />
        
        <MetricCard
          title="Avg Win Rate"
          value={strategies.length > 0 
            ? `${(strategies.reduce((sum, s) => sum + s.performance.winRate, 0) / strategies.length).toFixed(1)}%`
            : '0.0%'
          }
          subtitle="Across all strategies"
          icon={<TrendingUp />}
          glow="green"
        />
        
        <MetricCard
          title="Total Trades"
          value={strategies.reduce((sum, s) => sum + s.performance.totalTrades, 0)}
          subtitle="All-time executed"
          icon={<BarChart3 />}
          glow="yellow"
        />
      </div>

      {/* Strategy Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-20 text-gray-500">
            <div className="animate-spin-slow w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading strategies...</p>
          </div>
        ) : strategies.map(strategy => (
          <NeonCard 
            key={strategy.id} 
            glow={typeColors[strategy.type]}
            hover
            onClick={() => openStrategyDetail(strategy)}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
                    <NeonBadge 
                      variant={typeColors[strategy.type]}
                      size="sm"
                    >
                      {strategy.type}
                    </NeonBadge>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <NeonBadge
                      variant={strategy.enabled ? 'green' : 'gray'}
                      size="sm"
                      pulse={strategy.enabled}
                    >
                      {strategy.enabled ? 'ENABLED' : 'DISABLED'}
                    </NeonBadge>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {strategy.description}
                  </p>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">AI Confidence</span>
                  <span className="text-lg font-bold text-neon-cyan">
                    {(strategy.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-neon-cyan to-neon-magenta h-2 rounded-full transition-all duration-500"
                    style={{ width: `${strategy.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 bg-gray-900/30 rounded">
                  <p className="text-xs text-gray-400 mb-1">Win Rate</p>
                  <p className="text-sm font-bold text-neon-green">
                    {strategy.performance.winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-gray-900/30 rounded">
                  <p className="text-xs text-gray-400 mb-1">Avg Return</p>
                  <p className="text-sm font-bold text-neon-cyan">
                    {strategy.performance.avgReturn >= 0 ? '+' : ''}
                    {strategy.performance.avgReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="p-2 bg-gray-900/30 rounded">
                  <p className="text-xs text-gray-400 mb-1">Sharpe</p>
                  <p className="text-sm font-bold text-neon-magenta">
                    {strategy.performance.sharpeRatio.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                <div className="p-2 bg-gray-900/20 rounded">
                  <p className="text-gray-500">Trades</p>
                  <p className="text-white font-medium">{strategy.performance.totalTrades}</p>
                </div>
                <div className="p-2 bg-gray-900/20 rounded">
                  <p className="text-gray-500">Profit Factor</p>
                  <p className="text-white font-medium">{strategy.performance.profitFactor.toFixed(2)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <NeonButton
                  variant={strategy.enabled ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStrategy(strategy.id);
                  }}
                >
                  {strategy.enabled ? (
                    <><Pause className="w-4 h-4 mr-1" /> Disable</>
                  ) : (
                    <><Play className="w-4 h-4 mr-1" /> Enable</>
                  )}
                </NeonButton>
                <NeonButton 
                  variant="secondary" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStrategy(strategy);
                    setSettingsModalOpen(true);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </NeonButton>
                <NeonButton 
                  variant="secondary" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openStrategyDetail(strategy);
                  }}
                >
                  <Info className="w-4 h-4" />
                </NeonButton>
              </div>
            </div>
          </NeonCard>
        ))}
      </div>

      {/* Strategy Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedStrategy?.name || 'Strategy Details'}
        size="xl"
        glow="cyan"
      >
        {selectedStrategy && (
          <div>
            <NeonTabs
              tabs={[
                { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
                { id: 'rules', label: 'Rules', icon: <Target className="w-4 h-4" /> },
                { id: 'backtest', label: 'Backtest', icon: <BarChart3 className="w-4 h-4" /> },
                { id: 'ai', label: 'AI Analysis', icon: <Brain className="w-4 h-4" /> }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              glow="cyan"
            />

            <div className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Description</h4>
                    <p className="text-white">{selectedStrategy.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">HTF Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStrategy.htfRequirements.map((req, idx) => (
                        <NeonBadge key={idx} variant="cyan" size="sm">
                          {req}
                        </NeonBadge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Market Suitability</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStrategy.marketSuitability.map((market, idx) => (
                        <NeonBadge key={idx} variant="magenta" size="sm">
                          {market}
                        </NeonBadge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <MetricCard
                      title="Win Rate"
                      value={`${selectedStrategy.performance.winRate.toFixed(1)}%`}
                      glow="green"
                    />
                    <MetricCard
                      title="Sharpe Ratio"
                      value={selectedStrategy.performance.sharpeRatio.toFixed(2)}
                      glow="cyan"
                    />
                    <MetricCard
                      title="Max Drawdown"
                      value={`-${selectedStrategy.performance.maxDrawdown.toFixed(2)}%`}
                      glow="yellow"
                    />
                    <MetricCard
                      title="Profit Factor"
                      value={selectedStrategy.performance.profitFactor.toFixed(2)}
                      glow="magenta"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Strategy Rules</h4>
                  {selectedStrategy.rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/30 rounded">
                      <div className="flex-shrink-0 w-6 h-6 bg-neon-cyan/20 border border-neon-cyan/50 rounded-full flex items-center justify-center text-xs text-neon-cyan font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-gray-300 flex-1">{rule}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'backtest' && selectedStrategy.backtest && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900/30 rounded">
                      <p className="text-sm text-gray-400 mb-1">Period</p>
                      <p className="text-lg font-bold text-white">{selectedStrategy.backtest.period}</p>
                    </div>
                    <div className="p-4 bg-gray-900/30 rounded">
                      <p className="text-sm text-gray-400 mb-1">Total Return</p>
                      <p className="text-lg font-bold text-neon-green">
                        +{selectedStrategy.backtest.totalReturn.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 bg-gray-900/30 rounded">
                      <p className="text-sm text-gray-400 mb-1">Initial Capital</p>
                      <p className="text-lg font-bold text-white">
                        ${selectedStrategy.backtest.initialCapital.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-900/30 rounded">
                      <p className="text-sm text-gray-400 mb-1">Final Capital</p>
                      <p className="text-lg font-bold text-neon-cyan">
                        ${selectedStrategy.backtest.finalCapital.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <AlertPanel
                    title="Max Consecutive Losses"
                    message={`${selectedStrategy.backtest.maxConsecutiveLosses} trades`}
                    type="warning"
                  />
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-900/30 rounded-lg border border-neon-cyan/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-neon-cyan" />
                      <h4 className="text-sm font-semibold text-white">AI Analysis</h4>
                    </div>
                    {aiLoading ? (
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="animate-spin-slow w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full" />
                        <span>Analyzing strategy...</span>
                      </div>
                    ) : messages.length > 0 ? (
                      <div className="space-y-2">
                        {messages.filter(m => m.role === 'assistant').map((msg, idx) => (
                          <p key={idx} className="text-gray-300">{msg.content}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No AI analysis available yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title={`${selectedStrategy?.name} Settings`}
        size="lg"
        glow="magenta"
      >
        {selectedStrategy && (
          <div className="space-y-4">
            <AlertPanel
              title="Strategy Configuration"
              message="Configure strategy parameters and risk limits"
              type="info"
            />
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Position Size (%)
                </label>
                <input
                  type="number"
                  defaultValue="2.0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white
                           focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stop Loss (%)
                </label>
                <input
                  type="number"
                  defaultValue="1.0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white
                           focus:border-neon-cyan focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Take Profit (%)
                </label>
                <input
                  type="number"
                  defaultValue="2.0"
                  step="0.1"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white
                           focus:border-neon-cyan focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <NeonButton variant="primary">
                Save Settings
              </NeonButton>
              <NeonButton variant="secondary" onClick={() => setSettingsModalOpen(false)}>
                Cancel
              </NeonButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Mock data
const mockStrategies: Strategy[] = [
  {
    id: '1',
    name: 'Order Block Hunter',
    type: 'OB',
    enabled: true,
    confidence: 0.87,
    description: 'Identifies institutional order blocks and trades the retest with precision entry and dynamic stop loss.',
    rules: [
      'Identify strong impulse move creating imbalance',
      'Mark last down candle before impulse as OB',
      'Wait for price to return to OB zone',
      'Enter on rejection wick or engulfing pattern',
      'Stop loss below OB, target next liquidity level'
    ],
    htfRequirements: ['4H bullish trend', '1H structure break'],
    marketSuitability: ['Trending', 'High volatility', 'Crypto', 'Forex'],
    performance: {
      totalTrades: 142,
      winRate: 68.3,
      avgReturn: 2.4,
      sharpeRatio: 1.82,
      maxDrawdown: 8.5,
      profitFactor: 2.1
    },
    backtest: {
      period: 'Jan 2024 - Nov 2024',
      initialCapital: 10000,
      finalCapital: 15420,
      totalReturn: 54.2,
      maxConsecutiveLosses: 4
    }
  },
  {
    id: '2',
    name: 'Fair Value Gap',
    type: 'FVG',
    enabled: true,
    confidence: 0.79,
    description: 'Exploits inefficiencies (gaps) in price delivery by entering when price revisits the FVG zone.',
    rules: [
      'Detect 3-candle pattern with gap between candle 1 and 3',
      'Mark FVG zone for potential retest',
      'Enter when price returns to 50% of FVG',
      'Stop loss outside FVG, target swing high/low',
      'Cancel if FVG is fully filled'
    ],
    htfRequirements: ['Daily trend confirmation', '4H momentum'],
    marketSuitability: ['Trending', 'Medium volatility', 'All markets'],
    performance: {
      totalTrades: 98,
      winRate: 71.4,
      avgReturn: 1.8,
      sharpeRatio: 1.65,
      maxDrawdown: 6.2,
      profitFactor: 2.3
    },
    backtest: {
      period: 'Jan 2024 - Nov 2024',
      initialCapital: 10000,
      finalCapital: 13950,
      totalReturn: 39.5,
      maxConsecutiveLosses: 3
    }
  },
  {
    id: '3',
    name: 'Liquidity Sweeps',
    type: 'Sweeps',
    enabled: true,
    confidence: 0.82,
    description: 'Captures reversals after liquidity grabs above/below key levels where retail stops are triggered.',
    rules: [
      'Identify swing highs/lows with visible liquidity',
      'Wait for price to sweep above/below level',
      'Enter on immediate rejection (wick)',
      'Stop loss beyond sweep point',
      'Target opposite liquidity pool'
    ],
    htfRequirements: ['4H support/resistance', 'Daily key levels'],
    marketSuitability: ['Range-bound', 'High volatility', 'Crypto'],
    performance: {
      totalTrades: 76,
      winRate: 73.7,
      avgReturn: 2.8,
      sharpeRatio: 1.91,
      maxDrawdown: 7.8,
      profitFactor: 2.5
    }
  },
  {
    id: '4',
    name: 'Breaker Blocks',
    type: 'Breaker',
    enabled: true,
    confidence: 0.75,
    description: 'Trades failed order blocks that become breaker blocks indicating strong momentum continuation.',
    rules: [
      'Identify order block that gets broken through',
      'Confirm structure break with close beyond OB',
      'Wait for retest of broken OB (now breaker)',
      'Enter on rejection, stop beyond breaker zone',
      'Target next major level'
    ],
    htfRequirements: ['Clear trend direction', 'Structure break confirmation'],
    marketSuitability: ['Strong trends', 'Breakouts', 'All markets'],
    performance: {
      totalTrades: 54,
      winRate: 70.4,
      avgReturn: 3.1,
      sharpeRatio: 1.78,
      maxDrawdown: 9.2,
      profitFactor: 2.2
    }
  },
  {
    id: '5',
    name: 'Supply & Demand Zones',
    type: 'Supply',
    enabled: false,
    confidence: 0.71,
    description: 'Classical supply/demand zones combined with order flow confirmation for high-probability entries.',
    rules: [
      'Mark strong supply/demand zones with clean reactions',
      'Wait for price to reach zone',
      'Look for order flow confirmation (volume, wicks)',
      'Enter on first touch with confirmation',
      'Stop loss outside zone, target opposite zone'
    ],
    htfRequirements: ['Weekly/Daily zones', 'Clean price action'],
    marketSuitability: ['All market conditions', 'Stocks', 'Forex'],
    performance: {
      totalTrades: 89,
      winRate: 66.3,
      avgReturn: 2.1,
      sharpeRatio: 1.52,
      maxDrawdown: 10.5,
      profitFactor: 1.9
    }
  },
  {
    id: '6',
    name: 'Trend Continuation',
    type: 'Trend',
    enabled: true,
    confidence: 0.84,
    description: 'Rides established trends with pullback entries at key levels, using HTF bias for direction.',
    rules: [
      'Confirm HTF trend (4H/Daily)',
      'Wait for pullback to key support/resistance',
      'Enter on trend continuation signal',
      'Trail stop with structure',
      'Exit on trend exhaustion signals'
    ],
    htfRequirements: ['Daily trend established', '4H momentum aligned'],
    marketSuitability: ['Trending markets', 'Low/Medium volatility'],
    performance: {
      totalTrades: 167,
      winRate: 64.7,
      avgReturn: 1.9,
      sharpeRatio: 1.71,
      maxDrawdown: 8.9,
      profitFactor: 2.0
    }
  },
  {
    id: '7',
    name: 'Mean Reversion Pro',
    type: 'MeanRev',
    enabled: true,
    confidence: 0.78,
    description: 'Identifies oversold/overbought conditions and trades the snap back to mean with tight risk.',
    rules: [
      'Detect extreme deviation from moving average',
      'Confirm with RSI/Stochastic oversold/overbought',
      'Enter on first reversal signal',
      'Stop loss at recent extreme',
      'Target return to mean (MA50/MA200)'
    ],
    htfRequirements: ['Range-bound HTF', 'Clear mean level'],
    marketSuitability: ['Range-bound', 'Low volatility', 'Mean-reverting assets'],
    performance: {
      totalTrades: 213,
      winRate: 69.5,
      avgReturn: 1.4,
      sharpeRatio: 1.63,
      maxDrawdown: 6.8,
      profitFactor: 2.1
    }
  },
  {
    id: '8',
    name: 'Volatility Breakout',
    type: 'Volatility',
    enabled: false,
    confidence: 0.73,
    description: 'Captures explosive moves after periods of consolidation using volatility expansion signals.',
    rules: [
      'Identify consolidation with low ATR',
      'Wait for volatility spike (ATR expansion)',
      'Enter on breakout with volume confirmation',
      'Wide stop loss for volatility',
      'Target measured move or volatility bands'
    ],
    htfRequirements: ['Consolidation pattern', 'Volume buildup'],
    marketSuitability: ['Breakout conditions', 'News events', 'Crypto'],
    performance: {
      totalTrades: 47,
      winRate: 61.7,
      avgReturn: 4.2,
      sharpeRatio: 1.55,
      maxDrawdown: 12.3,
      profitFactor: 1.8
    }
  },
  {
    id: '9',
    name: 'Micro Trend Follower',
    type: 'Micro',
    enabled: true,
    confidence: 0.80,
    description: 'Scalps small trends on lower timeframes with quick entries and exits.',
    rules: [
      'Identify micro trend on 5m/15m charts',
      'Enter on pullback to EMA8',
      'Tight stop loss (0.5-1% maximum)',
      'Quick profit target (1-2% typical)',
      'Exit if momentum fades'
    ],
    htfRequirements: ['HTF bias alignment', 'Clear intraday direction'],
    marketSuitability: ['High liquidity', 'Tight spreads', 'Forex', 'Crypto'],
    performance: {
      totalTrades: 412,
      winRate: 58.3,
      avgReturn: 0.9,
      sharpeRatio: 1.48,
      maxDrawdown: 5.2,
      profitFactor: 1.7
    }
  },
  {
    id: '10',
    name: 'HTF Combo Master',
    type: 'HTF',
    enabled: true,
    confidence: 0.88,
    description: 'Combines multiple HTF confirmations (Daily + 4H + 1H) for high-conviction swing trades.',
    rules: [
      'Confirm Daily trend direction',
      'Check 4H structure alignment',
      'Enter on 1H confirmation signal',
      'Wide stop loss for swing trade',
      'Target major HTF levels (Daily S/R)'
    ],
    htfRequirements: ['Multi-timeframe alignment', 'All HTFs bullish/bearish'],
    marketSuitability: ['All markets', 'Swing trading', 'Position trading'],
    performance: {
      totalTrades: 63,
      winRate: 76.2,
      avgReturn: 3.8,
      sharpeRatio: 2.05,
      maxDrawdown: 7.1,
      profitFactor: 2.8
    }
  }
];
