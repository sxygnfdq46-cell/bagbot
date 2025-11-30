'use client';

import { useState, useEffect } from 'react';
import { SystemDashboardGrid } from '../../components/ui';
import { SciFiShell } from '../sci-fi-shell';
import PageTransition from '../../components/PageTransition';
import SystemOverviewDeck from '../../components/admin/SystemOverviewDeck';
import UserIntelligenceBoard from '../../components/admin/UserIntelligenceBoard';
import OperationalControlHub from '../../components/admin/OperationalControlHub';
import SystemDiagnosticsPanel from '../../components/admin/SystemDiagnosticsPanel';

/**
 * 🚀 LEVEL 17.1 — ADMIN PAGE SHELL
 * 
 * A sci-fi control center with 4-panel dashboard grid.
 * Protected by local-only front-end gate (safe).
 * 
 * Safety: No backend access, no autonomous actions.
 * Purpose: Visual control center for UI operations only.
 */

export default function AdminPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage for previous authorization
  useEffect(() => {
    const authorized = localStorage.getItem('bagbot_admin_authorized') === 'true';
    setIsAuthorized(authorized);
    setIsLoading(false);
  }, []);

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Local-only gate: simple front-end protection
    // This is NOT security — it's a UI courtesy barrier
    if (accessCode === 'LEVEL17' || accessCode === 'admin') {
      localStorage.setItem('bagbot_admin_authorized', 'true');
      setIsAuthorized(true);
    } else {
      alert('Invalid access code. Try "LEVEL17" or "admin"');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bagbot_admin_authorized');
    setIsAuthorized(false);
    setAccessCode('');
  };

  // Loading state
  if (isLoading) {
    return (
      <SciFiShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-cyan-400">Loading Admin Center...</div>
        </div>
      </SciFiShell>
    );
  }

  // Access gate (not authorized)
  if (!isAuthorized) {
    return (
      <SciFiShell>
        <PageTransition>
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="max-w-md w-full">
              {/* Holographic Access Panel */}
              <div className="relative">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 blur-xl rounded-2xl" />
                
                {/* Main panel */}
                <div className="relative bg-black/80 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 shadow-2xl">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-block relative mb-4">
                      <div className="absolute inset-0 animate-pulse-ring" />
                      <div className="relative text-6xl">🔒</div>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                      ADMIN ACCESS
                    </h1>
                    <p className="text-gray-400 text-sm">
                      Level 17 — Control Center
                    </p>
                  </div>

                  {/* Access form */}
                  <form onSubmit={handleAccessSubmit} className="space-y-6">
                    <div>
                      <label className="block text-cyan-400 text-sm font-medium mb-2">
                        Access Code
                      </label>
                      <input
                        type="password"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Enter access code..."
                        className="w-full px-4 py-3 bg-black/50 border border-cyan-500/50 rounded-lg 
                                 text-white placeholder-gray-500 
                                 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20
                                 transition-all duration-200"
                        autoFocus
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Hint: Try "LEVEL17" or "admin"
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-6 
                               bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 
                               hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400
                               text-white font-medium rounded-lg
                               transform transition-all duration-200
                               hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50
                               active:scale-95"
                    >
                      🚀 Enter Admin Center
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-gray-700/50">
                    <p className="text-center text-xs text-gray-500">
                      ⚠️ Local-only access gate • No backend authentication
                      <br />
                      Safe UI control center • No autonomous actions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </SciFiShell>
    );
  }

  // Authorized: Show admin dashboard
  return (
    <SciFiShell>
      <PageTransition>
        <div className="min-h-screen p-4">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  🚀 ADMIN CONTROL CENTER
                </h1>
                <p className="text-gray-400 text-sm">
                  Level 17 — System Overview • User Intelligence • Operations • Diagnostics
                </p>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 
                         text-red-400 rounded-lg transition-colors duration-200 text-sm"
              >
                🔒 Logout
              </button>
            </div>
          </div>

          {/* Dashboard Grid */}
          <SystemDashboardGrid
            initialLayout={{
              id: 'admin-layout',
              name: 'Admin Dashboard',
              gridSize: 20,
              snapToGrid: true,
              panels: [
                {
                  id: 'system-overview',
                  title: '📊 System Overview',
                  component: <SystemOverviewDeck />,
                  size: 'medium',
                  position: 'custom',
                  x: 20,
                  y: 20,
                  width: 600,
                  height: 400,
                  minWidth: 400,
                  minHeight: 300,
                  resizable: true,
                  draggable: true,
                  closable: false,
                  collapsible: true,
                  collapsed: false,
                  zIndex: 1,
                  visible: true
                },
                {
                  id: 'user-intelligence',
                  title: '👥 User Intelligence',
                  component: <UserIntelligenceBoard />,
                  size: 'medium',
                  position: 'custom',
                  x: 640,
                  y: 20,
                  width: 600,
                  height: 400,
                  minWidth: 400,
                  minHeight: 300,
                  resizable: true,
                  draggable: true,
                  closable: false,
                  collapsible: true,
                  collapsed: false,
                  zIndex: 1,
                  visible: true
                },
                {
                  id: 'operations',
                  title: '⚙️ Operations',
                  component: <OperationalControlHub />,
                  size: 'medium',
                  position: 'custom',
                  x: 20,
                  y: 440,
                  width: 600,
                  height: 400,
                  minWidth: 400,
                  minHeight: 300,
                  resizable: true,
                  draggable: true,
                  closable: false,
                  collapsible: true,
                  collapsed: false,
                  zIndex: 1,
                  visible: true
                },
                {
                  id: 'diagnostics',
                  title: '🔍 Diagnostics',
                  component: <SystemDiagnosticsPanel />,
                  size: 'medium',
                  position: 'custom',
                  x: 640,
                  y: 440,
                  width: 600,
                  height: 400,
                  minWidth: 400,
                  minHeight: 300,
                  resizable: true,
                  draggable: true,
                  closable: false,
                  collapsible: true,
                  collapsed: false,
                  zIndex: 1,
                  visible: true
                }
              ]
            }}
            gridSize={20}
            snapToGrid={true}
            onLayoutChange={(layout) => {
              // Save layout to localStorage
              localStorage.setItem('admin_dashboard_layout', JSON.stringify(layout));
            }}
          />
        </div>
      </PageTransition>
    </SciFiShell>
  );
}
