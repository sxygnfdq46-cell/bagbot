/**
 * 🎼 EXO SERVICE — Execution Orchestrator Service
 * 
 * STEP 24.39 — React Integration Service
 * 
 * Purpose:
 * React-friendly service wrapper for the Execution Orchestrator (EXO).
 * Provides easy access to final execution decisions for React components.
 * 
 * Responsibilities:
 * - Initialize EXO singleton
 * - Orchestrate all decision layers into final command
 * - Get EXO state and statistics
 * - Event listeners for decision updates
 * - Auto-integration with DPL, MSFE, EAE, Shield
 * 
 * Frontend-safe, no backend calls.
 */

'use client';

import { getExecutionOrchestrator } from '@/app/lib/exo/ExecutionOrchestrator';
import type {
  EXODecision,
  EXOConfig,
  EXOSnapshot,
  EXOStatistics,
  EXOContext,
  OrderbookData,
} from '@/app/lib/exo/types';
import type { DPLDecision } from '@/app/lib/dpl/types';
import type { FusionResult } from '@/app/lib/msfe/types';
import type { EAETiming } from '@/app/lib/eae/types';

// ============================================================================
// GLOBAL STATE
// ============================================================================

let exoInstance: ReturnType<typeof getExecutionOrchestrator> | null = null;
let lastDecision: EXODecision | null = null;

// Event listeners
const decisionListeners: Array<(decision: EXODecision) => void> = [];
const executeListeners: Array<(decision: EXODecision) => void> = [];
const blockListeners: Array<(decision: EXODecision) => void> = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * initEXO — Initialize Execution Orchestrator
 * 
 * @param config - Optional configuration overrides
 * @returns EXO instance
 */
export function initEXO(config?: Partial<EXOConfig>) {
  if (!exoInstance) {
    console.log('🎼 Initializing EXO Service...');
    exoInstance = getExecutionOrchestrator(config);
    console.log('✅ EXO Service initialized');
  }
  return exoInstance;
}

/**
 * getEXO — Get EXO instance (creates if not exists)
 */
export function getEXO() {
  if (!exoInstance) {
    initEXO();
  }
  return exoInstance!;
}

// ============================================================================
// EXECUTION ORCHESTRATION
// ============================================================================

/**
 * evaluateEXO — Orchestrate all layers into final execution decision
 * 
 * @param dpl - DPL decision
 * @param fusion - MSFE fusion result
 * @param eae - EAE timing
 * @param shield - Shield state
 * @param context - EXO context
 * @param orderbook - Optional orderbook snapshot
 * @returns Final execution decision
 */
export function evaluateEXO(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  shield: string,
  context: EXOContext,
  orderbook?: OrderbookData
): EXODecision {
  const exo = getEXO();

  console.log(`🎼 EXO: Orchestrating final decision...`);

  // Load inputs
  exo.loadInputs(dpl, fusion, eae, shield, context, orderbook);

  // Compute final decision
  const decision = exo.computeFinalDecision();

  // Store decision
  lastDecision = decision;

  // Notify listeners
  notifyDecisionListeners(decision);

  // Check command type
  if (decision.command === 'EXECUTE') {
    notifyExecuteListeners(decision);
  } else if (decision.command === 'WAIT' || decision.command === 'CANCEL') {
    notifyBlockListeners(decision);
  }

  console.log(
    `✅ EXO: Final decision → ${decision.command} | ` +
    `Strength: ${decision.strength}, Risk: ${decision.riskScore}, Size: ${(decision.finalSize * 100).toFixed(0)}%`
  );

  return decision;
}

// ============================================================================
// STATE QUERIES
// ============================================================================

/**
 * getEXOState — Get current EXO state
 */
export function getEXOState(): EXODecision | null {
  return lastDecision;
}

/**
 * getEXOSnapshot — Get high-level EXO snapshot
 */
export function getEXOSnapshot(): EXOSnapshot | null {
  const exo = getEXO();
  const stats = exo.getStatistics();
  const lastDecision = exo.getSnapshot();

  if (!lastDecision) {
    return null;
  }

  const executionRate = stats.executionsIssued / Math.max(stats.totalEvaluations, 1);
  const blockRate = stats.executionsBlocked / Math.max(stats.totalEvaluations, 1);
  const topBlockingRule = getTopBlockingRule(stats.ruleBlockRate);
  const signalAlignment = lastDecision.metadata.signalMerge.alignment.overallAlignment;

  return {
    lastDecision,
    lastCommand: lastDecision.command,
    executionRate,
    blockRate,
    averageStrength: stats.averageStrength,
    averageRiskScore: stats.averageRiskScore,
    topBlockingRule,
    signalAlignment,
    statistics: stats,
    lastEvaluation: lastDecision.timestamp,
  };
}

/**
 * getStatistics — Get EXO statistics
 */
export function getStatistics(): EXOStatistics {
  const exo = getEXO();
  return exo.getStatistics();
}

/**
 * getLastDecision — Get last EXO decision
 */
export function getLastDecision(): EXODecision | null {
  return lastDecision;
}

/**
 * getLastCommand — Get last command issued
 */
export function getLastCommand(): 'EXECUTE' | 'WAIT' | 'CANCEL' | 'SCALE' | null {
  return lastDecision?.command || null;
}

/**
 * getExecutionRate — Get execution rate
 */
export function getExecutionRate(): number {
  const stats = getStatistics();
  return stats.executionsIssued / Math.max(stats.totalEvaluations, 1);
}

/**
 * getBlockRate — Get block rate
 */
export function getBlockRate(): number {
  const stats = getStatistics();
  return stats.executionsBlocked / Math.max(stats.totalEvaluations, 1);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * onDecisionComplete — Listen for decision completion
 */
export function onDecisionComplete(listener: (decision: EXODecision) => void): () => void {
  decisionListeners.push(listener);
  console.log('🎼 EXO: Decision listener registered');

  // Return unsubscribe function
  return () => {
    const index = decisionListeners.indexOf(listener);
    if (index > -1) {
      decisionListeners.splice(index, 1);
      console.log('🎼 EXO: Decision listener removed');
    }
  };
}

/**
 * onExecuteCommand — Listen for EXECUTE commands
 */
export function onExecuteCommand(listener: (decision: EXODecision) => void): () => void {
  executeListeners.push(listener);
  console.log('🎼 EXO: Execute listener registered');

  // Return unsubscribe function
  return () => {
    const index = executeListeners.indexOf(listener);
    if (index > -1) {
      executeListeners.splice(index, 1);
      console.log('🎼 EXO: Execute listener removed');
    }
  };
}

/**
 * onBlockCommand — Listen for WAIT/CANCEL commands
 */
export function onBlockCommand(listener: (decision: EXODecision) => void): () => void {
  blockListeners.push(listener);
  console.log('🎼 EXO: Block listener registered');

  // Return unsubscribe function
  return () => {
    const index = blockListeners.indexOf(listener);
    if (index > -1) {
      blockListeners.splice(index, 1);
      console.log('🎼 EXO: Block listener removed');
    }
  };
}

// ============================================================================
// EVENT NOTIFICATIONS
// ============================================================================

/**
 * notifyDecisionListeners — Notify decision completion listeners
 */
function notifyDecisionListeners(decision: EXODecision) {
  for (const listener of decisionListeners) {
    try {
      listener(decision);
    } catch (error) {
      console.error('Error in decision listener:', error);
    }
  }
}

/**
 * notifyExecuteListeners — Notify execute command listeners
 */
function notifyExecuteListeners(decision: EXODecision) {
  for (const listener of executeListeners) {
    try {
      listener(decision);
    } catch (error) {
      console.error('Error in execute listener:', error);
    }
  }
}

/**
 * notifyBlockListeners — Notify block command listeners
 */
function notifyBlockListeners(decision: EXODecision) {
  for (const listener of blockListeners) {
    try {
      listener(decision);
    } catch (error) {
      console.error('Error in block listener:', error);
    }
  }
}

// ============================================================================
// AUTO-INTEGRATION HELPERS
// ============================================================================

/**
 * autoEvaluateFromEAE — Auto-evaluate when EAE timing completes
 * 
 * This can be called from EAE service to automatically trigger EXO
 * orchestration when timing evaluation completes.
 */
export function autoEvaluateFromEAE(
  dpl: DPLDecision,
  fusion: FusionResult,
  eae: EAETiming,
  shield: string,
  context: EXOContext,
  orderbook?: OrderbookData
): EXODecision {
  console.log('🎼 EXO: Auto-evaluation triggered by EAE');
  return evaluateEXO(dpl, fusion, eae, shield, context, orderbook);
}

/**
 * createMockContext — Helper to create mock EXO context
 */
export function createMockContext(): EXOContext {
  return {
    dplDecision: {
      allowTrade: true,
      action: 'LONG',
      confidence: 75,
      validatorResults: [],
      overallScore: 75,
      reasons: [],
      debug: {} as any,
      timestamp: Date.now(),
    },
    fusionResult: {
      signal: 'LONG',
      strength: 75,
      weights: {},
      hasConflict: false,
      conflictResolution: null,
      debug: {} as any,
      timestamp: Date.now(),
    },
    eaeTiming: {
      fire: true,
      windowStart: Date.now(),
      windowEnd: Date.now() + 300000,
      timingScore: 75,
      recommendedSize: 0.5,
      conditions: [],
      syncState: 'GOOD',
      debug: {} as any,
      timestamp: Date.now(),
    },
    shieldState: 'CALM',
    marketContext: {
      shield: 'CALM',
      threats: 30,
      volatility: 'medium',
    },
    timestamp: Date.now(),
  };
}

// ============================================================================
// TESTING / SIMULATION
// ============================================================================

/**
 * simulateEXO — Simulate EXO orchestration with mock data (for testing)
 */
export function simulateEXO(): EXODecision {
  const mockContext = createMockContext();

  return evaluateEXO(
    mockContext.dplDecision,
    mockContext.fusionResult,
    mockContext.eaeTiming,
    mockContext.shieldState,
    mockContext
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * getTopBlockingRule — Get most common blocking rule
 */
function getTopBlockingRule(ruleBlockRate: Record<string, number>): string | null {
  if (Object.keys(ruleBlockRate).length === 0) {
    return null;
  }

  let topRule = '';
  let maxRate = 0;

  for (const [rule, rate] of Object.entries(ruleBlockRate)) {
    if (rate > maxRate) {
      maxRate = rate;
      topRule = rule;
    }
  }

  return topRule || null;
}

/**
 * shouldExecute — Check if last decision was to execute
 */
export function shouldExecute(): boolean {
  return lastDecision?.command === 'EXECUTE';
}

/**
 * getFinalPositionSize — Get final position size from last decision
 */
export function getFinalPositionSize(): number {
  return lastDecision?.finalSize || 0;
}

/**
 * getRiskScore — Get risk score from last decision
 */
export function getRiskScore(): number {
  return lastDecision?.riskScore || 0;
}

// ============================================================================
// RESET / CLEANUP
// ============================================================================

/**
 * resetEXO — Reset EXO state (for testing)
 */
export function resetEXO() {
  console.log('🎼 Resetting EXO Service...');
  exoInstance = null;
  lastDecision = null;
  decisionListeners.length = 0;
  executeListeners.length = 0;
  blockListeners.length = 0;
  console.log('✅ EXO Service reset');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  initEXO,
  getEXO,
  evaluateEXO,
  getEXOState,
  getEXOSnapshot,
  getStatistics,
  getLastDecision,
  getLastCommand,
  getExecutionRate,
  getBlockRate,
  onDecisionComplete,
  onExecuteCommand,
  onBlockCommand,
  autoEvaluateFromEAE,
  createMockContext,
  simulateEXO,
  shouldExecute,
  getFinalPositionSize,
  getRiskScore,
  resetEXO,
};
