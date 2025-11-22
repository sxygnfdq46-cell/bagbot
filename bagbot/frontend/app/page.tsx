import React from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, Brain, Target, CheckCircle, Activity } from 'lucide-react';
import Navigation from './components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <LiveTickerTape />
      <Navigation active="/" />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden perspective-5d">
        {/* Background Effects */}
        <div className="absolute inset-0 depth-blur">
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#7C2F39]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#F9D949]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 holographic-5d opacity-5" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <div className="animate-fade-in">
            {/* Badge */}
            <div className="mb-8 animate-float">
              <span className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#7C2F39]/30 to-[#F9D949]/20 border border-[#7C2F39]/50 text-[#F9D949] font-semibold text-sm backdrop-blur-md shadow-lg shadow-[#F9D949]/20">
                <Activity className="w-4 h-4 animate-pulse" />
                AI-Powered Trading System
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6 leading-tight tracking-tight">
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-[#FFFBE7] via-[#F9D949] to-[#FFFBE7] bg-clip-text text-transparent animate-gradient-x blur-sm"></span>
                <span className="relative bg-gradient-to-r from-[#FFFBE7] via-[#F9D949] to-[#FFFBE7] bg-clip-text text-transparent animate-gradient-x drop-shadow-[0_0_30px_rgba(249,217,73,0.4)]">
                  Trade Smarter,
                </span>
              </span>
              <br />
              <span className="relative inline-block text-[#7C2F39] animate-scale-pulse">
                Not Harder
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-[#FFFBE7]/70 max-w-3xl mx-auto mb-12 leading-relaxed">
              Institutional-grade automated trading system powered by advanced AI.
              <br className="hidden md:block" />
              Join the future of intelligent trading.
            </p>

            {/* CTA Button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#7C2F39] to-[#F9D949] text-black font-bold text-lg hover:scale-105 transform transition-all shadow-2xl shadow-[#7C2F39]/50 hover:shadow-[#F9D949]/60 depth-5d-3 emboss-5d metallic-5d"
            >
              Launch Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats Grid */}
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl mx-auto"
          >
            {[
              { label: 'Win Rate', value: '73.2%', color: 'from-[#4ADE80] to-[#22C55E]' },
              { label: 'Profit %', value: '+156%', color: 'from-[#F9D949] to-[#FDE68A]' },
              { label: 'Total Trades', value: '12.5K', color: 'from-[#7C2F39] to-[#C75B7A]' },
              { label: 'System Status', value: 'Active', color: 'from-[#60A5FA] to-[#3B82F6]' }
            ].map((stat, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className="p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 backdrop-blur-sm hover:border-[#F9D949]/50 transition-all glass-5d depth-5d-2 perspective-5d">
                  <div className={`absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r ${stat.color} metallic-5d`} />
                  <div className="text-4xl md:text-5xl font-black mb-2">
                    <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent text-5d`}>
                      {stat.value}
                    </span>
                  </div>
                  <div className="text-sm text-[#FFFBE7]/60 font-semibold tracking-wide uppercase">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-black to-[#7C2F39]/5">
        <div className="max-w-7xl mx-auto">
          <div
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-[#FFFBE7] to-[#F9D949] bg-clip-text text-transparent">
                Powered by Intelligence
              </span>
            </h2>
            <p className="text-xl text-[#FFFBE7]/60 max-w-2xl mx-auto">
              Advanced features designed for professional traders
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI Signals',
                description: 'Machine learning algorithms analyze market patterns 24/7 to identify high-probability trading opportunities',
                color: 'from-[#F9D949] to-[#FDE68A]'
              },
              {
                icon: Shield,
                title: 'Smart Risk Engine',
                description: 'Intelligent position sizing and stop-loss management to protect your capital in all market conditions',
                color: 'from-[#7C2F39] to-[#C75B7A]'
              },
              {
                icon: Target,
                title: 'Multi-Market Coverage',
                description: 'Trade across crypto, forex, and commodities with unified strategies and real-time execution',
                color: 'from-[#60A5FA] to-[#3B82F6]'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group"
                >
                  <div className="relative p-10 rounded-3xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 hover:border-[#F9D949]/50 transition-all h-full">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#FFFBE7] mb-4">{feature.title}</h3>
                    <p className="text-[#FFFBE7]/60 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C2F39]/20 to-black" />
        <div
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <div className="p-16 rounded-3xl bg-gradient-to-br from-[#7C2F39]/30 via-black to-[#F9D949]/10 border border-[#7C2F39]/50 backdrop-blur-xl">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-[#FFFBE7] via-[#F9D949] to-[#FFFBE7] bg-clip-text text-transparent">
                Ready to Transform
                <br />
                Your Trading?
              </span>
            </h2>
            <p className="text-xl text-[#FFFBE7]/70 mb-10 max-w-2xl mx-auto">
              Join thousands of traders using AI-powered automation to maximize profits
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl bg-gradient-to-r from-[#F9D949] to-[#FDE68A] text-black font-bold text-xl hover:scale-105 transform transition-all shadow-2xl shadow-[#F9D949]/50"
            >
              Get Started Now
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#7C2F39]/20 py-8 px-4 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#FFFBE7]/50 text-sm">
            © 2025 BagBot. Institutional-grade trading technology. Built for professionals.
          </p>
        </div>
      </footer>
    </div>
  );
}
