'use client';

import { useState, useEffect } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { MetricCard } from '@/components/neon/MetricCard';
import { AlertPanel } from '@/components/neon/AlertPanel';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { ReactorCore } from '@/components/neon/ReactorCore';
import { DataStream } from '@/components/neon/DataStream';
import { useRiskEvents } from '@/hooks/useRiskEvents';
import { AlertTriangle, Shield, TrendingDown, Activity, XCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RiskData {
  currentDrawdown: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  dailyLossUsed: number;
  circuitBreakerStatus: 'active' | 'idle' | 'triggered';
  riskMultiplier: number;
  emotionalState: string;
  activeRiskEvents: number;
  drawdownHistory: DrawdownPoint[];
  dailyLossHistory: DailyLoss[];
  riskLimits: RiskLimit[];
}

interface DrawdownPoint {
  timestamp: string;
  drawdown: number;
  equity: number;
}

interface DailyLoss {
  date: string;
  loss: number;
  limit: number;
}

interface RiskLimit {
  type: string;
  current: number;
  limit: number;
  status: 'safe' | 'warning' | 'critical';
}

export default function RiskAnalyticsPage() {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const riskEvents = useRiskEvents(20);

  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(fetchRiskData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskData = async () => {
    try {
      const response = await fetch('/api/risk/analytics');
      const fetchedData = await response.json();
      setData(fetchedData || mockData);
    } catch (error) {
      console.error('Failed to fetch risk data:', error);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const triggerCircuitBreaker = async () => {
    try {
      await fetch('/api/risk/circuit-breaker/trigger', {
        method: 'POST'
      });
      fetchRiskData();
    } catch (error) {
      console.error('Failed to trigger circuit breaker:', error);
    }
  };

  const resetCircuitBreaker = async () => {
    try {
      await fetch('/api/risk/circuit-breaker/reset', {
        method: 'POST'
      });
      fetchRiskData();
    } catch (error) {
      console.error('Failed to reset circuit breaker:', error);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin-slow w-16 h-16 border-4 border-neon-yellow border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading risk analytics...</p>
        </div>
      </div>
    );
  }

  const drawdownPercent = (data.currentDrawdown / data.maxDrawdown * 100);
  const dailyLossPercent = (data.dailyLossUsed / data.dailyLossLimit * 100);

  const streamItems = riskEvents.map(event => ({
    id: event.id,
    timestamp: event.timestamp,
    type: event.severity === 'critical' || event.severity === 'high' ? 'error' as const : 'warning' as const,
    message: `${event.type.replace('_', ' ').toUpperCase()}: ${event.message}`,
    value: event.value ? `${event.value.toFixed(2)}` : undefined
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Risk Analytics</h1>
            <p className="text-gray-400">Real-time risk monitoring and control</p>
          </div>
          <ReactorCore 
            size="md" 
            status={
              data.circuitBreakerStatus === 'triggered' ? 'error' :
              data.activeRiskEvents > 5 ? 'warning' :
              'active'
            }
            showRings 
          />
        </div>
      </div>

      {/* Circuit Breaker Alert */}
      {data.circuitBreakerStatus === 'triggered' && (
        <div className="mb-6">
          <AlertPanel
            title="CIRCUIT BREAKER TRIGGERED"
            message="All trading has been halted due to risk threshold breach. Review conditions and reset when safe."
            type="critical"
            dismissible={false}
          />
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Current Drawdown"
          value={`${data.currentDrawdown.toFixed(2)}%`}
          subtitle={`${drawdownPercent.toFixed(0)}% of max allowed`}
          trend={data.currentDrawdown > 0 ? 'down' : 'neutral'}
          icon={<TrendingDown />}
          glow={drawdownPercent > 80 ? 'red' : drawdownPercent > 50 ? 'yellow' : 'green'}
        />
        
        <MetricCard
          title="Daily Loss"
          value={`$${data.dailyLossUsed.toFixed(2)}`}
          subtitle={`${dailyLossPercent.toFixed(0)}% of limit`}
          icon={<XCircle />}
          glow={dailyLossPercent > 80 ? 'red' : dailyLossPercent > 50 ? 'yellow' : 'cyan'}
        />
        
        <MetricCard
          title="Risk Multiplier"
          value={`${data.riskMultiplier.toFixed(2)}x`}
          subtitle={`Emotional state: ${data.emotionalState}`}
          icon={<Activity />}
          glow="magenta"
        />
        
        <MetricCard
          title="Active Alerts"
          value={data.activeRiskEvents}
          subtitle="Risk events triggered"
          icon={<AlertTriangle />}
          glow={data.activeRiskEvents > 5 ? 'yellow' : 'green'}
        />
      </div>

      {/* Drawdown Chart */}
      <div className="mb-6">
        <NeonCard glow="yellow">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Drawdown Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.drawdownHistory}>
                <defs>
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffff00" stopOpacity={0}/>
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
                />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  stroke="#ffff00" 
                  strokeWidth={2}
                  fill="url(#drawdownGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Loss Visualization */}
        <NeonCard glow="red">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Daily Loss Limit</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Used</span>
                <span className="text-lg font-bold text-red-400">
                  ${data.dailyLossUsed.toFixed(2)} / ${data.dailyLossLimit.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${
                    dailyLossPercent > 80 ? 'bg-red-500' :
                    dailyLossPercent > 50 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(dailyLossPercent, 100)}%` }}
                />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.dailyLossHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f28" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
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
                <Line 
                  type="monotone" 
                  dataKey="loss" 
                  stroke="#ff0000" 
                  strokeWidth={2}
                  dot={{ fill: '#ff0000', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="limit" 
                  stroke="#ffff00" 
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </NeonCard>

        {/* Circuit Breaker Control */}
        <NeonCard glow={data.circuitBreakerStatus === 'triggered' ? 'red' : 'cyan'}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Circuit Breaker</h3>
            
            <div className="mb-6 text-center">
              <div className={`inline-block p-8 rounded-full ${
                data.circuitBreakerStatus === 'triggered' ? 'bg-red-500/20 border-4 border-red-500' :
                data.circuitBreakerStatus === 'active' ? 'bg-neon-green/20 border-4 border-neon-green' :
                'bg-gray-700/20 border-4 border-gray-700'
              } transition-all duration-300`}>
                <Shield className={`w-16 h-16 ${
                  data.circuitBreakerStatus === 'triggered' ? 'text-red-500 animate-pulse' :
                  data.circuitBreakerStatus === 'active' ? 'text-neon-green' :
                  'text-gray-500'
                }`} />
              </div>
              <div className="mt-4">
                <NeonBadge 
                  variant={
                    data.circuitBreakerStatus === 'triggered' ? 'red' :
                    data.circuitBreakerStatus === 'active' ? 'green' : 'gray'
                  }
                  size="lg"
                  pulse={data.circuitBreakerStatus === 'triggered'}
                >
                  {data.circuitBreakerStatus.toUpperCase()}
                </NeonBadge>
              </div>
            </div>

            <div className="space-y-3">
              {data.circuitBreakerStatus === 'triggered' ? (
                <>
                  <AlertPanel
                    title="Trading Halted"
                    message="All trading operations have been stopped to prevent further losses."
                    type="error"
                  />
                  <button
                    onClick={resetCircuitBreaker}
                    className="w-full px-4 py-3 bg-neon-green/20 border-2 border-neon-green text-neon-green font-bold rounded-lg hover:bg-neon-green/30 transition-colors"
                  >
                    RESET CIRCUIT BREAKER
                  </button>
                </>
              ) : (
                <button
                  onClick={triggerCircuitBreaker}
                  className="w-full px-4 py-3 bg-red-500/20 border-2 border-red-500 text-red-500 font-bold rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  EMERGENCY STOP
                </button>
              )}
            </div>
          </div>
        </NeonCard>
      </div>

      {/* Risk Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Limits Table */}
        <NeonCard glow="magenta">
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Risk Limits</h3>
            <div className="space-y-3">
              {data.riskLimits.map((limit, idx) => (
                <div key={idx} className="p-3 bg-gray-900/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{limit.type}</span>
                    <NeonBadge 
                      variant={
                        limit.status === 'critical' ? 'red' :
                        limit.status === 'warning' ? 'yellow' : 'green'
                      }
                      size="sm"
                    >
                      {limit.status.toUpperCase()}
                    </NeonBadge>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Current</span>
                    <span className="text-white font-medium">{limit.current.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Limit</span>
                    <span className="text-gray-300">{limit.limit.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        limit.status === 'critical' ? 'bg-red-500' :
                        limit.status === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((limit.current / limit.limit * 100), 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </NeonCard>

        {/* Risk Events Feed */}
        <NeonCard glow="orange">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Live Risk Events</h3>
              <NeonBadge variant="orange">{riskEvents.length} events</NeonBadge>
            </div>
            <DataStream 
              items={streamItems}
              maxItems={20}
              autoScroll
            />
          </div>
        </NeonCard>
      </div>
    </div>
  );
}

// Mock data
const mockData: RiskData = {
  currentDrawdown: 5.2,
  maxDrawdown: 10.0,
  dailyLossLimit: 500.0,
  dailyLossUsed: 145.30,
  circuitBreakerStatus: 'active',
  riskMultiplier: 0.85,
  emotionalState: 'NEUTRAL',
  activeRiskEvents: 3,
  drawdownHistory: [
    { timestamp: '09:00', drawdown: 0, equity: 25000 },
    { timestamp: '10:00', drawdown: -1.2, equity: 24700 },
    { timestamp: '11:00', drawdown: -2.5, equity: 24375 },
    { timestamp: '12:00', drawdown: -3.8, equity: 24050 },
    { timestamp: '13:00', drawdown: -5.2, equity: 23700 },
    { timestamp: '14:00', drawdown: -4.1, equity: 23975 },
    { timestamp: '15:00', drawdown: -3.2, equity: 24200 },
    { timestamp: '16:00', drawdown: -2.8, equity: 24300 }
  ],
  dailyLossHistory: [
    { date: 'Mon', loss: 120, limit: 500 },
    { date: 'Tue', loss: 85, limit: 500 },
    { date: 'Wed', loss: 210, limit: 500 },
    { date: 'Thu', loss: 95, limit: 500 },
    { date: 'Fri', loss: 145, limit: 500 }
  ],
  riskLimits: [
    { type: 'Max Position Size', current: 3.5, limit: 5.0, status: 'safe' },
    { type: 'Daily Loss Limit', current: 145.30, limit: 500.0, status: 'safe' },
    { type: 'Max Drawdown', current: 5.2, limit: 10.0, status: 'warning' },
    { type: 'Max Open Positions', current: 7, limit: 10, status: 'safe' },
    { type: 'Correlation Risk', current: 0.45, limit: 0.70, status: 'safe' }
  ]
};
