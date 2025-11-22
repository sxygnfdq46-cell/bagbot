'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Activity, Target, Zap, Home, LayoutDashboard, BarChart3, Radio, FileText, Settings, SlidersHorizontal, Filter as FilterIcon } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';

export default function SignalsPage() {
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [minConfidence, setMinConfidence] = useState(70);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const signals = [
    {
      pair: 'BTC/USDT',
      type: 'BUY',
      price: '$43,250.00',
      target: '$45,800.00',
      confidence: 87,
      trend: 'up',
      strength: 'Strong',
      timeframe: '4H',
      timestamp: '2 min ago'
    },
    {
      pair: 'ETH/USDT',
      type: 'BUY',
      price: '$2,340.50',
      target: '$2,580.00',
      confidence: 92,
      trend: 'up',
      strength: 'Very Strong',
      timeframe: '1H',
      timestamp: '5 min ago'
    },
    {
      pair: 'SOL/USDT',
      type: 'SELL',
      price: '$98.50',
      target: '$89.20',
      confidence: 75,
      trend: 'down',
      strength: 'Moderate',
      timeframe: '1D',
      timestamp: '12 min ago'
    },
    {
      pair: 'ADA/USDT',
      type: 'BUY',
      price: '$0.52',
      target: '$0.58',
      confidence: 81,
      trend: 'up',
      strength: 'Strong',
      timeframe: '4H',
      timestamp: '18 min ago'
    },
    {
      pair: 'MATIC/USDT',
      type: 'SELL',
      price: '$0.89',
      target: '$0.82',
      confidence: 68,
      trend: 'down',
      strength: 'Moderate',
      timeframe: '1H',
      timestamp: '25 min ago'
    },
    {
      pair: 'AVAX/USDT',
      type: 'BUY',
      price: '$37.20',
      target: '$41.50',
      confidence: 95,
      trend: 'up',
      strength: 'Very Strong',
      timeframe: '1D',
      timestamp: '32 min ago'
    },
    {
      pair: 'DOT/USDT',
      type: 'BUY',
      price: '$6.45',
      target: '$7.10',
      confidence: 79,
      trend: 'up',
      strength: 'Strong',
      timeframe: '4H',
      timestamp: '45 min ago'
    },
    {
      pair: 'LINK/USDT',
      type: 'SELL',
      price: '$14.85',
      target: '$13.20',
      confidence: 71,
      trend: 'down',
      strength: 'Moderate',
      timeframe: '1H',
      timestamp: '1 hour ago'
    }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'from-[#4ADE80] to-[#22C55E]';
    if (confidence >= 80) return 'from-[#F9D949] to-[#EAB308]';
    if (confidence >= 70) return 'from-[#60A5FA] to-[#3B82F6]';
    return 'from-[#7C2F39] to-[#991B1B]';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 80) return 'High';
    if (confidence >= 70) return 'Medium';
    return 'Low';
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/signals" />
      <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-[#FFFBE7]/30">/</span>
          <span className="text-[#F9D949] font-semibold">Signals</span>
        </nav>

        {/* Quick Navigation */}
        <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/charts" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Charts
          </Link>
          <Link href="/signals" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
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
              AI Trading Signals
            </span>
          </h1>
          <p className="text-[#FFFBE7]/60 text-base md:text-lg mb-4 md:mb-6">Real-time algorithmic trading recommendations</p>
          
          {/* Filter Controls */}
          <div className="p-4 md:p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 glass-5d depth-5d-2 relative overflow-hidden">
            <div className="absolute inset-0 holographic-5d opacity-5 pointer-events-none" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <FilterIcon className="w-5 h-5 text-[#F9D949]" />
              <h3 className="text-lg font-bold text-[#FFFBE7]">Filter Signals</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">Signal Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'buy' | 'sell')}
                  className="w-full px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] focus:border-[#F9D949] focus:outline-none"
                >
                  <option value="all">All Signals</option>
                  <option value="buy">Buy Only</option>
                  <option value="sell">Sell Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                  Min Confidence: <span className="text-[#F9D949]">{minConfidence}%</span>
                </label>
                <input
                  type="range"
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="5"
                  className="w-full h-2 rounded-full bg-black/50 appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #7C2F39 0%, #F9D949 ${minConfidence}%, rgba(124, 47, 57, 0.3) ${minConfidence}%)`,
                  }}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setShowOnlyActive(!showOnlyActive)}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${
                    showOnlyActive
                      ? 'bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7]'
                      : 'bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50'
                  }`}
                >
                  {showOnlyActive ? '✓ ' : ''}Active Only
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {[
            { label: 'Active Signals', value: '24', icon: Activity, color: 'text-[#F9D949]' },
            { label: 'Avg Confidence', value: '82%', icon: Target, color: 'text-[#4ADE80]' },
            { label: 'Success Rate', value: '73.2%', icon: TrendingUp, color: 'text-[#60A5FA]' },
            { label: 'Signals Today', value: '47', icon: Zap, color: 'text-[#7C2F39]' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all glass-5d depth-5d-2 inner-glow-5d"
              >
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-[#FFFBE7]/60 text-xs md:text-sm font-semibold">{stat.label}</span>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
                </div>
                <div className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Signals List */}
        <div className="space-y-4">
          {signals
            .filter(signal => {
              if (filterType !== 'all' && signal.type.toLowerCase() !== filterType) return false;
              if (signal.confidence < minConfidence) return false;
              return true;
            })
            .map((signal, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all group relative overflow-hidden"
            >
              {/* Live pulse indicator */}
              <div className="absolute top-2 right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ADE80]"></span>
                </span>
              </div>
              
              <div className="grid lg:grid-cols-12 gap-6 items-center">
                {/* Signal Type & Pair */}
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className={`relative p-3 rounded-xl ${
                      signal.type === 'BUY' 
                        ? 'bg-[#4ADE80]/20' 
                        : 'bg-[#F87171]/20'
                    }`}>
                      <div className={`absolute inset-0 rounded-xl blur-md animate-pulse ${
                        signal.type === 'BUY' ? 'bg-[#4ADE80]/30' : 'bg-[#F87171]/30'
                      }`} />
                      {signal.trend === 'up' ? (
                        <ArrowUp className={`relative w-6 h-6 animate-pulse ${
                          signal.type === 'BUY' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                        }`} />
                      ) : (
                        <ArrowDown className={`relative w-6 h-6 animate-pulse ${
                          signal.type === 'BUY' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                        }`} />
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[#FFFBE7] animate-fade-in">{signal.pair}</div>
                      <div className={`text-sm font-bold animate-pulse ${
                        signal.type === 'BUY' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                      }`}>
                        {signal.type} SIGNAL
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="lg:col-span-3">
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-[#FFFBE7]/50 mb-1">Entry Price</div>
                      <div className="text-lg font-bold text-[#FFFBE7] animate-counter">{signal.price}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#FFFBE7]/50 mb-1">Target Price</div>
                      <div className="text-lg font-bold text-[#F9D949] animate-counter">{signal.target}</div>
                    </div>
                  </div>
                </div>

                {/* Confidence Level */}
                <div className="lg:col-span-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-[#FFFBE7]/50 font-semibold">Confidence Level</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#FFFBE7]">{signal.confidence}%</span>
                      <span className="text-xs text-[#FFFBE7]/60 px-2 py-1 rounded bg-black/50">
                        {getConfidenceLabel(signal.confidence)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full rounded-full bg-gradient-to-r ${getConfidenceColor(signal.confidence)} transition-all duration-500`}
                      style={{ width: `${signal.confidence}%` }}
                    />
                  </div>
                  
                  {/* Trend Indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    {signal.trend === 'up' ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-[#4ADE80]" />
                        <TrendingUp className="w-4 h-4 text-[#4ADE80] opacity-70" />
                        <TrendingUp className="w-4 h-4 text-[#4ADE80] opacity-40" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-4 h-4 text-[#F87171]" />
                        <TrendingDown className="w-4 h-4 text-[#F87171] opacity-70" />
                        <TrendingDown className="w-4 h-4 text-[#F87171] opacity-40" />
                      </div>
                    )}
                    <span className={`text-xs font-bold ${
                      signal.trend === 'up' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                    }`}>
                      {signal.strength} {signal.trend === 'up' ? 'Uptrend' : 'Downtrend'}
                    </span>
                  </div>
                </div>

                {/* Meta Info */}
                <div className="lg:col-span-2 text-right">
                  <div className="space-y-2">
                    <div className="px-3 py-1.5 rounded-lg bg-[#7C2F39]/20 border border-[#7C2F39]/30 inline-block">
                      <span className="text-xs font-bold text-[#F9D949]">{signal.timeframe}</span>
                    </div>
                    <div className="text-xs text-[#FFFBE7]/40">{signal.timestamp}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#F9D949]/20">
              <Zap className="w-6 h-6 text-[#F9D949]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-2">About AI Signals</h3>
              <p className="text-[#FFFBE7]/60 text-sm leading-relaxed">
                Our AI-powered trading signals analyze multiple indicators including price action, volume, 
                momentum, and market sentiment. Each signal includes a confidence score based on historical 
                accuracy and current market conditions. Higher confidence signals have shown greater success 
                rates in backtesting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
