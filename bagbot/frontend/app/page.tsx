'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import StatusTile from '../components/StatusTile';
import WalletLogo from '../components/WalletLogo';
import GlassCard from '../components/UI/Card';
import StatsCard from '../components/Dashboard/StatsCard';
import Sparkline from '../components/Dashboard/Sparkline';
import ToastNotification, { Toast } from '../components/UI/ToastNotification';

/**
 * Premium BagBot Trading Dashboard
 * World-class design exceeding Binance standards
 */
const Dashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'healthy' | 'warning' | 'error' | 'loading' | 'inactive'>('inactive');
  const [workerStatus, setWorkerStatus] = useState<'healthy' | 'warning' | 'error' | 'loading' | 'inactive'>('inactive');
  const [logs, setLogs] = useState<Array<{ timestamp: Date; message: string; type: string }>>([
    { timestamp: new Date(), message: 'Dashboard loaded...', type: 'info' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    profitLoss: 0,
    winRate: 0,
    activePositions: 0
  });
  const [marketData, setMarketData] = useState({
    btcPrice: 0,
    ethPrice: 0,
    sentiment: 'neutral' as 'bullish' | 'bearish' | 'neutral',
    volume24h: 0,
    marketCap: 0
  });
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Sample sparkline data for stats
  const sparklineData = {
    trades: [120, 125, 122, 130, 127, 135, 134],
    profit: [10.2, 10.8, 11.1, 11.5, 11.2, 11.8, 12.5],
    winRate: [65, 66, 67, 68, 67, 68, 68],
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const newToast: Toast = {
      id: Date.now().toString(),
      type,
      message,
      duration: 5000,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const addLog = (message: string, type: string = 'info') => {
    setLogs(prev => [...prev, { timestamp: new Date(), message, type }]);
  };

  const checkAPIHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      const data = await response.json();
      
      if (response.ok) {
        setApiStatus('healthy');
        addLog('API health check successful');
        addToast('success', '✓ API Connected Successfully');
        return true;
      } else {
        throw new Error('API not healthy');
      }
    } catch (error) {
      setApiStatus('error');
      addLog('API health check failed', 'error');
      addToast('error', '✗ API Connection Failed');
      return false;
    }
  };

  const checkWorkerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/status`);
      const data = await response.json();
      
      if (response.ok && data.status === 'running') {
        setWorkerStatus('healthy');
        addLog('Worker is running');
      } else {
        setWorkerStatus('inactive');
        addLog('Worker is not running');
      }
    } catch (error) {
      setWorkerStatus('error');
      addLog('Worker status check failed', 'error');
    }
  };

  const startWorker = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/start`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        addLog('Worker start command sent');
        setTimeout(checkWorkerStatus, 2000);
      } else {
        addLog('Failed to start worker', 'error');
      }
    } catch (error) {
      addLog('Error starting worker', 'error');
    }
    setIsLoading(false);
  };

  const stopWorker = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/worker/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        addLog('Worker stop command sent');
        setTimeout(checkWorkerStatus, 2000);
      } else {
        addLog('Failed to stop worker', 'error');
      }
    } catch (error) {
      addLog('Error stopping worker', 'error');
    }
    setIsLoading(false);
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    await Promise.all([checkAPIHealth(), checkWorkerStatus()]);
    
    // Simulate market data updates
    setMarketData({
      btcPrice: 43250 + Math.random() * 500,
      ethPrice: 2280 + Math.random() * 50,
      sentiment: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish',
      volume24h: 28500000000,
      marketCap: 850000000000
    });
    
    // Simulate trading stats updates
    setTradingStats({
      totalTrades: 127 + Math.floor(Math.random() * 10),
      profitLoss: 12.5 + (Math.random() * 5 - 2.5),
      winRate: 68 + Math.floor(Math.random() * 5),
      activePositions: Math.floor(Math.random() * 5)
    });
    
    setIsLoading(false);
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Premium Container */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* Premium Header */}
        <header className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <WalletLogo size={48} animated={true} className="animate-float sm:w-14 sm:h-14" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                        <span className="text-gradient">BagBot</span>
                        <span className="text-main"> Trading</span>
                      </h1>
                      <div className="glass-card px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-500/30 animate-border-glow">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="relative">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <div className="absolute inset-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                          </div>
                          <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-muted font-medium">
                      Institutional-grade automated trading
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="glass-card px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-border hover:border-accent/30 transition-all">
                    <p className="text-[10px] sm:text-xs text-muted uppercase tracking-wider mb-1">System Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`status-indicator ${apiStatus === 'healthy' ? 'success' : 'danger'}`}></div>
                      <span className="text-xs sm:text-sm font-bold text-main">
                        {apiStatus === 'healthy' ? 'Operational' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Trading Metrics Bar - Premium Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <StatsCard
                title="Total Trades"
                value={tradingStats.totalTrades}
                change={12.5}
                changeLabel="vs last week"
                icon="trades"
                colorScheme="emerald"
              />
              <StatsCard
                title="Profit/Loss"
                value={tradingStats.profitLoss}
                change={tradingStats.profitLoss >= 0 ? 5.2 : -2.3}
                changeLabel="24h change"
                icon="profit"
                colorScheme={tradingStats.profitLoss >= 0 ? 'emerald' : 'rose'}
                isPercentage={true}
                showLiveTag={true}
              />
              <StatsCard
                title="Win Rate"
                value={tradingStats.winRate}
                change={3.8}
                changeLabel="this month"
                icon="winrate"
                colorScheme="sky"
                isPercentage={true}
                showProgressBar={true}
              />
              <StatsCard
                title="Active Positions"
                value={tradingStats.activePositions}
                icon="positions"
                colorScheme="violet"
                showLiveTag={tradingStats.activePositions > 0}
              />
            </div>
          </div>
        </header>

        {/* Market Overview & Quick Stats - Premium Section */}
        <section className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Live Price Ticker */}
            <GlassCard className="lg:col-span-2 p-4 sm:p-5 lg:p-6 hover:border-emerald-500/20 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-main flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  Live Market Prices
                </h3>
                <div className="flex gap-1.5 sm:gap-2">
                  {(['24h', '7d', '30d'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-all touch-manipulation ${
                        timeframe === tf
                          ? 'bg-gradient-accent text-black shadow-md'
                          : 'bg-surface text-muted hover:text-main active:scale-95'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-surface/50 rounded-xl border border-border hover:border-amber-500/30 transition-all group touch-manipulation">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      ₿
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs text-muted">Bitcoin</p>
                      <p className="text-[10px] sm:text-xs text-muted/70">BTC/USDT</p>
                    </div>
                  </div>
                  <p className="balance-text text-xl sm:text-2xl lg:text-3xl text-main mb-1">${marketData.btcPrice.toLocaleString()}</p>
                  <div className="flex items-center justify-between mb-2">
                    <Sparkline 
                      data={[41200, 41800, 42100, 41900, 42500, 43100, 43684]} 
                      color="success" 
                      width={80} 
                      height={28} 
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="percentage-text text-xs sm:text-sm text-emerald-400">+2.34%</span>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-surface/50 rounded-xl border border-border hover:border-sky-500/30 transition-all group touch-manipulation">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      Ξ
                    </div>
                    <div>
                      <p className="text-[11px] sm:text-xs text-muted">Ethereum</p>
                      <p className="text-[10px] sm:text-xs text-muted/70">ETH/USDT</p>
                    </div>
                  </div>
                  <p className="balance-text text-xl sm:text-2xl lg:text-3xl text-main mb-1">${marketData.ethPrice.toLocaleString()}</p>
                  <div className="flex items-center justify-between mb-2">
                    <Sparkline 
                      data={[2450, 2400, 2380, 2420, 2350, 2290, 2318]} 
                      color="danger" 
                      width={80} 
                      height={28} 
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="percentage-text text-xs sm:text-sm text-emerald-400">+1.87%</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Market Sentiment */}
            <GlassCard className="p-4 sm:p-5 lg:p-6 hover:border-violet-500/20 transition-all">
              <h3 className="text-base sm:text-lg font-bold text-main mb-3 sm:mb-4">Market Sentiment</h3>
              <div className="flex flex-col items-center justify-center py-3 sm:py-4">
                <div className={`text-4xl sm:text-5xl mb-2 sm:mb-3 ${
                  marketData.sentiment === 'bullish' ? 'animate-bounce' : ''
                }`}>
                  {marketData.sentiment === 'bullish' ? '🚀' : marketData.sentiment === 'bearish' ? '📉' : '⚖️'}
                </div>
                <p className={`text-xl sm:text-2xl font-bold mb-1.5 sm:mb-2 ${
                  marketData.sentiment === 'bullish' ? 'text-emerald-400' :
                  marketData.sentiment === 'bearish' ? 'text-rose-400' :
                  'text-amber-400'
                }`}>
                  {marketData.sentiment.charAt(0).toUpperCase() + marketData.sentiment.slice(1)}
                </p>
                <p className="text-xs sm:text-sm text-muted text-center">
                  Market analysis based on<br />technical indicators
                </p>
              </div>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] sm:text-xs text-muted">Fear & Greed Index</span>
                  <span className="metric-text text-xs sm:text-sm text-amber-400">65</span>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-1.5 sm:h-2">
                  <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-1.5 sm:h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Quick Actions - Premium Dashboard */}
        <section className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up" style={{ animationDelay: '0.08s' }}>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Start Trading */}
            <button
              onClick={startWorker}
              disabled={isLoading || workerStatus === 'healthy'}
              className="glass-panel p-5 sm:p-6 rounded-xl border border-border hover:border-emerald-500/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-main mb-1">Start Trading</h3>
              <p className="text-xs sm:text-sm text-muted">Launch automated trading worker</p>
            </button>

            {/* Stop Trading */}
            <button
              onClick={stopWorker}
              disabled={isLoading || workerStatus !== 'healthy'}
              className="glass-panel p-5 sm:p-6 rounded-xl border border-border hover:border-rose-500/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 flex items-center justify-center border border-rose-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted group-hover:text-rose-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-main mb-1">Stop Trading</h3>
              <p className="text-xs sm:text-sm text-muted">Halt all trading operations</p>
            </button>

            {/* Refresh Data */}
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="glass-panel p-5 sm:p-6 rounded-xl border border-border hover:border-sky-500/50 transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 flex items-center justify-center border border-sky-500/30 group-hover:scale-110 transition-transform">
                  <svg className={`w-5 h-5 sm:w-6 sm:h-6 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-main mb-1">Refresh Data</h3>
              <p className="text-xs sm:text-sm text-muted">Update all system metrics</p>
            </button>

            {/* View Analytics */}
            <button
              className="glass-panel p-5 sm:p-6 rounded-xl border border-border hover:border-violet-500/50 transition-all group text-left transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 flex items-center justify-center border border-violet-500/30 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-muted group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-main mb-1">Analytics</h3>
              <p className="text-xs sm:text-sm text-muted">View detailed performance</p>
            </button>
          </div>
        </section>

        {/* System Status Grid - Premium Cards */}
        <section className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main">System Status</h2>
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="glass-card px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-accent hover:text-accent-light transition-all disabled:opacity-50 touch-manipulation self-start sm:self-auto"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                'Refresh Status'
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <StatusTile
              title="API Health"
              status={apiStatus}
              description="Backend API connectivity and health monitoring"
              lastUpdated={new Date()}
              onClick={checkAPIHealth}
              className="animate-slide-in-up"
            />
            <StatusTile
              title="Worker Status"
              status={workerStatus}
              description="Trading worker process status and activity"
              lastUpdated={new Date()}
              onClick={checkWorkerStatus}
              className="animate-slide-in-up"
              style={{ animationDelay: '0.1s' } as React.CSSProperties}
            />
          </div>
        </section>

        {/* Worker Controls - Premium Section */}
        <section className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main mb-4 sm:mb-6">Worker Controls</h2>
          <GlassCard className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Start Worker Button */}
              <button
                onClick={startWorker}
                disabled={isLoading}
                className={`
                  group relative btn-premium bg-gradient-success
                  px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-semibold text-sm sm:text-base lg:text-lg
                  text-white shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300 touch-manipulation
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Worker
                </span>
              </button>
              
              {/* Stop Worker Button */}
              <button
                onClick={stopWorker}
                disabled={isLoading}
                className={`
                  group relative btn-premium bg-gradient-danger
                  px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-semibold text-sm sm:text-base lg:text-lg
                  text-white shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300 touch-manipulation
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Worker
                </span>
              </button>
              
              {/* Refresh Status Button */}
              <button
                onClick={refreshStatus}
                disabled={isLoading}
                className={`
                  group relative btn-premium bg-gradient-accent
                  px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-semibold text-sm sm:text-base lg:text-lg
                  text-black shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300 touch-manipulation
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Status
                </span>
              </button>
            </div>
          </GlassCard>
        </section>

        {/* Performance Analytics - Premium Section */}
        <section className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up" style={{ animationDelay: '0.25s' }}>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main mb-4 sm:mb-6">Performance Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Today's Performance */}
            <GlassCard className="p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-bold text-main mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Today's Performance
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3 sm:p-4 bg-surface/50 rounded-xl border border-border hover:border-emerald-500/30 transition-all touch-manipulation">
                  <div>
                    <p className="text-xs sm:text-sm text-muted mb-1">Total Volume</p>
                    <p className="balance-text text-xl sm:text-2xl text-main">$2,847.50</p>
                  </div>
                  <div className="text-right">
                    <span className="percentage-text text-xs sm:text-sm text-emerald-400">+18.2%</span>
                    <p className="text-[10px] sm:text-xs text-muted mt-1">vs yesterday</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-surface/50 rounded-xl border border-border hover:border-sky-500/30 transition-all touch-manipulation">
                  <div>
                    <p className="text-xs sm:text-sm text-muted mb-1">Trades Executed</p>
                    <p className="metric-text text-xl sm:text-2xl text-main">24</p>
                  </div>
                  <div className="text-right">
                    <span className="metric-text text-xs sm:text-sm text-sky-400">+6 trades</span>
                    <p className="text-[10px] sm:text-xs text-muted mt-1">since start</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 sm:p-4 bg-surface/50 rounded-xl border border-border hover:border-amber-500/30 transition-all touch-manipulation">
                  <div>
                    <p className="text-xs sm:text-sm text-muted mb-1">Avg. Trade Size</p>
                    <p className="balance-text text-xl sm:text-2xl text-main">$118.65</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm text-amber-400 font-medium">Optimal</span>
                    <p className="text-[10px] sm:text-xs text-muted mt-1">range</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Risk Management */}
            <GlassCard className="p-4 sm:p-5 lg:p-6">
              <h3 className="text-base sm:text-lg font-bold text-main mb-3 sm:mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Risk Management
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-surface/50 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm text-muted">Portfolio Risk Level</p>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">Low</span>
                  </div>
                  <div className="w-full bg-slate-700/30 rounded-full h-1.5 sm:h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-1.5 sm:h-2 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-surface/50 rounded-xl border border-border text-center touch-manipulation">
                    <p className="text-[10px] sm:text-xs text-muted mb-1 sm:mb-2">Max Drawdown</p>
                    <p className="percentage-text text-lg sm:text-xl text-rose-400">-3.2%</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-surface/50 rounded-xl border border-border text-center touch-manipulation">
                    <p className="text-[10px] sm:text-xs text-muted mb-1 sm:mb-2">Sharpe Ratio</p>
                    <p className="metric-text text-lg sm:text-xl text-emerald-400">2.14</p>
                  </div>
                </div>
                <div className="p-3 sm:p-4 bg-surface/50 rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm text-muted">Stop Loss Protection</p>
                    <span className="px-2 py-0.5 sm:py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] sm:text-xs font-medium">Active</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted">Auto-triggered at -5% loss threshold</p>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Trading Signals & Opportunities */}
        <section className="mb-6 sm:mb-8 lg:mb-12 animate-slide-in-up" style={{ animationDelay: '0.28s' }}>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main mb-4 sm:mb-6">Live Trading Signals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* BTC Signal */}
            <GlassCard className="p-4 sm:p-5 lg:p-6 border-emerald-500/30 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    ₿
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-main">BTC/USDT</p>
                    <p className="text-[10px] sm:text-xs text-muted">Bitcoin</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] sm:text-xs font-bold uppercase">Buy</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Entry</span>
                  <span className="balance-text text-sm text-main">$43,450</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Target</span>
                  <span className="balance-text text-sm text-emerald-400">$45,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Stop Loss</span>
                  <span className="balance-text text-sm text-rose-400">$42,800</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted">Confidence</span>
                  <div className="flex items-center gap-1">
                    <span className="percentage-text text-sm text-amber-400">78%</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4].map((i) => (
                        <div key={i} className="w-1 h-3 bg-amber-400 rounded-full"></div>
                      ))}
                      <div className="w-1 h-3 bg-slate-700/30 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* ETH Signal */}
            <GlassCard className="p-4 sm:p-5 lg:p-6 border-sky-500/30 hover:border-sky-500/50 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    Ξ
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-main">ETH/USDT</p>
                    <p className="text-[10px] sm:text-xs text-muted">Ethereum</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-sky-500/20 text-sky-400 rounded-full text-[10px] sm:text-xs font-bold uppercase">Hold</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Current</span>
                  <span className="balance-text text-sm text-main">$2,285</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Support</span>
                  <span className="balance-text text-sm text-sky-400">$2,240</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Resistance</span>
                  <span className="balance-text text-sm text-amber-400">$2,350</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted">Momentum</span>
                  <div className="flex items-center gap-1">
                    <span className="percentage-text text-sm text-sky-400">65%</span>
                    <div className="flex gap-0.5">
                      {[1,2,3].map((i) => (
                        <div key={i} className="w-1 h-3 bg-sky-400 rounded-full"></div>
                      ))}
                      {[1,2].map((i) => (
                        <div key={i} className="w-1 h-3 bg-slate-700/30 rounded-full"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Market Overview */}
            <GlassCard className="p-4 sm:p-5 lg:p-6 border-violet-500/30 hover:border-violet-500/50 transition-all">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-main">Market</p>
                    <p className="text-[10px] sm:text-xs text-muted">Overview</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-violet-500/20 text-violet-400 rounded-full text-[10px] sm:text-xs font-bold uppercase">Active</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">24h Volume</span>
                  <span className="text-sm font-bold text-main">$28.5B</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Active Pairs</span>
                  <span className="text-sm font-bold text-emerald-400">47</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">Trending</span>
                  <span className="text-sm font-bold text-amber-400">BTC, ETH, SOL</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted">Market State</span>
                  <span className="text-sm font-bold text-emerald-400">Bullish</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Activity Log - Premium Section */}
        <section className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-main mb-4 sm:mb-6">Activity Log</h2>
          <GlassCard className="p-4 sm:p-6 lg:p-8">
            <div className="h-64 sm:h-80 overflow-y-auto space-y-2 custom-scrollbar">
              {logs.slice().reverse().map((log, index) => (
                <div
                  key={index}
                  className={`
                    flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg
                    bg-surface hover:bg-card-hover
                    border border-transparent hover:border-border
                    transition-all duration-200
                    ${log.type === 'error' ? 'border-l-2 sm:border-l-4 border-l-danger' : ''}
                  `}
                >
                  <span className="text-[10px] sm:text-xs text-muted font-mono whitespace-nowrap mt-0.5">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`text-xs sm:text-sm flex-1 ${
                    log.type === 'error' ? 'text-danger font-medium' : 'text-main'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

      </div>

      {/* Toast Notification System */}
      <ToastNotification toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Dashboard;