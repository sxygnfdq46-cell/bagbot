/**
 * GDS Topology - Global Decision Superhighway Topology
 * 
 * Defines the tier structure and engine routing topology for the decision superhighway.
 * Establishes 3-tier priority system and engine responsibility mapping.
 */

/**
 * Signal tier levels
 */
export enum SignalTier {
  TIER_1_CRITICAL_THREAT = 1,  // Critical threats, shield activations, emergencies
  TIER_2_OPPORTUNITY = 2,       // Trading opportunities, pattern signals
  TIER_3_LEARNING = 3,          // Learning updates, analytics, optimizations
}

/**
 * Engine names in the system
 */
export enum EngineName {
  SHIELD = 'SHIELD',
  THREAT = 'THREAT',
  SENTIENCE = 'SENTIENCE',
  FUSION = 'FUSION',
  PATTERN_SYNC = 'PATTERN_SYNC',
  RL_CORE = 'RL_CORE',
  EXECUTION = 'EXECUTION',
  OVERRIDE = 'OVERRIDE',
  DVBE = 'DVBE',
  MFAE = 'MFAE',
  ROOT_CAUSE = 'ROOT_CAUSE',
  PREDICTION = 'PREDICTION',
  STRATEGY_SELECTOR = 'STRATEGY_SELECTOR',
}

/**
 * Signal types in the system
 */
export enum SignalType {
  // Tier 1 - Critical
  SHIELD_ACTIVATION = 'SHIELD_ACTIVATION',
  SHIELD_DEACTIVATION = 'SHIELD_DEACTIVATION',
  CRITICAL_THREAT = 'CRITICAL_THREAT',
  EXECUTION_EMERGENCY = 'EXECUTION_EMERGENCY',
  LIQUIDITY_CRISIS = 'LIQUIDITY_CRISIS',
  STRUCTURAL_BREAK = 'STRUCTURAL_BREAK',
  
  // Tier 2 - Opportunity
  PATTERN_DETECTED = 'PATTERN_DETECTED',
  SURGE_PREDICTION = 'SURGE_PREDICTION',
  OPPORTUNITY_ZONE = 'OPPORTUNITY_ZONE',
  FUSION_RECOMMENDATION = 'FUSION_RECOMMENDATION',
  STRATEGY_SIGNAL = 'STRATEGY_SIGNAL',
  EXECUTION_READY = 'EXECUTION_READY',
  
  // Tier 3 - Learning
  RL_UPDATE = 'RL_UPDATE',
  PERFORMANCE_METRIC = 'PERFORMANCE_METRIC',
  REGIME_SHIFT = 'REGIME_SHIFT',
  MARKET_DATA_UPDATE = 'MARKET_DATA_UPDATE',
  ANALYTICS_UPDATE = 'ANALYTICS_UPDATE',
}

/**
 * Engine tier assignment
 */
interface EngineTierAssignment {
  engine: EngineName;
  tier: SignalTier;
  priority: number;        // Within tier priority (1 = highest)
  required: boolean;       // Must respond for decision completion
  timeout: number;         // Max response time in ms
}

/**
 * Signal routing rules
 */
interface SignalRoutingRule {
  signalType: SignalType;
  tier: SignalTier;
  targetEngines: EngineName[];
  broadcastToAll: boolean;
  requireConsensus: boolean;
  timeoutMs: number;
}

/**
 * Engine capability mapping
 */
interface EngineCapability {
  engine: EngineName;
  canHandle: SignalType[];
  expertise: string[];
  responseTimeMs: number;
}

// ============================================================================
// Tier 1: Critical Threat Path
// ============================================================================

/**
 * Tier 1 engine assignments (critical response)
 */
export const TIER_1_ENGINES: EngineTierAssignment[] = [
  {
    engine: EngineName.SHIELD,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    priority: 1,
    required: true,
    timeout: 100,  // 100ms max response
  },
  {
    engine: EngineName.THREAT,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    priority: 2,
    required: true,
    timeout: 150,
  },
  {
    engine: EngineName.OVERRIDE,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    priority: 3,
    required: true,
    timeout: 200,
  },
  {
    engine: EngineName.EXECUTION,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    priority: 4,
    required: false,  // May need to abort/adjust
    timeout: 150,
  },
];

// ============================================================================
// Tier 2: Opportunity Path
// ============================================================================

/**
 * Tier 2 engine assignments (opportunity analysis)
 */
export const TIER_2_ENGINES: EngineTierAssignment[] = [
  {
    engine: EngineName.SENTIENCE,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    priority: 1,
    required: true,
    timeout: 300,
  },
  {
    engine: EngineName.FUSION,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    priority: 2,
    required: true,
    timeout: 400,
  },
  {
    engine: EngineName.PATTERN_SYNC,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    priority: 3,
    required: true,
    timeout: 350,
  },
  {
    engine: EngineName.STRATEGY_SELECTOR,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    priority: 4,
    required: true,
    timeout: 300,
  },
  {
    engine: EngineName.DVBE,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    priority: 5,
    required: false,
    timeout: 250,
  },
  {
    engine: EngineName.MFAE,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    priority: 6,
    required: false,
    timeout: 250,
  },
];

// ============================================================================
// Tier 3: Learning Path
// ============================================================================

/**
 * Tier 3 engine assignments (learning & optimization)
 */
export const TIER_3_ENGINES: EngineTierAssignment[] = [
  {
    engine: EngineName.RL_CORE,
    tier: SignalTier.TIER_3_LEARNING,
    priority: 1,
    required: false,
    timeout: 500,
  },
  {
    engine: EngineName.ROOT_CAUSE,
    tier: SignalTier.TIER_3_LEARNING,
    priority: 2,
    required: false,
    timeout: 600,
  },
  {
    engine: EngineName.PREDICTION,
    tier: SignalTier.TIER_3_LEARNING,
    priority: 3,
    required: false,
    timeout: 400,
  },
];

// ============================================================================
// Signal Routing Rules
// ============================================================================

/**
 * Routing rules for each signal type
 */
export const SIGNAL_ROUTING_RULES: SignalRoutingRule[] = [
  // Tier 1 - Critical
  {
    signalType: SignalType.SHIELD_ACTIVATION,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    targetEngines: [EngineName.SHIELD, EngineName.THREAT, EngineName.OVERRIDE, EngineName.EXECUTION],
    broadcastToAll: true,
    requireConsensus: false,  // Shield decision is final
    timeoutMs: 200,
  },
  {
    signalType: SignalType.CRITICAL_THREAT,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    targetEngines: [EngineName.THREAT, EngineName.SHIELD, EngineName.OVERRIDE],
    broadcastToAll: true,
    requireConsensus: true,
    timeoutMs: 300,
  },
  {
    signalType: SignalType.EXECUTION_EMERGENCY,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    targetEngines: [EngineName.EXECUTION, EngineName.OVERRIDE, EngineName.SHIELD],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 150,
  },
  {
    signalType: SignalType.LIQUIDITY_CRISIS,
    tier: SignalTier.TIER_1_CRITICAL_THREAT,
    targetEngines: [EngineName.SENTIENCE, EngineName.THREAT, EngineName.EXECUTION],
    broadcastToAll: true,
    requireConsensus: true,
    timeoutMs: 250,
  },
  
  // Tier 2 - Opportunity
  {
    signalType: SignalType.PATTERN_DETECTED,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    targetEngines: [EngineName.PATTERN_SYNC, EngineName.FUSION, EngineName.SENTIENCE],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 400,
  },
  {
    signalType: SignalType.SURGE_PREDICTION,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    targetEngines: [EngineName.SENTIENCE, EngineName.PATTERN_SYNC, EngineName.FUSION, EngineName.STRATEGY_SELECTOR],
    broadcastToAll: false,
    requireConsensus: true,
    timeoutMs: 500,
  },
  {
    signalType: SignalType.OPPORTUNITY_ZONE,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    targetEngines: [EngineName.PATTERN_SYNC, EngineName.SENTIENCE, EngineName.STRATEGY_SELECTOR],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 400,
  },
  {
    signalType: SignalType.FUSION_RECOMMENDATION,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    targetEngines: [EngineName.FUSION, EngineName.STRATEGY_SELECTOR, EngineName.EXECUTION],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 350,
  },
  {
    signalType: SignalType.STRATEGY_SIGNAL,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    targetEngines: [EngineName.STRATEGY_SELECTOR, EngineName.FUSION, EngineName.EXECUTION],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 400,
  },
  {
    signalType: SignalType.EXECUTION_READY,
    tier: SignalTier.TIER_2_OPPORTUNITY,
    targetEngines: [EngineName.EXECUTION, EngineName.OVERRIDE, EngineName.SHIELD],
    broadcastToAll: false,
    requireConsensus: true,
    timeoutMs: 300,
  },
  
  // Tier 3 - Learning
  {
    signalType: SignalType.RL_UPDATE,
    tier: SignalTier.TIER_3_LEARNING,
    targetEngines: [EngineName.RL_CORE],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 500,
  },
  {
    signalType: SignalType.REGIME_SHIFT,
    tier: SignalTier.TIER_3_LEARNING,
    targetEngines: [EngineName.RL_CORE, EngineName.PREDICTION, EngineName.SENTIENCE],
    broadcastToAll: true,
    requireConsensus: false,
    timeoutMs: 600,
  },
  {
    signalType: SignalType.MARKET_DATA_UPDATE,
    tier: SignalTier.TIER_3_LEARNING,
    targetEngines: [EngineName.PREDICTION, EngineName.DVBE, EngineName.MFAE],
    broadcastToAll: false,
    requireConsensus: false,
    timeoutMs: 400,
  },
];

// ============================================================================
// Engine Capabilities
// ============================================================================

/**
 * Engine capability definitions
 */
export const ENGINE_CAPABILITIES: EngineCapability[] = [
  {
    engine: EngineName.SHIELD,
    canHandle: [
      SignalType.SHIELD_ACTIVATION,
      SignalType.SHIELD_DEACTIVATION,
      SignalType.CRITICAL_THREAT,
      SignalType.EXECUTION_EMERGENCY,
    ],
    expertise: ['protection', 'risk_management', 'emergency_response'],
    responseTimeMs: 100,
  },
  {
    engine: EngineName.THREAT,
    canHandle: [
      SignalType.CRITICAL_THREAT,
      SignalType.LIQUIDITY_CRISIS,
      SignalType.EXECUTION_EMERGENCY,
    ],
    expertise: ['threat_detection', 'risk_assessment', 'alert_generation'],
    responseTimeMs: 150,
  },
  {
    engine: EngineName.SENTIENCE,
    canHandle: [
      SignalType.SURGE_PREDICTION,
      SignalType.LIQUIDITY_CRISIS,
      SignalType.OPPORTUNITY_ZONE,
      SignalType.REGIME_SHIFT,
    ],
    expertise: ['market_awareness', 'emotional_intelligence', 'pressure_detection'],
    responseTimeMs: 300,
  },
  {
    engine: EngineName.FUSION,
    canHandle: [
      SignalType.PATTERN_DETECTED,
      SignalType.FUSION_RECOMMENDATION,
      SignalType.STRATEGY_SIGNAL,
    ],
    expertise: ['signal_integration', 'consensus_building', 'decision_orchestration'],
    responseTimeMs: 400,
  },
  {
    engine: EngineName.PATTERN_SYNC,
    canHandle: [
      SignalType.PATTERN_DETECTED,
      SignalType.SURGE_PREDICTION,
      SignalType.OPPORTUNITY_ZONE,
    ],
    expertise: ['pattern_recognition', 'confluence_analysis', 'technical_signals'],
    responseTimeMs: 350,
  },
  {
    engine: EngineName.EXECUTION,
    canHandle: [
      SignalType.EXECUTION_EMERGENCY,
      SignalType.EXECUTION_READY,
      SignalType.FUSION_RECOMMENDATION,
    ],
    expertise: ['order_execution', 'position_management', 'execution_quality'],
    responseTimeMs: 150,
  },
  {
    engine: EngineName.OVERRIDE,
    canHandle: [
      SignalType.EXECUTION_EMERGENCY,
      SignalType.EXECUTION_READY,
      SignalType.CRITICAL_THREAT,
    ],
    expertise: ['safety_checks', 'pre_trade_validation', 'execution_override'],
    responseTimeMs: 200,
  },
  {
    engine: EngineName.RL_CORE,
    canHandle: [
      SignalType.RL_UPDATE,
      SignalType.REGIME_SHIFT,
      SignalType.PERFORMANCE_METRIC,
    ],
    expertise: ['adaptive_learning', 'reward_optimization', 'strategy_evolution'],
    responseTimeMs: 500,
  },
  {
    engine: EngineName.STRATEGY_SELECTOR,
    canHandle: [
      SignalType.STRATEGY_SIGNAL,
      SignalType.FUSION_RECOMMENDATION,
      SignalType.OPPORTUNITY_ZONE,
    ],
    expertise: ['strategy_selection', 'parameter_optimization', 'regime_adaptation'],
    responseTimeMs: 300,
  },
];

// ============================================================================
// Topology Configuration
// ============================================================================

/**
 * Get tier for signal type
 */
export function getTierForSignal(signalType: SignalType): SignalTier {
  const rule = SIGNAL_ROUTING_RULES.find(r => r.signalType === signalType);
  return rule ? rule.tier : SignalTier.TIER_3_LEARNING;
}

/**
 * Get engines for tier
 */
export function getEnginesForTier(tier: SignalTier): EngineTierAssignment[] {
  switch (tier) {
    case SignalTier.TIER_1_CRITICAL_THREAT:
      return TIER_1_ENGINES;
    case SignalTier.TIER_2_OPPORTUNITY:
      return TIER_2_ENGINES;
    case SignalTier.TIER_3_LEARNING:
      return TIER_3_ENGINES;
    default:
      return [];
  }
}

/**
 * Get routing rule for signal type
 */
export function getRoutingRule(signalType: SignalType): SignalRoutingRule | undefined {
  return SIGNAL_ROUTING_RULES.find(r => r.signalType === signalType);
}

/**
 * Get engine capability
 */
export function getEngineCapability(engine: EngineName): EngineCapability | undefined {
  return ENGINE_CAPABILITIES.find(c => c.engine === engine);
}

/**
 * Check if engine can handle signal
 */
export function canEngineHandle(engine: EngineName, signalType: SignalType): boolean {
  const capability = getEngineCapability(engine);
  return capability ? capability.canHandle.includes(signalType) : false;
}

/**
 * Get required engines for signal
 */
export function getRequiredEngines(signalType: SignalType): EngineName[] {
  const rule = getRoutingRule(signalType);
  if (!rule) return [];
  
  const tier = rule.tier;
  const tierEngines = getEnginesForTier(tier);
  
  return tierEngines
    .filter(e => e.required && rule.targetEngines.includes(e.engine))
    .map(e => e.engine);
}

/**
 * Get optional engines for signal
 */
export function getOptionalEngines(signalType: SignalType): EngineName[] {
  const rule = getRoutingRule(signalType);
  if (!rule) return [];
  
  const tier = rule.tier;
  const tierEngines = getEnginesForTier(tier);
  
  return tierEngines
    .filter(e => !e.required && rule.targetEngines.includes(e.engine))
    .map(e => e.engine);
}

/**
 * Get max response time for signal
 */
export function getMaxResponseTime(signalType: SignalType): number {
  const rule = getRoutingRule(signalType);
  return rule ? rule.timeoutMs : 1000;
}

/**
 * Get tier priority name
 */
export function getTierName(tier: SignalTier): string {
  switch (tier) {
    case SignalTier.TIER_1_CRITICAL_THREAT:
      return 'Critical Threat Path';
    case SignalTier.TIER_2_OPPORTUNITY:
      return 'Opportunity Path';
    case SignalTier.TIER_3_LEARNING:
      return 'Learning Path';
    default:
      return 'Unknown Tier';
  }
}

// Export topology object
export const GDSTopology = {
  // Tier assignments
  TIER_1_ENGINES,
  TIER_2_ENGINES,
  TIER_3_ENGINES,
  
  // Routing rules
  SIGNAL_ROUTING_RULES,
  
  // Engine capabilities
  ENGINE_CAPABILITIES,
  
  // Helper functions
  getTierForSignal,
  getEnginesForTier,
  getRoutingRule,
  getEngineCapability,
  canEngineHandle,
  getRequiredEngines,
  getOptionalEngines,
  getMaxResponseTime,
  getTierName,
};

export default GDSTopology;
