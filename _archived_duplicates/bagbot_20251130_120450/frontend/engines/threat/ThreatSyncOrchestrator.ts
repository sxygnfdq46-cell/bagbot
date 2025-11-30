/**
 * ═══════════════════════════════════════════════════════════════════
 * THREAT SYNC ORCHESTRATOR
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Central threat synchronization engine that aggregates and coordinates
 * threat intelligence across all shield and intelligence engines.
 * 
 * Features:
 * - Real-time threat aggregation from multiple sources
 * - Severity scoring and confidence tracking
 * - Threat state caching with timestamps
 * - Subscriber notification system
 * - Integration with correlation, prediction, and clustering engines
 * - Safe fallbacks for missing dependencies
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type ThreatSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatCode = 
  | 'VOLATILITY_SPIKE'
  | 'LIQUIDITY_DRAIN'
  | 'CORRELATION_BREAK'
  | 'DIVERGENCE_EXTREME'
  | 'REGIME_SHIFT'
  | 'FLASH_CRASH_RISK'
  | 'MANIPULATION_DETECTED'
  | 'CIRCUIT_BREAKER'
  | 'SYSTEM_OVERLOAD'
  | 'DATA_ANOMALY'
  | 'UNKNOWN';

export interface ThreatState {
  severity: ThreatSeverity;
  code: ThreatCode;
  confidence: number; // 0-100
  timestamp: number;
  source: string;
  details?: string;
  affectedAssets?: string[];
  recommendedAction?: string;
}

export interface ThreatMetrics {
  totalThreats: number;
  activeCritical: number;
  activeHigh: number;
  activeMedium: number;
  activeLow: number;
  averageConfidence: number;
  lastUpdate: number;
}

export interface ThreatCluster {
  id: string;
  threats: ThreatState[];
  centerSeverity: ThreatSeverity;
  confidence: number;
  timestamp: number;
}

export type ThreatListener = (state: ThreatState) => void;

// ─────────────────────────────────────────────────────────────────
// THREAT SYNC ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────

export class ThreatSyncOrchestrator {
  private threatCache: Map<string, ThreatState> = new Map();
  private listeners: Set<ThreatListener> = new Set();
  private lastSync: number = 0;
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  // Optional engine integrations (safe fallbacks if missing)
  private correlationMatrix: any = null;
  private predictionHorizon: any = null;
  private rootCauseEngine: any = null;
  private threatClusterEngine: any = null;

  constructor() {
    console.log('🛡️ ThreatSyncOrchestrator initializing...');
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  public async initialize(options?: {
    correlationMatrix?: any;
    predictionHorizon?: any;
    rootCauseEngine?: any;
    threatClusterEngine?: any;
    syncIntervalMs?: number;
  }): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ ThreatSyncOrchestrator already initialized');
      return;
    }

    // Optional engine integrations
    if (options?.correlationMatrix) {
      this.correlationMatrix = options.correlationMatrix;
      console.log('✅ Integrated with CorrelationMatrix');
    }

    if (options?.predictionHorizon) {
      this.predictionHorizon = options.predictionHorizon;
      console.log('✅ Integrated with PredictionHorizon');
    }

    if (options?.rootCauseEngine) {
      this.rootCauseEngine = options.rootCauseEngine;
      console.log('✅ Integrated with RootCauseEngine');
    }

    if (options?.threatClusterEngine) {
      this.threatClusterEngine = options.threatClusterEngine;
      console.log('✅ Integrated with ThreatClusterEngine');
    }

    // Start automatic sync
    const interval = options?.syncIntervalMs || 5000; // Default 5 seconds
    this.startAutoSync(interval);

    this.isInitialized = true;
    console.log('✅ ThreatSyncOrchestrator initialized successfully');
  }

  // ═══════════════════════════════════════════════════════════════
  // THREAT SYNCHRONIZATION
  // ═══════════════════════════════════════════════════════════════

  public async sync(): Promise<ThreatMetrics> {
    const startTime = Date.now();

    try {
      // Gather threats from all integrated engines
      const threats: ThreatState[] = [];

      // 1. Correlation-based threats
      if (this.correlationMatrix) {
        threats.push(...await this.syncCorrelationThreats());
      }

      // 2. Prediction-based threats
      if (this.predictionHorizon) {
        threats.push(...await this.syncPredictionThreats());
      }

      // 3. Root cause analysis threats
      if (this.rootCauseEngine) {
        threats.push(...await this.syncRootCauseThreats());
      }

      // 4. Clustered threats
      if (this.threatClusterEngine) {
        threats.push(...await this.syncClusteredThreats());
      }

      // 5. System health threats
      threats.push(...await this.syncSystemThreats());

      // Update cache and notify listeners
      threats.forEach(threat => {
        const key = this.getThreatKey(threat);
        this.threatCache.set(key, threat);
        this.notifyListeners(threat);
      });

      // Clean old threats (older than 5 minutes)
      this.cleanOldThreats(5 * 60 * 1000);

      this.lastSync = Date.now();

      return this.getMetrics();
    } catch (error) {
      console.error('❌ ThreatSyncOrchestrator sync error:', error);
      throw error;
    }
  }

  private async syncCorrelationThreats(): Promise<ThreatState[]> {
    const threats: ThreatState[] = [];

    try {
      // Check for correlation breaks
      const correlationData = await this.correlationMatrix.getCorrelationBreaks?.();
      
      if (correlationData?.breaks?.length > 0) {
        correlationData.breaks.forEach((breakData: any) => {
          threats.push({
            severity: this.mapToSeverity(breakData.severity),
            code: 'CORRELATION_BREAK',
            confidence: breakData.confidence || 75,
            timestamp: Date.now(),
            source: 'CorrelationMatrix',
            details: `Correlation break detected: ${breakData.asset1} <-> ${breakData.asset2}`,
            affectedAssets: [breakData.asset1, breakData.asset2],
            recommendedAction: 'Review position correlations and adjust hedges'
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Correlation threat sync failed:', error);
    }

    return threats;
  }

  private async syncPredictionThreats(): Promise<ThreatState[]> {
    const threats: ThreatState[] = [];

    try {
      // Check prediction horizon for upcoming threats
      const predictions = await this.predictionHorizon.getPredictions?.();

      if (predictions?.threats?.length > 0) {
        predictions.threats.forEach((pred: any) => {
          threats.push({
            severity: this.mapToSeverity(pred.severity),
            code: this.mapToThreatCode(pred.type),
            confidence: pred.confidence || 70,
            timestamp: Date.now(),
            source: 'PredictionHorizon',
            details: pred.description || 'Predicted threat detected',
            affectedAssets: pred.assets || [],
            recommendedAction: pred.recommendation || 'Monitor closely'
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Prediction threat sync failed:', error);
    }

    return threats;
  }

  private async syncRootCauseThreats(): Promise<ThreatState[]> {
    const threats: ThreatState[] = [];

    try {
      // Analyze root causes of current market conditions
      const analysis = await this.rootCauseEngine.analyze?.();

      if (analysis?.risks?.length > 0) {
        analysis.risks.forEach((risk: any) => {
          threats.push({
            severity: this.mapToSeverity(risk.severity),
            code: this.mapToThreatCode(risk.type),
            confidence: risk.confidence || 80,
            timestamp: Date.now(),
            source: 'RootCauseEngine',
            details: risk.explanation || 'Root cause analysis detected risk',
            affectedAssets: risk.affectedAssets || [],
            recommendedAction: risk.mitigation || 'Investigate further'
          });
        });
      }
    } catch (error) {
      console.warn('⚠️ Root cause threat sync failed:', error);
    }

    return threats;
  }

  private async syncClusteredThreats(): Promise<ThreatState[]> {
    const threats: ThreatState[] = [];

    try {
      // Get clustered threat patterns
      const clusters = await this.threatClusterEngine.getClusters?.();

      if (clusters?.length > 0) {
        clusters.forEach((cluster: any) => {
          if (cluster.threatLevel && cluster.threatLevel !== 'NONE') {
            threats.push({
              severity: this.mapToSeverity(cluster.threatLevel),
              code: 'REGIME_SHIFT',
              confidence: cluster.confidence || 75,
              timestamp: Date.now(),
              source: 'ThreatClusterEngine',
              details: `Threat cluster detected: ${cluster.pattern || 'Unknown pattern'}`,
              affectedAssets: cluster.assets || [],
              recommendedAction: 'Review cluster components and adjust strategy'
            });
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Cluster threat sync failed:', error);
    }

    return threats;
  }

  private async syncSystemThreats(): Promise<ThreatState[]> {
    const threats: ThreatState[] = [];

    try {
      // System-level threat detection
      const now = Date.now();

      // Check for stale data
      if (this.lastSync > 0 && now - this.lastSync > 30000) {
        threats.push({
          severity: 'MEDIUM',
          code: 'DATA_ANOMALY',
          confidence: 90,
          timestamp: now,
          source: 'SystemMonitor',
          details: 'Threat data sync delayed',
          recommendedAction: 'Check system connectivity'
        });
      }

      // Check threat cache size (potential memory issue)
      if (this.threatCache.size > 1000) {
        threats.push({
          severity: 'LOW',
          code: 'SYSTEM_OVERLOAD',
          confidence: 85,
          timestamp: now,
          source: 'SystemMonitor',
          details: `Threat cache size: ${this.threatCache.size}`,
          recommendedAction: 'Clean old threats or increase cache limits'
        });
      }
    } catch (error) {
      console.warn('⚠️ System threat sync failed:', error);
    }

    return threats;
  }

  // ═══════════════════════════════════════════════════════════════
  // THREAT STATE ACCESS
  // ═══════════════════════════════════════════════════════════════

  public getThreatState(): ThreatState {
    if (this.threatCache.size === 0) {
      return {
        severity: 'NONE',
        code: 'UNKNOWN',
        confidence: 0,
        timestamp: Date.now(),
        source: 'ThreatSyncOrchestrator',
        details: 'No active threats detected'
      };
    }

    // Get highest severity threat
    let maxThreat: ThreatState | null = null;
    let maxSeverityScore = -1;

    this.threatCache.forEach(threat => {
      const score = this.getSeverityScore(threat.severity);
      if (score > maxSeverityScore) {
        maxSeverityScore = score;
        maxThreat = threat;
      }
    });

    return maxThreat || {
      severity: 'NONE',
      code: 'UNKNOWN',
      confidence: 0,
      timestamp: Date.now(),
      source: 'ThreatSyncOrchestrator'
    };
  }

  public getAllThreats(): ThreatState[] {
    return Array.from(this.threatCache.values());
  }

  public getThreatsBy(filter: {
    severity?: ThreatSeverity[];
    code?: ThreatCode[];
    minConfidence?: number;
    source?: string;
  }): ThreatState[] {
    const threats = this.getAllThreats();

    return threats.filter(threat => {
      if (filter.severity && !filter.severity.includes(threat.severity)) {
        return false;
      }
      if (filter.code && !filter.code.includes(threat.code)) {
        return false;
      }
      if (filter.minConfidence && threat.confidence < filter.minConfidence) {
        return false;
      }
      if (filter.source && threat.source !== filter.source) {
        return false;
      }
      return true;
    });
  }

  public getMetrics(): ThreatMetrics {
    const threats = this.getAllThreats();

    const metrics: ThreatMetrics = {
      totalThreats: threats.length,
      activeCritical: threats.filter(t => t.severity === 'CRITICAL').length,
      activeHigh: threats.filter(t => t.severity === 'HIGH').length,
      activeMedium: threats.filter(t => t.severity === 'MEDIUM').length,
      activeLow: threats.filter(t => t.severity === 'LOW').length,
      averageConfidence: threats.length > 0 
        ? threats.reduce((sum, t) => sum + t.confidence, 0) / threats.length
        : 0,
      lastUpdate: this.lastSync
    };

    return metrics;
  }

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIPTION SYSTEM
  // ═══════════════════════════════════════════════════════════════

  public subscribe(listener: ThreatListener): () => void {
    this.listeners.add(listener);

    // Immediately notify of current highest threat
    const currentThreat = this.getThreatState();
    if (currentThreat.severity !== 'NONE') {
      listener(currentThreat);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(threat: ThreatState): void {
    this.listeners.forEach(listener => {
      try {
        listener(threat);
      } catch (error) {
        console.error('❌ Threat listener error:', error);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO SYNC
  // ═══════════════════════════════════════════════════════════════

  private startAutoSync(intervalMs: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        console.error('❌ Auto sync error:', error);
      }
    }, intervalMs);

    console.log(`🔄 Auto sync started (interval: ${intervalMs}ms)`);
  }

  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Auto sync stopped');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  private getThreatKey(threat: ThreatState): string {
    return `${threat.source}-${threat.code}-${threat.timestamp}`;
  }

  private cleanOldThreats(maxAge: number): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.threatCache.forEach((threat, key) => {
      if (now - threat.timestamp > maxAge) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.threatCache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned ${keysToDelete.length} old threats`);
    }
  }

  private mapToSeverity(value: any): ThreatSeverity {
    if (typeof value === 'string') {
      const upper = value.toUpperCase();
      if (['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upper)) {
        return upper as ThreatSeverity;
      }
    }

    if (typeof value === 'number') {
      if (value >= 90) return 'CRITICAL';
      if (value >= 70) return 'HIGH';
      if (value >= 40) return 'MEDIUM';
      if (value >= 10) return 'LOW';
      return 'NONE';
    }

    return 'MEDIUM'; // Default
  }

  private mapToThreatCode(type: any): ThreatCode {
    if (typeof type !== 'string') return 'UNKNOWN';

    const typeUpper = type.toUpperCase().replace(/\s+/g, '_');

    const codeMap: Record<string, ThreatCode> = {
      'VOLATILITY_SPIKE': 'VOLATILITY_SPIKE',
      'VOLATILITY': 'VOLATILITY_SPIKE',
      'LIQUIDITY_DRAIN': 'LIQUIDITY_DRAIN',
      'LIQUIDITY': 'LIQUIDITY_DRAIN',
      'CORRELATION_BREAK': 'CORRELATION_BREAK',
      'CORRELATION': 'CORRELATION_BREAK',
      'DIVERGENCE_EXTREME': 'DIVERGENCE_EXTREME',
      'DIVERGENCE': 'DIVERGENCE_EXTREME',
      'REGIME_SHIFT': 'REGIME_SHIFT',
      'REGIME': 'REGIME_SHIFT',
      'FLASH_CRASH_RISK': 'FLASH_CRASH_RISK',
      'FLASH_CRASH': 'FLASH_CRASH_RISK',
      'MANIPULATION_DETECTED': 'MANIPULATION_DETECTED',
      'MANIPULATION': 'MANIPULATION_DETECTED',
      'CIRCUIT_BREAKER': 'CIRCUIT_BREAKER',
      'SYSTEM_OVERLOAD': 'SYSTEM_OVERLOAD',
      'SYSTEM': 'SYSTEM_OVERLOAD',
      'DATA_ANOMALY': 'DATA_ANOMALY',
      'DATA': 'DATA_ANOMALY'
    };

    return codeMap[typeUpper] || 'UNKNOWN';
  }

  private getSeverityScore(severity: ThreatSeverity): number {
    const scoreMap: Record<ThreatSeverity, number> = {
      'NONE': 0,
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'CRITICAL': 4
    };
    return scoreMap[severity] || 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // MANUAL THREAT INJECTION (for testing/integration)
  // ═══════════════════════════════════════════════════════════════

  public injectThreat(threat: Omit<ThreatState, 'timestamp'>): void {
    const fullThreat: ThreatState = {
      ...threat,
      timestamp: Date.now()
    };

    const key = this.getThreatKey(fullThreat);
    this.threatCache.set(key, fullThreat);
    this.notifyListeners(fullThreat);

    console.log(`⚠️ Threat injected: ${threat.severity} - ${threat.code}`);
  }

  public clearAllThreats(): void {
    this.threatCache.clear();
    console.log('🧹 All threats cleared');
  }

  // ═══════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════════

  public async shutdown(): Promise<void> {
    console.log('🛑 ThreatSyncOrchestrator shutting down...');

    this.stopAutoSync();
    this.listeners.clear();
    this.threatCache.clear();
    this.isInitialized = false;

    console.log('✅ ThreatSyncOrchestrator shutdown complete');
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getStatus(): {
    initialized: boolean;
    lastSync: number;
    cachedThreats: number;
    activeListeners: number;
    integratedEngines: string[];
  } {
    return {
      initialized: this.isInitialized,
      lastSync: this.lastSync,
      cachedThreats: this.threatCache.size,
      activeListeners: this.listeners.size,
      integratedEngines: [
        this.correlationMatrix && 'CorrelationMatrix',
        this.predictionHorizon && 'PredictionHorizon',
        this.rootCauseEngine && 'RootCauseEngine',
        this.threatClusterEngine && 'ThreatClusterEngine'
      ].filter(Boolean) as string[]
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE (optional, for convenience)
// ═══════════════════════════════════════════════════════════════════

let instance: ThreatSyncOrchestrator | null = null;

export function getThreatSyncOrchestrator(): ThreatSyncOrchestrator {
  if (!instance) {
    instance = new ThreatSyncOrchestrator();
  }
  return instance;
}

export function resetThreatSyncOrchestrator(): void {
  if (instance) {
    instance.shutdown();
    instance = null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// LEGACY COMPATIBLE EXPORT
// ═══════════════════════════════════════════════════════════════════

export const threatSyncOrchestrator = {
  async sync() {
    // Minimal safe behavior for UI and pipeline
    return {
      status: "ok",
      timestamp: Date.now()
    };
  },

  async synchronizeThreats(feed?: any) {
    return {
      status: "ok",
      lastUpdated: Date.now(),
      threats: [],
      metrics: {
        totalThreats: 0,
        active: 0,
        neutralized: 0,
        flagged: 0,
        severityScore: 0,
        lastUpdate: Date.now()
      }
    };
  },

  getThreatSnapshot() {
    return {
      status: "stable",
      lastUpdated: Date.now(),
      threats: [],
      metrics: {
        totalThreats: 0,
        active: 0,
        neutralized: 0,
        flagged: 0,
        severityScore: 0,
        lastUpdate: Date.now()
      }
    };
  }
};

// Default export for convenience
export default ThreatSyncOrchestrator;
