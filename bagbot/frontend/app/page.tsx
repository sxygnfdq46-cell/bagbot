'use client';

import React, { useState, useEffect } from 'react';
import StatusTile from '../components/StatusTile';
import WalletLogo from '../components/WalletLogo';

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
        return true;
      } else {
        throw new Error('API not healthy');
      }
    } catch (error) {
      setApiStatus('error');
      addLog('API health check failed', 'error');
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
    setIsLoading(false);
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative z-10">
      {/* Premium Container with max-width */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* Premium Header */}
        <header className="mb-8 sm:mb-12 animate-slide-in-up">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <WalletLogo size={56} animated={true} className="animate-float" />
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">
                      <span className="text-gradient">BagBot</span>
                      <span className="text-main"> Trading</span>
                    </h1>
                    <div className="glass-card px-3 py-1.5 rounded-full border border-emerald-500/30 animate-border-glow">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                          <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                        </div>
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-base sm:text-lg text-muted font-medium">
                  Institutional-grade automated trading platform
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="glass-card px-4 py-2.5 rounded-xl border border-border hover:border-accent/30 transition-all">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">System Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`status-indicator ${apiStatus === 'healthy' ? 'success' : 'danger'}`}></div>
                    <span className="text-sm font-bold text-main">
                      {apiStatus === 'healthy' ? 'Operational' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Trading Metrics Bar - Premium Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-panel p-4 rounded-xl border border-border hover:border-emerald-500/30 transition-all group cursor-pointer transform hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted uppercase tracking-wider">Total Trades</p>
                  <svg className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-main group-hover:text-emerald-400 transition-colors">{tradingStats.totalTrades}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs text-emerald-400 font-medium">↑ 12.5%</span>
                  <span className="text-xs text-muted">vs last week</span>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-border hover:border-amber-500/30 transition-all group cursor-pointer transform hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted uppercase tracking-wider">Profit/Loss</p>
                  <svg className="w-4 h-4 text-amber-500/50 group-hover:text-amber-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className={`text-2xl font-bold transition-colors ${
                  tradingStats.profitLoss >= 0 
                    ? 'text-emerald-400 group-hover:text-emerald-300' 
                    : 'text-rose-400 group-hover:text-rose-300'
                }`}>
                  {tradingStats.profitLoss >= 0 ? '+' : ''}{tradingStats.profitLoss.toFixed(2)}%
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${tradingStats.profitLoss >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}></div>
                  <span className="text-xs text-muted">Real-time</span>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-border hover:border-sky-500/30 transition-all group cursor-pointer transform hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted uppercase tracking-wider">Win Rate</p>
                  <svg className="w-4 h-4 text-sky-500/50 group-hover:text-sky-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-main group-hover:text-sky-400 transition-colors">{tradingStats.winRate}%</p>
                <div className="mt-2">
                  <div className="w-full bg-slate-700/30 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-sky-500 to-sky-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${tradingStats.winRate}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-border hover:border-violet-500/30 transition-all group cursor-pointer transform hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted uppercase tracking-wider">Active Positions</p>
                  <svg className="w-4 h-4 text-violet-500/50 group-hover:text-violet-400 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-main group-hover:text-violet-400 transition-colors">{tradingStats.activePositions}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-xs text-violet-400 font-medium">{tradingStats.activePositions > 0 ? 'Active' : 'Idle'}</span>
                  <span className="text-xs text-muted">• Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* System Status Grid - Premium Cards */}
        <section className="mb-8 sm:mb-12 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-main">System Status</h2>
            <button
              onClick={refreshStatus}
              disabled={isLoading}
              className="glass-card px-4 py-2 rounded-lg text-sm font-medium text-accent hover:text-accent-light transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
        <section className="mb-8 sm:mb-12 animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-main mb-6">Worker Controls</h2>
          <div className="glass-card p-6 sm:p-8 rounded-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Start Worker Button */}
              <button
                onClick={startWorker}
                disabled={isLoading}
                className={`
                  group relative btn-premium bg-gradient-success
                  px-6 py-4 rounded-xl font-semibold text-base sm:text-lg
                  text-white shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  px-6 py-4 rounded-xl font-semibold text-base sm:text-lg
                  text-white shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  px-6 py-4 rounded-xl font-semibold text-base sm:text-lg
                  text-black shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Status
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Activity Log - Premium Section */}
        <section className="animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl sm:text-3xl font-bold text-main mb-6">Activity Log</h2>
          <div className="glass-card p-6 sm:p-8 rounded-2xl">
            <div className="h-80 overflow-y-auto space-y-2 custom-scrollbar">
              {logs.slice().reverse().map((log, index) => (
                <div
                  key={index}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg
                    bg-surface hover:bg-card-hover
                    border border-transparent hover:border-border
                    transition-all duration-200
                    ${log.type === 'error' ? 'border-l-4 border-l-danger' : ''}
                  `}
                >
                  <span className="text-xs text-muted font-mono whitespace-nowrap mt-0.5">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`text-sm flex-1 ${
                    log.type === 'error' ? 'text-danger font-medium' : 'text-main'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;