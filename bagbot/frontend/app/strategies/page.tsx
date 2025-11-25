'use client';

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Target, TrendingUp, Shield, Zap, Play, Pause, Settings } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';
import PageContent from '@/components/Layout/PageContent';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/strategies');
      const data = await response.json();
      setStrategies(data.strategies || []);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStrategy = async (strategyId: string, enabled: boolean) => {
    try {
      const endpoint = enabled ? 'disable' : 'enable';
      await fetch(`http://localhost:8000/api/strategies/${strategyId}/${endpoint}`, {
        method: 'POST'
      });
      fetchStrategies();
    } catch (error) {
      console.error('Failed to toggle strategy:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-[#4ADE80]';
      case 'Intermediate': return 'text-[#F9D949]';
      case 'Advanced': return 'text-[#7C2F39]';
      default: return 'text-[#FFFBE7]';
    }
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/strategies" />
      <PageContent>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span className="text-[#FFFBE7]/30">/</span>
            <span className="text-[#F9D949] font-semibold">Strategy Arsenal</span>
          </nav>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-[#FFFBE7] mb-3">
              Strategy Arsenal
            </h1>
            <p className="text-lg text-[#FFFBE7]/70">
              9 institutional-grade trading strategies
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/20 to-black border border-[#7C2F39]/50">
              <div className="text-sm text-[#FFFBE7]/60 mb-1">Total Strategies</div>
              <div className="text-2xl font-bold text-[#F9D949]">{strategies.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/20 to-black border border-[#7C2F39]/50">
              <div className="text-sm text-[#FFFBE7]/60 mb-1">Active</div>
              <div className="text-2xl font-bold text-[#4ADE80]">
                {strategies.filter(s => s.enabled).length}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/20 to-black border border-[#7C2F39]/50">
              <div className="text-sm text-[#FFFBE7]/60 mb-1">Avg Win Rate</div>
              <div className="text-2xl font-bold text-[#F9D949]">
                {strategies.length > 0 
                  ? `${(strategies.reduce((acc, s) => acc + s.win_rate, 0) / strategies.length * 100).toFixed(0)}%`
                  : '0%'
                }
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#7C2F39]/20 to-black border border-[#7C2F39]/50">
              <div className="text-sm text-[#FFFBE7]/60 mb-1">Total Signals</div>
              <div className="text-2xl font-bold text-[#F9D949]">1,247</div>
            </div>
          </div>

          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                  strategy.enabled
                    ? 'bg-gradient-to-br from-[#7C2F39]/10 to-black border-[#F9D949]/50 shadow-lg shadow-[#F9D949]/10'
                    : 'bg-gradient-to-br from-[#1a0a0f] to-black border-[#7C2F39]/30 opacity-70'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#FFFBE7] mb-1">
                      {strategy.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${getDifficultyColor(strategy.difficulty)}`}>
                        {strategy.difficulty}
                      </span>
                      <span className="text-[#FFFBE7]/40">•</span>
                      <span className="text-sm text-[#FFFBE7]/60">
                        Win Rate: {(strategy.win_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleStrategy(strategy.id, strategy.enabled)}
                    className={`p-3 rounded-xl transition-all ${
                      strategy.enabled
                        ? 'bg-[#4ADE80]/20 border-2 border-[#4ADE80]/50 text-[#4ADE80]'
                        : 'bg-black/50 border-2 border-[#7C2F39]/30 text-[#FFFBE7]/40'
                    }`}
                  >
                    {strategy.enabled ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-[#FFFBE7]/70 mb-4">
                  {strategy.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedStrategy(strategy.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#7C2F39]/20 border border-[#7C2F39]/50 text-[#F9D949] hover:bg-[#7C2F39]/30 transition-all"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Performance
                  </button>
                  <Link
                    href={`/strategies/${strategy.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#7C2F39]/20 border border-[#7C2F39]/50 text-[#F9D949] hover:bg-[#7C2F39]/30 transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageContent>
    </>
  );
}
