'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, TrendingDown, Activity, Settings, Zap, RefreshCw, Home, LayoutDashboard, BarChart3, Radio, FileText, Search, Download, Filter, Wifi, WifiOff } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';
import { useLogs } from '@/utils/hooks';
import api from '@/utils/apiService';
import { getUserFriendlyError } from '@/utils/api';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'ERROR' | 'WARNING' | 'INFO'>('all');
  const [limit, setLimit] = useState(50);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  // Use custom hook for real-time logs (refresh every 5 seconds)
  const { logs, loading, error, refetch } = useLogs({ 
    level: activeFilter !== 'all' ? activeFilter : undefined,
    limit 
  }, 5000);

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.apiHealth();
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('disconnected');
      }
    };
    checkConnection();
  }, []);

  // Filter logs by search query
  const filteredLogs = logs.filter(log => 
    log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.level === 'INFO').length,
    warnings: logs.filter(l => l.level === 'WARNING').length,
    errors: logs.filter(l => l.level === 'ERROR').length
  };

  const getStatusStyles = (level: string) => {
    switch (level) {
      case 'INFO':
        return {
          bg: 'bg-[#4ADE80]/20',
          border: 'border-[#4ADE80]/30',
          text: 'text-[#4ADE80]',
          chip: 'bg-[#4ADE80]/20 text-[#4ADE80]',
          icon: CheckCircle
        };
      case 'WARNING':
        return {
          bg: 'bg-[#F9D949]/20',
          border: 'border-[#F9D949]/30',
          text: 'text-[#F9D949]',
          chip: 'bg-[#F9D949]/20 text-[#F9D949]',
          icon: AlertTriangle
        };
      case 'ERROR':
        return {
          bg: 'bg-[#F87171]/20',
          border: 'border-[#F87171]/30',
          text: 'text-[#F87171]',
          chip: 'bg-[#F87171]/20 text-[#F87171]',
          icon: XCircle
        };
      default:
        return {
          bg: 'bg-[#60A5FA]/20',
          border: 'border-[#60A5FA]/30',
          text: 'text-[#60A5FA]',
          chip: 'bg-[#60A5FA]/20 text-[#60A5FA]',
          icon: Info
        };
    }
  };

  const handleExportLogs = async () => {
    try {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/logs" />
      <PageContent>
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-[#FFFBE7]/30">/</span>
          <span className="text-[#F9D949] font-semibold">Logs</span>
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
          <Link href="/signals" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Signals
          </Link>
          <Link href="/logs" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
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
              Activity Logs
            </span>
          </h1>
          <p className="text-[#FFFBE7]/60 text-base md:text-lg mb-4 md:mb-6">System events and trading activity</p>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#FFFBE7]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-2.5 md:py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] text-sm md:text-base placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 mb-6 md:mb-8">
          {[
            { label: 'Total Events', value: stats.total.toString(), type: 'info', icon: Activity },
            { label: 'Info', value: stats.success.toString(), type: 'success', icon: CheckCircle },
            { label: 'Warnings', value: stats.warnings.toString(), type: 'warning', icon: AlertTriangle },
            { label: 'Errors', value: stats.errors.toString(), type: 'error', icon: XCircle },
            { 
              label: 'Connection', 
              value: connectionStatus === 'connected' ? 'Live' : 'Offline', 
              type: connectionStatus === 'connected' ? 'success' : 'error', 
              icon: connectionStatus === 'connected' ? Wifi : WifiOff 
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            const styles = getStatusStyles(stat.type);
            return (
              <div
                key={index}
                className="p-3 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#FFFBE7]/60 text-xs font-semibold">{stat.label}</span>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${styles.text}`} />
                </div>
                <div className={`text-2xl md:text-3xl font-black ${styles.text}`}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Filters & Actions */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {(['all', 'INFO', 'WARNING', 'ERROR'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                  activeFilter === filter
                    ? 'bg-[#7C2F39] text-[#FFFBE7] border border-[#F9D949]'
                    : 'bg-black/50 text-[#FFFBE7]/60 hover:bg-[#7C2F39]/50 border border-[#7C2F39]/30'
                }`}
              >
                {filter === 'all' ? 'All' : filter}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#7C2F39]/50 hover:bg-[#7C2F39] text-[#FFFBE7] border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportLogs}
              className="px-4 py-2 rounded-lg bg-[#7C2F39]/50 hover:bg-[#7C2F39] text-[#FFFBE7] border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all flex items-center gap-2 text-sm font-semibold"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-[#F9D949] animate-spin mx-auto mb-2" />
            <p className="text-[#FFFBE7]/60">Loading logs...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 rounded-xl bg-[#F87171]/10 border border-[#F87171]/30 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-6 h-6 text-[#F87171]" />
              <div>
                <h3 className="text-lg font-bold text-[#F87171]">Failed to load logs</h3>
                <p className="text-[#FFFBE7]/60 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {!loading && !error && (
          <div className="space-y-3 md:space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <Info className="w-12 h-12 text-[#FFFBE7]/20 mx-auto mb-4" />
                <p className="text-[#FFFBE7]/60">No logs found</p>
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const styles = getStatusStyles(log.level);
                const Icon = styles.icon;
                return (
                  <div
                    key={`${log.timestamp}-${index}`}
                    className={`p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border ${styles.border} hover:border-[#F9D949]/50 transition-all`}
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col md:hidden gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-lg font-bold text-[#FFFBE7]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-xs text-[#FFFBE7]/40">
                            {new Date(log.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${styles.chip}`}>
                            {log.level}
                          </span>
                          <div className={`p-2 rounded-lg ${styles.bg}`}>
                            <Icon className={`w-5 h-5 ${styles.text}`} />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#FFFBE7] mb-1">{log.message}</h3>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex gap-6">
                      <div className="flex-shrink-0 w-32">
                        <div className="text-2xl font-bold text-[#FFFBE7]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-[#FFFBE7]/40 mt-1">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`flex-shrink-0 p-3 rounded-xl ${styles.bg} h-fit`}>
                        <Icon className={`w-6 h-6 ${styles.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${styles.chip}`}>
                            {log.level}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#FFFBE7] mb-1">{log.message}</h3>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Load More */}
        {!loading && !error && filteredLogs.length >= limit && (
          <div className="mt-8 text-center">
            <button 
              onClick={() => setLimit(prev => prev + 50)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] font-bold hover:from-[#991B1B] hover:to-[#7C2F39] transition-all"
            >
              Load More Logs
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#60A5FA]/20">
              <Info className="w-6 h-6 text-[#60A5FA]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-2">Log Retention</h3>
              <p className="text-[#FFFBE7]/60 text-sm leading-relaxed">
                Activity logs are retained for 90 days. Critical events and trade history are archived 
                indefinitely. You can export logs in CSV or JSON format for external analysis.
              </p>
            </div>
          </div>
        </div>
        </div>
      </PageContent>
    </>
  );
}