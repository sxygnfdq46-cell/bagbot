'use client';

import { useState, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { MetricCard } from '@/components/neon/MetricCard';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { NeonTabs } from '@/components/neon/NeonTabs';
import { TrendingUp, DollarSign, PieChart, BarChart3, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PortfolioData {
  totalEquity: number;
  totalPnL: number;
  totalPnLPercent: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  positions: Position[];
  equityCurve: EquityPoint[];
  monthlyPerformance: MonthlyData[];
  strategyBreakdown: StrategyData[];
  marketBreakdown: MarketData[];
}

interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown: number;
}

interface MonthlyData {
  month: string;
  pnl: number;
  trades: number;
  winRate: number;
}

interface StrategyData {
  name: string;
  pnl: number;
  trades: number;
  color: string;
}

interface MarketData {
  name: string;
  value: number;
  color: string;
}

export default function PortfolioAnalyticsPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('equity');

  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/portfolio/analytics');
      const fetchedData = await response.json();
      setData(fetchedData || mockData);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading portfolio analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Portfolio Analytics</h1>
        <p className="text-gray-400">Comprehensive portfolio performance analysis</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Equity"
          value={`$${data.totalEquity.toLocaleString()}`}
          subtitle="Current portfolio value"
          icon={<DollarSign />}
          glow="cyan"
        />
        
        <MetricCard
          title="Total P&L"
          value={`$${data.totalPnL >= 0 ? '+' : ''}${data.totalPnL.toLocaleString()}`}
          subtitle={`${data.totalPnLPercent >= 0 ? '+' : ''}${data.totalPnLPercent.toFixed(2)}%`}
          trend={data.totalPnL >= 0 ? 'up' : 'down'}
          trendValue={`${data.totalPnLPercent >= 0 ? '+' : ''}${data.totalPnLPercent.toFixed(2)}%`}
          icon={<TrendingUp />}
          glow={data.totalPnL >= 0 ? 'green' : 'red'}
        />
        
        <MetricCard
          title="Daily P&L"
          value={`$${data.dailyPnL >= 0 ? '+' : ''}${data.dailyPnL.toLocaleString()}`}
          subtitle="Today's performance"
          trend={data.dailyPnL >= 0 ? 'up' : 'down'}
          icon={<Calendar />}
          glow="magenta"
        />
        
        <MetricCard
          title="Active Positions"
          value={data.positions.length}
          subtitle={`$${data.positions.reduce((sum, p) => sum + p.pnl, 0).toLocaleString()} unrealized`}
          icon={<BarChart3 />}
          glow="yellow"
        />
      </div>

      {/* Charts Section */}
      <div className="mb-6">
        <NeonCard glow="cyan">
          <NeonTabs
            tabs={[
              { id: 'equity', label: 'Equity Curve', icon: <TrendingUp className="w-4 h-4" /> },
              { id: 'monthly', label: 'Monthly Performance', icon: <Calendar className="w-4 h-4" /> },
              { id: 'breakdown', label: 'Breakdown', icon: <PieChart className="w-4 h-4" /> }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            glow="cyan"
          />

          <div className="p-6">
            {activeTab === 'equity' && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={data.equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#131318', 
                        border: '1px solid #1f1f28',
                        borderRadius: '8px'
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#00f0ff" 
                      strokeWidth={2}
                      fill="url(#equityGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'monthly' && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Monthly Performance</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data.monthlyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      tick={{ fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#131318', 
                        border: '1px solid #1f1f28',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="#00f0ff"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Strategy Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={data.strategyBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="pnl"
                        label={(entry) => entry.name}
                      >
                        {data.strategyBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#131318', 
                          border: '1px solid #1f1f28',
                          borderRadius: '8px'
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {data.strategyBreakdown.map((strategy, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: strategy.color }} />
                          <span className="text-sm text-white">{strategy.name}</span>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold ${strategy.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                            ${strategy.pnl >= 0 ? '+' : ''}{strategy.pnl.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">({strategy.trades} trades)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Market Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={data.marketBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={(entry) => entry.name}
                      >
                        {data.marketBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#131318', 
                          border: '1px solid #1f1f28',
                          borderRadius: '8px'
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {data.marketBreakdown.map((market, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/30 rounded">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: market.color }} />
                          <span className="text-sm text-white">{market.name}</span>
                        </div>
                        <span className="text-sm font-bold text-neon-cyan">
                          ${market.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </NeonCard>
      </div>

      {/* Active Positions */}
      <NeonCard glow="magenta">
        <div className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Active Positions</h3>
          <div className="space-y-3">
            {data.positions.length > 0 ? (
              data.positions.map((position, idx) => (
                <div key={idx} className="p-4 bg-gray-900/30 rounded-lg border border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-white">{position.symbol}</span>
                      <NeonBadge 
                        variant={position.side === 'LONG' ? 'green' : 'red'}
                        size="sm"
                      >
                        {position.side}
                      </NeonBadge>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${position.pnl >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </div>
                      <div className={`text-sm ${position.pnlPercent >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Size</p>
                      <p className="text-white font-medium">{position.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Entry</p>
                      <p className="text-white font-medium">${position.entryPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Current</p>
                      <p className="text-white font-medium">${position.currentPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Value</p>
                      <p className="text-white font-medium">${(position.size * position.currentPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No active positions</p>
              </div>
            )}
          </div>
        </div>
      </NeonCard>
    </div>
  );
}

// Mock data
const mockData: PortfolioData = {
  totalEquity: 25430.50,
  totalPnL: 5430.50,
  totalPnLPercent: 27.15,
  dailyPnL: 234.50,
  weeklyPnL: 1250.30,
  monthlyPnL: 3120.75,
  positions: [
    {
      symbol: 'AAPL',
      side: 'LONG',
      size: 100,
      entryPrice: 178.50,
      currentPrice: 181.25,
      pnl: 275.00,
      pnlPercent: 1.54
    },
    {
      symbol: 'TSLA',
      side: 'SHORT',
      size: 50,
      entryPrice: 245.80,
      currentPrice: 242.30,
      pnl: 175.00,
      pnlPercent: 1.42
    }
  ],
  equityCurve: [
    { timestamp: 'Jan', equity: 20000, drawdown: 0 },
    { timestamp: 'Feb', equity: 20500, drawdown: -2.5 },
    { timestamp: 'Mar', equity: 21200, drawdown: 0 },
    { timestamp: 'Apr', equity: 21800, drawdown: -1.8 },
    { timestamp: 'May', equity: 22500, drawdown: 0 },
    { timestamp: 'Jun', equity: 23100, drawdown: -3.2 },
    { timestamp: 'Jul', equity: 23800, drawdown: 0 },
    { timestamp: 'Aug', equity: 24200, drawdown: -1.5 },
    { timestamp: 'Sep', equity: 24900, drawdown: 0 },
    { timestamp: 'Oct', equity: 25200, drawdown: -2.1 },
    { timestamp: 'Nov', equity: 25430, drawdown: 0 }
  ],
  monthlyPerformance: [
    { month: 'Jan', pnl: 500, trades: 42, winRate: 65.5 },
    { month: 'Feb', pnl: 700, trades: 38, winRate: 68.4 },
    { month: 'Mar', pnl: 600, trades: 45, winRate: 64.4 },
    { month: 'Apr', pnl: 800, trades: 51, winRate: 70.6 },
    { month: 'May', pnl: 450, trades: 33, winRate: 63.6 },
    { month: 'Jun', pnl: 610, trades: 40, winRate: 67.5 },
    { month: 'Jul', pnl: 720, trades: 47, winRate: 68.1 },
    { month: 'Aug', pnl: 380, trades: 29, winRate: 65.5 },
    { month: 'Sep', pnl: 690, trades: 44, winRate: 70.5 },
    { month: 'Oct', pnl: 530, trades: 36, winRate: 66.7 },
    { month: 'Nov', pnl: 450, trades: 31, winRate: 67.7 }
  ],
  strategyBreakdown: [
    { name: 'Order Block', pnl: 2100, trades: 142, color: '#00f0ff' },
    { name: 'FVG', pnl: 1450, trades: 98, color: '#ff00ff' },
    { name: 'Liquidity Sweeps', pnl: 980, trades: 76, color: '#00ff00' },
    { name: 'Trend Continuation', pnl: 650, trades: 89, color: '#ffff00' },
    { name: 'Mean Reversion', pnl: 250, trades: 63, color: '#ff6600' }
  ],
  marketBreakdown: [
    { name: 'Crypto', value: 12500, color: '#00f0ff' },
    { name: 'Forex', value: 8200, color: '#ff00ff' },
    { name: 'Stocks', value: 4730, color: '#00ff00' }
  ]
};
