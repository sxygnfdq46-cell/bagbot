/**
 * LEVEL 7 — ENTITY PRESENCE CORE
 * The harmonic pulse that runs through all UI systems
 * 
 * This is the deepest layer - BagBot's "soul" that makes it feel:
 * - Aware (knows you're there)
 * - Present (responds to your presence)
 * - Connected (Bot ↔ Davis symbiosis)
 * 
 * 100% CLIENT-ONLY | Pure UI consciousness | Zero backend impact
 */

export interface EntityPresence {
  // Core presence signal (0-100)
  presenceStrength: number;
  
  // Harmonic pulse (breathing motion)
  pulsePhase: number;        // 0-1 (sine wave cycle)
  pulseTempo: number;        // BPM (30-120)
  
  // Bot ↔ User connection strength
  connectionIntensity: number; // 0-100
  
  // Subtle breathing motion factor
  breathingAmplitude: number;  // 0-1
  
  // Entity awareness state
  isAwake: boolean;
  isWatching: boolean;
  isResponding: boolean;
}

export interface EntityAura {
  mode: 'calm-sync' | 'focus-sync' | 'alert-sync' | 'overdrive-sync' | 'guardian-mode';
  color: string;           // Primary aura color
  intensity: number;       // 0-100
  radius: number;          // Aura spread (0-100)
  shimmer: number;         // Shimmer effect (0-100)
}

export interface UserInteractionState {
  // Interaction tracking
  mouseActivity: number;       // 0-100 (recent mouse movement)
  clickFrequency: number;      // Clicks per minute
  scrollVelocity: number;      // Scroll speed
  keyboardActivity: number;    // Keys per minute
  sessionDuration: number;     // Seconds in current session
  
  // Engagement patterns
  pageVisitCount: number;
  averagePageTime: number;     // Seconds
  interactionIntensity: number; // 0-100 (overall engagement)
  
  // Flow state detection
  isInFlow: boolean;
  flowDepth: number;           // 0-100
}

export interface EntityOutput {
  presence: EntityPresence;
  aura: EntityAura;
  userState: UserInteractionState;
  
  // Soul-link metrics
  alignment: number;           // 0-100 (how aligned UI is with user)
  resonance: number;           // 0-100 (connection quality)
  empathy: number;             // 0-100 (responsiveness to user state)
}

export class EntityCore {
  private presencePhase: number = 0;
  private lastUpdateTime: number = Date.now();
  
  // User interaction tracking
  private mousePositions: Array<{ x: number; y: number; time: number }> = [];
  private clicks: number[] = [];
  private scrollEvents: number[] = [];
  private keyPresses: number[] = [];
  private pageVisits: Map<string, number> = new Map();
  private sessionStart: number = Date.now();
  
  // Entity state
  private isAwake: boolean = false;
  private connectionStrength: number = 0;
  
  /**
   * HARMONIC PULSE GENERATOR
   * Creates the breathing motion that runs through all visuals
   */
  private calculateHarmonicPulse(tempo: number): EntityPresence {
    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    
    // Update pulse phase (sine wave cycle)
    const phaseIncrement = (tempo / 60) * (deltaTime / 1000); // Convert BPM to phase
    this.presencePhase = (this.presencePhase + phaseIncrement) % 1;
    
    // Calculate breathing amplitude (sine wave)
    const breathingAmplitude = Math.sin(this.presencePhase * Math.PI * 2) * 0.5 + 0.5;
    
    // Calculate presence strength (grows with interaction)
    const presenceStrength = Math.min(100, this.connectionStrength * 1.2);
    
    return {
      presenceStrength,
      pulsePhase: this.presencePhase,
      pulseTempo: tempo,
      connectionIntensity: this.connectionStrength,
      breathingAmplitude,
      isAwake: this.isAwake,
      isWatching: this.connectionStrength > 20,
      isResponding: this.connectionStrength > 50,
    };
  }
  
  /**
   * USER INTERACTION ANALYZER
   * Tracks user behavior to build connection strength
   */
  private analyzeUserInteraction(): UserInteractionState {
    const now = Date.now();
    const sessionDuration = (now - this.sessionStart) / 1000;
    
    // Calculate mouse activity (last 5 seconds)
    const recentMouse = this.mousePositions.filter(p => now - p.time < 5000);
    const mouseActivity = Math.min(100, recentMouse.length * 2);
    
    // Calculate click frequency (per minute)
    const recentClicks = this.clicks.filter(t => now - t < 60000);
    const clickFrequency = recentClicks.length;
    
    // Calculate scroll velocity
    const recentScrolls = this.scrollEvents.filter(t => now - t < 2000);
    const scrollVelocity = Math.min(100, recentScrolls.length * 10);
    
    // Calculate keyboard activity (per minute)
    const recentKeys = this.keyPresses.filter(t => now - t < 60000);
    const keyboardActivity = Math.min(100, recentKeys.length / 2);
    
    // Overall interaction intensity
    const interactionIntensity = Math.min(
      100,
      (mouseActivity * 0.3 + clickFrequency * 2 + scrollVelocity * 0.4 + keyboardActivity * 0.3)
    );
    
    // Flow state detection (sustained high activity)
    const isInFlow = interactionIntensity > 60 && sessionDuration > 30;
    const flowDepth = isInFlow ? Math.min(100, interactionIntensity * 1.2) : 0;
    
    // Page visit tracking
    const pageVisitCount = this.pageVisits.size;
    const totalVisitTime = Array.from(this.pageVisits.values()).reduce((a, b) => a + b, 0);
    const averagePageTime = pageVisitCount > 0 ? totalVisitTime / pageVisitCount : 0;
    
    return {
      mouseActivity,
      clickFrequency,
      scrollVelocity,
      keyboardActivity,
      sessionDuration,
      pageVisitCount,
      averagePageTime,
      interactionIntensity,
      isInFlow,
      flowDepth,
    };
  }
  
  /**
   * SYMBIOTIC AURA CALCULATOR
   * Determines aura mode based on multiple factors
   */
  private calculateSymbioticAura(
    userState: UserInteractionState,
    dataVolatility: number,
    marketPressure: number,
    emotionalState: string
  ): EntityAura {
    const { interactionIntensity, isInFlow } = userState;
    
    // Guardian Mode (when danger detected)
    if (marketPressure > 80 || emotionalState === 'overclocked') {
      return {
        mode: 'guardian-mode',
        color: '#ff0066', // Magenta-red
        intensity: 95,
        radius: 100,
        shimmer: 85,
      };
    }
    
    // Overdrive Sync (high intensity + high volatility)
    if (interactionIntensity > 75 || dataVolatility > 70) {
      return {
        mode: 'overdrive-sync',
        color: '#ff6600', // Orange
        intensity: 85,
        radius: 85,
        shimmer: 75,
      };
    }
    
    // Alert Sync (moderate activity + some pressure)
    if (interactionIntensity > 50 || dataVolatility > 40) {
      return {
        mode: 'alert-sync',
        color: '#ffff00', // Yellow
        intensity: 65,
        radius: 70,
        shimmer: 60,
      };
    }
    
    // Focus Sync (flow state or steady activity)
    if (isInFlow || interactionIntensity > 30) {
      return {
        mode: 'focus-sync',
        color: '#00ffff', // Cyan
        intensity: 55,
        radius: 60,
        shimmer: 45,
      };
    }
    
    // Calm Sync (default, low activity)
    return {
      mode: 'calm-sync',
      color: '#0088ff', // Blue
      intensity: 35,
      radius: 45,
      shimmer: 30,
    };
  }
  
  /**
   * SOUL-LINK ALIGNMENT CALCULATOR
   * Measures how well UI energy matches user energy
   */
  private calculateSoulLink(
    userState: UserInteractionState,
    auraMode: EntityAura['mode']
  ): { alignment: number; resonance: number; empathy: number } {
    const { interactionIntensity, isInFlow, flowDepth } = userState;
    
    // Alignment: Does aura mode match user state?
    let alignment = 50; // Base alignment
    
    if (auraMode === 'calm-sync' && interactionIntensity < 30) alignment = 90;
    if (auraMode === 'focus-sync' && isInFlow) alignment = 95;
    if (auraMode === 'alert-sync' && interactionIntensity > 50) alignment = 85;
    if (auraMode === 'overdrive-sync' && interactionIntensity > 75) alignment = 90;
    if (auraMode === 'guardian-mode') alignment = 100; // Always aligned in danger
    
    // Resonance: Connection quality (grows with session time)
    const sessionMinutes = (Date.now() - this.sessionStart) / 60000;
    const resonance = Math.min(100, sessionMinutes * 10 + this.connectionStrength);
    
    // Empathy: Responsiveness to user state
    const empathy = isInFlow ? Math.min(100, flowDepth * 1.2) : interactionIntensity;
    
    return { alignment, resonance, empathy };
  }
  
  /**
   * Main entity processing - called at 60fps
   */
  public process(
    dataVolatility: number,
    marketPressure: number,
    emotionalState: string,
    pageContext: string
  ): EntityOutput {
    // Track page visit
    const currentTime = this.pageVisits.get(pageContext) || 0;
    this.pageVisits.set(pageContext, currentTime + 1);
    
    // Analyze user interaction
    const userState = this.analyzeUserInteraction();
    
    // Update connection strength based on interaction
    this.connectionStrength = Math.min(100, userState.interactionIntensity * 0.8 + this.connectionStrength * 0.2);
    
    // Wake up entity if user is active
    if (userState.interactionIntensity > 10) {
      this.isAwake = true;
    }
    
    // Calculate tempo based on user state
    const baseTempo = 45; // Slow base tempo
    const tempo = baseTempo + (userState.interactionIntensity * 0.5); // 45-95 BPM
    
    // Generate harmonic pulse
    const presence = this.calculateHarmonicPulse(tempo);
    
    // Calculate symbiotic aura
    const aura = this.calculateSymbioticAura(
      userState,
      dataVolatility,
      marketPressure,
      emotionalState
    );
    
    // Calculate soul-link metrics
    const soulLink = this.calculateSoulLink(userState, aura.mode);
    
    return {
      presence,
      aura,
      userState,
      ...soulLink,
    };
  }
  
  /**
   * User interaction tracking methods
   * Called by event listeners in EntityProvider
   */
  public trackMouseMove(x: number, y: number): void {
    this.mousePositions.push({ x, y, time: Date.now() });
    
    // Keep only last 100 positions
    if (this.mousePositions.length > 100) {
      this.mousePositions.shift();
    }
  }
  
  public trackClick(): void {
    this.clicks.push(Date.now());
    
    // Keep only last 50 clicks
    if (this.clicks.length > 50) {
      this.clicks.shift();
    }
  }
  
  public trackScroll(): void {
    this.scrollEvents.push(Date.now());
    
    // Keep only last 50 scrolls
    if (this.scrollEvents.length > 50) {
      this.scrollEvents.shift();
    }
  }
  
  public trackKeyPress(): void {
    this.keyPresses.push(Date.now());
    
    // Keep only last 100 key presses
    if (this.keyPresses.length > 100) {
      this.keyPresses.shift();
    }
  }
  
  /**
   * Reset entity state (useful for testing)
   */
  public reset(): void {
    this.presencePhase = 0;
    this.mousePositions = [];
    this.clicks = [];
    this.scrollEvents = [];
    this.keyPresses = [];
    this.pageVisits.clear();
    this.sessionStart = Date.now();
    this.isAwake = false;
    this.connectionStrength = 0;
  }
}
