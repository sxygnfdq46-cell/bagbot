'use client';

import { useState } from 'react';
import { NeonCard } from '@/components/neon/NeonCard';
import { NeonButton } from '@/components/neon/NeonButton';
import { NeonTabs } from '@/components/neon/NeonTabs';
import { NeonBadge } from '@/components/neon/NeonBadge';
import { DataStream } from '@/components/neon/DataStream';
import { useRealTimeSignals } from '@/hooks/useRealTimeSignals';
import { useMarketData } from '@/hooks/useMarketData';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
}

interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: string;
}

export default function TradingTerminalPage() {
  const [activeTab, setActiveTab] = useState('positions');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  
  const signals = useRealTimeSignals(15);
  const marketData = useMarketData([selectedSymbol]);

  // Mock data - would come from API
  const [positions, setPositions] = useState<Position[]>([
    {
      id: '1',
      symbol: 'AAPL',
      side: 'LONG',
      entryPrice: 178.50,
      currentPrice: 181.25,
      quantity: 100,
      pnl: 275.00,
      pnlPercent: 1.54
    },
    {
      id: '2',
      symbol: 'TSLA',
      side: 'SHORT',
      entryPrice: 245.80,
      currentPrice: 242.30,
      quantity: 50,
      pnl: 175.00,
      pnlPercent: 1.42
    }
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      symbol: 'NVDA',
      type: 'BUY',
      price: 495.30,
      quantity: 25,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    }
  ]);

  const streamItems = signals.map(signal => ({
    id: signal.id,
    timestamp: signal.timestamp,
    type: signal.signal === 'BUY' ? 'buy' as const : signal.signal === 'SELL' ? 'sell' as const : 'info' as const,
    message: `${signal.strategy}: ${signal.signal} ${signal.symbol} @ $${signal.price.toFixed(2)}`,
    value: `${(signal.confidence * 100).toFixed(0)}%`
  }));

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Live Trading Terminal</h1>
        <p className="text-gray-400">Execute and monitor trades in real-time</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <NeonCard glow="cyan" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total P&L</p>
              <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-neon-cyan opacity-50" />
          </div>
        </NeonCard>

        <NeonCard glow="green" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Open Positions</p>
              <p className="text-2xl font-bold text-white">{positions.length}</p>
            </div>
            <Activity className="w-8 h-8 text-neon-green opacity-50" />
          </div>
        </NeonCard>

        <NeonCard glow="magenta" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Pending Orders</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => o.status === 'PENDING').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-neon-magenta opacity-50" />
          </div>
        </NeonCard>

        <NeonCard glow="yellow" className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Signals Today</p>
              <p className="text-2xl font-bold text-white">{signals.length}</p>
            </div>
            <Activity className="w-8 h-8 text-neon-yellow opacity-50" />
          </div>
        </NeonCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trading Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Positions & Orders */}
          <NeonCard glow="cyan">
            <NeonTabs
              tabs={[
                { id: 'positions', label: 'Positions', badge: positions.length },
                { id: 'orders', label: 'Orders', badge: orders.length },
                { id: 'history', label: 'History' }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              glow="cyan"
            />

            <div className="p-6">
              {activeTab === 'positions' && (
                <div className="space-y-3">
                  {positions.length > 0 ? (
                    positions.map(position => (
                      <div
                        key={position.id}
                        className="p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{position.symbol}</span>
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
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400">Entry</p>
                            <p className="text-white font-medium">${position.entryPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Current</p>
                            <p className="text-white font-medium">${position.currentPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Quantity</p>
                            <p className="text-white font-medium">{position.quantity}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <NeonButton variant="secondary" size="sm">
                            Modify
                          </NeonButton>
                          <NeonButton variant="danger" size="sm">
                            Close
                          </NeonButton>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No open positions</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {orders.length > 0 ? (
                    orders.map(order => (
                      <div
                        key={order.id}
                        className="p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">{order.symbol}</span>
                            <NeonBadge 
                              variant={order.type === 'BUY' ? 'green' : 'red'}
                              size="sm"
                            >
                              {order.type}
                            </NeonBadge>
                            <NeonBadge 
                              variant={
                                order.status === 'FILLED' ? 'green' :
                                order.status === 'PENDING' ? 'yellow' : 'gray'
                              }
                              size="sm"
                            >
                              {order.status}
                            </NeonBadge>
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(order.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-400">Price</p>
                            <p className="text-white font-medium">${order.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400">Quantity</p>
                            <p className="text-white font-medium">{order.quantity}</p>
                          </div>
                        </div>

                        {order.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <NeonButton variant="secondary" size="sm">
                              Modify
                            </NeonButton>
                            <NeonButton variant="danger" size="sm">
                              Cancel
                            </NeonButton>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No pending orders</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Trade history will appear here</p>
                </div>
              )}
            </div>
          </NeonCard>
        </div>

        {/* Signal Stream */}
        <div>
          <NeonCard glow="magenta" className="h-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Live Signals</h3>
              <DataStream 
                items={streamItems}
                maxItems={15}
                autoScroll
              />
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  );
}
