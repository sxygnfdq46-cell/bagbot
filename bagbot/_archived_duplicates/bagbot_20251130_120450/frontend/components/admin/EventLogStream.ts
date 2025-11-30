/**
 * ═══════════════════════════════════════════════════════════════════
 * EVENT LOG STREAM — Level 17.5 Module
 * ═══════════════════════════════════════════════════════════════════
 * Rolling event queue with intelligent compression and batching
 * 
 * Features:
 * - Rolling buffer (configurable size, default 200 events)
 * - Severity-based color mapping
 * - Automatic compression of repetitive logs
 * - 60 FPS animation-safe batching
 * - CPU-safe debounced updates
 * - Zero memory leaks with proper cleanup
 * 
 * Safety: Client-side only, no persistence
 * ═══════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export interface LogEvent {
  id: string;
  timestamp: number;
  severity: 'debug' | 'info' | 'warning' | 'error';
  subsystem: string;
  message: string;
  stackTrace?: string;
  count?: number; // For compressed events
}

export type SeverityLevel = LogEvent['severity'];

// ─────────────────────────────────────────────────────────────────
// EVENT LOG STREAM CLASS
// ─────────────────────────────────────────────────────────────────

export class EventLogStream {
  private buffer: LogEvent[] = [];
  private maxSize: number;
  private compressionMap: Map<string, LogEvent> = new Map();
  private batchQueue: LogEvent[] = [];
  private batchTimer: number | null = null;
  private readonly BATCH_DELAY = 16; // ~60 FPS

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  /**
   * Push a new event to the stream
   * Automatically compresses repetitive events
   */
  push(event: LogEvent): void {
    // Generate compression key (subsystem + message)
    const compressionKey = `${event.subsystem}:${event.message}`;

    // Check for duplicate within last 10 seconds
    const existing = this.compressionMap.get(compressionKey);
    if (existing && (event.timestamp - existing.timestamp) < 10000) {
      // Compress: increment count instead of adding duplicate
      existing.count = (existing.count || 1) + 1;
      existing.timestamp = event.timestamp; // Update to latest timestamp
      return;
    }

    // Add to compression map
    this.compressionMap.set(compressionKey, event);

    // Clean old compression entries (older than 10s)
    const cutoff = event.timestamp - 10000;
    const keysToDelete: string[] = [];
    this.compressionMap.forEach((value, key) => {
      if (value.timestamp < cutoff) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.compressionMap.delete(key));

    // Add to batch queue
    this.batchQueue.push(event);

    // Schedule batch processing
    if (!this.batchTimer) {
      this.batchTimer = window.setTimeout(() => {
        this.processBatch();
      }, this.BATCH_DELAY);
    }
  }

  /**
   * Process queued events in batch (60 FPS safe)
   */
  private processBatch(): void {
    if (this.batchQueue.length === 0) {
      this.batchTimer = null;
      return;
    }

    // Move batch to buffer
    this.buffer.push(...this.batchQueue);
    this.batchQueue = [];

    // Trim buffer to max size
    if (this.buffer.length > this.maxSize) {
      this.buffer = this.buffer.slice(-this.maxSize);
    }

    this.batchTimer = null;
  }

  /**
   * Get all events in the buffer
   */
  getAll(): LogEvent[] {
    // Flush pending batch first
    if (this.batchQueue.length > 0) {
      this.processBatch();
    }
    return [...this.buffer];
  }

  /**
   * Get events filtered by severity
   */
  getBySeverity(severity: SeverityLevel): LogEvent[] {
    return this.getAll().filter(event => event.severity === severity);
  }

  /**
   * Get events filtered by subsystem
   */
  getBySubsystem(subsystem: string): LogEvent[] {
    return this.getAll().filter(event => event.subsystem === subsystem);
  }

  /**
   * Get events within time range (ms)
   */
  getByTimeRange(startTime: number, endTime: number): LogEvent[] {
    return this.getAll().filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get last N events
   */
  getLast(count: number): LogEvent[] {
    const all = this.getAll();
    return all.slice(-count);
  }

  /**
   * Get event count by severity
   */
  getCountBySeverity(): Record<SeverityLevel, number> {
    const all = this.getAll();
    return {
      debug: all.filter(e => e.severity === 'debug').length,
      info: all.filter(e => e.severity === 'info').length,
      warning: all.filter(e => e.severity === 'warning').length,
      error: all.filter(e => e.severity === 'error').length
    };
  }

  /**
   * Get event count by subsystem
   */
  getCountBySubsystem(): Record<string, number> {
    const all = this.getAll();
    const counts: Record<string, number> = {};

    all.forEach(event => {
      counts[event.subsystem] = (counts[event.subsystem] || 0) + 1;
    });

    return counts;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.buffer = [];
    this.batchQueue = [];
    this.compressionMap.clear();

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Get buffer statistics
   */
  getStats(): {
    total: number;
    pending: number;
    compressed: number;
    maxSize: number;
    utilizationPercent: number;
  } {
    return {
      total: this.buffer.length,
      pending: this.batchQueue.length,
      compressed: this.compressionMap.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.buffer.length / this.maxSize) * 100)
    };
  }

  /**
   * Export events as JSON
   */
  export(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /**
   * Import events from JSON
   */
  import(json: string): void {
    try {
      const events = JSON.parse(json) as LogEvent[];
      this.buffer = events.slice(-this.maxSize);
    } catch (error) {
      console.error('Failed to import events:', error);
    }
  }

  /**
   * Cleanup - call when component unmounts
   */
  dispose(): void {
    this.clear();
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get CSS class for severity level
 */
export function getSeverityClass(severity: SeverityLevel): string {
  switch (severity) {
    case 'debug':
      return 'log-severity-debug';
    case 'info':
      return 'log-severity-info';
    case 'warning':
      return 'log-severity-warning';
    case 'error':
      return 'log-severity-error';
  }
}

/**
 * Get color code for severity level (for charts/graphs)
 */
export function getSeverityColor(severity: SeverityLevel): string {
  switch (severity) {
    case 'debug':
      return '#22d3ee'; // cyan-400
    case 'info':
      return '#a78bfa'; // purple-400
    case 'warning':
      return '#fb923c'; // orange-400
    case 'error':
      return '#f87171'; // red-400
  }
}

/**
 * Format timestamp for display
 */
export function formatLogTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Create a log event helper
 */
export function createLogEvent(
  severity: SeverityLevel,
  subsystem: string,
  message: string,
  stackTrace?: string
): LogEvent {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    severity,
    subsystem,
    message,
    stackTrace
  };
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export default EventLogStream;
