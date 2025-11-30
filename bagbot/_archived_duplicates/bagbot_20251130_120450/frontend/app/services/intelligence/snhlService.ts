/**
 * 🔥 SNHL SERVICE — Shield-Network Harmonizer Layer Integration
 * 
 * STEP 24.32 — React Service
 * 
 * Purpose:
 * React-friendly orchestrator for the Shield-Network Harmonizer Layer (SNHL).
 * This service manages the harmonizer lifecycle and provides easy access to
 * the current Harmonized Intelligence Frame (HIF) for React components.
 * 
 * Requirements:
 * - Initialize SNHL with all engine references
 * - Start/stop harmonization loop (120ms frequency)
 * - Provide getCurrentHIF() for real-time access
 * - React-friendly, no backend calls
 * - Singleton pattern for global access
 * 
 * Usage Example:
 * ```typescript
 * import { initSNHL, startLoop, getCurrentHIF } from '@/app/services/intelligence/snhlService';
 * 
 * // In your main app or intelligence provider:
 * initSNHL();
 * startLoop((hif) => {
 *   console.log('New HIF:', hif);
 *   // Update UI, send to Decision Engine, etc.
 * });
 * 
 * // In any component:
 * const hif = getCurrentHIF();
 * ```
 */

'use client';

import { getShieldNetworkHarmonizer } from '@/app/lib/harmonizer/ShieldNetworkHarmonizer';
import type { HIF } from '@/app/lib/harmonizer/types';

// ============================================================================
// SINGLETON HARMONIZER INSTANCE
// ============================================================================

let harmonizer: ReturnType<typeof getShieldNetworkHarmonizer> | null = null;
let isInitialized = false;

// ============================================================================
// INITIALIZE SNHL
// ============================================================================

/**
 * Initialize the Shield-Network Harmonizer Layer
 * 
 * This function:
 * 1. Creates the harmonizer singleton
 * 2. Attaches all engine references
 * 3. Prepares for loop start
 * 
 * Must be called before startLoop().
 */
export function initSNHL(): void {
  if (isInitialized) {
    console.warn('⚠️ SNHL already initialized');
    return;
  }

  console.log('🔥 Initializing SNHL Service...');

  // Create harmonizer with default config
  harmonizer = getShieldNetworkHarmonizer({
    loopFrequency: 120, // 120ms
    conflictResolutionStrategy: 'weighted-average',
    enableConflictLogging: false, // Set to true for debugging
    weights: {
      shieldEngine: 0.25,
      threatClusterEngine: 0.10,
      correlationMatrix: 0.08,
      predictionHorizon: 0.10,
      rootCauseEngine: 0.08,
      executionPrecisionCore: 0.12,
      survivalMatrix: 0.10,
      tradingPipelineCore: 0.05,
      decisionEngine: 0.08,
      temporalMemoryEngine: 0.04,
      autonomousResponseLoop: 0.00, // ARL is visual-only
    },
  });

  // Attach engines (will be populated dynamically)
  attachEngines();

  isInitialized = true;
  console.log('✅ SNHL Service initialized');
}

// ============================================================================
// ATTACH ENGINES
// ============================================================================

/**
 * Attach all intelligence engine references to the harmonizer
 * 
 * This function will dynamically import and attach engines.
 * For now, it's a placeholder that can be populated as engines become available.
 */
function attachEngines(): void {
  if (!harmonizer) {
    console.error('❌ Cannot attach engines: Harmonizer not initialized');
    return;
  }

  // Dynamic engine attachment
  // In a real implementation, these would be imported dynamically:
  // import { getShieldEngine } from '@/app/lib/shield/ShieldEngine';
  // import { getThreatClusterEngine } from '@/app/lib/threats/ThreatClusterEngine';
  // etc.

  const engines = {
    // shieldEngine: getShieldEngine(),
    // threatClusterEngine: getThreatClusterEngine(),
    // correlationMatrix: getCorrelationMatrix(),
    // predictionHorizon: getPredictionHorizon(),
    // rootCauseEngine: getRootCauseEngine(),
    // executionPrecisionCore: getExecutionPrecisionCore(),
    // survivalMatrix: getSurvivalMatrix(),
    // tradingPipelineCore: getTradingPipelineCore(),
    // decisionEngine: getDecisionEngine(),
    // temporalMemoryEngine: getTemporalMemoryEngine(),
    // autonomousResponseLoop: getAutonomousResponseLoop(),
    // reactorSyncEngine: getReactorSyncEngine(),
  };

  harmonizer.attachEngines(engines);
  console.log('🔗 Engines attached to SNHL');
}

// ============================================================================
// START LOOP
// ============================================================================

/**
 * Start the SNHL harmonization loop
 * 
 * @param onHIFGenerated - Optional callback fired every time a new HIF is generated (120ms)
 * 
 * Example:
 * ```typescript
 * startLoop((hif) => {
 *   console.log('New HIF:', hif);
 *   updateUI(hif);
 * });
 * ```
 */
export function startLoop(onHIFGenerated?: (hif: HIF) => void): void {
  if (!harmonizer) {
    console.error('❌ Cannot start loop: SNHL not initialized. Call initSNHL() first.');
    return;
  }

  console.log('🚀 Starting SNHL loop...');
  harmonizer.start(onHIFGenerated);
}

// ============================================================================
// STOP LOOP
// ============================================================================

/**
 * Stop the SNHL harmonization loop
 */
export function stopLoop(): void {
  if (!harmonizer) {
    console.warn('⚠️ Cannot stop loop: SNHL not initialized');
    return;
  }

  console.log('🛑 Stopping SNHL loop...');
  harmonizer.stop();
}

// ============================================================================
// GET CURRENT HIF
// ============================================================================

/**
 * Get the most recent Harmonized Intelligence Frame (HIF)
 * 
 * Returns null if:
 * - SNHL not initialized
 * - Loop not started
 * - No frames generated yet
 * 
 * @returns HIF | null
 */
export function getCurrentHIF(): HIF | null {
  if (!harmonizer) {
    console.warn('⚠️ Cannot get HIF: SNHL not initialized');
    return null;
  }

  return harmonizer.getCurrentHIF();
}

// ============================================================================
// GET LAST TRANSLATION
// ============================================================================

/**
 * Placeholder for Neural Execution Translator (NET) integration
 * This will be implemented in STEP 24.33
 */
export function getLastTranslation() {
  console.warn('⚠️ NET not yet implemented (STEP 24.33)');
  return null;
}

// ============================================================================
// GET STATISTICS
// ============================================================================

/**
 * Get SNHL statistics
 * 
 * Returns:
 * - totalFrames: Total HIF frames generated
 * - conflictsResolved: Number of conflicts detected and resolved
 * - averageConfidence: Average confidence across all frames
 * - lastUpdateTime: Time taken for last frame (ms)
 */
export function getStatistics() {
  if (!harmonizer) {
    return null;
  }

  return harmonizer.getStatistics();
}

// ============================================================================
// RESET SNHL
// ============================================================================

/**
 * Reset SNHL (for testing or reinitialization)
 */
export function resetSNHL(): void {
  if (harmonizer) {
    harmonizer.stop();
    harmonizer = null;
    isInitialized = false;
    console.log('🔄 SNHL reset');
  }
}

// ============================================================================
// IS INITIALIZED
// ============================================================================

/**
 * Check if SNHL is initialized
 */
export function isSnhlInitialized(): boolean {
  return isInitialized;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initSNHL,
  startLoop,
  stopLoop,
  getCurrentHIF,
  getLastTranslation,
  getStatistics,
  resetSNHL,
  isSnhlInitialized,
};
