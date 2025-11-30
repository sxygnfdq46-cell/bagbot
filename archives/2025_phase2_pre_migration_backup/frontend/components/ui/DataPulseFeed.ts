/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 16.4: DATA PULSE FEED
 * ═══════════════════════════════════════════════════════════════════
 * 50ms real-time feed pipeline for memory, risk, state & load metrics.
 * Aggregates data from multiple sources and broadcasts updates.
 * 
 * SAFETY: Read-only data aggregation, no mutations
 * PURPOSE: Real-time metrics for dashboards
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type MetricType = 'memory' | 'risk' | 'state' | 'load' | 'performance' | 'custom';
export type AggregationMethod = 'avg' | 'sum' | 'min' | 'max' | 'last' | 'first';

export interface MetricData {
  timestamp: number;
  type: MetricType;
  name: string;
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface MetricSnapshot {
  timestamp: number;
  memory: MemoryMetrics;
  risk: RiskMetrics;
  state: StateMetrics;
  load: LoadMetrics;
  performance: PerformanceMetrics;
}

export interface MemoryMetrics {
  totalEntries: number;
  activeEntries: number;
  utilization: number;
  oldestEntry: number;
  newestEntry: number;
  avgAge: number;
}

export interface RiskMetrics {
  currentLevel: number;
  avgLevel: number;
  violations: number;
  alerts: number;
  status: 'safe' | 'warning' | 'danger' | 'critical';
}

export interface StateMetrics {
  activeFlows: number;
  pendingActions: number;
  completedActions: number;
  errorRate: number;
  successRate: number;
}

export interface LoadMetrics {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  overall: number;
}

export interface PerformanceMetrics {
  fps: number;
  latency: number;
  throughput: number;
  queueDepth: number;
}

export interface PulseFeedConfig {
  interval: number;
  maxHistorySize: number;
  enableBroadcast: boolean;
  aggregationWindow: number;
}

export interface MetricSubscription {
  id: string;
  type: MetricType[];
  callback: (snapshot: MetricSnapshot) => void;
  aggregation: AggregationMethod;
}

// ─────────────────────────────────────────────────────────────────
// DATA PULSE FEED CLASS
// ─────────────────────────────────────────────────────────────────

export class DataPulseFeed {
  private config: PulseFeedConfig;
  private interval?: NodeJS.Timeout;
  private history: MetricSnapshot[];
  private subscriptions: Map<string, MetricSubscription>;
  private broadcastChannel?: BroadcastChannel;
  private dataBuffer: MetricData[];
  private lastSnapshot?: MetricSnapshot;

  constructor(config?: Partial<PulseFeedConfig>) {
    this.config = {
      interval: 50, // 50ms = 20Hz update rate
      maxHistorySize: 1200, // 1 minute at 20Hz
      enableBroadcast: false,
      aggregationWindow: 1000, // 1 second
      ...config
    };

    this.history = [];
    this.subscriptions = new Map();
    this.dataBuffer = [];

    if (this.config.enableBroadcast && typeof BroadcastChannel !== 'undefined') {
      this.setupBroadcast();
    }

    this.start();
  }

  // ─────────────────────────────────────────────────────────────
  // BROADCAST SETUP
  // ─────────────────────────────────────────────────────────────

  private setupBroadcast(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('bagbot-data-pulse');
      
      this.broadcastChannel.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'metric') {
          this.ingestMetric(data);
        } else if (type === 'snapshot') {
          this.lastSnapshot = data;
        }
      };

      console.log('[PULSE FEED] Broadcast channel enabled');
    } catch (error) {
      console.error('[PULSE FEED] Failed to setup broadcast:', error);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PULSE LOOP
  // ─────────────────────────────────────────────────────────────

  private start(): void {
    this.interval = setInterval(() => {
      const snapshot = this.generateSnapshot();
      
      // Add to history
      this.history.push(snapshot);
      if (this.history.length > this.config.maxHistorySize) {
        this.history.shift();
      }

      // Broadcast
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'snapshot',
          data: snapshot
        });
      }

      // Notify subscribers
      this.notifySubscribers(snapshot);

      this.lastSnapshot = snapshot;
    }, this.config.interval);

    console.log(`[PULSE FEED] Started (${this.config.interval}ms interval)`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    console.log('[PULSE FEED] Stopped');
  }

  // ─────────────────────────────────────────────────────────────
  // SNAPSHOT GENERATION
  // ─────────────────────────────────────────────────────────────

  private generateSnapshot(): MetricSnapshot {
    const now = Date.now();
    
    return {
      timestamp: now,
      memory: this.aggregateMemoryMetrics(),
      risk: this.aggregateRiskMetrics(),
      state: this.aggregateStateMetrics(),
      load: this.aggregateLoadMetrics(),
      performance: this.aggregatePerformanceMetrics()
    };
  }

  private aggregateMemoryMetrics(): MemoryMetrics {
    const memoryData = this.dataBuffer.filter(d => d.type === 'memory');
    
    if (memoryData.length === 0) {
      return {
        totalEntries: 0,
        activeEntries: 0,
        utilization: 0,
        oldestEntry: 0,
        newestEntry: 0,
        avgAge: 0
      };
    }

    const totalEntries = this.getMetricValue(memoryData, 'total_entries', 'last') || 0;
    const activeEntries = this.getMetricValue(memoryData, 'active_entries', 'last') || 0;
    const utilization = activeEntries / Math.max(totalEntries, 1) * 100;
    const oldestEntry = this.getMetricValue(memoryData, 'oldest_entry', 'min') || 0;
    const newestEntry = this.getMetricValue(memoryData, 'newest_entry', 'max') || 0;
    const avgAge = newestEntry && oldestEntry ? (newestEntry - oldestEntry) / 2 : 0;

    return {
      totalEntries,
      activeEntries,
      utilization,
      oldestEntry,
      newestEntry,
      avgAge
    };
  }

  private aggregateRiskMetrics(): RiskMetrics {
    const riskData = this.dataBuffer.filter(d => d.type === 'risk');
    
    if (riskData.length === 0) {
      return {
        currentLevel: 0,
        avgLevel: 0,
        violations: 0,
        alerts: 0,
        status: 'safe'
      };
    }

    const currentLevel = this.getMetricValue(riskData, 'level', 'last') || 0;
    const avgLevel = this.getMetricValue(riskData, 'level', 'avg') || 0;
    const violations = this.getMetricValue(riskData, 'violations', 'sum') || 0;
    const alerts = this.getMetricValue(riskData, 'alerts', 'sum') || 0;

    let status: RiskMetrics['status'] = 'safe';
    if (currentLevel >= 0.8) status = 'critical';
    else if (currentLevel >= 0.6) status = 'danger';
    else if (currentLevel >= 0.4) status = 'warning';

    return {
      currentLevel,
      avgLevel,
      violations,
      alerts,
      status
    };
  }

  private aggregateStateMetrics(): StateMetrics {
    const stateData = this.dataBuffer.filter(d => d.type === 'state');
    
    if (stateData.length === 0) {
      return {
        activeFlows: 0,
        pendingActions: 0,
        completedActions: 0,
        errorRate: 0,
        successRate: 100
      };
    }

    const activeFlows = this.getMetricValue(stateData, 'active_flows', 'last') || 0;
    const pendingActions = this.getMetricValue(stateData, 'pending_actions', 'last') || 0;
    const completedActions = this.getMetricValue(stateData, 'completed_actions', 'sum') || 0;
    const errors = this.getMetricValue(stateData, 'errors', 'sum') || 0;
    const total = completedActions + errors;
    const errorRate = total > 0 ? (errors / total) * 100 : 0;
    const successRate = 100 - errorRate;

    return {
      activeFlows,
      pendingActions,
      completedActions,
      errorRate,
      successRate
    };
  }

  private aggregateLoadMetrics(): LoadMetrics {
    const loadData = this.dataBuffer.filter(d => d.type === 'load');
    
    if (loadData.length === 0) {
      return {
        cpu: 0,
        memory: 0,
        network: 0,
        disk: 0,
        overall: 0
      };
    }

    const cpu = this.getMetricValue(loadData, 'cpu', 'avg') || 0;
    const memory = this.getMetricValue(loadData, 'memory', 'avg') || 0;
    const network = this.getMetricValue(loadData, 'network', 'avg') || 0;
    const disk = this.getMetricValue(loadData, 'disk', 'avg') || 0;
    const overall = (cpu + memory + network + disk) / 4;

    return {
      cpu,
      memory,
      network,
      disk,
      overall
    };
  }

  private aggregatePerformanceMetrics(): PerformanceMetrics {
    const perfData = this.dataBuffer.filter(d => d.type === 'performance');
    
    if (perfData.length === 0) {
      return {
        fps: 60,
        latency: 0,
        throughput: 0,
        queueDepth: 0
      };
    }

    const fps = this.getMetricValue(perfData, 'fps', 'avg') || 60;
    const latency = this.getMetricValue(perfData, 'latency', 'avg') || 0;
    const throughput = this.getMetricValue(perfData, 'throughput', 'sum') || 0;
    const queueDepth = this.getMetricValue(perfData, 'queue_depth', 'last') || 0;

    return {
      fps,
      latency,
      throughput,
      queueDepth
    };
  }

  // ─────────────────────────────────────────────────────────────
  // METRIC AGGREGATION HELPERS
  // ─────────────────────────────────────────────────────────────

  private getMetricValue(
    data: MetricData[],
    name: string,
    method: AggregationMethod
  ): number | undefined {
    const filtered = data.filter(d => d.name === name);
    if (filtered.length === 0) return undefined;

    const values = filtered.map(d => d.value);

    switch (method) {
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'last':
        return values[values.length - 1];
      case 'first':
        return values[0];
      default:
        return undefined;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DATA INGESTION
  // ─────────────────────────────────────────────────────────────

  ingestMetric(metric: MetricData): void {
    this.dataBuffer.push(metric);

    // Remove old data outside aggregation window
    const cutoff = Date.now() - this.config.aggregationWindow;
    this.dataBuffer = this.dataBuffer.filter(d => d.timestamp >= cutoff);

    // Broadcast
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'metric',
        data: metric
      });
    }
  }

  ingestBatch(metrics: MetricData[]): void {
    metrics.forEach(m => this.ingestMetric(m));
  }

  // ─────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────

  subscribe(
    types: MetricType[],
    callback: (snapshot: MetricSnapshot) => void,
    aggregation: AggregationMethod = 'last'
  ): string {
    const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: MetricSubscription = {
      id,
      type: types,
      callback,
      aggregation
    };

    this.subscriptions.set(id, subscription);

    // Immediately call with last snapshot
    if (this.lastSnapshot) {
      callback(this.lastSnapshot);
    }

    return id;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  private notifySubscribers(snapshot: MetricSnapshot): void {
    this.subscriptions.forEach(sub => {
      try {
        sub.callback(snapshot);
      } catch (error) {
        console.error(`[PULSE FEED] Subscription error (${sub.id}):`, error);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // QUERY API
  // ─────────────────────────────────────────────────────────────

  getLatestSnapshot(): MetricSnapshot | undefined {
    return this.lastSnapshot;
  }

  getHistory(
    duration: number = 60000 // 1 minute
  ): MetricSnapshot[] {
    const cutoff = Date.now() - duration;
    return this.history.filter(s => s.timestamp >= cutoff);
  }

  getMetricHistory(
    type: MetricType,
    name: string,
    duration: number = 60000
  ): number[] {
    const cutoff = Date.now() - duration;
    return this.dataBuffer
      .filter(d => d.type === type && d.name === name && d.timestamp >= cutoff)
      .map(d => d.value);
  }

  getMetricStats(
    type: MetricType,
    name: string,
    duration: number = 60000
  ): {
    min: number;
    max: number;
    avg: number;
    current: number;
  } {
    const values = this.getMetricHistory(type, name, duration);
    
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0 };
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      current: values[values.length - 1]
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  destroy(): void {
    this.stop();
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }

    this.subscriptions.clear();
    this.history = [];
    this.dataBuffer = [];

    console.log('[PULSE FEED] Destroyed');
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let pulseFeedInstance: DataPulseFeed | null = null;

export function getPulseFeed(config?: Partial<PulseFeedConfig>): DataPulseFeed {
  if (!pulseFeedInstance) {
    pulseFeedInstance = new DataPulseFeed(config);
  }
  return pulseFeedInstance;
}

export function destroyPulseFeed(): void {
  if (pulseFeedInstance) {
    pulseFeedInstance.destroy();
    pulseFeedInstance = null;
  }
}
