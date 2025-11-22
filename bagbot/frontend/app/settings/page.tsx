'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Key, Shield, Zap, Bell, DollarSign, TrendingUp, Save, CheckCircle, Home, LayoutDashboard, BarChart3, Radio, FileText, Settings, CreditCard, Smartphone, Wallet } from 'lucide-react';
import Navigation from '../components/Navigation';
import LiveTickerTape from '@/components/Dashboard/LiveTickerTape';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [tradingMode, setTradingMode] = useState<'live' | 'paper' | 'conservative'>('paper');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [paymentEmail, setPaymentEmail] = useState('');

  // Apply theme changes to the document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <LiveTickerTape />
      <Navigation active="/settings" />
      <div className="min-h-screen bg-black p-4 md:p-8 md:ml-64">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <nav className="mb-6 md:mb-8 flex items-center gap-2 text-sm">
          <Link href="/" className="text-[#FFFBE7]/60 hover:text-[#F9D949] transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <span className="text-[#FFFBE7]/30">/</span>
          <span className="text-[#F9D949] font-semibold">Settings</span>
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
          <Link href="/logs" className="px-4 py-2 rounded-lg bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7]/60 hover:border-[#F9D949]/50 hover:text-[#F9D949] font-semibold text-sm transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs
          </Link>
          <Link href="/settings" className="px-4 py-2 rounded-lg bg-[#7C2F39] border border-[#F9D949] text-[#FFFBE7] font-semibold text-sm transition-all">
            Settings
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-3">
            <span className="bg-gradient-to-r from-[#FFFBE7] to-[#F9D949] bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-[#FFFBE7]/60 text-base md:text-lg">Configure your trading system preferences</p>
        </div>

        {/* Theme Settings */}
        <div className="mb-6 p-4 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="p-2 md:p-3 rounded-xl bg-[#F9D949]/20">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 md:w-6 md:h-6 text-[#F9D949]" />
              ) : (
                <Sun className="w-5 h-5 md:w-6 md:h-6 text-[#F9D949]" />
              )}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#FFFBE7]">Theme</h2>
              <p className="text-[#FFFBE7]/60 text-xs md:text-sm">Choose your preferred color scheme</p>
            </div>
          </div>

          <div className="flex gap-3 md:gap-4">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 p-3 md:p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-[#7C2F39] border-2 border-[#F9D949]'
                  : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <Moon className="w-4 h-4 md:w-5 md:h-5 text-[#FFFBE7]" />
                <span className="text-[#FFFBE7] font-semibold text-sm md:text-base">Dark</span>
              </div>
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 p-4 rounded-xl transition-all ${
                theme === 'light'
                  ? 'bg-[#7C2F39] border-2 border-[#F9D949]'
                  : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50'
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                <Sun className="w-5 h-5 text-[#FFFBE7]" />
                <span className="text-[#FFFBE7] font-semibold">Light</span>
              </div>
            </button>
          </div>
        </div>

        {/* API Configuration */}
        <div className="mb-6 p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#4ADE80]/20">
              <Key className="w-6 h-6 text-[#4ADE80]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FFFBE7]">API Configuration</h2>
              <p className="text-[#FFFBE7]/60 text-sm">Connect to your exchange account</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                API Secret
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/30">
              <Shield className="w-5 h-5 text-[#60A5FA] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#FFFBE7]/70">
                Your API keys are encrypted and stored securely. We only use permissions for reading market data and executing trades.
              </p>
            </div>
          </div>
        </div>

        {/* Trading Mode */}
        <div className="mb-6 p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#7C2F39]/20">
              <TrendingUp className="w-6 h-6 text-[#7C2F39]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FFFBE7]">Trading Mode</h2>
              <p className="text-[#FFFBE7]/60 text-sm">Select your risk and execution strategy</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => setTradingMode('paper')}
              className={`p-6 rounded-xl transition-all ${
                tradingMode === 'paper'
                  ? 'bg-[#7C2F39] border-2 border-[#F9D949]'
                  : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50'
              }`}
            >
              <Zap className={`w-8 h-8 mb-3 ${tradingMode === 'paper' ? 'text-[#F9D949]' : 'text-[#FFFBE7]/60'}`} />
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-2">Paper Trading</h3>
              <p className="text-xs text-[#FFFBE7]/60">
                Test strategies with virtual money. Zero risk, perfect for learning.
              </p>
            </button>

            <button
              onClick={() => setTradingMode('conservative')}
              className={`p-6 rounded-xl transition-all ${
                tradingMode === 'conservative'
                  ? 'bg-[#7C2F39] border-2 border-[#F9D949]'
                  : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50'
              }`}
            >
              <Shield className={`w-8 h-8 mb-3 ${tradingMode === 'conservative' ? 'text-[#F9D949]' : 'text-[#FFFBE7]/60'}`} />
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-2">Conservative</h3>
              <p className="text-xs text-[#FFFBE7]/60">
                Lower risk, smaller positions. Ideal for steady growth.
              </p>
            </button>

            <button
              onClick={() => setTradingMode('live')}
              className={`p-6 rounded-xl transition-all ${
                tradingMode === 'live'
                  ? 'bg-[#7C2F39] border-2 border-[#F9D949]'
                  : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50'
              }`}
            >
              <DollarSign className={`w-8 h-8 mb-3 ${tradingMode === 'live' ? 'text-[#F9D949]' : 'text-[#FFFBE7]/60'}`} />
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-2">Live Trading</h3>
              <p className="text-xs text-[#FFFBE7]/60">
                Full automation with real capital. Maximum potential.
              </p>
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30 glass-5d depth-5d-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#4ADE80]/20">
              <Wallet className="w-6 h-6 text-[#4ADE80]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FFFBE7]">Payment Methods</h2>
              <p className="text-[#FFFBE7]/60 text-sm">Add your preferred payment methods for deposits & withdrawals</p>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {[
              { id: 'mtn', name: 'MTN Mobile Money', icon: Smartphone, color: 'from-[#FFCB05] to-[#FFA500]' },
              { id: 'airtel', name: 'Airtel Money', icon: Smartphone, color: 'from-[#EF4444] to-[#DC2626]' },
              { id: 'mpesa', name: 'M-Pesa', icon: Smartphone, color: 'from-[#4ADE80] to-[#22C55E]' },
              { id: 'visa', name: 'Visa/Mastercard', icon: CreditCard, color: 'from-[#1E40AF] to-[#1E3A8A]' },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  className={`p-4 md:p-6 rounded-xl transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#7C2F39] border-2 border-[#F9D949] scale-105'
                      : 'bg-black/50 border-2 border-[#7C2F39]/30 hover:border-[#F9D949]/50 hover:scale-102'
                  }`}
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center shadow-lg ${isSelected ? 'animate-pulse' : ''}`}>
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <h3 className="text-xs md:text-sm font-bold text-[#FFFBE7] text-center">{method.name}</h3>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-[#F9D949]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Payment Details Form */}
          {selectedPaymentMethod && (
            <div className="space-y-4 p-4 md:p-6 rounded-xl bg-black/30 border border-[#7C2F39]/20 animate-fade-in">
              <h3 className="text-lg font-bold text-[#FFFBE7] mb-4">
                {selectedPaymentMethod === 'visa' ? 'Card Details' : 'Mobile Money Details'}
              </h3>
              
              {selectedPaymentMethod !== 'visa' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={(e) => setPaymentPhone(e.target.value)}
                      placeholder="+256 700 000 000"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                      Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        maxLength={3}
                        className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#FFFBE7] mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] placeholder-[#FFFBE7]/30 focus:border-[#F9D949] focus:outline-none transition-all"
                    />
                  </div>
                </>
              )}

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 mt-4">
                <Shield className="w-5 h-5 text-[#4ADE80] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#FFFBE7]/70">
                  Your payment information is encrypted and secure. We never store your card CVV or mobile money PIN.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="mb-6 p-8 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#60A5FA]/20">
              <Bell className="w-6 h-6 text-[#60A5FA]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FFFBE7]">Notifications</h2>
              <p className="text-[#FFFBE7]/60 text-sm">Manage alert preferences</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Trade Executions', description: 'Get notified when trades are executed' },
              { label: 'Signal Alerts', description: 'Receive new trading signal notifications' },
              { label: 'Risk Warnings', description: 'Alert for high volatility and risk events' },
              { label: 'System Status', description: 'Updates about system health and maintenance' }
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-[#7C2F39]/20"
              >
                <div>
                  <div className="text-[#FFFBE7] font-semibold">{item.label}</div>
                  <div className="text-xs text-[#FFFBE7]/50 mt-1">{item.description}</div>
                </div>
                <button className="relative w-14 h-7 rounded-full bg-[#4ADE80] transition-all">
                  <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-white"></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button className="px-6 py-3 rounded-xl bg-black/50 border border-[#7C2F39]/30 text-[#FFFBE7] font-semibold hover:border-[#F9D949]/50 transition-all">
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#7C2F39] to-[#991B1B] text-[#FFFBE7] font-bold hover:from-[#991B1B] hover:to-[#7C2F39] transition-all flex items-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* Info Footer */}
        {saved && (
          <div className="mt-6 p-4 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#4ADE80]" />
            <p className="text-sm text-[#FFFBE7]">
              Your settings have been saved successfully and will take effect immediately.
            </p>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-[#7C2F39]/10 to-black border border-[#7C2F39]/30">
          <h3 className="text-lg font-bold text-[#FFFBE7] mb-4">Keyboard Shortcuts</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { keys: ['⌘', 'K'], action: 'Quick search' },
              { keys: ['⌘', 'D'], action: 'Go to Dashboard' },
              { keys: ['⌘', 'C'], action: 'Go to Charts' },
              { keys: ['⌘', 'S'], action: 'Go to Signals' },
              { keys: ['⌘', 'L'], action: 'Go to Logs' },
              { keys: ['⌘', ','], action: 'Settings' },
            ].map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-black/30">
                <span className="text-sm text-[#FFFBE7]/70">{shortcut.action}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <React.Fragment key={i}>
                      <kbd className="px-2 py-1 text-xs font-semibold bg-[#7C2F39]/30 border border-[#F9D949]/30 rounded text-[#FFFBE7]">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && <span className="text-[#FFFBE7]/40">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
