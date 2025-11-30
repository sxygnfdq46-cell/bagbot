/**
 * LEVEL 13.2 — INTENT-AWARENESS LAYER
 * 
 * Reads and understands user intent to make BagBot genuinely aligned with commands.
 * 
 * Features:
 * - Direction detection (what user wants to build/fix/improve)
 * - Style preferences (rapid/careful, minimal/verbose)
 * - Urgency energy (high/medium/low priority)
 * - Upgrade type classification (visual vs logic, evolution vs stability)
 * - Confidence scoring for intent predictions
 * - Intent history tracking
 * 
 * Safety: Read-only intent analysis, no autonomous actions
 */

/* ================================ */
/* TYPES                            */
/* ================================ */

interface UserIntent {
  intentId: string;
  timestamp: number;
  direction: IntentDirection;
  style: IntentStyle;
  urgency: IntentUrgency;
  upgradeType: UpgradeType;
  confidence: number; // 0-100
  rawInput: string;
  analysis: IntentAnalysis;
  metadata: Record<string, any>;
}

interface IntentDirection {
  category: DirectionCategory;
  target: string | null; // what to build/fix/improve
  scope: 'component' | 'feature' | 'system' | 'architecture' | 'global';
  keywords: string[];
}

type DirectionCategory = 
  | 'build' 
  | 'fix' 
  | 'improve' 
  | 'refactor' 
  | 'test' 
  | 'deploy' 
  | 'document' 
  | 'investigate' 
  | 'unknown';

interface IntentStyle {
  buildingStyle: 'rapid' | 'careful' | 'balanced';
  verbosity: 'minimal' | 'standard' | 'verbose';
  errorHandling: 'strict' | 'permissive';
  preferences: string[];
}

interface IntentUrgency {
  level: 'high' | 'medium' | 'low';
  timeframe: string | null; // "now", "today", "this week", etc.
  blocking: boolean; // is this blocking other work?
}

interface UpgradeType {
  primary: 'visual' | 'logic' | 'both';
  transformation: 'evolution' | 'stability' | 'optimization';
  impact: 'small' | 'medium' | 'large';
}

interface IntentAnalysis {
  parsedCommands: string[];
  implicitGoals: string[];
  potentialConflicts: string[];
  suggestedApproach: string | null;
  requiresConfirmation: boolean;
}

interface IntentPattern {
  patternId: string;
  name: string;
  keywords: string[];
  directionHint: DirectionCategory;
  urgencyIndicators: string[];
  styleIndicators: string[];
  matchCount: number;
}

interface IntentHistory {
  recentIntents: UserIntent[];
  commonDirections: Map<DirectionCategory, number>;
  preferredStyle: IntentStyle | null;
  averageUrgency: number;
}

interface IntentAwarenessConfig {
  maxIntentHistory: number;
  confidenceThreshold: number;
  enablePatternLearning: boolean;
  requireConfirmationThreshold: number; // confidence below this requires confirmation
}

/* ================================ */
/* INTENT-AWARENESS LAYER           */
/* ================================ */

export class IntentAwarenessLayer {
  private config: IntentAwarenessConfig;

  // Intent State
  private currentIntent: UserIntent | null;
  private intentHistory: UserIntent[];

  // Pattern Recognition
  private patterns: Map<string, IntentPattern>;

  // Style Preferences
  private learnedStyle: IntentStyle | null;

  constructor(config?: Partial<IntentAwarenessConfig>) {
    this.config = {
      maxIntentHistory: 20,
      confidenceThreshold: 60,
      enablePatternLearning: true,
      requireConfirmationThreshold: 40,
      ...config,
    };

    this.currentIntent = null;
    this.intentHistory = [];
    this.patterns = new Map();
    this.learnedStyle = null;

    this.initializePatterns();
  }

  /* ================================ */
  /* PATTERN INITIALIZATION           */
  /* ================================ */

  private initializePatterns(): void {
    const builtInPatterns: IntentPattern[] = [
      {
        patternId: 'build_feature',
        name: 'Build New Feature',
        keywords: ['build', 'create', 'add', 'new', 'implement'],
        directionHint: 'build',
        urgencyIndicators: ['now', 'urgent', 'asap'],
        styleIndicators: ['rapid', 'quick', 'fast'],
        matchCount: 0,
      },
      {
        patternId: 'fix_bug',
        name: 'Fix Bug',
        keywords: ['fix', 'bug', 'error', 'broken', 'issue'],
        directionHint: 'fix',
        urgencyIndicators: ['critical', 'urgent', 'blocking'],
        styleIndicators: ['careful', 'thorough'],
        matchCount: 0,
      },
      {
        patternId: 'improve_existing',
        name: 'Improve Existing',
        keywords: ['improve', 'enhance', 'optimize', 'better'],
        directionHint: 'improve',
        urgencyIndicators: [],
        styleIndicators: ['careful', 'balanced'],
        matchCount: 0,
      },
      {
        patternId: 'refactor_code',
        name: 'Refactor Code',
        keywords: ['refactor', 'restructure', 'clean', 'organize'],
        directionHint: 'refactor',
        urgencyIndicators: [],
        styleIndicators: ['careful', 'thorough'],
        matchCount: 0,
      },
      {
        patternId: 'run_tests',
        name: 'Run Tests',
        keywords: ['test', 'verify', 'validate', 'check'],
        directionHint: 'test',
        urgencyIndicators: [],
        styleIndicators: ['strict'],
        matchCount: 0,
      },
    ];

    for (const pattern of builtInPatterns) {
      this.patterns.set(pattern.patternId, pattern);
    }
  }

  /* ================================ */
  /* INTENT ANALYSIS                  */
  /* ================================ */

  public analyzeIntent(userInput: string): UserIntent {
    const now = Date.now();
    const inputLower = userInput.toLowerCase();

    // Detect direction
    const direction = this.detectDirection(inputLower);

    // Detect style
    const style = this.detectStyle(inputLower);

    // Detect urgency
    const urgency = this.detectUrgency(inputLower);

    // Detect upgrade type
    const upgradeType = this.detectUpgradeType(inputLower);

    // Perform analysis
    const analysis = this.performAnalysis(userInput, direction, style, urgency, upgradeType);

    // Calculate confidence
    const confidence = this.calculateConfidence(direction, style, urgency, analysis);

    const intent: UserIntent = {
      intentId: `intent_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      direction,
      style,
      urgency,
      upgradeType,
      confidence,
      rawInput: userInput,
      analysis,
      metadata: {},
    };

    // Update current intent
    this.currentIntent = intent;

    // Add to history
    this.intentHistory.push(intent);
    if (this.intentHistory.length > this.config.maxIntentHistory) {
      this.intentHistory.shift();
    }

    // Update patterns
    if (this.config.enablePatternLearning) {
      this.updatePatterns(intent);
    }

    // Update learned style
    this.updateLearnedStyle();

    return intent;
  }

  private detectDirection(input: string): IntentDirection {
    const words = input.split(/\s+/);
    const keywords: string[] = [];
    let category: DirectionCategory = 'unknown';
    let target: string | null = null;
    let scope: IntentDirection['scope'] = 'component';

    // Check patterns
    for (const pattern of Array.from(this.patterns.values())) {
      const matchingKeywords = pattern.keywords.filter((kw: string) => input.includes(kw));
      if (matchingKeywords.length > 0) {
        keywords.push(...matchingKeywords);
        category = pattern.directionHint;
        break;
      }
    }

    // Extract target
    const targetPatterns = [
      /(?:build|create|add|fix|improve)\s+(.+?)(?:\s+(?:for|in|on|at)|$)/i,
      /(?:refactor|restructure|clean)\s+(.+?)(?:\s+(?:for|in|on|at)|$)/i,
    ];

    for (const pattern of targetPatterns) {
      const match = input.match(pattern);
      if (match) {
        target = match[1].trim();
        break;
      }
    }

    // Detect scope
    if (input.includes('component')) scope = 'component';
    else if (input.includes('feature')) scope = 'feature';
    else if (input.includes('system')) scope = 'system';
    else if (input.includes('architecture')) scope = 'architecture';
    else if (input.includes('global') || input.includes('entire')) scope = 'global';

    return { category, target, scope, keywords };
  }

  private detectStyle(input: string): IntentStyle {
    let buildingStyle: IntentStyle['buildingStyle'] = 'balanced';
    let verbosity: IntentStyle['verbosity'] = 'standard';
    let errorHandling: IntentStyle['errorHandling'] = 'permissive';
    const preferences: string[] = [];

    // Building style
    if (/(rapid|quick|fast|speed|now)/i.test(input)) {
      buildingStyle = 'rapid';
      preferences.push('speed');
    } else if (/(careful|thorough|detailed|precise)/i.test(input)) {
      buildingStyle = 'careful';
      preferences.push('thoroughness');
    }

    // Verbosity
    if (/(minimal|brief|concise|short)/i.test(input)) {
      verbosity = 'minimal';
    } else if (/(verbose|detailed|explain|documentation)/i.test(input)) {
      verbosity = 'verbose';
    }

    // Error handling
    if (/(strict|exact|perfect|no error)/i.test(input)) {
      errorHandling = 'strict';
    }

    return { buildingStyle, verbosity, errorHandling, preferences };
  }

  private detectUrgency(input: string): IntentUrgency {
    let level: IntentUrgency['level'] = 'medium';
    let timeframe: string | null = null;
    let blocking = false;

    // High urgency
    if (/(urgent|asap|critical|now|immediately|emergency)/i.test(input)) {
      level = 'high';
      timeframe = 'now';
    }
    // Low urgency
    else if (/(when(ever)? (you )?can|no rush|eventually|later)/i.test(input)) {
      level = 'low';
    }

    // Timeframe
    if (/today/i.test(input)) timeframe = 'today';
    else if (/this week/i.test(input)) timeframe = 'this week';
    else if (/soon/i.test(input)) timeframe = 'soon';

    // Blocking
    if (/(blocking|blocked|can'?t (proceed|continue)|prevent)/i.test(input)) {
      blocking = true;
      level = 'high';
    }

    return { level, timeframe, blocking };
  }

  private detectUpgradeType(input: string): UpgradeType {
    let primary: UpgradeType['primary'] = 'both';
    let transformation: UpgradeType['transformation'] = 'evolution';
    let impact: UpgradeType['impact'] = 'medium';

    // Primary type
    if (/(ui|frontend|visual|style|design|look)/i.test(input)) {
      primary = 'visual';
    } else if (/(logic|backend|algorithm|function|api)/i.test(input)) {
      primary = 'logic';
    }

    // Transformation
    if (/(stable|stability|safe|maintain)/i.test(input)) {
      transformation = 'stability';
    } else if (/(optimize|performance|faster|efficient)/i.test(input)) {
      transformation = 'optimization';
    }

    // Impact
    if (/(small|minor|tiny|little)/i.test(input)) {
      impact = 'small';
    } else if (/(large|major|big|massive|complete)/i.test(input)) {
      impact = 'large';
    }

    return { primary, transformation, impact };
  }

  private performAnalysis(
    input: string,
    direction: IntentDirection,
    style: IntentStyle,
    urgency: IntentUrgency,
    upgradeType: UpgradeType
  ): IntentAnalysis {
    const parsedCommands: string[] = [];
    const implicitGoals: string[] = [];
    const potentialConflicts: string[] = [];
    let suggestedApproach: string | null = null;
    let requiresConfirmation = false;

    // Extract commands
    const commandPatterns = [
      /(?:please )?(?:can you |could you )?(build|create|fix|improve|refactor|test|deploy)/gi,
    ];

    for (const pattern of commandPatterns) {
      const matches = Array.from(input.matchAll(pattern));
      for (const match of matches) {
        parsedCommands.push(match[1]);
      }
    }

    // Infer implicit goals
    if (direction.category === 'build') {
      implicitGoals.push('Create new functionality');
      if (style.errorHandling === 'strict') {
        implicitGoals.push('Ensure error-free implementation');
      }
    } else if (direction.category === 'fix') {
      implicitGoals.push('Resolve existing issue');
      implicitGoals.push('Prevent regression');
    }

    // Detect conflicts
    if (style.buildingStyle === 'rapid' && style.errorHandling === 'strict') {
      potentialConflicts.push('Rapid building conflicts with strict error handling');
    }

    if (urgency.level === 'high' && upgradeType.impact === 'large') {
      potentialConflicts.push('High urgency conflicts with large impact changes');
      requiresConfirmation = true;
    }

    // Suggest approach
    if (direction.category === 'build') {
      if (style.buildingStyle === 'rapid') {
        suggestedApproach = 'Iterative development with quick feedback loops';
      } else {
        suggestedApproach = 'Thorough design followed by careful implementation';
      }
    }

    return {
      parsedCommands,
      implicitGoals,
      potentialConflicts,
      suggestedApproach,
      requiresConfirmation,
    };
  }

  private calculateConfidence(
    direction: IntentDirection,
    style: IntentStyle,
    urgency: IntentUrgency,
    analysis: IntentAnalysis
  ): number {
    let confidence = 50; // Base confidence

    // Direction clarity
    if (direction.category !== 'unknown') confidence += 15;
    if (direction.target !== null) confidence += 10;
    if (direction.keywords.length > 0) confidence += 5;

    // Command clarity
    if (analysis.parsedCommands.length > 0) confidence += 10;

    // Style clarity
    if (style.buildingStyle !== 'balanced') confidence += 5;
    if (style.preferences.length > 0) confidence += 5;

    // Conflicts reduce confidence
    confidence -= analysis.potentialConflicts.length * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  /* ================================ */
  /* PATTERN LEARNING                 */
  /* ================================ */

  private updatePatterns(intent: UserIntent): void {
    for (const pattern of Array.from(this.patterns.values())) {
      const matchingKeywords = pattern.keywords.filter((kw: string) =>
        intent.rawInput.toLowerCase().includes(kw)
      );

      if (matchingKeywords.length > 0) {
        pattern.matchCount++;
      }
    }
  }

  private updateLearnedStyle(): void {
    if (this.intentHistory.length < 5) return;

    const recentIntents = this.intentHistory.slice(-5);

    // Aggregate styles
    const buildingStyles = recentIntents.map(i => i.style.buildingStyle);
    const verbosities = recentIntents.map(i => i.style.verbosity);

    const mostCommonBuildingStyle = this.getMostCommon(buildingStyles);
    const mostCommonVerbosity = this.getMostCommon(verbosities);

    this.learnedStyle = {
      buildingStyle: mostCommonBuildingStyle || 'balanced',
      verbosity: mostCommonVerbosity || 'standard',
      errorHandling: 'permissive',
      preferences: [],
    };
  }

  private getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;

    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let max = 0;
    let mostCommon: T | null = null;

    for (const [item, count] of Array.from(counts.entries())) {
      if (count > max) {
        max = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  /* ================================ */
  /* INTENT ACCESS                    */
  /* ================================ */

  public getCurrentIntent(): UserIntent | null {
    return this.currentIntent ? { ...this.currentIntent } : null;
  }

  public getIntentHistory(limit: number = 10): UserIntent[] {
    return this.intentHistory.slice(-limit).map(i => ({ ...i }));
  }

  public getLearnedStyle(): IntentStyle | null {
    return this.learnedStyle ? { ...this.learnedStyle } : null;
  }

  public getCommonDirections(): Map<DirectionCategory, number> {
    const counts = new Map<DirectionCategory, number>();

    for (const intent of this.intentHistory) {
      const category = intent.direction.category;
      counts.set(category, (counts.get(category) || 0) + 1);
    }

    return counts;
  }

  public requiresConfirmation(): boolean {
    if (!this.currentIntent) return false;

    // Low confidence requires confirmation
    if (this.currentIntent.confidence < this.config.requireConfirmationThreshold) {
      return true;
    }

    // Analysis flagged for confirmation
    if (this.currentIntent.analysis.requiresConfirmation) {
      return true;
    }

    return false;
  }

  /* ================================ */
  /* SUMMARY & REPORTING              */
  /* ================================ */

  public getSummary(): string {
    const current = this.currentIntent;
    const commonDirs = this.getCommonDirections();
    const topDirection = Array.from(commonDirs.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return `Intent-Awareness Layer Summary:

CURRENT INTENT:
  ${current ? `
  Direction: ${current.direction.category} → ${current.direction.target || 'unspecified'}
  Style: ${current.style.buildingStyle} / ${current.style.verbosity}
  Urgency: ${current.urgency.level}${current.urgency.blocking ? ' (BLOCKING)' : ''}
  Upgrade Type: ${current.upgradeType.primary} (${current.upgradeType.transformation})
  Confidence: ${current.confidence.toFixed(1)}%
  Requires Confirmation: ${this.requiresConfirmation() ? 'Yes' : 'No'}
  ` : 'None'}

INTENT HISTORY:
  Total Intents: ${this.intentHistory.length}
  Most Common Direction: ${topDirection ? `${topDirection[0]} (${topDirection[1]} times)` : 'N/A'}
  Learned Style: ${this.learnedStyle ? `${this.learnedStyle.buildingStyle} / ${this.learnedStyle.verbosity}` : 'Not yet learned'}

PATTERNS:
  Total Patterns: ${this.patterns.size}
  Most Matched: ${this.getMostMatchedPattern()?.name || 'N/A'}`;
  }

  private getMostMatchedPattern(): IntentPattern | null {
    let max = 0;
    let mostMatched: IntentPattern | null = null;

    for (const pattern of Array.from(this.patterns.values())) {
      if (pattern.matchCount > max) {
        max = pattern.matchCount;
        mostMatched = pattern;
      }
    }

    return mostMatched;
  }

  /* ================================ */
  /* LIFECYCLE                        */
  /* ================================ */

  public clear(): void {
    this.currentIntent = null;
    this.intentHistory = [];
    this.learnedStyle = null;

    // Reset pattern counts
    for (const pattern of Array.from(this.patterns.values())) {
      pattern.matchCount = 0;
    }
  }

  public export(): string {
    return JSON.stringify({
      config: this.config,
      currentIntent: this.currentIntent,
      intentHistory: this.intentHistory,
      learnedStyle: this.learnedStyle,
    });
  }

  public import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.config = parsed.config;
      this.currentIntent = parsed.currentIntent;
      this.intentHistory = parsed.intentHistory;
      this.learnedStyle = parsed.learnedStyle;
    } catch (error) {
      console.error('[IntentAwarenessLayer] Import failed:', error);
    }
  }
}
