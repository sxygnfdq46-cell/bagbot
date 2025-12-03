'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { strategies as strategiesApi, type Strategy } from '@/lib/api/strategies';
import { useToast } from '@/components/ui/toast-provider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Tag from '@/components/ui/tag';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { notify } = useToast();

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

  const toggleStrategy = async (strategy: Strategy) => {
    try {
      setPendingId(strategy.id);
      setStrategies((prev) => prev.map((item) => (item.id === strategy.id ? { ...item, enabled: !item.enabled } : item)));
      await strategiesApi.toggle({ id: strategy.id, enabled: !strategy.enabled });
      notify({
        title: `${strategy.name} ${strategy.enabled ? 'disabled' : 'enabled'}`,
        description: strategy.enabled ? 'Strategy removed from execution stack' : 'Strategy handed execution privileges',
        variant: 'success'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toggle failed');
      setStrategies((prev) => prev.map((item) => (item.id === strategy.id ? { ...item, enabled: strategy.enabled } : item)));
      notify({ title: 'Toggle failed', description: 'Unable to sync with orchestration core', variant: 'error' });
    }
    setPendingId(null);
  };

  const statsSummary = useMemo(() => {
    const enabled = strategies.filter((s) => s.enabled);
    const avgWinRate =
      enabled.reduce((acc, strategy) => acc + (strategy.stats?.winRate ?? 0), 0) /
      Math.max(enabled.length, 1);
    const totalPnl = enabled.reduce((acc, strategy) => acc + (strategy.stats?.pnl ?? 0), 0);
    return { enabled: enabled.length, avgWinRate, totalPnl };
  }, [strategies]);

  return (
    <ProtectedRoute>
      <div className="stack-gap-lg">
        <GlobalHeroBadge
          badge="STRATEGY CORE"
          metaText="EXECUTION STACK"
          title="Strategy Orchestration"
          description="Curate and choreograph the systems that deserve live capital."
          statusLabel="Enabled"
          statusValue={loading ? 'Syncing' : `${statsSummary.enabled}`}
        />
        <div className="stack-gap-xxs">
          <p className="metric-label text-[color:var(--accent-gold)]">Strategy Control</p>
          <div className="stack-gap-xxs">
            <h1 className="text-3xl font-semibold">Choreograph the execution fabric</h1>
            <p className="muted-premium max-w-2xl">
              Apply capital only to disciplined systems. Toggle, audit, and export your stack within a single refined surface.
            </p>
          </div>
        </div>

        <Card title="Summary" subtitle="Activated intelligence footprint">
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary">Export Report</Button>
            <Button>Optimize Stack</Button>
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
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-[200px] flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-xl font-semibold">{strategy.name}</h4>
                        <Tag variant={strategy.enabled ? 'success' : 'warning'}>
                          {strategy.enabled ? 'Enabled' : 'Standby'}
                        </Tag>
                      </div>
                      <p className="text-sm muted-premium">{strategy.description}</p>
                    </div>
                    <button
                      onClick={() => toggleStrategy(strategy)}
                      className={`toggle-premium ${pendingId === strategy.id ? 'opacity-60' : ''}`}
                      data-enabled={strategy.enabled}
                      aria-pressed={strategy.enabled}
                      aria-label={`Toggle ${strategy.name}`}
                      disabled={pendingId === strategy.id}
                    >
                      <span
                        className={`toggle-premium__thumb inline-block h-5 w-5 rounded-full bg-white shadow-card transition ${
                          strategy.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <dl className="mt-5 grid-premium sm:grid-cols-3">
                    <div>
                      <dt className="metric-label">Win rate</dt>
                      <dd className="metric-value" data-variant="success">
                        {strategy.stats?.winRate ? `${strategy.stats.winRate.toFixed(1)}%` : '--'}
                      </dd>
                    </div>
                    <div>
                      <dt className="metric-label">PnL</dt>
                      <dd className="metric-value">
                        {strategy.stats?.pnl ? `$${strategy.stats.pnl.toLocaleString()}` : '--'}
                      </dd>
                    </div>
                    <div>
                      <dt className="metric-label">Sharpe</dt>
                      <dd className="metric-value">
                        {strategy.stats?.sharpe ? strategy.stats.sharpe.toFixed(2) : '--'}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}

function SummaryStat({ label, value, accent, loading }: { label: string; value: string; accent: string; loading: boolean }) {
  return (
    <div className="stack-gap-xxs">
      <p className="metric-label" style={{ color: accent }}>
        {label}
      </p>
      <p className="metric-value text-3xl" data-variant="muted">
        {loading ? <Skeleton className="h-8 w-24" /> : <span className="data-soft-fade">{value}</span>}
      </p>
    </div>
  );
}
