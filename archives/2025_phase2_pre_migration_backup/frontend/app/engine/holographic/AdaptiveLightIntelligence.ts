/**
 * 🔷 LEVEL 8.5 — ADAPTIVE LIGHT INTELLIGENCE (ALI)
 * 
 * You now get:
 * - Multi-layer glow depth
 * - Movement-based illumination
 * - Shadow-reactive panels
 * - Pulsating nodes during "thinking" moments
 * 
 * ALI makes the system visually intelligent.
 */

import { GenomeSnapshot } from '../entity/BehaviorGenome';
import { ExpressionOutput } from '../entity/ExpressionCore';

// ============================================
// TYPES
// ============================================

export interface ALIState {
  glowLayers: GlowLayer[];
  illumination: IlluminationMap;
  shadowReactivity: ShadowReactivity;
  thinkingNodes: ThinkingNode[];
  intelligenceLevel: number; // 0-100
}

export interface GlowLayer {
  id: string;
  depth: number; // 1-5 (1=deepest, 5=surface)
  intensity: number; // 0-100
  radius: number; // pixels
  color: { h: number; s: number; l: number };
  blendMode: 'normal' | 'screen' | 'overlay' | 'multiply';
  animated: boolean;
  pulseSpeed: number; // Hz
}

export interface IlluminationMap {
  zones: IlluminationZone[];
  globalBrightness: number; // 0-100
  adaptiveMode: boolean;
  movementTracking: boolean;
}

export interface IlluminationZone {
  id: string;
  x: number; // percentage
  y: number;
  radius: number; // percentage
  brightness: number; // 0-100
  hue: number; // 0-360
  movementInfluence: number; // 0-1
  lastMovement: number; // timestamp
}

export interface ShadowReactivity {
  enabled: boolean;
  shadowIntensity: number; // 0-100
  panels: Map<string, PanelShadow>; // panel ID → shadow state
  globalShadowColor: { h: number; s: number; l: number };
}

export interface PanelShadow {
  panelId: string;
  offsetX: number; // pixels
  offsetY: number;
  blur: number; // pixels
  spread: number; // pixels
  opacity: number; // 0-1
  reactive: boolean; // responds to movement
}

export interface ThinkingNode {
  id: string;
  x: number; // percentage
  y: number;
  pulsePhase: number; // 0-1 (animation cycle)
  pulseSpeed: number; // Hz
  intensity: number; // 0-100
  size: number; // pixels
  hue: number; // 0-360
  thinkingType: 'processing' | 'analyzing' | 'responding' | 'idle';
  createdAt: number;
}

// ============================================
// ADAPTIVE LIGHT INTELLIGENCE
// ============================================

export class AdaptiveLightIntelligence {
  private state: ALIState;
  private genome: GenomeSnapshot | null = null;
  private expression: ExpressionOutput | null = null;
  private readonly STORAGE_KEY = 'bagbot_ali_v1';

  // Layer configuration
  private readonly MAX_LAYERS = 5;
  private readonly MAX_ZONES = 12;
  private readonly MAX_THINKING_NODES = 8;

  // Movement tracking
  private movementHistory: Array<{ x: number; y: number; timestamp: number }> = [];
  private readonly MOVEMENT_WINDOW = 2000; // 2 seconds

  constructor() {
    this.state = this.getDefaultState();
    this.loadFromStorage();
    this.initializeLayers();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getDefaultState(): ALIState {
    return {
      glowLayers: [],
      illumination: {
        zones: [],
        globalBrightness: 60,
        adaptiveMode: true,
        movementTracking: true,
      },
      shadowReactivity: {
        enabled: true,
        shadowIntensity: 40,
        panels: new Map(),
        globalShadowColor: { h: 240, s: 30, l: 20 },
      },
      thinkingNodes: [],
      intelligenceLevel: 50,
    };
  }

  private initializeLayers(): void {
    // Create 5 layers of depth
    for (let depth = 1; depth <= this.MAX_LAYERS; depth++) {
      const layer: GlowLayer = {
        id: `layer-${depth}`,
        depth,
        intensity: 80 - depth * 10, // Deeper = dimmer
        radius: 100 + depth * 30, // Deeper = larger
        color: { h: 210, s: 70, l: 50 + depth * 5 },
        blendMode: depth <= 2 ? 'screen' : 'overlay',
        animated: depth <= 3,
        pulseSpeed: 0.3 + (depth * 0.1),
      };

      this.state.glowLayers.push(layer);
    }

    // Initialize illumination zones
    this.initializeIlluminationZones();
  }

  private initializeIlluminationZones(): void {
    // Create zones in a grid pattern
    const zoneCount = 9; // 3x3 grid
    const cols = 3;
    const rows = 3;

    for (let i = 0; i < zoneCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const zone: IlluminationZone = {
        id: `zone-${i}`,
        x: (col + 0.5) * (100 / cols),
        y: (row + 0.5) * (100 / rows),
        radius: 25,
        brightness: 50,
        hue: 210,
        movementInfluence: 0.7,
        lastMovement: 0,
      };

      this.state.illumination.zones.push(zone);
    }
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  public update(
    genome: GenomeSnapshot,
    expression: ExpressionOutput,
    systemState: {
      isThinking: boolean;
      thinkingType?: 'processing' | 'analyzing' | 'responding';
      cursorPosition: { x: number; y: number };
    }
  ): ALIState {
    this.genome = genome;
    this.expression = expression;

    // Update glow layers based on personality
    this.updateGlowLayers();

    // Track movement and update illumination
    if (this.state.illumination.movementTracking) {
      this.trackMovement(systemState.cursorPosition);
      this.updateIllumination();
    }

    // Update shadow reactivity
    if (this.state.shadowReactivity.enabled) {
      this.updateShadows();
    }

    // Update thinking nodes
    if (systemState.isThinking) {
      this.spawnThinkingNode(systemState.thinkingType || 'processing');
    }
    this.updateThinkingNodes();

    // Calculate intelligence level
    this.calculateIntelligenceLevel();

    this.saveToStorage();
    return this.state;
  }

  // ============================================
  // GLOW LAYERS
  // ============================================

  private updateGlowLayers(): void {
    if (!this.genome || !this.expression) return;

    const { parameters } = this.genome;
    const { mood, microGlow } = this.expression;

    this.state.glowLayers.forEach(layer => {
      // Base intensity from ambient pulse
      const baseIntensity = 50 + parameters.ambientPulse * 0.3;

      // Layer-specific adjustments
      const depthFactor = (this.MAX_LAYERS - layer.depth + 1) / this.MAX_LAYERS;
      layer.intensity = baseIntensity * depthFactor + microGlow.intensity * 0.2;

      // Color from mood
      const moodHue = this.getMoodHue(mood.currentTone);
      layer.color.h = moodHue;
      layer.color.s = 60 + parameters.emotionalElasticity * 0.2;
      layer.color.l = 40 + layer.depth * 5;

      // Pulse speed from ambient rhythm
      layer.pulseSpeed = 0.3 + (parameters.ambientPulse / 100) * 0.5;

      // Radius from visual assertiveness
      layer.radius = 100 + layer.depth * 30 + parameters.visualAssertiveness * 0.5;
    });
  }

  public getGlowLayers(): GlowLayer[] {
    return this.state.glowLayers;
  }

  // ============================================
  // MOVEMENT-BASED ILLUMINATION
  // ============================================

  private trackMovement(position: { x: number; y: number }): void {
    const now = Date.now();

    this.movementHistory.push({
      x: position.x,
      y: position.y,
      timestamp: now,
    });

    // Clean up old movements
    this.movementHistory = this.movementHistory.filter(
      m => now - m.timestamp < this.MOVEMENT_WINDOW
    );
  }

  private updateIllumination(): void {
    if (!this.genome) return;

    const now = Date.now();
    const { parameters } = this.genome;

    // Update each zone based on recent movement
    this.state.illumination.zones.forEach(zone => {
      // Check for movement near this zone
      const nearbyMovements = this.movementHistory.filter(m => {
        const dx = m.x - zone.x;
        const dy = m.y - zone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < zone.radius;
      });

      if (nearbyMovements.length > 0) {
        // Brighten zone
        const movementStrength = Math.min(1, nearbyMovements.length / 5);
        zone.brightness = Math.min(
          100,
          zone.brightness + movementStrength * zone.movementInfluence * 30
        );
        zone.lastMovement = now;
      } else {
        // Dim zone gradually
        const timeSinceMovement = now - zone.lastMovement;
        if (timeSinceMovement > 500) {
          zone.brightness *= 0.98;
          zone.brightness = Math.max(30, zone.brightness);
        }
      }

      // Hue shifts with responsiveness
      if (nearbyMovements.length > 0) {
        zone.hue = (zone.hue + parameters.responsivenessSpeed * 0.05) % 360;
      }
    });

    // Update global brightness (average of zones)
    const avgBrightness = this.state.illumination.zones.reduce(
      (sum, z) => sum + z.brightness, 0
    ) / this.state.illumination.zones.length;

    this.state.illumination.globalBrightness = avgBrightness;
  }

  public getIlluminationMap(): IlluminationMap {
    return this.state.illumination;
  }

  // ============================================
  // SHADOW REACTIVITY
  // ============================================

  public registerPanel(panelId: string, reactive: boolean = true): void {
    if (!this.genome) return;

    const { parameters } = this.genome;

    const shadow: PanelShadow = {
      panelId,
      offsetX: 0,
      offsetY: 5 + parameters.ambientPulse * 0.1,
      blur: 10 + parameters.visualAssertiveness * 0.2,
      spread: 0,
      opacity: 0.3 + (this.state.shadowReactivity.shadowIntensity / 100) * 0.4,
      reactive,
    };

    this.state.shadowReactivity.panels.set(panelId, shadow);
  }

  public unregisterPanel(panelId: string): void {
    this.state.shadowReactivity.panels.delete(panelId);
  }

  private updateShadows(): void {
    if (!this.genome) return;

    const { parameters } = this.genome;

    // Update global shadow color from mood
    if (this.expression) {
      this.state.shadowReactivity.globalShadowColor.h = 
        this.getMoodHue(this.expression.mood.currentTone);
    }

    // Update each panel shadow
    this.state.shadowReactivity.panels.forEach((shadow, panelId) => {
      if (!shadow.reactive) return;

      // Find nearest movement
      const nearestMovement = this.findNearestMovement(panelId);

      if (nearestMovement) {
        // Offset shadow away from movement
        const distance = nearestMovement.distance;
        if (distance < 50) {
          const strength = 1 - (distance / 50);
          shadow.offsetX = nearestMovement.dx * strength * 5;
          shadow.offsetY = nearestMovement.dy * strength * 5;
          shadow.blur = 10 + strength * 15;
          shadow.opacity = Math.min(0.7, 0.3 + strength * 0.3);
        }
      } else {
        // Reset to default
        shadow.offsetX *= 0.9;
        shadow.offsetY = 5 + parameters.ambientPulse * 0.1;
        shadow.blur = 10 + parameters.visualAssertiveness * 0.2;
        shadow.opacity = 0.3 + (this.state.shadowReactivity.shadowIntensity / 100) * 0.4;
      }
    });
  }

  private findNearestMovement(panelId: string): {
    dx: number;
    dy: number;
    distance: number;
  } | null {
    if (this.movementHistory.length === 0) return null;

    // Assume panel is at center (would need actual panel position)
    const panelX = 50;
    const panelY = 50;

    const recent = this.movementHistory[this.movementHistory.length - 1];
    const dx = recent.x - panelX;
    const dy = recent.y - panelY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return { dx, dy, distance };
  }

  public getPanelShadow(panelId: string): PanelShadow | undefined {
    return this.state.shadowReactivity.panels.get(panelId);
  }

  // ============================================
  // THINKING NODES
  // ============================================

  private spawnThinkingNode(type: ThinkingNode['thinkingType']): void {
    if (this.state.thinkingNodes.length >= this.MAX_THINKING_NODES) {
      // Remove oldest
      this.state.thinkingNodes.shift();
    }

    const node: ThinkingNode = {
      id: `node-${Date.now()}-${Math.random()}`,
      x: 20 + Math.random() * 60, // Center-ish area
      y: 20 + Math.random() * 60,
      pulsePhase: Math.random(),
      pulseSpeed: this.getPulseSpeedForType(type),
      intensity: 70 + Math.random() * 25,
      size: 8 + Math.random() * 12,
      hue: this.getHueForThinkingType(type),
      thinkingType: type,
      createdAt: Date.now(),
    };

    this.state.thinkingNodes.push(node);
  }

  private updateThinkingNodes(): void {
    const now = Date.now();
    const maxAge = 3000; // 3 seconds

    this.state.thinkingNodes = this.state.thinkingNodes
      .filter(node => now - node.createdAt < maxAge)
      .map(node => {
        // Update pulse phase
        const deltaTime = 16; // ~60fps
        node.pulsePhase = (node.pulsePhase + node.pulseSpeed * (deltaTime / 1000)) % 1;

        // Fade out over time
        const age = now - node.createdAt;
        const fadeRatio = 1 - (age / maxAge);
        node.intensity *= (0.98 + fadeRatio * 0.02);

        return node;
      });
  }

  private getPulseSpeedForType(type: ThinkingNode['thinkingType']): number {
    switch (type) {
      case 'processing':
        return 2.0; // Fast pulse
      case 'analyzing':
        return 1.2; // Medium pulse
      case 'responding':
        return 1.8; // Fast-medium pulse
      case 'idle':
      default:
        return 0.5; // Slow pulse
    }
  }

  private getHueForThinkingType(type: ThinkingNode['thinkingType']): number {
    const baseHue = this.expression?.mood ? 
      this.getMoodHue(this.expression.mood.currentTone) : 210;

    switch (type) {
      case 'processing':
        return (baseHue + 30) % 360;
      case 'analyzing':
        return baseHue;
      case 'responding':
        return (baseHue - 30 + 360) % 360;
      case 'idle':
      default:
        return (baseHue + 180) % 360;
    }
  }

  public getThinkingNodes(): ThinkingNode[] {
    return this.state.thinkingNodes;
  }

  // ============================================
  // INTELLIGENCE CALCULATION
  // ============================================

  private calculateIntelligenceLevel(): void {
    // Combine multiple factors for visual intelligence score
    const layerActivity = this.state.glowLayers.filter(l => l.animated).length / this.MAX_LAYERS * 100;
    const illuminationActivity = (this.state.illumination.globalBrightness - 30) / 70 * 100;
    const thinkingActivity = (this.state.thinkingNodes.length / this.MAX_THINKING_NODES) * 100;

    this.state.intelligenceLevel = (
      layerActivity * 0.3 +
      illuminationActivity * 0.4 +
      thinkingActivity * 0.3
    );

    this.state.intelligenceLevel = Math.max(0, Math.min(100, this.state.intelligenceLevel));
  }

  // ============================================
  // GETTERS
  // ============================================

  private getMoodHue(tone: string): number {
    // Convert EmotionalTone to hue (0-360)
    switch (tone) {
      case 'warmth': return 30; // Orange
      case 'intensity': return 0; // Red
      case 'calm': return 210; // Blue
      case 'urgency': return 350; // Pink-red
      case 'presence': return 280; // Purple
      default: return 210; // Default blue
    }
  }

  public getState(): ALIState {
    return this.state;
  }

  public getIntelligenceLevel(): number {
    return this.state.intelligenceLevel;
  }

  public setAdaptiveMode(enabled: boolean): void {
    this.state.illumination.adaptiveMode = enabled;
    this.saveToStorage();
  }

  public setShadowReactivity(enabled: boolean): void {
    this.state.shadowReactivity.enabled = enabled;
    this.saveToStorage();
  }

  // ============================================
  // STORAGE
  // ============================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const dataToSave = {
        illumination: {
          globalBrightness: this.state.illumination.globalBrightness,
          adaptiveMode: this.state.illumination.adaptiveMode,
          movementTracking: this.state.illumination.movementTracking,
        },
        shadowReactivity: {
          enabled: this.state.shadowReactivity.enabled,
          shadowIntensity: this.state.shadowReactivity.shadowIntensity,
        },
        intelligenceLevel: this.state.intelligenceLevel,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[ALI] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.illumination) {
        this.state.illumination = {
          ...this.state.illumination,
          ...data.illumination,
        };
      }

      if (data.shadowReactivity) {
        this.state.shadowReactivity = {
          ...this.state.shadowReactivity,
          ...data.shadowReactivity,
        };
      }

      if (data.intelligenceLevel !== undefined) {
        this.state.intelligenceLevel = data.intelligenceLevel;
      }
    } catch (error) {
      console.error('[ALI] Failed to load:', error);
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.initializeLayers();
    this.saveToStorage();
  }
}
