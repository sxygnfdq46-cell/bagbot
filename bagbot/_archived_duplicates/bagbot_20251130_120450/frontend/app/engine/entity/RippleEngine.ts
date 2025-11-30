/**
 * LEVEL 7.2 — EMPATHY RIPPLE ENGINE
 * Mirrors user input energy using ripple effects
 * 
 * - Typing speed → ripple frequency
 * - Cursor movement → subtle wave trails
 * - Page interaction → glow resonance
 * 
 * Makes the entity FEEL connected to you.
 */

export interface RippleWave {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  velocity: number;
  timestamp: number;
}

export class RippleEngine {
  private waves: RippleWave[] = [];
  private typingBuffer: number[] = [];
  private lastTypingTime: number = 0;

  /**
   * Track typing velocity
   */
  trackTyping(timestamp: number = Date.now()): void {
    this.typingBuffer.push(timestamp);
    this.lastTypingTime = timestamp;

    // Keep last 10 seconds of typing
    this.typingBuffer = this.typingBuffer.filter(t => timestamp - t < 10000);
  }

  /**
   * Calculate typing velocity (keys per minute)
   */
  getTypingVelocity(): number {
    const now = Date.now();
    const recentKeys = this.typingBuffer.filter(t => now - t < 60000);
    return recentKeys.length; // Keys per minute
  }

  /**
   * Create ripple from cursor movement
   */
  createCursorRipple(x: number, y: number, velocity: number): void {
    const now = Date.now();

    // Only create ripples for significant movement
    if (velocity > 5) {
      this.waves.push({
        x,
        y,
        radius: 0,
        opacity: Math.min(0.8, velocity / 100),
        velocity,
        timestamp: now,
      });

      // Limit to 50 active waves
      if (this.waves.length > 50) {
        this.waves = this.waves.slice(-50);
      }
    }
  }

  /**
   * Create ripple from interaction (click/tap)
   */
  createInteractionRipple(x: number, y: number, intensity: number): void {
    const now = Date.now();

    this.waves.push({
      x,
      y,
      radius: 0,
      opacity: Math.min(1.0, intensity / 100),
      velocity: intensity * 0.5,
      timestamp: now,
    });
  }

  /**
   * Update all ripples (call each frame)
   */
  update(deltaTime: number): RippleWave[] {
    const now = Date.now();

    // Update each wave
    this.waves = this.waves
      .map(wave => {
        const age = now - wave.timestamp;
        const maxAge = 2000; // 2 seconds lifespan

        // Expand radius
        wave.radius += wave.velocity * (deltaTime / 16.67);

        // Fade opacity
        wave.opacity = Math.max(0, wave.opacity * (1 - age / maxAge));

        return wave;
      })
      .filter(wave => wave.opacity > 0.01 && wave.radius < 500);

    return this.waves;
  }

  /**
   * Get current resonance level (0-100)
   */
  getResonanceLevel(): number {
    const activeWaves = this.waves.length;
    const typingVelocity = this.getTypingVelocity();

    // Combined resonance from waves and typing
    const resonance = Math.min(100, activeWaves * 2 + typingVelocity * 0.5);

    return resonance;
  }

  /**
   * Clear all ripples
   */
  clear(): void {
    this.waves = [];
    this.typingBuffer = [];
  }
}
