'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Activity, Home, BarChart3, Radio, FileText, Settings, LayoutDashboard, Search, SlidersHorizontal } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';

export default function ChartsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name');
  const tickers = [
    { pair: 'BTC/USDT', price: '$43,250.00', change: '+2.4%', trend: 'up' },
    { pair: 'ETH/USDT', price: '$2,340.50', change: '+1.8%', trend: 'up' },
    { pair: 'SOL/USDT', price: '$98.50', change: '+3.2%', trend: 'up' },
    { pair: 'ADA/USDT', price: '$0.52', change: '-1.2%', trend: 'down' }
  ];

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/charts" />
      <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-[#FFFBE7]/30">/</span>
          <span className="text-[#F9D949] font-semibold">Charts</span>
        </nav>

        {/* Quick Navigation */}
        <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/charts" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
            Charts
          </Link>
          <Link href="/signals" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Signals
          </Link>
          <Link href="/logs" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs
          </Link>
          <Link href="/settings" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3">
            <span className="bg-gradient-to-r from-[#FFFBE7] to-[#F9D949] bg-clip-text text-transparent">
              Market Overview
            </span>
          </h1>
          <p className="text-[#FFFBE7]/60 text-base md:text-lg mb-4 md:mb-6">Real-time market analysis & charts</p>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#FFFBE7]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trading pairs..."
                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] text-sm md:text-base placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 md:w-5 md:h-5 text-[#FFFBE7]/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'change')}
                className="px-3 md:px-4 py-2.5 md:py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] text-sm md:text-base focus:border-[#F9D949] focus:outline-none transition-all"
              >
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="change">Sort by Change</option>
              </select>
            </div>
          </div>
        </div>

        {/* Price Ticker */}
        <div className="mb-6 md:mb-8 overflow-x-auto">
          <div className="flex gap-3 md:gap-4 min-w-max pb-2">
            {tickers.map((ticker, index) => (
              <div
                key={index}
                className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all"
              >
                <div>
                  <div className="text-[#FFFBE7]/60 text-xs font-semibold uppercase tracking-wide mb-1">
                    {ticker.pair}
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-[#FFFBE7]">
                    {ticker.price}
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-bold text-xs md:text-sm ${
                  ticker.trend === 'up' 
                    ? 'bg-[#4ADE80]/20 text-[#4ADE80]' 
                    : 'bg-[#F87171]/20 text-[#F87171]'
                }`}>
                  {ticker.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {ticker.change}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Large Chart */}
          <div className="lg:col-span-2">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#FFFBE7]">BTC/USDT Price Chart</h2>
                <div className="flex gap-2">
                  {['1H', '4H', '1D', '1W'].map((timeframe, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        index === 2 
                          ? 'bg-[#7C2F39] text-[#FFFBE7]' 
                          : 'bg-black/50 text-[#FFFBE7]/60 hover:bg-[#7C2F39]/50'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Placeholder Chart */}
              <div className="relative h-96 rounded-xl bg-black/50 border border-[#7C2F39]/20 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="w-16 h-16 text-[#7C2F39]/30 mx-auto mb-4" />
                    <p className="text-[#FFFBE7]/30 font-semibold">Chart Visualization Area</p>
                    <p className="text-[#FFFBE7]/20 text-sm mt-2">Live chart data will appear here</p>
                  </div>
                </div>
                
                {/* Decorative Grid Lines */}
                <div className="absolute inset-0">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-full border-t border-[#7C2F39]/10"
                      style={{ top: `${(i + 1) * 16.66}%` }}
                    />
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute h-full border-l border-[#7C2F39]/10"
                      style={{ left: `${(i + 1) * 10}%` }}
                    />
                  ))}
                </div>

                {/* Fake Chart Line */}
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  <path
                    d="M 0 300 Q 100 250, 200 280 T 400 240 T 600 200 T 800 180 T 1000 150"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C2F39" />
                      <stop offset="50%" stopColor="#F9D949" />
                      <stop offset="100%" stopColor="#4ADE80" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Chart Info */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[
                  { label: 'Open', value: '$42,890' },
                  { label: 'High', value: '$43,450' },
                  { label: 'Low', value: '$42,650' },
                  { label: 'Volume', value: '$2.4B' }
                ].map((info, index) => (
                  <div key={index}>
                    <div className="text-xs text-[#FFFBE7]/50 mb-1">{info.label}</div>
                    <div className="text-lg font-bold text-[#FFFBE7]">{info.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Market Stats */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-4">Market Stats</h3>
              <div className="space-y-4">
                {[
                  { label: '24h Volume', value: '$45.2B', color: 'text-[#F9D949]' },
                  { label: 'Market Cap', value: '$842B', color: 'text-[#4ADE80]' },
                  { label: 'Volatility', value: '12.4%', color: 'text-[#60A5FA]' },
                  { label: 'Liquidity', value: 'High', color: 'text-[#7C2F39]' }
                ].map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-[#FFFBE7]/60 text-sm">{stat.label}</span>
                    <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Movers */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-4">Top Movers</h3>
              <div className="space-y-3">
                {[
                  { symbol: 'SOL', change: '+8.2%', trend: 'up' },
                  { symbol: 'AVAX', change: '+5.4%', trend: 'up' },
                  { symbol: 'MATIC', change: '-3.1%', trend: 'down' }
                ].map((mover, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-black/30">
                    <span className="text-[#FFFBE7] font-semibold">{mover.symbol}</span>
                    <span className={`font-bold ${
                      mover.trend === 'up' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                    }`}>
                      {mover.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Charts Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { pair: 'ETH/USDT', price: '$2,340.50', change: '+1.8%' },
            { pair: 'SOL/USDT', price: '$98.50', change: '+3.2%' },
            { pair: 'ADA/USDT', price: '$0.52', change: '-1.2%' }
          ].map((chart, index) => (
            <div key={index} className="p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#FFFBE7]">{chart.pair}</h3>
                  <p className="text-2xl font-black text-[#F9D949] mt-1">{chart.price}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  chart.change.startsWith('+') 
                    ? 'bg-[#4ADE80]/20 text-[#4ADE80]' 
                    : 'bg-[#F87171]/20 text-[#F87171]'
                }`}>
                  {chart.change}
                </span>
              </div>
              
              {/* Mini Chart Placeholder */}
              <div className="h-32 rounded-lg bg-black/50 border border-[#7C2F39]/20 relative overflow-hidden">
                <div className="absolute inset-0">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="absolute w-full border-t border-[#7C2F39]/10"
                      style={{ top: `${(i + 1) * 25}%` }}
                    />
                  ))}
                </div>
                <svg className="absolute inset-0 w-full h-full opacity-20">
                  <path
                    d={`M 0 ${80 + Math.random() * 20} ${[...Array(10)].map((_, i) => 
                      `L ${i * 40} ${60 + Math.random() * 40}`
                    ).join(' ')}`}
                    stroke="#F9D949"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
