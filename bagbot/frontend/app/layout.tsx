'use client';

/**
 * Root Layout Component for BagBot Trading Platform
 * Main application layout with navigation, header, and theme support
 */

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';
import Sidebar from '../components/Layout/Sidebar';
import TickerTape from '../components/Dashboard/TickerTape';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component with header, navigation, and content area
 * @param children - Page content to render
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  // Hide sidebar and header on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || 
                      pathname === '/forgot-password' || pathname === '/reset-password' ||
                      pathname === '/';

  /**
   * Handle navigation item click
   */
  const handleNavClick = (href: string) => {
    router.push(href);
  };

  // If it's an auth page, render children without layout
  if (isAuthPage) {
    return (
      <html lang="en">
        <head>
          <title>BagBot Trading Platform</title>
          <meta name="description" content="Professional trading bot dashboard" />
        </head>
        <body>
          <AuthProvider>
            {children}
          </AuthProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>BagBot Trading Platform</title>
        <meta name="description" content="Professional trading bot dashboard" />
      </head>
      <body>
        <AuthProvider>
        <div className="min-h-screen bg-primary text-main">
      {/* Header */}
      <header className="bg-card shadow-custom-md border-b border-main">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col">
                <h1 className="text-base sm:text-xl font-bold text-primary">
                  BagBot Dashboard
                </h1>
                <div className="hidden sm:flex items-center space-x-3">
                  {/* Professional Trader Photo */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-amber-500/40 hover:border-amber-500/70 transition-all shadow-lg hover:shadow-amber-500/30 animate-float" style={{ animationDelay: '0.1s' }}>
                    <img
                      src="/professional-trader.svg"
                      alt="Professional Trader"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted font-medium">
                    Professional Trading Platform
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Theme Toggle */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-muted">Live</span>
              </div>
              
              {/* Theme Toggle */}
              <div className="scale-90 sm:scale-100">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Ticker Tape - Live Market Prices */}
      <TickerTape />

      {/* Main Layout */}
      <div className="flex">
        {/* Enhanced Collapsible Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block">
          <Sidebar activeRoute={pathname} onNavigate={handleNavClick} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 bg-primary">
          {/* Content Container */}
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 pb-20 lg:pb-6">
            {/* Page Content */}
            <div className="bg-card rounded-lg sm:rounded-xl shadow-custom-lg border border-main min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-8rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation - Hidden on Desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#2A1721]/98 to-[#2A1721]/95 border-t border-[#C75B7A]/30 shadow-lg z-50 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-1 safe-bottom">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className={`flex flex-col items-center space-y-0.5 py-2 px-2 rounded-lg transition-all min-w-[60px] ${pathname === '/dashboard' ? 'text-amber-500 bg-amber-500/10' : 'text-[#D4B5C4]'}`}
          >
            <span className="text-xl">📊</span>
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => handleNavClick('/charts')}
            className={`flex flex-col items-center space-y-0.5 py-2 px-2 rounded-lg transition-all min-w-[60px] ${pathname === '/charts' ? 'text-amber-500 bg-amber-500/10' : 'text-[#D4B5C4]'}`}
          >
            <span className="text-xl">📈</span>
            <span className="text-[10px] font-medium">Charts</span>
          </button>
          <button
            onClick={() => handleNavClick('/signals')}
            className={`flex flex-col items-center space-y-0.5 py-2 px-2 rounded-lg transition-all min-w-[60px] ${pathname === '/signals' ? 'text-amber-500 bg-amber-500/10' : 'text-[#D4B5C4]'}`}
          >
            <span className="text-xl">⚡</span>
            <span className="text-[10px] font-medium">Signals</span>
          </button>
          <button
            onClick={() => handleNavClick('/logs')}
            className={`flex flex-col items-center space-y-0.5 py-2 px-2 rounded-lg transition-all min-w-[60px] ${pathname === '/logs' ? 'text-amber-500 bg-amber-500/10' : 'text-[#D4B5C4]'}`}
          >
            <span className="text-xl">📋</span>
            <span className="text-[10px] font-medium">Logs</span>
          </button>
          <button
            onClick={() => handleNavClick('/settings')}
            className={`flex flex-col items-center space-y-0.5 py-2 px-2 rounded-lg transition-all min-w-[60px] ${pathname === '/settings' ? 'text-amber-500 bg-amber-500/10' : 'text-[#D4B5C4]'}`}
          >
            <span className="text-xl">⚙️</span>
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
        </AuthProvider>
      </body>
    </html>
  );
};

export default Layout;