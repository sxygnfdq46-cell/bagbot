/**
 * 🛡️ ERF SERVICE — Execution Reality Filter Integration
 * 
 * STEP 24.34 — React Service
 * 
 * Purpose:
 * React-friendly orchestrator for the Execution Reality Filter (ERF).
 * This service manages the filter lifecycle and provides easy access to
 * market reality validation for execution actions.
 * 
 * Requirements:
 * - Initialize ERF with configuration
 * - Filter execution actions through market reality checks
 * - Provide getERFStatus() for real-time access
 * - React-friendly, no backend calls
 * - Singleton pattern for global access
 * 
 * Usage Example:
 * ```typescript
 * import { initERF, filterExecution, getERFStatus } from '@/app/services/intelligence/erfService';
 * import { getCurrentHIF } from '@/app/services/intelligence/snhlService';
 * import { getLastTranslation } from '@/app/services/intelligence/netService';
 * 
 * // Initialize ERF
 * initERF();
 * 
 * // Filter execution action
 * const hif = getCurrentHIF();
 * const action = getLastTranslation();
 * if (hif && action) {
 *   const filtered = filterExecution(hif, action);
 *   console.log('Filtered action:', filtered);
 * }
 * 
 * // Get last ERF status
 * const status = getERFStatus();
 * ```
 */

'use client';

import { getExecutionRealityFilter } from '@/app/lib/erf/ExecutionRealityFilter';
import type { HIF, ExecutionInstruction } from '@/app/lib/harmonizer/types';
import type {
  ERFValidationResult,
  ERFConfig,
  ERFStatistics,
  MarketRealitySnapshot,
} from '@/app/lib/erf/types';

// ============================================================================
// SINGLETON FILTER INSTANCE
// ============================================================================

let filter: ReturnType<typeof getExecutionRealityFilter> | null = null;
let isInitialized = false;

// Event listeners for ERF events
let eventListeners: Array<(result: ERFValidationResult) => void> = [];

// ============================================================================
// INITIALIZE ERF
// ============================================================================

/**
 * Initialize the Execution Reality Filter
 * 
 * This function:
 * 1. Creates the filter singleton
 * 2. Applies configuration
 * 3. Prepares for validation
 * 
 * Must be called before filterExecution().
 * 
 * @param config - Optional ERF configuration
 */
export function initERF(config?: Partial<ERFConfig>): void {
  if (isInitialized) {
    console.warn('⚠️ ERF already initialized');
    return;
  }

  console.log('🛡️ Initializing ERF Service...');

  // Create filter with config
  filter = getExecutionRealityFilter(config || {
    maxLatencyMs: 2000,
    volatilityThreshold: 85,
    distortionSensitivity: 0.7,
    trendSyncWindow: 5000,
    minConfidenceForExecution: 55,
    enableVolatilityCheck: true,
    enableLatencyCheck: true,
    enableTrendSyncCheck: true,
    enableDistortionDetection: true,
  });

  isInitialized = true;
  console.log('✅ ERF Service initialized');
}

// ============================================================================
// FILTER EXECUTION
// ============================================================================

/**
 * Filter an execution action through market reality checks
 * 
 * This is the main function that validates whether an action from NET
 * is safe to execute in current market conditions.
 * 
 * @param hif - Harmonized Intelligence Frame from SNHL
 * @param action - Execution instruction from NET
 * @returns ERFValidationResult - Validated action with reality check
 */
export function filterExecution(
  hif: HIF,
  action: ExecutionInstruction
): ERFValidationResult | null {
  if (!filter) {
    console.error('❌ Cannot filter: ERF not initialized. Call initERF() first.');
    return null;
  }

  if (!hif || !action) {
    console.warn('⚠️ Cannot filter: HIF or action is null or undefined');
    return null;
  }

  console.log(`🛡️ Filtering execution: ${action.action}...`);

  try {
    // Perform market validation
    const result = filter.validateMarket(hif, action);

    // Notify listeners
    notifyListeners(result);

    return result;
  } catch (error) {
    console.error('❌ ERF validation error:', error);
    return null;
  }
}

// ============================================================================
// GET ERF STATUS
// ============================================================================

/**
 * Get the most recent ERF validation result
 * 
 * Returns null if:
 * - ERF not initialized
 * - No validations performed yet
 * 
 * @returns ERFValidationResult | null
 */
export function getERFStatus(): ERFValidationResult | null {
  if (!filter) {
    console.warn('⚠️ Cannot get ERF status: ERF not initialized');
    return null;
  }

  return filter.getLastStatus();
}

// ============================================================================
// GET STATISTICS
// ============================================================================

/**
 * Get ERF statistics
 * 
 * Returns:
 * - totalValidations: Total market validations performed
 * - okCount: Number of times action was OK
 * - delayCount: Number of times action was delayed
 * - abortCount: Number of times action was aborted
 * - modifyCount: Number of times action was modified
 * - distortionsDetected: Number of market distortions detected
 * - latencyIssues: Number of latency/staleness issues
 * - lastValidationTime: Time taken for last validation (ms)
 */
export function getStatistics(): ERFStatistics | null {
  if (!filter) {
    return null;
  }

  return filter.getStatistics();
}

// ============================================================================
// GET MARKET REALITY SNAPSHOT
// ============================================================================

/**
 * Get a snapshot of current market reality state
 * 
 * This provides a high-level view of market conditions
 * without performing a full validation.
 */
export function getMarketRealitySnapshot(): MarketRealitySnapshot | null {
  if (!filter) {
    return null;
  }

  const lastStatus = filter.getLastStatus();
  if (!lastStatus) {
    return null;
  }

  // Construct snapshot from last status
  const snapshot: MarketRealitySnapshot = {
    timestamp: Date.now(),
    syncState: lastStatus.marketSyncState,
    latencyStatus: lastStatus.latencyStatus,
    volatility: {
      current: 0, // Would be calculated from real data
      average: 0,
      trend: 'STABLE',
    },
    trend: {
      direction: 'NEUTRAL',
      strength: 0,
      stability: 'STABLE',
    },
    distortions: lastStatus.distortionType ? [lastStatus.distortionType] : [],
    executionRecommendation: lastStatus.filterDecision === 'OK' ? 'SAFE' : 
      lastStatus.filterDecision === 'DELAY' ? 'CAUTION' : 'DANGEROUS',
  };

  return snapshot;
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Add a listener for new ERF validation results
 * 
 * @param listener - Callback function called when a new validation is complete
 */
export function onValidationComplete(listener: (result: ERFValidationResult) => void): void {
  eventListeners.push(listener);
}

/**
 * Remove a listener
 * 
 * @param listener - Listener to remove
 */
export function offValidationComplete(listener: (result: ERFValidationResult) => void): void {
  eventListeners = eventListeners.filter((l) => l !== listener);
}

/**
 * Notify all listeners of a new validation result
 * 
 * @param result - New ERFValidationResult
 */
function notifyListeners(result: ERFValidationResult): void {
  eventListeners.forEach((listener) => {
    try {
      listener(result);
    } catch (error) {
      console.error('❌ Error in ERF event listener:', error);
    }
  });
}

// ============================================================================
// RESET ERF
// ============================================================================

/**
 * Reset ERF (for testing or reinitialization)
 */
export function resetERF(): void {
  if (filter) {
    filter.resetHistory();
    filter = null;
    isInitialized = false;
    eventListeners = [];
    console.log('🔄 ERF reset');
  }
}

// ============================================================================
// IS INITIALIZED
// ============================================================================

/**
 * Check if ERF is initialized
 */
export function isErfInitialized(): boolean {
  return isInitialized;
}

// ============================================================================
// AUTO-FILTER FROM NET
// ============================================================================

/**
 * Automatically filter execution instructions from NET
 * 
 * This function integrates ERF with NET by automatically validating
 * every execution instruction against market reality.
 * 
 * Usage:
 * ```typescript
 * import { onNewInstruction } from '@/app/services/intelligence/netService';
 * import { autoFilterFromNET } from '@/app/services/intelligence/erfService';
 * 
 * onNewInstruction((instruction) => {
 *   const hif = getCurrentHIF();
 *   if (hif) {
 *     autoFilterFromNET(hif, instruction);
 *   }
 * });
 * ```
 * 
 * @param hif - HIF from SNHL
 * @param action - Execution instruction from NET
 */
export function autoFilterFromNET(hif: HIF, action: ExecutionInstruction): void {
  if (!hif || !action) return;

  const result = filterExecution(hif, action);
  
  if (result) {
    console.log(`✅ Auto-filtered ${action.action} → ${result.filterDecision} (${result.modifiedAction})`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initERF,
  filterExecution,
  getERFStatus,
  getStatistics,
  getMarketRealitySnapshot,
  onValidationComplete,
  offValidationComplete,
  resetERF,
  isErfInitialized,
  autoFilterFromNET,
};
