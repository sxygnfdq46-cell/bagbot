'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-provider';
import { adminApi, type AdminStrategy, type AdminUser, type SystemHealth, type AdminLogEntry } from '@/lib/api/admin';
import GlobalHeroBadge from '@/components/ui/global-hero-badge';
import MetricLabel from '@/components/ui/metric-label';
import TerminalShell from '@/components/ui/terminal-shell';
import { useRuntimeSnapshot } from '@/lib/runtime/use-runtime-snapshot';
import { applyRuntimeIntent } from '@/lib/runtime/runtime-intents';
import { getRuntimeAuditLog } from '@/lib/runtime/runtime-audit';

export default function AdminPage() {
  const safeModeStatus = 'PREVIEW';
  const safeModeHint = 'Mission control only';
  return (
    <TerminalShell className="stack-gap-lg">
      <GlobalHeroBadge
        badge="CONTROL"
        metaText="MISSION ASSURANCE"
        title="Admin Oversight"
        description="Mission assurance controls for system stability, posture, and overrides."
        statusAdornment={
          <div>
            <MetricLabel className="text-[color:var(--accent-gold)]">Safe Mode</MetricLabel>
            <p className="text-lg font-semibold text-[color:var(--text-main)]">{safeModeStatus}</p>
            <span className="status-indicator text-[color:var(--accent-gold)]">{safeModeHint}</span>
          </div>
        }
      />
      <section className="stack-gap-sm w-full">
        <header className="stack-gap-xxs w-full">
          <MetricLabel className="text-[color:var(--accent-gold)]">Admin Control</MetricLabel>
          <h2 className="text-3xl font-semibold leading-tight">Mission Assurance & Oversight</h2>
          <p className="muted-premium">
            Live intelligence on system stability, user posture, and neural integrity—all in one secured pane.
          </p>
        </header>
      </section>

      <div className="grid-premium lg:grid-cols-2">
        <SystemHealthPanel />
        <SafeModeController />
      </div>

      <div className="grid-premium lg:grid-cols-2">
        <UserManagementPanel />
        <StrategyControlPanel />
      </div>

      <div className="grid-premium lg:grid-cols-2">
        <SystemLogsPanel />
        <ConfigEditorPanel />
      </div>

      <div className="grid-premium lg:grid-cols-2">
        <AuditLogPanel />
      </div>
    </TerminalShell>
  );
}

function SystemHealthPanel() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();
  const { snapshot: runtimeSnapshot, loading: runtimeLoading } = useRuntimeSnapshot();
  const runtimeHealth = runtimeSnapshot.system.health;
  const displayHealth = (runtimeHealth as SystemHealth | null | undefined) ?? data;
  const isLoading = (loading || runtimeLoading) && !displayHealth;

  useEffect(() => {
    let mounted = true;
    adminApi
      .getSystemHealth()
      .then((response) => {
        if (mounted) {
          setData(response);
        }
      })
      .catch((error) => {
        notify({ title: 'Health monitor unavailable', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [notify]);

  return (
    <Card title="System Health" subtitle="Backend, engines, and runtime security">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      ) : displayHealth ? (
        <dl className="grid-premium text-sm sm:grid-cols-2">
          <InfoRow label="Uptime" value={displayHealth.uptime} />
          <InfoRow label="CPU Load" value={`${displayHealth.cpuLoad.toFixed?.(1) ?? displayHealth.cpuLoad}%`} />
          <InfoRow label="RAM Usage" value={`${displayHealth.ramUsage.toFixed?.(1) ?? displayHealth.ramUsage}%`} />
          <InfoRow label="Backend" value={displayHealth.backendStatus} accent />
          <InfoRow label="Brain Engine" value={displayHealth.brainStatus} accent />
        </dl>
      ) : (
        <p className="text-sm text-[color:var(--text-main)] opacity-60">Unable to fetch health metrics.</p>
      )}
    </Card>
  );
}

function UserManagementPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const { notify } = useToast();

  const fetchUsers = () => {
    setLoading(true);
    adminApi
      .getUsers()
      .then(setUsers)
      .catch((error) => {
        notify({ title: 'User fetch failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = (id: string, action: 'suspend' | 'activate') => {
    setPending(id + action);
    const request = action === 'suspend' ? adminApi.suspendUser(id) : adminApi.activateUser(id);
    request
      .then(() => {
        notify({ title: `User ${action}ed`, description: 'Change propagated to orchestration core', variant: 'success' });
        fetchUsers();
      })
      .catch((error) => {
        notify({ title: `Unable to ${action}`, description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setPending(null));
  };

  return (
    <Card title="User Management" subtitle="Enforce operator posture">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : users.length === 0 ? (
        <p className="text-sm text-[color:var(--text-main)] opacity-60">No users returned.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="data-soft-fade rounded-2xl border border-[color:var(--border-soft)] bg-base/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-[color:var(--text-main)] opacity-60">{user.email}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest ${user.status === 'suspended' ? 'text-red-400' : 'text-[color:var(--accent-green)]'}`}>
                  {user.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  className="w-full text-xs sm:w-auto"
                  onClick={() => handleAction(user.id, user.status === 'suspended' ? 'activate' : 'suspend')}
                  isLoading={pending === user.id + (user.status === 'suspended' ? 'activate' : 'suspend')}
                  loadingText="Updating..."
                >
                  {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full text-xs sm:w-auto"
                  onClick={() => notify({ title: 'Activity view', description: 'Audit feed will open in the next build.', variant: 'info' })}
                >
                  View Activity
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function StrategyControlPanel() {
  const [strategies, setStrategies] = useState<AdminStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [killPending, setKillPending] = useState(false);
  const { notify } = useToast();
  const { snapshot: runtimeSnapshot } = useRuntimeSnapshot();
  const safeMode = runtimeSnapshot.system.safeMode === true;
  const runtimeStrategies = runtimeSnapshot.strategies ?? [];

  const resolveEnabled = (strategy: AdminStrategy) =>
    runtimeStrategies.find((entry) => entry.id === strategy.id)?.enabled ?? strategy.enabled ?? false;

  const refresh = () => {
    setLoading(true);
    adminApi
      .getStrategies()
      .then(setStrategies)
      .catch((error) => {
        notify({ title: 'Strategy sync failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (strategy: AdminStrategy) => {
    if (safeMode) return;
    setPendingId(strategy.id);
    const nextEnabled = !resolveEnabled(strategy);
    applyRuntimeIntent({ type: 'SET_STRATEGY_STATE', id: strategy.id, enabled: nextEnabled, source: 'admin' });
    adminApi
      .toggleStrategy(strategy.id)
      .then(() => {
        notify({ title: `${strategy.name} toggled`, description: 'State synced with execution layer', variant: 'success' });
        refresh();
      })
      .catch((error) => {
        notify({ title: 'Toggle failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setPendingId(null));
  };

  const killAll = () => {
    if (!window.confirm('Disable all strategies?')) return;
    setKillPending(true);
    adminApi
      .killAllStrategies()
      .then(() => {
        notify({ title: 'Global kill executed', description: 'All strategies halted', variant: 'success' });
        refresh();
      })
      .catch((error) => {
        notify({ title: 'Kill switch failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setKillPending(false));
  };

  return (
    <Card title="Strategy Control" subtitle="Direct fusion of execution levers">
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={killAll}
          isLoading={killPending}
          loadingText="Halting..."
          className="w-full sm:w-auto"
        >
          Global Kill Switch
        </Button>
        <Button variant="ghost" onClick={refresh} className="w-full sm:w-auto">
          Refresh
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : strategies.length ? (
          strategies.map((strategy) => (
            <div key={strategy.id} className="data-soft-fade flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-base/70 px-4 py-3">
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold">{strategy.name}</p>
                <p className="text-xs text-[color:var(--text-main)] opacity-60">{strategy.description ?? '—'}</p>
              </div>
              <button
                className={`toggle-premium ${pendingId === strategy.id ? 'opacity-60' : ''}`}
                data-enabled={resolveEnabled(strategy)}
                onClick={() => toggle(strategy)}
                disabled={Boolean(pendingId) || safeMode}
                aria-pressed={resolveEnabled(strategy)}
              >
                <span
                  className={`toggle-premium__thumb inline-block h-5 w-5 rounded-full bg-white transition ${
                    resolveEnabled(strategy) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-[color:var(--text-main)] opacity-60">No strategies available.</p>
        )}
      </div>
    </Card>
  );
}

function SystemLogsPanel() {
  const { notify } = useToast();
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | AdminLogEntry['type']>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let warned = false;
    const load = async () => {
      try {
        const response = await adminApi.getLogs();
        if (!mounted) return;
        setLogs(response);
        setLoading(false);
        warned = false;
      } catch (error) {
        if (!mounted || warned) return;
        warned = true;
        notify({ title: 'Logs unavailable', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      }
    };
    load();
    const interval = setInterval(load, 4800);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [notify]);

  const filteredLogs = useMemo(
    () => logs.filter((log) => (filter === 'all' ? true : log.type === filter)),
    [logs, filter]
  );

  return (
    <Card title="System Logs" subtitle="Live events feed via secure channel">
      <div className="flex flex-wrap gap-2">
        {['all', 'info', 'warning', 'error'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type as typeof filter)}
            className={`flex-1 rounded-full px-3 py-2 text-xs uppercase tracking-[0.3em] transition sm:flex-none ${
              filter === type ? 'bg-[color:var(--accent-gold)] text-black' : 'border border-[color:var(--border-soft)] text-[color:var(--text-main)]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="no-scrollbar mt-4 max-h-64 space-y-3 overflow-y-auto pr-2">
        {loading ? (
          <p className="text-sm text-[color:var(--text-main)] opacity-60">Loading logs…</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-sm text-[color:var(--text-main)] opacity-60">Awaiting telemetry…</p>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`data-soft-fade rounded-2xl border px-4 py-3 text-sm ${
                log.type === 'error'
                  ? 'border-red-500/30 text-red-200'
                  : log.type === 'warning'
                  ? 'border-yellow-500/30 text-yellow-200'
                  : 'border-[color:var(--border-soft)] text-[color:var(--text-main)]'
              }`}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                <span>{log.type}</span>
                <span className="opacity-70">{log.timestamp}</span>
              </div>
              <p className="mt-2 text-sm">{log.message}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function AuditLogPanel() {
  const [records, setRecords] = useState(() => [...getRuntimeAuditLog()].reverse());

  useEffect(() => {
    const interval = setInterval(() => {
      setRecords([...getRuntimeAuditLog()].reverse());
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const hasRecords = records.length > 0;

  return (
    <Card title="Runtime Audit" subtitle="Read-only intents trail">
      {!hasRecords && <p className="text-sm text-[color:var(--text-main)] opacity-60">No actions recorded yet.</p>}
      {hasRecords && (
        <div className="no-scrollbar max-h-72 overflow-y-auto divide-y divide-[color:var(--border-soft)]">
          {records.map((record, index) => (
            <div key={`${record.timestamp}-${record.target}-${index}`} className="py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.3em] text-[color:var(--accent-cyan)]">
                <span>{record.intent}</span>
                <span className="opacity-70">{new Date(record.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-[color:var(--text-main)]">Target: {record.target}</p>
              <p className="text-[color:var(--text-main)] opacity-80">Value: {record.value}</p>
              <p className="text-[color:var(--text-main)] opacity-70">Source: {record.source}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SafeModeController() {
  const { notify } = useToast();
  const [pending, setPending] = useState<'activate' | 'deactivate' | null>(null);
  const { snapshot: runtimeSnapshot } = useRuntimeSnapshot();
  const safeMode = runtimeSnapshot.system.safeMode === true;

  const perform = (action: 'activate' | 'deactivate') => {
    if (action === 'activate' && !window.confirm('Activate Safe Mode?')) return;
    if (action === 'deactivate' && !window.confirm('Deactivate Safe Mode?')) return;
    setPending(action);
    try {
      applyRuntimeIntent({ type: 'SET_SAFE_MODE', enabled: action === 'activate', source: 'admin' });
      notify({ title: `Safe mode ${action}d`, description: 'Runtime flag updated', variant: 'success' });
    } catch (error) {
      notify({ title: 'Safe mode change failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
    } finally {
      const fallback = action === 'activate' ? adminApi.activateSafeMode() : adminApi.deactivateSafeMode();
      fallback.finally(() => setPending(null));
    }
  };

  return (
    <Card title="Safe Mode" subtitle="Contain blast radius instantly">
      <p className="text-sm text-[color:var(--text-main)] opacity-70">
        Safe mode halts execution pipelines and locks outbound orders.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          onClick={() => perform('activate')}
          isLoading={pending === 'activate'}
          disabled={safeMode}
          loadingText="Activating..."
          className="w-full sm:w-auto"
        >
          Activate
        </Button>
        <Button
          variant="secondary"
          onClick={() => perform('deactivate')}
          isLoading={pending === 'deactivate'}
          disabled={!safeMode}
          loadingText="Restoring..."
          className="w-full sm:w-auto"
        >
          Deactivate
        </Button>
      </div>
    </Card>
  );
}

function ConfigEditorPanel() {
  const { notify } = useToast();
  const [configText, setConfigText] = useState('{\n  "risk": "medium"\n}');
  const [pending, setPending] = useState(false);

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(configText), null, 2);
      setConfigText(formatted);
    } catch (error) {
      notify({ title: 'Invalid JSON', description: 'Please validate your config payload.', variant: 'error' });
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(configText);
      setPending(true);
      adminApi
        .updateConfig({ config: parsed })
        .then(() => {
          notify({ title: 'Config updated', description: 'Settings synced with control plane', variant: 'success' });
        })
        .catch((error) => {
          notify({ title: 'Config save failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
        })
        .finally(() => setPending(false));
    } catch (error) {
      notify({ title: 'Invalid JSON', description: 'Please validate your config payload.', variant: 'error' });
    }
  };

  return (
    <Card title="Config Editor" subtitle="Push curated JSON directly to the brain">
      <textarea
        value={configText}
        onChange={(event) => setConfigText(event.target.value)}
        className="field-premium min-h-[200px] font-mono text-sm"
      />
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <Button variant="secondary" onClick={handleFormat} className="w-full sm:w-auto">
          Format
        </Button>
        <Button onClick={handleSave} isLoading={pending} loadingText="Saving..." className="w-full sm:w-auto">
          Save Config
        </Button>
      </div>
    </Card>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] opacity-60">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${accent ? 'text-[color:var(--accent-green)]' : ''}`}>{value}</p>
    </div>
  );
}
