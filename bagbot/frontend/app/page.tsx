'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  TrendingUp, 
  Zap, 
  Shield, 
  BarChart3, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  Activity
} from 'lucide-react';

/**
 * BagBot Landing Page
 * Stunning maroon, cream & gold theme
 */
const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute trades in milliseconds with our advanced algorithmic engine',
      color: 'from-[#F9D949] to-[#FDE68A]',
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your assets are protected with military-grade encryption',
      color: 'from-[#C75B7A] to-[#E5B299]',
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Real-time insights and intelligent market predictions',
      color: 'from-[#F5D5C0] to-[#C99A7A]',
    },
    {
      icon: Target,
      title: '24/7 Trading',
      description: 'Never miss an opportunity with round-the-clock automation',
      color: 'from-[#FFF8E7] to-[#F5E6D3]',
    },
  ];

  const stats = [
    { value: '$2.5M+', label: 'Trading Volume' },
    { value: '10,000+', label: 'Active Traders' },
    { value: '99.9%', label: 'Uptime' },
    { value: '156', label: 'Countries' },
  ];

  const benefits = [
    'Advanced AI-powered trading algorithms',
    'Real-time market data and insights',
    'Customizable trading strategies',
    'Multi-exchange support',
    'Risk management tools',
    'Portfolio tracking and analytics',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0810] via-[#1A0E15] to-[#150A12] text-[#FFF8E7]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(199,91,122,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(249,217,73,0.12)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(229,178,153,0.08)_0%,transparent_60%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-[#C75B7A]/20 backdrop-blur-xl bg-[#2A1721]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C75B7A] to-[#F9D949] flex items-center justify-center shadow-lg shadow-[#C75B7A]/50">
                <Sparkles className="w-6 h-6 text-[#FFF8E7]" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent">
                BagBot
              </span>
            </div>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F9D949] to-[#FDE68A] text-[#0F0810] font-bold hover:scale-105 transform transition-all shadow-lg shadow-[#F9D949]/50 hover:shadow-xl"
            >
              Launch Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-6"
            >
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-[#C75B7A]/20 to-[#F9D949]/20 border border-[#E5B299]/30 text-sm font-semibold text-[#F9D949] backdrop-blur-sm">
                🚀 The Future of Automated Trading
              </span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-[#FFF8E7] via-[#F9D949] to-[#E5B299] bg-clip-text text-transparent">
                Trade Smarter,
              </span>
              <br />
              <span className="text-[#FFF8E7]">Not Harder</span>
            </h1>

            <p className="text-xl text-[#D4B5C4] max-w-2xl mx-auto mb-10 leading-relaxed">
              Institutional-grade automated trading platform powered by AI. 
              Join thousands of traders maximizing profits 24/7.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-[#C75B7A] to-[#F9D949] text-[#FFF8E7] font-bold text-lg hover:scale-105 transform transition-all shadow-2xl shadow-[#C75B7A]/50 hover:shadow-[#F9D949]/50 flex items-center gap-2"
              >
                Launch Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-xl border-2 border-[#C75B7A]/50 text-[#FFF8E7] font-bold text-lg hover:bg-[#C75B7A]/10 hover:border-[#F9D949]/50 transform transition-all backdrop-blur-sm"
              >
                View Features
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-[#2A1721]/80 to-[#1A0E15]/80 border border-[#C75B7A]/20 backdrop-blur-sm hover:border-[#F9D949]/40 transition-all"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-[#F9D949] to-[#FDE68A] bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#D4B5C4]">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-xl text-[#D4B5C4] max-w-2xl mx-auto">
              Everything you need to dominate the markets
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group p-8 rounded-2xl bg-gradient-to-br from-[#2A1721]/90 to-[#1A0E15]/90 border border-[#C75B7A]/20 backdrop-blur-sm hover:border-[#F9D949]/50 transition-all hover:shadow-2xl hover:shadow-[#C75B7A]/30"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-[#0F0810]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#FFF8E7] mb-3">{feature.title}</h3>
                  <p className="text-[#D4B5C4] leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent">
                Why Choose BagBot?
              </h2>
              <p className="text-xl text-[#D4B5C4] mb-8 leading-relaxed">
                Join the revolution of automated trading and experience the difference
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6 text-[#4ADE80] flex-shrink-0 mt-1" />
                    <span className="text-[#FFF8E7] text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative p-8 rounded-3xl bg-gradient-to-br from-[#2A1721]/90 to-[#1A0E15]/90 border border-[#C75B7A]/30 backdrop-blur-xl shadow-2xl">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-[#F9D949]/30 to-[#C75B7A]/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-[#C75B7A]/30 to-[#E5B299]/30 rounded-full blur-3xl" />
                
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A0E15]/50 border border-[#C75B7A]/20">
                    <span className="text-[#D4B5C4]">Win Rate</span>
                    <span className="text-2xl font-bold text-[#4ADE80]">68%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A0E15]/50 border border-[#C75B7A]/20">
                    <span className="text-[#D4B5C4]">Avg. Return</span>
                    <span className="text-2xl font-bold text-[#F9D949]">+12.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#1A0E15]/50 border border-[#C75B7A]/20">
                    <span className="text-[#D4B5C4]">Active Trades</span>
                    <span className="text-2xl font-bold text-[#E5B299]">127</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-[#C75B7A]/20 via-[#2A1721]/90 to-[#F9D949]/20 border border-[#E5B299]/30 backdrop-blur-xl shadow-2xl"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-[#FFF8E7] via-[#F9D949] to-[#E5B299] bg-clip-text text-transparent">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-[#D4B5C4] mb-10 max-w-2xl mx-auto">
            Start your journey to financial freedom with BagBot today
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-xl bg-gradient-to-r from-[#F9D949] to-[#FDE68A] text-[#0F0810] font-bold text-xl hover:scale-105 transform transition-all shadow-2xl shadow-[#F9D949]/50 hover:shadow-[#F9D949]/70"
          >
            Launch Dashboard
            <Activity className="w-6 h-6" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#C75B7A]/20 py-8 px-4 sm:px-6 lg:px-8 backdrop-blur-xl bg-[#2A1721]/30">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#D4B5C4]">
            © 2025 BagBot. All rights reserved. Built with ❤️ for traders.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
