'use client';

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, Activity, Shield, Brain, TrendingUp, BookOpen, MessageSquare, 
  Zap, BarChart3, Target, Radio, RefreshCw, CheckCircle, XCircle, 
  AlertTriangle, ArrowRight, Settings
} from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';

export default function SystemsPage() {
  const [systems, setSystems] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/systems/overview');
      const data = await response.json();
      setSystems(data.systems);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-[#4ADE80]';
      case 'inactive':
        return 'text-[#FFFBE7]/40';
      case 'error':
        return 'text-[#7C2F39]';
      default:
        return 'text-[#F9D949]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5" />;
      case 'inactive':
        return <XCircle className="w-5 h-5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const systemCards = [
    {
      key: 'strategy_arsenal',
      name: 'Strategy Arsenal',
      icon: Target,
      description: '9 strategies with live suitability',
      link: '/strategies',
      metrics: systems?.strategy_arsenal ? [
        { label: 'Active', value: systems.strategy_arsenal.active_strategies },
        { label: 'Total', value: systems.strategy_arsenal.total_strategies }
      ] : []
    },
    {
      key: 'risk_engine',
      name: 'Risk Engine',
      icon: Shield,
      description: 'Position limits and circuit breakers',
      link: '/risk',
      metrics: systems?.risk_engine ? [
        { label: 'Health', value: `${(systems.risk_engine.health_score * 100).toFixed(0)}%` },
        { label: 'Breaker', value: systems.risk_engine.circuit_breaker ? 'ACTIVE' : 'OFF' }
      ] : []
    },
    {
      key: 'news_anchor',
      name: 'News Anchor',
      icon: Radio,
      description: 'Market bias and news analysis',
      link: '/market-intelligence',
      metrics: systems?.news_anchor ? [
        { label: 'Bias', value: systems.news_anchor.market_bias },
        { label: 'Risk', value: `${(systems.news_anchor.risk_level * 100).toFixed(0)}%` }
      ] : []
    },
    {
      key: 'knowledge_engine',
      name: 'Knowledge Engine',
      icon: BookOpen,
      description: 'PDF uploads and concept extraction',
      link: '/knowledge',
      metrics: systems?.knowledge_engine ? [
        { label: 'Docs', value: systems.knowledge_engine.documents },
        { label: 'Concepts', value: systems.knowledge_engine.concepts }
      ] : []
    },
    {
      key: 'ai_chat_helper',
      name: 'AI Chat Helper',
      icon: MessageSquare,
      description: 'Natural language trading assistant',
      link: '/chat',
      metrics: systems?.ai_chat_helper ? [
        { label: 'Sessions', value: systems.ai_chat_helper.sessions_active }
      ] : []
    },
    {
      key: 'micro_trend_follower',
      name: 'Micro Trend Follower',
      icon: Zap,
      description: 'Ultra-fast tick-level trading',
      link: '/systems',
      metrics: systems?.micro_trend_follower ? [
        { label: 'Signals', value: systems.micro_trend_follower.signals_today }
      ] : []
    },
    {
      key: 'streak_manager',
      name: 'Streak Manager',
      icon: TrendingUp,
      description: 'Win/loss streak tracking',
      link: '/systems',
      metrics: systems?.streak_manager ? [
        { label: 'Streak', value: systems.streak_manager.current_streak }
      ] : []
    },
    {
      key: 'strategy_switcher',
      name: 'Strategy Switcher',
      icon: RefreshCw,
      description: 'Automatic strategy selection',
      link: '/systems',
      metrics: systems?.strategy_switcher ? [
        { label: 'Current', value: systems.strategy_switcher.current_strategy.replace('_', ' ') },
        { label: 'Switches', value: systems.strategy_switcher.switches_today }
      ] : []
    },
    {
      key: 'mindset_engine',
      name: 'Mindset Engine',
      icon: Brain,
      description: 'Emotional state tracking',
      link: '/systems',
      metrics: systems?.mindset_engine ? [
        { label: 'State', value: systems.mindset_engine.state },
        { label: 'Discipline', value: `${(systems.mindset_engine.discipline_score * 100).toFixed(0)}%` }
      ] : []
    },
    {
      key: 'htm_adapter',
      name: 'HTM Adapter',
      icon: BarChart3,
      description: 'High timeframe bias prediction',
      link: '/systems',
      metrics: systems?.htm_adapter ? [
        { label: 'Bias', value: systems.htm_adapter.htf_bias }
      ] : []
    },
    {
      key: 'market_router',
      name: 'Market Router',
      icon: Activity,
      description: 'Multi-exchange connectivity',
      link: '/systems',
      metrics: systems?.market_router ? [
        { label: 'Connected', value: `${systems.market_router.connected_adapters}/${systems.market_router.total_adapters}` }
      ] : []
    }
  ];

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/systems" />
      <PageContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <nav className="mb-6 md:mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                Home
              </Link>
              <span className="text-[#FFFBE7]/30">/</span>
              <span className="text-[#F9D949] font-semibold">Systems Monitor</span>
            </div>
            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C2F39]/20 border border-[#7C2F39]/50 text-[#F9D949] hover:bg-[#7C2F39]/30 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </nav>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-[#FFFBE7] mb-3">
              System Monitor
            </h1>
            <p className="text-lg text-[#FFFBE7]/70">
              Real-time status of all Phase 2-4.5 trading systems
            </p>
            <p className="text-sm text-[#FFFBE7]/40 mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>

          {/* System Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemCards.map((system) => {
              const systemData = systems?.[system.key];
              const status = systemData?.status || 'unknown';
              
              return (
                <Link
                  key={system.key}
                  href={system.link}
                  className="group"
                >
                  <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-[#1a0a0f] to-black border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#F9D949]/20">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-[#7C2F39]/20 border border-[#7C2F39]/50 group-hover:bg-[#F9D949]/10 group-hover:border-[#F9D949]/50 transition-all">
                        <system.icon className="w-6 h-6 text-[#F9D949]" />
                      </div>
                      <div className={`flex items-center gap-2 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-sm font-bold uppercase">{status}</span>
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-[#FFFBE7] mb-2 group-hover:text-[#F9D949] transition-colors">
                      {system.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-[#FFFBE7]/60 mb-4">
                      {system.description}
                    </p>

                    {/* Metrics */}
                    {system.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {system.metrics.map((metric, idx) => (
                          <div key={idx} className="flex-1 min-w-[100px] p-3 rounded-xl bg-black/50 border border-[#7C2F39]/30">
                            <div className="text-xs text-[#FFFBE7]/40 mb-1">{metric.label}</div>
                            <div className="text-lg font-bold text-[#F9D949]">{metric.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Arrow */}
                    <div className="mt-4 flex items-center gap-2 text-[#F9D949] opacity-0 group-hover:opacity-100 transition-all">
                      <span className="text-sm font-semibold">View Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
            <h3 className="text-xl font-bold text-[#FFFBE7] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/strategies"
                className="flex items-center gap-3 p-4 rounded-xl bg-black/50 border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all"
              >
                <Target className="w-5 h-5 text-[#F9D949]" />
                <span className="text-[#FFFBE7]">Configure Strategies</span>
              </Link>
              <Link
                href="/risk"
                className="flex items-center gap-3 p-4 rounded-xl bg-black/50 border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all"
              >
                <Shield className="w-5 h-5 text-[#F9D949]" />
                <span className="text-[#FFFBE7]">Adjust Risk Limits</span>
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-3 p-4 rounded-xl bg-black/50 border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all"
              >
                <MessageSquare className="w-5 h-5 text-[#F9D949]" />
                <span className="text-[#FFFBE7]">Ask AI Assistant</span>
              </Link>
            </div>
          </div>
        </div>
      </PageContent>
    </>
  );
}
