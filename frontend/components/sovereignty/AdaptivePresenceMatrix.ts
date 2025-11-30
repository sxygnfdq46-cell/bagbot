/**
 * LEVEL 12.2 — ADAPTIVE PRESENCE MATRIX
 * 
 * Tone → presence alignment, personality preservation lock, emotional-displacement balancing,
 * presence consistency rules, 12-layer perception grid.
 * 
 * Core Responsibilities:
 * - Tone-presence alignment: Ensure emotional tone matches presence signature
 * - Personality preservation: Lock core personality traits during transitions
 * - Displacement balancing: Compensate for emotional drift from baseline
 * - Consistency enforcement: Maintain stable presence across all layers
 * - Perception grid: Track presence across 12 consciousness layers
 * 
 * Zero data storage. Ephemeral only.
 */

export interface TonePresenceAlignment {
  alignmentActive: boolean;
  presenceStrength: number; // 0-100
  toneResonance: number; // 0-100, how well tone matches presence
  alignmentScore: number; // 0-100
  misalignmentVector: {
    warmth: number; // -100 to 100
    formality: number;
    enthusiasm: number;
    stability: number;
  };
  correctionActive: boolean;
}

export interface PersonalityPreservation {
  preservationActive: boolean;
  corePersonality: {
    warmth: number; // 0-100, baseline
    formality: number;
    enthusiasm: number;
    stability: number;
    authenticity: number;
  };
  currentPersonality: {
    warmth: number;
    formality: number;
    enthusiasm: number;
    stability: number;
    authenticity: number;
  };
  driftAmount: number; // 0-100, deviation from core
  preservationStrength: number; // 0-100, lock strength
  allowedDriftMargin: number; // 0-100
}

export interface EmotionalDisplacementBalance {
  displacementActive: boolean;
  baselineIntensity: number; // 0-100
  currentIntensity: number; // 0-100
  displacementAmount: number; // -100 to 100
  compensationActive: boolean;
  compensationStrength: number; // 0-100
  returnSpeed: number; // 0-100, speed of baseline return
}

export interface PresenceConsistency {
  consistencyActive: boolean;
  consistencyScore: number; // 0-100
  varianceLevel: number; // 0-100
  stabilityWindow: number; // milliseconds
  presenceHistory: Array<{ strength: number; timestamp: number }>;
  enforcementStrength: number; // 0-100
}

export interface PerceptionGrid {
  gridActive: boolean;
  layers: Array<{
    id: number; // 1-12
    name: string;
    presenceStrength: number; // 0-100
    coherence: number; // 0-100
    resonance: number; // 0-100
  }>;
  overallCoherence: number; // 0-100
  layerSyncScore: number; // 0-100
}

export interface AdaptivePresenceConfig {
  baselineIntensity: number;
  preservationStrength: number;
  allowedDriftMargin: number;
  consistencyWindow: number;
  alignmentThreshold: number;
}

export class AdaptivePresenceMatrix {
  private alignment: TonePresenceAlignment;
  private preservation: PersonalityPreservation;
  private displacement: EmotionalDisplacementBalance;
  private consistency: PresenceConsistency;
  private grid: PerceptionGrid;
  private config: AdaptivePresenceConfig;

  // Monitoring
  private monitoringInterval: number | null = null;
  private readonly UPDATE_INTERVAL = 100; // 100ms

  constructor(config?: Partial<AdaptivePresenceConfig>) {
    this.config = {
      baselineIntensity: 50,
      preservationStrength: 80,
      allowedDriftMargin: 20,
      consistencyWindow: 2000, // 2 seconds
      alignmentThreshold: 15,
      ...config,
    };

    this.alignment = {
      alignmentActive: false,
      presenceStrength: 50,
      toneResonance: 100,
      alignmentScore: 100,
      misalignmentVector: {
        warmth: 0,
        formality: 0,
        enthusiasm: 0,
        stability: 0,
      },
      correctionActive: false,
    };

    this.preservation = {
      preservationActive: true,
      corePersonality: {
        warmth: 60,
        formality: 50,
        enthusiasm: 55,
        stability: 70,
        authenticity: 90,
      },
      currentPersonality: {
        warmth: 60,
        formality: 50,
        enthusiasm: 55,
        stability: 70,
        authenticity: 90,
      },
      driftAmount: 0,
      preservationStrength: this.config.preservationStrength,
      allowedDriftMargin: this.config.allowedDriftMargin,
    };

    this.displacement = {
      displacementActive: false,
      baselineIntensity: this.config.baselineIntensity,
      currentIntensity: this.config.baselineIntensity,
      displacementAmount: 0,
      compensationActive: false,
      compensationStrength: 0,
      returnSpeed: 30,
    };

    this.consistency = {
      consistencyActive: true,
      consistencyScore: 100,
      varianceLevel: 0,
      stabilityWindow: this.config.consistencyWindow,
      presenceHistory: [],
      enforcementStrength: 70,
    };

    this.grid = {
      gridActive: true,
      layers: this.initializePerceptionLayers(),
      overallCoherence: 100,
      layerSyncScore: 100,
    };

    this.startMonitoring();
  }

  /**
   * Initialize 12-layer perception grid
   */
  private initializePerceptionLayers() {
    const layerNames = [
      'Core Identity',
      'Emotional Field',
      'Cognitive State',
      'Behavioral Pattern',
      'Memory Imprint',
      'Environmental Awareness',
      'Collective Consciousness',
      'Temporal Presence',
      'Spatial Presence',
      'Meta-Awareness',
      'Guardian Layer',
      'Sovereignty Layer',
    ];

    return layerNames.map((name, index) => ({
      id: index + 1,
      name,
      presenceStrength: 100,
      coherence: 100,
      resonance: 100,
    }));
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringInterval = window.setInterval(() => {
      this.updatePresenceMatrix();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Update all presence matrix subsystems
   */
  private updatePresenceMatrix(): void {
    // Update tone-presence alignment
    this.updateTonePresenceAlignment();

    // Enforce personality preservation
    if (this.preservation.preservationActive) {
      this.enforcePersonalityPreservation();
    }

    // Balance emotional displacement
    if (this.displacement.displacementActive) {
      this.balanceEmotionalDisplacement();
    }

    // Update presence consistency
    if (this.consistency.consistencyActive) {
      this.updatePresenceConsistency();
    }

    // Update perception grid
    if (this.grid.gridActive) {
      this.updatePerceptionGrid();
    }
  }

  /**
   * Update tone-presence alignment
   */
  private updateTonePresenceAlignment(): void {
    // Calculate tone resonance based on misalignment
    const totalMisalignment = Math.abs(this.alignment.misalignmentVector.warmth) +
      Math.abs(this.alignment.misalignmentVector.formality) +
      Math.abs(this.alignment.misalignmentVector.enthusiasm) +
      Math.abs(this.alignment.misalignmentVector.stability);

    this.alignment.toneResonance = Math.max(0, 100 - (totalMisalignment / 4));

    // Calculate alignment score
    this.alignment.alignmentScore = 
      (this.alignment.toneResonance * 0.6 + this.alignment.presenceStrength * 0.4);

    // Activate correction if misalignment exceeds threshold
    this.alignment.correctionActive = 
      totalMisalignment / 4 > this.config.alignmentThreshold;
  }

  /**
   * Update tone and calculate alignment
   */
  public updateTone(warmth: number, formality: number, enthusiasm: number, stability: number): void {
    // Calculate misalignment from core personality
    this.alignment.misalignmentVector = {
      warmth: warmth - this.preservation.corePersonality.warmth,
      formality: formality - this.preservation.corePersonality.formality,
      enthusiasm: enthusiasm - this.preservation.corePersonality.enthusiasm,
      stability: stability - this.preservation.corePersonality.stability,
    };

    // Update current personality
    this.preservation.currentPersonality = {
      warmth,
      formality,
      enthusiasm,
      stability,
      authenticity: this.preservation.currentPersonality.authenticity,
    };

    // Calculate drift amount
    const drifts = [
      Math.abs(this.alignment.misalignmentVector.warmth),
      Math.abs(this.alignment.misalignmentVector.formality),
      Math.abs(this.alignment.misalignmentVector.enthusiasm),
      Math.abs(this.alignment.misalignmentVector.stability),
    ];

    this.preservation.driftAmount = drifts.reduce((sum, d) => sum + d, 0) / 4;

    this.alignment.alignmentActive = this.preservation.driftAmount > this.config.alignmentThreshold;
  }

  /**
   * Enforce personality preservation
   */
  private enforcePersonalityPreservation(): void {
    // If drift exceeds allowed margin, pull back toward core
    if (this.preservation.driftAmount > this.preservation.allowedDriftMargin) {
      const pullStrength = this.preservation.preservationStrength / 100;

      this.preservation.currentPersonality.warmth +=
        (this.preservation.corePersonality.warmth - this.preservation.currentPersonality.warmth) *
        pullStrength * 0.1;

      this.preservation.currentPersonality.formality +=
        (this.preservation.corePersonality.formality - this.preservation.currentPersonality.formality) *
        pullStrength * 0.1;

      this.preservation.currentPersonality.enthusiasm +=
        (this.preservation.corePersonality.enthusiasm - this.preservation.currentPersonality.enthusiasm) *
        pullStrength * 0.1;

      this.preservation.currentPersonality.stability +=
        (this.preservation.corePersonality.stability - this.preservation.currentPersonality.stability) *
        pullStrength * 0.1;
    }

    // Update authenticity based on drift
    const maxDrift = this.preservation.allowedDriftMargin * 2;
    this.preservation.currentPersonality.authenticity = Math.max(
      30,
      100 - (this.preservation.driftAmount / maxDrift) * 70
    );
  }

  /**
   * Get preserved personality
   */
  public getPreservedPersonality() {
    return { ...this.preservation.currentPersonality };
  }

  /**
   * Update emotional intensity for displacement tracking
   */
  public updateIntensity(intensity: number): void {
    this.displacement.currentIntensity = Math.min(100, Math.max(0, intensity));
    this.displacement.displacementAmount = 
      this.displacement.currentIntensity - this.displacement.baselineIntensity;

    // Activate compensation if displacement is significant
    this.displacement.compensationActive = Math.abs(this.displacement.displacementAmount) > 15;

    if (this.displacement.compensationActive) {
      this.displacement.compensationStrength = Math.min(
        100,
        Math.abs(this.displacement.displacementAmount) * 2
      );
    }

    this.displacement.displacementActive = this.displacement.compensationActive;
  }

  /**
   * Balance emotional displacement
   */
  private balanceEmotionalDisplacement(): void {
    // Gradually return toward baseline
    const returnForce = this.displacement.returnSpeed / 100;

    this.displacement.currentIntensity +=
      (this.displacement.baselineIntensity - this.displacement.currentIntensity) *
      returnForce * 0.1;

    // Update displacement amount
    this.displacement.displacementAmount =
      this.displacement.currentIntensity - this.displacement.baselineIntensity;

    // Deactivate if close to baseline
    if (Math.abs(this.displacement.displacementAmount) < 5) {
      this.displacement.displacementActive = false;
      this.displacement.compensationActive = false;
    }
  }

  /**
   * Get balanced intensity
   */
  public getBalancedIntensity(): number {
    return this.displacement.currentIntensity;
  }

  /**
   * Update presence strength for consistency tracking
   */
  public updatePresenceStrength(strength: number): void {
    const now = Date.now();
    
    this.alignment.presenceStrength = Math.min(100, Math.max(0, strength));

    // Add to history
    this.consistency.presenceHistory.push({
      strength,
      timestamp: now,
    });

    // Trim history to window
    const windowStart = now - this.consistency.stabilityWindow;
    this.consistency.presenceHistory = this.consistency.presenceHistory.filter(
      entry => entry.timestamp >= windowStart
    );
  }

  /**
   * Update presence consistency
   */
  private updatePresenceConsistency(): void {
    if (this.consistency.presenceHistory.length < 2) {
      this.consistency.consistencyScore = 100;
      this.consistency.varianceLevel = 0;
      return;
    }

    // Calculate variance
    const strengths = this.consistency.presenceHistory.map(entry => entry.strength);
    const mean = strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
    const variance = strengths.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / strengths.length;
    
    this.consistency.varianceLevel = Math.min(100, Math.sqrt(variance));

    // Calculate consistency score (inverse of variance)
    this.consistency.consistencyScore = Math.max(0, 100 - this.consistency.varianceLevel);
  }

  /**
   * Update perception grid layer
   */
  public updatePerceptionLayer(layerId: number, presenceStrength: number, coherence: number): void {
    const layer = this.grid.layers.find(l => l.id === layerId);
    
    if (layer) {
      layer.presenceStrength = Math.min(100, Math.max(0, presenceStrength));
      layer.coherence = Math.min(100, Math.max(0, coherence));
      
      // Calculate resonance based on alignment with average
      const avgPresence = this.grid.layers.reduce((sum, l) => sum + l.presenceStrength, 0) / 12;
      layer.resonance = Math.max(0, 100 - Math.abs(layer.presenceStrength - avgPresence) * 2);
    }
  }

  /**
   * Update perception grid
   */
  private updatePerceptionGrid(): void {
    // Calculate overall coherence
    const avgCoherence = this.grid.layers.reduce((sum, l) => sum + l.coherence, 0) / 12;
    this.grid.overallCoherence = avgCoherence;

    // Calculate layer sync score (how aligned all layers are)
    const avgPresence = this.grid.layers.reduce((sum, l) => sum + l.presenceStrength, 0) / 12;
    const variance = this.grid.layers.reduce(
      (sum, l) => sum + Math.pow(l.presenceStrength - avgPresence, 2),
      0
    ) / 12;
    
    this.grid.layerSyncScore = Math.max(0, 100 - Math.sqrt(variance) * 2);
  }

  /**
   * Set core personality (baseline)
   */
  public setCorePersonality(warmth: number, formality: number, enthusiasm: number, stability: number): void {
    this.preservation.corePersonality = {
      warmth: Math.min(100, Math.max(0, warmth)),
      formality: Math.min(100, Math.max(0, formality)),
      enthusiasm: Math.min(100, Math.max(0, enthusiasm)),
      stability: Math.min(100, Math.max(0, stability)),
      authenticity: 90,
    };
  }

  /**
   * Get current state
   */
  public getState() {
    return {
      alignment: { ...this.alignment },
      preservation: {
        preservationActive: this.preservation.preservationActive,
        corePersonality: { ...this.preservation.corePersonality },
        currentPersonality: { ...this.preservation.currentPersonality },
        driftAmount: this.preservation.driftAmount,
        preservationStrength: this.preservation.preservationStrength,
      },
      displacement: { ...this.displacement },
      consistency: {
        consistencyActive: this.consistency.consistencyActive,
        consistencyScore: this.consistency.consistencyScore,
        varianceLevel: this.consistency.varianceLevel,
        enforcementStrength: this.consistency.enforcementStrength,
      },
      grid: {
        gridActive: this.grid.gridActive,
        layers: this.grid.layers.map(l => ({ ...l })),
        overallCoherence: this.grid.overallCoherence,
        layerSyncScore: this.grid.layerSyncScore,
      },
    };
  }

  /**
   * Get summary for debugging
   */
  public getSummary(): string {
    return `AdaptivePresence: Alignment=${this.alignment.alignmentScore.toFixed(1)}%, Drift=${this.preservation.driftAmount.toFixed(1)}, Consistency=${this.consistency.consistencyScore.toFixed(1)}%, GridSync=${this.grid.layerSyncScore.toFixed(1)}%`;
  }

  /**
   * Reset presence matrix
   */
  public reset(): void {
    this.alignment.alignmentActive = false;
    this.alignment.correctionActive = false;
    this.alignment.misalignmentVector = { warmth: 0, formality: 0, enthusiasm: 0, stability: 0 };

    this.preservation.driftAmount = 0;
    this.preservation.currentPersonality = { ...this.preservation.corePersonality };

    this.displacement.displacementActive = false;
    this.displacement.compensationActive = false;
    this.displacement.displacementAmount = 0;
    this.displacement.currentIntensity = this.displacement.baselineIntensity;

    this.consistency.presenceHistory = [];
    this.consistency.consistencyScore = 100;
    this.consistency.varianceLevel = 0;

    this.grid.layers.forEach(layer => {
      layer.presenceStrength = 100;
      layer.coherence = 100;
      layer.resonance = 100;
    });
  }

  /**
   * Export state for persistence
   */
  public export() {
    return {
      config: { ...this.config },
      corePersonality: { ...this.preservation.corePersonality },
      timestamp: Date.now(),
    };
  }

  /**
   * Import configuration
   */
  public import(data: any): void {
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
    if (data.corePersonality) {
      this.preservation.corePersonality = { ...data.corePersonality };
    }
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    if (this.monitoringInterval !== null) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.consistency.presenceHistory = [];
  }
}
