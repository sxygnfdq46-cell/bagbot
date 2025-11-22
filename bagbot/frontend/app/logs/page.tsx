'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, XCircle, Info, TrendingUp, TrendingDown, Activity, Settings, Zap, RefreshCw, Home, LayoutDashboard, BarChart3, Radio, FileText, Search } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const logs = [
    {
      time: '14:32:18',
      date: 'Nov 21, 2024',
      type: 'success',
      category: 'Trade',
      message: 'BUY order executed successfully',
      details: 'BTC/USDT @ $43,250.00 | Quantity: 0.025 BTC',
      icon: CheckCircle
    },
    {
      time: '14:28:45',
      date: 'Nov 21, 2024',
      type: 'success',
      category: 'Signal',
      message: 'New trading signal generated',
      details: 'ETH/USDT BUY signal | Confidence: 92%',
      icon: TrendingUp
    },
    {
      time: '14:25:12',
      date: 'Nov 21, 2024',
      type: 'info',
      category: 'System',
      message: 'Worker task completed',
      details: 'Market analysis cycle finished | Duration: 2.4s',
      icon: Activity
    },
    {
      time: '14:21:03',
      date: 'Nov 21, 2024',
      type: 'warning',
      category: 'Risk',
      message: 'High volatility detected',
      details: 'SOL/USDT volatility: 18.5% | Position size reduced',
      icon: AlertTriangle
    },
    {
      time: '14:18:37',
      date: 'Nov 21, 2024',
      type: 'success',
      category: 'Trade',
      message: 'SELL order executed successfully',
      details: 'ETH/USDT @ $2,340.50 | Profit: +$189.00',
      icon: CheckCircle
    },
    {
      time: '14:15:22',
      date: 'Nov 21, 2024',
      type: 'error',
      category: 'API',
      message: 'Exchange API rate limit reached',
      details: 'Binance API | Retry scheduled in 60s',
      icon: XCircle
    },
    {
      time: '14:12:08',
      date: 'Nov 21, 2024',
      type: 'info',
      category: 'System',
      message: 'Configuration updated',
      details: 'Risk parameters adjusted | Max position: 2.5%',
      icon: Settings
    },
    {
      time: '14:08:45',
      date: 'Nov 21, 2024',
      type: 'success',
      category: 'Signal',
      message: 'Signal accuracy validation passed',
      details: 'Last 24h accuracy: 78.4% | Above threshold',
      icon: Zap
    },
    {
      time: '14:05:19',
      date: 'Nov 21, 2024',
      type: 'warning',
      category: 'Trade',
      message: 'Stop loss triggered',
      details: 'ADA/USDT @ $0.51 | Loss: -$23.00',
      icon: TrendingDown
    },
    {
      time: '14:02:56',
      date: 'Nov 21, 2024',
      type: 'info',
      category: 'System',
      message: 'Database backup completed',
      details: 'Size: 245 MB | Location: cloud-backup-001',
      icon: Info
    },
    {
      time: '13:58:31',
      date: 'Nov 21, 2024',
      type: 'success',
      category: 'Trade',
      message: 'BUY order executed successfully',
      details: 'SOL/USDT @ $98.50 | Quantity: 2.5 SOL',
      icon: CheckCircle
    },
    {
      time: '13:54:17',
      date: 'Nov 21, 2024',
      type: 'error',
      category: 'Network',
      message: 'Connection timeout',
      details: 'Exchange: Kraken | Auto-reconnecting...',
      icon: XCircle
    },
    {
      time: '13:50:42',
      date: 'Nov 21, 2024',
      type: 'info',
      category: 'Worker',
      message: 'Scheduled task started',
      details: 'Market sentiment analysis | Queue: 3 pending',
      icon: RefreshCw
    },
    {
      time: '13:47:28',
      date: 'Nov 21, 2024',
      type: 'success',
      category: 'Signal',
      message: 'Multi-indicator confirmation',
      details: 'BTC/USDT | 5 of 7 indicators bullish',
      icon: TrendingUp
    },
    {
      time: '13:43:05',
      date: 'Nov 21, 2024',
      type: 'warning',
      category: 'Risk',
      message: 'Portfolio exposure near limit',
      details: 'Current: 87.5% | Max: 90% | Review positions',
      icon: AlertTriangle
    }
  ];

  const getStatusStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-[#4ADE80]/20',
          border: 'border-[#4ADE80]/30',
          text: 'text-[#4ADE80]',
          chip: 'bg-[#4ADE80]/20 text-[#4ADE80]'
        };
      case 'warning':
        return {
          bg: 'bg-[#F9D949]/20',
          border: 'border-[#F9D949]/30',
          text: 'text-[#F9D949]',
          chip: 'bg-[#F9D949]/20 text-[#F9D949]'
        };
      case 'error':
        return {
          bg: 'bg-[#F87171]/20',
          border: 'border-[#F87171]/30',
          text: 'text-[#F87171]',
          chip: 'bg-[#F87171]/20 text-[#F87171]'
        };
      default:
        return {
          bg: 'bg-[#60A5FA]/20',
          border: 'border-[#60A5FA]/30',
          text: 'text-[#60A5FA]',
          chip: 'bg-[#60A5FA]/20 text-[#60A5FA]'
        };
    }
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/logs" />
      <div className="min-h-screen bg-black p-4 md:p-8 md:ml-64">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {[
            { label: 'Total Events', value: '1,247', type: 'info', icon: Activity },
            { label: 'Success', value: '892', type: 'success', icon: CheckCircle },
            { label: 'Warnings', value: '127', type: 'warning', icon: AlertTriangle },
            { label: 'Errors', value: '18', type: 'error', icon: XCircle }
          ].map((stat, index) => {
            const Icon = stat.icon;
            const styles = getStatusStyles(stat.type);
            return (
              <div
                key={index}
                className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <span className="text-[#FFFBE7]/60 text-xs md:text-sm font-semibold">{stat.label}</span>
                  <Icon className={`w-5 h-5 ${styles.text}`} />
                </div>
                <div className={`text-3xl font-black ${styles.text}`}>{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          {['All', 'Trade', 'Signal', 'System', 'API', 'Risk', 'Worker', 'Network'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeFilter === filter
                  ? 'bg-[#7C2F39] text-[#FFFBE7] border border-[#F9D949]'
                  : 'bg-black/50 text-[#FFFBE7]/60 hover:bg-[#7C2F39]/50 border border-[#7C2F39]/30'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="space-y-3">
          {logs
            .filter(log => {
              if (activeFilter !== 'All' && log.category !== activeFilter) return false;
              if (searchQuery && !(
                log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.category.toLowerCase().includes(searchQuery.toLowerCase())
              )) return false;
              return true;
            })
            .map((log, index) => {
            const styles = getStatusStyles(log.type);
            const Icon = log.icon;
            return (
              <div
                key={index}
                className={`p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border ${styles.border} hover:border-[#F9D949]/50 transition-all`}
              >
                <div className="flex gap-6">
                  {/* Timestamp Column */}
                  <div className="flex-shrink-0 w-32">
                    <div className="text-2xl font-bold text-[#FFFBE7]">{log.time}</div>
                    <div className="text-xs text-[#FFFBE7]/40 mt-1">{log.date}</div>
                  </div>

                  {/* Icon */}
                  <div className={`flex-shrink-0 p-3 rounded-xl ${styles.bg} h-fit`}>
                    <Icon className={`w-6 h-6 ${styles.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${styles.chip}`}>
                          {log.type}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-[#7C2F39]/20 text-[#F9D949] border border-[#7C2F39]/30">
                          {log.category}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-[#FFFBE7] mb-1">{log.message}</h3>
                    <p className="text-sm text-[#FFFBE7]/60">{log.details}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load More */}
        <div className="mt-8 text-center">
          <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] font-bold hover:from-[#991B1B] hover:to-[#7C2F39] transition-all">
            Load More Logs
          </button>
        </div>

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
    </div>
    </>
  );
}
