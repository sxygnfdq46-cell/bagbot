'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import Skeleton from '@/components/ui/skeleton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useToast } from '@/components/ui/toast-provider';
import { adminApi, type AdminStrategy, type AdminUser, type SystemHealth } from '@/lib/api/admin';
import { wsClient } from '@/lib/ws-client';
import GlobalHero from '@/components/ui/global-hero';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div className="stack-gap-lg">
        <GlobalHero description="Mission assurance controls for system stability, posture, and overrides." />
        <header className="stack-gap-xxs">
          <p className="metric-label text-[color:var(--accent-gold)]">Admin Control</p>
          <h1 className="page-title text-3xl font-semibold">Mission Assurance & Oversight</h1>
          <p className="muted-premium">
            Live intelligence on system stability, user posture, and neural integrity—all in one secured pane.
          </p>
        </header>

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
      </div>
    </ProtectedRoute>
  );
}

function SystemHealthPanel() {
  const [data, setData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useToast();

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
      {loading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      ) : data ? (
        <dl className="grid-premium text-sm sm:grid-cols-2">
          <InfoRow label="Uptime" value={data.uptime} />
          <InfoRow label="CPU Load" value={`${data.cpuLoad.toFixed?.(1) ?? data.cpuLoad}%`} />
          <InfoRow label="RAM Usage" value={`${data.ramUsage.toFixed?.(1) ?? data.ramUsage}%`} />
          <InfoRow label="Backend" value={data.backendStatus} accent />
          <InfoRow label="Brain Engine" value={data.brainStatus} accent />
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
    setPendingId(strategy.id);
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
                data-enabled={strategy.enabled}
                onClick={() => toggle(strategy)}
                disabled={Boolean(pendingId)}
                aria-pressed={strategy.enabled}
              >
                <span
                  className={`toggle-premium__thumb inline-block h-5 w-5 rounded-full bg-white transition ${
                    strategy.enabled ? 'translate-x-6' : 'translate-x-1'
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

type LogEntry = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
};

function SystemLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | LogEntry['type']>('all');

  useEffect(() => {
    const unsubscribe = wsClient.subscribe('logs', (payload) => {
      const normalized = normalizeLog(payload);
      if (!normalized) return;
      setLogs((prev) => [normalized, ...prev].slice(0, 40));
    });
    return () => {
      unsubscribe();
    };
  }, []);

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
        {filteredLogs.length === 0 ? (
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

const normalizeLog = (payload: unknown): LogEntry | null => {
  if (!payload || typeof payload !== 'object') return null;
  const source = payload as Record<string, unknown>;
  const type = typeof source.type === 'string' ? (source.type.toLowerCase() as LogEntry['type']) : 'info';
  const message = typeof source.message === 'string' ? source.message : JSON.stringify(source);
  const timestamp = typeof source.timestamp === 'string' ? source.timestamp : new Date().toLocaleTimeString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: ['info', 'warning', 'error'].includes(type) ? type : 'info',
    message,
    timestamp
  };
};

function SafeModeController() {
  const { notify } = useToast();
  const [pending, setPending] = useState<'activate' | 'deactivate' | null>(null);

  const perform = (action: 'activate' | 'deactivate') => {
    setPending(action);
    const request = action === 'activate' ? adminApi.activateSafeMode() : adminApi.deactivateSafeMode();
    request
      .then(() => {
        notify({ title: `Safe mode ${action}d`, description: 'State replicated across nodes', variant: 'success' });
      })
      .catch((error) => {
        notify({ title: 'Safe mode change failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'error' });
      })
      .finally(() => setPending(null));
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
          loadingText="Activating..."
          className="w-full sm:w-auto"
        >
          Activate
        </Button>
        <Button
          variant="secondary"
          onClick={() => perform('deactivate')}
          isLoading={pending === 'deactivate'}
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
