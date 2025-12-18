'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { strategies as strategiesApi, type Strategy } from '@/lib/api/strategies';
import { useToast } from '@/components/ui/toast-provider';
import Tag from '@/components/ui/tag';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';
import MetricLabel from '@/components/ui/metric-label';
import TerminalShell from '@/components/ui/terminal-shell';
import { useRuntimeSnapshot } from '@/lib/runtime/use-runtime-snapshot';
import { applyRuntimeIntent } from '@/lib/runtime/runtime-intents';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { notify } = useToast();
  const { snapshot: runtimeSnapshot } = useRuntimeSnapshot();
  const safeMode = runtimeSnapshot.system.safeMode === true;

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const data = await strategiesApi.list();
        setStrategies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        notify({ title: 'Strategies unavailable', description: 'Failed to fetch strategy list', variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchStrategies();
  }, [notify]);

  const runtimeStrategies = useMemo(() => runtimeSnapshot.strategies ?? [], [runtimeSnapshot.strategies]);

  const resolveEnabled = useCallback(
    (strategy: Strategy) => runtimeStrategies.find((entry) => entry.id === strategy.id)?.enabled ?? strategy.enabled ?? false,
    [runtimeStrategies]
  );

  const toggleStrategy = async (strategy: Strategy) => {
    if (safeMode) return;
    try {
      setPendingId(strategy.id);
      const nextEnabled = !resolveEnabled(strategy);
      applyRuntimeIntent({ type: 'SET_STRATEGY_STATE', id: strategy.id, enabled: nextEnabled, source: 'strategies-page' });
      await strategiesApi.toggle({ id: strategy.id, enabled: nextEnabled });
      notify({
        title: `${strategy.name} ${nextEnabled ? 'enabled' : 'disabled'}`,
        description: nextEnabled ? 'Strategy handed execution privileges' : 'Strategy removed from execution stack',
        variant: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
      notify({ title: 'Toggle failed', description: 'Unable to sync with orchestration core', variant: 'error' });
    }
    setPendingId(null);
  };

  const statsSummary = useMemo(() => {
    const enabled = strategies.filter((s) => resolveEnabled(s));
    const avgWinRate =
      enabled.reduce((acc, strategy) => acc + (strategy.stats?.winRate ?? 0), 0) /
      Math.max(enabled.length, 1);
    const totalPnl = enabled.reduce((acc, strategy) => acc + (strategy.stats?.pnl ?? 0), 0);
    return { enabled: enabled.length, avgWinRate, totalPnl };
  }, [resolveEnabled, strategies]);
  const enabledCopy = loading ? 'SYNCING' : `${statsSummary.enabled} LIVE`;
  const enabledHint = loading ? 'Refreshing stack' : 'Execution ready';

  return (
    <TerminalShell className="stack-gap-lg w-full">
      <GlobalHeroBadge
        badge="STRATEGY CORE"
        metaText="EXECUTION STACK"
        title="Strategy Orchestration"
        description="Curate and choreograph the systems that deserve live capital."
        statusAdornment={
          <div>
            <MetricLabel className="text-[color:var(--accent-gold)]">Enabled</MetricLabel>
            <p className="text-lg font-semibold text-[color:var(--text-main)]">{enabledCopy}</p>
            <span className="status-indicator text-[color:var(--accent-green)]">{enabledHint}</span>
          </div>
        }
      />

      <section className="stack-gap-sm w-full">
        <header className="stack-gap-xxs w-full">
          <MetricLabel className="text-[color:var(--accent-gold)]">Strategy Control</MetricLabel>
          <div className="stack-gap-xxs max-w-3xl">
            <h2 className="text-3xl font-semibold leading-tight">Choreograph the execution fabric</h2>
            <p className="muted-premium">
              Apply capital only to disciplined systems. Toggle, audit, and export your stack within a single refined surface.
            </p>
          </div>
        </header>
      </section>

      <Card title="Summary" subtitle="Activated intelligence footprint">
        <div className="stack-gap-md">
          <div className="grid-premium sm:grid-cols-2 md:grid-cols-3">
            <SummaryStat label="Enabled" value={statsSummary.enabled.toString()} accent="var(--accent-green)" loading={loading} />
            <SummaryStat
              label="Avg Win"
              value={`${statsSummary.avgWinRate.toFixed(1)}%`}
              accent="var(--accent-gold)"
              loading={loading}
            />
            <SummaryStat
              label="PnL"
              value={`$${statsSummary.totalPnl.toLocaleString()}`}
              accent="var(--accent-violet)"
              loading={loading}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary">Export Report</Button>
            <Button>Optimize Stack</Button>
          </div>
        </div>
      </Card>

      <Card title="Strategy Stack" subtitle="Enable only what deserves capital">
        {loading && (
          <div className="grid-premium sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-36 w-full" />
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && strategies.length === 0 && (
          <p className="text-sm muted-premium">No strategies returned from the core.</p>
        )}
        {!loading && strategies.length > 0 && (
          <div className="grid-premium sm:grid-cols-2">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="data-soft-fade rounded-[0.75rem] border border-[color:var(--border-soft)] bg-base/70 p-5"
              >
                <div className="stack-gap-md">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[200px] flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-semibold">{strategy.name}</h4>
                        <Tag variant={resolveEnabled(strategy) ? 'success' : 'warning'}>
                          {resolveEnabled(strategy) ? 'Enabled' : 'Standby'}
                        </Tag>
                      </div>
                      <p className="text-sm muted-premium">{strategy.description}</p>
                    </div>
                    <button
                      onClick={() => toggleStrategy(strategy)}
                      className={`toggle-premium ${pendingId === strategy.id ? 'opacity-60' : ''}`}
                      data-enabled={resolveEnabled(strategy)}
                      aria-pressed={resolveEnabled(strategy)}
                      aria-label={`Toggle ${strategy.name}`}
                      disabled={pendingId === strategy.id || safeMode}
                    >
                      <span
                        className={`toggle-premium__thumb inline-block h-5 w-5 rounded-full bg-white shadow-card transition ${
                          strategy.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <dl className="grid-premium sm:grid-cols-3">
                    <div>
                      <MetricLabel as="dt">Win rate</MetricLabel>
                      <dd className="metric-value" data-variant="success">
                        {strategy.stats?.winRate ? `${strategy.stats.winRate.toFixed(1)}%` : '--'}
                      </dd>
                    </div>
                    <div>
                      <MetricLabel as="dt">PnL</MetricLabel>
                      <dd className="metric-value">
                        {strategy.stats?.pnl ? `$${strategy.stats.pnl.toLocaleString()}` : '--'}
                      </dd>
                    </div>
                    <div>
                      <MetricLabel as="dt">Sharpe</MetricLabel>
                      <dd className="metric-value">
                        {strategy.stats?.sharpe ? strategy.stats.sharpe.toFixed(2) : '--'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </TerminalShell>
  );
}

function SummaryStat({ label, value, accent, loading }: { label: string; value: string; accent: string; loading: boolean }) {
  return (
    <div className="stack-gap-xxs">
      <MetricLabel tone={accent}>{label}</MetricLabel>
      <p className="metric-value text-3xl" data-variant="muted">
        {loading ? <Skeleton className="h-8 w-24" /> : <span className="data-soft-fade">{value}</span>}
      </p>
    </div>
  );
}
