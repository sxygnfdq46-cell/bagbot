/**
 * 🎼 EXO MERGE SIGNALS — Signal Merging Functions
 * 
 * STEP 24.39 — Signal Merging
 * 
 * Purpose:
 * Merge signals from all decision layers (DPL, MSFE, EAE, Shield) into
 * a unified execution signal with weighted confidence.
 * 
 * Think of this as the "signal conductor" - taking input from multiple
 * sources and harmonizing them into a single, confident decision.
 */

import type {
  SignalMergeData,
  SignalWeights,
  SignalAlignment,
  SignalConflict,
  LayerInputs,
} from './types';
import type { DPLDecision } from '../dpl/types';
import type { FusionResult } from '../msfe/types';
import type { EAETiming } from '../eae/types';

// ============================================================================
// MERGE DECISION LAYERS — Main signal merging
// ============================================================================

/**
 * mergeDecisionLayers — Merge all decision layers into unified signal
 * 
 * Algorithm:
 * 1. Extract signals from each layer
 * 2. Compute weights based on layer confidence
 * 3. Check alignment between layers
 * 4. Detect conflicts
 * 5. Compute final signal and strength
 * 
 * @param dpl - DPL decision
 * @param fusion - MSFE fusion result
 * @param eae - EAE timing
 * @param shield - Shield state
 * @returns Merged signal data
 */
export function mergeDecisionLayers(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  shield: string
): SignalMergeData {
  // Step 1: Extract signals
  const dplSignal = dpl.allowTrade ? dpl.action : 'WAIT';
  const fusionSignal = fusion.signal;
  const eaeSignal = eae.fire ? 'EXECUTE' : 'WAIT';
  const shieldSignal = getShieldSignal(shield);

  // Step 2: Compute weights
  const weights = computeSignalWeights(dpl, fusion, eae, shield);

  // Step 3: Check alignment
  const alignment = checkSignalAlignment(dplSignal, fusionSignal, eaeSignal, shieldSignal);

  // Step 4: Detect conflicts
  const conflicts = detectSignalConflicts(dplSignal, fusionSignal, eaeSignal, shieldSignal);

  // Step 5: Compute final signal
  const finalSignal = computeFinalSignal(dplSignal, fusionSignal, eaeSignal, shieldSignal, weights);

  // Step 6: Compute signal strength
  const signalStrength = computeSignalStrength(dpl, fusion, eae, alignment);

  // Step 7: Compute execution confidence
  const confidence = computeExecutionConfidence(dpl, fusion, eae, alignment, conflicts);

  return {
    finalSignal,
    signalStrength,
    confidence,
    weights,
    alignment,
    conflicts,
  };
}

// ============================================================================
// COMPUTE SIGNAL WEIGHTS — Dynamic weight assignment
// ============================================================================

/**
 * computeSignalWeights — Compute weights for each layer
 * 
 * Weights are adjusted based on:
 * - Layer confidence
 * - Shield state (defensive = higher shield weight)
 * - Alignment between layers
 * 
 * @returns Signal weights (sum to 1.0)
 */
export function computeSignalWeights(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  shield: string
): SignalWeights {
  // Base weights
  let weights: SignalWeights = {
    dpl: 0.35,
    fusion: 0.30,
    eae: 0.25,
    shield: 0.10,
  };

  // Adjust DPL weight based on confidence
  if (dpl.confidence < 50) {
    weights.dpl *= 0.7; // Reduce DPL weight if low confidence
  } else if (dpl.confidence > 80) {
    weights.dpl *= 1.2; // Increase DPL weight if high confidence
  }

  // Adjust fusion weight based on strength
  if (fusion.strength < 60) {
    weights.fusion *= 0.7;
  } else if (fusion.strength > 80) {
    weights.fusion *= 1.2;
  }

  // Adjust EAE weight based on timing score
  if (eae.timingScore < 60) {
    weights.eae *= 0.7;
  } else if (eae.timingScore > 80) {
    weights.eae *= 1.2;
  }

  // Adjust shield weight based on state
  if (shield === 'DEFENSIVE' || shield === 'PROTECTIVE') {
    weights.shield *= 2.0; // Significantly increase shield influence in defensive mode
  }

  // Normalize weights to sum to 1.0
  const total = weights.dpl + weights.fusion + weights.eae + weights.shield;
  weights.dpl /= total;
  weights.fusion /= total;
  weights.eae /= total;
  weights.shield /= total;

  return weights;
}

// ============================================================================
// COMPUTE EXECUTION CONFIDENCE — Overall confidence score
// ============================================================================

/**
 * computeExecutionConfidence — Calculate overall execution confidence
 * 
 * Combines:
 * - Individual layer confidence scores
 * - Alignment between layers
 * - Presence of conflicts
 * 
 * @returns Confidence score (0-100)
 */
export function computeExecutionConfidence(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  alignment: SignalAlignment,
  conflicts: SignalConflict[]
): number {
  let confidence = 0;

  // DPL contribution (35%)
  confidence += dpl.confidence * 0.35;

  // Fusion contribution (30%)
  confidence += fusion.strength * 0.30;

  // EAE contribution (25%)
  confidence += eae.timingScore * 0.25;

  // Alignment contribution (10%)
  confidence += alignment.overallAlignment * 0.10;

  // Penalize for conflicts
  const conflictPenalty = conflicts.reduce((penalty, conflict) => {
    if (conflict.severity === 'HIGH') return penalty + 15;
    if (conflict.severity === 'MEDIUM') return penalty + 10;
    return penalty + 5;
  }, 0);

  confidence = Math.max(0, confidence - conflictPenalty);

  return Math.round(confidence);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * getShieldSignal — Convert shield state to signal
 */
function getShieldSignal(shield: string): 'LONG' | 'SHORT' | 'WAIT' {
  if (shield === 'DEFENSIVE' || shield === 'PROTECTIVE') {
    return 'WAIT'; // Defensive shields suggest waiting
  }
  return 'LONG'; // CALM, AGGRO_OBS allow trading
}

/**
 * checkSignalAlignment — Check if all layers agree
 */
function checkSignalAlignment(
  dplSignal: string,
  fusionSignal: string,
  eaeSignal: string,
  shieldSignal: string
): SignalAlignment {
  // Normalize signals
  const dplNorm = normalizeSignal(dplSignal);
  const fusionNorm = normalizeSignal(fusionSignal);
  const eaeNorm = normalizeSignal(eaeSignal);
  const shieldNorm = normalizeSignal(shieldSignal);

  // Check individual alignments
  const dplAligned = dplNorm === fusionNorm || dplNorm === 'WAIT';
  const fusionAligned = fusionNorm !== 'NEUTRAL';
  const eaeAligned = eaeNorm === 'EXECUTE';
  const shieldAligned = shieldNorm !== 'WAIT';

  // Compute overall alignment
  const alignedCount = [dplAligned, fusionAligned, eaeAligned, shieldAligned].filter(Boolean).length;
  const overallAlignment = (alignedCount / 4) * 100;

  return {
    dplAligned,
    fusionAligned,
    eaeAligned,
    shieldAligned,
    overallAlignment: Math.round(overallAlignment),
  };
}

/**
 * detectSignalConflicts — Detect conflicts between layers
 */
function detectSignalConflicts(
  dplSignal: string,
  fusionSignal: string,
  eaeSignal: string,
  shieldSignal: string
): SignalConflict[] {
  const conflicts: SignalConflict[] = [];

  // DPL vs Fusion conflict
  if (dplSignal === 'LONG' && fusionSignal === 'SHORT') {
    conflicts.push({
      layers: ['DPL', 'Fusion'],
      description: 'DPL allows LONG but Fusion suggests SHORT',
      severity: 'HIGH',
    });
  } else if (dplSignal === 'SHORT' && fusionSignal === 'LONG') {
    conflicts.push({
      layers: ['DPL', 'Fusion'],
      description: 'DPL allows SHORT but Fusion suggests LONG',
      severity: 'HIGH',
    });
  }

  // DPL vs Shield conflict
  if ((dplSignal === 'LONG' || dplSignal === 'SHORT') && shieldSignal === 'WAIT') {
    conflicts.push({
      layers: ['DPL', 'Shield'],
      description: 'DPL allows trade but Shield is defensive',
      severity: 'MEDIUM',
    });
  }

  // EAE vs Others conflict
  if (eaeSignal === 'WAIT' && (dplSignal === 'LONG' || dplSignal === 'SHORT')) {
    conflicts.push({
      layers: ['EAE', 'DPL'],
      description: 'EAE timing not ready but DPL allows trade',
      severity: 'MEDIUM',
    });
  }

  // Fusion NEUTRAL conflict
  if (fusionSignal === 'NEUTRAL' && dplSignal !== 'WAIT') {
    conflicts.push({
      layers: ['Fusion', 'DPL'],
      description: 'Fusion is neutral but DPL suggests action',
      severity: 'LOW',
    });
  }

  return conflicts;
}

/**
 * computeFinalSignal — Compute final merged signal
 */
function computeFinalSignal(
  dplSignal: string,
  fusionSignal: string,
  eaeSignal: string,
  shieldSignal: string,
  weights: SignalWeights
): 'LONG' | 'SHORT' | 'WAIT' {
  // If shield is defensive, wait
  if (shieldSignal === 'WAIT') {
    return 'WAIT';
  }

  // If EAE says wait, wait
  if (eaeSignal === 'WAIT') {
    return 'WAIT';
  }

  // If DPL blocks trade, wait
  if (dplSignal === 'WAIT') {
    return 'WAIT';
  }

  // If fusion is neutral, wait
  if (fusionSignal === 'NEUTRAL') {
    return 'WAIT';
  }

  // Otherwise, follow fusion signal (highest authority on direction)
  return fusionSignal as 'LONG' | 'SHORT';
}

/**
 * computeSignalStrength — Compute signal strength
 */
function computeSignalStrength(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  alignment: SignalAlignment
): number {
  // Weighted average of layer strengths
  const dplStrength = dpl.overallScore;
  const fusionStrength = fusion.strength;
  const eaeStrength = eae.timingScore;

  const strength =
    dplStrength * 0.35 +
    fusionStrength * 0.30 +
    eaeStrength * 0.25 +
    alignment.overallAlignment * 0.10;

  return Math.round(strength);
}

/**
 * normalizeSignal — Normalize signal to common format
 */
function normalizeSignal(signal: string): 'LONG' | 'SHORT' | 'WAIT' | 'EXECUTE' | 'NEUTRAL' {
  const upper = signal.toUpperCase();
  if (upper === 'LONG' || upper === 'SHORT' || upper === 'WAIT') {
    return upper as 'LONG' | 'SHORT' | 'WAIT';
  }
  if (upper === 'EXECUTE') {
    return 'EXECUTE';
  }
  return 'NEUTRAL';
}

/**
 * createLayerInputsSummary — Create summary of layer inputs
 */
export function createLayerInputsSummary(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  shield: string
): LayerInputs {
  return {
    dpl: {
      allowTrade: dpl.allowTrade,
      action: dpl.action,
      confidence: dpl.confidence,
      overallScore: dpl.overallScore,
    },
    fusion: {
      signal: fusion.signal,
      strength: fusion.strength,
      hasConflict: fusion.hasConflict,
    },
    eae: {
      fire: eae.fire,
      timingScore: eae.timingScore,
      syncState: eae.syncState,
      recommendedSize: eae.recommendedSize,
    },
    shield: {
      state: shield,
      threats: 0, // Placeholder
      volatility: 'medium', // Placeholder
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  mergeDecisionLayers,
  computeSignalWeights,
  computeExecutionConfidence,
  createLayerInputsSummary,
};
