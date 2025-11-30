/**
 * 🔗 CROSS-SYSTEM HARMONIZER
 * 
 * Ensures all layers respond together as one organism.
 * Syncs Level 5-9 inside a master timeline.
 */

export interface SystemTimeline {
  globalTick: number;           // Master clock tick
  phase: number;                // 0-360 degrees (shared phase)
  tempo: number;                // BPM (beats per minute)
  
  // Layer sync states
  consciousnessSynced: boolean;  // Level 5
  behaviorSynced: boolean;       // Level 6
  symbioticSynced: boolean;      // Level 7
  holographicSynced: boolean;    // Level 8
  environmentalSynced: boolean;  // Level 9
  
  // Coherence
  globalCoherence: number;      // 0-100 (how aligned all systems are)
  harmonyScore: number;         // 0-100 (aesthetic harmony)
}

export interface SyncCommand {
  targetTick: number;
  layers: SystemLayer[];
  syncStrength: number;         // 0-1 (how forcefully to sync)
}

export type SystemLayer = 
  | 'consciousness'    // Level 5
  | 'behavior'         // Level 6
  | 'symbiotic'        // Level 7
  | 'holographic'      // Level 8
  | 'environmental'    // Level 9
  | 'fusion';          // Level 9.2

export class CrossSystemHarmonizer {
  private timeline: SystemTimeline;
  private startTime: number;
  private readonly BASE_TEMPO = 60; // 1Hz default

  constructor() {
    this.startTime = Date.now();
    this.timeline = {
      globalTick: 0,
      phase: 0,
      tempo: this.BASE_TEMPO,
      consciousnessSynced: true,
      behaviorSynced: true,
      symbioticSynced: true,
      holographicSynced: true,
      environmentalSynced: true,
      globalCoherence: 100,
      harmonyScore: 100
    };
  }

  // ============================================
  // TIMELINE UPDATE
  // ============================================

  public updateTimeline(deltaTime: number): SystemTimeline {
    // Increment global tick
    this.timeline.globalTick++;

    // Update phase (0-360 degrees)
    const phaseIncrement = (this.timeline.tempo / 60) * (deltaTime / 1000) * 360;
    this.timeline.phase = (this.timeline.phase + phaseIncrement) % 360;

    return this.timeline;
  }

  public setTempo(bpm: number): void {
    this.timeline.tempo = Math.max(30, Math.min(180, bpm));
  }

  // ============================================
  // LAYER SYNCHRONIZATION
  // ============================================

  public syncLayer(layer: SystemLayer, synced: boolean): void {
    switch (layer) {
      case 'consciousness':
        this.timeline.consciousnessSynced = synced;
        break;
      case 'behavior':
        this.timeline.behaviorSynced = synced;
        break;
      case 'symbiotic':
        this.timeline.symbioticSynced = synced;
        break;
      case 'holographic':
        this.timeline.holographicSynced = synced;
        break;
      case 'environmental':
        this.timeline.environmentalSynced = synced;
        break;
    }

    this.calculateCoherence();
  }

  public syncAll(): void {
    this.timeline.consciousnessSynced = true;
    this.timeline.behaviorSynced = true;
    this.timeline.symbioticSynced = true;
    this.timeline.holographicSynced = true;
    this.timeline.environmentalSynced = true;
    this.timeline.globalCoherence = 100;
  }

  // ============================================
  // COHERENCE CALCULATION
  // ============================================

  private calculateCoherence(): void {
    const layers = [
      this.timeline.consciousnessSynced,
      this.timeline.behaviorSynced,
      this.timeline.symbioticSynced,
      this.timeline.holographicSynced,
      this.timeline.environmentalSynced
    ];

    const syncedCount = layers.filter(l => l).length;
    this.timeline.globalCoherence = (syncedCount / layers.length) * 100;
  }

  // ============================================
  // HARMONY SCORING
  // ============================================

  public updateHarmonyScore(
    emotionalStability: number,
    behavioralCoherence: number,
    environmentalResonance: number,
    holographicAlignment: number
  ): void {
    // Harmony = weighted average of all system alignments
    this.timeline.harmonyScore = (
      emotionalStability * 0.25 +
      behavioralCoherence * 0.25 +
      environmentalResonance * 0.25 +
      holographicAlignment * 0.25
    );
  }

  // ============================================
  // PHASE SYNCHRONIZATION
  // ============================================

  public getPhaseForLayer(layer: SystemLayer): number {
    // Each layer can have phase offset
    const offsets: Record<SystemLayer, number> = {
      consciousness: 0,       // Base phase
      behavior: 90,           // Quarter cycle ahead
      symbiotic: 180,         // Half cycle
      holographic: 270,       // Three quarters
      environmental: 45,      // Slight offset
      fusion: 0               // Matches base
    };

    return (this.timeline.phase + offsets[layer]) % 360;
  }

  public getPhaseValue(layer: SystemLayer): number {
    // Convert phase to sine wave value (-1 to 1)
    const phase = this.getPhaseForLayer(layer);
    return Math.sin((phase * Math.PI) / 180);
  }

  // ============================================
  // GETTERS
  // ============================================

  public getTimeline(): SystemTimeline {
    return { ...this.timeline };
  }

  public getGlobalTick(): number {
    return this.timeline.globalTick;
  }

  public getGlobalPhase(): number {
    return this.timeline.phase;
  }

  public getTempo(): number {
    return this.timeline.tempo;
  }

  public getCoherence(): number {
    return this.timeline.globalCoherence;
  }

  public getHarmony(): number {
    return this.timeline.harmonyScore;
  }

  public isFullySynced(): boolean {
    return this.timeline.globalCoherence === 100;
  }

  public getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  public reset(): void {
    this.startTime = Date.now();
    this.timeline = {
      globalTick: 0,
      phase: 0,
      tempo: this.BASE_TEMPO,
      consciousnessSynced: true,
      behaviorSynced: true,
      symbioticSynced: true,
      holographicSynced: true,
      environmentalSynced: true,
      globalCoherence: 100,
      harmonyScore: 100
    };
  }
}
