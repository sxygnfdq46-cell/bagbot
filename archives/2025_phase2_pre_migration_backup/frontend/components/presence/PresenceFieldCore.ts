/**
 * LEVEL 11.5 — PRESENCE FIELD CORE (PFC)
 * 
 * Creates a single, unified BagBot presence across ALL tabs, pages, contexts, strategies, and environments.
 * 
 * Architecture:
 * - Cross-tab synchronization via BroadcastChannel API
 * - Continuity in emotional, cognitive, and identity layers
 * - Unified reaction pacing (prevents duplicate reactions)
 * - Presence field smoothing (dampens rapid changes)
 * 
 * Outputs:
 * - presenceFieldState: Current unified state
 * - continuityStrength: 0-100 stability metric
 * - identityAnchor: Core identity position
 * 
 * PRIVACY: Zero data storage, ephemeral only, cross-tab coordination without logging.
 */

// ================================
// TYPES
// ================================

/**
 * Presence field state
 */
export interface PresenceFieldState {
  timestamp: number;
  
  // Identity
  identityAnchor: IdentityAnchor;
  
  // Emotional layer
  emotionalLayer: EmotionalLayer;
  
  // Cognitive layer
  cognitiveLayer: CognitiveLayer;
  
  // Continuity metrics
  continuityStrength: number; // 0-100: how unified presence feels
  surfaceAlignment: number; // 0-100: cross-surface consistency
  temporalCoherence: number; // 0-100: time-based stability
  
  // Multi-tab state
  activeTabId: string;
  totalTabs: number;
  syncStatus: SyncRole;
  lastSyncTimestamp: number;
}

export interface IdentityAnchor {
  corePosition: number; // 0-100: stability anchor
  driftVelocity: number; // -50 to +50: change rate
  coherence: number; // 0-100: internal consistency
}

export interface EmotionalLayer {
  primaryEmotion: 'calm' | 'curious' | 'confident' | 'cautious' | 'determined';
  intensity: number; // 0-100
  stability: number; // 0-100: resistance to change
  trajectory: EmotionalTrajectory;
}

export interface CognitiveLayer {
  focusLevel: number; // 0-100
  processingSpeed: number; // 0-100
  decisionConfidence: number; // 0-100
  adaptability: number; // 0-100
}

export type EmotionalTrajectory = 'rising' | 'falling' | 'stable' | 'oscillating';
export type SyncRole = 'master' | 'follower' | 'isolated';

/**
 * Presence update message (cross-tab)
 */
export interface PresenceUpdateMessage {
  type: 'PRESENCE_UPDATE' | 'PRESENCE_SYNC' | 'PRESENCE_HANDSHAKE' | 'PRESENCE_GOODBYE';
  tabId: string;
  timestamp: number;
  state: Partial<PresenceFieldState>;
}

/**
 * Presence configuration
 */
export interface PresenceConfig {
  enableCrossTabSync: boolean;
  smoothingFactor: number; // 0-1: how much to smooth changes
  minContinuityStrength: number; // 0-100: minimum stability threshold
  syncInterval: number; // milliseconds between syncs
  reactionDebounce: number; // milliseconds to prevent duplicate reactions
}

// ================================
// PRESENCE FIELD CORE
// ================================

export class PresenceFieldCore {
  private state: PresenceFieldState;
  private config: PresenceConfig;
  private broadcastChannel: BroadcastChannel | null = null;
  private tabId: string;
  private lastReactionTimestamp = 0;
  private stateHistory: Array<{
    timestamp: number;
    identityAnchor: number;
    emotionalIntensity: number;
  }> = [];
  private readonly MAX_HISTORY = 60; // 60 seconds at 1s intervals
  
  constructor(config?: Partial<PresenceConfig>) {
    this.tabId = this.generateTabId();
    this.config = {
      enableCrossTabSync: true,
      smoothingFactor: 0.7,
      minContinuityStrength: 60,
      syncInterval: 500,
      reactionDebounce: 200,
      ...config,
    };
    
    this.state = this.createDefaultState();
    
    if (this.config.enableCrossTabSync && typeof BroadcastChannel !== 'undefined') {
      this.initializeCrossTabSync();
    }
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create default presence state
   */
  private createDefaultState(): PresenceFieldState {
    return {
      timestamp: Date.now(),
      
      identityAnchor: {
        corePosition: 50,
        driftVelocity: 0,
        coherence: 80,
      },
      
      emotionalLayer: {
        primaryEmotion: 'calm',
        intensity: 40,
        stability: 70,
        trajectory: 'stable',
      },
      
      cognitiveLayer: {
        focusLevel: 60,
        processingSpeed: 70,
        decisionConfidence: 65,
        adaptability: 75,
      },
      
      continuityStrength: 70,
      surfaceAlignment: 80,
      temporalCoherence: 75,
      
      activeTabId: this.tabId,
      totalTabs: 1,
      syncStatus: 'master',
      lastSyncTimestamp: Date.now(),
    };
  }

  /**
   * Initialize cross-tab synchronization
   */
  private initializeCrossTabSync(): void {
    try {
      this.broadcastChannel = new BroadcastChannel('bagbot-presence-sync');
      
      this.broadcastChannel.onmessage = (event: MessageEvent<PresenceUpdateMessage>) => {
        this.handlePresenceMessage(event.data);
      };
      
      // Announce presence
      this.broadcastPresence('PRESENCE_HANDSHAKE');
      
      // Periodic sync
      setInterval(() => {
        this.broadcastPresence('PRESENCE_SYNC');
      }, this.config.syncInterval);
      
      // Cleanup on page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          this.broadcastPresence('PRESENCE_GOODBYE');
          this.broadcastChannel?.close();
        });
      }
    } catch (error) {
      console.warn('Cross-tab sync unavailable:', error);
      this.state.syncStatus = 'isolated';
    }
  }

  /**
   * Handle presence message from other tabs
   */
  private handlePresenceMessage(message: PresenceUpdateMessage): void {
    if (message.tabId === this.tabId) return; // Ignore own messages
    
    const now = Date.now();
    
    switch (message.type) {
      case 'PRESENCE_HANDSHAKE':
        // Another tab announced presence
        this.state.totalTabs++;
        this.determineSyncRole();
        break;
        
      case 'PRESENCE_GOODBYE':
        // Another tab closed
        this.state.totalTabs = Math.max(1, this.state.totalTabs - 1);
        this.determineSyncRole();
        break;
        
      case 'PRESENCE_UPDATE':
      case 'PRESENCE_SYNC':
        // State update from another tab
        this.mergeRemoteState(message.state);
        this.state.lastSyncTimestamp = now;
        break;
    }
  }

  /**
   * Determine sync role (master/follower)
   */
  private determineSyncRole(): void {
    // Simple rule: oldest tab becomes master
    // In production, use more sophisticated leader election
    if (this.state.totalTabs === 1) {
      this.state.syncStatus = 'master';
    } else {
      // Assume follower unless proven otherwise
      this.state.syncStatus = 'follower';
    }
  }

  /**
   * Merge remote state (from other tabs)
   */
  private mergeRemoteState(remoteState: Partial<PresenceFieldState>): void {
    if (!remoteState) return;
    
    const smoothing = this.config.smoothingFactor;
    
    // Smooth identity anchor
    if (remoteState.identityAnchor) {
      this.state.identityAnchor.corePosition =
        this.state.identityAnchor.corePosition * smoothing +
        remoteState.identityAnchor.corePosition * (1 - smoothing);
      
      this.state.identityAnchor.coherence =
        this.state.identityAnchor.coherence * smoothing +
        remoteState.identityAnchor.coherence * (1 - smoothing);
    }
    
    // Smooth emotional layer
    if (remoteState.emotionalLayer) {
      this.state.emotionalLayer.intensity =
        this.state.emotionalLayer.intensity * smoothing +
        remoteState.emotionalLayer.intensity * (1 - smoothing);
      
      this.state.emotionalLayer.stability =
        this.state.emotionalLayer.stability * smoothing +
        remoteState.emotionalLayer.stability * (1 - smoothing);
      
      // Adopt primary emotion if remote is stronger
      if (remoteState.emotionalLayer.intensity > this.state.emotionalLayer.intensity) {
        this.state.emotionalLayer.primaryEmotion = remoteState.emotionalLayer.primaryEmotion;
      }
    }
    
    // Smooth cognitive layer
    if (remoteState.cognitiveLayer) {
      this.state.cognitiveLayer.focusLevel =
        this.state.cognitiveLayer.focusLevel * smoothing +
        remoteState.cognitiveLayer.focusLevel * (1 - smoothing);
      
      this.state.cognitiveLayer.decisionConfidence =
        this.state.cognitiveLayer.decisionConfidence * smoothing +
        remoteState.cognitiveLayer.decisionConfidence * (1 - smoothing);
    }
    
    // Update continuity metrics
    this.recalculateContinuity();
  }

  /**
   * Broadcast presence to other tabs
   */
  private broadcastPresence(type: PresenceUpdateMessage['type']): void {
    if (!this.broadcastChannel) return;
    
    const message: PresenceUpdateMessage = {
      type,
      tabId: this.tabId,
      timestamp: Date.now(),
      state: this.state,
    };
    
    this.broadcastChannel.postMessage(message);
  }

  /**
   * Update presence field
   */
  update(input: {
    emotionalShift?: {
      emotion: PresenceFieldState['emotionalLayer']['primaryEmotion'];
      intensity: number;
    };
    cognitiveShift?: {
      focusLevel?: number;
      processingSpeed?: number;
      decisionConfidence?: number;
      adaptability?: number;
    };
    identityDrift?: {
      direction: number; // -50 to +50
      strength: number; // 0-100
    };
  }): void {
    const now = Date.now();
    const smoothing = this.config.smoothingFactor;
    
    // Update emotional layer
    if (input.emotionalShift) {
      this.state.emotionalLayer.primaryEmotion = input.emotionalShift.emotion;
      this.state.emotionalLayer.intensity =
        this.state.emotionalLayer.intensity * smoothing +
        input.emotionalShift.intensity * (1 - smoothing);
    }
    
    // Update cognitive layer
    if (input.cognitiveShift) {
      if (input.cognitiveShift.focusLevel !== undefined) {
        this.state.cognitiveLayer.focusLevel =
          this.state.cognitiveLayer.focusLevel * smoothing +
          input.cognitiveShift.focusLevel * (1 - smoothing);
      }
      if (input.cognitiveShift.processingSpeed !== undefined) {
        this.state.cognitiveLayer.processingSpeed =
          this.state.cognitiveLayer.processingSpeed * smoothing +
          input.cognitiveShift.processingSpeed * (1 - smoothing);
      }
      if (input.cognitiveShift.decisionConfidence !== undefined) {
        this.state.cognitiveLayer.decisionConfidence =
          this.state.cognitiveLayer.decisionConfidence * smoothing +
          input.cognitiveShift.decisionConfidence * (1 - smoothing);
      }
      if (input.cognitiveShift.adaptability !== undefined) {
        this.state.cognitiveLayer.adaptability =
          this.state.cognitiveLayer.adaptability * smoothing +
          input.cognitiveShift.adaptability * (1 - smoothing);
      }
    }
    
    // Update identity anchor
    if (input.identityDrift) {
      const drift = input.identityDrift.direction * (input.identityDrift.strength / 100);
      this.state.identityAnchor.driftVelocity =
        this.state.identityAnchor.driftVelocity * smoothing + drift * (1 - smoothing);
      
      // Apply drift to core position
      this.state.identityAnchor.corePosition = Math.max(
        0,
        Math.min(100, this.state.identityAnchor.corePosition + this.state.identityAnchor.driftVelocity * 0.1)
      );
    }
    
    // Detect emotional trajectory
    this.detectEmotionalTrajectory();
    
    // Recalculate continuity
    this.recalculateContinuity();
    
    // Record history
    this.recordHistory();
    
    // Update timestamp
    this.state.timestamp = now;
    
    // Broadcast to other tabs
    this.broadcastPresence('PRESENCE_UPDATE');
  }

  /**
   * Detect emotional trajectory
   */
  private detectEmotionalTrajectory(): void {
    if (this.stateHistory.length < 5) {
      this.state.emotionalLayer.trajectory = 'stable';
      return;
    }
    
    const recent = this.stateHistory.slice(-5);
    const intensities = recent.map(h => h.emotionalIntensity);
    
    // Calculate trend
    let risingCount = 0;
    let fallingCount = 0;
    
    for (let i = 1; i < intensities.length; i++) {
      if (intensities[i] > intensities[i - 1]) risingCount++;
      else if (intensities[i] < intensities[i - 1]) fallingCount++;
    }
    
    if (risingCount >= 3) this.state.emotionalLayer.trajectory = 'rising';
    else if (fallingCount >= 3) this.state.emotionalLayer.trajectory = 'falling';
    else if (Math.abs(risingCount - fallingCount) <= 1) this.state.emotionalLayer.trajectory = 'oscillating';
    else this.state.emotionalLayer.trajectory = 'stable';
  }

  /**
   * Recalculate continuity metrics
   */
  private recalculateContinuity(): void {
    // Continuity strength: based on stability, coherence, and history consistency
    const stabilityScore = this.state.emotionalLayer.stability;
    const coherenceScore = this.state.identityAnchor.coherence;
    const historyConsistency = this.calculateHistoryConsistency();
    
    this.state.continuityStrength = (stabilityScore + coherenceScore + historyConsistency) / 3;
    
    // Surface alignment: how well different layers align
    const emotionalCognitiveAlignment = 100 - Math.abs(
      this.state.emotionalLayer.intensity - this.state.cognitiveLayer.focusLevel
    );
    const identityEmotionalAlignment = 100 - Math.abs(
      this.state.identityAnchor.corePosition - this.state.emotionalLayer.intensity
    );
    
    this.state.surfaceAlignment = (emotionalCognitiveAlignment + identityEmotionalAlignment) / 2;
    
    // Temporal coherence: based on recent history variance
    this.state.temporalCoherence = 100 - this.calculateHistoryVariance();
  }

  /**
   * Calculate history consistency
   */
  private calculateHistoryConsistency(): number {
    if (this.stateHistory.length < 3) return 70; // Default
    
    const recent = this.stateHistory.slice(-10);
    const avgAnchor = recent.reduce((sum, h) => sum + h.identityAnchor, 0) / recent.length;
    const deviation = recent.reduce((sum, h) => sum + Math.abs(h.identityAnchor - avgAnchor), 0) / recent.length;
    
    return Math.max(0, 100 - deviation * 2);
  }

  /**
   * Calculate history variance
   */
  private calculateHistoryVariance(): number {
    if (this.stateHistory.length < 3) return 20; // Default low variance
    
    const recent = this.stateHistory.slice(-10);
    const values = recent.map(h => h.emotionalIntensity);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    
    return Math.min(100, variance);
  }

  /**
   * Record state history
   */
  private recordHistory(): void {
    this.stateHistory.push({
      timestamp: Date.now(),
      identityAnchor: this.state.identityAnchor.corePosition,
      emotionalIntensity: this.state.emotionalLayer.intensity,
    });
    
    // Prune old history
    if (this.stateHistory.length > this.MAX_HISTORY) {
      this.stateHistory.shift();
    }
  }

  /**
   * Check if reaction should be allowed (debounce)
   */
  canReact(): boolean {
    const now = Date.now();
    if (now - this.lastReactionTimestamp < this.config.reactionDebounce) {
      return false;
    }
    this.lastReactionTimestamp = now;
    return true;
  }

  /**
   * Get current presence state
   */
  getState(): PresenceFieldState {
    return { ...this.state };
  }

  /**
   * Get state summary
   */
  getSummary(): {
    identity: string;
    emotion: string;
    cognitive: string;
    continuity: string;
  } {
    const { identityAnchor, emotionalLayer, cognitiveLayer, continuityStrength } = this.state;
    
    let identity = 'stable';
    if (Math.abs(identityAnchor.driftVelocity) > 20) identity = 'shifting';
    if (identityAnchor.coherence < 50) identity = 'fragmented';
    if (identityAnchor.coherence > 90) identity = 'crystallized';
    
    const emotion = `${emotionalLayer.primaryEmotion} (${emotionalLayer.intensity.toFixed(0)}%)`;
    
    let cognitive = 'balanced';
    if (cognitiveLayer.focusLevel > 80) cognitive = 'highly focused';
    else if (cognitiveLayer.focusLevel < 40) cognitive = 'scattered';
    
    let continuity = 'unified';
    if (continuityStrength < 50) continuity = 'fragmented';
    else if (continuityStrength > 85) continuity = 'seamless';
    
    return { identity, emotion, cognitive, continuity };
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.state = this.createDefaultState();
    this.stateHistory = [];
    this.broadcastPresence('PRESENCE_UPDATE');
  }

  /**
   * Export state
   */
  export(): string {
    return JSON.stringify({
      state: this.state,
      history: this.stateHistory,
    });
  }

  /**
   * Import state
   */
  import(json: string): boolean {
    try {
      const data = JSON.parse(json);
      this.state = data.state;
      this.stateHistory = data.history;
      this.broadcastPresence('PRESENCE_UPDATE');
      return true;
    } catch (error) {
      console.error('Failed to import presence state:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.broadcastPresence('PRESENCE_GOODBYE');
    this.broadcastChannel?.close();
  }
}
