/**
 * 🔷 LEVEL 8.6 — PRESENCE EFFECT V2
 * 
 * This is the LEVEL 8 signature upgrade:
 * 
 * - When the bot "looks at you", the holographic grid slightly tilts toward your pointer.
 * - When you speak or type, the light-grid ripples outward.
 * 
 * This is the deepest realism Layer 8 creates.
 */

import { GenomeSnapshot } from '../entity/BehaviorGenome';
import { ExpressionOutput } from '../entity/ExpressionCore';

// ============================================
// TYPES
// ============================================

export interface PresenceEffectState {
  gridTilt: GridTilt;
  lightRipple: LightRipple;
  gazeTracking: GazeTracking;
  presenceIntensity: number; // 0-100 (how present the bot feels)
}

export interface GridTilt {
  targetAngleX: number; // -15 to +15 degrees
  targetAngleY: number; // -15 to +15 degrees
  currentAngleX: number;
  currentAngleY: number;
  tiltSpeed: number; // 0-1 (how fast it tilts)
  maxTilt: number; // degrees
  enabled: boolean;
  smoothing: number; // 0-1 (how smooth the transition)
}

export interface LightRipple {
  waves: RippleWave[];
  originX: number; // percentage
  originY: number;
  enabled: boolean;
  autoTrigger: boolean; // Trigger on user activity
}

export interface RippleWave {
  id: string;
  centerX: number; // percentage
  centerY: number;
  radius: number; // current radius
  maxRadius: number;
  intensity: number; // 0-100
  speed: number; // expansion speed
  createdAt: number;
  lifetime: number; // ms
  triggerType: 'speech' | 'typing' | 'click' | 'hover' | 'system';
}

export interface GazeTracking {
  isLookingAtUser: boolean;
  lookTarget: { x: number; y: number } | null; // screen coordinates
  lookIntensity: number; // 0-100
  lastLookChange: number; // timestamp
  gazeHistory: Array<{
    target: { x: number; y: number };
    timestamp: number;
    duration: number;
  }>;
}

// ============================================
// PRESENCE EFFECT V2
// ============================================

export class PresenceEffectV2 {
  private state: PresenceEffectState;
  private genome: GenomeSnapshot | null = null;
  private expression: ExpressionOutput | null = null;
  private readonly STORAGE_KEY = 'bagbot_presence_effect_v2';

  // Grid tilt configuration
  private readonly MAX_TILT_ANGLE = 15; // degrees
  private readonly TILT_DEAD_ZONE = 10; // percentage from center
  private readonly TILT_SMOOTHING = 0.12; // lerp factor

  // Ripple configuration
  private readonly MAX_RIPPLES = 8;
  private readonly RIPPLE_LIFETIME = 2000; // ms
  private readonly RIPPLE_MAX_RADIUS = 80; // percentage

  // Gaze configuration
  private readonly GAZE_UPDATE_INTERVAL = 150; // ms
  private lastGazeUpdate = 0;

  // Activity tracking
  private lastSpeech = 0;
  private lastTyping = 0;
  private lastClick = 0;

  constructor() {
    this.state = this.getDefaultState();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getDefaultState(): PresenceEffectState {
    return {
      gridTilt: {
        targetAngleX: 0,
        targetAngleY: 0,
        currentAngleX: 0,
        currentAngleY: 0,
        tiltSpeed: 0.6,
        maxTilt: this.MAX_TILT_ANGLE,
        enabled: true,
        smoothing: this.TILT_SMOOTHING,
      },
      lightRipple: {
        waves: [],
        originX: 50,
        originY: 50,
        enabled: true,
        autoTrigger: true,
      },
      gazeTracking: {
        isLookingAtUser: false,
        lookTarget: null,
        lookIntensity: 0,
        lastLookChange: Date.now(),
        gazeHistory: [],
      },
      presenceIntensity: 0,
    };
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  public update(
    genome: GenomeSnapshot,
    expression: ExpressionOutput,
    userInput: {
      cursorPosition: { x: number; y: number }; // percentage
      screenCenter: { x: number; y: number };
      isInteracting: boolean;
    }
  ): PresenceEffectState {
    this.genome = genome;
    this.expression = expression;

    const now = Date.now();

    // Update gaze tracking
    if (now - this.lastGazeUpdate > this.GAZE_UPDATE_INTERVAL) {
      this.updateGazeTracking(userInput);
      this.lastGazeUpdate = now;
    }

    // Update grid tilt based on cursor position
    if (this.state.gridTilt.enabled) {
      this.updateGridTilt(userInput.cursorPosition);
    }

    // Update ripple waves
    this.updateRipples();

    // Calculate overall presence intensity
    this.calculatePresenceIntensity();

    this.saveToStorage();
    return this.state;
  }

  // ============================================
  // GAZE TRACKING
  // ============================================

  private updateGazeTracking(userInput: {
    cursorPosition: { x: number; y: number };
    screenCenter: { x: number; y: number };
    isInteracting: boolean;
  }): void {
    if (!this.genome || !this.expression) return;

    const { parameters } = this.genome;
    const now = Date.now();

    // Determine if bot should "look at" user
    // More likely when:
    // - User is interacting
    // - High presence intensity
    // - High emotional elasticity (more attentive)

    const interactionBoost = userInput.isInteracting ? 40 : 0;
    const presenceBoost = parameters.ambientPulse * 0.5;
    const elasticityBoost = parameters.emotionalElasticity * 0.3;

    const lookProbability = (interactionBoost + presenceBoost + elasticityBoost) / 100;

    // Random chance to change gaze state
    if (Math.random() < 0.1) { // 10% chance per update
      const shouldLook = Math.random() < lookProbability;

      if (shouldLook !== this.state.gazeTracking.isLookingAtUser) {
        // State change
        if (this.state.gazeTracking.isLookingAtUser && this.state.gazeTracking.lookTarget) {
          // Record gaze history
          const duration = now - this.state.gazeTracking.lastLookChange;
          this.state.gazeTracking.gazeHistory.push({
            target: this.state.gazeTracking.lookTarget,
            timestamp: this.state.gazeTracking.lastLookChange,
            duration,
          });

          // Keep only recent history
          if (this.state.gazeTracking.gazeHistory.length > 20) {
            this.state.gazeTracking.gazeHistory.shift();
          }
        }

        this.state.gazeTracking.isLookingAtUser = shouldLook;
        this.state.gazeTracking.lastLookChange = now;
      }
    }

    // Update look target and intensity
    if (this.state.gazeTracking.isLookingAtUser) {
      // Look at cursor with some offset for naturalness
      const offsetX = (Math.random() - 0.5) * 5; // ±2.5%
      const offsetY = (Math.random() - 0.5) * 5;

      this.state.gazeTracking.lookTarget = {
        x: userInput.cursorPosition.x + offsetX,
        y: userInput.cursorPosition.y + offsetY,
      };

      // Increase intensity gradually
      this.state.gazeTracking.lookIntensity = Math.min(
        100,
        this.state.gazeTracking.lookIntensity + 5
      );
    } else {
      // Look at center or random point
      if (Math.random() < 0.7) {
        // 70% chance to look at center
        this.state.gazeTracking.lookTarget = userInput.screenCenter;
      } else {
        // 30% chance to look elsewhere
        this.state.gazeTracking.lookTarget = {
          x: 30 + Math.random() * 40,
          y: 30 + Math.random() * 40,
        };
      }

      // Decrease intensity gradually
      this.state.gazeTracking.lookIntensity = Math.max(
        0,
        this.state.gazeTracking.lookIntensity - 3
      );
    }
  }

  public getIsLookingAtUser(): boolean {
    return this.state.gazeTracking.isLookingAtUser;
  }

  public getLookIntensity(): number {
    return this.state.gazeTracking.lookIntensity;
  }

  // ============================================
  // GRID TILT
  // ============================================

  private updateGridTilt(cursorPosition: { x: number; y: number }): void {
    if (!this.genome) return;

    const { parameters } = this.genome;

    // Calculate distance from center (50, 50)
    const dx = cursorPosition.x - 50;
    const dy = cursorPosition.y - 50;

    // Apply dead zone
    const effectiveDx = Math.abs(dx) > this.TILT_DEAD_ZONE ? dx : 0;
    const effectiveDy = Math.abs(dy) > this.TILT_DEAD_ZONE ? dy : 0;

    // Calculate target angles
    // X angle tilts side-to-side based on horizontal cursor position
    // Y angle tilts up-down based on vertical cursor position
    const maxTilt = this.state.gridTilt.maxTilt;

    this.state.gridTilt.targetAngleX = (effectiveDy / 50) * maxTilt; // Up/down
    this.state.gridTilt.targetAngleY = (effectiveDx / 50) * maxTilt; // Left/right

    // Apply personality-based modulation
    const responsiveness = parameters.responsivenessSpeed / 100;
    const tiltMultiplier = 0.5 + responsiveness * 0.5;

    this.state.gridTilt.targetAngleX *= tiltMultiplier;
    this.state.gridTilt.targetAngleY *= tiltMultiplier;

    // Smooth transition (lerp)
    const smoothing = this.state.gridTilt.smoothing;
    this.state.gridTilt.currentAngleX += (
      this.state.gridTilt.targetAngleX - this.state.gridTilt.currentAngleX
    ) * smoothing;

    this.state.gridTilt.currentAngleY += (
      this.state.gridTilt.targetAngleY - this.state.gridTilt.currentAngleY
    ) * smoothing;
  }

  public getGridTilt(): { angleX: number; angleY: number } {
    return {
      angleX: this.state.gridTilt.currentAngleX,
      angleY: this.state.gridTilt.currentAngleY,
    };
  }

  // ============================================
  // LIGHT RIPPLES
  // ============================================

  public triggerRipple(
    triggerType: RippleWave['triggerType'],
    position?: { x: number; y: number }
  ): void {
    if (!this.state.lightRipple.enabled) return;
    if (!this.genome || !this.expression) return;

    // Clean up old ripples
    if (this.state.lightRipple.waves.length >= this.MAX_RIPPLES) {
      this.state.lightRipple.waves.shift();
    }

    const { parameters } = this.genome;

    // Use provided position or default origin
    const centerX = position?.x ?? this.state.lightRipple.originX;
    const centerY = position?.y ?? this.state.lightRipple.originY;

    // Calculate properties based on trigger type and personality
    const baseSpeed = 0.5 + parameters.responsivenessSpeed * 0.01;
    let speed = baseSpeed;
    let intensity = 50;
    let maxRadius = this.RIPPLE_MAX_RADIUS;

    switch (triggerType) {
      case 'speech':
        speed = baseSpeed * 1.8;
        intensity = 80 + Math.random() * 15;
        maxRadius = this.RIPPLE_MAX_RADIUS * 1.2;
        this.lastSpeech = Date.now();
        break;
      case 'typing':
        speed = baseSpeed * 1.2;
        intensity = 60 + Math.random() * 20;
        maxRadius = this.RIPPLE_MAX_RADIUS * 0.8;
        this.lastTyping = Date.now();
        break;
      case 'click':
        speed = baseSpeed * 1.5;
        intensity = 70 + Math.random() * 20;
        maxRadius = this.RIPPLE_MAX_RADIUS;
        this.lastClick = Date.now();
        break;
      case 'hover':
        speed = baseSpeed * 0.8;
        intensity = 40 + Math.random() * 15;
        maxRadius = this.RIPPLE_MAX_RADIUS * 0.6;
        break;
      case 'system':
        speed = baseSpeed;
        intensity = 55 + Math.random() * 15;
        maxRadius = this.RIPPLE_MAX_RADIUS;
        break;
    }

    const wave: RippleWave = {
      id: `ripple-${Date.now()}-${Math.random()}`,
      centerX,
      centerY,
      radius: 0,
      maxRadius,
      intensity,
      speed,
      createdAt: Date.now(),
      lifetime: this.RIPPLE_LIFETIME,
      triggerType,
    };

    this.state.lightRipple.waves.push(wave);
  }

  private updateRipples(): void {
    const now = Date.now();

    this.state.lightRipple.waves = this.state.lightRipple.waves
      .filter(wave => now - wave.createdAt < wave.lifetime)
      .map(wave => {
        // Expand wave
        wave.radius += wave.speed;

        // Fade intensity as it expands
        const expansionRatio = wave.radius / wave.maxRadius;
        const baseFade = 1 - expansionRatio;
        const timeFade = 1 - ((now - wave.createdAt) / wave.lifetime);

        wave.intensity = wave.intensity * Math.min(baseFade, timeFade);

        return wave;
      });
  }

  public getRippleWaves(): RippleWave[] {
    return this.state.lightRipple.waves;
  }

  // ============================================
  // AUTO-TRIGGER RIPPLES
  // ============================================

  public trackUserActivity(activityType: 'speech' | 'typing' | 'click' | 'hover'): void {
    if (!this.state.lightRipple.autoTrigger) return;

    // Trigger ripple at current origin or random position
    const shouldRandomize = activityType === 'speech' || activityType === 'typing';

    const position = shouldRandomize ? {
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
    } : undefined;

    this.triggerRipple(activityType, position);
  }

  // ============================================
  // PRESENCE INTENSITY
  // ============================================

  private calculatePresenceIntensity(): void {
    if (!this.genome) return;

    const { parameters } = this.genome;
    const now = Date.now();

    // Factor 1: Gaze intensity
    const gazeContribution = this.state.gazeTracking.lookIntensity * 0.4;

    // Factor 2: Grid tilt (active tilt = more present)
    const tiltAmount = Math.sqrt(
      this.state.gridTilt.currentAngleX ** 2 +
      this.state.gridTilt.currentAngleY ** 2
    );
    const tiltContribution = Math.min(100, (tiltAmount / this.MAX_TILT_ANGLE) * 100) * 0.3;

    // Factor 3: Active ripples
    const rippleContribution = (this.state.lightRipple.waves.length / this.MAX_RIPPLES) * 100 * 0.3;

    // Combine
    this.state.presenceIntensity = Math.min(
      100,
      gazeContribution + tiltContribution + rippleContribution
    );

    // Boost from baseline ambient pulse parameter
    const baselineBoost = parameters.ambientPulse * 0.2;
    this.state.presenceIntensity = Math.min(
      100,
      this.state.presenceIntensity + baselineBoost
    );
  }

  // ============================================
  // GETTERS & SETTERS
  // ============================================

  public getState(): PresenceEffectState {
    return this.state;
  }

  public getPresenceIntensity(): number {
    return this.state.presenceIntensity;
  }

  public setGridTiltEnabled(enabled: boolean): void {
    this.state.gridTilt.enabled = enabled;
    this.saveToStorage();
  }

  public setRippleEnabled(enabled: boolean): void {
    this.state.lightRipple.enabled = enabled;
    this.saveToStorage();
  }

  public setAutoTrigger(enabled: boolean): void {
    this.state.lightRipple.autoTrigger = enabled;
    this.saveToStorage();
  }

  public setMaxTilt(degrees: number): void {
    this.state.gridTilt.maxTilt = Math.max(0, Math.min(30, degrees));
    this.saveToStorage();
  }

  // ============================================
  // STORAGE
  // ============================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const dataToSave = {
        gridTilt: {
          enabled: this.state.gridTilt.enabled,
          maxTilt: this.state.gridTilt.maxTilt,
          tiltSpeed: this.state.gridTilt.tiltSpeed,
          smoothing: this.state.gridTilt.smoothing,
        },
        lightRipple: {
          enabled: this.state.lightRipple.enabled,
          autoTrigger: this.state.lightRipple.autoTrigger,
          originX: this.state.lightRipple.originX,
          originY: this.state.lightRipple.originY,
        },
        presenceIntensity: this.state.presenceIntensity,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[PresenceEffectV2] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.gridTilt) {
        this.state.gridTilt = { ...this.state.gridTilt, ...data.gridTilt };
      }

      if (data.lightRipple) {
        this.state.lightRipple = { ...this.state.lightRipple, ...data.lightRipple };
      }

      if (data.presenceIntensity !== undefined) {
        this.state.presenceIntensity = data.presenceIntensity;
      }
    } catch (error) {
      console.error('[PresenceEffectV2] Failed to load:', error);
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.saveToStorage();
  }
}
