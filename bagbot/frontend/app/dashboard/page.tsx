'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendingUp, DollarSign, Target, Activity, Server, Zap, Home, BarChart3, Radio, FileText, Settings, RefreshCw, Download, Filter, Play, Pause, ChevronDown } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';

export default function DashboardPage() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Bot controls
  const [botActive, setBotActive] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('1000');
  const [selectedStrategy, setSelectedStrategy] = useState('conservative');
  
  // Live chart data
  const [chartData, setChartData] = useState<number[]>(
    Array.from({ length: 20 }, () => Math.random() * 100 + 50)
  );
  
  // Live updates
  const [liveUpdates, setLiveUpdates] = useState<Array<{
    type: 'trade' | 'signal' | 'alert';
    message: string;
    time: string;
    id: number;
  }>>([
    { type: 'trade', message: 'BUY BTC/USDT @ $43,250 executed', time: '2 min ago', id: 1 },
    { type: 'signal', message: 'New bullish signal detected for ETH/USDT', time: '5 min ago', id: 2 },
    { type: 'trade', message: 'SELL SOL/USDT @ $98.50 completed', time: '8 min ago', id: 3 },
  ]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);
  
  // Simulate live chart updates
  useEffect(() => {
    if (botActive) {
      const interval = setInterval(() => {
        setChartData(prev => {
          const newData = [...prev.slice(1), Math.random() * 100 + 50];
          return newData;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [botActive]);
  
  // Simulate live updates when bot is active
  useEffect(() => {
    if (botActive) {
      const interval = setInterval(() => {
        const updateTypes: Array<'trade' | 'signal' | 'alert'> = ['trade', 'signal', 'alert'];
        const messages = [
          'BUY order executed successfully',
          'New signal detected',
          'Stop loss triggered',
          'Take profit reached',
          'Position opened',
          'Market analysis completed'
        ];
        
        const newUpdate = {
          type: updateTypes[Math.floor(Math.random() * updateTypes.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          time: 'Just now',
          id: Date.now()
        };
        
        setLiveUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [botActive]);

  const handleManualRefresh = () => {
    setLastUpdate(new Date());
  };
  
  const handleBotToggle = () => {
    setBotActive(!botActive);
  };
  
  const strategies = [
    { id: 'conservative', name: 'Conservative', desc: 'Low risk, steady gains' },
    { id: 'balanced', name: 'Balanced', desc: 'Medium risk, balanced returns' },
    { id: 'aggressive', name: 'Aggressive', desc: 'High risk, maximum returns' },
    { id: 'scalping', name: 'Scalping', desc: 'Quick trades, frequent signals' },
  ];
  const stats = [
    { 
      label: 'Total Trades', 
      value: '12,547', 
      change: '+234 today',
      icon: Target,
      color: 'from-[#7C2F39] to-[#C75B7A]',
      bgColor: 'from-[#7C2F39]/10 to-black'
    },
    { 
      label: 'Profit Today', 
      value: '+$4,287', 
      change: '+12.4%',
      icon: DollarSign,
      color: 'from-[#4ADE80] to-[#22C55E]',
      bgColor: 'from-[#4ADE80]/10 to-black'
    },
    { 
      label: 'Win Rate', 
      value: '73.2%', 
      change: '+2.1% this week',
      icon: TrendingUp,
      color: 'from-[#F9D949] to-[#FDE68A]',
      bgColor: 'from-[#F9D949]/10 to-black'
    },
    { 
      label: 'Active Positions', 
      value: '18', 
      change: '6 pending',
      icon: Activity,
      color: 'from-[#60A5FA] to-[#3B82F6]',
      bgColor: 'from-[#60A5FA]/10 to-black'
    }
  ];

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/dashboard" />
      <div className="min-h-screen bg-black p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-[#FFFBE7]/30">/</span>
          <span className="text-[#F9D949] font-semibold">Dashboard</span>
        </nav>

        {/* Quick Navigation */}
        <div className="mb-6 md:mb-8 flex flex-wrap gap-2 md:gap-3">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
            Dashboard
          </Link>
          <Link href="/charts" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
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

        {/* Header with Controls */}
        <div className="mb-8 md:mb-12">
          <div className="flex flex-col gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3">
                <span className="bg-gradient-to-r from-[#FFFBE7] to-[#F9D949] bg-clip-text text-transparent">
                  Trading Dashboard
                </span>
              </h1>
              <p className="text-[#FFFBE7]/60 text-base md:text-lg">Real-time trading operations & analytics</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={handleManualRefresh}
                className="px-3 md:px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] hover:border-[#F9D949]/50 transition-all flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 md:px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] hover:border-[#F9D949]/50 transition-all flex items-center gap-2 text-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
              <button className="px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] hover:from-[#991B1B] hover:to-[#7C2F39] transition-all flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#7C2F39]'}`} />
              <span className="text-[#FFFBE7]/60">Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-[#F9D949] hover:text-[#FDE68A] transition-colors"
            >
              {autoRefresh ? 'Disable' : 'Enable'} auto-refresh
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`relative p-6 rounded-2xl bg-gradient-to-br ${stat.bgColor} border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all group overflow-hidden glass-5d depth-5d-2 perspective-5d`}
              >
                {/* Holographic background layer */}
                <div className="absolute inset-0 holographic-5d pointer-events-none" />
                
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F9D949]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r ${stat.color} animate-pulse metallic-5d`} />
                
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg emboss-5d depth-5d-3`}>
                    <Icon className="w-6 h-6 text-black drop-shadow-lg" />
                  </div>
                </div>

                <div className="mb-2 relative z-10">
                  <div className="text-sm text-[#FFFBE7]/60 font-semibold tracking-wide uppercase mb-1">
                    {stat.label}
                  </div>
                  <div className="text-4xl font-black animate-fade-in">
                    <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent text-5d`}>
                      {stat.value}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-[#FFFBE7]/50 flex items-center gap-1 relative z-10">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  {stat.change}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bot Control Panel */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#FFFBE7] mb-4 md:mb-6 text-5d">Trading Bot Control</h2>
          
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 glass-5d depth-5d-3 perspective-5d relative overflow-hidden">
            {/* Holographic background */}
            <div className="absolute inset-0 holographic-5d opacity-10 pointer-events-none" />
            
            <div className="relative z-10 grid md:grid-cols-3 gap-6">
              {/* Bot Status & Control */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">Bot Status</label>
                  <button
                    onClick={handleBotToggle}
                    className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 depth-5d-2 emboss-5d ${
                      botActive
                        ? 'bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-black hover:from-[#22C55E] hover:to-[#4ADE80] shadow-[0_0_30px_rgba(74,222,128,0.5)]'
                        : 'bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] hover:from-[#991B1B] hover:to-[#7C2F39]'
                    }`}
                  >
                    {botActive ? (
                      <>
                        <Pause className="w-5 h-5" />
                        Stop Bot
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Start Bot
                      </>
                    )}
                  </button>
                </div>
                
                {botActive && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#4ADE80]/10 border border-[#4ADE80]/30">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ADE80]"></span>
                    </span>
                    <span className="text-[#4ADE80] text-sm font-semibold">Bot is running...</span>
                  </div>
                )}
              </div>
              
              {/* Stake Amount */}
              <div>
                <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">Stake Amount (USD)</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  disabled={botActive}
                  className={`w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] text-lg font-semibold focus:border-[#F9D949] focus:outline-none transition-all ${
                    botActive ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="1000"
                  min="100"
                  step="100"
                />
                <p className="text-xs text-[#FFFBE7]/50 mt-2">Minimum: $100</p>
              </div>
              
              {/* Strategy Selection */}
              <div>
                <label className="block text-sm font-semibold text-[#FFFBE7] mb-3">Trading Strategy</label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  disabled={botActive}
                  className={`w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] font-semibold focus:border-[#F9D949] focus:outline-none transition-all appearance-none ${
                    botActive ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {strategies.map(strategy => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#FFFBE7]/50 mt-2">
                  {strategies.find(s => s.id === selectedStrategy)?.desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Live Chart */}
          <div className="lg:col-span-2">
            <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#FFFBE7]">Live Performance</h2>
                  <p className="text-sm text-[#FFFBE7]/60">Real-time profit tracking</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#7C2F39]'}`} />
                  <span className="text-sm font-semibold text-[#FFFBE7]/60">
                    {botActive ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>
              </div>
              
              {/* Chart SVG */}
              <div className="relative h-64 md:h-80 bg-black/30 rounded-xl p-4">
                <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 75}
                      x2="800"
                      y2={i * 75}
                      stroke="rgba(124, 47, 57, 0.2)"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Chart line */}
                  <polyline
                    points={chartData.map((value, index) => 
                      `${(index / (chartData.length - 1)) * 800},${300 - (value / 150) * 300}`
                    ).join(' ')}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    className="animate-draw-line"
                  />
                  
                  {/* Gradient fill under line */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F9D949" />
                      <stop offset="50%" stopColor="#4ADE80" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                    <linearGradient id="fillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#F9D949" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F9D949" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  <polygon
                    points={`0,300 ${chartData.map((value, index) => 
                      `${(index / (chartData.length - 1)) * 800},${300 - (value / 150) * 300}`
                    ).join(' ')} 800,300`}
                    fill="url(#fillGradient)"
                  />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Live Updates Feed */}
          <div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#FFFBE7]">Live Updates</h3>
                <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-[#4ADE80] animate-pulse' : 'bg-[#7C2F39]'}`} />
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {liveUpdates.map((update) => (
                  <div
                    key={update.id}
                    className={`p-3 rounded-lg border transition-all animate-slide-in ${
                      update.type === 'trade'
                        ? 'bg-[#4ADE80]/5 border-[#4ADE80]/30'
                        : update.type === 'signal'
                        ? 'bg-[#F9D949]/5 border-[#F9D949]/30'
                        : 'bg-[#F87171]/5 border-[#F87171]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className={`text-xs font-bold uppercase ${
                          update.type === 'trade'
                            ? 'text-[#4ADE80]'
                            : update.type === 'signal'
                            ? 'text-[#F9D949]'
                            : 'text-[#F87171]'
                        }`}>
                          {update.type}
                        </span>
                        <p className="text-sm text-[#FFFBE7] mt-1">{update.message}</p>
                        <span className="text-xs text-[#FFFBE7]/50 mt-1 block">{update.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#FFFBE7] mb-6">System Health</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* API Status */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#4ADE80] rounded-xl blur-md animate-pulse" />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#4ADE80] to-[#22C55E] flex items-center justify-center shadow-lg">
                      <Server className="w-7 h-7 text-black" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#FFFBE7]">API Status</h3>
                    <p className="text-[#FFFBE7]/60 text-sm">Backend Service</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4ADE80]"></span>
                  </span>
                  <div className="w-3 h-3 rounded-full bg-[#4ADE80] animate-pulse" />
                  <span className="text-[#4ADE80] font-bold">Online</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#FFFBE7]/60">Response Time</span>
                  <span className="text-[#FFFBE7] font-semibold">42ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FFFBE7]/60">Uptime</span>
                  <span className="text-[#FFFBE7] font-semibold">99.97%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FFFBE7]/60">Last Check</span>
                  <span className="text-[#FFFBE7] font-semibold">2 sec ago</span>
                </div>
              </div>
            </div>

            {/* Worker Status */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#F9D949] to-[#FDE68A] flex items-center justify-center">
                    <Zap className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#FFFBE7]">Worker Status</h3>
                    <p className="text-[#FFFBE7]/60 text-sm">Trading Engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#F9D949] animate-pulse" />
                  <span className="text-[#F9D949] font-bold">Active</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#FFFBE7]/60">Tasks Processed</span>
                  <span className="text-[#FFFBE7] font-semibold">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FFFBE7]/60">Queue Size</span>
                  <span className="text-[#FFFBE7] font-semibold">3 pending</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#FFFBE7]/60">Last Activity</span>
                  <span className="text-[#FFFBE7] font-semibold">1 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-3xl font-bold text-[#FFFBE7] mb-6">Recent Trades</h2>
          
          <div className="p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
            <div className="space-y-4">
              {[
                { pair: 'BTC/USDT', type: 'BUY', price: '$43,250', profit: '+$245', time: '2 min ago', status: 'success' },
                { pair: 'ETH/USDT', type: 'SELL', price: '$2,340', profit: '+$189', time: '15 min ago', status: 'success' },
                { pair: 'SOL/USDT', type: 'BUY', price: '$98.50', profit: '+$67', time: '1 hour ago', status: 'success' },
                { pair: 'ADA/USDT', type: 'SELL', price: '$0.52', profit: '-$23', time: '2 hours ago', status: 'loss' },
              ].map((trade, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-black/50 border border-[#7C2F39]/20 hover:border-[#F9D949]/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      trade.type === 'BUY' 
                        ? 'bg-[#4ADE80]/20 text-[#4ADE80]' 
                        : 'bg-[#F87171]/20 text-[#F87171]'
                    }`}>
                      {trade.type}
                    </div>
                    <div>
                      <div className="text-[#FFFBE7] font-semibold">{trade.pair}</div>
                      <div className="text-sm text-[#FFFBE7]/50">{trade.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#FFFBE7] font-semibold">{trade.price}</div>
                    <div className={`text-sm font-semibold ${
                      trade.status === 'success' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                    }`}>
                      {trade.profit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
