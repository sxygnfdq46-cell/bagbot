'use client';

import { useState, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { MetricCard } from '@/components/neon/MetricCard';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { DataStream } from '@/components/neon/DataStream';
import { AlertPanel } from '@/components/neon/AlertPanel';
import { useNewsStream } from '@/hooks/useNewsStream';
import { useAIMessages } from '@/hooks/useAIMessages';
import { Newspaper, TrendingUp, Wind, Brain, Target } from 'lucide-react';

interface MarketIntelligence {
  marketRegime: string;
  htfBias: string;
  volatilityLevel: string;
  volatilityIndex: number;
  trendStrength: number;
  sentimentScore: number;
  topMovers: MarketMover[];
  aiInsights: string[];
}

interface MarketMover {
  symbol: string;
  change: number;
  changePercent: number;
  volume: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export default function MarketIntelligencePage() {
  const [data, setData] = useState<MarketIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const news = useNewsStream(20);
  const { messages, sendMessage, loading: aiLoading } = useAIMessages();

  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Request AI market analysis on mount
    if (!aiLoading && messages.length === 0) {
      sendMessage('Analyze current market conditions and provide trading recommendations.');
    }
  }, []);

  const fetchIntelligence = async () => {
    try {
      const response = await fetch('/api/market/intelligence');
      const fetchedData = await response.json();
      setData(fetchedData || mockData);
    } catch (error) {
      console.error('Failed to fetch market intelligence:', error);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow w-16 h-16 border-4 border-neon-magenta border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  const newsItems = news.map(item => ({
    id: item.id,
    timestamp: item.timestamp,
    type: item.sentiment === 'positive' ? 'buy' as const : 
          item.sentiment === 'negative' ? 'sell' as const : 'info' as const,
    message: `[${item.source}] ${item.title}`,
    value: item.impact.toUpperCase()
  }));

  const regimeColor = 
    data.marketRegime === 'TRENDING' ? 'cyan' :
    data.marketRegime === 'RANGING' ? 'magenta' :
    data.marketRegime === 'VOLATILE' ? 'yellow' : 'green';

  const biasColor = 
    data.htfBias === 'BULLISH' ? 'green' :
    data.htfBias === 'BEARISH' ? 'red' : 'yellow';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Market Intelligence</h1>
        <p className="text-gray-400">Real-time market analysis and sentiment tracking</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Market Regime"
          value={data.marketRegime}
          subtitle="Current market state"
          icon={<Target />}
          glow={regimeColor}
        />
        
        <MetricCard
          title="HTF Bias"
          value={data.htfBias}
          subtitle="Higher timeframe direction"
          icon={<TrendingUp />}
          glow={biasColor as any}
        />
        
        <MetricCard
          title="Volatility"
          value={data.volatilityLevel}
          subtitle={`Index: ${data.volatilityIndex.toFixed(1)}`}
          icon={<Wind />}
          glow="yellow"
        />
        
        <MetricCard
          title="Sentiment"
          value={`${(data.sentimentScore * 100).toFixed(0)}%`}
          subtitle={data.sentimentScore > 0.6 ? 'Bullish' : data.sentimentScore < 0.4 ? 'Bearish' : 'Neutral'}
          icon={<Brain />}
          glow="magenta"
        />
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Market State Card */}
        <NeonCard glow={regimeColor}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Market State</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Regime</span>
                  <NeonBadge variant={regimeColor}>
                    {data.marketRegime}
                  </NeonBadge>
                </div>
                <p className="text-xs text-gray-500">
                  {data.marketRegime === 'TRENDING' ? 'Strong directional movement detected' :
                   data.marketRegime === 'RANGING' ? 'Price moving within defined range' :
                   data.marketRegime === 'VOLATILE' ? 'High volatility and erratic price action' :
                   'Uncertain market conditions'}
                </p>
              </div>

              <div className="p-4 bg-gray-900/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">HTF Bias</span>
                  <NeonBadge variant={biasColor as any}>
                    {data.htfBias}
                  </NeonBadge>
                </div>
                <p className="text-xs text-gray-500">
                  {data.htfBias === 'BULLISH' ? 'Higher timeframes showing upward momentum' :
                   data.htfBias === 'BEARISH' ? 'Higher timeframes showing downward pressure' :
                   'No clear directional bias on higher timeframes'}
                </p>
              </div>

              <div className="p-4 bg-gray-900/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Volatility</span>
                  <span className="text-lg font-bold text-neon-yellow">
                    {data.volatilityIndex.toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-neon-green via-neon-yellow to-neon-red h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(data.volatilityIndex, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {data.volatilityLevel === 'HIGH' ? 'Expect larger price swings' :
                   data.volatilityLevel === 'MEDIUM' ? 'Normal volatility levels' :
                   'Low volatility, potential breakout pending'}
                </p>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* Trend Strength */}
        <NeonCard glow="cyan">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Trend Strength</h3>
            
            <div className="mb-6 text-center">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#1f1f28"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#00f0ff"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.trendStrength / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-cyan">
                      {data.trendStrength.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">STRENGTH</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-gray-900/30 rounded">
                <span className="text-gray-400">Status</span>
                <NeonBadge 
                  variant={
                    data.trendStrength > 70 ? 'green' :
                    data.trendStrength > 40 ? 'yellow' : 'red'
                  }
                  size="sm"
                >
                  {data.trendStrength > 70 ? 'STRONG' :
                   data.trendStrength > 40 ? 'MODERATE' : 'WEAK'}
                </NeonBadge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-900/30 rounded">
                <span className="text-gray-400">Sentiment</span>
                <span className="text-white font-medium">
                  {(data.sentimentScore * 100).toFixed(0)}% Bullish
                </span>
              </div>
            </div>
          </div>
        </NeonCard>

        {/* Top Movers */}
        <NeonCard glow="green">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Top Movers</h3>
            <div className="space-y-3">
              {data.topMovers.map((mover, idx) => (
                <div key={idx} className="p-3 bg-gray-900/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">{mover.symbol}</span>
                    <NeonBadge 
                      variant={mover.change >= 0 ? 'green' : 'red'}
                      size="sm"
                    >
                      {mover.change >= 0 ? '+' : ''}{mover.changePercent.toFixed(2)}%
                    </NeonBadge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      Vol: {(mover.volume / 1000000).toFixed(1)}M
                    </span>
                    <span className={
                      mover.sentiment === 'bullish' ? 'text-neon-green' :
                      mover.sentiment === 'bearish' ? 'text-red-400' :
                      'text-gray-400'
                    }>
                      {mover.sentiment.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </NeonCard>
      </div>

      {/* News Feed and AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* News Feed */}
        <NeonCard glow="magenta">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-neon-magenta" />
                <h3 className="text-lg font-bold text-white">News Anchor Feed</h3>
              </div>
              <NeonBadge variant="magenta">{news.length} items</NeonBadge>
            </div>
            <DataStream 
              items={newsItems}
              maxItems={20}
              autoScroll
            />
          </div>
        </NeonCard>

        {/* AI Recommendations */}
        <NeonCard glow="cyan">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-neon-cyan" />
              <h3 className="text-lg font-bold text-white">AI Market Analysis</h3>
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin-slow w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-gray-400">AI analyzing market conditions...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.filter(m => m.role === 'assistant').length > 0 ? (
                  messages.filter(m => m.role === 'assistant').map((msg, idx) => (
                    <AlertPanel
                      key={idx}
                      title="AI Insight"
                      message={msg.content}
                      type="info"
                    />
                  ))
                ) : (
                  <div className="space-y-3">
                    {data.aiInsights.map((insight, idx) => (
                      <AlertPanel
                        key={idx}
                        title={`Insight ${idx + 1}`}
                        message={insight}
                        type="info"
                      />
                    ))}
                  </div>
                )}

                <button
                  onClick={() => sendMessage('What are the best trading opportunities right now?')}
                  className="w-full px-4 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan rounded-lg hover:bg-neon-cyan/30 transition-colors"
                >
                  Request Trading Recommendations
                </button>
              </div>
            )}
          </div>
        </NeonCard>
      </div>
    </div>
  );
}

// Mock data
const mockData: MarketIntelligence = {
  marketRegime: 'TRENDING',
  htfBias: 'BULLISH',
  volatilityLevel: 'MEDIUM',
  volatilityIndex: 45.2,
  trendStrength: 72.5,
  sentimentScore: 0.68,
  topMovers: [
    { symbol: 'AAPL', change: 4.25, changePercent: 2.35, volume: 52000000, sentiment: 'bullish' },
    { symbol: 'TSLA', change: -8.50, changePercent: -3.46, volume: 89000000, sentiment: 'bearish' },
    { symbol: 'NVDA', change: 12.30, changePercent: 2.48, volume: 61000000, sentiment: 'bullish' },
    { symbol: 'BTCUSD', change: 1250, changePercent: 3.21, volume: 28000000000, sentiment: 'bullish' },
    { symbol: 'ETHUSD', change: -45, changePercent: -2.15, volume: 15000000000, sentiment: 'bearish' }
  ],
  aiInsights: [
    'Strong bullish momentum on 4H charts across major indices. HTF structure remains intact.',
    'Crypto markets showing correlation breakdown with equities - potential independent uptrend developing.',
    'Volatility compression on daily timeframe suggests potential breakout within 24-48 hours.',
    'News sentiment heavily favoring tech sector - AI and semiconductor names outperforming.',
    'Order flow analysis indicates institutional accumulation in quality growth stocks.'
  ]
};
