/**
 * LEVEL 12.5 — COGNITIVE LOAD REGULATOR
 * 
 * Prevents overload or sluggishness by dynamically adjusting processing intensity.
 * Detects high-load situations and reroutes tasks for optimal performance.
 * 
 * Features:
 * - Real-time load detection (10ms cycles)
 * - Dynamic intensity adjustment
 * - Task priority rerouting
 * - Performance throttling/boosting
 * - Overload prevention
 * - Response time optimization
 * 
 * Monitoring: 10ms intervals (100 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type LoadLevel = 'idle' | 'light' | 'moderate' | 'high' | 'critical';

interface CognitiveLoad {
  current: number; // 0-100
  baseline: number; // typical load
  peak: number; // max observed
  trend: 'increasing' | 'decreasing' | 'stable';
  level: LoadLevel;
}

interface ProcessingIntensity {
  current: number; // 0-100
  target: number; // desired intensity
  adjustment: number; // -50 to 50 (negative = throttle, positive = boost)
}

interface TaskPriority {
  taskId: string;
  priority: number; // 1-10
  estimatedLoad: number; // 0-100
  canDefer: boolean;
}

interface LoadThreshold {
  level: LoadLevel;
  min: number; // % load
  max: number; // % load
  responseTime: number; // ms target
}

interface CognitiveLoadConfig {
  monitoringInterval: number; // ms
  baselineAdjustmentRate: number; // 0-1
  throttleThreshold: number; // % load
  boostThreshold: number; // % load
  criticalThreshold: number; // % load
  enabled: boolean;
}

/* ================================ */
/* COGNITIVE LOAD REGULATOR         */
/* ================================ */

export class CognitiveLoadRegulator {
  private config: CognitiveLoadConfig;
  
  // Load State
  private cognitiveLoad: CognitiveLoad;
  private processingIntensity: ProcessingIntensity;
  private loadHistory: number[];
  
  // Thresholds
  private loadThresholds: Map<LoadLevel, LoadThreshold>;
  
  // Task Management
  private taskQueue: TaskPriority[];
  private deferredTasks: TaskPriority[];
  
  // Monitoring
  private monitoringIntervalId: number | null;
  private lastResponseTime: number;
  private responseTimeHistory: number[];

  constructor(config?: Partial<CognitiveLoadConfig>) {
    this.config = {
      monitoringInterval: 10, // 100 Hz
      baselineAdjustmentRate: 0.05,
      throttleThreshold: 75,
      boostThreshold: 30,
      criticalThreshold: 90,
      enabled: true,
      ...config,
    };

    // Initialize load state
    this.cognitiveLoad = {
      current: 50,
      baseline: 50,
      peak: 50,
      trend: 'stable',
      level: 'moderate',
    };

    this.processingIntensity = {
      current: 100,
      target: 100,
      adjustment: 0,
    };

    this.loadHistory = [];
    this.responseTimeHistory = [];

    // Define load thresholds
    this.loadThresholds = new Map([
      ['idle', { level: 'idle', min: 0, max: 20, responseTime: 100 }],
      ['light', { level: 'light', min: 20, max: 40, responseTime: 150 }],
      ['moderate', { level: 'moderate', min: 40, max: 60, responseTime: 200 }],
      ['high', { level: 'high', min: 60, max: 80, responseTime: 300 }],
      ['critical', { level: 'critical', min: 80, max: 100, responseTime: 500 }],
    ]);

    this.taskQueue = [];
    this.deferredTasks = [];
    this.monitoringIntervalId = null;
    this.lastResponseTime = 0;

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /* ================================ */
  /* MONITORING (100 Hz)              */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.detectLoad();
      this.adjustIntensity();
      this.updateBaseline();
      this.checkCritical();
    }, this.config.monitoringInterval);
  }

  /* ================================ */
  /* LOAD DETECTION                   */
  /* ================================ */

  private detectLoad(): void {
    // Calculate load based on:
    // - Task queue length
    // - Recent response times
    // - Processing intensity

    const queueLoad = Math.min(100, (this.taskQueue.length / 10) * 100);
    const responseLoad = this.calculateResponseLoad();
    const intensityLoad = 100 - this.processingIntensity.current;

    // Weighted average
    this.cognitiveLoad.current = (queueLoad * 0.4) + (responseLoad * 0.4) + (intensityLoad * 0.2);

    // Update peak
    if (this.cognitiveLoad.current > this.cognitiveLoad.peak) {
      this.cognitiveLoad.peak = this.cognitiveLoad.current;
    }

    // Store in history (last 100 samples)
    this.loadHistory.push(this.cognitiveLoad.current);
    if (this.loadHistory.length > 100) {
      this.loadHistory.shift();
    }

    // Determine trend
    if (this.loadHistory.length >= 10) {
      const recent = this.loadHistory.slice(-10);
      const earlier = this.loadHistory.slice(-20, -10);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlierAvg = earlier.length > 0 ? earlier.reduce((a, b) => a + b, 0) / earlier.length : recentAvg;

      if (recentAvg > earlierAvg + 5) {
        this.cognitiveLoad.trend = 'increasing';
      } else if (recentAvg < earlierAvg - 5) {
        this.cognitiveLoad.trend = 'decreasing';
      } else {
        this.cognitiveLoad.trend = 'stable';
      }
    }

    // Determine level
    this.cognitiveLoad.level = this.determineLoadLevel(this.cognitiveLoad.current);
  }

  private calculateResponseLoad(): number {
    if (this.responseTimeHistory.length === 0) return 0;

    const avgResponseTime = this.responseTimeHistory.reduce((a, b) => a + b, 0) / this.responseTimeHistory.length;
    
    // Map response time to load (100ms = 0%, 500ms = 100%)
    return Math.min(100, (avgResponseTime / 500) * 100);
  }

  private determineLoadLevel(load: number): LoadLevel {
    const thresholdEntries = Array.from(this.loadThresholds.entries());

    for (const [level, threshold] of thresholdEntries) {
      if (load >= threshold.min && load < threshold.max) {
        return level;
      }
    }

    return 'critical';
  }

  /* ================================ */
  /* INTENSITY ADJUSTMENT             */
  /* ================================ */

  private adjustIntensity(): void {
    const load = this.cognitiveLoad.current;

    if (load >= this.config.throttleThreshold) {
      // Throttle processing
      const throttleAmount = Math.min(50, (load - this.config.throttleThreshold) * 2);
      this.processingIntensity.adjustment = -throttleAmount;
      this.processingIntensity.target = 100 - throttleAmount;
    } else if (load <= this.config.boostThreshold) {
      // Boost processing
      const boostAmount = Math.min(20, (this.config.boostThreshold - load));
      this.processingIntensity.adjustment = boostAmount;
      this.processingIntensity.target = 100 + boostAmount;
    } else {
      // Normal processing
      this.processingIntensity.adjustment = 0;
      this.processingIntensity.target = 100;
    }

    // Smooth adjustment (10% per cycle)
    const diff = this.processingIntensity.target - this.processingIntensity.current;
    this.processingIntensity.current += diff * 0.1;
  }

  /* ================================ */
  /* BASELINE UPDATE                  */
  /* ================================ */

  private updateBaseline(): void {
    // Slowly adjust baseline towards current average
    if (this.loadHistory.length < 20) return;

    const recentAvg = this.loadHistory.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const diff = recentAvg - this.cognitiveLoad.baseline;
    
    this.cognitiveLoad.baseline += diff * this.config.baselineAdjustmentRate;
  }

  /* ================================ */
  /* CRITICAL LOAD HANDLING           */
  /* ================================ */

  private checkCritical(): void {
    if (this.cognitiveLoad.current >= this.config.criticalThreshold) {
      this.activateCriticalMode();
    }
  }

  public activateCriticalMode(): void {
    // Aggressive throttling
    this.processingIntensity.target = 50;
    this.processingIntensity.current = 50;
    this.processingIntensity.adjustment = -50;

    // Defer non-critical tasks
    this.deferNonCriticalTasks();
  }

  private deferNonCriticalTasks(): void {
    const criticalTasks: TaskPriority[] = [];
    const deferredTasks: TaskPriority[] = [];

    for (const task of this.taskQueue) {
      if (task.priority >= 8 || !task.canDefer) {
        criticalTasks.push(task);
      } else {
        deferredTasks.push(task);
      }
    }

    this.taskQueue = criticalTasks;
    this.deferredTasks.push(...deferredTasks);
  }

  public deactivateCriticalMode(): void {
    // Restore normal processing
    this.processingIntensity.target = 100;
    this.processingIntensity.adjustment = 0;

    // Restore deferred tasks
    this.taskQueue.push(...this.deferredTasks);
    this.deferredTasks = [];
  }

  /* ================================ */
  /* TASK MANAGEMENT                  */
  /* ================================ */

  public addTask(taskId: string, priority: number = 5, estimatedLoad: number = 10, canDefer: boolean = true): void {
    this.taskQueue.push({
      taskId,
      priority: Math.max(1, Math.min(10, priority)),
      estimatedLoad: Math.max(0, Math.min(100, estimatedLoad)),
      canDefer,
    });

    // Sort by priority (highest first)
    this.taskQueue.sort((a, b) => b.priority - a.priority);
  }

  public completeTask(taskId: string, responseTime: number): void {
    this.taskQueue = this.taskQueue.filter(t => t.taskId !== taskId);
    
    // Record response time
    this.lastResponseTime = responseTime;
    this.responseTimeHistory.push(responseTime);

    if (this.responseTimeHistory.length > 50) {
      this.responseTimeHistory.shift();
    }
  }

  public getTaskQueue(): TaskPriority[] {
    return [...this.taskQueue];
  }

  public getDeferredTasks(): TaskPriority[] {
    return [...this.deferredTasks];
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getCognitiveLoad(): CognitiveLoad {
    return { ...this.cognitiveLoad };
  }

  public getProcessingIntensity(): ProcessingIntensity {
    return { ...this.processingIntensity };
  }

  public getLoadHistory(count: number = 50): number[] {
    return this.loadHistory.slice(-count);
  }

  public getTargetResponseTime(): number {
    const threshold = this.loadThresholds.get(this.cognitiveLoad.level);
    return threshold?.responseTime || 200;
  }

  public getState() {
    return {
      cognitiveLoad: { ...this.cognitiveLoad },
      processingIntensity: { ...this.processingIntensity },
      loadHistory: this.loadHistory.slice(-50),
      responseTimeHistory: this.responseTimeHistory.slice(-20),
      taskQueue: [...this.taskQueue],
      deferredTasks: [...this.deferredTasks],
      targetResponseTime: this.getTargetResponseTime(),
    };
  }

  public getSummary(): string {
    const load = this.cognitiveLoad;
    const intensity = this.processingIntensity;

    return `Cognitive Load Regulator Summary:
  Current Load: ${load.current.toFixed(1)}% (${load.level})
  Baseline: ${load.baseline.toFixed(1)}%
  Peak: ${load.peak.toFixed(1)}%
  Trend: ${load.trend}
  Processing Intensity: ${intensity.current.toFixed(1)}%
  Adjustment: ${intensity.adjustment >= 0 ? '+' : ''}${intensity.adjustment.toFixed(1)}%
  Task Queue: ${this.taskQueue.length}
  Deferred Tasks: ${this.deferredTasks.length}
  Target Response: ${this.getTargetResponseTime()}ms`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.cognitiveLoad = {
      current: 50,
      baseline: 50,
      peak: 50,
      trend: 'stable',
      level: 'moderate',
    };

    this.processingIntensity = {
      current: 100,
      target: 100,
      adjustment: 0,
    };

    this.loadHistory = [];
    this.responseTimeHistory = [];
    this.taskQueue = [];
    this.deferredTasks = [];
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
  }
}
