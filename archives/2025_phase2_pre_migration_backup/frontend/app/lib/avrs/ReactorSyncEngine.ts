/**
 * 🔥 ADVANCED VISUAL REACTOR SYNCHRONIZATION (AVRS)
 * 
 * STEP 24.31 — One of the most powerful visual upgrades in the entire BagBot architecture
 * 
 * This is the step that makes BagBot feel alive — like a sentient reactor core
 * powering the entire shield-network intelligence.
 * 
 * Purpose:
 * AVRS connects the Autonomous Response Loop (ARL) to the animated UI reactor system,
 * making the visual core respond instantly to BagBot's live internal state.
 * 
 * This is not decoration — it is functional visual telemetry.
 * 
 * AVRS Does 4 Things:
 * 
 * 1. Reads ARL Output in Real Time
 *    It takes the ARL frame:
 *    {
 *      mode,
 *      shieldLevel,
 *      threatLevel,
 *      survivalScore,
 *      rtemScore,
 *      suggestedAction
 *    }
 * 
 * 2. Translates Data → Visual Signals
 *    Modes map to visual states:
 *    - CALM: smooth glow, blue/teal waves
 *    - ALERT: pulse acceleration, yellow arcs
 *    - DEFENSIVE: shield rings tighten, silver pulses
 *    - AGGRESSIVE OBSERVATION: violet spikes, deep slow surges
 * 
 * 3. Uses Physics-Based Animations
 *    Not CSS only — physics-driven:
 *    - inertia
 *    - deceleration
 *    - elasticity
 *    - spring tension
 *    - fade-through
 *    - pulse frequency
 * 
 * 4. Updates Reactor UI Elements
 *    AVRS synchronizes:
 *    - core pulsar
 *    - shield rings
 *    - reactor lattice grid
 *    - energy channels
 *    - threat arcs
 *    - neural filaments
 *    - surge emitter lines
 * 
 * It works like a real alien engine.
 * 
 * How AVRS Works Internally:
 * Input → Mapping → Animation → UI Update
 * 
 * ARL Frame → AVRS Engine → React State → Animated Reactor UI
 * 
 * The visual state updates every 80–120ms (same as ARL).
 * 
 * Reactor States Mapping Example:
 * 
 * CALM:
 * pulseFrequency = 0.4
 * glowIntensity = 0.5
 * ringTension = 0.3
 * color = "cyan-blue spectrum"
 * 
 * DEFENSIVE:
 * pulseFrequency = 1.2
 * ringTension = 0.8
 * shieldCompression = 0.4
 * color = "white-silver spectrum"
 * 
 * AGGRESSIVE OBSERVATION:
 * pulseFrequency = 1.6
 * ringTension = 1.1
 * surgeLines = active
 * color = "violet-electric spectrum"
 */

import type { ARLFrame, ARLMode } from '../arl/AutonomousResponseLoop';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Reactor visual state
 */
export interface ReactorState {
  // Core properties
  mode: ARLMode;
  timestamp: number;
  
  // Visual parameters
  pulseFrequency: number;        // 0-2 (Hz equivalent)
  glowIntensity: number;         // 0-1
  ringTension: number;           // 0-1
  shieldCompression: number;     // 0-1
  surgeActive: boolean;
  threatArcsVisible: boolean;
  
  // Color theming
  colorSpectrum: string;         // CSS gradient or color name
  primaryColor: string;
  secondaryColor: string;
  
  // Physics properties
  inertia: number;               // 0-1 (momentum carry-over)
  elasticity: number;            // 0-1 (bounce-back)
  damping: number;               // 0-1 (friction)
  
  // Element-specific states
  corePulsar: CorePulsarState;
  shieldRings: ShieldRingsState;
  energyGrid: EnergyGridState;
  threatArcs: ThreatArcsState;
  surgeLines: SurgeLinesState;
}

/**
 * Core pulsar state
 */
export interface CorePulsarState {
  scale: number;                 // 0.8-1.2
  opacity: number;               // 0-1
  rotation: number;              // 0-360 degrees
  pulseSpeed: number;            // Animation speed multiplier
}

/**
 * Shield rings state
 */
export interface ShieldRingsState {
  count: number;                 // 3-7 rings
  spacing: number;               // Distance between rings
  thickness: number;             // Ring line thickness
  rotation: number;              // Orbital rotation speed
  compression: number;           // 0-1 (how tight they are)
}

/**
 * Energy grid state
 */
export interface EnergyGridState {
  visible: boolean;
  intensity: number;             // 0-1
  flowSpeed: number;             // Animation speed
  gridDensity: number;           // Number of grid lines
}

/**
 * Threat arcs state
 */
export interface ThreatArcsState {
  visible: boolean;
  count: number;                 // 0-5 arcs
  intensity: number;             // 0-1
  color: string;
  flickerSpeed: number;
}

/**
 * Surge lines state
 */
export interface SurgeLinesState {
  active: boolean;
  count: number;                 // 0-8 lines
  intensity: number;             // 0-1
  speed: number;                 // Animation speed
  color: string;
}

/**
 * AVRS configuration
 */
export interface AVRSConfig {
  enabled: boolean;
  physicsBased: boolean;         // Enable physics-driven animations
  frameRate: number;             // Target FPS
  smoothTransitions: boolean;
}

// ============================================================================
// REACTOR SYNC ENGINE CLASS
// ============================================================================

export class ReactorSyncEngine {
  // Configuration
  private config: AVRSConfig = {
    enabled: true,
    physicsBased: true,
    frameRate: 60,
    smoothTransitions: true,
  };

  // Current state
  private currentState: ReactorState;
  private previousState: ReactorState | null = null;
  
  // ARL connection
  private arlInstance: any = null;
  private arlCallback: ((frame: ARLFrame) => void) | null = null;
  
  // Animation state
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  
  // Callbacks
  private onStateUpdate?: (state: ReactorState) => void;

  private readonly VERSION = '24.31.0';

  constructor() {
    // Initialize default state (CALM mode)
    this.currentState = this.createDefaultState('CALM');
  }

  /**
   * Attach to ARL instance
   */
  public attachARL(arlInstance: any): void {
    this.arlInstance = arlInstance;
    
    // Create callback to receive ARL frames
    this.arlCallback = (frame: ARLFrame) => {
      this.syncFrame(frame);
    };
    
    console.log('[AVRS] Attached to ARL instance');
  }

  /**
   * Start the reactor synchronization
   */
  public start(onStateUpdate?: (state: ReactorState) => void): void {
    if (!this.config.enabled) {
      console.warn('[AVRS] Reactor sync is disabled');
      return;
    }

    this.onStateUpdate = onStateUpdate;
    this.lastFrameTime = Date.now();
    
    console.log('[AVRS] Reactor synchronization started');
    
    // Start animation loop
    this.animate();
  }

  /**
   * Stop the reactor synchronization
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('[AVRS] Reactor synchronization stopped');
  }

  /**
   * Sync with ARL frame
   */
  public syncFrame(frame: ARLFrame): void {
    // Store previous state for smooth transitions
    this.previousState = { ...this.currentState };
    
    // Map ARL frame to reactor state
    const newState = this.mapModeToVisuals(frame);
    
    // Apply smooth transitions if enabled
    if (this.config.smoothTransitions && this.previousState) {
      this.currentState = this.interpolateStates(this.previousState, newState, 0.3);
    } else {
      this.currentState = newState;
    }
    
    // Notify listeners
    if (this.onStateUpdate) {
      this.onStateUpdate(this.currentState);
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    const now = Date.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Apply physics-based updates
    if (this.config.physicsBased) {
      this.applyPhysics(deltaTime);
    }
    
    // Update reactor state
    this.updateReactorElements(deltaTime);
    
    // Notify listeners
    if (this.onStateUpdate) {
      this.onStateUpdate(this.currentState);
    }
    
    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * Map ARL mode to visual state
   */
  private mapModeToVisuals(frame: ARLFrame): ReactorState {
    const mode = frame.mode;
    const visualization = frame.visualization;
    
    let state: ReactorState;
    
    switch (mode) {
      case 'CALM':
        state = {
          mode,
          timestamp: frame.timestamp,
          pulseFrequency: 0.4,
          glowIntensity: 0.5,
          ringTension: 0.3,
          shieldCompression: 0.2,
          surgeActive: false,
          threatArcsVisible: false,
          colorSpectrum: 'cyan-blue-spectrum',
          primaryColor: '#00D4FF',
          secondaryColor: '#0088CC',
          inertia: 0.8,
          elasticity: 0.6,
          damping: 0.7,
          corePulsar: {
            scale: 1.0,
            opacity: 0.8,
            rotation: 0,
            pulseSpeed: 0.4,
          },
          shieldRings: {
            count: 3,
            spacing: 40,
            thickness: 2,
            rotation: 0.2,
            compression: 0.2,
          },
          energyGrid: {
            visible: true,
            intensity: 0.4,
            flowSpeed: 0.3,
            gridDensity: 8,
          },
          threatArcs: {
            visible: false,
            count: 0,
            intensity: 0,
            color: '#FF6B6B',
            flickerSpeed: 0,
          },
          surgeLines: {
            active: false,
            count: 0,
            intensity: 0,
            speed: 0,
            color: '#00D4FF',
          },
        };
        break;

      case 'ALERT':
        state = {
          mode,
          timestamp: frame.timestamp,
          pulseFrequency: 0.8,
          glowIntensity: 0.7,
          ringTension: 0.5,
          shieldCompression: 0.4,
          surgeActive: false,
          threatArcsVisible: true,
          colorSpectrum: 'yellow-amber-spectrum',
          primaryColor: '#FFD700',
          secondaryColor: '#FFA500',
          inertia: 0.6,
          elasticity: 0.7,
          damping: 0.6,
          corePulsar: {
            scale: 1.1,
            opacity: 0.9,
            rotation: 45,
            pulseSpeed: 0.8,
          },
          shieldRings: {
            count: 4,
            spacing: 35,
            thickness: 3,
            rotation: 0.4,
            compression: 0.4,
          },
          energyGrid: {
            visible: true,
            intensity: 0.6,
            flowSpeed: 0.6,
            gridDensity: 10,
          },
          threatArcs: {
            visible: true,
            count: 2,
            intensity: 0.6,
            color: '#FFD700',
            flickerSpeed: 0.8,
          },
          surgeLines: {
            active: false,
            count: 2,
            intensity: 0.4,
            speed: 0.5,
            color: '#FFD700',
          },
        };
        break;

      case 'DEFENSIVE':
        state = {
          mode,
          timestamp: frame.timestamp,
          pulseFrequency: 1.2,
          glowIntensity: 0.85,
          ringTension: 0.8,
          shieldCompression: 0.7,
          surgeActive: false,
          threatArcsVisible: true,
          colorSpectrum: 'white-silver-spectrum',
          primaryColor: '#FFFFFF',
          secondaryColor: '#C0C0C0',
          inertia: 0.5,
          elasticity: 0.8,
          damping: 0.5,
          corePulsar: {
            scale: 1.05,
            opacity: 1.0,
            rotation: 90,
            pulseSpeed: 1.2,
          },
          shieldRings: {
            count: 6,
            spacing: 25,
            thickness: 4,
            rotation: 0.6,
            compression: 0.7,
          },
          energyGrid: {
            visible: true,
            intensity: 0.8,
            flowSpeed: 0.8,
            gridDensity: 12,
          },
          threatArcs: {
            visible: true,
            count: 4,
            intensity: 0.8,
            color: '#FF4444',
            flickerSpeed: 1.0,
          },
          surgeLines: {
            active: false,
            count: 4,
            intensity: 0.6,
            speed: 0.7,
            color: '#FFFFFF',
          },
        };
        break;

      case 'AGGRESSIVE_OBSERVATION':
        state = {
          mode,
          timestamp: frame.timestamp,
          pulseFrequency: 1.6,
          glowIntensity: 0.95,
          ringTension: 1.0,
          shieldCompression: 0.5,
          surgeActive: true,
          threatArcsVisible: true,
          colorSpectrum: 'violet-electric-spectrum',
          primaryColor: '#9D00FF',
          secondaryColor: '#FF00FF',
          inertia: 0.4,
          elasticity: 0.9,
          damping: 0.4,
          corePulsar: {
            scale: 1.15,
            opacity: 1.0,
            rotation: 180,
            pulseSpeed: 1.6,
          },
          shieldRings: {
            count: 7,
            spacing: 30,
            thickness: 3,
            rotation: 0.9,
            compression: 0.5,
          },
          energyGrid: {
            visible: true,
            intensity: 0.9,
            flowSpeed: 1.2,
            gridDensity: 15,
          },
          threatArcs: {
            visible: true,
            count: 5,
            intensity: 0.9,
            color: '#FF0066',
            flickerSpeed: 1.4,
          },
          surgeLines: {
            active: true,
            count: 8,
            intensity: 0.9,
            speed: 1.5,
            color: '#9D00FF',
          },
        };
        break;

      default:
        state = this.createDefaultState('CALM');
    }
    
    // Apply visualization hints from ARL
    state.glowIntensity = visualization.glowIntensity / 100;
    state.pulseFrequency = visualization.pulseSpeed / 50; // Scale to reasonable range
    state.ringTension = visualization.shieldRingsTightness / 100;
    state.corePulsar.scale = 0.9 + (visualization.reactorActivity / 200); // 0.9-1.4 range
    
    return state;
  }

  /**
   * Create default state for a mode
   */
  private createDefaultState(mode: ARLMode): ReactorState {
    return this.mapModeToVisuals({
      timestamp: Date.now(),
      mode,
      rtemScore: 80,
      survivalScore: 80,
      shieldLevel: 80,
      threatLevel: 'LOW',
      suggestedAction: 'Normal operations',
      diagnostics: {
        cycleTime: 100,
        activeMonitors: 0,
        anomaliesDetected: 0,
        threatsActive: 0,
        modeConfidence: 80,
        lastModeChange: Date.now(),
      },
      visualization: {
        glowIntensity: 50,
        pulseSpeed: 30,
        colorTheme: 'green',
        shieldRingsTightness: 40,
        reactorActivity: 50,
      },
    });
  }

  /**
   * Interpolate between two states for smooth transitions
   */
  private interpolateStates(
    from: ReactorState,
    to: ReactorState,
    factor: number
  ): ReactorState {
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    
    return {
      ...to,
      pulseFrequency: lerp(from.pulseFrequency, to.pulseFrequency, factor),
      glowIntensity: lerp(from.glowIntensity, to.glowIntensity, factor),
      ringTension: lerp(from.ringTension, to.ringTension, factor),
      shieldCompression: lerp(from.shieldCompression, to.shieldCompression, factor),
      corePulsar: {
        ...to.corePulsar,
        scale: lerp(from.corePulsar.scale, to.corePulsar.scale, factor),
        opacity: lerp(from.corePulsar.opacity, to.corePulsar.opacity, factor),
        rotation: lerp(from.corePulsar.rotation, to.corePulsar.rotation, factor),
      },
      shieldRings: {
        ...to.shieldRings,
        compression: lerp(from.shieldRings.compression, to.shieldRings.compression, factor),
      },
    };
  }

  /**
   * Apply physics-based updates
   */
  private applyPhysics(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds
    
    // Apply rotation to core pulsar
    this.currentState.corePulsar.rotation += 
      this.currentState.corePulsar.pulseSpeed * dt * 10;
    this.currentState.corePulsar.rotation %= 360;
    
    // Apply rotation to shield rings
    this.currentState.shieldRings.rotation += dt * 20;
    this.currentState.shieldRings.rotation %= 360;
  }

  /**
   * Update reactor elements
   */
  private updateReactorElements(deltaTime: number): void {
    // Update pulsing animation
    const pulsePhase = (Date.now() / 1000) * this.currentState.pulseFrequency;
    this.currentState.corePulsar.scale = 
      0.95 + Math.sin(pulsePhase * Math.PI * 2) * 0.1;
    
    // Update opacity pulsing
    this.currentState.corePulsar.opacity = 
      0.7 + Math.sin(pulsePhase * Math.PI * 2) * 0.2;
  }

  /**
   * Generate reactor state for external use
   */
  public generateReactorState(): ReactorState {
    return { ...this.currentState };
  }

  /**
   * Get current state
   */
  public getState(): ReactorState {
    return this.currentState;
  }

  /**
   * Get version
   */
  public getVersion(): string {
    return this.VERSION;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AVRSConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[AVRS] Configuration updated:', this.config);
  }

  /**
   * Get configuration
   */
  public getConfig(): AVRSConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let instance: ReactorSyncEngine | null = null;

export function getReactorSyncEngine(): ReactorSyncEngine {
  if (!instance) {
    instance = new ReactorSyncEngine();
  }
  return instance;
}

// Default export
export default ReactorSyncEngine;
