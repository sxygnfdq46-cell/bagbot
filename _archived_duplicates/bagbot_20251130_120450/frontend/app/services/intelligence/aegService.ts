/**
 * ⚙️ AEG SERVICE — Autonomous Execution Governor Integration
 * 
 * STEP 24.35 — React Service
 * 
 * Purpose:
 * React-friendly orchestrator for the Autonomous Execution Governor (AEG).
 * This service manages the governor lifecycle and provides easy access to
 * execution governance decisions (speed, size, aggression).
 * 
 * Requirements:
 * - Initialize AEG with configuration
 * - Evaluate governance rules based on ERF, ESM, and HIF
 * - Provide getGovernorSnapshot() for real-time access
 * - React-friendly, no backend calls
 * - Singleton pattern for global access
 * 
 * Usage Example:
 * ```typescript
 * import { initAEG, evaluateGovernor, getGovernorSnapshot } from '@/app/services/intelligence/aegService';
 * import { getERFStatus } from '@/app/services/intelligence/erfService';
 * import { getCurrentHIF } from '@/app/services/intelligence/snhlService';
 * 
 * // Initialize AEG
 * initAEG();
 * 
 * // Evaluate governor
 * const erfStatus = getERFStatus();
 * const hif = getCurrentHIF();
 * const esmStatus = { survivalScore: 75 }; // From ESM
 * 
 * if (erfStatus && hif) {
 *   const governance = evaluateGovernor(erfStatus, esmStatus, hif);
 *   console.log('Governance:', governance);
 * }
 * 
 * // Get governor snapshot
 * const snapshot = getGovernorSnapshot();
 * ```
 */

'use client';

import { getAutonomousExecutionGovernor } from '@/app/lib/aeg/AutonomousExecutionGovernor';
import type { HIF } from '@/app/lib/harmonizer/types';
import type { ERFValidationResult } from '@/app/lib/erf/types';
import type {
  GovernorResult,
  AEGConfig,
  AEGStatistics,
  GovernorSnapshot,
  ExecutionProfile,
} from '@/app/lib/aeg/types';

// ============================================================================
// SINGLETON GOVERNOR INSTANCE
// ============================================================================

let governor: ReturnType<typeof getAutonomousExecutionGovernor> | null = null;
let isInitialized = false;

// Event listeners for AEG events
let eventListeners: Array<(result: GovernorResult) => void> = [];

// ============================================================================
// INITIALIZE AEG
// ============================================================================

/**
 * Initialize the Autonomous Execution Governor
 * 
 * This function:
 * 1. Creates the governor singleton
 * 2. Applies configuration
 * 3. Prepares for evaluation
 * 
 * Must be called before evaluateGovernor().
 * 
 * @param config - Optional AEG configuration
 */
export function initAEG(config?: Partial<AEGConfig>): void {
  if (isInitialized) {
    console.warn('⚠️ AEG already initialized');
    return;
  }

  console.log('⚙️ Initializing AEG Service...');

  // Create governor with config
  governor = getAutonomousExecutionGovernor(config || {
    enableSpeedControl: true,
    enableSizeControl: true,
    enableAggressionControl: true,
    speedWeights: {
      erfStatus: 0.4,
      esmHealth: 0.3,
      volatility: 0.2,
      latency: 0.1,
    },
    sizeWeights: {
      shieldState: 0.35,
      riskLevel: 0.30,
      confidence: 0.25,
      survivalScore: 0.10,
    },
    aggressionWeights: {
      threatLevel: 0.40,
      shieldState: 0.30,
      confidence: 0.20,
      volatility: 0.10,
    },
    thresholds: {
      fastSpeedMin: 80,
      stagedSpeedMin: 60,
      slowSpeedMin: 40,
      fullSizeMin: 75,
      partialSizeMin: 50,
      aggressiveMin: 70,
      neutralMin: 40,
      defensiveMin: 20,
    },
  });

  isInitialized = true;
  console.log('✅ AEG Service initialized');
}

// ============================================================================
// EVALUATE GOVERNOR
// ============================================================================

/**
 * Evaluate execution governance based on ERF, ESM, and HIF
 * 
 * This is the main function that computes:
 * - Execution speed (FAST, STAGED, SLOW, DELAY)
 * - Execution size (FULL, PARTIAL, MICRO)
 * - Aggression level (AGGRESSIVE, NEUTRAL, DEFENSIVE, FROZEN)
 * - Whether execution is allowed
 * 
 * @param erfStatus - ERF validation result
 * @param esmStatus - ESM survival status
 * @param hif - Harmonized Intelligence Frame
 * @returns GovernorResult - Complete governance decision
 */
export function evaluateGovernor(
  erfStatus: ERFValidationResult,
  esmStatus: any,
  hif: HIF
): GovernorResult | null {
  if (!governor) {
    console.error('❌ Cannot evaluate: AEG not initialized. Call initAEG() first.');
    return null;
  }

  if (!erfStatus || !hif) {
    console.warn('⚠️ Cannot evaluate: ERF status or HIF is null or undefined');
    return null;
  }

  console.log(`⚙️ Evaluating execution governance...`);

  try {
    // Compute governance
    const result = governor.computeFinalExecutionRule(erfStatus, esmStatus, hif);

    // Notify listeners
    notifyListeners(result);

    return result;
  } catch (error) {
    console.error('❌ AEG evaluation error:', error);
    return null;
  }
}

// ============================================================================
// GET GOVERNOR SNAPSHOT
// ============================================================================

/**
 * Get a high-level snapshot of current governor state
 * 
 * Returns null if:
 * - AEG not initialized
 * - No evaluations performed yet
 * 
 * @returns GovernorSnapshot | null
 */
export function getGovernorSnapshot(): GovernorSnapshot | null {
  if (!governor) {
    console.warn('⚠️ Cannot get snapshot: AEG not initialized');
    return null;
  }

  const state = governor.getGovernorState();
  const stats = governor.getStatistics();

  if (!state) {
    return null;
  }

  const snapshot: GovernorSnapshot = {
    currentSpeed: state.speed,
    currentSize: state.size,
    currentAggression: state.aggression,
    allowed: state.allowed,
    lastEvaluation: state.timestamp,
    statistics: stats,
  };

  return snapshot;
}

// ============================================================================
// GET STATISTICS
// ============================================================================

/**
 * Get AEG statistics
 * 
 * Returns:
 * - totalEvaluations: Total governance evaluations
 * - allowedCount: Number of times execution was allowed
 * - deniedCount: Number of times execution was denied
 * - Speed/Size/Aggression distribution
 * - lastEvaluationTime: Time taken for last evaluation (ms)
 */
export function getStatistics(): AEGStatistics | null {
  if (!governor) {
    return null;
  }

  return governor.getStatistics();
}

// ============================================================================
// GET EXECUTION PROFILE
// ============================================================================

/**
 * Get a detailed execution profile based on current governance
 * 
 * This converts the governor result into actionable execution parameters.
 * 
 * @returns ExecutionProfile | null
 */
export function getExecutionProfile(): ExecutionProfile | null {
  if (!governor) {
    return null;
  }

  const state = governor.getGovernorState();
  if (!state) {
    return null;
  }

  // Map speed to delay
  let speedDelay = 0;
  switch (state.speed) {
    case 'FAST':
      speedDelay = 0;
      break;
    case 'STAGED':
      speedDelay = 2000; // 2 seconds between stages
      break;
    case 'SLOW':
      speedDelay = 5000; // 5 seconds
      break;
    case 'DELAY':
      speedDelay = 10000; // 10 seconds
      break;
  }

  // Map size to percentage
  let sizePercentage = 0;
  switch (state.size) {
    case 'FULL':
      sizePercentage = 100;
      break;
    case 'PARTIAL':
      sizePercentage = 60;
      break;
    case 'MICRO':
      sizePercentage = 20;
      break;
  }

  // Map aggression to risk tolerance
  let riskTolerance: ExecutionProfile['riskTolerance'] = 'MEDIUM';
  switch (state.aggression) {
    case 'AGGRESSIVE':
      riskTolerance = 'HIGH';
      break;
    case 'NEUTRAL':
      riskTolerance = 'MEDIUM';
      break;
    case 'DEFENSIVE':
    case 'FROZEN':
      riskTolerance = 'LOW';
      break;
  }

  // Determine recommended action
  let recommendedAction: ExecutionProfile['recommendedAction'] = 'EXECUTE';
  if (!state.allowed || state.aggression === 'FROZEN' || state.speed === 'DELAY') {
    recommendedAction = 'WAIT';
  }
  if (state.context.erfStatus.filterDecision === 'ABORT') {
    recommendedAction = 'ABORT';
  }

  const profile: ExecutionProfile = {
    speed: state.speed,
    size: state.size,
    aggression: state.aggression,
    sizePercentage,
    speedDelay,
    riskTolerance,
    recommendedAction,
  };

  return profile;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Add a listener for new governor evaluations
 * 
 * @param listener - Callback function called when a new evaluation is complete
 */
export function onGovernorEvaluation(listener: (result: GovernorResult) => void): void {
  eventListeners.push(listener);
}

/**
 * Remove a listener
 * 
 * @param listener - Listener to remove
 */
export function offGovernorEvaluation(listener: (result: GovernorResult) => void): void {
  eventListeners = eventListeners.filter((l) => l !== listener);
}

/**
 * Notify all listeners of a new evaluation result
 * 
 * @param result - New GovernorResult
 */
function notifyListeners(result: GovernorResult): void {
  eventListeners.forEach((listener) => {
    try {
      listener(result);
    } catch (error) {
      console.error('❌ Error in AEG event listener:', error);
    }
  });
}

// ============================================================================
// RESET AEG
// ============================================================================

/**
 * Reset AEG (for testing or reinitialization)
 */
export function resetAEG(): void {
  if (governor) {
    governor = null;
    isInitialized = false;
    eventListeners = [];
    console.log('🔄 AEG reset');
  }
}

// ============================================================================
// IS INITIALIZED
// ============================================================================

/**
 * Check if AEG is initialized
 */
export function isAegInitialized(): boolean {
  return isInitialized;
}

// ============================================================================
// AUTO-EVALUATE FROM ERF
// ============================================================================

/**
 * Automatically evaluate governance when ERF completes validation
 * 
 * This function integrates AEG with ERF by automatically computing
 * governance rules whenever ERF completes a validation.
 * 
 * Usage:
 * ```typescript
 * import { onValidationComplete } from '@/app/services/intelligence/erfService';
 * import { autoEvaluateFromERF } from '@/app/services/intelligence/aegService';
 * 
 * onValidationComplete((erfResult) => {
 *   const hif = getCurrentHIF();
 *   const esmStatus = { survivalScore: 75 };
 *   if (hif) {
 *     autoEvaluateFromERF(erfResult, esmStatus, hif);
 *   }
 * });
 * ```
 * 
 * @param erfStatus - ERF validation result
 * @param esmStatus - ESM survival status
 * @param hif - HIF from SNHL
 */
export function autoEvaluateFromERF(
  erfStatus: ERFValidationResult,
  esmStatus: any,
  hif: HIF
): void {
  if (!erfStatus || !hif) return;

  const result = evaluateGovernor(erfStatus, esmStatus, hif);
  
  if (result) {
    console.log(
      `✅ Auto-evaluated governance → ${result.allowed ? 'ALLOWED' : 'DENIED'} | ` +
      `Speed: ${result.speed}, Size: ${result.size}, Aggression: ${result.aggression}`
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initAEG,
  evaluateGovernor,
  getGovernorSnapshot,
  getStatistics,
  getExecutionProfile,
  onGovernorEvaluation,
  offGovernorEvaluation,
  resetAEG,
  isAegInitialized,
  autoEvaluateFromERF,
};
