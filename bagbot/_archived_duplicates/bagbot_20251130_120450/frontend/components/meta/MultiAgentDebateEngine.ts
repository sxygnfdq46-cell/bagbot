/**
 * 🗣️ MULTI-AGENT DEBATE ENGINE
 * 
 * Internal council of 5 AI agent personas that debate trading decisions
 * from different perspectives. This creates a "committee" decision-making
 * process that reduces bias and improves decision quality.
 * 
 * THE COUNCIL:
 * • BULL AGENT: Optimistic, seeks growth opportunities
 * • BEAR AGENT: Pessimistic, focuses on risks and downside
 * • NEUTRAL AGENT: Balanced, data-driven, objective
 * • RISK MANAGER: Conservative, prioritizes capital preservation
 * • OPPORTUNIST: Contrarian, seeks asymmetric edge plays
 * 
 * CAPABILITIES:
 * • Multi-agent argumentation (agents present cases)
 * • Debate simulation (agents argue for/against)
 * • Consensus building (voting and agreement)
 * • Conflict resolution (tie-breaking mechanisms)
 * • Confidence scoring (how certain is the consensus)
 * • Dissent tracking (minority opinions preserved)
 * • Decision explanation (why the council decided)
 */

import type { EnvironmentalState } from '@/app/engine/environmental/EnvironmentalConsciousnessCore';
import type { ParallelIntelligenceState } from '@/components/fusion/ParallelIntelligenceCore';
import type { TriPhaseState } from '@/components/fusion/EnvTriPhaseAwareness';
import type { ReflexEngineState } from '@/components/fusion/ReflexEngineV2';
import type { LongHorizonState } from './LongHorizonThoughtEngine';

// ============================================
// TYPES
// ============================================

/**
 * Agent persona types
 */
export type AgentPersona = 'bull' | 'bear' | 'neutral' | 'risk-manager' | 'opportunist';

/**
 * Decision stance
 */
export type DecisionStance = 
  | 'strongly-bullish'
  | 'bullish'
  | 'neutral'
  | 'bearish'
  | 'strongly-bearish'
  | 'abstain';

/**
 * Vote on a decision
 */
export interface AgentVote {
  agentPersona: AgentPersona;
  stance: DecisionStance;
  confidence: number;      // 0-1
  weight: number;          // 0-1 voting power
  reasoning: string;
}

/**
 * Argument made by an agent
 */
export interface AgentArgument {
  agentPersona: AgentPersona;
  position: DecisionStance;
  
  // Argument content
  claim: string;
  evidence: string[];
  reasoning: string;
  
  // Strength
  strength: number;        // 0-1
  supportingData: number;  // 0-1 how much data supports this
  
  // Counterarguments
  counters: string[];      // Potential counterarguments
  vulnerabilities: string[];
  
  timestamp: number;
}

/**
 * Complete agent profile
 */
export interface AgentProfile {
  persona: AgentPersona;
  name: string;
  description: string;
  
  // Characteristics
  bias: DecisionStance;    // Natural bias of this agent
  riskTolerance: number;   // 0-1
  timeHorizon: 'short' | 'medium' | 'long';
  focusAreas: string[];
  
  // Performance
  historicalAccuracy: number;  // 0-1
  recentAccuracy: number;      // 0-1 (last 10 decisions)
  votingWeight: number;        // 0-1 current influence
  
  // State
  currentMood: 'confident' | 'cautious' | 'aggressive' | 'defensive';
  activeArguments: number;
  
  timestamp: number;
}

/**
 * Debate topic
 */
export interface DebateTopic {
  id: string;
  question: string;
  context: string;
  
  // Stakes
  importance: number;      // 0-1
  urgency: number;         // 0-1
  
  // Evidence
  availableData: string[];
  constraints: string[];
  
  timestamp: number;
}

/**
 * Full debate session
 */
export interface DebateSession {
  id: string;
  topic: DebateTopic;
  
  // Participants
  participants: AgentPersona[];
  
  // Arguments
  arguments: AgentArgument[];
  rebuttals: AgentArgument[];
  
  // Voting
  votes: AgentVote[];
  
  // Consensus
  consensusReached: boolean;
  consensusStance: DecisionStance | null;
  consensusConfidence: number;  // 0-1
  
  // Dissent
  dissentingOpinions: AgentArgument[];
  dissentStrength: number;      // 0-1
  
  // Outcome
  finalDecision: string;
  decisionReasoning: string;
  minorityReport?: string;      // Dissenting view summary
  
  // Metadata
  durationMs: number;
  startTime: number;
  endTime: number;
  
  timestamp: number;
}

/**
 * Council decision
 */
export interface CouncilDecision {
  id: string;
  debateId: string;
  
  // Decision
  decision: DecisionStance;
  confidence: number;        // 0-1
  unanimity: number;         // 0-1 (1 = unanimous, 0 = split)
  
  // Supporting info
  majorityReasoning: string;
  minorityView?: string;
  keyArguments: string[];
  
  // Agent breakdown
  voteSummary: {
    [key in AgentPersona]?: DecisionStance;
  };
  
  // Quality metrics
  debateQuality: number;     // 0-1 quality of debate
  evidenceStrength: number;  // 0-1 strength of evidence
  argumentDiversity: number; // 0-1 diversity of viewpoints
  
  timestamp: number;
}

/**
 * Complete multi-agent debate state
 */
export interface MultiAgentDebateState {
  // Council
  council: AgentProfile[];
  
  // Active debate
  activeDebate: DebateSession | null;
  recentDebates: DebateSession[];
  
  // Decisions
  latestDecision: CouncilDecision | null;
  decisionHistory: CouncilDecision[];
  
  // Consensus metrics
  overallConsensus: number;      // 0-1 how often council agrees
  avgDebateQuality: number;      // 0-1
  avgConfidence: number;         // 0-1
  
  // Agent metrics
  mostInfluential: AgentPersona | null;
  mostAccurate: AgentPersona | null;
  
  // Council health
  diversityIndex: number;        // 0-1 diversity of opinions
  conflictLevel: number;         // 0-1 how contentious debates are
  cohesionScore: number;         // 0-1 council cohesion
  
  timestamp: number;
}

// ============================================
// MULTI-AGENT DEBATE ENGINE
// ============================================

export class MultiAgentDebateEngine {
  private currentState: MultiAgentDebateState | null = null;
  private stateHistory: MultiAgentDebateState[] = [];
  private maxHistorySize = 50;
  
  // Council
  private councilProfiles: Map<AgentPersona, AgentProfile> = new Map();
  
  // Debate tracking
  private debateRegistry: Map<string, DebateSession> = new Map();
  private decisionRegistry: Map<string, CouncilDecision> = new Map();
  
  constructor() {
    this.initializeCouncil();
  }
  
  /**
   * Initialize the council of agents
   */
  private initializeCouncil(): void {
    const now = Date.now();
    
    // Bull Agent
    this.councilProfiles.set('bull', {
      persona: 'bull',
      name: 'The Optimist',
      description: 'Seeks growth opportunities, believes in upward momentum',
      bias: 'bullish',
      riskTolerance: 0.7,
      timeHorizon: 'medium',
      focusAreas: ['Growth potential', 'Momentum', 'Catalysts', 'Upside scenarios'],
      historicalAccuracy: 0.65,
      recentAccuracy: 0.7,
      votingWeight: 0.7,
      currentMood: 'confident',
      activeArguments: 0,
      timestamp: now
    });
    
    // Bear Agent
    this.councilProfiles.set('bear', {
      persona: 'bear',
      name: 'The Skeptic',
      description: 'Focuses on risks, downside protection, what can go wrong',
      bias: 'bearish',
      riskTolerance: 0.3,
      timeHorizon: 'short',
      focusAreas: ['Risk factors', 'Downside', 'Overvaluation', 'Warning signs'],
      historicalAccuracy: 0.6,
      recentAccuracy: 0.65,
      votingWeight: 0.65,
      currentMood: 'cautious',
      activeArguments: 0,
      timestamp: now
    });
    
    // Neutral Agent
    this.councilProfiles.set('neutral', {
      persona: 'neutral',
      name: 'The Analyst',
      description: 'Data-driven, objective, balanced perspective',
      bias: 'neutral',
      riskTolerance: 0.5,
      timeHorizon: 'medium',
      focusAreas: ['Data analysis', 'Objective metrics', 'Historical patterns', 'Statistics'],
      historicalAccuracy: 0.75,
      recentAccuracy: 0.8,
      votingWeight: 0.85,
      currentMood: 'confident',
      activeArguments: 0,
      timestamp: now
    });
    
    // Risk Manager
    this.councilProfiles.set('risk-manager', {
      persona: 'risk-manager',
      name: 'The Guardian',
      description: 'Prioritizes capital preservation, conservative approach',
      bias: 'bearish',
      riskTolerance: 0.2,
      timeHorizon: 'long',
      focusAreas: ['Capital preservation', 'Risk management', 'Portfolio protection', 'Drawdown control'],
      historicalAccuracy: 0.7,
      recentAccuracy: 0.75,
      votingWeight: 0.8,
      currentMood: 'defensive',
      activeArguments: 0,
      timestamp: now
    });
    
    // Opportunist
    this.councilProfiles.set('opportunist', {
      persona: 'opportunist',
      name: 'The Contrarian',
      description: 'Seeks asymmetric opportunities, contrarian plays, edge cases',
      bias: 'neutral',
      riskTolerance: 0.8,
      timeHorizon: 'medium',
      focusAreas: ['Asymmetric opportunities', 'Contrarian plays', 'Mispricing', 'Edge cases'],
      historicalAccuracy: 0.55,
      recentAccuracy: 0.6,
      votingWeight: 0.6,
      currentMood: 'aggressive',
      activeArguments: 0,
      timestamp: now
    });
  }
  
  /**
   * Main processing function
   */
  public process(
    environmental: EnvironmentalState | null,
    intelligence: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null,
    reflexEngine: ReflexEngineState | null,
    longHorizon: LongHorizonState | null
  ): MultiAgentDebateState {
    const now = Date.now();
    
    // Update agent moods based on market conditions
    this.updateAgentMoods(environmental, intelligence);
    
    // Create debate topic from current conditions
    const topic = this.createDebateTopic(environmental, intelligence, longHorizon);
    
    // Run debate
    const debate = this.conductDebate(topic, environmental, intelligence, triPhase, longHorizon);
    
    // Generate decision
    const decision = this.generateDecision(debate);
    
    // Get council profiles
    const council = Array.from(this.councilProfiles.values());
    
    // Get recent debates
    const recentDebates = Array.from(this.debateRegistry.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
    
    // Get decision history
    const decisionHistory = Array.from(this.decisionRegistry.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
    
    // Calculate consensus metrics
    const overallConsensus = this.calculateOverallConsensus(decisionHistory);
    const avgDebateQuality = this.calculateAvgDebateQuality(recentDebates);
    const avgConfidence = this.calculateAvgConfidence(decisionHistory);
    
    // Identify key agents
    const mostInfluential = this.identifyMostInfluential(council);
    const mostAccurate = this.identifyMostAccurate(council);
    
    // Calculate council health
    const diversityIndex = this.calculateDiversityIndex(debate);
    const conflictLevel = this.calculateConflictLevel(debate);
    const cohesionScore = this.calculateCohesionScore(overallConsensus, conflictLevel);
    
    // Build state
    const state: MultiAgentDebateState = {
      council,
      activeDebate: debate,
      recentDebates,
      latestDecision: decision,
      decisionHistory,
      overallConsensus,
      avgDebateQuality,
      avgConfidence,
      mostInfluential,
      mostAccurate,
      diversityIndex,
      conflictLevel,
      cohesionScore,
      timestamp: now
    };
    
    // Store
    this.currentState = state;
    this.stateHistory.push(state);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
    
    return state;
  }
  
  // ============================================
  // AGENT MOOD UPDATES
  // ============================================
  
  private updateAgentMoods(
    environmental: EnvironmentalState | null,
    intelligence: ParallelIntelligenceState | null
  ): void {
    if (!environmental) return;
    
    // Bull agent mood
    const bull = this.councilProfiles.get('bull');
    if (bull) {
      if (environmental.coherence > 70 && environmental.awareness > 60) {
        bull.currentMood = 'confident';
      } else if (environmental.coherence > 50) {
        bull.currentMood = 'cautious';
      } else {
        bull.currentMood = 'defensive';
      }
    }
    
    // Bear agent mood
    const bear = this.councilProfiles.get('bear');
    if (bear) {
      if (environmental.coherence < 30 || environmental.weather.effects.precipitation > 0.6) {
        bear.currentMood = 'aggressive';
      } else if (environmental.coherence < 50) {
        bear.currentMood = 'cautious';
      } else {
        bear.currentMood = 'defensive';
      }
    }
    
    // Neutral agent (always balanced)
    const neutral = this.councilProfiles.get('neutral');
    if (neutral) {
      neutral.currentMood = intelligence && intelligence.certaintyIndex > 0.7 ? 'confident' : 'cautious';
    }
    
    // Risk manager (always defensive)
    const riskManager = this.councilProfiles.get('risk-manager');
    if (riskManager) {
      riskManager.currentMood = environmental.coherence < 40 ? 'defensive' : 'cautious';
    }
    
    // Opportunist
    const opportunist = this.councilProfiles.get('opportunist');
    if (opportunist) {
      if (environmental.coherence < 40) {
        opportunist.currentMood = 'aggressive';  // Chaos = opportunity
      } else {
        opportunist.currentMood = 'cautious';
      }
    }
  }
  
  // ============================================
  // DEBATE TOPIC CREATION
  // ============================================
  
  private createDebateTopic(
    environmental: EnvironmentalState | null,
    intelligence: ParallelIntelligenceState | null,
    longHorizon: LongHorizonState | null
  ): DebateTopic {
    const now = Date.now();
    
    // Determine question based on conditions
    let question = 'What is the appropriate market stance right now?';
    let context = 'Current market conditions require strategic positioning decision';
    let importance = 0.7;
    let urgency = 0.6;
    
    if (environmental) {
      if (environmental.coherence < 30) {
        question = 'Should we reduce risk exposure due to low coherence?';
        context = `Low environmental coherence (${environmental.coherence.toFixed(0)}) detected`;
        importance = 0.9;
        urgency = 0.8;
      } else if (environmental.coherence > 80) {
        question = 'Should we increase exposure given strong coherence?';
        context = `Strong market coherence (${environmental.coherence.toFixed(0)}) presents opportunity`;
        importance = 0.8;
        urgency = 0.7;
      }
    }
    
    const availableData: string[] = [];
    if (environmental) {
      availableData.push(`Coherence: ${environmental.coherence.toFixed(0)}`);
      availableData.push(`Awareness: ${environmental.awareness.toFixed(0)}`);
      availableData.push(`Health: ${environmental.environmentalHealth.toFixed(0)}`);
    }
    if (intelligence) {
      availableData.push(`Certainty: ${(intelligence.certaintyIndex * 100).toFixed(0)}%`);
      availableData.push(`Consensus: ${(intelligence.indicatorConsensus * 100).toFixed(0)}%`);
    }
    if (longHorizon) {
      availableData.push(`Strategic clarity: ${(longHorizon.strategicClarity * 100).toFixed(0)}%`);
      availableData.push(`Active goals: ${longHorizon.activeGoals.length}`);
    }
    
    return {
      id: `topic_${now}`,
      question,
      context,
      importance,
      urgency,
      availableData,
      constraints: ['Risk limits', 'Capital constraints', 'Time horizon'],
      timestamp: now
    };
  }
  
  // ============================================
  // DEBATE CONDUCT
  // ============================================
  
  private conductDebate(
    topic: DebateTopic,
    environmental: EnvironmentalState | null,
    intelligence: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null,
    longHorizon: LongHorizonState | null
  ): DebateSession {
    const startTime = Date.now();
    const debateId = `debate_${startTime}`;
    
    const participants: AgentPersona[] = ['bull', 'bear', 'neutral', 'risk-manager', 'opportunist'];
    
    // Generate arguments from each agent
    const initialArguments = this.generateArguments(
      participants,
      topic,
      environmental,
      intelligence,
      triPhase,
      longHorizon
    );
    
    // Generate rebuttals (agents respond to each other)
    const rebuttals = this.generateRebuttals(initialArguments, topic);
    
    // Collect votes
    const votes = this.collectVotes(initialArguments, rebuttals, topic);
    
    // Determine consensus
    const { consensusReached, consensusStance, consensusConfidence } = this.determineConsensus(votes);
    
    // Identify dissent
    const { dissentingOpinions, dissentStrength } = this.identifyDissent(
      votes,
      consensusStance,
      initialArguments
    );
    
    // Generate final decision
    const finalDecision = this.formulateDecision(consensusStance, votes);
    const decisionReasoning = this.formulateReasoning(votes, initialArguments);
    const minorityReport = dissentStrength > 0.3 
      ? this.formulateMinorityReport(dissentingOpinions)
      : undefined;
    
    const endTime = Date.now();
    
    const debate: DebateSession = {
      id: debateId,
      topic,
      participants,
      arguments: initialArguments,
      rebuttals,
      votes,
      consensusReached,
      consensusStance,
      consensusConfidence,
      dissentingOpinions,
      dissentStrength,
      finalDecision,
      decisionReasoning,
      minorityReport,
      durationMs: endTime - startTime,
      startTime,
      endTime,
      timestamp: endTime
    };
    
    // Store
    this.debateRegistry.set(debateId, debate);
    
    return debate;
  }
  
  private generateArguments(
    participants: AgentPersona[],
    topic: DebateTopic,
    environmental: EnvironmentalState | null,
    intelligence: ParallelIntelligenceState | null,
    triPhase: TriPhaseState | null,
    longHorizon: LongHorizonState | null
  ): AgentArgument[] {
    const args: AgentArgument[] = [];
    const now = Date.now();
    
    for (const persona of participants) {
      const profile = this.councilProfiles.get(persona);
      if (!profile) continue;
      
      let argument: AgentArgument;
      
      switch (persona) {
        case 'bull':
          argument = {
            agentPersona: 'bull',
            position: environmental && environmental.coherence > 60 ? 'bullish' : 'neutral',
            claim: 'Market conditions favor upside opportunity',
            evidence: [
              environmental ? `High coherence (${environmental.coherence.toFixed(0)})` : 'Stable conditions',
              intelligence ? `Strong certainty (${(intelligence.certaintyIndex * 100).toFixed(0)}%)` : 'Clear signals'
            ],
            reasoning: 'Strong environmental coherence combined with parallel intelligence consensus suggests favorable conditions for growth positions',
            strength: environmental ? environmental.coherence / 100 : 0.6,
            supportingData: intelligence ? intelligence.certaintyIndex : 0.6,
            counters: ['High pressure risk', 'Volatility concerns'],
            vulnerabilities: ['Market reversal', 'False breakout'],
            timestamp: now
          };
          break;
          
        case 'bear':
          argument = {
            agentPersona: 'bear',
            position: environmental && environmental.coherence < 40 ? 'bearish' : 'neutral',
            claim: 'Risk factors warrant caution',
            evidence: [
              environmental ? `Low coherence (${environmental.coherence.toFixed(0)})` : 'Risk signals',
              triPhase ? `Temporal entropy (${(triPhase.temporalEntropy * 100).toFixed(0)}%)` : 'Uncertainty present'
            ],
            reasoning: 'Low environmental coherence and temporal entropy indicate elevated risk. Capital preservation should be prioritized',
            strength: environmental ? (100 - environmental.coherence) / 100 : 0.6,
            supportingData: triPhase ? triPhase.temporalEntropy : 0.5,
            counters: ['Missing upside', 'Opportunity cost'],
            vulnerabilities: ['Premature risk aversion', 'Market continues higher'],
            timestamp: now
          };
          break;
          
        case 'neutral':
          argument = {
            agentPersona: 'neutral',
            position: 'neutral',
            claim: 'Data supports balanced approach',
            evidence: topic.availableData,
            reasoning: 'Objective analysis of all available metrics suggests a measured, balanced position is optimal',
            strength: 0.7,
            supportingData: intelligence ? intelligence.certaintyIndex : 0.7,
            counters: [],
            vulnerabilities: ['Lack of conviction', 'Missing edge'],
            timestamp: now
          };
          break;
          
        case 'risk-manager':
          argument = {
            agentPersona: 'risk-manager',
            position: 'bearish',
            claim: 'Portfolio protection is paramount',
            evidence: [
              'Risk management principles',
              longHorizon ? `${longHorizon.activeGoals.filter(g => g.type === 'preservation').length} preservation goals` : 'Capital preservation focus'
            ],
            reasoning: 'Risk-adjusted returns matter more than absolute returns. We must protect capital first',
            strength: 0.8,
            supportingData: 0.85,
            counters: ['Excessive conservatism', 'Underperformance'],
            vulnerabilities: ['Missing bull markets', 'Opportunity cost'],
            timestamp: now
          };
          break;
          
        case 'opportunist':
          argument = {
            agentPersona: 'opportunist',
            position: environmental && environmental.coherence < 50 ? 'strongly-bullish' : 'bullish',
            claim: 'Asymmetric opportunity detected',
            evidence: [
              environmental ? `Low coherence = mispricing (${environmental.coherence.toFixed(0)})` : 'Market inefficiency',
              'Contrarian positioning advantage'
            ],
            reasoning: 'Market uncertainty creates mispricing. Contrarian position offers favorable risk/reward',
            strength: environmental ? (100 - environmental.coherence) / 100 : 0.5,
            supportingData: 0.6,
            counters: ['Falling knife risk', 'Timing uncertainty'],
            vulnerabilities: ['Wrong side of trend', 'Extended losses'],
            timestamp: now
          };
          break;
          
        default:
          continue;
      }
      
      args.push(argument);
      profile.activeArguments++;
    }
    
    return args;
  }
  
  private generateRebuttals(
    initialArgs: AgentArgument[],
    topic: DebateTopic
  ): AgentArgument[] {
    const rebuttals: AgentArgument[] = [];
    // Simplified: Each agent can rebut opposing views
    // In full implementation, would have agent-to-agent responses
    return rebuttals;
  }
  
  private collectVotes(
    args: AgentArgument[],
    rebuttals: AgentArgument[],
    topic: DebateTopic
  ): AgentVote[] {
    const votes: AgentVote[] = [];
    
    for (const arg of args) {
      const profile = this.councilProfiles.get(arg.agentPersona);
      if (!profile) continue;
      
      votes.push({
        agentPersona: arg.agentPersona,
        stance: arg.position,
        confidence: arg.strength,
        weight: profile.votingWeight,
        reasoning: arg.reasoning
      });
    }
    
    return votes;
  }
  
  private determineConsensus(votes: AgentVote[]): {
    consensusReached: boolean;
    consensusStance: DecisionStance | null;
    consensusConfidence: number;
  } {
    if (votes.length === 0) {
      return { consensusReached: false, consensusStance: null, consensusConfidence: 0 };
    }
    
    // Weight votes by agent voting power
    const stanceScores = new Map<DecisionStance, number>();
    
    for (const vote of votes) {
      const current = stanceScores.get(vote.stance) || 0;
      stanceScores.set(vote.stance, current + vote.weight * vote.confidence);
    }
    
    // Find winning stance
    let maxScore = 0;
    let winningStance: DecisionStance | null = null;
    
    for (const [stance, score] of Array.from(stanceScores.entries())) {
      if (score > maxScore) {
        maxScore = score;
        winningStance = stance;
      }
    }
    
    // Calculate consensus confidence
    const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0);
    const consensusConfidence = maxScore / totalWeight;
    
    // Consensus reached if confidence > 0.6
    const consensusReached = consensusConfidence > 0.6;
    
    return {
      consensusReached,
      consensusStance: winningStance,
      consensusConfidence
    };
  }
  
  private identifyDissent(
    votes: AgentVote[],
    consensusStance: DecisionStance | null,
    args: AgentArgument[]
  ): { dissentingOpinions: AgentArgument[]; dissentStrength: number } {
    if (!consensusStance) {
      return { dissentingOpinions: [], dissentStrength: 0 };
    }
    
    const dissentingVotes = votes.filter(v => v.stance !== consensusStance);
    const dissentingOpinions = args.filter(arg => 
      dissentingVotes.some(v => v.agentPersona === arg.agentPersona)
    );
    
    const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0);
    const dissentWeight = dissentingVotes.reduce((sum, v) => sum + v.weight, 0);
    const dissentStrength = dissentWeight / totalWeight;
    
    return { dissentingOpinions, dissentStrength };
  }
  
  private formulateDecision(consensusStance: DecisionStance | null, votes: AgentVote[]): string {
    if (!consensusStance) return 'No clear decision reached';
    
    switch (consensusStance) {
      case 'strongly-bullish': return 'Aggressive bullish positioning recommended';
      case 'bullish': return 'Moderate bullish positioning recommended';
      case 'neutral': return 'Maintain balanced neutral positioning';
      case 'bearish': return 'Moderate defensive positioning recommended';
      case 'strongly-bearish': return 'Aggressive defensive positioning recommended';
      default: return 'Hold current positioning';
    }
  }
  
  private formulateReasoning(votes: AgentVote[], args: AgentArgument[]): string {
    const supportingArgs = args.slice(0, 3);
    const reasons = supportingArgs.map(arg => arg.claim).join('. ');
    return `Council decision based on: ${reasons}`;
  }
  
  private formulateMinorityReport(dissentingOpinions: AgentArgument[]): string {
    if (dissentingOpinions.length === 0) return '';
    
    const agents = dissentingOpinions.map(arg => {
      const profile = this.councilProfiles.get(arg.agentPersona);
      return profile?.name || arg.agentPersona;
    }).join(', ');
    
    const claims = dissentingOpinions.map(arg => arg.claim).join('. ');
    
    return `Minority view from ${agents}: ${claims}`;
  }
  
  // ============================================
  // DECISION GENERATION
  // ============================================
  
  private generateDecision(debate: DebateSession): CouncilDecision {
    const now = Date.now();
    
    // Calculate unanimity
    const unanimity = 1 - debate.dissentStrength;
    
    // Vote summary
    const voteSummary: CouncilDecision['voteSummary'] = {};
    for (const vote of debate.votes) {
      voteSummary[vote.agentPersona] = vote.stance;
    }
    
    // Key arguments
    const keyArguments = debate.arguments
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(arg => arg.claim);
    
    // Quality metrics
    const debateQuality = this.assessDebateQuality(debate);
    const evidenceStrength = this.assessEvidenceStrength(debate);
    const argumentDiversity = this.calculateDiversityIndex(debate);
    
    const decision: CouncilDecision = {
      id: `decision_${now}`,
      debateId: debate.id,
      decision: debate.consensusStance || 'neutral',
      confidence: debate.consensusConfidence,
      unanimity,
      majorityReasoning: debate.decisionReasoning,
      minorityView: debate.minorityReport,
      keyArguments,
      voteSummary,
      debateQuality,
      evidenceStrength,
      argumentDiversity,
      timestamp: now
    };
    
    // Store
    this.decisionRegistry.set(decision.id, decision);
    
    return decision;
  }
  
  private assessDebateQuality(debate: DebateSession): number {
    // Quality = avg argument strength * participation rate
    const avgStrength = debate.arguments.reduce((sum, arg) => sum + arg.strength, 0) / 
      Math.max(1, debate.arguments.length);
    
    const participationRate = debate.participants.length / 5;
    
    return avgStrength * participationRate;
  }
  
  private assessEvidenceStrength(debate: DebateSession): number {
    // Evidence = avg supporting data across arguments
    return debate.arguments.reduce((sum, arg) => sum + arg.supportingData, 0) / 
      Math.max(1, debate.arguments.length);
  }
  
  // ============================================
  // METRICS CALCULATION
  // ============================================
  
  private calculateOverallConsensus(decisions: CouncilDecision[]): number {
    if (decisions.length === 0) return 0.5;
    
    return decisions.reduce((sum, d) => sum + d.unanimity, 0) / decisions.length;
  }
  
  private calculateAvgDebateQuality(debates: DebateSession[]): number {
    if (debates.length === 0) return 0.5;
    
    return debates.reduce((sum, d) => sum + d.consensusConfidence, 0) / debates.length;
  }
  
  private calculateAvgConfidence(decisions: CouncilDecision[]): number {
    if (decisions.length === 0) return 0.5;
    
    return decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
  }
  
  private identifyMostInfluential(council: AgentProfile[]): AgentPersona | null {
    if (council.length === 0) return null;
    
    return council.reduce((most, agent) => 
      agent.votingWeight > most.votingWeight ? agent : most
    ).persona;
  }
  
  private identifyMostAccurate(council: AgentProfile[]): AgentPersona | null {
    if (council.length === 0) return null;
    
    return council.reduce((most, agent) => 
      agent.recentAccuracy > most.recentAccuracy ? agent : most
    ).persona;
  }
  
  private calculateDiversityIndex(debate: DebateSession): number {
    // Diversity = number of unique stances / total possible stances
    const uniqueStances = new Set(debate.votes.map(v => v.stance)).size;
    return uniqueStances / 5;  // 5 possible stances
  }
  
  private calculateConflictLevel(debate: DebateSession): number {
    // Conflict = 1 - consensus confidence
    return 1 - debate.consensusConfidence;
  }
  
  private calculateCohesionScore(consensus: number, conflict: number): number {
    // Cohesion = high consensus + low conflict
    return (consensus + (1 - conflict)) / 2;
  }
  
  /**
   * Public accessors
   */
  public getCurrentState(): MultiAgentDebateState | null {
    return this.currentState;
  }
  
  public getHistory(): MultiAgentDebateState[] {
    return [...this.stateHistory];
  }
  
  public getCouncil(): AgentProfile[] {
    return Array.from(this.councilProfiles.values());
  }
  
  public getLatestDebate(): DebateSession | null {
    return this.currentState?.activeDebate || null;
  }
  
  public getLatestDecision(): CouncilDecision | null {
    return this.currentState?.latestDecision || null;
  }
}
