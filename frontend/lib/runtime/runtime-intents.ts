import { updateRuntimeSnapshot } from './runtime-store';
import type { RuntimeIntent } from '@/lib/runtime/types';
import { recordRuntimeAudit } from './runtime-audit';

export function applyRuntimeIntent(intent: RuntimeIntent) {
  if (intent.type === 'SET_BOT_STATE') {
    updateRuntimeSnapshot((prev) => ({
      ...prev,
      bot: {
        ...prev.bot,
        state: intent.state,
        lastUpdateTs: Date.now()
      }
    }));

    recordRuntimeAudit({
      intent: intent.type,
      target: 'bot',
      value: intent.state,
      timestamp: Date.now(),
      source: intent.source ?? 'unknown'
    });
  }

  if (intent.type === 'SET_SAFE_MODE') {
    updateRuntimeSnapshot((prev) => ({
      ...prev,
      system: {
        ...prev.system,
        safeMode: intent.enabled
      }
    }));

    recordRuntimeAudit({
      intent: intent.type,
      target: 'system',
      value: intent.enabled ? 'enabled' : 'disabled',
      timestamp: Date.now(),
      source: intent.source ?? 'unknown'
    });
  }

  if (intent.type === 'SET_STRATEGY_STATE') {
    updateRuntimeSnapshot((prev) => {
      const nextStrategies = (prev.strategies ?? []).some((s) => s.id === intent.id)
        ? (prev.strategies ?? []).map((strategy) =>
            strategy.id === intent.id ? { ...strategy, enabled: intent.enabled } : strategy
          )
        : [...(prev.strategies ?? []), { id: intent.id, enabled: intent.enabled }];

      return {
        ...prev,
        strategies: nextStrategies
      };
    });

    recordRuntimeAudit({
      intent: intent.type,
      target: intent.id,
      value: intent.enabled ? 'enabled' : 'disabled',
      timestamp: Date.now(),
      source: intent.source ?? 'unknown'
    });
  }
}
