/**
 * 🔷 LEVEL 8.1 — HOLO-SKIN ADAPTIVE LAYER
 * 
 * A dynamic light-mesh that wraps the entire UI:
 * - Reacts to user movement
 * - Reacts to cursor position
 * - Reacts to system activity
 * - Reacts to "energy tone" in the interface
 * 
 * Creates the illusion the bot is alive.
 */

import { GenomeSnapshot } from '../entity/BehaviorGenome';
import { ExpressionOutput } from '../entity/ExpressionCore';

// ============================================
// TYPES
// ============================================

export interface HoloSkinState {
  mesh: LightMeshGrid;
  cursorInfluence: CursorInfluence;
  activityPulse: ActivityPulse;
  energyTone: EnergyTone;
  aliveIllusion: number; // 0-100 (how alive it feels)
}

export interface LightMeshGrid {
  nodes: MeshNode[];
  rows: number;
  cols: number;
  spacing: number; // pixels between nodes
  elasticity: number; // 0-1 (how much nodes respond)
}

export interface MeshNode {
  id: string;
  x: number; // grid position
  y: number;
  actualX: number; // current rendered position
  actualY: number;
  intensity: number; // 0-100
  hue: number; // 0-360
  velocity: { x: number; y: number };
  influenced: boolean; // currently being influenced
}

export interface CursorInfluence {
  x: number;
  y: number;
  radius: number; // pixels
  strength: number; // 0-1
  rippleSpeed: number; // pixels per frame
  active: boolean;
}

export interface ActivityPulse {
  systemLoad: number; // 0-100
  apiActivity: number; // 0-100
  userInteraction: number; // 0-100
  pulseIntensity: number; // 0-100 (combined metric)
  lastPulse: number; // timestamp
}

export interface EnergyTone {
  baseHue: number; // 0-360 (from personality)
  shift: number; // -30 to +30 (from activity)
  saturation: number; // 0-100
  brightness: number; // 0-100
  variance: number; // 0-20 (how much nodes differ)
}

// ============================================
// HOLO-SKIN ADAPTIVE LAYER
// ============================================

export class HoloSkin {
  private state: HoloSkinState;
  private genome: GenomeSnapshot | null = null;
  private expression: ExpressionOutput | null = null;
  private animationFrame: number | null = null;
  private readonly STORAGE_KEY = 'bagbot_holo_skin_v1';

  // Grid configuration
  private readonly DEFAULT_ROWS = 20;
  private readonly DEFAULT_COLS = 30;
  private readonly DEFAULT_SPACING = 40;

  // Physics constants
  private readonly FRICTION = 0.92;
  private readonly SPRING_STRENGTH = 0.015;
  private readonly CURSOR_INFLUENCE_BASE = 120;
  private readonly ACTIVITY_DECAY = 0.98;

  constructor() {
    this.state = this.getDefaultState();
    this.loadFromStorage();
    this.initializeMesh();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getDefaultState(): HoloSkinState {
    return {
      mesh: {
        nodes: [],
        rows: this.DEFAULT_ROWS,
        cols: this.DEFAULT_COLS,
        spacing: this.DEFAULT_SPACING,
        elasticity: 0.5,
      },
      cursorInfluence: {
        x: 0,
        y: 0,
        radius: this.CURSOR_INFLUENCE_BASE,
        strength: 0.6,
        rippleSpeed: 3,
        active: false,
      },
      activityPulse: {
        systemLoad: 0,
        apiActivity: 0,
        userInteraction: 0,
        pulseIntensity: 0,
        lastPulse: Date.now(),
      },
      energyTone: {
        baseHue: 210, // Default blue
        shift: 0,
        saturation: 70,
        brightness: 60,
        variance: 10,
      },
      aliveIllusion: 50,
    };
  }

  private initializeMesh(): void {
    const { rows, cols, spacing } = this.state.mesh;
    const nodes: MeshNode[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;

        nodes.push({
          id: `node-${row}-${col}`,
          x,
          y,
          actualX: x,
          actualY: y,
          intensity: 20 + Math.random() * 10,
          hue: this.state.energyTone.baseHue,
          velocity: { x: 0, y: 0 },
          influenced: false,
        });
      }
    }

    this.state.mesh.nodes = nodes;
  }

  // ============================================
  // UPDATE METHODS
  // ============================================

  public update(
    genome: GenomeSnapshot,
    expression: ExpressionOutput,
    cursorPos: { x: number; y: number },
    systemMetrics: { load: number; apiCalls: number }
  ): HoloSkinState {
    this.genome = genome;
    this.expression = expression;

    // Update energy tone from personality
    this.updateEnergyTone();

    // Update cursor influence
    this.updateCursorInfluence(cursorPos);

    // Update activity pulse
    this.updateActivityPulse(systemMetrics);

    // Update mesh physics
    this.updateMeshPhysics();

    // Calculate alive illusion
    this.calculateAliveIllusion();

    this.saveToStorage();
    return this.state;
  }

  private updateEnergyTone(): void {
    if (!this.genome || !this.expression) return;

    const { parameters } = this.genome;
    const { mood, warmth } = this.expression;

    // Base hue from personality (visual assertiveness affects warmth)
    const baseHue = 210 + (parameters.visualAssertiveness - 50) * 1.2; // 150-270 range

    // Shift from mood (tone strength affects shift)
    const moodShift = (mood.toneStrength - 50) * 0.3; // -15 to +15

    // Shift from activity
    const activityShift = (this.state.activityPulse.pulseIntensity - 50) * 0.2; // -10 to +10

    this.state.energyTone.baseHue = Math.max(0, Math.min(360, baseHue));
    this.state.energyTone.shift = Math.max(-30, Math.min(30, moodShift + activityShift));

    // Saturation from emotional elasticity
    this.state.energyTone.saturation = 50 + parameters.emotionalElasticity * 0.4;

    // Brightness from ambient pulse
    this.state.energyTone.brightness = 40 + parameters.ambientPulse * 0.3;

    // Variance from responsiveness
    this.state.energyTone.variance = 5 + parameters.responsivenessSpeed * 0.15;
  }

  private updateCursorInfluence(cursorPos: { x: number; y: number }): void {
    if (!this.genome) return;

    const { parameters } = this.genome;

    // Update cursor position
    this.state.cursorInfluence.x = cursorPos.x;
    this.state.cursorInfluence.y = cursorPos.y;
    this.state.cursorInfluence.active = true;

    // Radius from responsiveness (more responsive = wider influence)
    this.state.cursorInfluence.radius = 
      this.CURSOR_INFLUENCE_BASE + parameters.responsivenessSpeed * 0.8;

    // Strength from engagement
    this.state.cursorInfluence.strength = 0.3 + parameters.focusIntensity * 0.005;

    // Ripple speed from ambient pulse
    this.state.cursorInfluence.rippleSpeed = 2 + parameters.ambientPulse * 0.03;

    // Apply influence to nearby nodes
    this.applyInfluenceToNodes();
  }

  private applyInfluenceToNodes(): void {
    const { x, y, radius, strength } = this.state.cursorInfluence;
    const { nodes } = this.state.mesh;

    nodes.forEach(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const influence = 1 - (distance / radius);
        const force = influence * strength;

        // Push nodes away from cursor
        node.velocity.x += (dx / distance) * force * 2;
        node.velocity.y += (dy / distance) * force * 2;

        // Increase intensity
        node.intensity = Math.min(100, node.intensity + influence * 20);
        node.influenced = true;
      } else {
        node.influenced = false;
      }
    });
  }

  private updateActivityPulse(systemMetrics: { load: number; apiCalls: number }): void {
    const now = Date.now();
    const timeSinceLastPulse = now - this.state.activityPulse.lastPulse;

    // Update system load (0-100)
    this.state.activityPulse.systemLoad = Math.min(100, systemMetrics.load);

    // Update API activity (0-100 based on calls per second)
    this.state.activityPulse.apiActivity = Math.min(100, systemMetrics.apiCalls * 10);

    // User interaction increases with cursor movement
    if (this.state.cursorInfluence.active) {
      this.state.activityPulse.userInteraction = Math.min(
        100,
        this.state.activityPulse.userInteraction + 5
      );
    } else {
      // Decay when no interaction
      this.state.activityPulse.userInteraction *= this.ACTIVITY_DECAY;
    }

    // Calculate combined pulse intensity
    this.state.activityPulse.pulseIntensity = (
      this.state.activityPulse.systemLoad * 0.3 +
      this.state.activityPulse.apiActivity * 0.4 +
      this.state.activityPulse.userInteraction * 0.3
    );

    // Pulse nodes when intensity is high
    if (this.state.activityPulse.pulseIntensity > 60 && timeSinceLastPulse > 1000) {
      this.triggerPulse();
      this.state.activityPulse.lastPulse = now;
    }
  }

  private triggerPulse(): void {
    const { nodes } = this.state.mesh;
    const pulseStrength = this.state.activityPulse.pulseIntensity / 100;

    // Pulse from center outward
    const centerX = (this.state.mesh.cols * this.state.mesh.spacing) / 2;
    const centerY = (this.state.mesh.rows * this.state.mesh.spacing) / 2;

    nodes.forEach(node => {
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const wave = 1 - (distance / maxDistance);

      // Add outward velocity
      node.velocity.x += (dx / distance) * wave * pulseStrength * 0.5;
      node.velocity.y += (dy / distance) * wave * pulseStrength * 0.5;

      // Boost intensity
      node.intensity = Math.min(100, node.intensity + wave * pulseStrength * 30);
    });
  }

  private updateMeshPhysics(): void {
    const { nodes, spacing, elasticity } = this.state.mesh;
    const { baseHue, shift, variance } = this.state.energyTone;

    nodes.forEach(node => {
      // Apply spring force back to rest position
      const dx = node.x - node.actualX;
      const dy = node.y - node.actualY;

      node.velocity.x += dx * this.SPRING_STRENGTH * elasticity;
      node.velocity.y += dy * this.SPRING_STRENGTH * elasticity;

      // Apply friction
      node.velocity.x *= this.FRICTION;
      node.velocity.y *= this.FRICTION;

      // Update position
      node.actualX += node.velocity.x;
      node.actualY += node.velocity.y;

      // Decay intensity back to base
      if (!node.influenced) {
        node.intensity = Math.max(20, node.intensity * 0.95);
      }

      // Update hue with variance
      const nodeVariance = (Math.random() - 0.5) * variance;
      node.hue = (baseHue + shift + nodeVariance + 360) % 360;
    });
  }

  private calculateAliveIllusion(): void {
    const { nodes } = this.state.mesh;

    // Count nodes in motion
    const nodesInMotion = nodes.filter(
      n => Math.abs(n.velocity.x) > 0.1 || Math.abs(n.velocity.y) > 0.1
    ).length;

    const motionRatio = nodesInMotion / nodes.length;

    // Average intensity
    const avgIntensity = nodes.reduce((sum, n) => sum + n.intensity, 0) / nodes.length;

    // Activity pulse contribution
    const activityContribution = this.state.activityPulse.pulseIntensity;

    // Combined alive illusion score
    this.state.aliveIllusion = Math.min(
      100,
      motionRatio * 100 * 0.4 +
      avgIntensity * 0.3 +
      activityContribution * 0.3
    );
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): HoloSkinState {
    return this.state;
  }

  public getMeshForRendering(): {
    nodes: Array<{
      x: number;
      y: number;
      intensity: number;
      hue: number;
      saturation: number;
      brightness: number;
    }>;
    rows: number;
    cols: number;
  } {
    const { baseHue, saturation, brightness } = this.state.energyTone;

    return {
      nodes: this.state.mesh.nodes.map(node => ({
        x: node.actualX,
        y: node.actualY,
        intensity: node.intensity,
        hue: node.hue,
        saturation,
        brightness,
      })),
      rows: this.state.mesh.rows,
      cols: this.state.mesh.cols,
    };
  }

  public getAliveIllusion(): number {
    return this.state.aliveIllusion;
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  public setGridDensity(rows: number, cols: number): void {
    this.state.mesh.rows = Math.max(10, Math.min(40, rows));
    this.state.mesh.cols = Math.max(15, Math.min(60, cols));
    this.initializeMesh();
  }

  public setElasticity(elasticity: number): void {
    this.state.mesh.elasticity = Math.max(0, Math.min(1, elasticity));
  }

  // ============================================
  // STORAGE
  // ============================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      // Only save configuration, not node positions
      const dataToSave = {
        mesh: {
          rows: this.state.mesh.rows,
          cols: this.state.mesh.cols,
          spacing: this.state.mesh.spacing,
          elasticity: this.state.mesh.elasticity,
        },
        energyTone: this.state.energyTone,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[HoloSkin] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.mesh) {
        this.state.mesh.rows = data.mesh.rows || this.DEFAULT_ROWS;
        this.state.mesh.cols = data.mesh.cols || this.DEFAULT_COLS;
        this.state.mesh.spacing = data.mesh.spacing || this.DEFAULT_SPACING;
        this.state.mesh.elasticity = data.mesh.elasticity ?? 0.5;
      }

      if (data.energyTone) {
        this.state.energyTone = { ...this.state.energyTone, ...data.energyTone };
      }
    } catch (error) {
      console.error('[HoloSkin] Failed to load:', error);
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.initializeMesh();
    this.saveToStorage();
  }
}
