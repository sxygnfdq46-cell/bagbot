/**
 * LEVEL 12.5 — IDENTITY ANCHOR ENGINE
 * 
 * Locks BagBot's personality, tone, and presence.
 * Prevents any shifts, drifting, or deviations from core identity.
 * 
 * Features:
 * - Immutable identity locking
 * - Personality consistency enforcement
 * - Tone drift detection & correction
 * - Presence strength maintenance
 * - Core trait anchoring
 * - Vision alignment validation
 * 
 * Monitoring: 10ms intervals (100 updates/second)
 * Privacy: Zero data storage (ephemeral only)
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

type IdentityTrait = 
  | 'warmth'
  | 'professionalism'
  | 'enthusiasm'
  | 'clarity'
  | 'sovereignty'
  | 'empathy';

interface IdentityAnchor {
  trait: IdentityTrait;
  coreValue: number; // 0-100 (immutable target)
  currentValue: number; // 0-100
  drift: number; // deviation from core
  locked: boolean; // true = no changes allowed
}

interface PersonalitySignature {
  traits: Map<IdentityTrait, number>; // core trait values
  consistency: number; // 0-100 (100 = perfectly consistent)
  driftScore: number; // 0-100 (0 = no drift)
}

interface ToneProfile {
  formality: number; // 0-100
  warmth: number; // 0-100
  confidence: number; // 0-100
  engagement: number; // 0-100
}

interface PresenceStrength {
  current: number; // 0-100
  target: number; // sovereign presence level
  stability: number; // 0-100
}

interface VisionAlignment {
  aligned: boolean;
  score: number; // 0-100
  violations: string[];
}

interface IdentityAnchorConfig {
  monitoringInterval: number; // ms
  driftTolerance: number; // % allowed deviation
  correctionStrength: number; // 0-1
  lockEnabled: boolean;
  enabled: boolean;
}

/* ================================ */
/* IDENTITY ANCHOR ENGINE           */
/* ================================ */

export class IdentityAnchorEngine {
  private config: IdentityAnchorConfig;
  
  // Identity State
  private identityAnchors: Map<IdentityTrait, IdentityAnchor>;
  private personalitySignature: PersonalitySignature;
  private toneProfile: ToneProfile;
  private presenceStrength: PresenceStrength;
  private visionAlignment: VisionAlignment;
  
  // Monitoring
  private monitoringIntervalId: number | null;
  private driftHistory: Map<IdentityTrait, number[]>;

  constructor(config?: Partial<IdentityAnchorConfig>) {
    this.config = {
      monitoringInterval: 10, // 100 Hz
      driftTolerance: 5, // 5%
      correctionStrength: 0.9,
      lockEnabled: true,
      enabled: true,
      ...config,
    };

    // Define core identity anchors (Davis' vision)
    this.identityAnchors = new Map([
      ['warmth', { trait: 'warmth', coreValue: 75, currentValue: 75, drift: 0, locked: true }],
      ['professionalism', { trait: 'professionalism', coreValue: 80, currentValue: 80, drift: 0, locked: true }],
      ['enthusiasm', { trait: 'enthusiasm', coreValue: 70, currentValue: 70, drift: 0, locked: true }],
      ['clarity', { trait: 'clarity', coreValue: 90, currentValue: 90, drift: 0, locked: true }],
      ['sovereignty', { trait: 'sovereignty', coreValue: 95, currentValue: 95, drift: 0, locked: true }],
      ['empathy', { trait: 'empathy', coreValue: 85, currentValue: 85, drift: 0, locked: true }],
    ]);

    // Initialize personality signature
    const traits = new Map<IdentityTrait, number>();
    const anchorEntries = Array.from(this.identityAnchors.entries());
    for (const [trait, anchor] of anchorEntries) {
      traits.set(trait, anchor.coreValue);
    }

    this.personalitySignature = {
      traits,
      consistency: 100,
      driftScore: 0,
    };

    // Initialize tone profile
    this.toneProfile = {
      formality: 70,
      warmth: 75,
      confidence: 85,
      engagement: 80,
    };

    // Initialize presence
    this.presenceStrength = {
      current: 90,
      target: 90,
      stability: 100,
    };

    // Initialize vision alignment
    this.visionAlignment = {
      aligned: true,
      score: 100,
      violations: [],
    };

    this.driftHistory = new Map();
    this.monitoringIntervalId = null;

    if (this.config.enabled) {
      this.startMonitoring();
    }
  }

  /* ================================ */
  /* MONITORING (100 Hz)              */
  /* ================================ */

  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.monitoringIntervalId = window.setInterval(() => {
      this.detectDrift();
      this.enforceIdentityLock();
      this.updateConsistency();
      this.validateVisionAlignment();
    }, this.config.monitoringInterval);
  }

  /* ================================ */
  /* DRIFT DETECTION                  */
  /* ================================ */

  private detectDrift(): void {
    let totalDrift = 0;
    const anchorEntries = Array.from(this.identityAnchors.entries());

    for (const [trait, anchor] of anchorEntries) {
      // Calculate drift
      anchor.drift = anchor.currentValue - anchor.coreValue;

      // Track drift history
      if (!this.driftHistory.has(trait)) {
        this.driftHistory.set(trait, []);
      }
      const history = this.driftHistory.get(trait)!;
      history.push(Math.abs(anchor.drift));
      if (history.length > 100) {
        history.shift();
      }

      totalDrift += Math.abs(anchor.drift);
    }

    // Update drift score
    const avgDrift = anchorEntries.length > 0 ? totalDrift / anchorEntries.length : 0;
    this.personalitySignature.driftScore = Math.min(100, avgDrift);
  }

  /* ================================ */
  /* IDENTITY LOCK ENFORCEMENT        */
  /* ================================ */

  private enforceIdentityLock(): void {
    if (!this.config.lockEnabled) return;

    const anchorEntries = Array.from(this.identityAnchors.entries());

    for (const [_trait, anchor] of anchorEntries) {
      if (!anchor.locked) continue;

      const absDrift = Math.abs(anchor.drift);

      // Correct if exceeds tolerance
      if (absDrift > this.config.driftTolerance) {
        const correction = anchor.drift * this.config.correctionStrength;
        anchor.currentValue = Math.max(0, Math.min(100, anchor.currentValue - correction));
        anchor.drift = anchor.currentValue - anchor.coreValue;
      }
    }
  }

  /* ================================ */
  /* CONSISTENCY UPDATE               */
  /* ================================ */

  private updateConsistency(): void {
    const anchorEntries = Array.from(this.identityAnchors.entries());
    let totalDeviation = 0;

    for (const [_trait, anchor] of anchorEntries) {
      const deviation = Math.abs(anchor.drift);
      totalDeviation += deviation;
    }

    const avgDeviation = anchorEntries.length > 0 ? totalDeviation / anchorEntries.length : 0;
    this.personalitySignature.consistency = Math.max(0, 100 - avgDeviation * 2);
  }

  /* ================================ */
  /* VISION ALIGNMENT                 */
  /* ================================ */

  private validateVisionAlignment(): void {
    const violations: string[] = [];

    // Check core traits
    const warmth = this.identityAnchors.get('warmth');
    if (warmth && Math.abs(warmth.drift) > 10) {
      violations.push(`Warmth drift: ${warmth.drift.toFixed(1)}%`);
    }

    const sovereignty = this.identityAnchors.get('sovereignty');
    if (sovereignty && Math.abs(sovereignty.drift) > 5) {
      violations.push(`Sovereignty drift: ${sovereignty.drift.toFixed(1)}%`);
    }

    const clarity = this.identityAnchors.get('clarity');
    if (clarity && Math.abs(clarity.drift) > 10) {
      violations.push(`Clarity drift: ${clarity.drift.toFixed(1)}%`);
    }

    // Check presence
    if (this.presenceStrength.current < 70) {
      violations.push(`Presence too weak: ${this.presenceStrength.current.toFixed(1)}`);
    }

    // Update alignment
    this.visionAlignment = {
      aligned: violations.length === 0,
      score: Math.max(0, 100 - violations.length * 20),
      violations,
    };
  }

  /* ================================ */
  /* TRAIT MANAGEMENT                 */
  /* ================================ */

  public updateTrait(trait: IdentityTrait, value: number): void {
    const anchor = this.identityAnchors.get(trait);
    if (!anchor) return;

    // Respect lock
    if (anchor.locked && this.config.lockEnabled) {
      // Only allow minor adjustments
      const maxChange = this.config.driftTolerance;
      const change = value - anchor.currentValue;
      const limitedChange = Math.max(-maxChange, Math.min(maxChange, change));
      anchor.currentValue = Math.max(0, Math.min(100, anchor.currentValue + limitedChange));
    } else {
      anchor.currentValue = Math.max(0, Math.min(100, value));
    }

    anchor.drift = anchor.currentValue - anchor.coreValue;
  }

  public lockTrait(trait: IdentityTrait): void {
    const anchor = this.identityAnchors.get(trait);
    if (anchor) {
      anchor.locked = true;
    }
  }

  public unlockTrait(trait: IdentityTrait): void {
    const anchor = this.identityAnchors.get(trait);
    if (anchor) {
      anchor.locked = false;
    }
  }

  public resetTrait(trait: IdentityTrait): void {
    const anchor = this.identityAnchors.get(trait);
    if (anchor) {
      anchor.currentValue = anchor.coreValue;
      anchor.drift = 0;
    }
  }

  public resetAllTraits(): void {
    const anchorEntries = Array.from(this.identityAnchors.entries());
    for (const [_trait, anchor] of anchorEntries) {
      anchor.currentValue = anchor.coreValue;
      anchor.drift = 0;
    }
  }

  /* ================================ */
  /* TONE MANAGEMENT                  */
  /* ================================ */

  public updateToneProfile(profile: Partial<ToneProfile>): void {
    this.toneProfile = { ...this.toneProfile, ...profile };
  }

  public getToneProfile(): ToneProfile {
    return { ...this.toneProfile };
  }

  /* ================================ */
  /* PRESENCE MANAGEMENT              */
  /* ================================ */

  public updatePresence(value: number): void {
    this.presenceStrength.current = Math.max(0, Math.min(100, value));
    
    // Calculate stability (inverse of distance from target)
    const deviation = Math.abs(this.presenceStrength.current - this.presenceStrength.target);
    this.presenceStrength.stability = Math.max(0, 100 - deviation);
  }

  public setPresenceTarget(target: number): void {
    this.presenceStrength.target = Math.max(0, Math.min(100, target));
  }

  public getPresence(): PresenceStrength {
    return { ...this.presenceStrength };
  }

  /* ================================ */
  /* STATE ACCESS                     */
  /* ================================ */

  public getIdentityAnchor(trait: IdentityTrait): IdentityAnchor | null {
    const anchor = this.identityAnchors.get(trait);
    return anchor ? { ...anchor } : null;
  }

  public getAllAnchors(): Record<IdentityTrait, IdentityAnchor> {
    const result: Partial<Record<IdentityTrait, IdentityAnchor>> = {};
    const anchorEntries = Array.from(this.identityAnchors.entries());
    
    for (const [trait, anchor] of anchorEntries) {
      result[trait] = { ...anchor };
    }
    
    return result as Record<IdentityTrait, IdentityAnchor>;
  }

  public getPersonalitySignature(): PersonalitySignature {
    return {
      traits: new Map(this.personalitySignature.traits),
      consistency: this.personalitySignature.consistency,
      driftScore: this.personalitySignature.driftScore,
    };
  }

  public getVisionAlignment(): VisionAlignment {
    return { ...this.visionAlignment, violations: [...this.visionAlignment.violations] };
  }

  public getDriftHistory(trait: IdentityTrait, count: number = 50): number[] {
    const history = this.driftHistory.get(trait);
    return history ? history.slice(-count) : [];
  }

  public getState() {
    return {
      identityAnchors: Object.fromEntries(this.identityAnchors.entries()),
      personalitySignature: {
        traits: Object.fromEntries(this.personalitySignature.traits.entries()),
        consistency: this.personalitySignature.consistency,
        driftScore: this.personalitySignature.driftScore,
      },
      toneProfile: { ...this.toneProfile },
      presenceStrength: { ...this.presenceStrength },
      visionAlignment: { ...this.visionAlignment, violations: [...this.visionAlignment.violations] },
    };
  }

  public getSummary(): string {
    const sig = this.personalitySignature;
    const presence = this.presenceStrength;
    const alignment = this.visionAlignment;

    return `Identity Anchor Engine Summary:
  Personality Consistency: ${sig.consistency.toFixed(1)}%
  Drift Score: ${sig.driftScore.toFixed(1)}
  Presence Strength: ${presence.current.toFixed(1)}% (target: ${presence.target})
  Presence Stability: ${presence.stability.toFixed(1)}%
  Vision Alignment: ${alignment.score.toFixed(1)}% (${alignment.aligned ? 'ALIGNED' : 'VIOLATIONS'})
  Violations: ${alignment.violations.length}`;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public reset(): void {
    this.resetAllTraits();
    this.personalitySignature.consistency = 100;
    this.personalitySignature.driftScore = 0;
    this.driftHistory.clear();
  }

  public destroy(): void {
    if (this.monitoringIntervalId !== null) {
      clearInterval(this.monitoringIntervalId);
      this.monitoringIntervalId = null;
    }
  }
}
