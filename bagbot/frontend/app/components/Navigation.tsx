'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Home, LayoutDashboard, BarChart3, Radio, FileText, Settings, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import WalletLogo from '@/components/WalletLogo';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavigationProps {
  active?: string;
}

const navigationItems: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Charts', href: '/charts', icon: BarChart3 },
  { name: 'Signals', href: '/signals', icon: Radio },
  { name: 'Logs', href: '/logs', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Navigation({ active = '/' }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar - visible on small screens only */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0F0810] to-[#1A0E15] border-b border-[#C75B7A]/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <WalletLogo size={32} animated={true} />
            <span className="relative text-lg font-black tracking-tight">
              <span className="absolute inset-0 bg-gradient-to-r from-[#F9D949] via-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent animate-gradient-x blur-sm"></span>
              <span className="relative bg-gradient-to-r from-[#F9D949] via-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent animate-gradient-x">
                BagBot
              </span>
            </span>
          </Link>

          {/* Hamburger Button */}
          <button
            onClick={toggleMobileMenu}
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg bg-[#C75B7A]/20 border border-[#C75B7A]/30 text-[#FFF8E7] hover:bg-[#C75B7A]/30 hover:border-[#F9D949]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#F9D949]"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="absolute top-full left-0 right-0 bg-gradient-to-br from-[#0F0810] via-[#1A0E15] to-[#150A12] border-b border-[#C75B7A]/20 shadow-2xl"
          >
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#F9D949] ${
                      isActive
                        ? 'bg-[#C75B7A]/30 border border-[#F9D949]/50 text-[#FFF8E7]'
                        : 'text-[#FFF8E7]/70 hover:bg-[#C75B7A]/10 hover:text-[#FFF8E7]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[#F9D949] animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Desktop Sidebar - visible on md+ screens */}
      <aside className={`hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:flex-col bg-gradient-to-b from-[#0F0810] via-[#1A0E15] to-[#150A12] border-r border-[#C75B7A]/20 shadow-2xl z-40 transition-all duration-300 glass-5d depth-5d-4 ${
        sidebarCollapsed ? 'md:w-20' : 'md:w-64'
      }`}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 w-6 h-6 bg-gradient-to-br from-[#C75B7A]/40 to-[#F9D949]/30 border border-[#E5B299]/40 rounded-full flex items-center justify-center hover:from-[#C75B7A]/60 hover:to-[#F9D949]/50 transition-all shadow-lg hover:scale-110 backdrop-blur-sm z-50 depth-5d-2 emboss-5d"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-3 h-3 text-[#FFF8E7]" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-[#FFF8E7]" />
          )}
        </button>
        {/* Logo Section */}
        <div className="p-6 border-b border-[#C75B7A]/20">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <WalletLogo size={40} animated={true} />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="relative text-xl font-black block tracking-tight">
                  <span className="absolute inset-0 bg-gradient-to-r from-[#F9D949] via-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent animate-gradient-x blur-sm"></span>
                  <span className="relative bg-gradient-to-r from-[#F9D949] via-[#FFF8E7] to-[#F9D949] bg-clip-text text-transparent animate-gradient-x drop-shadow-[0_0_8px_rgba(249,217,73,0.5)]">
                    BagBot
                  </span>
                </span>
                <span className="text-[#F9D949] text-xs font-semibold tracking-wide animate-pulse">Trading Platform</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarCollapsed ? item.name : ''}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group focus:outline-none focus:ring-2 focus:ring-[#F9D949] relative ${
                  isActive
                    ? 'bg-[#C75B7A]/30 border border-[#F9D949]/50 text-[#FFF8E7] shadow-lg'
                    : 'text-[#FFF8E7]/70 hover:bg-[#C75B7A]/10 hover:text-[#FFF8E7]'
                }`}
              >
                {/* Active Indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#F9D949] to-[#C75B7A] rounded-r-full shadow-lg shadow-[#F9D949]/50" />
                )}

                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F9D949]' : 'group-hover:text-[#F9D949]'} transition-colors flex-shrink-0`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="font-semibold flex-1">{item.name}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#F9D949] animate-pulse shadow-lg shadow-[#F9D949]/50" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-[#C75B7A]/20">
            <div className="px-4 py-2">
              <p className="text-xs text-[#FFF8E7]/50 font-medium">Version 1.0.0</p>
              <p className="text-xs text-[#FFF8E7]/30 mt-1">© 2025 BagBot</p>
            </div>
          </div>
        )}
      </aside>

      {/* Spacer for desktop sidebar - pushes content to the right */}
      <div className={`hidden md:block transition-all duration-300 ${
        sidebarCollapsed ? 'md:w-20' : 'md:w-64'
      }`} aria-hidden="true" />

      {/* Spacer for mobile top bar - pushes content down */}
      <div className="md:hidden h-14" aria-hidden="true" />
    </>
  );
}
