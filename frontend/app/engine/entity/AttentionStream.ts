/**
 * LEVEL 7.2 — MICRO-ATTENTION ENGINE
 * Tracks tiny bursts of interaction
 * 
 * Detects:
 * - Hovering patterns
 * - Rapid page changes
 * - Subtle pauses (300-500ms)
 * - Quick glances
 * 
 * Triggers micro-acknowledgement effects
 */

export type AttentionType = 'hover' | 'glance' | 'quick-switch' | 'brief-pause';

export interface AttentionEvent {
  type: AttentionType;
  x: number;
  y: number;
  timestamp: number;
  duration: number;
  intensity: number;
}

export class AttentionStream {
  private events: AttentionEvent[] = [];
  private hoverStart: { x: number; y: number; time: number } | null = null;
  private lastMouseMove: number = 0;
  private lastPageChange: number = 0;
  private idleStart: number = 0;
  private isIdle: boolean = false;

  /**
   * Detect hover patterns
   */
  trackMouseMove(x: number, y: number): void {
    const now = Date.now();
    const timeSinceLastMove = now - this.lastMouseMove;

    // Start hover detection if mouse is still for > 100ms
    if (timeSinceLastMove > 100) {
      if (!this.hoverStart) {
        this.hoverStart = { x, y, time: now };
      } else {
        // Check if position is roughly the same (within 20px)
        const distance = Math.sqrt(
          Math.pow(x - this.hoverStart.x, 2) + Math.pow(y - this.hoverStart.y, 2)
        );

        if (distance > 20) {
          // Mouse moved significantly, reset hover
          this.hoverStart = { x, y, time: now };
        }
      }
    } else {
      this.hoverStart = null;
    }

    // Check for brief pause (300-500ms of no movement)
    if (this.isIdle && timeSinceLastMove >= 300 && timeSinceLastMove <= 500) {
      this.addEvent({
        type: 'brief-pause',
        x,
        y,
        timestamp: now,
        duration: timeSinceLastMove,
        intensity: 50,
      });
      this.isIdle = false;
    }

    // Update idle tracking
    if (timeSinceLastMove < 50) {
      this.isIdle = true;
      this.idleStart = now;
    }

    this.lastMouseMove = now;
  }

  /**
   * Check for completed hover
   */
  checkHover(): AttentionEvent | null {
    if (!this.hoverStart) return null;

    const now = Date.now();
    const hoverDuration = now - this.hoverStart.time;

    // Significant hover is > 500ms
    if (hoverDuration > 500) {
      const event: AttentionEvent = {
        type: 'hover',
        x: this.hoverStart.x,
        y: this.hoverStart.y,
        timestamp: now,
        duration: hoverDuration,
        intensity: Math.min(100, hoverDuration / 20),
      };

      this.addEvent(event);
      this.hoverStart = null;

      return event;
    }

    return null;
  }

  /**
   * Detect rapid page changes
   */
  trackPageChange(fromPage: string, toPage: string): void {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastPageChange;

    // Quick switch = page change within 2 seconds
    if (timeSinceLastChange < 2000 && timeSinceLastChange > 100) {
      this.addEvent({
        type: 'quick-switch',
        x: 0,
        y: 0,
        timestamp: now,
        duration: timeSinceLastChange,
        intensity: 70,
      });
    }

    this.lastPageChange = now;
  }

  /**
   * Detect glances (rapid focus shifts)
   */
  detectGlance(x: number, y: number): void {
    const now = Date.now();
    const lastEvent = this.events[this.events.length - 1];

    if (lastEvent && lastEvent.type === 'glance') {
      const timeSinceLastGlance = now - lastEvent.timestamp;

      // Rapid glance = < 300ms between glances
      if (timeSinceLastGlance < 300) {
        this.addEvent({
          type: 'glance',
          x,
          y,
          timestamp: now,
          duration: timeSinceLastGlance,
          intensity: 60,
        });
      }
    } else {
      // First glance in sequence
      this.addEvent({
        type: 'glance',
        x,
        y,
        timestamp: now,
        duration: 0,
        intensity: 40,
      });
    }
  }

  /**
   * Add attention event
   */
  private addEvent(event: AttentionEvent): void {
    this.events.push(event);

    // Keep last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  /**
   * Get recent events (last N seconds)
   */
  getRecentEvents(seconds: number = 5): AttentionEvent[] {
    const now = Date.now();
    return this.events.filter(e => now - e.timestamp < seconds * 1000);
  }

  /**
   * Get acknowledgement level (0-100)
   */
  getAcknowledgementLevel(): number {
    const recentEvents = this.getRecentEvents(3);

    // Weight different event types
    const weights = {
      hover: 15,
      glance: 8,
      'quick-switch': 12,
      'brief-pause': 10,
    };

    const level = recentEvents.reduce((sum, event) => {
      return sum + weights[event.type];
    }, 0);

    return Math.min(100, level);
  }

  /**
   * Get hover patterns (durations in ms)
   */
  getHoverPatterns(): number[] {
    return this.getRecentEvents(10)
      .filter(e => e.type === 'hover')
      .map(e => e.duration);
  }

  /**
   * Get glance frequency (per minute)
   */
  getGlanceFrequency(): number {
    const oneMinuteAgo = Date.now() - 60000;
    const glances = this.events.filter(
      e => e.type === 'glance' && e.timestamp > oneMinuteAgo
    );
    return glances.length;
  }

  /**
   * Clear old events
   */
  cleanup(): void {
    const now = Date.now();
    // Keep events from last 30 seconds
    this.events = this.events.filter(e => now - e.timestamp < 30000);
  }
}
