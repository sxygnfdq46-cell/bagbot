'use client';

import { useState, useEffect } from 'react';
import ThreadInspector from './ThreadInspector';
import ResourceMatrix from './ResourceMatrix';
import SafetyGateMonitor from './SafetyGateMonitor';
import ExecutionQueueView from './ExecutionQueueView';
import UplinkDiagnostics from './UplinkDiagnostics';
import { useIntelligenceStream } from '@/hooks/useIntelligenceStream';
import { IntelligenceAPI } from '@/src/engine/stability-shield/ShieldIntelligenceAPI';

/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 17.4 — OPERATIONAL CONTROL HUB
 * ═══════════════════════════════════════════════════════════════════
 * Admin-only control center with 6 operational modules
 * Purple Techwave Theme with GPU-accelerated effects
 * 
 * Safety: ALL actions require manual confirmation
 * No autonomous control - YOU decide everything
 * 
 * Modules:
 * 1. 🔧 System Controls - Start/stop, performance modes
 * 2. 📊 Resource Allocation - CPU/Memory/GPU monitoring
 * 3. 🧵 Process Thread Inspector - 50+ AI micro-threads
 * 4. 🛡 Safety Gate Monitor - Approval system display
 * 5. ⚙️ Execution Queue Manager - Task queue with 4D metadata
 * 6. 📡 System Uplink Diagnostics - Network/sync health
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

type PerformanceMode = 'eco' | 'balanced' | 'turbo';
type SystemModule = 'memory' | 'brain' | 'emotional' | 'risk' | 'orchestrator';

interface SystemStatus {
  module: SystemModule;
  running: boolean;
  uptime: string;
  health: number; // 0-100
}

interface ConfirmationModal {
  show: boolean;
  action: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function OperationalControlHub() {
  const { snapshot, clusters } = useIntelligenceStream();
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');
  
  // Live intelligence metrics
  const cascadeRisks = IntelligenceAPI.getCascadeRiskMatrix();
  const destabilizing = IntelligenceAPI.getDestabilizingLinks();
  const predictions = snapshot.predictions;
  const liveThreadCount = clusters.reduce((sum, c) => sum + c.members.length, 0);
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([
    { module: 'memory', running: true, uptime: '47d 12h', health: 98 },
    { module: 'brain', running: true, uptime: '47d 12h', health: 97 },
    { module: 'emotional', running: true, uptime: '47d 12h', health: 95 },
    { module: 'risk', running: true, uptime: '47d 12h', health: 99 },
    { module: 'orchestrator', running: true, uptime: '47d 12h', health: 96 }
  ]);
  const [confirmModal, setConfirmModal] = useState<ConfirmationModal>({
    show: false,
    action: '',
    description: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Request confirmation for any system-affecting action
  const requestConfirmation = (action: string, description: string, onConfirm: () => void) => {
    setConfirmModal({
      show: true,
      action,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmModal({ ...confirmModal, show: false });
      },
      onCancel: () => {
        setConfirmModal({ ...confirmModal, show: false });
      }
    });
  };

  // Performance mode change handler
  const handlePerformanceModeChange = (mode: PerformanceMode) => {
    requestConfirmation(
      `Switch to ${mode.toUpperCase()} mode`,
      `This will adjust system resource allocation. Current mode: ${performanceMode.toUpperCase()}`,
      () => {
        setPerformanceMode(mode);
        console.log(`Performance mode changed to: ${mode}`);
      }
    );
  };

  // Module control handler
  const handleModuleToggle = (module: SystemModule) => {
    const status = systemStatuses.find(s => s.module === module);
    if (!status) return;

    const action = status.running ? 'Stop' : 'Start';
    requestConfirmation(
      `${action} ${module} module`,
      `This will ${action.toLowerCase()} the ${module} subsystem. Health: ${status.health}%`,
      () => {
        setSystemStatuses(prev => prev.map(s => 
          s.module === module ? { ...s, running: !s.running } : s
        ));
        console.log(`${action} module: ${module}`);
      }
    );
  };

  // Reset subsystem handler
  const handleSubsystemReset = (module: SystemModule) => {
    requestConfirmation(
      `Reset ${module} subsystem`,
      `⚠️ This will restart the ${module} module. Uptime will be reset. Proceed with caution.`,
      () => {
        setSystemStatuses(prev => prev.map(s => 
          s.module === module ? { ...s, uptime: '0d 0h', health: 100 } : s
        ));
        console.log(`Reset subsystem: ${module}`);
      }
    );
  };

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gradient-to-br from-purple-950/20 to-black control-hub-container">
      {/* Neon Frame Anchors */}
      <div className="frame-anchor frame-anchor-tl" />
      <div className="frame-anchor frame-anchor-tr" />
      <div className="frame-anchor frame-anchor-bl" />
      <div className="frame-anchor frame-anchor-br" />

      {/* Cascade Warning Banner */}
      {cascadeRisks.length > 0 && (
        <div className="mb-4 p-3 bg-red-950/50 border-2 border-red-500/70 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="font-bold text-red-300">CASCADE WARNING</h4>
              <p className="text-xs text-red-400">
                {cascadeRisks.length} high-risk correlations detected - {destabilizing.length} destabilizing links active
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Intelligence Panel */}
      <div className="mb-4 grid grid-cols-4 gap-4">
        {/* Live Thread Count */}
        <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-lg">
          <div className="text-xs text-purple-400 mb-1">🧵 Active Threads</div>
          <div className="text-3xl font-bold text-purple-200">{liveThreadCount}</div>
          <div className="text-xs text-purple-500 mt-1">
            {clusters.length} clusters
          </div>
        </div>

        {/* Forecast Shift Indicators */}
        <div className="p-4 bg-cyan-950/30 border border-cyan-500/30 rounded-lg">
          <div className="text-xs text-cyan-400 mb-1">🔮 Predictions</div>
          <div className="text-3xl font-bold text-cyan-200">
            {predictions.nearTerm.length + predictions.midTerm.length}
          </div>
          <div className="text-xs text-cyan-500 mt-1">
            {predictions.nearTerm.filter((p: any) => p.severity >= 4).length} critical
          </div>
        </div>

        {/* Cascading Warning Flashes */}
        <div className="p-4 bg-orange-950/30 border border-orange-500/30 rounded-lg">
          <div className="text-xs text-orange-400 mb-1">⚡ Cascade Risk</div>
          <div className={`text-3xl font-bold ${
            cascadeRisks.length > 0 ? 'text-red-400 animate-pulse' : 'text-orange-200'
          }`}>
            {cascadeRisks.length}
          </div>
          <div className="text-xs text-orange-500 mt-1">
            {cascadeRisks.length > 0 ? 'Active warnings' : 'No warnings'}
          </div>
        </div>

        {/* Toggle Safety Locks */}
        <div className="p-4 bg-green-950/30 border border-green-500/30 rounded-lg">
          <div className="text-xs text-green-400 mb-1">🔒 Safety Lock</div>
          <div className="text-3xl font-bold text-green-200">ON</div>
          <div className="text-xs text-green-500 mt-1">
            All systems protected
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">⚙️</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Operational Control Hub
          </h2>
          <div className="ml-auto px-3 py-1 bg-purple-500/20 border border-purple-400/50 rounded-full text-xs text-purple-300 hologram-tag">
            PHASE 2 • 85% Complete
          </div>
        </div>
        <p className="text-sm text-purple-400">
          Full system control • Manual approval required • Level 17.4 Enhanced
        </p>
      </div>

      {/* System Controls Section */}
      <div className="control-hub-section blur-panel mb-6">
        <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
          <span>🔧</span>
          <span>System Controls</span>
          <span className="ml-auto text-xs text-purple-500 font-normal">● Live Control</span>
        </h3>

        {/* Performance Mode Selector with Toggle Switches */}
        <div className="mb-6">
          <div className="text-sm text-purple-400 mb-3 flex items-center gap-2">
            <span>Performance Mode</span>
            <div className="safe-mode-indicator">
              <span className="text-xs text-orange-400">🔒 Safe Mode: ON</span>
            </div>
          </div>
          <div className="flex gap-3">
            {(['eco', 'balanced', 'turbo'] as PerformanceMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => handlePerformanceModeChange(mode)}
                className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-240 hologram-button ${
                  performanceMode === mode
                    ? 'bg-purple-500/30 border-purple-400 text-purple-200 active-mode'
                    : 'bg-purple-950/30 border-purple-800/30 text-purple-400 hover:border-purple-500/50'
                }`}
              >
                <div className="text-sm font-medium uppercase flex items-center justify-center gap-2">
                  {performanceMode === mode && <span className="mode-indicator">●</span>}
                  {mode}
                </div>
                <div className="text-xs mt-1 opacity-70">
                  {mode === 'eco' && '⚡ Power saving'}
                  {mode === 'balanced' && '⚖️ Optimal'}
                  {mode === 'turbo' && '🚀 Max performance'}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-2 text-xs text-purple-500 text-center">
            ⚠️ Confirm → Execute • No auto-switching
          </div>
        </div>

        {/* Module Controls with Toggle Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemStatuses.map(status => (
            <div
              key={status.module}
              className="control-hub-card blur-panel p-4 rounded-lg module-control-card"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-purple-200 capitalize flex items-center gap-2">
                  <div className={`status-orb ${
                    status.running ? 'status-orb-active' : 'status-orb-inactive'
                  }`} />
                  {status.module}
                </div>
                <div className="toggle-switch-container">
                  <div className={`toggle-switch ${
                    status.running ? 'toggle-switch-on' : 'toggle-switch-off'
                  }`}>
                    <div className="toggle-switch-slider" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs mb-4">
                <div className="flex justify-between text-purple-400">
                  <span>Uptime</span>
                  <span className="text-purple-200">{status.uptime}</span>
                </div>
                <div className="flex justify-between text-purple-400">
                  <span>Health</span>
                  <span className="text-purple-200">{status.health}%</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleModuleToggle(status.module)}
                  className={`flex-1 px-3 py-2 text-xs rounded border transition-all duration-240 hologram-button ${
                    status.running
                      ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:shadow-red-ripple'
                      : 'bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:shadow-green-ripple'
                  }`}
                >
                  {status.running ? '⏹ Stop' : '▶️ Start'}
                </button>
                <button
                  onClick={() => handleSubsystemReset(status.module)}
                  className="px-3 py-2 text-xs rounded border bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30 transition-all duration-240 hologram-button hover:shadow-orange-ripple"
                >
                  🔄 Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Modules Grid - 3-Column Adaptive Layout */}
      <div className="adaptive-3col-grid">
        {/* Resource Matrix */}
        <div className="control-hub-section blur-panel">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Resource Allocation</span>
            <span className="ml-auto text-xs text-purple-500 font-normal">Ring Meters</span>
          </h3>
          <ResourceMatrix />
        </div>

        {/* Thread Inspector */}
        <div className="control-hub-section blur-panel">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>🧵</span>
            <span>Thread Inspector</span>
            <span className="ml-auto text-xs text-purple-500 font-normal">64 Threads</span>
          </h3>
          <ThreadInspector />
        </div>

        {/* Safety Gate Monitor */}
        <div className="control-hub-section blur-panel">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>🛡</span>
            <span>Safety Gates</span>
            <span className="ml-auto text-xs text-purple-500 font-normal">5 Pathways</span>
          </h3>
          <SafetyGateMonitor />
        </div>

        {/* Execution Queue */}
        <div className="control-hub-section blur-panel">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>⚙️</span>
            <span>Execution Queue</span>
            <span className="ml-auto text-xs text-purple-500 font-normal">Time Reversal</span>
          </h3>
          <ExecutionQueueView />
        </div>

        {/* Uplink Diagnostics */}
        <div className="control-hub-section blur-panel adaptive-3col-span">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <span>📡</span>
            <span>System Uplink</span>
            <span className="ml-auto text-xs text-purple-500 font-normal">Recovery System</span>
          </h3>
          <UplinkDiagnostics />
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-purple-950/95 to-black border-2 border-purple-500/50 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-purple-200 mb-2">
                {confirmModal.action}
              </h3>
              <p className="text-sm text-purple-400">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmModal.onCancel}
                className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 px-4 py-3 bg-purple-500/30 hover:bg-purple-500/50 border border-purple-400 text-purple-200 rounded-lg transition-colors font-medium"
              >
                Confirm
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-800/30 text-xs text-center text-purple-500">
              🛡 All actions require manual approval
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-purple-800/30">
        <div className="flex items-center justify-between text-xs text-purple-500">
          <div className="flex items-center gap-4">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              Live Control
            </span>
          </div>
          <div>Manual approval required for all actions</div>
        </div>
      </div>
    </div>
  );
}
