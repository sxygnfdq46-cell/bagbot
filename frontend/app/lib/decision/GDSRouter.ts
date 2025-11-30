/**
 * GDS Router - Global Decision Superhighway Router
 * 
 * Core routing engine that manages signal flow through the 3-tier decision topology.
 * Routes signals to appropriate engines, consolidates responses, and returns final decisions.
 */

import { GDSTopology, SignalType, SignalTier, EngineName } from './GDSTopology';

/**
 * Signal payload
 */
export interface SignalPayload {
  type: SignalType;
  data: any;
  priority: number;
  timestamp: number;
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * Engine response
 */
export interface EngineResponse {
  engine: EngineName;
  approved: boolean;
  confidence: number;        // 0-100
  reasoning: string;
  data?: any;
  processingTime: number;    // milliseconds
  timestamp: number;
}

/**
 * Final decision
 */
export interface FinalDecision {
  signalType: SignalType;
  decision: 'APPROVE' | 'REJECT' | 'MODIFY' | 'DEFER';
  confidence: number;        // 0-100
  tier: SignalTier;
  responses: EngineResponse[];
  requiredEngines: EngineName[];
  respondedEngines: EngineName[];
  missingEngines: EngineName[];
  consensus: boolean;
  processingTime: number;
  timestamp: number;
  reasoning: string[];
  modifications?: any;
}

/**
 * Signal in transit
 */
interface SignalInTransit {
  payload: SignalPayload;
  tier: SignalTier;
  targetEngines: EngineName[];
  requiredEngines: EngineName[];
  responses: Map<EngineName, EngineResponse>;
  startTime: number;
  timeoutMs: number;
  requireConsensus: boolean;
}

/**
 * GDS Router Class
 */
class GDSRouterClass {
  private static instance: GDSRouterClass;
  
  // Signals in transit
  private signalsInTransit: Map<string, SignalInTransit> = new Map();
  
  // Performance tracking
  private stats = {
    totalSignals: 0,
    tier1Signals: 0,
    tier2Signals: 0,
    tier3Signals: 0,
    avgProcessingTime: 0,
    timeouts: 0,
    consensusFailures: 0,
  };
  
  private constructor() {
    console.log('[GDS Router] Initialized');
  }
  
  public static getInstance(): GDSRouterClass {
    if (!GDSRouterClass.instance) {
      GDSRouterClass.instance = new GDSRouterClass();
    }
    return GDSRouterClass.instance;
  }
  
  // ==========================================================================
  // Core Routing
  // ==========================================================================
  
  /**
   * Route signal through the decision superhighway
   */
  async routeSignal(type: SignalType, payload: any): Promise<FinalDecision> {
    const signalPayload: SignalPayload = {
      type,
      data: payload,
      priority: this.assignPriority(type),
      timestamp: Date.now(),
      source: payload.source,
      metadata: payload.metadata,
    };
    
    // Get routing configuration
    const tier = GDSTopology.getTierForSignal(type);
    const rule = GDSTopology.getRoutingRule(type);
    
    if (!rule) {
      throw new Error(`No routing rule found for signal type: ${type}`);
    }
    
    // Create signal in transit
    const signalId = `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transit: SignalInTransit = {
      payload: signalPayload,
      tier,
      targetEngines: rule.targetEngines,
      requiredEngines: GDSTopology.getRequiredEngines(type),
      responses: new Map(),
      startTime: Date.now(),
      timeoutMs: rule.timeoutMs,
      requireConsensus: rule.requireConsensus,
    };
    
    this.signalsInTransit.set(signalId, transit);
    
    // Update stats
    this.stats.totalSignals++;
    if (tier === SignalTier.TIER_1_CRITICAL_THREAT) this.stats.tier1Signals++;
    else if (tier === SignalTier.TIER_2_OPPORTUNITY) this.stats.tier2Signals++;
    else if (tier === SignalTier.TIER_3_LEARNING) this.stats.tier3Signals++;
    
    try {
      // Broadcast to engines
      await this.broadcastToEngines(signalId, transit);
      
      // Consolidate responses
      const responses = this.consolidateResponses(signalId, transit);
      
      // Return final decision
      const decision = this.returnFinalDecision(signalId, transit, responses);
      
      // Update performance stats
      const processingTime = Date.now() - transit.startTime;
      this.updateProcessingTime(processingTime);
      
      // Cleanup
      this.signalsInTransit.delete(signalId);
      
      return decision;
    } catch (error) {
      // Cleanup on error
      this.signalsInTransit.delete(signalId);
      throw error;
    }
  }
  
  /**
   * Assign priority based on signal type
   */
  assignPriority(type: SignalType): number {
    const tier = GDSTopology.getTierForSignal(type);
    
    // Priority 0-100 (100 = highest)
    switch (tier) {
      case SignalTier.TIER_1_CRITICAL_THREAT:
        // Tier 1: 80-100
        if (type === SignalType.SHIELD_ACTIVATION) return 100;
        if (type === SignalType.CRITICAL_THREAT) return 95;
        if (type === SignalType.EXECUTION_EMERGENCY) return 90;
        return 85;
        
      case SignalTier.TIER_2_OPPORTUNITY:
        // Tier 2: 50-79
        if (type === SignalType.EXECUTION_READY) return 75;
        if (type === SignalType.SURGE_PREDICTION) return 70;
        if (type === SignalType.FUSION_RECOMMENDATION) return 65;
        return 60;
        
      case SignalTier.TIER_3_LEARNING:
        // Tier 3: 0-49
        if (type === SignalType.REGIME_SHIFT) return 40;
        if (type === SignalType.RL_UPDATE) return 30;
        return 20;
        
      default:
        return 50;
    }
  }
  
  /**
   * Broadcast signal to target engines
   */
  async broadcastToEngines(signalId: string, transit: SignalInTransit): Promise<void> {
    const { payload, targetEngines, timeoutMs } = transit;
    
    // Create promises for each engine
    const enginePromises = targetEngines.map(engine =>
      this.queryEngine(engine, payload, timeoutMs)
        .then(response => {
          transit.responses.set(engine, response);
        })
        .catch(error => {
          console.error(`[GDS Router] Engine ${engine} failed:`, error);
          // Add timeout/error response
          transit.responses.set(engine, {
            engine,
            approved: false,
            confidence: 0,
            reasoning: `Engine timeout or error: ${error.message}`,
            processingTime: timeoutMs,
            timestamp: Date.now(),
          });
        })
    );
    
    // Wait for all engines (with timeout)
    await Promise.race([
      Promise.all(enginePromises),
      this.timeout(timeoutMs),
    ]);
  }
  
  /**
   * Consolidate responses from engines
   */
  consolidateResponses(signalId: string, transit: SignalInTransit): EngineResponse[] {
    const { responses, requiredEngines } = transit;
    
    // Convert map to array
    const responseArray = Array.from(responses.values());
    
    // Check if all required engines responded
    const respondedEngines = new Set(responseArray.map(r => r.engine));
    const missingRequired = requiredEngines.filter(e => !respondedEngines.has(e));
    
    if (missingRequired.length > 0) {
      console.warn(`[GDS Router] Missing required engines:`, missingRequired);
      // Add placeholder responses for missing engines
      missingRequired.forEach(engine => {
        responseArray.push({
          engine,
          approved: false,
          confidence: 0,
          reasoning: 'Engine did not respond in time',
          processingTime: transit.timeoutMs,
          timestamp: Date.now(),
        });
      });
    }
    
    return responseArray;
  }
  
  /**
   * Return final decision based on consolidated responses
   */
  returnFinalDecision(
    signalId: string,
    transit: SignalInTransit,
    responses: EngineResponse[]
  ): FinalDecision {
    const { payload, tier, requiredEngines, requireConsensus, startTime } = transit;
    
    // Filter responses
    const requiredResponses = responses.filter(r => requiredEngines.includes(r.engine));
    const respondedEngines = responses.map(r => r.engine);
    const missingEngines = requiredEngines.filter(e => !respondedEngines.includes(e));
    
    // Check consensus if required
    let consensus = true;
    if (requireConsensus) {
      const approvals = requiredResponses.filter(r => r.approved).length;
      const totalRequired = requiredResponses.length;
      consensus = totalRequired > 0 && approvals >= Math.ceil(totalRequired / 2);
      
      if (!consensus) {
        this.stats.consensusFailures++;
      }
    }
    
    // Calculate overall confidence
    const avgConfidence = responses.length > 0
      ? responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length
      : 0;
    
    // Determine decision
    let decision: FinalDecision['decision'] = 'DEFER';
    const reasoning: string[] = [];
    
    if (missingEngines.length > 0) {
      decision = 'DEFER';
      reasoning.push(`Missing required engines: ${missingEngines.join(', ')}`);
    } else if (requireConsensus && !consensus) {
      decision = 'REJECT';
      reasoning.push('Consensus not reached among required engines');
    } else {
      // Analyze responses
      const approvals = requiredResponses.filter(r => r.approved).length;
      const rejections = requiredResponses.filter(r => !r.approved).length;
      
      if (approvals > rejections) {
        decision = 'APPROVE';
        reasoning.push(`${approvals}/${requiredResponses.length} required engines approved`);
      } else if (rejections > approvals) {
        decision = 'REJECT';
        reasoning.push(`${rejections}/${requiredResponses.length} required engines rejected`);
      } else {
        // Check for modifications
        const modifications = responses.filter(r => r.data?.modification);
        if (modifications.length > 0) {
          decision = 'MODIFY';
          reasoning.push('Engines suggest modifications');
        } else {
          decision = 'DEFER';
          reasoning.push('Equal approvals and rejections');
        }
      }
    }
    
    // Add engine reasoning
    responses.forEach(r => {
      if (r.reasoning) {
        reasoning.push(`${r.engine}: ${r.reasoning}`);
      }
    });
    
    // Compile modifications
    const modifications = responses
      .filter(r => r.data?.modification)
      .map(r => ({ engine: r.engine, modification: r.data.modification }));
    
    const processingTime = Date.now() - startTime;
    
    const finalDecision: FinalDecision = {
      signalType: payload.type,
      decision,
      confidence: avgConfidence,
      tier,
      responses,
      requiredEngines,
      respondedEngines,
      missingEngines,
      consensus,
      processingTime,
      timestamp: Date.now(),
      reasoning,
      modifications: modifications.length > 0 ? modifications : undefined,
    };
    
    console.log(`[GDS Router] Decision:`, {
      signal: payload.type,
      decision,
      confidence: avgConfidence.toFixed(1),
      processingTime: `${processingTime}ms`,
      consensus,
    });
    
    return finalDecision;
  }
  
  // ==========================================================================
  // Engine Integration
  // ==========================================================================
  
  /**
   * Query individual engine
   */
  private async queryEngine(
    engine: EngineName,
    payload: SignalPayload,
    timeoutMs: number
  ): Promise<EngineResponse> {
    const startTime = Date.now();
    
    // Simulate engine query (in production, this would call actual engines)
    // For now, return mock responses based on signal type and engine
    
    const capability = GDSTopology.getEngineCapability(engine);
    if (!capability) {
      throw new Error(`Unknown engine: ${engine}`);
    }
    
    // Check if engine can handle this signal
    const canHandle = capability.canHandle.includes(payload.type);
    
    // Simulate processing delay
    await this.simulateProcessing(capability.responseTimeMs);
    
    const processingTime = Date.now() - startTime;
    
    // Generate mock response
    const response: EngineResponse = {
      engine,
      approved: canHandle && Math.random() > 0.2, // 80% approval rate for capable engines
      confidence: canHandle ? 60 + Math.random() * 30 : 30, // 60-90 if capable, 30-60 if not
      reasoning: canHandle 
        ? `${engine} processed ${payload.type} successfully`
        : `${engine} cannot optimally handle ${payload.type}`,
      processingTime,
      timestamp: Date.now(),
    };
    
    return response;
  }
  
  /**
   * Simulate engine processing
   */
  private async simulateProcessing(ms: number): Promise<void> {
    // Add jitter (±20%)
    const jitter = ms * 0.2 * (Math.random() - 0.5);
    const delay = Math.max(10, ms + jitter);
    
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => {
        this.stats.timeouts++;
        reject(new Error('Engine query timeout'));
      }, ms)
    );
  }
  
  // ==========================================================================
  // Statistics & Monitoring
  // ==========================================================================
  
  /**
   * Get routing statistics
   */
  getRoutingStats() {
    return {
      ...this.stats,
      signalsInTransit: this.signalsInTransit.size,
    };
  }
  
  /**
   * Update average processing time
   */
  private updateProcessingTime(time: number): void {
    const total = this.stats.totalSignals;
    this.stats.avgProcessingTime = 
      (this.stats.avgProcessingTime * (total - 1) + time) / total;
  }
  
  /**
   * Get signals in transit
   */
  getSignalsInTransit(): number {
    return this.signalsInTransit.size;
  }
  
  /**
   * Clear statistics
   */
  clearStats(): void {
    this.stats = {
      totalSignals: 0,
      tier1Signals: 0,
      tier2Signals: 0,
      tier3Signals: 0,
      avgProcessingTime: 0,
      timeouts: 0,
      consensusFailures: 0,
    };
  }
}

// Singleton export
export const GDSRouter = GDSRouterClass.getInstance();

export default GDSRouterClass;
