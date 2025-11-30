/**
 * Override Service - React Service for Execution Override
 * 
 * Provides React integration for the Execution Override system.
 * Manages pre-trade and mid-trade safety checks with event listeners.
 */

import { getExecutionOverride } from '@/app/lib/execution/ExecutionOverride';
import {
  OverrideResult,
  TradeSnapshot,
  PositionSnapshot,
  ValidationResult,
  OverrideSummary,
  TradeModification,
} from '@/app/lib/execution/ExecutionOverride';
import { OverrideRules } from '@/app/lib/execution/overrideRules';

/**
 * Override service state
 */
interface OverrideServiceState {
  initialized: boolean;
  lastCheck: OverrideResult | null;
  lastValidation: ValidationResult | null;
  activeOverrides: number;
  listeners: OverrideListeners;
}

/**
 * Override event listeners
 */
interface OverrideListeners {
  onOverrideTriggered?: (result: OverrideResult) => void;
  onTradeBlocked?: (result: OverrideResult) => void;
  onTradeModified?: (result: OverrideResult, modifications: TradeModification) => void;
  onTradeAllowed?: (result: OverrideResult) => void;
  onCriticalOverride?: (result: OverrideResult) => void;
  onValidationFailed?: (validation: ValidationResult) => void;
  onShieldActivated?: () => void;
  onShieldDeactivated?: () => void;
}

/**
 * Override output
 */
interface OverrideOutput {
  result: OverrideResult | null;
  validation: ValidationResult | null;
  summary: OverrideSummary;
  stats: any;
  recentOverrides: OverrideResult[];
  blockedTrades: OverrideResult[];
  modifiedTrades: OverrideResult[];
}

// Service state
const state: OverrideServiceState = {
  initialized: false,
  lastCheck: null,
  lastValidation: null,
  activeOverrides: 0,
  listeners: {},
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize override service
 */
export function initOverride(): void {
  if (state.initialized) {
    console.log('[Override Service] Already initialized');
    return;
  }
  
  console.log('[Override Service] Initializing...');
  
  // Get singleton instance
  const override = getExecutionOverride();
  
  // Reset state
  state.initialized = true;
  state.lastCheck = null;
  state.lastValidation = null;
  state.activeOverrides = 0;
  
  console.log('[Override Service] Initialized successfully');
}

/**
 * Check if initialized
 */
export function isInitialized(): boolean {
  return state.initialized;
}

// ============================================================================
// Core Operations
// ============================================================================

/**
 * Run pre-trade override check
 */
export function runPreTradeOverride(snapshot: TradeSnapshot): OverrideResult {
  if (!state.initialized) {
    console.warn('[Override Service] Not initialized - initializing now');
    initOverride();
  }
  
  console.log(`[Override Service] Running pre-trade override for ${snapshot.symbol}`);
  
  const override = getExecutionOverride();
  const result = override.checkPreTrade(snapshot);
  
  // Update state
  state.lastCheck = result;
  if (result.override) {
    state.activeOverrides++;
  }
  
  // Trigger listeners
  triggerListeners(result);
  
  return result;
}

/**
 * Run mid-trade override check
 */
export function runMidTradeOverride(
  snapshot: TradeSnapshot,
  position: PositionSnapshot
): OverrideResult {
  if (!state.initialized) {
    console.warn('[Override Service] Not initialized - initializing now');
    initOverride();
  }
  
  console.log(`[Override Service] Running mid-trade override for ${snapshot.symbol}`);
  
  const override = getExecutionOverride();
  const result = override.checkMidTrade(snapshot, position);
  
  // Update state
  state.lastCheck = result;
  if (result.override) {
    state.activeOverrides++;
  }
  
  // Trigger listeners
  triggerListeners(result);
  
  return result;
}

/**
 * Validate execution conditions
 */
export function validateExecution(snapshot: TradeSnapshot): ValidationResult {
  if (!state.initialized) {
    console.warn('[Override Service] Not initialized - initializing now');
    initOverride();
  }
  
  console.log(`[Override Service] Validating execution for ${snapshot.symbol}`);
  
  const override = getExecutionOverride();
  const validation = override.validateExecutionConditions(snapshot);
  
  // Update state
  state.lastValidation = validation;
  
  // Trigger listener if validation failed
  if (!validation.valid && state.listeners.onValidationFailed) {
    state.listeners.onValidationFailed(validation);
  }
  
  return validation;
}

/**
 * Apply manual override
 */
export function applyManualOverride(
  reason: string,
  severity: number = 100
): OverrideResult {
  if (!state.initialized) {
    console.warn('[Override Service] Not initialized - initializing now');
    initOverride();
  }
  
  console.log(`[Override Service] Applying manual override: ${reason}`);
  
  const override = getExecutionOverride();
  const result = override.applyOverride(reason, severity);
  
  // Update state
  state.lastCheck = result;
  state.activeOverrides++;
  
  // Trigger listeners
  triggerListeners(result);
  
  return result;
}

/**
 * Get override output
 */
export function getOverrideOutput(): OverrideOutput {
  const override = getExecutionOverride();
  
  return {
    result: state.lastCheck,
    validation: state.lastValidation,
    summary: override.getOverrideSummary(),
    stats: override.getStatistics(),
    recentOverrides: override.getRecentOverrides(10),
    blockedTrades: override.getBlockedTrades(),
    modifiedTrades: override.getModifiedTrades(),
  };
}

// ============================================================================
// Event Listeners
// ============================================================================

/**
 * Trigger appropriate listeners based on result
 */
function triggerListeners(result: OverrideResult): void {
  // Override triggered
  if (result.override && state.listeners.onOverrideTriggered) {
    state.listeners.onOverrideTriggered(result);
  }
  
  // Trade blocked
  if (result.action === 'BLOCK' && state.listeners.onTradeBlocked) {
    state.listeners.onTradeBlocked(result);
  }
  
  // Trade modified
  if (result.action === 'MODIFY' && state.listeners.onTradeModified && result.modifications) {
    state.listeners.onTradeModified(result, result.modifications);
  }
  
  // Trade allowed
  if (result.action === 'ALLOW' && state.listeners.onTradeAllowed) {
    state.listeners.onTradeAllowed(result);
  }
  
  // Critical override
  if (result.severity >= 80 && state.listeners.onCriticalOverride) {
    state.listeners.onCriticalOverride(result);
  }
}

/**
 * Register override triggered listener
 */
export function onOverrideTriggered(
  callback: (result: OverrideResult) => void
): void {
  state.listeners.onOverrideTriggered = callback;
  console.log('[Override Service] Registered onOverrideTriggered listener');
}

/**
 * Register trade blocked listener
 */
export function onTradeBlocked(
  callback: (result: OverrideResult) => void
): void {
  state.listeners.onTradeBlocked = callback;
  console.log('[Override Service] Registered onTradeBlocked listener');
}

/**
 * Register trade modified listener
 */
export function onTradeModified(
  callback: (result: OverrideResult, modifications: TradeModification) => void
): void {
  state.listeners.onTradeModified = callback;
  console.log('[Override Service] Registered onTradeModified listener');
}

/**
 * Register trade allowed listener
 */
export function onTradeAllowed(
  callback: (result: OverrideResult) => void
): void {
  state.listeners.onTradeAllowed = callback;
  console.log('[Override Service] Registered onTradeAllowed listener');
}

/**
 * Register critical override listener
 */
export function onCriticalOverride(
  callback: (result: OverrideResult) => void
): void {
  state.listeners.onCriticalOverride = callback;
  console.log('[Override Service] Registered onCriticalOverride listener');
}

/**
 * Register validation failed listener
 */
export function onValidationFailed(
  callback: (validation: ValidationResult) => void
): void {
  state.listeners.onValidationFailed = callback;
  console.log('[Override Service] Registered onValidationFailed listener');
}

/**
 * Register shield activated listener
 */
export function onShieldActivated(callback: () => void): void {
  state.listeners.onShieldActivated = callback;
  console.log('[Override Service] Registered onShieldActivated listener');
}

/**
 * Register shield deactivated listener
 */
export function onShieldDeactivated(callback: () => void): void {
  state.listeners.onShieldDeactivated = callback;
  console.log('[Override Service] Registered onShieldDeactivated listener');
}

/**
 * Clear all listeners
 */
export function clearListeners(): void {
  state.listeners = {};
  console.log('[Override Service] All listeners cleared');
}

// ============================================================================
// State Management
// ============================================================================

/**
 * Set shield state
 */
export function setShieldState(active: boolean): void {
  const override = getExecutionOverride();
  override.setShieldActive(active);
  
  // Trigger listener
  if (active && state.listeners.onShieldActivated) {
    state.listeners.onShieldActivated();
  } else if (!active && state.listeners.onShieldDeactivated) {
    state.listeners.onShieldDeactivated();
  }
}

/**
 * Set threat level
 */
export function setThreatLevel(level: number): void {
  const override = getExecutionOverride();
  override.setThreatLevel(level);
}

/**
 * Set volatility level
 */
export function setVolatilityLevel(level: number): void {
  const override = getExecutionOverride();
  override.setVolatilityLevel(level);
}

/**
 * Set flow state
 */
export function setFlowState(flowState: string): void {
  const override = getExecutionOverride();
  override.setFlowState(flowState);
}

/**
 * Update engine states (convenience method)
 */
export function updateEngineStates(states: {
  shieldActive?: boolean;
  threatLevel?: number;
  volatilityLevel?: number;
  flowState?: string;
}): void {
  if (states.shieldActive !== undefined) {
    setShieldState(states.shieldActive);
  }
  
  if (states.threatLevel !== undefined) {
    setThreatLevel(states.threatLevel);
  }
  
  if (states.volatilityLevel !== undefined) {
    setVolatilityLevel(states.volatilityLevel);
  }
  
  if (states.flowState !== undefined) {
    setFlowState(states.flowState);
  }
}

// ============================================================================
// Rule Management
// ============================================================================

/**
 * Adjust rule threshold
 */
export function adjustRuleThreshold(
  ruleName: string,
  adjustment: number,
  reason: string
): void {
  console.log(`[Override Service] Adjusting rule '${ruleName}' by ${adjustment}: ${reason}`);
  OverrideRules.adjustThreshold(ruleName, adjustment, reason);
}

/**
 * Tighten all rules (increase protection)
 */
export function tightenRules(factor: number = 0.9): void {
  console.log(`[Override Service] Tightening all rules by factor ${factor}`);
  OverrideRules.tightenAll(factor);
}

/**
 * Loosen all rules (reduce protection)
 */
export function loosenRules(factor: number = 1.1): void {
  console.log(`[Override Service] Loosening all rules by factor ${factor}`);
  OverrideRules.loosenAll(factor);
}

/**
 * Reset rules to defaults
 */
export function resetRules(): void {
  console.log('[Override Service] Resetting all rules to defaults');
  OverrideRules.resetAll();
}

/**
 * Enable/disable rule
 */
export function setRuleEnabled(ruleName: string, enabled: boolean): void {
  console.log(`[Override Service] ${enabled ? 'Enabling' : 'Disabling'} rule '${ruleName}'`);
  OverrideRules.setEnabled(ruleName, enabled);
}

/**
 * Get all rule configurations
 */
export function getRuleConfigs() {
  return OverrideRules.getAllConfigs();
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Should execute trade based on override result?
 */
export function shouldExecuteTrade(result: OverrideResult): boolean {
  return result.action === 'ALLOW' || result.action === 'MODIFY';
}

/**
 * Should block trade based on override result?
 */
export function shouldBlockTrade(result: OverrideResult): boolean {
  return result.action === 'BLOCK';
}

/**
 * Get trade modifications
 */
export function getTradeModifications(result: OverrideResult): TradeModification | null {
  return result.modifications || null;
}

/**
 * Get override severity level
 */
export function getSeverityLevel(severity: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (severity >= 80) return 'CRITICAL';
  if (severity >= 60) return 'HIGH';
  if (severity >= 40) return 'MEDIUM';
  return 'LOW';
}

/**
 * Format override reason
 */
export function formatOverrideReason(result: OverrideResult): string {
  const severityLevel = getSeverityLevel(result.severity);
  return `[${severityLevel}] ${result.reason}`;
}

/**
 * Get service state
 */
export function getServiceState() {
  return {
    initialized: state.initialized,
    lastCheck: state.lastCheck,
    lastValidation: state.lastValidation,
    activeOverrides: state.activeOverrides,
    listenerCount: Object.keys(state.listeners).length,
  };
}

/**
 * Reset service
 */
export function resetService(): void {
  state.initialized = false;
  state.lastCheck = null;
  state.lastValidation = null;
  state.activeOverrides = 0;
  state.listeners = {};
  
  console.log('[Override Service] Service reset');
}

// ============================================================================
// Mock Helpers (for development/testing)
// ============================================================================

/**
 * Create mock trade snapshot
 */
export function createMockSnapshot(overrides?: Partial<TradeSnapshot>): TradeSnapshot {
  return {
    symbol: 'BTC/USD',
    price: 50000,
    spread: 0.1,
    volatility: 50,
    expectedSlippage: 0.2,
    momentumChange: 10,
    reversalConfidence: 30,
    liquidity: 70,
    conflictCount: 0,
    priceGap: 0.5,
    timestamp: Date.now(),
    ...overrides,
  };
}

/**
 * Create mock position snapshot
 */
export function createMockPosition(overrides?: Partial<PositionSnapshot>): PositionSnapshot {
  return {
    symbol: 'BTC/USD',
    size: 1.0,
    entry: 49000,
    current: 50000,
    pnl: 1000,
    pnlPercent: 2.04,
    duration: 3600000, // 1 hour
    ...overrides,
  };
}

/**
 * Simulate dangerous conditions
 */
export function simulateDangerousConditions(): TradeSnapshot {
  return createMockSnapshot({
    spread: 2.0,           // Wide spread
    volatility: 95,        // High volatility
    expectedSlippage: 1.5, // High slippage
    momentumChange: -50,   // Large momentum drop
    reversalConfidence: 85, // Strong reversal
    liquidity: 20,         // Low liquidity
    conflictCount: 5,      // Many conflicts
    priceGap: 5.0,         // Large price gap
  });
}

/**
 * Simulate safe conditions
 */
export function simulateSafeConditions(): TradeSnapshot {
  return createMockSnapshot({
    spread: 0.05,
    volatility: 30,
    expectedSlippage: 0.1,
    momentumChange: 15,
    reversalConfidence: 10,
    liquidity: 90,
    conflictCount: 0,
    priceGap: 0.1,
  });
}

/**
 * Test pre-trade override
 */
export function testPreTradeOverride(): void {
  console.log('[Override Service] Testing pre-trade override...');
  
  initOverride();
  
  // Test with safe conditions
  console.log('\n--- Testing Safe Conditions ---');
  const safeSnapshot = simulateSafeConditions();
  const safeResult = runPreTradeOverride(safeSnapshot);
  console.log('Safe result:', safeResult);
  
  // Test with dangerous conditions
  console.log('\n--- Testing Dangerous Conditions ---');
  const dangerSnapshot = simulateDangerousConditions();
  const dangerResult = runPreTradeOverride(dangerSnapshot);
  console.log('Danger result:', dangerResult);
  
  // Show summary
  console.log('\n--- Override Summary ---');
  console.log(getOverrideOutput().summary);
}

/**
 * Test mid-trade override
 */
export function testMidTradeOverride(): void {
  console.log('[Override Service] Testing mid-trade override...');
  
  initOverride();
  
  const snapshot = simulateDangerousConditions();
  const position = createMockPosition();
  
  const result = runMidTradeOverride(snapshot, position);
  console.log('Mid-trade result:', result);
  
  if (result.modifications) {
    console.log('Modifications:', result.modifications);
  }
}

/**
 * Test validation
 */
export function testValidation(): void {
  console.log('[Override Service] Testing validation...');
  
  initOverride();
  
  // Test safe
  console.log('\n--- Safe Validation ---');
  const safeSnapshot = simulateSafeConditions();
  const safeValidation = validateExecution(safeSnapshot);
  console.log('Safe validation:', safeValidation);
  
  // Test dangerous
  console.log('\n--- Dangerous Validation ---');
  const dangerSnapshot = simulateDangerousConditions();
  const dangerValidation = validateExecution(dangerSnapshot);
  console.log('Danger validation:', dangerValidation);
}

// Export service
export const OverrideService = {
  // Initialization
  init: initOverride,
  isInitialized,
  reset: resetService,
  
  // Core operations
  runPreTrade: runPreTradeOverride,
  runMidTrade: runMidTradeOverride,
  validate: validateExecution,
  applyManual: applyManualOverride,
  getOutput: getOverrideOutput,
  
  // Event listeners
  onOverrideTriggered,
  onTradeBlocked,
  onTradeModified,
  onTradeAllowed,
  onCriticalOverride,
  onValidationFailed,
  onShieldActivated,
  onShieldDeactivated,
  clearListeners,
  
  // State management
  setShieldState,
  setThreatLevel,
  setVolatilityLevel,
  setFlowState,
  updateEngineStates,
  
  // Rule management
  adjustRuleThreshold,
  tightenRules,
  loosenRules,
  resetRules,
  setRuleEnabled,
  getRuleConfigs,
  
  // Utilities
  shouldExecute: shouldExecuteTrade,
  shouldBlock: shouldBlockTrade,
  getModifications: getTradeModifications,
  getSeverityLevel,
  formatReason: formatOverrideReason,
  getState: getServiceState,
  
  // Mock helpers
  createMockSnapshot,
  createMockPosition,
  simulateDangerous: simulateDangerousConditions,
  simulateSafe: simulateSafeConditions,
  testPreTrade: testPreTradeOverride,
  testMidTrade: testMidTradeOverride,
  testValidation,
};

export default OverrideService;
