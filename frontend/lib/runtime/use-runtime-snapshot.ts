import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api/dashboard';
import { botApi } from '@/lib/api/bot';
import { adminApi, type AdminStrategy } from '@/lib/api/admin';
import { brainApi } from '@/lib/api/brain';
import { strategies as strategiesApi, type Strategy } from '@/lib/api/strategies';
import type { RuntimeSnapshot } from '@/shared/runtime/types';
import { getRuntimeSnapshot, subscribeRuntimeSnapshot, updateRuntimeSnapshot } from './runtime-store';

export function useRuntimeSnapshot() {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(getRuntimeSnapshot());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeRuntimeSnapshot((next) => {
      if (mounted) setSnapshot(next);
    });

    const load = async () => {
      try {
        const [systemStatus, systemHealth, botSnapshot, activityMap, decisions, strategiesList, adminStrategies] = await Promise.all([
          dashboardApi.getSystemStatus(),
          adminApi.getSystemHealth(),
          botApi.getSnapshot(),
          brainApi.getActivityMap(),
          brainApi.getRecentDecisions(),
          strategiesApi.list(),
          adminApi.getStrategies()
        ]);

        if (!mounted) return;

        const lastDecision = decisions?.decisions?.[0] ?? null;
        updateRuntimeSnapshot((prev) => {
          const derivedSafeMode = typeof prev.system.safeMode === 'boolean'
            ? prev.system.safeMode
            : systemHealth?.backendStatus === 'safe-mode' || systemHealth?.brainStatus === 'safe-mode'
              ? true
              : false;
          const nextBotState = prev.bot.state ?? (botSnapshot?.status ? botSnapshot.status.toUpperCase() as 'RUNNING' | 'STOPPED' | null : null);
          const nextBotLastUpdate = prev.bot.lastUpdateTs ?? (nextBotState ? Date.now() : null);
          const nextSnapshot: RuntimeSnapshot = {
            system: {
              ...prev.system,
              status: systemStatus,
              health: systemHealth
                ? {
                    backendStatus: systemHealth.backendStatus,
                    brainStatus: systemHealth.brainStatus,
                    cpuLoad: systemHealth.cpuLoad,
                    ramUsage: systemHealth.ramUsage,
                    uptime: systemHealth.uptime
                  }
                : prev.system.health ?? null,
              safeMode: derivedSafeMode
            },
            bot: {
              ...prev.bot,
              status: botSnapshot?.status ?? prev.bot.status ?? null,
              lastAction: botSnapshot?.lastAction ?? prev.bot.lastAction ?? null,
              health: botSnapshot?.health ?? prev.bot.health ?? null,
              state: nextBotState,
              lastUpdateTs: nextBotLastUpdate ?? null
            },
            brain: {
              ...prev.brain,
              status: activityMap?.status ?? prev.brain.status ?? null,
              lastDecision: lastDecision ?? prev.brain.lastDecision ?? null
            },
            strategies: mergeStrategies(prev.strategies, strategiesList, adminStrategies)
          };
          return nextSnapshot;
        });
      } catch (_error) {
        if (!mounted) return;
        setSnapshot((prev) => prev);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return { snapshot, loading };
}

function mergeStrategies(
  current: RuntimeSnapshot['strategies'],
  strategiesList: Strategy[],
  adminStrategies: AdminStrategy[]
): RuntimeSnapshot['strategies'] {
  const incoming = [...(strategiesList ?? []), ...(adminStrategies ?? [])];
  const nextMap = new Map<string, boolean>();

  current?.forEach((entry) => {
    nextMap.set(entry.id, entry.enabled);
  });

  incoming.forEach((entry) => {
    if (!nextMap.has(entry.id)) {
      nextMap.set(entry.id, Boolean((entry as any)?.enabled));
    }
  });

  return Array.from(nextMap.entries()).map(([id, enabled]) => ({ id, enabled }));
}
