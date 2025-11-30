/**
 * ⚡ AUTONOMOUS RESPONSE LOOP (ARL)
 * 
 * STEP 24.30 — BagBot's First Autonomous Response Loop
 * 
 * Purpose:
 * ARL is the "heartbeat" of the entire shield engine.
 * It runs every few milliseconds and connects the following:
 * - Real-Time Execution Monitor (RTEM)
 * - Stability Shield Engine
 * - Survival Matrix (ESM)
 * - Hedge Pathway Engine
 * - Threat Memory
 * - UI Decision Renderer
 * 
 * It:
 * ✅ Reads recent signals from the shield network
 * ✅ Updates BagBot's internal state
 * ✅ Computes responses (non-trading)
 * ✅ Sends output to the UI in real-time
 * ✅ Maintains momentum even when the user is inactive
 * 
 * It does NOT trigger trades — only simulations and recommendations.
 * 
 * ARL Core Cycle (every 80–120ms):
 * 1. Pull RTEM data packet
 * 2. Pull Survival Matrix score
 * 3. Refresh Threat Memory
 * 4. Check Shield Intensity
 * 5. Decide Response Mode:
 *    - Calm
 *    - Alert
 *    - Defensive
 *    - Aggressive Observation
 * 6. Generate ARL Frame (UI update)
 * 7. Output to UI animated reactor core
 * 
 * This is the secret behind a living AI dashboard.
 * 
 * ARL Response Modes:
 * 
 * CALM MODE
 * Normal trends, no attacks.
 * UI: soft glow, smooth flow.
 * 
 * ALERT MODE
 * Volatility detected.
 * UI: fast pulses.
 * 
 * DEFENSIVE MODE
 * Threat Memory activated.
 * UI: shield rings tighten.
 * 
 * AGGRESSIVE OBSERVATION MODE
 * Bot preparing potential reversal simulation.
 * UI: violet/red flickers.
 * 
 * Requirements:
 * - Frontend-only TypeScript module.
 * - Export class AutonomousResponseLoop.
 * - Must include:
 *   * startLoop()
 *   * stopLoop()
 *   * runCycle()
 *   * computeMode()
 *   * gatherInputs()
 *   * generateARLFrame()
 * - Loop interval: 80-120ms (configurable).
 * - Inputs:
 *   - RTEM packets
 *   - Survival Matrix packets
 *   - Threat Memory snapshots
 *   - ShieldLevel state
 * - Modes:
 *   * "CALM" | "ALERT" | "DEFENSIVE" | "AGGRESSIVE_OBSERVATION"
 * - Each cycle must:
 *   > read shield-engine intelligence
 *   > compute response mode
 *   > output UI-ready ARL frame
 * - Must NOT make backend calls.
 * - No trading execution.
 * - Output shape:
 *   {
 *     timestamp,
 *     mode,
 *     rtemScore,
 *     survivalScore,
 *     shieldLevel,
 *     threatLevel,
 *     suggestedAction,
 *     diagnostics
 *   }
 */

import type { RTEMStatusPacket } from '../monitoring/RealTimeExecutionMonitor';
import type { SurvivalReportPacket } from '../execution/ExecutionSurvivalMatrix';
import type { ThreatMemorySnapshot } from '../execution/ExecutionSurvivalMatrix';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * ARL response mode
 */
export type ARLMode = 'CALM' | 'ALERT' | 'DEFENSIVE' | 'AGGRESSIVE_OBSERVATION';

/**
 * Shield level state
 */
export interface ShieldLevelState {
  level: number;                 // 0-100
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  active: boolean;
  lastUpdate: number;
}

/**
 * ARL frame output (sent to UI)
 */
export interface ARLFrame {
  timestamp: number;
  mode: ARLMode;
  rtemScore: number;             // 0-100
  survivalScore: number;         // 0-100
  shieldLevel: number;           // 0-100
  threatLevel: string;           // 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  suggestedAction: string;
  diagnostics: ARLDiagnostics;
  visualization: ARLVisualization;
}

/**
 * ARL diagnostics
 */
export interface ARLDiagnostics {
  cycleTime: number;             // milliseconds
  activeMonitors: number;
  anomaliesDetected: number;
  threatsActive: number;
  modeConfidence: number;        // 0-100
  lastModeChange: number;        // timestamp
}

/**
 * ARL visualization hints for UI
 */
export interface ARLVisualization {
  glowIntensity: number;         // 0-100
  pulseSpeed: number;            // 0-100
  colorTheme: 'green' | 'yellow' | 'orange' | 'red' | 'violet';
  shieldRingsTightness: number;  // 0-100
  reactorActivity: number;       // 0-100
}

/**
 * ARL configuration
 */
export interface ARLConfig {
  intervalMs: number;            // Loop interval (80-120ms recommended)
  enabled: boolean;
  autoMode: boolean;             // Auto-select mode based on conditions
}

/**
 * ARL statistics
 */
export interface ARLStats {
  totalCycles: number;
  uptimeMs: number;
  averageCycleTime: number;
  modeDistribution: Record<ARLMode, number>;
  lastError?: string;
}

// ============================================================================
// AUTONOMOUS RESPONSE LOOP CLASS
// ============================================================================

export class AutonomousResponseLoop {
  // Configuration
  private config: ARLConfig = {
    intervalMs: 100,             // 100ms = 10 updates per second
    enabled: false,
    autoMode: true,
  };

  // State
  private loopInterval: NodeJS.Timeout | null = null;
  private currentMode: ARLMode = 'CALM';
  private lastModeChange: number = Date.now();
  private startTime: number = 0;
  private stats: ARLStats = {
    totalCycles: 0,
    uptimeMs: 0,
    averageCycleTime: 0,
    modeDistribution: {
      CALM: 0,
      ALERT: 0,
      DEFENSIVE: 0,
      AGGRESSIVE_OBSERVATION: 0,
    },
  };

  // Input caches
  private latestRTEM: RTEMStatusPacket | null = null;
  private latestSurvival: SurvivalReportPacket | null = null;
  private latestThreatMemory: ThreatMemorySnapshot | null = null;
  private latestShieldLevel: ShieldLevelState = {
    level: 80,
    intensity: 'MEDIUM',
    active: true,
    lastUpdate: Date.now(),
  };

  // Output callback
  private onFrameGenerated?: (frame: ARLFrame) => void;

  private readonly VERSION = '24.30.0';

  /**
   * Start the autonomous response loop
   */
  public startLoop(onFrameGenerated?: (frame: ARLFrame) => void): void {
    if (this.loopInterval) {
      console.warn('[ARL] Loop already running');
      return;
    }

    this.config.enabled = true;
    this.startTime = Date.now();
    this.onFrameGenerated = onFrameGenerated;

    console.log(`[ARL] Starting autonomous response loop (${this.config.intervalMs}ms interval)`);

    this.loopInterval = setInterval(() => {
      this.runCycle();
    }, this.config.intervalMs);
  }

  /**
   * Stop the autonomous response loop
   */
  public stopLoop(): void {
    if (!this.loopInterval) {
      console.warn('[ARL] Loop not running');
      return;
    }

    clearInterval(this.loopInterval);
    this.loopInterval = null;
    this.config.enabled = false;

    console.log('[ARL] Autonomous response loop stopped');
  }

  /**
   * Run one ARL cycle
   */
  private runCycle(): void {
    const cycleStart = Date.now();

    try {
      // Step 1: Gather inputs
      const inputs = this.gatherInputs();

      // Step 2: Compute response mode
      const mode = this.computeMode(inputs);

      // Step 3: Update mode if changed
      if (mode !== this.currentMode) {
        console.log(`[ARL] Mode changed: ${this.currentMode} → ${mode}`);
        this.currentMode = mode;
        this.lastModeChange = Date.now();
      }

      // Step 4: Generate ARL frame
      const frame = this.generateARLFrame(inputs, mode);

      // Step 5: Update statistics
      this.updateStats(cycleStart, mode);

      // Step 6: Send to UI
      if (this.onFrameGenerated) {
        this.onFrameGenerated(frame);
      }
    } catch (error) {
      console.error('[ARL] Cycle error:', error);
      this.stats.lastError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  /**
   * Gather inputs from all systems
   */
  private gatherInputs(): {
    rtem: RTEMStatusPacket | null;
    survival: SurvivalReportPacket | null;
    threatMemory: ThreatMemorySnapshot | null;
    shieldLevel: ShieldLevelState;
  } {
    return {
      rtem: this.latestRTEM,
      survival: this.latestSurvival,
      threatMemory: this.latestThreatMemory,
      shieldLevel: this.latestShieldLevel,
    };
  }

  /**
   * Compute appropriate response mode
   */
  private computeMode(inputs: ReturnType<typeof this.gatherInputs>): ARLMode {
    if (!this.config.autoMode) {
      return this.currentMode; // Manual mode, don't change
    }

    const { rtem, survival, threatMemory, shieldLevel } = inputs;

    // Mode 1: AGGRESSIVE OBSERVATION
    // Triggered by strong reversal signals or critical threats with potential flip
    if (
      survival?.survivalPath === 'PATH_SHIFT_REVERSAL' ||
      (threatMemory?.threatLevel === 'CRITICAL' && survival?.survivalScore && survival.survivalScore < 40)
    ) {
      return 'AGGRESSIVE_OBSERVATION';
    }

    // Mode 2: DEFENSIVE
    // Triggered by threat memory activation or low survival scores
    if (
      threatMemory?.threatLevel === 'HIGH' ||
      threatMemory?.threatLevel === 'CRITICAL' ||
      (survival?.survivalScore && survival.survivalScore < 50) ||
      shieldLevel.intensity === 'CRITICAL'
    ) {
      return 'DEFENSIVE';
    }

    // Mode 3: ALERT
    // Triggered by volatility, anomalies, or moderate threats
    if (
      (rtem?.anomalyCount && rtem.anomalyCount > 0) ||
      threatMemory?.threatLevel === 'MODERATE' ||
      (survival?.survivalScore && survival.survivalScore < 70) ||
      shieldLevel.intensity === 'HIGH'
    ) {
      return 'ALERT';
    }

    // Mode 4: CALM (default)
    // Everything looks good
    return 'CALM';
  }

  /**
   * Generate ARL frame for UI
   */
  private generateARLFrame(
    inputs: ReturnType<typeof this.gatherInputs>,
    mode: ARLMode
  ): ARLFrame {
    const { rtem, survival, threatMemory, shieldLevel } = inputs;

    // Extract scores
    const rtemScore = rtem?.healthScore || 80;
    const survivalScore = survival?.survivalScore || 80;
    const shieldLevelValue = shieldLevel.level;
    const threatLevel = threatMemory?.threatLevel || 'LOW';

    // Generate suggested action
    const suggestedAction = this.generateSuggestedAction(mode, survival, rtem);

    // Compute diagnostics
    const diagnostics: ARLDiagnostics = {
      cycleTime: 0, // Will be updated
      activeMonitors: rtem ? 1 : 0,
      anomaliesDetected: rtem?.anomalyCount || 0,
      threatsActive: threatMemory?.activeThreatCount || 0,
      modeConfidence: this.calculateModeConfidence(inputs, mode),
      lastModeChange: this.lastModeChange,
    };

    // Compute visualization hints
    const visualization = this.computeVisualization(mode, rtemScore, survivalScore, shieldLevelValue);

    return {
      timestamp: Date.now(),
      mode,
      rtemScore,
      survivalScore,
      shieldLevel: shieldLevelValue,
      threatLevel,
      suggestedAction,
      diagnostics,
      visualization,
    };
  }

  /**
   * Generate suggested action based on mode and conditions
   */
  private generateSuggestedAction(
    mode: ARLMode,
    survival: SurvivalReportPacket | null,
    rtem: RTEMStatusPacket | null
  ): string {
    switch (mode) {
      case 'CALM':
        return 'System stable. Continue normal operations.';

      case 'ALERT':
        if (rtem?.anomalyCount && rtem.anomalyCount > 0) {
          return `${rtem.anomalyCount} anomalies detected. Monitor closely.`;
        }
        return 'Elevated activity detected. Remain vigilant.';

      case 'DEFENSIVE':
        if (survival?.recommendedAction) {
          return `Defensive mode: ${survival.recommendedAction}`;
        }
        return 'Threat detected. Activating defensive protocols.';

      case 'AGGRESSIVE_OBSERVATION':
        return 'Preparing reversal simulation. Analyzing market shift patterns.';

      default:
        return 'Monitoring active.';
    }
  }

  /**
   * Calculate confidence in the current mode selection
   */
  private calculateModeConfidence(
    inputs: ReturnType<typeof this.gatherInputs>,
    mode: ARLMode
  ): number {
    let confidence = 80; // Base confidence

    const { rtem, survival, threatMemory } = inputs;

    // Reduce confidence if data is missing
    if (!rtem) confidence -= 15;
    if (!survival) confidence -= 15;
    if (!threatMemory) confidence -= 10;

    // Reduce confidence if scores are near mode boundaries
    if (survival?.survivalScore) {
      if (Math.abs(survival.survivalScore - 50) < 5) confidence -= 10;
      if (Math.abs(survival.survivalScore - 70) < 5) confidence -= 10;
    }

    // Boost confidence if mode matches survival path clearly
    if (mode === 'DEFENSIVE' && survival?.survivalPath === 'PATH_RAPID_EXIT') {
      confidence += 15;
    }
    if (mode === 'AGGRESSIVE_OBSERVATION' && survival?.survivalPath === 'PATH_SHIFT_REVERSAL') {
      confidence += 15;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Compute visualization parameters for UI
   */
  private computeVisualization(
    mode: ARLMode,
    rtemScore: number,
    survivalScore: number,
    shieldLevel: number
  ): ARLVisualization {
    let glowIntensity = 50;
    let pulseSpeed = 30;
    let colorTheme: ARLVisualization['colorTheme'] = 'green';
    let shieldRingsTightness = 40;
    let reactorActivity = 50;

    switch (mode) {
      case 'CALM':
        glowIntensity = 30;
        pulseSpeed = 20;
        colorTheme = 'green';
        shieldRingsTightness = 20;
        reactorActivity = 40;
        break;

      case 'ALERT':
        glowIntensity = 60;
        pulseSpeed = 60;
        colorTheme = 'yellow';
        shieldRingsTightness = 50;
        reactorActivity = 65;
        break;

      case 'DEFENSIVE':
        glowIntensity = 80;
        pulseSpeed = 80;
        colorTheme = 'orange';
        shieldRingsTightness = 80;
        reactorActivity = 85;
        break;

      case 'AGGRESSIVE_OBSERVATION':
        glowIntensity = 95;
        pulseSpeed = 90;
        colorTheme = 'violet';
        shieldRingsTightness = 70;
        reactorActivity = 95;
        break;
    }

    // Adjust based on scores
    if (survivalScore < 40) {
      glowIntensity = Math.min(100, glowIntensity + 20);
      pulseSpeed = Math.min(100, pulseSpeed + 20);
      colorTheme = 'red';
    }

    if (shieldLevel > 90) {
      shieldRingsTightness = Math.max(20, shieldRingsTightness - 10);
    }

    return {
      glowIntensity,
      pulseSpeed,
      colorTheme,
      shieldRingsTightness,
      reactorActivity,
    };
  }

  /**
   * Update statistics
   */
  private updateStats(cycleStart: number, mode: ARLMode): void {
    const cycleTime = Date.now() - cycleStart;

    this.stats.totalCycles++;
    this.stats.uptimeMs = Date.now() - this.startTime;
    this.stats.modeDistribution[mode]++;

    // Update average cycle time
    this.stats.averageCycleTime =
      (this.stats.averageCycleTime * (this.stats.totalCycles - 1) + cycleTime) /
      this.stats.totalCycles;
  }

  // =========================================================================
  // PUBLIC UPDATE METHODS (for external systems to feed data)
  // =========================================================================

  /**
   * Update RTEM data
   */
  public updateRTEM(packet: RTEMStatusPacket): void {
    this.latestRTEM = packet;
  }

  /**
   * Update Survival Matrix data
   */
  public updateSurvival(packet: SurvivalReportPacket): void {
    this.latestSurvival = packet;
  }

  /**
   * Update Threat Memory data
   */
  public updateThreatMemory(snapshot: ThreatMemorySnapshot): void {
    this.latestThreatMemory = snapshot;
  }

  /**
   * Update Shield Level data
   */
  public updateShieldLevel(state: ShieldLevelState): void {
    this.latestShieldLevel = state;
  }

  // =========================================================================
  // CONFIGURATION & STATUS
  // =========================================================================

  /**
   * Set loop interval
   */
  public setInterval(ms: number): void {
    if (ms < 50 || ms > 500) {
      console.warn('[ARL] Interval must be between 50-500ms');
      return;
    }

    this.config.intervalMs = ms;

    // Restart loop if running
    if (this.loopInterval) {
      this.stopLoop();
      this.startLoop(this.onFrameGenerated);
    }
  }

  /**
   * Enable/disable auto mode
   */
  public setAutoMode(enabled: boolean): void {
    this.config.autoMode = enabled;
    console.log(`[ARL] Auto mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Manually set mode (when auto mode is off)
   */
  public setMode(mode: ARLMode): void {
    if (this.config.autoMode) {
      console.warn('[ARL] Cannot manually set mode while auto mode is enabled');
      return;
    }

    this.currentMode = mode;
    this.lastModeChange = Date.now();
    console.log(`[ARL] Mode manually set to ${mode}`);
  }

  /**
   * Get current mode
   */
  public getMode(): ARLMode {
    return this.currentMode;
  }

  /**
   * Get statistics
   */
  public getStats(): ARLStats {
    return { ...this.stats };
  }

  /**
   * Get configuration
   */
  public getConfig(): ARLConfig {
    return { ...this.config };
  }

  /**
   * Check if loop is running
   */
  public isRunning(): boolean {
    return this.loopInterval !== null;
  }

  /**
   * Get version
   */
  public getVersion(): string {
    return this.VERSION;
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      totalCycles: 0,
      uptimeMs: 0,
      averageCycleTime: 0,
      modeDistribution: {
        CALM: 0,
        ALERT: 0,
        DEFENSIVE: 0,
        AGGRESSIVE_OBSERVATION: 0,
      },
    };
    console.log('[ARL] Statistics reset');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let instance: AutonomousResponseLoop | null = null;

export function getAutonomousResponseLoop(): AutonomousResponseLoop {
  if (!instance) {
    instance = new AutonomousResponseLoop();
  }
  return instance;
}

// Default export
export default AutonomousResponseLoop;
