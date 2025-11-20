'use client';

/**
 * Root Layout Component for BagBot Trading Platform
 * Main application layout with navigation, header, and theme support
 */

import React from 'react';
import ThemeToggle from '../components/ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Navigation items for the trading platform
 */
const navigationItems = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Charts', href: '/charts', icon: '📈' },
  { name: 'Signals', href: '/signals', icon: '⚡' },
  { name: 'Logs', href: '/logs', icon: '📋' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

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
    <div className="min-h-screen bg-primary text-main">
      {/* Header */}
      <header className="bg-card shadow-custom-md border-b border-main">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <img
                src="/mnt/data/1AC9BC4A-DF8A-4C03-86EC-5C998C87C4AF.jpeg"
                alt="BagBot Trading Platform Logo"
                className="h-10 w-10 rounded-lg shadow-sm object-cover"
              />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-primary">
                  BagBot Dashboard
                </h1>
                <p className="text-xs text-muted">
                  Professional Trading Platform
                </p>
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

      {/* Main Layout */}
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <nav className="w-64 bg-surface border-r border-main min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    text-left transition-all duration-200
                    ${activeRoute === item.href
                      ? 'bg-primary text-white shadow-custom-sm'
                      : 'text-main hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  aria-current={activeRoute === item.href ? 'page' : undefined}
                >
                  <span className="text-lg" role="img" aria-label={item.name}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.name}</span>
                  {activeRoute === item.href && (
                    <div className="ml-auto w-1 h-6 bg-accent rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Navigation Footer */}
            <div className="mt-8 pt-4 border-t border-main">
              <div className="px-4 py-2">
                <p className="text-xs text-muted">
                  Version 1.0.0
                </p>
                <p className="text-xs text-muted">
                  © 2025 BagBot
                </p>
              </div>
            </div>
          </div>
        </nav>

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

      {/* Mobile Navigation (Hidden by default, can be toggled) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-main">
        <div className="flex items-center justify-around py-2">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.href)}
              className={`
                flex flex-col items-center space-y-1 py-2 px-3 rounded-lg
                transition-all duration-200
                ${activeRoute === item.href
                  ? 'text-primary'
                  : 'text-muted hover:text-main'
                }
              `}
            >
              <span className="text-lg" role="img" aria-label={item.name}>
                {item.icon}
              </span>
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Layout;