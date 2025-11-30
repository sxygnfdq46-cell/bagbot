'use client';

import { useState, useEffect } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════
 * SAFETY GATE MONITOR — Level 17.4 Module
 * ═══════════════════════════════════════════════════════════════════
 * Displays all safety gates, pending approvals, violations, and timeouts
 * Integrates with Level 13 approval system
 * 
 * Features:
 * - Approval queue display
 * - Violation logging
 * - Timeout warnings
 * - Gate status overview
 * ═══════════════════════════════════════════════════════════════════
 */

interface SafetyGate {
  id: string;
  name: string;
  status: 'active' | 'bypassed' | 'warning';
  pathway: 'open' | 'sealed' | 'read-only'; // New: pathway state
  pendingApprovals: number;
  violations: number;
  lastCheck: string;
  cooldownRemaining?: number; // New: cooldown timer in seconds
}

interface PendingApproval {
  id: string;
  action: string;
  requestedAt: string;
  timeout: number; // seconds
}

export default function SafetyGateMonitor() {
  const [gates, setGates] = useState<SafetyGate[]>([
    { id: 'memory-gate', name: 'Memory Modification Gate', status: 'active', pathway: 'open', pendingApprovals: 0, violations: 0, lastCheck: '2s ago', cooldownRemaining: 0 },
    { id: 'decision-gate', name: 'Decision Execution Gate', status: 'active', pathway: 'read-only', pendingApprovals: 0, violations: 0, lastCheck: '1s ago', cooldownRemaining: 15 },
    { id: 'external-gate', name: 'External Action Gate', status: 'active', pathway: 'open', pendingApprovals: 0, violations: 0, lastCheck: '3s ago', cooldownRemaining: 0 },
    { id: 'state-gate', name: 'State Mutation Gate', status: 'active', pathway: 'sealed', pendingApprovals: 0, violations: 0, lastCheck: '2s ago', cooldownRemaining: 0 },
    { id: 'approval-gate', name: 'Approval Required Gate', status: 'active', pathway: 'open', pendingApprovals: 0, violations: 0, lastCheck: '1s ago', cooldownRemaining: 0 }
  ]);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  useEffect(() => {
    // Simulate occasional pending approvals
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const actions = [
          'Modify memory entry',
          'Execute high-impact decision',
          'External API call',
          'State mutation request',
          'Risk calculation override'
        ];
        
        setPendingApprovals(prev => [...prev, {
          id: `approval-${Date.now()}`,
          action: actions[Math.floor(Math.random() * actions.length)],
          requestedAt: new Date().toLocaleTimeString(),
          timeout: 30
        }]);
      }

      // Remove expired approvals
      setPendingApprovals(prev => prev.filter(a => a.timeout > 0));
      
      // Decrement timeouts and cooldowns
      setPendingApprovals(prev => prev.map(a => ({ ...a, timeout: a.timeout - 1 })));
      setGates(prev => prev.map(gate => ({
        ...gate,
        cooldownRemaining: gate.cooldownRemaining ? Math.max(0, gate.cooldownRemaining - 1) : 0
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getGateStatusColor = (status: SafetyGate['status']) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'bypassed': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'warning': return 'text-red-400 bg-red-500/20 border-red-500/40';
    }
  };

  const getPathwayColor = (pathway: SafetyGate['pathway']) => {
    switch (pathway) {
      case 'open': return 'text-green-400 bg-green-500/20 border-green-500/40';
      case 'sealed': return 'text-red-400 bg-red-500/20 border-red-500/40';
      case 'read-only': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
    }
  };

  const getPathwayIcon = (pathway: SafetyGate['pathway']) => {
    switch (pathway) {
      case 'open': return '🟢';
      case 'sealed': return '🔒';
      case 'read-only': return '👁️';
    }
  };

  const totalViolations = gates.reduce((sum, gate) => sum + gate.violations, 0);
  const totalPending = pendingApprovals.length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-3">
          <div className="text-xs text-purple-400 mb-1">Pending Approvals</div>
          <div className={`text-2xl font-bold ${totalPending > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {totalPending}
          </div>
        </div>
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-lg p-3">
          <div className="text-xs text-purple-400 mb-1">Total Violations</div>
          <div className={`text-2xl font-bold ${totalViolations > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalViolations}
          </div>
        </div>
      </div>

      {/* Pending Approvals List */}
      {pendingApprovals.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3 space-y-2">
          <div className="text-sm font-medium text-yellow-400 mb-2">Pending Approvals</div>
          {pendingApprovals.map(approval => (
            <div key={approval.id} className="bg-black/30 rounded p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-purple-200">{approval.action}</span>
                <span className={`font-mono ${approval.timeout < 10 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {approval.timeout}s
                </span>
              </div>
              <div className="text-purple-500">Requested: {approval.requestedAt}</div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Gates List with Pathway States */}
      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
        {gates.map(gate => (
          <div
            key={gate.id}
            className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-3 safety-gate-card"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-purple-200 font-medium">{gate.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${getGateStatusColor(gate.status)}`}>
                  {gate.status}
                </span>
              </div>
            </div>

            {/* Pathway State with Icon */}
            <div className="mb-3 p-2 bg-black/20 rounded border border-purple-800/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{getPathwayIcon(gate.pathway)}</span>
                  <span className="text-xs text-purple-400">Pathway:</span>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium uppercase ${getPathwayColor(gate.pathway)}`}>
                    {gate.pathway}
                  </span>
                </div>
                {gate.cooldownRemaining && gate.cooldownRemaining > 0 && (
                  <div className="cooldown-timer">
                    <span className="text-xs text-orange-400">⏳ {gate.cooldownRemaining}s</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-purple-400">Pending</div>
                <div className="text-purple-200 font-medium">{gate.pendingApprovals}</div>
              </div>
              <div>
                <div className="text-purple-400">Violations</div>
                <div className={`font-medium ${gate.violations > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {gate.violations}
                </div>
              </div>
              <div>
                <div className="text-purple-400">Last Check</div>
                <div className="text-purple-200 font-medium">{gate.lastCheck}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Status */}
      <div className="bg-green-500/10 border border-green-500/40 rounded-lg p-3">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span>🛡</span>
          <span className="font-medium">All safety gates operational</span>
        </div>
      </div>
    </div>
  );
}
