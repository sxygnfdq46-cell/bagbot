/**
 * ═══════════════════════════════════════════════════════════════════
 * INTEGRITY SCANNER — Level 17.5 Module
 * ═══════════════════════════════════════════════════════════════════
 * 12-rule integrity sweep for system diagnostics
 * 
 * Features:
 * - 12 comprehensive integrity checks
 * - Confidence scoring (0-100)
 * - Issue severity classification
 * - Drift detection algorithms
 * - Read-only scanning (no mutations)
 * 
 * Safety: Diagnostic only, no corrections applied
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface SubsystemStatus {
  name: string;
  health: number; // 0-100
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  lastUpdate: number;
  activeThreads: number;
}

export interface FPSMetrics {
  current: number;
  avg: number;
  min: number;
  max: number;
  gpuLoad: number;
}

export interface ScanIssue {
  rule: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedSubsystems: string[];
  value?: number | string;
  threshold?: number | string;
}

export interface ScanReport {
  id: string;
  timestamp: number;
  duration: number; // ms
  issues: ScanIssue[];
  issueCount: number;
  confidence: number; // 0-100
  passedRules: number;
  failedRules: number;
  totalRules: number;
}

export interface SystemState {
  subsystems: SubsystemStatus[];
  fpsMetrics: FPSMetrics;
  timestamp: number;
  logEvents?: Array<{ severity: string; timestamp: number }>;
}

// ─────────────────────────────────────────────────────────────────
// INTEGRITY SCANNER CLASS
// ─────────────────────────────────────────────────────────────────

export class IntegrityScanner {
  private previousState: SystemState | null = null;
  private scanHistory: ScanReport[] = [];
  private readonly MAX_HISTORY = 50;

  // Thresholds
  private readonly THRESHOLDS = {
    TEMPORAL_DRIFT_MS: 500, // Max acceptable timestamp drift
    HEALTH_MINIMUM: 30,     // Minimum health threshold
    FPS_MINIMUM: 30,        // Minimum FPS threshold
    GPU_MAXIMUM: 85,        // Maximum GPU load %
    THREAD_MINIMUM: 2,      // Minimum active threads per subsystem
    ERROR_RATE: 0.1,        // Max 10% error rate in logs
    SCAN_COOLDOWN_MS: 5000  // Minimum time between scans
  };

  constructor() {
    // Initialize
  }

  /**
   * Perform full integrity scan
   */
  scan(state: SystemState): ScanReport {
    const startTime = Date.now();
    const issues: ScanIssue[] = [];

    // Run all 12 integrity rules
    issues.push(...this.rule01_temporalDrift(state));
    issues.push(...this.rule02_memoryBandConsistency(state));
    issues.push(...this.rule03_emotionalOscillation(state));
    issues.push(...this.rule04_executionGapDetection(state));
    issues.push(...this.rule05_multiThreadDesync(state));
    issues.push(...this.rule06_resourceThresholds(state));
    issues.push(...this.rule07_fpsDegradation(state));
    issues.push(...this.rule08_gpuOverload(state));
    issues.push(...this.rule09_subsystemHealthDecline(state));
    issues.push(...this.rule10_logErrorPatterns(state));
    issues.push(...this.rule11_scanFrequencyAbuse(state));
    issues.push(...this.rule12_confidenceDecay(state));

    // Calculate metrics
    const totalRules = 12;
    const failedRules = issues.length;
    const passedRules = totalRules - failedRules;
    const confidence = Math.max(0, Math.min(100, 
      Math.round((passedRules / totalRules) * 100)
    ));

    // Create report
    const report: ScanReport = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      issues,
      issueCount: issues.length,
      confidence,
      passedRules,
      failedRules,
      totalRules
    };

    // Update history
    this.scanHistory.push(report);
    if (this.scanHistory.length > this.MAX_HISTORY) {
      this.scanHistory = this.scanHistory.slice(-this.MAX_HISTORY);
    }

    // Store state for next scan
    this.previousState = state;

    return report;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 01: Temporal Drift Detection
  // ─────────────────────────────────────────────────────────────────
  private rule01_temporalDrift(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];
    const now = Date.now();
    const drift = Math.abs(now - state.timestamp);

    if (drift > this.THRESHOLDS.TEMPORAL_DRIFT_MS) {
      issues.push({
        rule: 'Temporal Drift',
        severity: drift > 1000 ? 'high' : 'medium',
        description: `System timestamp drift detected: ${drift}ms`,
        affectedSubsystems: ['All'],
        value: drift,
        threshold: this.THRESHOLDS.TEMPORAL_DRIFT_MS
      });
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 02: Memory Band Consistency
  // ─────────────────────────────────────────────────────────────────
  private rule02_memoryBandConsistency(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];
    const memoryLayer = state.subsystems.find(s => s.name === 'Memory Layer');

    if (memoryLayer && memoryLayer.status === 'critical') {
      issues.push({
        rule: 'Memory Band Consistency',
        severity: 'critical',
        description: 'Memory layer in critical state',
        affectedSubsystems: ['Memory Layer'],
        value: memoryLayer.health,
        threshold: this.THRESHOLDS.HEALTH_MINIMUM
      });
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 03: Emotional Oscillation Deviation
  // ─────────────────────────────────────────────────────────────────
  private rule03_emotionalOscillation(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];
    const emotionEngine = state.subsystems.find(s => s.name === 'Emotional Engine');

    if (emotionEngine && this.previousState) {
      const prevEmotion = this.previousState.subsystems.find(s => s.name === 'Emotional Engine');
      if (prevEmotion) {
        const healthChange = Math.abs(emotionEngine.health - prevEmotion.health);
        if (healthChange > 20) {
          issues.push({
            rule: 'Emotional Oscillation',
            severity: 'medium',
            description: `Rapid emotional state change: ${healthChange} points`,
            affectedSubsystems: ['Emotional Engine'],
            value: healthChange,
            threshold: 20
          });
        }
      }
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 04: Execution Gap Detection
  // ─────────────────────────────────────────────────────────────────
  private rule04_executionGapDetection(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];
    const execManager = state.subsystems.find(s => s.name === 'Execution Manager');

    if (execManager && this.previousState) {
      const timeSinceUpdate = Date.now() - execManager.lastUpdate;
      if (timeSinceUpdate > 5000) {
        issues.push({
          rule: 'Execution Gap',
          severity: 'high',
          description: `No execution updates for ${Math.round(timeSinceUpdate / 1000)}s`,
          affectedSubsystems: ['Execution Manager'],
          value: timeSinceUpdate,
          threshold: 5000
        });
      }
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 05: Multi-Thread Desync
  // ─────────────────────────────────────────────────────────────────
  private rule05_multiThreadDesync(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];
    
    state.subsystems.forEach(subsystem => {
      if (subsystem.activeThreads < this.THRESHOLDS.THREAD_MINIMUM) {
        issues.push({
          rule: 'Multi-Thread Desync',
          severity: 'low',
          description: `${subsystem.name} has insufficient active threads`,
          affectedSubsystems: [subsystem.name],
          value: subsystem.activeThreads,
          threshold: this.THRESHOLDS.THREAD_MINIMUM
        });
      }
    });

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 06: Resource Threshold Violations
  // ─────────────────────────────────────────────────────────────────
  private rule06_resourceThresholds(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];
    
    const unhealthySubsystems = state.subsystems.filter(
      s => s.health < this.THRESHOLDS.HEALTH_MINIMUM
    );

    unhealthySubsystems.forEach(subsystem => {
      issues.push({
        rule: 'Resource Threshold Violation',
        severity: subsystem.health < 15 ? 'critical' : 'high',
        description: `${subsystem.name} health below threshold`,
        affectedSubsystems: [subsystem.name],
        value: subsystem.health,
        threshold: this.THRESHOLDS.HEALTH_MINIMUM
      });
    });

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 07: FPS Degradation
  // ─────────────────────────────────────────────────────────────────
  private rule07_fpsDegradation(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];

    if (state.fpsMetrics.current < this.THRESHOLDS.FPS_MINIMUM) {
      issues.push({
        rule: 'FPS Degradation',
        severity: state.fpsMetrics.current < 20 ? 'critical' : 'high',
        description: `Low frame rate detected: ${state.fpsMetrics.current.toFixed(1)} FPS`,
        affectedSubsystems: ['All'],
        value: state.fpsMetrics.current,
        threshold: this.THRESHOLDS.FPS_MINIMUM
      });
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 08: GPU Overload
  // ─────────────────────────────────────────────────────────────────
  private rule08_gpuOverload(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];

    if (state.fpsMetrics.gpuLoad > this.THRESHOLDS.GPU_MAXIMUM) {
      issues.push({
        rule: 'GPU Overload',
        severity: state.fpsMetrics.gpuLoad > 95 ? 'critical' : 'high',
        description: `GPU load exceeds threshold: ${state.fpsMetrics.gpuLoad}%`,
        affectedSubsystems: ['All'],
        value: state.fpsMetrics.gpuLoad,
        threshold: this.THRESHOLDS.GPU_MAXIMUM
      });
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 09: Subsystem Health Decline
  // ─────────────────────────────────────────────────────────────────
  private rule09_subsystemHealthDecline(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];

    if (this.previousState) {
      state.subsystems.forEach(subsystem => {
        const prev = this.previousState!.subsystems.find(s => s.name === subsystem.name);
        if (prev) {
          const decline = prev.health - subsystem.health;
          if (decline > 15) {
            issues.push({
              rule: 'Subsystem Health Decline',
              severity: decline > 30 ? 'high' : 'medium',
              description: `${subsystem.name} health declined by ${decline} points`,
              affectedSubsystems: [subsystem.name],
              value: decline,
              threshold: 15
            });
          }
        }
      });
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 10: Log Error Patterns
  // ─────────────────────────────────────────────────────────────────
  private rule10_logErrorPatterns(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];

    if (state.logEvents && state.logEvents.length > 0) {
      const errorCount = state.logEvents.filter(e => e.severity === 'error').length;
      const errorRate = errorCount / state.logEvents.length;

      if (errorRate > this.THRESHOLDS.ERROR_RATE) {
        issues.push({
          rule: 'Log Error Patterns',
          severity: errorRate > 0.25 ? 'high' : 'medium',
          description: `High error rate in logs: ${(errorRate * 100).toFixed(1)}%`,
          affectedSubsystems: ['All'],
          value: errorRate,
          threshold: this.THRESHOLDS.ERROR_RATE
        });
      }
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 11: Scan Frequency Abuse
  // ─────────────────────────────────────────────────────────────────
  private rule11_scanFrequencyAbuse(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];

    if (this.scanHistory.length >= 2) {
      const lastScan = this.scanHistory[this.scanHistory.length - 1];
      const timeSinceLastScan = Date.now() - lastScan.timestamp;

      if (timeSinceLastScan < this.THRESHOLDS.SCAN_COOLDOWN_MS) {
        issues.push({
          rule: 'Scan Frequency Abuse',
          severity: 'low',
          description: `Scans running too frequently: ${timeSinceLastScan}ms since last`,
          affectedSubsystems: ['Integrity Scanner'],
          value: timeSinceLastScan,
          threshold: this.THRESHOLDS.SCAN_COOLDOWN_MS
        });
      }
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // RULE 12: Confidence Decay
  // ─────────────────────────────────────────────────────────────────
  private rule12_confidenceDecay(state: SystemState): ScanIssue[] {
    const issues: ScanIssue[] = [];

    if (this.scanHistory.length >= 3) {
      const recentScans = this.scanHistory.slice(-3);
      const avgConfidence = recentScans.reduce((sum, s) => sum + s.confidence, 0) / 3;

      if (avgConfidence < 70) {
        issues.push({
          rule: 'Confidence Decay',
          severity: avgConfidence < 50 ? 'critical' : 'high',
          description: `System confidence declining: ${avgConfidence.toFixed(1)}% average`,
          affectedSubsystems: ['All'],
          value: avgConfidence,
          threshold: 70
        });
      }
    }

    return issues;
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get scan history
   */
  getHistory(): ScanReport[] {
    return [...this.scanHistory];
  }

  /**
   * Get last N scans
   */
  getLastScans(count: number): ScanReport[] {
    return this.scanHistory.slice(-count);
  }

  /**
   * Clear scan history
   */
  clearHistory(): void {
    this.scanHistory = [];
    this.previousState = null;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalScans: number;
    avgConfidence: number;
    avgDuration: number;
    avgIssues: number;
  } {
    if (this.scanHistory.length === 0) {
      return {
        totalScans: 0,
        avgConfidence: 0,
        avgDuration: 0,
        avgIssues: 0
      };
    }

    const totalConfidence = this.scanHistory.reduce((sum, s) => sum + s.confidence, 0);
    const totalDuration = this.scanHistory.reduce((sum, s) => sum + s.duration, 0);
    const totalIssues = this.scanHistory.reduce((sum, s) => sum + s.issueCount, 0);

    return {
      totalScans: this.scanHistory.length,
      avgConfidence: Math.round(totalConfidence / this.scanHistory.length),
      avgDuration: Math.round(totalDuration / this.scanHistory.length),
      avgIssues: Math.round(totalIssues / this.scanHistory.length)
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export default IntegrityScanner;
