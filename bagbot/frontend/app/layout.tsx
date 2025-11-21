'use client';

/**
 * Root Layout Component for BagBot Trading Platform
 * Main application layout with navigation, header, and theme support
 */

import React from 'react';
import ThemeToggle from '../components/ThemeToggle';
import Sidebar from '../components/Layout/Sidebar';
import TickerTape from '../components/Dashboard/TickerTape';
import '../styles/globals.css';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component with header, navigation, and content area
 * @param children - Page content to render
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [activeRoute, setActiveRoute] = React.useState('/');

  /**
   * Handle navigation item click
   */
  const handleNavClick = (href: string) => {
    setActiveRoute(href);
  };

  return (
    <html lang="en">
      <head>
        <title>BagBot Trading Platform</title>
        <meta name="description" content="Professional trading bot dashboard" />
      </head>
      <body>
        <div className="min-h-screen bg-primary text-main">
      {/* Header */}
      <header className="bg-card shadow-custom-md border-b border-main">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-primary">
                  BagBot Dashboard
                </h1>
                <div className="flex items-center space-x-3">
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
            <div className="flex items-center space-x-4">
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-muted">Live</span>
              </div>
              
              {/* Theme Toggle */}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Premium Ticker Tape - Live Market Prices */}
      <TickerTape />

      {/* Main Layout */}
      <div className="flex">
        {/* Enhanced Collapsible Sidebar */}
        <Sidebar activeRoute={activeRoute} onNavigate={handleNavClick} />

        {/* Main Content Area */}
        <main className="flex-1 bg-primary">
          {/* Content Container */}
          <div className="container mx-auto px-6 py-6">
            {/* Page Content */}
            <div className="bg-card rounded-xl shadow-custom-lg border border-main min-h-[calc(100vh-8rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation - Hidden on Desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => handleNavClick('/')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all ${activeRoute === '/' ? 'text-amber-500' : 'text-muted'}`}
          >
            <span className="text-lg">📊</span>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => handleNavClick('/charts')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all ${activeRoute === '/charts' ? 'text-amber-500' : 'text-muted'}`}
          >
            <span className="text-lg">📈</span>
            <span className="text-xs font-medium">Charts</span>
          </button>
          <button
            onClick={() => handleNavClick('/signals')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all ${activeRoute === '/signals' ? 'text-amber-500' : 'text-muted'}`}
          >
            <span className="text-lg">⚡</span>
            <span className="text-xs font-medium">Signals</span>
          </button>
          <button
            onClick={() => handleNavClick('/logs')}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all ${activeRoute === '/logs' ? 'text-amber-500' : 'text-muted'}`}
          >
            <span className="text-lg">📋</span>
            <span className="text-xs font-medium">Logs</span>
          </button>
        </div>
      </div>
    </div>
      </body>
    </html>
  );
};

export default Layout;