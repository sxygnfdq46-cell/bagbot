/**
 * Conductor Rules
 * 
 * Defines the ruleset for autonomous trading conductor behavior including
 * aggression levels, defense modes, timing strategies, and orchestration policies.
 */

/**
 * Aggression levels
 */
export enum AggressionLevel {
  ULTRA_CONSERVATIVE = 1,
  CONSERVATIVE = 2,
  MODERATE = 3,
  AGGRESSIVE = 4,
  ULTRA_AGGRESSIVE = 5,
}

export interface AggressionConfig {
  level: AggressionLevel;
  name: string;
  tradeFrequency: number;      // 0-100 (relative scale)
  positionSize: number;        // 0-100 (% of max)
  riskTolerance: number;       // 0-100
  stopLossMultiplier: number;  // Multiplier for stop loss distance
  takeProfitMultiplier: number;
  maxConcurrentTrades: number;
  entrySpeed: 'SLOW' | 'MODERATE' | 'FAST' | 'INSTANT';
  description: string;
}

export const AGGRESSION_LEVELS: Record<AggressionLevel, AggressionConfig> = {
  [AggressionLevel.ULTRA_CONSERVATIVE]: {
    level: AggressionLevel.ULTRA_CONSERVATIVE,
    name: 'Ultra Conservative',
    tradeFrequency: 20,
    positionSize: 30,
    riskTolerance: 15,
    stopLossMultiplier: 0.5,
    takeProfitMultiplier: 3.0,
    maxConcurrentTrades: 1,
    entrySpeed: 'SLOW',
    description: 'Minimal trading, maximum safety',
  },
  [AggressionLevel.CONSERVATIVE]: {
    level: AggressionLevel.CONSERVATIVE,
    name: 'Conservative',
    tradeFrequency: 40,
    positionSize: 50,
    riskTolerance: 30,
    stopLossMultiplier: 0.75,
    takeProfitMultiplier: 2.5,
    maxConcurrentTrades: 2,
    entrySpeed: 'SLOW',
    description: 'Cautious approach with selective entries',
  },
  [AggressionLevel.MODERATE]: {
    level: AggressionLevel.MODERATE,
    name: 'Moderate',
    tradeFrequency: 60,
    positionSize: 70,
    riskTolerance: 50,
    stopLossMultiplier: 1.0,
    takeProfitMultiplier: 2.0,
    maxConcurrentTrades: 3,
    entrySpeed: 'MODERATE',
    description: 'Balanced risk/reward profile',
  },
  [AggressionLevel.AGGRESSIVE]: {
    level: AggressionLevel.AGGRESSIVE,
    name: 'Aggressive',
    tradeFrequency: 80,
    positionSize: 85,
    riskTolerance: 70,
    stopLossMultiplier: 1.25,
    takeProfitMultiplier: 1.5,
    maxConcurrentTrades: 5,
    entrySpeed: 'FAST',
    description: 'Active trading with higher risk tolerance',
  },
  [AggressionLevel.ULTRA_AGGRESSIVE]: {
    level: AggressionLevel.ULTRA_AGGRESSIVE,
    name: 'Ultra Aggressive',
    tradeFrequency: 100,
    positionSize: 100,
    riskTolerance: 90,
    stopLossMultiplier: 1.5,
    takeProfitMultiplier: 1.25,
    maxConcurrentTrades: 8,
    entrySpeed: 'INSTANT',
    description: 'Maximum activity, high risk/high reward',
  },
};

/**
 * Defense levels
 */
export enum DefenseLevel {
  MINIMAL = 1,
  LOW = 2,
  MODERATE = 3,
  HIGH = 4,
  MAXIMUM = 5,
}

export interface DefenseConfig {
  level: DefenseLevel;
  name: string;
  protectionStrength: number;   // 0-100
  stopLossTightness: number;    // 0-100 (tighter = more conservative)
  trailingStopEnabled: boolean;
  hedgingEnabled: boolean;
  emergencyExitThreshold: number; // Loss % before emergency exit
  positionSizeReduction: number;  // % reduction from base size
  maxDrawdownLimit: number;       // % max drawdown allowed
  description: string;
}

export const DEFENSE_LEVELS: Record<DefenseLevel, DefenseConfig> = {
  [DefenseLevel.MINIMAL]: {
    level: DefenseLevel.MINIMAL,
    name: 'Minimal Defense',
    protectionStrength: 20,
    stopLossTightness: 20,
    trailingStopEnabled: false,
    hedgingEnabled: false,
    emergencyExitThreshold: 15,
    positionSizeReduction: 0,
    maxDrawdownLimit: 20,
    description: 'Minimal protections, maximum flexibility',
  },
  [DefenseLevel.LOW]: {
    level: DefenseLevel.LOW,
    name: 'Low Defense',
    protectionStrength: 40,
    stopLossTightness: 40,
    trailingStopEnabled: true,
    hedgingEnabled: false,
    emergencyExitThreshold: 10,
    positionSizeReduction: 10,
    maxDrawdownLimit: 15,
    description: 'Basic protections active',
  },
  [DefenseLevel.MODERATE]: {
    level: DefenseLevel.MODERATE,
    name: 'Moderate Defense',
    protectionStrength: 60,
    stopLossTightness: 60,
    trailingStopEnabled: true,
    hedgingEnabled: true,
    emergencyExitThreshold: 7,
    positionSizeReduction: 20,
    maxDrawdownLimit: 12,
    description: 'Balanced protection measures',
  },
  [DefenseLevel.HIGH]: {
    level: DefenseLevel.HIGH,
    name: 'High Defense',
    protectionStrength: 80,
    stopLossTightness: 80,
    trailingStopEnabled: true,
    hedgingEnabled: true,
    emergencyExitThreshold: 5,
    positionSizeReduction: 35,
    maxDrawdownLimit: 8,
    description: 'Strong protective measures',
  },
  [DefenseLevel.MAXIMUM]: {
    level: DefenseLevel.MAXIMUM,
    name: 'Maximum Defense',
    protectionStrength: 100,
    stopLossTightness: 100,
    trailingStopEnabled: true,
    hedgingEnabled: true,
    emergencyExitThreshold: 3,
    positionSizeReduction: 50,
    maxDrawdownLimit: 5,
    description: 'Maximum protection, capital preservation priority',
  },
};

/**
 * Timing modes
 */
export enum TimingMode {
  PATIENT = 'PATIENT',
  SELECTIVE = 'SELECTIVE',
  BALANCED = 'BALANCED',
  OPPORTUNISTIC = 'OPPORTUNISTIC',
  AGGRESSIVE = 'AGGRESSIVE',
}

export interface TimingConfig {
  mode: TimingMode;
  name: string;
  entryConfidenceThreshold: number;  // 0-100 minimum confidence to enter
  patternConfirmationRequired: boolean;
  multiTimeframeConfirmation: boolean;
  maxWaitTime: number;              // Max minutes to wait for entry
  minSetupQuality: number;          // 0-100 minimum setup quality
  allowPartialFills: boolean;
  reentryDelay: number;             // Minutes before re-entering same symbol
  description: string;
}

export const TIMING_MODES: Record<TimingMode, TimingConfig> = {
  [TimingMode.PATIENT]: {
    mode: TimingMode.PATIENT,
    name: 'Patient',
    entryConfidenceThreshold: 85,
    patternConfirmationRequired: true,
    multiTimeframeConfirmation: true,
    maxWaitTime: 240,
    minSetupQuality: 80,
    allowPartialFills: false,
    reentryDelay: 120,
    description: 'Wait for highest quality setups only',
  },
  [TimingMode.SELECTIVE]: {
    mode: TimingMode.SELECTIVE,
    name: 'Selective',
    entryConfidenceThreshold: 75,
    patternConfirmationRequired: true,
    multiTimeframeConfirmation: true,
    maxWaitTime: 120,
    minSetupQuality: 70,
    allowPartialFills: false,
    reentryDelay: 60,
    description: 'Choose quality setups with good confirmation',
  },
  [TimingMode.BALANCED]: {
    mode: TimingMode.BALANCED,
    name: 'Balanced',
    entryConfidenceThreshold: 65,
    patternConfirmationRequired: true,
    multiTimeframeConfirmation: false,
    maxWaitTime: 60,
    minSetupQuality: 60,
    allowPartialFills: true,
    reentryDelay: 30,
    description: 'Balance between quality and frequency',
  },
  [TimingMode.OPPORTUNISTIC]: {
    mode: TimingMode.OPPORTUNISTIC,
    name: 'Opportunistic',
    entryConfidenceThreshold: 55,
    patternConfirmationRequired: false,
    multiTimeframeConfirmation: false,
    maxWaitTime: 30,
    minSetupQuality: 50,
    allowPartialFills: true,
    reentryDelay: 15,
    description: 'Act quickly on opportunities',
  },
  [TimingMode.AGGRESSIVE]: {
    mode: TimingMode.AGGRESSIVE,
    name: 'Aggressive',
    entryConfidenceThreshold: 45,
    patternConfirmationRequired: false,
    multiTimeframeConfirmation: false,
    maxWaitTime: 15,
    minSetupQuality: 40,
    allowPartialFills: true,
    reentryDelay: 5,
    description: 'Take action on any viable signal',
  },
};

/**
 * Opportunity cycles
 */
export enum OpportunityCycle {
  DORMANT = 'DORMANT',
  SCANNING = 'SCANNING',
  EVALUATING = 'EVALUATING',
  READY = 'READY',
  EXECUTING = 'EXECUTING',
}

export interface OpportunityCycleConfig {
  cycle: OpportunityCycle;
  name: string;
  scanFrequency: number;        // Scans per minute
  evaluationDepth: number;      // 0-100 (depth of analysis)
  maxOpportunitiesTracked: number;
  executionReadiness: number;   // 0-100
  resourceAllocation: number;   // 0-100 (% of system resources)
  description: string;
}

export const OPPORTUNITY_CYCLES: Record<OpportunityCycle, OpportunityCycleConfig> = {
  [OpportunityCycle.DORMANT]: {
    cycle: OpportunityCycle.DORMANT,
    name: 'Dormant',
    scanFrequency: 0.5,
    evaluationDepth: 20,
    maxOpportunitiesTracked: 5,
    executionReadiness: 20,
    resourceAllocation: 10,
    description: 'Minimal activity, monitoring only',
  },
  [OpportunityCycle.SCANNING]: {
    cycle: OpportunityCycle.SCANNING,
    name: 'Scanning',
    scanFrequency: 2,
    evaluationDepth: 40,
    maxOpportunitiesTracked: 10,
    executionReadiness: 40,
    resourceAllocation: 30,
    description: 'Active scanning for opportunities',
  },
  [OpportunityCycle.EVALUATING]: {
    cycle: OpportunityCycle.EVALUATING,
    name: 'Evaluating',
    scanFrequency: 4,
    evaluationDepth: 60,
    maxOpportunitiesTracked: 15,
    executionReadiness: 60,
    resourceAllocation: 50,
    description: 'Deep evaluation of potential setups',
  },
  [OpportunityCycle.READY]: {
    cycle: OpportunityCycle.READY,
    name: 'Ready',
    scanFrequency: 6,
    evaluationDepth: 80,
    maxOpportunitiesTracked: 20,
    executionReadiness: 80,
    resourceAllocation: 70,
    description: 'Ready to execute on confirmed opportunities',
  },
  [OpportunityCycle.EXECUTING]: {
    cycle: OpportunityCycle.EXECUTING,
    name: 'Executing',
    scanFrequency: 10,
    evaluationDepth: 100,
    maxOpportunitiesTracked: 25,
    executionReadiness: 100,
    resourceAllocation: 90,
    description: 'Active execution mode with continuous monitoring',
  },
};

/**
 * Hedging policies
 */
export enum HedgingPolicy {
  NONE = 'NONE',
  CONSERVATIVE = 'CONSERVATIVE',
  MODERATE = 'MODERATE',
  AGGRESSIVE = 'AGGRESSIVE',
  DYNAMIC = 'DYNAMIC',
}

export interface HedgingConfig {
  policy: HedgingPolicy;
  name: string;
  enabled: boolean;
  hedgeRatio: number;           // 0-100 (% of position to hedge)
  hedgeTrigger: number;         // Loss % before hedging
  correlationThreshold: number; // Min correlation for hedge instrument
  maxHedgeCost: number;         // Max % cost of position
  dynamicAdjustment: boolean;
  description: string;
}

export const HEDGING_POLICIES: Record<HedgingPolicy, HedgingConfig> = {
  [HedgingPolicy.NONE]: {
    policy: HedgingPolicy.NONE,
    name: 'No Hedging',
    enabled: false,
    hedgeRatio: 0,
    hedgeTrigger: 0,
    correlationThreshold: 0,
    maxHedgeCost: 0,
    dynamicAdjustment: false,
    description: 'No hedging strategy applied',
  },
  [HedgingPolicy.CONSERVATIVE]: {
    policy: HedgingPolicy.CONSERVATIVE,
    name: 'Conservative Hedging',
    enabled: true,
    hedgeRatio: 30,
    hedgeTrigger: 5,
    correlationThreshold: 0.7,
    maxHedgeCost: 2,
    dynamicAdjustment: false,
    description: 'Light hedging on moderate losses',
  },
  [HedgingPolicy.MODERATE]: {
    policy: HedgingPolicy.MODERATE,
    name: 'Moderate Hedging',
    enabled: true,
    hedgeRatio: 50,
    hedgeTrigger: 3,
    correlationThreshold: 0.6,
    maxHedgeCost: 3,
    dynamicAdjustment: true,
    description: 'Balanced hedging approach',
  },
  [HedgingPolicy.AGGRESSIVE]: {
    policy: HedgingPolicy.AGGRESSIVE,
    name: 'Aggressive Hedging',
    enabled: true,
    hedgeRatio: 80,
    hedgeTrigger: 2,
    correlationThreshold: 0.5,
    maxHedgeCost: 5,
    dynamicAdjustment: true,
    description: 'Strong hedging on small losses',
  },
  [HedgingPolicy.DYNAMIC]: {
    policy: HedgingPolicy.DYNAMIC,
    name: 'Dynamic Hedging',
    enabled: true,
    hedgeRatio: 60,
    hedgeTrigger: 3,
    correlationThreshold: 0.65,
    maxHedgeCost: 4,
    dynamicAdjustment: true,
    description: 'Adaptive hedging based on market conditions',
  },
};

/**
 * Learning pulses
 */
export enum LearningPulse {
  FROZEN = 'FROZEN',
  SLOW = 'SLOW',
  MODERATE = 'MODERATE',
  FAST = 'FAST',
  ACCELERATED = 'ACCELERATED',
}

export interface LearningConfig {
  pulse: LearningPulse;
  name: string;
  learningRate: number;         // 0-1.0
  updateFrequency: number;      // Updates per hour
  explorationRate: number;      // 0-1.0
  memoryRetention: number;      // 0-100 (% of history retained)
  adaptationSpeed: number;      // 0-100
  feedbackIntegration: number;  // 0-100 (how quickly feedback affects behavior)
  description: string;
}

export const LEARNING_PULSES: Record<LearningPulse, LearningConfig> = {
  [LearningPulse.FROZEN]: {
    pulse: LearningPulse.FROZEN,
    name: 'Frozen',
    learningRate: 0,
    updateFrequency: 0,
    explorationRate: 0,
    memoryRetention: 100,
    adaptationSpeed: 0,
    feedbackIntegration: 0,
    description: 'No learning, use existing knowledge only',
  },
  [LearningPulse.SLOW]: {
    pulse: LearningPulse.SLOW,
    name: 'Slow Learning',
    learningRate: 0.001,
    updateFrequency: 1,
    explorationRate: 0.05,
    memoryRetention: 95,
    adaptationSpeed: 20,
    feedbackIntegration: 30,
    description: 'Gradual learning with high stability',
  },
  [LearningPulse.MODERATE]: {
    pulse: LearningPulse.MODERATE,
    name: 'Moderate Learning',
    learningRate: 0.01,
    updateFrequency: 6,
    explorationRate: 0.1,
    memoryRetention: 85,
    adaptationSpeed: 50,
    feedbackIntegration: 60,
    description: 'Balanced learning and stability',
  },
  [LearningPulse.FAST]: {
    pulse: LearningPulse.FAST,
    name: 'Fast Learning',
    learningRate: 0.05,
    updateFrequency: 12,
    explorationRate: 0.2,
    memoryRetention: 75,
    adaptationSpeed: 75,
    feedbackIntegration: 80,
    description: 'Rapid adaptation to new conditions',
  },
  [LearningPulse.ACCELERATED]: {
    pulse: LearningPulse.ACCELERATED,
    name: 'Accelerated Learning',
    learningRate: 0.1,
    updateFrequency: 24,
    explorationRate: 0.3,
    memoryRetention: 60,
    adaptationSpeed: 95,
    feedbackIntegration: 95,
    description: 'Maximum learning speed, high exploration',
  },
};

/**
 * Combined conductor profile
 */
export interface ConductorProfile {
  name: string;
  aggression: AggressionConfig;
  defense: DefenseConfig;
  timing: TimingConfig;
  opportunity: OpportunityCycleConfig;
  hedging: HedgingConfig;
  learning: LearningConfig;
  description: string;
}

/**
 * Predefined conductor profiles
 */
export const CONDUCTOR_PROFILES: Record<string, ConductorProfile> = {
  ULTRA_SAFE: {
    name: 'Ultra Safe',
    aggression: AGGRESSION_LEVELS[AggressionLevel.ULTRA_CONSERVATIVE],
    defense: DEFENSE_LEVELS[DefenseLevel.MAXIMUM],
    timing: TIMING_MODES[TimingMode.PATIENT],
    opportunity: OPPORTUNITY_CYCLES[OpportunityCycle.SCANNING],
    hedging: HEDGING_POLICIES[HedgingPolicy.AGGRESSIVE],
    learning: LEARNING_PULSES[LearningPulse.SLOW],
    description: 'Maximum safety, minimal risk',
  },
  CONSERVATIVE: {
    name: 'Conservative',
    aggression: AGGRESSION_LEVELS[AggressionLevel.CONSERVATIVE],
    defense: DEFENSE_LEVELS[DefenseLevel.HIGH],
    timing: TIMING_MODES[TimingMode.SELECTIVE],
    opportunity: OPPORTUNITY_CYCLES[OpportunityCycle.EVALUATING],
    hedging: HEDGING_POLICIES[HedgingPolicy.MODERATE],
    learning: LEARNING_PULSES[LearningPulse.MODERATE],
    description: 'Conservative approach with solid protections',
  },
  BALANCED: {
    name: 'Balanced',
    aggression: AGGRESSION_LEVELS[AggressionLevel.MODERATE],
    defense: DEFENSE_LEVELS[DefenseLevel.MODERATE],
    timing: TIMING_MODES[TimingMode.BALANCED],
    opportunity: OPPORTUNITY_CYCLES[OpportunityCycle.READY],
    hedging: HEDGING_POLICIES[HedgingPolicy.MODERATE],
    learning: LEARNING_PULSES[LearningPulse.MODERATE],
    description: 'Balanced risk/reward profile',
  },
  AGGRESSIVE: {
    name: 'Aggressive',
    aggression: AGGRESSION_LEVELS[AggressionLevel.AGGRESSIVE],
    defense: DEFENSE_LEVELS[DefenseLevel.LOW],
    timing: TIMING_MODES[TimingMode.OPPORTUNISTIC],
    opportunity: OPPORTUNITY_CYCLES[OpportunityCycle.EXECUTING],
    hedging: HEDGING_POLICIES[HedgingPolicy.CONSERVATIVE],
    learning: LEARNING_PULSES[LearningPulse.FAST],
    description: 'Active trading with managed risk',
  },
  MAXIMUM_PERFORMANCE: {
    name: 'Maximum Performance',
    aggression: AGGRESSION_LEVELS[AggressionLevel.ULTRA_AGGRESSIVE],
    defense: DEFENSE_LEVELS[DefenseLevel.MINIMAL],
    timing: TIMING_MODES[TimingMode.AGGRESSIVE],
    opportunity: OPPORTUNITY_CYCLES[OpportunityCycle.EXECUTING],
    hedging: HEDGING_POLICIES[HedgingPolicy.NONE],
    learning: LEARNING_PULSES[LearningPulse.ACCELERATED],
    description: 'Maximum activity and performance',
  },
  ADAPTIVE: {
    name: 'Adaptive',
    aggression: AGGRESSION_LEVELS[AggressionLevel.MODERATE],
    defense: DEFENSE_LEVELS[DefenseLevel.MODERATE],
    timing: TIMING_MODES[TimingMode.BALANCED],
    opportunity: OPPORTUNITY_CYCLES[OpportunityCycle.EVALUATING],
    hedging: HEDGING_POLICIES[HedgingPolicy.DYNAMIC],
    learning: LEARNING_PULSES[LearningPulse.FAST],
    description: 'Adaptive strategy that adjusts to market conditions',
  },
};

/**
 * Get profile by name
 */
export function getConductorProfile(name: string): ConductorProfile | undefined {
  return CONDUCTOR_PROFILES[name];
}

/**
 * Get all profile names
 */
export function getProfileNames(): string[] {
  return Object.keys(CONDUCTOR_PROFILES);
}

/**
 * Create custom profile
 */
export function createCustomProfile(
  name: string,
  aggression: AggressionLevel,
  defense: DefenseLevel,
  timing: TimingMode,
  opportunity: OpportunityCycle,
  hedging: HedgingPolicy,
  learning: LearningPulse,
  description: string
): ConductorProfile {
  return {
    name,
    aggression: AGGRESSION_LEVELS[aggression],
    defense: DEFENSE_LEVELS[defense],
    timing: TIMING_MODES[timing],
    opportunity: OPPORTUNITY_CYCLES[opportunity],
    hedging: HEDGING_POLICIES[hedging],
    learning: LEARNING_PULSES[learning],
    description,
  };
}
