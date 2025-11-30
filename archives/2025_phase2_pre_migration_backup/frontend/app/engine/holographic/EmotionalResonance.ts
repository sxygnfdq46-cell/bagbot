/**
 * 🔷 LEVEL 8.2 — EMOTIONAL RESONANCE DISPLAY
 * 
 * BagBot detects:
 * - Fast interactions
 * - Slow interactions
 * - Hesitation
 * - Command intensity
 * 
 * And adjusts glow, motion speed, and holo-lines accordingly.
 * Not real emotions — just visual resonance to enhance presence.
 */

import { GenomeSnapshot } from '../entity/BehaviorGenome';
import { ExpressionOutput } from '../entity/ExpressionCore';

// ============================================
// TYPES
// ============================================

export interface ResonanceState {
  detection: InteractionDetection;
  visualResponse: VisualResponse;
  holoLines: HoloLine[];
  resonanceIntensity: number; // 0-100
}

export interface InteractionDetection {
  interactionType: 'fast' | 'slow' | 'hesitant' | 'intense' | 'idle';
  speed: number; // 0-100 (typing/click speed)
  intensity: number; // 0-100 (command urgency)
  hesitationLevel: number; // 0-100
  patterns: InteractionPattern[];
  lastActivity: number; // timestamp
}

export interface InteractionPattern {
  timestamp: number;
  type: 'keypress' | 'click' | 'hover' | 'scroll' | 'command';
  speed: number; // milliseconds since last
  intensity: number; // calculated urgency
}

export interface VisualResponse {
  glowIntensity: number; // 0-100
  glowRadius: number; // pixels
  motionSpeed: number; // 0.1-3.0 multiplier
  pulseFrequency: number; // Hz
  colorShift: number; // -30 to +30 hue adjustment
}

export interface HoloLine {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number; // 0-1 animation progress
  intensity: number; // 0-100
  hue: number; // 0-360
  type: 'response' | 'hesitation' | 'intensity' | 'idle';
  lifetime: number; // milliseconds
  createdAt: number;
}

// ============================================
// EMOTIONAL RESONANCE DISPLAY
// ============================================

export class EmotionalResonance {
  private state: ResonanceState;
  private genome: GenomeSnapshot | null = null;
  private expression: ExpressionOutput | null = null;
  private readonly STORAGE_KEY = 'bagbot_emotional_resonance_v1';

  // Detection thresholds
  private readonly FAST_THRESHOLD = 100; // ms between actions
  private readonly SLOW_THRESHOLD = 2000; // ms between actions
  private readonly HESITATION_THRESHOLD = 500; // ms pause
  private readonly PATTERN_WINDOW = 5000; // track last 5 seconds

  // Visual response ranges
  private readonly GLOW_MIN = 20;
  private readonly GLOW_MAX = 90;
  private readonly MOTION_MIN = 0.3;
  private readonly MOTION_MAX = 2.5;
  private readonly PULSE_MIN = 0.5; // Hz
  private readonly PULSE_MAX = 3.0; // Hz

  // Holo-line configuration
  private readonly MAX_HOLO_LINES = 12;
  private readonly LINE_LIFETIME = 1500; // ms
  private readonly LINE_SPAWN_RATE = 300; // ms

  private lastLineSpawn = 0;

  constructor() {
    this.state = this.getDefaultState();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getDefaultState(): ResonanceState {
    return {
      detection: {
        interactionType: 'idle',
        speed: 0,
        intensity: 0,
        hesitationLevel: 0,
        patterns: [],
        lastActivity: Date.now(),
      },
      visualResponse: {
        glowIntensity: 40,
        glowRadius: 50,
        motionSpeed: 1.0,
        pulseFrequency: 1.0,
        colorShift: 0,
      },
      holoLines: [],
      resonanceIntensity: 0,
    };
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  public update(
    genome: GenomeSnapshot,
    expression: ExpressionOutput
  ): ResonanceState {
    this.genome = genome;
    this.expression = expression;

    // Analyze interaction patterns
    this.analyzePatterns();

    // Update visual response based on detection
    this.updateVisualResponse();

    // Update holo-lines
    this.updateHoloLines();

    // Calculate overall resonance intensity
    this.calculateResonanceIntensity();

    // Clean up old patterns
    this.cleanupOldPatterns();

    this.saveToStorage();
    return this.state;
  }

  // ============================================
  // INTERACTION TRACKING
  // ============================================

  public recordInteraction(
    type: 'keypress' | 'click' | 'hover' | 'scroll' | 'command',
    metadata?: { urgency?: number; duration?: number }
  ): void {
    const now = Date.now();
    const timeSinceLast = now - this.state.detection.lastActivity;

    // Calculate speed (inverse of time)
    const speed = timeSinceLast > 0 ? Math.min(100, (1000 / timeSinceLast) * 20) : 0;

    // Calculate intensity
    let intensity = 50; // Default
    if (metadata?.urgency !== undefined) {
      intensity = metadata.urgency;
    } else if (type === 'command') {
      intensity = 80; // Commands are intense
    } else if (type === 'keypress') {
      intensity = speed > 70 ? 70 : 40; // Fast typing = more intense
    }

    // Record pattern
    const pattern: InteractionPattern = {
      timestamp: now,
      type,
      speed: timeSinceLast,
      intensity,
    };

    this.state.detection.patterns.push(pattern);
    this.state.detection.lastActivity = now;

    // Spawn holo-line if appropriate
    if (now - this.lastLineSpawn > this.LINE_SPAWN_RATE) {
      this.spawnHoloLine(type, intensity);
      this.lastLineSpawn = now;
    }
  }

  private analyzePatterns(): void {
    const now = Date.now();
    const recentPatterns = this.state.detection.patterns.filter(
      p => now - p.timestamp < this.PATTERN_WINDOW
    );

    if (recentPatterns.length === 0) {
      this.state.detection.interactionType = 'idle';
      this.state.detection.speed = 0;
      this.state.detection.intensity = 0;
      this.state.detection.hesitationLevel = 0;
      return;
    }

    // Calculate average speed between patterns
    const avgSpeed = recentPatterns.reduce((sum, p) => sum + p.speed, 0) / recentPatterns.length;

    // Calculate average intensity
    const avgIntensity = recentPatterns.reduce((sum, p) => sum + p.intensity, 0) / recentPatterns.length;

    // Detect hesitation (pauses between actions)
    const pauses = recentPatterns.filter(p => p.speed > this.HESITATION_THRESHOLD);
    const hesitationLevel = Math.min(100, (pauses.length / recentPatterns.length) * 100);

    // Determine interaction type
    let interactionType: InteractionDetection['interactionType'] = 'idle';

    if (avgSpeed < this.FAST_THRESHOLD) {
      interactionType = 'fast';
    } else if (avgSpeed > this.SLOW_THRESHOLD) {
      interactionType = 'slow';
    } else if (hesitationLevel > 50) {
      interactionType = 'hesitant';
    } else if (avgIntensity > 70) {
      interactionType = 'intense';
    }

    // Update detection state
    this.state.detection.interactionType = interactionType;
    this.state.detection.speed = Math.min(100, (1000 / avgSpeed) * 20);
    this.state.detection.intensity = avgIntensity;
    this.state.detection.hesitationLevel = hesitationLevel;
  }

  private cleanupOldPatterns(): void {
    const now = Date.now();
    this.state.detection.patterns = this.state.detection.patterns.filter(
      p => now - p.timestamp < this.PATTERN_WINDOW
    );
  }

  // ============================================
  // VISUAL RESPONSE
  // ============================================

  private updateVisualResponse(): void {
    if (!this.genome || !this.expression) return;

    const { parameters } = this.genome;
    const { interactionType, speed, intensity, hesitationLevel } = this.state.detection;

    // Base values from personality
    const baseGlow = 30 + parameters.ambientPulse * 0.3;
    const baseMotion = 0.5 + parameters.responsivenessSpeed * 0.015;
    const basePulse = 0.5 + parameters.ambientPulse * 0.02;

    // Adjust based on interaction type
    switch (interactionType) {
      case 'fast':
        // Fast interactions → high glow, fast motion, rapid pulse
        this.state.visualResponse.glowIntensity = Math.min(this.GLOW_MAX, baseGlow + speed * 0.5);
        this.state.visualResponse.motionSpeed = Math.min(this.MOTION_MAX, baseMotion + speed * 0.015);
        this.state.visualResponse.pulseFrequency = Math.min(this.PULSE_MAX, basePulse + speed * 0.02);
        this.state.visualResponse.colorShift = 15; // Warmer (more energetic)
        break;

      case 'slow':
        // Slow interactions → gentle glow, slow motion, calm pulse
        this.state.visualResponse.glowIntensity = Math.max(this.GLOW_MIN, baseGlow - 10);
        this.state.visualResponse.motionSpeed = Math.max(this.MOTION_MIN, baseMotion * 0.6);
        this.state.visualResponse.pulseFrequency = Math.max(this.PULSE_MIN, basePulse * 0.7);
        this.state.visualResponse.colorShift = -10; // Cooler (more calm)
        break;

      case 'hesitant':
        // Hesitation → fluctuating glow, irregular motion
        const hesitationFactor = hesitationLevel / 100;
        this.state.visualResponse.glowIntensity = baseGlow + Math.sin(Date.now() / 500) * 15 * hesitationFactor;
        this.state.visualResponse.motionSpeed = baseMotion + Math.sin(Date.now() / 300) * 0.3 * hesitationFactor;
        this.state.visualResponse.pulseFrequency = basePulse + Math.cos(Date.now() / 400) * 0.5 * hesitationFactor;
        this.state.visualResponse.colorShift = Math.sin(Date.now() / 600) * 20 * hesitationFactor;
        break;

      case 'intense':
        // Intense commands → maximum glow, focused motion, strong pulse
        this.state.visualResponse.glowIntensity = Math.min(this.GLOW_MAX, baseGlow + intensity * 0.6);
        this.state.visualResponse.motionSpeed = Math.min(this.MOTION_MAX, baseMotion + intensity * 0.012);
        this.state.visualResponse.pulseFrequency = Math.min(this.PULSE_MAX, basePulse + intensity * 0.025);
        this.state.visualResponse.colorShift = 25; // Very warm (alert)
        break;

      case 'idle':
      default:
        // Idle → gentle ambient presence
        this.state.visualResponse.glowIntensity = baseGlow * 0.7;
        this.state.visualResponse.motionSpeed = baseMotion * 0.8;
        this.state.visualResponse.pulseFrequency = basePulse * 0.9;
        this.state.visualResponse.colorShift = 0;
        break;
    }

    // Calculate glow radius from intensity
    this.state.visualResponse.glowRadius = 30 + this.state.visualResponse.glowIntensity * 0.8;

    // Apply smoothing
    this.smoothVisualResponse();
  }

  private smoothVisualResponse(): void {
    // Exponential moving average for smooth transitions
    const smoothFactor = 0.15;

    // Note: In a real implementation, you'd store previous values
    // For now, we'll just ensure values are in range
    this.state.visualResponse.glowIntensity = Math.max(
      this.GLOW_MIN,
      Math.min(this.GLOW_MAX, this.state.visualResponse.glowIntensity)
    );

    this.state.visualResponse.motionSpeed = Math.max(
      this.MOTION_MIN,
      Math.min(this.MOTION_MAX, this.state.visualResponse.motionSpeed)
    );

    this.state.visualResponse.pulseFrequency = Math.max(
      this.PULSE_MIN,
      Math.min(this.PULSE_MAX, this.state.visualResponse.pulseFrequency)
    );

    this.state.visualResponse.colorShift = Math.max(
      -30,
      Math.min(30, this.state.visualResponse.colorShift)
    );
  }

  // ============================================
  // HOLO-LINES
  // ============================================

  private spawnHoloLine(
    interactionType: InteractionPattern['type'],
    intensity: number
  ): void {
    if (this.state.holoLines.length >= this.MAX_HOLO_LINES) {
      // Remove oldest line
      this.state.holoLines.shift();
    }

    const now = Date.now();

    // Determine line type based on interaction
    let lineType: HoloLine['type'] = 'response';
    if (this.state.detection.hesitationLevel > 50) lineType = 'hesitation';
    else if (intensity > 70) lineType = 'intensity';
    else if (this.state.detection.interactionType === 'idle') lineType = 'idle';

    // Random position for variety
    const startX = Math.random() * 100; // percentage
    const startY = Math.random() * 100;
    const endX = Math.random() * 100;
    const endY = Math.random() * 100;

    const line: HoloLine = {
      id: `holo-${now}-${Math.random()}`,
      startX,
      startY,
      endX,
      endY,
      progress: 0,
      intensity,
      hue: this.getLineHue(lineType),
      type: lineType,
      lifetime: this.LINE_LIFETIME,
      createdAt: now,
    };

    this.state.holoLines.push(line);
  }

  private getLineHue(type: HoloLine['type']): number {
    if (!this.expression) return 210;

    const baseHue = this.getMoodHue(this.expression.mood.currentTone);

    switch (type) {
      case 'response':
        return baseHue;
      case 'hesitation':
        return (baseHue + 180) % 360; // Complementary color
      case 'intensity':
        return (baseHue + 30) % 360; // Warmer shift
      case 'idle':
        return (baseHue - 30 + 360) % 360; // Cooler shift
      default:
        return baseHue;
    }
  }

  private updateHoloLines(): void {
    const now = Date.now();

    // Update existing lines
    this.state.holoLines = this.state.holoLines
      .filter(line => now - line.createdAt < line.lifetime)
      .map(line => {
        const age = now - line.createdAt;
        const progress = age / line.lifetime;

        return {
          ...line,
          progress,
          intensity: line.intensity * (1 - progress), // Fade out
        };
      });
  }

  // ============================================
  // RESONANCE CALCULATION
  // ============================================

  private calculateResonanceIntensity(): void {
    const { speed, intensity, hesitationLevel } = this.state.detection;
    const { glowIntensity, motionSpeed, pulseFrequency } = this.state.visualResponse;

    // Combine multiple factors
    const activityScore = (speed + intensity) / 2;
    const visualScore = (glowIntensity + motionSpeed * 30 + pulseFrequency * 20) / 3;
    const holoLineScore = (this.state.holoLines.length / this.MAX_HOLO_LINES) * 100;

    // Hesitation reduces resonance
    const hesitationPenalty = hesitationLevel * 0.3;

    this.state.resonanceIntensity = Math.max(
      0,
      Math.min(
        100,
        (activityScore * 0.4 + visualScore * 0.4 + holoLineScore * 0.2) - hesitationPenalty
      )
    );
  }

  // ============================================
  // GETTERS
  // ============================================

  private getMoodHue(tone: string): number {
    switch (tone) {
      case 'warmth': return 30;
      case 'intensity': return 0;
      case 'calm': return 210;
      case 'urgency': return 350;
      case 'presence': return 280;
      default: return 210;
    }
  }

  public getState(): ResonanceState {
    return this.state;
  }

  public getVisualResponse(): VisualResponse {
    return this.state.visualResponse;
  }

  public getHoloLines(): HoloLine[] {
    return this.state.holoLines;
  }

  public getResonanceIntensity(): number {
    return this.state.resonanceIntensity;
  }

  public getInteractionType(): InteractionDetection['interactionType'] {
    return this.state.detection.interactionType;
  }

  // ============================================
  // STORAGE
  // ============================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Only save detection metrics, not transient visuals
      const dataToSave = {
        detection: {
          interactionType: this.state.detection.interactionType,
          speed: this.state.detection.speed,
          intensity: this.state.detection.intensity,
        },
        resonanceIntensity: this.state.resonanceIntensity,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[EmotionalResonance] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.detection) {
        this.state.detection.interactionType = data.detection.interactionType || 'idle';
        this.state.detection.speed = data.detection.speed || 0;
        this.state.detection.intensity = data.detection.intensity || 0;
      }

      if (data.resonanceIntensity !== undefined) {
        this.state.resonanceIntensity = data.resonanceIntensity;
      }
    } catch (error) {
      console.error('[EmotionalResonance] Failed to load:', error);
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.saveToStorage();
  }
}
