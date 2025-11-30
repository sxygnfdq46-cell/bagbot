/**
 * ═══════════════════════════════════════════════════════════════════
 * SHIELD CORE — Level 18 Master Controller
 * ═══════════════════════════════════════════════════════════════════
 * Global shield system that protects BagBot from:
 * - Performance degradation
 * - Memory corruption
 * - Emotional instability
 * - Unsafe command execution
 * - System integrity failures
 * 
 * Shield States:
 * - GREEN (0-25%): All systems normal
 * - YELLOW (26-50%): Minor threats detected
 * - ORANGE (51-75%): Significant threats, shields active
 * - RED (76-100%): Critical threats, emergency protocols
 * 
 * Safety: Read-only monitoring, manual intervention required
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

export type ShieldState = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
export type ThreatLevel = 0 | 1 | 2 | 3 | 4 | 5; // 0=none, 5=critical
export type ShieldType = 'stability' | 'emotional' | 'execution' | 'memory' | 'integrity';

export interface ThreatEvent {
  id: string;
  timestamp: number;
  type: ShieldType;
  level: ThreatLevel;
  source: string;
  message: string;
  details?: any;
  resolved: boolean;
  resolvedAt?: number;
}

export interface ShieldStatus {
  state: ShieldState;
  threatLevel: number; // 0-100
  activeThreats: ThreatEvent[];
  shields: {
    stability: boolean;
    emotional: boolean;
    execution: boolean;
    memory: boolean;
    integrity: boolean;
  };
  lastCheck: number;
  totalThreats: number;
  resolvedThreats: number;
}

export interface ShieldConfig {
  enabled: boolean;
  autoActivate: boolean;
  thresholds: {
    green: number;
    yellow: number;
    orange: number;
    red: number;
  };
  monitoringInterval: number; // ms
  threatRetentionTime: number; // ms
  maxThreats: number;
}

export interface ShieldMetrics {
  uptime: number;
  checksPerformed: number;
  threatsDetected: number;
  threatsResolved: number;
  averageThreatLevel: number;
  shieldActivations: {
    stability: number;
    emotional: number;
    execution: number;
    memory: number;
    integrity: number;
  };
  stateHistory: Array<{
    state: ShieldState;
    timestamp: number;
    duration: number;
  }>;
}

export type ShieldEventCallback = (event: ThreatEvent) => void;
export type ShieldStateCallback = (state: ShieldState, prevState: ShieldState) => void;

// ─────────────────────────────────────────────────────────────────
// SHIELD CORE CLASS
// ─────────────────────────────────────────────────────────────────

export class ShieldCore {
  private config: ShieldConfig;
  private status: ShieldStatus;
  private metrics: ShieldMetrics;
  private threats: Map<string, ThreatEvent>;
  private eventCallbacks: ShieldEventCallback[];
  private stateCallbacks: ShieldStateCallback[];
  private monitoringTimer: number | null;
  private startTime: number;
  private isInitialized: boolean;

  constructor(config?: Partial<ShieldConfig>) {
    this.config = {
      enabled: true,
      autoActivate: true,
      thresholds: {
        green: 25,
        yellow: 50,
        orange: 75,
        red: 100
      },
      monitoringInterval: 5000, // 5 seconds
      threatRetentionTime: 300000, // 5 minutes
      maxThreats: 1000,
      ...config
    };

    this.status = {
      state: 'GREEN',
      threatLevel: 0,
      activeThreats: [],
      shields: {
        stability: false,
        emotional: false,
        execution: false,
        memory: false,
        integrity: false
      },
      lastCheck: Date.now(),
      totalThreats: 0,
      resolvedThreats: 0
    };

    this.metrics = {
      uptime: 0,
      checksPerformed: 0,
      threatsDetected: 0,
      threatsResolved: 0,
      averageThreatLevel: 0,
      shieldActivations: {
        stability: 0,
        emotional: 0,
        execution: 0,
        memory: 0,
        integrity: 0
      },
      stateHistory: [{
        state: 'GREEN',
        timestamp: Date.now(),
        duration: 0
      }]
    };

    this.threats = new Map();
    this.eventCallbacks = [];
    this.stateCallbacks = [];
    this.monitoringTimer = null;
    this.startTime = Date.now();
    this.isInitialized = false;
  }

  /**
   * Initialize the shield system
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[ShieldCore] Already initialized');
      return;
    }

    console.log('[ShieldCore] Initializing global shield system...');

    if (this.config.enabled && this.config.autoActivate) {
      this.startMonitoring();
    }

    this.isInitialized = true;
    console.log('[ShieldCore] Shield system online ✓');
  }

  /**
   * Start monitoring for threats
   */
  private startMonitoring(): void {
    if (this.monitoringTimer) {
      return;
    }

    this.monitoringTimer = window.setInterval(() => {
      this.performCheck();
    }, this.config.monitoringInterval);

    console.log(`[ShieldCore] Monitoring started (${this.config.monitoringInterval}ms intervals)`);
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('[ShieldCore] Monitoring stopped');
    }
  }

  /**
   * Perform system check
   */
  private performCheck(): void {
    this.metrics.checksPerformed++;
    this.status.lastCheck = Date.now();

    // Calculate uptime
    this.metrics.uptime = Date.now() - this.startTime;

    // Clean old threats
    this.cleanOldThreats();

    // Recalculate threat level
    this.updateThreatLevel();

    // Update shield state
    this.updateShieldState();
  }

  /**
   * Report a threat
   */
  reportThreat(
    type: ShieldType,
    level: ThreatLevel,
    source: string,
    message: string,
    details?: any
  ): string {
    const threat: ThreatEvent = {
      id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      level,
      source,
      message,
      details,
      resolved: false
    };

    // Add to threats map
    this.threats.set(threat.id, threat);

    // Update status
    this.status.activeThreats = Array.from(this.threats.values()).filter(t => !t.resolved);
    this.status.totalThreats++;

    // Update metrics
    this.metrics.threatsDetected++;
    this.metrics.shieldActivations[type]++;

    // Trim threats if exceeding max
    if (this.threats.size > this.config.maxThreats) {
      const oldest = Array.from(this.threats.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) {
        this.threats.delete(oldest[0]);
      }
    }

    // Recalculate threat level
    this.updateThreatLevel();

    // Activate appropriate shield
    this.activateShield(type);

    // Notify callbacks
    this.eventCallbacks.forEach(cb => cb(threat));

    console.warn(`[ShieldCore] THREAT DETECTED [${type.toUpperCase()}] Level ${level}: ${message}`);

    return threat.id;
  }

  /**
   * Resolve a threat
   */
  resolveThreat(threatId: string, resolution?: string): boolean {
    const threat = this.threats.get(threatId);
    if (!threat || threat.resolved) {
      return false;
    }

    threat.resolved = true;
    threat.resolvedAt = Date.now();
    if (resolution) {
      threat.details = { ...threat.details, resolution };
    }

    // Update status
    this.status.activeThreats = Array.from(this.threats.values()).filter(t => !t.resolved);
    this.status.resolvedThreats++;

    // Update metrics
    this.metrics.threatsResolved++;

    // Recalculate threat level
    this.updateThreatLevel();

    console.log(`[ShieldCore] Threat resolved: ${threatId}`);

    return true;
  }

  /**
   * Activate a specific shield
   */
  private activateShield(type: ShieldType): void {
    if (!this.status.shields[type]) {
      this.status.shields[type] = true;
      console.log(`[ShieldCore] ${type.toUpperCase()} shield ACTIVATED`);
    }
  }

  /**
   * Deactivate a specific shield
   */
  deactivateShield(type: ShieldType): void {
    if (this.status.shields[type]) {
      this.status.shields[type] = false;
      console.log(`[ShieldCore] ${type.toUpperCase()} shield deactivated`);
    }
  }

  /**
   * Clean old resolved threats
   */
  private cleanOldThreats(): void {
    const cutoff = Date.now() - this.config.threatRetentionTime;
    const toDelete: string[] = [];

    this.threats.forEach((threat, id) => {
      if (threat.resolved && threat.resolvedAt && threat.resolvedAt < cutoff) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.threats.delete(id));

    if (toDelete.length > 0) {
      console.log(`[ShieldCore] Cleaned ${toDelete.length} old threats`);
    }
  }

  /**
   * Update overall threat level
   */
  private updateThreatLevel(): void {
    const activeThreats = Array.from(this.threats.values()).filter(t => !t.resolved);

    if (activeThreats.length === 0) {
      this.status.threatLevel = 0;
      this.metrics.averageThreatLevel = 0;
      return;
    }

    // Calculate weighted threat level
    const totalWeight = activeThreats.reduce((sum, threat) => {
      return sum + (threat.level * 20); // Each level = 20% threat
    }, 0);

    this.status.threatLevel = Math.min(100, Math.round(totalWeight / activeThreats.length));

    // Update average
    this.metrics.averageThreatLevel = Math.round(
      (this.metrics.averageThreatLevel * (this.metrics.threatsDetected - 1) + this.status.threatLevel) /
      this.metrics.threatsDetected
    );
  }

  /**
   * Update shield state based on threat level
   */
  private updateShieldState(): void {
    const prevState = this.status.state;
    let newState: ShieldState = 'GREEN';

    if (this.status.threatLevel >= this.config.thresholds.red) {
      newState = 'RED';
    } else if (this.status.threatLevel >= this.config.thresholds.orange) {
      newState = 'ORANGE';
    } else if (this.status.threatLevel >= this.config.thresholds.yellow) {
      newState = 'YELLOW';
    }

    if (newState !== prevState) {
      this.status.state = newState;

      // Update state history
      const lastEntry = this.metrics.stateHistory[this.metrics.stateHistory.length - 1];
      if (lastEntry) {
        lastEntry.duration = Date.now() - lastEntry.timestamp;
      }

      this.metrics.stateHistory.push({
        state: newState,
        timestamp: Date.now(),
        duration: 0
      });

      // Trim history to last 100 entries
      if (this.metrics.stateHistory.length > 100) {
        this.metrics.stateHistory = this.metrics.stateHistory.slice(-100);
      }

      // Notify callbacks
      this.stateCallbacks.forEach(cb => cb(newState, prevState));

      console.log(`[ShieldCore] Shield state: ${prevState} → ${newState}`);
    }
  }

  /**
   * Get current shield status
   */
  getStatus(): ShieldStatus {
    return { ...this.status };
  }

  /**
   * Get shield metrics
   */
  getMetrics(): ShieldMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active threats
   */
  getActiveThreats(): ThreatEvent[] {
    return Array.from(this.threats.values()).filter(t => !t.resolved);
  }

  /**
   * Get threats by type
   */
  getThreatsByType(type: ShieldType): ThreatEvent[] {
    return Array.from(this.threats.values()).filter(t => t.type === type);
  }

  /**
   * Get threats by level
   */
  getThreatsByLevel(level: ThreatLevel): ThreatEvent[] {
    return Array.from(this.threats.values()).filter(t => t.level === level);
  }

  /**
   * Register event callback
   */
  onThreat(callback: ShieldEventCallback): () => void {
    this.eventCallbacks.push(callback);
    return () => {
      this.eventCallbacks = this.eventCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register state change callback
   */
  onStateChange(callback: ShieldStateCallback): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      this.stateCallbacks = this.stateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Force shield state (for testing/manual control)
   */
  forceState(state: ShieldState): void {
    const prevState = this.status.state;
    this.status.state = state;
    console.log(`[ShieldCore] Forced state: ${prevState} → ${state}`);
    this.stateCallbacks.forEach(cb => cb(state, prevState));
  }

  /**
   * Reset all shields
   */
  reset(): void {
    console.log('[ShieldCore] Resetting shield system...');

    // Clear all threats
    this.threats.clear();

    // Reset status
    this.status = {
      state: 'GREEN',
      threatLevel: 0,
      activeThreats: [],
      shields: {
        stability: false,
        emotional: false,
        execution: false,
        memory: false,
        integrity: false
      },
      lastCheck: Date.now(),
      totalThreats: 0,
      resolvedThreats: 0
    };

    // Reset metrics (keep history)
    this.metrics.checksPerformed = 0;
    this.metrics.threatsDetected = 0;
    this.metrics.threatsResolved = 0;
    this.metrics.averageThreatLevel = 0;
    this.metrics.shieldActivations = {
      stability: 0,
      emotional: 0,
      execution: 0,
      memory: 0,
      integrity: 0
    };

    console.log('[ShieldCore] Shield system reset complete');
  }

  /**
   * Get shield configuration
   */
  getConfig(): ShieldConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ShieldConfig>): void {
    const wasMonitoring = this.monitoringTimer !== null;

    if (wasMonitoring) {
      this.stopMonitoring();
    }

    this.config = { ...this.config, ...config };

    if (wasMonitoring && this.config.enabled) {
      this.startMonitoring();
    }

    console.log('[ShieldCore] Configuration updated');
  }

  /**
   * Enable shield system
   */
  enable(): void {
    if (!this.config.enabled) {
      this.config.enabled = true;
      if (this.config.autoActivate) {
        this.startMonitoring();
      }
      console.log('[ShieldCore] Shield system ENABLED');
    }
  }

  /**
   * Disable shield system
   */
  disable(): void {
    if (this.config.enabled) {
      this.config.enabled = false;
      this.stopMonitoring();
      console.log('[ShieldCore] Shield system DISABLED');
    }
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'critical';
    threatLevel: number;
    activeShields: number;
    activeThreats: number;
    uptime: number;
  } {
    const activeShields = Object.values(this.status.shields).filter(s => s).length;
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (this.status.state === 'RED') {
      overall = 'critical';
    } else if (this.status.state === 'ORANGE' || this.status.state === 'YELLOW') {
      overall = 'degraded';
    }

    return {
      overall,
      threatLevel: this.status.threatLevel,
      activeShields,
      activeThreats: this.status.activeThreats.length,
      uptime: this.metrics.uptime
    };
  }

  /**
   * Export threat log
   */
  exportThreats(): string {
    const threats = Array.from(this.threats.values());
    return JSON.stringify(threats, null, 2);
  }

  /**
   * Dispose shield system
   */
  dispose(): void {
    console.log('[ShieldCore] Disposing shield system...');

    this.stopMonitoring();
    this.threats.clear();
    this.eventCallbacks = [];
    this.stateCallbacks = [];
    this.isInitialized = false;

    console.log('[ShieldCore] Shield system disposed');
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let shieldInstance: ShieldCore | null = null;

/**
 * Get global shield instance
 */
export function getShieldCore(): ShieldCore {
  if (!shieldInstance) {
    shieldInstance = new ShieldCore();
    shieldInstance.initialize();
  }
  return shieldInstance;
}

/**
 * Initialize shield with custom config
 */
export function initializeShield(config?: Partial<ShieldConfig>): ShieldCore {
  if (shieldInstance) {
    console.warn('[ShieldCore] Already initialized, returning existing instance');
    return shieldInstance;
  }

  shieldInstance = new ShieldCore(config);
  shieldInstance.initialize();
  return shieldInstance;
}

/**
 * Dispose global shield
 */
export function disposeShield(): void {
  if (shieldInstance) {
    shieldInstance.dispose();
    shieldInstance = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get shield state color
 */
export function getShieldStateColor(state: ShieldState): string {
  switch (state) {
    case 'GREEN': return '#10b981'; // green-500
    case 'YELLOW': return '#fbbf24'; // yellow-400
    case 'ORANGE': return '#fb923c'; // orange-400
    case 'RED': return '#ef4444'; // red-500
  }
}

/**
 * Get threat level color
 */
export function getThreatLevelColor(level: ThreatLevel): string {
  switch (level) {
    case 0: return '#10b981'; // green-500
    case 1: return '#84cc16'; // lime-500
    case 2: return '#fbbf24'; // yellow-400
    case 3: return '#fb923c'; // orange-400
    case 4: return '#f87171'; // red-400
    case 5: return '#ef4444'; // red-500
  }
}

/**
 * Format uptime
 */
export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export default ShieldCore;
