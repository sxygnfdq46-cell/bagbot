/**
 * ═══════════════════════════════════════════════════════════════════
 * EXECUTION SHIELD — Level 18.4
 * ═══════════════════════════════════════════════════════════════════
 * Pre-gate command filter that protects BagBot from:
 * - Unsafe command execution
 * - Conflicting operations
 * - High-risk operations without confirmation
 * - Command injection attacks
 * - Resource exhaustion
 * 
 * Integration:
 * - Reports to ShieldCore (Level 18.1)
 * - Feeds diagnostics to Admin Panel (Level 17)
 * - Connects to Decision Engine
 * 
 * Safety: Manual confirmation required for high-risk operations
 * ═══════════════════════════════════════════════════════════════════
 */

import { getShieldCore, type ThreatLevel } from './ShieldCore';

// ─────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────

export type CommandRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type CommandCategory = 
  | 'trade'
  | 'financial'
  | 'system'
  | 'data'
  | 'api'
  | 'config'
  | 'auth'
  | 'external';

export type ValidationResult = 
  | 'approved'
  | 'rejected'
  | 'requires_confirmation'
  | 'blocked'
  | 'queued';

export interface Command {
  id: string;
  timestamp: number;
  category: CommandCategory;
  action: string;
  parameters: Record<string, any>;
  source: string;
  userId?: string;
  riskLevel?: CommandRiskLevel;
}

export interface CommandValidation {
  commandId: string;
  result: ValidationResult;
  riskLevel: CommandRiskLevel;
  reason: string;
  blockedBy?: string[];
  conflictsWith?: string[];
  requiresConfirmation: boolean;
  validatedAt: number;
  expiresAt?: number;
}

export interface CommandRule {
  id: string;
  name: string;
  category: CommandCategory;
  pattern: RegExp | string;
  riskLevel: CommandRiskLevel;
  requiresConfirmation: boolean;
  blocklist?: boolean;
  safelist?: boolean;
  conditions?: Array<(cmd: Command) => boolean>;
  message?: string;
}

export interface ConflictRule {
  id: string;
  name: string;
  categories: CommandCategory[];
  actions: string[];
  maxConcurrent: number;
  cooldownMs: number;
  message: string;
}

export interface ExecutionShieldConfig {
  enabled: boolean;
  strictMode: boolean; // Reject ambiguous commands
  autoApprove: {
    enabled: boolean;
    safeOnly: boolean;
    lowRiskAllowed: boolean;
  };
  confirmation: {
    required: boolean;
    timeoutMs: number; // 1 hour default
    maxPending: number;
  };
  rateLimit: {
    enabled: boolean;
    maxPerMinute: number;
    maxPerHour: number;
    burstSize: number;
  };
  validation: {
    checkSafelist: boolean;
    checkBlocklist: boolean;
    checkConflicts: boolean;
    checkRateLimit: boolean;
  };
}

export interface ExecutionShieldStatus {
  active: boolean;
  strictMode: boolean;
  commandsProcessed: number;
  commandsApproved: number;
  commandsRejected: number;
  commandsBlocked: number;
  pendingConfirmations: number;
  activeCommands: number;
  lastCheck: number;
}

export interface ExecutionMetrics {
  totalCommands: number;
  approved: number;
  rejected: number;
  blocked: number;
  requireConfirmation: number;
  byRiskLevel: Record<CommandRiskLevel, number>;
  byCategory: Record<CommandCategory, number>;
  conflictsDetected: number;
  rateLimitHits: number;
  averageProcessingTime: number;
  threatsByType: {
    unsafe: number;
    conflict: number;
    rateLimit: number;
    injection: number;
  };
}

export interface PendingConfirmation {
  commandId: string;
  command: Command;
  validation: CommandValidation;
  createdAt: number;
  expiresAt: number;
  onApprove?: (cmd: Command) => void;
  onReject?: (cmd: Command) => void;
}

// ─────────────────────────────────────────────────────────────────
// EXECUTION SHIELD CLASS
// ─────────────────────────────────────────────────────────────────

export class ExecutionShield {
  private config: ExecutionShieldConfig;
  private status: ExecutionShieldStatus;
  private metrics: ExecutionMetrics;
  private rules: Map<string, CommandRule>;
  private conflicts: Map<string, ConflictRule>;
  private safelist: Set<string>;
  private blocklist: Set<string>;
  private activeCommands: Map<string, Command>;
  private pendingConfirmations: Map<string, PendingConfirmation>;
  private commandHistory: Command[];
  private rateLimitCounter: { perMinute: number[]; perHour: number[] };
  private shieldCore: ReturnType<typeof getShieldCore>;
  private isInitialized: boolean;

  constructor(config?: Partial<ExecutionShieldConfig>) {
    this.config = {
      enabled: true,
      strictMode: true,
      autoApprove: {
        enabled: true,
        safeOnly: true,
        lowRiskAllowed: false
      },
      confirmation: {
        required: true,
        timeoutMs: 3600000, // 1 hour
        maxPending: 10
      },
      rateLimit: {
        enabled: true,
        maxPerMinute: 60,
        maxPerHour: 1000,
        burstSize: 10
      },
      validation: {
        checkSafelist: true,
        checkBlocklist: true,
        checkConflicts: true,
        checkRateLimit: true
      },
      ...config
    };

    this.status = {
      active: false,
      strictMode: this.config.strictMode,
      commandsProcessed: 0,
      commandsApproved: 0,
      commandsRejected: 0,
      commandsBlocked: 0,
      pendingConfirmations: 0,
      activeCommands: 0,
      lastCheck: Date.now()
    };

    this.metrics = {
      totalCommands: 0,
      approved: 0,
      rejected: 0,
      blocked: 0,
      requireConfirmation: 0,
      byRiskLevel: {
        safe: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byCategory: {
        trade: 0,
        financial: 0,
        system: 0,
        data: 0,
        api: 0,
        config: 0,
        auth: 0,
        external: 0
      },
      conflictsDetected: 0,
      rateLimitHits: 0,
      averageProcessingTime: 0,
      threatsByType: {
        unsafe: 0,
        conflict: 0,
        rateLimit: 0,
        injection: 0
      }
    };

    this.rules = new Map();
    this.conflicts = new Map();
    this.safelist = new Set();
    this.blocklist = new Set();
    this.activeCommands = new Map();
    this.pendingConfirmations = new Map();
    this.commandHistory = [];
    this.rateLimitCounter = { perMinute: [], perHour: [] };
    this.shieldCore = getShieldCore();
    this.isInitialized = false;

    // Initialize default rules
    this.initializeDefaultRules();
    this.initializeConflictRules();
    this.initializeBlocklist();
    this.initializeSafelist();
  }

  /**
   * Initialize default command rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: CommandRule[] = [
      // CRITICAL RISK COMMANDS
      {
        id: 'trade_large_position',
        name: 'Large Position Trade',
        category: 'trade',
        pattern: /trade|order|position/i,
        riskLevel: 'critical',
        requiresConfirmation: true,
        conditions: [(cmd) => {
          const amount = cmd.parameters.amount || cmd.parameters.size || 0;
          return amount > 10000; // > $10k
        }],
        message: 'Large position trade requires manual confirmation'
      },
      {
        id: 'system_shutdown',
        name: 'System Shutdown',
        category: 'system',
        pattern: /shutdown|terminate|kill|stop_all/i,
        riskLevel: 'critical',
        requiresConfirmation: true,
        message: 'System shutdown requires manual confirmation'
      },
      {
        id: 'data_deletion',
        name: 'Data Deletion',
        category: 'data',
        pattern: /delete|remove|purge|drop/i,
        riskLevel: 'critical',
        requiresConfirmation: true,
        message: 'Data deletion requires manual confirmation'
      },

      // HIGH RISK COMMANDS
      {
        id: 'config_change',
        name: 'Configuration Change',
        category: 'config',
        pattern: /config|settings|update_config/i,
        riskLevel: 'high',
        requiresConfirmation: true,
        message: 'Configuration changes require confirmation'
      },
      {
        id: 'api_key_rotation',
        name: 'API Key Rotation',
        category: 'auth',
        pattern: /rotate|update_key|change_key/i,
        riskLevel: 'high',
        requiresConfirmation: true,
        message: 'API key changes require confirmation'
      },
      {
        id: 'external_api_call',
        name: 'External API Call',
        category: 'external',
        pattern: /external|webhook|http|fetch/i,
        riskLevel: 'high',
        requiresConfirmation: false,
        message: 'External API calls are monitored'
      },

      // MEDIUM RISK COMMANDS
      {
        id: 'moderate_trade',
        name: 'Moderate Trade',
        category: 'trade',
        pattern: /trade|order|position/i,
        riskLevel: 'medium',
        requiresConfirmation: false,
        conditions: [(cmd) => {
          const amount = cmd.parameters.amount || cmd.parameters.size || 0;
          return amount > 1000 && amount <= 10000;
        }],
        message: 'Moderate trade executed with monitoring'
      },
      {
        id: 'financial_query',
        name: 'Financial Query',
        category: 'financial',
        pattern: /balance|portfolio|positions|account/i,
        riskLevel: 'medium',
        requiresConfirmation: false,
        message: 'Financial data access'
      },

      // LOW RISK COMMANDS
      {
        id: 'market_data',
        name: 'Market Data Query',
        category: 'data',
        pattern: /price|ticker|market|quote/i,
        riskLevel: 'low',
        requiresConfirmation: false,
        message: 'Market data query'
      },
      {
        id: 'status_check',
        name: 'Status Check',
        category: 'system',
        pattern: /status|health|ping|info/i,
        riskLevel: 'safe',
        requiresConfirmation: false,
        message: 'Status check'
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
    console.log(`[ExecutionShield] Loaded ${defaultRules.length} default rules`);
  }

  /**
   * Initialize conflict rules
   */
  private initializeConflictRules(): void {
    const conflictRules: ConflictRule[] = [
      {
        id: 'concurrent_trades',
        name: 'Concurrent Trades',
        categories: ['trade'],
        actions: ['buy', 'sell', 'order'],
        maxConcurrent: 3,
        cooldownMs: 1000,
        message: 'Too many concurrent trades - wait for completion'
      },
      {
        id: 'config_operations',
        name: 'Configuration Operations',
        categories: ['config', 'system'],
        actions: ['update', 'change', 'modify'],
        maxConcurrent: 1,
        cooldownMs: 5000,
        message: 'Configuration changes must be sequential'
      },
      {
        id: 'data_operations',
        name: 'Data Operations',
        categories: ['data'],
        actions: ['delete', 'drop', 'purge', 'clear'],
        maxConcurrent: 1,
        cooldownMs: 10000,
        message: 'Data operations must be sequential with cooldown'
      }
    ];

    conflictRules.forEach(rule => this.conflicts.set(rule.id, rule));
    console.log(`[ExecutionShield] Loaded ${conflictRules.length} conflict rules`);
  }

  /**
   * Initialize blocklist (dangerous patterns)
   */
  private initializeBlocklist(): void {
    const blocked = [
      'eval',
      'exec',
      '__import__',
      'subprocess',
      'rm -rf',
      'DROP TABLE',
      'DELETE FROM',
      '; --',
      '|| ',
      '&& ',
      '$()',
      '`'
    ];

    blocked.forEach(pattern => this.blocklist.add(pattern.toLowerCase()));
    console.log(`[ExecutionShield] Loaded ${blocked.length} blocklist patterns`);
  }

  /**
   * Initialize safelist (known safe commands)
   */
  private initializeSafelist(): void {
    const safe = [
      'status',
      'health',
      'info',
      'version',
      'help',
      'list',
      'get',
      'read',
      'view',
      'show',
      'display'
    ];

    safe.forEach(cmd => this.safelist.add(cmd.toLowerCase()));
    console.log(`[ExecutionShield] Loaded ${safe.length} safelist patterns`);
  }

  /**
   * Initialize the execution shield
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('[ExecutionShield] Already initialized');
      return;
    }

    console.log('[ExecutionShield] Initializing command protection...');

    this.status.active = this.config.enabled;

    // Start confirmation cleanup timer
    setInterval(() => {
      this.cleanupExpiredConfirmations();
    }, 60000); // Check every minute

    // Start rate limit reset timer
    setInterval(() => {
      this.resetRateLimitCounters();
    }, 60000); // Reset every minute

    this.isInitialized = true;
    console.log('[ExecutionShield] Execution shield ONLINE ✓');
  }

  /**
   * Validate a command
   */
  async validateCommand(command: Command): Promise<CommandValidation> {
    const startTime = performance.now();

    this.status.commandsProcessed++;
    this.metrics.totalCommands++;
    this.status.lastCheck = Date.now();

    // Assign command ID if not present
    if (!command.id) {
      command.id = this.generateCommandId();
    }

    console.log(`[ExecutionShield] Validating command: ${command.action}`);

    // Step 1: Check blocklist
    if (this.config.validation.checkBlocklist && this.isBlocked(command)) {
      const validation = this.createValidation(command, 'blocked', 'critical', 
        'Command contains blocked patterns');
      
      this.status.commandsBlocked++;
      this.metrics.blocked++;
      this.metrics.threatsByType.injection++;
      
      this.reportThreat(4, 'Blocked command attempt', command, validation);
      
      this.updateProcessingTime(performance.now() - startTime);
      return validation;
    }

    // Step 2: Check safelist (auto-approve if safe)
    if (this.config.validation.checkSafelist && this.isSafelist(command)) {
      const validation = this.createValidation(command, 'approved', 'safe',
        'Command is on safelist');
      
      this.status.commandsApproved++;
      this.metrics.approved++;
      this.metrics.byRiskLevel.safe++;
      
      this.updateProcessingTime(performance.now() - startTime);
      return validation;
    }

    // Step 3: Check rate limits
    if (this.config.validation.checkRateLimit && this.isRateLimited()) {
      const validation = this.createValidation(command, 'rejected', 'high',
        'Rate limit exceeded');
      
      this.status.commandsRejected++;
      this.metrics.rejected++;
      this.metrics.rateLimitHits++;
      this.metrics.threatsByType.rateLimit++;
      
      this.reportThreat(3, 'Rate limit exceeded', command, validation);
      
      this.updateProcessingTime(performance.now() - startTime);
      return validation;
    }

    // Step 4: Determine risk level
    const riskLevel = this.assessRisk(command);
    command.riskLevel = riskLevel;
    this.metrics.byRiskLevel[riskLevel]++;
    this.metrics.byCategory[command.category]++;

    // Step 5: Check conflicts
    if (this.config.validation.checkConflicts) {
      const conflicts = this.checkConflicts(command);
      if (conflicts.length > 0) {
        const validation = this.createValidation(command, 'rejected', riskLevel,
          'Command conflicts with active operations', conflicts);
        
        this.status.commandsRejected++;
        this.metrics.rejected++;
        this.metrics.conflictsDetected++;
        this.metrics.threatsByType.conflict++;
        
        this.reportThreat(3, 'Command conflict detected', command, validation);
        
        this.updateProcessingTime(performance.now() - startTime);
        return validation;
      }
    }

    // Step 6: Check if confirmation required
    const requiresConfirmation = this.requiresConfirmation(command, riskLevel);

    if (requiresConfirmation) {
      const validation = this.createValidation(command, 'requires_confirmation', riskLevel,
        'Command requires manual confirmation');
      validation.requiresConfirmation = true;
      validation.expiresAt = Date.now() + this.config.confirmation.timeoutMs;
      
      this.metrics.requireConfirmation++;
      
      // Add to pending confirmations
      this.addPendingConfirmation(command, validation);
      
      this.updateProcessingTime(performance.now() - startTime);
      return validation;
    }

    // Step 7: Auto-approve if allowed
    if (this.canAutoApprove(command, riskLevel)) {
      const validation = this.createValidation(command, 'approved', riskLevel,
        'Command auto-approved');
      
      this.status.commandsApproved++;
      this.metrics.approved++;
      
      // Track active command
      this.activeCommands.set(command.id, command);
      
      this.updateProcessingTime(performance.now() - startTime);
      return validation;
    }

    // Step 8: Reject in strict mode or queue for review
    const result = this.config.strictMode ? 'rejected' : 'queued';
    const validation = this.createValidation(command, result, riskLevel,
      this.config.strictMode ? 'Rejected in strict mode' : 'Queued for review');
    
    if (result === 'rejected') {
      this.status.commandsRejected++;
      this.metrics.rejected++;
      this.metrics.threatsByType.unsafe++;
      this.reportThreat(2, 'Command rejected in strict mode', command, validation);
    }

    this.updateProcessingTime(performance.now() - startTime);
    return validation;
  }

  /**
   * Check if command is blocked
   */
  private isBlocked(command: Command): boolean {
    const actionLower = command.action.toLowerCase();
    const paramsStr = JSON.stringify(command.parameters).toLowerCase();

    for (const pattern of this.blocklist) {
      if (actionLower.includes(pattern) || paramsStr.includes(pattern)) {
        console.warn(`[ExecutionShield] Blocked pattern detected: ${pattern}`);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if command is on safelist
   */
  private isSafelist(command: Command): boolean {
    const actionLower = command.action.toLowerCase();
    return this.safelist.has(actionLower);
  }

  /**
   * Check rate limits
   */
  private isRateLimited(): boolean {
    if (!this.config.rateLimit.enabled) {
      return false;
    }

    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    // Clean old entries
    this.rateLimitCounter.perMinute = this.rateLimitCounter.perMinute.filter(t => t > minuteAgo);
    this.rateLimitCounter.perHour = this.rateLimitCounter.perHour.filter(t => t > hourAgo);

    // Check limits
    const perMinute = this.rateLimitCounter.perMinute.length;
    const perHour = this.rateLimitCounter.perHour.length;

    if (perMinute >= this.config.rateLimit.maxPerMinute) {
      console.warn(`[ExecutionShield] Rate limit: ${perMinute} commands/minute`);
      return true;
    }

    if (perHour >= this.config.rateLimit.maxPerHour) {
      console.warn(`[ExecutionShield] Rate limit: ${perHour} commands/hour`);
      return true;
    }

    // Add to counters
    this.rateLimitCounter.perMinute.push(now);
    this.rateLimitCounter.perHour.push(now);

    return false;
  }

  /**
   * Assess command risk level
   */
  private assessRisk(command: Command): CommandRiskLevel {
    // Check rules
    for (const rule of this.rules.values()) {
      if (rule.category !== command.category) continue;

      let matches = false;

      if (typeof rule.pattern === 'string') {
        matches = command.action.toLowerCase().includes(rule.pattern.toLowerCase());
      } else {
        matches = rule.pattern.test(command.action);
      }

      if (matches) {
        // Check additional conditions
        if (rule.conditions && rule.conditions.length > 0) {
          const allConditionsMet = rule.conditions.every(cond => cond(command));
          if (allConditionsMet) {
            return rule.riskLevel;
          }
        } else {
          return rule.riskLevel;
        }
      }
    }

    // Default risk based on category
    switch (command.category) {
      case 'trade': return 'medium';
      case 'financial': return 'medium';
      case 'system': return 'high';
      case 'data': return 'medium';
      case 'config': return 'high';
      case 'auth': return 'critical';
      case 'external': return 'high';
      default: return 'low';
    }
  }

  /**
   * Check for command conflicts
   */
  private checkConflicts(command: Command): string[] {
    const conflicts: string[] = [];

    for (const rule of this.conflicts.values()) {
      if (!rule.categories.includes(command.category)) continue;

      // Check if action matches
      const actionMatches = rule.actions.some(action => 
        command.action.toLowerCase().includes(action.toLowerCase())
      );

      if (!actionMatches) continue;

      // Count active commands in same category
      const activeInCategory = Array.from(this.activeCommands.values()).filter(cmd =>
        rule.categories.includes(cmd.category) &&
        rule.actions.some(action => cmd.action.toLowerCase().includes(action.toLowerCase()))
      );

      if (activeInCategory.length >= rule.maxConcurrent) {
        conflicts.push(rule.id);
        console.warn(`[ExecutionShield] Conflict: ${rule.message}`);
      }
    }

    return conflicts;
  }

  /**
   * Check if confirmation required
   */
  private requiresConfirmation(command: Command, riskLevel: CommandRiskLevel): boolean {
    if (!this.config.confirmation.required) {
      return false;
    }

    // Check if pending confirmations limit reached
    if (this.pendingConfirmations.size >= this.config.confirmation.maxPending) {
      return false; // Will be rejected instead
    }

    // High-risk and critical always require confirmation
    if (riskLevel === 'high' || riskLevel === 'critical') {
      return true;
    }

    // Check rule-specific requirements
    for (const rule of this.rules.values()) {
      if (rule.category === command.category && rule.requiresConfirmation) {
        if (typeof rule.pattern === 'string') {
          if (command.action.toLowerCase().includes(rule.pattern.toLowerCase())) {
            return true;
          }
        } else if (rule.pattern.test(command.action)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if command can be auto-approved
   */
  private canAutoApprove(command: Command, riskLevel: CommandRiskLevel): boolean {
    if (!this.config.autoApprove.enabled) {
      return false;
    }

    if (this.config.autoApprove.safeOnly && riskLevel !== 'safe') {
      return false;
    }

    if (!this.config.autoApprove.lowRiskAllowed && 
        (riskLevel !== 'safe' && riskLevel !== 'low')) {
      return false;
    }

    return riskLevel === 'safe' || riskLevel === 'low';
  }

  /**
   * Create validation result
   */
  private createValidation(
    command: Command,
    result: ValidationResult,
    riskLevel: CommandRiskLevel,
    reason: string,
    conflictsWith?: string[]
  ): CommandValidation {
    return {
      commandId: command.id,
      result,
      riskLevel,
      reason,
      conflictsWith,
      requiresConfirmation: false,
      validatedAt: Date.now()
    };
  }

  /**
   * Add pending confirmation
   */
  private addPendingConfirmation(command: Command, validation: CommandValidation): void {
    const pending: PendingConfirmation = {
      commandId: command.id,
      command,
      validation,
      createdAt: Date.now(),
      expiresAt: validation.expiresAt!
    };

    this.pendingConfirmations.set(command.id, pending);
    this.status.pendingConfirmations = this.pendingConfirmations.size;

    console.log(`[ExecutionShield] Command queued for confirmation: ${command.id}`);
  }

  /**
   * Approve pending command
   */
  approveCommand(commandId: string): boolean {
    const pending = this.pendingConfirmations.get(commandId);
    
    if (!pending) {
      console.warn(`[ExecutionShield] Command not found: ${commandId}`);
      return false;
    }

    // Check if expired
    if (Date.now() > pending.expiresAt) {
      console.warn(`[ExecutionShield] Command expired: ${commandId}`);
      this.pendingConfirmations.delete(commandId);
      this.status.pendingConfirmations = this.pendingConfirmations.size;
      return false;
    }

    // Approve
    this.activeCommands.set(commandId, pending.command);
    this.pendingConfirmations.delete(commandId);
    this.status.pendingConfirmations = this.pendingConfirmations.size;
    this.status.commandsApproved++;
    this.metrics.approved++;

    console.log(`[ExecutionShield] Command approved: ${commandId}`);

    // Call callback if present
    if (pending.onApprove) {
      pending.onApprove(pending.command);
    }

    return true;
  }

  /**
   * Reject pending command
   */
  rejectCommand(commandId: string, reason?: string): boolean {
    const pending = this.pendingConfirmations.get(commandId);
    
    if (!pending) {
      console.warn(`[ExecutionShield] Command not found: ${commandId}`);
      return false;
    }

    // Reject
    this.pendingConfirmations.delete(commandId);
    this.status.pendingConfirmations = this.pendingConfirmations.size;
    this.status.commandsRejected++;
    this.metrics.rejected++;

    console.log(`[ExecutionShield] Command rejected: ${commandId}${reason ? ` - ${reason}` : ''}`);

    // Call callback if present
    if (pending.onReject) {
      pending.onReject(pending.command);
    }

    return true;
  }

  /**
   * Mark command as completed
   */
  completeCommand(commandId: string): void {
    if (this.activeCommands.has(commandId)) {
      const command = this.activeCommands.get(commandId)!;
      this.activeCommands.delete(commandId);
      this.status.activeCommands = this.activeCommands.size;

      // Add to history
      this.commandHistory.push(command);
      if (this.commandHistory.length > 100) {
        this.commandHistory = this.commandHistory.slice(-100);
      }

      console.log(`[ExecutionShield] Command completed: ${commandId}`);
    }
  }

  /**
   * Cleanup expired confirmations
   */
  private cleanupExpiredConfirmations(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, pending] of this.pendingConfirmations.entries()) {
      if (now > pending.expiresAt) {
        this.pendingConfirmations.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.status.pendingConfirmations = this.pendingConfirmations.size;
      console.log(`[ExecutionShield] Cleaned ${cleaned} expired confirmations`);
    }
  }

  /**
   * Reset rate limit counters
   */
  private resetRateLimitCounters(): void {
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    this.rateLimitCounter.perMinute = this.rateLimitCounter.perMinute.filter(t => t > minuteAgo);
    this.rateLimitCounter.perHour = this.rateLimitCounter.perHour.filter(t => t > hourAgo);
  }

  /**
   * Report threat to ShieldCore
   */
  private reportThreat(
    severity: ThreatLevel,
    message: string,
    command: Command,
    validation: CommandValidation
  ): void {
    this.shieldCore.reportThreat(
      'execution',
      severity,
      'ExecutionShield',
      message,
      { command, validation }
    );

    console.warn(`[ExecutionShield] THREAT: ${message}`);
  }

  /**
   * Update processing time metric
   */
  private updateProcessingTime(time: number): void {
    const total = this.metrics.totalCommands;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime * (total - 1) + time) / total;
  }

  /**
   * Generate command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add custom rule
   */
  addRule(rule: CommandRule): void {
    this.rules.set(rule.id, rule);
    console.log(`[ExecutionShield] Added rule: ${rule.name}`);
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      console.log(`[ExecutionShield] Removed rule: ${ruleId}`);
    }
    return removed;
  }

  /**
   * Add conflict rule
   */
  addConflictRule(rule: ConflictRule): void {
    this.conflicts.set(rule.id, rule);
    console.log(`[ExecutionShield] Added conflict rule: ${rule.name}`);
  }

  /**
   * Get status
   */
  getStatus(): ExecutionShieldStatus {
    return { ...this.status };
  }

  /**
   * Get metrics
   */
  getMetrics(): ExecutionMetrics {
    return { ...this.metrics };
  }

  /**
   * Get pending confirmations
   */
  getPendingConfirmations(): PendingConfirmation[] {
    return Array.from(this.pendingConfirmations.values());
  }

  /**
   * Get active commands
   */
  getActiveCommands(): Command[] {
    return Array.from(this.activeCommands.values());
  }

  /**
   * Get command history
   */
  getCommandHistory(): Command[] {
    return [...this.commandHistory];
  }

  /**
   * Get rules
   */
  getRules(): CommandRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ExecutionShieldConfig>): void {
    this.config = { ...this.config, ...config };
    this.status.strictMode = this.config.strictMode;
    console.log('[ExecutionShield] Configuration updated');
  }

  /**
   * Enable shield
   */
  enable(): void {
    this.config.enabled = true;
    this.status.active = true;
    console.log('[ExecutionShield] ENABLED');
  }

  /**
   * Disable shield
   */
  disable(): void {
    this.config.enabled = false;
    this.status.active = false;
    console.log('[ExecutionShield] DISABLED');
  }

  /**
   * Reset shield
   */
  reset(): void {
    console.log('[ExecutionShield] Resetting...');

    this.status.commandsProcessed = 0;
    this.status.commandsApproved = 0;
    this.status.commandsRejected = 0;
    this.status.commandsBlocked = 0;
    this.activeCommands.clear();
    this.pendingConfirmations.clear();
    this.commandHistory = [];
    this.rateLimitCounter = { perMinute: [], perHour: [] };

    Object.keys(this.metrics.byRiskLevel).forEach(key => {
      this.metrics.byRiskLevel[key as CommandRiskLevel] = 0;
    });
    Object.keys(this.metrics.byCategory).forEach(key => {
      this.metrics.byCategory[key as CommandCategory] = 0;
    });
    this.metrics.totalCommands = 0;
    this.metrics.approved = 0;
    this.metrics.rejected = 0;
    this.metrics.blocked = 0;

    console.log('[ExecutionShield] Reset complete');
  }

  /**
   * Dispose shield
   */
  dispose(): void {
    console.log('[ExecutionShield] Disposing...');

    this.activeCommands.clear();
    this.pendingConfirmations.clear();
    this.commandHistory = [];
    this.rules.clear();
    this.conflicts.clear();
    this.safelist.clear();
    this.blocklist.clear();
    this.isInitialized = false;

    console.log('[ExecutionShield] Disposed');
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    overall: 'healthy' | 'degraded' | 'critical';
    commandsProcessed: number;
    approvalRate: number;
    blockRate: number;
    pendingConfirmations: number;
  } {
    const total = this.status.commandsProcessed || 1;
    const approvalRate = (this.status.commandsApproved / total) * 100;
    const blockRate = (this.status.commandsBlocked / total) * 100;

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (blockRate > 10 || this.status.pendingConfirmations > 5) {
      overall = 'degraded';
    }
    if (blockRate > 20 || this.status.pendingConfirmations > 8) {
      overall = 'critical';
    }

    return {
      overall,
      commandsProcessed: this.status.commandsProcessed,
      approvalRate,
      blockRate,
      pendingConfirmations: this.status.pendingConfirmations
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let executionShieldInstance: ExecutionShield | null = null;

/**
 * Get global execution shield instance
 */
export function getExecutionShield(): ExecutionShield {
  if (!executionShieldInstance) {
    executionShieldInstance = new ExecutionShield();
    executionShieldInstance.initialize();
  }
  return executionShieldInstance;
}

/**
 * Initialize execution shield with custom config
 */
export function initializeExecutionShield(config?: Partial<ExecutionShieldConfig>): ExecutionShield {
  if (executionShieldInstance) {
    console.warn('[ExecutionShield] Already initialized, returning existing instance');
    return executionShieldInstance;
  }

  executionShieldInstance = new ExecutionShield(config);
  executionShieldInstance.initialize();
  return executionShieldInstance;
}

/**
 * Dispose global execution shield
 */
export function disposeExecutionShield(): void {
  if (executionShieldInstance) {
    executionShieldInstance.dispose();
    executionShieldInstance = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Get risk level color
 */
export function getRiskLevelColor(level: CommandRiskLevel): string {
  switch (level) {
    case 'safe': return '#10b981'; // green-500
    case 'low': return '#3b82f6'; // blue-500
    case 'medium': return '#f59e0b'; // amber-500
    case 'high': return '#f97316'; // orange-500
    case 'critical': return '#ef4444'; // red-500
  }
}

/**
 * Get validation result color
 */
export function getValidationResultColor(result: ValidationResult): string {
  switch (result) {
    case 'approved': return '#10b981'; // green-500
    case 'rejected': return '#ef4444'; // red-500
    case 'requires_confirmation': return '#f59e0b'; // amber-500
    case 'blocked': return '#991b1b'; // red-900
    case 'queued': return '#6366f1'; // indigo-500
  }
}

/**
 * Format validation result
 */
export function formatValidationResult(result: ValidationResult): string {
  switch (result) {
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'requires_confirmation': return 'Requires Confirmation';
    case 'blocked': return 'Blocked';
    case 'queued': return 'Queued';
  }
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

export default ExecutionShield;
