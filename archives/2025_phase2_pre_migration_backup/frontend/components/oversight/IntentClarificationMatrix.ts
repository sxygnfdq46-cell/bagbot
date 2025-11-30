/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 14.3: INTENT CLARIFICATION MATRIX
 * ═══════════════════════════════════════════════════════════════════
 * Analyzes user commands for ambiguity, conflicts, and misalignment
 * with system state and capabilities. Ensures precise execution intent.
 * 
 * SAFETY: Analysis only - no execution or interpretation changes
 * PURPOSE: Pre-execution intent verification and clarification
 * ═══════════════════════════════════════════════════════════════════
 */

import type { SystemHealthSnapshot } from './StrategicStateMonitor';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type IntentClarity = 'crystal' | 'clear' | 'ambiguous' | 'conflicting' | 'unclear';
export type IntentType = 'action' | 'query' | 'configuration' | 'analysis' | 'mixed';
export type ConflictType = 'temporal' | 'logical' | 'resource' | 'state' | 'capability';

export interface CommandIntent {
  raw: string;
  parsed: ParsedCommand;
  clarity: IntentClarity;
  type: IntentType;
  confidence: number;        // 0-100
  ambiguities: Ambiguity[];
  conflicts: IntentConflict[];
  alignment: IntentAlignment;
  timestamp: number;
}

export interface ParsedCommand {
  action: string;
  target?: string;
  parameters: Record<string, any>;
  modifiers: string[];
  scope: 'single' | 'multiple' | 'chain';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expectedDuration?: number;
}

export interface Ambiguity {
  type: 'semantic' | 'syntactic' | 'contextual' | 'parametric';
  location: string;         // where in command
  description: string;
  possibleInterpretations: string[];
  recommendedInterpretation: string;
  confidence: number;       // 0-100
}

export interface IntentConflict {
  type: ConflictType;
  severity: 'minor' | 'moderate' | 'major' | 'blocking';
  description: string;
  conflictsWith: string;    // what it conflicts with
  resolution?: string;
  requiresHumanDecision: boolean;
}

export interface IntentAlignment {
  withCurrentState: number;     // 0-100
  withRecentHistory: number;    // 0-100
  withMode: number;             // 0-100
  withTone: number;             // 0-100
  withCapabilities: number;     // 0-100
  withBoundaries: number;       // 0-100
  overall: number;              // 0-100
  misalignments: Misalignment[];
}

export interface Misalignment {
  aspect: 'state' | 'history' | 'mode' | 'tone' | 'capability' | 'boundary';
  severity: number;         // 0-100
  description: string;
  recommendation: string;
}

export interface HistoricalPattern {
  command: string;
  frequency: number;
  lastUsed: number;
  successRate: number;
  avgDuration: number;
  context: {
    state: string;
    mode: string;
    tone: string;
  };
}

export interface ClarificationRequest {
  intent: CommandIntent;
  questions: ClarificationQuestion[];
  suggestions: string[];
  alternativeCommands: string[];
  requiredClarifications: string[];
  optionalClarifications: string[];
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'choice' | 'confirm' | 'specify' | 'free-form';
  options?: string[];
  defaultAnswer?: string;
  importance: 'critical' | 'important' | 'optional';
}

export interface IntentValidation {
  isValid: boolean;
  isSafe: boolean;
  isWithinBoundaries: boolean;
  isExecutable: boolean;
  
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  
  confidence: number;       // 0-100
}

// ─────────────────────────────────────────────────────────────────
// INTENT CLARIFICATION MATRIX CLASS
// ─────────────────────────────────────────────────────────────────

export class IntentClarificationMatrix {
  private commandHistory: HistoricalPattern[];
  private maxHistorySize: number;
  private allowedBoundaries: Set<string>;
  
  constructor(maxHistorySize: number = 100) {
    this.commandHistory = [];
    this.maxHistorySize = maxHistorySize;
    this.allowedBoundaries = new Set([
      'analysis',
      'visualization',
      'monitoring',
      'forecasting',
      'recommendation'
    ]);
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN ANALYSIS METHOD
  // ─────────────────────────────────────────────────────────────

  async analyzeIntent(
    command: string,
    currentState: SystemHealthSnapshot,
    recentHistory: SystemHealthSnapshot[] = []
  ): Promise<CommandIntent> {
    
    const parsed = this.parseCommand(command);
    const type = this.determineIntentType(parsed);
    const ambiguities = this.detectAmbiguities(command, parsed);
    const conflicts = this.detectConflicts(parsed, currentState);
    const alignment = this.calculateAlignment(parsed, currentState, recentHistory);
    
    const clarity = this.determineClarity(ambiguities, conflicts, alignment);
    const confidence = this.calculateConfidence(clarity, ambiguities, conflicts, alignment);
    
    return {
      raw: command,
      parsed,
      clarity,
      type,
      confidence,
      ambiguities,
      conflicts,
      alignment,
      timestamp: Date.now()
    };
  }

  // ─────────────────────────────────────────────────────────────
  // COMMAND PARSING
  // ─────────────────────────────────────────────────────────────

  private parseCommand(command: string): ParsedCommand {
    // Simplified parsing - in production, use sophisticated NLP
    const words = command.toLowerCase().split(/\s+/);
    
    // Extract action (usually first verb)
    const action = words.find(w => this.isAction(w)) || words[0];
    
    // Extract target
    const target = words.find(w => this.isTarget(w));
    
    // Extract parameters
    const parameters: Record<string, any> = {};
    words.forEach((word, i) => {
      if (word.includes('=')) {
        const [key, value] = word.split('=');
        parameters[key] = value;
      }
    });
    
    // Extract modifiers
    const modifiers = words.filter(w => this.isModifier(w));
    
    // Determine scope
    const scope = command.includes('all') || command.includes('multiple') ? 
      'multiple' : 
      command.includes('chain') || command.includes('sequence') ?
        'chain' : 'single';
    
    // Determine priority
    let priority: ParsedCommand['priority'] = 'normal';
    if (command.includes('urgent') || command.includes('immediate')) {
      priority = 'urgent';
    } else if (command.includes('high priority')) {
      priority = 'high';
    } else if (command.includes('low priority') || command.includes('when possible')) {
      priority = 'low';
    }
    
    return {
      action,
      target,
      parameters,
      modifiers,
      scope,
      priority,
      expectedDuration: this.estimateCommandDuration(action, scope)
    };
  }

  private isAction(word: string): boolean {
    const actions = [
      'run', 'execute', 'start', 'stop', 'analyze', 'check',
      'monitor', 'forecast', 'optimize', 'adjust', 'configure'
    ];
    return actions.includes(word);
  }

  private isTarget(word: string): boolean {
    const targets = [
      'system', 'flows', 'tasks', 'state', 'metrics',
      'stability', 'performance', 'emotional', 'tone'
    ];
    return targets.includes(word);
  }

  private isModifier(word: string): boolean {
    const modifiers = [
      'carefully', 'quickly', 'safely', 'thoroughly',
      'continuously', 'periodically', 'immediately'
    ];
    return modifiers.includes(word);
  }

  private estimateCommandDuration(action: string, scope: ParsedCommand['scope']): number {
    const baseDurations: Record<string, number> = {
      run: 10000,
      execute: 8000,
      analyze: 5000,
      check: 2000,
      monitor: 30000
    };
    
    const base = baseDurations[action] || 5000;
    const scopeMultiplier = scope === 'multiple' ? 2 : scope === 'chain' ? 3 : 1;
    
    return base * scopeMultiplier;
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT TYPE DETERMINATION
  // ─────────────────────────────────────────────────────────────

  private determineIntentType(parsed: ParsedCommand): IntentType {
    const queryActions = ['check', 'show', 'display', 'get', 'list'];
    const configActions = ['set', 'configure', 'adjust', 'change', 'update'];
    const analysisActions = ['analyze', 'evaluate', 'assess', 'review'];
    const actionActions = ['run', 'execute', 'start', 'stop', 'restart'];
    
    if (queryActions.includes(parsed.action)) return 'query';
    if (configActions.includes(parsed.action)) return 'configuration';
    if (analysisActions.includes(parsed.action)) return 'analysis';
    if (actionActions.includes(parsed.action)) return 'action';
    
    return 'mixed';
  }

  // ─────────────────────────────────────────────────────────────
  // AMBIGUITY DETECTION
  // ─────────────────────────────────────────────────────────────

  private detectAmbiguities(command: string, parsed: ParsedCommand): Ambiguity[] {
    const ambiguities: Ambiguity[] = [];
    
    // Check for vague actions
    if (['do', 'handle', 'process'].includes(parsed.action)) {
      ambiguities.push({
        type: 'semantic',
        location: 'action',
        description: `Action "${parsed.action}" is vague`,
        possibleInterpretations: ['execute', 'analyze', 'monitor'],
        recommendedInterpretation: 'execute',
        confidence: 40
      });
    }
    
    // Check for unspecified targets
    if (!parsed.target && parsed.scope !== 'single') {
      ambiguities.push({
        type: 'contextual',
        location: 'target',
        description: 'Target not specified for multi-scope operation',
        possibleInterpretations: ['all tasks', 'active flows', 'pending items'],
        recommendedInterpretation: 'active flows',
        confidence: 50
      });
    }
    
    // Check for ambiguous parameters
    Object.entries(parsed.parameters).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('/')) {
        ambiguities.push({
          type: 'parametric',
          location: `parameter: ${key}`,
          description: `Parameter "${key}" has ambiguous value "${value}"`,
          possibleInterpretations: value.split('/'),
          recommendedInterpretation: value.split('/')[0],
          confidence: 60
        });
      }
    });
    
    // Check for contradictory modifiers
    if (parsed.modifiers.includes('quickly') && parsed.modifiers.includes('carefully')) {
      ambiguities.push({
        type: 'semantic',
        location: 'modifiers',
        description: 'Contradictory modifiers: "quickly" and "carefully"',
        possibleInterpretations: ['prioritize speed', 'prioritize safety'],
        recommendedInterpretation: 'prioritize safety',
        confidence: 70
      });
    }
    
    return ambiguities;
  }

  // ─────────────────────────────────────────────────────────────
  // CONFLICT DETECTION
  // ─────────────────────────────────────────────────────────────

  private detectConflicts(
    parsed: ParsedCommand,
    currentState: SystemHealthSnapshot
  ): IntentConflict[] {
    
    const conflicts: IntentConflict[] = [];
    
    // Temporal conflicts
    if (parsed.priority === 'urgent' && currentState.overall === 'critical') {
      conflicts.push({
        type: 'temporal',
        severity: 'major',
        description: 'Urgent request during critical system state',
        conflictsWith: 'system stability requirements',
        resolution: 'Wait for system to stabilize or reduce priority',
        requiresHumanDecision: true
      });
    }
    
    // Resource conflicts
    if (parsed.scope === 'multiple' && currentState.load.cpu > 80) {
      conflicts.push({
        type: 'resource',
        severity: 'moderate',
        description: 'Multi-scope operation requested during high CPU usage',
        conflictsWith: 'system resource availability',
        resolution: 'Execute sequentially or wait for resources',
        requiresHumanDecision: false
      });
    }
    
    // State conflicts
    if (parsed.action === 'execute' && currentState.stability === 'unstable') {
      conflicts.push({
        type: 'state',
        severity: 'major',
        description: 'Execution requested during unstable system state',
        conflictsWith: 'stability requirements',
        resolution: 'Stabilize system before execution',
        requiresHumanDecision: true
      });
    }
    
    // Logical conflicts
    if (parsed.action === 'stop' && currentState.congestion.activeFlows === 0) {
      conflicts.push({
        type: 'logical',
        severity: 'minor',
        description: 'Stop command issued but no active flows',
        conflictsWith: 'current execution state',
        resolution: 'Command may be unnecessary',
        requiresHumanDecision: false
      });
    }
    
    return conflicts;
  }

  // ─────────────────────────────────────────────────────────────
  // ALIGNMENT CALCULATION
  // ─────────────────────────────────────────────────────────────

  private calculateAlignment(
    parsed: ParsedCommand,
    currentState: SystemHealthSnapshot,
    recentHistory: SystemHealthSnapshot[]
  ): IntentAlignment {
    
    const withCurrentState = this.calculateStateAlignment(parsed, currentState);
    const withRecentHistory = this.calculateHistoryAlignment(parsed, recentHistory);
    const withMode = this.calculateModeAlignment(parsed);
    const withTone = this.calculateToneAlignment(parsed, currentState);
    const withCapabilities = this.calculateCapabilityAlignment(parsed);
    const withBoundaries = this.calculateBoundaryAlignment(parsed);
    
    const overall = (
      withCurrentState * 0.25 +
      withRecentHistory * 0.15 +
      withMode * 0.15 +
      withTone * 0.15 +
      withCapabilities * 0.15 +
      withBoundaries * 0.15
    );
    
    const misalignments = this.identifyMisalignments({
      withCurrentState,
      withRecentHistory,
      withMode,
      withTone,
      withCapabilities,
      withBoundaries
    });
    
    return {
      withCurrentState,
      withRecentHistory,
      withMode,
      withTone,
      withCapabilities,
      withBoundaries,
      overall,
      misalignments
    };
  }

  private calculateStateAlignment(
    parsed: ParsedCommand,
    state: SystemHealthSnapshot
  ): number {
    
    let alignment = 70; // Base alignment
    
    // Check if action is appropriate for current state
    if (state.overall === 'critical') {
      if (['stop', 'check', 'analyze'].includes(parsed.action)) {
        alignment += 20;
      } else if (['execute', 'start', 'run'].includes(parsed.action)) {
        alignment -= 30;
      }
    }
    
    // Check priority alignment
    if (parsed.priority === 'urgent' && state.overall !== 'safe') {
      alignment -= 15;
    }
    
    // Check scope alignment
    if (parsed.scope === 'multiple' && state.load.cpu > 70) {
      alignment -= 20;
    }
    
    return Math.max(0, Math.min(100, alignment));
  }

  private calculateHistoryAlignment(
    parsed: ParsedCommand,
    history: SystemHealthSnapshot[]
  ): number {
    
    if (history.length === 0) return 50;
    
    // Check if similar commands were recently executed
    const pattern = this.findHistoricalPattern(parsed.action);
    
    if (pattern) {
      return pattern.successRate;
    }
    
    return 60;
  }

  private calculateModeAlignment(parsed: ParsedCommand): number {
    // In production, check against actual system mode
    return 80;
  }

  private calculateToneAlignment(
    parsed: ParsedCommand,
    state: SystemHealthSnapshot
  ): number {
    
    // Check if command tone matches system emotional state
    const hasAggressiveModifiers = parsed.modifiers.some(m => 
      ['quickly', 'immediately', 'urgently'].includes(m)
    );
    
    if (hasAggressiveModifiers && state.emotional.emotionalLoad > 70) {
      return 40;
    }
    
    return 85;
  }

  private calculateCapabilityAlignment(parsed: ParsedCommand): number {
    // Check if system has capability to execute command
    const supportedActions = [
      'analyze', 'check', 'monitor', 'forecast', 'recommend'
    ];
    
    if (supportedActions.includes(parsed.action)) {
      return 95;
    }
    
    return 60;
  }

  private calculateBoundaryAlignment(parsed: ParsedCommand): number {
    // Check if command stays within safety boundaries
    if (this.allowedBoundaries.has(parsed.action)) {
      return 100;
    }
    
    // Execution actions need approval
    if (['execute', 'run', 'start'].includes(parsed.action)) {
      return 50; // Lower because requires explicit approval
    }
    
    return 70;
  }

  private identifyMisalignments(scores: {
    withCurrentState: number;
    withRecentHistory: number;
    withMode: number;
    withTone: number;
    withCapabilities: number;
    withBoundaries: number;
  }): Misalignment[] {
    
    const misalignments: Misalignment[] = [];
    const threshold = 60;
    
    if (scores.withCurrentState < threshold) {
      misalignments.push({
        aspect: 'state',
        severity: 100 - scores.withCurrentState,
        description: 'Command may not be suitable for current system state',
        recommendation: 'Wait for system to stabilize or modify command'
      });
    }
    
    if (scores.withCapabilities < threshold) {
      misalignments.push({
        aspect: 'capability',
        severity: 100 - scores.withCapabilities,
        description: 'System may not have full capability to execute this command',
        recommendation: 'Verify command is supported or use alternative'
      });
    }
    
    if (scores.withBoundaries < threshold) {
      misalignments.push({
        aspect: 'boundary',
        severity: 100 - scores.withBoundaries,
        description: 'Command may exceed safety boundaries',
        recommendation: 'Review command or provide explicit approval'
      });
    }
    
    return misalignments;
  }

  // ─────────────────────────────────────────────────────────────
  // CLARITY DETERMINATION
  // ─────────────────────────────────────────────────────────────

  private determineClarity(
    ambiguities: Ambiguity[],
    conflicts: IntentConflict[],
    alignment: IntentAlignment
  ): IntentClarity {
    
    if (conflicts.some(c => c.severity === 'blocking')) {
      return 'conflicting';
    }
    
    if (ambiguities.length > 3 || alignment.overall < 40) {
      return 'unclear';
    }
    
    if (ambiguities.length > 1 || alignment.overall < 60) {
      return 'ambiguous';
    }
    
    if (ambiguities.length === 0 && alignment.overall > 85) {
      return 'crystal';
    }
    
    return 'clear';
  }

  private calculateConfidence(
    clarity: IntentClarity,
    ambiguities: Ambiguity[],
    conflicts: IntentConflict[],
    alignment: IntentAlignment
  ): number {
    
    const clarityScores: Record<IntentClarity, number> = {
      crystal: 95,
      clear: 80,
      ambiguous: 60,
      conflicting: 30,
      unclear: 20
    };
    
    let confidence = clarityScores[clarity];
    
    // Adjust for ambiguities
    confidence -= ambiguities.length * 5;
    
    // Adjust for conflicts
    confidence -= conflicts.length * 10;
    
    // Adjust for alignment
    confidence = (confidence + alignment.overall) / 2;
    
    return Math.max(0, Math.min(100, confidence));
  }

  // ─────────────────────────────────────────────────────────────
  // CLARIFICATION GENERATION
  // ─────────────────────────────────────────────────────────────

  generateClarificationRequest(intent: CommandIntent): ClarificationRequest {
    const questions: ClarificationQuestion[] = [];
    const suggestions: string[] = [];
    const alternativeCommands: string[] = [];
    
    // Generate questions for ambiguities
    intent.ambiguities.forEach((amb, i) => {
      questions.push({
        id: `amb-${i}`,
        question: `${amb.description}. Which interpretation did you mean?`,
        type: 'choice',
        options: amb.possibleInterpretations,
        defaultAnswer: amb.recommendedInterpretation,
        importance: amb.confidence < 50 ? 'critical' : 'important'
      });
    });
    
    // Generate questions for conflicts
    intent.conflicts.forEach((conf, i) => {
      if (conf.requiresHumanDecision) {
        questions.push({
          id: `conf-${i}`,
          question: `${conf.description}. How would you like to proceed?`,
          type: 'choice',
          options: conf.resolution ? [conf.resolution, 'Cancel command'] : ['Cancel command'],
          importance: 'critical'
        });
      }
    });
    
    // Generate suggestions
    if (intent.clarity === 'ambiguous' || intent.clarity === 'unclear') {
      suggestions.push('Consider being more specific about the action and target');
    }
    
    if (intent.alignment.overall < 60) {
      suggestions.push('Command may not align well with current system state');
    }
    
    // Generate alternatives
    if (intent.parsed.action === 'execute' && intent.alignment.withCurrentState < 60) {
      alternativeCommands.push('analyze execution readiness');
      alternativeCommands.push('check system state');
    }
    
    const requiredClarifications = questions
      .filter(q => q.importance === 'critical')
      .map(q => q.question);
    
    const optionalClarifications = questions
      .filter(q => q.importance !== 'critical')
      .map(q => q.question);
    
    return {
      intent,
      questions,
      suggestions,
      alternativeCommands,
      requiredClarifications,
      optionalClarifications
    };
  }

  // ─────────────────────────────────────────────────────────────
  // VALIDATION
  // ─────────────────────────────────────────────────────────────

  validateIntent(intent: CommandIntent): IntentValidation {
    const blockers: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    // Check for blocking conflicts
    const blockingConflicts = intent.conflicts.filter(c => c.severity === 'blocking');
    blockingConflicts.forEach(c => {
      blockers.push(c.description);
    });
    
    // Check for critical ambiguities
    const criticalAmbiguities = intent.ambiguities.filter(a => a.confidence < 40);
    if (criticalAmbiguities.length > 0) {
      blockers.push('Command contains critical ambiguities that must be resolved');
    }
    
    // Add warnings
    if (intent.alignment.overall < 60) {
      warnings.push('Command has low alignment with current system state');
    }
    
    intent.conflicts.forEach(c => {
      if (c.severity === 'major') {
        warnings.push(c.description);
      }
    });
    
    // Add recommendations
    if (intent.clarity !== 'crystal' && intent.clarity !== 'clear') {
      recommendations.push('Clarify command before execution');
    }
    
    intent.alignment.misalignments.forEach(m => {
      recommendations.push(m.recommendation);
    });
    
    const isValid = blockers.length === 0;
    const isSafe = intent.conflicts.every(c => c.severity !== 'blocking');
    const isWithinBoundaries = intent.alignment.withBoundaries >= 50;
    const isExecutable = isValid && isSafe && isWithinBoundaries;
    
    return {
      isValid,
      isSafe,
      isWithinBoundaries,
      isExecutable,
      blockers,
      warnings,
      recommendations,
      confidence: intent.confidence
    };
  }

  // ─────────────────────────────────────────────────────────────
  // HISTORY MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  addToHistory(command: string, success: boolean, duration: number): void {
    const existing = this.commandHistory.find(p => p.command === command);
    
    if (existing) {
      existing.frequency++;
      existing.lastUsed = Date.now();
      existing.successRate = (existing.successRate * (existing.frequency - 1) + (success ? 100 : 0)) / existing.frequency;
      existing.avgDuration = (existing.avgDuration * (existing.frequency - 1) + duration) / existing.frequency;
    } else {
      this.commandHistory.push({
        command,
        frequency: 1,
        lastUsed: Date.now(),
        successRate: success ? 100 : 0,
        avgDuration: duration,
        context: {
          state: 'normal',
          mode: 'standard',
          tone: 'balanced'
        }
      });
    }
    
    // Trim history
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.sort((a, b) => b.lastUsed - a.lastUsed);
      this.commandHistory = this.commandHistory.slice(0, this.maxHistorySize);
    }
  }

  private findHistoricalPattern(action: string): HistoricalPattern | undefined {
    return this.commandHistory.find(p => p.command.includes(action));
  }
}
