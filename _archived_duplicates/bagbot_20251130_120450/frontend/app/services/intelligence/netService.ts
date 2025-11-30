/**
 * ⚡ NET SERVICE — Neural Execution Translator Integration
 * 
 * STEP 24.33 — React Service
 * 
 * Purpose:
 * React-friendly orchestrator for the Neural Execution Translator (NET).
 * This service manages the translator lifecycle and provides easy access to
 * execution instructions derived from Harmonized Intelligence Frames (HIF).
 * 
 * Requirements:
 * - Initialize NET with configuration
 * - Translate HIF → ExecutionInstruction
 * - Provide getLastTranslation() for real-time access
 * - React-friendly, no backend calls
 * - Singleton pattern for global access
 * 
 * Usage Example:
 * ```typescript
 * import { initNET, translateHIF, getLastTranslation } from '@/app/services/intelligence/netService';
 * import { getCurrentHIF } from '@/app/services/intelligence/snhlService';
 * 
 * // Initialize NET
 * initNET();
 * 
 * // Translate HIF to execution instruction
 * const hif = getCurrentHIF();
 * if (hif) {
 *   const instruction = translateHIF(hif);
 *   console.log('Execution instruction:', instruction);
 * }
 * 
 * // Get last translation
 * const lastInstruction = getLastTranslation();
 * ```
 */

'use client';

import { getNeuralExecutionTranslator } from '@/app/lib/net/NeuralExecutionTranslator';
import type { HIF, ExecutionInstruction, ExecutionContext } from '@/app/lib/harmonizer/types';
import type { NETConfig, NETStatistics } from '@/app/lib/net/types';

// ============================================================================
// SINGLETON TRANSLATOR INSTANCE
// ============================================================================

let translator: ReturnType<typeof getNeuralExecutionTranslator> | null = null;
let isInitialized = false;

// Event listeners for NET events
let eventListeners: Array<(instruction: ExecutionInstruction) => void> = [];

// ============================================================================
// INITIALIZE NET
// ============================================================================

/**
 * Initialize the Neural Execution Translator
 * 
 * This function:
 * 1. Creates the translator singleton
 * 2. Applies configuration
 * 3. Prepares for translation
 * 
 * Must be called before translateHIF().
 * 
 * @param config - Optional NET configuration
 */
export function initNET(config?: Partial<NETConfig>): void {
  if (isInitialized) {
    console.warn('⚠️ NET already initialized');
    return;
  }

  console.log('⚡ Initializing NET Service...');

  // Create translator with config
  translator = getNeuralExecutionTranslator(config || {
    enableSafetyGates: true,
    minConfidenceForEntry: 60,
    maxThreatLevelForEntry: 70,
    volatilitySpikePauseThreshold: 80,
    conflictOverrideAction: 'WAIT',
    aggressiveModeMultiplier: 1.2,
    safeModeMultiplier: 0.6,
  });

  isInitialized = true;
  console.log('✅ NET Service initialized');
}

// ============================================================================
// TRANSLATE HIF
// ============================================================================

/**
 * Translate a Harmonized Intelligence Frame (HIF) into an ExecutionInstruction
 * 
 * This is the main function that converts BagBot's intelligence into actionable
 * execution instructions with safety gates applied.
 * 
 * @param hif - Harmonized Intelligence Frame from SNHL
 * @param context - Optional execution context (current position, account balance, etc.)
 * @returns ExecutionInstruction - Safe, validated execution instruction
 */
export function translateHIF(hif: HIF, context?: ExecutionContext): ExecutionInstruction | null {
  if (!translator) {
    console.error('❌ Cannot translate: NET not initialized. Call initNET() first.');
    return null;
  }

  if (!hif) {
    console.warn('⚠️ Cannot translate: HIF is null or undefined');
    return null;
  }

  console.log(`⚡ Translating HIF → ExecutionInstruction...`);

  try {
    // Perform translation
    const instruction = translator.translate(hif, context);

    // Notify listeners
    notifyListeners(instruction);

    return instruction;
  } catch (error) {
    console.error('❌ NET translation error:', error);
    return null;
  }
}

// ============================================================================
// GET LAST TRANSLATION
// ============================================================================

/**
 * Get the most recent ExecutionInstruction
 * 
 * Returns null if:
 * - NET not initialized
 * - No translations performed yet
 * 
 * @returns ExecutionInstruction | null
 */
export function getLastTranslation(): ExecutionInstruction | null {
  if (!translator) {
    console.warn('⚠️ Cannot get last translation: NET not initialized');
    return null;
  }

  return translator.getLastAction();
}

// ============================================================================
// GET STATISTICS
// ============================================================================

/**
 * Get NET statistics
 * 
 * Returns:
 * - totalTranslations: Total HIF → ExecutionInstruction translations
 * - safetyGateBlocks: Number of times safety gates blocked an action
 * - threatOverrides: Number of times threat level forced an override
 * - conflictOverrides: Number of times conflicts forced a hold
 * - lastTranslationTime: Time taken for last translation (ms)
 */
export function getStatistics(): NETStatistics | null {
  if (!translator) {
    return null;
  }

  return translator.getStatistics();
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Add a listener for new ExecutionInstructions
 * 
 * @param listener - Callback function called when a new instruction is generated
 */
export function onNewInstruction(listener: (instruction: ExecutionInstruction) => void): void {
  eventListeners.push(listener);
}

/**
 * Remove a listener
 * 
 * @param listener - Listener to remove
 */
export function offNewInstruction(listener: (instruction: ExecutionInstruction) => void): void {
  eventListeners = eventListeners.filter((l) => l !== listener);
}

/**
 * Notify all listeners of a new instruction
 * 
 * @param instruction - New ExecutionInstruction
 */
function notifyListeners(instruction: ExecutionInstruction): void {
  eventListeners.forEach((listener) => {
    try {
      listener(instruction);
    } catch (error) {
      console.error('❌ Error in NET event listener:', error);
    }
  });
}

// ============================================================================
// RESET NET
// ============================================================================

/**
 * Reset NET (for testing or reinitialization)
 */
export function resetNET(): void {
  if (translator) {
    translator = null;
    isInitialized = false;
    eventListeners = [];
    console.log('🔄 NET reset');
  }
}

// ============================================================================
// IS INITIALIZED
// ============================================================================

/**
 * Check if NET is initialized
 */
export function isNetInitialized(): boolean {
  return isInitialized;
}

// ============================================================================
// AUTO-TRANSLATE FROM SNHL
// ============================================================================

/**
 * Automatically translate HIFs from SNHL
 * 
 * This function integrates NET with SNHL by automatically translating
 * every HIF generated by the harmonizer.
 * 
 * Usage:
 * ```typescript
 * import { startLoop } from '@/app/services/intelligence/snhlService';
 * import { autoTranslateFromSNHL } from '@/app/services/intelligence/netService';
 * 
 * startLoop(autoTranslateFromSNHL);
 * ```
 * 
 * @param hif - HIF from SNHL
 * @param context - Optional execution context
 */
export function autoTranslateFromSNHL(hif: HIF, context?: ExecutionContext): void {
  if (!hif) return;

  const instruction = translateHIF(hif, context);
  
  if (instruction) {
    console.log(`✅ Auto-translated HIF #${hif.frameNumber} → ${instruction.action}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initNET,
  translateHIF,
  getLastTranslation,
  getStatistics,
  onNewInstruction,
  offNewInstruction,
  resetNET,
  isNetInitialized,
  autoTranslateFromSNHL,
};
