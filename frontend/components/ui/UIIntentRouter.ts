/**
 * ═══════════════════════════════════════════════════════════════════
 * LEVEL 16.6: UI INTENT ROUTER
 * ═══════════════════════════════════════════════════════════════════
 * Context-aware user interaction routing system.
 * Classifies user intents and routes to appropriate handlers.
 * 
 * SAFETY: Routing only, no autonomous execution
 * PURPOSE: Intelligent UI interaction for dashboards
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type IntentType =
  | 'navigation'
  | 'inspection'
  | 'configuration'
  | 'visualization'
  | 'export'
  | 'search'
  | 'command'
  | 'unknown';

export type InteractionType =
  | 'click'
  | 'double-click'
  | 'right-click'
  | 'hover'
  | 'drag'
  | 'scroll'
  | 'key-press'
  | 'gesture';

export interface UIContext {
  component: string;
  route: string;
  viewport: {
    width: number;
    height: number;
    size: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
  };
  focus: string | null;
  modalStack: string[];
  userRole: 'admin' | 'viewer' | 'guest';
}

export interface UserInteraction {
  type: InteractionType;
  timestamp: number;
  target: string;
  targetType: 'button' | 'panel' | 'chart' | 'input' | 'link' | 'other';
  coordinates?: { x: number; y: number };
  modifiers?: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
  metadata?: Record<string, any>;
}

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  action: string;
  parameters: Record<string, any>;
  suggestedRoute?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface IntentHandler {
  type: IntentType;
  pattern: RegExp | string;
  handler: (intent: ClassifiedIntent, context: UIContext) => void | Promise<void>;
  priority: number;
}

export interface RouterConfig {
  enableContextTracking: boolean;
  enableIntentLogging: boolean;
  debounceMs: number;
  maxHistorySize: number;
}

// ─────────────────────────────────────────────────────────────────
// UI INTENT ROUTER CLASS
// ─────────────────────────────────────────────────────────────────

export class UIIntentRouter {
  private config: RouterConfig;
  private context: UIContext;
  private handlers: Map<IntentType, IntentHandler[]>;
  private interactionHistory: UserInteraction[];
  private intentHistory: ClassifiedIntent[];
  private debounceTimers: Map<string, NodeJS.Timeout>;

  constructor(config?: Partial<RouterConfig>) {
    this.config = {
      enableContextTracking: true,
      enableIntentLogging: true,
      debounceMs: 100,
      maxHistorySize: 100,
      ...config
    };

    this.context = this.initializeContext();
    this.handlers = new Map();
    this.interactionHistory = [];
    this.intentHistory = [];
    this.debounceTimers = new Map();

    this.registerDefaultHandlers();
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────

  private initializeContext(): UIContext {
    return {
      component: 'dashboard',
      route: '/',
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        size: 'desktop'
      },
      focus: null,
      modalStack: [],
      userRole: 'viewer'
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CONTEXT MANAGEMENT
  // ─────────────────────────────────────────────────────────────

  updateContext(updates: Partial<UIContext>): void {
    this.context = { ...this.context, ...updates };
    
    if (this.config.enableContextTracking) {
      console.log('[INTENT ROUTER] Context updated:', updates);
    }
  }

  getContext(): UIContext {
    return { ...this.context };
  }

  // ─────────────────────────────────────────────────────────────
  // INTERACTION PROCESSING
  // ─────────────────────────────────────────────────────────────

  processInteraction(interaction: UserInteraction): ClassifiedIntent {
    // Record interaction
    this.interactionHistory.push(interaction);
    if (this.interactionHistory.length > this.config.maxHistorySize) {
      this.interactionHistory.shift();
    }

    // Classify intent
    const intent = this.classifyIntent(interaction);

    // Record intent
    this.intentHistory.push(intent);
    if (this.intentHistory.length > this.config.maxHistorySize) {
      this.intentHistory.shift();
    }

    if (this.config.enableIntentLogging) {
      console.log('[INTENT ROUTER] Classified intent:', intent);
    }

    // Route to handler
    this.routeIntent(intent);

    return intent;
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT CLASSIFICATION
  // ─────────────────────────────────────────────────────────────

  private classifyIntent(interaction: UserInteraction): ClassifiedIntent {
    const { type, target, targetType, modifiers } = interaction;

    // Navigation intent
    if (targetType === 'link' || target.includes('nav') || target.includes('menu')) {
      return {
        type: 'navigation',
        confidence: 0.9,
        action: 'navigate',
        parameters: { target },
        priority: 'normal'
      };
    }

    // Inspection intent (hover, right-click on data)
    if (
      type === 'hover' ||
      (type === 'right-click' && (targetType === 'chart' || targetType === 'panel'))
    ) {
      return {
        type: 'inspection',
        confidence: 0.85,
        action: 'inspect',
        parameters: { target },
        priority: 'low'
      };
    }

    // Configuration intent (click on settings, config)
    if (target.includes('settings') || target.includes('config')) {
      return {
        type: 'configuration',
        confidence: 0.9,
        action: 'configure',
        parameters: { target },
        priority: 'normal'
      };
    }

    // Visualization intent (chart interactions)
    if (targetType === 'chart' && type === 'click') {
      return {
        type: 'visualization',
        confidence: 0.8,
        action: 'toggle_view',
        parameters: { target },
        priority: 'normal'
      };
    }

    // Export intent (ctrl/cmd + E or export button)
    if (
      (modifiers?.ctrl || modifiers?.meta) &&
      target.includes('export')
    ) {
      return {
        type: 'export',
        confidence: 0.95,
        action: 'export_data',
        parameters: { target },
        priority: 'high'
      };
    }

    // Search intent (input focus, ctrl/cmd + F)
    if (
      targetType === 'input' ||
      ((modifiers?.ctrl || modifiers?.meta) && target.includes('search'))
    ) {
      return {
        type: 'search',
        confidence: 0.9,
        action: 'search',
        parameters: { target },
        priority: 'normal'
      };
    }

    // Command intent (keyboard shortcuts)
    if (type === 'key-press' && (modifiers?.ctrl || modifiers?.meta)) {
      return {
        type: 'command',
        confidence: 0.85,
        action: 'execute_command',
        parameters: { target },
        priority: 'high'
      };
    }

    // Unknown intent (fallback)
    return {
      type: 'unknown',
      confidence: 0.5,
      action: 'none',
      parameters: { interaction },
      priority: 'low'
    };
  }

  // ─────────────────────────────────────────────────────────────
  // INTENT ROUTING
  // ─────────────────────────────────────────────────────────────

  private routeIntent(intent: ClassifiedIntent): void {
    const handlers = this.handlers.get(intent.type) || [];
    
    // Sort by priority
    const sortedHandlers = [...handlers].sort((a, b) => b.priority - a.priority);

    // Execute handlers
    for (const handler of sortedHandlers) {
      try {
        const result = handler.handler(intent, this.context);
        
        // Handle async handlers
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`[INTENT ROUTER] Async handler error:`, error);
          });
        }
      } catch (error) {
        console.error(`[INTENT ROUTER] Handler error:`, error);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HANDLER REGISTRATION
  // ─────────────────────────────────────────────────────────────

  registerHandler(handler: IntentHandler): void {
    const existing = this.handlers.get(handler.type) || [];
    this.handlers.set(handler.type, [...existing, handler]);

    console.log(`[INTENT ROUTER] Registered handler for ${handler.type}`);
  }

  unregisterHandler(type: IntentType, pattern: RegExp | string): void {
    const handlers = this.handlers.get(type) || [];
    const filtered = handlers.filter(h => h.pattern !== pattern);
    this.handlers.set(type, filtered);
  }

  // ─────────────────────────────────────────────────────────────
  // DEFAULT HANDLERS
  // ─────────────────────────────────────────────────────────────

  private registerDefaultHandlers(): void {
    // Navigation handler
    this.registerHandler({
      type: 'navigation',
      pattern: '*',
      priority: 5,
      handler: (intent, context) => {
        console.log('[INTENT ROUTER] Navigation:', intent.parameters.target);
        // Emit event for routing system
        window.dispatchEvent(new CustomEvent('bagbot:navigate', {
          detail: intent.parameters
        }));
      }
    });

    // Inspection handler
    this.registerHandler({
      type: 'inspection',
      pattern: '*',
      priority: 5,
      handler: (intent, context) => {
        console.log('[INTENT ROUTER] Inspection:', intent.parameters.target);
        // Emit event for inspection panel
        window.dispatchEvent(new CustomEvent('bagbot:inspect', {
          detail: intent.parameters
        }));
      }
    });

    // Configuration handler
    this.registerHandler({
      type: 'configuration',
      pattern: '*',
      priority: 5,
      handler: (intent, context) => {
        console.log('[INTENT ROUTER] Configuration:', intent.parameters.target);
        // Emit event for settings modal
        window.dispatchEvent(new CustomEvent('bagbot:configure', {
          detail: intent.parameters
        }));
      }
    });

    // Visualization handler
    this.registerHandler({
      type: 'visualization',
      pattern: '*',
      priority: 5,
      handler: (intent, context) => {
        console.log('[INTENT ROUTER] Visualization:', intent.parameters.target);
        // Emit event for visualization system
        window.dispatchEvent(new CustomEvent('bagbot:visualize', {
          detail: intent.parameters
        }));
      }
    });

    // Export handler
    this.registerHandler({
      type: 'export',
      pattern: '*',
      priority: 10,
      handler: async (intent, context) => {
        console.log('[INTENT ROUTER] Export:', intent.parameters.target);
        // Emit event for export system
        window.dispatchEvent(new CustomEvent('bagbot:export', {
          detail: intent.parameters
        }));
      }
    });

    // Search handler
    this.registerHandler({
      type: 'search',
      pattern: '*',
      priority: 5,
      handler: (intent, context) => {
        console.log('[INTENT ROUTER] Search:', intent.parameters.target);
        // Emit event for search system
        window.dispatchEvent(new CustomEvent('bagbot:search', {
          detail: intent.parameters
        }));
      }
    });

    // Command handler
    this.registerHandler({
      type: 'command',
      pattern: '*',
      priority: 10,
      handler: (intent, context) => {
        console.log('[INTENT ROUTER] Command:', intent.parameters.target);
        // Emit event for command palette
        window.dispatchEvent(new CustomEvent('bagbot:command', {
          detail: intent.parameters
        }));
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // DEBOUNCING
  // ─────────────────────────────────────────────────────────────

  processDebounced(
    key: string,
    interaction: UserInteraction,
    delay?: number
  ): void {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.processInteraction(interaction);
      this.debounceTimers.delete(key);
    }, delay || this.config.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  // ─────────────────────────────────────────────────────────────
  // HISTORY & ANALYTICS
  // ─────────────────────────────────────────────────────────────

  getInteractionHistory(limit?: number): UserInteraction[] {
    const history = [...this.interactionHistory];
    return limit ? history.slice(-limit) : history;
  }

  getIntentHistory(limit?: number): ClassifiedIntent[] {
    const history = [...this.intentHistory];
    return limit ? history.slice(-limit) : history;
  }

  getIntentStats(): {
    total: number;
    byType: Record<IntentType, number>;
    avgConfidence: number;
  } {
    const byType: Record<IntentType, number> = {
      navigation: 0,
      inspection: 0,
      configuration: 0,
      visualization: 0,
      export: 0,
      search: 0,
      command: 0,
      unknown: 0
    };

    let totalConfidence = 0;

    this.intentHistory.forEach(intent => {
      byType[intent.type]++;
      totalConfidence += intent.confidence;
    });

    return {
      total: this.intentHistory.length,
      byType,
      avgConfidence: this.intentHistory.length > 0
        ? totalConfidence / this.intentHistory.length
        : 0
    };
  }

  // ─────────────────────────────────────────────────────────────
  // PATTERN MATCHING
  // ─────────────────────────────────────────────────────────────

  detectPattern(): {
    commonActions: string[];
    frequentTargets: string[];
    timeDistribution: Record<string, number>;
  } {
    const actionCounts: Record<string, number> = {};
    const targetCounts: Record<string, number> = {};
    const hourCounts: Record<string, number> = {};

    this.interactionHistory.forEach(interaction => {
      // Count actions
      actionCounts[interaction.type] = (actionCounts[interaction.type] || 0) + 1;
      
      // Count targets
      targetCounts[interaction.target] = (targetCounts[interaction.target] || 0) + 1;
      
      // Count by hour
      const hour = new Date(interaction.timestamp).getHours().toString();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const commonActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action]) => action);

    const frequentTargets = Object.entries(targetCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([target]) => target);

    return {
      commonActions,
      frequentTargets,
      timeDistribution: hourCounts
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CLEANUP
  // ─────────────────────────────────────────────────────────────

  clearHistory(): void {
    this.interactionHistory = [];
    this.intentHistory = [];
  }

  destroy(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.handlers.clear();
    this.clearHistory();

    console.log('[INTENT ROUTER] Destroyed');
  }
}

// ─────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────

let routerInstance: UIIntentRouter | null = null;

export function getIntentRouter(config?: Partial<RouterConfig>): UIIntentRouter {
  if (!routerInstance) {
    routerInstance = new UIIntentRouter(config);
  }
  return routerInstance;
}

export function destroyIntentRouter(): void {
  if (routerInstance) {
    routerInstance.destroy();
    routerInstance = null;
  }
}

// ─────────────────────────────────────────────────────────────────
// REACT HOOKS
// ─────────────────────────────────────────────────────────────────

import { useEffect, useCallback } from 'react';

export function useIntentRouter() {
  const router = getIntentRouter();

  const recordClick = useCallback((target: string, targetType: UserInteraction['targetType'] = 'other') => {
    router.processInteraction({
      type: 'click',
      timestamp: Date.now(),
      target,
      targetType
    });
  }, [router]);

  const recordHover = useCallback((target: string, targetType: UserInteraction['targetType'] = 'other') => {
    router.processDebounced(`hover-${target}`, {
      type: 'hover',
      timestamp: Date.now(),
      target,
      targetType
    }, 300);
  }, [router]);

  return {
    router,
    recordClick,
    recordHover
  };
}
