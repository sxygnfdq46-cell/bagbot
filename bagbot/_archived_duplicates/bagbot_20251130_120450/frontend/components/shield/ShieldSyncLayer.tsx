/**
 * ═══════════════════════════════════════════════════════════════════
 * SHIELD SYNC LAYER — Level 18.6
 * ═══════════════════════════════════════════════════════════════════
 * Real-time shield status visualization component
 * 
 * Features:
 * - Shield ring visualization with state colors
 * - Live threat meter with severity indicators
 * - Neon pulse animations for active threats
 * - Global warning banner for critical states
 * - Integration with Level 17 Admin Panel
 * 
 * Integration:
 * - Connects to all 5 shield engines
 * - Real-time updates via shield event hooks
 * - Displays in Admin Dashboard (Level 17)
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getShieldCore, type ShieldState, getShieldStateColor } from './ShieldCore';
// import { getStabilityShieldEngine } from './StabilityShieldEngine'; // TODO: Add when StabilityShieldEngine.ts is available
import { getEmotionalShield } from './EmotionalShield';
import { getExecutionShield, type ValidationResult } from './ExecutionShield';
import { getMemoryIntegrityShield, type MemoryIntegrityStatus } from './MemoryIntegrityShield';

// Temporary mock for StabilityShieldEngine until it's available
const getStabilityShieldEngine = () => ({
  getHealthSummary: () => ({ overall: 'healthy' as const, cpuUsage: 45, memoryUsage: 60, activeThreads: 8 }),
  getStatus: () => ({ active: true }),
  getMetrics: () => ({ checksPerformed: 1250 })
});

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

interface ShieldSyncLayerProps {
  compact?: boolean;
  showThreatMeter?: boolean;
  showActiveShields?: boolean;
  showMetrics?: boolean;
  className?: string;
}

interface ShieldOverview {
  state: ShieldState;
  threatLevel: number;
  activeShields: number;
  activeThreats: number;
  lastCheck: number;
}

interface ShieldEngineStatus {
  name: string;
  active: boolean;
  health: 'healthy' | 'degraded' | 'critical';
  metrics: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
}

interface ThreatDisplay {
  id: string;
  type: string;
  severity: number;
  message: string;
  timestamp: number;
  source: string;
}

// ─────────────────────────────────────────────────────────────────
// SHIELD SYNC LAYER COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function ShieldSyncLayer({
  compact = false,
  showThreatMeter = true,
  showActiveShields = true,
  showMetrics = false,
  className = ''
}: ShieldSyncLayerProps) {
  // Shield instances
  const shieldCore = useMemo(() => getShieldCore(), []);
  const stabilityShield = useMemo(() => getStabilityShieldEngine(), []);
  const emotionalShield = useMemo(() => getEmotionalShield(), []);
  const executionShield = useMemo(() => getExecutionShield(), []);
  const memoryShield = useMemo(() => getMemoryIntegrityShield(), []);

  // State
  const [overview, setOverview] = useState<ShieldOverview>({
    state: 'GREEN',
    threatLevel: 0,
    activeShields: 0,
    activeThreats: 0,
    lastCheck: Date.now()
  });

  const [engines, setEngines] = useState<ShieldEngineStatus[]>([]);
  const [threats, setThreats] = useState<ThreatDisplay[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  /**
   * Update shield overview
   */
  const updateOverview = useCallback(() => {
    const status = shieldCore.getStatus();
    const activeThreats = shieldCore.getActiveThreats();

    setOverview({
      state: status.state,
      threatLevel: status.threatLevel,
      activeShields: Object.values(status.shields).filter(s => s).length,
      activeThreats: activeThreats.length,
      lastCheck: status.lastCheck
    });

    // Show banner for ORANGE/RED states
    setShowBanner(status.state === 'ORANGE' || status.state === 'RED');

    // Pulse animation for active threats
    setIsPulsing(activeThreats.length > 0);
  }, [shieldCore]);

  /**
   * Update engine statuses
   */
  const updateEngines = useCallback(() => {
    const stabilityHealth = stabilityShield.getHealthSummary();
    const stabilityStatus = stabilityShield.getStatus();
    const stabilityMetrics = stabilityShield.getMetrics();

    const emotionalHealth = emotionalShield.getHealthSummary();
    const emotionalStatus = emotionalShield.getStatus();
    const emotionalMetrics = emotionalShield.getMetrics();

    const executionHealth = executionShield.getHealthSummary();
    const executionStatus = executionShield.getStatus();
    const executionMetrics = executionShield.getMetrics();

    const memoryHealth = memoryShield.getHealthSummary();
    const memoryStatus = memoryShield.getStatus();
    const memoryMetrics = memoryShield.getMetrics();

    const newEngines: ShieldEngineStatus[] = [
      {
        name: 'Stability Shield',
        active: stabilityStatus.active,
        health: stabilityHealth.overall,
        metrics: [
          { label: 'CPU', value: `${stabilityHealth.cpuUsage.toFixed(1)}%`, trend: stabilityHealth.cpuUsage > 80 ? 'up' : 'neutral' },
          { label: 'Memory', value: `${stabilityHealth.memoryUsage.toFixed(1)}%`, trend: stabilityHealth.memoryUsage > 80 ? 'up' : 'neutral' },
          { label: 'Threads', value: stabilityHealth.activeThreads, trend: 'neutral' },
          { label: 'Checks', value: stabilityMetrics.checksPerformed, trend: 'neutral' }
        ]
      },
      {
        name: 'Emotional Shield',
        active: emotionalStatus.active,
        health: emotionalHealth.overall,
        metrics: [
          { label: 'Intensity', value: `${emotionalHealth.intensity.toFixed(1)}%`, trend: emotionalHealth.intensity > 75 ? 'up' : 'neutral' },
          { label: 'Stability', value: `${emotionalHealth.stability.toFixed(1)}%`, trend: emotionalHealth.stability < 60 ? 'down' : 'neutral' },
          { label: 'Coherence', value: `${emotionalHealth.coherence.toFixed(1)}%`, trend: 'neutral' },
          { label: 'Threats', value: emotionalHealth.activeThreats, trend: emotionalHealth.activeThreats > 0 ? 'up' : 'neutral' }
        ]
      },
      {
        name: 'Execution Shield',
        active: executionStatus.active,
        health: executionHealth.overall,
        metrics: [
          { label: 'Processed', value: executionHealth.commandsProcessed, trend: 'neutral' },
          { label: 'Approval Rate', value: `${executionHealth.approvalRate.toFixed(1)}%`, trend: 'neutral' },
          { label: 'Blocked', value: executionHealth.blockRate.toFixed(1) + '%', trend: executionHealth.blockRate > 5 ? 'up' : 'neutral' },
          { label: 'Pending', value: executionHealth.pendingConfirmations, trend: executionHealth.pendingConfirmations > 3 ? 'up' : 'neutral' }
        ]
      },
      {
        name: 'Memory Shield',
        active: memoryStatus.active,
        health: memoryHealth.overall,
        metrics: [
          { label: 'Status', value: memoryHealth.status.toUpperCase(), trend: 'neutral' },
          { label: 'Quota', value: `${memoryHealth.quotaUsage.toFixed(1)}%`, trend: memoryHealth.quotaUsage > 80 ? 'up' : 'neutral' },
          { label: 'Snapshots', value: memoryHealth.snapshotsAvailable, trend: 'neutral' },
          { label: 'Issues', value: memoryHealth.activeIssues, trend: memoryHealth.activeIssues > 0 ? 'up' : 'neutral' }
        ]
      }
    ];

    setEngines(newEngines);
  }, [stabilityShield, emotionalShield, executionShield, memoryShield]);

  /**
   * Update threats
   */
  const updateThreats = useCallback(() => {
    const activeThreats = shieldCore.getActiveThreats();
    
    const threatDisplays: ThreatDisplay[] = activeThreats
      .sort((a, b) => b.level - a.level) // Sort by severity
      .slice(0, 10) // Show top 10
      .map(threat => ({
        id: threat.id,
        type: threat.type,
        severity: threat.level,
        message: threat.message,
        timestamp: threat.timestamp,
        source: threat.source
      }));

    setThreats(threatDisplays);
  }, [shieldCore]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    // Initial update
    updateOverview();
    updateEngines();
    updateThreats();

    // Listen for shield state changes
    const unsubscribeState = shieldCore.onStateChange((newState) => {
      console.log(`[ShieldSyncLayer] State changed: ${newState}`);
      updateOverview();
    });

    // Listen for new threats
    const unsubscribeThreat = shieldCore.onThreat((threat) => {
      console.log(`[ShieldSyncLayer] New threat: ${threat.message}`);
      updateOverview();
      updateThreats();
    });

    // Periodic updates
    const interval = setInterval(() => {
      updateOverview();
      updateEngines();
      updateThreats();
    }, 5000); // Update every 5 seconds

    return () => {
      unsubscribeState();
      unsubscribeThreat();
      clearInterval(interval);
    };
  }, [shieldCore, updateOverview, updateEngines, updateThreats]);

  /**
   * Get state color class
   */
  const getStateColorClass = (state: ShieldState): string => {
    switch (state) {
      case 'GREEN': return 'shield-state-green';
      case 'YELLOW': return 'shield-state-yellow';
      case 'ORANGE': return 'shield-state-orange';
      case 'RED': return 'shield-state-red';
    }
  };

  /**
   * Get health color class
   */
  const getHealthColorClass = (health: 'healthy' | 'degraded' | 'critical'): string => {
    switch (health) {
      case 'healthy': return 'health-healthy';
      case 'degraded': return 'health-degraded';
      case 'critical': return 'health-critical';
    }
  };

  /**
   * Get severity color class
   */
  const getSeverityColorClass = (severity: number): string => {
    if (severity >= 5) return 'severity-critical';
    if (severity >= 4) return 'severity-high';
    if (severity >= 3) return 'severity-medium';
    if (severity >= 2) return 'severity-low';
    return 'severity-info';
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  if (compact) {
    return (
      <div className={`shield-sync-compact ${className}`}>
        <div className="shield-compact-indicator">
          <div className={`shield-status-dot ${getStateColorClass(overview.state)} ${isPulsing ? 'pulsing' : ''}`} />
          <span className="shield-compact-label">{overview.state}</span>
          {overview.activeThreats > 0 && (
            <span className="shield-compact-threats">{overview.activeThreats}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`shield-sync-layer ${className}`}>
      {/* Global Warning Banner */}
      {showBanner && (
        <div className={`shield-warning-banner ${getStateColorClass(overview.state)}`}>
          <div className="banner-icon">⚠️</div>
          <div className="banner-content">
            <div className="banner-title">SHIELD ALERT: {overview.state} STATE</div>
            <div className="banner-message">
              {overview.state === 'RED' 
                ? 'Critical threats detected - immediate attention required'
                : 'Elevated threats detected - monitoring closely'}
            </div>
          </div>
          <div className="banner-count">{overview.activeThreats} active</div>
        </div>
      )}

      {/* Shield Ring Visualization */}
      <div className="shield-ring-container">
        <svg className="shield-ring-svg" viewBox="0 0 200 200">
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="3"
          />
          
          {/* Shield state ring */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={getShieldStateColor(overview.state)}
            strokeWidth="6"
            strokeDasharray={`${(overview.threatLevel / 100) * 502.65} 502.65`}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            className={isPulsing ? 'shield-ring-pulse' : ''}
          />
          
          {/* Center text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="shield-ring-state"
            fill={getShieldStateColor(overview.state)}
          >
            {overview.state}
          </text>
          <text
            x="100"
            y="115"
            textAnchor="middle"
            className="shield-ring-level"
            fill="#fff"
          >
            {overview.threatLevel}%
          </text>
        </svg>

        <div className="shield-ring-info">
          <div className="shield-info-item">
            <span className="shield-info-label">Active Shields:</span>
            <span className="shield-info-value">{overview.activeShields}/5</span>
          </div>
          <div className="shield-info-item">
            <span className="shield-info-label">Active Threats:</span>
            <span className="shield-info-value">{overview.activeThreats}</span>
          </div>
          <div className="shield-info-item">
            <span className="shield-info-label">Last Check:</span>
            <span className="shield-info-value">{formatTimeAgo(overview.lastCheck)}</span>
          </div>
        </div>
      </div>

      {/* Active Shields Grid */}
      {showActiveShields && (
        <div className="shield-engines-grid">
          {engines.map((engine) => (
            <div
              key={engine.name}
              className={`shield-engine-card ${getHealthColorClass(engine.health)}`}
            >
              <div className="engine-header">
                <div className="engine-status-dot" />
                <h3 className="engine-name">{engine.name}</h3>
                <span className={`engine-health ${getHealthColorClass(engine.health)}`}>
                  {engine.health.toUpperCase()}
                </span>
              </div>
              
              {showMetrics && (
                <div className="engine-metrics">
                  {engine.metrics.map((metric) => (
                    <div key={metric.label} className="metric-row">
                      <span className="metric-label">{metric.label}:</span>
                      <span className="metric-value">
                        {metric.value}
                        {metric.trend && metric.trend !== 'neutral' && (
                          <span className={`metric-trend trend-${metric.trend}`}>
                            {metric.trend === 'up' ? '↑' : '↓'}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Threat Meter */}
      {showThreatMeter && threats.length > 0 && (
        <div className="shield-threat-meter">
          <h3 className="threat-meter-title">Active Threats</h3>
          <div className="threat-list">
            {threats.map((threat) => (
              <div
                key={threat.id}
                className={`threat-item ${getSeverityColorClass(threat.severity)}`}
              >
                <div className="threat-severity">
                  <div className={`threat-severity-badge ${getSeverityColorClass(threat.severity)}`}>
                    {threat.severity}
                  </div>
                </div>
                <div className="threat-content">
                  <div className="threat-header">
                    <span className="threat-type">{threat.type.toUpperCase()}</span>
                    <span className="threat-source">{threat.source}</span>
                  </div>
                  <div className="threat-message">{threat.message}</div>
                  <div className="threat-timestamp">{formatTimeAgo(threat.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHIELD MINI INDICATOR (For header/navbar)
// ─────────────────────────────────────────────────────────────────

export function ShieldMiniIndicator() {
  const shieldCore = useMemo(() => getShieldCore(), []);
  const [state, setState] = useState<ShieldState>('GREEN');
  const [activeThreats, setActiveThreats] = useState(0);

  useEffect(() => {
    const updateState = () => {
      const status = shieldCore.getStatus();
      setState(status.state);
      setActiveThreats(shieldCore.getActiveThreats().length);
    };

    updateState();

    const unsubscribe = shieldCore.onStateChange((newState) => {
      setState(newState);
      setActiveThreats(shieldCore.getActiveThreats().length);
    });

    const interval = setInterval(updateState, 10000); // Update every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [shieldCore]);

  return (
    <div className="shield-mini-indicator">
      <div
        className={`shield-mini-dot shield-state-${state.toLowerCase()}`}
        title={`Shield Status: ${state}`}
      />
      {activeThreats > 0 && (
        <span className="shield-mini-count">{activeThreats}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHIELD DETAIL MODAL (For detailed view)
// ─────────────────────────────────────────────────────────────────

interface ShieldDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShieldDetailModal({ isOpen, onClose }: ShieldDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="shield-modal-overlay" onClick={onClose}>
      <div className="shield-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="shield-modal-header">
          <h2>Shield System Status</h2>
          <button className="shield-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="shield-modal-body">
          <ShieldSyncLayer
            showThreatMeter={true}
            showActiveShields={true}
            showMetrics={true}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SHIELD STATUS BADGE (For individual engine status)
// ─────────────────────────────────────────────────────────────────

interface ShieldStatusBadgeProps {
  engine: 'stability' | 'emotional' | 'execution' | 'memory';
  showLabel?: boolean;
}

export function ShieldStatusBadge({ engine, showLabel = true }: ShieldStatusBadgeProps) {
  const [health, setHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');
  const [active, setActive] = useState(false);

  useEffect(() => {
    let shield: any;
    
    switch (engine) {
      case 'stability':
        shield = getStabilityShieldEngine();
        break;
      case 'emotional':
        shield = getEmotionalShield();
        break;
      case 'execution':
        shield = getExecutionShield();
        break;
      case 'memory':
        shield = getMemoryIntegrityShield();
        break;
    }

    const updateStatus = () => {
      const healthSummary = shield.getHealthSummary();
      const status = shield.getStatus();
      setHealth(healthSummary.overall);
      setActive(status.active);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, [engine]);

  const getHealthColor = () => {
    switch (health) {
      case 'healthy': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'critical': return '#ef4444';
    }
  };

  const getEngineName = () => {
    switch (engine) {
      case 'stability': return 'Stability';
      case 'emotional': return 'Emotional';
      case 'execution': return 'Execution';
      case 'memory': return 'Memory';
    }
  };

  return (
    <div className="shield-status-badge">
      <div
        className="shield-badge-dot"
        style={{ backgroundColor: getHealthColor() }}
      />
      {showLabel && (
        <span className="shield-badge-label">{getEngineName()}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export type {
  ShieldSyncLayerProps,
  ShieldOverview,
  ShieldEngineStatus,
  ThreatDisplay,
  ShieldDetailModalProps,
  ShieldStatusBadgeProps
};
