/**
 * LEVEL 11.5 — MULTI-SURFACE AWARENESS MATRIX (MSAM)
 * 
 * Tracks BagBot's context across ALL surfaces:
 * - Dashboard, Strategies, Signals, Settings, History
 * - Environment layers (Levels 9.4, 9.5)
 * - Personality layers (Levels 11.1, 11.2, 11.3, 11.4)
 * 
 * Architecture:
 * - Surface context mapping (where is BagBot active?)
 * - Active surface vector (what is user focused on?)
 * - Context transition smoothing (prevents jarring surface switches)
 * - Cross-layer awareness (integrates all Level 9-11 contexts)
 * 
 * Outputs:
 * - surfaceContextMap: Complete surface state
 * - activeSurfaceVector: Current user focus
 * 
 * PRIVACY: Zero data storage, ephemeral only, pattern-based context.
 */

// ================================
// TYPES
// ================================

/**
 * Surface types
 */
export type SurfaceType =
  | 'dashboard'
  | 'strategies'
  | 'signals'
  | 'settings'
  | 'history'
  | 'backtest'
  | 'optimization'
  | 'brain'
  | 'environment'
  | 'personality'
  | 'collective'
  | 'presence';

/**
 * Surface context
 */
export interface SurfaceContext {
  type: SurfaceType;
  activeSince: number;
  visitCount: number;
  lastVisit: number;
  engagementLevel: number; // 0-100
  contextDepth: number; // 0-100: how deep user is in this surface
  emotionalResonance: number; // 0-100: how emotionally engaged
}

export type TransitionPhase = 'entering' | 'active' | 'leaving' | 'switching';

export interface LayerIntegration {
  environmentLayer: boolean; // Levels 9.4, 9.5
  personalityLayer: boolean; // Levels 11.1, 11.2
  emotionalLayer: boolean; // Level 11.3
  collectiveLayer: boolean; // Level 11.4
  presenceLayer: boolean; // Level 11.5 (always true)
}

/**
 * Active surface vector
 */
export interface ActiveSurfaceVector {
  primary: SurfaceType;
  secondary: SurfaceType | null;
  focusIntensity: number; // 0-100
  contextStability: number; // 0-100
  transitionPhase: TransitionPhase;
}

/**
 * Surface awareness state
 */
export interface SurfaceAwarenessState {
  timestamp: number;
  
  // Surface map
  surfaceContextMap: Map<SurfaceType, SurfaceContext>;
  
  // Active vector
  activeSurfaceVector: ActiveSurfaceVector;
  
  // Cross-layer awareness
  layerIntegration: LayerIntegration;
  
  // Context metrics
  contextCoherence: number; // 0-100: how unified surfaces feel
  surfaceAlignment: number; // 0-100: how well surfaces align with intent
  transitionSmoothness: number; // 0-100: how seamless transitions are
}

/**
 * Surface transition
 */
export interface SurfaceTransition {
  from: SurfaceType;
  to: SurfaceType;
  timestamp: number;
  transitionSpeed: 'instant' | 'fast' | 'smooth' | 'gradual';
}

/**
 * Surface awareness configuration
 */
export interface SurfaceAwarenessConfig {
  engagementDecayRate?: number;
  maxTransitions?: number;
}

// ================================
// MULTI-SURFACE AWARENESS MATRIX
// ================================

export class MultiSurfaceAwarenessMatrix {
  private state: SurfaceAwarenessState;
  private transitionHistory: SurfaceTransition[] = [];
  private readonly MAX_TRANSITIONS = 50;
  private readonly ENGAGEMENT_DECAY = 0.98; // Per second
  
  constructor() {
    this.state = this.createDefaultState();
    
    // Start engagement decay loop
    if (typeof window !== 'undefined') {
      setInterval(() => this.decayEngagement(), 1000);
    }
  }

  /**
   * Create default state
   */
  private createDefaultState(): SurfaceAwarenessState {
    const surfaceContextMap = new Map<SurfaceType, SurfaceContext>();
    
    // Initialize all surfaces
    const surfaces: SurfaceType[] = [
      'dashboard',
      'strategies',
      'signals',
      'settings',
      'history',
      'backtest',
      'optimization',
      'brain',
      'environment',
      'personality',
      'collective',
      'presence',
    ];
    
    for (const surface of surfaces) {
      surfaceContextMap.set(surface, {
        type: surface,
        activeSince: 0,
        visitCount: 0,
        lastVisit: 0,
        engagementLevel: 0,
        contextDepth: 0,
        emotionalResonance: 0,
      });
    }
    
    return {
      timestamp: Date.now(),
      
      surfaceContextMap,
      
      activeSurfaceVector: {
        primary: 'dashboard',
        secondary: null,
        focusIntensity: 50,
        contextStability: 70,
        transitionPhase: 'active',
      },
      
      layerIntegration: {
        environmentLayer: false,
        personalityLayer: false,
        emotionalLayer: false,
        collectiveLayer: false,
        presenceLayer: true, // Always true for Level 11.5
      },
      
      contextCoherence: 70,
      surfaceAlignment: 75,
      transitionSmoothness: 80,
    };
  }

  /**
   * Activate surface
   */
  activateSurface(surface: SurfaceType, engagement: number = 70): void {
    const context = this.state.surfaceContextMap.get(surface);
    if (!context) return;
    
    const now = Date.now();
    
    // Record transition if switching primary surface
    if (this.state.activeSurfaceVector.primary !== surface) {
      this.recordTransition({
        from: this.state.activeSurfaceVector.primary,
        to: surface,
        timestamp: now,
        transitionSpeed: 'smooth',
      });
      
      // Update transition phase
      this.state.activeSurfaceVector.transitionPhase = 'switching';
      setTimeout(() => {
        this.state.activeSurfaceVector.transitionPhase = 'active';
      }, 300);
    }
    
    // Update context
    context.activeSince = now;
    context.visitCount++;
    context.lastVisit = now;
    context.engagementLevel = engagement;
    context.contextDepth = 50; // Start at medium depth
    context.emotionalResonance = 60; // Start at medium resonance
    
    // Update active surface vector
    this.state.activeSurfaceVector.primary = surface;
    this.state.activeSurfaceVector.focusIntensity = engagement;
    
    // Update layer integration
    this.updateLayerIntegration();
    
    // Recalculate metrics
    this.recalculateMetrics();
    
    this.state.timestamp = now;
  }

  /**
   * Deactivate surface
   */
  deactivateSurface(surface: SurfaceType): void {
    const context = this.state.surfaceContextMap.get(surface);
    if (!context) return;
    
    context.activeSince = 0;
    context.engagementLevel = 0;
    context.contextDepth = 0;
    
    // If primary surface is deactivated, switch to dashboard
    if (this.state.activeSurfaceVector.primary === surface) {
      this.activateSurface('dashboard', 50);
    }
  }

  /**
   * Update engagement (called during user interaction)
   */
  updateEngagement(surface: SurfaceType, delta: number): void {
    const context = this.state.surfaceContextMap.get(surface);
    if (!context) return;
    
    context.engagementLevel = Math.max(0, Math.min(100, context.engagementLevel + delta));
    context.contextDepth = Math.max(0, Math.min(100, context.contextDepth + delta * 0.5));
    context.emotionalResonance = Math.max(0, Math.min(100, context.emotionalResonance + delta * 0.3));
    
    // Update focus intensity if this is the primary surface
    if (this.state.activeSurfaceVector.primary === surface) {
      this.state.activeSurfaceVector.focusIntensity = context.engagementLevel;
    }
  }

  /**
   * Decay engagement over time
   */
  private decayEngagement(): void {
    for (const context of Array.from(this.state.surfaceContextMap.values())) {
      if (context.activeSince === 0) continue; // Skip inactive surfaces
      
      context.engagementLevel *= this.ENGAGEMENT_DECAY;
      context.contextDepth *= this.ENGAGEMENT_DECAY;
      context.emotionalResonance *= this.ENGAGEMENT_DECAY;
      
      // If engagement drops too low, deactivate
      if (context.engagementLevel < 5) {
        context.activeSince = 0;
        context.engagementLevel = 0;
        context.contextDepth = 0;
      }
    }
  }

  /**
   * Update layer integration
   */
  private updateLayerIntegration(): void {
    const active = this.state.activeSurfaceVector.primary;
    
    // Determine which layers should be active based on surface
    this.state.layerIntegration.environmentLayer =
      active === 'environment' || active === 'brain' || active === 'strategies';
    
    this.state.layerIntegration.personalityLayer =
      active === 'personality' || active === 'brain' || active === 'dashboard';
    
    this.state.layerIntegration.emotionalLayer =
      active === 'personality' || active === 'brain' || active === 'strategies';
    
    this.state.layerIntegration.collectiveLayer =
      active === 'collective' || active === 'signals' || active === 'strategies';
    
    this.state.layerIntegration.presenceLayer = true; // Always active
  }

  /**
   * Recalculate metrics
   */
  private recalculateMetrics(): void {
    // Context coherence: based on how many surfaces are active and aligned
    const activeSurfaces = Array.from(this.state.surfaceContextMap.values()).filter(
      c => c.activeSince > 0
    );
    
    if (activeSurfaces.length === 0) {
      this.state.contextCoherence = 100;
    } else if (activeSurfaces.length === 1) {
      this.state.contextCoherence = 95;
    } else {
      // Multiple surfaces: coherence decreases
      this.state.contextCoherence = Math.max(50, 100 - activeSurfaces.length * 10);
    }
    
    // Surface alignment: based on engagement levels
    const totalEngagement = activeSurfaces.reduce((sum, c) => sum + c.engagementLevel, 0);
    const avgEngagement = activeSurfaces.length > 0 ? totalEngagement / activeSurfaces.length : 70;
    this.state.surfaceAlignment = avgEngagement;
    
    // Transition smoothness: based on recent transition frequency
    const recentTransitions = this.transitionHistory.filter(
      t => Date.now() - t.timestamp < 10000 // Last 10 seconds
    );
    
    if (recentTransitions.length === 0) {
      this.state.transitionSmoothness = 100;
    } else if (recentTransitions.length <= 2) {
      this.state.transitionSmoothness = 80;
    } else {
      this.state.transitionSmoothness = Math.max(30, 100 - recentTransitions.length * 15);
    }
    
    // Context stability
    this.state.activeSurfaceVector.contextStability =
      (this.state.contextCoherence + this.state.transitionSmoothness) / 2;
  }

  /**
   * Record transition
   */
  private recordTransition(transition: SurfaceTransition): void {
    this.transitionHistory.push(transition);
    
    if (this.transitionHistory.length > this.MAX_TRANSITIONS) {
      this.transitionHistory.shift();
    }
  }

  /**
   * Get surface context
   */
  getSurfaceContext(surface: SurfaceType): SurfaceContext | undefined {
    return this.state.surfaceContextMap.get(surface);
  }

  /**
   * Get all active surfaces
   */
  getActiveSurfaces(): SurfaceContext[] {
    return Array.from(this.state.surfaceContextMap.values()).filter(c => c.activeSince > 0);
  }

  /**
   * Get current state
   */
  getState(): SurfaceAwarenessState {
    return {
      ...this.state,
      surfaceContextMap: new Map(this.state.surfaceContextMap),
    };
  }

  /**
   * Get state summary
   */
  getSummary(): {
    active: string;
    coherence: string;
    layers: string;
    transitions: string;
  } {
    const { activeSurfaceVector, contextCoherence, layerIntegration } = this.state;
    
    const active = activeSurfaceVector.secondary
      ? `${activeSurfaceVector.primary} + ${activeSurfaceVector.secondary}`
      : activeSurfaceVector.primary;
    
    let coherence = 'unified';
    if (contextCoherence < 50) coherence = 'fragmented';
    else if (contextCoherence > 85) coherence = 'seamless';
    
    const activeLayers = Object.entries(layerIntegration)
      .filter(([_, active]) => active)
      .map(([layer]) => layer.replace('Layer', ''))
      .join(', ');
    
    const recentTransitions = this.transitionHistory.filter(
      t => Date.now() - t.timestamp < 10000
    ).length;
    
    const transitions = recentTransitions === 0 ? 'stable' : `${recentTransitions} in 10s`;
    
    return { active, coherence, layers: activeLayers, transitions };
  }

  /**
   * Reset to default
   */
  reset(): void {
    this.state = this.createDefaultState();
    this.transitionHistory = [];
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      state: {
        ...this.state,
        surfaceContextMap: Array.from(this.state.surfaceContextMap.entries()),
      },
      transitionHistory: this.transitionHistory,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.state = {
        ...data.state,
        surfaceContextMap: new Map(data.state.surfaceContextMap),
      };
      this.transitionHistory = data.transitionHistory;
      return true;
    } catch (error) {
      console.error('Failed to import surface awareness state:', error);
      return false;
    }
  }
}
