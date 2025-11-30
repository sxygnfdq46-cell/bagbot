/**
 * 🔷 LEVEL 8.3 — SELF-SHAPING UI PANELS
 * 
 * Panels can:
 * - Expand
 * - Contract
 * - Fold
 * - Separate
 * - Auto-rearrange
 * 
 * Based on user focus (without animations becoming annoying).
 */

import { GenomeSnapshot } from '../entity/BehaviorGenome';

// ============================================
// TYPES
// ============================================

export interface PanelManagerState {
  panels: UIPanel[];
  focusTracking: FocusTracking;
  layoutStrategy: LayoutStrategy;
  animationControl: AnimationControl;
}

export interface UIPanel {
  id: string;
  type: 'chat' | 'dashboard' | 'charts' | 'settings' | 'logs' | 'terminal' | 'custom';
  position: { x: number; y: number }; // percentage
  size: { width: number; height: number }; // percentage
  state: 'expanded' | 'contracted' | 'folded' | 'separated' | 'normal';
  zIndex: number;
  focusScore: number; // 0-100 (how much user focuses on it)
  lastInteraction: number; // timestamp
  priority: number; // 1-10
  constraints: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    canFloat: boolean;
    canFold: boolean;
  };
}

export interface FocusTracking {
  currentFocus: string | null; // panel ID
  focusHistory: FocusEvent[];
  heatmap: Map<string, number>; // panel ID → focus time (ms)
  lastFocusChange: number;
}

export interface FocusEvent {
  panelId: string;
  timestamp: number;
  duration: number; // ms
  interactionCount: number;
}

export interface LayoutStrategy {
  mode: 'grid' | 'focus' | 'stack' | 'float' | 'auto';
  gridCols: number;
  gridRows: number;
  spacing: number; // percentage
  autoRearrange: boolean;
  rearrangeThreshold: number; // focus score difference to trigger
}

export interface AnimationControl {
  enabled: boolean;
  speed: number; // 0.1-2.0 multiplier
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  subtlety: number; // 0-100 (how subtle vs dramatic)
  maxSimultaneous: number; // max panels animating at once
}

// ============================================
// SELF-SHAPING UI PANELS
// ============================================

export class PanelManager {
  private state: PanelManagerState;
  private genome: GenomeSnapshot | null = null;
  private readonly STORAGE_KEY = 'bagbot_panel_manager_v1';

  // Focus tracking
  private readonly FOCUS_WINDOW = 30000; // 30 seconds
  private readonly INTERACTION_TIMEOUT = 5000; // 5 seconds no interaction = unfocus

  // Layout thresholds
  private readonly REARRANGE_COOLDOWN = 3000; // ms between rearranges
  private lastRearrange = 0;

  constructor() {
    this.state = this.getDefaultState();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private getDefaultState(): PanelManagerState {
    return {
      panels: [],
      focusTracking: {
        currentFocus: null,
        focusHistory: [],
        heatmap: new Map(),
        lastFocusChange: Date.now(),
      },
      layoutStrategy: {
        mode: 'auto',
        gridCols: 2,
        gridRows: 2,
        spacing: 2, // 2% spacing
        autoRearrange: true,
        rearrangeThreshold: 30, // 30 point focus difference
      },
      animationControl: {
        enabled: true,
        speed: 1.0,
        easing: 'ease-out',
        subtlety: 70,
        maxSimultaneous: 3,
      },
    };
  }

  // ============================================
  // PANEL MANAGEMENT
  // ============================================

  public registerPanel(
    id: string,
    type: UIPanel['type'],
    priority: number = 5,
    constraints?: Partial<UIPanel['constraints']>
  ): void {
    // Check if panel already exists
    if (this.state.panels.find(p => p.id === id)) {
      return;
    }

    const defaultConstraints: UIPanel['constraints'] = {
      minWidth: 20,
      minHeight: 15,
      maxWidth: 100,
      maxHeight: 100,
      canFloat: true,
      canFold: true,
      ...constraints,
    };

    const panel: UIPanel = {
      id,
      type,
      position: { x: 0, y: 0 }, // Will be calculated by layout
      size: { width: 45, height: 45 },
      state: 'normal',
      zIndex: priority * 10,
      focusScore: 0,
      lastInteraction: Date.now(),
      priority,
      constraints: defaultConstraints,
    };

    this.state.panels.push(panel);
    this.recalculateLayout();
    this.saveToStorage();
  }

  public unregisterPanel(id: string): void {
    this.state.panels = this.state.panels.filter(p => p.id !== id);
    this.recalculateLayout();
    this.saveToStorage();
  }

  public getPanel(id: string): UIPanel | undefined {
    return this.state.panels.find(p => p.id === id);
  }

  // ============================================
  // FOCUS TRACKING
  // ============================================

  public trackFocus(panelId: string): void {
    const now = Date.now();
    const panel = this.getPanel(panelId);
    if (!panel) return;

    // Update previous focus if exists
    if (this.state.focusTracking.currentFocus) {
      const prevPanel = this.getPanel(this.state.focusTracking.currentFocus);
      if (prevPanel) {
        const duration = now - this.state.focusTracking.lastFocusChange;

        // Record focus event
        this.state.focusTracking.focusHistory.push({
          panelId: this.state.focusTracking.currentFocus,
          timestamp: this.state.focusTracking.lastFocusChange,
          duration,
          interactionCount: 0, // TODO: track interactions
        });

        // Update heatmap
        const currentHeat = this.state.focusTracking.heatmap.get(this.state.focusTracking.currentFocus) || 0;
        this.state.focusTracking.heatmap.set(
          this.state.focusTracking.currentFocus,
          currentHeat + duration
        );
      }
    }

    // Set new focus
    this.state.focusTracking.currentFocus = panelId;
    this.state.focusTracking.lastFocusChange = now;

    // Update panel focus score
    this.updateFocusScores();

    // Check if layout should rearrange
    if (this.state.layoutStrategy.autoRearrange && this.shouldRearrange()) {
      this.rearrangePanels();
    }

    this.saveToStorage();
  }

  public trackInteraction(panelId: string, interactionType: 'click' | 'hover' | 'scroll' | 'input'): void {
    const panel = this.getPanel(panelId);
    if (!panel) return;

    const now = Date.now();
    panel.lastInteraction = now;

    // Boost focus score on interaction
    const boost = interactionType === 'input' ? 10 : interactionType === 'click' ? 5 : 2;
    panel.focusScore = Math.min(100, panel.focusScore + boost);

    // Track focus if not already focused
    if (this.state.focusTracking.currentFocus !== panelId) {
      this.trackFocus(panelId);
    }
  }

  private updateFocusScores(): void {
    const now = Date.now();

    this.state.panels.forEach(panel => {
      // Decay focus score based on time since last interaction
      const timeSinceInteraction = now - panel.lastInteraction;

      if (timeSinceInteraction > this.INTERACTION_TIMEOUT) {
        // Gradual decay
        const decayFactor = Math.min(1, timeSinceInteraction / 60000); // Full decay after 1 minute
        panel.focusScore = Math.max(0, panel.focusScore * (1 - decayFactor * 0.1));
      }

      // Boost current focus
      if (this.state.focusTracking.currentFocus === panel.id) {
        panel.focusScore = Math.min(100, panel.focusScore + 1);
      }
    });

    // Clean up old history
    this.state.focusTracking.focusHistory = this.state.focusTracking.focusHistory.filter(
      event => now - event.timestamp < this.FOCUS_WINDOW
    );
  }

  // ============================================
  // PANEL STATES
  // ============================================

  public expandPanel(panelId: string): void {
    const panel = this.getPanel(panelId);
    if (!panel) return;

    panel.state = 'expanded';
    panel.size = {
      width: Math.min(90, panel.constraints.maxWidth),
      height: Math.min(85, panel.constraints.maxHeight),
    };
    panel.zIndex = 1000; // Bring to front

    this.recalculateLayout();
    this.saveToStorage();
  }

  public contractPanel(panelId: string): void {
    const panel = this.getPanel(panelId);
    if (!panel) return;

    panel.state = 'contracted';
    panel.size = {
      width: Math.max(25, panel.constraints.minWidth),
      height: Math.max(20, panel.constraints.minHeight),
    };

    this.recalculateLayout();
    this.saveToStorage();
  }

  public foldPanel(panelId: string): void {
    const panel = this.getPanel(panelId);
    if (!panel || !panel.constraints.canFold) return;

    panel.state = 'folded';
    panel.size = {
      width: Math.max(15, panel.constraints.minWidth * 0.6),
      height: 5, // Header bar only
    };

    this.recalculateLayout();
    this.saveToStorage();
  }

  public separatePanel(panelId: string): void {
    const panel = this.getPanel(panelId);
    if (!panel || !panel.constraints.canFloat) return;

    panel.state = 'separated';
    panel.zIndex = 500; // Float above normal panels

    // Position in center-ish area with some randomness
    panel.position = {
      x: 25 + Math.random() * 30,
      y: 15 + Math.random() * 30,
    };

    this.saveToStorage();
  }

  public normalizePanel(panelId: string): void {
    const panel = this.getPanel(panelId);
    if (!panel) return;

    panel.state = 'normal';
    panel.size = { width: 45, height: 45 };
    panel.zIndex = panel.priority * 10;

    this.recalculateLayout();
    this.saveToStorage();
  }

  // ============================================
  // LAYOUT STRATEGIES
  // ============================================

  private shouldRearrange(): boolean {
    const now = Date.now();
    if (now - this.lastRearrange < this.REARRANGE_COOLDOWN) {
      return false;
    }

    // Check focus score differences
    const sortedByFocus = [...this.state.panels]
      .filter(p => p.state === 'normal')
      .sort((a, b) => b.focusScore - a.focusScore);

    if (sortedByFocus.length < 2) return false;

    const topFocus = sortedByFocus[0].focusScore;
    const secondFocus = sortedByFocus[1]?.focusScore || 0;

    return topFocus - secondFocus > this.state.layoutStrategy.rearrangeThreshold;
  }

  private rearrangePanels(): void {
    this.lastRearrange = Date.now();

    // Sort panels by focus score (descending)
    const normalPanels = this.state.panels
      .filter(p => p.state === 'normal')
      .sort((a, b) => b.focusScore - a.focusScore);

    // Focused panel gets prime position
    if (normalPanels.length > 0 && this.state.layoutStrategy.mode === 'auto') {
      const focusedPanel = normalPanels[0];

      // Give focused panel more space
      focusedPanel.size = {
        width: Math.min(60, focusedPanel.constraints.maxWidth),
        height: Math.min(55, focusedPanel.constraints.maxHeight),
      };
    }

    this.recalculateLayout();
  }

  private recalculateLayout(): void {
    const { mode, gridCols, gridRows, spacing } = this.state.layoutStrategy;

    // Filter panels by state
    const normalPanels = this.state.panels.filter(p => p.state === 'normal');
    const separatedPanels = this.state.panels.filter(p => p.state === 'separated');

    // Layout normal panels based on strategy
    switch (mode) {
      case 'grid':
        this.layoutGrid(normalPanels, gridCols, gridRows, spacing);
        break;
      case 'focus':
        this.layoutFocus(normalPanels, spacing);
        break;
      case 'stack':
        this.layoutStack(normalPanels, spacing);
        break;
      case 'auto':
      default:
        // Auto mode: use focus-based layout
        this.layoutFocus(normalPanels, spacing);
        break;
    }

    // Separated panels maintain their positions
    // (already set when they were separated)
  }

  private layoutGrid(panels: UIPanel[], cols: number, rows: number, spacing: number): void {
    const cellWidth = (100 - spacing * (cols + 1)) / cols;
    const cellHeight = (100 - spacing * (rows + 1)) / rows;

    panels.forEach((panel, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      panel.position = {
        x: spacing + col * (cellWidth + spacing),
        y: spacing + row * (cellHeight + spacing),
      };

      panel.size = {
        width: cellWidth,
        height: cellHeight,
      };
    });
  }

  private layoutFocus(panels: UIPanel[], spacing: number): void {
    // Sort by focus score
    const sorted = [...panels].sort((a, b) => b.focusScore - a.focusScore);

    if (sorted.length === 0) return;

    // Primary panel (highest focus) takes main area
    const primary = sorted[0];
    primary.position = { x: spacing, y: spacing };
    primary.size = {
      width: 60 - spacing * 2,
      height: 100 - spacing * 2,
    };

    // Secondary panels stack on the side
    const secondaryWidth = 38 - spacing * 2;
    const secondaryHeight = (100 - spacing * (sorted.length)) / Math.max(1, sorted.length - 1);

    sorted.slice(1).forEach((panel, index) => {
      panel.position = {
        x: 60 + spacing,
        y: spacing + index * (secondaryHeight + spacing),
      };

      panel.size = {
        width: secondaryWidth,
        height: secondaryHeight,
      };
    });
  }

  private layoutStack(panels: UIPanel[], spacing: number): void {
    const panelHeight = (100 - spacing * (panels.length + 1)) / panels.length;

    panels.forEach((panel, index) => {
      panel.position = {
        x: spacing,
        y: spacing + index * (panelHeight + spacing),
      };

      panel.size = {
        width: 100 - spacing * 2,
        height: panelHeight,
      };
    });
  }

  // ============================================
  // ANIMATION CONTROL
  // ============================================

  public update(genome: GenomeSnapshot): void {
    this.genome = genome;

    // Update animation settings based on personality
    const { parameters } = genome;

    // Responsiveness affects animation speed
    this.state.animationControl.speed = 0.5 + parameters.responsivenessSpeed * 0.015;

    // Visual assertiveness affects subtlety (more assertive = less subtle)
    this.state.animationControl.subtlety = 100 - parameters.visualAssertiveness * 0.6;

    // Update focus scores
    this.updateFocusScores();
  }

  public setAnimationEnabled(enabled: boolean): void {
    this.state.animationControl.enabled = enabled;
    this.saveToStorage();
  }

  public setLayoutMode(mode: LayoutStrategy['mode']): void {
    this.state.layoutStrategy.mode = mode;
    this.recalculateLayout();
    this.saveToStorage();
  }

  // ============================================
  // GETTERS
  // ============================================

  public getState(): PanelManagerState {
    return this.state;
  }

  public getPanels(): UIPanel[] {
    return this.state.panels;
  }

  public getAnimationSettings(): AnimationControl {
    return this.state.animationControl;
  }

  public getFocusedPanel(): UIPanel | null {
    if (!this.state.focusTracking.currentFocus) return null;
    return this.getPanel(this.state.focusTracking.currentFocus) || null;
  }

  // ============================================
  // STORAGE
  // ============================================

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const dataToSave = {
        panels: this.state.panels.map(p => ({
          id: p.id,
          type: p.type,
          state: p.state,
          priority: p.priority,
          constraints: p.constraints,
        })),
        layoutStrategy: this.state.layoutStrategy,
        animationControl: this.state.animationControl,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[PanelManager] Failed to save:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;

      const data = JSON.parse(stored);

      if (data.layoutStrategy) {
        this.state.layoutStrategy = { ...this.state.layoutStrategy, ...data.layoutStrategy };
      }

      if (data.animationControl) {
        this.state.animationControl = { ...this.state.animationControl, ...data.animationControl };
      }

      // Note: panels are registered dynamically by components
    } catch (error) {
      console.error('[PanelManager] Failed to load:', error);
    }
  }

  public reset(): void {
    this.state = this.getDefaultState();
    this.saveToStorage();
  }
}
