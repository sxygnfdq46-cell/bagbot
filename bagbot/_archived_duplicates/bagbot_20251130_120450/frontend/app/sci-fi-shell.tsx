'use client';

import React, { ReactNode, useState } from 'react';
import { useTheme } from './providers';

interface SciFiShellProps {
  children: ReactNode;
}

export function SciFiShell({ children }: SciFiShellProps) {
  const { theme, toggleTheme, mode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Top Neon Status Tape */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 glass-panel holo-border"
        style={{
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${theme.border.default}`,
          boxShadow: theme.shadows.glow.cyan,
        }}
      >
        <div className="h-full px-3 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded transition-all"
              style={{
                background: 'rgba(0, 246, 255, 0.1)',
                border: `1px solid ${theme.border.default}`,
              }}
            >
              <span className="text-xl" style={{ color: theme.colors.neonCyan }}>☰</span>
            </button>

            <h1 
              className="text-lg sm:text-2xl font-bold neon-text-strong"
              style={{ color: theme.colors.neonCyan }}
            >
              BAGBOT 2.0
            </h1>
            <div className="hidden sm:flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full animate-pulse-glow"
                style={{ 
                  background: theme.colors.success,
                  boxShadow: `0 0 10px ${theme.colors.success}`,
                }}
              />
              <span className="text-xs sm:text-sm text-gray-400">SYSTEM ONLINE</span>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-2 sm:px-4 py-1.5 sm:py-2 rounded holo-border text-xs sm:text-sm font-medium transition-all"
            style={{
              background: 'rgba(0, 246, 255, 0.1)',
              color: theme.colors.neonCyan,
              border: `1px solid ${theme.border.default}`,
            }}
          >
            {mode === 'neon-dark' ? '🌙' : '☀️'}
            <span className="hidden sm:inline ml-1">
              {mode === 'neon-dark' ? 'DARK' : 'LIGHT'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1 pt-14 sm:pt-16">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Holo-Sidebar */}
        <aside
          className={`
            fixed left-0 top-14 sm:top-16 bottom-0 z-40
            w-64 sm:w-72 lg:w-64 xl:w-72
            glass-panel holo-border overflow-y-auto
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0
          `}
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${theme.border.default}`,
            boxShadow: theme.shadows.glow.soft,
          }}
        >
          <nav className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            {[
              { name: 'Home', path: '/', icon: '🏠' },
              { name: 'Dashboard', path: '/dashboard', icon: '📊' },
              { name: 'Systems', path: '/systems', icon: '⚙️' },
              { name: 'Strategies', path: '/strategies', icon: '🎯' },
              { name: 'Signals', path: '/signals', icon: '📡' },
              { name: 'Charts', path: '/charts', icon: '📈' },
              { name: 'AI Chat', path: '/chat', icon: '🤖' },
              { name: 'Logs', path: '/logs', icon: '📝' },
              { name: 'Settings', path: '/settings', icon: '🔧' },
              { name: 'Backtest', path: '/backtest', icon: '⏮️' },
              { name: 'Terminal', path: '/terminal', icon: '💻' },
            ].map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className="block px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${theme.border.subtle}`,
                  color: theme.text.secondary,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="font-medium text-sm sm:text-base">{item.name}</span>
                </div>
              </a>
            ))}
          </nav>
        </aside>

        {/* Central Holographic Glass Container */}
        <main
          className="
            flex-1 
            lg:ml-64 xl:ml-72
            p-3 sm:p-6 md:p-8
            w-full
          "
          style={{
            minHeight: 'calc(100vh - 3.5rem)',
          }}
        >
          <div
            className="glass-panel holo-border rounded-lg p-4 sm:p-6 animate-breathe"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.border.default}`,
              boxShadow: theme.shadows.glow.soft,
              minHeight: '500px',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
